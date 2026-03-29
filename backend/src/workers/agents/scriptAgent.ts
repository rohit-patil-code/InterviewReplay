import { BaseAgent } from "./baseAgent";
import { SandboxRunner } from "../executors/sandboxRunner";
import { generateArrayScriptPrompt } from "../prompts/arrayPrompt";
import { generateTreeScriptPrompt } from "../prompts/treePrompt";
import { generateGraphScriptPrompt } from "../prompts/graphPrompt";
import { generateLinkedListScriptPrompt } from "../prompts/linkedListPrompt";
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ScriptAgentResult {
    generationSchema: any;
    inputGenerationScript: string;
    sampleInputPayload: string;
}

export class ScriptAgent extends BaseAgent {
    constructor() {
        super(undefined, "You are an expert backend engineer who writes highly robust deterministic Node.js test-case generation scripts.");
    }

    async generateAndVerifyScript(description: string, workingDirectory: string): Promise<ScriptAgentResult> {
        // Phase 1: Classification (Groq)
        console.log(`[ScriptAgent] Phase 1: Classification...`);
        const classificationPrompt = `
Analyze the following algorithmic problem description.
Identify the primary data structure of the input required.
Strictly restricted to "array", "tree", "graph", or "linkedlist". If it is simple integers, strings or multiple basic variables, classify as "array".
Also identify 'num_inputs' (integer).

Output a strict JSON object: {"num_inputs": number, "main_structure": "array" | "tree" | "graph" | "linkedlist"}

PROBLEM DESCRIPTION:
"""
${description}
"""`;
        
        const classificationValidation = (parsed: any) => {
            if (typeof parsed.num_inputs !== 'number') throw new Error("JSON missing 'num_inputs' integer.");
            const valid = ["array", "tree", "graph", "linkedlist"];
            if (!valid.includes(parsed.main_structure)) throw new Error("JSON 'main_structure' must be one of: array, tree, graph, linkedlist.");
        };

        let classResponse = await this.generateWithReflection(classificationPrompt, 2, true, classificationValidation);
        let classification = JSON.parse(classResponse);

        // Phase 2: Base Script Generation (Groq)
        console.log(`[ScriptAgent] Phase 2: Base Script Generation for ${classification.main_structure}...`);
        let basePrompt = "";
        switch (classification.main_structure) {
            case "tree": basePrompt = generateTreeScriptPrompt(description); break;
            case "graph": basePrompt = generateGraphScriptPrompt(description); break;
            case "linkedlist": basePrompt = generateLinkedListScriptPrompt(description); break;
            default: basePrompt = generateArrayScriptPrompt(description); break;
        }

        const baseValidation = (parsed: any) => {
            if (!parsed.generation_schema) throw new Error("JSON missing required 'generation_schema' key.");
            if (!parsed.input_generation_script || typeof parsed.input_generation_script !== 'string') throw new Error("JSON missing required 'input_generation_script' string inside object.");
        };

        let baseResponse = await this.generateWithReflection(basePrompt, 2, true, baseValidation);
        let baseParsed = JSON.parse(baseResponse);
        let currentScript = this.stripMarkdownBlocks(baseParsed.input_generation_script);

        const MAX_GROQ_REPAIRS = 3;
        let attempt = 0;
        let baseExecutionSucceeded = false;

        while (attempt < MAX_GROQ_REPAIRS && !baseExecutionSucceeded) {
            try {
                await fs.rm(path.join(workingDirectory, `input_100.txt`), { force: true }).catch(() => { });

                console.log(`[ScriptAgent] Executing base script attempt ${attempt + 1}...`);
                const { stderr } = await SandboxRunner.executeNodeScript(currentScript, 8000, workingDirectory);
                if (stderr) console.warn(`[ScriptAgent] Execution produced STDERR: ${stderr}`);

                // Verify input_100.txt exists
                const filePath = path.join(workingDirectory, `input_100.txt`);
                await fs.access(filePath);

                baseExecutionSucceeded = true;
            } catch (executionError: any) {
                console.error(`[ScriptAgent] Base Execution failed: ${executionError.message}`);
                attempt++;
                if (attempt >= MAX_GROQ_REPAIRS) {
                    throw new Error(`ScriptAgent (Groq generation) failed after ${MAX_GROQ_REPAIRS} attempts. Aborting.`);
                }
                const repairPrompt = `The loop broke or the script failed. Fix it.\nERROR: ${executionError.message}\nSCRIPT:\n${currentScript}\nOutput strict JSON with 'generation_schema' and 'input_generation_script'.`;
                let repairResponse = await this.generateWithReflection(repairPrompt, 1, true, baseValidation);
                let repairParsed = JSON.parse(repairResponse);
                currentScript = this.stripMarkdownBlocks(repairParsed.input_generation_script);
            }
        }

        const baseFilePath = path.join(workingDirectory, 'input_100.txt');
        const baseOutput = await fs.readFile(baseFilePath, 'utf-8');

        // Phase 3: Verification & Scaling (Gemini)
        console.log(`[ScriptAgent] Phase 3: Logical Verification & Scaling...`);
        const verificationPrompt = `
You are an algorithmic test verification system.
Does this Node.js script correctly generate an input of size 100 for the problem?

PROBLEM DESCRIPTION:
"""
${description}
"""

NODE.JS SCRIPT:
"""
${currentScript}
"""

GENERATED OUTPUT:
"""
${baseOutput.substring(0, 5000)}
"""

If logically correct, return is_logically_correct: true.
If incorrect (e.g., output violates constraints, array not length 100, trees are invalid, incorrect types), identify the flaw.
Output a strict JSON object: {"is_logically_correct": boolean, "feedback": "string explaining reasoning"}
`;

        const verifyValidation = (parsed: any) => {
            if (typeof parsed.is_logically_correct !== 'boolean') throw new Error("Missing 'is_logically_correct' boolean.");
            if (!parsed.is_logically_correct && !parsed.feedback) throw new Error("Missing 'feedback' when not correct.");
        };
        let verifyResponse = await this.generateWithReflection(verificationPrompt, 2, true, verifyValidation);
        let verifyData = JSON.parse(verifyResponse);

        const scalePrompt = `
You are an expert backend test scalability engineer.
Your task is to rewrite the provided generator script to scale it from producing 1 test case to exactly 15 massive test cases (input_1.txt to input_15.txt).

${verifyData.is_logically_correct ? 
"The base logic is correct. Scale it up." : 
"The base logic had mathematically flaws. Fix them based on this feedback:\n" + verifyData.feedback}

SCALING DIRECTIVE:
Rewrite the loop or execution body. Instead of just size 100 for 'input_100.txt', you MUST generate 15 test cases written to 'input_1.txt' through 'input_15.txt'.
For cases 1 to 5, use smaller bounding rules.
For cases 6 to 15, aggressively use massive boundary limits (e.g. 10000 to 100000 length arrays/strings) to test Time Limit Exceeded (TLE) constraints!
Write the file natively using \`const filePath = path.join(process.cwd(), 'input_' + i + '.txt');\`
Output a strict JSON object containing: {"scaled_script": "the newly rewritten raw Node.js script"}

ORIGINAL SCRIPT:
"""
${currentScript}
"""
`;

        const scaleValidation = (parsed: any) => {
            if (!parsed.scaled_script || typeof parsed.scaled_script !== 'string') throw new Error("Missing 'scaled_script'.");
        };
        let scaleResponse = await this.generateWithReflection(scalePrompt, 2, true, scaleValidation);
        let scaleData = JSON.parse(scaleResponse);
        let scaledScript = this.stripMarkdownBlocks(scaleData.scaled_script);

        // Phase 4: Final Execution (Sandbox)
        console.log(`[ScriptAgent] Phase 4: Final Execution...`);
        let finalAttempt = 0;
        let finalExecutionSucceeded = false;
        
        while (finalAttempt < 3 && !finalExecutionSucceeded) {
            try {
                for (let i = 1; i <= 15; i++) {
                    await fs.rm(path.join(workingDirectory, `input_${i}.txt`), { force: true }).catch(() => { });
                }

                console.log(`[ScriptAgent] Executing final scaled script attempt ${finalAttempt + 1}...`);
                const { stderr } = await SandboxRunner.executeNodeScript(scaledScript, 3000, workingDirectory);
                if (stderr) console.warn(`[ScriptAgent] Final Execution STDERR: ${stderr}`);

                for (let i = 1; i <= 15; i++) {
                    try {
                        await fs.access(path.join(workingDirectory, `input_${i}.txt`));
                    } catch (e) {
                        throw new Error(`File input_${i}.txt was not created on disk.`);
                    }
                }
                finalExecutionSucceeded = true;
            } catch (executionError: any) {
                console.error(`[ScriptAgent] Final Execution failed: ${executionError.message}`);
                finalAttempt++;
                if (finalAttempt >= 3) {
                    throw new Error(`ScriptAgent final execution failed after 3 attempts. Last error: ${executionError.message}`);
                }
                const finalRepairPrompt = `
The scaled script failed to run or generate all 15 files. 
ERROR: ${executionError.message}
SCRIPT:
${scaledScript}
Fix it and return JSON {"scaled_script": "fixed raw Node.js script"}`;
                let repairResponse = await this.generateWithReflection(finalRepairPrompt, 1, true, scaleValidation);
                let repairData = JSON.parse(repairResponse);
                scaledScript = this.stripMarkdownBlocks(repairData.scaled_script);
            }
        }

        let sampleInput = "";
        try {
            const testFilePath = path.join(workingDirectory, 'input_1.txt');
            sampleInput = await fs.readFile(testFilePath, 'utf-8');
            if (sampleInput.length > 2000) {
                sampleInput = sampleInput.substring(0, 2000) + "\n...[TRUNCATED]";
            }
        } catch (err) {
            sampleInput = "Error: Could not read sample input file.";
        }

        console.log(`[ScriptAgent] Pipeline completely finished.`);
        return {
            generationSchema: baseParsed.generation_schema,
            inputGenerationScript: scaledScript,
            sampleInputPayload: sampleInput
        };
    }

    private stripMarkdownBlocks(text: string): string {
        let clean = text.trim();
        if (clean.startsWith('```json')) clean = clean.replace(/^```json\n?/, '');
        else if (clean.startsWith('```javascript')) clean = clean.replace(/^```javascript\n?/, '');
        else if (clean.startsWith('```js')) clean = clean.replace(/^```js\n?/, '');
        else if (clean.startsWith('```')) clean = clean.replace(/^```\n?/, '');
        if (clean.endsWith('```')) clean = clean.replace(/```\n?$/, '');
        return clean.trim();
    }
}
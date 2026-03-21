import { BaseAgent } from "./baseAgent";
import { SandboxRunner } from "../executors/sandboxRunner";
import { generateTestCasesScriptPrompt } from "../prompts/scriptPrompts";
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ScriptAgentResult {
    generationSchema: any;
    inputGenerationScript: string;
    sampleInputPayload: string;
}

export class ScriptAgent extends BaseAgent {
    constructor() {
        // We use llama-3.3-70b-versatile as the default model via BaseAgent
        super(undefined, "You are an expert backend engineer who writes highly robust deterministic Node.js test-case generation scripts.");
    }

    /**
     * Executes the LLM 1 (Generation) -> SandboxRunner (Execution) -> LLM 2 (Data Verification) pipeline.
     */
    async generateAndVerifyScript(description: string, workingDirectory: string): Promise<ScriptAgentResult> {
        // 1. LLM 1: Initial Script Generation
        const initialPrompt = generateTestCasesScriptPrompt(description);
        let currentResponse = await this.generateWithReflection(initialPrompt, 1, true);

        let parsedData = JSON.parse(currentResponse);
        let currentScript = parsedData.input_generation_script;
        currentScript = this.stripMarkdownBlocks(currentScript);

        const MAX_REPAIRS = 3;
        let attempt = 0;
        let executionSucceeded = false;

        // 2. Execution Loop: Ensure the script runs without crashing first
        while (attempt < MAX_REPAIRS && !executionSucceeded) {
            try {
                console.log(`[ScriptAgent] Executing script attempt ${attempt + 1}...`);
                const { stdout, stderr } = await SandboxRunner.executeNodeScript(currentScript, 8000, workingDirectory);

                if (stderr) {
                    console.warn(`[ScriptAgent] Execution completed but produced STDERR: ${stderr}`);
                }

                // If it didn't throw, the script ran successfully
                executionSucceeded = true;
            } catch (executionError: any) {
                console.error(`[ScriptAgent] Execution failed: ${executionError.message}`);
                attempt++;

                if (attempt >= MAX_REPAIRS) {
                    throw new Error(`ScriptAgent failed to generate a runnable script after ${MAX_REPAIRS} attempts.`);
                }

                // Repair a syntax/runtime crash
                console.log(`[ScriptAgent] Requesting LLM to repair the crashed script...`);
                const repairPrompt = `
The Node.js script failed during execution. Fix the code.
ERROR: ${executionError.message}
SCRIPT: 
${currentScript}
Return ONLY the raw fixed code.`;

                currentScript = await this.generateWithReflection(repairPrompt, 1, false);
                currentScript = this.stripMarkdownBlocks(currentScript);
            }
        }

        // 3. Output Extraction: Read the generated file to see WHAT the script actually made
        let sampleInput = "";
        try {
            // NOTE: Change 'input_1.txt' if your prompt instructs the LLM to name it something else (like 'input_test.txt')
            const testFilePath = path.join(workingDirectory, 'input_1.txt');
            sampleInput = await fs.readFile(testFilePath, 'utf-8');

            // Truncate to save tokens just in case the generated array is massive
            if (sampleInput.length > 2000) {
                sampleInput = sampleInput.substring(0, 2000) + "\n...[TRUNCATED]";
            }
        } catch (err) {
            sampleInput = "Error: Could not read sample input file. The script ran, but did not write to the expected file.";
        }

        // 4. LLM 2: Logical Verification and Type Checking
        console.log(`[ScriptAgent] Requesting LLM 2 to verify the logical correctness of the generated inputs...`);
        const verificationPrompt = `
You are an expert QA engineer validating test-case generation scripts.
The following Node.js script was executed and successfully generated a sample output file.

PROBLEM DESCRIPTION:
"""
${description}
"""

CURRENT SCRIPT:
"""javascript
${currentScript}
"""

SAMPLE OUTPUT EXTRACTED FROM DISK:
"""
${sampleInput}
"""

Your task:
1. Verify that the SAMPLE OUTPUT precisely matches the constraints and expected data types.
2. Look out for critical type errors! For example, if the problem requires an array of integers, ensure the output isn't an array of strings (e.g., ["10", "15"]).
3. If the output format or data types are flawed, FIX the Javascript script to correct it.
4. If the script is fully correct and the output format is perfect, return the exact original script.

Return ONLY the final, correct raw Node.js script. DO NOT WRAP IT IN MARKDOWN OR EXPLANATIONS.
`;

        let finalScript = await this.generateWithReflection(verificationPrompt, 1, false);
        finalScript = this.stripMarkdownBlocks(finalScript);

        // 5. Return the validated script
        return {
            generationSchema: parsedData.generation_schema,
            inputGenerationScript: finalScript,
            sampleInputPayload: sampleInput
        };
    }

    private stripMarkdownBlocks(text: string): string {
        let clean = text.trim();
        if (clean.startsWith('```javascript')) clean = clean.replace(/^```javascript\n?/, '');
        else if (clean.startsWith('```js')) clean = clean.replace(/^```js\n?/, '');
        else if (clean.startsWith('```')) clean = clean.replace(/^```\n?/, '');

        if (clean.endsWith('```')) clean = clean.replace(/```\n?$/, '');
        return clean.trim();
    }
}
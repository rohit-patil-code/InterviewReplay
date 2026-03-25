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
        super(undefined, "You are an expert backend engineer who writes highly robust deterministic Node.js test-case generation scripts.");
    }

    async generateAndVerifyScript(description: string, workingDirectory: string): Promise<ScriptAgentResult> {
        const initialPrompt = generateTestCasesScriptPrompt(description);
        let currentResponse = await this.generateWithReflection(initialPrompt, 1, true);

        let parsedData = JSON.parse(currentResponse);
        let currentScript = parsedData.input_generation_script;
        currentScript = this.stripMarkdownBlocks(currentScript);

        const MAX_REPAIRS = 3;
        let attempt = 0;
        let executionSucceeded = false;

        while (attempt < MAX_REPAIRS && !executionSucceeded) {
            try {
                console.log(`[ScriptAgent] Executing script attempt ${attempt + 1}...`);
                const { stdout, stderr } = await SandboxRunner.executeNodeScript(currentScript, 8000, workingDirectory);

                if (stderr) {
                    console.warn(`[ScriptAgent] Execution completed but produced STDERR: ${stderr}`);
                }

                // VERIFICATION: Check if all 15 input files exist
                for (let i = 1; i <= 15; i++) {
                    const filePath = path.join(workingDirectory, `input_${i}.txt`);
                    try {
                        await fs.access(filePath);
                    } catch (e) {
                        throw new Error(`Execution finished but input_${i}.txt was not created on disk. Ensure your script writes exactly 15 files from input_1.txt to input_15.txt.`);
                    }
                }

                executionSucceeded = true;
            } catch (executionError: any) {
                console.error(`[ScriptAgent] Execution failed: ${executionError.message}`);
                attempt++;

                if (attempt >= MAX_REPAIRS) {
                    throw new Error(`ScriptAgent failed after ${MAX_REPAIRS} attempts. Last error: ${executionError.message}`);
                }

                console.log(`[ScriptAgent] Requesting LLM to repair the crashed script...`);
                const repairPrompt = `
The generator script failed. Fix it.
ERROR: ${executionError.message}
SCRIPT: 
${currentScript}
Return ONLY fixed raw JS.`;

                currentScript = await this.generateWithReflection(repairPrompt, 1, false);
                currentScript = this.stripMarkdownBlocks(currentScript);
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

        return {
            generationSchema: parsedData.generation_schema,
            inputGenerationScript: currentScript,
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
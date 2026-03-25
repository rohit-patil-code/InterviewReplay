import { BaseAgent } from "./baseAgent";
import { SandboxRunner } from "../executors/sandboxRunner";
import { generateSolutionPrompt } from "../prompts/solutionPrompts";
import * as fs from 'fs/promises';
import * as path from 'path';

export interface SolutionAgentResult {
    starterCode: any;
    solutionScript: string;
    computedResults: string;
}

export class SolutionAgent extends BaseAgent {
    constructor() {
        super(undefined, "You are an expert algorithms engineer who writes highly robust optimal and brute-force solution scripts.");
    }

    async generateAndVerifySolution(description: string, generationSchema: string, workingDirectory: string, sampleInputPayload: string): Promise<SolutionAgentResult> {
        const initialPrompt = generateSolutionPrompt(description, generationSchema, sampleInputPayload);
        let currentResponse = await this.generateWithReflection(initialPrompt, 1, true);
        const parsedData = JSON.parse(currentResponse);
        let currentScript = parsedData.solution_script;

        const MAX_REPAIRS = 3;
        let attempt = 0;

        while (attempt < MAX_REPAIRS) {
            try {
                console.log(`[SolutionAgent] Executing solution script attempt ${attempt + 1}...`);
                const { stdout, stderr } = await SandboxRunner.executeNodeScript(currentScript, 10000, workingDirectory);

                if (stderr) {
                    console.warn(`[SolutionAgent] Execution completed but produced STDERR: ${stderr}`);
                }

                // VERIFICATION: Check if all 15 output files exist
                for (let i = 1; i <= 15; i++) {
                    const filePath = path.join(workingDirectory, `output_${i}.txt`);
                    try {
                        await fs.access(filePath);
                    } catch (e) {
                        throw new Error(`Execution finished but output_${i}.txt was not created on disk. Ensure your script writes exactly 15 files from output_1.txt to output_15.txt.`);
                    }
                }

                return {
                    starterCode: parsedData.starter_code,
                    solutionScript: currentScript,
                    computedResults: stdout
                };
            } catch (executionError: any) {
                console.error(`[SolutionAgent] Execution failed: ${executionError.message}`);
                attempt++;
                if (attempt >= MAX_REPAIRS) {
                    throw new Error(`SolutionAgent failed after ${MAX_REPAIRS} attempts. Last error: ${executionError.message}`);
                }

                console.log(`[SolutionAgent] Requesting LLM 6 to repair the crashed script...`);
                const repairPrompt = `
The solution script failed. Fix it.
ERROR: ${executionError.message}
SCRIPT: 
${currentScript}
Return ONLY fixed raw JS.`;

                currentScript = await this.generateWithReflection(repairPrompt, 1, false);
                currentScript = this.stripMarkdownBlocks(currentScript);
            }
        }
        throw new Error("Unexpected end of SolutionAgent loop.");
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

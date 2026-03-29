import { BaseAgent } from "./baseAgent";
import { SandboxRunner } from "../executors/sandboxRunner";
import { generateSolutionPrompt } from "../prompts/solutionPrompts";
import * as fs from 'fs/promises';
import * as path from 'path';

export interface SolutionAgentResult {
    starterCode: any;
    bruteforceScript: string;
    solutionScript: string;
    computedResults: string;
}

export class SolutionAgent extends BaseAgent {
    constructor() {
        super(undefined, "You are an expert algorithms engineer who writes highly robust optimal and brute-force solution scripts.");
    }

    async generateAndVerifySolution(description: string, generationSchema: string, workingDirectory: string, sampleInputPayload: string): Promise<SolutionAgentResult> {
        const initialPrompt = generateSolutionPrompt(description, generationSchema, sampleInputPayload);
        
        const validationFn = (parsed: any) => {
            if (!parsed.starter_code) throw new Error("JSON missing required 'starter_code' key.");
            if (!parsed.bruteforce_script || typeof parsed.bruteforce_script !== 'string') throw new Error("JSON missing required 'bruteforce_script' string.");
            if (!parsed.optimal_script || typeof parsed.optimal_script !== 'string') throw new Error("JSON missing required 'optimal_script' string.");
        };

        let currentResponse = await this.generateWithReflection(initialPrompt, 2, true, validationFn);
        let parsedData = JSON.parse(currentResponse);
        let currentBruteforceScript = this.stripMarkdownBlocks(parsedData.bruteforce_script);
        let currentOptimalScript = this.stripMarkdownBlocks(parsedData.optimal_script);

        const MAX_REPAIRS = 4;
        let attempt = 0;

        while (attempt < MAX_REPAIRS) {
            try {
                // CLEANUP previous outputs
                for(let i=1; i<=15; i++) {
                    await fs.rm(path.join(workingDirectory, `output_${i}.txt`), {force: true}).catch(()=>{});
                    await fs.rm(path.join(workingDirectory, `bf_output_${i}.txt`), {force: true}).catch(()=>{});
                }

                console.log(`[SolutionAgent] Executing Bruteforce script attempt ${attempt + 1}...`);
                const bfResult = await SandboxRunner.executeNodeScript(currentBruteforceScript, 3000, workingDirectory);
                if (bfResult.stderr) console.warn(`[SolutionAgent] Bruteforce STDERR: ${bfResult.stderr}`);

                console.log(`[SolutionAgent] Executing Optimal script attempt ${attempt + 1}...`);
                const optResult = await SandboxRunner.executeNodeScript(currentOptimalScript, 3000, workingDirectory);
                if (optResult.stderr) console.warn(`[SolutionAgent] Optimal STDERR: ${optResult.stderr}`);

                // VERIFICATION: Dual-Solver Match Check on Inputs 1-5
                for (let i = 1; i <= 5; i++) {
                    const bfPath = path.join(workingDirectory, `bf_output_${i}.txt`);
                    const optPath = path.join(workingDirectory, `output_${i}.txt`);
                    
                    const bfOut = await fs.readFile(bfPath, 'utf8').catch(() => null);
                    const optOut = await fs.readFile(optPath, 'utf8').catch(() => null);

                    if (bfOut === null) throw new Error(`Bruteforce failed to write bf_output_${i}.txt.`);
                    if (optOut === null) throw new Error(`Optimal failed to write output_${i}.txt.`);

                    if (bfOut.trim() !== optOut.trim()) {
                        throw new Error(`Dual-Solver Mismatch on Input ${i}!\nBrute-force output:\n${bfOut.substring(0, 500)}\nOptimal output:\n${optOut.substring(0, 500)}\nThe logic in the optimal script is likely flawed.`);
                    }
                }

                // VERIFICATION: Check Large Output generation 6-15
                for (let i = 6; i <= 15; i++) {
                    try {
                        await fs.access(path.join(workingDirectory, `output_${i}.txt`));
                    } catch (e) {
                        throw new Error(`Optimal Script finished but output_${i}.txt was not created on disk.`);
                    }
                }

                return {
                    starterCode: parsedData.starter_code,
                    bruteforceScript: currentBruteforceScript,
                    solutionScript: currentOptimalScript,
                    computedResults: optResult.stdout
                };
            } catch (executionError: any) {
                console.error(`[SolutionAgent] Execution/Verification failed: ${executionError.message}`);
                attempt++;
                if (attempt >= MAX_REPAIRS) {
                    throw new Error(`SolutionAgent failed after ${MAX_REPAIRS} attempts. Last error: ${executionError.message}`);
                }

                console.log(`[SolutionAgent] Requesting LLM to repair the crashed or mismatched logic...`);
                // Reflect back with a valid JSON request that requires all three keys.
                const repairPrompt = `
${initialPrompt}

=================================
PREVIOUS Node.js SCRIPTS FAILED EXECUTION OR MISMATCHED:
ERROR TRACE:
${executionError.message}

Please critically analyze the error and return ONLY a strict JSON object with 'starter_code', 'bruteforce_script', and 'optimal_script' containing the fixed versions.
Return ONLY the strict JSON object as requested with all 3 keys: 'starter_code', 'bruteforce_script', and 'optimal_script'.
CRITICAL: Both scripts MUST be raw, valid Node.js (JavaScript) scripts. DO NOT write Python or any other language. DO NOT wrap with markdown blocks.
`;

                currentResponse = await this.generateWithReflection(repairPrompt, 2, true, validationFn);
                parsedData = JSON.parse(currentResponse);
                currentBruteforceScript = this.stripMarkdownBlocks(parsedData.bruteforce_script);
                currentOptimalScript = this.stripMarkdownBlocks(parsedData.optimal_script);
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

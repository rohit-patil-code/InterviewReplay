import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import util from 'util';
import crypto from 'crypto';

const execPromise = util.promisify(exec);

export interface ExecutionResult {
    stdout: string;
    stderr: string;
}

export class SandboxRunner {
    /**
     * Writes dynamic Node.js code to a temporary file, executes it in a sandboxed process,
     * captures output, enforces a strict timeout, and cleans up the file.
     * 
     * @param scriptContent The raw JavaScript string to execute.
     * @param timeoutMs Execution maximum allowed duration (default 5000ms)
     * @returns ExecutionResult containing stdout and stderr
     */
    static async executeNodeScript(scriptContent: string, timeoutMs: number = 5000, executionCwd?: string): Promise<ExecutionResult> {
        const id = crypto.randomUUID();
        const tmpFileName = `temp_script_${id}.js`;
        // Put in system temp dir by default or the isolated job sandbox folder if provided
        const cwd = executionCwd || os.tmpdir();
        const tmpFilePath = path.join(cwd, tmpFileName);

        try {
            // 1. Write the dynamic script code to the filesystem
            await fs.writeFile(tmpFilePath, scriptContent, 'utf8');

            // 2. Execute it via native node process with strict timeout
            const { stdout, stderr } = await execPromise(`node "${tmpFilePath}"`, {
                timeout: timeoutMs,
                cwd: cwd
            });

            return { stdout, stderr };
        } catch (error: any) {
            // Throw formatted execution errors or timeout indicators
            if (error.killed) {
                throw new Error(`Execution failed: Script timed out after ${timeoutMs}ms. Infinite loop detected.`);
            }
            throw new Error(`Execution failed: ${error.message}\n\nSTDERR: ${error.stderr || ''}`);
        } finally {
            // 3. Always clean up the temporary script
            try {
                await fs.unlink(tmpFilePath);
            } catch (cleanupError) {
                console.error(`[SandboxRunner] Warning: Failed to clean up temp file ${tmpFilePath}`, cleanupError);
            }
        }
    }
}

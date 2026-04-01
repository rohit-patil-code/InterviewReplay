import os from 'os';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs/promises';
import { exec } from 'child_process';
import util from 'util';
import { GeneratorFactory } from './generators/GeneratorFactory';

const execPromise = util.promisify(exec);

export class SandboxRunner {

    /**
     * Helper to execute simple node scripts locally.
     * Used by the worker agents for running scrapers, logic etc.
     */
    static async executeNodeScript(scriptContent: string, timeoutMs: number = 2000, customCwd?: string): Promise<{ stdout: string; stderr: string }> {
        const id = crypto.randomUUID();
        const tmpDir = customCwd || await fs.mkdtemp(path.join(os.tmpdir(), `oarecall-bot-${id}-`));
        const scriptPath = path.join(tmpDir, 'script.js');
        await fs.writeFile(scriptPath, scriptContent, 'utf8');

        try {
            const volumeMap = `"${tmpDir}:/usr/src/app"`;
            const innerKillSecs = Math.ceil(timeoutMs / 1000);
            const runCmd = `docker run --rm --net none --memory 512m --cpus 1 -v ${volumeMap} -w /usr/src/app node:20-slim sh -c "timeout -s KILL ${innerKillSecs} node script.js"`;

            // Wall clock = script timeout + 15s for Docker startup overhead.
            // This prevents Docker container spin-up time from counting against the script.
            const { stdout, stderr } = await execPromise(runCmd, {
                timeout: timeoutMs + 15000,
                cwd: tmpDir
            });
            return { stdout, stderr };
        } catch (error: any) {
            if (error.killed || error.code === 137) {
                throw new Error(`Time Limit Exceeded: Script exceeded ${timeoutMs}ms runtime bounds.`);
            }
            throw new Error(error.message || "Unknown Node runtime error.");
        } finally {
            if (!customCwd) {
                await fs.rm(tmpDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 1000 }).catch(console.error);
            }
        }
    }

    /**
     * Executes untrusted user code against an ARRAY of specific test cases natively using a single hidden Driver script loop.
     * 
     * @param userCode The raw code submitted by the user.
     * @param language Programming language selected ('python', 'java', 'cpp').
     * @param className The name of the class (e.g., 'Solution').
     * @param functionName The exact method name to call on the Solution class.
     * @param schema The generation schema containing the 'order' of parameters.
     * @param testCaseInputs Array of JSON strings representing the input arguments for all 15 cases natively.
     * @param timeoutMs Execution total timeout mapping the batch loop securely.
     */
    static async executeUserCode(
        userCode: string,
        language: string,
        className: string,
        functionName: string,
        schema: any,
        testCaseInputs: string[],
        timeoutMs: number = 5000
    ): Promise<any[]> {
        const id = crypto.randomUUID();
        const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `oarecall-batch-${id}-`));
        const volumeMap = `"${tmpDir}:/usr/src/app"`;

        try {
            // 1. Resolve architectural mapping strictly bound via decoupled structures seamlessly
            const generator = GeneratorFactory.get(language);

            // 2. Hydrate isolated template generation uniquely
            const { fullScript, scriptName, dockerCmd, setupPromises } = generator.generate({
                userCode,
                className,
                functionName,
                schema,
                testCaseInputs,
                tmpDir,
                volumeMap
            });

            // 3. Persist I/O structures safely
            await Promise.all(setupPromises);

            // Reconstruct the explicit JSON Array for universal fallback parsing natively
            const joinedValidJsonArray = `[${testCaseInputs.map(t => t || "{}").join(',')}]`;
            await fs.writeFile(path.join(tmpDir, 'inputs.json'), joinedValidJsonArray, 'utf8');
            await fs.writeFile(path.join(tmpDir, scriptName), fullScript, 'utf8');

            let boundDockerCmd = dockerCmd;
            // Single clean timeout injection — 55s inner kill, 60s outer execPromise.
            // This covers Docker startup + build_tree + all overhead without silently
            // blaming the user's function for infrastructure latency.
            boundDockerCmd = boundDockerCmd.replace('sh -c "', 'sh -c "timeout -s KILL 55 ');

            // 4. Secure Docker Sandbox Bootstrapping
            const { stdout, stderr } = await execPromise(boundDockerCmd, {
                timeout: 60000,   // 60s wall clock — only hits for infinite loops
                cwd: tmpDir,
                maxBuffer: 1024 * 1024 * 50
            });

            // 5. Decode mapping arrays natively identical decoupled safely
            const parts = stdout.split(/---EXEC_RESULT---\r?\n/);
            let resultJsonStr = parts.length > 1 ? parts[parts.length - 1].trim() : parts[0].trim();

            try {
                const parsedResultArray = JSON.parse(resultJsonStr);
                if (!Array.isArray(parsedResultArray)) {
                    throw new Error("Batch execution parsed successfully but did not return a valid top level JSON array.");
                }
                return parsedResultArray;
            } catch (parseError) {
                return testCaseInputs.map(() => ({
                    success: false,
                    error: "Failed to parse driver output bounds matching fatal execution failures natively.\\n" + String(parseError) + "\\nSTDOUT: " + stdout,
                }));
            }
        } catch (error: any) {
            if (error.killed || error.code === 137) {
                return testCaseInputs.map(() => ({
                    success: false,
                    error: `Sandbox killed after 60s (infinite loop or out of memory — not a TLE on your algorithm).`
                }));
            }
            return testCaseInputs.map(() => ({
                success: false,
                error: error.message || "Unknown execution error natively globally crashed the underlying matrix bounds."
            }));
        } finally {
            // Unlink container matrix
            await fs.rm(tmpDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 1000 }).catch(console.error);
        }
    }
}

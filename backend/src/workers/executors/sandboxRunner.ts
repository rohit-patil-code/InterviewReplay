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

    /**
     * Executes untrusted user code against a specific test case using a hidden Driver script.
     * 
     * @param userCode The raw code submitted by the user.
     * @param className The name of the class (e.g., 'Solution').
     * @param functionName The exact method name to call on the Solution class.
     * @param schema The generation schema containing the 'order' of parameters.
     * @param testCaseInput JSON string representing the input arguments.
     * @param timeoutMs Execution timeout in milliseconds.
     */
    static async executeUserCode(
        userCode: string,
        language: string,
        className: string,
        functionName: string,
        schema: any,
        testCaseInput: string,
        timeoutMs: number = 2000
    ): Promise<{ success: boolean; result?: any; error?: string; runtimeMs?: number; stdout?: string; stderr?: string }> {
        const id = crypto.randomUUID();
        const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `oarecall-user-${id}-`));
        const isPython = language === 'python';
        const scriptExt = isPython ? 'py' : 'js';
        const scriptPath = path.join(tmpDir, `runner.${scriptExt}`);
        const inputPath = path.join(tmpDir, 'input.json');

        // Driver script that is concatenated below the user's Solution class
        let driverCode = '';
        
        if (isPython) {
            driverCode = `

import json
import time

if __name__ == '__main__':
    try:
        with open('input.json', 'r', encoding='utf-8') as f:
            raw_input_text = f.read()
            
        parsed_input = json.loads(raw_input_text)
        if isinstance(parsed_input, list) and len(parsed_input) == 1 and isinstance(parsed_input[0], dict):
            parsed_input = parsed_input[0]
            
        schema_keys = ${JSON.stringify(schema.order || Object.keys(schema?.properties || schema || {}))}
        args = [parsed_input.get(k) for k in schema_keys]
        
        start = time.perf_counter()
        instance = ${className}()
        if not hasattr(instance, '${functionName}'):
            raise Exception("Function '${functionName}' not found on class '${className}'.")
            
        result = getattr(instance, '${functionName}')(*args)
        end = time.perf_counter()
        
        print("\\n---EXEC_RESULT---")
        print(json.dumps({
            "success": True,
            "result": result,
            "runtimeMs": (end - start) * 1000
        }))
    except Exception as e:
        import traceback
        print("\\n---EXEC_RESULT---")
        print(json.dumps({
            "success": False,
            "error": str(e),
            "stack": traceback.format_exc()
        }))
`;
        } else {
            driverCode = `
const fs = require('fs');
const { performance } = require('perf_hooks');

let userStdout = '';
// Capture console.log from user code
const originalLog = console.log;
console.log = (...args) => {
    userStdout += args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') + '\\n';
};

async function main() {
    try {
        const rawInputText = fs.readFileSync('input.json', 'utf8');
        let parsedInput = JSON.parse(rawInputText);
        
        // Normalization: Sometime inputs are wrapped in arrays [{ arg1: "val" }]
        if (Array.isArray(parsedInput) && parsedInput.length === 1 && typeof parsedInput[0] === 'object') {
            parsedInput = parsedInput[0];
        }

        const schemaKeys = ${JSON.stringify(schema.order || Object.keys(schema?.properties || schema || {}))};
        const args = schemaKeys.map(k => parsedInput[k]);

        const instance = new ${className}();
        
        if (typeof instance['${functionName}'] !== 'function') {
            throw new Error("Function '${functionName}' not found on class '${className}'. Do not modify the class or function signatures.");
        }

        const start = performance.now();
        const result = instance['${functionName}'](...args);
        
        const finalResult = result instanceof Promise ? await result : result;
        const end = performance.now();

        // Restore console.log before printing the final execution payload
        console.log = originalLog;
        console.log("---EXEC_RESULT---");
        console.log(JSON.stringify({
            success: true,
            result: finalResult,
            runtimeMs: end - start,
            userLogs: userStdout
        }));
    } catch (e) {
        console.log = originalLog;
        console.log("---EXEC_RESULT---");
        console.log(JSON.stringify({
            success: false,
            error: e.message,
            stack: e.stack,
            userLogs: userStdout
        }));
    }
}

}

main();
`;
        }

        const fullScript = `${userCode}\n\n${driverCode}`;

        try {
            await fs.writeFile(inputPath, testCaseInput, 'utf8');
            await fs.writeFile(scriptPath, fullScript, 'utf8');

            const runCmd = isPython ? `python "${scriptPath}"` : `node "${scriptPath}"`;
            const { stdout, stderr } = await execPromise(runCmd, {
                timeout: timeoutMs,
                cwd: tmpDir,
                maxBuffer: 1024 * 1024 * 50 // 50MB buffer to handle massive outputs
            });

            // Extract the secure JSON payload
            const parts = stdout.split(/---EXEC_RESULT---\r?\n/);
            let resultJsonStr = parts.length > 1 ? parts[parts.length - 1].trim() : parts[0].trim();
            
            // Fallback: in case `userLogs` appended weirdly
            const lines = stdout.split(/\r?\n/);
            for (let i = lines.length - 1; i >= 0; i--) {
                if (lines[i].trim().startsWith('{"success":')) {
                    resultJsonStr = lines[i].trim();
                    break;
                }
            }

            try {
                const parsedResult = JSON.parse(resultJsonStr);
                return {
                    success: parsedResult.success,
                    result: parsedResult.result,
                    error: parsedResult.error,
                    runtimeMs: parsedResult.runtimeMs,
                    stdout: parsedResult.userLogs || stdout,
                    stderr: stderr
                };
            } catch (parseError) {
                return {
                    success: false,
                    error: `Failed to parse driver output:\\nStdout:\\n${stdout}\\n\\nStderr:\\n${stderr}`,
                    stdout: stdout,
                    stderr: stderr
                };
            }
        } catch (error: any) {
            if (error.killed) {
                return {
                    success: false,
                    error: `Time Limit Exceeded: Script execution exceeded ${timeoutMs}ms.`
                };
            }
            return {
                success: false,
                error: error.message || "Unknown execution error",
                stderr: error.stderr
            };
        } finally {
            await fs.rm(tmpDir, { recursive: true, force: true }).catch(console.error);
        }
    }
}

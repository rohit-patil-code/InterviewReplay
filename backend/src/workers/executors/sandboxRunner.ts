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
        const isCpp = language === 'cpp';
        const isJava = language === 'java';
        const scriptExt = isPython ? 'py' : isCpp ? 'cpp' : 'java';
        const scriptName = isJava ? 'Main.java' : `runner.${scriptExt}`;
        const scriptPath = path.join(tmpDir, scriptName);
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
        
        // Final Compilation of the script
        let fullScript = '';

        // Pending disk IO operations for Java massive inputs
        const javaIoPromises: Promise<void>[] = [];

        if (isJava) {
            let parsedInput = JSON.parse(testCaseInput);
            if (Array.isArray(parsedInput) && parsedInput.length === 1 && typeof parsedInput[0] === 'object') {
                parsedInput = parsedInput[0];
            }
            const schemaKeys = schema.order || Object.keys(schema?.properties || schema || {});

            const stringifyForJava = (val: any): string => {
                if (typeof val === 'string') return val;
                if (typeof val === 'number') return String(val);
                if (typeof val === 'boolean') return String(val);
                if (Array.isArray(val)) {
                    if (val.length === 0) return ""; 
                    if (Array.isArray(val[0])) return val.map(row => row.join(',')).join('\\n');
                    if (typeof val[0] === 'string') return val.join('\\n--END_OF_STRING--\\n');
                    return val.join(',');
                }
                return "";
            };

            const JavaReaderGenerators: string[] = [];
            schemaKeys.forEach((k: string, i: number) => {
                const val = parsedInput[k];
                const argFile = path.join(tmpDir, `arg_${i}.txt`);
                const content = stringifyForJava(val);
                
                javaIoPromises.push(fs.writeFile(argFile, content, 'utf8'));

                if (typeof val === 'string') {
                    JavaReaderGenerators.push(`new String(java.nio.file.Files.readAllBytes(java.nio.file.Paths.get("arg_${i}.txt")), java.nio.charset.StandardCharsets.UTF_8)`);
                } else if (typeof val === 'number') {
                    JavaReaderGenerators.push(`Integer.parseInt(new String(java.nio.file.Files.readAllBytes(java.nio.file.Paths.get("arg_${i}.txt")), java.nio.charset.StandardCharsets.UTF_8).trim())`);
                } else if (typeof val === 'boolean') {
                    JavaReaderGenerators.push(`Boolean.parseBoolean(new String(java.nio.file.Files.readAllBytes(java.nio.file.Paths.get("arg_${i}.txt")), java.nio.charset.StandardCharsets.UTF_8).trim())`);
                } else if (Array.isArray(val)) {
                    if (val.length === 0) JavaReaderGenerators.push(`new int[]{}`); 
                    else if (Array.isArray(val[0])) JavaReaderGenerators.push(`read2DIntArray("arg_${i}.txt")`);
                    else if (typeof val[0] === 'string') JavaReaderGenerators.push(`readStringArray("arg_${i}.txt")`);
                    else JavaReaderGenerators.push(`read1DIntArray("arg_${i}.txt")`);
                } else {
                    JavaReaderGenerators.push('null');
                }
            });
            const cleanUserCode = userCode.replace(/public\s+class\s+([a-zA-Z0-9_]+)/g, 'class $1');

            fullScript = `
import java.util.*;

${cleanUserCode}

public class Main {
    public static void main(String[] args) {
        try {
            ${className} instance = new ${className}();
            long start = System.nanoTime();
            Object result = instance.${functionName}(${JavaReaderGenerators.join(', ')});
            long end = System.nanoTime();
            
            System.out.println("\\n---EXEC_RESULT---");
            System.out.println("{\\"success\\": true, \\"result\\": " + toJSON(result) + ", \\"runtimeMs\\": " + ((end - start) / 1000000.0) + "}");
        } catch (Exception e) {
            System.out.println("\\n---EXEC_RESULT---");
            System.out.println("{\\"success\\": false, \\"error\\": \\"" + e.toString().replace("\\"", "\\\\\\\"") + "\\", \\"stack\\": \\"" + arrayToString(e.getStackTrace()).replace("\\"", "\\\\\\\"").replace("\\n", "\\\\n") + "\\"}");
        }
    }

    public static int[] read1DIntArray(String file) throws Exception {
        String content = new String(java.nio.file.Files.readAllBytes(java.nio.file.Paths.get(file)), java.nio.charset.StandardCharsets.UTF_8).trim();
        if (content.isEmpty()) return new int[0];
        String[] parts = content.split(",");
        int[] arr = new int[parts.length];
        for (int i=0; i<parts.length; i++) arr[i] = Integer.parseInt(parts[i].trim());
        return arr;
    }

    public static int[][] read2DIntArray(String file) throws Exception {
        String content = new String(java.nio.file.Files.readAllBytes(java.nio.file.Paths.get(file)), java.nio.charset.StandardCharsets.UTF_8).trim();
        if (content.isEmpty()) return new int[0][0];
        String[] lines = content.split("\\n");
        int[][] arr = new int[lines.length][];
        for (int i=0; i<lines.length; i++) {
            if (lines[i].trim().isEmpty()) { arr[i] = new int[0]; continue; }
            String[] parts = lines[i].split(",");
            arr[i] = new int[parts.length];
            for (int j=0; j<parts.length; j++) arr[i][j] = Integer.parseInt(parts[j].trim());
        }
        return arr;
    }

    public static String[] readStringArray(String file) throws Exception {
        String content = new String(java.nio.file.Files.readAllBytes(java.nio.file.Paths.get(file)), java.nio.charset.StandardCharsets.UTF_8);
        if (content.isEmpty()) return new String[0];
        return content.split("\\n--END_OF_STRING--\\n");
    }

    public static String toJSON(Object obj) {
        if (obj == null) return "null";
        if (obj instanceof String) return "\\"" + ((String)obj).replace("\\"", "\\\\\\\"") + "\\"";
        if (obj instanceof Number || obj instanceof Boolean) return obj.toString();
        if (obj instanceof int[]) return Arrays.toString((int[])obj);
        if (obj instanceof double[]) return Arrays.toString((double[])obj);
        if (obj instanceof char[]) return Arrays.toString((char[])obj);
        if (obj instanceof Object[]) {
            Object[] arr = (Object[])obj;
            StringBuilder sb = new StringBuilder("[");
            for(int i=0; i<arr.length; i++) {
                sb.append(toJSON(arr[i]));
                if (i < arr.length-1) sb.append(",");
            }
            sb.append("]");
            return sb.toString();
        }
        if (obj instanceof List) {
            List<?> list = (List<?>)obj;
            StringBuilder sb = new StringBuilder("[");
            for(int i=0; i<list.size(); i++) {
                sb.append(toJSON(list.get(i)));
                if (i < list.size()-1) sb.append(",");
            }
            sb.append("]");
            return sb.toString();
        }
        return "\\"" + obj.toString().replace("\\"", "\\\\\\\"") + "\\""; 
    }
    
    public static String arrayToString(StackTraceElement[] arr) {
        StringBuilder sb = new StringBuilder();
        for (StackTraceElement el : arr) {
            sb.append(el.toString()).append("\\n");
        }
        return sb.toString();
    }
}
`;
        } else if (isCpp) {
            let parsedInput = JSON.parse(testCaseInput);
            if (Array.isArray(parsedInput) && parsedInput.length === 1 && typeof parsedInput[0] === 'object') {
                parsedInput = parsedInput[0];
            }
            const schemaKeys = schema.order || Object.keys(schema?.properties || schema || {});

            const stringifyForCpp = (val: any): string => {
                if (typeof val === 'string') return val;
                if (typeof val === 'number') return String(val);
                if (typeof val === 'boolean') return val ? '1' : '0';
                if (Array.isArray(val)) {
                    if (val.length === 0) return ""; 
                    if (Array.isArray(val[0])) return val.map(row => row.join(',')).join('\\n');
                    if (typeof val[0] === 'string') return val.join('\\n--END_OF_STRING--\\n');
                    return val.join(',');
                }
                return "";
            };

            const CppReaderGenerators: string[] = [];
            schemaKeys.forEach((k: string, i: number) => {
                const val = parsedInput[k];
                const argFile = path.join(tmpDir, `arg_${i}.txt`);
                const content = stringifyForCpp(val);
                
                javaIoPromises.push(fs.writeFile(argFile, content, 'utf8'));

                if (typeof val === 'string') {
                    CppReaderGenerators.push(`readString("arg_${i}.txt")`);
                } else if (typeof val === 'number') {
                    CppReaderGenerators.push(Number.isInteger(val) ? `readInt("arg_${i}.txt")` : `readDouble("arg_${i}.txt")`);
                } else if (typeof val === 'boolean') {
                    CppReaderGenerators.push(`readBool("arg_${i}.txt")`);
                } else if (Array.isArray(val)) {
                    if (val.length === 0) CppReaderGenerators.push(`vector<int>()`); 
                    else if (Array.isArray(val[0])) CppReaderGenerators.push(`read2DIntArray("arg_${i}.txt")`);
                    else if (typeof val[0] === 'string') CppReaderGenerators.push(`readStringArray("arg_${i}.txt")`);
                    else CppReaderGenerators.push(`read1DIntArray("arg_${i}.txt")`);
                } else {
                    CppReaderGenerators.push('NULL');
                }
            });

            fullScript = `
#include <iostream>
#include <fstream>
#include <vector>
#include <string>
#include <sstream>
#include <chrono>

using namespace std;

string readString(const string& path) {
    ifstream ifs(path);
    if(!ifs) return "";
    string content((istreambuf_iterator<char>(ifs)), (istreambuf_iterator<char>()));
    return content;
}

int readInt(const string& path) { return stoi(readString(path)); }
double readDouble(const string& path) { return stod(readString(path)); }
bool readBool(const string& path) { return readString(path) == "1"; }

vector<int> read1DIntArray(const string& path) {
    string content = readString(path);
    vector<int> res;
    stringstream ss(content);
    string item;
    while(getline(ss, item, ',')) {
        if(!item.empty()) res.push_back(stoi(item));
    }
    return res;
}

vector<vector<int>> read2DIntArray(const string& path) {
    string content = readString(path);
    vector<vector<int>> res;
    stringstream ss(content);
    string line;
    while(getline(ss, line, '\\n')) {
        vector<int> row;
        stringstream ls(line);
        string item;
        while(getline(ls, item, ',')) {
            if(!item.empty()) row.push_back(stoi(item));
        }
        res.push_back(row);
    }
    return res;
}

vector<string> readStringArray(const string& path) {
    string content = readString(path);
    vector<string> res;
    size_t pos = 0;
    string token;
    string delimiter = "\\n--END_OF_STRING--\\n";
    while ((pos = content.find(delimiter)) != string::npos) {
        token = content.substr(0, pos);
        res.push_back(token);
        content.erase(0, pos + delimiter.length());
    }
    if(!content.empty()) res.push_back(content);
    return res;
}

string toJSON(int val) { return to_string(val); }
string toJSON(double val) { return to_string(val); }
string toJSON(bool val) { return val ? "true" : "false"; }
string toJSON(const string& val) {
    string res = "\\\"";
    for(char c : val) {
        if (c == '\\"') res += "\\\\\\\"";
        else res += c;
    }
    res += "\\\"";
    return res;
}
string toJSON(const vector<int>& val) {
    string res = "[";
    for(size_t i=0; i<val.size(); ++i) {
        res += toJSON(val[i]);
        if(i < val.size()-1) res += ",";
    }
    res += "]";
    return res;
}
string toJSON(const vector<string>& val) {
    string res = "[";
    for(size_t i=0; i<val.size(); ++i) {
        res += toJSON(val[i]);
        if(i < val.size()-1) res += ",";
    }
    res += "]";
    return res;
}
string toJSON(const vector<vector<int>>& val) {
    string res = "[";
    for(size_t i=0; i<val.size(); ++i) {
        res += toJSON(val[i]);
        if(i < val.size()-1) res += ",";
    }
    res += "]";
    return res;
}

${userCode}

int main() {
    try {
        Solution instance;
        auto start = chrono::high_resolution_clock::now();
        auto result = instance.${functionName}(${CppReaderGenerators.join(', ')});
        auto end = chrono::high_resolution_clock::now();
        double runtimeMs = chrono::duration<double, std::milli>(end - start).count();
        
        cout << "\\n---EXEC_RESULT---\\n";
        cout << "{\\"success\\": true, \\"result\\": " << toJSON(result) << ", \\"runtimeMs\\": " << runtimeMs << "}\\n";
    } catch(const exception& e) {
        cout << "\\n---EXEC_RESULT---\\n";
        string err = e.what();
        
        string cleanErr = "";
        for(char c : err) {
            if (c == '\\"') cleanErr += "\\\\\\\"";
            else cleanErr += c;
        }
        cout << "{\\"success\\": false, \\"error\\": \\"" << cleanErr << "\\"}\\n";
    } catch(...) {
        cout << "\\n---EXEC_RESULT---\\n";
        cout << "{\\"success\\": false, \\"error\\": \\"Unknown C++ Exception\\"}\\n";
    }
    return 0;
}
`;
        } else {
            fullScript = `${userCode}\n\n${driverCode}`; // Default python
        }

        try {
            await Promise.all(javaIoPromises);
            await fs.writeFile(inputPath, testCaseInput, 'utf8');
            await fs.writeFile(scriptPath, fullScript, 'utf8');

            let runCmd = '';
            if (isJava) {
                runCmd = `javac "${scriptPath}" && java -cp "${tmpDir}" Main`;
            } else if (isCpp) {
                runCmd = `g++ "${scriptPath}" -o "${path.join(tmpDir, 'runner')}" && "${path.join(tmpDir, 'runner')}"`;
            } else if (isPython) {
                runCmd = `python "${scriptPath}"`;
            } else {
                runCmd = `node "${scriptPath}"`;
            }

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

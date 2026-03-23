import { CodeGenerator, ExecutionContext, GeneratorResult } from "./CodeGenerator";
import fs from 'fs/promises';
import path from 'path';

export class JavaGenerator implements CodeGenerator {
    generate(context: ExecutionContext): GeneratorResult {
        const { userCode, className, functionName, schema, testCaseInputs, tmpDir, volumeMap } = context;

        const numTestCases = testCaseInputs.length;
        const schemaKeys = schema.order || Object.keys(schema?.properties || schema || {});
        const setupPromises: Promise<void>[] = [];

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
        
        testCaseInputs.forEach((inputStr, tcIdx) => {
            let parsedInput = JSON.parse(inputStr || "{}");
            if (Array.isArray(parsedInput) && parsedInput.length === 1 && typeof parsedInput[0] === 'object') {
                parsedInput = parsedInput[0];
            }
            schemaKeys.forEach((k: string, argIdx: number) => {
                const argFile = path.join(tmpDir, `arg_${tcIdx}_${argIdx}.txt`);
                setupPromises.push(fs.writeFile(argFile, stringifyForJava(parsedInput[k]), 'utf8'));
            });
        });

        let firstParsed = JSON.parse(testCaseInputs[0] || "{}");
        if (Array.isArray(firstParsed) && firstParsed.length === 1 && typeof firstParsed[0] === 'object') firstParsed = firstParsed[0];

        schemaKeys.forEach((k: string, argIdx: number) => {
            const val = firstParsed[k];
            if (typeof val === 'string') {
                JavaReaderGenerators.push(`new String(java.nio.file.Files.readAllBytes(java.nio.file.Paths.get("arg_" + i + "_${argIdx}.txt")), java.nio.charset.StandardCharsets.UTF_8)`);
            } else if (typeof val === 'number') {
                JavaReaderGenerators.push(`Integer.parseInt(new String(java.nio.file.Files.readAllBytes(java.nio.file.Paths.get("arg_" + i + "_${argIdx}.txt")), java.nio.charset.StandardCharsets.UTF_8).trim())`);
            } else if (typeof val === 'boolean') {
                JavaReaderGenerators.push(`Boolean.parseBoolean(new String(java.nio.file.Files.readAllBytes(java.nio.file.Paths.get("arg_" + i + "_${argIdx}.txt")), java.nio.charset.StandardCharsets.UTF_8).trim())`);
            } else if (Array.isArray(val)) {
                if (val.length === 0) JavaReaderGenerators.push(`new int[]{}`); 
                else if (Array.isArray(val[0])) JavaReaderGenerators.push(`read2DIntArray("arg_" + i + "_${argIdx}.txt")`);
                else if (typeof val[0] === 'string') JavaReaderGenerators.push(`readStringArray("arg_" + i + "_${argIdx}.txt")`);
                else JavaReaderGenerators.push(`read1DIntArray("arg_" + i + "_${argIdx}.txt")`);
            } else {
                JavaReaderGenerators.push('null');
            }
        });

        const cleanUserCode = userCode.replace(/public\s+class\s+([a-zA-Z0-9_]+)/g, 'class $1');

        const fullScript = `
import java.util.*;

${cleanUserCode}

public class Main {
    public static void main(String[] args) {
        System.out.println("\\n---EXEC_RESULT---");
        System.out.print("[");
        
        for (int i = 0; i < ${numTestCases}; i++) {
            try {
                ${className} instance = new ${className}();
                long start = System.nanoTime();
                Object result = instance.${functionName}(${JavaReaderGenerators.join(', ')});
                long end = System.nanoTime();
                
                System.out.print("{\\"success\\": true, \\"result\\": " + toJSON(result) + ", \\"runtimeMs\\": " + ((end - start) / 1000000.0) + "}");
            } catch (Exception e) {
                System.out.print("{\\"success\\": false, \\"error\\": \\"" + e.toString().replace("\\"", "\\\\\\\"") + "\\", \\"stack\\": \\"" + arrayToString(e.getStackTrace()).replace("\\"", "\\\\\\\"").replace("\\n", "\\\\n") + "\\"}");
            }
            if (i < ${numTestCases - 1}) System.out.print(",");
        }
        System.out.println("]");
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

        return {
            fullScript,
            scriptName: "Main.java",
            dockerCmd: `docker run --rm -i --net none --memory 512m --cpus 1 -v ${volumeMap} -w /usr/src/app eclipse-temurin:21-jdk sh -c "javac Main.java && java Main"`,
            setupPromises
        };
    }
}

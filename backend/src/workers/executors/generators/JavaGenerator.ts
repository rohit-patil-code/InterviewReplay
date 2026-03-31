import { CodeGenerator, ExecutionContext, GeneratorResult } from "./CodeGenerator";
import fs from 'fs/promises';
import path from 'path';

export class JavaGenerator implements CodeGenerator {
    generate(context: ExecutionContext): GeneratorResult {
        const { userCode, className, functionName, schema, testCaseInputs, tmpDir, volumeMap } = context;

        const numTestCases = testCaseInputs.length;
        let firstParsed: any = {};
        try {
            firstParsed = JSON.parse(testCaseInputs[0] || "{}");
        } catch (e) {}

        let schemaKeys = schema?.order;
        if (!schemaKeys) {
            if (Array.isArray(firstParsed)) {
                // Safely assume array elements map to positional arguments
                schemaKeys = firstParsed.map((_, i) => String(i));
            } else {
                const propKeys = Object.keys(schema?.properties || {});
                if (propKeys.length > 0) {
                    schemaKeys = propKeys;
                } else if (schema?.type && typeof schema.type === 'string' && schema.type !== 'object') {
                    schemaKeys = ['single_arg'];
                } else {
                    // Filter out known metadata keys to find real parameter names
                    const realKeys = Object.keys(schema || {}).filter((k: string) => !['type', 'minDepth', 'maxDepth', 'edgeCases', 'minLength', 'maxLength', 'minSize', 'maxSize', 'minVal', 'maxVal', 'minN', 'maxN', 'min', 'max', 'min_depth', 'max_depth', 'null_probability', 'cases', 'items', 'order', 'properties'].includes(k));
                    if (realKeys.length > 0) {
                        schemaKeys = realKeys;
                    } else {
                        // Truly single-argument schema
                        schemaKeys = ['single_arg'];
                    }
                }
            }
        }
        const setupPromises: Promise<void>[] = [];

        const stringifyForJava = (val: any): string => {
            if (typeof val === 'string') return val;
            if (typeof val === 'number') return String(val);
            if (typeof val === 'boolean') return String(val);
            if (Array.isArray(val)) {
                if (val.length === 0) return "";
                if (Array.isArray(val[0])) return val.map(row => row.map((v: any) => v === null ? "null" : v).join(',')).join('\n');
                if (typeof val[0] === 'string') return val.map((v: any) => v === null ? "null" : v).join('\n--END_OF_STRING--\n');
                return val.map((v: any) => v === null ? "null" : v).join(',');
            }
            return "";
        };

        const JavaReaderGenerators: string[] = [];

        testCaseInputs.forEach((inputStr, tcIdx) => {
            let parsedInput = JSON.parse(inputStr || "{}");
            schemaKeys.forEach((k: string, argIdx: number) => {
                const argFile = path.join(tmpDir, `arg_${tcIdx}_${argIdx}.txt`);
                let val = null;
                if (Array.isArray(parsedInput) && parsedInput.length > 0) {
                    if (parsedInput.length === 1 && typeof parsedInput[0] === 'object' && !Array.isArray(parsedInput[0]) && parsedInput[0][k] !== undefined) {
                        val = parsedInput[0][k];
                    } else {
                        val = parsedInput[argIdx];
                    }
                } else if (typeof parsedInput === 'object' && parsedInput !== null) {
                    val = parsedInput[k];
                } else {
                    val = parsedInput;
                }
                setupPromises.push(fs.writeFile(argFile, stringifyForJava(val), 'utf8'));
            });
        });

        schemaKeys.forEach((k: string, argIdx: number) => {
            let val = null;
            if (Array.isArray(firstParsed) && firstParsed.length > 0) {
                if (firstParsed.length === 1 && typeof firstParsed[0] === 'object' && !Array.isArray(firstParsed[0]) && firstParsed[0][k] !== undefined) {
                    val = firstParsed[0][k];
                } else {
                    val = firstParsed[argIdx];
                }
            } else if (typeof firstParsed === 'object' && firstParsed !== null) {
                val = firstParsed[k];
            } else {
                val = firstParsed;
            }

            // --- FIX: ROBUST SCHEMA TYPE EXTRACTION ---
            let schemaType = schema?.properties?.[k]?.type;

            // If not in properties, check if it's explicitly defined in the 'order' array by index
            if (!schemaType && Array.isArray(schema?.order)) {
                const orderItem = schema.order[argIdx];
                if (orderItem && typeof orderItem === 'object') {
                    schemaType = orderItem.type || orderItem.dataType; // Handle variations
                }
            }

            // Fallback to root type
            if (!schemaType) {
                schemaType = schema?.type;
                if (!schemaType && schema && typeof schema === 'object') {
                    schemaType = schema[k];
                }
            }

            const normalizedType = String(schemaType).toLowerCase();
            // -------------------------------------------

            if (normalizedType === 'treenode' || normalizedType === 'tree') {
                JavaReaderGenerators.push(`buildTree(new String(java.nio.file.Files.readAllBytes(java.nio.file.Paths.get("arg_" + i + "_${argIdx}.txt")), java.nio.charset.StandardCharsets.UTF_8).trim())`);
            } else if (normalizedType === 'listnode' || normalizedType === 'linked_list' || normalizedType === 'list') {
                JavaReaderGenerators.push(`buildList(new String(java.nio.file.Files.readAllBytes(java.nio.file.Paths.get("arg_" + i + "_${argIdx}.txt")), java.nio.charset.StandardCharsets.UTF_8).trim())`);
            } else if (typeof val === 'string') {
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

class TreeNode {
    public int val;
    public TreeNode left;
    public TreeNode right;
    public TreeNode() {}
    public TreeNode(int val) { this.val = val; }
    public TreeNode(int val, TreeNode left, TreeNode right) {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}

class ListNode {
    public int val;
    public ListNode next;
    public ListNode() {}
    public ListNode(int val) { this.val = val; }
    public ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}

${cleanUserCode}

public class OARecall {
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

    public static TreeNode buildTree(String data) {
        if (data == null || data.trim().isEmpty() || data.trim().equals("[]")) return null;
        data = data.replaceAll("\\\\[|\\\\]", "").trim();
        if (data.isEmpty()) return null;
        String[] parts = data.split(",");
        if (parts.length == 0 || parts[0].trim().equals("null")) return null;
        TreeNode root = new TreeNode(Integer.parseInt(parts[0].trim()));
        Queue<TreeNode> q = new LinkedList<>();
        q.add(root);
        int i = 1;
        while (!q.isEmpty() && i < parts.length) {
            TreeNode curr = q.poll();
            String leftVal = parts[i++].trim();
            if (!leftVal.equals("null")) {
                curr.left = new TreeNode(Integer.parseInt(leftVal));
                q.add(curr.left);
            }
            if (i < parts.length) {
                String rightVal = parts[i++].trim();
                if (!rightVal.equals("null")) {
                    curr.right = new TreeNode(Integer.parseInt(rightVal));
                    q.add(curr.right);
                }
            }
        }
        return root;
    }

    public static ListNode buildList(String data) {
        if (data == null || data.trim().isEmpty() || data.trim().equals("[]")) return null;
        data = data.replaceAll("\\\\[|\\\\]", "").trim();
        if (data.isEmpty()) return null;
        String[] parts = data.split(",");
        ListNode dummy = new ListNode(0);
        ListNode curr = dummy;
        for (String p : parts) {
            if (!p.trim().isEmpty()) {
                curr.next = new ListNode(Integer.parseInt(p.trim()));
                curr = curr.next;
            }
        }
        return dummy.next;
    }

    public static String toJSON(Object obj) {
        if (obj == null) return "null";
        if (obj instanceof String) return "\\"" + ((String)obj).replace("\\"", "\\\\\\\"") + "\\"";
        if (obj instanceof Number || obj instanceof Boolean) return obj.toString();
        
        // --- NEW: Serializers for Outputting nodes back to Sandbox! ---
        if (obj instanceof TreeNode) return treeNodeToJSON((TreeNode)obj);
        if (obj instanceof ListNode) return listNodeToJSON((ListNode)obj);
        // --------------------------------------------------------------
        
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
    
    // Convert TreeNode output back to LeetCode array string format
    public static String treeNodeToJSON(TreeNode root) {
        if (root == null) return "[]";
        List<Integer> res = new ArrayList<>();
        Queue<TreeNode> q = new LinkedList<>();
        q.add(root);
        while(!q.isEmpty()) {
            TreeNode curr = q.poll();
            if (curr != null) {
                res.add(curr.val);
                q.add(curr.left);
                q.add(curr.right);
            } else {
                res.add(null);
            }
        }
        // Trim trailing nulls
        while(res.size() > 0 && res.get(res.size()-1) == null) {
            res.remove(res.size()-1);
        }
        StringBuilder sb = new StringBuilder("[");
        for(int i=0; i<res.size(); i++) {
            sb.append(res.get(i) == null ? "null" : res.get(i));
            if(i < res.size()-1) sb.append(",");
        }
        sb.append("]");
        return sb.toString();
    }
    
    // Convert ListNode output back to array string format
    public static String listNodeToJSON(ListNode head) {
        if (head == null) return "[]";
        StringBuilder sb = new StringBuilder("[");
        ListNode curr = head;
        while(curr != null) {
            sb.append(curr.val);
            if (curr.next != null) sb.append(",");
            curr = curr.next;
        }
        sb.append("]");
        return sb.toString();
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
            scriptName: "OARecall.java",
            dockerCmd: `docker run --rm -i --net none --memory 384m --cpus 1 -v ${volumeMap} -w /usr/src/app eclipse-temurin:21-jdk sh -c "javac OARecall.java && java OARecall"`,
            setupPromises
        };
    }
}
import { CodeGenerator, ExecutionContext, GeneratorResult } from "./CodeGenerator";
import fs from 'fs/promises';
import path from 'path';

export class JavaGenerator implements CodeGenerator {
    generate(context: ExecutionContext): GeneratorResult {
        const { userCode, className, functionName, schema, testCaseInputs, tmpDir, volumeMap } = context;

        // Extract first input just to figure out parameter names (schema keys) safely
        let firstParsed: any = {};
        try {
            firstParsed = JSON.parse(testCaseInputs[0] || "{}");
        } catch (e) {}

        let schemaKeys = schema?.order;
        if (!schemaKeys) {
            if (Array.isArray(firstParsed)) {
                schemaKeys = firstParsed.map((_, i) => String(i));
            } else {
                const propKeys = Object.keys(schema?.properties || {});
                if (propKeys.length > 0) {
                    schemaKeys = propKeys;
                } else if (schema?.type && typeof schema.type === 'string' && schema.type !== 'object') {
                    schemaKeys = ['single_arg'];
                } else {
                    const realKeys = Object.keys(schema || {}).filter((k: string) => !['type', 'minDepth', 'maxDepth', 'edgeCases', 'minLength', 'maxLength', 'minSize', 'maxSize', 'minVal', 'maxVal', 'minN', 'maxN', 'min', 'max', 'min_depth', 'max_depth', 'null_probability', 'cases', 'items', 'order', 'properties'].includes(k));
                    if (realKeys.length > 0) {
                        schemaKeys = realKeys;
                    } else {
                        schemaKeys = ['single_arg'];
                    }
                }
            }
        }

        // We stringify the entire test cases array, leaving it exactly as raw parsed JSON objects
        const testcasesJson = JSON.stringify(testCaseInputs.map(inputStr => {
            try {
                return JSON.parse(inputStr || "{}");
            } catch (e) {
                return {};
            }
        }));

        const testcasesFile = path.join(tmpDir, 'testcases.json');
        const setupPromises = [fs.writeFile(testcasesFile, testcasesJson, 'utf8')];

        const schemaKeysJavaStr = schemaKeys.map((k: string) => `"${k}"`).join(", ");
        const cleanUserCode = userCode.replace(/public\s+class\s+([a-zA-Z0-9_]+)/g, 'class $1');

        const fullScript = `
import java.util.*;
import java.lang.reflect.*;
import java.nio.file.*;
import java.nio.charset.StandardCharsets;

public class OARecall {
    @SuppressWarnings("unchecked")
    public static void main(String[] args) {
        System.out.println("\\n---EXEC_RESULT---");
        System.out.print("[");
        
        try {
            String tcContent = new String(Files.readAllBytes(Paths.get("testcases.json")), StandardCharsets.UTF_8).trim();
            List<Object> rawTestCases = (List<Object>) JsonAdapter.parse(tcContent);
            String[] schemaKeys = new String[]{${schemaKeysJavaStr}};
            
            ${className} instance = new ${className}();
            Method targetMethod = null;
            for (Method m : instance.getClass().getDeclaredMethods()) {
                if (m.getName().equals("${functionName}")) {
                    targetMethod = m;
                    break;
                }
            }
            if (targetMethod == null) throw new NoSuchMethodException("Method ${functionName} not found in ${className}");
            
            Type[] paramTypes = targetMethod.getGenericParameterTypes();
            
            for (int i = 0; i < rawTestCases.size(); i++) {
                try {
                    Object rawTestCase = rawTestCases.get(i);
                    Object[] finalArgs = buildArguments(rawTestCase, paramTypes, schemaKeys);
                    
                    long start = System.nanoTime();
                    Object result = targetMethod.invoke(instance, finalArgs);
                    long end = System.nanoTime();
                    
                    System.out.print("{\\"success\\": true, \\"result\\": " + toJSON(result) + ", \\"runtimeMs\\": " + ((end - start) / 1000000.0) + "}");
                } catch (InvocationTargetException e) {
                    System.out.print("{\\"success\\": false, \\"error\\": \\"" + escapeJson(e.getCause().toString()) + "\\", \\"stack\\": \\"" + arrayToString(e.getCause().getStackTrace()) + "\\"}");
                } catch (Exception e) {
                    System.out.print("{\\"success\\": false, \\"error\\": \\"" + escapeJson(e.toString()) + "\\", \\"stack\\": \\"" + arrayToString(e.getStackTrace()) + "\\"}");
                }
                
                if (i < rawTestCases.size() - 1) System.out.print(",");
            }
        } catch (Exception e) {
             System.out.print("{\\"success\\": false, \\"error\\": \\"" + escapeJson(e.toString()) + "\\", \\"stack\\": \\"" + arrayToString(e.getStackTrace()) + "\\"}");
        }
        System.out.println("]");
    }
    
    private static String escapeJson(String s) {
        if (s == null) return "null";
        return s.replace("\\\\", "\\\\\\\\").replace("\\"", "\\\\\\\"").replace("\\n", "\\\\n").replace("\\r", "\\\\r").replace("\\t", "\\\\t");
    }

    @SuppressWarnings("unchecked")
    private static Object[] buildArguments(Object rawArgs, Type[] paramTypes, String[] schemaKeys) throws Exception {
        Object[] args = new Object[paramTypes.length];
        
        List<Object> argsList = null;
        Map<String, Object> argsMap = null;
        
        if (rawArgs instanceof List) {
            argsList = (List<Object>) rawArgs;
        } else if (rawArgs instanceof Map) {
            argsMap = (Map<String, Object>) rawArgs;
        }
        
        for (int i = 0; i < paramTypes.length; i++) {
            Object rawArgVal = null;
            if (argsList != null) {
                // Positional fetch
                if (argsList.size() == 1 && argsList.get(0) instanceof Map && schemaKeys.length > i) {
                    rawArgVal = ((Map<String, Object>) argsList.get(0)).get(schemaKeys[i]);
                } else if (i < argsList.size()) {
                    rawArgVal = argsList.get(i);
                }
            } else if (argsMap != null) {
                // Key-based fetch
                if (i < schemaKeys.length && argsMap.containsKey(schemaKeys[i])) {
                    rawArgVal = argsMap.get(schemaKeys[i]);
                } else if (argsMap.size() == 1) { // Fallback if schema key misses
                    rawArgVal = argsMap.values().iterator().next();
                } else {
                    rawArgVal = rawArgs;
                }
            } else {
                rawArgVal = rawArgs;
            }
            args[i] = JSONConverter.convertToType(rawArgVal, paramTypes[i]);
        }
        return args;
    }

    public static class JSONConverter {
        @SuppressWarnings("unchecked")
        public static Object convertToType(Object val, Type type) throws Exception {
            if (val == null) return null;
            
            Class<?> clazz = null;
            if (type instanceof Class) clazz = (Class<?>) type;
            else if (type instanceof ParameterizedType) clazz = (Class<?>) ((ParameterizedType) type).getRawType();
            
            if (clazz == null) return val;

            if (clazz == int.class || clazz == Integer.class) return toInt(val);
            if (clazz == long.class || clazz == Long.class) return toLong(val);
            if (clazz == double.class || clazz == Double.class) return toDouble(val);
            if (clazz == float.class || clazz == Float.class) return toDouble(val).floatValue();
            if (clazz == boolean.class || clazz == Boolean.class) return toBoolean(val);
            if (clazz == String.class) return val.toString();
            if (clazz == char.class || clazz == Character.class) return val.toString().charAt(0);
            
            if (clazz == TreeNode.class) return buildTree(val);
            if (clazz == ListNode.class) return buildList(val);

            if (clazz.isArray()) {
                Class<?> componentType = clazz.getComponentType();
                if (componentType == int.class) return toIntArray(val);
                if (componentType == double.class) return toDoubleArray(val);
                if (componentType == String.class) return toStringArray(val);
                if (componentType == char.class) {
                    String[] sArr = toStringArray(val);
                    if (sArr.length > 0 && sArr[0] != null) return sArr[0].toCharArray();
                    return new char[0];
                }
                if (componentType.isArray() && componentType.getComponentType() == int.class) return to2DIntArray(val);
                if (componentType.isArray() && componentType.getComponentType() == char.class) return to2DCharArray(val);
            }

            if (List.class.isAssignableFrom(clazz)) {
                if (!(val instanceof List)) return val;
                List<Object> rawList = (List<Object>) val;
                Type innerType = Object.class;
                if (type instanceof ParameterizedType) {
                    innerType = ((ParameterizedType) type).getActualTypeArguments()[0];
                }
                List<Object> result = new ArrayList<>();
                for (Object item : rawList) {
                    result.add(convertToType(item, innerType));
                }
                return result;
            }

            if (Map.class.isAssignableFrom(clazz)) {
                // Simplified, could recurse for specific Map<K,V>
                return val;
            }

            return val;
        }

        private static Integer toInt(Object val) {
            if (val instanceof Number) return ((Number) val).intValue();
            if (val instanceof String) return Double.valueOf(((String) val).trim()).intValue(); // Safe parsing from double-like string
            return 0;
        }

        private static Long toLong(Object val) {
            if (val instanceof Number) return ((Number) val).longValue();
            if (val instanceof String) return Double.valueOf(((String) val).trim()).longValue();
            return 0L;
        }

        private static Double toDouble(Object val) {
            if (val instanceof Number) return ((Number) val).doubleValue();
            if (val instanceof String) return Double.parseDouble(((String) val).trim());
            return 0.0;
        }

        private static Boolean toBoolean(Object val) {
            if (val instanceof Boolean) return (Boolean) val;
            if (val instanceof String) return Boolean.parseBoolean(((String) val).trim());
            return false;
        }

        private static int[] toIntArray(Object val) {
            if (!(val instanceof List)) return new int[0];
            List<?> list = (List<?>) val;
            int[] arr = new int[list.size()];
            for (int i = 0; i < list.size(); i++) arr[i] = toInt(list.get(i));
            return arr;
        }

        private static double[] toDoubleArray(Object val) {
            if (!(val instanceof List)) return new double[0];
            List<?> list = (List<?>) val;
            double[] arr = new double[list.size()];
            for (int i = 0; i < list.size(); i++) arr[i] = toDouble(list.get(i));
            return arr;
        }

        private static String[] toStringArray(Object val) {
            if (!(val instanceof List)) return new String[0];
            List<?> list = (List<?>) val;
            String[] arr = new String[list.size()];
            for (int i = 0; i < list.size(); i++) {
                Object item = list.get(i);
                arr[i] = item == null ? null : item.toString();
            }
            return arr;
        }

        private static int[][] to2DIntArray(Object val) {
            if (!(val instanceof List)) return new int[0][0];
            List<?> list = (List<?>) val;
            int[][] arr = new int[list.size()][];
            for (int i = 0; i < list.size(); i++) arr[i] = toIntArray(list.get(i));
            return arr;
        }

        private static char[][] to2DCharArray(Object val) {
            if (!(val instanceof List)) return new char[0][0];
            List<?> list = (List<?>) val;
            char[][] arr = new char[list.size()][];
            for (int i = 0; i < list.size(); i++) {
                String[] sArr = toStringArray(list.get(i));
                arr[i] = new char[sArr.length];
                for (int j = 0; j < sArr.length; j++) {
                    if (sArr[j] != null && sArr[j].length() > 0) arr[i][j] = sArr[j].charAt(0);
                }
            }
            return arr;
        }

        @SuppressWarnings("unchecked")
        private static TreeNode buildTree(Object val) {
            if (val == null) return null;
            List<?> list = null;
            if (val instanceof List) {
                list = (List<?>) val;
            } else if (val instanceof Map) {
                return buildTreeFromMap((Map<String,Object>) val);
            } else {
                 return null;
            }
            
            if (list.isEmpty()) return null;
            Object firstOrNull = list.get(0);
            if (firstOrNull == null) return null;
            
            TreeNode root = new TreeNode(toInt(firstOrNull));
            Queue<TreeNode> q = new LinkedList<>();
            q.add(root);
            int i = 1;
            while (!q.isEmpty() && i < list.size()) {
                TreeNode curr = q.poll();
                Object leftVal = list.get(i++);
                if (leftVal != null) {
                    curr.left = new TreeNode(toInt(leftVal));
                    q.add(curr.left);
                }
                if (i < list.size()) {
                    Object rightVal = list.get(i++);
                    if (rightVal != null) {
                        curr.right = new TreeNode(toInt(rightVal));
                        q.add(curr.right);
                    }
                }
            }
            return root;
        }

        private static TreeNode buildTreeFromMap(Map<String,Object> m) {
            if (m == null) return null;
            int val = m.containsKey("val") ? toInt(m.get("val")) : (m.containsKey("value") ? toInt(m.get("value")) : 0);
            TreeNode node = new TreeNode(val);
            if (m.containsKey("left")) node.left = buildTree(m.get("left"));
            if (m.containsKey("right")) node.right = buildTree(m.get("right"));
            return node;
        }

        private static ListNode buildList(Object val) {
            if (!(val instanceof List)) return null;
            List<?> list = (List<?>) val;
            if (list.isEmpty()) return null;
            
            ListNode dummy = new ListNode(0);
            ListNode curr = dummy;
            for (Object item : list) {
                if (item != null) {
                    curr.next = new ListNode(toInt(item));
                    curr = curr.next;
                }
            }
            return dummy.next;
        }
    }

    public static class JsonAdapter {
        public static Object parse(String json) {
            json = json.trim();
            if (json.startsWith("[")) return parseList(json);
            if (json.startsWith("{")) return parseMap(json);
            if (json.startsWith("\\"")) {
                String unquoted = json.substring(1, json.length() - 1);
                return unquoted.replace("\\\\\\\"", "\\"").replace("\\\\\\\\", "\\\\").replace("\\\\n", "\\n").replace("\\\\t", "\\t").replace("\\\\r", "\\r");
            }
            if (json.equals("true")) return true;
            if (json.equals("false")) return false;
            if (json.equals("null")) return null;
            try { return Double.parseDouble(json); } catch (Exception e) {}
            return json;
        }

        private static List<Object> parseList(String json) {
            List<Object> list = new ArrayList<>();
            String inner = json.substring(1, json.length() - 1).trim();
            if (inner.isEmpty()) return list;
            int level = 0;
            boolean inQuotes = false;
            boolean inEscape = false;
            StringBuilder sb = new StringBuilder();
            
            for (int i = 0; i < inner.length(); i++) {
                char c = inner.charAt(i);
                if (inEscape) {
                    sb.append(c);
                    inEscape = false;
                    continue;
                }
                if (c == '\\\\') {
                    inEscape = true;
                    sb.append(c);
                    continue;
                }
                if (c == '"') inQuotes = !inQuotes;
                
                if (!inQuotes) {
                    if (c == '[' || c == '{') level++;
                    if (c == ']' || c == '}') level--;
                }
                if (c == ',' && level == 0 && !inQuotes) {
                    list.add(parse(sb.toString().trim()));
                    sb = new StringBuilder();
                } else {
                    sb.append(c);
                }
            }
            list.add(parse(sb.toString().trim()));
            return list;
        }

        private static Map<String, Object> parseMap(String json) {
            Map<String, Object> map = new LinkedHashMap<>();
            String inner = json.substring(1, json.length() - 1).trim();
            if (inner.isEmpty()) return map;
            int level = 0;
            boolean inQuotes = false;
            boolean inEscape = false;
            StringBuilder sb = new StringBuilder();
            String key = null;
            
            for (int i = 0; i < inner.length(); i++) {
                char c = inner.charAt(i);
                if (inEscape) {
                    sb.append(c);
                    inEscape = false;
                    continue;
                }
                if (c == '\\\\') {
                    inEscape = true;
                    sb.append(c);
                    continue;
                }
                if (c == '"') inQuotes = !inQuotes;
                
                if (!inQuotes) {
                    if (c == '[' || c == '{') level++;
                    if (c == ']' || c == '}') level--;
                    if (c == ':' && level == 0) {
                        key = sb.toString().trim();
                        if (key.startsWith("\\"")) key = key.substring(1, key.length() - 1);
                        sb = new StringBuilder();
                        continue;
                    }
                }
                if (c == ',' && level == 0 && !inQuotes) {
                    map.put(key, parse(sb.toString().trim()));
                    sb = new StringBuilder();
                } else {
                    sb.append(c);
                }
            }
            map.put(key, parse(sb.toString().trim()));
            return map;
        }
    }

    public static String toJSON(Object obj) {
        if (obj == null) return "null";
        if (obj instanceof String) return "\\"" + escapeJson((String)obj) + "\\"";
        if (obj instanceof Number || obj instanceof Boolean) return obj.toString();
        
        if (obj instanceof TreeNode) return treeNodeToJSON((TreeNode)obj);
        if (obj instanceof ListNode) return listNodeToJSON((ListNode)obj);
        
        if (obj instanceof int[]) return Arrays.toString((int[])obj).replace(" ", "");
        if (obj instanceof double[]) return Arrays.toString((double[])obj).replace(" ", "");
        if (obj instanceof boolean[]) return Arrays.toString((boolean[])obj).replace(" ", "");
        if (obj instanceof char[]) return "\\"" + escapeJson(new String((char[])obj)) + "\\"";
        
        if (obj.getClass().isArray()) {
            StringBuilder sb = new StringBuilder("[");
            int len = Array.getLength(obj);
            for(int i=0; i<len; i++) {
                sb.append(toJSON(Array.get(obj, i)));
                if (i < len-1) sb.append(",");
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
        if (obj instanceof Map) {
            Map<?, ?> map = (Map<?, ?>)obj;
            StringBuilder sb = new StringBuilder("{");
            int i = 0;
            for(Map.Entry<?, ?> entry : map.entrySet()) {
                sb.append("\\"").append(escapeJson(entry.getKey().toString())).append("\\":");
                sb.append(toJSON(entry.getValue()));
                if (i < map.size() - 1) sb.append(",");
                i++;
            }
            sb.append("}");
            return sb.toString();
        }
        return "\\"" + escapeJson(obj.toString()) + "\\""; 
    }
    
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
            sb.append(escapeJson(el.toString())).append("\\\\n");
        }
        return sb.toString();
    }
}

// --- Data Structures for Tree/List Problems ---
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

// --- User Solution ---
${cleanUserCode}
`;

        return {
            fullScript,
            scriptName: "OARecall.java",
            dockerCmd: `docker run --rm -i --net none --memory 384m --cpus 1 -v ${volumeMap} -w /usr/src/app eclipse-temurin:21-jdk sh -c "java OARecall.java"`,
            setupPromises
        };
    }
}
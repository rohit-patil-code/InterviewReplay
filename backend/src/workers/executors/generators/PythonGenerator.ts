import { CodeGenerator, ExecutionContext, GeneratorResult } from "./CodeGenerator";

/**
 * Extracts the raw type annotation for each parameter (excluding 'self')
 * from the user's Python function signature.
 * e.g. "def maxDepth(self, root: Optional[TreeNode]) -> int:"
 * returns ['Optional[TreeNode]']
 * e.g. "def twoSum(self, nums: List[int], target: int):"
 * returns ['List[int]', 'int']
 * Works even when there are NO type annotations (returns empty strings for those params).
 */
function extractPythonParamTypes(code: string, funcName: string): string[] {
    const stripped = code.replace(/#[^\n]*/g, '');
    const match = stripped.match(
        new RegExp(`def\\s+${funcName}\\s*\\(self(?:\\s*,\\s*)?([^)]*)\\)`, 's')
    );
    if (!match || !match[1].trim()) return [];
    return match[1].trim().split(',').map((p: string) => {
        const trimmed = p.trim();
        const colonIdx = trimmed.indexOf(':');
        if (colonIdx === -1) return ''; // no type annotation
        return trimmed.slice(colonIdx + 1).trim().replace(/\s*=\s*.*$/, '').trim(); // strip default value
    });
}

export class PythonGenerator implements CodeGenerator {
    generate(context: ExecutionContext): GeneratorResult {
        const { userCode, className, functionName, schema, testCaseInputs, tmpDir, volumeMap } = context;

        let firstParsed: any = {};
        try {
            firstParsed = JSON.parse(testCaseInputs[0] || "{}");
        } catch (e) {}

        let schemaKeys = schema?.order;
        if (!schemaKeys) {
            if (Array.isArray(firstParsed)) {
                schemaKeys = firstParsed.map((_: any, i: number) => String(i));
            } else {
                const propKeys = Object.keys(schema?.properties || {});
                if (propKeys.length > 0) {
                    schemaKeys = propKeys;
                } else if (schema?.type && typeof schema.type === 'string' && schema.type !== 'object') {
                    schemaKeys = ['single_arg'];
                } else {
                    const realKeys = Object.keys(schema || {}).filter((k: string) => !['type','minDepth','maxDepth','edgeCases','minLength','maxLength','minSize','maxSize','minVal','maxVal','minN','maxN','min','max','min_depth','max_depth','null_probability','cases','items','order','properties'].includes(k));
                    schemaKeys = realKeys.length > 0 ? realKeys : ['single_arg'];
                }
            }
        }

        // Schema-based types (may be empty/incomplete)
        const schemaTypes: Record<string, string> = {};
        schemaKeys.forEach((k: string, argIdx: number) => {
            let sType = schema?.properties?.[k]?.type;
            if (!sType && Array.isArray(schema?.order)) {
                sType = schema.order[argIdx]?.type || schema.order[argIdx]?.dataType;
            }
            if (!sType) {
                sType = schema?.type;
                if (!sType && schema && typeof schema === 'object') sType = schema[k];
            }
            if (sType) schemaTypes[k] = sType;
        });

        // PRIMARY: Extract param types from the user's Python function signature (type annotations)
        const paramAnnotations = extractPythonParamTypes(userCode, functionName);

        // CROSS-TEST TREE DETECTION: Scan ALL test cases per arg index.
        // If ANY test case for an arg contains null values it's a tree.
        // This means empty-tree inputs like [] still get build_tree() called correctly.
        const argIsLikelyTree: boolean[] = schemaKeys.map((k: string, argIdx: number) => {
            // Already determined from annotation or schema
            const ann = (paramAnnotations[argIdx] || '').toLowerCase();
            const stype = (schemaTypes[k] || '').toLowerCase();
            if (ann.includes('treenode') || stype.includes('treenode') || stype === 'tree') return true;
            // Check all test cases for null values in this argument position
            return testCaseInputs.some((inputStr: string) => {
                try {
                    const parsed = JSON.parse(inputStr || '{}');
                    let val: any = null;
                    if (Array.isArray(parsed) && argIdx < parsed.length) val = parsed[argIdx];
                    else if (typeof parsed === 'object' && parsed !== null) val = parsed[k];
                    return Array.isArray(val) && val.some((v: any) => v === null);
                } catch { return false; }
            });
        });

        // JSON.stringify produces lowercase true/false — Python needs True/False
        const argIsLikelyTreePy = '[' + argIsLikelyTree.map((v: boolean) => v ? 'True' : 'False').join(', ') + ']';

        const driverCode = `

import json
import time
import traceback

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def build_tree(data):
    if data is None or not isinstance(data, list) or len(data) == 0 or data[0] is None:
        return None
    # Handle object-format trees the AI sometimes generates: {"val": 3, "left": {...}}
    if isinstance(data, dict):
        node = TreeNode(data.get('val', data.get('value', 0)))
        node.left = build_tree(data.get('left'))
        node.right = build_tree(data.get('right'))
        return node
    root = TreeNode(data[0])
    q = [root]
    i = 1
    while len(q) > 0 and i < len(data):
        curr = q.pop(0)
        if i < len(data) and data[i] is not None:
            curr.left = TreeNode(data[i])
            q.append(curr.left)
        i += 1
        if i < len(data) and data[i] is not None:
            curr.right = TreeNode(data[i])
            q.append(curr.right)
        i += 1
    return root

def build_list(data):
    if not data or not isinstance(data, list): return None
    dummy = ListNode(0)
    curr = dummy
    for p in data:
        if p is not None:
            curr.next = ListNode(p)
            curr = curr.next
    return dummy.next

def serialize_result(result):
    if result is None:
        return None
    if isinstance(result, TreeNode):
        # BFS serialize back to array
        out = []
        q = [result]
        while q:
            node = q.pop(0)
            if node is None:
                out.append(None)
            else:
                out.append(node.val)
                q.append(node.left)
                q.append(node.right)
        while out and out[-1] is None:
            out.pop()
        return out
    if isinstance(result, ListNode):
        out = []
        curr = result
        while curr:
            out.append(curr.val)
            curr = curr.next
        return out
    return result

if __name__ == '__main__':
    try:
        with open('inputs.json', 'r', encoding='utf-8') as f:
            all_inputs = json.loads(f.read())

        instance = ${className}()
        if not hasattr(instance, '${functionName}'):
            raise Exception("Function '${functionName}' not found on class '${className}'.")

        print("\\n---EXEC_RESULT---")
        results = []
        schema_keys = ${JSON.stringify(schemaKeys)}
        schema_types = ${JSON.stringify(schemaTypes)}
        param_annotations = ${JSON.stringify(paramAnnotations)}
        # Pre-computed tree flags: True if ANY test case for this arg had null values.
        # This ensures empty-tree inputs [] still get build_tree() called.
        arg_is_tree = ${argIsLikelyTreePy}

        for tc_idx, parsed_input in enumerate(all_inputs):
            try:
                args = []
                for i, k in enumerate(schema_keys):
                    # Extract raw value positionally from the input array
                    if isinstance(parsed_input, list) and i < len(parsed_input):
                        val = parsed_input[i]
                    elif isinstance(parsed_input, dict):
                        val = parsed_input.get(k)
                    else:
                        val = parsed_input

                    # Determine type: Priority 1 = Python type annotation, Priority 2 = schema type
                    annotation = (param_annotations[i] if i < len(param_annotations) else '').lower()
                    stype = schema_types.get(k, '').lower()

                    # Use pre-computed cross-test-case tree flag as primary signal.
                    # Falls back to annotation/schema, then per-test null heuristic.
                    is_tree = (i < len(arg_is_tree) and arg_is_tree[i]) or \
                              'treenode' in annotation or 'treenode' in stype or stype == 'tree'
                    is_list = (not is_tree) and \
                              ('listnode' in annotation or 'listnode' in stype or stype in ('linked_list', 'list'))

                    if not is_tree and not is_list:
                        # Last-resort heuristic: null values in val signal a tree
                        if isinstance(val, list) and any(v is None for v in val):
                            is_tree = True

                    if is_tree:
                        val = build_tree(val)  # build_tree([]) correctly returns None
                    elif is_list:
                        val = build_list(val)

                    args.append(val)

                start = time.perf_counter()
                result = getattr(instance, '${functionName}')(*args)
                end = time.perf_counter()

                results.append({
                    "success": True,
                    "result": serialize_result(result),
                    "runtimeMs": (end - start) * 1000
                })
            except Exception as e:
                results.append({
                    "success": False,
                    "error": str(e),
                    "stack": traceback.format_exc()
                })
        print(json.dumps(results))
    except Exception as e:
        print("\\n---EXEC_RESULT---")
        print(json.dumps([{"success": False, "error": "Fatal Python Error: " + str(e), "stack": traceback.format_exc()}]))
`;

        return {
            fullScript: `${userCode}\n\n${driverCode}`,
            scriptName: "runner.py",
            dockerCmd: `docker run --rm -i --net none --memory 256m --cpus 1 -v ${volumeMap} -w /usr/src/app python:3.9-slim python runner.py`,
            setupPromises: []
        };
    }
}

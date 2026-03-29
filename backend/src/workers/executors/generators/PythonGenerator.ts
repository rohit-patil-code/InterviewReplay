import { CodeGenerator, ExecutionContext, GeneratorResult } from "./CodeGenerator";

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
                schemaKeys = firstParsed.map((_, i) => String(i));
            } else {
                const propKeys = Object.keys(schema?.properties || {});
                if (propKeys.length > 0) {
                    schemaKeys = propKeys;
                } else if (schema?.type && typeof schema.type === 'string' && schema.type !== 'object') {
                    schemaKeys = ['single_arg'];
                } else {
                    const realKeys = Object.keys(schema || {}).filter((k: string) => !['type','minDepth','maxDepth','edgeCases','minLength','maxLength','minSize','maxSize','minVal','maxVal','minN','maxN','min','max','min_depth','max_depth','null_probability','cases','items','order','properties'].includes(k));
                    if (realKeys.length > 0) {
                        schemaKeys = realKeys;
                    } else {
                        schemaKeys = ['single_arg'];
                    }
                }
            }
        }
        
        const schemaTypes: Record<string, string> = {};
        schemaKeys.forEach((k: string, argIdx: number) => {
            let sType = schema?.properties?.[k]?.type;
            if (!sType && Array.isArray(schema?.order)) {
                sType = schema.order[argIdx]?.type || schema.order[argIdx]?.dataType;
            }
            if (!sType) {
                sType = schema?.type;
                if (!sType && schema && typeof schema === 'object') {
                    sType = schema[k];
                }
            }
            schemaTypes[k] = sType;
        });

        const driverCode = `

import json
import time

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
    if not data or not isinstance(data, list) or len(data) == 0 or data[0] is None:
        return None
    root = TreeNode(data[0])
    q = [root]
    i = 1
    while len(q) > 0 and i < len(data):
        curr = q.pop(0)
        if data[i] is not None:
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

if __name__ == '__main__':
    try:
        with open('inputs.json', 'r', encoding='utf-8') as f:
            all_inputs = json.loads(f.read())
            
        instance = ${className}()
        if not hasattr(instance, '${functionName}'):
            raise Exception("Function '${functionName}' not found on class '${className}'.")
            
        print("\\n---EXEC_RESULT---")
        results = []
        for tc_idx, parsed_input in enumerate(all_inputs):
            try:
                schema_keys = ${JSON.stringify(schemaKeys)}
                schema_types = ${JSON.stringify(schemaTypes)}
                args = []
                for i, k in enumerate(schema_keys):
                    val = None
                    if schema.get('type') and schema.get('type') != 'object':
                        val = parsed_input
                    else:
                        if isinstance(parsed_input, list):
                            if i < len(parsed_input):
                                val = parsed_input[i]
                        elif isinstance(parsed_input, dict):
                            val = parsed_input.get(k)
                        
                    stype = schema_types.get(k)
                    if stype == "TreeNode":
                        val = build_tree(val)
                    elif stype == "ListNode":
                        val = build_list(val)
                        
                    args.append(val)
                
                start = time.perf_counter()
                result = getattr(instance, '${functionName}')(*args)
                end = time.perf_counter()
                
                results.append({
                    "success": True,
                    "result": result,
                    "runtimeMs": (end - start) * 1000
                })
            except Exception as e:
                import traceback
                results.append({
                    "success": False,
                    "error": str(e),
                    "stack": traceback.format_exc()
                })
        print(json.dumps(results))
    except Exception as e:
        import traceback
        print("\\n---EXEC_RESULT---")
        print(json.dumps([{"success": False, "error": "Fatal Python Batch Error: " + str(e), "stack": traceback.format_exc()}]))
`;

        return {
            fullScript: `${userCode}\n\n${driverCode}`,
            scriptName: "runner.py",
            dockerCmd: `docker run --rm -i --net none --memory 256m --cpus 1 -v ${volumeMap} -w /usr/src/app python:3.9-slim python runner.py`,
            setupPromises: []
        };
    }
}

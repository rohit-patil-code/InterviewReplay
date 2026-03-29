import { CodeGenerator, ExecutionContext, GeneratorResult } from "./CodeGenerator";

export class NodeGenerator implements CodeGenerator {
    generate(context: ExecutionContext): GeneratorResult {
        const { userCode, className, functionName, schema, tmpDir, volumeMap } = context;

        let schemaKeys = schema.order;
        if (!schemaKeys) {
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
const fs = require('fs');

class TreeNode {
    constructor(val = 0, left = null, right = null) {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}

class ListNode {
    constructor(val = 0, next = null) {
        this.val = val;
        this.next = next;
    }
}

function buildTree(data) {
    if (!data || !Array.isArray(data) || data.length === 0 || data[0] === null) return null;
    const root = new TreeNode(data[0]);
    const q = [root];
    let i = 1;
    while (q.length > 0 && i < data.length) {
        const curr = q.shift();
        if (data[i] !== null && data[i] !== undefined) {
            curr.left = new TreeNode(data[i]);
            q.push(curr.left);
        }
        i++;
        if (i < data.length && data[i] !== null && data[i] !== undefined) {
            curr.right = new TreeNode(data[i]);
            q.push(curr.right);
        }
        i++;
    }
    return root;
}

function buildList(data) {
    if (!data || !Array.isArray(data)) return null;
    let dummy = new ListNode(0);
    let curr = dummy;
    for (let p of data) {
        if (p !== null && p !== undefined) {
            curr.next = new ListNode(p);
            curr = curr.next;
        }
    }
    return dummy.next;
}

async function main() {
    try {
        const rawInputs = fs.readFileSync('inputs.json', 'utf-8');
        const allInputs = JSON.parse(rawInputs);
        const results = [];
        
        // Make sure the class is accessible if it's not exported
        const instance = new ${className}();
        
        if (typeof instance.${functionName} !== 'function') {
            throw new Error("Function '${functionName}' not found on class '${className}'.");
        }

        const schemaKeys = ${JSON.stringify(schemaKeys)};
        const schemaTypes = ${JSON.stringify(schemaTypes)};
        const schemaType = ${JSON.stringify(schema?.type)}; 

        for (let tcIdx = 0; tcIdx < allInputs.length; tcIdx++) {
            let parsedInput = allInputs[tcIdx];
            try {
                const args = [];
                for (let i = 0; i < schemaKeys.length; i++) {
                    const k = schemaKeys[i];
                    let val = null;
                    if (schemaType && schemaType !== 'object') {
                        val = parsedInput;
                    } else {
                        if (Array.isArray(parsedInput)) {
                            val = parsedInput[i];
                        } else if (typeof parsedInput === 'object' && parsedInput !== null) {
                            val = parsedInput[k];
                        }
                    }

                    const stype = schemaTypes[k];
                    if (stype === "TreeNode") {
                        val = buildTree(val);
                    } else if (stype === "ListNode") {
                        val = buildList(val);
                    }
                    args.push(val);
                }

                const start = process.hrtime.bigint();
                const result = instance.${functionName}(...args);
                const end = process.hrtime.bigint();
                
                results.push({
                    success: true,
                    result: result,
                    runtimeMs: Number(end - start) / 1000000.0
                });
            } catch (err) {
                results.push({
                    success: false,
                    error: err.message || String(err),
                    stack: err.stack
                });
            }
        }
        
        console.log("\\n---EXEC_RESULT---");
        console.log(JSON.stringify(results));
    } catch (err) {
        console.log("\\n---EXEC_RESULT---");
        console.log(JSON.stringify([{ success: false, error: "Fatal Node Batch Error: " + err.message, stack: err.stack }]));
    }
}

main();
`;

        return {
            fullScript: `${userCode}\\n\\n${driverCode}`,
            scriptName: "runner.js",
            dockerCmd: `docker run --rm -i --net none --memory 256m --cpus 1 -v ${volumeMap} -w /usr/src/app node:20-slim node runner.js`,
            setupPromises: []
        };
    }
}

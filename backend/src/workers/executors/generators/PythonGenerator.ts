import { CodeGenerator, ExecutionContext, GeneratorResult } from "./CodeGenerator";

export class PythonGenerator implements CodeGenerator {
    generate(context: ExecutionContext): GeneratorResult {
        const { userCode, className, functionName, schema, tmpDir, volumeMap } = context;

        const driverCode = `

import json
import time

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
                if isinstance(parsed_input, list) and len(parsed_input) == 1 and isinstance(parsed_input[0], dict):
                    parsed_input = parsed_input[0]
                    
                schema_keys = ${JSON.stringify(schema.order || Object.keys(schema?.properties || schema || {}))}
                args = [parsed_input.get(k) for k in schema_keys]
                
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

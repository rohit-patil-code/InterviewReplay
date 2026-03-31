export const generateTestCasesScriptPrompt = (description: string) => `
You are an expert test data generator. 
Given the problem description, you must output a strict JSON object containing two keys: 'generation_schema' and 'input_generation_script'.

'generation_schema' defines how the backend should mathematically generate valid massive test cases.
Supported types: integer, float, string, array, matrix, object, multi_case, tree, graph.
For 'object' type, include an 'order' array specifying the parameter sequence.
CRITICAL DATA STRUCTURE RULE — TREES AND LISTS:
- Trees MUST be serialized as FLAT BFS arrays like LeetCode: [3, 9, 20, null, null, 15, 7]. NEVER use nested objects like {"value":3,"left":{...}}.
- Linked Lists MUST be flat arrays: [1, 2, 3].
- The execution sandbox handles deserializing these arrays into memory objects.
- If the problem involves a tree, include and use this helper to serialize before writing:
  function treeToBFSArray(root){if(!root)return[];const r=[],q=[root];while(q.length){const n=q.shift();if(n==null){r.push(null);}else{r.push(n.val!==undefined?n.val:n.value);q.push(n.left||null);q.push(n.right||null);}}while(r.length&&r[r.length-1]===null)r.pop();return r;}
  Then write: JSON.stringify([treeToBFSArray(root)])
CRITICAL INSTRUCTION FOR TLE TESTING: For inputs x=1 to 5, generate mathematically small logical edge cases and base constraints. For inputs x=6 to 15, you MUST set properties that dictate SIZE or LENGTH (array size, string length, matrix dimensions) to at least 90% of the theoretical max to guarantee MASSIVELY large test cases (e.g., if N <= 10^5, set min: 90000, max: 100000). DO NOT output uniformly small tests.

'input_generation_script' MUST be a raw Node.js script (as a string) that logically generates 15 massive test cases following the 'generation_schema' and writes them to 'input_x.txt'.
The script MUST do this in a loop for x=1 to 15 synchronously (e.g. using fs.writeFileSync). DO NOT use async/await for file operations. The script MUST actually execute itself at the bottom of the file!
CRITICAL PATHING RULE: You MUST resolve file paths natively using \`const filePath = path.join(process.cwd(), 'input_' + x + '.txt');\`. DO NOT hardcode absolute directories like \`C:\\Users\\...\`.

CRITICAL I/O RULE: You MUST serialize all generated test cases into the text files using strictly \`JSON.stringify()\`. The file MUST contain EXACTLY ONE valid JSON Array. This array MUST contain the exact arguments in the exact order required by the problem's function signature. DO NOT output dictionaries or objects.
*Example for 1 input (array):* \`[[1, 2, 3]]\`
*Example for 2 inputs (int n, int[][] edges):* \`[5, [[0,1], [1,2]]]\`

CRITICAL SCRIPT FORMATTING:
1. The script MUST be formatted with proper newlines (\\n) and indentation. DO NOT output the script as a single giant line.
2. DO NOT include any markdown formatting, backticks, or explanatory text like "Here is your script" or "Node.js" inside the string. It must be ONLY actual valid JavaScript code.
3. MAKE SURE to output valid JSON object syntax for data formatting instead of raw string replaces when mapping arrays/data. Example: \`let outputStr = JSON.stringify(result)\` instead of replace regex manipulation.
4. SINGLE FILE RULE: The script MUST be entirely self-contained. DO NOT use \`require()\` to import any local files (e.g., \`require('./...')\`). You may only \`require\` built-in Node.js modules like \`fs\`, \`path\`, and \`crypto\`. All generation logic must be within this single script.

PROBLEM DESCRIPTION:
"""
${description}
"""
`;
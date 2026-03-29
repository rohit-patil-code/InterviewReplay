export const generateSolutionPrompt = (description: string, generationSchema: string, sampleInput: string) => `
Analyze this problem: "${description}".
We are using a SCHEMA-DRIVEN GENERATION MODEL. You MUST NOT generate executable scripts to generate inputs.
You must ONLY output a strict JSON object containing three main keys: 'starter_code', 'bruteforce_script', and 'optimal_script'.

GENERATION SCHEMA FOR REFERENCE:
"""
${generationSchema}
"""

'starter_code' provides professional function signatures for Java, C++, and Python. The keys in the JSON MUST be strictly lowercased: "python", "java", "cpp".
CRITICAL FORMATTING: For ALL languages (especially Python), the starter code MUST be wrapped inside a Class definition (e.g., \`class Solution:\` for Python). Do not just output the raw function!
The starter code MUST ONLY be the empty function signature and class definition. DO NOT INCLUDE ANY SOLUTION LOGIC OR COMMENTS.

'bruteforce_script' MUST be a Node.js script that loops ONLY from x=1 to 5. It reads 'input_x.txt', runs a naive/safe brute-force algorithm, and writes strictly to 'bf_output_x.txt'.
'optimal_script' MUST be a Node.js script that loops from x=1 to 15. It reads 'input_x.txt', runs your highly optimized algorithm natively, and writes expected output to 'output_x.txt'.
Both scripts must be raw strings containing valid Node.js code, execute themselves synchronously at the bottom, and use fs.readFileSync/writeFileSync natively. Do not use async/await for file operations.
CRITICAL PATHING RULE: You MUST resolve file paths natively using \`const filePath = path.join(process.cwd(), 'input_' + x + '.txt');\`. DO NOT hardcode absolute directories like \`C:\\Users\\...\`.

CRITICAL I/O RULE: You MUST read the input files using \`JSON.parse(fs.readFileSync(filepath, 'utf8'))\`. The input files are strictly JSON formatted. DO NOT use \`.split(',')\` or manual string parsing to read the inputs.

CRITICAL DATA STRUCTURE RULE: If the problem involves a Binary Tree or Linked List, the input files contain LeetCode-style flat arrays (e.g. \`[3,9,20,null,null,15,7]\`). Your scripts MUST define and call these helpers to deserialize them before passing to your algorithm:
function buildTree(arr){if(!arr||arr.length===0||arr[0]===null)return null;const root={val:arr[0],left:null,right:null};const q=[root];let i=1;while(q.length>0&&i<arr.length){const c=q.shift();if(arr[i]!=null){c.left={val:arr[i],left:null,right:null};q.push(c.left);}i++;if(i<arr.length&&arr[i]!=null){c.right={val:arr[i],left:null,right:null};q.push(c.right);}i++;}return root;}
function buildList(arr){if(!arr||arr.length===0)return null;const d={val:0,next:null};let c=d;for(const v of arr){c.next={val:v,next:null};c=c.next;}return d.next;}
Call \`buildTree(parsedInput)\` or \`buildList(parsedInput)\` to convert the parsed array. DO NOT pass the raw array directly to your algorithm.

CRITICAL: Here is the EXACT literal string format of the input files you will be reading. 
SAMPLE INPUT FILE CONTENT:
"""
${sampleInput}
"""
You MUST parse this string correctly using JSON.parse() before passing the arguments to your algorithm.

CRITICAL SCRIPT FORMATTING:
1. The script MUST be formatted with proper newlines (\\n) and indentation. DO NOT output the script as a single giant line.
2. DO NOT include any markdown formatting, backticks, or explanatory text like "Here is your script" or "Node.js" inside the string. It must be ONLY actual valid JavaScript code.
3. MAKE SURE to output valid JSON object syntax for data formatting instead of raw string replaces when mapping arrays/data. Example: \`let outputStr = JSON.stringify(result)\` instead of replace regex manipulation.
4. SINGLE FILE RULE: The script MUST be entirely self-contained. DO NOT use \`require()\` to import any local files (e.g., \`require('./...')\`). You may only \`require\` built-in Node.js modules like \`fs\`, \`path\`, and \`crypto\`. All algorithm logic must be within this single script.

Return strictly as a single valid JSON object. DO NOT include markdown backticks like \`\`\`json.
`;
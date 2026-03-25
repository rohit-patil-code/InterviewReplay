export const generateSolutionPrompt = (description: string, generationSchema: string, sampleInput: string) => `
Analyze this problem: "${description}".
We are using a SCHEMA-DRIVEN GENERATION MODEL. You MUST NOT generate executable scripts to generate inputs.
You must ONLY output a strict JSON object containing two main keys: 'starter_code' and 'solution_script'.

GENERATION SCHEMA FOR REFERENCE:
"""
${generationSchema}
"""

'starter_code' provides professional function signatures for Java, C++, and Python. The starter code MUST ONLY be the empty function signature and class definition. DO NOT INCLUDE ANY SOLUTION LOGIC OR COMMENTS.

'solution_script' MUST be a raw Node.js script (as a string) that reads 'input_x.txt', parses the data, runs an optimal solution to the problem, and writes the exact expected output to 'output_x.txt'.
The script MUST do this in a loop for x=1 to 15 synchronously (e.g. using fs.readFileSync and fs.writeFileSync). DO NOT use async/await for file operations. The script MUST actually execute itself at the bottom of the file!
CRITICAL PATHING RULE: You MUST resolve file paths natively using \`const filePath = path.join(process.cwd(), 'input_' + x + '.txt');\`. DO NOT hardcode absolute directories like \`C:\\Users\\...\`.

CRITICAL I/O RULE: You MUST read the input files using \`JSON.parse(fs.readFileSync(filepath, 'utf8'))\`. The input files are strictly JSON formatted. DO NOT use \`.split(',')\` or manual string parsing to read the inputs.

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
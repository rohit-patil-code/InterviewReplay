export const generateSolutionPrompt = (description: string, generationSchema: string) => `
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

CRITICAL SCRIPT FORMATTING:
1. The script MUST be formatted with proper newlines (\\n) and indentation. DO NOT output the script as a single giant line.
2. DO NOT include any markdown formatting, backticks, or explanatory text like "Here is your script" or "Node.js" inside the string. It must be ONLY actual valid JavaScript code.
3. MAKE SURE to output valid JSON object syntax for data formatting instead of raw string replaces when mapping arrays/data. Example: \`let outputStr = JSON.stringify(result)\` instead of replace regex manipulation.

Return strictly as a single valid JSON object. DO NOT include markdown backticks like \`\`\`json.
`;

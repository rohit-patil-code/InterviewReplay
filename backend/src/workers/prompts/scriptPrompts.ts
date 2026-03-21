export const generateTestCasesScriptPrompt = (description: string) => `
You are an expert test data generator. 
Given the problem description, you must output a strict JSON object containing two keys: 'generation_schema' and 'input_generation_script'.

'generation_schema' defines how the backend should mathematically generate valid massive test cases.
Supported types: integer, float, string, array, matrix, object, multi_case, tree, graph.
For 'object' type, include an 'order' array specifying the parameter sequence.
CRITICAL INSTRUCTION FOR TLE TESTING: For properties that dictate SIZE or LENGTH (like array size, string length, matrix dimensions, nodes in graph/tree), you MUST set 'min' to at least 90% of the theoretical maximum constraint to guarantee massively large test cases. If N <= 10^5, set min: 90000, max: 100000. DO NOT output small fallback ranges like 1-10.

'input_generation_script' MUST be a raw Node.js script (as a string) that logically generates 15 massive test cases following the 'generation_schema' and writes them to 'input_x.txt'.
The script MUST do this in a loop for x=1 to 15 synchronously (e.g. using fs.writeFileSync). DO NOT use async/await for file operations. The script MUST actually execute itself at the bottom of the file!
CRITICAL PATHING RULE: You MUST resolve file paths natively using \`const filePath = path.join(process.cwd(), 'input_' + x + '.txt');\`. DO NOT hardcode absolute directories like \`C:\\Users\\...\`.

CRITICAL I/O RULE: You MUST serialize all generated test cases into the text files using strictly \`JSON.stringify()\`. Do not use manual string concatenation, newlines, or CSV formats. The file must contain exactly one valid JSON array or JSON object representing the input arguments.

CRITICAL SCRIPT FORMATTING:
1. The script MUST be formatted with proper newlines (\\n) and indentation. DO NOT output the script as a single giant line.
2. DO NOT include any markdown formatting, backticks, or explanatory text like "Here is your script" or "Node.js" inside the string. It must be ONLY actual valid JavaScript code.
3. MAKE SURE to output valid JSON object syntax for data formatting instead of raw string replaces when mapping arrays/data. Example: \`let outputStr = JSON.stringify(result)\` instead of replace regex manipulation.

PROBLEM DESCRIPTION:
"""
${description}
"""
`;
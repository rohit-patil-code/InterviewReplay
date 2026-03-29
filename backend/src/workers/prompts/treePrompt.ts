export const generateTreeScriptPrompt = (description: string) => `
You are an expert test data generator specializing in Tree structures.
Given the problem description, you must output a strict JSON object containing two keys: 'generation_schema' and 'input_generation_script'.

'generation_schema' defines the schema logic. MUST document the structure as a 'tree'.

'input_generation_script' MUST be a raw Node.js script (as a string) that logically generates EXACTLY ONE test case.
CRUCIAL CONSTRAINT: You must generate a tree structure bounded to exactly 100 nodes.
CRITICAL DATA STRUCTURE RULE: Trees MUST be generated as strictly flat LeetCode-style arrays (e.g. [3, 9, 20, null, null, 15, 7]). The execution sandbox handles interpreting these flat arrays as actual memory trees. NEVER generate nested JSON objects for nodes like {"val": 3, "left": ...}.

The script MUST write this single test case to 'input_100.txt' in the current working directory synchronously.
CRITICAL PATHING: \`const filePath = path.join(process.cwd(), 'input_100.txt');\`

CRITICAL I/O RULE: You MUST serialize all test cases to the file via \`JSON.stringify()\`.
The file output MUST consist of EXACTLY ONE valid JSON Array containing the function arguments.
*Example Tree input:* \`[[1, null, 2, 3]]\`

CRITICAL SCRIPT FORMATTING:
1. Valid JavaScript only, no markdown wrapping.
2. Self-contained code, no external requires beyond \`fs\` / \`path\`.

PROBLEM DESCRIPTION:
"""
${description}
"""
`;

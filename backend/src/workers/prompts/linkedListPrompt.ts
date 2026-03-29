export const generateLinkedListScriptPrompt = (description: string) => `
You are an expert test data generator specializing in LinkedList generation.
Given the problem description, you must output a strict JSON object containing two keys: 'generation_schema' and 'input_generation_script'.

'generation_schema' defines the logic. MUST document the structure as a 'linkedlist'.

'input_generation_script' MUST be a raw Node.js script (as a string) that logically generates EXACTLY ONE test case.
CRUCIAL CONSTRAINT: You must generate a linked list spanning precisely 100 nodes in length.
CRITICAL DATA STRUCTURE RULE: Linked Lists MUST be generated strictly as flat parameter arrays (e.g. \`[1, 2, 3, 4, 5]\`). The sandbox environment interprets flat arrays as actual memory-based ListNodes. NEVER generate nested JSON objects for nodes like \`{"val": 1, "next": ...}\`.

The script MUST write this single test case to 'input_100.txt' in the current working directory synchronously.
CRITICAL PATHING: \`const filePath = path.join(process.cwd(), 'input_100.txt');\`

CRITICAL I/O RULE: You MUST serialize all test cases to the file via \`JSON.stringify()\`.
The file output MUST consist of EXACTLY ONE valid JSON Array containing the function arguments.
*Example LinkedList Input:* \`[[1, 2, 3, 4]]\`

CRITICAL SCRIPT FORMATTING:
1. Valid JavaScript only, no markdown wrapping.
2. Self-contained code, no external requires beyond \`fs\` / \`path\`.

PROBLEM DESCRIPTION:
"""
${description}
"""
`;

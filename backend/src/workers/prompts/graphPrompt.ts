export const generateGraphScriptPrompt = (description: string) => `
You are an expert test data generator specializing in Graphs structure.
Given the problem description, you must output a strict JSON object containing two keys: 'generation_schema' and 'input_generation_script'.

'generation_schema' defines the logic. MUST document the structure as a 'graph'.

'input_generation_script' MUST be a raw Node.js script (as a string) that logically generates EXACTLY ONE test case.
CRUCIAL CONSTRAINT: You must generate a graph spanning precisely 100 nodes/edges.
CRITICAL DATA STRUCTURE RULE: Graphs MUST be represented universally as arrays/matrices (e.g. edge arrays \`[[0,1], [1,2]]\` or adjacency lists). DO NOT output class objects like "Graph()". Determine the matrix format expected from the parameters strictly.

The script MUST write this single test case to 'input_100.txt' in the current working directory synchronously.
CRITICAL PATHING: \`const filePath = path.join(process.cwd(), 'input_100.txt');\`

CRITICAL I/O RULE: You MUST serialize all test cases to the file via \`JSON.stringify()\`.
The file output MUST consist of EXACTLY ONE valid JSON Array containing the function arguments.
*Example Graph Input:* \`[100, [[0,1], [1,2], [2,3]]]\`

CRITICAL SCRIPT FORMATTING:
1. Valid JavaScript only, no markdown wrapping.
2. Self-contained code, no external requires beyond \`fs\` / \`path\`.

PROBLEM DESCRIPTION:
"""
${description}
"""
`;

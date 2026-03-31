export const generateTreeScriptPrompt = (description: string) => `
You are an expert test data generator specializing in Tree structures.
Given the problem description, you must output a strict JSON object containing two keys: 'generation_schema' and 'input_generation_script'.

'generation_schema' defines the schema logic. MUST document the structure as a 'tree'.

'input_generation_script' MUST be a raw Node.js script (as a string) that logically generates EXACTLY ONE test case.
CRUCIAL CONSTRAINT: You must generate a tree bounded to exactly 100 nodes.

=== MANDATORY: HOW TO SERIALIZE TREES ===
Tree inputs MUST be written as a FLAT BFS array — exactly like LeetCode shows them.
Example: [3, 9, 20, null, null, 15, 7]
NEVER write nested objects like {"value": 3, "left": {"value": 9, ...}}.

You MUST include this helper verbatim in your script and call it before writing:
\`\`\`
function treeToBFSArray(root) {
    if (!root) return [];
    const result = [];
    const queue = [root];
    while (queue.length > 0) {
        const node = queue.shift();
        if (node === null || node === undefined) {
            result.push(null);
        } else {
            result.push(node.val !== undefined ? node.val : node.value);
            queue.push(node.left || null);
            queue.push(node.right || null);
        }
    }
    while (result.length > 0 && result[result.length - 1] === null) result.pop();
    return result;
}
\`\`\`
Then serialize: \`JSON.stringify([treeToBFSArray(rootNode)])\`

The script MUST write this single test case to 'input_100.txt' in the current working directory synchronously.
CRITICAL PATHING: \`const filePath = path.join(process.cwd(), 'input_100.txt');\`

CRITICAL I/O RULE: You MUST serialize all test cases to the file via \`JSON.stringify()\`.
The file output MUST consist of EXACTLY ONE valid JSON Array containing the function arguments.
*Example Tree input (root only):* \`[[1, null, 2, 3]]\`
*Example Tree + int input (root, k):* \`[[1, null, 2, 3], 2]\`

CRITICAL SCRIPT FORMATTING:
1. Valid JavaScript only, no markdown wrapping.
2. Self-contained code, no external requires beyond \`fs\` / \`path\`.

PROBLEM DESCRIPTION:
"""
${description}
"""
`;



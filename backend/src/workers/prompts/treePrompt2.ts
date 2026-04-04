export const treePrompt2 = (aiOutput: string) => `
You are a STRICT validation and auto-repair agent for AI-generated Tree test case scripts.

You will receive a JSON object from another AI. Your job is to:
1. Validate it against ALL rules below
2. If ANY rule fails → FIX the script
3. Return a fully corrected version

You MUST ALWAYS return a strict JSON object with EXACTLY:
{
  "generation_schema": "...",
  "input_generation_script": "..."
}

NO explanations. NO markdown.

====================================================
INPUT FROM PREVIOUS AI
====================================================
${aiOutput}

====================================================
VALIDATION RULES (ALL MANDATORY)
====================================================

-------------------------------
1. TREE STRUCTURE RULES
-------------------------------
- Must be a valid binary tree
- Must contain EXACTLY 100 NON-NULL nodes
- All nodes must be reachable from rootNode
- No disconnected nodes allowed
- No cycles allowed (each node has only one parent)

-------------------------------
2. ROOT VARIABLE RULE
-------------------------------
- Root MUST be stored in a variable named EXACTLY:
  rootNode

-------------------------------
3. TREE SHAPE RULE
-------------------------------
- Tree MUST NOT be completely skewed (like a linked list)
- Must have reasonable branching (balanced or randomized)

-------------------------------
4. SCRIPT REQUIREMENTS
-------------------------------
- Must be valid Node.js
- Only allowed imports:
  const fs = require('fs');
  const path = require('path');

- Must define TreeNode:
function TreeNode(val, left = null, right = null)

-------------------------------
5. BFS SERIALIZATION (MANDATORY)
-------------------------------
The script MUST include EXACTLY this function:

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

-------------------------------
6. SERIALIZATION RULE
-------------------------------
- MUST use:
  JSON.stringify([treeToBFSArray(rootNode)])

- DO NOT manually construct BFS arrays
- MUST call the helper

-------------------------------
7. 🚨 CRITICAL ARGUMENT DEPTH RULE
-------------------------------
- Output MUST have EXACTLY 2 levels of arrays

✔ VALID:
[[1, null, 2]]

❌ INVALID:
[[[1,2]]]        (extra nesting)
[ [ [ ... ] ] ]  (depth 3)
{"root":[...]}   (object)

- MUST NOT wrap treeToBFSArray again

-------------------------------
8. NULL HANDLING RULE
-------------------------------
- Nulls must be preserved for structure
- Only trailing nulls may be trimmed (handled by helper)

-------------------------------
9. FILE OUTPUT RULE
-------------------------------
Must use EXACT:

const filePath = path.join(process.cwd(), 'input_100.txt');
fs.writeFileSync(filePath, JSON.stringify([treeToBFSArray(rootNode)]));

-------------------------------
10. SINGLE TEST CASE RULE
-------------------------------
- Only ONE test case allowed
- Output must be ONE JSON array

-------------------------------
11. INPUT ARGUMENT RULE
-------------------------------
- ONLY ONE argument allowed: root
- DO NOT include extra parameters

-------------------------------
12. FINAL OUTPUT SHAPE RULE
-------------------------------
Before returning:
- Output must start with [[
- Output must end with ]]
- MUST NOT contain [[[ or ]]]

-------------------------------
13. NODE COUNT ENFORCEMENT
-------------------------------
- MUST explicitly ensure exactly 100 nodes are created
- Do NOT rely on vague loops
- Must track node creation count

====================================================
REPAIR INSTRUCTIONS
====================================================

If ANY rule is violated:

- Fix the script completely
- If structure is broken → rebuild tree generation logic
- Ensure EXACTLY 100 nodes
- Ensure correct BFS serialization
- Remove extra nesting
- Enforce rootNode variable
- Ensure no cycles / no disconnected nodes
- Ensure valid tree shape (not skewed)

If script is too broken → REWRITE from scratch

====================================================
FINAL VALIDATION BEFORE RETURN
====================================================

Ensure:
- Node count = 100
- rootNode exists
- BFS helper present
- Uses JSON.stringify([treeToBFSArray(rootNode)])
- No triple nesting
- File path correct
- Valid Node.js code
- Exactly one test case

====================================================
OUTPUT FORMAT (STRICT JSON ONLY)
====================================================

Return ONLY:

{
  "generation_schema": "...",
  "input_generation_script": "..."
}
`;
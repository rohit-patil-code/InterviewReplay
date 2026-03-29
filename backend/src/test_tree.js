function buildTree(data) {
        if (!data || data.trim().length === 0 || data.trim() === "[]") return null;
        data = data.replace(/\\[|\\]/g, "").trim();
        if (data.length === 0) return null;
        const parts = data.split(",");
        if (parts.length === 0 || parts[0].trim() === "null") return null;
        
        const root = { val: parseInt(parts[0].trim()), left: null, right: null };
        const q = [root];
        let i = 1;
        
        while (q.length > 0 && i < parts.length) {
            const curr = q.shift();
            
            const leftVal = parts[i++].trim();
            if (leftVal !== "null") {
                curr.left = { val: parseInt(leftVal), left: null, right: null };
                q.push(curr.left);
            }
            
            if (i < parts.length) {
                const rightVal = parts[i++].trim();
                if (rightVal !== "null") {
                    curr.right = { val: parseInt(rightVal), left: null, right: null };
                    q.push(curr.right);
                }
            }
        }
        return root;
}
function maxDepth(root) {
    if (root == null) return 0;
    return Math.max(maxDepth(root.left), maxDepth(root.right)) + 1;
}

console.log("No brackets:", maxDepth(buildTree("3,9,20,null,null,15,7")));
console.log("With brackets:", maxDepth(buildTree("[3,9,20,null,null,15,7]")));

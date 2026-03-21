function sanitizeInputToJson(inputStr, schema) {
    if (!inputStr) return "{}";
    try {
        const parsed = JSON.parse(inputStr);
        if (typeof parsed === 'object' && parsed !== null) return inputStr;
    } catch(e) {}

    const order = schema.order || Object.keys(schema?.properties || schema || {});
    if (order.length > 0) {
        let jsonObj = {};
        let matchedSomething = false;
        for (const key of order) {
            const regex = new RegExp(`${key}\\s*=\\s*(.+?)(?:,\\s*[a-zA-Z0-9_]+\\s*=|$|\\n)`, 'i');
            const match = inputStr.match(regex);
            
            console.log("Key:", key, "Regex matched:", match?.[1]);
            if (match && match[1]) {
                matchedSomething = true;
                let valStr = match[1].trim();
                try {
                    jsonObj[key] = JSON.parse(valStr);
                } catch(e) {
                    jsonObj[key] = valStr;
                }
            }
        }
        if (matchedSomething) return JSON.stringify(jsonObj);

        if (order.length === 1) {
            const cleanStr = inputStr.replace(/^["'](.*)["']$/, '$1');
            return JSON.stringify({ [order[0]]: cleanStr }); 
        }
    }
    return JSON.stringify(inputStr);
}

const schema = { order: ["s"] };

console.log("1:", sanitizeInputToJson('Input: s = "leetcode"', schema));
console.log("2:", sanitizeInputToJson('s = "aabb"', schema));
console.log("3:", sanitizeInputToJson('s="aabb"', schema));
console.log("4:", sanitizeInputToJson('"leetcode"', schema));

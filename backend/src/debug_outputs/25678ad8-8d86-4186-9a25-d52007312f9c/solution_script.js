const fs = require('fs');
const path = require('path');
for (let x = 1; x <= 15; x++) {
    const filePath = path.join(process.cwd(), 'input_' + x + '.txt');
    const inputStr = fs.readFileSync(filePath, 'utf8');
    const s = inputStr.trim();
    let maxLength = 0;
    for (let i = 0; i < s.length; i++) {
        const charSet = new Set();
        for (let j = i; j < s.length; j++) {
            if (charSet.has(s[j])) {
                break;
            }
            charSet.add(s[j]);
            maxLength = Math.max(maxLength, j - i + 1);
        }
    }
    const outputStr = maxLength.toString();
    const outputFilePath = path.join(process.cwd(), 'output_' + x + '.txt');
    fs.writeFileSync(outputFilePath, outputStr);
}

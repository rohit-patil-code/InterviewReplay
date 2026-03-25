const fs = require('fs');
const path = require('path');

for (let x = 1; x <= 15; x++) {
    const filePath = path.join(process.cwd(), 'input_' + x + '.txt');
    const outputFilePath = path.join(process.cwd(), 'output_' + x + '.txt');
    const inputData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const result = [];
    inputData.forEach((input) => {
        const str = input.str;
        const charCount = {};
        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            if (charCount[char] === undefined) {
                charCount[char] = 1;
            } else {
                charCount[char]++;
            }
        }
        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            if (charCount[char] === 1) {
                result.push(i);
                break;
            }
        }
        if (result.length === 0) {
            result.push(-1);
        }
    });
    let outputStr = JSON.stringify(result);
    fs.writeFileSync(outputFilePath, outputStr);
}
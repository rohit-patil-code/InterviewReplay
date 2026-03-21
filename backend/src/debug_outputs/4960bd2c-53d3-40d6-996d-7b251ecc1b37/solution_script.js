const fs = require('fs');
const path = require('path');

function firstUniqChar(s) {
    if (typeof s !== 'string') {
        return -1;
    }
    let charCount = {};
    for (let char of s) {
        if (charCount[char]) {
            charCount[char]++;
        } else {
            charCount[char] = 1;
        }
    }
    for (let i = 0; i < s.length; i++) {
        if (charCount[s[i]] === 1) {
            return i;
        }
    }
    return -1;
}

for (let x = 1; x <= 15; x++) {
    const filePath = path.join(process.cwd(), 'input_' + x + '.txt');
    let input = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (input && input.string) {
        let result = firstUniqChar(input.string);
        let outputStr = JSON.stringify(result);
        const outputPath = path.join(process.cwd(), 'output_' + x + '.txt');
        fs.writeFileSync(outputPath, outputStr);
    } else {
        const outputPath = path.join(process.cwd(), 'output_' + x + '.txt');
        fs.writeFileSync(outputPath, JSON.stringify(-1));
    }
}
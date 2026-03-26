
const fs = require('fs');
const path = require('path');

function firstUniqChar(s) {
    const charCount = {};
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
    const filepath = path.join(process.cwd(), 'input_' + x + '.txt');
    const input = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    let result = [];
    for (let testCase of input) {
        result.push(firstUniqChar(testCase.s));
    }
    let outputStr = JSON.stringify(result);
    const outputFilePath = path.join(process.cwd(), 'output_' + x + '.txt');
    fs.writeFileSync(outputFilePath, outputStr);
}

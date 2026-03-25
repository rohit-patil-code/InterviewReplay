const fs = require('fs');
const path = require('path');

for (let x = 1; x <= 15; x++) {
    const filePath = path.join(process.cwd(), 'input_' + x + '.txt');
    const inputStr = JSON.parse(fs.readFileSync(filePath, 'utf8'))[0].str;
    const charCount = {};
    for (let i = 0; i < inputStr.length; i++) {
        const char = inputStr[i];
        if (!charCount[char]) {
            charCount[char] = 0;
        }
        charCount[char]++;
    }
    let result = null;
    for (let i = 0; i < inputStr.length; i++) {
        const char = inputStr[i];
        if (charCount[char] === 1) {
            result = char;
            break;
        }
    }
    const outputFilePath = path.join(process.cwd(), 'output_' + x + '.txt');
    // Check if result is not null before writing to file
    if (result !== null) {
        fs.writeFileSync(outputFilePath, result);
    } else {
        // Handle the case when result is null
        fs.writeFileSync(outputFilePath, '');
    }
}
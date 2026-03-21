const fs = require('fs');
const path = require('path');

function generateRandomString(length, chars) {
   let result = '';
   for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
   }
   return result;
}

for (let x = 1; x <= 15; x++) {
   let testCase = {
      string: generateRandomString(Math.floor(Math.random() * 10000) + 90000, 'abcdefghijklmnopqrstuvwxyz')
   };
   const filePath = path.join(process.cwd(), 'input_' + x + '.txt');
   let outputStr = JSON.stringify(testCase);
   fs.writeFileSync(filePath, outputStr);
}
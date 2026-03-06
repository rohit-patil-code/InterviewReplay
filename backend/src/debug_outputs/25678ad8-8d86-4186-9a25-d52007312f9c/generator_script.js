const fs = require('fs');
const path = require('path');

function generateRandomString(length) {
   let result = '';
   const characters = 'abcdefghijklmnopqrstuvwxyz';
   for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
   }
   return result;
}

for (let x = 1; x <= 15; x++) {
   let testCase = {
      s: generateRandomString(Math.floor(Math.random() * (100000 - 90000 + 1)) + 90000)
   };
   let outputStr = JSON.stringify(testCase);
   const filePath = path.join(process.cwd(), 'input_' + x + '.txt');
   fs.writeFileSync(filePath, outputStr);
}
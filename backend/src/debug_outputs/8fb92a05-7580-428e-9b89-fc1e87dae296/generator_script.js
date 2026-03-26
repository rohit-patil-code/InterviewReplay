const fs = require('fs');
const path = require('path');

for (let x = 1; x <= 15; x++) {
   let result = {};
   result.s = '';
   for (let i = 0; i < Math.floor(Math.random() * (100000 - 90000 + 1)) + 90000; i++) {
      result.s += String.fromCharCode(97 + Math.floor(Math.random() * 26));
   }
   const filePath = path.join(process.cwd(), 'input_' + x + '.txt');
   let outputStr = JSON.stringify([result]);
   fs.writeFileSync(filePath, outputStr);
}

const filePath = path.join(process.cwd(), 'input_1.txt');
let outputStr = JSON.stringify([{s: 'abcdefghijklmnopqrstuvwxyz'}]);
fs.writeFileSync(filePath, outputStr);
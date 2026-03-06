const fs = require('fs');
const path = require('path');

for (let x = 1; x <= 15; x++) {
   let cost = [];
   for (let i = 0; i < Math.floor(Math.random() * (100000 - 90000 + 1)) + 90000; i++) {
      cost.push(Math.floor(Math.random() * (1000 - 1 + 1)) + 1);
   }
   let outputStr = JSON.stringify(cost);

   const filePath = path.join(process.cwd(), 'input_' + x + '.txt');
   fs.writeFileSync(filePath, outputStr);
}
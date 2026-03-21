const fs = require('fs');
const path = require('path');

function generateTestData() {
   let data = [];
   for (let x = 1; x <= 15; x++) {
      let testCase = {
         cost: Array.from({ length: Math.floor(Math.random() * (100000 - 90000 + 1)) + 90000 }, () => Math.floor(Math.random() * 1001))
      };
      let filePath = path.join(process.cwd(), 'input_' + x + '.txt');
      fs.writeFileSync(filePath, JSON.stringify(testCase));
      data.push(testCase);
   }
}

generateTestData();
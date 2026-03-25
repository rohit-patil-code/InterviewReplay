const fs = require('fs');
      const path = require('path');
      const crypto = require('crypto');

      function generateRandomString(length) {
         const characters = 'abcdefghijklmnopqrstuvwxyz';
         let result = '';
         for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
         }
         return result;
      }

      for (let x = 1; x <= 15; x++) {
         const input = {
            str: generateRandomString(Math.floor(Math.random() * (100000 - 90000 + 1)) + 90000)
         };

         const filePath = path.join(process.cwd(), 'input_' + x + '.txt');
         const outputStr = JSON.stringify([input]);
         fs.writeFileSync(filePath, outputStr);
      }
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

for (let x = 1; x <= 15; x++) {
    let result = {};
    let str = '';

    for (let i = 0; i < crypto.randomInt(90000, 100001); i++) {
        str += crypto.randomBytes(1).toString('utf8').substr(0, 1).toLowerCase();
    }

    result.str = str;

    const filePath = path.join(process.cwd(), 'input_' + x + '.txt');
    fs.writeFileSync(filePath, JSON.stringify([result]));
}
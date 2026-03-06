const fs = require('fs');
const path = require('path');

for (let x = 1; x <= 15; x++) {
    const filePath = path.join(process.cwd(), 'input_' + x + '.txt');
    const inputData = fs.readFileSync(filePath, 'utf8');
    const cost = JSON.parse(inputData);
    
    let dp = new Array(cost.length);
    dp[0] = cost[0];
    dp[1] = cost[1];
    for (let i = 2; i < cost.length; i++) {
        dp[i] = Math.min(dp[i-1], dp[i-2]) + cost[i];
    }
    let result = Math.min(dp[cost.length - 1], dp[cost.length - 2]);
    
    let outputStr = JSON.stringify(result);
    const outputFilePath = path.join(process.cwd(), 'output_' + x + '.txt');
    fs.writeFileSync(outputFilePath, outputStr);
}

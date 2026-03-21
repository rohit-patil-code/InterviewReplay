
const fs = require('fs');
const path = require('path');

function minCostClimbingStairs(cost) {
    let n = cost.length;
    let dp = new Array(n);
    dp[0] = cost[0];
    dp[1] = cost[1];
    for (let i = 2; i < n; i++) {
        dp[i] = Math.min(dp[i - 1], dp[i - 2]) + cost[i];
    }
    return Math.min(dp[n - 1], dp[n - 2]);
}

for (let x = 1; x <= 15; x++) {
    const filePath = path.join(process.cwd(), 'input_' + x + '.txt');
    const inputData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const result = minCostClimbingStairs(inputData.cost);
    const outputStr = JSON.stringify(result);
    const outputFile = path.join(process.cwd(), 'output_' + x + '.txt');
    fs.writeFileSync(outputFile, outputStr);
}

/**
 * LEGACY ENTRY POINT
 * This file has been stripped of its monolithic background processing logic.
 * It now securely delegates all processing to the multi-agent `src/workers/index.ts` architecture using `tsx`.
 * Running `nodemon worker.mjs` triggers your updated Agent models securely.
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("[worker.mjs] Delegating background processing to Multi-Agent Workflow Engine...");

// We use `tsx` (TypeScript Execute) to securely compile and run the backend agent framework at runtime natively
const workerProcess = spawn('npx', ['tsx', path.join(__dirname, 'workers', 'index.ts')], {
    stdio: 'inherit',
    env: process.env,
    shell: true
});

workerProcess.on('exit', (code) => {
    console.log(`[worker.mjs] Multi-Agent Engine exited with code ${code}.`);
    process.exit(code || 0);
});

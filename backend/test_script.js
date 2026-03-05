require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    try {
        const res = await pool.query("SELECT solution_code FROM problems WHERE id = '0f20de01-955a-44f5-b553-b777715a1f38'");
        console.log("---- AI SCRIPT DUMP ----");
        console.log(res.rows[0].solution_code);
        console.log("------------------------");
    } finally {
        await pool.end();
    }
}
run().catch(console.error);

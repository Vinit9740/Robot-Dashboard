import { Pool } from "pg";

const pool = new Pool({
    host: 'db.jjeuvppkdibvydncfrjl.supabase.co',
    port: 5432,
    user: 'postgres',
    password: 'robo@18#mini',
    database: 'postgres',
    ssl: {
        rejectUnauthorized: false
    }
});

async function test() {
    try {
        console.log("Testing connection...");
        const res = await pool.query("SELECT NOW()");
        console.log("Success:", res.rows[0]);
    } catch (err: any) {
        console.error("Connection Failed:", err.message);
        console.error(err.stack);
    } finally {
        await pool.end();
    }
}

test();

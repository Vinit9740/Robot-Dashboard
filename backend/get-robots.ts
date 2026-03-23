import { pool } from './src/config/db';

async function getRobots() {
    try {
        const res = await pool.query('SELECT id, name, org_id FROM robots LIMIT 5');
        console.log('Robots:', JSON.stringify(res.rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

getRobots();

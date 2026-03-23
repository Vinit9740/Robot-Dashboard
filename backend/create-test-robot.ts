import { pool } from './src/config/db';
import bcrypt from 'bcryptjs';

async function createTestRobot() {
    const apiKey = 'test-robot-key-' + Date.now();
    const hash = await bcrypt.hash(apiKey, 10);
    const id = '11111111-2222-3333-4444-' + Math.random().toString(16).slice(2, 14);

    try {
        await pool.query(
            "INSERT INTO robots (id, name, org_id, api_key_hash, status) VALUES ($1, $2, $3, $4, $5)",
            [id, 'Test-Explorer', 1, hash, 'OFFLINE']
        );
        console.log('✅ Test Robot Created');
        console.log('ID:', id);
        console.log('API_KEY:', apiKey);
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

createTestRobot();

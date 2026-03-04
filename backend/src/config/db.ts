import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

// Using discrete fields is safer for passwords with special characters (@, #, etc.)
export const pool = new Pool({
    host: 'db.jjeuvppkdibvydncfrjl.supabase.co',
    port: 5432,
    user: 'postgres',
    password: 'robo@18#mini',
    database: 'postgres',
    ssl: {
        rejectUnauthorized: false // Required for Supabase external connections
    }
});

pool.on("connect", () => {
    console.log("✅ PostgreSQL Connected");
});

pool.on("error", (err) => {
    console.error("❌ PostgreSQL Pool Error:", err.message);
});

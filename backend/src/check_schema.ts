import { pool } from "./config/db";
import dotenv from "dotenv";
dotenv.config();

async function check() {
    try {
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'robots' AND column_name = 'ros_bridge_url'");
        if (res.rows.length === 0) {
            console.log("❌ Column 'ros_bridge_url' does not exist.");
        } else {
            console.log("✅ Column 'ros_bridge_url' exists.");
        }
    } catch (err) {
        console.error("❌ Error checking schema:", err);
    } finally {
        await pool.end();
    }
}
check();

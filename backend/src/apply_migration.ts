import { pool } from "./config/db";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

async function migrate() {
    try {
        const sqlPath = path.join(__dirname, "../../database/update_ros_schema.sql");
        const sql = fs.readFileSync(sqlPath, "utf8");
        console.log("📜 Executing migration...");
        await pool.query(sql);
        console.log("✅ Migration successful!");
    } catch (err) {
        console.error("❌ Migration failed:", err);
    } finally {
        await pool.end();
    }
}
migrate();

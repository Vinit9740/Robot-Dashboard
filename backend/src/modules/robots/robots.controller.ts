import { Response } from "express";
import { pool } from "../../config/db";
import { AuthRequest } from "../../middleware/auth.middleware";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import http from "http";
import { URL } from "url";
import mockDB from "../../data/mockDB";

export const createRobot = async (req: AuthRequest, res: Response) => {
    const { name, model } = req.body;
    const { orgId, role } = req.user;

    console.log(`🚀 Create Robot Request: Name=${name}, Model=${model}, Role=${role}, OrgId=${orgId}`);

    // Only admins can create robots
    if (role !== 'admin') {
        console.warn(`🚫 Unauthorized: Role ${role} attempted to create robot.`);
        return res.status(403).json({ message: "Only administrators can create robots" });
    }

    const rawApiKey = uuidv4();
    const hashedApiKey = await bcrypt.hash(rawApiKey, 10);

    try {
        // Try real database first
        const result = await pool.query(
            `INSERT INTO robots (id, org_id, name, model, api_key_hash, status)
         VALUES ($1, $2, $3, $4, $5, 'OFFLINE')
         RETURNING *`,
            [uuidv4(), orgId, name, model || 'Standard Unit', hashedApiKey]
        );

        res.json({ robot: result.rows[0], apiKey: rawApiKey });
    } catch (err: any) {
        console.error('❌ Database insert failed:', err.message);
        res.status(500).json({ message: "Deployment failed: Secure storage unavailable." });
    }
};

export const getRobots = async (req: AuthRequest, res: Response) => {
    const { userId, orgId, role } = req.user;

    try {
        let query: string;
        let params: any[] = [orgId];

        if (role === 'admin') {
            // Admins see all robots in their org
            query = "SELECT * FROM robots WHERE org_id = $1";
            params = [orgId];
        } else {
            // Non-admin users only see robots they are specifically assigned to
            // We ignore org_id here because assignment implies authorization
            query = `
                SELECT r.* 
                FROM robots r
                INNER JOIN user_robots ur ON r.id = ur.robot_id
                WHERE ur.user_id = $1
            `;
            params = [userId];
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err: any) {
        console.error('❌ Failed to fetch robots:', err.message);
        res.status(500).json({ message: "Unable to retrieve robot telemetry from secure node." });
    }
};

export const proxyVideoStream = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    
    try {
        const result = await pool.query("SELECT ros_bridge_url FROM robots WHERE id = $1", [id]);
        if (result.rows.length === 0 || !result.rows[0].ros_bridge_url) {
            return res.status(404).send("Robot video stream source not configured");
        }

        const bridgeUrl = result.rows[0].ros_bridge_url;
        const hostname = new URL(bridgeUrl).hostname;
        // Defaulting to web_video_server port 8080
        const videoUrl = `http://${hostname}:8080/stream?topic=/image_raw&type=mjpeg`;

        http.get(videoUrl, (proxyRes) => {
            res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
            proxyRes.pipe(res);
        }).on('error', (err) => {
            console.error(`❌ Video stream proxy error for robot ${id}:`, err.message);
            res.status(502).send("Robot video stream unreachable");
        });
    } catch (err: any) {
        console.error(`❌ DB error in video proxy:`, err.message);
        res.status(500).send("Internal server error");
    }
};

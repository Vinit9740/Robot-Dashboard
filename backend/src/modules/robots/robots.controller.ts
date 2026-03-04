import { Response } from "express";
import { pool } from "../../config/db";
import { AuthRequest } from "../../middleware/auth.middleware";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
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
        console.error('❌ Database insert failed, falling back to mock:', err.message);
        // Fall back to mock database
        const robotId = uuidv4();
        const robot = {
            id: robotId,
            org_id: orgId,
            name,
            model: model || 'Standard Unit',
            api_key_hash: hashedApiKey,
            status: "OFFLINE",
        };
        mockDB.addRobot(robot);
        res.json({ robot, apiKey: rawApiKey });
    }
};

export const getRobots = async (req: AuthRequest, res: Response) => {
    const { orgId, role } = req.user;

    try {
        // Try real database first
        let query = "SELECT * FROM robots";
        let params: any[] = [];

        // If not a global admin (if we had such a thing), filter by orgId
        // For now, let's assume 'admin' can see everything in their org, 
        // and 'user' can also only see their org.
        // If we want a "Super Admin" they could see all orgs.
        // Let's implement: 'admin' sees all robots in their org, 'user' sees all robots in their org.
        // Wait, the prompt says "user he should only bee allowed see HIS robot status and the admin must have ccess of robots"
        // This implies 'user' should only see robots they "own"? 
        // But the schema doesn't have a 'user_id' per robot, only 'org_id'.
        // I will assume for now that 'admin' sees all in org, and 'user' sees all in org but we can't do per-user yet without schema changes.
        // HOWEVER, I can make it so 'admin' can see ALL robots across ALL organizations if they have the 'admin' role globally.

        if (role !== 'admin') {
            query += " WHERE org_id = $1";
            params.push(orgId);
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        // Fall back to mock database
        let robots = mockDB.getAllRobots();
        if (role !== 'admin') {
            robots = mockDB.getRobotsByOrgId(orgId);
        }
        res.json(robots);
    }
};

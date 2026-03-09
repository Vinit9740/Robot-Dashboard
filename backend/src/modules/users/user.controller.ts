import { Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { AuthRequest } from "../../middleware/auth.middleware";
import { pool } from "../../config/db";
import { notifyUserUpdate } from "../../websocket/ws.server";

const getSupabaseAdmin = () => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing in .env. Admin features are disabled.");
    }

    return createClient(url, key, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
};


export const getPendingUsers = async (req: AuthRequest, res: Response) => {
    try {
        const { role } = req.user;
        if (role !== 'admin') {
            return res.status(403).json({ message: "Admin access required" });
        }

        // Supabase listUsers doesn't have a direct filter for app_metadata
        // So we fetch and filter manually
        const supabaseAdmin = getSupabaseAdmin();
        const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

        if (error) throw error;

        // Filter for users who are NOT verified and are NOT admins
        const pending = users.filter((user: any) => {
            const meta = user.app_metadata || {};
            const userRole = meta.role || 'user';
            return userRole !== 'admin' && meta.verified !== true;
        });

        res.json(pending.map((u: any) => ({
            id: u.id,
            email: u.email,
            created_at: u.created_at,
            user_metadata: u.user_metadata
        })));
    } catch (err: any) {
        console.error("❌ Failed to fetch pending users:", err.message);
        res.status(500).json({ message: err.message });
    }
};

export const verifyUser = async (req: AuthRequest, res: Response) => {
    try {
        const { role } = req.user;
        const { userId, robotIds } = req.body; // robotIds is optional array

        if (role !== 'admin') {
            return res.status(403).json({ message: "Admin access required" });
        }

        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        // 1. Update Supabase metadata non-destructively
        const supabaseAdmin = getSupabaseAdmin();

        // Fetch current user to preserve existing metadata (like roles)
        const { data: userObj, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (fetchError) throw fetchError;

        const currentMeta = userObj.user.app_metadata || {};
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { app_metadata: { ...currentMeta, verified: true } }
        );

        if (updateError) throw updateError;

        // 2. Handle Robot Assignments in PostgreSQL
        if (Array.isArray(robotIds)) {
            console.log(`📋 Updating assignments for ${userId}: [${robotIds.join(",")}]`);

            // Clear existing assignments first to prevent duplicates/stale data
            await pool.query("DELETE FROM user_robots WHERE user_id = $1", [userId]);

            if (robotIds.length > 0) {
                // Insert new assignments - Harden query construction
                const valuePlaceholders = robotIds.map((_, i) => `($1, $${i + 2})`).join(",");
                const query = `INSERT INTO user_robots (user_id, robot_id) VALUES ${valuePlaceholders}`;
                await pool.query(query, [userId, ...robotIds]);
                console.log(`📡 Successfully assigned ${robotIds.length} robots to user ${userId}`);
            }
        }

        // 3. Notify user via WebSocket if connected
        console.log(`🔔 Sending real-time sync signal to user ${userId}`);
        notifyUserUpdate(userId, { type: 'assignments_updated' });

        console.log(`✅ User ${userId} verified and assignments updated by admin.`);
        res.json({ message: "User verified and robots assigned successfully", user: userObj.user });
    } catch (err: any) {
        console.error("❌ Failed to verify/update user:", err.message);
        res.status(500).json({ message: `System error: ${err.message}` });
    }
};

export const getAllOperatives = async (req: AuthRequest, res: Response) => {
    try {
        const { role } = req.user;
        if (role !== 'admin') {
            return res.status(403).json({ message: "Admin access required" });
        }

        const supabaseAdmin = getSupabaseAdmin();
        const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
        if (authError) throw authError;

        // Fetch all assignments from PostgreSQL
        const assignmentsRes = await pool.query("SELECT * FROM user_robots");
        const assignmentsMap = assignmentsRes.rows.reduce((acc: any, row: any) => {
            if (!acc[row.user_id]) acc[row.user_id] = [];
            acc[row.user_id].push(row.robot_id);
            return acc;
        }, {});

        const operatives = users.map((u: any) => ({
            id: u.id,
            email: u.email,
            created_at: u.created_at,
            user_metadata: u.user_metadata,
            role: u.app_metadata?.role || 'user',
            verified: u.app_metadata?.verified === true,
            assignedRobots: assignmentsMap[u.id] || []
        }));

        res.json(operatives);
    } catch (err: any) {
        console.error("❌ Failed to fetch all operatives:", err.message);
        res.status(500).json({ message: err.message });
    }
};

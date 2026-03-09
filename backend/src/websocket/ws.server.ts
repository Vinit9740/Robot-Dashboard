import { WebSocketServer, WebSocket } from "ws";
import { pool } from "../config/db";
import bcrypt from "bcryptjs";
import { IncomingMessage } from "http";
import * as jose from "jose";
import { LOCAL_JWKS } from "../config/jwks.cache";

interface AuthenticatedClient extends WebSocket {
    type?: 'robot' | 'user';
    robotId?: string;
    orgId?: number;
    userId?: string;
}

// Registries for efficient broadcasting
const userClients = new Set<AuthenticatedClient>();
const robotClients = new Map<string, AuthenticatedClient>();

const ISSUER_URL = `https://jjeuvppkdibvydncfrjl.supabase.co/auth/v1`;
const JWKS_URL = `${ISSUER_URL}/.well-known/jwks.json`;

const remoteJWKS = jose.createRemoteJWKSet(new URL(JWKS_URL));
const localJWKS = jose.createLocalJWKSet(LOCAL_JWKS as any);

export const initWebSocket = (server: any) => {
    const wss = new WebSocketServer({ server });

    wss.on("connection", async (ws: AuthenticatedClient, req: IncomingMessage) => {
        try {
            const urlParams = new URLSearchParams(req.url?.split("?")[1]);
            const token = urlParams.get("token") || urlParams.get("apiKey");

            if (!token) {
                ws.close(1008, "Token required");
                return;
            }

            let userType: 'robot' | 'user' | null = null;
            let identifiedOrgId: number | null = null;
            let identifiedRobotId: string | null = null;
            let identifiedUserId: string | null = null;

            // 1. Robot Auth (API Key)
            try {
                const robotsResult = await pool.query("SELECT id, org_id, api_key_hash, name FROM robots");
                for (const robot of robotsResult.rows) {
                    if (robot.api_key_hash && await bcrypt.compare(token, robot.api_key_hash)) {
                        userType = 'robot';
                        identifiedRobotId = robot.id;
                        identifiedOrgId = robot.org_id;
                        console.log(`🤖 Robot authenticated: ${robot.name}`);
                        break;
                    }
                }
            } catch (dbErr: any) {
                console.error("❌ WS DB Auth Error (Robots):", dbErr.message);
            }

            // 2. User Auth (Supabase JWT)
            if (!userType) {
                try {
                    let result;
                    try {
                        result = await jose.jwtVerify(token, remoteJWKS, {
                            issuer: ISSUER_URL,
                            audience: "authenticated",
                            algorithms: ["ES256"]
                        });
                    } catch (e) {
                        result = await jose.jwtVerify(token, localJWKS, {
                            issuer: ISSUER_URL,
                            audience: "authenticated",
                            algorithms: ["ES256"]
                        });
                    }

                    const payload = result.payload as any;
                    const role = payload.app_metadata?.role || 'user';
                    const isVerified = payload.app_metadata?.verified === true;

                    if (role !== 'admin' && !isVerified) {
                        ws.close(1008, "Account awaiting verification");
                        return;
                    }

                    userType = 'user';
                    identifiedUserId = payload.sub;
                    identifiedOrgId = payload.app_metadata?.org_id || 1;
                    console.log(`👤 User authenticated: ${payload.email}`);
                } catch (err: any) {
                    console.warn(`⚠️ WS User Auth Failed: ${err.message}`);
                }
            }

            if (!userType) {
                ws.close(1008, "Invalid authentication");
                return;
            }

            ws.type = userType;
            ws.orgId = identifiedOrgId!;

            if (userType === 'user') {
                ws.userId = identifiedUserId!;
                userClients.add(ws);
            } else {
                ws.robotId = identifiedRobotId!;
                robotClients.set(ws.robotId, ws);
                await pool.query("UPDATE robots SET status = 'ONLINE' WHERE id = $1", [ws.robotId]);
                broadcastRobotUpdate(ws.robotId, { type: 'status_update', robotId: ws.robotId, status: 'ONLINE' });
            }

            ws.on("message", async (message: Buffer) => {
                try {
                    const data = JSON.parse(message.toString());

                    // --- Robot Message (Telemetry) ---
                    if (ws.type === 'robot' && ws.robotId) {
                        // Persist to DB asynchronously
                        pool.query(
                            `INSERT INTO telemetry (robot_id, org_id, battery, cpu, temperature, pose_x, pose_y, pose_theta)
                             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
                            [ws.robotId, ws.orgId, data.battery || 0, data.cpu || 0, data.temperature || 0, data.pose?.x || 0, data.pose?.y || 0, data.pose?.theta || 0]
                        ).catch(e => console.error("❌ Telemetry DB Error:", e.message));

                        // Broadcast to authorized users
                        broadcastRobotUpdate(ws.robotId, {
                            type: 'telemetry',
                            robotId: ws.robotId,
                            telemetry: { ...data, lastUpdate: new Date().toISOString() }
                        });
                    }

                    // --- User Message (Command) ---
                    if (ws.type === 'user' && data.type === 'robot_command') {
                        const { robotId, command, params } = data;

                        // Access Control Check
                        const robotRes = await pool.query("SELECT org_id FROM robots WHERE id = $1", [robotId]);
                        if (robotRes.rows.length === 0) return;

                        const isOrgAdmin = ws.orgId === robotRes.rows[0].org_id; // Check admin org match
                        const accessRes = await pool.query("SELECT 1 FROM user_robots WHERE user_id = $1 AND robot_id = $2", [ws.userId, robotId]);

                        if (isOrgAdmin || accessRes.rows.length > 0) {
                            sendCommandToRobot(robotId, {
                                type: 'command',
                                command,
                                params,
                                senderId: ws.userId,
                                timestamp: new Date().toISOString()
                            });
                        } else {
                            console.warn(`🔒 Unauthorized Command: User ${ws.userId} -> Robot ${robotId}`);
                        }
                    }
                } catch (err) {
                    console.error("❌ WS Message Error:", err);
                }
            });

            ws.on("close", async () => {
                if (ws.type === 'user') {
                    userClients.delete(ws);
                } else if (ws.type === 'robot' && ws.robotId) {
                    robotClients.delete(ws.robotId);
                    console.log(`🤖 Robot disconnected: ${ws.robotId}`);
                    await pool.query("UPDATE robots SET status = 'OFFLINE' WHERE id = $1", [ws.robotId]);
                    broadcastRobotUpdate(ws.robotId, { type: 'status_update', robotId: ws.robotId, status: 'OFFLINE' });
                }
            });

        } catch (fatalErr) {
            console.error("🔥 Fatal WS Connection Error:", fatalErr);
            ws.close(1011, "Internal Server Error");
        }
    });

    console.log("📡 WebSocket Server Initialized");
};

/**
 * Intelligent Broadcast: Routes data to authorized users for a specific robot.
 */
async function broadcastRobotUpdate(robotId: string, data: any) {
    try {
        const message = JSON.stringify(data);

        // 1. Get robot's Org for Admin broadcasting
        const robotRes = await pool.query("SELECT org_id FROM robots WHERE id = $1", [robotId]);
        if (robotRes.rows.length === 0) return;
        const robotOrgId = robotRes.rows[0].org_id;

        // 2. Get explicitly assigned users
        const assignedRes = await pool.query("SELECT user_id FROM user_robots WHERE robot_id = $1", [robotId]);
        const assignedUserIds = new Set(assignedRes.rows.map(r => r.user_id));

        userClients.forEach(client => {
            if (client.readyState !== WebSocket.OPEN) return;
            const isAdminInOrg = client.orgId === robotOrgId; // Simplified role check
            const isAssigned = assignedUserIds.has(client.userId!);
            if (isAdminInOrg || isAssigned) {
                client.send(message);
            }
        });
    } catch (err) {
        console.error("❌ Broadcast Failed:", err);
    }
}

/**
 * Sends a command packet to a specific robot socket.
 */
function sendCommandToRobot(robotId: string, data: any) {
    const robotSocket = robotClients.get(robotId);
    if (robotSocket && robotSocket.readyState === WebSocket.OPEN) {
        robotSocket.send(JSON.stringify(data));
        return true;
    }
    return false;
}

export function notifyUserUpdate(userId: string, data: any) {
    const message = JSON.stringify(data);
    userClients.forEach(client => {
        if (client.userId === userId && client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

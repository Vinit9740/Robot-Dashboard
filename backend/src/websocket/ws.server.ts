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

// Global registry of connected users to broadcast to
const userClients = new Set<AuthenticatedClient>();

const ISSUER_URL = `https://jjeuvppkdibvydncfrjl.supabase.co/auth/v1`;
const JWKS_URL = `${ISSUER_URL}/.well-known/jwks.json`;

const remoteJWKS = jose.createRemoteJWKSet(new URL(JWKS_URL));
const localJWKS = jose.createLocalJWKSet(LOCAL_JWKS as any);

export const initWebSocket = (server: any) => {
    const wss = new WebSocketServer({ server });

    wss.on("connection", async (ws: AuthenticatedClient, req: IncomingMessage) => {
        try {
            const urlParams = new URLSearchParams(req.url?.split("?")[1]);
            const token = urlParams.get("token");

            if (!token) {
                console.warn("⚠️ WS Connection attempt without token");
                ws.close(1008, "Token required");
                return;
            }

            let userType: 'robot' | 'user' | null = null;
            let identifiedOrgId: number | null = null;
            let identifiedRobotId: string | null = null;
            let identifiedUserId: string | null = null;

            // ── 1. Attempt Robot Authentication (Token is API Key) ─────────────
            try {
                const robotsResult = await pool.query("SELECT id, org_id, api_key_hash, name FROM robots");
                for (const robot of robotsResult.rows) {
                    if (robot.api_key_hash && await bcrypt.compare(token, robot.api_key_hash)) {
                        userType = 'robot';
                        identifiedRobotId = robot.id;
                        identifiedOrgId = robot.org_id;
                        console.log(`🤖 Robot connected: ${robot.name} (Org: ${identifiedOrgId})`);
                        break;
                    }
                }
            } catch (dbErr: any) {
                console.error("❌ WS DB Auth Error (Robots):", dbErr.message);
            }

            // ── 2. Attempt User Authentication (Token is Supabase JWT) ───────────
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
                        // Fallback to local cache for 525 errors
                        result = await jose.jwtVerify(token, localJWKS, {
                            issuer: ISSUER_URL,
                            audience: "authenticated",
                            algorithms: ["ES256"]
                        });
                    }

                    const payload = result.payload as any;
                    userType = 'user';
                    identifiedUserId = payload.sub;
                    identifiedOrgId = payload.app_metadata?.org_id || 1;
                    console.log(`👤 User connected: ${payload.email} (Org: ${identifiedOrgId})`);
                } catch (err: any) {
                    console.warn(`⚠️ WS User Auth Failed: ${err.message}`);
                }
            }

            if (!userType) {
                console.warn("⚠️ WS Authentication failed");
                ws.close(1008, "Invalid authentication");
                return;
            }

            // Successfully authenticated
            ws.type = userType;
            ws.orgId = identifiedOrgId!;

            if (userType === 'user') {
                ws.userId = identifiedUserId!;
                userClients.add(ws);
            } else {
                ws.robotId = identifiedRobotId!;
                // Update robot status to ONLINE
                await pool.query("UPDATE robots SET status = 'ONLINE' WHERE id = $1", [ws.robotId]);
                broadcastToOrg(ws.orgId, { type: 'status_update', robotId: ws.robotId, status: 'ONLINE' });
            }

            // ── Handling incoming messages ───────────────────
            ws.on("message", async (message: Buffer) => {
                try {
                    const data = JSON.parse(message.toString());

                    if (ws.type === 'robot') {
                        // 1. Save telemetry to Database
                        await pool.query(
                            `INSERT INTO telemetry 
                            (robot_id, org_id, battery, cpu, temperature, pose_x, pose_y, pose_theta)
                            VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
                            [
                                ws.robotId,
                                ws.orgId,
                                data.battery || 0,
                                data.cpu || 0,
                                data.temperature || 0,
                                data.pose?.x || 0,
                                data.pose?.y || 0,
                                data.pose?.theta || 0,
                            ]
                        );

                        // 2. Broadcast live telemetry to all users in this Org
                        broadcastToOrg(ws.orgId!, {
                            type: 'telemetry',
                            robotId: ws.robotId,
                            telemetry: {
                                battery: data.battery,
                                cpu: data.cpu,
                                temperature: data.temperature,
                                pose: data.pose,
                                lastUpdate: new Date().toISOString()
                            }
                        });
                    }
                } catch (err) {
                    console.error("❌ WS Message Error:", err);
                }
            });

            // ── Handling Disconnection ───────────────────
            ws.on("close", async () => {
                if (ws.type === 'user') {
                    userClients.delete(ws);
                    console.log(`👤 User disconnected: ${ws.userId}`);
                } else if (ws.type === 'robot') {
                    console.log(`🤖 Robot disconnected: ${ws.robotId}`);
                    try {
                        await pool.query("UPDATE robots SET status = 'OFFLINE' WHERE id = $1", [ws.robotId]);
                        broadcastToOrg(ws.orgId!, { type: 'status_update', robotId: ws.robotId, status: 'OFFLINE' });
                    } catch (err) {
                        console.error("❌ Robot Disconnect Update Failed:", err);
                    }
                }
            });

            ws.on("error", (error) => {
                console.error(`❌ WS Error for ${ws.type}:`, error);
            });

        } catch (fatalErr) {
            console.error("🔥 Fatal WS Connection Error:", fatalErr);
            ws.close(1011, "Internal Server Error");
        }
    });

    console.log("📡 WebSocket Server Initialized");
};

function broadcastToOrg(orgId: number, data: any) {
    const message = JSON.stringify(data);
    userClients.forEach(client => {
        if (client.orgId === orgId && client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

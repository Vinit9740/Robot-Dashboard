// Run with: npx ts-node simulate-robot.ts <API_KEY_HERE>
import WebSocket from 'ws';

const apiKey = process.argv[2];
if (!apiKey) {
    console.error('Usage: npx ts-node simulate-robot.ts <API_KEY>');
    process.exit(1);
}

const ws = new WebSocket(`ws://localhost:5000?token=${apiKey}`);

let pose = { x: 0, y: 0, theta: 0 };
let battery = 100;

// Path following state
let isMoving = false;
let waypoints: { x: number, y: number }[] = [];
let currentWaypointIndex = 0;
let waitTimer: NodeJS.Timeout | null = null;
let isWaiting = false;
const speed = 1.0; // Units per second
let manualVelocity = { linear: 0, angular: 0 };

ws.on('open', () => {
    console.log('🟢 Robot Simulation Started');

    // Physics update at 20Hz (50ms)
    setInterval(() => {
        if (isMoving && waypoints.length > 0 && !isWaiting) {
            const target = waypoints[currentWaypointIndex];
            const dx = target.x - pose.x;
            const dy = target.y - pose.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            const frameSpeed = speed * 0.05; // 50ms frame
            if (distance < frameSpeed) {
                pose.x = target.x;
                pose.y = target.y;

                console.log(`📍 Reached waypoint ${currentWaypointIndex + 1}/${waypoints.length}. Waiting 3s...`);
                isWaiting = true;

                setTimeout(() => {
                    currentWaypointIndex++;
                    isWaiting = false;
                    if (currentWaypointIndex >= waypoints.length) {
                        isMoving = false;
                        console.log('🏁 Mission Completed');
                    } else {
                        console.log(`➡️ Moving to waypoint ${currentWaypointIndex + 1}/${waypoints.length}`);
                    }
                }, 3000);
            } else {
                const angle = Math.atan2(dy, dx);
                pose.x += Math.cos(angle) * frameSpeed;
                pose.y += Math.sin(angle) * frameSpeed;
                pose.theta = angle;
            }
            pose.x = Math.max(-50, Math.min(50, pose.x));
            pose.y = Math.max(-50, Math.min(50, pose.y));
        }

        // Apply manual velocity at 20Hz
        if (manualVelocity.linear !== 0 || manualVelocity.angular !== 0) {
            pose.theta += manualVelocity.angular * 0.05; // 50ms frame
            pose.x += Math.cos(pose.theta) * (manualVelocity.linear * 0.05);
            pose.y += Math.sin(pose.theta) * (manualVelocity.linear * 0.05);
            pose.x = Math.max(-50, Math.min(50, pose.x));
            pose.y = Math.max(-50, Math.min(50, pose.y));
        }
    }, 50);

    // Telemetry broadcast at 5Hz (200ms)
    setInterval(() => {
        battery = Math.max(0, battery - 0.0001); // 10% per hour approx

        const telemetry = {
            battery: Math.round(battery),
            cpu: Math.round(Math.random() * 20 + 10),
            temperature: Math.round(Math.random() * 5 + 35),
            pose
        };

        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(telemetry));
        }

        if (isMoving || manualVelocity.linear !== 0 || manualVelocity.angular !== 0) {
            const mode = manualVelocity.linear !== 0 || manualVelocity.angular !== 0 ? 'MANUAL' : 'AUTO';
            // Throttle logs slightly
            if (Math.random() > 0.8) {
                console.log(`📡 [${mode}] x=${pose.x.toFixed(2)}, y=${pose.y.toFixed(2)}, theta=${pose.theta.toFixed(2)}`);
            }
        }
    }, 200);
});

ws.on('message', (data) => {
    try {
        const message = JSON.parse(data.toString());
        console.log(`📩 [Robot] Received Packet: ${data.toString()}`);
        
        if (message.type === 'start_mission' || message.command === 'start_mission') {
            const route = message.route || message.params?.route;
            console.log(`🚀 [Robot] Mission Start Triggered. Points: ${JSON.stringify(route)}`);
            if (route && Array.isArray(route)) {
                waypoints = route;
                currentWaypointIndex = 0;
                isMoving = true;
                manualVelocity = { linear: 0, angular: 0 };
                console.log(`🚀 Mission Started with ${waypoints.length} waypoints`);
            }
        } else if (message.command === 'STOP' || message.type === 'STOP' || message.command === 'stop') {
            isMoving = false;
            manualVelocity = { linear: 0, angular: 0 };
            console.log('🛑 Robot Stopped');
        } else if (message.command === 'teleop') {
            const linear = message.params?.linear ?? 0;
            const angular = message.params?.angular ?? 0;
            manualVelocity = { linear, angular };
            isMoving = false; // Manual control overrides autonomous mission
            console.log(`🕹️ Manual Control Active: linear=${linear}, angular=${angular}`);
        } else if (message.command === 'emergency_stop') {
            isMoving = false;
            manualVelocity = { linear: 0, angular: 0 };
            console.log('🚨 EMERGENCY STOP');
        }
    } catch (err) {
        console.error('❌ Error parsing message:', err);
    }
});

ws.on('close', (code, reason) => {
    console.log(`🔴 Simulation Disconnected (Code: ${code}, Reason: ${reason || 'N/A'})`);
    // Try to reconnect? For simulation, let's keep it simple and just exit after a delay
    setTimeout(() => process.exit(0), 1000);
});

ws.on('error', (err) => console.error('❌ WS Error:', err.message));

// Keep process alive
process.on('SIGINT', () => {
    console.log('👋 Simulation terminated by user');
    ws.close();
    process.exit(0);
});

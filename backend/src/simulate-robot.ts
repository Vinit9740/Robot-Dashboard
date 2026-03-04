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

ws.on('open', () => {
    console.log('🟢 Robot Simulation Started');

    // Send telemetry every 1 second
    setInterval(() => {
        // Random walk
        pose.x += (Math.random() - 0.5) * 2;
        pose.y += (Math.random() - 0.5) * 2;
        pose.theta += (Math.random() - 0.5) * 0.5;

        // Drain battery
        battery = Math.max(0, battery - 0.1);

        const telemetry = {
            battery: Math.round(battery),
            cpu: Math.round(Math.random() * 40 + 20),
            temperature: Math.round(Math.random() * 10 + 40),
            pose
        };

        ws.send(JSON.stringify(telemetry));
        console.log(`📡 Telemetry Sent: x=${pose.x.toFixed(2)}, y=${pose.y.toFixed(2)}, batt=${telemetry.battery}%`);
    }, 1000);
});

ws.on('close', () => console.log('🔴 Simulation Stopped'));
ws.on('error', (err) => console.error('❌ WS Error:', err));

/**
 * Robot Simulation Script
 * Usage: npx ts-node simulate-robot.ts <ROBOT_API_KEY> [WS_URL]
 */

import WebSocket from 'ws';

const apiKey = process.argv[2];
const wsUrl = process.argv[3] || 'ws://localhost:5000';

if (!apiKey) {
    console.error('❌ Error: Robot API Key is required.');
    console.log('Usage: npx ts-node simulate-robot.ts <API_KEY>');
    process.exit(1);
}

console.log(`📡 Connecting to Robot Nexus at ${wsUrl}...`);
const ws = new WebSocket(`${wsUrl}?token=${apiKey}`);

let pose = { x: 0, y: 0, theta: 0 };
let battery = 100;
let temperature = 35;

ws.on('open', () => {
    console.log('✅ Connection Established. Simulating deployment...');

    // Telemetry Loop
    setInterval(() => {
        // Move in a slow circle
        pose.theta += 0.05;
        pose.x += Math.cos(pose.theta) * 0.5;
        pose.y += Math.sin(pose.theta) * 0.5;

        // Degrade systems slowly
        battery = Math.max(0, battery - 0.01);
        temperature = 35 + Math.sin(Date.now() / 10000) * 5;

        ws.send(JSON.stringify({
            battery: Math.round(battery),
            cpu: 15 + Math.random() * 10,
            temperature: Math.round(temperature),
            pose: {
                x: pose.x,
                y: pose.y,
                theta: pose.theta
            }
        }));
    }, 1000);
});

ws.on('message', (data) => {
    try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'command') {
            console.log(`🚀 [COMMAND RECEIVED]: ${msg.command}`, msg.params || '');

            if (msg.command === 'HOME') {
                console.log('🏠 Returning to base...');
                pose = { x: 0, y: 0, theta: 0 };
            } else if (msg.command === 'STOP') {
                console.log('🛑 Emergency Stop engaged.');
            }
        }
    } catch (e) {
        console.error('❌ Failed to parse message:', data.toString());
    }
});

ws.on('error', (err) => {
    console.error('🔥 WebSocket Error:', err.message);
});

ws.on('close', () => {
    console.log('🔌 Disconnected from Nexus.');
    process.exit(0);
});

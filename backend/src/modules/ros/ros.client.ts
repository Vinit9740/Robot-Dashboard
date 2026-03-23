import { WebSocket } from 'ws';
import { ROSMessage } from './ros.topics';

export class ROSClient {
    private ws: WebSocket | null = null;
    private robotId: string;
    private url: string;
    private onMessageCallback: (data: any) => void;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private isConnected = false;

    constructor(robotId: string, url: string, onMessage: (data: any) => void) {
        this.robotId = robotId;
        this.url = url;
        this.onMessageCallback = onMessage;
        this.connect();
    }

    private connect() {
        console.log(`🔌 Connecting to ROSBridge for robot ${this.robotId} at ${this.url}`);
        this.ws = new WebSocket(this.url);

        this.ws.on('open', () => {
            console.log(`✅ Connected to ROSBridge for robot ${this.robotId}`);
            this.isConnected = true;
            this.reconnectAttempts = 0;
        });

        this.ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                this.onMessageCallback(message);
            } catch (err) {
                console.error(`❌ Error parsing ROSBridge message for ${this.robotId}:`, err);
            }
        });

        this.ws.on('close', () => {
            console.warn(`⚠️ ROSBridge connection closed for ${this.robotId}`);
            this.isConnected = false;
            this.handleReconnect();
        });

        this.ws.on('error', (err) => {
            console.error(`❌ ROSBridge error for ${this.robotId}:`, err.message);
            this.isConnected = false;
        });
    }

    private handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const timeout = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
            console.log(`🔄 Reconnecting to ROSBridge for ${this.robotId} in ${timeout}ms (Attempt ${this.reconnectAttempts})`);
            setTimeout(() => this.connect(), timeout);
        } else {
            console.error(`🚫 Max reconnect attempts reached for ROSBridge at ${this.url}`);
        }
    }

    public subscribe(topic: string, type: string) {
        if (!this.isConnected || !this.ws) return;
        const msg: ROSMessage = {
            op: 'subscribe',
            topic,
            type
        };
        this.ws.send(JSON.stringify(msg));
    }

    public publish(topic: string, type: string, msgData: any) {
        if (!this.isConnected || !this.ws) return;
        const msg: ROSMessage = {
            op: 'publish',
            topic,
            type,
            msg: msgData
        };
        this.ws.send(JSON.stringify(msg));
    }

    public disconnect() {
        if (this.ws) {
            this.ws.terminate();
            this.ws = null;
            this.isConnected = false;
        }
    }

    public getStatus() {
        return this.isConnected ? 'CONNECTED' : 'DISCONNECTED';
    }
}

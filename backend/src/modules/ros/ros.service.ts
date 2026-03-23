import { ROSClient } from './ros.client';
import { ROS_TOPICS, MESSAGE_TYPES } from './ros.topics';
import { pool } from '../../config/db';

export class ROSService {
    private static instance: ROSService;
    private clients: Map<string, ROSClient> = new Map();
    private wsServerBroadcast: (robotId: string, data: any) => void;

    private constructor(broadcast: (robotId: string, data: any) => void) {
        this.wsServerBroadcast = broadcast;
    }

    public static init(broadcast: (robotId: string, data: any) => void) {
        if (!ROSService.instance) {
            ROSService.instance = new ROSService(broadcast);
        }
        return ROSService.instance;
    }

    public static getInstance() {
        if (!ROSService.instance) {
            throw new Error("ROSService not initialized. Call init() first.");
        }
        return ROSService.instance;
    }

    public async connectRobot(robotId: string, url: string) {
        if (this.clients.has(robotId)) {
            this.clients.get(robotId)?.disconnect();
        }

        const client = new ROSClient(robotId, url, (msg) => this.handleROSMessage(robotId, msg));
        this.clients.set(robotId, client);

        // Subscribe to relevant topics
        client.subscribe(ROS_TOPICS.SCAN, MESSAGE_TYPES.LASER_SCAN);
        client.subscribe(ROS_TOPICS.ODOM, MESSAGE_TYPES.ODOMETRY);
        client.subscribe(ROS_TOPICS.BATTERY_STATE, MESSAGE_TYPES.BATTERY);
        client.subscribe(ROS_TOPICS.IMAGE_RAW, MESSAGE_TYPES.IMAGE);
    }

    private handleROSMessage(robotId: string, msg: any) {
        if (msg.op !== 'publish') return;

        switch (msg.topic) {
            case ROS_TOPICS.ODOM:
                this.handleOdometry(robotId, msg.msg);
                break;
            case ROS_TOPICS.SCAN:
                this.handleLidarScan(robotId, msg.msg);
                break;
            case ROS_TOPICS.BATTERY_STATE:
                this.handleBatteryState(robotId, msg.msg);
                break;
            // Camera feed usually goes through a separate efficient route, 
            // but we can broadcast metadata or low-res thumbnails here.
        }
    }

    private handleOdometry(robotId: string, odom: any) {
        const pose = {
            x: odom.pose.pose.position.x,
            y: odom.pose.pose.position.y,
            theta: this.getThetaFromQuaternion(odom.pose.pose.orientation)
        };

        this.wsServerBroadcast(robotId, {
            type: 'telemetry',
            robotId,
            telemetry: { pose }
        });
    }

    private handleLidarScan(robotId: string, scan: any) {
        this.wsServerBroadcast(robotId, {
            type: 'lidar_scan',
            robotId,
            scan: {
                angle_min: scan.angle_min,
                angle_max: scan.angle_max,
                angle_increment: scan.angle_increment,
                ranges: scan.ranges
            }
        });
    }

    private handleBatteryState(robotId: string, battery: any) {
        this.wsServerBroadcast(robotId, {
            type: 'telemetry',
            robotId,
            telemetry: { battery: Math.round(battery.percentage * 100) }
        });
    }

    public sendTeleop(robotId: string, linearX: number, angularZ: number) {
        const client = this.clients.get(robotId);
        if (client) {
            client.publish(ROS_TOPICS.CMD_VEL, MESSAGE_TYPES.TWIST, {
                linear: { x: linearX, y: 0, z: 0 },
                angular: { x: 0, y: 0, z: angularZ }
            });
        }
    }

    public sendNavGoal(robotId: string, pose: { x: number, y: number, theta: number }) {
        const client = this.clients.get(robotId);
        if (client) {
            client.publish(ROS_TOPICS.GOAL_POSE, MESSAGE_TYPES.POSE_STAMPED, {
                header: { frame_id: 'map', stamp: { sec: 0, nanosec: 0 } },
                pose: {
                    position: { x: pose.x, y: pose.y, z: 0 },
                    orientation: this.getQuaternionFromTheta(pose.theta)
                }
            });
        }
    }

    public emergencyStop(robotId: string) {
        this.sendTeleop(robotId, 0, 0);
        // Optionally send a cancel goal to Nav2 if there's a specific action client for it
    }

    private getThetaFromQuaternion(q: any) {
        // Simple yaw extraction from quaternion (assuming 2D plane)
        const siny_cosp = 2 * (q.w * q.z + q.x * q.y);
        const cosy_cosp = 1 - 2 * (q.y * q.y + q.z * q.z);
        return Math.atan2(siny_cosp, cosy_cosp);
    }

    private getQuaternionFromTheta(theta: number) {
        return {
            x: 0,
            y: 0,
            z: Math.sin(theta / 2),
            w: Math.cos(theta / 2)
        };
    }
}

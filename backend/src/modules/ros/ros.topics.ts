/**
 * ROS Topic Definitions and Message Types
 */
export const ROS_TOPICS = {
    CMD_VEL: '/cmd_vel',
    SCAN: '/scan',
    ODOM: '/odom',
    IMAGE_RAW: '/image_raw',
    BATTERY_STATE: '/battery_state',
    GOAL_POSE: '/goal_pose',
};

export const MESSAGE_TYPES = {
    TWIST: 'geometry_msgs/Twist',
    LASER_SCAN: 'sensor_msgs/LaserScan',
    ODOMETRY: 'nav_msgs/Odometry',
    IMAGE: 'sensor_msgs/Image',
    BATTERY: 'sensor_msgs/BatteryState',
    POSE_STAMPED: 'geometry_msgs/PoseStamped',
};

export interface ROSMessage {
    op: 'publish' | 'subscribe' | 'unsubscribe' | 'call_service';
    topic?: string;
    type?: string;
    msg?: any;
    id?: string;
}

// Mock in-memory database for demo purposes
interface MockUser {
    id: number;
    email: string;
    password_hash: string;
    org_id: number;
    role: string;
}

interface MockTelemetry {
    battery: number;
    cpu: number;
    temperature: number;
    pose: {
        x: number;
        y: number;
        theta: number;
    };
    lastUpdate: string;
}

interface MockRobot {
    id: string;
    org_id: number;
    name: string;
    api_key_hash: string;
    status: string;
    telemetry?: MockTelemetry;
    createdAt?: string;
}

class MockDatabase {
    private users: MockUser[] = [];
    private robots: MockRobot[] = [];
    private robotCounter = 1;

    constructor() {
        // Initialize with test users
        // Password: password123
        // Bcrypt hash: $2b$10$XLSR5sQ6cT3sVU9wFBmgw.srEHrgIYvGIixGPvMXhqXBHT.AjD68K
        this.users = [
            {
                id: 1,
                email: 'user@test.com',
                password_hash: '$2b$10$XLSR5sQ6cT3sVU9wFBmgw.srEHrgIYvGIixGPvMXhqXBHT.AjD68K',
                org_id: 1,
                role: 'admin',
            },
            {
                id: 2,
                email: 'admin@test.com',
                password_hash: '$2b$10$XLSR5sQ6cT3sVU9wFBmgw.srEHrgIYvGIixGPvMXhqXBHT.AjD68K',
                org_id: 1,
                role: 'admin',
            },
            {
                id: 3,
                email: 'demo@test.com',
                password_hash: '$2b$10$XLSR5sQ6cT3sVU9wFBmgw.srEHrgIYvGIixGPvMXhqXBHT.AjD68K',
                org_id: 2,
                role: 'user',
            },
        ];

        // Initialize with dummy robots
        this.robots = [
            {
                id: '550e8400-e29b-41d4-a716-446655440001',
                org_id: 1,
                name: 'Rover-1',
                api_key_hash: '$2b$10$dummy_hash_1',
                status: 'ONLINE',
                createdAt: '2026-02-28T10:00:00Z',
                telemetry: {
                    battery: 85,
                    cpu: 35,
                    temperature: 62,
                    pose: { x: 10.5, y: 20.3, theta: 45 },
                    lastUpdate: '2026-03-01T12:30:00Z',
                },
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440002',
                org_id: 1,
                name: 'Rover-2',
                api_key_hash: '$2b$10$dummy_hash_2',
                status: 'ONLINE',
                createdAt: '2026-02-25T14:00:00Z',
                telemetry: {
                    battery: 92,
                    cpu: 28,
                    temperature: 58,
                    pose: { x: 15.2, y: 30.1, theta: -30 },
                    lastUpdate: '2026-03-01T12:29:15Z',
                },
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440003',
                org_id: 1,
                name: 'Rover-3',
                api_key_hash: '$2b$10$dummy_hash_3',
                status: 'OFFLINE',
                createdAt: '2026-02-20T09:00:00Z',
                telemetry: {
                    battery: 15,
                    cpu: 0,
                    temperature: 45,
                    pose: { x: 5.0, y: 10.5, theta: 0 },
                    lastUpdate: '2026-03-01T10:15:00Z',
                },
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440004',
                org_id: 1,
                name: 'Rover-4',
                api_key_hash: '$2b$10$dummy_hash_4',
                status: 'ONLINE',
                createdAt: '2026-03-01T08:00:00Z',
                telemetry: {
                    battery: 78,
                    cpu: 42,
                    temperature: 65,
                    pose: { x: 25.8, y: 15.4, theta: 90 },
                    lastUpdate: '2026-03-01T12:31:00Z',
                },
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440005',
                org_id: 2,
                name: 'Bot-1',
                api_key_hash: '$2b$10$dummy_hash_5',
                status: 'OFFLINE',
                createdAt: '2026-02-15T11:00:00Z',
                telemetry: {
                    battery: 5,
                    cpu: 0,
                    temperature: 40,
                    pose: { x: 0, y: 0, theta: 0 },
                    lastUpdate: '2026-02-28T16:45:00Z',
                },
            },
        ];
    }

    getUser(email: string): MockUser | undefined {
        return this.users.find(u => u.email === email);
    }

    getRobotsByOrgId(orgId: number): MockRobot[] {
        return this.robots.filter(r => r.org_id === orgId);
    }

    addRobot(robot: MockRobot): MockRobot {
        this.robots.push(robot);
        return robot;
    }

    getAllRobots(): MockRobot[] {
        return this.robots;
    }
}

export default new MockDatabase();

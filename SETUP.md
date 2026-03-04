# Robot Dashboard - Setup & Test Credentials

## 📋 Prerequisites

1. **PostgreSQL** installed and running
2. **Node.js** and npm installed
3. Backend running on `http://localhost:5000`
4. Frontend running on `http://localhost:5173`

## 🗄️ Database Setup

### Option 1: Using the Seed Script (Recommended)

1. Make sure PostgreSQL is running
2. Update `.env` with your database URL:
   ```
   DATABASE_URL=postgresql://robotuser:robotpass@localhost:5432/robotdb
   ```

3. Create the database:
   ```bash
   createdb robotdb
   ```

4. Run the seed script:
   ```bash
   cd backend
   npx ts-node seed.ts
   ```

5. You should see:
   ```
   🌱 Starting database seeding...
   📋 Creating tables...
   ✅ Tables created successfully
   👤 Creating test users...
     ✓ Created user: user@test.com
     ✓ Created user: admin@test.com
     ✓ Created user: demo@test.com
   ✅ Database seeding completed!
   ```

### Option 2: Manual SQL Setup

1. Create database:
   ```sql
   CREATE DATABASE robotdb;
   ```

2. Connect to database:
   ```bash
   psql -U postgres -d robotdb
   ```

3. Run `database/init.sql`:
   ```sql
   \i database/init.sql
   ```

## 🔑 Test Login Credentials

Use any of these credentials to login:

### User Account
- **Email:** `user@test.com`
- **Password:** `password123`

### Admin Account
- **Email:** `admin@test.com`
- **Password:** `password123`

### Demo Account
- **Email:** `demo@test.com`
- **Password:** `password123`

## 🚀 Running the Application

### Terminal 1: Backend Server
```bash
cd backend
npm run dev
# Server running on http://localhost:5000
```

### Terminal 2: Frontend Server
```bash
cd frontend
npm run dev
# Frontend running on http://localhost:5173
```

### Open Browser
Navigate to: `http://localhost:5173`

## 🧪 Testing the Flow

1. **Login** with `user@test.com` / `password123`
2. **Create a Robot** - Enter a robot name and click "Create Robot"
3. **View Robots** - All created robots are displayed with their status
4. **Logout** - Click logout button to return to login

## 📊 Database Schema

### users
```sql
- id (PRIMARY KEY)
- email (UNIQUE)
- password_hash
- org_id
- role
- created_at
- updated_at
```

### robots
```sql
- id (UUID PRIMARY KEY)
- org_id
- name
- api_key_hash
- status (ONLINE/OFFLINE)
- created_at
- updated_at
```

### telemetry
```sql
- id (PRIMARY KEY)
- robot_id (FOREIGN KEY)
- org_id
- battery
- cpu
- temperature
- pose_x, pose_y, pose_theta
- created_at
```

## 🔧 Environment Variables

Create `.env` in the backend folder:
```
PORT=5000
DATABASE_URL=postgresql://robotuser:robotpass@localhost:5432/robotdb
JWT_SECRET=supersecret
```

## 🐛 Troubleshooting

### "Could not connect to database"
- Ensure PostgreSQL is running
- Check DATABASE_URL is correct
- Verify database exists: `psql -l`

### "Module not found: @types/*"
- Run: `npm install` in both backend and frontend folders

### "Port already in use"
- Kill process: `taskkill /F /IM node.exe` (Windows)
- Or kill by port: `lsof -i :5000` (Mac/Linux)

### "Invalid token" on login
- Run seed script again to refresh test users
- Check JWT_SECRET matches in .env

## 📚 API Endpoints

- `POST /auth/login` - Login with email/password
- `GET /robots` - Get all robots (requires auth)
- `POST /robots` - Create new robot (requires auth)
- `GET /health` - Backend health check

---

Now you're ready to use the Robot Dashboard! 🚀

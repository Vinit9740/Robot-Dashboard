import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import authRoutes from "./modules/auth/auth.routes";
import robotRoutes from "./modules/robots/robots.routes";
import { initWebSocket } from "./websocket/ws.server";

dotenv.config();

const app = express();
app.use(cors());
// Temporarily relaxed for local debugging
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`📡 [${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.use("/auth", authRoutes);
app.use("/auth", authRoutes);
// Handlers for both singular and plural just in case of frontend mismatches
app.use("/robot", robotRoutes);
app.use("/robots", robotRoutes);

app.get("/health", (_, res) => {
    res.json({ status: "OK" });
});

const server = http.createServer(app);
initWebSocket(server);

server.listen(process.env.PORT, () => {
    console.log(`🚀 Server running on port ${process.env.PORT}`);
});

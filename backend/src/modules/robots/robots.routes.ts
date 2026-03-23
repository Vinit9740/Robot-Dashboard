import { Router } from "express";
import { verifyToken } from "../../middleware/auth.middleware";
import { createRobot, getRobots, proxyVideoStream } from "./robots.controller";

const router = Router();

router.post("/", verifyToken, createRobot);
router.get("/", verifyToken, getRobots);
router.get("/:id/video-stream", verifyToken, proxyVideoStream);

export default router;

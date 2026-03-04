import { Router } from "express";
import { verifyToken } from "../../middleware/auth.middleware";
import { createRobot, getRobots } from "./robots.controller";

const router = Router();

router.post("/", verifyToken, createRobot);
router.get("/", verifyToken, getRobots);

export default router;

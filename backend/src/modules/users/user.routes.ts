import { Router } from "express";
import { verifyToken } from "../../middleware/auth.middleware";
import { getPendingUsers, verifyUser, getAllOperatives } from "./user.controller";

const router = Router();

// These routes require a valid token and will be protected by admin check inside the controller
router.get("/pending", verifyToken, getPendingUsers);
router.get("/all", verifyToken, getAllOperatives);
router.post("/verify", verifyToken, verifyUser);

export default router;

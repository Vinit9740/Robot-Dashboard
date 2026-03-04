import { Router } from "express";
import { login } from "./auth.controller";

const router = Router();

// All auth is handled by Supabase on the frontend.
// This stub exists for backwards compatibility only.
router.post("/login", login);

export default router;

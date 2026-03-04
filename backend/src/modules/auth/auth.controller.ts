import { Request, Response } from "express";

// The login route is kept as a no-op placeholder.
// All authentication is now handled by Supabase Auth on the frontend.
// The backend validates Supabase JWTs via auth.middleware.ts.
export const login = async (_req: Request, res: Response) => {
    res.status(410).json({
        message: "Direct login is deprecated. Use Supabase Auth on the frontend.",
    });
};

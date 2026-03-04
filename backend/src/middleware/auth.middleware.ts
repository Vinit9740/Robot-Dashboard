import { Request, Response, NextFunction } from "express";
import * as jose from "jose";
import { LOCAL_JWKS } from "../config/jwks.cache";

export interface AuthRequest extends Request {
    user?: any;
}

// Supabase Issuer URL
const ISSUER_URL = `https://jjeuvppkdibvydncfrjl.supabase.co/auth/v1`;
const JWKS_URL = `${ISSUER_URL}/.well-known/jwks.json`;

// Create a JWK set from the remote URL
const remoteJWKS = jose.createRemoteJWKSet(new URL(JWKS_URL));

// Create a JWK set from the local cache
const localJWKS = jose.createLocalJWKSet(LOCAL_JWKS as any);

export const verifyToken = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token" });

    try {
        let result;
        try {
            // 1. Try Remote Verification first (Best Practice)
            result = await jose.jwtVerify(token, remoteJWKS, {
                issuer: ISSUER_URL,
                audience: "authenticated",
                algorithms: ["ES256"]
            });
        } catch (remoteErr: any) {
            // 2. If it's a 525 SSL error or network failure, use the Local Cache
            console.warn(`⚠️ Remote JWKS fetch failed (${remoteErr.message}), falling back to local cache.`);
            result = await jose.jwtVerify(token, localJWKS, {
                issuer: ISSUER_URL,
                audience: "authenticated",
                algorithms: ["ES256"]
            });
        }

        const payload = result.payload as any;
        const appMeta = payload.app_metadata || {};

        req.user = {
            userId: payload.sub,
            email: payload.email,
            role: appMeta.role || "user",
            orgId: appMeta.org_id || 1,
        };

        next();
    } catch (err: any) {
        console.error(`🔐 Auth Failed: ${err.message}`);
        return res.status(403).json({ message: `Authentication Error: ${err.message}` });
    }
};

import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, TokenPayload } from "../utils/jwt";
import { logger } from "../utils/logger";

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access token required" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (err: any) {
    logger.warn(`JWT verification failure: ${err.message}`);
    return res.status(403).json({ error: "Invalid or expired access token" });
  }
}

export function requireRole(roles: Array<"ADMIN" | "TEAM_MEMBER" | "VIEWER">) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(`Unauthorized role request: user ${req.user.email} with role ${req.user.role} attempted to access action requiring roles [${roles.join(",")}]`);
      return res.status(403).json({ error: "Insufficient permission" });
    }

    next();
  };
}

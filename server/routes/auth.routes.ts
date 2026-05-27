import { Router, Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { authenticateJWT, AuthenticatedRequest } from "../middleware/auth.middleware";
import { logger } from "../utils/logger";

export const authRouter = Router();
const authService = new AuthService();

// Register a new user
authRouter.post("/register", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authService.register(req.body);
    res.status(201).json(user);
  } catch (err: any) {
    logger.error(`Register Route Error: ${err.message}`);
    res.status(400).json({ error: err.message });
  }
});

// Authenticate / Login user
authRouter.post("/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await authService.login(req.body);
    res.json(data);
  } catch (err: any) {
    logger.error(`Login Route Error: ${err.message}`);
    res.status(401).json({ error: err.message });
  }
});

// Refresh / token rotation
authRouter.post("/refresh", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token is required" });
    }
    const pair = await authService.rotateRefreshToken(refreshToken);
    res.json(pair);
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});

// Get currently active profile
authRouter.get("/me", authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

// Logout session
authRouter.post("/logout", (req: Request, res: Response) => {
  res.json({ success: true, message: "Logged out successfully" });
});

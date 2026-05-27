import { Router, Request, Response } from "express";
import { UserService } from "../services/user.service";
import { authenticateJWT, requireRole } from "../middleware/auth.middleware";
import { logger } from "../utils/logger";

export const usersRouter = Router();
const userService = new UserService();

// Retrieve list of colleagues/users (Admin & Team Members only)
usersRouter.get("/", authenticateJWT, requireRole(["ADMIN", "TEAM_MEMBER"]), async (req: Request, res: Response) => {
  try {
    const list = await userService.getUsers();
    res.json(list);
  } catch (err: any) {
    logger.error(`Users route GET query failed: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// Retrieve specific profile
usersRouter.get("/:id", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const item = await userService.getUserById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: "Teammate not found" });
    }
    res.json(item);
  } catch (err: any) {
    logger.error(`Users route GET ID query failed: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// Update profile properties
usersRouter.put("/:id", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const updated = await userService.updateUser(req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    logger.error(`Users route PUT mutation failed: ${err.message}`);
    res.status(400).json({ error: err.message });
  }
});

// Remove colleague profile (Administrator only)
usersRouter.delete("/:id", authenticateJWT, requireRole(["ADMIN"]), async (req: Request, res: Response) => {
  try {
    await userService.deleteUser(req.params.id);
    res.json({ success: true, message: "Teammate removed successfully" });
  } catch (err: any) {
    logger.error(`Users route DELETE mutation failed: ${err.message}`);
    res.status(400).json({ error: err.message });
  }
});

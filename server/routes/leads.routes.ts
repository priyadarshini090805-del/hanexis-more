import { Router, Request, Response, NextFunction } from "express";
import { LeadService } from "../services/lead.service";
import { authenticateJWT } from "../middleware/auth.middleware";
import { logger } from "../utils/logger";

export const leadsRouter = Router();
const leadService = new LeadService();

// Retrieve leads matching tags or terms
leadsRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, platform, status } = req.query;
    const items = await leadService.getLeads({
      search: search ? String(search) : undefined,
      platform: platform ? String(platform) : undefined,
      status: status ? String(status) : undefined
    });
    res.json(items);
  } catch (err: any) {
    logger.error(`GET leads error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// Import or create new target profile
leadsRouter.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await leadService.createLead(req.body);
    res.status(201).json(item);
  } catch (err: any) {
    logger.error(`POST leads error: ${err.message}`);
    res.status(400).json({ error: err.message });
  }
});

// Update specific fields on target profile
leadsRouter.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const item = await leadService.updateLead(id, req.body);
    res.json(item);
  } catch (err: any) {
    logger.error(`PUT leads error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// Remove prospect
leadsRouter.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await leadService.deleteLead(id);
    res.json({ success: true, message: "Target profile dissociated" });
  } catch (err: any) {
    logger.error(`DELETE lead error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

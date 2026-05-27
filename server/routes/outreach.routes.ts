import { Router, Request, Response, NextFunction } from "express";
import { OutreachService } from "../services/outreach.service";
import { logger } from "../utils/logger";

export const outreachRouter = Router();
const outreachService = new OutreachService();

// Retrieve activities timeline
outreachRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await outreachService.getActivities();
    res.json(list);
  } catch (err: any) {
    logger.error(`Outreach fetch timeline fail: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// Schedule or create dynamic activity run
outreachRouter.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await outreachService.createActivity(req.body);
    res.status(201).json(item);
  } catch (err: any) {
    logger.error(`Outreach create activity fail: ${err.message}`);
    res.status(400).json({ error: err.message });
  }
});

// Update status (e.g., approved/sent/failed)
outreachRouter.put("/:id/status", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const item = await outreachService.updateStatus(id, status);
    res.json(item);
  } catch (err: any) {
    logger.error(`Outreach update status fail: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

import { Router, Request, Response } from "express";
import { CampaignService } from "../services/campaign.service";
import { authenticateJWT, requireRole } from "../middleware/auth.middleware";
import { logger } from "../utils/logger";

export const campaignsRouter = Router();
const campaignService = new CampaignService();

// Retrieve all outbound group strategies
campaignsRouter.get("/", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const list = await campaignService.getCampaigns();
    res.json(list);
  } catch (err: any) {
    logger.error(`Campaign router GET failure: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// Create brand new relationship campaign
campaignsRouter.post("/", authenticateJWT, requireRole(["ADMIN", "TEAM_MEMBER"]), async (req: Request, res: Response) => {
  try {
    const item = await campaignService.createCampaign(req.body);
    res.status(201).json(item);
  } catch (err: any) {
    logger.error(`Campaign router POST creation failure: ${err.message}`);
    res.status(400).json({ error: err.message });
  }
});

// Update criteria or states for an active campaign
campaignsRouter.put("/:id", authenticateJWT, requireRole(["ADMIN", "TEAM_MEMBER"]), async (req: Request, res: Response) => {
  try {
    const item = await campaignService.updateCampaign(req.params.id, req.body);
    res.json(item);
  } catch (err: any) {
    logger.error(`Campaign router PUT mutation failure: ${err.message}`);
    res.status(400).json({ error: err.message });
  }
});

// Discontinue a setup campaign group
campaignsRouter.delete("/:id", authenticateJWT, requireRole(["ADMIN"]), async (req: Request, res: Response) => {
  try {
    await campaignService.deleteCampaign(req.params.id);
    res.json({ success: true, message: "Campaign configuration deleted" });
  } catch (err: any) {
    logger.error(`Campaign router DELETE failure: ${err.message}`);
    res.status(400).json({ error: err.message });
  }
});

import { Router, Request, Response } from "express";
import { ContentService } from "../services/content.service";
import { logger } from "../utils/logger";

export const contentRouter = Router();
const contentService = new ContentService();

// Retrieve all strategy blocks
contentRouter.get("/", async (req: Request, res: Response) => {
  try {
    const list = await contentService.getPosts();
    res.json(list);
  } catch (err: any) {
    logger.error(`Content router fetch fail: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// Create or schedule strategic publisher post
contentRouter.post("/", async (req: Request, res: Response) => {
  try {
    const item = await contentService.createPost(req.body);
    res.status(201).json(item);
  } catch (err: any) {
    logger.error(`Content router create fail: ${err.message}`);
    res.status(400).json({ error: err.message });
  }
});

// Update draft configuration or calendar publishDate
contentRouter.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const item = await contentService.updatePost(id, req.body);
    res.json(item);
  } catch (err: any) {
    logger.error(`Content router update fail: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

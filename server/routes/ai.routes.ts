import { Router, Request, Response } from "express";
import { AIService } from "../services/ai.service";
import { ConversationService } from "../services/conversation.service";
import { logger } from "../utils/logger";

export const aiRouter = Router();
const aiService = new AIService();
const conversationService = new ConversationService();

// 1. Outreach Message generator with tone and custom rules
aiRouter.post("/generate-message", async (req: Request, res: Response) => {
  try {
    const { name, title, company, bio, notes, platform, type, tone, instructions } = req.body;
    const response = await aiService.generateMessage({
      name,
      title,
      company,
      bio,
      notes,
      platform,
      type,
      tone,
      instructions
    });
    res.json(response);
  } catch (err: any) {
    logger.error(`AI Message Generation error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// 2. High performing content generation with visual recommendations
aiRouter.post("/generate-content", async (req: Request, res: Response) => {
  try {
    const { topic, platform, format, audience, keyPoints } = req.body;
    const response = await aiService.generateContent({
      topic,
      platform,
      format,
      audience,
      keyPoints
    });
    res.json(response);
  } catch (err: any) {
    logger.error(`AI Content Generation error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// 3. Conversational smart suggestions for chat streams
aiRouter.post("/suggest-reply", async (req: Request, res: Response) => {
  try {
    const { thread, platform } = req.body;
    if (!thread || thread.length === 0) {
      return res.status(400).json({ error: "Cannot analyze empty thread context" });
    }
    const suggestions = await conversationService.getAiReplySuggestions(thread, platform || "linkedin");
    const sim = !process.env.GEMINI_API_KEY;
    res.json({ suggestions, sim });
  } catch (err: any) {
    logger.error(`AI suggest reply error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

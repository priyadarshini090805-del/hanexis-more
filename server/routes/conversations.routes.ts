import { Router, Request, Response } from "express";
import { ConversationService } from "../services/conversation.service";
import { logger } from "../utils/logger";

export const conversationsRouter = Router();
const service = new ConversationService();

// Retrieve all conversation threads in unified inbox
conversationsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const data = await service.getConversations();
    res.json(data);
  } catch (err: any) {
    logger.error(`Error retrieving inbox conversations: ${err.message}`);
    res.status(500).json({ error: "Failed to retrieve conversation threads." });
  }
});

// Retrieve specific conversation details with unread clearance and message tracking
conversationsRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const item = await service.getConversationById(id);
    if (!item) {
      return res.status(404).json({ error: `Conversation thread with ID [${id}] was not found.` });
    }
    res.json(item);
  } catch (err: any) {
    logger.error(`Error fetching conversation details for ${req.params.id}: ${err.message}`);
    res.status(500).json({ error: "Failed to grab thread records." });
  }
});

// Transmit new outbound message (Frontend compatibility fallback route)
conversationsRouter.post("/:id/messages", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { sender, text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Message content cannot be blank." });
    }

    const message = await service.createMessage(id, sender || "user", text.trim());
    
    // Fetch refreshed thread state containing the updated conversation elements
    const updatedThread = await service.getConversationById(id);
    res.status(201).json(updatedThread || message);
  } catch (err: any) {
    logger.error(`Error transmitting thread reply inside route: ${err.message}`);
    res.status(500).json({ error: "Transmission handoff failed." });
  }
});

// Post a generic message (Conforms specifically to prompt endpoint constraints: POST /messages)
conversationsRouter.post("/messages", async (req: Request, res: Response) => {
  try {
    const { conversationId, sender, text } = req.body;

    if (!conversationId) {
      return res.status(400).json({ error: "A target 'conversationId' parameter is required." });
    }
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Message text content cannot be blank." });
    }

    const message = await service.createMessage(conversationId, sender || "user", text.trim());
    res.status(201).json(message);
  } catch (err: any) {
    logger.error(`Error executing direct message creation: ${err.message}`);
    res.status(500).json({ error: "Direct creation failed." });
  }
});

// Suggest AI replies from a given thread (Conforms specifically to prompt endpoint constraints: POST /messages/ai-reply)
conversationsRouter.post("/messages/ai-reply", async (req: Request, res: Response) => {
  try {
    const { thread, platform, conversationId } = req.body;
    let threadHistory = thread;
    let targetPlatform = platform || "linkedin";

    // Alternate loading if conversationId was supplied instead of prompt payload
    if (conversationId && (!thread || thread.length === 0)) {
      const activeFeed = await service.getConversationById(conversationId);
      if (activeFeed) {
        threadHistory = activeFeed.messages.map(m => ({
          sender: m.sender,
          text: m.text
        }));
        targetPlatform = activeFeed.platform;
      }
    }

    if (!threadHistory || threadHistory.length === 0) {
      return res.status(400).json({ error: "Unable to suggest response: Message thread history is empty." });
    }

    const suggestions = await service.getAiReplySuggestions(threadHistory, targetPlatform);
    const sim = !process.env.GEMINI_API_KEY;

    res.json({ suggestions, sim });
  } catch (err: any) {
    logger.error(`Error suggesting replies in messages router: ${err.message}`);
    res.status(500).json({ error: "AI suggestion strategy failed." });
  }
});

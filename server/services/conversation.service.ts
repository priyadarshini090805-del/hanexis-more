import { getPrismaClient } from "../utils/db";
import { logger } from "../utils/logger";
import { GoogleGenAI } from "@google/genai";

// In-Memory simulated store structure for offline resilience
interface SimMessage {
  id: string;
  conversationId: string;
  sender: 'lead' | 'user';
  text: string;
  status: string;
  sentiment: string | null;
  timestamp: string;
}

interface SimConversation {
  id: string;
  leadId: string;
  leadName: string;
  leadAvatar?: string;
  leadHandle: string;
  platform: 'linkedin' | 'instagram';
  unread: boolean;
  lastUpdated: string;
  messages: SimMessage[];
}

let simulatedConversations: SimConversation[] = [
  {
    id: "conv-1",
    leadId: "lead-elena",
    leadName: "Elena Rostova",
    leadAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80",
    leadHandle: "elena_lumiere",
    platform: "instagram",
    unread: true,
    lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    messages: [
      {
        id: "m1",
        conversationId: "conv-1",
        sender: "user",
        text: "Hi Elena! Absolutely love Lumiere's campaign aesthetics. I put together a quick analysis on optimizing B2B growth hooks. Would love to share!",
        status: "READ",
        sentiment: "NEUTRAL",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "m2",
        conversationId: "conv-1",
        sender: "lead",
        text: "Hi there! Oh wow, thank you for reaching out. We actually struggling a lot with adapting B2B patterns for beauty, we always feel it comes off too dry. What did you think of our recent launch campaign?",
        status: "DELIVERED",
        sentiment: "POSITIVE",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: "conv-2",
    leadId: "lead-alex",
    leadName: "Alex Rivera",
    leadAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
    leadHandle: "alex-rivera-vp",
    platform: "linkedin",
    unread: false,
    lastUpdated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    messages: [
      {
        id: "m3",
        conversationId: "conv-2",
        sender: "user",
        text: "Hi Alex, great meeting you at SaaS-Con! Loved your insights on modular dashboards. Let's connect here.",
        status: "READ",
        sentiment: "NEUTRAL",
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "m4",
        conversationId: "conv-2",
        sender: "lead",
        text: "Hey! Definitely, that was a fantastic panel. Let's talk more. We are expanding our data modules in VentureFlow over the coming quarter, send over any case studies you have.",
        status: "READ",
        sentiment: "POSITIVE",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  }
];

export class ConversationService {
  private getGeminiClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return null;
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }

  // Ensures default participants and active conversation history are present
  async ensureSeeded() {
    const prisma = getPrismaClient();
    if (!prisma) return;

    try {
      const leadsCount = await prisma.lead.count();
      if (leadsCount > 0) return;

      logger.info("ConversationService: Seed-check triggered. Seeding high-fidelity target profiles and threads...");

      // 1. Seed Leads
      const elena = await prisma.lead.create({
        data: {
          id: "lead-elena",
          name: "Elena Rostova",
          title: "VP of Marketing",
          company: "BeautyLumiere",
          platform: "INSTAGRAM",
          handle: "elena_lumiere",
          email: "elena@lumierebeauty.co",
          status: "CONTACTED",
          tags: ["Beauty", "D2C", "SaaS"],
          bio: "Building aesthetic marketing streams for modern beauty formulations.",
          notes: "Elena indicated she wants to explore storytelling marketing models.",
          avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80"
        }
      });

      const alex = await prisma.lead.create({
        data: {
          id: "lead-alex",
          name: "Alex Rivera",
          title: "VP of Product",
          company: "VentureFlow",
          platform: "LINKEDIN",
          handle: "alex-rivera-vp",
          email: "alex@ventureflow.io",
          status: "NURTURING",
          tags: ["Fintech", "Product", "Venture"],
          bio: "Leading modular dashboards and capital pipelines for micro-investments.",
          notes: "Met at SaaS-Con. Interested in Case Studies.",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80"
        }
      });

      const sarah = await prisma.lead.create({
        data: {
          id: "lead-sarah",
          name: "Sarah Jenkins",
          title: "Founder",
          company: "EcoStyle",
          platform: "INSTAGRAM",
          handle: "sarah_eco_style",
          email: "sarah@ecostyle.com",
          status: "NEW",
          tags: ["Ecolife", "Sustainability"],
          bio: "Direct-to-consumer ethical clothing loops.",
          notes: "New prospective target.",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80"
        }
      });

      // 2. Seed Conversations
      const c1 = await prisma.conversation.create({
        data: {
          id: "conv-1",
          leadId: elena.id,
          platform: "INSTAGRAM",
          unread: true,
          lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        }
      });

      const c2 = await prisma.conversation.create({
        data: {
          id: "conv-2",
          leadId: alex.id,
          platform: "LINKEDIN",
          unread: false,
          lastUpdated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        }
      });

      // 3. Seed Messages
      await prisma.message.createMany({
        data: [
          {
            id: "m1",
            conversationId: c1.id,
            sender: "user",
            text: "Hi Elena! Absolutely love Lumiere's campaign aesthetics. I put together a quick analysis on optimizing B2B growth hooks. Would love to share!",
            status: "READ",
            sentiment: "NEUTRAL",
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
          },
          {
            id: "m2",
            conversationId: c1.id,
            sender: "lead",
            text: "Hi there! Oh wow, thank you for reaching out. We actually struggling a lot with adapting B2B patterns for beauty, we always feel it comes off too dry. What did you think of our recent launch campaign?",
            status: "DELIVERED",
            sentiment: "POSITIVE",
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
          },
          {
            id: "m3",
            conversationId: c2.id,
            sender: "user",
            text: "Hi Alex, great meeting you at SaaS-Con! Loved your insights on modular dashboards. Let's connect here.",
            status: "READ",
            sentiment: "NEUTRAL",
            timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
          },
          {
            id: "m4",
            conversationId: c2.id,
            sender: "lead",
            text: "Hey! Definitely, that was a fantastic panel. Let's talk more. We are expanding our data modules in VentureFlow over the coming quarter, send over any case studies you have.",
            status: "READ",
            sentiment: "POSITIVE",
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
          }
        ]
      });

      logger.info("ConversationService: Database successfully seeded with 3 leads, 2 active threads, and conversational histories.");
    } catch (e: any) {
      logger.error(`ConversationService seeding failed: ${e.message}`);
    }
  }

  // Get all conversation threads wrapped matching client interface definitions
  async getConversations(): Promise<SimConversation[]> {
    await this.ensureSeeded();

    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const records = await prisma.conversation.findMany({
          include: {
            lead: true,
            messages: {
              orderBy: { timestamp: "asc" }
            }
          },
          orderBy: { lastUpdated: "desc" }
        });

        // Map database records into expected frontend Conversational format
        return records.map(r => ({
          id: r.id,
          leadId: r.leadId,
          leadName: r.lead.name,
          leadAvatar: r.lead.avatar || undefined,
          leadHandle: r.lead.handle,
          platform: r.platform.toLowerCase() as 'linkedin' | 'instagram',
          unread: r.unread,
          lastUpdated: r.lastUpdated.toISOString(),
          messages: r.messages.map(m => ({
            id: m.id,
            conversationId: m.conversationId,
            sender: m.sender as 'lead' | 'user',
            text: m.text,
            status: m.status,
            sentiment: m.sentiment,
            timestamp: m.timestamp.toISOString()
          }))
        }));
      } catch (err: any) {
        logger.error(`Database conversations retrieval failed: ${err.message}. Reverting to in-memory.`);
      }
    }

    return simulatedConversations;
  }

  // Get specific conversation item details
  async getConversationById(id: string): Promise<SimConversation | null> {
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const r = await prisma.conversation.findUnique({
          where: { id },
          include: {
            lead: true,
            messages: {
              orderBy: { timestamp: "asc" }
            }
          }
        });

        if (r) {
          // Auto clear unread flag upon opening conversation thread messages
          if (r.unread) {
            await prisma.conversation.update({
              where: { id },
              data: { unread: false }
            });
            r.unread = false;
          }

          // Mark message statuses as READ for incoming messages if fetched
          await prisma.message.updateMany({
            where: { conversationId: id, sender: "lead", status: { not: "READ" } },
            data: { status: "READ" }
          });

          return {
            id: r.id,
            leadId: r.leadId,
            leadName: r.lead.name,
            leadAvatar: r.lead.avatar || undefined,
            leadHandle: r.lead.handle,
            platform: r.platform.toLowerCase() as 'linkedin' | 'instagram',
            unread: false,
            lastUpdated: r.lastUpdated.toISOString(),
            messages: r.messages.map(m => ({
              id: m.id,
              conversationId: m.conversationId,
              sender: m.sender as 'lead' | 'user',
              text: m.text,
              status: m.sender === "lead" ? "READ" : m.status,
              sentiment: m.sentiment,
              timestamp: m.timestamp.toISOString()
            }))
          };
        }
      } catch (err: any) {
        logger.error(`Database getConversationById failed: ${err.message}`);
      }
    }

    const simC = simulatedConversations.find(c => c.id === id);
    if (simC) {
      simC.unread = false;
      simC.messages.forEach(m => {
        if (m.sender === "lead") m.status = "READ";
      });
      return simC;
    }
    return null;
  }

  // Sentiment Analysis Engine using keyword heuristics & actual live Gemini context queries
  async analyzeSentiment(text: string): Promise<string> {
    const ai = this.getGeminiClient();
    if (!ai) {
      const textLower = text.toLowerCase();
      if (
        textLower.includes("thank") || 
        textLower.includes("great") || 
        textLower.includes("love") || 
        textLower.includes("interest") || 
        textLower.includes("good") || 
        textLower.includes("absolutely") ||
        textLower.includes("awesome")
      ) {
        return "POSITIVE";
      } else if (
        textLower.includes("stop") || 
        textLower.includes("remove") || 
        textLower.includes("dry") || 
        textLower.includes("unhappy") || 
        textLower.includes("fail") ||
        textLower.includes("reject")
      ) {
        return "NEGATIVE";
      }
      return "NEUTRAL";
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analyze the sentiment of this social selling lead response message. Respond with ONLY one word: POSITIVE, NEUTRAL, or NEGATIVE.
Incoming message: "${text}"`,
      });
      const res = response.text || "NEUTRAL";
      const cleaned = res.trim().toUpperCase();
      if (["POSITIVE", "NEUTRAL", "NEGATIVE"].includes(cleaned)) {
        return cleaned;
      }
      return "NEUTRAL";
    } catch (e) {
      return "NEUTRAL";
    }
  }

  // Creates and threading a new user message, updates platform flags, and schedules a simulated lead response
  async createMessage(conversationId: string, sender: 'lead' | 'user', text: string): Promise<SimMessage> {
    const prisma = getPrismaClient();
    const now = new Date();

    const sentiment = sender === "lead" ? await this.analyzeSentiment(text) : null;
    const initialStatus = sender === "user" ? "SENT" : "DELIVERED";

    let messageObj: SimMessage | null = null;

    if (prisma) {
      try {
        const msg = await prisma.message.create({
          data: {
            conversationId,
            sender,
            text,
            status: initialStatus,
            sentiment,
            timestamp: now
          }
        });

        await prisma.conversation.update({
          where: { id: conversationId },
          data: {
            unread: sender === "lead",
            lastUpdated: now
          }
        });

        messageObj = {
          id: msg.id,
          conversationId: msg.conversationId,
          sender: msg.sender as 'lead' | 'user',
          text: msg.text,
          status: msg.status,
          sentiment: msg.sentiment,
          timestamp: msg.timestamp.toISOString()
        };
      } catch (err: any) {
        logger.error(`Database message save failed: ${err.message}. Processing memory execution.`);
      }
    }

    if (!messageObj) {
      // Memory persistence fallback
      const idx = simulatedConversations.findIndex(c => c.id === conversationId);
      if (idx !== -1) {
        const id = `msg-${Date.now()}`;
        const msg: SimMessage = {
          id,
          conversationId,
          sender,
          text,
          status: initialStatus,
          sentiment,
          timestamp: now.toISOString()
        };
        simulatedConversations[idx].messages.push(msg);
        simulatedConversations[idx].lastUpdated = now.toISOString();
        simulatedConversations[idx].unread = sender === "lead";
        messageObj = msg;
      } else {
        throw new Error("Conversation index and target thread not found.");
      }
    }

    // Dynamic Live Lead Response Interaction Loop Simulators (Delayed by 3 seconds if sending as user)
    if (sender === "user") {
      this.triggerSimulatedResponseAfterDelay(conversationId, text);
    }

    return messageObj;
  }

  private async triggerSimulatedResponseAfterDelay(conversationId: string, userText: string) {
    setTimeout(async () => {
      try {
        let activeThread: SimConversation | null = null;
        const prisma = getPrismaClient();

        if (prisma) {
          const r = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { lead: true }
          });
          if (r) {
            const msgs = await prisma.message.findMany({
              where: { conversationId },
              orderBy: { timestamp: "asc" }
            });
            activeThread = {
              id: r.id,
              leadId: r.leadId,
              leadName: r.lead.name,
              leadAvatar: r.lead.avatar || undefined,
              leadHandle: r.lead.handle,
              platform: r.platform.toLowerCase() as 'linkedin' | 'instagram',
              unread: r.unread,
              lastUpdated: r.lastUpdated.toISOString(),
              messages: msgs.map(m => ({
                id: m.id,
                conversationId: m.conversationId,
                sender: m.sender as 'lead' | 'user',
                text: m.text,
                status: m.status,
                sentiment: m.sentiment,
                timestamp: m.timestamp.toISOString()
              }))
            };
          }
        } else {
          activeThread = simulatedConversations.find(c => c.id === conversationId) || null;
        }

        if (!activeThread) return;

        const leadName = activeThread.leadName;
        const threadHistory = activeThread.messages.map(m => ({ sender: m.sender, text: m.text }));

        // Utilize Gemini context simulation based on overall conversation memory
        const responseText = await this.generateSimulatedResponseText(leadName, threadHistory);

        // Save incoming simulated response into queue/database
        await this.createMessage(conversationId, "lead", responseText);
        logger.info(`ConversationService: Successfully enqueued simulated prospect reply for conversation [${conversationId}].`);

        // Create System notification that we've received an inbound reply
        if (prisma) {
          await prisma.notification.create({
            data: {
              userId: "dev-admin-id",
              title: "New Inbound Reply",
              message: `Lead ${leadName} replied on ${activeThread.platform.toUpperCase()}: "${responseText.slice(0, 45)}..."`
            }
          }).catch(() => {});
        }
      } catch (e: any) {
        logger.error(`Simulated Response callback scheduler failure: ${e.message}`);
      }
    }, 3000);
  }

  private async generateSimulatedResponseText(leadName: string, threadHistory: { sender: string; text: string }[]): Promise<string> {
    const ai = this.getGeminiClient();
    if (!ai) {
      const lastMsg = threadHistory[threadHistory.length - 1];
      const isBeauty = lastMsg?.text.toLowerCase().includes("beauty") || lastMsg?.text.toLowerCase().includes("lumiere") || leadName.includes("Elena");
      if (isBeauty) {
        return "That sounds super interesting! Actually, we always feel beauty patterns under-perform on cold pitches because they lack raw emotion. Do you have examples of visual user-stories we can check out?";
      }
      return "Appreciate the outline. It certainly makes a lot of sense. Send over the deck and let me review it with our product team next Monday.";
    }

    try {
      const threadStr = threadHistory.map(h => `${h.sender === 'user' ? 'Sender' : leadName}: ${h.text}`).join("\n");
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `You are simulating ${leadName} (prospect) responding in a B2B sales sequence on social media channels.
Keep it realistic, polite, slightly busy, but open-minded. Do not write too long. Max 45 words.

Conversation Stream History:
${threadStr}

Simulate the next direct response from ${leadName}:`,
      });
      return response.text?.trim() || "Thanks for getting back! Let me check this and get back to you shortly.";
    } catch (e) {
      return "Makes perfect sense. Send me the cases and let me review them over the weekend.";
    }
  }

  // Generates AI proposed reply suggestions based on the latest messages in thread
  async getAiReplySuggestions(threadHistory: { sender: 'lead' | 'user'; text: string }[], platform: string): Promise<{ tone: string; text: string }[]> {
    const ai = this.getGeminiClient();
    if (!ai) {
      // Offline fallback high-fidelity response options
      const lastMsg = threadHistory[threadHistory.length - 1];
      const isBeauty = lastMsg?.text.toLowerCase().includes("beauty") || lastMsg?.text.toLowerCase().includes("lumiere");
      if (isBeauty) {
        return [
          {
            tone: "Aesthetic Visual Hook",
            text: "I completely understand! We've customized our hooks for beauty brand launches before by mixing direct visual user stories. Let me send over a quick layout outline?"
          },
          {
            tone: "Brainstorm invitation",
            text: "Adapting dry patterns is exactly our specialty! We focus on creating authentic storytelling copy. Would you be free for a quick 10-minute sync next week?"
          },
          {
            tone: "Direct & Proof-first",
            text: "That makes complete sense Elena! I put together some beauty-centric hook structures we've scaled previously. Glad to share them!"
          }
        ];
      }

      return [
        {
          tone: "Strategic Recommendation",
          text: "That sounds like an amazing angle! We'd love to partner and run a comparative campaign. Do you have 15 minutes next week to map it?"
        },
        {
          tone: "Value proposition",
          text: "Appreciate the overview. We built a specific platform framework solving this exact latency hook. Let me send a quick slide deck."
        },
        {
          tone: "Curious & Strategic",
          text: "Terrific! What was your team's primary barrier when scaling these modular developer dashboards?"
        }
      ];
    }

    try {
      const threadStr = threadHistory.map(h => `${h.sender === 'user' ? 'Me' : 'Prospect'}: ${h.text}`).join("\n");
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `You are a social selling conversational AI copywriter.
Analyze this social DM thread on ${platform}. Suggest 3 highly contextual, brief responses matching different professional tones.
Keep answers under 50 words, natural, and low-friction. Return them as a strict JSON array of objects with 'tone' and 'text'.

Thread Context:
${threadStr}

Response Schema format (Strictly valid JSON):
[
  {"tone": "Direct & Warm", "text": "Appreciate your thoughts! I actually..."},
  {"tone": "Analytical", "text": "That's standard in this sector. We usually..."}
]`,
        config: {
          responseMimeType: "application/json"
        }
      });

      const parsed = JSON.parse(response.text || "[]");
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(o => ({
          tone: String(o.tone),
          text: String(o.text)
        }));
      }
    } catch (err) {
      logger.error(`Failed AI Reply generation: ${err}`);
    }

    return [
      {
        tone: "Polite follow-up",
        text: "Thanks for sharing! Let's schedule a brief 10-minute chat to discuss this further."
      }
    ];
  }
}

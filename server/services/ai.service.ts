import { GoogleGenAI, Type } from "@google/genai";
import { logger } from "../utils/logger";

export interface PromptTemplate {
  id: string;
  name: string;
  systemPrompt: string;
  userPromptTemplate: string;
}

// Enterprise Prompt template storage and version configurations
const outreachTemplates: Record<string, PromptTemplate> = {
  connection: {
    id: "connection-v1.2",
    name: "Hyper-personalized Connection Request Hook",
    systemPrompt: `You are Harnexis, the leading outbound lead generation compiler. Your core principle is writing brief, authentic, non-spammy connection requests that reference target profiles beautifully. Do NOT pitch your services yet. Refer exclusively to profile details and company concepts.`,
    userPromptTemplate: `Draft a social connection message on {platform} for:
Name: {name}
Job Title: {title}
Company: {company}
Bio Context: {bio}
Analyst notes: {notes}

Requested Tone: {tone}
Constraints: Under {maxWords} words. Must feel deeply personal, human, and insightful. Include mutual interest.`
  },
  sales_pitch: {
    id: "pitch-v2.0",
    name: "Aesthetic Value-First Inbound Sales Pitch",
    systemPrompt: `You are Harnexis Cognitive Solutions. You write low-friction, high-conversion value propositions that address pain points directly. Never use flowery language, sales buzzwords, or introductory filler. Make the opening sentence incredibly factual.`,
    userPromptTemplate: `Draft a sales pitch message on {platform} for:
Name: {name}
Job Title: {title}
Company: {company}
Bio Context: {bio}
Key Pain Points / Notes: {notes}

Requested Tone: {tone}
Constraints: Under {maxWords} words. Open with an immediate observation. Highlight a clear potential solution. Close with an invitation to view a structured workflow outline.`
  },
  follow_up: {
    id: "followup-v1.1",
    name: "Casual Multi-step Campaign Follow-up",
    systemPrompt: `You are Hanexis Automations. You specialize in friendly, low-pressure follow-up messages that prompt questions or share an interesting growth blueprint. Keep it highly lighthearted.`,
    userPromptTemplate: `Draft a conversational follow-up message on {platform} for:
Name: {name}
Company: {company}
Previous details: {notes}

Requested Tone: {tone}
Constraints: Under {maxWords} words. Reference checking in or dropping a useful concept asset. Keep the response call simple.`
  }
};

export class AIService {
  private getClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      logger.warn("AIService: GEMINI_API_KEY absent. Entering simulated execution mode.");
      return null;
    }
    return new GoogleGenAI({ apiKey });
  }

  async generateMessage(params: {
    name: string;
    title: string;
    company: string;
    bio?: string;
    notes?: string;
    platform: string;
    type: "connection" | "follow_up" | "sales_pitch";
    tone?: string;
    instructions?: string;
    maxWords?: number;
  }): Promise<{ text: string; templateUsed: string; sim: boolean }> {
    const ai = this.getClient();
    const type = params.type || "connection";
    const template = outreachTemplates[type] || outreachTemplates.connection;
    const tone = params.tone || "Professional & Insightful";
    const maxWords = params.maxWords || 80;

    let prompt = template.userPromptTemplate
      .replace("{platform}", params.platform)
      .replace("{name}", params.name)
      .replace("{title}", params.title)
      .replace("{company}", params.company)
      .replace("{bio}", params.bio || "No summary bio listed")
      .replace("{notes}", params.notes || "No extra logs")
      .replace("{tone}", tone)
      .replace("{maxWords}", maxWords.toString());

    if (params.instructions) {
      prompt += `\nAdditional bespoke constraints: ${params.instructions}`;
    }

    if (!ai) {
      const text = this.runSimulationOutbound(params.name, params.title, params.company, type, tone, params.instructions);
      return { text, templateUsed: template.id, sim: true };
    }

    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount <= maxRetries) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            systemInstruction: template.systemPrompt,
            temperature: 0.7,
            maxOutputTokens: 250,
          }
        });
        
        let outText = response.text || "";
        // Clean markdown quotes if model added surrounding quotes
        if (outText.startsWith('"') && outText.endsWith('"')) {
          outText = outText.slice(1, -1);
        }
        return { text: outText, templateUsed: template.id, sim: false };
      } catch (err: any) {
        retryCount++;
        logger.error(`AIService call retry standard index ${retryCount} failures: ${err.message}`);
        if (retryCount > maxRetries) {
          throw new Error(`AI synthesis pipeline failed after ${maxRetries} compilation attempts: ${err.message}`);
        }
      }
    }
    throw new Error("AI synthesis request completed with timeout errors");
  }

  async generateContent(params: {
    topic: string;
    platform: string;
    format: string;
    audience: string;
    keyPoints?: string;
  }): Promise<{ text: string; sim: boolean }> {
    const ai = this.getClient();
    if (!ai) {
      const text = `🚀 Continuous social acquisition is the core B2B growth driver this quarter. Focus topic: "${params.topic}". Target segment: ${params.audience}. Key items: ${params.keyPoints || "none"}. [Visual Theme: high tech dark gradient room with nodes]`;
      return { text, sim: true };
    }

    try {
      const sys = `You are Hanexis Social Media Strategist. Format outputs elegantly with bullet points, structured headers, and hashtags. Wrap suggested illustration ideas in brackets: [Visual Theme: description]`;
      const userPrompt = `Generate a high converting social post for ${params.platform}. 
Format: "${params.format}" 
Audience segment: "${params.audience}"
Core Theme: "${params.topic}"
Key Arguments: "${params.keyPoints || 'None specified'}"`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction: sys,
          temperature: 0.8
        }
      });
      return { text: response.text || "", sim: false };
    } catch (e: any) {
      logger.error(`AI Content scheduler fail: ${e.message}`);
      return { text: `Draft failed due to engine connection logic. Ensure GEMINI_API_KEY is verified and formatted correctly.`, sim: true };
    }
  }

  private runSimulationOutbound(name: string, title: string, company: string, type: string, tone: string, instr?: string) {
    const addon = instr ? ` (Aligning details: ${instr})` : "";
    if (type === "connection") {
      return `Hi ${name}! Inspiring progress building ${company}. I am researching growth dynamics and scaling operations belonging to target profiles like your role as ${title}. Let's keep in touch!${addon}`;
    } else if (type === "follow_up") {
      return `Hey ${name}! Just checking if you received my previous message on social B2B acquisition strategies. We mapped a custom lead capture funnel suited for ${company}'s current layout. Let me know if you would like me to share it.${addon}`;
    } else {
      return `Hi ${name}! Realized you are heading ${title} at ${company}. Scaling client acquisition on social media is traditionally noisy. At Harnexis, we help startups automate B2B customer mapping directly in social feeds, creating 3x leads pipelines without cold spam. Let's talk?${addon}`;
    }
  }
}

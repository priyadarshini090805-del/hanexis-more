import { getPrismaClient } from "../utils/db";
import { logger } from "../utils/logger";

const mockCampaigns = new Map<string, any>([
  [
    "campaign-1",
    {
      id: "campaign-1",
      name: "SaaS Founders Outbound",
      description: "Direct relationship management campaign addressing tool friction for early stage founders.",
      status: "ACTIVE",
      createdAt: new Date().toISOString()
    }
  ],
  [
    "campaign-2",
    {
      id: "campaign-2",
      name: "Instagram Lifestyle Brand Creators",
      description: "Nurturing relationship pipeline connecting with modern DTC brand innovators.",
      status: "DRAFT",
      createdAt: new Date().toISOString()
    }
  ]
]);

export class CampaignService {
  async getCampaigns() {
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        return await prisma.campaign.findMany({
          orderBy: { createdAt: "desc" }
        });
      } catch (err: any) {
        logger.error(`Failed to retrieve campaigns from database: ${err.message}. Defaulting to fallbacks.`);
      }
    }
    return Array.from(mockCampaigns.values());
  }

  async createCampaign(data: any) {
    const prisma = getPrismaClient();
    if (!data.name) {
      throw new Error("Campaign name is required");
    }

    if (prisma) {
      try {
        return await prisma.campaign.create({
          data: {
            name: data.name,
            description: data.description || null,
            status: (data.status || "DRAFT").toUpperCase() as any
          }
        });
      } catch (err: any) {
        logger.error(`Failed to insert campaign: ${err.message}`);
      }
    }

    const item = {
      id: `campaign-${Date.now()}`,
      name: data.name,
      description: data.description || null,
      status: (data.status || "DRAFT").toUpperCase(),
      createdAt: new Date().toISOString()
    };
    mockCampaigns.set(item.id, item);
    return item;
  }

  async updateCampaign(id: string, updates: any) {
    const prisma = getPrismaClient();
    const formatted = { ...updates };
    if (updates.status) formatted.status = updates.status.toUpperCase();

    if (prisma) {
      try {
        return await prisma.campaign.update({
          where: { id },
          data: formatted
        });
      } catch (err: any) {
        logger.error(`Failed to update campaign [${id}]: ${err.message}`);
      }
    }

    const current = mockCampaigns.get(id);
    if (!current) {
      throw new Error("Campaign group not found");
    }
    const updated = { ...current, ...formatted, updatedAt: new Date().toISOString() };
    mockCampaigns.set(id, updated);
    return updated;
  }

  async deleteCampaign(id: string) {
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        await prisma.campaign.delete({ where: { id } });
        return true;
      } catch (err: any) {
        logger.error(`Failed to delete campaign [${id}]: ${err.message}`);
      }
    }

    if (!mockCampaigns.has(id)) {
      throw new Error("Campaign group not found");
    }
    mockCampaigns.delete(id);
    return true;
  }
}

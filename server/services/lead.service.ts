import { getPrismaClient } from "../utils/db";
import { logger } from "../utils/logger";

export class LeadService {
  async getLeads(filters: { search?: string; platform?: string; status?: string }) {
    const prisma = getPrismaClient();
    if (prisma) {
      const whereClause: any = {};
      if (filters.platform && filters.platform !== "all") {
        whereClause.platform = filters.platform.toUpperCase();
      }
      if (filters.status && filters.status !== "all") {
        whereClause.status = filters.status.toUpperCase();
      }
      if (filters.search) {
        whereClause.OR = [
          { name: { contains: filters.search, mode: "insensitive" } },
          { title: { contains: filters.search, mode: "insensitive" } },
          { company: { contains: filters.search, mode: "insensitive" } },
          { handle: { contains: filters.search, mode: "insensitive" } },
        ];
      }
      return prisma.lead.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" }
      });
    }

    // In-Memory simulated store query
    return [];
  }

  async createLead(data: any) {
    const prisma = getPrismaClient();
    if (prisma) {
      return prisma.lead.create({
        data: {
          name: data.name,
          title: data.title,
          company: data.company,
          platform: (data.platform || "LINKEDIN").toUpperCase() as any,
          handle: data.handle,
          email: data.email || null,
          status: (data.status || "NEW").toUpperCase() as any,
          tags: data.tags || [],
          bio: data.bio || null,
          notes: data.notes || null,
          avatar: data.avatar || `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 500000)}?auto=format&fit=crop&w=150&h=150&q=80`
        }
      });
    }
    logger.info("Created simulated lead successfully.");
    return { id: `sim-lead-${Date.now()}`, ...data, createdAt: new Date().toISOString() };
  }

  async updateLead(id: string, updates: any) {
    const prisma = getPrismaClient();
    if (prisma) {
      // Map statuses or strings if they arrive lowercase from client
      const formattedUpdates: any = { ...updates };
      if (updates.status) formattedUpdates.status = updates.status.toUpperCase();
      if (updates.platform) formattedUpdates.platform = updates.platform.toUpperCase();

      return prisma.lead.update({
        where: { id },
        data: formattedUpdates
      });
    }
    return { id, ...updates };
  }

  async deleteLead(id: string) {
    const prisma = getPrismaClient();
    if (prisma) {
      await prisma.lead.delete({ where: { id } });
      return true;
    }
    return true;
  }
}

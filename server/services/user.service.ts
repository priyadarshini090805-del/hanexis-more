import { getPrismaClient } from "../utils/db";
import { logger } from "../utils/logger";

const mockUsers = new Map<string, any>([
  [
    "dev-admin-id",
    {
      id: "dev-admin-id",
      email: "dev@harnexis.io",
      name: "Hari Prabu",
      role: "ADMIN",
      isEmailVerified: true,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80",
      createdAt: new Date().toISOString()
    }
  ],
  [
    "user-teammate-1",
    {
      id: "user-teammate-1",
      email: "teammate@harnexis.co",
      name: "Alex Rivera",
      role: "TEAM_MEMBER",
      isEmailVerified: true,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
      createdAt: new Date().toISOString()
    }
  ],
  [
    "user-viewer-1",
    {
      id: "user-viewer-1",
      email: "viewer@harnexis.co",
      name: "Elena Rostova",
      role: "VIEWER",
      isEmailVerified: true,
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80",
      createdAt: new Date().toISOString()
    }
  ]
]);

export class UserService {
  async getUsers() {
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        return await prisma.user.findMany({
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isEmailVerified: true,
            avatar: true,
            createdAt: true
          },
          orderBy: { createdAt: "desc" }
        });
      } catch (err: any) {
        logger.error(`Failed to retrieve users from SQL database: ${err.message}. Falling back.`);
      }
    }
    return Array.from(mockUsers.values());
  }

  async getUserById(id: string) {
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        return await prisma.user.findUnique({
          where: { id },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isEmailVerified: true,
            avatar: true,
            createdAt: true
          }
        });
      } catch (err: any) {
        logger.error(`Failed to retrieve user by ID [${id}] from SQL database: ${err.message}.`);
      }
    }
    return mockUsers.get(id) || null;
  }

  async updateUser(id: string, updates: any) {
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        return await prisma.user.update({
          where: { id },
          data: updates,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            avatar: true
          }
        });
      } catch (err: any) {
        logger.error(`Database user update error: ${err.message}`);
      }
    }

    const current = mockUsers.get(id);
    if (!current) {
      throw new Error("Teammate record not found");
    }
    const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
    mockUsers.set(id, updated);
    return {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      avatar: updated.avatar
    };
  }

  async deleteUser(id: string) {
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        await prisma.user.delete({ where: { id } });
        return true;
      } catch (err: any) {
        logger.error(`Database user deletion error: ${err.message}`);
      }
    }

    if (!mockUsers.has(id)) {
      throw new Error("Teammate record not found");
    }
    mockUsers.delete(id);
    return true;
  }
}

import { PrismaClient } from "@prisma/client";
import { logger } from "./logger";

let prismaInstance: PrismaClient | null = null;
let isDbConnected = false;

export function getPrismaClient(): PrismaClient | null {
  if (!prismaInstance) {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl || dbUrl.includes("placeholder")) {
      logger.warn("Prisma: DATABASE_URL is not set or utilizes default. Utilizing high-fidelity in-memory runtime engine.");
      return null;
    }
    try {
      prismaInstance = new PrismaClient({
        datasources: {
          db: {
            url: dbUrl,
          },
        },
      });
      // Test the connection asynchronously
      prismaInstance.$connect()
        .then(() => {
          isDbConnected = true;
          logger.info("Prisma connected to PostgreSQL database successfully.");
        })
        .catch((err) => {
          logger.warn(`Prisma failed connection check: ${err.message}. Defaulting to in-memory fallback.`);
          isDbConnected = false;
        });
    } catch (e: any) {
      logger.warn(`Prisma initialization error: ${e.message}. Defaulting to in-memory fallback.`);
      prismaInstance = null;
    }
  }
  return prismaInstance;
}

export function isDbActive(): boolean {
  return isDbConnected;
}

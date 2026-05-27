import { z } from "zod";
import dotenv from "dotenv";
import { logger } from "./logger";

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  GEMINI_API_KEY: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  JWT_ACCESS_SECRET: z.string().default("co-engine-access-secret-3342"),
  JWT_REFRESH_SECRET: z.string().default("co-engine-refresh-secret-9912"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  LINKEDIN_CLIENT_ID: z.string().optional()
});

let parsedEnv = EnvSchema.safeParse(process.env);

if (!parsedEnv.success) {
  logger.warn(`Environment configuration mismatch: ${JSON.stringify(parsedEnv.error.format())}. Emphasizing safety modes.`);
}

export const config = parsedEnv.success ? parsedEnv.data : {
  NODE_ENV: (process.env.NODE_ENV as any) || "development",
  PORT: Number(process.env.PORT) || 3000,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "co-engine-access-secret-3342",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "co-engine-refresh-secret-9912",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID
};

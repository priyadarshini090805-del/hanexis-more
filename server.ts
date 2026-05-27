import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import { createServer as createViteServer } from "vite";
import { authRouter } from "./server/routes/auth.routes";
import { usersRouter } from "./server/routes/users.routes";
import { leadsRouter } from "./server/routes/leads.routes";
import { campaignsRouter } from "./server/routes/campaigns.routes";
import { aiRouter } from "./server/routes/ai.routes";
import { outreachRouter } from "./server/routes/outreach.routes";
import { contentRouter } from "./server/routes/content.routes";
import { integrationsRouter } from "./server/routes/integrations.routes";
import { conversationsRouter } from "./server/routes/conversations.routes";
import { analyticsRouter } from "./server/routes/analytics.routes";
import { rateLimiter } from "./server/middleware/rate-limit.middleware";
import { globalErrorHandler } from "./server/middleware/error.middleware";
import { logger } from "./server/utils/logger";
import { config } from "./server/utils/config";
import { isDbActive } from "./server/utils/db";
import { isRedisActive } from "./server/utils/queue";
import { campaignQueue, contentQueue, outreachQueue, integrationQueue } from "./server/utils/queues";

// Bootstrap automated background workflow processors
import "./server/workers/campaign.worker";
import "./server/workers/content.worker";
import "./server/workers/outreach.worker";
import "./server/workers/integration.worker";
import { SchedulerService } from "./server/services/scheduler.service";

async function runApplicationServer() {
  const app = express();
  const PORT = config.PORT || 3000;

  // 1. Security & Core Request Middlewares
  app.use(helmet({
    contentSecurityPolicy: false // Ensure iFrame embedding succeeds inside preview
  }));
  app.use(cors({ origin: "*" }));
  app.use(express.json());

  // 2. Global Rate Limiting for secure API calls
  app.use("/api/", rateLimiter(60 * 1000, 150));

  // Request Tracer Logger
  app.use((req, res, next) => {
    logger.debug(`${req.method} request dispatched for path: ${req.path}`);
    next();
  });

  // 3. Diagnostics and Proactive Monitoring Web API
  app.get("/api/health", async (req, res) => {
    const dbStatus = isDbActive();
    const redisStatus = isRedisActive();

    // Dynamically poll active connection queue monitors for SLA evaluation
    const [cStats, coStats, oStats, iStats] = await Promise.all([
      campaignQueue.getMetrics(),
      contentQueue.getMetrics(),
      outreachQueue.getMetrics(),
      integrationQueue.getMetrics()
    ]);

    const overallHealthy = dbStatus && redisStatus;
    const statusCode = overallHealthy ? 200 : 207;

    res.status(statusCode).json({
      status: overallHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      dbConnected: dbStatus,
      redisConnected: redisStatus,
      services: {
        database: dbStatus ? "UP" : "DOWN",
        redis: redisStatus ? "UP" : "DOWN"
      },
      queues: {
        campaigns: cStats,
        content: coStats,
        outreach: oStats,
        integrations: iStats
      }
    });
  });

  // 4. Mount Modular API Endpoints
  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/leads", leadsRouter);
  app.use("/api/campaigns", campaignsRouter);
  app.use("/api/ai", aiRouter);
  app.use("/api/outreach", outreachRouter);
  app.use("/api/posts", contentRouter); // Mount post scheduler
  app.use("/api/integrations", integrationsRouter);
  app.use("/api/conversations", conversationsRouter);
  app.use("/api/analytics", analyticsRouter);

  // 5. Client Static Assets delivery / Vite Integration
  if (config.NODE_ENV !== "production") {
    logger.info("Dev Server: Triggering Vite middleware mode.");
    const viteInstance = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(viteInstance.middlewares);
  } else {
    logger.info("Production Server: Rendering static bundles from /dist workspace.");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // 6. Global Error Interceptor Middleware
  app.use(globalErrorHandler);

  // 7. Start periodic scheduler for campaign automation and content posting
  SchedulerService.start();

  const server = app.listen(PORT, "0.0.0.0", () => {
    logger.info(`Harnexis server active on port ${PORT} in [${config.NODE_ENV}] mode.`);
  });

  // 8. Configure native server socket timeouts to prevent memory leaking hanging requests
  server.requestTimeout = 30000;  // Match average network roundtrip caps
  server.headersTimeout = 35000;

  // 9. Coordinate high-reliability OS signal shut down pipelines
  const initiateGracefulTermination = async (signal: string) => {
    logger.warn(`🚨 Service received terminal trigger OS [${signal}]. Launching secure shutdown.`);
    
    // Stop cron loops immediately
    SchedulerService.stop();

    // Close TCP connection streams cleanly
    server.close(() => {
      logger.info("HTTP express sockets deactivated and socket registers closed.");
    });

    try {
      // Disconnect Prisma
      const { getPrismaClient } = await import("./server/utils/db");
      const db = getPrismaClient();
      if (db) {
        await db.$disconnect();
        logger.info("Database connection closed gracefully.");
      }
    } catch (e: any) {
      logger.error(`Failed to release Database connection state: ${e.message}`);
    }

    try {
      // Shutdown active background queues
      await campaignQueue.close();
      await contentQueue.close();
      await outreachQueue.close();
      await integrationQueue.close();
      logger.info("BullMQ channels deactivated successfully.");

      // Disconnect Redis
      const { getRedisConnection } = await import("./server/utils/queue");
      const client = getRedisConnection();
      if (client) {
        await client.quit();
        logger.info("Redis socket connections disposed.");
      }
    } catch (e: any) {
      logger.error(`Failed to terminate Redis resources: ${e.message}`);
    }

    logger.info("Destructive cleanup routines complete. Terminating.");
    process.exit(0);
  };

  process.on("SIGTERM", () => initiateGracefulTermination("SIGTERM"));
  process.on("SIGINT", () => initiateGracefulTermination("SIGINT"));
}

runApplicationServer().catch((error) => {
  logger.error(`Critical core boot system failure: ${error.message}`);
  process.exit(1);
});

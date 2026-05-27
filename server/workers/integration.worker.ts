import { integrationQueue } from "../utils/queues";
import { IntegrationService } from "../services/integration.service";
import { logger } from "../utils/logger";
import { Platform } from "@prisma/client";

const integrationService = new IntegrationService();

export async function processIntegrationJob(data: { platform: string; action: string; integrationId: string }) {
  const { platform, action, integrationId } = data;
  logger.info(`IntegrationWorker: Received background job [${action}] for ${platform} (${integrationId})`);

  try {
    const activePlat = platform.toUpperCase() as Platform;
    if (activePlat !== "LINKEDIN" && activePlat !== "INSTAGRAM") {
      throw new Error(`Unsupported integration platform target value: ${platform}`);
    }

    if (action === "SYNC_PROFILE_AND_CONNECTIONS") {
      logger.info(`IntegrationWorker: Commencing sync profiles & social contacts streams matching for [${integrationId}]`);
      const count = await integrationService.executeProfileAndConnectionsSync(activePlat);
      logger.info(`IntegrationWorker: Success syncing connection streams. Captured & registered ${count} prospects.`);
    } else if (action === "ROTATE_CREDENTIALS") {
      logger.info(`IntegrationWorker: Commencing token rotation & lifecycle check for [${integrationId}]`);
      const success = await integrationService.rotateTokenLifecycle(activePlat);
      if (success) {
        logger.info(`IntegrationWorker: Completed rotation smoothly. Active token refreshed and updated.`);
      } else {
        logger.warn(`IntegrationWorker: Rotation completed with warning or no action taken.`);
      }
    } else {
      throw new Error(`IntegrationWorker: Received unassigned action parameters: ${action}`);
    }
  } catch (err: any) {
    logger.error(`IntegrationWorker job processing failure [${integrationId}]: ${err.message}`);
    // Rethrow to trigger BullMQ retry handler and dead-letter pipeline
    throw err;
  }
}

// Subscribe the worker with ResilientQueue
integrationQueue.registerWorker(processIntegrationJob);

import { outreachQueue } from "../utils/queues";
import { getPrismaClient } from "../utils/db";
import { logger } from "../utils/logger";

export async function processOutreachJob(data: { activityId: string; leadId: string }) {
  const { activityId, leadId } = data;
  logger.info(`OutreachWorker: Processing outreach execution task [${activityId}] for target user [${leadId}]`);

  const prisma = getPrismaClient();
  if (!prisma) {
    logger.warn("OutreachWorker: No physical database client active. Simulating network dispatch successfully.");
    return;
  }

  try {
    const activity = await prisma.outreachActivity.findUnique({
      where: { id: activityId },
      include: { lead: true }
    });

    if (!activity) {
      logger.warn(`OutreachWorker Cancelled: Outreach activity [${activityId}] was missing from database.`);
      return;
    }

    if (activity.status === "SENT") {
      logger.info(`OutreachWorker: Task [${activityId}] was already published.`);
      return;
    }

    // Update status to indicating running
    await prisma.outreachActivity.update({
      where: { id: activityId },
      data: { status: "APPROVED" } // ensure we show action
    });

    logger.info(`OutreachWorker: Sending outbound pitch (${activity.type}) to ${activity.lead.name} (${activity.lead.handle}). Content preview: "${activity.content.slice(0, 60)}..."`);
    
    // Simulating transient external API errors to demonstrate retry handling
    if (Math.random() < 0.15) {
      throw new Error("Transient outbound network latency. API rejected connection handshake temporarily.");
    }

    // Success update
    await prisma.outreachActivity.update({
      where: { id: activityId },
      data: {
        status: "SENT",
        sentDate: new Date()
      }
    });

    // Create a notification for the users
    await prisma.notification.create({
      data: {
        userId: "dev-admin-id", // default admin user
        title: "Drip Sent Successfully",
        message: `Outbound pitch was automatically sent to ${activity.lead.name} via ${activity.lead.platform}.`
      }
    });

    logger.info(`OutreachWorker success: Activity [${activityId}] fully sent and statuses updated.`);
  } catch (err: any) {
    logger.error(`OutreachWorker execution error [${activityId}]: ${err.message}`);
    // Update state to failed inside db
    const prismaInner = getPrismaClient();
    if (prismaInner) {
      await prismaInner.outreachActivity.update({
        where: { id: activityId },
        data: {
          status: "FAILED",
          errorMessage: err.message
        }
      }).catch(() => {});
    }
    // Re-throw so BullMQ triggers retry logic!
    throw err;
  }
}

// Subscribing / Registering our worker processor with the queue
outreachQueue.registerWorker(processOutreachJob);

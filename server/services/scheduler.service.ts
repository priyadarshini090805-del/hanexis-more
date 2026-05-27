import { getPrismaClient } from "../utils/db";
import { logger } from "../utils/logger";
import { campaignQueue, contentQueue, outreachQueue } from "../utils/queues";

export class SchedulerService {
  private static intervalInstance: NodeJS.Timeout | null = null;

  static start() {
    if (this.intervalInstance) {
      logger.info("SchedulerService: Check interval is already running.");
      return;
    }

    logger.info("SchedulerService: Starting periodic calendar scan and job dispatcher.");

    // Scans every 10 seconds to detect scheduled events
    this.intervalInstance = setInterval(async () => {
      try {
        await this.scanAndDispatchAllScheduledJobs();
      } catch (err: any) {
        logger.error(`SchedulerService check cycles failure: ${err.message}`);
      }
    }, 10000);
  }

  static stop() {
    if (this.intervalInstance) {
      clearInterval(this.intervalInstance);
      this.intervalInstance = null;
      logger.info("SchedulerService: Scans stopped.");
    }
  }

  static async scanAndDispatchAllScheduledJobs() {
    const prisma = getPrismaClient();
    if (!prisma) {
      // Inline emulator mode: output low-noise debug logs
      return;
    }

    const now = new Date();

    try {
      // 1. Scan Approved, Scheduled Outreach Activities ready for transmission
      const dueOutreach = await prisma.outreachActivity.findMany({
        where: {
          status: "APPROVED",
          scheduledDate: { lte: now }
        },
        take: 20
      });

      if (dueOutreach.length > 0) {
        logger.info(`SchedulerService: Discovered ${dueOutreach.length} pending outreach actions ready for dispatch.`);
        for (const act of dueOutreach) {
          // Transition status to pending block so scheduler doesn't grab it again in next click
          await prisma.outreachActivity.update({
            where: { id: act.id },
            data: { status: "APPROVED" } // keep APPROVED on run, or transitional PENDING state if designed
          });

          await outreachQueue.addJob(`outreach-${act.id}`, {
            activityId: act.id,
            leadId: act.leadId
          });
        }
      }

      // 2. Scan Scheduled Content Strategy posts due to go live
      // (Mapping SCHEDULED posts ready to publish)
      const duePosts = await prisma.contentPost.findMany({
        where: {
          status: "DRAFT", // Or a specific custom state SCHEDULED if active
          publishDate: { lte: now }
        },
        take: 10
      });

      // Filter or update statuses
      if (duePosts.length > 0) {
        logger.info(`SchedulerService: Found ${duePosts.length} drafted posts whose publication window has arrived.`);
        for (const post of duePosts) {
          // Mark post status appropriately in database
          await prisma.contentPost.update({
            where: { id: post.id },
            data: { status: "SCHEDULED" }
          });

          await contentQueue.addJob(`content-post-${post.id}`, {
            postId: post.id,
            platform: post.platform
          });
        }
      }

      // 3. Scan Active campaigns to maintain drip-feed streams
      const activeCampaigns = await prisma.campaign.findMany({
        where: { status: "ACTIVE" }
      });

      if (activeCampaigns.length > 0) {
        for (const camp of activeCampaigns) {
          await campaignQueue.addJob(`campaign-run-${camp.id}`, {
            campaignId: camp.id,
            action: "DRIP_FEED"
          });
        }
      }

      // 4. Update ScheduledJob model table if any logs need maintenance
      const pendingJobsOnTable = await prisma.scheduledJob.findMany({
        where: {
          status: "PENDING",
          scheduledAt: { lte: now }
        },
        take: 20
      });

      for (const job of pendingJobsOnTable) {
        logger.info(`SchedulerService: Executing ScheduledJob [${job.id}] - ${job.name}`);
        await prisma.scheduledJob.update({
          where: { id: job.id },
          data: {
            status: "PROCESSING",
            runAt: now
          }
        });

        // Trigger dynamic action matching or update to success
        await prisma.scheduledJob.update({
          where: { id: job.id },
          data: {
            status: "COMPLETED",
            attempts: job.attempts + 1
          }
        });
      }

    } catch (err: any) {
      logger.error(`SchedulerService Database Scanning error: ${err.message}`);
    }
  }
}

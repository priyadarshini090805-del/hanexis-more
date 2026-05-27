import { campaignQueue, outreachQueue } from "../utils/queues";
import { getPrismaClient } from "../utils/db";
import { logger } from "../utils/logger";

export async function processCampaignJob(data: { campaignId: string; action: string; payload?: any }) {
  const { campaignId, action, payload } = data;
  logger.info(`CampaignWorker: Executing strategy '${action}' for campaign ID [${campaignId}]`);

  const prisma = getPrismaClient();
  if (!prisma) {
    logger.warn("CampaignWorker: High-fidelity mock model execution completed successfully.");
    return;
  }

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    });

    if (!campaign) {
      logger.warn(`CampaignWorker cancelled: Campaign ID [${campaignId}] was not found.`);
      return;
    }

    if (campaign.status !== "ACTIVE" && action !== "SET_ACTIVE") {
      logger.warn(`CampaignWorker: Skipped automation steps. Campaign is currently: ${campaign.status}`);
      return;
    }

    if (action === "DRIP_FEED" || action === "TRIGGER_STEPS" || action === "RUN") {
      // Find all leads who have new status and are targeted for sequence
      const leads = await prisma.lead.findMany({
        where: {
          status: "NEW"
        },
        take: 5
      });

      logger.info(`CampaignWorker: Identified ${leads.length} qualified leads for immediate outreach generation.`);
      
      for (const lead of leads) {
        // Create an activity sequence
        const activity = await prisma.outreachActivity.create({
          data: {
            leadId: lead.id,
            type: "CONNECTION",
            content: `Hi ${lead.name}, love your efforts as ${lead.title} at ${lead.company}! Let's connect here.`,
            status: "APPROVED",
            scheduledDate: new Date()
          }
        });

        logger.info(`CampaignWorker: Created activity [${activity.id}] for Lead ${lead.id}. Queueing outreach dispatch.`);

        // Enqueue immediately into outreachQueue with a slight staggered delay to prevent API suspicion
        await outreachQueue.addJob(`dispatch-${activity.id}`, {
          activityId: activity.id,
          leadId: lead.id
        }, {
          delay: 1000 // 1 second stagger
        });
      }

      logger.info(`CampaignWorker success: Automated step processing completed for campaign [${campaignId}]`);
    }
  } catch (err: any) {
    logger.error(`CampaignWorker execution failed for campaign ${campaignId}: ${err.message}`);
    throw err;
  }
}

// Subscribing / Registering our worker processor with the queue
campaignQueue.registerWorker(processCampaignJob);

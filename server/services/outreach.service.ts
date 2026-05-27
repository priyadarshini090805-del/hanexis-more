import { getPrismaClient } from "../utils/db";
import { logger } from "../utils/logger";
import { outreachQueue } from "../utils/queues";

export class OutreachService {
  async getActivities() {
    const prisma = getPrismaClient();
    if (prisma) {
      return prisma.outreachActivity.findMany({
        orderBy: { createdAt: "desc" }
      });
    }
    return [];
  }

  async createActivity(data: any) {
    const prisma = getPrismaClient();
    const typeUpper = (data.type || "connection").toUpperCase();
    const statusUpper = (data.status || "draft").toUpperCase();
    const scheduledDate = data.scheduledDate ? new Date(data.scheduledDate) : null;

    let activity: any;
    if (prisma) {
      try {
        activity = await prisma.outreachActivity.create({
          data: {
            leadId: data.leadId,
            type: typeUpper as any,
            content: data.content,
            status: statusUpper as any,
            scheduledDate
          }
        });
      } catch (err: any) {
        logger.error(`Failed creating database outreach: ${err.message}`);
      }
    }

    if (!activity) {
      activity = {
        id: `sim-act-${Date.now()}`,
        leadId: data.leadId,
        type: typeUpper,
        content: data.content,
        status: statusUpper,
        scheduledDate,
        createdAt: new Date().toISOString()
      };
    }

    if (activity.status === "APPROVED") {
      await this.enqueueActivityJob(activity);
    }

    return activity;
  }

  async updateStatus(id: string, status: string) {
    const prisma = getPrismaClient();
    const mappedStatus = status.toUpperCase();

    let activity: any;
    if (prisma) {
      const updateData: any = { status: mappedStatus as any };
      if (mappedStatus === "SENT") {
        updateData.sentDate = new Date();
      }
      activity = await prisma.outreachActivity.update({
        where: { id },
        data: updateData
      });
    } else {
      activity = { id, status: mappedStatus };
    }

    if (activity.status === "APPROVED") {
      await this.enqueueActivityJob(activity);
    }

    return activity;
  }

  private async enqueueActivityJob(activity: any) {
    let delayMs = 0;
    if (activity.scheduledDate) {
      const diff = new Date(activity.scheduledDate).getTime() - Date.now();
      if (diff > 0) {
        delayMs = diff;
      }
    }

    logger.info(`OutreachService: Queueing background job for activity [${activity.id}] with calculated delay: ${delayMs}ms.`);
    await outreachQueue.addJob(`outreach-activity-${activity.id}`, {
      activityId: activity.id,
      leadId: activity.leadId
    }, {
      delay: delayMs
    });
  }

  // Real-time automatic scheduling trigger loop representing BullMQ worker
  async runWorkerCycle() {
    const prisma = getPrismaClient();
    if (!prisma) return;

    try {
      // Find all approved / scheduled outreach jobs that are ready to transmit
      const now = new Date();
      const readyJobs = await prisma.outreachActivity.findMany({
        where: {
          status: "APPROVED",
          scheduledDate: { lte: now }
        }
      });

      for (const job of readyJobs) {
        logger.info(`OutreachWorker: Executing active campaign step [${job.id}] for Lead ${job.leadId}`);
        // Simulate social media browser execution cycle or real integration dispatch
        await prisma.outreachActivity.update({
          where: { id: job.id },
          data: {
            status: "SENT",
            sentDate: new Date()
          }
        });
      }
    } catch (e: any) {
      logger.error(`OutreachWorker execution loop failure: ${e.message}`);
    }
  }
}

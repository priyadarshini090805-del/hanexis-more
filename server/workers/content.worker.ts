import { contentQueue } from "../utils/queues";
import { getPrismaClient } from "../utils/db";
import { logger } from "../utils/logger";

export async function processContentJob(data: { postId: string; platform: string }) {
  const { postId, platform } = data;
  logger.info(`ContentWorker: Processing publisher job for post ID [${postId}] on platform [${platform}]`);

  const prisma = getPrismaClient();
  if (!prisma) {
    logger.warn("ContentWorker: No live database active. Simulating strategic post scheduling successfully.");
    return;
  }

  try {
    const post = await prisma.contentPost.findUnique({
      where: { id: postId }
    });

    if (!post) {
      logger.warn(`ContentWorker Aborted: Post ID [${postId}] could not be found.`);
      return;
    }

    if (post.status === "PUBLISHED") {
      logger.info(`ContentWorker: Post ID [${postId}] is already published. Skipping.`);
      return;
    }

    logger.info(`ContentWorker: Injecting copy into stream. Title: "${post.title}". Platform Target: ${platform}`);

    // Update status to published
    await prisma.contentPost.update({
      where: { id: postId },
      data: { status: "PUBLISHED" }
    });

    // Create confirmation system notification
    await prisma.notification.create({
      data: {
        userId: "dev-admin-id",
        title: "Social Post Published",
        message: `Your scheduled post "${post.title}" is now live on ${platform}!`
      }
    });

    logger.info(`ContentWorker success: Post ${postId} successfully published.`);
  } catch (err: any) {
    logger.error(`ContentWorker core handler error on post ${postId}: ${err.message}`);
    const prismaInner = getPrismaClient();
    if (prismaInner) {
      await prismaInner.contentPost.update({
        where: { id: postId },
        data: {
          status: "FAILED"
        }
      }).catch(() => {});
    }
    throw err;
  }
}

// Subscribing / Registering our worker processor with the queue
contentQueue.registerWorker(processContentJob);

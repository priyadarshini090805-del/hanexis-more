import { getPrismaClient } from "../utils/db";
import { logger } from "../utils/logger";
import { contentQueue } from "../utils/queues";

export class ContentService {
  async getPosts() {
    const prisma = getPrismaClient();
    if (prisma) {
      return prisma.contentPost.findMany({
        orderBy: { publishDate: "desc" }
      });
    }
    return [];
  }

  async createPost(data: any) {
    const prisma = getPrismaClient();
    const statusUpper = (data.status || "draft").toUpperCase();
    const platformUpper = (data.platform || "linkedin").toUpperCase();
    const publishDate = new Date(data.publishDate);

    let post: any;
    if (prisma) {
      try {
        post = await prisma.contentPost.create({
          data: {
            title: data.title,
            content: data.content,
            platform: platformUpper as any,
            publishDate,
            status: statusUpper as any,
            visualPrompt: data.visualPrompt || null
          }
        });
      } catch (err: any) {
        logger.error(`Database post creation failure: ${err.message}`);
      }
    }

    if (!post) {
      post = {
        id: `sim-post-${Date.now()}`,
        title: data.title,
        content: data.content,
        platform: platformUpper,
        publishDate,
        status: statusUpper,
        visualPrompt: data.visualPrompt || null,
        createdAt: new Date().toISOString()
      };
    }

    if (post.status === "SCHEDULED") {
      await this.enqueueContentJob(post);
    }

    return post;
  }

  async updatePost(id: string, updates: any) {
    const prisma = getPrismaClient();
    let post: any;

    if (prisma) {
      const formatted: any = { ...updates };
      if (updates.status) formatted.status = updates.status.toUpperCase();
      if (updates.platform) formatted.platform = updates.platform.toUpperCase();
      if (updates.publishDate) formatted.publishDate = new Date(updates.publishDate);

      post = await prisma.contentPost.update({
        where: { id },
        data: formatted
      });
    } else {
      post = { id, ...updates };
    }

    if (post.status === "SCHEDULED") {
      await this.enqueueContentJob(post);
    }

    return post;
  }

  private async enqueueContentJob(post: any) {
    let delayMs = 0;
    if (post.publishDate) {
      const diff = new Date(post.publishDate).getTime() - Date.now();
      if (diff > 0) {
        delayMs = diff;
      }
    }

    logger.info(`ContentService: Scheduling publisher queue job for post ID [${post.id}] with calculated delay: ${delayMs}ms`);
    await contentQueue.addJob(`publish-post-${post.id}`, {
      postId: post.id,
      platform: post.platform
    }, {
      delay: delayMs
    });
  }
}

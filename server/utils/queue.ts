import { Queue as BullQueue, Worker as BullWorker, Job } from "bullmq";
import IORedis from "ioredis";
import { logger } from "./logger";
import { config } from "./config";
import { getPrismaClient } from "./db";

let redisClient: IORedis | null = null;

export function getRedisConnection(): IORedis | null {
  if (!redisClient && config.REDIS_URL) {
    try {
      redisClient = new IORedis(config.REDIS_URL, {
        maxRetriesPerRequest: null,
        connectTimeout: 5000,
        retryStrategy: (times) => {
          // Robust backoff strategy for high-availability Redis reconnections
          const delay = Math.min(times * 200, 10000);
          logger.warn(`Redis: Connection lost. Reconnecting attempt n°${times} in ${delay}ms...`);
          return delay;
        }
      });

      redisClient.on("connect", () => {
        logger.info("Redis: Initializing connection handshakes...");
      });

      redisClient.on("ready", () => {
        logger.info("Redis: Connection established and socket ready.");
      });

      redisClient.on("error", (err) => {
        logger.warn(`Redis: Network connection warning/failures: ${err.message}`);
      });

      redisClient.on("reconnecting", () => {
        logger.info("Redis: Device scheduled reconnect loop proceeding.");
      });
    } catch (e: any) {
      logger.warn(`Redis client creation failed: ${e.message}`);
      redisClient = null;
    }
  }
  return redisClient;
}

export function isRedisActive(): boolean {
  return redisClient !== null && redisClient.status === "ready";
}

// Ensure lazy-loaded client trigger
getRedisConnection();

export class ResilientQueue<T = any> {
  private bullQueue: BullQueue | null = null;
  private name: string;
  private fallbackWorkers: Array<(data: T) => Promise<void>> = [];

  constructor(name: string) {
    this.name = name;
    const conn = getRedisConnection();
    if (conn) {
      try {
        this.bullQueue = new BullQueue(name, {
          connection: conn as any,
          defaultJobOptions: {
            attempts: 3,
            backoff: {
              type: "exponential",
              delay: 2000,
            },
            removeOnComplete: { count: 100 },
            removeOnFail: { count: 500 },
          },
        });
        logger.info(`BullMQ: Switched on active '${name}' production queue.`);
      } catch (err: any) {
        logger.warn(`BullMQ initialization failure for '${name}': ${err.message}. Defaulting to in-memory fallback.`);
      }
    }
  }

  async addJob(jobName: string, data: T, options?: { delay?: number; attempts?: number }) {
    if (this.bullQueue && isRedisActive()) {
      try {
        const attempts = options?.attempts ?? 3;
        const jobOpts: any = {
          delay: options?.delay,
          attempts,
          backoff: {
            type: "exponential",
            delay: 2000,
          },
        };
        const job = await this.bullQueue.add(jobName, data, jobOpts);
        logger.info(`BullMQ: Enqueued job '${jobName}' (ID: ${job.id}) on [${this.name}] queue with delay: ${options?.delay ?? 0}ms.`);
        return job;
      } catch (err: any) {
        logger.warn(`BullMQ: Failed enqueueing job '${jobName}', triggering immediate fallback run: ${err.message}`);
      }
    }

    // High fidelity simulator triggers the execution after a delay or immediately
    if (options?.delay && options.delay > 0) {
      setTimeout(async () => {
        await this.runFallback(data);
      }, options.delay);
    } else {
      // Async trigger
      setImmediate(async () => {
        await this.runFallback(data);
      });
    }
    return null;
  }

  registerWorker(processor: (data: T) => Promise<void>) {
    this.fallbackWorkers.push(processor);

    const conn = getRedisConnection();
    if (conn) {
      try {
        const worker = new BullWorker(
          this.name,
          async (job: Job) => {
            logger.info(`BullMQ Worker [${this.name}]: Processing job ID: ${job.id}, Name: ${job.name}`);
            await processor(job.data);
          },
          { connection: conn as any }
        );

        // Subscribing to lifecycle events inside BullWorker
        worker.on("completed", (job) => {
          logger.info(`BullMQ Worker [${this.name}]: Job ID: ${job?.id} successfully completed.`);
        });

        worker.on("failed", (job, err) => {
          const attemptsMade = job?.attemptsMade ?? 0;
          const maxAttempts = job?.opts?.attempts ?? 3;
          logger.error(`BullMQ Worker [${this.name}]: Job ID: ${job?.id} failed on tier ${attemptsMade}/${maxAttempts}. Error: ${err.message}`);

          // Dead letter logic: if all retries are exhausted, put to Dead-Letter Log
          if (attemptsMade >= maxAttempts) {
            logger.error(`🚨 [DEAD-LETTER EVENT - ${this.name}]: Job ID: ${job?.id} has exceeded maximum retries (${maxAttempts}). Content quarantined. Payload: ${JSON.stringify(job?.data)}`);
            this.moveToDeadLetter(job, err);
          }
        });

        worker.on("stalled", (jobId) => {
          logger.warn(`BullMQ Worker [${this.name}]: Job ID: ${jobId} got stalled. BullMQ will re-run it dynamically.`);
        });

        logger.info(`BullMQ Worker: Subscribed listener for production '${this.name}' successfully with full lifecycle handler.`);
      } catch (e: any) {
        logger.warn(`BullMQ Worker subscription fail for '${this.name}': ${e.message}`);
      }
    }
  }

  async getMetrics() {
    if (this.bullQueue && isRedisActive()) {
      try {
        const [waiting, active, failed, completed] = await Promise.all([
          this.bullQueue.getWaitingCount(),
          this.bullQueue.getActiveCount(),
          this.bullQueue.getFailedCount(),
          this.bullQueue.getCompletedCount()
        ]);
        return { name: this.name, status: "ACTIVE", waiting, active, failed, completed };
      } catch (e: any) {
        return { name: this.name, status: "DEGRADED", error: e.message, waiting: 0, active: 0, failed: 0, completed: 0 };
      }
    }
    return { name: this.name, status: "MEM_SIMULATOR", waiting: 0, active: 0, failed: 0, completed: 0 };
  }

  async close() {
    if (this.bullQueue) {
      await this.bullQueue.close();
    }
  }

  private async moveToDeadLetter(job: Job | undefined, err: Error) {
    // Save to database/ScheduledJob table if Prisma is active to quarantine it, or log out clearly
    const prisma = getPrismaClient();
    if (prisma && job) {
      try {
        await prisma.scheduledJob.create({
          data: {
            name: `DEAD_LETTER_${this.name}_${job.name}`,
            payload: job.data || {},
            status: "FAILED",
            attempts: job.attemptsMade,
            errorMessage: `${err.message} | Stack: ${err.stack}`,
            scheduledAt: new Date(),
            runAt: new Date()
          }
        });
        logger.info(`Prisma: Saved dead-letter registration for job [${job.id}] to Database for administrator remediation.`);
      } catch (e: any) {
        logger.error(`Prisma error logging dead-letter for job: ${e.message}`);
      }
    }
  }

  private async runFallback(data: T) {
    logger.debug(`Queue Simulator: Dequeuing custom frame job in '${this.name}' background worker.`);
    for (const worker of this.fallbackWorkers) {
      try {
        await worker(data);
      } catch (e: any) {
        logger.error(`Queue Simulator Worker error on '${this.name}': ${e.message}`);
      }
    }
  }
}

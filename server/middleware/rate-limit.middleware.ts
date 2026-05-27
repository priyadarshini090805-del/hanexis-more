import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { getRedisConnection, isRedisActive } from "../utils/queue";

// Local sliding window fallback map
const rateLimits = new Map<string, { count: number; resetAt: number }>();

export function rateLimiter(windowMs = 60 * 1000, maxRequests = 100) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.headers["x-forwarded-for"]?.toString() || "local-ip";
    const key = `rate_limit:${ip}:${req.path}`;
    const now = Date.now();

    // 1. Attempt Redis-backed atomic rate limit configuration
    if (isRedisActive()) {
      const redis = getRedisConnection();
      if (redis) {
        try {
          const current = await redis.get(key);
          if (current) {
            const count = parseInt(current, 10);
            if (count >= maxRequests) {
              const ttl = await redis.ttl(key);
              logger.warn(`Rate limit triggered in Redis: IP ${ip} exceeded maximum of ${maxRequests} requests for ${req.path}`);
              return res.status(429).json({
                error: "Too many requests. Please try again later.",
                resetInSeconds: ttl > 0 ? ttl : Math.ceil(windowMs / 1000)
              });
            }
            await redis.incr(key);
          } else {
            // Force set & expire in transactional block
            await redis.multi()
              .set(key, "1")
              .pexpire(key, windowMs)
              .exec();
          }
          return next();
        } catch (e: any) {
          logger.warn(`Redis Rate Limiter failed: ${e.message}. Falling back safely to in-memory check.`);
        }
      }
    }

    // 2. High-availability Sliding Map Fallback
    const record = rateLimits.get(key);

    if (!record || now > record.resetAt) {
      rateLimits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    record.count += 1;
    if (record.count > maxRequests) {
      logger.warn(`Rate limit triggered in Memory: IP ${ip} exceeded maximum of ${maxRequests} requests for ${req.path}`);
      return res.status(429).json({
        error: "Too many requests. Please try again later.",
        resetInSeconds: Math.ceil((record.resetAt - now) / 1000)
      });
    }

    next();
  };
}

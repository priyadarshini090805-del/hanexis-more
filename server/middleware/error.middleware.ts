import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export function globalErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || "An unexpected system error occurred";

  logger.error(`API Error: ${message}`, {
    path: req.path,
    method: req.method,
    stack: process.env.NODE_ENV !== "production" ? err.stack : undefined
  });

  res.status(statusCode).json({
    error: message,
    status: statusCode,
    timestamp: new Date().toISOString()
  });
}

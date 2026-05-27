import winston from "winston";

const winstonInstance = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "harnexis-core" },
  transports: [
    new winston.transports.Console({
      format: process.env.NODE_ENV === "production"
        ? winston.format.json() // Clean structured JSON outputs in production
        : winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
              const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
              return `[${timestamp}] ${level}: ${message}${metaString}`;
            })
          )
    })
  ]
});

export const logger = {
  info: (message: string, ...meta: any[]) => {
    winstonInstance.info(message, ...meta);
  },
  warn: (message: string, ...meta: any[]) => {
    winstonInstance.warn(message, ...meta);
  },
  error: (message: string, ...meta: any[]) => {
    winstonInstance.error(message, ...meta);
  },
  debug: (message: string, ...meta: any[]) => {
    winstonInstance.debug(message, ...meta);
  }
};

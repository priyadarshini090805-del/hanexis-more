import { suite, test, expect } from "./framework";
import { isDbActive } from "../utils/db";
import { isRedisActive } from "../utils/queue";
import { config } from "../utils/config";

export function runIntegrationTests() {
  suite("Harnexis Integrated Services Test Suite", () => {
    test("Database connection indicators should execute cleanly", () => {
      const dbStatus = isDbActive();
      expect(typeof dbStatus).toBe("boolean");
    });

    test("Redis connection status indicators should execute cleanly", () => {
      const redisStatus = isRedisActive();
      expect(typeof redisStatus).toBe("boolean");
    });

    test("Default environment parameters should default gracefully", () => {
      expect(config.PORT).toBeDefined();
      expect(config.NODE_ENV).toBeDefined();
    });
  });
}

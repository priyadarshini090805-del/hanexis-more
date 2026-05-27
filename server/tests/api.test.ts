import { suite, test, expect } from "./framework";
import { rateLimiter } from "../middleware/rate-limit.middleware";

export function runApiTests() {
  suite("Harnexis API Architecture & Middleware Security Tests", () => {
    test("Rate limiter factory should configure express middleware successfully", () => {
      const limitingMiddleware = rateLimiter(5000, 5);
      expect(limitingMiddleware).toBeDefined();
      expect(typeof limitingMiddleware).toBe("function");
    });
  });
}

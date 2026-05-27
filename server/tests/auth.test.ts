import { suite, test, expect } from "./framework";
import { generateAccessToken, verifyAccessToken } from "../utils/jwt";

export function runAuthTests() {
  suite("Harnexis Core Authentication Engine Tests", () => {
    const testPayload = {
      userId: "test-user-id",
      email: "test@harnexis.co",
      role: "TEAM_MEMBER" as const
    };

    test("Should generate access tokens successfully", () => {
      const token = generateAccessToken(testPayload);
      expect(token).toBeDefined();
      expect(token).toBeTypeOf("string");
    });

    test("Should decode verified access tokens accurately", () => {
      const token = generateAccessToken(testPayload);
      const decoded = verifyAccessToken(token);
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.email).toBe(testPayload.email);
      expect(decoded.role).toBe(testPayload.role);
    });
  });
}

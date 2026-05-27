import { suite, test, expect } from "./framework";
import { ResilientQueue } from "../utils/queue";

export function runQueueTests() {
  suite("Harnexis Queue & Background Processing Tests", () => {
    test("Should register workers and run fallback execution gracefully if offline", async () => {
      const testQueue = new ResilientQueue<{ message: string }>("test-harness-queue");
      
      let wasProcessed = false;
      let processedPayload = "";

      testQueue.registerWorker(async (data) => {
        wasProcessed = true;
        processedPayload = data.message;
      });

      // Run fallback execution
      await testQueue.addJob("test-job", { message: "dispatch-success" });

      // Backoffs and fallbacks execution are schedules. Wait short tick to verify
      await new Promise((resolve) => setTimeout(resolve, 30));

      expect(wasProcessed).toBeTruthy();
      expect(processedPayload).toBe("dispatch-success");
    });

    test("Should correctly produce queue status and telemetry counts", async () => {
      const testQueue = new ResilientQueue<any>("test-telemetry-queue");
      const metrics = await testQueue.getMetrics();
      expect(metrics.name).toBe("test-telemetry-queue");
      expect(metrics.status).toBeDefined();
    });
  });
}

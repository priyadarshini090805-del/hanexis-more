import { runAuthTests } from "./auth.test";
import { runQueueTests } from "./queues.test";
import { runApiTests } from "./api.test";
import { runIntegrationTests } from "./integration.test";
import { reportAndExit } from "./framework";

async function executeAllTests() {
  runAuthTests();
  runQueueTests();
  runApiTests();
  runIntegrationTests();

  // Print results and yield correct process exit status for CI/CD checks
  reportAndExit();
}

executeAllTests();

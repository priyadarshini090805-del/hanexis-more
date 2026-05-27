import { logger } from "../utils/logger";

let passCount = 0;
let failCount = 0;

export const suite = (name: string, fn: () => void | Promise<void>) => {
  logger.info(`\n🧪 Test Suite: [${name}]`);
  try {
    fn();
  } catch (err: any) {
    logger.error(`Suite initialization crashed: ${err.message}`);
  }
};

export const test = async (name: string, fn: () => Promise<void> | void) => {
  try {
    await fn();
    logger.info(`  ✅ PASSED: ${name}`);
    passCount++;
  } catch (err: any) {
    logger.error(`  ❌ FAILED: ${name}\n     -> Error: ${err.message}`);
    failCount++;
  }
};

export const expect = (actual: any) => ({
  toBe: (expected: any) => {
    if (actual !== expected) {
      throw new Error(`Expected ${JSON.stringify(expected)} but retrieved ${JSON.stringify(actual)}`);
    }
  },
  toBeDefined: () => {
    if (actual === undefined || actual === null) {
      throw new Error(`Expected value to be defined, but retrieved ${actual}`);
    }
  },
  toBeTypeOf: (expectedType: string) => {
    if (typeof actual !== expectedType) {
      throw new Error(`Expected type to be '${expectedType}' but retrieved '${typeof actual}'`);
    }
  },
  toBeTruthy: () => {
    if (!actual) {
      throw new Error(`Expected value to be truthy, but retrieved ${actual}`);
    }
  }
});

export function reportAndExit() {
  logger.info(`\n📊 Test Run Summary:`);
  logger.info(`   Passed tests: ${passCount}`);
  logger.info(`   Failed tests: ${failCount}`);
  if (failCount > 0) {
    logger.error(`🚨 Test execution concluded with ${failCount} issues. Aborting.`);
    process.exit(1);
  } else {
    logger.info(`🎉 All ${passCount} unit and integration tests passed cleanly.`);
  }
}

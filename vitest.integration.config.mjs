import assert from "node:assert/strict";
import { defineConfig } from "vitest/config";

assert.ok(
  process.env.DATABASE_TEST_URL,
  "test:integration requires DATABASE_TEST_URL for a migrated disposable database",
);

export default defineConfig({
  test: {
    include: ["src/**/*.integration.test.ts"],
    passWithNoTests: false,
    allowOnly: false,
    reporters: [
      "default",
      {
        onTestRunEnd(modules) {
          assert.ok(modules.length > 0, "No integration suites executed");
          let executed = 0;
          for (const testModule of modules) {
            assert.equal(testModule.state(), "passed", testModule.moduleId);
            const tests = [...testModule.children.allTests()];
            assert.ok(
              tests.length > 0,
              `Empty integration suite: ${testModule.moduleId}`,
            );
            for (const test of tests) {
              assert.equal(test.result().state, "passed", test.fullName);
              executed += 1;
            }
          }
          console.log(
            `[integration] ${modules.length} suites, ${executed} tests executed; zero skips`,
          );
        },
      },
    ],
  },
});

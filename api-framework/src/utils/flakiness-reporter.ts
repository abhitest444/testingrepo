import type { Reporter, TestResult as VitestTestResult, TestModule } from 'vitest';
import { recordResult, type TestResult } from './flakiness';

/**
 * Vitest Flakiness Reporter — automatically tracks test outcomes.
 *
 * Add to vitest.config.ts:
 *   reporters: ['default', new FlakinessReporter()]
 *
 * Or via CLI:
 *   npx vitest run --reporter=default --reporter=./src/utils/flakiness-reporter.ts
 */
export class FlakinessReporter implements Reporter {
  onTestModuleResult(testModule: TestModule): void {
    for (const test of testModule.getAllTests()) {
      const result = test.result();
      if (!result) continue;

      const status = result.state === 'pass' ? 'passed'
        : result.state === 'fail' ? 'failed'
        : 'skipped';

      const testResult: TestResult = {
        name: test.name,
        file: test.moduleId,
        status,
        duration: result.duration ?? 0,
        retries: (result as any).retryCount ?? 0,
        timestamp: new Date().toISOString(),
      };

      recordResult(testResult);
    }
  }
}

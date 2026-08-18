import fs from 'node:fs';
import path from 'node:path';

/**
 * Flakiness Tracker — records test outcomes across runs to detect flaky tests.
 *
 * How it works:
 * 1. After each test run, results are appended to a JSON file
 * 2. A test is "flaky" if it passed and failed in the last N runs
 * 3. A test is "quarantined" if it flaked > threshold times
 *
 * Usage in CI:
 *   npm test -- --reporter=default --reporter=json > results.json
 *   node src/utils/flakiness.ts analyze
 *
 * Flakiness report:
 *   tests/flakiness-report.json
 */

export type TestResult = {
  name: string;
  file: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  retries: number;
  timestamp: string;
};

export type FlakinessReport = {
  generatedAt: string;
  totalTests: number;
  flakyTests: FlakyTest[];
  quarantinedTests: string[];
  stats: {
    totalRuns: number;
    avgDuration: number;
    flakyRate: number;
  };
};

export type FlakyTest = {
  name: string;
  file: string;
  passCount: number;
  failCount: number;
  totalRuns: number;
  flakyRate: number;
  lastStatus: 'passed' | 'failed';
  recentResults: ('passed' | 'failed')[];
};

const RESULTS_DIR = path.resolve(__dirname, '../../tests');
const RESULTS_FILE = path.join(RESULTS_DIR, 'test-results.jsonl');
const REPORT_FILE = path.join(RESULTS_DIR, 'flakiness-report.json');
const QUARANTINE_FILE = path.join(RESULTS_DIR, 'quarantine.json');

const MAX_HISTORY = 20; // look at last 20 runs
const FLAKY_THRESHOLD = 0.2; // >20% different outcomes = flaky
const QUARANTINE_THRESHOLD = 3; // quarantined after 3 flaky detections

/**
 * Append a test result to the JSONL log file.
 */
export function recordResult(result: TestResult): void {
  const line = JSON.stringify({ ...result, timestamp: new Date().toISOString() }) + '\n';
  fs.mkdirSync(path.dirname(RESULTS_FILE), { recursive: true });
  fs.appendFileSync(RESULTS_FILE, line);
}

/**
 * Read all historical results, grouped by test name.
 */
function readHistory(): Map<string, TestResult[]> {
  const history = new Map<string, TestResult[]>();

  if (!fs.existsSync(RESULTS_FILE)) return history;

  const lines = fs.readFileSync(RESULTS_FILE, 'utf-8').split('\n').filter(Boolean);
  for (const line of lines) {
    try {
      const result: TestResult = JSON.parse(line);
      const key = `${result.file}::${result.name}`;
      if (!history.has(key)) history.set(key, []);
      history.get(key)!.push(result);
    } catch {
      // skip malformed lines
    }
  }

  return history;
}

/**
 * Analyze flakiness across all tracked tests.
 */
export function analyzeFlakiness(): FlakinessReport {
  const history = readHistory();
  const quarantined = readQuarantine();
  const flakyTests: FlakyTest[] = [];

  for (const [key, results] of history) {
    // Only look at recent results
    const recent = results.slice(-MAX_HISTORY);
    if (recent.length < 3) continue; // need at least 3 data points

    const passCount = recent.filter((r) => r.status === 'passed').length;
    const failCount = recent.filter((r) => r.status === 'failed').length;
    const totalRuns = recent.length;

    // A test is flaky if outcomes are mixed
    const flakyRate = Math.min(passCount, failCount) / totalRuns;
    if (flakyRate > 0 && flakyRate >= FLAKY_THRESHOLD * 0.5) {
      const [file, name] = key.split('::');
      flakyTests.push({
        name,
        file,
        passCount,
        failCount,
        totalRuns,
        flakyRate: Math.round(flakyRate * 100) / 100,
        lastStatus: recent[recent.length - 1].status as 'passed' | 'failed',
        recentResults: recent.map((r) => r.status as 'passed' | 'failed'),
      });
    }
  }

  // Sort by flaky rate descending
  flakyTests.sort((a, b) => b.flakyRate - a.flakyRate);

  // Calculate stats
  const allResults = [...history.values()].flat();
  const avgDuration = allResults.length > 0
    ? allResults.reduce((sum, r) => sum + r.duration, 0) / allResults.length
    : 0;

  const report: FlakinessReport = {
    generatedAt: new Date().toISOString(),
    totalTests: history.size,
    flakyTests,
    quarantinedTests: quarantined,
    stats: {
      totalRuns: allResults.length,
      avgDuration: Math.round(avgDuration),
      flakyRate: history.size > 0 ? Math.round((flakyTests.length / history.size) * 100) / 100 : 0,
    },
  };

  // Write report
  fs.mkdirSync(path.dirname(REPORT_FILE), { recursive: true });
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));

  return report;
}

/**
 * Check if a test is quarantined (should be skipped).
 */
export function isQuarantined(testName: string, file: string): boolean {
  const quarantined = readQuarantine();
  return quarantined.includes(`${file}::${testName}`);
}

/**
 * Auto-quarantine tests that are consistently flaky.
 */
export function updateQuarantine(): string[] {
  const report = analyzeFlakiness();
  const quarantined: string[] = [];

  for (const flaky of report.flakyTests) {
    if (flaky.flakyRate >= FLAKY_THRESHOLD && flaky.totalRuns >= QUARANTINE_THRESHOLD) {
      quarantined.push(`${flaky.file}::${flaky.name}`);
    }
  }

  fs.mkdirSync(path.dirname(QUARANTINE_FILE), { recursive: true });
  fs.writeFileSync(QUARANTINE_FILE, JSON.stringify(quarantined, null, 2));

  return quarantined;
}

/**
 * Read the quarantine list.
 */
function readQuarantine(): string[] {
  if (!fs.existsSync(QUARANTINE_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(QUARANTINE_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

/**
 * Clear history (for fresh starts).
 */
export function clearHistory(): void {
  if (fs.existsSync(RESULTS_FILE)) {
    fs.unlinkSync(RESULTS_FILE);
  }
  if (fs.existsSync(REPORT_FILE)) {
    fs.unlinkSync(REPORT_FILE);
  }
  if (fs.existsSync(QUARANTINE_FILE)) {
    fs.unlinkSync(QUARANTINE_FILE);
  }
}

// CLI entry point
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'analyze': {
      const report = analyzeFlakiness();
      console.log(`\n📊 Flakiness Report`);
      console.log(`   Total tests tracked: ${report.totalTests}`);
      console.log(`   Flaky tests: ${report.flakyTests.length}`);
      console.log(`   Quarantined: ${report.quarantinedTests.length}`);
      console.log(`   Avg duration: ${report.stats.avgDuration}ms`);
      console.log(`   Flaky rate: ${(report.stats.flakyRate * 100).toFixed(1)}%`);

      if (report.flakyTests.length > 0) {
        console.log(`\n   ⚠ Flaky tests:`);
        for (const flaky of report.flakyTests) {
          console.log(`     ${flaky.name} (${flaky.flakyRate * 100}% flaky, ${flaky.passCount}P/${flaky.failCount}F)`);
        }
      }

      console.log(`\n   Report: ${REPORT_FILE}`);
      break;
    }
    case 'quarantine': {
      const quarantined = updateQuarantine();
      console.log(`🔒 Quarantined ${quarantined.length} tests`);
      for (const q of quarantined) {
        console.log(`   ${q}`);
      }
      break;
    }
    case 'clear': {
      clearHistory();
      console.log('🗑️  History cleared');
      break;
    }
    default:
      console.log('Usage: node flakiness.ts [analyze|quarantine|clear]');
  }
}

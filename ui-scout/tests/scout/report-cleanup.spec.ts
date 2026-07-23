import fs from 'fs';
import os from 'os';
import path from 'path';
import { test, expect } from '@playwright/test';
import { resetScoutArtifacts } from '../../src/scout/report';

test('resetScoutArtifacts removes stale scout artifacts', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'scout-cleanup-'));
  const outputDir = path.join(tempRoot, 'scout-report');

  const dirs = [
    path.join(outputDir, 'screenshots'),
    path.join(outputDir, 'diffs'),
    path.join(outputDir, 'shards'),
  ];

  for (const dir of dirs) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(path.join(outputDir, 'scout-report.json'), '{}');
  fs.writeFileSync(path.join(outputDir, 'scout-report.html'), '<html></html>');
  fs.writeFileSync(path.join(outputDir, 'screenshots', 'stale.png'), 'stale');
  fs.writeFileSync(path.join(outputDir, 'diffs', 'stale.diff.png'), 'stale');
  fs.writeFileSync(path.join(outputDir, 'shards', 'old.json'), '{}');

  resetScoutArtifacts(outputDir);

  expect(fs.existsSync(path.join(outputDir, 'scout-report.json'))).toBe(false);
  expect(fs.existsSync(path.join(outputDir, 'scout-report.html'))).toBe(false);
  expect(fs.existsSync(path.join(outputDir, 'screenshots'))).toBe(false);
  expect(fs.existsSync(path.join(outputDir, 'diffs'))).toBe(false);
  expect(fs.existsSync(path.join(outputDir, 'shards'))).toBe(false);
});

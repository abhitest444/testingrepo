import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import type { ScoutIssue } from './types';

export type VisualCompareOptions = {
  baselineDir: string;
  diffDir: string;
  /** Fraction of differing pixels that triggers a finding (0–1). */
  threshold: number;
  updateBaselines: boolean;
};

export type VisualCompareResult = {
  issues: ScoutIssue[];
  baselinePath: string;
  diffPath?: string;
  diffRatio?: number;
};

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function readPng(filePath: string): PNG {
  return PNG.sync.read(fs.readFileSync(filePath));
}

/**
 * Compare a fresh screenshot against a baseline. Creates the baseline on first run
 * (or when updateBaselines is true).
 */
export function compareScreenshotToBaseline(
  pageUrl: string,
  currentPath: string,
  baselineName: string,
  options: VisualCompareOptions,
): VisualCompareResult {
  ensureDir(options.baselineDir);
  ensureDir(options.diffDir);

  const baselinePath = path.join(options.baselineDir, baselineName);
  const diffPath = path.join(options.diffDir, baselineName.replace(/\.png$/i, '.diff.png'));

  if (options.updateBaselines || !fs.existsSync(baselinePath)) {
    fs.copyFileSync(currentPath, baselinePath);
    return {
      baselinePath,
      issues: [
        {
          category: 'visual',
          severity: 'minor',
          message: options.updateBaselines
            ? 'Visual baseline updated'
            : 'Visual baseline created (first run)',
          url: pageUrl,
          details: baselinePath,
        },
      ],
    };
  }

  const img1 = readPng(baselinePath);
  const img2 = readPng(currentPath);

  if (img1.width !== img2.width || img1.height !== img2.height) {
    return {
      baselinePath,
      diffPath,
      issues: [
        {
          category: 'visual',
          severity: 'serious',
          message: 'Screenshot dimensions differ from baseline',
          url: pageUrl,
          details: `baseline ${img1.width}×${img1.height} vs current ${img2.width}×${img2.height}`,
        },
      ],
    };
  }

  const { width, height } = img1;
  const diff = new PNG({ width, height });
  const mismatched = pixelmatch(img1.data, img2.data, diff.data, width, height, {
    threshold: 0.1,
    includeAA: false,
  });

  const total = width * height;
  const diffRatio = total === 0 ? 0 : mismatched / total;

  if (diffRatio > options.threshold) {
    fs.writeFileSync(diffPath, PNG.sync.write(diff));
    return {
      baselinePath,
      diffPath,
      diffRatio,
      issues: [
        {
          category: 'visual',
          severity: diffRatio > options.threshold * 5 ? 'serious' : 'moderate',
          message: `Visual regression (${(diffRatio * 100).toFixed(2)}% pixels differ)`,
          url: pageUrl,
          details: `threshold=${(options.threshold * 100).toFixed(2)}% · diff=${diffPath}`,
        },
      ],
    };
  }

  if (fs.existsSync(diffPath)) {
    fs.unlinkSync(diffPath);
  }

  return { baselinePath, diffRatio, issues: [] };
}

export function screenshotBasename(runName: string, pageUrl: string, origin: string): string {
  const safeName =
    pageUrl
      .replace(origin, '')
      .replace(/[^\w.-]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'root';
  return `${runName}_${safeName}.png`;
}

import { After, AfterAll, Before, BeforeAll, Status } from '@cucumber/cucumber';
import fs from 'fs';
import path from 'path';
import type { PlaywrightWorld } from './world';

const artifactDir = path.join(process.cwd(), 'cucumber-report', 'artifacts');

BeforeAll(function () {
  fs.mkdirSync(artifactDir, { recursive: true });
});

Before(async function (this: PlaywrightWorld) {
  await this.openBrowser();
});

After(async function (this: PlaywrightWorld, { pickle, result }) {
  if (result?.status === Status.FAILED && this.page) {
    const safe = pickle.name.replace(/[^\w.-]+/g, '_').slice(0, 80);
    const shotPath = path.join(artifactDir, `${safe}.png`);
    await this.page.screenshot({ path: shotPath, fullPage: true });
    // Attach into the Cucumber HTML report when supported.
    if (this.attach) {
      const buffer = fs.readFileSync(shotPath);
      await this.attach(buffer, 'image/png');
    }
  }
  await this.closeBrowser();
});

AfterAll(function () {
  // Placeholder for suite-level cleanup (API data, shared locks, etc.).
});

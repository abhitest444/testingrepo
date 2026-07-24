import { expect, test } from '@playwright/test';

/**
 * Demonstrates Playwright clock control for time-dependent UI.
 * Self-contained page (no third-party app) so the example stays deterministic.
 */
test.describe('Clock control', () => {
  test('frozen clock drives visible timestamps @clock', async ({ page }) => {
    const start = new Date('2030-01-15T10:00:00Z');
    await page.clock.install({ time: start });
    await page.clock.pauseAt(start);

    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <h1 id="stamp"></h1>
          <button id="tick">Refresh</button>
          <script>
            const stamp = document.getElementById('stamp');
            const render = () => {
              // Truncate to seconds — portfolio demo cares about controlled time, not ms jitter.
              stamp.textContent = new Date().toISOString().slice(0, 19) + 'Z';
            };
            render();
            document.getElementById('tick').addEventListener('click', render);
          </script>
        </body>
      </html>
    `);

    await expect(page.locator('#stamp')).toHaveText('2030-01-15T10:00:00Z');

    await page.clock.fastForward('05:00');
    await page.locator('#tick').click();
    await expect(page.locator('#stamp')).toHaveText('2030-01-15T10:05:00Z');
  });

  test('runFor advances timers without waiting wall clock @clock', async ({ page }) => {
    const start = new Date('2030-06-01T12:00:00Z');
    await page.clock.install({ time: start });
    await page.clock.pauseAt(start);

    await page.setContent(`
      <!DOCTYPE html>
      <body>
        <p id="status">idle</p>
        <script>
          setTimeout(() => {
            const when = new Date().toISOString().slice(0, 19) + 'Z';
            document.getElementById('status').textContent = 'ready @ ' + when;
          }, 30_000);
        </script>
      </body>
    `);

    await expect(page.locator('#status')).toHaveText('idle');
    await page.clock.runFor(30_000);
    await expect(page.locator('#status')).toHaveText('ready @ 2030-06-01T12:00:30Z');
  });
});

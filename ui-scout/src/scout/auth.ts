import fs from 'fs';
import path from 'path';
import type { Page } from '@playwright/test';
import { users } from '../data/users';
import { InventoryPage } from '../pages/InventoryPage';
import { LoginPage } from '../pages/LoginPage';

export type ScoutAuthMode = 'none' | 'form' | 'sauce';

export const SCOUT_AUTH_FILE = path.join(__dirname, '../../.auth/user.json');

function env(name: string, fallback = ''): string {
  return (process.env[name] ?? fallback).trim();
}

export function defaultBaseURL(): string {
  return env('BASE_URL', 'https://www.saucedemo.com');
}

export function isSauceDemoBase(baseURL = defaultBaseURL()): boolean {
  return /saucedemo\.com/i.test(baseURL);
}

/**
 * Auth mode for Scout:
 * - none  → public crawl, empty storageState
 * - form  → generic username/password form via selectors
 * - sauce → Sauce Demo POM login (portfolio default)
 *
 * Auto: form if username+user selector set; else sauce on Sauce Demo; else none.
 */
export function resolveScoutAuthMode(): ScoutAuthMode {
  const raw = env('SCOUT_AUTH').toLowerCase();
  if (raw === 'none' || raw === 'form' || raw === 'sauce') return raw;

  if (env('SCOUT_USERNAME') && env('SCOUT_USER_SELECTOR')) return 'form';
  if (isSauceDemoBase()) return 'sauce';
  return 'none';
}

export function ensureAuthDir(): void {
  fs.mkdirSync(path.dirname(SCOUT_AUTH_FILE), { recursive: true });
}

export async function writeEmptyStorageState(filePath = SCOUT_AUTH_FILE): Promise<void> {
  ensureAuthDir();
  fs.writeFileSync(
    filePath,
    JSON.stringify({ cookies: [], origins: [] }, null, 2),
    'utf8',
  );
}

async function loginWithSaucePom(page: Page): Promise<void> {
  const loginPage = new LoginPage(page);
  const inventoryPage = new InventoryPage(page);
  await loginPage.open();
  await loginPage.login(users.standard);
  await inventoryPage.expectLoaded();
}

async function loginWithGenericForm(page: Page): Promise<void> {
  const username = env('SCOUT_USERNAME') || env('STANDARD_USER');
  const password = env('SCOUT_PASSWORD') || env('STANDARD_PASSWORD');
  const userSelector = env('SCOUT_USER_SELECTOR');
  const passwordSelector = env('SCOUT_PASSWORD_SELECTOR');
  const submitSelector = env('SCOUT_SUBMIT_SELECTOR', 'button[type="submit"]');
  const loginPath = env('SCOUT_LOGIN_PATH', '/');
  const successUrl = env('SCOUT_SUCCESS_URL');
  const successSelector = env('SCOUT_SUCCESS_SELECTOR');

  if (!username || !password) {
    throw new Error(
      'SCOUT_AUTH=form requires SCOUT_USERNAME and SCOUT_PASSWORD (or STANDARD_USER / STANDARD_PASSWORD).',
    );
  }
  if (!userSelector || !passwordSelector) {
    throw new Error(
      'SCOUT_AUTH=form requires SCOUT_USER_SELECTOR and SCOUT_PASSWORD_SELECTOR (CSS or Playwright selectors).',
    );
  }

  await page.goto(loginPath, { waitUntil: 'domcontentloaded' });
  await page.locator(userSelector).first().fill(username);
  await page.locator(passwordSelector).first().fill(password);
  await page.locator(submitSelector).first().click();

  if (successSelector) {
    await page.locator(successSelector).first().waitFor({ state: 'visible', timeout: 30_000 });
  } else if (successUrl) {
    await page.waitForURL(new RegExp(successUrl), { timeout: 30_000 });
  } else {
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);
  }
}

/**
 * Prepare `.auth/user.json` for Scout based on SCOUT_AUTH / auto detection.
 */
export async function prepareScoutAuth(page: Page): Promise<ScoutAuthMode> {
  const mode = resolveScoutAuthMode();
  ensureAuthDir();

  if (mode === 'none') {
    await writeEmptyStorageState();
    return mode;
  }

  if (mode === 'sauce') {
    await loginWithSaucePom(page);
  } else {
    await loginWithGenericForm(page);
  }

  await page.context().storageState({ path: SCOUT_AUTH_FILE });
  return mode;
}

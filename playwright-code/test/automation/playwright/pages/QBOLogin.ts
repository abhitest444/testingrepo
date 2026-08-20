import { expect, Page } from '@playwright/test';
import gotoWithAuthSession from '../gotoWithAuthSession';
import { dismissQboOnboardingIfVisible } from '../commonUtils';
import WorkforcePage from './WorkforcePage';
import { dismissWorkforceOverlaysBeforeInteraction } from '../flows/Util/Workforce.Util';
import * as accountData from '../logins';
import { AutomationLogin, AutomationLoginData } from '../logins'; // eslint-disable-next-line import/prefer-default-export
import { AutomationLoginTC, AutomationLoginDataTC } from '../loginTC';
import { USER_ROLES } from '../utils';
import { LoginCredentials } from '../config/types';
import { overridePlugin } from '../plugin/overridePlugin';

const shouldApplyPluginOverrides = (): boolean =>
  process?.env?.PLAYWRIGHT_ENV === 'local' ||
  !!process?.env?.PLUGIN_RELEASE_VERSION ||
  !!process?.env?.PLUGIN_OVERRIDES;

/**
 * Fixes an issue with the toast "Preferences Saved" showing up after login which disrupts test flows
 * by ensuring a consent cookie is set.
 * From https://intuit-teams.slack.com/archives/C3JK09N5D/p1708010605090289?thread_ts=1704956777.691819&cid=C3JK09N5D
 */
const preventPreferencesSavedToast = async (page: Page) => {
  const browserContext = page.context();

  await browserContext.addCookies([
    {
      name: 'ccpa',
      value: '1|1',
      domain: '.intuit.com',
      path: '/',
      expires: -1,
      secure: true,
      sameSite: 'None',
    },
  ]);
};

export const openQBO = async (
  page: Page,
  login: AutomationLoginData,
  skipSidebar: boolean = false,
) => {
  await preventPreferencesSavedToast(page);

  await gotoWithAuthSession(page, '/app/postlogin');
  await page.getByTestId('IdentifierFirstInternationalUserIdInput').click();
  await page
    .getByTestId('IdentifierFirstInternationalUserIdInput')
    .fill(login.username);
  await page.getByTestId('IdentifierFirstSubmitButton').click();
  await page.getByTestId('currentPasswordInput').click();
  await page.getByTestId('currentPasswordInput').fill(login.password);
  await page.getByTestId('passwordVerificationContinueButton').click();

  try {
    const skipButton = await page.waitForSelector(
      '[data-testid="VUUSkipButton"]',
      { timeout: 15000, state: 'attached' }, // Use 'attached' to ensure the element is present in the DOM
    );
    if (skipButton) {
      await skipButton.click();
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('VUUSkipButton not found within 5 seconds, skipping...');
  }

  try {
    await expect(
      page
        .getByText('Choose your company')
        .or(
          page
            .locator(`//button[@data-id='settings']`)
            .or(page.locator(`//a[@aria-label='QuickBooks Landing Page']`)),
        ),
    ).toBeVisible();
    await page.waitForTimeout(4000);
    if (await page.getByText(login.companyInfo).isVisible()) {
      await page.getByText(login.companyInfo).click();
    }
  } catch {
    console.log('Choose your company is not available');
  }

  try {
    if (!skipSidebar) {
      await expect(
        page
          .locator(`//button[@data-id='settings']`)
          .or(page.locator(`//a[@aria-label='QuickBooks Landing Page']`)),
      ).toBeVisible();
    }
    await expect(page.locator('[data-id=bodyNode]')).toBeVisible();
    await expect(page.locator('.oneIntuitAccountHeaderItem')).toBeVisible();
  } catch {
    console.log('no navigation window found');
  }

  // eslint-disable-next-line no-console
  console.log('Successfully logged in to QBO');

  // Apply plugin overrides if configured via environment variables
  if (shouldApplyPluginOverrides()) {
    await overridePlugin(page);
  }
};

// eslint-disable-next-line import/prefer-default-export
export const openQBOsingleTa = async (
  page: Page,
  login: AutomationLoginData,
  skipSidebar: boolean = false,
) => {
  await preventPreferencesSavedToast(page);

  // For finding out the scenario
  const allLogins = Object.values(accountData).flat() as AutomationLogin[];
  const scenario =
    allLogins.find(
      (entry) =>
        entry.preprod?.username === login.username ||
        entry.prod?.username === login.username,
    )?.scenario || null;

  await gotoWithAuthSession(page, '/app/postlogin');
  await page.getByTestId('IdentifierFirstInternationalUserIdInput').click();
  await page
    .getByTestId('IdentifierFirstInternationalUserIdInput')
    .fill(login.username);
  await page.getByTestId('IdentifierFirstSubmitButton').click();
  await page.getByTestId('currentPasswordInput').click();
  await page.getByTestId('currentPasswordInput').fill(login.password);
  await page.getByTestId('passwordVerificationContinueButton').click();

  try {
    const skipButton = await page.waitForSelector(
      '[data-testid="VUUSkipButton"]',
      { timeout: 15000, state: 'attached' }, // Use 'attached' to ensure the element is present in the DOM
    );
    if (skipButton) {
      await skipButton.click();
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('VUUSkipButton not found within 5 seconds, skipping...');
  }

  try {
    if (scenario !== USER_ROLES.hrManager) {
      await expect(
        page
          .getByText('Choose your company')
          .or(page.locator('#Navigation'))
          .or(page.locator(`//div[@data-id="app-carousel"]`)),
      ).toBeVisible({ timeout: 30000 });
      await page.waitForTimeout(4000);
      if (await page.getByText(login.companyInfo).isVisible()) {
        await page.getByText(login.companyInfo).click();
      }
    }
  } catch {
    console.log('Choose your company is not available');
  }

  try {
    if (!skipSidebar) {
      if (scenario === USER_ROLES.timeTrackOnly) {
        await expect(
          page.locator(`//div[contains(@class, 'to-homepage-widget')]`),
        ).toBeVisible();
      } else {
        if (scenario == USER_ROLES.viewCompanyReports) {
          await expect(
            page.locator(`//span[text()='Custom report builder']`),
          ).toBeVisible();
          // Apply plugin overrides if configured via environment variables
          if (shouldApplyPluginOverrides()) {
            await overridePlugin(page);
          }
          return;
        } else {
          if (scenario !== USER_ROLES.hrManager) {
            await expect(
              page
                .locator('#Navigation')
                .or(page.locator(`//div[@data-id="app-carousel"]`)),
            ).toBeVisible();
          }
          await expect(page.locator('[data-id=bodyNode]')).toBeVisible();
          await expect(
            page.locator('.oneIntuitAccountHeaderItem'),
          ).toBeVisible();
        }
      }
    }
  } catch {
    console.log('no navigation window found');
  }

  // eslint-disable-next-line no-console
  console.log('Successfully logged in to QBO');

  // Apply plugin overrides if configured via environment variables
  if (shouldApplyPluginOverrides()) {
    await overridePlugin(page);
  }
};

export const openQBOTT = async (
  page: Page,
  login: AutomationLoginData,
  skipSidebar: boolean = false,
) => {
  await preventPreferencesSavedToast(page);

  // For finding out the scenario
  const allLogins = Object.values(accountData).flat() as AutomationLogin[];
  const scenario =
    allLogins.find(
      (entry) =>
        entry.preprod?.username === login.username ||
        entry.prod?.username === login.username,
    )?.scenario || null;

  await gotoWithAuthSession(page, '/app/postlogin');
  await page.getByTestId('IdentifierFirstInternationalUserIdInput').click();
  await page
    .getByTestId('IdentifierFirstInternationalUserIdInput')
    .fill(login.username);
  await page.getByTestId('IdentifierFirstSubmitButton').click();
  await page.getByTestId('currentPasswordInput').click();
  await page.getByTestId('currentPasswordInput').fill(login.password);
  await page.getByTestId('passwordVerificationContinueButton').click();

  try {
    const skipButton = await page.waitForSelector(
      '[data-testid="VUUSkipButton"]',
      { timeout: 15000, state: 'attached' }, // Use 'attached' to ensure the element is present in the DOM
    );
    if (skipButton) {
      await skipButton.click();
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('VUUSkipButton not found within 5 seconds, skipping...');
  }

  try {
    if (!skipSidebar) {
      if (scenario === USER_ROLES.timeTrackOnly) {
        await expect(
          page.locator(
            `//div[@class='timetracking-ui']/ div[contains(@class, 'timetracking')]`,
          ),
        ).toBeVisible();
      }
    }
  } catch {
    console.log('no navigation window found');
  }

  // eslint-disable-next-line no-console
  console.log('Successfully logged in to QBO');

  // Apply plugin overrides if configured via environment variables
  if (shouldApplyPluginOverrides()) {
    await overridePlugin(page);
  }
};

/**
 * Time / TC login (Intuit ID). Pass `fastCompanyPicker` when `companyInfo` is empty or you want to
 * skip the fixed 4s company-picker sleep and only click a company tile when `companyInfo` is set and visible.
 */
// eslint-disable-next-line import/prefer-default-export
export const openQBOTE = async (
  page: Page,
  login: LoginCredentials,
  skipSidebar: boolean = false,
  fastCompanyPicker: boolean = false,
) => {
  await preventPreferencesSavedToast(page);

  // For finding out the scenario
  const allLogins = Object.values(accountData).flat() as AutomationLoginTC[];
  const scenario =
    allLogins.find(
      (entry) =>
        entry.preprod?.email === login.username ||
        entry.prod?.email === login.username,
    )?.scenario || null;

  await gotoWithAuthSession(page, '/app/postlogin');
  await page.getByTestId('IdentifierFirstInternationalUserIdInput').click();
  await page
    .getByTestId('IdentifierFirstInternationalUserIdInput')
    .fill(login.username ?? '');
  await page.getByTestId('IdentifierFirstSubmitButton').click();
  await page.getByTestId('currentPasswordInput').click();
  await page.getByTestId('currentPasswordInput').fill(login.password ?? '');
  await page.getByTestId('passwordVerificationContinueButton').click();

  try {
    const skipButton = await page.waitForSelector(
      '[data-testid="VUUSkipButton"]',
      { timeout: 15000, state: 'attached' }, // Use 'attached' to ensure the element is present in the DOM
    );
    if (skipButton) {
      await skipButton.click();
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('VUUSkipButton not found within 5 seconds, skipping...');
  }

  // Fast path: avoid default expect.timeout (3m per assertion in playwright.config).
  const chooseCompanyOrLandingMs = fastCompanyPicker ? 30_000 : 60_000;
  const qboShellReadyMs = fastCompanyPicker ? 30_000 : 3 * 60 * 1000;

  try {
    await expect(
      page
        .getByText('Choose your company')
        .or(page.locator(`//a[@aria-label='QuickBooks Landing Page']`)),
    ).toBeVisible({ timeout: chooseCompanyOrLandingMs });
    if (fastCompanyPicker) {
      const info = login.companyInfo?.trim();
      if (info) {
        const tile = page.getByText(info, { exact: false }).first();
        if (await tile.isVisible({ timeout: 8000 }).catch(() => false)) {
          await tile.click();
          console.log(login.companyInfo);
        }
      }
    } else {
      await page.waitForTimeout(4000);
      if (await page.getByText(login.companyInfo ?? '').isVisible()) {
        await page.getByText(login.companyInfo ?? '').click();
        console.log(login.companyInfo);
      }
    }
  } catch {
    console.log('Choose your company is not available');
  }

  try {
    if (!skipSidebar) {
      await expect(
        page.locator(`//a[@aria-label='QuickBooks Landing Page']`),
      ).toBeVisible({ timeout: qboShellReadyMs });
    }
    await expect(page.locator('[data-id=bodyNode]')).toBeVisible({
      timeout: qboShellReadyMs,
    });
    await expect(page.locator('.oneIntuitAccountHeaderItem')).toBeVisible({
      timeout: qboShellReadyMs,
    });
  } catch {
    console.log('no navigation window found');
  }

  // eslint-disable-next-line no-console
  console.log('Successfully logged in to QBO');

  // Apply plugin overrides if configured via environment variables
  if (shouldApplyPluginOverrides()) {
    await overridePlugin(page);
  }
};

/**
 * Login for the TE01 FastPipeline suite (TimeEntriesFlows.spec.ts).
 *
 * Each matrix account (e.g. IES01, IES02, IES03 for `TEST_ACCOUNT=IES`) runs in
 * its own fresh browser context, so this performs a full, self-contained login
 * per account:
 *   1. Intuit ID credentials.
 *   2. Skip the VUU "verify it's you" prompt if shown.
 *   3. Pick this account's company on the "Choose your company" screen,
 *      matched by `login.companyInfo`, when the picker appears.
 *   4. Wait for the QBO/IES app shell (`bodyNode`, present in every shell) to be
 *      ready before the suite tries to reach the Time navigation.
 *
 * Steps 3–4 are what let DIFFERENT accounts (multi-company Intuit IDs, or IES vs
 * QBO shells like PR_ELITE) each land on their own dashboard; without them an
 * account that shows a company picker would stall before `step02` can hover the
 * "All apps" nav. Waits are bounded (not the 3-min default) so a misconfigured
 * account fails fast instead of hanging the whole matrix run.
 *
 * Pass `fastCompanyPicker` to tighten the picker/shell waits further, and
 * `skipSidebar` to skip the shell-ready wait entirely.
 */
// eslint-disable-next-line import/prefer-default-export
export const openQBOTETab = async (
  page: Page,
  login: LoginCredentials,
  skipSidebar: boolean = false,
  fastCompanyPicker: boolean = false,
) => {
  await preventPreferencesSavedToast(page);

  await page.goto('/app/postlogin');
  await page.getByTestId('IdentifierFirstInternationalUserIdInput').click();
  await page
    .getByTestId('IdentifierFirstInternationalUserIdInput')
    .fill(login.username ?? '');
  await page.getByTestId('IdentifierFirstSubmitButton').click();
  await page.getByTestId('currentPasswordInput').click();
  await page.getByTestId('currentPasswordInput').fill(login.password ?? '');
  await page.getByTestId('passwordVerificationContinueButton').click();

  try {
    const skipButton = await page.waitForSelector(
      '[data-testid="VUUSkipButton"]',
      { timeout: 15000, state: 'attached' }, // Use 'attached' to ensure the element is present in the DOM
    );
    if (skipButton) {
      await skipButton.click();
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('VUUSkipButton not found within 15 seconds, skipping...');
  }

  // Bounded waits so a wrong/missing company fails fast per account instead of
  // burning the 3-min default expect timeout on every matrix entry.
  const chooseCompanyOrShellMs = fastCompanyPicker ? 30_000 : 60_000;
  const shellReadyMs = fastCompanyPicker ? 30_000 : 90_000;

  // Company picker — only some accounts show "Choose your company". When it
  // appears, click THIS account's tile (by companyInfo); otherwise the account
  // auto-landed on its single company and the app shell is already loading.
  try {
    await expect(
      page
        .getByText('Choose your company')
        .or(page.locator('[data-id=bodyNode]'))
        .first(),
    ).toBeVisible({ timeout: chooseCompanyOrShellMs });

    const info = login.companyInfo?.trim();
    if (info) {
      const tile = page.getByText(info, { exact: false }).first();
      if (await tile.isVisible({ timeout: 8000 }).catch(() => false)) {
        await tile.click();
        console.log(`Selected company: ${info}`);
      }
    }
  } catch {
    console.log('Choose your company is not available');
  }

  // Shell ready — bodyNode renders for ALL shells (Elite, Premium, IES,
  // Standard), so it is the one universal "dashboard loaded" signal. The
  // shell-specific assertions (IES header vs QBO landing link) live in step012.
  if (!skipSidebar) {
    try {
      await expect(page.locator('[data-id=bodyNode]')).toBeVisible({
        timeout: shellReadyMs,
      });
    } catch {
      console.log('no navigation window found');
    }
  }

  console.log('Successfully logged in to QBO');

  await dismissQboOnboardingIfVisible(page).catch(() => undefined);

  // Apply plugin overrides if configured via environment variables
  if (shouldApplyPluginOverrides()) {
    await overridePlugin(page);
  }
};

export const openQBOTS = async (
  page: Page,
  login: LoginCredentials,
  skipSidebar: boolean = false,
) => {
  await preventPreferencesSavedToast(page);

  // For finding out the scenario
  const allLogins = Object.values(accountData).flat() as AutomationLoginTC[];
  const scenario =
    allLogins.find(
      (entry) =>
        entry.preprod?.email === login.username ||
        entry.prod?.email === login.username,
    )?.scenario || null;

  await gotoWithAuthSession(page, '/app/postlogin');
  await page.getByTestId('IdentifierFirstInternationalUserIdInput').click();
  await page
    .getByTestId('IdentifierFirstInternationalUserIdInput')
    .fill(login.username ?? '');
  await page.getByTestId('IdentifierFirstSubmitButton').click();
  await page.getByTestId('currentPasswordInput').click();
  await page.getByTestId('currentPasswordInput').fill(login.password ?? '');
  await page.getByTestId('passwordVerificationContinueButton').click();

  // Handle phone verification screen ("Is this still your current number?")
  try {
    const skipForNow = page.getByRole('button', { name: 'Skip for now' });
    if (await skipForNow.isVisible({ timeout: 15000 })) {
      console.log(
        'Phone verification screen detected, clicking Skip for now...',
      );
      await skipForNow.click();
    }
  } catch {
    console.log('No phone verification screen');
  }

  // Handle VUU Skip button if present (before company selection)
  try {
    const skipButton = await page.waitForSelector(
      '[data-testid="VUUSkipButton"]',
      { timeout: 15000, state: 'attached' },
    );
    if (skipButton) {
      await skipButton.click();
      console.log('VUUSkipButton clicked');
    }
  } catch {
    console.log('VUUSkipButton not found, continuing...');
  }

  try {
    await expect(
      page
        .getByText('Choose your company')
        .or(
          page
            .locator(`//button[@data-id='settings']`)
            .or(page.locator(`//a[@aria-label='QuickBooks Landing Page']`)),
        ),
    ).toBeVisible();
    await page.waitForTimeout(4000);
    if (
      login.companyInfo &&
      (await page.getByText(login.companyInfo).isVisible())
    ) {
      await page.getByText(login.companyInfo).click();
    }
  } catch {
    console.log('Choose your company is not available');
  }

  try {
    /*
    await page.waitForLoadState('load');
    await page.waitForTimeout(8000);
    // Wait for the "Let's get started" button to be visible and click it if present
    const letsGetStartedButton = page.locator(
      `//div[contains(@class, 'IntroScreen__HeaderLogo')]/..//button/span[text() = "Let's get started"]`,
    );
    expect(letsGetStartedButton).toBeVisible();
    await letsGetStartedButton.press('Escape');

    */

    if (!skipSidebar) {
      await expect(
        page
          .locator(`//button[@data-id='settings']`)
          .or(page.locator(`//a[@aria-label='QuickBooks Landing Page']`)),
      ).toBeVisible();
    }
    await expect(page.locator('[data-id=bodyNode]')).toBeVisible();
    await expect(page.locator('.oneIntuitAccountHeaderItem')).toBeVisible();
  } catch {
    console.log('no navigation window found');
  }

  // eslint-disable-next-line no-console
  console.log('Successfully logged in to QBO');

  // Apply plugin overrides if configured via environment variables
  if (shouldApplyPluginOverrides()) {
    await overridePlugin(page);
  }
};

/**
 * QBO root URL for Intuit ID login (prod vs e2e). Use with deep links such as `/app/time`.
 * Distinct from Playwright project `baseURL` (`app.qbo…`), which `openQBO` uses via `/app/postlogin`.
 */
export const getQboRootUrl = (): string => {
  const env = process.env.PLAYWRIGHT_ENV || 'preprod';
  return env === 'prod'
    ? 'https://qbo.intuit.com'
    : 'https://e2e.qbo.intuit.com';
};

/** Shared Intuit username/password + optional VUU / company picker (Workforce + QBO-with-credentials). */
async function completeIntuitPortalLoginAfterLanding(
  page: Page,
  login: LoginCredentials,
): Promise<void> {
  await page.getByTestId('IdentifierFirstInternationalUserIdInput').click();
  await page
    .getByTestId('IdentifierFirstInternationalUserIdInput')
    .fill(login.username ?? '');
  await page.getByTestId('IdentifierFirstSubmitButton').click();

  await page.getByTestId('currentPasswordInput').click();
  await page.getByTestId('currentPasswordInput').fill(login.password ?? '');
  await page.getByTestId('passwordVerificationContinueButton').click();

  try {
    const skipButton = await page.waitForSelector(
      '[data-testid="VUUSkipButton"]',
      { timeout: 5000, state: 'attached' },
    );
    if (skipButton) {
      await skipButton.click();
    }
  } catch (error) {
    console.log('VUUSkipButton not found, skipping...');
  }

  try {
    const companySelector = await page.waitForSelector(
      '[data-testid="company-selector"]',
      { timeout: 5000, state: 'visible' },
    );
    if (companySelector) {
      await companySelector.click();
      console.log('Selected company from list');
    }
  } catch (error) {
    console.log('Company selector not found, continuing...');
  }

  await page.waitForLoadState('domcontentloaded');
}

/** True when QBO app shell is visible and Intuit sign-in fields are not shown. */
async function isQboAdminSessionActive(page: Page): Promise<boolean> {
  const onQboApp = /qbo\.intuit\.com\/app\//i.test(page.url());
  if (onQboApp) {
    return true;
  }

  const loginVisible = await page
    .getByTestId('IdentifierFirstInternationalUserIdInput')
    .isVisible({ timeout: 1500 })
    .catch(() => false);
  if (loginVisible) {
    return false;
  }

  return (
    (await page
      .locator(`//a[@aria-label='QuickBooks Landing Page']`)
      .isVisible({ timeout: 3000 })
      .catch(() => false)) ||
    (await page
      .locator('[data-id=bodyNode]')
      .isVisible({ timeout: 3000 })
      .catch(() => false))
  );
}

/**
 * Log into QBO using {@link LoginCredentials} and {@link getQboRootUrl} (same contract as Workforce sync tests).
 * Prefer {@link openQBO} when you have {@link AutomationLoginData} and post-login company pick by name.
 */
export const openQBOWithLoginCredentials = async (
  page: Page,
  credentials: LoginCredentials,
): Promise<Page> => {
  await preventPreferencesSavedToast(page);

  const qboUrl = getQboRootUrl();
  console.log(`Navigating to QBO: ${qboUrl}`);
  await gotoWithAuthSession(page, qboUrl);
  await page.waitForLoadState('domcontentloaded');

  const needsLogin = await page
    .getByTestId('IdentifierFirstInternationalUserIdInput')
    .isVisible({ timeout: 5000 })
    .catch(() => false);

  if (needsLogin) {
    await completeIntuitPortalLoginAfterLanding(page, credentials);
    console.log('✓ Logged into QBO Admin');
  } else if (await isQboAdminSessionActive(page)) {
    console.log('✓ Already logged into QBO — skipping sign-in');
  } else {
    await completeIntuitPortalLoginAfterLanding(page, credentials);
    console.log('✓ Logged into QBO Admin');
  }

  if (shouldApplyPluginOverrides()) {
    await overridePlugin(page);
  }

  return page;
};

/**
 * Login to QuickBooks Workforce web app (workforce.intuit.com)
 * This is the employee-facing portal for viewing paystubs, W-2s, and time tracking
 * (Aligned with payroll-employee-portal-ui working flow.)
 */
export const openWorkforce = async (
  page: Page,
  login: LoginCredentials,
  _skipSidebar: boolean = false,
) => {
  const env = process.env.PLAYWRIGHT_ENV || 'preprod';
  const workforceUrl =
    env === 'prod'
      ? 'https://workforce.intuit.com'
      : 'https://workforce-e2e.intuit.com';

  console.log(`Navigating to Workforce: ${workforceUrl}`);
  await gotoWithAuthSession(page, workforceUrl);

  await completeIntuitPortalLoginAfterLanding(page, login);

  const currentUrl = page.url();
  console.log(`Logged in successfully. Current URL: ${currentUrl}`);

  await new WorkforcePage(page).dismissTimesheetPopupIfVisible();

  if (/workforce(\.intuit\.com|-e2e\.intuit\.com)/i.test(page.url())) {
    await dismissWorkforceOverlaysBeforeInteraction(page);
  }

  return page;
};

export async function QBOLogin(
  page: Page,
  credentials: LoginCredentials,
): Promise<void> {
  console.log('Logging in as %s', credentials.username ?? '(no username)');
  await openQBOTETab(page, credentials);
  console.log(' ✓ Login complete');
}

import { expect, Page } from '@playwright/test';
import gotoWithAuthSession from '../../gotoWithAuthSession';
import * as accountData from '../../logins';
import { AutomationLogin, AutomationLoginData } from '../../logins'; // eslint-disable-next-line import/prefer-default-export
import { AutomationLoginTC, AutomationLoginDataTC } from '../../loginTC';
import { USER_ROLES } from '../../utils';
import { LoginCredentials } from '../../config/types';
import { overridePlugin } from '../../plugin/overridePlugin';

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

// eslint-disable-next-line import/prefer-default-export
export const openQBOTE = async (
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
        .or(page.locator(`//a[@aria-label='QuickBooks Landing Page']`)),
    ).toBeVisible();
    await page.waitForTimeout(4000);
    if (await page.getByText(login.companyInfo ?? '').isVisible()) {
      await page.getByText(login.companyInfo ?? '').click();
      console.log(login.companyInfo);
    }
  } catch {
    console.log('Choose your company is not available');
  }

  try {
    if (!skipSidebar) {
      await expect(
        page.locator(`//a[@aria-label='QuickBooks Landing Page']`),
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
        .or(page.locator(`//a[@aria-label='QuickBooks Landing Page']`)),
    ).toBeVisible();
    await page.waitForTimeout(4000);
    if (await page.getByText(login.companyInfo ?? '').isVisible()) {
      await page.getByText(login.companyInfo ?? '').click();
      console.log(login.companyInfo);
    }
  } catch {
    console.log('Choose your company is not available');
  }

  try {
    if (!skipSidebar) {
      await expect(
        page.locator(`//a[@aria-label='QuickBooks Landing Page']`),
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

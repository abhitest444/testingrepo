import { request as playwrightRequest, test as base } from '@playwright/test';
import { getSalesforceCredentials } from '../config';
import SalesforceApi from '../salesforceApi';
import { soapLogin } from '../salesforceSoap';
import SalesforceLeadsPage from '../pages/SalesforceLeadsPage';
import SalesforceLoginPage from '../pages/SalesforceLoginPage';

type SalesforceFixtures = {
  salesforceApi: SalesforceApi;
  salesforceLoginPage: SalesforceLoginPage;
  salesforceLeadsPage: SalesforceLeadsPage;
  /** Signed in to Lightning. */
  authenticatedSalesforce: SalesforceLeadsPage;
};

export const test = base.extend<SalesforceFixtures>({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'onLine', { get: () => true });
    });
    await use(page);
  },

  salesforceApi: async ({}, use) => {
    const apiRequest = await playwrightRequest.newContext();
    const session = await soapLogin(apiRequest, getSalesforceCredentials());
    await use(new SalesforceApi(apiRequest, session));
    await apiRequest.dispose();
  },

  salesforceLoginPage: async ({ page }, use) => {
    await use(new SalesforceLoginPage(page));
  },

  salesforceLeadsPage: async ({ page }, use) => {
    await use(new SalesforceLeadsPage(page));
  },

  authenticatedSalesforce: async (
    { page, salesforceLoginPage, salesforceApi },
    use,
  ) => {
    await salesforceLoginPage.loginAndReachLightning(salesforceApi.session);
    await use(new SalesforceLeadsPage(page));
  },
});

export { expect } from '@playwright/test';

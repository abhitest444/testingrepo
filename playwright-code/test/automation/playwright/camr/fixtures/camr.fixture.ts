import { test as base, expect } from '@playwright/test';
import { getCamrCredentials } from '../config';
import CamrLoginPage from '../pages/CamrLoginPage';
import CamrPatientReportPage from '../pages/CamrPatientReportPage';
import CamrSentToEmrPage from '../pages/CamrSentToEmrPage';

type CamrFixtures = {
  camrLoginPage: CamrLoginPage;
  camrSentToEmrPage: CamrSentToEmrPage;
  camrPatientReportPage: CamrPatientReportPage;
  /** Signed in and on the dashboard with Sent to EMR available. */
  authenticatedCamr: CamrSentToEmrPage;
};

export const test = base.extend<CamrFixtures>({
  camrLoginPage: async ({ page }, use) => {
    await use(new CamrLoginPage(page));
  },

  camrSentToEmrPage: async ({ page }, use) => {
    await use(new CamrSentToEmrPage(page));
  },

  camrPatientReportPage: async ({ page }, use) => {
    await use(new CamrPatientReportPage(page));
  },

  authenticatedCamr: async ({ page, camrLoginPage }, use) => {
    await camrLoginPage.open();
    await camrLoginPage.loginAndReachDashboard(getCamrCredentials());

    const sentToEmrPage = new CamrSentToEmrPage(page);
    await use(sentToEmrPage);
  },
});

export { expect };

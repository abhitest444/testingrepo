import { test } from '@playwright/test';
import { getRandomQBTimeSetupAccount } from '../../config/accounts';
import { openQBOTS } from '../../pages/QBOLogin';
import {
  goToQBTimeSetup,
  verifySetUpTimeTrackingAndClickLetsGo,
  verifyTimesheetSettingsAndClickNext,
  verifyInviteTeamAndClickSkipForNow,
  verifyTailorYourSetupAndClickDone,
  verifyTaskRouteWidgets,
} from '../../pages/QBOSettingsPage';

test.describe('QBTime Setup Cases', () => {
  test.beforeEach(async ({ page }) => {
    const credentials = getRandomQBTimeSetupAccount();
    console.log('Logging in with credentials:', credentials.username);
    await openQBOTS(page, credentials);
    console.log('Login successful');
  });

  test('Complete Setup Flow', async ({ page }) => {
    console.log('Starting QB Time Setup flow');

    await goToQBTimeSetup(page);
    // Verify "Set up time tracking" screen
    await verifySetUpTimeTrackingAndClickLetsGo(page);
    //Verify "Timesheet settings" screen
    await verifyTimesheetSettingsAndClickNext(page);
    // Verify "Invite team" screen
    await verifyInviteTeamAndClickSkipForNow(page);
    //Verify "Tailor your setup" screen
    await verifyTailorYourSetupAndClickDone(page);

    await verifyTaskRouteWidgets(page);

    console.log('Completed QB Time Setup flow');
  });
});

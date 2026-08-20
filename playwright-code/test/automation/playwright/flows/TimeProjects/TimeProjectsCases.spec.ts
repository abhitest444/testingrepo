import { test } from '@playwright/test';
import { getTestAccount } from '../../config/accounts';
import { openQBOTS } from '../../pages/QBOLogin';
import {
  verifyChangeEstimateTypeServiceToHoursCancel,
  verifyChangeEstimateTypeServiceToHoursContinue,
  verifyProjectCreatedInProjectsVisibleInTimeProjects,
  verifyStatusAndCustomerFilters,
  verifyProjectSummaryByHoursEstimate,
  verifyProjectSummaryByServiceItemEstimate,
  verifyAssignWorkersNoWorkersEmptyState,
  verifyAssignWorkersCloseDiscards,
  verifyAssignWorkersSavePersists,
  verifyRenameProjectViaProjectsApp,
  verifyServiceItemInlineEditCancel,
  verifyServiceItemInlineEditSave,
  verifyServiceItemDeleteCancel,
  verifyServiceItemDeleteSave,
  verifyServiceItemsManyRowsScrollOrListed,
} from '../Util/TimeProjects.util';
import {
  verifyTimeProjectOptionVisible,
  verifyTimeProjectPageDescription,
  verifyCreateProjectNotAvailable,
  verifyManageProjectsLinkRedirect,
  verifyTimeProjectPageElements,
  verifyCreateEstimateLinkVisible,
  verifyEstimatePageOptions,
  verifyByHoursEstimateFlow,
  verifyByHoursNumericInputValidation,
  verifyByHoursEstimateSave,
  verifyByServiceItemCloseWithoutSave,
  verifyByServiceItemNumericInputValidation,
  verifyByServiceItemEstimateSave,
  verifyChangeEstimateTypeCancel,
  verifyChangeEstimateTypeContinue,
  cleanupEditAndDeleteEstimate,
  cleanupDeleteEstimate,
  changeEstimateToCreateByHours,
  cleanupDeleteTimeProject,
  verifyProjectCreatedInQBOReflectedInTSheets,
  verifyProjectDeletedInQBOReflectedInTSheets,
  verifyTimeProjectAccessibleForUKElite,
  verifyTimeProjectAccessibleForCAElite,
  verifyTimeProjectNotAccessibleForNonElite,
} from '../Util/TimeProject.util';

test.describe('Time Project Cases', () => {
  test.beforeEach(async ({ page }) => {
    const testInfo = test.info();
    const testId = testInfo.title.split(' - ')[0];
    const credentials = getTestAccount(testId);
    await openQBOTS(page, credentials);
  });

  test.afterEach(async ({ page }) => {
    const testInfo = test.info();
    const testId = testInfo.title.split(' - ')[0];

    if (testId === 'PR010') {
      await cleanupEditAndDeleteEstimate(page, 'testProject');
    } else if (testId === 'PR013') {
      await cleanupDeleteEstimate(page, 'testProject');
    } else if (testId === 'PR015') {
      await changeEstimateToCreateByHours(page, 'testProject');
    } else if (testId === 'PR031') {
      await cleanupDeleteTimeProject(page);
    }
  });

  test('PR001 - Verify Time project is visible inside Time section', async ({
    page,
  }) => {
    await verifyTimeProjectOptionVisible(page);
  });

  test('PR002 - Validate the Time project page display notes if there are no projects', async ({
    page,
  }) => {
    await verifyTimeProjectPageDescription(page);
  });

  test('PR003 - Validate Time project page does not have options to create a project', async ({
    page,
  }) => {
    await verifyCreateProjectNotAvailable(page);
  });

  test('PR004 - Validate clicking Manage Projects redirects the user to the projects page', async ({
    page,
  }) => {
    await verifyManageProjectsLinkRedirect(page);
  });

  test('PR005 - Validate the column headers and filters in Time project page', async ({
    page,
  }) => {
    await verifyTimeProjectPageElements(page);
  });

  test('PR006 - Validate Create Estimate link is displayed in Actions column for projects which does not have budget', async ({
    page,
  }) => {
    await verifyCreateEstimateLinkVisible(page);
  });

  test('PR007 - Validate estimates can be created in 2 ways - By Hours and By Service Items', async ({
    page,
  }) => {
    await verifyEstimatePageOptions(page);
  });

  test('PR008 - Validate estimates is not created by selecting By Hours option, entering the details and clicking close button', async ({
    page,
  }) => {
    await verifyByHoursEstimateFlow(page);
  });

  test('PR009 - Validate the hours entered in estimate creation using By Hours option accepts only numericals and also has options to increase or decrease the entered hours by 1 using up/down button inside the textbox', async ({
    page,
  }) => {
    await verifyByHoursNumericInputValidation(page);
  });

  test('PR010 - Validate estimates is created by selecting By Hours option, entering the details and clicking Save button', async ({
    page,
  }) => {
    await verifyByHoursEstimateSave(page);
  });

  test('PR011 - Validate estimates is not created by selecting By Service Item option, entering the details and clicking close button', async ({
    page,
  }) => {
    await verifyByServiceItemCloseWithoutSave(page);
  });

  test('PR012 - Validate the hours entered in estimate creation using By Service Item option accepts only numericals and also has options to increase or decrease the entered hours by 1 using up/down button inside the textbox', async ({
    page,
  }) => {
    await verifyByServiceItemNumericInputValidation(page);
  });

  test('PR013 - Validate estimates is created by selecting By Service Item option, entering the details and clicking Save button', async ({
    page,
  }) => {
    await verifyByServiceItemEstimateSave(page);
  });

  test('PR014 - Validate changing of estimates type in a Time project (with By Hours) and clicking Cancel', async ({
    page,
  }) => {
    await verifyChangeEstimateTypeCancel(page);
  });

  test('PR015 - Validate changing of estimates type in a Time project (with By Hours) and clicking Continue', async ({
    page,
  }) => {
    await verifyChangeEstimateTypeContinue(page);
  });

  test('PR016 - Validate changing of estimates type in a Time project (with By Service Item) and clicking Cancel', async ({
    page,
  }) => {
    await verifyChangeEstimateTypeServiceToHoursCancel(page);
  });

  test('PR017 - Validate changing of estimates type in a Time project (with By Service Item) and clicking Continue', async ({
    page,
  }) => {
    await verifyChangeEstimateTypeServiceToHoursContinue(page);
  });

  test('PR018 - Validate projects created in Projects (original) will be visible in Time project', async ({
    page,
  }) => {
    await verifyProjectCreatedInProjectsVisibleInTimeProjects(page);
  });

  test('PR019 - Validate projects can be filtered by status and customer', async ({
    page,
  }) => {
    await verifyStatusAndCustomerFilters(page);
  });

  test('PR020 - Validate the displayed page details when user clicks on a Time project with estimated created using By Hours option', async ({
    page,
  }) => {
    await verifyProjectSummaryByHoursEstimate(page);
  });

  test('PR021 - Validate the displayed page details when user clicks on a Time project with estimated created using By Service Item option', async ({
    page,
  }) => {
    await verifyProjectSummaryByServiceItemEstimate(page);
  });

  test('PR022 - Validate assigning of workers in Time project if there are no workers for the company used', async ({
    page,
  }) => {
    await verifyAssignWorkersNoWorkersEmptyState(page);
  });

  test('PR023 - Validate assigning of workers in Time project and clicking Cancel', async ({
    page,
  }) => {
    await verifyAssignWorkersCloseDiscards(page);
  });

  test('PR024 - Validate assigning of workers in Time project and clicking Save button', async ({
    page,
  }) => {
    await verifyAssignWorkersSavePersists(page);
  });

  test('PR025 - Validate Time project name can be updated using the Edit button', async ({
    page,
  }) => {
    await verifyRenameProjectViaProjectsApp(page);
  });

  test('PR026 - Validate inline editing of Service Item in estimate of a Time project and click Cancel', async ({
    page,
  }) => {
    await verifyServiceItemInlineEditCancel(page);
  });

  test('PR027 - Validate inline editing of Service Item in estimate of a Time project and click Save', async ({
    page,
  }) => {
    await verifyServiceItemInlineEditSave(page);
  });

  test('PR028 - Validate inline deleting of Service Item in estimate of a Time project and click Cancel', async ({
    page,
  }) => {
    await verifyServiceItemDeleteCancel(page);
  });

  test('PR029 - Validate inline deleting of Service Item in estimate of a Time project and click Save', async ({
    page,
  }) => {
    await verifyServiceItemDeleteSave(page);
  });

  test('PR030 - Validate that an inner scroll will be present when there are more number of service items in estimates of a project', async ({
    page,
  }) => {
    await verifyServiceItemsManyRowsScrollOrListed(page);
  });

  test('PR031 - Validate time project created in QBO for elite account is reflected in TSheets', async ({
    page,
  }) => {
    await verifyProjectCreatedInQBOReflectedInTSheets(page);
  });

  test('PR032 - Validate time project deleted in QBO for elite account is reflected in TSheets', async ({
    page,
  }) => {
    await verifyProjectDeletedInQBOReflectedInTSheets(page);
  });

  test('PR033 - Validate Time project is accessible by elite accounts for UK region', async ({
    page,
  }) => {
    await verifyTimeProjectAccessibleForUKElite(page);
  });

  test('PR034 - Validate Time project is accessible by elite accounts for CA region', async ({
    page,
  }) => {
    await verifyTimeProjectAccessibleForCAElite(page);
  });

  test('PR035 - Validate Time project is not accessible for non elite accounts', async ({
    page,
  }) => {
    await verifyTimeProjectNotAccessibleForNonElite(page);
  });
});

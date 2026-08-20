import { test } from '@playwright/test';
import { getTestAccount } from '../../config/accounts';
import { openQBOTS } from '../../pages/QBOLogin';
import {
  openManageTimeTrackingFieldsFromAssignments,
  createDropdownCustomFieldAndValidate,
  editCustomField,
  toggleRequiredOnAndOff,
  toggleRequiredOnAndValidateSTE,
  toggleRequiredOnAndValidateWTE,
  toggleRequiredOnAndValidateTimeClock,
  toggleRequiredOffAndValidateSTE,
  toggleRequiredOffAndValidateWTE,
  toggleRequiredOffAndValidateTimeClock,
  assignCustomFieldToCustomerAndValidateSTE,
  assignCustomFieldToCustomerAndValidateWTE,
  assignCustomFieldToCustomerAndValidateTimeClock,
  assignCustomFieldToWorkerAndValidateSTE,
  assignCustomFieldToWorkerAndValidateWTE,
  assignCustomerToStandardFieldAndValidateSTE,
  assignCustomerToStandardFieldAndValidateWTE,
  assignCustomerToStandardFieldAndValidateTimeClock,
  createCustomerAndValidate,
  createCustomerAndAssignTimeTrackingFields,
  createCustomerAndAssignTimeTrackingFieldsSTE,
  createCustomerAndAssignTimeTrackingFieldsWTE,
  createAndEditCustomer,
  validateAssignmentSaveFailureError,
  validatePartialAssignmentError,
  validateStandardFieldsSaveFailureError,
  validateStandardFieldsPartialAssignmentError,
  validateCustomFieldsSaveFailureError,
  validateCustomFieldsPartialAssignmentError,
  verifyHoverOverFields,
  validateStandardFieldsSaveFailureErrorNew,
  validateStandardFieldsPartialAssignmentErrorNew,
  validateCustomFieldsSaveFailureErrorNew,
  validateCustomFieldsPartialAssignmentErrorNew,
  verifyHoverOverFieldsNew,
  assignSpecificDropdownValuesToCustomerValueScoped,
  assignSpecificDropdownValuesToWorkerValueScoped,
  initiateCustomFieldFromQLAndValidateInTSheets,
  initiateCustomFieldFromTSheetsAndValidateInQL,
  validateAssignmentsAvailableForPremiumElite,
  validateAssignmentsNotAvailableForDowngradedOrNoGrant,
  validateGeoParityForUKAndCanada,
  validateRoWGoClassicOnlyBehavior,
  validateAssignmentsNotAvailableForTTOWorker,
  validateAssignmentsNotAvailableForStandardAccess,
  validateInactiveCustomFieldNotShownOnAssignmentsCustomerTab,
  validateTextAndNumberCustomFieldVisibleInManageAll,
  validateAssignCustomerCloseAndSearchBehavior,
  validateAssignmentsUrlFromMyApps,
  createCustomerValidateDelete,
  cleanupToggleRequiredOnTimeClock,
  cleanupToggleRequiredOffTimeClock,
} from '../Util/Assignments.util';

test.describe('Assignments & Field Management Flows', () => {
  test.beforeEach(async ({ page }) => {
    const testInfo = test.info();
    const testId = testInfo.title.split(' - ')[0];
    const credentials = getTestAccount(testId);
    await openQBOTS(page, credentials);
  });

  test.afterEach(async ({ page }) => {
    const testId = test.info().title.split(' - ')[0];
    if (testId === 'ASM006') {
      try {
        await cleanupToggleRequiredOnTimeClock(page);
      } catch (error) {
        console.log('ASM006 cleanup failed, but continuing:', error);
      }
    }
    if (testId === 'ASM009') {
      try {
        await cleanupToggleRequiredOffTimeClock(page);
      } catch (error) {
        console.log('ASM009 cleanup failed, but continuing:', error);
      }
    }
  });

  test('ASM001 - Create custom field and validate the values', async ({
    page,
  }) => {
    await createDropdownCustomFieldAndValidate(page);
  });

  test('ASM002 - Create and edit the custom field and validate the values', async ({
    page,
  }) => {
    await editCustomField(page);
  });

  test('ASM003 - Toggle required on in custom fields', async ({ page }) => {
    await toggleRequiredOnAndOff(page);
  });

  test('ASM004 - Toggle required on in custom fields STE', async ({ page }) => {
    await toggleRequiredOnAndValidateSTE(page);
  });

  test('ASM005 - Toggle required on in custom fields WTE', async ({ page }) => {
    await toggleRequiredOnAndValidateWTE(page);
  });

  test('ASM006 - Toggle required on in custom fields Timeclock', async ({
    page,
  }) => {
    await toggleRequiredOnAndValidateTimeClock(page);
  });

  test('ASM007 - Toggle required off in custom fields STE', async ({
    page,
  }) => {
    await toggleRequiredOffAndValidateSTE(page);
  });

  test('ASM008 - Toggle required off in custom fields WTE', async ({
    page,
  }) => {
    await toggleRequiredOffAndValidateWTE(page);
  });

  test('ASM009 - Toggle required off in custom fields Timeclock', async ({
    page,
  }) => {
    await toggleRequiredOffAndValidateTimeClock(page);
  });

  test('ASM010 - Assign custom field for a customer in STE', async ({
    page,
  }) => {
    await assignCustomFieldToCustomerAndValidateSTE(page);
  });

  test('ASM011 - Assign custom field for a customer in WTE', async ({
    page,
  }) => {
    await assignCustomFieldToCustomerAndValidateWTE(page);
  });

  test('ASM012 - Assign custom field for a customer in TimeClock', async ({
    page,
  }) => {
    await assignCustomFieldToCustomerAndValidateTimeClock(page);
  });

  // test('ASM013 - Assign custom field for worker in STE', async ({ page }) => {
  //   await assignCustomFieldToWorkerAndValidateSTE(page);
  // });

  // test('ASM014 - Assign custom field for worker in WTE', async ({ page }) => {
  //   await assignCustomFieldToWorkerAndValidateWTE(page);
  // });

  // test('ASM015 - Assign customer to standard fields for STE', async ({
  //   page,
  // }) => {
  //   await assignCustomerToStandardFieldAndValidateSTE(page);
  // });

  // test('ASM016 - Assign customer to standard fields for WTE', async ({
  //   page,
  // }) => {
  //   await assignCustomerToStandardFieldAndValidateWTE(page);
  // });

  // test('ASM017 - Assign customer to standard fields for Time clock', async ({
  //   page,
  // }) => {
  //   await assignCustomerToStandardFieldAndValidateTimeClock(page);
  // });

  test('ASM018 - Create customer and validate customer', async ({ page }) => {
    await createCustomerValidateDelete(page);
  });

  test('ASM019 - Create customer and validate assign to time tracking fields', async ({
    page,
  }) => {
    await createCustomerAndAssignTimeTrackingFields(page);
  });

  test('ASM020 - Create customer and validate assign to time tracking fields STE', async ({
    page,
  }) => {
    await createCustomerAndAssignTimeTrackingFieldsSTE(page);
  });

  test('ASM021 - Create customer and validate assign to time tracking fields WTE', async ({
    page,
  }) => {
    await createCustomerAndAssignTimeTrackingFieldsWTE(page);
  });

  test('ASM022 - Create customer edit the customer and validate', async ({
    page,
  }) => {
    await createAndEditCustomer(page);
  });

  test('ASM023 - Error state - assignment or edit not saved', async ({
    page,
  }) => {
    await validateAssignmentSaveFailureError(page);
  });

  // test('ASM024 - Error state - Partial assignment', async ({ page }) => {
  //   await validatePartialAssignmentError(page);
  // });

  test('ASM025 - Standard Fields Error State - Changes Not Saved', async ({
    page,
  }) => {
    await validateStandardFieldsSaveFailureError(page);
  });

  // test('ASM026 - Standard Fields Error State - Partial Assignment', async ({
  //   page,
  // }) => {
  //   await validateStandardFieldsPartialAssignmentError(page);
  // });

  test('ASM027 - Custom Fields Error State - Changes Not Saved', async ({
    page,
  }) => {
    await validateCustomFieldsSaveFailureError(page);
  });

  // test('ASM028 - Custom Fields Error State - Partial Assignment', async ({
  //   page,
  // }) => {
  //   await validateCustomFieldsPartialAssignmentError(page);
  // });

  test('ASM029 - Verify hover over Status + Required + Standard fields', async ({
    page,
  }) => {
    await verifyHoverOverFields(page);
  });

  test('ASM030 - Assign specific dropdown values to customer (value-scoped)', async ({
    page,
  }) => {
    await assignSpecificDropdownValuesToCustomerValueScoped(page);
  });

  test('ASM031 - Assign specific dropdown values to worker (value-scoped)', async ({
    page,
  }) => {
    await assignSpecificDropdownValuesToWorkerValueScoped(page);
  });

  test('ASM032 - Initiate in QL: create dropdown custom field and verify appears in TSheets UI', async ({
    page,
  }) => {
    await initiateCustomFieldFromQLAndValidateInTSheets(page);
  });

  // test('ASM033 - Initiate in TSheets: create/edit custom field and verify reflected in QL admin & time entry UIs', async ({
  //   page,
  // }) => {
  //   await initiateCustomFieldFromTSheetsAndValidateInQL(page);
  // });

  test('ASM034 - Premium/Elite: Assignments available', async ({ page }) => {
    await validateAssignmentsAvailableForPremiumElite(page);
  });

  test('ASM035 - UK: same behavior as US for eligible tiers', async ({
    page,
  }) => {
    await validateGeoParityForUKAndCanada(page);
  });

  test('ASM036 - Ineligible role (TTO worker): feature not available', async ({
    page,
  }) => {
    await validateAssignmentsNotAvailableForTTOWorker(page);
  });

  test('ASM037 - Ineligible role (standard all access / non-admin): feature not available', async ({
    page,
  }) => {
    await validateAssignmentsNotAvailableForStandardAccess(page);
  });

  test('ASM038 - Inactive custom field not displayed on Assignments customer tab', async ({
    page,
  }) => {
    await validateInactiveCustomFieldNotShownOnAssignmentsCustomerTab(page);
  });

  test('ASM039 - Create Text and number custom field and validate in Manage all custom fields', async ({
    page,
  }) => {
    await validateTextAndNumberCustomFieldVisibleInManageAll(page);
  });

  test('ASM040 - Assign Customers panel close icon and search button functionality', async ({
    page,
  }) => {
    await validateAssignCustomerCloseAndSearchBehavior(page);
  });

  test('ASM041 - Assignments URL navigation from My apps', async ({ page }) => {
    await validateAssignmentsUrlFromMyApps(page);
  });

  test('ASM042 - Canada: same behavior as US for eligible tiers', async ({
    page,
  }) => {
    await validateGeoParityForUKAndCanada(page);
  });
});

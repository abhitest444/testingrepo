import { test } from '@playwright/test';
import {
  validateTimeClockNavigationAndAccess,
  validateClockInFunctionality,
  validateClockOutButtonVisibility,
  validateClockInIntialTimeDisplayBackgroundColor,
  validateTimeSelectionAMPM,
  validateClockInScreenInitialState,
  validateAdminNameInHeader,
  validateCustomerProjectSelection,
  validateDateTimeSelection,
  validateMandatoryFields,
  validateDateTimeRestrictions,
  validateClockedOutMessage,
  validateClockedInMessage,
  validateDrawerReset,
  validateClockInDrawerClose,
  validateTimerStartsOnClockIn,
  validateHeaderShowsClockedIn,
  validateHeaderShowsTodayAndWeekTime,
  validateRunningTimerAfterClockIn,
  validateClockInDrawerNotAccessible,
  validatePreselectedFields,
  validateServiceItemSelection,
  validateBillableField,
  validateClassSelection,
  validateDepartmentSelection,
  validateLocationSelection,
  validateTimerTurnsGreenOnClockIn,
  validateTimesheetUpdateOnSave,
  validateTimerResetOnClockOut,
  validateTimerResetOnSwitchJob,
  validateSwitchJobShowsAllFields,
  validateBackendErrorHandling,
  validateMultipleDeviceClockIn,
  validateRunningTimeErrorHandling,
  validateNetworkErrorOnTimeEntries,
  validateNetworkErrorOnClockInDrawer,
  validateSaveTimeClockError,
  validateClockOutError,
  validateTimesheetOverlapOnClockIn,
  validateTimesheetOverlapOnEdit,
  validateClockInPermission,
  validateFutureStartTime,
  validateQuickfillDropdowns,
  validateFieldLabels,
  validateTimeEntriesOrder,
  validateSavingNotes,
  validateCustomerToProjectSwitch,
  validateCustomerMandatoryFields,
  validateCustomFieldMandatoryFields,
} from '../Util/TimeClockUtil';
import { getTestAccount } from '../../config/accounts';
import { openQBOTE } from '../../pages/QBOLogin';

test.describe('Time Clocks Page Test Cases', () => {
  test.beforeEach(async ({ page }) => {
    // Get current test info
    const testInfo = test.info();
    // Login using test-specific credentials
    const testId = testInfo.title.split(' - ')[0];
    const credentials = getTestAccount(testId);
    await openQBOTE(page, credentials);
  });

  test('TC001 - Verify Time Clock Navigation and Clock In Screen Access', async ({
    page,
  }) => {
    await validateTimeClockNavigationAndAccess(page);
  });

  test('TC002 - Verify Clock In Button Functionality and Screen', async ({
    page,
  }) => {
    await validateClockInFunctionality(page);
  });

  test('TC003 - Verify Clock In Button Visibility When Already Clocked In', async ({
    page,
  }) => {
    await validateClockOutButtonVisibility(page);
  });

  // Commented due to clock out issues
  // test('TC004 - Verify Clock In Screen with Timer and Time Display intial background color', async ({
  //   page,
  // }) => {
  //   await validateClockInIntialTimeDisplayBackgroundColor(page);
  // });

  test('TC005 - Verify Clock In Screen Initial State', async ({ page }) => {
    await validateClockInScreenInitialState(page);
  });

  test('TC006 - Verify Admin Name in Header', async ({ page }) => {
    await validateAdminNameInHeader(page);
  });

  test('TC007 - Verify Customer/Project Selection', async ({ page }) => {
    await validateCustomerProjectSelection(page);
  });

  test('TC008 - Verify Date/Time Selection Format', async ({ page }) => {
    await validateDateTimeSelection(page);
  });

  // test('TC009 - Verify clock in message Validation', async ({ page }) => {
  //   await validateClockedInMessage(page);
  // });

  test('TC010 - Verify Date/Time Restrictions', async ({ page }) => {
    await validateDateTimeRestrictions(page);
  });

  test('TC011 - The time should be available for selection in am/pm', async ({
    page,
  }) => {
    await validateTimeSelectionAMPM(page);
  });

  // test('TC012 - Time, Date, and Name are mandatory fields', async ({
  //   page,
  // }) => {
  //   await validateMandatoryFields(page);
  // });

  test('TC013 - When user has not clocked in he should see {admin} is clocked out', async ({
    page,
  }) => {
    await validateClockedOutMessage(page);
  });

  test('TC014 - When we click on cross and outside the drawer the form should reset and user is not clocked in', async ({
    page,
  }) => {
    await validateDrawerReset(page);
  });

  test('TC015 - When user clicks on clock in he should see a new drawer for clock out', async ({
    page,
  }) => {
    await validateClockInDrawerClose(page);
  });

  test('TC016 - The timer should start ticking from current time', async ({
    page,
  }) => {
    await validateTimerStartsOnClockIn(page);
  });

  test('TC017 - The header should show {admin} is clocked in', async ({
    page,
  }) => {
    await validateHeaderShowsClockedIn(page);
  });

  test('TC018 - The header should show today time and total week time', async ({
    page,
  }) => {
    await validateHeaderShowsTodayAndWeekTime(page);
  });

  test('TC019 - Once clocked in user should see a running timer instead of clock in button', async ({
    page,
  }) => {
    await validateRunningTimerAfterClockIn(page);
  });

  // added drawer not accessible after clock in
  test('TC020 - Verify Clock In Drawer Not Accessible After Clock In', async ({
    page,
  }) => {
    await validateClockInDrawerNotAccessible(page);
  });

  // test('TC021 - Verify Preselected Fields in Clock In Screen', async ({
  //   page,
  // }) => {
  //   await validatePreselectedFields(page);
  // });

  test('TC022 - Verify Service Item Selection', async ({ page }) => {
    await validateServiceItemSelection(page);
  });

  test('TC023 - Verify Billable Field Toggle', async ({ page }) => {
    await validateBillableField(page);
  });

  test('TC024 - Verify Bill Rate Input When Billable', async ({ page }) => {
    await validateBillableField(page);
  });

  test('TC025 - Verify Class Selection', async ({ page }) => {
    await validateClassSelection(page);
  });

  test('TC026 - Verify Department Selection', async ({ page }) => {
    await validateDepartmentSelection(page);
  });

  test('TC027 - Admin can select location', async ({ page }) => {
    await validateLocationSelection(page);
  });

  test('TC028 - Admin can select customer/project (quickfill)', async ({
    page,
  }) => {
    await validateCustomerProjectSelection(page);
  });

  test('TC029 - Admin can select service item (quickfill)', async ({
    page,
  }) => {
    await validateServiceItemSelection(page);
  });

  test('TC030 - Class/department/location should be quickfill', async ({
    page,
  }) => {
    await validateQuickfillDropdowns(page);
  });

  test('TC031 - Timer header turns green when clocked in', async ({ page }) => {
    await validateTimerTurnsGreenOnClockIn(page);
  });

  test('TC032 - Timesheet updates on save and stays on clock', async ({
    page,
  }) => {
    await validateTimesheetUpdateOnSave(page);
  });

  test('TC033 - Timer resets on clock out', async ({ page }) => {
    await validateTimerResetOnClockOut(page);
  });

  // test('TC034 - Timer resets and form resets on switch job', async ({
  //   page,
  // }) => {
  //   await validateTimerResetOnSwitchJob(page);
  // });

  // test('TC035 - Switch job shows all fields and creates new timesheet', async ({
  //   page,
  // }) => {
  //   await validateSwitchJobShowsAllFields(page);
  // });

  // test('TC036 - Validate screen shows proper error message in case the clock ticker call fails', async ({
  //   page,
  // }) => {
  //   await validateBackendErrorHandling(page);
  // });

  // test('TC037 - When user attempts to clock in from multiple devices or browser tabs, show message', async ({
  //   page,
  // }) => {
  //   await validateMultipleDeviceClockIn(page);
  // });

  // test('TC038 - Validate that a proper error message is displayed when the running time for the time clock fails to load', async ({
  //   page,
  // }) => {
  //   await validateRunningTimeErrorHandling(page);
  // });

  test('TC039 - Validate that a proper message is displayed in case of network interruption/error on Time Entries screen', async ({
    page,
  }) => {
    await validateNetworkErrorOnTimeEntries(page);
  });

  test('TC040 - Validate that a proper message is displayed on the time clock drawer in case of network interruption/error', async ({
    page,
  }) => {
    await validateNetworkErrorOnClockInDrawer(page);
  });

  // test('TC041 - Validate error message when saving time clock entry fails', async ({
  //   page,
  // }) => {
  //   await validateSaveTimeClockError(page);
  // });

  // test('TC042 - Validate error message when clocking out fails', async ({
  //   page,
  // }) => {
  //   await validateClockOutError(page);
  // });

  // test('TC043 - Validate conflict message when clocking in overlaps with another timesheet', async ({
  //   page,
  // }) => {
  //   await validateTimesheetOverlapOnClockIn(page);
  // });

  // test('TC044 - Validate conflict message when editing timesheet overlaps with another', async ({
  //   page,
  // }) => {
  //   await validateTimesheetOverlapOnEdit(page);
  // });

  test('TC045 - Validate clock in button visibility based on permissions', async ({
    page,
  }) => {
    await validateClockInPermission(page);
  });

  // test('TC046 - Validate future start time restriction', async ({ page }) => {
  //   await validateFutureStartTime(page);
  // });

  // test('TC047 - Validate customer/project selection requirement', async ({
  //   page,
  // }) => {
  //   await validateCustomerMandatoryFields(page);
  // });

  // test('TC048 - Validate field labels on Time Entries and Clock In screens', async ({
  //   page,
  // }) => {
  //   await validateFieldLabels(page);
  // });

  test('TC049 - Validate time entries order by date', async ({ page }) => {
    await validateTimeEntriesOrder(page);
  });

  // test('TC050 - Validate saving notes', async ({ page }) => {
  //   await validateSavingNotes(page);
  // });

  //   test('TC051 - Validate customer to project switch changes', async ({
  //     page,
  //   }) => {
  //     await validateCustomerToProjectSwitch(page);
  //   });

  //   test('TC052 - Validate custom field required field', async ({ page }) => {
  //     await validateCustomFieldMandatoryFields(page);
  //   });
});

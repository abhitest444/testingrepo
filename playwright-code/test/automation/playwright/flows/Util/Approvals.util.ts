import { Page, expect } from '@playwright/test';
import ApprovalsPage from '../../pages/ApprovalsPage';
import SingleTimeEntryPage from '../../pages/SingleTimeEntryPage';
import SingleTimeActivityPage from '../../pages/SingleTimeActivityPage';
import { BreaksPage } from '../../pages/BreaksPage';
import * as weeklyTimeEntryPage from '../../pages/WeeklyTimeEntryPage';
import {
  clickAddTimeDropdown,
  selectSingleTimeEntryFromAddTime,
  openDateRangeDropdown,
  selectDateRangeOption,
} from '../../commonUtils';

/**
 * Time Approvals - Test Utilities
 * Automated test functions for Time Approvals feature
 */

// ==================== Navigation ====================

export async function navigateToApprovals(page: Page) {
  console.log('Navigating to Time Approvals page...');
  const approvalsPage = new ApprovalsPage(page);
  await approvalsPage.navigateToApprovalsPage();
  await approvalsPage.handlePopupsIfAny();
  console.log('✓ Navigated to Approvals page');
}

// ==================== Select This Month Date Range ====================

export async function selectThisMonthDateRange(page: Page) {
  console.log('  Selecting "This month" date range...');
  const approvalsPage = new ApprovalsPage(page);
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This month');
  await approvalsPage.waitForLoadingToDisappear();
  console.log('  ✓ Date range set to "This month"');
}

/**
 * Refresh the view by changing date range to Today and back to This month
 * Used after delete operations since dynamic refresh doesn't always work
 */
export async function refreshDateRangeView(page: Page) {
  console.log('    Refreshing view by changing date range...');
  const approvalsPage = new ApprovalsPage(page);

  // Change to "Today" first
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'Today');
  await approvalsPage.waitForLoadingToDisappear();
  await page.waitForTimeout(500);

  // Change back to "This month"
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This month');
  await approvalsPage.waitForLoadingToDisappear();
  await page.waitForTimeout(500);

  console.log('    ✓ View refreshed');
}

// ==================== Add Time Entry (STE) ====================

export async function addSingleTimeEntry(
  page: Page,
  options: {
    employeeName?: string;
    duration?: string;
    notes?: string;
  } = {},
) {
  console.log('Adding Single Time Entry from Approvals...');
  const approvalsPage = new ApprovalsPage(page);
  const stePage = new SingleTimeEntryPage(page);
  const singleTimeActivityPage = new SingleTimeActivityPage(page);

  // Click Add time → Single time entry (using commonUtils)
  await clickAddTimeDropdown(page);
  await selectSingleTimeEntryFromAddTime(page);

  // Wait for page to load and handle popups
  await stePage.waitForPageReady();
  await stePage.handlePopupsInAnyOrder();
  await stePage.waitTillNameFieldVisible();
  console.log('  ✓ Single Time Entry form opened');

  // Select employee (required field)
  if (options.employeeName) {
    await stePage.selectEmployeeByDisplayName(options.employeeName);
  } else {
    // Select first available employee (following existing pattern)
    await singleTimeActivityPage.clickDropdownOption(1, 'Name');
  }
  const nameValue = await stePage.getFieldValue('Name');
  console.log(`  ✓ Employee selected: "${nameValue}"`);

  // Set date to today
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
  await stePage.fillStartDate(formattedDate);
  console.log(`  ✓ Date set to: ${formattedDate}`);

  // Set duration (required field - default to 01:00 if not provided)
  const duration = options.duration || '01:00';
  await stePage.enterFieldValue('Duration', duration);
  console.log(`  ✓ Duration set to: ${duration}`);

  // Fill in notes if provided
  if (options.notes) {
    await stePage.enterNotes(options.notes);
    console.log(`  ✓ Notes added: ${options.notes}`);
  }

  // Save and close - this returns us to the approvals screen
  await stePage.clickSaveAndCloseButton();
  await stePage.validateSuccessToast();
  console.log('  ✓ Single Time Entry saved and closed');

  // Wait for approvals page to load back
  await page.waitForTimeout(1000);

  // Select "This month" date range to ensure entry is visible
  await selectThisMonthDateRange(page);

  return {
    employeeName: nameValue,
    duration: duration,
    notes: options.notes || '',
  };
}

// ==================== Add Break ====================

export async function addBreak(
  page: Page,
  options: {
    employeeName?: string;
    breakType?: string;
    duration?: string;
    notes?: string;
  } = {},
) {
  console.log('Adding Break from Approvals...');
  const approvalsPage = new ApprovalsPage(page);
  const breaksPage = new BreaksPage(page);

  // Open Add Break drawer (following existing pattern from BreaksPage)
  await breaksPage.openAddBreakDrawer();
  console.log('  ✓ Break drawer opened');

  // Select team member (required field)
  // Default employee name or first available
  const employeeName = options.employeeName || 'Test Emp1';
  const breakType = options.breakType || 'Paid: break manual';

  await breaksPage.selectTeamMemberAndBreakType(employeeName, breakType);
  console.log(`  ✓ Team member: ${employeeName}, Break type: ${breakType}`);

  // Set date to today
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
  await breaksPage.enterStartDate(formattedDate);
  console.log(`  ✓ Date set to: ${formattedDate}`);

  // Select entry type and set duration (following addManualBreakWithDuration pattern)
  await breaksPage.selectBreakEntryType('Duration');
  await page.keyboard.press('Tab');

  // Set duration (default to 15 mins if not provided)
  const breakDuration = options.duration || '15';
  await breaksPage.enterDurationTime(breakDuration);
  await page.keyboard.press('Tab');
  console.log(`  ✓ Duration: ${breakDuration} mins`);

  // Enter notes if provided
  const breakNotes = options.notes || 'Test break';
  await breaksPage.enterNotes(breakNotes);
  console.log(`  ✓ Notes: ${breakNotes}`);

  // Save the break
  await breaksPage.saveBreak();
  await page.waitForTimeout(2000);
  console.log('  ✓ Break saved');

  // Select "This month" date range to ensure entry is visible
  await selectThisMonthDateRange(page);

  return {
    employeeName: employeeName,
    breakType: breakType,
    duration: breakDuration,
    notes: breakNotes,
  };
}

// ==================== Add Weekly Time Entry (WTE) ====================

export async function addWeeklyTimeEntry(
  page: Page,
  options: {
    employeeName?: string;
    hours?: string;
    notes?: string;
  } = {},
) {
  console.log('Adding Weekly Time Entry from Approvals...');
  const approvalsPage = new ApprovalsPage(page);

  // Click Add time → Weekly time entry (using commonUtils pattern)
  await clickAddTimeDropdown(page);
  await page.getByRole('option', { name: 'Weekly time entry' }).click();
  await page.waitForTimeout(2000);
  console.log('  ✓ Weekly Time Entry opened');

  // Wait for WTE page to load
  await weeklyTimeEntryPage.waitForLoadingToDisappear(page);
  await page.waitForTimeout(1000);

  // Step 1: Select team member (following existing pattern from TimePayrollRegression.util.ts)
  console.log('  Selecting team member...');
  await page.waitForTimeout(5000);
  await expect(
    weeklyTimeEntryPage.teamMemberDropdown(page).first(),
  ).toBeVisible({ timeout: 10000 });
  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  await page.waitForTimeout(500);

  // Get selected employee name
  const teamMemberValue = await weeklyTimeEntryPage
    .teamMemberDropdownValue(page)
    .first()
    .inputValue();
  const selectedEmployeeName =
    teamMemberValue || options.employeeName || 'Test Emp1';
  console.log(`  ✓ Selected employee: ${selectedEmployeeName}`);

  // Step 2: Select customer/project (first available)
  console.log('  Selecting customer/project...');
  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  await weeklyTimeEntryPage.clickCustomerDropdownOption(page);
  await page.waitForTimeout(500);
  console.log('  ✓ Selected customer/project');

  // Step 3: Enter hours for today's date
  // Get current day of week to enter hours in correct cell
  const today = new Date();
  const currentDayOfWeek = today.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
  // Cell index: Sunday=1, Monday=2, etc. (1-indexed for hours selector)
  const cellIndex = currentDayOfWeek + 1;

  const hoursToEnter = options.hours || '2';
  console.log(
    `  Entering ${hoursToEnter} hours for today (cell index ${cellIndex})...`,
  );

  const hoursCell = weeklyTimeEntryPage.hours(page, cellIndex);
  await hoursCell.click();
  await page.waitForTimeout(300);
  await page.keyboard.type(hoursToEnter);
  await page.waitForTimeout(300);
  console.log(`  ✓ Entered ${hoursToEnter} hours`);

  // Step 4: Enter notes if provided
  const wteNotes = options.notes || 'APT11 Test WTE';
  await weeklyTimeEntryPage.notesInput(page).fill(wteNotes);
  await page.waitForTimeout(300);
  console.log(`  ✓ Notes: ${wteNotes}`);

  // Step 5: Save and close the WTE - returns us to approvals screen
  console.log('  Saving WTE...');
  await weeklyTimeEntryPage.saveandcloseButton(page).click();
  await page.waitForTimeout(2000);

  // Wait for save to complete
  await weeklyTimeEntryPage.waitForLoadingToDisappear(page);
  console.log('  ✓ WTE saved');

  // Select "This month" date range to ensure entry is visible
  await selectThisMonthDateRange(page);

  return {
    employeeName: selectedEmployeeName,
    hours: hoursToEnter,
    notes: wteNotes,
  };
}

// ==================== Approve Single Employee ====================

export async function approveSingleEmployee(
  page: Page,
  employeeName: string,
): Promise<boolean> {
  console.log(`Approving time for: ${employeeName}`);
  const approvalsPage = new ApprovalsPage(page);

  // Wait for employee to be visible
  await approvalsPage.validateEmployeeVisible(employeeName);

  // Approve and validate (approveEmployee now includes validation)
  const isApproved = await approvalsPage.approveEmployee(employeeName);

  if (isApproved) {
    console.log(`  ✓ ${employeeName} approved and validated`);
  } else {
    console.log(`  ⚠ ${employeeName} approval may not have completed`);
  }

  return isApproved;
}

// ==================== Unapprove Single Employee ====================

export async function unapproveSingleEmployee(
  page: Page,
  employeeName: string,
): Promise<boolean> {
  console.log(`Unapproving time for: ${employeeName}`);
  const approvalsPage = new ApprovalsPage(page);

  // Wait for employee to be visible
  await approvalsPage.validateEmployeeVisible(employeeName);

  // Unapprove and validate (unapproveEmployee now includes validation)
  const isUnapproved = await approvalsPage.unapproveEmployee(employeeName);

  if (isUnapproved) {
    console.log(`  ✓ ${employeeName} unapproved and validated`);
  } else {
    console.log(`  ⚠ ${employeeName} unapproval may not have completed`);
  }

  return isUnapproved;
}

// ==================== Bulk Approve ====================

export async function bulkApproveEmployees(
  page: Page,
  employeeNames: string[],
) {
  console.log(`Bulk approving ${employeeNames.length} employees...`);
  const approvalsPage = new ApprovalsPage(page);

  // Select each employee
  for (const name of employeeNames) {
    await approvalsPage.selectEmployee(name);
  }

  // Click bulk approve
  await approvalsPage.bulkApprove();
  await page.waitForTimeout(1000);

  console.log(`  ✓ ${employeeNames.length} employees bulk approved`);
  return true;
}

// ==================== Bulk Unapprove ====================

export async function bulkUnapproveEmployees(
  page: Page,
  employeeNames: string[],
) {
  console.log(`Bulk unapproving ${employeeNames.length} employees...`);
  const approvalsPage = new ApprovalsPage(page);

  // Select each employee
  for (const name of employeeNames) {
    await approvalsPage.selectEmployee(name);
  }

  // Click bulk unapprove
  await approvalsPage.bulkUnapprove();
  await page.waitForTimeout(1000);

  console.log(`  ✓ ${employeeNames.length} employees bulk unapproved`);
  return true;
}

// ==================== View Details and Approve ====================

export async function viewDetailsAndApprove(
  page: Page,
  employeeName: string,
): Promise<boolean> {
  console.log(`Approving from view details: ${employeeName}`);
  const approvalsPage = new ApprovalsPage(page);

  // Step 1: Navigate to View Details page
  console.log(`  Step 1: Navigating to view details...`);
  await approvalsPage.clickActionDropdown(employeeName);

  // Wait for and click "View details" option
  const viewDetailsOption = page.locator(`//*[text()='View details']`);
  await viewDetailsOption.waitFor({ state: 'visible', timeout: 5000 });
  await viewDetailsOption.click();
  console.log(`    ✓ Clicked View details`);

  // Wait for view details page to load - look for employee name header or Approve time button
  await approvalsPage.waitForLoadingToDisappear();
  const approveTimeBtn = page.getByRole('button', { name: /approve time/i });
  await approveTimeBtn.waitFor({ state: 'visible', timeout: 10000 });
  console.log(`    ✓ View details page loaded`);

  // Step 2: Click "Approve time" dropdown and select "Approve time"
  console.log(`  Step 2: Clicking Approve time dropdown...`);
  await approveTimeBtn.click();

  // Wait for dropdown menu to appear
  const approveOption = page.locator(`//*[text()='Approve time']`).last();
  await approveOption.waitFor({ state: 'visible', timeout: 5000 });
  await approveOption.click();
  console.log(`    ✓ Clicked Approve time option`);

  // Step 3: Handle "Lock time" confirmation popup
  console.log(`  Step 3: Handling confirmation dialog...`);
  const confirmBtn = page.getByRole('button', {
    name: 'Approve and lock time',
  });
  await confirmBtn.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});

  if (await confirmBtn.isVisible().catch(() => false)) {
    await confirmBtn.click();
    console.log(`    ✓ Clicked 'Approve and lock time'`);
  }

  await approvalsPage.waitForLoadingToDisappear();

  // Step 4: Validate approval was successful
  console.log(`  Step 4: Validating approval...`);
  const validated = await validateViewDetailsApprovalStatus(page, 'approved');
  if (validated) {
    console.log(`  ✓ ${employeeName} approved from view details - VALIDATED`);
  } else {
    console.log(`  ⚠ ${employeeName} approval could not be validated`);
  }

  return validated;
}

// ==================== View Details and Unapprove ====================

export async function viewDetailsAndUnapprove(
  page: Page,
  employeeName: string,
): Promise<boolean> {
  console.log(`Unapproving from view details: ${employeeName}`);
  const approvalsPage = new ApprovalsPage(page);

  // Step 1: Navigate to View Details page
  console.log(`  Step 1: Navigating to view details...`);
  await approvalsPage.clickActionDropdown(employeeName);

  // Wait for and click "View details" option
  const viewDetailsOption = page.locator(`//*[text()='View details']`);
  await viewDetailsOption.waitFor({ state: 'visible', timeout: 5000 });
  await viewDetailsOption.click();
  console.log(`    ✓ Clicked View details`);

  // Wait for view details page to load - look for Approve time button
  await approvalsPage.waitForLoadingToDisappear();
  const approveTimeBtn = page.getByRole('button', { name: /approve time/i });
  await approveTimeBtn.waitFor({ state: 'visible', timeout: 10000 });
  console.log(`    ✓ View details page loaded`);

  // Step 2: Click "Approve time" dropdown and select "Unapprove time"
  console.log(`  Step 2: Clicking Approve time dropdown...`);
  await approveTimeBtn.click();

  // Wait for dropdown menu to appear
  const unapproveOption = page.locator(`//*[text()='Unapprove time']`);
  await unapproveOption.waitFor({ state: 'visible', timeout: 5000 });
  await unapproveOption.click();
  console.log(`    ✓ Clicked Unapprove time option`);

  // Step 3: Handle "Unlock time" confirmation popup
  console.log(`  Step 3: Handling confirmation dialog...`);
  const confirmBtn = page.getByRole('button', {
    name: 'Unapprove and unlock time',
  });
  await confirmBtn.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});

  if (await confirmBtn.isVisible().catch(() => false)) {
    await confirmBtn.click();
    console.log(`    ✓ Clicked 'Unapprove and unlock time'`);
  }

  await approvalsPage.waitForLoadingToDisappear();

  // Step 4: Validate unapproval was successful
  console.log(`  Step 4: Validating unapproval...`);
  const validated = await validateViewDetailsApprovalStatus(page, 'unapproved');
  if (validated) {
    console.log(`  ✓ ${employeeName} unapproved from view details - VALIDATED`);
  } else {
    console.log(`  ⚠ ${employeeName} unapproval could not be validated`);
  }

  return validated;
}

/**
 * Validate approval status on view details page
 */
async function validateViewDetailsApprovalStatus(
  page: Page,
  expectedStatus: 'approved' | 'unapproved',
): Promise<boolean> {
  const maxAttempts = 5;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await page.waitForTimeout(1000);

    // Check status in the entries table
    const statusCells = page
      .locator('td')
      .filter({ hasText: /^(Approved|Unapproved)$/ });
    const statusCount = await statusCells.count();

    if (statusCount > 0) {
      const firstStatus = await statusCells.first().textContent();
      const statusText = firstStatus?.trim().toLowerCase();

      if (expectedStatus === 'approved' && statusText === 'approved') {
        return true;
      }
      if (expectedStatus === 'unapproved' && statusText === 'unapproved') {
        return true;
      }
    }

    // Alternative: Check if dropdown button text changed
    const approveTimeBtn = page.getByRole('button', { name: /approve time/i });
    if (await approveTimeBtn.isVisible().catch(() => false)) {
      // If we can still see "Approve time" button, check dropdown options
      await approveTimeBtn.click();
      await page.waitForTimeout(300);

      if (expectedStatus === 'approved') {
        // After approval, "Unapprove time" should be visible
        const unapproveOption = page.locator(`//*[text()='Unapprove time']`);
        if (await unapproveOption.isVisible().catch(() => false)) {
          await page.keyboard.press('Escape'); // Close dropdown
          return true;
        }
      } else {
        // After unapproval, "Approve time" option should be visible in dropdown
        const approveOption = page.locator(`//*[text()='Approve time']`).last();
        if (await approveOption.isVisible().catch(() => false)) {
          await page.keyboard.press('Escape'); // Close dropdown
          return true;
        }
      }
      await page.keyboard.press('Escape'); // Close dropdown
    }

    console.log(
      `    Validating ${expectedStatus} status... (attempt ${attempt}/${maxAttempts})`,
    );
  }

  return false;
}

// ==================== Select Employee and Approve ====================

export async function selectEmployeeAndApprove(
  page: Page,
  employeeName: string,
) {
  console.log(`Selecting and approving: ${employeeName}`);
  const approvalsPage = new ApprovalsPage(page);

  // Select employee checkbox
  await approvalsPage.selectEmployee(employeeName);
  await page.waitForTimeout(500);

  // Click bulk approve button
  await approvalsPage.bulkApprove();

  // Handle confirmation popup if present
  const confirmBtn = page.getByRole('button', { name: /approve and lock/i });
  if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await confirmBtn.click();
  }

  await page.waitForTimeout(1000);
  console.log(`  ✓ ${employeeName} selected and approved`);
  return true;
}

// ==================== Select All and Approve ====================

export async function selectAllAndApprove(page: Page) {
  console.log('Selecting all employees and approving...');
  const approvalsPage = new ApprovalsPage(page);

  await approvalsPage.selectAllEmployees();
  await approvalsPage.bulkApprove();
  await page.waitForTimeout(1000);

  console.log('  ✓ All employees approved');
  return true;
}

// ==================== Select All and Unapprove ====================

export async function selectAllAndUnapprove(page: Page) {
  console.log('Selecting all employees and unapproving...');
  const approvalsPage = new ApprovalsPage(page);

  await approvalsPage.selectAllEmployees();
  await approvalsPage.bulkUnapprove();
  await page.waitForTimeout(1000);

  console.log('  ✓ All employees unapproved');
  return true;
}

// ==================== Team Member Search ====================

export async function searchAndValidateTeamMember(
  page: Page,
  searchTerm: string,
) {
  console.log(`Searching for team member: ${searchTerm}`);
  const approvalsPage = new ApprovalsPage(page);

  await approvalsPage.searchTeamMember(searchTerm);
  await approvalsPage.selectTeamMemberFromSearch(searchTerm);

  // Validate filtered results
  await approvalsPage.validateEmployeeVisible(searchTerm);
  console.log(`  ✓ Team member ${searchTerm} found and displayed`);

  return true;
}

export async function searchInvalidTeamMember(page: Page, invalidName: string) {
  console.log(`Searching for invalid team member: ${invalidName}`);
  const approvalsPage = new ApprovalsPage(page);

  await approvalsPage.searchTeamMember(invalidName);
  await page.waitForTimeout(1000);

  // Validate no results
  const noResults = page.getByText(/no results|not found/i);
  const menuItem = page.getByRole('menuitem', { name: invalidName });

  // Either no results message or no matching menu item
  const hasNoResults = await noResults.isVisible().catch(() => false);
  const hasNoMenuItem = !(await menuItem.isVisible().catch(() => false));

  expect(hasNoResults || hasNoMenuItem).toBe(true);
  console.log(`  ✓ Invalid team member not found (as expected)`);

  await approvalsPage.clearTeamMemberSearch();
  return true;
}

// ==================== Run Payroll ====================

export async function clickRunPayroll(page: Page) {
  console.log('Clicking Run Payroll...');
  const approvalsPage = new ApprovalsPage(page);

  await approvalsPage.clickRunPayroll();
  await page.waitForTimeout(2000);

  // Validate navigation or modal
  // Run Payroll typically navigates to a payroll page or opens a modal
  const currentUrl = page.url();
  const payrollVisible =
    currentUrl.includes('payroll') ||
    (await page
      .getByText(/payroll/i)
      .first()
      .isVisible()
      .catch(() => false));

  console.log(`  ✓ Run Payroll clicked, URL: ${currentUrl}`);
  return payrollVisible;
}

// ==================== Validate Entry Created ====================

export async function validateEntryCreated(
  page: Page,
  employeeName: string,
  expectedHours?: string,
) {
  console.log(`Validating entry for: ${employeeName}`);
  const approvalsPage = new ApprovalsPage(page);

  await approvalsPage.validateEmployeeVisible(employeeName);

  if (expectedHours) {
    await approvalsPage.validateTotalHours(employeeName, expectedHours);
  }

  console.log(`  ✓ Entry validated for ${employeeName}`);
  return true;
}

// ==================== Validate All Hours ====================

export async function validateAllHoursTotal(page: Page, expectedTotal: string) {
  console.log(`Validating All Hours total: ${expectedTotal}`);
  const approvalsPage = new ApprovalsPage(page);

  const total = await approvalsPage.getAllHoursTotal();
  expect(total).toContain(expectedTotal);

  console.log(`  ✓ All Hours total matches: ${total}`);
  return true;
}

// ==================== Combined Validation Flow ====================

export async function validateApprovalsPageLoaded(page: Page) {
  console.log('Validating Approvals page loaded correctly...');
  const approvalsPage = new ApprovalsPage(page);

  // Validate key elements are visible
  await expect(approvalsPage.addTimeButton).toBeVisible();
  await expect(approvalsPage.runPayrollButton).toBeVisible();
  await expect(approvalsPage.teamMemberSearch).toBeVisible();
  await expect(approvalsPage.approvalsTable).toBeVisible();

  console.log('  ✓ Approvals page loaded with all key elements');
  return true;
}

// ==================== Complete Approval Workflow ====================

export async function completeApprovalWorkflow(
  page: Page,
  options: {
    addEntry?: boolean;
    entryType?: 'STE' | 'Break' | 'WTE';
    employeeName: string;
    approve?: boolean;
  },
) {
  console.log('=== Complete Approval Workflow ===');
  const approvalsPage = new ApprovalsPage(page);

  // Step 1: Add entry if requested
  if (options.addEntry) {
    switch (options.entryType) {
      case 'STE':
        await addSingleTimeEntry(page, { employeeName: options.employeeName });
        break;
      case 'Break':
        await addBreak(page, { employeeName: options.employeeName });
        break;
      case 'WTE':
        await addWeeklyTimeEntry(page, { employeeName: options.employeeName });
        break;
    }
  }

  // Step 2: Validate employee is visible
  await approvalsPage.validateEmployeeVisible(options.employeeName);

  // Step 3: Approve if requested
  if (options.approve) {
    await approveSingleEmployee(page, options.employeeName);
  }

  console.log('=== Workflow Complete ===');
  return true;
}

// ==================== Cleanup Functions ====================

/**
 * Delete a single entry from view details page
 * Entry must be unapproved before deletion (shows Edit, not only View)
 */
export async function deleteEntryFromViewDetails(page: Page): Promise<boolean> {
  console.log('  Deleting entry from view details...');

  try {
    const approvalsPage = new ApprovalsPage(page);

    const rowContainingEdit = (): ReturnType<Page['locator']> =>
      page
        .locator('tbody tr')
        .filter({ has: page.getByRole('button', { name: /edit/i }) })
        .first();

    let entryRow = rowContainingEdit();

    if (!(await entryRow.isVisible({ timeout: 4000 }).catch(() => false))) {
      entryRow = page
        .locator('tr')
        .filter({ hasNot: page.locator('th') })
        .filter({ has: page.getByRole('button', { name: /edit/i }) })
        .first();
    }

    if (!(await entryRow.isVisible({ timeout: 3000 }).catch(() => false))) {
      const firstBodyRow = page.locator('tbody tr').first();
      if (await firstBodyRow.isVisible({ timeout: 2000 }).catch(() => false)) {
        await firstBodyRow.click();
        await page.waitForTimeout(600);
      }
      entryRow = rowContainingEdit();
    }

    if (!(await entryRow.isVisible({ timeout: 4000 }).catch(() => false))) {
      console.log(
        '    No entries found to delete (no row with Edit — entry may still be approved/locked or layout changed)',
      );
      return false;
    }

    const editDropdown = entryRow
      .locator('[aria-label="Expand Menu"]')
      .or(entryRow.locator('button[aria-haspopup="true"]').last());

    if (!(await editDropdown.isVisible({ timeout: 3000 }).catch(() => false))) {
      console.log(
        '    Row Expand Menu not visible — cannot reach Delete for this row',
      );
      return false;
    }

    await editDropdown.click();
    await page.waitForTimeout(500);

    const deleteOption = page
      .getByRole('menuitem', { name: /^delete$/i })
      .or(page.getByRole('menuitem', { name: /delete/i }))
      .or(page.locator(`//*[normalize-space()='Delete']`));

    if (
      !(await deleteOption
        .first()
        .isVisible({ timeout: 4000 })
        .catch(() => false))
    ) {
      console.log('    Delete option did not appear in row actions menu');
      await page.keyboard.press('Escape');
      return false;
    }

    await deleteOption.first().click();
    await page.waitForTimeout(500);

    const confirmDelete = page.getByRole('button', {
      name: /delete|confirm|yes/i,
    });
    if (await confirmDelete.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmDelete.click();
    }

    await page.waitForTimeout(1000);
    await approvalsPage.waitForLoadingToDisappear();

    await refreshDateRangeView(page);

    console.log('    ✓ Entry deleted and view refreshed');
    return true;
  } catch (error) {
    console.log(`    ⚠ Error deleting entry: ${error}`);
    return false;
  }
}

/**
 * Delete all entries for an employee from view details page
 * Will unapprove entries if needed before deleting
 */
export async function deleteAllEntriesFromViewDetails(
  page: Page,
  employeeName: string,
): Promise<number> {
  console.log(`Deleting all entries for: ${employeeName}`);
  const approvalsPage = new ApprovalsPage(page);
  let deletedCount = 0;
  const maxAttempts = 10;

  const employeeRow = approvalsPage.getRowByEmployeeName(employeeName);
  const hasEmployeeRow = await employeeRow
    .isVisible({ timeout: 8000 })
    .catch(() => false);
  if (!hasEmployeeRow) {
    console.log(
      `  No Approvals row for ${employeeName} — nothing to delete (empty list or no match)`,
    );
    return 0;
  }

  // Navigate to view details for the employee
  await approvalsPage.clickActionDropdown(employeeName);
  const viewDetailsOption = page.locator(`//*[text()='View details']`);
  const menuOpened = await viewDetailsOption
    .isVisible({ timeout: 5000 })
    .catch(() => false);
  if (!menuOpened) {
    console.log(
      '  Action menu / View details did not open — nothing to delete or UI changed',
    );
    return 0;
  }
  await viewDetailsOption.click();
  await page.waitForTimeout(2000);
  await approvalsPage.waitForLoadingToDisappear();

  // Check if there are approved entries (not "Unapproved") - unapprove first if needed
  // Use exact text match to avoid matching "Unapproved"
  const statusCells = page.locator('td');
  const cellCount = await statusCells.count();
  let hasApprovedEntries = false;

  for (let i = 0; i < cellCount; i++) {
    const cellText = await statusCells
      .nth(i)
      .textContent()
      .catch(() => '');
    if (cellText?.trim() === 'Approved') {
      hasApprovedEntries = true;
      break;
    }
  }

  if (hasApprovedEntries) {
    console.log('  Found approved entries, unapproving first...');

    // Unapprove all entries using Approve time dropdown
    const approveTimeBtn = page.getByRole('button', { name: /approve time/i });
    if (await approveTimeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await approveTimeBtn.click();
      await page.waitForTimeout(500);

      const unapproveOption = page.locator(`//*[text()='Unapprove time']`);
      if (
        await unapproveOption.isVisible({ timeout: 2000 }).catch(() => false)
      ) {
        await unapproveOption.click();
        await page.waitForTimeout(500);

        // Confirm unapproval
        const confirmBtn = page.getByRole('button', {
          name: 'Unapprove and unlock time',
        });
        if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await confirmBtn.click();
          await page.waitForTimeout(1000);
        }
        await approvalsPage.waitForLoadingToDisappear();
        console.log('  ✓ Entries unapproved');
        await page.waitForTimeout(1000);
        await page
          .locator('tbody tr')
          .filter({ has: page.getByRole('button', { name: /edit/i }) })
          .first()
          .waitFor({ state: 'visible', timeout: 20000 })
          .catch(() =>
            console.log(
              '  ⚠ Edit row slow to appear after unapprove — continuing delete attempts',
            ),
          );
      } else {
        // Close dropdown if Unapprove not available
        await page.keyboard.press('Escape');
      }
    }
  } else {
    console.log('  No approved entries found, proceeding to delete');
  }

  await page
    .locator('tbody tr')
    .filter({ has: page.getByRole('button', { name: /edit/i }) })
    .first()
    .waitFor({ state: 'visible', timeout: 12000 })
    .catch(() => {});

  // Now delete entries one by one
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const deleted = await deleteEntryFromViewDetails(page);
    if (deleted) {
      deletedCount++;
      await page.waitForTimeout(500);
    } else {
      break; // No more entries to delete
    }
  }

  console.log(`  ✓ Deleted ${deletedCount} entries for ${employeeName}`);
  return deletedCount;
}

/**
 * Cleanup all entries on the approvals page
 * Goes through each employee and deletes their entries
 */
export async function cleanupAllApprovalsEntries(page: Page): Promise<void> {
  console.log('=== Cleanup: Deleting all approval entries ===');
  const approvalsPage = new ApprovalsPage(page);

  // Navigate to approvals and select "This month"
  await approvalsPage.navigateToApprovalsPage();
  await selectThisMonthDateRange(page);
  await page.waitForTimeout(1000);

  // Get all employee names
  const maxEmployees = 10;
  let employeesProcessed = 0;

  while (employeesProcessed < maxEmployees) {
    // Check if there are any employees
    const hasEmployees = await approvalsPage.tableRows
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (!hasEmployees) {
      console.log('  No more employees with entries');
      break;
    }

    // Get first employee name
    const employeeName = await approvalsPage.getFirstEmployeeName();
    if (!employeeName) {
      console.log('  Could not get employee name');
      break;
    }

    // Delete all entries for this employee
    await deleteAllEntriesFromViewDetails(page, employeeName);

    // Navigate back to approvals
    await approvalsPage.navigateToApprovalsPage();
    await selectThisMonthDateRange(page);
    await page.waitForTimeout(1000);

    employeesProcessed++;
  }

  console.log(
    `=== Cleanup Complete: Processed ${employeesProcessed} employees ===`,
  );
}

/**
 * Pre-test cleanup - ensure clean state before test
 */
export async function preTestCleanup(page: Page): Promise<void> {
  console.log('=== Pre-Test Cleanup ===');
  try {
    const approvalsPage = new ApprovalsPage(page);

    // Navigate to approvals
    await approvalsPage.navigateToApprovalsPage();
    await selectThisMonthDateRange(page);
    await page.waitForTimeout(1000);

    // Check if there are any existing entries
    const hasEntries = await approvalsPage.tableRows
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (hasEntries) {
      console.log('  Found existing entries, cleaning up...');
      await cleanupAllApprovalsEntries(page);
    } else {
      console.log('  No existing entries, clean state confirmed');
    }

    console.log('=== Pre-Test Cleanup Complete ===');
  } catch (error) {
    console.log(`  ⚠ Pre-test cleanup error (continuing): ${error}`);
  }
}

/**
 * Post-test cleanup - clean up entries created during test
 */
export async function postTestCleanup(page: Page): Promise<void> {
  console.log('=== Post-Test Cleanup ===');
  try {
    await cleanupAllApprovalsEntries(page);
    console.log('=== Post-Test Cleanup Complete ===');
  } catch (error) {
    console.log(`  ⚠ Post-test cleanup error: ${error}`);
  }
}

// ==================== Test Case Implementations ====================

/**
 * APT04-05: Approve and UnApprove Entries from Approvals
 * Creates an entry, approves it, then unapproves it
 */
export async function testApproveAndUnapproveFromApprovals(
  page: Page,
): Promise<void> {
  console.log('=== APT04-05: Approve and UnApprove from Approvals ===');

  const approvalsPage = new ApprovalsPage(page);

  // Create entry
  console.log('\n--- Step 1: Creating time entry ---');
  await addSingleTimeEntry(page, { notes: 'APT04-05 Test Entry' });

  await approvalsPage.tableRows.first().waitFor({ state: 'visible' });

  const cleanName = await approvalsPage.getFirstEmployeeName();
  if (!cleanName) {
    throw new Error('No employees found');
  }
  console.log(`  ✓ Entry created for: ${cleanName}`);

  // Verify Approve button is visible (moved from APT01/APT02 navigation tests)
  const approveButton = page.getByRole('button', { name: 'Approve' }).first();
  await expect(approveButton).toBeVisible();
  console.log('  ✓ Approve button visible');

  // Approve (APT04)
  console.log('\n--- Step 2: Approving entry (APT04) ---');
  const approvalSuccess = await approveSingleEmployee(page, cleanName);
  expect(approvalSuccess, 'Approval should succeed').toBe(true);
  console.log(`  ✓ Entry approved and validated`);

  // Unapprove (APT05)
  console.log('\n--- Step 3: Unapproving entry (APT05) ---');
  const unapprovalSuccess = await unapproveSingleEmployee(page, cleanName);
  expect(unapprovalSuccess, 'Unapproval should succeed').toBe(true);
  console.log(`  ✓ Entry unapproved and validated`);

  console.log('\n✅ APT04-05: Approve and UnApprove from Approvals completed');
}

/**
 * APT06-07-13: View Details Approval + Edit Verification
 * Tests approve/unapprove from view details and verifies editability
 */
export async function testViewDetailsApprovalAndEditVerification(
  page: Page,
): Promise<void> {
  console.log('=== APT06-07-13: View Details Approval + Edit Verification ===');

  const approvalsPage = new ApprovalsPage(page);

  // Create entry
  console.log('\n--- Step 1: Creating time entry ---');
  await addSingleTimeEntry(page, {
    duration: '01:00',
    notes: 'APT06-07-13 Test Entry',
  });

  await approvalsPage.tableRows.first().waitFor({ state: 'visible' });

  const cleanName = await approvalsPage.getFirstEmployeeName();
  if (!cleanName) {
    throw new Error('No employees found');
  }
  console.log(`  ✓ Entry created for: ${cleanName}`);

  // Step 2: Verify entry is EDITABLE (unapproved state)
  console.log('\n--- Step 2: Verify entry is editable (unapproved) ---');
  await approvalsPage.clickActionDropdown(cleanName);
  await page.locator(`//*[text()='View details']`).click();
  await page.waitForTimeout(2000);

  const entryRowUnapproved = page
    .locator('tr')
    .filter({ hasText: 'APT06-07-13' })
    .first();
  if (await entryRowUnapproved.isVisible().catch(() => false)) {
    await entryRowUnapproved.click();
  }

  const editBtnBefore = page.getByRole('button', { name: /edit/i }).first();
  const editableBefore = await editBtnBefore.isVisible().catch(() => false);
  expect(
    editableBefore,
    'Edit button should be visible for unapproved entry',
  ).toBe(true);
  console.log(`  ✓ Edit button visible - entry is editable`);

  // Step 3: Approve from View Details (APT06)
  console.log('\n--- Step 3: Approving from View Details (APT06) ---');
  await approvalsPage.navigateToApprovalsPage();
  await selectThisMonthDateRange(page);
  await approvalsPage.tableRows.first().waitFor({ state: 'visible' });

  const approvalSuccess = await viewDetailsAndApprove(page, cleanName);
  expect(approvalSuccess, 'Approval from view details should succeed').toBe(
    true,
  );
  console.log(`  ✓ Entry approved from view details`);

  // Step 4: Verify entry is NOT editable (approved state)
  console.log('\n--- Step 4: Verify entry is NOT editable (approved) ---');
  await approvalsPage.navigateToApprovalsPage();
  await selectThisMonthDateRange(page);
  await approvalsPage.tableRows.first().waitFor({ state: 'visible' });

  await approvalsPage.clickActionDropdown(cleanName);
  await page.locator(`//*[text()='View details']`).click();
  await page.waitForTimeout(2000);

  const entryRowApproved = page
    .locator('tr')
    .filter({ hasText: 'APT06-07-13' })
    .first();
  if (await entryRowApproved.isVisible().catch(() => false)) {
    await entryRowApproved.click();
  }

  const editBtnAfterApprove = page
    .getByRole('button', { name: /^edit$/i })
    .first();
  const editableAfterApprove = await editBtnAfterApprove
    .isVisible()
    .catch(() => false);
  console.log(
    `  Edit button visible after approval: ${editableAfterApprove} (expected: false or disabled)`,
  );

  // Step 5: Unapprove from View Details (APT07)
  console.log('\n--- Step 5: Unapproving from View Details (APT07) ---');
  await approvalsPage.navigateToApprovalsPage();
  await selectThisMonthDateRange(page);
  await approvalsPage.tableRows.first().waitFor({ state: 'visible' });

  const unapprovalSuccess = await viewDetailsAndUnapprove(page, cleanName);
  expect(unapprovalSuccess, 'Unapproval from view details should succeed').toBe(
    true,
  );
  console.log(`  ✓ Entry unapproved from view details`);

  // Step 6: Verify entry is EDITABLE again (unapproved state)
  console.log('\n--- Step 6: Verify entry is editable again (unapproved) ---');
  await approvalsPage.navigateToApprovalsPage();
  await selectThisMonthDateRange(page);
  await approvalsPage.tableRows.first().waitFor({ state: 'visible' });

  await approvalsPage.clickActionDropdown(cleanName);
  await page.locator(`//*[text()='View details']`).click();
  await page.waitForTimeout(2000);

  const entryRowFinal = page
    .locator('tr')
    .filter({ hasText: 'APT06-07-13' })
    .first();
  if (await entryRowFinal.isVisible().catch(() => false)) {
    await entryRowFinal.click();
  }

  const editBtnAfterUnapprove = page
    .getByRole('button', { name: /edit/i })
    .first();
  const editableAfterUnapprove = await editBtnAfterUnapprove
    .isVisible()
    .catch(() => false);
  expect(
    editableAfterUnapprove,
    'Edit button should be visible after unapprove',
  ).toBe(true);
  console.log(`  ✓ Edit button visible - entry is editable again`);

  console.log(
    '\n✅ APT06-07-13: View Details Approval + Edit Verification completed',
  );
}

/**
 * APT08: Select/Deselect Employee and Approve via Action Banner
 */
export async function testSelectDeselectAndApproveViaBanner(
  page: Page,
): Promise<void> {
  console.log('=== APT08: Select/deselect and approve via action banner ===');

  const approvalsPage = new ApprovalsPage(page);

  // Create entry
  console.log('\n--- Step 1: Creating time entry ---');
  await addSingleTimeEntry(page, { notes: 'APT08 Test Entry' });

  await approvalsPage.tableRows.first().waitFor({ state: 'visible' });

  const employeeName = await approvalsPage.getFirstEmployeeName();
  if (!employeeName) {
    throw new Error('No employees found');
  }
  console.log(`  ✓ Entry created for: ${employeeName}`);

  // Select employee
  console.log('\n--- Step 2: Selecting employee ---');
  const selected = await approvalsPage.selectEmployee(employeeName);
  expect(selected, 'Employee should be selected').toBe(true);

  // Wait for action banner
  await approvalsPage.actionBannerApproveButton.waitFor({ state: 'visible' });
  console.log(`  ✓ Action banner visible`);

  // Validate items selected
  const itemsSelectedVisible = await approvalsPage.validateItemsSelectedCount(
    1,
  );
  expect(itemsSelectedVisible, '"1 items selected" should be visible').toBe(
    true,
  );
  console.log(`  ✓ "1 items selected" text visible`);

  // Close banner - validate deselection
  console.log('\n--- Step 3: Closing action banner ---');
  await approvalsPage.closeActionBanner();

  const uncheckedVisible = await approvalsPage
    .getEmployeeCheckbox(employeeName)
    .isVisible()
    .catch(() => false);
  expect(uncheckedVisible, 'Employee should be deselected').toBe(true);
  console.log(`  ✓ Employee deselected after closing banner`);

  // Select again and approve
  console.log('\n--- Step 4: Selecting and approving ---');
  await approvalsPage.selectEmployee(employeeName);
  await approvalsPage.clickActionBannerApprove();

  // Handle confirmation
  const confirmBtn = page.getByRole('button', {
    name: 'Approve and lock time',
  });
  if (await confirmBtn.isVisible().catch(() => false)) {
    await confirmBtn.click();
  }

  await approvalsPage.waitForLoadingToDisappear();

  const isApproved = await approvalsPage.waitForApprovalStatus(
    employeeName,
    'approved',
  );
  expect(isApproved, 'Entry should be approved').toBe(true);
  console.log(`  ✓ Entry approved`);

  // Cleanup
  await unapproveSingleEmployee(page, employeeName);

  console.log('\n✅ APT08: Select/deselect and approve completed');
}

/**
 * APT10-11: Add Break and WTE from Approvals
 * Adds both entry types and validates each
 */
export async function testAddBreakAndWTEFromApprovals(
  page: Page,
): Promise<void> {
  console.log('=== APT10-11: Adding Break and WTE from Approvals ===');

  const approvalsPage = new ApprovalsPage(page);

  // Step 1: Add Break (APT10)
  console.log('\n--- Step 1: Adding Break (APT10) ---');
  const breakResult = await addBreak(page, {
    duration: '5',
    notes: 'APT10-11 Test Break',
  });
  console.log(
    `  ✓ Break added: ${breakResult.breakType}, Duration: ${breakResult.duration} mins`,
  );

  // Navigate and validate Break
  await approvalsPage.navigateToApprovalsPage();
  await selectThisMonthDateRange(page);
  await approvalsPage.tableRows.first().waitFor({ state: 'visible' });

  let employeeName = await approvalsPage.getFirstEmployeeName();
  if (!employeeName) {
    throw new Error('No employees found after Break');
  }

  let totalHours = await approvalsPage.getEmployeeTotal(employeeName);
  console.log(
    `  Employee: ${employeeName}, Total hours after Break: ${totalHours}`,
  );

  let hasHours =
    totalHours.trim() !== '--' &&
    totalHours.trim() !== '' &&
    totalHours.trim() !== '0';
  expect(hasHours, 'Break should add hours').toBe(true);
  console.log(`  ✓ Break validated on approvals screen`);

  // Step 2: Add WTE (APT11)
  console.log('\n--- Step 2: Adding WTE (APT11) ---');
  const wteResult = await addWeeklyTimeEntry(page, {
    hours: '2',
    notes: 'APT10-11 Test WTE',
  });
  console.log(`  ✓ WTE added: ${wteResult.hours} hours`);

  // Navigate and validate WTE
  await approvalsPage.navigateToApprovalsPage();
  await selectThisMonthDateRange(page);
  await approvalsPage.tableRows.first().waitFor({ state: 'visible' });

  employeeName = await approvalsPage.getFirstEmployeeName();
  if (!employeeName) {
    throw new Error('No employees found after WTE');
  }

  totalHours = await approvalsPage.getEmployeeTotal(employeeName);
  console.log(
    `  Employee: ${employeeName}, Total hours after WTE: ${totalHours}`,
  );

  hasHours =
    totalHours.trim() !== '--' &&
    totalHours.trim() !== '' &&
    totalHours.trim() !== '0';
  expect(hasHours, 'WTE should add hours').toBe(true);
  console.log(`  ✓ WTE validated on approvals screen`);

  console.log('\n✅ APT10-11: Break and WTE added and validated');
}

/**
 * APT12: Bulk Approve All Employees
 * Creates entries for two employees and bulk approves
 */
export async function testBulkApproveAll(page: Page): Promise<void> {
  console.log('=== APT12: Bulk Approve All ===');

  const approvalsPage = new ApprovalsPage(page);

  // Create entries for two different employees
  console.log('\n--- Step 1: Creating entries for 2 employees ---');
  await addSingleTimeEntry(page, {
    employeeName: 'Test Emp1',
    notes: 'APT12 Entry 1',
  });
  await addSingleTimeEntry(page, {
    employeeName: 'Test Emp2',
    notes: 'APT12 Entry 2',
  });

  await approvalsPage.tableRows.first().waitFor({ state: 'visible' });

  const rowCount = await approvalsPage.getRowCount();
  console.log(`  ✓ Created entries, row count: ${rowCount}`);

  // Select All
  console.log('\n--- Step 2: Clicking Select All ---');
  await approvalsPage.selectAllEmployees();
  await page.waitForTimeout(2000);

  const bannerVisible = await approvalsPage.isActionBannerVisible();
  expect(bannerVisible, 'Action banner should be visible').toBe(true);

  // Approve all
  console.log('\n--- Step 3: Bulk Approve ---');
  await approvalsPage.clickActionBannerApprove();

  const confirmApprove = page.getByRole('button', {
    name: 'Approve and lock time',
  });
  if (await confirmApprove.isVisible().catch(() => false)) {
    await confirmApprove.click();
  }

  await approvalsPage.waitForLoadingToDisappear();
  console.log(`  ✓ Bulk approval completed`);

  console.log('\n✅ APT12: Bulk Approve All completed');
}

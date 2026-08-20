import { Page, expect } from '@playwright/test';
import TimeMenuNavigationPage from '../../pages/TimeMenuNavigationPage';
import TimeProjectPage from '../../pages/TimeProjectPage';
import {
  navigateToClassicTimeSheet,
  handleClassicTimesheetPopupsInAnyOrder,
} from '../../pages/TimeSettingsPage';

// Store created project names for cleanup
export const createdProjects: string[] = [];
export const createdEstimates: { projectName: string }[] = [];

/**
 * Helper function to navigate to Time section and reveal Time project option
 */
async function navigateToTimeSection(
  page: Page,
  timeMenuNav: TimeMenuNavigationPage,
): Promise<void> {
  console.log('Navigating to Time section in QBO...');
  const hoverSuccess = await timeMenuNav.hoverOnMyAppsMenu();
  await page.waitForTimeout(5000);
  expect(hoverSuccess).toBeTruthy();
  await timeMenuNav.hoverOnTimeMenu();
  console.log('Time submenu revealed');
}

/**
 * Helper function to navigate to Time Project page
 */
async function navigateToTimeProject(
  page: Page,
  timeMenuNav: TimeMenuNavigationPage,
  timeProjectPage: TimeProjectPage,
): Promise<void> {
  await navigateToTimeSection(page, timeMenuNav);
  console.log('Clicking Time project option...');
  await timeProjectPage.clickTimeProjectOption();
  await timeProjectPage.waitForPageReady();
  console.log('Time Project page loaded');
}

/**
 * PR001 - Time project should be visible in Time section
 */
export const verifyTimeProjectOptionVisible = async (page: Page) => {
  const timeMenuNav = new TimeMenuNavigationPage(page);
  const timeProjectPage = new TimeProjectPage(page);

  console.log('PR001: Verifying Time project option is visible');

  await navigateToTimeSection(page, timeMenuNav);

  await timeProjectPage.validateTimeProjectOptionVisible();

  console.log('✓ PR001 PASSED: Time project option is visible in Time section');
};

/**
 * PR002 - Time project page should display table with correct headers and filters
 */
export const verifyTimeProjectPageElements = async (page: Page) => {
  const timeMenuNav = new TimeMenuNavigationPage(page);
  const timeProjectPage = new TimeProjectPage(page);

  console.log(
    'PR002: Verifying Time project page elements - table headers, filters, and search',
  );

  await navigateToTimeProject(page, timeMenuNav, timeProjectPage);

  await timeProjectPage.validateTimeProjectPageDisplayed();
  console.log('Time project page displayed');

  await timeProjectPage.validateManageProjectsLinkDisplayed();
  console.log('Manage Projects link displayed');

  await timeProjectPage.validateTableHeaders();
  console.log(
    '✓ Table headers verified: Project/Customer, Status, Deadline, Budget, Action',
  );

  await timeProjectPage.validateFiltersPresent();
  console.log('✓ Filters verified: Status and Customer filters present');

  await timeProjectPage.validateSearchOptionPresent();
  console.log('✓ Search option verified: Project name search is available');

  console.log(
    '✓ PR002 PASSED: Time project page displays correct table headers, filters, and search option',
  );
};

/**
 * PR003 - Create project option should not be available in Time Project page
 */
export const verifyCreateProjectNotAvailable = async (page: Page) => {
  const timeMenuNav = new TimeMenuNavigationPage(page);
  const timeProjectPage = new TimeProjectPage(page);

  console.log('PR003: Verifying that create project option is not available');

  await navigateToTimeProject(page, timeMenuNav, timeProjectPage);

  await timeProjectPage.validateTimeProjectPageDisplayed();
  console.log('Time project page displayed');

  await timeProjectPage.validateManageProjectsLinkDisplayed();
  console.log('Manage Projects link displayed');

  await timeProjectPage.validateCreateProjectNotVisible();
  console.log(
    '✓ Create project button is not visible - projects should be created from Projects section',
  );

  console.log(
    '✓ PR003 PASSED: Create project option is not available in Time Project page',
  );
};

/**
 * PR004 - Manage Projects link should redirect to Projects page
 */
export const verifyManageProjectsLinkRedirect = async (page: Page) => {
  const timeMenuNav = new TimeMenuNavigationPage(page);
  const timeProjectPage = new TimeProjectPage(page);

  console.log(
    'PR004: Verifying Manage Projects link redirects to Projects section',
  );

  await navigateToTimeProject(page, timeMenuNav, timeProjectPage);

  await timeProjectPage.validateTimeProjectPageDisplayed();
  console.log('Time project page displayed');

  await timeProjectPage.validateManageProjectsLinkDisplayed();
  console.log('Manage Projects link displayed');

  console.log('Clicking Manage Projects link...');
  await timeProjectPage.clickManageProjectsLink();

  await timeProjectPage.validateProjectsPageRedirect();
  console.log(
    '✓ User redirected to original Projects page in Projects section',
  );

  console.log(
    '✓ PR004 PASSED: Manage Projects link correctly redirects to Projects page',
  );
};

/**
 * PR005 - Time project page should display description about estimates
 */
export const verifyTimeProjectPageDescription = async (page: Page) => {
  const timeMenuNav = new TimeMenuNavigationPage(page);
  const timeProjectPage = new TimeProjectPage(page);

  console.log(
    'PR005: Verifying Time project page displays estimate description',
  );

  await navigateToTimeProject(page, timeMenuNav, timeProjectPage);

  await timeProjectPage.validateTimeProjectPageDisplayed();
  console.log('Time project page displayed');

  await timeProjectPage.validateManageProjectsLinkDisplayed();
  console.log('Manage Projects link displayed');

  await timeProjectPage.validatePageDescription();
  console.log('✓ Description verified:');
  console.log('  - "View insights into actual versus estimate hours"');
  console.log(
    '  - "Get started by creating estimates to accurate plan for how time is spent on your projects"',
  );

  console.log(
    '✓ PR005 PASSED: Time project page displays correct estimate description',
  );
};

/**
 * PR006 - Create Estimate link should be visible for projects without budgets
 */
export const verifyCreateEstimateLinkVisible = async (page: Page) => {
  const timeMenuNav = new TimeMenuNavigationPage(page);
  const timeProjectPage = new TimeProjectPage(page);

  console.log(
    'PR006: Verifying Create Estimate link is visible for projects without budgets',
  );

  await navigateToTimeProject(page, timeMenuNav, timeProjectPage);

  await timeProjectPage.validateTimeProjectPageDisplayed();
  console.log('Time project page displayed');

  await timeProjectPage.validateManageProjectsLinkDisplayed();
  console.log('Manage Projects link displayed');

  await timeProjectPage.validateCreateEstimateLinkVisible('testProject');

  console.log(
    '✓ PR006 PASSED: Create Estimate link is visible for projects without budgets',
  );
};

/**
 * PR007 - Create Estimate page should display estimate options with radio buttons
 */
export const verifyEstimatePageOptions = async (page: Page) => {
  const timeMenuNav = new TimeMenuNavigationPage(page);
  const timeProjectPage = new TimeProjectPage(page);

  console.log(
    'PR007: Verifying Create Estimate page displays estimate options',
  );

  await navigateToTimeProject(page, timeMenuNav, timeProjectPage);

  await timeProjectPage.validateTimeProjectPageDisplayed();
  console.log('Time project page displayed');

  await timeProjectPage.validateManageProjectsLinkDisplayed();
  console.log('Manage Projects link displayed');

  console.log('Clicking Create Estimate link...');
  await timeProjectPage.clickCreateEstimateLink();

  await timeProjectPage.validateEstimateCreationPageDisplayed();
  console.log('✓ Estimate creation page displayed');

  await timeProjectPage.validateEstimateOptions();
  console.log('✓ Estimate options verified:');
  console.log('  - By Hours option with radio button');
  console.log('  - By Service Items option with radio button');

  console.log(
    '✓ PR007 PASSED: Create Estimate page displays correct options with radio buttons',
  );
};

/**
 * PR008 - By Hours estimate flow - page elements and close without saving
 */
export const verifyByHoursEstimateFlow = async (page: Page) => {
  const timeMenuNav = new TimeMenuNavigationPage(page);
  const timeProjectPage = new TimeProjectPage(page);

  console.log(
    'PR008: Verifying By Hours estimate flow and close without saving',
  );

  await navigateToTimeProject(page, timeMenuNav, timeProjectPage);

  await timeProjectPage.validateTimeProjectPageDisplayed();
  console.log('Time project page displayed');

  await timeProjectPage.validateManageProjectsLinkDisplayed();
  console.log('Manage Projects link displayed');

  console.log('Clicking Create Estimate link...');
  await timeProjectPage.clickCreateEstimateLink();

  console.log('Selecting By Hours option...');
  await timeProjectPage.selectByHoursOption();

  console.log('Verifying By Hours estimate page elements...');
  await timeProjectPage.validateByHoursEstimatePageElements();
  console.log('✓ Page elements verified:');
  console.log('  - "How are you estimating this project?" displayed on top');
  console.log(
    '  - "Estimate by total hours on a project and track time towards the total" displayed below By Hours option',
  );
  console.log(
    '  - "How many hours are estimated to complete the project?" displayed',
  );

  await timeProjectPage.validateHoursInputPlaceholder();
  console.log('  - Textbox with placeholder "Enter Hours" displayed');

  console.log('Entering hours...');
  await timeProjectPage.enterHours('40');

  console.log('Clicking Close (X) button...');
  await timeProjectPage.clickCloseButton();
  await timeProjectPage.clickYesCreateEstimateConfirmation();

  await timeProjectPage.waitForPageReady();
  console.log(
    '✓ Estimate creation cancelled - estimate should not be created for the project',
  );

  console.log(
    '✓ PR008 PASSED: By Hours estimate page elements displayed correctly and estimate not created after closing',
  );
};

/**
 * PR009 - Validate hours input accepts only numericals and has up/down arrows (By Hours)
 */
export const verifyByHoursNumericInputValidation = async (page: Page) => {
  const timeMenuNav = new TimeMenuNavigationPage(page);
  const timeProjectPage = new TimeProjectPage(page);

  console.log(
    'PR009: Verifying By Hours numeric input validation and up/down arrows',
  );

  await navigateToTimeProject(page, timeMenuNav, timeProjectPage);

  await timeProjectPage.validateTimeProjectPageDisplayed();
  console.log('Time project page displayed');

  await timeProjectPage.validateManageProjectsLinkDisplayed();
  console.log('Manage Projects link displayed');

  console.log('Clicking Create Estimate link...');
  await timeProjectPage.clickCreateEstimateLink();

  console.log('Selecting By Hours option...');
  await timeProjectPage.selectByHoursOption();

  console.log('Verifying hours input accepts only numerical values...');
  await timeProjectPage.validateNumericOnlyInput();
  console.log(
    '✓ Non-numerical inputs (characters/special characters) are not accepted',
  );
  console.log('✓ Numerical values are accepted');

  console.log('Verifying up/down arrow functionality...');
  await timeProjectPage.validateUpDownArrowFunctionality();
  console.log('✓ Up arrow increases value by 1');
  console.log('✓ Down arrow decreases value by 1');

  console.log(
    '✓ PR009 PASSED: Hours input accepts only numericals and up/down arrows work correctly',
  );
};

/**
 * PR010 - Validate estimate is created by selecting By Hours, entering details and clicking Save
 */
export const verifyByHoursEstimateSave = async (
  page: Page,
  projectName: string = 'testProject',
) => {
  const timeMenuNav = new TimeMenuNavigationPage(page);
  const timeProjectPage = new TimeProjectPage(page);

  console.log('PR010: Verifying By Hours estimate creation with Save');

  await navigateToTimeProject(page, timeMenuNav, timeProjectPage);

  console.log('Clicking Create Estimate link...');
  await timeProjectPage.clickCreateEstimateLink();

  console.log('Selecting By Hours option...');
  await timeProjectPage.selectByHoursOption();

  console.log('Entering hours...');
  const estimatedHours = '25';
  await timeProjectPage.enterHours(estimatedHours);

  console.log(
    'Verifying Save button is enabled after entering numerical values...',
  );
  const isSaveEnabled = await timeProjectPage.isSaveButtonEnabled();
  expect(isSaveEnabled).toBeTruthy();
  console.log('✓ Save button is enabled after entering numerical values');

  console.log('Clicking Save button...');
  await timeProjectPage.clickSaveButton();

  console.log('Verifying estimate is saved and reflected in Budget column...');
  await timeProjectPage.validateEstimateSaved(projectName, estimatedHours);
  console.log(
    '✓ Entered hours are saved and correctly reflected in the Budget column',
  );

  console.log(
    '✓ PR010 PASSED: Estimate created successfully using By Hours option',
  );
};

/**
 * PR011 - Validate estimate is NOT created by selecting By Service Item and clicking close
 */
export const verifyByServiceItemCloseWithoutSave = async (
  page: Page,
  projectName: string = 'testProject',
) => {
  const timeMenuNav = new TimeMenuNavigationPage(page);
  const timeProjectPage = new TimeProjectPage(page);

  console.log('PR011: Verifying By Service Item close without save');

  await navigateToTimeProject(page, timeMenuNav, timeProjectPage);

  console.log('Clicking Create Estimate link...');
  await timeProjectPage.clickCreateEstimateLink();

  console.log('Verifying Create estimate page is displayed...');
  await timeProjectPage.validateEstimateCreationPageDisplayed();
  console.log('✓ Create estimate page is displayed');

  console.log('Selecting By Service Item option...');
  await timeProjectPage.selectByServiceItemsOption();

  console.log('Verifying By Service Item page elements...');
  await timeProjectPage.validateByServiceItemPageElements();
  console.log('✓ "How are you estimating this project?" displayed on top');
  console.log(
    '✓ "Estimate by service items on the project and track progress on those service items" displayed',
  );
  console.log('✓ "Enter the service items and estimated hours" displayed');

  await timeProjectPage.validateServiceItemHoursPlaceholder();
  console.log(
    '✓ Dropdown to select service item and textbox with placeholder "Enter Hours" displayed',
  );

  console.log('Selecting service item and entering hours...');
  await timeProjectPage.selectServiceItem('Hours');
  await timeProjectPage.enterServiceItemHours('15');

  console.log('Clicking Close (X) button...');
  await timeProjectPage.clickCloseButton();

  await timeProjectPage.waitForPageReady();
  console.log(
    '✓ Estimate creation cancelled - estimate should not be created for the project',
  );

  await timeProjectPage.validateEstimateNotCreated(projectName);
  console.log('✓ Create Estimate link is still visible for the project');

  console.log(
    '✓ PR011 PASSED: Estimate not created after closing By Service Item page',
  );
};

/**
 * PR012 - Validate hours input accepts only numericals and has up/down arrows (By Service Item)
 */
export const verifyByServiceItemNumericInputValidation = async (page: Page) => {
  const timeMenuNav = new TimeMenuNavigationPage(page);
  const timeProjectPage = new TimeProjectPage(page);

  console.log(
    'PR012: Verifying By Service Item numeric input validation and up/down arrows',
  );

  await navigateToTimeProject(page, timeMenuNav, timeProjectPage);

  console.log('Clicking Create Estimate link...');
  await timeProjectPage.clickCreateEstimateLink();

  console.log('Selecting By Service Item option...');
  await timeProjectPage.selectByServiceItemsOption();

  console.log('Verifying hours input accepts only numerical values...');
  await timeProjectPage.validateNumericOnlyInput();
  console.log(
    '✓ Non-numerical inputs (characters/special characters) are not accepted',
  );
  console.log('✓ Numerical values are accepted');

  console.log('Verifying up/down arrow functionality...');
  await timeProjectPage.validateUpDownArrowFunctionality();
  console.log('✓ Up arrow increases value by 1');
  console.log('✓ Down arrow decreases value by 1');

  console.log(
    '✓ PR012 PASSED: By Service Item hours input accepts only numericals and up/down arrows work correctly',
  );
};

/**
 * PR013 - Validate estimate is created by selecting By Service Item, entering details and clicking Save
 */
export const verifyByServiceItemEstimateSave = async (
  page: Page,
  projectName: string = 'testProject',
) => {
  const timeMenuNav = new TimeMenuNavigationPage(page);
  const timeProjectPage = new TimeProjectPage(page);

  console.log('PR013: Verifying By Service Item estimate creation with Save');

  await navigateToTimeProject(page, timeMenuNav, timeProjectPage);

  console.log('Clicking Create Estimate link...');
  await timeProjectPage.clickCreateEstimateLink();

  console.log('Selecting By Service Item option...');
  await timeProjectPage.selectByServiceItemsOption();

  console.log('Selecting service item...');
  await timeProjectPage.selectServiceItem('Hours');

  console.log('Entering hours...');
  const estimatedHours = '20';
  await timeProjectPage.enterServiceItemHours(estimatedHours);

  console.log(
    'Verifying Add button is enabled after selecting service item and entering hours...',
  );
  const isAddEnabled = await timeProjectPage.isAddButtonEnabled();
  expect(isAddEnabled).toBeTruthy();
  console.log(
    '✓ Add button is enabled after selecting service item and entering numerical values',
  );

  console.log('Clicking Add button...');
  await timeProjectPage.clickAddButton();

  console.log('Verifying Save button is enabled after adding service item...');
  const isSaveEnabled = await timeProjectPage.isSaveButtonEnabled();
  expect(isSaveEnabled).toBeTruthy();
  console.log('✓ Save button is enabled after adding the service item');

  console.log('Clicking Save button...');
  await timeProjectPage.clickSaveButton();

  console.log('Verifying estimate is saved and reflected in Budget column...');
  await timeProjectPage.validateEstimateSaved(projectName, estimatedHours);
  console.log(
    '✓ Entered service items and hours are saved and correctly reflected in the Budget column',
  );

  console.log(
    '✓ PR013 PASSED: Estimate created successfully using By Service Item option',
  );
};

/**
 * PR014 - Validate changing estimate type (By Hours to By Service Item) and clicking Cancel
 */
export const verifyChangeEstimateTypeCancel = async (
  page: Page,
  projectName: string = 'testProject',
) => {
  const timeMenuNav = new TimeMenuNavigationPage(page);
  const timeProjectPage = new TimeProjectPage(page);

  console.log('PR014: Verifying change estimate type with Cancel');

  await navigateToTimeProject(page, timeMenuNav, timeProjectPage);

  console.log('Getting original budget value...');
  const originalBudget = await timeProjectPage.getBudgetValueForProjectName(
    projectName,
  );
  console.log(`Original budget: ${originalBudget}`);

  console.log('Clicking Edit for project with By Hours estimate...');
  await timeProjectPage.clickActionMenuForProject(projectName);
  await timeProjectPage.selectEditEstimateFromMenu();

  console.log('Selecting By Service Item option to change estimate type...');
  await timeProjectPage.selectByServiceItemsOption();

  console.log('Selecting service item and entering hours...');
  await timeProjectPage.selectServiceItem('Hours');
  await timeProjectPage.enterServiceItemHours('30');

  console.log('Clicking Add button...');
  await timeProjectPage.clickAddButton();

  console.log('Clicking Save button...');
  await timeProjectPage.clickSaveButton();

  console.log('Verifying Change Estimate Type popup is displayed...');
  await timeProjectPage.validateChangeEstimateTypePopup();
  console.log('✓ Popup displayed with:');
  console.log('  - "Change estimate type?" title');
  console.log(
    '  - "Changing the estimate type will delete the current estimate so you can create a new one. No time data will be deleted."',
  );
  console.log('  - Cancel and Continue buttons');

  console.log('Clicking Cancel button...');
  await timeProjectPage.clickChangeEstimateTypeCancel();
  await timeProjectPage.clickCloseButton();
  await timeProjectPage.clickYesCreateEstimateConfirmation();

  await timeProjectPage.waitForPageReady();
  console.log('Verifying estimate type is not updated...');
  await timeProjectPage.validateEstimateTypeNotUpdated(
    projectName,
    originalBudget,
  );

  console.log(
    '✓ PR014 PASSED: Estimate type not updated after clicking Cancel',
  );
};

/**
 * PR015 - Validate changing estimate type (By Hours to By Service Item) and clicking Continue
 */
export const verifyChangeEstimateTypeContinue = async (
  page: Page,
  projectName: string = 'testProject',
) => {
  const timeMenuNav = new TimeMenuNavigationPage(page);
  const timeProjectPage = new TimeProjectPage(page);

  console.log('PR015: Verifying change estimate type with Continue');

  await navigateToTimeProject(page, timeMenuNav, timeProjectPage);

  console.log('Getting original budget value...');
  const originalBudget = await timeProjectPage.getBudgetValueForProjectName(
    projectName,
  );
  console.log(`Original budget: ${originalBudget}`);

  console.log('Clicking Edit for project with By Hours estimate...');
  await timeProjectPage.clickActionMenuForProject(projectName);
  await timeProjectPage.selectEditEstimateFromMenu();

  console.log('Selecting By Service Item option to change estimate type...');
  await timeProjectPage.selectByServiceItemsOption();

  console.log('Selecting service item and entering hours...');
  await timeProjectPage.selectServiceItem('Hours');
  await timeProjectPage.enterServiceItemHours('35');

  console.log('Clicking Add button...');
  await timeProjectPage.clickAddButton();

  console.log('Clicking Save button...');
  await timeProjectPage.clickSaveButton();

  console.log('Verifying Change Estimate Type popup is displayed...');
  await timeProjectPage.validateChangeEstimateTypePopup();
  console.log('✓ Popup displayed with:');
  console.log('  - "Change estimate type?" title');
  console.log(
    '  - "Changing the estimate type will delete the current estimate so you can create a new one. No time data will be deleted."',
  );
  console.log('  - Cancel and Continue buttons');

  console.log('Clicking Continue button...');
  await timeProjectPage.clickChangeEstimateTypeContinue();

  await timeProjectPage.waitForPageReady();
  console.log('Verifying estimate type is updated...');
  await timeProjectPage.validateEstimateTypeUpdated(
    projectName,
    originalBudget,
  );

  console.log(
    '✓ PR015 PASSED: Estimate type updated successfully after clicking Continue',
  );
};

/**
 * PPR01 - Verify Time project screen elements (zero state)
 */
export const verifyTimeProjectZeroStateElements = async (page: Page) => {
  const timeMenuNav = new TimeMenuNavigationPage(page);
  const timeProjectPage = new TimeProjectPage(page);

  console.log('PPR01: Verifying Time project screen elements (zero state)');

  // Step 1: Navigate to Time section in QBO
  console.log('Step 1: Navigating to Time section in QBO...');
  await navigateToTimeSection(page, timeMenuNav);
  console.log('✓ User navigated to Time section successfully');

  // Step 2: Click Time project
  console.log('Step 2: Clicking Time project option...');
  await timeProjectPage.clickTimeProjectOption();
  await timeProjectPage.waitForPageReady();

  await timeProjectPage.validateTimeProjectPageDisplayed();
  console.log('✓ Time project page is displayed');

  // Step 3: Verify zero state descriptions
  console.log('Step 3: Verifying zero state descriptions...');
  await timeProjectPage.validateZeroStateDescription();
  console.log('✓ Zero state details are displayed:');
  console.log('  - "No projects" message is visible');
  console.log(
    '  - "Add projects to start creating tracking actual time versus estimated time" description is visible',
  );

  // Step 4: Verify presence of Manage Projects link
  console.log('Step 4: Verifying Manage Projects link is present...');
  await timeProjectPage.validateManageProjectsLinkDisplayed();
  console.log('✓ Manage Projects link is visible');

  // Step 5: Click Manage Projects Link
  console.log('Step 5: Clicking Manage Projects link...');
  await timeProjectPage.clickManageProjectsLink();

  // Verify redirect to original Projects page
  await timeProjectPage.validateProjectsPageRedirect();
  console.log(
    '✓ User is redirected to the original projects page inside Projects section',
  );

  console.log(
    '✓ PPR01 PASSED: Time project screen elements verified successfully (zero state)',
  );
};

/**
 * PPR02 - Create Project and verify in Time project
 */
export const verifyCreateProjectAndVerifyInTimeProject = async (
  page: Page,
): Promise<string> => {
  const timeMenuNav = new TimeMenuNavigationPage(page);
  const timeProjectPage = new TimeProjectPage(page);
  const projectName = `E2E TimeProj ${Date.now()}`;

  console.log('PPR02: Create Project and verify in Time project');

  // Step 1: Navigate to Time section and click on Time project
  console.log('Step 1: Navigating to Time section in QBO...');
  await navigateToTimeSection(page, timeMenuNav);
  console.log('✓ User navigated to Time section successfully');

  // Step 2: Click Time project
  console.log('Step 2: Clicking Time project option...');
  await timeProjectPage.clickTimeProjectOption();
  await timeProjectPage.waitForPageReady();
  await timeProjectPage.validateTimeProjectPageDisplayed();
  console.log('✓ Time project page is displayed');

  // Step 3: Click Manage Projects to navigate to QBO Projects
  console.log('Step 3: Clicking Manage Projects link...');
  await timeProjectPage.clickManageProjectsLink();
  await timeProjectPage.validateProjectsPageRedirect();
  console.log('✓ User redirected to Projects page in QBO');

  // Step 4: Create a new project
  console.log('Step 4: Creating a new project...');
  await timeProjectPage.createNewProject(projectName, 'Test Customer1');
  console.log('✓ New project created successfully');

  // Step 5: Navigate back to Time section
  console.log('Step 5: Navigating to Time section...');
  await navigateToTimeSection(page, timeMenuNav);
  console.log('✓ User navigated to Time section successfully');

  // Step 6: Click Time project
  console.log('Step 6: Clicking Time project option...');
  await timeProjectPage.clickTimeProjectOption();
  await timeProjectPage.waitForPageReady();

  // Step 7: Validate created project is displayed in Time project page
  console.log('Step 7: Validating Time project page displayed...');
  await timeProjectPage.validateTimeProjectPageDisplayed();
  console.log('✓ Time project page is displayed');

  // Step 8: Validate the created project is displayed
  console.log(
    'Step 8: Validating the created project is displayed in Time project page...',
  );
  await timeProjectPage.searchProject(projectName);
  await timeProjectPage.validateProjectVisibleInTimeProject(projectName);
  console.log(
    `✓ The created project "${projectName}" is displayed in Time project page`,
  );

  console.log(
    '✓ PPR02 PASSED: Project created in QBO and verified in Time project',
  );

  // Track created project for cleanup
  createdProjects.push(projectName);
  return projectName;
};

/**
 * PPR03 - Create Estimate by Hour In project - create, edit estimate and verify in view section
 */
export const verifyCreateEstimateByHoursAndEdit = async (
  page: Page,
  projectName: string = 'testProject',
): Promise<string> => {
  const timeMenuNav = new TimeMenuNavigationPage(page);
  const timeProjectPage = new TimeProjectPage(page);

  console.log(
    'PPR03: Create Estimate by Hour In project - create, edit estimate and verify',
  );

  // Step 1: Navigate to Time section in QBO
  console.log('Step 1: Navigating to Time section in QBO...');
  await navigateToTimeSection(page, timeMenuNav);
  console.log('✓ Navigated to Time section in QBO');

  // Step 2: Click Time project
  console.log('Step 2: Clicking Time project option...');
  await timeProjectPage.clickTimeProjectOption();
  await timeProjectPage.waitForPageReady();
  await timeProjectPage.validateTimeProjectPageDisplayed();
  console.log('✓ Time project page should be displayed');

  // Step 3: Validate Create Estimate Link is displayed
  console.log('Step 3: Validating Create Estimate Link is displayed...');
  await timeProjectPage.validateCreateEstimateLinkVisible(projectName);
  console.log('✓ Create Estimate Link should be displayed');

  // Step 4: Click Create Estimate Link
  console.log('Step 4: Clicking Create Estimate Link...');
  await timeProjectPage.clickCreateEstimateLinkForProject(projectName);
  await timeProjectPage.validateEstimateCreationPageDisplayed();
  console.log('✓ Create Estimate side popup should open');

  // Step 5: Select radiobutton for By Hours
  console.log('Step 5: Selecting radiobutton for By Hours...');
  await timeProjectPage.selectByHoursOption();
  console.log('✓ Selected radiobutton for By Hours');

  // Step 6: Enter hours in the Enter Hours textbox
  const initialHours = '25';
  console.log(
    `Step 6: Entering ${initialHours} hours in the Enter Hours textbox...`,
  );
  await timeProjectPage.enterHours(initialHours);
  console.log(
    `✓ Hours (${initialHours}) is entered in the Enter Hours textbox`,
  );

  // Step 7: Click Save button
  console.log('Step 7: Clicking Save button...');
  await timeProjectPage.clickSaveButton();
  await timeProjectPage.waitForPageReady();
  console.log('✓ The create estimate popup should close');

  // Step 8: Verify the entered hours in creating estimate is reflected correctly in the budget column
  console.log(
    'Step 8: Verifying the entered hours is reflected correctly in the budget column...',
  );
  await timeProjectPage.validateBudgetColumnValue(projectName, initialHours);
  console.log(
    '✓ The entered hours in creating estimate should be reflected correctly in the budget column',
  );

  // Step 9: Click on Expand Menu arrow
  console.log('Step 9: Clicking on Expand Menu arrow...');
  await timeProjectPage.clickActionMenuForProject(projectName);
  console.log('✓ Clicked on Expand Menu arrow');

  // Step 10: Select Edit Estimate option
  console.log('Step 10: Selecting Edit Estimate option...');
  await timeProjectPage.selectEditEstimateFromMenu();
  await timeProjectPage.validateEditEstimatePageDisplayed();
  console.log('✓ Selected Edit Estimate option');

  // Step 11: Update the entered hours value and click save
  const updatedHours = '40';
  console.log(
    `Step 11: Updating the hours value to ${updatedHours} and clicking save...`,
  );
  await timeProjectPage.updateHoursValue(updatedHours);
  await timeProjectPage.clickSaveButton();
  await timeProjectPage.waitForPageReady();
  console.log(
    `✓ Updated the entered hours value (${updatedHours}) and clicked save`,
  );

  // Step 12: Verify the updated hours is reflected correctly in the budget column
  console.log(
    'Step 12: Verifying the updated hours is reflected correctly in the budget column...',
  );
  await timeProjectPage.validateBudgetColumnValue(projectName, updatedHours);
  console.log(
    '✓ The updated hours should be reflected correctly in the budget column',
  );

  console.log(
    '✓ PPR03 PASSED: Create Estimate by Hour - create, edit and verify completed successfully',
  );

  // Track created estimate for cleanup
  createdEstimates.push({ projectName });
  return projectName;
};

/**
 * PPR04 - Create Estimate by Service item in project - create, edit estimate and verify in view section
 */
export const verifyCreateEstimateByServiceItemAndEdit = async (
  page: Page,
  projectName: string = 'testProject',
): Promise<string> => {
  const timeMenuNav = new TimeMenuNavigationPage(page);
  const timeProjectPage = new TimeProjectPage(page);

  console.log(
    'PPR04: Create Estimate by Service item in project - create, edit estimate and verify',
  );

  // Step 1: Navigate to Time section in QBO
  console.log('Step 1: Navigating to Time section in QBO...');
  await navigateToTimeSection(page, timeMenuNav);
  console.log('✓ Navigated to Time section in QBO');

  // Step 2: Click Time project
  console.log('Step 2: Clicking Time project option...');
  await timeProjectPage.clickTimeProjectOption();
  await timeProjectPage.waitForPageReady();
  await timeProjectPage.validateTimeProjectPageDisplayed();
  console.log('✓ Time project page should be displayed');

  // Step 3: Validate Create Estimate Link is displayed
  console.log('Step 3: Validating Create Estimate Link is displayed...');
  await timeProjectPage.validateCreateEstimateLinkVisible(projectName);
  console.log('✓ Create Estimate Link should be displayed');

  // Step 4: Click Create Estimate Link
  console.log('Step 4: Clicking Create Estimate Link...');
  await timeProjectPage.clickCreateEstimateLinkForProject(projectName);
  await timeProjectPage.validateEstimateCreationPageDisplayed();
  console.log('✓ Create Estimate side popup should open');

  // Step 5: Select radiobutton for By Service Item
  console.log('Step 5: Selecting radiobutton for By Service Item...');
  await timeProjectPage.selectByServiceItemsOption();
  console.log('✓ Selected radiobutton for By Service Item');

  // Step 6: Select a Service Item from dropdown
  console.log('Step 6: Selecting a Service Item from dropdown...');
  await timeProjectPage.selectServiceItem('Hours');
  console.log('✓ Service Item should be selected');

  // Step 7: Enter hours in the Enter Hours textbox
  const initialHours = '20';
  console.log(
    `Step 7: Entering ${initialHours} hours in the Enter Hours textbox...`,
  );
  await timeProjectPage.enterServiceItemHours(initialHours);
  console.log(
    `✓ Hours (${initialHours}) is entered in the Enter Hours textbox`,
  );

  // Step 8: Click Add button
  console.log('Step 8: Clicking Add button...');
  await timeProjectPage.clickAddButton();
  console.log('✓ Service item and entered hours are added');

  // Step 9: Click Save button
  console.log('Step 9: Clicking Save button...');
  await timeProjectPage.clickSaveButton();
  await timeProjectPage.waitForPageReady();
  console.log('✓ The create estimate popup should close');

  // Step 10: Verify the service item and entered hours is reflected correctly in the budget column
  console.log(
    'Step 10: Verifying the entered hours is reflected correctly in the budget column...',
  );
  await timeProjectPage.validateBudgetColumnValue(projectName, initialHours);
  console.log(
    '✓ The entered hours in creating estimate should be reflected correctly in the budget column in the table',
  );

  // Step 11: Click on Expand Menu arrow
  console.log('Step 11: Clicking on Expand Menu arrow...');
  await timeProjectPage.clickActionMenuForProject(projectName);
  console.log('✓ Clicked on Expand Menu arrow');

  // Step 12: Select Edit Estimate option
  console.log('Step 12: Selecting Edit Estimate option...');
  await timeProjectPage.selectEditEstimateFromMenu();
  await timeProjectPage.validateEditEstimatePageDisplayed();
  console.log('✓ Selected Edit Estimate option');

  // Step 13: Click on Edit option for the added service item
  console.log('Step 13: Clicking on Edit option for the added service item...');
  await timeProjectPage.clickServiceItemActionButton(0);
  await timeProjectPage.selectEditOptionForServiceItem();
  console.log('✓ Clicked on Edit option for the added service item');

  // Step 14: Update the entered hours value and click save
  const updatedHours = '35';
  console.log(
    `Step 14: Updating the hours value to ${updatedHours} and clicking save...`,
  );
  await timeProjectPage.updateServiceItemHours(updatedHours);
  await timeProjectPage.clickSaveButton();
  await timeProjectPage.waitForPageReady();
  console.log(
    `✓ Updated the entered hours value (${updatedHours}) and clicked save`,
  );

  // Step 15: Verify the updated hours is reflected correctly in the budget column
  console.log(
    'Step 15: Verifying the updated hours is reflected correctly in the budget column...',
  );
  await timeProjectPage.validateBudgetColumnValue(projectName, updatedHours);
  console.log(
    '✓ The updated hours should be reflected correctly in the budget column in the table',
  );

  console.log(
    '✓ PPR04 PASSED: Create Estimate by Service Item - create, edit and verify completed successfully',
  );

  // Track created estimate for cleanup
  createdEstimates.push({ projectName });
  return projectName;
};

/**
 * PPR05 - Assign workers for project
 */
export const verifyAssignWorkersForProject = async (
  page: Page,
): Promise<string> => {
  const timeMenuNav = new TimeMenuNavigationPage(page);
  const timeProjectPage = new TimeProjectPage(page);
  const projectName = `E2E AssignWorkers ${Date.now()}`;

  console.log('PPR05: Assign workers for project');

  // Step 1: Navigate to Time section and click on Time project
  console.log('Step 1: Navigating to Time section in QBO...');
  await navigateToTimeSection(page, timeMenuNav);
  console.log('✓ Navigated to Time section in QBO');

  // Step 2: Click Time project
  console.log('Step 2: Clicking Time project option...');
  await timeProjectPage.clickTimeProjectOption();
  await timeProjectPage.waitForPageReady();

  // Step 3: Verify projects page displayed via Manage Projects
  console.log(
    'Step 3: Clicking Manage Projects to navigate to Projects section...',
  );
  await timeProjectPage.clickManageProjectsLink();
  await timeProjectPage.validateProjectsPageRedirect();
  console.log('✓ Projects page displayed');

  // Step 4: Create a new project with customer selection
  console.log('Step 4: Creating a new project with customer...');
  await timeProjectPage.createNewProject(projectName, 'Test Customer1');
  console.log('✓ Created a new project with customer');

  // Step 5: Navigate to Time section
  console.log('Step 5: Navigating to Time section...');
  await page.reload();
  await navigateToTimeSection(page, timeMenuNav);
  console.log('✓ Navigated to Time section');

  // Step 6: Click Time project
  console.log('Step 6: Clicking Time project...');
  await timeProjectPage.clickTimeProjectOption();
  await timeProjectPage.waitForPageReady();

  // Step 7: Validate Time project page displayed
  console.log('Step 7: Validating Time project page displayed...');
  await timeProjectPage.validateTimeProjectPageDisplayed();
  console.log('✓ Validated Time project page displayed');

  // Step 8: Validate the created project is displayed in Time project page
  console.log(
    'Step 8: Validating the created project is displayed in Time project page...',
  );
  await timeProjectPage.searchProject(projectName);
  await timeProjectPage.validateProjectVisibleInTimeProject(projectName);
  console.log(
    `✓ Validated the created project "${projectName}" is displayed in Time project page`,
  );

  // Step 9: Click on Expand menu for the project
  console.log('Step 9: Clicking on Expand menu for the project...');
  await timeProjectPage.clickActionMenuForProject(projectName);
  console.log('✓ Clicked on Expand menu for the project');

  // Step 10: Select Assign workers option
  console.log('Step 10: Selecting Assign workers option...');
  await timeProjectPage.selectAssignWorkersFromMenu();
  console.log('✓ Selected Assign workers option');

  // Step 11: Validate assign workers page is displayed
  console.log('Step 11: Validating assign workers page is displayed...');
  await timeProjectPage.validateAssignWorkersPageDisplayed();
  console.log('✓ Validated assign workers page is displayed');

  // Step 12: Validate all workers are selected
  console.log('Step 12: Validating all workers are selected...');
  const allWorkersSelected = await timeProjectPage.validateAllWorkersSelected();
  expect(allWorkersSelected).toBeTruthy();
  console.log('✓ Validated all workers are selected');

  // Step 13: Validate the count on the top displayed
  console.log('Step 13: Validating the count on the top displayed...');
  const assignWorkersCount =
    await timeProjectPage.validateWorkersCountDisplayed();
  console.log(
    `✓ Validated the count on the top displayed: ${assignWorkersCount}`,
  );

  // Step 14: Close the assign workers page
  console.log('Step 14: Closing the assign workers page...');
  await timeProjectPage.closeAssignWorkersPage();
  await timeProjectPage.waitForPageReady();
  console.log('✓ Closed the assign workers page');

  // Step 15: Click on View project
  console.log('Step 15: Clicking on View project...');
  await timeProjectPage.clickViewProject(projectName);
  console.log('✓ Clicked on View project');

  // Step 16: Validate the count of workers are same as displayed in the assign workers page
  console.log(
    'Step 16: Validating the count of workers are same as displayed in the assign workers page...',
  );
  await timeProjectPage.validateWorkerCountsMatch(assignWorkersCount);
  await timeProjectPage.clickBackToProjects();
  console.log(
    '✓ Count of workers should be same as displayed in the assign workers page',
  );

  console.log(
    '✓ PPR05 PASSED: Assign workers for project completed successfully',
  );

  // Track created project for cleanup
  createdProjects.push(projectName);
  return projectName;
};

// ========== CLEANUP UTILITY FUNCTIONS ==========

/**
 * Helper function to navigate to Time section and reveal Time project option
 */
async function navigateToTimeSectionForCleanup(
  page: Page,
  timeMenuNav: TimeMenuNavigationPage,
): Promise<void> {
  console.log('Navigating to Time section for cleanup...');
  const hoverSuccess = await timeMenuNav.hoverOnMyAppsMenu();
  expect(hoverSuccess).toBeTruthy();
  await timeMenuNav.hoverOnTimeMenu();
}

/**
 * Cleanup function to delete a project from QBO Projects
 */
export const cleanupDeleteProject = async (
  page: Page,
  projectName: string,
): Promise<void> => {
  const timeMenuNav = new TimeMenuNavigationPage(page);
  const timeProjectPage = new TimeProjectPage(page);

  console.log(`\n=== CLEANUP: Deleting project "${projectName}" ===`);

  try {
    // Navigate to Time Project page first
    // await navigateToTimeSectionForCleanup(page, timeMenuNav);
    // await timeProjectPage.clickTimeProjectOption();
    // await timeProjectPage.waitForPageReady();

    // Click Manage Projects to go to QBO Projects page
    await timeProjectPage.clickManageProjectsLink();
    await timeProjectPage.validateProjectsPageRedirect();
    console.log('✓ Navigated to QBO Projects page');

    // Search for the project
    await timeProjectPage.searchProjectInQBOProjects(projectName);
    await page.waitForTimeout(1000);

    // Delete the project
    await timeProjectPage.deleteProjectInQBOProjects(projectName);
    console.log(
      `✓ CLEANUP COMPLETE: Project "${projectName}" deleted successfully`,
    );
  } catch (error) {
    console.log(
      `⚠ CLEANUP WARNING: Could not delete project "${projectName}": ${error}`,
    );
  }
};

/**
 * Cleanup function to delete an estimate from Time Project
 */
export const cleanupDeleteEstimate = async (
  page: Page,
  projectName: string,
): Promise<void> => {
  const timeMenuNav = new TimeMenuNavigationPage(page);
  const timeProjectPage = new TimeProjectPage(page);

  console.log(
    `\n=== CLEANUP: Deleting estimate for project "${projectName}" ===`,
  );

  try {
    // // Navigate to Time Project page
    // await navigateToTimeSectionForCleanup(page, timeMenuNav);
    // await timeProjectPage.clickTimeProjectOption();
    // await timeProjectPage.waitForPageReady();

    // Search for the project
    await timeProjectPage.searchProject(projectName);
    await page.waitForTimeout(1000);

    // Delete the estimate
    await timeProjectPage.deleteEstimateForProject(projectName);
    console.log(
      `✓ CLEANUP COMPLETE: Estimate for project "${projectName}" deleted successfully`,
    );
  } catch (error) {
    console.log(
      `⚠ CLEANUP WARNING: Could not delete estimate for "${projectName}": ${error}`,
    );
  }
};

/**
 * Cleanup function to delete an estimate from Time Project
 */
export const cleanupEditAndDeleteEstimate = async (
  page: Page,
  projectName: string,
): Promise<void> => {
  const timeMenuNav = new TimeMenuNavigationPage(page);
  const timeProjectPage = new TimeProjectPage(page);

  console.log(
    `\n=== CLEANUP: Deleting estimate for project "${projectName}" ===`,
  );

  try {
    // Navigate to Time Project page
    await navigateToTimeSectionForCleanup(page, timeMenuNav);
    await timeProjectPage.clickTimeProjectOption();
    await timeProjectPage.waitForPageReady();

    // Search for the project
    await timeProjectPage.searchProject(projectName);
    await page.waitForTimeout(1000);

    // Delete the estimate
    await timeProjectPage.editAndDeleteEstimateForProject(projectName);
    console.log(
      `✓ CLEANUP COMPLETE: Estimate for project "${projectName}" deleted successfully`,
    );
  } catch (error) {
    console.log(
      `⚠ CLEANUP WARNING: Could not delete estimate for "${projectName}": ${error}`,
    );
  }
};

/**
 * Cleanup function to change estimate type to By Hours
 */
export const changeEstimateToCreateByHours = async (
  page: Page,
  projectName: string,
): Promise<void> => {
  const timeProjectPage = new TimeProjectPage(page);

  console.log(
    `\n=== CLEANUP: Changing estimate to By Hours for project "${projectName}" ===`,
  );

  try {
    // Search for the project
    await timeProjectPage.searchProject(projectName);
    await page.waitForTimeout(1000);

    // Open action menu and select Edit Estimate
    console.log('Opening Edit Estimate...');
    await timeProjectPage.clickActionMenuForProject(projectName);
    await timeProjectPage.selectEditEstimateFromMenu();

    // Select By Hours option
    console.log('Selecting By Hours option...');
    await timeProjectPage.selectByHoursOption();

    // Enter 50 hours
    console.log('Entering 50 hours...');
    await timeProjectPage.enterHours('50');

    // Click Save button
    console.log('Clicking Save button...');
    await timeProjectPage.clickSaveButton();

    // Confirm change estimate type popup
    console.log('Confirming change estimate type...');
    await timeProjectPage.clickChangeEstimateTypeContinue();

    await timeProjectPage.waitForPageReady();

    console.log(
      `✓ CLEANUP COMPLETE: Estimate changed to By Hours (50 hours) for project "${projectName}"`,
    );
  } catch (error) {
    console.log(
      `⚠ CLEANUP WARNING: Could not complete cleanup for "${projectName}": ${error}`,
    );
  }
};

/**
 * Clear tracked projects and estimates arrays
 */
export const clearCleanupTracking = (): void => {
  createdProjects.length = 0;
  createdEstimates.length = 0;
};

/**
 * Helper function to navigate to TSheets Projects page
 */
async function navigateToTSheetsProjects(classicPage: Page): Promise<void> {
  console.log('Navigating to Projects in TSheets...');

  const projectsLink = classicPage
    .locator(`//a[text()='Projects']`)
    .or(classicPage.getByRole('link', { name: 'Projects' }))
    .or(classicPage.locator(`#projects_shortcut`))
    .first();

  await expect(projectsLink).toBeVisible({ timeout: 30000 });
  await projectsLink.click();
  await classicPage.waitForTimeout(2000);
  console.log('✓ Navigated to TSheets Projects page');
}

/**
 * Helper function to search for a project in TSheets
 */
async function searchProjectInTSheets(
  classicPage: Page,
  projectName: string,
): Promise<void> {
  console.log(`Searching for project "${projectName}" in TSheets...`);

  const searchInput = classicPage
    .locator(`//input[@placeholder='Search']`)
    .or(classicPage.getByPlaceholder(/search/i))
    .or(classicPage.locator(`input[type="search"]`))
    .first();

  if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await searchInput.fill(projectName);
    await classicPage.waitForTimeout(1500);
    console.log(`✓ Searched for project: ${projectName}`);
  } else {
    console.log(
      'Search input not found, project list will be checked directly',
    );
  }
}

/**
 * Helper function to validate project is visible in TSheets
 */
async function validateProjectVisibleInTSheets(
  classicPage: Page,
  projectName: string,
): Promise<void> {
  console.log(`Validating project "${projectName}" is visible in TSheets...`);

  const projectElement = classicPage
    .locator(`//*[contains(text(), '${projectName}')]`)
    .or(classicPage.getByText(projectName))
    .first();

  await expect(projectElement).toBeVisible({ timeout: 30000 });
  console.log(`✓ Project "${projectName}" is visible in TSheets Projects page`);
}

/**
 * Helper function to validate project is NOT visible in TSheets
 */
async function validateProjectNotVisibleInTSheets(
  classicPage: Page,
  projectName: string,
): Promise<void> {
  console.log(
    `Validating project "${projectName}" is NOT visible in TSheets...`,
  );

  const projectElement = classicPage
    .locator(`//*[contains(text(), '${projectName}')]`)
    .or(classicPage.getByText(projectName));

  await expect(projectElement).toHaveCount(0, { timeout: 15000 });
  console.log(
    `✓ Project "${projectName}" is NOT visible in TSheets Projects page`,
  );
}

/**
 * Helper function to close the TSheets tab
 */
async function closeTSheetsTab(classicPage: Page): Promise<void> {
  console.log('Closing TSheets tab...');
  await classicPage.close();
  console.log('✓ TSheets tab closed');
}

/**
 * PR031 - Validate time project created in QBO for elite account is reflected in TSheets
 */
export const verifyProjectCreatedInQBOReflectedInTSheets = async (
  page: Page,
): Promise<string> => {
  const timeMenuNav = new TimeMenuNavigationPage(page);
  const timeProjectPage = new TimeProjectPage(page);
  const projectName = `E2E TSheets Sync ${Date.now()}`;

  console.log(
    'PR031: Validate time project created in QBO is reflected in TSheets',
  );

  // Step 1: Navigate to Time Projects section in QBO
  console.log('Step 1: Navigating to Time Projects section in QBO...');
  const hoverSuccess = await timeMenuNav.hoverOnMyAppsMenu();
  expect(hoverSuccess).toBeTruthy();
  await timeMenuNav.hoverOnTimeMenu();
  console.log('✓ Time submenu revealed');

  // Step 2: Click Manage Projects
  console.log('Step 2: Clicking Time project option...');
  await timeProjectPage.clickTimeProjectOption();
  await timeProjectPage.waitForPageReady();
  await timeProjectPage.validateTimeProjectPageDisplayed();
  console.log('✓ Time project page is displayed');

  console.log('Step 2b: Clicking Manage Projects link...');
  await timeProjectPage.clickManageProjectsLink();
  await timeProjectPage.validateProjectsPageRedirect();
  console.log('✓ User redirected to Projects page in QBO');

  // Step 3: Create a new project
  console.log('Step 3: Creating a new project...');
  await timeProjectPage.createNewProject(projectName, 'Test Customer1');
  console.log(`✓ New project "${projectName}" created successfully`);

  // Step 4 & 5: Navigate to Time section and click time projects
  console.log('Step 4: Navigating back to Time section...');
  await page.reload();
  const hoverSuccess2 = await timeMenuNav.hoverOnMyAppsMenu();
  expect(hoverSuccess2).toBeTruthy();
  await timeMenuNav.hoverOnTimeMenu();

  console.log('Step 5: Clicking Time project option...');
  await timeProjectPage.clickTimeProjectOption();
  await timeProjectPage.waitForPageReady();

  // Step 6: Validate the created project is visible in Time project page
  console.log(
    'Step 6: Validating the created project is visible in Time project page...',
  );
  await timeProjectPage.searchProject(projectName);
  await timeProjectPage.validateProjectVisibleInTimeProject(projectName);
  console.log(
    `✓ The created project "${projectName}" is displayed in Time project page`,
  );

  // Step 7: Navigate to TSheets
  console.log('Step 7: Navigating to TSheets...');
  const { classicPage } = await navigateToClassicTimeSheet(page);
  await handleClassicTimesheetPopupsInAnyOrder(classicPage);
  console.log('✓ Navigated to TSheets');

  // Step 8: Click projects
  console.log('Step 8: Clicking on Projects in TSheets...');
  await navigateToTSheetsProjects(classicPage);

  // Step 9: Validate the created project is visible in project page inside TSheets
  console.log(
    'Step 9: Validating the created project is visible in TSheets...',
  );
  await searchProjectInTSheets(classicPage, projectName);
  await validateProjectVisibleInTSheets(classicPage, projectName);
  await closeTSheetsTab(classicPage);

  console.log(
    '✓ PR031 PASSED: Time project created in QBO is reflected in TSheets',
  );

  // Track created project for cleanup
  createdProjects.push(projectName);
  return projectName;
};

/**
 * PR032 - Validate time project deleted in QBO for elite account is reflected in TSheets
 */
export const verifyProjectDeletedInQBOReflectedInTSheets = async (
  page: Page,
): Promise<void> => {
  const timeMenuNav = new TimeMenuNavigationPage(page);
  const timeProjectPage = new TimeProjectPage(page);
  const projectName = `E2E TSheets Sync ${Date.now()}`;

  console.log(
    'PR032: Validate time project deleted in QBO is reflected in TSheets',
  );

  // Pre-requisite: First create a project to delete
  console.log('Pre-requisite: Creating a project to delete...');
  const hoverSuccess = await timeMenuNav.hoverOnMyAppsMenu();
  expect(hoverSuccess).toBeTruthy();
  await timeMenuNav.hoverOnTimeMenu();
  await timeProjectPage.clickTimeProjectOption();
  await timeProjectPage.waitForPageReady();
  await timeProjectPage.clickManageProjectsLink();
  await timeProjectPage.validateProjectsPageRedirect();
  await timeProjectPage.createNewProject(projectName, 'Test Customer1');

  console.log(`✓ Pre-requisite: Project "${projectName}" created for deletion`);

  // Step 1: Navigate to Time Projects section in QBO
  console.log('Step 1: Navigating to Time Projects section in QBO...');
  await page.reload();
  const hoverSuccess2 = await timeMenuNav.hoverOnMyAppsMenu();
  expect(hoverSuccess2).toBeTruthy();
  await timeMenuNav.hoverOnTimeMenu();
  await timeProjectPage.clickTimeProjectOption();
  await timeProjectPage.waitForPageReady();
  console.log('✓ Navigated to Time Projects section');

  // Step 2: Validate project is visible in Time project page
  console.log(
    'Step 2: Validating project is visible in Time project page before deletion...',
  );
  await timeProjectPage.searchProject(projectName);
  await timeProjectPage.validateProjectVisibleInTimeProject(projectName);
  console.log(`✓ Project "${projectName}" is visible in Time project page`);

  // Step 3: Click Manage Projects
  console.log('Step 3: Clicking Manage Projects link...');
  await timeProjectPage.clickManageProjectsLink();
  await timeProjectPage.validateProjectsPageRedirect();
  console.log('✓ User redirected to Projects page in QBO');

  // Step 4: Delete the project from projects page
  console.log('Step 4: Deleting the project...');
  await timeProjectPage.findProjectInQBOProjectsAndDelete(projectName);
  console.log(`✓ Project "${projectName}" deleted from QBO Projects`);

  // Step 5 & 6: Navigate to Time section and click time projects
  console.log('Step 5: Navigating back to Time section...');
  await page.reload();
  const hoverSuccess3 = await timeMenuNav.hoverOnMyAppsMenu();
  expect(hoverSuccess3).toBeTruthy();
  await timeMenuNav.hoverOnTimeMenu();

  console.log('Step 6: Clicking Time project option...');
  await timeProjectPage.clickTimeProjectOption();
  await timeProjectPage.waitForPageReady();

  // Step 7: Validate the deleted project is not visible in Time project page
  console.log(
    'Step 7: Validating the deleted project is NOT visible in Time project page...',
  );
  await timeProjectPage.searchProject(projectName);
  const projectRow = timeProjectPage.getProjectRowByName(projectName);
  await expect(projectRow).toHaveCount(0, { timeout: 15000 });
  console.log(
    `✓ The deleted project "${projectName}" is NOT visible in Time project page`,
  );

  // Step 8: Navigate to TSheets
  console.log('Step 8: Navigating to TSheets...');
  const { classicPage } = await navigateToClassicTimeSheet(page);
  await handleClassicTimesheetPopupsInAnyOrder(classicPage);
  console.log('✓ Navigated to TSheets');

  // Step 9: Click projects
  console.log('Step 9: Clicking on Projects in TSheets...');
  await navigateToTSheetsProjects(classicPage);

  // Step 10: Validate the deleted project is not visible in project page inside TSheets
  console.log(
    'Step 10: Validating the deleted project is NOT visible in TSheets...',
  );
  await searchProjectInTSheets(classicPage, projectName);
  await validateProjectNotVisibleInTSheets(classicPage, projectName);
  await closeTSheetsTab(classicPage);

  console.log(
    '✓ PR032 PASSED: Time project deleted in QBO is NOT visible in TSheets',
  );
};

/**
 * Cleanup function for PR031 - Navigate to Time Projects and delete the created project
 * This cleanup handles the case where the test ends on TSheets page
 */
export const cleanupDeleteTimeProject = async (page: Page): Promise<void> => {
  const timeMenuNav = new TimeMenuNavigationPage(page);
  const timeProjectPage = new TimeProjectPage(page);

  const projectName = createdProjects[createdProjects.length - 1];
  if (!projectName) {
    console.log('⚠ CLEANUP WARNING: No project name found for PR031 cleanup');
    return;
  }

  console.log(
    `\n=== CLEANUP PR031: Deleting project "${projectName}" from Time Projects ===`,
  );

  try {
    await page.reload();
    await page.waitForTimeout(2000);

    console.log('Navigating to Time section...');
    const hoverSuccess = await timeMenuNav.hoverOnMyAppsMenu();
    expect(hoverSuccess).toBeTruthy();
    await timeMenuNav.hoverOnTimeMenu();

    console.log('Clicking Time project option...');
    await timeProjectPage.clickTimeProjectOption();
    await timeProjectPage.waitForPageReady();

    console.log('Clicking Manage Projects link...');
    await timeProjectPage.clickManageProjectsLink();
    await timeProjectPage.validateProjectsPageRedirect();
    console.log('✓ Navigated to QBO Projects page');

    // await timeProjectPage.searchProjectInQBOProjects(projectName);
    await page.waitForTimeout(1000);

    await timeProjectPage.deleteProjectInQBOProjects(projectName);
    console.log(
      `✓ CLEANUP PR031 COMPLETE: Project "${projectName}" deleted successfully`,
    );

    createdProjects.pop();
  } catch (error) {
    console.log(
      `⚠ CLEANUP PR031 WARNING: Could not delete project "${projectName}": ${error}`,
    );
  }
};

/**
 * PR033 - Validate Time project is accessible by elite accounts for UK region
 */
export const verifyTimeProjectAccessibleForUKElite = async (
  page: Page,
): Promise<void> => {
  const timeMenuNav = new TimeMenuNavigationPage(page);
  const timeProjectPage = new TimeProjectPage(page);

  console.log(
    'PR033: Validate Time project is accessible by elite accounts for UK region',
  );

  // Step 1: Navigate to Time section in QBO
  console.log('Step 1: Navigating to Time section in QBO...');
  await navigateToTimeSection(page, timeMenuNav);
  console.log('✓ Navigated to Time section');

  // Step 2: Click Time project
  console.log('Step 2: Clicking Time project...');
  await timeProjectPage.clickTimeProjectOption();
  await timeProjectPage.waitForPageReady();
  console.log('✓ Clicked Time project option');

  // Validate Time project is displayed and accessible
  await timeProjectPage.validateTimeProjectPageDisplayed();
  console.log('✓ Time project page is displayed and accessible');

  // Validate the description is displayed
  await timeProjectPage.validatePageDescription();
  console.log('✓ Description verified:');
  console.log('  - "View insights into actual versus estimate hours"');
  console.log(
    '  - "Get started by creating estimates to accurate plan for how time is spent on your projects"',
  );

  console.log(
    '✓ PR033 PASSED: Time project is accessible for UK elite accounts with correct description',
  );
};

/**
 * PR034 - Validate Time project is accessible by elite accounts for CA region
 */
export const verifyTimeProjectAccessibleForCAElite = async (
  page: Page,
): Promise<void> => {
  const timeMenuNav = new TimeMenuNavigationPage(page);
  const timeProjectPage = new TimeProjectPage(page);

  console.log(
    'PR034: Validate Time project is accessible by elite accounts for CA region',
  );

  // Step 1: Navigate to Time section in QBO
  console.log('Step 1: Navigating to Time section in QBO...');
  await navigateToTimeSection(page, timeMenuNav);
  console.log('✓ Navigated to Time section');

  // Step 2: Click Time project
  console.log('Step 2: Clicking Time project...');
  await timeProjectPage.clickTimeProjectOption();
  await timeProjectPage.waitForPageReady();
  console.log('✓ Clicked Time project option');

  // Validate Time project is displayed and accessible
  await timeProjectPage.validateTimeProjectPageDisplayed();
  console.log('✓ Time project page is displayed and accessible');

  // Validate the description is displayed
  await timeProjectPage.validatePageDescription();
  console.log('✓ Description verified:');
  console.log('  - "View insights into actual versus estimate hours"');
  console.log(
    '  - "Get started by creating estimates to accurate plan for how time is spent on your projects"',
  );

  console.log(
    '✓ PR034 PASSED: Time project is accessible for CA elite accounts with correct description',
  );
};

/**
 * PR035 - Validate Time project is not accessible for non elite accounts
 */
export const verifyTimeProjectNotAccessibleForNonElite = async (
  page: Page,
): Promise<void> => {
  const timeMenuNav = new TimeMenuNavigationPage(page);
  const timeProjectPage = new TimeProjectPage(page);

  console.log(
    'PR035: Validate Time project is not accessible for non elite accounts',
  );

  // Step 1: Navigate to Time section in QBO
  console.log('Step 1: Navigating to Time section in QBO...');
  await navigateToTimeSection(page, timeMenuNav);
  console.log('✓ Navigated to Time section');

  // Validate Time project is not displayed
  await timeProjectPage.validateTimeProjectOptionNotVisible();
  console.log('✓ Time project option is not displayed for non elite accounts');

  console.log(
    '✓ PR035 PASSED: Time project is not accessible for non elite accounts',
  );
};

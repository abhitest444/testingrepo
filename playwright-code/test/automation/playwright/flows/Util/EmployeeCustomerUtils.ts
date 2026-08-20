import { Page, expect } from '@playwright/test';
import { navigateToSingleTime } from '../../pages/TimeSettingsPage';

/**
 * Interface for employee data
 */
export interface EmployeeData {
  firstName?: string;
  lastName?: string;
}

/**
 * Interface for customer data
 */
export interface CustomerData {
  companyName?: string;
}

/**
 * Interface for the result of creating employee and customer
 */
export interface CreationResult {
  employeeName: string;
  customerName: string;
}

/**
 * Activates QBO Payroll Elite subscription
 * @param page - Playwright Page object
 */
export const qboActivation = async (page: Page) => {
  await page.locator('//button[@data-id="settings"]').click();
  // Step 2: search text (Subscription and billings) and click it
  // Handle both singular/plural variants just in case
  const subscriptionItem = page
    .locator("//span[text()='Subscriptions and billing']")
    .click();
  const parentPage = page;
  const page1Promise = page.waitForEvent('popup');
  await page
    .locator(
      `//div[text()='QuickBooks Payroll']/../parent::div//span[text()='Find out more']/parent::button`,
    )
    .click();
  const page1 = await page1Promise;
  await page1.goto(
    'https://qbo.intuit.com/app/payroll-signup?returnPage=subscription&usecase=bns-card',
  );
  await page1
    .locator(
      `//span[text()='Elite']/../../parent::div/parent::div[contains(@class, 'IpdPriceCard_priceCardItem')]//span[text()='Try it for 30 days']`,
    )
    .click();
  // Switch back to parent
  await parentPage.bringToFront();
  await parentPage.reload();
  // await parentPage.waitForLoadState('load');
  expect(
    parentPage.getByText('QuickBooks Online Payroll Elite').first(),
  ).toBeVisible();
  // Clean up
  await page1.close();
};

export const setupTestData = async (page: Page) => {
  try {
    // Step 1: Navigate to Settings and enable advanced categories
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.locator('#companysettings').click();

    await page.getByRole('button', { name: 'Advanced' }).click();
    // Enable track classes and locations
    await page
      .getByRole('button', {
        name: 'Categories Edit Track classes Off Track locations Off',
      })
      .getByRole('button', { name: 'Edit' })
      .click();
    await page
      .getByTestId('switch-field-advanced_categories_track_classes-input')
      .check();
    await page
      .getByTestId('switch-field-advanced_categories_track_location-input')
      .check();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    expect(
      page.locator(
        `//span[contains(@class, 'ToastMessage-toastMessageText')]/span/span[text()='Settings saved']`,
      ),
    ).toBeVisible();
    await page.waitForTimeout(5000);
    await page.locator(`//span[text()='Done']`).click();
    await expect(page.locator('[data-id=bodyNode]')).toBeVisible();
    await expect(page.locator('.oneIntuitAccountHeaderItem')).toBeVisible();
    await page.reload();

    // await page.getByRole('dialog', { name: 'Account and settings' }).getByRole('button', { name: 'Close', exact: true }).click();
    // reload
    // Step 2: Navigate to Single time activity
    await page.locator(`//span[text()='Create']`).hover();
    await page.getByRole('link', { name: 'Single time activity' }).click();
    // Step 3: Create test employees
    await createTestEmployee(page, 'Test', 'Emp1');
    // Step 4: Create test customers
    await createTestCustomer(page, 'Baking and Beans');
    await createTestCustomer(page, 'Cooking Service');
    // Step 5: Create test classes
    await createTestClass(page, 'Test Class');
    await createTestClass(page, 'New Class');
    // Step 6: Create test locations
    await createTestLocation(page, 'AL');
    await createTestLocation(page, 'ND');
    console.log(
      ':white_check_mark: Complete test environment setup completed successfully',
    );
  } catch (error) {
    console.error(':x: Error during test environment setup:', error);
    throw error;
  }
};

/**
 * Helper function to create a test employee
 */
const createTestEmployee = async (
  page: Page,
  firstName: string,
  lastName: string,
) => {
  try {
    await page
      .locator(
        `//span[text()='Name']/../..//div[contains(@id, 'idsDropdownTypeaheadTextField')]`,
      )
      .click();
    await page.getByRole('option', { name: 'add new item' }).click();
    await page.getByLabel('First name *').click();
    await page.getByLabel('First name *').fill(firstName);
    await page.getByLabel('Last name *').click();
    await page.getByLabel('Last name *').fill(lastName);
    await page
      .getByRole('dialog', { name: 'Employee' })
      .getByRole('button', { name: 'Save' })
      .click();
    console.log(
      `:white_check_mark: Created employee: ${firstName} ${lastName}`,
    );
  } catch (error) {
    console.error(
      `:x: Error creating employee ${firstName} ${lastName}:`,
      error,
    );
    throw error;
  }
};
/**
 * Helper function to create a test customer
 */
const createTestCustomer = async (page: Page, companyName: string) => {
  try {
    await page
      .locator(
        `//span[text()='Customers']/../..//div[contains(@id, 'idsDropdownTypeaheadTextField')]`,
      )
      .click();
    await page.getByRole('option', { name: 'add new item' }).click();
    await page.getByLabel('Company name').click();
    await page.getByLabel('Company name').fill(companyName);
    await page.getByTestId('contact-drawer-save-button').click();
    console.log(`:white_check_mark: Created customer: ${companyName}`);
  } catch (error) {
    console.error(`:x: Error creating customer ${companyName}:`, error);
    throw error;
  }
};
/**
 * Helper function to create a test class
 */
const createTestClass = async (page: Page, className: string) => {
  try {
    await page
      .locator(
        `//span[text()='Class']/../..//div[contains(@id, 'idsDropdownTypeaheadTextField')]`,
      )
      .click();
    await page.getByRole('option', { name: 'add new item' }).click();
    await page.getByLabel('Class name').click();
    await page.getByLabel('Class name').fill(className);
    await page
      .getByRole('dialog', { name: 'New Class' })
      .getByRole('button', { name: 'Save' })
      .click();
    console.log(`:white_check_mark: Created class: ${className}`);
  } catch (error) {
    console.error(`:x: Error creating class ${className}:`, error);
    throw error;
  }
};
/**
 * Helper function to create a test location
 */
const createTestLocation = async (page: Page, locationName: string) => {
  try {
    await page
      .locator(
        `//span[text()='Location']/../..//div[contains(@id, 'idsDropdownTypeaheadTextField')]`,
      )
      .click();
    await page.getByRole('option', { name: 'add new item' }).click();
    await page.getByLabel('Location name').click();
    await page.getByLabel('Location name').fill(locationName);
    await page
      .getByRole('dialog', { name: 'New Location' })
      .getByRole('button', { name: 'Save' })
      .click();
    console.log(`:white_check_mark: Created location: ${locationName}`);
  } catch (error) {
    console.error(`:x: Error creating location ${locationName}:`, error);
    throw error;
  }
};

/**
 * Robust function to create an employee and customer in the time activity page
 * @param page - Playwright page object
 * @param employeeData - Employee data object
 * @param customerData - Customer data object
 * @returns Promise<CreationResult> - Created employee and customer names
 */

export async function createEmployeeAndCustomer(
  page: Page,
  employeeData: EmployeeData = {},
  customerData: CustomerData = {},
): Promise<CreationResult> {
  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Navigate to the time activity page

  // Create Employee
  console.log('Creating employee with data:', employeeData);
  const employeeName = await createEmployee(page, employeeData);
  console.log('Employee created successfully:', employeeName);

  // Create Customer
  console.log('Creating customer with data:', customerData);
  const customerName = await createCustomer(page, customerData);
  console.log('Customer created successfully:', customerName);

  return { employeeName, customerName };
}

/**
 * Creates an employee in the time activity page
 * @param page - Playwright page object
 * @param employeeData - Employee data object
 * @returns Promise<string> - Created employee name
 */
export async function createEmployee(
  page: Page,
  employeeData: EmployeeData = {},
): Promise<string> {
  const firstName = employeeData.firstName || 'Test';
  const lastName =
    employeeData.lastName || `Emp${Math.random().toString(36).substring(2, 8)}`;
  const employeeName = `${firstName} ${lastName}`;

  try {
    await navigateToSingleTime(page);
    // Click on employee dropdown chevron
    await page.locator('#idsDropdownTypeaheadTextField2-chevron').click();

    // Wait for dropdown to appear and select "add new item"
    await page.waitForSelector('[role="option"]', { timeout: 5000 });
    await page.getByRole('option', { name: 'add new item' }).click();

    // Wait for employee dialog to appear
    await page.waitForSelector('[role="dialog"][name="Employee"]', {
      timeout: 10000,
    });

    // Fill employee details
    await page.getByLabel('First name *').click();
    await page.getByLabel('First name *').fill(firstName);

    await page.getByLabel('Last name *').click();
    await page.getByLabel('Last name *').fill(lastName);

    // Save employee
    await page
      .getByRole('dialog', { name: 'Employee' })
      .getByRole('button', { name: 'Save' })
      .click();

    // Wait for dialog to close
    await page.waitForSelector('[role="dialog"][name="Employee"]', {
      state: 'hidden',
      timeout: 30000,
    });

    console.log(`Successfully created employee: ${employeeName}`);
    return employeeName;
  } catch (error) {
    console.error(`Failed to create employee: ${error}`);
    throw new Error(`Employee creation failed: ${error}`);
  }
}

/**
 * Creates a customer in the time activity page
 * @param page - Playwright page object
 * @param customerData - Customer data object
 * @returns Promise<string> - Created customer name
 */
export async function createCustomer(
  page: Page,
  customerData: CustomerData = {},
): Promise<string> {
  const companyName =
    customerData.companyName ||
    `Test Service ${Math.random().toString(36).substring(2, 8)}`;

  try {
    // Click on customer dropdown chevron
    await page.locator('#idsDropdownTypeaheadTextField4-chevron').click();

    // Wait for dropdown to appear and select "add new item"
    await page.waitForSelector('[role="option"]', { timeout: 5000 });
    await page.getByRole('option', { name: 'add new item' }).click();

    // Wait for customer drawer to appear
    await page.waitForSelector('[data-testid="contact-drawer"]', {
      timeout: 10000,
    });

    // Fill customer details
    await page.getByLabel('Company name').click();
    await page.getByLabel('Company name').fill(companyName);

    // Save customer
    await page
      .getByTestId('contact-drawer')
      .getByRole('button', { name: 'Save' })
      .click();

    // Wait for drawer to close
    await page.waitForSelector('[data-testid="contact-drawer"]', {
      state: 'hidden',
      timeout: 30000,
    });

    console.log(`Successfully created customer: ${companyName}`);
    return companyName;
  } catch (error) {
    console.error(`Failed to create customer: ${error}`);
    throw new Error(`Customer creation failed: ${error}`);
  }
}

/**
 * Validates that employee and customer dropdowns are visible and functional
 * @param page - Playwright page object
 * @returns Promise<void>
 */
export async function validateDropdownsVisible(page: Page): Promise<void> {
  await page.waitForSelector('#idsDropdownTypeaheadTextField2-chevron', {
    timeout: 10000,
  });
  await page.waitForSelector('#idsDropdownTypeaheadTextField4-chevron', {
    timeout: 10000,
  });
}

/**
 * Generates a random employee name
 * @returns string - Random employee name
 */
export function generateRandomEmployeeName(): string {
  const firstName = 'Test';
  const lastName = `Emp${Math.random().toString(36).substring(2, 8)}`;
  return `${firstName} ${lastName}`;
}

/**
 * Generates a random customer name
 * @returns string - Random customer name
 */
export function generateRandomCustomerName(): string {
  return `Test Service ${Math.random().toString(36).substring(2, 8)}`;
}

// Export all utilities as a single object for convenience
export default {
  qboActivation,
  createEmployeeAndCustomer,
  createEmployee,
  createCustomer,
  validateDropdownsVisible,
  generateRandomEmployeeName,
  generateRandomCustomerName,
};

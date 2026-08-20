import { test } from '@playwright/test';
import { getTestAccount } from '../../config/accounts';
import { openQBOTS, openQBOTE } from '../../pages/QBOLogin';
import {
  // Custom Field CRUD
  createDropdownCustomFieldAndValidate,
  editCustomField,
  toggleRequiredOnAndOff,
  toggleRequiredOnAndValidateSTE,

  // Customer Assignment to Custom Fields
  assignCustomFieldToCustomerAndValidateSTE,
  assignCustomFieldToCustomerAndValidateWTE,
  assignCustomFieldToCustomerAndValidateTimeClock,

  // Worker Assignment to Custom Fields
  assignCustomFieldToWorkerAndValidateSTE,
  assignCustomFieldToWorkerAndValidateWTE,

  // Customer Management
  createCustomerAndValidate,
  createCustomerAndAssignTimeTrackingFields,
  createAndEditCustomer,

  // Access Control
  validateAssignmentsAvailableForPremiumElite,
  validateAssignmentsNotAvailableForTTOWorker,
  validateAssignmentsNotAvailableForStandardAccess,

  // New Scope Cases
  verifyCustomFieldAssignToCustomerAndWorkerOptions,
  verifyStandardFieldViewActionForActiveField,
  verifyStandardFieldViewOpensFieldSettings,
  verifyFieldAssignmentsBidirectionalSync,
  verifyClassVisibilityBasedOnAssignment,
} from '../Util/Assignments.util';

/**
 * Assignments P0 Priority Cases - Core Regression Suite
 *
 * Essential P0 test cases for Assignments regression testing:
 * - Custom Field CRUD (Create, Edit, Required Toggle)
 * - Customer Assignment to Custom Fields (STE, WTE, TimeClock)
 * - Worker Assignment to Custom Fields (STE, WTE)
 * - Customer Management (Create, Edit, Assign Fields)
 * - Access Control (Premium/Elite, TTO, Standard Access)
 * - Field Settings & Bidirectional Sync
 * - Class Field Visibility
 */
test.describe('Assignments P0 Priority Cases', () => {
  // Custom Field CRUD
  test('ASM001 - P0: Create custom field and validate', async ({ page }) => {
    const credentials = getTestAccount('ASM001');
    await openQBOTS(page, credentials);
    await createDropdownCustomFieldAndValidate(page);
  });

  test('ASM002 - P0: Edit custom field and validate', async ({ page }) => {
    const credentials = getTestAccount('ASM002');
    await openQBOTS(page, credentials);
    await editCustomField(page);
  });

  test('ASM003 - P0: Toggle required on/off in custom fields', async ({
    page,
  }) => {
    const credentials = getTestAccount('ASM003');
    await openQBOTS(page, credentials);
    await toggleRequiredOnAndOff(page);
  });

  test('ASM004 - P0: Toggle required on and validate in STE', async ({
    page,
  }) => {
    const credentials = getTestAccount('ASM004');
    await openQBOTS(page, credentials);
    await toggleRequiredOnAndValidateSTE(page);
  });

  // Customer Assignment to Custom Fields
  test('ASM010 - P0: Assign custom field for a customer in STE', async ({
    page,
  }) => {
    const credentials = getTestAccount('ASM010');
    await openQBOTS(page, credentials);
    await assignCustomFieldToCustomerAndValidateSTE(page);
  });

  test('ASM011 - P0: Assign custom field for a customer in WTE', async ({
    page,
  }) => {
    const credentials = getTestAccount('ASM011');
    await openQBOTS(page, credentials);
    await assignCustomFieldToCustomerAndValidateWTE(page);
  });

  test('ASM012 - P0: Assign custom field for a customer in TimeClock', async ({
    page,
  }) => {
    const credentials = getTestAccount('ASM012');
    await openQBOTS(page, credentials);
    await assignCustomFieldToCustomerAndValidateTimeClock(page);
  });

  // Worker Assignment to Custom Fields
  test('ASM013 - P0: Assign custom field for a worker in STE', async ({
    page,
  }) => {
    const credentials = getTestAccount('ASM013');
    await openQBOTS(page, credentials);
    await assignCustomFieldToWorkerAndValidateSTE(page);
  });

  test('ASM014 - P0: Assign custom field for a worker in WTE', async ({
    page,
  }) => {
    const credentials = getTestAccount('ASM014');
    await openQBOTS(page, credentials);
    await assignCustomFieldToWorkerAndValidateWTE(page);
  });

  // Customer Management
  test('ASM018 - P0: Create customer and validate', async ({ page }) => {
    const credentials = getTestAccount('ASM018');
    await openQBOTS(page, credentials);
    await createCustomerAndValidate(page);
  });

  test('ASM019 - P0: Create customer and assign time tracking fields', async ({
    page,
  }) => {
    const credentials = getTestAccount('ASM019');
    await openQBOTS(page, credentials);
    await createCustomerAndAssignTimeTrackingFields(page);
  });

  test('ASM022 - P0: Create and edit customer', async ({ page }) => {
    const credentials = getTestAccount('ASM022');
    await openQBOTS(page, credentials);
    await createAndEditCustomer(page);
  });

  // Access Control
  test('ASM034 - P0: Premium/Elite - Assignments available', async ({
    page,
  }) => {
    const credentials = getTestAccount('ASM034');
    await openQBOTS(page, credentials);
    await validateAssignmentsAvailableForPremiumElite(page);
  });

  test('ASM036 - P0: TTO worker - feature not available', async ({ page }) => {
    const credentials = getTestAccount('ASM036');
    await openQBOTS(page, credentials);
    await validateAssignmentsNotAvailableForTTOWorker(page);
  });

  test('ASM037 - P0: Standard access - feature not available', async ({
    page,
  }) => {
    const credentials = getTestAccount('ASM037');
    await openQBOTS(page, credentials);
    await validateAssignmentsNotAvailableForStandardAccess(page);
  });

  // Field Settings & Sync (New Scope - uses openQBOTE)
  test('ASM049 - P0: Custom Fields - assign to Customer/Worker options', async ({
    page,
  }) => {
    const credentials = getTestAccount('ASM049');
    await openQBOTE(page, credentials);
    await verifyCustomFieldAssignToCustomerAndWorkerOptions(page);
  });

  test('ASM050-51 - P0: Standard Fields - View action and field settings', async ({
    page,
  }) => {
    const credentials = getTestAccount('ASM050-51');
    await openQBOTE(page, credentials);
    await verifyStandardFieldViewActionForActiveField(page);
    await verifyStandardFieldViewOpensFieldSettings(page);
  });

  test('ASM055-57 - P0: Bidirectional sync (Settings ↔ Assignments)', async ({
    page,
  }) => {
    const credentials = getTestAccount('ASM055-57');
    await openQBOTE(page, credentials);
    await verifyFieldAssignmentsBidirectionalSync(page);
  });

  test('ASM061 - P0: Class field visibility based on assignment', async ({
    page,
  }) => {
    const credentials = getTestAccount('ASM061');
    await openQBOTE(page, credentials);
    await verifyClassVisibilityBasedOnAssignment(page);
  });
});

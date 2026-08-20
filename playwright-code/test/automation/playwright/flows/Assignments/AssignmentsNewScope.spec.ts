import { test } from '@playwright/test';
import { getTestAccount } from '../../config/accounts';
import { openQBOTE } from '../../pages/QBOLogin';
import {
  verifyCustomFieldAssignToCustomerAndWorkerOptions,
  verifyStandardFieldViewActionForActiveField,
  verifyStandardFieldViewOpensFieldSettings,
  verifyStandardFieldViewVisibleForInactiveField,
  verifyStandardFieldViewDisabledForActiveField,
  verifyStandardFieldViewChangesReflected,
  verifyWorkerViewSettingsNavigation,
  verifyGroupViewWorkerSettings,
  verifyFieldAssignmentsBidirectionalSync,
  verifyWorkerViewSettingsBreaksVisible,
  verifyWorkerViewSettingsEditBreaksNavigation,
  verifyWorkerViewSettingsNotificationsSave,
  verifyClassVisibilityBasedOnAssignment,
  verifyClassVisibilityBasedOnAssignmentWTE,
} from '../Util/Assignments.util';

/**
 * Assignments - Field Settings & Worker View Settings Test Cases
 * Test IDs: ASM049-ASM060
 *
 * Grouped test cases:
 * - ASM049: Custom Fields assignment options
 * - ASM050-054: Standard Fields View action scenarios (combined into ASM050-51 and ASM052-54)
 * - ASM055-057: Worker View Settings navigation and sync (combined)
 * - ASM058-060: Worker View Settings - Breaks and Notifications (combined)
 */
test.describe('Assignments - Field Settings & Worker View Settings', () => {
  test.beforeEach(async ({ page }) => {
    const testInfo = test.info();
    const testId = testInfo.title.split(' - ')[0];
    const credentials = getTestAccount(testId);
    await openQBOTE(page, credentials);
  });

  // ==================== Custom Fields Assignment ====================

  test('ASM049 - Custom Fields - Verify assign to Customer and Worker options available', async ({
    page,
  }) => {
    await verifyCustomFieldAssignToCustomerAndWorkerOptions(page);
  });

  test('ASM050-51 - Standard Fields - View action visible and opens field settings', async ({
    page,
  }) => {
    // ASM050: Verify View action is visible for standard fields
    await verifyStandardFieldViewActionForActiveField(page);

    // ASM051: Verify clicking View opens field level settings
    await verifyStandardFieldViewOpensFieldSettings(page);
  });

  test('ASM052-54 - Standard Fields - View action states for inactive/active fields and changes', async ({
    page,
  }) => {
    // ASM052: View action is visible when field is inactive
    await verifyStandardFieldViewVisibleForInactiveField(page);

    // ASM053: View option is disabled/greyed when field is active
    await verifyStandardFieldViewDisabledForActiveField(page);

    // ASM054: Validate changes made on settings page are reflected
    await verifyStandardFieldViewChangesReflected(page);
  });

  test('ASM055-57 - Worker View Settings - Navigation and Field Assignments Bidirectional Sync', async ({
    page,
  }) => {
    // ASM055: Workers tab -> Workers toggle -> View Settings navigation
    await verifyWorkerViewSettingsNavigation(page);

    // ASM056: Workers tab -> Groups toggle -> View -> View Settings navigation
    await verifyGroupViewWorkerSettings(page);

    // ASM057: Field Assignments bidirectional sync (Settings ↔ Assignments)
    // Part A: Settings → Assignments: Assign customer in Settings, verify in Assignments
    // Part B: Assignments → Settings: Change assignment in Assignments, verify in Settings
    await verifyFieldAssignmentsBidirectionalSync(page);
  });

  test('ASM058-60 - Worker View Settings - Breaks visibility,  Notifications save and Bidirectional sync', async ({
    page,
  }) => {
    // ASM058: Breaks - Verify paid and unpaid breaks are visible
    await verifyWorkerViewSettingsBreaksVisible(page);

    // ASM059: Edit Breaks button navigates to Time Settings
    await verifyWorkerViewSettingsEditBreaksNavigation(page);

    // ASM060: Notifications - Clock-in, Clock-out, Days of week settings save
    await verifyWorkerViewSettingsNotificationsSave(page);
  });

  // ==================== Class Field Visibility ====================

  test('ASM061 - Standard Field Dependency - STE - Class Field Visibility Based on Customer/Worker Assignment', async ({
    page,
  }) => {
    // Verify Class field visibility on STE changes based on assigned customers/workers:
    // - Class visible when matching customer AND worker selected
    // - Class hidden when non-matching worker selected
    // - Class hidden when non-matching customer selected
    await verifyClassVisibilityBasedOnAssignment(page);
  });

  // FIXME: WTE worker/customer selection triggers "Add new Employee" dialog
  // Need to fix selectWorkerInWTE and selectCustomerInWTE to properly select from dropdown
  test.fixme(
    'ASM062 - Standard Field Dependency - WTE - Class Field Visibility Based on Customer/Worker Assignment',
    async ({ page }) => {
      // Verify Class field visibility on WTE changes based on assigned customers/workers:
      // - Class visible when matching customer AND worker selected
      // - Class hidden when non-matching worker selected
      // - Class hidden when non-matching customer selected
      await verifyClassVisibilityBasedOnAssignmentWTE(page);
    },
  );
});

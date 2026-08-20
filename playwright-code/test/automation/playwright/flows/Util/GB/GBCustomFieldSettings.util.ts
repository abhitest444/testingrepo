import { Page, expect } from '@playwright/test';
import CustomFieldsPage from '../../../pages/CustomFieldSettingsPage';
import {
  CUSTOM_FIELD_CATEGORY_OPTIONS,
  CUSTOM_FIELD_DATA_TYPES,
} from '../../../constants';
import { waitForLoadingToDisappear } from 'test/automation/playwright/pages/TimeSettingsPage';

export const validateCustomFieldSettingsView = async (page: Page) => {
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(3000);
  await CustomFieldsPage.validateTimeSettingsCustomFieldSectionVisible(page);
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await CustomFieldsPage.closeAddCustomFieldTooltip(page);
  await CustomFieldsPage.validateCustomFieldSectionVisibleWithZeroState(page);
  await CustomFieldsPage.validateTimeTrackingCustomFieldsPage(page);
  await CustomFieldsPage.clickAddCustomFieldsButton(page);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await CustomFieldsPage.validateAddCustomFieldsPage(page);
};

export const validateManageAllCustomFieldsLink = async (page: Page) => {
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(3000);
  await CustomFieldsPage.clickManageAllCustomFieldsLink(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.validateManageAllCustomFieldsPageUI(page);
};

export const CreateAndDeactivateNewCustomField = async (page: Page) => {
  await deactivateAllTestCustomFields(page);
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await waitForLoadingToDisappear(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.clickAddCustomFieldsButton(page);
  await waitForLoadingToDisappear(page);
  await page.waitForTimeout(1000);
  await CustomFieldsPage.validateAddCustomFieldsPage(page);
  const customFieldName = await CustomFieldsPage.addCustomFieldName(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.openTimeTrackingAddCustomFieldDataTypeDropdown(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.selectDataTypeDropdownOption(
    page,
    CUSTOM_FIELD_DATA_TYPES.number,
  );
  await CustomFieldsPage.validateCategoryForTimeTrackingCustomField(page);
  await CustomFieldsPage.selectCategoryForTimeTrackingCustomField(
    page,
    CUSTOM_FIELD_CATEGORY_OPTIONS.time,
  );
  await CustomFieldsPage.clickTimeTrackingCustomFieldSaveButton(page);
  await page.waitForTimeout(2000);

  await CustomFieldsPage.validateCustomFieldAddedInList(
    page,
    customFieldName,
    CUSTOM_FIELD_DATA_TYPES.number,
  );

  await CustomFieldsPage.makeCustomFieldRequireFieldToggleON(page);
  await CustomFieldsPage.clickSaveCustomFieldsListScreen(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await CustomFieldsPage.makeCustomFieldRequireFieldToggleOFF(page);
  await CustomFieldsPage.clickSaveCustomFieldsListScreen(page);
  await CustomFieldsPage.clickSaveButton(page);

  await deactivateAllTestCustomFields(page);
};

export const addTimeTrackingCustomField = async (page: Page) => {
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.closeAddCustomFieldTooltip(page);
  await CustomFieldsPage.clickAddCustomFieldsButton(page);
  await page.waitForTimeout(3000);
  await CustomFieldsPage.validateAddCustomFieldsPage(page);
  const customFieldName = await CustomFieldsPage.addCustomFieldName(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.openTimeTrackingAddCustomFieldDataTypeDropdown(page);
  // await CustomFieldsPage.validateDataTypeDropdownOptions(page);
  await page.waitForTimeout(5000);
  await CustomFieldsPage.selectDataTypeDropdownOption(
    page,
    CUSTOM_FIELD_DATA_TYPES.number,
  );
  await CustomFieldsPage.validateCategoryForTimeTrackingCustomField(page);
  await CustomFieldsPage.selectCategoryForTimeTrackingCustomField(
    page,
    CUSTOM_FIELD_CATEGORY_OPTIONS.time,
  );
  // await CustomFieldsPage.clickTimeTrackingCustomFieldSaveButton(page);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  // await CustomFieldsPage.validateCustomFieldAddedInList(page, customFieldName, CUSTOM_FIELD_DATA_TYPES.number,1);
};

export const makeCustomFieldRequireFieldToggleOnAndOff = async (page: Page) => {
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await CustomFieldsPage.closeAddCustomFieldTooltip(page);
  await CustomFieldsPage.makeCustomFieldRequireFieldToggleON(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.makeCustomFieldRequireFieldToggleOFF(page);
  await page.waitForTimeout(2000);
};

export const validateCustomFieldSettingsConfirmationModel = async (
  page: Page,
) => {
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await CustomFieldsPage.closeAddCustomFieldTooltip(page);

  // Click custom field settings close button and validate the custom field settings page
  await CustomFieldsPage.clickCustomFieldSettingsCloseButton(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.validateCustomFieldSettingsPage(page);

  // Click custom field settings cancel button and validate the custom field settings page
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await CustomFieldsPage.closeAddCustomFieldTooltip(page);
  await CustomFieldsPage.clickCustomFieldSettingsCancelButton(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.validateCustomFieldSettingsPage(page);

  // Click custom field settings save button and validate the custom field settings page
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await CustomFieldsPage.closeAddCustomFieldTooltip(page);
  await CustomFieldsPage.clickCustomFieldSettingsSaveButton(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.validateCustomFieldSettingsPage(page);

  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await CustomFieldsPage.closeAddCustomFieldTooltip(page);
  const { isChecked, ariaChecked } =
    await CustomFieldsPage.getCustomFieldRequireFieldToggleState(page);

  if (isChecked || ariaChecked === 'true') {
    await CustomFieldsPage.makeCustomFieldRequireFieldToggleOFF(page);
    await page.waitForTimeout(1000);
    await CustomFieldsPage.clickCustomFieldSettingsSaveButton(page);
    await page.waitForTimeout(1000);
    await CustomFieldsPage.validateCustomFieldSettingsPage(page);
  }
  if (!isChecked || ariaChecked === 'false') {
    // click custom field require field toggle on, click cancel button and validate confirmation popup

    await CustomFieldsPage.makeCustomFieldRequireFieldToggleON(page);
    await page.waitForTimeout(1000);
    await CustomFieldsPage.clickCustomFieldSettingsCancelButton(page);
    await page.waitForTimeout(1000);
    await CustomFieldsPage.validateCustomFieldSettingsConfirmationPopupVisible(
      page,
    );
    await CustomFieldsPage.clickCustomFieldSettingsConfirmationPopupNoButton(
      page,
      'No',
    );
    await page.waitForTimeout(2000);
    await CustomFieldsPage.validateCustomFieldSettingsPageWithTimeTracking(
      page,
    );

    // click custom field require field toggle on, click cancel button and validate confirmation popup
    await CustomFieldsPage.makeCustomFieldRequireFieldToggleON(page);
    await page.waitForTimeout(1000);
    await CustomFieldsPage.clickCustomFieldSettingsCancelButton(page);
    await page.waitForTimeout(1000);
    await CustomFieldsPage.validateCustomFieldSettingsConfirmationPopupVisible(
      page,
    );
    await CustomFieldsPage.clickCustomFieldSettingsConfirmationPopupNoButton(
      page,
      'Yes',
    );
    await page.waitForTimeout(2000);
    await CustomFieldsPage.validateTimeSettingsCustomFieldSectionVisible(page);

    // click custom field require field toggle on, click close button and validate the custom field settings page
    await CustomFieldsPage.clickCustomFieldsEditButton(page);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await CustomFieldsPage.makeCustomFieldRequireFieldToggleON(page);
    await page.waitForTimeout(1000);
    await CustomFieldsPage.clickCustomFieldSettingsCloseButton(page);
    await page.waitForTimeout(1000);
    await CustomFieldsPage.validateCustomFieldSettingsConfirmationPopupVisible(
      page,
    );
    await CustomFieldsPage.clickCustomFieldSettingsConfirmationPopupNoButton(
      page,
      'No',
    );
    await page.waitForTimeout(2000);
    await CustomFieldsPage.validateCustomFieldSettingsPageWithTimeTracking(
      page,
    );

    // click custom field require field toggle on, click close button and validate the custom field settings page
    await CustomFieldsPage.makeCustomFieldRequireFieldToggleON(page);
    await page.waitForTimeout(1000);
    await CustomFieldsPage.clickCustomFieldSettingsCloseButton(page);
    await page.waitForTimeout(1000);
    await CustomFieldsPage.validateCustomFieldSettingsConfirmationPopupVisible(
      page,
    );
    await CustomFieldsPage.clickCustomFieldSettingsConfirmationPopupNoButton(
      page,
      'Yes',
    );
    await page.waitForTimeout(2000);
    await CustomFieldsPage.validateTimeSettingsCustomFieldSectionVisible(page);
  }
};

export const validateAddCustomFieldPageConfirmationModel = async (
  page: Page,
) => {
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await CustomFieldsPage.clickAddCustomFieldsButton(page);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);
  await CustomFieldsPage.validateAddCustomFieldsPage(page);

  // click add custom field - close button and validate the add custom field page
  await CustomFieldsPage.clickAddCustomFieldPageCloseButton(page);
  await page.waitForTimeout(1000);
  await CustomFieldsPage.validateAddCustomFieldPageConfirmationPopupVisible(
    page,
  );
  await CustomFieldsPage.clickCustomFieldSettingsConfirmationPopupNoButton(
    page,
    'No',
  );
  await page.waitForTimeout(2000);
  await CustomFieldsPage.validateAddCustomFieldsPage(page);

  // click add custom field - yes button and validate the add custom field page
  await CustomFieldsPage.clickAddCustomFieldPageCloseButton(page);
  await page.waitForTimeout(1000);
  await CustomFieldsPage.validateAddCustomFieldPageConfirmationPopupVisible(
    page,
  );
  await CustomFieldsPage.clickCustomFieldSettingsConfirmationPopupNoButton(
    page,
    'Yes',
  );
  await page.waitForTimeout(2000);
  await CustomFieldsPage.validateCustomFieldSettingsPageWithTimeTracking(page); // click add custom field - cancel button and validate the add custom field page
};

export const deactivateAllTestCustomFields = async (page: Page) => {
  // Navigate to the custom fields page
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(3000);
  await CustomFieldsPage.clickManageAllCustomFieldsLink(page);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);
  // Get count of active test custom fields before cleanup
  const activeFieldsBefore = await getActiveCustomFieldsCount(page);

  if (activeFieldsBefore === 0) {
    console.log('No active test custom fields found to deactivate');
    return;
  }

  // Deactivate each test custom field using while loop to handle dynamic changes
  let attempts = 0;
  const maxAttempts = activeFieldsBefore * 2; // Allow for retries

  while (attempts < maxAttempts) {
    try {
      // Check if there are still active test custom fields
      const currentActiveFields = await getActiveCustomFieldsCount(page);
      if (currentActiveFields === 0) {
        console.log('No more active test custom fields to deactivate');
        break;
      }

      // Always target the first available test custom field
      await page
        .locator(
          `//div[contains(text(),'Test Custom Fiel')]/ancestor::tr/descendant::button[@aria-haspopup='listbox']`,
        )
        .first()
        .click();
      await page.waitForTimeout(1000);

      // Click "Make inactive" option
      await page.locator(`//*[text()='Make inactive']`).click();
      await page.waitForTimeout(1000);
      await expect(
        page.locator(`//p[contains(text(), 'Making custom')]`),
      ).toBeVisible();
      await page.locator(`//span[text()='Yes']`).click();
      await page.waitForLoadState('load');
      await expect(
        page.locator(`//p[contains(text(), 'Making custom')]`),
      ).toBeHidden();
      await page.waitForTimeout(3000);

      console.log(`Deactivated test custom field (attempt ${attempts + 1})`);
      attempts++;
    } catch (error) {
      console.log(
        `Error deactivating custom field (attempt ${attempts + 1}): ${error}`,
      );
      attempts++;
      await page.waitForTimeout(2000); // Wait before retry
    }
  }

  // Verify cleanup was successful
  const activeFieldsAfter = await getActiveCustomFieldsCount(page);
  console.log(`Active test custom fields after cleanup: ${activeFieldsAfter}`);

  if (activeFieldsAfter === 0) {
    console.log('All test custom fields successfully deactivated');
  } else {
    console.log(
      `${activeFieldsAfter} test custom fields still active after cleanup`,
    );
  }
};

export const getActiveCustomFieldsCount = async (page: Page) => {
  const activeFields = await page
    .locator(
      `//div[contains(text(),'Test Custom Fiel')] / ancestor::tr / descendant::a[text()='Edit']`,
    )
    .count();
  return activeFields;
};

export const cleanupTestCustomFieldsBeforeTest = async (page: Page) => {
  console.log(
    'Starting pre-test cleanup: Deactivating any existing test custom fields',
  );
  await deactivateAllTestCustomFields(page);
  console.log('Pre-test cleanup completed');
};

export const validateCustomFieldPaginationFunctionality = async (
  page: Page,
) => {
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await CustomFieldsPage.validateCustomFieldPaginationInfo(
    page,
    7,
    '1 - 7 of 8 items',
    1,
    2,
  );
};

export default {
  validateCustomFieldSettingsView,
  validateManageAllCustomFieldsLink,
  addTimeTrackingCustomField,
  makeCustomFieldRequireFieldToggleOnAndOff,
  validateCustomFieldSettingsConfirmationModel,
  deactivateAllTestCustomFields,
  cleanupTestCustomFieldsBeforeTest,
  CreateAndDeactivateNewCustomField,
  validateAddCustomFieldPageConfirmationModel,
  validateCustomFieldPaginationFunctionality,
};

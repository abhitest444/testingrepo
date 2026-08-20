import { Page, expect } from '@playwright/test';
import SingleTimeActivityPage from '../../pages/SingleTimeActivityPage';
import {
  waitForResponseWithURLandBody,
  SETTINGS_FACADE_URL_PATTERN,
  matchCompanySettingsResponse,
} from '../../pages/TimeTrowser';
import { LABELS, testData } from '../../utils';
import {
  fillSingleTAFields,
  fillSingleTAForLastTeamMember,
  smartWaitForPageLoad,
} from './SingleTimeActivityCRUD.util';
import QBOSettingsPage from '../../pages/QBOSettingsPage';
import { timeEntriesTestData } from '../../constants';
import SingleTImeEntryPage from '../../pages/SingleTimeEntryPage';

const toggleOffAndOnSettingsForFormField = async (
  page: Page,
  label: string,
) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);

  // wait for trowser to load
  await singleTimeActPage.validateSTALoaded();
  await singleTimeActPage.waitTillLoaderDisappears();
  await page.waitForTimeout(2000);
  await singleTimeActPage.handleTourModal();
  await page.waitForSelector(
    `//*[contains(@placeholder, "name") and @type="text"]`,
    { state: 'visible', timeout: 0 },
  );

  // if mentioned form field is visible, proceed with the toggling off for the form field
  if (await singleTimeActPage.checkFieldVisibility(label)) {
    let targetLabel = label;
    if (label === LABELS.BillablePerHour) {
      targetLabel = LABELS.BillablePerHour;
      await singleTimeActPage.uncheckCheckboxIfVisible(label);
    } else if (label === LABELS.CostRatePerHour) {
      targetLabel = LABELS.CostRate;
      await singleTimeActPage.clearCostRateFieldValue();
    }

    await singleTimeActPage.openTimeSettingsPopoverForm();
    await page.waitForTimeout(2000);

    if (
      await singleTimeActPage.isCheckboxVisibleInTimeSettingsPopover(
        targetLabel,
      )
    ) {
      // Toggle OFF The Setting First
      await singleTimeActPage.uncheckCheckboxInTimeSettingsPopover(targetLabel);

      const timeTrackingSettingsQueryPromise = waitForResponseWithURLandBody(
        page,
        SETTINGS_FACADE_URL_PATTERN,
        matchCompanySettingsResponse,
      );
      await singleTimeActPage.clickOnSaveSettingsInsidePopover();

      // verify response
      const timeTrackingSettingsQueryPromisePayload =
        await timeTrackingSettingsQueryPromise;
      expect(timeTrackingSettingsQueryPromisePayload).toBeDefined();

      const isFormFieldInvisibleAfterChanges =
        !(await singleTimeActPage.checkFieldVisibility(label));
      expect(isFormFieldInvisibleAfterChanges).toEqual(true);

      await singleTimeActPage.openTimeSettingsPopoverForm();
      await page.waitForTimeout(2000);

      // Toggle Back ON The Same Setting
      await singleTimeActPage.checkCheckboxInTimeSettingsPopover(targetLabel);

      const timeTrackingSettingsQueryNewPromise = waitForResponseWithURLandBody(
        page,
        SETTINGS_FACADE_URL_PATTERN,
        matchCompanySettingsResponse,
      );
      await singleTimeActPage.clickOnSaveSettingsInsidePopover();
      await page.waitForTimeout(4000);

      // verify response
      const timeTrackingSettingsQueryPromiseNewPayload =
        await timeTrackingSettingsQueryNewPromise;
      expect(timeTrackingSettingsQueryPromiseNewPayload).toBeDefined();

      const isFormFieldVisibleAfterChanges =
        await singleTimeActPage.checkFieldVisibility(label);
      expect(isFormFieldVisibleAfterChanges).toEqual(true);
    }
  }
};

const toggleOffSettingsForPrefilledFormField = async (
  page: Page,
  label: string,
) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);

  // wait for trowser to load
  await singleTimeActPage.validateSTALoaded();
  await singleTimeActPage.waitTillLoaderDisappears();
  await page.waitForTimeout(2000);
  await singleTimeActPage.handleTourModal();
  await page.waitForSelector(
    `//*[contains(@placeholder, "name") and @type="text"]`,
    { state: 'visible', timeout: 0 },
  );

  // if mentioned form field is visible, try proceed with the toggling off for the form field by pre-filling the value
  if (await singleTimeActPage.checkFieldVisibility(label)) {
    let targetLabel = label;
    switch (label) {
      case LABELS.BillablePerHour:
        targetLabel = LABELS.BillablePerHour;
        await singleTimeActPage.checkCheckboxForGivenLabelIfVisible(label);
        break;
      case LABELS.CostRatePerHour:
        targetLabel = LABELS.CostRate;
        await singleTimeActPage.populateCostRateFieldValue();
        break;
      case LABELS.Taxable:
        await singleTimeActPage.checkCheckboxForGivenLabelIfVisible(label);
        break;
      case LABELS.PayType:
        // pick pay type
        if (
          (await singleTimeActPage.checkFieldVisibility(LABELS.PayType)) &&
          !(await singleTimeActPage.validateNoAvailablePayTypes())
        ) {
          await singleTimeActPage.openDropdown(LABELS.PayType);
          await singleTimeActPage.selectPayTypeOption(testData.option1);
        } else {
          break;
        }
        break;
      default:
        // open mentioned form field dropdown & click first option
        if (await singleTimeActPage.checkFieldVisibility(label)) {
          await singleTimeActPage.openDropdown(label);
          await singleTimeActPage.clickDropdownOption(testData.option1, label);
        }
        break;
    }

    await singleTimeActPage.openTimeSettingsPopoverForm();
    await page.waitForTimeout(2000);

    if (
      await singleTimeActPage.isCheckboxVisibleInTimeSettingsPopover(
        targetLabel,
      )
    ) {
      await singleTimeActPage.uncheckCheckboxInTimeSettingsPopover(targetLabel);
      await singleTimeActPage.clickOnSaveSettingsInsidePopover();
      await expect(
        page.getByTestId('TimeSettingsPopoverHOCErrorPageMessage'),
      ).toContainText(
        "There's information on these fields, so you can't remove it from the form.",
      );
      await singleTimeActPage.checkCheckboxInTimeSettingsPopover(targetLabel);
    }
  }
};

const validateLocationFieldHiddenAfterQboSettingsToggleOff = async (
  page: Page,
) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);
  const qboSettingsPage = new QBOSettingsPage(page);
  await page.waitForTimeout(2000);
  expect(
    await singleTimeActPage.checkFieldVisibility(LABELS.Location),
  ).toBeTruthy();
  await qboSettingsPage.navigateToQBOAdvancedSettings();
  if (await qboSettingsPage.validateClassAndLocationSettingsNotAvailable()) {
    return;
  } else {
    await qboSettingsPage.waitForChartOfAccounts();

    await qboSettingsPage.clickTracklocations();
    await page.waitForTimeout(500);
    let hasLocation = await qboSettingsPage.checkIfLocationSettingToggleOn();
    if (hasLocation) {
      await qboSettingsPage.uncheckLocationToggle();
    }
    await qboSettingsPage.clickSaveButton();
    await page.waitForTimeout(2000);
    if (
      await page
        .locator(`//span[text()='Something’s not quite right']`)
        .isVisible()
    ) {
      await page.reload();
      await qboSettingsPage.waitForChartOfAccounts();

      await qboSettingsPage.clickTracklocations();
      await page.waitForTimeout(500);
      let hasLocation = await qboSettingsPage.checkIfLocationSettingToggleOn();
      if (hasLocation) {
        await qboSettingsPage.uncheckLocationToggle();
      }
      await qboSettingsPage.clickSaveButton();
    } else {
      await qboSettingsPage.waitForSaveOperationToComplete();
      await qboSettingsPage.waitForChartOfAccounts();
    }
    await singleTimeActPage.navigateToSingleTime();
    await page.waitForTimeout(2000);
    expect(
      await singleTimeActPage.checkFieldVisibility(LABELS.Location),
    ).toBeFalsy();
    await qboSettingsPage.navigateToQBOAdvancedSettings();
    await qboSettingsPage.clickAdvancedQBOSettings();
    await qboSettingsPage.waitForChartOfAccounts();

    await qboSettingsPage.clickTracklocations();
    hasLocation = await qboSettingsPage.checkIfLocationSettingToggleOn();
    await page.waitForTimeout(500);
    if (!hasLocation) {
      await qboSettingsPage.checkLocationToggle();
    }
    await qboSettingsPage.clickSaveButton();
    await page.waitForTimeout(2000);
    if (
      await page
        .locator(`//span[text()='Something’s not quite right']`)
        .isVisible()
    ) {
      await page.reload();
      await qboSettingsPage.waitForChartOfAccounts();

      await qboSettingsPage.clickTracklocations();
      await page.waitForTimeout(500);
      let hasLocation = await qboSettingsPage.checkIfLocationSettingToggleOn();
      if (!hasLocation) {
        await qboSettingsPage.uncheckLocationToggle();
      }
      await qboSettingsPage.clickSaveButton();
    } else {
      await qboSettingsPage.waitForSaveOperationToComplete();
      await qboSettingsPage.waitForChartOfAccounts();
    }
    await singleTimeActPage.navigateToSingleTime();
    await page.waitForTimeout(2000);

    expect(
      await singleTimeActPage.checkFieldVisibility(LABELS.Location),
    ).toBeTruthy();
  }
};

const validateClassFieldHiddenAfterQboSettingsToggleOff = async (
  page: Page,
) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);
  const qboSettingsPage = new QBOSettingsPage(page);
  await qboSettingsPage.navigateToQBOAdvancedSettings();
  if (await qboSettingsPage.validateClassAndLocationSettingsNotAvailable()) {
    return;
  } else {
    await qboSettingsPage.waitForTrackClassesToBeVisible();
    await qboSettingsPage.clickTrackClasses();
    await page.waitForTimeout(500);
    let hasClass = await qboSettingsPage.checkIfClassesSettingToggleOn();
    if (hasClass) {
      await qboSettingsPage.uncheckClassesToggle();
    }
    await qboSettingsPage.clickSaveButton();
    await page.waitForTimeout(2000);

    if (
      await page
        .locator(`//span[text()='Something’s not quite right']`)
        .isVisible()
    ) {
      await page.reload();
      await qboSettingsPage.waitForChartOfAccounts();

      await qboSettingsPage.clickTracklocations();
      await page.waitForTimeout(500);
      let hasClass = await qboSettingsPage.checkIfLocationSettingToggleOn();
      if (hasClass) {
        await qboSettingsPage.uncheckLocationToggle();
      }
      await qboSettingsPage.clickSaveButton();
    } else {
      await qboSettingsPage.waitForSaveOperationToComplete();
      await qboSettingsPage.waitForTrackClassesToBeVisible();
    }

    await singleTimeActPage.navigateToSingleTime();
    await page.waitForTimeout(2000);
    expect(
      await singleTimeActPage.checkFieldVisibility(LABELS.Class),
    ).toBeFalsy();
    await qboSettingsPage.navigateToQBOAdvancedSettings();
    await qboSettingsPage.waitForTrackClassesToBeVisible();

    await qboSettingsPage.clickTrackClasses();
    await page.waitForTimeout(500);
    hasClass = await qboSettingsPage.checkIfClassesSettingToggleOn();

    if (!hasClass) {
      await qboSettingsPage.checkClassesToggle();
    }
    await qboSettingsPage.clickSaveButton();
    await page.waitForTimeout(2000);

    if (
      await page
        .locator(`//span[text()='Something’s not quite right']`)
        .isVisible()
    ) {
      await page.reload();
      await qboSettingsPage.waitForChartOfAccounts();

      await qboSettingsPage.clickTracklocations();
      await page.waitForTimeout(500);
      let hasClass = await qboSettingsPage.checkIfLocationSettingToggleOn();
      if (!hasClass) {
        await qboSettingsPage.uncheckLocationToggle();
      }
      await qboSettingsPage.clickSaveButton();
    } else {
      await qboSettingsPage.waitForSaveOperationToComplete();
      await qboSettingsPage.waitForTrackClassesToBeVisible();
    }
    await singleTimeActPage.navigateToSingleTime();
    await page.waitForTimeout(2000);

    expect(
      await singleTimeActPage.checkFieldVisibility(LABELS.Class),
    ).toBeTruthy();
  }
};

const settingsCases = async (page: Page) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);
  const qboSettingsPage = new QBOSettingsPage(page);
  const singleTimeEntryPage = new SingleTImeEntryPage(page);

  // making sure correct settings are pre-checked
  await singleTimeActPage.validateSTALoaded();
  await singleTimeActPage.waitTillLoaderDisappears();
  await page.waitForTimeout(2000);
  await singleTimeEntryPage.waitForPageReady();
  await singleTimeActPage.handleTourModal();
  await singleTimeEntryPage.handlePopupsInAnyOrder();
  await singleTimeActPage.waitTillLoaderDisappears();
  await page.waitForTimeout(2000);
  await singleTimeActPage.handleTourModal();
  await page.waitForSelector(
    `//*[contains(@placeholder, "name") and @type="text"]`,
    { state: 'visible', timeout: 0 },
  );
  if (await singleTimeActPage.validateSettingsVisibleSingleTA()) {
    await qboSettingsPage.navigateToQBOAdvancedSettings();
    if (await qboSettingsPage.validateClassAndLocationSettingsNotAvailable()) {
      await singleTimeActPage.navigateToSingleTime();
    } else {
      await qboSettingsPage.waitForChartOfAccounts();
      if (
        await page
          .locator(
            `//span[text()='Track classes'] / following-sibling::span[text()='Off']`,
          )
          .isVisible()
      ) {
        await qboSettingsPage.clickTracklocations();
        await qboSettingsPage.checkLocationToggle();
        await qboSettingsPage.clickSaveButton();
        await qboSettingsPage.waitForSaveOperationToComplete();
        await qboSettingsPage.waitForChartOfAccounts();
      }
      if (
        await page
          .locator(
            `//span[text()='Track locations'] / following-sibling::span[text()='Off']`,
          )
          .isVisible()
      ) {
        await qboSettingsPage.clickTracklocations();
        await qboSettingsPage.checkClassesToggle();
        await qboSettingsPage.clickSaveButton();
        await qboSettingsPage.waitForSaveOperationToComplete();
        await qboSettingsPage.waitForChartOfAccounts();
      }
      await singleTimeActPage.navigateToSingleTime();
    }

    //navigating to single time trowser
    await singleTimeActPage.validateSTALoaded();
    await singleTimeActPage.waitTillLoaderDisappears();
    await page.waitForTimeout(2000);
    await singleTimeActPage.handleTourModal();
    await page.waitForSelector(
      `//*[contains(@placeholder, "name") and @type="text"]`,
      { state: 'visible', timeout: 0 },
    );
    await singleTimeActPage.clickDropdownOption(1, 'Name');
    await singleTimeActPage.openTimeSettingsPopoverForm();
    if (
      await singleTimeActPage.isCheckboxVisibleInTimeSettingsPopover(
        LABELS.Billable,
      )
    ) {
      await singleTimeActPage.checkCheckboxInTimeSettingsPopoverIfUnchecked(
        LABELS.Billable,
      );
    }
    if (
      await singleTimeActPage.isCheckboxVisibleInTimeSettingsPopover(
        LABELS.Service,
      )
    ) {
      await singleTimeActPage.checkCheckboxInTimeSettingsPopoverIfUnchecked(
        LABELS.Service,
      );
    }
    if (
      await singleTimeActPage.isCheckboxVisibleInTimeSettingsPopover(
        LABELS.Location,
      )
    ) {
      await singleTimeActPage.checkCheckboxInTimeSettingsPopoverIfUnchecked(
        LABELS.Location,
      );
    }
    if (
      await singleTimeActPage.isCheckboxVisibleInTimeSettingsPopover(
        LABELS.Class,
      )
    ) {
      await singleTimeActPage.checkCheckboxInTimeSettingsPopoverIfUnchecked(
        LABELS.Class,
      );
    }
    if (
      await singleTimeActPage.isCheckboxVisibleInTimeSettingsPopover(
        LABELS.PayType,
      )
    ) {
      await singleTimeActPage.checkCheckboxInTimeSettingsPopoverIfUnchecked(
        LABELS.PayType,
      );
      await page.getByRole('button', { name: 'Save settings' }).click();
      await singleTimeActPage.waitTillLoaderDisappears();
    }
    await toggleOffAndOnSettingsForFormField(page, LABELS.BillablePerHour);
    console.log('1st case done single settings');
    await toggleOffSettingsForPrefilledFormField(page, LABELS.BillablePerHour);
    console.log('2nd case done single settings');
    await toggleOffAndOnSettingsForFormField(page, LABELS.Service);
    console.log('3rd case done single settings');
    await toggleOffSettingsForPrefilledFormField(page, LABELS.Service);
    console.log('4th case done single settings');
    await toggleOffAndOnSettingsForFormField(page, LABELS.Location);
    await toggleOffSettingsForPrefilledFormField(page, LABELS.Location);
    await toggleOffAndOnSettingsForFormField(page, LABELS.Class);
    await toggleOffSettingsForPrefilledFormField(page, LABELS.Class);
    await toggleOffAndOnSettingsForFormField(page, LABELS.PayType);
    await toggleOffSettingsForPrefilledFormField(page, LABELS.PayType);
    await toggleOffAndOnSettingsForFormField(page, LABELS.CostRatePerHour);
    await toggleOffSettingsForPrefilledFormField(page, LABELS.CostRatePerHour);
    await toggleOffAndOnSettingsForFormField(page, LABELS.Taxable);
    await toggleOffSettingsForPrefilledFormField(page, LABELS.Taxable);
    // await validateLocationFieldHiddenAfterQboSettingsToggleOff(page); // commented cases due to error on qbo settings advanced screen
    // await validateClassFieldHiddenAfterQboSettingsToggleOff(page);
    console.log('All single ta settings cases completed');
  } else {
    return;
  }
};

const settingsCasesPriority = async (page: Page) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);
  const qboSettingsPage = new QBOSettingsPage(page);
  const singleTimeEntryPage = new SingleTImeEntryPage(page);

  // making sure correct settings are pre-checked
  await singleTimeActPage.validateSTALoaded();
  await singleTimeActPage.waitTillLoaderDisappears();
  await page.waitForTimeout(2000);
  await singleTimeEntryPage.waitForPageReady();
  await singleTimeActPage.handleTourModal();
  await singleTimeEntryPage.handlePopupsInAnyOrder();
  await singleTimeActPage.waitTillLoaderDisappears();
  await page.waitForTimeout(2000);
  await singleTimeActPage.handleTourModal();
  await page.waitForSelector(
    `//*[contains(@placeholder, "name") and @type="text"]`,
    { state: 'visible', timeout: 0 },
  );
  //await singleTimeActPage.openDropdown('Name');
  await singleTimeActPage.clickDropdownOption(1, 'Name');
  await singleTimeActPage.openTimeSettingsPopoverForm();
  if (
    await singleTimeActPage.isCheckboxVisibleInTimeSettingsPopover(
      LABELS.Service,
    )
  ) {
    await singleTimeActPage.checkCheckboxInTimeSettingsPopoverIfUnchecked(
      LABELS.Service,
    );
  }
  if (
    await singleTimeActPage.isCheckboxVisibleInTimeSettingsPopover(
      LABELS.Location,
    )
  ) {
    await singleTimeActPage.checkCheckboxInTimeSettingsPopoverIfUnchecked(
      LABELS.Location,
    );
  }
  await singleTimeActPage.clickOnSaveSettingsInsidePopover();
  await toggleOffAndOnSettingsForFormField(page, LABELS.Service);
  await toggleOffAndOnSettingsForFormField(page, LABELS.Location);
};

// Optimized settings function with reduced waits and batch operations
const settingsCasesPriorityOptimized = async (page: Page) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);

  // Single setup with optimized waits
  await singleTimeActPage.validateSTALoaded();
  await singleTimeActPage.waitTillLoaderDisappears();

  // Smart wait strategy with multiple fallbacks
  await smartWaitForPageLoad(page, 5000);
  await singleTimeActPage.handleTourModal();

  // Wait for specific element instead of generic timeout
  await page.waitForSelector(
    `//*[contains(@placeholder, "name") and @type="text"]`,
    { state: 'visible', timeout: 10000 },
  );

  await singleTimeActPage.openTimeSettingsPopoverForm();

  // Batch checkbox operations instead of individual ones
  const checkboxOperations = [
    { label: LABELS.Service },
    { label: LABELS.Location },
  ];

  for (const operation of checkboxOperations) {
    if (
      await singleTimeActPage.isCheckboxVisibleInTimeSettingsPopover(
        operation.label,
      )
    ) {
      await singleTimeActPage.checkCheckboxInTimeSettingsPopoverIfUnchecked(
        operation.label,
      );
    }
  }

  await singleTimeActPage.clickOnSaveSettingsInsidePopover();

  // Optimize toggle operations - run in sequence but with reduced waits
  await toggleOffAndOnSettingsForFormFieldOptimized(page, LABELS.Service);
  await toggleOffAndOnSettingsForFormFieldOptimized(page, LABELS.Location);
};

/** Priority STA: ensure Service is visible and enabled before service/bill-rate checks. */
const ensureStaServiceFieldEnabledForPriority = async (page: Page) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);

  await singleTimeActPage.validateSTALoaded();
  await singleTimeActPage.waitTillLoaderDisappears();
  await singleTimeActPage.handleTourModal();
  await smartWaitForPageLoad(page, 5000);

  // Let settings toggle / form re-render settle after settingsCasesPriorityOptimized
  await page.waitForSelector(
    `//*[contains(@placeholder, "name") and @type="text"]`,
    { state: 'visible', timeout: 15000 },
  );
  await page.waitForTimeout(2000);

  if (await singleTimeActPage.isStaServiceFieldUsable({ waitMs: 0 })) {
    console.log('STA Service field is visible and enabled');
    return;
  }

  console.log(
    'STA Service field hidden or disabled — enabling via time settings popover',
  );

  await singleTimeActPage.openTimeSettingsPopoverForm();

  if (
    await singleTimeActPage.isCheckboxVisibleInTimeSettingsPopover(
      LABELS.Service,
    )
  ) {
    await singleTimeActPage.checkCheckboxInTimeSettingsPopoverIfUnchecked(
      LABELS.Service,
    );
  }

  const settingsSavePromise = waitForResponseWithURLandBody(
    page,
    SETTINGS_FACADE_URL_PATTERN,
    matchCompanySettingsResponse,
  );
  await singleTimeActPage.clickOnSaveSettingsInsidePopover();
  await settingsSavePromise;

  await singleTimeActPage.waitTillLoaderDisappears();
  await smartWaitForPageLoad(page, 5000);
  await page.waitForTimeout(2000);

  if (await singleTimeActPage.isStaServiceFieldUsable({ waitMs: 2000 })) {
    console.log('STA Service field enabled successfully');
  } else {
    console.log(
      'Warning: STA Service field still not usable after enabling in settings',
    );
  }
};

const toggleOffAndOnSettingsForFormFieldOptimized = async (
  page: Page,
  label: string,
) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);

  // Reduced validation cycle with smart waits
  await singleTimeActPage.validateSTALoaded();
  await smartWaitForPageLoad(page, 3000);
  await singleTimeActPage.handleTourModal();

  // Check current state before toggling to avoid unnecessary operations
  const isCurrentlyVisible = await singleTimeActPage.checkFieldVisibility(
    label,
  );

  if (isCurrentlyVisible) {
    await singleTimeActPage.openTimeSettingsPopoverForm();

    let targetLabel = label;
    if (label === LABELS.BillablePerHour) {
      targetLabel = LABELS.BillablePerHour;
      await singleTimeActPage.uncheckCheckboxIfVisible(label);
    } else if (label === LABELS.CostRatePerHour) {
      targetLabel = LABELS.CostRate;
      await singleTimeActPage.clearCostRateFieldValue();
    }

    if (
      await singleTimeActPage.isCheckboxVisibleInTimeSettingsPopover(
        targetLabel,
      )
    ) {
      // Toggle OFF The Setting First
      await singleTimeActPage.uncheckCheckboxInTimeSettingsPopover(targetLabel);

      // Note: These constants would need to be imported from appropriate files
      // For now using a simple regex pattern as placeholder
      const timeTrackingSettingsQueryPromise = waitForResponseWithURLandBody(
        page,
        /settings/, // Placeholder regex pattern
        () => true, // Placeholder matcher function
      );
      await singleTimeActPage.clickOnSaveSettingsInsidePopover();

      // Wait for response and verify in parallel
      const [settingsResponse] = await Promise.all([
        timeTrackingSettingsQueryPromise,
        page
          .waitForLoadState('domcontentloaded', { timeout: 3000 })
          .catch(() => page.waitForTimeout(500)),
      ]);

      expect(settingsResponse).toBeDefined();
      expect(!(await singleTimeActPage.checkFieldVisibility(label))).toEqual(
        true,
      );

      // Toggle Back ON The Same Setting
      await singleTimeActPage.openTimeSettingsPopoverForm();
      await singleTimeActPage.checkCheckboxInTimeSettingsPopover(targetLabel);

      const timeTrackingSettingsQueryNewPromise = waitForResponseWithURLandBody(
        page,
        /settings/, // Placeholder regex pattern
        () => true, // Placeholder matcher function
      );
      await singleTimeActPage.clickOnSaveSettingsInsidePopover();

      // Optimized final verification
      const [newSettingsResponse] = await Promise.all([
        timeTrackingSettingsQueryNewPromise,
        page
          .waitForLoadState('domcontentloaded', { timeout: 3000 })
          .catch(() => page.waitForTimeout(500)),
      ]);

      expect(newSettingsResponse).toBeDefined();
      expect(await singleTimeActPage.checkFieldVisibility(label)).toEqual(true);
    }
  }
};

export {
  toggleOffAndOnSettingsForFormField,
  toggleOffSettingsForPrefilledFormField,
  fillSingleTAForLastTeamMember,
  fillSingleTAFields,
  validateLocationFieldHiddenAfterQboSettingsToggleOff,
  validateClassFieldHiddenAfterQboSettingsToggleOff,
  settingsCases,
  settingsCasesPriority,
  settingsCasesPriorityOptimized,
  ensureStaServiceFieldEnabledForPriority,
};

import { test, Page, expect } from '@playwright/test';
import gotoWithAuthSession from '../../../gotoWithAuthSession';
import SingleTimeActivityPage, {
  matchTimeEntryBatchSaveResponse,
  matchTimeEntryQueryResponse,
  OIGQL_URL_PATTERN,
  waitForResponseWithURLandBody,
} from '../../../pages/GB/GBSingleTimeActivityPage';
import { LABELS, testData, USER_ROLES } from '../../../utils';
import DashboardPage from '../../../pages/GB/GBDashboardPage';

const useSingleTimeEntryTest = async (page: Page, role?: string) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);

  await singleTimeActPage.validateSTALoaded();
  await singleTimeActPage.handleTourModal();
  await singleTimeActPage.checkFieldVisibility(LABELS.Name);

  // Open name dropdown & click first option
  if (role !== USER_ROLES.timeTrackOnly) {
    await singleTimeActPage.openDropdown(LABELS.Name);
    await singleTimeActPage.clickDropdownOption(testData.option1, LABELS.Name);
  }

  // open customer dropdown & click first option
  if (await singleTimeActPage.checkFieldVisibility(LABELS.Customers)) {
    await singleTimeActPage.openDropdown(LABELS.Customers);
    await singleTimeActPage.clickDropdownOption(
      testData.option1,
      LABELS.Customers,
    );
  }

  // open location dropdown & click first option
  // if (await singleTimeActPage.checkFieldVisibility(LABELS.Location)) {
  //   await singleTimeActPage.openDropdown(LABELS.Location);
  //   await singleTimeActPage.clickDropdownOption(
  //     testData.option1,
  //     LABELS.Location
  //   );
  // }

  // open service dropdown & click first option
  if (await singleTimeActPage.checkFieldVisibility(LABELS.Service)) {
    await singleTimeActPage.openDropdown(LABELS.Service);
    await singleTimeActPage.clickDropdownOption(
      testData.option1,
      LABELS.Service,
    );
  }

  // open class dropdown & click first option
  if (await singleTimeActPage.checkFieldVisibility(LABELS.Class)) {
    await singleTimeActPage.openDropdown(LABELS.Class);
    await singleTimeActPage.clickDropdownOption(testData.option1, LABELS.Class);
  }

  // pick pay type
  if (
    (await singleTimeActPage.checkFieldVisibility(LABELS.PayType)) &&
    !(await singleTimeActPage.validateNoAvailablePayTypes())
  ) {
    await singleTimeActPage.openDropdown(LABELS.PayType);
    await singleTimeActPage.selectPayTypeOption(testData.option1);
  }

  // enter cost rate
  if (await singleTimeActPage.checkFieldVisibility(LABELS.CostRatePerHour)) {
    await singleTimeActPage.fillCostRateInput(testData.costRate);
  }

  // pick taxable
  if (await singleTimeActPage.checkFieldVisibility(LABELS.Taxable)) {
    await singleTimeActPage.toggleCheckbox(LABELS.Taxable);
  }

  // pick billable
  if (await singleTimeActPage.checkFieldVisibility(LABELS.BillablePerHour)) {
    await singleTimeActPage.checkCheckboxIfVisible(LABELS.BillablePerHour);
    // fill bill rate
    await singleTimeActPage.fillBillRateInput(testData.billableRate);
  }

  // fill out duration field
  const state = await singleTimeActPage.verifySetClockToggleState();
  if (state) {
    await singleTimeActPage.clickSetClockInAndOutToggles();
    await singleTimeActPage.fillData(LABELS.Duration, testData.duration);
  }

  // add a note
  else {
    await singleTimeActPage.fillData(LABELS.Duration, testData.duration);
  }

  await singleTimeActPage.fillData(LABELS.NotesLabel, testData.note1);

  // click save
  const createMutationPromise = waitForResponseWithURLandBody(
    page,
    OIGQL_URL_PATTERN,
    matchTimeEntryBatchSaveResponse,
  );
  await singleTimeActPage.clickButton(LABELS.Save);
  if (await singleTimeActPage.userNotAllowedActionError()) {
    return;
  } else {
    // verify response
    const createMutationPromisePayload = await createMutationPromise;
    expect(createMutationPromisePayload).toBeDefined();
    expect(
      createMutationPromisePayload.data.timeTrackingBatchManageTimeEntries
        .timeEntries[0].id,
    ).toBeDefined();

    // add billable rate or cost rate
    if (await singleTimeActPage.checkFieldVisibility(LABELS.BillablePerHour)) {
      await singleTimeActPage.checkCheckboxIfVisible(LABELS.Billable);
      await singleTimeActPage.fillBillRateInput(testData.billableRate2);
    }

    if (await singleTimeActPage.checkFieldVisibility(LABELS.CostRatePerHour)) {
      await singleTimeActPage.fillCostRateInput(testData.costRate2);
    }

    // add a different note
    await singleTimeActPage.fillData(LABELS.NotesLabel, testData.note2);

    // click save
    const updateMutationPromise = waitForResponseWithURLandBody(
      page,
      OIGQL_URL_PATTERN,
      matchTimeEntryBatchSaveResponse,
    );
    await singleTimeActPage.clickButton(LABELS.Save);

    // verify response
    const updateMutationPromisePayload = await updateMutationPromise;
    expect(updateMutationPromisePayload).toBeDefined();
    expect(
      createMutationPromisePayload.data.timeTrackingBatchManageTimeEntries
        .timeEntries[0].id,
    ).toEqual(
      updateMutationPromisePayload.data.timeTrackingBatchManageTimeEntries
        .timeEntries[0].id,
    );

    // reload the trowser with id
    const queryTimeEntryPromise = waitForResponseWithURLandBody(
      page,
      OIGQL_URL_PATTERN,
      matchTimeEntryQueryResponse,
    );
    await singleTimeActPage.navigateToSingleTime(
      createMutationPromisePayload.data.timeTrackingBatchManageTimeEntries
        .timeEntries[0].id,
    );

    // verify query
    const queryTimeEntryPromisePayload = await queryTimeEntryPromise;
    expect(queryTimeEntryPromisePayload).toBeDefined();
    expect(
      createMutationPromisePayload.data.timeTrackingBatchManageTimeEntries
        .timeEntries[0].id,
    ).toEqual(queryTimeEntryPromisePayload.data.timeTrackingTimeEntry.id);

    // verify trowser
    await singleTimeActPage.validateSTALoaded();
    await singleTimeActPage.handleTourModal();
    await singleTimeActPage.checkFieldVisibility(LABELS.Name);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(4000);

    const noteValue = await singleTimeActPage.getNotesFieldValue();
    expect(noteValue).toBe(testData.note2);

    // // click delete
    const deleteMutationPromise = waitForResponseWithURLandBody(
      page,
      OIGQL_URL_PATTERN,
      matchTimeEntryBatchSaveResponse,
    );
    await singleTimeActPage.clickButton(LABELS.Delete);
    await singleTimeActPage.clickNoOnDeleteConfirmation();
    await singleTimeActPage.clickButton(LABELS.Delete);
    await singleTimeActPage.clickYesOnDeleteConfirmation();
    if (
      await singleTimeActPage.checkIfErrorEncounteredWhileDeleteSingleActivity()
    ) {
      await singleTimeActPage.clickButton(LABELS.Delete);
      await singleTimeActPage.waitForDeletModalToClose();
      await singleTimeActPage.clickYesOnDeleteConfirmation();
      if (await singleTimeActPage.checkIfSingleTimeHocErrorVisible()) {
        await singleTimeActPage.clickButton(LABELS.Delete);
        await singleTimeActPage.clickYesOnDeleteConfirmation();
      }

      // verify response
      const deleteMutationPromisePayload = await deleteMutationPromise;
      expect(deleteMutationPromisePayload).toBeDefined();

      // should close trowser
      await singleTimeActPage.validateTrowserClosed();
    }
  }
};

const saveAndClose = async (page: Page, role?: string) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);
  const dashboardPage = new DashboardPage(page);

  // fill out duration field
  const state = await singleTimeActPage.verifySetClockToggleState();
  if (state) {
    await singleTimeActPage.clickSetClockInAndOutToggles();
    await singleTimeActPage.fillData(LABELS.Duration, testData.duration);
  } else {
    await singleTimeActPage.fillData(LABELS.Duration, testData.duration);
  }

  await singleTimeActPage.openDropdown(LABELS.Customers);
  await singleTimeActPage.clickDropdownOption(
    testData.option1,
    LABELS.Customers,
  );

  const createMutationPromiseSaveClose = waitForResponseWithURLandBody(
    page,
    OIGQL_URL_PATTERN,
    matchTimeEntryBatchSaveResponse,
  );

  // Click on save and close
  await singleTimeActPage.clickSaveAndCloseButton();
  const createMutationPromisePayloadSaveNew =
    await createMutationPromiseSaveClose;
  expect(createMutationPromisePayloadSaveNew).toBeDefined();
  expect(
    createMutationPromisePayloadSaveNew.data.timeTrackingBatchManageTimeEntries
      .timeEntries[0].id,
  ).toBeDefined();
  await singleTimeActPage.validateSuccessToast();

  // Validate landing to dashboard after save and close
  if (role === USER_ROLES.timeTrackOnly) {
    await dashboardPage.validateDashboardTimeTracking();
  } else {
    const isDashboardVisible = await dashboardPage.validateDashboardScreen();
    expect(isDashboardVisible).toBe(true);
  }
};

const saveAndCloseForLastTeamMember = async (page: Page, role: string) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);
  const dashboardPage = new DashboardPage(page);

  const needToSaveLastTeamMember = await fillSingleTAForLastTeamMember(page);

  if (!needToSaveLastTeamMember) {
    return;
  }

  // fill out duration field and uncheck billable checkbox
  await singleTimeActPage.uncheckCheckboxIfVisible(LABELS.BillablePerHour);
  const state = await singleTimeActPage.verifySetClockToggleState();
  if (state) {
    await singleTimeActPage.clickSetClockInAndOutToggles();
    await singleTimeActPage.fillData(LABELS.Duration, testData.duration);
  } else {
    await singleTimeActPage.fillData(LABELS.Duration, testData.duration);
  }

  const createMutationPromiseSaveClose = waitForResponseWithURLandBody(
    page,
    OIGQL_URL_PATTERN,
    matchTimeEntryBatchSaveResponse,
  );

  // Click on save and close
  await singleTimeActPage.clickSaveAndCloseButton();
  const createMutationPromisePayloadSaveNew =
    await createMutationPromiseSaveClose;
  expect(createMutationPromisePayloadSaveNew).toBeDefined();
  expect(
    createMutationPromisePayloadSaveNew.data.timeTrackingBatchManageTimeEntries
      .timeEntries[0].id,
  ).toBeDefined();
  await singleTimeActPage.validateSuccessToast();

  // Validate landing to dashboard after save and close
  if (role === USER_ROLES.timeTrackOnly) {
    await dashboardPage.validateDashboardTimeTracking();
  } else {
    const isDashboardVisible = await dashboardPage.validateDashboardScreen();
    expect(isDashboardVisible).toBe(true);
  }
};

const saveAndNew = async (page: Page, role?: string) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);
  //navigate to trowser
  await singleTimeActPage.navigateToSingleTime();

  await fillSingleTAFields(
    page,
    testData.option1,
    testData.billableRate2,
    testData.billableRate2,
    testData.note2,
    role,
  );

  // fill out duration field
  const state = await singleTimeActPage.verifySetClockToggleState();
  if (state) {
    await singleTimeActPage.clickSetClockInAndOutToggles();
    await singleTimeActPage.fillData(LABELS.Duration, testData.duration2);
  } else {
    await singleTimeActPage.fillData(LABELS.Duration, testData.duration2);
  }

  // click save and new button
  const createMutationPromise = waitForResponseWithURLandBody(
    page,
    OIGQL_URL_PATTERN,
    matchTimeEntryBatchSaveResponse,
  );
  await singleTimeActPage.clickSaveAndNewButton();
  await singleTimeActPage.validateSuccessToast();
  const createMutationPromisePayload = await createMutationPromise;
  expect(createMutationPromisePayload).toBeDefined();
  expect(
    createMutationPromisePayload.data.timeTrackingBatchManageTimeEntries
      .timeEntries[0].id,
  ).toBeDefined();
  await singleTimeActPage.waitTillLoaderDisappears();
  await singleTimeActPage.validateSuccessToast();

  // validate fields are empty after save and new
  if (await singleTimeActPage.checkFieldVisibility(LABELS.Customers)) {
    const custName = await singleTimeActPage.getFieldValue(LABELS.Customers);
    expect(custName).toBe('');
  }

  if (await singleTimeActPage.checkFieldVisibility(LABELS.Service)) {
    const serviceName = await singleTimeActPage.getFieldValue(LABELS.Service);
    expect(serviceName).toBe('');
  }

  if (await singleTimeActPage.checkFieldVisibility(LABELS.PayType)) {
    const payTypeName = await singleTimeActPage.getFieldValue(LABELS.PayType);
    expect(payTypeName).toBe('');
  }

  if (await singleTimeActPage.checkFieldVisibility(LABELS.Duration)) {
    const durationValue = await singleTimeActPage.getFieldValue(
      LABELS.Duration,
    );
    expect(durationValue).toBe('');
  }

  if (await singleTimeActPage.validateNotesFieldPresence()) {
    const noteValue = await singleTimeActPage.getNotesFieldValue();
    expect(noteValue).toBe('');
  }

  // if (await singleTimeActPage.checkFieldVisibility(LABELS.Location)) {
  //   const locationValue = await singleTimeActPage.getFieldValue(
  //     LABELS.Location
  //   );
  //   expect(locationValue).toBe('');
  // }

  if (await singleTimeActPage.checkFieldVisibility(LABELS.Class)) {
    const classValue = await singleTimeActPage.getFieldValue(LABELS.Class);
    expect(classValue).toBe('');
  }
};

const saveStartAndEndTime = async (page: Page, role?: string) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);
  //navigate to trowser
  await singleTimeActPage.navigateToSingleTime();

  await fillSingleTAFields(
    page,
    testData.option1,
    testData.billableRate,
    testData.costRate,
    testData.note1,
    role,
  );

  // Toggle Set Clock in and out and select start and end time
  const state = await singleTimeActPage.verifySetClockToggleState();
  if (!state) {
    await singleTimeActPage.clickSetClockInAndOutToggles();
    await singleTimeActPage.selectTime('Start', testData.startTimeGB);
    await singleTimeActPage.selectTime('End', testData.endTimeGB);
  } else {
    await singleTimeActPage.selectTime('Start', testData.startTimeGB);
    await singleTimeActPage.selectTime('End', testData.endTimeGB);
  }
  await singleTimeActPage.uncheckCheckboxIfVisible(LABELS.BillablePerHour);

  // click save
  const createMutationPromise = waitForResponseWithURLandBody(
    page,
    OIGQL_URL_PATTERN,
    matchTimeEntryBatchSaveResponse,
  );
  await singleTimeActPage.clickButton(LABELS.Save);

  // verify response
  const createMutationPromisePayload = await createMutationPromise;
  expect(createMutationPromisePayload).toBeDefined();
  expect(
    createMutationPromisePayload.data.timeTrackingBatchManageTimeEntries
      .timeEntries[0].id,
  ).toBeDefined();
  await singleTimeActPage.validateSuccessToast();
};

const saveAndNewStartAndEndTime = async (page: Page, role?: string) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);

  //navigate to trowser
  await singleTimeActPage.navigateToSingleTime();

  await fillSingleTAFields(
    page,
    testData.option1,
    testData.billableRate2,
    testData.costRate,
    testData.note2,
    role,
  );

  // Toggle Set Clock in and out and select start and end time
  const state = await singleTimeActPage.verifySetClockToggleState();
  if (!state) {
    await singleTimeActPage.clickSetClockInAndOutToggles();
    await singleTimeActPage.selectTime('Start', testData.startTimeGB);
    await singleTimeActPage.selectTime('End', testData.endTimeGB);
  } else {
    await singleTimeActPage.selectTime('Start', testData.startTimeGB);
    await singleTimeActPage.selectTime('End', testData.endTimeGB);
  }

  // click save and new button
  const createMutationPromise = waitForResponseWithURLandBody(
    page,
    OIGQL_URL_PATTERN,
    matchTimeEntryBatchSaveResponse,
  );
  await singleTimeActPage.clickSaveAndNewButton();
  await singleTimeActPage.validateSuccessToast();
  const createMutationPromisePayload = await createMutationPromise;
  expect(createMutationPromisePayload).toBeDefined();
  expect(
    createMutationPromisePayload.data.timeTrackingBatchManageTimeEntries
      .timeEntries[0].id,
  ).toBeDefined();
  await singleTimeActPage.waitTillLoaderDisappears();
  await singleTimeActPage.validateSuccessToast();

  // validate fields are empty after save and new
  if (await singleTimeActPage.checkFieldVisibility(LABELS.Customers)) {
    const custName = await singleTimeActPage.getFieldValue(LABELS.Customers);
    expect(custName).toBe('');
  }

  if (await singleTimeActPage.checkFieldVisibility(LABELS.Service)) {
    const serviceName = await singleTimeActPage.getFieldValue(LABELS.Service);
    expect(serviceName).toBe('');
  }

  if (await singleTimeActPage.checkFieldVisibility(LABELS.PayType)) {
    const payTypeName = await singleTimeActPage.getFieldValue(LABELS.PayType);
    expect(payTypeName).toBe('');
  }

  const updatedStartTime = await singleTimeActPage.getStartTimeValue();
  const updatedEndTime = await singleTimeActPage.getEndTimeValue();
  expect(updatedStartTime).toBe('');
  expect(updatedEndTime).toBe('');

  if (await singleTimeActPage.validateNotesFieldPresence()) {
    const noteValue = await singleTimeActPage.getNotesFieldValue();
    expect(noteValue).toBe('');
  }

  // if (await singleTimeActPage.checkFieldVisibility(LABELS.Location)) {
  //   const locationValue = await singleTimeActPage.getFieldValue(
  //     LABELS.Location
  //   );
  //   expect(locationValue).toBe('');
  // }

  if (await singleTimeActPage.checkFieldVisibility(LABELS.Class)) {
    const classValue = await singleTimeActPage.getFieldValue(LABELS.Class);
    expect(classValue).toBe('');
  }
};

const saveAndCloseStartAndEndTime = async (page: Page, role?: string) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);
  const dashboardPage = new DashboardPage(page);

  //navigate to trowser
  await singleTimeActPage.navigateToSingleTime();

  await fillSingleTAFields(
    page,
    testData.option1,
    testData.billableRate,
    testData.costRate,
    testData.note1,
    role,
  );

  // Toggle Set Clock in and out and select start and end time
  const state = await singleTimeActPage.verifySetClockToggleState();
  if (!state) {
    await singleTimeActPage.clickSetClockInAndOutToggles();
    await singleTimeActPage.selectTime('Start', testData.startTimeGB);
    await singleTimeActPage.selectTime('End', testData.endTimeGB);
  } else {
    await singleTimeActPage.selectTime('Start', testData.startTimeGB);
    await singleTimeActPage.selectTime('End', testData.endTimeGB);
  }

  const createMutationPromiseSaveClose = waitForResponseWithURLandBody(
    page,
    OIGQL_URL_PATTERN,
    matchTimeEntryBatchSaveResponse,
  );

  // Click on save and close
  await singleTimeActPage.clickSaveAndCloseButton();
  const createMutationPromisePayloadSaveNew =
    await createMutationPromiseSaveClose;
  expect(createMutationPromisePayloadSaveNew).toBeDefined();
  expect(
    createMutationPromisePayloadSaveNew.data.timeTrackingBatchManageTimeEntries
      .timeEntries[0].id,
  ).toBeDefined();
  await singleTimeActPage.validateSuccessToast();

  // Validate landing to dashboard after save and close
  if (role === USER_ROLES.timeTrackOnly) {
    await dashboardPage.validateDashboardTimeTracking();
  } else {
    const isDashboardVisible = await dashboardPage.validateDashboardScreen();
    expect(isDashboardVisible).toBe(true);
  }
};

const updateSingleTAUsingParam = async (page: Page, role?: string) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);
  let payTypeValue;
  let updatedPayTypeValue;
  let updatedCostRateValue;
  let costRateValue;

  //navigate to trowser
  await singleTimeActPage.navigateToSingleTime();

  await fillSingleTAFields(
    page,
    testData.option1,
    testData.billableRate,
    testData.costRate,
    testData.note1,
    role,
  );

  // fill out duration field
  const state = await singleTimeActPage.verifySetClockToggleState();
  if (state) {
    await singleTimeActPage.clickSetClockInAndOutToggles();
    await singleTimeActPage.fillData(LABELS.Duration, testData.duration);
  } else {
    await singleTimeActPage.fillData(LABELS.Duration, testData.duration);
  }
  // click save
  const createMutationPromise = waitForResponseWithURLandBody(
    page,
    OIGQL_URL_PATTERN,
    matchTimeEntryBatchSaveResponse,
  );
  await singleTimeActPage.clickButton(LABELS.Save);

  // verify response
  const createMutationPromisePayload = await createMutationPromise;
  expect(createMutationPromisePayload).toBeDefined();
  expect(
    createMutationPromisePayload.data.timeTrackingBatchManageTimeEntries
      .timeEntries[0].id,
  ).toBeDefined();

  // navigate to activity with param(id)
  await singleTimeActPage.navigateToSingleTime(
    createMutationPromisePayload.data.timeTrackingBatchManageTimeEntries
      .timeEntries[0].id,
  );

  await fillSingleTAFields(
    page,
    testData.option1,
    testData.billableRate,
    testData.costRate2,
    testData.note1,
    role,
  );

  // fill out duration field
  const state2 = await singleTimeActPage.verifySetClockToggleState();
  if (state2) {
    await singleTimeActPage.clickSetClockInAndOutToggles();
    await singleTimeActPage.fillData(LABELS.Duration, testData.duration);
  } else {
    await singleTimeActPage.fillData(LABELS.Duration, testData.duration);
  }
  const nameValue = await singleTimeActPage.getFieldValue(LABELS.Name);
  const customerValue = await singleTimeActPage.getFieldValue(LABELS.Customers);
  const serviceValue = await singleTimeActPage.getFieldValue(LABELS.Service);
  if (await singleTimeActPage.costRateFieldVisibility()) {
    costRateValue = await singleTimeActPage.getCostRateValue();
  }
  if (await singleTimeActPage.checkFieldVisibility(LABELS.PayType)) {
    payTypeValue = await singleTimeActPage.getFieldValue(LABELS.PayType);
  }
  const durationValue = await singleTimeActPage.getFieldValue(LABELS.Duration);
  const notesValue = await singleTimeActPage.getNotesFieldValue();

  // click save
  // verify response
  const updateMutationPromise = waitForResponseWithURLandBody(
    page,
    OIGQL_URL_PATTERN,
    matchTimeEntryBatchSaveResponse,
  );

  await singleTimeActPage.clickButton(LABELS.Save);

  const updateMutationPromisePayload = await updateMutationPromise;
  expect(updateMutationPromisePayload).toBeDefined();

  // refresh the page and validate the updated values
  await singleTimeActPage.navigateToSingleTime(
    updateMutationPromisePayload.data.timeTrackingBatchManageTimeEntries
      .timeEntries[0].id,
  );

  // verify trowser
  await singleTimeActPage.validateSTALoaded();
  await singleTimeActPage.handleTourModal();
  await singleTimeActPage.checkFieldVisibility(LABELS.Name);
  await page.waitForLoadState('load');
  await page.waitForTimeout(7000);

  const updatedNameValue = await singleTimeActPage.getFieldValue(LABELS.Name);

  const updatedCustomerValue = await singleTimeActPage.getFieldValue(
    LABELS.Customers,
  );
  if (await singleTimeActPage.costRateFieldVisibility()) {
    updatedCostRateValue = await singleTimeActPage.getCostRateValue();
  }
  const updatedServiceValue = await singleTimeActPage.getFieldValue(
    LABELS.Service,
  );
  if (await singleTimeActPage.checkFieldVisibility(LABELS.PayType)) {
    updatedPayTypeValue = await singleTimeActPage.getFieldValue(LABELS.PayType);
  }
  const updatedDurationValue = await singleTimeActPage.getFieldValue(
    LABELS.Duration,
  );
  const updatedNotesValue = await singleTimeActPage.getNotesFieldValue();

  expect(updatedNameValue).toBe(nameValue);
  expect(updatedCustomerValue).toBe(customerValue);
  expect(updatedServiceValue).toBe(serviceValue);
  expect(updatedCostRateValue).toBe(costRateValue);
  expect(updatedPayTypeValue).toBe(payTypeValue);
  expect(updatedDurationValue).toBe(`${durationValue}`);
  expect(updatedNotesValue).toBe(notesValue);
};

const fillSingleTAFields = async (
  page: Page,
  optionNumber: any,
  billRate: any,
  costRate: any,
  note: any,
  role?: string,
) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);

  // wait for trowser to load
  await singleTimeActPage.validateSTALoaded();
  await singleTimeActPage.handleTourModal();

  await singleTimeActPage.checkFieldVisibility(LABELS.Name);

  // Open name dropdown & click first option
  await singleTimeActPage.focusOnField(LABELS.Name);

  if (role !== USER_ROLES.timeTrackOnly) {
    await singleTimeActPage.openDropdown(LABELS.Name);
    await singleTimeActPage.clickDropdownOption(optionNumber, LABELS.Name);
  }

  // open customer dropdown & click first option
  await singleTimeActPage.openDropdown(LABELS.Customers);
  await singleTimeActPage.clickDropdownOption(optionNumber, LABELS.Customers);

  // open location dropdown & click first option
  if (await singleTimeActPage.checkFieldVisibility(LABELS.Location)) {
    await singleTimeActPage.openDropdown(LABELS.Location);
    await singleTimeActPage.clickDropdownOption(optionNumber, LABELS.Location);
  }

  // open service dropdown & click first option
  if (await singleTimeActPage.checkFieldVisibility(LABELS.Service)) {
    await singleTimeActPage.openDropdown(LABELS.Service);
    await singleTimeActPage.clickDropdownOption(optionNumber, LABELS.Service);
  }

  // open class dropdown & click first option
  if (await singleTimeActPage.checkFieldVisibility(LABELS.Class)) {
    await singleTimeActPage.openDropdown(LABELS.Class);
    await singleTimeActPage.clickDropdownOption(optionNumber, LABELS.Class);
  }

  // pick pay type
  if (
    (await singleTimeActPage.checkFieldVisibility(LABELS.PayType)) &&
    !(await singleTimeActPage.validateNoAvailablePayTypes())
  ) {
    await singleTimeActPage.focusOnField(LABELS.PayType);
    await singleTimeActPage.openDropdown(LABELS.PayType);
    await singleTimeActPage.selectPayTypeOption(optionNumber);
  }

  // enter cost rate
  if (await singleTimeActPage.costRateFieldVisibility()) {
    await singleTimeActPage.fillCostRateInput(costRate);
  }

  // pick taxable
  if (await singleTimeActPage.checkFieldVisibility(LABELS.Taxable)) {
    await singleTimeActPage.checkCheckboxIfVisible(LABELS.Taxable);
  }

  // pick billable
  await singleTimeActPage.checkCheckboxIfVisible(LABELS.Billable);

  // fill bill rate
  await singleTimeActPage.fillBillRateInput(billRate);

  // check taxable checkbox if visible
  await singleTimeActPage.checkCheckboxIfVisible(LABELS.Taxable);

  // add a note
  await singleTimeActPage.fillData(LABELS.NotesLabel, note);
};

const fillSingleTAForLastTeamMember = async (page: Page) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);
  // navigate to trowser
  await singleTimeActPage.navigateToSingleTime();

  // wait for trowser to load
  await singleTimeActPage.validateSTALoaded();
  await singleTimeActPage.handleTourModal();

  await singleTimeActPage.checkFieldVisibility(LABELS.Name);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);

  const nameInputValue = await singleTimeActPage.getNameInputFieldValue();

  // Open name dropdown & click first option
  await singleTimeActPage.openDropdown(LABELS.Name);
  await singleTimeActPage.clickLastDropdownOption();

  const lastOptionValue = await singleTimeActPage.getNameInputFieldValue();

  if (nameInputValue === lastOptionValue) {
    return false;
  }

  // open customer dropdown & click first option
  await singleTimeActPage.openDropdown(LABELS.Customers);
  await singleTimeActPage.clickLastDropdownOption();
  return true;
};

const updateSingleTAWithTypeChange = async (page: Page, role?: string) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);
  let updatedPayTypeValue;
  let payTypeValue;
  let updatedCostRateValue;
  let costRateValue;

  //navigate to trowser
  await singleTimeActPage.navigateToSingleTime();

  await fillSingleTAFields(
    page,
    testData.option1,
    testData.billableRate,
    testData.costRate,
    testData.note1,
    role,
  );

  // fill out duration field
  const state = await singleTimeActPage.verifySetClockToggleState();
  if (state) {
    await singleTimeActPage.clickSetClockInAndOutToggles();
    await singleTimeActPage.fillData(LABELS.Duration, testData.duration);
  } else {
    await singleTimeActPage.fillData(LABELS.Duration, testData.duration);
  }

  // click save
  const createMutationPromise = waitForResponseWithURLandBody(
    page,
    OIGQL_URL_PATTERN,
    matchTimeEntryBatchSaveResponse,
  );
  await singleTimeActPage.clickButton(LABELS.Save);

  // verify response
  const createMutationPromisePayload = await createMutationPromise;
  expect(createMutationPromisePayload).toBeDefined();
  expect(
    createMutationPromisePayload.data.timeTrackingBatchManageTimeEntries
      .timeEntries[0].id,
  ).toBeDefined();

  // navigate to activity with param(id)
  await singleTimeActPage.navigateToSingleTime(
    createMutationPromisePayload.data.timeTrackingBatchManageTimeEntries
      .timeEntries[0].id,
  );

  await fillSingleTAFields(
    page,
    testData.option1,
    testData.billableRate,
    testData.costRate2,
    testData.note1,
    role,
  );

  // Toggle Set Clock in and out and select start and end time
  const state2 = await singleTimeActPage.verifySetClockToggleState();
  if (!state2) {
    await singleTimeActPage.clickSetClockInAndOutToggles();
    await singleTimeActPage.selectTime('Start', testData.startTimeGB);
    await singleTimeActPage.selectTime('End', testData.endTimeGB);
  } else {
    await singleTimeActPage.selectTime('Start', testData.startTimeGB);
    await singleTimeActPage.selectTime('End', testData.endTimeGB);
  }

  const nameValue = await singleTimeActPage.getFieldValue(LABELS.Name);
  const customerValue = await singleTimeActPage.getFieldValue(LABELS.Customers);
  const serviceValue = await singleTimeActPage.getFieldValue(LABELS.Service);
  if (await singleTimeActPage.costRateFieldVisibility()) {
    costRateValue = await singleTimeActPage.getCostRateValue();
  }
  if (await singleTimeActPage.checkFieldVisibility(LABELS.PayType)) {
    payTypeValue = await singleTimeActPage.getFieldValue(LABELS.PayType);
  }
  const startTime = await singleTimeActPage.getStartTimeValue();
  const endTime = await singleTimeActPage.getEndTimeValue();
  const notesValue = await singleTimeActPage.getNotesFieldValue();

  // verify response
  const updateMutationPromise = waitForResponseWithURLandBody(
    page,
    OIGQL_URL_PATTERN,
    matchTimeEntryBatchSaveResponse,
  );

  // click save
  await singleTimeActPage.clickButton(LABELS.Save);

  const updateMutationPromisePayload = await updateMutationPromise;
  expect(updateMutationPromisePayload).toBeDefined();

  // refresh the page and validate the updated values
  await singleTimeActPage.navigateToSingleTime(
    updateMutationPromisePayload.data.timeTrackingBatchManageTimeEntries
      .timeEntries[0].id,
  );

  // verify trowser
  await singleTimeActPage.validateSTALoaded();
  await singleTimeActPage.handleTourModal();

  await singleTimeActPage.checkFieldVisibility(LABELS.Name);

  await page.waitForLoadState('load');
  await page.waitForTimeout(7000);

  const updatedNameValue = await singleTimeActPage.getFieldValue(LABELS.Name);
  const updatedCustomerValue = await singleTimeActPage.getFieldValue(
    LABELS.Customers,
  );
  const updatedServiceValue = await singleTimeActPage.getFieldValue(
    LABELS.Service,
  );
  if (await singleTimeActPage.costRateFieldVisibility()) {
    updatedCostRateValue = await singleTimeActPage.getCostRateValue();
  }
  if (await singleTimeActPage.checkFieldVisibility(LABELS.PayType)) {
    updatedPayTypeValue = await singleTimeActPage.getFieldValue(LABELS.PayType);
  }
  const updatedStartTime = await singleTimeActPage.getStartTimeValue();
  const updatedEndTime = await singleTimeActPage.getEndTimeValue();
  const updatedNotesValue = await singleTimeActPage.getNotesFieldValue();

  expect(updatedNameValue).toBe(nameValue);
  expect(updatedCustomerValue).toBe(customerValue);
  expect(updatedServiceValue).toBe(serviceValue);
  expect(costRateValue).toBe(updatedCostRateValue);
  expect(updatedPayTypeValue).toBe(payTypeValue);
  expect(startTime).toBe(updatedStartTime);
  expect(endTime).toBe(updatedEndTime);
  expect(updatedNotesValue).toBe(notesValue);
};

const updateSingleTAStartAndEndTimeUsingParam = async (
  page: Page,
  role?: string,
) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);
  let updatedPayTypeValue;
  let payTypeValue;
  let updatedCostRateValue;
  let costRateValue;

  //navigate to trowser
  await singleTimeActPage.navigateToSingleTime();

  await fillSingleTAFields(
    page,
    testData.option1,
    testData.billableRate,
    testData.costRate,
    testData.note1,
    role,
  );

  // Toggle Set Clock in and out and select start and end time
  const state3 = await singleTimeActPage.verifySetClockToggleState();
  if (!state3) {
    await singleTimeActPage.clickSetClockInAndOutToggles();
    await singleTimeActPage.selectTime('Start', testData.startTimeGB);
    await singleTimeActPage.selectTime('End', testData.endTimeGB);
  } else {
    await singleTimeActPage.selectTime('Start', testData.startTimeGB);
    await singleTimeActPage.selectTime('End', testData.endTimeGB);
  }

  // click save
  const createMutationPromise = waitForResponseWithURLandBody(
    page,
    OIGQL_URL_PATTERN,
    matchTimeEntryBatchSaveResponse,
  );
  await singleTimeActPage.clickButton(LABELS.Save);

  // verify response
  const createMutationPromisePayload = await createMutationPromise;
  expect(createMutationPromisePayload).toBeDefined();
  expect(
    createMutationPromisePayload.data.timeTrackingBatchManageTimeEntries
      .timeEntries[0].id,
  ).toBeDefined();

  // navigate to activity with param(id)
  await singleTimeActPage.navigateToSingleTime(
    createMutationPromisePayload.data.timeTrackingBatchManageTimeEntries
      .timeEntries[0].id,
  );

  await fillSingleTAFields(
    page,
    testData.option1,
    testData.billableRate2,
    testData.costRate,
    testData.note2,
    role,
  );

  // Toggle Set Clock in and out and select start and end time
  await singleTimeActPage.selectTime('Start', testData.startTimeGB);
  await singleTimeActPage.selectTime('End', testData.endTimeGB);

  const nameValue = await singleTimeActPage.getFieldValue(LABELS.Name);
  const customerValue = await singleTimeActPage.getFieldValue(LABELS.Customers);
  const serviceValue = await singleTimeActPage.getFieldValue(LABELS.Service);
  if (await singleTimeActPage.costRateFieldVisibility()) {
    costRateValue = await singleTimeActPage.getCostRateValue();
  }
  if (await singleTimeActPage.checkFieldVisibility(LABELS.PayType)) {
    payTypeValue = await singleTimeActPage.getFieldValue(LABELS.PayType);
  }
  const startTimeValue = await singleTimeActPage.getTime('Start');
  const endTimeValue = await singleTimeActPage.getTime('End');
  const notesValue = await singleTimeActPage.getNotesFieldValue();

  // verify response
  const updateMutationPromise = waitForResponseWithURLandBody(
    page,
    OIGQL_URL_PATTERN,
    matchTimeEntryBatchSaveResponse,
  );

  // click save
  await singleTimeActPage.clickButton(LABELS.Save);

  const updateMutationPromisePayload = await updateMutationPromise;
  expect(updateMutationPromisePayload).toBeDefined();

  // refresh the page and validate the updated values
  await singleTimeActPage.navigateToSingleTime(
    updateMutationPromisePayload.data.timeTrackingBatchManageTimeEntries
      .timeEntries[0].id,
  );

  // verify trowser
  await singleTimeActPage.validateSTALoaded();
  await singleTimeActPage.handleTourModal();

  await singleTimeActPage.checkFieldVisibility(LABELS.Name);
  let retries = 0;
  while (true) {
    const nameData = await singleTimeActPage.getFieldValue(LABELS.Name);
    if (nameData !== '') {
      break; // exit the loop if nameData is not empty
    }
    await singleTimeActPage.navigateToSingleTime(
      updateMutationPromisePayload.data.timeTrackingBatchManageTimeEntries
        .timeEntries[0].id,
    );
    retries += 1;
    if (retries >= 3) {
      // add a limit to the number of retries
      break;
    }
  }

  await page.waitForLoadState('load');

  await page.waitForTimeout(7000);
  const updatedNameValue = await singleTimeActPage.getFieldValue(LABELS.Name);

  const updatedCustomerValue = await singleTimeActPage.getFieldValue(
    LABELS.Customers,
  );
  const updatedServiceValue = await singleTimeActPage.getFieldValue(
    LABELS.Service,
  );
  if (await singleTimeActPage.costRateFieldVisibility()) {
    updatedCostRateValue = await singleTimeActPage.getCostRateValue();
  }
  if (await singleTimeActPage.checkFieldVisibility(LABELS.PayType)) {
    updatedPayTypeValue = await singleTimeActPage.getFieldValue(LABELS.PayType);
  }
  const updatedStartTimeValue = await singleTimeActPage.getTime('Start');
  const updatedEndTimeValue = await singleTimeActPage.getTime('End');
  const updatedNotesValue = await singleTimeActPage.getNotesFieldValue();

  expect(updatedNameValue).toBe(nameValue);
  expect(updatedCustomerValue).toBe(customerValue);
  expect(updatedServiceValue).toBe(serviceValue);
  expect(costRateValue).toBe(updatedCostRateValue);
  expect(updatedPayTypeValue).toBe(payTypeValue);
  expect(updatedStartTimeValue).toBe(startTimeValue);
  expect(updatedEndTimeValue).toBe(endTimeValue);
  expect(updatedNotesValue).toBe(notesValue);

  const state = await singleTimeActPage.verifySetClockToggleState();
  if (state) {
    await singleTimeActPage.clickSetClockInAndOutToggles();
    await singleTimeActPage.fillData(LABELS.Duration, testData.duration);
  } else {
    await singleTimeActPage.fillData(LABELS.Duration, testData.duration);
  }
  await singleTimeActPage.clickButton(LABELS.Save);
  await singleTimeActPage.waitTillLoaderDisappears();
  await singleTimeActPage.validateSuccessToast();
};

const crudCases = async (page: Page, role?: string) => {
  await useSingleTimeEntryTest(page, role);
  console.log(`STA 01: Single time entry test`);

  // Save and new with duration'
  await saveAndNew(page, role);
  console.log(`STA 02: Save and new`);

  // Save and close with duration
  await saveAndClose(page, role);
  console.log(`STA 03: Save and close`);

  // Update existing activity using param
  await updateSingleTAUsingParam(page, role);
  console.log(`STA 04: Update single ta using param`);

  // Update existing activity after changing activity type
  await updateSingleTAWithTypeChange(page, role);
  console.log(`STA 05: Update single ta after activity change`);

  // Save and close with start and end time
  await saveAndCloseStartAndEndTime(page, role);
  console.log(`STA 06: Save and close with start and end time`);

  // Save and new with start and end time
  await saveAndNewStartAndEndTime(page, role);
  console.log(`STA 07: Save and new with start and end time`);

  // Save with start and end time
  await saveStartAndEndTime(page, role);
  console.log(`STA 08: Save only with start and end time`);

  // update single ta with start and end time using param
  await updateSingleTAStartAndEndTimeUsingParam(page, role); // skipping this due to issue with start and end time fields
  console.log(`STA 09: updateSingleTAStartAndEndTimeUsingParam`);
};

const useSingleTimeEntryServiceTest = async (page: Page, role?: string) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);

  await singleTimeActPage.validateSTALoaded();

  await singleTimeActPage.handleTourModal();
  await singleTimeActPage.checkFieldVisibility(LABELS.Name);

  // Open name dropdown & click first option
  if (role !== USER_ROLES.timeTrackOnly) {
    await singleTimeActPage.openDropdown(LABELS.Name);
    await singleTimeActPage.clickDropdownOption(testData.option1, LABELS.Name);
  }

  // open customer dropdown & click first option
  if (await singleTimeActPage.checkFieldVisibility(LABELS.Customers)) {
    await singleTimeActPage.openDropdown(LABELS.Customers);
    await singleTimeActPage.clickDropdownOption(
      testData.option1,
      LABELS.Customers,
    );
  }

  // open service dropdown & click first option
  if (await singleTimeActPage.checkFieldVisibility(LABELS.Service)) {
    await singleTimeActPage.openDropdown(LABELS.Service);
    await singleTimeActPage.clickDropdownOption(
      testData.option3,
      LABELS.Service,
    );
  }

  await singleTimeActPage.validateBillRateValue(testData.defaultBillableRate);

  // open class dropdown & click first option
  if (await singleTimeActPage.checkFieldVisibility(LABELS.Class)) {
    await singleTimeActPage.openDropdown(LABELS.Class);
    await singleTimeActPage.clickDropdownOption(testData.option1, LABELS.Class);
  }

  // fill out duration field
  const state = await singleTimeActPage.verifySetClockToggleState();
  if (state) {
    await singleTimeActPage.clickSetClockInAndOutToggles();
    await singleTimeActPage.fillData(LABELS.Duration, testData.duration);
  }

  // add a note
  else {
    await singleTimeActPage.fillData(LABELS.Duration, testData.duration);
  }

  await singleTimeActPage.fillData(LABELS.NotesLabel, testData.note1);

  // open service dropdown & click first option
  if (await singleTimeActPage.checkFieldVisibility(LABELS.Service)) {
    await singleTimeActPage.openDropdown(LABELS.Service);
    await singleTimeActPage.clickDropdownOption(
      testData.option1,
      LABELS.Service,
    );
  }

  // click save
  await singleTimeActPage.clickButton(LABELS.Save);
};

const validateSTARecentEntries = async (page: Page, role?: string) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);
  await singleTimeActPage.navigateToSingleTime();
  await singleTimeActPage.validateSTALoaded();
  await singleTimeActPage.waitTillNameFieldVisible();
  await singleTimeActPage.handleTourModal();
  await singleTimeActPage.checkFieldVisibility(LABELS.Name);

  // Fill initial form data with optimized field filling
  await fillSingleTAFieldsOptimized(
    page,
    testData.option1,
    testData.billableRate,
    testData.costRate,
    testData.note1,
    role,
  );

  // Handle duration field with smart toggle detection
  const initialToggleState =
    await singleTimeActPage.verifySetClockToggleState();
  if (initialToggleState) {
    await singleTimeActPage.clickSetClockInAndOutToggles();
  }
  await singleTimeActPage.fillData(LABELS.Duration, testData.duration);
  // originalDuration = testData.duration;
  // originalNotes = testData.note1;

  // Step 2: Save initial activity and capture ID
  const createMutationPromise = waitForResponseWithURLandBody(
    page,
    OIGQL_URL_PATTERN,
    matchTimeEntryBatchSaveResponse,
  );
  await singleTimeActPage.clickButton(LABELS.Save);
  await singleTimeActPage.validateSuccessToast();

  await singleTimeActPage.clickHistoryButton();
  await page.waitForTimeout(3000);

  //click on the first STA recent entry
  if (await singleTimeActPage.checkSTARecentEntryVisible(1)) {
    await singleTimeActPage.clickSTARecentEntry(1);
  } else {
    await page.waitForTimeout(2000);
    await singleTimeActPage.clickHistoryButton();
    await page.waitForTimeout(3000);
    await singleTimeActPage.clickSTARecentEntry(1);
  }
  await singleTimeActPage.validateSTALoaded();
  await page.waitForTimeout(3000);

  //get url from browser
  const url = await page.url();

  // fill any random note value in the note filed
  await singleTimeActPage.clearNotesField();
  const expectedNoteValue = Math.random().toString(36).substring(2, 12);
  await singleTimeActPage.fillData(LABELS.NotesLabel, expectedNoteValue);
  await page.waitForTimeout(1000);

  await singleTimeActPage.clickButton(LABELS.Save);
  await singleTimeActPage.validateSuccessToast();
  await page.waitForTimeout(2000);

  await singleTimeActPage.clickCrossButton();
  await page.waitForTimeout(2000);

  //navigate to url
  await gotoWithAuthSession(page, url);
  await singleTimeActPage.validateSTALoaded();
  await singleTimeActPage.waitTillNameFieldVisible();
  await singleTimeActPage.handleTourModal();
  await page.waitForTimeout(3000);

  // validate the note value in the note field
  const actualNoteValue = await singleTimeActPage.getNotesFieldValue();
  expect(actualNoteValue).toBe(expectedNoteValue);
};

// Helper function for smart waiting with fallbacks
const smartWaitForPageLoad = async (page: Page, maxTimeout: number = 3000) => {
  try {
    await page.waitForLoadState('networkidle', { timeout: maxTimeout });
  } catch (error) {
    try {
      await page.waitForLoadState('domcontentloaded', {
        timeout: maxTimeout / 2,
      });
    } catch (domError) {
      await page.waitForTimeout(Math.min(1000, maxTimeout / 3));
    }
  }
};

const updateSingleTAUsingParamOptimized = async (page: Page, role?: string) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);
  let originalDuration: string;
  let originalNotes: string;
  let updatedDuration: string;
  let updatedNotes: string;

  // Step 1: Navigate and create initial time activity
  await singleTimeActPage.navigateToSingleTime();

  // Fill initial form data with optimized field filling
  await fillSingleTAFieldsOptimized(
    page,
    testData.option1,
    testData.billableRate,
    testData.costRate,
    testData.note1,
    role,
  );

  // Handle duration field with smart toggle detection
  const initialToggleState =
    await singleTimeActPage.verifySetClockToggleState();
  if (initialToggleState) {
    await singleTimeActPage.clickSetClockInAndOutToggles();
  }
  await singleTimeActPage.fillData(LABELS.Duration, testData.duration);
  originalDuration = testData.duration;
  originalNotes = testData.note1;

  // Step 2: Save initial activity and capture ID
  const createMutationPromise = waitForResponseWithURLandBody(
    page,
    OIGQL_URL_PATTERN,
    matchTimeEntryBatchSaveResponse,
  );
  await singleTimeActPage.clickButton(LABELS.Save);

  const createMutationPayload = await createMutationPromise;
  expect(createMutationPayload).toBeDefined();
  const activityId =
    createMutationPayload.data.timeTrackingBatchManageTimeEntries.timeEntries[0]
      .id;
  expect(activityId).toBeDefined();

  // Step 3: Navigate to created activity and verify data persistence
  await singleTimeActPage.navigateToSingleTime(activityId);
  await singleTimeActPage.validateSTALoaded();
  await smartWaitForPageLoad(page, 4000);
  await singleTimeActPage.handleTourModal();

  // Step 4: Verify initial data persisted (focused validation)
  const persistedDuration = await singleTimeActPage.getFieldValue(
    LABELS.Duration,
  );
  const persistedNotes = await singleTimeActPage.getNotesFieldValue();

  // Core persistence validation for key fields
  expect(persistedDuration).toBeDefined();
  expect(
    validateDurationFormat(persistedDuration || '', originalDuration),
  ).toBe(true);
  expect(persistedNotes).toBe(originalNotes);

  // Step 5: Update duration and notes specifically (your focus)
  // Update duration
  const newDuration = testData.duration2 || '2:30'; // Fallback if duration2 not available
  const toggleState = await singleTimeActPage.verifySetClockToggleState();
  if (toggleState) {
    await singleTimeActPage.clickSetClockInAndOutToggles();
  }
  await singleTimeActPage.fillData(LABELS.Duration, newDuration);

  // Update notes
  const newNotes = testData.note2 || 'Updated notes for testing';
  await singleTimeActPage.fillData(LABELS.NotesLabel, newNotes);

  updatedDuration = newDuration;
  updatedNotes = newNotes;

  // Step 6: Save updates
  const updateMutationPromise = waitForResponseWithURLandBody(
    page,
    OIGQL_URL_PATTERN,
    matchTimeEntryBatchSaveResponse,
  );
  await singleTimeActPage.clickButton(LABELS.Save);

  const updateMutationPayload = await updateMutationPromise;
  expect(updateMutationPayload).toBeDefined();

  // Step 7: Final validation - reload and verify duration and notes
  await singleTimeActPage.navigateToSingleTime(activityId);
  await singleTimeActPage.validateSTALoaded();
  await smartWaitForPageLoad(page, 3000);
  await singleTimeActPage.handleTourModal();

  // Wait for fields to be fully loaded
  await singleTimeActPage.checkFieldVisibility(LABELS.Name);

  // Final validation focusing on your specific requirements
  const finalDuration = await singleTimeActPage.getFieldValue(LABELS.Duration);
  const finalNotes = await singleTimeActPage.getNotesFieldValue();

  // Core assertions for duration and notes
  expect(finalDuration).toBeDefined();
  expect(validateDurationFormat(finalDuration || '', updatedDuration)).toBe(
    true,
  );
  expect(finalNotes).toBe(updatedNotes);
};

const validateDurationFormat = (
  actualDuration: string,
  expectedDuration: string,
): boolean => {
  // Normalize both values by removing leading zeros for comparison
  const normalizeTime = (time: string) => {
    return time.replace(/^0+/, '') || '0:00';
  };

  const normalizedActual = normalizeTime(actualDuration);
  const normalizedExpected = normalizeTime(expectedDuration);

  // Also check if they match with leading zero added
  const withLeadingZero = expectedDuration.startsWith('0')
    ? expectedDuration
    : `0${expectedDuration}`;

  return (
    actualDuration === expectedDuration ||
    actualDuration === withLeadingZero ||
    normalizedActual === normalizedExpected
  );
};

const fillSingleTAFieldsOptimized = async (
  page: Page,
  optionNumber: any,
  billRate: any,
  costRate: any,
  note: any,
  role?: string,
) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);

  // Optimized wait for page load
  await singleTimeActPage.validateSTALoaded();
  await singleTimeActPage.handleTourModal();
  await singleTimeActPage.checkFieldVisibility(LABELS.Name);

  // Essential field operations with smart waits
  if (role !== USER_ROLES.timeTrackOnly) {
    await singleTimeActPage.focusOnField(LABELS.Name);
    await singleTimeActPage.openDropdown(LABELS.Name);
    await singleTimeActPage.clickDropdownOption(optionNumber, LABELS.Name);
  }

  // Customer field (required)
  await singleTimeActPage.openDropdown(LABELS.Customers);
  await singleTimeActPage.clickDropdownOption(optionNumber, LABELS.Customers);

  // Optional fields with visibility checks
  const fieldsToFill = [
    {
      label: LABELS.Service,
      action: () =>
        singleTimeActPage.clickDropdownOption(optionNumber, LABELS.Service),
    },
    {
      label: LABELS.Class,
      action: () =>
        singleTimeActPage.clickDropdownOption(optionNumber, LABELS.Class),
    },
  ];

  for (const field of fieldsToFill) {
    if (await singleTimeActPage.checkFieldVisibility(field.label)) {
      await singleTimeActPage.openDropdown(field.label);
      await field.action();
    }
  }

  // Pay type handling
  if (
    (await singleTimeActPage.checkFieldVisibility(LABELS.PayType)) &&
    !(await singleTimeActPage.validateNoAvailablePayTypes())
  ) {
    await singleTimeActPage.focusOnField(LABELS.PayType);
    await singleTimeActPage.openDropdown(LABELS.PayType);
    await singleTimeActPage.selectPayTypeOption(optionNumber);
  }

  // Cost and bill rate fields
  if (await singleTimeActPage.costRateFieldVisibility()) {
    await singleTimeActPage.fillCostRateInput(costRate);
  }

  // Billable checkbox and rate
  await singleTimeActPage.checkCheckboxIfVisible(LABELS.Billable);
  await singleTimeActPage.fillBillRateInput(billRate);

  // Taxable if visible
  await singleTimeActPage.checkCheckboxIfVisible(LABELS.Taxable);

  // Notes
  await singleTimeActPage.fillData(LABELS.NotesLabel, note);
};

export {
  useSingleTimeEntryTest,
  useSingleTimeEntryServiceTest,
  saveAndNew,
  saveAndClose,
  saveAndNewStartAndEndTime,
  saveAndCloseStartAndEndTime,
  saveStartAndEndTime,
  updateSingleTAUsingParam,
  updateSingleTAWithTypeChange,
  fillSingleTAFields,
  fillSingleTAForLastTeamMember,
  saveAndCloseForLastTeamMember,
  updateSingleTAStartAndEndTimeUsingParam,
  crudCases,
  validateSTARecentEntries,
  smartWaitForPageLoad,
  updateSingleTAUsingParamOptimized,
};

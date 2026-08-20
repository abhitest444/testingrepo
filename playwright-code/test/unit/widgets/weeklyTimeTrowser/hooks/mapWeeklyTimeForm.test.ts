/* eslint-disable camelcase */
import dayjs from 'dayjs';
import { TimeForType } from 'src/js/widgets/common/addTimeFormComponents/TeamMember';
import { DEFAULT_UX_PREFERENCE_DATA_STATE } from 'src/js/service/utils/useUXPreferences';
import { WeeklyTimeFormState } from 'src/js/widgets/weeklyTimeTrowser/hooks/useWeeklyTimeForm';
import {
  computeFieldsWithData,
  extractDurations,
  isDurationLockedPending,
  isSameEntryInput,
  mapDuration,
  mapWeeklyTimeForm,
} from 'src/js/widgets/weeklyTimeTrowser/hooks/mapWeeklyTimeForm';
import { WeeklyTimeRowDurationState } from 'src/js/widgets/weeklyTimeTrowser/hooks/useWeeklyTimeFormRows';
import {
  TimeTracking_BatchCreateUpdateTimeEntryInput,
  TimeTracking_BillableStatus,
  TimeTracking_TimeForType,
} from 'src/__generated__/timeTracking/graphql';

import { MOCK_TIME_TRACKING_SETTINGS } from 'test/unit/service/queries/settingsQueries';

describe('mapWeeklyTimeForm', () => {
  it('should map form data to create input for employees', () => {
    const formState: WeeklyTimeFormState = {
      timeFor: { id: 'emp1', type: TimeForType.EMPLOYEE, name: '' },
      week: {
        startDate: dayjs('2023-10-10'),
        endDate: dayjs('2023-10-16'),
      },
      weeklyTimeRows: [
        {
          durations: [
            { id: '1', day: dayjs('2023-10-10'), duration: 7200, version: '1' },
            { day: dayjs('2023-10-11'), duration: 3600, version: '0' },
            { day: dayjs('2023-10-12'), duration: 3600, version: '0' },
            { day: dayjs('2023-10-13'), duration: 3600, version: '0' },
            { day: dayjs('2023-10-14'), duration: 3600, version: '0' },
            { day: dayjs('2023-10-15'), duration: 3600, version: '0' },
            { day: dayjs('2023-10-16'), duration: 3600, version: '0' },
          ],
          notes: 'Worked on project',
          timeAgainst: {
            customer: {
              id: 'cust1',
              name: '',
            },
            project: {
              id: 'proj1',
              name: '',
            },
          },
          service: {
            id: 'item1',
            name: '',
          },
          class: {
            id: 'class1',
            name: '',
          },
          location: {
            id: 'dept1',
            name: '',
          },
          payType: {
            id: 'pay1',
            name: '',
          },
          billable: true,
          billableStatus: TimeTracking_BillableStatus.Billable,
          billRate: 50,
          costRate: 30,
          taxable: true,
          id: 1,
        },
      ],
    };

    const result = mapWeeklyTimeForm({
      formState,
      settings: {
        ...MOCK_TIME_TRACKING_SETTINGS,
        classRequired: false,
        locationRequired: false,
        serviceItemRequired: false,
        timeSheetEntryMakesNotesRequiredEnabled: false,
      },
      preferences: DEFAULT_UX_PREFERENCE_DATA_STATE,
      hasPayroll: true,
      hasAdminAccess: true,
      hasProjects: true,
      defaultState: undefined,
    });

    // expect(result).toEqual(expected);
    expect(result.timeEntries?.length).toEqual(7);
  });

  it('should map form data with null durations to create input for employees with default data', () => {
    const formState: WeeklyTimeFormState = {
      timeFor: { id: 'emp1', type: TimeForType.EMPLOYEE, name: '' },
      week: {
        startDate: dayjs('2023-10-10'),
        endDate: dayjs('2023-10-16'),
      },
      weeklyTimeRows: [
        {
          durations: [
            { id: '1', day: dayjs('2023-10-10'), duration: 7200, version: '1' },
            { id: '2', day: dayjs('2023-10-11'), duration: 3600, version: '0' },
            { id: '3', day: dayjs('2023-10-12'), duration: 3600, version: '0' },
            { id: '4', day: dayjs('2023-10-13'), duration: 3600, version: '0' },
            { id: '5', day: dayjs('2023-10-14'), duration: 3600, version: '0' },
            { id: '8', day: dayjs('2023-10-13'), duration: null, version: '0' },
            { id: '9', day: dayjs('2023-10-14'), duration: null, version: '0' },
          ],
          notes: 'Worked on project',
          timeAgainst: {
            customer: {
              id: 'cust1',
              name: '',
            },
            project: {
              id: 'proj1',
              name: '',
            },
          },
          service: {
            id: 'item1',
            name: '',
          },
          class: {
            id: 'class1',
            name: '',
          },
          location: {
            id: 'dept1',
            name: '',
          },
          payType: {
            id: 'pay1',
            name: '',
          },
          billable: true,
          billableStatus: TimeTracking_BillableStatus.Billable,
          billRate: 50,
          costRate: 30,
          taxable: true,
          id: 1,
        },
      ],
    };

    const defaultState: WeeklyTimeFormState = {
      timeFor: { id: 'emp1', type: TimeForType.EMPLOYEE, name: '' },
      week: {
        startDate: dayjs('2023-10-10'),
        endDate: dayjs('2023-10-16'),
      },
      weeklyTimeRows: [
        {
          durations: [
            { id: '1', day: dayjs('2023-10-10'), duration: 0, version: '1' },
            { id: '2', day: dayjs('2023-10-11'), duration: 0, version: '0' },
            { id: '3', day: dayjs('2023-10-12'), duration: 0, version: '0' },
            { id: '4', day: dayjs('2023-10-13'), duration: 0, version: '0' },
            { id: '5', day: dayjs('2023-10-14'), duration: 0, version: '0' },
            { id: '6', day: dayjs('2023-10-15'), duration: 0, version: '0' },
            { id: '7', day: dayjs('2023-10-16'), duration: 0, version: '0' },
          ],
          notes: 'Worked on project',
          timeAgainst: {
            customer: {
              id: 'cust1',
              name: '',
            },
            project: {
              id: 'proj1',
              name: '',
            },
          },
          service: {
            id: 'item1',
            name: '',
          },
          class: {
            id: 'class1',
            name: '',
          },
          location: {
            id: 'dept1',
            name: '',
          },
          payType: {
            id: 'pay1',
            name: '',
          },
          billable: true,
          billableStatus: TimeTracking_BillableStatus.Billable,
          billRate: 50,
          costRate: 30,
          taxable: true,
          id: 1,
        },
      ],
    };

    const result = mapWeeklyTimeForm({
      formState,
      settings: {
        ...MOCK_TIME_TRACKING_SETTINGS,
        classRequired: false,
        locationRequired: false,
        serviceItemRequired: false,
        timeSheetEntryMakesNotesRequiredEnabled: false,
      },
      preferences: DEFAULT_UX_PREFERENCE_DATA_STATE,
      hasPayroll: true,
      hasAdminAccess: true,
      hasProjects: true,
      defaultState,
    });

    // expect(result).toEqual(expected);
    expect(result.timeEntriesToDelete?.length).toEqual(4);
  });

  // - hidden weekdays
  // - Vendor instead of Employee
  // - Different combinations of enabled/disabled fields
  // - Different settings configurations
});

describe('mapDuration', () => {
  const day = dayjs('2023-10-10');
  const formState = {
    timeFor: { id: 'emp1', type: TimeForType.EMPLOYEE, name: '' },
    week: { startDate: day, endDate: day.add(6, 'day') },
    weeklyTimeRows: [],
  };
  const row = {
    timeAgainst: {
      customer: {
        id: 'cust1',
        name: '',
      },
      project: {
        id: 'proj1',
        name: '',
      },
    },
    // customer: {
    //   id: 'cust1',
    //   name: '',
    // },
    // project: {
    //   id: 'proj1',
    //   name: '',
    // },
    service: {
      id: 'item1',
      name: '',
    },
    class: {
      id: 'class1',
      name: '',
    },
    location: {
      id: 'dept1',
      name: '',
    },
    payType: {
      id: 'pay1',
      name: '',
    },
    notes: 'Worked on project',
    billable: true,
    billableStatus: TimeTracking_BillableStatus.Billable,
    billRate: 50,
    costRate: 30,
    taxable: true,
    id: 1,
    durations: [
      {
        id: '1',
        day: dayjs('2023-10-10'),
        duration: 7200,
        version: '1',
      },
      {
        day: dayjs('2023-10-11'),
        duration: 3600,
        version: '0',
      },
      {
        day: dayjs('2023-10-12'),
        duration: 3600,
        version: '0',
      },
      {
        day: dayjs('2023-10-13'),
        duration: 3600,
        version: '0',
      },
      {
        day: dayjs('2023-10-14'),
        duration: 3600,
        version: '0',
      },
      {
        day: dayjs('2023-10-15'),
        duration: 3600,
        version: '0',
      },
      {
        day: dayjs('2023-10-16'),
        duration: 3600,
        version: '0',
      },
    ] as [
      WeeklyTimeRowDurationState,
      WeeklyTimeRowDurationState,
      WeeklyTimeRowDurationState,
      WeeklyTimeRowDurationState,
      WeeklyTimeRowDurationState,
      WeeklyTimeRowDurationState,
      WeeklyTimeRowDurationState,
    ],
  };
  const hideTimeEntryFields = {
    isClassFieldEnabled: true,
    isProjectFieldEnabled: true,
    isLocationFieldEnabled: true,
    isPayTypeFieldEnabled: true,
    isCostRateFieldEnabled: true,
    isTaxableFieldEnabled: true,
  };
  const settings = {
    ...MOCK_TIME_TRACKING_SETTINGS,
    classRequired: false,
    locationRequired: false,
    serviceItemRequired: false,
    timeSheetEntryMakesNotesRequiredEnabled: false,
  };

  it('should map required fields correctly for employee', () => {
    const durationState = {
      id: '1',
      day,
      duration: 7200,
      version: '0',
    };
    const result = mapDuration(
      durationState,
      false,
      formState,
      row,
      hideTimeEntryFields,
      settings,
      true,
    );

    expect(result).toEqual({
      billableRate: 50,
      billableStatus: 'BILLABLE',
      classID: 'class1',
      costRate: 30,
      date: '2023-10-10',
      departmentID: 'dept1',
      duration: 7200,
      id: '1',
      notes: 'Worked on project',
      payrollItemID: 'pay1',
      // projectId: 'proj1',
      serviceItemID: 'item1',
      taxable: true,
      timeAgainst: {
        customerId: 'cust1',
        projectId: 'proj1',
      },
      timeFor: {
        id: 'emp1',
        timeForType: 'EMPLOYEE',
      },
      version: '0',
    });
  });

  it('should map required fields correctly for vendor', () => {
    const durationState = {
      id: '1',
      day,
      duration: 3600,
      version: '0',
    };
    const result = mapDuration(
      durationState,
      true,
      formState,
      row,
      hideTimeEntryFields,
      settings,
      true,
    );

    expect(result).toEqual({
      billableRate: 50,
      billableStatus: 'BILLABLE',
      classID: 'class1',
      costRate: 30,
      date: '2023-10-10',
      departmentID: 'dept1',
      duration: 3600,
      id: '1',
      notes: 'Worked on project',
      // projectId: 'proj1',
      serviceItemID: 'item1',
      taxable: true,
      timeAgainst: {
        customerId: 'cust1',
        projectId: 'proj1',
      },
      timeFor: {
        id: 'emp1',
        timeForType: 'VENDOR',
      },
      version: '0',
    });
  });

  it('should handle missing optional fields', () => {
    const durationState = {
      id: undefined,
      day,
      duration: null,
      version: '0',
    };
    const rowWithoutOptionalFields = {
      ...row,
      timeAgainst: {
        project: {
          id: '',
          name: '',
        },
        customer: null,
      },
      // project: {
      //   id: '',
      //   name: '',
      // },
      // customer: {
      //   id: '',
      //   name: '',
      // },
      class: {
        id: '',
        name: '',
      },
      location: {
        id: '',
        name: '',
      },
      payType: {
        id: '',
        name: '',
      },
      service: {
        id: '',
        name: '',
      },
      costRate: 0,
      billable: false,
      taxable: false,
      billRate: null,
      billableStatus: TimeTracking_BillableStatus.NotBillable,
    };
    const result = mapDuration(
      durationState,
      false,
      formState,
      rowWithoutOptionalFields,
      hideTimeEntryFields,
      settings,
      false,
    );

    expect(result).toEqual({
      billableRate: null,
      costRate: 0,
      billableStatus: 'NOT_BILLABLE',
      date: '2023-10-10',
      duration: undefined,
      notes: 'Worked on project',
      timeAgainst: {
        customerId: undefined,
      },
      taxable: false,
      timeFor: {
        id: 'emp1',
        timeForType: 'EMPLOYEE',
      },
    });
  });

  it('should not include fields when settings or preferences are disabled', () => {
    const durationState = {
      id: '1',
      day,
      duration: 3600,
      version: '0',
    };
    const disabledSettings = {
      ...settings,
      isClassEnabled: false,
      isLocationEnabled: false,
      isBillingFieldEnabled: false,
      classRequired: false,
      locationRequired: false,
      serviceItemRequired: false,
      timeSheetEntryMakesNotesRequiredEnabled: false,
    };
    const disabledHideFields = {
      ...hideTimeEntryFields,
      isClassFieldEnabled: false,
      isLocationFieldEnabled: false,
      isCostRateFieldEnabled: false,
    };

    const result = mapDuration(
      durationState,
      false,
      formState,
      row,
      disabledHideFields,
      disabledSettings,
      false,
    );

    expect(result).toEqual({
      billableRate: null,
      billableStatus: 'NOT_BILLABLE',
      costRate: 30,
      date: '2023-10-10',
      duration: 3600,
      id: '1',
      notes: 'Worked on project',
      // projectId: 'proj1',
      taxable: true,
      serviceItemID: 'item1',
      timeAgainst: {
        customerId: 'cust1',
        projectId: 'proj1',
      },
      timeFor: {
        id: 'emp1',
        timeForType: 'EMPLOYEE',
      },
      version: '0',
    });

    // Edge case.  If CostRate, BillableRate or PayrollItemID are not visible (i.e. not an Admin user), but they are enabled they should be included in the output
    const result2 = mapDuration(
      durationState,
      false,
      formState,
      row,
      disabledHideFields,
      { ...disabledSettings, isBillingFieldEnabled: true },
      true, // Projects enabled
    );

    expect(result2).toEqual({
      billableRate: 50,
      billableStatus: 'BILLABLE',
      costRate: 30,
      payrollItemID: 'pay1',
      date: '2023-10-10',
      duration: 3600,
      id: '1',
      notes: 'Worked on project',
      // projectId: 'proj1',
      taxable: true,
      serviceItemID: 'item1',
      timeAgainst: {
        customerId: 'cust1',
        projectId: 'proj1',
      },
      timeFor: {
        id: 'emp1',
        timeForType: 'EMPLOYEE',
      },
      version: '0',
    });
  });

  it('should not include cost fields when no employee payroll access', () => {
    const durationState = {
      id: '1',
      day,
      duration: 3600,
      version: '0',
    };
    const disabledSettings = {
      ...settings,
      isClassEnabled: false,
      isLocationEnabled: false,
      isBillingFieldEnabled: true,
      classRequired: false,
      locationRequired: false,
      serviceItemRequired: false,
      timeSheetEntryMakesNotesRequiredEnabled: false,
    };
    const disabledHideFields = {
      ...hideTimeEntryFields,
      isClassFieldEnabled: false,
      isLocationFieldEnabled: false,
      isCostRateFieldEnabled: false,
    };

    const result = mapDuration(
      durationState,
      false,
      formState,
      row,
      disabledHideFields,
      disabledSettings,
      false,
    );

    expect(result).toEqual({
      billableRate: 50,
      billableStatus: 'BILLABLE',
      costRate: 30,
      date: '2023-10-10',
      duration: 3600,
      id: '1',
      notes: 'Worked on project',
      // projectId: 'proj1',
      taxable: true,
      serviceItemID: 'item1',
      timeAgainst: {
        customerId: 'cust1',
        projectId: 'proj1',
      },
      timeFor: {
        id: 'emp1',
        timeForType: 'EMPLOYEE',
      },
      version: '0',
    });

    // Edge case.  If CostRate, BillableRate or PayrollItemID are not visible (i.e. not an Admin user), but they are enabled they should be included in the output
    const result2 = mapDuration(
      durationState,
      false,
      formState,
      row,
      disabledHideFields,
      { ...disabledSettings, isBillingFieldEnabled: true },
      true, // Projects enabled
    );

    expect(result2).toEqual({
      billableRate: 50,
      billableStatus: 'BILLABLE',
      costRate: 30,
      payrollItemID: 'pay1',
      date: '2023-10-10',
      duration: 3600,
      id: '1',
      notes: 'Worked on project',
      // projectId: 'proj1',
      taxable: true,
      serviceItemID: 'item1',
      timeAgainst: {
        customerId: 'cust1',
        projectId: 'proj1',
      },
      timeFor: {
        id: 'emp1',
        timeForType: 'EMPLOYEE',
      },
      version: '0',
    });
  });

  describe('LEGACY_QBO_USER feature flag gating', () => {
    const durationState = {
      id: '1',
      day,
      duration: 7200,
      version: '0',
    };

    const legacyFormState = {
      ...formState,
      timeFor: {
        id: 'persona1',
        type: TimeForType.LEGACY_QBO_USER,
        name: '',
      },
    };

    it('should send timeForType=EMPLOYEE for LEGACY_QBO_USER when flag is OFF (default)', () => {
      const result = mapDuration(
        durationState,
        false,
        legacyFormState,
        row,
        hideTimeEntryFields,
        settings,
        true,
        // isLegacyQboUserEnabled defaults to false
      );

      expect(result.timeFor).toEqual({
        id: 'persona1',
        timeForType: 'EMPLOYEE',
      });
    });

    it('should send timeForType=LEGACY_QBO_USER for LEGACY_QBO_USER when flag is ON', () => {
      const result = mapDuration(
        durationState,
        false,
        legacyFormState,
        row,
        hideTimeEntryFields,
        settings,
        true,
        true, // isLegacyQboUserEnabled
      );

      expect(result.timeFor).toEqual({
        id: 'persona1',
        timeForType: 'LEGACY_QBO_USER',
      });
    });

    it('should still send VENDOR when isVendor=true even with flag ON', () => {
      const result = mapDuration(
        durationState,
        true, // isVendor
        legacyFormState,
        row,
        hideTimeEntryFields,
        settings,
        true,
        true,
      );

      expect(result.timeFor.timeForType).toEqual('VENDOR');
    });
  });

  it('should preserve HasBeenBilled billableStatus when billing is enabled', () => {
    const durationState = {
      id: '1',
      day,
      duration: 3600,
      version: '0',
    };
    const hasBeenBilledRow = {
      ...row,
      billableStatus: TimeTracking_BillableStatus.HasBeenBilled,
    };
    const result = mapDuration(
      durationState,
      false,
      formState,
      hasBeenBilledRow,
      hideTimeEntryFields,
      settings,
      true,
    );

    expect(result.billableStatus).toEqual('HAS_BEEN_BILLED');
  });
});

describe('computeFieldsWithData', () => {
  const blankRow = {
    id: 0,
    service: {
      id: '',
      name: '',
    },
    class: {
      id: '',
      name: '',
    },
    location: {
      id: '',
      name: '',
    },
    payType: {
      id: '',
      name: '',
    },
    billable: false,
    billRate: null,
    billableStatus: undefined,
    costRate: 0,
    taxable: false,
    timeAgainst: {
      customer: {
        id: '6',
        name: '',
      },
      project: {
        id: '',
        name: '',
      },
    },
    notes: '',
    durations: [],
  };

  const serviceAndClassRow = JSON.parse(JSON.stringify(blankRow));
  serviceAndClassRow.service.id = '1';
  serviceAndClassRow.class.id = '2';

  const billableTaxableCostRateRow = JSON.parse(JSON.stringify(blankRow));
  billableTaxableCostRateRow.billable = true;
  billableTaxableCostRateRow.taxable = true;
  billableTaxableCostRateRow.costRate = 40;

  const locationPayTypeRow = JSON.parse(JSON.stringify(blankRow));
  locationPayTypeRow.location.id = '3';
  locationPayTypeRow.payType.id = '4';

  const allTheThings = JSON.parse(JSON.stringify(blankRow));
  allTheThings.service.id = '1';
  allTheThings.class.id = '2';
  allTheThings.billable = true;
  allTheThings.billRate = 50;
  allTheThings.costRate = 40;
  allTheThings.taxable = true;
  allTheThings.location.id = '3';
  allTheThings.payType.id = '4';

  it('should show no modified fields with a blank row', () => {
    const result = computeFieldsWithData([blankRow]);
    expect(result).toEqual({
      hasServiceFieldData: false,
      hasBillingFieldData: false,
      hasClassFieldData: false,
      hasLocationFieldData: false,
      hasPayTypeFieldData: false,
      hasCostRateFieldData: false,
      hasTaxableFieldData: false,
    });
  });

  it('should show service and class were modified', () => {
    const result = computeFieldsWithData([blankRow, serviceAndClassRow]);
    expect(result).toEqual({
      hasServiceFieldData: true,
      hasBillingFieldData: false,
      hasClassFieldData: true,
      hasLocationFieldData: false,
      hasPayTypeFieldData: false,
      hasCostRateFieldData: false,
      hasTaxableFieldData: false,
    });
  });

  it('should show billable, taxable, and cost rate were modified', () => {
    const result = computeFieldsWithData([
      blankRow,
      billableTaxableCostRateRow,
    ]);
    expect(result).toEqual({
      hasServiceFieldData: false,
      hasBillingFieldData: true,
      hasClassFieldData: false,
      hasLocationFieldData: false,
      hasPayTypeFieldData: false,
      hasCostRateFieldData: true,
      hasTaxableFieldData: true,
    });
  });

  it('should not show billable if billable false and billable rate set', () => {
    const billableFalseBillableRateRow = JSON.parse(JSON.stringify(blankRow));
    billableFalseBillableRateRow.billable = false;
    billableFalseBillableRateRow.billRate = 50;
    const result = computeFieldsWithData([
      blankRow,
      billableFalseBillableRateRow,
    ]);
    expect(result).toEqual({
      hasServiceFieldData: false,
      hasBillingFieldData: false,
      hasClassFieldData: false,
      hasLocationFieldData: false,
      hasPayTypeFieldData: false,
      hasCostRateFieldData: false,
      hasTaxableFieldData: false,
    });
  });

  it('should show location and pay type were modified', () => {
    const result = computeFieldsWithData([blankRow, locationPayTypeRow]);
    expect(result).toEqual({
      hasServiceFieldData: false,
      hasBillingFieldData: false,
      hasClassFieldData: false,
      hasLocationFieldData: true,
      hasPayTypeFieldData: true,
      hasCostRateFieldData: false,
      hasTaxableFieldData: false,
    });
  });

  it('should show all the fields were modified with one row with all the changes', () => {
    const result = computeFieldsWithData([allTheThings]);
    expect(result).toEqual({
      hasServiceFieldData: true,
      hasBillingFieldData: true,
      hasClassFieldData: true,
      hasLocationFieldData: true,
      hasPayTypeFieldData: true,
      hasCostRateFieldData: true,
      hasTaxableFieldData: true,
    });
  });

  it('should show all the fields were modified given multiple rows with changes to all the fields', () => {
    const result = computeFieldsWithData([
      serviceAndClassRow,
      billableTaxableCostRateRow,
      locationPayTypeRow,
    ]);
    expect(result).toEqual({
      hasServiceFieldData: true,
      hasBillingFieldData: true,
      hasClassFieldData: true,
      hasLocationFieldData: true,
      hasPayTypeFieldData: true,
      hasCostRateFieldData: true,
      hasTaxableFieldData: true,
    });
  });

  it('should return empty array in case if durations is an empty array', () => {
    const result = extractDurations([blankRow]);
    expect(result).toEqual([]);
  });

  it('should return empty array in case if durations is undefined', () => {
    const result = extractDurations([{ ...blankRow, durations: undefined }]);
    expect(result).toEqual([]);
  });

  it('should return empty array in case if weekly time row state is undefined', () => {
    const result = extractDurations([undefined]);
    expect(result).toEqual([]);
  });
});

describe('isSameEntryInput', () => {
  const baseEntry: TimeTracking_BatchCreateUpdateTimeEntryInput = {
    date: '2023-10-10',
    duration: 3600,
    timeFor: { id: 'emp1', timeForType: TimeTracking_TimeForType.Employee },
    timeAgainst: { customerId: 'cust1', projectId: 'proj1' },
    billableStatus: TimeTracking_BillableStatus.Billable,
    billableRate: 50,
    costRate: 30,
    notes: 'Test notes',
    classID: 'class1',
    serviceItemID: 'item1',
    departmentID: 'dept1',
    payrollItemID: 'pay1',
    taxable: true,
  };

  it('should return true for identical entries', () => {
    expect(isSameEntryInput(baseEntry, { ...baseEntry })).toBe(true);
  });

  it('should return false when duration changes', () => {
    expect(isSameEntryInput(baseEntry, { ...baseEntry, duration: 7200 })).toBe(
      false,
    );
  });

  it('should return false when notes change', () => {
    expect(
      isSameEntryInput(baseEntry, { ...baseEntry, notes: 'Changed' }),
    ).toBe(false);
  });

  it('should return false when billableStatus changes', () => {
    expect(
      isSameEntryInput(baseEntry, {
        ...baseEntry,
        billableStatus: TimeTracking_BillableStatus.NotBillable,
      }),
    ).toBe(false);
  });

  it('should return false when billableRate changes', () => {
    expect(
      isSameEntryInput(baseEntry, { ...baseEntry, billableRate: 75 }),
    ).toBe(false);
  });

  it('should return false when costRate changes', () => {
    expect(isSameEntryInput(baseEntry, { ...baseEntry, costRate: 40 })).toBe(
      false,
    );
  });

  it('should return false when customerId changes', () => {
    expect(
      isSameEntryInput(baseEntry, {
        ...baseEntry,
        timeAgainst: { customerId: 'cust2', projectId: 'proj1' },
      }),
    ).toBe(false);
  });

  it('should return false when projectId changes', () => {
    expect(
      isSameEntryInput(baseEntry, {
        ...baseEntry,
        timeAgainst: { customerId: 'cust1', projectId: 'proj2' },
      }),
    ).toBe(false);
  });

  it('should return false when classID changes', () => {
    expect(
      isSameEntryInput(baseEntry, { ...baseEntry, classID: 'class2' }),
    ).toBe(false);
  });

  it('should return false when serviceItemID changes', () => {
    expect(
      isSameEntryInput(baseEntry, { ...baseEntry, serviceItemID: 'item2' }),
    ).toBe(false);
  });

  it('should return false when departmentID changes', () => {
    expect(
      isSameEntryInput(baseEntry, { ...baseEntry, departmentID: 'dept2' }),
    ).toBe(false);
  });

  it('should return false when payrollItemID changes', () => {
    expect(
      isSameEntryInput(baseEntry, { ...baseEntry, payrollItemID: 'pay2' }),
    ).toBe(false);
  });

  it('should return false when taxable changes', () => {
    expect(isSameEntryInput(baseEntry, { ...baseEntry, taxable: false })).toBe(
      false,
    );
  });

  it('should handle undefined optional fields consistently', () => {
    const a = { ...baseEntry, classID: undefined, payrollItemID: undefined };
    const b = { ...baseEntry, classID: undefined, payrollItemID: undefined };
    expect(isSameEntryInput(a, b)).toBe(true);
  });

  it('should return false when date changes', () => {
    expect(
      isSameEntryInput(baseEntry, { ...baseEntry, date: '2023-10-11' }),
    ).toBe(false);
  });

  it('should return false when timeFor.id changes', () => {
    expect(
      isSameEntryInput(baseEntry, {
        ...baseEntry,
        timeFor: {
          id: 'emp2',
          timeForType: TimeTracking_TimeForType.Employee,
        },
      }),
    ).toBe(false);
  });

  it('should return false when timeFor.timeForType changes', () => {
    expect(
      isSameEntryInput(baseEntry, {
        ...baseEntry,
        timeFor: {
          id: 'emp1',
          timeForType: TimeTracking_TimeForType.Vendor,
        },
      }),
    ).toBe(false);
  });

  it('should handle entries with undefined timeFor', () => {
    const a = {
      ...baseEntry,
      timeFor: undefined,
    } as unknown as TimeTracking_BatchCreateUpdateTimeEntryInput;
    const b = {
      ...baseEntry,
      timeFor: undefined,
    } as unknown as TimeTracking_BatchCreateUpdateTimeEntryInput;
    expect(isSameEntryInput(a, b)).toBe(true);
  });

  it('should handle entries with undefined timeAgainst', () => {
    const a = { ...baseEntry, timeAgainst: undefined };
    const b = { ...baseEntry, timeAgainst: undefined };
    expect(isSameEntryInput(a, b)).toBe(true);
  });
});

describe('mapWeeklyTimeForm - diff against baseline', () => {
  const day = dayjs('2023-10-10');
  const baseDurations = [
    { id: '1', day: dayjs('2023-10-10'), duration: 3600, version: '1' },
    { id: '2', day: dayjs('2023-10-11'), duration: 3600, version: '1' },
    { id: '3', day: dayjs('2023-10-12'), duration: 3600, version: '1' },
    { id: '4', day: dayjs('2023-10-13'), duration: 0, version: '1' },
    { id: '5', day: dayjs('2023-10-14'), duration: 0, version: '1' },
    { id: '6', day: dayjs('2023-10-15'), duration: null, version: '1' },
    { id: '7', day: dayjs('2023-10-16'), duration: null, version: '1' },
  ] as WeeklyTimeRowDurationState[];

  const baseRow = {
    durations: baseDurations,
    notes: 'Test notes',
    timeAgainst: {
      customer: { id: 'cust1', name: '' },
      project: { id: 'proj1', name: '' },
    },
    service: { id: 'item1', name: '' },
    class: { id: 'class1', name: '' },
    location: { id: 'dept1', name: '' },
    payType: { id: 'pay1', name: '' },
    billable: true,
    billableStatus: TimeTracking_BillableStatus.Billable,
    billRate: 50,
    costRate: 30,
    taxable: true,
    id: 1,
  };

  const baseFormState: WeeklyTimeFormState = {
    timeFor: { id: 'emp1', type: TimeForType.EMPLOYEE, name: '' },
    week: { startDate: day, endDate: day.add(6, 'day') },
    weeklyTimeRows: [baseRow],
  };

  const mapArgs = {
    settings: {
      ...MOCK_TIME_TRACKING_SETTINGS,
      classRequired: false,
      locationRequired: false,
      serviceItemRequired: false,
      timeSheetEntryMakesNotesRequiredEnabled: false,
    },
    preferences: DEFAULT_UX_PREFERENCE_DATA_STATE,
    hasPayroll: true,
    hasAdminAccess: true,
    hasProjects: true,
    isLegacyQboUserEnabled: false,
  };

  it('should return no timeEntries when form is unchanged from baseline', () => {
    const result = mapWeeklyTimeForm({
      ...mapArgs,
      formState: baseFormState,
      defaultState: baseFormState,
    });

    expect(result.timeEntries?.length).toEqual(0);
    // ids 6 & 7 have null duration in both form and default, so they appear in the
    // "null-duration entries with IDs" delete branch
    expect(result.timeEntriesToDelete?.length).toEqual(2);
  });

  it('should include only the changed entry when a single duration is edited', () => {
    const modifiedFormState: WeeklyTimeFormState = {
      ...baseFormState,
      weeklyTimeRows: [
        {
          ...baseRow,
          durations: baseDurations.map((d) =>
            d.id === '1' ? { ...d, duration: 7200 } : d,
          ),
        },
      ],
    };

    const result = mapWeeklyTimeForm({
      ...mapArgs,
      formState: modifiedFormState,
      defaultState: baseFormState,
    });

    expect(result.timeEntries?.length).toEqual(1);
    expect(result.timeEntries?.[0].id).toEqual('1');
    expect(result.timeEntries?.[0].duration).toEqual(7200);
  });

  it('should always include new entries (no id) as creates', () => {
    const newDuration: WeeklyTimeRowDurationState = {
      day: dayjs('2023-10-10'),
      duration: 1800,
      version: '0',
    };
    const formStateWithNew: WeeklyTimeFormState = {
      ...baseFormState,
      weeklyTimeRows: [
        baseRow,
        {
          ...baseRow,
          id: 0,
          durations: [newDuration, ...baseDurations.slice(1)],
        },
      ],
    };

    const result = mapWeeklyTimeForm({
      ...mapArgs,
      formState: formStateWithNew,
      defaultState: baseFormState,
    });

    const creates = result.timeEntries?.filter((e) => !e.id) || [];
    expect(creates.length).toBeGreaterThanOrEqual(1);
    expect(creates[0].duration).toEqual(1800);
  });

  it('should include entries when row-level fields change (e.g. notes)', () => {
    const modifiedFormState: WeeklyTimeFormState = {
      ...baseFormState,
      weeklyTimeRows: [
        {
          ...baseRow,
          notes: 'Updated notes',
        },
      ],
    };

    const result = mapWeeklyTimeForm({
      ...mapArgs,
      formState: modifiedFormState,
      defaultState: baseFormState,
    });

    const updatedEntries = result.timeEntries?.filter((e) => e.id) || [];
    expect(updatedEntries.length).toBeGreaterThan(0);
    updatedEntries.forEach((e) => {
      expect(e.notes).toEqual('Updated notes');
    });
  });

  it('should still produce correct deletes alongside filtered updates', () => {
    const modifiedFormState: WeeklyTimeFormState = {
      ...baseFormState,
      weeklyTimeRows: [
        {
          ...baseRow,
          durations: baseDurations.slice(0, 5),
        },
      ],
    };

    const result = mapWeeklyTimeForm({
      ...mapArgs,
      formState: modifiedFormState,
      defaultState: baseFormState,
    });

    const deletedIds = result.timeEntriesToDelete?.map((d) => d.id) || [];
    expect(deletedIds).toContain('6');
    expect(deletedIds).toContain('7');
  });

  it('should work correctly without a defaultState (all entries included)', () => {
    const result = mapWeeklyTimeForm({
      ...mapArgs,
      formState: baseFormState,
      defaultState: undefined,
    });

    expect(result.timeEntries?.length).toEqual(5);
  });

  it('should exclude TIMECHARGE_PENDING locked entries from timeEntries', () => {
    const lockedDurations = baseDurations.map((d) =>
      d.id === '1'
        ? { ...d, locked: true, lockedReason: 'TIMECHARGE_PENDING' }
        : d,
    ) as WeeklyTimeRowDurationState[];

    const lockedFormState: WeeklyTimeFormState = {
      ...baseFormState,
      weeklyTimeRows: [{ ...baseRow, durations: lockedDurations }],
    };

    const result = mapWeeklyTimeForm({
      ...mapArgs,
      formState: lockedFormState,
      defaultState: undefined,
    });

    const ids = result.timeEntries?.map((e) => e.id) || [];
    expect(ids).not.toContain('1');
  });

  it('should exclude TIMECHARGE_PENDING locked entries from timeEntriesToDelete', () => {
    const lockedDefaultDurations = baseDurations.map((d) =>
      d.id === '1'
        ? { ...d, locked: true, lockedReason: 'TIMECHARGE_PENDING' }
        : d,
    ) as WeeklyTimeRowDurationState[];

    const lockedDefaultState: WeeklyTimeFormState = {
      ...baseFormState,
      weeklyTimeRows: [{ ...baseRow, durations: lockedDefaultDurations }],
    };

    // Form has the locked entry removed — should NOT produce a delete for it
    const formWithoutEntry: WeeklyTimeFormState = {
      ...baseFormState,
      weeklyTimeRows: [
        { ...baseRow, durations: baseDurations.filter((d) => d.id !== '1') },
      ],
    };

    const result = mapWeeklyTimeForm({
      ...mapArgs,
      formState: formWithoutEntry,
      defaultState: lockedDefaultState,
    });

    const deletedIds = result.timeEntriesToDelete?.map((d) => d.id) || [];
    expect(deletedIds).not.toContain('1');
  });

  it('should handle null/undefined rows in defaultState weeklyTimeRows', () => {
    const defaultStateNullRow: WeeklyTimeFormState = {
      ...baseFormState,
      weeklyTimeRows: [null as any, undefined as any],
    };

    const result = mapWeeklyTimeForm({
      ...mapArgs,
      formState: baseFormState,
      defaultState: defaultStateNullRow,
    });

    expect(result.timeEntries?.length).toBeGreaterThan(0);
  });
});

describe('isDurationLockedPending', () => {
  it('should return true when locked and lockedReason is TIMECHARGE_PENDING', () => {
    const duration: WeeklyTimeRowDurationState = {
      day: dayjs('2023-10-10'),
      duration: 3600,
      version: '0',
      locked: true,
      lockedReason: 'TIMECHARGE_PENDING',
    };
    expect(isDurationLockedPending(duration)).toBe(true);
  });

  it('should return false when not locked', () => {
    const duration: WeeklyTimeRowDurationState = {
      day: dayjs('2023-10-10'),
      duration: 3600,
      version: '0',
      locked: false,
      lockedReason: 'TIMECHARGE_PENDING',
    };
    expect(isDurationLockedPending(duration)).toBe(false);
  });

  it('should return false when locked with a different reason', () => {
    const duration: WeeklyTimeRowDurationState = {
      day: dayjs('2023-10-10'),
      duration: 3600,
      version: '0',
      locked: true,
      lockedReason: 'OTHER_REASON',
    };
    expect(isDurationLockedPending(duration)).toBe(false);
  });

  it('should return false when locked and lockedReason are undefined', () => {
    const duration: WeeklyTimeRowDurationState = {
      day: dayjs('2023-10-10'),
      duration: 3600,
      version: '0',
    };
    expect(isDurationLockedPending(duration)).toBe(false);
  });
});

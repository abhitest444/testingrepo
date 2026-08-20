import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { WeeklyTimeFormState } from 'src/js/widgets/weeklyTimeTrowser/hooks/useWeeklyTimeForm';
// eslint-disable-next-line camelcase
import { TimeTracking_BillableStatus } from 'src/__generated__/timeTracking/graphql';
import {
  TIME_ENTRY_SPLIT_CTA_OPTIONS,
  UxPreferenceData,
  UxPreferenceKey,
} from '../../../../../src/js/service/utils/useUXPreferences';
import { exportWeeklyTimesheetExcel } from '../../../../../src/js/widgets/weeklyTimeTrowser/utils/ExportWeekelyTimeTable';
import { TimeForType } from '../../../../../src/js/widgets/common/addTimeFormComponents/TeamMember';

// Mock the XLSX library
jest.mock('xlsx', () => ({
  utils: {
    book_new: jest.fn(() => ({})),
    aoa_to_sheet: jest.fn(() => ({})),
    book_append_sheet: jest.fn(),
    encode_cell: jest.fn(({ c, r }) => `R${r}C${c}`),
  },
  writeFile: jest.fn(),
}));

describe('exportWeeklyTimesheetExcel', () => {
  const mockData: WeeklyTimeFormState = {
    timeFor: {
      id: '1',
      type: TimeForType.EMPLOYEE,
      name: 'test',
    },
    week: {
      startDate: dayjs('2023-10-01'),
      endDate: dayjs('2023-10-07'),
    },
    weeklyTimeRows: [
      {
        timeAgainst: {
          customer: { id: '1', name: 'Customer1' },
          project: { id: '2', name: 'Project1' },
        },
        service: { id: '1', name: 'Service1' },
        durations: [
          { duration: 3600, day: dayjs('2023-10-01'), version: '1' },
          { duration: 7200, day: dayjs('2023-10-02'), version: '1' },
        ],
        costRate: 50,
        billRate: 100,
        taxable: true,
        billable: true,
        notes: 'Sample note',
        class: { id: '3', name: 'Class1' },
        location: { id: '4', name: 'Location1' },
        payType: { id: '5', name: 'PayType1' },
        // eslint-disable-next-line camelcase
        billableStatus: TimeTracking_BillableStatus.Billable,
        id: 1,
      },
    ],
  };

  const mockPreferences: UxPreferenceData = {
    [UxPreferenceKey.HIDE_MODAL_UX_PREFERENCE]: false,
    [UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE]: {
      isSundayHidden: false,
      isMondayHidden: false,
      isTuesdayHidden: false,
      isWednesdayHidden: false,
      isThursdayHidden: false,
      isFridayHidden: false,
      isSaturdayHidden: false,
    },
    [UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS]: {
      isClassFieldEnabled: true,
      isProjectFieldEnabled: true,
      isLocationFieldEnabled: true,
      isPayTypeFieldEnabled: true,
      isCostRateFieldEnabled: true,
      isTaxableFieldEnabled: true,
    },
    [UxPreferenceKey.TIME_ENTRY_TIME_FOR]: {
      id: '1',
      type: TimeForType.EMPLOYEE,
      name: 'test',
    },
    [UxPreferenceKey.TIME_ENTRY_LAST_USED_START_END_TIME]: false,
    [UxPreferenceKey.TIME_ENTRY_SELECTED_SPLIT_CTA]:
      TIME_ENTRY_SPLIT_CTA_OPTIONS.SAVE_AND_NEW.key,
    [UxPreferenceKey.TIME_ENTRY_NEW_BADGE_VISIBLE]: {
      timeTrackingVisibilityEndDate: '',
      notificationVisibilityEndDate: '',
      breaksVisibilityEndDate: '',
      overtimeVisibilityEndDate: '',
      geoLocationsVisibilityEndDate: '',
      approvalsVisibilityEndDate: '',
      newTimesheetVisibilityEndDate: '',
      newCustomFieldsVisibilityEndDate: '',
      geofenceVisibilityEndDate: '',
      schedulesVisibilityEndDate: '',
    },
    [UxPreferenceKey.TIME_CLOCK_TOUR_COMPLETED]: false,
    [UxPreferenceKey.BREAKS_TOUR_COMPLETED]: false,
    [UxPreferenceKey.CUSTOM_FIELDS_TOUR_COMPLETED]: false,
    [UxPreferenceKey.WEEKLY_TIMESHEET_TOUR_COMPLETED]: false,
    [UxPreferenceKey.TIME_SHEET_GEN_AI_COLUMN_MAPPING]: '',
    [UxPreferenceKey.TIME_SHEET_GEN_AI_EMPLOYEE_MAPPING]: '',
    [UxPreferenceKey.TIME_SHEET_GEN_AI_PREFERENCES_SEEN]: '',
    [UxPreferenceKey.TIME_SHEET_GEN_AI_SKIP_FIELD_MAPPING]: '',
    [UxPreferenceKey.TIME_SHEET_GEN_AI_IMPOSE_8_HOUR_LIMIT]: false,
    [UxPreferenceKey.SINGLE_TIME_ACTIVITY_TOUR_COMPLETED]: false,
    [UxPreferenceKey.WEEKLY_TIMESHEET_PAGE_TOUR_COMPLETED]: false,
    [UxPreferenceKey.WEEKLY_REDIRECT_SHOWN]: false,
  };

  const mockSettings = {
    isBillingFieldEnabled: true,
    isTaxableFieldEnabled: true,
    isClassEnabled: true,
    isLocationEnabled: true,
    isServiceFieldEnabled: true,
    firstDayOfWeek: 1, // 0 (Sunday) to 6 (Saturday)
    entityVersion: '1',
    isCloseBookDateEnabled: true,
    isCloseBookPasswordEnabled: true,
    closeBookDate: dayjs('12/11/2024'),
    timezone: 'en-us',
    classRequired: false,
    locationRequired: false,
    serviceItemRequired: false,
    timeSheetEntryMakesNotesRequiredEnabled: false,
  };

  const mockIntl = {
    formatMessage: jest.fn(({ id }) => id),
  };

  const mockQuickFillFieldLabels = [
    { customer: 'Customer1', project: 'Project1', service: 'Service1' },
  ];

  it('should create a workbook and write an Excel file', () => {
    exportWeeklyTimesheetExcel(
      mockData,
      mockPreferences,
      mockSettings,
      true,
      true,
      true,
      '$',
      mockIntl,
      mockQuickFillFieldLabels,
    );

    expect(XLSX.utils.book_new).toHaveBeenCalled();
    expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalled();
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalled();
    expect(XLSX.writeFile).toHaveBeenCalledWith(
      expect.any(Object),
      'weekly_timesheet.xlsx',
      { cellStyles: true },
    );
  });

  it('should create a workbook and write an Excel file with null values handling', () => {
    exportWeeklyTimesheetExcel(
      {
        ...mockData,
        weeklyTimeRows: [
          {
            timeAgainst: {
              customer: null,
              project: { id: '2', name: 'Project1' },
            },
            service: { id: null, name: 'Service1' },
            durations: [
              { duration: 3600, day: dayjs('2023-10-01'), version: '1' },
              { duration: 7200, day: dayjs('2023-10-02'), version: '1' },
            ],
            costRate: 50,
            billRate: 100,
            taxable: false,
            billable: false,
            notes: 'Sample note',
            class: { id: '3', name: 'Class1' },
            location: { id: '4', name: 'Location1' },
            payType: { id: '5', name: 'PayType1' },
            // eslint-disable-next-line camelcase
            billableStatus: TimeTracking_BillableStatus.Billable,
            id: 1,
          },
        ],
      },
      mockPreferences,
      mockSettings,
      true,
      true,
      true,
      '$',
      mockIntl,
      mockQuickFillFieldLabels,
    );

    expect(XLSX.utils.book_new).toHaveBeenCalled();
    expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalled();
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalled();
    expect(XLSX.writeFile).toHaveBeenCalledWith(
      expect.any(Object),
      'weekly_timesheet.xlsx',
      { cellStyles: true },
    );
  });

  it('should format headers and data correctly', () => {
    exportWeeklyTimesheetExcel(
      mockData,
      mockPreferences,
      mockSettings,
      true,
      true,
      true,
      '$',
      mockIntl,
      mockQuickFillFieldLabels,
    );

    const expectedHeaders = [
      'Customer',
      'Project',
      'Service',
      'Cost Rate',
      'Hourly Rate',
      'Billable',
      'Taxable',
      'Description',
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Total Hours',
      'Billable',
    ];

    expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith(
      expect.arrayContaining([expectedHeaders]),
    );
  });

  it('should exclude hidden days (Monday and Tuesday) from headers', () => {
    const hiddenDaysPreferences: UxPreferenceData = {
      ...mockPreferences,
      [UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS]: {
        isClassFieldEnabled: true,
        isProjectFieldEnabled: true,
        isLocationFieldEnabled: true,
        isPayTypeFieldEnabled: true,
        isCostRateFieldEnabled: false,
        isTaxableFieldEnabled: true,
      },
      [UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE]: {
        isSundayHidden: false,
        isMondayHidden: true,
        isTuesdayHidden: true,
        isWednesdayHidden: false,
        isThursdayHidden: false,
        isFridayHidden: false,
        isSaturdayHidden: false,
      },
    };

    exportWeeklyTimesheetExcel(
      {
        ...mockData,
        weeklyTimeRows: [
          {
            timeAgainst: {
              customer: null,
              project: { id: '2', name: 'Project1' },
            },
            service: { id: null, name: 'Service1' },
            durations: [
              { duration: 3600, day: dayjs('2023-10-01'), version: '1' },
              { duration: 7200, day: dayjs('2023-10-02'), version: '1' },
            ],
            costRate: 50,
            billRate: null,
            taxable: false,
            billable: true,
            notes: 'Sample note',
            class: { id: '3', name: 'Class1' },
            location: { id: '4', name: 'Location1' },
            payType: { id: '5', name: 'PayType1' },
            // eslint-disable-next-line camelcase
            billableStatus: TimeTracking_BillableStatus.Billable,
            id: 1,
          },
        ],
      },
      hiddenDaysPreferences,
      {
        ...mockSettings,
        isBillingFieldEnabled: false,
      },
      true,
      true,
      true,
      '$',
      mockIntl,
      mockQuickFillFieldLabels,
    );

    const expectedHeadersWithoutHiddenDays = [
      'Customer',
      'Project',
      'Service',
      'Cost Rate',
      'Billable',
      'Taxable',
      'Description',
      'Sunday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Total Hours',
    ];

    expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith(
      expect.arrayContaining([expectedHeadersWithoutHiddenDays]),
    );
  });

  it('should apply center alignment styling to header cells', () => {
    // Create a mock worksheet with cell references
    const mockWorksheet: any = {
      R1C0: { v: 'Customer' },
      R1C1: { v: 'Project' },
      R1C2: { v: 'Service' },
      R1C3: { v: 'Cost Rate' },
      R1C4: { v: 'Hourly Rate' },
      R1C5: { v: 'Billable' },
      R1C6: { v: 'Taxable' },
      R1C7: { v: 'Description' },
      R1C8: { v: 'Sunday' },
      R1C9: { v: 'Monday' },
      R1C10: { v: 'Tuesday' },
      R1C11: { v: 'Wednesday' },
      R1C12: { v: 'Thursday' },
      R1C13: { v: 'Friday' },
      R1C14: { v: 'Saturday' },
      R1C15: { v: 'Total Hours' },
      R1C16: { v: 'Billable' },
      '!cols': expect.any(Array),
    };

    (XLSX.utils.aoa_to_sheet as jest.Mock).mockReturnValue(mockWorksheet);

    exportWeeklyTimesheetExcel(
      mockData,
      mockPreferences,
      mockSettings,
      true,
      true,
      true,
      '$',
      mockIntl,
      mockQuickFillFieldLabels,
    );

    // Verify that header cells have center alignment styling applied
    const expectedHeaders = [
      'Customer',
      'Project',
      'Service',
      'Cost Rate',
      'Hourly Rate',
      'Billable',
      'Taxable',
      'Description',
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Total Hours',
      'Billable',
    ];

    // Check that each header cell gets center alignment styling
    expectedHeaders.forEach((_, index) => {
      const expectedCellAddress = `R1C${index}`;
      if (mockWorksheet[expectedCellAddress]) {
        expect(mockWorksheet[expectedCellAddress].s).toEqual({
          alignment: { horizontal: 'center' },
        });
      }
    });

    expect(XLSX.utils.encode_cell).toHaveBeenCalled();
  });

  it('should handle falsy notes field correctly', () => {
    const dataWithEmptyNotes: WeeklyTimeFormState = {
      ...mockData,
      weeklyTimeRows: [
        {
          ...mockData.weeklyTimeRows[0],
          notes: '', // Testing empty string notes
        },
      ],
    };

    exportWeeklyTimesheetExcel(
      dataWithEmptyNotes,
      mockPreferences,
      mockSettings,
      true,
      true,
      true,
      '$',
      mockIntl,
      mockQuickFillFieldLabels,
    );

    expect(XLSX.utils.book_new).toHaveBeenCalled();
    expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalled();
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalled();
    expect(XLSX.writeFile).toHaveBeenCalledWith(
      expect.any(Object),
      'weekly_timesheet.xlsx',
      { cellStyles: true },
    );

    // Verify that the data includes an empty string for notes when empty
    const [worksheetDataCall] = (
      XLSX.utils.aoa_to_sheet as jest.Mock
    ).mock.calls.slice(-1);
    const worksheetData = worksheetDataCall[0];

    // Find the data row (should be after headers)
    const descriptionColIndex = worksheetData[1].indexOf('Description');
    const dataRow = worksheetData.find(
      (row: any[]) =>
        Array.isArray(row) &&
        row.length > descriptionColIndex &&
        row[descriptionColIndex] === '',
    );

    expect(dataRow).toBeDefined();
    expect(dataRow[descriptionColIndex]).toBe('');
  });

  it('should handle undefined notes field correctly', () => {
    const dataWithUndefinedNotes: WeeklyTimeFormState = {
      ...mockData,
      weeklyTimeRows: [
        {
          ...mockData.weeklyTimeRows[0],
          notes: undefined as any, // Testing undefined notes from API
        },
      ],
    };

    exportWeeklyTimesheetExcel(
      dataWithUndefinedNotes,
      mockPreferences,
      mockSettings,
      true,
      true,
      true,
      '$',
      mockIntl,
      mockQuickFillFieldLabels,
    );

    expect(XLSX.utils.book_new).toHaveBeenCalled();
    expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalled();
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalled();
    expect(XLSX.writeFile).toHaveBeenCalledWith(
      expect.any(Object),
      'weekly_timesheet.xlsx',
      { cellStyles: true },
    );

    // Verify that the data includes an empty string for notes when undefined
    const [worksheetDataCall] = (
      XLSX.utils.aoa_to_sheet as jest.Mock
    ).mock.calls.slice(-1);
    const worksheetData = worksheetDataCall[0];

    // Find the data row (should be after headers)
    const descriptionColIndex = worksheetData[1].indexOf('Description');
    const dataRow = worksheetData.find(
      (row: any[]) =>
        Array.isArray(row) &&
        row.length > descriptionColIndex &&
        row[descriptionColIndex] === '',
    );

    expect(dataRow).toBeDefined();
    expect(dataRow[descriptionColIndex]).toBe('');
  });

  it('should exclude Hourly Rate header and Billable amount column when isBillRateEnable is false', () => {
    jest.clearAllMocks();

    exportWeeklyTimesheetExcel(
      mockData,
      mockPreferences,
      mockSettings,
      true,
      true,
      true,
      '$',
      mockIntl,
      mockQuickFillFieldLabels,
      false, // isBillRateEnable
    );

    const [worksheetDataCall] = (
      XLSX.utils.aoa_to_sheet as jest.Mock
    ).mock.calls.slice(-1);
    const worksheetData = worksheetDataCall[0];

    // Headers should NOT contain 'Hourly Rate' or trailing 'Billable'
    const headers = worksheetData[1];
    expect(headers).not.toContain('Hourly Rate');
    expect(headers[headers.length - 1]).toBe('Total Hours');

    // Billable Yes/No column should still be present
    expect(headers).toContain('Billable');

    // Data rows should not have a trailing billable amount column
    const dataRow = worksheetData[2];
    const lastValue = dataRow[dataRow.length - 1];
    expect(lastValue).not.toMatch(/^\$/);
  });

  it('should include Hourly Rate header and Billable amount column when isBillRateEnable is true', () => {
    jest.clearAllMocks();

    exportWeeklyTimesheetExcel(
      mockData,
      mockPreferences,
      mockSettings,
      true,
      true,
      true,
      '$',
      mockIntl,
      mockQuickFillFieldLabels,
      true, // isBillRateEnable
    );

    const [worksheetDataCall] = (
      XLSX.utils.aoa_to_sheet as jest.Mock
    ).mock.calls.slice(-1);
    const worksheetData = worksheetDataCall[0];

    // Headers should contain 'Hourly Rate' and trailing 'Billable'
    const headers = worksheetData[1];
    expect(headers).toContain('Hourly Rate');
    expect(headers[headers.length - 1]).toBe('Billable');

    // Data rows should have a trailing billable amount with currency symbol
    const dataRow = worksheetData[2];
    const lastValue = dataRow[dataRow.length - 1];
    expect(lastValue).toMatch(/^\$/);

    // Total row should also have billable amount
    const totalRow = worksheetData[worksheetData.length - 1];
    const totalLastValue = totalRow[totalRow.length - 1];
    expect(totalLastValue).toMatch(/^\$/);
  });

  it('should default isBillRateEnable to true when not provided', () => {
    jest.clearAllMocks();

    exportWeeklyTimesheetExcel(
      mockData,
      mockPreferences,
      mockSettings,
      true,
      true,
      true,
      '$',
      mockIntl,
      mockQuickFillFieldLabels,
    );

    const [worksheetDataCall] = (
      XLSX.utils.aoa_to_sheet as jest.Mock
    ).mock.calls.slice(-1);
    const worksheetData = worksheetDataCall[0];

    // Should include Hourly Rate and Billable amount by default
    const headers = worksheetData[1];
    expect(headers).toContain('Hourly Rate');
    expect(headers[headers.length - 1]).toBe('Billable');
  });

  it('should have correct total row column alignment when isBillRateEnable is false', () => {
    jest.clearAllMocks();

    exportWeeklyTimesheetExcel(
      mockData,
      mockPreferences,
      mockSettings,
      true,
      true,
      true,
      '$',
      mockIntl,
      mockQuickFillFieldLabels,
      false, // isBillRateEnable
    );

    const [worksheetDataCall] = (
      XLSX.utils.aoa_to_sheet as jest.Mock
    ).mock.calls.slice(-1);
    const worksheetData = worksheetDataCall[0];

    const headers = worksheetData[1];
    const totalRow = worksheetData[worksheetData.length - 1];

    // Total row should have the same number of columns as headers
    expect(totalRow.length).toBe(headers.length);

    // "weekly.total" label should appear in the right position
    expect(totalRow).toContain('weekly.total');

    // Total row should NOT end with a dollar amount
    const lastValue = totalRow[totalRow.length - 1];
    expect(typeof lastValue).toBe('string');
    expect(lastValue).not.toMatch(/^\$/);
  });

  it('should handle null billRate correctly with fallback to 0', () => {
    const dataWithNullBillRate: WeeklyTimeFormState = {
      ...mockData,
      weeklyTimeRows: [
        {
          ...mockData.weeklyTimeRows[0],
          billRate: null, // Testing null billRate that should default to 0
          billable: true, // Keep billable true to test the calculation
        },
      ],
    };

    exportWeeklyTimesheetExcel(
      dataWithNullBillRate,
      mockPreferences,
      mockSettings,
      true,
      true,
      true,
      '$',
      mockIntl,
      mockQuickFillFieldLabels,
    );

    expect(XLSX.utils.book_new).toHaveBeenCalled();
    expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalled();
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalled();
    expect(XLSX.writeFile).toHaveBeenCalledWith(
      expect.any(Object),
      'weekly_timesheet.xlsx',
      { cellStyles: true },
    );

    // Verify that the data includes $0.00 for billable when billRate is null (defaults to 0)
    const [worksheetDataCall] = (
      XLSX.utils.aoa_to_sheet as jest.Mock
    ).mock.calls.slice(-1);
    const worksheetData = worksheetDataCall[0];

    // Find the data row (should be after headers) - looking for the billable column (last column)
    const dataRow = worksheetData.find(
      (row: any[]) =>
        Array.isArray(row) &&
        row.length > 10 &&
        typeof row[row.length - 1] === 'string' &&
        row[row.length - 1].startsWith('$'),
    );

    expect(dataRow).toBeDefined();
    expect(dataRow[dataRow.length - 1]).toBe('$0'); // billable amount should be $0 when billRate is null
  });

  it('should exclude Project column when project field is disabled', () => {
    jest.clearAllMocks();

    const noProjectPreferences: UxPreferenceData = {
      ...mockPreferences,
      [UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS]: {
        ...mockPreferences[UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS],
        isProjectFieldEnabled: false,
      },
    };

    exportWeeklyTimesheetExcel(
      mockData,
      noProjectPreferences,
      mockSettings,
      true,
      true,
      true,
      '$',
      mockIntl,
      mockQuickFillFieldLabels,
    );

    const [worksheetDataCall] = (
      XLSX.utils.aoa_to_sheet as jest.Mock
    ).mock.calls.slice(-1);
    const worksheetData = worksheetDataCall[0];
    const headers = worksheetData[1];

    expect(headers).not.toContain('Project');
  });

  it('should default customer, project, and service labels to empty when quickFill labels are missing', () => {
    jest.clearAllMocks();

    exportWeeklyTimesheetExcel(
      mockData,
      mockPreferences,
      mockSettings,
      true,
      true,
      true,
      '$',
      mockIntl,
      [],
    );

    const [worksheetDataCall] = (
      XLSX.utils.aoa_to_sheet as jest.Mock
    ).mock.calls.slice(-1);
    const worksheetData = worksheetDataCall[0];
    const headers = worksheetData[1];
    const dataRow = worksheetData[2];

    const customerIndex = headers.indexOf('Customer');
    const projectIndex = headers.indexOf('Project');
    const serviceIndex = headers.indexOf('Service');

    expect(dataRow[customerIndex]).toBe('');
    expect(dataRow[projectIndex]).toBe('');
    expect(dataRow[serviceIndex]).toBe('');
  });

  it('should keep Project cell empty when project id is not selected', () => {
    jest.clearAllMocks();

    const dataWithoutProject: WeeklyTimeFormState = {
      ...mockData,
      weeklyTimeRows: [
        {
          ...mockData.weeklyTimeRows[0],
          timeAgainst: {
            ...mockData.weeklyTimeRows[0].timeAgainst,
            project: { id: '', name: '' },
          },
        },
      ],
    };

    exportWeeklyTimesheetExcel(
      dataWithoutProject,
      mockPreferences,
      mockSettings,
      true,
      true,
      true,
      '$',
      mockIntl,
      mockQuickFillFieldLabels,
    );

    const [worksheetDataCall] = (
      XLSX.utils.aoa_to_sheet as jest.Mock
    ).mock.calls.slice(-1);
    const worksheetData = worksheetDataCall[0];
    const headers = worksheetData[1];
    const dataRow = worksheetData[2];
    const projectIndex = headers.indexOf('Project');

    expect(dataRow[projectIndex]).toBe('');
  });

  it('should keep Project cell empty when project is undefined', () => {
    jest.clearAllMocks();

    const dataWithUndefinedProject: WeeklyTimeFormState = {
      ...mockData,
      weeklyTimeRows: [
        {
          ...mockData.weeklyTimeRows[0],
          timeAgainst: {
            ...mockData.weeklyTimeRows[0].timeAgainst,
            project: undefined as any,
          },
        },
      ],
    };

    exportWeeklyTimesheetExcel(
      dataWithUndefinedProject,
      mockPreferences,
      mockSettings,
      true,
      true,
      true,
      '$',
      mockIntl,
      mockQuickFillFieldLabels,
    );

    const [worksheetDataCall] = (
      XLSX.utils.aoa_to_sheet as jest.Mock
    ).mock.calls.slice(-1);
    const worksheetData = worksheetDataCall[0];
    const headers = worksheetData[1];
    const dataRow = worksheetData[2];
    const projectIndex = headers.indexOf('Project');

    expect(dataRow[projectIndex]).toBe('');
  });
});

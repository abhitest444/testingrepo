import dayjs from 'dayjs';
import {
  TimesheetRow,
  timeEntryDetails,
} from 'src/js/widgets/weeklyTimeEntry/store/timeEntryGridSlice';
import { DataAccess_ContactType } from 'src/__generated__/oigql/graphql';
import {
  getVisibleDaysFromPreferences,
  getCellStyle,
  formatCellValue,
  getHeaderData,
  getRowData,
  createEmptyRow,
  getCustomerName,
  transformCustomerData,
  updateWeekdayDataFlag,
  hasAtLeastOneWeekdaySelected,
  hasApprovedEntries,
  getFormattedCellHours,
  hasTimeEntryChanges,
  calculateRowBillableAmount,
  getBillableStatus,
  getClassName,
  getLocationName,
  isBreakType,
  isBreakRow,
  clearBreakIncompatibleFields,
  setDefaultBillableInfo,
  determineCellOperation,
  processTimeCategoryChange,
  enrichCFOOptionsWithNamesFromCF,
  isWeeklyCellLocked,
  isWeeklyRowLocked,
} from '../../../../../src/js/widgets/weeklyTimeEntry/utils/helpers';

// Mock data for testing
const mockHideWeekdays = {
  isSundayHidden: false,
  isMondayHidden: true,
  isTuesdayHidden: false,
  isWednesdayHidden: true,
  isThursdayHidden: false,
  isFridayHidden: false,
  isSaturdayHidden: true,
};

const mockWeek = {
  startDate: dayjs('2024-01-01'),
  endDate: dayjs('2024-01-07'),
};

const mockTimeEntries: { [rowId: string]: TimesheetRow } = {
  'row-1': {
    rowId: 'row-1',
    timeAgainst: {
      type: DataAccess_ContactType.Customer,
      id: 'customer1',
      displayName: 'customer1',
    },
    timeEntries: {
      0: {
        timeEntryId: '1',
        date: '2024-01-01',
        hours: 8,
        notes: 'Work',
        metaInfo: undefined,
        billableInfo: undefined,
        isApproved: false,
      },
      1: {
        timeEntryId: '2',
        date: '2024-01-02',
        hours: 6,
        notes: 'Meeting',
        metaInfo: undefined,
        billableInfo: undefined,
        isApproved: false,
      },
      2: {
        timeEntryId: '3',
        date: '2024-01-03',
        hours: 7.5,
        notes: 'Coding',
        metaInfo: undefined,
        billableInfo: undefined,
        isApproved: false,
      },
    },
    totalHours: 21.5,
    billableTotal: 0,
    hasApprovedEntries: false,
  },
  'row-2': {
    rowId: 'row-2',
    timeAgainst: {
      type: 'PROJECT' as const,
      id: 'project1',
      displayName: 'project1',
    },
    timeEntries: {
      0: {
        timeEntryId: '4',
        date: '2024-01-01',
        hours: 4,
        notes: 'Planning',
        metaInfo: undefined,
        billableInfo: undefined,
        isApproved: false,
      },
      1: {
        timeEntryId: '5',
        date: '2024-01-02',
        hours: 2,
        notes: 'Review',
        metaInfo: undefined,
        billableInfo: undefined,
        isApproved: false,
      },
    },
    totalHours: 6,
    billableTotal: 0,
    hasApprovedEntries: false,
  },
};

const mockRowOrder = ['row-1', 'row-2'];

// Convert hashmap to array for testing getHeaderData
const mockTimeEntriesArray = mockRowOrder.map(
  (rowId) => mockTimeEntries[rowId],
);

describe('helpers', () => {
  describe('hasAtLeastOneWeekdaySelected', () => {
    it('should return true when at least one weekday is selected', () => {
      const weekdays = {
        isSundayEnabled: true,
        isMondayEnabled: false,
        isTuesdayEnabled: false,
        isWednesdayEnabled: false,
        isThursdayEnabled: false,
        isFridayEnabled: false,
        isSaturdayEnabled: false,
      };
      expect(hasAtLeastOneWeekdaySelected(weekdays)).toBe(true);
    });

    it('should return true when multiple weekdays are selected', () => {
      const weekdays = {
        isSundayEnabled: true,
        isMondayEnabled: true,
        isTuesdayEnabled: false,
        isWednesdayEnabled: true,
        isThursdayEnabled: false,
        isFridayEnabled: false,
        isSaturdayEnabled: false,
      };
      expect(hasAtLeastOneWeekdaySelected(weekdays)).toBe(true);
    });

    it('should return false when no weekdays are selected', () => {
      const weekdays = {
        isSundayEnabled: false,
        isMondayEnabled: false,
        isTuesdayEnabled: false,
        isWednesdayEnabled: false,
        isThursdayEnabled: false,
        isFridayEnabled: false,
        isSaturdayEnabled: false,
      };
      expect(hasAtLeastOneWeekdaySelected(weekdays)).toBe(false);
    });

    it('should return true when all weekdays are selected', () => {
      const weekdays = {
        isSundayEnabled: true,
        isMondayEnabled: true,
        isTuesdayEnabled: true,
        isWednesdayEnabled: true,
        isThursdayEnabled: true,
        isFridayEnabled: true,
        isSaturdayEnabled: true,
      };
      expect(hasAtLeastOneWeekdaySelected(weekdays)).toBe(true);
    });

    it('should handle mixed boolean values', () => {
      const weekdays = {
        isSundayEnabled: false,
        isMondayEnabled: true,
        isTuesdayEnabled: false,
        isWednesdayEnabled: true,
        isThursdayEnabled: false,
        isFridayEnabled: true,
        isSaturdayEnabled: false,
      };
      expect(hasAtLeastOneWeekdaySelected(weekdays)).toBe(true);
    });

    it('should handle edge cases with null/undefined values', () => {
      const weekdays = {
        isSundayEnabled: false,
        isMondayEnabled: null,
        isTuesdayEnabled: undefined,
        isWednesdayEnabled: false,
        isThursdayEnabled: false,
        isFridayEnabled: false,
        isSaturdayEnabled: false,
      };
      expect(hasAtLeastOneWeekdaySelected(weekdays)).toBe(false);
    });
  });

  describe('getVisibleDaysFromPreferences', () => {
    it('should return visible days based on preferences with Sunday as first day', () => {
      const result = getVisibleDaysFromPreferences(mockHideWeekdays, 0);
      expect(result).toEqual([0, 2, 4, 5]); // Sunday, Tuesday, Thursday, Friday
    });

    it('should return visible days based on preferences with Monday as first day', () => {
      const result = getVisibleDaysFromPreferences(mockHideWeekdays, 1);
      expect(result).toEqual([1, 3, 4, 6]); // Monday, Wednesday, Thursday, Saturday
    });

    it('should handle all days hidden', () => {
      const allHidden = {
        isSundayHidden: true,
        isMondayHidden: true,
        isTuesdayHidden: true,
        isWednesdayHidden: true,
        isThursdayHidden: true,
        isFridayHidden: true,
        isSaturdayHidden: true,
      };
      const result = getVisibleDaysFromPreferences(allHidden, 0);
      expect(result).toEqual([]);
    });

    it('should handle all days visible', () => {
      const allVisible = {
        isSundayHidden: false,
        isMondayHidden: false,
        isTuesdayHidden: false,
        isWednesdayHidden: false,
        isThursdayHidden: false,
        isFridayHidden: false,
        isSaturdayHidden: false,
      };
      const result = getVisibleDaysFromPreferences(allVisible, 0);
      expect(result).toEqual([0, 1, 2, 3, 4, 5, 6]);
    });
  });

  describe('getCellStyle', () => {
    it('should return default cell style', () => {
      const result = getCellStyle();
      expect(result).toEqual({
        width: '94.43px',
        height: '40px',
      });
    });

    it('should return custom cell style', () => {
      const result = getCellStyle(100, 50);
      expect(result).toEqual({
        width: '100px',
        height: '50px',
      });
    });
  });

  describe('formatCellValue', () => {
    it('should return empty string for zero', () => {
      expect(formatCellValue(0)).toBe('');
    });

    it('should format integer numbers in duration format', () => {
      expect(formatCellValue(8)).toBe('8:00');
      expect(formatCellValue(1)).toBe('1:00');
    });

    it('should format decimal numbers in duration format', () => {
      expect(formatCellValue(7.5)).toBe('7:30');
      expect(formatCellValue(8.25)).toBe('8:15');
      expect(formatCellValue(1.75)).toBe('1:45');
    });

    it('should handle string values', () => {
      expect(formatCellValue('test')).toBe('test');
    });

    it('should handle null and undefined', () => {
      expect(formatCellValue(null)).toBe(null);
      expect(formatCellValue(undefined)).toBe(undefined);
    });

    it('should always show empty for 0 hours regardless of operation', () => {
      // Test that 0 hours always show as empty, even if marked for deletion
      expect(formatCellValue(0)).toBe('');
      expect(formatCellValue(0.0)).toBe('');
    });

    it('should format minutes correctly', () => {
      expect(formatCellValue(0.5)).toBe('0:30'); // 30 minutes
      expect(formatCellValue(0.25)).toBe('0:15'); // 15 minutes
      expect(formatCellValue(0.1)).toBe('0:06'); // 6 minutes (rounded)
      expect(formatCellValue(0.75)).toBe('0:45'); // 45 minutes
    });

    it('should handle edge cases for duration format', () => {
      expect(formatCellValue(24)).toBe('24:00'); // 24 hours
      expect(formatCellValue(10.5)).toBe('10:30');
      expect(formatCellValue(0.01)).toBe('0:01'); // 1 minute (rounded up)
    });
  });

  describe('getHeaderData', () => {
    it('should generate header data with correct structure', () => {
      const visibleDaysOfTheWeek = [0, 1, 2, 3, 4, 5, 6];
      const firstDayOfWeek = 0;
      const dateRange = { start: '2024-01-01', end: '2024-01-07' };

      const result = getHeaderData(
        dateRange,
        visibleDaysOfTheWeek,
        mockTimeEntriesArray,
        firstDayOfWeek,
      );

      expect(result).toHaveLength(10); // Time category + 7 days + Total + Billable
      expect(result[0]).toEqual({
        label: 'Time category',
        value: '',
        width: 170,
        height: 58,
      });

      // Check day headers (now shows duration format)
      expect(result[1]).toEqual({
        label: 'Sun 1/1',
        value: '12:00', // 8 + 4 hours in hh:mm format
        hasError: false,
      });

      expect(result[2]).toEqual({
        label: 'Mon 1/2',
        value: '8:00', // 6 + 2 hours in hh:mm format
        hasError: false,
      });

      // Check totals (now shows duration format)
      expect(result[8]).toEqual({
        label: 'Total',
        value: '27:30', // 21.5 + 6 hours in hh:mm format
      });

      expect(result[9]).toEqual({
        label: 'Billable',
        value: '$0.00',
      });
    });

    it('should handle empty time entries', () => {
      const visibleDaysOfTheWeek = [0, 1, 2];
      const firstDayOfWeek = 0;
      const dateRange = { start: '2024-01-01', end: '2024-01-07' };

      const result = getHeaderData(
        dateRange,
        visibleDaysOfTheWeek,
        [],
        firstDayOfWeek,
      );

      expect(result).toHaveLength(6); // Time category + 3 days + Total + Billable
      expect(result[1].value).toBe('0:00'); // Duration format
      expect(result[2].value).toBe('0:00'); // Duration format
      expect(result[3].value).toBe('0:00'); // Duration format
      expect(result[4].value).toBe('0:00'); // Total in duration format
    });

    it('should handle different first day of week', () => {
      const visibleDaysOfTheWeek = [0, 1, 2];
      const firstDayOfWeek = 1; // Monday
      const dateRange = { start: '2024-01-01', end: '2024-01-07' };

      const result = getHeaderData(
        dateRange,
        visibleDaysOfTheWeek,
        mockTimeEntriesArray,
        firstDayOfWeek,
      );

      expect(result[1].label).toBe('Mon 1/1');
      expect(result[2].label).toBe('Tue 1/2');
      expect(result[3].label).toBe('Wed 1/3');
    });
  });

  describe('getRowData', () => {
    it('should generate row data with correct structure', () => {
      const row = mockTimeEntries['row-1'];
      const visibleDaysOfTheWeek = [0, 1, 2];
      const firstDayOfWeek = 0;

      const result = getRowData(row, visibleDaysOfTheWeek, firstDayOfWeek);

      expect(result).toHaveLength(6); // Customer + 3 days + Total + Billable
      expect(result[0]).toEqual({
        id: 'customer',
        value: 'customer1',
      });

      expect(result[1]).toEqual({
        id: 'sun',
        value: 8,
      });

      expect(result[2]).toEqual({
        id: 'mon',
        value: 6,
      });

      expect(result[3]).toEqual({
        id: 'tue',
        value: 7.5,
      });

      expect(result[4]).toEqual({
        id: 'total',
        value: '21:30', // Now in duration format
      });
    });

    it('should handle row with customer id', () => {
      const rowWithCustomer = {
        ...mockTimeEntries['row-1'],
        timeAgainst: {
          type: DataAccess_ContactType.Customer,
          id: 'customer123',
          displayName: 'customer123',
        },
      };
      const visibleDaysOfTheWeek = [0];
      const firstDayOfWeek = 0;

      const result = getRowData(
        rowWithCustomer,
        visibleDaysOfTheWeek,
        firstDayOfWeek,
      );

      expect(result[0]).toEqual({
        id: 'customer',
        value: 'customer123',
      });
    });

    it('should handle empty row', () => {
      const emptyRow = {
        rowId: 'empty-row',
        timeAgainst: { type: null, id: null, displayName: null },
        timeEntries: {},
        totalHours: 0,
        billableTotal: 0,
        hasApprovedEntries: false,
      };
      const visibleDaysOfTheWeek = [0, 1];
      const firstDayOfWeek = 0;

      const result = getRowData(emptyRow, visibleDaysOfTheWeek, firstDayOfWeek);

      expect(result).toHaveLength(5); // Customer + 2 days + Total + Billable
      expect(result[1].value).toBe(0);
      expect(result[2].value).toBe(0);
      expect(result[3].value).toBe('0:00'); // Duration format
    });

    it('should handle null row', () => {
      const visibleDaysOfTheWeek = [0, 1];
      const firstDayOfWeek = 0;

      const result = getRowData(
        null as any,
        visibleDaysOfTheWeek,
        firstDayOfWeek,
      );

      expect(result).toHaveLength(10); // Default array of 10 empty cells
      expect(result.every((cell) => cell.id === '' && cell.value === '')).toBe(
        true,
      );
    });

    it('should handle different first day of week', () => {
      const row = mockTimeEntries['row-1'];
      const visibleDaysOfTheWeek = [0, 1];
      const firstDayOfWeek = 1; // Monday

      const result = getRowData(row, visibleDaysOfTheWeek, firstDayOfWeek);

      expect(result[1].id).toBe('mon');
      expect(result[2].id).toBe('tue');
    });
  });

  describe('createEmptyRow', () => {
    it('should create empty row with correct structure', () => {
      const result = createEmptyRow(mockWeek);

      expect(result.timeAgainst).toEqual({
        type: null,
        id: null,
        displayName: null,
      });

      expect(result.totalHours).toBe(0);
      expect(result.billableTotal).toBe(0);

      // Check that all 7 days are created
      expect(Object.keys(result.timeEntries)).toHaveLength(7);

      // Check first day
      expect(result.timeEntries[0]).toEqual({
        timeEntryId: '',
        date: '2024-01-01',
        hours: 0,
        notes: '',
        metaInfo: undefined,
        billableInfo: undefined,
        isApproved: false,
      });

      // Check last day
      expect(result.timeEntries[6]).toEqual({
        timeEntryId: '',
        date: '2024-01-07',
        hours: 0,
        notes: '',
        metaInfo: undefined,
        billableInfo: undefined,
        isApproved: false,
      });
    });

    it('should create empty row with custom index', () => {
      const result = createEmptyRow(mockWeek, 5);

      expect(result.timeAgainst).toEqual({
        type: null,
        id: null,
        displayName: null,
      });

      // Should still create all 7 days
      expect(Object.keys(result.timeEntries)).toHaveLength(7);
    });

    it('should handle different week start dates', () => {
      const customWeek = {
        startDate: dayjs('2024-06-10'), // Monday
        endDate: dayjs('2024-06-16'),
      };

      const result = createEmptyRow(customWeek);

      expect(result.timeEntries[0].date).toBe('2024-06-10');
      expect(result.timeEntries[6].date).toBe('2024-06-16');
    });
  });

  describe('getCustomerName', () => {
    const mockCustomerData = [
      { id: 'customer1', displayName: 'Apple Inc.' },
      { id: 'customer2', displayName: 'Microsoft Corp.' },
    ];

    it('should return customer display name for customer type', () => {
      const row: TimesheetRow = {
        rowId: 'test-row-1',
        timeAgainst: {
          type: DataAccess_ContactType.Customer,
          id: 'customer1',
          displayName: 'customer1',
        },
        timeEntries: {},
        totalHours: 0,
        billableTotal: 0,
        hasApprovedEntries: false,
      };

      const result = getCustomerName(row, mockCustomerData);
      expect(result).toBe('Apple Inc.');
    });

    it('should return displayName from timeAgainst when customer not found in store', () => {
      const row: TimesheetRow = {
        rowId: 'test-row-2',
        timeAgainst: {
          type: DataAccess_ContactType.Customer,
          id: 'nonexistent',
          displayName: 'Searched Customer Name',
        },
        timeEntries: {},
        totalHours: 0,
        billableTotal: 0,
        hasApprovedEntries: false,
      };

      const result = getCustomerName(row, mockCustomerData);
      expect(result).toBe('Searched Customer Name');
    });

    it('should return fallback text when customer not found and no displayName in timeAgainst', () => {
      const row: TimesheetRow = {
        rowId: 'test-row-2b',
        timeAgainst: {
          type: DataAccess_ContactType.Customer,
          id: 'nonexistent',
          displayName: null as any,
        },
        timeEntries: {},
        totalHours: 0,
        billableTotal: 0,
        hasApprovedEntries: false,
      };

      const result = getCustomerName(row, mockCustomerData);
      expect(result).toBe('Select ...');
    });

    it('should return custom fallback text for customer not found with no displayName', () => {
      const row: TimesheetRow = {
        rowId: 'test-row-3',
        timeAgainst: {
          type: DataAccess_ContactType.Customer,
          id: 'nonexistent',
          displayName: null as any,
        },
        timeEntries: {},
        totalHours: 0,
        billableTotal: 0,
        hasApprovedEntries: false,
      };

      const result = getCustomerName(
        row,
        mockCustomerData,
        [],
        'Custom Fallback',
      );
      expect(result).toBe('Custom Fallback');
    });

    it('should return break name for break type', () => {
      const mockBreaksData = [
        { id: 'lunch', breakName: 'Lunch Break' },
        { id: 'coffee', breakName: 'Coffee Break' },
      ];

      const row: TimesheetRow = {
        rowId: 'test-row-4',
        timeAgainst: { type: 'PAID', id: 'lunch', displayName: 'lunch' },
        timeEntries: {},
        totalHours: 0,
        billableTotal: 0,
        hasApprovedEntries: false,
      };

      const result = getCustomerName(row, mockCustomerData, mockBreaksData);
      expect(result).toBe('Lunch Break');
    });

    it('should return "Paid" for paid time off', () => {
      const row: TimesheetRow = {
        rowId: 'test-row-5',
        timeAgainst: { type: 'TIME_OFF', id: 'paid', displayName: null },
        timeEntries: {},
        totalHours: 0,
        billableTotal: 0,
        hasApprovedEntries: false,
      };

      const result = getCustomerName(row, mockCustomerData);
      expect(result).toBe('Paid');
    });

    it('should return "Unpaid" for unpaid time off', () => {
      const row: TimesheetRow = {
        rowId: 'test-row-6',
        timeAgainst: { type: 'TIME_OFF', id: 'unpaid', displayName: null },
        timeEntries: {},
        totalHours: 0,
        billableTotal: 0,
        hasApprovedEntries: false,
      };

      const result = getCustomerName(row, mockCustomerData);
      expect(result).toBe('Unpaid');
    });

    it('should return "Time off" for other time off types', () => {
      const row: TimesheetRow = {
        rowId: 'test-row-7',
        timeAgainst: {
          type: 'TIME_OFF',
          id: 'vacation',
          displayName: null,
        },
        timeEntries: {},
        totalHours: 0,
        billableTotal: 0,
        hasApprovedEntries: false,
      };

      const result = getCustomerName(row, mockCustomerData);
      expect(result).toBe('Time off');
    });

    it('should return timeOffCategoryName from displayName when present for TIME_OFF type', () => {
      const row: TimesheetRow = {
        rowId: 'test-row-timeoff-category',
        timeAgainst: {
          type: 'TIME_OFF',
          id: 'some-id',
          displayName: 'Vacation',
        },
        timeEntries: {},
        totalHours: 0,
        billableTotal: 0,
        hasApprovedEntries: false,
      };

      const result = getCustomerName(row, mockCustomerData);
      expect(result).toBe('Vacation');
    });

    it('should fall back to "Paid" when TIME_OFF has id "paid" and no displayName', () => {
      const row: TimesheetRow = {
        rowId: 'test-row-timeoff-paid-no-display',
        timeAgainst: {
          type: 'TIME_OFF',
          id: 'paid',
          displayName: null,
        },
        timeEntries: {},
        totalHours: 0,
        billableTotal: 0,
        hasApprovedEntries: false,
      };

      const result = getCustomerName(row, mockCustomerData);
      expect(result).toBe('Paid');
    });

    it('should fall back to "Unpaid" when TIME_OFF has id "unpaid" and no displayName', () => {
      const row: TimesheetRow = {
        rowId: 'test-row-timeoff-unpaid-no-display',
        timeAgainst: {
          type: 'TIME_OFF',
          id: 'unpaid',
          displayName: null,
        },
        timeEntries: {},
        totalHours: 0,
        billableTotal: 0,
        hasApprovedEntries: false,
      };

      const result = getCustomerName(row, mockCustomerData);
      expect(result).toBe('Unpaid');
    });

    it('should fall back to "Time off" when TIME_OFF has no displayName and unknown id', () => {
      const row: TimesheetRow = {
        rowId: 'test-row-timeoff-generic-no-display',
        timeAgainst: {
          type: 'TIME_OFF',
          id: 'other',
          displayName: null,
        },
        timeEntries: {},
        totalHours: 0,
        billableTotal: 0,
        hasApprovedEntries: false,
      };

      const result = getCustomerName(row, mockCustomerData);
      expect(result).toBe('Time off');
    });

    it('should return "Select ..." for null timeAgainst', () => {
      const row: TimesheetRow = {
        rowId: 'test-row-8',
        timeAgainst: { type: null, id: null, displayName: null },
        timeEntries: {},
        totalHours: 0,
        billableTotal: 0,
        hasApprovedEntries: false,
      };

      const result = getCustomerName(row, mockCustomerData);
      expect(result).toBe('Select ...');
    });
  });

  describe('transformCustomerData', () => {
    it('should transform customer data with displayName', () => {
      const customerData = {
        displayName: 'Acme Corporation',
        firstName: 'John',
        externalIds: [{ localId: 'cust-123' }],
        id: 'backup-id',
      };

      const result = transformCustomerData(customerData);

      expect(result).toEqual({
        type: DataAccess_ContactType.Customer,
        displayName: 'Acme Corporation',
        firstName: 'John',
        id: 'cust-123',
      });
    });

    it('should transform customer data with name fallback', () => {
      const customerData = {
        name: 'Tech Solutions Inc',
        firstName: 'Jane',
        externalIds: [{ localId: 'cust-456' }],
        id: 'backup-id',
      };

      const result = transformCustomerData(customerData);

      expect(result).toEqual({
        type: DataAccess_ContactType.Customer,
        displayName: 'Tech Solutions Inc',
        firstName: 'Jane',
        id: 'cust-456',
      });
    });

    it('should transform customer data with id fallback when no externalIds', () => {
      const customerData = {
        displayName: 'Global Industries',
        firstName: 'Bob',
        id: 'cust-789',
      };

      const result = transformCustomerData(customerData);

      expect(result).toEqual({
        type: DataAccess_ContactType.Customer,
        displayName: 'Global Industries',
        firstName: 'Bob',
        id: 'cust-789',
      });
    });

    it('should handle customer data with empty displayName and name', () => {
      const customerData = {
        firstName: 'Alice',
        externalIds: [{ localId: 'cust-101' }],
        id: 'backup-id',
      };

      const result = transformCustomerData(customerData);

      expect(result).toEqual({
        type: DataAccess_ContactType.Customer,
        displayName: '',
        firstName: 'Alice',
        id: 'cust-101',
      });
    });

    it('should handle customer data with null firstName', () => {
      const customerData = {
        displayName: 'Enterprise Corp',
        externalIds: [{ localId: 'cust-202' }],
        id: 'backup-id',
      };

      const result = transformCustomerData(customerData);

      expect(result).toEqual({
        type: DataAccess_ContactType.Customer,
        displayName: 'Enterprise Corp',
        firstName: null,
        id: 'cust-202',
      });
    });

    it('should handle customer data with empty externalIds array', () => {
      const customerData = {
        displayName: 'Startup LLC',
        firstName: 'Charlie',
        externalIds: [],
        id: 'cust-303',
      };

      const result = transformCustomerData(customerData);

      expect(result).toEqual({
        type: DataAccess_ContactType.Customer,
        displayName: 'Startup LLC',
        firstName: 'Charlie',
        id: 'cust-303',
      });
    });

    it('should handle customer data with missing externalIds property', () => {
      const customerData = {
        displayName: 'Consulting Group',
        firstName: 'Diana',
        id: 'cust-404',
      };

      const result = transformCustomerData(customerData);

      expect(result).toEqual({
        type: DataAccess_ContactType.Customer,
        displayName: 'Consulting Group',
        firstName: 'Diana',
        id: 'cust-404',
      });
    });

    it('should handle minimal customer data', () => {
      const customerData = {
        id: 'cust-505',
      };

      const result = transformCustomerData(customerData);

      expect(result).toEqual({
        type: DataAccess_ContactType.Customer,
        displayName: '',
        firstName: null,
        id: 'cust-505',
      });
    });

    it('should handle empty customer data object', () => {
      const customerData = {};

      const result = transformCustomerData(customerData);

      expect(result).toEqual({
        type: DataAccess_ContactType.Customer,
        displayName: '',
        firstName: null,
        id: undefined,
      });
    });
  });

  describe('updateWeekdayDataFlag', () => {
    it('should update Sunday flag when dayOfWeek is 0', () => {
      const weekdaysWithData = {
        hasSundayData: false,
        hasMondayData: false,
        hasTuesdayData: false,
        hasWednesdayData: false,
        hasThursdayData: false,
        hasFridayData: false,
        hasSaturdayData: false,
      };

      updateWeekdayDataFlag(0, weekdaysWithData);

      expect(weekdaysWithData.hasSundayData).toBe(true);
      expect(weekdaysWithData.hasMondayData).toBe(false);
      expect(weekdaysWithData.hasTuesdayData).toBe(false);
      expect(weekdaysWithData.hasWednesdayData).toBe(false);
      expect(weekdaysWithData.hasThursdayData).toBe(false);
      expect(weekdaysWithData.hasFridayData).toBe(false);
      expect(weekdaysWithData.hasSaturdayData).toBe(false);
    });

    it('should update Monday flag when dayOfWeek is 1', () => {
      const weekdaysWithData = {
        hasSundayData: false,
        hasMondayData: false,
        hasTuesdayData: false,
        hasWednesdayData: false,
        hasThursdayData: false,
        hasFridayData: false,
        hasSaturdayData: false,
      };

      updateWeekdayDataFlag(1, weekdaysWithData);

      expect(weekdaysWithData.hasSundayData).toBe(false);
      expect(weekdaysWithData.hasMondayData).toBe(true);
      expect(weekdaysWithData.hasTuesdayData).toBe(false);
      expect(weekdaysWithData.hasWednesdayData).toBe(false);
      expect(weekdaysWithData.hasThursdayData).toBe(false);
      expect(weekdaysWithData.hasFridayData).toBe(false);
      expect(weekdaysWithData.hasSaturdayData).toBe(false);
    });

    it('should update Tuesday flag when dayOfWeek is 2', () => {
      const weekdaysWithData = {
        hasSundayData: false,
        hasMondayData: false,
        hasTuesdayData: false,
        hasWednesdayData: false,
        hasThursdayData: false,
        hasFridayData: false,
        hasSaturdayData: false,
      };

      updateWeekdayDataFlag(2, weekdaysWithData);

      expect(weekdaysWithData.hasSundayData).toBe(false);
      expect(weekdaysWithData.hasMondayData).toBe(false);
      expect(weekdaysWithData.hasTuesdayData).toBe(true);
      expect(weekdaysWithData.hasWednesdayData).toBe(false);
      expect(weekdaysWithData.hasThursdayData).toBe(false);
      expect(weekdaysWithData.hasFridayData).toBe(false);
      expect(weekdaysWithData.hasSaturdayData).toBe(false);
    });

    it('should update Wednesday flag when dayOfWeek is 3', () => {
      const weekdaysWithData = {
        hasSundayData: false,
        hasMondayData: false,
        hasTuesdayData: false,
        hasWednesdayData: false,
        hasThursdayData: false,
        hasFridayData: false,
        hasSaturdayData: false,
      };

      updateWeekdayDataFlag(3, weekdaysWithData);

      expect(weekdaysWithData.hasSundayData).toBe(false);
      expect(weekdaysWithData.hasMondayData).toBe(false);
      expect(weekdaysWithData.hasTuesdayData).toBe(false);
      expect(weekdaysWithData.hasWednesdayData).toBe(true);
      expect(weekdaysWithData.hasThursdayData).toBe(false);
      expect(weekdaysWithData.hasFridayData).toBe(false);
      expect(weekdaysWithData.hasSaturdayData).toBe(false);
    });

    it('should update Thursday flag when dayOfWeek is 4', () => {
      const weekdaysWithData = {
        hasSundayData: false,
        hasMondayData: false,
        hasTuesdayData: false,
        hasWednesdayData: false,
        hasThursdayData: false,
        hasFridayData: false,
        hasSaturdayData: false,
      };

      updateWeekdayDataFlag(4, weekdaysWithData);

      expect(weekdaysWithData.hasSundayData).toBe(false);
      expect(weekdaysWithData.hasMondayData).toBe(false);
      expect(weekdaysWithData.hasTuesdayData).toBe(false);
      expect(weekdaysWithData.hasWednesdayData).toBe(false);
      expect(weekdaysWithData.hasThursdayData).toBe(true);
      expect(weekdaysWithData.hasFridayData).toBe(false);
      expect(weekdaysWithData.hasSaturdayData).toBe(false);
    });

    it('should update Friday flag when dayOfWeek is 5', () => {
      const weekdaysWithData = {
        hasSundayData: false,
        hasMondayData: false,
        hasTuesdayData: false,
        hasWednesdayData: false,
        hasThursdayData: false,
        hasFridayData: false,
        hasSaturdayData: false,
      };

      updateWeekdayDataFlag(5, weekdaysWithData);

      expect(weekdaysWithData.hasSundayData).toBe(false);
      expect(weekdaysWithData.hasMondayData).toBe(false);
      expect(weekdaysWithData.hasTuesdayData).toBe(false);
      expect(weekdaysWithData.hasWednesdayData).toBe(false);
      expect(weekdaysWithData.hasThursdayData).toBe(false);
      expect(weekdaysWithData.hasFridayData).toBe(true);
      expect(weekdaysWithData.hasSaturdayData).toBe(false);
    });

    it('should update Saturday flag when dayOfWeek is 6', () => {
      const weekdaysWithData = {
        hasSundayData: false,
        hasMondayData: false,
        hasTuesdayData: false,
        hasWednesdayData: false,
        hasThursdayData: false,
        hasFridayData: false,
        hasSaturdayData: false,
      };

      updateWeekdayDataFlag(6, weekdaysWithData);

      expect(weekdaysWithData.hasSundayData).toBe(false);
      expect(weekdaysWithData.hasMondayData).toBe(false);
      expect(weekdaysWithData.hasTuesdayData).toBe(false);
      expect(weekdaysWithData.hasWednesdayData).toBe(false);
      expect(weekdaysWithData.hasThursdayData).toBe(false);
      expect(weekdaysWithData.hasFridayData).toBe(false);
      expect(weekdaysWithData.hasSaturdayData).toBe(true);
    });

    it('should not update any flags when dayOfWeek is invalid (negative)', () => {
      const weekdaysWithData = {
        hasSundayData: false,
        hasMondayData: false,
        hasTuesdayData: false,
        hasWednesdayData: false,
        hasThursdayData: false,
        hasFridayData: false,
        hasSaturdayData: false,
      };

      updateWeekdayDataFlag(-1, weekdaysWithData);

      expect(weekdaysWithData.hasSundayData).toBe(false);
      expect(weekdaysWithData.hasMondayData).toBe(false);
      expect(weekdaysWithData.hasTuesdayData).toBe(false);
      expect(weekdaysWithData.hasWednesdayData).toBe(false);
      expect(weekdaysWithData.hasThursdayData).toBe(false);
      expect(weekdaysWithData.hasFridayData).toBe(false);
      expect(weekdaysWithData.hasSaturdayData).toBe(false);
    });

    it('should not update any flags when dayOfWeek is invalid (greater than 6)', () => {
      const weekdaysWithData = {
        hasSundayData: false,
        hasMondayData: false,
        hasTuesdayData: false,
        hasWednesdayData: false,
        hasThursdayData: false,
        hasFridayData: false,
        hasSaturdayData: false,
      };

      updateWeekdayDataFlag(7, weekdaysWithData);

      expect(weekdaysWithData.hasSundayData).toBe(false);
      expect(weekdaysWithData.hasMondayData).toBe(false);
      expect(weekdaysWithData.hasTuesdayData).toBe(false);
      expect(weekdaysWithData.hasWednesdayData).toBe(false);
      expect(weekdaysWithData.hasThursdayData).toBe(false);
      expect(weekdaysWithData.hasFridayData).toBe(false);
      expect(weekdaysWithData.hasSaturdayData).toBe(false);
    });

    it('should preserve existing true flags when updating a different day', () => {
      const weekdaysWithData = {
        hasSundayData: true,
        hasMondayData: false,
        hasTuesdayData: true,
        hasWednesdayData: false,
        hasThursdayData: true,
        hasFridayData: false,
        hasSaturdayData: true,
      };

      updateWeekdayDataFlag(1, weekdaysWithData); // Update Monday

      expect(weekdaysWithData.hasSundayData).toBe(true);
      expect(weekdaysWithData.hasMondayData).toBe(true);
      expect(weekdaysWithData.hasTuesdayData).toBe(true);
      expect(weekdaysWithData.hasWednesdayData).toBe(false);
      expect(weekdaysWithData.hasThursdayData).toBe(true);
      expect(weekdaysWithData.hasFridayData).toBe(false);
      expect(weekdaysWithData.hasSaturdayData).toBe(true);
    });

    it('should handle multiple calls to update the same day', () => {
      const weekdaysWithData = {
        hasSundayData: false,
        hasMondayData: false,
        hasTuesdayData: false,
        hasWednesdayData: false,
        hasThursdayData: false,
        hasFridayData: false,
        hasSaturdayData: false,
      };

      // Call multiple times for the same day
      updateWeekdayDataFlag(3, weekdaysWithData);
      updateWeekdayDataFlag(3, weekdaysWithData);
      updateWeekdayDataFlag(3, weekdaysWithData);

      expect(weekdaysWithData.hasWednesdayData).toBe(true);
      expect(weekdaysWithData.hasSundayData).toBe(false);
      expect(weekdaysWithData.hasMondayData).toBe(false);
      expect(weekdaysWithData.hasTuesdayData).toBe(false);
      expect(weekdaysWithData.hasThursdayData).toBe(false);
      expect(weekdaysWithData.hasFridayData).toBe(false);
      expect(weekdaysWithData.hasSaturdayData).toBe(false);
    });
  });

  describe('hasApprovedEntries', () => {
    it('should return false for empty timeEntries object', () => {
      const timeEntries = {};
      expect(hasApprovedEntries(timeEntries)).toBe(false);
    });

    it('should return false when no entries have timeEntryId', () => {
      const timeEntries = {
        0: {
          timeEntryId: '',
          date: '2024-01-01',
          hours: 8,
          notes: 'Work',
          metaInfo: undefined,
          billableInfo: undefined,
          isApproved: true, // Even if approved, no timeEntryId means not a real entry
        },
        1: {
          timeEntryId: '',
          date: '2024-01-02',
          hours: 6,
          notes: 'Meeting',
          metaInfo: undefined,
          billableInfo: undefined,
          isApproved: true,
        },
      };
      expect(hasApprovedEntries(timeEntries)).toBe(false);
    });

    it('should return false when entries have timeEntryId but isApproved is false', () => {
      const timeEntries = {
        0: {
          timeEntryId: 'entry-1',
          date: '2024-01-01',
          hours: 8,
          notes: 'Work',
          metaInfo: undefined,
          billableInfo: undefined,
          isApproved: false,
        },
        1: {
          timeEntryId: 'entry-2',
          date: '2024-01-02',
          hours: 6,
          notes: 'Meeting',
          metaInfo: undefined,
          billableInfo: undefined,
          isApproved: false,
        },
      };
      expect(hasApprovedEntries(timeEntries)).toBe(false);
    });

    it('should return false when entries have timeEntryId but isApproved is undefined', () => {
      const timeEntries = {
        0: {
          timeEntryId: 'entry-1',
          date: '2024-01-01',
          hours: 8,
          notes: 'Work',
          metaInfo: undefined,
          billableInfo: undefined,
          isApproved: undefined,
        },
        1: {
          timeEntryId: 'entry-2',
          date: '2024-01-02',
          hours: 6,
          notes: 'Meeting',
          metaInfo: undefined,
          billableInfo: undefined,
          isApproved: undefined,
        },
      } as any;
      expect(hasApprovedEntries(timeEntries)).toBe(false);
    });

    it('should return true when at least one entry has timeEntryId and isApproved is true', () => {
      const timeEntries = {
        0: {
          timeEntryId: 'entry-1',
          date: '2024-01-01',
          hours: 8,
          notes: 'Work',
          metaInfo: undefined,
          billableInfo: undefined,
          isApproved: true,
        },
        1: {
          timeEntryId: 'entry-2',
          date: '2024-01-02',
          hours: 6,
          notes: 'Meeting',
          metaInfo: undefined,
          billableInfo: undefined,
          isApproved: false,
        },
      };
      expect(hasApprovedEntries(timeEntries)).toBe(true);
    });

    it('should return true when multiple entries are approved', () => {
      const timeEntries = {
        0: {
          timeEntryId: 'entry-1',
          date: '2024-01-01',
          hours: 8,
          notes: 'Work',
          metaInfo: undefined,
          billableInfo: undefined,
          isApproved: true,
        },
        1: {
          timeEntryId: 'entry-2',
          date: '2024-01-02',
          hours: 6,
          notes: 'Meeting',
          metaInfo: undefined,
          billableInfo: undefined,
          isApproved: true,
        },
      };
      expect(hasApprovedEntries(timeEntries)).toBe(true);
    });

    it('should return false when entries are null or undefined', () => {
      const timeEntries = {
        0: null,
        1: undefined,
        2: {
          timeEntryId: '',
          date: '2024-01-03',
          hours: 0,
          notes: '',
          metaInfo: undefined,
          billableInfo: undefined,
          isApproved: true,
        },
      } as any;
      expect(hasApprovedEntries(timeEntries)).toBe(false);
    });

    it('should return true when there are mixed null/undefined entries but one approved entry exists', () => {
      const timeEntries = {
        0: null,
        1: undefined,
        2: {
          timeEntryId: '',
          date: '2024-01-03',
          hours: 0,
          notes: '',
          metaInfo: undefined,
          billableInfo: undefined,
          isApproved: false,
        },
        3: {
          timeEntryId: 'entry-3',
          date: '2024-01-04',
          hours: 7,
          notes: 'Development',
          metaInfo: undefined,
          billableInfo: undefined,
          isApproved: true,
        },
      } as any;
      expect(hasApprovedEntries(timeEntries)).toBe(true);
    });

    it('should return false when timeEntryId is null and isApproved is true', () => {
      const timeEntries = {
        0: {
          timeEntryId: null,
          date: '2024-01-01',
          hours: 8,
          notes: 'Work',
          metaInfo: undefined,
          billableInfo: undefined,
          isApproved: true,
        },
      } as any;
      expect(hasApprovedEntries(timeEntries)).toBe(false);
    });

    it('should return false when timeEntryId is undefined and isApproved is true', () => {
      const timeEntries = {
        0: {
          timeEntryId: undefined,
          date: '2024-01-01',
          hours: 8,
          notes: 'Work',
          metaInfo: undefined,
          billableInfo: undefined,
          isApproved: true,
        },
      } as any;
      expect(hasApprovedEntries(timeEntries)).toBe(false);
    });

    it('should return true for early return optimization - stops at first approved entry', () => {
      const timeEntries = {
        0: {
          timeEntryId: 'entry-1',
          date: '2024-01-01',
          hours: 8,
          notes: 'Work',
          metaInfo: undefined,
          billableInfo: undefined,
          isApproved: true, // This should trigger early return
        },
        1: {
          timeEntryId: 'entry-2',
          date: '2024-01-02',
          hours: 6,
          notes: 'Meeting',
          metaInfo: undefined,
          billableInfo: undefined,
          isApproved: false,
        },
        2: {
          timeEntryId: 'entry-3',
          date: '2024-01-03',
          hours: 7,
          notes: 'Development',
          metaInfo: undefined,
          billableInfo: undefined,
          isApproved: true,
        },
      };
      expect(hasApprovedEntries(timeEntries)).toBe(true);
    });

    it('should handle complex mixed scenarios with various falsy values', () => {
      const timeEntries = {
        0: {
          timeEntryId: '',
          date: '2024-01-01',
          hours: 0,
          notes: '',
          metaInfo: undefined,
          billableInfo: undefined,
          isApproved: true, // Empty timeEntryId, should not count
        },
        1: {
          timeEntryId: 'entry-2',
          date: '2024-01-02',
          hours: 6,
          notes: 'Meeting',
          metaInfo: undefined,
          billableInfo: undefined,
          isApproved: false, // Has timeEntryId but not approved
        },
        2: null, // Null entry
        3: undefined, // Undefined entry
        4: {
          timeEntryId: '   ', // Whitespace-only timeEntryId (truthy but invalid)
          date: '2024-01-05',
          hours: 3,
          notes: 'Testing',
          metaInfo: undefined,
          billableInfo: undefined,
          isApproved: true,
        },
      } as any;
      expect(hasApprovedEntries(timeEntries)).toBe(true); // The whitespace timeEntryId is truthy
    });

    it('should return false when all entries have various combinations of invalid states', () => {
      const timeEntries = {
        0: {
          timeEntryId: '',
          date: '2024-01-01',
          hours: 8,
          notes: 'Work',
          metaInfo: undefined,
          billableInfo: undefined,
          isApproved: true, // Empty timeEntryId
        },
        1: {
          timeEntryId: 'entry-2',
          date: '2024-01-02',
          hours: 6,
          notes: 'Meeting',
          metaInfo: undefined,
          billableInfo: undefined,
          isApproved: false, // Not approved
        },
        2: {
          timeEntryId: null,
          date: '2024-01-03',
          hours: 7,
          notes: 'Development',
          metaInfo: undefined,
          billableInfo: undefined,
          isApproved: true, // Null timeEntryId
        },
        3: null, // Null entry
        4: undefined, // Undefined entry
      } as any;
      expect(hasApprovedEntries(timeEntries)).toBe(false);
    });

    it('should handle entries with non-boolean isApproved values', () => {
      const timeEntries = {
        0: {
          timeEntryId: 'entry-1',
          date: '2024-01-01',
          hours: 8,
          notes: 'Work',
          metaInfo: undefined,
          billableInfo: undefined,
          isApproved: 'true' as any, // String 'true' is truthy
        },
        1: {
          timeEntryId: 'entry-2',
          date: '2024-01-02',
          hours: 6,
          notes: 'Meeting',
          metaInfo: undefined,
          billableInfo: undefined,
          isApproved: 1 as any, // Number 1 is truthy
        },
      };
      expect(hasApprovedEntries(timeEntries)).toBe(true); // Both should be truthy
    });

    it('should handle entries with falsy non-boolean isApproved values', () => {
      const timeEntries = {
        0: {
          timeEntryId: 'entry-1',
          date: '2024-01-01',
          hours: 8,
          notes: 'Work',
          metaInfo: undefined,
          billableInfo: undefined,
          isApproved: 0 as any, // Number 0 is falsy
        },
        1: {
          timeEntryId: 'entry-2',
          date: '2024-01-02',
          hours: 6,
          notes: 'Meeting',
          metaInfo: undefined,
          billableInfo: undefined,
          isApproved: '' as any, // Empty string is falsy
        },
      };
      expect(hasApprovedEntries(timeEntries)).toBe(false);
    });
  });

  describe('getFormattedCellHours', () => {
    describe('Duration Format Parsing', () => {
      it('should parse valid duration format (hh:mm)', () => {
        expect(getFormattedCellHours('8:30')).toBe(8.5);
        expect(getFormattedCellHours('1:15')).toBe(1.25);
        expect(getFormattedCellHours('0:45')).toBe(0.75);
        expect(getFormattedCellHours('12:00')).toBe(12);
      });

      it('should handle single digit hours and minutes', () => {
        expect(getFormattedCellHours('1:05')).toBe(1.0833333333333333);
        expect(getFormattedCellHours('0:30')).toBe(0.5);
        expect(getFormattedCellHours('9:45')).toBe(9.75);
      });

      it('should reject invalid minutes greater than 59', () => {
        expect(getFormattedCellHours('8:60')).toBe(-1);
        expect(getFormattedCellHours('10:75')).toBe(-1);
        expect(getFormattedCellHours('0:99')).toBe(-1);
      });

      it('should handle edge case minutes', () => {
        expect(getFormattedCellHours('8:59')).toBe(8.983333333333333);
        expect(getFormattedCellHours('8:00')).toBe(8);
        expect(getFormattedCellHours('0:01')).toBe(0.016666666666666666);
      });
    });

    describe('Minutes-Only Format Parsing', () => {
      it('should handle minutes-only format (e.g., ":15" becomes "00:15")', () => {
        expect(getFormattedCellHours(':15')).toBe(0.25);
        expect(getFormattedCellHours(':30')).toBe(0.5);
        expect(getFormattedCellHours(':45')).toBe(0.75);
        expect(getFormattedCellHours(':01')).toBe(0.016666666666666666);
        expect(getFormattedCellHours(':59')).toBe(0.9833333333333333);
      });

      it('should reject invalid minutes-only format', () => {
        expect(getFormattedCellHours(':60')).toBe(-1);
        expect(getFormattedCellHours(':75')).toBe(-1);
        expect(getFormattedCellHours(':99')).toBe(-1);
      });

      it('should handle single digit minutes in minutes-only format', () => {
        expect(getFormattedCellHours(':5')).toBe(0.08333333333333333);
        expect(getFormattedCellHours(':9')).toBe(0.15);
      });
    });

    describe('Numeric Format Parsing', () => {
      it('should parse integer values', () => {
        expect(getFormattedCellHours('8')).toBe(8);
        expect(getFormattedCellHours('0')).toBe(0);
        expect(getFormattedCellHours('24')).toBe(24);
      });

      it('should parse decimal values', () => {
        expect(getFormattedCellHours('8.5')).toBe(8.5);
        expect(getFormattedCellHours('0.25')).toBe(0.25);
        expect(getFormattedCellHours('12.75')).toBe(12.75);
      });

      it('should handle negative values (convert to zero)', () => {
        expect(getFormattedCellHours('-5')).toBe(0);
        expect(getFormattedCellHours('-8.5')).toBe(0);
      });

      it('should reject invalid numeric formats', () => {
        expect(getFormattedCellHours('abc')).toBe(-1);
        expect(getFormattedCellHours('8.5.2')).toBe(-1);
        expect(getFormattedCellHours('8:30:45')).toBe(-1);
      });

      it('should handle values over 24 hours (caps to 24)', () => {
        expect(getFormattedCellHours('25')).toBe(24);
        expect(getFormattedCellHours('30.5')).toBe(24);
        expect(getFormattedCellHours('100')).toBe(24);
      });
    });

    describe('Edge Cases and Validation', () => {
      it('should handle empty string', () => {
        expect(getFormattedCellHours('')).toBe(0);
      });

      it('should handle whitespace-only strings', () => {
        expect(getFormattedCellHours('   ')).toBe(0);
        expect(getFormattedCellHours('\t\n')).toBe(0);
      });

      it('should handle NaN results from parseFloat', () => {
        expect(getFormattedCellHours('abc')).toBe(-1);
        expect(getFormattedCellHours('8abc')).toBe(-1);
      });

      it('should handle boundary values', () => {
        expect(getFormattedCellHours('24')).toBe(24);
        expect(getFormattedCellHours('0')).toBe(0);
        expect(getFormattedCellHours('24.1')).toBe(24);
        expect(getFormattedCellHours('-0.1')).toBe(0);
      });
    });

    describe('Additional Edge Cases and Boundary Tests', () => {
      it('should handle floating point precision edge cases', () => {
        expect(getFormattedCellHours('7.333333333')).toBeCloseTo(7.333333333);
        expect(getFormattedCellHours('15.99999999')).toBeCloseTo(15.99999999);
        expect(getFormattedCellHours('0.00001')).toBeCloseTo(0.00001);
      });

      it('should handle very large hour values (over 1000)', () => {
        expect(getFormattedCellHours('999')).toBe(24);
        expect(getFormattedCellHours('1000.5')).toBe(24);
        expect(getFormattedCellHours('50:30')).toBe(24);
      });

      it('should handle special characters and mixed formats', () => {
        expect(getFormattedCellHours('8.5h')).toBe(-1);
        expect(getFormattedCellHours('8 hours')).toBe(-1);
        expect(getFormattedCellHours('8.5.0')).toBe(-1);
        expect(getFormattedCellHours('8,5')).toBe(-1);
        expect(getFormattedCellHours('8:30:00')).toBe(-1);
      });

      it('should handle various whitespace scenarios', () => {
        expect(getFormattedCellHours(' 8.5 ')).toBe(-1); // Function doesn't trim whitespace, returns -1
        expect(getFormattedCellHours('\t8:30\n')).toBe(-1); // Function doesn't trim whitespace, returns -1
        expect(getFormattedCellHours('  :15  ')).toBe(-1); // Function doesn't trim whitespace, returns -1
        expect(getFormattedCellHours(' \t \n ')).toBe(0); // Empty/whitespace returns 0
      });

      it('should handle duration format with leading zeros', () => {
        expect(getFormattedCellHours('08:30')).toBe(8.5);
        expect(getFormattedCellHours('00:15')).toBe(0.25);
        expect(getFormattedCellHours('01:00')).toBe(1);
        expect(getFormattedCellHours('00:00')).toBe(0);
      });

      it('should handle decimal precision for minutes conversion', () => {
        expect(getFormattedCellHours('8:01')).toBeCloseTo(8.016666666666667);
        expect(getFormattedCellHours('8:02')).toBeCloseTo(8.033333333333333);
        expect(getFormattedCellHours('8:33')).toBeCloseTo(8.55);
      });
    });
  });

  describe('hasTimeEntryChanges', () => {
    it('should return true when operation exists', () => {
      const timeEntry: timeEntryDetails = {
        timeEntryId: '123',
        date: '2024-01-01',
        hours: 8,
        operation: 'UPDATE',
        isApproved: false,
      };
      expect(hasTimeEntryChanges(timeEntry)).toBe(true);
    });

    it('should return true for DELETE operation', () => {
      const timeEntry: timeEntryDetails = {
        timeEntryId: '123',
        date: '2024-01-01',
        hours: 8,
        operation: 'DELETE',
        isApproved: false,
      };
      expect(hasTimeEntryChanges(timeEntry)).toBe(true);
    });

    it('should return true for CREATE operation', () => {
      const timeEntry: timeEntryDetails = {
        timeEntryId: '',
        date: '2024-01-01',
        hours: 8,
        operation: 'CREATE',
        isApproved: false,
      };
      expect(hasTimeEntryChanges(timeEntry)).toBe(true);
    });

    it('should return false when no operation', () => {
      const timeEntry: timeEntryDetails = {
        timeEntryId: '123',
        date: '2024-01-01',
        hours: 8,
        isApproved: false,
      };
      expect(hasTimeEntryChanges(timeEntry)).toBe(false);
    });
  });

  describe('calculateRowBillableAmount', () => {
    const mockRow: TimesheetRow = {
      rowId: 'row-1',
      timeAgainst: {
        type: DataAccess_ContactType.Customer,
        id: 'customer-1',
        displayName: 'Customer 1',
      },
      timeEntries: {
        0: {
          timeEntryId: '1',
          date: '2024-01-01',
          hours: 8,
          isApproved: false,
          billableInfo: { billable: true, billableRate: '100' },
        },
        1: {
          timeEntryId: '2',
          date: '2024-01-02',
          hours: 6,
          isApproved: false,
          billableInfo: { billable: true, billableRate: '75' },
        },
        2: {
          timeEntryId: '3',
          date: '2024-01-03',
          hours: 4,
          isApproved: false,
          billableInfo: { billable: false, billableRate: '50' },
        },
        3: {
          timeEntryId: '4',
          date: '2024-01-04',
          hours: 2,
          isApproved: false,
          billableInfo: { billable: true, billableRate: '125' },
        },
      },
      totalHours: 20,
      billableTotal: 0,
      hasApprovedEntries: false,
    };

    it('should calculate billable amount for billable entries', () => {
      const visibleDays = [0, 1, 3]; // Only billable days
      // 8 * 100 + 6 * 75 + 2 * 125 = 800 + 450 + 250 = 1500
      expect(calculateRowBillableAmount(mockRow, visibleDays)).toBe(1500);
    });

    it('should exclude non-billable entries from calculation', () => {
      const visibleDays = [0, 1, 2, 3];
      // 8 * 100 + 6 * 75 + 0 + 2 * 125 = 800 + 450 + 0 + 250 = 1500
      expect(calculateRowBillableAmount(mockRow, visibleDays)).toBe(1500);
    });

    it('should handle entries without billableInfo', () => {
      const rowWithoutBillableInfo: TimesheetRow = {
        ...mockRow,
        timeEntries: {
          0: {
            timeEntryId: '1',
            date: '2024-01-01',
            hours: 8,
            isApproved: false,
          },
          1: {
            timeEntryId: '2',
            date: '2024-01-02',
            hours: 6,
            isApproved: false,
            billableInfo: { billable: true, billableRate: '100' },
          },
        },
      };
      expect(calculateRowBillableAmount(rowWithoutBillableInfo, [0, 1])).toBe(
        600,
      ); // Only day 1 is billable
    });

    it('should handle invalid billable rates', () => {
      const rowWithInvalidRates: TimesheetRow = {
        ...mockRow,
        timeEntries: {
          0: {
            timeEntryId: '1',
            date: '2024-01-01',
            hours: 8,
            isApproved: false,
            billableInfo: { billable: true, billableRate: 'invalid' },
          },
          1: {
            timeEntryId: '2',
            date: '2024-01-02',
            hours: 6,
            isApproved: false,
            billableInfo: { billable: true, billableRate: '100' },
          },
        },
      };
      expect(calculateRowBillableAmount(rowWithInvalidRates, [0, 1])).toBe(600); // Only day 1 contributes
    });

    it('should handle zero hours', () => {
      const rowWithZeroHours: TimesheetRow = {
        ...mockRow,
        timeEntries: {
          0: {
            timeEntryId: '1',
            date: '2024-01-01',
            hours: 0,
            isApproved: false,
            billableInfo: { billable: true, billableRate: '100' },
          },
          1: {
            timeEntryId: '2',
            date: '2024-01-02',
            hours: 8,
            isApproved: false,
            billableInfo: { billable: true, billableRate: '50' },
          },
        },
      };
      expect(calculateRowBillableAmount(rowWithZeroHours, [0, 1])).toBe(400); // 0 + 8 * 50
    });

    it('should return 0 for empty visible days', () => {
      expect(calculateRowBillableAmount(mockRow, [])).toBe(0);
    });

    it('should handle decimal hours and rates', () => {
      const rowWithDecimals: TimesheetRow = {
        ...mockRow,
        timeEntries: {
          0: {
            timeEntryId: '1',
            date: '2024-01-01',
            hours: 7.5,
            isApproved: false,
            billableInfo: { billable: true, billableRate: '125.50' },
          },
        },
      };
      expect(calculateRowBillableAmount(rowWithDecimals, [0])).toBe(941.25); // 7.5 * 125.50
    });
  });

  describe('getBillableStatus', () => {
    it('should return "Yes" when billable is true', () => {
      const row: TimesheetRow = {
        rowId: 'row-1',
        timeAgainst: { type: null, id: null, displayName: null },
        timeEntries: {
          0: {
            timeEntryId: '1',
            date: '2024-01-01',
            hours: 8,
            isApproved: false,
            billableInfo: { billable: true, billableRate: '100' },
          },
        },
        totalHours: 8,
        billableTotal: 0,
        hasApprovedEntries: false,
      };
      expect(getBillableStatus(row)).toBe('Yes');
    });

    it('should return "No" when billable is false', () => {
      const row: TimesheetRow = {
        rowId: 'row-1',
        timeAgainst: { type: null, id: null, displayName: null },
        timeEntries: {
          0: {
            timeEntryId: '1',
            date: '2024-01-01',
            hours: 8,
            isApproved: false,
            billableInfo: { billable: false, billableRate: '100' },
          },
        },
        totalHours: 8,
        billableTotal: 0,
        hasApprovedEntries: false,
      };
      expect(getBillableStatus(row)).toBe('No');
    });

    it('should return "No" when billableInfo is missing', () => {
      const row: TimesheetRow = {
        rowId: 'row-1',
        timeAgainst: { type: null, id: null, displayName: null },
        timeEntries: {
          0: {
            timeEntryId: '1',
            date: '2024-01-01',
            hours: 8,
            isApproved: false,
          },
        },
        totalHours: 8,
        billableTotal: 0,
        hasApprovedEntries: false,
      };
      expect(getBillableStatus(row)).toBe('No');
    });

    it('should return "No" when billable is undefined', () => {
      const row: TimesheetRow = {
        rowId: 'row-1',
        timeAgainst: { type: null, id: null, displayName: null },
        timeEntries: {
          0: {
            timeEntryId: '1',
            date: '2024-01-01',
            hours: 8,
            isApproved: false,
            billableInfo: { billableRate: '100' } as any,
          },
        },
        totalHours: 8,
        billableTotal: 0,
        hasApprovedEntries: false,
      };
      expect(getBillableStatus(row)).toBe('No');
    });
  });

  describe('getClassName', () => {
    it('should return class name when available', () => {
      const row: TimesheetRow = {
        rowId: 'row-1',
        timeAgainst: { type: null, id: null, displayName: null },
        timeEntries: {
          0: {
            timeEntryId: '1',
            date: '2024-01-01',
            hours: 8,
            metaInfo: { class: { id: 'class-1', name: 'Development' } },
            isApproved: false,
          },
        },
        totalHours: 8,
        billableTotal: 0,
        hasApprovedEntries: false,
      };
      expect(getClassName(row)).toBe('Development');
    });

    it('should return empty string when no class', () => {
      const row: TimesheetRow = {
        rowId: 'row-1',
        timeAgainst: { type: null, id: null, displayName: null },
        timeEntries: {
          0: {
            timeEntryId: '1',
            date: '2024-01-01',
            hours: 8,
            isApproved: false,
          },
        },
        totalHours: 8,
        billableTotal: 0,
        hasApprovedEntries: false,
      };
      expect(getClassName(row)).toBe('');
    });
  });

  describe('getLocationName', () => {
    it('should return location name when available', () => {
      const row: TimesheetRow = {
        rowId: 'row-1',
        timeAgainst: { type: null, id: null, displayName: null },
        timeEntries: {
          0: {
            timeEntryId: '1',
            date: '2024-01-01',
            hours: 8,
            metaInfo: { location: { id: 'location-1', name: 'Office' } },
            isApproved: false,
          },
        },
        totalHours: 8,
        billableTotal: 0,
        hasApprovedEntries: false,
      };
      expect(getLocationName(row)).toBe('Office');
    });

    it('should return empty string when no location', () => {
      const row: TimesheetRow = {
        rowId: 'row-1',
        timeAgainst: { type: null, id: null, displayName: null },
        timeEntries: {
          0: {
            timeEntryId: '1',
            date: '2024-01-01',
            hours: 8,
            isApproved: false,
          },
        },
        totalHours: 8,
        billableTotal: 0,
        hasApprovedEntries: false,
      };
      expect(getLocationName(row)).toBe('');
    });
  });

  describe('Additional Edge Cases for Existing Functions', () => {
    describe('getHeaderData edge cases', () => {
      it('should handle extremely large totals', () => {
        const largeTimeEntries = [
          {
            rowId: 'row-1',
            timeAgainst: { type: null, id: null },
            timeEntries: {
              0: {
                hours: 999.99,
                billableInfo: { billable: true, billableRate: '999.99' },
                isApproved: false,
                timeEntryId: '1',
                date: '2024-01-01',
              },
            },
            totalHours: 999.99,
            billableTotal: 999980.0001,
            hasApprovedEntries: false,
          } as TimesheetRow,
        ];

        const result = getHeaderData(
          { start: '2024-01-01', end: '2024-01-07' },
          [0],
          largeTimeEntries,
          0,
        );

        expect(result[1].value).toBe('999:59'); // Large hours should format correctly
        expect(result[2].value).toBe('999:59'); // Total hours
        expect(result[3].value).toMatch(/^\$999980\./); // Billable amount
      });

      it('should detect day totals exceeding 24 hours', () => {
        const overtimeEntries = [
          {
            rowId: 'row-1',
            timeAgainst: { type: null, id: null },
            timeEntries: {
              0: {
                hours: 15,
                isApproved: false,
                timeEntryId: '1',
                date: '2024-01-01',
              },
            },
            totalHours: 15,
            billableTotal: 0,
            hasApprovedEntries: false,
          },
          {
            rowId: 'row-2',
            timeAgainst: { type: null, id: null },
            timeEntries: { 0: { hours: 10 } },
            totalHours: 10,
            billableTotal: 0,
            hasApprovedEntries: false,
          },
        ] as TimesheetRow[];

        const result = getHeaderData(
          { start: '2024-01-01', end: '2024-01-07' },
          [0],
          overtimeEntries,
          0,
        );

        expect(result[1].hasError).toBe(true); // 15 + 10 = 25 hours > 24
      });
    });

    describe('getRowData edge cases', () => {
      it('should handle row with all zero hours', () => {
        const zeroHoursRow: TimesheetRow = {
          rowId: 'zero-row',
          timeAgainst: { type: null, id: null, displayName: null },
          timeEntries: {
            0: {
              timeEntryId: '',
              date: '2024-01-01',
              hours: 0,
              isApproved: false,
            },
            1: {
              timeEntryId: '',
              date: '2024-01-02',
              hours: 0,
              isApproved: false,
            },
          },
          totalHours: 0,
          billableTotal: 0,
          hasApprovedEntries: false,
        };

        const result = getRowData(zeroHoursRow, [0, 1], 0);
        expect(result[1].value).toBe(0);
        expect(result[2].value).toBe(0);
        expect(result[3].value).toBe('0:00');
      });

      it('should handle very long customer names', () => {
        const longNameRow: TimesheetRow = {
          rowId: 'long-name-row',
          timeAgainst: {
            type: DataAccess_ContactType.Customer,
            id: 'very-long-customer-name-that-might-cause-layout-issues-in-ui-components',
            displayName: 'very-long-customer-name',
          },
          timeEntries: {},
          totalHours: 0,
          billableTotal: 0,
          hasApprovedEntries: false,
        };

        const result = getRowData(longNameRow, [0], 0);
        expect(result[0].value).toBe(
          'very-long-customer-name-that-might-cause-layout-issues-in-ui-components',
        );
      });
    });

    describe('createEmptyRow edge cases', () => {
      it('should handle week with string dates', () => {
        const weekWithStringDates = {
          startDate: '2024-06-10',
          endDate: '2024-06-16',
        };

        const result = createEmptyRow(weekWithStringDates as any);
        expect(result.timeEntries[0].date).toBe('2024-06-10');
        expect(result.timeEntries[6].date).toBe('2024-06-16');
      });

      it('should handle leap year dates', () => {
        const leapYearWeek = {
          startDate: dayjs('2024-02-26'), // Leap year
          endDate: dayjs('2024-03-03'),
        };

        const result = createEmptyRow(leapYearWeek);
        expect(result.timeEntries[0].date).toBe('2024-02-26');
        expect(result.timeEntries[2].date).toBe('2024-02-28');
        expect(result.timeEntries[3].date).toBe('2024-02-29'); // Leap day
        expect(result.timeEntries[6].date).toBe('2024-03-03');
      });

      it('should generate consistent row IDs when mocked', () => {
        const week = mockWeek;
        const row1 = createEmptyRow(week);
        const row2 = createEmptyRow(week);
        // In test environment, UUID is mocked to return consistent values
        expect(row1.rowId).toBe('test-uuid-123');
        expect(row2.rowId).toBe('test-uuid-123');
        expect(row1.rowId).toMatch(/^test-uuid-/); // Mock UUID format
        expect(row2.rowId).toMatch(/^test-uuid-/); // Mock UUID format
      });
    });

    describe('getCustomerName edge cases', () => {
      it('should handle break types not in breaks data', () => {
        const row: TimesheetRow = {
          rowId: 'test-row',
          timeAgainst: {
            type: 'PAID',
            id: 'nonexistent-break',
            displayName: 'break',
          },
          timeEntries: {},
          totalHours: 0,
          billableTotal: 0,
          hasApprovedEntries: false,
        };

        const mockBreaksData = [{ id: 'lunch', breakName: 'Lunch Break' }];

        expect(getCustomerName(row, [], mockBreaksData)).toBe('Select ...');
      });

      it('should handle unknown time off IDs', () => {
        const row: TimesheetRow = {
          rowId: 'test-row',
          timeAgainst: {
            type: 'TIME_OFF',
            id: 'unknown',
            displayName: null,
          },
          timeEntries: {},
          totalHours: 0,
          billableTotal: 0,
          hasApprovedEntries: false,
        };

        expect(getCustomerName(row, [])).toBe('Time off');
      });

      it('should handle empty customer data arrays by using displayName from timeAgainst', () => {
        const row: TimesheetRow = {
          rowId: 'test-row',
          timeAgainst: {
            type: DataAccess_ContactType.Customer,
            id: 'customer-1',
            displayName: 'My Customer',
          },
          timeEntries: {},
          totalHours: 0,
          billableTotal: 0,
          hasApprovedEntries: false,
        };

        expect(getCustomerName(row, [])).toBe('My Customer');
      });

      it('should return fallback when customer not in store and no displayName in timeAgainst', () => {
        const row: TimesheetRow = {
          rowId: 'test-row',
          timeAgainst: {
            type: DataAccess_ContactType.Customer,
            id: 'customer-1',
            displayName: null as any,
          },
          timeEntries: {},
          totalHours: 0,
          billableTotal: 0,
          hasApprovedEntries: false,
        };

        expect(getCustomerName(row, [])).toBe('Select ...');
      });
    });
  });
});

describe('Break Detection Utilities', () => {
  describe('isBreakType', () => {
    it('should return true for PAID type', () => {
      expect(isBreakType('PAID')).toBe(true);
    });

    it('should return true for UNPAID type', () => {
      expect(isBreakType('UNPAID')).toBe(true);
    });

    it('should return false for CUSTOMER type', () => {
      expect(isBreakType('CUSTOMER')).toBe(false);
    });

    it('should return false for PROJECT type', () => {
      expect(isBreakType('PROJECT')).toBe(false);
    });

    it('should return false for null type', () => {
      expect(isBreakType(null)).toBe(false);
    });

    it('should return false for undefined type', () => {
      expect(isBreakType(undefined as any)).toBe(false);
    });
  });

  describe('isBreakRow', () => {
    it('should return true for PAID timeAgainst', () => {
      expect(isBreakRow({ type: 'PAID' })).toBe(true);
    });

    it('should return true for UNPAID timeAgainst', () => {
      expect(isBreakRow({ type: 'UNPAID' })).toBe(true);
    });

    it('should return false for CUSTOMER timeAgainst', () => {
      expect(isBreakRow({ type: 'CUSTOMER' })).toBe(false);
    });

    it('should return false for null timeAgainst', () => {
      expect(isBreakRow(null)).toBe(false);
    });

    it('should return false for undefined timeAgainst', () => {
      expect(isBreakRow(undefined)).toBe(false);
    });
  });
});

describe('Field Management Utilities', () => {
  describe('clearBreakIncompatibleFields', () => {
    it('should clear all break-incompatible fields', () => {
      const cell = {
        metaInfo: { service: { id: '1', name: 'Service' } },
        billableInfo: { billable: true, billableRate: '100' },
        notes: 'Some notes',
        customFields: [{ id: '1', name: 'Field', value: 'Value' }],
        hours: 8,
        timeEntryId: 'entry1',
      };

      const result = clearBreakIncompatibleFields(cell);

      expect(result.metaInfo).toBeUndefined();
      expect(result.billableInfo).toBeUndefined();
      expect(result.notes).toBe('Some notes'); // Notes should be preserved for break entries
      expect(result.customFields).toBeUndefined();
      expect(result.hours).toBe(8); // Should preserve hours
      expect(result.timeEntryId).toBe('entry1'); // Should preserve timeEntryId
    });
  });

  describe('setDefaultBillableInfo', () => {
    it('should set default billable info when cell has no billableInfo', () => {
      const cell = { hours: 8 };
      const teamMember = { billable: true, billableRate: 100 };

      const result = setDefaultBillableInfo(cell, teamMember);

      expect(result.billableInfo).toEqual({
        billable: true,
        billableRate: '100',
      });
    });

    it('should not modify cell when it already has billableInfo', () => {
      const cell = {
        hours: 8,
        billableInfo: { billable: false, billableRate: '50' },
      };
      const teamMember = { billable: true, billableRate: 100 };

      const result = setDefaultBillableInfo(cell, teamMember);

      expect(result.billableInfo).toEqual({
        billable: false,
        billableRate: '50',
      });
    });

    it('should handle teamMember with undefined values', () => {
      const cell = { hours: 8 };
      const teamMember = { billable: undefined, billableRate: undefined };

      const result = setDefaultBillableInfo(cell, teamMember);

      expect(result.billableInfo).toEqual({
        billable: false,
        billableRate: '0',
      });
    });

    it('should return cell unchanged when teamMember is null', () => {
      const cell = { hours: 8 };
      const teamMember = null;

      const result = setDefaultBillableInfo(cell, teamMember);

      expect(result).toEqual(cell);
    });
  });

  describe('determineCellOperation', () => {
    it('should return UPDATE when cell has timeEntryId', () => {
      const cell = { timeEntryId: 'entry1' };
      expect(determineCellOperation(cell)).toBe('UPDATE');
    });

    it('should return UPDATE when cell has non-empty timeEntryId', () => {
      const cell = { timeEntryId: 'entry1' };
      expect(determineCellOperation(cell)).toBe('UPDATE');
    });

    it('should return CREATE when cell has empty timeEntryId', () => {
      const cell = { timeEntryId: '' };
      expect(determineCellOperation(cell)).toBe('CREATE');
    });

    it('should return CREATE when cell has null timeEntryId', () => {
      const cell = { timeEntryId: null };
      expect(determineCellOperation(cell)).toBe('CREATE');
    });

    it('should return CREATE when cell has undefined timeEntryId', () => {
      const cell = { timeEntryId: undefined };
      expect(determineCellOperation(cell)).toBe('CREATE');
    });

    it('should return CREATE when cell has no timeEntryId property', () => {
      const cell = { hours: 8 };
      expect(determineCellOperation(cell)).toBe('CREATE');
    });
  });
});

describe('Time Category Change Processing', () => {
  describe('processTimeCategoryChange', () => {
    it('should not process cells with no hours', () => {
      const cell = { hours: 0 };
      const isNewBreakType = true;
      const teamMember = { billable: true, billableRate: 100 };

      const result = processTimeCategoryChange(
        cell,
        isNewBreakType,
        teamMember,
      );

      expect(result).toEqual(cell);
    });

    it('should not process cells with undefined hours', () => {
      const cell = { hours: undefined };
      const isNewBreakType = true;
      const teamMember = { billable: true, billableRate: 100 };

      const result = processTimeCategoryChange(
        cell,
        isNewBreakType,
        teamMember,
      );

      expect(result).toEqual(cell);
    });

    it('should clear fields and mark for operation when converting to break type', () => {
      const cell = {
        hours: 8,
        metaInfo: { service: { id: '1', name: 'Service' } },
        billableInfo: { billable: true, billableRate: '100' },
        notes: 'Some notes',
        customFields: [{ id: '1', name: 'Field', value: 'Value' }],
        timeEntryId: 'entry1',
      };
      const isNewBreakType = true;
      const teamMember = { billable: true, billableRate: 100 };

      const result = processTimeCategoryChange(
        cell,
        isNewBreakType,
        teamMember,
      );

      expect(result.metaInfo).toBeUndefined();
      expect(result.billableInfo).toBeUndefined();
      expect(result.notes).toBe('');
      expect(result.customFields).toBeUndefined();
      expect(result.operation).toBe('UPDATE');
    });

    it('should set default billable info and mark for operation when converting to customer type', () => {
      const cell = {
        hours: 8,
        timeEntryId: null,
      };
      const isNewBreakType = false;
      const teamMember = { billable: true, billableRate: 100 };

      const result = processTimeCategoryChange(
        cell,
        isNewBreakType,
        teamMember,
      );

      expect(result.billableInfo).toEqual({
        billable: true,
        billableRate: '100',
      });
      expect(result.operation).toBe('CREATE');
    });

    it('should preserve existing billable info when converting to customer type', () => {
      const cell = {
        hours: 8,
        billableInfo: { billable: false, billableRate: '50' },
        timeEntryId: 'entry1',
      };
      const isNewBreakType = false;
      const teamMember = { billable: true, billableRate: 100 };

      const result = processTimeCategoryChange(
        cell,
        isNewBreakType,
        teamMember,
      );

      expect(result.billableInfo).toEqual({
        billable: false,
        billableRate: '50',
      });
      expect(result.operation).toBe('UPDATE');
    });
  });

  describe('enrichCFOOptionsWithNamesFromCF', () => {
    const allCustomFields = [
      {
        id: 'cf1',
        options: [
          { id: 'opt1', name: 'Option 1' },
          { id: 'CES_2', name: 'Option 2' },
        ],
      },
    ];

    it('should use direct match when option id matches CF definition id', () => {
      const options = [
        { id: 'opt1', name: 'opt1', assigned: true },
        { id: 'CES_2', name: 'CES_2', assigned: true },
      ];
      const result = enrichCFOOptionsWithNamesFromCF(
        options,
        'cf1',
        allCustomFields,
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ id: 'opt1', name: 'Option 1' });
      expect(result[1]).toMatchObject({ id: 'CES_2', name: 'Option 2' });
    });

    it('should use suffix fallback when option id differs by prefix but suffix matches', () => {
      const options = [{ id: 'QL_2', name: 'QL_2', assigned: true }];
      const result = enrichCFOOptionsWithNamesFromCF(
        options,
        'cf1',
        allCustomFields,
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ id: 'QL_2', name: 'Option 2' });
    });

    it('should call sandbox.logger.info when suffix fallback is used', () => {
      const mockLogger = { info: jest.fn() };
      const sandbox = { logger: mockLogger };
      const options = [{ id: 'QL_2', name: 'QL_2', assigned: true }];
      enrichCFOOptionsWithNamesFromCF(
        options,
        'cf1',
        allCustomFields,
        sandbox as any,
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Event=WTEAssignments Message=Suffix fallback was used as CFO ids provided by CES and QL dont match',
        { customFieldId: 'cf1' },
      );
    });
  });
});

describe('Weekly submit-time lock helpers', () => {
  const minSelectableDate = dayjs('2025-06-10');

  describe('isWeeklyCellLocked', () => {
    it('returns true when the row is a time-off row regardless of other inputs', () => {
      expect(
        isWeeklyCellLocked(undefined, null, true, undefined, undefined),
      ).toBe(true);
      expect(
        isWeeklyCellLocked(
          '2025-06-15',
          '2025-06-01',
          true,
          minSelectableDate,
          true,
        ),
      ).toBe(true);
    });

    it('locks cells on or before the max approved date', () => {
      expect(isWeeklyCellLocked('2025-06-01', '2025-06-05', false)).toBe(true);
      expect(isWeeklyCellLocked('2025-06-05', '2025-06-05', false)).toBe(true);
      expect(isWeeklyCellLocked('2025-06-06', '2025-06-05', false)).toBe(false);
    });

    it('locks cells before the submit-time boundary only when the feature is enabled', () => {
      expect(
        isWeeklyCellLocked('2025-06-09', null, false, minSelectableDate, true),
      ).toBe(true);
      expect(
        isWeeklyCellLocked('2025-06-09', null, false, minSelectableDate, false),
      ).toBe(false);
      expect(
        isWeeklyCellLocked(
          '2025-06-09',
          null,
          false,
          minSelectableDate,
          undefined,
        ),
      ).toBe(false);
    });

    it('does not lock cells on or after the submit-time boundary', () => {
      expect(
        isWeeklyCellLocked('2025-06-10', null, false, minSelectableDate, true),
      ).toBe(false);
      expect(
        isWeeklyCellLocked('2025-06-11', null, false, minSelectableDate, true),
      ).toBe(false);
    });

    it('returns false when neither approved date nor submit-time boundary lock the cell', () => {
      expect(isWeeklyCellLocked('2025-06-15', null, false)).toBe(false);
      expect(
        isWeeklyCellLocked('2025-06-15', null, false, undefined, true),
      ).toBe(false);
      expect(
        isWeeklyCellLocked(null, null, false, minSelectableDate, true),
      ).toBe(false);
    });
  });

  describe('isWeeklyRowLocked', () => {
    const emptyEntries = {};
    const entriesWithData = {
      0: {
        date: '2025-06-08',
        hours: 2,
        timeEntryId: 'te-1',
      } as timeEntryDetails,
    };
    const entriesWithoutData = {
      0: {
        date: '2025-06-08',
        hours: 0,
        timeEntryId: '   ',
      } as timeEntryDetails,
    };

    it('returns true when the row has approved entries', () => {
      expect(
        isWeeklyRowLocked(true, false, emptyEntries, minSelectableDate, true),
      ).toBe(true);
    });

    it('returns true when the row is a time-off row', () => {
      expect(
        isWeeklyRowLocked(false, true, emptyEntries, minSelectableDate, true),
      ).toBe(true);
    });

    it('returns false when submit-time is disabled even if entries fall before the boundary', () => {
      expect(
        isWeeklyRowLocked(
          false,
          false,
          entriesWithData,
          minSelectableDate,
          false,
        ),
      ).toBe(false);
      expect(
        isWeeklyRowLocked(
          false,
          false,
          entriesWithData,
          minSelectableDate,
          undefined,
        ),
      ).toBe(false);
    });

    it('returns false when no minSelectableDate is provided', () => {
      expect(
        isWeeklyRowLocked(false, false, entriesWithData, undefined, true),
      ).toBe(false);
    });

    it('locks the row when at least one entry with data falls before the submit-time boundary', () => {
      expect(
        isWeeklyRowLocked(
          false,
          false,
          entriesWithData,
          minSelectableDate,
          true,
        ),
      ).toBe(true);
    });

    it('does not lock the row when entries before the boundary have no persisted or entered data', () => {
      expect(
        isWeeklyRowLocked(
          false,
          false,
          entriesWithoutData,
          minSelectableDate,
          true,
        ),
      ).toBe(false);
    });

    it('does not lock the row when entries with data fall on or after the boundary', () => {
      const entriesAfterBoundary = {
        0: {
          date: '2025-06-11',
          hours: 4,
          timeEntryId: 'te-2',
        } as timeEntryDetails,
      };
      expect(
        isWeeklyRowLocked(
          false,
          false,
          entriesAfterBoundary,
          minSelectableDate,
          true,
        ),
      ).toBe(false);
    });
  });
});

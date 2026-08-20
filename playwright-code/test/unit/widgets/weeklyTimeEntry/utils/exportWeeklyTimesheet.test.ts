import * as XLSX from 'xlsx';
import { exportWeeklyTimesheet } from 'src/js/widgets/weeklyTimeEntry/utils/exportWeeklyTimesheet';
import type { TimesheetRow } from 'src/js/widgets/weeklyTimeEntry/store/timeEntryGridSlice';
import { DataAccess_ContactType } from 'src/__generated__/oigql/graphql';

// Mock the XLSX library
jest.mock('xlsx', () => ({
  utils: {
    book_new: jest.fn(),
    aoa_to_sheet: jest.fn(),
    book_append_sheet: jest.fn(),
    encode_cell: jest.fn(),
  },
  writeFile: jest.fn(),
}));

describe('exportWeeklyTimesheet', () => {
  const mockWorkbook = {};
  const mockWorksheet = {
    '!cols': [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (XLSX.utils.book_new as jest.Mock).mockReturnValue(mockWorkbook);
    (XLSX.utils.aoa_to_sheet as jest.Mock).mockReturnValue(mockWorksheet);
    (XLSX.utils.encode_cell as jest.Mock).mockReturnValue('A1');
  });

  it('should export timesheet data with correct structure', async () => {
    const mockRows: TimesheetRow[] = [
      {
        rowId: 'export-row-1',
        timeAgainst: {
          type: DataAccess_ContactType.Customer,
          id: 'customer1',
          displayName: 'customer1',
        },
        timeEntries: {
          0: {
            timeEntryId: 'entry1',
            date: '2024-06-10',
            hours: 8,
            notes: 'Work on project',
            metaInfo: {
              service: { id: 'service1', name: 'Development' },
            },
            billableInfo: {
              billable: true,
              billableRate: '100',
            },
            isApproved: false,
          },
          1: {
            timeEntryId: 'entry2',
            date: '2024-06-11',
            hours: 6,
            notes: 'Meeting',
            metaInfo: {
              service: { id: 'service1', name: 'Development' },
            },
            billableInfo: {
              billable: true,
              billableRate: '100',
            },
            isApproved: false,
          },
        },
        totalHours: 14,
        billableTotal: 1400,
        hasApprovedEntries: false,
      },
    ];

    const dateRange = {
      start: '2024-06-10',
      end: '2024-06-16',
    };

    const visibleDays = [0, 1, 2, 3, 4, 5, 6];
    const currencySymbol = '$';

    await exportWeeklyTimesheet({
      rows: mockRows,
      dateRange,
      visibleDays,
      weekDates: [
        '2024-06-10',
        '2024-06-11',
        '2024-06-12',
        '2024-06-13',
        '2024-06-14',
        '2024-06-15',
        '2024-06-16',
      ],
      customerData: [],
      currencySymbol,
    });

    // Verify XLSX functions were called
    expect(XLSX.utils.book_new).toHaveBeenCalled();
    expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalled();
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(
      mockWorkbook,
      mockWorksheet,
      'Weekly Timesheet',
    );

    // Verify the worksheet data structure
    const worksheetData = (XLSX.utils.aoa_to_sheet as jest.Mock).mock
      .calls[0][0];

    // Check title
    expect(worksheetData[0]).toEqual(['Weekly Time Sheet']);

    // Check headers
    expect(worksheetData[1]).toContain('Customer');
    expect(worksheetData[1]).toContain('Service');
    expect(worksheetData[1]).toContain('Total Hours');
    expect(worksheetData[1]).toContain('Billable');

    // Check data row
    expect(worksheetData[2]).toContain('Development'); // Service name
    expect(worksheetData[2]).toContain('100'); // Billable rate
    expect(worksheetData[2]).toContain('Yes'); // Billable status
    expect(worksheetData[2]).toContain('Work on project'); // Notes
    expect(worksheetData[2]).toContain('8:00'); // Monday hours
    expect(worksheetData[2]).toContain('6:00'); // Tuesday hours
    expect(worksheetData[2]).toContain('14:00'); // Total hours
    expect(worksheetData[2]).toContain('$1400.00'); // Billable amount

    // Verify filename generation
    expect(XLSX.writeFile).toHaveBeenCalledWith(
      mockWorkbook,
      'weekly_timesheet_2024_Jun_10-16.xlsx',
      { cellStyles: true },
    );
  });

  it('should handle empty rows correctly', async () => {
    const mockRows: TimesheetRow[] = [];
    const dateRange = {
      start: '2024-06-10',
      end: '2024-06-16',
    };
    const visibleDays = [0, 1, 2, 3, 4, 5, 6];
    const currencySymbol = '$';

    await exportWeeklyTimesheet({
      rows: mockRows,
      dateRange,
      visibleDays,
      weekDates: [
        '2024-06-10',
        '2024-06-11',
        '2024-06-12',
        '2024-06-13',
        '2024-06-14',
        '2024-06-15',
        '2024-06-16',
      ],
      customerData: [],
      currencySymbol,
    });

    const worksheetData = (XLSX.utils.aoa_to_sheet as jest.Mock).mock
      .calls[0][0];

    // Should have title, headers, and totals row
    expect(worksheetData).toHaveLength(3);
    expect(worksheetData[0]).toEqual(['Weekly Time Sheet']);
    expect(worksheetData[1]).toContain('Total Hours');
    expect(worksheetData[1]).toContain('Billable');
    expect(worksheetData[2]).toContain('Total');
  });

  it('should format hours correctly', async () => {
    const mockRows: TimesheetRow[] = [
      {
        rowId: 'export-row-2',
        timeAgainst: {
          type: DataAccess_ContactType.Customer,
          id: 'customer1',
          displayName: 'customer1',
        },
        timeEntries: {
          0: {
            timeEntryId: 'entry1',
            date: '2024-06-10',
            hours: 7.5,
            notes: '',
            metaInfo: undefined,
            billableInfo: undefined,
            isApproved: false,
          },
        },
        totalHours: 7.5,
        billableTotal: 0,
        hasApprovedEntries: false,
      },
    ];

    const dateRange = {
      start: '2024-06-10',
      end: '2024-06-16',
    };
    const visibleDays = [0];
    const currencySymbol = '$';

    await exportWeeklyTimesheet({
      rows: mockRows,
      dateRange,
      visibleDays,
      weekDates: [
        '2024-06-10',
        '2024-06-11',
        '2024-06-12',
        '2024-06-13',
        '2024-06-14',
        '2024-06-15',
        '2024-06-16',
      ],
      customerData: [],
      currencySymbol,
    });

    const worksheetData = (XLSX.utils.aoa_to_sheet as jest.Mock).mock
      .calls[0][0];

    // Check that 7.5 hours is formatted as "7:30"
    expect(worksheetData[2]).toContain('7:30');
  });

  it('should handle different time against types', async () => {
    const mockRows: TimesheetRow[] = [
      {
        rowId: 'export-row-3',
        timeAgainst: { type: 'PAID', id: 'lunch', displayName: 'lunch' },
        timeEntries: {
          0: {
            timeEntryId: 'entry1',
            date: '2024-06-10',
            hours: 1,
            notes: 'Lunch break',
            metaInfo: undefined,
            billableInfo: undefined,
            isApproved: false,
          },
        },
        totalHours: 1,
        billableTotal: 0,
        hasApprovedEntries: false,
      },
    ];

    const dateRange = {
      start: '2024-06-10',
      end: '2024-06-16',
    };
    const visibleDays = [0];
    const currencySymbol = '$';

    await exportWeeklyTimesheet({
      rows: mockRows,
      dateRange,
      visibleDays,
      weekDates: [
        '2024-06-10',
        '2024-06-11',
        '2024-06-12',
        '2024-06-13',
        '2024-06-14',
        '2024-06-15',
        '2024-06-16',
      ],
      customerData: [],
      currencySymbol,
    });

    const worksheetData = (XLSX.utils.aoa_to_sheet as jest.Mock).mock
      .calls[0][0];

    // Check that break type shows as "Lunch"
    expect(worksheetData[2]).toContain('Lunch break');
  });
});

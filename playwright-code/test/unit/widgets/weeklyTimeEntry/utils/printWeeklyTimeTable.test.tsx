import { printWeeklyTimeTable } from 'src/js/widgets/weeklyTimeEntry/utils/printWeeklyTimeTable';
import type { TimesheetRow } from 'src/js/widgets/weeklyTimeEntry/store/timeEntryGridSlice';
import { TimeForType } from 'src/js/widgets/weeklyTimeEntry/types';

// Mock window.open
const mockOpen = jest.fn();
const mockWrite = jest.fn();
const mockClose = jest.fn();
const mockFocus = jest.fn();

const mockWindow = {
  document: {
    write: mockWrite,
    close: mockClose,
  },
  focus: mockFocus,
  onload: null as (() => void) | null,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockOpen.mockReturnValue(mockWindow);
  global.window.open = mockOpen;
});

describe('printWeeklyTimeTable', () => {
  const mockParams = {
    rows: [
      {
        rowId: 'print-row-1',
        timeAgainst: {
          type: 'CUSTOMER' as const,
          id: 'customer1',
          displayName: 'customer1',
        },
        timeEntries: {
          0: {
            timeEntryId: '1',
            date: '2024-01-01',
            hours: 8,
            notes: 'Test note',
            billableInfo: { billable: true, billableRate: '50' },
            metaInfo: undefined,
            isApproved: false,
          },
          1: {
            timeEntryId: '2',
            date: '2024-01-02',
            hours: 6,
            notes: 'Test note 2',
            billableInfo: { billable: false },
            metaInfo: undefined,
            isApproved: false,
          },
        },
        totalHours: 14,
        billableTotal: 400,
        hasApprovedEntries: false,
      } as TimesheetRow,
    ],
    dateRange: { start: '2024-01-01', end: '2024-01-07' },
    visibleDays: [0, 1, 2, 3, 4],
    weekDates: [
      '2024-01-01',
      '2024-01-02',
      '2024-01-03',
      '2024-01-04',
      '2024-01-05',
    ],
    customerData: [{ id: 'customer1', displayName: 'Test Customer' }],
    currencySymbol: '$',
    teamMemberName: 'John Doe',
    teamMemberType: TimeForType.EMPLOYEE,
  };

  it('should open a new window and write HTML content', () => {
    printWeeklyTimeTable(mockParams);

    expect(mockOpen).toHaveBeenCalledWith('', '_blank');
    expect(mockWrite).toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalled();
    expect(mockFocus).toHaveBeenCalled();
  });

  it('should include the team member name in the HTML', () => {
    printWeeklyTimeTable(mockParams);

    const htmlContent = mockWrite.mock.calls[0][0];
    expect(htmlContent).toContain('John Doe');
  });

  it('should label the selected employee in the header', () => {
    printWeeklyTimeTable(mockParams);

    const htmlContent = mockWrite.mock.calls[0][0];
    expect(htmlContent).toContain('Employee: John Doe');
  });

  it('should label the selected vendor in the header', () => {
    printWeeklyTimeTable({
      ...mockParams,
      teamMemberType: TimeForType.VENDOR,
      teamMemberName: 'Acme Vendor',
    });

    const htmlContent = mockWrite.mock.calls[0][0];
    expect(htmlContent).toContain('Vendor: Acme Vendor');
  });

  it('should fallback to team member label for non-employee/non-vendor types', () => {
    printWeeklyTimeTable({
      ...mockParams,
      teamMemberType: TimeForType.LEGACY_QBO_USER,
      teamMemberName: 'Legacy User',
    });

    const htmlContent = mockWrite.mock.calls[0][0];
    expect(htmlContent).toContain('Team member: Legacy User');
  });

  it('should include the date range in the HTML', () => {
    printWeeklyTimeTable(mockParams);

    const htmlContent = mockWrite.mock.calls[0][0];
    expect(htmlContent).toContain('2024/01/01');
    expect(htmlContent).toContain('2024/01/07');
  });

  it('should include proper CSS styles for printing', () => {
    printWeeklyTimeTable(mockParams);

    const htmlContent = mockWrite.mock.calls[0][0];
    expect(htmlContent).toContain('@page');
    expect(htmlContent).toContain('@media print');
    expect(htmlContent).toContain('table-layout: fixed');
  });

  it('should handle empty rows gracefully', () => {
    const emptyParams = {
      ...mockParams,
      rows: [],
    };

    printWeeklyTimeTable(emptyParams);

    expect(mockOpen).toHaveBeenCalled();
    expect(mockWrite).toHaveBeenCalled();
  });

  it('should not open window if window.open returns null', () => {
    mockOpen.mockReturnValue(null);

    printWeeklyTimeTable(mockParams);

    expect(mockWrite).not.toHaveBeenCalled();
    expect(mockClose).not.toHaveBeenCalled();
  });

  it('should include customer display name in the HTML', () => {
    printWeeklyTimeTable(mockParams);

    const htmlContent = mockWrite.mock.calls[0][0];
    expect(htmlContent).toContain('Test Customer');
  });

  it('should handle rows with multiple time entries across days', () => {
    const multiDayParams = {
      ...mockParams,
      rows: [
        {
          rowId: 'multi-day-row',
          timeAgainst: {
            type: 'CUSTOMER' as const,
            id: 'customer1',
            displayName: 'customer1',
          },
          timeEntries: {
            0: {
              timeEntryId: '1',
              date: '2024-01-01',
              hours: 8,
              notes: 'Monday work',
              billableInfo: { billable: true, billableRate: '50' },
              metaInfo: undefined,
              isApproved: false,
            },
            1: {
              timeEntryId: '2',
              date: '2024-01-02',
              hours: 6,
              notes: 'Tuesday work',
              billableInfo: { billable: true, billableRate: '50' },
              metaInfo: undefined,
              isApproved: false,
            },
            2: {
              timeEntryId: '3',
              date: '2024-01-03',
              hours: 7,
              notes: 'Wednesday work',
              billableInfo: { billable: false },
              metaInfo: undefined,
              isApproved: false,
            },
          },
          totalHours: 21,
          billableTotal: 700,
          hasApprovedEntries: false,
        } as TimesheetRow,
      ],
    };

    printWeeklyTimeTable(multiDayParams);

    expect(mockOpen).toHaveBeenCalled();
    expect(mockWrite).toHaveBeenCalled();

    const htmlContent = mockWrite.mock.calls[0][0];
    expect(htmlContent).toContain('Test Customer');
  });

  it('should handle rows without billable info', () => {
    const noBillableParams = {
      ...mockParams,
      rows: [
        {
          rowId: 'no-billable-row',
          timeAgainst: {
            type: 'CUSTOMER' as const,
            id: 'customer1',
            displayName: 'customer1',
          },
          timeEntries: {
            0: {
              timeEntryId: '1',
              date: '2024-01-01',
              hours: 4,
              notes: '',
              billableInfo: { billable: false },
              metaInfo: undefined,
              isApproved: false,
            },
          },
          totalHours: 4,
          billableTotal: 0,
          hasApprovedEntries: false,
        } as TimesheetRow,
      ],
    };

    printWeeklyTimeTable(noBillableParams);

    expect(mockOpen).toHaveBeenCalled();
    expect(mockWrite).toHaveBeenCalled();
  });

  it('should render without team member name when not provided', () => {
    const noNameParams = {
      ...mockParams,
      teamMemberName: undefined,
    };

    printWeeklyTimeTable(noNameParams);

    const htmlContent = mockWrite.mock.calls[0][0];
    expect(htmlContent).toContain('Weekly Time Sheet');
    expect(htmlContent).not.toContain('John Doe');
  });

  it('should set onload handler on print window', () => {
    const mockPrint = jest.fn();
    const mockCloseWindow = jest.fn();
    const windowWithOnload: any = {
      document: {
        write: mockWrite,
        close: mockClose,
      },
      focus: mockFocus,
      onload: null as (() => void) | null,
      print: mockPrint,
      close: mockCloseWindow,
    };
    mockOpen.mockReturnValue(windowWithOnload);

    printWeeklyTimeTable(mockParams);

    expect(windowWithOnload.onload).not.toBeNull();
    expect(typeof windowWithOnload.onload).toBe('function');

    // Trigger the onload callback
    windowWithOnload.onload!();
    expect(mockPrint).toHaveBeenCalled();
    expect(mockCloseWindow).toHaveBeenCalled();
  });

  it('should include table structure with correct columns for visible days', () => {
    printWeeklyTimeTable(mockParams);

    const htmlContent = mockWrite.mock.calls[0][0];
    expect(htmlContent).toContain('Job Details');
    expect(htmlContent).toContain('Total');
    expect(htmlContent).toContain('<table');
    expect(htmlContent).toContain('<thead');
    expect(htmlContent).toContain('<tbody');
  });

  it('should render service, class, and location names when present in metaInfo', () => {
    const richMetaParams = {
      ...mockParams,
      rows: [
        {
          rowId: 'rich-row',
          timeAgainst: {
            type: 'CUSTOMER' as const,
            id: 'customer1',
            displayName: 'customer1',
          },
          timeEntries: {
            0: {
              timeEntryId: '10',
              date: '2024-01-01',
              hours: 5,
              notes: 'Detailed work',
              billableInfo: { billable: true, billableRate: '75' },
              metaInfo: {
                service: { id: 's1', name: 'Consulting' },
                class: { id: 'c1', name: 'Engineering' },
                location: { id: 'l1', name: 'HQ Office' },
              },
              isApproved: false,
            },
          },
          totalHours: 5,
          billableTotal: 375,
          hasApprovedEntries: false,
        } as TimesheetRow,
      ],
    };

    printWeeklyTimeTable(richMetaParams);

    const htmlContent = mockWrite.mock.calls[0][0];
    expect(htmlContent).toContain('Consulting');
    expect(htmlContent).toContain('Engineering');
    expect(htmlContent).toContain('HQ Office');
  });

  it('should use fallback key when timeAgainst.id is missing', () => {
    const noIdParams = {
      ...mockParams,
      rows: [
        {
          rowId: 'no-id-row',
          timeAgainst: {
            type: 'CUSTOMER' as const,
            id: '',
            displayName: 'customer1',
          },
          timeEntries: {
            0: {
              timeEntryId: '20',
              date: '2024-01-01',
              hours: 3,
              notes: '',
              billableInfo: { billable: false },
              metaInfo: undefined,
              isApproved: false,
            },
          },
          totalHours: 3,
          billableTotal: 0,
          hasApprovedEntries: false,
        } as TimesheetRow,
      ],
    };

    printWeeklyTimeTable(noIdParams);

    expect(mockOpen).toHaveBeenCalled();
    expect(mockWrite).toHaveBeenCalled();
  });

  it('should filter out rows where no visible day has hours > 0', () => {
    const zeroHoursParams = {
      ...mockParams,
      rows: [
        {
          rowId: 'zero-hours-row',
          timeAgainst: {
            type: 'CUSTOMER' as const,
            id: 'customer1',
            displayName: 'customer1',
          },
          timeEntries: {
            0: {
              timeEntryId: '30',
              date: '2024-01-01',
              hours: 0,
              notes: '',
              billableInfo: { billable: false },
              metaInfo: undefined,
              isApproved: false,
            },
          },
          totalHours: 0,
          billableTotal: 0,
          hasApprovedEntries: false,
        } as TimesheetRow,
        {
          rowId: 'has-hours-row',
          timeAgainst: {
            type: 'CUSTOMER' as const,
            id: 'customer2',
            displayName: 'customer2',
          },
          timeEntries: {
            0: {
              timeEntryId: '31',
              date: '2024-01-01',
              hours: 4,
              notes: '',
              billableInfo: { billable: true, billableRate: '50' },
              metaInfo: undefined,
              isApproved: false,
            },
          },
          totalHours: 4,
          billableTotal: 200,
          hasApprovedEntries: false,
        } as TimesheetRow,
      ],
      customerData: [
        { id: 'customer1', displayName: 'Zero Customer' },
        { id: 'customer2', displayName: 'Active Customer' },
      ],
    };

    printWeeklyTimeTable(zeroHoursParams);

    const htmlContent = mockWrite.mock.calls[0][0];
    expect(htmlContent).toContain('Active Customer');
  });
});

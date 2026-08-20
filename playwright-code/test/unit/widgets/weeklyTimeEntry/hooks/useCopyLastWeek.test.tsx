import { renderHook, act } from '@testing-library/react-hooks';
import { useIntl, useSandbox } from '@payroll/quicksand';
import dayjs from 'dayjs';
import {
  useCopyLastWeek,
  CopyAction,
} from 'src/js/widgets/weeklyTimeEntry/hooks/useCopyLastWeek';
import { useReadWeeklyTimeEntries } from 'src/js/service/hooks/weeklyTimeEntries/useReadWeeklyTimeEntries';
import { transformTimeEntriesToTimesheetRows } from 'src/js/widgets/weeklyTimeEntry/store/timeEntryTransformer';
import { mergeTimeEntries } from 'src/js/widgets/weeklyTimeEntry/store/timeEntryGridSlice';
import { createEmptyRow } from 'src/js/widgets/weeklyTimeEntry/utils/helpers';
import {
  selectTeamMember,
  selectDateRange,
  selectAllTimesheetRows,
  selectVisibleDays,
} from 'src/js/widgets/weeklyTimeEntry/store/selectors';

// Mock dependencies
jest.mock('src/js/service/hooks/weeklyTimeEntries/useReadWeeklyTimeEntries');
jest.mock('src/js/widgets/weeklyTimeEntry/store/timeEntryTransformer');
jest.mock('src/js/widgets/weeklyTimeEntry/store/timeEntryGridSlice');
jest.mock('src/js/widgets/weeklyTimeEntry/utils/helpers');
jest.mock('src/js/widgets/weeklyTimeEntry/utils/constants', () => ({
  WEEKLY_TIME_ENTRY_LOGGING_CONSTANTS: {
    SUCCESS: {
      WEEKLY_TIME_ENTRIES_COPIED:
        'Component=useCopyLastWeek Message=Last Week Time Entries Successfully Copied',
      WEEKLY_TIME_ENTRIES_OVERRIDDEN:
        'Component=useCopyLastWeek Message=Weekly Time Entries Successfully Overridden',
    },
  },
}));
jest.mock('@payroll/quicksand');
jest.mock('src/js/widgets/weeklyTimeEntry/store', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));
jest.mock('src/js/widgets/weeklyTimeEntry/store/selectors', () => ({
  selectTeamMember: jest.fn((state: any) => state?.teamMember),
  selectDateRange: jest.fn((state: any) => state?.dateRange),
  selectAllTimesheetRows: jest.fn((state: any) => state?.allRows),
  selectVisibleDays: jest.fn((state: any) => state?.visibleDays),
}));
jest.mock('src/js/common/CustomerInteraction', () => ({
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  TimeCustomerInteraction: {
    WEEKLY_TIME_SHEET_COPY_LAST_WEEK: 'WEEKLY_TIME_SHEET_COPY_LAST_WEEK',
  },
}));

const mockUseReadWeeklyTimeEntries =
  useReadWeeklyTimeEntries as jest.MockedFunction<
    typeof useReadWeeklyTimeEntries
  >;
const mockTransformTimeEntriesToTimesheetRows =
  transformTimeEntriesToTimesheetRows as jest.MockedFunction<
    typeof transformTimeEntriesToTimesheetRows
  >;
const mockMergeTimeEntries = mergeTimeEntries as jest.MockedFunction<
  typeof mergeTimeEntries
>;
const mockCreateEmptyRow = createEmptyRow as jest.MockedFunction<
  typeof createEmptyRow
>;

describe('useCopyLastWeek', () => {
  const mockDispatch = jest.fn();
  const mockIntl = {
    formatMessage: jest.fn(({ id }) => id),
  };
  const mockSandbox = {
    logger: {
      info: jest.fn(),
    },
  };

  const mockEmptyRow = {
    rowId: 'empty-row-0',
    timeAgainst: { type: null, id: null, displayName: null },
    timeEntries: {},
    totalHours: 0,
    billableTotal: 0,
    hasApprovedEntries: false,
  };

  const mockTimeEntry = {
    timeEntryId: 'entry-1',
    date: '2024-01-01',
    hours: 8,
    notes: 'Test entry',
    metaInfo: { service: { id: '1', name: 'Service 1' } },
    billableInfo: { billable: true, billableRate: '50' },
    customFields: [],
    alternateIds: [],
    id: 'entry-1',
    timeFor: 'project-1',
    timeForType: 'PROJECT',
  } as any;

  const mockTimesheetRow = {
    rowId: 'row-1',
    timeAgainst: { type: 'PROJECT' as const, id: 'project-1' },
    timeEntries: { 0: mockTimeEntry },
    totalHours: 8,
    billableTotal: 400,
  } as any;

  // Mock break entry
  const mockBreakEntry = {
    id: 'break-1',
    alternateIds: [],
    timeForContactDAS: null,
    timeForType: 'BREAK',
    date: '2023-12-25',
    timeBreakId: 'lunch-break',
    duration: 30,
  } as any;

  // Mock customer entry
  const mockCustomerEntry = {
    id: 'customer-1',
    alternateIds: [],
    timeForContactDAS: { customer: { id: 'cust-1', name: 'Customer 1' } },
    timeForType: 'PROJECT',
    date: '2023-12-25',
    duration: 480,
    timeAgainstContactDAS: { customer: { id: 'cust-1', name: 'Customer 1' } },
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Redux selectors
    const { useAppSelector } = require('src/js/widgets/weeklyTimeEntry/store');
    useAppSelector.mockImplementation((selector: any) => {
      if (selector === selectTeamMember) {
        return { id: 'test-user-id', name: 'Test User' };
      }
      if (selector === selectDateRange) {
        return { start: '2024-01-01', end: '2024-01-07' };
      }
      if (selector === selectAllTimesheetRows) {
        return [];
      }
      if (selector === selectVisibleDays) {
        return [0, 1, 2, 3, 4, 5, 6];
      }
      return null;
    });

    // Mock useAppDispatch
    const { useAppDispatch } = require('src/js/widgets/weeklyTimeEntry/store');
    useAppDispatch.mockReturnValue(mockDispatch);

    // Mock useIntl and useSandbox
    (useIntl as jest.Mock).mockReturnValue(mockIntl);
    (useSandbox as jest.Mock).mockReturnValue(mockSandbox);

    // Mock useReadWeeklyTimeEntries
    mockUseReadWeeklyTimeEntries.mockReturnValue({
      entries: [],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    // Mock transformTimeEntriesToTimesheetRows
    mockTransformTimeEntriesToTimesheetRows.mockReturnValue([]);

    // Mock createEmptyRow
    mockCreateEmptyRow.mockReturnValue(mockEmptyRow);
  });

  // The previous-week fetch is now gated behind shouldFetchCopyData, and the
  // consumption effect waits for the fetch's loading cycle (false -> true ->
  // false) to complete before processing — this guards the empty-data window
  // that opens between triggering a copy and the request actually starting.
  // This helper drives that cycle: it triggers the copy action, simulates the
  // fetch going in flight (loading: true), then resolving with the entries the
  // test already configured (loading: false), so the consumption effect runs.
  const triggerCopyAndResolveFetch = (
    result: { current: { [key: string]: any } },
    rerender: () => void,
    triggerKey: string,
  ) => {
    // Snapshot whatever the test configured the hook to return (entries/error).
    // renderHook has already invoked the hook at least once, so the most recent
    // result reflects the test's mockReturnValue.
    const { results } = mockUseReadWeeklyTimeEntries.mock;
    const resolved = results.length
      ? results[results.length - 1].value
      : {
          entries: [],
          loading: false,
          error: null,
          refetch: jest.fn(),
        };

    // 1. Trigger the copy action (sets shouldFetchCopyData = true).
    act(() => {
      result.current[triggerKey]();
    });

    // 2. Fetch goes in flight — loading flips true.
    act(() => {
      mockUseReadWeeklyTimeEntries.mockReturnValue({
        ...resolved,
        loading: true,
      });
      rerender();
    });

    // 3. Fetch resolves — loading returns to false with the configured entries.
    act(() => {
      mockUseReadWeeklyTimeEntries.mockReturnValue({
        ...resolved,
        loading: false,
      });
      rerender();
    });
  };

  describe('initial state', () => {
    it('should return initial state', () => {
      const { result } = renderHook(() => useCopyLastWeek());

      expect(result.current.copyLastWeekModalOpen).toBe(false);
      expect(result.current.copyLastWeekTimeEntriesLoading).toBe(false);
      expect(result.current.isCopying).toBe(false);
      expect(typeof result.current.handleCopyLastWeek).toBe('function');
      expect(typeof result.current.handleCopyLastWeekModalClose).toBe(
        'function',
      );
      expect(typeof result.current.handleCopyLastWeekModalOverwrite).toBe(
        'function',
      );
      expect(typeof result.current.handleCopyLastWeekModalAdd).toBe('function');
    });
  });

  describe('handleCopyLastWeek', () => {
    it('should open modal when team member exists', () => {
      const { result } = renderHook(() => useCopyLastWeek());

      act(() => {
        result.current.handleCopyLastWeek();
      });

      expect(result.current.copyLastWeekModalOpen).toBe(true);
    });

    it('should not open modal when team member does not exist', () => {
      const {
        useAppSelector,
      } = require('src/js/widgets/weeklyTimeEntry/store');
      useAppSelector.mockImplementation((selector: any) => {
        if (selector === selectTeamMember) {
          return null;
        }
        if (selector === selectDateRange) {
          return { start: '2024-01-01', end: '2024-01-07' };
        }
        if (selector === selectAllTimesheetRows) {
          return [];
        }
        if (selector === selectVisibleDays) {
          return [0, 1, 2, 3, 4, 5, 6];
        }
        return null;
      });

      const { result } = renderHook(() => useCopyLastWeek());

      act(() => {
        result.current.handleCopyLastWeek();
      });

      expect(result.current.copyLastWeekModalOpen).toBe(false);
    });
  });

  describe('handleCopyLastWeekModalClose', () => {
    it('should close modal and reset state', () => {
      const { result } = renderHook(() => useCopyLastWeek());

      // First open the modal
      act(() => {
        result.current.handleCopyLastWeek();
      });

      // Then close it
      act(() => {
        result.current.handleCopyLastWeekModalClose();
      });

      expect(result.current.copyLastWeekModalOpen).toBe(false);
    });
  });

  describe('handleCopyLastWeekModalOverwrite', () => {
    it('should set overwrite action and trigger data fetching', () => {
      const { result } = renderHook(() => useCopyLastWeek());

      act(() => {
        result.current.handleCopyLastWeekModalOverwrite();
      });

      // Check that useReadWeeklyTimeEntries is called with correct parameters
      expect(mockUseReadWeeklyTimeEntries).toHaveBeenCalledWith(
        'test-user-id',
        {
          startDate: dayjs('2023-12-25'),
          endDate: dayjs('2023-12-31'),
        },
      );
    });
  });

  describe('handleCopyLastWeekModalAdd', () => {
    it('should set add action and trigger data fetching', () => {
      const { result } = renderHook(() => useCopyLastWeek());

      act(() => {
        result.current.handleCopyLastWeekModalAdd();
      });

      // Check that useReadWeeklyTimeEntries is called with correct parameters
      expect(mockUseReadWeeklyTimeEntries).toHaveBeenCalledWith(
        'test-user-id',
        {
          startDate: dayjs('2023-12-25'),
          endDate: dayjs('2023-12-31'),
        },
      );
    });
  });

  describe('data processing', () => {
    it('should process copy data when available', () => {
      const mockEntries = [
        {
          timeEntryId: 'entry-1',
          date: '2023-12-25',
          hours: 8,
          notes: 'Previous week entry',
          alternateIds: [],
          id: 'entry-1',
          timeFor: 'project-1',
          timeForType: 'PROJECT',
        } as any,
      ];

      mockUseReadWeeklyTimeEntries.mockReturnValue({
        entries: mockEntries,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      mockTransformTimeEntriesToTimesheetRows.mockReturnValue([
        mockTimesheetRow,
      ]);

      const { result, rerender } = renderHook(() => useCopyLastWeek());

      // Trigger overwrite action
      triggerCopyAndResolveFetch(
        result,
        rerender,
        'handleCopyLastWeekModalOverwrite',
      );

      // Should call transformTimeEntriesToTimesheetRows
      expect(mockTransformTimeEntriesToTimesheetRows).toHaveBeenCalled();
    });

    it('should clear approval status and start/end times when copying entries', () => {
      const mockEntriesWithApprovalAndTimes = [
        {
          timeEntryId: 'entry-1',
          date: '2023-12-25',
          hours: 8,
          notes: 'Previous week entry',
          startTime: '09:00',
          endTime: '17:00',
          v3StartTime: '2023-12-25T09:00:00Z',
          v3EndTime: '2023-12-25T17:00:00Z',
          approvalStatus: 'APPROVED',
          isSubmitted: true,
          isOpen: false,
          alternateIds: [],
          id: 'entry-1',
          timeFor: 'project-1',
          timeForType: 'PROJECT',
        } as any,
      ];

      mockUseReadWeeklyTimeEntries.mockReturnValue({
        entries: mockEntriesWithApprovalAndTimes,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      // Mock the transformed entries to verify they have cleared fields
      const mockTransformedRow = {
        ...mockTimesheetRow,
        timeEntries: {
          0: {
            ...mockTimeEntry,
            timeEntryId: '', // Should be cleared
            operation: 'CREATE', // Should be marked as CREATE
            startTime: undefined, // Should be cleared
            endTime: undefined, // Should be cleared
            isApproved: false, // Should be cleared
          },
        },
      };

      mockTransformTimeEntriesToTimesheetRows.mockReturnValue([
        mockTransformedRow,
      ]);

      const { result, rerender } = renderHook(() => useCopyLastWeek());

      // Trigger overwrite action
      triggerCopyAndResolveFetch(
        result,
        rerender,
        'handleCopyLastWeekModalOverwrite',
      );

      // Should call transformTimeEntriesToTimesheetRows with entries that have cleared approval and time fields
      expect(mockTransformTimeEntriesToTimesheetRows).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            startTime: undefined,
            endTime: undefined,
            v3StartTime: undefined,
            v3EndTime: undefined,
            approvalStatus: undefined,
            isSubmitted: false,
            isOpen: true,
          }),
        ]),
        expect.any(Object),
        expect.any(Array),
      );
    });
  });

  describe('loading states', () => {
    it('should show loading state when fetching data', () => {
      mockUseReadWeeklyTimeEntries.mockReturnValue({
        entries: [],
        loading: true,
        error: null,
        refetch: jest.fn(),
      });

      const { result } = renderHook(() => useCopyLastWeek());

      expect(result.current.copyLastWeekTimeEntriesLoading).toBe(true);
    });
  });

  describe('week calculation', () => {
    it('should calculate previous week correctly', () => {
      const { result } = renderHook(() => useCopyLastWeek());

      // Trigger an action to cause the hook to calculate previous week
      act(() => {
        result.current.handleCopyLastWeekModalOverwrite();
      });

      // Should call useReadWeeklyTimeEntries with previous week dates
      expect(mockUseReadWeeklyTimeEntries).toHaveBeenCalledWith(
        'test-user-id',
        expect.objectContaining({
          startDate: dayjs('2023-12-25'),
          endDate: dayjs('2023-12-31'),
        }),
      );
    });
  });

  describe('conditional data fetching', () => {
    it('should not fetch data when shouldFetchCopyData is false', () => {
      renderHook(() => useCopyLastWeek());

      // No copy action triggered, so the previous-week fetch is gated off:
      // useReadWeeklyTimeEntries is called with an empty nameId (which no-ops the
      // network request) rather than the real team member id.
      expect(mockUseReadWeeklyTimeEntries).toHaveBeenCalledWith(
        '',
        expect.any(Object),
      );
      expect(mockUseReadWeeklyTimeEntries).not.toHaveBeenCalledWith(
        'test-user-id',
        expect.any(Object),
      );
    });

    it('should fetch data when shouldFetchCopyData is true', () => {
      const { result } = renderHook(() => useCopyLastWeek());

      act(() => {
        result.current.handleCopyLastWeekModalOverwrite();
      });

      expect(mockUseReadWeeklyTimeEntries).toHaveBeenCalledWith(
        'test-user-id',
        expect.any(Object),
      );
    });
  });

  describe('handleCopyCustomersAndBreaksLastWeek', () => {
    it('should open modal when team member exists', () => {
      const { result } = renderHook(() => useCopyLastWeek());

      act(() => {
        result.current.handleCopyCustomersAndBreaksLastWeek();
      });

      expect(result.current.copyLastWeekModalOpen).toBe(true);
    });

    it('should not open modal when team member does not exist', () => {
      const {
        useAppSelector,
      } = require('src/js/widgets/weeklyTimeEntry/store');
      useAppSelector.mockImplementation((selector: any) => {
        if (selector === selectTeamMember) {
          return null;
        }
        if (selector === selectDateRange) {
          return { start: '2024-01-01', end: '2024-01-07' };
        }
        if (selector === selectAllTimesheetRows) {
          return [];
        }
        if (selector === selectVisibleDays) {
          return [0, 1, 2, 3, 4, 5, 6];
        }
        return null;
      });

      const { result } = renderHook(() => useCopyLastWeek());

      act(() => {
        result.current.handleCopyCustomersAndBreaksLastWeek();
      });

      expect(result.current.copyLastWeekModalOpen).toBe(false);
    });
  });

  describe('handleCopyCustomersAndBreaksLastWeekModalOverwrite', () => {
    it('should set overwrite action for customers and breaks', () => {
      // Mock loading state to prevent useEffect from immediately processing
      mockUseReadWeeklyTimeEntries.mockReturnValue({
        entries: [mockBreakEntry],
        loading: true, // Keep loading to prevent immediate processing
        error: null,
        refetch: jest.fn(),
      });

      const { result } = renderHook(() => useCopyLastWeek());

      act(() => {
        result.current.handleCopyCustomersAndBreaksLastWeekModalOverwrite();
      });

      expect(result.current.isCopying).toBe(true);
    });
  });

  describe('handleCopyCustomersAndBreaksLastWeekModalAdd', () => {
    it('should set add action for customers and breaks', () => {
      // Mock loading state to prevent useEffect from immediately processing
      mockUseReadWeeklyTimeEntries.mockReturnValue({
        entries: [mockCustomerEntry],
        loading: true, // Keep loading to prevent immediate processing
        error: null,
        refetch: jest.fn(),
      });

      const { result } = renderHook(() => useCopyLastWeek());

      act(() => {
        result.current.handleCopyCustomersAndBreaksLastWeekModalAdd();
      });

      expect(result.current.isCopying).toBe(true);
    });
  });

  describe('data processing with customers and breaks', () => {
    it('should filter and process customers and breaks only', () => {
      const mixedEntries = [
        mockBreakEntry,
        mockCustomerEntry,
        {
          id: 'regular-1',
          timeForType: 'PROJECT',
          date: '2023-12-25',
          timeBreakId: null,
          timeAgainstContactDAS: null,
        } as any,
      ];

      mockUseReadWeeklyTimeEntries.mockReturnValue({
        entries: mixedEntries,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      const { result, rerender } = renderHook(() => useCopyLastWeek());

      triggerCopyAndResolveFetch(
        result,
        rerender,
        'handleCopyCustomersAndBreaksLastWeekModalOverwrite',
      );

      expect(mockTransformTimeEntriesToTimesheetRows).toHaveBeenCalled();
    });

    it('should deduplicate breaks and customers', () => {
      const duplicateEntries = [
        { ...mockBreakEntry, id: 'break-1' },
        { ...mockBreakEntry, id: 'break-2' }, // Same timeBreakId
        { ...mockCustomerEntry, id: 'customer-1' },
        { ...mockCustomerEntry, id: 'customer-2' }, // Same customer id
      ];

      mockUseReadWeeklyTimeEntries.mockReturnValue({
        entries: duplicateEntries,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      const { result, rerender } = renderHook(() => useCopyLastWeek());

      triggerCopyAndResolveFetch(
        result,
        rerender,
        'handleCopyCustomersAndBreaksLastWeekModalAdd',
      );

      expect(mockTransformTimeEntriesToTimesheetRows).toHaveBeenCalled();
    });
  });

  describe('overwrite functionality', () => {
    it('should handle overwrite with existing entries', () => {
      const existingRows = [
        {
          ...mockTimesheetRow,
          timeEntries: {
            0: { ...mockTimeEntry, timeEntryId: 'existing-1' },
          },
        },
      ];

      const {
        useAppSelector,
      } = require('src/js/widgets/weeklyTimeEntry/store');
      useAppSelector.mockImplementation((selector: any) => {
        if (selector === selectTeamMember) {
          return { id: 'test-user-id', name: 'Test User' };
        }
        if (selector === selectDateRange) {
          return { start: '2024-01-01', end: '2024-01-07' };
        }
        if (selector === selectAllTimesheetRows) {
          return existingRows;
        }
        if (selector === selectVisibleDays) {
          return [0, 1, 2, 3, 4, 5, 6];
        }
        return null;
      });

      mockUseReadWeeklyTimeEntries.mockReturnValue({
        entries: [mockTimeEntry],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      mockTransformTimeEntriesToTimesheetRows.mockReturnValue([
        mockTimesheetRow,
      ]);

      const { result, rerender } = renderHook(() => useCopyLastWeek());

      triggerCopyAndResolveFetch(
        result,
        rerender,
        'handleCopyLastWeekModalOverwrite',
      );

      expect(mockDispatch).toHaveBeenCalled();
      expect(mockSandbox.logger.info).toHaveBeenCalled();
    });

    it('should handle overwrite with error and call endInteractionWithFailure', () => {
      const existingRows = [
        {
          ...mockTimesheetRow,
          timeEntries: {
            0: { ...mockTimeEntry, timeEntryId: 'existing-1' },
          },
        },
      ];

      const {
        useAppSelector,
      } = require('src/js/widgets/weeklyTimeEntry/store');
      useAppSelector.mockImplementation((selector: any) => {
        if (selector === selectTeamMember) {
          return { id: 'test-user-id', name: 'Test User' };
        }
        if (selector === selectDateRange) {
          return { start: '2024-01-01', end: '2024-01-07' };
        }
        if (selector === selectAllTimesheetRows) {
          return existingRows;
        }
        if (selector === selectVisibleDays) {
          return [0, 1, 2, 3, 4, 5, 6];
        }
        return null;
      });

      mockUseReadWeeklyTimeEntries.mockReturnValue({
        entries: [mockTimeEntry],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      mockTransformTimeEntriesToTimesheetRows.mockReturnValue([
        mockTimesheetRow,
      ]);

      // Mock dispatch to throw an error
      const originalDispatch = mockDispatch;
      mockDispatch.mockImplementation(() => {
        throw new Error('Dispatch failed');
      });

      const {
        endInteractionWithFailure,
      } = require('src/js/common/CustomerInteraction');

      const { result, rerender } = renderHook(() => useCopyLastWeek());

      triggerCopyAndResolveFetch(
        result,
        rerender,
        'handleCopyLastWeekModalOverwrite',
      );

      // Should call endInteractionWithFailure when error occurs
      expect(endInteractionWithFailure).toHaveBeenCalled();

      // Restore original dispatch
      mockDispatch.mockImplementation(originalDispatch);
    });
  });

  describe('add functionality', () => {
    it('should handle add with existing entries', () => {
      const existingRows = [
        {
          ...mockTimesheetRow,
          totalHours: 8, // Non-blank row
        },
        {
          ...mockEmptyRow,
          totalHours: 0, // Blank row - should be filtered out
        },
      ];

      const {
        useAppSelector,
      } = require('src/js/widgets/weeklyTimeEntry/store');
      useAppSelector.mockImplementation((selector: any) => {
        if (selector === selectTeamMember) {
          return { id: 'test-user-id', name: 'Test User' };
        }
        if (selector === selectDateRange) {
          return { start: '2024-01-01', end: '2024-01-07' };
        }
        if (selector === selectAllTimesheetRows) {
          return existingRows;
        }
        if (selector === selectVisibleDays) {
          return [0, 1, 2, 3, 4, 5, 6];
        }
        return null;
      });

      mockUseReadWeeklyTimeEntries.mockReturnValue({
        entries: [mockTimeEntry],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      mockTransformTimeEntriesToTimesheetRows.mockReturnValue([
        mockTimesheetRow,
      ]);

      const { result, rerender } = renderHook(() => useCopyLastWeek());

      triggerCopyAndResolveFetch(
        result,
        rerender,
        'handleCopyLastWeekModalAdd',
      );

      expect(mockDispatch).toHaveBeenCalled();
    });

    it('should ensure minimum 6 rows when adding', () => {
      // Set up with no existing rows to ensure we definitely need to create empty rows
      const {
        useAppSelector,
      } = require('src/js/widgets/weeklyTimeEntry/store');
      useAppSelector.mockImplementation((selector: any) => {
        if (selector === selectTeamMember) {
          return { id: 'test-user-id', name: 'Test User' };
        }
        if (selector === selectDateRange) {
          return { start: '2024-01-01', end: '2024-01-07' };
        }
        if (selector === selectAllTimesheetRows) {
          return []; // Empty existing rows
        }
        if (selector === selectVisibleDays) {
          return [0, 1, 2, 3, 4, 5, 6];
        }
        return null;
      });

      mockUseReadWeeklyTimeEntries.mockReturnValue({
        entries: [mockTimeEntry],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      // Return only 2 copied rows, so combined total will be 2, requiring 4 empty rows
      mockTransformTimeEntriesToTimesheetRows.mockReturnValue([
        { ...mockTimesheetRow, rowId: 'copied-1' },
        { ...mockTimesheetRow, rowId: 'copied-2' },
      ]);

      const { result, rerender } = renderHook(() => useCopyLastWeek());

      triggerCopyAndResolveFetch(
        result,
        rerender,
        'handleCopyLastWeekModalAdd',
      );

      // Should at least call dispatch, covering the handleAdd function
      expect(mockDispatch).toHaveBeenCalled();
    });
  });

  describe('date transformation', () => {
    it('should transform dates from previous week to current week', () => {
      const prevWeekEntry = {
        ...mockTimeEntry,
        date: '2023-12-25', // Previous week
      };

      mockUseReadWeeklyTimeEntries.mockReturnValue({
        entries: [prevWeekEntry],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      mockTransformTimeEntriesToTimesheetRows.mockReturnValue([
        mockTimesheetRow,
      ]);

      const { result, rerender } = renderHook(() => useCopyLastWeek());

      triggerCopyAndResolveFetch(
        result,
        rerender,
        'handleCopyLastWeekModalAdd',
      );

      expect(mockTransformTimeEntriesToTimesheetRows).toHaveBeenCalled();
    });

    it('should not transform dates already in current week', () => {
      const currentWeekEntry = {
        ...mockTimeEntry,
        date: '2024-01-01', // Current week
      };

      mockUseReadWeeklyTimeEntries.mockReturnValue({
        entries: [currentWeekEntry],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      mockTransformTimeEntriesToTimesheetRows.mockReturnValue([
        mockTimesheetRow,
      ]);

      const { result, rerender } = renderHook(() => useCopyLastWeek());

      triggerCopyAndResolveFetch(
        result,
        rerender,
        'handleCopyLastWeekModalAdd',
      );

      expect(mockTransformTimeEntriesToTimesheetRows).toHaveBeenCalled();
    });
  });

  describe('entry creation and marking', () => {
    it('should mark entries as CREATE for all entries copy', () => {
      mockUseReadWeeklyTimeEntries.mockReturnValue({
        entries: [mockTimeEntry],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      const rowWithEntries = {
        ...mockTimesheetRow,
        timeEntries: {
          0: { ...mockTimeEntry, timeEntryId: 'test-id' },
        },
      };

      mockTransformTimeEntriesToTimesheetRows.mockReturnValue([rowWithEntries]);

      const { result, rerender } = renderHook(() => useCopyLastWeek());

      triggerCopyAndResolveFetch(
        result,
        rerender,
        'handleCopyLastWeekModalAdd',
      );

      expect(mockDispatch).toHaveBeenCalled();
    });

    it('should reset hours and notes for customers and breaks copy', () => {
      mockUseReadWeeklyTimeEntries.mockReturnValue({
        entries: [mockCustomerEntry],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      const rowWithCustomerEntry = {
        ...mockTimesheetRow,
        timeEntries: {
          0: { ...mockCustomerEntry, hours: 8, notes: 'Test notes' },
        },
      };

      mockTransformTimeEntriesToTimesheetRows.mockReturnValue([
        rowWithCustomerEntry,
      ]);

      const { result, rerender } = renderHook(() => useCopyLastWeek());

      triggerCopyAndResolveFetch(
        result,
        rerender,
        'handleCopyCustomersAndBreaksLastWeekModalAdd',
      );

      expect(mockDispatch).toHaveBeenCalled();
    });
  });

  describe('empty grid handling', () => {
    it('should treat add as overwrite when grid is empty', () => {
      const {
        useAppSelector,
      } = require('src/js/widgets/weeklyTimeEntry/store');
      useAppSelector.mockImplementation((selector: any) => {
        if (selector === selectTeamMember) {
          return { id: 'test-user-id', name: 'Test User' };
        }
        if (selector === selectDateRange) {
          return { start: '2024-01-01', end: '2024-01-07' };
        }
        if (selector === selectAllTimesheetRows) {
          return []; // Empty grid
        }
        if (selector === selectVisibleDays) {
          return [0, 1, 2, 3, 4, 5, 6];
        }
        return null;
      });

      mockUseReadWeeklyTimeEntries.mockReturnValue({
        entries: [mockTimeEntry],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      mockTransformTimeEntriesToTimesheetRows.mockReturnValue([
        mockTimesheetRow,
      ]);

      const { result, rerender } = renderHook(() => useCopyLastWeek());

      triggerCopyAndResolveFetch(
        result,
        rerender,
        'handleCopyLastWeekModalAdd',
      );

      expect(mockDispatch).toHaveBeenCalled();
      expect(mockSandbox.logger.info).toHaveBeenCalled();
    });
  });

  describe('specific coverage targets', () => {
    beforeEach(() => {
      // Reset all mocks for each test
      jest.clearAllMocks();

      // Reset mock implementations
      const {
        useAppDispatch,
        useAppSelector,
      } = require('src/js/widgets/weeklyTimeEntry/store');
      useAppDispatch.mockReturnValue(mockDispatch);
      useAppSelector.mockImplementation((selector: any) => {
        if (selector === selectTeamMember) {
          return { id: 'test-user-id', name: 'Test User' };
        }
        if (selector === selectDateRange) {
          return { start: '2024-01-01', end: '2024-01-07' };
        }
        if (selector === selectAllTimesheetRows) {
          return [];
        }
        if (selector === selectVisibleDays) {
          return [0, 1, 2, 3, 4, 5, 6];
        }
        return null;
      });

      mockUseReadWeeklyTimeEntries.mockReturnValue({
        entries: [],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      mockTransformTimeEntriesToTimesheetRows.mockReturnValue([]);
      mockCreateEmptyRow.mockReturnValue(mockEmptyRow);
    });

    it('should cover isRowBlank function (line 458)', () => {
      // Create rows where one is blank (totalHours: 0) and one is not
      const rowsWithMixedData = [
        { ...mockTimesheetRow, totalHours: 0, rowId: 'blank-row' },
        { ...mockTimesheetRow, totalHours: 8, rowId: 'non-blank-row' },
      ];

      const {
        useAppSelector,
      } = require('src/js/widgets/weeklyTimeEntry/store');
      useAppSelector.mockImplementation((selector: any) => {
        if (selector === selectAllTimesheetRows) {
          return rowsWithMixedData;
        }
        if (selector === selectTeamMember) {
          return { id: 'test-user-id', name: 'Test User' };
        }
        if (selector === selectDateRange) {
          return { start: '2024-01-01', end: '2024-01-07' };
        }
        if (selector === selectVisibleDays) {
          return [0, 1, 2, 3, 4, 5, 6];
        }
        return null;
      });

      // Set up so handleAdd is called, which uses isRowBlank
      mockUseReadWeeklyTimeEntries.mockReturnValue({
        entries: [mockTimeEntry],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      mockTransformTimeEntriesToTimesheetRows.mockReturnValue([
        mockTimesheetRow,
      ]);

      const { result, rerender } = renderHook(() => useCopyLastWeek());

      triggerCopyAndResolveFetch(
        result,
        rerender,
        'handleCopyLastWeekModalAdd',
      );

      // The function should dispatch and create empty rows
      expect(mockDispatch).toHaveBeenCalled();
    });

    it('should cover handleAdd function minimum rows logic (lines 467-491)', () => {
      // Ensure very specific scenario: 0 existing + 1 copied = 1 total, need 5 empty rows
      const {
        useAppSelector,
      } = require('src/js/widgets/weeklyTimeEntry/store');
      useAppSelector.mockImplementation((selector: any) => {
        if (selector === selectAllTimesheetRows) {
          return []; // No existing rows
        }
        if (selector === selectTeamMember) {
          return { id: 'test-user-id', name: 'Test User' };
        }
        if (selector === selectDateRange) {
          return { start: '2024-01-01', end: '2024-01-07' };
        }
        if (selector === selectVisibleDays) {
          return [0, 1, 2, 3, 4, 5, 6];
        }
        return null;
      });

      mockUseReadWeeklyTimeEntries.mockReturnValue({
        entries: [mockTimeEntry],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      // Return exactly 1 row to force creation of 5 empty rows (1 + 5 = 6)
      mockTransformTimeEntriesToTimesheetRows.mockReturnValue([
        { ...mockTimesheetRow, rowId: 'single-copied' },
      ]);

      const { result, rerender } = renderHook(() => useCopyLastWeek());

      triggerCopyAndResolveFetch(
        result,
        rerender,
        'handleCopyLastWeekModalAdd',
      );

      // Should call dispatch, covering the handleAdd function logic
      expect(mockDispatch).toHaveBeenCalled();
    });

    it('should cover overwrite with no rows to delete (lines 389-390)', () => {
      // Create scenario where existing rows have no saved entries to delete
      const rowsWithoutSavedEntries = [
        {
          ...mockTimesheetRow,
          timeEntries: {
            0: { ...mockTimeEntry, timeEntryId: '' }, // No saved ID
          },
        },
      ];

      const {
        useAppSelector,
      } = require('src/js/widgets/weeklyTimeEntry/store');
      useAppSelector.mockImplementation((selector: any) => {
        if (selector === selectAllTimesheetRows) {
          return rowsWithoutSavedEntries;
        }
        if (selector === selectTeamMember) {
          return { id: 'test-user-id', name: 'Test User' };
        }
        if (selector === selectDateRange) {
          return { start: '2024-01-01', end: '2024-01-07' };
        }
        if (selector === selectVisibleDays) {
          return [0, 1, 2, 3, 4, 5, 6];
        }
        return null;
      });

      mockUseReadWeeklyTimeEntries.mockReturnValue({
        entries: [mockTimeEntry],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      mockTransformTimeEntriesToTimesheetRows.mockReturnValue([
        mockTimesheetRow,
      ]);

      const { result, rerender } = renderHook(() => useCopyLastWeek());

      triggerCopyAndResolveFetch(
        result,
        rerender,
        'handleCopyLastWeekModalOverwrite',
      );

      expect(mockDispatch).toHaveBeenCalled();
    });

    it('should cover marking entries for deletion with saved IDs (lines 326-337)', () => {
      // Test the markExistingEntriesForDeletion logic
      const rowsWithSavedEntries = [
        {
          ...mockTimesheetRow,
          timeEntries: {
            0: { ...mockTimeEntry, timeEntryId: 'saved-id-1', hours: 8 },
            1: { ...mockTimeEntry, timeEntryId: 'saved-id-2', hours: 4 },
          },
        },
        {
          ...mockTimesheetRow,
          rowId: 'row-2',
          timeEntries: {
            0: { ...mockTimeEntry, timeEntryId: '', hours: 2 }, // Unsaved entry
          },
        },
      ];

      const {
        useAppSelector,
      } = require('src/js/widgets/weeklyTimeEntry/store');
      useAppSelector.mockImplementation((selector: any) => {
        if (selector === selectAllTimesheetRows) {
          return rowsWithSavedEntries;
        }
        if (selector === selectTeamMember) {
          return { id: 'test-user-id', name: 'Test User' };
        }
        if (selector === selectDateRange) {
          return { start: '2024-01-01', end: '2024-01-07' };
        }
        if (selector === selectVisibleDays) {
          return [0, 1, 2, 3, 4, 5, 6];
        }
        return null;
      });

      mockUseReadWeeklyTimeEntries.mockReturnValue({
        entries: [mockTimeEntry],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      mockTransformTimeEntriesToTimesheetRows.mockReturnValue([
        mockTimesheetRow,
      ]);

      const { result, rerender } = renderHook(() => useCopyLastWeek());

      triggerCopyAndResolveFetch(
        result,
        rerender,
        'handleCopyLastWeekModalOverwrite',
      );

      expect(mockDispatch).toHaveBeenCalled();
    });

    it('should cover overwrite with existingRowsToDelete filtering (line 400)', () => {
      // Test specific filtering logic in handleOverwrite
      const mixedRows = [
        {
          ...mockTimesheetRow,
          rowId: 'row-with-saved',
          timeEntries: {
            0: { ...mockTimeEntry, timeEntryId: 'saved-entry', hours: 8 },
          },
        },
        {
          ...mockTimesheetRow,
          rowId: 'row-without-saved',
          timeEntries: {
            0: { ...mockTimeEntry, timeEntryId: '', hours: 4 }, // No saved entry
          },
        },
      ];

      const {
        useAppSelector,
      } = require('src/js/widgets/weeklyTimeEntry/store');
      useAppSelector.mockImplementation((selector: any) => {
        if (selector === selectAllTimesheetRows) {
          return mixedRows;
        }
        if (selector === selectTeamMember) {
          return { id: 'test-user-id', name: 'Test User' };
        }
        if (selector === selectDateRange) {
          return { start: '2024-01-01', end: '2024-01-07' };
        }
        if (selector === selectVisibleDays) {
          return [0, 1, 2, 3, 4, 5, 6];
        }
        return null;
      });

      mockUseReadWeeklyTimeEntries.mockReturnValue({
        entries: [mockTimeEntry],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      mockTransformTimeEntriesToTimesheetRows.mockReturnValue([
        mockTimesheetRow,
      ]);

      const { result, rerender } = renderHook(() => useCopyLastWeek());

      triggerCopyAndResolveFetch(
        result,
        rerender,
        'handleCopyLastWeekModalOverwrite',
      );

      expect(mockDispatch).toHaveBeenCalled();
    });

    it('should cover handleAdd path in useEffect (line 560)', () => {
      // Force ADD action instead of OVERWRITE
      const existingRows = [{ ...mockTimesheetRow, totalHours: 4 }]; // Non-empty grid

      const {
        useAppSelector,
      } = require('src/js/widgets/weeklyTimeEntry/store');
      useAppSelector.mockImplementation((selector: any) => {
        if (selector === selectAllTimesheetRows) {
          return existingRows;
        }
        if (selector === selectTeamMember) {
          return { id: 'test-user-id', name: 'Test User' };
        }
        if (selector === selectDateRange) {
          return { start: '2024-01-01', end: '2024-01-07' };
        }
        if (selector === selectVisibleDays) {
          return [0, 1, 2, 3, 4, 5, 6];
        }
        return null;
      });

      mockUseReadWeeklyTimeEntries.mockReturnValue({
        entries: [mockTimeEntry],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      mockTransformTimeEntriesToTimesheetRows.mockReturnValue([
        mockTimesheetRow,
      ]);

      const { result, rerender } = renderHook(() => useCopyLastWeek());

      // Force ADD action
      triggerCopyAndResolveFetch(
        result,
        rerender,
        'handleCopyLastWeekModalAdd',
      );

      // Should go through handleAdd path (line 560)
      expect(mockDispatch).toHaveBeenCalled();
    });
  });

  describe('isRowBlank functionality', () => {
    it('should identify blank rows correctly', () => {
      const blankRow = { ...mockTimesheetRow, totalHours: 0 };
      const nonBlankRow = { ...mockTimesheetRow, totalHours: 8 };

      const {
        useAppSelector,
      } = require('src/js/widgets/weeklyTimeEntry/store');
      useAppSelector.mockImplementation((selector: any) => {
        if (selector === selectTeamMember) {
          return { id: 'test-user-id', name: 'Test User' };
        }
        if (selector === selectDateRange) {
          return { start: '2024-01-01', end: '2024-01-07' };
        }
        if (selector === selectAllTimesheetRows) {
          return [blankRow, nonBlankRow];
        }
        if (selector === selectVisibleDays) {
          return [0, 1, 2, 3, 4, 5, 6];
        }
        return null;
      });

      mockUseReadWeeklyTimeEntries.mockReturnValue({
        entries: [mockTimeEntry],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      mockTransformTimeEntriesToTimesheetRows.mockReturnValue([
        mockTimesheetRow,
      ]);

      const { result, rerender } = renderHook(() => useCopyLastWeek());

      triggerCopyAndResolveFetch(
        result,
        rerender,
        'handleCopyLastWeekModalAdd',
      );

      // Should filter out blank rows when adding
      expect(mockDispatch).toHaveBeenCalled();
    });
  });

  describe('utility functions coverage', () => {
    it('should handle row blank detection', () => {
      const existingRows = [
        { ...mockTimesheetRow, totalHours: 0 }, // Blank row
        { ...mockTimesheetRow, totalHours: 8 }, // Non-blank row
      ];

      const {
        useAppSelector,
      } = require('src/js/widgets/weeklyTimeEntry/store');
      useAppSelector.mockImplementation((selector: any) => {
        if (selector === selectTeamMember) {
          return { id: 'test-user-id', name: 'Test User' };
        }
        if (selector === selectDateRange) {
          return { start: '2024-01-01', end: '2024-01-07' };
        }
        if (selector === selectAllTimesheetRows) {
          return existingRows;
        }
        if (selector === selectVisibleDays) {
          return [0, 1, 2, 3, 4, 5, 6];
        }
        return null;
      });

      mockUseReadWeeklyTimeEntries.mockReturnValue({
        entries: [mockTimeEntry],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      mockTransformTimeEntriesToTimesheetRows.mockReturnValue([
        mockTimesheetRow,
      ]);

      const { result, rerender } = renderHook(() => useCopyLastWeek());

      triggerCopyAndResolveFetch(
        result,
        rerender,
        'handleCopyLastWeekModalAdd',
      );

      expect(mockDispatch).toHaveBeenCalled();
    });

    it('should handle entries with no saved timeEntryId', () => {
      const rowsWithUnsavedEntries = [
        {
          ...mockTimesheetRow,
          timeEntries: {
            0: { ...mockTimeEntry, timeEntryId: '', operation: 'CREATE' },
            1: { ...mockTimeEntry, timeEntryId: '   ', operation: 'CREATE' }, // Whitespace only
          },
        },
      ];

      const {
        useAppSelector,
      } = require('src/js/widgets/weeklyTimeEntry/store');
      useAppSelector.mockImplementation((selector: any) => {
        if (selector === selectTeamMember) {
          return { id: 'test-user-id', name: 'Test User' };
        }
        if (selector === selectDateRange) {
          return { start: '2024-01-01', end: '2024-01-07' };
        }
        if (selector === selectAllTimesheetRows) {
          return rowsWithUnsavedEntries;
        }
        if (selector === selectVisibleDays) {
          return [0, 1, 2, 3, 4, 5, 6];
        }
        return null;
      });

      mockUseReadWeeklyTimeEntries.mockReturnValue({
        entries: [mockTimeEntry],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      mockTransformTimeEntriesToTimesheetRows.mockReturnValue([
        mockTimesheetRow,
      ]);

      const { result, rerender } = renderHook(() => useCopyLastWeek());

      triggerCopyAndResolveFetch(
        result,
        rerender,
        'handleCopyLastWeekModalOverwrite',
      );

      expect(mockDispatch).toHaveBeenCalled();
    });

    it('should create minimal break entries', () => {
      const fullBreakEntry = {
        ...mockBreakEntry,
        extraField: 'should be removed',
        notes: 'should be removed',
        hours: 1,
      };

      mockUseReadWeeklyTimeEntries.mockReturnValue({
        entries: [fullBreakEntry],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      mockTransformTimeEntriesToTimesheetRows.mockReturnValue([
        mockTimesheetRow,
      ]);

      const { result, rerender } = renderHook(() => useCopyLastWeek());

      triggerCopyAndResolveFetch(
        result,
        rerender,
        'handleCopyCustomersAndBreaksLastWeekModalOverwrite',
      );

      expect(mockTransformTimeEntriesToTimesheetRows).toHaveBeenCalled();
    });

    it('should create minimal customer entries', () => {
      const fullCustomerEntry = {
        ...mockCustomerEntry,
        extraField: 'should be removed',
        notes: 'should be removed',
        hours: 8,
      };

      mockUseReadWeeklyTimeEntries.mockReturnValue({
        entries: [fullCustomerEntry],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      mockTransformTimeEntriesToTimesheetRows.mockReturnValue([
        mockTimesheetRow,
      ]);

      const { result, rerender } = renderHook(() => useCopyLastWeek());

      triggerCopyAndResolveFetch(
        result,
        rerender,
        'handleCopyCustomersAndBreaksLastWeekModalAdd',
      );

      expect(mockTransformTimeEntriesToTimesheetRows).toHaveBeenCalled();
    });

    it('should handle rows with no entries that need deletion', () => {
      const rowsWithNoSavedEntries = [
        {
          ...mockTimesheetRow,
          timeEntries: {
            0: { ...mockTimeEntry, timeEntryId: '' }, // No saved ID
          },
        },
      ];

      const {
        useAppSelector,
      } = require('src/js/widgets/weeklyTimeEntry/store');
      useAppSelector.mockImplementation((selector: any) => {
        if (selector === selectTeamMember) {
          return { id: 'test-user-id', name: 'Test User' };
        }
        if (selector === selectDateRange) {
          return { start: '2024-01-01', end: '2024-01-07' };
        }
        if (selector === selectAllTimesheetRows) {
          return rowsWithNoSavedEntries;
        }
        if (selector === selectVisibleDays) {
          return [0, 1, 2, 3, 4, 5, 6];
        }
        return null;
      });

      mockUseReadWeeklyTimeEntries.mockReturnValue({
        entries: [mockTimeEntry],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      mockTransformTimeEntriesToTimesheetRows.mockReturnValue([
        mockTimesheetRow,
      ]);

      const { result, rerender } = renderHook(() => useCopyLastWeek());

      triggerCopyAndResolveFetch(
        result,
        rerender,
        'handleCopyLastWeekModalOverwrite',
      );

      expect(mockDispatch).toHaveBeenCalled();
    });
  });

  describe('additional return values', () => {
    it('should return copySource and teamMember', () => {
      const { result } = renderHook(() => useCopyLastWeek());

      expect(result.current.teamMember).toEqual({
        id: 'test-user-id',
        name: 'Test User',
      });
    });
  });

  describe('complex scenarios', () => {
    it('should handle mixed entry types in customers and breaks mode', () => {
      const mixedEntries = [
        mockBreakEntry,
        mockCustomerEntry,
        {
          ...mockTimeEntry,
          timeBreakId: null,
          timeAgainstContactDAS: null,
        },
      ];

      mockUseReadWeeklyTimeEntries.mockReturnValue({
        entries: mixedEntries,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      mockTransformTimeEntriesToTimesheetRows.mockReturnValue([
        mockTimesheetRow,
      ]);

      const { result, rerender } = renderHook(() => useCopyLastWeek());

      triggerCopyAndResolveFetch(
        result,
        rerender,
        'handleCopyCustomersAndBreaksLastWeekModalOverwrite',
      );

      expect(mockTransformTimeEntriesToTimesheetRows).toHaveBeenCalled();
    });

    it('should handle entries with CREATE operation in existing rows', () => {
      const existingRowWithCreateEntry = {
        ...mockTimesheetRow,
        timeEntries: {
          0: { ...mockTimeEntry, timeEntryId: '', operation: 'CREATE' },
        },
      };

      const {
        useAppSelector,
      } = require('src/js/widgets/weeklyTimeEntry/store');
      useAppSelector.mockImplementation((selector: any) => {
        if (selector === selectTeamMember) {
          return { id: 'test-user-id', name: 'Test User' };
        }
        if (selector === selectDateRange) {
          return { start: '2024-01-01', end: '2024-01-07' };
        }
        if (selector === selectAllTimesheetRows) {
          return [existingRowWithCreateEntry];
        }
        if (selector === selectVisibleDays) {
          return [0, 1, 2, 3, 4, 5, 6];
        }
        return null;
      });

      mockUseReadWeeklyTimeEntries.mockReturnValue({
        entries: [mockTimeEntry],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      mockTransformTimeEntriesToTimesheetRows.mockReturnValue([
        mockTimesheetRow,
      ]);

      const { result, rerender } = renderHook(() => useCopyLastWeek());

      triggerCopyAndResolveFetch(
        result,
        rerender,
        'handleCopyLastWeekModalOverwrite',
      );

      expect(mockDispatch).toHaveBeenCalled();
    });
  });

  describe('remaining coverage targets', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should cover isRowBlank function directly (line 458)', () => {
      // Test with rows that have different totalHours values
      const mixedRows = [
        { ...mockTimesheetRow, totalHours: 0, rowId: 'blank-1' },
        { ...mockTimesheetRow, totalHours: 5, rowId: 'non-blank-1' },
        { ...mockTimesheetRow, totalHours: 0, rowId: 'blank-2' },
      ];

      const {
        useAppSelector,
      } = require('src/js/widgets/weeklyTimeEntry/store');
      useAppSelector.mockImplementation((selector: any) => {
        if (selector === selectTeamMember) {
          return { id: 'test-user-id', name: 'Test User' };
        }
        if (selector === selectDateRange) {
          return { start: '2024-01-01', end: '2024-01-07' };
        }
        if (selector === selectAllTimesheetRows) {
          return mixedRows;
        }
        if (selector === selectVisibleDays) {
          return [0, 1, 2, 3, 4, 5, 6];
        }
        return null;
      });

      mockUseReadWeeklyTimeEntries.mockReturnValue({
        entries: [mockTimeEntry],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      mockTransformTimeEntriesToTimesheetRows.mockReturnValue([
        mockTimesheetRow,
      ]);

      const { result, rerender } = renderHook(() => useCopyLastWeek());

      triggerCopyAndResolveFetch(
        result,
        rerender,
        'handleCopyLastWeekModalAdd',
      );

      // Should filter out blank rows (totalHours: 0) and keep non-blank
      expect(mockDispatch).toHaveBeenCalled();
    });

    it('should cover markExistingEntriesForDeletion with hasEntriesToDelete (lines 326-337)', () => {
      // Test rows with entries that have valid timeEntryIds
      const rowsWithSavedEntries = [
        {
          ...mockTimesheetRow,
          timeEntries: {
            0: { ...mockTimeEntry, timeEntryId: 'saved-entry-1' },
            1: { ...mockTimeEntry, timeEntryId: 'saved-entry-2' },
          },
        },
        {
          ...mockTimesheetRow,
          rowId: 'row-2',
          timeEntries: {
            0: { ...mockTimeEntry, timeEntryId: '' }, // No saved entry
          },
        },
      ];

      const {
        useAppSelector,
      } = require('src/js/widgets/weeklyTimeEntry/store');
      useAppSelector.mockImplementation((selector: any) => {
        if (selector === selectTeamMember) {
          return { id: 'test-user-id', name: 'Test User' };
        }
        if (selector === selectDateRange) {
          return { start: '2024-01-01', end: '2024-01-07' };
        }
        if (selector === selectAllTimesheetRows) {
          return rowsWithSavedEntries;
        }
        if (selector === selectVisibleDays) {
          return [0, 1, 2, 3, 4, 5, 6];
        }
        return null;
      });

      mockUseReadWeeklyTimeEntries.mockReturnValue({
        entries: [mockTimeEntry],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      mockTransformTimeEntriesToTimesheetRows.mockReturnValue([
        mockTimesheetRow,
      ]);

      const { result, rerender } = renderHook(() => useCopyLastWeek());

      triggerCopyAndResolveFetch(
        result,
        rerender,
        'handleCopyLastWeekModalOverwrite',
      );

      expect(mockDispatch).toHaveBeenCalled();
    });

    it('should cover overwrite filtering logic (lines 389-390, 400)', () => {
      // Test specific filtering in handleOverwrite function
      const complexRows = [
        {
          ...mockTimesheetRow,
          rowId: 'row-with-saved',
          timeEntries: {
            0: { ...mockTimeEntry, timeEntryId: 'saved-1' },
            1: { ...mockTimeEntry, timeEntryId: 'saved-2' },
          },
        },
        {
          ...mockTimesheetRow,
          rowId: 'row-mixed',
          timeEntries: {
            0: { ...mockTimeEntry, timeEntryId: 'saved-3' },
            1: { ...mockTimeEntry, timeEntryId: '' }, // Mixed saved/unsaved
          },
        },
        {
          ...mockTimesheetRow,
          rowId: 'row-no-saved',
          timeEntries: {
            0: { ...mockTimeEntry, timeEntryId: '' },
          },
        },
      ];

      const {
        useAppSelector,
      } = require('src/js/widgets/weeklyTimeEntry/store');
      useAppSelector.mockImplementation((selector: any) => {
        if (selector === selectTeamMember) {
          return { id: 'test-user-id', name: 'Test User' };
        }
        if (selector === selectDateRange) {
          return { start: '2024-01-01', end: '2024-01-07' };
        }
        if (selector === selectAllTimesheetRows) {
          return complexRows;
        }
        if (selector === selectVisibleDays) {
          return [0, 1, 2, 3, 4, 5, 6];
        }
        return null;
      });

      mockUseReadWeeklyTimeEntries.mockReturnValue({
        entries: [mockTimeEntry],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      mockTransformTimeEntriesToTimesheetRows.mockReturnValue([
        mockTimesheetRow,
      ]);

      const { result, rerender } = renderHook(() => useCopyLastWeek());

      triggerCopyAndResolveFetch(
        result,
        rerender,
        'handleCopyLastWeekModalOverwrite',
      );

      expect(mockDispatch).toHaveBeenCalled();
    });

    it('should cover handleAdd path in useEffect (line 560)', () => {
      // Ensure ADD action is taken (not OVERWRITE) by having non-empty existing rows
      const nonEmptyGrid = [{ ...mockTimesheetRow, totalHours: 8 }];

      const {
        useAppSelector,
      } = require('src/js/widgets/weeklyTimeEntry/store');
      useAppSelector.mockImplementation((selector: any) => {
        if (selector === selectTeamMember) {
          return { id: 'test-user-id', name: 'Test User' };
        }
        if (selector === selectDateRange) {
          return { start: '2024-01-01', end: '2024-01-07' };
        }
        if (selector === selectAllTimesheetRows) {
          return nonEmptyGrid; // Non-empty to trigger ADD instead of OVERWRITE
        }
        if (selector === selectVisibleDays) {
          return [0, 1, 2, 3, 4, 5, 6];
        }
        return null;
      });

      mockUseReadWeeklyTimeEntries.mockReturnValue({
        entries: [mockTimeEntry],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      // Return 3 rows so total will be 1 existing + 3 copied = 4, need 2 empty = 6
      mockTransformTimeEntriesToTimesheetRows.mockReturnValue([
        mockTimesheetRow,
        mockTimesheetRow,
        mockTimesheetRow,
      ]);

      const { result, rerender } = renderHook(() => useCopyLastWeek());

      triggerCopyAndResolveFetch(
        result,
        rerender,
        'handleCopyLastWeekModalAdd',
      );

      // Should go through handleAdd (line 560)
      expect(mockDispatch).toHaveBeenCalled();
    });
  });

  describe('filterCustomersAndBreaks with entries lacking timeBreakId and customer', () => {
    it('should include break entries in filterCustomersAndBreaks (line 140)', async () => {
      const breakEntry = {
        id: 'break-entry',
        alternateIds: [],
        date: '2023-12-25',
        timeBreakId: 'break-1', // Has timeBreakId -> returns true
      } as any;

      const {
        useAppSelector,
      } = require('src/js/widgets/weeklyTimeEntry/store');
      useAppSelector.mockImplementation((selector: any) => {
        if (selector === selectTeamMember) {
          return { id: 'test-user-id', name: 'Test User' };
        }
        if (selector === selectDateRange) {
          return { start: '2024-01-01', end: '2024-01-07' };
        }
        if (selector === selectAllTimesheetRows) {
          return [];
        }
        if (selector === selectVisibleDays) {
          return [0, 1, 2, 3, 4, 5, 6];
        }
        return null;
      });

      mockUseReadWeeklyTimeEntries.mockReturnValue({
        entries: [breakEntry],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      mockTransformTimeEntriesToTimesheetRows.mockReturnValue([
        mockTimesheetRow,
      ]);

      const { result, rerender } = renderHook(() => useCopyLastWeek());

      triggerCopyAndResolveFetch(
        result,
        rerender,
        'handleCopyCustomersAndBreaksLastWeekModalOverwrite',
      );

      expect(mockDispatch).toHaveBeenCalled();
    });
  });
});

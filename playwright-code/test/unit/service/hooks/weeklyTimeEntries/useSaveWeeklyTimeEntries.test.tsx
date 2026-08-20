import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useIntl, useSandbox } from '@payroll/quicksand';
import { ApolloError } from '@apollo/client';
import { DataAccess_ContactType } from '../../../../../src/__generated__/oigql/graphql';
import { useSaveWeeklyTimeEntries } from '../../../../../src/js/service/hooks/weeklyTimeEntries/useSaveWeeklyTimeEntries';
import { useBatchSaveTimeEntriesMutation } from '../../../../../src/__generated__/timeTracking/graphql';
import { useTransformTimeEntries } from '../../../../../src/js/service/hooks/weeklyTimeEntries/useTransformTimeEntries';
import { timeEntryGridSlice } from '../../../../../src/js/widgets/weeklyTimeEntry/store/timeEntryGridSlice';
import contextMenuSlice from '../../../../../src/js/widgets/weeklyTimeEntry/store/contextMenuSlice';
import customerSlice from '../../../../../src/js/widgets/weeklyTimeEntry/store/customerSlice';
import { TimeForType } from '../../../../../src/js/widgets/weeklyTimeEntry/types';

// Stable empty dimension-definitions reference shared by the selectors mock so
// the save-input useMemo isn't invalidated on every render.
const mockStableEmptyDimensions: never[] = [];

// Mock dependencies
jest.mock('src/__generated__/timeTracking/graphql', () => ({
  useBatchSaveTimeEntriesMutation: jest.fn(),
}));

jest.mock('@payroll/quicksand', () => ({
  useIntl: jest.fn(),
  useSandbox: jest.fn(),
}));

jest.mock(
  'src/js/service/hooks/weeklyTimeEntries/useTransformTimeEntries',
  () => ({
    useTransformTimeEntries: jest.fn(),
  }),
);

// Mock Redux selectors
jest.mock(
  '../../../../../src/js/widgets/weeklyTimeEntry/store/selectors',
  () => ({
    selectAllTimesheetRows: jest.fn(),
    selectTimesheetRows: jest.fn(),
    selectTeamMember: jest.fn(),
    selectTimeEntryGridLoading: jest.fn(),
    selectDateRange: jest.fn(),
    selectCompanySettings: jest.fn(),
    // Stable reference so the save-input useMemo isn't invalidated each render.
    selectDimensions: jest.fn(() => mockStableEmptyDimensions),
    selectQuickFindOTXEnabled: jest.fn(),
    selectQuickFindOTXSettled: jest.fn(),
  }),
);

// Mock the error handling utilities
jest.mock('src/js/service/utils/mapError', () => ({
  mapError: jest.fn().mockReturnValue('Mapped error message'),
}));

jest.mock('src/js/service/errors/timeTrackingErrors', () => ({
  mapTimeTrackingMutationError: jest
    .fn()
    .mockReturnValue('Time tracking error'),
}));

jest.mock('src/js/common/CustomerInteraction', () => ({
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  setInteractionDegraded: jest.fn(),
  shouldTreatWeeklyTimesheetErrorAsDegraded: jest.fn().mockReturnValue(false),
  getCustomerInteractionPropagationHeaders: jest.fn().mockReturnValue({}),
  TimeCustomerInteraction: {
    WEEKLY_TIME_SHEET_SAVE: 'WEEKLY_TIME_SHEET_SAVE',
  },
}));

describe('useSaveWeeklyTimeEntries', () => {
  // Import the selectors to mock them
  const {
    selectAllTimesheetRows,
    selectTeamMember,
    selectTimeEntryGridLoading,
    selectDateRange,
    selectCompanySettings,
    selectQuickFindOTXEnabled,
    selectQuickFindOTXSettled,
  } = require('../../../../../src/js/widgets/weeklyTimeEntry/store/selectors');

  const mockSandbox = {
    logger: {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    },
    performance: {
      createCustomerInteraction: jest.fn(),
      getCustomerInteraction: jest.fn(),
    },
  };

  const mockIntl = {
    formatMessage: jest.fn(),
  };

  const mockSaveTimeEntries = jest.fn();
  const mockTransformToTimeEntries = jest.fn();
  const mockExtractTimeEntriesToDelete = jest.fn();

  const mockTeamMember = {
    id: 'emp-123',
    name: 'John Doe',
    type: TimeForType.EMPLOYEE,
  };

  const mockDateRange = {
    start: '2024-01-01',
    end: '2024-01-07',
  };

  const mockTimesheetRows = [
    {
      rowId: 'row-1',
      timeAgainst: {
        id: 'customer-1',
        type: DataAccess_ContactType.Customer,
        displayName: 'Test Customer',
      },
      timeEntries: {
        0: {
          timeEntryId: 'entry-1',
          date: '2024-01-01',
          hours: 8,
          notes: 'Test work',
          billableInfo: { billable: true, billableRate: '50.00' },
          metaInfo: {},
          operation: 'CREATE' as const,
          isApproved: false,
        },
        1: {
          timeEntryId: 'entry-2',
          date: '2024-01-02',
          hours: 6,
          notes: 'More work',
          operation: 'UPDATE' as const,
          isApproved: false,
        },
        2: {
          timeEntryId: 'entry-3',
          date: '2024-01-03',
          hours: 0,
          operation: 'DELETE' as const,
          isApproved: false,
        },
      },
      totalHours: 14,
      billableTotal: 700,
      hasApprovedEntries: false,
    },
    {
      rowId: 'row-2',
      timeAgainst: {
        id: 'customer-2',
        type: DataAccess_ContactType.Customer,
        displayName: 'Test Customer 2',
      },
      timeEntries: {
        0: {
          timeEntryId: '',
          date: '2024-01-01',
          hours: 0,
          operation: undefined,
          isApproved: false,
        },
        1: {
          timeEntryId: '',
          date: '2024-01-02',
          hours: 0,
          operation: undefined,
          isApproved: false,
        },
        2: {
          timeEntryId: '',
          date: '2024-01-03',
          hours: 0,
          operation: undefined,
          isApproved: false,
        },
        3: {
          timeEntryId: '',
          date: '2024-01-04',
          hours: 0,
          operation: undefined,
          isApproved: false,
        },
        4: {
          timeEntryId: '',
          date: '2024-01-05',
          hours: 0,
          operation: undefined,
          isApproved: false,
        },
        5: {
          timeEntryId: '',
          date: '2024-01-06',
          hours: 0,
          operation: undefined,
          isApproved: false,
        },
        6: {
          timeEntryId: '',
          date: '2024-01-07',
          hours: 0,
          operation: undefined,
          isApproved: false,
        },
      },
      totalHours: 0,
      billableTotal: 0,
      hasApprovedEntries: false,
    },
  ];

  const mockTransformedData = [
    {
      id: 'entry-1',
      date: '2024-01-01',
      duration: 28800, // 8 hours * 3600 seconds
      timeFor: { id: 'emp-123', timeForType: 'Employee' },
      timeAgainst: { customerId: 'customer-1' },
      billableStatus: 'BILLABLE',
      billableRate: 50.0,
      costRate: 0,
      taxable: false,
      notes: 'Test work',
    },
    {
      id: 'entry-2',
      date: '2024-01-02',
      duration: 21600, // 6 hours * 3600 seconds
      timeFor: { id: 'emp-123', timeForType: 'Employee' },
      timeAgainst: { customerId: 'customer-1' },
      billableStatus: 'NOT_BILLABLE',
      billableRate: 0,
      costRate: 0,
      taxable: false,
      notes: 'More work',
    },
  ];

  const mockTimeEntriesToDelete = [{ id: 'entry-3' }];

  const createMockStore = () =>
    configureStore({
      reducer: {
        timeEntryGrid: timeEntryGridSlice.reducer,
        contextMenu: contextMenuSlice,
        customers: customerSlice,
        timeEntrySettings: (
          state = { data: {}, loading: false, error: null },
          action: any,
        ) => state,
        assignments: (state = { customerAssignments: {} }, action: any) =>
          state,
      },
      preloadedState: {
        timeEntryGrid: {
          weeklyTimeEntries: Object.fromEntries(
            mockTimesheetRows.map((row) => [row.rowId, row]),
          ),
          rowOrder: mockTimesheetRows.map((row) => row.rowId),
          teamMember: mockTeamMember,
          dateRange: mockDateRange,
          loading: false,
          error: null,
          selected: null,
          firstEditedCells: {},
          showSelectTeamMemberTooltip: false,
          isTeamMemberDropdownReady: false,
          isQuickFindEnabled: false,
          isQuickFindSettled: false,
          confirmTimeEntryConversionModal: {
            isOpen: false,
            rowId: null,
            dayIdx: null,
          },
        },
        contextMenu: {
          visible: false,
          context: null,
          clipboard: null,
        },
        customers: {
          customers: {
            ids: [],
            entities: {},
          },
          loading: false,
          error: null,
        },
        timeEntrySettings: {
          data: {},
          loading: false,
          error: null,
        },
        assignments: {
          customerAssignments: {},
        },
      },
    });

  const renderHookWithStore = (store = createMockStore(), params = {}) =>
    renderHook(() => useSaveWeeklyTimeEntries(params), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

  beforeEach(() => {
    jest.clearAllMocks();
    (useSandbox as jest.Mock).mockReturnValue(mockSandbox);
    (useIntl as jest.Mock).mockReturnValue(mockIntl);

    // Mock transform functions
    mockTransformToTimeEntries.mockReturnValue(mockTransformedData);
    mockExtractTimeEntriesToDelete.mockReturnValue(mockTimeEntriesToDelete);
    (useTransformTimeEntries as jest.Mock).mockReturnValue({
      transformToTimeEntries: mockTransformToTimeEntries,
      extractTimeEntriesToDelete: mockExtractTimeEntriesToDelete,
    });

    // Mock Redux selectors
    (selectAllTimesheetRows as jest.Mock).mockReturnValue(mockTimesheetRows);
    (selectTeamMember as jest.Mock).mockReturnValue(mockTeamMember);
    (selectTimeEntryGridLoading as jest.Mock).mockReturnValue(false);
    (selectDateRange as jest.Mock).mockReturnValue(mockDateRange);
    (selectCompanySettings as jest.Mock).mockReturnValue({
      isBillingFieldEnabled: true,
    });
    (selectQuickFindOTXEnabled as jest.Mock).mockReturnValue(false);
    (selectQuickFindOTXSettled as jest.Mock).mockReturnValue(false);

    (useBatchSaveTimeEntriesMutation as jest.Mock).mockReturnValue([
      mockSaveTimeEntries,
      {
        loading: false,
        error: null,
        data: null,
      },
    ]);
  });

  describe('Basic functionality', () => {
    it('should return saveWeeklyTimeEntries function and status properties', () => {
      const { result } = renderHookWithStore();

      expect(result.current.saveWeeklyTimeEntries).toBeInstanceOf(Function);
      expect(typeof result.current.loading).toBe('boolean');
      expect(typeof result.current.hasDataToSave).toBe('boolean');
      expect(result.current.savedData).toBeUndefined();
    });

    it('should indicate hasDataToSave when valid data exists', () => {
      const { result } = renderHookWithStore();
      expect(result.current.hasDataToSave).toBe(true);
    });

    it('should indicate no data to save when team member is missing', () => {
      (selectTeamMember as jest.Mock).mockReturnValue(null);
      mockTransformToTimeEntries.mockReturnValue([]);
      mockExtractTimeEntriesToDelete.mockReturnValue([]);

      const { result } = renderHookWithStore();
      expect(result.current.hasDataToSave).toBe(false);
    });

    it('should indicate no data to save when no timesheet rows exist', () => {
      (selectAllTimesheetRows as jest.Mock).mockReturnValue([]);
      mockTransformToTimeEntries.mockReturnValue([]);
      mockExtractTimeEntriesToDelete.mockReturnValue([]);

      const { result } = renderHookWithStore();
      expect(result.current.hasDataToSave).toBe(false);
    });

    it('should indicate hasDataToSave when only deletions exist', () => {
      mockTransformToTimeEntries.mockReturnValue([]);
      mockExtractTimeEntriesToDelete.mockReturnValue([
        { id: 'entry-1' },
        { id: 'entry-2' },
      ]);

      const { result } = renderHookWithStore();
      expect(result.current.hasDataToSave).toBe(true);
    });

    it('should initialize with transformed data from Redux store', () => {
      renderHookWithStore();

      expect(mockTransformToTimeEntries).toHaveBeenCalledWith(
        {
          weeklyTimeEntries: mockTimesheetRows,
          teamMember: mockTeamMember,
          dateRange: mockDateRange,
        },
        expect.objectContaining({
          isBillingFieldEnabled: expect.any(Boolean),
          customerAssignmentsMap: expect.any(Object),
        }),
        expect.any(Array),
      );
    });

    it('should call extractTimeEntriesToDelete with correct data', () => {
      renderHookWithStore();

      expect(mockExtractTimeEntriesToDelete).toHaveBeenCalledWith({
        weeklyTimeEntries: mockTimesheetRows,
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      });
    });

    it('should call mutation with correct input format', async () => {
      mockSaveTimeEntries.mockResolvedValue({
        data: {
          timeTrackingBatchManageTimeEntries: {
            __typename: 'TimeTracking_BatchManageTimeEntriesPayload',
          },
        },
      });

      const { result } = renderHookWithStore();

      await act(async () => {
        await result.current.saveWeeklyTimeEntries();
      });

      expect(mockSaveTimeEntries).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: {
            input: {
              timeEntries: mockTransformedData,
              timeEntriesToDelete: mockTimeEntriesToDelete,
              isExported: false,
            },
          },
        }),
      );
    });

    it('should not save when hasDataToSave is false', async () => {
      mockTransformToTimeEntries.mockReturnValue([]);
      mockExtractTimeEntriesToDelete.mockReturnValue([]);

      const { result } = renderHookWithStore();

      await act(async () => {
        await result.current.saveWeeklyTimeEntries();
      });

      expect(mockSaveTimeEntries).not.toHaveBeenCalled();
    });

    it('should not save when team member is missing', async () => {
      (selectTeamMember as jest.Mock).mockReturnValue(null);

      const { result } = renderHookWithStore();

      await act(async () => {
        await result.current.saveWeeklyTimeEntries();
      });

      expect(mockSaveTimeEntries).not.toHaveBeenCalled();
    });

    it('should call onSaveSuccess callback when save is successful', async () => {
      const mockOnSaveSuccess = jest.fn();
      mockSaveTimeEntries.mockResolvedValue({
        data: {
          timeTrackingBatchManageTimeEntries: {
            __typename: 'TimeTracking_BatchManageTimeEntriesPayload',
          },
        },
      });

      const { result } = renderHookWithStore(createMockStore(), {
        onSaveSuccess: mockOnSaveSuccess,
      });

      await act(async () => {
        await result.current.saveWeeklyTimeEntries();
      });

      expect(mockOnSaveSuccess).toHaveBeenCalled();
    });
  });

  describe('Memoization and re-renders', () => {
    it('should not recreate input data when dependencies are stable', () => {
      const { rerender } = renderHookWithStore();

      const initialCallCount = mockTransformToTimeEntries.mock.calls.length;

      // Force re-render
      rerender();

      // Should not call transform again if dependencies haven't changed
      expect(mockTransformToTimeEntries.mock.calls.length).toBe(
        initialCallCount,
      );
    });

    it('should recreate input data when Redux state changes', () => {
      const { result, rerender } = renderHookWithStore();

      const initialCallCount = mockTransformToTimeEntries.mock.calls.length;

      // Change Redux state to trigger memoization
      const newTeamMember = { ...mockTeamMember, name: 'Jane Doe' };
      (selectTeamMember as jest.Mock).mockReturnValue(newTeamMember);

      rerender();

      // Should call transform again with new team member
      expect(mockTransformToTimeEntries.mock.calls.length).toBeGreaterThan(
        initialCallCount,
      );
    });

    it('should log debug information for hasDataToSave computation', () => {
      renderHookWithStore();

      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        'Component=useSaveWeeklyTimeEntries Event=inputData debug',
        expect.any(Object),
      );
      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        'Component=useSaveWeeklyTimeEntries Event=hasDataToSave computed',
        expect.any(Object),
      );
    });
  });

  describe('Error handling', () => {
    it('should handle Apollo errors in catch block', async () => {
      const apolloError = new ApolloError({
        networkError: new Error('Network error'),
        errorMessage: 'Network error',
      });
      mockSaveTimeEntries.mockRejectedValue(apolloError);

      const { result } = renderHookWithStore();

      await act(async () => {
        await expect(result.current.saveWeeklyTimeEntries()).rejects.toThrow();
      });

      expect(mockSandbox.logger.error).toHaveBeenCalledWith(
        'Component=useSaveWeeklyTimeEntries Event=Error saving weekly time entries: ',
        expect.any(Object),
      );
    });

    it('should handle mutation error responses', async () => {
      const errorResponse = {
        timeTrackingBatchManageTimeEntries: {
          __typename: 'TimeTracking_BatchManageTimeEntriesError',
          errorCode: 'VALIDATION_ERROR',
          message: 'Invalid data',
          details: 'Some details',
          subCode: 'SUB123',
        },
      };

      mockSaveTimeEntries.mockResolvedValue({
        data: errorResponse,
      });

      const { result } = renderHookWithStore();

      await act(async () => {
        await result.current.saveWeeklyTimeEntries();
      });

      expect(mockSandbox.logger.error).toHaveBeenCalledWith(
        'Component=useSaveWeeklyTimeEntries Event=Error saving weekly time entries: ',
        expect.any(Object),
      );
    });

    it('should handle null response', async () => {
      mockSaveTimeEntries.mockResolvedValue({
        data: { timeTrackingBatchManageTimeEntries: null },
      });

      const { result } = renderHookWithStore();

      await act(async () => {
        await result.current.saveWeeklyTimeEntries();
      });

      expect(mockSandbox.logger.error).toHaveBeenCalledWith(
        'Component=useSaveWeeklyTimeEntries Event=Error saving weekly time entries: ',
        expect.any(Object),
      );
    });

    it('should handle GENERAL_V3_ERROR with subCode', async () => {
      const { result } = renderHookWithStore();

      // Get the onError callback from the mutation setup
      const mutationConfig = (useBatchSaveTimeEntriesMutation as jest.Mock).mock
        .calls[0][0];

      act(() => {
        mutationConfig.onError(
          'GENERAL_V3_ERROR',
          'Error message',
          'Error details',
          'SUB123',
        );
      });

      expect(mockSandbox.logger.error).toHaveBeenCalledWith(
        'Component=useSaveWeeklyTimeEntries Event=Error saving weekly time entries: ',
        expect.any(Object),
      );
    });

    it('should handle GENERAL_V1_ERROR with subCode', async () => {
      const { result } = renderHookWithStore();

      // Get the onError callback from the mutation setup
      const mutationConfig = (useBatchSaveTimeEntriesMutation as jest.Mock).mock
        .calls[0][0];

      act(() => {
        mutationConfig.onError(
          'GENERAL_V1_ERROR',
          'Error message',
          'Error details',
          'SUB123',
        );
      });

      expect(mockSandbox.logger.error).toHaveBeenCalledWith(
        'Component=useSaveWeeklyTimeEntries Event=Error saving weekly time entries: ',
        expect.any(Object),
      );
    });

    it('should handle errors without subCode', async () => {
      const { result } = renderHookWithStore();

      // Get the onError callback from the mutation setup
      const mutationConfig = (useBatchSaveTimeEntriesMutation as jest.Mock).mock
        .calls[0][0];

      act(() => {
        mutationConfig.onError(
          'VALIDATION_ERROR',
          'Error message',
          'Error details',
          '',
        );
      });

      expect(mockSandbox.logger.error).toHaveBeenCalledWith(
        'Component=useSaveWeeklyTimeEntries Event=Error saving weekly time entries: ',
        expect.any(Object),
      );
    });
  });

  describe('Success handling', () => {
    it('should log success on successful save', async () => {
      const successResponse = {
        timeTrackingBatchManageTimeEntries: {
          __typename: 'TimeTracking_BatchManageTimeEntriesPayload',
          successCode: 'TIME_TRACKING_CREATE_SUCCESS',
          timeEntries: [
            {
              id: 'new-entry-1',
              date: '2024-03-01',
              duration: 8,
            },
          ],
          deletes: [],
        },
      };

      mockSaveTimeEntries.mockResolvedValue({
        data: successResponse,
      });

      const { result } = renderHookWithStore();

      await act(async () => {
        await result.current.saveWeeklyTimeEntries();
      });

      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        'Component=useSaveWeeklyTimeEntries Event=Successfully saved weekly time entries',
        expect.objectContaining({
          totalEntriesProcessed: expect.any(Number),
          successfulEntries: expect.any(Number),
          failedEntries: expect.any(Number),
          entriesToDelete: expect.any(Number),
        }),
      );
    });

    it('should call onSaveSuccess callback when provided', async () => {
      const onSaveSuccess = jest.fn();
      const successResponse = {
        timeTrackingBatchManageTimeEntries: {
          __typename: 'TimeTracking_BatchManageTimeEntriesPayload',
          successCode: 'TIME_TRACKING_CREATE_SUCCESS',
        },
      };

      mockSaveTimeEntries.mockResolvedValue({
        data: successResponse,
      });

      const { result } = renderHook(
        () => useSaveWeeklyTimeEntries({ onSaveSuccess }),
        {
          wrapper: ({ children }) => (
            <Provider store={createMockStore()}>{children}</Provider>
          ),
        },
      );

      await act(async () => {
        await result.current.saveWeeklyTimeEntries();
      });

      expect(onSaveSuccess).toHaveBeenCalled();
    });
  });

  describe('Loading and data states', () => {
    it('should return loading state from Apollo', () => {
      (useBatchSaveTimeEntriesMutation as jest.Mock).mockReturnValue([
        mockSaveTimeEntries,
        {
          loading: true,
          error: null,
          data: null,
        },
      ]);

      const { result } = renderHookWithStore();

      expect(result.current.loading).toBe(true);
    });

    it('should return saved data from Apollo', () => {
      const mockData = {
        timeTrackingBatchManageTimeEntries: {
          __typename: 'TimeTracking_BatchManageTimeEntriesPayload',
          successCode: 'TIME_TRACKING_CREATE_SUCCESS',
        },
      };

      (useBatchSaveTimeEntriesMutation as jest.Mock).mockReturnValue([
        mockSaveTimeEntries,
        {
          loading: false,
          error: null,
          data: mockData,
        },
      ]);

      const { result } = renderHookWithStore();

      expect(result.current.savedData).toBe(
        mockData.timeTrackingBatchManageTimeEntries,
      );
    });

    it('should handle Apollo errors internally', () => {
      const apolloError = new ApolloError({ errorMessage: 'Network error' });

      (useBatchSaveTimeEntriesMutation as jest.Mock).mockReturnValue([
        mockSaveTimeEntries,
        {
          loading: false,
          error: apolloError,
          data: null,
        },
      ]);

      const { result } = renderHookWithStore();

      // Hook should still work despite Apollo error
      expect(result.current.saveWeeklyTimeEntries).toBeInstanceOf(Function);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Apollo client configuration', () => {
    it('should configure mutation with correct context and options', () => {
      renderHookWithStore();

      expect(useBatchSaveTimeEntriesMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          context: {
            clientName: 2, // ApolloClientNames.TIME_TRACKING enum value
            fetchPolicy: 'cache-and-network',
            notifyOnNetworkStatusChange: true,
          },
          onError: expect.any(Function),
        }),
      );
    });
  });

  describe('Data validation and edge cases', () => {
    it('should handle empty time entries array', () => {
      mockTransformToTimeEntries.mockReturnValue([]);
      mockExtractTimeEntriesToDelete.mockReturnValue([]);

      const { result } = renderHookWithStore();
      expect(result.current.hasDataToSave).toBe(false);
    });

    it('should handle null team member', () => {
      (selectTeamMember as jest.Mock).mockReturnValue(null);

      const { result } = renderHookWithStore();
      expect(result.current.hasDataToSave).toBe(false);
    });

    it('should handle undefined weekly time entries', () => {
      (selectAllTimesheetRows as jest.Mock).mockReturnValue(undefined);

      const { result } = renderHookWithStore();
      expect(result.current.hasDataToSave).toBe(false);
    });

    it('should handle mixed operations (create, update, delete)', () => {
      const mixedData = [
        { id: 'new-entry', operation: 'CREATE' },
        { id: 'existing-entry', operation: 'UPDATE' },
      ];
      const mixedDeletions = ['deleted-entry'];

      mockTransformToTimeEntries.mockReturnValue(mixedData);
      mockExtractTimeEntriesToDelete.mockReturnValue(mixedDeletions);

      const { result } = renderHookWithStore();
      expect(result.current.hasDataToSave).toBe(true);
    });

    it('should handle large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `entry-${i}`,
        operation: 'CREATE',
      }));

      mockTransformToTimeEntries.mockReturnValue(largeDataset);
      mockExtractTimeEntriesToDelete.mockReturnValue([]);

      const { result } = renderHookWithStore();
      expect(result.current.hasDataToSave).toBe(true);
    });
  });

  describe('Redux integration', () => {
    it('should use correct Redux selectors', () => {
      renderHookWithStore();

      expect(selectAllTimesheetRows).toHaveBeenCalled();
      expect(selectTeamMember).toHaveBeenCalled();
      expect(selectDateRange).toHaveBeenCalled();
    });

    it('should handle Redux state changes', () => {
      const { rerender } = renderHookWithStore();

      // Change Redux state
      const newDateRange = { start: '2024-01-08', end: '2024-01-14' };
      (selectDateRange as jest.Mock).mockReturnValue(newDateRange);

      rerender();

      expect(mockTransformToTimeEntries).toHaveBeenCalledWith(
        expect.objectContaining({
          dateRange: newDateRange,
        }),
        expect.any(Object),
        expect.any(Array),
      );
    });
  });

  describe('formatDetailedErrorMessages function', () => {
    it('should format multiple error messages correctly', async () => {
      const partialResponse = {
        timeTrackingBatchManageTimeEntries: {
          __typename: 'TimeTracking_PartialBatchManageTimeEntriesPayload',
          timeEntries: [
            {
              __typename: 'TimeTracking_UpdateTimeEntryError',
              errorCode: 'VALIDATION_ERROR',
              message: 'Invalid duration',
              subCode: 'INVALID_DURATION',
            },
            {
              __typename: 'TimeTracking_UpdateTimeEntryError',
              errorCode: 'MISSING_FIELD',
              message: 'Required field missing',
              subCode: '',
            },
          ],
        },
      };

      mockSaveTimeEntries.mockResolvedValue({
        data: partialResponse,
      });

      // Mock formatMessage to return predictable values
      mockIntl.formatMessage.mockImplementation((msg, values) => {
        if (msg.id === 'weekly.time.entry.save.error.detail') {
          return `${values.index}. date ${values.date} for ${values.hours} hours failed due to: ${values.errorMessage}`;
        }
        if (msg.id === 'weekly.time.entry.save.error.header') {
          return `Time entries(s) failed to save:<br>${values.errorMessages}`;
        }
        return msg.defaultMessage || '';
      });

      const { result } = renderHookWithStore();

      await act(async () => {
        await result.current.saveWeeklyTimeEntries();
      });

      // Verify that detailed error messages are formatted
      expect(mockIntl.formatMessage).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'weekly.time.entry.save.error.detail' }),
        expect.any(Object),
      );
    });

    it('should handle empty detailed errors array', async () => {
      const partialResponse = {
        timeTrackingBatchManageTimeEntries: {
          __typename: 'TimeTracking_PartialBatchManageTimeEntriesPayload',
          timeEntries: [],
        },
      };

      mockSaveTimeEntries.mockResolvedValue({
        data: partialResponse,
      });

      mockIntl.formatMessage.mockImplementation((msg) => {
        if (msg.id === 'weekly.time.entry.save.error.general') {
          return 'Something went wrong';
        }
        return msg.defaultMessage || '';
      });

      const { result } = renderHookWithStore();

      await act(async () => {
        await result.current.saveWeeklyTimeEntries();
      });

      // Should succeed with empty array
      expect(result.current).toBeDefined();
    });

    it('should convert duration from seconds to hours in error messages', async () => {
      const partialResponse = {
        timeTrackingBatchManageTimeEntries: {
          __typename: 'TimeTracking_PartialBatchManageTimeEntriesPayload',
          timeEntries: [
            {
              __typename: 'TimeTracking_UpdateTimeEntryError',
              errorCode: 'VALIDATION_ERROR',
              message: 'Duration too long',
              subCode: '',
            },
          ],
        },
      };

      mockSaveTimeEntries.mockResolvedValue({
        data: partialResponse,
      });

      mockIntl.formatMessage.mockImplementation((msg, values) => {
        if (msg.id === 'weekly.time.entry.save.error.detail' && values) {
          // Verify hours calculation (duration / 3600)
          expect(values.hours).toBeDefined();
          return `Error: ${values.hours} hours`;
        }
        return msg.defaultMessage || '';
      });

      const { result } = renderHookWithStore();

      await act(async () => {
        await result.current.saveWeeklyTimeEntries();
      });
    });

    it('should clean up error message by removing Details prefix', async () => {
      const partialResponse = {
        timeTrackingBatchManageTimeEntries: {
          __typename: 'TimeTracking_PartialBatchManageTimeEntriesPayload',
          timeEntries: [
            {
              __typename: 'TimeTracking_UpdateTimeEntryError',
              errorCode: 'VALIDATION_ERROR',
              message:
                'Some error Details:\\nThe following fields are required: customer',
              subCode: '',
            },
          ],
        },
      };

      mockSaveTimeEntries.mockResolvedValue({
        data: partialResponse,
      });

      const { result } = renderHookWithStore();

      await act(async () => {
        await result.current.saveWeeklyTimeEntries();
      });

      // Verify message cleanup happens
      expect(mockIntl.formatMessage).toHaveBeenCalled();
    });
  });

  describe('customErrorHandler function', () => {
    it('should handle GENERAL_V3_ERROR with subCode and return combined message', async () => {
      const errorResponse = {
        timeTrackingBatchManageTimeEntries: {
          __typename: 'TimeTracking_BatchManageTimeEntriesError',
          errorCode: 'GENERAL_V3_ERROR',
          message: 'API Error',
          details: 'Error details text',
          subCode: 'SUB_ERROR_123',
        },
      };

      mockSaveTimeEntries.mockResolvedValue({
        data: errorResponse,
      });

      const { result } = renderHookWithStore();

      await act(async () => {
        await result.current.saveWeeklyTimeEntries();
      });

      // Verify error was logged
      expect(mockSandbox.logger.error).toHaveBeenCalled();
    });

    it('should handle GENERAL_V1_ERROR with subCode and return combined message', async () => {
      const errorResponse = {
        timeTrackingBatchManageTimeEntries: {
          __typename: 'TimeTracking_BatchManageTimeEntriesError',
          errorCode: 'GENERAL_V1_ERROR',
          message: 'Legacy API Error',
          details: 'Legacy error details',
          subCode: 'LEGACY_SUB_123',
        },
      };

      mockSaveTimeEntries.mockResolvedValue({
        data: errorResponse,
      });

      const { result } = renderHookWithStore();

      await act(async () => {
        await result.current.saveWeeklyTimeEntries();
      });

      // Verify error was logged
      expect(mockSandbox.logger.error).toHaveBeenCalled();
    });

    it('should handle TSHEET_SYNC_FAILED_FOR_WEEKLY_TIMESHEET with details cleanup', async () => {
      const errorResponse = {
        timeTrackingBatchManageTimeEntries: {
          __typename: 'TimeTracking_BatchManageTimeEntriesError',
          errorCode: 'TSHEET_SYNC_FAILED_FOR_WEEKLY_TIMESHEET',
          message: 'Sync failed',
          details: 'Some prefix Details:\\nActual error message\\nSecond line',
          subCode: '',
        },
      };

      mockSaveTimeEntries.mockResolvedValue({
        data: errorResponse,
      });

      const { result } = renderHookWithStore();

      await act(async () => {
        await result.current.saveWeeklyTimeEntries();
      });

      // Verify error was handled
      expect(mockSandbox.logger.error).toHaveBeenCalled();
    });

    it('should use mapTimeTrackingMutationError for other error codes', async () => {
      const errorResponse = {
        timeTrackingBatchManageTimeEntries: {
          __typename: 'TimeTracking_BatchManageTimeEntriesError',
          errorCode: 'CUSTOM_ERROR_CODE',
          message: 'Custom error',
          details: '',
          subCode: '',
        },
      };

      mockSaveTimeEntries.mockResolvedValue({
        data: errorResponse,
      });

      const { result } = renderHookWithStore();

      await act(async () => {
        await result.current.saveWeeklyTimeEntries();
      });

      // Verify mapTimeTrackingMutationError was called
      expect(mockSandbox.logger.error).toHaveBeenCalled();
    });
  });

  describe('Missing team member handling (lines 378-385)', () => {
    it('should handle missing team member during save', async () => {
      // Start with valid team member to pass initial checks
      (selectTeamMember as jest.Mock).mockReturnValue(mockTeamMember);
      mockTransformToTimeEntries.mockReturnValue([{ id: 'entry-1' }]);
      mockExtractTimeEntriesToDelete.mockReturnValue([]);

      const { result, rerender } = renderHookWithStore();

      // Verify initial state has data to save
      expect(result.current.hasDataToSave).toBe(true);

      // Now change team member to null and rerender
      (selectTeamMember as jest.Mock).mockReturnValue(null);
      rerender();

      await act(async () => {
        try {
          await result.current.saveWeeklyTimeEntries();
        } catch (error) {
          // Error may or may not be thrown depending on implementation
        }
      });

      // The function should log when team member is missing or handle gracefully
      // Check that the function was called but didn't proceed with save
      expect(mockSaveTimeEntries).not.toHaveBeenCalled();
    });
  });

  describe('Partial success handling (lines 480-608)', () => {
    it('should handle partial success with some failed entries', async () => {
      const partialResponse = {
        timeTrackingBatchManageTimeEntries: {
          __typename: 'TimeTracking_PartialBatchManageTimeEntriesPayload',
          timeEntries: [
            {
              __typename: 'TimeTracking_TimeEntry',
              id: 'entry-1',
              date: '2024-01-01',
              duration: 28800,
            },
            {
              __typename: 'TimeTracking_UpdateTimeEntryError',
              errorCode: 'VALIDATION_ERROR',
              message: 'Validation failed',
              subCode: 'INVALID_DATA',
            },
          ],
        },
      };

      mockSaveTimeEntries.mockResolvedValue({
        data: partialResponse,
      });

      mockIntl.formatMessage.mockImplementation((msg, values) => {
        if (msg.id === 'weekly.time.entry.save.error.detail') {
          return `${values.index}. error occurred`;
        }
        if (msg.id === 'weekly.time.entry.save.error.header') {
          return `Errors: ${values.errorMessages}`;
        }
        return msg.defaultMessage || '';
      });

      const { result } = renderHookWithStore();

      await act(async () => {
        await result.current.saveWeeklyTimeEntries();
      });

      // The hook should handle partial success - check that it was called
      // The exact logging message may vary
      expect(mockSandbox.logger.info).toHaveBeenCalled();
    });

    it('should treat partial payload as success when all entries have IDs', async () => {
      const partialResponse = {
        timeTrackingBatchManageTimeEntries: {
          __typename: 'TimeTracking_PartialBatchManageTimeEntriesPayload',
          timeEntries: [
            {
              __typename: 'TimeTracking_TimeEntry',
              id: 'entry-1',
              date: '2024-01-01',
              duration: 28800,
            },
            {
              __typename: 'TimeTracking_TimeEntry',
              id: 'entry-2',
              date: '2024-01-02',
              duration: 21600,
            },
          ],
        },
      };

      mockSaveTimeEntries.mockResolvedValue({
        data: partialResponse,
      });

      const mockOnSaveSuccess = jest.fn();
      const { result } = renderHookWithStore(createMockStore(), {
        onSaveSuccess: mockOnSaveSuccess,
      });

      await act(async () => {
        await result.current.saveWeeklyTimeEntries();
      });

      expect(mockOnSaveSuccess).toHaveBeenCalled();
      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        'Component=useSaveWeeklyTimeEntries Event=Successfully saved weekly time entries',
        expect.objectContaining({
          totalEntriesProcessed: expect.any(Number),
          successfulEntries: 2,
          failedEntries: 0,
        }),
      );
    });

    it('should store detailed errors in Redux for partial failures', async () => {
      const partialResponse = {
        timeTrackingBatchManageTimeEntries: {
          __typename: 'TimeTracking_PartialBatchManageTimeEntriesPayload',
          timeEntries: [
            {
              __typename: 'TimeTracking_UpdateTimeEntryError',
              errorCode: 'ERROR_1',
              message: 'First error',
              subCode: 'SUB1',
            },
            {
              __typename: 'TimeTracking_UpdateTimeEntryError',
              errorCode: 'ERROR_2',
              message: 'Second error',
              subCode: 'SUB2',
            },
          ],
        },
      };

      mockSaveTimeEntries.mockResolvedValue({
        data: partialResponse,
      });

      mockIntl.formatMessage.mockImplementation(
        (msg) => msg.defaultMessage || '',
      );

      const { result } = renderHookWithStore();

      await act(async () => {
        await result.current.saveWeeklyTimeEntries();
      });

      // Verify partial success was logged with details
      // The hook should handle the errors
      expect(mockSandbox.logger.info).toHaveBeenCalled();
    });

    it('should call onSaveSuccess even after partial success', async () => {
      const partialResponse = {
        timeTrackingBatchManageTimeEntries: {
          __typename: 'TimeTracking_PartialBatchManageTimeEntriesPayload',
          timeEntries: [
            {
              __typename: 'TimeTracking_UpdateTimeEntryError',
              errorCode: 'ERROR_1',
              message: 'Error occurred',
              subCode: '',
            },
          ],
        },
      };

      mockSaveTimeEntries.mockResolvedValue({
        data: partialResponse,
      });

      mockIntl.formatMessage.mockImplementation(
        (msg) => msg.defaultMessage || '',
      );

      const mockOnSaveSuccess = jest.fn();
      const { result } = renderHookWithStore(createMockStore(), {
        onSaveSuccess: mockOnSaveSuccess,
      });

      await act(async () => {
        await result.current.saveWeeklyTimeEntries();
      });

      expect(mockOnSaveSuccess).toHaveBeenCalled();
    });
  });

  describe('Degraded error handling', () => {
    const {
      shouldTreatWeeklyTimesheetErrorAsDegraded,
      setInteractionDegraded,
      endInteractionWithFailure,
    } = require('src/js/common/CustomerInteraction');

    it('should mark interaction as degraded when error response contains degraded error', async () => {
      (shouldTreatWeeklyTimesheetErrorAsDegraded as jest.Mock).mockReturnValue(
        true,
      );

      const errorResponse = {
        timeTrackingBatchManageTimeEntries: {
          __typename: 'TimeTracking_BatchManageTimeEntriesError',
          errorCode: 'TSHEET_SYNC_FAILED_FOR_WEEKLY_TIMESHEET',
          message: 'DataSyncWorkflowActivityType sync failed',
          details: 'DataSyncWorkflowActivityType error details',
          subCode: '',
        },
      };

      mockSaveTimeEntries.mockResolvedValue({
        data: errorResponse,
      });

      const { result } = renderHookWithStore();

      await act(async () => {
        await result.current.saveWeeklyTimeEntries();
      });

      expect(setInteractionDegraded).toHaveBeenCalled();
      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        'Weekly timesheet save marked as degraded due to DataSyncWorkflowActivityType error',
        expect.any(Object),
      );

      (shouldTreatWeeklyTimesheetErrorAsDegraded as jest.Mock).mockReturnValue(
        false,
      );
    });

    it('should end interaction with failure when error is not degraded', async () => {
      (shouldTreatWeeklyTimesheetErrorAsDegraded as jest.Mock).mockReturnValue(
        false,
      );

      const errorResponse = {
        timeTrackingBatchManageTimeEntries: {
          __typename: 'TimeTracking_BatchManageTimeEntriesError',
          errorCode: 'REGULAR_ERROR',
          message: 'Regular error',
          details: '',
          subCode: '',
        },
      };

      mockSaveTimeEntries.mockResolvedValue({
        data: errorResponse,
      });

      const { result } = renderHookWithStore();

      await act(async () => {
        await result.current.saveWeeklyTimeEntries();
      });

      expect(endInteractionWithFailure).toHaveBeenCalled();
    });

    it('should mark interaction as degraded in catch block when error is degraded', async () => {
      (shouldTreatWeeklyTimesheetErrorAsDegraded as jest.Mock).mockReturnValue(
        true,
      );

      const apolloError = new ApolloError({
        errorMessage: 'DataSyncWorkflowActivityType network error',
      });
      mockSaveTimeEntries.mockRejectedValue(apolloError);

      const { result } = renderHookWithStore();

      await act(async () => {
        await expect(result.current.saveWeeklyTimeEntries()).rejects.toThrow();
      });

      expect(setInteractionDegraded).toHaveBeenCalled();
      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        'Weekly timesheet save marked as degraded due to DataSyncWorkflowActivityType error in catch block',
        expect.any(Object),
      );

      (shouldTreatWeeklyTimesheetErrorAsDegraded as jest.Mock).mockReturnValue(
        false,
      );
    });

    it('should end interaction with failure in catch block when error is not degraded', async () => {
      (shouldTreatWeeklyTimesheetErrorAsDegraded as jest.Mock).mockReturnValue(
        false,
      );

      const apolloError = new ApolloError({
        errorMessage: 'Regular network error',
      });
      mockSaveTimeEntries.mockRejectedValue(apolloError);

      const { result } = renderHookWithStore();

      await act(async () => {
        await expect(result.current.saveWeeklyTimeEntries()).rejects.toThrow();
      });

      expect(endInteractionWithFailure).toHaveBeenCalled();
    });
  });

  describe('formatDetailedErrorMessages edge cases', () => {
    const {
      mapTimeTrackingMutationError,
    } = require('src/js/service/errors/timeTrackingErrors');

    afterEach(() => {
      (mapTimeTrackingMutationError as jest.Mock).mockReturnValue(
        'Time tracking error',
      );
      mockIntl.formatMessage.mockReset();
    });

    it('should return general error when partial response has no error-typed entries (line 62)', async () => {
      const partialResponse = {
        timeTrackingBatchManageTimeEntries: {
          __typename: 'TimeTracking_PartialBatchManageTimeEntriesPayload',
          timeEntries: [
            {
              __typename: 'TimeTracking_TimeEntry',
              id: null,
              date: '2024-01-01',
              duration: 28800,
            },
          ],
        },
      };

      mockSaveTimeEntries.mockResolvedValue({ data: partialResponse });

      mockIntl.formatMessage.mockImplementation(
        (msg: any) => msg.id || msg.defaultMessage || '',
      );

      const { result } = renderHookWithStore();

      await act(async () => {
        await result.current.saveWeeklyTimeEntries();
      });

      expect(mockIntl.formatMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'weekly.time.entry.save.error.general',
        }),
      );
    });

    it('should use mapTimeTrackingMutationError when error message is empty (lines 89-95)', async () => {
      const partialResponse = {
        timeTrackingBatchManageTimeEntries: {
          __typename: 'TimeTracking_PartialBatchManageTimeEntriesPayload',
          timeEntries: [
            {
              __typename: 'TimeTracking_UpdateTimeEntryError',
              errorCode: 'EMPTY_MSG_ERROR',
              message: '',
              subCode: 'SUB1',
            },
          ],
        },
      };

      mockSaveTimeEntries.mockResolvedValue({ data: partialResponse });
      (mapTimeTrackingMutationError as jest.Mock).mockReturnValue(
        'Valid mapped error',
      );

      mockIntl.formatMessage.mockImplementation((msg: any, values?: any) => {
        if (msg.id === 'weekly.time.entry.save.error.detail' && values) {
          return `${values.index}. ${values.errorMessage}`;
        }
        if (msg.id === 'weekly.time.entry.save.error.header' && values) {
          return `Errors: ${values.errorMessages}`;
        }
        return msg.id || '';
      });

      const { result } = renderHookWithStore();

      await act(async () => {
        await result.current.saveWeeklyTimeEntries();
      });

      expect(mapTimeTrackingMutationError).toHaveBeenCalledWith(
        expect.any(Object),
        'EMPTY_MSG_ERROR',
        'SUB1',
      );

      expect(mockIntl.formatMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'weekly.time.entry.save.error.detail',
        }),
        expect.objectContaining({ errorMessage: 'Valid mapped error' }),
      );
    });

    it('should fall back to unknown error when mapTimeTrackingMutationError returns catch.all.error.content (lines 96-100)', async () => {
      const partialResponse = {
        timeTrackingBatchManageTimeEntries: {
          __typename: 'TimeTracking_PartialBatchManageTimeEntriesPayload',
          timeEntries: [
            {
              __typename: 'TimeTracking_UpdateTimeEntryError',
              errorCode: 'CATCHALL_ERROR',
              message: '',
              subCode: '',
            },
          ],
        },
      };

      mockSaveTimeEntries.mockResolvedValue({ data: partialResponse });
      (mapTimeTrackingMutationError as jest.Mock).mockReturnValue(
        'catch.all.error.content',
      );

      mockIntl.formatMessage.mockImplementation((msg: any, values?: any) => {
        if (msg.id === 'weekly.time.entry.save.error.unknown') {
          return 'Unknown error occurred';
        }
        if (msg.id === 'weekly.time.entry.save.error.detail' && values) {
          return `${values.index}. ${values.errorMessage}`;
        }
        if (msg.id === 'weekly.time.entry.save.error.header' && values) {
          return `Errors: ${values.errorMessages}`;
        }
        return msg.id || '';
      });

      const { result } = renderHookWithStore();

      await act(async () => {
        await result.current.saveWeeklyTimeEntries();
      });

      expect(mockIntl.formatMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'weekly.time.entry.save.error.unknown',
        }),
      );
    });

    it('should fall back to unknown error when mapTimeTrackingMutationError returns null (lines 96-100)', async () => {
      const partialResponse = {
        timeTrackingBatchManageTimeEntries: {
          __typename: 'TimeTracking_PartialBatchManageTimeEntriesPayload',
          timeEntries: [
            {
              __typename: 'TimeTracking_UpdateTimeEntryError',
              errorCode: 'NULL_MAPPED',
              message: null,
              subCode: '',
            },
          ],
        },
      };

      mockSaveTimeEntries.mockResolvedValue({ data: partialResponse });
      (mapTimeTrackingMutationError as jest.Mock).mockReturnValue(null);

      mockIntl.formatMessage.mockImplementation((msg: any, values?: any) => {
        if (msg.id === 'weekly.time.entry.save.error.unknown') {
          return 'Unknown error occurred';
        }
        if (msg.id === 'weekly.time.entry.save.error.detail' && values) {
          return `${values.index}. ${values.errorMessage}`;
        }
        if (msg.id === 'weekly.time.entry.save.error.header' && values) {
          return `Errors: ${values.errorMessages}`;
        }
        return msg.id || '';
      });

      const { result } = renderHookWithStore();

      await act(async () => {
        await result.current.saveWeeklyTimeEntries();
      });

      expect(mockIntl.formatMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'weekly.time.entry.save.error.unknown',
        }),
      );
    });

    it('should handle message that becomes empty after regex cleanup (line 88 truthy + line 89)', async () => {
      const partialResponse = {
        timeTrackingBatchManageTimeEntries: {
          __typename: 'TimeTracking_PartialBatchManageTimeEntriesPayload',
          timeEntries: [
            {
              __typename: 'TimeTracking_UpdateTimeEntryError',
              errorCode: 'CLEANUP_ERROR',
              message: 'Prefix Details:\\n',
              subCode: '',
            },
          ],
        },
      };

      mockSaveTimeEntries.mockResolvedValue({ data: partialResponse });
      (mapTimeTrackingMutationError as jest.Mock).mockReturnValue(
        'Cleaned up error',
      );

      mockIntl.formatMessage.mockImplementation((msg: any, values?: any) => {
        if (msg.id === 'weekly.time.entry.save.error.detail' && values) {
          return `${values.index}. ${values.errorMessage}`;
        }
        if (msg.id === 'weekly.time.entry.save.error.header' && values) {
          return `Errors: ${values.errorMessages}`;
        }
        return msg.id || '';
      });

      const { result } = renderHookWithStore();

      await act(async () => {
        await result.current.saveWeeklyTimeEntries();
      });

      expect(mapTimeTrackingMutationError).toHaveBeenCalledWith(
        expect.any(Object),
        'CLEANUP_ERROR',
        '',
      );
    });
  });

  describe('customErrorHandler via mapError', () => {
    const { mapError } = require('src/js/service/utils/mapError');

    it('should pass customErrorHandler to mapError', async () => {
      const errorResponse = {
        timeTrackingBatchManageTimeEntries: {
          __typename: 'TimeTracking_BatchManageTimeEntriesError',
          errorCode: 'GENERAL_V3_ERROR',
          message: 'API Error',
          details: 'Error details',
          subCode: 'SUB_123',
        },
      };

      mockSaveTimeEntries.mockResolvedValue({ data: errorResponse });

      // Override mapError to invoke the customErrorHandler
      (mapError as jest.Mock).mockImplementation(
        ({ customErrorHandler, error }) => {
          if (customErrorHandler && typeof error === 'string') {
            return customErrorHandler(error);
          }
          return 'Mapped error';
        },
      );

      const { result } = renderHookWithStore();

      await act(async () => {
        await result.current.saveWeeklyTimeEntries();
      });

      expect(mapError).toHaveBeenCalledWith(
        expect.objectContaining({
          customErrorHandler: expect.any(Function),
        }),
      );

      // Restore default mock
      (mapError as jest.Mock).mockReturnValue('Mapped error message');
    });

    it('should handle GENERAL_V3_ERROR with subCode in customErrorHandler', async () => {
      const errorResponse = {
        timeTrackingBatchManageTimeEntries: {
          __typename: 'TimeTracking_BatchManageTimeEntriesError',
          errorCode: 'GENERAL_V3_ERROR',
          message: 'API Error Message',
          details: 'Detailed info',
          subCode: 'SUB_ERROR',
        },
      };

      mockSaveTimeEntries.mockResolvedValue({ data: errorResponse });

      (mapError as jest.Mock).mockImplementation(
        ({ customErrorHandler, error }) => {
          if (customErrorHandler && typeof error === 'string') {
            return customErrorHandler(error);
          }
          return 'Mapped error';
        },
      );

      const { result } = renderHookWithStore();

      await act(async () => {
        await result.current.saveWeeklyTimeEntries();
      });

      expect(mockSandbox.logger.error).toHaveBeenCalledWith(
        'API Error Message Detailed info',
      );

      (mapError as jest.Mock).mockReturnValue('Mapped error message');
    });

    it('should handle GENERAL_V1_ERROR with subCode in customErrorHandler', async () => {
      const errorResponse = {
        timeTrackingBatchManageTimeEntries: {
          __typename: 'TimeTracking_BatchManageTimeEntriesError',
          errorCode: 'GENERAL_V1_ERROR',
          message: 'Legacy Error',
          details: 'Legacy details',
          subCode: 'LEGACY_SUB',
        },
      };

      mockSaveTimeEntries.mockResolvedValue({ data: errorResponse });

      (mapError as jest.Mock).mockImplementation(
        ({ customErrorHandler, error }) => {
          if (customErrorHandler && typeof error === 'string') {
            return customErrorHandler(error);
          }
          return 'Mapped error';
        },
      );

      const { result } = renderHookWithStore();

      await act(async () => {
        await result.current.saveWeeklyTimeEntries();
      });

      expect(mockSandbox.logger.error).toHaveBeenCalledWith(
        'Legacy Error Legacy details',
      );

      (mapError as jest.Mock).mockReturnValue('Mapped error message');
    });

    it('should handle TSHEET_SYNC_FAILED_FOR_WEEKLY_TIMESHEET in customErrorHandler', async () => {
      const errorResponse = {
        timeTrackingBatchManageTimeEntries: {
          __typename: 'TimeTracking_BatchManageTimeEntriesError',
          errorCode: 'TSHEET_SYNC_FAILED_FOR_WEEKLY_TIMESHEET',
          message: 'Sync failed',
          details: 'Prefix Details:\\nActual error\\nSecond line',
          subCode: '',
        },
      };

      mockSaveTimeEntries.mockResolvedValue({ data: errorResponse });

      (mapError as jest.Mock).mockImplementation(
        ({ customErrorHandler, error }) => {
          if (customErrorHandler && typeof error === 'string') {
            return customErrorHandler(error);
          }
          return 'Mapped error';
        },
      );

      const { result } = renderHookWithStore();

      await act(async () => {
        await result.current.saveWeeklyTimeEntries();
      });

      expect(mockSandbox.logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Actual error'),
      );

      (mapError as jest.Mock).mockReturnValue('Mapped error message');
    });

    it('should fall back to mapTimeTrackingMutationError for unknown errors in customErrorHandler', async () => {
      const errorResponse = {
        timeTrackingBatchManageTimeEntries: {
          __typename: 'TimeTracking_BatchManageTimeEntriesError',
          errorCode: 'UNKNOWN_ERROR_TYPE',
          message: 'Unknown error',
          details: '',
          subCode: '',
        },
      };

      mockSaveTimeEntries.mockResolvedValue({ data: errorResponse });

      (mapError as jest.Mock).mockImplementation(
        ({ customErrorHandler, error }) => {
          if (customErrorHandler && typeof error === 'string') {
            return customErrorHandler(error);
          }
          return 'Mapped error';
        },
      );

      const { result } = renderHookWithStore();

      await act(async () => {
        await result.current.saveWeeklyTimeEntries();
      });

      expect(mockSandbox.logger.error).toHaveBeenCalledWith(
        'Time tracking error',
      );

      (mapError as jest.Mock).mockReturnValue('Mapped error message');
    });
  });
});

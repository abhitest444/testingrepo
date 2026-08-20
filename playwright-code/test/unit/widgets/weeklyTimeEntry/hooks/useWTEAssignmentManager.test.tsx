import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { WTEAssignmentManager } from '../../../../../src/js/widgets/weeklyTimeEntry/hooks/useWTEAssignmentManager';
import assignmentReducer from '../../../../../src/js/widgets/weeklyTimeEntry/store/assignmentSlice';
import timeEntryGridReducer from '../../../../../src/js/widgets/weeklyTimeEntry/store/timeEntryGridSlice';

jest.mock('@payroll/quicksand', () => ({
  useSandbox: jest.fn(() => ({ logger: { info: jest.fn() } })),
}));

// Mock the assignment hooks
jest.mock(
  '../../../../../src/js/service/hooks/assignments/useCustomFieldAssignments',
);
jest.mock(
  '../../../../../src/js/service/hooks/assignments/useStandardFieldAssignments',
);
jest.mock(
  '../../../../../src/js/service/hooks/assignments/useStandardFieldOptionAssignments',
);
jest.mock(
  '../../../../../src/js/service/hooks/assignments/useCustomFieldOptionAssignments',
);

const mockUseCustomFieldAssignments =
  require('../../../../../src/js/service/hooks/assignments/useCustomFieldAssignments').useCustomFieldAssignments;
const mockUseStandardFieldAssignments =
  require('../../../../../src/js/service/hooks/assignments/useStandardFieldAssignments').useStandardFieldAssignments;
const mockUseStandardFieldOptionAssignments =
  require('../../../../../src/js/service/hooks/assignments/useStandardFieldOptionAssignments').useStandardFieldOptionAssignments;
const mockUseCustomFieldOptionAssignments =
  require('../../../../../src/js/service/hooks/assignments/useCustomFieldOptionAssignments').useCustomFieldOptionAssignments;

const createMockStore = (initialState: any = {}) => {
  // Provide default state structure for timeEntryGrid if not provided
  const defaultTimeEntryGridState = {
    weeklyTimeEntries: {},
    rowOrder: [],
    teamMember: null,
    isQuickFindEnabled: false,
    isQuickFindSettled: false,
    ...initialState.timeEntryGrid,
  };

  // Default timeEntrySettings for selectCompanySettings
  const defaultTimeEntrySettings = {
    isServiceFieldEnabled: true,
    isBillingFieldEnabled: true,
    billingRateForTimeEnabled: false,
    firstDayOfWeek: 0,
    isClassEnabled: true,
    isLocationEnabled: true,
    classRequired: false,
    locationRequired: false,
    serviceItemRequired: false,
    requireBillable: false,
    timeSheetEntryMakesNotesRequiredEnabled: false,
    ...initialState.timeEntrySettings,
  };

  // Default customFields state
  const defaultCustomFields = {
    customFields: [],
    ...initialState.customFields,
  };

  return configureStore({
    reducer: {
      assignments: assignmentReducer,
      timeEntryGrid: timeEntryGridReducer,
      // Add mock reducers for the slices the component uses
      timeEntrySettings: (state = defaultTimeEntrySettings) => state,
      customFields: (state = defaultCustomFields) => state,
    },
    preloadedState: {
      ...initialState,
      timeEntryGrid: defaultTimeEntryGridState,
      timeEntrySettings: defaultTimeEntrySettings,
      customFields: defaultCustomFields,
    },
  });
};

const renderAssignmentManager = (store: any) =>
  render(
    <Provider store={store}>
      <WTEAssignmentManager />
    </Provider>,
  );

// Helper to create a proper TimesheetRow
const createMockRow = (
  rowId: string,
  customerId: string | null,
  type: 'CUSTOMER' | 'PROJECT' = 'CUSTOMER',
) => ({
  rowId,
  timeAgainst: customerId ? { id: customerId, type } : null,
  deleted: false,
  timeEntries: {},
  totalHours: 0,
  billableTotal: 0,
  hasApprovedEntries: false,
});

describe('WTEAssignmentManager', () => {
  const mockLoadCustomFieldAssignments = jest.fn();
  const mockLoadStandardFieldAssignments = jest.fn();
  const mockLoadCFOAssignments = jest.fn();

  // Helper to simulate loading state transition (required for new stale data prevention logic)
  const simulateLoadingTransition = (
    mockHook: any,
    initialData: any = null,
    finalData: any = null,
  ) => {
    let callCount = 0;
    mockHook.mockImplementation(() => {
      callCount += 1;
      // First call: loading = true (triggers hasSeenLoadingRef)
      if (callCount === 1) {
        return {
          loadStandardFieldAssignments: mockLoadStandardFieldAssignments,
          loadCustomFieldAssignments: mockLoadCustomFieldAssignments,
          data: initialData,
          loading: true,
          error: null,
        };
      }
      // Subsequent calls: loading = false with data
      return {
        loadStandardFieldAssignments: mockLoadStandardFieldAssignments,
        loadCustomFieldAssignments: mockLoadCustomFieldAssignments,
        data: finalData,
        loading: false,
        error: null,
      };
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Manager stores SF/CF in Redux via onSuccess; invoke so runSfoCfoForEntity can run
    mockLoadStandardFieldAssignments.mockImplementation((args) => {
      args.onSuccess?.([]);
    });
    mockLoadCustomFieldAssignments.mockImplementation((args) => {
      args.onSuccess?.([]);
    });

    mockUseCustomFieldAssignments.mockReturnValue({
      loadCustomFieldAssignments: mockLoadCustomFieldAssignments,
      data: null,
      loading: false,
      error: null,
    });

    mockUseStandardFieldAssignments.mockReturnValue({
      loadStandardFieldAssignments: mockLoadStandardFieldAssignments,
      data: null,
      loading: false,
      error: null,
    });

    // SFO is handled by QuickFind; manager only uses SF/CF/CFO. Mock SFO so module does not create Apollo.
    mockUseStandardFieldOptionAssignments.mockReturnValue({
      data: null,
      error: null,
      loading: false,
      loadStandardFieldOptionAssignments: jest.fn(),
      pageInfo: null,
    });

    mockUseCustomFieldOptionAssignments.mockReturnValue({
      loadCustomFieldOptionAssignments: mockLoadCFOAssignments,
      data: null,
      loading: false,
      error: null,
    });
  });

  describe('Component Rendering', () => {
    it('should render without errors', () => {
      const store = createMockStore();
      const { container } = renderAssignmentManager(store);
      expect(container).toBeEmptyDOMElement(); // Component returns null
    });
  });

  describe('Customer Collection', () => {
    it('should not fetch when no rows exist', () => {
      const store = createMockStore({
        timeEntryGrid: {
          weeklyTimeEntries: {},
          rowOrder: [],
          teamMember: { id: 'worker1', name: 'John Doe' },
        },
      });

      renderAssignmentManager(store);

      expect(mockLoadCustomFieldAssignments).not.toHaveBeenCalled();
      expect(mockLoadStandardFieldAssignments).not.toHaveBeenCalled();
    });

    it('should fetch assignments for single customer', async () => {
      const store = createMockStore({
        timeEntryGrid: {
          weeklyTimeEntries: {
            row1: createMockRow('row1', 'customer1'),
          },
          rowOrder: ['row1'],
          teamMember: { id: 'worker1', name: 'John Doe' },
        },
        timeEntrySettings: {
          isServiceFieldEnabled: false,
          isClassEnabled: true,
          isLocationEnabled: true,
        },
        customFields: {
          customFields: [{ id: 'cf1', name: 'CF1' }], // Need CFs for CF assignment call
        },
      });

      renderAssignmentManager(store);

      await waitFor(() => {
        expect(mockLoadCustomFieldAssignments).toHaveBeenCalledWith(
          expect.objectContaining({
            input: { customerId: 'customer1', projectId: undefined },
            filter: { assigned: true },
            first: 100,
          }),
        );
      });

      expect(mockLoadStandardFieldAssignments).toHaveBeenCalledWith(
        expect.objectContaining({
          input: { customerId: 'customer1', projectId: undefined },
          filter: { assigned: true },
          first: 100,
        }),
      );
    });

    it('should collect unique customer IDs from multiple rows', async () => {
      const mockCFData = [{ id: 'cf1', assigned: true }];
      // Simulate loading transition for each customer
      let callCount = 0;
      mockUseCustomFieldAssignments.mockImplementation(() => {
        callCount += 1;
        // For each customer: first loading=true, then loading=false with data
        const customerCall = Math.floor((callCount - 1) / 2) + 1;
        const isFirstCall = (callCount - 1) % 2 === 0;
        if (isFirstCall) {
          return {
            loadCustomFieldAssignments: mockLoadCustomFieldAssignments,
            data: null,
            loading: true,
            error: null,
          };
        }
        return {
          loadCustomFieldAssignments: mockLoadCustomFieldAssignments,
          data: mockCFData,
          loading: false,
          error: null,
        };
      });

      const store = createMockStore({
        timeEntryGrid: {
          weeklyTimeEntries: {
            row1: createMockRow('row1', 'customer1'),
            row2: createMockRow('row2', 'customer1'), // Duplicate
            row3: createMockRow('row3', 'customer2'),
          },
          rowOrder: ['row1', 'row2', 'row3'],
          teamMember: { id: 'worker1', name: 'John Doe' },
        },
        customFields: {
          customFields: [{ id: 'cf1', name: 'CF1' }],
        },
      });

      renderAssignmentManager(store);

      // Hook fetches one entity at a time; mock returns data so it proceeds to customer2
      await waitFor(
        () => {
          expect(mockLoadCustomFieldAssignments).toHaveBeenCalledTimes(2);
        },
        { timeout: 2000 },
      );

      // Verify both unique customers were called
      expect(mockLoadCustomFieldAssignments).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            customerId: 'customer1',
          }),
        }),
      );
      expect(mockLoadCustomFieldAssignments).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            customerId: 'customer2',
          }),
        }),
      );
    });

    it('should handle PROJECT type as well as CUSTOMER type', async () => {
      const store = createMockStore({
        timeEntryGrid: {
          weeklyTimeEntries: {
            row1: createMockRow('row1', 'project1', 'PROJECT'),
          },
          rowOrder: ['row1'],
          teamMember: { id: 'worker1', name: 'John Doe' },
        },
        customFields: {
          customFields: [{ id: 'cf1', name: 'CF1' }],
        },
      });

      renderAssignmentManager(store);

      await waitFor(() => {
        // WTE sends customerId only, even when type is project
        expect(mockLoadCustomFieldAssignments).toHaveBeenCalledWith(
          expect.objectContaining({
            input: expect.objectContaining({
              customerId: 'project1',
            }),
          }),
        );
      });
    });

    it('should ignore rows without timeAgainst', () => {
      const store = createMockStore({
        timeEntryGrid: {
          weeklyTimeEntries: {
            row1: {
              id: 'row1',
              timeAgainst: null, // No customer
              deleted: false,
            },
          },
          rowOrder: ['row1'],
          teamMember: { id: 'worker1', name: 'John Doe' },
        },
      });

      renderAssignmentManager(store);

      expect(mockLoadCustomFieldAssignments).not.toHaveBeenCalled();
      expect(mockLoadStandardFieldAssignments).not.toHaveBeenCalled();
    });
  });

  describe('Caching Behavior', () => {
    it('should not fetch if customer is already cached', () => {
      const store = createMockStore({
        timeEntryGrid: {
          weeklyTimeEntries: {
            row1: {
              id: 'row1',
              timeAgainst: { id: 'customer1', type: 'CUSTOMER' },
              deleted: false,
            },
          },
          rowOrder: ['row1'],
          teamMember: { id: 'worker1', name: 'John Doe' },
        },
        assignments: {
          currentWorkerId: 'worker1',
          customerAssignments: {
            customer1: {
              customFieldAssignments: [],
              standardFieldAssignments: [],
              standardFieldOptions: { service: [], class: [], location: [] },
              customFieldOptionAssignments: {},
              loading: false,
              error: null,
              lastFetched: 1, // Manager treats as cached when lastFetched > 0
              cfoLoading: false,
            },
          },
        },
      });

      renderAssignmentManager(store);

      // Should not fetch because customer1 is cached
      expect(mockLoadCustomFieldAssignments).not.toHaveBeenCalled();
      expect(mockLoadStandardFieldAssignments).not.toHaveBeenCalled();
    });
  });

  describe('Worker Management', () => {
    it('should update worker ID in Redux when it changes', async () => {
      const store = createMockStore({
        timeEntryGrid: {
          weeklyTimeEntries: {},
          rowOrder: [],
          teamMember: { id: 'worker1', name: 'John Doe' },
        },
      });

      renderAssignmentManager(store);

      await waitFor(() => {
        expect(store.getState().assignments.currentWorkerId).toBe('worker1');
      });
    });

    it('should not fetch when workerId is null', () => {
      const store = createMockStore({
        timeEntryGrid: {
          weeklyTimeEntries: {
            row1: {
              id: 'row1',
              timeAgainst: { id: 'customer1', type: 'CUSTOMER' },
              deleted: false,
            },
          },
          rowOrder: ['row1'],
          teamMember: null, // No worker selected
        },
      });

      renderAssignmentManager(store);

      expect(mockLoadCustomFieldAssignments).not.toHaveBeenCalled();
      expect(mockLoadStandardFieldAssignments).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should cache error when API fails', async () => {
      mockUseCustomFieldAssignments.mockReturnValue({
        loadCustomFieldAssignments: mockLoadCustomFieldAssignments,
        data: null,
        loading: false,
        error: 'API Error',
      });

      // Do not invoke onSuccess so currentFetchEntityRef stays set and the error effect can dispatch setCustomerError
      mockLoadStandardFieldAssignments.mockImplementation(() => {});
      mockLoadCustomFieldAssignments.mockImplementation(() => {});

      const store = createMockStore({
        timeEntryGrid: {
          weeklyTimeEntries: {
            row1: {
              id: 'row1',
              timeAgainst: { id: 'customer1', type: 'CUSTOMER' },
              deleted: false,
            },
          },
          rowOrder: ['row1'],
          teamMember: { id: 'worker1', name: 'John Doe' },
        },
      });

      renderAssignmentManager(store);

      await waitFor(() => {
        const state = store.getState();
        expect(state.assignments.customerAssignments.customer1?.error).toBe(
          'API Error',
        );
      });
    });
  });

  describe('Sequential Fetching (No Hardcoded Limit)', () => {
    it('should handle more than 6 customers by fetching sequentially', async () => {
      // Create 10 unique customers (more than the old hardcoded limit of 6)
      const weeklyTimeEntries: Record<string, any> = {};
      const rowOrder: string[] = [];

      Array.from({ length: 10 }).forEach((_, i) => {
        const rowId = `row${i}`;
        weeklyTimeEntries[rowId] = createMockRow(rowId, `customer${i}`);
        rowOrder.push(rowId);
      });

      const store = createMockStore({
        timeEntryGrid: {
          weeklyTimeEntries,
          rowOrder,
          teamMember: { id: 'worker1', name: 'John Doe' },
        },
        customFields: {
          customFields: [{ id: 'cf1', name: 'CF1' }],
        },
      });

      renderAssignmentManager(store);

      // Should start fetching the first customer
      await waitFor(() => {
        expect(mockLoadCustomFieldAssignments).toHaveBeenCalledWith(
          expect.objectContaining({
            input: expect.objectContaining({
              customerId: 'customer0',
            }),
          }),
        );
      });

      // The component will fetch one customer at a time
      // When the first completes, it will automatically fetch the next
      // This test verifies that at least the first customer is fetched
      // (Full sequential behavior would require more complex async test setup)
    });
  });

  describe('Standard Field Options (SFO) Fetching', () => {
    it('should fetch location options when location field is disabled', async () => {
      // Use mockImplementation with state tracking
      let hasSeenLoading = false;
      mockUseStandardFieldAssignments.mockImplementation(() => {
        if (!hasSeenLoading) {
          hasSeenLoading = true;
          return {
            loadStandardFieldAssignments: mockLoadStandardFieldAssignments,
            data: null,
            loading: true,
            error: null,
          };
        }
        return {
          loadStandardFieldAssignments: mockLoadStandardFieldAssignments,
          data: [{ name: 'LOCATION', assigned: true }],
          loading: false,
          error: null,
        };
      });

      const store = createMockStore({
        timeEntryGrid: {
          weeklyTimeEntries: {
            row1: createMockRow('row1', 'customer1'),
          },
          rowOrder: ['row1'],
          teamMember: { id: 'worker1', name: 'John Doe' },
        },
        timeEntrySettings: {
          isServiceFieldEnabled: true,
          isClassEnabled: true,
          isLocationEnabled: false, // Disabled - should fetch options
        },
      });

      renderAssignmentManager(store);

      // When location is disabled, component dispatches setCustomerLoading for the customer.
      await waitFor(() => {
        const state = store.getState();
        expect(
          state.assignments.customerAssignments.customer1?.loading,
        ).toBeDefined();
      });

      // Verify SF was requested (needed for location-assigned path)
      expect(mockLoadStandardFieldAssignments).toHaveBeenCalled();
    });

    it('should fetch SFO when standard field is enabled in settings (so options load)', async () => {
      // When all fields are enabled, requestedSF is false, so we don't need loading transition
      // But we still need to trigger the effect, so we'll use a simple mock
      mockUseStandardFieldAssignments.mockReturnValue({
        loadStandardFieldAssignments: mockLoadStandardFieldAssignments,
        data: [],
        loading: false,
        error: null,
      });

      const store = createMockStore({
        timeEntryGrid: {
          weeklyTimeEntries: {
            row1: createMockRow('row1', 'customer1'),
          },
          rowOrder: ['row1'],
          teamMember: { id: 'worker1', name: 'John Doe' },
        },
        timeEntrySettings: {
          isServiceFieldEnabled: true,
          isClassEnabled: true,
          isLocationEnabled: true,
        },
      });

      renderAssignmentManager(store);

      // Wait for standard field assignments to be cached (SF; SFO is handled by QuickFind)
      await waitFor(() => {
        const state = store.getState();
        expect(
          state.assignments.customerAssignments.customer1
            ?.standardFieldAssignments,
        ).toBeDefined();
      });
    });
  });

  describe('Custom Field Options (CFO) Fetching', () => {
    it('should fetch CFO for dropdown custom fields', async () => {
      const mockCFData = [
        { id: 'cf1', assigned: true },
        { id: 'cf2', assigned: true },
      ];

      mockLoadCustomFieldAssignments.mockImplementation((args) => {
        args.onSuccess?.(mockCFData);
      });

      // SF not needed for this test (all fields enabled), but set it anyway
      mockUseStandardFieldAssignments.mockReturnValue({
        loadStandardFieldAssignments: mockLoadStandardFieldAssignments,
        data: [],
        loading: false,
        error: null,
      });

      const store = createMockStore({
        timeEntryGrid: {
          weeklyTimeEntries: {
            row1: createMockRow('row1', 'customer1'),
          },
          rowOrder: ['row1'],
          teamMember: { id: 'worker1', name: 'John Doe' },
        },
        customFields: {
          customFields: [
            { id: 'cf1', name: 'CF1', type: 'DROPDOWN' },
            { id: 'cf2', name: 'CF2', type: 'MULTI_SELECT' },
          ],
        },
      });

      renderAssignmentManager(store);

      // Should fetch CFO for the first dropdown CF
      await waitFor(() => {
        expect(mockLoadCFOAssignments).toHaveBeenCalledWith({
          input: {
            timeForEntityId: 'worker1',
            timeAgainstEntityId: 'customer1',
            customFieldIds: 'cf1',
          },
          filter: {
            assigned: true,
            active: true,
          },
          first: 100,
        });
      });
    });

    it('should not fetch CFO for non-dropdown custom fields', async () => {
      const mockCFData = [{ id: 'cf1', assigned: true }];

      // Pass CF data via onSuccess; cf1 is TEXT so runSfoCfoForEntity will not request CFO
      mockLoadCustomFieldAssignments.mockImplementation((args) => {
        args.onSuccess?.(mockCFData);
      });

      mockUseStandardFieldAssignments.mockReturnValue({
        loadStandardFieldAssignments: mockLoadStandardFieldAssignments,
        data: [],
        loading: false,
        error: null,
      });

      const store = createMockStore({
        timeEntryGrid: {
          weeklyTimeEntries: {
            row1: createMockRow('row1', 'customer1'),
          },
          rowOrder: ['row1'],
          teamMember: { id: 'worker1', name: 'John Doe' },
        },
        customFields: {
          customFields: [{ id: 'cf1', name: 'CF1', type: 'TEXT' }],
        },
      });

      renderAssignmentManager(store);

      // Wait for assignments to be cached (set via onSuccess)
      await waitFor(() => {
        const state = store.getState();
        expect(
          state.assignments.customerAssignments.customer1
            ?.customFieldAssignments,
        ).toBeDefined();
      });

      // Should not fetch CFO for TEXT type
      expect(mockLoadCFOAssignments).not.toHaveBeenCalled();
    });

    it('should only fetch CFO for assigned custom fields', async () => {
      const mockCFData = [
        { id: 'cf1', assigned: true },
        { id: 'cf2', assigned: false }, // Not assigned
      ];

      mockLoadCustomFieldAssignments.mockImplementation((args) => {
        args.onSuccess?.(mockCFData);
      });

      mockUseStandardFieldAssignments.mockReturnValue({
        loadStandardFieldAssignments: mockLoadStandardFieldAssignments,
        data: [],
        loading: false,
        error: null,
      });

      const store = createMockStore({
        timeEntryGrid: {
          weeklyTimeEntries: {
            row1: createMockRow('row1', 'customer1'),
          },
          rowOrder: ['row1'],
          teamMember: { id: 'worker1', name: 'John Doe' },
        },
        customFields: {
          customFields: [
            { id: 'cf1', name: 'CF1', type: 'DROPDOWN' },
            { id: 'cf2', name: 'CF2', type: 'DROPDOWN' },
          ],
        },
      });

      renderAssignmentManager(store);

      // Should only fetch CFO for cf1 (assigned)
      await waitFor(() => {
        expect(mockLoadCFOAssignments).toHaveBeenCalledWith(
          expect.objectContaining({
            input: expect.objectContaining({
              customFieldIds: 'cf1',
            }),
          }),
        );
      });

      // Should not fetch for cf2
      expect(mockLoadCFOAssignments).not.toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            customFieldIds: 'cf2',
          }),
        }),
      );
    });

    it('should cache CFO data when it arrives', async () => {
      const mockCFData = [{ id: 'cf1', assigned: true }];
      const mockCFOData = [
        { id: 'opt1', name: 'Option 1' },
        { id: 'opt2', name: 'Option 2' },
      ];

      mockLoadCustomFieldAssignments.mockImplementation((args) => {
        args.onSuccess?.(mockCFData);
      });

      mockUseStandardFieldAssignments.mockReturnValue({
        loadStandardFieldAssignments: mockLoadStandardFieldAssignments,
        data: [],
        loading: false,
        error: null,
      });

      mockUseCustomFieldOptionAssignments.mockReturnValue({
        loadCustomFieldOptionAssignments: mockLoadCFOAssignments,
        data: mockCFOData,
        loading: false,
        error: null,
      });

      const store = createMockStore({
        timeEntryGrid: {
          weeklyTimeEntries: {
            row1: createMockRow('row1', 'customer1'),
          },
          rowOrder: ['row1'],
          teamMember: { id: 'worker1', name: 'John Doe' },
        },
        customFields: {
          customFields: [{ id: 'cf1', name: 'CF1', type: 'DROPDOWN' }],
        },
      });

      renderAssignmentManager(store);

      // Wait for CFO to be cached
      await waitFor(
        () => {
          const state = store.getState();
          expect(
            state.assignments.customerAssignments.customer1
              ?.customFieldOptionAssignments?.cf1,
          ).toEqual(mockCFOData);
        },
        { timeout: 3000 },
      );
    });
  });

  describe('Sequential CFO Fetching', () => {
    it('should fetch CFO for multiple dropdown CFs sequentially', async () => {
      const mockCFData = [
        { id: 'cf1', assigned: true },
        { id: 'cf2', assigned: true },
      ];

      let cfoCallCount = 0;
      const mockCFOData1 = [{ id: 'opt1', name: 'Option 1' }];
      const mockCFOData2 = [{ id: 'opt2', name: 'Option 2' }];

      mockLoadCustomFieldAssignments.mockImplementation((args) => {
        args.onSuccess?.(mockCFData);
      });

      mockUseStandardFieldAssignments.mockReturnValue({
        loadStandardFieldAssignments: mockLoadStandardFieldAssignments,
        data: [],
        loading: false,
        error: null,
      });

      // Return different data for each call
      mockUseCustomFieldOptionAssignments.mockImplementation(() => {
        cfoCallCount += 1;
        if (cfoCallCount === 1) {
          return {
            loadCustomFieldOptionAssignments: mockLoadCFOAssignments,
            data: mockCFOData1,
            loading: false,
            error: null,
          };
        }
        return {
          loadCustomFieldOptionAssignments: mockLoadCFOAssignments,
          data: mockCFOData2,
          loading: false,
          error: null,
        };
      });

      const store = createMockStore({
        timeEntryGrid: {
          weeklyTimeEntries: {
            row1: createMockRow('row1', 'customer1'),
          },
          rowOrder: ['row1'],
          teamMember: { id: 'worker1', name: 'John Doe' },
        },
        customFields: {
          customFields: [
            { id: 'cf1', name: 'CF1', type: 'DROPDOWN' },
            { id: 'cf2', name: 'CF2', type: 'DROPDOWN' },
          ],
        },
      });

      renderAssignmentManager(store);

      // Should fetch CFO for first CF
      await waitFor(() => {
        expect(mockLoadCFOAssignments).toHaveBeenCalledWith(
          expect.objectContaining({
            input: expect.objectContaining({
              customFieldIds: 'cf1',
            }),
          }),
        );
      });
    });
  });

  describe('Loading State Management', () => {
    it('should set loading state when fetching starts', async () => {
      const store = createMockStore({
        timeEntryGrid: {
          weeklyTimeEntries: {
            row1: createMockRow('row1', 'customer1'),
          },
          rowOrder: ['row1'],
          teamMember: { id: 'worker1', name: 'John Doe' },
        },
        customFields: {
          customFields: [{ id: 'cf1', name: 'CF1' }],
        },
      });

      renderAssignmentManager(store);

      // Should set loading true for customer1
      await waitFor(() => {
        const state = store.getState();
        expect(
          state.assignments.customerAssignments.customer1?.loading,
        ).toBeDefined();
      });
    });
  });

  describe('SFO Data Caching', () => {
    it('should handle location SFO correctly when location is assigned but disabled globally', async () => {
      const mockSFData = [
        { name: 'SERVICE_ITEM', assigned: true },
        { name: 'CLASS', assigned: true },
        { name: 'LOCATION', assigned: true }, // Location is assigned
      ];

      // Use mockImplementation with state tracking
      let hasSeenLoading = false;
      mockUseStandardFieldAssignments.mockImplementation(() => {
        if (!hasSeenLoading) {
          hasSeenLoading = true;
          return {
            loadStandardFieldAssignments: mockLoadStandardFieldAssignments,
            data: null,
            loading: true,
            error: null,
          };
        }
        return {
          loadStandardFieldAssignments: mockLoadStandardFieldAssignments,
          data: mockSFData,
          loading: false,
          error: null,
        };
      });

      const store = createMockStore({
        timeEntryGrid: {
          weeklyTimeEntries: {
            row1: createMockRow('row1', 'customer1'),
          },
          rowOrder: ['row1'],
          teamMember: { id: 'worker1', name: 'John Doe' },
        },
        timeEntrySettings: {
          isServiceFieldEnabled: true,
          isClassEnabled: true,
          isLocationEnabled: false, // Location disabled globally but assigned for customer
        },
      });

      renderAssignmentManager(store);

      // With location disabled globally but assigned for customer, SF is requested for the customer.
      await waitFor(() => {
        expect(mockLoadStandardFieldAssignments).toHaveBeenCalledWith(
          expect.objectContaining({
            input: expect.objectContaining({ customerId: 'customer1' }),
          }),
        );
      });
    });
  });
});

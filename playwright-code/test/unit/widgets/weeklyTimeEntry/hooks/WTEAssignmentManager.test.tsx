import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { WTEAssignmentManager } from '../../../../../src/js/widgets/weeklyTimeEntry/hooks/WTEAssignmentManager';
import assignmentReducer from '../../../../../src/js/widgets/weeklyTimeEntry/store/assignmentSlice';
import timeEntryGridReducer from '../../../../../src/js/widgets/weeklyTimeEntry/store/timeEntryGridSlice';

// Mock useWTEGlobalOptions
jest.mock(
  '../../../../../src/js/widgets/weeklyTimeEntry/hooks/useWTEGlobalOptions',
);

// Mock the nested WTECustomerAssignmentManager
jest.mock(
  '../../../../../src/js/widgets/weeklyTimeEntry/hooks/useWTEAssignmentManager',
  () => ({
    WTEAssignmentManager: () => null,
  }),
);

const mockUseWTEGlobalOptions =
  require('../../../../../src/js/widgets/weeklyTimeEntry/hooks/useWTEGlobalOptions').useWTEGlobalOptions;

const createMockStore = (initialState: any = {}) => {
  const defaultTimeEntryGridState = {
    weeklyTimeEntries: {},
    rowOrder: [],
    teamMember: null,
    isQuickFindEnabled: false,
    isQuickFindSettled: false,
    ...initialState.timeEntryGrid,
  };

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

  const defaultCustomFields = {
    customFields: [],
    ...initialState.customFields,
  };

  return configureStore({
    reducer: {
      assignments: assignmentReducer,
      timeEntryGrid: timeEntryGridReducer,
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

describe('WTEAssignmentManager (Wrapper Component)', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementation
    mockUseWTEGlobalOptions.mockReturnValue({ loading: false });
  });

  it('should render without errors', () => {
    const store = createMockStore();
    const { container } = render(
      <Provider store={store}>
        <WTEAssignmentManager />
      </Provider>,
    );
    expect(container).toBeTruthy();
  });

  it('should extract workerId from teamMember', () => {
    const store = createMockStore({
      timeEntryGrid: {
        teamMember: { id: 'worker123', name: 'John Doe' },
      },
    });

    render(
      <Provider store={store}>
        <WTEAssignmentManager />
      </Provider>,
    );

    // Verify useWTEGlobalOptions was called with correct workerId
    expect(mockUseWTEGlobalOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        workerId: 'worker123',
      }),
    );
  });

  it('should handle null teamMember', () => {
    const store = createMockStore({
      timeEntryGrid: {
        teamMember: null,
      },
    });

    render(
      <Provider store={store}>
        <WTEAssignmentManager />
      </Provider>,
    );

    // Should pass null workerId
    expect(mockUseWTEGlobalOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        workerId: null,
      }),
    );
  });

  it('should pass workerId and allCustomFields to useWTEGlobalOptions', () => {
    const store = createMockStore({
      timeEntryGrid: {
        teamMember: { id: 'worker1', name: 'John Doe' },
      },
      timeEntrySettings: {
        isServiceFieldEnabled: false,
        isClassEnabled: true,
        isLocationEnabled: false,
      },
    });

    render(
      <Provider store={store}>
        <WTEAssignmentManager />
      </Provider>,
    );

    expect(mockUseWTEGlobalOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        workerId: 'worker1',
        allCustomFields: [],
      }),
    );
  });

  it('should pass allCustomFields array', () => {
    const mockCustomFields = [
      { id: 'cf1', name: 'CF1', type: 'DROPDOWN' },
      { id: 'cf2', name: 'CF2', type: 'TEXT' },
    ];

    const store = createMockStore({
      timeEntryGrid: {
        teamMember: { id: 'worker1', name: 'John Doe' },
      },
      customFields: {
        customFields: mockCustomFields,
      },
    });

    render(
      <Provider store={store}>
        <WTEAssignmentManager />
      </Provider>,
    );

    // Should pass custom fields array
    expect(mockUseWTEGlobalOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        allCustomFields: mockCustomFields,
      }),
    );
  });

  it('should handle undefined customFields gracefully', () => {
    const store = createMockStore({
      timeEntryGrid: {
        teamMember: { id: 'worker1', name: 'John Doe' },
      },
      customFields: {
        customFields: undefined,
      },
    });

    render(
      <Provider store={store}>
        <WTEAssignmentManager />
      </Provider>,
    );

    // Should pass empty array when customFields is undefined
    expect(mockUseWTEGlobalOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        allCustomFields: [],
      }),
    );
  });

  describe('Selector Stability', () => {
    it('should extract stable boolean values from companySettings', () => {
      const store = createMockStore({
        timeEntryGrid: {
          teamMember: { id: 'worker1', name: 'John Doe' },
        },
        timeEntrySettings: {
          isServiceFieldEnabled: true,
          isClassEnabled: false,
          isLocationEnabled: true,
        },
      });

      const { rerender } = render(
        <Provider store={store}>
          <WTEAssignmentManager />
        </Provider>,
      );

      const firstCall = mockUseWTEGlobalOptions.mock.calls[0][0];

      // Clear mocks and rerender
      mockUseWTEGlobalOptions.mockClear();
      rerender(
        <Provider store={store}>
          <WTEAssignmentManager />
        </Provider>,
      );

      const secondCall = mockUseWTEGlobalOptions.mock.calls[0][0];

      // Boolean values should be the same (stable references)
      expect(firstCall.isServiceFieldEnabled).toBe(
        secondCall.isServiceFieldEnabled,
      );
      expect(firstCall.isClassEnabled).toBe(secondCall.isClassEnabled);
      expect(firstCall.isLocationEnabled).toBe(secondCall.isLocationEnabled);
    });
  });

  describe('Component Structure', () => {
    it('should render WTECustomerAssignmentManager child component', () => {
      const store = createMockStore({
        timeEntryGrid: {
          teamMember: { id: 'worker1', name: 'John Doe' },
        },
      });

      // The wrapper should render the child component (mocked to return null)
      const { container } = render(
        <Provider store={store}>
          <WTEAssignmentManager />
        </Provider>,
      );

      // Should successfully render (no errors thrown)
      expect(container).toBeTruthy();
    });
  });
});

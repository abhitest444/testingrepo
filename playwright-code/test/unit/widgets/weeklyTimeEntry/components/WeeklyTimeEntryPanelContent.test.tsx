import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { mockFormatMessage } from 'test/unit/testUtils';
import { WeeklyTimeEntryPanelContent } from '../../../../../src/js/widgets/weeklyTimeEntry/components/WeeklyTimeEntryPanelContent';
import timeEntryGridReducer from '../../../../../src/js/widgets/weeklyTimeEntry/store/timeEntryGridSlice';
import timeEntrySettingsReducer from '../../../../../src/js/widgets/weeklyTimeEntry/store/timeEntrySettingsSlice';

// Mock the store selectors
const mockUseAppSelector = jest.fn();
const mockUseAppDispatch = jest.fn(() => jest.fn());

// Create a mockable function for useWTERowFieldVisibility
const mockUseWTERowFieldVisibility = jest.fn();

jest.mock('../../../../../src/js/widgets/weeklyTimeEntry/store', () => ({
  useAppSelector: (selector: any) => mockUseAppSelector(selector),
  useAppDispatch: () => mockUseAppDispatch(),
}));

// Mock useWTERowFieldVisibility to avoid complex selector mocking
jest.mock(
  '../../../../../src/js/widgets/weeklyTimeEntry/hooks/useWTERowFieldVisibility',
  () => ({
    useWTERowFieldVisibility: (...args: any[]) =>
      mockUseWTERowFieldVisibility(...args),
  }),
);

// Mock submit-time context so tests remain deterministic.
jest.mock(
  'src/js/widgets/common/submitTimeDates/SubmitTimeDatesProvider',
  () => ({
    useSubmitTimeDatesContext: () => ({
      minSelectableDate: undefined,
      isSubmitTimeEnabled: false,
    }),
  }),
);

// Mock useIntl
jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: mockFormatMessage,
  }),
  useTracking: () =>
    jest.fn().mockImplementation((event) => {
      // Mock tracking event
    }),
  useSandbox: () => ({
    realmId: 'test-realm',
    offering: 'qbo',
  }),
}));

// Mock the TextArea component
jest.mock('@ids-ts/textarea', () => ({
  __esModule: true,
  default: ({ label, value, onChange, disabled, placeholder }: any) => (
    <div data-testid="notes-textarea">
      <label htmlFor="notes-input">{label}</label>
      <textarea
        id="notes-input"
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        data-testid="notes-input"
      />
    </div>
  ),
}));

// Mock the field components
jest.mock(
  '../../../../../src/js/widgets/weeklyTimeEntry/components/commons/WeeklyServiceField',
  () => ({
    WeeklyServiceField: ({ displayCell, disabled }: any) => (
      <div data-testid="weekly-service-field" aria-disabled={disabled}>
        Service Field
      </div>
    ),
  }),
);

jest.mock(
  '../../../../../src/js/widgets/weeklyTimeEntry/components/commons/WeeklyClassField',
  () => ({
    WeeklyClassField: ({ displayCell, disabled }: any) => (
      <div data-testid="weekly-class-field" aria-disabled={disabled}>
        Class Field
      </div>
    ),
  }),
);

jest.mock(
  '../../../../../src/js/widgets/weeklyTimeEntry/components/commons/WeeklyLocationField',
  () => ({
    WeeklyLocationField: ({ displayCell, disabled }: any) => (
      <div data-testid="weekly-location-field" aria-disabled={disabled}>
        Location Field
      </div>
    ),
  }),
);

jest.mock(
  '../../../../../src/js/widgets/weeklyTimeEntry/components/commons/WeeklyBillableField',
  () => ({
    WeeklyBillableField: ({ displayCell, disabled }: any) => (
      <div data-testid="weekly-billable-field" aria-disabled={disabled}>
        Billable Field
      </div>
    ),
  }),
);

jest.mock(
  '../../../../../src/js/widgets/weeklyTimeEntry/components/commons/WeeklyDateNavigation',
  () => ({
    WeeklyDateNavigation: ({ displayCell }: any) => (
      <div data-testid="weekly-date-navigation">Date Navigation</div>
    ),
  }),
);

// Mock WeeklyDateNavigation component
jest.mock(
  '../../../../../src/js/widgets/weeklyTimeEntry/components/commons/WeeklyDateNavigation',
  () => ({
    WeeklyDateNavigation: ({ displayCell }: any) => (
      <div data-testid="weekly-date-navigation">
        WeeklyDateNavigation
        {displayCell && (
          <span data-testid="display-cell">Has Display Cell</span>
        )}
      </div>
    ),
  }),
);

// Mock the common field components
jest.mock(
  '../../../../../src/js/widgets/weeklyTimeEntry/components/commons/WeeklyServiceField',
  () => ({
    WeeklyServiceField: ({ displayCell, disabled }: any) => (
      <div data-testid="weekly-service-field" aria-disabled={disabled}>
        WeeklyServiceField
        {displayCell && (
          <span data-testid="service-display-cell">Has Display Cell</span>
        )}
      </div>
    ),
  }),
);

jest.mock(
  '../../../../../src/js/widgets/weeklyTimeEntry/components/commons/WeeklyClassField',
  () => ({
    WeeklyClassField: ({ displayCell, disabled }: any) => (
      <div data-testid="weekly-class-field" aria-disabled={disabled}>
        WeeklyClassField
        {displayCell && (
          <span data-testid="class-display-cell">Has Display Cell</span>
        )}
      </div>
    ),
  }),
);

jest.mock(
  '../../../../../src/js/widgets/weeklyTimeEntry/components/commons/WeeklyLocationField',
  () => ({
    WeeklyLocationField: ({ displayCell, disabled }: any) => (
      <div data-testid="weekly-location-field" aria-disabled={disabled}>
        WeeklyLocationField
        {displayCell && (
          <span data-testid="location-display-cell">Has Display Cell</span>
        )}
      </div>
    ),
  }),
);

jest.mock(
  '../../../../../src/js/widgets/weeklyTimeEntry/components/commons/WeeklyBillableField',
  () => ({
    WeeklyBillableField: ({ displayCell, disabled }: any) => (
      <div data-testid="weekly-billable-field" aria-disabled={disabled}>
        WeeklyBillableField
        {displayCell && (
          <span data-testid="billable-display-cell">Has Display Cell</span>
        )}
      </div>
    ),
  }),
);

jest.mock(
  '../../../../../src/js/widgets/weeklyTimeEntry/components/commons/WeeklyBillableField',
  () => ({
    WeeklyBillableField: ({ displayCell, disabled }: any) => (
      <div data-testid="weekly-billable-field" aria-disabled={disabled}>
        WeeklyBillableField
        {displayCell && (
          <span data-testid="billable-display-cell">Has Display Cell</span>
        )}
      </div>
    ),
  }),
);

jest.mock(
  '../../../../../src/js/widgets/weeklyTimeEntry/components/commons/WeeklyDimensions',
  () => ({
    WeeklyDimensions: ({ displayCell, disabled }: any) => (
      <div data-testid="weekly-dimensions" aria-disabled={disabled}>
        WeeklyDimensions
        {displayCell && (
          <span data-testid="dimensions-display-cell">Has Display Cell</span>
        )}
      </div>
    ),
  }),
);

// Create a simple mock store
const createMockStore = () =>
  configureStore({
    reducer: {
      timeEntryGrid: timeEntryGridReducer,
      timeEntrySettings: timeEntrySettingsReducer,
    },
  });

// Helper function to create mock selector implementation with assignments support
const createMockSelectorImplementation = (
  customMocks: Record<string, any> = {},
) => {
  const defaultAssignments = {
    currentWorkerId: 'worker1',
    globalOptions: {
      standardFieldOptions: { service: [], class: [], location: [] },
      customFieldOptions: {},
      loading: false,
      error: null,
    },
    customerAssignments: {},
  };

  return (selector: any) => {
    const selectorName = selector.name;
    const selectorStr = selector.toString?.() || '';

    // Check custom mocks first
    if (customMocks[selectorName] !== undefined) {
      return customMocks[selectorName];
    }

    // Handle assignments state (always included)
    if (selectorStr.includes('assignments')) {
      return customMocks.assignments || defaultAssignments;
    }

    // Default returns for common selectors
    if (selectorName === 'selectSelectedCell') return null;
    if (selectorName === 'selectTimesheetRows') return [];
    if (selectorName === 'selectWeeklyTimeEntriesMap') return {};
    if (selectorName === 'selectRowOrder') return [];
    if (selectorName === 'selectCustomFields') return [];
    if (selectorName === 'selectHideTimeEntryFields')
      return {
        isProjectFieldEnabled: true,
        isClassFieldEnabled: true,
        isLocationFieldEnabled: true,
        isCostRateFieldEnabled: true,
      };
    if (
      selectorName === 'selectCompanySettings' ||
      selectorStr.includes('timeEntrySettings')
    )
      return {
        isServiceFieldEnabled: true,
        isBillingFieldEnabled: true,
        requireBillable: true,
        firstDayOfWeek: 0,
        isClassEnabled: true,
        isLocationEnabled: true,
        classRequired: true,
        locationRequired: true,
        serviceItemRequired: false,
        timeSheetEntryMakesNotesRequiredEnabled: false,
      };

    return undefined;
  };
};

describe('WeeklyTimeEntryPanelContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFormatMessage.mockImplementation(({ id }) => id);

    // Default implementation for useWTERowFieldVisibility
    mockUseWTERowFieldVisibility.mockImplementation(() => ({
      standardFieldsVisibility: {
        service: true,
        class: true,
        location: true,
        billable: true,
      },
      visibleCustomFieldIds: null,
      getServiceOptions: () => [],
      getClassOptions: () => [],
      getLocationOptions: () => [],
      getCustomFieldOptions: () => [],
      loading: false,
      shouldUseAssignments: false,
    }));

    // Create a complete mock state that actual selectors can work with
    const mockState: any = {
      timeEntryGrid: {
        weeklyTimeEntries: {},
        rowOrder: [],
        selected: null,
      },
      timeEntrySettings: {
        serviceItemRequired: false,
        isServiceFieldEnabled: true,
        isBillingFieldEnabled: true,
        requireBillable: true,
        firstDayOfWeek: 0,
        isClassEnabled: true,
        isLocationEnabled: true,
        classRequired: true,
        locationRequired: true,
        timeSheetEntryMakesNotesRequiredEnabled: false,
      },
      customFields: {
        customFields: [],
      },
      assignments: {
        currentWorkerId: 'worker1',
        globalOptions: {
          standardFieldOptions: { service: [], class: [], location: [] },
          customFieldOptions: {},
          loading: false,
          error: null,
        },
        customerAssignments: {},
      },
    };

    // Mock selector returns
    mockUseAppSelector.mockImplementation((selector: any) => {
      try {
        // Try to execute the selector with the mock state
        const result = selector(mockState);
        // Ensure we never return undefined for array selectors
        if (result === undefined && selector.name?.includes?.('Rows')) {
          return [];
        }
        return result;
      } catch (e) {
        // Fallback for selectors that don't work with our mock state
        const selectorName = selector.name;
        const selectorStr = selector.toString?.() || '';

        if (selectorName === 'selectSelectedCell') return null;
        if (
          selectorName === 'selectTimesheetRows' ||
          selectorStr.includes('selectTimesheetRows')
        )
          return [];
        if (selectorName === 'selectWeeklyTimeEntriesMap') return {};
        if (selectorName === 'selectRowOrder') return [];
        if (selectorName === 'selectCustomFields') return [];
        if (selectorName === 'selectHideTimeEntryFields')
          return {
            isProjectFieldEnabled: true,
            isClassFieldEnabled: true,
            isLocationFieldEnabled: true,
            isCostRateFieldEnabled: true,
          };
        if (selectorStr.includes('assignments')) {
          return mockState.assignments;
        }
        // Default return for unknown selectors - prevent undefined returns
        return null;
      }
    });
  });

  it('renders without crashing', () => {
    const mockStore = createMockStore();
    render(
      <Provider store={mockStore}>
        <WeeklyTimeEntryPanelContent />
      </Provider>,
    );
  });

  it('should use NLS for panel select cell message', () => {
    const mockStore = createMockStore();
    render(
      <Provider store={mockStore}>
        <WeeklyTimeEntryPanelContent />
      </Provider>,
    );

    expect(mockFormatMessage).toHaveBeenCalledWith({
      id: 'weekly.time.entry.panel.select.cell.message',
    });
  });

  it('should use NLS for notes label when cell is selected', () => {
    const mockStore = createMockStore();

    // Mock selected cell to show the form
    mockUseAppSelector.mockImplementation((selector: any) => {
      if (selector.name === 'selectSelectedCell')
        return { rowId: 'row-1', dayIdx: 0 };
      if (selector.name === 'selectTimesheetRows') return [];
      if (selector.name === 'selectWeeklyTimeEntriesMap')
        return {
          'row-1': {
            timeEntries: {
              0: {
                timeEntryId: '',
                date: '2024-01-01',
                hours: 0,
                notes: '',
                metaInfo: undefined,
                billableInfo: undefined,
              },
            },
          },
        };
      if (selector.name === 'selectRowOrder') return ['row-1'];
      if (selector.name === 'selectCustomFields') return [];
      if (selector.name === 'selectHideTimeEntryFields')
        return {
          isProjectFieldEnabled: true,
          isClassFieldEnabled: true,
          isLocationFieldEnabled: true,
          isCostRateFieldEnabled: true,
        };
      if (selector.name === 'selectCompanySettings')
        return {
          isServiceFieldEnabled: true,
          isBillingFieldEnabled: true,
          firstDayOfWeek: 0,
          isClassEnabled: true,
          isLocationEnabled: true,
          classRequired: false,
          locationRequired: false,
          serviceItemRequired: false,
          timeSheetEntryMakesNotesRequiredEnabled: false,
        };
      return undefined;
    });

    render(
      <Provider store={mockStore}>
        <WeeklyTimeEntryPanelContent />
      </Provider>,
    );

    expect(mockFormatMessage).toHaveBeenCalledWith({
      id: 'weekly.time.entry.panel.notes.label',
    });
  });

  it('should show no selection overlay when no cell is selected', () => {
    const mockStore = createMockStore();
    render(
      <Provider store={mockStore}>
        <WeeklyTimeEntryPanelContent />
      </Provider>,
    );

    expect(
      screen.getByText('weekly.time.entry.panel.select.cell.message'),
    ).toBeInTheDocument();
  });

  it('should hide no selection overlay when cell is selected', () => {
    const mockStore = createMockStore();

    // Mock selected cell
    mockUseAppSelector.mockImplementation((selector: any) => {
      if (selector.name === 'selectSelectedCell')
        return { rowId: 'row-1', dayIdx: 0 };
      if (selector.name === 'selectTimesheetRows') return [];
      if (selector.name === 'selectWeeklyTimeEntriesMap') return {};
      if (selector.name === 'selectRowOrder') return [];
      if (selector.name === 'selectCustomFields') return [];
      if (selector.name === 'selectHideTimeEntryFields')
        return {
          isProjectFieldEnabled: true,
          isClassFieldEnabled: true,
          isLocationFieldEnabled: true,
          isCostRateFieldEnabled: true,
        };
      if (selector.name === 'selectCompanySettings')
        return {
          isServiceFieldEnabled: true,
          isBillingFieldEnabled: true,
          firstDayOfWeek: 0,
          isClassEnabled: true,
          isLocationEnabled: true,
          classRequired: false,
          locationRequired: false,
          serviceItemRequired: false,
          timeSheetEntryMakesNotesRequiredEnabled: false,
        };
      // Handle assignments state
      if (selector.toString?.().includes('assignments')) {
        return {
          currentWorkerId: 'worker1',
          globalOptions: {
            standardFieldOptions: { service: [], class: [], location: [] },
            customFieldOptions: {},
            loading: false,
            error: null,
          },
          customerAssignments: {},
        };
      }
      return undefined;
    });

    render(
      <Provider store={mockStore}>
        <WeeklyTimeEntryPanelContent />
      </Provider>,
    );

    expect(
      screen.queryByText('weekly.time.entry.panel.select.cell.message'),
    ).not.toBeInTheDocument();
  });

  it('should render all field components when enabled', () => {
    const mockStore = createMockStore();

    // Mock the selectors to enable all fields and provide a selected cell
    mockUseAppSelector.mockImplementation((selector: any) => {
      if (selector.name === 'selectSelectedCell')
        return { rowId: 'row-1', dayIdx: 0 };
      if (selector.name === 'selectTimesheetRows') return [];
      if (selector.name === 'selectWeeklyTimeEntriesMap')
        return {
          'row-1': {
            timeEntries: {
              0: {
                timeEntryId: '',
                date: '2024-01-01',
                hours: 0,
                notes: '',
                metaInfo: undefined,
                billableInfo: undefined,
              },
            },
          },
        };
      if (selector.name === 'selectRowOrder') return ['row-1'];
      if (selector.name === 'selectCustomFields') return [];
      if (selector.name === 'selectHideTimeEntryFields')
        return {
          isProjectFieldEnabled: true,
          isClassFieldEnabled: true,
          isLocationFieldEnabled: true,
          isCostRateFieldEnabled: true,
        };
      if (selector.name === 'selectCompanySettings')
        return {
          isServiceFieldEnabled: true, // Enable service field
          serviceItemRequired: true, // Also required for service field to show
          isBillingFieldEnabled: true,
          requireBillable: true, // Required for billable field to show
          firstDayOfWeek: 0,
          isClassEnabled: true,
          isLocationEnabled: true,
          classRequired: false,
          locationRequired: false,
          timeSheetEntryMakesNotesRequiredEnabled: false,
        };
      // Handle assignments state
      if (selector.toString?.().includes('assignments')) {
        return {
          currentWorkerId: 'worker1',
          globalOptions: {
            standardFieldOptions: { service: [], class: [], location: [] },
            customFieldOptions: {},
            loading: false,
            error: null,
          },
          customerAssignments: {},
        };
      }
      return undefined;
    });

    render(
      <Provider store={mockStore}>
        <WeeklyTimeEntryPanelContent />
      </Provider>,
    );

    expect(screen.getByTestId('weekly-date-navigation')).toBeInTheDocument();
    expect(screen.getByTestId('weekly-service-field')).toBeInTheDocument();
    expect(screen.getByTestId('weekly-class-field')).toBeInTheDocument();
    expect(screen.getByTestId('weekly-location-field')).toBeInTheDocument();
    expect(screen.getByTestId('weekly-billable-field')).toBeInTheDocument();
    expect(screen.getByTestId('notes-textarea')).toBeInTheDocument();
  });

  it('should hide service field when disabled', () => {
    const mockStore = createMockStore();

    mockUseAppSelector.mockImplementation((selector: any) => {
      if (selector.name === 'selectSelectedCell')
        return { rowId: 'row-1', dayIdx: 0 };
      if (selector.name === 'selectTimesheetRows') return [];
      if (selector.name === 'selectWeeklyTimeEntriesMap')
        return {
          'row-1': {
            timeEntries: {
              0: {
                timeEntryId: '',
                date: '2024-01-01',
                hours: 0,
                notes: '',
                metaInfo: undefined,
                billableInfo: undefined,
              },
            },
          },
        };
      if (selector.name === 'selectRowOrder') return ['row-1'];
      if (selector.name === 'selectCustomFields') return [];
      if (selector.name === 'selectHideTimeEntryFields')
        return {
          isProjectFieldEnabled: true,
          isClassFieldEnabled: true,
          isLocationFieldEnabled: true,
          isCostRateFieldEnabled: true,
        };
      if (selector.name === 'selectCompanySettings')
        return {
          isServiceFieldEnabled: false, // Disabled - this controls service field visibility
          isBillingFieldEnabled: true,
          requireBillable: true,
          firstDayOfWeek: 0,
          isClassEnabled: true,
          isLocationEnabled: true,
          classRequired: true,
          locationRequired: true,
          serviceItemRequired: false,
          timeSheetEntryMakesNotesRequiredEnabled: false,
        };
      // Handle assignments state
      if (selector.toString?.().includes('assignments')) {
        return {
          currentWorkerId: 'worker1',
          globalOptions: {
            standardFieldOptions: { service: [], class: [], location: [] },
            customFieldOptions: {},
            loading: false,
            error: null,
          },
          customerAssignments: {},
        };
      }
      return undefined;
    });

    // Override useWTERowFieldVisibility to hide service field
    mockUseWTERowFieldVisibility.mockImplementationOnce(() => ({
      standardFieldsVisibility: {
        service: false, // Hidden because isServiceFieldEnabled is false
        class: true,
        location: true,
        billable: true,
      },
      visibleCustomFieldIds: null,
      getServiceOptions: () => [],
      getClassOptions: () => [],
      getLocationOptions: () => [],
      getCustomFieldOptions: () => [],
      loading: false,
      shouldUseAssignments: false,
    }));

    render(
      <Provider store={mockStore}>
        <WeeklyTimeEntryPanelContent />
      </Provider>,
    );

    // Service field should not be rendered when isServiceFieldEnabled is false
    expect(
      screen.queryByTestId('weekly-service-field'),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('weekly-class-field')).toBeInTheDocument();
    expect(screen.getByTestId('weekly-location-field')).toBeInTheDocument();
    expect(screen.getByTestId('weekly-billable-field')).toBeInTheDocument();
  });

  it('should hide class field when disabled', () => {
    const mockStore = createMockStore();

    mockUseAppSelector.mockImplementation((selector: any) => {
      if (selector.name === 'selectSelectedCell')
        return { rowId: 'row-1', dayIdx: 0 };
      if (selector.name === 'selectTimesheetRows') return [];
      if (selector.name === 'selectWeeklyTimeEntriesMap')
        return {
          'row-1': {
            timeEntries: {
              0: {
                timeEntryId: '',
                date: '2024-01-01',
                hours: 0,
                notes: '',
                metaInfo: undefined,
                billableInfo: undefined,
              },
            },
          },
        };
      if (selector.name === 'selectRowOrder') return ['row-1'];
      if (selector.name === 'selectCustomFields') return [];
      if (selector.name === 'selectHideTimeEntryFields')
        return {
          isProjectFieldEnabled: true,
          isClassFieldEnabled: true,
          isLocationFieldEnabled: true,
          isCostRateFieldEnabled: true,
        };
      if (selector.name === 'selectCompanySettings')
        return {
          isServiceFieldEnabled: true,
          isBillingFieldEnabled: true,
          requireBillable: true,
          firstDayOfWeek: 0,
          isClassEnabled: false, // Disable class field
          isLocationEnabled: true,
          classRequired: true, // Still true, but field won't show due to hideTimeEntryFields
          locationRequired: true,
          serviceItemRequired: false,
          timeSheetEntryMakesNotesRequiredEnabled: false,
        };
      // Handle assignments state
      if (selector.toString?.().includes('assignments')) {
        return {
          currentWorkerId: 'worker1',
          globalOptions: {
            standardFieldOptions: { service: [], class: [], location: [] },
            customFieldOptions: {},
            loading: false,
            error: null,
          },
          customerAssignments: {},
        };
      }
      return undefined;
    });

    // Override useWTERowFieldVisibility to hide class field
    mockUseWTERowFieldVisibility.mockImplementationOnce(() => ({
      standardFieldsVisibility: {
        service: true,
        class: false, // Hidden because isClassEnabled is false
        location: true,
        billable: true,
      },
      visibleCustomFieldIds: null,
      getServiceOptions: () => [],
      getClassOptions: () => [],
      getLocationOptions: () => [],
      getCustomFieldOptions: () => [],
      loading: false,
      shouldUseAssignments: false,
    }));

    render(
      <Provider store={mockStore}>
        <WeeklyTimeEntryPanelContent />
      </Provider>,
    );

    expect(screen.getByTestId('weekly-service-field')).toBeInTheDocument();
    expect(screen.queryByTestId('weekly-class-field')).not.toBeInTheDocument();
    expect(screen.getByTestId('weekly-location-field')).toBeInTheDocument();
    expect(screen.getByTestId('weekly-billable-field')).toBeInTheDocument();
  });

  it('should hide location field when disabled', () => {
    const mockStore = createMockStore();

    mockUseAppSelector.mockImplementation((selector: any) => {
      if (selector.name === 'selectSelectedCell')
        return { rowId: 'row-1', dayIdx: 0 };
      if (selector.name === 'selectTimesheetRows') return [];
      if (selector.name === 'selectWeeklyTimeEntriesMap')
        return {
          'row-1': {
            timeEntries: {
              0: {
                timeEntryId: '',
                date: '2024-01-01',
                hours: 0,
                notes: '',
                metaInfo: undefined,
                billableInfo: undefined,
              },
            },
          },
        };
      if (selector.name === 'selectRowOrder') return ['row-1'];
      if (selector.name === 'selectCustomFields') return [];
      if (selector.name === 'selectHideTimeEntryFields')
        return {
          isProjectFieldEnabled: true,
          isClassFieldEnabled: true,
          isLocationFieldEnabled: false, // Disabled - this controls location field visibility
          isCostRateFieldEnabled: true,
        };
      if (selector.name === 'selectCompanySettings')
        return {
          isServiceFieldEnabled: true,
          isBillingFieldEnabled: true,
          requireBillable: true,
          firstDayOfWeek: 0,
          isClassEnabled: true,
          isLocationEnabled: false, // Disable location field
          classRequired: true,
          locationRequired: true, // Still true, but field won't show due to company settings
          serviceItemRequired: false,
          timeSheetEntryMakesNotesRequiredEnabled: false,
        };
      // Handle assignments state
      if (selector.toString?.().includes('assignments')) {
        return {
          currentWorkerId: 'worker1',
          globalOptions: {
            standardFieldOptions: { service: [], class: [], location: [] },
            customFieldOptions: {},
            loading: false,
            error: null,
          },
          customerAssignments: {},
        };
      }
      return undefined;
    });

    // Override useWTERowFieldVisibility to hide location field
    mockUseWTERowFieldVisibility.mockImplementationOnce(() => ({
      standardFieldsVisibility: {
        service: true,
        class: true,
        location: false, // Hidden because isLocationEnabled is false
        billable: true,
      },
      visibleCustomFieldIds: null,
      getServiceOptions: () => [],
      getClassOptions: () => [],
      getLocationOptions: () => [],
      getCustomFieldOptions: () => [],
      loading: false,
      shouldUseAssignments: false,
    }));

    render(
      <Provider store={mockStore}>
        <WeeklyTimeEntryPanelContent />
      </Provider>,
    );

    expect(screen.getByTestId('weekly-service-field')).toBeInTheDocument();
    expect(screen.getByTestId('weekly-class-field')).toBeInTheDocument();
    expect(
      screen.queryByTestId('weekly-location-field'),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('weekly-billable-field')).toBeInTheDocument();
  });

  it('should hide billable field when disabled', () => {
    const mockStore = createMockStore();

    mockUseAppSelector.mockImplementation((selector: any) => {
      if (selector.name === 'selectSelectedCell')
        return { rowId: 'row-1', dayIdx: 0 };
      if (selector.name === 'selectTimesheetRows') return [];
      if (selector.name === 'selectWeeklyTimeEntriesMap')
        return {
          'row-1': {
            timeEntries: {
              0: {
                timeEntryId: '',
                date: '2024-01-01',
                hours: 0,
                notes: '',
                metaInfo: undefined,
                billableInfo: undefined,
              },
            },
          },
        };
      if (selector.name === 'selectRowOrder') return ['row-1'];
      if (selector.name === 'selectCustomFields') return [];
      if (selector.name === 'selectHideTimeEntryFields')
        return {
          isProjectFieldEnabled: true,
          isClassFieldEnabled: true,
          isLocationFieldEnabled: true,
          isCostRateFieldEnabled: true,
        };
      if (selector.name === 'selectCompanySettings')
        return {
          isServiceFieldEnabled: true,
          isBillingFieldEnabled: false, // Disable billable field
          requireBillable: true,
          firstDayOfWeek: 0,
          isClassEnabled: true,
          isLocationEnabled: true,
          classRequired: true,
          locationRequired: true,
          serviceItemRequired: false,
          timeSheetEntryMakesNotesRequiredEnabled: false,
        };
      // Handle assignments state
      if (selector.toString?.().includes('assignments')) {
        return {
          currentWorkerId: 'worker1',
          globalOptions: {
            standardFieldOptions: { service: [], class: [], location: [] },
            customFieldOptions: {},
            loading: false,
            error: null,
          },
          customerAssignments: {},
        };
      }
      return undefined;
    });

    // Override useWTERowFieldVisibility to hide billable field
    mockUseWTERowFieldVisibility.mockImplementationOnce(() => ({
      standardFieldsVisibility: {
        service: true,
        class: true,
        location: true,
        billable: false, // Hidden because isBillingFieldEnabled is false
      },
      visibleCustomFieldIds: null,
      getServiceOptions: () => [],
      getClassOptions: () => [],
      getLocationOptions: () => [],
      getCustomFieldOptions: () => [],
      loading: false,
      shouldUseAssignments: false,
    }));

    render(
      <Provider store={mockStore}>
        <WeeklyTimeEntryPanelContent />
      </Provider>,
    );

    expect(screen.getByTestId('weekly-service-field')).toBeInTheDocument();
    expect(screen.getByTestId('weekly-class-field')).toBeInTheDocument();
    expect(screen.getByTestId('weekly-location-field')).toBeInTheDocument();
    expect(
      screen.queryByTestId('weekly-billable-field'),
    ).not.toBeInTheDocument();
  });

  it('should pass displayCell to field components when selected cell exists', () => {
    const mockStore = createMockStore();

    mockUseAppSelector.mockImplementation((selector: any) => {
      if (selector.name === 'selectSelectedCell')
        return { rowId: 'row-1', dayIdx: 0 };
      if (selector.name === 'selectTimesheetRows') return [];
      if (selector.name === 'selectWeeklyTimeEntriesMap')
        return {
          'row-1': {
            timeEntries: [
              {
                notes: 'Test notes',
                service: 'Service 1',
                class: 'Class 1',
                location: 'Location 1',
                billable: true,
              },
            ],
          },
        };
      if (selector.name === 'selectRowOrder') return ['row-1'];
      if (selector.name === 'selectCustomFields') return [];
      if (selector.name === 'selectHideTimeEntryFields')
        return {
          isProjectFieldEnabled: true,
          isClassFieldEnabled: true,
          isLocationFieldEnabled: true,
          isCostRateFieldEnabled: true,
        };
      if (selector.name === 'selectCompanySettings')
        return {
          isServiceFieldEnabled: true,
          serviceItemRequired: true, // Enable service field
          isBillingFieldEnabled: true,
          requireBillable: true, // Enable billable field
          firstDayOfWeek: 0,
          isClassEnabled: true,
          isLocationEnabled: true,
          classRequired: true,
          locationRequired: true,
          timeSheetEntryMakesNotesRequiredEnabled: false,
        };
      // Handle assignments state
      if (selector.toString?.().includes('assignments')) {
        return {
          currentWorkerId: 'worker1',
          globalOptions: {
            standardFieldOptions: { service: [], class: [], location: [] },
            customFieldOptions: {},
            loading: false,
            error: null,
          },
          customerAssignments: {},
        };
      }
      return undefined;
    });

    render(
      <Provider store={mockStore}>
        <WeeklyTimeEntryPanelContent />
      </Provider>,
    );

    expect(screen.getByTestId('display-cell')).toBeInTheDocument();
    expect(screen.getByTestId('service-display-cell')).toBeInTheDocument();
    expect(screen.getByTestId('class-display-cell')).toBeInTheDocument();
    expect(screen.getByTestId('location-display-cell')).toBeInTheDocument();
    expect(screen.getByTestId('billable-display-cell')).toBeInTheDocument();
  });

  it('should show select cell message when no selection but rows exist', () => {
    const mockStore = createMockStore();
    const mockDisplayCell = { notes: 'Default notes' };

    mockUseAppSelector.mockImplementation((selector: any) => {
      if (selector.name === 'selectSelectedCell') return null; // No selection
      if (selector.name === 'selectTimesheetRows') return [];
      if (selector.name === 'selectWeeklyTimeEntriesMap')
        return {
          'row-1': {
            timeEntries: [mockDisplayCell],
          },
        };
      if (selector.name === 'selectRowOrder') return ['row-1']; // Has rows
      if (selector.name === 'selectCustomFields') return [];
      if (selector.name === 'selectHideTimeEntryFields')
        return {
          isProjectFieldEnabled: true,
          isClassFieldEnabled: true,
          isLocationFieldEnabled: true,
          isCostRateFieldEnabled: true,
        };
      // Handle assignments state
      if (selector.toString?.().includes('assignments')) {
        return {
          currentWorkerId: 'worker1',
          globalOptions: {
            standardFieldOptions: { service: [], class: [], location: [] },
            customFieldOptions: {},
            loading: false,
            error: null,
          },
          customerAssignments: {},
        };
      }
      return undefined;
    });

    render(
      <Provider store={mockStore}>
        <WeeklyTimeEntryPanelContent />
      </Provider>,
    );

    expect(
      screen.getByText('weekly.time.entry.panel.select.cell.message'),
    ).toBeInTheDocument();
  });

  it('should handle notes change when cell is selected', () => {
    const mockStore = createMockStore();
    const mockDispatch = jest.fn();
    mockUseAppDispatch.mockReturnValue(mockDispatch);

    mockUseAppSelector.mockImplementation((selector: any) => {
      if (selector.name === 'selectSelectedCell')
        return { rowId: 'row-1', dayIdx: 0 };
      if (selector.name === 'selectTimesheetRows') return [];
      if (selector.name === 'selectWeeklyTimeEntriesMap')
        return {
          'row-1': {
            timeEntries: [{ notes: 'Current notes' }],
          },
        };
      if (selector.name === 'selectRowOrder') return ['row-1'];
      if (selector.name === 'selectCustomFields') return [];
      if (selector.name === 'selectHideTimeEntryFields')
        return {
          isProjectFieldEnabled: true,
          isClassFieldEnabled: true,
          isLocationFieldEnabled: true,
          isCostRateFieldEnabled: true,
        };
      // Handle assignments state
      if (selector.toString?.().includes('assignments')) {
        return {
          currentWorkerId: 'worker1',
          globalOptions: {
            standardFieldOptions: { service: [], class: [], location: [] },
            customFieldOptions: {},
            loading: false,
            error: null,
          },
          customerAssignments: {},
        };
      }
      return undefined;
    });

    render(
      <Provider store={mockStore}>
        <WeeklyTimeEntryPanelContent />
      </Provider>,
    );

    const notesInput = screen.getByTestId('notes-input');
    fireEvent.change(notesInput, { target: { value: 'New notes' } });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'timeEntryGrid/updateCell',
      payload: {
        rowId: 'row-1',
        dayIdx: 0,
        value: { notes: 'New notes' },
      },
    });
  });

  it('should show select cell message when no cell is selected', () => {
    const mockStore = createMockStore();
    const mockDispatch = jest.fn();
    mockUseAppDispatch.mockReturnValue(mockDispatch);

    render(
      <Provider store={mockStore}>
        <WeeklyTimeEntryPanelContent />
      </Provider>,
    );

    // When no cell is selected, the component should show the select cell message
    expect(
      screen.getByText('weekly.time.entry.panel.select.cell.message'),
    ).toBeInTheDocument();
  });

  it('should display notes value from display cell', () => {
    const mockStore = createMockStore();
    const mockDisplayCell = { notes: 'Test notes from cell' };

    mockUseAppSelector.mockImplementation((selector: any) => {
      if (selector.name === 'selectSelectedCell')
        return { rowId: 'row-1', dayIdx: 0 };
      if (selector.name === 'selectTimesheetRows') return [];
      if (selector.name === 'selectWeeklyTimeEntriesMap')
        return {
          'row-1': {
            timeEntries: [mockDisplayCell],
          },
        };
      if (selector.name === 'selectRowOrder') return ['row-1'];
      if (selector.name === 'selectCustomFields') return [];
      if (selector.name === 'selectHideTimeEntryFields')
        return {
          isProjectFieldEnabled: true,
          isClassFieldEnabled: true,
          isLocationFieldEnabled: true,
          isCostRateFieldEnabled: true,
        };
      if (selector.name === 'selectCompanySettings')
        return {
          isServiceFieldEnabled: true,
          isBillingFieldEnabled: true,
          firstDayOfWeek: 0,
          isClassEnabled: true,
          isLocationEnabled: true,
          classRequired: false,
          locationRequired: false,
          serviceItemRequired: false,
          timeSheetEntryMakesNotesRequiredEnabled: false,
        };
      // Handle assignments state
      if (selector.toString?.().includes('assignments')) {
        return {
          currentWorkerId: 'worker1',
          globalOptions: {
            standardFieldOptions: { service: [], class: [], location: [] },
            customFieldOptions: {},
            loading: false,
            error: null,
          },
          customerAssignments: {},
        };
      }
      return undefined;
    });

    render(
      <Provider store={mockStore}>
        <WeeklyTimeEntryPanelContent />
      </Provider>,
    );

    const notesInput = screen.getByTestId('notes-input');
    expect(notesInput).toHaveValue('Test notes from cell');
  });

  it('should display empty notes when display cell has no notes', () => {
    const mockStore = createMockStore();
    const mockDisplayCell = { notes: undefined };

    mockUseAppSelector.mockImplementation((selector: any) => {
      if (selector.name === 'selectSelectedCell')
        return { rowId: 'row-1', dayIdx: 0 };
      if (selector.name === 'selectTimesheetRows') return [];
      if (selector.name === 'selectWeeklyTimeEntriesMap')
        return {
          'row-1': {
            timeEntries: [mockDisplayCell],
          },
        };
      if (selector.name === 'selectRowOrder') return ['row-1'];
      if (selector.name === 'selectCustomFields') return [];
      if (selector.name === 'selectHideTimeEntryFields')
        return {
          isProjectFieldEnabled: true,
          isClassFieldEnabled: true,
          isLocationFieldEnabled: true,
          isCostRateFieldEnabled: true,
        };
      if (selector.name === 'selectCompanySettings')
        return {
          isServiceFieldEnabled: true,
          isBillingFieldEnabled: true,
          firstDayOfWeek: 0,
          isClassEnabled: true,
          isLocationEnabled: true,
          classRequired: false,
          locationRequired: false,
          serviceItemRequired: false,
          timeSheetEntryMakesNotesRequiredEnabled: false,
        };
      // Handle assignments state
      if (selector.toString?.().includes('assignments')) {
        return {
          currentWorkerId: 'worker1',
          globalOptions: {
            standardFieldOptions: { service: [], class: [], location: [] },
            customFieldOptions: {},
            loading: false,
            error: null,
          },
          customerAssignments: {},
        };
      }
      return undefined;
    });

    render(
      <Provider store={mockStore}>
        <WeeklyTimeEntryPanelContent />
      </Provider>,
    );

    const notesInput = screen.getByTestId('notes-input');
    expect(notesInput).toHaveValue('');
  });

  it('should show select cell message when no cell is selected', () => {
    const mockStore = createMockStore();

    // Mock no selected cell
    mockUseAppSelector.mockImplementation((selector: any) => {
      if (selector.name === 'selectSelectedCell') return null; // No selection
      if (selector.name === 'selectTimesheetRows') return [];
      if (selector.name === 'selectWeeklyTimeEntriesMap')
        return {
          'row-1': {
            timeEntries: {
              0: {
                timeEntryId: '',
                date: '2024-01-01',
                hours: 0,
                notes: '',
                metaInfo: undefined,
                billableInfo: undefined,
              },
            },
          },
        };
      if (selector.name === 'selectRowOrder') return ['row-1'];
      if (selector.name === 'selectCustomFields') return [];
      if (selector.name === 'selectHideTimeEntryFields')
        return {
          isProjectFieldEnabled: true,
          isClassFieldEnabled: true,
          isLocationFieldEnabled: true,
          isCostRateFieldEnabled: true,
        };
      if (selector.name === 'selectCompanySettings')
        return {
          isServiceFieldEnabled: true,
          isBillingFieldEnabled: true,
          firstDayOfWeek: 0,
          isClassEnabled: true,
          isLocationEnabled: true,
          classRequired: false,
          locationRequired: false,
          serviceItemRequired: false,
          timeSheetEntryMakesNotesRequiredEnabled: false,
        };
      // Handle assignments state
      if (selector.toString?.().includes('assignments')) {
        return {
          currentWorkerId: 'worker1',
          globalOptions: {
            standardFieldOptions: { service: [], class: [], location: [] },
            customFieldOptions: {},
            loading: false,
            error: null,
          },
          customerAssignments: {},
        };
      }
      return undefined;
    });

    render(
      <Provider store={mockStore}>
        <WeeklyTimeEntryPanelContent />
      </Provider>,
    );

    // When no cell is selected, the component should show the select cell message
    expect(
      screen.getByText('weekly.time.entry.panel.select.cell.message'),
    ).toBeInTheDocument();
  });

  it('should enable notes textarea when cell is selected', () => {
    const mockStore = createMockStore();

    mockUseAppSelector.mockImplementation((selector: any) => {
      if (selector.name === 'selectSelectedCell')
        return { rowId: 'row-1', dayIdx: 0 };
      if (selector.name === 'selectTimesheetRows') return [];
      if (selector.name === 'selectWeeklyTimeEntriesMap')
        return {
          'row-1': {
            timeEntries: [{ notes: 'Test notes' }],
          },
        };
      if (selector.name === 'selectRowOrder') return ['row-1'];
      if (selector.name === 'selectCustomFields') return [];
      if (selector.name === 'selectHideTimeEntryFields')
        return {
          isProjectFieldEnabled: true,
          isClassFieldEnabled: true,
          isLocationFieldEnabled: true,
          isCostRateFieldEnabled: true,
        };
      // Handle assignments state
      if (selector.toString?.().includes('assignments')) {
        return {
          currentWorkerId: 'worker1',
          globalOptions: {
            standardFieldOptions: { service: [], class: [], location: [] },
            customFieldOptions: {},
            loading: false,
            error: null,
          },
          customerAssignments: {},
        };
      }
      return undefined;
    });

    render(
      <Provider store={mockStore}>
        <WeeklyTimeEntryPanelContent />
      </Provider>,
    );

    const notesInput = screen.getByTestId('notes-input');
    expect(notesInput).not.toBeDisabled();
  });

  it('should hide all fields except notes when time category type is break (PAID)', () => {
    const mockStore = createMockStore();

    mockUseAppSelector.mockImplementation((selector: any) => {
      if (selector.name === 'selectSelectedCell')
        return { rowId: 'row-1', dayIdx: 0 };
      if (selector.name === 'selectTimesheetRows') return [];
      if (selector.name === 'selectWeeklyTimeEntriesMap')
        return {
          'row-1': {
            timeAgainst: { type: 'PAID', id: 'break-1' }, // Break row
            timeEntries: {
              0: {
                timeEntryId: '',
                date: '2024-01-01',
                hours: 0,
                notes: '',
                metaInfo: undefined,
                billableInfo: undefined,
              },
            },
          },
        };
      if (selector.name === 'selectRowOrder') return ['row-1'];
      if (selector.name === 'selectCustomFields') return [];
      if (selector.name === 'selectHideTimeEntryFields')
        return {
          isProjectFieldEnabled: true,
          isClassFieldEnabled: true,
          isLocationFieldEnabled: true,
          isCostRateFieldEnabled: true,
        };
      if (selector.name === 'selectCompanySettings')
        return {
          isServiceFieldEnabled: true,
          isBillingFieldEnabled: true,
          firstDayOfWeek: 0,
          isClassEnabled: true,
          isLocationEnabled: true,
          classRequired: false,
          locationRequired: false,
          serviceItemRequired: false,
          timeSheetEntryMakesNotesRequiredEnabled: false,
        };
      // Handle assignments state
      if (selector.toString?.().includes('assignments')) {
        return {
          currentWorkerId: 'worker1',
          globalOptions: {
            standardFieldOptions: { service: [], class: [], location: [] },
            customFieldOptions: {},
            loading: false,
            error: null,
          },
          customerAssignments: {},
        };
      }
      return undefined;
    });

    render(
      <Provider store={mockStore}>
        <WeeklyTimeEntryPanelContent />
      </Provider>,
    );

    // Notes field should be visible
    expect(screen.getByTestId('notes-textarea')).toBeInTheDocument();

    // All other fields should be hidden for break rows
    expect(
      screen.queryByTestId('weekly-service-field'),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId('weekly-class-field')).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('weekly-location-field'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('weekly-billable-field'),
    ).not.toBeInTheDocument();
  });

  it('should hide all fields except notes when time category type is break (UNPAID)', () => {
    const mockStore = createMockStore();

    mockUseAppSelector.mockImplementation((selector: any) => {
      if (selector.name === 'selectSelectedCell')
        return { rowId: 'row-1', dayIdx: 0 };
      if (selector.name === 'selectTimesheetRows') return [];
      if (selector.name === 'selectWeeklyTimeEntriesMap')
        return {
          'row-1': {
            timeAgainst: { type: 'UNPAID', id: 'break-2' }, // Break row
            timeEntries: {
              0: {
                timeEntryId: '',
                date: '2024-01-01',
                hours: 0,
                notes: '',
                metaInfo: undefined,
                billableInfo: undefined,
              },
            },
          },
        };
      if (selector.name === 'selectRowOrder') return ['row-1'];
      if (selector.name === 'selectCustomFields') return [];
      if (selector.name === 'selectHideTimeEntryFields')
        return {
          isProjectFieldEnabled: true,
          isClassFieldEnabled: true,
          isLocationFieldEnabled: true,
          isCostRateFieldEnabled: true,
        };
      if (selector.name === 'selectCompanySettings')
        return {
          isServiceFieldEnabled: true,
          isBillingFieldEnabled: true,
          firstDayOfWeek: 0,
          isClassEnabled: true,
          isLocationEnabled: true,
          classRequired: false,
          locationRequired: false,
          serviceItemRequired: false,
          timeSheetEntryMakesNotesRequiredEnabled: false,
        };
      // Handle assignments state
      if (selector.toString?.().includes('assignments')) {
        return {
          currentWorkerId: 'worker1',
          globalOptions: {
            standardFieldOptions: { service: [], class: [], location: [] },
            customFieldOptions: {},
            loading: false,
            error: null,
          },
          customerAssignments: {},
        };
      }
      return undefined;
    });

    render(
      <Provider store={mockStore}>
        <WeeklyTimeEntryPanelContent />
      </Provider>,
    );

    // Notes field should be visible
    expect(screen.getByTestId('notes-textarea')).toBeInTheDocument();

    // All other fields should be hidden for break rows
    expect(
      screen.queryByTestId('weekly-service-field'),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId('weekly-class-field')).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('weekly-location-field'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('weekly-billable-field'),
    ).not.toBeInTheDocument();
  });

  it('should not show billable field when billing is disabled', () => {
    const mockStore = createMockStore();

    mockUseAppSelector.mockImplementation((selector: any) => {
      if (selector.name === 'selectSelectedCell')
        return { rowId: 'row-1', dayIdx: 0 };
      if (selector.name === 'selectTimesheetRows') return [];
      if (selector.name === 'selectWeeklyTimeEntriesMap')
        return {
          'row-1': {
            timeEntries: {
              0: {
                timeEntryId: 'entry-1',
                date: '2024-01-01',
                hours: 8,
                notes: 'Test notes',
                metaInfo: undefined,
                billableInfo: undefined,
              },
            },
          },
        };
      if (selector.name === 'selectRowOrder') return ['row-1'];
      if (selector.name === 'selectCustomFields') return [];
      if (selector.name === 'selectHideTimeEntryFields')
        return {
          isProjectFieldEnabled: true,
          isClassFieldEnabled: true,
          isLocationFieldEnabled: true,
          isCostRateFieldEnabled: true,
        };
      if (selector.name === 'selectCompanySettings')
        return {
          isServiceFieldEnabled: true,
          isBillingFieldEnabled: false, // Billing disabled
          requireBillable: true,
          firstDayOfWeek: 0,
          isClassEnabled: true,
          isLocationEnabled: true,
          classRequired: false,
          locationRequired: false,
          serviceItemRequired: false,
          timeSheetEntryMakesNotesRequiredEnabled: false,
        };
      // Handle assignments state
      if (selector.toString?.().includes('assignments')) {
        return {
          currentWorkerId: 'worker1',
          globalOptions: {
            standardFieldOptions: { service: [], class: [], location: [] },
            customFieldOptions: {},
            loading: false,
            error: null,
          },
          customerAssignments: {},
        };
      }
      return undefined;
    });

    // Override useWTERowFieldVisibility to hide billable field
    mockUseWTERowFieldVisibility.mockImplementationOnce(() => ({
      standardFieldsVisibility: {
        service: true,
        class: true,
        location: true,
        billable: false, // Hidden because isBillingFieldEnabled is false
      },
      visibleCustomFieldIds: null,
      getServiceOptions: () => [],
      getClassOptions: () => [],
      getLocationOptions: () => [],
      getCustomFieldOptions: () => [],
      loading: false,
      shouldUseAssignments: false,
    }));

    render(
      <Provider store={mockStore}>
        <WeeklyTimeEntryPanelContent />
      </Provider>,
    );

    expect(
      screen.queryByTestId('weekly-billable-field'),
    ).not.toBeInTheDocument();
  });

  describe('NLS Integration', () => {
    it('should use correct NLS keys for select cell message when no cell selected', () => {
      const mockStore = createMockStore();
      render(
        <Provider store={mockStore}>
          <WeeklyTimeEntryPanelContent />
        </Provider>,
      );

      expect(mockFormatMessage).toHaveBeenCalledWith({
        id: 'weekly.time.entry.panel.select.cell.message',
      });
    });

    it('should use correct NLS keys for notes label when cell is selected', () => {
      const mockStore = createMockStore();

      // Mock selected cell to show the form
      mockUseAppSelector.mockImplementation(
        createMockSelectorImplementation({
          selectSelectedCell: { rowId: 'row-1', dayIdx: 0 },
          selectTimesheetRows: [],
          selectWeeklyTimeEntriesMap: {
            'row-1': {
              timeEntries: {
                0: {
                  timeEntryId: '',
                  date: '2024-01-01',
                  hours: 0,
                  notes: '',
                  metaInfo: undefined,
                  billableInfo: undefined,
                },
              },
            },
          },
          selectRowOrder: ['row-1'],
          selectCustomFields: [],
          selectHideTimeEntryFields: {
            isProjectFieldEnabled: true,
            isClassFieldEnabled: true,
            isLocationFieldEnabled: true,
            isCostRateFieldEnabled: true,
          },
          selectCompanySettings: {
            isServiceFieldEnabled: true,
            isBillingFieldEnabled: true,
            firstDayOfWeek: 0,
            isClassEnabled: true,
            isLocationEnabled: true,
            classRequired: false,
            locationRequired: false,
            serviceItemRequired: false,
            timeSheetEntryMakesNotesRequiredEnabled: false,
          },
        }),
      );

      render(
        <Provider store={mockStore}>
          <WeeklyTimeEntryPanelContent />
        </Provider>,
      );

      expect(mockFormatMessage).toHaveBeenCalledWith({
        id: 'weekly.time.entry.panel.notes.label',
      });
    });
  });
});

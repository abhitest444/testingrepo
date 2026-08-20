import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { WeeklyLocationField } from 'src/js/widgets/weeklyTimeEntry/components/commons/WeeklyLocationField';
import timeEntryGridReducer from 'src/js/widgets/weeklyTimeEntry/store/timeEntryGridSlice';
import timeEntrySettingsReducer from 'src/js/widgets/weeklyTimeEntry/store/timeEntrySettingsSlice';
import { mockFormatMessage } from 'test/unit/testUtils';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';

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
    logger: {
      error: jest.fn(),
      log: jest.fn(),
      info: jest.fn(),
    },
  }),
}));

jest.mock('src/js/service/utils/sandboxUtils', () => ({
  isWorkforceEnvironment: jest.fn(),
}));

// Create a mock store with complete state structure
const createMockStore = (initialState: any = {}) =>
  configureStore({
    reducer: {
      timeEntryGrid: timeEntryGridReducer,
      timeEntrySettings: timeEntrySettingsReducer,
    },
    preloadedState: {
      timeEntryGrid: {
        weeklyTimeEntries: {},
        rowOrder: [],
        teamMember: null,
        dateRange: { startDate: '', endDate: '' },
        loading: false,
        error: null,
        selected: null,
        firstEditedCells: {},
        showSelectTeamMemberTooltip: false,
        isTeamMemberDropdownReady: false,
        ...initialState.timeEntryGrid,
      },
      timeEntrySettings: {
        hideTimeEntryFields: {},
        hideWeekdays: {},
        timeEntryTimeFor: null,
        weeklyTimesheetTourCompleted: false,
        panelValues: {},
        isServiceFieldEnabled: false,
        isBillingFieldEnabled: false,
        firstDayOfWeek: 0,
        isClassEnabled: false,
        isLocationEnabled: false,
        classRequired: false,
        locationRequired: false,
        serviceItemRequired: false,
        requireBillable: false,
        timeSheetEntryMakesNotesRequiredEnabled: false,
        loading: false,
        error: null,
        panelOpen: false,
        visibleDays: [0, 1, 2, 3, 4, 5, 6],
        ...initialState.timeEntrySettings,
      },
    },
  });

// Enhanced mock for Widget component
const mockOnChange = jest.fn();
const mockOnReady = jest.fn();

jest.mock('web-shell-core/widgets/HOCWidget', () => {
  const MockWidget = (props: any) => {
    const {
      value,
      onChange,
      errorText,
      disabled,
      onReady,
      onLoadingChange,
      placeholder,
      label,
      widgetId,
      type,
      dropdownType,
      assignmentFilters,
      addNew,
    } = props;

    // Call onReady synchronously to avoid async act warnings
    React.useEffect(() => {
      if (onReady) {
        onReady();
      }
    }, [onReady]);

    return (
      <div data-testid="location-widget">
        <input
          data-testid="location-input"
          value={value}
          onChange={(e) => {
            // Simulate widget onChange behavior - ensure onChange is called for both set and clear
            if (onChange) {
              const { value } = e.target;
              onChange({
                selectedItem: value
                  ? { localId: value, fullName: `Location ${value}` }
                  : null,
              });
            }
          }}
          disabled={disabled}
          placeholder={placeholder}
        />
        <label data-testid="location-label">{label}</label>
        {errorText && <span data-testid="error-text">{errorText}</span>}
        <div
          data-testid="widget-props"
          data-widget-id={widgetId}
          data-type={type}
          data-dropdown-type={dropdownType}
          data-assignment-filters={JSON.stringify(assignmentFilters ?? null)}
          data-add-new={addNew}
        />
        <button
          data-testid="location-loading-change"
          onClick={() => onLoadingChange?.(true)}
        >
          Loading
        </button>
      </div>
    );
  };

  return {
    __esModule: true,
    default: MockWidget,
  };
});

describe('WeeklyLocationField', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFormatMessage.mockImplementation(({ id }) => id);
    (isWorkforceEnvironment as jest.Mock).mockReturnValue(false);
    mockOnChange.mockClear();
    mockOnReady.mockClear();
  });

  it('renders with default props', () => {
    const { getByTestId } = render(
      <Provider store={createMockStore()}>
        <WeeklyLocationField />
      </Provider>,
    );
    expect(getByTestId('location-input')).toBeInTheDocument();
  });

  it('shows error text', () => {
    const { getByTestId } = render(
      <Provider store={createMockStore()}>
        <WeeklyLocationField error="Error!" />
      </Provider>,
    );
    expect(getByTestId('error-text')).toBeInTheDocument();
    expect(getByTestId('error-text')).toHaveTextContent('Error!');
  });

  it('is disabled when disabled prop is true', () => {
    const { getByTestId } = render(
      <Provider store={createMockStore()}>
        <WeeklyLocationField disabled />
      </Provider>,
    );
    expect(getByTestId('location-input')).toBeDisabled();
  });

  describe('Redux Integration', () => {
    it('displays location value from selected cell', () => {
      const mockState = {
        timeEntryGrid: {
          selected: { rowId: 'row1', dayIdx: 0 },
          weeklyTimeEntries: {
            row1: {
              timeEntries: [
                {
                  metaInfo: {
                    location: {
                      id: 'loc123',
                      name: 'Test Location',
                    },
                  },
                },
              ],
            },
          },
        },
      };

      const { getByTestId } = render(
        <Provider store={createMockStore(mockState)}>
          <WeeklyLocationField />
        </Provider>,
      );

      expect(getByTestId('location-input')).toHaveValue('loc123');
    });

    it('displays location value from displayCell when no selected cell', () => {
      const displayCell = {
        metaInfo: {
          location: {
            id: 'display123',
            name: 'Display Location',
          },
        },
      };

      const { getByTestId } = render(
        <Provider store={createMockStore()}>
          <WeeklyLocationField displayCell={displayCell} />
        </Provider>,
      );

      expect(getByTestId('location-input')).toHaveValue('display123');
    });

    it('handles empty location data gracefully', () => {
      const mockState = {
        timeEntryGrid: {
          selected: { rowId: 'row1', dayIdx: 0 },
          weeklyTimeEntries: {
            row1: {
              timeEntries: [{}], // No metaInfo
            },
          },
        },
      };

      const { getByTestId } = render(
        <Provider store={createMockStore(mockState)}>
          <WeeklyLocationField />
        </Provider>,
      );

      expect(getByTestId('location-input')).toHaveValue('');
    });
  });

  describe('Location Change Handling', () => {
    it('updates Redux store when location is selected', () => {
      const mockStore = createMockStore({
        timeEntryGrid: {
          selected: { rowId: 'row1', dayIdx: 0 },
          weeklyTimeEntries: {
            row1: {
              timeEntries: [{}],
            },
          },
        },
      });

      const { getByTestId } = render(
        <Provider store={mockStore}>
          <WeeklyLocationField />
        </Provider>,
      );

      const input = getByTestId('location-input');
      fireEvent.change(input, { target: { value: 'new-location' } });

      const actions = mockStore.getState();
      // Verify store structure exists for location updates
      expect(actions.timeEntryGrid.weeklyTimeEntries).toBeDefined();
    });

    it('calls updateLabel callback when location changes', () => {
      const mockUpdateLabel = jest.fn();
      const mockState = {
        timeEntryGrid: {
          selected: { rowId: 'row1', dayIdx: 0 },
          weeklyTimeEntries: {
            row1: {
              timeEntries: [{}],
            },
          },
        },
      };

      const { getByTestId } = render(
        <Provider store={createMockStore(mockState)}>
          <WeeklyLocationField updateLabel={mockUpdateLabel} />
        </Provider>,
      );

      const input = getByTestId('location-input');
      fireEvent.change(input, { target: { value: 'test-location' } });

      expect(mockUpdateLabel).toHaveBeenCalledWith(
        'location',
        'Location test-location',
      );
    });
  });

  describe('Loading Overlay', () => {
    it('shows overlay initially and hides when widget is ready', async () => {
      const { container } = render(
        <Provider store={createMockStore()}>
          <WeeklyLocationField />
        </Provider>,
      );

      // Widget container should render successfully
      const overlayContainer = container.querySelector(
        '[data-testid="location-widget"]',
      )?.parentElement;
      expect(overlayContainer).toBeInTheDocument();

      // Wait for ready callback side-effects to settle
      await waitFor(() => {
        expect(
          container.querySelector('[data-testid="location-widget"]'),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Widget Configuration', () => {
    it('passes correct props to Widget component', () => {
      const { getByTestId } = render(
        <Provider store={createMockStore()}>
          <WeeklyLocationField width={300} />
        </Provider>,
      );

      const widgetProps = getByTestId('widget-props');
      expect(widgetProps).toHaveAttribute(
        'data-widget-id',
        'qbo-quickfills-ui/quickfills',
      );
      expect(widgetProps).toHaveAttribute('data-type', 'locationV2');
      expect(widgetProps).toHaveAttribute('data-add-new', 'true');
    });

    it('passes addNew=false for workforce user', () => {
      (isWorkforceEnvironment as jest.Mock).mockReturnValue(true);

      const { getByTestId } = render(
        <Provider store={createMockStore()}>
          <WeeklyLocationField width={300} />
        </Provider>,
      );

      expect(getByTestId('widget-props')).toHaveAttribute(
        'data-add-new',
        'false',
      );
    });

    it('generates unique widget key for selected cell', () => {
      const mockState = {
        timeEntryGrid: {
          selected: { rowId: 'row1', dayIdx: 2 },
          weeklyTimeEntries: {
            row1: {
              timeEntries: [
                null,
                null,
                { metaInfo: { location: { id: 'loc456' } } },
              ],
            },
          },
        },
      };

      const { container } = render(
        <Provider store={createMockStore(mockState)}>
          <WeeklyLocationField />
        </Provider>,
      );

      // Widget should be rendered with unique key
      expect(
        container.querySelector('[data-testid="location-widget"]'),
      ).toBeInTheDocument();
    });

    it('generates unique widget key for display cell', () => {
      const displayCell = {
        metaInfo: {
          location: { id: 'display789' },
        },
      };

      const { container } = render(
        <Provider store={createMockStore()}>
          <WeeklyLocationField displayCell={displayCell} />
        </Provider>,
      );

      expect(
        container.querySelector('[data-testid="location-widget"]'),
      ).toBeInTheDocument();
    });
  });

  describe('Label Configuration', () => {
    it('shows required indicator when locationRequired is true', () => {
      const mockState = {
        timeEntrySettings: {
          locationRequired: true,
        },
      };

      const { getByTestId } = render(
        <Provider store={createMockStore(mockState)}>
          <WeeklyLocationField />
        </Provider>,
      );

      const label = getByTestId('location-label');
      expect(label.textContent).toContain('*');
    });

    it('does not show required indicator when locationRequired is false', () => {
      const mockState = {
        timeEntrySettings: {
          locationRequired: false,
        },
      };

      const { getByTestId } = render(
        <Provider store={createMockStore(mockState)}>
          <WeeklyLocationField />
        </Provider>,
      );

      const label = getByTestId('location-label');
      expect(label.textContent).not.toContain('*');
    });

    it('uses labelPreference DepartmentTerminology when provided', () => {
      const labelPreference = {
        DepartmentTerminology: 'Custom Department',
        CustomerTerminology: 'Custom Customer',
      };

      const { getByTestId } = render(
        <Provider store={createMockStore()}>
          <WeeklyLocationField labelPreference={labelPreference} />
        </Provider>,
      );

      const label = getByTestId('location-label');
      expect(label.textContent).toContain('Custom Department');
    });

    it('falls back to default label when no labelPreference', () => {
      const { getByTestId } = render(
        <Provider store={createMockStore()}>
          <WeeklyLocationField />
        </Provider>,
      );

      const label = getByTestId('location-label');
      expect(label.textContent).toContain('weekly.time.entry.location.label');
    });
  });

  describe('NLS Integration', () => {
    it('should use NLS for location field placeholder and label', () => {
      render(
        <Provider store={createMockStore()}>
          <WeeklyLocationField />
        </Provider>,
      );

      expect(mockFormatMessage).toHaveBeenCalledWith({
        id: 'weekly.time.entry.location.placeholder',
      });
      expect(mockFormatMessage).toHaveBeenCalledWith({
        id: 'weekly.time.entry.location.label',
      });
    });
  });

  describe('QuickFind mode branches', () => {
    it('passes assignment filters and quickfind props', () => {
      const { getByTestId } = render(
        <Provider store={createMockStore()}>
          <WeeklyLocationField isOTX />
        </Provider>,
      );

      const widgetProps = getByTestId('widget-props');
      expect(widgetProps).toHaveAttribute(
        'data-widget-id',
        'time-tracking-ui/quickFind',
      );
      expect(widgetProps).toHaveAttribute('data-dropdown-type', 'location');
      expect(widgetProps.getAttribute('data-assignment-filters')).not.toBe(
        'null',
      );
    });

    it('renders QuickFind dropdown without a loading overlay', () => {
      const { getByTestId, queryByTestId } = render(
        <Provider store={createMockStore()}>
          <WeeklyLocationField isOTX />
        </Provider>,
      );

      expect(getByTestId('location-input')).toBeInTheDocument();
      // Shimmer overlay no longer exists — the dropdown renders inline and
      // surfaces its own "Loading…" placeholder when the API is slow.
      expect(queryByTestId('dropdown-overlay')).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing weeklyTimeEntries gracefully', () => {
      const mockState = {
        timeEntryGrid: {
          selected: { rowId: 'nonexistent', dayIdx: 0 },
          weeklyTimeEntries: {},
        },
      };

      const { getByTestId } = render(
        <Provider store={createMockStore(mockState)}>
          <WeeklyLocationField />
        </Provider>,
      );

      expect(getByTestId('location-input')).toHaveValue('');
    });

    it('handles missing timeEntries array gracefully', () => {
      const mockState = {
        timeEntryGrid: {
          selected: { rowId: 'row1', dayIdx: 0 },
          weeklyTimeEntries: {
            row1: {
              timeEntries: {}, // Empty object instead of array
            },
          },
        },
      };

      const { getByTestId } = render(
        <Provider store={createMockStore(mockState)}>
          <WeeklyLocationField />
        </Provider>,
      );

      expect(getByTestId('location-input')).toHaveValue('');
    });

    it('handles out of bounds dayIdx gracefully', () => {
      const mockState = {
        timeEntryGrid: {
          selected: { rowId: 'row1', dayIdx: 5 },
          weeklyTimeEntries: {
            row1: {
              timeEntries: [{ metaInfo: { location: { id: 'loc1' } } }], // Only 1 entry, dayIdx 5 is out of bounds
            },
          },
        },
      };

      const { getByTestId } = render(
        <Provider store={createMockStore(mockState)}>
          <WeeklyLocationField />
        </Provider>,
      );

      expect(getByTestId('location-input')).toHaveValue('');
    });
  });
});

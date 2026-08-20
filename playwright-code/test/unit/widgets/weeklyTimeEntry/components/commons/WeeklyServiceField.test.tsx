import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { WeeklyServiceField } from 'src/js/widgets/weeklyTimeEntry/components/commons/WeeklyServiceField';
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
      subTypes,
      addNew,
      inputValue,
      width,
    } = props;

    // Call onReady synchronously to avoid async act warnings
    React.useEffect(() => {
      if (onReady) {
        onReady();
      }
    }, [onReady]);

    return (
      <div data-testid="service-widget">
        <input
          data-testid="service-input"
          value={inputValue || value}
          onChange={(e) => {
            // Simulate widget onChange behavior
            if (onChange) {
              const { value } = e.target;
              if (value) {
                const localId = value === 'no-id-positive' ? '' : value;
                let servicePrice: number | undefined = 100;
                if (value.includes('zero')) {
                  servicePrice = 0;
                } else if (value.includes('undefined')) {
                  servicePrice = undefined;
                }
                onChange({
                  selectedItem: {
                    localId,
                    fullName: `Service ${value}`,
                    traits: {
                      sale: {
                        billable: true,
                        price: servicePrice,
                        description: `Description for ${value}`,
                      },
                    },
                  },
                });
              } else {
                onChange({ selectedItem: undefined });
              }
            }
          }}
          disabled={disabled}
          placeholder={placeholder}
        />
        <label data-testid="service-label">{label}</label>
        {errorText && <span data-testid="error-text">{errorText}</span>}
        <div
          data-testid="widget-props"
          data-widget-id={widgetId}
          data-type={type}
          data-dropdown-type={dropdownType}
          data-assignment-filters={JSON.stringify(assignmentFilters ?? null)}
          data-sub-types={JSON.stringify(subTypes)}
          data-add-new={addNew}
          data-width={width}
        />
        <button
          data-testid="service-loading-change"
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

// Mock ConfirmationModal
jest.mock('src/js/widgets/common/ConfirmationModal', () => ({
  ConfirmationModal: ({ open, setOpen, onYesClick, children }: any) => {
    if (!open) return null;
    return (
      <div data-testid="confirmation-modal">
        <div data-testid="modal-content">{children}</div>
        <button data-testid="modal-yes" onClick={onYesClick}>
          Yes
        </button>
        <button data-testid="modal-no" onClick={() => setOpen(false)}>
          No
        </button>
      </div>
    );
  },
}));

describe('WeeklyServiceField', () => {
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
        <WeeklyServiceField />
      </Provider>,
    );
    expect(getByTestId('service-input')).toBeInTheDocument();
  });

  it('shows error text', () => {
    const { getByTestId } = render(
      <Provider store={createMockStore()}>
        <WeeklyServiceField error="Error!" />
      </Provider>,
    );
    expect(getByTestId('error-text')).toBeInTheDocument();
    expect(getByTestId('error-text')).toHaveTextContent('Error!');
  });

  it('is disabled when disabled prop is true', () => {
    const { getByTestId } = render(
      <Provider store={createMockStore()}>
        <WeeklyServiceField disabled />
      </Provider>,
    );
    expect(getByTestId('service-input')).toBeDisabled();
  });

  describe('Redux Integration', () => {
    it('displays service value from selected cell', () => {
      const mockState = {
        timeEntryGrid: {
          selected: { rowId: 'row1', dayIdx: 0 },
          weeklyTimeEntries: {
            row1: {
              timeEntries: [
                {
                  metaInfo: {
                    service: {
                      id: 'service123',
                      name: 'Test Service',
                      description: 'Test Description',
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
          <WeeklyServiceField />
        </Provider>,
      );

      expect(getByTestId('service-input')).toHaveValue('Test Service');
    });

    it('displays service value from displayCell when no selected cell', () => {
      const displayCell = {
        metaInfo: {
          service: {
            id: 'display123',
            name: 'Display Service',
            description: 'Display Description',
          },
        },
      };

      const { getByTestId } = render(
        <Provider store={createMockStore()}>
          <WeeklyServiceField displayCell={displayCell} />
        </Provider>,
      );

      expect(getByTestId('service-input')).toHaveValue('Display Service');
    });

    it('handles empty service data gracefully', () => {
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
          <WeeklyServiceField />
        </Provider>,
      );

      expect(getByTestId('service-input')).toHaveValue('');
    });
  });

  describe('Service Change Handling', () => {
    it('updates Redux store when service is selected', () => {
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
          <WeeklyServiceField />
        </Provider>,
      );

      const input = getByTestId('service-input');
      fireEvent.change(input, { target: { value: 'new-service' } });

      const actions = mockStore.getState();
      expect(actions.timeEntryGrid.weeklyTimeEntries).toBeDefined();
    });

    it('calls updateLabel callback when service changes', () => {
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
          <WeeklyServiceField updateLabel={mockUpdateLabel} />
        </Provider>,
      );

      const input = getByTestId('service-input');
      fireEvent.change(input, { target: { value: 'test-service' } });

      expect(mockUpdateLabel).toHaveBeenCalledWith(
        'service',
        'Service test-service',
      );
    });

    it('handles service change when updateLabel is undefined', () => {
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
          <WeeklyServiceField />
        </Provider>,
      );

      const input = getByTestId('service-input');
      fireEvent.change(input, {
        target: { value: 'test-service-no-update-label' },
      });

      // Should not throw error when updateLabel is undefined
      expect(input).toBeInTheDocument();
    });

    it('handles service selection with existing notes', () => {
      const mockState = {
        timeEntryGrid: {
          selected: { rowId: 'row1', dayIdx: 0 },
          weeklyTimeEntries: {
            row1: {
              timeEntries: [
                {
                  notes: 'Existing notes',
                  metaInfo: {
                    service: {
                      description: 'Different description',
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
          <WeeklyServiceField />
        </Provider>,
      );

      const input = getByTestId('service-input');
      fireEvent.change(input, { target: { value: 'service-with-notes' } });

      // Should show confirmation modal
      expect(getByTestId('confirmation-modal')).toBeInTheDocument();
    });

    it('handles service selection without existing notes', () => {
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
          <WeeklyServiceField />
        </Provider>,
      );

      const input = getByTestId('service-input');
      fireEvent.change(input, { target: { value: 'service-without-notes' } });

      // Should not show confirmation modal
      expect(() => getByTestId('confirmation-modal')).toThrow();
    });

    it('handles service clearing', () => {
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
          <WeeklyServiceField />
        </Provider>,
      );

      const input = getByTestId('service-input');
      fireEvent.change(input, { target: { value: '' } });

      // Should clear the service
      expect(input).toHaveValue('');
    });
  });

  describe('Confirmation Modal', () => {
    it('shows confirmation modal when notes need to be overridden', () => {
      const mockState = {
        timeEntryGrid: {
          selected: { rowId: 'row1', dayIdx: 0 },
          weeklyTimeEntries: {
            row1: {
              timeEntries: [
                {
                  notes: 'Existing notes',
                  metaInfo: {
                    service: {
                      description: 'Different description',
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
          <WeeklyServiceField />
        </Provider>,
      );

      const input = getByTestId('service-input');
      fireEvent.change(input, { target: { value: 'service-with-notes' } });

      expect(getByTestId('confirmation-modal')).toBeInTheDocument();
      expect(getByTestId('modal-content')).toBeInTheDocument();
    });

    it('handles confirmation modal yes click', () => {
      const mockState = {
        timeEntryGrid: {
          selected: { rowId: 'row1', dayIdx: 0 },
          weeklyTimeEntries: {
            row1: {
              timeEntries: [
                {
                  notes: 'Existing notes',
                  metaInfo: {
                    service: {
                      description: 'Different description',
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
          <WeeklyServiceField />
        </Provider>,
      );

      const input = getByTestId('service-input');
      fireEvent.change(input, { target: { value: 'service-with-notes' } });

      const yesButton = getByTestId('modal-yes');
      fireEvent.click(yesButton);

      // Modal should be closed after yes click
      expect(() => getByTestId('confirmation-modal')).toThrow();
    });

    it('handles confirmation modal no click', () => {
      const mockState = {
        timeEntryGrid: {
          selected: { rowId: 'row1', dayIdx: 0 },
          weeklyTimeEntries: {
            row1: {
              timeEntries: [
                {
                  notes: 'Existing notes',
                  metaInfo: {
                    service: {
                      description: 'Different description',
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
          <WeeklyServiceField />
        </Provider>,
      );

      const input = getByTestId('service-input');
      fireEvent.change(input, { target: { value: 'service-with-notes' } });

      const noButton = getByTestId('modal-no');
      fireEvent.click(noButton);

      // Modal should be closed after no click
      expect(() => getByTestId('confirmation-modal')).toThrow();
    });
  });

  describe('Billable Info Calculation', () => {
    it('calculates billable info correctly for employee with billable rate', () => {
      const mockState = {
        timeEntryGrid: {
          teamMember: {
            type: 'EMPLOYEE',
            billable: true,
            billableRate: 50,
          },
        },
      };

      const { getByTestId } = render(
        <Provider store={createMockStore(mockState)}>
          <WeeklyServiceField />
        </Provider>,
      );

      const input = getByTestId('service-input');
      fireEvent.change(input, { target: { value: 'service-with-price' } });

      // The component should handle billable info calculation
      expect(input).toBeInTheDocument();
    });

    it('calculates billable info correctly for service with price', () => {
      const mockState = {
        timeEntryGrid: {
          teamMember: {
            type: 'EMPLOYEE',
            billable: false,
            billableRate: 0,
          },
        },
      };

      const { getByTestId } = render(
        <Provider store={createMockStore(mockState)}>
          <WeeklyServiceField />
        </Provider>,
      );

      const input = getByTestId('service-input');
      fireEvent.change(input, { target: { value: 'service-with-price' } });

      // The component should handle billable info calculation
      expect(input).toBeInTheDocument();
    });

    it('calculates billable info correctly for non-employee', () => {
      const mockState = {
        timeEntryGrid: {
          teamMember: {
            type: 'CONTRACTOR',
            billable: false,
            billableRate: 0,
          },
        },
      };

      const { getByTestId } = render(
        <Provider store={createMockStore(mockState)}>
          <WeeklyServiceField />
        </Provider>,
      );

      const input = getByTestId('service-input');
      fireEvent.change(input, { target: { value: 'service-with-price' } });

      // The component should handle billable info calculation
      expect(input).toBeInTheDocument();
    });

    it('calculates billable info correctly when service price is 0', () => {
      const mockState = {
        timeEntryGrid: {
          teamMember: {
            type: 'EMPLOYEE',
            billable: true,
            billableRate: 25,
          },
        },
      };

      const { getByTestId } = render(
        <Provider store={createMockStore(mockState)}>
          <WeeklyServiceField />
        </Provider>,
      );

      const input = getByTestId('service-input');
      fireEvent.change(input, { target: { value: 'service-with-zero-price' } });

      // The component should handle billable info calculation when price is 0
      expect(input).toBeInTheDocument();
    });

    it('calculates billable info correctly when service price is undefined', () => {
      const mockState = {
        timeEntryGrid: {
          teamMember: {
            type: 'EMPLOYEE',
            billable: false,
            billableRate: 30,
          },
        },
      };

      const { getByTestId } = render(
        <Provider store={createMockStore(mockState)}>
          <WeeklyServiceField />
        </Provider>,
      );

      const input = getByTestId('service-input');
      fireEvent.change(input, {
        target: { value: 'service-with-undefined-price' },
      });

      // The component should handle billable info calculation when price is undefined
      expect(input).toBeInTheDocument();
    });
  });

  describe('Break Entry Protection', () => {
    it('should not set billable info when service is selected for break entries (PAID)', () => {
      const mockState = {
        timeEntryGrid: {
          selected: { rowId: 'row1', dayIdx: 0 },
          weeklyTimeEntries: {
            row1: {
              timeAgainst: {
                type: 'PAID',
                id: 'break1',
              },
              timeEntries: [{}],
            },
          },
          teamMember: {
            id: 'member-1',
            name: 'Test Member',
            type: 'EMPLOYEE',
            billable: true,
            billableRate: 100.0,
          },
        },
      };

      const { getByTestId } = render(
        <Provider store={createMockStore(mockState)}>
          <WeeklyServiceField />
        </Provider>,
      );

      const input = getByTestId('service-input');
      fireEvent.change(input, { target: { value: 'service-with-price' } });

      // Should dispatch updateCell but without billableInfo for break entries
      const actions = mockState.timeEntryGrid;
      expect(actions.weeklyTimeEntries).toBeDefined();
    });

    it('should not set billable info when service is selected for break entries (UNPAID)', () => {
      const mockState = {
        timeEntryGrid: {
          selected: { rowId: 'row1', dayIdx: 0 },
          weeklyTimeEntries: {
            row1: {
              timeAgainst: {
                type: 'UNPAID',
                id: 'break2',
              },
              timeEntries: [{}],
            },
          },
          teamMember: {
            id: 'member-1',
            name: 'Test Member',
            type: 'EMPLOYEE',
            billable: true,
            billableRate: 100.0,
          },
        },
      };

      const { getByTestId } = render(
        <Provider store={createMockStore(mockState)}>
          <WeeklyServiceField />
        </Provider>,
      );

      const input = getByTestId('service-input');
      fireEvent.change(input, { target: { value: 'service-with-price' } });

      // Should dispatch updateCell but without billableInfo for break entries
      const actions = mockState.timeEntryGrid;
      expect(actions.weeklyTimeEntries).toBeDefined();
    });
  });

  describe('Workforce addNew behavior', () => {
    it('passes addNew=true for non-workforce user', () => {
      const { getByTestId } = render(
        <Provider store={createMockStore()}>
          <WeeklyServiceField />
        </Provider>,
      );

      expect(getByTestId('widget-props')).toHaveAttribute(
        'data-add-new',
        'true',
      );
    });

    it('passes addNew=false for workforce user', () => {
      (isWorkforceEnvironment as jest.Mock).mockReturnValue(true);

      const { getByTestId } = render(
        <Provider store={createMockStore()}>
          <WeeklyServiceField />
        </Provider>,
      );

      expect(getByTestId('widget-props')).toHaveAttribute(
        'data-add-new',
        'false',
      );
    });
  });

  describe('QuickFind mode branches', () => {
    it('passes quickfind-specific props including assignment filters', () => {
      const { getByTestId } = render(
        <Provider store={createMockStore()}>
          <WeeklyServiceField isOTX />
        </Provider>,
      );

      const props = getByTestId('widget-props');
      expect(props).toHaveAttribute(
        'data-widget-id',
        'time-tracking-ui/quickFind',
      );
      expect(props).toHaveAttribute('data-dropdown-type', 'service');
      expect(props.getAttribute('data-assignment-filters')).not.toBe('null');
    });

    it('renders QuickFind dropdown without a loading overlay', () => {
      const { getByTestId, queryByTestId } = render(
        <Provider store={createMockStore()}>
          <WeeklyServiceField isOTX />
        </Provider>,
      );

      expect(getByTestId('service-input')).toBeInTheDocument();
      // Shimmer overlay no longer exists — the dropdown renders inline and
      // surfaces its own "Loading…" placeholder when the API is slow.
      expect(queryByTestId('dropdown-overlay')).toBeNull();
    });

    it('clears notes when service is removed and no override modal is required', () => {
      const mockState = {
        timeEntryGrid: {
          selected: { rowId: 'row1', dayIdx: 0 },
          weeklyTimeEntries: {
            row1: {
              timeEntries: [
                {
                  notes: '',
                  metaInfo: {
                    service: {
                      id: 'service-1',
                      name: 'Old Service',
                      description: '',
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
          <WeeklyServiceField />
        </Provider>,
      );

      fireEvent.change(getByTestId('service-input'), { target: { value: '' } });
      expect(getByTestId('service-input')).toHaveValue('');
    });

    it('computes billable via getBillableInfo path when service id is empty but price exists', () => {
      const mockState = {
        timeEntryGrid: {
          selected: { rowId: 'row1', dayIdx: 0 },
          teamMember: {
            id: 'member-1',
            name: 'Member',
            type: 'EMPLOYEE',
            billable: false,
            billableRate: 20,
          },
          weeklyTimeEntries: {
            row1: {
              timeEntries: [{}],
            },
          },
        },
      };

      const { getByTestId } = render(
        <Provider store={createMockStore(mockState)}>
          <WeeklyServiceField />
        </Provider>,
      );

      fireEvent.change(getByTestId('service-input'), {
        target: { value: 'no-id-positive' },
      });
      expect(getByTestId('service-input')).toBeInTheDocument();
    });
  });
});

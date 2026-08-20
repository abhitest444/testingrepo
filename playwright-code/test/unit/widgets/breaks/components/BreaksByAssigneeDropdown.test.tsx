import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BreaksByAssigneeDropdown } from 'src/js/widgets/breaks/components/BreaksByAssigneeDropdown';
import quickfillsSlice from 'src/js/widgets/breaks/store/quickfillsSlice';
import { BreakRule } from 'src/js/widgets/breaks/types';
import { Payroll_Break } from 'src/__generated__/oigql/graphql';

// Mock the hooks
jest.mock('src/js/widgets/breaks/hooks/useBreaksCrud');
jest.mock('src/js/widgets/breaks/hooks/useGetBreakById');
jest.mock('src/js/providers/LoggingConfigProvider');
jest.mock('src/js/widgets/timeClock/hooks/useTimeClockTrackingPoints');
jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({
      id,
      defaultValue,
    }: {
      id: string;
      defaultValue?: string;
    }) => {
      const messageMap: Record<string, string> = {
        'breaks.dropdown.loading': 'Loading...',
        'breaks.dropdown.error': 'Error loading breaks',
        'breaks.dropdown.no-breaks': 'No breaks available',
        'breaks.dropdown.label': 'Select Break',
        'breaks.dropdown.placeholder': 'Choose a break...',
        'breaks.create.type.paid': 'Paid',
        'breaks.create.type.unpaid': 'Unpaid',
      };
      return messageMap[id] || defaultValue || id;
    },
  }),
  useTracking: () => jest.fn(),
}));

const mockUseBreaksCrud = {
  getBreaksByAssigneeId: jest.fn(),
};

const mockUseGetBreakById = {
  getBreakByIdPolicy: jest.fn(),
};

jest.mocked(require('src/js/widgets/breaks/hooks/useBreaksCrud')).default =
  () => mockUseBreaksCrud;

jest.mocked(require('src/js/widgets/breaks/hooks/useGetBreakById')).default =
  () => mockUseGetBreakById;

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  logException: jest.fn(),
};

jest.mocked(
  require('src/js/providers/LoggingConfigProvider'),
).useLoggingConfig = () => mockLogger;

// Mock useTimeClockTrackingPoints to return WFS tracking points
jest.mocked(
  require('src/js/widgets/timeClock/hooks/useTimeClockTrackingPoints'),
).useTimeClockTrackingPoints = () =>
  require('src/js/common/useClickTracking').getTimeClockTrackingPoints({
    isWorkforce: true,
  });

// Mock the DropdownTypeahead component
jest.mock('@ids-ts/dropdown-typeahead', () => ({
  __esModule: true,
  default: ({
    value,
    inputValue,
    onChange,
    onSearch,
    dataSource,
    label,
    placeholder,
    errorText,
    disabled,
    'aria-label': ariaLabel,
    width,
    renderItem,
  }: any) => (
    <div data-testid="dropdown-typeahead">
      <label htmlFor="dropdown-input">{label}</label>
      <input
        id="dropdown-input"
        data-testid="dropdown-input"
        value={inputValue || ''}
        onChange={(e) => onSearch && onSearch(e)}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
      />
      <select
        data-testid="dropdown-select"
        value={value || ''}
        onChange={(e) => onChange && onChange(e)}
        disabled={disabled}
      >
        <option value="">Select...</option>
        {dataSource.map((item: any) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
      {errorText && <div data-testid="error-text">{errorText}</div>}
    </div>
  ),
  MenuItem: ({ children, value }: any) => (
    <option value={value}>{children}</option>
  ),
}));

const createTestStore = (initialState = {}) =>
  configureStore({
    reducer: {
      quickfills: quickfillsSlice,
    },
    preloadedState: {
      quickfills: {
        breaksByAssignee: {},
        ...initialState,
      },
    },
  });

const renderWithProviders = (
  component: React.ReactElement,
  initialState = {},
) => {
  const store = createTestStore(initialState);
  return render(<Provider store={store}>{component}</Provider>);
};

const mockBreakRules: BreakRule[] = [
  {
    id: 'break-1',
    breakName: 'Lunch Break',
    breakType: Payroll_Break.Paid,
    isActive: true,
    isDefaultPolicy: false,
    allowAuto: true,
    allowManual: true,
    breakDuration: 30,
    durationUnit: 'Minutes' as any,
    activeBreakAssignmentCount: 0,
    isDeleted: false,
    noSetDuration: false,
  },
  {
    id: 'break-2',
    breakName: 'Coffee Break',
    breakType: Payroll_Break.Unpaid,
    isActive: true,
    isDefaultPolicy: false,
    allowAuto: false,
    allowManual: true,
    breakDuration: 15,
    durationUnit: 'Minutes' as any,
    activeBreakAssignmentCount: 0,
    isDeleted: false,
    noSetDuration: false,
  },
];

describe('BreaksByAssigneeDropdown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseBreaksCrud.getBreaksByAssigneeId.mockResolvedValue(undefined);
    mockUseGetBreakById.getBreakByIdPolicy.mockResolvedValue(undefined);
  });

  it('renders the dropdown with default props', () => {
    renderWithProviders(
      <BreaksByAssigneeDropdown
        assigneeId="assignee-1"
        value=""
        onChange={jest.fn()}
      />,
    );

    expect(screen.getByText('Select Break')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Choose a break...'),
    ).toBeInTheDocument();
  });

  it('renders with custom label and placeholder', () => {
    renderWithProviders(
      <BreaksByAssigneeDropdown
        assigneeId="assignee-1"
        value=""
        onChange={jest.fn()}
        label="Custom Label"
        placeholder="Custom Placeholder"
      />,
    );

    expect(screen.getByText('Custom Label')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Custom Placeholder'),
    ).toBeInTheDocument();
  });

  it('fetches breaks when component mounts', () => {
    renderWithProviders(
      <BreaksByAssigneeDropdown
        assigneeId="assignee-1"
        value=""
        onChange={jest.fn()}
      />,
    );

    expect(mockUseBreaksCrud.getBreaksByAssigneeId).toHaveBeenCalledWith(
      'assignee-1',
      true,
    );
  });

  it('fetches breaks with showActiveOnly=false when specified', () => {
    renderWithProviders(
      <BreaksByAssigneeDropdown
        assigneeId="assignee-1"
        value=""
        onChange={jest.fn()}
        showActiveOnly={false}
      />,
    );

    expect(mockUseBreaksCrud.getBreaksByAssigneeId).toHaveBeenCalledWith(
      'assignee-1',
      false,
    );
  });

  it('shows loading state when breaks are loading', () => {
    const initialState = {
      breaksByAssignee: {
        'assignee-1': {
          breaks: [],
          loading: true,
          error: null,
        },
      },
    };

    renderWithProviders(
      <BreaksByAssigneeDropdown
        assigneeId="assignee-1"
        value=""
        onChange={jest.fn()}
      />,
      initialState,
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows error state when breaks fail to load', () => {
    const initialState = {
      breaksByAssignee: {
        'assignee-1': {
          breaks: [],
          loading: false,
          errorCode: 'GENERAL_ERROR',
        },
      },
    };

    renderWithProviders(
      <BreaksByAssigneeDropdown
        assigneeId="assignee-1"
        value=""
        onChange={jest.fn()}
      />,
      initialState,
    );

    expect(screen.getByTestId('error-text')).toHaveTextContent(
      'breaks.api.error.GENERAL_ERROR',
    );
  });

  it('shows no breaks message when no breaks are available', () => {
    const initialState = {
      breaksByAssignee: {
        'assignee-1': {
          breaks: [],
          loading: false,
          errorCode: null,
        },
      },
    };

    renderWithProviders(
      <BreaksByAssigneeDropdown
        assigneeId="assignee-1"
        value=""
        onChange={jest.fn()}
      />,
      initialState,
    );

    expect(screen.getByText('No breaks available')).toBeInTheDocument();
  });

  it('displays breaks correctly when loaded', () => {
    const initialState = {
      breaksByAssignee: {
        'assignee-1': {
          breaks: mockBreakRules,
          loading: false,
          errorCode: null,
        },
      },
    };

    renderWithProviders(
      <BreaksByAssigneeDropdown
        assigneeId="assignee-1"
        value=""
        onChange={jest.fn()}
      />,
      initialState,
    );

    expect(screen.getByText('Paid: Lunch Break')).toBeInTheDocument();
    expect(screen.getByText('Unpaid: Coffee Break')).toBeInTheDocument();
  });

  it('handles value change correctly', () => {
    const onChange = jest.fn();
    const initialState = {
      breaksByAssignee: {
        'assignee-1': {
          breaks: mockBreakRules,
          loading: false,
          errorCode: null,
        },
      },
    };

    renderWithProviders(
      <BreaksByAssigneeDropdown
        assigneeId="assignee-1"
        value=""
        onChange={onChange}
      />,
      initialState,
    );

    const select = screen.getByTestId('dropdown-select');
    fireEvent.change(select, { target: { value: 'break-1' } });

    expect(onChange).toHaveBeenCalledWith('break-1');
  });

  it('displays selected value correctly', () => {
    const initialState = {
      breaksByAssignee: {
        'assignee-1': {
          breaks: mockBreakRules,
          loading: false,
          errorCode: null,
        },
      },
    };

    renderWithProviders(
      <BreaksByAssigneeDropdown
        assigneeId="assignee-1"
        value="break-1"
        onChange={jest.fn()}
      />,
      initialState,
    );

    expect(screen.getByTestId('dropdown-select')).toHaveValue('break-1');
  });

  it('handles search input correctly', () => {
    const initialState = {
      breaksByAssignee: {
        'assignee-1': {
          breaks: mockBreakRules,
          loading: false,
          errorCode: null,
        },
      },
    };

    renderWithProviders(
      <BreaksByAssigneeDropdown
        assigneeId="assignee-1"
        value=""
        onChange={jest.fn()}
      />,
      initialState,
    );

    const input = screen.getByTestId('dropdown-input');
    fireEvent.change(input, { target: { value: 'Lunch' } });

    expect(input).toHaveValue('Lunch');
  });

  it('filters breaks based on search input', () => {
    const initialState = {
      breaksByAssignee: {
        'assignee-1': {
          breaks: mockBreakRules,
          filteredBreaks: [mockBreakRules[0]],
          loading: false,
          errorCode: null,
        },
      },
    };

    renderWithProviders(
      <BreaksByAssigneeDropdown
        assigneeId="assignee-1"
        value=""
        onChange={jest.fn()}
      />,
      initialState,
    );

    // Should only show the filtered break
    expect(screen.getByText('Paid: Lunch Break')).toBeInTheDocument();
    expect(screen.queryByText('Unpaid: Coffee Break')).not.toBeInTheDocument();
  });

  it('calls onBreaksLoaded callback when breaks are loaded', () => {
    const onBreaksLoaded = jest.fn();
    const initialState = {
      breaksByAssignee: {
        'assignee-1': {
          breaks: mockBreakRules,
          loading: false,
          errorCode: null,
        },
      },
    };

    renderWithProviders(
      <BreaksByAssigneeDropdown
        assigneeId="assignee-1"
        value=""
        onChange={jest.fn()}
        onBreaksLoaded={onBreaksLoaded}
      />,
      initialState,
    );

    expect(onBreaksLoaded).toHaveBeenCalledWith(mockBreakRules);
  });

  it('disables dropdown when disabled prop is true', () => {
    const initialState = {
      breaksByAssignee: {
        'assignee-1': {
          breaks: mockBreakRules,
          loading: false,
          errorCode: null,
        },
      },
    };

    renderWithProviders(
      <BreaksByAssigneeDropdown
        assigneeId="assignee-1"
        value=""
        onChange={jest.fn()}
        disabled
      />,
      initialState,
    );

    const input = screen.getByTestId('dropdown-input');
    const select = screen.getByTestId('dropdown-select');

    expect(input).toBeDisabled();
    expect(select).toBeDisabled();
  });

  it('disables dropdown when loading', () => {
    const initialState = {
      breaksByAssignee: {
        'assignee-1': {
          breaks: [],
          loading: true,
          errorCode: null,
        },
      },
    };

    renderWithProviders(
      <BreaksByAssigneeDropdown
        assigneeId="assignee-1"
        value=""
        onChange={jest.fn()}
      />,
      initialState,
    );

    const input = screen.getByTestId('dropdown-input');
    const select = screen.getByTestId('dropdown-select');

    expect(input).toBeDisabled();
    expect(select).toBeDisabled();
  });

  it('displays error text when provided', () => {
    renderWithProviders(
      <BreaksByAssigneeDropdown
        assigneeId="assignee-1"
        value=""
        onChange={jest.fn()}
        errorText="This field is required"
      />,
    );

    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('displays API error when available', () => {
    const initialState = {
      breaksByAssignee: {
        'assignee-1': {
          breaks: [],
          loading: false,
          errorCode: 'GENERAL_ERROR',
        },
      },
    };

    renderWithProviders(
      <BreaksByAssigneeDropdown
        assigneeId="assignee-1"
        value=""
        onChange={jest.fn()}
      />,
      initialState,
    );

    expect(screen.getByTestId('error-text')).toHaveTextContent(
      'breaks.api.error.GENERAL_ERROR',
    );
  });

  it('handles width prop correctly', () => {
    renderWithProviders(
      <BreaksByAssigneeDropdown
        assigneeId="assignee-1"
        value=""
        onChange={jest.fn()}
        width={300}
      />,
    );

    // The width prop should be passed to the dropdown component
    expect(screen.getByTestId('dropdown-typeahead')).toBeInTheDocument();
  });

  // Tests for new useGetBreakById integration
  describe('useGetBreakById integration', () => {
    it('calls getBreakByIdPolicy when value is provided', () => {
      renderWithProviders(
        <BreaksByAssigneeDropdown
          assigneeId="assignee-1"
          value="break-1"
          onChange={jest.fn()}
        />,
      );

      expect(mockUseGetBreakById.getBreakByIdPolicy).toHaveBeenCalledWith(
        'break-1',
        false,
      );
    });

    it('does not call getBreakByIdPolicy when value is empty', () => {
      renderWithProviders(
        <BreaksByAssigneeDropdown
          assigneeId="assignee-1"
          value=""
          onChange={jest.fn()}
        />,
      );

      expect(mockUseGetBreakById.getBreakByIdPolicy).not.toHaveBeenCalled();
    });

    it('calls both getBreaksByAssigneeId and getBreakByIdPolicy in parallel', async () => {
      const assigneeBreaksPromise = Promise.resolve();
      const breakByIdPromise = Promise.resolve({
        id: 'break-3',
        breakName: 'Additional Break',
        breakType: Payroll_Break.Paid,
      });

      mockUseBreaksCrud.getBreaksByAssigneeId.mockReturnValue(
        assigneeBreaksPromise,
      );
      mockUseGetBreakById.getBreakByIdPolicy.mockReturnValue(breakByIdPromise);

      renderWithProviders(
        <BreaksByAssigneeDropdown
          assigneeId="assignee-1"
          value="break-3"
          onChange={jest.fn()}
        />,
      );

      await waitFor(() => {
        expect(mockUseBreaksCrud.getBreaksByAssigneeId).toHaveBeenCalledWith(
          'assignee-1',
          true,
        );
        expect(mockUseGetBreakById.getBreakByIdPolicy).toHaveBeenCalledWith(
          'break-3',
          false,
        );
      });
    });
  });

  describe('Combined breaks functionality', () => {
    const additionalBreak: BreakRule = {
      id: 'break-3',
      breakName: 'Additional Break',
      breakType: Payroll_Break.Paid,
      isActive: true,
      isDefaultPolicy: false,
      allowAuto: true,
      allowManual: true,
      breakDuration: 60,
      durationUnit: 'Minutes' as any,
      activeBreakAssignmentCount: 0,
      isDeleted: false,
      noSetDuration: false,
    };

    it('combines breaks from assignee query with additional break from getBreakById', async () => {
      const initialState = {
        breaksByAssignee: {
          'assignee-1': {
            breaks: mockBreakRules,
            loading: false,
            errorCode: null,
          },
        },
      };

      mockUseGetBreakById.getBreakByIdPolicy.mockResolvedValue(additionalBreak);

      renderWithProviders(
        <BreaksByAssigneeDropdown
          assigneeId="assignee-1"
          value="break-3"
          onChange={jest.fn()}
        />,
        initialState,
      );

      await waitFor(() => {
        // Should display both original breaks and the additional break
        expect(screen.getByText('Paid: Lunch Break')).toBeInTheDocument();
        expect(screen.getByText('Unpaid: Coffee Break')).toBeInTheDocument();
        expect(screen.getByText('Paid: Additional Break')).toBeInTheDocument();
      });
    });

    it('prevents duplicate breaks when combining', async () => {
      const duplicateBreak: BreakRule = {
        ...mockBreakRules[0],
        breakName: 'Updated Lunch Break', // Same ID but different name
      };

      const initialState = {
        breaksByAssignee: {
          'assignee-1': {
            breaks: mockBreakRules,
            loading: false,
            errorCode: null,
          },
        },
      };

      mockUseGetBreakById.getBreakByIdPolicy.mockResolvedValue(duplicateBreak);

      renderWithProviders(
        <BreaksByAssigneeDropdown
          assigneeId="assignee-1"
          value="break-1"
          onChange={jest.fn()}
        />,
        initialState,
      );

      await waitFor(() => {
        // Should show the updated break (from getBreakById) and not duplicate
        expect(
          screen.getByText('Paid: Updated Lunch Break'),
        ).toBeInTheDocument();
        expect(screen.queryByText('Paid: Lunch Break')).not.toBeInTheDocument();
        expect(screen.getByText('Unpaid: Coffee Break')).toBeInTheDocument();
      });
    });

    it('calls onBreaksLoaded with combined breaks', async () => {
      const onBreaksLoaded = jest.fn();
      const initialState = {
        breaksByAssignee: {
          'assignee-1': {
            breaks: mockBreakRules,
            loading: false,
            errorCode: null,
          },
        },
      };

      mockUseGetBreakById.getBreakByIdPolicy.mockResolvedValue(additionalBreak);

      renderWithProviders(
        <BreaksByAssigneeDropdown
          assigneeId="assignee-1"
          value="break-3"
          onChange={jest.fn()}
          onBreaksLoaded={onBreaksLoaded}
        />,
        initialState,
      );

      await waitFor(() => {
        expect(onBreaksLoaded).toHaveBeenCalledWith(
          expect.arrayContaining([...mockBreakRules, additionalBreak]),
        );
      });
    });

    it('uses filtered breaks when available', async () => {
      const filteredBreaks = [mockBreakRules[0]]; // Only the first break
      const initialState = {
        breaksByAssignee: {
          'assignee-1': {
            breaks: mockBreakRules,
            filteredBreaks,
            loading: false,
            errorCode: null,
          },
        },
      };

      mockUseGetBreakById.getBreakByIdPolicy.mockResolvedValue(additionalBreak);

      renderWithProviders(
        <BreaksByAssigneeDropdown
          assigneeId="assignee-1"
          value="break-3"
          onChange={jest.fn()}
        />,
        initialState,
      );

      await waitFor(() => {
        // Should show only the filtered break plus the additional break
        expect(screen.getByText('Paid: Lunch Break')).toBeInTheDocument();
        expect(
          screen.queryByText('Unpaid: Coffee Break'),
        ).not.toBeInTheDocument();
        expect(screen.getByText('Paid: Additional Break')).toBeInTheDocument();
      });
    });
  });

  describe('First assignee tracking', () => {
    it('sets additional break only for the first assigneeId', async () => {
      const additionalBreak: BreakRule = {
        id: 'break-3',
        breakName: 'Additional Break',
        breakType: Payroll_Break.Paid,
        isActive: true,
        isDefaultPolicy: false,
        allowAuto: true,
        allowManual: true,
        breakDuration: 60,
        durationUnit: 'Minutes' as any,
        activeBreakAssignmentCount: 0,
        isDeleted: false,
        noSetDuration: false,
      };

      mockUseGetBreakById.getBreakByIdPolicy.mockResolvedValue(additionalBreak);

      const initialState = {
        breaksByAssignee: {
          'assignee-1': {
            breaks: [mockBreakRules[0]],
            loading: false,
            errorCode: null,
          },
          'assignee-2': {
            breaks: [mockBreakRules[1]],
            loading: false,
            errorCode: null,
          },
        },
      };

      const { rerender } = renderWithProviders(
        <BreaksByAssigneeDropdown
          assigneeId="assignee-1"
          value="break-3"
          onChange={jest.fn()}
        />,
        initialState,
      );

      await waitFor(() => {
        expect(screen.getByText('Paid: Additional Break')).toBeInTheDocument();
      });

      // Change to a different assignee
      rerender(
        <Provider store={createTestStore(initialState)}>
          <BreaksByAssigneeDropdown
            assigneeId="assignee-2"
            value="break-3"
            onChange={jest.fn()}
          />
        </Provider>,
      );

      await waitFor(() => {
        // Additional break should not be shown for the second assignee
        expect(
          screen.queryByText('Paid: Additional Break'),
        ).not.toBeInTheDocument();
        expect(screen.getByText('Unpaid: Coffee Break')).toBeInTheDocument();
      });
    });
  });

  describe('Error handling', () => {
    it('handles errors in parallel API calls gracefully', async () => {
      mockUseBreaksCrud.getBreaksByAssigneeId.mockRejectedValue(
        new Error('Assignee fetch failed'),
      );
      mockUseGetBreakById.getBreakByIdPolicy.mockRejectedValue(
        new Error('Break by ID fetch failed'),
      );

      renderWithProviders(
        <BreaksByAssigneeDropdown
          assigneeId="assignee-1"
          value="break-1"
          onChange={jest.fn()}
        />,
      );

      await waitFor(() => {
        expect(mockLogger.error).toHaveBeenCalledWith(
          'GET_BREAK_BY_ID_FAILED',
          expect.objectContaining({
            breakId: 'break-1',
            error: expect.any(String),
            response: expect.any(Error),
          }),
        );
      });
    });

    it('continues when getBreaksByAssigneeId fails but getBreakByIdPolicy succeeds', async () => {
      const additionalBreak: BreakRule = {
        id: 'break-3',
        breakName: 'Additional Break',
        breakType: Payroll_Break.Paid,
        isActive: true,
        isDefaultPolicy: false,
        allowAuto: true,
        allowManual: true,
        breakDuration: 60,
        durationUnit: 'Minutes' as any,
        activeBreakAssignmentCount: 0,
        isDeleted: false,
        noSetDuration: false,
      };

      mockUseBreaksCrud.getBreaksByAssigneeId.mockRejectedValue(
        new Error('Assignee fetch failed'),
      );
      mockUseGetBreakById.getBreakByIdPolicy.mockResolvedValue(additionalBreak);

      renderWithProviders(
        <BreaksByAssigneeDropdown
          assigneeId="assignee-1"
          value="break-3"
          onChange={jest.fn()}
        />,
      );

      await waitFor(() => {
        expect(mockLogger.error).toHaveBeenCalledWith(
          'GET_BREAK_BY_ID_FAILED',
          expect.objectContaining({
            breakId: 'break-3',
            error: expect.any(String),
            response: expect.any(Error),
          }),
        );
      });
    });

    it('continues when getBreakByIdPolicy fails but getBreaksByAssigneeId succeeds', async () => {
      const initialState = {
        breaksByAssignee: {
          'assignee-1': {
            breaks: mockBreakRules,
            loading: false,
            errorCode: null,
          },
        },
      };

      mockUseBreaksCrud.getBreaksByAssigneeId.mockResolvedValue(undefined);
      mockUseGetBreakById.getBreakByIdPolicy.mockRejectedValue(
        new Error('Break by ID fetch failed'),
      );

      renderWithProviders(
        <BreaksByAssigneeDropdown
          assigneeId="assignee-1"
          value="break-1"
          onChange={jest.fn()}
        />,
        initialState,
      );

      await waitFor(() => {
        expect(mockLogger.error).toHaveBeenCalledWith(
          'GET_BREAK_BY_ID_FAILED',
          expect.objectContaining({
            breakId: 'break-1',
            error: expect.any(String),
            response: expect.any(Error),
          }),
        );
        // Should still show the assignee breaks
        expect(screen.getByText('Paid: Lunch Break')).toBeInTheDocument();
        expect(screen.getByText('Unpaid: Coffee Break')).toBeInTheDocument();
      });
    });
  });

  describe('Input value display', () => {
    it('displays formatted break name when a break is selected', async () => {
      const initialState = {
        breaksByAssignee: {
          'assignee-1': {
            breaks: mockBreakRules,
            loading: false,
            errorCode: null,
          },
        },
      };

      renderWithProviders(
        <BreaksByAssigneeDropdown
          assigneeId="assignee-1"
          value="break-1"
          onChange={jest.fn()}
        />,
        initialState,
      );

      await waitFor(() => {
        const input = screen.getByTestId('dropdown-input');
        expect(input).toHaveValue('Paid: Lunch Break');
      });
    });

    it('displays formatted break name for additional break when selected', async () => {
      const additionalBreak: BreakRule = {
        id: 'break-3',
        breakName: 'Additional Break',
        breakType: Payroll_Break.Unpaid,
        isActive: true,
        isDefaultPolicy: false,
        allowAuto: true,
        allowManual: true,
        breakDuration: 60,
        durationUnit: 'Minutes' as any,
        activeBreakAssignmentCount: 0,
        isDeleted: false,
        noSetDuration: false,
      };

      const initialState = {
        breaksByAssignee: {
          'assignee-1': {
            breaks: mockBreakRules,
            loading: false,
            errorCode: null,
          },
        },
      };

      mockUseGetBreakById.getBreakByIdPolicy.mockResolvedValue(additionalBreak);

      renderWithProviders(
        <BreaksByAssigneeDropdown
          assigneeId="assignee-1"
          value="break-3"
          onChange={jest.fn()}
        />,
        initialState,
      );

      await waitFor(() => {
        const input = screen.getByTestId('dropdown-input');
        expect(input).toHaveValue('Unpaid: Additional Break');
      });
    });
  });

  describe('includeDeleted functionality', () => {
    it('calls getBreakByIdPolicy with includeDeleted when specified', () => {
      renderWithProviders(
        <BreaksByAssigneeDropdown
          assigneeId="assignee-1"
          value="break-1"
          onChange={jest.fn()}
          includeDeleted
        />,
      );

      expect(mockUseGetBreakById.getBreakByIdPolicy).toHaveBeenCalledWith(
        'break-1',
        true,
      );
    });

    it('calls getBreakByIdPolicy with includeDeleted=false by default', () => {
      renderWithProviders(
        <BreaksByAssigneeDropdown
          assigneeId="assignee-1"
          value="break-1"
          onChange={jest.fn()}
        />,
      );

      expect(mockUseGetBreakById.getBreakByIdPolicy).toHaveBeenCalledWith(
        'break-1',
        false,
      );
    });
  });

  describe('showActiveOnly functionality', () => {
    it('calls getBreaksByAssigneeId with showActiveOnly=true by default', () => {
      renderWithProviders(
        <BreaksByAssigneeDropdown
          assigneeId="assignee-1"
          value=""
          onChange={jest.fn()}
        />,
      );

      expect(mockUseBreaksCrud.getBreaksByAssigneeId).toHaveBeenCalledWith(
        'assignee-1',
        true,
      );
    });

    it('calls getBreaksByAssigneeId with showActiveOnly=false when specified', () => {
      renderWithProviders(
        <BreaksByAssigneeDropdown
          assigneeId="assignee-1"
          value=""
          onChange={jest.fn()}
          showActiveOnly={false}
        />,
      );

      expect(mockUseBreaksCrud.getBreaksByAssigneeId).toHaveBeenCalledWith(
        'assignee-1',
        false,
      );
    });
  });

  describe('Error handling improvements', () => {
    it('handles getBreakByIdPolicy errors gracefully without breaking the component', async () => {
      const initialState = {
        breaksByAssignee: {
          'assignee-1': {
            breaks: mockBreakRules,
            loading: false,
            errorCode: null,
          },
        },
      };

      mockUseGetBreakById.getBreakByIdPolicy.mockRejectedValue(
        new Error('Break not found'),
      );

      renderWithProviders(
        <BreaksByAssigneeDropdown
          assigneeId="assignee-1"
          value="non-existent-break"
          onChange={jest.fn()}
        />,
        initialState,
      );

      await waitFor(() => {
        // Component should still render and show assignee breaks
        expect(screen.getByText('Paid: Lunch Break')).toBeInTheDocument();
        expect(screen.getByText('Unpaid: Coffee Break')).toBeInTheDocument();
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        'GET_BREAK_BY_ID_FAILED',
        expect.objectContaining({
          breakId: 'non-existent-break',
          error: expect.any(String),
          response: expect.any(Error),
        }),
      );
    });

    it('continues to work when both API calls fail', async () => {
      mockUseBreaksCrud.getBreaksByAssigneeId.mockRejectedValue(
        new Error('Assignee fetch failed'),
      );
      mockUseGetBreakById.getBreakByIdPolicy.mockRejectedValue(
        new Error('Break by ID fetch failed'),
      );

      renderWithProviders(
        <BreaksByAssigneeDropdown
          assigneeId="assignee-1"
          value="break-1"
          onChange={jest.fn()}
        />,
      );

      await waitFor(() => {
        // Component should still render without crashing
        expect(screen.getByTestId('dropdown-typeahead')).toBeInTheDocument();
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        'GET_BREAK_BY_ID_FAILED',
        expect.objectContaining({
          breakId: 'break-1',
          error: expect.any(String),
          response: expect.any(Error),
        }),
      );
    });
  });

  describe('Search functionality', () => {
    it('filters breaks based on search input correctly', () => {
      const initialState = {
        breaksByAssignee: {
          'assignee-1': {
            breaks: mockBreakRules,
            loading: false,
            errorCode: null,
          },
        },
      };

      renderWithProviders(
        <BreaksByAssigneeDropdown
          assigneeId="assignee-1"
          value=""
          onChange={jest.fn()}
        />,
        initialState,
      );

      const input = screen.getByTestId('dropdown-input');
      fireEvent.change(input, { target: { value: 'Lunch' } });

      expect(input).toHaveValue('Lunch');
    });

    it('handles case-insensitive search', () => {
      const initialState = {
        breaksByAssignee: {
          'assignee-1': {
            breaks: mockBreakRules,
            loading: false,
            errorCode: null,
          },
        },
      };

      renderWithProviders(
        <BreaksByAssigneeDropdown
          assigneeId="assignee-1"
          value=""
          onChange={jest.fn()}
        />,
        initialState,
      );

      const input = screen.getByTestId('dropdown-input');
      fireEvent.change(input, { target: { value: 'lunch' } });

      expect(input).toHaveValue('lunch');
    });
  });

  describe('Component lifecycle', () => {
    it('handles assigneeId changes correctly', async () => {
      const initialState = {
        breaksByAssignee: {
          'assignee-1': {
            breaks: [mockBreakRules[0]],
            loading: false,
            errorCode: null,
          },
          'assignee-2': {
            breaks: [mockBreakRules[1]],
            loading: false,
            errorCode: null,
          },
        },
      };

      const { rerender } = renderWithProviders(
        <BreaksByAssigneeDropdown
          assigneeId="assignee-1"
          value=""
          onChange={jest.fn()}
        />,
        initialState,
      );

      await waitFor(() => {
        expect(screen.getByText('Paid: Lunch Break')).toBeInTheDocument();
      });

      // Change assigneeId
      rerender(
        <Provider store={createTestStore(initialState)}>
          <BreaksByAssigneeDropdown
            assigneeId="assignee-2"
            value=""
            onChange={jest.fn()}
          />
        </Provider>,
      );

      await waitFor(() => {
        expect(screen.getByText('Unpaid: Coffee Break')).toBeInTheDocument();
        expect(screen.queryByText('Paid: Lunch Break')).not.toBeInTheDocument();
      });
    });

    it('handles value changes correctly', async () => {
      const initialState = {
        breaksByAssignee: {
          'assignee-1': {
            breaks: mockBreakRules,
            loading: false,
            errorCode: null,
          },
        },
      };

      const { rerender } = renderWithProviders(
        <BreaksByAssigneeDropdown
          assigneeId="assignee-1"
          value=""
          onChange={jest.fn()}
        />,
        initialState,
      );

      // Change value
      rerender(
        <Provider store={createTestStore(initialState)}>
          <BreaksByAssigneeDropdown
            assigneeId="assignee-1"
            value="break-1"
            onChange={jest.fn()}
          />
        </Provider>,
      );

      await waitFor(() => {
        expect(mockUseGetBreakById.getBreakByIdPolicy).toHaveBeenCalledWith(
          'break-1',
          false,
        );
      });
    });
  });
});

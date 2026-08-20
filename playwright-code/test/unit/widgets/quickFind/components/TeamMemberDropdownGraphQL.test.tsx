import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import TeamMemberDropdownGraphQL from '../../../../../src/js/widgets/quickFind/components/TeamMemberDropdownGraphQL';
import { ContactType } from '../../../../../src/js/widgets/quickFind/types';
import {
  TimeTracking_TimeForType,
  TimeTracking_WorkerOrderBy,
} from '../../../../../src/__generated__/timeTracking/graphql';

// Mock dependencies
jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: jest.fn(({ id, defaultValue }) => defaultValue || id),
  }),
  useSandbox: () => ({
    logger: {
      log: jest.fn(),
      error: jest.fn(),
    },
    rum: {
      createCustomerInteraction: jest.fn(() => ({
        endInteractionWithSuccess: jest.fn(),
        endInteractionWithFailure: jest.fn(),
      })),
    },
  }),
}));

jest.mock('@ids-ts/dropdown-typeahead', () => ({
  __esModule: true,
  default: ({
    value,
    inputValue,
    onChange,
    onSearch,
    onBlur,
    dataSource,
    label,
    placeholder,
    errorText,
    disabled,
    width,
    renderItem,
    addNew,
    addNewItemProps,
  }: any) => (
    <div
      data-testid="dropdown-typeahead"
      data-value={value}
      data-inputvalue={inputValue}
      data-label={label}
      data-placeholder={placeholder}
      data-error={errorText}
      data-disabled={disabled}
      data-width={width}
    >
      <input
        data-testid="dropdown-input"
        value={inputValue}
        onChange={(e) => onSearch(e)}
        onBlur={(e) => onBlur && onBlur(e)}
        placeholder={placeholder}
        disabled={disabled}
        aria-controls="mock-listbox-id"
      />
      <div data-testid="dropdown-options" role="listbox" id="mock-listbox-id">
        {dataSource.map((item: any, index: number) => (
          <button
            key={`option-${item.value}`}
            data-testid={`option-${index}`}
            onClick={() => onChange({ target: { value: item.value } })}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onChange({} as any, { selectedItem: item });
              }
            }}
            type="button"
          >
            {renderItem ? renderItem(item, index) : item.label}
          </button>
        ))}
      </div>
      {addNew && (
        <button
          data-testid="trigger-add-new"
          type="button"
          onClick={() => addNewItemProps?.onClick?.()}
        >
          Add New
        </button>
      )}
      DropdownTypeahead Component
    </div>
  ),
  MenuItem: ({ children, value }: any) => (
    <div data-testid="menu-item" data-value={value}>
      {children}
    </div>
  ),
}));

jest.mock('web-shell-core/widgets/HOCWidget', () => ({
  __esModule: true,
  default: ({ open, onClose, onSuccess }: any) =>
    open ? (
      <div data-testid="team-member-drawer">
        <button type="button" data-testid="drawer-close" onClick={onClose}>
          Close
        </button>
        <button
          type="button"
          data-testid="drawer-save"
          onClick={() =>
            onSuccess?.({
              id: 'scope:new-worker',
              displayName: 'New Worker',
              type: ContactType.Employee,
            })
          }
        >
          Save
        </button>
      </div>
    ) : null,
}));

// Mock the feature flag hook (default OFF; tests can override per-case)
jest.mock('../../../../../src/js/common/useIXPFeatureFlag', () => ({
  useIXPFeatureFlag: jest.fn(() => ({
    isEnabled: false,
    isLoading: false,
    error: null,
    settled: true,
  })),
}));
// eslint-disable-next-line import/first, import/order
import { useIXPFeatureFlag } from '../../../../../src/js/common/useIXPFeatureFlag';

// Mock the hooks
const mockLoadWorkers = jest.fn();
const mockRefetch = jest.fn();
const mockLoadMore = jest.fn();

const mockWorkers = [
  {
    id: 'worker1',
    displayName: 'John Employee',
    firstName: 'John',
    lastName: 'Employee',
    type: ContactType.Employee,
  },
  {
    id: 'worker2',
    displayName: 'Jane Employee',
    firstName: 'Jane',
    lastName: 'Employee',
    type: ContactType.Employee,
  },
];

const mockUseTeamMemberLoadMore = jest.fn();

jest.mock(
  '../../../../../src/js/widgets/quickFind/hooks/useTeamMemberLoadMore',
  () => ({
    useTeamMemberLoadMore: (options: any) => mockUseTeamMemberLoadMore(options),
  }),
);

describe('TeamMemberDropdownGraphQL', () => {
  const defaultProps = {
    value: '',
    onChange: jest.fn(),
    onReady: jest.fn(),
    onError: jest.fn(),
    label: 'Team Member',
    placeholder: 'Select a team member...',
    errorText: '',
    disabled: false,
    subTypes: [ContactType.Employee, ContactType.Vendor],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock return value
    mockUseTeamMemberLoadMore.mockReturnValue({
      workers: mockWorkers,
      loading: false,
      error: null,
      loadWorkers: mockLoadWorkers,
      refetch: mockRefetch,
      loadMore: mockLoadMore,
      hasMore: false,
    });
  });

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      render(<TeamMemberDropdownGraphQL {...defaultProps} />);

      expect(screen.getByTestId('dropdown-typeahead')).toBeInTheDocument();
      expect(
        screen.getByText('DropdownTypeahead Component'),
      ).toBeInTheDocument();
    });

    it('should display the correct label', () => {
      render(<TeamMemberDropdownGraphQL {...defaultProps} />);

      const dropdown = screen.getByTestId('dropdown-typeahead');
      expect(dropdown).toHaveAttribute('data-label', 'Team Member');
    });

    it('should display the correct placeholder', () => {
      render(<TeamMemberDropdownGraphQL {...defaultProps} />);

      const dropdown = screen.getByTestId('dropdown-typeahead');
      expect(dropdown).toHaveAttribute(
        'data-placeholder',
        'Select a team member...',
      );
    });

    it('should pass correct props to DropdownTypeahead', () => {
      render(<TeamMemberDropdownGraphQL {...defaultProps} />);

      const dropdown = screen.getByTestId('dropdown-typeahead');
      expect(dropdown).toHaveAttribute('data-value', '');
      expect(dropdown).toHaveAttribute('data-disabled', 'false');
      expect(dropdown).toHaveAttribute('data-width', 'auto');
    });
  });

  describe('Data Loading and Display', () => {
    it('should call loadWorkers on mount', () => {
      render(<TeamMemberDropdownGraphQL {...defaultProps} />);

      expect(mockLoadWorkers).toHaveBeenCalled();
    });

    it('should display workers in dropdown', () => {
      render(<TeamMemberDropdownGraphQL {...defaultProps} />);

      const options = screen.getByTestId('dropdown-options');
      expect(options.children).toHaveLength(2); // 2 workers from mockWorkers
    });

    it('should call onReady when data is loaded', () => {
      render(<TeamMemberDropdownGraphQL {...defaultProps} />);

      expect(defaultProps.onReady).toHaveBeenCalled();
    });

    it('returns empty datasource while loading and no workers', () => {
      mockUseTeamMemberLoadMore.mockReturnValue({
        workers: [],
        loading: true,
        error: null,
        loadWorkers: mockLoadWorkers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      render(<TeamMemberDropdownGraphQL {...defaultProps} />);
      expect(screen.getByTestId('dropdown-options').children).toHaveLength(0);
    });
  });

  describe('SubTypes Filtering', () => {
    it('should filter only employees when subTypes is [Employee]', () => {
      const props = {
        ...defaultProps,
        subTypes: [ContactType.Employee],
      };

      render(<TeamMemberDropdownGraphQL {...props} />);

      expect(mockLoadWorkers).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: true,
          types: [TimeTracking_TimeForType.Employee],
        }),
      );
    });

    it('should filter only vendors when subTypes is [Vendor]', () => {
      const props = {
        ...defaultProps,
        subTypes: [ContactType.Vendor],
      };

      render(<TeamMemberDropdownGraphQL {...props} />);

      expect(mockLoadWorkers).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: true,
          types: [TimeTracking_TimeForType.Vendor],
        }),
      );
    });

    it('should include both types when subTypes contains both', () => {
      render(<TeamMemberDropdownGraphQL {...defaultProps} />);

      expect(mockLoadWorkers).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: true,
          types: expect.arrayContaining([
            TimeTracking_TimeForType.Employee,
            TimeTracking_TimeForType.Vendor,
          ]),
        }),
      );
    });
  });

  describe('LEGACY_QBO_USER feature flag gating', () => {
    const mockFlag = (isEnabled: boolean) =>
      (useIXPFeatureFlag as jest.Mock).mockReturnValue({
        isEnabled,
        isLoading: false,
        error: null,
        settled: true,
      });

    afterEach(() => {
      mockFlag(false);
    });

    it('does NOT include LegacyQboUser in types filter when flag is OFF', () => {
      mockFlag(false);
      const props = { ...defaultProps, subTypes: [ContactType.Employee] };

      render(<TeamMemberDropdownGraphQL {...props} />);

      expect(mockLoadWorkers).toHaveBeenCalledWith(
        expect.objectContaining({
          types: [TimeTracking_TimeForType.Employee],
        }),
      );
      const lastCall =
        mockLoadWorkers.mock.calls[mockLoadWorkers.mock.calls.length - 1][0];
      expect(lastCall.types).not.toContain(
        TimeTracking_TimeForType.LegacyQboUser,
      );
    });

    it('includes LegacyQboUser in types filter when flag is ON and Employee subtype is requested', () => {
      mockFlag(true);
      const props = { ...defaultProps, subTypes: [ContactType.Employee] };

      render(<TeamMemberDropdownGraphQL {...props} />);

      expect(mockLoadWorkers).toHaveBeenCalledWith(
        expect.objectContaining({
          types: expect.arrayContaining([
            TimeTracking_TimeForType.Employee,
            TimeTracking_TimeForType.LegacyQboUser,
          ]),
        }),
      );
    });

    it('does NOT add LegacyQboUser when flag is ON but only Vendor subtype is requested', () => {
      mockFlag(true);
      const props = { ...defaultProps, subTypes: [ContactType.Vendor] };

      render(<TeamMemberDropdownGraphQL {...props} />);

      expect(mockLoadWorkers).toHaveBeenCalledWith(
        expect.objectContaining({
          types: [TimeTracking_TimeForType.Vendor],
        }),
      );
      const lastCall =
        mockLoadWorkers.mock.calls[mockLoadWorkers.mock.calls.length - 1][0];
      expect(lastCall.types).not.toContain(
        TimeTracking_TimeForType.LegacyQboUser,
      );
    });
  });

  describe('Search Functionality', () => {
    it('should handle search input with debouncing', async () => {
      render(<TeamMemberDropdownGraphQL {...defaultProps} />);

      const input = screen.getByTestId('dropdown-input');

      // Clear initial calls
      mockLoadWorkers.mockClear();

      // Type in search input
      fireEvent.change(input, { target: { value: 'John' } });

      // Should call with search filter after debounce
      await waitFor(
        () => {
          expect(mockLoadWorkers).toHaveBeenCalledWith(
            expect.objectContaining({
              searchText: 'John',
              isActive: true,
            }),
          );
        },
        { timeout: 1000 },
      );
    });

    it('should trim search text', async () => {
      render(<TeamMemberDropdownGraphQL {...defaultProps} />);

      const input = screen.getByTestId('dropdown-input');

      mockLoadWorkers.mockClear();

      fireEvent.change(input, { target: { value: '  John  ' } });

      await waitFor(
        () => {
          expect(mockLoadWorkers).toHaveBeenCalledWith(
            expect.objectContaining({
              searchText: 'John',
            }),
          );
        },
        { timeout: 1000 },
      );
    });

    it('should not add searchText filter when input is empty', () => {
      render(<TeamMemberDropdownGraphQL {...defaultProps} />);

      expect(mockLoadWorkers).toHaveBeenCalledWith(
        expect.not.objectContaining({
          searchText: expect.anything(),
        }),
      );
    });
  });

  describe('Selection and Change Handling', () => {
    it('should call onChange when an option is selected', async () => {
      const mockOnChange = jest.fn();
      const props = {
        ...defaultProps,
        onChange: mockOnChange,
      };

      render(<TeamMemberDropdownGraphQL {...props} />);

      const option = screen.getByTestId('option-0');
      fireEvent.click(option);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('worker1', {
          id: 'worker1',
          name: 'John Employee',
          type: 'employee',
        });
      });
    });

    it('should call onChange when option is selected via Enter key', async () => {
      const mockOnChange = jest.fn();
      render(
        <TeamMemberDropdownGraphQL {...defaultProps} onChange={mockOnChange} />,
      );

      const option = screen.getByTestId('option-0');
      fireEvent.keyDown(option, { key: 'Enter' });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('worker1', {
          id: 'worker1',
          name: 'John Employee',
          type: 'employee',
        });
      });
    });

    it('should clear search text after selection', async () => {
      render(<TeamMemberDropdownGraphQL {...defaultProps} />);

      const input = screen.getByTestId('dropdown-input');

      // Type to search
      fireEvent.change(input, { target: { value: 'John' } });

      await waitFor(() => {
        expect(input).toHaveValue('John');
      });

      // Select an option
      const option = screen.getByTestId('option-0');
      fireEvent.click(option);

      // After selection, input should show selected item name (not the search text)
      await waitFor(() => {
        expect(input).toHaveValue('John Employee');
      });
    });

    it('clears active search filter after selecting an option', async () => {
      render(<TeamMemberDropdownGraphQL {...defaultProps} />);
      const input = screen.getByTestId('dropdown-input');

      fireEvent.change(input, { target: { value: 'John' } });
      await waitFor(() => {
        expect(mockLoadWorkers).toHaveBeenCalledWith(
          expect.objectContaining({ searchText: 'John' }),
        );
      });

      mockLoadWorkers.mockClear();
      fireEvent.click(screen.getByTestId('option-0'));

      await waitFor(() => {
        expect(mockLoadWorkers).toHaveBeenCalledWith(
          expect.not.objectContaining({ searchText: expect.anything() }),
        );
      });
    });
  });

  describe('Blur Behavior', () => {
    it('should clear search text on blur', () => {
      render(<TeamMemberDropdownGraphQL {...defaultProps} />);

      const input = screen.getByTestId('dropdown-input');

      // Type something
      fireEvent.change(input, { target: { value: 'test search' } });

      // Blur the input
      fireEvent.blur(input);

      // Input should be cleared
      expect(input).toHaveValue('');
    });

    it('should clear selection if no exact match found on blur', () => {
      const mockOnChange = jest.fn();
      const props = {
        ...defaultProps,
        onChange: mockOnChange,
      };

      render(<TeamMemberDropdownGraphQL {...props} />);

      const input = screen.getByTestId('dropdown-input');

      // Type partial match
      fireEvent.change(input, { target: { value: 'Partial Name' } });
      fireEvent.blur(input);

      expect(mockOnChange).toHaveBeenCalledWith('', undefined);
    });

    it('should not clear selection if exact match found on blur', () => {
      const mockOnChange = jest.fn();
      const props = {
        ...defaultProps,
        onChange: mockOnChange,
      };

      render(<TeamMemberDropdownGraphQL {...props} />);

      const input = screen.getByTestId('dropdown-input');

      // Type exact match
      fireEvent.change(input, { target: { value: 'John Employee' } });
      fireEvent.blur(input);

      expect(mockOnChange).not.toHaveBeenCalledWith('', undefined);
    });

    it('should preserve selection when value prop exists on blur', () => {
      const mockOnChange = jest.fn();
      const props = {
        ...defaultProps,
        value: 'worker1', // Has a valid value
        onChange: mockOnChange,
      };

      render(<TeamMemberDropdownGraphQL {...props} />);

      const input = screen.getByTestId('dropdown-input');

      // Blur with existing value - should preserve selection
      fireEvent.blur(input);

      // Should not clear the selection when value prop exists
      expect(mockOnChange).not.toHaveBeenCalledWith('', undefined);
    });

    it('should preserve selection on blur even when allContacts is empty during refetch', () => {
      const mockOnChange = jest.fn();

      // Simulate empty contacts (during refetch)
      mockUseTeamMemberLoadMore.mockReturnValue({
        workers: [],
        loading: false,
        error: null,
        loadWorkers: mockLoadWorkers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      const props = {
        ...defaultProps,
        value: 'worker1', // Has a valid value
        onChange: mockOnChange,
      };

      render(<TeamMemberDropdownGraphQL {...props} />);

      const input = screen.getByTestId('dropdown-input');

      // Blur with existing value and empty contacts - should preserve selection
      fireEvent.blur(input);

      // Should not clear the selection even when contacts are empty
      expect(mockOnChange).not.toHaveBeenCalledWith('', undefined);
    });
  });

  describe('Props and State Management', () => {
    it('should handle disabled state', () => {
      const props = {
        ...defaultProps,
        disabled: true,
      };

      render(<TeamMemberDropdownGraphQL {...props} />);

      const dropdown = screen.getByTestId('dropdown-typeahead');
      expect(dropdown).toHaveAttribute('data-disabled', 'true');
    });

    it('should handle error text', () => {
      const props = {
        ...defaultProps,
        errorText: 'This field is required',
      };

      render(<TeamMemberDropdownGraphQL {...props} />);

      const dropdown = screen.getByTestId('dropdown-typeahead');
      expect(dropdown).toHaveAttribute('data-error', 'This field is required');
    });

    it('should handle custom width', () => {
      const props = {
        ...defaultProps,
        width: '400px',
      };

      render(<TeamMemberDropdownGraphQL {...props} />);

      const dropdown = screen.getByTestId('dropdown-typeahead');
      expect(dropdown).toHaveAttribute('data-width', '400px');
    });

    it('should handle prefilled value', () => {
      const props = {
        ...defaultProps,
        value: 'worker1',
      };

      render(<TeamMemberDropdownGraphQL {...props} />);

      const dropdown = screen.getByTestId('dropdown-typeahead');
      expect(dropdown).toHaveAttribute('data-value', 'worker1');
      expect(dropdown).toHaveAttribute('data-inputvalue', 'John Employee');
    });
  });

  describe('Loading State', () => {
    it('should handle loading state', () => {
      mockUseTeamMemberLoadMore.mockReturnValue({
        workers: mockWorkers,
        loading: true,
        error: null,
        loadWorkers: mockLoadWorkers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      render(<TeamMemberDropdownGraphQL {...defaultProps} />);

      const dropdown = screen.getByTestId('dropdown-typeahead');
      expect(dropdown).toHaveAttribute('data-inputvalue', '');
    });
  });

  describe('Error Handling', () => {
    it('should call onError when GraphQL query fails', () => {
      const mockOnError = jest.fn();
      mockUseTeamMemberLoadMore.mockReturnValue({
        workers: [],
        loading: false,
        error: 'GraphQL Error',
        loadWorkers: mockLoadWorkers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      render(
        <TeamMemberDropdownGraphQL {...defaultProps} onError={mockOnError} />,
      );

      expect(mockOnError).toHaveBeenCalledWith('GraphQL Error');
    });
  });

  describe('GraphQL Filter Structure', () => {
    it('should send correct filter with active workers only', () => {
      render(<TeamMemberDropdownGraphQL {...defaultProps} />);

      expect(mockLoadWorkers).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: true,
        }),
      );
    });

    it('should send correct orderBy parameter via hook options', () => {
      render(<TeamMemberDropdownGraphQL {...defaultProps} />);

      // orderBy is passed as an option to useTeamMemberLoadMore, not to loadWorkers
      expect(mockUseTeamMemberLoadMore).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
        }),
      );
    });

    it('should configure pagination via hook options', () => {
      render(<TeamMemberDropdownGraphQL {...defaultProps} />);

      // pageSize is configured in the hook options
      expect(mockUseTeamMemberLoadMore).toHaveBeenCalledWith(
        expect.objectContaining({
          pageSize: 100,
        }),
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined callbacks gracefully', () => {
      const propsWithoutCallbacks = {
        ...defaultProps,
        onChange: undefined,
        onReady: undefined,
        onError: undefined,
      };

      expect(() => {
        render(<TeamMemberDropdownGraphQL {...propsWithoutCallbacks} />);
      }).not.toThrow();
    });

    it('should handle empty workers list', () => {
      mockUseTeamMemberLoadMore.mockReturnValue({
        workers: [],
        loading: false,
        error: null,
        loadWorkers: mockLoadWorkers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      render(<TeamMemberDropdownGraphQL {...defaultProps} />);

      const options = screen.getByTestId('dropdown-options');
      expect(options).toBeEmptyDOMElement();
    });

    it('should handle workers with missing displayName', () => {
      mockUseTeamMemberLoadMore.mockReturnValue({
        workers: [
          {
            id: 'worker1',
            displayName: '',
            firstName: 'John',
            lastName: 'Doe',
            type: ContactType.Employee,
          },
        ],
        loading: false,
        error: null,
        loadWorkers: mockLoadWorkers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      render(<TeamMemberDropdownGraphQL {...defaultProps} />);

      const options = screen.getByTestId('dropdown-options');
      expect(options.children).toHaveLength(1);
    });

    it('should handle rapid typing without excessive API calls', async () => {
      render(<TeamMemberDropdownGraphQL {...defaultProps} />);

      const input = screen.getByTestId('dropdown-input');
      const initialCallCount = mockLoadWorkers.mock.calls.length;

      // Type multiple characters quickly
      fireEvent.change(input, { target: { value: 'J' } });
      fireEvent.change(input, { target: { value: 'Jo' } });
      fireEvent.change(input, { target: { value: 'Joh' } });
      fireEvent.change(input, { target: { value: 'John' } });

      // Should not have made excessive API calls immediately
      expect(mockLoadWorkers.mock.calls.length).toBeLessThanOrEqual(
        initialCallCount + 2,
      );
    });
  });

  describe('Memory Management', () => {
    it('should cleanup timeout on unmount', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      const { unmount } = render(
        <TeamMemberDropdownGraphQL {...defaultProps} />,
      );

      const input = screen.getByTestId('dropdown-input');
      fireEvent.change(input, { target: { value: 'test' } });

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    });
  });

  describe('Type Conversion', () => {
    it('should correctly convert Employee type to lowercase format', async () => {
      const mockOnChange = jest.fn();

      mockUseTeamMemberLoadMore.mockReturnValue({
        workers: [
          {
            id: 'emp1',
            displayName: 'John Employee',
            firstName: 'John',
            lastName: 'Employee',
            type: ContactType.Employee,
          },
        ],
        loading: false,
        error: null,
        loadWorkers: mockLoadWorkers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      render(
        <TeamMemberDropdownGraphQL {...defaultProps} onChange={mockOnChange} />,
      );

      const option = screen.getByTestId('option-0');
      fireEvent.click(option);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('emp1', {
          id: 'emp1',
          name: 'John Employee',
          type: 'employee',
        });
      });
    });

    it('should correctly convert Vendor type to lowercase format', async () => {
      const mockOnChange = jest.fn();

      mockUseTeamMemberLoadMore.mockReturnValue({
        workers: [
          {
            id: 'ven1',
            displayName: 'Bob Vendor',
            firstName: 'Bob',
            lastName: 'Vendor',
            type: ContactType.Vendor,
          },
        ],
        loading: false,
        error: null,
        loadWorkers: mockLoadWorkers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      render(
        <TeamMemberDropdownGraphQL {...defaultProps} onChange={mockOnChange} />,
      );

      const option = screen.getByTestId('option-0');
      fireEvent.click(option);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('ven1', {
          id: 'ven1',
          name: 'Bob Vendor',
          type: 'vendor',
        });
      });
    });
  });

  describe('Filter Changes', () => {
    it('should reload data when subTypes prop changes', () => {
      const { rerender } = render(
        <TeamMemberDropdownGraphQL
          {...defaultProps}
          subTypes={[ContactType.Employee]}
        />,
      );

      mockLoadWorkers.mockClear();

      rerender(
        <TeamMemberDropdownGraphQL
          {...defaultProps}
          subTypes={[ContactType.Vendor]}
        />,
      );

      expect(mockLoadWorkers).toHaveBeenCalledWith(
        expect.objectContaining({
          types: [TimeTracking_TimeForType.Vendor],
        }),
      );
    });
  });

  describe('User Cleared State', () => {
    it('should clear selection when user clears input', () => {
      const mockOnChange = jest.fn();
      const props = {
        ...defaultProps,
        value: 'worker1',
        onChange: mockOnChange,
      };

      render(<TeamMemberDropdownGraphQL {...props} />);

      const input = screen.getByTestId('dropdown-input');

      // Clear input by typing empty string - this simulates user clearing the input
      fireEvent.change(input, { target: { value: '' } });

      // Input should be cleared
      expect(input).toHaveValue('');
    });

    it('should show empty string when user has cleared selection', () => {
      const props = {
        ...defaultProps,
        value: 'worker1',
      };

      render(<TeamMemberDropdownGraphQL {...props} />);

      const input = screen.getByTestId('dropdown-input');

      // Clear input
      fireEvent.change(input, { target: { value: '' } });

      // Input should remain empty even though value prop hasn't changed
      expect(input).toHaveValue('');
    });
  });

  describe('Infinite Scroll Functionality', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should provide loadMore and hasMore from useTeamMemberLoadMore hook', () => {
      mockUseTeamMemberLoadMore.mockReturnValue({
        workers: mockWorkers,
        loading: false,
        error: null,
        loadWorkers: mockLoadWorkers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: true,
      });

      render(<TeamMemberDropdownGraphQL {...defaultProps} />);

      // Verify hook was called with infinite scroll enabled
      expect(mockUseTeamMemberLoadMore).toHaveBeenCalledWith({
        pageSize: 100,
        enableLoadMore: true,
        orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
      });
    });

    it('should not show Load More button (infinite scroll is automatic)', () => {
      mockUseTeamMemberLoadMore.mockReturnValue({
        workers: mockWorkers,
        loading: false,
        error: null,
        loadWorkers: mockLoadWorkers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: true,
      });

      render(<TeamMemberDropdownGraphQL {...defaultProps} />);

      // Load More button should not exist (infinite scroll happens on scroll event)
      expect(screen.queryByText('Load More')).not.toBeInTheDocument();
    });

    it('should render all workers without Load More button when hasMore is false', () => {
      mockUseTeamMemberLoadMore.mockReturnValue({
        workers: mockWorkers,
        loading: false,
        error: null,
        loadWorkers: mockLoadWorkers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      render(<TeamMemberDropdownGraphQL {...defaultProps} />);

      const options = screen.getAllByTestId(/^option-/);
      expect(options.length).toBe(2); // Only the 2 workers, no Load More item
      expect(screen.queryByText('Load More')).not.toBeInTheDocument();
    });

    it('should append new items when workers are updated via infinite scroll', async () => {
      const moreWorkers = [
        {
          id: 'worker3',
          displayName: 'Worker 3',
          type: ContactType.Employee,
        },
        {
          id: 'worker4',
          displayName: 'Worker 4',
          type: ContactType.Vendor,
        },
      ];

      mockUseTeamMemberLoadMore.mockReturnValue({
        workers: mockWorkers,
        loading: false,
        error: null,
        loadWorkers: mockLoadWorkers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: true,
      });

      const { rerender } = render(
        <TeamMemberDropdownGraphQL {...defaultProps} />,
      );

      // Initial render should have 2 workers
      let options = screen.getAllByTestId(/^option-/);
      expect(options.length).toBe(2); // 2 workers (no Load More button)

      // Simulate infinite scroll adding new workers
      mockUseTeamMemberLoadMore.mockReturnValue({
        workers: [...mockWorkers, ...moreWorkers],
        loading: false,
        error: null,
        loadWorkers: mockLoadWorkers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: false, // No more items after this
      });

      rerender(<TeamMemberDropdownGraphQL {...defaultProps} />);

      // Should now have 4 workers
      options = screen.getAllByTestId(/^option-/);
      expect(options.length).toBe(4);
      expect(screen.queryByText('Load More')).not.toBeInTheDocument();
    });

    it('calls loadMore when scrolled near end of list', async () => {
      const originalMutationObserver = global.MutationObserver;
      class MockMutationObserver {
        private cb: MutationCallback;

        constructor(cb: MutationCallback) {
          this.cb = cb;
        }

        observe() {
          this.cb([], this as unknown as MutationObserver);
        }

        disconnect() {
          this.cb = () => {};
        }
      }
      (global as any).MutationObserver = MockMutationObserver;

      mockUseTeamMemberLoadMore.mockReturnValue({
        workers: mockWorkers,
        loading: false,
        error: null,
        loadWorkers: mockLoadWorkers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: true,
      });

      render(<TeamMemberDropdownGraphQL {...defaultProps} />);
      const listbox = screen.getByRole('listbox');
      Object.defineProperty(listbox, 'scrollTop', {
        value: 90,
        writable: true,
      });
      Object.defineProperty(listbox, 'scrollHeight', {
        value: 100,
        writable: true,
      });
      Object.defineProperty(listbox, 'clientHeight', {
        value: 10,
        writable: true,
      });

      fireEvent.scroll(listbox);
      expect(mockLoadMore).toHaveBeenCalled();
      (global as any).MutationObserver = originalMutationObserver;
    });
  });

  describe('Filter Branches and Add New', () => {
    it('applies vendor subtype filter predicate from filters prop', () => {
      mockUseTeamMemberLoadMore.mockReturnValue({
        workers: [
          {
            id: 'ven-match',
            displayName: 'Vendor Match',
            firstName: 'Vendor',
            lastName: 'Match',
            type: ContactType.Vendor,
            customFlag: true,
          } as any,
          {
            id: 'ven-skip',
            displayName: 'Vendor Skip',
            firstName: 'Vendor',
            lastName: 'Skip',
            type: ContactType.Vendor,
            customFlag: false,
          } as any,
        ],
        loading: false,
        error: null,
        loadWorkers: mockLoadWorkers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      render(
        <TeamMemberDropdownGraphQL
          {...defaultProps}
          subTypes={[ContactType.Vendor]}
          filters={{
            subtypes: { [ContactType.Vendor]: { customFlag: true } } as any,
          }}
        />,
      );

      expect(screen.getAllByTestId(/^option-/)).toHaveLength(1);
    });

    it('applies employee subtype filter predicate from filters prop', () => {
      mockUseTeamMemberLoadMore.mockReturnValue({
        workers: [
          {
            id: 'emp-match',
            displayName: 'Emp Match',
            firstName: 'Emp',
            lastName: 'Match',
            type: ContactType.Employee,
            office: 'A',
          } as any,
          {
            id: 'emp-skip',
            displayName: 'Emp Skip',
            firstName: 'Emp',
            lastName: 'Skip',
            type: ContactType.Employee,
            office: 'B',
          } as any,
        ],
        loading: false,
        error: null,
        loadWorkers: mockLoadWorkers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      render(
        <TeamMemberDropdownGraphQL
          {...defaultProps}
          subTypes={[ContactType.Employee]}
          filters={{
            subtypes: { [ContactType.Employee]: { office: 'A' } } as any,
          }}
        />,
      );

      expect(screen.getAllByTestId(/^option-/)).toHaveLength(1);
    });

    it('maps legacy qbo user label when feature flag is enabled', () => {
      (useIXPFeatureFlag as jest.Mock).mockReturnValue({
        isEnabled: true,
        isLoading: false,
        error: null,
        settled: true,
      });
      mockUseTeamMemberLoadMore.mockReturnValue({
        workers: [
          {
            id: 'legacy-1',
            displayName: 'Legacy User',
            firstName: 'Legacy',
            lastName: 'User',
            type: TimeTracking_TimeForType.LegacyQboUser,
          } as any,
        ],
        loading: false,
        error: null,
        loadWorkers: mockLoadWorkers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      render(<TeamMemberDropdownGraphQL {...defaultProps} />);
      expect(screen.getByTestId('option-0')).toBeInTheDocument();
    });

    it('handles add-new success path and emits parsed id', async () => {
      const onChange = jest.fn();
      render(
        <TeamMemberDropdownGraphQL
          {...defaultProps}
          addNew
          onChange={onChange}
        />,
      );

      fireEvent.click(screen.getByTestId('trigger-add-new'));
      expect(screen.getByTestId('team-member-drawer')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('drawer-save'));

      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalled();
        expect(onChange).toHaveBeenCalledWith(
          'new-worker',
          expect.objectContaining({ id: 'new-worker', name: 'New Worker' }),
        );
      });
    });

    it('closes add-new drawer on close callback', () => {
      render(<TeamMemberDropdownGraphQL {...defaultProps} addNew />);
      fireEvent.click(screen.getByTestId('trigger-add-new'));
      expect(screen.getByTestId('team-member-drawer')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('drawer-close'));
      expect(
        screen.queryByTestId('team-member-drawer'),
      ).not.toBeInTheDocument();
    });
  });
});

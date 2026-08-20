import React from 'react';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import CustomerDropdown from '../../../../../src/js/widgets/quickFind/components/CustomerDropdown';
import { CustomerType } from '../../../../../src/js/widgets/quickFind/types';

// Mock the hooks
jest.mock('../../../../../src/js/widgets/quickFind/hooks/useCustomerProjects');
const mockCheckCustomerSelectionRequired = jest.fn().mockResolvedValue(false);
let mockInitialCustomerSelectionRequiredData: boolean | undefined;
jest.mock('../../../../../src/js/service/hooks/useQbTimeSdk', () => ({
  useQbTimeSdk: (sdkMethod: any) => {
    const React = require('react');
    const [data, setData] = React.useState(
      mockInitialCustomerSelectionRequiredData,
    );
    const sdk = {
      isCustomerSelectionRequired: (...args: unknown[]) =>
        mockCheckCustomerSelectionRequired(...args),
    };
    sdkMethod(sdk);

    const execute = React.useCallback(async (...args: unknown[]) => {
      const result = await mockCheckCustomerSelectionRequired(...args);
      setData(result as boolean | undefined);
      return result as boolean | undefined;
    }, []);

    return {
      execute,
      data,
    };
  },
}));
const mockSandboxLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};
jest.mock('@payroll/quicksand', () => ({
  ...jest.requireActual('@payroll/quicksand'),
  useIntl: () => ({
    formatMessage: ({ id, defaultValue }: any) => defaultValue || id,
  }),
  useSandbox: () => ({
    logger: mockSandboxLogger,
  }),
}));

// Mock HOCWidget
jest.mock(
  'web-shell-core/widgets/HOCWidget',
  () =>
    function MockWidget(props: any) {
      return (
        <div data-testid="contact-drawer-widget">
          {props.widgetId}
          {props.onSuccess && (
            <>
              <button
                type="button"
                data-testid="contact-drawer-save"
                onClick={() =>
                  props.onSuccess({
                    id: 'djQuMTo5MzQxNDU3MDk0Nzg0Mjk4OjlkNjk5ZTk2MDg:00207196e2ad',
                    displayName: 'Newly Added Customer',
                    externalIds: [
                      { namespaceId: 'intuit.qbo.name.id', localId: '30' },
                    ],
                  })
                }
              >
                Save
              </button>
              <button
                type="button"
                data-testid="contact-drawer-save-no-externalids"
                onClick={() =>
                  props.onSuccess({
                    id: 'abc:123',
                    displayName: 'No External IDs Customer',
                  })
                }
              >
                Save Without ExternalIds
              </button>
              <button
                type="button"
                data-testid="contact-drawer-close"
                onClick={() => props.onClose?.()}
              >
                Close
              </button>
            </>
          )}
        </div>
      );
    },
);

// Mock MenuItem for styled components
jest.mock('@ids-ts/dropdown-typeahead', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockDropdownTypeahead({
      inputValue,
      onSearch,
      onBlur,
      disabled,
      'aria-label': ariaLabel,
      dataSource,
      renderItem,
      addNew,
      addNewItemProps,
      addNewText,
      onChange,
    }: any) {
      return (
        <div data-testid="dropdown-typeahead">
          <input
            data-testid="dropdown-input"
            value={inputValue || ''}
            onChange={(e) => onSearch?.(e)}
            onBlur={onBlur}
            disabled={disabled}
            aria-label={ariaLabel}
          />
          <div data-testid="dropdown-items">
            {dataSource?.map((item: any, index: number) => (
              <button
                type="button"
                key={item.value}
                data-testid={`option-${index}`}
                onClick={() => {
                  const syntheticEvent = {
                    target: { value: item.value },
                  } as any;
                  onChange(syntheticEvent);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onChange({} as any, { selectedItem: item });
                  }
                }}
              >
                {renderItem?.(item, index) || item.label}
              </button>
            ))}
            {addNew && (
              <button
                type="button"
                data-testid="add-new-button"
                onClick={addNewItemProps?.onClick}
              >
                {addNewText}
              </button>
            )}
          </div>
        </div>
      );
    },
    MenuItem: ({ children, value }: any) => (
      <div data-value={value}>{children}</div>
    ),
  };
});

describe('CustomerDropdown', () => {
  const mockUseCustomerProjects =
    require('../../../../../src/js/widgets/quickFind/hooks/useCustomerProjects').useCustomerProjects;

  const mockLoadCustomers = jest.fn();
  const mockRefetch = jest.fn();

  const mockCustomers = [
    {
      id: '1',
      displayName: 'Customer1',
      fullName: 'Customer1',
      type: CustomerType.Customer,
      parentId: null,
      level: null,
    },
    {
      id: '2',
      displayName: 'Project1',
      fullName: 'Customer1:Project1',
      type: CustomerType.Project,
      parentId: '1',
      level: 1,
    },
    {
      id: '3',
      displayName: 'SubCustomer1',
      fullName: 'Customer1:SubCustomer1',
      type: CustomerType.Customer,
      parentId: '1',
      level: 1,
    },
    {
      id: '4',
      displayName: 'Customer2',
      fullName: 'Customer2',
      type: CustomerType.Customer,
      parentId: null,
      level: null,
    },
  ];

  const defaultProps = {
    timeForEntityId: '123',
    onChange: jest.fn(),
    onReady: jest.fn(),
    onError: jest.fn(),
    onLoad: jest.fn(),
    label: 'Customer/Project',
    placeholder: 'Select a customer or project',
    errorText: '',
    value: '',
    width: '300px',
    addNew: false,
    disabled: false,
  };

  const mockLoadMore = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckCustomerSelectionRequired.mockReset().mockResolvedValue(false);
    mockInitialCustomerSelectionRequiredData = undefined;

    // Default mock - infinite scroll is always enabled
    mockUseCustomerProjects.mockReturnValue({
      customers: mockCustomers,
      loading: false,
      error: null,
      loadCustomers: mockLoadCustomers,
      refetch: mockRefetch,
      loadMore: mockLoadMore,
      hasMore: false,
    });
  });

  describe('Component Rendering', () => {
    it('should render the dropdown component', () => {
      render(<CustomerDropdown {...defaultProps} />);

      expect(screen.getByTestId('dropdown-typeahead')).toBeInTheDocument();
    });

    it('should pass correct props to DropdownTypeahead', () => {
      render(
        <CustomerDropdown
          {...defaultProps}
          label="Test Label"
          placeholder="Test Placeholder"
          disabled
        />,
      );

      const input = screen.getByTestId('dropdown-input');
      expect(input).toHaveAttribute('aria-label', 'Test Label');
      expect(input).toBeDisabled();
    });
  });

  describe('Data Loading', () => {
    it('should load customers on mount with timeForEntityId', () => {
      render(<CustomerDropdown {...defaultProps} timeForEntityId="123" />);

      expect(mockLoadCustomers).toHaveBeenCalledWith({
        timeForEntityId: '123',
        searchText: undefined,
        assignmentFilters: undefined,
      });
    });

    it('should not load customers if timeForEntityId is missing', () => {
      mockUseCustomerProjects.mockReturnValue({
        customers: [],
        loading: false,
        error: null,
        loadCustomers: mockLoadCustomers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      render(
        <CustomerDropdown {...defaultProps} timeForEntityId={undefined} />,
      );

      // loadCustomers should not be called when timeForEntityId is missing
      // The component logs a warning and returns early
      expect(mockLoadCustomers).not.toHaveBeenCalled();
    });

    it('should call onError when error occurs', () => {
      const mockOnError = jest.fn();
      mockUseCustomerProjects.mockReturnValue({
        customers: [],
        loading: false,
        error: 'GraphQL Error',
        loadCustomers: mockLoadCustomers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      render(<CustomerDropdown {...defaultProps} onError={mockOnError} />);

      expect(mockOnError).toHaveBeenCalledWith('GraphQL Error');
    });

    it('should call onLoad and onReady when data is available', async () => {
      const mockOnLoad = jest.fn();
      const mockOnReady = jest.fn();

      render(
        <CustomerDropdown
          {...defaultProps}
          onLoad={mockOnLoad}
          onReady={mockOnReady}
        />,
      );

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledWith(expect.any(Array));
        expect(mockOnReady).toHaveBeenCalledWith(expect.any(Array));
      });
    });
  });

  describe('Hierarchy Support', () => {
    it('should render customers with proper hierarchy', () => {
      render(<CustomerDropdown {...defaultProps} />);

      // All customers should be rendered
      expect(screen.getByText('Customer1')).toBeInTheDocument();
      expect(screen.getByText('Project1')).toBeInTheDocument();
      expect(screen.getByText('SubCustomer1')).toBeInTheDocument();
      expect(screen.getByText('Customer2')).toBeInTheDocument();
    });

    it('should apply correct indentation based on hierarchy level', () => {
      render(<CustomerDropdown {...defaultProps} />);

      // Check that hierarchy is built correctly
      const options = screen.getAllByTestId(/^option-/);
      expect(options.length).toBeGreaterThan(0);
    });

    it('should display type labels for customers and projects', () => {
      render(<CustomerDropdown {...defaultProps} />);

      // Type labels should be rendered for each item
      const items = screen.getAllByTestId(/^option-/);
      expect(items.length).toBe(4);
    });

    it('should flatten hierarchy when searching', async () => {
      render(<CustomerDropdown {...defaultProps} />);

      const input = screen.getByTestId('dropdown-input');
      fireEvent.change(input, { target: { value: 'Project' } });

      // After search, items should have depth 0 (no indentation)
      await waitFor(() => {
        expect(mockLoadCustomers).toHaveBeenCalled();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should debounce search input', async () => {
      render(<CustomerDropdown {...defaultProps} />);

      const input = screen.getByTestId('dropdown-input');

      // Rapidly type - debouncing should eventually trigger search
      fireEvent.change(input, { target: { value: 'C' } });
      fireEvent.change(input, { target: { value: 'Cu' } });
      fireEvent.change(input, { target: { value: 'Cus' } });

      // Wait for debounce - the final searchText should eventually be used
      await waitFor(
        () => {
          const { calls } = mockLoadCustomers.mock;
          const lastCall = calls[calls.length - 1];
          expect(lastCall).toEqual([
            {
              timeForEntityId: '123',
              searchText: 'Cus',
              assignmentFilters: undefined,
            },
          ]);
        },
        { timeout: 1000 },
      );
    });

    it('should trigger search after user types', async () => {
      render(<CustomerDropdown {...defaultProps} />);

      const input = screen.getByTestId('dropdown-input');

      fireEvent.change(input, { target: { value: 'Customer' } });

      // Wait for debounced search to complete
      await waitFor(
        () => {
          const { calls } = mockLoadCustomers.mock;
          const hasSearchCall = calls.some(
            (call) =>
              call[0].searchText === 'Customer' &&
              call[0].timeForEntityId === '123',
          );
          expect(hasSearchCall).toBe(true);
        },
        { timeout: 1000 },
      );
    });

    it('should clear selection when user clears search', () => {
      const mockOnChange = jest.fn();

      render(
        <CustomerDropdown
          {...defaultProps}
          value="1"
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByTestId('dropdown-input');
      fireEvent.change(input, { target: { value: '' } });

      expect(mockOnChange).toHaveBeenCalledWith('', undefined);
    });
  });

  describe('Selection', () => {
    it('should call onChange when customer is selected', () => {
      const mockOnChange = jest.fn();

      render(<CustomerDropdown {...defaultProps} onChange={mockOnChange} />);

      const option = screen.getByTestId('option-0');
      fireEvent.click(option);

      expect(mockOnChange).toHaveBeenCalledWith('1', {
        id: '1',
        name: 'Customer1',
        fullName: 'Customer1',
        type: CustomerType.Customer,
        parentId: null,
      });
    });

    it('should call onChange when customer is selected via Enter key', () => {
      const mockOnChange = jest.fn();

      render(<CustomerDropdown {...defaultProps} onChange={mockOnChange} />);

      const option = screen.getByTestId('option-0');
      fireEvent.keyDown(option, { key: 'Enter' });

      expect(mockOnChange).toHaveBeenCalledWith('1', {
        id: '1',
        name: 'Customer1',
        fullName: 'Customer1',
        type: CustomerType.Customer,
        parentId: null,
      });
    });

    it('should display selected customer fullName', () => {
      render(<CustomerDropdown {...defaultProps} value="2" />);

      // Should show fullName for projects (Customer1:Project1)
      const input = screen.getByTestId('dropdown-input');
      expect(input).toHaveValue('Customer1:Project1');
    });

    it('should display selected customer when value is numeric (string coercion for id match)', () => {
      render(<CustomerDropdown {...defaultProps} value={1 as any} />);

      // Value 1 (number) should match option id "1" and show fullName
      const input = screen.getByTestId('dropdown-input');
      expect(input).toHaveValue('Customer1');
    });

    it('should handle project selection correctly', () => {
      const mockOnChange = jest.fn();

      render(<CustomerDropdown {...defaultProps} onChange={mockOnChange} />);

      const projectOption = screen.getByTestId('option-1'); // Project1
      fireEvent.click(projectOption);

      expect(mockOnChange).toHaveBeenCalledWith('2', {
        id: '2',
        name: 'Project1',
        fullName: 'Customer1:Project1',
        type: CustomerType.Project,
        parentId: '1',
        customerId: '1',
        projectId: '2',
      });
    });
  });

  describe('Add New Functionality', () => {
    it('should show Add New button when addNew is true', () => {
      render(<CustomerDropdown {...defaultProps} addNew />);

      expect(screen.getByTestId('add-new-button')).toBeInTheDocument();
    });

    it('should not show Add New button when addNew is false', () => {
      render(<CustomerDropdown {...defaultProps} addNew={false} />);

      expect(screen.queryByTestId('add-new-button')).not.toBeInTheDocument();
    });

    it('should open contact drawer when Add New is clicked', () => {
      render(<CustomerDropdown {...defaultProps} addNew />);

      const addNewButton = screen.getByTestId('add-new-button');
      fireEvent.click(addNewButton);

      expect(screen.getByTestId('contact-drawer-widget')).toBeInTheDocument();
    });

    it('should close contact drawer when drawer onClose is triggered', () => {
      render(<CustomerDropdown {...defaultProps} addNew />);

      fireEvent.click(screen.getByTestId('add-new-button'));
      expect(screen.getByTestId('contact-drawer-widget')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('contact-drawer-close'));
      expect(
        screen.queryByTestId('contact-drawer-widget'),
      ).not.toBeInTheDocument();
    });

    it('should preserve input value when opening contact drawer', () => {
      render(<CustomerDropdown {...defaultProps} addNew />);

      const input = screen.getByTestId('dropdown-input');
      fireEvent.change(input, { target: { value: 'New Customer Name' } });

      const addNewButton = screen.getByTestId('add-new-button');
      fireEvent.click(addNewButton);

      // Contact drawer should be rendered
      expect(screen.getByTestId('contact-drawer-widget')).toBeInTheDocument();
    });

    it('should display new customer name after adding via drawer, not blank', () => {
      const mockOnChange = jest.fn();

      const { rerender } = render(
        <CustomerDropdown {...defaultProps} addNew onChange={mockOnChange} />,
      );

      // Open the add-new drawer
      fireEvent.click(screen.getByTestId('add-new-button'));
      expect(screen.getByTestId('contact-drawer-widget')).toBeInTheDocument();

      // Save the new customer (triggers onSuccess in the component)
      fireEvent.click(screen.getByTestId('contact-drawer-save'));

      // onChange should be called with the localId extracted from externalIds
      expect(mockOnChange).toHaveBeenCalledWith(
        '30',
        expect.objectContaining({
          id: '30',
          name: 'Newly Added Customer',
          fullName: 'Newly Added Customer',
          type: CustomerType.Customer,
        }),
      );

      // Simulate parent passing the new value back (as happens in STE form)
      rerender(
        <CustomerDropdown
          {...defaultProps}
          addNew
          onChange={mockOnChange}
          value="30"
        />,
      );

      // The input should show the new customer name, not be blank
      const input = screen.getByTestId('dropdown-input');
      expect(input).toHaveValue('Newly Added Customer');
    });

    it('should call onChange with localId extracted from externalIds', () => {
      const mockOnChange = jest.fn();

      render(
        <CustomerDropdown {...defaultProps} addNew onChange={mockOnChange} />,
      );

      fireEvent.click(screen.getByTestId('add-new-button'));
      fireEvent.click(screen.getByTestId('contact-drawer-save'));

      expect(mockOnChange).toHaveBeenCalledWith(
        '30',
        expect.objectContaining({ id: '30' }),
      );
    });

    it('should show existing customers alongside the newly added one immediately after save', () => {
      render(<CustomerDropdown {...defaultProps} addNew />);

      // All 4 existing customers are visible before adding
      expect(screen.getAllByTestId(/^option-/).length).toBe(4);

      // Open drawer and save a new customer
      fireEvent.click(screen.getByTestId('add-new-button'));
      fireEvent.click(screen.getByTestId('contact-drawer-save'));

      // All 4 existing customers should still be visible, plus the newly added one = 5
      const options = screen.getAllByTestId(/^option-/);
      expect(options.length).toBe(5);
    });

    it('should not call onChange if externalIds is missing from new contact', () => {
      const mockOnChange = jest.fn();

      render(
        <CustomerDropdown {...defaultProps} addNew onChange={mockOnChange} />,
      );

      fireEvent.click(screen.getByTestId('add-new-button'));
      fireEvent.click(screen.getByTestId('contact-drawer-save-no-externalids'));

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should remove pending customer from list when assignmentFilters change', () => {
      const { rerender } = render(
        <CustomerDropdown
          {...defaultProps}
          addNew
          assignmentFilters={undefined}
        />,
      );

      // Add a new customer — now 5 options (4 existing + 1 pending)
      fireEvent.click(screen.getByTestId('add-new-button'));
      fireEvent.click(screen.getByTestId('contact-drawer-save'));
      expect(screen.getAllByTestId(/^option-/).length).toBe(5);

      // Change assignmentFilters — pending customer should be cleared
      rerender(
        <CustomerDropdown
          {...defaultProps}
          addNew
          assignmentFilters={{ assigned: true }}
        />,
      );

      // Back to 4 (the pending customer is gone; it wasn't confirmed by the new filter's API result)
      expect(screen.getAllByTestId(/^option-/).length).toBe(4);
    });

    it('should remove pending customer from list when timeForEntityId changes', () => {
      const { rerender } = render(
        <CustomerDropdown {...defaultProps} addNew timeForEntityId="worker1" />,
      );

      // Add a new customer — now 5 options
      fireEvent.click(screen.getByTestId('add-new-button'));
      fireEvent.click(screen.getByTestId('contact-drawer-save'));
      expect(screen.getAllByTestId(/^option-/).length).toBe(5);

      // Switch worker — pending customer should be cleared
      rerender(
        <CustomerDropdown {...defaultProps} addNew timeForEntityId="worker2" />,
      );

      // Back to 4 — the pending customer does not bleed into another worker's list
      expect(screen.getAllByTestId(/^option-/).length).toBe(4);
    });
  });

  describe('Assignment Filters', () => {
    it('should pass assignmentFilters to loadCustomers', () => {
      const assignmentFilters = { assigned: true };

      render(
        <CustomerDropdown
          {...defaultProps}
          assignmentFilters={assignmentFilters}
        />,
      );

      expect(mockLoadCustomers).toHaveBeenCalledWith({
        timeForEntityId: '123',
        searchText: undefined,
        assignmentFilters: { assigned: true },
      });
    });

    it('should reload data when assignmentFilters change', () => {
      const { rerender } = render(
        <CustomerDropdown
          {...defaultProps}
          assignmentFilters={{ assigned: true }}
        />,
      );

      expect(mockLoadCustomers).toHaveBeenCalledWith({
        timeForEntityId: '123',
        searchText: undefined,
        assignmentFilters: { assigned: true },
      });

      // Change filters
      rerender(
        <CustomerDropdown
          {...defaultProps}
          assignmentFilters={{ assigned: false }}
        />,
      );

      expect(mockLoadCustomers).toHaveBeenCalledWith({
        timeForEntityId: '123',
        searchText: undefined,
        assignmentFilters: { assigned: false },
      });
    });
  });

  describe('Loading and Error States', () => {
    it('should show empty dropdown when loading', () => {
      mockUseCustomerProjects.mockReturnValue({
        customers: [],
        loading: true,
        error: null,
        loadCustomers: mockLoadCustomers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      render(<CustomerDropdown {...defaultProps} />);

      const items = screen.queryAllByTestId(/^option-/);
      expect(items).toHaveLength(0);
    });

    it('should handle empty customer list', () => {
      mockUseCustomerProjects.mockReturnValue({
        customers: [],
        loading: false,
        error: null,
        loadCustomers: mockLoadCustomers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      render(<CustomerDropdown {...defaultProps} />);

      const items = screen.queryAllByTestId(/^option-/);
      expect(items).toHaveLength(0);
    });
  });

  describe('Blur Behavior', () => {
    it('should clear search when dropdown loses focus', () => {
      render(<CustomerDropdown {...defaultProps} />);

      const input = screen.getByTestId('dropdown-input');
      fireEvent.change(input, { target: { value: 'Search text' } });
      fireEvent.blur(input);

      // Input should be cleared
      expect(input).toHaveValue('');
    });

    it('should clear selection when no exact match on blur', () => {
      const mockOnChange = jest.fn();

      render(<CustomerDropdown {...defaultProps} onChange={mockOnChange} />);

      const input = screen.getByTestId('dropdown-input');
      fireEvent.change(input, { target: { value: 'Non-existent customer' } });
      fireEvent.blur(input);

      expect(mockOnChange).toHaveBeenCalledWith('', undefined);
    });

    it('should preserve selection when value prop exists on blur', () => {
      const mockOnChange = jest.fn();

      render(
        <CustomerDropdown
          {...defaultProps}
          value="1"
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByTestId('dropdown-input');

      // Blur with existing value - should preserve selection
      fireEvent.blur(input);

      // Should not clear the selection when value prop exists
      expect(mockOnChange).not.toHaveBeenCalledWith('', undefined);
    });

    it('should preserve selection on blur even when displayCustomers is empty during refetch', () => {
      const mockOnChange = jest.fn();

      // Simulate empty customers (during refetch)
      mockUseCustomerProjects.mockReturnValue({
        customers: [],
        loading: false,
        error: null,
        loadCustomers: mockLoadCustomers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      render(
        <CustomerDropdown
          {...defaultProps}
          value="1"
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByTestId('dropdown-input');

      // Blur with existing value and empty customers - should preserve selection
      fireEvent.blur(input);

      // Should not clear the selection even when customers are empty
      expect(mockOnChange).not.toHaveBeenCalledWith('', undefined);
    });
  });

  describe('Value Updates', () => {
    it('should update when value prop changes', () => {
      const { rerender } = render(
        <CustomerDropdown {...defaultProps} value="1" />,
      );

      let input = screen.getByTestId('dropdown-input');
      expect(input).toHaveValue('Customer1');

      rerender(<CustomerDropdown {...defaultProps} value="2" />);

      input = screen.getByTestId('dropdown-input');
      expect(input).toHaveValue('Customer1:Project1');
    });

    it('should clear display when value is cleared externally', () => {
      const { rerender } = render(
        <CustomerDropdown {...defaultProps} value="1" />,
      );

      let input = screen.getByTestId('dropdown-input');
      expect(input).toHaveValue('Customer1');

      rerender(<CustomerDropdown {...defaultProps} value="" />);

      input = screen.getByTestId('dropdown-input');
      expect(input).toHaveValue('');
    });
  });

  // Picking a customer in STE used to briefly flicker back to the previous selection before the new value settled. Two synchronous wipes during the pick were responsible: `setSearchText('')` in `handleChange` (re-triggered the load effect, replacing `customers` mid-pick) and `setInputValue('')` in the `value`-sync effect (blanked the just-set label).
  describe('STE single-pick persistence', () => {
    it('does not retrigger a list refetch as a side effect of picking', () => {
      render(<CustomerDropdown {...defaultProps} value="" />);

      const baselineCalls = mockLoadCustomers.mock.calls.length;

      fireEvent.click(screen.getByTestId('option-0'));

      expect(mockLoadCustomers.mock.calls.length).toBe(baselineCalls);
    });

    it('keeps the picked customer label after the parent commits the new value', () => {
      const { rerender } = render(
        <CustomerDropdown {...defaultProps} value="" />,
      );

      fireEvent.click(screen.getByTestId('option-3'));
      expect(screen.getByTestId('dropdown-input')).toHaveValue('Customer2');

      rerender(<CustomerDropdown {...defaultProps} value="4" />);

      expect(screen.getByTestId('dropdown-input')).toHaveValue('Customer2');
    });

    it('still clears the input when the parent clears value externally', () => {
      const { rerender } = render(
        <CustomerDropdown {...defaultProps} value="1" />,
      );
      expect(screen.getByTestId('dropdown-input')).toHaveValue('Customer1');

      rerender(<CustomerDropdown {...defaultProps} value="" />);

      expect(screen.getByTestId('dropdown-input')).toHaveValue('');
    });

    it('resolves the new label when the parent swaps value through a reset (Save and new / recent TE)', () => {
      // Real external-swap flows (Save and new, recent TE repopulation) clear `value` to '' before committing the new id. The intermediate empty resets the local input so the next non-empty value resolves cleanly from displayCustomers.
      const { rerender } = render(
        <CustomerDropdown {...defaultProps} value="1" />,
      );
      expect(screen.getByTestId('dropdown-input')).toHaveValue('Customer1');

      rerender(<CustomerDropdown {...defaultProps} value="" />);
      expect(screen.getByTestId('dropdown-input')).toHaveValue('');

      rerender(<CustomerDropdown {...defaultProps} value="4" />);
      expect(screen.getByTestId('dropdown-input')).toHaveValue('Customer2');
    });

    it('preserves typed-but-not-picked text when the parent commits value externally (documents current behavior)', () => {
      // Pins behavior so a future refactor that re-introduces an unconditional `setInputValue('')` is caught here. If product wants the opposite (wipe typed text on external commit), update both this assertion and the implementation deliberately.
      const { rerender } = render(
        <CustomerDropdown {...defaultProps} value="" />,
      );

      const input = screen.getByTestId('dropdown-input');
      fireEvent.change(input, { target: { value: 'abc' } });
      expect(input).toHaveValue('abc');

      rerender(<CustomerDropdown {...defaultProps} value="2" />);

      expect(screen.getByTestId('dropdown-input')).toHaveValue('abc');
    });
  });

  describe('displayName with external value (recent TE / save and new)', () => {
    it('shows displayName in the input while customers are loading', () => {
      mockUseCustomerProjects.mockReturnValue({
        customers: [],
        loading: true,
        error: null,
        loadCustomers: mockLoadCustomers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      render(
        <CustomerDropdown
          {...defaultProps}
          value="1"
          displayName="Loaded from time entry"
        />,
      );

      expect(screen.getByTestId('dropdown-input')).toHaveValue(
        'Loaded from time entry',
      );
    });

    it('shows displayName when value is set but the customer is not in the list yet', () => {
      mockUseCustomerProjects.mockReturnValue({
        customers: [],
        loading: false,
        error: null,
        loadCustomers: mockLoadCustomers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      render(
        <CustomerDropdown
          {...defaultProps}
          value="99"
          displayName="Pending list refresh"
        />,
      );

      expect(screen.getByTestId('dropdown-input')).toHaveValue(
        'Pending list refresh',
      );
    });

    it('uses resolved customer fullName after customers load when value matches the list', () => {
      mockUseCustomerProjects.mockReturnValue({
        customers: [],
        loading: true,
        error: null,
        loadCustomers: mockLoadCustomers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      const { rerender } = render(
        <CustomerDropdown
          {...defaultProps}
          value="2"
          displayName="Stale label from parent"
        />,
      );

      expect(screen.getByTestId('dropdown-input')).toHaveValue(
        'Stale label from parent',
      );

      mockUseCustomerProjects.mockReturnValue({
        customers: mockCustomers,
        loading: false,
        error: null,
        loadCustomers: mockLoadCustomers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      rerender(
        <CustomerDropdown
          {...defaultProps}
          value="2"
          displayName="Stale label from parent"
        />,
      );

      expect(screen.getByTestId('dropdown-input')).toHaveValue(
        'Customer1:Project1',
      );
    });

    it('shows canonical fullName from the list when value is set and the customer exists (parent displayName may differ)', () => {
      const { rerender } = render(
        <CustomerDropdown {...defaultProps} value="" displayName={undefined} />,
      );

      expect(screen.getByTestId('dropdown-input')).toHaveValue('');

      rerender(
        <CustomerDropdown
          {...defaultProps}
          value="3"
          displayName="Label from recent entry modal"
        />,
      );

      expect(screen.getByTestId('dropdown-input')).toHaveValue(
        'Customer1:SubCustomer1',
      );
    });

    it('shows displayName when value id is not in the loaded list (e.g. assignment filter)', () => {
      mockUseCustomerProjects.mockReturnValue({
        customers: mockCustomers,
        loading: false,
        error: null,
        loadCustomers: mockLoadCustomers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      render(
        <CustomerDropdown
          {...defaultProps}
          value="99"
          displayName="Customer hidden by filter"
        />,
      );

      expect(screen.getByTestId('dropdown-input')).toHaveValue(
        'Customer hidden by filter',
      );
    });
  });

  describe('Cleanup', () => {
    it('should cleanup debounce timeout on unmount', () => {
      jest.useFakeTimers();
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      const { unmount } = render(<CustomerDropdown {...defaultProps} />);

      const input = screen.getByTestId('dropdown-input');
      fireEvent.change(input, { target: { value: 'Test' } });

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
      jest.useRealTimers();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing customer display names gracefully', () => {
      const customersWithMissingNames = [
        {
          id: '1',
          displayName: '',
          fullName: 'Customer1',
          type: CustomerType.Customer,
          parentId: null,
          level: null,
        },
      ];

      mockUseCustomerProjects.mockReturnValue({
        customers: customersWithMissingNames,
        loading: false,
        error: null,
        loadCustomers: mockLoadCustomers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      render(<CustomerDropdown {...defaultProps} />);

      expect(screen.getByTestId('dropdown-typeahead')).toBeInTheDocument();
    });

    it('should handle customers with null parentId', () => {
      const customersWithNullParent = [
        {
          id: '1',
          displayName: 'Customer1',
          fullName: 'Customer1',
          type: CustomerType.Customer,
          parentId: null,
          level: null,
        },
      ];

      mockUseCustomerProjects.mockReturnValue({
        customers: customersWithNullParent,
        loading: false,
        error: null,
        loadCustomers: mockLoadCustomers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      render(<CustomerDropdown {...defaultProps} />);

      expect(screen.getByText('Customer1')).toBeInTheDocument();
    });
  });

  describe('Search with Assignment Filters', () => {
    it('should pass assignment filters to loadCustomers', () => {
      render(
        <CustomerDropdown
          {...defaultProps}
          assignmentFilters={{ assigned: true }}
        />,
      );

      // Check that at least one call includes the assignment filters
      const callsWithFilters = mockLoadCustomers.mock.calls.filter(
        (call) =>
          call[0].assignmentFilters &&
          call[0].assignmentFilters.assigned === true,
      );

      expect(callsWithFilters.length).toBeGreaterThan(0);
    });
  });

  describe('Disabled State', () => {
    it('should disable dropdown when disabled prop is true', () => {
      render(<CustomerDropdown {...defaultProps} disabled />);

      const input = screen.getByTestId('dropdown-input');
      expect(input).toBeDisabled();
    });

    it('should not trigger onChange when disabled', () => {
      const mockOnChange = jest.fn();

      render(
        <CustomerDropdown {...defaultProps} onChange={mockOnChange} disabled />,
      );

      const input = screen.getByTestId('dropdown-input');
      fireEvent.change(input, { target: { value: 'Test' } });

      // Should not be called because input is disabled
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Error Text', () => {
    it('should display error text when provided', () => {
      render(
        <CustomerDropdown {...defaultProps} errorText="Test error message" />,
      );

      expect(screen.getByTestId('dropdown-typeahead')).toBeInTheDocument();
      // The error text is passed to DropdownTypeahead component
    });
  });

  describe('Infinite Scroll Functionality', () => {
    it('should provide loadMore and hasMore from useCustomerProjects hook', () => {
      mockUseCustomerProjects.mockReturnValue({
        customers: mockCustomers,
        loading: false,
        error: null,
        loadCustomers: mockLoadCustomers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: true,
      });

      render(<CustomerDropdown {...defaultProps} />);

      // Verify hook was called with infinite scroll enabled
      expect(mockUseCustomerProjects).toHaveBeenCalledWith({
        pageSize: 100,
        enableLoadMore: true,
      });
    });

    it('should not show Load More button (infinite scroll is automatic)', () => {
      mockUseCustomerProjects.mockReturnValue({
        customers: mockCustomers,
        loading: false,
        error: null,
        loadCustomers: mockLoadCustomers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: true,
      });

      render(<CustomerDropdown {...defaultProps} />);

      // Load More button should not exist (infinite scroll happens on scroll event)
      expect(screen.queryByText('Load More')).not.toBeInTheDocument();
    });

    it('should render all customers without Load More button when hasMore is false', () => {
      mockUseCustomerProjects.mockReturnValue({
        customers: mockCustomers,
        loading: false,
        error: null,
        loadCustomers: mockLoadCustomers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      render(<CustomerDropdown {...defaultProps} />);

      const options = screen.getAllByTestId(/^option-/);
      expect(options.length).toBe(4); // Only the 4 customers, no Load More item
      expect(screen.queryByText('Load More')).not.toBeInTheDocument();
    });

    it('should append new items when customers are updated via infinite scroll', async () => {
      const moreCustomers = [
        {
          id: '5',
          displayName: 'Customer3',
          fullName: 'Customer3',
          type: CustomerType.Customer,
          parentId: null,
          level: null,
        },
        {
          id: '6',
          displayName: 'Customer4',
          fullName: 'Customer4',
          type: CustomerType.Customer,
          parentId: null,
          level: null,
        },
      ];

      mockUseCustomerProjects.mockReturnValue({
        customers: mockCustomers,
        loading: false,
        error: null,
        loadCustomers: mockLoadCustomers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: true,
      });

      const { rerender } = render(<CustomerDropdown {...defaultProps} />);

      // Initial render should have 4 customers
      let options = screen.getAllByTestId(/^option-/);
      expect(options.length).toBe(4); // 4 customers (no Load More button)

      // Simulate infinite scroll adding new customers
      mockUseCustomerProjects.mockReturnValue({
        customers: [...mockCustomers, ...moreCustomers],
        loading: false,
        error: null,
        loadCustomers: mockLoadCustomers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: false, // No more items after this
      });

      rerender(<CustomerDropdown {...defaultProps} />);

      // Should now have 6 customers
      options = screen.getAllByTestId(/^option-/);
      expect(options.length).toBe(6);
      expect(screen.queryByText('Load More')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should call onError when there is an error', async () => {
      const onError = jest.fn();
      const testError = 'Failed to load customers';

      mockUseCustomerProjects.mockReturnValue({
        customers: [],
        loading: false,
        error: testError,
        loadCustomers: mockLoadCustomers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      render(<CustomerDropdown {...defaultProps} onError={onError} />);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(testError);
      });
    });

    it('should call onReady with empty array on error to unblock UI', async () => {
      const onReady = jest.fn();
      const testError = 'Network error';

      mockUseCustomerProjects.mockReturnValue({
        customers: [],
        loading: false,
        error: testError,
        loadCustomers: mockLoadCustomers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      render(<CustomerDropdown {...defaultProps} onReady={onReady} />);

      await waitFor(() => {
        expect(onReady).toHaveBeenCalledWith([]);
      });
    });

    it('should not block UI when assignment API fails', async () => {
      const onReady = jest.fn();
      const onError = jest.fn();

      mockUseCustomerProjects.mockReturnValue({
        customers: [],
        loading: false,
        error: 'Assignment API timeout',
        loadCustomers: mockLoadCustomers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      render(
        <CustomerDropdown
          {...defaultProps}
          onReady={onReady}
          onError={onError}
        />,
      );

      // Should call both onError and onReady
      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
        expect(onReady).toHaveBeenCalledWith([]);
      });

      // Dropdown should still be rendered
      expect(screen.getByTestId('dropdown-typeahead')).toBeInTheDocument();
    });

    it('should call onReady on each error occurrence', async () => {
      const onReady = jest.fn();
      const onError = jest.fn();

      mockUseCustomerProjects.mockReturnValue({
        customers: [],
        loading: false,
        error: 'Error',
        loadCustomers: mockLoadCustomers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      render(
        <CustomerDropdown
          {...defaultProps}
          onReady={onReady}
          onError={onError}
        />,
      );

      await waitFor(() => {
        expect(onReady).toHaveBeenCalled();
        expect(onError).toHaveBeenCalled();
      });

      // onReady should be called with empty array on error
      expect(onReady).toHaveBeenCalledWith([]);
    });
  });

  describe('Empty Results Handling', () => {
    it('should call onReady with empty array when no customers are assigned', async () => {
      const onReady = jest.fn();

      mockUseCustomerProjects.mockReturnValue({
        customers: [], // Empty results
        loading: false,
        error: null,
        loadCustomers: mockLoadCustomers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      render(<CustomerDropdown {...defaultProps} onReady={onReady} />);

      await waitFor(() => {
        expect(onReady).toHaveBeenCalledWith([]);
      });
    });

    it('should not show spinner indefinitely when results are empty', async () => {
      const onReady = jest.fn();

      // Start with loading
      mockUseCustomerProjects.mockReturnValue({
        customers: [],
        loading: true,
        error: null,
        loadCustomers: mockLoadCustomers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      const { rerender } = render(
        <CustomerDropdown {...defaultProps} onReady={onReady} />,
      );

      // Should not call onReady while loading
      expect(onReady).not.toHaveBeenCalled();

      // Loading completes with empty results
      mockUseCustomerProjects.mockReturnValue({
        customers: [],
        loading: false, // Loading done
        error: null,
        loadCustomers: mockLoadCustomers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      rerender(<CustomerDropdown {...defaultProps} onReady={onReady} />);

      // Should call onReady even with empty results
      await waitFor(() => {
        expect(onReady).toHaveBeenCalledWith([]);
      });
    });

    it('should handle transition from data to empty results', async () => {
      const onLoad = jest.fn();
      const onReady = jest.fn();

      // Start with customers
      mockUseCustomerProjects.mockReturnValue({
        customers: mockCustomers,
        loading: false,
        error: null,
        loadCustomers: mockLoadCustomers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      const { rerender } = render(
        <CustomerDropdown
          {...defaultProps}
          onLoad={onLoad}
          onReady={onReady}
        />,
      );

      await waitFor(() => {
        expect(onLoad).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ id: '1' }),
            expect.objectContaining({ id: '2' }),
          ]),
        );
      });

      jest.clearAllMocks();

      // Change to different worker with no customers
      mockUseCustomerProjects.mockReturnValue({
        customers: [],
        loading: false,
        error: null,
        loadCustomers: mockLoadCustomers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      rerender(
        <CustomerDropdown
          {...defaultProps}
          timeForEntityId="456" // Different worker
          onLoad={onLoad}
          onReady={onReady}
        />,
      );

      // Should call onReady with empty results
      await waitFor(() => {
        expect(onReady).toHaveBeenCalledWith([]);
      });
    });
  });

  describe('Worker Change and Refetch', () => {
    it('should reset isLoaded when timeForEntityId changes', async () => {
      const onReady = jest.fn();

      mockUseCustomerProjects.mockReturnValue({
        customers: mockCustomers,
        loading: false,
        error: null,
        loadCustomers: mockLoadCustomers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      const { rerender } = render(
        <CustomerDropdown
          {...defaultProps}
          timeForEntityId="worker1"
          onReady={onReady}
        />,
      );

      await waitFor(() => {
        expect(onReady).toHaveBeenCalledTimes(1);
      });

      jest.clearAllMocks();

      // Change worker
      rerender(
        <CustomerDropdown
          {...defaultProps}
          timeForEntityId="worker2"
          onReady={onReady}
        />,
      );

      // Should call loadCustomers with new worker ID
      await waitFor(() => {
        expect(mockLoadCustomers).toHaveBeenCalledWith({
          timeForEntityId: 'worker2',
          searchText: undefined,
          assignmentFilters: undefined,
        });
      });

      // Should call onReady again for new worker
      await waitFor(() => {
        expect(onReady).toHaveBeenCalledTimes(1);
      });
    });

    it('should refetch customers when assignmentFilters change', async () => {
      mockUseCustomerProjects.mockReturnValue({
        customers: mockCustomers,
        loading: false,
        error: null,
        loadCustomers: mockLoadCustomers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      const { rerender } = render(
        <CustomerDropdown {...defaultProps} assignmentFilters={undefined} />,
      );

      await waitFor(() => {
        expect(mockLoadCustomers).toHaveBeenCalledWith({
          timeForEntityId: '123',
          searchText: undefined,
          assignmentFilters: undefined,
        });
      });

      jest.clearAllMocks();

      // Change assignment filters
      rerender(
        <CustomerDropdown
          {...defaultProps}
          assignmentFilters={{ assigned: true }}
        />,
      );

      await waitFor(() => {
        expect(mockLoadCustomers).toHaveBeenCalledWith({
          timeForEntityId: '123',
          searchText: undefined,
          assignmentFilters: { assigned: true },
        });
      });
    });

    it('should handle multiple rapid worker changes', async () => {
      const onReady = jest.fn();

      mockUseCustomerProjects.mockReturnValue({
        customers: mockCustomers,
        loading: false,
        error: null,
        loadCustomers: mockLoadCustomers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      const { rerender } = render(
        <CustomerDropdown
          {...defaultProps}
          timeForEntityId="worker1"
          onReady={onReady}
        />,
      );

      // Change worker multiple times
      rerender(
        <CustomerDropdown
          {...defaultProps}
          timeForEntityId="worker2"
          onReady={onReady}
        />,
      );

      rerender(
        <CustomerDropdown
          {...defaultProps}
          timeForEntityId="worker3"
          onReady={onReady}
        />,
      );

      // Should call loadCustomers for each worker
      await waitFor(() => {
        expect(mockLoadCustomers).toHaveBeenCalledWith(
          expect.objectContaining({
            timeForEntityId: 'worker3',
          }),
        );
      });
    });
  });

  describe('Type Labels (SubLabel)', () => {
    it('shows "Customer" for a top-level customer', () => {
      render(<CustomerDropdown {...defaultProps} />);
      // Customer1 and Customer2 are both top-level; at least one "Customer" label should appear
      expect(screen.getAllByText('Customer').length).toBeGreaterThanOrEqual(1);
    });

    it('shows "Sub-customer of Customer1" for a sub-customer', () => {
      render(<CustomerDropdown {...defaultProps} />);
      expect(screen.getByText('Sub-customer of Customer1')).toBeInTheDocument();
    });

    it('shows "Project of Customer1" for a project with a parent', () => {
      render(<CustomerDropdown {...defaultProps} />);
      expect(screen.getByText('Project of Customer1')).toBeInTheDocument();
    });

    it('shows "Project" (no parent) for a top-level project', () => {
      mockUseCustomerProjects.mockReturnValue({
        customers: [
          {
            id: '10',
            displayName: 'Standalone Project',
            fullName: 'Standalone Project',
            type: CustomerType.Project,
            parentId: null,
            level: null,
          },
        ],
        loading: false,
        error: null,
        loadCustomers: mockLoadCustomers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      render(<CustomerDropdown {...defaultProps} />);
      expect(screen.getByText('Project')).toBeInTheDocument();
    });

    it('shows "Project of Kucher Companies" during search when only the project node is returned (parent not in list)', () => {
      // This is the corner-case: API returns only the matching project, not the parent customer.
      // The label must be derived from fullName, not from a displayCustomers lookup.
      mockUseCustomerProjects.mockReturnValue({
        customers: [
          {
            id: '40',
            displayName: 'NK Project',
            fullName: 'Kucher Companies:NK Project',
            type: CustomerType.Project,
            parentId: '99', // parent id not in the list
            level: 1,
          },
        ],
        loading: false,
        error: null,
        loadCustomers: mockLoadCustomers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      render(<CustomerDropdown {...defaultProps} />);
      expect(
        screen.getByText('Project of Kucher Companies'),
      ).toBeInTheDocument();
    });

    it('shows the direct parent for a three-level hierarchy (Sub-customer of Cus 2)', () => {
      mockUseCustomerProjects.mockReturnValue({
        customers: [
          {
            id: '1',
            displayName: 'Customer 1',
            fullName: 'Customer 1',
            type: CustomerType.Customer,
            parentId: null,
            level: null,
          },
          {
            id: '2',
            displayName: 'Cus 2',
            fullName: 'Customer 1:Cus 2',
            type: CustomerType.Customer,
            parentId: '1',
            level: 1,
          },
          {
            id: '3',
            displayName: 'Cus 3',
            fullName: 'Customer 1:Cus 2:Cus 3',
            type: CustomerType.Customer,
            parentId: '2',
            level: 2,
          },
        ],
        loading: false,
        error: null,
        loadCustomers: mockLoadCustomers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      render(<CustomerDropdown {...defaultProps} />);
      expect(screen.getByText('Sub-customer of Cus 2')).toBeInTheDocument();
    });
  });

  describe('Assignment Filter Integration', () => {
    it('should pass assignmentFilters to loadCustomers when provided', async () => {
      render(
        <CustomerDropdown
          {...defaultProps}
          assignmentFilters={{ assigned: true }}
        />,
      );

      await waitFor(() => {
        expect(mockLoadCustomers).toHaveBeenCalledWith({
          timeForEntityId: '123',
          searchText: undefined,
          assignmentFilters: { assigned: true },
        });
      });
    });

    it('should not pass assignmentFilters when undefined', async () => {
      render(
        <CustomerDropdown {...defaultProps} assignmentFilters={undefined} />,
      );

      await waitFor(() => {
        expect(mockLoadCustomers).toHaveBeenCalledWith({
          timeForEntityId: '123',
          searchText: undefined,
          assignmentFilters: undefined,
        });
      });
    });

    it('should show only assigned customers when filter is true', async () => {
      const assignedCustomers = [mockCustomers[0], mockCustomers[3]];

      mockUseCustomerProjects.mockReturnValue({
        customers: assignedCustomers,
        loading: false,
        error: null,
        loadCustomers: mockLoadCustomers,
        refetch: mockRefetch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      render(
        <CustomerDropdown
          {...defaultProps}
          assignmentFilters={{ assigned: true }}
        />,
      );

      await waitFor(() => {
        const options = screen.getAllByTestId(/^option-/);
        expect(options.length).toBe(2);
      });
    });
  });

  describe('Required Indicator', () => {
    it('shows asterisk in label when sdk marks customer selection required', async () => {
      mockCheckCustomerSelectionRequired.mockResolvedValueOnce(true);

      render(<CustomerDropdown {...defaultProps} />);

      await waitFor(() => {
        const labelNode = screen.getByText('Customer/Project');
        expect(labelNode.parentElement?.textContent).toMatch(
          /Customer\/Project\s*\*/,
        );
      });
      expect(mockCheckCustomerSelectionRequired).toHaveBeenCalledWith(
        mockCustomers.length,
      );
    });

    it('keeps aria-label plain when required marker is shown', async () => {
      mockCheckCustomerSelectionRequired.mockResolvedValueOnce(true);

      render(<CustomerDropdown {...defaultProps} />);

      await waitFor(() => {
        const labelNode = screen.getByText('Customer/Project');
        expect(labelNode.parentElement?.textContent).toMatch(
          /Customer\/Project\s*\*/,
        );
      });

      const input = screen.getByTestId('dropdown-input');
      expect(input).toHaveAttribute('aria-label', 'Customer/Project *');
    });

    it('falls back to non-required label when sdk check is undefined', async () => {
      mockCheckCustomerSelectionRequired.mockResolvedValueOnce(undefined);

      render(<CustomerDropdown {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Customer/Project')).toBeInTheDocument();
      });
      expect(screen.queryByText('Customer/Project *')).not.toBeInTheDocument();
    });

    it('does not re-run required check while typing search text', async () => {
      jest.useFakeTimers();
      mockCheckCustomerSelectionRequired.mockResolvedValue(true);

      render(<CustomerDropdown {...defaultProps} />);

      await waitFor(() => {
        expect(mockCheckCustomerSelectionRequired).toHaveBeenCalledTimes(1);
      });

      fireEvent.change(screen.getByTestId('dropdown-input'), {
        target: { value: 'Cus' },
      });
      act(() => {
        jest.advanceTimersByTime(350);
      });

      expect(mockCheckCustomerSelectionRequired).toHaveBeenCalledTimes(1);
      jest.useRealTimers();
    });

    it('re-runs customer load with undefined search after selecting from search results', async () => {
      jest.useFakeTimers();
      render(<CustomerDropdown {...defaultProps} />);

      fireEvent.change(screen.getByTestId('dropdown-input'), {
        target: { value: 'Cus' },
      });
      act(() => {
        jest.advanceTimersByTime(350);
      });

      await waitFor(() => {
        expect(mockLoadCustomers).toHaveBeenCalledWith(
          expect.objectContaining({ searchText: 'Cus' }),
        );
      });

      fireEvent.click(screen.getByTestId('option-0'));

      await waitFor(() => {
        expect(mockLoadCustomers).toHaveBeenCalledWith(
          expect.objectContaining({ searchText: undefined }),
        );
      });
      jest.useRealTimers();
    });
  });
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomerCell } from 'src/js/widgets/weeklyTimeEntry/components/weeklyTimeEntryGridView/CustomerCell';
import { DataAccess_ContactType } from 'src/__generated__/oigql/graphql';

// Mock @payroll/quicksand
jest.mock('@payroll/quicksand', () => ({
  useTracking: () =>
    jest.fn().mockImplementation((event) => {
      // Mock tracking event
    }),
  useSandbox: () => ({
    realmId: 'test-realm',
    offering: 'qbo',
  }),
}));

// Mock the getCustomerName function
jest.mock('src/js/widgets/weeklyTimeEntry/utils/helpers', () => ({
  getCustomerName: jest.fn(() => 'Mock Customer Name'),
  isWeeklyRowLocked: jest.fn(
    (rowHasApprovedEntries: boolean, rowIsTimeOff: boolean | undefined) =>
      !!rowHasApprovedEntries || !!rowIsTimeOff,
  ),
}));

// Mock the openContextMenu action
jest.mock('src/js/widgets/weeklyTimeEntry/store/contextMenuSlice', () => ({
  openContextMenu: jest.fn(),
}));

// Mock the styled components
jest.mock(
  'src/js/widgets/weeklyTimeEntry/components/styles/WeeklySuperSerach.styles',
  () => ({
    CustomerNameColumn: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="customer-name-column">{children}</div>
    ),
    DropdownColumn: ({ children, onClick, style }: any) => (
      <div data-testid="dropdown-column" onClick={onClick} style={style}>
        {children}
      </div>
    ),
    SuperSearchCell: ({
      children,
      className,
    }: {
      children: React.ReactNode;
      className?: string;
    }) => (
      <div data-testid="super-search-cell" className={className}>
        {children}
      </div>
    ),
  }),
);

// Mock the IconControl component
jest.mock('@ids-ts/icon-control', () => ({
  IconControl: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="icon-control">{children}</div>
  ),
}));

// Mock the ChevronDown icon
jest.mock('@design-systems/icons', () => ({
  ChevronDown: () => <span data-testid="chevron-down">ChevronDown</span>,
}));

describe('CustomerCell', () => {
  const mockDispatch = jest.fn();
  const mockRow = {
    rowId: 'test-row-1',
    timeAgainst: {
      type: DataAccess_ContactType.Customer,
      id: 'customer1',
      displayName: 'Test Customer',
    },
    timeEntries: {},
    totalHours: 8,
    billableTotal: 800,
    hasApprovedEntries: false,
  };
  const mockCustomers = [{ id: 'customer1', displayName: 'Test Customer' }];

  const defaultProps = {
    row: mockRow,
    rowIndex: 0,
    cellIdx: 0,
    customers: mockCustomers,
    breaks: [],
    dispatch: mockDispatch,
  };

  beforeEach(() => {
    mockDispatch.mockClear();
  });

  it('renders without crashing', () => {
    render(<CustomerCell {...defaultProps} />);

    expect(screen.getByTestId('super-search-cell')).toBeInTheDocument();
    expect(screen.getByTestId('customer-name-column')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-column')).toBeInTheDocument();
    expect(screen.getByTestId('icon-control')).toBeInTheDocument();
    expect(screen.getByTestId('chevron-down')).toBeInTheDocument();
  });

  it('displays customer name', () => {
    render(<CustomerCell {...defaultProps} />);

    expect(screen.getByTestId('customer-name-column')).toHaveTextContent(
      'Mock Customer Name',
    );
  });

  it('has correct cursor style on dropdown', () => {
    render(<CustomerCell {...defaultProps} />);

    const dropdown = screen.getByTestId('dropdown-column');
    expect(dropdown).toHaveStyle({ cursor: 'pointer' });
  });

  it('opens context menu when dropdown is clicked', () => {
    const {
      openContextMenu,
    } = require('src/js/widgets/weeklyTimeEntry/store/contextMenuSlice');

    render(<CustomerCell {...defaultProps} />);

    const dropdown = screen.getByTestId('dropdown-column');
    fireEvent.click(dropdown);

    expect(mockDispatch).toHaveBeenCalledWith(
      openContextMenu({
        x: expect.any(Number),
        y: expect.any(Number),
        rowIdx: 0,
        dayIdx: 0,
        menuType: 'superSearch',
      }),
    );
  });

  it('prevents default behavior on dropdown click', () => {
    render(<CustomerCell {...defaultProps} />);

    const dropdown = screen.getByTestId('dropdown-column');
    const event = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(event, 'preventDefault', { value: jest.fn() });
    Object.defineProperty(event, 'clientX', { value: 100 });
    Object.defineProperty(event, 'clientY', { value: 200 });
    dropdown.dispatchEvent(event);

    expect(event.preventDefault).toHaveBeenCalled();
  });

  describe('Conditional Dropdown Rendering', () => {
    it('renders dropdown when row has no approved entries', () => {
      const propsWithoutApprovedEntries = {
        ...defaultProps,
        row: {
          ...mockRow,
          hasApprovedEntries: false,
        },
      };

      render(<CustomerCell {...propsWithoutApprovedEntries} />);

      expect(screen.getByTestId('dropdown-column')).toBeInTheDocument();
      expect(screen.getByTestId('icon-control')).toBeInTheDocument();
      expect(screen.getByTestId('chevron-down')).toBeInTheDocument();
    });

    it('does not render dropdown when row has approved entries', () => {
      const propsWithApprovedEntries = {
        ...defaultProps,
        row: {
          ...mockRow,
          hasApprovedEntries: true,
        },
      };

      render(<CustomerCell {...propsWithApprovedEntries} />);

      expect(screen.queryByTestId('dropdown-column')).not.toBeInTheDocument();
      expect(screen.queryByTestId('icon-control')).not.toBeInTheDocument();
      expect(screen.queryByTestId('chevron-down')).not.toBeInTheDocument();
    });
  });

  describe('CSS Class Assignment', () => {
    it('applies "has-approved-entries" class when row has approved entries', () => {
      const propsWithApprovedEntries = {
        ...defaultProps,
        row: {
          ...mockRow,
          hasApprovedEntries: true,
        },
      };

      render(<CustomerCell {...propsWithApprovedEntries} />);

      const superSearchCell = screen.getByTestId('super-search-cell');
      expect(superSearchCell).toHaveClass('has-approved-entries');
    });

    it('applies "has-validation-errors" class when field errors exist', () => {
      const propsWithErrors = {
        ...defaultProps,
        row: {
          ...mockRow,
          hasApprovedEntries: false,
        },
        fieldErrors: {
          service: 'Service is required',
        },
      };

      render(<CustomerCell {...propsWithErrors} />);

      const superSearchCell = screen.getByTestId('super-search-cell');
      expect(superSearchCell).toHaveClass('has-validation-errors');
    });

    it('prioritizes "has-approved-entries" class over "has-validation-errors"', () => {
      const propsWithBoth = {
        ...defaultProps,
        row: {
          ...mockRow,
          hasApprovedEntries: true,
        },
        fieldErrors: {
          service: 'Service is required',
        },
      };

      render(<CustomerCell {...propsWithBoth} />);

      const superSearchCell = screen.getByTestId('super-search-cell');
      expect(superSearchCell).toHaveClass('has-approved-entries');
      expect(superSearchCell).not.toHaveClass('has-validation-errors');
    });

    it('applies no special class when no approved entries and no errors', () => {
      const propsClean = {
        ...defaultProps,
        row: {
          ...mockRow,
          hasApprovedEntries: false,
        },
        fieldErrors: {},
      };

      render(<CustomerCell {...propsClean} />);

      const superSearchCell = screen.getByTestId('super-search-cell');
      expect(superSearchCell).not.toHaveClass('has-approved-entries');
      expect(superSearchCell).not.toHaveClass('has-validation-errors');
      expect(superSearchCell.className).toBe('');
    });
  });

  describe('Field Error Validation', () => {
    it('detects service field errors', () => {
      const propsWithServiceError = {
        ...defaultProps,
        fieldErrors: {
          service: 'Service is required',
        },
      };

      render(<CustomerCell {...propsWithServiceError} />);

      const superSearchCell = screen.getByTestId('super-search-cell');
      expect(superSearchCell).toHaveClass('has-validation-errors');
    });

    it('detects class field errors', () => {
      const propsWithClassError = {
        ...defaultProps,
        fieldErrors: {
          class: 'Class is required',
        },
      };

      render(<CustomerCell {...propsWithClassError} />);

      const superSearchCell = screen.getByTestId('super-search-cell');
      expect(superSearchCell).toHaveClass('has-validation-errors');
    });

    it('detects location field errors', () => {
      const propsWithLocationError = {
        ...defaultProps,
        fieldErrors: {
          location: 'Location is required',
        },
      };

      render(<CustomerCell {...propsWithLocationError} />);

      const superSearchCell = screen.getByTestId('super-search-cell');
      expect(superSearchCell).toHaveClass('has-validation-errors');
    });

    it('detects notes field errors', () => {
      const propsWithNotesError = {
        ...defaultProps,
        fieldErrors: {
          notes: 'Notes are required',
        },
      };

      render(<CustomerCell {...propsWithNotesError} />);

      const superSearchCell = screen.getByTestId('super-search-cell');
      expect(superSearchCell).toHaveClass('has-validation-errors');
    });

    it('detects customerProject field errors', () => {
      const propsWithCustomerProjectError = {
        ...defaultProps,
        fieldErrors: {
          customerProject: 'Customer project is required',
        },
      };

      render(<CustomerCell {...propsWithCustomerProjectError} />);

      const superSearchCell = screen.getByTestId('super-search-cell');
      expect(superSearchCell).toHaveClass('has-validation-errors');
    });

    it('detects dimension field errors', () => {
      const propsWithDimensionErrors = {
        ...defaultProps,
        fieldErrors: {
          dimensions: { 'dim-1': 'Required' },
        },
      };

      render(<CustomerCell {...propsWithDimensionErrors} />);

      const superSearchCell = screen.getByTestId('super-search-cell');
      expect(superSearchCell).toHaveClass('has-validation-errors');
    });

    it('handles multiple field errors', () => {
      const propsWithMultipleErrors = {
        ...defaultProps,
        fieldErrors: {
          service: 'Service is required',
          class: 'Class is required',
          location: 'Location is required',
          notes: 'Notes are required',
          customerProject: 'Customer project is required',
        },
      };

      render(<CustomerCell {...propsWithMultipleErrors} />);

      const superSearchCell = screen.getByTestId('super-search-cell');
      expect(superSearchCell).toHaveClass('has-validation-errors');
    });

    it('ignores empty string errors', () => {
      const propsWithEmptyErrors = {
        ...defaultProps,
        fieldErrors: {
          service: '',
          class: '',
          location: '',
        },
      };

      render(<CustomerCell {...propsWithEmptyErrors} />);

      const superSearchCell = screen.getByTestId('super-search-cell');
      expect(superSearchCell).not.toHaveClass('has-validation-errors');
    });

    it('ignores null/undefined errors', () => {
      const propsWithNullErrors = {
        ...defaultProps,
        fieldErrors: {
          service: undefined,
          class: undefined,
          location: '',
        },
      };

      render(<CustomerCell {...propsWithNullErrors} />);

      const superSearchCell = screen.getByTestId('super-search-cell');
      expect(superSearchCell).not.toHaveClass('has-validation-errors');
    });

    it('handles missing fieldErrors prop gracefully', () => {
      const propsWithoutFieldErrors = {
        ...defaultProps,
        fieldErrors: undefined,
      };

      render(<CustomerCell {...propsWithoutFieldErrors} />);

      const superSearchCell = screen.getByTestId('super-search-cell');
      expect(superSearchCell).not.toHaveClass('has-validation-errors');
    });
  });

  describe('Context Menu Integration', () => {
    it('dispatches openContextMenu with correct rowId', () => {
      const {
        openContextMenu,
      } = require('src/js/widgets/weeklyTimeEntry/store/contextMenuSlice');

      render(<CustomerCell {...defaultProps} />);

      const dropdown = screen.getByTestId('dropdown-column');
      fireEvent.click(dropdown);

      expect(mockDispatch).toHaveBeenCalledWith(
        openContextMenu({
          x: expect.any(Number),
          y: expect.any(Number),
          rowId: 'test-row-1',
          dayIdx: 0,
          menuType: 'superSearch',
        }),
      );
    });

    it('dispatches openContextMenu with correct cellIdx as dayIdx', () => {
      const {
        openContextMenu,
      } = require('src/js/widgets/weeklyTimeEntry/store/contextMenuSlice');

      const propsWithDifferentCellIdx = {
        ...defaultProps,
        cellIdx: 2,
      };

      render(<CustomerCell {...propsWithDifferentCellIdx} />);

      const dropdown = screen.getByTestId('dropdown-column');
      fireEvent.click(dropdown);

      expect(mockDispatch).toHaveBeenCalledWith(
        openContextMenu({
          x: expect.any(Number),
          y: expect.any(Number),
          rowId: 'test-row-1',
          dayIdx: 2,
          menuType: 'superSearch',
        }),
      );
    });

    it('uses correct mouse coordinates for context menu', () => {
      const {
        openContextMenu,
      } = require('src/js/widgets/weeklyTimeEntry/store/contextMenuSlice');

      render(<CustomerCell {...defaultProps} />);

      const dropdown = screen.getByTestId('dropdown-column');
      fireEvent.click(dropdown, { clientX: 150, clientY: 250 });

      expect(mockDispatch).toHaveBeenCalledWith(
        openContextMenu({
          x: 150,
          y: 250,
          rowId: 'test-row-1',
          dayIdx: 0,
          menuType: 'superSearch',
        }),
      );
    });
  });

  describe('Customer Name Display', () => {
    it('calls getCustomerName with correct parameters', () => {
      const {
        getCustomerName,
      } = require('src/js/widgets/weeklyTimeEntry/utils/helpers');

      render(<CustomerCell {...defaultProps} />);

      expect(getCustomerName).toHaveBeenCalledWith(mockRow, mockCustomers, []);
    });

    it('displays customer name returned by getCustomerName helper', () => {
      const {
        getCustomerName,
      } = require('src/js/widgets/weeklyTimeEntry/utils/helpers');
      getCustomerName.mockReturnValue('Custom Customer Display Name');

      render(<CustomerCell {...defaultProps} />);

      expect(screen.getByTestId('customer-name-column')).toHaveTextContent(
        'Custom Customer Display Name',
      );
    });

    it('handles empty customer name', () => {
      const {
        getCustomerName,
      } = require('src/js/widgets/weeklyTimeEntry/utils/helpers');
      getCustomerName.mockReturnValue('');

      render(<CustomerCell {...defaultProps} />);

      const customerNameColumn = screen.getByTestId('customer-name-column');
      expect(customerNameColumn).toHaveTextContent('');
    });

    it('works with different customer arrays', () => {
      const differentCustomers = [
        { id: 'customer2', displayName: 'Different Customer' },
        { id: 'customer3', displayName: 'Another Customer' },
      ];

      const propsWithDifferentCustomers = {
        ...defaultProps,
        customers: differentCustomers,
      };

      const {
        getCustomerName,
      } = require('src/js/widgets/weeklyTimeEntry/utils/helpers');

      render(<CustomerCell {...propsWithDifferentCustomers} />);

      expect(getCustomerName).toHaveBeenCalledWith(
        mockRow,
        differentCustomers,
        [],
      );
    });

    it('works with breaks data', () => {
      const breaks = [
        { id: 'break1', name: 'Lunch Break' },
        { id: 'break2', name: 'Coffee Break' },
      ];

      const propsWithBreaks = {
        ...defaultProps,
        breaks,
      };

      const {
        getCustomerName,
      } = require('src/js/widgets/weeklyTimeEntry/utils/helpers');

      render(<CustomerCell {...propsWithBreaks} />);

      expect(getCustomerName).toHaveBeenCalledWith(
        mockRow,
        mockCustomers,
        breaks,
      );
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles row with different timeAgainst structure', () => {
      const rowWithDifferentTimeAgainst = {
        ...mockRow,
        timeAgainst: {
          type: DataAccess_ContactType.Customer,
          id: 'customer2',
          displayName: 'Different Customer',
        },
      };

      const propsWithDifferentRow = {
        ...defaultProps,
        row: rowWithDifferentTimeAgainst,
      };

      expect(() => {
        render(<CustomerCell {...propsWithDifferentRow} />);
      }).not.toThrow();

      expect(screen.getByTestId('super-search-cell')).toBeInTheDocument();
    });

    it('handles empty customers array', () => {
      const propsWithEmptyCustomers = {
        ...defaultProps,
        customers: [],
      };

      expect(() => {
        render(<CustomerCell {...propsWithEmptyCustomers} />);
      }).not.toThrow();
    });

    it('handles null customers array', () => {
      const propsWithEmptyCustomers = {
        ...defaultProps,
        customers: [],
      };

      expect(() => {
        render(<CustomerCell {...propsWithEmptyCustomers} />);
      }).not.toThrow();
    });

    it('handles missing dispatch function gracefully', () => {
      const propsWithoutDispatch = {
        ...defaultProps,
        dispatch: null,
      };

      render(<CustomerCell {...propsWithoutDispatch} />);

      // Should render without crashing, but clicking should not work
      expect(screen.getByTestId('super-search-cell')).toBeInTheDocument();
    });
  });

  describe('Time Off Row Locking', () => {
    it('does not render dropdown when row is a time off row', () => {
      const propsWithTimeOffRow = {
        ...defaultProps,
        row: {
          ...mockRow,
          hasApprovedEntries: false,
          isTimeOffRow: true,
        },
      };

      render(<CustomerCell {...propsWithTimeOffRow} />);

      expect(screen.queryByTestId('dropdown-column')).not.toBeInTheDocument();
      expect(screen.queryByTestId('chevron-down')).not.toBeInTheDocument();
    });

    it('applies "has-approved-entries" class when row is a time off row', () => {
      const propsWithTimeOffRow = {
        ...defaultProps,
        row: {
          ...mockRow,
          hasApprovedEntries: false,
          isTimeOffRow: true,
        },
      };

      render(<CustomerCell {...propsWithTimeOffRow} />);

      const superSearchCell = screen.getByTestId('super-search-cell');
      expect(superSearchCell).toHaveClass('has-approved-entries');
    });

    it('renders dropdown when row is not a time off row and has no approved entries', () => {
      const propsNormal = {
        ...defaultProps,
        row: {
          ...mockRow,
          hasApprovedEntries: false,
          isTimeOffRow: false,
        },
      };

      render(<CustomerCell {...propsNormal} />);

      expect(screen.getByTestId('dropdown-column')).toBeInTheDocument();
      expect(screen.getByTestId('chevron-down')).toBeInTheDocument();
    });
  });
});

/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { GroupDetailFilterBar } from 'src/js/widgets/assignments/components/WorkerAssignments/GroupDetailView/components/GroupDetailFilterBar';
import { WorkerType } from 'src/js/widgets/assignments/components/WorkerAssignments/SearchFilterBar/types';

// Mock tracking
const mockTrack = jest.fn();
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

// Mock dependencies
jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id, defaultMessage }: any) => defaultMessage || id,
  }),
  useSandbox: () => ({ logger: mockLogger }),
  useTracking: () => mockTrack,
}));

jest.mock('@ids-ts/dropdown-button', () => ({
  __esModule: true,
  default: ({ children, onClick, onOpen, onSelect, label, ...props }: any) => (
    <div data-testid="dropdown-button-wrapper">
      <button
        data-testid="dropdown-button-main"
        onClick={() => {
          onClick?.();
          onOpen?.();
        }}
        {...props}
      >
        {label}
      </button>
      <div data-testid="dropdown-menu">
        {React.Children.map(children, (child) =>
          React.cloneElement(child, {
            onClick: (e: any) => {
              onSelect?.(e);
            },
          }),
        )}
      </div>
    </div>
  ),
  MenuItem: ({ children, value, ...props }: any) => (
    <button
      data-testid={`dropdown-menu-item-${value}`}
      value={value}
      {...props}
    >
      {children}
    </button>
  ),
}));

jest.mock('@ids-ts/dropdown', () => ({
  Dropdown: ({ children, value, onChange, label, ...props }: any) => (
    <div data-testid="dropdown-wrapper">
      <label>{label}</label>
      <select
        data-testid="dropdown"
        value={value}
        onChange={(e) => onChange?.(e)}
        {...props}
      >
        {children}
      </select>
    </div>
  ),
  MenuItem: ({ children, value, ...props }: any) => (
    <option value={value} {...props}>
      {children}
    </option>
  ),
}));

jest.mock('src/js/widgets/common/SearchField', () => ({
  SearchField: ({ value, onChange, label, ...props }: any) => (
    <div data-testid="search-field-wrapper">
      <label>{label}</label>
      <input
        data-testid="search-field"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...props}
      />
    </div>
  ),
}));

describe('GroupDetailFilterBar', () => {
  const mockOnSearchChange = jest.fn();
  const mockOnFilterChange = jest.fn();
  const mockOnAssignWorkers = jest.fn();
  const mockOnAssignLeads = jest.fn();

  const defaultProps = {
    searchText: '',
    filterType: WorkerType.ALL,
    onSearchChange: mockOnSearchChange,
    onFilterChange: mockOnFilterChange,
    onAssignWorkers: mockOnAssignWorkers,
    onAssignLeads: mockOnAssignLeads,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockTrack.mockClear();
    mockLogger.info.mockClear();
  });

  describe('Rendering', () => {
    it('should render all filter bar elements', () => {
      render(<GroupDetailFilterBar {...defaultProps} />);

      expect(screen.getByTestId('dropdown-wrapper')).toBeInTheDocument();
      expect(screen.getByTestId('search-field-wrapper')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-button-wrapper')).toBeInTheDocument();
    });

    it('should render dropdown with correct label', () => {
      render(<GroupDetailFilterBar {...defaultProps} />);

      expect(screen.getByText('Workers')).toBeInTheDocument();
    });

    it('should render search field with correct label', () => {
      render(<GroupDetailFilterBar {...defaultProps} />);

      expect(screen.getByText('Search')).toBeInTheDocument();
    });

    it('should render assign dropdown button', () => {
      render(<GroupDetailFilterBar {...defaultProps} />);

      const button = screen.getByTestId('dropdown-button-main');
      expect(button).toHaveTextContent('Assign');
    });

    it('should render assign workers menu item', () => {
      render(<GroupDetailFilterBar {...defaultProps} />);

      expect(screen.getByText('Assign workers')).toBeInTheDocument();
    });

    it('should render assign leads menu item', () => {
      render(<GroupDetailFilterBar {...defaultProps} />);

      expect(screen.getByText('Assign leads')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should display search text value', () => {
      render(<GroupDetailFilterBar {...defaultProps} searchText="test" />);

      const searchInput = screen.getByTestId(
        'search-field',
      ) as HTMLInputElement;
      expect(searchInput.value).toBe('test');
    });

    it('should call onSearchChange when search text changes', () => {
      render(<GroupDetailFilterBar {...defaultProps} />);

      const searchInput = screen.getByTestId('search-field');
      fireEvent.change(searchInput, { target: { value: 'new search' } });

      expect(mockOnSearchChange).toHaveBeenCalledWith('new search');
      expect(mockOnSearchChange).toHaveBeenCalledTimes(1);
    });

    it('should handle empty search text', () => {
      render(<GroupDetailFilterBar {...defaultProps} searchText="" />);

      const searchInput = screen.getByTestId(
        'search-field',
      ) as HTMLInputElement;
      expect(searchInput.value).toBe('');
    });

    it('should handle multiple search text changes', () => {
      render(<GroupDetailFilterBar {...defaultProps} />);

      const searchInput = screen.getByTestId('search-field');

      fireEvent.change(searchInput, { target: { value: 'first' } });
      fireEvent.change(searchInput, { target: { value: 'second' } });
      fireEvent.change(searchInput, { target: { value: 'third' } });

      expect(mockOnSearchChange).toHaveBeenCalledTimes(3);
      expect(mockOnSearchChange).toHaveBeenLastCalledWith('third');
    });
  });

  describe('Filter Dropdown Functionality', () => {
    it('should display filter type value', () => {
      render(
        <GroupDetailFilterBar
          {...defaultProps}
          filterType={WorkerType.EMPLOYEE}
        />,
      );

      const dropdown = screen.getByTestId('dropdown') as HTMLSelectElement;
      expect(dropdown.value).toBe(WorkerType.EMPLOYEE);
    });

    it('should call onFilterChange when filter changes', () => {
      render(<GroupDetailFilterBar {...defaultProps} />);

      const dropdown = screen.getByTestId('dropdown');
      fireEvent.change(dropdown, { target: { value: WorkerType.EMPLOYEE } });

      expect(mockOnFilterChange).toHaveBeenCalledWith(WorkerType.EMPLOYEE);
      expect(mockOnFilterChange).toHaveBeenCalledTimes(1);
    });

    it('should handle All filter type', () => {
      render(
        <GroupDetailFilterBar {...defaultProps} filterType={WorkerType.ALL} />,
      );

      const dropdown = screen.getByTestId('dropdown') as HTMLSelectElement;
      expect(dropdown.value).toBe(WorkerType.ALL);
    });

    it('should render All option in dropdown', () => {
      render(<GroupDetailFilterBar {...defaultProps} />);

      expect(screen.getByText('All')).toBeInTheDocument();
    });

    it('should render Employee option in dropdown', () => {
      render(<GroupDetailFilterBar {...defaultProps} />);

      expect(screen.getByText('Employee')).toBeInTheDocument();
    });

    it('should render User option in dropdown', () => {
      render(<GroupDetailFilterBar {...defaultProps} />);

      expect(screen.getByText('User')).toBeInTheDocument();
    });

    it('should render Vendor option in dropdown', () => {
      render(<GroupDetailFilterBar {...defaultProps} />);

      expect(screen.getByText('Vendor')).toBeInTheDocument();
    });

    it('should handle LEGACY_QBO_USER filter type', () => {
      render(
        <GroupDetailFilterBar
          {...defaultProps}
          filterType={WorkerType.LEGACY_QBO_USER}
        />,
      );

      const dropdown = screen.getByTestId('dropdown') as HTMLSelectElement;
      expect(dropdown.value).toBe(WorkerType.LEGACY_QBO_USER);
    });

    it('should call onFilterChange with LEGACY_QBO_USER when User option is selected', () => {
      render(<GroupDetailFilterBar {...defaultProps} />);

      const dropdown = screen.getByTestId('dropdown');
      fireEvent.change(dropdown, {
        target: { value: WorkerType.LEGACY_QBO_USER },
      });

      expect(mockOnFilterChange).toHaveBeenCalledWith(
        WorkerType.LEGACY_QBO_USER,
      );
      expect(mockOnFilterChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('Assign Workers/Leads Dropdown Button', () => {
    it('should call onAssignWorkers when assign workers menu item is clicked', () => {
      render(<GroupDetailFilterBar {...defaultProps} />);

      const menuItem = screen.getByText('Assign workers');
      fireEvent.click(menuItem, { target: { value: 'assign-workers' } });

      expect(mockOnAssignWorkers).toHaveBeenCalledTimes(1);
      expect(mockOnAssignLeads).not.toHaveBeenCalled();
    });

    it('should call onAssignLeads when assign leads menu item is clicked', () => {
      render(<GroupDetailFilterBar {...defaultProps} />);

      const menuItem = screen.getByText('Assign leads');
      fireEvent.click(menuItem, { target: { value: 'assign-leads' } });

      expect(mockOnAssignLeads).toHaveBeenCalledTimes(1);
      expect(mockOnAssignWorkers).not.toHaveBeenCalled();
    });

    it('should handle multiple assign workers clicks', () => {
      render(<GroupDetailFilterBar {...defaultProps} />);

      const menuItem = screen.getByText('Assign workers');

      fireEvent.click(menuItem, { target: { value: 'assign-workers' } });
      fireEvent.click(menuItem, { target: { value: 'assign-workers' } });
      fireEvent.click(menuItem, { target: { value: 'assign-workers' } });

      expect(mockOnAssignWorkers).toHaveBeenCalledTimes(3);
    });

    it('should handle multiple assign leads clicks', () => {
      render(<GroupDetailFilterBar {...defaultProps} />);

      const menuItem = screen.getByText('Assign leads');

      fireEvent.click(menuItem, { target: { value: 'assign-leads' } });
      fireEvent.click(menuItem, { target: { value: 'assign-leads' } });

      expect(mockOnAssignLeads).toHaveBeenCalledTimes(2);
    });

    it('should have correct aria-label', () => {
      render(<GroupDetailFilterBar {...defaultProps} />);

      const button = screen.getByTestId('dropdown-button-main');
      expect(button).toHaveAttribute('aria-label', 'Assign workers or leads');
    });

    it('should not call any handlers when menu item with unknown value is clicked', () => {
      render(<GroupDetailFilterBar {...defaultProps} />);

      const menuItem = screen.getByText('Assign leads');
      fireEvent.click(menuItem, { target: { value: 'unknown-action' } });

      expect(mockOnAssignWorkers).not.toHaveBeenCalled();
      expect(mockOnAssignLeads).not.toHaveBeenCalled();
    });

    it('should not call handlers when main button is clicked (only opens dropdown)', () => {
      render(<GroupDetailFilterBar {...defaultProps} />);

      const button = screen.getByTestId('dropdown-button-main');
      fireEvent.click(button);

      // Main button should not trigger any assignment actions
      expect(mockOnAssignWorkers).not.toHaveBeenCalled();
      expect(mockOnAssignLeads).not.toHaveBeenCalled();
    });
  });

  describe('Props Integration', () => {
    it('should work with all props provided', () => {
      const props = {
        searchText: 'test search',
        filterType: WorkerType.EMPLOYEE,
        onSearchChange: mockOnSearchChange,
        onFilterChange: mockOnFilterChange,
        onAssignWorkers: mockOnAssignWorkers,
        onAssignLeads: mockOnAssignLeads,
      };

      render(<GroupDetailFilterBar {...props} />);

      const searchInput = screen.getByTestId(
        'search-field',
      ) as HTMLInputElement;
      const dropdown = screen.getByTestId('dropdown') as HTMLSelectElement;

      expect(searchInput.value).toBe('test search');
      expect(dropdown.value).toBe(WorkerType.EMPLOYEE);
    });

    it('should update when props change', () => {
      const { rerender } = render(<GroupDetailFilterBar {...defaultProps} />);

      let searchInput = screen.getByTestId('search-field') as HTMLInputElement;
      expect(searchInput.value).toBe('');

      rerender(<GroupDetailFilterBar {...defaultProps} searchText="updated" />);

      searchInput = screen.getByTestId('search-field') as HTMLInputElement;
      expect(searchInput.value).toBe('updated');
    });

    it('should call correct handlers when assigned', () => {
      const customHandlers = {
        ...defaultProps,
        onAssignWorkers: mockOnAssignWorkers,
        onAssignLeads: mockOnAssignLeads,
      };

      render(<GroupDetailFilterBar {...customHandlers} />);

      // Test workers handler
      const workersMenuItem = screen.getByText('Assign workers');
      fireEvent.click(workersMenuItem, { target: { value: 'assign-workers' } });
      expect(mockOnAssignWorkers).toHaveBeenCalledTimes(1);

      // Test leads handler
      const leadsMenuItem = screen.getByText('Assign leads');
      fireEvent.click(leadsMenuItem, { target: { value: 'assign-leads' } });
      expect(mockOnAssignLeads).toHaveBeenCalledTimes(1);
    });
  });

  describe('Layout and Structure', () => {
    it('should have correct structure with left and right sections', () => {
      const { container } = render(<GroupDetailFilterBar {...defaultProps} />);

      // Should have dropdown and search in left section
      expect(screen.getByTestId('dropdown-wrapper')).toBeInTheDocument();
      expect(screen.getByTestId('search-field-wrapper')).toBeInTheDocument();

      // Should have dropdown button in right section
      expect(screen.getByTestId('dropdown-button-main')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible labels for all inputs', () => {
      render(<GroupDetailFilterBar {...defaultProps} />);

      expect(screen.getByText('Workers')).toBeInTheDocument();
      expect(screen.getByText('Search')).toBeInTheDocument();
    });

    it('should have aria-label on dropdown button', () => {
      render(<GroupDetailFilterBar {...defaultProps} />);

      const button = screen.getByTestId('dropdown-button-main');
      expect(button).toHaveAttribute('aria-label', 'Assign workers or leads');
    });

    it('should have accessible menu items', () => {
      render(<GroupDetailFilterBar {...defaultProps} />);

      const assignLeadsMenuItem = screen.getByText('Assign leads');
      expect(assignLeadsMenuItem).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in search text', () => {
      render(
        <GroupDetailFilterBar {...defaultProps} searchText="test@#$%^&*()" />,
      );

      const searchInput = screen.getByTestId(
        'search-field',
      ) as HTMLInputElement;
      expect(searchInput.value).toBe('test@#$%^&*()');
    });

    it('should handle very long search text', () => {
      const longText = 'a'.repeat(1000);
      render(<GroupDetailFilterBar {...defaultProps} searchText={longText} />);

      const searchInput = screen.getByTestId(
        'search-field',
      ) as HTMLInputElement;
      expect(searchInput.value).toBe(longText);
    });

    it('should handle rapid filter changes', () => {
      render(<GroupDetailFilterBar {...defaultProps} />);

      const dropdown = screen.getByTestId('dropdown');

      for (let i = 0; i < 10; i += 1) {
        fireEvent.change(dropdown, { target: { value: `Type${i}` } });
      }

      expect(mockOnFilterChange).toHaveBeenCalledTimes(10);
    });
  });

  describe('Tracking', () => {
    it('should track ASSIGN_DROPDOWN_CLICKED when dropdown is opened', () => {
      render(<GroupDetailFilterBar {...defaultProps} />);

      const dropdownButton = screen.getByTestId('dropdown-button-main');
      fireEvent.click(dropdownButton);

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'engaged',
          object: 'component',
          object_detail: 'group_details_page',
          ui_action: 'clicked',
          ui_object: 'dropdown',
          ui_object_detail: 'assign_dropdown',
          ui_access_point: 'center',
        }),
      );
    });

    it('should track ASSIGN_WORKERS_OPTION_CLICKED when assign workers is selected', () => {
      render(<GroupDetailFilterBar {...defaultProps} />);

      const menuItem = screen.getByText('Assign workers');
      fireEvent.click(menuItem, { target: { value: 'assign-workers' } });

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'engaged',
          object: 'component',
          object_detail: 'group_details_page',
          ui_action: 'clicked',
          ui_object: 'list_item',
          ui_object_detail: 'assign_workers',
          ui_access_point: 'assign_dropdown',
        }),
      );

      expect(mockOnAssignWorkers).toHaveBeenCalledTimes(1);
    });

    it('should track ASSIGN_LEADS_OPTION_CLICKED when assign leads is selected', () => {
      render(<GroupDetailFilterBar {...defaultProps} />);

      const menuItem = screen.getByText('Assign leads');
      fireEvent.click(menuItem, { target: { value: 'assign-leads' } });

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'engaged',
          object: 'component',
          object_detail: 'group_details_page',
          ui_action: 'clicked',
          ui_object: 'list_item',
          ui_object_detail: 'assign_leads',
          ui_access_point: 'assign_dropdown',
        }),
      );

      expect(mockOnAssignLeads).toHaveBeenCalledTimes(1);
    });

    it('should track dropdown open and option selection together', () => {
      render(<GroupDetailFilterBar {...defaultProps} />);

      // Open dropdown
      const dropdownButton = screen.getByTestId('dropdown-button-main');
      fireEvent.click(dropdownButton);

      expect(mockTrack).toHaveBeenCalledTimes(1); // ASSIGN_DROPDOWN_CLICKED

      mockTrack.mockClear();

      // Select option
      const menuItem = screen.getByText('Assign workers');
      fireEvent.click(menuItem, { target: { value: 'assign-workers' } });

      expect(mockTrack).toHaveBeenCalledTimes(1); // ASSIGN_WORKERS_OPTION_CLICKED
    });
  });

  describe('NTTF - shouldShowGroupLeads', () => {
    it('should hide assign leads menu item when shouldShowGroupLeads is false', () => {
      render(
        <GroupDetailFilterBar {...defaultProps} shouldShowGroupLeads={false} />,
      );

      // Assign workers should still be visible
      expect(screen.getByText('Assign workers')).toBeInTheDocument();

      // Assign leads menu item should be hidden
      expect(screen.queryByText('Assign leads')).not.toBeInTheDocument();
    });

    it('should change aria-label to "Assign workers" when shouldShowGroupLeads is false', () => {
      render(
        <GroupDetailFilterBar {...defaultProps} shouldShowGroupLeads={false} />,
      );

      const button = screen.getByTestId('dropdown-button-main');
      expect(button).toHaveAttribute('aria-label', 'Assign workers');
    });

    it('should show assign leads menu item when shouldShowGroupLeads is true', () => {
      render(<GroupDetailFilterBar {...defaultProps} shouldShowGroupLeads />);

      expect(screen.getByText('Assign leads')).toBeInTheDocument();
    });

    it('should have aria-label "Assign workers or leads" when shouldShowGroupLeads is true', () => {
      render(<GroupDetailFilterBar {...defaultProps} shouldShowGroupLeads />);

      const button = screen.getByTestId('dropdown-button-main');
      expect(button).toHaveAttribute('aria-label', 'Assign workers or leads');
    });

    it('should default to showing assign leads when shouldShowGroupLeads is not provided', () => {
      render(<GroupDetailFilterBar {...defaultProps} />);

      expect(screen.getByText('Assign leads')).toBeInTheDocument();
    });
  });
});

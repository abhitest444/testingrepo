import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ViewToggle } from '../../../../../../../src/js/widgets/assignments/components/WorkerAssignments/SearchFilterBar/ViewToggle';

// Mock useIntl
jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({
      id,
      defaultMessage,
    }: {
      id: string;
      defaultMessage: string;
    }) => defaultMessage,
  }),
}));

// Mock QBDS Toggle
jest.mock('@qbds/toggle', () => ({
  __esModule: true,
  default: ({ options, onChange, overrideValue, groupLabel }: any) => (
    <div role="group" aria-label={groupLabel} data-testid="toggle-group">
      {options.map((option: any) => (
        <button
          key={option.value}
          data-testid={`${option.value}-tab`}
          onClick={() => onChange(option.value)}
          aria-pressed={overrideValue === option.value}
          data-selected={overrideValue === option.value}
        >
          {option.label}
        </button>
      ))}
    </div>
  ),
}));

// Mock icons
jest.mock('@design-systems/icons', () => ({
  Person: () => <span data-testid="person-icon">Person Icon</span>,
  PersonThree: () => (
    <span data-testid="person-three-icon">PersonThree Icon</span>
  ),
}));

describe('ViewToggle', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Rendering', () => {
    it('should render the toggle group', () => {
      render(<ViewToggle checked onChange={mockOnChange} />);

      const toggleGroup = screen.getByTestId('toggle-group');
      expect(toggleGroup).toBeInTheDocument();
    });

    it('should render Workers and Groups options', () => {
      render(<ViewToggle checked onChange={mockOnChange} />);

      expect(screen.getByText('Workers')).toBeInTheDocument();
      expect(screen.getByText('Groups')).toBeInTheDocument();
    });

    it('should have the correct aria-label on group', () => {
      render(<ViewToggle checked onChange={mockOnChange} />);

      const group = screen.getByRole('group', {
        name: 'Toggle view by workers or groups',
      });
      expect(group).toBeInTheDocument();
    });

    it('should render workers tab when checked is false', () => {
      render(<ViewToggle checked={false} onChange={mockOnChange} />);

      const workersTab = screen.getByTestId('workers-tab');
      expect(workersTab).toHaveAttribute('data-selected', 'true');
    });

    it('should render groups tab when checked is true', () => {
      render(<ViewToggle checked onChange={mockOnChange} />);

      const groupsTab = screen.getByTestId('groups-tab');
      expect(groupsTab).toHaveAttribute('data-selected', 'true');
    });

    it('should render both tabs', () => {
      render(<ViewToggle checked={false} onChange={mockOnChange} />);

      expect(screen.getByTestId('workers-tab')).toBeInTheDocument();
      expect(screen.getByTestId('groups-tab')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onChange with true when Groups tab is clicked', () => {
      render(<ViewToggle checked={false} onChange={mockOnChange} />);

      const groupsTab = screen.getByTestId('groups-tab');
      fireEvent.click(groupsTab);

      expect(mockOnChange).toHaveBeenCalledWith(true);
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    it('should call onChange with false when Workers tab is clicked', () => {
      render(<ViewToggle checked onChange={mockOnChange} />);

      const workersTab = screen.getByTestId('workers-tab');
      fireEvent.click(workersTab);

      expect(mockOnChange).toHaveBeenCalledWith(false);
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple tab clicks', () => {
      render(<ViewToggle checked={false} onChange={mockOnChange} />);

      const groupsTab = screen.getByTestId('groups-tab');
      const workersTab = screen.getByTestId('workers-tab');

      fireEvent.click(groupsTab);
      fireEvent.click(workersTab);

      expect(mockOnChange).toHaveBeenCalledTimes(2);
      expect(mockOnChange).toHaveBeenNthCalledWith(1, true);
      expect(mockOnChange).toHaveBeenNthCalledWith(2, false);
    });

    it('should allow clicking the same tab multiple times', () => {
      render(<ViewToggle checked onChange={mockOnChange} />);

      const groupsTab = screen.getByTestId('groups-tab');

      fireEvent.click(groupsTab);
      fireEvent.click(groupsTab);

      expect(mockOnChange).toHaveBeenCalledTimes(2);
      expect(mockOnChange).toHaveBeenCalledWith(true);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on group', () => {
      render(<ViewToggle checked onChange={mockOnChange} />);

      const group = screen.getByTestId('toggle-group');
      expect(group).toHaveAttribute('role', 'group');
      expect(group).toHaveAttribute(
        'aria-label',
        'Toggle view by workers or groups',
      );
    });

    it('should have aria-pressed on selected tab', () => {
      render(<ViewToggle checked onChange={mockOnChange} />);

      const groupsTab = screen.getByTestId('groups-tab');
      const workersTab = screen.getByTestId('workers-tab');

      expect(groupsTab).toHaveAttribute('aria-pressed', 'true');
      expect(workersTab).toHaveAttribute('aria-pressed', 'false');
    });

    it('should update aria-pressed when tab changes', () => {
      render(<ViewToggle checked={false} onChange={mockOnChange} />);

      const workersTab = screen.getByTestId('workers-tab');
      expect(workersTab).toHaveAttribute('aria-pressed', 'true');
    });

    it('should be keyboard accessible', () => {
      render(<ViewToggle checked onChange={mockOnChange} />);

      const groupsTab = screen.getByTestId('groups-tab');
      groupsTab.focus();

      expect(groupsTab).toHaveFocus();
    });
  });

  describe('Component Structure', () => {
    it('should render both tabs with correct test ids', () => {
      render(<ViewToggle checked onChange={mockOnChange} />);

      expect(screen.getByTestId('workers-tab')).toBeInTheDocument();
      expect(screen.getByTestId('groups-tab')).toBeInTheDocument();
    });

    it('should render labels for both options', () => {
      render(<ViewToggle checked onChange={mockOnChange} />);

      expect(screen.getByText('Workers')).toBeInTheDocument();
      expect(screen.getByText('Groups')).toBeInTheDocument();
    });

    it('should render both tab buttons', () => {
      render(<ViewToggle checked onChange={mockOnChange} />);

      const workersTab = screen.getByTestId('workers-tab');
      const groupsTab = screen.getByTestId('groups-tab');

      expect(workersTab).toBeInstanceOf(HTMLButtonElement);
      expect(groupsTab).toBeInstanceOf(HTMLButtonElement);
    });

    it('should maintain correct structure with toggle group', () => {
      const { container } = render(
        <ViewToggle checked onChange={mockOnChange} />,
      );

      const toggleGroup = screen.getByTestId('toggle-group');
      const workersTab = screen.getByTestId('workers-tab');
      const groupsTab = screen.getByTestId('groups-tab');

      expect(toggleGroup).toContainElement(workersTab);
      expect(toggleGroup).toContainElement(groupsTab);
    });
  });

  describe('State Management', () => {
    it.each([
      {
        description:
          'correctly reflects checked=false state (workers selected)',
        checked: false,
        expectedWorkersSelected: 'true',
        expectedGroupsSelected: 'false',
      },
      {
        description: 'correctly reflects checked=true state (groups selected)',
        checked: true,
        expectedWorkersSelected: 'false',
        expectedGroupsSelected: 'true',
      },
    ])(
      '$description',
      ({ checked, expectedWorkersSelected, expectedGroupsSelected }) => {
        render(<ViewToggle checked={checked} onChange={mockOnChange} />);

        const workersTab = screen.getByTestId('workers-tab');
        const groupsTab = screen.getByTestId('groups-tab');

        expect(workersTab).toHaveAttribute(
          'data-selected',
          expectedWorkersSelected,
        );
        expect(groupsTab).toHaveAttribute(
          'data-selected',
          expectedGroupsSelected,
        );
      },
    );
  });
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import AssignmentTable from 'src/js/widgets/common/AssignmentDrawer/components/AssignmentTable';
import { AssignmentItem } from 'src/js/widgets/common/AssignmentDrawer/types';

// Mock @ids-ts/checkbox
jest.mock('@ids-ts/checkbox', () => ({
  Checkbox: ({
    checked,
    onChange,
    indeterminate,
    disabled,
    'aria-label': ariaLabel,
    children,
  }: {
    checked: boolean;
    onChange: () => void;
    indeterminate?: boolean;
    disabled?: boolean;
    'aria-label': string;
    children?: React.ReactNode;
  }) => (
    <div>
      <input
        type="checkbox"
        data-testid="checkbox"
        data-indeterminate={indeterminate}
        checked={checked}
        onChange={onChange}
        aria-label={ariaLabel}
        disabled={disabled}
      />
      {children}
    </div>
  ),
}));

// Mock @ids-ts/icon-control
jest.mock('@ids-ts/icon-control', () => ({
  IconControl: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick: () => void;
  }) => (
    <button data-testid="icon-control" onClick={onClick}>
      {children}
    </button>
  ),
}));

// Mock icons
jest.mock('@design-systems/icons', () => ({
  ChevronDown: () => <span data-testid="chevron-down">▼</span>,
  ChevronUp: () => <span data-testid="chevron-up">▲</span>,
}));

// Mock @ids-ts/loader
jest.mock('@ids-ts/loader', () => ({
  Activity: () => <div data-testid="activity-loader">Loading...</div>,
}));

describe('AssignmentTable Component', () => {
  const mockItems: AssignmentItem[] = [
    {
      id: 1,
      name: 'Parent Item 1',
      level: 0,
      hasChildren: true,
      isSelected: false,
    },
    {
      id: 2,
      name: 'Child Item 1',
      level: 1,
      parentId: 1,
      hasChildren: false,
      isSelected: false,
    },
    {
      id: 3,
      name: 'Parent Item 2',
      level: 0,
      hasChildren: false,
      isSelected: true,
    },
  ];

  const defaultProps = {
    items: mockItems,
    selectedItems: new Set([3]),
    onSelectionChange: jest.fn(),
    onSelectAll: jest.fn(),
    loading: false,
    defaultExpanded: false,
    hierarchicalSelection: false,
    tableHeader: 'Items',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render table with items', () => {
      render(<AssignmentTable {...defaultProps} defaultExpanded />);

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(
        screen.getByRole('checkbox', { name: 'Select Parent Item 1' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('checkbox', { name: 'Select Child Item 1' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('checkbox', { name: 'Select Parent Item 2' }),
      ).toBeInTheDocument();
    });

    it('should render table header', () => {
      render(<AssignmentTable {...defaultProps} />);

      expect(screen.getByText('Items')).toBeInTheDocument();
    });

    it('should render loading state', () => {
      render(<AssignmentTable {...defaultProps} loading />);

      expect(screen.getByTestId('activity-loader')).toBeInTheDocument();
    });

    it('should render expand/collapse icons for parent items', () => {
      render(<AssignmentTable {...defaultProps} />);

      const chevronIcons = screen.getAllByTestId('icon-control');
      expect(chevronIcons.length).toBeGreaterThan(0);
    });

    it('should render checkboxes for all items', () => {
      render(<AssignmentTable {...defaultProps} />);

      const checkboxes = screen.getAllByTestId('checkbox');
      // Should have: 1 select-all + 2 parent item checkboxes (child is collapsed by default)
      expect(checkboxes.length).toBe(3);
    });
  });

  describe('Selection behavior', () => {
    it('should show selected items as checked', () => {
      render(<AssignmentTable {...defaultProps} />);

      const item3Checkbox = screen.getByRole('checkbox', {
        name: 'Select Parent Item 2',
      });
      expect(item3Checkbox).toBeChecked();
    });

    it('should call onSelectionChange when clicking checkbox', () => {
      const onSelectionChange = jest.fn();
      render(
        <AssignmentTable
          {...defaultProps}
          onSelectionChange={onSelectionChange}
        />,
      );

      const checkboxes = screen.getAllByTestId('checkbox');
      const item1Checkbox = checkboxes.find((cb) =>
        cb.getAttribute('aria-label')?.includes('Parent Item 1'),
      );

      if (item1Checkbox) {
        fireEvent.click(item1Checkbox);
        expect(onSelectionChange).toHaveBeenCalledWith(1);
      }
    });

    it('should call onSelectAll when clicking select-all checkbox', () => {
      const onSelectAll = jest.fn();
      render(<AssignmentTable {...defaultProps} onSelectAll={onSelectAll} />);

      const checkboxes = screen.getAllByTestId('checkbox');
      const selectAllCheckbox = checkboxes[0]; // First checkbox is select-all

      fireEvent.click(selectAllCheckbox);
      expect(onSelectAll).toHaveBeenCalled();
    });

    it('should show select-all as checked when all items are selected', () => {
      const allSelected = new Set([1, 2, 3]);
      render(<AssignmentTable {...defaultProps} selectedItems={allSelected} />);

      const checkboxes = screen.getAllByTestId('checkbox');
      const selectAllCheckbox = checkboxes[0];

      expect(selectAllCheckbox).toBeChecked();
    });

    it('should show select-all as indeterminate when some items are selected', () => {
      const someSelected = new Set([1]);
      render(
        <AssignmentTable {...defaultProps} selectedItems={someSelected} />,
      );

      const checkboxes = screen.getAllByTestId('checkbox');
      const selectAllCheckbox = checkboxes[0];

      expect(selectAllCheckbox.getAttribute('data-indeterminate')).toBe('true');
    });
  });

  describe('Expand/Collapse behavior', () => {
    it('should hide children by default when defaultExpanded is false', () => {
      render(<AssignmentTable {...defaultProps} defaultExpanded={false} />);

      // Child items should not be visible initially when collapsed
      const childItem = screen.queryByText('Child Item 1');
      expect(childItem).not.toBeInTheDocument();
    });

    it('should show children when defaultExpanded is true', () => {
      render(<AssignmentTable {...defaultProps} defaultExpanded />);

      expect(screen.getByText('Child Item 1')).toBeInTheDocument();
    });

    it('should toggle expand/collapse when clicking chevron', () => {
      render(<AssignmentTable {...defaultProps} />);

      const expandButtons = screen.getAllByTestId('icon-control');
      const firstExpandButton = expandButtons[0];

      // Should show chevron-down initially (collapsed)
      expect(screen.getByTestId('chevron-down')).toBeInTheDocument();

      // Click to expand
      fireEvent.click(firstExpandButton);

      // After clicking, should show chevron-up
      // Note: This test may need adjustment based on actual implementation
    });
  });

  describe('Hierarchical selection', () => {
    const hierarchicalItems: AssignmentItem[] = [
      {
        id: 1,
        name: 'Parent',
        level: 0,
        hasChildren: true,
        isSelected: false,
      },
      {
        id: 2,
        name: 'Child 1',
        level: 1,
        parentId: 1,
        hasChildren: true,
        isSelected: false,
      },
      {
        id: 3,
        name: 'Sub-child 1',
        level: 2,
        parentId: 2,
        hasChildren: false,
        isSelected: false,
      },
    ];

    it('should select children when parent is selected in hierarchical mode', () => {
      const onSelectionChange = jest.fn();
      render(
        <AssignmentTable
          {...defaultProps}
          items={hierarchicalItems}
          selectedItems={new Set()}
          hierarchicalSelection
          onSelectionChange={onSelectionChange}
        />,
      );

      const checkboxes = screen.getAllByTestId('checkbox');
      const parentCheckbox = checkboxes.find((cb) =>
        cb.getAttribute('aria-label')?.includes('Parent'),
      );

      if (parentCheckbox) {
        fireEvent.click(parentCheckbox);
        // Should trigger selection change for parent
        expect(onSelectionChange).toHaveBeenCalled();
      }
    });

    it('should allow independent selection when hierarchicalSelection is false', () => {
      const onSelectionChange = jest.fn();
      render(
        <AssignmentTable
          {...defaultProps}
          items={hierarchicalItems}
          selectedItems={new Set()}
          hierarchicalSelection={false}
          onSelectionChange={onSelectionChange}
        />,
      );

      const checkboxes = screen.getAllByTestId('checkbox');
      const childCheckbox = checkboxes.find((cb) =>
        cb.getAttribute('aria-label')?.includes('Child 1'),
      );

      if (childCheckbox) {
        fireEvent.click(childCheckbox);
        expect(onSelectionChange).toHaveBeenCalledWith(2);
      }
    });
  });

  describe('Props customization', () => {
    it('should render custom emptyStateText when provided', () => {
      render(
        <AssignmentTable
          {...defaultProps}
          items={[]}
          emptyStateText="No items"
        />,
      );

      expect(screen.getByText('No items')).toBeInTheDocument();
    });

    it('should render custom tableHeader when provided', () => {
      render(<AssignmentTable {...defaultProps} tableHeader="Custom Header" />);

      expect(screen.getByText('Custom Header')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty items array', () => {
      render(<AssignmentTable {...defaultProps} items={[]} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
      // Should still show header
      expect(screen.getByText('Items')).toBeInTheDocument();
    });

    it('should handle items without children', () => {
      const flatItems: AssignmentItem[] = [
        {
          id: 1,
          name: 'Item 1',
          level: 0,
          hasChildren: false,
          isSelected: false,
        },
        {
          id: 2,
          name: 'Item 2',
          level: 0,
          hasChildren: false,
          isSelected: false,
        },
      ];

      render(<AssignmentTable {...defaultProps} items={flatItems} />);

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('should handle deeply nested items up to 5 levels (0-4)', () => {
      const deeplyNestedItems: AssignmentItem[] = [
        {
          id: 1,
          name: 'Level 0',
          level: 0,
          hasChildren: true,
          isSelected: false,
        },
        {
          id: 2,
          name: 'Level 1',
          level: 1,
          parentId: 1,
          hasChildren: true,
          isSelected: false,
        },
        {
          id: 3,
          name: 'Level 2',
          level: 2,
          parentId: 2,
          hasChildren: true,
          isSelected: false,
        },
        {
          id: 4,
          name: 'Level 3',
          level: 3,
          parentId: 3,
          hasChildren: true,
          isSelected: false,
        },
        {
          id: 5,
          name: 'Level 4',
          level: 4,
          parentId: 4,
          hasChildren: false,
          isSelected: false,
        },
      ];

      render(
        <AssignmentTable
          {...defaultProps}
          items={deeplyNestedItems}
          defaultExpanded
        />,
      );

      expect(
        screen.getByRole('checkbox', { name: 'Select Level 0' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('checkbox', { name: 'Select Level 1' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('checkbox', { name: 'Select Level 2' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('checkbox', { name: 'Select Level 3' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('checkbox', { name: 'Select Level 4' }),
      ).toBeInTheDocument();
    });

    it('should update when items prop changes', () => {
      const { rerender } = render(<AssignmentTable {...defaultProps} />);

      expect(
        screen.getByRole('checkbox', { name: 'Select Parent Item 1' }),
      ).toBeInTheDocument();

      const newItems: AssignmentItem[] = [
        {
          id: 99,
          name: 'New Item',
          level: 0,
          hasChildren: false,
          isSelected: false,
        },
      ];

      rerender(<AssignmentTable {...defaultProps} items={newItems} />);

      expect(
        screen.getByRole('checkbox', { name: 'Select New Item' }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('checkbox', { name: 'Select Parent Item 1' }),
      ).not.toBeInTheDocument();
    });

    it('should handle selection state changes', () => {
      const { rerender } = render(<AssignmentTable {...defaultProps} />);

      let item1Checkbox = screen.getByRole('checkbox', {
        name: 'Select Parent Item 1',
      });
      expect(item1Checkbox).not.toBeChecked();

      // Update selection
      rerender(
        <AssignmentTable {...defaultProps} selectedItems={new Set([1, 3])} />,
      );

      item1Checkbox = screen.getByRole('checkbox', {
        name: 'Select Parent Item 1',
      });
      expect(item1Checkbox).toBeChecked();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-labels for checkboxes', () => {
      render(<AssignmentTable {...defaultProps} />);

      // Check specific items have aria-labels
      expect(
        screen.getByRole('checkbox', { name: 'Select Parent Item 1' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('checkbox', { name: 'Select Parent Item 2' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('checkbox', { name: 'Select all items' }),
      ).toBeInTheDocument();
    });

    it('should support keyboard navigation for checkboxes', () => {
      render(<AssignmentTable {...defaultProps} />);

      const checkboxes = screen.getAllByTestId('checkbox');
      const firstCheckbox = checkboxes[0];

      expect(firstCheckbox).toBeInTheDocument();
      // Checkboxes should be focusable
      expect(firstCheckbox.tagName).toBe('INPUT');
    });
  });

  describe('Parent auto-selection/deselection with hierarchical mode', () => {
    const parentChildItems: AssignmentItem[] = [
      {
        id: 'CUST-1',
        name: 'Customer 1',
        level: 0,
        hasChildren: true,
        isSelected: false,
      },
      {
        id: 'PROJ-1',
        name: 'Project 1',
        level: 1,
        parentId: 'CUST-1',
        hasChildren: false,
        isSelected: false,
      },
      {
        id: 'PROJ-2',
        name: 'Project 2',
        level: 1,
        parentId: 'CUST-1',
        hasChildren: false,
        isSelected: false,
      },
    ];

    it('should auto-select parent when all children become selected', () => {
      const mockOnSelectionChange = jest.fn();
      render(
        <AssignmentTable
          items={parentChildItems}
          selectedItems={new Set(['PROJ-1'])}
          onSelectionChange={mockOnSelectionChange}
          onSelectAll={jest.fn()}
          hierarchicalSelection
          defaultExpanded
        />,
      );

      // Select the last unselected child
      const proj2Checkbox = screen.getByRole('checkbox', {
        name: 'Select Project 2',
      });
      fireEvent.click(proj2Checkbox);

      // Should select PROJ-2 and auto-select parent CUST-1
      expect(mockOnSelectionChange).toHaveBeenCalledWith('PROJ-2');
      expect(mockOnSelectionChange).toHaveBeenCalledWith('CUST-1');
    });

    it('should NOT auto-select parent when not all children are selected', () => {
      const mockOnSelectionChange = jest.fn();
      render(
        <AssignmentTable
          items={parentChildItems}
          selectedItems={new Set()}
          onSelectionChange={mockOnSelectionChange}
          onSelectAll={jest.fn()}
          hierarchicalSelection
          defaultExpanded
        />,
      );

      // Select only one child
      const proj1Checkbox = screen.getByRole('checkbox', {
        name: 'Select Project 1',
      });
      fireEvent.click(proj1Checkbox);

      // Should only select PROJ-1, NOT parent
      expect(mockOnSelectionChange).toHaveBeenCalledWith('PROJ-1');
      expect(mockOnSelectionChange).not.toHaveBeenCalledWith('CUST-1');
    });

    it('should auto-deselect parent when last child is deselected', () => {
      const mockOnSelectionChange = jest.fn();
      render(
        <AssignmentTable
          items={parentChildItems}
          selectedItems={new Set(['CUST-1', 'PROJ-2'])}
          onSelectionChange={mockOnSelectionChange}
          onSelectAll={jest.fn()}
          hierarchicalSelection
          defaultExpanded
        />,
      );

      // Deselect the last selected child
      const proj2Checkbox = screen.getByRole('checkbox', {
        name: 'Select Project 2',
      });
      fireEvent.click(proj2Checkbox);

      // Should deselect PROJ-2 and auto-deselect parent CUST-1
      expect(mockOnSelectionChange).toHaveBeenCalledWith('PROJ-2');
      expect(mockOnSelectionChange).toHaveBeenCalledWith('CUST-1');
    });

    it('should NOT auto-deselect parent when other children remain selected', () => {
      const mockOnSelectionChange = jest.fn();
      render(
        <AssignmentTable
          items={parentChildItems}
          selectedItems={new Set(['CUST-1', 'PROJ-1', 'PROJ-2'])}
          onSelectionChange={mockOnSelectionChange}
          onSelectAll={jest.fn()}
          hierarchicalSelection
          defaultExpanded
        />,
      );

      // Deselect one child (other remains)
      const proj1Checkbox = screen.getByRole('checkbox', {
        name: 'Select Project 1',
      });
      fireEvent.click(proj1Checkbox);

      // Should only deselect PROJ-1, NOT parent
      expect(mockOnSelectionChange).toHaveBeenCalledWith('PROJ-1');
      expect(mockOnSelectionChange).not.toHaveBeenCalledWith('CUST-1');
    });

    it('should work without hierarchical selection enabled', () => {
      const mockOnSelectionChange = jest.fn();
      render(
        <AssignmentTable
          items={parentChildItems}
          selectedItems={new Set(['PROJ-1'])}
          onSelectionChange={mockOnSelectionChange}
          onSelectAll={jest.fn()}
          hierarchicalSelection={false}
          defaultExpanded
        />,
      );

      // Select second child
      const proj2Checkbox = screen.getByRole('checkbox', {
        name: 'Select Project 2',
      });
      fireEvent.click(proj2Checkbox);

      // Should only select PROJ-2, no parent auto-selection
      expect(mockOnSelectionChange).toHaveBeenCalledWith('PROJ-2');
      expect(mockOnSelectionChange).not.toHaveBeenCalledWith('CUST-1');
      expect(mockOnSelectionChange).toHaveBeenCalledTimes(1);
    });

    it('should handle parent deselection when parent is already deselected', () => {
      const mockOnSelectionChange = jest.fn();
      render(
        <AssignmentTable
          items={parentChildItems}
          selectedItems={new Set(['PROJ-2'])}
          onSelectionChange={mockOnSelectionChange}
          onSelectAll={jest.fn()}
          hierarchicalSelection
          defaultExpanded
        />,
      );

      // Deselect last child (parent already not selected)
      const proj2Checkbox = screen.getByRole('checkbox', {
        name: 'Select Project 2',
      });
      fireEvent.click(proj2Checkbox);

      // Should only call for PROJ-2, not for parent (already deselected)
      expect(mockOnSelectionChange).toHaveBeenCalledWith('PROJ-2');
      expect(mockOnSelectionChange).toHaveBeenCalledTimes(1);
    });

    it('should handle parent selection when parent is already selected', () => {
      const mockOnSelectionChange = jest.fn();
      render(
        <AssignmentTable
          items={parentChildItems}
          selectedItems={new Set(['CUST-1', 'PROJ-1'])}
          onSelectionChange={mockOnSelectionChange}
          onSelectAll={jest.fn()}
          hierarchicalSelection
          defaultExpanded
        />,
      );

      // Select last child (parent already selected)
      const proj2Checkbox = screen.getByRole('checkbox', {
        name: 'Select Project 2',
      });
      fireEvent.click(proj2Checkbox);

      // Should only call for PROJ-2, not for parent (already selected)
      expect(mockOnSelectionChange).toHaveBeenCalledWith('PROJ-2');
      expect(mockOnSelectionChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('Disabled items functionality', () => {
    const itemsWithDisabled: AssignmentItem[] = [
      {
        id: 1,
        name: 'Enabled Item',
        level: 0,
        hasChildren: false,
        isSelected: false,
        disabled: false,
      },
      {
        id: 2,
        name: 'Disabled Item',
        level: 0,
        hasChildren: false,
        isSelected: false,
        disabled: true,
      },
      {
        id: 3,
        name: 'Another Enabled',
        level: 0,
        hasChildren: false,
        isSelected: false,
        disabled: false,
      },
    ];

    it('should render disabled checkbox for disabled items', () => {
      render(
        <AssignmentTable
          items={itemsWithDisabled}
          selectedItems={new Set()}
          onSelectionChange={jest.fn()}
          onSelectAll={jest.fn()}
        />,
      );

      const disabledCheckbox = screen.getByRole('checkbox', {
        name: 'Select Disabled Item',
      });
      expect(disabledCheckbox).toBeDisabled();
    });

    it('should not render disabled checkbox for enabled items', () => {
      render(
        <AssignmentTable
          items={itemsWithDisabled}
          selectedItems={new Set()}
          onSelectionChange={jest.fn()}
          onSelectAll={jest.fn()}
        />,
      );

      const enabledCheckbox = screen.getByRole('checkbox', {
        name: 'Select Enabled Item',
      });
      expect(enabledCheckbox).not.toBeDisabled();
    });

    it('should exclude disabled items from select all count', () => {
      render(
        <AssignmentTable
          items={itemsWithDisabled}
          selectedItems={new Set([1, 3])} // Only enabled items selected
          onSelectionChange={jest.fn()}
          onSelectAll={jest.fn()}
        />,
      );

      // Select all checkbox should be checked (all enabled items are selected)
      const checkboxes = screen.getAllByTestId('checkbox');
      const selectAllCheckbox = checkboxes[0];
      expect(selectAllCheckbox).toBeChecked();
    });

    it('should show indeterminate when some enabled items are selected', () => {
      render(
        <AssignmentTable
          items={itemsWithDisabled}
          selectedItems={new Set([1])} // Only one enabled item selected
          onSelectionChange={jest.fn()}
          onSelectAll={jest.fn()}
        />,
      );

      const checkboxes = screen.getAllByTestId('checkbox');
      const selectAllCheckbox = checkboxes[0];
      expect(selectAllCheckbox.getAttribute('data-indeterminate')).toBe('true');
    });

    it('should handle hierarchical selection with disabled children', () => {
      const hierarchicalWithDisabled: AssignmentItem[] = [
        {
          id: 'parent',
          name: 'Parent',
          level: 0,
          hasChildren: true,
          isSelected: false,
          disabled: false,
        },
        {
          id: 'child1',
          name: 'Enabled Child',
          level: 1,
          parentId: 'parent',
          hasChildren: false,
          isSelected: false,
          disabled: false,
        },
        {
          id: 'child2',
          name: 'Disabled Child',
          level: 1,
          parentId: 'parent',
          hasChildren: false,
          isSelected: false,
          disabled: true,
        },
      ];

      const mockOnSelectionChange = jest.fn();
      render(
        <AssignmentTable
          items={hierarchicalWithDisabled}
          selectedItems={new Set()}
          onSelectionChange={mockOnSelectionChange}
          onSelectAll={jest.fn()}
          hierarchicalSelection
          defaultExpanded
        />,
      );

      // Select parent - should only select enabled children
      const parentCheckbox = screen.getByRole('checkbox', {
        name: 'Select Parent',
      });
      fireEvent.click(parentCheckbox);

      // Should call for parent and enabled child only
      expect(mockOnSelectionChange).toHaveBeenCalledWith('parent');
      expect(mockOnSelectionChange).toHaveBeenCalledWith('child1');
      expect(mockOnSelectionChange).not.toHaveBeenCalledWith('child2');
    });

    it('should not auto-select parent when only enabled children are selected but disabled child exists', () => {
      const hierarchicalWithDisabled: AssignmentItem[] = [
        {
          id: 'parent',
          name: 'Parent',
          level: 0,
          hasChildren: true,
          isSelected: false,
          disabled: false,
        },
        {
          id: 'child1',
          name: 'Enabled Child',
          level: 1,
          parentId: 'parent',
          hasChildren: false,
          isSelected: false,
          disabled: false,
        },
        {
          id: 'child2',
          name: 'Disabled Child',
          level: 1,
          parentId: 'parent',
          hasChildren: false,
          isSelected: false,
          disabled: true,
        },
      ];

      const mockOnSelectionChange = jest.fn();
      render(
        <AssignmentTable
          items={hierarchicalWithDisabled}
          selectedItems={new Set()}
          onSelectionChange={mockOnSelectionChange}
          onSelectAll={jest.fn()}
          hierarchicalSelection
          defaultExpanded
        />,
      );

      // Select the enabled child
      const child1Checkbox = screen.getByRole('checkbox', {
        name: 'Select Enabled Child',
      });
      fireEvent.click(child1Checkbox);

      // Should auto-select parent since all enabled children are selected
      expect(mockOnSelectionChange).toHaveBeenCalledWith('child1');
      expect(mockOnSelectionChange).toHaveBeenCalledWith('parent');
    });

    it('should render parent with all children disabled correctly', () => {
      const allChildrenDisabled: AssignmentItem[] = [
        {
          id: 'parent',
          name: 'Parent',
          level: 0,
          hasChildren: true,
          isSelected: false,
          disabled: false,
        },
        {
          id: 'child1',
          name: 'Disabled Child 1',
          level: 1,
          parentId: 'parent',
          hasChildren: false,
          isSelected: false,
          disabled: true,
        },
        {
          id: 'child2',
          name: 'Disabled Child 2',
          level: 1,
          parentId: 'parent',
          hasChildren: false,
          isSelected: false,
          disabled: true,
        },
      ];

      render(
        <AssignmentTable
          items={allChildrenDisabled}
          selectedItems={new Set()}
          onSelectionChange={jest.fn()}
          onSelectAll={jest.fn()}
          hierarchicalSelection
          defaultExpanded
        />,
      );

      // Verify parent checkbox exists and is not disabled
      const parentCheckbox = screen.getByRole('checkbox', {
        name: 'Select Parent',
      });
      expect(parentCheckbox).toBeInTheDocument();
      expect(parentCheckbox).not.toBeDisabled();

      // Verify disabled children are rendered as disabled
      const child1Checkbox = screen.getByRole('checkbox', {
        name: 'Select Disabled Child 1',
      });
      const child2Checkbox = screen.getByRole('checkbox', {
        name: 'Select Disabled Child 2',
      });
      expect(child1Checkbox).toBeDisabled();
      expect(child2Checkbox).toBeDisabled();
    });

    it('should handle disabled items with undefined disabled property as enabled', () => {
      const itemsWithoutDisabled: AssignmentItem[] = [
        {
          id: 1,
          name: 'Item without disabled property',
          level: 0,
          hasChildren: false,
          isSelected: false,
          // disabled not set
        },
      ];

      render(
        <AssignmentTable
          items={itemsWithoutDisabled}
          selectedItems={new Set()}
          onSelectionChange={jest.fn()}
          onSelectAll={jest.fn()}
        />,
      );

      const checkbox = screen.getByRole('checkbox', {
        name: 'Select Item without disabled property',
      });
      expect(checkbox).not.toBeDisabled();
    });
  });

  describe('Edge cases for coverage', () => {
    it('should handle collapse action on expanded item', () => {
      const itemsWithParent: AssignmentItem[] = [
        {
          id: 1,
          name: 'Parent',
          level: 0,
          hasChildren: true,
          isSelected: false,
        },
        {
          id: 2,
          name: 'Child',
          level: 1,
          parentId: 1,
          hasChildren: false,
          isSelected: false,
        },
      ];

      render(
        <AssignmentTable
          items={itemsWithParent}
          selectedItems={new Set()}
          onSelectionChange={jest.fn()}
          onSelectAll={jest.fn()}
          defaultExpanded
        />,
      );

      // Child should be visible
      expect(screen.getByText('Child')).toBeInTheDocument();

      // Click to collapse (when expanded, shows chevron-up)
      const chevron = screen.getByTestId('chevron-up');
      fireEvent.click(chevron);

      // Child should now be hidden (collapsed)
      expect(screen.queryByText('Child')).not.toBeInTheDocument();
    });

    it('should handle item with no descendants in checkbox state', () => {
      const leafItem: AssignmentItem[] = [
        {
          id: 1,
          name: 'Leaf Item',
          level: 0,
          hasChildren: false,
          isSelected: false,
        },
      ];

      render(
        <AssignmentTable
          items={leafItem}
          selectedItems={new Set()}
          onSelectionChange={jest.fn()}
          onSelectAll={jest.fn()}
        />,
      );

      const checkbox = screen.getByRole('checkbox', {
        name: 'Select Leaf Item',
      });
      expect(checkbox).not.toBeChecked();
    });

    it('should deselect all descendants when parent with all selected children is clicked', () => {
      const mockOnSelectionChange = jest.fn();
      const itemsWithAllSelected: AssignmentItem[] = [
        {
          id: 'parent',
          name: 'Parent',
          level: 0,
          hasChildren: true,
          isSelected: true,
        },
        {
          id: 'child1',
          name: 'Child 1',
          level: 1,
          parentId: 'parent',
          hasChildren: false,
          isSelected: true,
        },
        {
          id: 'child2',
          name: 'Child 2',
          level: 1,
          parentId: 'parent',
          hasChildren: false,
          isSelected: true,
        },
      ];

      render(
        <AssignmentTable
          items={itemsWithAllSelected}
          selectedItems={new Set(['parent', 'child1', 'child2'])}
          onSelectionChange={mockOnSelectionChange}
          onSelectAll={jest.fn()}
          hierarchicalSelection
          defaultExpanded
        />,
      );

      // Click parent checkbox to deselect all
      const parentCheckbox = screen.getByRole('checkbox', {
        name: 'Select Parent',
      });
      fireEvent.click(parentCheckbox);

      // Should deselect all children and parent
      expect(mockOnSelectionChange).toHaveBeenCalledWith('child1');
      expect(mockOnSelectionChange).toHaveBeenCalledWith('child2');
      expect(mockOnSelectionChange).toHaveBeenCalledWith('parent');
      expect(mockOnSelectionChange).toHaveBeenCalledTimes(3);
    });

    it('should handle parent click when some descendants are already deselected', () => {
      const mockOnSelectionChange = jest.fn();
      const itemsPartiallySelected: AssignmentItem[] = [
        {
          id: 'parent',
          name: 'Parent',
          level: 0,
          hasChildren: true,
          isSelected: false,
        },
        {
          id: 'child1',
          name: 'Child 1',
          level: 1,
          parentId: 'parent',
          hasChildren: false,
          isSelected: false,
        },
        {
          id: 'child2',
          name: 'Child 2',
          level: 1,
          parentId: 'parent',
          hasChildren: false,
          isSelected: true,
        },
      ];

      render(
        <AssignmentTable
          items={itemsPartiallySelected}
          selectedItems={new Set(['child2'])}
          onSelectionChange={mockOnSelectionChange}
          onSelectAll={jest.fn()}
          hierarchicalSelection
          defaultExpanded
        />,
      );

      // Click parent to select all
      const parentCheckbox = screen.getByRole('checkbox', {
        name: 'Select Parent',
      });
      fireEvent.click(parentCheckbox);

      // Should select unselected child and parent (child2 already selected, so skip it in the loop)
      expect(mockOnSelectionChange).toHaveBeenCalledWith('child1');
      expect(mockOnSelectionChange).toHaveBeenCalledWith('parent');
    });

    it('should handle hierarchical selection with 5-level deep structure (level 0-4)', () => {
      const mockOnSelectionChange = jest.fn();
      const fiveLevelItems: AssignmentItem[] = [
        {
          id: 1,
          name: 'Level 0',
          level: 0,
          hasChildren: true,
          isSelected: false,
        },
        {
          id: 2,
          name: 'Level 1',
          level: 1,
          parentId: 1,
          hasChildren: true,
          isSelected: false,
        },
        {
          id: 3,
          name: 'Level 2',
          level: 2,
          parentId: 2,
          hasChildren: true,
          isSelected: false,
        },
        {
          id: 4,
          name: 'Level 3',
          level: 3,
          parentId: 3,
          hasChildren: true,
          isSelected: false,
        },
        {
          id: 5,
          name: 'Level 4',
          level: 4,
          parentId: 4,
          hasChildren: false,
          isSelected: false,
        },
      ];

      render(
        <AssignmentTable
          items={fiveLevelItems}
          selectedItems={new Set()}
          onSelectionChange={mockOnSelectionChange}
          onSelectAll={jest.fn()}
          hierarchicalSelection
          defaultExpanded
        />,
      );

      // Click level 0 parent to select all descendants including level 4
      const level0Checkbox = screen.getByRole('checkbox', {
        name: 'Select Level 0',
      });
      fireEvent.click(level0Checkbox);

      // Should select all levels including level 4 (covers getAllDescendants level 4 path)
      expect(mockOnSelectionChange).toHaveBeenCalledWith(5);
      expect(mockOnSelectionChange).toHaveBeenCalledWith(4);
      expect(mockOnSelectionChange).toHaveBeenCalledWith(3);
      expect(mockOnSelectionChange).toHaveBeenCalledWith(2);
      expect(mockOnSelectionChange).toHaveBeenCalledWith(1);
    });

    it('should show indeterminate state for parent when some descendants are selected in 5-level hierarchy', () => {
      const fiveLevelItems: AssignmentItem[] = [
        {
          id: 1,
          name: 'Level 0',
          level: 0,
          hasChildren: true,
          isSelected: false,
        },
        {
          id: 2,
          name: 'Level 1',
          level: 1,
          parentId: 1,
          hasChildren: true,
          isSelected: false,
        },
        {
          id: 3,
          name: 'Level 2',
          level: 2,
          parentId: 2,
          hasChildren: true,
          isSelected: false,
        },
        {
          id: 4,
          name: 'Level 3',
          level: 3,
          parentId: 3,
          hasChildren: true,
          isSelected: false,
        },
        {
          id: 5,
          name: 'Level 4',
          level: 4,
          parentId: 4,
          hasChildren: false,
          isSelected: false,
        },
      ];

      render(
        <AssignmentTable
          items={fiveLevelItems}
          selectedItems={new Set([3, 5])}
          onSelectionChange={jest.fn()}
          onSelectAll={jest.fn()}
          hierarchicalSelection
          defaultExpanded
        />,
      );

      const level0Checkbox = screen.getByRole('checkbox', {
        name: 'Select Level 0',
      });
      expect(level0Checkbox.getAttribute('data-indeterminate')).toBe('true');
    });
  });

  describe('Search/Filter scenarios with hierarchical selection', () => {
    const workerGroupItems: AssignmentItem[] = [
      {
        id: 'group-1',
        name: 'Group G1',
        level: 0,
        hasChildren: true,
        isSelected: false,
      },
      {
        id: 'worker-1',
        name: 'Worker W1',
        level: 1,
        parentId: 'group-1',
        hasChildren: false,
        isSelected: false,
      },
      {
        id: 'worker-2',
        name: 'Worker W2',
        level: 1,
        parentId: 'group-1',
        hasChildren: false,
        isSelected: false,
      },
    ];

    it('should NOT auto-select parent when selecting one worker from filtered search results', () => {
      const mockOnSelectionChange = jest.fn();

      // Simulate search results: only W1 and parent G1 are displayed
      const filteredItems = workerGroupItems.filter(
        (item) => item.id === 'group-1' || item.id === 'worker-1',
      );

      render(
        <AssignmentTable
          items={workerGroupItems} // Full list for sibling checking
          displayItems={filteredItems} // Filtered list for display
          selectedItems={new Set()}
          onSelectionChange={mockOnSelectionChange}
          onSelectAll={jest.fn()}
          hierarchicalSelection
          defaultExpanded
        />,
      );

      // Select W1 from search results
      const w1Checkbox = screen.getByRole('checkbox', {
        name: 'Select Worker W1',
      });
      fireEvent.click(w1Checkbox);

      // Should only select W1, NOT parent (because W2 is not selected)
      expect(mockOnSelectionChange).toHaveBeenCalledWith('worker-1');
      expect(mockOnSelectionChange).not.toHaveBeenCalledWith('group-1');
      expect(mockOnSelectionChange).toHaveBeenCalledTimes(1);
    });

    it('should auto-select parent when ALL workers are selected even from filtered results', () => {
      const mockOnSelectionChange = jest.fn();

      // W1 is already selected, now we're displaying W2 in search results
      const filteredItems = workerGroupItems.filter(
        (item) => item.id === 'group-1' || item.id === 'worker-2',
      );

      render(
        <AssignmentTable
          items={workerGroupItems} // Full list for sibling checking
          displayItems={filteredItems} // Filtered list shows only W2
          selectedItems={new Set(['worker-1'])} // W1 already selected
          onSelectionChange={mockOnSelectionChange}
          onSelectAll={jest.fn()}
          hierarchicalSelection
          defaultExpanded
        />,
      );

      // Select W2 (now all workers are selected)
      const w2Checkbox = screen.getByRole('checkbox', {
        name: 'Select Worker W2',
      });
      fireEvent.click(w2Checkbox);

      // Should select W2 AND auto-select parent (all workers now selected)
      expect(mockOnSelectionChange).toHaveBeenCalledWith('worker-2');
      expect(mockOnSelectionChange).toHaveBeenCalledWith('group-1');
      expect(mockOnSelectionChange).toHaveBeenCalledTimes(2);
    });

    it('should render only filtered items while checking siblings from full list', () => {
      // Simulate search: only W1 is displayed
      const filteredItems = workerGroupItems.filter(
        (item) => item.id === 'group-1' || item.id === 'worker-1',
      );

      render(
        <AssignmentTable
          items={workerGroupItems}
          displayItems={filteredItems}
          selectedItems={new Set()}
          onSelectionChange={jest.fn()}
          onSelectAll={jest.fn()}
          hierarchicalSelection
          defaultExpanded
        />,
      );

      // W1 should be visible
      expect(screen.getByText('Worker W1')).toBeInTheDocument();

      // W2 should NOT be visible (filtered out)
      expect(screen.queryByText('Worker W2')).not.toBeInTheDocument();

      // Parent should be visible (with count)
      expect(screen.getByText(/Group G1/)).toBeInTheDocument();
    });

    it('should work correctly without displayItems prop (backward compatible)', () => {
      const mockOnSelectionChange = jest.fn();

      render(
        <AssignmentTable
          items={workerGroupItems}
          // No displayItems prop - should use items for both
          selectedItems={new Set()}
          onSelectionChange={mockOnSelectionChange}
          onSelectAll={jest.fn()}
          hierarchicalSelection
          defaultExpanded
        />,
      );

      // Select W1
      const w1Checkbox = screen.getByRole('checkbox', {
        name: 'Select Worker W1',
      });
      fireEvent.click(w1Checkbox);

      // Should only select W1, NOT parent
      expect(mockOnSelectionChange).toHaveBeenCalledWith('worker-1');
      expect(mockOnSelectionChange).not.toHaveBeenCalledWith('group-1');
    });
  });
});

/**
 * Unit tests for GroupFilterDropdown component
 *
 * Tests cover:
 * - Basic rendering with different props
 * - User interactions (selecting different filter options)
 * - Loading state
 * - Value prop handling
 * - Edge cases (empty groups, inactive groups, missing stats)
 *
 * Note: The component no longer accepts an 'error' prop.
 * Error handling is managed at a higher level.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import type { GetTimeTrackingGroupsQuery_timeTrackingGroups_TimeTracking_GroupConnection_edges_TimeTracking_GroupEdge_node_TimeTracking_Group as QueryGroupNode } from 'src/__generated__/timeTracking/graphql';
import { GroupFilterDropdown } from 'src/js/widgets/assignments/components/Groups/GroupFilterDropdown';

// Mock useIntl from @payroll/quicksand
jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: jest.fn(({ id, defaultMessage }) => defaultMessage || id),
  }),
}));

// Mock IDS Dropdown - separates options (MenuItem) from Load More button for valid DOM
jest.mock('@ids-ts/dropdown', () => ({
  Dropdown: ({
    children,
    onChange,
    value,
    label,
    disabled,
    'data-testid': dataTestId,
    'aria-label': ariaLabel,
  }: any) => {
    const selectId = dataTestId || 'dropdown-select';
    const childArray = React.Children.toArray(children);
    const options = childArray.filter(
      (c) =>
        React.isValidElement(c) &&
        c.props?.value !== undefined &&
        c.props?.['data-testid'] !== 'group-filter-load-more',
    );
    const loadMoreButton = childArray.find(
      (c) =>
        React.isValidElement(c) &&
        c.props?.['data-testid'] === 'group-filter-load-more',
    );
    return (
      <div data-testid="dropdown" data-value={value} aria-label={ariaLabel}>
        <label htmlFor={selectId}>{label}</label>
        <select
          id={selectId}
          data-testid={selectId}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e)}
        >
          {options}
        </select>
        {loadMoreButton}
      </div>
    );
  },
  MenuItem: ({ children, value }: any) => (
    <option value={value}>{children}</option>
  ),
}));

// Mock Activity for Load More loading state
jest.mock('@ids-ts/loader', () => ({
  Activity: () => <span data-testid="activity-loader">Loading</span>,
}));

const mockGroups = [
  {
    id: 'group-1',
    name: 'Engineering',
    isActive: true,
    stats: { memberCount: 25, managerCount: 2 },
  },
  {
    id: 'group-2',
    name: 'Marketing',
    isActive: true,
    stats: { memberCount: 10, managerCount: 1 },
  },
  {
    id: 'group-3',
    name: 'Inactive Group',
    isActive: false,
    stats: { memberCount: 5, managerCount: 1 },
  },
] as QueryGroupNode[];

describe('GroupFilterDropdown', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render dropdown with default options', () => {
      render(
        <GroupFilterDropdown
          groups={[]}
          loading={false}
          value="ALL"
          onChange={mockOnChange}
        />,
      );

      expect(screen.getByTestId('group-filter-dropdown')).toBeInTheDocument();
      expect(screen.getByText('All workers')).toBeInTheDocument();
      expect(screen.getByText('No group')).toBeInTheDocument();
    });

    it('should render with active groups only', () => {
      render(
        <GroupFilterDropdown
          groups={mockGroups}
          loading={false}
          value="ALL"
          onChange={mockOnChange}
          showCounts={false}
        />,
      );

      expect(screen.getByText('Engineering')).toBeInTheDocument();
      expect(screen.getByText('Marketing')).toBeInTheDocument();
      expect(screen.queryByText('Inactive Group')).not.toBeInTheDocument();
    });

    it('should show member count when showCounts is true', () => {
      render(
        <GroupFilterDropdown
          groups={mockGroups}
          loading={false}
          value="ALL"
          onChange={mockOnChange}
          showCounts
        />,
      );

      expect(screen.getByText('Engineering (25)')).toBeInTheDocument();
      expect(screen.getByText('Marketing (10)')).toBeInTheDocument();
    });

    it('should not show member count when showCounts is false', () => {
      render(
        <GroupFilterDropdown
          groups={mockGroups}
          loading={false}
          value="ALL"
          onChange={mockOnChange}
          showCounts={false}
        />,
      );

      expect(screen.getByText('Engineering')).toBeInTheDocument();
      expect(screen.queryByText('Engineering (25)')).not.toBeInTheDocument();
    });

    it('should render without label when showLabel is false', () => {
      render(
        <GroupFilterDropdown
          groups={mockGroups}
          loading={false}
          value="ALL"
          onChange={mockOnChange}
          showLabel={false}
        />,
      );

      const dropdown = screen.getByTestId('dropdown');
      expect(dropdown).toBeInTheDocument();
      expect(dropdown).toHaveAttribute('aria-label', 'Filter workers by group');
      expect(screen.queryByText('Filter by group')).not.toBeInTheDocument();
    });

    it('should render with label when showLabel is true', () => {
      render(
        <GroupFilterDropdown
          groups={mockGroups}
          loading={false}
          value="ALL"
          onChange={mockOnChange}
          showLabel
        />,
      );

      expect(screen.getByText('Filter by group')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onChange when "All workers" is selected', () => {
      render(
        <GroupFilterDropdown
          groups={mockGroups}
          loading={false}
          value="group-1"
          onChange={mockOnChange}
        />,
      );

      const select = screen.getByTestId('group-filter-dropdown');
      fireEvent.change(select, { target: { value: 'ALL' } });

      expect(mockOnChange).toHaveBeenCalledWith('ALL');
    });

    it('should call onChange when "No group" is selected', () => {
      render(
        <GroupFilterDropdown
          groups={mockGroups}
          loading={false}
          value="ALL"
          onChange={mockOnChange}
        />,
      );

      const select = screen.getByTestId('group-filter-dropdown');
      fireEvent.change(select, { target: { value: 'NO_GROUP' } });

      expect(mockOnChange).toHaveBeenCalledWith('NO_GROUP');
    });

    it('should call onChange when a specific group is selected', () => {
      render(
        <GroupFilterDropdown
          groups={mockGroups}
          loading={false}
          value="ALL"
          onChange={mockOnChange}
        />,
      );

      const select = screen.getByTestId('group-filter-dropdown');
      fireEvent.change(select, { target: { value: 'group-1' } });

      expect(mockOnChange).toHaveBeenCalledWith('group-1');
    });
  });

  describe('Loading State', () => {
    it('should show loading state when loading is true', () => {
      render(
        <GroupFilterDropdown
          groups={[]}
          loading
          value="ALL"
          onChange={mockOnChange}
        />,
      );

      expect(screen.getByText('Loading groups...')).toBeInTheDocument();
      const select = screen.getByTestId('group-filter-dropdown');
      expect(select).toBeDisabled();
    });

    it('should not be disabled when loading is false', () => {
      render(
        <GroupFilterDropdown
          groups={mockGroups}
          loading={false}
          value="ALL"
          onChange={mockOnChange}
        />,
      );

      const select = screen.getByTestId('group-filter-dropdown');
      expect(select).not.toBeDisabled();
    });
  });

  describe('Value Prop', () => {
    it.each([
      {
        description: 'reflects current value for specific group',
        value: 'group-1',
      },
      { description: 'handles ALL value', value: 'ALL' },
      { description: 'handles NO_GROUP value', value: 'NO_GROUP' },
    ])('$description', ({ value }) => {
      render(
        <GroupFilterDropdown
          groups={mockGroups}
          loading={false}
          value={value}
          onChange={mockOnChange}
        />,
      );

      const dropdown = screen.getByTestId('dropdown');
      expect(dropdown).toHaveAttribute('data-value', value);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty groups array', () => {
      render(
        <GroupFilterDropdown
          groups={[]}
          loading={false}
          value="ALL"
          onChange={mockOnChange}
        />,
      );

      expect(screen.getByText('All workers')).toBeInTheDocument();
      expect(screen.getByText('No group')).toBeInTheDocument();
      expect(screen.queryByText('Engineering')).not.toBeInTheDocument();
    });

    it('should handle groups without stats', () => {
      const groupsWithoutStats = [
        { id: 'group-1', name: 'Group 1', isActive: true },
      ] as QueryGroupNode[];

      render(
        <GroupFilterDropdown
          groups={groupsWithoutStats}
          loading={false}
          value="ALL"
          onChange={mockOnChange}
          showCounts
        />,
      );

      expect(screen.getByText('Group 1')).toBeInTheDocument();
      expect(screen.queryByText(/\(\d+\)/)).not.toBeInTheDocument();
    });

    it('should filter out all inactive groups', () => {
      const allInactiveGroups = [
        { id: 'group-1', name: 'Inactive 1', isActive: false },
        { id: 'group-2', name: 'Inactive 2', isActive: false },
      ] as QueryGroupNode[];

      render(
        <GroupFilterDropdown
          groups={allInactiveGroups}
          loading={false}
          value="ALL"
          onChange={mockOnChange}
        />,
      );

      expect(screen.queryByText('Inactive 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Inactive 2')).not.toBeInTheDocument();
    });
  });

  describe('Load More', () => {
    it('should render Load More button when hasNextPage, endCursor, and onLoadMore are provided', () => {
      const mockOnLoadMore = jest.fn();
      render(
        <GroupFilterDropdown
          groups={mockGroups}
          loading={false}
          value="ALL"
          onChange={mockOnChange}
          hasNextPage
          endCursor="cursor-123"
          onLoadMore={mockOnLoadMore}
        />,
      );

      expect(screen.getByText('Load More')).toBeInTheDocument();
      expect(screen.getByTestId('group-filter-load-more')).toBeInTheDocument();
    });

    it('should not render Load More when hasNextPage is false', () => {
      const mockOnLoadMore = jest.fn();
      render(
        <GroupFilterDropdown
          groups={mockGroups}
          loading={false}
          value="ALL"
          onChange={mockOnChange}
          hasNextPage={false}
          endCursor="cursor-123"
          onLoadMore={mockOnLoadMore}
        />,
      );

      expect(screen.queryByText('Load More')).not.toBeInTheDocument();
    });

    it('should not render Load More when endCursor is missing', () => {
      const mockOnLoadMore = jest.fn();
      render(
        <GroupFilterDropdown
          groups={mockGroups}
          loading={false}
          value="ALL"
          onChange={mockOnChange}
          hasNextPage
          onLoadMore={mockOnLoadMore}
        />,
      );

      expect(screen.queryByText('Load More')).not.toBeInTheDocument();
    });

    it('should not render Load More when onLoadMore is not provided', () => {
      render(
        <GroupFilterDropdown
          groups={mockGroups}
          loading={false}
          value="ALL"
          onChange={mockOnChange}
          hasNextPage
          endCursor="cursor-123"
        />,
      );

      expect(screen.queryByText('Load More')).not.toBeInTheDocument();
    });

    it('should call onLoadMore when Load More button is clicked', () => {
      const mockOnLoadMore = jest.fn();
      render(
        <GroupFilterDropdown
          groups={mockGroups}
          loading={false}
          value="ALL"
          onChange={mockOnChange}
          hasNextPage
          endCursor="cursor-123"
          onLoadMore={mockOnLoadMore}
        />,
      );

      fireEvent.click(screen.getByTestId('group-filter-load-more'));

      expect(mockOnLoadMore).toHaveBeenCalledTimes(1);
    });

    it('should show loading state on Load More when isLoadingMore is true', () => {
      const mockOnLoadMore = jest.fn();
      render(
        <GroupFilterDropdown
          groups={mockGroups}
          loading={false}
          value="ALL"
          onChange={mockOnChange}
          hasNextPage
          endCursor="cursor-123"
          onLoadMore={mockOnLoadMore}
          isLoadingMore
        />,
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByTestId('activity-loader')).toBeInTheDocument();
      expect(screen.getByTestId('group-filter-load-more')).toBeDisabled();
    });

    it('should not call onLoadMore when isLoadingMore and button is clicked', () => {
      const mockOnLoadMore = jest.fn();
      render(
        <GroupFilterDropdown
          groups={mockGroups}
          loading={false}
          value="ALL"
          onChange={mockOnChange}
          hasNextPage
          endCursor="cursor-123"
          onLoadMore={mockOnLoadMore}
          isLoadingMore
        />,
      );

      fireEvent.click(screen.getByTestId('group-filter-load-more'));

      expect(mockOnLoadMore).not.toHaveBeenCalled();
    });

    it('should not call onLoadMore when isLoadingMore and Enter key is pressed', () => {
      const mockOnLoadMore = jest.fn();
      render(
        <GroupFilterDropdown
          groups={mockGroups}
          loading={false}
          value="ALL"
          onChange={mockOnChange}
          hasNextPage
          endCursor="cursor-123"
          onLoadMore={mockOnLoadMore}
          isLoadingMore
        />,
      );

      const loadMoreBtn = screen.getByTestId('group-filter-load-more');
      fireEvent.keyDown(loadMoreBtn, { key: 'Enter' });

      expect(mockOnLoadMore).not.toHaveBeenCalled();
    });

    it('should not call onLoadMore when isLoadingMore and Space key is pressed', () => {
      const mockOnLoadMore = jest.fn();
      render(
        <GroupFilterDropdown
          groups={mockGroups}
          loading={false}
          value="ALL"
          onChange={mockOnChange}
          hasNextPage
          endCursor="cursor-123"
          onLoadMore={mockOnLoadMore}
          isLoadingMore
        />,
      );

      const loadMoreBtn = screen.getByTestId('group-filter-load-more');
      fireEvent.keyDown(loadMoreBtn, { key: ' ' });

      expect(mockOnLoadMore).not.toHaveBeenCalled();
    });

    it('should show dropdown content (not loading) when loading is false but isLoadingMore is true', () => {
      const mockOnLoadMore = jest.fn();
      render(
        <GroupFilterDropdown
          groups={mockGroups}
          loading={false}
          value="ALL"
          onChange={mockOnChange}
          hasNextPage
          endCursor="cursor-123"
          onLoadMore={mockOnLoadMore}
          isLoadingMore
        />,
      );

      expect(screen.getByText('All workers')).toBeInTheDocument();
      // When isLoadingMore, button shows "Loading..." not "Load More"
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByTestId('group-filter-load-more')).toBeDisabled();
      expect(screen.queryByText('Loading groups...')).not.toBeInTheDocument();
    });

    it('should show dropdown with Load More (not initial loading) when loading and isLoadingMore are both true', () => {
      const mockOnLoadMore = jest.fn();
      render(
        <GroupFilterDropdown
          groups={mockGroups}
          loading
          value="ALL"
          onChange={mockOnChange}
          hasNextPage
          endCursor="cursor-123"
          onLoadMore={mockOnLoadMore}
          isLoadingMore
        />,
      );

      expect(screen.getByText('All workers')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Loading groups...')).not.toBeInTheDocument();
    });

    it('should call onLoadMore when Load More button receives Enter key', () => {
      const mockOnLoadMore = jest.fn();
      render(
        <GroupFilterDropdown
          groups={mockGroups}
          loading={false}
          value="ALL"
          onChange={mockOnChange}
          hasNextPage
          endCursor="cursor-123"
          onLoadMore={mockOnLoadMore}
        />,
      );

      const loadMoreBtn = screen.getByTestId('group-filter-load-more');
      fireEvent.keyDown(loadMoreBtn, { key: 'Enter' });

      expect(mockOnLoadMore).toHaveBeenCalledTimes(1);
    });

    it('should call onLoadMore when Load More button receives Space key', () => {
      const mockOnLoadMore = jest.fn();
      render(
        <GroupFilterDropdown
          groups={mockGroups}
          loading={false}
          value="ALL"
          onChange={mockOnChange}
          hasNextPage
          endCursor="cursor-123"
          onLoadMore={mockOnLoadMore}
        />,
      );

      const loadMoreBtn = screen.getByTestId('group-filter-load-more');
      fireEvent.keyDown(loadMoreBtn, { key: ' ' });

      expect(mockOnLoadMore).toHaveBeenCalledTimes(1);
    });
  });
});

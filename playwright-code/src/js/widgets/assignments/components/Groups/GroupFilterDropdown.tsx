import React, { KeyboardEvent, MouseEvent } from 'react';
import { Dropdown, MenuItem } from '@ids-ts/dropdown';
import { Activity } from '@ids-ts/loader';
import { useIntl } from '@payroll/quicksand';
import styled from 'styled-components';
import type { GetTimeTrackingGroupsQuery_timeTrackingGroups_TimeTracking_GroupConnection_edges_TimeTracking_GroupEdge_node_TimeTracking_Group as QueryGroupNode } from 'src/__generated__/timeTracking/graphql';

/**
 * Non-selectable Load More button that stays inside dropdown without closing it.
 * Uses stopPropagation so the Dropdown doesn't treat it as a selection.
 */
const LoadMoreButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  gap: 8px;
  cursor: pointer;

  &:hover {
    background-color: transparent;
  }

  &:disabled {
    cursor: default;
    opacity: 1 !important;
  }
`;

export interface GroupFilterDropdownProps {
  /**
   * List of groups to display in dropdown
   */
  groups: QueryGroupNode[];

  /**
   * Loading state for groups fetch
   */
  loading: boolean;

  /**
   * Currently selected filter value
   * - 'ALL': Show all workers
   * - 'NO_GROUP': Show only workers without groups
   * - string (group ID): Show only workers from specific group
   */
  value: string;

  /**
   * Callback when filter selection changes
   */
  onChange: (value: string) => void;

  /**
   * Optional: Called when the dropdown opens
   */
  onOpen?: () => void;

  /**
   * Optional: Show member counts in dropdown options
   */
  showCounts?: boolean;

  /**
   * Optional: Show label above dropdown
   */
  showLabel?: boolean;

  /**
   * Optional: Whether there is a next page (for Load More button)
   */
  hasNextPage?: boolean;

  /**
   * Optional: Valid endCursor for pagination (required with hasNextPage for Load More)
   */
  endCursor?: string | null;

  /**
   * Optional: Callback when Load More is clicked
   */
  onLoadMore?: () => void;

  /**
   * Optional: Loading state for Load More (shows spinner on button)
   */
  isLoadingMore?: boolean;
}

/**
 * GroupFilterDropdown Component
 *
 * Dropdown to filter workers by group membership in worker selection screens.
 * Used in both Create and Edit group drawers for filtering available workers.
 *
 * Options:
 * - All workers (default)
 * - No group (workers without group assignment)
 * - Specific groups (from company's active groups)
 */
export const GroupFilterDropdown: React.FC<GroupFilterDropdownProps> = ({
  groups,
  loading,
  value,
  onChange,
  onOpen,
  showCounts = true,
  showLabel = true,
  hasNextPage = false,
  endCursor,
  onLoadMore,
  isLoadingMore = false,
}) => {
  const intl = useIntl();

  const showLoadMore =
    hasNextPage && endCursor && typeof onLoadMore === 'function';

  const handleChange = (event: KeyboardEvent | MouseEvent) => {
    // @ts-ignore - event.target.value exists on dropdown
    onChange(event.target.value as string);
  };

  // Loading state
  if (loading && !isLoadingMore) {
    return (
      <Dropdown
        value={value}
        onChange={() => {}}
        onOpen={onOpen}
        label={
          showLabel
            ? intl.formatMessage({
                id: 'workers.filter.byGroup',
                defaultMessage: 'Filter by group',
              })
            : undefined
        }
        aria-label={intl.formatMessage({
          id: 'workers.filter.byGroup.aria',
          defaultMessage: 'Filter workers by group',
        })}
        disabled
        data-testid="group-filter-dropdown"
      >
        <MenuItem key="loading" value={value}>
          {intl.formatMessage({
            id: 'workers.filter.loading',
            defaultMessage: 'Loading groups...',
          })}
        </MenuItem>
      </Dropdown>
    );
  }

  // Build all menu items as a single array to satisfy Dropdown's children type
  const allMenuItems = [
    <MenuItem key="ALL" value="ALL">
      {intl.formatMessage({
        id: 'workers.filter.allWorkers',
        defaultMessage: 'All workers',
      })}
    </MenuItem>,
    <MenuItem key="NO_GROUP" value="NO_GROUP">
      {intl.formatMessage({
        id: 'workers.filter.noGroup',
        defaultMessage: 'No group',
      })}
    </MenuItem>,
    ...groups
      .filter((g) => g.isActive)
      .map((group) => (
        <MenuItem key={group.id} value={group.id}>
          {group.name}
          {showCounts &&
            group.stats?.memberCount !== undefined &&
            ` (${group.stats.memberCount})`}
        </MenuItem>
      )),
    ...(showLoadMore
      ? [
          <LoadMoreButton
            key="load-more"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!isLoadingMore) onLoadMore?.();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                if (!isLoadingMore) onLoadMore?.();
              }
            }}
            disabled={isLoadingMore}
            data-testid="group-filter-load-more"
            role="button"
            tabIndex={0}
          >
            {isLoadingMore ? (
              <>
                <Activity shape="dots" size="small" />
                {intl.formatMessage({
                  id: 'workers.filter.loadMore.loading',
                  defaultMessage: 'Loading...',
                })}
              </>
            ) : (
              intl.formatMessage({
                id: 'workers.filter.loadMore',
                defaultMessage: 'Load More',
              })
            )}
          </LoadMoreButton>,
        ]
      : []),
  ];

  return (
    <Dropdown
      value={value}
      onChange={handleChange}
      onOpen={onOpen}
      label={
        showLabel
          ? intl.formatMessage({
              id: 'workers.filter.byGroup',
              defaultMessage: 'Filter by group',
            })
          : undefined
      }
      aria-label={intl.formatMessage({
        id: 'workers.filter.byGroup.aria',
        defaultMessage: 'Filter workers by group',
      })}
      data-testid="group-filter-dropdown"
    >
      {allMenuItems}
    </Dropdown>
  );
};

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useCombinedGroupsDataFetching } from './hooks/useCombinedGroupsDataFetching';
import { WorkersTableByGroupsViewContent } from './WorkersTableByGroupsViewContent';
import { GROUPS_PAGE_SIZE } from './constants';

interface WorkersGroupViewDataProviderProps {
  searchText?: string;
  onRefetchAvailable?: (refetch: () => void) => void;
  onLoadingChange?: (isLoading: boolean) => void;
}

/**
 * Data Provider for Workers Group View with Pagination
 * Orchestrates data fetching and passes data to presentation components
 * Uses combined data fetching hook to eliminate multiple useEffects
 */
export const WorkersGroupViewDataProvider: React.FC<
  WorkersGroupViewDataProviderProps
> = ({ searchText = '', onRefetchAvailable, onLoadingChange }) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Use combined data fetching hook (replaces multiple useEffects for header counts)
  const {
    groups,
    groupsCount,
    groupsTotalCount,
    loading,
    error,
    loadGroups,
    fetchNextPage,
    fetchPreviousPage,
    refetchHeaderCounts,
  } = useCombinedGroupsDataFetching(searchText);

  // Track if initial load has happened
  const initialLoadRef = useRef(false);
  const prevSearchTextRef = useRef<string>('');

  // Notify parent about loading state changes
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(loading);
    }
  }, [loading, onLoadingChange]);

  // Load groups when search changes (only if search text changed)
  useEffect(() => {
    if (!initialLoadRef.current || prevSearchTextRef.current !== searchText) {
      initialLoadRef.current = true;
      prevSearchTextRef.current = searchText;
      setCurrentPage(1);

      loadGroups({
        first: GROUPS_PAGE_SIZE,
        filter: {
          isActive: true,
          ...(searchText && { searchText }),
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  // Expose refetch function to parent
  const refetchGroups = useCallback(() => {
    setCurrentPage(1);
    loadGroups({
      first: GROUPS_PAGE_SIZE,
      filter: {
        isActive: true,
        ...(searchText && { searchText }),
      },
    });
    refetchHeaderCounts();
  }, [loadGroups, searchText, refetchHeaderCounts]);

  // Notify parent about refetch availability
  useEffect(() => {
    if (onRefetchAvailable) {
      onRefetchAvailable(refetchGroups);
    }
  }, [onRefetchAvailable, refetchGroups]);

  // Handle page change (no try-catch - errors handled at GraphQL level)
  const handlePageChange = useCallback(
    async (page: number) => {
      if (page === currentPage) {
        return;
      }

      if (page > currentPage) {
        // Moving forward
        await fetchNextPage({
          first: GROUPS_PAGE_SIZE,
          filter: {
            isActive: true,
            ...(searchText && { searchText }),
          },
        });
      } else {
        // Moving backward
        await fetchPreviousPage({
          first: GROUPS_PAGE_SIZE,
          filter: {
            isActive: true,
            ...(searchText && { searchText }),
          },
        });
      }
      setCurrentPage(page);
    },
    [currentPage, fetchNextPage, fetchPreviousPage, searchText],
  );

  return (
    <WorkersTableByGroupsViewContent
      groups={groups}
      groupsCount={groupsCount}
      isLoading={loading}
      error={error}
      refetch={refetchGroups}
      currentPage={currentPage}
      pageSize={GROUPS_PAGE_SIZE}
      totalCount={groupsTotalCount}
      onPageChange={handlePageChange}
      searchText={searchText}
    />
  );
};

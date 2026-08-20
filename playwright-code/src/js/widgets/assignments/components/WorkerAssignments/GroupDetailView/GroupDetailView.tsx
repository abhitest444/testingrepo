import React, { useEffect } from 'react';
import { Pagination } from '@ids-ts/pagination';
import { useIntl } from '@payroll/quicksand';
import { WORKERS_PAGE_SIZE } from 'src/js/widgets/assignments/utils/constants';
import { useNttfEligibility } from 'src/js/service/hooks/nttf/useNttfEligibility';
import { GroupDetailHeader } from './components/GroupDetailHeader';
import { GroupDetailFilterBar } from './components/GroupDetailFilterBar';
import { GroupDetailWorkersTable } from './components/GroupDetailWorkersTable';
import { Container } from './styles/GroupDetailView.styled';
import { PaginationContainer } from '../../styles/WorkersListView.styled';
import { useGroupDetailData } from './hooks/useGroupDetailData';
import { selectGroupDetailViewError } from '../../../store/workersGroupViewSlice';
import { useAppSelector } from '../../../store';

export interface GroupDetailViewProps {
  onRefetchAvailable?: (refetch: () => void) => void;
}

/**
 * GroupDetailView Component (Presentational Component)
 * Main container for the group detail drill-down view
 * Displays workers for a specific group with back navigation
 *
 * This component focuses on rendering and delegates all data fetching,
 * state management, and business logic to the useGroupDetailData hook.
 *
 * Responsibilities:
 * - Render group header with stats
 * - Render filter bar with search and filter controls
 * - Render workers table
 * - Render pagination controls
 * - Pass action handlers to child components
 */
export const GroupDetailView: React.FC<GroupDetailViewProps> = ({
  onRefetchAvailable,
}) => {
  const intl = useIntl();
  // Use dataloader hook to get all data and handlers
  const {
    selectedGroup,
    memberCount,
    managerCount,
    workers,
    isLoading,
    searchText,
    filterType,
    currentPage,
    totalPages,
    totalItems,
    headerTotalCount,
    handleBack,
    handleSearchChange,
    handleFilterChange,
    handlePageChange,
    handleAssignWorkers,
    handleAssignLeads,
    refetchWorkers,
  } = useGroupDetailData();

  const error = useAppSelector(selectGroupDetailViewError);
  const { isNttfEligible, loading: nttfLoading } = useNttfEligibility();
  const shouldShowGroupLeads = !isNttfEligible; // Show leads when NOT NTTF eligible

  // Provide refetch callback to parent
  useEffect(() => {
    if (onRefetchAvailable && refetchWorkers) {
      onRefetchAvailable(refetchWorkers);
    }
  }, [onRefetchAvailable, refetchWorkers]);

  // Early return only if no group data
  if (!selectedGroup) {
    return null;
  }

  return (
    <Container>
      <GroupDetailHeader
        groupName={selectedGroup.name}
        memberCount={memberCount}
        managerCount={shouldShowGroupLeads ? managerCount : undefined}
        onBack={handleBack}
        onAssignWorkers={handleAssignWorkers}
        onAssignLeads={shouldShowGroupLeads ? handleAssignLeads : undefined}
        shouldShowGroupLeads={shouldShowGroupLeads}
      />

      <GroupDetailFilterBar
        searchText={searchText}
        filterType={filterType}
        onSearchChange={handleSearchChange}
        onFilterChange={handleFilterChange}
        onAssignWorkers={handleAssignWorkers}
        onAssignLeads={handleAssignLeads}
        shouldShowGroupLeads={shouldShowGroupLeads}
      />

      <GroupDetailWorkersTable
        workers={workers}
        isLoading={isLoading}
        searchText={searchText}
        filterType={filterType}
        totalCount={headerTotalCount}
      />

      {/* Fixed Pagination - only show if more than 1 page */}
      {totalPages > 1 && !error && (
        <PaginationContainer>
          <Pagination
            totalPages={totalPages}
            totalItems={totalItems}
            preventPageJump
            labels={{
              summaryItems: intl.formatMessage({
                id: 'workers.list.pagination.workers',
                defaultMessage: 'workers',
              }),
            }}
            pageSize={WORKERS_PAGE_SIZE}
            activePage={currentPage}
            onPageChange={handlePageChange}
          />
        </PaginationContainer>
      )}
    </Container>
  );
};

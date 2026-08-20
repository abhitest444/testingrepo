import React, { useEffect } from 'react';
import { Pagination } from '@ids-ts/pagination';
import { useIntl } from '@payroll/quicksand';
import { WORKERS_PAGE_SIZE } from 'src/js/widgets/assignments/utils/constants';
import {
  WorkersListContainer,
  PaginationContainer,
} from '../../styles/WorkersListView.styled';
import WorkersTable from './WorkersTable';
import { useWorkersListData } from './useWorkersListData';
import type { WorkersListViewProps } from './types';
import { WorkerType } from '../SearchFilterBar/types';
import { useAppSelector } from '../../../store';
import { selectWorkersListError } from '../../../store/workersListSlice';

/**
 * Workers List View Component (Presentational Component)
 * Displays workers in a flat list format (not grouped)
 * Shown when "View by groups" toggle is OFF
 *
 * This component focuses on rendering and delegates all data fetching,
 * state management, and business logic to the useWorkersListData hook.
 *
 * Responsibilities:
 * - Render workers table with data from dataloader
 * - Render pagination controls
 * - Pass action handlers to child components
 * - Expose refetch callback to parent
 */
const WorkersListView: React.FC<WorkersListViewProps> = ({
  searchText = '',
  workerType = WorkerType.ALL,
  onRefetchAvailable,
  onLoadingChange,
}) => {
  const intl = useIntl();
  const error = useAppSelector(selectWorkersListError);
  // Use dataloader hook to get all data and handlers
  const {
    workers,
    loading,
    pageInfo,
    currentPage,
    totalPages,
    totalItems,
    headerTotalCount,
    handlePageChange,
    handleViewSettings,
    refetch,
  } = useWorkersListData(searchText, workerType);

  // Expose refetch function to parent component
  useEffect(() => {
    if (onRefetchAvailable && refetch) {
      onRefetchAvailable(refetch);
    }
  }, [onRefetchAvailable, refetch]);

  // Report loading state changes to parent component
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(loading);
    }
  }, [loading, onLoadingChange]);

  return (
    <WorkersListContainer>
      {/* Scrollable Workers Table */}
      <WorkersTable
        workers={workers}
        loading={loading}
        totalCount={headerTotalCount}
        onViewSettings={handleViewSettings}
        searchText={searchText}
        workerType={workerType}
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
    </WorkersListContainer>
  );
};

export default WorkersListView;

import React from 'react';
import styled from 'styled-components';
import { Pagination } from '@ids-ts/pagination';
import { useIntl } from '@payroll/quicksand';
import { ProjectsPaginationState } from '../types';

interface TimeProjectPaginationProps {
  pagination: ProjectsPaginationState;
  loadingMore: boolean;
  onPageChange: (page: number) => void;
  isWorkflowApiEnabled: boolean;
}

const PaginationFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 12px 0;
  border-top: 1px solid #e0e0e0;
`;

// Hides the Summary row rendered by @ids-ts/pagination when we have no
// totalCount to display (Workflow API path). Targeting by data-testid is
// stable across minor library updates since it's part of the public test
// contract of the component.
const SummaryHidden = styled.div`
  [data-testid='pagination-summary'] {
    display: none;
  }
`;

const TimeProjectPagination: React.FC<TimeProjectPaginationProps> = ({
  pagination,
  loadingMore,
  onPageChange,
  isWorkflowApiEnabled,
}) => {
  const intl = useIntl();
  const summaryItemsLabel = intl.formatMessage({
    id: 'timeProject.pagination.summaryItems',
  });

  // OIGQL path: totalCount is available so we can compute totalPages and
  // show the full summary (e.g. "1–6 of 42 projects").
  if (!isWorkflowApiEnabled) {
    const totalPages = Math.ceil(pagination.totalCount / pagination.pageSize);
    if (totalPages <= 1) return null;

    return (
      <PaginationFooter data-testid="time-project-pagination">
        <Pagination
          totalPages={totalPages}
          totalItems={pagination.totalCount}
          pageSize={pagination.pageSize}
          activePage={pagination.page}
          preventPageJump
          labels={{ summaryItems: summaryItemsLabel }}
          onPageChange={onPageChange}
        />
      </PaginationFooter>
    );
  }

  // Workflow API path: totalCount is unavailable.
  // - isLoadingTotals switches the page-section renderer to:
  //     <B3>"Page"</B3> + loadingComponent
  //   so we pass the current page number as loadingComponent → "Page 1".
  // - allowNextWhenLoading drives the Next button instead of totalPages.
  // - SummaryHidden hides the "0 - 0 of" summary row via CSS.
  if (pagination.page === 1 && !pagination.hasNextPage) return null;

  const workflowTotalPages = pagination.page + (pagination.hasNextPage ? 1 : 0);

  return (
    <PaginationFooter data-testid="time-project-pagination">
      <SummaryHidden>
        <Pagination
          totalPages={workflowTotalPages}
          totalItems={0}
          pageSize={pagination.pageSize}
          activePage={pagination.page}
          isLoadingTotals
          loadingComponent={<span>&nbsp;{pagination.page}</span>}
          allowNextWhenLoading={pagination.hasNextPage && !loadingMore}
          labels={{ summaryItems: summaryItemsLabel }}
          onPageChange={onPageChange}
        />
      </SummaryHidden>
    </PaginationFooter>
  );
};

export default TimeProjectPagination;

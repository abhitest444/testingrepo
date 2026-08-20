import React from 'react';
import { Pagination } from '@ids-ts/pagination';
import styled from 'styled-components';

interface AssignmentPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  summaryItems: string; // e.g., "customers", "team members", "fields"
  onPageChange: (page: number) => void;
}

// Match the exact pattern from CustomFieldsTable
const PaginationContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
`;

const AssignmentPagination: React.FC<AssignmentPaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  summaryItems,
  onPageChange,
}) => {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <PaginationContainer>
      <Pagination
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        activePage={currentPage}
        preventPageJump
        labels={{
          summaryItems,
        }}
        onPageChange={onPageChange}
      />
    </PaginationContainer>
  );
};

export default AssignmentPagination;

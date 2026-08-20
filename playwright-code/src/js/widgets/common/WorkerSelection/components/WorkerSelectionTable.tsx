import React from 'react';
import { Table } from '@ids-ts/table';
import { Activity } from '@ids-ts/loader';
import Button from '@ids-ts/button';
import Typography from '@ids-ts/typography';
import { ChevronUp, ChevronDown } from '@design-systems/icons';
import { TimeTracking_WorkerOrderBy } from 'src/__generated__/timeTracking/graphql';
import type {
  WorkerSelectionTableProps,
  SelectableWorker,
} from './WorkerSelectionTable.types';
import {
  TableWrapper,
  StyledTable,
  StyledCheckbox,
  CheckboxCell,
  SortableHeaderCell,
  WorkerNameCell,
  GroupCell,
  LoadingContainer,
  EmptyStateContainer,
  PaginationContainer,
} from './WorkerSelectionTable.styled';

/**
 * Get display name for a worker, falling back to firstName/lastName or ID
 */
const getWorkerDisplayName = (worker: SelectableWorker): string => {
  if (worker.displayName) return worker.displayName;
  const fullName = `${worker.firstName ?? ''} ${worker.lastName ?? ''}`.trim();
  return fullName || worker.id;
};

/**
 * Stateless, controlled WorkerSelectionTable component.
 * Renders a table of workers with selection checkboxes, sorting, and pagination.
 * All state is managed externally via props.
 */
export const WorkerSelectionTable: React.FC<WorkerSelectionTableProps> = ({
  workers,
  selectedIds,
  onSelectionChange,
  onSelectAllChange,
  allSelected,
  someSelected,
  sortOrder,
  onSortChange,
  isLoading,
  labels,
  pagination,
  tableSummary = 'Worker selection table',
  testIdPrefix = 'worker-selection',
}) => {
  const isAscending = sortOrder === TimeTracking_WorkerOrderBy.DisplayNameAsc;

  const handleSortClick = () => {
    onSortChange(
      isAscending
        ? TimeTracking_WorkerOrderBy.DisplayNameDesc
        : TimeTracking_WorkerOrderBy.DisplayNameAsc,
    );
  };

  // Loading state
  if (isLoading && workers.length === 0) {
    return (
      <LoadingContainer data-testid={`${testIdPrefix}-loading`}>
        <Activity
          shape="dots"
          size="large"
          aria-label={labels.loadingMessage}
        />
        <Typography variant="body-2">{labels.loadingMessage}</Typography>
      </LoadingContainer>
    );
  }

  // Empty state
  if (!isLoading && workers.length === 0) {
    return (
      <EmptyStateContainer data-testid={`${testIdPrefix}-empty`}>
        <Typography variant="body-2">{labels.emptyStateMessage}</Typography>
      </EmptyStateContainer>
    );
  }

  return (
    <>
      <TableWrapper>
        <StyledTable
          divider="horizontal"
          responsive="elevate"
          hover="row"
          summary={tableSummary}
          density="comfortable"
          data-testid={`${testIdPrefix}-table`}
        >
          <Table.Header>
            <Table.Row>
              <CheckboxCell>
                <StyledCheckbox
                  checked={allSelected}
                  indeterminate={someSelected && !allSelected}
                  onChange={(e) => onSelectAllChange(e.target.checked ?? false)}
                  aria-label={labels.selectAllLabel}
                  data-testid={`${testIdPrefix}-select-all`}
                />
              </CheckboxCell>
              <SortableHeaderCell onClick={handleSortClick} role="columnheader">
                {labels.nameColumnHeader}
                {isAscending ? <ChevronUp /> : <ChevronDown />}
              </SortableHeaderCell>
              <Table.Cell role="columnheader">
                {labels.groupColumnHeader}
              </Table.Cell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {workers.map((worker) => {
              const displayName = getWorkerDisplayName(worker);
              const isSelected = selectedIds.has(worker.id);
              return (
                <Table.Row
                  key={worker.id}
                  data-testid={`${testIdPrefix}-row-${worker.id}`}
                >
                  <CheckboxCell>
                    <StyledCheckbox
                      checked={isSelected}
                      onChange={() => onSelectionChange(worker.id, !isSelected)}
                      aria-label={labels.selectWorkerLabel(displayName)}
                      data-testid={`${testIdPrefix}-checkbox-${worker.id}`}
                    />
                  </CheckboxCell>
                  <WorkerNameCell>{displayName}</WorkerNameCell>
                  <GroupCell>
                    {worker.memberOfGroup?.name ?? labels.noGroupText}
                  </GroupCell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </StyledTable>
      </TableWrapper>
      {/* Only render pagination when at least one button is enabled and clickable */}
      {pagination && (pagination.hasPreviousPage || pagination.hasNextPage) && (
        <PaginationContainer data-testid={`${testIdPrefix}-pagination`}>
          <Button
            purpose="standard"
            onClick={pagination.onPreviousPage}
            disabled={!pagination.hasPreviousPage || pagination.isLoading}
            data-testid={`${testIdPrefix}-prev-btn`}
          >
            {labels.previousPageLabel}
          </Button>
          <Button
            purpose="standard"
            onClick={pagination.onNextPage}
            disabled={!pagination.hasNextPage || pagination.isLoading}
            data-testid={`${testIdPrefix}-next-btn`}
          >
            {labels.nextPageLabel}
          </Button>
        </PaginationContainer>
      )}
    </>
  );
};

export default WorkerSelectionTable;

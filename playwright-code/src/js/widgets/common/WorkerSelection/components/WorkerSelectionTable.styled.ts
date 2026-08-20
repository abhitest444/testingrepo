import styled from 'styled-components';
import { Table } from '@ids-ts/table';
import Checkbox from '@ids-ts/checkbox';

/**
 * Container wrapper for the table with border and scroll
 */
export const TableWrapper = styled.div`
  overflow: auto;
  border: 1px solid var(--color-container-border-tertiary);
  border-radius: var(--radius-small);
  max-height: min(560px, 70vh);
`;

/**
 * Styled table with consistent header styling
 */
export const StyledTable = styled(Table)`
  width: 100%;

  [role='columnheader'] {
    text-transform: none !important;
    font-size: var(--font-size-component-small);
  }

  thead th {
    svg {
      width: 16px;
      height: 16px;
      vertical-align: middle;
      margin-left: 4px;
    }
  }
` as typeof Table;

/**
 * Styled checkbox with removed default margins
 */
export const StyledCheckbox = styled(Checkbox)`
  margin-bottom: 0px !important;
  margin-right: 0px !important;
`;

/**
 * Narrow cell for checkbox column
 */
export const CheckboxCell = styled(Table.Cell)`
  width: 40px;
`;

/**
 * Sortable header cell with hover state
 */
export const SortableHeaderCell = styled(Table.Cell)`
  cursor: pointer;

  &:hover {
    background-color: var(--color-action-passive-subtle-hover);
  }
`;

/**
 * Cell for worker name display
 */
export const WorkerNameCell = styled(Table.Cell)`
  font-size: var(--font-size-component-medium);
  font-weight: var(--font-weight-component-semibold);
  color: var(--color-text-primary);
`;

/**
 * Cell for group name display
 */
export const GroupCell = styled(Table.Cell)`
  font-size: var(--font-size-component-small);
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/**
 * Loading state container
 */
export const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 32px;
`;

/**
 * Empty state container
 */
export const EmptyStateContainer = styled.div`
  padding: 24px;
  text-align: center;
  font-size: var(--font-size-component-small);
  color: var(--color-text-secondary);
`;

/**
 * Pagination controls container
 */
export const PaginationContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
`;

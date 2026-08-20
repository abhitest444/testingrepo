import styled from 'styled-components';
import { Table } from '@ids-ts/table';
import { IconControl } from '@ids-ts/icon-control';
import { Link } from '@ids-ts/link';

/**
 * Styled components for WorkersTableByGroupsView
 * Follows exact CustomerAssignmentTable pattern
 */

export const StyledTable = styled(Table)<{ $shouldShowGroupLeads?: boolean }>`
  [role='columnheader'] {
    text-transform: none !important;
    font-size: 14px;
  }

  /* Table layout */
  table {
    table-layout: auto;
    width: 100%;
  }

  /* Column 1: Groups with count */
  thead tr th:nth-child(1),
  tbody tr td:nth-child(1) {
    width: ${({ $shouldShowGroupLeads }) =>
      $shouldShowGroupLeads ? '40%' : '50%'};
    min-width: 250px;
  }

  /* Column 2: Workers */
  thead tr th:nth-child(2),
  tbody tr td:nth-child(2) {
    width: ${({ $shouldShowGroupLeads }) =>
      $shouldShowGroupLeads ? '20%' : '25%'};
    text-align: center;
  }

  /* Column 3: Group Leads (when visible) OR Actions (when Group Leads hidden) */
  thead tr th:nth-child(3),
  tbody tr td:nth-child(3) {
    width: ${({ $shouldShowGroupLeads }) =>
      $shouldShowGroupLeads ? '20%' : '25%'};
    text-align: ${({ $shouldShowGroupLeads }) =>
      $shouldShowGroupLeads ? 'center' : 'right'};
    ${({ $shouldShowGroupLeads }) =>
      !$shouldShowGroupLeads &&
      `
      min-width: 150px;
      white-space: nowrap;
      padding-right: 16px !important;
    `}
  }

  /* Column 4: Actions (only when Group Leads is visible) */
  ${({ $shouldShowGroupLeads }) =>
    $shouldShowGroupLeads &&
    `
    thead tr th:nth-child(4),
    tbody tr td:nth-child(4) {
      width: 20%;
      min-width: 150px;
      white-space: nowrap;
      text-align: right;
      padding-right: 16px !important;
    }
  `}
`;

export const ExpandableCell = styled(Table.Cell)<{ $hasChildren: boolean }>`
  cursor: ${({ $hasChildren }) => ($hasChildren ? 'pointer' : 'default')};

  > div {
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

export const GroupExpandableCell = styled(ExpandableCell)`
  padding-left: 16px !important;
`;

export const CenteredErrorContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  min-height: 200px;
`;

export const WorkerTypeText = styled.div`
  color: ${({ theme }) => theme?.colors?.neutral?.[600] || '#6B6C72'};
  font-size: 14px;
`;

export const WorkerNameContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const WorkerName = styled.strong`
  font-weight: 600;
  font-size: 14px;
  color: #1f1f1f;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
`;

export const ActionsContainer = styled.div`
  display: flex;
  justify-content: flex-end;
`;

export const ActionsWrapper = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: end;
`;

export const WorkerCell = styled(Table.Cell)`
  padding-left: 40px !important;
`;

export const TransparentIconControl = styled(IconControl).attrs({
  size: 'medium',
})`
  background-color: transparent;
`;

export const CenteredContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 24px;
  min-height: 200px;
`;
export const LoadingMoreContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  gap: 8px;
  color: ${({ theme }) => theme?.colors?.neutral?.[600] || '#6B6C72'};
  font-size: 14px;
`;

export const EndOfListMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  color: ${({ theme }) => theme?.colors?.neutral?.[500] || '#8E8E93'};
  font-size: 14px;
  font-style: italic;
`;

export const VirtualizedContainer = styled.div`
  height: calc(100vh - 400px);
  width: 100%;
  display: flex;
  flex-direction: column;
`;

export const HeaderTable = styled(StyledTable)`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  margin-bottom: 0;

  /* Sticky header */
  thead {
    display: table;
    width: 100%;
    table-layout: fixed;
    position: sticky;
  }

  /* Scrollable tbody */
  tbody {
    display: block;
    overflow-y: auto;
    overflow-x: hidden;
    flex: 1;
    min-height: 0;

    tr {
      display: table;
      width: 100%;
      table-layout: fixed;
      height: 64px;

      td {
        vertical-align: middle;
      }
    }
  }
`;

export const VirtualizedTable = styled(StyledTable)`
  width: 100%;
  margin: 0;
`;

export const PaginationContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 12px 0;
  width: 100%;
`;

export const TableContainer = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 100%;
`;

export const LoadingRow = styled(Table.Row)`
  display: table !important;
  width: 100%;
  height: calc(
    100vh - 515px
  ) !important; /* Full tbody height based on viewport */

  td {
    display: table-cell !important;
    vertical-align: middle !important;
    height: 100% !important;
    background-color: transparent !important;
    border: none !important;
  }
`;

export const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--ids-color-neutral-600, #666666);
  font-size: 20px;
  width: 100%;
  height: 100%;
  gap: 12px;
`;

export const GroupsViewContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding-bottom: 14px;
  height: calc(100vh - 356px);
  overflow: hidden;
`;

export const StyledLink = styled(Link)<{ $isDisabled: boolean }>`
  pointer-events: ${({ $isDisabled }) => ($isDisabled ? 'none' : 'auto')};
  opacity: ${({ $isDisabled }) => ($isDisabled ? 0.5 : 1)};
  cursor: ${({ $isDisabled }) => ($isDisabled ? 'not-allowed' : 'pointer')};
`;

export const GroupName = styled.strong`
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
`;

import styled from 'styled-components';
import { Table } from '@ids-ts/table';
import { Link } from '@ids-ts/link';

export const WorkersListContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding-bottom: 14px;
  height: calc(
    100vh - 375px
  ); /* Adjusted based on header content and pagination height */
  overflow: hidden;
`;

export const StyledTable = styled(Table)`
  display: flex;
  flex-direction: column;
  height: 100%;

  [role='columnheader'] {
    text-transform: none !important;
    font-size: 14px;
  }

  /* Table layout */
  table {
    table-layout: auto;
    width: 100%;
  }

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
    min-height: 0; /* Allows proper flex shrinking */

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

  /* Column 1: Worker Name */
  thead tr th:nth-child(1),
  tbody tr td:nth-child(1) {
    width: 25%;
    min-width: 200px;
  }

  /* Column 2: Type */
  thead tr th:nth-child(2),
  tbody tr td:nth-child(2) {
    width: 25%;
    min-width: 120px;
  }

  /* Column 3: Group */
  thead tr th:nth-child(3),
  tbody tr td:nth-child(3) {
    width: 30%;
    min-width: 150px;
  }

  /* Column 4: Actions */
  thead tr th:nth-child(4),
  tbody tr td:nth-child(4) {
    width: 20%;
    min-width: 150px;
    white-space: nowrap;
    text-align: right;
    padding-right: 16px !important;
  }

  @media (max-width: 768px) {
    overflow-x: auto;
  }
`;

export const LoadingRow = styled(Table.Row)`
  display: table !important;
  width: 100%;
  height: calc(
    100vh - 535px
  ) !important; /* Full tbody height based on viewport */

  td {
    display: table-cell !important;
    vertical-align: middle !important;
    height: 100% !important;
    background-color: transparent !important;
    border: none !important;
  }
`;

export const WorkerNameCell = styled(Table.Cell)`
  padding: 12px 16px !important;
  vertical-align: middle;
`;

export const WorkerInfoContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  justify-content: center;
  min-height: 40px; /* Ensures consistent spacing even without group lead text */
`;

export const WorkerName = styled.div`
  font-weight: 600;
  font-size: 14px;
  color: var(--ids-color-neutral-900, #1f1f1f);
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const WorkerRoleText = styled.div`
  font-size: 14px;
  color: var(--ids-color-neutral-600, #666666);
  font-weight: 400;
  line-height: 1.4;
`;

export const WorkerTypeAndGroupCell = styled(Table.Cell)`
  padding: 16px !important;
  color: var(--ids-color-neutral-800, #333333);
  font-size: 14px;
  min-width: 180px;
  vertical-align: middle;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const ActionsCell = styled(Table.Cell)`
  padding: 16px !important;
  text-align: right;
  min-width: 150px;
  vertical-align: middle;
`;

export const ActionsContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
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

export const StyledLink = styled(Link)<{ $isDisabled: boolean }>`
  pointer-events: ${({ $isDisabled }) => ($isDisabled ? 'none' : 'auto')};
  opacity: ${({ $isDisabled }) => ($isDisabled ? 0.5 : 1)};
  cursor: ${({ $isDisabled }) => ($isDisabled ? 'not-allowed' : 'pointer')};
`;

export const PaginationContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 12px 0;
  width: 100%;
  border-top: 1px solid var(--ids-color-neutral-300, #e0e0e0);
`;

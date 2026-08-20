import styled from 'styled-components';
import { Table } from '@ids-ts/table';
import { Link } from '@ids-ts/link';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: calc(
    100vh - 240px
  ); /* Adjusted based on header content and pagination height */
  overflow: hidden;
`;

export const BackButtonContainer = styled.div`
  margin-bottom: 24px;
`;

export const BackLink = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: #0077c5;
  font-size: 14px;
  font-weight: 400;
  cursor: pointer;
  padding: 0;

  &:hover {
    text-decoration: underline;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

export const GroupHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

export const GroupTitle = styled.h1`
  font-size: 28px;
  font-weight: 400;
  margin: 0;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const GroupStats = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`;

export const IconBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background-color: #f3f4f6;
  border-radius: 16px;
  color: #6b7280;
  font-size: 14px;
  font-weight: 400;
  cursor: pointer;

  &:hover {
    background-color: #e5e7eb;
  }
`;

export const FilterBar = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 16px 0;
  margin-bottom: 8px;
`;

export const LeftSection = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 16px;
  flex: 1;
`;

export const DropdownWrapper = styled.div`
  width: 164px;
`;

export const SearchWrapper = styled.div`
  flex: 1;
  max-width: 400px;
  padding-top: 20px;
`;

export const RightSection = styled.div`
  display: flex;
  align-items: center;
  margin-left: auto;
  flex-shrink: 0;
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

  /* Column 1: Worker name */
  thead tr th:nth-child(1),
  tbody tr td:nth-child(1) {
    width: 40%;
    min-width: 250px;
    padding: 12px 16px;
  }

  /* Column 2: Type */
  thead tr th:nth-child(2),
  tbody tr td:nth-child(2) {
    width: 35%;
    padding: 12px 16px;
  }

  /* Column 3: Actions */
  thead tr th:nth-child(3),
  tbody tr td:nth-child(3) {
    width: 25%;
    min-width: 150px;
    white-space: nowrap;
    text-align: right;
    padding: 12px 16px !important;
  }

  @media (max-width: 768px) {
    overflow-x: auto;
  }
`;

export const WorkerInfoContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const WorkerName = styled.div`
  font-weight: 600;
  font-size: 14px;
  color: #1f1f1f;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const WorkerTypeText = styled.div`
  font-size: 12px;
  color: #666;
  font-weight: 400;
`;

export const ActionsContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
`;

export const TableCellWithPadding = styled(Table.Cell)`
  padding: 12px 16px !important;
`;

export const TableCellRightAligned = styled(Table.Cell)`
  padding: 12px 16px !important;
  text-align: right !important;
`;

export const EmptyStateCell = styled(Table.Cell)`
  text-align: center !important;
  padding: 24px !important;
`;

export const LoadingRow = styled(Table.Row)`
  display: table !important;
  width: 100%;
  height: calc(
    100vh - 566px
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

export const StyledLink = styled(Link)<{ $isDisabled: boolean }>`
  pointer-events: ${({ $isDisabled }) => ($isDisabled ? 'none' : 'auto')};
  opacity: ${({ $isDisabled }) => ($isDisabled ? 0.5 : 1)};
  cursor: ${({ $isDisabled }) => ($isDisabled ? 'not-allowed' : 'pointer')};
`;

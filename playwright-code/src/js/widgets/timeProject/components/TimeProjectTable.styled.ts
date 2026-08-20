import styled, { keyframes } from 'styled-components';
import { Table } from '@ids-ts/table';

export const StyledTable = styled(Table)`
  [role='columnheader'] {
    text-transform: none;
    font-size: 14px;
  }

  table {
    table-layout: fixed;
    width: 100%;
    min-width: 780px;
  }

  td,
  th {
    text-align: left;
    vertical-align: middle;
  }

  thead tr th,
  tbody tr td {
    width: 20%;
  }

  thead tr th:last-child,
  tbody tr td:last-child {
    text-align: right;
  }
`;

export const TableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
`;

export const ProjectCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const CustomerNameText = styled.span`
  color: #6b6b6b;
`;

export const DeadlineCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const DaysLeftText = styled.span`
  color: #6b6b6b;
`;

export const BudgetCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const BudgetRemainingText = styled.span`
  color: #6b6b6b;
`;

export const BadgeWrapper = styled.span<{ $bgColor: string }>`
  [class*='Badge-value'] {
    background-color: ${({ $bgColor }) => $bgColor} !important;
    color: #000000 !important;
    font-weight: 400 !important;
  }
`;

export const ActionsContainer = styled.div`
  display: flex;
  justify-content: flex-end;
`;

export const ActionLinkButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  color: var(--color-link-text, #0077c5);
  cursor: pointer;
  font: inherit;

  &:hover {
    text-decoration: underline;
  }
`;

export const StatusHeaderCell = styled.div`
  display: flex;
  justify-content: flex-start;
  width: 100%;
`;

export const StatusCell = styled.div`
  display: flex;
  justify-content: flex-start;
  width: 100%;
`;

export const ActionsHeaderCell = styled.div`
  display: flex;
  justify-content: flex-end;
  width: 100%;
`;

export const LoaderContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 64px 0;
`;

// Shimmer keyframes / skeleton bar shared across the budget + actions
// columns. Same treatment we use elsewhere for in-flight estimate
// loads so the table reads as one consistent "we're still fetching"
// affordance.
const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: 200px 0; }
`;

export const RowSkeletonBar = styled.span<{ $width?: string }>`
  display: inline-block;
  width: ${({ $width }) => $width || '80px'};
  height: 14px;
  border-radius: 4px;
  background: linear-gradient(90deg, #d9d9d9 25%, #ececec 50%, #d9d9d9 75%);
  background-size: 400px 100%;
  animation: ${shimmer} 1.4s ease-in-out infinite;
`;

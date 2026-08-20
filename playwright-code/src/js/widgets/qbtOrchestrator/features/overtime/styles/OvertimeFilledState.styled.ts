import styled from 'styled-components';
import { Table } from '@ids-ts/table';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-medium, 16px);
`;

export const HeaderRow = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
`;

export const StyledTable = styled(Table)`
  margin-top: var(--space-x-small, 8px);
  thead th,
  [role='columnheader'] {
    text-transform: none !important;
    font-size: var(--font-size-component-small);
  }
`;

export const ActionsHeaderCell = styled(Table.Cell)`
  text-align: right;
`;

export const ActionsCell = styled(Table.Cell)`
  text-align: right;
`;

export const ActionsContainer = styled.div`
  display: flex;
  justify-content: flex-end;
`;

export const PaginationContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-medium, 16px);
`;

export const PolicyNameCell = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-x-small, 8px);
`;

import styled from 'styled-components';
import { Table } from '@ids-ts/table';
import { IconControl } from '@ids-ts/icon-control';

export const StyledTable = styled(Table)`
  [role='columnheader'] {
    text-transform: none !important;
    font-size: 14px;
  }
`;

export const ContentCell = styled(Table.Cell)`
  padding: 12px 8px;
  vertical-align: middle;
`;

export const ItemContent = styled.div<{ $indentLevel: number }>`
  padding-left: ${(props) => props.$indentLevel}px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const ItemName = styled.span``;

export const TransparentIconControl = styled(IconControl)`
  background-color: transparent;
`;

export const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
`;

export const EmptyMessageCell = styled(Table.Cell)`
  text-align: center;
  padding: 40px;
  color: #666;
`;

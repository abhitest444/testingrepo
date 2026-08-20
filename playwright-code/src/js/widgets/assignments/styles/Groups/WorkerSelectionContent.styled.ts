import styled from 'styled-components';
import { Table } from '@ids-ts/table';
import Checkbox from '@ids-ts/checkbox';
import PageMessage from '@ids-ts/page-message';
import { SearchField } from 'src/js/widgets/common/SearchField';

export const ErrorMessage = styled(PageMessage)`
  margin-bottom: 10px;
`;

export const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
`;

export const HeaderSection = styled.div`
  margin-bottom: 10px;
`;

export const DescriptionText = styled.div`
  font-size: 14px;
  color: #333;
  margin-bottom: 16px;
`;

export const CounterRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const CounterText = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #000;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  justify-content: flex-end;
`;

export const DropdownWrapper = styled.div`
  width: 9vw;
`;

export const SearchWrapper = styled.div`
  width: 9vw;
`;

export const TableWrapper = styled.div`
  height: calc(
    100vh - 300px
  ); /* Height of the table container excluding the header and footer */
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
`;

export const StyledTable = styled(Table)`
  width: 100%;

  [role='columnheader'] {
    text-transform: none !important;
    font-size: 14px;
  }

  thead th {
    svg {
      width: 16px;
      height: 16px;
      vertical-align: middle;
      margin-left: 4px;
    }
  }
`;

export const StyledCheckbox = styled(Checkbox)`
  margin-bottom: 0px !important;
  margin-right: 0px !important;
`;

export const CheckboxCell = styled(Table.Cell)`
  width: 10px;
`;

export const SortableHeaderCell = styled(Table.Cell)`
  cursor: pointer;

  &:hover {
    background-color: #f5f5f5;
  }
`;

export const WorkerNameCell = styled(Table.Cell)`
  div {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
`;

export const WorkerName = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: #000;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const WorkerType = styled.div`
  font-size: 14px;
  color: #666;
`;

export const WorkerGroupCell = styled(Table.Cell)`
  font-size: 14px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 48px 24px;
`;

export const EmptyStateContainer = styled.div`
  padding: 24px;
  text-align: center;
  color: #666;
`;

export const PaginationContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
`;

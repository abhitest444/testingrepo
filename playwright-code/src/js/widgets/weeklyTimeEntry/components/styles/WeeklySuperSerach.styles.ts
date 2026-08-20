import styled from 'styled-components';
import { B3 } from '@ids-ts/typography';
import { DataCell } from './WeeklyTimeEntryTable.styles';

export const SuperSearchCell = styled(DataCell)`
  display: flex !important;
  min-width: 170px;
  padding: 0 !important;
  min-height: 48px;

  &.has-approved-entries {
    background: var(
      --color-container-background-quaternary
    ); /* (SemanticContextMatchOnly) Replaced hardcoded gray with design token for quaternary container background */

    & > span {
      border-right: 0 !important;
    }
  }

  &.has-validation-errors {
    background: var(
      --color-container-background-negative
    ) !important; /* (SemanticContextMatchOnly) Replaced hardcoded error background with design token */
    border: 1px solid var(--color-input-border-error) !important; /* (SemanticContextMatchOnly) Replaced hardcoded error border color with design token */

    & > span {
      border-right: 0 !important;
    }
  }
`;

export const SuperSearchContainer = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
`;

export const CustomerNameColumn = styled(B3)`
  flex: 0 0 75%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 8px 8px 8px 12px !important;
  display: flex;
  align-items: center;
  border-right: 2px solid var(--color-divider-tertiary); /* (SemanticContextMatchOnly) */
  height: 48px;
`;

export const DropdownColumn = styled.div`
  flex: 0 0 25%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
`;

export const Container = styled.div`
  display: flex;
  min-width: 600px;
  background: var(--color-container-background-primary);
  border-radius: var(--radius-large);
  box-shadow: var(--elevation-level-2) var(--color-shadow);
  border: 1px solid var(--color-container-border-tertiary); /* (SemanticContextMatchOnly) */
`;

export const TabsColumn = styled.div`
  display: flex;
  min-width: 180px;
  background: var(--color-container-background-primary);
  border-right: 1px solid var(--color-container-border-tertiary); /* (SemanticContextMatchOnly) */
  padding-top: 24px;
  flex-direction: column;
`;

export const TabItem = styled(B3)<{ selected: boolean }>`
  color: var(
    --color-text-secondary
  ) !important; /* (SemanticContextAndValueMatch) Replaced hardcoded text color with design token for secondary text */
  display: flex !important;
  align-items: center;
  font-weight: var(--font-weight-component-semibold) !important;
  padding: 12px 16px !important;
  background: ${({ selected }) =>
    selected ? 'rgba(107, 108, 114, 0.1)' : 'transparent'};
  cursor: pointer;
  &:hover {
    background: var(--color-action-passive-subtle-hover);
  }
`;

export const ContentColumn = styled.div`
  padding: 24px;
  overflow: auto;
  height: 345px !important;
  display: flex;
  flex-direction: column;
  flex: 1 1 0%;
`;

export const SearchRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
`;

export const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

export const ListItem = styled.li<{ selected?: boolean }>`
  display: flex;
  align-items: center;
  padding: 8px 0;
  background: ${({ selected }) => (selected ? '#f2f8f5' : 'transparent')};
  cursor: pointer;
  border-radius: var(
    --radius-content-control
  ); /* SemanticContextAndValueMatch: For interactive, selectable list items */
  &:hover {
    background: var(
      --color-container-background-secondary
    ); /* (SemanticContextMatchOnly) */
  }
`;

export const TypeLabel = styled(B3)`
  color: var(
    --color-text-secondary
  ); /* (SemanticContextMatchOnly) Replaced hardcoded gray color with design token for secondary text */
  margin-left: 8px;
  white-space: nowrap;
`;

export const CustomerTypeLabel = styled(TypeLabel)`
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const EmptyState = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
`;

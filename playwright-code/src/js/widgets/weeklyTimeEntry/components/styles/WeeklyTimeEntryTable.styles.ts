import styled, { css } from 'styled-components';
import { Table } from '@ids-ts/table';

const cellStateStyles = css`
  position: relative; /* For the note indicator */

  &.has-notes::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    border-style: solid;
    border-width: 0 10px 10px 0;
    border-color: transparent var(--color-icon-secondary) transparent
      transparent; /* (SemanticContextMatchOnly) Default grey */
    opacity: 0.6;
    z-index: 2;
  }

  &.has-notes.is-break::after {
    border-color: transparent var(--color-ui-attention) transparent transparent; /* (SemanticContextMatchOnly) */
  }

  &.has-notes.is-timeoff::after {
    border-color: transparent var(--color-container-border-info) transparent
      transparent; /* (SemanticContextMatchOnly) */
  }

  &.has-notes.is-overtime::after {
    border-color: transparent var(--color-ui-negative) transparent transparent;
  }

  &.is-break {
    background-color: var(--color-container-background-attention);
  }

  &.is-timeoff {
    background-color: var(
      --color-container-background-info
    ); /* (SemanticContextMatchOnly) */
  }

  &.is-overtime {
    background-color: var(--color-container-background-negative);
  }

  &.is-approved-entry {
    background-color: var(
      --color-data-neutral
    ); /* (SemanticContextMatchOnly) */
  }

  &.has-start-time {
    background-color: var(
      --color-data-neutral
    ); /* (SemanticContextMatchOnly) */
  }
`;

export const WeeklyTimeEntryFormWrapper = styled.div`
  flex: 1;

  /* Override any text-transform on table headers */
  .ids-table-header {
    text-transform: none !important;
  }

  /* Ensure header cells don't have uppercase text */
  th,
  .ids-table-header-cell {
    text-transform: none !important;
  }
`;

export const NoPaddingTableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
`;

export const BaseCell = styled(Table.Cell)`
  padding-left: 10px !important;
  padding-right: 0;
  padding-top: 0;
  padding-bottom: 0;
  font-size: var(--font-size-component-small) !important;
  line-height: 20px !important;
`;

export const FocusableCell = styled(BaseCell)`
  &.header-cell {
    vertical-align: top;
  }
`;

export const DeleteCell = styled(BaseCell)`
  align-items: center;
  justify-content: center;
  width: 40px !important;
  padding-left: 8px !important;
  padding-right: 8px !important;
`;

export const LastHeaderCell = styled(BaseCell)`
  width: 40px !important;
  height: 40px;
`;

export const HeaderContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-transform: none !important;
`;

export const TimeCategoryHeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const TimeCategoryIconWrapper = styled.span`
  display: inline-flex;
  cursor: pointer;
`;

export const ButtonContainer = styled.div`
  margin-top: 12px;
  display: flex;
  justify-content: flex-start;
`;

export const RowStyles = styled.div`
  .selected-row {
    background: var(--color-container-background-secondary);
  }
`;

export const SelectedCell = styled(FocusableCell)`
  text-align: right !important;
  padding: 0 !important;
  background: var(--color-input-background-primary-focus);
  border: 1px solid var(--color-input-border-primary-selected) !important; /* SemanticContextMatchOnly */
  ${cellStateStyles}

  &.has-validation-errors {
    background: var(--color-container-background-negative) !important;
    border: 1px solid var(--color-input-border-error) !important;
  }
`;

export const CellInput = styled.input`
  width: 100%;
  height: 100%;
  border: none !important;
  background: transparent !important;
  text-align: left;
  padding: 8px;

  &:focus,
  &:active,
  &:hover {
    outline: none !important;
    box-shadow: none !important;
  }

  /* Hide number input arrows */
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Firefox */
  &[type='number'] {
    -moz-appearance: textfield;
  }
`;

export const DataCell = styled(FocusableCell)<{
  paddingRight?: string;
  textAlign?: string;
}>`
  text-align: ${({ textAlign }) => textAlign || 'right'};
  padding: 8px !important;
  padding-right: ${({ paddingRight }) => paddingRight || '8px'} !important;
  cursor: pointer;
  ${cellStateStyles}

  &.error-total-cell {
    background: var(--color-container-background-negative) !important;
    border: 1px solid var(--color-input-border-error) !important;
  }

  &.has-validation-errors {
    background: var(--color-container-background-negative) !important;
    border: 1px solid var(--color-input-border-error) !important;
  }
`;

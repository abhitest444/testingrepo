import { Info } from '@design-systems/icons';
import Button from '@ids-ts/button';
import { Table } from '@ids-ts/table';
import Typography from '@ids-ts/typography';
import styled from 'styled-components';

export const FieldSectionTitle = styled.span`
  color: var(--color-text-primary);
  font-size: var(--font-size-heading-3);
  font-style: normal;
  font-weight: var(--font-weight-heading);
  line-height: 44px;
  margin-bottom: 8px;
`;

export const FieldSectionSubTitle = styled.span`
  font-size: var(--font-size-component-medium);
  font-style: normal;
  font-weight: var(--font-weight-component);
  line-height: 24px;
  margin-bottom: 28px;
`;

export const CheckBoxWithToolTip = styled.div<{ isSubField: boolean }>`
  padding-left: ${({ isSubField }) => (isSubField ? '38px' : '16px')};
  position: relative;
  gap: 15px;
`;

export const CheckBoxText = styled.span`
  font-size: var(--font-size-input-text);
  font-style: normal;
  font-weight: var(--font-weight-input-label);
  line-height: 24px; /* (NoTokenFound) */
  padding-right: 8px;
`;

export const ToolTipIcon = styled(Info)`
  position: absolute;
  bottom: 18px;
`;

export const RequiredFieldContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  position: relative;
  font-size: 14px;
`;

export const StatusSwitchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  position: relative;
  font-size: 14px;
`;

export const RequiredFieldText = styled.span`
  font-size: var(--font-size-input-text);
  font-style: normal;
  font-weight: var(--font-weight-input-label);
  line-height: 24px; /* (NoTokenFound) */
  padding-right: 8px;
`;

export const FieldsGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(320px, 1fr) 80px;
  align-items: start;
  width: 100%;
`;

export const FieldRow = styled.div<{ isSubField?: boolean }>`
  display: contents;
  align-items: left;
`;

export const SectionHeader = styled.div`
  display: grid;
  grid-template-columns: minmax(320px, 1fr) 80px;
  align-items: start;
  margin-bottom: 16px;
  font-weight: var(--font-weight-heading);
  font-size: var(--font-size-component-medium);
  color: var(--color-text-primary);
`;

export const CheckboxHeader = styled.span`
  font-weight: var(--font-weight-heading);
  font-size: var(--font-size-component-medium);
  color: var(--color-text-primary);
  margin-left: 5px;
`;

export const RequiredFieldHeader = styled.span`
  font-weight: var(--font-weight-heading);
  font-size: var(--font-size-component-medium);
  color: var(--color-text-primary);
  margin-left: 38px;
`;

export const ButtonContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 24px;
`;

export const StyledButton = styled(Button)`
  padding-left: 0px;
  padding-right: 0px;
  color: var(--color-link-text) !important;
  font-weight: 400;
  &:hover {
    background-color: transparent !important;
  }
  & > span {
    padding-left: 0px !important;
  }
`;
export const StyledTable = styled(Table)`
  width: 100%;
  table-layout: auto;
  min-width: 600px;
`;

export const TableHeaderCell = styled(Table.Cell)`
  text-transform: none;
  font-size: 14px;
  font-weight: var(--font-weight-heading);
  overflow: hidden;
  white-space: wrap;
`;

export const ActionCellContent = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  text-align: right;
`;
export const ActionCellHeaderContent = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  text-align: right;
  padding-right: 20px;
`;

export const FieldLabelContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
`;

export const StyledChevron = styled.span`
  display: inline-block;
  padding-right: 4px;
  cursor: pointer;
`;

export const DisplayCell = styled(Table.Cell)`
  font-size: 12 px;
  font-weight: 400;
  z-index: 1;
`;

export const SectionGroupCell = styled(Table.Cell)`
  cursor: pointer;
  user-select: none;
`;

export const SectionGroupTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
`;

export const SectionGroupHeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 16px;
`;

// Action link rendered in the Dimensions section header (e.g. "Set defaults").
// Owned by the dimensions UI so it does not reuse the customField table link.
export const DimensionsActionLink = styled.a`
  color: var(--color-link-text);
  text-decoration: none !important;
  cursor: pointer;
  font-weight: var(--font-weight-component-semibold);
`;

export const ErrorMessageContainer = styled.div`
  margin-bottom: 16px;
`;

// FieldAssignmentDetailView styles
export const FieldAssignmentContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
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
  color: var(--color-link-text, #0077c5);
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

export const PageTitle = styled.h1`
  font-size: var(--font-size-heading-3, 28px);
  font-weight: var(--font-weight-heading, 400);
  margin: 0 0 24px 0;
  color: var(--color-text-primary, #1f2937);
`;

export const PageHeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

export const PageTitleInline = styled.h1`
  font-size: var(--font-size-heading-3, 28px);
  font-weight: var(--font-weight-heading, 400);
  margin: 0;
  color: var(--color-text-primary, #1f2937);
`;

export const FieldAssignmentStyledTable = styled(Table)`
  margin-top: 8px;

  thead th,
  [role='columnheader'] {
    text-transform: none !important;
    font-size: var(--font-size-component-small);
  }
`;

export const ActionsHeaderCell = styled(Table.Cell)`
  text-align: right;
  padding-right: 30px;
`;

export const PaginationContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
`;

export const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 48px;
`;

export const ErrorContainer = styled.div`
  display: flex;
  justify-content: center;
  padding: 24px;
`;

export const EmptyStateContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 48px;
  color: var(--color-text-secondary, #6b7280);
`;

export const TableWrapper = styled.div`
  position: relative;
  min-height: 200px;
`;

export const BackdropLoader = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
`;

export const SearchWrapper = styled.div`
  max-width: 400px;
  margin-bottom: 16px;
`;

export const SearchAndAddRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`;
export const GeofenceExpandedContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-left: 32px;
  margin-top: 8px;
`;

export const GeofenceAssignmentsText = styled(Typography)`
  color: var(--color-text-primary, #393a3d);
`;
export const StyledGeofenceButton = styled(Button)`
  && {
    width: fit-content;
    border-color: #babec5;
    color: #393a3d;

    &:hover {
      border-color: #8d9096;
      background-color: #f4f5f8;
    }
  }
`;

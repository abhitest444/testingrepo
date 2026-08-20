import styled from 'styled-components';
import { Typography } from '@ids-ts/typography';
import { TextField } from '@ids-ts/text-field';
import Dropdown from '@ids-ts/dropdown';
import { Table } from '@ids-ts/table';
import { ModalContent } from '@ids-ts/modal-dialog';
import { DrawerHeader } from '@ids-ts/drawer';

export const FormSection = styled.div`
  margin-bottom: 8px;
`;

export const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

export const AssignmentRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const Divider = styled.hr`
  border: none;
  border-top: 1px solid var(--color-divider-tertiary);
  margin: 16px 0 24px 0;
`;

export const HelperText = styled(Typography).attrs({
  variant: 'body-3',
})`
  display: block;
  color: #6b7177;
  margin-left: 28px;
`;

export const EditLink = styled.a`
  color: var(--color-action-special-use);
  cursor: pointer;
  text-decoration: underline;
  font-size: var(--font-size-action-small);
  margin-left: 4px;
`;

export const WideTextField = styled(TextField)`
  min-width: 320px;
`;

export const DropdownRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const WideDropdown = styled(Dropdown).attrs({
  width: '320px',
})``;

export const BreakOptionsContainer = styled.div`
  margin-left: 36px;
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (max-width: 600px) {
    margin-left: 0;
    gap: 12px;
  }
`;

export const IndentedDropdownContainer = styled.div`
  margin-left: 36px;

  @media (max-width: 600px) {
    margin-left: 0;
  }
`;

export const FooterContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;

  @media (max-width: 600px) {
    flex-direction: column;
    gap: 12px;
    button {
      width: 100%;
    }
  }
`;

export const NotifyRow = styled.div`
  display: flex;
  align-items: center;
`;

export const NotifyTextContainer = styled.span`
  margin: 0 8px;
`;

export const NoSpinnerTextField = styled(TextField)`
  width: 64px;
  height: 32px;
  font-size: var(--font-size-input-text);
  display: flex;
  align-items: center;
  justify-content: center;

  /* Chrome, Safari, Edge, Opera */
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  /* Firefox */
  &[type='number'] {
    -moz-appearance: textfield;
  }
  & input {
    height: 32px !important;
  }
`;

export const PaginationContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
`;

export const FormRow = styled.div`
  display: flex;
  gap: 16px;
  align-items: flex-start;
`;

export const FormField = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 0;
`;

export const ToggleFormField = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 0;
  padding-top: 32px;
`;

export const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const Container = styled.div`
  max-width: 90%;
  margin: 0 auto;
`;

export const StyledTable = styled(Table)`
  width: 100%;

  /* Override header text transform to prevent all caps */
  thead th {
    text-transform: none;
    font-size: var(--font-size-component-small);
  }
`;

export const HeaderContainer = styled.div`
  margin-bottom: 8px;
`;

export const Description = styled.p`
  color: var(--color-text-secondary);
  margin: 8px 0 24px 0;
  max-width: 70%;
  line-height: var(--line-height-body);
`;

export const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 24px;
`;

export const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

export const ActionsHeaderCell = styled(Table.Cell)`
  text-align: right;
`;

export const ModalContentCentered = styled(ModalContent)`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const ModalTitle = styled(Typography).attrs({
  variant: 'headline-5',
})`
  text-align: center;
  margin: 0 0 8px 0;
  padding: 0 8px;
`;

export const ModalWarning = styled(Typography).attrs({
  variant: 'body-2',
})`
  text-align: center;
  color: #6b6c72;
  margin: 0;
  padding: 0 8px;
`;

export const ShadowedDrawerHeader = styled(DrawerHeader)`
  box-shadow: var(--elevation-level-2) var(--color-shadow);
  z-index: 1;
`;

export const HeaderButton = styled.div`
  width: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const HeaderTitle = styled(Typography)`
  flex: 1;
  text-align: center;
  font-weight: var(--font-weight-heading);
`;

export const DurationLine = styled.hr`
  margin: 0;
  border: none;
  border-top: 1px solid;
  width: 10px;
`;

export const AssignRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 24px 0 16px 0;
`;

export const AssignHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-component-medium);
`;

export const Pill = styled.div`
  display: flex;
  align-items: center;
  background: var(
    --color-container-background-secondary
  ); /* (SemanticContextMatchOnly) */
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-component-semibold);
  border-radius: var(--radius-full); /* (SemanticContextMatchOnly) */
  padding: 8px 20px;
  font-size: var(--font-size-component-medium);
`;

export const StyledLabel = styled(Typography)<{ color?: string }>`
  color: ${({ color }) =>
    color || 'var(--color-text-primary)'}; /* (SemanticContextMatchOnly) */
`;

export const FlexRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  justify-content: flex-start;
`;

export const FlexEndRow = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 16px;
`;

export const FlexStartRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  text-align: center;
  gap: 8px;
`;

export const CheckboxLabelRow = styled.span`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  text-align: left;
`;

export const InfoIconMargin = styled.span`
  margin-left: 4px;
  vertical-align: middle;
`;

export const WideTextFieldWithMax = styled(WideTextField)<{
  maxWidth?: number;
}>`
  ${({ maxWidth }) => maxWidth && `max-width: ${maxWidth}px;`}
`;

export const FormSectionWithMargin = styled(FormSection)`
  margin-bottom: 20px;
`;

export const CheckboxBold = styled.div`
  font-weight: var(--font-weight-component-bold);
  margin-bottom: 8px;
`;

export const InfoGray = styled.span`
  color: var(--color-icon-secondary);
`;

export const NoSetCheckboxRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
`;

export const NoSetTooltipIcon = styled.span`
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  margin-left: 4px;
`;

export const AssignTeamMembersIcon = styled.span`
  margin-right: 8px;
  display: flex;
  align-items: center;
`;

export const AssignedToText = styled.span`
  color: var(--color-link-text);
`;

export const ModalActionsRow = styled.div`
  justify-content: center;
  gap: 16px;
  display: flex;
`;

export const SearchContainer = styled.div`
  margin-bottom: 16px;
`;

export const StyledInput = styled(TextField)`
  width: 100%;
`;

export const ReviewText = styled.p`
  margin: 16px 0 16px 0;
`;

export const LoaderContainer = styled.div`
  display: flex;
  justify-content: center;
  padding: 24px;
`;

export const ScrollableListContainer = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`;

export const TeamMembersListWrapper = styled.div`
  flex: 1;
  overflow-y: auto;
  min-height: 0;
`;

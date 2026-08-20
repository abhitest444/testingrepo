import styled from 'styled-components';
import { Table } from '@ids-ts/table';
import { CardContent } from '@ids-ts/cards';

// Breakpoints
const BREAKPOINTS = {
  tablet: '1024px',
  mobile: '768px',
};

// Back button - matches GroupDetailHeader / Figma "Overtime policies" link
export const BackButtonContainer = styled.div`
  margin-bottom: 24px;
`;

export const BackLink = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: var(--color-link-text);
  font-size: var(--font-size-component-small);
  font-weight: var(--font-weight-component);
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

// Main Layout Containers
export const WizardContainer = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 24px;
  padding: 20px 0;
  width: 100%;

  @media (max-width: ${BREAKPOINTS.tablet}) {
    flex-direction: column-reverse;
    gap: 16px;
    padding: 16px;
  }
`;

export const LeftSide = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 28px;
  min-width: 0;

  @media (max-width: ${BREAKPOINTS.tablet}) {
    width: 100%;
    gap: 20px;
  }
`;

// Card wrapper for proper styling
export const PolicyCardWrapper = styled.div`
  min-width: 520px;
  width: 100%;

  /* Override IDS Card styles for this specific use case */
  .ids-card {
    border-radius: var(--radius-large);
    border: 1px solid var(--color-container-border-secondary);
  }

  .ids-card-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 24px;
  }

  @media (max-width: ${BREAKPOINTS.tablet}) {
    min-width: unset;
    width: 100%;

    .ids-card-content {
      gap: 16px;
      padding: 16px;
    }
  }
`;

// Form layout sections
export const TitleSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
`;

export const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;

  label {
    margin-bottom: 0;
  }
`;

export const TextFieldWrapper = styled.div`
  width: 400px;

  @media (max-width: ${BREAKPOINTS.tablet}) {
    width: 100%;
    max-width: 400px;
  }

  @media (max-width: ${BREAKPOINTS.mobile}) {
    max-width: 100%;
  }
`;

// Custom CardContent with controlled padding and layout
export const StyledCardContent = styled(CardContent)`
  display: flex;
  padding: 24px;
  flex-direction: column;
  gap: 24px;
  align-self: stretch;
`;

// Checkbox with helper text styling
export const CheckboxLabelWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const CheckboxHelperText = styled.span`
  display: block;
  font-size: 14px;
  line-height: 20px;
  color: var(--color-text-primary);
  margin-left: 32px;
`;

export const InfoMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
`;

export const ButtonRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;

  @media (max-width: ${BREAKPOINTS.mobile}) {
    flex-direction: column-reverse;
    gap: 12px;

    button {
      width: 100%;
    }
  }
`;

// Wizard Step Indicator Styles (No IDS equivalent exists)
export const WizardMenu = styled.div`
  width: 266px;
  border: 1px solid var(--color-container-border-secondary);
  border-radius: var(--radius-large);
  overflow: hidden;
  flex-shrink: 0;
  align-self: flex-start;

  @media (max-width: ${BREAKPOINTS.tablet}) {
    width: 100%;
  }
`;

export const WizardMenuTitle = styled.div`
  background: var(--color-container-background-primary);
  border-bottom: 1px solid var(--color-divider-tertiary);
  padding: 16px;

  @media (max-width: ${BREAKPOINTS.tablet}) {
    padding: 12px 16px;
  }
`;

export const WizardStepItem = styled.div<{ $isActive: boolean }>`
  background: ${({ $isActive }) =>
    $isActive
      ? 'var(--color-action-standard-subtle-active)'
      : 'var(--color-container-background-primary)'};
  border-bottom: 1px solid var(--color-divider-tertiary);
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: ${BREAKPOINTS.tablet}) {
    padding: 12px 16px;
  }
`;

export const StepIndicator = styled.div<{
  $isActive: boolean;
  $isCompleted: boolean;
}>`
  width: 20px;
  height: 20px;
  border-radius: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: var(--font-size-component-x-small);
  line-height: var(--line-height-component);

  ${({ $isActive, $isCompleted }) => {
    if ($isCompleted || $isActive) {
      return `
        background: var(--color-action-standard);
        border: 1px solid var(--color-action-standard);
        color: var(--color-text-inverse);
        font-weight: var(--font-weight-component-semibold);
      `;
    }
    return `
      background: var(--color-container-background-primary);
      border: 1px solid var(--color-text-tertiary);
      color: var(--color-text-tertiary);
      font-weight: var(--font-weight-component);
    `;
  }}

  /* Style the checkmark icon when completed */
  svg {
    width: 12px;
    height: 12px;
    color: var(--color-text-inverse);
  }
`;

export const StepLabel = styled.span<{ $isActive: boolean }>`
  flex: 1;
  font-size: var(--font-size-component-medium);
  line-height: var(--line-height-component);
  font-weight: var(--font-weight-component);
  color: ${({ $isActive }) =>
    $isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'};

  @media (max-width: ${BREAKPOINTS.mobile}) {
    font-size: var(--font-size-component-small);
    line-height: var(--line-height-component);
  }
`;

// Rules Step Styles
export const RulesFormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`;

export const DropdownWrapper = styled.div`
  width: 100%;
  max-width: 400px;

  @media (max-width: ${BREAKPOINTS.mobile}) {
    max-width: 100%;
  }
`;

export const RulesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 520px;
`;

export const RuleCardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0px;
  width: 100%;

  label {
    margin-bottom: 0;
  }
`;

export const RuleInputsColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  padding-left: 32px;
`;

export const RuleInputFieldsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  width: 100%;

  @media (max-width: ${BREAKPOINTS.mobile}) {
    grid-template-columns: 1fr;
  }
`;

export const RuleInputField = styled.div`
  width: 100%;
  max-width: 400px;
  min-width: 300px;
  @media (max-width: ${BREAKPOINTS.mobile}) {
    min-width: unset;
  }
`;

export const RuleErrorText = styled.div`
  color: var(--color-signal-negative);
  font-size: var(--font-size-component-x-small);
  line-height: var(--line-height-component);
`;

// Policy Members Step (Assign policy members)
export const MembersCounterRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  width: 100%;
`;

export const MembersCounterText = styled.div`
  font-size: var(--font-size-component-medium);
  font-weight: var(--font-weight-component-semibold);
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const MembersSearchRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  justify-content: flex-end;
  flex-wrap: wrap;
`;

export const MembersDropdownWrap = styled.div`
  min-width: 140px;
  max-width: 200px;
`;

export const MembersSearchWrap = styled.div`
  min-width: 200px;
  max-width: 250px;
`;

export const MembersTableWrapper = styled.div`
  overflow: auto;
  border: 1px solid var(--color-container-border-tertiary);
  border-radius: var(--radius-small);
  /* Allow card to expand with content; cap only for very long lists */
  max-height: min(560px, 70vh);
`;

export const MembersStyledTable = styled(Table)`
  width: 100%;

  [role='columnheader'] {
    text-transform: none !important;
    font-size: var(--font-size-component-small);
  }

  thead th {
    cursor: default;
    svg {
      width: 16px;
      height: 16px;
      vertical-align: middle;
      margin-left: 4px;
    }
  }
` as typeof Table;

export const MembersCheckboxCell = styled(Table.Cell)`
  width: 40px;
`;

export const MembersWorkerCell = styled(Table.Cell)`
  font-size: var(--font-size-component-medium);
  font-weight: var(--font-weight-component-semibold);
  color: var(--color-text-primary);
`;

export const MembersGroupCell = styled(Table.Cell)`
  font-size: var(--font-size-component-small);
  color: var(--color-text-primary);
`;

export const MembersLoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 32px;
`;

export const MembersEmptyState = styled.div`
  padding: 24px;
  text-align: center;
  font-size: var(--font-size-component-small);
  color: var(--color-text-secondary);
`;

// Review Step Styles
export const ReviewSectionCard = styled.div`
  background: var(--color-container-background-primary);
  border: 1px solid var(--color-container-border-secondary);
  border-radius: var(--radius-large);
  padding: 24px;
  width: 100%;

  @media (max-width: ${BREAKPOINTS.tablet}) {
    padding: 16px;
  }
`;

export const ReviewSectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
`;

export const StyledEditIconControl = styled.button`
  display: flex;
  padding: var(--space-component-stack-padding-small, 4px)
    var(--space-component-inline-padding-x-small, 4px);
  justify-content: center;
  align-items: center;
  border-radius: var(--radius-action, 6px);
  border: 1px solid var(--color-container-border-secondary, #d5dee3);
  background: var(--color-action-standard-subtle, #fff);
  cursor: pointer;

  &:hover {
    background: var(--color-action-standard-subtle-hover, #f4f5f8);
  }

  &:focus {
    outline: 2px solid var(--color-focus, #0077c5);
    outline-offset: 2px;
  }
`;

export const StyledEditIcon = styled.span`
  display: flex;
  width: 16px;
  height: 16px;
  justify-content: center;
  align-items: center;
  aspect-ratio: 1 / 1;

  svg {
    width: 100%;
    height: 100%;
  }
`;

export const ReviewSectionContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const ReviewFieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const ReviewRulesTableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
`;

export const ReviewRulesTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  thead {
    background-color: var(--color-container-background-secondary);
  }

  th {
    text-align: left;
    padding: 12px 16px;
    font-size: var(--font-size-component-small);
    font-weight: var(--font-weight-component-semibold);
    color: var(--color-text-primary);
    border-bottom: 1px solid var(--color-divider-tertiary);
  }

  td {
    padding: 16px;
    font-size: var(--font-size-component-small);
    color: var(--color-text-primary);
    border-bottom: 1px solid var(--color-divider-secondary);
  }

  tr:last-child td {
    border-bottom: none;
  }
`;

export const ReviewCardsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
`;

import styled from 'styled-components';
import PageMessage from '@ids-ts/page-message';
import { Section as NotificationsCardViewSection } from './NotificationsCardView.styles';

/** Extra top spacing so the Overtime block is separated from Time tracking (view mode). */
export const OvertimeCardSection = styled(NotificationsCardViewSection)`
  margin-top: 16px;
`;

/** Column stack so headings (Overtime → Daily → Weekly) never sit inline—typography can render as inline. */
export const OvertimeViewStack = styled.div`
  width: 100%;
`;

export const OvertimeTitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  margin-bottom: 16px;
`;

/** One period (Daily / Weekly): subhead above the two-column KV grid. */
export const OvertimePeriodSection = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

export const StyledRow = styled.div<{ isErrorRow: boolean; index: number }>`
  display: flex;
  align-items: flex-start;
  gap: 24px;
  min-height: 40px;
  padding: 8px 0;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    padding: 12px 0;
    border-bottom: 1px solid var(--color-divider-tertiary);

    &:last-child {
      border-bottom: none;
    }
  }
`;

/** Shown when the unified API returns no overtime notification rules (read-only view). */
export const OvertimeEmptySection = styled.div`
  margin-top: 16px;
  padding-bottom: 16px;

  ${StyledRow} {
    display: block;
    min-height: unset;
  }
`;

export const OvertimeIntro = styled.p`
  margin: 8px 0 16px;
  color: #6b7177;
  font-size: 14px;
  line-height: 20px;
`;

export const OvertimeBlock = styled.div`
  margin-top: 16px;
  padding-left: 8px;
  border-left: 2px solid #e4e5e7;
`;

export const OvertimeBlockTitle = styled.div`
  margin-bottom: 12px;
`;

export const OvertimeFieldRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 14px;
  line-height: 20px;
  color: #393a3d;
`;

export const OvertimeNumericInput = styled.input`
  width: 48px;
  padding: 4px 8px;
  border: 1px solid #c7c7c9;
  border-radius: 4px;
  font-size: 14px;
  line-height: 20px;
`;

export const RecipientsTable = styled.div`
  margin-top: 8px;
`;

export const RecipientsHeaderRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 72px 72px;
  gap: 8px;
  margin-bottom: 4px;
  color: #6b7177;
  font-size: 12px;
`;

export const RecipientsBodyRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 72px 72px;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  color: #393a3d;
`;

/* ─── Edit form (matches time entry overtime notification settings layout) ─── */

export const OvertimeEditSectionContainer = styled.div`
  display: flex;
  flex-flow: column;
  gap: 12px;
  margin-bottom: 32px;
  width: 100%;
`;

export const OvertimeEditSectionHeader = styled.label`
  font-weight: var(--font-weight-component-bold);
  color: var(--color-text-primary);
  font-size: var(--font-size-component-medium);
  line-height: normal;
`;

export const OvertimeEditFormRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-top: 0;
  margin-bottom: 12px;

  & label {
    margin: 0 !important;
  }
`;

export const OvertimeEditFormLabelContainer = styled.div`
  flex: 1;
  min-width: 300px;
`;

export const OvertimeEditThresholdInputContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 4px;
`;

export const OvertimeEditTextFieldWrapper = styled.div`
  width: 80px;
`;

export const OvertimeEditFormLabelWrapper = styled.div`
  display: block;
  margin-bottom: 4px;
`;

export const OvertimeEditCheckboxContent = styled.div`
  gap: 18px;
  display: inline-grid;
  min-width: 34px;
`;

export const OvertimeEditNotificationCategoryRow = styled.div`
  display: grid;
  grid-template-columns: 300px 56px 56px;
  gap: 12px 24px;
  align-items: center;
  margin-bottom: 8px;
`;

export const OvertimeEditNotificationCategoryHeadersRow = styled.div`
  display: grid;
  grid-template-columns: 300px 56px 56px;
  gap: 12px 24px;
  margin-bottom: 4px;
`;

export const OvertimeEditSendAlertsToContainer = styled.div`
  margin-top: 16px;
`;

export const OvertimeEditSendAlertsToLabelWrapper = styled.div`
  display: block;
  margin-bottom: 8px;
`;

export const OvertimeEditPeriodToggleRow = styled.div`
  margin-top: 0;
  margin-bottom: 0;

  & label {
    margin-right: 0 !important;
    margin-bottom: 0 !important;
  }
`;

export const OvertimeEditPeriodRuleBlock = styled.div`
  margin-top: 0;
  margin-bottom: 16px;
  padding-left: 0;
`;

export const StyledPageMessage = styled(PageMessage)`
  &&& {
    margin-top: 1em;
    margin-bottom: 1em;
  }
`;

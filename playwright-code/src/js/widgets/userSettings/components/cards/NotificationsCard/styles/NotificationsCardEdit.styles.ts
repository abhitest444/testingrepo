// @ts-nocheck
import styled from 'styled-components';
import PageMessage from '@ids-ts/page-message';

export const Section = styled.div`
  margin-top: 16px;
`;

export const FormRow = styled.div`
  display: grid;
  grid-template-columns: 400px 56px 56px; /* control, email, mobile */
  align-items: start;
  column-gap: 24px;
  row-gap: 0;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
`;

export const SectionTitle = styled.div`
  margin-bottom: 16px;
`;

export const FormLabel = styled.div`
  width: 100%;
  display: block;
  margin: 0 0 4px 0;
  color: #393a3d;
  font-size: 14px;
  line-height: 20px;
`;

export const FormControl = styled.div`
  /* Allow children to participate directly in the grid */
  display: contents;
`;

export const ControlCell = styled.div`
  grid-column: 1 / 2;
`;

export const CheckboxContainer = styled.div`
  display: grid;
  grid-template-columns: 56px 56px; /* Email, Mobile */
  grid-template-rows: auto auto; /* Headers, Inputs */
  gap: 8px 24px;
  margin-top: 0;
  grid-column: 2 / 4; /* place in the email/mobile columns */
`;

export const CheckboxLabel = styled.span`
  color: #6b7177;
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 400;
`;

export const CheckboxWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
`;

export const Divider = styled.hr`
  border: none;
  border-top: 1px solid #e4e5e7;
  margin: 16px 0 24px 0;
`;

export const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e4e5e7;
`;

export const HeaderSpacer = styled.span`
  visibility: hidden;
`;

export const NotificationSettingsGroup = styled.div`
  margin-top: 8px;
  margin-bottom: 8px;
`;

export const NotificationCategoryHeadersRow = styled.div`
  display: grid;
  grid-template-columns: 400px 56px 56px;
  gap: 12px 24px;
  margin-bottom: 8px;
`;

export const NotificationCategoryHeadersLabel = styled.div`
  color: #6b7177;
  font-size: 12px;
`;

export const NotificationCategoryRow = styled.div`
  display: grid;
  grid-template-columns: 400px 56px 56px;
  gap: 12px 24px;
  align-items: center;

  &:last-child {
    margin-bottom: 0;
  }
`;

export const NotificationCategoryLabel = styled.div`
  color: #393a3d;
  font-size: 14px;
  line-height: 20px;
`;

export const ScheduleNotificationCategoryRow = styled(NotificationCategoryRow)`
  align-items: unset;
`;

export const ScheduleNotificationCategoryLabel = styled(
  NotificationCategoryLabel,
)`
  padding-top: 4px;
`;

export const CheckboxColumn = styled.div`
  display: flex;
  justify-content: center;
`;

export const StyledPageMessage = styled(PageMessage)`
  &&& {
    margin-top: 1em;
    margin-bottom: 1em;
  }
`;

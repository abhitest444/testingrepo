import React from 'react';
import styled from 'styled-components';
import { B4, Demi } from '@ids-ts/typography';
import { FieldGroup } from 'src/js/widgets/userSettings/components/styles/cards.styles';
import { KV } from './NotificationsCardView.styles';

export const ScheduleNotificationLabel: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => (
  <B4 style={{ color: 'var(--color-text-secondary)' }}>
    <Demi>{children}</Demi>
  </B4>
);

/** Schedule block uses the same 2-column KV grid as Reminders; last row spans full width. */
export const ScheduleNotificationsKv = styled(KV)``;

export const ScheduleNotificationFieldGroupFullWidth = styled(FieldGroup)`
  grid-column: 1 / -1;
`;

export const ScheduleNotificationsEditSection = styled.div`
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const ScheduleSectionContent = styled.div`
  display: flex;
  flex-direction: column;
`;

export const ScheduleErrorMessage = styled(B4)`
  color: #c43d3d;
  margin-top: 8px !important;
`;

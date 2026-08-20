import React from 'react';
import { HeaderActions } from './HeaderActions';
import { WorkersTabHeaderContainer } from '../../styles/WorkersTabHeader.styled';
import type { HeaderActionsProps } from './types';

/**
 * Workers Tab Header Component - Phase 1
 *
 * Tab-level header section for the Workers page with action buttons:
 * - HeaderActions: Three action buttons (Manage fields, Add worker, Create group)
 *
 * NOTE: Search and filter functionality will be implemented in a separate ticket.
 */
export const WorkersTabHeader: React.FC<HeaderActionsProps> = ({
  onManageFields,
  onAddWorker,
  onCreateGroup,
  setInviteWorkerType,
}) => (
  <WorkersTabHeaderContainer>
    <HeaderActions
      onManageFields={onManageFields}
      onAddWorker={onAddWorker}
      onCreateGroup={onCreateGroup}
      setInviteWorkerType={setInviteWorkerType}
    />
  </WorkersTabHeaderContainer>
);

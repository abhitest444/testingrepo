import React from 'react';
import Button from '@ids-ts/button';
import DropdownButton, { MenuItem } from '@ids-ts/dropdown-button';
import { Plus } from '@design-systems/icons';
import { useIntl } from '@payroll/quicksand';
import { WorkerNameType } from 'src/js/widgets/assignments/types';
import { FEATURE_FLAGS } from 'src/js/common/constants';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';
import { HeaderActionsContainer } from '../../styles/HeaderActions.styled';
import { WhosWorkingButton } from './WhosWorkingButton';
import { InviteTeamMembersButton } from './InviteTeamMembersButton';
import type { HeaderActionsProps } from './types';

/**
 * Header Action Buttons
 *
 * Renders action buttons at the top of the Workers page:
 * 1. "Manage time tracking fields" - Secondary button
 * 2. "Add worker" - Dropdown button with "Add employee" and "Add vendor" options
 * 3. "Invite to track time" - Dropdown with "Invite employee" / "Invite contractor" options (feature-flagged)
 * 4. "+ Create group" - Primary button with plus icon (matches "Add customer" button)
 *
 * NOTE: This is Phase 1 implementation with mock handlers.
 * Future stories will connect these to actual functionality:
 * - "Manage time tracking fields" -> Time tracking fields modal (TBD)
 * - "Add worker" -> Add worker drawer with different nameTypes (TBD)
 * - "+ Create group" -> CreateGroupDrawer (TBD)
 */
export const HeaderActions: React.FC<HeaderActionsProps> = ({
  onManageFields = () => {},
  onAddWorker = () => {},
  onCreateGroup = () => {},
  setInviteWorkerType = () => {},
}) => {
  const intl = useIntl();

  const { isEnabled: isInviteWorkerEnabled } = useIXPFeatureFlag({
    flagName: FEATURE_FLAGS.SBSEG_QBO_WORKER_TRACK_ENABLE_WORKER_INVITE,
    defaultValue: false,
  });

  const {
    isEnabled: isTeamMembersTabEnabled,
    settled: teamMembersFlagSettled,
  } = useIXPFeatureFlag({
    flagName: FEATURE_FLAGS.SBSEG_QBO_ENABLE_TIME_TAB_TEAM_MEMBERS,
    defaultValue: false,
  });

  const handleAddWorkerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const workerType = e.target.value as WorkerNameType;
    onAddWorker(workerType);
  };

  const handleWorkerInviteDrawer = (e: React.ChangeEvent<HTMLInputElement>) => {
    const workerType = e.target.value as WorkerNameType;
    if (
      workerType === WorkerNameType.EMPLOYEE ||
      workerType === WorkerNameType.CONTRACTOR
    ) {
      setInviteWorkerType(workerType);
    }
  };

  // Wait for flag to settle before rendering the header actions
  // this is to avoid flickering issue till the time the IXP result comes
  if (!teamMembersFlagSettled) {
    return null;
  }

  return (
    <HeaderActionsContainer>
      {isTeamMembersTabEnabled && (
        <>
          <WhosWorkingButton />
          {/* TODO: To be replaced by the EMS invite team member drawer once ready */}
          <InviteTeamMembersButton />
        </>
      )}

      {/* TODO: To be removed completely once the feature flag is 100% enabled */}
      {!isTeamMembersTabEnabled && (
        <Button
          purpose="standard"
          priority="secondary"
          onClick={onManageFields}
          aria-label={intl.formatMessage({
            id: 'workers.header.manageFields',
            defaultMessage: 'Manage time tracking fields',
          })}
          data-testid="manage-fields-btn"
        >
          {intl.formatMessage({
            id: 'workers.header.manageFields',
            defaultMessage: 'Manage time tracking fields',
          })}
        </Button>
      )}

      <DropdownButton
        buttonPriority="secondary"
        buttonPurpose="standard"
        label={intl.formatMessage({
          id: 'workers.header.addWorker',
          defaultMessage: 'Add worker',
        })}
        // @ts-ignore
        onSelect={handleAddWorkerSelect}
        aria-label={intl.formatMessage({
          id: 'workers.header.addWorker',
          defaultMessage: 'Add worker',
        })}
        data-testid="add-worker-dropdown-btn"
      >
        <MenuItem value={WorkerNameType.EMPLOYEE}>
          {intl.formatMessage({
            id: 'workers.header.addEmployee',
            defaultMessage: 'Add employee',
          })}
        </MenuItem>
        <MenuItem value={WorkerNameType.CONTRACTOR}>
          {intl.formatMessage({
            id: 'workers.header.addContractor',
            defaultMessage: 'Add contractor',
          })}
        </MenuItem>
      </DropdownButton>

      {isInviteWorkerEnabled && (
        <DropdownButton
          buttonPriority="secondary"
          buttonPurpose="standard"
          label={intl.formatMessage({
            id: 'workers.header.invite.to.track.time',
            defaultMessage: 'Invite to track time',
          })}
          // @ts-ignore
          onSelect={handleWorkerInviteDrawer}
          aria-label={intl.formatMessage({
            id: 'workers.header.invite.to.track.time',
            defaultMessage: 'Invite to track time',
          })}
          data-testid="invite-worker-dropdown-btn"
        >
          <MenuItem value={WorkerNameType.EMPLOYEE}>
            {intl.formatMessage({
              id: 'workers.header.invite.employee',
              defaultMessage: 'Invite employees',
            })}
          </MenuItem>
          <MenuItem value={WorkerNameType.CONTRACTOR}>
            {intl.formatMessage({
              id: 'workers.header.invite.contractor',
              defaultMessage: 'Invite contractors',
            })}
          </MenuItem>
        </DropdownButton>
      )}

      <Button
        purpose="standard"
        priority="primary"
        onClick={onCreateGroup}
        aria-label={intl.formatMessage({
          id: 'groups.header.createGroup',
          defaultMessage: 'Create group',
        })}
        data-testid="create-group-btn"
      >
        <Plus />
        {intl.formatMessage({
          id: 'groups.header.createGroup',
          defaultMessage: 'Create group',
        })}
      </Button>
    </HeaderActionsContainer>
  );
};

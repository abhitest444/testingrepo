import React from 'react';
import TextField from '@ids-ts/text-field';
import PageMessage from '@ids-ts/page-message';
import { useIntl } from '@payroll/quicksand';
import { useSelector } from 'react-redux';
import {
  SectionContainer,
  SectionTitle,
  SectionContent,
  Divider,
  GroupDetailsContentContainer,
} from '../../styles/Groups/GroupDrawer.styled';
import { AssignmentSection } from './AssignmentSection';
import {
  selectDrawerErrorTitle,
  selectDrawerErrorMessage,
} from '../../store/workersGroupViewSlice';
import { selectWorkersListHeaderTotalCount } from '../../store/workersListSlice';

export interface GroupDetailsContentProps {
  /**
   * Current group name value
   */
  groupName: string;

  /**
   * Callback when group name changes
   */
  onGroupNameChange: (value: string) => void;

  /**
   * Callback to clear error message
   */
  onClearError: () => void;

  /**
   * Callback when "Assign workers" button is clicked
   */
  onAssignWorkers: () => void;

  /**
   * Callback when "Assign leads" button is clicked
   */
  onAssignLeads: () => void;

  /**
   * Callback when Enter key is pressed in the group name field
   */
  onKeyDown?: (e: React.KeyboardEvent) => void;

  /**
   * Number of selected workers
   */
  selectedWorkersCount: number;

  /**
   * Number of selected leads
   */
  selectedLeadsCount: number;

  /**
   * Whether the form is in loading state
   */
  loading: boolean;

  /**
   * Whether to show group leads section (hidden for NTTF eligible companies)
   */
  shouldShowGroupLeads?: boolean;
}

/**
 * GroupDetailsContent Component
 *
 * Displays the group details form with:
 * - Group name input field
 * - Worker assignment section
 * - Lead assignment section
 *
 * Extracted from GroupDrawer to support multi-view architecture
 */
export const GroupDetailsContent: React.FC<GroupDetailsContentProps> = ({
  groupName,
  onGroupNameChange,
  onClearError,
  onAssignWorkers,
  onAssignLeads,
  onKeyDown,
  selectedWorkersCount,
  selectedLeadsCount,
  loading,
  shouldShowGroupLeads = true,
}) => {
  const intl = useIntl();

  // Error state from Redux
  const drawerErrorTitle = useSelector(selectDrawerErrorTitle);
  const drawerErrorMessage = useSelector(selectDrawerErrorMessage);

  const totalActiveWorkersCount = useSelector(
    selectWorkersListHeaderTotalCount,
  );

  return (
    <GroupDetailsContentContainer>
      {/* Error Message at Top */}
      {drawerErrorMessage && (
        <PageMessage
          type="error"
          open
          onClose={onClearError}
          title={drawerErrorTitle ?? undefined}
          data-testid="group-drawer-error-message"
        >
          {typeof drawerErrorMessage === 'string' &&
          drawerErrorMessage.includes('<ul>') ? (
            <div dangerouslySetInnerHTML={{ __html: drawerErrorMessage }} />
          ) : (
            drawerErrorMessage
          )}
        </PageMessage>
      )}

      {/* Group Name Section */}
      <SectionContainer>
        <SectionTitle>
          {intl.formatMessage({
            id: 'groups.drawer.section.name.title',
            defaultMessage: 'What is the name of the group?',
          })}
        </SectionTitle>
        <SectionContent>
          <TextField
            label={intl.formatMessage({
              id: 'groups.drawer.label',
              defaultMessage: 'Group name',
            })}
            value={groupName}
            onChange={(e) => onGroupNameChange(e.target.value)}
            onKeyDown={onKeyDown}
            width="305px"
            autoFocus
            disabled={loading}
            aria-label="Group name"
            data-testid="group-name-input"
          />
        </SectionContent>
      </SectionContainer>

      <Divider />

      {/* Workers Section */}
      <AssignmentSection
        title={intl.formatMessage({
          id: 'groups.drawer.section.workers.title',
          defaultMessage: 'Who is a part of this group?',
        })}
        countLabel={intl.formatMessage(
          {
            id: 'groups.drawer.workers.count',
            defaultMessage: '{count} of {total} workers',
          },
          { count: selectedWorkersCount, total: totalActiveWorkersCount },
        )}
        buttonLabel={intl.formatMessage({
          id: 'groups.drawer.button.assign_workers',
          defaultMessage: 'Assign workers',
        })}
        onButtonClick={onAssignWorkers}
        disabled={loading}
        buttonTestId="assign-workers-btn"
        countTestId="workers-count-indicator"
      />

      {shouldShowGroupLeads && (
        <>
          <Divider />

          {/* Group Leads Section */}
          <AssignmentSection
            title={intl.formatMessage({
              id: 'groups.drawer.section.leads.title',
              defaultMessage: 'Who leads this group?',
            })}
            description={intl.formatMessage({
              id: 'groups.drawer.section.leads.description',
              defaultMessage:
                'They can edit jobs and manage user accounts, timesheets, schedules, and run reports in QuickBooks Time.',
            })}
            countLabel={intl.formatMessage(
              {
                id: 'groups.drawer.leads.count',
                defaultMessage: '{count} group leads',
              },
              { count: selectedLeadsCount },
            )}
            buttonLabel={intl.formatMessage({
              id: 'groups.drawer.button.assign_leads',
              defaultMessage: 'Assign leads',
            })}
            onButtonClick={onAssignLeads}
            disabled={loading}
            buttonTestId="assign-leads-btn"
            countTestId="leads-count-indicator"
          />
        </>
      )}
    </GroupDetailsContentContainer>
  );
};

export default GroupDetailsContent;

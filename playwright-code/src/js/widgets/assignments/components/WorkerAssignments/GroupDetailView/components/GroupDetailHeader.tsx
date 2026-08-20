import React from 'react';
import { ChevronLeft, PersonThree } from '@design-systems/icons';
import { IconControl } from '@ids-ts/icon-control';
import { useIntl } from '@payroll/quicksand';
import { useAppSelector } from '../../../../store/hooks';
import { selectWorkersListHeaderTotalCount } from '../../../../store/workersListSlice';
import {
  BackButtonContainer,
  BackLink,
  GroupHeader,
  GroupTitle,
  GroupStats,
  IconBadge,
} from '../styles/GroupDetailView.styled';

interface GroupDetailHeaderProps {
  groupName: string;
  memberCount: number;
  managerCount?: number;
  onBack: () => void;
  onAssignWorkers: () => void;
  onAssignLeads?: () => void;
  shouldShowGroupLeads?: boolean;
}

/**
 * GroupDetailHeader Component
 * Displays the back button, group name, and stats badges
 * Stats badges are clickable and open the Assign Workers or Assign Leads drawer.
 */
export const GroupDetailHeader: React.FC<GroupDetailHeaderProps> = ({
  groupName,
  memberCount,
  managerCount,
  onBack,
  onAssignWorkers,
  onAssignLeads,
  shouldShowGroupLeads = true,
}) => {
  const intl = useIntl();
  const totalWorkers = useAppSelector(selectWorkersListHeaderTotalCount);

  const workersLabel = intl.formatMessage(
    {
      id: 'groups.detail.workerCountBadge',
      defaultMessage:
        '{displayed} of {total} {total, plural, one {worker} other {workers}}',
    },
    { displayed: memberCount, total: totalWorkers },
  );
  const leadsLabel = intl.formatMessage(
    {
      id: 'groups.detail.leadCountBadge',
      defaultMessage:
        '{count} {count, plural, one {group lead} other {group leads}}',
    },
    { count: managerCount },
  );

  const assignWorkersAria = intl.formatMessage({
    id: 'groups.detail.assignWorkersChip',
    defaultMessage: 'Assign workers',
  });
  const assignLeadsAria = intl.formatMessage({
    id: 'groups.detail.assignLeadsChip',
    defaultMessage: 'Assign leads',
  });

  const statIcon = (
    <IconControl size="small">
      <PersonThree />
    </IconControl>
  );

  return (
    <>
      <BackButtonContainer>
        <BackLink
          onClick={onBack}
          aria-label={intl.formatMessage({
            id: 'groups.detail.backToGroups',
            defaultMessage: 'Back to Groups',
          })}
        >
          <ChevronLeft />
          {intl.formatMessage({
            id: 'groups.detail.backButton',
            defaultMessage: 'Groups',
          })}
        </BackLink>
      </BackButtonContainer>

      <GroupHeader>
        <GroupTitle>{groupName}</GroupTitle>
        <GroupStats>
          {/* Workers chip: click opens Assign Workers drawer */}
          <IconBadge onClick={onAssignWorkers} aria-label={assignWorkersAria}>
            {statIcon}
            {workersLabel}
          </IconBadge>

          {/* Group Leads chip: click opens Assign Leads drawer */}
          {shouldShowGroupLeads && (
            <IconBadge onClick={onAssignLeads} aria-label={assignLeadsAria}>
              {statIcon}
              {leadsLabel}
            </IconBadge>
          )}
        </GroupStats>
      </GroupHeader>
    </>
  );
};

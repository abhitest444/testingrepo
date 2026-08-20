import React from 'react';
import { useIntl } from '@payroll/quicksand';
import { PersonThree } from '@design-systems/icons';
import Button from '@ids-ts/button';
import { useAppSelector } from 'src/js/widgets/breaks/store/hooks';
import { selectTeamMembers } from 'src/js/widgets/breaks/store/workerSlice';
import { selectTempAssignments } from 'src/js/widgets/breaks/store/breakPolicyFormSlice';
import {
  AssignRow,
  Pill,
  AssignTeamMembersIcon,
} from '../styles/Breaks.styled';
import { DYN_BREAKS_SELECT_ASSIGNMENTS } from '../../../trackingMetadata';

interface BreakTeamMembersSectionProps {
  onEditTeamMembers: () => void;
}

const BreakTeamMembersSection: React.FC<BreakTeamMembersSectionProps> = ({
  onEditTeamMembers,
}) => {
  const intl = useIntl();

  // Redux state
  const teamMembers = useAppSelector(selectTeamMembers);
  const tempAssignments = useAppSelector(selectTempAssignments);

  // Calculate assigned count based on Redux state only
  const getAssignedCount = () =>
    tempAssignments.filter((member) => member.isActive).length.toString();

  const assignedCount = getAssignedCount();
  const totalCount = teamMembers.length.toString();

  return (
    <AssignRow>
      <Pill>
        <AssignTeamMembersIcon>
          <PersonThree />
        </AssignTeamMembersIcon>
        {intl.formatMessage(
          { id: 'breaks.create.teamMemberAssignments' },
          {
            assignedCount,
            totalCount,
          },
        )}
      </Pill>
      <Button
        onClick={onEditTeamMembers}
        priority="secondary"
        size="small"
        id={DYN_BREAKS_SELECT_ASSIGNMENTS}
      >
        {intl.formatMessage({ id: 'breaks.create.editAccess' })}
      </Button>
    </AssignRow>
  );
};

export default BreakTeamMembersSection;

import React, { useState, useMemo } from 'react';
import { Checkbox } from '@ids-ts/checkbox';
import { Table } from '@ids-ts/table';
import { useIntl } from '@payroll/quicksand';
import Typography from '@ids-ts/typography';
import {
  useAppDispatch,
  useAppSelector,
} from 'src/js/widgets/breaks/store/hooks';
import { selectTeamMembers } from 'src/js/widgets/breaks/store/workerSlice';
import {
  selectTempAssignments,
  setTempAssignments,
} from 'src/js/widgets/breaks/store/breakPolicyFormSlice';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import { BREAK_LOGGING_CONSTANTS } from '../../../../constants';
import { TeamMember } from '../../../../types';
import { StyledTable } from '../../styles/Breaks.styled';

interface BreakAssignmentsFormProps {
  search?: string;
}

const BreakAssignmentsForm: React.FC<BreakAssignmentsFormProps> = ({
  search = '',
}) => {
  const { formatMessage } = useIntl();
  const dispatch = useAppDispatch();
  const logger = useLoggingConfig();
  // Redux state
  const teamMembers = useAppSelector(selectTeamMembers);
  const tempAssignments = useAppSelector(selectTempAssignments);

  // Filter team members by search
  const filtered = useMemo(
    () =>
      teamMembers.filter((member) =>
        member.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [teamMembers, search],
  );

  const allFilteredIds = filtered.map((member) => member.id);
  const activeAssignmentIds = tempAssignments
    .filter((member) => member.isActive)
    .map((member) => member.id);

  const allSelected =
    allFilteredIds.length > 0 &&
    allFilteredIds.every((id) => activeAssignmentIds.includes(id));
  const someSelected =
    allFilteredIds.length > 0 &&
    allFilteredIds.some((id) => activeAssignmentIds.includes(id)) &&
    !allSelected;

  const handleToggle = (id: string) => {
    const isCurrentlyActive = activeAssignmentIds.includes(id);
    const memberName = teamMembers.find((member) => member.id === id)?.name;

    if (isCurrentlyActive) {
      logger.info(
        BREAK_LOGGING_CONSTANTS.USER_INTERACTIONS.TEAM_MEMBER_DESELECTED,
        {
          teamMemberId: id,
          teamMemberName: memberName,
        },
      );
      // Set isActive to false for the deselected member
      const newAssignments = tempAssignments.map((member) =>
        member.id === id ? { ...member, isActive: false } : member,
      );
      dispatch(setTempAssignments(newAssignments));
    } else {
      logger.info(
        BREAK_LOGGING_CONSTANTS.USER_INTERACTIONS.TEAM_MEMBER_SELECTED,
        {
          teamMemberId: id,
          teamMemberName: memberName,
        },
      );
      // Set isActive to true for the selected member
      const newAssignments = tempAssignments.map((member) =>
        member.id === id ? { ...member, isActive: true } : member,
      );
      dispatch(setTempAssignments(newAssignments));
    }
  };

  // Handle select all checkbox click - toggle between select all and unselect all
  const handleSelectAllClick = () => {
    if (allSelected) {
      logger.info(
        BREAK_LOGGING_CONSTANTS.USER_INTERACTIONS.TEAM_MEMBER_DESELECTED,
        {
          action: 'select_all_deselect',
          count: allFilteredIds.length,
        },
      );
      // Set isActive to false for all filtered items
      const newAssignments = tempAssignments.map((member) =>
        allFilteredIds.includes(member.id)
          ? { ...member, isActive: false }
          : member,
      );
      dispatch(setTempAssignments(newAssignments));
    } else {
      logger.info(
        BREAK_LOGGING_CONSTANTS.USER_INTERACTIONS.TEAM_MEMBER_SELECTED,
        {
          action: 'select_all_select',
          count: filtered.length,
        },
      );
      // Set isActive to true for all filtered items
      const newAssignments = tempAssignments.map((member) =>
        allFilteredIds.includes(member.id)
          ? { ...member, isActive: true }
          : member,
      );
      dispatch(setTempAssignments(newAssignments));
    }
  };

  return (
    <StyledTable>
      <Table.Header background="gray">
        <Table.Row>
          <Table.Cell>
            <Checkbox
              checked={allSelected}
              indeterminate={someSelected}
              onClick={handleSelectAllClick}
              aria-label={formatMessage({
                id: 'breaks.create.teamMembers.selectAll',
              })}
            />
          </Table.Cell>
          <Table.Cell>
            {formatMessage({
              id: 'breaks.create.teamMembers.table.teamMember',
            })}
          </Table.Cell>
          <Table.Cell>
            {formatMessage({
              id: 'breaks.create.teamMembers.table.workerType',
            })}
          </Table.Cell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {filtered.map((member) => {
          const tempAssignment = tempAssignments.find(
            (ta) => ta.id === member.id,
          );
          const isActive = tempAssignment?.isActive || false;

          return (
            <Table.Row key={member.id}>
              <Table.Cell>
                <Checkbox
                  checked={isActive}
                  onChange={() => handleToggle(member.id)}
                  aria-label={`${formatMessage({
                    id: 'breaks.create.teamMembers.table.teamMember',
                  })}: ${member.name}`}
                />
              </Table.Cell>
              <Table.Cell>
                <Typography variant="body-2">{member.name}</Typography>
              </Table.Cell>
              <Table.Cell>
                <Typography variant="body-2">{member.workerType}</Typography>
              </Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </StyledTable>
  );
};

export default BreakAssignmentsForm;

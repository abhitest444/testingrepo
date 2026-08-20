import React from 'react';
import { Checkbox } from '@ids-ts/checkbox';
import { Table } from '@ids-ts/table';
import { useIntl } from '@payroll/quicksand';
import Typography from '@ids-ts/typography';
import { TeamMember } from 'src/js/widgets/breaks/types';
import { StyledTable } from 'src/js/widgets/breaks/features/breaks-settings/styles/Breaks.styled';

interface AssignTeamMembersListProps {
  teamMembers: TeamMember[];
  selected: string[];
  onChange: (selected: string[]) => void;
  allFilteredIds: string[];
}

const AssignTeamMembersList: React.FC<AssignTeamMembersListProps> = ({
  teamMembers,
  selected,
  onChange,
  allFilteredIds,
}) => {
  const { formatMessage } = useIntl();
  const allSelected =
    allFilteredIds.length > 0 &&
    allFilteredIds.every((id) => selected.includes(id));
  const someSelected =
    allFilteredIds.some((id) => selected.includes(id)) && !allSelected;

  const handleToggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onChange(Array.from(new Set([...selected, ...allFilteredIds])));
    } else {
      onChange(selected.filter((id) => !allFilteredIds.includes(id)));
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
              onChange={(e) => handleSelectAll(!!e.target.checked)}
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
        {teamMembers.map((member) => (
          <Table.Row key={member.id}>
            <Table.Cell>
              <Checkbox
                checked={selected.includes(member.id)}
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
        ))}
      </Table.Body>
    </StyledTable>
  );
};

export default AssignTeamMembersList;

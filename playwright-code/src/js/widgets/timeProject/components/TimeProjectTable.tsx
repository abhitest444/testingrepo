import React from 'react';
import { Table } from '@ids-ts/table';
import { B3 } from '@ids-ts/typography';
import { IconControl } from '@ids-ts/icon-control';
import { useIntl } from '@payroll/quicksand';
import { TableAscending, TableDescending } from '@design-systems/icons';
import { useAppSelector } from '../store';
import {
  TimeProjectRow as TimeProjectRowType,
  TimeProjectSortOrder,
} from '../types';
import { useProjectsSdkFlags } from '../hooks/useProjectsSdkFlags';
import { PROJECT_SORT_ORDER } from '../constants';
import TimeProjectZeroState from './TimeProjectZeroState';
import TimeProjectRow from './TimeProjectRow';
import {
  StyledTable,
  TableWrapper,
  StatusHeaderCell,
  ActionsHeaderCell,
} from './TimeProjectTable.styled';

const PROJECT_HEADER_KEY = 'timeProject.table.column.projectCustomer';
const STATUS_HEADER_KEY = 'timeProject.table.column.status';
const COLUMN_HEADERS = [
  { key: PROJECT_HEADER_KEY },
  { key: STATUS_HEADER_KEY },
  { key: 'timeProject.table.column.deadline' },
  { key: 'timeProject.table.column.budget' },
];

interface TimeProjectTableProps {
  onRowClick?: (row: TimeProjectRowType) => void;
  onAssignWorkers: (row: TimeProjectRowType) => void;
  onCreateEstimate: (row: TimeProjectRowType) => void;
  onEditEstimate: (row: TimeProjectRowType) => void;
  sortOrder?: TimeProjectSortOrder;
  onSortChange?: () => void;
}

const TimeProjectTable: React.FC<TimeProjectTableProps> = ({
  onRowClick,
  onAssignWorkers,
  onCreateEstimate,
  onEditEstimate,
  sortOrder = PROJECT_SORT_ORDER.NAME_ASC,
  onSortChange,
}) => {
  const intl = useIntl();
  const text = (id: string) => intl.formatMessage({ id });
  const { isProjectsManageProjectsEnabled } = useProjectsSdkFlags();
  const rows = useAppSelector((state) => state.projects.filteredRows);
  const isAscending = sortOrder === PROJECT_SORT_ORDER.NAME_ASC;

  const getColumnSortIcon = () =>
    isAscending ? (
      <TableAscending color="#393A3D" aria-hidden="true" />
    ) : (
      <TableDescending color="#393A3D" aria-hidden="true" />
    );

  const renderHeaderCell = (key: string) => {
    if (key === STATUS_HEADER_KEY) {
      return (
        <StatusHeaderCell>
          <B3 weight="demi">{text(key)}</B3>
        </StatusHeaderCell>
      );
    }

    if (key === PROJECT_HEADER_KEY) {
      const projectHeaderKey =
        isProjectsManageProjectsEnabled !== true
          ? 'timeProject.table.column.project'
          : PROJECT_HEADER_KEY;
      const headerLabel = text(projectHeaderKey);
      const sortAriaLabel = intl.formatMessage(
        { id: 'timeProject.table.sort.ariaLabel' },
        { column: headerLabel },
      );
      return (
        <IconControl
          label={headerLabel}
          labelAlignment="left"
          size="small"
          aria-label={sortAriaLabel}
          onClick={onSortChange}
          data-testid="time-project-table-sort-project"
        >
          {getColumnSortIcon()}
        </IconControl>
      );
    }

    return <B3 weight="demi">{text(key)}</B3>;
  };

  if (rows.length === 0) {
    return <TimeProjectZeroState />;
  }

  return (
    <TableWrapper data-testid="time-project-table-wrapper">
      <StyledTable
        divider="horizontal"
        hover="row"
        density="roomy"
        summary={text('timeProject.table.summary')}
        data-testid="time-project-table"
      >
        <Table.Header>
          <Table.Row>
            {COLUMN_HEADERS.map(({ key }) => {
              let ariaSort: 'ascending' | 'descending' | undefined;
              if (key === PROJECT_HEADER_KEY) {
                ariaSort = isAscending ? 'ascending' : 'descending';
              }
              return (
                <Table.Cell key={key} aria-sort={ariaSort}>
                  {renderHeaderCell(key)}
                </Table.Cell>
              );
            })}
            <Table.Cell key="actions">
              <ActionsHeaderCell>
                <B3 weight="demi">
                  {text('timeProject.table.column.actions')}
                </B3>
              </ActionsHeaderCell>
            </Table.Cell>
          </Table.Row>
        </Table.Header>
        <tbody>
          {rows.map((row) => (
            <TimeProjectRow
              key={row.uniqueId}
              row={row}
              onRowClick={onRowClick}
              onAssignWorkers={onAssignWorkers}
              onCreateEstimate={onCreateEstimate}
              onEditEstimate={onEditEstimate}
            />
          ))}
        </tbody>
      </StyledTable>
    </TableWrapper>
  );
};

export default TimeProjectTable;

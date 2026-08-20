import React from 'react';
import { useIntl } from '@payroll/quicksand';
import { Table } from '@ids-ts/table';
import { B3 } from '@ids-ts/typography';
import { WhoIsWorkingWorkerNode } from '../../hooks/useWhoIsWorkingLoadMore';
import { StyledTable } from './WorkerList.styled';
import { WorkerRowContent } from './WorkerRowContent';

interface WorkerListFlatProps {
  workers: WhoIsWorkingWorkerNode[];
  selectedWorkerId?: string;
  onMapClick: (workerId: string, event: React.MouseEvent) => void;
  onEditTime: (timeEntryId: string) => void;
  onAddTime: () => void;
  onAddBreak: (workerId: string) => void;
  currentUserWorkerId?: string;
  isWhoIsWorkingEditTimeEnabled?: boolean;
}

/**
 * WorkerListFlat Component
 * Displays a flat list of workers in a table format
 */
export const WorkerListFlat: React.FC<WorkerListFlatProps> = ({
  workers,
  selectedWorkerId = '',
  onMapClick,
  onEditTime,
  onAddTime,
  onAddBreak,
  currentUserWorkerId,
  isWhoIsWorkingEditTimeEnabled = true,
}) => {
  const intl = useIntl();

  return (
    <StyledTable
      divider="horizontal"
      hover="row"
      summary="Workers list"
      density="roomy"
    >
      <Table.Header>
        <Table.Row>
          <Table.Cell>
            <B3 weight="demi">
              {intl.formatMessage({
                id: 'whosWorking.list.header.teamMember',
              })}
            </B3>
          </Table.Cell>
          <Table.Cell>
            <B3 weight="demi">
              {intl.formatMessage({ id: 'whosWorking.list.header.hours' })}
            </B3>
          </Table.Cell>
          <Table.Cell>
            <B3 weight="demi">
              {intl.formatMessage({ id: 'whosWorking.list.header.map' })}
            </B3>
          </Table.Cell>
          <Table.Cell>
            <B3 weight="demi">
              {intl.formatMessage({ id: 'whosWorking.list.header.action' })}
            </B3>
          </Table.Cell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {workers.map((worker) => {
          const workerId = worker.timeForContactDAS?.id || '';
          const isSelected = workerId === selectedWorkerId;

          return (
            <WorkerRowContent
              key={workerId || worker.displayName}
              worker={worker}
              isSelected={isSelected}
              onMapClick={onMapClick}
              onEditTime={onEditTime}
              onAddTime={onAddTime}
              onAddBreak={() => onAddBreak(workerId)}
              currentUserWorkerId={currentUserWorkerId}
              isWhoIsWorkingEditTimeEnabled={isWhoIsWorkingEditTimeEnabled}
            />
          );
        })}
      </Table.Body>
    </StyledTable>
  );
};

import React from 'react';
import { Table } from '@ids-ts/table';
import { Activity } from '@ids-ts/loader';
import {
  LoadingMoreContainer,
  EndOfListMessage,
  WorkerCell,
} from '../../styles/WorkersTableByGroupsView.styled';
import { WorkerRow } from './WorkerRow';
import type { WorkersForGroupState } from '../../../store/workersGroupViewSlice';

interface NestedWorkersInfiniteScrollProps {
  groupId: string;
  workersState: WorkersForGroupState;
  loadMoreWorkers: (groupId: string) => void;
}

/**
 * Renders nested workers as flat table rows
 */
export const NestedWorkersInfiniteScroll: React.FC<
  NestedWorkersInfiniteScrollProps
> = ({ groupId, workersState }) => {
  const workerRows = workersState.ids
    .map((workerId) => workersState.entities[workerId])
    .filter((worker): worker is NonNullable<typeof worker> => !!worker)
    .map((worker) => <WorkerRow key={worker.id} worker={worker} />);

  const loadingRow = workersState.isLoadingMore && (
    <Table.Row key={`${groupId}-loading`}>
      <Table.Cell colSpan={3}>
        <LoadingMoreContainer>
          <Activity size="large" shape="dots" />
          Loading more workers...
        </LoadingMoreContainer>
      </Table.Cell>
    </Table.Row>
  );

  const emptyRow = workersState.ids.length === 0 &&
    !workersState.isLoadingMore && (
      <Table.Row key={`${groupId}-empty`}>
        <WorkerCell colSpan={3}>
          <EndOfListMessage>No workers in this group</EndOfListMessage>
        </WorkerCell>
      </Table.Row>
    );

  const endRow = !workersState.hasMore && workersState.ids.length > 0 && (
    <Table.Row key={`${groupId}-end`}>
      <Table.Cell colSpan={3}>
        <EndOfListMessage>
          All workers loaded ({workersState.ids.length} total)
        </EndOfListMessage>
      </Table.Cell>
    </Table.Row>
  );

  return (
    <>
      {workerRows}
      {loadingRow}
      {emptyRow}
      {endRow}
    </>
  );
};

import React, { useCallback } from 'react';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import { Table } from '@ids-ts/table';
import { Activity } from '@ids-ts/loader';
import DropdownButton, { MenuItem } from '@ids-ts/dropdown-button';
import PageMessage from '@ids-ts/page-message';
import { TimeTracking_TimeForType } from 'src/__generated__/timeTracking/graphql';
import { AssignmentsEmptyState } from 'src/js/widgets/assignments/components/AssignmentsEmptyState';
import {
  useAppDispatch,
  useAppSelector,
} from 'src/js/widgets/assignments/store/hooks';
import { selectWorkersListError } from 'src/js/widgets/assignments/store/workersListSlice';
import { openAddWorkerDrawer } from 'src/js/widgets/assignments/store/workersGroupViewSlice';
import { WORKER_ASSIGNMENTS_TRACKING_POINTS } from 'src/js/widgets/assignments/utils/assignmentsTrackingPoints';
import { getWorkersEmptyStateTitle } from 'src/js/widgets/assignments/utils/helpers';
import {
  WorkerNameType,
  WorkersEmptyStateContext,
} from 'src/js/widgets/assignments/types';
import {
  StyledTable,
  WorkerNameCell,
  WorkerInfoContainer,
  WorkerName,
  WorkerRoleText,
  WorkerTypeAndGroupCell,
  ActionsCell,
  ActionsContainer,
  EmptyStateContainer,
  LoadingRow,
  StyledLink,
} from '../../styles/WorkersListView.styled';
import { WorkersTableProps } from './types';
import { WorkerType } from '../SearchFilterBar/types';

/**
 * WorkersTable - Dumb/Presentational Component
 * Displays workers in a flat list format with actions
 * This component is stateless and only renders the UI based on props
 */
const WorkersTable: React.FC<WorkersTableProps> = ({
  workers,
  loading,
  totalCount,
  onViewSettings,
  searchText = '',
  workerType = WorkerType.ALL,
}) => {
  const intl = useIntl();
  const sandbox = useSandbox();
  const track = useTracking();
  const dispatch = useAppDispatch();
  const error = useAppSelector(selectWorkersListError);

  const handleAddWorkerSelect = useCallback(
    (e: React.MouseEvent | React.KeyboardEvent) => {
      const value = (e.target as HTMLSelectElement)?.value;
      if (!value) return;
      const workerType = value as WorkerNameType;
      sandbox.logger.info(
        'Component="WorkersTable" Event="Add Worker clicked (empty state)"',
        { workerType },
      );
      track(WORKER_ASSIGNMENTS_TRACKING_POINTS.ADD_WORKER_CTA);
      dispatch(openAddWorkerDrawer({ workerType }));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Show error state (full replacement)
  if (error && !loading) {
    return (
      <PageMessage
        type="error"
        title={intl.formatMessage({ id: 'workers.list.error.title' })}
        open
      >
        {error}
      </PageMessage>
    );
  }

  // Show empty state if no workers
  if (!loading && workers.length === 0) {
    return (
      <AssignmentsEmptyState
        title={getWorkersEmptyStateTitle(
          WorkersEmptyStateContext.WORKERS_LIST,
          searchText,
          workerType,
          intl,
        )}
        description={intl.formatMessage({
          id: 'workers.list.empty.description',
        })}
        action={
          <DropdownButton
            buttonPriority="primary"
            buttonPurpose="standard"
            label={intl.formatMessage({
              id: 'workers.header.addWorker',
              defaultMessage: 'Add worker',
            })}
            onSelect={handleAddWorkerSelect}
            aria-label={intl.formatMessage({
              id: 'workers.header.addWorker',
              defaultMessage: 'Add worker',
            })}
            data-testid="workers-empty-add-worker-dropdown-btn"
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
        }
      />
    );
  }

  const workerCountText = totalCount
    ? intl.formatMessage(
        { id: 'workers.list.header.count' },
        { count: totalCount },
      )
    : intl.formatMessage({ id: 'workers.list.header.title' });

  // Render table body content based on state
  const renderTableBody = () => {
    // Loading state
    if (loading) {
      return (
        <LoadingRow>
          <Table.Cell colSpan={4}>
            <EmptyStateContainer>
              <Activity shape="dots" size="large" />
              {intl.formatMessage({ id: 'workers.list.loading' })}
            </EmptyStateContainer>
          </Table.Cell>
        </LoadingRow>
      );
    }

    // Workers data
    return workers.map((worker) => {
      const getWorkerTypeKey = (type: TimeTracking_TimeForType) => {
        switch (type) {
          case TimeTracking_TimeForType.Vendor:
            return 'workers.filter.vendor';
          case TimeTracking_TimeForType.LegacyQboUser:
            return 'workers.type.user';
          case TimeTracking_TimeForType.Employee:
          default:
            return 'workers.type.employee';
        }
      };
      const workerTypeKey = getWorkerTypeKey(worker.type);
      const isGroupLead =
        worker.managesGroups && worker.managesGroups.length > 0;

      // Check if worker is a QBO user (disable view settings for QBO users)
      const isQboUser = worker.type === TimeTracking_TimeForType.LegacyQboUser;

      return (
        <Table.Row
          key={worker.id}
          onClick={!isQboUser ? () => onViewSettings(worker) : undefined}
          style={{ cursor: isQboUser ? 'default' : 'pointer' }}
        >
          <WorkerNameCell>
            <WorkerInfoContainer>
              <WorkerName>{worker.displayName}</WorkerName>
              {isGroupLead && (
                <WorkerRoleText>
                  {intl.formatMessage({ id: 'workers.role.groupLead' })}
                </WorkerRoleText>
              )}
            </WorkerInfoContainer>
          </WorkerNameCell>
          <WorkerTypeAndGroupCell>
            {intl.formatMessage({ id: workerTypeKey })}
          </WorkerTypeAndGroupCell>
          <WorkerTypeAndGroupCell>
            {worker.memberOfGroup?.name || '-'}
          </WorkerTypeAndGroupCell>
          <ActionsCell>
            <ActionsContainer>
              <span>
                <StyledLink
                  href="#"
                  onClick={() => onViewSettings(worker)}
                  aria-disabled={isQboUser}
                  $isDisabled={isQboUser}
                >
                  {intl.formatMessage({
                    id: 'workers.actions.viewSettings',
                  })}
                </StyledLink>
              </span>
            </ActionsContainer>
          </ActionsCell>
        </Table.Row>
      );
    });
  };

  return (
    <StyledTable
      divider="horizontal"
      responsive="elevate"
      hover="row"
      summary="Workers list table"
      density="roomy"
      data-testid="workers-list-table"
    >
      <Table.Header>
        <Table.Row>
          <Table.Cell>
            <span>{workerCountText}</span>
          </Table.Cell>
          <Table.Cell>
            {intl.formatMessage({ id: 'workers.list.header.type' })}
          </Table.Cell>
          <Table.Cell>
            {intl.formatMessage({ id: 'workers.list.header.group' })}
          </Table.Cell>
          <Table.Cell>
            {intl.formatMessage({ id: 'workers.list.header.actions' })}
          </Table.Cell>
        </Table.Row>
      </Table.Header>
      <Table.Body>{renderTableBody()}</Table.Body>
    </StyledTable>
  );
};

export default WorkersTable;

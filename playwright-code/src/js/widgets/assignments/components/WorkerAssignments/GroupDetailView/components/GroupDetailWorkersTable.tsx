import React, { useCallback } from 'react';
import { Activity } from '@ids-ts/loader';
import { Table } from '@ids-ts/table';
import PageMessage from '@ids-ts/page-message';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import { WORKER_ASSIGNMENTS_TRACKING_POINTS } from 'src/js/widgets/assignments/utils/assignmentsTrackingPoints';
import {
  StyledTable,
  WorkerInfoContainer,
  WorkerName,
  WorkerTypeText,
  ActionsContainer,
  TableCellWithPadding,
  TableCellRightAligned,
  EmptyStateCell,
  LoadingRow,
  EmptyStateContainer,
  StyledLink,
} from 'src/js/widgets/assignments/components/WorkerAssignments/GroupDetailView/styles/GroupDetailView.styled';
import { WorkerType } from 'src/js/widgets/assignments/components/WorkerAssignments/SearchFilterBar/types';
import {
  getWorkersEmptyStateTitle,
  navigateToWorkerSettings,
} from 'src/js/widgets/assignments/utils/helpers';
import { useAppSelector } from 'src/js/widgets/assignments/store/hooks';
import {
  selectGroupDetailViewError,
  selectGroupDetailViewGroupId,
  selectGroupDetailViewGroupName,
} from 'src/js/widgets/assignments/store/workersGroupViewSlice';
import {
  AssignmentsMainTabs,
  WorkersEmptyStateContext,
  WorkersTabViews,
} from 'src/js/widgets/assignments/types';
import TabPersistence from 'src/js/widgets/assignments/utils/tabPersistence';

interface Worker {
  id: string;
  displayName: string;
  type: string;
  isGroupLead?: boolean;
}

interface GroupDetailWorkersTableProps {
  workers: Worker[];
  isLoading: boolean;
  searchText: string;
  filterType: WorkerType;
  totalCount?: number;
}

/**
 * GroupDetailWorkersTable Component
 * Displays the workers table with actions
 */
export const GroupDetailWorkersTable: React.FC<
  GroupDetailWorkersTableProps
> = ({ workers, isLoading, searchText, filterType, totalCount }) => {
  const intl = useIntl();
  const sandbox = useSandbox();
  const track = useTracking();
  const error = useAppSelector(selectGroupDetailViewError);
  const currentGroupId = useAppSelector(selectGroupDetailViewGroupId);
  const currentGroupName = useAppSelector(selectGroupDetailViewGroupName);

  const handleViewSettings = useCallback(
    (worker: Worker) => {
      track(WORKER_ASSIGNMENTS_TRACKING_POINTS.VIEW_SETTINGS_LINK);
      track(WORKER_ASSIGNMENTS_TRACKING_POINTS.VIEW_TIME_WORKER_PROFILE);

      // Save tab selection, view preference & group detail state to web storage for persistence
      // To be used when user navigates back from the user settings page.
      TabPersistence.setMainTab(sandbox, AssignmentsMainTabs.WORKERS);
      TabPersistence.setWorkersView(sandbox, WorkersTabViews.GROUPS);
      if (currentGroupId && currentGroupName) {
        TabPersistence.setGroupDetail(
          sandbox,
          currentGroupId,
          currentGroupName,
        );
      }

      navigateToWorkerSettings(worker, sandbox, 'GroupDetailWorkersTable');
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentGroupId, currentGroupName],
  );

  // Show error state (full replacement)
  if (error && !isLoading) {
    return (
      <PageMessage
        type="error"
        title={intl.formatMessage({
          id: 'groups.detail.error.title',
          defaultMessage: 'Error loading workers',
        })}
        open
      >
        {error}
      </PageMessage>
    );
  }

  // Render table body content based on state
  const renderTableBody = () => {
    // Loading state
    if (isLoading) {
      return (
        <LoadingRow>
          <Table.Cell colSpan={3}>
            <EmptyStateContainer>
              <Activity shape="dots" size="large" />
              {intl.formatMessage({
                id: 'groups.detail.loading',
                defaultMessage: 'Loading workers...',
              })}
            </EmptyStateContainer>
          </Table.Cell>
        </LoadingRow>
      );
    }

    // Empty state
    if (workers.length === 0) {
      return (
        <Table.Row>
          <EmptyStateCell colSpan={3}>
            {getWorkersEmptyStateTitle(
              WorkersEmptyStateContext.GROUP_DETAIL,
              searchText,
              filterType,
              intl,
            )}
          </EmptyStateCell>
        </Table.Row>
      );
    }

    // Workers data
    return workers.map((worker) => {
      // Check if worker is a QBO user (disable view settings for QBO users)
      const isQboUser = worker.type === WorkerType.LEGACY_QBO_USER;

      return (
        <Table.Row
          key={worker.id}
          onClick={!isQboUser ? () => handleViewSettings(worker) : undefined}
          style={{ cursor: isQboUser ? 'default' : 'pointer' }}
        >
          <TableCellWithPadding>
            <WorkerInfoContainer>
              <WorkerName>{worker.displayName}</WorkerName>
              <WorkerTypeText>
                {(() => {
                  if (worker.isGroupLead) {
                    return intl.formatMessage({
                      id: 'groups.detail.groupLead',
                      defaultMessage: 'Group lead',
                    });
                  }
                  if (worker.type === WorkerType.EMPLOYEE) {
                    return intl.formatMessage({
                      id: 'workers.type.employee',
                      defaultMessage: 'Employee',
                    });
                  }
                  if (worker.type === WorkerType.LEGACY_QBO_USER) {
                    return intl.formatMessage({
                      id: 'workers.type.user',
                      defaultMessage: 'User',
                    });
                  }
                  return intl.formatMessage({
                    id: 'workers.filter.vendor',
                    defaultMessage: 'Vendor',
                  });
                })()}
              </WorkerTypeText>
            </WorkerInfoContainer>
          </TableCellWithPadding>
          <TableCellWithPadding>
            {(() => {
              if (worker.type === WorkerType.EMPLOYEE) {
                return intl.formatMessage({
                  id: 'workers.type.employee',
                  defaultMessage: 'Employee',
                });
              }
              if (worker.type === WorkerType.LEGACY_QBO_USER) {
                return intl.formatMessage({
                  id: 'workers.type.user',
                  defaultMessage: 'User',
                });
              }
              return intl.formatMessage({
                id: 'workers.filter.vendor',
                defaultMessage: 'Vendor',
              });
            })()}
          </TableCellWithPadding>
          <TableCellRightAligned>
            <ActionsContainer>
              <StyledLink
                href="#"
                onClick={() => handleViewSettings(worker)}
                aria-disabled={isQboUser}
                $isDisabled={isQboUser}
              >
                {intl.formatMessage({
                  id: 'workers.actions.viewSettings',
                  defaultMessage: 'View settings',
                })}
              </StyledLink>
            </ActionsContainer>
          </TableCellRightAligned>
        </Table.Row>
      );
    });
  };

  return (
    <StyledTable
      divider="horizontal"
      responsive="elevate"
      hover="row"
      summary="Group workers table"
      density="roomy"
      data-testid="group-detail-workers-table"
    >
      <Table.Header>
        <Table.Row>
          <Table.Cell>
            {intl.formatMessage(
              {
                id: 'groups.detail.workerColumn',
                defaultMessage: 'Worker ({count})',
              },
              { count: totalCount ?? workers.length },
            )}
          </Table.Cell>
          <Table.Cell>
            {intl.formatMessage({
              id: 'groups.detail.typeColumn',
              defaultMessage: 'Type',
            })}
          </Table.Cell>
          <Table.Cell>
            {intl.formatMessage({
              id: 'groups.detail.actionsColumn',
              defaultMessage: 'Actions',
            })}
          </Table.Cell>
        </Table.Row>
      </Table.Header>
      <Table.Body>{renderTableBody()}</Table.Body>
    </StyledTable>
  );
};

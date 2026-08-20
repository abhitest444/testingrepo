import React, { useCallback } from 'react';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import { Table } from '@ids-ts/table';
import { TimeTracking_TimeForType } from 'src/__generated__/timeTracking/graphql';
import {
  WorkerTypeText,
  ActionsContainer,
  WorkerCell,
  WorkerNameContainer,
  WorkerName,
  StyledLink,
} from 'src/js/widgets/assignments/components/styles/WorkersTableByGroupsView.styled';
import type { Worker } from 'src/js/widgets/assignments/store/workersGroupViewSlice';
import { navigateToWorkerSettings } from 'src/js/widgets/assignments/utils/helpers';
import { WORKER_ASSIGNMENTS_TRACKING_POINTS } from 'src/js/widgets/assignments/utils/assignmentsTrackingPoints';
import TabPersistence from 'src/js/widgets/assignments/utils/tabPersistence';
import {
  AssignmentsMainTabs,
  WorkersTabViews,
} from 'src/js/widgets/assignments/types';

interface WorkerRowProps {
  worker: Worker;
}

/**
 * WorkerRow - Renders a single worker/member row with actions
 * Workers are always indented one level below their group
 * Memoized to prevent unnecessary re-renders during virtualization
 */
const WorkerRowComponent: React.FC<WorkerRowProps> = ({ worker }) => {
  const intl = useIntl();
  const sandbox = useSandbox();
  const track = useTracking();

  // Determine worker type key based on role
  const getWorkerTypeKey = (role: TimeTracking_TimeForType) => {
    switch (role) {
      case TimeTracking_TimeForType.Vendor:
        return 'workers.filter.vendor';
      case TimeTracking_TimeForType.LegacyQboUser:
        return 'workers.type.user';
      case TimeTracking_TimeForType.Employee:
      default:
        return 'workers.type.employee';
    }
  };
  const workerTypeKey = getWorkerTypeKey(
    (worker.role as TimeTracking_TimeForType) ||
      TimeTracking_TimeForType.Employee,
  );

  const handleViewSettings = useCallback(() => {
    track(WORKER_ASSIGNMENTS_TRACKING_POINTS.VIEW_SETTINGS_LINK);
    track(WORKER_ASSIGNMENTS_TRACKING_POINTS.VIEW_TIME_WORKER_PROFILE);

    // Save tab selection, view preference to web storage for persistence
    // To be used when user navigates back from the user settings page.
    TabPersistence.setMainTab(sandbox, AssignmentsMainTabs.WORKERS);
    TabPersistence.setWorkersView(sandbox, WorkersTabViews.WORKERS);

    navigateToWorkerSettings(worker, sandbox, 'WorkerRow');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worker]);

  // Handle empty names gracefully - show fallback message from i18n
  const displayName =
    worker.name || intl.formatMessage({ id: 'workers.noName' });

  // Check if worker is a QBO user (disable view settings for QBO users)
  const isQboUser =
    (worker.role as TimeTracking_TimeForType) ===
    TimeTracking_TimeForType.LegacyQboUser;

  return (
    <Table.Row key={worker.id}>
      <WorkerCell>
        <WorkerNameContainer>
          <WorkerName>{displayName}</WorkerName>
          <WorkerTypeText>
            {intl.formatMessage({ id: workerTypeKey })}
          </WorkerTypeText>
        </WorkerNameContainer>
      </WorkerCell>
      <Table.Cell></Table.Cell>
      <Table.Cell>
        <ActionsContainer>
          <StyledLink
            href="#"
            onClick={isQboUser ? (e) => e.preventDefault() : handleViewSettings}
            data-testid={`action-link-${worker.id}`}
            aria-disabled={isQboUser}
            $isDisabled={isQboUser}
          >
            {intl.formatMessage({ id: 'workers.actions.viewSettings' })}
          </StyledLink>
        </ActionsContainer>
      </Table.Cell>
    </Table.Row>
  );
};
// Memoize to prevent unnecessary re-renders during virtualization
export const WorkerRow = React.memo(WorkerRowComponent);

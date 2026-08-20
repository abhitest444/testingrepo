import React, { useCallback } from 'react';
import { Table } from '@ids-ts/table';
import { B3 } from '@ids-ts/typography';
import Badge from '@ids-ts/badge';
import ComboLink, { MenuItem } from '@ids-ts/combo-link';
import { useIntl, useTracking } from '@payroll/quicksand';
import { TimeProjectRow as TimeProjectRowType } from '../types';
import { useAppSelector } from '../store';
import { useProjectsSdkFlags } from '../hooks/useProjectsSdkFlags';
import {
  STATUS_BADGE_MAP,
  PROJECT_ACTIONS,
  canAssignWorkersToProject,
} from '../constants';
import { useLandingPageTrackingPoints } from '../hooks/useLandingPageTrackingPoints';
import {
  ProjectCell,
  CustomerNameText,
  DeadlineCell,
  DaysLeftText,
  BudgetCell,
  BudgetRemainingText,
  BadgeWrapper,
  StatusCell,
  ActionsContainer,
  ActionLinkButton,
  RowSkeletonBar,
} from './TimeProjectTable.styled';

interface TimeProjectRowProps {
  row: TimeProjectRowType;
  onRowClick?: (row: TimeProjectRowType) => void;
  onAssignWorkers: (row: TimeProjectRowType) => void;
  onCreateEstimate: (row: TimeProjectRowType) => void;
  onEditEstimate: (row: TimeProjectRowType) => void;
}

const TimeProjectRow: React.FC<TimeProjectRowProps> = ({
  row,
  onRowClick,
  onAssignWorkers,
  onCreateEstimate,
  onEditEstimate,
}) => {
  const intl = useIntl();
  const track = useTracking();
  const {
    isProjectsManageProjectsEnabled,
    isProjectsEditEstimatesEnabled,
    isProjectsAssignWorkersEnabled,
  } = useProjectsSdkFlags();
  const text = (id: string, values?: Record<string, any>) =>
    intl.formatMessage({ id }, values);
  const trackingPoints = useLandingPageTrackingPoints();

  const estimate = useAppSelector(
    (state) => state.projects.estimatesMap[row.projectId],
  );
  // Page-level + estimates-level loading flags. We use BOTH together
  // because they're set asynchronously across the project-list →
  // contacts → estimates pipeline:
  //   - `loading` covers the work-projects fetch + the contacts
  //     follow-up (set by `useTimeProjectsFetching`).
  //   - `estimatesLoading` covers the per-project estimates fan-out
  //     (set by `useProjectEstimates`).
  // Either being true means the cell's true value isn't known yet.
  const pageLoading = useAppSelector((state) => state.ui.loading);
  const estimatesLoading = useAppSelector(
    (state) => state.projects.estimatesLoading,
  );
  const budgetTotal = estimate?.budgetHoursTotal ?? row.budgetHoursTotal;
  const budgetRemaining =
    estimate?.budgetHoursRemaining ?? row.budgetHoursRemaining;
  // While the estimates pipeline is still in flight, render a
  // shimmering skeleton in the budget AND actions cells instead of
  // the eager "—" / "Create estimate" affordance the row would
  // otherwise show. Without this, every row briefly displays the
  // create-estimate CTA before flipping to "View / Edit" once the
  // estimate response lands — that flash misled users into clicking
  // Create on a project that already had an estimate. We only show
  // the skeleton when this row's estimate is genuinely missing
  // (`estimate === undefined`); a row whose estimate has already
  // resolved keeps showing real values across subsequent refetches
  // so the table doesn't flash on every save.
  const isEstimatePending =
    estimate === undefined && (estimatesLoading || pageLoading);

  const badgeConfig = STATUS_BADGE_MAP[row.status];
  const badgeLabel = text(badgeConfig.nlsKey);
  // What counts as a "real" estimate for the budget column / primary
  // action: anything that ISN'T the supergraph's "-1" unestimated
  // sentinel. An estimate of exactly 0 hours IS a real estimate per
  // product and must render as "0h" — only `-1` collapses to "—" +
  // "Create estimate".
  //
  // For BY_FIELD_OPTION (service-item) projects the mapper in
  // `useProjectEstimates` already synthesizes a non-negative
  // `budgetHoursTotal` from the items whenever items are configured,
  // so we don't need a separate `estimateItems`-aware guard here —
  // a service-item project with one or more items will always land
  // with `budgetTotal !== -1`, even if every item is 0 hours.
  const isUnestimated = budgetTotal === -1;
  const hasBudget = !isUnestimated;
  // CANCELLED / COMPLETED projects are read-only for assignments —
  // the row drops the "Assign workers" menu item AND the primary
  // click handler refuses to open the drawer if it's somehow still
  // invoked. Single source of truth lives in `canAssignWorkersToProject`
  // (see constants.ts) so the listing, summary, and parent click
  // path stay in lockstep.
  const canAssign = canAssignWorkersToProject(row.status);
  const canEditEstimates = isProjectsEditEstimatesEnabled === true;
  const canAssignWorkers = canAssign && isProjectsAssignWorkersEnabled === true;
  const shouldShowCreateEstimate = !hasBudget && canEditEstimates;
  const primaryLabel = shouldShowCreateEstimate
    ? text('timeProject.action.createEstimate')
    : text('timeProject.action.view');

  const formatDeadline = (deadline: string): string => {
    if (!deadline) return '—';
    // Deadline strings come in as `YYYY-MM-DD` from
    // `dataAccessWorkProjects.node.dueDate` — no time, no timezone.
    // Reformat as `M/D/YYYY` without involving timezones (which were
    // previously the source of silent empty-cell bugs when the
    // company tz string wasn't in our IANA-mapping table).
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(deadline);
    if (!match) return deadline;
    const [, y, m, d] = match;
    return `${parseInt(m, 10)}/${parseInt(d, 10)}/${y}`;
  };

  const getDaysLeft = (deadline: string): string => {
    if (!deadline) return '';
    // Pure calendar-day math against today's local date — no timezone
    // parsing required. Both sides are reduced to UTC midnight of the
    // YYYY-MM-DD they represent and diffed in milliseconds. This was
    // previously routed through `dayjs.tz(...)` which silently threw
    // (and emptied the cell) when the company timezone string wasn't
    // in our IANA mapping; the diff itself only ever needed
    // calendar-day resolution, so the timezone hop wasn't doing
    // anything.
    const deadlineMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(deadline);
    if (!deadlineMatch) return '';
    const [, y, m, d] = deadlineMatch;
    const endUtc = Date.UTC(
      parseInt(y, 10),
      parseInt(m, 10) - 1,
      parseInt(d, 10),
    );
    const now = new Date();
    const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const raw = Math.round((endUtc - todayUtc) / MS_PER_DAY);

    // Singular vs plural strings: ICU MessageFormat plurals would
    // be ideal but the existing NLS file is flat substitution, so
    // we route through dedicated singular keys when |count| === 1.
    if (raw > 0) {
      if (raw === 1) return text('timeProject.deadline.oneDayLeft');
      return text('timeProject.deadline.daysLeft', { count: raw });
    }
    if (raw === 0) return text('timeProject.deadline.dueToday');
    const overdue = Math.abs(raw);
    if (overdue === 1) return text('timeProject.deadline.oneDayOverdue');
    return text('timeProject.deadline.daysOverdue', { count: overdue });
  };

  // Three-way render for the budget cell: pending → skeleton, has
  // budget → real values, no budget → em-dash. Extracted to avoid
  // a triple-nested ternary in the JSX.
  const renderBudgetCell = () => {
    if (isEstimatePending) {
      return (
        <RowSkeletonBar
          $width="90px"
          data-testid={`budget-skeleton-${row.projectId}`}
        />
      );
    }
    if (!hasBudget) {
      return <B3>—</B3>;
    }
    return (
      <BudgetCell>
        <B3 weight="demi">
          {text('timeProject.budget.hours', { count: budgetTotal })}
        </B3>
        <BudgetRemainingText>
          <B3>
            {budgetRemaining < 0
              ? text('timeProject.budget.overdue', {
                  count: Math.abs(budgetRemaining),
                })
              : text('timeProject.budget.remaining', {
                  count: budgetRemaining,
                })}
          </B3>
        </BudgetRemainingText>
      </BudgetCell>
    );
  };

  const handleRowOpen = useCallback(() => {
    track(trackingPoints.CLICK_PROJECTS_LANDING_PAGE);
    onRowClick?.(row);
  }, [onRowClick, row, track, trackingPoints]);

  const handlePrimaryAction = useCallback(() => {
    if (shouldShowCreateEstimate) {
      track(trackingPoints.CLICK_CREATE_ESTIMATE_LANDING_PAGE);
      onCreateEstimate(row);
    } else {
      handleRowOpen();
    }
  }, [
    shouldShowCreateEstimate,
    handleRowOpen,
    onCreateEstimate,
    row,
    track,
    trackingPoints,
  ]);

  const handleRowClickWrapper = useCallback(() => {
    handleRowOpen();
  }, [handleRowOpen]);

  // Stop click propagation on the actions cell so clicking the combo link
  // (or any item in its menu) doesn't also fire the row-level "open
  // details" handler.
  const stopRowClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.stopPropagation();
    },
    [],
  );

  const handleMenuSelect = useCallback(
    (event: any) => {
      const value = (event?.target as any)?.value;
      if (!value) return;
      if (value === PROJECT_ACTIONS.ASSIGN_WORKERS) {
        // Defensive — we already hide the menu item for non-assignable
        // statuses, but a stale event (e.g. dispatched after the row
        // re-renders into a Cancelled state) shouldn't be allowed to
        // open the drawer.
        if (!canAssignWorkers) return;
        track(trackingPoints.SELECT_ASSIGN_WORKERS_PROJECT_DROPDOWN);
        onAssignWorkers(row);
      } else if (value === PROJECT_ACTIONS.EDIT) {
        if (hasBudget && canEditEstimates) {
          track(trackingPoints.CLICK_VIEW_PROJECT_LANDING_PAGE);
          onEditEstimate(row);
        } else if (!hasBudget && canEditEstimates) {
          track(trackingPoints.SELECT_EDIT_PROJECT_DROPDOWN);
          onCreateEstimate(row);
        }
      } else if (value === PROJECT_ACTIONS.CREATE_ESTIMATE) {
        if (!canEditEstimates) return;
        track(trackingPoints.CLICK_CREATE_ESTIMATE_LANDING_PAGE);
        onCreateEstimate(row);
      }
    },
    [
      canAssignWorkers,
      canEditEstimates,
      hasBudget,
      onAssignWorkers,
      onCreateEstimate,
      onEditEstimate,
      row,
      track,
      trackingPoints,
    ],
  );

  const actionMenuItems = [
    ...(canAssignWorkers
      ? [
          <MenuItem key="assign" value={PROJECT_ACTIONS.ASSIGN_WORKERS}>
            {text('timeProject.action.assignWorkers')}
          </MenuItem>,
        ]
      : []),
    ...(hasBudget && canEditEstimates
      ? [
          <MenuItem key="edit" value={PROJECT_ACTIONS.EDIT}>
            {text('timeProject.action.edit')}
          </MenuItem>,
        ]
      : []),
  ];
  const hasActionMenuItems = actionMenuItems.length > 0;

  const renderActionsCellContent = () => {
    if (isEstimatePending) {
      return (
        <RowSkeletonBar
          $width="120px"
          data-testid={`actions-skeleton-${row.projectId}`}
        />
      );
    }

    if (hasActionMenuItems) {
      return (
        <ComboLink
          label={primaryLabel}
          size="mini"
          onClick={handlePrimaryAction}
          onSelect={handleMenuSelect}
          data-testid={`action-combo-link-${row.projectId}`}
        >
          {actionMenuItems}
        </ComboLink>
      );
    }

    return (
      <ActionLinkButton
        onClick={handlePrimaryAction}
        data-testid={`action-primary-button-${row.projectId}`}
      >
        {primaryLabel}
      </ActionLinkButton>
    );
  };

  // Every row is clickable - even projects without an estimate. Clicking a
  // no-estimate row opens the details page where ProjectSummary shows a
  // dedicated zero-state card with a "Create estimate" CTA, instead of
  // dead-ending the user on the list.
  return (
    <Table.Row
      data-testid={`time-project-row-${row.projectId}`}
      onClick={handleRowClickWrapper}
      style={{ cursor: 'pointer' }}
    >
      <Table.Cell>
        <ProjectCell>
          <B3 weight="demi">{row.projectName}</B3>
          {isProjectsManageProjectsEnabled === true && (
            <CustomerNameText>
              <B3>{row.customerName || '—'}</B3>
            </CustomerNameText>
          )}
        </ProjectCell>
      </Table.Cell>
      <Table.Cell>
        <StatusCell>
          <BadgeWrapper $bgColor={badgeConfig.bgColor}>
            <Badge status={badgeConfig.status} aria-label={badgeLabel}>
              {badgeLabel}
            </Badge>
          </BadgeWrapper>
        </StatusCell>
      </Table.Cell>
      <Table.Cell>
        <DeadlineCell>
          <B3 weight="demi">{formatDeadline(row.deadline)}</B3>
          {row.deadline && (
            <DaysLeftText>
              <B3>{getDaysLeft(row.deadline)}</B3>
            </DaysLeftText>
          )}
        </DeadlineCell>
      </Table.Cell>
      <Table.Cell>{renderBudgetCell()}</Table.Cell>
      <Table.Cell>
        <ActionsContainer onClick={stopRowClick}>
          {renderActionsCellContent()}
        </ActionsContainer>
      </Table.Cell>
    </Table.Row>
  );
};

export default TimeProjectRow;

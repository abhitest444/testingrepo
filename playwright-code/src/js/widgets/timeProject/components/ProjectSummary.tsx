import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { H5, B2, B3 } from '@ids-ts/typography';
import Badge from '@ids-ts/badge';
import Button from '@ids-ts/button';
import { IconControl } from '@ids-ts/icon-control';
import { Tab, Tabs } from '@ids-ts/tabs';
import Toggle from '@qbds/toggle';
import { MeterBarChart } from '@accounting-core/templado-asset-libary';
import { PersonThree } from '@design-systems/icons';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';
import { TimeProjectRow } from '../types';
import { useAppSelector } from '../store';
import { useAssignmentSummary } from '../hooks/useAssignmentSummary';
import { useWorkerTimeSummary } from '../hooks/useWorkerTimeSummary';
import { useProjectsSdkFlags } from '../hooks/useProjectsSdkFlags';
import {
  STATUS_BADGE_MAP,
  SUMMARY_SEGMENTS,
  PROJECT_TABS,
  buildQboProjectDetailsRoute,
  buildQboCustomerDetailsRoute,
  canAssignWorkersToProject,
} from '../constants';
import {
  SummaryContainer,
  BackLink,
  SummaryHeader,
  HeaderLeft,
  HeaderRight,
  MetaRow,
  MetaCustomerName,
  MetaCustomerNameLink,
  MetaDivider,
  SummaryTabContainer,
  SectionHeader,
  SummaryBoxesRow,
  SummaryBox,
  SummaryBoxTitle,
  SummaryBoxValue,
  SummaryBoxSubtext,
  SummaryBoxRow,
  MeterBarWrapper,
  EditLink,
  DateProgressRow,
  AlignRight,
  ToggleContainer,
  AssignmentChipsRow,
  ZeroStateContainer,
  ZeroStateTitle,
  ZeroStateDescription,
} from './ProjectSummary.styled';
import { BadgeWrapper } from './TimeProjectTable.styled';
import { useDetailsPageTrackingPoints } from '../hooks/useDetailsPageTrackingPoints';
import { usePostsTrackingPoints } from '../hooks/usePostsTrackingPoints';
import { useUnreadPostsCount } from '../hooks/useUnreadPostsCount';
import { useCurrentWorker } from '../hooks/useCurrentWorker';
import ServiceItemTable from './ServiceItemTable';
import ServiceItemWorkersView from './ServiceItemWorkersView';
import WorkerTable from './WorkerTable';
import HoursEstimateTable from './HoursEstimateTable';
import PostsFeed from './posts/PostsFeed';

interface ProjectSummaryProps {
  project: TimeProjectRow;
  workerId?: string | null;
  onBack: () => void;
  onAssignWorkers: (project: TimeProjectRow) => void;
  onEditEstimate: (project: TimeProjectRow) => void;
  onCreateEstimate: (project: TimeProjectRow) => void;
  /**
   * Increments whenever a parent-side mutation (currently: a successful
   * save in the Assign Workers drawer) needs the chip-summary call to
   * re-run with fresh data. Treated as a "refresh nonce" - when it ticks
   * up, we re-fetch the assignment summary bypassing all caches.
   */
  assignmentRefreshKey?: number;
  /**
   * Whether the Posts tab is enabled (SBSEG-QBO-SHOW-PROJECT-POST IXP
   * flag). Evaluated once on the main Time Projects screen and passed
   * down so the flag isn't re-evaluated on every project summary open.
   */
  isProjectPostsEnabled?: boolean;
}

const HOURS_BAR_COLOR = '#00B797';
const HOURS_BAR_REMAINING = '#00B7974D';
const DATE_BAR_COLOR = '#205EA3';
const DATE_BAR_REMAINING = '#205EA34D';
const OVERDUE_COLOR = '#E56C1D';
const POSITIVE_COLOR = '#2CA01C';
// Used for the "not started" placeholder meter when a card has no
// underlying data yet (no estimate / no project dates). A full-width
// neutral-grey segment keeps the card's visual rhythm intact instead of
// collapsing the bar to nothing.
const NOT_STARTED_BAR_COLOR = '#D4D7DC';

const ProjectSummary: React.FC<ProjectSummaryProps> = ({
  project,
  workerId,
  onBack,
  onAssignWorkers,
  onEditEstimate,
  onCreateEstimate,
  assignmentRefreshKey = 0,
  isProjectPostsEnabled = false,
}) => {
  const intl = useIntl();
  const track = useTracking();
  const sandbox = useSandbox();
  const trackingPoints = useDetailsPageTrackingPoints();
  const postsTrackingPoints = usePostsTrackingPoints();
  const isWorkforceUser = isWorkforceEnvironment(sandbox);
  const {
    isProjectsManageProjectsEnabled,
    isProjectsAssignWorkersEnabled,
    isProjectsEditEstimatesEnabled,
    isProjectsEditDateEnabled,
  } = useProjectsSdkFlags();
  // Company timezone for post timestamp formatting (set by useCompanyTimezone
  // upstream; falls back to '' until resolved).
  const qbTimezone = useAppSelector((state) => state.settings.qboTimezone);
  const text = useCallback(
    (id: string, values?: Record<string, any>) =>
      intl.formatMessage({ id }, values),
    [intl],
  );

  // Pluralisation helper — returns the singular NLS key when count is
  // 1, the plural key (with substituted count) otherwise. The NLS file
  // is flat substitution rather than ICU MessageFormat, so we maintain
  // dedicated `oneX` keys per unit and route through them here. Caller
  // passes the *plural* and *singular* key ids; the count itself is
  // always non-negative (callers `Math.abs` overdue diffs upstream).
  const textPlural = (
    pluralId: string,
    singularId: string,
    count: number,
  ): string => (count === 1 ? text(singularId) : text(pluralId, { count }));

  const [activeSegment, setActiveSegment] = useState<string>(
    SUMMARY_SEGMENTS.ESTIMATES,
  );

  // Active top-level tab (Summary vs Posts). Posts only renders when the
  // IXP flag is on; the tab strip below guards on `isProjectPostsEnabled`.
  const [activeTab, setActiveTab] = useState<string>(PROJECT_TABS.SUMMARY);

  const handleTabChange = useCallback(
    (tabId: string) => {
      if (tabId === PROJECT_TABS.POSTS) {
        track(postsTrackingPoints.CLICK_POSTS_TAB);
      }
      setActiveTab(tabId);
    },
    [track, postsTrackingPoints],
  );

  const [activeServiceItem, setActiveServiceItem] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const estimate = useAppSelector(
    (state) => state.projects.estimatesMap[project.projectId],
  );
  // Canonical (projectId, customerId) tuple resolved by the OIGQL
  // contacts lookup. Falls back to the row's inline `customerId`
  // until the contacts call resolves — see ProjectWorkerAssignmentDrawer
  // for the same pattern.
  const customerIdFromRefs = useAppSelector(
    (state) => state.projects.projectRefs[project.projectId]?.customerId,
  );
  const effectiveCustomerId = customerIdFromRefs || project.customerId;

  // Resolve the current worker for the unread-count query. The shell
  // passes `workerId` as a prop but the unread-count API needs it non-null.
  const { workerId: currentWorkerId } = useCurrentWorker(workerId);

  const { fetchUnreadCount } = useUnreadPostsCount();
  const unreadCount = useAppSelector((state) => state.postsUi.unreadCount);
  const {
    counts: assignmentCounts,
    loading: assignmentLoading,
    error: assignmentError,
    fetchAssignmentSummary,
  } = useAssignmentSummary();

  const {
    workers: usersWorkers,
    loading: usersWorkersLoading,
    page: usersWorkersPage,
    totalPages: usersWorkersTotalPages,
    fetchWorkerSummary: fetchUsersWorkerSummary,
    goToNextPage: usersWorkersNextPage,
    goToPrevPage: usersWorkersPrevPage,
  } = useWorkerTimeSummary(workerId);

  useEffect(() => {
    // The hook always hits the network (no caching), so a single call is
    // enough on mount or whenever the customer or `assignmentRefreshKey`
    // changes (e.g. after the assignment drawer saves). Uses the
    // contacts-resolved customer id when available (see comment on
    // `effectiveCustomerId` above).
    fetchAssignmentSummary(effectiveCustomerId);
  }, [fetchAssignmentSummary, effectiveCustomerId, assignmentRefreshKey]);

  useEffect(() => {
    if (!isProjectPostsEnabled || !currentWorkerId) return;
    fetchUnreadCount(project.projectId, effectiveCustomerId, currentWorkerId);
  }, [
    isProjectPostsEnabled,
    fetchUnreadCount,
    project.projectId,
    effectiveCustomerId,
    currentWorkerId,
  ]);

  const isServiceItemEstimate =
    estimate?.projectEstimateType === 'BY_FIELD_OPTION';

  // The estimates query can return an entry for projects that have NO real
  // estimate yet (the supergraph reports `totalEstimatedSeconds: -1` /
  // `budgetHoursTotal: -1` after `useProjectEstimates` preserves the
  // sentinel). For UI purposes we treat those as "no estimate" so the
  // user sees the zero-state CTA instead of an empty Time Estimation
  // Summary header + date card with no actual estimate to edit.
  // Important: an estimate of exactly 0 hours IS a real estimate per
  // product, so this guard checks for the `-1` sentinel specifically
  // and not for `<= 0`.
  const hasRealEstimate = useMemo(() => {
    if (!estimate) return false;
    if (isServiceItemEstimate) {
      return (estimate.estimateItems?.length ?? 0) > 0;
    }
    return (estimate.budgetHoursTotal ?? -1) !== -1;
  }, [estimate, isServiceItemEstimate]);

  useEffect(() => {
    // Fire whenever the Users tab is the active segment - regardless of
    // whether the project has an estimate. This is the same fetch we use
    // for the hours-estimate "View workers" path, so toggling to Users
    // from the zero-state behaves identically (project-scoped query, no
    // serviceItem filter). Also re-runs when `assignmentRefreshKey`
    // bumps (after a successful assign-workers save) so the worker list
    // stays in sync with the chip counts.
    if (activeSegment === SUMMARY_SEGMENTS.USERS) {
      fetchUsersWorkerSummary({
        projectId: project.projectId,
        customerId: effectiveCustomerId,
      });
    }
  }, [
    activeSegment,
    fetchUsersWorkerSummary,
    project.projectId,
    effectiveCustomerId,
    assignmentRefreshKey,
  ]);

  const badgeConfig = STATUS_BADGE_MAP[project.status];
  const badgeLabel = text(badgeConfig.nlsKey);

  const chipLabel = (
    assigned: number,
    total: number,
    nlsKey: string,
  ): string => {
    if (!assignmentCounts) return '';
    return text(nlsKey, { count: assigned, total });
  };

  const actualHours = estimate
    ? Math.round((estimate.elapsedSeconds / 3600) * 100) / 100
    : 0;
  const estimatedHours = estimate?.budgetHoursTotal ?? 0;
  const remainingHours = estimate?.budgetHoursRemaining ?? 0;
  // Per product:
  //   - Actual hours (`projectElapsedSeconds`) are ALWAYS a real
  //     value and render as the real number (including `0.00`). They
  //     never collapse to a dash, even when the project has no
  //     estimate — a project with 12h logged against an unset
  //     estimate must still surface "12 hrs" so the user sees their
  //     actual time.
  //   - Estimated hours render as "—" ONLY when the supergraph
  //     reports the `totalEstimatedSeconds: -1` "unestimated"
  //     sentinel (preserved through `useProjectEstimates` as
  //     `budgetHoursTotal: -1`). An estimate of exactly 0 hours IS
  //     a real value and renders as "0".
  //   - The remaining/overdue subtext is suppressed in two cases:
  //     1. The project is unestimated (`-1`) — there's nothing to
  //        be "remaining of" or "over budget against".
  //     2. The estimate is exactly `0` AND nothing has been logged —
  //        "0 hrs remaining" against a 0-hour estimate reads as a
  //        misleading positive signal.
  //     The orange "X hrs over budget" path still fires for
  //     `estimate = 0` / `worked > 0` because that IS meaningful.
  const isUnestimatedProject = estimatedHours === -1;
  const showEstimatedAsDash = isUnestimatedProject;
  const isHoursOverdue = !isUnestimatedProject && remainingHours < 0;
  const showRemainingSubtext =
    !isUnestimatedProject && (estimatedHours > 0 || isHoursOverdue);
  const HOURS_DASH = '—';

  // Both summary cards always render now - even with no estimate or no
  // project dates. We surface zeros / em-dashes in those cases instead of
  // collapsing the layout, so:
  //  - the page doesn't flash a different shape during a refetch, and
  //  - the user always sees "Actual vs estimated hours" + "Date progress"
  //    framing with a clear next step ("Create estimate") when empty.
  const hasStartDate = Boolean(project.startDate);
  const hasEndDate = Boolean(project.deadline);
  const hasProjectDates = hasStartDate && hasEndDate;

  const dateProgress = useMemo(() => {
    if (!hasProjectDates) return { elapsed: 0, remaining: 0, total: 0 };
    // Pure calendar-day math against today's local date — no
    // timezone parsing required. Both inputs come in as `YYYY-MM-DD`
    // strings from `dataAccessWorkProjects`, so we reduce them to
    // UTC midnight of that calendar day and diff in milliseconds.
    // The previous implementation routed through `dayjs.tz(...)`,
    // which silently threw (and zeroed the meter) whenever the
    // company timezone string wasn't in our IANA-mapping table.
    const parseAsUtcDay = (input: string): number | null => {
      const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(input);
      if (!m) return null;
      return Date.UTC(
        parseInt(m[1], 10),
        parseInt(m[2], 10) - 1,
        parseInt(m[3], 10),
      );
    };
    const startMs = parseAsUtcDay(project.startDate);
    const endMs = parseAsUtcDay(project.deadline);
    if (startMs === null || endMs === null) {
      return { elapsed: 0, remaining: 0, total: 0 };
    }
    const todayLocal = new Date();
    const todayMs = Date.UTC(
      todayLocal.getFullYear(),
      todayLocal.getMonth(),
      todayLocal.getDate(),
    );
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const total = Math.round((endMs - startMs) / MS_PER_DAY);
    const rawElapsed = Math.round((todayMs - startMs) / MS_PER_DAY);
    const rawRemaining = Math.round((endMs - todayMs) / MS_PER_DAY);
    // Match the convention used by the row's "X days left" label
    // (don't count today for remaining; DO count today for overdue):
    // - Project hasn't started: full duration ahead, nothing elapsed.
    // - In progress with deadline still ahead (rawRemaining > 0):
    //   remaining = rawRemaining - 1, elapsed fills the rest.
    // - Today IS the deadline (rawRemaining == 0): treat as 1 day
    //   overdue so the subtext switches to "1 day overdue", not "0 days
    //   remaining".
    // - Past the deadline (rawRemaining < 0): use rawRemaining directly
    //   so the magnitude equals (today - deadline).
    let elapsed: number;
    let remaining: number;
    if (rawElapsed < 0) {
      elapsed = 0;
      remaining = total;
    } else if (rawRemaining > 0) {
      const adjusted = rawRemaining - 1;
      remaining = adjusted > total ? total : adjusted;
      elapsed = Math.min(Math.max(total - remaining, 0), total);
    } else if (rawRemaining === 0) {
      remaining = -1;
      elapsed = total;
    } else {
      remaining = rawRemaining;
      elapsed = total;
    }
    return {
      elapsed,
      remaining,
      total: Math.max(1, total),
    };
  }, [project.startDate, project.deadline, hasProjectDates]);

  const isDaysOverdue = dateProgress.remaining < 0;
  // Mirror the hours card's `showRemainingSubtext`: the date card's
  // green/orange days-remaining (or days-overdue) chip only renders
  // when the project actually has both dates AND the remaining count
  // is meaningful (a positive remaining bucket OR an overdue
  // project). Without this guard, projects without dates would show
  // a misleading "0 days remaining" chip.
  const showRemainingDaysSubtext =
    hasProjectDates && (dateProgress.remaining > 0 || isDaysOverdue);

  const formatDate = useCallback((dateStr: string) => {
    if (!dateStr) return '—';
    // Date strings come in as `YYYY-MM-DD` from
    // `dataAccessWorkProjects`. Reformat as `M/D/YY` without
    // involving timezones — the same fix applied to the listing
    // row's `formatDeadline`. Two-digit year per the existing
    // visual treatment on the date card.
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
    if (!m) return dateStr;
    const [, y, mm, dd] = m;
    return `${parseInt(mm, 10)}/${parseInt(dd, 10)}/${y.slice(2)}`;
  }, []);

  // Assignment isn't a valid action on Cancelled / Completed projects —
  // single source of truth in `canAssignWorkersToProject` (see
  // constants.ts) so this stays in lockstep with the listing combo
  // link and the parent click handler. The button is hidden entirely
  // when `canAssign` is false; this guard is a defensive backstop in
  // case a stale event still triggers `handleAssign`.
  const canAssign = canAssignWorkersToProject(project.status);
  const canAssignFromHeader =
    canAssign && isProjectsAssignWorkersEnabled === true;
  const handleAssign = useCallback(() => {
    if (!canAssignFromHeader) return;
    track(trackingPoints.CLICK_ASSIGN);
    onAssignWorkers(project);
  }, [canAssignFromHeader, onAssignWorkers, project, track, trackingPoints]);

  const handleCreateEstimate = useCallback(() => {
    track(trackingPoints.CREATE_ESTIMATE);
    onCreateEstimate(project);
  }, [onCreateEstimate, project, track, trackingPoints]);

  const handleEditFromCard = useCallback(() => {
    track(trackingPoints.EDIT_ESTIMATION_SUMMARY);
    onEditEstimate(project);
  }, [onEditEstimate, project, track, trackingPoints]);

  const handleEditEstimateClick = useCallback(() => {
    track(trackingPoints.SELECT_EDIT_ESTIMATE_DROPDOWN);
    onEditEstimate(project);
  }, [onEditEstimate, project, track, trackingPoints]);

  const renderHoursCardActionLink = () => {
    if (isProjectsEditEstimatesEnabled !== true) {
      return null;
    }

    if (hasRealEstimate) {
      return (
        <EditLink data-testid="summary-edit-link" onClick={handleEditFromCard}>
          <B3>{text('timeProject.action.edit')}</B3>
        </EditLink>
      );
    }

    // No estimate yet: keep the card visible (with zero values) but
    // surface a "Create estimate" link in place of the Edit link so
    // the card itself becomes the entry point instead of an empty
    // placeholder.
    return (
      <EditLink
        data-testid="summary-create-estimate-link"
        onClick={handleCreateEstimate}
      >
        <B3>{text('timeProject.summary.zeroState.createEstimate')}</B3>
      </EditLink>
    );
  };

  // The date editor lives on the QBO project details page (this widget
  // only reads dates today). The link in the date card deep-links there
  // via the host's navigation API so the URL gets the right env-specific
  // QBO host (`qbo.intuit.com` in prod, `e2e.qbo.intuit.com` in e2e, ...).
  const handleEditDates = useCallback(() => {
    track(trackingPoints.EDIT_PROJECT_DATES);
    sandbox.navigation.navigate(buildQboProjectDetailsRoute(project.projectId));
  }, [project.projectId, sandbox, track, trackingPoints]);

  // The customer / job a project belongs to lives on a QBO surface, so
  // clicking the customer name in the meta row deep-links over the same
  // way the date-edit link does. Guarded on `customerId` because not
  // every project row has one (legacy / orphaned projects render the
  // name as a plain non-interactive label below).
  const handleCustomerNameClick = useCallback(() => {
    if (!project.customerId) return;
    track(trackingPoints.CUSTOMER_NAME);
    sandbox.navigation.navigate(
      buildQboCustomerDetailsRoute(project.customerId),
    );
  }, [project.customerId, sandbox, track, trackingPoints]);

  const hoursBarSegments = useMemo(() => {
    // No estimate yet -> render a full-width neutral-grey bar so the card
    // shows a "not started" state instead of an empty space below the
    // numbers. Same treatment for the date bar below.
    if (estimatedHours <= 0) {
      return [{ value: 100, color: NOT_STARTED_BAR_COLOR }];
    }
    if (isHoursOverdue) {
      return [{ value: 100, color: OVERDUE_COLOR }];
    }
    const filledPct = (actualHours / estimatedHours) * 100;
    return [
      { value: filledPct, color: HOURS_BAR_COLOR },
      { value: 100 - filledPct, color: HOURS_BAR_REMAINING },
    ];
  }, [actualHours, estimatedHours, isHoursOverdue]);

  const dateBarSegments = useMemo(() => {
    if (dateProgress.total <= 0) {
      return [{ value: 100, color: NOT_STARTED_BAR_COLOR }];
    }
    if (isDaysOverdue) {
      return [{ value: 100, color: OVERDUE_COLOR }];
    }
    const elapsedClamped = Math.min(dateProgress.elapsed, dateProgress.total);
    const filledPct = (elapsedClamped / dateProgress.total) * 100;
    return [
      { value: filledPct, color: DATE_BAR_COLOR },
      { value: 100 - filledPct, color: DATE_BAR_REMAINING },
    ];
  }, [dateProgress, isDaysOverdue]);

  const toggleOptions = useMemo(
    () => [
      {
        label: text('timeProject.summary.segmentEstimates'),
        value: SUMMARY_SEGMENTS.ESTIMATES,
      },
      {
        label: text('timeProject.summary.segmentUsers'),
        value: SUMMARY_SEGMENTS.USERS,
      },
    ],
    [text],
  );

  const handleToggleChange = useCallback(
    (value: string) => {
      if (value === SUMMARY_SEGMENTS.ESTIMATES) {
        track(trackingPoints.CLICK_ESTIMATES_TAB);
      } else if (value === SUMMARY_SEGMENTS.USERS) {
        track(trackingPoints.CLICK_USER_TAB);
      }
      setActiveSegment(value);
    },
    [track, trackingPoints],
  );

  const handleViewServiceItemWorkers = useCallback(
    (serviceItemId: string, serviceItemName: string) => {
      setActiveServiceItem({ id: serviceItemId, name: serviceItemName });
    },
    [],
  );

  // For "By hours" estimates, "View workers" lives inline in the same page
  // and just flips the toggle to the Users tab (which already lists every
  // worker against the project). Service-item estimates keep their
  // dedicated drill-down page (`activeServiceItem`).
  const handleViewWorkersFromHours = useCallback(() => {
    track(trackingPoints.CLICK_USER_TAB);
    setActiveSegment(SUMMARY_SEGMENTS.USERS);
  }, [track, trackingPoints]);

  const handleBackFromServiceItemWorkers = useCallback(() => {
    setActiveServiceItem(null);
  }, []);

  // Pre-compute the body of the Estimates tab so the JSX below stays a flat
  // single conditional. Three mutually exclusive states:
  //   1. Real service-item estimate -> ServiceItemTable
  //   2. Real "by hours" estimate   -> HoursEstimateTable
  //   3. No estimate yet            -> ZeroState CTA (Estimates tab only,
  //      Users tab still shows the worker table even when there's no estimate)
  let estimateTabContent: React.ReactNode;
  if (hasRealEstimate && estimate) {
    estimateTabContent = isServiceItemEstimate ? (
      <ServiceItemTable
        estimate={estimate}
        onViewWorkers={handleViewServiceItemWorkers}
      />
    ) : (
      <HoursEstimateTable
        estimate={estimate}
        onViewWorkers={handleViewWorkersFromHours}
      />
    );
  } else {
    estimateTabContent = (
      <ZeroStateContainer data-testid="project-summary-zero-state">
        <ZeroStateTitle>
          <H5 weight="demi">{text('timeProject.summary.zeroState.title')}</H5>
        </ZeroStateTitle>
        <ZeroStateDescription>
          <B3>{text('timeProject.summary.zeroState.description')}</B3>
        </ZeroStateDescription>
        {isProjectsEditEstimatesEnabled === true && (
          <Button
            priority="primary"
            purpose="standard"
            onClick={handleCreateEstimate}
            data-testid="project-summary-create-estimate-btn"
          >
            {text('timeProject.summary.zeroState.createEstimate')}
          </Button>
        )}
      </ZeroStateContainer>
    );
  }

  if (activeServiceItem) {
    return (
      <SummaryContainer data-testid="project-summary">
        <ServiceItemWorkersView
          projectId={project.projectId}
          customerId={effectiveCustomerId}
          workerId={workerId}
          serviceItemId={activeServiceItem.id}
          serviceItemName={activeServiceItem.name}
          onBack={handleBackFromServiceItemWorkers}
        />
      </SummaryContainer>
    );
  }

  return (
    <SummaryContainer data-testid="project-summary">
      <BackLink
        onClick={onBack}
        data-testid="project-summary-back"
        aria-label={text('timeProject.summary.backToProjects')}
      >
        ← {text('timeProject.summary.backToProjects')}
      </BackLink>

      <SummaryHeader>
        <HeaderLeft>
          <H5 weight="demi" data-testid="project-summary-title">
            {project.projectName}
          </H5>
        </HeaderLeft>
        <HeaderRight>
          {canAssignFromHeader && (
            <Button
              priority="secondary"
              purpose="standard"
              onClick={handleAssign}
              data-testid="project-summary-assign-btn"
            >
              {text('timeProject.summary.assign')}
            </Button>
          )}
          {hasRealEstimate && isProjectsEditEstimatesEnabled === true && (
            <Button
              priority="primary"
              purpose="standard"
              onClick={handleEditEstimateClick}
              aria-label={text('timeProject.summary.editEstimate')}
              data-testid="project-summary-edit-estimate-btn"
            >
              {text('timeProject.summary.editEstimate')}
            </Button>
          )}
          {!hasRealEstimate && isProjectsEditEstimatesEnabled === true && (
            // No estimate yet: keep the primary action slot occupied next
            // to "Assign" - it just becomes the create entry point so the
            // header is visually balanced regardless of estimate state.
            <Button
              priority="primary"
              purpose="standard"
              onClick={handleCreateEstimate}
              aria-label={text('timeProject.summary.zeroState.createEstimate')}
              data-testid="project-summary-create-estimate-header-btn"
            >
              {text('timeProject.summary.zeroState.createEstimate')}
            </Button>
          )}
        </HeaderRight>
      </SummaryHeader>

      <MetaRow>
        {isProjectsManageProjectsEnabled === true &&
          (project.customerName && project.customerId && !isWorkforceUser ? (
            <MetaCustomerNameLink
              type="button"
              onClick={handleCustomerNameClick}
              data-testid="project-summary-customer-link"
            >
              <B3>{project.customerName}</B3>
            </MetaCustomerNameLink>
          ) : (
            <MetaCustomerName data-testid="project-summary-customer">
              <B3>{project.customerName || '—'}</B3>
            </MetaCustomerName>
          ))}
        {isProjectsManageProjectsEnabled === true && <MetaDivider />}
        <BadgeWrapper $bgColor={badgeConfig.bgColor}>
          <Badge status={badgeConfig.status} aria-label={badgeLabel}>
            {badgeLabel}
          </Badge>
        </BadgeWrapper>
        {!assignmentError &&
          (assignmentLoading ||
            (assignmentCounts &&
              (assignmentCounts.assignedTimeForCount ?? 0) > 0)) && (
            <>
              <MetaDivider />
              <AssignmentChipsRow data-testid="assignment-chips-row">
                <IconControl
                  label={chipLabel(
                    assignmentCounts?.assignedTimeForCount ?? 0,
                    assignmentCounts?.totalTimeForAssignments ?? 0,
                    'timeProject.summary.assignmentChip.workers',
                  )}
                  labelAlignment="right"
                  size="small"
                  aria-label={intl.formatMessage(
                    { id: 'timeProject.summary.assignmentChip.ariaLabel' },
                    {
                      count: assignmentCounts?.assignedTimeForCount ?? 0,
                      total: assignmentCounts?.totalTimeForAssignments ?? 0,
                    },
                  )}
                  onClick={handleAssign}
                  disabled={!canAssignFromHeader || assignmentLoading}
                  data-testid="assignment-chip-workers"
                >
                  <PersonThree aria-hidden="true" />
                </IconControl>
              </AssignmentChipsRow>
            </>
          )}
      </MetaRow>

      <SummaryTabContainer>
        <Tabs
          selected={activeTab}
          onChange={handleTabChange}
          isHorizontalRuleVisible
        >
          <Tab
            id={PROJECT_TABS.SUMMARY}
            title={text('timeProject.summary.tab.summary')}
          >
            <div />
          </Tab>
          {isProjectPostsEnabled ? (
            <Tab
              id={PROJECT_TABS.POSTS}
              title={text('timeProject.summary.tab.posts')}
              badge={
                (unreadCount > 0 && (
                  <Badge status="pending" data-testid="posts-unread-badge">
                    {unreadCount}
                  </Badge>
                )) ||
                undefined
              }
            >
              <div />
            </Tab>
          ) : null}
        </Tabs>
      </SummaryTabContainer>

      {activeTab === PROJECT_TABS.SUMMARY && (
        <>
          <SectionHeader>
            <B3 weight="demi">
              {text('timeProject.summary.timeEstimationSummary')}
            </B3>
          </SectionHeader>
          <SummaryBoxesRow>
            <SummaryBox data-testid="summary-box-hours">
              <SummaryBoxTitle>
                <B3 weight="demi">
                  {text('timeProject.summary.actualVsEstimated')}
                </B3>
              </SummaryBoxTitle>
              <SummaryBoxValue>
                <H5 weight="demi" data-testid="summary-hours-actual-value">
                  {actualHours === 1
                    ? text('timeProject.summary.oneHour')
                    : text('timeProject.summary.hours', {
                        count: actualHours.toFixed(2),
                      })}
                </H5>
              </SummaryBoxValue>
              {showRemainingSubtext ? (
                <SummaryBoxSubtext
                  $isOverdue={isHoursOverdue}
                  data-testid="summary-hours-remaining"
                >
                  <B3>
                    {isHoursOverdue
                      ? textPlural(
                          'timeProject.summary.hoursOverdue',
                          'timeProject.summary.oneHourOverdue',
                          Math.abs(remainingHours),
                        )
                      : textPlural(
                          'timeProject.summary.hoursRemaining',
                          'timeProject.summary.oneHourRemaining',
                          remainingHours,
                        )}
                  </B3>
                </SummaryBoxSubtext>
              ) : (
                // Invisible spacer keeps the hours card the same total
                // height as the date card so they stay aligned in
                // `SummaryBoxesRow`. Renders the same B3 line with a
                // non-breaking space so its line-box matches the visible
                // variant exactly.
                <SummaryBoxSubtext
                  $invisible
                  aria-hidden="true"
                  data-testid="summary-hours-remaining-spacer"
                >
                  <B3>{'\u00A0'}</B3>
                </SummaryBoxSubtext>
              )}
              <SummaryBoxRow>
                <div>
                  <B3>{text('timeProject.summary.actual')}</B3>
                  <br />
                  <B2 weight="demi" data-testid="summary-hours-actual-row">
                    {textPlural(
                      'timeProject.summary.hours',
                      'timeProject.summary.oneHour',
                      actualHours,
                    )}
                  </B2>
                </div>
                <AlignRight>
                  <B3>{text('timeProject.summary.estimated')}</B3>
                  <br />
                  <B2 weight="demi" data-testid="summary-hours-estimated-row">
                    {showEstimatedAsDash
                      ? HOURS_DASH
                      : textPlural(
                          'timeProject.summary.hours',
                          'timeProject.summary.oneHour',
                          estimatedHours,
                        )}
                  </B2>
                </AlignRight>
              </SummaryBoxRow>
              <MeterBarWrapper data-testid="hours-meter-bar">
                <MeterBarChart segmentProps={hoursBarSegments} />
              </MeterBarWrapper>
              {renderHoursCardActionLink()}
            </SummaryBox>

            <SummaryBox data-testid="summary-box-date">
              <SummaryBoxTitle>
                <B3 weight="demi">
                  {text('timeProject.summary.dateProgress')}
                </B3>
              </SummaryBoxTitle>
              <SummaryBoxValue>
                <H5 weight="demi">
                  {textPlural(
                    'timeProject.summary.days',
                    'timeProject.summary.oneDay',
                    dateProgress.elapsed,
                  )}
                </H5>
              </SummaryBoxValue>
              {/* Days-remaining / days-overdue subtext, mirroring the
              hours card's green/orange treatment. Render condition
              parallels `showRemainingSubtext` on the hours side:
              the project has both a start AND an end date AND the
              remaining number is meaningful (positive remaining or
              an overdue project). When the slot is empty we keep an
              invisible spacer so the date and hours cards stay the
              same height. */}
              {showRemainingDaysSubtext && (
                <SummaryBoxSubtext
                  $isOverdue={isDaysOverdue}
                  data-testid="summary-days-remaining"
                >
                  <B3>
                    {isDaysOverdue
                      ? textPlural(
                          'timeProject.summary.daysOverdue',
                          'timeProject.summary.oneDayOverdue',
                          Math.abs(dateProgress.remaining),
                        )
                      : textPlural(
                          'timeProject.summary.daysRemaining',
                          'timeProject.summary.oneDayRemaining',
                          dateProgress.remaining,
                        )}
                  </B3>
                </SummaryBoxSubtext>
              )}
              {!showRemainingDaysSubtext && (
                // Invisible spacer keeps the date card the same total
                // height as the hours card so they stay aligned in
                // `SummaryBoxesRow`.
                <SummaryBoxSubtext
                  $invisible
                  aria-hidden="true"
                  data-testid="summary-days-remaining-spacer"
                >
                  <B3>{'\u00A0'}</B3>
                </SummaryBoxSubtext>
              )}
              <DateProgressRow>
                <div>
                  <B3>{text('timeProject.summary.startDate')}</B3>
                  <br />
                  <B2 weight="demi">
                    {hasStartDate ? formatDate(project.startDate) : '—'}
                  </B2>
                </div>
                <AlignRight>
                  <B3>{text('timeProject.summary.endDate')}</B3>
                  <br />
                  <B2 weight="demi">
                    {hasEndDate ? formatDate(project.deadline) : '—'}
                  </B2>
                </AlignRight>
              </DateProgressRow>
              <MeterBarWrapper data-testid="date-meter-bar">
                <MeterBarChart segmentProps={dateBarSegments} />
              </MeterBarWrapper>
              {/* Mirror the hours-card pattern: surface a single inline link
              that switches between "Edit dates" (when at least one date
              is set) and "Add dates" (when both are empty). Both deep-link
              into the QBO project details page where the actual date
              editor lives. */}
              {isProjectsEditDateEnabled === true && (
                <EditLink
                  data-testid={
                    hasStartDate || hasEndDate
                      ? 'summary-edit-dates-link'
                      : 'summary-add-dates-link'
                  }
                  onClick={handleEditDates}
                >
                  <B3>
                    {text(
                      hasStartDate || hasEndDate
                        ? 'timeProject.summary.editDates'
                        : 'timeProject.summary.addDates',
                    )}
                  </B3>
                </EditLink>
              )}
            </SummaryBox>
          </SummaryBoxesRow>

          <ToggleContainer data-testid="project-summary-segment">
            <Toggle
              groupLabel={text('timeProject.summary.segmentEstimates')}
              options={toggleOptions}
              defaultValue={SUMMARY_SEGMENTS.ESTIMATES}
              overrideValue={activeSegment}
              variant="label-only"
              size="standard"
              onChange={handleToggleChange}
            />
          </ToggleContainer>

          {activeSegment === SUMMARY_SEGMENTS.ESTIMATES && estimateTabContent}
          {activeSegment === SUMMARY_SEGMENTS.USERS && (
            <WorkerTable
              workers={usersWorkers}
              loading={usersWorkersLoading}
              page={usersWorkersPage}
              totalPages={usersWorkersTotalPages}
              onNextPage={usersWorkersNextPage}
              onPrevPage={usersWorkersPrevPage}
            />
          )}
        </>
      )}

      {activeTab === PROJECT_TABS.POSTS && isProjectPostsEnabled && (
        // Reply threads, the New post composer and IDX attachments land in
        // follow-up stories. This story renders the read-only feed of
        // top-level posts (cards + pagination); the empty/zero state is
        // shown by PostsFeed only when no posts are found.
        <div data-testid="project-posts-tab">
          <PostsFeed
            projectId={project.projectId}
            customerId={effectiveCustomerId}
            workerId={workerId}
            qbTimezone={qbTimezone}
          />
        </div>
      )}
    </SummaryContainer>
  );
};

export default ProjectSummary;

import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { B3, H5 } from '@ids-ts/typography';
import { Activity } from '@ids-ts/loader';
import { useIntl, useSandbox } from '@payroll/quicksand';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';
import { FEATURE_FLAGS } from 'src/js/common/constants';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';
import TimeProjectHeader from './components/TimeProjectHeader';
import TimeProjectFilters from './components/TimeProjectFilters';
import TimeProjectTable from './components/TimeProjectTable';
import TimeProjectPagination from './components/TimeProjectPagination';
import ProjectSummary from './components/ProjectSummary';
import ProjectWorkerAssignmentDrawer from './components/ProjectWorkerAssignmentDrawer';
import CreateEstimateDrawer from './components/CreateEstimateDrawer';
import TimeProjectTour from './components/TimeProjectTour';
import { useTimeProjectsFetching } from './hooks/useTimeProjectsFetching';
import { useFetchProjectById } from './hooks/useFetchProjectById';
import { useCompanyTimezone } from './hooks/useCompanyTimezone';
import { ProjectsSdkFlagsProvider } from './hooks/useProjectsSdkFlags';
import { useAppDispatch, useAppSelector } from './store';
import {
  openEstimateDrawer,
  closeEstimateDrawer,
} from './store/estimateDrawerSlice';
import { resetFilters } from './store/filtersSlice';
import { TimeProjectRow } from './types';
import { ProjectNameSearchResult } from './hooks/useProjectNameSearch';
import { extractQboLocalId } from './utils/projectIdUtils';
import {
  logNavigationEvent,
  useTimeProjectLogger,
} from './utils/timeProjectLogging';
import {
  TIME_PROJECT_LOGGING_CONSTANTS,
  canAssignWorkersToProject,
} from './constants';

const Container = styled.div`
  padding: 0 24px;
`;

const LoaderContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 64px 0;
`;

// Page-level error block used in place of the projects table when
// either the project list or the project-estimates fetch fails. Title
// + body match the IDS error pattern used elsewhere in the app: a
// single H5 heading with a B3 body line below.
const PageErrorContainer = styled.div`
  padding: 64px 24px;
  text-align: center;
  color: #393a3d;
`;

const PageErrorTitle = styled.div`
  margin-bottom: 8px;
`;

const PageErrorBody = styled.div`
  color: #6b6c72;
`;

const ToolbarRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 0 16px;
  gap: 12px;
`;

interface TimeProjectProps {
  workerId?: string | null;
}

const TimeProjectContent: React.FC<TimeProjectProps> = ({ workerId }) => {
  const intl = useIntl();
  const text = (id: string) => intl.formatMessage({ id });
  const logger = useTimeProjectLogger();
  const sandbox = useSandbox();
  const isWorkforceUser = isWorkforceEnvironment(sandbox);

  // We intentionally don't pull `settingsError` here — see the
  // `showLoadError` comment below.
  const { settingsReady, settingsLoading } = useCompanyTimezone();

  // Posts tab is gated behind the SBSEG-QBO-SHOW-PROJECT-POST IXP flag
  // AND disabled entirely for Workforce web users.
  const { isEnabled: isProjectPostsIxpEnabled } = useIXPFeatureFlag({
    flagName: FEATURE_FLAGS.SBSEG_QBO_SHOW_PROJECT_POST,
  });
  const isProjectPostsEnabled = isProjectPostsIxpEnabled && !isWorkforceUser;
  const {
    rows,
    pagination,
    loading,
    loadingMore,
    error,
    filters,
    isAccountant,
    isWorkflowApiEnabled,
    handlePageChange,
    handleStatusChange,
    handleCustomerChange,
    handleSearchChange,
    handleFilterByProjectIds,
    handleSortChange,
    handleDueDateChange,
    refetchProjects,
  } = useTimeProjectsFetching({ enabled: settingsReady });

  const { fetchProjectById } = useFetchProjectById({ isAccountant });

  const isLoading = settingsLoading || loading;
  // Surface the generic "something went wrong" UI ONLY when the
  // projects API itself fails. Company settings has graceful fallbacks
  // (see `useCompanyTimezone` — on failure it flips `settingsReady=true`
  // with empty timezone defaults, and downstream date helpers fall back
  // to the browser zone), so a settings failure shouldn't block the
  // user from seeing their projects list. We still log/track
  // `settingsError` upstream in `useCompanyTimezone`; this guard just
  // controls the user-visible error surface.
  const showLoadError = !!error;
  // Estimates fetch failures get a dedicated, more descriptive
  // message. Projects list error wins if both happened (it's the
  // "we don't even know which projects to show" failure mode and is
  // strictly more disruptive than missing estimates).
  const estimatesError = useAppSelector(
    (state) => state.projects.estimatesError,
  );
  const showEstimatesError = !showLoadError && !!estimatesError;

  const dispatch = useAppDispatch();
  const {
    drawerOpen: estimateDrawerOpen,
    drawerProject: activeEstimateProject,
    isEdit: isEditEstimate,
  } = useAppSelector((state) => state.estimateDrawer);

  const [selectedProject, setSelectedProject] = useState<TimeProjectRow | null>(
    null,
  );
  const [isFetchingProject, setIsFetchingProject] = useState(false);
  const [fetchProjectFailed, setFetchProjectFailed] = useState(false);
  const [activeAssignmentProject, setActiveAssignmentProject] =
    useState<TimeProjectRow | null>(null);
  // Bumped after a successful assignment-drawer save so `ProjectSummary`
  // re-runs its assignment-summary query and the chips show fresh counts.
  const [assignmentRefreshKey, setAssignmentRefreshKey] = useState(0);

  // Anchors for the Time Projects walkthrough. The shared GuidedTooltip
  // (built on @ids-ts/guided-tour-tooltip) reads `step.targetRef.current`,
  // so we expose RefObjects rather than state. We still need a render to
  // re-fire once the underlying DOM node is set, which the tour child
  // accomplishes via its own rAF-based readiness check.
  const manageProjectsAnchorRef = useRef<HTMLElement | null>(null);
  const estimateDrawerAnchorRef = useRef<HTMLElement | null>(null);
  // Bumped whenever an anchor's underlying DOM node changes — `TimeProjectTour`
  // depends on this to re-evaluate readiness for the GuidedTooltip steps,
  // since refs alone don't trigger React re-renders.
  const [anchorVersion, setAnchorVersion] = useState(0);

  const setManageProjectsAnchor = useCallback((node: HTMLElement | null) => {
    manageProjectsAnchorRef.current = node;
    setAnchorVersion((v) => v + 1);
  }, []);
  const setEstimateDrawerAnchor = useCallback((node: HTMLElement | null) => {
    estimateDrawerAnchorRef.current = node;
    setAnchorVersion((v) => v + 1);
  }, []);

  // Tracks whether the currently-open estimate drawer was opened by the
  // tour (vs a normal user click). When true, dismissing the drawer
  // shouldn't re-show the tour, but it also means the drawer should
  // remain open for the user to keep interacting after the tour ends.
  const tourTriggeredDrawerRef = useRef(false);

  // Reset filters when the user navigates away from the Time Projects tab
  // so the search bar starts empty on the next visit. This intentionally
  // fires only on true unmount (tab switch) and NOT when the user drills
  // into a ProjectSummary, because ProjectSummary is rendered inside this
  // same component — the parent never unmounts during that navigation.
  useEffect(
    () => () => {
      dispatch(resetFilters());
    },
    [dispatch],
  );

  // Page-view ping for unique-companies + page-load funnel.
  useEffect(() => {
    if (!settingsReady) return;
    logNavigationEvent(
      logger,
      TIME_PROJECT_LOGGING_CONSTANTS.NAVIGATION.PROJECT_LIST_VIEWED,
    );
  }, [settingsReady, logger]);

  const handleRowClick = useCallback(
    (row: TimeProjectRow) => {
      setSelectedProject(row);
      logNavigationEvent(
        logger,
        TIME_PROJECT_LOGGING_CONSTANTS.NAVIGATION.PROJECT_DETAILS_VIEWED,
        { projectId: row.projectId, customerId: row.customerId },
      );
    },
    [logger],
  );

  const handleBackToList = useCallback(() => {
    setSelectedProject(null);
  }, []);

  // When the Workflow API typeahead is active, clicking a search result
  // opens the in-widget ProjectSummary — the same behaviour as clicking
  // a row in the project table.
  // Fast path: project is already on the current page (rows).
  // Fallback: project is on a different page — fetch it directly from
  // the Workflow API using GET_WORKFLOW_PROJECT_BY_ID so we have a full
  // TimeProjectRow to pass to handleRowClick without requiring the user
  // to navigate to the right page first.
  const handleProjectSelect = useCallback(
    async (projectId: string) => {
      // projectId is a Workflow global ID (e.g. `djQuMTo5...:767680909`).
      // rows store the local numeric ID, so convert before comparing.
      const localId = extractQboLocalId(projectId) || projectId;
      const inPageRow = rows.find((r) => r.projectId === localId);
      if (inPageRow) {
        handleRowClick(inPageRow);
        return;
      }
      setIsFetchingProject(true);
      setFetchProjectFailed(false);
      try {
        const fetchedRow = await fetchProjectById(projectId);
        if (fetchedRow) {
          handleRowClick(fetchedRow);
        } else {
          setFetchProjectFailed(true);
        }
      } catch {
        setFetchProjectFailed(true);
      } finally {
        setIsFetchingProject(false);
      }
    },
    [rows, handleRowClick, fetchProjectById],
  );

  // Called when the user presses Enter in the workflow-API typeahead.
  // Mirrors projects-plugin's exact/multiple-match decision logic:
  // - single result whose name exactly matches → navigate to project detail
  // - multiple (or partial) matches → filter the list to those project IDs
  // - zero results → do nothing (typeahead already shows "no results")
  const handleSearchSubmit = useCallback(
    (searchText: string, searchResults: ProjectNameSearchResult[]) => {
      if (
        searchResults.length === 1 &&
        searchResults[0].displayName.toLowerCase() === searchText.toLowerCase()
      ) {
        // Pass the Workflow global ID directly — `handleProjectSelect`
        // converts it to a local ID for the in-page rows lookup and
        // passes it as-is to `fetchProjectById` for the `id=` filter.
        handleProjectSelect(searchResults[0].projectId);
      } else if (searchResults.length > 0) {
        handleFilterByProjectIds(
          searchResults.map((r) => r.projectId),
          searchText,
        );
      }
    },
    [handleProjectSelect, handleFilterByProjectIds],
  );

  const handleSearchClear = useCallback(() => {
    handleSearchChange('');
  }, [handleSearchChange]);

  const handleAssignWorkers = useCallback(
    (row: TimeProjectRow) => {
      // Page-level guard against opening the assignment drawer for a
      // Cancelled / Completed project. The listing combo-link and the
      // summary header both already hide the assign affordance for
      // these statuses; this is the load-bearing fallback that keeps
      // the rule enforced even if a stale event somehow reaches us
      // (e.g. a row was IN_PROGRESS at click time but flipped to
      // CANCELLED before the click handler resolved).
      if (!canAssignWorkersToProject(row.status)) {
        return;
      }
      setActiveAssignmentProject(row);
      logNavigationEvent(
        logger,
        TIME_PROJECT_LOGGING_CONSTANTS.NAVIGATION.ASSIGN_WORKERS_DRAWER_OPENED,
        { projectId: row.projectId },
      );
    },
    [logger],
  );

  const handleCreateEstimate = useCallback(
    (row: TimeProjectRow) => {
      // User-driven open: clear any leftover tour ownership so the
      // tour-completion handler doesn't later try to close THIS
      // drawer thinking it had opened it for the demo.
      tourTriggeredDrawerRef.current = false;
      dispatch(openEstimateDrawer({ project: row, isEdit: false }));
      logNavigationEvent(
        logger,
        TIME_PROJECT_LOGGING_CONSTANTS.NAVIGATION.ESTIMATE_DRAWER_OPENED,
        { projectId: row.projectId, mode: 'create' },
      );
    },
    [dispatch, logger],
  );

  const handleEditEstimate = useCallback(
    (row: TimeProjectRow) => {
      // See note in handleCreateEstimate — user-driven open wins
      // over any stale tour-triggered marker.
      tourTriggeredDrawerRef.current = false;
      dispatch(openEstimateDrawer({ project: row, isEdit: true }));
      logNavigationEvent(
        logger,
        TIME_PROJECT_LOGGING_CONSTANTS.NAVIGATION.ESTIMATE_DRAWER_OPENED,
        { projectId: row.projectId, mode: 'edit' },
      );
    },
    [dispatch, logger],
  );

  const handleCloseDrawer = useCallback(() => {
    setActiveAssignmentProject(null);
  }, []);

  const handleCloseEstimateDrawer = useCallback(() => {
    // Drawer is going away — drop the tour-ownership marker so a
    // subsequent user-driven reopen isn't mistaken for being part of
    // the tour. (The tour-completion path also picks up the closure
    // via TimeProjectTour's recovery effect and finishes itself.)
    tourTriggeredDrawerRef.current = false;
    dispatch(closeEstimateDrawer());
  }, [dispatch]);

  const handleAssignmentSuccess = useCallback(() => {
    setActiveAssignmentProject(null);
    setAssignmentRefreshKey((key) => key + 1);
    refetchProjects();
  }, [refetchProjects]);

  // Step 2 → step 3 bridge: open the create-estimate drawer for the
  // first project in the (filtered) list so the next tour step has
  // something to anchor onto. We deliberately use the same redux action
  // the row's "Create estimate" button dispatches so the drawer flow
  // stays identical to the user-driven path.
  const handleTourRequestOpenEstimateDrawer = useCallback(() => {
    const firstRow = rows[0];
    if (!firstRow) return;
    tourTriggeredDrawerRef.current = true;
    dispatch(openEstimateDrawer({ project: firstRow, isEdit: false }));
  }, [rows, dispatch]);

  const handleTourComplete = useCallback(() => {
    // The tour opened the drawer purely to demo the estimate flow.
    // Once the tour finishes (whether by the final "Got it" or by the
    // X on the last popover), tear that drawer back down so the user
    // lands cleanly back on the projects list and can pick which
    // project they actually want to estimate against.
    if (tourTriggeredDrawerRef.current) {
      dispatch(closeEstimateDrawer());
    }
    tourTriggeredDrawerRef.current = false;
  }, [dispatch]);

  const handleEstimateSuccess = useCallback(async () => {
    try {
      // Same pattern as the assign-workers handler: keep the create /
      // edit estimate drawer mounted (and its save spinner visible)
      // until the project list + per-project estimates have been
      // re-fetched, so the user never sees a stale summary card after
      // a successful save.
      await refetchProjects();
    } catch (error) {
      // The estimate mutation already succeeded server-side at this
      // point - only the post-save refresh failed. We must NOT bubble
      // this up as an unhandled rejection (which would surface a
      // generic "something went wrong" toast to the user even though
      // their save worked) and we must still close the drawer in
      // `finally` below so the user isn't stuck behind a permanent
      // saving spinner.
      //
      // Surface enough context for support / Splunk to triage (which
      // project, edit-vs-create, error name + message) but keep the
      // user-facing copy generic - the next list/summary view render
      // will re-attempt fetching and show its own error state if the
      // problem persists.
      logger.error(
        TIME_PROJECT_LOGGING_CONSTANTS.API_ERRORS
          .POST_ESTIMATE_SAVE_REFETCH_FAILURE,
        {
          projectId: activeEstimateProject?.projectId,
          isEdit: isEditEstimate,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorName: error instanceof Error ? error.name : undefined,
        },
      );
    } finally {
      // Save-driven close: clear the tour-ownership marker before we
      // dispatch so a future render doesn't see a stale `true` and
      // try to re-close a drawer the user may have already reopened.
      tourTriggeredDrawerRef.current = false;
      dispatch(closeEstimateDrawer());
    }
  }, [
    dispatch,
    refetchProjects,
    logger,
    activeEstimateProject,
    isEditEstimate,
  ]);

  if (selectedProject) {
    return (
      <Container>
        <ProjectSummary
          project={selectedProject}
          workerId={workerId}
          onBack={handleBackToList}
          onAssignWorkers={handleAssignWorkers}
          onEditEstimate={handleEditEstimate}
          onCreateEstimate={handleCreateEstimate}
          assignmentRefreshKey={assignmentRefreshKey}
          isProjectPostsEnabled={isProjectPostsEnabled}
        />
        {activeAssignmentProject && (
          <ProjectWorkerAssignmentDrawer
            project={activeAssignmentProject}
            onClose={handleCloseDrawer}
            onSuccess={handleAssignmentSuccess}
          />
        )}
        {estimateDrawerOpen && activeEstimateProject && (
          <CreateEstimateDrawer
            project={activeEstimateProject}
            onClose={handleCloseEstimateDrawer}
            onSuccess={handleEstimateSuccess}
            isEdit={isEditEstimate}
          />
        )}
      </Container>
    );
  }

  return (
    <Container>
      <ToolbarRow>
        {settingsReady && (
          <TimeProjectFilters
            statusFilter={filters.statusFilter}
            customerFilter={filters.customerFilter}
            searchText={filters.searchText}
            isWorkflowApiEnabled={isWorkflowApiEnabled}
            isAccountant={isAccountant}
            dueDateRange={filters.dueDateRange}
            onStatusChange={handleStatusChange}
            onCustomerChange={handleCustomerChange}
            onSearchChange={handleSearchChange}
            onProjectSelect={handleProjectSelect}
            onSearchSubmit={handleSearchSubmit}
            onSearchClear={handleSearchClear}
            onDueDateChange={handleDueDateChange}
          />
        )}
        <TimeProjectHeader manageProjectsButtonRef={setManageProjectsAnchor} />
      </ToolbarRow>
      {isLoading && (
        <LoaderContainer data-testid="time-project-loader">
          <Activity shape="dots" size="large" />
        </LoaderContainer>
      )}
      {isFetchingProject && !isLoading && (
        <LoaderContainer data-testid="time-project-search-loader">
          <Activity shape="dots" size="large" />
        </LoaderContainer>
      )}
      {fetchProjectFailed && !isFetchingProject && (
        <PageErrorContainer data-testid="time-project-search-error">
          <PageErrorTitle>
            <H5 weight="demi">{text('timeProject.error.title')}</H5>
          </PageErrorTitle>
          <PageErrorBody>
            <B3>{text('timeProject.error.loadFailed')}</B3>
          </PageErrorBody>
        </PageErrorContainer>
      )}
      {!isLoading && !isFetchingProject && showLoadError && (
        <PageErrorContainer data-testid="time-project-load-error">
          <PageErrorTitle>
            <H5 weight="demi">{text('timeProject.error.title')}</H5>
          </PageErrorTitle>
          <PageErrorBody>
            <B3>{text('timeProject.error.loadFailed')}</B3>
          </PageErrorBody>
        </PageErrorContainer>
      )}
      {!isLoading && !isFetchingProject && showEstimatesError && (
        // Distinct error state for a failed GetProjectEstimates call.
        // Replaces the table (rather than rendering rows with empty
        // budgets) because, per product, this is the page's
        // "we have projects but can't show usable budget data" mode
        // and warrants a clear retry-prompt instead of a half-broken
        // listing.
        <PageErrorContainer data-testid="time-project-estimates-error">
          <PageErrorTitle>
            <H5 weight="demi">{text('timeProject.error.title')}</H5>
          </PageErrorTitle>
          <PageErrorBody>
            <B3>{text('timeProject.error.estimatesLoadFailed')}</B3>
          </PageErrorBody>
        </PageErrorContainer>
      )}
      {!isLoading &&
        !isFetchingProject &&
        !showLoadError &&
        !showEstimatesError &&
        settingsReady && (
          <>
            {loadingMore ? (
              <LoaderContainer data-testid="time-project-page-loader">
                <Activity shape="dots" size="large" />
              </LoaderContainer>
            ) : (
              <TimeProjectTable
                onRowClick={handleRowClick}
                onAssignWorkers={handleAssignWorkers}
                onCreateEstimate={handleCreateEstimate}
                onEditEstimate={handleEditEstimate}
                sortOrder={filters.sortOrder}
                onSortChange={handleSortChange}
              />
            )}
            <TimeProjectPagination
              pagination={pagination}
              loadingMore={loadingMore}
              onPageChange={handlePageChange}
              isWorkflowApiEnabled={isWorkflowApiEnabled}
            />
          </>
        )}
      {activeAssignmentProject && (
        <ProjectWorkerAssignmentDrawer
          project={activeAssignmentProject}
          onClose={handleCloseDrawer}
          onSuccess={handleAssignmentSuccess}
        />
      )}
      {estimateDrawerOpen && activeEstimateProject && (
        <CreateEstimateDrawer
          project={activeEstimateProject}
          onClose={handleCloseEstimateDrawer}
          onSuccess={handleEstimateSuccess}
          isEdit={isEditEstimate}
          estimateTypeSectionRef={setEstimateDrawerAnchor}
        />
      )}
      {/* The walkthrough fires as soon as the page has finished its
          initial settle (settings + project list resolved without an
          error) — we do NOT gate on `rows.length` because the intro
          modal and "Manage projects" tooltip are still meaningful for
          a user with an empty list. The tour itself decides whether
          the third (estimate-drawer) step is reachable based on
          `hasProjects`. Workforce users are excluded because
          `TimeProjectHeader` returns null for them, so the
          "Manage projects" anchor never mounts and the tour would
          stall invisibly at that step. */}
      <TimeProjectTour
        enabled={
          !isLoading &&
          !showLoadError &&
          !showEstimatesError &&
          settingsReady &&
          !isWorkforceUser
        }
        hasProjects={rows.length > 0}
        anchorVersion={anchorVersion}
        manageProjectsAnchorRef={manageProjectsAnchorRef}
        estimateDrawerAnchorRef={estimateDrawerAnchorRef}
        estimateDrawerOpen={estimateDrawerOpen}
        onRequestOpenEstimateDrawer={handleTourRequestOpenEstimateDrawer}
        onComplete={handleTourComplete}
      />
    </Container>
  );
};

const TimeProject: React.FC<TimeProjectProps> = ({ workerId }) => (
  <ProjectsSdkFlagsProvider>
    <TimeProjectContent workerId={workerId} />
  </ProjectsSdkFlagsProvider>
);

export default TimeProject;

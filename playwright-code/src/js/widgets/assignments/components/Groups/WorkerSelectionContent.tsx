import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { Table } from '@ids-ts/table';
import { Activity } from '@ids-ts/loader';
import Typography from '@ids-ts/typography';
import Button from '@ids-ts/button';
import { ChevronUp, ChevronDown } from '@design-systems/icons';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import { useDispatch, useSelector } from 'react-redux';
import {
  TimeTracking_TimeForType,
  TimeTracking_WorkerOrderBy,
  TimeTracking_GroupOrderBy,
} from 'src/__generated__/timeTracking/graphql';
import { SearchField } from 'src/js/widgets/common/SearchField';
import { useTimeTrackingWorkers } from 'src/js/service/hooks/groups';
import { useGetGroups } from 'src/js/service/hooks/groups/useGetGroups';
import { useWorkerPagination } from '../../hooks/useWorkerPagination';
import { useWorkerSelection } from '../../hooks/useWorkerSelection';
import { useSearchAndSort } from '../../hooks/useSearchAndSort';
import { GroupFilterDropdown } from './GroupFilterDropdown';
import { calculatePaginationVisibility } from '../../utils/paginationVisibilityUtils';
import { WORKERS_PAGE_SIZE } from '../../utils/constants';
import {
  selectSelectedMembers,
  selectSelectedMembersCount,
  selectSelectedLeads,
  selectSelectedLeadsCount,
  selectDrawerWorkers,
  selectDrawerWorkersById,
  selectDrawerWorkersAllIds,
  selectDrawerWorkersSelectedCount,
  addDrawerWorkers,
  selectDrawerErrorTitle,
  selectDrawerErrorMessage,
  clearDrawerError,
  DrawerWorker,
} from '../../store/workersGroupViewSlice';
import {
  selectAllGroups,
  selectHasNextPage,
  selectGroupsCursor,
  selectIsLoadingMoreGroups,
} from '../../store/groupViewSelectors';
import {
  ContentContainer,
  HeaderSection,
  DescriptionText,
  CounterRow,
  CounterText,
  SearchContainer,
  DropdownWrapper,
  SearchWrapper,
  LoadingContainer,
  EmptyStateContainer,
  TableWrapper,
  StyledCheckbox,
  StyledTable,
  CheckboxCell,
  SortableHeaderCell,
  WorkerNameCell,
  WorkerName,
  WorkerType,
  WorkerGroupCell,
  PaginationContainer,
  ErrorMessage,
} from '../../styles/Groups/WorkerSelectionContent.styled';
import {
  WorkerSelectionMode,
  WorkerSelectionContentProps,
} from '../../types/Groups/GroupDrawer.types';
import { GROUP_MODALS_TRACKING_POINTS } from '../../utils/groupsTrackingPoints';
import { selectWorkersListHeaderTotalCount } from '../../store/workersListSlice';

/**
 * WorkerSelectionContent Component
 *
 * Reusable component for selecting workers to assign to a group.
 * Supports two modes:
 * - 'workers': Select group members (regular workers)
 * - 'leads': Select group managers/leads
 *
 * Features:
 * - Search field for filtering workers (debounced at 300ms)
 * - Server-side filtering using API's searchText filter
 *   • Searches across firstName, lastName, and displayName fields
 *   • Partial, case-insensitive matching
 * - Server-side sorting by display name (ascending/descending)
 *   • Click sort icon to toggle between ASC/DESC order
 *   • ChevronDown icon = ascending order (click to sort descending)
 *   • ChevronUp icon = descending order (click to sort ascending)
 * - Pagination with IDS Table component
 *   • Initial load: 100 workers
 *   • Previous/Next page navigation for additional workers
 * - Flat list of workers with type and current group assignment
 * - Checkboxes for selection (individual + select all)
 * - Selection counter
 * - Loading and error states
 *
 * Uses the useTimeTrackingWorkers hook and IDS Table component
 */
export const WorkerSelectionContent: React.FC<WorkerSelectionContentProps> = ({
  groupName,
  mode = WorkerSelectionMode.Workers,
  groupId, // NEW: For edit mode
}) => {
  const intl = useIntl();
  const sandbox = useSandbox();
  const dispatch = useDispatch();
  const track = useTracking();

  // Track search once per session
  const hasTrackedSearch = useRef(false);

  // Count of all workers in the company
  // Utilized for displaying total count in the header
  const totalWorkers = useSelector(selectWorkersListHeaderTotalCount);

  // HYBRID STATE SYSTEM:
  // - EDIT mode: Use drawerWorkers (unified state)
  // - CREATE mode: Use selectedMembers/selectedLeads (separate states)

  // Detect edit mode: based on context (groupId exists) for BOTH Workers and Leads
  const isEditMode = !!(
    groupId &&
    (mode === WorkerSelectionMode.Leads || mode === WorkerSelectionMode.Workers)
  );

  // EDIT mode state (unified)
  const drawerWorkers = useSelector(selectDrawerWorkers);
  const drawerWorkersById = useSelector(selectDrawerWorkersById);
  const drawerWorkersAllIds = useSelector(selectDrawerWorkersAllIds);
  const drawerWorkersSelectedCount = useSelector(
    selectDrawerWorkersSelectedCount,
  );

  // CREATE mode state (separate for workers vs leads)
  const selectedEntities = useSelector(
    mode === WorkerSelectionMode.Workers
      ? selectSelectedMembers
      : selectSelectedLeads,
  );
  const selectedCount = useSelector(
    mode === WorkerSelectionMode.Workers
      ? selectSelectedMembersCount
      : selectSelectedLeadsCount,
  );

  // Error state from Redux
  const selectionErrorTitle = useSelector(selectDrawerErrorTitle);
  const selectionErrorMessage = useSelector(selectDrawerErrorMessage);

  // Hybrid pagination state (client-side for selected + server-side for unselected)
  const [currentPageNumber, setCurrentPageNumber] = useState(1);

  // Group filter state
  const [groupFilter, setGroupFilter] = useState<string>('ALL');

  // Track the filter that the current data was loaded with
  const loadedFilterRef = useRef<string>('ALL');

  // Check if we're waiting for data with the current filter
  const isFilterChanging = groupFilter !== loadedFilterRef.current;

  // Fetch groups for filter dropdown
  const {
    loading: groupsLoading,
    loadGroups,
    fetchNextPage: fetchNextGroupsPage,
  } = useGetGroups({ appendOnFetchNextPage: true });

  // Groups from Redux (supports append on Load More)
  const allGroups = useSelector(selectAllGroups);
  const groupsHasNextPage = useSelector(selectHasNextPage);
  const groupsEndCursor = useSelector(selectGroupsCursor);
  const groupsIsLoadingMore = useSelector(selectIsLoadingMoreGroups);

  // Load groups on component mount
  useEffect(() => {
    loadGroups({
      first: 100,
      orderBy: [TimeTracking_GroupOrderBy.NameAsc],
      filter: { isActive: true },
    });
  }, [loadGroups]);

  // Load more groups (append next page)
  const handleLoadMoreGroups = useCallback(() => {
    fetchNextGroupsPage({
      orderBy: [TimeTracking_GroupOrderBy.NameAsc],
      filter: { isActive: true },
    });
  }, [fetchNextGroupsPage]);

  // Fetch ALL company workers using the useTimeTrackingWorkers hook
  const {
    workers: allCompanyWorkers,
    loading,
    error,
    pageInfo,
    totalCount,
    loadWorkers,
    fetchNextPage,
    fetchPreviousPage,
    refetch: baseRefetch,
  } = useTimeTrackingWorkers();

  // Wrap refetch to include group filter (used by search/sort)
  const refetch = useCallback(
    (params: any = {}) => {
      const { filter = {}, ...restParams } = params;
      const completeFilter = {
        ...filter,
        ...(groupFilter === 'NO_GROUP' && { hasGroup: false }),
        ...(groupFilter &&
          groupFilter !== 'ALL' &&
          groupFilter !== 'NO_GROUP' && { groupId: groupFilter }),
      };

      return baseRefetch({
        ...restParams,
        filter: completeFilter,
      });
    },
    [baseRefetch, groupFilter],
  );

  // Search and sort utilities (encapsulated in custom hook)
  const {
    searchTerm,
    handleSearchChange: onSearchChange,
    sortOrder,
    handleSorting,
    isSorted,
  } = useSearchAndSort({
    setCurrentPageNumber,
    refetch,
  });

  // Reset to page 1 when group filter changes
  useEffect(() => {
    setCurrentPageNumber(1);
  }, [groupFilter]);

  // Update loaded filter ref when data finishes loading
  useEffect(() => {
    if (!loading && allCompanyWorkers.length >= 0) {
      // Data has loaded, update the ref to match current filter
      loadedFilterRef.current = groupFilter;
    }
  }, [loading, allCompanyWorkers, groupFilter]);

  // Wrapped search handler with tracking
  const handleSearchChange = useCallback(
    (value: string) => {
      // Track search only when user types (value is not empty) and only once per session
      if (value.trim() && !hasTrackedSearch.current) {
        if (mode === WorkerSelectionMode.Workers) {
          sandbox.logger.info(
            'Component="WorkerSelectionContent" Event="Search workers typed"',
          );
          track(GROUP_MODALS_TRACKING_POINTS.SEARCH_WORKER);
        } else if (mode === WorkerSelectionMode.Leads) {
          sandbox.logger.info(
            'Component="WorkerSelectionContent" Event="Search leads typed"',
          );
          track(GROUP_MODALS_TRACKING_POINTS.SEARCH_LEAD);
        }
        hasTrackedSearch.current = true;
      }

      // Call original handler
      onSearchChange(value);
    },
    [onSearchChange, mode],
  );

  // Force clear pageInfo when filter doesn't match loaded data
  const safePageInfo = useMemo(() => {
    if (isFilterChanging) {
      return undefined; // Clear pageInfo immediately when filter changes
    }
    return pageInfo || undefined;
  }, [isFilterChanging, pageInfo]);

  // Master pagination hook - composes all pagination logic (UNIFIED for both modes)
  const {
    workers,
    handleNextPage,
    handlePreviousPage,
    totalPagesForSelected,
    fullPagesOfSelected,
    transitionPageNumber,
    remainingSelected,
  } = useWorkerPagination({
    isEditMode,
    currentPageNumber,
    setCurrentPageNumber,
    searchTerm,
    sortOrder,
    isSorted,
    loading: loading || isFilterChanging, // Block pagination while filter is changing
    drawerWorkersAllIds,
    drawerWorkersById,
    drawerWorkersSelectedCount,
    currentWorkers: [], // REMOVED: No longer used in unified mode
    selectedWorkerIds: new Set(), // REMOVED: No longer used in unified mode
    allCompanyWorkers,
    pageInfo: safePageInfo, // Use memoized safe pageInfo
    loadWorkers,
    fetchNextPage,
    fetchPreviousPage,
    groupFilter, // Pass group filter for pagination
  });

  // NEW: Merge company workers into drawer workers (edit mode only)
  // Only merge when managers are loaded AND we have new company workers
  useEffect(() => {
    if (!isEditMode || !allCompanyWorkers || allCompanyWorkers.length === 0) {
      return;
    }

    // Wait until managers are loaded before merging company workers
    if (!drawerWorkers.hasLoadedInitialManagers) {
      return;
    }

    // Convert API workers to DrawerWorker format
    const companyDrawerWorkers: DrawerWorker[] = allCompanyWorkers.map(
      (w: any) => ({
        id: w.id,
        type: w.type,
        firstName: w.firstName || '',
        lastName: w.lastName || '',
        displayName: w.displayName,
        isActive: w.isActive,
        isSelected: drawerWorkersById[w.id]?.isSelected || false, // Preserve existing selection
        memberOfGroup: w.memberOfGroup || null, // Keep full object for group name display
        managesGroups: w.managesGroups || [],
      }),
    );

    // Merge into drawer workers (dedupes automatically - won't overwrite managers)
    dispatch(
      addDrawerWorkers({
        workers: companyDrawerWorkers,
        markAsManagers: false,
      }),
    );
  }, [
    isEditMode,
    allCompanyWorkers,
    drawerWorkers.hasLoadedInitialManagers,
    dispatch,
    drawerWorkersById,
  ]);

  // Worker selection logic (encapsulated in custom hook - HYBRID approach)
  const {
    isWorkerSelected,
    updateWorkerSelection: onWorkerSelectionChange,
    handleSelectAll,
    allSelected,
    someSelected,
  } = useWorkerSelection({
    isEditMode,
    mode,
    workers,
    drawerWorkersById,
    selectedEntities, // CREATE mode uses this, EDIT mode uses drawerWorkersById
  });

  // Wrapped worker selection handler with tracking
  const updateWorkerSelection = useCallback(
    (workerId: string, workerType: TimeTracking_TimeForType) => {
      // Track selection
      if (mode === WorkerSelectionMode.Workers) {
        sandbox.logger.info(
          'Component="WorkerSelectionContent" Event="Worker selected"',
        );
        track(GROUP_MODALS_TRACKING_POINTS.SELECT_WORKER);
      } else if (mode === WorkerSelectionMode.Leads) {
        sandbox.logger.info(
          'Component="WorkerSelectionContent" Event="Lead selected"',
        );
        track(GROUP_MODALS_TRACKING_POINTS.SELECT_LEAD);
      }

      // Call original handler
      onWorkerSelectionChange(workerId, workerType);
    },
    [onWorkerSelectionChange, mode],
  );

  // Wrapped select all handler with tracking
  const handleSelectAllWithTracking = useCallback(
    (checked: boolean) => {
      // Track select all action
      if (mode === WorkerSelectionMode.Workers) {
        track(GROUP_MODALS_TRACKING_POINTS.SELECT_ALL_WORKERS);
      } else if (mode === WorkerSelectionMode.Leads) {
        track(GROUP_MODALS_TRACKING_POINTS.SELECT_ALL_LEADS);
      }

      // Call original handler
      handleSelectAll(checked);
    },
    [handleSelectAll, mode],
  );

  // Format worker type for display
  const formatWorkerType = useCallback((type: string) => {
    switch (type) {
      case TimeTracking_TimeForType.Employee:
        return 'Employee';
      case TimeTracking_TimeForType.LegacyQboUser:
        return 'User';
      case TimeTracking_TimeForType.Vendor:
        return 'Vendor';
      default:
        return type;
    }
  }, []);

  // Unified loading state check
  const isLoading =
    loading || (isEditMode && !drawerWorkers.hasLoadedInitialManagers);

  // Dynamic content based on mode
  const contentConfig = {
    [WorkerSelectionMode.Workers]: {
      testIdPrefix: 'assign-workers',
      errorMessageId: 'groups.assign_workers.error',
      errorDefaultMessage: 'Unable to load workers',
      descriptionId: 'groups.assign_workers.description',
      descriptionDefaultMessage: 'Assign workers to this group.',
      counterMessageId: 'groups.assign_workers.counter_with_group',
      counterDefaultMessage: '{selected} of {total} workers to {groupName}',
      searchLabelId: 'groups.assign_workers.search.label',
      loadingMessageId: 'groups.assign_workers.loading',
      loadingDefaultMessage: 'Loading workers...',
    },
    [WorkerSelectionMode.Leads]: {
      testIdPrefix: 'assign-leads',
      errorMessageId: 'groups.assign_leads.error',
      errorDefaultMessage: 'Unable to load group leads',
      descriptionId: 'groups.assign_leads.description',
      descriptionDefaultMessage:
        'Assign worker as a group lead. They can edit jobs and manage user accounts, timesheets, schedules, and run reports in QuickBooks Time.',
      counterMessageId: 'groups.assign_leads.counter_with_group',
      counterDefaultMessage: '{selected} of {total} leads to {groupName}',
      searchLabelId: 'groups.assign_leads.search.label',
      loadingMessageId: 'groups.assign_leads.loading',
      loadingDefaultMessage: 'Loading leads...',
    },
  }[mode];

  return (
    <ContentContainer data-testid={`${contentConfig.testIdPrefix}-content`}>
      {/* Error Message from Redux (Edit Group workflow - AssignWorkers/AssignLeads views) */}
      {isEditMode && selectionErrorMessage && (
        <ErrorMessage
          type="error"
          open
          onClose={() => dispatch(clearDrawerError())}
          title={selectionErrorTitle ?? undefined}
          data-testid={`${contentConfig.testIdPrefix}-page-message`}
        >
          {typeof selectionErrorMessage === 'string' &&
          selectionErrorMessage.includes('<ul>') ? (
            <div dangerouslySetInnerHTML={{ __html: selectionErrorMessage }} />
          ) : (
            selectionErrorMessage
          )}
        </ErrorMessage>
      )}

      {/* Error Message from API */}
      {error && (
        <ErrorMessage
          type="error"
          open
          data-testid={`${contentConfig.testIdPrefix}-error-message`}
          title={intl.formatMessage({
            id: contentConfig.errorMessageId,
            defaultMessage: contentConfig.errorDefaultMessage,
          })}
        >
          {intl.formatMessage({
            id: 'groups.drawer.error.please_try_again',
            defaultMessage: 'Try saving your change again.',
          })}
        </ErrorMessage>
      )}

      {/* Header Section */}
      <HeaderSection>
        <DescriptionText>
          {intl.formatMessage({
            id: contentConfig.descriptionId,
            defaultMessage: contentConfig.descriptionDefaultMessage,
          })}
        </DescriptionText>

        <CounterRow>
          <CounterText>
            {(() => {
              const displaySelected = isEditMode
                ? drawerWorkersSelectedCount
                : selectedCount;
              const displayTotal = totalWorkers;

              return intl.formatMessage(
                {
                  id: contentConfig.counterMessageId,
                  defaultMessage: contentConfig.counterDefaultMessage,
                },
                {
                  selected: displaySelected,
                  total: displayTotal,
                  groupName,
                },
              );
            })()}
          </CounterText>
          <SearchContainer>
            {/* Group Filter Dropdown - First (164px width) */}
            <DropdownWrapper>
              <GroupFilterDropdown
                groups={allGroups}
                loading={groupsLoading}
                value={groupFilter}
                onChange={(value) => {
                  sandbox.logger.info(
                    'Component="WorkerSelectionContent" Event="Group filter changed"',
                    {
                      from: groupFilter,
                      to: value,
                      mode,
                    },
                  );
                  setGroupFilter(value);
                  setCurrentPageNumber(1); // Reset to page 1 when filter changes
                }}
                showLabel={false}
                hasNextPage={groupsHasNextPage}
                endCursor={groupsEndCursor}
                onLoadMore={handleLoadMoreGroups}
                isLoadingMore={groupsIsLoadingMore}
              />
            </DropdownWrapper>
            {/* Search Field - Second (fixed 250px width) */}
            <SearchWrapper>
              <SearchField
                value={searchTerm}
                onChange={handleSearchChange}
                label=""
                placeholder={intl.formatMessage({
                  id: contentConfig.searchLabelId,
                  defaultMessage: 'Search',
                })}
                alwaysExpanded
                debounceMs={300}
              />
            </SearchWrapper>
          </SearchContainer>
        </CounterRow>
      </HeaderSection>

      {/* Workers Table */}
      {isLoading && (
        <LoadingContainer data-testid={`${contentConfig.testIdPrefix}-loading`}>
          <Activity shape="dots" size="large" />
          <Typography variant="body-2">
            {intl.formatMessage({
              id: contentConfig.loadingMessageId,
              defaultMessage: contentConfig.loadingDefaultMessage,
            })}
          </Typography>
        </LoadingContainer>
      )}

      {!isLoading && workers.length === 0 && (
        <EmptyStateContainer>
          {intl.formatMessage({
            id: 'groups.assign_workers.no_results',
            defaultMessage: 'No workers found',
          })}
        </EmptyStateContainer>
      )}

      {!isLoading && workers.length > 0 && (
        <>
          <TableWrapper>
            <StyledTable
              divider="horizontal"
              responsive="elevate"
              hover="row"
              summary="Workers selection table"
              density="comfortable"
              data-testid={`${contentConfig.testIdPrefix}-table`}
            >
              <Table.Header>
                <Table.Row>
                  <CheckboxCell>
                    <StyledCheckbox
                      checked={allSelected}
                      indeterminate={!!someSelected}
                      onChange={(e) =>
                        handleSelectAllWithTracking(e.target.checked || false)
                      }
                      aria-label={intl.formatMessage({
                        id: 'groups.assign_workers.select_all',
                        defaultMessage: 'Select all workers',
                      })}
                      data-testid="select-all-checkbox"
                    />
                  </CheckboxCell>
                  <SortableHeaderCell onClick={handleSorting}>
                    {intl.formatMessage({
                      id: 'groups.assign_workers.table.worker',
                      defaultMessage: 'Worker',
                    })}
                    {sortOrder === TimeTracking_WorkerOrderBy.DisplayNameAsc ? (
                      <ChevronDown />
                    ) : (
                      <ChevronUp />
                    )}
                  </SortableHeaderCell>
                  <Table.Cell>
                    {intl.formatMessage({
                      id: 'groups.assign_workers.table.group',
                      defaultMessage: 'Group',
                    })}
                  </Table.Cell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {workers.map((worker: DrawerWorker, index: number) => {
                  const isSelected = isWorkerSelected(worker.id);

                  return (
                    <Table.Row
                      key={worker.id}
                      data-testid={`worker-row-${worker.id}`}
                    >
                      <CheckboxCell>
                        <StyledCheckbox
                          checked={isSelected}
                          onChange={() =>
                            updateWorkerSelection(
                              worker.id,
                              worker.type as TimeTracking_TimeForType,
                            )
                          }
                          aria-label={intl.formatMessage(
                            {
                              id: 'groups.assign_workers.select_worker',
                              defaultMessage: 'Select {workerName}',
                            },
                            { workerName: worker.displayName },
                          )}
                          data-testid={`worker-checkbox-${worker.id}`}
                        />
                      </CheckboxCell>
                      <WorkerNameCell>
                        <div>
                          <WorkerName>{worker.displayName}</WorkerName>
                          <WorkerType>
                            {formatWorkerType(worker.type)}
                          </WorkerType>
                        </div>
                      </WorkerNameCell>
                      <WorkerGroupCell>
                        {worker.memberOfGroup?.name ||
                          intl.formatMessage({
                            id: 'groups.no_group',
                            defaultMessage: 'No group',
                          })}
                      </WorkerGroupCell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </StyledTable>
          </TableWrapper>

          {/* Pagination Controls - Hybrid pagination (client + server) */}
          {(() => {
            // Calculate pagination visibility using production-ready utility
            const { canGoPrevious, canGoNext, showPagination } =
              calculatePaginationVisibility({
                isEditMode,
                isLoading,
                searchTerm,
                isSorted,
                currentPageNumber,
                drawerWorkersCount: totalCount ?? workers.length,
                totalPagesForSelected,
                pageInfo: pageInfo
                  ? {
                      hasNextPage: pageInfo.hasNextPage,
                      hasPreviousPage: pageInfo.hasPreviousPage,
                    }
                  : undefined,
              });

            // Don't render pagination if not needed
            if (!showPagination) return null;

            return (
              <PaginationContainer>
                <Typography variant="body-2">
                  {intl.formatMessage(
                    {
                      id: 'groups.assign_workers.pagination.page',
                      defaultMessage: 'Page {current}',
                    },
                    {
                      current: currentPageNumber,
                    },
                  )}
                </Typography>
                {canGoPrevious && (
                  <Button
                    priority="secondary"
                    onClick={handlePreviousPage}
                    data-testid={`${contentConfig.testIdPrefix}-pagination-previous-btn`}
                  >
                    {intl.formatMessage({
                      id: 'groups.assign_workers.pagination.previous',
                      defaultMessage: 'Previous',
                    })}
                  </Button>
                )}
                {canGoNext && (
                  <Button
                    priority="secondary"
                    onClick={handleNextPage}
                    data-testid={`${contentConfig.testIdPrefix}-pagination-next-btn`}
                  >
                    {intl.formatMessage({
                      id: 'groups.assign_workers.pagination.next',
                      defaultMessage: 'Next',
                    })}
                  </Button>
                )}
              </PaginationContainer>
            );
          })()}
        </>
      )}
    </ContentContainer>
  );
};

export default WorkerSelectionContent;

import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import styled from 'styled-components';
import Button from '@ids-ts/button';
import { Activity } from '@ids-ts/loader';
import { Plus } from '@design-systems/icons';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import Typography from '@ids-ts/typography';
import PageMessage from '@ids-ts/page-message';
import Widget from 'web-shell-core/widgets/HOCWidget';
import { useGetTimeAgainstAssignmentSummary } from 'src/js/service/hooks/assignments/useGetTimeAgainstAssignmentSummary';
import { SearchField } from 'src/js/widgets/common/SearchField';
import { SuccessToast } from 'src/js/widgets/common/SuccessToast';
import { TimeAgainstAssignmentSummaryEdge } from 'src/js/service/types/assignmentTypes';
import AssignmentPagination from 'src/js/widgets/common/AssignmentDrawer/components/AssignmentPagination';
import { useUpdateItmTask } from 'src/js/widgets/qbtOrchestrator/features/overview/hooks';
import { selectItmTasks } from 'src/js/widgets/qbtOrchestrator/features/overview/store/overviewSelectors';
import { storeManager } from 'src/js/widgets/qbtOrchestrator/store/storeManager';
import {
  ITM_TASK_TYPE_ASSIGN_TEAM,
  ITM_TASK_STATUS_OPEN,
  ITM_TASK_STATUS_DONE_YES,
  ITM_LOGGING,
} from 'src/js/widgets/qbtOrchestrator/features/overview/constants';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';
import { FEATURE_FLAGS } from 'src/js/common/constants';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import { useAppDispatch, useAppSelector } from '../../store';
import { CUSTOMER_ASSIGNMENTS_TRACKING_POINTS } from '../../utils/assignmentsTrackingPoints';
import {
  selectCustomerAssignmentsAllItems,
  selectCustomerAssignmentsTotalCount,
  selectCustomerAssignmentsLoading,
  selectCustomerAssignmentsHasMore,
  selectCustomerAssignmentsEndCursor,
  selectCustomerAssignmentsSummaryStats,
  setLoading,
  CUSTOMER_ASSIGNMENT_PAGE_SIZE,
} from '../../store/customerAssignmentsSlice';
import { ASSIGNMENT_LOGGING_CONSTANTS } from '../../constants';
import { DetailedErrorInfo } from '../../types';
import CustomerAssignmentTable from './components/CustomerAssignmentTable';
import EmptyCustomerState from './components/EmptyCustomerState';

const Container = styled.div`
  height: 100%;
  margin-top: 40px;
`;

const ButtonContainer = styled.div<{ $showEmptyState?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${(props) =>
    props.$showEmptyState ? 'flex-end' : 'space-between'};
  gap: 16px;
  padding: 0 0 16px 0;
  z-index: 150;
`;

const SearchWrapper = styled.div`
  flex: 1;
  max-width: 400px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 16px;
`;

const SearchContainer = styled.div`
  padding-top: 80px;
  padding-bottom: 16px;
`;

const TableContainer = styled.div`
  position: relative;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  padding-bottom: 10px;
  height: calc(100vh - 290px);
`;

const BackdropLoader = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 100;
`;

const StyledErrorPageMessage = styled(PageMessage)`
  margin-bottom: 16px;
  padding-top: 12px;
  padding-bottom: 12px;
`;

const PageMessageContainer = styled.div`
  padding: 80px 0 0 0;
  margin-bottom: 16px;

  > div {
    padding-top: 12px;
    padding-bottom: 12px;
  }
`;

const CustomerAssignmentsTab: React.FC = () => {
  const intl = useIntl();
  const sandbox = useSandbox();
  const track = useTracking();
  const logger = useLoggingConfig();
  const text = (id: string) => intl.formatMessage({ id });

  // Redux state
  const dispatch = useAppDispatch();
  const allItems = useAppSelector(selectCustomerAssignmentsAllItems);
  const totalCount = useAppSelector(selectCustomerAssignmentsTotalCount);
  const reduxLoading = useAppSelector(selectCustomerAssignmentsLoading);
  const hasMore = useAppSelector(selectCustomerAssignmentsHasMore);
  const endCursor = useAppSelector(selectCustomerAssignmentsEndCursor);
  const summaryStats = useAppSelector(selectCustomerAssignmentsSummaryStats);

  // State for managing the contact drawer
  const [showContactDrawer, setShowContactDrawer] = useState<boolean>(false);

  // State for contact to edit (null = create mode, object = edit mode)
  const [contactToEdit, setContactToEdit] = useState<{
    id: string;
    customerId: string; // Always pass customer ID (for both customer and project)
  } | null>(null);

  // State for search
  const [searchValue, setSearchValue] = useState<string>('');

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);

  // State for error message from field assignment
  const [errorInfo, setErrorInfo] = useState<DetailedErrorInfo | null>(null);

  // State for success toast
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // State for field assignment drawer - lifted from Table to control both message and drawer
  const [activeFieldAssignment, setActiveFieldAssignment] =
    useState<TimeAgainstAssignmentSummaryEdge | null>(null);

  // State for worker assignment drawer
  const [activeWorkerAssignment, setActiveWorkerAssignment] =
    useState<TimeAgainstAssignmentSummaryEdge | null>(null);

  // Track if initial load has happened - similar to WorkersGroupViewDataProvider pattern
  const initialLoadRef = useRef(false);

  // Use the hook to fetch customer assignment data
  const {
    loading: apiLoading,
    error,
    loadTimeAgainstAssignmentSummary,
  } = useGetTimeAgainstAssignmentSummary();

  // ITM task update hook
  const { updateItmTask } = useUpdateItmTask();
  const { isEnabled: isOverviewModernisationEnabled } = useIXPFeatureFlag({
    flagName: FEATURE_FLAGS.SBSEG_QBO_QBTIME_OVERVIEW_MODERNISATION,
    defaultValue: false,
  });

  // Combined loading state
  const loading = apiLoading || reduxLoading;

  // Load customers when component mounts - following worker tab pattern
  useEffect(() => {
    // Load on mount only (ref resets when component remounts after navigation)
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;

      // Load initial data
      setCurrentPage(1);

      loadTimeAgainstAssignmentSummary({
        first: CUSTOMER_ASSIGNMENT_PAGE_SIZE,
        searchText: undefined,
        append: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch customers when search text changes - server-side search (matches Groups tab)
  useEffect(() => {
    if (initialLoadRef.current) {
      // Reset pagination for fresh search
      setCurrentPage(1);

      // Don't reset state - let the hook replace data when append: false
      loadTimeAgainstAssignmentSummary({
        first: CUSTOMER_ASSIGNMENT_PAGE_SIZE,
        searchText: searchValue.trim() || undefined,
        append: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  // Get current page items (server handles filtering and pagination)
  const currentPageItems = useMemo(() => {
    const startIndex = (currentPage - 1) * CUSTOMER_ASSIGNMENT_PAGE_SIZE;
    const endIndex = startIndex + CUSTOMER_ASSIGNMENT_PAGE_SIZE;
    return allItems.slice(startIndex, endIndex);
  }, [allItems, currentPage]);

  // Calculate total pages based on total count from API
  const totalPages = Math.ceil(totalCount / CUSTOMER_ASSIGNMENT_PAGE_SIZE);

  // Cursor of the last item on the previous page, used to refresh current page in-place
  const afterCursorForCurrentPage = useMemo(() => {
    if (currentPage <= 1) return undefined;
    const lastPrevPageIndex =
      (currentPage - 1) * CUSTOMER_ASSIGNMENT_PAGE_SIZE - 1;
    return allItems[lastPrevPageIndex]?.cursor;
  }, [allItems, currentPage]);

  // Build display data for table with summary stats
  const displayData = useMemo(
    () => ({
      edges: currentPageItems,
      pageInfo: {
        hasNextPage: currentPage < totalPages || hasMore,
        hasPreviousPage: currentPage > 1,
        startCursor: currentPageItems[0]?.cursor || undefined,
        endCursor:
          currentPageItems[currentPageItems.length - 1]?.cursor || undefined,
      },
      totalTimeAgainstCount: totalCount,
      totalTimeForAssignments: summaryStats.totalTimeForAssignments,
      totalCustomFieldAssignments: summaryStats.totalCustomFieldAssignments,
      totalStandardFieldAssignments: summaryStats.totalStandardFieldAssignments,
    }),
    [
      currentPageItems,
      currentPage,
      totalPages,
      hasMore,
      totalCount,
      summaryStats,
    ],
  );

  // Handler for opening the customer creation dialog
  const handleAddCustomer = useCallback(() => {
    track(CUSTOMER_ASSIGNMENTS_TRACKING_POINTS.ADD_CUSTOMER_CTA);
    setContactToEdit(null); // Clear edit state for create mode
    setShowContactDrawer(true);
  }, [track]);

  // Handler for opening the customer edit dialog
  const handleEditCustomer = useCallback(
    (contactId: string, customerId: string) => {
      setContactToEdit({ id: contactId, customerId });
      setShowContactDrawer(true);
    },
    [],
  );

  // Update ITM task for customer creation
  const updateItmTaskForCustomerCreation = useCallback(() => {
    if (!isOverviewModernisationEnabled) {
      return;
    }

    const orchestratorState = storeManager.store.getState();
    const tasks = selectItmTasks(orchestratorState);
    const assignTeamTask = tasks.find(
      (task) =>
        task.type === ITM_TASK_TYPE_ASSIGN_TEAM &&
        task.status === ITM_TASK_STATUS_OPEN,
    );

    if (assignTeamTask) {
      logger.info(ITM_LOGGING.ITM_TASK_UPDATE_INITIATED, {
        taskId: assignTeamTask.id,
        taskType: ITM_TASK_TYPE_ASSIGN_TEAM,
      });

      updateItmTask({
        id: assignTeamTask.id,
        status: ITM_TASK_STATUS_DONE_YES,
      })
        .then((result) => {
          if (result.success) {
            logger.info(ITM_LOGGING.ITM_TASK_UPDATE_SUCCESS, {
              taskId: assignTeamTask.id,
              taskType: ITM_TASK_TYPE_ASSIGN_TEAM,
              newStatus: ITM_TASK_STATUS_DONE_YES,
            });
          } else {
            logger.error(ITM_LOGGING.ITM_TASK_UPDATE_FAILED, {
              taskId: assignTeamTask.id,
              error: result.message,
            });
          }
        })
        .catch((error) => {
          logger.error(ITM_LOGGING.ITM_TASK_UPDATE_FAILED, {
            taskId: assignTeamTask.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        });
    }
  }, [updateItmTask, logger, isOverviewModernisationEnabled]);

  // Handler for closing the customer creation/edit dialog (both close and success)
  const handleContactDrawerCloseOrSuccess = useCallback(
    (isSuccess?: boolean) => {
      const isCreateMode = contactToEdit === null;

      setShowContactDrawer(false);
      setContactToEdit(null); // Clear edit state
      // Refetch data after customer creation/edit
      setCurrentPage(1);
      loadTimeAgainstAssignmentSummary({
        first: CUSTOMER_ASSIGNMENT_PAGE_SIZE,
        searchText: searchValue.trim() || undefined,
        append: false,
      });

      // Update ITM task only for successful customer creation (not edit, not close)
      if (isSuccess && isCreateMode) {
        updateItmTaskForCustomerCreation();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      loadTimeAgainstAssignmentSummary,
      searchValue,
      contactToEdit,
      updateItmTaskForCustomerCreation,
    ],
  );

  const handleManageFields = useCallback(() => {
    track(CUSTOMER_ASSIGNMENTS_TRACKING_POINTS.MANAGE_TIME_TRACKING_FIELDS_CTA);
    try {
      // Navigate to time tracking settings page - using the same approach as other widgets
      sandbox.navigation.navigate('/app/accountsettings?p=time');
    } catch (error) {
      sandbox.logger.error('Navigation to time tracking settings failed', {
        error,
      });
    }
  }, [sandbox, track]);

  // Search handler - triggers server-side search via useEffect
  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  // Page change handler - supports pagination with search
  const handlePageChange = useCallback(
    (newPage: number) => {
      setCurrentPage(newPage);

      // Fetch more data if need more cached data
      const startIndex = (newPage - 1) * CUSTOMER_ASSIGNMENT_PAGE_SIZE;
      const endIndex = startIndex + CUSTOMER_ASSIGNMENT_PAGE_SIZE;

      if (endIndex > allItems.length && hasMore && !loading) {
        dispatch(setLoading(true));
        loadTimeAgainstAssignmentSummary({
          first: CUSTOMER_ASSIGNMENT_PAGE_SIZE,
          after: endCursor || undefined,
          searchText: searchValue.trim() || undefined,
          append: true,
        });
      }
    },
    [
      allItems.length,
      hasMore,
      endCursor,
      loading,
      searchValue,
      dispatch,
      loadTimeAgainstAssignmentSummary,
    ],
  );

  const handleRefresh = useCallback(() => {
    // Clear error messages on refresh
    setErrorInfo(null);
    setCurrentPage(1);
    loadTimeAgainstAssignmentSummary({
      first: CUSTOMER_ASSIGNMENT_PAGE_SIZE,
      searchText: searchValue.trim() || undefined,
      append: false,
    });
  }, [loadTimeAgainstAssignmentSummary, searchValue]);

  const handleShowSuccess = useCallback(
    (msg: string) => {
      // Show success toast notification
      setSuccessMessage(msg);
      setShowSuccessToast(true);
      // Close both drawers immediately to prevent blocking UI
      setActiveFieldAssignment(null);
      setActiveWorkerAssignment(null);
      // Refresh table to show updated data
      loadTimeAgainstAssignmentSummary({
        first: CUSTOMER_ASSIGNMENT_PAGE_SIZE,
        after: afterCursorForCurrentPage,
        searchText: searchValue.trim() || undefined,
        refreshInPlace: true,
      });
    },
    [loadTimeAgainstAssignmentSummary, searchValue, afterCursorForCurrentPage],
  );

  const handleError = useCallback(
    (error: DetailedErrorInfo) => {
      setErrorInfo(error);
      setActiveFieldAssignment(null);
      setActiveWorkerAssignment(null);

      if (error.isPartialSuccess) {
        loadTimeAgainstAssignmentSummary({
          first: CUSTOMER_ASSIGNMENT_PAGE_SIZE,
          after: afterCursorForCurrentPage,
          searchText: searchValue.trim() || undefined,
          refreshInPlace: true,
        });
      }
    },
    [loadTimeAgainstAssignmentSummary, searchValue, afterCursorForCurrentPage],
  );

  // Auto-close worker assignment drawer on error message (includes partial success)
  useEffect(() => {
    if (errorInfo && activeWorkerAssignment) {
      setActiveWorkerAssignment(null);
    }
  }, [errorInfo, activeWorkerAssignment]);

  // Show empty state when no data
  const showEmptyState =
    !loading && allItems.length === 0 && !searchValue.trim();
  const showNoSearchResults =
    !loading && searchValue.trim() && allItems.length === 0;

  return (
    <Container>
      <ButtonContainer $showEmptyState={showEmptyState}>
        {!showEmptyState && (
          <SearchWrapper>
            <SearchField
              value={searchValue}
              onChange={handleSearchChange}
              label={text('assignments.search')}
            />
          </SearchWrapper>
        )}

        <ButtonGroup>
          <Button
            priority="secondary"
            purpose="standard"
            onClick={handleManageFields}
          >
            {text('assignments.empty.customers.button.secondary')}
          </Button>
          <Button
            priority="primary"
            purpose="standard"
            onClick={handleAddCustomer}
          >
            <Plus />
            {text('assignments.empty.customers.button.primary')}
          </Button>
        </ButtonGroup>
      </ButtonContainer>

      {errorInfo && (
        <StyledErrorPageMessage
          type="warn"
          open
          dismissible
          onClose={() => setErrorInfo(null)}
          title={errorInfo.title}
        >
          {errorInfo.subtitle && (
            <Typography variant="body-2" weight="demi">
              {errorInfo.subtitle}
            </Typography>
          )}
          {errorInfo.description && (
            <Typography variant="body-3">{errorInfo.description}</Typography>
          )}
        </StyledErrorPageMessage>
      )}

      <TableContainer>
        {!loading && showEmptyState && <EmptyCustomerState />}

        {!loading && !showEmptyState && showNoSearchResults && (
          <PageMessageContainer>
            <PageMessage
              type="info"
              open
              title={text('assignments.noSearchResults')}
            />
          </PageMessageContainer>
        )}

        {!loading && !showEmptyState && !showNoSearchResults && (
          <>
            <CustomerAssignmentTable
              data={displayData}
              error={error}
              onRefresh={handleRefresh}
              onError={handleError}
              onClearError={() => setErrorInfo(null)}
              onShowSuccess={handleShowSuccess}
              searchValue={searchValue}
              activeFieldAssignment={activeFieldAssignment}
              onSetActiveFieldAssignment={setActiveFieldAssignment}
              activeWorkerAssignment={activeWorkerAssignment}
              onSetActiveWorkerAssignment={setActiveWorkerAssignment}
              onEditCustomer={handleEditCustomer}
            />

            {/* Pagination - shown when more than one page */}
            {totalPages > 1 && (
              <AssignmentPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalCount}
                pageSize={CUSTOMER_ASSIGNMENT_PAGE_SIZE}
                summaryItems={text('assignments.pagination.customers')}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}

        {loading && (
          <BackdropLoader data-testid="customer-assignments-loading">
            <Activity shape="dots" size="large" />
          </BackdropLoader>
        )}
      </TableContainer>

      {/* Customer Creation/Edit Dialog */}
      {showContactDrawer && (
        <Widget
          widgetId="qbo-contacts-v2/contact-drawer"
          mode={contactToEdit ? 'edit' : 'create'}
          contactId={contactToEdit?.id}
          customerId={contactToEdit?.customerId}
          nameTypes={['customer']}
          open
          onClose={() => handleContactDrawerCloseOrSuccess()}
          onSuccess={() => handleContactDrawerCloseOrSuccess(true)}
        />
      )}

      {/* Success Toast for field assignment */}
      <SuccessToast
        message={successMessage}
        open={showSuccessToast}
        onClose={() => setShowSuccessToast(false)}
      />
    </Container>
  );
};

export default CustomerAssignmentsTab;

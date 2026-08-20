import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { CaretLeft } from '@design-systems/icons';
import { useIntl, useTracking } from '@payroll/quicksand';
import { Table } from '@ids-ts/table';
import { Pagination } from '@ids-ts/pagination';
import { Activity } from '@ids-ts/loader';
import PageMessage from '@ids-ts/page-message';
import ComboLink, { MenuItem } from '@ids-ts/combo-link';
import Button from '@ids-ts/button';
import Widget from 'web-shell-core/widgets/HOCWidget';
import { STANDARD_FIELD_ASSIGNMENTS_TRACKING_POINTS } from 'src/js/widgets/timeTrackingSettings/timeEntrySettingsTrackingPoints';
import { ITimeSheetFieldOption } from 'src/js/widgets/timeTrackingSettings/types';
import {
  useStandardFieldOptionsSummary,
  type StandardFieldLabel,
} from 'src/js/service/hooks/assignments/useStandardFieldOptionsSummary';
import {
  getFieldAssignmentLabel,
  getAssignmentDisplayText,
} from 'src/js/widgets/common/assignment/assignmentUtils';
import {
  FIELD_ASSIGNMENT_TABLE_COLUMNS,
  STANDARD_FIELD_ACTIONS,
} from 'src/js/widgets/timeTrackingSettings/constants';
import { DetailedErrorInfo } from 'src/js/widgets/assignments/types';
import { SuccessToast } from 'src/js/widgets/common/SuccessToast';
import { SearchField } from 'src/js/widgets/common/SearchField';
import { useAppDispatch, useAppSelector } from '../../../store';
import {
  selectStandardFieldOptionsSummaryAllItems,
  selectStandardFieldOptionsSummaryTotalWorkerCount,
  selectStandardFieldOptionsSummaryTotalCustomerCount,
  selectStandardFieldOptionsSummaryTotalOptionsCount,
  selectStandardFieldOptionsSummaryLoading,
  selectStandardFieldOptionsSummaryHasMore,
  selectStandardFieldOptionsSummaryEndCursor,
  selectStandardFieldOptionsSummaryCurrentFieldLabel,
  setLoading,
  setInitialData,
  appendData,
  resetStandardFieldOptionsSummaryState,
  STANDARD_FIELD_OPTIONS_PAGE_SIZE,
} from '../../../store/standardFieldOptionsSummarySlice';
import StandardFieldAssignmentIntegration, {
  StandardFieldOption,
} from './StandardFieldAssignmentIntegration';
import StandardFieldWorkerAssignmentIntegration from './StandardFieldWorkerAssignmentIntegration';

import {
  FieldAssignmentContainer,
  BackButtonContainer,
  BackLink,
  PageTitle,
  FieldAssignmentStyledTable,
  ActionsHeaderCell,
  ActionCellContent,
  PaginationContainer,
  LoadingContainer,
  ErrorContainer,
  EmptyStateContainer,
  DisplayCell,
  SearchWrapper,
  SearchAndAddRow,
} from '../../styles';

// Using StandardFieldOptionSummaryNode from the slice for type consistency
type StandardFieldOptionNode = {
  id: string;
  name: string;
  customerAssignmentCount: number;
  workerAssignmentCount: number;
};

interface FieldAssignmentDetailViewProps {
  field: ITimeSheetFieldOption;
  fieldTitle: string;
  onBack: () => void;
}

/**
 * FieldAssignmentDetailView Component
 * Displays the field assignment detail page with a table of standard field options
 * showing customer and worker assignment counts with actions to assign
 */
export const FieldAssignmentDetailView: React.FC<
  FieldAssignmentDetailViewProps
> = ({ field, fieldTitle, onBack }) => {
  const intl = useIntl();
  const pageSize = STANDARD_FIELD_OPTIONS_PAGE_SIZE;

  // Redux state
  const dispatch = useAppDispatch();
  const allItems = useAppSelector(selectStandardFieldOptionsSummaryAllItems);
  const totalWorkerCount = useAppSelector(
    selectStandardFieldOptionsSummaryTotalWorkerCount,
  );
  const totalCustomerCount = useAppSelector(
    selectStandardFieldOptionsSummaryTotalCustomerCount,
  );
  const totalOptionsCount = useAppSelector(
    selectStandardFieldOptionsSummaryTotalOptionsCount,
  );
  const reduxLoading = useAppSelector(selectStandardFieldOptionsSummaryLoading);
  const hasMore = useAppSelector(selectStandardFieldOptionsSummaryHasMore);
  const endCursor = useAppSelector(selectStandardFieldOptionsSummaryEndCursor);
  const currentFieldLabel = useAppSelector(
    selectStandardFieldOptionsSummaryCurrentFieldLabel,
  );

  // Local state
  const track = useTracking();
  const [currentPage, setCurrentPage] = useState(1);

  // State for search
  const [searchValue, setSearchValue] = useState<string>('');

  // State for customer assignment drawer
  const [activeOptionForAssignment, setActiveOptionForAssignment] =
    useState<StandardFieldOption | null>(null);

  // State for worker assignment drawer
  const [activeOptionForWorkerAssignment, setActiveOptionForWorkerAssignment] =
    useState<StandardFieldOption | null>(null);

  // State for error message from field assignment
  const [errorInfo, setErrorInfo] = useState<DetailedErrorInfo | null>(null);

  // State for success toast
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // State for Add drawer
  const [showAddDrawer, setShowAddDrawer] = useState(false);

  // Track if initial load has happened
  const initialLoadRef = useRef(false);

  const {
    data: optionsSummaryData,
    loading: apiLoading,
    error: optionsSummaryError,
    loadStandardFieldOptionsSummary,
  } = useStandardFieldOptionsSummary();

  // Combined loading state
  const optionsSummaryLoading = apiLoading || reduxLoading;

  const standardFieldLabel = useMemo(
    () => getFieldAssignmentLabel(field.key) as StandardFieldLabel | null,
    [field.key],
  );

  const showAddButton = ['SERVICE_ITEM', 'CLASS', 'LOCATION'].includes(
    standardFieldLabel || '',
  );

  // Load data on mount
  useEffect(() => {
    if (!initialLoadRef.current && standardFieldLabel) {
      initialLoadRef.current = true;

      // Reset state and load initial data
      setCurrentPage(1);
      dispatch(resetStandardFieldOptionsSummaryState());
      loadStandardFieldOptionsSummary({
        standardFieldLabel,
        first: pageSize,
        searchText: undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [standardFieldLabel]);

  // Fetch data when search text changes - server-side search
  useEffect(() => {
    if (initialLoadRef.current && standardFieldLabel) {
      // Reset pagination for fresh search
      setCurrentPage(1);
      dispatch(resetStandardFieldOptionsSummaryState());
      loadStandardFieldOptionsSummary({
        standardFieldLabel,
        first: pageSize,
        searchText: searchValue.trim() || undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  // Search handler - triggers server-side search via useEffect
  const handleSearchChange = useCallback(
    (value: string) => {
      // Track search engagement when user types
      if (value.trim()) {
        track(
          STANDARD_FIELD_ASSIGNMENTS_TRACKING_POINTS.SEARCH_FIELDS_IN_ASSIGNMENT_DRAWER,
        );
      }
      setSearchValue(value);
    },
    [track],
  );

  // Handle API response - sync to Redux store
  useEffect(() => {
    if (optionsSummaryData && !apiLoading && optionsSummaryData.edges) {
      const edgesData = optionsSummaryData.edges.map((edge) => ({
        cursor: edge.cursor,
        node: {
          id: edge.node.id,
          name: edge.node.name,
          standardFieldLabel: edge.node.standardFieldLabel,
          customerAssignmentCount: edge.node.customerAssignmentCount,
          workerAssignmentCount: edge.node.workerAssignmentCount,
        },
      }));

      if (allItems.length === 0 || currentFieldLabel !== standardFieldLabel) {
        // First page load or field changed
        dispatch(
          setInitialData({
            edges: edgesData,
            totalWorkerCount: optionsSummaryData.totalWorkerCount || 0,
            totalCustomerCount: optionsSummaryData.totalCustomerCount || 0,
            totalOptionsCount: optionsSummaryData.totalOptionsCount || 0,
            hasNextPage: optionsSummaryData.pageInfo?.hasNextPage || false,
            startCursor: optionsSummaryData.pageInfo?.startCursor || null,
            endCursor: optionsSummaryData.pageInfo?.endCursor || null,
            fieldLabel: standardFieldLabel || '',
          }),
        );
      } else {
        // Subsequent pages (append)
        dispatch(
          appendData({
            edges: edgesData,
            hasNextPage: optionsSummaryData.pageInfo?.hasNextPage || false,
            startCursor: optionsSummaryData.pageInfo?.startCursor || null,
            endCursor: optionsSummaryData.pageInfo?.endCursor || null,
          }),
        );
      }
    }
  }, [
    optionsSummaryData,
    apiLoading,
    allItems.length,
    currentFieldLabel,
    standardFieldLabel,
    dispatch,
  ]);

  const text = useCallback(
    (id: string, values?: Record<string, any>) =>
      intl.formatMessage({ id }, values),
    [intl],
  );

  // Get assignment display text using shared utility
  const getAssignmentText = useCallback(
    (assignmentCount: number, totalCount: number) =>
      getAssignmentDisplayText(assignmentCount, totalCount, intl).text,
    [intl],
  );

  // Page change handler - fetch more data if needed
  const handlePageChange = useCallback(
    (newPage: number) => {
      setCurrentPage(newPage);

      // Fetch more data if needed
      if (standardFieldLabel) {
        const startIndex = (newPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;

        if (endIndex > allItems.length && hasMore && !optionsSummaryLoading) {
          dispatch(setLoading(true));
          loadStandardFieldOptionsSummary({
            standardFieldLabel,
            first: pageSize,
            after: endCursor || undefined,
            searchText: searchValue.trim() || undefined,
          });
        }
      }
    },
    [
      standardFieldLabel,
      allItems.length,
      hasMore,
      endCursor,
      optionsSummaryLoading,
      pageSize,
      searchValue,
      dispatch,
      loadStandardFieldOptionsSummary,
    ],
  );

  // Get current page items
  const currentPageItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return allItems.slice(startIndex, endIndex);
  }, [allItems, currentPage, pageSize]);

  // Handler for assign customers action
  const handleAssignCustomers = useCallback(
    (option: StandardFieldOptionNode) => {
      // Track assign customers click for standard field item
      track({
        ...STANDARD_FIELD_ASSIGNMENTS_TRACKING_POINTS.VIEW_CUSTOMER_ASSIGNMENT_DRAWER,
        assigned_to: 'standard_field_item',
      });
      setActiveOptionForAssignment({
        id: option.id,
        name: option.name,
      });
    },
    [track],
  );

  // Handler for assign workers action
  const handleAssignWorkers = useCallback(
    (option: StandardFieldOptionNode) => {
      // Track assign workers click for standard field item
      track({
        ...STANDARD_FIELD_ASSIGNMENTS_TRACKING_POINTS.VIEW_WORKER_ASSIGNMENT_DRAWER,
        assigned_to: 'standard_field_item',
      });
      setActiveOptionForWorkerAssignment({
        id: option.id,
        name: option.name,
      });
    },
    [track],
  );

  // Get cursor for current page (cursor of last item on previous page, or null for page 1)
  const getCurrentPageCursor = useCallback(() => {
    if (currentPage === 1) {
      return undefined;
    }
    // Get cursor of the last item on the previous page
    const lastItemIndexOfPrevPage = (currentPage - 1) * pageSize - 1;
    if (
      lastItemIndexOfPrevPage >= 0 &&
      lastItemIndexOfPrevPage < allItems.length
    ) {
      return allItems[lastItemIndexOfPrevPage].cursor;
    }
    return undefined;
  }, [currentPage, pageSize, allItems]);

  // Handler for showing success message (for customer assignment)
  const handleShowSuccess = useCallback(
    (msg: string) => {
      setSuccessMessage(msg);
      setShowSuccessToast(true);
      setActiveOptionForAssignment(null); // Close drawer
      // Refetch list from beginning to show updated assignment counts
      if (standardFieldLabel) {
        setCurrentPage(1);
        dispatch(resetStandardFieldOptionsSummaryState());
        loadStandardFieldOptionsSummary({
          standardFieldLabel,
          first: pageSize,
          searchText: searchValue.trim() || undefined,
        });
      }
    },
    [
      loadStandardFieldOptionsSummary,
      standardFieldLabel,
      pageSize,
      searchValue,
      dispatch,
    ],
  );

  // Handler for showing success message (for worker assignment)
  const handleWorkerAssignmentSuccess = useCallback(
    (msg: string) => {
      setSuccessMessage(msg);
      setShowSuccessToast(true);
      setActiveOptionForWorkerAssignment(null); // Close drawer
      // Refetch list from beginning to show updated assignment counts
      if (standardFieldLabel) {
        setCurrentPage(1);
        dispatch(resetStandardFieldOptionsSummaryState());
        loadStandardFieldOptionsSummary({
          standardFieldLabel,
          first: pageSize,
          searchText: searchValue.trim() || undefined,
        });
      }
    },
    [
      loadStandardFieldOptionsSummary,
      standardFieldLabel,
      pageSize,
      searchValue,
      dispatch,
    ],
  );

  // Handler for showing error message (for customer assignment)
  const handleError = useCallback((error: DetailedErrorInfo) => {
    setErrorInfo(error);

    if (error.isPartialSuccess) {
      // For partial success, close drawer and refresh the data
      setActiveOptionForAssignment(null);
    }
    // For pure errors, keep drawer open
  }, []);

  // Handler for showing error message (for worker assignment)
  const handleWorkerAssignmentError = useCallback(
    (error: DetailedErrorInfo) => {
      setErrorInfo(error);

      if (error.isPartialSuccess) {
        // For partial success, close drawer and refresh the data
        setActiveOptionForWorkerAssignment(null);
      }
      // For pure errors, keep drawer open
    },
    [],
  );

  // Handler for Add drawer success - refetch from beginning (new item can appear anywhere)
  const handleSaveSuccess = useCallback(() => {
    setShowAddDrawer(false);
    setSuccessMessage(
      intl.formatMessage(
        { id: 'time-entries.add.success' },
        { fieldName: fieldTitle },
      ),
    );
    setShowSuccessToast(true);

    if (standardFieldLabel) {
      setCurrentPage(1);
      dispatch(resetStandardFieldOptionsSummaryState());
      loadStandardFieldOptionsSummary({
        standardFieldLabel,
        first: pageSize,
        searchText: searchValue.trim() || undefined,
      });
    }
  }, [
    standardFieldLabel,
    pageSize,
    searchValue,
    fieldTitle,
    intl,
    dispatch,
    loadStandardFieldOptionsSummary,
  ]);

  // Calculate pagination
  const totalPages = Math.ceil(totalOptionsCount / pageSize) || 1;

  // Show pagination when there's more than one page OR when there's more data to fetch
  const showPagination = totalPages > 1 || hasMore;

  const columns = useMemo(
    () =>
      FIELD_ASSIGNMENT_TABLE_COLUMNS.map((column) => ({
        key: column.key,
        header:
          column.key === 'name'
            ? text(column.translationKey, {
                fieldName: fieldTitle,
                count: totalOptionsCount,
              })
            : text(column.translationKey),
      })),
    [text, fieldTitle, totalOptionsCount],
  );

  const renderRow = useCallback(
    (node: StandardFieldOptionNode) => (
      <Table.Row
        key={node.id}
        data-testid={`standard-field-option-row-${node.id}`}
      >
        <DisplayCell data-testid={`option-name-${node.id}`}>
          {node.name}
        </DisplayCell>
        <Table.Cell data-testid={`option-customers-${node.id}`}>
          {getAssignmentText(node.customerAssignmentCount, totalCustomerCount)}
        </Table.Cell>
        <Table.Cell data-testid={`option-workers-${node.id}`}>
          {getAssignmentText(node.workerAssignmentCount, totalWorkerCount)}
        </Table.Cell>
        <Table.Cell data-testid={`option-actions-${node.id}`}>
          <ActionCellContent>
            <ComboLink
              label={text('time-entries.action.assign-customers')}
              size="mini"
              onClick={() => handleAssignCustomers(node)}
              onSelect={(event) => {
                const value = (event.target as any)?.value;
                if (value === STANDARD_FIELD_ACTIONS.ASSIGN_WORKERS) {
                  handleAssignWorkers(node);
                }
              }}
              data-testid={`option-action-combo-link-${node.id}`}
            >
              <MenuItem value={STANDARD_FIELD_ACTIONS.ASSIGN_WORKERS}>
                {text('time-entries.action.assign-workers')}
              </MenuItem>
            </ComboLink>
          </ActionCellContent>
        </Table.Cell>
      </Table.Row>
    ),
    [
      getAssignmentText,
      text,
      totalCustomerCount,
      totalWorkerCount,
      handleAssignCustomers,
      handleAssignWorkers,
    ],
  );

  // Check if current page has full data (all items loaded for this page)
  const isCurrentPageComplete = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    // Page is complete if we have all items for this page, or if it's the last page with remaining items
    const hasAllItemsForPage = allItems.length >= endIndex;
    const isLastPageWithData =
      !hasMore && currentPageItems.length > 0 && allItems.length <= endIndex;
    return hasAllItemsForPage || isLastPageWithData;
  }, [currentPage, pageSize, allItems, hasMore, currentPageItems]);

  // Check if showing no search results
  const showNoSearchResults =
    !optionsSummaryLoading &&
    searchValue.trim() &&
    currentPageItems.length === 0;

  // Memoize table rows for performance
  const tableRows = useMemo(() => {
    // Show loader when loading and current page doesn't have complete data
    if (optionsSummaryLoading && !isCurrentPageComplete) {
      return (
        <Table.Row>
          <Table.Cell colSpan={4}>
            <LoadingContainer>
              <Activity shape="dots" size="large" />
            </LoadingContainer>
          </Table.Cell>
        </Table.Row>
      );
    }

    // Show no search results message when search returns empty
    if (showNoSearchResults) {
      return (
        <Table.Row>
          <Table.Cell colSpan={4}>
            <EmptyStateContainer>
              {text('time-entries.search.noResults')}
            </EmptyStateContainer>
          </Table.Cell>
        </Table.Row>
      );
    }

    if (!optionsSummaryLoading && !currentPageItems.length) {
      return (
        <Table.Row>
          <Table.Cell colSpan={4}>
            <EmptyStateContainer>
              {text('time-entries.empty.state', {
                fieldName: fieldTitle.toLowerCase(),
              })}
            </EmptyStateContainer>
          </Table.Cell>
        </Table.Row>
      );
    }

    return currentPageItems.map(({ node }) => renderRow(node));
  }, [
    optionsSummaryLoading,
    isCurrentPageComplete,
    currentPageItems,
    showNoSearchResults,
    fieldTitle,
    text,
    renderRow,
  ]);

  return (
    <FieldAssignmentContainer data-testid="field-assignment-detail-view">
      {/* Error message from field assignment - shown above back button */}
      {errorInfo && (
        <ErrorContainer>
          <PageMessage
            type={errorInfo.isPartialSuccess ? 'warn' : 'error'}
            onClose={() => setErrorInfo(null)}
          >
            <div>
              <strong>{errorInfo.title}</strong>
              {errorInfo.subtitle && <div>{errorInfo.subtitle}</div>}
            </div>
          </PageMessage>
        </ErrorContainer>
      )}

      <BackButtonContainer>
        <BackLink
          onClick={onBack}
          aria-label={text(
            'time-entries.section.title.time-sheet-settings-header',
          )}
          data-testid="field-assignment-back-button"
        >
          <CaretLeft size="small" />
          {text('time-entries.section.title.time-sheet-settings-header')}
        </BackLink>
      </BackButtonContainer>

      <PageTitle data-testid="field-assignment-detail-title">
        {fieldTitle}
      </PageTitle>

      <SearchAndAddRow>
        <SearchWrapper>
          <SearchField
            value={searchValue}
            onChange={handleSearchChange}
            label={text('time-entries.search.label')}
            placeholder={text('time-entries.search.placeholder')}
          />
        </SearchWrapper>
        {showAddButton && (
          <Button
            priority="primary"
            size="medium"
            onClick={() => {
              track(
                STANDARD_FIELD_ASSIGNMENTS_TRACKING_POINTS.ADD_STANDARD_FIELD_ITEM,
              );
              setShowAddDrawer(true);
            }}
            data-testid="field-assignment-add-button"
          >
            {text('time-entries.add.button', { fieldName: fieldTitle })}
          </Button>
        )}
      </SearchAndAddRow>

      {optionsSummaryError ? (
        <ErrorContainer>
          <PageMessage type="error" open dismissible={false}>
            {text('catch.all.error.content')}
          </PageMessage>
        </ErrorContainer>
      ) : (
        <>
          <FieldAssignmentStyledTable
            hover="row"
            responsive="pin"
            divider="horizontal"
            data-testid="field-assignment-detail-table"
          >
            <Table.Header>
              <Table.Row>
                {columns.map((column) =>
                  column.key === 'actions' ? (
                    <ActionsHeaderCell key={column.key}>
                      {column.header}
                    </ActionsHeaderCell>
                  ) : (
                    <Table.Cell key={column.key}>{column.header}</Table.Cell>
                  ),
                )}
              </Table.Row>
            </Table.Header>
            <Table.Body data-testid="field-assignment-detail-table-body">
              {tableRows}
            </Table.Body>
          </FieldAssignmentStyledTable>

          {/* Pagination - hidden when only one page and no more data */}
          {showPagination && (
            <PaginationContainer>
              <Pagination
                totalPages={totalPages}
                totalItems={totalOptionsCount}
                pageSize={pageSize}
                activePage={currentPage}
                preventPageJump
                onPageChange={handlePageChange}
                data-testid="field-assignment-detail-pagination"
              />
            </PaginationContainer>
          )}
        </>
      )}

      {/* Success toast */}
      {showSuccessToast && (
        <SuccessToast
          message={successMessage}
          open={showSuccessToast}
          onClose={() => setShowSuccessToast(false)}
        />
      )}

      {/* Standard Field Assignment Integration for customer assignments */}
      {activeOptionForAssignment && (
        <StandardFieldAssignmentIntegration
          field={field}
          fieldDisplayName={fieldTitle}
          standardFieldOption={activeOptionForAssignment}
          onClose={() => setActiveOptionForAssignment(null)}
          onError={handleError}
          onShowSuccess={handleShowSuccess}
        />
      )}

      {/* Standard Field Worker Assignment Integration for worker assignments */}
      {activeOptionForWorkerAssignment && (
        <StandardFieldWorkerAssignmentIntegration
          field={field}
          fieldDisplayName={fieldTitle}
          standardFieldOption={activeOptionForWorkerAssignment}
          onClose={() => setActiveOptionForWorkerAssignment(null)}
          onError={handleWorkerAssignmentError}
          onShowSuccess={handleWorkerAssignmentSuccess}
        />
      )}

      {/* Add drawer widgets - same as quickfind */}
      {showAddDrawer && standardFieldLabel === 'SERVICE_ITEM' && (
        <Widget
          widgetId="qbo-ps-drawer-ui/product-service-drawer"
          type="productService"
          subTypes={['SERVICE', 'NONINVENTORY']}
          defaultType="SERVICE"
          handleCancel={() => setShowAddDrawer(false)}
          handleSaveSuccess={handleSaveSuccess}
        />
      )}
      {showAddDrawer && standardFieldLabel === 'CLASS' && (
        <Widget
          widgetId="qbo-entity-drawer/classdrawer"
          type="klass"
          handleCancel={() => setShowAddDrawer(false)}
          handleSaveSuccess={handleSaveSuccess}
        />
      )}
      {showAddDrawer && standardFieldLabel === 'LOCATION' && (
        <Widget
          widgetId="qbo-location-drawer/locationdrawer"
          type="locationV2"
          open
          handleCancel={() => setShowAddDrawer(false)}
          handleSaveSuccess={handleSaveSuccess}
        />
      )}
    </FieldAssignmentContainer>
  );
};

export default FieldAssignmentDetailView;

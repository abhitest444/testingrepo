import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useIntl, useTracking } from '@payroll/quicksand';
import PageMessage from '@ids-ts/page-message';
import Typography from '@ids-ts/typography';
import { useTimeAgainstAssignments } from 'src/js/service/hooks/assignments/useTimeAgainstAssignments';
import {
  useManageCustomFieldAssignment,
  PartialSuccessErrorInfo,
} from 'src/js/service/hooks/assignments/useManageCustomFieldAssignment';
import {
  useManageCustomFieldOptionTimeAgainstAssignment,
  PartialSuccessErrorInfo as OptionPartialSuccessErrorInfo,
} from 'src/js/service/hooks/assignments/useManageCustomFieldOptionTimeAgainstAssignment';
import AssignmentDrawer from 'src/js/widgets/common/AssignmentDrawer/AssignmentDrawer';
import {
  AssignmentItem,
  AssignmentDrawerConfig,
  AssignmentChanges,
  FetchParams,
} from 'src/js/widgets/common/AssignmentDrawer/types';
import { transformTimeAgainstIds } from 'src/js/widgets/common/AssignmentDrawer/assignmentUtils';
import { DetailedErrorInfo } from 'src/js/widgets/assignments/types';
import { CUSTOM_FIELD_ASSIGNMENT_DRAWER_TRACKING_POINTS } from '../../assignments/utils/assignmentsTrackingPoints';
import { CustomField, CustomFieldOption } from '../store/customFieldsSlice';
import { useAppDispatch, useAppSelector } from '../store';
import {
  selectCustomerAssignmentsAllItems,
  selectCustomerAssignmentsTotalCount,
  selectCustomerAssignmentsLoading,
  selectCustomerAssignmentsEndCursor,
  selectCustomerAssignmentsHasMore,
  resetCustomerAssignmentsState,
  setLoading,
  appendData,
  CUSTOMER_ASSIGNMENT_PAGE_SIZE,
} from '../store/customerAssignmentsSlice';

interface CustomerAssignmentIntegrationProps {
  customField: CustomField;
  customFieldOption?: CustomFieldOption;
  onClose: () => void;
  onError?: (errorInfo: DetailedErrorInfo) => void;
  onShowSuccess?: (message: string) => void;
}

const CustomerAssignmentIntegration: React.FC<
  CustomerAssignmentIntegrationProps
> = ({ customField, customFieldOption, onClose, onError, onShowSuccess }) => {
  const intl = useIntl();
  const track = useTracking();
  const dispatch = useAppDispatch();

  const allItems = useAppSelector(selectCustomerAssignmentsAllItems);
  const totalCount = useAppSelector(selectCustomerAssignmentsTotalCount);
  const reduxLoading = useAppSelector(selectCustomerAssignmentsLoading);
  const endCursor = useAppSelector(selectCustomerAssignmentsEndCursor);
  const hasMore = useAppSelector(selectCustomerAssignmentsHasMore);

  const [drawerError, setDrawerError] = useState<DetailedErrorInfo | null>(
    null,
  );

  const isMountedRef = useRef(true);
  useEffect(
    () => () => {
      isMountedRef.current = false;
    },
    [],
  );

  const handleMutationSuccess = useCallback(() => {
    onShowSuccess?.(
      intl.formatMessage({
        id: 'assignments.customFieldAssignment.saveSuccess',
      }),
    );
  }, [intl, onShowSuccess]);

  const handleMutationPartialSuccess = useCallback(
    (errorInfo: PartialSuccessErrorInfo) => {
      onError?.({
        title: intl.formatMessage(
          { id: 'assignments.customFieldAssignment.partialSuccess.title' },
          { successCount: errorInfo.successCount },
        ),
        isPartialSuccess: true,
      });
    },
    [intl, onError],
  );

  const handleOptionMutationPartialSuccess = useCallback(
    (errorInfo: OptionPartialSuccessErrorInfo) => {
      onError?.({
        title: intl.formatMessage(
          { id: 'assignments.customFieldAssignment.partialSuccess.title' },
          { successCount: errorInfo.customers.successCount },
        ),
        isPartialSuccess: true,
      });
    },
    [intl, onError],
  );

  const handleMutationError = useCallback(
    (errorMessage: string) => {
      if (isMountedRef.current) {
        setDrawerError({
          title: intl.formatMessage({
            id: 'assignments.fieldAssignment.error.title',
          }),
          subtitle: errorMessage,
        });
      }
    },
    [intl],
  );

  const [manageCustomFieldAssignment, { loading: mutationLoading }] =
    useManageCustomFieldAssignment({
      onSuccess: handleMutationSuccess,
      onPartialSuccess: handleMutationPartialSuccess,
      onError: handleMutationError,
    });

  const [
    manageCustomFieldOptionTimeAgainstAssignment,
    { loading: optionMutationLoading },
  ] = useManageCustomFieldOptionTimeAgainstAssignment({
    onSuccess: handleMutationSuccess,
    onPartialSuccess: handleOptionMutationPartialSuccess,
    onError: handleMutationError,
  });

  const {
    loadTimeAgainstAssignments,
    data: apiData,
    pageInfo: apiPageInfo,
    totalTimeAgainstCount,
  } = useTimeAgainstAssignments();

  useEffect(() => {
    dispatch(resetCustomerAssignmentsState());
    // Track drawer open
    track(
      CUSTOM_FIELD_ASSIGNMENT_DRAWER_TRACKING_POINTS.VIEW_CUSTOMER_ASSIGNMENT_DRAWER_CUSTOM_FIELD,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (apiData && apiData.length > 0) {
      const transformedItems: AssignmentItem[] = apiData.map(
        (item): AssignmentItem => ({
          id:
            item.timeAgainstContactDAS.customer?.id ||
            item.timeAgainstContactDAS.project?.id ||
            '',
          name: item.displayName || item.fullName || '',
          level: item.level ?? 0,
          parentId: item.parentId,
          hasChildren: (item.numChildren ?? 0) > 0,
          isSelected: item.assigned,
        }),
      );

      dispatch(
        appendData({
          items: transformedItems,
          totalCount: totalTimeAgainstCount || transformedItems.length,
          hasNextPage: apiPageInfo?.hasNextPage || false,
          endCursor: apiPageInfo?.endCursor || null,
        }),
      );
    } else if (totalTimeAgainstCount !== null && apiData.length === 0) {
      // Data loaded but empty (0 customers) - set loading to false
      dispatch(setLoading(false));
    }
  }, [apiData, apiPageInfo, totalTimeAgainstCount, dispatch]);

  const initialSelections = useMemo(
    () =>
      new Set(
        allItems.filter((item) => item.isSelected).map((item) => item.id),
      ),
    [allItems],
  );

  const handleSave = useCallback(
    async (changes: AssignmentChanges) => {
      track(
        CUSTOM_FIELD_ASSIGNMENT_DRAWER_TRACKING_POINTS.SAVE_CUSTOMER_ASSIGNMENTS_CUSTOM_FIELD,
      );
      const input: any = {
        customFieldId: customField.id,
      };

      // Add customFieldOptionId if dealing with an option
      if (customFieldOption?.id) {
        input.customFieldOptionId = customFieldOption.id;
      }

      if (changes.isSelectAll) {
        input.assignToAll = true;
      } else {
        const timeAgainstToAssign = transformTimeAgainstIds(
          changes.newlyAssigned,
          apiData,
        );
        const timeAgainstToUnassign = transformTimeAgainstIds(
          changes.newlyUnassigned,
          apiData,
        );

        input.timeAgainstAssignments = {
          timeAgainstToAssign:
            timeAgainstToAssign.length > 0 ? timeAgainstToAssign : [],
          timeAgainstToUnassign:
            timeAgainstToUnassign.length > 0 ? timeAgainstToUnassign : [],
        };
      }

      // Use option-specific mutation if customFieldOption exists, otherwise use field-level mutation
      if (customFieldOption?.id) {
        await manageCustomFieldOptionTimeAgainstAssignment({
          variables: { input },
        });
      } else {
        await manageCustomFieldAssignment({
          variables: { input },
        });
      }
    },
    [
      customField.id,
      customFieldOption?.id,
      manageCustomFieldAssignment,
      manageCustomFieldOptionTimeAgainstAssignment,
      apiData,
      track,
    ],
  );

  const fetchData = useCallback(
    async (params: FetchParams) => {
      const page = params.page || 1;
      const pageSize = CUSTOMER_ASSIGNMENT_PAGE_SIZE;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;

      // Only fetch if we haven't fetched yet (totalTimeAgainstCount is null before first fetch)
      if (
        allItems.length === 0 &&
        !reduxLoading &&
        totalTimeAgainstCount === null
      ) {
        dispatch(setLoading(true));

        // Always send customFieldId, add customFieldOptionId if present
        const queryInput: {
          customFieldId: string;
          customFieldOptionId?: string;
        } = {
          customFieldId: customField.id!,
        };
        if (customFieldOption?.id) {
          queryInput.customFieldOptionId = customFieldOption.id;
        }

        loadTimeAgainstAssignments({
          first: CUSTOMER_ASSIGNMENT_PAGE_SIZE,
          input: queryInput,
          filter: {},
          fetchPolicy: 'no-cache',
        });
        return { items: [], totalCount: 0 };
      }

      if (endIndex <= allItems.length) {
        return {
          items: allItems.slice(startIndex, endIndex),
          totalCount,
        };
      }

      // Need more data - trigger API and return empty to show loading
      if (hasMore && endCursor && !reduxLoading) {
        dispatch(setLoading(true));

        // Always send customFieldId, add customFieldOptionId if present
        const queryInput: {
          customFieldId: string;
          customFieldOptionId?: string;
        } = {
          customFieldId: customField.id!,
        };
        if (customFieldOption?.id) {
          queryInput.customFieldOptionId = customFieldOption.id;
        }

        loadTimeAgainstAssignments({
          first: CUSTOMER_ASSIGNMENT_PAGE_SIZE,
          after: endCursor,
          input: queryInput,
          filter: {},
          fetchPolicy: 'no-cache',
        });
        return { items: [], totalCount };
      }

      // No more data or already loading
      return {
        items: allItems.slice(startIndex, endIndex),
        totalCount,
      };
    },
    [
      allItems,
      totalCount,
      hasMore,
      endCursor,
      reduxLoading,
      totalTimeAgainstCount,
      customField.id,
      customFieldOption?.id,
      loadTimeAgainstAssignments,
      dispatch,
    ],
  );

  const config: AssignmentDrawerConfig = useMemo(
    () => ({
      assignmentType: 'CustomerAssignment',
      dataSource: {
        fetchData,
        searchMode: 'client',
      },
      ui: {
        searchPlaceholder: '',
        searchSupported: true,
        searchExpandable: true,
        fieldName: customFieldOption
          ? customFieldOption.name
          : customField.name,
      },
      table: {
        columns: [{ key: 'name', header: '' }],
        sortable: false,
        defaultExpanded: true,
        hierarchicalSelection: true, // Enable parent-child cascade selection
      },
      pagination: {
        enabled: true,
        defaultPageSize: CUSTOMER_ASSIGNMENT_PAGE_SIZE,
      },
      callbacks: {
        onSave: handleSave,
        onSearch: (searchValue: string) => {
          if (searchValue.trim()) {
            track(
              CUSTOM_FIELD_ASSIGNMENT_DRAWER_TRACKING_POINTS.SEARCH_CUSTOMERS_ASSIGNMENT_DRAWER,
            );
          }
        },
      },
    }),
    [fetchData, customField.name, customFieldOption, handleSave, track],
  );

  const errorMessageComponent = drawerError ? (
    <PageMessage
      type="error"
      open
      onClose={() => setDrawerError(null)}
      title={drawerError.title}
    >
      {drawerError.subtitle && (
        <Typography variant="body-3" weight="demi">
          {drawerError.subtitle}
        </Typography>
      )}
      {drawerError.description && (
        <Typography variant="body-3">{drawerError.description}</Typography>
      )}
    </PageMessage>
  ) : undefined;

  if (!customField.id) {
    return null;
  }

  const handleClose = () => {
    track(
      CUSTOM_FIELD_ASSIGNMENT_DRAWER_TRACKING_POINTS.CANCEL_CUSTOMER_ASSIGNMENTS_CUSTOM_FIELD,
    );
    onClose();
  };

  return (
    <AssignmentDrawer
      open
      onClose={handleClose}
      config={config}
      initialSelections={initialSelections}
      loading={reduxLoading || mutationLoading || optionMutationLoading}
      errorMessage={errorMessageComponent}
    />
  );
};

export default CustomerAssignmentIntegration;

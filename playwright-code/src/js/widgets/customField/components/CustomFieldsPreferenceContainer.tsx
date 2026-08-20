import React, {
  useCallback,
  useEffect,
  useRef,
  useMemo,
  useState,
} from 'react';
import Trowser from '@ids-ts/trowser';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import { Activity } from '@ids-ts/loader';
import { Button } from '@ids-ts/button';
import styled from 'styled-components';
import PageMessage from '@ids-ts/page-message';
import UID from '@appfabric/ui-data-layer';
import Widget from 'web-shell-core/widgets/HOCWidget';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';
import { FEATURE_FLAGS } from 'src/js/common/constants';
import { useGetCustomFields } from 'src/js/service/hooks/timeEntries/useGetCustomFields';
import { ConfirmationModal } from 'src/js/widgets/common/ConfirmationModal';
import { useManageCustomFields } from 'src/js/service/hooks/timeEntries/useManageCustomFields';
import {
  useUxPreferences,
  UxPreferenceKey,
} from 'src/js/service/utils/useUXPreferences';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  selectCustomFields,
  selectCustomFieldsLoading,
  selectCustomFieldsError,
  selectOriginalCustomFields,
  setCustomFields,
  setOriginalCustomFields,
  setLoading,
  setError,
  CustomField,
  CustomFieldOption,
} from '../store/customFieldsSlice';
import CustomFieldsTable from './CustomFieldsTable';
import { PAGINATION_DEFAULTS } from '../utils/constants';
import { CustomFieldsTourSteps } from '../utils/tourSteps';
import { CUSTOM_FIELDS_TRACKING_POINTS } from '../../../common/useClickTracking';
import CustomFieldsPopoverTourAdapter from './CustomFieldsPopoverTourAdapter';
import CustomFieldsWhatsNewButton from './CustomFieldsWhatsNewButton';
import { CustomFieldData } from '../../timeTrackingSettings/types';
import { useCustomFieldTransformer } from '../hooks/useCustomFieldTransformer';

interface CustomFieldsPreferenceContainerProps {
  onClose: () => void;
  open: boolean;
  setShowCustomFieldDrawer?: (show: boolean) => void;
  setCustomFieldData?: (data: CustomFieldData | null) => void;
  refreshTrigger?: number;
}

const CenteredLoader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
`;

const BackdropLoader = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(
    --color-container-overlay
  ); /* (SemanticContextMatchOnly) */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
`;

const ContentWrapper = styled.div`
  position: relative;
  min-height: 300px;
`;

const ModalContentWrapper = styled.div`
  padding: 16px 0;
  text-align: center;
`;

const mapGraphQLToCustomField = (graphqlField: any): CustomField => ({
  ...graphqlField,
  isActive: !graphqlField.deleted,
  isRequired: graphqlField.required || false,
  options: graphqlField.options || [],
});

const StyledPageMessage = styled(PageMessage)`
  &&& {
    align-items: flex-start;
    margin: 0 107px 1em 107px;
    flex: 0 1 auto;
  }
`;

const CustomFieldsPreferenceContainer: React.FC<
  CustomFieldsPreferenceContainerProps
> = ({
  onClose,
  open,
  setShowCustomFieldDrawer,
  refreshTrigger,
  setCustomFieldData,
}) => {
  const sandbox = useSandbox();
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const track = useTracking();
  const { transformCustomField } = useCustomFieldTransformer();

  const tourPopoverRef = useRef(false);

  const customFieldsTableHeaderRef = useRef<HTMLElement>(null);
  const customersColumnRef = useRef<HTMLElement>(null);
  const workersColumnRef = useRef<HTMLElement>(null);

  // Guided tooltip state - controlled by onReady callback from TourFramework
  const [showGuidedToolTip, setShowGuidedToolTip] = useState<boolean>(false);

  // Feature flag checks for tour only
  const { isEnabled: isPostR2ReleaseTimeExperienceEnabled } = useIXPFeatureFlag(
    {
      flagName: FEATURE_FLAGS.QB_TIME_TRACKING_UI_R2_RELEASE,
      defaultValue: false,
    },
  );
  const { isEnabled: isAssignmentsEnabled } = useIXPFeatureFlag({
    flagName: FEATURE_FLAGS.SBSEG_QBO_R4_ASSIGNMENTS,
    defaultValue: false,
    checkIESMasterFlag: true,
    excludePayrollFirst: true,
  });

  // Only enable tour if both feature flags are true
  const isTourFeatureEnabled = isPostR2ReleaseTimeExperienceEnabled;

  // Load preference when component opens
  const [tourOpen, setTourOpen] = useState(true);
  const {
    data: uxPreferencesData,
    getPreference,
    setPreference,
  } = useUxPreferences();

  // Add ref to track initialization and prevent memory leaks
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (!hasInitializedRef.current) {
      getPreference(UxPreferenceKey.CUSTOM_FIELDS_TOUR_COMPLETED);
      hasInitializedRef.current = true;
    }
  }, [getPreference]);

  // Cleanup function to reset initialization flag on unmount
  useEffect(
    () => () => {
      hasInitializedRef.current = false;
    },
    [],
  );

  // Track drawer view on mount
  useEffect(() => {
    if (open) {
      // Reset processed flag when modal opens to ensure fresh data processing
      hasProcessedData.current = false;
      track(CUSTOM_FIELDS_TRACKING_POINTS.CUSTOM_FIELDS_DRAWER);
    }
  }, [open, track]);

  const { manageCustomFields, loading: saveLoading } = useManageCustomFields({
    onSuccess: () => {
      dispatch(setError(null));
      dispatch(setLoading(false));
      setShowError(false);
      onClose();
      // End customer interaction with success
      endInteractionWithSuccess(
        sandbox,
        TimeCustomerInteraction.CUSTOM_FIELDS_REQUIRED_UPDATE,
      );
    },
    onError: (error: any) => {
      const errorMessage = error?.message || error;
      dispatch(setError(errorMessage));
      dispatch(setLoading(false));
      setShowError(true);
      // End customer interaction with failure
      endInteractionWithFailure(
        sandbox,
        TimeCustomerInteraction.CUSTOM_FIELDS_REQUIRED_UPDATE,
        errorMessage || 'Custom fields save failed',
        error,
      );
    },
  });

  // Add state for confirmation modal and tracking original data
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [pendingCloseAction, setPendingCloseAction] = useState<
    (() => void) | null
  >(null);
  const hasProcessedData = useRef(false);

  // Add state for error message
  const [showError, setShowError] = useState(false);

  // Fetch custom fields data using the service hook
  const {
    customFields: fetchedCustomFields,
    loading: fetchLoading,
    error: fetchError,
    query: getCustomFields,
    totalCustomerCount,
    totalWorkerCount,
  } = useGetCustomFields();

  // Fetch custom fields when component mounts
  useEffect(() => {
    // Reset processed flag to ensure fresh data processing
    hasProcessedData.current = false;

    getCustomFields({
      variables: {
        filter: {},
      },
    });
  }, [getCustomFields]);

  useEffect(() => {
    if (fetchLoading) {
      dispatch(setLoading(true));
    } else {
      // Always turn off loading when fetch completes, regardless of data
      dispatch(setLoading(false));
    }
  }, [fetchLoading, dispatch]);

  useEffect(() => {
    if (
      !fetchLoading &&
      fetchedCustomFields !== undefined &&
      !hasProcessedData.current
    ) {
      const mappedCustomFields = fetchedCustomFields.map(
        mapGraphQLToCustomField,
      );

      dispatch(setCustomFields(mappedCustomFields));
      // Store original data for comparison
      dispatch(setOriginalCustomFields(mappedCustomFields));
      hasProcessedData.current = true;
    }
  }, [fetchedCustomFields, fetchLoading, dispatch]);

  // Reset the processed flag when component unmounts or when new data is fetched
  useEffect(
    () => () => {
      hasProcessedData.current = false;
    },
    [],
  );

  useEffect(() => {
    if (fetchError) {
      dispatch(setError(fetchError));
      dispatch(setLoading(false));
    }
  }, [fetchError, dispatch]);

  // Trigger refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      // Reset processed flag to ensure fresh data processing on refresh
      hasProcessedData.current = false;

      getCustomFields({
        variables: {
          filter: {},
        },
      });
    }
  }, [refreshTrigger, getCustomFields, dispatch, sandbox.logger]);

  // Start the tour when the container opens and preference allows it
  useEffect(() => {
    if (
      !tourPopoverRef.current &&
      !fetchLoading &&
      uxPreferencesData &&
      isTourFeatureEnabled
    ) {
      const tourCompleted =
        uxPreferencesData[UxPreferenceKey.CUSTOM_FIELDS_TOUR_COMPLETED];
      if (!tourCompleted) {
        setTourOpen(true);
        tourPopoverRef.current = true;
        track(CUSTOM_FIELDS_TRACKING_POINTS.CUSTOM_FIELD_TOUR_MODAL_OPEN);
        sandbox.logger.info('Custom fields tour started');
      } else {
        setTourOpen(false);
        tourPopoverRef.current = true;
        track(CUSTOM_FIELDS_TRACKING_POINTS.CUSTOM_FIELD_TOUR_MODAL_CLOSE);
        sandbox.logger.info('Custom fields tour closed');
      }
    } else if (!isTourFeatureEnabled) {
      setTourOpen(false);
      track(CUSTOM_FIELDS_TRACKING_POINTS.CUSTOM_FIELD_TOUR_MODAL_CLOSE);
      sandbox.logger.info('Custom fields tour closed');
    }
  }, [
    fetchLoading,
    uxPreferencesData,
    isTourFeatureEnabled,
    track,
    sandbox.logger,
  ]);

  // Reset tour when button is clicked
  const handleTourReset = () => {
    setTourOpen(true);
    track(CUSTOM_FIELDS_TRACKING_POINTS.CUSTOM_FIELD_TOUR_MODAL_OPEN);
    sandbox.logger.info('Custom fields tour reset and started');
  };

  // Get data from Redux store
  const customFields = useAppSelector(selectCustomFields);
  const loading = useAppSelector(selectCustomFieldsLoading);
  const originalCustomFields = useAppSelector(selectOriginalCustomFields);

  const error = useAppSelector(selectCustomFieldsError);

  // Memoize tour steps to prevent unnecessary re-renders
  const customFieldsTourSteps = useMemo(
    () =>
      CustomFieldsTourSteps(
        customFieldsTableHeaderRef,
        customersColumnRef,
        workersColumnRef,
        intl,
      ),
    [customFieldsTableHeaderRef, customersColumnRef, intl],
  );

  // Handle tour completion status from TourFramework
  const handleTourReady = useCallback(
    (status: { isCompleted: boolean; isLoading?: boolean }) => {
      if (status.isLoading) {
        return;
      }
      // Show tour if not already completed, hide if completed
      setShowGuidedToolTip(!status.isCompleted);
    },
    [],
  );

  // Add pagination state
  const [currentPage, setCurrentPage] = useState(
    PAGINATION_DEFAULTS.DEFAULT_PAGE,
  );
  const [pageSize, setPageSize] = useState(
    PAGINATION_DEFAULTS.DEFAULT_PAGE_SIZE,
  );

  // Sort custom fields to show active ones on top (before pagination)
  const sortedCustomFields = useMemo(() => {
    const sortCustomFields = (a: CustomField, b: CustomField) => {
      // First sort by active status (active fields first)
      if (a.isActive !== b.isActive) {
        return a.isActive ? -1 : 1;
      }
      // Then sort by name for fields with same active status
      return a.name.localeCompare(b.name);
    };

    return [...customFields].sort(sortCustomFields);
  }, [customFields]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedCustomFields = sortedCustomFields.slice(startIndex, endIndex);
  const text = (id: string, values?: Record<string, string>) =>
    intl.formatMessage({ id }, values);

  // Check if there are unsaved changes by comparing current state with original
  const hasUnsavedChanges = useMemo(() => {
    const hasNoData =
      originalCustomFields.length === 0 || customFields.length === 0;
    if (hasNoData) {
      return false;
    }

    const hasChangedFields = customFields.some(
      (field: CustomField, index: number) => {
        const originalField = originalCustomFields[index];
        const isFieldChanged =
          originalField && field.isRequired !== originalField.isRequired;
        return isFieldChanged;
      },
    );

    return hasChangedFields;
  }, [customFields, originalCustomFields]);

  const handleEdit = (customField: CustomField) => {
    const customFieldData = transformCustomField(customField);
    if (customFieldData) {
      setCustomFieldData?.(customFieldData);
      setShowCustomFieldDrawer?.(true);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRefetch = () => {
    hasProcessedData.current = false;
    getCustomFields({
      variables: {
        filter: {},
      },
    });
  };

  const handleSave = async () => {
    track(CUSTOM_FIELDS_TRACKING_POINTS.CUSTOM_FIELDS_SAVE_BUTTON);
    dispatch(setLoading(true));
    dispatch(setError(null));
    createCustomerInteraction(
      sandbox,
      TimeCustomerInteraction.CUSTOM_FIELDS_REQUIRED_UPDATE,
    );

    // Only include fields that have been modified (toggled)
    const changedFields = customFields
      .map((field: CustomField, index: number) => {
        const originalField = originalCustomFields[index];
        // Check if the field has been modified
        const isFieldChanged =
          originalField && field.isRequired !== originalField.isRequired;

        if (isFieldChanged) {
          return {
            id: field.id,
            name: field.name,
            required: field.isRequired,
          };
        }
        return null;
      })
      .filter(
        (field): field is { id: string; name: string; required: boolean } =>
          field !== null,
      );

    try {
      // Call the mutation through the custom hook with only changed fields
      await manageCustomFields(
        { fields: changedFields },
        TimeCustomerInteraction.CUSTOM_FIELDS_REQUIRED_UPDATE,
      );
    } catch (error: any) {
      dispatch(setError(error?.message));
      dispatch(setLoading(false));
      setShowError(true);
      // End customer interaction with failure
      endInteractionWithFailure(
        sandbox,
        TimeCustomerInteraction.CUSTOM_FIELDS_REQUIRED_UPDATE,
        error?.message || 'Custom fields save failed',
        error,
      );
    }
  };

  const handleCloseWithConfirmation = (closeAction: () => void) => {
    if (hasUnsavedChanges) {
      track(
        CUSTOM_FIELDS_TRACKING_POINTS.CUSTOM_FIELDS_CLOSE_WITH_UNSAVED_CHANGES,
      );
      setPendingCloseAction(() => closeAction);
      setShowConfirmationModal(true);
    } else {
      track(
        CUSTOM_FIELDS_TRACKING_POINTS.CUSTOM_FIELDS_CLOSE_WITHOUT_UNSAVED_CHANGES,
      );
      closeAction();
    }
  };

  const handleConfirmClose = () => {
    track(CUSTOM_FIELDS_TRACKING_POINTS.CUSTOM_FIELDS_CONFIRM_CLOSE);
    setShowConfirmationModal(false);
    if (pendingCloseAction) {
      pendingCloseAction();
      setPendingCloseAction(null);
    }
  };

  const handleCancelClose = () => {
    setShowConfirmationModal(false);
    setPendingCloseAction(null);
  };

  const handleClose = () => {
    handleCloseWithConfirmation(onClose);
  };

  const handleTourClose = async () => {
    try {
      setTourOpen(false);
      track(CUSTOM_FIELDS_TRACKING_POINTS.CUSTOM_FIELD_TOUR_MODAL_CLOSE);
      sandbox.logger.info('Custom fields tour closed');
    } catch (error) {
      sandbox.logger.error('Failed to save tour preference:', { error });
      track(CUSTOM_FIELDS_TRACKING_POINTS.CUSTOM_FIELD_TOUR_MODAL_FAILED);
    }
  };
  const handleTourFinish = async () => {
    try {
      await setPreference(UxPreferenceKey.CUSTOM_FIELDS_TOUR_COMPLETED, true);
      track(CUSTOM_FIELDS_TRACKING_POINTS.CUSTOM_FIELD_TOUR_MODAL_FINISH);
      sandbox.logger.info('Custom fields tour completed successfully');
    } catch (error) {
      const errorMessage = String(error);
      sandbox.logger.error('Failed to save tour preference:', {
        error: errorMessage,
      });
      track(CUSTOM_FIELDS_TRACKING_POINTS.CUSTOM_FIELD_TOUR_MODAL_FAILED);
    }
  };

  return (
    <>
      <Trowser
        dismissible
        open={open}
        onClose={handleClose}
        showCancelFooterButton
        cancelFooterButtonLabel={text('customFields.trowser.cancel')}
        title={text('customFields.trowser.heading')}
        data-testid="custom-fields-preferences-container"
        footerButton={[
          <Button
            key="save-button"
            priority="primary"
            onClick={handleSave}
            isLoading={saveLoading}
            data-testid="save-custom-fields-button"
          >
            {text('customFields.trowser.save')}
          </Button>,
        ]}
      >
        <>
          {/* What's New Button */}
          {!fetchLoading && isTourFeatureEnabled && (
            <CustomFieldsWhatsNewButton onClick={handleTourReset} />
          )}
        </>
        <ContentWrapper>
          {showError && error && (
            <StyledPageMessage
              type="warn"
              onClose={() => setShowError(false)}
              open={showError}
              automationId="CustomFieldsErrorPageMessage"
              title={text('customFields.error.title')}
              dismissible
              style={{ textAlign: 'left', marginBottom: '16px' }}
            >
              {intl.formatMessage({
                id: 'customFields.error.body',
              })}
            </StyledPageMessage>
          )}
          <CustomFieldsTable
            customFields={paginatedCustomFields || []}
            onEdit={handleEdit}
            onPageChange={handlePageChange}
            totalItems={sortedCustomFields.length}
            currentPage={currentPage}
            pageSize={pageSize}
            setCustomFieldData={setCustomFieldData}
            setShowCustomFieldDrawer={setShowCustomFieldDrawer}
            fetchError={!!fetchError}
            totalCustomerCount={totalCustomerCount}
            totalWorkerCount={totalWorkerCount}
            isAssignmentsEnabled={isAssignmentsEnabled}
            onRefetch={handleRefetch}
            tableHeaderRefs={{
              customFieldsTableHeaderRef,
              customersColumnRef,
              workersColumnRef,
            }}
          />
          {(loading || fetchLoading || saveLoading) && (
            <BackdropLoader data-testid="custom-fields-loading">
              <Activity shape="dots" size="large" />
            </BackdropLoader>
          )}
        </ContentWrapper>
      </Trowser>

      <ConfirmationModal
        open={showConfirmationModal}
        setOpen={setShowConfirmationModal}
        onYesClick={handleConfirmClose}
        onNoClick={handleCancelClose}
        yesButtonLabel={text(
          'customFields.unsaved.changes.confirmation.modal.yes',
        )}
        noButtonLabel={text(
          'customFields.unsaved.changes.confirmation.modal.no',
        )}
        size="small"
        dismissible
        actionAlignment="center"
        contentAlignment="center"
        showSectionDivider={false}
        headerAlignment="center"
        title={text('customFields.unsaved.changes.confirmation.modal.header')}
      >
        <ModalContentWrapper />
      </ConfirmationModal>
      {tourOpen && isTourFeatureEnabled && (
        <CustomFieldsPopoverTourAdapter
          open={tourOpen}
          onClose={handleTourClose}
          onFinish={handleTourFinish}
        />
      )}

      {/* Guided Tour for Custom Fields Table - Widget always rendered, open prop controls visibility */}
      {!fetchLoading && isAssignmentsEnabled && (
        <Widget
          key="time-tracking-ui/TourFramework-custom-fields-table"
          widgetId="time-tracking-ui/TourFramework"
          data-testid="guided-tooltip-custom-fields-table-widget"
          tourId="custom-fields-tour"
          open={showGuidedToolTip}
          steps={customFieldsTourSteps}
          mode="tooltip"
          onClose={() => {
            sandbox.logger.info('[CustomFieldsTableTour] User closed tooltip');
            setShowGuidedToolTip(false);
          }}
          onComplete={handleTourReady}
        />
      )}
    </>
  );
};

export default CustomFieldsPreferenceContainer;

import React, { useCallback, useEffect, useRef } from 'react';
import Trowser from '@ids-ts/trowser';
import Button from '@ids-ts/button';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';
import { FEATURE_FLAGS } from 'src/js/common/constants';
import { useAppDispatch, useAppSelector } from './store';
import StepProgressCard from './components/StepProgressCard';
import SplitView from './components/SplitView';
import { setIsUploading } from './store/excelDataSlice';
import {
  setIsImporting,
  setSaveError,
  setIsInitialLoadError,
} from './store/reviewSlice';
import { setTrowserOpen, setCurrentStep } from './store/progressSlice';
import { resetAllSlices } from './store/globalActions';
import {
  selectCurrentStep,
  selectIsUploading,
  selectCardFadeOut,
  selectIsTrowserOpen,
  selectIsExtracting,
  selectIsGlobalProcessing,
  selectUploadId,
  selectSaveResult,
  selectAIPreferencesLoading,
  selectAIPreferencesError,
} from './store/selectors';
import { useCompanySettingsData } from './hooks/useCompanySettingsData';
import { useEmployeeData } from './hooks/useEmployeeData';
import { TimeImportAgenticGlobalStyles } from './base.styles';
import { useAIImportPreferences } from './hooks/useAIImportPreferences';
import Step1Upload from './step1Upload/Step1Upload';
import { ProcessingStep } from './processingStep';
import { Step2Mapping } from './step2Mapping';
import Step3FieldMapping from './step3FieldMapping/Step3FieldMapping';
import { Step5Review } from './step5Review';
import Step6Complete from './step6Complete/Step6Complete';
import { useTimesheetFieldsData } from './hooks/useTimesheetFieldsData';

interface DemoProps {
  isTrowserOpen?: boolean;
  sandbox?: any;
  onClose?: () => void;
}

const TimeImportAgentic: React.FC<DemoProps> = ({
  isTrowserOpen: propIsTrowserOpen = true,
  sandbox,
  onClose,
}) => {
  const dispatch = useAppDispatch();

  // Data fetching - only called when trowser is open
  const {
    settings: companySettings,
    loading: companySettingsLoading,
    error: companySettingsError,
  } = useCompanySettingsData();

  const {
    employees,
    loading: employeeDataLoading,
    error: employeeDataError,
    loadEmployees: refetchEmployeeData,
  } = useEmployeeData();

  const {
    loading: timesheetFieldsDataLoading,
    error: timesheetFieldsDataError,
    hasLoaded: timesheetFieldsDataHasLoaded,
    refetch: refetchTimesheetFieldsData,
  } = useTimesheetFieldsData({
    autoLoad: true,
    first: 250,
  });

  // AI Import preferences - Initialize hook to auto-load into Redux
  useAIImportPreferences(sandbox);

  // Read AI Import preferences from Redux selectors
  const aiPrefLoading = useAppSelector(selectAIPreferencesLoading);
  const aiPrefError = useAppSelector(selectAIPreferencesError);

  // Redux state selectors
  const currentStep = useAppSelector(selectCurrentStep);
  const saveResult = useAppSelector(selectSaveResult);
  const uploadId = useAppSelector(selectUploadId);
  const isTrowserOpenFromStore = useAppSelector(selectIsTrowserOpen);
  const isUploading = useAppSelector(selectIsUploading);
  const cardFadeOut = useAppSelector(selectCardFadeOut);
  const isExtracting = useAppSelector(selectIsExtracting);
  const isGlobalProcessing = useAppSelector(selectIsGlobalProcessing);

  // Get employee and timesheet data state to detect when reset happens
  const employeeDataState = useAppSelector((state) => state.employeeData);
  const timesheetFieldsState = useAppSelector(
    (state) => state.timesheetFieldsData,
  );

  // Track previous uploadId to detect resets
  const prevUploadIdRef = useRef<string>('');
  const hasRefetchedAfterResetRef = useRef(false);

  // Simplified: When uploadId changes (or becomes empty after reset), trigger refetch
  useEffect(() => {
    // If uploadId is empty and we're on Step 1, it means state was reset - refetch data
    // Only refetch once per reset (guard against infinite loops)
    if (!uploadId && currentStep === 1 && !hasRefetchedAfterResetRef.current) {
      hasRefetchedAfterResetRef.current = true;

      const refetchAll = async () => {
        await Promise.all([
          refetchEmployeeData?.(),
          refetchTimesheetFieldsData?.(),
        ]);
      };
      refetchAll();
    }

    // Track uploadId changes and reset refetch flag when new upload starts
    if (uploadId && uploadId !== prevUploadIdRef.current) {
      prevUploadIdRef.current = uploadId;
      hasRefetchedAfterResetRef.current = false; // Reset flag for next reset
    }
  }, [uploadId, currentStep, refetchEmployeeData, refetchTimesheetFieldsData]);

  // Derived state
  const isTrowserOpen =
    currentStep === 1 ? propIsTrowserOpen : isTrowserOpenFromStore;

  // Combined loading and error states
  const isLoading =
    companySettingsLoading ||
    employeeDataLoading ||
    timesheetFieldsDataLoading ||
    aiPrefLoading ||
    isExtracting;
  const hasError =
    companySettingsError ||
    employeeDataError ||
    timesheetFieldsDataError ||
    aiPrefError ||
    null;

  // Initialize trowser state
  useEffect(() => {
    if (propIsTrowserOpen !== undefined) {
      dispatch(setTrowserOpen(propIsTrowserOpen));
    }
  }, [propIsTrowserOpen, dispatch]);

  // If there's an error loading initial data, go to Step 6 (failure screen)
  useEffect(() => {
    if (hasError && currentStep === 1) {
      // Determine which error occurred
      let errorMessage = 'Failed to load initial data. ';
      if (companySettingsError) {
        errorMessage += `Company Settings Error: ${companySettingsError}. `;
      }
      if (employeeDataError) {
        errorMessage += `Employee Data Error: ${employeeDataError}. `;
      }
      if (timesheetFieldsDataError) {
        errorMessage += `Timesheet Fields Error: ${timesheetFieldsDataError}. `;
      }
      if (aiPrefError) {
        errorMessage += `AI Preferences Error: ${aiPrefError}. `;
      }

      // Set error in review state so Step 6 can display it
      dispatch(setSaveError(errorMessage.trim()));
      dispatch(setIsInitialLoadError(true)); // Mark as initial load error
      dispatch(setIsImporting(false));
      dispatch(setCurrentStep(6));
    }
  }, [
    hasError,
    currentStep,
    companySettingsError,
    employeeDataError,
    timesheetFieldsDataError,
    aiPrefError,
    dispatch,
  ]);

  // Note: extractUnmappedFields is now called in useStep2Processing right after
  // data analysis completes, ensuring employee mappings from UX preferences are
  // ready when Step 3 (Field Mapping) renders

  const handleClose = useCallback(() => {
    // Clear preview image from session storage (blob URL cleanup)
    try {
      const url = sessionStorage.getItem('timeImportAgentic_previewImage');
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
      sessionStorage.removeItem('timeImportAgentic_previewImage');
    } catch {
      // Ignore
    }

    // Reset all Redux slices with single action - much cleaner!
    // This will reset all slices to their initial state via extraReducers
    // AI import USER-scoped preferences (column/employee mappings) persist in sandbox storage
    // UX preferences (REALM-scoped settings) persist via UX Preferences API
    dispatch(resetAllSlices());

    // Close the trowser
    if (onClose) {
      onClose();
    } else {
      dispatch(setTrowserOpen(false));
    }
  }, [dispatch, onClose]);

  const handleOpen = () => {
    // AI import preferences are auto-loaded from sandbox storage on mount
    // No need to manually refetch
    dispatch(setTrowserOpen(true));
    dispatch(setCurrentStep(1));
  };

  const handleMappingSubmit = useCallback(() => {
    dispatch(setCurrentStep(3)); // Move to field mapping step (Edit unrecognized fields)
  }, [dispatch]);

  const handleScanUploadSuccess = useCallback(
    (fileId: string) => {
      // For now, just move to step 2 like the XLS upload
      dispatch(setCurrentStep(2));
    },
    [dispatch],
  );

  // Split-screen view: when IXP flag is true, show alternate UI; else show step progress flow
  const { isEnabled: isSplitScreenViewFromFlag } = useIXPFeatureFlag({
    flagName: FEATURE_FLAGS.SBSEG_QBO_ENABLE_SPLIT_SCREEN_VIEW,
  });
  // Allow forcing split view via URL for dev/testing when flag is not enabled (e.g. ?splitView=true)
  const forceSplitViewFromUrl =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('splitView') === 'true';
  const isSplitScreenViewEnabled =
    isSplitScreenViewFromFlag || forceSplitViewFromUrl;

  // Note: AI Analysis progress is now handled dynamically by useStep2Processing hook
  // No hardcoded animation needed

  return (
    <div>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.1); }
            100% { opacity: 1; transform: scale(1); }
          }
        `}
      </style>

      <Button
        onClick={handleOpen}
        theme="gbsgexperimental"
        data-testid="open-trowser-button"
      >
        Open upload time entry
      </Button>

      <Trowser
        open={isTrowserOpen ?? true}
        title="Import Time Entries"
        dismissible
        onClose={handleClose}
        automationId="trowser"
      >
        <div data-component="timeImportAgentic">
          <TimeImportAgenticGlobalStyles />
          {isSplitScreenViewEnabled ? (
            <>
              <div
                data-view="split-screen"
                aria-label="Split screen view"
                style={{
                  width: '100%',
                  height: '87vh',
                  flex: 1,
                }}
              >
                <SplitView
                  sandbox={sandbox}
                  currentStep={currentStep}
                  isUploading={isUploading}
                  isLoading={isLoading}
                  hasError={hasError}
                  isExtracting={isExtracting}
                  isGlobalProcessing={isGlobalProcessing}
                  onScanUploadSuccess={handleScanUploadSuccess}
                  onMappingSubmit={handleMappingSubmit}
                  onClose={handleClose}
                />
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '0 5%',
                  gap: '24px',
                }}
              >
                {/* Content for all steps */}
                <div
                  style={{
                    transition:
                      'opacity 0.5s ease-in-out, transform 0.5s ease-in-out',
                    opacity: cardFadeOut ? 0 : 1,
                    transform: cardFadeOut
                      ? 'translateY(-20px)'
                      : 'translateY(0)',
                    width: '100%',
                  }}
                >
                  {currentStep === 1 && (
                    <Step1Upload
                      isUploading={isUploading}
                      isLoading={isLoading}
                      hasError={hasError}
                      sandbox={sandbox}
                      onScanUploadSuccess={handleScanUploadSuccess}
                    />
                  )}

                  {currentStep === 1.5 && (
                    <ProcessingStep sandbox={sandbox} hideOverlay />
                  )}

                  {currentStep === 2 && (
                    <Step2Mapping
                      onMappingSubmit={handleMappingSubmit}
                      sandbox={sandbox}
                    />
                  )}

                  {currentStep === 3 && <Step3FieldMapping sandbox={sandbox} />}

                  {currentStep === 5 && <Step5Review />}

                  {currentStep === 6 && (
                    <Step6Complete
                      onClose={handleClose}
                      savedCount={saveResult?.savedEntries ?? 0}
                      sandbox={sandbox}
                    />
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </Trowser>
    </div>
  );
};

export default TimeImportAgentic;

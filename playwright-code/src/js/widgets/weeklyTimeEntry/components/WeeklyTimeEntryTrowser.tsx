/**
 * @file WeeklyTimeEntryTrowser.tsx
 * @description Higher Order Component for Weekly Time Entry functionality. This component renders a Trowser
 * with time entry table view,panel and grid and handles the save/close actions.
 *
 */

import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Trowser from '@ids-ts/trowser';
import styled from 'styled-components';
import Button from '@ids-ts/button';
import PanelContextual, {
  PanelContent,
  Placement,
} from '@ids-ts/panel-contextual';
import { Activity } from '@ids-ts/loader';
import {
  useUxPreferences,
  UxPreferenceKey,
} from 'src/js/service/utils/useUXPreferences';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';
import {
  FEATURE_FLAGS,
  setAfterTaskModalPending,
} from 'src/js/common/constants';
import { useSaveWeeklyTimeEntries } from 'src/js/service/hooks/weeklyTimeEntries/useSaveWeeklyTimeEntries';
import FeedbackPopover from 'src/js/widgets/common/feedbackPopover/FeedbackPopover';
import QualtricsSurveyWidget from 'src/js/widgets/common/feedbackSurvey/QualtricsSurveyWidget';
import { useOvertimeFeatureFlag } from 'src/js/service/hooks/settings/useGetTSheetsOvertimeEnabled';
import { SuccessToast } from 'src/js/widgets/common/SuccessToast';
import { WeeklyCopyLastWeekModal } from 'src/js/widgets/common/WeeklyCopyLastWeekModal';
import useGetPreferences from 'src/js/service/hooks/preferenceces/useGetPreferences';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';
import { getApolloClientInstance } from 'src/js/service/ApolloClientBuilder';
import { useGetEntitlements } from 'src/js/service/hooks/entitlements/useGetEntitlements';
import { getQualtricsSurveyActiveEmployer } from 'src/js/widgets/common/feedbackSurvey/qualtricsContextUtils';
import { useProfileCompanyAndRolesMetadata } from 'src/js/widgets/common/feedbackSurvey/useProfileCompanyAndRolesMetadata';
import { useCopyLastWeek } from '../hooks/useCopyLastWeek';
import { useWeeklyTimeTrackingPoints } from '../hooks/useWeeklyTimeTrackingPoints';

import { CopyModalState, WeeklyTimeEntryTrowserProps } from '../types';
import { WeeklyTimeEntryTable } from './WeeklyTimeEntryTable';
import { useAppDispatch, useAppSelector } from '../store';
import {
  selectConfirmTimeEntryConversionModal,
  selectFieldErrors,
  selectHasTimeEntriesWithData,
  selectPanelOpen,
  selectRowErrors,
  selectRowOrder,
  selectSelectedCell,
  selectTeamMember,
  selectTeamMemberDropdownReady,
  selectTimeCategorySelectorReady,
  selectTimeEntriesError,
  selectVisibleDays,
  selectWeeklyTimesheetTourCompleted,
} from '../store/selectors';
import {
  clearSelectedCell,
  toggleConfirmTimeEntryConversionModal,
  selectCell,
  setDateRange,
  setTimeCategorySelectorReady,
  setTeamMemberDropdownReady,
  updateCell,
} from '../store/timeEntryGridSlice';
import {
  closePanel,
  setWeeklyTimesheetTourCompleted,
} from '../store/timeEntrySettingsSlice';
import { WeeklyTimeEntryPanelContent } from './WeeklyTimeEntryPanelContent';
import { WeeklyTimeEntryHeader } from './weeklyTimeEntryHeader/WeeklyTimeEntryHeader';
import { useReset } from '../hooks/useReset';
import { useRequiredFieldsValidation } from '../hooks/useRequiredFieldsValidation';
import {
  WEEKLY_TIME_ENTRY_LOGGING_CONSTANTS,
  WEEKLY_TIME_ENTRY_WIDGET_ID,
} from '../utils/constants';
import {
  clearValidationError,
  setValidationError,
} from '../store/validationSlice';
import { useUnsavedChangesDetection } from '../hooks/useUnsavedChangesDetection';
import { CommonErrorModal } from './errors/CommonErrorModal';
import { ApprovedEntriesModal } from './errors/ApprovedEntriesModal';
import { CommonErrorDisplay } from './errors/CommonErrorDisplay';
import { FullPageError } from './errors/FullPageError';
import WeeklyTimesheetPopoverTourAdapter from './weeklyTour/WeeklyTimesheetPopoverTourAdapter';
import { WhatsNewButton } from './weeklyTour/WhatsNewButton';
import { CopyLastWeekPopover } from './weeklyTimeEntryFooter/CopyLastWeekPopover';
import { ConfirmationModal } from '../../common/ConfirmationModal';
import UserVoiceFeedBackWidget from '../../common/feedbackPopover/UserVoiceFeedBackWidget';
import { ImportTimeWithAICTA } from './ImportTimeWithAI';

// Styled components for loading and error containers
const CenteredContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 16px;
  background-color: var(--color-container-background-primary);
  height: 80vh;
  width: 100vw;
`;

const StyledTrowser = styled(Trowser)<{ isPanelOpen?: boolean }>`
  & div:has(section[data-testid='trowser-content']) {
    padding: 0 !important;
  }

  & div[data-testid='panel'] {
    width: ${({ isPanelOpen }) => (isPanelOpen ? '400px !important' : '0px')};
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
  }
`;

const StyledDescriptionConfirmationMessage = styled.div`
  margin-top: 15px;
`;

export const WeeklyTimeEntryTrowser: React.FC<WeeklyTimeEntryTrowserProps> =
  React.memo(
    ({
      isOpen,
      setOpen,
      settingsData: propsSettingsData,
      currentWeek: propsCurrentWeek,
      isLoading: propsIsLoading,
      error: propsError,
      refetch: propsRefetch,
    }: WeeklyTimeEntryTrowserProps): React.ReactElement | null => {
      const intl = useIntl();
      const sandbox = useSandbox();
      const isPanelOpen = useAppSelector(selectPanelOpen);
      const confirmTimeEntryConversionModal = useAppSelector(
        selectConfirmTimeEntryConversionModal,
      );
      const dispatch = useAppDispatch();
      const track = useTracking();

      // Pass currentWeek directly without memoization
      const currentWeek = propsCurrentWeek;

      const teamMember = useAppSelector(selectTeamMember);
      const selectedCell = useAppSelector(selectSelectedCell);

      // Copy modal state management
      const [copyModalState, setCopyModalState] = useState<CopyModalState>({
        open: false,
        type: 'current-user',
      });

      // Tour state
      const [tourOpen, setTourOpen] = useState(false);
      const tourShownRef = useRef(false);

      const [triggerFeedback, setTriggerFeedback] = useState<() => void>(
        () => () => {},
      );

      // Get tour completion status from Redux
      const weeklyTimesheetTourCompleted = useAppSelector(
        selectWeeklyTimesheetTourCompleted,
      );
      const { setPreference } = useUxPreferences();
      // Unsaved changes modal state
      const [unsavedChangesModal, setUnsavedChangesModal] = useState<{
        open: boolean;
        actionType: 'close' | 'navigation' | 'week-change';
        pendingAction: (() => void) | null;
      }>({
        open: false,
        actionType: 'close',
        pendingAction: null,
      });

      // Approved entries modal state
      const [approvedEntriesModal, setApprovedEntriesModal] = useState<{
        open: boolean;
        isTimeOff?: boolean;
        isSubmitted?: boolean;
      }>({
        open: false,
      });

      // Local state for feedback functionality
      const [showFeedbackPopover, setShowFeedbackPopover] =
        useState<boolean>(false);
      const [showFeedbackSuccessToast, setShowFeedbackSuccessToast] =
        useState<boolean>(false);

      // ref for Qualtrics survey loadSurvey function (WFS users)
      const loadQualtricsRef = useRef<(() => Promise<void>) | null>(null);

      // Get the appropriate tracking points based on environment
      const trackingPoints = useWeeklyTimeTrackingPoints();

      // detect if user is in Workforce environment (WFS)
      const isWFSUser = isWorkforceEnvironment(sandbox);
      const rootApolloClient = isWFSUser
        ? getApolloClientInstance(sandbox) ?? undefined
        : undefined;
      const { data: entitlements } = useGetEntitlements({
        client: rootApolloClient,
        skip: !isWFSUser,
      });
      const profileCompanyAndRolesMetadata = useProfileCompanyAndRolesMetadata({
        sandbox,
        enabled: isWFSUser,
        client: rootApolloClient,
      });
      const qualtricsActiveEmployer = useMemo(
        () =>
          getQualtricsSurveyActiveEmployer(
            sandbox,
            entitlements,
            profileCompanyAndRolesMetadata,
          ),
        [sandbox, entitlements, profileCompanyAndRolesMetadata],
      );

      const { isEnabled: showUserVoiceFeedbackWidget } = useIXPFeatureFlag({
        flagName: FEATURE_FLAGS.QB_TIME_TRACKING_USERVOICE_FEEDBACK,
        defaultValue: false,
      });

      const { isEnabled: isOvertimeEnabled } = useOvertimeFeatureFlag();

      // Ensure UserVoice is only enabled for non-WFS users
      // WFS users should always use Qualtrics, even if the feature flag is enabled
      const isUserVoiceEnabled = !isWFSUser && showUserVoiceFeedbackWidget;

      // Copy last week popover menu state
      const [showCopyLastWeekPopover, setShowCopyLastWeekPopover] =
        useState<boolean>(false);

      // Unsaved changes detection
      const { hasUnsavedChanges } = useUnsavedChangesDetection();

      // Use props data (data provider handles all fetching)
      const settingsData = propsSettingsData;

      // Copy last week functionality
      const {
        copyLastWeekTimeEntriesLoading,
        isCopying,
        handleCopyLastWeekModalOverwrite: hookHandleOverwrite,
        handleCopyLastWeekModalAdd: hookHandleAdd,
        handleCopyCustomersAndBreaksLastWeekModalOverwrite:
          hookHandleCustomersAndBreaksOverwrite,
        handleCopyCustomersAndBreaksLastWeekModalAdd:
          hookHandleCustomersAndBreaksAdd,
      } = useCopyLastWeek();

      const { data: v3PreferencesData, loading: v3PreferencesLoading } =
        useGetPreferences();

      const labelPreference = {
        DepartmentTerminology:
          v3PreferencesData?.Preferences.AccountingInfoPrefs
            .DepartmentTerminology || '',
        CustomerTerminology:
          v3PreferencesData?.Preferences.AccountingInfoPrefs
            .CustomerTerminology || '',
      };

      // Popover handlers for copyLastWeek
      const handleOpenCopyLastWeekPopover = useCallback(
        (e: React.MouseEvent) => {
          e.preventDefault();
          setShowCopyLastWeekPopover(true);
        },
        [],
      );

      const handleCloseCopyLastWeekPopover = useCallback(() => {
        setShowCopyLastWeekPopover(false);
      }, []);

      // Required fields validation
      const { validateRequiredFields } =
        useRequiredFieldsValidation(labelPreference);

      const saveTimeForPreference = useCallback(() => {
        if (teamMember) {
          setPreference(UxPreferenceKey.TIME_ENTRY_TIME_FOR, {
            id: teamMember.id,
            name: teamMember.name,
            type: teamMember.type,
          });
        }
      }, [setPreference, teamMember]);

      const { saveWeeklyTimeEntries, loading: saveLoading } =
        useSaveWeeklyTimeEntries({
          onSaveSuccess: () => {
            setAfterTaskModalPending(sandbox);
            if (propsRefetch) {
              propsRefetch();
            }
          },
        });

      // Use props for loading state (no need to fetch from Redux again)
      const isLoading =
        (propsIsLoading !== undefined ? propsIsLoading : false) ||
        saveLoading ||
        copyLastWeekTimeEntriesLoading ||
        v3PreferencesLoading;

      // Use props for error state (no need to fetch from Redux again)
      const error = propsError;

      const TROWSER_ID = 'weekly-time-trowser';

      const trowserFeedbackButton = document.querySelector(
        `[data-automation-id="${TROWSER_ID}_feedback"]`,
      ) as HTMLElement;

      const trowserFooter = document.querySelector(
        `[class*="TrowserFooter-footerCenter"]`,
      ) as HTMLElement;

      // Get team member dropdown ready state for tour functionality
      const isTeamMemberDropdownReady = useAppSelector(
        selectTeamMemberDropdownReady,
      );
      const isTimeCategorySelectorReady = useAppSelector(
        selectTimeCategorySelectorReady,
      );

      // Check if there are time entries with data in the grid
      const hasTimeEntriesWithData = useAppSelector(
        selectHasTimeEntriesWithData,
      );

      // run hook on component mount
      useEffect(() => {
        track(trackingPoints.ON_MOUNT);
        track({
          ...trackingPoints.ON_MOUNT,
          ui_action: 'clicked',
          ui_access_point: 'global_create',
        });
      }, []);

      useEffect(() => {
        if (isOpen) {
          dispatch(setTeamMemberDropdownReady(false));
          dispatch(setTimeCategorySelectorReady(false));
          tourShownRef.current = false; // Reset tour shown flag
        }
      }, [isOpen, dispatch]);

      // Start the tour when the component is ready and preference allows it
      useEffect(() => {
        const shouldSkipTourOpen =
          tourShownRef.current ||
          isLoading ||
          !isOpen ||
          weeklyTimesheetTourCompleted;

        if (
          shouldSkipTourOpen ||
          (!isWFSUser && !isTeamMemberDropdownReady) ||
          (isWFSUser && !isTimeCategorySelectorReady)
        ) {
          return;
        }

        setTourOpen(true);
        tourShownRef.current = true;
      }, [
        isTeamMemberDropdownReady,
        isTimeCategorySelectorReady,
        weeklyTimesheetTourCompleted,
        isLoading,
        isOpen,
        isWFSUser,
      ]);

      // dayjs locale weekStart + initial dateRange seed are now owned by
      // useCombinedDataFetching — keeping them out of this child prevents the
      // duplicate-dispatch race that wiped the grid on first open.

      // Get validation state from Redux - memoize selectors
      const fieldErrors = useAppSelector(selectFieldErrors);
      const rowErrors = useAppSelector(selectRowErrors);
      const timeEntriesError = useAppSelector(selectTimeEntriesError);

      const { reset } = useReset();

      // Memoize modal handlers to prevent unnecessary re-renders
      const handleUnsavedChangesConfirm = useCallback(() => {
        if (unsavedChangesModal.pendingAction) {
          unsavedChangesModal.pendingAction();
        }
        setUnsavedChangesModal({
          open: false,
          actionType: 'close',
          pendingAction: null,
        });
      }, [unsavedChangesModal]);

      const handleUnsavedChangesCancel = useCallback(() => {
        setUnsavedChangesModal({
          open: false,
          actionType: 'close',
          pendingAction: null,
        });
      }, []);

      const handleApprovedEntriesModalCancel = useCallback(() => {
        setApprovedEntriesModal({
          open: false,
        });
      }, []);

      const showUnsavedChangesModal = useCallback(
        (
          actionType: 'close' | 'navigation' | 'week-change',
          pendingAction: () => void,
        ) => {
          if (hasUnsavedChanges) {
            setUnsavedChangesModal({
              open: true,
              actionType,
              pendingAction,
            });
          } else {
            // No unsaved changes, proceed with action
            pendingAction();
          }
        },
        [hasUnsavedChanges],
      );

      // Memoize event handlers to prevent unnecessary re-renders
      const handleClose = useCallback(() => {
        const closeAction = () => {
          track({
            ...trackingPoints.CANCEL,
            ui_object: 'button',
          });
          setOpen(false);
          // Reset all Redux state slices
          reset(); // Reset timeEntryGridSlice
          // Clear transformation cache
        };

        showUnsavedChangesModal('close', closeAction);
      }, [
        setOpen,
        reset,
        showUnsavedChangesModal,
        dispatch,
        clearValidationError,
      ]);

      const handleTourReset = async () => {
        dispatch(setTeamMemberDropdownReady(true));
        dispatch(setWeeklyTimesheetTourCompleted(false));
        try {
          await setPreference(
            UxPreferenceKey.WEEKLY_TIMESHEET_TOUR_COMPLETED,
            false,
          );
          setTourOpen(true);
        } catch (error) {
          sandbox.logger.error('Failed to reset tour preferences:', {
            error: String(error),
          });
          setTourOpen(true);
        }
      };

      const handleCopyLastWeekClick = useCallback(() => {
        track(trackingPoints.COPY_LAST_SHEET);
        if (isCopying) {
          return;
        }
        // If there are time entries with data, show the modal to let user choose
        // Otherwise, directly overwrite by default
        if (hasTimeEntriesWithData) {
          setCopyModalState({
            open: true,
            type: 'current-user',
          });
        } else {
          // No data present, directly overwrite
          hookHandleOverwrite();
        }
        sandbox.logger.info(
          WEEKLY_TIME_ENTRY_LOGGING_CONSTANTS.USER_INTERACTIONS
            .COPY_LAST_TIMESHEET_BUTTON_CLICKED,
        );
      }, [
        isCopying,
        hasTimeEntriesWithData,
        hookHandleOverwrite,
        sandbox.logger,
        track,
      ]);

      const handleCopyCustomersAndBreaksLastWeekClick = useCallback(() => {
        if (isCopying) {
          return;
        }
        // If there are time entries with data, show the modal to let user choose
        // Otherwise, directly overwrite by default
        if (hasTimeEntriesWithData) {
          setCopyModalState({
            open: true,
            type: 'customers-and-breaks',
          });
        } else {
          // No data present, directly overwrite
          hookHandleCustomersAndBreaksOverwrite();
        }
        sandbox.logger.info(
          WEEKLY_TIME_ENTRY_LOGGING_CONSTANTS.USER_INTERACTIONS
            .COPY_LAST_TIMESHEET_BUTTON_CLICKED,
        );
      }, [
        isCopying,
        hasTimeEntriesWithData,
        hookHandleCustomersAndBreaksOverwrite,
        sandbox.logger,
      ]);

      // Copy last week options for context menu
      const copyLastWeekOptions = useMemo(
        () => [
          {
            label: intl.formatMessage({ id: 'copy.last.week.timesheet' }),
            onClick: () => handleCopyLastWeekClick(),
          },
          {
            label: intl.formatMessage({
              id: 'copy.last.week.customers.and.breaks',
            }),
            onClick: () => handleCopyCustomersAndBreaksLastWeekClick(),
          },
        ],
        [
          intl,
          handleCopyLastWeekClick,
          handleCopyCustomersAndBreaksLastWeekClick,
        ],
      );

      const handleModalClose = useCallback(() => {
        setCopyModalState({
          open: false,
          type: 'current-user',
        });
        sandbox.logger.info(
          WEEKLY_TIME_ENTRY_LOGGING_CONSTANTS.USER_INTERACTIONS
            .COPY_LAST_TIMESHEET_MODAL_CLOSED,
        );
      }, [sandbox.logger]);

      const handleModalOverwrite = useCallback(() => {
        if (isCopying) {
          return;
        }

        // Call the appropriate handler based on modal type
        if (copyModalState.type === 'current-user') {
          hookHandleOverwrite();
        } else {
          hookHandleCustomersAndBreaksOverwrite();
        }

        setCopyModalState({
          open: false,
          type: 'current-user',
        });
        sandbox.logger.info(
          WEEKLY_TIME_ENTRY_LOGGING_CONSTANTS.USER_INTERACTIONS
            .COPY_LAST_TIMESHEET_OVERWRITE_CLICKED,
        );
      }, [
        isCopying,
        hookHandleOverwrite,
        hookHandleCustomersAndBreaksOverwrite,
        copyModalState.type,
        sandbox.logger,
      ]);

      const handleModalAdd = useCallback(() => {
        if (isCopying) {
          return;
        }

        // Call the appropriate handler based on modal type
        if (copyModalState.type === 'current-user') {
          hookHandleAdd();
        } else {
          hookHandleCustomersAndBreaksAdd();
        }

        setCopyModalState({
          open: false,
          type: 'current-user',
        });
        sandbox.logger.info(
          WEEKLY_TIME_ENTRY_LOGGING_CONSTANTS.USER_INTERACTIONS
            .COPY_LAST_TIMESHEET_ADD_CLICKED,
        );
      }, [
        isCopying,
        hookHandleAdd,
        hookHandleCustomersAndBreaksAdd,
        copyModalState.type,
        sandbox.logger,
      ]);

      const renderFeedbackTrigger = useCallback(
        (handleAccessPointClick: () => void) => {
          setTriggerFeedback(() => handleAccessPointClick);
          return null;
        },
        [],
      );

      const handleFeedbackIconClick = async () => {
        track(trackingPoints.FEEDBACK);

        if (isWFSUser) {
          try {
            // Call Qualtrics survey for WFS users
            await loadQualtricsRef.current?.();
          } catch (error) {
            sandbox.logger.error('Failed to load Qualtrics survey', { error });
          }
        } else {
          // Show UserVoice popover for QBO users
          setShowFeedbackPopover((prev) => !prev);
        }
      };

      const handleFeedbackClose = (result: { success: boolean } | null) => {
        setShowFeedbackPopover(false);
        if (result?.success) {
          setShowFeedbackSuccessToast(true);
        }
      };

      // Get visible days for panel selection
      const visibleDays = useAppSelector(selectVisibleDays);
      const rowOrder = useAppSelector(selectRowOrder);

      // Memoize panel handlers to prevent unnecessary re-renders
      const handlePanelClose = useCallback(() => {
        dispatch(closePanel());
        // Clear selected cell when panel is closed
        dispatch(clearSelectedCell());
      }, [dispatch]);

      const handlePanelOpen = useCallback(() => {
        // Select the first visible day as default
        const firstVisibleDay = visibleDays.length > 0 ? visibleDays[0] : 0;
        const firstRowId = rowOrder.length > 0 ? rowOrder[0] : '';
        dispatch(selectCell({ rowId: firstRowId, dayIdx: firstVisibleDay }));
        sandbox.logger.info(
          WEEKLY_TIME_ENTRY_LOGGING_CONSTANTS.USER_INTERACTIONS
            .WEEKLY_TIME_ENTRY_PANEL_OPEN,
        );
      }, [visibleDays, rowOrder, dispatch, sandbox.logger]);

      const handleConfirmTimeEntryConversionModalYes = useCallback(() => {
        // Remove startTime and endTime from the currently selected cell
        if (selectedCell) {
          dispatch(
            updateCell({
              rowId: selectedCell.rowId,
              dayIdx: selectedCell.dayIdx,
              value: {
                startTime: undefined,
                endTime: undefined,
              },
            }),
          );
        }
        // Close the modal
        dispatch(toggleConfirmTimeEntryConversionModal({ isOpen: false }));
      }, [dispatch, selectedCell]);

      const handleConfirmTimeEntryConversionModalClose = useCallback(() => {
        // Select the cell using rowId and dayIdx from the modal state, or clear selection if null
        if (
          confirmTimeEntryConversionModal.rowId !== null &&
          confirmTimeEntryConversionModal.dayIdx !== null
        ) {
          dispatch(
            selectCell({
              rowId: confirmTimeEntryConversionModal.rowId,
              dayIdx: confirmTimeEntryConversionModal.dayIdx,
            }),
          );
        } else {
          // Clear selected cell if modal has null values
          dispatch(clearSelectedCell());
        }
        // Close the modal
        dispatch(toggleConfirmTimeEntryConversionModal({ isOpen: false }));
      }, [
        dispatch,
        confirmTimeEntryConversionModal.rowId,
        confirmTimeEntryConversionModal.dayIdx,
      ]);

      const handleSave = useCallback(async () => {
        track(trackingPoints.SAVE);
        // Check if there are any unsaved changes
        if (!hasUnsavedChanges) {
          // No changes to save, do nothing
          return;
        }

        // Validate required fields before saving
        const result = validateRequiredFields();

        // Only set validation errors if there are actual errors
        if (!result.isValid) {
          dispatch(
            setValidationError({
              errorMessages: result.errorMessages,
              fieldErrors: result.fieldErrors,
              rowErrors: result.rowErrors,
            }),
          );
          return;
        }

        // Clear any existing validation errors if validation passes
        dispatch(clearValidationError());

        try {
          await saveWeeklyTimeEntries();
          saveTimeForPreference();
          // Refetch is automatically handled by the hook's onSaveSuccess callback
          // Also trigger refetch directly to ensure data is refreshed
          if (propsRefetch) {
            propsRefetch();
          }
        } catch (error) {
          // Error handling is already done in the useSaveWeeklyTimeEntries hook
        }
      }, [
        saveWeeklyTimeEntries,
        propsRefetch,
        validateRequiredFields,
        dispatch,
        hasUnsavedChanges,
        saveTimeForPreference,
      ]);

      const handleSaveAndClose = useCallback(async () => {
        track(trackingPoints.SAVE_AND_CLOSE);
        // Check if there are any unsaved changes
        if (!hasUnsavedChanges) {
          // No changes to save, just close the widget
          setOpen(false);
          // Reset all Redux state slices
          reset();
          // Clear transformation cache
          return;
        }

        // Validate required fields before saving
        const result = validateRequiredFields();

        // Only set validation errors if there are actual errors
        if (!result.isValid) {
          dispatch(
            setValidationError({
              errorMessages: result.errorMessages,
              fieldErrors: result.fieldErrors,
              rowErrors: result.rowErrors,
            }),
          );
          return;
        }

        // Clear any existing validation errors if validation passes
        dispatch(clearValidationError());

        try {
          await saveWeeklyTimeEntries();
          saveTimeForPreference();
          // Refetch is automatically handled by the hook's onSaveSuccess callback
          // Also trigger refetch directly to ensure data is refreshed
          if (propsRefetch) {
            propsRefetch();
          }
          // Only close the trowser if save was successful
          setOpen(false);
          // Reset all Redux state slices
          reset();
          // Clear transformation cache
        } catch (error) {
          // Don't close the trowser if save failed
          // Error handling is already done in the useSaveWeeklyTimeEntries hook
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [
        saveWeeklyTimeEntries,
        propsRefetch,
        setOpen,
        reset,
        validateRequiredFields,
        dispatch,
        hasUnsavedChanges,
        saveTimeForPreference,
      ]);

      const handleTourClose = useCallback(() => {
        setTourOpen(false);
      }, []);

      const handleTourFinish = useCallback(async () => {
        try {
          // Save tour completion to Redux
          dispatch(setWeeklyTimesheetTourCompleted(true));
          await setPreference(
            UxPreferenceKey.WEEKLY_TIMESHEET_TOUR_COMPLETED,
            true,
          );
          setTourOpen(false);
        } catch (error) {
          sandbox.logger.error('Failed to save tour preference:', { error });
        }
        setTourOpen(false);
      }, [dispatch, sandbox.logger, setPreference]);

      // Handle settings save success
      const handleSettingsSaveSuccess = useCallback(() => {
        track(trackingPoints.SAVE_SETTINGS);
      }, [track]);

      // Memoize renderContent to prevent unnecessary re-renders
      const renderContent = useMemo(() => {
        // Show full-page error if there's a time entries error
        if (timeEntriesError) {
          return <FullPageError />;
        }

        if (isLoading) {
          return (
            <CenteredContainer>
              <div data-testid="activity-dots-large">
                <Activity shape="dots" size="large" />
              </div>
            </CenteredContainer>
          );
        }

        if (error) {
          const errorMessage =
            typeof error === 'string'
              ? error
              : error?.message || 'An error occurred';
          return (
            <CenteredContainer>
              <div data-testid="error-message">Error: {errorMessage}</div>
            </CenteredContainer>
          );
        }

        return (
          <div data-testid="trowser-content">
            <WhatsNewButton
              trowserId={TROWSER_ID}
              onTourReset={handleTourReset}
            />
            <CommonErrorModal
              open={unsavedChangesModal.open}
              actionType={unsavedChangesModal.actionType}
              onConfirm={handleUnsavedChangesConfirm}
              onCancel={handleUnsavedChangesCancel}
            />
            <ApprovedEntriesModal
              open={approvedEntriesModal.open}
              isTimeOff={approvedEntriesModal.isTimeOff}
              isSubmitted={approvedEntriesModal.isSubmitted}
              onCancel={handleApprovedEntriesModalCancel}
            />
            <CommonErrorDisplay />
            <WeeklyTimeEntryHeader
              onSettingsSaveSuccess={handleSettingsSaveSuccess}
              refetch={propsRefetch}
              onWeekChange={(newDateRange) => {
                const weekChangeAction = () => {
                  dispatch(setDateRange(newDateRange));
                  // Clear validation errors when changing weeks
                  dispatch(clearValidationError());
                };
                showUnsavedChangesModal('week-change', weekChangeAction);
              }}
            />
            <WeeklyTimeEntryTable
              currentWeek={currentWeek}
              rowErrors={rowErrors}
              fieldErrors={fieldErrors}
              onLockIconClick={(isTimeOff?: boolean, isSubmitted?: boolean) => {
                track(trackingPoints.LOCK_ICON_CLICK);
                setApprovedEntriesModal({
                  open: true,
                  isTimeOff,
                  isSubmitted,
                });
              }}
            />
          </div>
        );
      }, [
        timeEntriesError,
        isLoading,
        error,
        unsavedChangesModal.open,
        unsavedChangesModal.actionType,
        approvedEntriesModal.open,
        handleUnsavedChangesConfirm,
        handleUnsavedChangesCancel,
        handleSettingsSaveSuccess,
        propsRefetch,
        currentWeek,
        rowErrors,
        fieldErrors,
        dispatch,
        showUnsavedChangesModal,
        handleApprovedEntriesModalCancel,
      ]);

      return (
        <>
          <StyledTrowser
            automationId={TROWSER_ID}
            open={isOpen}
            isPanelOpen={isPanelOpen}
            dismissible
            feedback
            showCancelFooterButton
            onClose={handleClose}
            title={intl.formatMessage({
              id: 'trowser.title.weekly',
            })}
            footerCenterLinkLabels={
              timeEntriesError
                ? []
                : [
                    `${intl.formatMessage({
                      id: 'copy.time.category',
                    })} ${showCopyLastWeekPopover ? '▼' : '▲'}`,
                  ]
            }
            onFeedbackIconClick={
              isUserVoiceEnabled ? triggerFeedback : handleFeedbackIconClick
            }
            footerCenterLinkActions={
              timeEntriesError ? [] : [handleOpenCopyLastWeekPopover]
            }
            footerButton={
              timeEntriesError
                ? []
                : [
                    <Button
                      key="save-close-button"
                      priority="secondary"
                      onClick={handleSaveAndClose}
                      data-testid="weekly-save-close-button"
                      aria-label="weekly-save-close-button"
                    >
                      {intl.formatMessage({ id: 'save.close' })}
                    </Button>,
                    <Button
                      key="save-button"
                      priority="primary"
                      onClick={handleSave}
                      data-testid="weekly-save-button"
                      aria-label="weekly-save-button"
                    >
                      {intl.formatMessage({ id: 'save' })}
                    </Button>,
                  ]
            }
            data-testid="weekly-time-trowser"
            panelContent={
              <PanelContextual
                open={isPanelOpen && !isLoading && !error && !timeEntriesError}
                showPanel={
                  isPanelOpen && !isLoading && !error && !timeEntriesError
                }
                onClose={handlePanelClose}
                onOpen={handlePanelOpen}
                placement={Placement.Right}
                data-testid="panel"
              >
                <PanelContent>
                  <WeeklyTimeEntryPanelContent
                    fieldErrors={fieldErrors}
                    labelPreference={labelPreference}
                  />
                </PanelContent>
              </PanelContextual>
            }
          >
            <ImportTimeWithAICTA />
            {renderContent}
          </StyledTrowser>
          {/* Copy Last Week Modal */}
          <WeeklyCopyLastWeekModal
            open={copyModalState.open}
            onClose={handleModalClose}
            onOverwrite={handleModalOverwrite}
            onAdd={handleModalAdd}
            onCancel={handleModalClose}
          />
          {/* Copy Last Week Popover */}
          <CopyLastWeekPopover
            open={showCopyLastWeekPopover}
            targetElement={trowserFooter}
            onClose={handleCloseCopyLastWeekPopover}
            menuItems={copyLastWeekOptions}
          />
          {/* Unsaved Changes Modal */}

          {/* Confirm Time Entry Conversion Modal */}
          <ConfirmationModal
            title={intl.formatMessage({
              id: 'weekly.time.entry.confirm.changes',
            })}
            size="small"
            actionAlignment="center"
            contentAlignment="center"
            headerAlignment="center"
            dismissible
            showSectionDivider={false}
            open={confirmTimeEntryConversionModal.isOpen}
            setOpen={() => handleConfirmTimeEntryConversionModalClose()}
            onYesClick={handleConfirmTimeEntryConversionModalYes}
            onNoClick={handleConfirmTimeEntryConversionModalClose}
          >
            <StyledDescriptionConfirmationMessage>
              {intl.formatMessage({
                id: 'weekly.time.entry.losing.start.end.times',
              })}
            </StyledDescriptionConfirmationMessage>
          </ConfirmationModal>

          {/* Feedback Popover - QBO users: UserVoice popover */}
          {!isWFSUser && showFeedbackPopover && (
            <FeedbackPopover
              open={showFeedbackPopover}
              onClose={handleFeedbackClose}
              widgetIdentifier={WEEKLY_TIME_ENTRY_WIDGET_ID}
              targetElement={trowserFeedbackButton}
              isOvertimeEnabled={isOvertimeEnabled}
            />
          )}

          {/* WFS users: Qualtrics survey */}
          {isWFSUser && (
            <QualtricsSurveyWidget
              sandbox={sandbox}
              featureTag="wfs-wfweb-wta"
              activeEmployer={qualtricsActiveEmployer}
              registerLoadSurvey={(loadSurvey) => {
                loadQualtricsRef.current = loadSurvey;
              }}
            />
          )}

          {isUserVoiceEnabled && (
            <UserVoiceFeedBackWidget
              renderFeedbackTrigger={renderFeedbackTrigger}
              widgetIdentifier={WEEKLY_TIME_ENTRY_WIDGET_ID}
            />
          )}
          {/* Feedback Success Toast */}
          {showFeedbackSuccessToast && (
            <SuccessToast
              message={intl.formatMessage({ id: 'toast.feedback.success' })}
              open={showFeedbackSuccessToast}
              onClose={() => setShowFeedbackSuccessToast(false)}
            />
          )}
          {/* Weekly Timesheet Tour */}
          <WeeklyTimesheetPopoverTourAdapter
            open={tourOpen}
            onClose={handleTourClose}
            onFinish={handleTourFinish}
          />
        </>
      );
    },
  );

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from 'react';
import {
  FormProvider,
  SubmitHandler,
  useWatch,
  useFormState,
  DefaultValues,
} from 'react-hook-form';
import styled from 'styled-components';

import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import Trowser from '@ids-ts/trowser';
import Button from '@ids-ts/button';
import PageMessage from '@ids-ts/page-message';
import SplitButton, { MenuItem } from '@ids-ts/split-button';
import { Activity } from '@ids-ts/loader';

import { QuickbooksOnlineSandbox } from '@appfabric/sandbox-spec';
import { SuccessToast } from 'src/js/widgets//common/SuccessToast';
import { useCreateTimeEntry } from 'src/js/service/hooks/timeEntries/useCreateTimeEntry';
import { useUpdateTimeEntry } from 'src/js/service/hooks/timeEntries/useUpdateTimeEntry';
import {
  DEFAULT_SINGLE_TIME_FORM_STATE,
  isFormDirty,
  SingleTimeFormState,
  useSingleTimeForm,
} from 'src/js/widgets/singleTimeTrowser/hooks/useSingleTimeForm';
import { SingleTimeForm } from 'src/js/widgets/singleTimeTrowser/components/SingleTimeForm';

import { TSheetsModal } from 'src/js/widgets/common/TSheetsModal';
import { TimeSettingsPopoverHOC } from 'src/js/widgets/common/timeSettingsPopover/TimeSettingsPopoverHOC';

import { useGetUserInfo } from 'src/js/service/utils/useGetUserInfo';
import {
  TIME_ENTRY_SPLIT_CTA_OPTIONS,
  useUxPreferences,
  UxPreferenceKey,
} from 'src/js/service/utils/useUXPreferences';
import FeedbackPopover from 'src/js/widgets/common/feedbackPopover/FeedbackPopover';
import QualtricsSurveyWidget from 'src/js/widgets/common/feedbackSurvey/QualtricsSurveyWidget';
import { getQualtricsSurveyActiveEmployer } from 'src/js/widgets/common/feedbackSurvey/qualtricsContextUtils';
import { useProfileCompanyAndRolesMetadata } from 'src/js/widgets/common/feedbackSurvey/useProfileCompanyAndRolesMetadata';
import { useOvertimeFeatureFlag } from 'src/js/service/hooks/settings/useGetTSheetsOvertimeEnabled';
import { ConfirmationModal } from 'src/js/widgets/common/ConfirmationModal';
import { ClosedBooksConfirmationModal } from 'src/js/widgets/common/ClosedBooksConfirmationModal';
import {
  computeFieldsWithData,
  mapAddSingleTimeEntryForm_forBatchCreateUpdateInput,
  mapAddSingleTimeEntryForm_forBatchDeleteInput,
  mapAddSingleTimeEntryForm_forCreateInput,
  mapAddSingleTimeEntryForm_forUpdateInput,
  mapTimeEntryToSingleTimeFormState,
} from 'src/js/widgets/singleTimeTrowser/hooks/mapSingleTimeForm';
import { combineDateAndTimeAndConvertToTimezone } from 'src/js/common/DateAndTimeUtils';
import {
  TimeTracking_BatchManageTimeEntriesPayload,
  TimeTracking_CreateTimeEntryInput,
  TimeTracking_TimeEntry,
  TimeTracking_UpdateTimeEntryInput,
} from 'src/__generated__/timeTracking/graphql';
import { SubmitTimeDatesProvider } from 'src/js/widgets/common/submitTimeDates/SubmitTimeDatesProvider';
import { useFieldLoadingStates } from 'src/js/widgets/singleTimeTrowser/hooks/useFieldLoadingStates';
import {
  getTimeTrackingQueryParams,
  removeTimeTrackingQueryParams,
} from 'src/js/service/utils/queryStringUtil';
import { useHasProjects } from 'src/js/service/utils/projectsUtils';
import { breakPoints } from 'src/js/common/screenSizeUtils';
import { useConsolidatedLoading } from 'src/js/common/useConsolidatedLoading';
import {
  computeTimeTrackingOnlyUser,
  useTimeTrackingBatchAuthorization,
} from 'src/js/service/utils/useTimeTrackingAuthorization';
import {
  computeHasPayroll,
  computeHasTimeElite,
  computeHasTSheets,
  useGetEntitlements,
} from 'src/js/service/hooks/entitlements/useGetEntitlements';

import 'src/assets/styles.css';
import { getSingleTimeTrackingPoints } from 'src/js/widgets/singleTimeTrowser/singleTimeTrackingPoints';
import {
  createCustomerInteraction,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import { useBatchSaveTimeEntries } from 'src/js/service/hooks/timeEntries/useBatchSaveTimeEntries';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import {
  getSearchTimeEntriesInput_byTransactionId,
  useSearchTimeEntries,
} from 'src/js/service/hooks/timeEntries/useSearchTimeEntries';
import { TimeForType } from 'src/js/widgets/common/addTimeFormComponents/TeamMember';
import { useLazyGetEmployeeData } from 'src/js/service/hooks/employee/useLazyGetEmployeeData';
import {
  useHasAdminAccess,
  fetchSettingsAccess,
  useSandboxNavigate,
  isWorkforceEnvironment,
} from 'src/js/service/utils/sandboxUtils';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';
import { useFeatureFlag } from 'src/js/common/hooks/useFeatureFlag';
import MaintenancePage from 'src/js/common/components/MaintenancePage/MaintenancePage';
import { usePopoverInstrumentation } from 'src/js/common/usePopoverInstrumentation';
import WayBackWhatsNewContainer from 'src/js/widgets/common/WayBackWhatsNewContainer';
import useGetPreferences from 'src/js/service/hooks/preferenceces/useGetPreferences';
import { getShowBillRateToAll } from 'src/js/common/MiscUtils';
import { NeoApiClient } from 'src/js/service/rest/NeoApiClient';
import { useCompanySettings } from 'src/js/service/hooks/settings/useCompanySettings';
import {
  useInvoicedValidation,
  getRestrictedContentKey,
} from 'src/js/hooks/useInvoicedValidation';
import { useDeleteTimeEntry } from 'src/js/service/hooks/timeEntries/useDeleteTimeEntry';
import { buildTimeSummaryTimeActivityHeaders } from 'src/js/service/utils/timeSummaryHeaderUtils';
import {
  FEATURE_FLAGS,
  setAfterTaskModalPending,
  SINGLE_TIME_TROWSER_EVENTS,
} from 'src/js/common/constants';
import { SingleTimeActivityTourSteps } from 'src/js/common/tourSteps';
import { usePendingSaveLockContext } from 'src/js/common/hooks/usePendingSaveLockContext';
import { useIxpExperiment } from 'src/js/service/hooks/ixp/useIxpExperiment';
import { useGetTSheetsAccountInfo } from 'src/js/service/hooks/settings/useGetTSheetsAccountInfo';
import { UNIFICATION_EXPERIMENT_NAMESPACE } from 'src/js/common/ixpExperimentConfigs';
import { useLazyGetVendorData } from '../../../service/hooks/vendor/useLazyGetVendorData';
import { useSingleTimeEntryQuery } from '../hooks/useSingleTimeEntryQuery';
import { useQbTimeSdk } from '../../../service/hooks/useQbTimeSdk';
import { useIsSubmitTimeEnabled } from '../../../service/hooks/useIsSubmitTimeEnabled';
import { useCanManageMyTimesheets } from '../../../service/hooks/useCanManageMyTimesheets';
import RecentTimeActivitiesModal from '../../common/RecentTimeActivitiesModal';
import { AuthErrorMessage } from '../../common/AuthErrorMessage';
import { LockedTimeEntryMessage } from '../../common/LockedTimeEntryMessage';
import { ToastType, SINGLE_TIME_ENTRY_WIDGET_ID } from '../constants';
import UserVoiceFeedBackWidget from '../../common/feedbackPopover/UserVoiceFeedBackWidget';
import SingleTimeActivityTourAdapter from './SingleTimeActivityTourAdapter';
import {
  isSubmittedTimeEntry,
  PendingSaveBannerAction,
  PendingSaveBannerMessage,
} from '../../../common/timeEntryLockUtils';
import { resolveBool } from '../../../common/boolQuery';

const StyledTrowser = styled(Trowser)`
  * [class^='Trowser-sectionContent'] {
    padding: 40px 50px 0 50px;

    @media (max-width: ${breakPoints.md}px) {
      padding: 40px 30px 0 30px;
    }
  }
`;

const FormContainer = styled.div<{ isHidden: boolean }>`
  visibility: ${({ isHidden }) => (isHidden ? 'hidden' : 'visible')};
`;

const TrowserContent = styled.section`
  display: flex;
  flex-direction: column;
`;

const ActivityContainer = styled.div`
  display: flex;
  justify-content: center;
`;

const StyledAuthErrorMessage = styled(AuthErrorMessage)`
  height: calc(
    100vh - 165px
  ); /* This makes sure the error message content takes the full viewport height except for header, footer and padding */
`;

const StyledPendingSaveMessage = styled(PageMessage)`
  margin-bottom: 30px;
`;

export interface SingleTimeHOCProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  isSingleTimeEntry?: boolean;
  isOTX?: boolean;
  timeEntryId?: string;
  isTimeEntryLocked?: boolean;
  employeeId?: string | null;
}

const TROWSER_ID = 'single-time-trowser';

const SINGLE_TIME_ACTIVITY_TOUR_HEADING = 'Single Time Activity Tour';

const StyledDescriptionConfirmationMessage = styled.div`
  font-size: var(--font-size-heading-5);
  font-weight: var(--font-weight-heading);
  line-height: var(--line-height-heading);
  font-style: normal;
  margin: 0;
  padding: 0;
`;

const StyledInvoicedDescriptionConfirmationMessage = styled.div`
  font-size: 18px; /* (NoTokenFound) */
  line-height: var(--line-height-component);
  font-style: normal;
  margin: 0;
  padding: 0;
`;

export const SingleTimeHOC = ({
  open,
  setOpen,
  isSingleTimeEntry,
  isOTX,
  timeEntryId,
  isTimeEntryLocked = false,
  employeeId = null,
}: SingleTimeHOCProps) => {
  // -------------------------------- context hooks
  const intl = useIntl();
  const singleTimeActivityTourSteps = SingleTimeActivityTourSteps();
  const sandbox = useSandbox();
  const isWorkforceUser = isWorkforceEnvironment(
    sandbox as QuickbooksOnlineSandbox,
  );
  const { isInTreatment: isIxpUnificationInTreatment } = useIxpExperiment(
    sandbox,
    {
      experimentNamespace: UNIFICATION_EXPERIMENT_NAMESPACE,
      namespace: 'timecapture-timeentries-ui',
      businessUnit: 'SBSEG',
    },
  );

  // Get the appropriate tracking points based on page type and environment
  const trackingPoints = useMemo(
    () =>
      getSingleTimeTrackingPoints({
        isSingleTimeEntry: isSingleTimeEntry ?? false,
        isWorkforce: isWorkforceUser,
      }),
    [isSingleTimeEntry, isWorkforceUser],
  );

  const track = useTracking();
  const navigator = useSandboxNavigate();
  const { id, txnId, customerId } = getTimeTrackingQueryParams();
  const serviceItemPriceRef = useRef<number>(0);
  const serviceDescriptionRef = useRef<string>('');
  const oldServiceDescriptionRef = useRef<string>('');
  const serviceTaxableRef = useRef<boolean>(false);
  const isBillableFieldAssignedRef = useRef<boolean>(false);
  const quickFillFieldLabels = useRef<Record<string, any>>({});
  const singleTimeActivityTourRes = useRef<boolean>(false);
  const [
    singleTimeActivityIntroModalOpen,
    setSingleTimeActivityIntroModalOpen,
  ] = useState(false);
  const [isSettingsAccessible, setSettingsAccess] = useState<boolean>(false);

  // should this be initialized on trowser open ?
  const trowserSettingsGear = document.querySelector(
    `[data-automation-id="${TROWSER_ID}_settings"]`,
  );

  const trowserFeedbackButton = document.querySelector(
    `[data-automation-id="${TROWSER_ID}_feedback"]`,
  ) as HTMLElement;

  const ignoreCloseBooksCheck = useRef(false);

  // -------------------------------- component state hooks
  // single time entry trowser form methods
  const singleTimeEntryFormMethods = useSingleTimeForm();
  const { dirtyFields } = useFormState({
    control: singleTimeEntryFormMethods.control,
  });

  const { loadingStates, dispatch } = useFieldLoadingStates();

  const watchedFormState = useWatch({
    control: singleTimeEntryFormMethods.control,
  }) as SingleTimeFormState;
  const isSubmitTimeEnabled = useIsSubmitTimeEnabled();
  const canManageTimesheets = useCanManageMyTimesheets();
  // Wait for the permission to settle before deciding lock state so the strict
  // `=== false` check is reliable and fields don't briefly render as editable.
  const isCanManageTimesheetsResolved = canManageTimesheets !== null;

  // check if the time record is approved and is a time entry
  const isApproved =
    watchedFormState.isApproved && watchedFormState.isExported === false;
  // for Workforce Web Users, a submitted TE (isSubmitted=true + isSubmitTimeEnabled=true) also locks the form
  const isSubmitted = isSubmittedTimeEntry(
    watchedFormState,
    isSubmitTimeEnabled,
  );

  // check if the time record is locked and is a time entry
  const isLocked = resolveBool({
    should: [
      watchedFormState.isLocked && watchedFormState.isExported === false,
      canManageTimesheets === false,
    ],
  });

  // watch autoCalculateMileage from form state for mileage experience
  const autoCalculateMileage = useWatch({
    control: singleTimeEntryFormMethods.control,
    name: 'autoCalculateMileage',
  });

  // watch distanceTracking to reactively update mileage field
  const distanceTracking = useWatch({
    control: singleTimeEntryFormMethods.control,
    name: 'distanceTracking',
  });

  const isHandlingCancel = useRef(false);
  const isInitialTimeEntryLoad = useRef(true);
  const isSaveAndCopyInProgress = useRef(false);

  const [invoicedModalOpen, setInvoicedModalOpen] = useState<boolean>(false);
  // Add state to track confirmed changes
  const [confirmedChanges, setConfirmedChanges] = useState<
    Partial<SingleTimeFormState>
  >({});

  const { restrictedFieldType, isRestrictedChange } = useInvoicedValidation({
    mode: 'single',
    currentValues: watchedFormState,
    defaultValues: singleTimeEntryFormMethods.formState
      .defaultValues as SingleTimeFormState,
    dirtyFields,
  });

  const { isEnabled: showUserVoiceFeedbackWidget } = useIXPFeatureFlag({
    flagName: FEATURE_FLAGS.QB_TIME_TRACKING_USERVOICE_FEEDBACK,
    defaultValue: false,
  });

  const { isEnabled: isLegacyQboUserEnabled } = useIXPFeatureFlag({
    flagName: FEATURE_FLAGS.QB_TIME_TRACKING_UI_ENABLE_LEGACY_QBO_USER,
    defaultValue: false,
  });

  const isFullPageMaintenanceEnabled = useFeatureFlag(
    FEATURE_FLAGS.SBSEG_QBO_QBTIME_MAINTENANCE_FULL_PAGE,
    false,
  );

  const { isEnabled: isOvertimeEnabled } = useOvertimeFeatureFlag();

  // Feature flag for time activity flow
  const { isEnabled: isTimeEntryPrimaryDataSourceEnabled } = useIXPFeatureFlag({
    flagName: FEATURE_FLAGS.QB_TIME_TRACKING_UI_TIME_ENTRY_PRIMARY_DATA_SOURCE,
    defaultValue: false,
  });

  // is feedback popover open
  const [showFeedbackPopover, setShowFeedbackPopover] =
    useState<boolean>(false);

  // ref for Qualtrics survey loadSurvey function (WFS users)
  const loadQualtricsRef = useRef<(() => Promise<void>) | null>(null);

  // detect if user is in Workforce environment (WFS)
  const isWFSUser = isWorkforceEnvironment(sandbox);

  // Ensure UserVoice is only enabled for non-WFS users
  // WFS users should always use Qualtrics, even if the feature flag is enabled
  const isUserVoiceEnabled = !isWFSUser && showUserVoiceFeedbackWidget;

  // is settings popover open
  const [isSettingsPopoverOpen, setIsSettingsPopoverOpen] =
    useState<boolean>(false);

  // unified toast state
  const [toastState, setToastState] = useState<{
    show: boolean;
    type: ToastType;
  }>({
    show: false,
    type: 'SAVE',
  });

  // helper functions for showing different toast types
  const showToast = (type: ToastType) => {
    setToastState({ show: true, type });
  };

  const hideToast = () => {
    setToastState({ show: false, type: 'SAVE' });
  };

  // helper function to get toast message based on type
  const getToastMessage = (type: ToastType) => {
    switch (type) {
      case 'SAVE':
        return intl.formatMessage({ id: 'toast.save.success' });
      case 'DELETE':
        return intl.formatMessage({ id: 'toast.delete.success' });
      case 'SAVE_AND_COPY':
        return intl.formatMessage({ id: 'toast.save.and.copy.success' });
      case 'FEEDBACK':
        return intl.formatMessage({ id: 'toast.feedback.success' });
      default:
        return intl.formatMessage({ id: 'toast.save.success' });
    }
  };

  // is notes overwrite modal open
  const [notesOverwriteModelOpen, setNotesOverwriteModelOpen] =
    useState<boolean>(false);

  // is unsaved changes modal open
  const [unsavedChangesModalOpen, setUnsavedChangesModalOpen] =
    useState<boolean>(false);

  // is delete confirmation modal open
  const [deleteConfirmationModalOpen, setDeleteConfirmationModalOpen] =
    useState<boolean>(false);

  // is close books modal open
  const [closeBooksModalOpen, setCloseBooksModalOpen] =
    useState<boolean>(false);

  const [recentTimeActivitiesModalOpen, setRecentTimeActivitiesModalOpen] =
    useState<boolean>(false);

  // is error page level message open
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingSaveMessage, setPendingSaveMessage] =
    useState<PendingSaveBannerMessage | null>(null);

  // since same save buttons can execute either create or update
  // contain these callbacks as component state
  // create/update success callback
  const onMutationSuccessCallback = useRef<
    (data: TimeTracking_BatchManageTimeEntriesPayload) => void
  >((data) => {});

  // Cache/resolve lock context (when locked due to time charge generation
  // being in progress) from create/update responses
  // to decide sequence-mismatch banner behavior on later edit/delete attempts.
  const {
    clearCachedLockContext,
    updateCachedLockContextFromPayload,
    resolvePendingMessageForError,
  } = usePendingSaveLockContext({
    isCachingEnabled: !isSingleTimeEntry,
  });

  const [triggerFeedback, setTriggerFeedback] = useState<() => void>(
    () => () => {},
  );

  // -------------------------------- network hooks
  // get single time entry if id query param present
  const {
    query: getTimeEntry,
    data: singleTimeEntryData,
    loading: singleTimeEntryLoading,
    resetData: resetSingleTimeEntry,
    error: getTimeEntryError,
  } = useSingleTimeEntryQuery({
    id: timeEntryId || id,
    isExported: !isSingleTimeEntry,
  });
  const { timeForContactDAS, timeAgainstContactDAS, classDAS, departmentDAS } =
    singleTimeEntryData || {};

  // Handle query parameter changes:
  // 1. Get Selected Time Activity Details after closing the Recent Time Activities Modal
  // 2. Set customer from query param (customerId) for new time entries
  useEffect(() => {
    // Get current query params directly from URL
    const {
      id: currentTimeId,
      customerId: currentCustomerId,
      txnId: currentTxnId,
    } = getTimeTrackingQueryParams();

    // Load time entry when id changes from Recent Time Activities Modal
    if (
      currentTimeId &&
      currentTimeId !== id &&
      !recentTimeActivitiesModalOpen
    ) {
      getTimeEntry({
        variables: {
          input: {
            id: currentTimeId,
            isExported: !isSingleTimeEntry,
          },
        },
      });
    }

    // Pre-populate customer field only for new time entries when customerId is present in query params
    if (currentCustomerId && !currentTimeId && !currentTxnId) {
      singleTimeEntryFormMethods.setValue('timeAgainst.customer', {
        id: currentCustomerId,
        name: null, // Will be populated by the customer field component
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    getTimeEntry,
    isSingleTimeEntry,
    recentTimeActivitiesModalOpen,
    customerId,
    txnId,
    timeEntryId,
  ]);

  // get settings
  const {
    settingsData,
    refetch: refetchSettings,
    loading: settingsLoading,
    error: settingsError,
  } = useCompanySettings({ isExported: !isSingleTimeEntry });

  // Skip TSheets account info fetch for ALL Single Time Entry users (OTX and non-OTX)
  // The isFreedata value is only used for Single Time Activity tour (line 572-575), which doesn't apply to STE
  // This prevents unnecessary 429 rate limiting errors, especially for OTX when assignments are enabled
  const {
    data: { isFreedata },
  } = useGetTSheetsAccountInfo({ skip: isSingleTimeEntry });

  const searchTimeEntriesInputByTxnId = useMemo(
    () => getSearchTimeEntriesInput_byTransactionId(txnId),
    [txnId],
  );

  // get single time entry if transaction id query param present
  const {
    data: singleTimeEntryData_byTransactionId,
    loading: singleTimeEntryDataLoading_byTransactionId,
    resetData: resetSingleTimeEntry_byTransactionId,
  } = useSearchTimeEntries({
    input: searchTimeEntriesInputByTxnId,
    txnId,
  });

  const mapQueryResult = () => {
    if (singleTimeEntryData) {
      // Cast to TimeTracking_TimeEntry for compatibility - SingleTimeEntry has additional fields
      return mapTimeEntryToSingleTimeFormState(
        singleTimeEntryData as TimeTracking_TimeEntry,
        settingsData.timezone,
        isSubmitTimeEnabled,
        canManageTimesheets ?? false,
      );
    }
    if (
      singleTimeEntryData_byTransactionId &&
      singleTimeEntryData_byTransactionId[0]
    ) {
      return mapTimeEntryToSingleTimeFormState(
        singleTimeEntryData_byTransactionId[0],
        settingsData.timezone,
        isSubmitTimeEnabled,
        canManageTimesheets ?? false,
      );
    }
    return undefined;
  };

  const mappedSingleTimeFormState = useMemo(
    () => mapQueryResult(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      singleTimeEntryData,
      singleTimeEntryData_byTransactionId,
      settingsData.timezone,
      isSubmitTimeEnabled,
      canManageTimesheets,
    ],
  );

  // Propagate the resolved lock state into the form so all fields become
  // read-only. Needed because some lock inputs (e.g. canManageTimesheets)
  // resolve asynchronously after the initial map. Depends on
  // mappedSingleTimeFormState so the lock is re-applied after the form is reset
  // from freshly mapped query data (isLocked itself stays sticky-true and would
  // not re-trigger on its own).
  useEffect(() => {
    if (isLocked) {
      singleTimeEntryFormMethods.setValue('isLocked', true, {
        shouldDirty: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLocked, mappedSingleTimeFormState]);

  // get preferences
  const {
    data: timeTrackingPreferences,
    loading: preferencesLoading,
    loadPreferences,
    getPreference,
    setPreference,
    setPreferences,
  } = useUxPreferences();

  const currentCTAPreferences =
    timeTrackingPreferences[UxPreferenceKey.TIME_ENTRY_SELECTED_SPLIT_CTA];
  const [
    splitCTAPrimaryOption,
    splitCTASecondaryOption,
    splitCTATertiaryOption,
  ] =
    currentCTAPreferences === TIME_ENTRY_SPLIT_CTA_OPTIONS.SAVE_AND_NEW.key
      ? [
          TIME_ENTRY_SPLIT_CTA_OPTIONS.SAVE_AND_NEW,
          TIME_ENTRY_SPLIT_CTA_OPTIONS.SAVE_AND_CLOSE,
          TIME_ENTRY_SPLIT_CTA_OPTIONS.SAVE_AND_COPY,
        ]
      : [
          TIME_ENTRY_SPLIT_CTA_OPTIONS.SAVE_AND_CLOSE,
          TIME_ENTRY_SPLIT_CTA_OPTIONS.SAVE_AND_NEW,
          TIME_ENTRY_SPLIT_CTA_OPTIONS.SAVE_AND_COPY,
        ];

  // get has payroll
  const {
    data: entitlements,
    loading: entitlementsLoading,
    error: entitlementsError,
  } = useGetEntitlements();
  const profileCompanyAndRolesMetadata = useProfileCompanyAndRolesMetadata({
    sandbox,
    enabled: isWFSUser,
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

  const timeSummaryEntitlementsIncludeTSheets = computeHasTSheets(entitlements);

  const timeSummaryTAHeader = useMemo(
    () =>
      buildTimeSummaryTimeActivityHeaders({
        isTimeEntryPrimaryDataSourceEnabled,
        isTimeActivityRequest: !isSingleTimeEntry,
        entitlementGrants: entitlements,
        entitlementsReady: !entitlementsLoading,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      isTimeEntryPrimaryDataSourceEnabled,
      timeSummaryEntitlementsIncludeTSheets,
      entitlementsLoading,
      isSingleTimeEntry,
    ],
  );

  const [hasPayroll, setHasPayroll] = useState<boolean>(false);
  const [hasTimeElite, setHasTimeElite] = useState<boolean>(false);
  // get has payroll and time elite details
  useEffect(() => {
    if (entitlements && !entitlementsLoading) {
      setHasPayroll(computeHasPayroll(entitlements));
      setHasTimeElite(computeHasTimeElite(entitlements));
    }
  }, [entitlements, entitlementsLoading]);

  const hasAdminAccess = useHasAdminAccess();
  const {
    data: isTeamMembersDropdownEnabled,
    loading: teamMembersDropdownLoading,
    error: teamMembersDropdownError,
  } = useQbTimeSdk<boolean>((sdk) => sdk.isTeamMembersDropdownEnabled, {
    executeOnMount: true,
  });
  const isTeamMembersDropdownResolved =
    isTeamMembersDropdownEnabled === true ||
    isTeamMembersDropdownEnabled === false ||
    !!teamMembersDropdownError;

  const shouldShowTeamMemberField = isTeamMembersDropdownEnabled === true;

  // get has projects
  const hasProjects = useHasProjects();

  const isFreeDataWithUnificationEnabled =
    isFreedata && isIxpUnificationInTreatment;

  const shouldShowSingleTimeActivityTour =
    !isSingleTimeEntry &&
    singleTimeActivityIntroModalOpen &&
    isFreeDataWithUnificationEnabled;

  // Popover instrumentation for Single Time Activity Tour
  const { logPopoverOpen, logTourComplete, logPopoverError } =
    usePopoverInstrumentation({
      screen: 'Single Time Activity Tour',
      previous_screen: 'Single Time Activity',
      object_detail: 'single_time_activity_tour',
      ui_object_detail: 'single_time_activity_tour_popover',
      popoverHeading: 'Single Time Activity Tour',
      additionalContext: {
        isSingleTimeEntry,
        isOTX,
      },
    });

  // get authorizations
  const {
    data: timeTrackingAuth,
    loading: timeTrackingAuthLoading,
    error: timeTrackingAuthError,
  } = useTimeTrackingBatchAuthorization();
  const timeTrackingOnlyId = computeTimeTrackingOnlyUser(timeTrackingAuth);

  // get user info (only for time tracking only users)
  const { data: userInfo, loading: userInfoLoading } = useGetUserInfo(
    !timeTrackingOnlyId,
  );
  const userFirstName = userInfo?.firstName || '';

  // get employee data (getEmployee triggers getEmployeeJobCosting in hook for job costing / bill rate)
  const { query: getEmployee, data: employee } = useLazyGetEmployeeData(
    hasPayroll,
    timeTrackingOnlyId,
  );

  const { getVendorCallback: getVendorData, data: vendorData } =
    useLazyGetVendorData();

  // -------------------------------- component render hooks
  // run hook on component mount
  useEffect(() => {
    sandbox.logger.info('Component=SingleTimeHOC Event=Mounted');
    track(trackingPoints.ON_MOUNT);
  }, []);

  // fetch and set settings access
  useEffect(() => {
    // @ts-ignore
    fetchSettingsAccess(sandbox).then((result) => {
      setSettingsAccess(result);
    });
  }, [sandbox]);

  // run hook to set form state from queried time entry and initialize new entries
  useEffect(() => {
    const currentFormValues = singleTimeEntryFormMethods.getValues();
    const hasExistingId = currentFormValues.id;

    if (
      mappedSingleTimeFormState &&
      (currentFormValues.id !== mappedSingleTimeFormState.id ||
        currentFormValues.timezone !== settingsData.timezone)
    ) {
      // For existing time entries, set form state from mapped data
      const mappedFormState = mappedSingleTimeFormState;
      singleTimeEntryFormMethods.reset(mappedFormState);
    } else if (!hasExistingId) {
      // For new time entries, set isExported based on isSingleTimeEntry
      // isExported will be false for single time entries and true for time activities
      singleTimeEntryFormMethods.setValue('isExported', !isSingleTimeEntry);
      singleTimeEntryFormMethods.setValue(
        'timezone',
        isSingleTimeEntry ? settingsData.timezone : settingsData.qboTimezone,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    mappedSingleTimeFormState,
    isApproved,
    isSingleTimeEntry,
    settingsData.timezone,
  ]);

  // run hook to set billable, billable rate and taxable based on different conditions
  useEffect(() => {
    const { isCopied, billable } = watchedFormState;
    const isServiceDirty =
      singleTimeEntryFormMethods.formState.dirtyFields.service;
    const isBillableDirty =
      singleTimeEntryFormMethods.formState.dirtyFields.billable;

    // If this is a copied timesheet and service hasn't changed, preserve the manually entered
    // bill rates and billable status. If service has changed, proceed with rate update.
    if (isCopied === true && !isServiceDirty) {
      return;
    }

    const vendor = vendorData?.Vendor;
    let billRate: number | null = watchedFormState.billRate || null;
    let { taxable } = watchedFormState;

    // Function to set the billable field (no-op when user has manually toggled billable so bill rate can stay visible)
    const setBillableField = (
      rate: number | null,
      serviceChange: boolean = false,
    ) => {
      if (isBillableDirty) return;
      const billableValue = rate != null && rate > 0;
      const employeeBillable =
        (watchedFormState.timeFor.type === TimeForType.EMPLOYEE &&
          employee?.employmentDetail?.jobCosting?.billable) ||
        false;
      // When service is selected: if it has a price, set billable true and use service bill rate.
      // When not from service: for employee only set billable true if employee is actually billable (not just has a rate);
      // for vendor, rate > 0 can set billable true.
      if (serviceChange) {
        singleTimeEntryFormMethods.setValue('billable', billableValue);
      } else {
        const fromEmployee =
          watchedFormState.timeFor.type === TimeForType.EMPLOYEE;
        singleTimeEntryFormMethods.setValue(
          'billable',
          fromEmployee ? employeeBillable && billableValue : billableValue,
        );
      }
    };

    const handleExistingTimeEntry = () => {
      const defaultBillableValue =
        singleTimeEntryFormMethods.formState.defaultValues?.billable;
      const defaultBillRateValue =
        singleTimeEntryFormMethods.formState.defaultValues?.billRate;
      const defaultTaxableValue =
        singleTimeEntryFormMethods.formState.defaultValues?.taxable || false;

      const employeeBillRate = window.isNaN(
        employee?.employmentDetail?.jobCosting?.billRate,
      )
        ? null
        : Number(employee?.employmentDetail?.jobCosting?.billRate);

      const vendorBillRate = window.isNaN(vendor?.BillRate || NaN)
        ? null
        : Number(vendor?.BillRate);

      const isServiceDirty =
        singleTimeEntryFormMethods.formState.dirtyFields.service;

      // When service not dirty: set rate from employee/vendor if form has no rate; preserve existing non-billable when editing.
      if (!isServiceDirty) {
        const hasServiceWithPrice =
          watchedFormState.service.id && serviceItemPriceRef.current > 0;
        const formRate = watchedFormState.billRate ?? null;
        const formHasNoRate =
          formRate === null ||
          formRate === 0 ||
          (typeof formRate === 'number' && Number.isNaN(formRate));
        const isEmployee =
          watchedFormState.timeFor.type === TimeForType.EMPLOYEE;
        const rateToUse = isEmployee ? employeeBillRate : vendorBillRate;
        if (
          !hasServiceWithPrice &&
          formHasNoRate &&
          !isBillableDirty &&
          rateToUse != null &&
          rateToUse > 0
        ) {
          singleTimeEntryFormMethods.setValue('billRate', rateToUse);
          // Do not override existing time entry's non-billable; keep it false when TE was saved as non-billable
          const keepNonBillable = defaultBillableValue === false;
          const newBillable = keepNonBillable
            ? false
            : (isEmployee
                ? employee?.employmentDetail?.jobCosting?.billable &&
                  rateToUse > 0
                : rateToUse > 0) || !!defaultBillableValue;
          singleTimeEntryFormMethods.setValue('billable', newBillable);
        }
        return;
      }

      if (watchedFormState.service.id && serviceItemPriceRef.current > 0) {
        billRate = Number(serviceItemPriceRef.current);
        taxable = serviceTaxableRef.current;

        // Rate from service item: set billable from price (SFO has no billable flag; price > 0 => billable true)
        setBillableField(billRate, true);
        return;
      }

      // if existing time entry's bill rate is non-zero and time entry's billable value is defined
      if (
        defaultBillRateValue &&
        defaultBillRateValue > 0 &&
        defaultBillableValue
      ) {
        billRate = defaultBillRateValue;
        taxable = defaultTaxableValue;
        if (!isBillableDirty) {
          singleTimeEntryFormMethods.setValue('billable', defaultBillableValue);
        }
        return;
      }

      // if existing time entry is not billable, employee or vendor's bill rate will persist
      // in case of manually toggling billable checkbox - legacy parity
      if (!billRate || !billable) {
        if (
          watchedFormState.timeFor.type === TimeForType.EMPLOYEE &&
          (billRate === null ||
            billRate === 0 ||
            (watchedFormState.billRate !== null &&
              watchedFormState.billRate > 0))
        ) {
          billRate = employeeBillRate;
          if (!isBillableDirty) {
            singleTimeEntryFormMethods.setValue('billable', false);
          }
          return;
        }

        if (vendor) {
          billRate = vendorBillRate;
          if (!isBillableDirty) {
            singleTimeEntryFormMethods.setValue('billable', false);
          }
        }
      }
    };

    const handleNewTimeEntry = () => {
      const employeeBillRate = window.isNaN(
        employee?.employmentDetail?.jobCosting?.billRate,
      )
        ? null
        : Number(employee?.employmentDetail?.jobCosting?.billRate);

      const vendorBillRate = window.isNaN(vendor?.BillRate || NaN)
        ? null
        : Number(vendor?.BillRate);

      if (watchedFormState.service.id && serviceItemPriceRef.current > 0) {
        billRate = window.isNaN(serviceItemPriceRef.current)
          ? null
          : Number(serviceItemPriceRef.current);
        taxable = serviceTaxableRef.current;
        setBillableField(billRate, true); // from service item: set billable from price (SFO has no billable flag)
        return;
      }

      // if no service selected - employees bill rate will persist - legacy parity
      if (
        watchedFormState.timeFor.type === TimeForType.EMPLOYEE &&
        (billRate === null ||
          billRate === 0 ||
          (watchedFormState.billRate !== null && watchedFormState.billRate > 0))
      ) {
        billRate = employeeBillRate;
        setBillableField(billRate);
        return;
      }

      // if no service selected - vendors bill rate will persist - legacy parity
      if (vendor) {
        billRate = vendorBillRate;
        setBillableField(billRate);
      }
    };

    const isExisting = !!(id || txnId || watchedFormState.id);
    if (isExisting) {
      handleExistingTimeEntry();
    } else {
      handleNewTimeEntry();
    }

    singleTimeEntryFormMethods.setValue('billRate', billRate);
    singleTimeEntryFormMethods.setValue('taxable', taxable);
  }, [
    employee,
    employee?.employmentDetail?.jobCosting?.billRate,
    employee?.employmentDetail?.jobCosting?.billable,
    watchedFormState.service.id,
    singleTimeEntryFormMethods,
    id,
    txnId,
    vendorData,
    watchedFormState.timeFor.id,
    watchedFormState.timeFor.type,
    watchedFormState.id,
  ]);

  // run hook to set cost rate rate based on different conditions
  useEffect(() => {
    const vendor = vendorData?.Vendor;
    let costRate = null;

    // for existing time entry do not overwrite the values unless form is dirty
    if (id || txnId || watchedFormState.id) {
      return;
    }

    if (watchedFormState.timeFor.type === TimeForType.EMPLOYEE) {
      costRate = window.isNaN(employee?.employmentDetail?.jobCosting?.costRate)
        ? null
        : Number(employee?.employmentDetail?.jobCosting?.costRate);
    } else if (vendor) {
      costRate = window.isNaN(vendor?.CostRate)
        ? null
        : Number(vendor?.CostRate);
    }

    singleTimeEntryFormMethods.setValue('costRate', costRate);
  }, [
    employee,
    id,
    singleTimeEntryFormMethods,
    txnId,
    vendorData?.Vendor,
    watchedFormState.timeFor.id,
    watchedFormState.timeFor.type,
    watchedFormState.id,
  ]);

  // fetch preferences when trowser opens
  useEffect(() => {
    if (open) {
      loadPreferences([
        UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS,
        UxPreferenceKey.TIME_ENTRY_TIME_FOR,
        UxPreferenceKey.TIME_ENTRY_LAST_USED_START_END_TIME,
        UxPreferenceKey.TIME_ENTRY_SELECTED_SPLIT_CTA,
        UxPreferenceKey.SINGLE_TIME_ACTIVITY_TOUR_COMPLETED,
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadPreferences, open]);

  // run when timeFor changes: getEmployee (GAS) runs; hook also calls getEmployeeJobCosting (OIGQL) for bill rate / job costing
  useEffect(() => {
    if (
      watchedFormState.timeFor.type === TimeForType.EMPLOYEE &&
      watchedFormState.timeFor.id
    ) {
      const employeeId = watchedFormState.timeFor.id;
      getEmployee({
        variables: {
          employeeId,
          shouldFetchTimeOffPolicies: hasPayroll,
        },
      });
    } else if (
      watchedFormState.timeFor.type === TimeForType.VENDOR &&
      watchedFormState.timeFor.id
    ) {
      getVendorData(watchedFormState.timeFor.id);
    }
  }, [
    getEmployee,
    getVendorData,
    hasPayroll,
    watchedFormState.timeFor.id,
    watchedFormState.timeFor.type,
  ]);

  // run when get service item changes
  useEffect(() => {
    const { notes } = singleTimeEntryFormMethods.getValues();
    if (
      singleTimeEntryFormMethods.getValues().id &&
      !singleTimeEntryFormMethods.formState.isDirty
    )
      return;
    if (watchedFormState.service.id) {
      if (serviceDescriptionRef.current) {
        if (
          notes !== '' &&
          notes !== null &&
          oldServiceDescriptionRef.current !== notes
        ) {
          // if notes are already present for a saved time activity OR were manually entered by a user
          // then open a modal to confirm changing notes to service description
          setNotesOverwriteModelOpen(true);
        } else {
          // setting the notes with default description for the selected service
          singleTimeEntryFormMethods.setValue(
            'notes',
            serviceDescriptionRef.current,
          );
          oldServiceDescriptionRef.current = serviceDescriptionRef.current;
        }
      } else if (
        notes === '' ||
        notes === null ||
        oldServiceDescriptionRef.current === notes
      ) {
        singleTimeEntryFormMethods.setValue(
          'notes',
          serviceDescriptionRef.current,
        );
      }
      singleTimeEntryFormMethods.setValue('taxable', serviceTaxableRef.current);
    }
  }, [singleTimeEntryFormMethods, watchedFormState.service.id]);

  // run hook when uxPreference for a preselected team member name is retrieved
  useEffect(() => {
    // do not apply preferences if loading an existing time entry
    if (id || txnId || customerId || timeEntryId) {
      return;
    }
    // do not apply preferences during save and copy; reset flag so next run proceeds normally
    if (isSaveAndCopyInProgress.current) {
      isSaveAndCopyInProgress.current = false;
      return;
    }
    const valuesToReset: Partial<SingleTimeFormState> = {};

    // TODO WFS: Need to add condition of employee's role (i.e. manager role or employee role) with these two conditions too.
    // If employeeId is passed (for workforce users), set it as the default timeFor
    if (isWorkforceUser && employeeId) {
      sandbox.logger.info(
        'Component=SingleTimeHOC Event=SettingEmployeeIdAsDefaultTimeFor',
        {
          employeeId,
          source: 'workforce',
        },
      );
      valuesToReset.timeFor = {
        id: employeeId,
        name: '', // Name will be populated by the TeamMember component
        type: TimeForType.EMPLOYEE, // Type will be determined by the component
      };
    } else if (
      timeTrackingPreferences[UxPreferenceKey.TIME_ENTRY_TIME_FOR] &&
      timeTrackingPreferences[UxPreferenceKey.TIME_ENTRY_TIME_FOR].id !== '' &&
      timeTrackingPreferences[UxPreferenceKey.TIME_ENTRY_TIME_FOR].id !==
        singleTimeEntryFormMethods.getValues().timeFor.id
    ) {
      valuesToReset.timeFor =
        timeTrackingPreferences[UxPreferenceKey.TIME_ENTRY_TIME_FOR];
    }
    if (
      timeTrackingPreferences[
        UxPreferenceKey.TIME_ENTRY_LAST_USED_START_END_TIME
      ] !== undefined
    ) {
      valuesToReset.toggleClockIn =
        timeTrackingPreferences[
          UxPreferenceKey.TIME_ENTRY_LAST_USED_START_END_TIME
        ];
    }
    singleTimeEntryFormMethods.reset(
      {
        ...singleTimeEntryFormMethods.getValues(),
        ...valuesToReset,
      },
      {
        keepErrors: true,
      },
    );
  }, [
    customerId,
    id,
    singleTimeEntryFormMethods,
    timeTrackingPreferences,
    txnId,
    timeEntryId,
    employeeId,
  ]);

  const [canAccessSalesInfo, setCanAccessSalesInfo] = useState(false);

  // Effect to apply timezone conversion inplace, have default dates and times for new single time entries
  useEffect(() => {
    const currentFormValues = singleTimeEntryFormMethods.getValues();
    const hasExistingId = currentFormValues.id;
    const timeEntryTimezone = currentFormValues.timezone;

    // Dont do default date/time or timezone conversion of Date/Time in place for existing time record or time activity
    // TODO: To enable this for time activity as well once we have a long term solution for time activity timezone
    if (hasExistingId || !isSingleTimeEntry) {
      return;
    }

    // Use form timezone if available, otherwise fallback to settings timezone
    const timezoneToUse = timeEntryTimezone || settingsData.timezone;

    // Only apply timezone conversion in place for new single time entries (when id is not present)
    if (timezoneToUse) {
      // Convert START DATE and START TIME to timezone
      const { date: startDate, time: startTime } =
        combineDateAndTimeAndConvertToTimezone(
          currentFormValues.startDate,
          currentFormValues.startTime,
          timezoneToUse,
        );

      singleTimeEntryFormMethods.setValue('startDate', startDate);
      singleTimeEntryFormMethods.setValue('startTime', startTime);

      // Convert END DATE and END TIME to timezone
      const { date: endDate, time: endTime } =
        combineDateAndTimeAndConvertToTimezone(
          isOTX ? currentFormValues.endDate : currentFormValues.startDate,
          currentFormValues.endTime,
          timezoneToUse,
        );

      // Set endTime for all users, endDate only for OTX
      singleTimeEntryFormMethods.setValue('endTime', endTime);
      if (isOTX) {
        singleTimeEntryFormMethods.setValue('endDate', endDate);
      }
    }
  }, [
    isSingleTimeEntry,
    isOTX,
    settingsData.timezone,
    singleTimeEntryFormMethods,
    watchedFormState.timezone, // Watch for timezone changes in the form
  ]);

  // Effect to have endDate follow startDate (only when user manually changes startDate)
  useEffect(() => {
    if (isOTX && isSingleTimeEntry) {
      const startDate = singleTimeEntryFormMethods.getValues('startDate');
      const endDate = singleTimeEntryFormMethods.getValues('endDate');
      const id = singleTimeEntryFormMethods.getValues('id');

      // For initial load of existing time entry, don't override endDate
      if (isInitialTimeEntryLoad.current && id) {
        isInitialTimeEntryLoad.current = false;
        return;
      }

      // Only sync endDate with startDate if user manually changed startDate
      // Check if startDate is in dirtyFields (meaning user manually changed it)
      const isStartDateManuallyChanged = dirtyFields.startDate;

      if (
        isStartDateManuallyChanged &&
        (!endDate || !endDate.isSame(startDate))
      ) {
        singleTimeEntryFormMethods.setValue('endDate', startDate);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isOTX,
    isSingleTimeEntry,
    singleTimeEntryFormMethods.getValues('startDate'),
    dirtyFields.startDate, // Watch for manual changes to startDate
  ]);

  // Handle autoCalculateMileage checkbox changes and distanceTracking updates for mileage field
  useEffect(() => {
    // Only update if distance tracking data exists else return early
    if (!distanceTracking) return;

    let mileageValue;
    // if autoCalculateMileage is true, use autoCalculatedMeters
    if (autoCalculateMileage) {
      // When auto-calculate is enabled, use autoCalculatedMeters
      mileageValue = distanceTracking.autoCalculatedMeters ?? null;
    } else {
      // When auto-calculate is disabled, use manualMeters if available
      mileageValue = distanceTracking.manualMeters ?? null;
    }
    singleTimeEntryFormMethods.setValue('mileage', mileageValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCalculateMileage, distanceTracking]);

  // fetch and set can access sales info
  useEffect(() => {
    if (!isWorkforceEnvironment(sandbox)) {
      NeoApiClient('security/settings?fields=canAccessSalesInfo', sandbox).then(
        (response) => {
          setCanAccessSalesInfo(response.canAccessSalesInfo);
        },
      );
    }
  }, [sandbox]);

  const {
    data: v3PreferencesData,
    loading: v3PreferencesLoading,
    error: v3PreferencesError,
  } = useGetPreferences();
  // if error feteching data mark showBillRateToAll false
  const showBillRateToAll = v3PreferencesError
    ? false
    : getShowBillRateToAll(v3PreferencesData);
  // In workforce environment, use billingRateForTimeEnabled (employer setting) instead of ShowBillRateToAll (user preference unavailable)
  const isBillRateEnable = isWorkforceEnvironment(sandbox)
    ? settingsData.billingRateForTimeEnabled ?? false
    : canAccessSalesInfo || showBillRateToAll;

  const labelPreference = {
    DepartmentTerminology:
      v3PreferencesData?.Preferences.AccountingInfoPrefs
        .DepartmentTerminology || '',
    CustomerTerminology:
      v3PreferencesData?.Preferences.AccountingInfoPrefs.CustomerTerminology ||
      '',
  };
  // -------------------------------- component interaction handlers
  const setErrorMessageAndScrollIntoView = (error: string) => {
    setErrorMessage(error);
    ignoreCloseBooksCheck.current = false;
    document
      .querySelector('[data-testid="SingleTimeHOCErrorPageMessage"]')
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleUpdateOrDeleteError = useCallback(
    (
      error: string,
      _element?: string,
      meta?: {
        errorCode?: string;
        subCode?: string;
      },
      action: PendingSaveBannerAction = PendingSaveBannerAction.UPDATE,
    ) => {
      const currentEntryId = singleTimeEntryFormMethods.getValues().id;
      const pendingMessage = !isSingleTimeEntry
        ? resolvePendingMessageForError(
            meta?.errorCode,
            meta?.subCode,
            action,
            currentEntryId,
          )
        : null;

      if (pendingMessage) {
        setErrorMessage(null);
        setPendingSaveMessage(pendingMessage);
        return;
      }

      setErrorMessageAndScrollIntoView(error);
    },
    [
      isSingleTimeEntry,
      resolvePendingMessageForError,
      setErrorMessageAndScrollIntoView,
      singleTimeEntryFormMethods,
    ],
  );

  const resetNewForm = useCallback(() => {
    const employeeCostRate =
      employee?.employmentDetail?.jobCosting?.costRate || null;
    const vendorCostRate = vendorData?.Vendor?.CostRate || null;

    const costRate =
      singleTimeEntryFormMethods.getValues().timeFor.type ===
      TimeForType.EMPLOYEE
        ? employeeCostRate
        : vendorCostRate;

    singleTimeEntryFormMethods.setValue('costRate', costRate);
    singleTimeEntryFormMethods.reset({
      ...DEFAULT_SINGLE_TIME_FORM_STATE,
      timeFor: singleTimeEntryFormMethods.getValues().timeFor,
      billable: singleTimeEntryFormMethods.getValues().billable,
      billRate: singleTimeEntryFormMethods.getValues().billRate,
      costRate,
      startDate: singleTimeEntryFormMethods.getValues().startDate,
      endDate:
        isOTX && isSingleTimeEntry
          ? singleTimeEntryFormMethods.getValues().startDate
          : undefined,
      toggleClockIn: singleTimeEntryFormMethods.getValues().toggleClockIn,
      isApproved: isApproved || false,
      isLocked: false,
      isExported: !isSingleTimeEntry,
      timezone:
        singleTimeEntryFormMethods.getValues().timezone ||
        settingsData.timezone,
      customFields: (() => {
        const currentCustomFields =
          singleTimeEntryFormMethods.getValues().customFields || {};
        const resetCustomFields: Record<string, any> = {};
        Object.values(currentCustomFields).forEach((field) => {
          resetCustomFields[field.id] = {
            ...field,
            value: '',
            optionID: undefined, // Clear optionID when resetting
          };
        });
        return resetCustomFields;
      })(),
    });
    singleTimeEntryFormMethods.setValue('endTime', undefined);
    singleTimeEntryFormMethods.setValue('startTime', undefined);
  }, [
    employee?.employmentDetail?.jobCosting?.costRate,
    singleTimeEntryFormMethods,
    vendorData?.Vendor,
    isApproved,
    isSingleTimeEntry,
    isOTX,
  ]);

  const resetSameForm = useCallback(() => {
    singleTimeEntryFormMethods.reset(singleTimeEntryFormMethods.getValues(), {
      keepValues: true,
    });
  }, [singleTimeEntryFormMethods]);

  const handleClose = useCallback(() => {
    resetNewForm();
    clearCachedLockContext();
    setErrorMessage(null);
    setIsSettingsPopoverOpen(false);
    setConfirmedChanges({});
    setOpen(false);
    // Publish close event only if unification is enabled
    if (isFreeDataWithUnificationEnabled) {
      sandbox.pubsub.publish(SINGLE_TIME_TROWSER_EVENTS.CLOSE, {});
    }
  }, [
    clearCachedLockContext,
    resetNewForm,
    setOpen,
    sandbox.pubsub,
    isFreeDataWithUnificationEnabled,
  ]);

  const renderFeedbackTrigger = useCallback(
    (handleAccessPointClick: () => void) => {
      setTriggerFeedback(() => handleAccessPointClick);
      return null;
    },
    [],
  );

  const handleSettingsIconClick = () => {
    setIsSettingsPopoverOpen(!isSettingsPopoverOpen);
  };

  const handleFeedbackIconClick = useCallback(async () => {
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
  }, [track, isWFSUser, isSingleTimeEntry, sandbox.logger]);

  const handleHistoryIconClick = useCallback(() => {
    // time entry screen doesnot have history icon
    track(trackingPoints.SEE_RECENT_TIME_ACTIVITIES);
    setRecentTimeActivitiesModalOpen((prev: boolean) => !prev);
  }, [track]);

  // Handler for different actions on recent time activities modal
  const handleNavigateForTimeActivity = useCallback(
    (id?: string) => {
      const currentUrl = window.location.href.split('/timeactivity')[0];
      // navigate to time activity page with id if id is present,
      // otherwise navigate to txn search page
      const navigatedUrl = id
        ? `${currentUrl}/timeactivity?id=${id}`
        : `${currentUrl}/txnSearch`;
      navigator.navigate(navigatedUrl);
    },
    [navigator],
  );

  // Handler for different actions on recent time entries modal
  const handleNavigateForTimeEntry = useCallback(
    (id?: string) => {
      if (!id) {
        // For "view more" click, close the drawer
        handleClose();
      } else {
        // For item select, reset current data first, then fetch the new time entry
        resetSingleTimeEntry();
        getTimeEntry({
          variables: {
            input: {
              id,
              isExported: false,
            },
          },
        });
      }
    },
    [handleClose, getTimeEntry, resetSingleTimeEntry],
  );

  // Unified handler based on whether it's a time activity or time entry
  const handleRecentTimeSelect = useCallback(
    (id?: string) => {
      if (id) {
        // Clear stale pending banner when loading a different recent activity/entry.
        setPendingSaveMessage(null);
        clearCachedLockContext();
      }
      isSingleTimeEntry
        ? handleNavigateForTimeEntry(id)
        : handleNavigateForTimeActivity(id);
    },
    [
      isSingleTimeEntry,
      clearCachedLockContext,
      handleNavigateForTimeEntry,
      handleNavigateForTimeActivity,
    ],
  );

  const handleFeedbackClose = useCallback(
    (result: { success: boolean } | null) => {
      setShowFeedbackPopover(false);
      if (result?.success) {
        showToast('FEEDBACK');
      }
    },
    [],
  );

  const handleOverwriteNotesChanges = () => {
    // setting the notes with default description for the selected service
    singleTimeEntryFormMethods.setValue(`notes`, serviceDescriptionRef.current);
    oldServiceDescriptionRef.current = serviceDescriptionRef.current;
    setNotesOverwriteModelOpen(false);
  };

  const setPreferencesOnSave = useCallback(
    (additionalPreferences = {}) => {
      setPreferences({
        [UxPreferenceKey.TIME_ENTRY_LAST_USED_START_END_TIME]:
          singleTimeEntryFormMethods.getValues().toggleClockIn,
        [UxPreferenceKey.TIME_ENTRY_TIME_FOR]:
          singleTimeEntryFormMethods.getValues().timeFor,
        ...additionalPreferences,
      });
    },
    [setPreferences, singleTimeEntryFormMethods],
  );

  const handleSaveAndNewSuccess = useCallback(
    (selectedSplitCta: string) => {
      ignoreCloseBooksCheck.current = false;
      clearCachedLockContext();
      showToast('SAVE');
      setErrorMessage(null);
      setIsSettingsPopoverOpen(false);
      removeTimeTrackingQueryParams();
      resetSingleTimeEntry();
      resetSingleTimeEntry_byTransactionId();
      setPreferencesOnSave({
        [UxPreferenceKey.TIME_ENTRY_SELECTED_SPLIT_CTA]: selectedSplitCta,
      });
      resetNewForm();
    },
    [
      resetNewForm,
      resetSingleTimeEntry,
      resetSingleTimeEntry_byTransactionId,
      setPreferencesOnSave,
      clearCachedLockContext,
    ],
  );

  const handleSaveAndCloseSuccess = (selectedSplitCta: string) => {
    ignoreCloseBooksCheck.current = false;
    showToast('SAVE');
    // give time for success toast to be shown before closing the widget
    setTimeout(() => {
      handleClose();
    }, 1000);
    setPreferencesOnSave({
      [UxPreferenceKey.TIME_ENTRY_SELECTED_SPLIT_CTA]: selectedSplitCta,
    });
  };

  const handleSaveAndCopySuccess = useCallback(
    (selectedSplitCta: string) => {
      ignoreCloseBooksCheck.current = false;
      clearCachedLockContext();
      isSaveAndCopyInProgress.current = true;
      showToast('SAVE_AND_COPY');
      setErrorMessage(null);
      setIsSettingsPopoverOpen(false);
      removeTimeTrackingQueryParams();
      resetSingleTimeEntry();
      resetSingleTimeEntry_byTransactionId();

      // Update preferences with current timeFor to prevent useEffect from resetting
      // to stale preference value when form id is cleared
      setPreferencesOnSave({
        [UxPreferenceKey.TIME_ENTRY_SELECTED_SPLIT_CTA]: selectedSplitCta,
      });

      // Retain form changes but reset the ID to treat as new entry
      const currentFormValues = singleTimeEntryFormMethods.getValues();
      const formValuesWithoutId = {
        ...currentFormValues,
        id: undefined, // Reset ID to treat as new entry
        version: '0', // Reset version for new entry
        isCopied: true, // Flag to mark the time record as copied
      };

      // Reset form with current values but without any ID
      singleTimeEntryFormMethods.reset(formValuesWithoutId);
    },
    [
      resetSingleTimeEntry,
      resetSingleTimeEntry_byTransactionId,
      setPreferencesOnSave,
      singleTimeEntryFormMethods,
      clearCachedLockContext,
    ],
  );

  const onSaveSuccess = useCallback(
    (data: TimeTracking_BatchManageTimeEntriesPayload) => {
      ignoreCloseBooksCheck.current = false;
      if (data.timeEntries?.length > 0) {
        const timeEntry = data.timeEntries[0];
        singleTimeEntryFormMethods.setValue('id', timeEntry.id);
        singleTimeEntryFormMethods.setValue(
          'version',
          timeEntry.meta?.version || '0',
        );
        singleTimeEntryFormMethods.setValue('service', {
          id: timeEntry.serviceItem?.id || '',
          name: '',
        });

        // Update distance tracking data from response if present
        const mappedFormState = mapTimeEntryToSingleTimeFormState(
          timeEntry,
          settingsData.timezone,
        );

        // Update distanceTracking and autoCalculateMileage from mapped response
        // The useEffect watching these values will automatically update the mileage field
        singleTimeEntryFormMethods.setValue(
          'distanceTracking',
          mappedFormState.distanceTracking,
        );
        singleTimeEntryFormMethods.setValue(
          'autoCalculateMileage',
          mappedFormState.autoCalculateMileage === undefined
            ? true
            : mappedFormState.autoCalculateMileage,
        );

        singleTimeEntryFormMethods.setValue('mileage', mappedFormState.mileage);
      }
      setPreferencesOnSave();
      resetSameForm();
      // Clear the copied flag after resetSameForm (resetSameForm keeps values, so set it after)
      singleTimeEntryFormMethods.setValue('isCopied', false);
      showToast('SAVE');
    },
    [
      resetSameForm,
      setPreferencesOnSave,
      singleTimeEntryFormMethods,
      settingsData.timezone,
    ],
  );

  const onDeleteSuccess = useCallback(() => {
    showToast('DELETE');
    // Wait for the toast to be shown before closing the widget
    setTimeout(() => {
      handleClose();
    }, 1000);
  }, [handleClose]);

  const [deleteSingleTimeEntry] = useDeleteTimeEntry({
    onSuccess: onDeleteSuccess,
    onError: setErrorMessageAndScrollIntoView,
  });

  const [deleteTimeEntry] = useBatchSaveTimeEntries({
    onSuccess: onDeleteSuccess,
    onError: (error, element, meta) =>
      handleUpdateOrDeleteError(
        error,
        element,
        meta,
        PendingSaveBannerAction.DELETE,
      ), // handles delete errors
    interaction: TimeCustomerInteraction.SINGLE_TIME_DELETE,
  });

  const handleDeleteTimeEntrySubmit_batch = () => {
    const formState = singleTimeEntryFormMethods.getValues();

    // Check if time entry is invoiced
    if (formState.invoiceId) {
      setErrorMessage(
        intl.formatMessage({
          id: 'time.tracking.validation.invoiced.delete',
        }),
      );
      setDeleteConfirmationModalOpen(false);
      return;
    }

    // Prioritize formState.id over timeEntryId because formState.id reflects the currently loaded time entry (e.g., after selecting from Recent Time Activities),
    // timeEntryId is the initial widget prop that may be stale.
    const entryId = formState.id || timeEntryId;
    if (isSingleTimeEntry && entryId) {
      // Use the single time entry delete mutation
      sandbox.logger.info(
        'Component=SingleTimeHOC Event=Delete single time entry',
      );
      deleteSingleTimeEntry({
        variables: {
          input: {
            id: entryId,
            isExported: false,
          },
        },
      });
    } else {
      // Use the batch delete mutation
      const input = mapAddSingleTimeEntryForm_forBatchDeleteInput(formState);
      // batch apis are currently only used for time activities
      sandbox.logger.info(
        'Component=SingleTimeHOC Event=Delete time activity using batch API',
      );

      if (
        !ignoreCloseBooksCheck.current &&
        settingsData.isCloseBookDateEnabled &&
        settingsData.closeBookDate.isAfter(formState.startDate)
      ) {
        setCloseBooksModalOpen(true);
      } else {
        createCustomerInteraction(
          sandbox,
          TimeCustomerInteraction.SINGLE_TIME_DELETE,
        );
        deleteTimeEntry({
          variables: {
            input,
          },
          context: {
            clientName: ApolloClientNames.TIME_TRACKING,
            headers: {
              ...getCustomerInteractionPropagationHeaders(
                sandbox,
                TimeCustomerInteraction.SINGLE_TIME_DELETE,
              ),
              ...timeSummaryTAHeader,
            },
          },
        });
      }
    }
  };

  // Add useCreateTimeEntry hook
  const [createSingleTimeEntry, { loading: createSingleTimeEntryLoading }] =
    useCreateTimeEntry({
      onSuccess: (data) => {
        if (data.length > 0) {
          singleTimeEntryFormMethods.setValue('id', data[0].id);
          singleTimeEntryFormMethods.setValue(
            'version',
            data[0].meta?.version || '0',
          );
          singleTimeEntryFormMethods.setValue('service', {
            id: data[0].serviceItem?.id || '',
            name: '',
          });
        }
        setAfterTaskModalPending(sandbox);
        onMutationSuccessCallback.current({
          timeEntries: data,
          successCode: 'SUCCESS',
          deletes: [],
        });
      },
      onError: setErrorMessageAndScrollIntoView,
    });

  // Add useUpdateTimeEntry hook
  const [updateSingleTimeEntry, { loading: updateSingleTimeEntryLoading }] =
    useUpdateTimeEntry({
      onSuccess: (data) => {
        if (data.length > 0) {
          singleTimeEntryFormMethods.setValue('id', data[0].id);
          singleTimeEntryFormMethods.setValue(
            'version',
            data[0].meta?.version || '0',
          );
          singleTimeEntryFormMethods.setValue('service', {
            id: data[0].serviceItem?.id || '',
            name: '',
          });
        }
        onMutationSuccessCallback.current({
          timeEntries: data,
          successCode: 'SUCCESS',
          deletes: [],
        });
      },
      onError: setErrorMessageAndScrollIntoView,
    });

  const updateLabel = (field: string, value: string) => {
    const currentValues = quickFillFieldLabels.current || {};
    if (field === 'customerProject') {
      const parts = value.split(':', 2);
      const [customer = '', project = ''] = parts;
      currentValues.customer = customer;
      currentValues.project = project;
    } else {
      currentValues[field] = value;
    }

    quickFillFieldLabels.current = currentValues;
  };

  const handleSaveTimeEntrySubmit_batch = () => {
    // Check if currentlyWorking is true and automatically set save and close behavior in this case
    const isOpenTimeEntry =
      singleTimeEntryFormMethods.getValues().currentlyWorking;
    if (isOpenTimeEntry === true) {
      // For a open time entry, set the success callback to handle save and close.
      onMutationSuccessCallback.current = handleSaveAndCloseSuccess.bind(
        null,
        TIME_ENTRY_SPLIT_CTA_OPTIONS.SAVE_AND_CLOSE.key,
      );
    }
    // function to handle single time entry update
    const handleSingleTimeEntryUpdate = (formState: SingleTimeFormState) => {
      const singleTimeInput =
        mapAddSingleTimeEntryForm_forUpdateInput<TimeTracking_UpdateTimeEntryInput>(
          formState,
          settingsData,
          timeTrackingPreferences,
          hasPayroll,
          quickFillFieldLabels.current,
          dirtyFields,
          hasTimeElite && settingsData.mileageTrackingEnabled,
          isBillableFieldAssignedRef.current,
          isLegacyQboUserEnabled,
        );

      sandbox.logger.info(
        'Component=SingleTimeHOC Event=Update time entry using single time entry API',
      );
      updateSingleTimeEntry({
        variables: { input: singleTimeInput },
      });
    };

    const handleBatchTimeActivityUpdate = (formState: SingleTimeFormState) => {
      if (
        !ignoreCloseBooksCheck.current &&
        settingsData.isCloseBookDateEnabled &&
        settingsData.closeBookDate.isAfter(formState.startDate)
      ) {
        setCloseBooksModalOpen(true);
        return;
      }

      sandbox.logger.info(
        'Component=SingleTimeHOC Event=Update time activity using batch API',
      );
      createCustomerInteraction(
        sandbox,
        TimeCustomerInteraction.SINGLE_TIME_UPDATE,
      );
      const input = mapAddSingleTimeEntryForm_forBatchCreateUpdateInput(
        formState,
        settingsData,
        timeTrackingPreferences,
        hasPayroll,
        dirtyFields,
        isLegacyQboUserEnabled,
      );
      updateTimeEntry({
        variables: { input },
        context: {
          clientName: ApolloClientNames.TIME_TRACKING,
          headers: {
            ...getCustomerInteractionPropagationHeaders(
              sandbox,
              TimeCustomerInteraction.SINGLE_TIME_UPDATE,
            ),
            ...timeSummaryTAHeader,
          },
        },
      });
    };

    const handleSingleTimeEntryCreate = (formState: SingleTimeFormState) => {
      const singleTimeInput =
        mapAddSingleTimeEntryForm_forCreateInput<TimeTracking_CreateTimeEntryInput>(
          formState,
          settingsData,
          timeTrackingPreferences,
          hasPayroll,
          false,
          quickFillFieldLabels.current,
          undefined,
          undefined,
          isBillableFieldAssignedRef.current,
          isLegacyQboUserEnabled,
        );

      sandbox.logger.info(
        'Component=SingleTimeHOC Event=Create time entry using single time entry API',
      );
      createSingleTimeEntry({
        variables: { input: singleTimeInput },
      });
    };

    const handleBatchTimeActivityCreate = (formState: SingleTimeFormState) => {
      if (
        !ignoreCloseBooksCheck.current &&
        settingsData.isCloseBookDateEnabled &&
        settingsData.closeBookDate.isAfter(formState.startDate)
      ) {
        setCloseBooksModalOpen(true);
        return;
      }

      sandbox.logger.info(
        'Component=SingleTimeHOC Event=Create time activity using batch API',
      );
      createCustomerInteraction(
        sandbox,
        TimeCustomerInteraction.SINGLE_TIME_CREATE,
      );
      const input = mapAddSingleTimeEntryForm_forBatchCreateUpdateInput(
        formState,
        settingsData,
        timeTrackingPreferences,
        hasPayroll,
        undefined,
        isLegacyQboUserEnabled,
      );
      createTimeEntry({
        variables: { input },
        context: {
          clientName: ApolloClientNames.TIME_TRACKING,
          headers: {
            ...getCustomerInteractionPropagationHeaders(
              sandbox,
              TimeCustomerInteraction.SINGLE_TIME_CREATE,
            ),
            ...timeSummaryTAHeader,
          },
        },
      });
    };

    const attemptSaveTimeEntry_batch: SubmitHandler<SingleTimeFormState> = (
      formState: SingleTimeFormState,
    ) => {
      if (formState.id) {
        isSingleTimeEntry
          ? handleSingleTimeEntryUpdate(formState)
          : handleBatchTimeActivityUpdate(formState);
      } else {
        isSingleTimeEntry
          ? handleSingleTimeEntryCreate(formState)
          : handleBatchTimeActivityCreate(formState);
      }
    };

    singleTimeEntryFormMethods.handleSubmit(attemptSaveTimeEntry_batch)();
  };

  const handleSettingsSaveSuccess = () => {
    // TODO: wait a bit for settings change to persist
    setTimeout(refetchSettings, 500);
    setTimeout(
      () => getPreference(UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS),
      500,
    );
  };

  const handleDeleteButtonClick = () => {
    track(trackingPoints.DELETE);
    setPendingSaveMessage(null);
    setDeleteConfirmationModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    // skip validations on delete
    // this is point where single Time Entry delete is diverted to use the batch API instead
    // handleDeleteTimeEntrySubmit();

    // Close the confirmation modal before submitting the delete request.  If success, we'll close the whole trowser. If
    // there's an error, we'll show the error message in the trowser.
    setDeleteConfirmationModalOpen(false);
    handleDeleteTimeEntrySubmit_batch();
  };

  const handleCloseBooksSaveConfirm = () => {
    setCloseBooksModalOpen(false);
    ignoreCloseBooksCheck.current = true;
    handleSaveTimeEntrySubmit_batch();
  };

  const handleSaveButtonClick = () => {
    track(trackingPoints.SAVE);
    onMutationSuccessCallback.current = onSaveSuccess;
    setErrorMessage(null);
    setPendingSaveMessage(null);
    // this is point where single Time Entry create and update is diverted to use the batch API instead
    // handleSingleTimeEntryFormSubmit();
    handleSaveTimeEntrySubmit_batch();
  };

  const handleSplitCTAOptionClicked = (option: string) => {
    // Configuration for each split CTA option
    const optionConfig: Record<
      string,
      {
        trackingPoint: any;
        successHandler: (option: string) => void;
      }
    > = {
      saveAndNew: {
        trackingPoint: trackingPoints.SAVE_AND_NEW,
        successHandler: handleSaveAndNewSuccess,
      },
      saveAndClose: {
        trackingPoint: trackingPoints.SAVE_AND_CLOSE,
        successHandler: handleSaveAndCloseSuccess,
      },
      saveAndCopy: {
        trackingPoint: trackingPoints.SAVE_AND_COPY,
        successHandler: handleSaveAndCopySuccess,
      },
    };

    const config = optionConfig[option];
    if (!config) return;

    // Track the action
    track(config.trackingPoint);

    // Set up success callback, set error message to null and then submit
    onMutationSuccessCallback.current = config.successHandler.bind(
      null,
      option,
    );
    setErrorMessage(null);
    setPendingSaveMessage(null);
    handleSaveTimeEntrySubmit_batch();
  };

  const handleSplitButtonClick = () => {
    handleSplitCTAOptionClicked(splitCTAPrimaryOption.value);
  };

  const handleSplitButtonSelect = (e: any) => {
    handleSplitCTAOptionClicked(e.target.value);
  };

  const handleCloseWithUnsavedChanges = useCallback(() => {
    track(trackingPoints.CANCEL);
    if (isFormDirty(singleTimeEntryFormMethods.formState)) {
      setUnsavedChangesModalOpen(true);
    } else {
      handleClose();
    }
  }, [track, singleTimeEntryFormMethods.formState, handleClose]);

  // ----------------------------------- component mutation hooks

  const [createTimeEntry, { loading: createLoading }] = useBatchSaveTimeEntries(
    {
      onSuccess: (payload) => {
        updateCachedLockContextFromPayload(payload);
        setAfterTaskModalPending(sandbox);
        onMutationSuccessCallback.current?.(payload);
      },
      onError: setErrorMessageAndScrollIntoView,
      interaction: TimeCustomerInteraction.SINGLE_TIME_CREATE,
    },
  );

  const [updateTimeEntry, { loading: updateLoading }] = useBatchSaveTimeEntries(
    {
      onSuccess: (payload) => {
        updateCachedLockContextFromPayload(payload);
        onMutationSuccessCallback.current?.(payload);
      },
      onError: handleUpdateOrDeleteError,
      interaction: TimeCustomerInteraction.SINGLE_TIME_UPDATE,
    },
  );

  // ----------------------------------- consolidate component state
  const consolidatedPageLoading = useConsolidatedLoading([
    !isTeamMembersDropdownResolved,
    !isCanManageTimesheetsResolved,
    timeTrackingOnlyId ? userInfoLoading : false, // userInfo is only needed for time tracking only users
    singleTimeEntryLoading && !getTimeEntryError,
    settingsLoading && !settingsError,
    !isSingleTimeEntry ? preferencesLoading : false,
    entitlementsLoading && !entitlementsError,
    timeTrackingAuthLoading && !timeTrackingAuthError,
    singleTimeEntryDataLoading_byTransactionId,
    v3PreferencesLoading && !v3PreferencesError,
    teamMembersDropdownLoading,
    // Below are the loading states for standard form fields (only valid for time activity scenarios when singleTimeEntry is false)
    !isSingleTimeEntry ? loadingStates.teamMember : false,
    !isSingleTimeEntry ? loadingStates.customerProject : false,
    !isSingleTimeEntry &&
    settingsData?.isLocationEnabled &&
    timeTrackingPreferences[UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS]
      .isLocationFieldEnabled
      ? loadingStates.location
      : false,
    !isSingleTimeEntry && settingsData?.isServiceFieldEnabled
      ? loadingStates.service
      : false,
    !isSingleTimeEntry &&
    settingsData?.isClassEnabled &&
    timeTrackingPreferences[UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS]
      .isClassFieldEnabled
      ? loadingStates.class
      : false,
  ]);

  const consolidatedButtonLoadingState =
    createLoading ||
    updateLoading ||
    createSingleTimeEntryLoading ||
    updateSingleTimeEntryLoading;

  // Decide whether to show the single time activity intro modal once everything has loaded
  useEffect(() => {
    if (
      open &&
      !preferencesLoading &&
      !consolidatedPageLoading &&
      !singleTimeActivityTourRes.current &&
      isFreeDataWithUnificationEnabled
    ) {
      const tourCompleted =
        timeTrackingPreferences[
          UxPreferenceKey.SINGLE_TIME_ACTIVITY_TOUR_COMPLETED
        ];
      setSingleTimeActivityIntroModalOpen(tourCompleted !== true);
      singleTimeActivityTourRes.current = true;
      if (tourCompleted !== true) {
        // Log tour start with popover instrumentation
        logPopoverOpen({
          stepHeading:
            singleTimeActivityTourSteps[0]?.title ||
            SINGLE_TIME_ACTIVITY_TOUR_HEADING,
          popoverHeading: SINGLE_TIME_ACTIVITY_TOUR_HEADING,
          tourType: 'single-time-activity',
          action: 'tour-started',
        });
      }
    } else if (!open) {
      // Drawer closed: clear modal
      setSingleTimeActivityIntroModalOpen(false);
    }
    // logPopoverOpen and singleTimeActivityTourSteps are intentionally omitted —
    // both are recreated on every render, and the singleTimeActivityTourRes ref
    // already guards this effect to resolve only once per open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    preferencesLoading,
    consolidatedPageLoading,
    timeTrackingPreferences,
    isFreeDataWithUnificationEnabled,
  ]);

  // Adds keyboard event listeners for save and save-and-close shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Save & New shortcut: Ctrl + Alt + S, Save and Close shortcut: Ctrl + Alt + D ( For, Mac Alt = Option)
      const isSaveAndNewShortcut =
        event.ctrlKey && event.altKey && event.code === 'KeyS';
      const isSaveAndCloseShortcut =
        event.ctrlKey && event.altKey && event.code === 'KeyD';

      if (isSaveAndNewShortcut) {
        event.preventDefault();
        if (!consolidatedButtonLoadingState) {
          handleSplitButtonSelect({ target: { value: 'saveAndNew' } });
        }
      } else if (isSaveAndCloseShortcut) {
        event.preventDefault();
        if (!consolidatedButtonLoadingState) {
          handleSplitButtonSelect({ target: { value: 'saveAndClose' } });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Remove the event listener when the component is unmounted to prevent memory leakage
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consolidatedButtonLoadingState]);

  const fieldsWithData = computeFieldsWithData(watchedFormState);

  // Compute isMileageEnabled based on conditions
  // In STE, Mileage is only available for TSheets Elite companies in update time entry flow
  const isExistingTimeRecord = !!watchedFormState.id;
  const isMileageEnabled =
    isSingleTimeEntry &&
    isExistingTimeRecord &&
    hasTimeElite &&
    settingsData.mileageTrackingEnabled;

  // Watch for changes that should open the modal
  useEffect(() => {
    if (
      !dirtyFields ||
      Object.keys(dirtyFields).length === 0 ||
      isHandlingCancel.current
    ) {
      return;
    }
    /** This is to prevent the modal from opening when the closed book password is being changed as react-hook-form
     *doesn't detect changes to the closed book password field and mark it dirty, hence causing the invoicing modal to open
     */
    if (dirtyFields.closedBookPassword !== undefined) {
      return;
    }

    // Check if there are any invoiced time entries before proceeding
    const hasInvoicedEntry = (
      singleTimeEntryFormMethods.formState.defaultValues as any
    )?.invoiceId;

    if (!hasInvoicedEntry) {
      return;
    }

    setInvoicedModalOpen(true);
  }, [singleTimeEntryFormMethods.formState]);

  const handleModalConfirm = () => {
    if (isRestrictedChange) {
      // For restricted fields, always reset to previous values
      const defaultValues = singleTimeEntryFormMethods.formState
        .defaultValues as DefaultValues<SingleTimeFormState>;
      singleTimeEntryFormMethods.reset(defaultValues);
    } else {
      // For warnings (invoiced changes), keep the changes and store them in confirmedChanges
      const currentValues = singleTimeEntryFormMethods.getValues();
      // Store the current changes
      setConfirmedChanges({
        ...confirmedChanges,
        ...currentValues,
      });
      singleTimeEntryFormMethods.reset(
        currentValues as DefaultValues<SingleTimeFormState>,
      );
    }
    setInvoicedModalOpen(false);
  };

  const handleModalCancel = () => {
    isHandlingCancel.current = true;
    const defaultValues = singleTimeEntryFormMethods.formState
      .defaultValues as DefaultValues<SingleTimeFormState>;

    // Create new values starting with defaults
    const newValues = { ...defaultValues } as SingleTimeFormState;

    // Apply any previously confirmed changes
    Object.assign(newValues, confirmedChanges);

    // Reset form with default values + confirmed changes
    singleTimeEntryFormMethods.reset(newValues);
    setInvoicedModalOpen(false);

    // Reset the handling cancel flag after a short delay to allow the form to update
    setTimeout(() => {
      isHandlingCancel.current = false;
    }, 0);
  };

  const handleSingleTimeActivityTourComplete = async (
    completionMethod: 'finish' | 'close',
  ) => {
    try {
      // Save tour completion preference
      await setPreference(
        UxPreferenceKey.SINGLE_TIME_ACTIVITY_TOUR_COMPLETED,
        true,
      );

      // Log tour completion with popover instrumentation
      logTourComplete({
        stepHeading:
          singleTimeActivityTourSteps[singleTimeActivityTourSteps.length - 1]
            ?.title || SINGLE_TIME_ACTIVITY_TOUR_HEADING,
        popoverHeading: SINGLE_TIME_ACTIVITY_TOUR_HEADING,
        tourType: 'single-time-activity',
        completionMethod,
        isSingleTimeEntry,
        isOTX,
      });

      // Log tour completion
      sandbox.logger.info(
        completionMethod === 'finish'
          ? 'Single Time Activity Tour completed successfully'
          : 'Single Time Activity Tour closed and preference saved',
        {
          tourType: 'single-time-activity',
          completionMethod,
          isSingleTimeEntry,
          isOTX,
        },
      );
    } catch (error) {
      // Log error with popover instrumentation
      logPopoverError('Failed to save STA tour preference', {
        stepHeading:
          singleTimeActivityTourSteps[singleTimeActivityTourSteps.length - 1]
            ?.title || SINGLE_TIME_ACTIVITY_TOUR_HEADING,
        popoverHeading: SINGLE_TIME_ACTIVITY_TOUR_HEADING,
        tourType: 'single-time-activity',
        completionMethod,
        isSingleTimeEntry,
        isOTX,
        error: String(error),
      });

      sandbox.logger.error('Failed to save STA tour preference', { error });
    }
    setSingleTimeActivityIntroModalOpen(false);
  };

  const handleSingleTimeActivityTourFinish = () =>
    handleSingleTimeActivityTourComplete('finish');
  const handleSingleTimeActivityTourClose = () =>
    handleSingleTimeActivityTourComplete('close');

  if (isFullPageMaintenanceEnabled) {
    return (
      <StyledTrowser
        automationId={TROWSER_ID}
        dismissible
        open={open}
        showCancelFooterButton
        title={intl.formatMessage({
          id: isSingleTimeEntry
            ? 'trowser.title.single.time.entry'
            : 'trowser.title.single.day',
        })}
        onClose={handleCloseWithUnsavedChanges}
      >
        <MaintenancePage />
      </StyledTrowser>
    );
  }

  return (
    <>
      <StyledTrowser
        automationId={TROWSER_ID}
        dismissible
        settings={
          isSettingsAccessible && !timeTrackingAuthError && !isSingleTimeEntry
        }
        feedback={!timeTrackingAuthError}
        history
        showCancelFooterButton
        open={open}
        title={intl.formatMessage({
          id: isSingleTimeEntry
            ? 'trowser.title.single.time.entry'
            : 'trowser.title.single.day',
        })}
        onFeedbackIconClick={
          isUserVoiceEnabled ? triggerFeedback : handleFeedbackIconClick
        }
        isFeedbackMenuOpen={showFeedbackPopover}
        onSettingsIconClick={handleSettingsIconClick}
        isSettingsMenuOpen={isSettingsPopoverOpen}
        isHistoryMenuOpen={recentTimeActivitiesModalOpen}
        onHistoryIconClick={handleHistoryIconClick}
        onClose={handleCloseWithUnsavedChanges}
        footerCenterLinkLabels={
          singleTimeEntryFormMethods.getValues().id &&
          !timeTrackingAuthError &&
          !isApproved &&
          !isLocked &&
          !isSubmitted
            ? [
                intl.formatMessage({
                  id: 'delete',
                }),
              ]
            : []
        }
        footerCenterLinkActions={
          singleTimeEntryFormMethods.getValues().id &&
          !timeTrackingAuthError &&
          !isApproved &&
          !isLocked &&
          !isSubmitted
            ? [handleDeleteButtonClick]
            : []
        }
        footerButton={
          // Incase of authorisation error, or failure to fetch time entry (or activity), we don't show the save buttons
          timeTrackingAuthError || getTimeEntryError
            ? []
            : [
                <SplitButton
                  label={intl.formatMessage({
                    id: splitCTAPrimaryOption.labelKey,
                  })}
                  onClick={handleSplitButtonClick}
                  onSelect={handleSplitButtonSelect}
                  disabled={
                    consolidatedButtonLoadingState ||
                    isApproved ||
                    isLocked ||
                    isSubmitted
                  }
                  aria-label="single-time-split-button"
                >
                  <MenuItem
                    key={splitCTASecondaryOption.key}
                    value={splitCTASecondaryOption.value}
                  >
                    {intl.formatMessage({
                      id: splitCTASecondaryOption.labelKey,
                    })}
                  </MenuItem>
                  <MenuItem
                    key={splitCTATertiaryOption.key}
                    value={splitCTATertiaryOption.value}
                  >
                    {intl.formatMessage({
                      id: splitCTATertiaryOption.labelKey,
                    })}
                  </MenuItem>
                </SplitButton>,
                <Button
                  priority="secondary"
                  disabled={
                    consolidatedPageLoading ||
                    isApproved ||
                    isLocked ||
                    isSubmitted
                  }
                  onClick={handleSaveButtonClick}
                  isLoading={consolidatedButtonLoadingState}
                  loadingComponent={<Activity shape="dots" size="small" />}
                >
                  {intl.formatMessage({ id: 'save' })}
                </Button>,
              ]
        }
      >
        {!timeTrackingAuthError && !getTimeEntryError ? (
          <TrowserContent>
            <WayBackWhatsNewContainer
              trowserId={TROWSER_ID}
              trackingPoints={trackingPoints}
              isTimeEntry={isSingleTimeEntry}
              isFormEdited={isFormDirty(singleTimeEntryFormMethods.formState)}
              onTourReset={
                isFreeDataWithUnificationEnabled
                  ? () => setSingleTimeActivityIntroModalOpen(true)
                  : undefined
              }
              actionLabelId="learn.more.action.label"
            />
            {!consolidatedPageLoading && !singleTimeEntryLoading && (
              <LockedTimeEntryMessage
                open={isApproved || isLocked || isSubmitted}
                isSubmitted={isSubmitted && !isApproved}
                noManagePermission={
                  canManageTimesheets === false && !isApproved && !isSubmitted
                }
              />
            )}
            {recentTimeActivitiesModalOpen && (
              <RecentTimeActivitiesModal
                open={recentTimeActivitiesModalOpen}
                onClose={handleHistoryIconClick}
                isTimeActivity={!isSingleTimeEntry}
                timeTrackingOnlyId={timeTrackingOnlyId}
                onSelect={handleRecentTimeSelect}
                isTimeEntryPrimaryDataSourceEnabled={
                  isTimeEntryPrimaryDataSourceEnabled
                }
              />
            )}
            {settingsError !== '' && !consolidatedPageLoading && (
              <PageMessage
                open
                type="warn"
                dismissible={false}
                title={intl.formatMessage({
                  id: 'settings.load.warning.message',
                })}
                automationId="SingleTimeHOCSettingsWarningPageMessage"
              />
            )}
            {errorMessage && (
              <PageMessage
                open
                type="error"
                dismissible={false}
                title={errorMessage}
                automationId="SingleTimeHOCErrorPageMessage"
              />
            )}
            {pendingSaveMessage && !consolidatedPageLoading && (
              <StyledPendingSaveMessage
                open
                type={pendingSaveMessage.type}
                dismissible
                title={intl.formatMessage({
                  id: pendingSaveMessage.titleKey,
                })}
                onClose={() => setPendingSaveMessage(null)}
                automationId="SingleTimeHOCPendingSavePageMessage"
              >
                {intl.formatMessage({
                  id: pendingSaveMessage.messageKey,
                })}
              </StyledPendingSaveMessage>
            )}
            {/* show loading indicator when either consolidated page loading or single time entry loading
            This is to because consolidate page loading is able to be set only once when all dependencies are false */}
            {(consolidatedPageLoading || singleTimeEntryLoading) && (
              <ActivityContainer>
                <Activity shape="dots" size="large" />
              </ActivityContainer>
            )}

            <FormProvider {...singleTimeEntryFormMethods}>
              {/* FormContainer controls the visibility of the entire form based on loading state
              We use display: none/block instead of conditional rendering to ensure form components
              are always mounted in the DOM, allowing their onReady callbacks to fire and update loading states */}
              <FormContainer
                isHidden={consolidatedPageLoading || singleTimeEntryLoading}
              >
                <SubmitTimeDatesProvider>
                  <SingleTimeForm
                    userFirstName={userFirstName}
                    settings={settingsData}
                    preferences={timeTrackingPreferences}
                    hasPayroll={hasPayroll}
                    hasProjects={hasProjects}
                    updateLabel={updateLabel}
                    hasAdminAccess={hasAdminAccess}
                    timeForType={watchedFormState.timeFor.type}
                    timeTrackingOnlyId={timeTrackingOnlyId}
                    billableStatus={mappedSingleTimeFormState?.billableStatus}
                    serviceItemPriceRef={serviceItemPriceRef}
                    serviceDescriptionRef={serviceDescriptionRef}
                    isBillRateEnable={isBillRateEnable}
                    labelPreference={labelPreference}
                    serviceTaxableRef={serviceTaxableRef}
                    isOTX={isOTX}
                    timeOffMethod={
                      employee?.timeOffPolicies?.at(0)?.employerTimeOffPolicy
                        .timeOffMethod || null
                    }
                    dispatchLoading={dispatch}
                    isMileageEnabled={isMileageEnabled}
                    timeForContactDAS={timeForContactDAS}
                    timeAgainstContactDAS={timeAgainstContactDAS}
                    classDAS={classDAS}
                    departmentDAS={departmentDAS}
                    isBillableFieldAssignedRef={isBillableFieldAssignedRef}
                    shouldShowTeamMemberField={shouldShowTeamMemberField}
                  />
                </SubmitTimeDatesProvider>
              </FormContainer>
            </FormProvider>
          </TrowserContent>
        ) : (
          <StyledAuthErrorMessage />
        )}

        {/* Render TimeSettingsPopoverHOC only when open, otherwise don't render anything */}
        {isSettingsPopoverOpen ? (
          <TimeSettingsPopoverHOC
            open={isSettingsPopoverOpen}
            setOpen={setIsSettingsPopoverOpen}
            targetElement={trowserSettingsGear}
            isSettingsAccessible={isSettingsAccessible}
            onSaveSuccess={handleSettingsSaveSuccess}
            fieldsWithData={fieldsWithData}
            trackingPoints={trackingPoints}
            isTimeEntry={isSingleTimeEntry}
          />
        ) : (
          <> </>
        )}
      </StyledTrowser>

      {/* show TSheets modal when needed but only for time activities */}
      <TSheetsModal showModal={!isSingleTimeEntry} />

      {shouldShowSingleTimeActivityTour && !consolidatedPageLoading && (
        <SingleTimeActivityTourAdapter
          open={singleTimeActivityIntroModalOpen}
          onClose={handleSingleTimeActivityTourClose}
          onFinish={handleSingleTimeActivityTourFinish}
        />
      )}
      <ConfirmationModal
        title={intl.formatMessage({
          id: 'unsaved.changes.content',
        })}
        open={unsavedChangesModalOpen}
        setOpen={setUnsavedChangesModalOpen}
        onYesClick={handleClose}
      />
      <ConfirmationModal
        open={notesOverwriteModelOpen}
        setOpen={setNotesOverwriteModelOpen}
        onYesClick={handleOverwriteNotesChanges}
      >
        <StyledDescriptionConfirmationMessage>
          {intl.formatMessage({
            id: 'notes.description.changes.content',
          })}
        </StyledDescriptionConfirmationMessage>
      </ConfirmationModal>
      <ConfirmationModal
        title={intl.formatMessage({
          id: 'confirm.delete.content',
        })}
        open={deleteConfirmationModalOpen}
        setOpen={setDeleteConfirmationModalOpen}
        onYesClick={handleDeleteConfirm}
      />
      <FormProvider {...singleTimeEntryFormMethods}>
        <ClosedBooksConfirmationModal
          open={closeBooksModalOpen}
          setOpen={setCloseBooksModalOpen}
          onYesClick={handleCloseBooksSaveConfirm}
          isCloseBookPasswordEnabled={settingsData?.isCloseBookPasswordEnabled}
          // only time activity screen has closed book password options
          trackingPoint={trackingPoints.CLOSED_BOOK_PASSWORD}
        />
      </FormProvider>
      {toastState.show && (
        <SuccessToast
          message={getToastMessage(toastState.type)}
          open={toastState.show}
          onClose={hideToast}
        />
      )}
      {/* QBO users: UserVoice popover */}
      {!isWFSUser && showFeedbackPopover && (
        <FeedbackPopover
          open={showFeedbackPopover}
          onClose={handleFeedbackClose}
          targetElement={trowserFeedbackButton}
          widgetIdentifier={
            isSingleTimeEntry ? SINGLE_TIME_ENTRY_WIDGET_ID : null
          }
          isOvertimeEnabled={isOvertimeEnabled}
        />
      )}
      {/* WFS users: Qualtrics survey */}
      {isWFSUser && (
        <QualtricsSurveyWidget
          sandbox={sandbox}
          featureTag="wfs-wfweb-sta"
          activeEmployer={qualtricsActiveEmployer}
          registerLoadSurvey={(loadSurvey) => {
            loadQualtricsRef.current = loadSurvey;
          }}
        />
      )}
      {isUserVoiceEnabled && (
        <UserVoiceFeedBackWidget
          renderFeedbackTrigger={renderFeedbackTrigger}
          widgetIdentifier={
            isSingleTimeEntry ? SINGLE_TIME_ENTRY_WIDGET_ID : null
          }
        />
      )}
      {isRestrictedChange ? (
        <ConfirmationModal
          open={invoicedModalOpen}
          setOpen={setInvoicedModalOpen}
          yesButtonLabel={intl.formatMessage({ id: 'invoiced.time.popup.ok' })}
          onYesClick={handleModalConfirm}
          showNoButton={false}
        >
          <StyledInvoicedDescriptionConfirmationMessage>
            {intl.formatMessage({
              id: getRestrictedContentKey(restrictedFieldType),
            })}
          </StyledInvoicedDescriptionConfirmationMessage>
        </ConfirmationModal>
      ) : (
        <ConfirmationModal
          open={invoicedModalOpen}
          setOpen={setInvoicedModalOpen}
          title={intl.formatMessage({
            id: 'invoiced.time.confirmation.modal.title',
          })}
          yesButtonLabel={intl.formatMessage({
            id: 'invoiced.time.confirmation.modal.yes.button.label',
          })}
          noButtonLabel={intl.formatMessage({
            id: 'invoiced.time.confirmation.modal.no.button.label',
          })}
          onYesClick={handleModalConfirm}
          onNoClick={handleModalCancel}
        >
          <StyledInvoicedDescriptionConfirmationMessage>
            {intl.formatMessage({
              id: 'invoiced.time.confirmation.modal.content',
            })}
          </StyledInvoicedDescriptionConfirmationMessage>
        </ConfirmationModal>
      )}
    </>
  );
};

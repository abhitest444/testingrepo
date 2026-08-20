/* eslint-disable no-nested-ternary */
/* eslint-disable no-param-reassign */
import React, {
  MouseEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  FormProvider,
  SubmitHandler,
  useWatch,
  DefaultValues,
  FieldErrors,
} from 'react-hook-form';
import styled from 'styled-components';

import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import PageMessage from '@ids-ts/page-message';
import Button from '@ids-ts/button';
import Trowser from '@ids-ts/trowser';
import SplitButton, { MenuItem } from '@ids-ts/split-button';
import { Activity } from '@ids-ts/loader';
import { TimeOffMethod } from 'src/__generated__/gas/graphql';
import { mapTimeEntriesToWeeklyTimeForm } from 'src/js/widgets/weeklyTimeTrowser/hooks/mapTimeEntriesToWeeklyTimeForm';
import { useLazySearchTimeEntries } from 'src/js/service/hooks/timeEntries/useLazySearchTimeEntries';
import {
  getLastWeekTimeEntriesInput,
  getSearchTimeEntriesInput,
} from 'src/js/service/hooks/timeEntries/useSearchTimeEntries';
import { WeeklyTimeTableHeader } from 'src/js/widgets/weeklyTimeTrowser/components/WeeklyTimeTableHeader';
import { WeeklyTimeTable } from 'src/js/widgets/weeklyTimeTrowser/components/WeeklyTimeTable';
import { TSheetsModal } from 'src/js/widgets/common/TSheetsModal';
import { useCompanySettings } from 'src/js/service/hooks/settings/useCompanySettings';
import {
  useInvoicedValidation,
  getRestrictedContentKey,
  RestrictedFieldType,
} from 'src/js/hooks/useInvoicedValidation';
import {
  addAdditionalWeeklyRows,
  getWeeklyTimeFormDefaultValues,
  useWeeklyTimeForm,
  WeeklyTimeFormState,
} from 'src/js/widgets/weeklyTimeTrowser/hooks/useWeeklyTimeForm';
import { WeeklyTimeTableAuxiliary } from 'src/js/widgets/weeklyTimeTrowser/components/WeeklyTimeTableAuxiliary';
import {
  TIME_ENTRY_SPLIT_CTA_OPTIONS,
  useUxPreferences,
  UxPreferenceKey,
} from 'src/js/service/utils/useUXPreferences';
import { ConfirmationModal } from 'src/js/widgets/common/ConfirmationModal';
import { useHasProjects } from 'src/js/service/utils/projectsUtils';
import {
  areWeeklyTimeFormStatesEqual,
  isAWeeklyTimeFormDirty,
} from 'src/js/widgets/weeklyTimeTrowser/hooks/compareWeeklyTimeForm';
import {
  TimeTracking_BatchManageTimeEntriesPayload,
  TimeTracking_BillableStatus,
  TimeTracking_TimeEntry,
} from 'src/__generated__/timeTracking/graphql';
import { WeeklyCopyLastWeekModal } from 'src/js/widgets/common/WeeklyCopyLastWeekModal';
import { useIsMobileDevice } from 'src/js/common/screenSizeUtils';
import { MobileBlock } from 'src/js/widgets/common/MobileBlock';
import { mapWeeklyTimeForm } from 'src/js/widgets/weeklyTimeTrowser/hooks/mapWeeklyTimeForm';
import FeedbackPopover from 'src/js/widgets/common/feedbackPopover/FeedbackPopover';
import { useOvertimeFeatureFlag } from 'src/js/service/hooks/settings/useGetTSheetsOvertimeEnabled';
import { ClosedBooksConfirmationModal } from 'src/js/widgets/common/ClosedBooksConfirmationModal';

import { useConsolidatedLoading } from 'src/js/common/useConsolidatedLoading';
import { printWeeklyTimeTable } from 'src/js/widgets/weeklyTimeTrowser/utils/printWeeklyTimeTable';
import {
  fetchSettingsAccess,
  getlookupIntervalForCopyLastTimesheet,
  useCurrencySymbol,
  useHasAdminAccess,
  isWorkforceEnvironment,
} from 'src/js/service/utils/sandboxUtils';
import {
  computeTimeTrackingOnlyUser,
  useTimeTrackingBatchAuthorization,
} from 'src/js/service/utils/useTimeTrackingAuthorization';
import {
  computeHasPayroll,
  computeHasTSheets,
  useGetEntitlements,
} from 'src/js/service/hooks/entitlements/useGetEntitlements';
import { useBatchSaveTimeEntries } from 'src/js/service/hooks/timeEntries/useBatchSaveTimeEntries';
import {
  extractGraphQLError,
  hasAnyGraphQLError,
} from 'src/js/service/utils/apolloErrorUtils';
import {
  buildTimeSummaryTimeActivityHeaders,
  logTimeSummaryTimeActivityApiConsumption,
  TIME_SUMMARY_API_NAMES,
} from 'src/js/service/utils/timeSummaryHeaderUtils';

import 'src/assets/styles.css';
import { WEEKLY_TIME_TRACKING_POINTS } from 'src/js/common/useClickTracking';

import { SuccessToast } from 'src/js/widgets/common/SuccessToast';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import {
  createCustomerInteraction,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import { TimeForType } from 'src/js/widgets/common/addTimeFormComponents/TeamMember';
import { useLazyGetEmployeeData } from 'src/js/service/hooks/employee/useLazyGetEmployeeData';
import {
  setJobCostingDetails,
  WeeklyTimeRowState,
} from 'src/js/widgets/weeklyTimeTrowser/hooks/useWeeklyTimeFormRows';
import { useLazyGetVendorData } from 'src/js/service/hooks/vendor/useLazyGetVendorData';
import { WEEKLY_TIME_ENTRY_BATCH_AUTHORIZATION_REQUESTS } from 'src/js/widgets/weeklyTimeTrowser/constants';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import useBatchAuthorization from 'src/js/providers/useBatchAuthorization';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';
import { useFeatureFlag } from 'src/js/common/hooks/useFeatureFlag';
import MaintenancePage from 'src/js/common/components/MaintenancePage/MaintenancePage';
import {
  FEATURE_FLAGS,
  setAfterTaskModalPending,
  TIME_SUMMARY_API_OPERATION,
  TIME_SUMMARY_API_STATUS,
  WEEKLY_TIME_TROWSER_EVENTS,
} from 'src/js/common/constants';
import {
  PendingSaveBannerAction,
  PendingSaveBannerMessage,
} from 'src/js/common/timeEntryLockUtils';
import {
  mapWeeklyPayloadToLockContext,
  usePendingSaveLockContext,
} from 'src/js/common/hooks/usePendingSaveLockContext';
import { UNIFICATION_EXPERIMENT_NAMESPACE } from 'src/js/common/ixpExperimentConfigs';
import { useIxpExperiment } from 'src/js/service/hooks/ixp/useIxpExperiment';
import { useGetTSheetsAccountInfo } from 'src/js/service/hooks/settings/useGetTSheetsAccountInfo';
import WayBackWhatsNewContainer from 'src/js/widgets/common/WayBackWhatsNewContainer';
import { ImportTimeWithAICTA } from 'src/js/widgets/weeklyTimeEntry/components/ImportTimeWithAI';
import { getMostRecentWeekTimeEntries } from 'src/js/widgets/weeklyTimeTrowser/utils/getMostRecentWeekTimeEntries';
import { exportWeeklyTimesheetExcel } from 'src/js/widgets/weeklyTimeTrowser/utils/ExportWeekelyTimeTable';
import { AuthErrorMessage } from 'src/js/widgets/common/AuthErrorMessage';
import useGetPreferences from 'src/js/service/hooks/preferenceces/useGetPreferences';
import { getShowBillRateToAll } from 'src/js/common/MiscUtils';
import { NeoApiClient } from 'src/js/service/rest/NeoApiClient';
import UserVoiceFeedBackWidget from 'src/js/widgets/common/feedbackPopover/UserVoiceFeedBackWidget';
import WeeklyTimesheetPageTourAdapter from './WeeklyTimesheetPageTourAdapter';

const StyledTrowser = styled(Trowser)`
  z-index: 10000 !important;

  * [class^='Trowser-sectionContent'] {
    padding: 0 0 20px 20px;
  }
`;

const TrowserContent = styled.section`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 12px 20px 0 0;
  height: calc(
    100vh - 145px
  ); /* This makes sure the trowser content takes the full viewport height except for header, footer and padding */
`;

const ActivityContainer = styled.div`
  display: flex;
  justify-content: center;
`;

const StyledDescriptionConfirmationMessage = styled.div`
  font-size: var(--font-size-heading-5);
  font-weight: var(--font-weight-heading);
  line-height: var(--line-height-heading);
  font-style: normal;
  margin: 0;
  padding: 0;
`;

const StyledPageMessage = styled(PageMessage)`
  &&& {
    margin-bottom: 1em;
  }
`;

const StyledAuthErrorMessage = styled(AuthErrorMessage)`
  height: calc(
    100vh - 145px
  ); /* This makes sure the error message content takes the full viewport height except for header, footer and padding */
  padding: 20px 20px 0px 0px;
`;

const StyledInvoicedDescriptionConfirmationMessage = styled.div`
  font-size: 18px;
  line-height: var(--line-height-component);
  font-style: normal;
  margin: 0;
  padding: 0;
`;

interface WeeklyTimeHOCProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  isWeeklyTimeEntry?: boolean;
}

const TROWSER_ID = 'weekly-time-trowser';

export const WeeklyTimeHOC = ({
  open,
  setOpen,
  isWeeklyTimeEntry,
}: WeeklyTimeHOCProps) => {
  // -------------------------------- context hooks
  const intl = useIntl();
  const sandbox = useSandbox();
  const loggingConfigLogger = useLoggingConfig();
  const { isInTreatment: isIxpUnificationInTreatment } = useIxpExperiment(
    sandbox,
    {
      experimentNamespace: UNIFICATION_EXPERIMENT_NAMESPACE,
      namespace: 'timecapture-timeentries-ui',
      businessUnit: 'SBSEG',
    },
  );
  const track = useTracking();
  const isMobile = useIsMobileDevice();
  const currencySymbol = useCurrencySymbol();
  const isFormEdited = useRef<boolean[]>([]);

  // show settings icon conditionally based on user access
  const [isSettingsAccessible, setSettingsAccess] = useState<boolean>(false);

  const [isTeamMemberLoaded, setIsTeamMemberLoaded] = useState<boolean>(false);

  const trowserFeedbackButton = document.querySelector(
    `[data-automation-id="${TROWSER_ID}_feedback"]`,
  ) as HTMLElement;

  const ignoreCloseBooksCheck = useRef(false);

  // make batch authz calls for known resources
  const { loading: batchAuthzLoading } = useBatchAuthorization(
    WEEKLY_TIME_ENTRY_BATCH_AUTHORIZATION_REQUESTS,
  );

  const {
    settingsData: timeTrackingSettings,
    refetch: refetchTimeTrackingSettings,
    loading: timeTrackingSettingsLoading,
    error: timeTrackingSettingsError,
  } = useCompanySettings({ isExported: true });

  const {
    data: { isFreedata },
  } = useGetTSheetsAccountInfo();

  const isFreeDataWithUnificationEnabled =
    isFreedata && isIxpUnificationInTreatment;

  // Tour state
  const [tourOpen, setTourOpen] = useState(false);
  const tourShownRef = useRef(false);

  // -------------------------------- component state hooks
  const weeklyTimeSheetFormMethods = useWeeklyTimeForm();

  // watch state that sets context for whole form
  const [timeForId, timeForType] = useWatch({
    control: weeklyTimeSheetFormMethods.control,
    name: ['timeFor.id', 'timeFor.type'],
  });
  const [weekStartDate, weekEndDate] = useWatch({
    control: weeklyTimeSheetFormMethods.control,
    name: ['week.startDate', 'week.endDate'],
  });
  const timeEntriesFromForm = useWatch({
    control: weeklyTimeSheetFormMethods.control,
    name: 'weeklyTimeRows',
  });

  // is notes overwrite modal open
  const [notesOverwriteModelOpen, setNotesOverwriteModelOpen] =
    useState<boolean>(false);
  // set current row index
  const [rowIndex, setRowIndex] = useState<number>(0);
  const [unsavedChangesModalOpen, setUnsavedChangesModalOpen] =
    useState<boolean>(false);
  const [copyLastWeekModalOpen, setCopyLastWeekModalOpen] =
    useState<boolean>(false);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);
  const [isSettingsPopoverOpen, setIsSettingsPopoverOpen] =
    useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showFeedbackPopover, setShowFeedbackPopover] =
    useState<boolean>(false);
  const [showFeedbackSuccessToast, setShowFeedbackSuccessToast] =
    useState<boolean>(false);
  const [pendingSaveMessage, setPendingSaveMessage] =
    useState<PendingSaveBannerMessage | null>(null);

  // Perf: initializing billRate to `null` instead of `undefined`
  // to avoid unnecessary re-renders when billing rate not set
  const [billRate, setBillRate] = useState<number | null>(null);
  const [costRate, setCostRate] = useState<number | null>(null);
  const [isEmployeeOrVendorBillable, setIsEmployeeOrVendorBillable] =
    useState<boolean>(false);
  const [timeOffMethod, setTimeOffMethod] = useState<TimeOffMethod | null>(
    null,
  );

  const [triggerFeedback, setTriggerFeedback] = useState<() => void>(
    () => () => {},
  );

  const { isEnabled: showUserVoiceFeedbackWidget } = useIXPFeatureFlag({
    flagName: FEATURE_FLAGS.QB_TIME_TRACKING_USERVOICE_FEEDBACK,
    defaultValue: false,
  });

  const { isEnabled: isLegacyQboUserEnabled } = useIXPFeatureFlag({
    flagName: FEATURE_FLAGS.QB_TIME_TRACKING_UI_ENABLE_LEGACY_QBO_USER,
    defaultValue: false,
  });

  const { isEnabled: isOvertimeEnabled } = useOvertimeFeatureFlag();

  const isFullPageMaintenanceEnabled = useFeatureFlag(
    FEATURE_FLAGS.SBSEG_QBO_QBTIME_MAINTENANCE_FULL_PAGE,
    false,
  );

  // is close books modal open
  const [closeBooksModalOpen, setCloseBooksModalOpen] =
    useState<boolean>(false);

  // to avoid pre-loading of data based on UX preference after clicking Save & New
  const isRenderingAfterSaveAndNew = useRef<boolean>(false);

  const onMutationSuccessCallback = useRef<
    (data: TimeTracking_BatchManageTimeEntriesPayload) => void
  >((data) => {});

  // Weekly behavior: cache a single truthy lock context when any saved row is
  // locked due to time charge generation in progress, then use it to resolve
  // sequence-mismatch errors without requiring entry-id matching.
  const {
    clearCachedLockContext,
    updateCachedLockContextFromPayload,
    resolvePendingMessageForError,
  } = usePendingSaveLockContext({
    isCachingEnabled: !isWeeklyTimeEntry,
    mapPayloadToLockContext: mapWeeklyPayloadToLockContext,
  });

  // -------------------------------- network hooks

  const {
    data: timeTrackingPreferences,
    getPreference,
    setPreference,
    setPreferences,
    loadPreferences,
    loading: timeTrackingPreferencesLoading,
  } = useUxPreferences();

  // Weekly timesheet page tour completion state
  const weeklyTimesheetPageTourCompleted =
    timeTrackingPreferences[
      UxPreferenceKey.WEEKLY_TIMESHEET_PAGE_TOUR_COMPLETED
    ];

  const currentCTAPreferences =
    timeTrackingPreferences[UxPreferenceKey.TIME_ENTRY_SELECTED_SPLIT_CTA];
  const [splitCTAPrimaryOption, splitCTASecondaryOption] =
    currentCTAPreferences === TIME_ENTRY_SPLIT_CTA_OPTIONS.SAVE_AND_NEW.key
      ? [
          TIME_ENTRY_SPLIT_CTA_OPTIONS.SAVE_AND_NEW,
          TIME_ENTRY_SPLIT_CTA_OPTIONS.SAVE_AND_CLOSE,
        ]
      : [
          TIME_ENTRY_SPLIT_CTA_OPTIONS.SAVE_AND_CLOSE,
          TIME_ENTRY_SPLIT_CTA_OPTIONS.SAVE_AND_NEW,
        ];

  const [initialTimeEntriesLoading, setInitialTimeEntriesLoading] =
    useState<boolean>(true);
  const {
    isEnabled: isTimeEntryPrimaryDataSourceEnabled,
    settled: isTimeEntryPrimaryDataSourceSettled,
  } = useIXPFeatureFlag({
    flagName: FEATURE_FLAGS.QB_TIME_TRACKING_UI_TIME_ENTRY_PRIMARY_DATA_SOURCE,
  });

  const {
    query: searchTimeEntries,
    loading: searchTimeEntriesLoading,
    data: searchTimeEntriesData,
    resetData: resetTimeEntriesData,
  } = useLazySearchTimeEntries();

  const {
    query: copyLastWeekTimeEntries,
    loading: copyLastWeekTimeEntriesLoading,
    data: copyLastWeekTimeEntriesData,
    resetData: resetLastWeekTimeEntriesData,
  } = useLazySearchTimeEntries();

  const { data: entitlements, loading: entitlementsLoading } =
    useGetEntitlements();

  const [hasPayroll, setHasPayroll] = useState<boolean>(false);

  useEffect(() => {
    if (entitlements && !entitlementsLoading) {
      setHasPayroll(computeHasPayroll(entitlements));
    }
  }, [entitlements, entitlementsLoading]);

  const hasAdminAccess = useHasAdminAccess();

  const hasProjects = useHasProjects();

  // get authorizations
  const {
    data: timeTrackingAuth,
    loading: timeTrackingAuthLoading,
    error: timeTrackingAuthError,
  } = useTimeTrackingBatchAuthorization();
  const timeTrackingOnlyId = computeTimeTrackingOnlyUser(timeTrackingAuth);

  // isBillRateEnable: mirrors the logic in WeeklyTimeTable for bill rate / billable amount visibility
  const [canAccessSalesInfo, setCanAccessSalesInfo] = useState(false);
  const { data: preferencesData, error: preferencesError } =
    useGetPreferences();
  const showBillRateToAll = preferencesError
    ? false
    : getShowBillRateToAll(preferencesData);
  const isBillRateEnable = isWorkforceEnvironment(sandbox)
    ? timeTrackingSettings.billingRateForTimeEnabled ?? false
    : canAccessSalesInfo || showBillRateToAll;

  useEffect(() => {
    if (!isWorkforceEnvironment(sandbox)) {
      NeoApiClient('security/settings?fields=canAccessSalesInfo', sandbox).then(
        (response) => {
          setCanAccessSalesInfo(response.canAccessSalesInfo);
        },
      );
    }
  }, [sandbox]);

  // get employee data
  const {
    query: getEmployee,
    data: employee,
    resetData: resetEmployee,
  } = useLazyGetEmployeeData(hasPayroll, timeTrackingOnlyId);

  const {
    getVendorCallback: getVendorData,
    data: vendorData,
    resetData: resetVendorData,
  } = useLazyGetVendorData();
  const vendor = vendorData?.Vendor;

  // -------------------------------- component render hooks

  // load ux preferences when trowser opens
  useEffect(() => {
    if (open) {
      sandbox.logger.info('Component=WeeklyTimeHOC Event=Mounted');
      track(WEEKLY_TIME_TRACKING_POINTS.ON_MOUNT);

      refetchTimeTrackingSettings();

      loadPreferences([
        UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE,
        UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS,
        UxPreferenceKey.TIME_ENTRY_TIME_FOR,
        UxPreferenceKey.TIME_ENTRY_SELECTED_SPLIT_CTA,
        UxPreferenceKey.WEEKLY_TIMESHEET_PAGE_TOUR_COMPLETED,
      ]);
    } else {
      tourShownRef.current = false; // Reset tour shown flag when trowser closes
    }
  }, [open]);

  // fetch company settings on load
  useEffect(() => {
    // @ts-ignore
    fetchSettingsAccess(sandbox).then((result) => {
      setSettingsAccess(result);
    });
  }, []);

  useEffect(() => {
    if (timeTrackingPreferencesLoading || timeTrackingSettingsLoading) {
      return;
    }

    // TODO: remove this once the FF is 100% live
    // For now, we show the loading state until the FF is settled so that we are aware we need to pass the header or not for searchTimeEntries call
    if (
      isTimeEntryPrimaryDataSourceSettled &&
      (!timeForId || searchTimeEntriesData)
    ) {
      setInitialTimeEntriesLoading(false);
    }
  }, [
    timeTrackingSettingsLoading,
    timeTrackingPreferencesLoading,
    searchTimeEntriesData,
    isTimeEntryPrimaryDataSourceSettled,
  ]);

  const weeklySearchEntitlementsIncludeTSheets =
    computeHasTSheets(entitlements);

  // fetch time entries when timeFor or week changes (wait for FF to settle before calling)
  useEffect(() => {
    isFormEdited.current = isFormEdited.current.map(() => false);
    setErrorMessage(null);
    setPendingSaveMessage(null);
    ignoreCloseBooksCheck.current = false;
    if (timeForId && isTimeEntryPrimaryDataSourceSettled) {
      if (isTimeEntryPrimaryDataSourceEnabled && entitlementsLoading) {
        return;
      }
      const input = getSearchTimeEntriesInput(
        {
          startDate: weekStartDate,
          endDate: weekEndDate,
        },
        timeForId,
      );
      createCustomerInteraction(
        sandbox,
        TimeCustomerInteraction.WEEKLY_TIME_READ,
      );
      const weeklySearchTAHeaders = buildTimeSummaryTimeActivityHeaders({
        isTimeEntryPrimaryDataSourceEnabled,
        isTimeActivityRequest: true,
        entitlementGrants: entitlements,
        entitlementsReady: !entitlementsLoading,
      });
      searchTimeEntries({
        variables: { input },
        context: {
          headers: {
            ...getCustomerInteractionPropagationHeaders(
              sandbox,
              TimeCustomerInteraction.WEEKLY_TIME_READ,
            ),
            ...weeklySearchTAHeaders,
          },
        },
      })
        // response handling flow
        .then((response) => {
          if (hasAnyGraphQLError(response)) {
            const gqlErr = extractGraphQLError(response)!;
            logTimeSummaryTimeActivityApiConsumption(
              loggingConfigLogger,
              weeklySearchTAHeaders,
              {
                api: TIME_SUMMARY_API_NAMES.TIME_ACTIVITY_SEARCH,
                operation: TIME_SUMMARY_API_OPERATION.READ,
                status: TIME_SUMMARY_API_STATUS.FAILED,
                errorMessage: gqlErr.message,
              },
            );
          } else if (response.data) {
            logTimeSummaryTimeActivityApiConsumption(
              loggingConfigLogger,
              weeklySearchTAHeaders,
              {
                api: TIME_SUMMARY_API_NAMES.TIME_ACTIVITY_SEARCH,
                operation: TIME_SUMMARY_API_OPERATION.READ,
                status: TIME_SUMMARY_API_STATUS.SUCCESS,
              },
            );
          }
        })
        .catch((err) => {
          logTimeSummaryTimeActivityApiConsumption(
            loggingConfigLogger,
            weeklySearchTAHeaders,
            {
              api: TIME_SUMMARY_API_NAMES.TIME_ACTIVITY_SEARCH,
              operation: TIME_SUMMARY_API_OPERATION.READ,
              status: TIME_SUMMARY_API_STATUS.FAILED,
              errorMessage:
                err instanceof Error ? err.message : String(err ?? ''),
            },
          );
        });
    }
    // entitlements omitted from deps: array identity churns with cache-and-network; weeklySearchEntitlementsIncludeTSheets captures header-relevant changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    timeForId,
    weekStartDate,
    weekEndDate,
    loggingConfigLogger,
    sandbox,
    searchTimeEntries,
    isTimeEntryPrimaryDataSourceSettled,
    isTimeEntryPrimaryDataSourceEnabled,
    entitlementsLoading,
    weeklySearchEntitlementsIncludeTSheets,
  ]);

  // fetch employee/vendor payroll information when timeFor changes
  useEffect(() => {
    if (timeForType === TimeForType.EMPLOYEE && timeForId) {
      getEmployee({
        variables: {
          employeeId: timeForId,
          shouldFetchTimeOffPolicies: hasPayroll,
        },
      });
    } else if (timeForType === TimeForType.VENDOR && timeForId) {
      getVendorData(timeForId);
    }
  }, [getEmployee, getVendorData, timeForId, timeForType]);

  // set billRate and costRate when vendor or employee data is updated
  useEffect(() => {
    // @ts-ignore
    if (timeForType === TimeForType.EMPLOYEE) {
      timeTrackingSettings.isBillingFieldEnabled &&
        setBillRate(
          window.isNaN(employee?.employmentDetail?.jobCosting?.billRate)
            ? null
            : Number(employee?.employmentDetail?.jobCosting?.billRate),
        );
      setIsEmployeeOrVendorBillable(
        employee?.employmentDetail?.jobCosting?.billable || false,
      );
      setCostRate(
        window.isNaN(employee?.employmentDetail?.jobCosting?.costRate)
          ? null
          : Number(employee?.employmentDetail?.jobCosting?.costRate),
      );
      setTimeOffMethod(
        employee?.timeOffPolicies?.at(0)?.employerTimeOffPolicy.timeOffMethod ||
          null,
      );
    } else if (vendor?.Id === timeForId) {
      timeTrackingSettings.isBillingFieldEnabled &&
        setBillRate(
          window.isNaN(vendor?.BillRate) ? null : Number(vendor.BillRate),
        );
      setIsEmployeeOrVendorBillable(!window.isNaN(vendor?.BillRate) || false);
      setCostRate(
        window.isNaN(vendor?.CostRate) ? null : Number(vendor.CostRate),
      );
    }
  }, [
    vendor,
    employee,
    searchTimeEntriesLoading,
    searchTimeEntriesData,
    timeForId,
    timeForType,
    timeTrackingSettings.isBillingFieldEnabled,
  ]);

  //  when search time activities data loads add additional empty rows
  useEffect(() => {
    if (!searchTimeEntriesData) return;

    const { timeFor, week } = weeklyTimeSheetFormMethods.getValues();
    const mappedWeeklyTimeFormState = mapTimeEntriesToWeeklyTimeForm(
      timeFor,
      week,
      searchTimeEntriesData,
    );

    if (mappedWeeklyTimeFormState.weeklyTimeRows.length > 0) {
      const allRowsWithAdditional = addAdditionalWeeklyRows(
        mappedWeeklyTimeFormState.weeklyTimeRows,
        week.startDate,
      );

      /**
       * Cases
       * 1.If new row is added, then set billRate to default value of employee
       * 2.If the row is an existing row (id > 0) and the billableStatus is 'NotBillable', set billRate to 0.
       * 3.Otherwise, if the current billRate is greater than 0, keep the current billRate.
       */
      allRowsWithAdditional.forEach((row) => {
        row.billRate = row.id > 0 ? row.billRate : billRate;
        row.billable =
          row.id > 0
            ? row.billable
            : isEmployeeOrVendorBillable ||
              !window.isNaN(billRate === null ? NaN : billRate);
        row.costRate = row.id > 0 ? row.costRate : costRate;
      });

      weeklyTimeSheetFormMethods.reset({
        ...mappedWeeklyTimeFormState,
        weeklyTimeRows: allRowsWithAdditional,
      });
    } else {
      // Reset to default values only if the form state is not already at default
      const defaultValues = getWeeklyTimeFormDefaultValues(
        timeTrackingSettings.firstDayOfWeek,
        {
          week,
          timeFor,
        },
      );
      defaultValues.weeklyTimeRows.forEach((row) => {
        row.billRate = billRate;
        row.billable = isEmployeeOrVendorBillable || (billRate ?? 0) > 0;
        row.costRate = costRate;
      });
      if (
        !areWeeklyTimeFormStatesEqual(
          defaultValues,
          weeklyTimeSheetFormMethods.getValues(),
        )
      ) {
        weeklyTimeSheetFormMethods.reset(defaultValues);
      }
    }
  }, [searchTimeEntriesData, billRate, costRate, isEmployeeOrVendorBillable]);

  const resetBillableStatus = useCallback(
    (mostRecentWeekEntries: TimeTracking_TimeEntry[]) => {
      // Reset the billableStatus when user copy last timesheet.
      mostRecentWeekEntries.map((row) => {
        row.billableStatus =
          row.billableStatus === TimeTracking_BillableStatus.HasBeenBilled
            ? TimeTracking_BillableStatus.Billable
            : row.billableStatus;
        return row;
      });
    },
    [],
  );

  // run when copy last week time entry data changes
  useEffect(() => {
    if (!copyLastWeekTimeEntriesData) return;

    if (copyLastWeekTimeEntriesData.length === 0) {
      setErrorMessage(
        intl.formatMessage({
          id: 'copy.last.week.no.result.error',
        }),
      );
      resetLastWeekTimeEntriesData();
      return;
    }

    // if form in default empty state -> populate the form
    const { timeFor, week } = weeklyTimeSheetFormMethods.getValues();
    const mostRecentWeekEntries = getMostRecentWeekTimeEntries(
      copyLastWeekTimeEntriesData,
      week,
    );
    mostRecentWeekEntries.sort(
      (a, b) => parseInt(a.id, 10) - parseInt(b.id, 10),
    );

    // Compare against default values (including pre-defined job costing details of selected team member) to show copy last week modal conditionally
    const defaultValues = getWeeklyTimeFormDefaultValues(
      timeTrackingSettings.firstDayOfWeek,
      {
        week,
        timeFor,
      },
    );
    defaultValues.weeklyTimeRows.forEach((row) => {
      row.billRate = billRate;
      row.billable = (billRate ?? 0) > 0;
      row.costRate = costRate;
    });

    if (
      areWeeklyTimeFormStatesEqual(
        defaultValues,
        weeklyTimeSheetFormMethods.getValues(),
      )
    ) {
      resetBillableStatus(mostRecentWeekEntries);

      weeklyTimeSheetFormMethods.reset(
        mapTimeEntriesToWeeklyTimeForm(
          timeFor,
          week,
          mostRecentWeekEntries,
          true,
        ),
        {
          keepDirty: true,
        },
      );
      resetLastWeekTimeEntriesData();
    } else {
      setCopyLastWeekModalOpen(true);
    }
  }, [copyLastWeekTimeEntriesData, resetBillableStatus]);

  // run when settings change
  useEffect(() => {
    if (!timeTrackingSettingsLoading && !timeTrackingSettingsError) {
      if (weekStartDate.day() !== timeTrackingSettings.firstDayOfWeek) {
        weeklyTimeSheetFormMethods.reset(
          getWeeklyTimeFormDefaultValues(timeTrackingSettings.firstDayOfWeek, {
            timeFor: weeklyTimeSheetFormMethods.getValues().timeFor,
          }),
        );
      }
    }
  }, [
    timeTrackingSettingsLoading,
    timeTrackingSettingsError,
    timeTrackingSettings,
  ]);

  // run when get billRate and costRate changes
  useEffect(() => {
    // @ts-ignore
    if (
      (vendor?.Id === timeForId ||
        employee?.externalIds?.some((e) => e.localId === timeForId)) &&
      !searchTimeEntriesLoading
    ) {
      weeklyTimeSheetFormMethods
        .getValues()
        .weeklyTimeRows.forEach((row, rowIndex) => {
          const rowBillRate = row.id === 0 ? billRate : row.billRate;
          const rowCostRate = row.id === 0 ? costRate : row.costRate;
          setJobCostingDetails(weeklyTimeSheetFormMethods.setValue, {
            rowIndex,
            jobCostingDetails: {
              billRate: rowBillRate,
              costRate: rowCostRate,
              billable: row.id
                ? row.billable
                : isEmployeeOrVendorBillable || (rowBillRate ?? 0) > 0,
            },
          });
        });
    }
  }, [
    searchTimeEntriesLoading,
    billRate,
    costRate,
    timeForId,
    isEmployeeOrVendorBillable,
  ]);

  // Use a ref to store the previous values
  const prevTimeEntriesFromForm = useRef<WeeklyTimeRowState[]>([]);
  const oldItemDescription = useRef<string[]>([]);
  const serviceItemPriceRef = useRef<number>(0);
  const serviceDescriptionRef = useRef<string>('');
  const serviceTaxableRef = useRef<boolean>(false);
  const quickFillFieldLabels = useRef<Record<number, any>>({});

  const updateLabel = (field: string, value: string, index: number) => {
    const currentRowValues = quickFillFieldLabels.current[index] || {};
    if (field === 'customerProject') {
      const parts = value
        .split(':')
        .map((part) => part.trim())
        .filter(Boolean);
      const selectedProjectId = weeklyTimeSheetFormMethods.getValues(
        `weeklyTimeRows.${index}.timeAgainst.project.id`,
      );

      if (selectedProjectId) {
        currentRowValues.project = parts.length > 1 ? parts.pop() || '' : '';
        currentRowValues.customer = parts.join(':');
      } else {
        currentRowValues.customer = parts.join(':');
        currentRowValues.project = '';
      }
    } else {
      currentRowValues[field] = value;
    }

    quickFillFieldLabels.current[index] = currentRowValues;
  };

  // run when service items change
  useEffect(() => {
    if (timeEntriesFromForm && !searchTimeEntriesLoading) {
      timeEntriesFromForm.forEach((item, index) => {
        if (
          isFormEdited.current[index] &&
          item.service.id !== prevTimeEntriesFromForm.current[index]?.service.id
        ) {
          const { costRate, notes } =
            weeklyTimeSheetFormMethods.getValues().weeklyTimeRows[index];
          let selectedBillRate = null;
          let defaultBillableStatus;
          if (serviceItemPriceRef.current > 0) {
            selectedBillRate = serviceItemPriceRef.current;
          } else if (employee || vendorData) {
            selectedBillRate = window.isNaN(billRate as number)
              ? null
              : billRate;
            defaultBillableStatus =
              timeForType === TimeForType.EMPLOYEE
                ? employee?.employmentDetail?.jobCosting?.billable
                : false;
          }
          setJobCostingDetails(weeklyTimeSheetFormMethods.setValue, {
            rowIndex: index,
            jobCostingDetails: {
              billRate: selectedBillRate,
              costRate: window.isNaN(costRate as number) ? null : costRate,
              // service items set bill rate as well as change the billable status
              billable:
                defaultBillableStatus ||
                (selectedBillRate !== null && selectedBillRate > 0),
            },
          });
          setRowIndex(index);
          if (
            notes !== '' &&
            notes !== null &&
            oldItemDescription.current[index] !== notes &&
            serviceDescriptionRef.current !== ''
          ) {
            setNotesOverwriteModelOpen(true);
          } else if (
            notes === '' ||
            notes === null ||
            oldItemDescription.current[index] === notes
          ) {
            weeklyTimeSheetFormMethods.setValue(
              `weeklyTimeRows.${index}.notes`,
              serviceDescriptionRef.current,
            );
          }

          weeklyTimeSheetFormMethods.setValue(
            `weeklyTimeRows.${index}.taxable`,
            serviceTaxableRef.current,
          );

          oldItemDescription.current[index] = serviceDescriptionRef.current;
        }
      });
      // Update the ref with the current values
      prevTimeEntriesFromForm.current = timeEntriesFromForm;
    }
  }, [timeEntriesFromForm, billRate]);

  // run hook when uxPreference for a preselected team member name is retrieved
  useEffect(() => {
    if (
      !isRenderingAfterSaveAndNew.current &&
      weeklyTimeSheetFormMethods.getValues().timeFor.id === '' && // if timeFor is not set only then reset it from preference store
      timeTrackingPreferences[UxPreferenceKey.TIME_ENTRY_TIME_FOR] &&
      timeTrackingPreferences[UxPreferenceKey.TIME_ENTRY_TIME_FOR].id !== '' &&
      timeTrackingPreferences[UxPreferenceKey.TIME_ENTRY_TIME_FOR].id !==
        weeklyTimeSheetFormMethods.getValues().timeFor.id
    ) {
      weeklyTimeSheetFormMethods.setValue(
        'timeFor',
        timeTrackingPreferences[UxPreferenceKey.TIME_ENTRY_TIME_FOR],
      );
    }
  }, [timeTrackingPreferences]);

  const [invoicedModalOpen, setInvoicedModalOpen] = useState<boolean>(false);

  const { restrictedFieldType, isRestrictedChange, modifiedRows } =
    useInvoicedValidation({
      mode: 'weekly',
      currentValues: timeEntriesFromForm,
      defaultValues: (
        weeklyTimeSheetFormMethods.formState
          .defaultValues as WeeklyTimeFormState
      ).weeklyTimeRows,
      dirtyFields:
        weeklyTimeSheetFormMethods.formState.dirtyFields.weeklyTimeRows,
    });

  // Watch for changes that should open the modal
  useEffect(() => {
    const { dirtyFields } = weeklyTimeSheetFormMethods.formState;
    if (
      !dirtyFields.weeklyTimeRows ||
      Object.keys(dirtyFields.weeklyTimeRows).length === 0
    ) {
      return;
    }

    // Only open modal if we have a restricted change or modified rows
    if (isRestrictedChange || (modifiedRows && modifiedRows.size > 0)) {
      setInvoicedModalOpen(true);
    }
  }, [isRestrictedChange, modifiedRows, weeklyTimeSheetFormMethods.formState]);

  // Add state to track confirmed changes
  const [confirmedChanges, setConfirmedChanges] = useState<
    Record<number, Partial<WeeklyTimeRowState>>
  >({});

  const handleModalConfirm = () => {
    if (isRestrictedChange) {
      // For restricted fields, always reset to previous values
      const defaultValues = weeklyTimeSheetFormMethods.formState
        .defaultValues as WeeklyTimeFormState;
      weeklyTimeSheetFormMethods.reset(defaultValues);
    } else {
      // For warnings (invoiced changes), keep the changes and store them in confirmedChanges
      const currentValues = weeklyTimeSheetFormMethods.getValues();
      if (modifiedRows) {
        const newConfirmedChanges = { ...confirmedChanges };
        modifiedRows.forEach((rowIndex) => {
          const currentRow = currentValues.weeklyTimeRows[rowIndex];
          newConfirmedChanges[rowIndex] = {
            ...newConfirmedChanges[rowIndex],
            ...currentRow,
          };
        });
        setConfirmedChanges(newConfirmedChanges);
      }
      weeklyTimeSheetFormMethods.reset(currentValues as WeeklyTimeFormState);
    }
    setInvoicedModalOpen(false);
  };

  const handleModalCancel = () => {
    const defaultValues = weeklyTimeSheetFormMethods.formState
      .defaultValues as WeeklyTimeFormState;
    const currentValues = weeklyTimeSheetFormMethods.getValues();

    // If there are modified rows, only reset those specific rows while preserving confirmed changes
    if (
      modifiedRows &&
      modifiedRows.size > 0 &&
      defaultValues.weeklyTimeRows &&
      currentValues.weeklyTimeRows
    ) {
      const newValues = { ...currentValues } as WeeklyTimeFormState;
      modifiedRows.forEach((rowIndex) => {
        if (
          defaultValues.weeklyTimeRows[rowIndex] &&
          newValues.weeklyTimeRows[rowIndex]
        ) {
          // Start with the default values for this row
          const defaultRow = { ...defaultValues.weeklyTimeRows[rowIndex] };

          // Apply any previously confirmed changes for this row
          if (confirmedChanges[rowIndex]) {
            Object.assign(defaultRow, confirmedChanges[rowIndex]);
          }

          // Set the row with default values + confirmed changes
          newValues.weeklyTimeRows[rowIndex] = defaultRow;
        }
      });
      weeklyTimeSheetFormMethods.reset(newValues);
    } else {
      // If no specific rows are tracked or arrays are undefined, fall back to full reset
      // but preserve confirmed changes
      const newValues = { ...defaultValues };
      Object.entries(confirmedChanges).forEach(([rowIndex, changes]) => {
        const idx = parseInt(rowIndex, 10);
        if (newValues.weeklyTimeRows[idx]) {
          newValues.weeklyTimeRows[idx] = {
            ...newValues.weeklyTimeRows[idx],
            ...changes,
          };
        }
      });
      weeklyTimeSheetFormMethods.reset(newValues);
    }
    setInvoicedModalOpen(false);
  };

  // -------------------------------- component methods

  const setErrorMessageAndScrollIntoView = (
    error: string,
    element?: string,
  ) => {
    setErrorMessage(error);
    ignoreCloseBooksCheck.current = false;

    if (element) {
      const timeEntriesFromForm =
        weeklyTimeSheetFormMethods.getValues().weeklyTimeRows;
      const customerRowIndex = timeEntriesFromForm.findIndex(
        (row) => row.timeAgainst.customer?.id === element,
      );

      if (customerRowIndex !== -1) {
        const customerRow = document.querySelector(
          `[data-row-index="${customerRowIndex}"]`,
        );
        if (customerRow) {
          customerRow.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center',
          });
          return;
        }
      }
    }
    document
      .querySelector('[data-testid="WeeklyTimeHOCErrorPageMessage"]')
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleBatchSaveError = (
    error: string,
    element?: string,
    meta?: {
      errorCode?: string;
      subCode?: string;
    },
  ) => {
    const pendingMessage = resolvePendingMessageForError(
      meta?.errorCode,
      meta?.subCode,
      PendingSaveBannerAction.UPDATE,
    );

    if (pendingMessage) {
      setErrorMessage(null);
      setPendingSaveMessage(pendingMessage);
      return;
    }

    setPendingSaveMessage(null);
    setErrorMessageAndScrollIntoView(error, element);
  };

  // -------------------------------- component interaction handlers

  const handleSettingsSaveSuccess = () => {
    // TODO: wait a bit for settings change to persist
    setTimeout(refetchTimeTrackingSettings, 500);
    setTimeout(
      () => getPreference(UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE),
      500,
    );
    setTimeout(
      () => getPreference(UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS),
      500,
    );
  };

  const renderFeedbackTrigger = useCallback(
    (handleAccessPointClick: () => void) => {
      setTriggerFeedback(() => handleAccessPointClick);
      return null;
    },
    [],
  );

  const handleClose = () => {
    weeklyTimeSheetFormMethods.reset();
    setErrorMessage(null);
    setPendingSaveMessage(null);
    clearCachedLockContext();
    setIsSettingsPopoverOpen(false);
    setConfirmedChanges({});
    setOpen(false);
    // Publish close event only if unification is enabled
    if (isFreeDataWithUnificationEnabled) {
      sandbox.pubsub.publish(WEEKLY_TIME_TROWSER_EVENTS.CLOSE, {});
    }
  };

  const handleSuccessToastClose = () => {
    setShowSuccessToast(false);
  };

  const handleCloseWithUnsavedChanges = () => {
    track(WEEKLY_TIME_TRACKING_POINTS.CANCEL);
    if (isAWeeklyTimeFormDirty(weeklyTimeSheetFormMethods.formState)) {
      setUnsavedChangesModalOpen(true);
    } else {
      handleClose();
    }
  };

  const handleFeedbackIconClick = () => {
    track(WEEKLY_TIME_TRACKING_POINTS.FEEDBACK);
    setShowFeedbackPopover((prev) => !prev);
  };

  const handleFeedbackClose = (result: { success: boolean } | null) => {
    setShowFeedbackPopover(false);
    if (result?.success) {
      setShowFeedbackSuccessToast(true);
    }
  };

  const refetchTimeEntries = () => {
    const { timeFor, week } = weeklyTimeSheetFormMethods.getValues();
    if (!timeFor.id) return;
    createCustomerInteraction(
      sandbox,
      TimeCustomerInteraction.WEEKLY_TIME_READ,
    );
    const input = getSearchTimeEntriesInput(
      { startDate: week.startDate, endDate: week.endDate },
      timeFor.id,
    );
    const headers = buildTimeSummaryTimeActivityHeaders({
      isTimeEntryPrimaryDataSourceEnabled,
      isTimeActivityRequest: true,
      entitlementGrants: entitlements,
      entitlementsReady: !entitlementsLoading,
    });
    searchTimeEntries({
      variables: { input },
      context: {
        headers: {
          ...getCustomerInteractionPropagationHeaders(
            sandbox,
            TimeCustomerInteraction.WEEKLY_TIME_READ,
          ),
          ...headers,
        },
      },
    });
  };

  const onSaveSuccess = (
    result: TimeTracking_BatchManageTimeEntriesPayload,
  ) => {
    ignoreCloseBooksCheck.current = false;
    setShowSuccessToast(true);
    const { timeFor } = weeklyTimeSheetFormMethods.getValues();
    setPreference(UxPreferenceKey.TIME_ENTRY_TIME_FOR, timeFor);

    refetchTimeEntries();
  };

  const onSaveAndNewSuccess = (
    selectedSplitCta: string,
    result: TimeTracking_BatchManageTimeEntriesPayload,
  ) => {
    ignoreCloseBooksCheck.current = false;
    setShowSuccessToast(true);
    setPreferences({
      [UxPreferenceKey.TIME_ENTRY_TIME_FOR]:
        weeklyTimeSheetFormMethods.getValues().timeFor,
      [UxPreferenceKey.TIME_ENTRY_SELECTED_SPLIT_CTA]: selectedSplitCta,
    });
    if (!timeTrackingOnlyId) {
      resetEmployee();
      resetVendorData();
    }

    const timeFor = timeTrackingOnlyId
      ? weeklyTimeSheetFormMethods.getValues().timeFor
      : { id: '', name: '', type: TimeForType.EMPLOYEE };

    // Reset to default values after Save And New (only in case of Time Tracking Only User preserve pre-defined job costing details)
    const defaultValues = getWeeklyTimeFormDefaultValues(
      timeTrackingSettings.firstDayOfWeek,
      {
        timeFor,
      },
    );

    if (timeTrackingOnlyId) {
      defaultValues.weeklyTimeRows.forEach((row) => {
        row.billRate = billRate;
        row.billable = isEmployeeOrVendorBillable || (billRate ?? 0) > 0;
        row.costRate = costRate;
      });
    }

    weeklyTimeSheetFormMethods.reset(defaultValues);
    clearCachedLockContext();
    isRenderingAfterSaveAndNew.current = true;
  };

  const onSaveAndCloseSuccess = (
    selectedSplitCta: string,
    result: TimeTracking_BatchManageTimeEntriesPayload,
  ) => {
    ignoreCloseBooksCheck.current = false;
    setPreferences({
      [UxPreferenceKey.TIME_ENTRY_TIME_FOR]:
        weeklyTimeSheetFormMethods.getValues().timeFor,
      [UxPreferenceKey.TIME_ENTRY_SELECTED_SPLIT_CTA]: selectedSplitCta,
    });
    setShowSuccessToast(true);
    handleClose();
  };

  const executeMutation: SubmitHandler<WeeklyTimeFormState> = async (
    formState: WeeklyTimeFormState,
  ) => {
    const { timeFor, week: FormWeek } = weeklyTimeSheetFormMethods.getValues();

    if (timeFor.id === undefined || timeFor.id === '') {
      const roleType =
        sandbox?.extensions?.qbo?.context?.getAuthInfo?.()?.legacyRoles
          ?.roleType;
      sandbox.logger.error(
        'executeMutation: timeFor.id is not set! Time entry creation will fail!',
        {
          timeFor,
          timeForId,
          timeTrackingOnlyId,
          roleType,
        },
      );
    }

    const mappedWeeklyTimeFormState = mapTimeEntriesToWeeklyTimeForm(
      timeFor,
      FormWeek,
      searchTimeEntriesData || [],
    );

    const formData = mapWeeklyTimeForm({
      formState,
      settings: timeTrackingSettings,
      preferences: timeTrackingPreferences,
      hasPayroll,
      hasAdminAccess,
      hasProjects,
      defaultState: mappedWeeklyTimeFormState,
      isLegacyQboUserEnabled,
    });

    // validate input
    if (
      formData.timeEntriesToDelete?.length === 0 &&
      formData.timeEntries?.length === 0
    ) {
      const hasAnyDuration = formState.weeklyTimeRows.some((row) =>
        row.durations.some(
          (d) => d.duration !== null && d.duration !== undefined,
        ),
      );
      setErrorMessage(
        intl.formatMessage({
          id: hasAnyDuration
            ? 'week.no.changes.to.save'
            : 'week.durations.at.least.one.required',
        }),
      );
      return;
    }

    const { week } = weeklyTimeSheetFormMethods.getValues();
    if (
      !ignoreCloseBooksCheck.current &&
      timeTrackingSettings.isCloseBookDateEnabled &&
      timeTrackingSettings.closeBookDate.isAfter(week.startDate)
    ) {
      setCloseBooksModalOpen(true);
    } else {
      createCustomerInteraction(
        sandbox,
        TimeCustomerInteraction.WEEKLY_TIME_SAVE,
      );
      saveWeeklyTimesheet({
        variables: {
          input: formData,
        },
        context: {
          clientName: ApolloClientNames.TIME_TRACKING,
          headers: {
            ...getCustomerInteractionPropagationHeaders(
              sandbox,
              TimeCustomerInteraction.WEEKLY_TIME_SAVE,
            ),
            ...buildTimeSummaryTimeActivityHeaders({
              isTimeEntryPrimaryDataSourceEnabled,
              isTimeActivityRequest: true,
              entitlementGrants: entitlements,
              entitlementsReady: !entitlementsLoading,
            }),
          },
        },
      });
    }
  };

  const handleFormErrors = (errors: any) => {
    const errorRows = Object.keys(errors.weeklyTimeRows || {}).map(Number);
    if (errorRows.length > 0) {
      setTimeout(() => {
        document
          .querySelector(`[data-row-index="${errorRows[0]}"]`)
          ?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const onFormSubmit = () => {
    setErrorMessage(null);
    setPendingSaveMessage(null);
    setIsSettingsPopoverOpen(false);
    const formErrors = weeklyTimeSheetFormMethods.formState.errors;
    const hasDurationFormatErrors = (): boolean => {
      const rows = formErrors?.weeklyTimeRows as Array<{
        durations?: Array<{ message?: string; type?: string }>;
      }>;
      return rows?.some((row) =>
        (row?.durations ?? []).some(
          (durationError: { message?: string; type?: string }) =>
            !!durationError?.message,
        ),
      );
    };

    if (hasDurationFormatErrors()) {
      handleFormErrors(formErrors);
      return;
    }
    weeklyTimeSheetFormMethods.handleSubmit((data) => {
      executeMutation(data);
      resetTimeEntriesData();
      isFormEdited.current = isFormEdited.current.map(() => false);
    }, handleFormErrors)();
  };

  const handleOverwriteNotesChanges = () => {
    weeklyTimeSheetFormMethods.setValue(
      `weeklyTimeRows.${rowIndex}.notes`,
      serviceDescriptionRef.current,
    );
    setNotesOverwriteModelOpen(false);
  };

  const handleSplitCTAOptionClicked = (option: string) => {
    if (option === TIME_ENTRY_SPLIT_CTA_OPTIONS.SAVE_AND_NEW.key) {
      track(WEEKLY_TIME_TRACKING_POINTS.SAVE_AND_NEW);
      onMutationSuccessCallback.current = onSaveAndNewSuccess.bind(
        null,
        option,
      );
      onFormSubmit();
    } else if (option === TIME_ENTRY_SPLIT_CTA_OPTIONS.SAVE_AND_CLOSE.key) {
      track(WEEKLY_TIME_TRACKING_POINTS.SAVE_AND_CLOSE);
      onMutationSuccessCallback.current = onSaveAndCloseSuccess.bind(
        null,
        option,
      );
      onFormSubmit();
    }
  };

  const handleSplitButtonClick = () => {
    handleSplitCTAOptionClicked(splitCTAPrimaryOption.value);
  };

  const handleSplitButtonSelect = (e: any) => {
    handleSplitCTAOptionClicked(e.target.value);
  };

  const handleCopyLastWeek = () => {
    track(WEEKLY_TIME_TRACKING_POINTS.COPY_LAST_SHEET);
    setErrorMessage(null);
    const lookUpIntervalForCopyLastTimesheet =
      getlookupIntervalForCopyLastTimesheet(sandbox);
    const { timeFor, week } = weeklyTimeSheetFormMethods.getValues();
    if (timeFor.id) {
      createCustomerInteraction(
        sandbox,
        TimeCustomerInteraction.WEEKLY_TIME_READ,
      );
      weeklyTimeSheetFormMethods.setError('timeFor', {
        message: undefined,
      });
      const copyLastWeekTAHeaders = buildTimeSummaryTimeActivityHeaders({
        isTimeEntryPrimaryDataSourceEnabled,
        isTimeActivityRequest: true,
        entitlementGrants: entitlements,
        entitlementsReady: !entitlementsLoading,
      });
      copyLastWeekTimeEntries({
        variables: {
          input: getLastWeekTimeEntriesInput(
            week,
            timeFor.id,
            lookUpIntervalForCopyLastTimesheet,
          ),
        },
        context: {
          headers: {
            ...getCustomerInteractionPropagationHeaders(
              sandbox,
              TimeCustomerInteraction.WEEKLY_TIME_READ,
            ),
            ...copyLastWeekTAHeaders,
          },
        },
      })
        // response handling flow
        .then((response) => {
          if (hasAnyGraphQLError(response)) {
            const gqlErr = extractGraphQLError(response)!;
            logTimeSummaryTimeActivityApiConsumption(
              loggingConfigLogger,
              copyLastWeekTAHeaders,
              {
                api: TIME_SUMMARY_API_NAMES.TIME_ACTIVITY_SEARCH,
                operation: TIME_SUMMARY_API_OPERATION.READ,
                status: TIME_SUMMARY_API_STATUS.FAILED,
                errorMessage: gqlErr.message,
              },
            );
          } else if (response.data) {
            logTimeSummaryTimeActivityApiConsumption(
              loggingConfigLogger,
              copyLastWeekTAHeaders,
              {
                api: TIME_SUMMARY_API_NAMES.TIME_ACTIVITY_SEARCH,
                operation: TIME_SUMMARY_API_OPERATION.READ,
                status: TIME_SUMMARY_API_STATUS.SUCCESS,
              },
            );
          }
        })
        .catch((err) => {
          logTimeSummaryTimeActivityApiConsumption(
            loggingConfigLogger,
            copyLastWeekTAHeaders,
            {
              api: TIME_SUMMARY_API_NAMES.TIME_ACTIVITY_SEARCH,
              operation: TIME_SUMMARY_API_OPERATION.READ,
              status: TIME_SUMMARY_API_STATUS.FAILED,
              errorMessage:
                err instanceof Error ? err.message : String(err ?? ''),
            },
          );
        });
    } else {
      weeklyTimeSheetFormMethods.setError('timeFor', {
        message: intl.formatMessage({
          id: 'drawer.field.required',
        }),
      });
    }
  };

  const handleCopyLastWeekModalClose = () => {
    setCopyLastWeekModalOpen(false);
    resetLastWeekTimeEntriesData();
  };

  const handleCopyLastWeekModalOverwrite = () => {
    if (copyLastWeekTimeEntriesData) {
      const { timeFor, week } = weeklyTimeSheetFormMethods.getValues();
      const mostRecentWeekEntries = getMostRecentWeekTimeEntries(
        copyLastWeekTimeEntriesData,
        week,
      );
      mostRecentWeekEntries.sort(
        (a, b) => parseInt(a.id, 10) - parseInt(b.id, 10),
      );
      resetBillableStatus(mostRecentWeekEntries);
      weeklyTimeSheetFormMethods.reset(
        mapTimeEntriesToWeeklyTimeForm(
          timeFor,
          week,
          mostRecentWeekEntries,
          true,
        ),
        {
          keepDirty: true,
          keepDefaultValues: true,
        },
      );
      handleCopyLastWeekModalClose();
    }
  };

  const handleCopyLastWeekModalAdd = () => {
    if (copyLastWeekTimeEntriesData) {
      const { timeFor, week } = weeklyTimeSheetFormMethods.getValues();
      const mostRecentWeekEntries = getMostRecentWeekTimeEntries(
        copyLastWeekTimeEntriesData,
        week,
      );
      mostRecentWeekEntries.sort(
        (a, b) => parseInt(a.id, 10) - parseInt(b.id, 10),
      );
      resetBillableStatus(mostRecentWeekEntries);
      const mappedState = mapTimeEntriesToWeeklyTimeForm(
        timeFor,
        week,
        mostRecentWeekEntries,
        true,
      );
      const addedMappedWeeklyRows = weeklyTimeSheetFormMethods
        .getValues()
        .weeklyTimeRows.concat(mappedState.weeklyTimeRows);

      weeklyTimeSheetFormMethods.reset(
        {
          timeFor,
          week,
          weeklyTimeRows: addedMappedWeeklyRows,
        },
        {
          keepDirty: true,
        },
      );
      handleCopyLastWeekModalClose();
    }
  };

  const handlePrintTimeTable = async () => {
    handleSaveClick(() => {
      track(WEEKLY_TIME_TRACKING_POINTS.PRINT);
      printWeeklyTimeTable(
        weeklyTimeSheetFormMethods.getValues(),
        timeTrackingPreferences,
        timeTrackingSettings,
        hasPayroll,
        hasAdminAccess,
        hasProjects,
        currencySymbol,
        intl,
        quickFillFieldLabels.current,
        isBillRateEnable,
      );
    });
  };

  const handleTableExport = async () => {
    handleSaveClick(() => {
      track(WEEKLY_TIME_TRACKING_POINTS.EXPORT);
      exportWeeklyTimesheetExcel(
        weeklyTimeSheetFormMethods.getValues(),
        timeTrackingPreferences,
        timeTrackingSettings,
        hasPayroll,
        hasAdminAccess,
        hasProjects,
        currencySymbol,
        intl,
        quickFillFieldLabels.current,
        isBillRateEnable,
      );
    });
  };

  const handleCloseBooksSaveConfirm = () => {
    setCloseBooksModalOpen(false);
    ignoreCloseBooksCheck.current = true;
    onFormSubmit();
  };

  // ----------------------------------- component mutation hooks

  const [saveWeeklyTimesheet, { loading: saveWeeklyTimesheetLoading }] =
    useBatchSaveTimeEntries({
      onSuccess: (
        ...args: Parameters<typeof onMutationSuccessCallback.current>
      ) => {
        const [payload] = args;
        if (payload) {
          updateCachedLockContextFromPayload(payload);
        }
        setAfterTaskModalPending(sandbox);
        onMutationSuccessCallback.current?.(...args);
      },
      onError: handleBatchSaveError,
      interaction: TimeCustomerInteraction.WEEKLY_TIME_SAVE,
    });

  // ----------------------------------- consolidate component state

  const consolidatedPageLoading = useConsolidatedLoading([
    timeTrackingSettingsLoading,
    timeTrackingPreferencesLoading,
    entitlementsLoading,
    timeTrackingAuthLoading,
    initialTimeEntriesLoading,
    batchAuthzLoading,
  ]);

  // Auto-trigger tour for new users
  useEffect(() => {
    if (
      open &&
      !timeTrackingPreferencesLoading &&
      !consolidatedPageLoading &&
      !tourShownRef.current &&
      isFreeDataWithUnificationEnabled &&
      !weeklyTimesheetPageTourCompleted &&
      isTeamMemberLoaded
    ) {
      setTourOpen(true);
      tourShownRef.current = true;
      sandbox.logger.info('WeeklyTimeHOC: Weekly timesheet page tour started');
      track(WEEKLY_TIME_TRACKING_POINTS.ON_MOUNT);
    }

    if (!open) {
      // Drawer closed: clear modal
      setTourOpen(false);
      tourShownRef.current = false;
    }
  }, [
    open,
    timeTrackingPreferencesLoading,
    consolidatedPageLoading,
    weeklyTimesheetPageTourCompleted,
    isFreeDataWithUnificationEnabled,
    isTeamMemberLoaded,
    sandbox.logger,
    track,
  ]);

  const consolidatedButtonLoading =
    saveWeeklyTimesheetLoading ||
    searchTimeEntriesLoading ||
    copyLastWeekTimeEntriesLoading ||
    false;

  // Handler to manually trigger the tour (for "See what's new" button)
  const handleSeeWhatsNewTriggerTour = useCallback(async () => {
    if (isFreeDataWithUnificationEnabled && isTeamMemberLoaded) {
      setTourOpen(true);
    }
  }, [isFreeDataWithUnificationEnabled, isTeamMemberLoaded]);

  // Adds keyboard event listeners for save and save-and-close shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // The key codes 'ß' and '∂' correspond to 's' and 'd' respectively when using the Ctrl and Alt keys on a Mac.
      const isSaveShortcut =
        event.ctrlKey && event.altKey && event.code === 'KeyS';
      const isSaveAndCloseShortcut =
        event.ctrlKey && event.altKey && event.code === 'KeyD';

      if (isSaveShortcut) {
        event.preventDefault();
        if (!consolidatedButtonLoading) {
          handleSaveClick();
        }
      } else if (isSaveAndCloseShortcut) {
        event.preventDefault();
        if (!consolidatedButtonLoading) {
          handleSplitButtonSelect({ target: { value: 'saveAndClose' } });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Removing the event listener when the component is unmounted to prevent memory leakage
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consolidatedButtonLoading]);

  const handleSaveClick = (callback?: () => void) => {
    if (!consolidatedButtonLoading) {
      track(WEEKLY_TIME_TRACKING_POINTS.SAVE);
      onMutationSuccessCallback.current = (result) => {
        onSaveSuccess(result);
        if (callback) callback();
      };
      onFormSubmit();
    }
  };

  const handleSaveClickWrapper: MouseEventHandler<HTMLButtonElement> = (
    event,
  ) => {
    handleSaveClick();
  };

  const handleDismissWarning: MouseEventHandler<HTMLButtonElement> = () => {
    setErrorMessage(null);
  };

  const handleScrollForTableHeader = () => {
    const table = document.querySelector('#weekly-time-table');
    const thead = table?.querySelector('thead');

    const rect = table?.getBoundingClientRect();

    if (rect?.top && thead) {
      if (rect.top < 56) {
        // this makes sure that table header sticks to the top (and below the page header) when it starts to go up on scrolling
        const topPosition = 56 - rect.top;
        thead.style.top = `${topPosition.toString()}px`;
      } else {
        thead.style.top = '0';
      }
    }
  };

  if (isFullPageMaintenanceEnabled) {
    return (
      <StyledTrowser
        automationId={TROWSER_ID}
        open={open}
        dismissible
        showCancelFooterButton
        onClose={handleCloseWithUnsavedChanges}
        title={intl.formatMessage({
          id: 'trowser.title.weekly',
        })}
      >
        <MaintenancePage />
      </StyledTrowser>
    );
  }

  return (
    <>
      <StyledTrowser
        automationId={TROWSER_ID}
        open={open}
        dismissible
        feedback={!timeTrackingAuthError}
        onFeedbackIconClick={
          showUserVoiceFeedbackWidget
            ? triggerFeedback
            : handleFeedbackIconClick
        }
        isFeedbackMenuOpen={showFeedbackPopover}
        showCancelFooterButton
        onClose={handleCloseWithUnsavedChanges}
        title={intl.formatMessage({
          id: 'trowser.title.weekly',
        })}
        hideOverflow={isMobile}
        footerCenterLinkLabels={
          !timeTrackingAuthError
            ? [
                intl.formatMessage({
                  id: 'copy.timesheet',
                }),
              ]
            : []
        }
        footerCenterLinkActions={
          !timeTrackingAuthError ? [handleCopyLastWeek] : []
        }
        footerButton={
          isMobile || !!timeTrackingAuthError
            ? []
            : [
                timeTrackingOnlyId ? (
                  <Button
                    disabled={
                      consolidatedButtonLoading || consolidatedPageLoading
                    }
                    onClick={() =>
                      handleSplitCTAOptionClicked(
                        TIME_ENTRY_SPLIT_CTA_OPTIONS.SAVE_AND_CLOSE.key,
                      )
                    }
                    data-testid="weekly-time-trowser_save_and_close"
                  >
                    {intl.formatMessage({
                      id: TIME_ENTRY_SPLIT_CTA_OPTIONS.SAVE_AND_CLOSE.labelKey,
                    })}
                  </Button>
                ) : (
                  <SplitButton
                    label={intl.formatMessage({
                      id: splitCTAPrimaryOption.labelKey,
                    })}
                    onClick={handleSplitButtonClick}
                    onSelect={handleSplitButtonSelect}
                    disabled={consolidatedButtonLoading}
                  >
                    <MenuItem
                      key={splitCTASecondaryOption.key}
                      value={splitCTASecondaryOption.value}
                    >
                      {intl.formatMessage({
                        id: splitCTASecondaryOption.labelKey,
                      })}
                    </MenuItem>
                  </SplitButton>
                ),
                <Button
                  disabled={consolidatedPageLoading}
                  priority="secondary"
                  onClick={handleSaveClickWrapper}
                  isLoading={consolidatedButtonLoading}
                  loadingComponent={<Activity shape="dots" size="small" />}
                  data-testid="weekly-time-trowser_save"
                  aria-label="weekly-time-trowser_save"
                >
                  {intl.formatMessage({ id: 'save' })}
                </Button>,
              ]
        }
      >
        {!timeTrackingAuthError ? (
          <TrowserContent onScroll={handleScrollForTableHeader}>
            {isMobile ? (
              <MobileBlock onClose={handleClose} />
            ) : (
              <>
                {isTeamMemberLoaded && (
                  <WayBackWhatsNewContainer
                    trowserId={TROWSER_ID}
                    trackingPoints={WEEKLY_TIME_TRACKING_POINTS}
                    isTimeEntry={isWeeklyTimeEntry}
                    isFormEdited={isAWeeklyTimeFormDirty(
                      weeklyTimeSheetFormMethods.formState,
                    )}
                    onTourReset={
                      isFreeDataWithUnificationEnabled
                        ? handleSeeWhatsNewTriggerTour
                        : undefined
                    }
                    actionLabelId="learn.more.action.label"
                  />
                )}
                <ImportTimeWithAICTA />

                {errorMessage && (
                  <StyledPageMessage
                    open
                    dismissible
                    type="warn"
                    automationId="WeeklyTimeHOCErrorPageMessage"
                    onClose={handleDismissWarning}
                  >
                    {errorMessage}
                  </StyledPageMessage>
                )}
                {pendingSaveMessage && (
                  <StyledPageMessage
                    open
                    dismissible
                    type={pendingSaveMessage.type}
                    automationId="WeeklyTimeHOCPendingSavePageMessage"
                    title={intl.formatMessage({
                      id: pendingSaveMessage.titleKey,
                    })}
                    onClose={() => setPendingSaveMessage(null)}
                  >
                    {intl.formatMessage({
                      id: pendingSaveMessage.messageKey,
                    })}
                  </StyledPageMessage>
                )}
                {consolidatedPageLoading ? (
                  <ActivityContainer>
                    <Activity shape="dots" size="large" />
                  </ActivityContainer>
                ) : (
                  <FormProvider {...weeklyTimeSheetFormMethods}>
                    <WeeklyTimeTableHeader
                      settings={timeTrackingSettings}
                      timeTrackingOnlyId={timeTrackingOnlyId}
                      setOnTeamMemberLoaded={setIsTeamMemberLoaded}
                    />
                    <WeeklyTimeTableAuxiliary
                      isSettingsAccessible={isSettingsAccessible}
                      preferences={timeTrackingPreferences}
                      onSettingsSaveSuccess={handleSettingsSaveSuccess}
                      isSettingsOpen={isSettingsPopoverOpen}
                      setSettingsOpen={setIsSettingsPopoverOpen}
                      onPrintTimeTable={handlePrintTimeTable}
                      onExportTableClick={handleTableExport}
                    />
                    <WeeklyTimeTable
                      settings={timeTrackingSettings}
                      preferences={timeTrackingPreferences}
                      hasPayroll={hasPayroll}
                      hasAdminAccess={hasAdminAccess}
                      hasProjects={hasProjects}
                      serviceItemPriceRef={serviceItemPriceRef}
                      serviceDescriptionRef={serviceDescriptionRef}
                      serviceTaxableRef={serviceTaxableRef}
                      updateLabel={updateLabel}
                      billRate={billRate}
                      costRate={costRate}
                      isFormEdited={isFormEdited}
                      timeOffMethod={timeOffMethod}
                      setErrorMessage={setErrorMessageAndScrollIntoView}
                      isEmployeeOrVendorBillable={isEmployeeOrVendorBillable}
                      isBillRateEnable={isBillRateEnable}
                    />
                  </FormProvider>
                )}
              </>
            )}
          </TrowserContent>
        ) : (
          <StyledAuthErrorMessage />
        )}
      </StyledTrowser>
      <TSheetsModal />
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
      <FormProvider {...weeklyTimeSheetFormMethods}>
        <ClosedBooksConfirmationModal
          open={closeBooksModalOpen}
          setOpen={setCloseBooksModalOpen}
          onYesClick={handleCloseBooksSaveConfirm}
          isCloseBookPasswordEnabled={
            timeTrackingSettings?.isCloseBookPasswordEnabled
          }
          trackingPoint={WEEKLY_TIME_TRACKING_POINTS.CLOSED_BOOK_PASSWORD}
        />
      </FormProvider>
      <WeeklyCopyLastWeekModal
        open={copyLastWeekModalOpen}
        onClose={handleCopyLastWeekModalClose}
        onOverwrite={handleCopyLastWeekModalOverwrite}
        onAdd={handleCopyLastWeekModalAdd}
        onCancel={handleCopyLastWeekModalClose}
      />
      <SuccessToast
        message={intl.formatMessage({ id: 'toast.save.success' })}
        open={showSuccessToast}
        onClose={handleSuccessToastClose}
      />

      {showUserVoiceFeedbackWidget && (
        <UserVoiceFeedBackWidget
          renderFeedbackTrigger={renderFeedbackTrigger}
        />
      )}

      {showFeedbackPopover && (
        <FeedbackPopover
          open={showFeedbackPopover}
          onClose={handleFeedbackClose}
          targetElement={trowserFeedbackButton}
          isOvertimeEnabled={isOvertimeEnabled}
        />
      )}
      {showFeedbackSuccessToast && (
        <SuccessToast
          message={intl.formatMessage({ id: 'toast.feedback.success' })}
          open={showFeedbackSuccessToast}
          onClose={() => setShowFeedbackSuccessToast(false)}
        />
      )}
      {/* Weekly Timesheet Page Tour */}
      {isFreeDataWithUnificationEnabled && !consolidatedPageLoading && (
        <WeeklyTimesheetPageTourAdapter
          open={tourOpen}
          onClose={() => setTourOpen(false)}
          onFinish={() => setTourOpen(false)}
          isWeeklyTimeEntry={isWeeklyTimeEntry}
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

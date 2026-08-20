import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import { FormProvider, useWatch } from 'react-hook-form';
import dayjs from 'dayjs';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import { Drawer } from '@ids-ts/drawer';
import { Activity } from '@ids-ts/loader';
import Button from '@ids-ts/button';
import { MapSigns, CoffeeMug, StopWatch } from '@design-systems/icons';
import PageMessage from '@ids-ts/page-message';
import {
  ChevronLeftIconControl,
  CloseIconControl,
  IconControl,
} from '@ids-ts/icon-control';
import { Demi, B2, Medium } from '@ids-ts/typography';
import {
  TimeTracking_TotalDurationByDateInput,
  useCreateTimeEntryMutation,
  TimeTracking_TimeEntry,
  useUpdateTimeEntryMutation,
  TimeTracking_TimeForType,
} from 'src/__generated__/timeTracking/graphql';
import {
  Payroll_EmployerBreak,
  useGetEmployerBreaksByAssigneeLazyQuery,
} from 'src/__generated__/oigql/graphql';
import {
  getBrowserTimezone,
  mapQBTimezoneToDayjsTimezone,
} from 'src/js/common/DateAndTimeUtils';
import { useCompanySettings } from 'src/js/service/hooks/settings/useCompanySettings';
import useGetPreferences from 'src/js/service/hooks/preferenceces/useGetPreferences';
import { useGetQLSettings } from 'src/js/service/hooks/settings/useGetQLSettings';
import { useHasProjects } from 'src/js/service/utils/projectsUtils';

import { useGetUserInfo } from 'src/js/service/utils/useGetUserInfo';
import { useLazySearchTimeEntries } from 'src/js/service/hooks/timeEntries/useLazySearchTimeEntries';
import { SuccessToast } from 'src/js/widgets/common/SuccessToast';
import {
  endInteractionWithSuccess,
  TimeCustomerInteraction,
  createCustomerInteraction,
  getCustomerInteractionPropagationHeaders,
} from 'src/js/common/CustomerInteraction';
import { FEATURE_FLAGS, TIME_CLOCK_EVENTS } from 'src/js/common/constants';
import { useLazyGetEmployeeData } from 'src/js/service/hooks/employee/useLazyGetEmployeeData';
import {
  computeHasPayroll,
  useGetEntitlements,
} from 'src/js/service/hooks/entitlements/useGetEntitlements';
import {
  useUxPreferences,
  UxPreferenceKey,
} from 'src/js/service/utils/useUXPreferences';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';
import { useTimeClockTrackingPoints } from '../hooks/useTimeClockTrackingPoints';
import { TimeClockError } from './TimeClockError';
import {
  useTimeClockForm,
  DEFAULT_TIME_CLOCK_FORM_STATE,
  TimeClockFormState,
  isFormDirty,
} from '../hooks/useTimeClockForm';
import { TimeForType } from '../../common/addTimeFormComponents/TeamMember';
import { SubmitTimeDatesProvider } from '../../common/submitTimeDates/SubmitTimeDatesProvider';
import { useGetTotalDurationByDate } from '../hooks/useGetTotalDurationByDate';
import ClockIn from './ClockIn';
import ClockOut from './ClockOut';
import { ClockInFooterButton } from './ClockInFooterButton';
import {
  getEndOfWeek,
  getStartOfWeek,
  getToday,
  mapTimeClockFormToCreateInput,
  mapTodayDurationInput,
  mapWeekDurationInput,
  mapSearchTimeEntriesInput,
  mapTimeEntryToFormValues,
  mapTimeClockFormToUpdateInput,
  mapTimeClockFormToBreakInput,
  mapTimeClockFormToBreakEndInput,
  mapActiveTimeEntryForBreakEnd,
} from '../utils/mapTimeClockFormInput';
import {
  formatClockInMessage,
  formatClockOutMessage,
  formatSaveMessage,
  getFormattedCurrentTime,
  calculateWeekDuration,
  getLoadingState,
  getFullLoadingState,
  formatJobSwitchMessage,
  formatBreakStartMessage,
} from '../utils/timeClockUtils';
import {
  handleCreateTimeEntryError,
  handleUpdateTimeEntryError,
  ERROR_MESSAGES,
  checkIfStartTimeIsInFuture,
  handleClockInError,
  handleClockOutSaveError,
  handleClockOutError,
  handleSwitchJobError,
  handleBreakEndTimeError,
} from '../utils/timeClockErrorUtils';
import TimeClockPopoverTourAdapter from './TimeClockPopoverTourAdapter';
import { ConfirmationModal } from '../../common/ConfirmationModal';
import { CustomBreakSelector } from './CustomBreakSelector';
import BreakTimerComponent from './BreakTimerComponent';
import {
  BlurOverlay,
  ButtonContainer,
  HeaderBackButton,
  OverlayContainer,
  StyledDescriptionConfirmationMessage,
  StyledDrawerContent,
  StyledDrawerFooter,
  StyledDrawerHeader,
  StyledModalContent,
} from '../styles/TimeClockHoc.styled';

const DRAWER_FOOTER_COLOR = '#FFFFFF';
const TOAST_TIMEOUT_MS = 2000;

export interface TimeClockHOCProps {
  isOTX?: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  employeeId?: string;
  timeForType?: TimeTracking_TimeForType;
}

const TimeClockHOC = ({
  open,
  setOpen,
  isOTX,
  employeeId,
  timeForType = TimeTracking_TimeForType.Employee,
}: TimeClockHOCProps) => {
  const intl = useIntl();
  const sandbox = useSandbox();
  const { data: userInfo, loading: userInfoLoading } = useGetUserInfo();
  const clockInTrackingPoints = useTimeClockTrackingPoints();

  const {
    settingsData,
    loading: settingsLoading,
    error: settingsError,
  } = useCompanySettings({ isExported: false });
  const {
    qlSettings: employerSettings,
    loading: employerSettingsLoading,
    error: employerSettingsError,
    refetch: refetchEmployerSettings,
  } = useGetQLSettings({ isExported: false });
  const {
    data: v3PreferencesData,
    loading: v3PreferencesLoading,
    error: v3PreferencesError,
  } = useGetPreferences();
  const hasProjects = useHasProjects();
  const timeClockFormMethods = useTimeClockForm();
  const {
    query: searchTimeEntries,
    data: timeEntriesData,
    loading: timeEntriesLoading,
    error: timeEntriesError,
  } = useLazySearchTimeEntries();
  const track = useTracking();
  const [isSwitchJobClicked, setIsSwitchJobClicked] = useState<boolean>(false);
  const [oldFormValues, setOldFormValues] = useState<TimeClockFormState | null>(
    null,
  );

  const [activeTimeEntry, setActiveTimeEntry] =
    useState<TimeTracking_TimeEntry | null>(null);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorToastMessage, setErrorToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isClockInLoading, setIsClockInLoading] = useState(false);
  const [showSaveError, setShowSaveError] = useState('');
  const quickFillFieldLabels = useRef<Record<string, any>>({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [notesOverwriteModalOpen, setNotesOverwriteModalOpen] = useState(false);
  const [tourPopover, setTourPopover] = useState(false);
  const popoverButtonRef = useRef<HTMLButtonElement | null>(null);
  const isTourPreferenceResetRequestInProgress = useRef(false);

  // Tour context tracking
  const [tourContext, setTourContext] = useState<
    'clock-in' | 'clock-out' | 'drawer-closed'
  >('clock-in');

  // Derived state based on actual backend data
  const isActiveTimeEntry = activeTimeEntry !== null;

  // Defense-in-depth: even if the parent forwards a non-EMPLOYEE timeForType
  // when the FF is off, this HOC self-gates and falls back to EMPLOYEE.
  const { isEnabled: isLegacyQboUserEnabled } = useIXPFeatureFlag({
    flagName: FEATURE_FLAGS.QB_TIME_TRACKING_UI_ENABLE_LEGACY_QBO_USER,
    defaultValue: false,
  });

  // FF-gated effective TimeForType. Only LEGACY_QBO_USER can flow when the FF
  // is on; otherwise we always fall back to EMPLOYEE (preserves prior behavior
  // for the entire time clock surface: clock-in, clock-out, save, switch-jobs,
  // take-break, end-break — all routed through getEffectiveTimeFor below).
  const effectiveTimeForType: TimeTracking_TimeForType = useMemo(
    () =>
      isLegacyQboUserEnabled &&
      timeForType === TimeTracking_TimeForType.LegacyQboUser
        ? TimeTracking_TimeForType.LegacyQboUser
        : TimeTracking_TimeForType.Employee,
    [isLegacyQboUserEnabled, timeForType],
  );

  // Memoized helper function to get the effective time tracking entity (id & type).
  const getEffectiveTimeFor = useCallback(
    () => ({
      id: employeeId || '',
      timeForType: effectiveTimeForType,
    }),
    [employeeId, effectiveTimeForType],
  );

  // Local form-level TimeForType enum matches the GraphQL enum's string values
  // (EMPLOYEE / VENDOR / LEGACY_QBO_USER), so a single cast is sufficient. This
  // is what useTimeClockFieldAssignments and downstream form consumers read.
  // Same FF gate is applied via effectiveTimeForType above.
  const formTimeForType = effectiveTimeForType as unknown as TimeForType;

  // Common function to calculate break duration and elapsed time
  const getBreakTimeInfo = useCallback(
    (breakRule: typeof selectedBreakData, startTime: string) => {
      if (!breakRule || !startTime) return null;

      const { breakDuration, durationUnit } = breakRule;

      // Calculate break duration in seconds
      let breakDurationSeconds = 0;
      if (breakDuration && durationUnit) {
        breakDurationSeconds =
          durationUnit === 'HOURS' ? breakDuration * 3600 : breakDuration * 60;
      }

      // Calculate elapsed time
      const startTimeObj = dayjs(startTime);
      const now = dayjs();
      const elapsedSeconds = now.diff(startTimeObj, 'second');

      return {
        breakDurationSeconds,
        elapsedSeconds,
        isComplete: elapsedSeconds >= breakDurationSeconds,
      };
    },
    [],
  );

  // Preference logic for tour
  const {
    data: uxPreferencesData,
    setPreference,
    loading: uxPreferencesLoading,
    getPreference,
  } = useUxPreferences();
  const tourCompleted =
    uxPreferencesData?.[UxPreferenceKey.TIME_CLOCK_TOUR_COMPLETED] ?? false;

  // Load tour preference when component mounts
  useEffect(() => {
    getPreference(UxPreferenceKey.TIME_CLOCK_TOUR_COMPLETED);
  }, [getPreference]);

  const { isEnabled: isTimeClockTourEnabled } = useIXPFeatureFlag({
    flagName: FEATURE_FLAGS.QB_TIME_TRACKING_UI_TIME_CLOCK_TOUR,
    defaultValue: false,
  });

  const { isEnabled: isPostR2ReleaseTimeExperienceEnabled } = useIXPFeatureFlag(
    {
      flagName: FEATURE_FLAGS.QB_TIME_TRACKING_UI_R2_RELEASE,
      defaultValue: false,
    },
  );

  // Check if tour should be shown (only if not completed)
  const shouldShowTour = !tourCompleted && isTimeClockTourEnabled;

  // Helper flag to know when preference API call is finished
  const preferencesLoaded = !uxPreferencesLoading;

  // Effect to track drawer state changes - use actual clock status
  useEffect(() => {
    if (!open) {
      // Drawer is closing
      setTourContext('drawer-closed');

      // Auto-trigger tour when drawer closes if user is clocked in
      if (
        isActiveTimeEntry &&
        shouldShowTour &&
        preferencesLoaded &&
        !tourPopover
      ) {
        setTourPopover(true);
      }
    } else {
      // Drawer is opening - set context based on actual clock state
      const newContext = isActiveTimeEntry ? 'clock-out' : 'clock-in';
      setTourContext(newContext);
    }
  }, [open, isActiveTimeEntry, shouldShowTour, preferencesLoaded]);

  // Track when "Want to save your changes?" modal is shown
  useEffect(() => {
    if (showConfirmation) {
      track(clockInTrackingPoints.WANT_TO_SAVE);
    }
  }, [showConfirmation, track, clockInTrackingPoints]);

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

  const serviceItemPriceRef = useRef<number>(0);
  const serviceDescriptionRef = useRef<string>('');
  const serviceTaxableRef = useRef<boolean>(false);
  const notesAutoPopulatedRef = useRef<boolean>(false);
  const oldServiceDescriptionRef = useRef<string>('');
  // Tracks the active-entry id whose dimensions are currently in the form, so
  // the reset effect only preserves user selections across the SAME entry
  // (clock-in → clock-out). When the active entry switches, the freshly-mapped
  // API values win instead of carrying stale selections from the prior entry.
  const dimensionsEntryIdRef = useRef<string | null>(null);
  const [hasPayroll, setHasPayroll] = useState<boolean>(false);
  const [showBreakWidget, setShowBreakWidget] = useState(false);
  const [selectedBreakData, setSelectedBreakData] =
    useState<Payroll_EmployerBreak | null>(null);
  const breakTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoEndTriggeredRef = useRef<string | null>(null); // Track which break has been auto-ended
  const [showRequiredText, setShowRequiredText] = useState(false);

  const [createTimeEntry, { loading: createTimeEntryLoading }] =
    useCreateTimeEntryMutation();

  const [updateTimeEntry, { loading: updateTimeEntryLoading }] =
    useUpdateTimeEntryMutation();

  // get breaks assigned to employee
  const [
    getBreaksByAssignee,
    {
      data: breaksByAssigneeData,
      loading: breaksByAssigneeLoading,
      refetch: refetchBreaksByAssignee,
    },
  ] = useGetEmployerBreaksByAssigneeLazyQuery({
    fetchPolicy: 'cache-and-network',
  });

  // get has payroll
  const { data: entitlements, loading: entitlementsLoading } =
    useGetEntitlements();

  const { query: getEmployee, data: employee } = useLazyGetEmployeeData(
    hasPayroll,
    undefined,
  );

  const companyTimezone = mapQBTimezoneToDayjsTimezone(settingsData?.timezone);
  const today = getToday(companyTimezone);
  const startOfWeek = getStartOfWeek(
    companyTimezone,
    settingsData.firstDayOfWeek,
  );
  const endOfWeek = getEndOfWeek(startOfWeek, companyTimezone);

  const todayInput = useMemo<TimeTracking_TotalDurationByDateInput>(
    () => mapTodayDurationInput(getEffectiveTimeFor().id, today, today),
    [getEffectiveTimeFor, today],
  );

  const weekInput = useMemo<TimeTracking_TotalDurationByDateInput>(
    () =>
      mapWeekDurationInput(getEffectiveTimeFor().id, startOfWeek, endOfWeek),
    [startOfWeek, endOfWeek, getEffectiveTimeFor],
  );

  const {
    data: todayData,
    loading: todayLoading,
    refetch: refetchTodayData,
    error: todayError,
  } = useGetTotalDurationByDate({
    input: todayInput,
  });

  const {
    data: weekData,
    loading: weekLoading,
    refetch: refetchWeekData,
    error: weekError,
  } = useGetTotalDurationByDate({
    input: weekInput,
  });

  const todayDuration = todayData?.[0]?.totalDurationSeconds || 0;
  const weekDuration = calculateWeekDuration(weekData);

  const isLoading = getLoadingState(
    false, // No longer loading employee data from TSheets API
    settingsLoading,
    v3PreferencesLoading,
    employerSettingsLoading,
    breaksByAssigneeLoading,
    updateTimeEntryLoading,
    createTimeEntryLoading,
  );

  // Comprehensive loading state that includes all UI element loading states
  const isFullyLoaded = !getFullLoadingState(
    false, // No longer loading employee data from TSheets API
    settingsLoading,
    v3PreferencesLoading,
    employerSettingsLoading || false,
    userInfoLoading,
    timeEntriesLoading,
    todayLoading,
    weekLoading,
    uxPreferencesLoading,
  );

  // Loading state specifically for buttons - excludes toast state
  const isButtonDisabled = !isFullyLoaded || isClockInLoading;

  const labelPreference = {
    DepartmentTerminology:
      v3PreferencesData?.Preferences?.AccountingInfoPrefs
        ?.DepartmentTerminology || '',
    CustomerTerminology:
      v3PreferencesData?.Preferences?.AccountingInfoPrefs
        ?.CustomerTerminology || '',
  };

  useEffect(() => {
    const effectiveId = getEffectiveTimeFor().id;
    if (effectiveId) {
      getEmployee({
        variables: {
          employeeId: effectiveId,
          shouldFetchTimeOffPolicies: hasPayroll,
        },
      });
    }
  }, [employeeId, getEmployee, hasPayroll, getEffectiveTimeFor]);

  useEffect(() => {
    if (entitlements && !entitlementsLoading) {
      setHasPayroll(computeHasPayroll(entitlements));
    }
  }, [entitlements, entitlementsLoading]);

  const watchedFormState = useWatch({
    control: timeClockFormMethods.control,
  });

  // Watch notes field to detect manual changes
  const watchedNotes = useWatch({
    control: timeClockFormMethods.control,
    name: 'notes',
  });

  // Detect when notes are manually changed (not auto-populated)
  useEffect(() => {
    if (
      watchedNotes !== undefined &&
      watchedNotes !== serviceDescriptionRef.current
    ) {
      notesAutoPopulatedRef.current = false;
    }
  }, [watchedNotes]);

  useEffect(() => {
    // Run if service field is dirty or if we have an active time entry (clock-out mode)
    if (!timeClockFormMethods.formState.dirtyFields.service) {
      return;
    }

    // Function to set the billable field (same as STE: when service has price, set billable true)
    const setBillableField = (
      rate: number | null,
      serviceChange: boolean = false,
    ) => {
      const billableValue = rate != null && rate > 0;
      const employeeBillable =
        employee?.employmentDetail?.jobCosting?.billable || false;
      if (serviceChange) {
        timeClockFormMethods.setValue('billable', billableValue);
      } else {
        timeClockFormMethods.setValue(
          'billable',
          billableValue || employeeBillable,
        );
      }
    };

    // Function to update notes when service changes
    const updateNotes = (serviceDescription: string | null) => {
      if (serviceDescription && serviceDescription.trim()) {
        const currentNotes = timeClockFormMethods.getValues().notes || '';
        // Check if notes exist and are different from previous service description
        if (
          currentNotes !== '' &&
          currentNotes !== null &&
          oldServiceDescriptionRef.current !== currentNotes
        ) {
          // If notes are already present and were manually entered, show confirmation modal
          setNotesOverwriteModalOpen(true);
        } else {
          // Update notes with service description
          timeClockFormMethods.setValue('notes', serviceDescription.trim());
          notesAutoPopulatedRef.current = true;
          oldServiceDescriptionRef.current = serviceDescription;
        }
        serviceDescriptionRef.current = serviceDescription;
      }
    };

    if (serviceItemPriceRef?.current && serviceItemPriceRef.current > 0) {
      timeClockFormMethods.setValue(
        'billRate',
        Number(serviceItemPriceRef.current),
      );
      setBillableField(Number(serviceItemPriceRef.current), true);
    } else if (employee?.employmentDetail?.jobCosting) {
      const employeeBillRate = window.isNaN(
        employee.employmentDetail.jobCosting.billRate,
      )
        ? null
        : Number(employee.employmentDetail.jobCosting.billRate);
      timeClockFormMethods.setValue('billRate', employeeBillRate);
      setBillableField(employeeBillRate);
    }

    // Update notes when service changes
    if (serviceDescriptionRef?.current) {
      updateNotes(serviceDescriptionRef.current);
    }
  }, [employee, watchedFormState?.service?.id, timeClockFormMethods]);

  const showToastMessage = (message: string, callback?: () => void) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      setToastMessage('');
      if (callback) {
        callback();
      }
    }, TOAST_TIMEOUT_MS);
  };

  useEffect(() => {
    const effectiveId = getEffectiveTimeFor().id;
    if (effectiveId) {
      // Set timeFor field in the form so CustomerProject can use it for assignment filtering
      timeClockFormMethods.setValue('timeFor', {
        id: effectiveId,
        type: formTimeForType,
        name: userInfo?.userName || '',
      });

      searchTimeEntries({
        variables: {
          input: mapSearchTimeEntriesInput(effectiveId),
        },
      });

      // Fetch assigned breaks for the employee
      if (!breaksByAssigneeLoading && !breaksByAssigneeData) {
        getBreaksByAssignee({
          variables: {
            filter: {
              assigneeId: effectiveId,
              isActive: true,
            },
          },
        });
      }
    }
  }, [
    employeeId,
    formTimeForType,
    searchTimeEntries,
    getEffectiveTimeFor,
    userInfo?.userName,
  ]);

  // run hook on component mount
  useEffect(() => {
    sandbox.logger.info('Component=TimeClock Event=Mounted');
    track(clockInTrackingPoints.ON_MOUNT);
  }, [clockInTrackingPoints, sandbox.logger, track]);

  useEffect(() => {
    if (timeEntriesData?.[0]) {
      setActiveTimeEntry(timeEntriesData[0]);
    }
  }, [timeEntriesData]);

  // Separate effect to handle form reset when activeTimeEntry changes
  useEffect(() => {
    if (activeTimeEntry) {
      // Always preserve the current customFields and dimensions from the form state
      const currentCustomFields = timeClockFormMethods.getValues().customFields;
      const currentDimensions = timeClockFormMethods.getValues().dimensions;
      const mappedValues = mapTimeEntryToFormValues(
        activeTimeEntry,
        settingsData.timezone,
        currentCustomFields && Object.keys(currentCustomFields).length > 0
          ? Object.values(currentCustomFields)
          : activeTimeEntry?.legacyCustomFields || [],
        quickFillFieldLabels.current.location,
      );
      // If currentCustomFields is non-empty, force it into the mapped values
      if (currentCustomFields && Object.keys(currentCustomFields).length > 0) {
        mappedValues.customFields = currentCustomFields;
      }
      // Preserve user-entered dimensions across the reset ONLY for the same
      // active entry (clock-in → clock-out). On a switch to a different entry,
      // let the freshly-mapped API values win rather than carrying over stale
      // selections from the previous entry.
      const isSameEntry = dimensionsEntryIdRef.current === activeTimeEntry.id;
      if (
        isSameEntry &&
        currentDimensions &&
        Object.keys(currentDimensions).length > 0
      ) {
        mappedValues.dimensions = currentDimensions;
      }
      dimensionsEntryIdRef.current = activeTimeEntry.id;
      // Preserve timeFor so assignment hooks (time-against, SFO, CFO) run when transitioning
      // from clock-in to clock-out. mapTimeEntryToFormValues does not set timeFor; without this,
      // reset() would leave timeFor as default empty and useTimeClockFieldAssignments would
      // not call assignment APIs.
      const effectiveTimeFor = getEffectiveTimeFor();
      if (effectiveTimeFor?.id) {
        mappedValues.timeFor = {
          id: effectiveTimeFor.id,
          type: formTimeForType,
          name: userInfo?.userName || '',
        };
      }
      timeClockFormMethods.reset(mappedValues);
    }
  }, [
    activeTimeEntry,
    formTimeForType,
    getEffectiveTimeFor,
    userInfo?.userName,
  ]);

  // To fetch break data when active time entry changes
  useEffect(() => {
    // When we have an active time entry with a break ID, ensure we have break data
    if (activeTimeEntry?.timeBreakId && getEffectiveTimeFor().id) {
      // If we don't have break data yet, fetch it
      if (!breaksByAssigneeData?.payrollEmployerBreaksByAssigneeId?.nodes) {
        getBreaksByAssignee({
          variables: {
            filter: {
              assigneeId: getEffectiveTimeFor().id,
              isActive: true,
            },
          },
        });
      } else {
        // We have break data, find the matching break
        const matchingBreak =
          breaksByAssigneeData.payrollEmployerBreaksByAssigneeId.nodes.find(
            (breakRule) => breakRule.id === activeTimeEntry.timeBreakId,
          );
        if (matchingBreak) {
          setSelectedBreakData(matchingBreak);
        } else if (refetchBreaksByAssignee) {
          // Break not found in current data, refetch to get latest
          refetchBreaksByAssignee({
            filter: {
              assigneeId: getEffectiveTimeFor().id,
              isActive: true,
            },
          });
        }
      }
    } else {
      // No active break, clear selected break data
      setSelectedBreakData(null);
    }
  }, [
    breaksByAssigneeData,
    activeTimeEntry?.timeBreakId,
    getEffectiveTimeFor,
    getBreaksByAssignee,
    refetchBreaksByAssignee,
  ]);

  // Auto-end functionality for breaks
  useEffect(() => {
    // Clear any existing timer
    if (breakTimerRef.current) {
      clearInterval(breakTimerRef.current);
      breakTimerRef.current = null;
    }

    // Only run timer if we have an active break time entry with all required data
    // and we haven't already auto-ended this specific break
    const breakId = activeTimeEntry?.timeBreakId;
    const startTime = activeTimeEntry?.startTime;

    if (
      breakId &&
      startTime &&
      selectedBreakData &&
      selectedBreakData.id === breakId && // Ensure break data matches the active break
      autoEndTriggeredRef.current !== breakId // Haven't auto-ended this break yet
    ) {
      const breakRule = selectedBreakData;
      const { manualRule } = breakRule;

      // Only set up timer for auto-end breaks
      if (manualRule?.autoEndBreak) {
        // Start timer to track elapsed time
        const startTimer = () => {
          const updateElapsedTime = async () => {
            const breakTimeInfo = getBreakTimeInfo(breakRule, startTime);

            if (!breakTimeInfo) return;

            const { breakDurationSeconds, elapsedSeconds, isComplete } =
              breakTimeInfo;

            // If break duration is complete and we haven't triggered auto-end yet
            if (
              breakDurationSeconds > 0 &&
              isComplete &&
              autoEndTriggeredRef.current !== breakId
            ) {
              // Set loading state immediately to show loader during delay
              setIsClockInLoading(true);

              // Mark this break as auto-ended to prevent duplicate triggers
              autoEndTriggeredRef.current = breakId;

              // Clear the timer immediately
              if (breakTimerRef.current) {
                clearInterval(breakTimerRef.current);
                breakTimerRef.current = null;
              }

              sandbox.logger.info(
                '[Auto Break End] - TimeClockHOC - Auto-ending break after duration completed',
                {
                  elapsedSeconds,
                  breakDurationSeconds,
                  breakId,
                  breakRule: selectedBreakData,
                },
              );

              // For automatic breaks, just refetch data
              refetchTodayData();
              refetchWeekData();

              // Add 5-second delay before searching for latest time entries
              // to ensure backend has processed the auto-end break
              const effectiveId = getEffectiveTimeFor().id;
              if (effectiveId) {
                setTimeout(async () => {
                  try {
                    await searchTimeEntries({
                      variables: {
                        input: mapSearchTimeEntriesInput(effectiveId),
                      },
                    });
                  } catch (error) {
                    sandbox.logger.logException(
                      '[Auto Break End] - TimeClockHOC - Error fetching latest time entries after delay',
                      error as Error,
                    );
                  } finally {
                    // Clear loading state after API call completes
                    setIsClockInLoading(false);
                  }
                }, 3000);
              }
              // Clear error and required text when auto-end break completes
              setShowSaveError('');
              setShowRequiredText(false);
            }
          };

          // Update immediately and then every second
          updateElapsedTime();
          breakTimerRef.current = setInterval(updateElapsedTime, 1000);
        };

        startTimer();
      }
    } else if (!breakId) {
      // Reset auto-end tracking when no break is active
      autoEndTriggeredRef.current = null;
    }

    // Cleanup timer on unmount or dependency change
    return () => {
      if (breakTimerRef.current) {
        clearInterval(breakTimerRef.current);
        breakTimerRef.current = null;
      }
    };
  }, [
    activeTimeEntry?.timeBreakId,
    activeTimeEntry?.startTime,
    selectedBreakData?.id,
    selectedBreakData?.manualRule?.autoEndBreak,
  ]);

  const createTimeEntryAndUpdateState = async (
    formValues: any,
    interactionName?: string,
  ) => {
    const createTimeEntryInput = mapTimeClockFormToCreateInput(
      formValues,
      getEffectiveTimeFor(),
      settingsData?.timezone,
    );

    const createResult = await createTimeEntry({
      variables: {
        input: createTimeEntryInput,
      },
      ...(interactionName && {
        context: {
          headers: getCustomerInteractionPropagationHeaders(
            sandbox,
            interactionName,
          ),
        },
      }),
    });
    if (!createResult?.data?.timeTrackingCreateTimeEntry) {
      throw new Error('Failed to update time entry');
    }

    handleCreateTimeEntryError(
      createResult?.data?.timeTrackingCreateTimeEntry,
      intl,
      timeClockFormMethods,
      showToastMessage,
      sandbox,
      formValues,
      setShowSaveError,
    );

    const searchResult = await searchTimeEntries({
      variables: {
        input: mapSearchTimeEntriesInput(getEffectiveTimeFor().id),
      },
    });

    if (!searchResult?.data?.timeTrackingTimeEntries?.edges) {
      throw new Error(ERROR_MESSAGES.FAILED_TO_FETCH);
    }

    const timeEntries = searchResult.data.timeTrackingTimeEntries.edges.map(
      (edge) => edge.node,
    );

    if (timeEntries.length === 0) {
      throw new Error(ERROR_MESSAGES.NO_TIME_ENTRIES);
    }

    setActiveTimeEntry(timeEntries[0] as TimeTracking_TimeEntry);
    const currentCustomFields =
      timeClockFormMethods.getValues().customFields || {};
    timeClockFormMethods.reset(
      mapTimeEntryToFormValues(
        timeEntries[0] as TimeTracking_TimeEntry,
        settingsData?.timezone,
        Object.values(currentCustomFields),
      ),
    );
  };

  const callUpdateTimeEntry = async (
    formValues: any,
    endTime?: string,
    interactionName?: string,
  ) => {
    // Use break-specific mapping for break entries, regular mapping for normal entries
    const updateTimeEntryInput = formValues?.breakId
      ? mapTimeClockFormToBreakEndInput(
          formValues,
          activeTimeEntry!.id,
          settingsData,
          endTime || activeTimeEntry!.endTime,
          getEffectiveTimeFor(),
          quickFillFieldLabels.current.location,
        )
      : mapTimeClockFormToUpdateInput(
          formValues,
          activeTimeEntry!.id,
          settingsData.timezone,
          settingsData,
          endTime || activeTimeEntry!.endTime,
          getEffectiveTimeFor(),
          quickFillFieldLabels.current.location,
          timeClockFormMethods.formState.dirtyFields.dimensions,
        );

    const result = await updateTimeEntry({
      variables: {
        input: updateTimeEntryInput,
      },
      ...(interactionName && {
        context: {
          headers: getCustomerInteractionPropagationHeaders(
            sandbox,
            interactionName,
          ),
        },
      }),
    });

    if (!result?.data?.timeTrackingUpdateTimeEntry) {
      throw new Error(ERROR_MESSAGES.FAILED_TO_UPDATE);
    }
    handleUpdateTimeEntryError(
      result.data.timeTrackingUpdateTimeEntry,
      intl,
      timeClockFormMethods,
      sandbox,
      setShowSaveError,
    );

    return result;
  };

  const shouldShowConfirmation = () =>
    isFormDirty(timeClockFormMethods.formState) && showClockOut;

  const handleClose = () => {
    track(clockInTrackingPoints.TIME_CLOCK_EXIT);
    sandbox.logger.info(
      'Component=TimeClockOut Exit Button Clicked Event=EXIT_ICON_CLCIKED',
    );
    if (shouldShowConfirmation()) {
      setShowConfirmation(true);
    } else {
      setOpen(false);
      sandbox.pubsub.publish(TIME_CLOCK_EVENTS.CLOSE, isActiveTimeEntry);
    }
  };

  const handleConfirmClose = () => {
    track(clockInTrackingPoints.DONT_SAVE);
    setShowConfirmation(false);
    setOpen(false);
    sandbox.pubsub.publish(TIME_CLOCK_EVENTS.CLOSE, isActiveTimeEntry);
  };

  const handleTakeBreak = () => {
    const onSubmit = async (formValues: TimeClockFormState) => {
      // Check if start time is in future
      if (checkIfStartTimeIsInFuture(timeClockFormMethods, sandbox, intl)) {
        return;
      }

      track(clockInTrackingPoints.TAKE_BREAK);

      sandbox.logger.info(
        '[ClockIn Flow] - TimeClockHOC - Take Break Button clicked',
        {
          formValues,
        },
      );

      // Save data before showing break widget
      try {
        setIsClockInLoading(true);

        // Call the save API to persist current form data
        const result = await callUpdateTimeEntry(formValues);

        if (result?.data?.timeTrackingUpdateTimeEntry) {
          sandbox.logger.info(
            '[Break Flow] - TimeClockHOC - Data saved successfully before taking break',
            { result },
          );

          // Clear any previous save errors
          setShowSaveError('');

          // Reset form to clear dirty state after successful save
          timeClockFormMethods.reset(formValues);

          // Show break widget after successful save
          setShowBreakWidget(true);
        }
      } catch (error: unknown) {
        // Handle save API failure with proper error handling
        sandbox.logger.logException(
          '[Break Flow] - TimeClockHOC - Error saving data before taking break',
          error as Error,
        );

        handleClockOutSaveError({
          error,
          formValues,
          sandbox,
          showConfirmation: false,
          handleCancelClose: undefined,
          setShowConfirmation: undefined,
          setShowSaveError,
        });

        // Don't show break widget if save fails
        return;
      } finally {
        setIsClockInLoading(false);
      }
    };

    timeClockFormMethods.handleSubmit(onSubmit)();
  };

  const handleBreakWidgetClose = () => {
    setShowBreakWidget(false);
    setShowErrorToast(false);
    setErrorToastMessage('');
    setShowSaveError('');
  };

  const handleBreakSelected = (breakRule: any) => {
    setSelectedBreakData(breakRule);
  };

  const handleBreakButtonClick = async () => {
    if (selectedBreakData) {
      track(clockInTrackingPoints.BREAK_BUTTON_CLICK);

      sandbox.logger.info(
        '[Break Flow] - TimeClockHOC - Break button clicked',
        {
          selectedBreakData,
        },
      );

      createCustomerInteraction(sandbox, TimeCustomerInteraction.BREAK_START);

      try {
        setIsClockInLoading(true);

        const formValues = timeClockFormMethods.getValues();

        const breakTimeEntryInput = mapTimeClockFormToBreakInput(
          formValues,
          getEffectiveTimeFor(),
          formValues.breakId || '',
          getFormattedCurrentTime(getBrowserTimezone()),
          quickFillFieldLabels.current.location,
        );

        sandbox.logger.info(
          '[Break Flow] - TimeClockHOC - Creating break time entry',
          { breakTimeEntryInput },
        );

        const createResult = await createTimeEntry({
          variables: {
            input: breakTimeEntryInput,
          },
          context: {
            headers: getCustomerInteractionPropagationHeaders(
              sandbox,
              TimeCustomerInteraction.BREAK_START,
            ),
          },
        });

        if (!createResult?.data?.timeTrackingCreateTimeEntry) {
          throw new Error('Failed to create break time entry');
        }

        const createResponse = createResult.data.timeTrackingCreateTimeEntry;

        if (
          createResponse.__typename !== 'TimeTracking_CreateTimeEntryPayload'
        ) {
          throw new Error('Create time entry did not return success payload');
        }

        const createdTimeEntries = createResponse.timeEntries;

        if (
          !createdTimeEntries ||
          !Array.isArray(createdTimeEntries) ||
          createdTimeEntries.length < 2
        ) {
          throw new Error(
            'Expected at least 2 time entries in create API response',
          );
        }

        // Filter to find the time entry with breakId and set as active
        const breakTimeEntry = createdTimeEntries.find(
          (entry) => entry.timeBreakId === formValues.breakId,
        );

        if (breakTimeEntry) {
          // Find the related time entry (breakId is null and isOpen: false) to get department info
          const relatedTimeEntry = createdTimeEntries.find(
            (entry) => entry.timeBreakId === null && entry.isOpen === false,
          );

          // Create break time entry with department info from related entry
          const breakTimeEntryWithDepartment = {
            ...breakTimeEntry,
            department:
              relatedTimeEntry?.department || breakTimeEntry.department,
          } as TimeTracking_TimeEntry;

          sandbox.logger.info(
            '[Break Flow] - TimeClockHOC - Setting break time entry with department info from related entry',
            { breakTimeEntry, relatedTimeEntry, breakTimeEntryWithDepartment },
          );

          setActiveTimeEntry(breakTimeEntryWithDepartment);
        } else {
          // Fallback to first entry if no break entry found
          setActiveTimeEntry(createdTimeEntries[0] as TimeTracking_TimeEntry);
        }

        setShowSaveError('');

        setShowBreakWidget(false);
        showToastMessage(
          formatBreakStartMessage(
            userInfo?.userName || '',
            dayjs(breakTimeEntry?.startTime)
              .tz(getBrowserTimezone())
              .format('h:mm A'),
            intl,
          ),
        );
        refetchTodayData();
        refetchWeekData();
        endInteractionWithSuccess(sandbox, TimeCustomerInteraction.BREAK_START);
      } catch (error: unknown) {
        sandbox.logger.logException(
          '[Break Flow] - TimeClockHOC - Error starting break',
          error as Error,
        );

        setShowSaveError(
          intl.formatMessage({ id: 'timeclock.error.break.start.failed' }),
        );
      } finally {
        setIsClockInLoading(false);
      }
    }
  };

  // call update API for ending break
  const callEndBreakUpdateAPI = async () => {
    try {
      const formValues = timeClockFormMethods.getValues();
      const endTime = getFormattedCurrentTime(getBrowserTimezone());

      // Call update API to end the break
      const result = await callUpdateTimeEntry(
        formValues,
        endTime,
        TimeCustomerInteraction.BREAK_END,
      );

      // Extract time entries from the response
      if (
        result?.data?.timeTrackingUpdateTimeEntry?.__typename ===
        'TimeTracking_UpdateTimeEntryPayload'
      ) {
        const { timeEntries } = result.data.timeTrackingUpdateTimeEntry;

        if (timeEntries && Array.isArray(timeEntries)) {
          // Find the time entry with breakId null, entryMethod "START_END", and isOpen true
          const newActiveEntry = timeEntries.find((entry) => {
            const fullEntry = entry as TimeTracking_TimeEntry;
            return fullEntry.timeBreakId === null && fullEntry.isOpen === true;
          });

          if (newActiveEntry) {
            // Set the new active time entry - the useEffect will handle form reset automatically
            setActiveTimeEntry(newActiveEntry as TimeTracking_TimeEntry);

            sandbox.logger.info(
              '[Break Flow] - TimeClockHOC - Set new active time entry after break end',
              { newActiveEntry },
            );
          }
        }
      }

      // Refresh data after successful break end
      refetchTodayData();
      refetchWeekData();

      // Show success toast message
      showToastMessage(
        formatClockInMessage(
          userInfo?.userName || '',
          dayjs(endTime).tz(getBrowserTimezone()).format('h:mm A'),
          intl,
        ),
      );

      sandbox.logger.info(
        '[Break Flow] - TimeClockHOC - Break ended successfully',
        { formValues, endTime },
      );

      endInteractionWithSuccess(sandbox, TimeCustomerInteraction.BREAK_END);

      return true;
    } catch (error: unknown) {
      handleBreakEndTimeError({
        error,
        intl,
        sandbox,
        setShowSaveError,
      });

      return false;
    }
  };

  const handleEndBreak = async () => {
    track(clockInTrackingPoints.END_BREAK);

    sandbox.logger.info(
      '[Break Flow] - TimeClockHOC - End break button clicked',
      {
        selectedBreakData,
      },
    );

    createCustomerInteraction(sandbox, TimeCustomerInteraction.BREAK_END);

    // Check if early break ending is allowed - only prevent for auto-end breaks that don't allow early end
    if (selectedBreakData && activeTimeEntry?.startTime) {
      const { manualRule } = selectedBreakData;

      // Only prevent early ending for auto-end breaks that explicitly don't allow early end
      if (
        (manualRule?.autoEndBreak && !manualRule?.allowEarlyEndBreak) ||
        !manualRule?.allowEarlyEndBreak
      ) {
        const breakTimeInfo = getBreakTimeInfo(
          selectedBreakData,
          activeTimeEntry.startTime,
        );

        if (breakTimeInfo && !breakTimeInfo.isComplete) {
          // Show error message - cannot end break early
          setShowSaveError('timeclock.error.cantEndBreakEarly.body');
          // Set flag to show required text in BreakTimerComponent
          setShowRequiredText(true);
          sandbox.logger.info(
            '[Break Flow] - TimeClockHOC - Cannot end break early',
            {
              elapsedSeconds: breakTimeInfo.elapsedSeconds,
              requiredSeconds: breakTimeInfo.breakDurationSeconds,
              allowEarlyEndBreak: manualRule?.allowEarlyEndBreak,
              isAutoEndBreak: manualRule?.autoEndBreak,
            },
          );
          return;
        }
      }
    }

    // Clear any previous errors
    setShowSaveError('');
    // Clear the required text flag when proceeding with end break
    setShowRequiredText(false);

    // Set form values with active time entry data using mapper
    if (activeTimeEntry) {
      mapActiveTimeEntryForBreakEnd(activeTimeEntry, timeClockFormMethods);
    }

    // Call the update API
    await callEndBreakUpdateAPI();
  };

  const handleCancelClose = () => {
    setShowConfirmation(false);
  };

  const handleConfirmSave = () => {
    handleSave();
    handleCancelClose();
  };

  const handleOverwriteNotesChanges = () => {
    // Update notes with service description
    timeClockFormMethods.setValue('notes', serviceDescriptionRef.current);
    oldServiceDescriptionRef.current = serviceDescriptionRef.current;
    notesAutoPopulatedRef.current = true;
    setNotesOverwriteModalOpen(false);
  };

  const handleClockIn = async () => {
    const onSubmit = async (formValues: TimeClockFormState) => {
      if (checkIfStartTimeIsInFuture(timeClockFormMethods, sandbox, intl)) {
        return;
      }

      track(clockInTrackingPoints.CLOCK_IN);

      sandbox.logger.info(
        '[ClockIn Flow] - TimeClockHOC - ClockIn Button clicked',
        {
          formValues,
        },
      );
      createCustomerInteraction(sandbox, TimeCustomerInteraction.CLOCK_IN);

      try {
        setIsClockInLoading(true);
        await createTimeEntryAndUpdateState(
          formValues,
          TimeCustomerInteraction.CLOCK_IN,
        );

        // Show toast message
        showToastMessage(
          formatClockInMessage(
            userInfo?.userName || '',
            formValues.startTime?.format('h:mm A') || '',
            intl,
          ),
        );
        setTourPopover(true);

        sandbox.logger.info(
          '[ClockIn Flow] - TimeClockHOC - Clocked in successfully',
          { formValues },
        );
        endInteractionWithSuccess(sandbox, TimeCustomerInteraction.CLOCK_IN);
      } catch (error: unknown) {
        handleClockInError({
          error,
          formValues,
          sandbox,
          setShowSaveError,
        });
      } finally {
        setTourContext('clock-out');
        setIsClockInLoading(false);
      }
    };

    timeClockFormMethods.handleSubmit(onSubmit)();
  };

  const handleSave = async () => {
    const onSubmit = async (formValues: TimeClockFormState) => {
      track(clockInTrackingPoints.SAVE);
      sandbox.logger.info(
        '[ClockOut Flow] - TimeClockHOC - Save Button clicked',
      );
      createCustomerInteraction(sandbox, TimeCustomerInteraction.CLOCK_IN_SAVE);
      try {
        setIsClockInLoading(true);
        const result = await callUpdateTimeEntry(
          formValues,
          undefined,
          TimeCustomerInteraction.CLOCK_IN_SAVE,
        );

        if (result?.data?.timeTrackingUpdateTimeEntry) {
          showToastMessage(formatSaveMessage(intl), () => {
            if (showConfirmation) {
              setOpen(false);
            }
          });
          sandbox.logger.info(
            '[ClockOut Flow] - TimeClockHOC - Saved time entry',
            { result },
          );
          endInteractionWithSuccess(
            sandbox,
            TimeCustomerInteraction.CLOCK_IN_SAVE,
          );
          setShowSaveError('');

          // Update activeTimeEntry with the saved data from API response
          if (
            result.data.timeTrackingUpdateTimeEntry.__typename ===
              'TimeTracking_UpdateTimeEntryPayload' &&
            result.data.timeTrackingUpdateTimeEntry.timeEntries?.[0]
          ) {
            const updatedTimeEntry = result.data.timeTrackingUpdateTimeEntry
              .timeEntries[0] as TimeTracking_TimeEntry;
            setActiveTimeEntry(updatedTimeEntry);
            sandbox.logger.info(
              '[ClockOut Flow] - TimeClockHOC - Updated activeTimeEntry with saved data',
              { updatedTimeEntry },
            );
          }

          // Reset form to clear dirty state after successful save
          timeClockFormMethods.reset(formValues);
        }
      } catch (error: unknown) {
        handleClockOutSaveError({
          error,
          formValues,
          sandbox,
          showConfirmation,
          handleCancelClose,
          setShowConfirmation,
          setShowSaveError,
        });
      } finally {
        setIsClockInLoading(false);
      }
    };

    timeClockFormMethods.handleSubmit(onSubmit)();
  };

  const executeClockOut = async () => {
    const onSubmit = async (formValues: TimeClockFormState) => {
      track(clockInTrackingPoints.CLOCK_OUT);
      sandbox.logger.info(
        '[ClockOut Flow] - TimeClockHOC - ClockOut Button clicked',
        {
          formValues,
        },
      );
      createCustomerInteraction(sandbox, TimeCustomerInteraction.CLOCK_OUT);
      try {
        setIsClockInLoading(true);
        const endTime = getFormattedCurrentTime(getBrowserTimezone());

        await callUpdateTimeEntry(
          formValues,
          endTime,
          TimeCustomerInteraction.CLOCK_OUT,
        );

        showToastMessage(
          formatClockOutMessage(
            userInfo?.userName || '',
            dayjs(endTime).tz(getBrowserTimezone()).format('h:mm A'),
            intl,
          ),
          () => {
            setOpen(false);
            sandbox.pubsub.publish(TIME_CLOCK_EVENTS.CLOSE, isActiveTimeEntry);
          },
        );
        sandbox.logger.info(
          '[ClockOut Flow] - TimeClockHOC - Clocked out successfully',
          { formValues },
        );
        endInteractionWithSuccess(sandbox, TimeCustomerInteraction.CLOCK_OUT);
        setShowSaveError('');
      } catch (error: unknown) {
        handleClockOutError({
          error,
          formValues,
          sandbox,
          setShowSaveError,
        });
      } finally {
        setIsClockInLoading(false);
      }
    };

    timeClockFormMethods.handleSubmit(onSubmit)();
  };

  const handleClockOut = async () => {
    await executeClockOut();
  };

  const handleJobSwitchCompletion = async (
    formValues: any,
    effectiveId: string,
  ) => {
    const endTime = getFormattedCurrentTime(getBrowserTimezone());

    await callUpdateTimeEntry(
      formValues,
      endTime,
      TimeCustomerInteraction.CLOCK_OUT_SWITCH_JOB,
    );

    sandbox.logger.info(
      '[Switch Jobs Flow] - TimeClockHOC - Switched jobs successfully',
      { formValues },
    );
    endInteractionWithSuccess(
      sandbox,
      TimeCustomerInteraction.CLOCK_OUT_SWITCH_JOB,
    );
    setOldFormValues(null);
    sandbox.logger.info(
      '[Switch Jobs Flow] - TimeClockHOC - Employee read successfully',
      { effectiveId },
    );
    refetchTodayData();
    refetchWeekData();
    sandbox.logger.info(
      '[Switch Jobs Flow] - TimeClockHOC - Refetched today and week data',
      { todayData, weekData },
    );
  };

  const handleSwitchJobs = async () => {
    const onSubmit = async (formValues: TimeClockFormState) => {
      track(clockInTrackingPoints.SWITCH_JOB);
      sandbox.logger.info(
        '[Switch Jobs Flow] - TimeClockHOC - Switch jobs button clicked',
        {
          formValues,
        },
      );
      createCustomerInteraction(
        sandbox,
        TimeCustomerInteraction.CLOCK_OUT_SWITCH_JOB,
      );
      if (isSwitchJobClicked) {
        setIsSwitchJobClicked(false);
      }
      setTimeout(() => {
        setIsSwitchJobClicked(true);
      }, 100);
      // we are doing this to clockout with old job data
      setOldFormValues(formValues);
    };

    timeClockFormMethods.handleSubmit(onSubmit)();
  };

  const handleNewJobSelected = async (newJobData: any) => {
    track(clockInTrackingPoints.SWITCH_JOB_DROPDOWN);
    const formValues = timeClockFormMethods.getValues();
    sandbox.logger.info(
      '[New Job Selected Flow] - TimeClockHOC - Selected new job',
      { formValues },
    );
    createCustomerInteraction(
      sandbox,
      TimeCustomerInteraction.CLOCK_OUT_SWITCH_JOB,
    );
    try {
      setIsClockInLoading(true);

      // First complete the current job switch by clocking out current job
      await handleJobSwitchCompletion(oldFormValues, getEffectiveTimeFor().id);

      // Then create new time entry
      formValues.startTime = dayjs().tz(getBrowserTimezone());
      formValues.customFields = formValues?.customFields
        ? Object.fromEntries(
            Object.entries(formValues.customFields).map(
              ([key, field]: [string, any]) => [
                key,
                {
                  ...field,
                  name: field.name.trim(),
                  value: '',
                },
              ],
            ),
          )
        : {};

      await createTimeEntryAndUpdateState(
        formValues,
        TimeCustomerInteraction.CLOCK_OUT_SWITCH_JOB,
      );

      const timeAgainst =
        formValues.timeAgainst?.customer?.name ||
        formValues.timeAgainst?.project?.name ||
        '';

      handleResetForm(formValues);
      showToastMessage(formatJobSwitchMessage(timeAgainst, intl));
      sandbox.logger.info(
        '[New Job Selected Flow] - TimeClockHOC - Selected new job successfully',
        { formValues },
      );
      endInteractionWithSuccess(
        sandbox,
        TimeCustomerInteraction.CLOCK_OUT_SWITCH_JOB,
      );
      setShowSaveError('');
      setIsSwitchJobClicked(false);
      setOldFormValues(null);
      serviceItemPriceRef.current = 0;
      quickFillFieldLabels.current.location = undefined;
    } catch (error: unknown) {
      // Reset form with active time entry values on error
      if (activeTimeEntry) {
        const currentCustomFields =
          timeClockFormMethods.getValues().customFields || {};
        const mappedFormValues = mapTimeEntryToFormValues(
          activeTimeEntry,
          settingsData?.timezone,
          Object.values(currentCustomFields),
          quickFillFieldLabels.current.location,
        );
        timeClockFormMethods.reset(mappedFormValues);
      }

      handleSwitchJobError({
        error,
        formValues,
        sandbox,
        intl,
        timeClockFormMethods,
        setShowSaveError,
      });
    } finally {
      setIsClockInLoading(false);
    }
  };

  const handleResetForm = (formValues: any) => {
    setOldFormValues(null);
    const defaultState = {
      ...DEFAULT_TIME_CLOCK_FORM_STATE,
      timeAgainst: {
        customer: formValues?.timeAgainst?.customer
          ? { id: formValues.timeAgainst?.customer?.id }
          : undefined,
        project: formValues?.timeAgainst?.customer
          ? { id: formValues.timeAgainst?.customer?.id }
          : undefined,
      },
      timezone: '',
      service: { id: '', name: '' },
      class: { id: '', name: '' },
      location: { id: '', name: '' },
      notes: '',
      billable: false,
      billRate: null,
      customFields: formValues?.customFields || [],
    };
    timeClockFormMethods.reset(defaultState);
  };

  // Wait for initial data to load before determining which component to show
  const isInitialDataLoaded =
    !timeEntriesLoading && !isLoading && isFullyLoaded;

  const showClockOut =
    (activeTimeEntry?.isOpen &&
      !activeTimeEntry?.timeBreakId &&
      !showBreakWidget &&
      activeTimeEntry?.startTime) ||
    isSwitchJobClicked;
  const showBreakSelector = showBreakWidget;
  const showBreakTimer =
    activeTimeEntry?.timeBreakId && activeTimeEntry?.isOpen;
  const showClockin =
    isInitialDataLoaded && !activeTimeEntry?.startTime && !isSwitchJobClicked;
  const handleTourReset = async () => {
    try {
      isTourPreferenceResetRequestInProgress.current = true;
      setPreference(UxPreferenceKey.TIME_CLOCK_TOUR_COMPLETED, false);
    } catch (error) {
      sandbox.logger.error('Failed to reset tour preferences:', {
        error: String(error),
      });
    } finally {
      isTourPreferenceResetRequestInProgress.current = false;
      setTourPopover(true);
    }
  };

  if (
    open &&
    (timeEntriesError ||
      todayError ||
      weekError ||
      settingsError ||
      v3PreferencesError ||
      employerSettingsError)
  ) {
    sandbox.logger.logException(
      '[CLOCK_IN_FLOW] - TimeClockHOC - Error fetching data',
      new Error(
        JSON.stringify({
          timeEntriesError,
          todayError,
          weekError,
          settingsError,
          v3PreferencesError,
          employerSettingsError,
        }),
      ),
    );
    return <TimeClockError onClose={handleClose} />;
  }

  const renderFooterPrimaryAction = () => {
    if (showBreakSelector) {
      return (
        <Button
          purpose="standard"
          onClick={handleBreakButtonClick}
          disabled={isLoading || !selectedBreakData}
          data-test-id="time-clock-take-break-clockout-button"
        >
          <CoffeeMug />
          {intl.formatMessage({ id: 'timeclock.takeBreak' })}
        </Button>
      );
    }

    if (showBreakTimer) {
      return (
        <Button
          purpose="standard"
          onClick={handleEndBreak}
          disabled={isLoading || isClockInLoading}
        >
          <StopWatch />
          {intl.formatMessage({ id: 'timeclock.endBreak' })}
        </Button>
      );
    }

    if (showClockOut) {
      return (
        <ButtonContainer>
          {isPostR2ReleaseTimeExperienceEnabled &&
            breaksByAssigneeData?.payrollEmployerBreaksByAssigneeId?.nodes &&
            breaksByAssigneeData.payrollEmployerBreaksByAssigneeId.nodes
              .length > 0 && (
              <Button
                purpose="standard"
                onClick={handleTakeBreak}
                disabled={isLoading || isClockInLoading}
                priority="secondary"
                data-test-id="time-clock-take-break-button"
              >
                <CoffeeMug />
                {intl.formatMessage({ id: 'timeclock.takeBreak' })}
              </Button>
            )}
          <Button
            purpose="destructive"
            onClick={handleClockOut}
            disabled={isLoading || isClockInLoading}
            data-test-id="time-clock-out-button"
          >
            <StopWatch />
            {intl.formatMessage({ id: 'timeclock.clockOut' })}
          </Button>
        </ButtonContainer>
      );
    }

    if (showClockin) {
      return (
        <ClockInFooterButton
          timezone={settingsData.timezone}
          disabled={isLoading || isClockInLoading}
          onClick={handleClockIn}
        />
      );
    }

    return null;
  };

  const renderFooterSecondaryAction = () => {
    if (showClockOut && !activeTimeEntry?.timeBreakId && !showBreakWidget) {
      return (
        <Button
          purpose="standard"
          onClick={handleSave}
          disabled={isLoading || isClockInLoading}
          priority="tertiary"
          data-test-id="time-clock-save-button"
          aria-label="timeclock-save-button"
        >
          {intl.formatMessage({ id: 'timeclock.save' })}
        </Button>
      );
    }
    return null;
  };

  const renderHeaderButton = () => {
    if (showBreakWidget) {
      return (
        <HeaderBackButton>
          <Medium>
            <ChevronLeftIconControl
              size="small"
              label={intl.formatMessage(
                { id: 'timeclock.back' },
                { defaultValue: 'Back' },
              )}
              aria-label={intl.formatMessage(
                { id: 'timeclock.back' },
                { defaultValue: 'Back' },
              )}
              onClick={handleBreakWidgetClose}
            />
          </Medium>
        </HeaderBackButton>
      );
    }
    if (
      isTimeClockTourEnabled &&
      tourContext === 'clock-out' &&
      !showBreakTimer
    ) {
      return (
        <IconControl
          size="medium"
          onClick={handleTourReset}
          aria-label="time-clock-tour-reset"
        >
          <MapSigns />
        </IconControl>
      );
    }
    return undefined;
  };

  return (
    <>
      <FormProvider {...timeClockFormMethods}>
        <SubmitTimeDatesProvider>
          <Drawer
            backdrop
            open={open}
            size="medium"
            onClose={handleClose}
            data-test-id="time-clock-drawer"
          >
            <StyledDrawerHeader data-test-id="time-clock-header">
              <span>{renderHeaderButton()}</span>
              <B2 as="h2" data-testid="time-clock-header-title">
                <Demi>
                  {intl.formatMessage({
                    id: 'timeclock.header',
                  })}
                </Demi>
              </B2>
              <CloseIconControl
                onClick={handleClose}
                size="medium"
                data-test-id="close-button"
              />
            </StyledDrawerHeader>
            <StyledDrawerContent data-test-id="time-clock-content">
              <OverlayContainer data-test-id="time-clock-container">
                {showSaveError.length > 0 && (
                  <PageMessage
                    type="error"
                    onClose={() => {
                      setShowSaveError('');
                      setShowRequiredText(false);
                    }}
                    open={showSaveError.length > 0}
                    automationId="ClockOutSaveErrorPageMessage"
                    title={intl.formatMessage({
                      id:
                        showSaveError ===
                        'timeclock.error.cantEndBreakEarly.body'
                          ? 'timeclock.error.cantEndBreakEarly.title'
                          : 'timeclock.error.save.recent.changes.title',
                    })}
                    dismissible
                    style={{ textAlign: 'left', marginBottom: '16px' }}
                  >
                    {intl.formatMessage({ id: showSaveError })}
                  </PageMessage>
                )}
                {showBreakSelector && (
                  <CustomBreakSelector
                    name="breakId"
                    employeeId={employeeId || ''}
                    onBreakSelected={handleBreakSelected}
                  />
                )}
                {showBreakTimer && (
                  <BreakTimerComponent
                    userName={userInfo?.userName || ''}
                    breakStartTime={activeTimeEntry?.startTime || ''}
                    isRunning
                    todayDuration={todayDuration}
                    weekDuration={weekDuration}
                    breakRule={selectedBreakData || undefined}
                    showRequiredText={showRequiredText}
                    data-test-id="break-timer-component"
                  />
                )}

                {showClockOut && (
                  <ClockOut
                    onSwitchJobs={handleSwitchJobs}
                    onNewJobSelected={handleNewJobSelected}
                    labelPreference={labelPreference}
                    settings={settingsData}
                    hasProjects={hasProjects}
                    serviceItemPriceRef={serviceItemPriceRef}
                    serviceDescriptionRef={serviceDescriptionRef}
                    serviceTaxableRef={serviceTaxableRef}
                    startTime={activeTimeEntry?.startTime || ''}
                    todayDuration={todayDuration}
                    weekDuration={weekDuration}
                    showErrorToast={showErrorToast}
                    errorToastMessage={errorToastMessage}
                    onCloseErrorToast={() => setShowErrorToast(false)}
                    setIsSwitchJobClicked={setIsSwitchJobClicked}
                    isSwitchJobClicked={isSwitchJobClicked}
                    shouldOpenDropdown={isSwitchJobClicked}
                    isBillingFieldEnabled={
                      employerSettings?.requireBillable?.value ?? false
                    }
                    updateLabel={updateLabel}
                    isDrawerOpen={open}
                    data-test-id="time-clock-out-form"
                  />
                )}
                {showClockin && (
                  <ClockIn
                    labelPreference={labelPreference}
                    isBillingFieldEnabled={
                      employerSettings?.requireBillable?.value ?? false
                    }
                    formValues={timeClockFormMethods.getValues()}
                    hasProjects={hasProjects}
                    todayDuration={todayDuration}
                    weekDuration={weekDuration}
                    settings={settingsData}
                    data-test-id="time-clock-in-form"
                  />
                )}
                <BlurOverlay
                  isLoading={
                    isLoading ||
                    createTimeEntryLoading ||
                    updateTimeEntryLoading ||
                    timeEntriesLoading ||
                    isClockInLoading
                  }
                  data-test-id="time-clock-loading-overlay"
                >
                  <Activity shape="dots" size="large" />
                </BlurOverlay>
              </OverlayContainer>
            </StyledDrawerContent>
            <StyledDrawerFooter
              color={DRAWER_FOOTER_COLOR}
              footerPrimaryAction={renderFooterPrimaryAction()}
              footerSecondaryAction={renderFooterSecondaryAction()}
              data-test-id="time-clock-footer"
            />
          </Drawer>
        </SubmitTimeDatesProvider>
      </FormProvider>

      <ConfirmationModal
        size="small"
        actionAlignment="center"
        contentAlignment="center"
        headerAlignment="center"
        open={showConfirmation}
        setOpen={setShowConfirmation}
        title={intl.formatMessage({
          id: 'timeclock.close.confirmation.header',
        })}
        onYesClick={handleConfirmSave}
        onNoClick={handleConfirmClose}
        dismissible
        showSectionDivider={false}
        yesButtonLabel={intl.formatMessage({
          id: 'timeclock.close.confirmation.primary.label',
        })}
        noButtonLabel={intl.formatMessage({
          id: 'timeclock.close.confirmation.secondary.label',
        })}
      >
        <StyledModalContent>
          <StyledDescriptionConfirmationMessage>
            {intl.formatMessage({
              id: 'timeclock.close.confirmation.description',
            })}
          </StyledDescriptionConfirmationMessage>
        </StyledModalContent>
      </ConfirmationModal>

      <ConfirmationModal
        open={notesOverwriteModalOpen}
        setOpen={setNotesOverwriteModalOpen}
        onYesClick={handleOverwriteNotesChanges}
        title={intl.formatMessage({
          id: 'notes.description.changes.content',
        })}
      />

      {showToast && (
        <SuccessToast
          message={toastMessage}
          open={showToast}
          onClose={() => setShowToast(false)}
          data-test-id="time-clock-success-toast"
        />
      )}
      {showClockOut && (
        <TimeClockPopoverTourAdapter
          open={
            tourPopover &&
            shouldShowTour &&
            (open || tourContext === 'drawer-closed') &&
            !isLoading &&
            preferencesLoaded
          }
          onClose={() => setTourPopover(false)}
          onFinish={() => {
            // close popover called before resetTour is called, but we should not call set preference here if resetTour is called.
            setTimeout(() => {
              if (!isTourPreferenceResetRequestInProgress.current) {
                setPreference(UxPreferenceKey.TIME_CLOCK_TOUR_COMPLETED, true);
              }
            }, 0);
          }}
          targetElement={popoverButtonRef.current}
          stepTargetElement={popoverButtonRef.current}
          isClockedIn={isActiveTimeEntry}
          tourContext={tourContext}
        />
      )}
    </>
  );
};

export default TimeClockHOC;

import { useCallback, useEffect, useState } from 'react'; // @ts-ignore
import UxPersistentStore from '@app-data/ux-preferences-lib';
import { useAppContext, useIntl, useSandbox } from '@payroll/quicksand';
import { Environment } from '@appfabric/sandbox-spec';
import { mapError } from 'src/js/service/utils/mapError';
import {
  TimeForFormState,
  TimeForType,
} from '../../widgets/common/addTimeFormComponents/TeamMember';

export const TIME_ENTRY_SPLIT_CTA_OPTIONS = {
  SAVE_AND_CLOSE: {
    key: 'saveAndClose',
    labelKey: 'save.and.close',
    value: 'saveAndClose',
  },
  SAVE_AND_NEW: {
    key: 'saveAndNew',
    labelKey: 'save.and.new',
    value: 'saveAndNew',
  },
  SAVE_AND_COPY: {
    key: 'saveAndCopy',
    labelKey: 'save.and.copy',
    value: 'saveAndCopy',
  },
};

export enum UxPreferenceKey {
  HIDE_MODAL_UX_PREFERENCE = 'hide-timetracking-tsheets-modal',
  HIDE_WEEKDAYS_UX_PREFERENCE = 'hide-weekdays-timesheet',
  HIDE_TIME_ENTRY_FIELDS = 'hide-time-entry-fields',
  TIME_ENTRY_TIME_FOR = 'time-entry-time-for',
  TIME_ENTRY_LAST_USED_START_END_TIME = 'time-entry-last-used-start-end-time',
  TIME_ENTRY_SELECTED_SPLIT_CTA = 'time-entry-selected-split-cta',
  TIME_ENTRY_NEW_BADGE_VISIBLE = 'time-entry-new-badge-visible',
  TIME_CLOCK_TOUR_COMPLETED = 'time-clock-tour-completed',
  BREAKS_TOUR_COMPLETED = 'breaks-tour-completed',
  CUSTOM_FIELDS_TOUR_COMPLETED = 'custom-fields-tour-completed',
  WEEKLY_TIMESHEET_TOUR_COMPLETED = 'weekly-timesheet-tour-completed',
  TIME_SHEET_GEN_AI_COLUMN_MAPPING = 'timesheet-gen-ai-column-mapping',
  TIME_SHEET_GEN_AI_EMPLOYEE_MAPPING = 'timesheet-gen-ai-employee-mapping',
  TIME_SHEET_GEN_AI_IMPOSE_8_HOUR_LIMIT = 'timesheet-gen-ai-impose-8-hour-limit',
  TIME_SHEET_GEN_AI_PREFERENCES_SEEN = 'timesheet-gen-ai-preferences-seen',
  TIME_SHEET_GEN_AI_SKIP_FIELD_MAPPING = 'timesheet-gen-ai-skip-field-mapping',
  SINGLE_TIME_ACTIVITY_TOUR_COMPLETED = 'single-time-activity-tour-completed',
  WEEKLY_TIMESHEET_PAGE_TOUR_COMPLETED = 'weekly-timesheet-page-tour-completed',
  WEEKLY_REDIRECT_SHOWN = 'timeagent.weeklyRedirect.shown',
}

export const getIsWeekdayHidden = (
  day: number, // dayjs: 0 (Sunday) to 6 (Saturday).
  hideWeekdaysData: UxPreferenceHideWeekdaysData,
): boolean => {
  switch (day) {
    case 0:
      return hideWeekdaysData.isSundayHidden;
    case 1:
      return hideWeekdaysData.isMondayHidden;
    case 2:
      return hideWeekdaysData.isTuesdayHidden;
    case 3:
      return hideWeekdaysData.isWednesdayHidden;
    case 4:
      return hideWeekdaysData.isThursdayHidden;
    case 5:
      return hideWeekdaysData.isFridayHidden;
    case 6:
      return hideWeekdaysData.isSaturdayHidden;
    default:
      return false;
  }
};

const DEFAULT_TIME_ENTRY_TIME_FOR: TimeForFormState = {
  id: '',
  name: '',
  type: TimeForType.EMPLOYEE,
};

const TIME_FOR_DEFAULT_EMPLOYEE: TimeForFormState = {
  id: '1',
  name: 'TimeTracking Only',
  type: TimeForType.EMPLOYEE,
};

const TIME_FOR_DEFAULT_VENDOR: TimeForFormState = {
  id: '1',
  name: 'First Worker',
  type: TimeForType.VENDOR,
};

const MAX_RETRIES = 2; // 2 retries = 3 total attempts (1 initial + 2 retries)
const MAX_DELAY_IN_MS = 200; // making max retry delay in ms as 800ms

const checkIsTimeForDefault = (
  timeFor: Partial<TimeForFormState> = {},
  defaultToCheck: Partial<TimeForFormState> = {},
): boolean =>
  timeFor.id === defaultToCheck.id &&
  timeFor.name === defaultToCheck.name &&
  timeFor.type === defaultToCheck.type;

export interface UxPreferenceHideTimeEntryFieldsData {
  isClassFieldEnabled: boolean;
  isProjectFieldEnabled: boolean;
  isLocationFieldEnabled: boolean;
  isPayTypeFieldEnabled: boolean;
  isCostRateFieldEnabled: boolean;
  isTaxableFieldEnabled: boolean;
}

export interface UxPreferenceHideWeekdaysData {
  isSundayHidden: boolean;
  isMondayHidden: boolean;
  isTuesdayHidden: boolean;
  isWednesdayHidden: boolean;
  isThursdayHidden: boolean;
  isFridayHidden: boolean;
  isSaturdayHidden: boolean;
}

export interface UxPreferenceNewBadgeVisibility {
  timeTrackingVisibilityEndDate: string;
  notificationVisibilityEndDate: string;
  breaksVisibilityEndDate: string;
  overtimeVisibilityEndDate: string;
  geoLocationsVisibilityEndDate: string;
  approvalsVisibilityEndDate: string;
  geofenceVisibilityEndDate: string;
  // Utilized for companies that have new experience for assignments enabled
  newTimesheetVisibilityEndDate: string;
  newCustomFieldsVisibilityEndDate: string;
  schedulesVisibilityEndDate: string;
}

export interface UxPreferenceData {
  [UxPreferenceKey.HIDE_MODAL_UX_PREFERENCE]: boolean;
  [UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE]: UxPreferenceHideWeekdaysData;
  [UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS]: UxPreferenceHideTimeEntryFieldsData;
  [UxPreferenceKey.TIME_ENTRY_TIME_FOR]: TimeForFormState;
  [UxPreferenceKey.TIME_ENTRY_LAST_USED_START_END_TIME]: boolean;
  [UxPreferenceKey.TIME_ENTRY_SELECTED_SPLIT_CTA]: string;
  [UxPreferenceKey.TIME_ENTRY_NEW_BADGE_VISIBLE]: UxPreferenceNewBadgeVisibility;
  [UxPreferenceKey.TIME_CLOCK_TOUR_COMPLETED]: boolean;
  [UxPreferenceKey.BREAKS_TOUR_COMPLETED]: boolean;
  [UxPreferenceKey.CUSTOM_FIELDS_TOUR_COMPLETED]: boolean;
  [UxPreferenceKey.WEEKLY_TIMESHEET_TOUR_COMPLETED]: boolean;
  [UxPreferenceKey.TIME_SHEET_GEN_AI_COLUMN_MAPPING]: string;
  [UxPreferenceKey.TIME_SHEET_GEN_AI_EMPLOYEE_MAPPING]: string;
  [UxPreferenceKey.TIME_SHEET_GEN_AI_IMPOSE_8_HOUR_LIMIT]: boolean;
  [UxPreferenceKey.TIME_SHEET_GEN_AI_PREFERENCES_SEEN]: string;
  [UxPreferenceKey.TIME_SHEET_GEN_AI_SKIP_FIELD_MAPPING]: string;
  [UxPreferenceKey.SINGLE_TIME_ACTIVITY_TOUR_COMPLETED]: boolean;
  [UxPreferenceKey.WEEKLY_TIMESHEET_PAGE_TOUR_COMPLETED]: boolean;
  [UxPreferenceKey.WEEKLY_REDIRECT_SHOWN]: boolean;
}

type UxPreferencesRequest = Partial<{ [key in UxPreferenceKey]: any }>;

interface UseUxPreferencesState {
  loading: boolean;
  error?: string;
  data: UxPreferenceData;
  loadPreferences: (keys: UxPreferenceKey[]) => Promise<void>;
  getPreference: (key: UxPreferenceKey) => Promise<void>;
  setPreference: (key: UxPreferenceKey, value: any) => Promise<void>;
  setPreferences: (preferences: UxPreferencesRequest) => Promise<void>;
  initialized?: boolean;
}

export const DEFAULT_UX_PREFERENCE_DATA_STATE: UxPreferenceData = {
  [UxPreferenceKey.HIDE_MODAL_UX_PREFERENCE]: false,
  [UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE]: {
    isSundayHidden: false,
    isMondayHidden: false,
    isTuesdayHidden: false,
    isWednesdayHidden: false,
    isThursdayHidden: false,
    isFridayHidden: false,
    isSaturdayHidden: false,
  },
  [UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS]: {
    isClassFieldEnabled: true,
    isProjectFieldEnabled: true,
    isLocationFieldEnabled: true,
    isPayTypeFieldEnabled: true,
    isCostRateFieldEnabled: true,
    isTaxableFieldEnabled: true,
  },
  [UxPreferenceKey.TIME_ENTRY_TIME_FOR]: DEFAULT_TIME_ENTRY_TIME_FOR,
  [UxPreferenceKey.TIME_ENTRY_LAST_USED_START_END_TIME]: false,
  [UxPreferenceKey.TIME_ENTRY_SELECTED_SPLIT_CTA]:
    TIME_ENTRY_SPLIT_CTA_OPTIONS.SAVE_AND_NEW.key,
  [UxPreferenceKey.TIME_ENTRY_NEW_BADGE_VISIBLE]: {
    timeTrackingVisibilityEndDate: '',
    notificationVisibilityEndDate: '',
    breaksVisibilityEndDate: '',
    overtimeVisibilityEndDate: '',
    geoLocationsVisibilityEndDate: '',
    approvalsVisibilityEndDate: '',
    geofenceVisibilityEndDate: '',
    newTimesheetVisibilityEndDate: '',
    newCustomFieldsVisibilityEndDate: '',
    schedulesVisibilityEndDate: '',
  },
  [UxPreferenceKey.TIME_CLOCK_TOUR_COMPLETED]: false,
  [UxPreferenceKey.BREAKS_TOUR_COMPLETED]: false,
  [UxPreferenceKey.CUSTOM_FIELDS_TOUR_COMPLETED]: false,
  [UxPreferenceKey.WEEKLY_TIMESHEET_TOUR_COMPLETED]: false,
  [UxPreferenceKey.TIME_SHEET_GEN_AI_COLUMN_MAPPING]: '',
  [UxPreferenceKey.TIME_SHEET_GEN_AI_EMPLOYEE_MAPPING]: '',
  [UxPreferenceKey.TIME_SHEET_GEN_AI_IMPOSE_8_HOUR_LIMIT]: false,
  [UxPreferenceKey.TIME_SHEET_GEN_AI_PREFERENCES_SEEN]: '',
  [UxPreferenceKey.TIME_SHEET_GEN_AI_SKIP_FIELD_MAPPING]: '',
  [UxPreferenceKey.SINGLE_TIME_ACTIVITY_TOUR_COMPLETED]: false,
  [UxPreferenceKey.WEEKLY_TIMESHEET_PAGE_TOUR_COMPLETED]: false,
  [UxPreferenceKey.WEEKLY_REDIRECT_SHOWN]: false,
};

type UxPreferenceContextType = 'USER' | 'USER_REALM' | 'REALM';

export const UX_PREFERENCE_KEY_CONTEXT_MAP: Record<
  UxPreferenceKey,
  UxPreferenceContextType
> = {
  [UxPreferenceKey.HIDE_MODAL_UX_PREFERENCE]: 'USER',
  [UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE]: 'USER',
  [UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS]: 'USER',
  [UxPreferenceKey.TIME_ENTRY_TIME_FOR]: 'USER_REALM',
  [UxPreferenceKey.TIME_ENTRY_LAST_USED_START_END_TIME]: 'USER',
  [UxPreferenceKey.TIME_ENTRY_SELECTED_SPLIT_CTA]: 'USER',
  [UxPreferenceKey.TIME_ENTRY_NEW_BADGE_VISIBLE]: 'USER',
  [UxPreferenceKey.TIME_CLOCK_TOUR_COMPLETED]: 'USER',
  [UxPreferenceKey.BREAKS_TOUR_COMPLETED]: 'USER',
  [UxPreferenceKey.CUSTOM_FIELDS_TOUR_COMPLETED]: 'USER',
  [UxPreferenceKey.WEEKLY_TIMESHEET_TOUR_COMPLETED]: 'USER',
  [UxPreferenceKey.TIME_SHEET_GEN_AI_COLUMN_MAPPING]: 'USER',
  [UxPreferenceKey.TIME_SHEET_GEN_AI_EMPLOYEE_MAPPING]: 'USER',
  [UxPreferenceKey.TIME_SHEET_GEN_AI_IMPOSE_8_HOUR_LIMIT]: 'USER',
  [UxPreferenceKey.TIME_SHEET_GEN_AI_PREFERENCES_SEEN]: 'REALM',
  [UxPreferenceKey.TIME_SHEET_GEN_AI_SKIP_FIELD_MAPPING]: 'REALM',
  [UxPreferenceKey.SINGLE_TIME_ACTIVITY_TOUR_COMPLETED]: 'USER',
  [UxPreferenceKey.WEEKLY_TIMESHEET_PAGE_TOUR_COMPLETED]: 'USER',
  [UxPreferenceKey.WEEKLY_REDIRECT_SHOWN]: 'USER',
};

export const getUxPreferenceContext = (
  key: UxPreferenceKey,
): UxPreferenceContextType => UX_PREFERENCE_KEY_CONTEXT_MAP[key] || 'USER';

interface UseUxPreferencesArgs {
  onSaveSuccess?: () => void;
}

let uxPersistentStore: UxPersistentStore = null;
let initializePromise: Promise<void>;

/**
 * Retry function to execute an operation with exponential backoff
 */
export const withRetry = async <T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = MAX_DELAY_IN_MS,
): Promise<T> => {
  try {
    // execute the operation and return the result if successful
    return await operation();
  } catch (error) {
    // if all retries are exhausted, throw the error
    if (retries > 0) {
      // incase of error, wait for the delay and then retry until all retries are exhausted
      await new Promise((resolve) => setTimeout(resolve, delay));
      return withRetry(operation, retries - 1, delay * 2);
    }
    throw error;
  }
};

export const useUxPreferences = (
  args: UseUxPreferencesArgs = {},
): UseUxPreferencesState => {
  const { onSaveSuccess = () => {} } = args;
  const { realmId, environment } = useAppContext();
  const sandbox = useSandbox();
  const intl = useIntl();
  const env = environment === Environment.PROD ? 'prd' : environment;

  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [data, setData] = useState<UxPreferenceData>(
    DEFAULT_UX_PREFERENCE_DATA_STATE,
  );

  const handleError = useCallback(
    (error: string) => {
      setError(
        mapError({
          sourceComponent: 'useUxPreferences',
          sandbox,
          intl,
          error,
        }),
      );
    },
    [intl, sandbox],
  );

  const initializeUxPreferences = useCallback(async (): Promise<void> => {
    // if the store is not initialized, initialize it
    if (!initializePromise || !uxPersistentStore) {
      initializePromise = (async () => {
        try {
          sandbox.logger.info('Initializing UxPersistentStore');
          await withRetry(async () => {
            const store = new UxPersistentStore(env, realmId);
            await store.initialize();
            uxPersistentStore = store;
            setIsInitialized(true);
          });
          sandbox.logger.info('Initialized UxPersistentStore');
        } catch (err) {
          sandbox.logger.logException(
            'Failed to initialize UxPersistentStore',
            err as Error,
          );
          handleError(err as string);
        }
      })();
    }

    // else use the store that is already initialized
    return initializePromise;
  }, [env, realmId, sandbox.logger, handleError]);

  const loadPreferences = useCallback(
    async (keys: UxPreferenceKey[]) => {
      setLoading(true);

      // Await initialization - promise always resolves even if init fails
      await initializeUxPreferences();

      try {
        // If store failed to initialize, set default values as preferences and throw error
        if (!uxPersistentStore) {
          const defaultResult = keys.reduce<Partial<UxPreferenceData>>(
            (acc, key) => {
              // @ts-ignore - assigning default values to partial type
              acc[key] = DEFAULT_UX_PREFERENCE_DATA_STATE[key];
              return acc;
            },
            {},
          );

          setData((prevData) => ({
            ...prevData,
            ...defaultResult,
          }));

          throw new Error('UxPersistentStore is not initialized');
        }

        // Add retry for safety and to handle temporary network errors
        const promises = keys.map((key) =>
          withRetry(() =>
            uxPersistentStore.getPreference(key, getUxPreferenceContext(key)),
          ),
        );
        const data = await Promise.all(promises);
        const result = keys.reduce((acc, key, index) => {
          // When a new company with no employees comes to QL UI for the first time,
          // UxPersistentStore returns {id: 1, name: "First Worker", type: "vendor"} for timeFor preference.
          // A time-connected account returns {id: 1, name: "TimeTracking Only", type: "employee"} for timeFor preference.
          // This breaks the UI, so we need to set the default value for timeFor preference.
          const isTimeForDefaultVendor = checkIsTimeForDefault(
            data[index] as Partial<TimeForFormState>,
            TIME_FOR_DEFAULT_VENDOR,
          );
          const isTimeForDefaultEmployee = checkIsTimeForDefault(
            data[index] as Partial<TimeForFormState>,
            TIME_FOR_DEFAULT_EMPLOYEE,
          );
          if (
            key === UxPreferenceKey.TIME_ENTRY_TIME_FOR &&
            (isTimeForDefaultEmployee || isTimeForDefaultVendor)
          ) {
            acc[key] = DEFAULT_TIME_ENTRY_TIME_FOR;
          } else if (data[index] != null) {
            // @ts-ignore
            acc[key] = data[index];
          } else {
            sandbox.logger.info(`Null value for preferenceKey=${key}`);
          }
          return acc;
        }, {} as UxPreferenceData);

        setData((prevData) => ({
          ...prevData,
          ...result,
        }));
      } catch (ex) {
        handleError(ex as string);
      } finally {
        setLoading(false);
      }
    },
    [sandbox.logger, initializeUxPreferences, handleError],
  );

  const getPreference = useCallback(
    async (key: UxPreferenceKey) => {
      setLoading(true);

      // Await initialization - promise always resolves even if init fails
      await initializeUxPreferences();

      try {
        // If store failed to initialize, set default and throw error
        if (!uxPersistentStore) {
          setData((prevData) => ({
            ...prevData,
            [key]: DEFAULT_UX_PREFERENCE_DATA_STATE[key],
          }));

          throw new Error('UxPersistentStore is not initialized');
        }

        // Add retry for safety and to handle temporary network errors
        let preference = await withRetry(() =>
          uxPersistentStore.getPreference(key, getUxPreferenceContext(key)),
        );
        const isTimeForDefaultEmployee = checkIsTimeForDefault(
          preference as Partial<TimeForFormState>,
          TIME_FOR_DEFAULT_EMPLOYEE,
        );
        const isTimeForDefaultVendor = checkIsTimeForDefault(
          preference as Partial<TimeForFormState>,
          TIME_FOR_DEFAULT_VENDOR,
        );

        // When a new company with no employees comes to QL UI for the first time,
        // UxPersistentStore returns {id: 1, name: "First Worker", type: "vendor"} for timeFor preference.
        // A time-connected account returns {id: 1, name: "TimeTracking Only", type: "employee"} for timeFor preference.
        // This breaks the UI, so we need to set the default value for timeFor preference.
        if (isTimeForDefaultEmployee || isTimeForDefaultVendor) {
          preference = DEFAULT_TIME_ENTRY_TIME_FOR;
        }

        if (preference != null) {
          setData((prevData) => ({
            ...prevData,
            [key]: preference,
          }));
        } else {
          // this is not an error since it's possible the value was never changed,
          // so will return null from UX Preferences Service
          // log as info for now
          sandbox.logger.info(`Null value for preferenceKey=${key}`);
          // handleError(`Null value for preferenceKey=${key}`);
        }
      } catch (ex) {
        handleError(ex as string);
      } finally {
        setLoading(false);
      }
    },
    [handleError, initializeUxPreferences, sandbox.logger],
  );

  const setPreference = useCallback(
    async (key: UxPreferenceKey, preference: string) => {
      setLoading(true);

      // Await initialization - promise always resolves even if init fails
      await initializeUxPreferences();

      try {
        // If store failed to initialize, throw error
        if (!uxPersistentStore) {
          throw new Error(
            'UxPersistentStore is not initialized, cannot set preference',
          );
        }

        // Add retry for safety and to handle temporary network errors
        await withRetry(() =>
          uxPersistentStore.setPreference(
            key,
            preference,
            getUxPreferenceContext(key),
          ),
        );

        setData((prevData) => ({
          ...prevData,
          [key]: preference,
        }));
        onSaveSuccess();
      } catch (ex) {
        sandbox.logger.error(
          `Event=TIME_TRACKING_UI_SERVICE_ERROR Component=useUxPreferences Error="Failed to set preference"`,
          { key, preference, ex },
        );
        handleError(ex as string);
      } finally {
        setLoading(false);
      }
    },
    [handleError, initializeUxPreferences, onSaveSuccess, sandbox.logger],
  );

  async function setPreferencesSequentially(preferences: UxPreferencesRequest) {
    const keys = Object.keys(preferences) as UxPreferenceKey[];
    const store = uxPersistentStore;
    // eslint-disable-next-line no-restricted-syntax
    for (const key of keys) {
      const value = preferences[key];
      const context = getUxPreferenceContext(key);
      // eslint-disable-next-line no-await-in-loop
      await withRetry(() => store.setPreference(key, value, context));
    }
  }

  const setPreferences = useCallback(
    async (preferences: UxPreferencesRequest) => {
      setLoading(true);

      // Await initialization - promise always resolves even if init fails
      await initializeUxPreferences();

      try {
        // If store failed to initialize, throw error
        if (!uxPersistentStore) {
          throw new Error(
            'UxPersistentStore is not initialized, cannot set preferences',
          );
        }

        await setPreferencesSequentially(preferences);
        setData((prevData) => ({
          ...prevData,
          ...preferences,
        }));
        onSaveSuccess();
      } catch (ex) {
        handleError(ex as string);
      } finally {
        setLoading(false);
      }
    },
    [handleError, initializeUxPreferences, onSaveSuccess],
  );

  useEffect(() => {
    if (!uxPersistentStore) {
      initializeUxPreferences().then(() => {
        setIsInitialized(true);
      });
    } else {
      setIsInitialized(true);
    }
  }, [initializeUxPreferences]);

  return {
    loading,
    error,
    data,
    loadPreferences,
    getPreference,
    setPreference,
    setPreferences,
    initialized: isInitialized,
  };
};

/**
 * For unit testing only
 */
export const clearUXPreferencesStore = () => {
  uxPersistentStore = null;
};

/**
 * For unit testing only
 */
export const getUxPreferencesStore = () => uxPersistentStore;

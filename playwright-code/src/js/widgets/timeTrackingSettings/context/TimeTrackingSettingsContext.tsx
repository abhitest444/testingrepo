import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { useSandbox } from '@payroll/quicksand';
import { QuickbooksOnlineSandbox } from '@appfabric/sandbox-spec';
import styled from 'styled-components';
import { Activity } from '@ids-ts/loader';
import dayjs from 'dayjs';

import {
  MappedQLSettings,
  useGetQLSettings,
} from 'src/js/service/hooks/settings/useGetQLSettings';
import { useGetEntitlements } from 'src/js/service/hooks/entitlements/useGetEntitlements';
import { Identity_EntitlementGrant } from 'src/__generated__/oigql/graphql';
import { Sandbox } from 'src/js/common/sandbox';
import { fetchSettingsAccess } from 'src/js/service/utils/sandboxUtils';
import useGetPreferences from 'src/js/service/hooks/preferenceces/useGetPreferences';
import {
  useUxPreferences,
  UxPreferenceKey,
  UxPreferenceNewBadgeVisibility,
  DEFAULT_UX_PREFERENCE_DATA_STATE,
} from 'src/js/service/utils/useUXPreferences';
import { LOCALS } from 'src/js/common/constants';
import {
  useGetApprovalSettings,
  mappedApprovalSettings,
} from 'src/js/service/hooks/settings/useGetApprovalSettings';
import {
  parseSectionParam,
  ParsedSectionPath,
} from 'src/js/widgets/timeTrackingSettings/sectionNavigation';

interface ITimeTrackingSettingsContext {
  children: React.ReactNode;
  isExported?: boolean;
}

const ActivityContainer = styled.div`
  display: flex;
  justify-content: center;
`;

interface timeTrackingSettingsContextType {
  QLData: MappedQLSettings;
  isQLSettingsLoading: boolean;
  QLSettingsError?: string;
  v3PreferencesData: any;
  v3PreferencesLoading: boolean;
  v3PreferencesError?: boolean;
  refetchQlSettings: () => void;
  entitlements: Identity_EntitlementGrant[];
  entitlementsLoading: boolean;
  sandbox: Sandbox;
  isFormEditable: boolean;
  errorMessage: string;
  isRenderTimeEntry: boolean;
  reRenderTimeEntrySetting: (message: string) => void;
  updateErrorMessage: (message: string) => void;
  timeEntryNewBadgeVisibleFor: UxPreferenceNewBadgeVisibility;
  uxPreferenceLoading: boolean;
  isUKLocale: boolean;
  urlParams: string | null;
  // Approval settings
  approvalSettings?: mappedApprovalSettings;
  approvalSettingsLoading?: boolean;
  approvalSettingsError?: string;
  refetchApprovalSettings?: () => Promise<void>;
  isExported?: boolean;
  // Section navigation for deep-linking
  sectionPath: ParsedSectionPath;
}

const TimeTrackingSettingsContext = createContext<
  timeTrackingSettingsContextType | undefined
>(undefined);

export const TimeTrackingSettingsProvider: React.FC<
  ITimeTrackingSettingsContext
> = ({ children }) => {
  const [isSettingsAccessible, setSettingsAccess] = useState<boolean>(false);
  const [isRenderTimeEntry, setIsRenderTimeEntry] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isUxPreferenceLoaded, setIsUxPreferenceLoaded] = useState(false);
  const [isUpdatingPreferences, setIsUpdatingPreferences] = useState(false);

  const {
    qlSettings: QLData,
    loading: isQLSettingsLoading,
    error: QLSettingsError,
    refetch: refetchQlSettings,
  } = useGetQLSettings();

  const {
    data: v3PreferencesData,
    loading: v3PreferencesLoading,
    error: v3PreferencesError,
  } = useGetPreferences();

  const {
    data: uxPreferenceData,
    loading: uxPreferenceLoading,
    loadPreferences,
    setPreferences,
    initialized,
  } = useUxPreferences();

  const {
    approvalSettings,
    loading: approvalSettingsLoading,
    error: approvalSettingsError,
    refetch: refetchApprovalSettings,
  } = useGetApprovalSettings();
  const { data: entitlements, loading: entitlementsLoading } =
    useGetEntitlements();

  const sandbox = useSandbox();
  const urlParams = useMemo(
    () => new URLSearchParams(window.location.search).get('p'),
    [],
  );

  // Parse section query param for deep-linking navigation (s=level1-level2-level3)
  const sectionPath = useMemo(() => {
    const sectionParam = new URLSearchParams(window.location.search).get('s');
    return parseSectionParam(sectionParam);
  }, []);
  const timeEntryNewBadgeVisibleFor =
    uxPreferenceData[UxPreferenceKey.TIME_ENTRY_NEW_BADGE_VISIBLE];

  const { locale = '' } = sandbox.appContext.getLocalizationInfo();
  const isUKLocale = locale.toLowerCase() === LOCALS.UK;

  const reRenderTimeEntrySetting = useCallback((message: string) => {
    setIsRenderTimeEntry(true);
    setErrorMessage(message);
  }, []);

  const updateErrorMessage = useCallback((message: string) => {
    setErrorMessage(message);
  }, []);

  useEffect(() => {
    fetchSettingsAccess(sandbox as QuickbooksOnlineSandbox).then((result) => {
      setSettingsAccess(result);
    });
  }, [sandbox]);

  useEffect(() => {
    if (isRenderTimeEntry) {
      refetchQlSettings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRenderTimeEntry]);

  useEffect(() => {
    if (isRenderTimeEntry && !isQLSettingsLoading) {
      setIsRenderTimeEntry(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isQLSettingsLoading]);

  useEffect(() => {
    if (!initialized || urlParams !== 'time') return;

    if (!isUxPreferenceLoaded) {
      const fetchUxPreference = async () => {
        try {
          await loadPreferences([UxPreferenceKey.TIME_ENTRY_NEW_BADGE_VISIBLE]);
          setIsUxPreferenceLoaded(true);
        } catch (error) {
          sandbox.logger.error(
            'Event=TIME_TRACKING_UI_SERVICE_ERROR Component=TimeTrackingSettingsContext Error="Failed to load UX preferences"',
            { error },
          );
          setIsUxPreferenceLoaded(true);
        }
      };

      fetchUxPreference();
    }
  }, [
    isUxPreferenceLoaded,
    initialized,
    urlParams,
    sandbox.logger,
    loadPreferences,
  ]);

  useEffect(() => {
    if (
      !initialized ||
      !isUxPreferenceLoaded ||
      uxPreferenceLoading ||
      isUpdatingPreferences ||
      urlParams !== 'time'
    )
      return;

    if (timeEntryNewBadgeVisibleFor) {
      const defaultBadgeVisibility =
        DEFAULT_UX_PREFERENCE_DATA_STATE[
          UxPreferenceKey.TIME_ENTRY_NEW_BADGE_VISIBLE
        ];
      const mergedBadgeVisibility = {
        ...defaultBadgeVisibility,
        ...timeEntryNewBadgeVisibleFor,
      };

      const updatedTimeEntryNewBadgeVisibleFor: UxPreferenceNewBadgeVisibility =
        {} as UxPreferenceNewBadgeVisibility;

      const date = dayjs().add(30, 'day');
      const futureDate = date.format('MM/DD/YYYY');

      Object.keys(mergedBadgeVisibility).forEach((key) => {
        const currentVisibilityEndDate =
          mergedBadgeVisibility[key as keyof UxPreferenceNewBadgeVisibility];

        const shouldResetDate =
          !currentVisibilityEndDate || currentVisibilityEndDate === '';

        if (shouldResetDate) {
          updatedTimeEntryNewBadgeVisibleFor[
            key as keyof UxPreferenceNewBadgeVisibility
          ] = futureDate;
        }
      });

      if (Object.keys(updatedTimeEntryNewBadgeVisibleFor).length > 0) {
        const updatePreferences = async () => {
          setIsUpdatingPreferences(true);
          try {
            await setPreferences({
              [UxPreferenceKey.TIME_ENTRY_NEW_BADGE_VISIBLE]: {
                ...mergedBadgeVisibility,
                ...updatedTimeEntryNewBadgeVisibleFor,
              },
            });
          } catch (error) {
            sandbox.logger.error(
              'Event=TIME_TRACKING_UI_SERVICE_ERROR Component=TimeTrackingSettingsContext Error="Failed to update UX preferences"',
              { error },
            );
          } finally {
            setIsUpdatingPreferences(false);
          }
        };

        updatePreferences();
      }
    }
  }, [
    timeEntryNewBadgeVisibleFor,
    isUxPreferenceLoaded,
    uxPreferenceLoading,
    initialized,
    isUpdatingPreferences,
    sandbox.logger,
    urlParams,
    setPreferences,
  ]);

  const value = {
    QLData,
    isQLSettingsLoading,
    QLSettingsError,
    v3PreferencesData,
    v3PreferencesLoading,
    v3PreferencesError,
    refetchQlSettings,
    entitlements,
    entitlementsLoading,
    sandbox,
    isFormEditable: isSettingsAccessible,
    errorMessage,
    isRenderTimeEntry,
    reRenderTimeEntrySetting,
    updateErrorMessage,
    timeEntryNewBadgeVisibleFor,
    uxPreferenceLoading,
    isUKLocale,
    urlParams,
    // Approval settings
    approvalSettings,
    approvalSettingsLoading,
    approvalSettingsError,
    refetchApprovalSettings,
    // Section navigation for deep-linking
    sectionPath,
  };

  return (
    <TimeTrackingSettingsContext.Provider value={value}>
      {entitlementsLoading ||
      isUpdatingPreferences ||
      (isQLSettingsLoading && !isRenderTimeEntry) ||
      approvalSettingsLoading ||
      (!initialized && !isUxPreferenceLoaded) ? (
        <ActivityContainer>
          <Activity shape="dots" size="large" />
        </ActivityContainer>
      ) : (
        <>{children}</>
      )}
    </TimeTrackingSettingsContext.Provider>
  );
};

export const useTimeTrackingSettingsContext = (isExported: boolean = false) => {
  const context = useContext(TimeTrackingSettingsContext);

  // Call useGetQLSettings with the dynamic isExported value
  const {
    qlSettings: dynamicQLData,
    loading: dynamicIsQLSettingsLoading,
    error: dynamicQLSettingsError,
    refetch: dynamicRefetchQlSettings,
  } = useGetQLSettings({ isExported });

  if (!context) {
    throw new Error(
      'useTimeTrackingSettingsContext must be used within a TimeTrackingSettingsProvider.',
    );
  }

  // Return the dynamic data instead of context data for QL settings
  return {
    ...context,
    QLData: dynamicQLData,
    isQLSettingsLoading: dynamicIsQLSettingsLoading,
    QLSettingsError: dynamicQLSettingsError,
    refetchQlSettings: dynamicRefetchQlSettings,
    isExported,
  };
};

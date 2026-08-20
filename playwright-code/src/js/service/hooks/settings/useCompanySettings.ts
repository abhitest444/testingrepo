import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { useSandbox } from '@payroll/quicksand';
import {
  TimeTrackingSettings,
  useGetSettings,
} from 'src/js/service/hooks/settings/useGetSettings';
import { FEATURE_FLAGS } from 'src/js/common/constants';
import {
  isWorkforceEnvironment,
  useFeatureFlag,
} from '../../utils/sandboxUtils';
import { MappedQLSettings, useGetQLSettings } from './useGetQLSettings';

export interface TimeTrackingCompanySettings {
  isServiceFieldEnabled: boolean;
  isBillingFieldEnabled: boolean;
  firstDayOfWeek: number; // 0 (Sunday) to 6 (Saturday)
  isClassEnabled: boolean;
  isLocationEnabled: boolean;
  isTsheetClassEnabled?: boolean;
  isTsheetLocationEnabled?: boolean;
  isTaxableFieldEnabled: boolean;
  entityVersion: string;
  isCloseBookDateEnabled: boolean;
  isCloseBookPasswordEnabled: boolean;
  closeBookDate: Dayjs;
  timezone: string;
  qboTimezone?: string;
  isItemEnabled?: boolean;
  isPayrollEnabled?: boolean;
  isBreakEnabled?: boolean;
  isCustomerEnabled?: boolean;
  isProjectEnabled?: boolean;
  classRequired?: boolean;
  locationRequired?: boolean;
  serviceItemRequired?: boolean;
  requireBillable?: boolean;
  timeSheetEntryMakesNotesRequiredEnabled?: boolean;
  billingRateForTimeEnabled?: boolean;
  mileageTrackingEnabled?: boolean;
}
export interface useCompanySettingsResponse {
  settingsData: TimeTrackingCompanySettings;
  refetch: () => void;
  loading: boolean;
  error: string;
  qlSettings: MappedQLSettings;
  qboSettings: TimeTrackingSettings;
}

export interface UseCompanySettingsOptions {
  isExported?: boolean;
}

const DEFAULT_CLOSE_BOOK_DATE = dayjs();

// Default company settings
const DEFAULT_COMPANY_SETTINGS: TimeTrackingCompanySettings = {
  isClassEnabled: false,
  isLocationEnabled: false,
  isTsheetClassEnabled: false,
  isTsheetLocationEnabled: false,
  isServiceFieldEnabled: false,
  isBillingFieldEnabled: false,
  isTaxableFieldEnabled: false,
  firstDayOfWeek: 0,
  entityVersion: '0',
  isCloseBookDateEnabled: false,
  closeBookDate: DEFAULT_CLOSE_BOOK_DATE,
  isCloseBookPasswordEnabled: false,
  timezone: '',
  qboTimezone: '',
  // Required field settings
  classRequired: false,
  locationRequired: false,
  serviceItemRequired: false,
  requireBillable: false,
  timeSheetEntryMakesNotesRequiredEnabled: false,
  mileageTrackingEnabled: false,
};

export const useCompanySettings = (
  options: UseCompanySettingsOptions = { isExported: false },
): useCompanySettingsResponse => {
  const { isExported } = options;
  const sandbox = useSandbox();
  const isWorkforce = isWorkforceEnvironment(sandbox);

  // Feature Flag
  const featureFlag: boolean = useFeatureFlag(
    FEATURE_FLAGS.QB_TIME_TRACKING_UI_EMPLOYER_SETTING,
  );

  const [isLoading, setIsLoading] = useState(true);

  const {
    qlSettings,
    refetch: refetchQlSettings,
    loading: qlSettingsLoading,
    error: qlSettingsError,
  } = useGetQLSettings({ isExported });

  const {
    data: qboSettings,
    refetch: refetchQboSettings,
    loading: qboSettingsLoading,
    error: qboSettingsError,
  } = useGetSettings();

  const [combinedData, setCombinedData] = useState<TimeTrackingCompanySettings>(
    DEFAULT_COMPANY_SETTINGS,
  );

  const areSettingsReady = useCallback((): boolean => {
    if (isWorkforce) {
      return !qlSettingsLoading && !qlSettingsError;
    }
    return (
      !qboSettingsLoading &&
      !qboSettingsError &&
      (featureFlag ? !qlSettingsError && !qlSettingsLoading : true)
    );
  }, [
    isWorkforce,
    qlSettingsLoading,
    qlSettingsError,
    qboSettingsLoading,
    qboSettingsError,
    featureFlag,
  ]);

  useEffect(() => {
    if (areSettingsReady()) {
      const baseSettings = {
        ...qboSettings,
        qboTimezone: qboSettings.timezone,
        isTsheetClassEnabled: qlSettings.classForTimeSheetEnabled?.value,
        isTsheetLocationEnabled: qlSettings.locationForTimeSheetEnabled?.value,
        billingRateForTimeEnabled: qlSettings.billingRateForTimeEnabled?.value,
        classRequired: qlSettings.classRequired?.value ?? false,
        locationRequired: qlSettings.locationRequired?.value ?? false,
        serviceItemRequired: qlSettings.serviceItemRequired?.value ?? false,
        requireBillable: qlSettings.requireBillable?.value ?? false,
        timeSheetEntryMakesNotesRequiredEnabled:
          qlSettings.timeSheetEntryMakesNotesRequiredEnabled?.value ?? false,
        mileageTrackingEnabled:
          qlSettings.mileageTrackingEnabled?.value ?? false,
      };

      const qlOverrides = featureFlag
        ? {
            isServiceFieldEnabled: qlSettings.isServiceFieldEnabled?.value,
            isBillingFieldEnabled: qlSettings.isBillingFieldEnabled?.value,
            firstDayOfWeek: qlSettings.firstDayOfWeek?.value,
            timezone: qlSettings.timeZone?.value || qboSettings.timezone,
          }
        : {};

      const workforceOverrides = isWorkforce
        ? {
            isServiceFieldEnabled: qlSettings.isServiceFieldEnabled?.value,
            isBillingFieldEnabled: qlSettings.isBillingFieldEnabled?.value,
            firstDayOfWeek: qlSettings.firstDayOfWeek?.value,
            isClassEnabled: qlSettings.classForTimeSheetEnabled?.value ?? false,
            isLocationEnabled:
              qlSettings.locationForTimeSheetEnabled?.value ?? false,
            isCustomerEnabled:
              qlSettings.customersForTimeSheetEnabled?.value ?? false,
            isTaxableFieldEnabled: false,
            entityVersion: '0',
            isCloseBookDateEnabled: false,
            isCloseBookPasswordEnabled: false,
            closeBookDate: DEFAULT_CLOSE_BOOK_DATE,
            timezone: qlSettings.timeZone?.value || '',
            qboTimezone: qlSettings.timeZone?.value || '',
          }
        : {};

      const finalSettings = {
        ...baseSettings,
        ...qlOverrides,
        ...workforceOverrides,
      };
      setCombinedData(finalSettings);
    } else if (
      isWorkforce ? qlSettingsError : qboSettingsError || qlSettingsError
    ) {
      setCombinedData(DEFAULT_COMPANY_SETTINGS);
    }
    setIsLoading(qboSettingsLoading || qlSettingsLoading);
  }, [
    areSettingsReady,
    isWorkforce,
    qlSettings,
    featureFlag,
    qlSettingsError,
    qlSettingsLoading,
    qboSettingsLoading,
    qboSettingsError,
    qboSettings,
  ]);

  const refetch = () => {
    if (!isWorkforce) {
      refetchQboSettings();
    }
    if (featureFlag || isWorkforce) {
      refetchQlSettings();
    }
  };

  const error = isWorkforce
    ? qlSettingsError || ''
    : qboSettingsError || (featureFlag ? qlSettingsError : '') || '';

  return {
    settingsData: combinedData,
    refetch,
    loading: isLoading,
    error,
    qlSettings,
    qboSettings,
  };
};

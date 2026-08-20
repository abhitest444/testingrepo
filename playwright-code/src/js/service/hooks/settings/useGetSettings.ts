import { useCallback, useEffect, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { useIntl, useSandbox } from '@payroll/quicksand';
import { settings } from '@quickbooks-qbappfound/setting-service-ui';
import { QuickbooksOnlineSandbox } from '@appfabric/sandbox-spec';
import { getAppSecret } from 'src/js/service/ApolloClientBuilderUtils';
import {
  CompanySettings,
  TimeTrackingSettingsQuery,
} from 'src/js/service/queries/settingsQueries';
import { mapError } from 'src/js/service/utils/mapError';
import { stringToDayJS } from 'src/js/common/DateAndTimeUtils';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';

export interface SettingsError {
  message: string;
}

export interface SettingsQueryResponse {
  data: CompanySettings;
  errors?: SettingsError[];
}

export interface TimeTrackingSettings {
  isClassEnabled: boolean;
  isLocationEnabled: boolean;
  isServiceFieldEnabled: boolean;
  isBillingFieldEnabled: boolean;
  isTaxableFieldEnabled: boolean;
  firstDayOfWeek: number; // 0 (Sunday) to 6 (Saturday)
  entityVersion: string;
  isCloseBookDateEnabled: boolean;
  isCloseBookPasswordEnabled: boolean;
  closeBookDate: Dayjs;
  timezone: string;
}

export interface UseGetSettingsState {
  loading: boolean;
  error?: string;
  data: TimeTrackingSettings;
  refetch: () => void;
}

// map from QB settings number to DayJS number
// null response means it was never changed, return default
// 0 (Sunday) to 6 (Saturday)
export const mapFirstDayOfWeek = (dayOfWeek?: number): number =>
  dayOfWeek == null ? 0 : dayOfWeek;

export const mapSettingsQueryResponse = (
  response: SettingsQueryResponse,
): TimeTrackingSettings => ({
  isClassEnabled:
    response.data.qbAppFoundationQbSettings.qbCompositeApp.qbAppFoundations
      .customFieldsAndDimensions.customFieldSettings.classesEnabled || false,
  isLocationEnabled:
    response.data.qbAppFoundationQbSettings.qbCompositeApp.qbAppFoundations
      .customFieldsAndDimensions.customFieldSettings.locationEnabled || false,
  isServiceFieldEnabled:
    response.data.qbAppFoundationQbSettings.work.timeTracking
      .timeTrackingSettings.timeTrackingEnabled || false,
  isBillingFieldEnabled:
    response.data.qbAppFoundationQbSettings.work.timeTracking
      .timeTrackingSettings.billingForTimeEnabled || false,
  isTaxableFieldEnabled:
    response.data.qbAppFoundationQbSettings?.commerce?.indirectTax
      ?.indirectTaxSettings?.taxSettings[0]?.taxEnabled || false,
  firstDayOfWeek: mapFirstDayOfWeek(
    response.data.qbAppFoundationQbSettings.work.timeTracking
      .timeTrackingSettings.startWorkWeek,
  ),
  entityVersion:
    response.data.qbAppFoundationQbSettings.finance.accounting.accountingCore
      .accountingCoreSettings.entityVersion || '0',
  isCloseBookDateEnabled:
    response.data.qbAppFoundationQbSettings.finance.accounting.accountingCore
      .accountingCoreSettings.closeBookDateEnabled || false,
  closeBookDate: stringToDayJS(
    response.data.qbAppFoundationQbSettings.finance.accounting.accountingCore
      .accountingCoreSettings.closeBookDate || '',
    'YYYY-MM-DD',
    false,
  ),
  isCloseBookPasswordEnabled:
    response.data.qbAppFoundationQbSettings.finance.accounting.accountingCore
      .accountingCoreSettings.closeBookPasswordEnabled || false,
  timezone:
    response.data.qbAppFoundationQbSettings.identity.company.localization
      .localizationSettings.timezone || '',
});

export const getSettingsService = (sandbox: any, appSecret: string) =>
  settings(sandbox as unknown as QuickbooksOnlineSandbox).apiKey(appSecret);

export const useGetSettings = (): UseGetSettingsState => {
  const sandbox = useSandbox();
  const intl = useIntl();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [data, setData] = useState<TimeTrackingSettings>({
    isClassEnabled: false,
    isLocationEnabled: false,
    isServiceFieldEnabled: false,
    isBillingFieldEnabled: false,
    isTaxableFieldEnabled: false,
    firstDayOfWeek: 0,
    entityVersion: '0',
    isCloseBookDateEnabled: false,
    closeBookDate: dayjs(),
    isCloseBookPasswordEnabled: false,
    timezone: '',
  });

  const handleSuccess = useCallback((result: SettingsQueryResponse) => {
    setData(mapSettingsQueryResponse(result));
  }, []);

  const handleError = useCallback(
    (error: string) => {
      const mappedError = mapError({
        sourceComponent: 'useGetSettings',
        sandbox,
        intl,
        error,
      });
      if (mappedError) {
        setError(mappedError);
      }
    },
    [intl, sandbox],
  );

  const fetchSettings = useCallback(async () => {
    if (isWorkforceEnvironment(sandbox)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const appSecret = getAppSecret(sandbox);
    const settingsService = getSettingsService(sandbox, appSecret);
    try {
      const result = (await settingsService.query(
        TimeTrackingSettingsQuery,
        undefined,
      )) as SettingsQueryResponse;

      if (result.errors && result.errors.length > 0) {
        handleError(result.errors[0].message as string);
      } else {
        handleSuccess(result);
      }
    } catch (error) {
      handleError(error as string);
    } finally {
      setLoading(false);
    }
  }, [handleError, handleSuccess, sandbox]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return { loading, error, data, refetch: fetchSettings };
};

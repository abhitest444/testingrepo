import { useSandbox } from '@payroll/quicksand';
import { QuickbooksOnlineSandbox } from '@appfabric/sandbox-spec';
import { Sandbox } from 'src/js/common/sandbox';
import {
  TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE,
  LOOKUP_INTERVAL_FOR_COPY_LAST_TIMESHEET_IN_MONTHS,
  QUICKBOOKS_JOB_GROUP,
} from 'src/js/common/constants';
import US_REGION_L10N_DEFAULTS from 'src/js/common/localization';
import { getRegion } from '../ApolloClientBuilderUtils';

/**
 * Checks if running in Workforce environment (non-QBO)
 * @param sandbox - the sandbox context
 * @returns True if Workforce environment (payroll-employee-portal)
 */
export const isWorkforceEnvironment = (sandbox?: Sandbox): boolean =>
  sandbox?.appContext?.getAppInfo?.()?.appId ===
  'payroll-employee-portal-experience';

/**
 * Map locale to currency information
 * Supports US, UK (GB), and Canada
 * @param locale - Locale string (e.g., 'en-US', 'en-CA', 'en-GB')
 * @returns Currency info with currencyIsoCode, currencySymbol, and region
 */
const getCurrencyFromLocale = (locale: string) => {
  const localeMap: Record<
    string,
    { currencyIsoCode: string; currencySymbol: string; region: string }
  > = {
    'en-us': { currencyIsoCode: 'USD', currencySymbol: '$', region: 'US' },
    'en-ca': { currencyIsoCode: 'CAD', currencySymbol: '$', region: 'CA' },
    'fr-ca': { currencyIsoCode: 'CAD', currencySymbol: '$', region: 'CA' },
    'en-gb': { currencyIsoCode: 'GBP', currencySymbol: '£', region: 'GB' },
  };

  const normalizedLocale = locale.toLowerCase();
  return (
    localeMap[normalizedLocale] || {
      currencyIsoCode: 'USD',
      currencySymbol: '$',
      region: 'US',
    }
  );
};

/**
 * Get localization info from sandbox (works in both QBO and AppFabric shells)
 * @param sandbox - Sandbox instance
 * @returns Localization info with locale, currencyIsoCode, currencySymbol, etc.
 */
export const getLocalizationInfo = (sandbox: Sandbox) => {
  // Try QBO shell API first (has most complete info)
  if (sandbox?.extensions?.qbo?.context?.getCompanyL10nInfo) {
    return sandbox.extensions.qbo.context.getCompanyL10nInfo();
  }

  // Try AppFabric shell API
  if (sandbox?.appContext?.getLocalizationInfo) {
    const localizationInfo = sandbox.appContext.getLocalizationInfo();
    const locale = localizationInfo?.locale || 'en-US';

    // Derive currency from locale (AppFabric LocalizationInfo only has locale)
    const currencyInfo = getCurrencyFromLocale(locale);

    return {
      ...localizationInfo,
      locale,
      ...currencyInfo,
    };
  }

  // Default fallback
  return {
    locale: 'en-US',
    currencyIsoCode: 'USD',
    currencySymbol: '$',
    region: 'US',
  };
};

export const useCurrencySymbol = () => {
  const sandbox = useSandbox();
  const l10nInfo = getLocalizationInfo(sandbox);
  return l10nInfo.currencySymbol;
};

export const useCurrencyFormat = (amount: number): string => {
  const sandbox = useSandbox();
  const { locale, currencyIsoCode } = getLocalizationInfo(sandbox);

  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyIsoCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return formatted;
};

export const useHasAdminAccess = () => {
  const sandbox = useSandbox();
  if (sandbox?.extensions?.qbo?.context?.getAuthInfo) {
    const authInfo = sandbox && sandbox.extensions.qbo.context.getAuthInfo();
    return authInfo && authInfo.isAdmin;
  }
  // TODO WFS: For now return false as fallback. Will remove once we have a better way to check if the user has admin access.
  return false;
};

export const fetchSettingsAccess = async (
  sandbox: QuickbooksOnlineSandbox,
): Promise<boolean> => {
  const result = await sandbox?.authorization.isAuthorized(
    { id: 'irn:intuit::platform:settings:v4' },
    { id: 'read' },
  );

  if (!result || !result.isAuthorized || !result.obligations) {
    return false;
  }

  return (
    result.obligations[0]?.permit?.includes('company_prefs:update') ?? false
  );
};

export const useFeatureFlag = (feature: string) => {
  const sandbox = useSandbox();
  return sandbox.featureFlags.isFeatureEnabled(feature);
};

export const useSandboxNavigate = () => {
  const sandbox = useSandbox();
  const navigator = sandbox.navigation;
  return navigator;
};

export const getlookupIntervalForCopyLastTimesheet = (sandbox: Sandbox) =>
  Number(
    sandbox.pluginConfig.extendedProperties
      ?.lastTimeEntryLookupIntervalInMonths,
  ) || LOOKUP_INTERVAL_FOR_COPY_LAST_TIMESHEET_IN_MONTHS;

export const getJobs = (sandbox: Sandbox) => sandbox?.extensions?.qbo?.jobs;

export const isPayrollFirstCompany = (sandbox: Sandbox) =>
  !getJobs(sandbox)?.hasJobGroup(QUICKBOOKS_JOB_GROUP);

const isCanadaCompany = (sandbox: Sandbox) => getRegion(sandbox) === 'CA';

const isGBCompany = (sandbox: Sandbox) => getRegion(sandbox) === 'GB';

export const getListType = (sandbox: Sandbox) => {
  if (isCanadaCompany(sandbox)) {
    return TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.CA;
  }

  if (isGBCompany(sandbox)) {
    return TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.UK;
  }

  return isPayrollFirstCompany(sandbox)
    ? TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.PAYROLL_FIRST
    : TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.US;
};

export const isTimeTrackingOnlyRole = (sandbox: Sandbox) => {
  const roleType =
    sandbox?.extensions?.qbo?.context?.getAuthInfo?.()?.legacyRoles?.roleType;
  if (!roleType) {
    sandbox.logger.error(
      'isTimeTrackingOnlyRole: unable to determine legacy role type from sandbox',
    );
  }
  return roleType === 'TIME_ENTRY';
};

export const canEditPreference = (sandbox: Sandbox) => {
  const permission =
    sandbox?.extensions?.qbo?.context?.getAuthInfo()?.legacyPermissions
      ?.features?.companyPrefs;

  return permission === 'ALL' || permission === 'EDIT';
};

/**
 * IES (Intuit Ecosystem Services) offering IDs
 */
const IES_OFFERING_IDS = ['Intuit.midmarket.ies', 'Intuit.midmarket.ies.me'];
const QBO_OFFERING_ID = 'Intuit.sbe.salsa.default';

export const SIMPLE_START_FLAVORS = [
  'QBO_SIMPLE_START',
  'QBO_LEDGER',
  'QBO_SIMPLESTART_PL',
  'QBO_SIMPLESTART_PL_FLEX',
  'QBO_SIMPLESTART_SUITE',
  'QBO_BASIC_PL',
  'QBO_BASE',
  'QBO_FREE',
  'QBO_LITE',
];

/**
 * Check if customer is IES (Intuit Ecosystem / QuickBooks Platform Company)
 * IES companies are Ecosystem companies that have the IES offering in their entitlements
 *
 * @param sandbox - The sandbox instance
 * @returns Promise<boolean> - true if IES/QuickBooks Platform company
 */
export const isIESCustomer = async (sandbox: Sandbox): Promise<boolean> => {
  try {
    // Check if sandbox exists
    if (!sandbox) {
      return false;
    }

    // Get all entitlements from the sandbox (await the promise)
    const entitlementGrants =
      (await sandbox.extensions?.qbo?.entitlements?.product?.getAllEntitlements()) ||
      [];

    sandbox.logger?.log(
      `Event=IES check - checking entitlements (count: ${entitlementGrants.length})`,
    );

    // Check if any entitlement grant has any of the IES offering IDs
    const hasIES = entitlementGrants.some((entitlementGrant: any) => {
      const offeringId = entitlementGrant?.offeringId;
      return (
        typeof offeringId === 'string' && IES_OFFERING_IDS.includes(offeringId)
      );
    });

    sandbox.logger?.log(`Event=IES check result - hasIES: ${hasIES}`);

    return hasIES;
  } catch (error: unknown) {
    sandbox.logger?.error(
      'Failed to check IES customer status:',
      error instanceof Error ? { error: error.message } : {},
    );
    return false; // Return false on error (fail safe)
  }
};

export const isSimpleStartCompany = async (sandbox: Sandbox) => {
  const entitlementGrants =
    (await sandbox.extensions?.qbo?.entitlements?.product?.getAllEntitlements()) ||
    [];
  return entitlementGrants.some(
    (entitlementGrant: any) =>
      entitlementGrant?.offeringId === QBO_OFFERING_ID &&
      SIMPLE_START_FLAVORS.includes(entitlementGrant?.flavor) &&
      entitlementGrant?.entitlementStatus === 'ACTIVE',
  );
};

export const getRealmId = (sandbox: Sandbox) =>
  sandbox.appContext.getRealmInfo()?.realmId || '';

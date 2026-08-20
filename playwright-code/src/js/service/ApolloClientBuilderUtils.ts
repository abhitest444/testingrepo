import { Environment } from '@appfabric/sandbox-spec';
import { Sandbox } from 'src/js/common/sandbox';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';

/**
 * Collection of utils to build an Apollo Client for time-tracking-ui
 *
 * Do not use Quicksand here, use the sandbox directly
 *
 */

export enum ApolloClientNames {
  GAS,
  OIGQL,
  TIME_TRACKING,
  IDENTITY,
  CUSTOM_EXTENSIONS,
  TSHEETS,
  WORKFLOW,
}

export const INTUIT_WEB_APP = 'intuit-web-app';
export const WEB_APP_QBO = 'workers-ui-qbo';
export const INTUIT_QBTIME_WORKER = 'intuit-qbtime-worker';

export const getEnvFromSandbox = (sandbox: Sandbox): Environment =>
  sandbox.appContext.getEnvironment();

export const buildAuthHeader = (sandbox: Sandbox): Record<string, string> => {
  const appSecret = getAppSecret(sandbox);
  return {
    Authorization: `Intuit_APIKey intuit_apikey=${appSecret},intuit_apikey_version=1.0`,
  };
};

export const buildHeaders = (sandbox: Sandbox): Record<string, string> => ({
  ...defaultHeaders,
  ...buildAuthHeader(sandbox),
  ...getCsrfHeader(sandbox),
  ...userAndCompanyIdHeader(sandbox),
  ...getRegionHeader(sandbox),
});

export const getRegionHeader = (sandbox: Sandbox): Record<string, string> => ({
  intuit_country: getRegion(sandbox),
});

export const defaultHeaders: Record<string, string> = {
  'content-type': 'application/json;charset=UTF-8',
  accept: 'application/json;charset=UTF-8',
  'intuit-plugin-id': 'time-tracking-ui',
};

export const userAndCompanyIdHeader = (
  sandbox: Sandbox,
): Record<string, string> => {
  const realmId = sandbox.appContext.getRealmInfo()?.realmId || 'DEFAULT_REALM';
  const authId = sandbox.appContext.getUserAuthInfo()?.authId || 'DEFAULT_AUTH';
  return {
    'intuit-user-id': authId,
    'intuit-company-id': realmId,
  };
};

export const getCsrfHeader = (sandbox: Sandbox): Record<string, string> => {
  const token =
    sandbox.extensions?.qbo?.context?.getEnvironmentInfo()?.xCsrfToken || '';
  return { 'x-csrf-token': token };
};

export const getRegion = (sandbox: Sandbox): string => {
  // Try QBO extension first
  if (sandbox.extensions?.qbo?.context?.getCompanyL10nInfo) {
    return sandbox.extensions.qbo.context.getCompanyL10nInfo()?.region ?? 'US';
  }

  // Fallback to AppFabric localization info if available (Workforce environment)
  if (isWorkforceEnvironment(sandbox)) {
    const locale = sandbox.appContext?.getLocalizationInfo?.()?.locale;
    if (locale) {
      const regionMap: Record<string, string> = {
        'en-us': 'US',
        'en-ca': 'CA',
        'en-gb': 'GB',
      };
      return regionMap[locale.toLowerCase()] || 'US';
    }
  }

  return 'US'; // Default fallback
};

export const getQbTimeTrackingContext = (sandbox: Sandbox) => {
  const env = getEnvFromSandbox(sandbox);
  // return 'https://local.intuit.com:8443/graphql';
  switch (env) {
    case Environment.PROD:
      return 'https://qb-time-tracking.api.intuit.com/graphql';
    case Environment.E2E:
      return 'https://qb-time-tracking-e2e.api.intuit.com/graphql';
    case Environment.QA:
      return 'https://qb-time-tracking-qal.api.intuit.com/graphql';
    case Environment.PERF:
      return 'https://qb-time-tracking-prf.api.intuit.com/graphql';
    default:
      return 'https://local.intuit.com:8443/graphql';
  }
};

export const getGASContext = (sandbox: Sandbox) => {
  const env = getEnvFromSandbox(sandbox);
  switch (env) {
    case Environment.PROD:
      return 'https://api.qbo.onlinepayroll.intuit.com/graphql';
    case Environment.E2E:
      return 'https://api.qbo-e2e1.onlinepayroll.intuit.com/graphql';
    case Environment.QA:
      return 'https://api.qbo-qa1.onlinepayroll.intuit.com/graphql';
    case Environment.PERF:
      return 'https://api.qbo-prf.onlinepayroll.intuit.com/graphql';
    default:
      return 'https://api.qbo.onlinepayroll.intuit.com/graphql';
  }
};

export const getOIGQLContext = (sandbox: Sandbox) => {
  const env = getEnvFromSandbox(sandbox);
  switch (env) {
    case Environment.PROD:
      return 'https://sbseggraphqlorch.api.intuit.com/graphql';
    case Environment.E2E:
      return 'https://sbseggraphqlorch-e2e.api.intuit.com/graphql';
    case Environment.QA:
      return 'https://sbseggraphqlorch-qal.api.intuit.com/graphql';
    case Environment.PERF:
      return 'https://sbseggraphqlorch-prf.api.intuit.com/graphql';
    default:
      return 'https://sbseggraphqlorch.api.intuit.com/graphql';
  }
};

export const getIdentityContext = (sandbox: Sandbox) => {
  const env = getEnvFromSandbox(sandbox);
  switch (env) {
    case Environment.PROD:
      return 'https://identity.api.intuit.com/v2/graphql';
    case Environment.E2E:
      return 'https://identity-e2e.api.intuit.com/v2/graphql';
    case Environment.QA:
      return 'https://identity-qal.api.intuit.com/v2/graphql';
    case Environment.PERF:
      return 'https://identity-prf.api.intuit.com/v2/graphql';
    default:
      return 'https://identity-e2e.api.intuit.com/v2/graphql';
  }
};

export const getTSheetsContext = (sandbox: Sandbox) => {
  const env = getEnvFromSandbox(sandbox);
  switch (env) {
    case Environment.PROD:
      return 'https://tsheets.api.intuit.com/graphql';
    case Environment.E2E:
      return 'https://tsheets-e2e.api.intuit.com/graphql';
    case Environment.QA:
      return 'https://tsheets-qal.api.intuit.com/graphql';
    case Environment.PERF:
      return 'https://tsheets-prf.api.intuit.com/graphql';
    default:
      return 'https://tsheets-e2e.api.intuit.com/graphql';
  }
};

export const getQBOV3BaseUrl = (sandbox: Sandbox): string => {
  const env = getEnvFromSandbox(sandbox);
  switch (env) {
    case Environment.PROD:
      return 'https://qbo.intuit.com/api/v3';
    case Environment.E2E:
      return 'https://e2e.qbo.intuit.com/api/v3';
    case Environment.QA:
      return 'https://qal.qbo.intuit.com/api/v3';
    case Environment.PERF:
      return 'https://prf.qbo.intuit.com/api/v3';
    default:
      return 'https://e2e.qbo.intuit.com/api/v3';
  }
};

export const getWorkflowContext = (sandbox: Sandbox): string => {
  const env = getEnvFromSandbox(sandbox);
  switch (env) {
    case Environment.PROD:
      return 'https://accountantworkflow.api.intuit.com/v4/graphql';
    case Environment.E2E:
      return 'https://accountantworkflow-e2e.api.intuit.com/v4/graphql';
    case Environment.QA:
      return 'https://accountantworkflow-qal.api.intuit.com/v4/graphql';
    case Environment.PERF:
      return 'https://accountantworkflow-prf.api.intuit.com/v4/graphql';
    default:
      return 'https://accountantworkflow-e2e.api.intuit.com/v4/graphql';
  }
};

export const getAppSecret = (sandbox: Sandbox): string =>
  (sandbox?.pluginConfig?.extendedProperties?.appSecret as string) ?? '';

import { v4 as uuidv4 } from 'uuid';
import { Environment } from '@appfabric/sandbox-spec';
import {
  buildHeaders,
  getEnvFromSandbox,
} from 'src/js/service/ApolloClientBuilderUtils';

const getQBONeoBaseUrl = (sandbox: any): string => {
  const env = getEnvFromSandbox(sandbox);
  switch (env) {
    case Environment.PROD:
      return 'https://qbo.intuit.com/api/neo/v1';
    case Environment.E2E:
      return 'https://e2e.qbo.intuit.com/api/neo/v1';
    case Environment.QA:
      return 'https://qal.qbo.intuit.com/api/neo/v1';
    case Environment.PERF:
      return 'https://prf.qbo.intuit.com/api/neo/v1';
    default:
      return 'https://e2e.qbo.intuit.com/api/neo/v1';
  }
};

// TODO WFS: need to find a better way to get the API URL if sandbox.extensions.qbo.serviceURLs.getGatewayNeoServiceUrl is not available.
function getAPIUrl(endpoint: string, sandbox: any) {
  if (sandbox?.extensions?.qbo?.serviceURLs?.getGatewayNeoServiceUrl) {
    return sandbox.extensions.qbo.serviceURLs.getGatewayNeoServiceUrl(endpoint);
  }

  const realmId = sandbox.appContext.getRealmInfo()?.realmId || 'DEFAULT_REALM';
  const baseUrl = getQBONeoBaseUrl(sandbox);

  return `${baseUrl}/company/${realmId}/${endpoint}`;
}

export const NeoApiClient = async (endpoint: string, sandbox: any) => {
  const API_URL = getAPIUrl(endpoint, sandbox);
  const intuit_tid = uuidv4().toString();

  try {
    sandbox.logger.info(`API is called=${API_URL}`);
    const response = await fetch(`${API_URL}`, {
      method: 'GET',
      headers: {
        ...buildHeaders(sandbox),
        intuit_tid,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (response.ok) {
      const data = await response.json();
      sandbox.logger.info(
        `Component: NeoApiClient Endpoint ${API_URL} API responded status=${response.status} intuit_tid: ${intuit_tid}`,
      );
      return data;
    }
    sandbox.logger.info(
      `Component: NeoApiClient Endpoint ${API_URL} API error=${response.statusText} intuit_tid: ${intuit_tid}`,
    );
    throw new Error(response.statusText);
  } catch (err) {
    sandbox.logger.error(
      `Component: NeoApiClient Endpoint ${API_URL} call failed intuit_tid: ${intuit_tid} error: ${err}`,
    );
    throw err;
  }
};

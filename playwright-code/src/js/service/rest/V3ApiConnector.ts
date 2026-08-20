import { v4 as uuidv4 } from 'uuid';
import {
  buildHeaders,
  getQBOV3BaseUrl,
} from 'src/js/service/ApolloClientBuilderUtils';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';

export const V3ApiConnector = async (endpoint: string, sandbox: any) => {
  let API_URL: string;

  // QBO environment: use the QBO extension service URL (original behavior)
  if (!isWorkforceEnvironment(sandbox)) {
    API_URL =
      sandbox.extensions.qbo.serviceURLs.getGatewayV3ServiceUrl(endpoint);
  } else {
    // Workforce environment: fallback to static URL with company ID
    const realmId =
      sandbox.appContext.getRealmInfo()?.realmId || 'DEFAULT_REALM';
    const baseUrl = getQBOV3BaseUrl(sandbox);
    API_URL = `${baseUrl}/company/${realmId}/${endpoint}`;
  }

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
        `Component: V3ApiConnector Endpoint ${API_URL} API responded status=${response.status} intuit_tid: ${intuit_tid}`,
      );
      return data;
    }
    sandbox.logger.info(
      `Component: V3ApiConnector Endpoint ${API_URL} API error=${response.statusText} intuit_tid: ${intuit_tid}`,
    );
    throw new Error(response.statusText);
  } catch (err) {
    sandbox.logger.error(
      `Component: V3ApiConnector Endpoint ${API_URL} call failed intuit_tid: ${intuit_tid} error: ${err}`,
    );
    throw err;
  }
};

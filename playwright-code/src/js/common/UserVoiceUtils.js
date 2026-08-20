import { RestClient } from 'ui-data-layer/client';
import { getDecision } from '@core-app/variability-sync-sdk';
import { isIXPFeatureFlagEnabled } from 'src/js/service/utils/featureFlags';
import { isIESCustomer } from 'src/js/service/utils/sandboxUtils';
import { FEATURE_FLAGS } from 'src/js/common/constants';

const getScreenResolution = () => {
  if (!window.screen) {
    return '';
  }
  return `${window.innerWidth}x${window.innerHeight}(${window.screen.availWidth}x${window.screen.availHeight})`;
};

const getDefaultValue = (value, defaultValue = 'NoName') =>
  value === null || value === undefined || value.trim() === ''
    ? defaultValue
    : value;

const getQbo = () =>
  // eslint-disable-next-line no-restricted-properties -- Legacy: getQbo reads from window.qbo for pluginsInfo, sku
  typeof window !== 'undefined' && window.qbo ? window.qbo : {};

const getActivatedPlugins = () => {
  const { pluginsInfo } = getQbo();
  if (pluginsInfo && pluginsInfo.plugins) {
    const { plugins } = pluginsInfo;
    return Object.keys(plugins)
      .filter((key) => plugins[key].activated)
      .join(', ');
  }
  return '';
};

const convertFieldsToStringValues = (fields) => {
  const convertedFields = {};
  if (fields) {
    Object.keys(fields).forEach((key) => {
      if (typeof fields[key] === 'string') {
        convertedFields[key] = fields[key];
      } else if (typeof fields[key].toString === 'function') {
        convertedFields[key] = fields[key].toString();
      }
    });
  }
  return convertedFields;
};

const getCustomFields = (additionalFields) => {
  const qbo = getQbo();
  const { releaseVersion } = qbo;
  const majorReleaseVersion = releaseVersion
    ? String(releaseVersion).split('.')[0]
    : '';

  const customFields = convertFieldsToStringValues(additionalFields);
  const qboSku = convertFieldsToStringValues(qbo.sku);

  return {
    ...customFields,
    ...qboSku,
    queue: 'Time Tracking UI',
    companyId: qbo.serverGroupCompanyId,
    clusterId: qbo.clusterId,
    releaseVersion,
    majorReleaseVersion,
    companyLocale: qbo.companyL10nAttribs?.locale,
    referrer: window.location.pathname,
    userAgent: navigator.userAgent,
    activePlugins: getActivatedPlugins(),
    screenResolution: getScreenResolution(),
  };
};

/**
 * Uservoice helper to post user feedback
 * @param {Object} params object of properties to insert into the post body
 * @param {Object} sandbox sandbox object containing context information
 * @param {string | null} widgetIdentifier optional widgetId to override the one from sandbox
 * @param {boolean} isUnificationEnabled optional flag indicating if unification IXP is enabled
 * @returns {Promise} Post result promise
 */
const postToUserVoice = async (
  params,
  sandbox,
  widgetIdentifier = null,
  isOvertimeEnabled = false,
  isGeofenceEnabled = false,
) => {
  const widgetId =
    widgetIdentifier || sandbox.sandboxContext.getInfo().widgetId;
  const { realmId, realmName } = sandbox.appContext.getRealmInfo();
  const { authId } = sandbox.appContext.getUserAuthInfo();
  const { region } = sandbox.extensions.qbo.context.getCompanyL10nInfo();
  const { email, name: unparsedName } =
    sandbox.extensions.qbo.context.getUserInfo();
  const name = getDefaultValue(unparsedName);
  const {
    isAccountantUser,
    isAdmin,
    isMasterAdmin,
    legacyRoles: { roleType },
  } = sandbox.extensions.qbo.context.getAuthInfo();
  const customFields = getCustomFields({
    widgetId,
    realmId,
    realmName,
    isAccountantUser,
    isAdmin,
    isMasterAdmin,
    roleType,
    ...(params.qboFlavor != null && { qboFlavor: params.qboFlavor }),
  });
  // Check for IES (Intuit Ecosystem Services) customer using sandboxUtils
  let isIES = false;
  try {
    isIES = await isIESCustomer(sandbox);
  } catch (error) {
    sandbox.logger.log(
      'Event=Error fetching the IES customer status in feedback form',
      error,
    );
  }

  // Get QB_TIME_TRACKING_UI_ENABLE_IES_FEATURE_FLAGS status for the realm
  let isIESFeatureFlagsEnabled = false;
  try {
    isIESFeatureFlagsEnabled = await isIXPFeatureFlagEnabled(
      sandbox,
      FEATURE_FLAGS.QB_TIME_TRACKING_UI_ENABLE_IES_FEATURE_FLAGS,
    );
  } catch (error) {
    sandbox.logger.log(
      'Event=Error fetching the IES feature flags status in feedback form',
      error,
    );
  }

  const feedback = `Feedback: ${params.message}`;
  const qboFlavor = params.qboFlavor ? `QBO Flavor: ${params.qboFlavor}` : '';
  const { name: productName, referrer, screenResolution } = customFields;
  const isPayrollCompany = getDecision('hasPayroll', {
    defaultValue: customFields.isPayrollSku,
  });
  let message = `${feedback}
  --------
  Widget id: ${widgetId}
  Referrer: ${referrer}
  Product: ${productName}
  Is Payroll: ${isPayrollCompany}
  Is R6 Overtime Enabled: ${isOvertimeEnabled ? 'Yes' : 'No'}
  Is IES Customer: ${isIES ? 'Yes' : 'No'}
  Is IES Feature Flags Enabled: ${isIESFeatureFlagsEnabled ? 'Yes' : 'No'}
  Is Geofence Enabled: ${isGeofenceEnabled ? 'Yes' : 'No'}
  Company name: ${realmName}
  Realm ID: ${realmId}
  Region: ${region}
  User: ${name} (${email})
  Auth ID: ${authId}
  Role: ${roleType}
  Is Admin: ${isAdmin}
  Is Master Admin: ${isMasterAdmin}
  Is Accountant User: ${isAccountantUser}
  Screen Resolution: ${screenResolution}
  `;

  if (qboFlavor) {
    message += `${qboFlavor}`;
  }

  const userVoiceParameters = {
    query: {
      email,
      name,
      message,
      customFields: {
        ...customFields,
        isR6OvertimeEnabled: String(isOvertimeEnabled),
        isIES: String(isIES),
        isIESFeatureFlagsEnabled: String(isIESFeatureFlagsEnabled),
        isGeofenceEnabled: String(isGeofenceEnabled),
      },
    },
  };

  const config = {
    baseUrl: sandbox.extensions.qbo.serviceURLs.getQBONeoServiceUrl(''),
    authType: 'cookie_only_auth',
    csrfToken: sandbox.extensions.qbo.context.getEnvironmentInfo().csrfToken,
    xCsrfToken: sandbox.extensions.qbo.context.getEnvironmentInfo().xCsrfToken,
    companyId: sandbox.extensions.qbo.context.getCompanyInfo().id,
    userId: sandbox.extensions.qbo.context.getUserInfo()?.id,
    // additional fields added when sandbox is present
    generateIntuitTid: true,
    sandbox,
    pluginId: sandbox.pluginConfig && sandbox.pluginConfig.id,
  };

  const neoServiceClient = new RestClient(config);
  return neoServiceClient.post('/uservoice/sendFeedback', userVoiceParameters);
};

// eslint-disable-next-line import/prefer-default-export
export {
  convertFieldsToStringValues,
  getActivatedPlugins,
  getCustomFields,
  getScreenResolution,
  postToUserVoice,
};

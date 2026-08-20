/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable no-unused-vars */
/* eslint-disable no-shadow */
import { useState, useEffect } from 'react';
import { useSandbox } from '@payroll/quicksand';
import { QuickbooksOnlineSandbox } from '@appfabric/sandbox-spec';

// Feature flag types
export interface FeatureFlagData {
  isFlagEnabled: boolean;
  hasFlagLoaded: boolean;
}

export enum FEATURE_FLAG_IDENT_TYPE {
  REALM_OR_COMPANY_ID = 'REALM_OR_COMPANY_ID',
  AUTH_ID = 'AUTH_ID',
  IVID = 'IVID',
}

/**
 * Checks if an IXP feature flag is enabled using realm ID
 * @param {any} sandbox - The sandbox instance
 * @param {string} flagName - The feature flag name
 * @returns {Promise<boolean>} Whether the feature flag is enabled
 */
const isIXPFeatureFlagEnabled = async (
  sandbox: any,
  flagName: string,
): Promise<boolean> => {
  const { featureFlags, appContext } = sandbox;

  const realmId = appContext?.getRealmInfo()?.realmId;
  const { appId } = appContext?.getAppInfo();
  const subEnv = appContext?.getEnvironment();

  const entityID = {
    REALM_OR_COMPANY_ID: realmId,
    ns: appId,
  };

  const value = await featureFlags.evaluateBooleanVariation({
    entityID,
    subEnvironment: subEnv,
    flagKey: flagName,
    defaultFlagValue: false,
    context: {},
    dedupPrefix: '',
    userOptions: { includeCredentials: false },
  });
  return value;
};

export { isIXPFeatureFlagEnabled };

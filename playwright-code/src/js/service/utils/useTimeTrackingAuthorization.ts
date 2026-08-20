import { useEffect } from 'react';
import { useBatchAuthorization, useIntl, useSandbox } from '@payroll/quicksand';
import { Decision } from '@appfabric/sandbox-spec';
import { DecisionType } from '@appfabric/sandbox-spec/lib/core/SandboxAuthorization';
import { mapError } from 'src/js/service/utils/mapError';
import { Sandbox } from 'src/js/common/sandbox';
import { isTimeTrackingOnlyRole } from './sandboxUtils';

const AUTH_CONFIG = {
  canCreateEmployee: {
    resource: { id: 'irn:intuit::contacts:names:employee:v4' },
    action: { id: 'create' },
  },
  canCreateVendor: {
    resource: { id: 'irn:intuit::contacts:names:v4' },
    action: { id: 'create' },
  },
  canCreateCustomer: {
    resource: { id: 'irn:intuit::contacts:names:v4' },
    action: { id: 'create' },
  },
  canCreateProject: {
    resource: { id: 'irn:intuit::projectmanagement:project' },
    action: { id: 'create' },
  },
  canCreateLocation: {
    resource: { id: 'irn:intuit::accounting:department:v4' },
    action: { id: 'create' },
  },
  canCreateService: {
    resource: { id: 'irn:intuit::inventory:product:items:v4' },
    action: { id: 'create' },
  },
  canCreateClass: {
    resource: { id: 'irn:intuit::accounting:class:v4' },
    action: { id: 'create' },
  },
};

type TimeTrackingAuthorizationState = {
  canCreateEmployee: Decision;
  canCreateVendor: Decision;
  canCreateCustomer: Decision;
  canCreateProject: Decision;
  canCreateLocation: Decision;
  canCreateService: Decision;
  canCreateClass: Decision;
};

export interface UseTimeTrackingAuthorizationState {
  loading: boolean;
  error?: string;
  data: TimeTrackingAuthorizationState;
}

export const getDefaultDecision = (): Decision => ({
  isAuthorized: false,
  decision: DecisionType.DENY,
});

export const getDefaultAuthState = (): TimeTrackingAuthorizationState => ({
  canCreateEmployee: getDefaultDecision(),
  canCreateVendor: getDefaultDecision(),
  canCreateCustomer: getDefaultDecision(),
  canCreateProject: getDefaultDecision(),
  canCreateLocation: getDefaultDecision(),
  canCreateService: getDefaultDecision(),
  canCreateClass: getDefaultDecision(),
});

export const useTimeTrackingBatchAuthorization =
  (): UseTimeTrackingAuthorizationState => {
    const sandbox = useSandbox();
    const intl = useIntl();

    const { loading, error, decisions } = useBatchAuthorization({
      requests: AUTH_CONFIG,
    });

    useEffect(() => {
      if (decisions) {
        sandbox.logger.info(
          'useTimeTrackingBatchAuthorization: authz decisions received',
          {
            canCreateEmployee: decisions.canCreateEmployee,
          },
        );
        const nameId = computeTimeTrackingOnlyUser(decisions);
        if (isTimeTrackingOnlyRole(sandbox) && !nameId) {
          sandbox.logger.error(
            'useTimeTrackingBatchAuthorization: nameId missing for time tracking only user',
            {
              canCreateEmployee: decisions.canCreateEmployee,
            },
          );
        }
      }
    }, [decisions, sandbox]);

    return {
      loading: loading || false,
      error: mapError({
        sourceComponent: 'useTimeTrackingBatchAuthorization',
        error,
        sandbox,
        intl,
      }),
      data: decisions || getDefaultAuthState(),
    };
  };

export const computeCanEditSettings = async (sandbox: Sandbox) => {
  if (sandbox?.extensions?.qbo?.context?.getAuthInfo) {
    const companyPrefPermissions =
      sandbox.extensions.qbo.context.getAuthInfo().legacyPermissions.features
        .companyPrefs;
    return ['ALL', 'EDIT'].indexOf(companyPrefPermissions) >= 0;
  }
  // TODO WFS: replace with another IRN
  const result = await sandbox?.authorization.isAuthorized(
    { id: 'irn:intuit::platform:settings:v4' },
    { id: 'update' },
  );

  return result?.isAuthorized ?? false;
};

/**
 * Determine if current user is a "Time Tracking Only" user
 * If true, return the employee/vendor entity ID of the user
 * If false, return undefined
 *
 * @param authState
 */
export const computeTimeTrackingOnlyUser = (
  authState: TimeTrackingAuthorizationState,
): string | undefined =>
  authState.canCreateEmployee?.obligations?.[0]?.[
    'constraint-TIME_TRACK.NAME_ID'
  ];

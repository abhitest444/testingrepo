import { Environment } from '@appfabric/sandbox-spec';
import { Sandbox } from 'src/js/common/sandbox';
import { getRealmId } from '../../utils/sandboxUtils';

const getEnvFromSandbox = (sandbox: Sandbox): Environment =>
  sandbox.appContext.getEnvironment();

const IXP_CONFIG: Partial<
  Record<Environment, { experimentId: number; treatmentId: number }>
> = {
  [Environment.PROD]: {
    experimentId: 144633,
    treatmentId: 323156,
  },
  [Environment.E2E]: {
    experimentId: 326555,
    treatmentId: 719661,
  },
  [Environment.PERF]: {
    experimentId: 326555,
    treatmentId: 719661,
  },
  [Environment.QA]: {
    experimentId: 326555,
    treatmentId: 719661,
  },
};

const getRequestBody = (sandbox: Sandbox) => {
  const env = getEnvFromSandbox(sandbox);
  const realmId = getRealmId(sandbox);
  const entityId = {
    REALM_OR_COMPANY_ID: realmId,
    ns: 'time-tracking-ui',
  };
  return {
    entityId,
    optInTuples: [
      {
        experimentId: IXP_CONFIG[env]!.experimentId,
        treatmentId: IXP_CONFIG[env]!.treatmentId,
      },
    ],
  };
};

const useIxpDynamicOptOut = (sandbox: any) => {
  const requestBody = getRequestBody(sandbox);

  const optOutOfR1 = async () => {
    const result = await sandbox.experiments.optInUserToTreatmentsIL(
      requestBody,
    );
    sandbox.logger.info(`Opt out requested, status: ${result.status}`);
    const url = new URL(window.location.href);
    const pathname = url.pathname.replace('/app/', '');
    // Not able to reload using sandbox, it doesn't do a full page reload
    // Need the full page reload in order to get the new opt-out deploy config
    window.location.assign(`${pathname}/legacy${url.search}`);
  };

  return optOutOfR1;
};

export default useIxpDynamicOptOut;

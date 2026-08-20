import {
  Environment,
  ExperimentParams,
  TreatmentObject,
} from '@appfabric/sandbox-spec';
import { useEffect, useState } from 'react';
import { Sandbox } from 'src/js/common/sandbox';
import { IXP_CONFIG, IxpConfig } from 'src/js/common/ixpExperimentConfigs';
import { getRegion } from '../../ApolloClientBuilderUtils';

export interface IxpExperimentResult {
  isInTreatment: boolean;
  treatmentKey?: string;
  settled: boolean;
}

const getEnvFromSandbox = (sandbox: Sandbox): Environment =>
  sandbox.appContext.getEnvironment();

const getIxpConfig = (
  experimentNamespace: string,
  env: Environment,
): IxpConfig | null => {
  const experimentConfig = IXP_CONFIG[experimentNamespace];
  return experimentConfig?.[env] || null;
};

const loadIxpExperimentAssignments = (
  sandbox: Sandbox,
  experimentNamespace: string,
  namespace: string,
  businessUnit: string,
): Promise<TreatmentObject[]> => {
  const env = getEnvFromSandbox(sandbox);
  const config = getIxpConfig(experimentNamespace, env);

  if (!config) {
    return Promise.reject(
      new Error(
        `No IXP config found for experiment: ${experimentNamespace} in environment: ${env}`,
      ),
    );
  }

  const realmId = sandbox.appContext.getRealmInfo()?.realmId;
  const region = getRegion(sandbox);

  const payload: ExperimentParams = {
    businessUnit,
    entityId: {
      ns: namespace,
      REALM_OR_COMPANY_ID: realmId,
    },
    context: {
      region,
      companyCreationDate:
        // TODO WFS: need to find a better way to get the company creation date if sandbox.extensions.qbo.context.getCompanyInfo is not available.
        sandbox?.extensions?.qbo?.context?.getCompanyInfo()
          ?.companyCreateDateInServerLocale,
    },
    assignmentFilter: {
      experimentIds: [config.experimentId],
      applications: ['QBO', 'Zoltar'],
    },
    userOptions: {
      assetAlias: 'timecapture-timeentries-ui',
      includeCredentials: true,
    },
  };
  return sandbox.experiments.getRemoteExperimentAssignments(payload);
};

/**
 * Generic hook to load and check any IXP experiment
 * @param sandbox - The sandbox instance
 * @param experimentNamespace - The namespace of the experiment (defined in ixpExperimentConfigs)
 * @returns IxpExperimentResult with isInTreatment flag and treatmentKey
 */
export const useIxpExperiment = (
  sandbox: Sandbox,
  options: {
    experimentNamespace: string;
    namespace: string;
    businessUnit: string;
  },
): IxpExperimentResult => {
  const [experimentResult, setExperimentResult] = useState<IxpExperimentResult>(
    { isInTreatment: false, settled: false },
  );
  const { experimentNamespace, namespace, businessUnit } = options;

  useEffect(() => {
    const env = getEnvFromSandbox(sandbox);
    const config = getIxpConfig(experimentNamespace, env);

    if (!config) {
      sandbox.logger?.error(
        `No IXP config available for experiment: ${experimentNamespace} in environment: ${env}`,
      );
      setExperimentResult({ isInTreatment: false, settled: true });
      return;
    }

    loadIxpExperimentAssignments(
      sandbox,
      experimentNamespace,
      namespace,
      businessUnit,
    )
      .then((assignments) => {
        const assignment = assignments?.[0];
        const result: IxpExperimentResult = {
          isInTreatment: assignment?.treatmentKey === config.treatmentKey,
          treatmentKey: assignment?.treatmentKey,
          settled: true,
        };

        setExperimentResult(result);
        sandbox.logger?.log(
          `IXP experiment "${experimentNamespace}" initialized: isInTreatment=${result.isInTreatment}, treatmentKey=${result.treatmentKey}`,
        );
      })
      .catch((error) => {
        sandbox.logger?.error(
          `Error initializing IXP experiment "${experimentNamespace}":`,
          error,
        );
        setExperimentResult({ isInTreatment: false, settled: true });
      });
  }, [sandbox, experimentNamespace, namespace, businessUnit]);

  return experimentResult;
};

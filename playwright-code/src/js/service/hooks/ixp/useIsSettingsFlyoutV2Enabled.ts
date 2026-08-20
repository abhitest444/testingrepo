import { Sandbox } from 'src/js/common/sandbox';
import { SETTINGS_FLYOUT_V2_NAMESPACE } from 'src/js/common/ixpExperimentConfigs';
import {
  IxpExperimentResult,
  useIxpExperiment,
} from 'src/js/service/hooks/ixp/useIxpExperiment';

export interface SettingsFlyoutV2Result {
  isSettingsFlyoutV2Enabled: IxpExperimentResult['isInTreatment'];
  settled: IxpExperimentResult['settled'];
}

export const useIsSettingsFlyoutV2Enabled = (
  sandbox: Sandbox,
): SettingsFlyoutV2Result => {
  const { isInTreatment, settled } = useIxpExperiment(sandbox, {
    experimentNamespace: SETTINGS_FLYOUT_V2_NAMESPACE,
    namespace: 'timecapture-timeentries-ui',
    businessUnit: 'SBSEG',
  });

  return { isSettingsFlyoutV2Enabled: isInTreatment, settled };
};

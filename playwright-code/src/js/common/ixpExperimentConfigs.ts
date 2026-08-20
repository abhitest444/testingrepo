import { Environment } from '@appfabric/sandbox-spec';

export interface IxpConfig {
  experimentId: number;
  treatmentKey: string;
}

export const UNIFICATION_EXPERIMENT_NAMESPACE = 'qbtime-freeData-unification';
export const SETTINGS_FLYOUT_V2_NAMESPACE = 'qbtime-settings-flyout-v2';
export const WEEKLY_IMPORT_PRICING_NAMESPACE =
  'time-agent-import-weekly-timesheet-pricing';
export const DIMENSIONS_EDITABILITY_NAMESPACE =
  'qbo-payroll-enable-dimensions-editability-with-time';

export const IXP_CONFIG: Partial<
  Record<string, Partial<Record<Environment, IxpConfig>>>
> = {
  [UNIFICATION_EXPERIMENT_NAMESPACE]: {
    [Environment.PROD]: {
      experimentId: 272706,
      treatmentKey: 'IXP2_T_1059480',
    },
    [Environment.E2E]: {
      experimentId: 485059,
      treatmentKey: 'IXP2_T_1059480',
    },
    [Environment.PERF]: {
      experimentId: 485059,
      treatmentKey: 'IXP2_T_1059480',
    },
    [Environment.QA]: {
      experimentId: 485059,
      treatmentKey: 'IXP2_T_1059480',
    },
  },
  [SETTINGS_FLYOUT_V2_NAMESPACE]: {
    [Environment.E2E]: {
      experimentId: 574127,
      treatmentKey: 'IXP2_T_1246259',
    },
    [Environment.PROD]: {
      experimentId: 332324,
      treatmentKey: 'IXP1_T_725977',
    },
  },
  [WEEKLY_IMPORT_PRICING_NAMESPACE]: {
    [Environment.E2E]: {
      experimentId: 602269,
      treatmentKey: 'IXP2_T_1306007', // CONTROL key — isInTreatment=true means CONTROL (no redirect)
    },
    [Environment.PROD]: {
      experimentId: 602269,
      treatmentKey: 'IXP2_T_1306007',
    },
    [Environment.PERF]: {
      experimentId: 602269,
      treatmentKey: 'IXP2_T_1306007',
    },
    [Environment.QA]: {
      experimentId: 602269,
      treatmentKey: 'IXP2_T_1306007',
    },
  },
  [DIMENSIONS_EDITABILITY_NAMESPACE]: {
    [Environment.PROD]: {
      experimentId: 349269,
      treatmentKey: 'IXP2_T_1343778',
    },
    [Environment.E2E]: {
      experimentId: 620237,
      treatmentKey: 'IXP2_T_1343778',
    },
    [Environment.PERF]: {
      experimentId: 620237,
      treatmentKey: 'IXP2_T_1343778',
    },
    [Environment.QA]: {
      experimentId: 620237,
      treatmentKey: 'IXP2_T_1343778',
    },
  },
};

import React from 'react';

import {
  computeHasPayrollWithTSheet,
  computeHasTSheet,
} from 'src/js/service/hooks/entitlements/useGetEntitlements';
import { FEATURE_FLAGS } from 'src/js/common/constants';
import { useFeatureFlag } from 'src/js/service/utils/sandboxUtils';
import { TimeEntrySettingsHoc } from './TimeEntrySettings/TimeEntrySettingsHoc';
import { TimeActivitySettingsForm } from './TimeActivitySettings/TimeActivitySettingsForm';
import { SettingsTrowserKey } from '../constants';
import { useTimeTrackingSettingsContext } from '../context/TimeTrackingSettingsContext';

interface ITimeTrackingSettingsForm {
  type: string;
  onIsDirtyTimeForm?: (isDirty: boolean) => boolean;
  /** When set, open directly into the given trowser (standalone entry point). */
  trowserKey?: SettingsTrowserKey;
  /** Invoked when a standalone trowser (see `trowserKey`) is closed. */
  onClose?: () => void;
  /** Identifies the caller/context that launched this widget. */
  source?: string;
}

/**
 * This component is used to render the TimeTrackingSettingsForm based on SKUs.
 * It will render the TimeEntrySettingsHoc component if the user has TSheet Premium/Elite or Tsheets with Payroll along with IXP flag enabled.
 * Otherwise, it will render the TimeActivitySettingsForm component.
 */
export const TimeTrackingSettingsForm: React.FC<ITimeTrackingSettingsForm> = ({
  type,
  onIsDirtyTimeForm,
  trowserKey,
  onClose,
  source,
}) => {
  const { entitlements } = useTimeTrackingSettingsContext();

  const hasTSheets = computeHasTSheet(entitlements);
  const hasPayroll = computeHasPayrollWithTSheet(entitlements);
  const isFeatureFlagEnableForTSheet = useFeatureFlag(
    FEATURE_FLAGS.QB_GLOBAL_SETTINGS_TIME_TRACKING_UI_T_SHEET,
  );
  const isFeatureFlagEnableForQbt = useFeatureFlag(
    FEATURE_FLAGS.QB_GLOBAL_SETTINGS_TIME_TRACKING_UI_T_SHEET_QBT,
  );

  return (
    <>
      {(hasTSheets || hasPayroll) &&
      (isFeatureFlagEnableForTSheet || isFeatureFlagEnableForQbt) ? (
        <TimeEntrySettingsHoc
          type={type}
          onIsDirtyTimeForm={onIsDirtyTimeForm}
          trowserKey={trowserKey}
          onClose={onClose}
          source={source}
        />
      ) : (
        <TimeActivitySettingsForm onIsDirtyTimeForm={onIsDirtyTimeForm} />
      )}
    </>
  );
};

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Theme } from '@design-systems/theme';
import { useIsSettingsFlyoutV2Enabled } from 'src/js/service/hooks/ixp/useIsSettingsFlyoutV2Enabled';
import {
  computeHasPayrollWithTSheet,
  computeHasTSheet,
} from 'src/js/service/hooks/entitlements/useGetEntitlements';
import { useFeatureFlag } from 'src/js/common/hooks/useFeatureFlag';
import { FEATURE_FLAGS } from 'src/js/common/constants';
import MaintenancePage from 'src/js/common/components/MaintenancePage/MaintenancePage';
import {
  getListType,
  isSimpleStartCompany,
} from '../../../service/utils/sandboxUtils';
import { SettingsTrowserKey } from '../constants';
import { useTimeTrackingSettingsContext } from '../context/TimeTrackingSettingsContext';
import { TimeTrackingSettingsForm } from './TimeTrackingSettingsForm';
import { SettingsFlyoutV2 } from './SettingsFlyoutV2';

interface ITimeTrackingSettingsHOC {
  onIsDirtyTimeForm?: (isDirty: boolean) => boolean;
  /** When set, open directly into the given trowser (standalone entry point). */
  trowserKey?: SettingsTrowserKey;
  /** Invoked when a standalone trowser (see `trowserKey`) is closed. */
  onClose?: () => void;
  /** Identifies the caller/context that launched this widget. */
  source?: string;
}

const TimeTrackingForm = styled.div`
  padding: 25px;
`;

export const TimeTrackingSettingsHOC: React.FC<ITimeTrackingSettingsHOC> = ({
  onIsDirtyTimeForm,
  trowserKey,
  onClose,
  source,
}) => {
  const { sandbox, entitlements } = useTimeTrackingSettingsContext();
  const { isSettingsFlyoutV2Enabled, settled } =
    useIsSettingsFlyoutV2Enabled(sandbox);
  const [isSimpleStart, setIsSimpleStart] = useState<boolean | null>(null);

  const isFullPageMaintenanceEnabled = useFeatureFlag(
    FEATURE_FLAGS.SBSEG_QBO_QBTIME_MAINTENANCE_FULL_PAGE,
    false,
  );

  useEffect(() => {
    isSimpleStartCompany(sandbox).then(setIsSimpleStart);
  }, [sandbox]);

  const hasQBTime =
    computeHasTSheet(entitlements) || computeHasPayrollWithTSheet(entitlements);

  // Wait for all async checks to resolve before deciding which UI to render
  if (!settled || isSimpleStart === null) {
    return null;
  }

  // Show maintenance page if feature flag is enabled
  if (isFullPageMaintenanceEnabled) {
    return <MaintenancePage />;
  }

  /**
   * Only show the new settings flyout if the following conditions are met:
   * 1. IXP experiment is enabled
   * 2. Company is a SimpleStart company
   * 3. Company does not have QBTime entitlement or Payroll Premium/Elite (with time)
   * */
  const shouldShowV2 = isSettingsFlyoutV2Enabled && isSimpleStart && !hasQBTime;

  if (shouldShowV2) {
    return (
      <Theme>
        <TimeTrackingForm>
          <SettingsFlyoutV2 />
        </TimeTrackingForm>
      </Theme>
    );
  }

  return (
    <>
      <Theme>
        <TimeTrackingForm>
          <TimeTrackingSettingsForm
            type={getListType(sandbox)}
            onIsDirtyTimeForm={onIsDirtyTimeForm}
            trowserKey={trowserKey}
            onClose={onClose}
            source={source}
          />
        </TimeTrackingForm>
      </Theme>
    </>
  );
};

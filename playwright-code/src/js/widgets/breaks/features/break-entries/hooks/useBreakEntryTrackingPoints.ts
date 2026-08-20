import { useMemo } from 'react';
import { useSandbox } from '@payroll/quicksand';
import { QuickbooksOnlineSandbox } from '@appfabric/sandbox-spec';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';
import {
  BREAKS_TRACKING_POINTS,
  WFS_BREAKS_TRACKING_POINTS,
} from '../../../constants';

/**
 * Hook to get the appropriate break entry tracking points based on environment
 * Returns QBO tracking points for QBO environment or WFS tracking points for Workforce environment
 * @returns The appropriate TrackingPoints object for the current environment
 */
export const useBreakEntryTrackingPoints = () => {
  const sandbox = useSandbox();
  const isWorkforce = isWorkforceEnvironment(
    sandbox as QuickbooksOnlineSandbox,
  );

  const trackingPoints = useMemo(
    () => (isWorkforce ? WFS_BREAKS_TRACKING_POINTS : BREAKS_TRACKING_POINTS),
    [isWorkforce],
  );

  return trackingPoints;
};

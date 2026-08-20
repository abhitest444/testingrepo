import { useMemo } from 'react';
import { useSandbox } from '@payroll/quicksand';
import { QuickbooksOnlineSandbox } from '@appfabric/sandbox-spec';
import { getTimeClockTrackingPoints } from 'src/js/common/useClickTracking';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';

/**
 * Hook to get the appropriate time clock tracking points based on environment
 * @returns The appropriate TrackingPoints object for the current environment
 */
export const useTimeClockTrackingPoints = () => {
  const sandbox = useSandbox();
  const isWorkforce = isWorkforceEnvironment(
    sandbox as QuickbooksOnlineSandbox,
  );

  const trackingPoints = useMemo(
    () => getTimeClockTrackingPoints({ isWorkforce }),
    [isWorkforce],
  );

  return trackingPoints;
};

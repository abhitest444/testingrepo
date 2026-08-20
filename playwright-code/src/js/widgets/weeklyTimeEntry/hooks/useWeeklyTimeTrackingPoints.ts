import { useMemo } from 'react';
import { useSandbox } from '@payroll/quicksand';
import { QuickbooksOnlineSandbox } from '@appfabric/sandbox-spec';
import { getWeeklyTimeTrackingPoints } from 'src/js/common/useClickTracking';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';

/**
 * Hook to get the appropriate weekly time tracking points based on environment
 * @returns The appropriate TrackingPoints object for the current environment
 */
export const useWeeklyTimeTrackingPoints = () => {
  const sandbox = useSandbox();
  const isWorkforce = isWorkforceEnvironment(
    sandbox as QuickbooksOnlineSandbox,
  );

  const trackingPoints = useMemo(
    () => getWeeklyTimeTrackingPoints({ isWorkforce }),
    [isWorkforce],
  );

  return trackingPoints;
};

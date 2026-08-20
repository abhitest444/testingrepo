import { useMemo } from 'react';
import { useSandbox } from '@payroll/quicksand';
import { QuickbooksOnlineSandbox } from '@appfabric/sandbox-spec';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';
import { getWhosWorkingTrackingPoints } from '../whosWorkingTrackingPoints';

/**
 * Hook to get the appropriate Who's Working tracking points based on environment
 * @returns The appropriate TrackingPoints object for the current environment
 */
export const useWhosWorkingTrackingPoints = () => {
  const sandbox = useSandbox();
  const isWorkforce = isWorkforceEnvironment(
    sandbox as QuickbooksOnlineSandbox,
  );

  const trackingPoints = useMemo(
    () => getWhosWorkingTrackingPoints({ isWorkforce }),
    [isWorkforce],
  );

  return trackingPoints;
};

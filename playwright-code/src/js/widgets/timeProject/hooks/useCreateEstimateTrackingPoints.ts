import { useMemo } from 'react';
import { useSandbox } from '@payroll/quicksand';
import { QuickbooksOnlineSandbox } from '@appfabric/sandbox-spec';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';
import { getCreateEstimateTrackingPoints } from '../utils/timeProjectTrackingPoints';

/**
 * Hook to get the appropriate Create Estimate tracking points based on environment
 * @returns The appropriate TrackingPoints object for the current environment
 */
export const useCreateEstimateTrackingPoints = () => {
  const sandbox = useSandbox();
  const isWorkforce = isWorkforceEnvironment(
    sandbox as QuickbooksOnlineSandbox,
  );

  const trackingPoints = useMemo(
    () => getCreateEstimateTrackingPoints({ isWorkforce }),
    [isWorkforce],
  );

  return trackingPoints;
};

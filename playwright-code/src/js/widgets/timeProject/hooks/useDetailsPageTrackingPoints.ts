import { useMemo } from 'react';
import { useSandbox } from '@payroll/quicksand';
import { QuickbooksOnlineSandbox } from '@appfabric/sandbox-spec';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';
import { getDetailsPageTrackingPoints } from '../utils/timeProjectTrackingPoints';

/**
 * Hook to get the appropriate Details Page tracking points based on environment
 * @returns The appropriate TrackingPoints object for the current environment
 */
export const useDetailsPageTrackingPoints = () => {
  const sandbox = useSandbox();
  const isWorkforce = isWorkforceEnvironment(
    sandbox as QuickbooksOnlineSandbox,
  );

  const trackingPoints = useMemo(
    () => getDetailsPageTrackingPoints({ isWorkforce }),
    [isWorkforce],
  );

  return trackingPoints;
};

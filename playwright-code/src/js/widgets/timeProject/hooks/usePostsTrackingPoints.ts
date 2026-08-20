import { useMemo } from 'react';
import { useSandbox } from '@payroll/quicksand';
import { QuickbooksOnlineSandbox } from '@appfabric/sandbox-spec';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';
import { getPostsTrackingPoints } from '../utils/timeProjectTrackingPoints';

/**
 * Hook to get the appropriate Posts tracking points based on environment
 * @returns The appropriate TrackingPoints object for the current environment
 */
export const usePostsTrackingPoints = () => {
  const sandbox = useSandbox();
  const isWorkforce = isWorkforceEnvironment(
    sandbox as QuickbooksOnlineSandbox,
  );

  const trackingPoints = useMemo(
    () => getPostsTrackingPoints({ isWorkforce }),
    [isWorkforce],
  );

  return trackingPoints;
};

import { useMemo } from 'react';
import { useSandbox } from '@payroll/quicksand';
import { QuickbooksOnlineSandbox } from '@appfabric/sandbox-spec';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';
import { getLandingPageTrackingPoints } from '../utils/timeProjectTrackingPoints';

/**
 * Hook to get the appropriate Landing Page tracking points based on environment
 * @returns The appropriate TrackingPoints object for the current environment
 */
export const useLandingPageTrackingPoints = () => {
  const sandbox = useSandbox();
  const isWorkforce = isWorkforceEnvironment(
    sandbox as QuickbooksOnlineSandbox,
  );

  const trackingPoints = useMemo(
    () => getLandingPageTrackingPoints({ isWorkforce }),
    [isWorkforce],
  );

  return trackingPoints;
};

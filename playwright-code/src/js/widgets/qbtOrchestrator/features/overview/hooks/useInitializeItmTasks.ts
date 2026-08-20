import { useEffect, useRef } from 'react';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';
import { FEATURE_FLAGS } from 'src/js/common/constants';
import { useGetItmTasks } from './useGetItmTasks';
import { OVERVIEW_LOGGING } from '../constants';

export const useInitializeItmTasks = () => {
  const { getItmTasks, tasks, isLoading, error } = useGetItmTasks();
  const getItmTasksRef = useRef(getItmTasks);
  const logger = useLoggingConfig();

  const { isEnabled: isOverviewModernisationEnabled, settled: flagSettled } =
    useIXPFeatureFlag({
      flagName: FEATURE_FLAGS.SBSEG_QBO_QBTIME_OVERVIEW_MODERNISATION,
      defaultValue: false,
    });

  useEffect(() => {
    getItmTasksRef.current = getItmTasks;
  }, [getItmTasks]);

  useEffect(() => {
    if (!flagSettled) return;

    if (isOverviewModernisationEnabled) {
      logger.info(OVERVIEW_LOGGING.FEATURE_MOUNTED, {
        feature: 'ITM_TASKS_INITIALIZATION',
        enabled: true,
      });
      getItmTasksRef.current();
    } else {
      logger.info(OVERVIEW_LOGGING.FEATURE_MOUNTED, {
        feature: 'ITM_TASKS_INITIALIZATION',
        enabled: false,
        reason: 'Feature flag disabled',
      });
    }
  }, [flagSettled, isOverviewModernisationEnabled, logger]);

  return {
    tasks,
    isLoading,
    error,
    isFeatureEnabled: isOverviewModernisationEnabled,
  };
};

export default useInitializeItmTasks;

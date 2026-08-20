import React, { lazy, Suspense, useEffect } from 'react';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import { TimeEntryNumberField } from 'src/js/service/hooks/settings/useGetQLSettings';
import { storeManager } from '../../store/storeManager';
import { timeKioskReducer } from './store';
import { FUNCTIONALITY_NAMES, ORCHESTRATOR_LOGGING } from '../../constants';

const TimeKioskSettingsHandle = lazy(
  () => import('./components/TimeKioskSettingsHandle'),
);

interface TimeKioskFeatureProps {
  functionality?: string;
  isEditable?: boolean;
  isNewBadgeVisibleTillDate?: string;
  inactivityTimeout?: TimeEntryNumberField;
  isQLSettingsLoading?: boolean;
}

const TimeKioskFeature: React.FC<TimeKioskFeatureProps> = ({
  functionality = FUNCTIONALITY_NAMES.KIOSK_SETTINGS_HANDLE,
  isEditable,
  isNewBadgeVisibleTillDate,
  inactivityTimeout,
  isQLSettingsLoading,
}) => {
  const logger = useLoggingConfig();

  useEffect(() => {
    if (!storeManager.hasReducer('timeKiosk')) {
      storeManager.inject('timeKiosk', timeKioskReducer);
      logger.info(ORCHESTRATOR_LOGGING.REDUCER_INJECTED, {
        feature: 'time-kiosk',
      });
    }
  }, [logger]);

  useEffect(() => {
    logger.info(ORCHESTRATOR_LOGGING.FEATURE_LOADED, {
      feature: 'time-kiosk',
      functionality,
    });
  }, [logger, functionality]);

  const renderContent = () => {
    switch (functionality) {
      case FUNCTIONALITY_NAMES.KIOSK_SETTINGS_HANDLE:
        return (
          <TimeKioskSettingsHandle
            isEditable={isEditable}
            isNewBadgeVisibleTillDate={isNewBadgeVisibleTillDate}
            inactivityTimeout={inactivityTimeout}
            isQLSettingsLoading={isQLSettingsLoading}
          />
        );
      default:
        return null;
    }
  };

  return <Suspense fallback={null}>{renderContent()}</Suspense>;
};

export default TimeKioskFeature;

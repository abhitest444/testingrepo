import React, { lazy, Suspense, useEffect } from 'react';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import { storeManager } from '../../store/storeManager';
import { overtimeReducer } from './store';
import { OVERTIME_LOGGING } from './constants/overtimeLoggingConstants';
import { ORCHESTRATOR_LOGGING, FUNCTIONALITY_NAMES } from '../../constants';
import { OvertimeInitialViewOptions } from './types/Overtime.types';

const OvertimeSettingsHandle = lazy(
  () => import('./components/OvertimeSettingsHandle'),
);

const OvertimeLandingPage = lazy(
  () => import('./components/OvertimeLandingPage'),
);

interface OvertimeFeatureProps {
  functionality?: string;
  isEditable?: boolean;
  isNewBadgeVisibleTillDate?: string;
  onClose?: () => void;
  /** Initial view for deep-linking navigation */
  initialView?: OvertimeInitialViewOptions | null;
}

/**
 * Overtime Feature - Handles overtime-related functionality
 */
const OvertimeFeature: React.FC<OvertimeFeatureProps> = ({
  functionality = FUNCTIONALITY_NAMES.SETTINGS_HANDLE,
  isEditable,
  isNewBadgeVisibleTillDate,
  onClose,
  initialView,
}) => {
  const logger = useLoggingConfig();

  // Inject reducer on mount
  useEffect(() => {
    if (!storeManager.hasReducer('overtime')) {
      storeManager.inject('overtime', overtimeReducer);
      logger.info(ORCHESTRATOR_LOGGING.REDUCER_INJECTED, {
        feature: 'overtime',
      });
    }
  }, [logger]);

  // Log component mount
  useEffect(() => {
    logger.info(OVERTIME_LOGGING.FEATURE_MOUNTED, {
      functionality,
    });
  }, [logger, functionality]);

  const renderContent = () => {
    switch (functionality) {
      case FUNCTIONALITY_NAMES.SETTINGS_HANDLE:
        return (
          <OvertimeSettingsHandle
            isEditable={isEditable}
            newBadgeVisibleTillDate={isNewBadgeVisibleTillDate}
            initialView={initialView}
          />
        );
      case FUNCTIONALITY_NAMES.LANDING_PAGE:
        return <OvertimeLandingPage onClose={onClose} />;
      case FUNCTIONALITY_NAMES.SETUP_POLICY:
        return <div>Overtime Setup Policy (Coming Soon)</div>;
      case FUNCTIONALITY_NAMES.POLICY_DETAILS:
        return <div>Overtime Policy Details (Coming Soon)</div>;
      default:
        logger.error(OVERTIME_LOGGING.UNKNOWN_FUNCTIONALITY, {
          functionality,
        });
        return <div>Unknown overtime functionality: {functionality}</div>;
    }
  };

  return <Suspense fallback={null}>{renderContent()}</Suspense>;
};

export default OvertimeFeature;

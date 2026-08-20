import React, { useEffect } from 'react';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import { OVERVIEW_LOGGING } from './constants/overviewLoggingConstants';

interface OverviewFeatureProps {
  children?: React.ReactNode;
}

const OverviewFeature: React.FC<OverviewFeatureProps> = ({ children }) => {
  const logger = useLoggingConfig();

  useEffect(() => {
    logger.info(OVERVIEW_LOGGING.FEATURE_MOUNTED);
  }, [logger]);

  return <>{children}</>;
};

export default OverviewFeature;

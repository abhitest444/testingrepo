import React, { useEffect } from 'react';
import { useIntl } from '@payroll/quicksand';
import TTOAddTimeDetails from 'src/js/widgets/ttoHomePage/features/details-page/TTOAddTimeDetails';
import TTOHomePage from 'src/js/widgets/ttoHomePage/features/home-page/TTOHomePage';
import TTOUnauthorizedAccess from 'src/js/widgets/ttoHomePage/features/error/TTOUnauthorizedAccess';

import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import { useTTOContext } from './context/TTOContext';
import { TTO_HOME_FEATURE, TTO_HOME_FUNCTIONALITY_DETAILS } from './constants';

interface TTOFeatureRendererProps {
  options: any;
  routeInfo: any;
  sandbox: any;
  showAddTimeDetails: boolean;
  onBack: () => void;
  onAddTime: () => void;
  onView: () => void;
}

const TTOFeatureRenderer: React.FC<TTOFeatureRendererProps> = ({
  options,
  routeInfo,
  sandbox,
  showAddTimeDetails,
  onBack,
  onAddTime,
  onView,
}) => {
  const { isExpenseEnabled, isAuthorized, authLoading } = useTTOContext();
  const intl = useIntl();
  const logger = useLoggingConfig();

  useEffect(() => {
    logger.info('TTOFeatureRenderer rendered', {
      options,
      routeInfo,
      isAuthorized,
      authLoading,
    });
  }, [options, routeInfo, isAuthorized, authLoading, logger]);

  // Check authorization - if not authorized, show unauthorized screen
  if (!isAuthorized) {
    return <TTOUnauthorizedAccess />;
  }

  // If expense management is enabled, check route params
  if (isExpenseEnabled && routeInfo?.params?.detailsPage === 'time') {
    return (
      <TTOAddTimeDetails
        onBack={onBack}
        sandbox={sandbox}
        data-testid="tto-feature-renderer-add-time-details"
      />
    );
  }

  // If expense management is not enabled, show details page by default without back button
  if (!isExpenseEnabled) {
    return (
      <TTOAddTimeDetails
        sandbox={sandbox}
        data-testid="tto-feature-renderer-add-time-details"
      />
    );
  }

  if (showAddTimeDetails) {
    return (
      <TTOAddTimeDetails
        onBack={onBack}
        sandbox={sandbox}
        data-testid="tto-feature-renderer-add-time-details"
      />
    );
  }

  if (!options || !options.feature) {
    return (
      <TTOHomePage
        onAddTime={onAddTime}
        onView={onView}
        sandbox={sandbox}
        data-testid="tto-feature-renderer-home-page"
      />
    );
  }

  if (options.feature === TTO_HOME_FEATURE) {
    // If details page is requested, show TTOAddTimeDetails
    if (options.functionality === TTO_HOME_FUNCTIONALITY_DETAILS) {
      return (
        <TTOAddTimeDetails
          onBack={onBack}
          sandbox={sandbox}
          data-testid="tto-feature-renderer-add-time-details"
        />
      );
    }
    // Default to showing homepage
    return (
      <TTOHomePage
        onAddTime={onAddTime}
        onView={onView}
        sandbox={sandbox}
        data-testid="tto-feature-renderer-home-page"
      />
    );
  }

  return (
    <div data-testid="tto-feature-renderer-unknown-feature">
      {intl.formatMessage({ id: 'unknown.feature.type' })}
    </div>
  );
};

export default TTOFeatureRenderer;

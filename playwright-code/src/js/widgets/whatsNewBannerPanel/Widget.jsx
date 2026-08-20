import React from 'react';
import { QuicksandProvider } from '@payroll/quicksand'; // eslint-disable-next-line import/no-extraneous-dependencies
import BaseWidget from 'web-shell-core/widgets/BaseWidget';
import { withBaseWidget } from '@core-app/variability-sync-sdk';
import WayBackWhatsNewContainer from 'src/js/widgets/common/WayBackWhatsNewContainer';
import {
  SINGLE_TIME_TRACKING_POINTS,
  WEEKLY_TIME_TRACKING_POINTS,
} from 'src/js/common/useClickTracking';
import nlsLoader from 'src/nls';

const TRACKING_POINTS_MAP = {
  single_time_activity: SINGLE_TIME_TRACKING_POINTS,
  weekly_timesheet: WEEKLY_TIME_TRACKING_POINTS,
};

const getTrackingPoints = (widgetId) => {
  const widgetTrackingPoints = TRACKING_POINTS_MAP[widgetId];
  const { SEE_WHATS_NEW } = widgetTrackingPoints;
  const { screen } = SEE_WHATS_NEW;

  return {
    ...widgetTrackingPoints,
    SEE_WHATS_NEW: {
      ...SEE_WHATS_NEW,
      screen: `${screen}_legacy`,
    },
  };
};

/** Basic plugin class */
class Widget extends BaseWidget {
  /**
   * Mounts the component, see React docs.
   * @returns {void}
   */
  componentDidMount() {
    const { sandbox } = this.props;
    this.ready();
    sandbox.logger.log("timetrackingui what's new widget mounted.");
  }

  componentDidCatch(error) {
    this.props.sandbox.logger.error(
      'Plugin=time-tracking-ui Error=WHATS_NEW_BANNER_PANEL_WIDGET_CRASH',
      { error },
    );
    this.props.onError?.(error);
  }

  /**
   * Renders the plugin
   * We use the image that we imported above so it is handled in the browser when the plugin is loaded
   * @returns {void}
   */
  render() {
    const { sandbox, selector, widgetId } = this.props;
    const trackingPoints = getTrackingPoints(widgetId);

    return (
      <QuicksandProvider
        sandbox={sandbox}
        nlsLoader={nlsLoader.requireNlsForLocale('timeTrackingUI')}
      >
        <WayBackWhatsNewContainer
          selector={selector}
          trackingPoints={trackingPoints}
          comingSoon
        />
      </QuicksandProvider>
    );
  }
}

export default withBaseWidget(Widget);

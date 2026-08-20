import React from 'react';
import { ApolloProvider } from '@apollo/client';
import { QuicksandProvider } from '@payroll/quicksand';
import { withBaseWidget } from '@core-app/variability-sync-sdk';
import BaseWidget from 'web-shell-core/widgets/BaseWidget';
import { Provider as ReduxProvider } from 'react-redux';

import { getApolloClientInstance } from 'src/js/service/ApolloClientBuilder';
import { LoggingConfigProvider } from 'src/js/providers/LoggingConfigProvider';
import { TimeTrackingSettingsProvider } from 'src/js/widgets/timeTrackingSettings/context/TimeTrackingSettingsContext';
// eslint-disable-next-line import/no-unresolved
import { TimeTrackingSettingsHOC } from 'src/js/widgets/timeTrackingSettings/components/TimeTrackingSettingsHOC';
import store from 'src/js/widgets/timeTrackingSettings/store';
import nlsLoader from 'src/nls';

/** Basic plugin class */
class Widget extends BaseWidget {
  /**
   * Mounts the component, see React docs.
   * @returns {void}
   */
  componentDidMount() {
    const { sandbox } = this.props;
    this.ready();
    sandbox.logger.log('Timetrackingsettings mounted.');
  }

  componentDidCatch(error) {
    this.props.sandbox.logger.error(
      'Plugin=time-tracking-ui Error=TIME_TRACKING_SETTINGS_WIDGET_CRASH',
      { error },
    );
    this.props.onError?.(error);
  }

  render() {
    const {
      sandbox,
      externalApolloClient,
      onIsDirty,
      trowserKey,
      onClose,
      source,
    } = this.props;
    const client = externalApolloClient ?? getApolloClientInstance(sandbox);

    return (
      <ReduxProvider store={store}>
        <QuicksandProvider
          sandbox={sandbox}
          nlsLoader={nlsLoader.requireNlsForLocale([
            'timeTrackingSettings',
            'assignments',
            'assignmentDrawer',
          ])}
        >
          <LoggingConfigProvider
            sandbox={sandbox}
            prefix="TimeTrackingSettingsWidget"
          >
            <ApolloProvider client={client}>
              <TimeTrackingSettingsProvider>
                <TimeTrackingSettingsHOC
                  onIsDirtyTimeForm={onIsDirty}
                  trowserKey={trowserKey}
                  onClose={onClose}
                  source={source}
                />
              </TimeTrackingSettingsProvider>
            </ApolloProvider>
          </LoggingConfigProvider>
        </QuicksandProvider>
      </ReduxProvider>
    );
  }
}

export default withBaseWidget(Widget);

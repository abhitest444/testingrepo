import React, { Suspense } from 'react';
import { ApolloProvider } from '@apollo/client';
import { QuicksandProvider } from '@payroll/quicksand';
import BaseWidget from 'web-shell-core/widgets/BaseWidget';
import { ThemeProvider } from '@design-systems/theme';
import { Provider } from 'react-redux';
import nlsLoader from 'src/nls';
import { getApolloClientInstance } from 'src/js/service/ApolloClientBuilder';
import { WidgetProps } from 'src/js/types';
import { LoggingConfigProvider } from 'src/js/providers/LoggingConfigProvider';
import {
  BreaksWidgetOptions,
  BREAK_SETTINGS_FEATURE,
  BREAK_SETTINGS_FUNCTIONALITY,
  BREAK_SETTINGS_PREFERENCES_TROWSER_PROPS,
} from './types';
import store from './store';
import BreaksContent from './components/BreaksContent';
import { BREAK_LOGGING_CONSTANTS } from './constants';

interface BreaksProps {
  // in case any additional props are needed
  onError?: (error: Error | string) => void;
  employeeId?: string | null;
}

/** Basic plugin class */
export default class BreaksWidget extends BaseWidget<
  WidgetProps<BreaksProps, BREAK_SETTINGS_FEATURE, BREAK_SETTINGS_FUNCTIONALITY>
> {
  componentDidMount() {
    const { sandbox } = this.props;
    this.ready();
    sandbox.logger.info(
      BREAK_LOGGING_CONSTANTS.NAVIGATION.BREAKS_WIDGET_MOUNTED,
    );
  }

  componentDidCatch(error: Error) {
    this.props.sandbox.logger.error(
      'Plugin=time-tracking-ui Error=BREAKS_WIDGET_CRASH',
      { error },
    );
    this.props.onError?.(error);
  }

  render() {
    const { sandbox, externalApolloClient, options, employeeId } = this.props;
    const client = externalApolloClient ?? getApolloClientInstance(sandbox);

    if (!client) {
      sandbox.logger.error(
        BREAK_LOGGING_CONSTANTS.API_ERRORS.APOLLO_CLIENT_NOT_INITIALIZED,
      );
      return <div>Error: Apollo client not initialized</div>;
    }

    return (
      <QuicksandProvider
        sandbox={sandbox}
        nlsLoader={
          nlsLoader.requireNlsForLocale(['breaks', 'timeTrackingUI']) as any
        }
      >
        <LoggingConfigProvider sandbox={sandbox} prefix="BreaksWidget">
          <ThemeProvider>
            <ApolloProvider client={client}>
              <Provider store={store}>
                <Suspense fallback={null}>
                  <div className="breaks-widget">
                    <BreaksContent
                      options={options as BreaksWidgetOptions}
                      employeeId={employeeId}
                    />
                  </div>
                </Suspense>
              </Provider>
            </ApolloProvider>
          </ThemeProvider>
        </LoggingConfigProvider>
      </QuicksandProvider>
    );
  }
}

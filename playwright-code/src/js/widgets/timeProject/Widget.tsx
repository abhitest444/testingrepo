import React from 'react';
import { Provider } from 'react-redux';
import { ApolloProvider } from '@apollo/client';
import { QuicksandProvider } from '@payroll/quicksand';
import BaseWidget from 'web-shell-core/widgets/BaseWidget';
import nlsLoader from 'src/nls';
import { LoggingConfigProvider } from 'src/js/providers/LoggingConfigProvider';
import { WidgetProps } from 'src/js/types';
import { getTimeProjectApolloClient } from './apollo/TimeProjectApolloClient';
import store from './store';
import ErrorBoundary from './ErrorBoundary';
import TimeProject from './TimeProject';
import { TIME_PROJECT_LOGGING_CONSTANTS } from './constants';

interface TimeProjectProps {
  workerId?: string | null;
}

class Widget extends BaseWidget<WidgetProps<TimeProjectProps, string, string>> {
  componentDidMount() {
    const { sandbox } = this.props;
    this.ready();
    // Splunk dashboard derives unique-companies from this mount log; the
    // platform pipeline already attaches companyId / realmId.
    sandbox.logger.info(
      TIME_PROJECT_LOGGING_CONSTANTS.NAVIGATION.TIME_PROJECT_WIDGET_MOUNTED,
    );
  }

  render() {
    const { sandbox, workerId } = this.props;
    const client = getTimeProjectApolloClient(sandbox);

    if (!client) {
      sandbox.logger.error(
        TIME_PROJECT_LOGGING_CONSTANTS.API_ERRORS.APOLLO_CLIENT_NOT_INITIALIZED,
      );
      return <div>Error: Apollo client not initialized</div>;
    }

    return (
      <Provider store={store}>
        <QuicksandProvider
          sandbox={sandbox}
          nlsLoader={
            // Load `assignments` and `assignmentDrawer` alongside the
            // widget's own bundle because the worker assignment drawer is
            // mounted from inside this widget's React tree and needs both
            // (e.g. the "no group" label from `assignments`, and the
            // drawer chrome strings from `assignmentDrawer`).
            nlsLoader.requireNlsForLocale([
              'timeProject',
              'assignments',
              'assignmentDrawer',
            ]) as any
          }
        >
          <LoggingConfigProvider sandbox={sandbox} prefix="TimeProjectWidget">
            <ApolloProvider client={client}>
              <ErrorBoundary>
                <TimeProject workerId={workerId} />
              </ErrorBoundary>
            </ApolloProvider>
          </LoggingConfigProvider>
        </QuicksandProvider>
      </Provider>
    );
  }
}

export default Widget;

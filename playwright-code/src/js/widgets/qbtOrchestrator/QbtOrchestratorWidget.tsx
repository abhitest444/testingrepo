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
import ADSProvider from 'src/js/providers/ADSProvider';

import { storeManager } from './store/storeManager';
import { OrchestratorFeature, OrchestratorScreen } from './types';
import { ORCHESTRATOR_LOGGING } from './constants';
import ErrorBoundary from './components/ErrorBoundary';
import FeatureRouter from './components/FeatureRouter';

interface OrchestratorProps {
  onError?: (error: Error | string) => void;
}

/**
 * QbtOrchestrator Widget
 *
 * Unified umbrella widget for time-tracking features with:
 * - Dynamic reducer injection
 * - Centralized Redux store
 * - Lazy-loaded feature components
 */
export default class QbtOrchestratorWidget extends BaseWidget<
  WidgetProps<OrchestratorProps, OrchestratorFeature, OrchestratorScreen>
> {
  componentDidMount() {
    const { sandbox, options } = this.props;
    this.ready();
    sandbox.logger.info(ORCHESTRATOR_LOGGING.WIDGET_MOUNTED, {
      feature: options.feature,
      functionality: options.functionality,
    });
  }

  componentDidCatch(error: Error) {
    this.props.sandbox.logger.error(ORCHESTRATOR_LOGGING.WIDGET_CRASH, {
      error,
    });

    this.props.onError?.(error);
  }

  render() {
    const { sandbox, externalApolloClient, options } = this.props;
    const client = externalApolloClient ?? getApolloClientInstance(sandbox);

    if (!client) {
      sandbox.logger.error(ORCHESTRATOR_LOGGING.APOLLO_CLIENT_ERROR);
      return <div>Error: Apollo client not initialized</div>;
    }

    return (
      <ErrorBoundary onError={this.props.onError} logger={sandbox.logger}>
        <QuicksandProvider
          sandbox={sandbox}
          nlsLoader={
            nlsLoader.requireNlsForLocale([
              'timeTrackingUI',
              'overtime',
              'approvals',
              'assignments',
              'assignmentDrawer',
              'groups',
              'workers',
              'timeKiosk',
            ]) as any
          }
        >
          <LoggingConfigProvider
            sandbox={sandbox}
            prefix={`QbtOrchestrator-${options.feature ?? 'unknown'}`}
          >
            <ThemeProvider>
              <ADSProvider>
                <ApolloProvider client={client}>
                  <Provider store={storeManager.store}>
                    <Suspense fallback={null}>
                      <div className="qbt-orchestrator">
                        <FeatureRouter {...options} />
                      </div>
                    </Suspense>
                  </Provider>
                </ApolloProvider>
              </ADSProvider>
            </ThemeProvider>
          </LoggingConfigProvider>
        </QuicksandProvider>
      </ErrorBoundary>
    );
  }
}

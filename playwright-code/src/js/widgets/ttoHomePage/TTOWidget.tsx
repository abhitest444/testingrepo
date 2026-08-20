import React, { Suspense } from 'react';
import { ApolloProvider } from '@apollo/client';
import { QuicksandProvider } from '@payroll/quicksand';
import BaseWidget from 'web-shell-core/widgets/BaseWidget';
import { ThemeProvider } from '@design-systems/theme';
import { getApolloClientInstance } from 'src/js/service/ApolloClientBuilder';
import TTOFeatureRenderer from 'src/js/widgets/ttoHomePage/TTOFeatureRenderer';
import nlsLoader from 'src/nls';
import { LoggingConfigProvider } from 'src/js/providers/LoggingConfigProvider';
import { TTOProvider } from './context/TTOContext';
import { TTOWidgetProps } from './types';
import {
  NAVIGATION_ROUTES,
  ERROR_APOLLO_CLIENT,
  NLS_LOCALE,
  TTO_HOMEPAGE_WIDGET_CLASS,
  LOG_WIDGET_MOUNTED,
} from './constants';

/** Basic plugin class */
export default class TTOWidget extends BaseWidget<TTOWidgetProps> {
  state = { showAddTimeDetails: false };

  handleAddTime = () => {
    const { sandbox } = this.props;
    sandbox.navigation.navigate(NAVIGATION_ROUTES.HOME_DETAILS_TIME);
  };

  handleView = () => {
    const { sandbox } = this.props;
    sandbox.navigation.navigate(NAVIGATION_ROUTES.HOME_DETAILS_TIME);
  };

  handleBack = () => {
    const { sandbox } = this.props;
    sandbox.navigation.navigate(NAVIGATION_ROUTES.HOME);
  };

  componentDidMount() {
    const { sandbox } = this.props;
    this.ready();
    sandbox.logger.log(LOG_WIDGET_MOUNTED);
  }

  componentDidCatch(error: Error) {
    this.props.sandbox.logger.error(
      'Plugin=time-tracking-ui Error=TTO_HOME_PAGE_WIDGET_CRASH',
      { error },
    );
    this.props.onError?.(error);
  }

  render() {
    const { sandbox, externalApolloClient, options, routeInfo } = this.props;
    const client = externalApolloClient ?? getApolloClientInstance(sandbox);

    if (!client) {
      return <div>{ERROR_APOLLO_CLIENT}</div>;
    }

    return (
      <QuicksandProvider
        sandbox={sandbox}
        nlsLoader={nlsLoader.requireNlsForLocale(NLS_LOCALE) as any}
      >
        <LoggingConfigProvider sandbox={sandbox} prefix="TimeTrackingOnly">
          <ThemeProvider>
            <ApolloProvider client={client}>
              <TTOProvider sandbox={sandbox} routeInfo={routeInfo}>
                <Suspense fallback={<>LOADING...</>}>
                  <div
                    className={TTO_HOMEPAGE_WIDGET_CLASS}
                    data-testid="tto-widget-container"
                  >
                    <TTOFeatureRenderer
                      options={options}
                      routeInfo={routeInfo}
                      sandbox={sandbox}
                      showAddTimeDetails={this.state.showAddTimeDetails}
                      onBack={this.handleBack}
                      onAddTime={this.handleAddTime}
                      onView={this.handleView}
                    />
                  </div>
                </Suspense>
              </TTOProvider>
            </ApolloProvider>
          </ThemeProvider>
        </LoggingConfigProvider>
      </QuicksandProvider>
    );
  }
}

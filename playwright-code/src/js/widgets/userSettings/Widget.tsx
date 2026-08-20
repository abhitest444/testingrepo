import React from 'react';
import { Provider } from 'react-redux';
import { ApolloProvider } from '@apollo/client';
import { QuicksandProvider } from '@payroll/quicksand';
import BaseWidget from 'web-shell-core/widgets/BaseWidget';
import { ThemeProvider } from '@design-systems/theme';
import nlsLoader from 'src/nls';
import { getApolloClientInstance } from 'src/js/service/ApolloClientBuilder';
import { LoggingConfigProvider } from 'src/js/providers/LoggingConfigProvider';
import { TimeTracking_TimeForType } from 'src/__generated__/timeTracking/graphql';
import { decryptWorkerId } from './utils/helpers';
import UserSettingsPage from './components/UserSettingsPage';
import store from './store';
import {
  SettingsFor,
  UserSettingsWidgetProps,
} from './components/types/UserSettingsPage.types';

export default class UserSettingsWidget extends BaseWidget<UserSettingsWidgetProps> {
  componentDidMount() {
    const { sandbox } = this.props;
    this.ready();
    sandbox.logger.info('UserSettings widget mounted');
  }

  componentDidCatch(error: Error) {
    this.props.sandbox.logger.error(
      'Plugin=time-tracking-ui Error=USER_SETTINGS_WIDGET_CRASH',
      { error },
    );
    this.props.onError?.(error);
  }

  render() {
    const { sandbox, externalApolloClient, routeInfo } = this.props;
    const client = externalApolloClient ?? getApolloClientInstance(sandbox);

    if (!client) {
      sandbox.logger.error('APOLLO_CLIENT_NOT_INITIALIZED');
      return <div>Error: Apollo client not initialized</div>;
    }

    // Extract worker context from path parameters via routeInfo
    // URL format: /app/userSettings/:encryptedWorkerId/:workerType/:workerName
    // routeInfo is provided by web-shell framework based on config.json route definition
    const encryptedWorkerId = routeInfo?.params?.workerId || '';
    const workerType =
      routeInfo?.params?.workerType || TimeTracking_TimeForType.Employee;
    const workerName = routeInfo?.params?.workerName
      ? decodeURIComponent(routeInfo.params.workerName)
      : undefined;

    // Decrypt worker ID before utilization
    const workerId = decryptWorkerId(encryptedWorkerId);

    if (!workerId) {
      // Handle decryption failure - log error and show error state
      sandbox.logger.error('UserSettingsWidget: Failed to decrypt worker ID', {
        encryptedWorkerId,
      });
      return <div>Error: Something went wrong! Please try again later.</div>;
    }

    // Build settingsFor object from decrypted worker ID
    const settingsFor: SettingsFor = {
      id: workerId,
      timeForType: workerType,
      displayName: workerName,
    };

    return (
      <Provider store={store}>
        <QuicksandProvider
          sandbox={sandbox}
          nlsLoader={
            nlsLoader.requireNlsForLocale(['userSettings', 'overtime']) as any
          }
        >
          <LoggingConfigProvider sandbox={sandbox} prefix="UserSettingsWidget">
            <ThemeProvider>
              <ApolloProvider client={client}>
                <UserSettingsPage settingsFor={settingsFor} />
              </ApolloProvider>
            </ThemeProvider>
          </LoggingConfigProvider>
        </QuicksandProvider>
      </Provider>
    );
  }
}

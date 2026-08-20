import React from 'react';
import { ApolloProvider } from '@apollo/client';
import { QuicksandProvider } from '@payroll/quicksand'; // eslint-disable-next-line import/no-extraneous-dependencies
import { Provider } from 'react-redux';
import BaseWidget from 'web-shell-core/widgets/BaseWidget';
import { getApolloClientInstance } from 'src/js/service/ApolloClientBuilder';
import nlsLoader from 'src/nls';
import store from './store';
import TimeImportAgentic from './timeImportAgentic';
import ErrorBoundary from './ErrorBoundary';

/** Basic plugin class */
export default class Widget extends BaseWidget {
  /**
   * Mounts the component, see React docs.
   * @returns {void}
   */
  componentDidMount() {
    const { sandbox } = this.props;
    this.ready();
  }

  /**
   * Error boundary method to handle errors
   * @param {Error} error - The error that occurred
   * @returns {Object} State update to display error UI
   */
  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  /**
   * Error boundary method to log errors
   * @param {Error} error - The error that occurred
   * @param {Object} errorInfo - Additional error information
   */
  componentDidCatch(error, errorInfo) {
    // Log the error to console or error reporting service
    // eslint-disable-next-line no-console
    console.error('Time import agentic widget error:', error, errorInfo);
  }

  /**
   * Renders the plugin
   * We use the image that we imported above so it is handled in the browser when the plugin is loaded
   * @returns {void}
   */
  render() {
    const { sandbox, isTrowserOpen, onClose, externalApolloClient } =
      this.props;
    const client = externalApolloClient ?? getApolloClientInstance(sandbox);

    if (!client) {
      return <div>Error: Apollo client not initialized</div>;
    }

    return (
      <ErrorBoundary>
        <Provider store={store}>
          <QuicksandProvider
            sandbox={sandbox}
            nlsLoader={nlsLoader.requireNlsForLocale('timeTrackingUI')}
          >
            <ApolloProvider client={client}>
              <TimeImportAgentic
                isTrowserOpen={isTrowserOpen}
                onClose={onClose}
                sandbox={sandbox}
              />
            </ApolloProvider>
          </QuicksandProvider>
        </Provider>
      </ErrorBoundary>
    );
  }
}

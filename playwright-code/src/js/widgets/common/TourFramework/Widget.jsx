import React from 'react';
import { ApolloProvider } from '@apollo/client';
import { QuicksandProvider } from '@payroll/quicksand'; // eslint-disable-next-line import/no-extraneous-dependencies
import BaseWidget from 'web-shell-core/widgets/BaseWidget';
import { getApolloClientInstance } from 'src/js/service/ApolloClientBuilder';
import nlsLoader from 'src/nls';
import TourFramework from './TourFramework';

/** Guided Tooltip widget class */
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
    console.error('Guided tooltip widget error:', error, errorInfo);
  }

  /**
   * Renders the plugin
   * @returns {void}
   */
  render() {
    const { sandbox, externalApolloClient, ...otherProps } = this.props;
    const client = externalApolloClient ?? getApolloClientInstance(sandbox);

    if (!client) {
      return <div>Error: Apollo client not initialized</div>;
    }

    return (
      <QuicksandProvider
        sandbox={sandbox}
        nlsLoader={nlsLoader.requireNlsForLocale('timeTrackingUI')}
      >
        <ApolloProvider client={client}>
          <TourFramework sandbox={sandbox} {...otherProps} />
        </ApolloProvider>
      </QuicksandProvider>
    );
  }
}

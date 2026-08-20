/* eslint-disable import/no-extraneous-dependencies */
import React from 'react';
import { ApolloProvider } from '@apollo/client';
import { QuicksandProvider } from '@payroll/quicksand';
import BaseWidget from 'web-shell-core/widgets/BaseWidget';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import { getApolloClientInstance } from 'src/js/service/ApolloClientBuilder';
import ADSProvider from 'src/js/providers/ADSProvider';
import nlsLoader from 'src/nls';
import { WeeklyTimeEntryExperimentGate } from './components/WeeklyTimeEntryExperimentGate';
import { WeeklyTimeEntryDataProvider } from './components/WeeklyTimeEntryDataProvider';
import { WeeklyTimeEntryApolloProvider } from './components/WeeklyTimeEntryApolloProvider';
import store from './store';
import { WEEKLY_TIME_ENTRY_LOGGING_CONSTANTS } from './utils/constants';

/** Basic plugin class */
export default class Widget extends BaseWidget {
  /**
   * initializes component
   * @param {object} props : component props
   * @returns {void}
   */
  constructor(props) {
    super(props);
    const { onReady, open } = props;

    if (onReady && open) {
      onReady();
    }
  }

  /**
   * Mounts the component, see React docs.
   * @returns {void}
   */
  componentDidMount() {
    const { sandbox } = this.props;
    this.ready();
    sandbox.logger.log(
      WEEKLY_TIME_ENTRY_LOGGING_CONSTANTS.NAVIGATION
        .WEEKLY_TIME_ENTRY_WIDGET_MOUNTED,
    );
  }

  componentDidCatch(error) {
    this.props.sandbox.logger.error(
      'Plugin=time-tracking-ui Error=WTE_WIDGET_CRASH',
      { error },
    );
    this.props.onError?.(error);
  }

  /**
   * Unmounts the component, see React docs.
   * @returns {void}
   */
  componentWillUnmount() {
    const { sandbox } = this.props;
    sandbox.logger.log(
      'Component=Widget Message=Weekly Time Entry Widget Unmounted',
    );
  }

  /**
   * Renders the plugin
   * @returns {void}
   */
  render() {
    const {
      sandbox,
      externalApolloClient,
      setOpen,
      open,
      employeeId = null,
    } = this.props;
    const client = externalApolloClient ?? getApolloClientInstance(sandbox);

    if (!client) {
      sandbox.logger.error(
        WEEKLY_TIME_ENTRY_LOGGING_CONSTANTS.ERRORS
          .APOLLO_CLIENT_NOT_INITIALIZED,
      );
      return <div>Error: Apollo client not initialized</div>;
    }

    return (
      <QuicksandProvider
        sandbox={sandbox}
        nlsLoader={nlsLoader.requireNlsForLocale([
          'weeklyTimeEntry',
          'timeTrackingUI',
          'breaks',
        ])}
      >
        <ADSProvider>
          <ApolloProvider client={client}>
            <WeeklyTimeEntryApolloProvider sandbox={sandbox}>
              <Provider store={store}>
                <WeeklyTimeEntryExperimentGate setOpen={setOpen}>
                  <WeeklyTimeEntryDataProvider
                    isOpen={open}
                    setOpen={setOpen}
                    employeeId={employeeId}
                  />
                </WeeklyTimeEntryExperimentGate>
              </Provider>
            </WeeklyTimeEntryApolloProvider>
          </ApolloProvider>
        </ADSProvider>
      </QuicksandProvider>
    );
  }
}

Widget.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  sandbox: PropTypes.object.isRequired,
  onReady: PropTypes.func.isRequired,
  onClose: PropTypes.func,
  onSaveSuccess: PropTypes.func,
  // eslint-disable-next-line react/forbid-prop-types
  externalApolloClient: PropTypes.object,
  employeeId: PropTypes.string,
};

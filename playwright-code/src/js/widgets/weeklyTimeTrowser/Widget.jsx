import React from 'react';
import { ApolloProvider } from '@apollo/client';
import { QuicksandProvider } from '@payroll/quicksand'; // eslint-disable-next-line import/no-extraneous-dependencies
import BaseWidget from 'web-shell-core/widgets/BaseWidget';
import { withBaseWidget } from '@core-app/variability-sync-sdk';
import PropTypes from 'prop-types';

import { WeeklyTimeHOC } from 'src/js/widgets/weeklyTimeTrowser/components/WeeklyTimeHOC';
import { WeeklyTimeEntryExperimentGate } from 'src/js/widgets/weeklyTimeEntry/components/WeeklyTimeEntryExperimentGate';
import { getApolloClientInstance } from 'src/js/service/ApolloClientBuilder';
import ADSProvider from 'src/js/providers/ADSProvider';
import { LoggingConfigProvider } from 'src/js/providers/LoggingConfigProvider';

import { OBILL_UPGRADE_CONF } from 'src/js/common/constants';
import nlsLoader from 'src/nls';

/** Basic plugin class */
class Widget extends BaseWidget {
  /**
   * initializes component
   * @param {object} props : component props
   * @returns {void}
   */
  constructor(props) {
    super(props);
    this.handleWidgetDone = this.handleWidgetDone.bind(this);
    this.handleWidgetError = this.handleWidgetError.bind(this);
    this.state = {
      open: props.open || props.widgetProps?.showTrowser,
    };
    if (props.onReady) {
      props.onReady();
    }
  }

  /**
   * Mounts the component, see React docs.
   * @returns {void}
   */
  componentDidMount() {
    const { sandbox } = this.props;
    this.ready();
    sandbox.logger.log('timetrackingui widget mounted.');
  }

  componentDidCatch(error) {
    this.props.sandbox.logger.error(
      'Plugin=time-tracking-ui Error=WTA_WIDGET_CRASH',
      { error },
    );
    this.props.onError?.(error);
  }

  setOpen = (open) => {
    this.props.setOpen?.(open);
    this.setState({ open });
    if (!open && this.props.widgetProps?.showTrowser) {
      // https://uxfabric.intuitcdn.net/internal/design-systems/qbds/main/latest/index.html?path=/docs/components-trowserv2-adapter-usepagewidget--hook-usage
      // Give some time for the close animation then switch the route back to the previous page
      setTimeout(() => {
        this.done();
      }, 500);
    }
  };

  /**
   * This method will invoke the onDone callback provided by the consumer through the onDone
   * property with the given params. If the consumer does not provide the
   * onDone callback, this method will be a no op.
   * For more info: https://devportal.intuit.com/app/dp/capability/2611/capabilityDocs/main/docs/web-plugins-widgets/reference/widgets.md#instance-methods
   * @returns {void}
   */
  handleWidgetDone() {
    this.done();
  }

  /**
   * This method will invoke the onError callback provided by the consumer
   * through the onError property with the Error. If the consumer does not
   * provide the onError callback, this method will be a no op.
   * For more info: https://devportal.intuit.com/app/dp/capability/2611/capabilityDocs/main/docs/web-plugins-widgets/reference/widgets.md#instance-methods
   * @param {string} error: error string
   * @returns {void}
   */
  handleWidgetError(error) {
    this.err(error);
  }

  /**
   * Renders the plugin
   * We use the image that we imported above so it is handled in the browser when the plugin is loaded
   * @returns {void}
   */
  render() {
    if (
      window?.qbo?.menus[OBILL_UPGRADE_CONF.MENU_ID] ===
      OBILL_UPGRADE_CONF.UPGRADE
    ) {
      this.props.sandbox.logger.info(
        `WeeklyTimeTrowserWidget: Navigating to ${OBILL_UPGRADE_CONF.ROUTE_NAME} since ${OBILL_UPGRADE_CONF.UPGRADE} is selected`,
      );
      this.props.sandbox.navigation.navigate(OBILL_UPGRADE_CONF.ROUTE_NAME);
      return null;
    }
    // isWeeklyTimeEntry is set to false as by default it will work for WeeklyTimeActivity - To be removed when TA and TE are merged as an entity.
    const {
      sandbox,
      externalApolloClient,
      isWeeklyTimeEntry = false,
    } = this.props;
    const client = externalApolloClient ?? getApolloClientInstance(sandbox);

    return (
      <QuicksandProvider
        sandbox={sandbox}
        nlsLoader={nlsLoader.requireNlsForLocale('timeTrackingUI')}
      >
        <ADSProvider>
          <ApolloProvider client={client}>
            <LoggingConfigProvider
              sandbox={sandbox}
              prefix="WeeklyTimeTrowserWidget"
            >
              <WeeklyTimeEntryExperimentGate setOpen={this.setOpen}>
                <WeeklyTimeHOC
                  open={this.state.open}
                  setOpen={this.setOpen}
                  isWeeklyTimeEntry={isWeeklyTimeEntry}
                />
              </WeeklyTimeEntryExperimentGate>
            </LoggingConfigProvider>
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
  open: PropTypes.bool.isRequired,
  isWeeklyTimeEntry: PropTypes.bool,
  onClose: PropTypes.func,
  onSaveSuccess: PropTypes.func,
  // eslint-disable-next-line react/forbid-prop-types
  externalApolloClient: PropTypes.object,
};

export { Widget };
const WrappedWidget = withBaseWidget(Widget);
WrappedWidget.propTypes = Widget.propTypes;
export default WrappedWidget;

/* eslint-disable class-methods-use-this */
import React, { Suspense } from 'react';
import { ApolloProvider } from '@apollo/client';
import PropTypes from 'prop-types';

import BaseWidget from 'web-shell-core/widgets/BaseWidget';
import { QuicksandProvider } from '@payroll/quicksand';
import { withBaseWidget } from '@core-app/variability-sync-sdk';
import { getApolloClientInstance } from 'src/js/service/ApolloClientBuilder';
import { SingleTimeHOC } from 'src/js/widgets/singleTimeTrowser/components/SingleTimeHOC';
import ADSProvider from 'src/js/providers/ADSProvider';
import { LoggingConfigProvider } from 'src/js/providers/LoggingConfigProvider';
import { OBILL_UPGRADE_CONF } from 'src/js/common/constants';
import nlsLoader from 'src/nls';

class Widget extends BaseWidget {
  constructor(props) {
    super(props);
    this.waitStart();
    this.state = {
      open: props.open || props.widgetProps?.showTrowser,
    };
    if (props.onReady) {
      props.onReady();
    }
  }

  componentDidMount() {
    this.ready();
  }

  componentDidCatch(error) {
    this.props.sandbox.logger.error(
      'Plugin=time-tracking-ui Error=STE_WIDGET_CRASH',
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

  render() {
    // isSingleTimeEntry is set to false as by default it will work for singleTimeActivity - To be removed when TA and TE are merged as an entity.
    const {
      sandbox,
      externalApolloClient,
      isOTX = false,
      isSingleTimeEntry = false,
      timeEntryId = null,
      isTimeEntryLocked = false,
      employeeId = null,
    } = this.props;

    if (
      window?.qbo?.menus[OBILL_UPGRADE_CONF.MENU_ID] ===
        OBILL_UPGRADE_CONF.UPGRADE &&
      !isSingleTimeEntry
    ) {
      this.props.sandbox.logger.info(
        `SingleTimeTrowserWidget: Navigating to ${OBILL_UPGRADE_CONF.ROUTE_NAME} since ${OBILL_UPGRADE_CONF.UPGRADE} is selected`,
      );
      this.props.sandbox.navigation.navigate(OBILL_UPGRADE_CONF.ROUTE_NAME);
      return null;
    }

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
              prefix="SingleTimeTrowserWidget"
            >
              <Suspense fallback={<div />}>
                <SingleTimeHOC
                  open={this.state.open}
                  setOpen={this.setOpen}
                  isSingleTimeEntry={isSingleTimeEntry}
                  isOTX={isOTX}
                  timeEntryId={timeEntryId}
                  isTimeEntryLocked={isTimeEntryLocked}
                  employeeId={employeeId}
                />
              </Suspense>
            </LoggingConfigProvider>
          </ApolloProvider>
        </ADSProvider>
      </QuicksandProvider>
    );
  }
}

export default withBaseWidget(Widget);

Widget.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  sandbox: PropTypes.object.isRequired,
  onReady: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  isSingleTimeEntry: PropTypes.bool,
  isOTX: PropTypes.bool,
  onClose: PropTypes.func,
  onSaveSuccess: PropTypes.func,
  // eslint-disable-next-line react/forbid-prop-types
  externalApolloClient: PropTypes.object,
  timesheetId: PropTypes.string,
  isTimeEntryLocked: PropTypes.bool,
  employeeId: PropTypes.string,
};

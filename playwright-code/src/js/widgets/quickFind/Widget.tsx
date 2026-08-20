/* eslint-disable import/no-extraneous-dependencies */
import React from 'react';
import { QuicksandProvider } from '@payroll/quicksand';
import BaseWidget from 'web-shell-core/widgets/BaseWidget';
import { ThemeProvider } from '@design-systems/theme';
import nlsLoader from 'src/nls';
import { WidgetProps } from 'src/js/types';
import { LoggingConfigProvider } from 'src/js/providers/LoggingConfigProvider';
import { QuickFindProps } from './types';
import QuickFindContent from './components/QuickFindContent';

/** Basic plugin class */
export default class Widget extends BaseWidget<
  WidgetProps<QuickFindProps, string, string>
> {
  /**
   * Mounts the component, see React docs.
   * @returns {void}
   */
  componentDidMount() {
    this.ready();
  }

  componentDidCatch(error: Error) {
    this.props.sandbox.logger.error(
      'Plugin=time-tracking-ui Error=QUICK_FIND_CRASH',
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
    sandbox.logger.log('Component=Widget Message=Quick Find Unmounted');
  }

  /**
   * Renders the plugin
   * @returns {JSX.Element}
   */
  render() {
    const { sandbox } = this.props;

    return (
      <QuicksandProvider
        sandbox={sandbox}
        nlsLoader={
          nlsLoader.requireNlsForLocale(['quickFind', 'timeTrackingUI']) as any
        }
      >
        <LoggingConfigProvider sandbox={sandbox} prefix="QuickFind">
          <ThemeProvider>
            <QuickFindContent {...this.props} />
          </ThemeProvider>
        </LoggingConfigProvider>
      </QuicksandProvider>
    );
  }
}

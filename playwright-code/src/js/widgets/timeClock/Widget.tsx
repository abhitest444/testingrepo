import React from 'react';
import { ApolloProvider } from '@apollo/client';
import { QuicksandProvider } from '@payroll/quicksand';
import BaseWidget from 'web-shell-core/widgets/BaseWidget';
import { ThemeProvider } from '@design-systems/theme';
import nlsLoader from 'src/nls';
import { getApolloClientInstance } from 'src/js/service/ApolloClientBuilder';
import { WidgetProps } from 'src/js/types';
import { LoggingConfigProvider } from 'src/js/providers/LoggingConfigProvider';
import ADSProvider from 'src/js/providers/ADSProvider';
import TimeClockContent from './components/TimeClockContent';

export type TIME_CLOCK_FEATURE = 'time-action' | 'time-clock';
export type TIME_CLOCK_FUNCTIONALITY = 'action-button' | 'clock-form';
export interface TimeClockWidgetOptions {
  feature: TIME_CLOCK_FEATURE;
  functionality: TIME_CLOCK_FUNCTIONALITY;
  props?: Record<string, any>;
}
interface TimeClockProps {
  open?: boolean;
  setOpen?: (open: boolean) => void;
  onClick?: () => void;
  setHasError?: (error: Error | null) => void;
  onReady?: () => void;
  onError?: (error: Error | string) => void;
  widgetProps?: {
    showTrowser?: boolean;
  };
  isOTX?: boolean;
  employeeId?: string;
}

export default class TimeClockWidget extends BaseWidget<
  WidgetProps<TimeClockProps, TIME_CLOCK_FEATURE, TIME_CLOCK_FUNCTIONALITY>
> {
  componentDidMount() {
    const { sandbox } = this.props;
    this.ready();
    sandbox.logger.log('Time clock widget mounted');
  }

  componentDidCatch(error: Error) {
    this.props.sandbox.logger.error(
      'Plugin=time-tracking-ui Error=TIME_CLOCK_WIDGET_CRASH',
      { error },
    );
    this.props.onError?.(error);
  }

  handleError(error: Error | null) {
    const { sandbox, setHasError } = this.props;
    sandbox.logger.error('[CLOCK_IN_FLOW] - TimeActionView Widget - Error', {
      error,
    });
    if (setHasError) {
      setHasError(error);
    }
  }

  render() {
    const {
      sandbox,
      externalApolloClient,
      options,
      open,
      setOpen,
      onClick,
      setHasError,
      employeeId,
    } = this.props;
    const client = externalApolloClient ?? getApolloClientInstance(sandbox);

    if (!client) {
      return <div>Error: Apollo client not initialized</div>;
    }

    return (
      <QuicksandProvider
        sandbox={sandbox}
        nlsLoader={
          nlsLoader.requireNlsForLocale([
            'timeTrackingUI',
            'timeClockView',
          ]) as any
        }
      >
        <LoggingConfigProvider sandbox={sandbox} prefix="TimeClockWidget">
          <ThemeProvider>
            <ADSProvider>
              <ApolloProvider client={client}>
                <TimeClockContent
                  options={options as TimeClockWidgetOptions}
                  open={open}
                  setOpen={setOpen}
                  onClick={onClick}
                  setHasError={(error) => this.handleError(error)}
                  sandbox={sandbox}
                  employeeId={employeeId}
                />
              </ApolloProvider>
            </ADSProvider>
          </ThemeProvider>
        </LoggingConfigProvider>
      </QuicksandProvider>
    );
  }
}

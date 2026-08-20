import React, { Suspense } from 'react';
import { ApolloProvider } from '@apollo/client';
import PropTypes from 'prop-types';
import { QuicksandProvider } from '@payroll/quicksand';
import BaseWidget from 'web-shell-core/widgets/BaseWidget';
import { ThemeProvider } from '@design-systems/theme';
import styled from 'styled-components';
import nlsLoader from 'src/nls';
import { WidgetProps } from 'src/js/types';
import { LoggingConfigProvider } from 'src/js/providers/LoggingConfigProvider';
import {
  createCustomerInteraction,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import { getAssignmentApolloClient } from '../../service/AssignmentApolloClient';
import TimeEntryLocationContainer from './components/TimeEntryLocationContainer';

interface TimeEntryLocationProps {
  /** Whether the trowser is open - required */
  open: boolean;
  /** Callback to set trowser open state - optional */
  setOpen?: (open: boolean) => void;
  /** Time entry ID to display location details for - required */
  timeEntryId: string;
  /** Callback for error handling - optional */
  onError?: (error: Error | string) => void;
}

const WidgetContainer = styled.div`
  height: 100%;
`;

/** Time Entry Location - Displays location details for time entry */
class TimeEntryLocationWidget extends BaseWidget<
  WidgetProps<TimeEntryLocationProps, string, string>
> {
  private timeEntryLocationReadCITraceHeaders: Record<string, string | number> =
    {};

  static propTypes = {
    // eslint-disable-next-line react/forbid-prop-types
    sandbox: PropTypes.object.isRequired,
    open: PropTypes.bool.isRequired,
    setOpen: PropTypes.func,
    timeEntryId: PropTypes.string.isRequired,
    onError: PropTypes.func,
    // eslint-disable-next-line react/forbid-prop-types
    externalApolloClient: PropTypes.object,
  };

  constructor(props: WidgetProps<TimeEntryLocationProps, string, string>) {
    super(props);
    this.waitStart();

    // Create the CI in the constructor (before first render) and immediately
    // capture its trace headers. Storing them on the instance avoids any
    // timing issue: the hook receives pre-computed headers as a plain prop
    // rather than looking up the CI itself during render.
    const timeEntryLocationReadCI = createCustomerInteraction(
      props.sandbox,
      TimeCustomerInteraction.TIME_ENTRY_LOCATION_READ,
      { timeEntryId: props.timeEntryId },
    );
    this.timeEntryLocationReadCITraceHeaders =
      timeEntryLocationReadCI?.getTracePropagationHeaders() ?? {};
  }

  componentDidMount() {
    const { sandbox } = this.props;
    this.ready();
    sandbox.logger.info('TIME_ENTRY_LOCATION_WIDGET_MOUNTED');
  }

  componentDidUpdate(
    prevProps: WidgetProps<TimeEntryLocationProps, string, string>,
  ) {
    const { sandbox, timeEntryId } = this.props;

    // Re-create CI and refresh headers when timeEntryId changes.
    if (timeEntryId !== prevProps.timeEntryId) {
      const timeEntryLocationReadCI = createCustomerInteraction(
        sandbox,
        TimeCustomerInteraction.TIME_ENTRY_LOCATION_READ,
        { timeEntryId },
      );
      this.timeEntryLocationReadCITraceHeaders =
        timeEntryLocationReadCI?.getTracePropagationHeaders() ?? {};
    }
  }

  componentDidCatch(error: Error) {
    this.props.sandbox.logger.error(
      'Plugin=time-tracking-ui Error=TIME_ENTRY_LOCATION_WIDGET_CRASH',
      { error },
    );
    // call the onError callback if it is provided
    this.props.onError?.(error);
  }

  setOpen = (open: boolean) => {
    this.props.setOpen?.(open);
    this.setState({ open });
  };

  render() {
    const {
      sandbox,
      externalApolloClient,
      open = true,
      timeEntryId,
    } = this.props;
    const client = externalApolloClient ?? getAssignmentApolloClient(sandbox);

    if (!client) {
      sandbox.logger.error('APOLLO_CLIENT_NOT_INITIALIZED');
      return <div>Error: Apollo client not initialized</div>;
    }

    return (
      <QuicksandProvider
        sandbox={sandbox}
        nlsLoader={nlsLoader.requireNlsForLocale(['timeEntryLocation']) as any}
      >
        <LoggingConfigProvider
          sandbox={sandbox}
          prefix="TimeEntryLocationWidget"
        >
          <ThemeProvider>
            <ApolloProvider client={client}>
              <Suspense fallback={null}>
                <WidgetContainer>
                  <TimeEntryLocationContainer
                    open={open}
                    onClose={() => this.setOpen(false)}
                    timeEntryId={timeEntryId}
                    traceHeaders={this.timeEntryLocationReadCITraceHeaders}
                  />
                </WidgetContainer>
              </Suspense>
            </ApolloProvider>
          </ThemeProvider>
        </LoggingConfigProvider>
      </QuicksandProvider>
    );
  }
}

export default TimeEntryLocationWidget;

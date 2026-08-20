import React, { Suspense } from 'react';
import { ApolloProvider } from '@apollo/client';
import { QuicksandProvider } from '@payroll/quicksand';
import BaseWidget from 'web-shell-core/widgets/BaseWidget';
import { ThemeProvider } from '@design-systems/theme';
import styled from 'styled-components';
import nlsLoader from 'src/nls';
import { getApolloClientInstance } from 'src/js/service/ApolloClientBuilder';
import { WidgetProps } from 'src/js/types';
import { LoggingConfigProvider } from 'src/js/providers/LoggingConfigProvider';
import WhosWorkingContent from './components/WhosWorkingContent';
import { WHOS_WORKING_LOGGING_CONSTANTS } from './constants';
import './main.css';
import { getAssignmentApolloClient } from '../../service/AssignmentApolloClient';

interface WhosWorkingProps {
  // in case any additional props are needed
  onError?: (error: Error | string) => void;
  employeeId?: string;
}

const WidgetContainer = styled.div`
  height: 100%;
  overflow: auto;
  box-sizing: border-box;
`;

/** Who's Working Widget - Displays workers who are currently working with map visualization */
class WhosWorkingWidget extends BaseWidget<
  WidgetProps<WhosWorkingProps, string, string>
> {
  componentDidMount() {
    const { sandbox } = this.props;
    this.ready();
    sandbox.logger.info(
      WHOS_WORKING_LOGGING_CONSTANTS.NAVIGATION.WHOS_WORKING_WIDGET_MOUNTED,
    );
  }

  componentDidCatch(error: Error) {
    this.props.sandbox.logger.error(
      'Plugin=time-tracking-ui Error=WHOS_WORKING_WIDGET_CRASH',
      { error },
    );
    this.props.onError?.(error);
  }

  render() {
    const { sandbox, externalApolloClient, options, employeeId } = this.props;
    const client = externalApolloClient ?? getAssignmentApolloClient(sandbox);

    if (!client) {
      sandbox.logger.error(
        WHOS_WORKING_LOGGING_CONSTANTS.API_ERRORS.APOLLO_CLIENT_NOT_INITIALIZED,
      );
      return <div>Error: Apollo client not initialized</div>;
    }

    return (
      <QuicksandProvider
        sandbox={sandbox}
        nlsLoader={nlsLoader.requireNlsForLocale(['whosWorking']) as any}
      >
        <LoggingConfigProvider sandbox={sandbox} prefix="WhosWorkingWidget">
          <ThemeProvider>
            <ApolloProvider client={client}>
              <Suspense fallback={null}>
                <WidgetContainer>
                  <WhosWorkingContent employeeId={employeeId} />
                </WidgetContainer>
              </Suspense>
            </ApolloProvider>
          </ThemeProvider>
        </LoggingConfigProvider>
      </QuicksandProvider>
    );
  }
}

export default WhosWorkingWidget;

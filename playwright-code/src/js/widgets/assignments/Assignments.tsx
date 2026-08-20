import React from 'react';
import { ApolloProvider } from '@apollo/client';
import BaseWidget from 'web-shell-core/widgets/BaseWidget';
import { withBaseWidget } from '@core-app/variability-sync-sdk';
import { QuicksandProvider } from '@payroll/quicksand';
import { Provider } from 'react-redux';
import { WidgetProps } from 'src/js/types';
import { getAssignmentApolloClient } from 'src/js/service/AssignmentApolloClient';
import nlsLoader from 'src/nls';
import { LoggingConfigProvider } from 'src/js/providers/LoggingConfigProvider';
import {
  getQueryParams,
  TAB_QUERY_PARAM,
  VIEW_QUERY_PARAM,
} from 'src/js/service/utils/queryStringUtil';
import AssignmentTabs from './components/Tabs';
import { ASSIGNMENT_LOGGING_CONSTANTS } from './constants';
import store from './store';
import { AssignmentsMainTabs, WorkersTabViews } from './types';

const VALID_TABS = Object.values(AssignmentsMainTabs);

interface AssignmentsProps {}

class Assignments extends BaseWidget<
  WidgetProps<AssignmentsProps, string, string>
> {
  private initialTab: string | undefined;

  private initialView: string | undefined;

  constructor(props: WidgetProps<AssignmentsProps, string, string>) {
    super(props);
    const tabParam = getQueryParams().get(TAB_QUERY_PARAM);
    this.initialTab =
      tabParam && VALID_TABS.includes(tabParam as AssignmentsMainTabs)
        ? tabParam
        : undefined;

    const viewParam = getQueryParams().get(VIEW_QUERY_PARAM);
    this.initialView =
      viewParam === WorkersTabViews.GROUPS ? viewParam : undefined;
  }

  /**
   * Mounts the component, see React docs.
   * @returns {void}
   */
  componentDidMount() {
    const { sandbox } = this.props;
    this.ready();
    sandbox.logger.info(
      ASSIGNMENT_LOGGING_CONSTANTS.NAVIGATION.ASSIGNMENTS_WIDGET_MOUNTED,
    );
  }

  /**
   * Renders the plugin
   * @returns {void}
   */
  render() {
    const { sandbox, externalApolloClient } = this.props;
    // Use dedicated assignments client to prevent __typename auto-stitching issues
    const client = externalApolloClient ?? getAssignmentApolloClient(sandbox);

    if (!client) {
      sandbox.logger.error(
        ASSIGNMENT_LOGGING_CONSTANTS.API_ERRORS.APOLLO_CLIENT_NOT_INITIALIZED,
      );
      return <div>Error: Apollo client not initialized</div>;
    }

    return (
      <Provider store={store}>
        <QuicksandProvider
          sandbox={sandbox}
          nlsLoader={
            nlsLoader.requireNlsForLocale([
              'assignments',
              'assignmentDrawer',
              'groups',
              'workers',
            ]) as any
          }
        >
          <LoggingConfigProvider sandbox={sandbox}>
            <ApolloProvider client={client}>
              <AssignmentTabs
                initialTab={this.initialTab}
                initialView={this.initialView}
              />
            </ApolloProvider>
          </LoggingConfigProvider>
        </QuicksandProvider>
      </Provider>
    );
  }
}

export default withBaseWidget(Assignments);

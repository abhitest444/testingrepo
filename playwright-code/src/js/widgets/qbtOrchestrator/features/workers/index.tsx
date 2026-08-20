import React, { useEffect } from 'react';
import { ApolloProvider } from '@apollo/client';
import { Provider } from 'react-redux';
import { useSandbox } from '@payroll/quicksand';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import { getAssignmentApolloClient } from 'src/js/service/AssignmentApolloClient';
import assignmentsStore from 'src/js/widgets/assignments/store';
import WorkerAssignmentsTab from 'src/js/widgets/assignments/components/WorkerAssignments/WorkerAssignmentsTab';
import { useInitializeItmTasks } from '../overview/hooks';
import { WORKERS_LOGGING } from './constants/workersLoggingConstants';

/**
 * Workers Feature
 *
 * Exposes the "Workers" assignment page (groups view, workers list view,
 * group detail, and associated drawers) as an orchestrator feature so it can
 * be mounted standalone in the time team page (e.g. from time-center-ui)
 * without the assignments tab shell.
 *
 * The page content is identical to the Workers tab inside the Assignments
 * widget; only the tab shell is omitted. The WorkerAssignments subtree is
 * bound to the dedicated assignments store and the dedicated assignments
 * Apollo client (which strips `__typename` to avoid backend auto-stitching
 * issues and injects the workforce header), so both are provided here rather
 * than relying on the orchestrator's generic store and Apollo client.
 */
interface WorkersFeatureProps {
  initialView?: string;
}

const WorkersFeature: React.FC<WorkersFeatureProps> = ({ initialView }) => {
  const sandbox = useSandbox();
  const logger = useLoggingConfig();

  // Initialize ITM tasks on mount (matches AssignmentTabs behaviour).
  useInitializeItmTasks();

  useEffect(() => {
    logger.info(WORKERS_LOGGING.FEATURE_MOUNTED);
  }, [logger]);

  // Dedicated assignments client to prevent __typename auto-stitching issues.
  const client = getAssignmentApolloClient(sandbox);

  if (!client) {
    logger.error(WORKERS_LOGGING.APOLLO_CLIENT_NOT_INITIALIZED);
    return <div>Error: Apollo client not initialized</div>;
  }

  return (
    <ApolloProvider client={client}>
      <Provider store={assignmentsStore}>
        <WorkerAssignmentsTab initialView={initialView} />
      </Provider>
    </ApolloProvider>
  );
};

export default WorkersFeature;

import { useCallback, useState } from 'react';
import { useIntl, useSandbox } from '@payroll/quicksand';
import { LazyQueryExecFunction } from '@apollo/client';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import { getApolloClientInstance } from 'src/js/service/ApolloClientBuilder';
import { mapError } from 'src/js/service/utils/mapError';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import { GET_TIME_TRACKING_WORKER_BY_ID } from 'src/js/service/queries/tsheetsQueries';

interface TimeTrackingWorkerWithIds {
  tsheetsId: number;
  authId: string;
  profileId: string;
  employeeId: string;
  vendorId: string | null;
  isEmployee: boolean;
  isQboUser: boolean;
  isVendor: boolean;
  self: boolean;
  managedGroupIds: string[];
  groupId: number;
  permissions: string[];
  cacheHit: boolean;
  timeMs: number;
  __typename: 'TimeTrackingWorkerWithIds';
}

interface UseLazyGetTSheetsWorkerByIdResult {
  query: LazyQueryExecFunction<any, any>;
  loading: boolean;
  error?: string;
  data?: TimeTrackingWorkerWithIds;
}

export const useLazyGetTSheetsWorkerById =
  (): UseLazyGetTSheetsWorkerByIdResult => {
    const sandbox = useSandbox();
    const intl = useIntl();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | undefined>();
    const [data, setData] = useState<TimeTrackingWorkerWithIds>();

    const query = useCallback(
      async (options: any) => {
        try {
          setLoading(true);
          setError(undefined);

          createCustomerInteraction(
            sandbox,
            TimeCustomerInteraction.EMPLOYEE_READ,
          );

          const client = getApolloClientInstance(sandbox);
          if (!client) {
            throw new Error('Apollo client not initialized');
          }

          const result = await client.query({
            query: GET_TIME_TRACKING_WORKER_BY_ID,
            variables: options.variables,
            context: {
              clientName: ApolloClientNames.TSHEETS,
              headers: {
                ...getCustomerInteractionPropagationHeaders(
                  sandbox,
                  TimeCustomerInteraction.EMPLOYEE_READ,
                ),
              },
            },
            fetchPolicy: 'network-only' as any,
            notifyOnNetworkStatusChange: true,
          });

          // Debug log to verify clientName
          sandbox.logger.info('TSheets query executed with clientName:', {
            clientName: ApolloClientNames.TSHEETS,
          });

          if (result.data?.timeTrackingWorkerById) {
            setData(result.data.timeTrackingWorkerById);
            sandbox.logger.info(
              '[CLOCK_IN_FLOW] - useLazyGetTSheetsWorkerById - Worker found',
              { data: result.data },
            );
            endInteractionWithSuccess(
              sandbox,
              TimeCustomerInteraction.EMPLOYEE_READ,
            );
          }

          return result as any;
        } catch (err: any) {
          const errorMessage = mapError({
            sourceComponent: 'useLazyGetTSheetsWorkerById',
            sandbox,
            intl,
            error: err,
          });

          setError(errorMessage);
          sandbox.logger.logException(
            '[CLOCK_IN_FLOW] - useLazyGetTSheetsWorkerById - Error fetching worker',
            err as Error,
          );
          endInteractionWithFailure(
            sandbox,
            TimeCustomerInteraction.EMPLOYEE_READ,
            'QUERY_ERROR',
            { message: err },
          );
          throw err;
        } finally {
          setLoading(false);
        }
      },
      [sandbox, intl],
    );

    return {
      query,
      loading,
      error,
      data,
    };
  };

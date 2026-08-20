import { useCallback, useMemo } from 'react';
import { useSandbox } from '@payroll/quicksand';
import {
  TimeTracking_CustomDimensionsFilter,
  useGetTimeTrackingCustomDimensionsLazyQuery,
} from 'src/__generated__/timeTracking/graphql';
import type { GetTimeTrackingCustomDimensionsQuery_timeTrackingCustomDimensions_TimeTracking_CustomDimensionsConnection_edges_TimeTracking_CustomDimensionEdge_node_TimeTracking_CustomDimensionNode as CustomDimensionQueryNode } from 'src/__generated__/timeTracking/graphql';
import type { DimensionDefinition } from 'src/js/widgets/common/dimensions/types';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import {
  createCustomerInteraction,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  setInteractionDegraded,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';

const TIME_TRACKING_CUSTOM_DIMENSIONS_PAGE_SIZE = 150;

/**
 * Lazy hook that fetches the list of TimeTracking dimension *definitions*
 * (id + label + active / required / enabledForTimeTracking flags).
 *
 * This hook intentionally does NOT fetch the per-dimension OPTION lists —
 * those live on a different subgraph (AppFoundations / OIGQL) and are
 * fetched by `useGetDimensionOptions`, which the consumer wires in after
 * this hook resolves and the ids are known.
 */

export interface UseGetDimensionsResult {
  dimensions: DimensionDefinition[];
  loading: boolean;
  error: string | null;
  /**
   * Fetches dimension definitions. Pass `timeForId` (the worker/entity id) to
   * have the backend resolve each dimension's `workerDefaultDimensionValue`,
   * which surfaces as `workerDefaultOptionId` on the mapped definitions.
   */
  query: (options?: GetDimensionsQueryOptions) => Promise<void>;
}

export interface GetDimensionsQueryOptions {
  /** Extra dimension filters (active / enabledForTimeTracking). */
  filter?: TimeTracking_CustomDimensionsFilter | null;
  /** Worker/entity id used to resolve per-worker default option values. */
  timeForId?: string | null;
}

/**
 * Normalises the wire payload into `DimensionDefinition[]`. Option lists are
 * fetched separately by `useGetDimensionOptions` and merged in by the host
 * before being handed to the `<Dimensions />` component.
 */
export const mapDimensionsResponse = (
  nodes: CustomDimensionQueryNode[] | null,
): DimensionDefinition[] => {
  if (!Array.isArray(nodes)) return [];
  return nodes
    .filter(
      (node): node is CustomDimensionQueryNode =>
        !!node && !!node.customDimensionDefinition?.id,
    )
    .map((node) => {
      const workerDefaultOptionId = node.workerDefaultDimensionValue?.id;
      return {
        id: node.customDimensionDefinition.id,
        name: node.label ?? '',
        active: node.active,
        enabledForTimeTracking: node.enabledForTimeTracking,
        required: node.required,
        workerDefaultOptionId,
      };
    });
};

export const useGetDimensions = (): UseGetDimensionsResult => {
  const sandbox = useSandbox();

  const [fetchDimensions, { data, loading, error }] =
    useGetTimeTrackingCustomDimensionsLazyQuery({
      context: {
        clientName: ApolloClientNames.TIME_TRACKING,
      },
      fetchPolicy: 'network-only',
      onCompleted: () => {
        sandbox.logger.info('Component=useGetDimensions Event=Fetched');
        endInteractionWithSuccess(
          sandbox,
          TimeCustomerInteraction.GET_DIMENSIONS,
        );
      },
      onError: (err) => {
        sandbox.logger.error('Component=useGetDimensions Event=Failed', {
          error: err.message,
        });
        // Dimension definitions are a non-blocking read: the form still
        // renders without them, so surface failures as degraded rather than
        // a hard failure.
        setInteractionDegraded(
          sandbox,
          TimeCustomerInteraction.GET_DIMENSIONS,
          err.message,
        );
      },
    });

  const dimensions = useMemo(
    () =>
      mapDimensionsResponse(
        data?.timeTrackingCustomDimensions?.edges?.map((edge) => edge.node) ??
          null,
      ),
    [data],
  );

  const query = useCallback(
    async ({
      filter,
      timeForId,
    }: GetDimensionsQueryOptions = {}): Promise<void> => {
      const resolvedFilter: TimeTracking_CustomDimensionsFilter | null =
        timeForId
          ? { ...(filter ?? {}), timeForId: { id: timeForId } }
          : filter ?? null;
      createCustomerInteraction(
        sandbox,
        TimeCustomerInteraction.GET_DIMENSIONS,
      );
      await fetchDimensions({
        variables: {
          first: TIME_TRACKING_CUSTOM_DIMENSIONS_PAGE_SIZE,
          ...(resolvedFilter ? { filter: resolvedFilter } : {}),
        },
        context: {
          clientName: ApolloClientNames.TIME_TRACKING,
          headers: getCustomerInteractionPropagationHeaders(
            sandbox,
            TimeCustomerInteraction.GET_DIMENSIONS,
          ),
        },
      });
    },
    [fetchDimensions, sandbox],
  );

  return {
    dimensions,
    loading,
    error: error?.message ?? null,
    query,
  };
};

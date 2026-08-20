import { useSandbox } from '@payroll/quicksand';
import { useCallback, useMemo } from 'react';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import {
  useGetCurrentGroupManagersLazyQuery,
  GetCurrentGroupManagersQuery,
} from 'src/__generated__/timeTracking/graphql';

export interface UseGetGroupManagersArgs {
  groupId: string;
  first?: number;
  after?: string;
}

type ManagerNode = NonNullable<
  NonNullable<
    NonNullable<
      NonNullable<GetCurrentGroupManagersQuery['timeTrackingGroups']>['edges']
    >[number]['node']['managers']
  >['edges']
>[number]['node'];

type PageInfo = NonNullable<
  NonNullable<
    NonNullable<GetCurrentGroupManagersQuery['timeTrackingGroups']>['edges']
  >[number]['node']['managers']
>['pageInfo'];

type GroupInfo = {
  id: string;
  name: string;
  isActive: boolean;
  memberCount: number;
  managerCount: number;
};

export interface UseGetGroupManagersResult {
  loading: boolean;
  managers: ManagerNode[];
  groupInfo: GroupInfo | null;
  pageInfo: PageInfo | null;
  error: string | null;
  loadManagers: (args: UseGetGroupManagersArgs) => void;
  fetchMore: () => Promise<void>;
  refetch: (args?: UseGetGroupManagersArgs) => Promise<void>;
}

/**
 * Custom hook to fetch current managers for a group
 * Used in "Assign Leads" drawer to show existing managers
 * Supports pagination for groups with many managers
 *
 * @example
 * ```typescript
 * const { managers, groupInfo, loading, loadManagers } = useGetGroupManagers();
 *
 * useEffect(() => {
 *   loadManagers({ groupId: 'group-123' });
 * }, []);
 * ```
 */
export const useGetGroupManagers = (): UseGetGroupManagersResult => {
  const sandbox = useSandbox();

  const [
    loadQuery,
    {
      data,
      loading,
      error,
      fetchMore: apolloFetchMore,
      refetch: apolloRefetch,
    },
  ] = useGetCurrentGroupManagersLazyQuery({
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
    onCompleted: () => {
      endInteractionWithSuccess(
        sandbox,
        TimeCustomerInteraction.GROUP_MANAGERS_READ,
      );
    },
    onError: (err) => {
      sandbox.logger.error(
        'Component="useGetGroupManagers" Event="Error fetching group managers"',
        { error: err.message },
      );
      endInteractionWithFailure(
        sandbox,
        TimeCustomerInteraction.GROUP_MANAGERS_READ,
        err.message,
        err,
      );
    },
  });

  const managers = useMemo(() => {
    const group = data?.timeTrackingGroups?.edges?.[0]?.node;
    return group?.managers?.edges?.map((edge) => edge.node) || [];
  }, [data]);

  const groupInfo = useMemo(() => {
    const group = data?.timeTrackingGroups?.edges?.[0]?.node;
    if (!group) return null;

    return {
      id: group.id,
      name: group.name,
      isActive: group.isActive,
      memberCount: group.stats?.memberCount || 0,
      managerCount: group.stats?.managerCount || 0,
    };
  }, [data]);

  const pageInfo = useMemo(() => {
    const group = data?.timeTrackingGroups?.edges?.[0]?.node;
    return group?.managers?.pageInfo || null;
  }, [data]);

  const loadManagers = useCallback(
    ({ groupId, first = 100, after }: UseGetGroupManagersArgs) => {
      createCustomerInteraction(
        sandbox,
        TimeCustomerInteraction.GROUP_MANAGERS_READ,
      );

      loadQuery({
        variables: { groupId, first, after },
        context: {
          headers: getCustomerInteractionPropagationHeaders(
            sandbox,
            TimeCustomerInteraction.GROUP_MANAGERS_READ,
          ),
        },
      });
    },
    [sandbox, loadQuery],
  );

  const fetchMore = useCallback(async () => {
    if (!pageInfo?.hasNextPage || !pageInfo?.endCursor) {
      return;
    }

    const group = data?.timeTrackingGroups?.edges?.[0]?.node;
    if (!group) return;

    try {
      sandbox.logger.info(
        'Component="useGetGroupManagers" Event="Fetching more with cursor"',
        {
          groupId: group.id,
          cursor: pageInfo.endCursor,
          first: 100,
        },
      );

      await apolloFetchMore({
        variables: {
          groupId: group.id, // CRITICAL: Must pass groupId
          first: 100, // CRITICAL: Must pass first
          after: pageInfo.endCursor,
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult || !fetchMoreResult.timeTrackingGroups) {
            return previousResult;
          }

          const prevGroup =
            previousResult?.timeTrackingGroups?.edges?.[0]?.node;
          const newGroup = fetchMoreResult.timeTrackingGroups.edges?.[0]?.node;

          if (
            !prevGroup ||
            !newGroup ||
            !fetchMoreResult.timeTrackingGroups.edges?.[0]
          ) {
            return previousResult;
          }

          // Merge manager edges
          const prevEdges = prevGroup.managers?.edges || [];
          const newEdges = newGroup.managers?.edges || [];

          return {
            ...fetchMoreResult,
            timeTrackingGroups: {
              ...fetchMoreResult.timeTrackingGroups,
              edges: [
                {
                  ...fetchMoreResult.timeTrackingGroups.edges[0],
                  node: {
                    ...newGroup,
                    managers: {
                      ...newGroup.managers,
                      edges: [...prevEdges, ...newEdges], // APPEND new managers to existing
                    },
                  },
                },
              ],
            },
          };
        },
      });
    } catch (err) {
      sandbox.logger.error(
        'Component="useGetGroupManagers" Event="Error fetching more managers"',
        { error: err },
      );
    }
  }, [pageInfo, data, apolloFetchMore, sandbox]);

  const refetch = useCallback(
    async (args?: UseGetGroupManagersArgs) => {
      if (!args) {
        await apolloRefetch();
        return;
      }

      await apolloRefetch({
        groupId: args.groupId,
        first: args.first,
        after: args.after,
      });
    },
    [apolloRefetch],
  );

  return {
    loading,
    managers,
    groupInfo,
    pageInfo,
    error: error?.message || null,
    loadManagers,
    fetchMore,
    refetch,
  };
};

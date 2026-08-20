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
  useGetGroupMembersLazyQuery,
  GetGroupMembersQuery,
} from 'src/__generated__/timeTracking/graphql';

export interface UseGetGroupMembersArgs {
  groupId: string;
  first?: number;
  after?: string;
}

type MemberNode = NonNullable<
  NonNullable<
    NonNullable<
      NonNullable<GetGroupMembersQuery['timeTrackingGroups']>['edges']
    >[number]['node']['members']
  >['edges']
>[number]['node'];

type PageInfo = NonNullable<
  NonNullable<
    NonNullable<GetGroupMembersQuery['timeTrackingGroups']>['edges']
  >[number]['node']['members']
>['pageInfo'];

type GroupInfo = {
  id: string;
  name: string;
  isActive: boolean;
  memberCount: number;
  managerCount: number;
};

export interface UseGetGroupMembersResult {
  loading: boolean;
  members: MemberNode[];
  groupInfo: GroupInfo | null;
  pageInfo: PageInfo | null;
  error: string | null;
  loadMembers: (args: UseGetGroupMembersArgs) => void;
  fetchMore: () => Promise<void>;
  refetch: (args?: UseGetGroupMembersArgs) => Promise<void>;
}

/**
 * Custom hook to fetch current members for a group
 * Used in "Assign Workers" drawer to show existing members
 * Supports pagination for groups with many members
 * EXACT COPY of useGetGroupManagers pattern
 *
 * @example
 * ```typescript
 * const { members, groupInfo, loading, loadMembers } = useGetGroupMembers();
 *
 * useEffect(() => {
 *   loadMembers({ groupId: 'group-123' });
 * }, []);
 * ```
 */
export const useGetGroupMembers = (): UseGetGroupMembersResult => {
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
  ] = useGetGroupMembersLazyQuery({
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
    onCompleted: () => {
      endInteractionWithSuccess(
        sandbox,
        TimeCustomerInteraction.GROUP_MEMBERS_READ,
      );
    },
    onError: (err) => {
      sandbox.logger.error(
        'Component="useGetGroupMembers" Event="Error fetching group members"',
        { error: err.message },
      );
      endInteractionWithFailure(
        sandbox,
        TimeCustomerInteraction.GROUP_MEMBERS_READ,
        err.message,
        err,
      );
    },
  });

  const members = useMemo(() => {
    const group = data?.timeTrackingGroups?.edges?.[0]?.node;
    return group?.members?.edges?.map((edge) => edge.node) || [];
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
    return group?.members?.pageInfo || null;
  }, [data]);

  const loadMembers = useCallback(
    ({ groupId, first = 100, after }: UseGetGroupMembersArgs) => {
      createCustomerInteraction(
        sandbox,
        TimeCustomerInteraction.GROUP_MEMBERS_READ,
      );

      loadQuery({
        variables: { groupId, first, after },
        context: {
          headers: getCustomerInteractionPropagationHeaders(
            sandbox,
            TimeCustomerInteraction.GROUP_MEMBERS_READ,
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
        'Component="useGetGroupMembers" Event="Fetching more with cursor"',
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

          // Merge member edges
          const prevEdges = prevGroup.members?.edges || [];
          const newEdges = newGroup.members?.edges || [];

          return {
            ...fetchMoreResult,
            timeTrackingGroups: {
              ...fetchMoreResult.timeTrackingGroups,
              edges: [
                {
                  ...fetchMoreResult.timeTrackingGroups.edges[0],
                  node: {
                    ...newGroup,
                    members: {
                      ...newGroup.members,
                      edges: [...prevEdges, ...newEdges], // APPEND new members to existing
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
        'Component="useGetGroupMembers" Event="Error fetching more members"',
        { error: err },
      );
    }
  }, [pageInfo, data, apolloFetchMore, sandbox]);

  const refetch = useCallback(
    async (args?: UseGetGroupMembersArgs) => {
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
    members,
    groupInfo,
    pageInfo,
    error: error?.message || null,
    loadMembers,
    fetchMore,
    refetch,
  };
};

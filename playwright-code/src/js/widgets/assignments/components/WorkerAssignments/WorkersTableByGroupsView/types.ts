/**
 * TypeScript types for Workers Table View by Groups
 */

import {
  GetTimeTrackingGroupsQuery_timeTrackingGroups_TimeTracking_GroupConnection_edges_TimeTracking_GroupEdge_node_TimeTracking_Group as QueryGroupNode,
  GetUnassignedWorkersQuery,
  TimeTracking_TimeForType,
} from 'src/__generated__/timeTracking/graphql';

/**
 * Group node type from GraphQL query (SLICE 1 - no members/managers)
 */
export type GroupNode = QueryGroupNode;

/**
 * Worker node type for unassigned workers from GraphQL query
 */
export type WorkerNode = NonNullable<
  NonNullable<GetUnassignedWorkersQuery['timeTrackingWorkers']>['edges']
>[number]['node'];

/**
 * Worker type for SLICE 3 (lazy-loaded group members)
 * Used for displaying workers within a specific group
 */
export type Worker = {
  id: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  type: TimeTracking_TimeForType;
  isActive: boolean;
  isGroupLead?: boolean;
  managesGroups?: Array<{
    id: string;
    name: string;
    isActive: boolean;
  }>;
};

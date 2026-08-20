import { TimeTracking_TimeForType } from 'src/__generated__/timeTracking/graphql';
import { AssignmentChanges, AssignmentItem } from './types';

// Constants
export const GROUP_PREFIX = 'group-';
export const NO_GROUP_ID = 'no-group';

// Types
export type WorkerAssignment = {
  id: string;
  timeForType: TimeTracking_TimeForType;
};

export interface ProcessedAssignments {
  workersToAssign: WorkerAssignment[];
  workersToUnassign: WorkerAssignment[];
  groupIdsToAssign: string[];
  groupIdsToUnassign: string[];
}

/**
 * Represents a customer or project assignment with proper ID mapping
 */
export interface TimeAgainstAssignment {
  customerId: string;
  projectId?: string;
}

// Helper Functions

/**
 * Gets the TimeForType from an AssignmentItem, defaulting to Employee if not set.
 */
function getTimeForType(item: AssignmentItem): TimeTracking_TimeForType {
  return (
    (item.type as TimeTracking_TimeForType) || TimeTracking_TimeForType.Employee
  );
}

/**
 * Extracts the group ID from a parent ID string (removes 'group-' prefix).
 */
function extractGroupId(parentId: string | number): string {
  return String(parentId).replace(GROUP_PREFIX, '');
}

/**
 * Gets all workers belonging to a specific group or no-group.
 */
function getWorkersByParentId(
  parentId: string,
  hierarchicalItems: AssignmentItem[],
): AssignmentItem[] {
  return hierarchicalItems.filter(
    (item) => item.parentId === parentId && item.level === 1,
  );
}

/**
 * Checks if all workers in a group will be selected after assigning a specific worker.
 */
function shouldOptimizeToGroupAssignment(
  workerItem: AssignmentItem,
  selectedWorkerId: string,
  hierarchicalItems: AssignmentItem[],
  finalAssignedSet?: Set<string | number>,
): boolean {
  if (
    !workerItem.parentId ||
    !String(workerItem.parentId).startsWith(GROUP_PREFIX)
  ) {
    return false;
  }

  const allWorkersFromGroup = getWorkersByParentId(
    String(workerItem.parentId),
    hierarchicalItems,
  );

  // If finalAssignedSet is not provided, fall back to checking isSelected
  if (!finalAssignedSet) {
    return allWorkersFromGroup.every(
      (w) => w.isSelected || String(w.id) === selectedWorkerId,
    );
  }

  return allWorkersFromGroup.every(
    (w) => finalAssignedSet.has(w.id) || String(w.id) === selectedWorkerId,
  );
}

/**
 * Processes assignment changes and determines which workers and groups to assign/unassign.
 *
 * This function handles the complex logic of converting user selections into the appropriate
 * backend mutations, including:
 * - Group selections (assigning a group sends only group ID, unassigning sends group ID + workers)
 * - Individual worker selections (optimizes to group ID when all workers selected)
 * - Ungrouped workers (processes individually)
 *
 * @param changes - The assignment changes from the drawer (newly assigned/unassigned IDs)
 * @param hierarchicalItems - The full list of hierarchical items (groups and workers)
 * @returns Processed assignments ready to be sent to the backend mutation
 */
export function processAssignmentChanges(
  changes: AssignmentChanges,
  hierarchicalItems: AssignmentItem[],
): ProcessedAssignments {
  const workersToAssign: WorkerAssignment[] = [];
  const workersToUnassign: WorkerAssignment[] = [];
  const groupIdsToAssign = new Set<string>();
  const groupIdsToUnassign = new Set<string>();

  /**
   * Handles group selection (IDs starting with 'group-').
   * - Assigning: Only adds group ID
   * - Unassigning: Adds group ID + all workers in the group
   */
  const handleGroupSelection = (idStr: string, isAssign: boolean) => {
    const groupId = extractGroupId(idStr);

    if (isAssign) {
      groupIdsToAssign.add(groupId);
    } else {
      groupIdsToUnassign.add(groupId);

      const groupWorkers = getWorkersByParentId(idStr, hierarchicalItems);
      groupWorkers.forEach((worker) => {
        workersToUnassign.push({
          id: String(worker.id),
          timeForType: getTimeForType(worker),
        });
      });
    }
  };

  /**
   * Handles no-group selection (ungrouped workers).
   * Processes all workers in the no-group category.
   */
  const handleNoGroupSelection = (isAssign: boolean) => {
    const noGroupWorkers = getWorkersByParentId(NO_GROUP_ID, hierarchicalItems);

    noGroupWorkers.forEach((worker) => {
      const assignment: WorkerAssignment = {
        id: String(worker.id),
        timeForType: getTimeForType(worker),
      };

      if (isAssign) {
        workersToAssign.push(assignment);
      } else {
        workersToUnassign.push(assignment);
      }
    });
  };

  /**
   * Handles individual worker selection.
   * - Assigning: Optimizes to group ID if all workers in group will be selected
   * - Unassigning: Adds worker + group ID if worker belongs to a group
   */
  const handleIndividualWorkerSelection = (
    idStr: string,
    isAssign: boolean,
  ) => {
    const workerItem = hierarchicalItems.find(
      (item) => String(item.id) === idStr,
    );

    if (!workerItem) return;

    const assignment: WorkerAssignment = {
      id: idStr,
      timeForType: getTimeForType(workerItem),
    };

    if (isAssign) {
      // Check if we can optimize to a group assignment
      if (
        shouldOptimizeToGroupAssignment(
          workerItem,
          idStr,
          hierarchicalItems,
          changes.finalAssigned,
        )
      ) {
        const groupId = extractGroupId(workerItem.parentId!);
        groupIdsToAssign.add(groupId);
      } else {
        workersToAssign.push(assignment);
      }
    } else {
      // Unassigning: include group ID if worker belongs to a group
      if (
        workerItem.parentId &&
        String(workerItem.parentId).startsWith(GROUP_PREFIX)
      ) {
        const groupId = extractGroupId(workerItem.parentId);
        groupIdsToUnassign.add(groupId);
      }
      workersToUnassign.push(assignment);
    }
  };

  /**
   * Routes each ID to the appropriate handler based on its type.
   */
  const processSelection = (ids: Set<string | number>, isAssign: boolean) => {
    ids.forEach((id) => {
      const idStr = String(id);

      if (idStr.startsWith(GROUP_PREFIX)) {
        handleGroupSelection(idStr, isAssign);
      } else if (idStr === NO_GROUP_ID) {
        handleNoGroupSelection(isAssign);
      } else {
        handleIndividualWorkerSelection(idStr, isAssign);
      }
    });
  };

  processSelection(changes.newlyAssigned, true);
  processSelection(changes.newlyUnassigned, false);

  return {
    workersToAssign,
    workersToUnassign,
    groupIdsToAssign: Array.from(groupIdsToAssign),
    groupIdsToUnassign: Array.from(groupIdsToUnassign),
  };
}

/**
 * Transforms selected customer/project IDs into proper mutation input format.
 */
export function transformTimeAgainstIds(
  ids: Set<string | number>,
  apiData: any[] | undefined,
): TimeAgainstAssignment[] {
  return Array.from(ids).map((id) => {
    const idStr = String(id);

    // Look up the original item from API data to get full customer/project info
    const originalItem = apiData?.find((item) => {
      const customerId = item.timeAgainstContactDAS?.customer?.id;
      const projectId = item.timeAgainstContactDAS?.project?.id;
      // Match by either customerId or projectId
      return customerId === idStr || projectId === idStr;
    });

    if (originalItem) {
      const customerId = originalItem.timeAgainstContactDAS.customer?.id;
      const projectId = originalItem.timeAgainstContactDAS.project?.id;

      // Project: has both customerId and projectId
      if (projectId && customerId) {
        return { customerId, projectId };
      }
      // Customer only: has only customerId
      if (customerId) {
        return { customerId };
      }
    }

    // Fallback: assume the ID is a customerId
    // This handles edge cases where the item isn't found in apiData
    return { customerId: idStr };
  });
}

/**
 * Builds hierarchical timeAgainstList based on the node being acted upon.
 *
 * Rules:
 * - Action on parent: Include parent + all its descendants (children, grandchildren, etc.)
 * - Action on child: Include child + all its ancestors (parents up to root, NOT siblings)
 *
 * @param nodeEdge - The node (customer/project) being acted upon
 * @param allEdges - All edges from the API data to traverse hierarchy
 * @returns Array of TimeAgainstAssignment for the mutation
 */
export function buildHierarchicalTimeAgainstList(
  nodeEdge: any,
  allEdges: any[],
): TimeAgainstAssignment[] {
  const result: TimeAgainstAssignment[] = [];
  const processedIds = new Set<string>();

  // Extract data structures
  type EdgeData = {
    edge: any;
    nodeId: string;
    parentId: string | null;
    customerId: string | null;
    projectId: string | null;
    isCustomer: boolean;
  };

  // Build lookup maps for O(1) access - preprocessing step
  const edgesByNodeId = new Map<string, EdgeData>();
  const childrenByParentId = new Map<string, EdgeData[]>();

  // Single pass to build all lookup structures - O(n)
  allEdges.forEach((edge) => {
    const { timeAgainst } = edge.node;
    const { timeAgainstContactDAS } = timeAgainst;
    const projectId = timeAgainstContactDAS.project?.id || null;
    const customerId = timeAgainstContactDAS.customer?.id || null;
    const nodeId = projectId || customerId || '';
    const parentId = timeAgainst.parentId || null;
    const isCustomer = !!customerId && !projectId;

    if (!nodeId) return; // Skip invalid edges

    const edgeData: EdgeData = {
      edge,
      nodeId,
      parentId,
      customerId,
      projectId,
      isCustomer,
    };

    edgesByNodeId.set(nodeId, edgeData);

    if (parentId) {
      if (!childrenByParentId.has(parentId)) {
        childrenByParentId.set(parentId, []);
      }
      childrenByParentId.get(parentId)!.push(edgeData);
    }
  });

  // Extract current node info
  const { timeAgainstContactDAS, parentId } = nodeEdge.node.timeAgainst;
  const { project, customer } = timeAgainstContactDAS;
  const currentNodeId = project?.id || customer?.id || '';

  // Helper to find the parent customer ID for a project - now O(1) with memoization
  const customerIdCache = new Map<string, string>();
  const findParentCustomerId = (nodeId: string): string => {
    if (customerIdCache.has(nodeId)) {
      return customerIdCache.get(nodeId)!;
    }

    const edgeData = edgesByNodeId.get(nodeId);
    if (!edgeData) {
      customerIdCache.set(nodeId, '');
      return '';
    }

    // If it's a customer, return its ID
    if (edgeData.isCustomer) {
      const result = edgeData.customerId || '';
      customerIdCache.set(nodeId, result);
      return result;
    }

    // If it's a project with customer ID, return it
    if (edgeData.customerId) {
      customerIdCache.set(nodeId, edgeData.customerId);
      return edgeData.customerId;
    }

    // If it's a project without customer, find parent's customer ID
    if (edgeData.parentId) {
      const result = findParentCustomerId(edgeData.parentId);
      customerIdCache.set(nodeId, result);
      return result;
    }

    customerIdCache.set(nodeId, '');
    return '';
  };

  // Helper to create TimeAgainstAssignment from edge data
  const createAssignment = (edgeData: EdgeData): TimeAgainstAssignment => {
    if (edgeData.projectId && edgeData.customerId) {
      return { customerId: edgeData.customerId, projectId: edgeData.projectId };
    }
    if (edgeData.projectId) {
      const customerId = findParentCustomerId(edgeData.nodeId);
      return { customerId, projectId: edgeData.projectId };
    }
    if (edgeData.customerId) {
      return { customerId: edgeData.customerId };
    }
    return { customerId: '' };
  };

  // Helper to add assignment if not already processed
  const addAssignment = (edgeData: EdgeData) => {
    if (edgeData.nodeId && !processedIds.has(edgeData.nodeId)) {
      result.push(createAssignment(edgeData));
      processedIds.add(edgeData.nodeId);
    }
  };

  // Collect all descendants using map lookup - O(n) instead of O(n²)
  const collectDescendants = (parentNodeId: string) => {
    const children = childrenByParentId.get(parentNodeId) || [];
    children.forEach((childData) => {
      addAssignment(childData);
      // Recursively collect this child's descendants
      collectDescendants(childData.nodeId);
    });
  };

  // Collect all ancestors using map lookup - O(h) where h is height
  const collectAncestors = (childParentId: string | null | undefined) => {
    if (!childParentId) return;

    const parentData = edgesByNodeId.get(childParentId);
    if (parentData) {
      addAssignment(parentData);
      // Recursively collect this parent's ancestors
      if (parentData.parentId) {
        collectAncestors(parentData.parentId);
      }
    }
  };

  // Add the current node first
  const currentEdgeData = edgesByNodeId.get(currentNodeId);
  if (currentEdgeData) {
    addAssignment(currentEdgeData);
  } else if (currentNodeId) {
    // Handle edge case where current node is not in the lookup (nodeEdge not in allEdges)
    const das = nodeEdge.node.timeAgainst.timeAgainstContactDAS;
    const edgeData: EdgeData = {
      edge: nodeEdge,
      nodeId: currentNodeId,
      parentId: parentId || null,
      customerId: das.customer?.id || null,
      projectId: das.project?.id || null,
      isCustomer: !!das.customer?.id && !das.project?.id,
    };
    addAssignment(edgeData);
  }

  if (!parentId) {
    // Current node is a parent (root level) - collect all descendants
    collectDescendants(currentNodeId);
  } else {
    // Current node is a child - collect all ancestors (NOT siblings)
    collectAncestors(parentId);
  }

  return result;
}

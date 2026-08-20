// Custom types for Time Against Assignment Summary Query
// These types replace generated GraphQL types for better control and maintenance

import { TimeTracking_TimeForType } from 'src/__generated__/timeTracking/graphql';

export interface TimeAgainstAssignmentSummaryQueryVariables {
  first?: number;
  after?: string;
}

export interface TimeAgainstContact {
  project?: {
    id: string;
  };
  customer?: {
    id: string;
  };
}

export interface ShippingAddress {
  lines?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
}

export interface TimeAgainstAssignment {
  timeAgainstContactDAS: TimeAgainstContact;
  shippingAddress?: ShippingAddress | null;
  assigned: boolean;
  displayName?: string;
  fullName?: string;
  customerType?: string;
  active?: boolean;
  parentId?: string;
  level?: number;
  numChildren?: number;
}

export interface TimeAgainstAssignmentSummary {
  timeAgainst: TimeAgainstAssignment;
  assignedTimeForCount: number;
  assignedCustomFieldCount: number;
  assignedStandardFieldCount: number;
}

export interface TimeAgainstAssignmentSummaryEdge {
  node: TimeAgainstAssignmentSummary;
  cursor: string;
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
}

export interface TimeAgainstAssignmentSummaryConnection {
  edges: TimeAgainstAssignmentSummaryEdge[];
  pageInfo: PageInfo;
  totalTimeForAssignments: number;
  totalCustomFieldAssignments: number;
  totalStandardFieldAssignments: number;
  totalTimeAgainstCount: number;
}

export interface TimeAgainstAssignmentSummaryQueryResult {
  timeTrackingTimeAgainstAssignmentSummary?: TimeAgainstAssignmentSummaryConnection;
}

// Types for Time Against Assignments Query
export interface TimeAgainstAssignmentsQueryVariables {
  first?: number;
  after?: string;
  input: {
    timeForEntityId?: string;
    standardFieldLabel?: string;
    customFieldId?: string;
  };
  filter?: {
    searchText?: string;
    assigned?: boolean;
  };
}

export interface TimeAgainstAssignmentEdge {
  node: TimeAgainstAssignment;
  cursor: string;
}

export interface TimeAgainstAssignmentsConnection {
  edges: TimeAgainstAssignmentEdge[];
  pageInfo: PageInfo;
  totalTimeAgainstCount: number;
}

export interface TimeAgainstAssignmentsQueryResult {
  timeTrackingTimeAgainstAssignments?: TimeAgainstAssignmentsConnection;
}

// Types for Time For Assignments Query
export interface TimeForAssignmentsQueryVariables {
  first?: number;
  after?: string;
  input: {
    projectId?: string;
    customerId?: string;
    customFieldOptionId?: string;
    customFieldId?: string;
    standardFieldLabel?: string;
  };
  filter?: {
    searchText?: string;
    assigned?: boolean;
  };
}

export interface TimeForContact {
  id: string;
}

export interface TimeForAssignment {
  timeForContactDAS: TimeForContact;
  assigned: boolean;
  displayName?: string;
  fullName?: string;
  contractor?: boolean;
  groupId?: string;
  groupName?: string;
  timeForType?: TimeTracking_TimeForType;
}

export interface TimeForAssignmentEdge {
  node: TimeForAssignment;
  cursor: string;
}

export interface TimeForAssignmentsConnection {
  edges: TimeForAssignmentEdge[];
  pageInfo: PageInfo;
}

export interface TimeForAssignmentsQueryResult {
  timeTrackingTimeForAssignments?: TimeForAssignmentsConnection;
}

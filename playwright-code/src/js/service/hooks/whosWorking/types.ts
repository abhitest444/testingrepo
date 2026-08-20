/**
 * Types for Who's Working feature
 * Manually defined to avoid codegen dependency on federated schema
 *
 * QUANTA-6283: Who's Working API Integration
 */

// ============================================================================
// Enums
// ============================================================================

/** Sort order direction */
export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

/** Fields to order who's working results by */
export enum WhoIsWorkingOrderOn {
  /** Order by clock-in time. Null values (not clocked in) appear last. */
  CLOCK_IN_TIME = 'CLOCK_IN_TIME',
  /** Order by total seconds worked for the day. */
  DAILY_TOTAL = 'DAILY_TOTAL',
  /** Order by group name. Only applicable when BY_GROUP display mode is used. */
  GROUP_NAME = 'GROUP_NAME',
  /** Order by whether the worker has a current location. Workers with location data appear first when DESC. */
  HAS_GEOLOCATION = 'HAS_GEOLOCATION',
  /** Order by whether the worker is on-the-clock. Workers with open time entries appear first when DESC. */
  ON_THE_CLOCK = 'ON_THE_CLOCK',
  /** Order by worker name (sorted by displayName, then firstName, then lastName). */
  TIME_FOR_NAME = 'TIME_FOR_NAME',
}

/** Time for type - employee or vendor */
export enum TimeForType {
  EMPLOYEE = 'EMPLOYEE',
  VENDOR = 'VENDOR',
}

// ============================================================================
// Input Types (for query variables)
// ============================================================================

/** Date period filter */
export interface DatePeriod {
  /** Beginning date of period */
  beginDate: string;
  /** Ending date of period */
  endDate: string;
}

/** Filter for who's working query */
export interface WhoIsWorkingFilter {
  /** When true, returns only workers currently on the clock */
  clockedInTimeForOnly?: boolean;
  /** Date range filter */
  dateRange?: DatePeriod;
  /** Search text to filter workers by name */
  searchText?: string;
}

/** Order by input for who's working query */
export interface WhoIsWorkingOrderBy {
  orderOn: WhoIsWorkingOrderOn;
  orderDirection: SortOrder;
}

/** Query variables for who's working query */
export interface WhoIsWorkingQueryVariables {
  first?: number;
  after?: string;
  filter: WhoIsWorkingFilter;
  orderBy?: WhoIsWorkingOrderBy[];
}

// ============================================================================
// Response Types
// ============================================================================

/** Contact reference with ID */
export interface ContactDAS {
  id: string;
  displayName?: string;
}

/** Time against contact for time entry */
export interface TrackTimeAgainstContact {
  customer?: ContactDAS;
  project?: ContactDAS;
}

/** Active time entry for a worker */
export interface WhoIsWorkingTimeEntry {
  id: string;
  startTime?: string;
  duration?: number;
  isOpen?: boolean;
  timeAgainstContactDAS?: TrackTimeAgainstContact;
}

/** Group profile for a worker */
export interface GroupProfile {
  groupId: string;
  groupName: string;
}

/** Location point */
export interface LocationPoint {
  latitude: number;
  longitude: number;
}

/** Worker node from who's working query */
export interface WhoIsWorkingWorker {
  timeForContactDAS: {
    id: string;
  };
  firstName: string;
  lastName?: string;
  displayName: string;
  timeForType?: TimeForType;
  group?: GroupProfile;
  totalDaySeconds: number;
  activeTimeEntry?: WhoIsWorkingTimeEntry;
  currentLocation?: LocationPoint;
}

/** Edge in the workers connection */
export interface WhoIsWorkingEdge {
  cursor: string;
  node: WhoIsWorkingWorker;
}

/** Page info for pagination */
export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
}

/** Summary statistics */
export interface WhoIsWorkingSummary {
  totalOnClock: number;
  totalWorkers: number;
}

/** Who's working connection (paginated result) */
export interface WhoIsWorkingConnection {
  pageInfo: PageInfo;
  summary: WhoIsWorkingSummary;
  edges: WhoIsWorkingEdge[];
}

/** Query response data */
export interface WhoIsWorkingQueryData {
  timeTrackingWhoIsWorking: WhoIsWorkingConnection;
}

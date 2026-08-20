import { LazyQueryResultTuple } from '@apollo/client';

export interface WeeklyTimeEntryQueryVariables {
  input: {
    orderBy?: Array<{
      orderOn: string;
      orderDirection: string;
    }>;
    timeEntryFilter?: {
      date?: {
        onOrAfter?: string;
        onOrBefore?: string;
      };
      isExported?: boolean;
      timeForEntityId?: {
        equals?: string;
      };
      [key: string]: any; // Allow additional filter properties
    };
    [key: string]: any; // Allow additional input properties
  };
  first?: number;
  after?: string;
  offset?: number;
}

export interface WeeklyTimeEntry {
  id: string;
  alternateIds: Array<{
    id: string;
    nameSpace: string;
  }>;
  timeForType: string;
  timeForContactDAS?: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
  date?: string;
  startTime?: string;
  endTime?: string;
  v3StartTime?: string;
  v3EndTime?: string;
  duration?: number;
  v3DurationDetails?: {
    hours: number;
    minutes: number;
    seconds: number;
  };
  v3BreakDuration?: number;
  v3BreakDurationDetails?: {
    hours: number;
    minutes: number;
    seconds: number;
  };
  timeAgainstContactDAS?: {
    project?: {
      id: string;
      firstName?: string;
      lastName?: string;
    };
    customer?: {
      id: string;
      firstName?: string;
      lastName?: string;
      displayName?: string;
    };
  };
  classDAS?: {
    id: string;
    name: string;
    fullName: string;
  };
  serviceItemDAS?: {
    id: string;
    fullName: string;
    saleDetails: {
      description: string;
    };
  };
  payrollItem?: {
    id: string;
  };
  departmentDAS?: {
    id: string;
    fullName: string;
  };
  billableRate?: number;
  costRate?: number;
  notes?: string;
  taxable?: boolean;
  billableStatus?: string;
  v3TransactionLocationType?: string;
  isOpen?: boolean;
  isSubmitted?: boolean;
  approvalStatus?: string;
  isExported?: boolean;
  timeZone?: string;
  attachmentsCount?: number;
  locked?: boolean;
  invoiceId?: string;
  meta?: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    version: number;
  };
  legacyCustomFields?: Array<{
    id: string;
    name: string;
    value: string;
  }>;
  timeBreakId?: string;
  isTimeOffEntry?: boolean;
  timeOffCategoryName?: string;
  timeOffRequestExternalId?: string;
}

export interface WeeklyTimeEntriesQueryData {
  timeTrackingTimeEntries: {
    edges: Array<{
      node: WeeklyTimeEntry;
      cursor: string;
    }>;
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor?: string;
      endCursor?: string;
    };
  };
}

// Define the return type for our custom hook using Apollo's built-in type
export type WeeklyTimeEntriesLazyQueryHookResult = LazyQueryResultTuple<
  WeeklyTimeEntriesQueryData,
  WeeklyTimeEntryQueryVariables
>;

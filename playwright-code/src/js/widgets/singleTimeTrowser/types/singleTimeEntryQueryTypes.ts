import { LazyQueryResultTuple } from '@apollo/client';

export interface SingleTimeEntryQueryVariables {
  input: {
    id: string;
    isExported?: boolean;
  };
}

export interface TimeAgainstContactDAS {
  customer?: {
    id: string;
    fullName?: string;
  };
}

export interface TimeForContactDAS {
  id: string;
  firstName?: string;
  lastName?: string;
}

export interface SingleTimeEntry {
  id: string;
  alternateIds: Array<{
    id: string;
    nameSpace: string;
  }>;
  timeForType: string;
  timeForContactDAS?: TimeForContactDAS;
  timeAgainstContactDAS?: TimeAgainstContactDAS;
  serviceItemDAS?: {
    id: string;
    fullName?: string;
  };
  classDAS?: {
    id: string;
    fullName?: string;
  };
  departmentDAS?: {
    id: string;
    fullName?: string;
  };
  timeFor?: {
    id: string;
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
  timeAgainst?: {
    project?: {
      id: string;
    };
    customer?: {
      id: string;
    };
  };
  class?: {
    id: string;
  };
  serviceItem?: {
    id: string;
  };
  payrollItem?: {
    id: string;
  };
  department?: {
    id: string;
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
  lockedReason?: string;
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
  distanceTracking?: {
    autoCalculatedMeters?: number;
    manualMeters?: number;
  };
}

export interface SingleTimeEntryQueryData {
  timeTrackingTimeEntry: SingleTimeEntry;
}

// Define the return type for our custom hook using Apollo's built-in type
export type SingleTimeEntryLazyQueryHookResult = LazyQueryResultTuple<
  SingleTimeEntryQueryData,
  SingleTimeEntryQueryVariables
>;

import { useLazyQuery, LazyQueryHookOptions } from '@apollo/client';
import gql from 'graphql-tag';
import { useWeeklyTimeEntryClient } from '../components/WeeklyTimeEntryApolloProvider';
import {
  WeeklyTimeEntriesLazyQueryHookResult,
  WeeklyTimeEntriesQueryData,
  WeeklyTimeEntry,
  WeeklyTimeEntryQueryVariables,
} from '../types/weeklyTimeEntryQueryTypes';

const TIME_ENTRY_FRAGMENT = gql`
  fragment TimeEntryParts on TimeTracking_TimeEntry {
    id
    alternateIds {
      id
      nameSpace
    }
    timeForType
    timeForContactDAS {
      id
      firstName
      lastName
    }
    date
    startTime
    endTime
    v3StartTime
    v3EndTime
    duration
    v3DurationDetails {
      hours
      minutes
      seconds
    }
    v3BreakDuration
    v3BreakDurationDetails {
      hours
      minutes
      seconds
    }
    timeAgainstContactDAS {
      project {
        id
        firstName
        lastName
      }
      customer {
        id
        firstName
        lastName
        displayName
      }
    }
    classDAS {
      id
      name
      fullName
    }
    serviceItemDAS {
      id
      fullName
      saleDetails {
        description
      }
    }
    payrollItem {
      id
    }
    departmentDAS {
      id
      fullName
    }
    billableRate
    costRate
    notes
    taxable
    billableStatus
    v3TransactionLocationType
    isOpen
    isSubmitted
    approvalStatus
    isExported
    timeZone
    attachmentsCount
    locked
    invoiceId
    timeZone
    meta {
      createdAt
      updatedAt
      createdBy
      version
    }
    legacyCustomFields {
      id
      name
      value
    }
    customExtensions {
      dimensions {
        definition {
          id
        }
        values
      }
    }
    timeBreakId
    isTimeOffEntry
    timeOffCategoryName
    timeOffRequestExternalId
  }
`;

// GraphQL query for fetching time entries
const SEARCH_TIME_ENTRIES_QUERY = gql`
  query searchTimeEntries(
    $input: TimeTracking_TimeEntriesInput!
    $first: Int
    $after: String
    $offset: Int
  ) {
    timeTrackingTimeEntries(
      input: $input
      first: $first
      after: $after
      offset: $offset
    ) {
      edges {
        node {
          ...TimeEntryParts
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
  ${TIME_ENTRY_FRAGMENT}
`;

// Custom hook to fetch weekly time entries using the new Apollo client (lazy version)
export const useWeeklyTimeEntriesQuery = (
  baseOptions?: LazyQueryHookOptions<
    WeeklyTimeEntriesQueryData,
    WeeklyTimeEntryQueryVariables
  >,
): WeeklyTimeEntriesLazyQueryHookResult => {
  const weeklyClient = useWeeklyTimeEntryClient();

  return useLazyQuery<
    WeeklyTimeEntriesQueryData,
    WeeklyTimeEntryQueryVariables
  >(SEARCH_TIME_ENTRIES_QUERY, {
    client: weeklyClient, // Use the custom client
    fetchPolicy: 'no-cache',
    errorPolicy: 'all',
    ...baseOptions, // Allow additional options to be passed through
  });
};

export const mapWeeklyTimeEntriesResult = (
  data?: WeeklyTimeEntriesQueryData,
): WeeklyTimeEntry[] =>
  data?.timeTrackingTimeEntries?.edges?.map(
    (edge) => edge.node as WeeklyTimeEntry,
  ) || [];

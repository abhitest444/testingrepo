/* eslint-disable camelcase */

import { ApolloError } from '@apollo/client';
import {
  BATCH_SAVE_TIME_ENTRIES,
  CREATE_TIME_ENTRY_MUTATION,
  DELETE_TIME_ENTRY_MUTATION,
  GET_TIME_ENTRY_QUERY,
  SEARCH_TIME_ENTRIES_QUERY,
  UPDATE_TIME_ENTRY_MUTATION,
} from 'src/js/service/queries/timeTrackingQueries';
import {
  aMutation,
  aQuery,
  aTimeTracking_BatchManageTimeEntriesInput,
  aTimeTracking_BatchManageTimeEntriesPayload,
  aTimeTracking_CreateTimeEntryInput,
  aTimeTracking_CreateTimeEntryPayload,
  aTimeTracking_DeleteTimeEntryInput,
  aTimeTracking_DeleteTimeEntryPayload,
  aTimeTracking_TimeEntriesInput,
  aTimeTracking_TimeEntryInput,
  aTimeTracking_UpdateTimeEntryInput,
  aTimeTracking_UpdateTimeEntryPayload,
} from '__mocks__/__generated__/timeTracking';

export const TIME_ENTRIES_SUCCESS_MOCKS = [
  {
    request: {
      query: CREATE_TIME_ENTRY_MUTATION,
      variables: {
        input: aTimeTracking_CreateTimeEntryInput(),
      },
    },
    result: {
      data: aMutation({
        timeTrackingCreateTimeEntry: aTimeTracking_CreateTimeEntryPayload(),
      }),
    },
  },
  {
    request: {
      query: UPDATE_TIME_ENTRY_MUTATION,
      variables: {
        input: aTimeTracking_UpdateTimeEntryInput(),
      },
    },
    result: {
      data: aMutation({
        timeTrackingUpdateTimeEntry: aTimeTracking_UpdateTimeEntryPayload(),
      }),
    },
  },
  {
    request: {
      query: DELETE_TIME_ENTRY_MUTATION,
      variables: {
        input: aTimeTracking_DeleteTimeEntryInput(),
      },
    },
    result: {
      data: aMutation({
        timeTrackingDeleteTimeEntry: aTimeTracking_DeleteTimeEntryPayload(),
      }),
    },
  },
  {
    request: {
      query: GET_TIME_ENTRY_QUERY,
      variables: {
        input: {
          id: aTimeTracking_TimeEntryInput().id,
        },
      },
    },
    result: {
      data: aQuery(),
    },
  },
  {
    request: {
      query: SEARCH_TIME_ENTRIES_QUERY,
      variables: {
        input: aTimeTracking_TimeEntriesInput(),
      },
    },
    result: {
      data: aQuery(),
    },
  },
  {
    request: {
      query: BATCH_SAVE_TIME_ENTRIES,
      variables: {
        input: aTimeTracking_BatchManageTimeEntriesInput(),
      },
    },
    result: {
      data: aMutation({
        timeTrackingBatchManageTimeEntries:
          aTimeTracking_BatchManageTimeEntriesPayload(),
      }),
    },
  },
];

export const TIME_ENTRIES_APOLLO_ERROR_MOCKS = [
  {
    request: {
      query: CREATE_TIME_ENTRY_MUTATION,
      variables: {
        input: aTimeTracking_CreateTimeEntryInput(),
      },
    },
    error: new ApolloError({ errorMessage: 'An error occurred' }),
  },
  {
    request: {
      query: UPDATE_TIME_ENTRY_MUTATION,
      variables: {
        input: aTimeTracking_UpdateTimeEntryInput(),
      },
    },
    error: new ApolloError({ errorMessage: 'An error occurred' }),
  },
  {
    request: {
      query: DELETE_TIME_ENTRY_MUTATION,
      variables: {
        input: aTimeTracking_DeleteTimeEntryInput(),
      },
    },
    error: new ApolloError({ errorMessage: 'An error occurred' }),
  },
  {
    request: {
      query: GET_TIME_ENTRY_QUERY,
      variables: {
        input: aTimeTracking_TimeEntryInput(),
      },
    },
    error: new ApolloError({ errorMessage: 'An error occurred' }),
  },
  {
    request: {
      query: SEARCH_TIME_ENTRIES_QUERY,
      variables: {
        input: aTimeTracking_TimeEntriesInput(),
      },
    },
    error: new ApolloError({ errorMessage: 'An error occurred' }),
  },
  {
    request: {
      query: BATCH_SAVE_TIME_ENTRIES,
      variables: {
        input: aTimeTracking_BatchManageTimeEntriesInput(),
      },
    },
    error: new ApolloError({ errorMessage: 'An error occurred' }),
  },
];

export const TIME_QUERY_ERROR_MOCKS = [
  {
    request: {
      query: CREATE_TIME_ENTRY_MUTATION,
      variables: {
        input: aTimeTracking_CreateTimeEntryInput(),
      },
    },
    result: aMutation(),
  },
  {
    request: {
      query: UPDATE_TIME_ENTRY_MUTATION,
      variables: {
        input: aTimeTracking_UpdateTimeEntryInput(),
      },
    },
    result: aMutation(),
  },
  {
    request: {
      query: DELETE_TIME_ENTRY_MUTATION,
      variables: {
        input: aTimeTracking_DeleteTimeEntryInput(),
      },
    },
    result: aMutation(),
  },
  {
    request: {
      query: BATCH_SAVE_TIME_ENTRIES,
      variables: {
        input: aTimeTracking_BatchManageTimeEntriesInput(),
      },
    },
    result: aMutation(),
  },
];

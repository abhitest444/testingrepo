/* eslint-disable camelcase */

import { act } from '@testing-library/react-hooks';
import { aTimeTracking_TimeEntriesInput } from '__mocks__/__generated__/timeTracking';
import { renderHookWithApolloProvider } from 'test/unit/testUtils';
import {
  TIME_ENTRIES_APOLLO_ERROR_MOCKS,
  TIME_ENTRIES_SUCCESS_MOCKS,
} from 'test/unit/service/queries/timeTrackingQueries';
import { useLazySearchTimeEntries } from '../../../../../src/js/service/hooks/timeEntries/useLazySearchTimeEntries';

describe('useLazySearchTimeEntries', () => {
  it('should return loading state initially', () => {
    const { result } = renderHookWithApolloProvider(
      () => useLazySearchTimeEntries(),
      TIME_ENTRIES_SUCCESS_MOCKS,
    );

    expect(result.current.loading).toBe(false); // since lazy, will not load on hook render
    expect(result.current.error).toBeUndefined();
    expect(result.current.data).toEqual(undefined);
  });

  it('should return data after query is successful', async () => {
    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useLazySearchTimeEntries(),
      TIME_ENTRIES_SUCCESS_MOCKS,
    );

    act(() => {
      result.current.query({
        variables: {
          input: aTimeTracking_TimeEntriesInput(),
        },
      });
    });

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.data!.length).toEqual(1);
  });

  it('should return error if query fails', async () => {
    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useLazySearchTimeEntries(),
      TIME_ENTRIES_APOLLO_ERROR_MOCKS,
    );

    act(() => {
      result.current.query({
        variables: {
          input: aTimeTracking_TimeEntriesInput(),
        },
      });
    });

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeDefined();
    expect(result.current.data).toEqual(undefined);
  });

  it('should reset data when resetData is called', async () => {
    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useLazySearchTimeEntries(),
      TIME_ENTRIES_SUCCESS_MOCKS,
    );

    act(() => {
      result.current.query({
        variables: {
          input: aTimeTracking_TimeEntriesInput(),
        },
      });
    });

    await waitForNextUpdate();

    // Ensure data is populated
    expect(result.current.data).not.toEqual(undefined);

    // Call resetData to clear the data
    act(() => {
      result.current.resetData();
    });

    // Check if data is reset to an empty array
    expect(result.current.data).toEqual(undefined);
  });
});

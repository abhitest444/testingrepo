import { act } from '@testing-library/react-hooks';
import {
  renderHookWithAllProviders,
  getDefaultSandbox,
} from 'test/unit/testUtils';
import { useTTOTimeWindowDuration } from 'src/js/widgets/ttoHomePage/features/details-page/useTTOTimeWindowDuration';
import { GetTotalWorkDurationByTimeWindowDocument } from 'src/__generated__/timeTracking/graphql';

jest.mock('src/nls', () => ({
  __esModule: true,
  default: {
    requireNlsForLocale: jest.fn().mockReturnValue({}),
  },
}));

jest.mock('src/js/common/CustomerInteraction', () => ({
  TimeCustomerInteraction: {
    TOTAL_DURATION_BY_TIME_WINDOW_READ: 'total-duration-by-time-window-read',
  },
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  getCustomerInteractionPropagationHeaders: jest.fn().mockReturnValue({}),
}));

const mockInput = {
  input: { timeForEntityId: 'id', timeWindow: 'WEEK', timeWindowOffset: 0 },
};

describe('useTTOTimeWindowDuration', () => {
  it('returns default values and allows fetch', () => {
    const { result } = renderHookWithAllProviders(
      () => useTTOTimeWindowDuration(),
      [],
      {},
      getDefaultSandbox(),
    );
    const [fetch, state] = result.current;
    expect(state.duration).toBeNull();
    expect(state.loading).toBe(false);
    fetch({ variables: mockInput });
  });

  it('should handle fetch called with no options (undefined context)', () => {
    const { result } = renderHookWithAllProviders(
      () => useTTOTimeWindowDuration(),
      [],
      {},
      getDefaultSandbox(),
    );
    const [fetch] = result.current;
    // Call with undefined options to cover the options?.context === undefined branch
    fetch(undefined);
  });

  it('returns loading state and then success', async () => {
    const mocks = [
      {
        request: {
          query: GetTotalWorkDurationByTimeWindowDocument,
          variables: mockInput,
        },
        result: {
          data: {
            timeTrackingTotalDurationByTimeWindow: {
              totalDurationSeconds: 1234,
              __typename: 'TimeTracking_TotalDurationByTimeWindow',
            },
          },
        },
        delay: 10,
      },
    ];
    const { result, waitForNextUpdate } = renderHookWithAllProviders(
      () => useTTOTimeWindowDuration(),
      mocks,
      {},
      getDefaultSandbox(),
    );
    const [fetch] = result.current;
    act(() => {
      fetch({ variables: mockInput });
    });
    expect(result.current[1].loading).toBe(true);
    await waitForNextUpdate();
    expect(result.current[1].duration).toBe(1234);
    expect(result.current[1].loading).toBe(false);
  });

  it('should merge existing context and headers when provided', async () => {
    const mocks = [
      {
        request: {
          query: GetTotalWorkDurationByTimeWindowDocument,
          variables: mockInput,
        },
        result: {
          data: {
            timeTrackingTotalDurationByTimeWindow: {
              totalDurationSeconds: 5678,
              __typename: 'TimeTracking_TotalDurationByTimeWindow',
            },
          },
        },
      },
    ];
    const { result, waitForNextUpdate } = renderHookWithAllProviders(
      () => useTTOTimeWindowDuration(),
      mocks,
      {},
      getDefaultSandbox(),
    );
    const [fetch] = result.current;
    act(() => {
      fetch({
        variables: mockInput,
        context: {
          someExistingProp: 'value',
          headers: { 'x-custom-header': 'test' },
        },
      });
    });
    await waitForNextUpdate();
    expect(result.current[1].duration).toBe(5678);
  });

  it('returns error state on error', async () => {
    const mocks = [
      {
        request: {
          query: GetTotalWorkDurationByTimeWindowDocument,
          variables: mockInput,
        },
        error: new Error('Test error'),
      },
    ];
    const { result, waitForNextUpdate } = renderHookWithAllProviders(
      () => useTTOTimeWindowDuration(),
      mocks,
      {},
      getDefaultSandbox(),
    );
    const [fetch] = result.current;
    act(() => {
      fetch({ variables: mockInput });
    });
    await waitForNextUpdate();
    expect(result.current[1].error).toBeDefined();
    expect(result.current[1].duration).toBeNull();
  });
});

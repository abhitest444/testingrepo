import { renderHook } from '@testing-library/react-hooks';
import { useSubmitTimeMutations } from 'src/js/widgets/qbtOrchestrator/features/approvals/hooks/useSubmitTimeMutations';

jest.mock('@payroll/quicksand', () => ({
  useSandbox: () => ({}),
}));

jest.mock('src/js/service/ApolloClientBuilderUtils', () => ({
  buildHeaders: jest.fn(() => ({})),
}));

jest.mock('src/js/service/rest/TSheetsApiClient', () => ({
  getTSheetsRestApiUrl: jest.fn(() => 'https://tsheets-e2e.api.intuit.com'),
}));

jest.mock('src/js/common/CustomerInteraction', () => ({
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  getCustomerInteraction: jest.fn(() => null),
  getCustomerInteractionPropagationHeaders: jest.fn(() => ({
    traceparent: '00-test',
  })),
  TimeCustomerInteraction: {
    SUBMIT_TIME_PANEL_ENTRY_SUBMITTED: 'submit-time-panel-entry-submitted',
  },
}));

describe('useSubmitTimeMutations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).fetch = jest.fn();
  });

  it('submits using provided userId without fetching current user', async () => {
    (global as any).fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        results: {
          users: {
            '123': {
              _status_code: 200,
              _status_message: 'Updated',
            },
          },
        },
      }),
    });

    const { result } = renderHook(() => useSubmitTimeMutations());
    await result.current.submitTime({
      throughDateIso: '2026-06-04',
      userId: 123,
    });

    expect((global as any).fetch).toHaveBeenCalledTimes(1);
    expect((global as any).fetch).toHaveBeenCalledWith(
      'https://tsheets-e2e.api.intuit.com/api/v1/users',
      expect.objectContaining({
        method: 'PUT',
        credentials: 'include',
        headers: expect.objectContaining({
          traceparent: '00-test',
        }),
        body: JSON.stringify({
          data: [{ id: 123, submitted_to: '2026-06-05' }],
        }),
      }),
    );
  });

  it('falls back to current_user lookup when userId is missing', async () => {
    (global as any).fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: {
            users: {
              '456': {
                id: 456,
              },
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: {
            users: {
              '456': {
                _status_code: 200,
                _status_message: 'Updated',
              },
            },
          },
        }),
      });

    const { result } = renderHook(() => useSubmitTimeMutations());
    await result.current.submitTime({
      throughDateIso: '2026-06-04',
    });

    expect((global as any).fetch).toHaveBeenCalledTimes(2);
    expect((global as any).fetch).toHaveBeenNthCalledWith(
      1,
      'https://tsheets-e2e.api.intuit.com/api/v1/current_user',
      expect.objectContaining({
        method: 'GET',
      }),
    );
    expect((global as any).fetch).toHaveBeenNthCalledWith(
      2,
      'https://tsheets-e2e.api.intuit.com/api/v1/users',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({
          data: [{ id: 456, submitted_to: '2026-06-05' }],
        }),
      }),
    );
  });

  it('throws when current_user does not provide a user id', async () => {
    (global as any).fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        results: {
          users: {},
        },
      }),
    });

    const { result } = renderHook(() => useSubmitTimeMutations());
    await expect(
      result.current.submitTime({
        throughDateIso: '2026-06-04',
      }),
    ).rejects.toThrow('Unable to resolve current user id for submission');
  });

  it('throws when PUT /users returns http error', async () => {
    (global as any).fetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'internal server error',
    });

    const { result } = renderHook(() => useSubmitTimeMutations());
    await expect(
      result.current.submitTime({
        throughDateIso: '2026-06-04',
        userId: 123,
      }),
    ).rejects.toThrow(
      'PUT https://tsheets-e2e.api.intuit.com/api/v1/users failed (500)',
    );
  });

  it('throws when current_user lookup http call fails', async () => {
    (global as any).fetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'current_user failed',
    });

    const { result } = renderHook(() => useSubmitTimeMutations());
    await expect(
      result.current.submitTime({
        throughDateIso: '2026-06-04',
      }),
    ).rejects.toThrow(
      'GET https://tsheets-e2e.api.intuit.com/api/v1/current_user failed (500)',
    );
  });

  it('throws when update status contains API error code', async () => {
    (global as any).fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        results: {
          users: {
            '123': {
              _status_code: 417,
              _status_message: 'Expectation Failed',
            },
          },
        },
      }),
    });

    const { result } = renderHook(() => useSubmitTimeMutations());
    await expect(
      result.current.submitTime({
        throughDateIso: '2026-06-04',
        userId: 123,
      }),
    ).rejects.toThrow('Expectation Failed');
  });

  it('throws when /users response has no update status', async () => {
    (global as any).fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        results: {
          users: {},
        },
      }),
    });

    const { result } = renderHook(() => useSubmitTimeMutations());
    await expect(
      result.current.submitTime({
        throughDateIso: '2026-06-04',
        userId: 123,
      }),
    ).rejects.toThrow('Missing user update status in /users response');
  });
});

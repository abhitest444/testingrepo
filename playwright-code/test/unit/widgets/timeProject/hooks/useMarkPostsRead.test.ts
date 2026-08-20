import { renderHook, act } from '@testing-library/react-hooks';
import { useMarkPostsRead } from 'src/js/widgets/timeProject/hooks/useMarkPostsRead';

const mockMutate = jest.fn();
const mockError = jest.fn();
const mockInfo = jest.fn();

jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useMutation: jest.fn(() => [mockMutate]),
}));

jest.mock('src/js/widgets/timeProject/utils/timeProjectLogging', () => ({
  ...jest.requireActual('src/js/widgets/timeProject/utils/timeProjectLogging'),
  useTimeProjectLogger: () => ({ error: mockError, info: mockInfo }),
  useTimeProjectSandbox: () => undefined,
}));

const args = {
  projectId: 'p1',
  workerId: '6',
  workerType: 'EMPLOYEE',
};

describe('useMarkPostsRead', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends the correct mutation variables', async () => {
    mockMutate.mockResolvedValueOnce({
      data: {
        timeTrackingMarkPostsRead: { successCode: 'SUCCESS' },
      },
    });
    const { result } = renderHook(() => useMarkPostsRead());

    await act(async () => {
      await result.current.markPostsRead(args);
    });

    expect(mockMutate).toHaveBeenCalledWith({
      variables: {
        input: {
          entityType: 'PROJECT',
          entityId: 'p1',
          workerId: '6',
          workerType: 'EMPLOYEE',
        },
      },
    });
  });

  it('returns success on a successful mutation', async () => {
    mockMutate.mockResolvedValueOnce({
      data: {
        timeTrackingMarkPostsRead: { successCode: 'SUCCESS' },
      },
    });
    const { result } = renderHook(() => useMarkPostsRead());

    let res: any;
    await act(async () => {
      res = await result.current.markPostsRead(args);
    });

    expect(res).toEqual({ success: true });
    expect(mockInfo).toHaveBeenCalledTimes(2);
  });

  it('returns success=false when successCode is absent', async () => {
    mockMutate.mockResolvedValueOnce({
      data: { timeTrackingMarkPostsRead: {} },
    });
    const { result } = renderHook(() => useMarkPostsRead());

    let res: any;
    await act(async () => {
      res = await result.current.markPostsRead(args);
    });

    expect(res).toEqual({ success: false });
  });

  it('returns success=false when data is null', async () => {
    mockMutate.mockResolvedValueOnce({ data: null });
    const { result } = renderHook(() => useMarkPostsRead());

    let res: any;
    await act(async () => {
      res = await result.current.markPostsRead(args);
    });

    expect(res).toEqual({ success: false });
  });

  it('logs GraphQL errors and returns success=false', async () => {
    mockMutate.mockResolvedValueOnce({
      data: null,
      errors: [{ message: 'Unauthorized' }, { message: 'Forbidden' }],
    });
    const { result } = renderHook(() => useMarkPostsRead());

    let res: any;
    await act(async () => {
      res = await result.current.markPostsRead(args);
    });

    expect(res).toEqual({ success: false });
    // withLoggedOperation logs the structured failure with the joined GraphQL
    // error messages as the `reason`.
    expect(mockError).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        result: 'failure',
        reason: 'Unauthorized; Forbidden',
      }),
    );
  });

  it('returns success=false and logs when the mutation throws', async () => {
    mockMutate.mockRejectedValueOnce(new Error('network error'));
    const { result } = renderHook(() => useMarkPostsRead());

    let res: any;
    await act(async () => {
      res = await result.current.markPostsRead(args);
    });

    expect(res).toEqual({ success: false });
    expect(mockError).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        errorMessage: 'network error',
      }),
    );
  });

  it('handles non-Error thrown values', async () => {
    mockMutate.mockRejectedValueOnce('string error');
    const { result } = renderHook(() => useMarkPostsRead());

    let res: any;
    await act(async () => {
      res = await result.current.markPostsRead(args);
    });

    expect(res).toEqual({ success: false });
    expect(mockError).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        errorMessage: 'string error',
      }),
    );
  });

  it('still returns success when GraphQL errors accompany a successCode', async () => {
    mockMutate.mockResolvedValueOnce({
      data: {
        timeTrackingMarkPostsRead: { successCode: 'SUCCESS' },
      },
      errors: [{ message: 'partial error' }],
    });
    const { result } = renderHook(() => useMarkPostsRead());

    let res: any;
    await act(async () => {
      res = await result.current.markPostsRead(args);
    });

    expect(res).toEqual({ success: true });
    expect(mockError).toHaveBeenCalled();
    expect(mockInfo).toHaveBeenCalled();
  });
});

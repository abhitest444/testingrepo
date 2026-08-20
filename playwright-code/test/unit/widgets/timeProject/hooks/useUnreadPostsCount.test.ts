import { renderHook, act } from '@testing-library/react-hooks';
import { useUnreadPostsCount } from 'src/js/widgets/timeProject/hooks/useUnreadPostsCount';

const mockLoadQuery = jest.fn();

jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useLazyQuery: jest.fn(() => [mockLoadQuery]),
}));

const mockInfo = jest.fn();
const mockError = jest.fn();

jest.mock('src/js/widgets/timeProject/utils/timeProjectLogging', () => ({
  ...jest.requireActual('src/js/widgets/timeProject/utils/timeProjectLogging'),
  useTimeProjectLogger: () => ({ info: mockInfo, error: mockError }),
  useTimeProjectSandbox: () => undefined,
}));

const mockDispatch = jest.fn();
jest.mock('src/js/widgets/timeProject/store', () => ({
  useAppDispatch: () => mockDispatch,
}));

jest.mock('src/js/widgets/timeProject/store/postsUiSlice', () => ({
  setUnreadCount: (count: number) => ({
    type: 'postsUi/setUnreadCount',
    payload: count,
  }),
}));

const buildResponse = (unreadCount: number) => ({
  data: {
    timeTrackingPostsUnreadCount: {
      projectId: 'p1',
      customerId: 'c1',
      workerId: 'w1',
      unreadCount,
    },
  },
});

describe('useUnreadPostsCount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exposes fetchUnreadCount function', () => {
    const { result } = renderHook(() => useUnreadPostsCount());
    expect(typeof result.current.fetchUnreadCount).toBe('function');
  });

  it('dispatches unread count to Redux on fetch', async () => {
    mockLoadQuery.mockResolvedValueOnce(buildResponse(7));
    const { result } = renderHook(() => useUnreadPostsCount());

    await act(async () => {
      await result.current.fetchUnreadCount('p1', 'c1', 'w1');
    });

    expect(mockLoadQuery).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'postsUi/setUnreadCount',
      payload: 7,
    });
  });

  it('sends correct variables with projectRefs and workerId', async () => {
    mockLoadQuery.mockResolvedValueOnce(buildResponse(0));
    const { result } = renderHook(() => useUnreadPostsCount());

    await act(async () => {
      await result.current.fetchUnreadCount('p1', 'c1', 'w1');
    });

    expect(mockLoadQuery).toHaveBeenCalledWith({
      variables: {
        input: {
          projectRefs: { projectId: 'p1', customerId: 'c1' },
          workerId: 'w1',
        },
      },
    });
  });

  it('omits customerId from projectRefs when undefined', async () => {
    mockLoadQuery.mockResolvedValueOnce(buildResponse(3));
    const { result } = renderHook(() => useUnreadPostsCount());

    await act(async () => {
      await result.current.fetchUnreadCount('p1', undefined, 'w1');
    });

    expect(mockLoadQuery.mock.calls[0][0].variables.input.projectRefs).toEqual({
      projectId: 'p1',
    });
  });

  it('dispatches 0 when response data is null', async () => {
    mockLoadQuery.mockResolvedValueOnce({
      data: { timeTrackingPostsUnreadCount: null },
    });
    const { result } = renderHook(() => useUnreadPostsCount());

    await act(async () => {
      await result.current.fetchUnreadCount('p1', 'c1', 'w1');
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'postsUi/setUnreadCount',
      payload: 0,
    });
  });

  it('dispatches 0 when the query throws', async () => {
    mockLoadQuery.mockRejectedValueOnce(new Error('network failure'));
    const { result } = renderHook(() => useUnreadPostsCount());

    await act(async () => {
      await result.current.fetchUnreadCount('p1', 'c1', 'w1');
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'postsUi/setUnreadCount',
      payload: 0,
    });
    expect(mockError).toHaveBeenCalled();
  });

  it('dispatches updated count on subsequent fetch', async () => {
    mockLoadQuery.mockRejectedValueOnce(new Error('fail'));
    const { result } = renderHook(() => useUnreadPostsCount());

    await act(async () => {
      await result.current.fetchUnreadCount('p1', 'c1', 'w1');
    });

    mockLoadQuery.mockResolvedValueOnce(buildResponse(2));
    await act(async () => {
      await result.current.fetchUnreadCount('p1', 'c1', 'w1');
    });

    expect(mockDispatch).toHaveBeenLastCalledWith({
      type: 'postsUi/setUnreadCount',
      payload: 2,
    });
  });

  it('hits the network on every call (no caching)', async () => {
    mockLoadQuery.mockResolvedValue(buildResponse(5));
    const { result } = renderHook(() => useUnreadPostsCount());

    await act(async () => {
      await result.current.fetchUnreadCount('p1', 'c1', 'w1');
    });
    expect(mockLoadQuery).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.fetchUnreadCount('p1', 'c1', 'w1');
    });
    expect(mockLoadQuery).toHaveBeenCalledTimes(2);
  });

  it('logs start and success events', async () => {
    mockLoadQuery.mockResolvedValueOnce(buildResponse(4));
    const { result } = renderHook(() => useUnreadPostsCount());

    await act(async () => {
      await result.current.fetchUnreadCount('p1', 'c1', 'w1');
    });

    expect(mockInfo).toHaveBeenCalledTimes(2);
  });

  it('logs failure event when query throws', async () => {
    mockLoadQuery.mockRejectedValueOnce(new Error('boom'));
    const { result } = renderHook(() => useUnreadPostsCount());

    await act(async () => {
      await result.current.fetchUnreadCount('p1', 'c1', 'w1');
    });

    expect(mockError).toHaveBeenCalledTimes(1);
  });
});

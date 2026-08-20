import { renderHook, act } from '@testing-library/react-hooks';
import { useDeletePost } from 'src/js/widgets/timeProject/hooks/useDeletePost';

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
  postId: 'post-42',
  projectId: 'p1',
  customerId: 'c1',
  workerId: '6',
  workerType: 'employee',
};

describe('useDeletePost', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts with inProgress=false', () => {
    const { result } = renderHook(() => useDeletePost());
    expect(result.current.inProgress).toBe(false);
  });

  it('sends the delete-post input', async () => {
    mockMutate.mockResolvedValueOnce({
      data: {
        timeTrackingDeletePost: {
          successCode: 'TIME_TRACKING_POST_DELETE_SUCCESS',
          deletedPostId: 'post-42',
        },
      },
    });
    const { result } = renderHook(() => useDeletePost());

    await act(async () => {
      await result.current.deletePost(args);
    });

    expect(mockMutate).toHaveBeenCalledWith({
      variables: {
        input: {
          id: 'post-42',
          projectRefs: { projectId: 'p1', customerId: 'c1' },
          workerId: '6',
          workerType: 'employee',
        },
      },
    });
  });

  it('returns success on a successful delete', async () => {
    mockMutate.mockResolvedValueOnce({
      data: {
        timeTrackingDeletePost: {
          successCode: 'TIME_TRACKING_POST_DELETE_SUCCESS',
          deletedPostId: 'post-42',
        },
      },
    });
    const { result } = renderHook(() => useDeletePost());

    let res: any;
    await act(async () => {
      res = await result.current.deletePost(args);
    });

    expect(res).toEqual({ success: true });
    expect(mockInfo).toHaveBeenCalled();
  });

  it('returns errorCode HAS_ACTIVE_REPLIES when post has replies', async () => {
    mockMutate.mockResolvedValueOnce({
      data: {
        timeTrackingDeletePost: {
          errorCode: 'HAS_ACTIVE_REPLIES',
          message: 'Cannot delete post with active replies',
        },
      },
    });
    const { result } = renderHook(() => useDeletePost());

    let res: any;
    await act(async () => {
      res = await result.current.deletePost(args);
    });

    expect(res).toEqual({
      success: false,
      errorCode: 'HAS_ACTIVE_REPLIES',
      errorMessage: 'Cannot delete post with active replies',
    });
    expect(mockError).toHaveBeenCalled();
  });

  it('returns errorCode on a generic backend error', async () => {
    mockMutate.mockResolvedValueOnce({
      data: {
        timeTrackingDeletePost: {
          errorCode: 'GENERAL_ERROR',
          message: 'Something went wrong',
        },
      },
    });
    const { result } = renderHook(() => useDeletePost());

    let res: any;
    await act(async () => {
      res = await result.current.deletePost(args);
    });

    expect(res).toEqual({
      success: false,
      errorCode: 'GENERAL_ERROR',
      errorMessage: 'Something went wrong',
    });
  });

  it('returns success=false when the mutation throws', async () => {
    mockMutate.mockRejectedValueOnce(new Error('network error'));
    const { result } = renderHook(() => useDeletePost());

    let res: any;
    await act(async () => {
      res = await result.current.deletePost(args);
    });

    expect(res).toEqual({ success: false });
    expect(mockError).toHaveBeenCalled();
  });

  it('returns success=false when GraphQL execution errors are returned', async () => {
    mockMutate.mockResolvedValueOnce({
      data: null,
      errors: [{ message: 'Unauthorized' }],
    });
    const { result } = renderHook(() => useDeletePost());

    let res: any;
    await act(async () => {
      res = await result.current.deletePost(args);
    });

    expect(res).toEqual({ success: false });
    expect(mockError).toHaveBeenCalled();
  });

  it('returns success=false when the mutation response is empty', async () => {
    mockMutate.mockResolvedValueOnce({ data: null });
    const { result } = renderHook(() => useDeletePost());

    let res: any;
    await act(async () => {
      res = await result.current.deletePost(args);
    });

    expect(res).toEqual({ success: false });
    expect(mockError).toHaveBeenCalled();
  });

  it('toggles inProgress back to false after completion', async () => {
    mockMutate.mockResolvedValueOnce({
      data: {
        timeTrackingDeletePost: {
          successCode: 'TIME_TRACKING_POST_DELETE_SUCCESS',
          deletedPostId: 'post-42',
        },
      },
    });
    const { result } = renderHook(() => useDeletePost());

    await act(async () => {
      await result.current.deletePost(args);
    });

    expect(result.current.inProgress).toBe(false);
  });
});

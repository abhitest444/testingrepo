import { renderHook, act } from '@testing-library/react-hooks';
import { useManagePost } from 'src/js/widgets/timeProject/hooks/useManagePost';

const mockMutate = jest.fn();
const mockError = jest.fn();
const mockInfo = jest.fn();

jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useMutation: jest.fn(() => [mockMutate]),
}));

jest.mock('src/js/widgets/timeProject/utils/timeProjectLogging', () => ({
  // Keep the real withLoggedOperation (pure; tolerates an undefined sandbox so
  // FCI is inert in tests) and only stub the logger / sandbox accessors.
  ...jest.requireActual('src/js/widgets/timeProject/utils/timeProjectLogging'),
  useTimeProjectLogger: () => ({ error: mockError, info: mockInfo }),
  useTimeProjectSandbox: () => undefined,
}));

const createArgs = {
  projectId: 'p1',
  customerId: 'c1',
  content: 'Hello',
  workerId: '6',
  workerType: 'employee',
};

const updateArgs = {
  postId: 'post-42',
  projectId: 'p1',
  customerId: 'c1',
  content: 'Updated content',
  workerId: '6',
  workerType: 'employee',
};

describe('useManagePost', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts with saving=false', () => {
    const { result } = renderHook(() => useManagePost());
    expect(result.current.saving).toBe(false);
  });

  describe('createPost', () => {
    it('sends the manage-post input (no id / no parentPostId)', async () => {
      mockMutate.mockResolvedValueOnce({
        data: { timeTrackingManagePost: { successCode: 'SUCCESS' } },
      });
      const { result } = renderHook(() => useManagePost());

      await act(async () => {
        await result.current.createPost(createArgs);
      });

      expect(mockMutate).toHaveBeenCalledWith({
        variables: {
          input: {
            projectRefs: { projectId: 'p1', customerId: 'c1' },
            content: 'Hello',
            workerId: '6',
            workerType: 'employee',
          },
        },
      });
    });

    it('returns success when the payload has a success code', async () => {
      mockMutate.mockResolvedValueOnce({
        data: { timeTrackingManagePost: { successCode: 'SUCCESS' } },
      });
      const { result } = renderHook(() => useManagePost());

      let res: any;
      await act(async () => {
        res = await result.current.createPost(createArgs);
      });

      expect(res).toEqual({ success: true });
    });

    // Splunk alert contract: top-level post create uses the Post Create event
    // and carries projectId.
    it('logs the post-create success event with projectId (Splunk)', async () => {
      mockMutate.mockResolvedValueOnce({
        data: { timeTrackingManagePost: { successCode: 'SUCCESS' } },
      });
      const { result } = renderHook(() => useManagePost());

      await act(async () => {
        await result.current.createPost(createArgs);
      });

      expect(mockInfo).toHaveBeenCalledWith(
        'Component=useManagePost Event=Post Create Success',
        expect.objectContaining({
          projectId: 'p1',
          isReply: false,
          result: 'success',
        }),
      );
    });

    // Splunk alert contract: a reply create (parentPostId present) uses the
    // DISTINCT Reply Create event so alerts can target replies-write.
    it('logs the dedicated reply-create event with projectId (Splunk)', async () => {
      mockMutate.mockResolvedValueOnce({
        data: { timeTrackingManagePost: { successCode: 'SUCCESS' } },
      });
      const { result } = renderHook(() => useManagePost());

      await act(async () => {
        await result.current.createPost({
          ...createArgs,
          parentPostId: 'parent-1',
        });
      });

      expect(mockInfo).toHaveBeenCalledWith(
        'Component=useManagePost Event=Reply Create Success',
        expect.objectContaining({
          projectId: 'p1',
          isReply: true,
          parentPostId: 'parent-1',
          result: 'success',
        }),
      );
    });

    it('returns the backend error message on an error branch', async () => {
      mockMutate.mockResolvedValueOnce({
        data: {
          timeTrackingManagePost: {
            errorCode: 'VALIDATION_ERROR',
            message: 'Too long',
          },
        },
      });
      const { result } = renderHook(() => useManagePost());

      let res: any;
      await act(async () => {
        res = await result.current.createPost(createArgs);
      });

      expect(res).toEqual({ success: false, errorMessage: 'Too long' });
      expect(mockError).toHaveBeenCalled();
    });

    it('returns success=false (no message) when the mutation throws', async () => {
      mockMutate.mockRejectedValueOnce(new Error('network down'));
      const { result } = renderHook(() => useManagePost());

      let res: any;
      await act(async () => {
        res = await result.current.createPost(createArgs);
      });

      expect(res).toEqual({ success: false });
      expect(mockError).toHaveBeenCalled();
    });

    it('toggles saving back to false after completion', async () => {
      mockMutate.mockResolvedValueOnce({
        data: { timeTrackingManagePost: { successCode: 'SUCCESS' } },
      });
      const { result } = renderHook(() => useManagePost());

      await act(async () => {
        await result.current.createPost(createArgs);
      });

      expect(result.current.saving).toBe(false);
    });
  });

  describe('updatePost', () => {
    it('sends the manage-post input with id for update', async () => {
      mockMutate.mockResolvedValueOnce({
        data: { timeTrackingManagePost: { successCode: 'SUCCESS' } },
      });
      const { result } = renderHook(() => useManagePost());

      await act(async () => {
        await result.current.updatePost(updateArgs);
      });

      expect(mockMutate).toHaveBeenCalledWith({
        variables: {
          input: {
            id: 'post-42',
            projectRefs: { projectId: 'p1', customerId: 'c1' },
            content: 'Updated content',
            workerId: '6',
            workerType: 'employee',
          },
        },
      });
    });

    it('returns success on a successful update', async () => {
      mockMutate.mockResolvedValueOnce({
        data: { timeTrackingManagePost: { successCode: 'SUCCESS' } },
      });
      const { result } = renderHook(() => useManagePost());

      let res: any;
      await act(async () => {
        res = await result.current.updatePost(updateArgs);
      });

      expect(res).toEqual({ success: true });
      expect(mockInfo).toHaveBeenCalled();
    });

    it('returns the backend error message on update failure', async () => {
      mockMutate.mockResolvedValueOnce({
        data: {
          timeTrackingManagePost: {
            errorCode: 'POST_NOT_FOUND',
            message: 'Not found',
          },
        },
      });
      const { result } = renderHook(() => useManagePost());

      let res: any;
      await act(async () => {
        res = await result.current.updatePost(updateArgs);
      });

      expect(res).toEqual({ success: false, errorMessage: 'Not found' });
      expect(mockError).toHaveBeenCalled();
    });

    it('returns success=false when the mutation throws', async () => {
      mockMutate.mockRejectedValueOnce(new Error('timeout'));
      const { result } = renderHook(() => useManagePost());

      let res: any;
      await act(async () => {
        res = await result.current.updatePost(updateArgs);
      });

      expect(res).toEqual({ success: false });
      expect(mockError).toHaveBeenCalled();
    });

    it('toggles saving back to false after update completion', async () => {
      mockMutate.mockResolvedValueOnce({
        data: { timeTrackingManagePost: { successCode: 'SUCCESS' } },
      });
      const { result } = renderHook(() => useManagePost());

      await act(async () => {
        await result.current.updatePost(updateArgs);
      });

      expect(result.current.saving).toBe(false);
    });
  });
});

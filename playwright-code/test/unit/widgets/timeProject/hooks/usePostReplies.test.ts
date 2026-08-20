import { renderHook, act } from '@testing-library/react-hooks';
import { usePostReplies } from 'src/js/widgets/timeProject/hooks/usePostReplies';

const mockLoadQuery = jest.fn();
const mockError = jest.fn();
const mockInfo = jest.fn();
const mockLogger = { error: mockError, info: mockInfo };

jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useLazyQuery: jest.fn(() => [mockLoadQuery]),
}));

jest.mock('src/js/widgets/timeProject/utils/timeProjectLogging', () => ({
  ...jest.requireActual('src/js/widgets/timeProject/utils/timeProjectLogging'),
  useTimeProjectLogger: () => mockLogger,
  useTimeProjectSandbox: () => undefined,
}));

jest.mock('src/js/widgets/timeProject/constants', () => ({
  ...jest.requireActual('src/js/widgets/timeProject/constants'),
  DEFAULT_PAGE_SIZE: 6,
}));

const buildNode = (id: string) => ({
  id,
  projectId: '429610453',
  customerId: '5',
  content: `reply ${id}`,
  parentPostId: '807803898',
  replyCount: 0,
  unreadReplyCount: 0,
  worker: { id: '6', displayName: 'test admin admin' },
  contentAttachments: null,
  postMentions: null,
  postMeta: {
    createdAt: '2026-06-16T06:45:46.000Z',
    updatedAt: '2026-06-16T06:45:46.000Z',
    createdBy: '1',
    updatedBy: '1',
  },
});

const buildResponse = (
  ids: string[],
  hasNextPage = false,
  endCursor: string | null = null,
) => ({
  data: {
    timeTrackingPosts: {
      edges: ids.map((id) => ({ cursor: `cursor-${id}`, node: buildNode(id) })),
      pageInfo: {
        hasNextPage,
        hasPreviousPage: false,
        startCursor: null,
        endCursor,
      },
      totalCount: ids.length,
    },
  },
});

const filter = {
  projectId: '429610453',
  customerId: '5',
  workerId: '6',
  parentPostId: '807803898',
};

describe('usePostReplies', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty initial state', () => {
    const { result } = renderHook(() => usePostReplies());
    expect(result.current.replies).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.loadingMore).toBe(false);
    expect(result.current.error).toBe(false);
    expect(result.current.loadMoreError).toBe(false);
    expect(result.current.hasNextPage).toBe(false);
  });

  it('exposes hasNextPage from the response', async () => {
    mockLoadQuery.mockResolvedValueOnce(buildResponse(['1'], true, 'cursor-1'));
    const { result } = renderHook(() => usePostReplies());

    await act(async () => {
      await result.current.fetchReplies(filter);
    });

    expect(result.current.hasNextPage).toBe(true);
  });

  // Splunk alert contract: replies-read carries projectId (+ parentPostId).
  it('logs the replies-read success event with projectId (Splunk)', async () => {
    mockLoadQuery.mockResolvedValueOnce(buildResponse(['1']));
    const { result } = renderHook(() => usePostReplies());

    await act(async () => {
      await result.current.fetchReplies(filter);
    });

    expect(mockInfo).toHaveBeenCalledWith(
      'Component=usePostReplies Event=Post Replies Fetch Success',
      expect.objectContaining({
        projectId: '429610453',
        parentPostId: '807803898',
        result: 'success',
      }),
    );
  });

  it('logs the replies-read failure event with projectId (Splunk)', async () => {
    mockLoadQuery.mockRejectedValueOnce(new Error('boom'));
    const { result } = renderHook(() => usePostReplies());

    await act(async () => {
      await result.current.fetchReplies(filter);
    });

    expect(mockError).toHaveBeenCalledWith(
      'Component=usePostReplies Event=Post Replies Fetch Failed',
      expect.objectContaining({ projectId: '429610453', result: 'failure' }),
    );
  });

  it('fetches replies with the parentPostId filter', async () => {
    mockLoadQuery.mockResolvedValueOnce(buildResponse(['1', '2']));
    const { result } = renderHook(() => usePostReplies());

    await act(async () => {
      await result.current.fetchReplies(filter);
    });

    expect(mockLoadQuery).toHaveBeenCalledWith({
      variables: {
        input: {
          projectRefs: { projectId: '429610453', customerId: '5' },
          workerId: '6',
        },
        filter: { parentPostId: '807803898' },
        first: 6,
        after: null,
      },
    });
    expect(result.current.replies).toHaveLength(2);
    expect(result.current.replies[0].id).toBe('1');
  });

  it('omits customerId from projectRefs when not provided', async () => {
    mockLoadQuery.mockResolvedValueOnce(buildResponse(['1']));
    const { result } = renderHook(() => usePostReplies());

    await act(async () => {
      await result.current.fetchReplies({
        projectId: '429610453',
        workerId: '6',
        parentPostId: '807803898',
      });
    });

    expect(mockLoadQuery.mock.calls[0][0].variables.input.projectRefs).toEqual({
      projectId: '429610453',
    });
  });

  it('appends the next page on loadMore (infinite scroll)', async () => {
    mockLoadQuery
      .mockResolvedValueOnce(buildResponse(['1'], true, 'cursor-end-1'))
      .mockResolvedValueOnce(buildResponse(['2'], false, null));
    const { result } = renderHook(() => usePostReplies());

    await act(async () => {
      await result.current.fetchReplies(filter);
    });
    await act(async () => {
      await result.current.loadMore();
    });

    // Replies accumulate rather than replace.
    expect(result.current.replies.map((r) => r.id)).toEqual(['1', '2']);
    expect(result.current.hasNextPage).toBe(false);
    expect(mockLoadQuery.mock.calls[1][0].variables.after).toBe('cursor-end-1');
  });

  it('does not loadMore when there is no next page', async () => {
    mockLoadQuery.mockResolvedValueOnce(buildResponse(['1'], false, null));
    const { result } = renderHook(() => usePostReplies());

    await act(async () => {
      await result.current.fetchReplies(filter);
    });
    await act(async () => {
      await result.current.loadMore();
    });

    expect(mockLoadQuery).toHaveBeenCalledTimes(1);
  });

  it('keeps existing replies and sets loadMoreError when a loadMore fails', async () => {
    mockLoadQuery
      .mockResolvedValueOnce(buildResponse(['1'], true, 'cursor-end-1'))
      .mockRejectedValueOnce(new Error('boom'));
    const { result } = renderHook(() => usePostReplies());

    await act(async () => {
      await result.current.fetchReplies(filter);
    });
    await act(async () => {
      await result.current.loadMore();
    });

    // The first page survives a failed append.
    expect(result.current.replies.map((r) => r.id)).toEqual(['1']);
    expect(result.current.error).toBe(false);
    expect(result.current.loadMoreError).toBe(true);
    expect(mockError).toHaveBeenCalled();
  });

  it('sets loadMoreError when Apollo returns result.error on loadMore', async () => {
    mockLoadQuery
      .mockResolvedValueOnce(buildResponse(['1'], true, 'cursor-end-1'))
      .mockResolvedValueOnce({
        data: undefined,
        error: new Error('network failure'),
      });
    const { result } = renderHook(() => usePostReplies());

    await act(async () => {
      await result.current.fetchReplies(filter);
    });
    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.replies.map((r) => r.id)).toEqual(['1']);
    expect(result.current.loadMoreError).toBe(true);
    expect(mockError).toHaveBeenCalled();
  });

  it('sets error when Apollo returns result.error on initial fetch', async () => {
    mockLoadQuery.mockResolvedValueOnce({
      data: undefined,
      error: new Error('network down'),
    });
    const { result } = renderHook(() => usePostReplies());

    await act(async () => {
      await result.current.fetchReplies(filter);
    });

    expect(result.current.error).toBe(true);
    expect(result.current.replies).toEqual([]);
    expect(mockError).toHaveBeenCalled();
  });

  it('clears loadMoreError on the next successful fetch', async () => {
    mockLoadQuery
      .mockResolvedValueOnce(buildResponse(['1'], true, 'cursor-end-1'))
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(buildResponse(['1', '2'], false, null));
    const { result } = renderHook(() => usePostReplies());

    await act(async () => {
      await result.current.fetchReplies(filter);
    });
    await act(async () => {
      await result.current.loadMore();
    });
    expect(result.current.loadMoreError).toBe(true);

    await act(async () => {
      await result.current.fetchReplies(filter);
    });
    expect(result.current.loadMoreError).toBe(false);
  });

  it('sets error and clears replies when the initial query throws', async () => {
    mockLoadQuery.mockRejectedValueOnce(new Error('boom'));
    const { result } = renderHook(() => usePostReplies());

    await act(async () => {
      await result.current.fetchReplies(filter);
    });

    expect(result.current.error).toBe(true);
    expect(result.current.replies).toEqual([]);
    expect(mockError).toHaveBeenCalled();
  });

  it('refetch re-runs with the last filter', async () => {
    mockLoadQuery
      .mockResolvedValueOnce(buildResponse(['1']))
      .mockResolvedValueOnce(buildResponse(['1', '2']));
    const { result } = renderHook(() => usePostReplies());

    await act(async () => {
      await result.current.fetchReplies(filter);
    });
    expect(result.current.replies).toHaveLength(1);

    await act(async () => {
      result.current.refetch();
    });
    expect(mockLoadQuery).toHaveBeenCalledTimes(2);
  });

  it('auto-fetches when autoFetchFilter is provided', async () => {
    mockLoadQuery.mockResolvedValueOnce(buildResponse(['1']));
    const { result } = renderHook(() => usePostReplies(filter));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(mockLoadQuery).toHaveBeenCalledTimes(1);
    expect(result.current.replies).toHaveLength(1);
  });
});

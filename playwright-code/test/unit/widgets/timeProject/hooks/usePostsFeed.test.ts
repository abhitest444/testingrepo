import { renderHook, act } from '@testing-library/react-hooks';
import { usePostsFeed } from 'src/js/widgets/timeProject/hooks/usePostsFeed';

const mockLoadQuery = jest.fn();
const mockError = jest.fn();
const mockInfo = jest.fn();

jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useLazyQuery: jest.fn(() => [mockLoadQuery]),
}));

jest.mock('src/js/widgets/timeProject/utils/timeProjectLogging', () => ({
  ...jest.requireActual('src/js/widgets/timeProject/utils/timeProjectLogging'),
  useTimeProjectLogger: () => ({ error: mockError, info: mockInfo }),
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
  content: `post ${id}`,
  parentPostId: null,
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
  totalCount?: number,
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
      totalCount: totalCount ?? ids.length,
    },
  },
});

const filter = { projectId: '429610453', customerId: '5', workerId: '6' };

describe('usePostsFeed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty initial state', () => {
    const { result } = renderHook(() => usePostsFeed());
    expect(result.current.posts).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(false);
    expect(result.current.page).toBe(1);
    expect(result.current.totalPages).toBe(1);
  });

  it('fetches the feed and maps posts', async () => {
    mockLoadQuery.mockResolvedValueOnce(buildResponse(['1', '2']));
    const { result } = renderHook(() => usePostsFeed());

    await act(async () => {
      await result.current.fetchFeed(filter);
    });

    expect(result.current.posts).toHaveLength(2);
    expect(result.current.posts[0].id).toBe('1');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(false);
  });

  // Splunk alert contract: feed-read emits a stable success event string with
  // projectId so alerts/dashboards can filter by project.
  it('logs the feed-read success event with projectId (Splunk)', async () => {
    mockLoadQuery.mockResolvedValueOnce(buildResponse(['1']));
    const { result } = renderHook(() => usePostsFeed());

    await act(async () => {
      await result.current.fetchFeed(filter);
    });

    expect(mockInfo).toHaveBeenCalledWith(
      'Component=usePostsFeed Event=Posts Feed Fetch Success',
      expect.objectContaining({ projectId: '429610453', result: 'success' }),
    );
  });

  it('logs the feed-read failure event with projectId (Splunk)', async () => {
    mockLoadQuery.mockRejectedValueOnce(new Error('network down'));
    const { result } = renderHook(() => usePostsFeed());

    await act(async () => {
      await result.current.fetchFeed(filter);
    });

    expect(mockError).toHaveBeenCalledWith(
      'Component=usePostsFeed Event=Posts Feed Fetch Failed',
      expect.objectContaining({ projectId: '429610453', result: 'failure' }),
    );
  });

  it('sends projectRefs, workerId and page size in the query variables', async () => {
    mockLoadQuery.mockResolvedValueOnce(buildResponse(['1']));
    const { result } = renderHook(() => usePostsFeed());

    await act(async () => {
      await result.current.fetchFeed(filter);
    });

    expect(mockLoadQuery).toHaveBeenCalledWith({
      variables: {
        input: {
          projectRefs: { projectId: '429610453', customerId: '5' },
          workerId: '6',
        },
        first: 6,
        after: null,
      },
    });
  });

  it('omits customerId from projectRefs when not provided', async () => {
    mockLoadQuery.mockResolvedValueOnce(buildResponse(['1']));
    const { result } = renderHook(() => usePostsFeed());

    await act(async () => {
      await result.current.fetchFeed({ projectId: '429610453', workerId: '6' });
    });

    expect(mockLoadQuery.mock.calls[0][0].variables.input.projectRefs).toEqual({
      projectId: '429610453',
    });
  });

  it('computes totalPages from totalCount and page size', async () => {
    mockLoadQuery.mockResolvedValueOnce(
      buildResponse(['1'], true, 'cursor-1', 12),
    );
    const { result } = renderHook(() => usePostsFeed());

    await act(async () => {
      await result.current.fetchFeed(filter);
    });

    expect(result.current.page).toBe(1);
    // DEFAULT_PAGE_SIZE is 6, totalCount is 12 → 2 pages.
    expect(result.current.totalPages).toBe(2);
  });

  it('paginates forward using the stored end cursor', async () => {
    mockLoadQuery
      .mockResolvedValueOnce(buildResponse(['1'], true, 'cursor-end-1'))
      .mockResolvedValueOnce(buildResponse(['2'], false, null));
    const { result } = renderHook(() => usePostsFeed());

    await act(async () => {
      await result.current.fetchFeed(filter);
    });
    await act(async () => {
      await result.current.goToNextPage();
    });

    expect(result.current.page).toBe(2);
    expect(result.current.posts[0].id).toBe('2');
    expect(mockLoadQuery.mock.calls[1][0].variables.after).toBe('cursor-end-1');
  });

  it('does not advance past the last page', async () => {
    mockLoadQuery.mockResolvedValueOnce(buildResponse(['1'], false, null));
    const { result } = renderHook(() => usePostsFeed());

    await act(async () => {
      await result.current.fetchFeed(filter);
    });
    await act(async () => {
      await result.current.goToNextPage();
    });

    // No second call — hasNextPage was false.
    expect(mockLoadQuery).toHaveBeenCalledTimes(1);
    expect(result.current.page).toBe(1);
  });

  it('paginates backward', async () => {
    mockLoadQuery
      .mockResolvedValueOnce(buildResponse(['1'], true, 'cursor-end-1'))
      .mockResolvedValueOnce(buildResponse(['2'], false, null))
      .mockResolvedValueOnce(buildResponse(['1'], true, 'cursor-end-1'));
    const { result } = renderHook(() => usePostsFeed());

    await act(async () => {
      await result.current.fetchFeed(filter);
    });
    await act(async () => {
      await result.current.goToNextPage();
    });
    await act(async () => {
      await result.current.goToPrevPage();
    });

    expect(result.current.page).toBe(1);
    expect(result.current.posts[0].id).toBe('1');
  });

  it('does nothing on goToPrevPage at page 1', async () => {
    const { result } = renderHook(() => usePostsFeed());
    await act(async () => {
      await result.current.goToPrevPage();
    });
    expect(mockLoadQuery).not.toHaveBeenCalled();
  });

  it('sets error and clears posts when the query throws', async () => {
    mockLoadQuery.mockRejectedValueOnce(new Error('network down'));
    const { result } = renderHook(() => usePostsFeed());

    await act(async () => {
      await result.current.fetchFeed(filter);
    });

    expect(result.current.error).toBe(true);
    expect(result.current.posts).toEqual([]);
    expect(mockError).toHaveBeenCalled();
  });

  it('handles a null timeTrackingPosts connection gracefully', async () => {
    mockLoadQuery.mockResolvedValueOnce({ data: { timeTrackingPosts: null } });
    const { result } = renderHook(() => usePostsFeed());

    await act(async () => {
      await result.current.fetchFeed(filter);
    });

    expect(result.current.posts).toEqual([]);
    expect(result.current.error).toBe(false);
  });

  it('sets error when Apollo returns result.error (non-throwing network failure)', async () => {
    mockLoadQuery.mockResolvedValueOnce({
      data: undefined,
      error: new Error('Failed to fetch'),
    });
    const { result } = renderHook(() => usePostsFeed());

    await act(async () => {
      await result.current.fetchFeed(filter);
    });

    expect(result.current.error).toBe(true);
    expect(result.current.posts).toEqual([]);
    expect(mockError).toHaveBeenCalled();
  });

  it('sets error on pagination failure without clearing existing posts', async () => {
    mockLoadQuery
      .mockResolvedValueOnce(buildResponse(['1'], true, 'cursor-end-1'))
      .mockResolvedValueOnce({
        data: undefined,
        error: new Error('network timeout'),
      });
    const { result } = renderHook(() => usePostsFeed());

    await act(async () => {
      await result.current.fetchFeed(filter);
    });
    expect(result.current.posts).toHaveLength(1);

    await act(async () => {
      await result.current.goToNextPage();
    });

    expect(result.current.error).toBe(true);
    expect(mockError).toHaveBeenCalled();
  });

  it('refetchCurrentPage re-fetches the current page without resetting to page 1', async () => {
    mockLoadQuery
      .mockResolvedValueOnce(buildResponse(['1'], true, 'cursor-end-1'))
      .mockResolvedValueOnce(buildResponse(['2'], false, null))
      .mockResolvedValueOnce(buildResponse(['2-updated'], false, null));
    const { result } = renderHook(() => usePostsFeed());

    await act(async () => {
      await result.current.fetchFeed(filter);
    });
    await act(async () => {
      await result.current.goToNextPage();
    });
    expect(result.current.page).toBe(2);

    await act(async () => {
      await result.current.refetchCurrentPage();
    });

    expect(result.current.page).toBe(2);
    expect(result.current.posts[0].id).toBe('2-updated');
    // The third call should use the same cursor as page 2
    expect(mockLoadQuery.mock.calls[2][0].variables.after).toBe('cursor-end-1');
  });
});

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLazyQuery } from '@apollo/client';
import {
  TimeCustomerInteraction,
  getCustomerInteractionPropagationHeaders,
} from 'src/js/common/CustomerInteraction';
import { GET_POST_REPLIES } from '../graphql/postsQueries';
import { Post, PostsFeedResponse } from '../types/posts';
import { mapPostNode } from '../utils/postsMappers';
import {
  DEFAULT_PAGE_SIZE,
  TIME_PROJECT_LOGGING_CONSTANTS,
} from '../constants';
import {
  useTimeProjectLogger,
  useTimeProjectSandbox,
  withLoggedOperation,
} from '../utils/timeProjectLogging';

export interface PostRepliesFilter {
  projectId: string;
  customerId?: string;
  workerId: string;
  parentPostId: string;
}

export interface UsePostRepliesResult {
  replies: Post[];
  /** First-page load (drawer just opened). */
  loading: boolean;
  /** Appending the next page during infinite scroll. */
  loadingMore: boolean;
  error: boolean;
  /** A loadMore call failed (replies already on screen). */
  loadMoreError: boolean;
  hasNextPage: boolean;
  /** Initial load — resets and fetches the first page. */
  fetchReplies: (filter: PostRepliesFilter) => Promise<void>;
  /** Re-fetch with the current filter (no-op if no filter set yet). */
  refetch: () => void;
  /** Infinite scroll — appends the next cursor page to `replies`. */
  loadMore: () => Promise<void>;
}

/**
 * Replies for a single post (replies mode: filter.parentPostId), with
 * cursor-based *infinite scroll*: `fetchReplies` loads page 1; `loadMore`
 * appends the next page. No caching — the query runs `no-cache`.
 *
 * When `autoFetchFilter` is provided the hook fetches the first page on
 * mount (and whenever the filter values change) and exposes a stable
 * `refetch` that re-runs with the same filter.
 */
export const usePostReplies = (
  autoFetchFilter?: PostRepliesFilter,
): UsePostRepliesResult => {
  const logger = useTimeProjectLogger();
  const sandbox = useTimeProjectSandbox();
  const [replies, setReplies] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);

  const filterRef = useRef<PostRepliesFilter | null>(null);
  const cursorRef = useRef<string | null>(null);
  const requestSeqRef = useRef(0);

  const [loadQuery] = useLazyQuery<PostsFeedResponse>(GET_POST_REPLIES, {
    fetchPolicy: 'no-cache',
  });

  const runQuery = useCallback(
    async (
      filter: PostRepliesFilter,
      after: string | null,
      append: boolean,
    ) => {
      if (append) {
        setLoadingMore(true);
        setLoadMoreError(false);
      } else {
        setLoading(true);
        setError(false);
        setLoadMoreError(false);
      }
      requestSeqRef.current += 1;
      const seq = requestSeqRef.current;

      try {
        const result = await withLoggedOperation({
          logger,
          sandbox,
          interactionName:
            TimeCustomerInteraction.TIME_PROJECT_POSTS_REPLIES_READ,
          event: {
            start:
              TIME_PROJECT_LOGGING_CONSTANTS.READS.POST_REPLIES_FETCH_START,
            success:
              TIME_PROJECT_LOGGING_CONSTANTS.READS.POST_REPLIES_FETCH_SUCCESS,
            failure:
              TIME_PROJECT_LOGGING_CONSTANTS.READS.POST_REPLIES_FETCH_FAILURE,
          },
          extraProps: {
            projectId: filter.projectId,
            customerId: filter.customerId ?? null,
            parentPostId: filter.parentPostId,
            append,
          },
          run: () =>
            loadQuery({
              variables: {
                input: {
                  projectRefs: {
                    projectId: filter.projectId,
                    ...(filter.customerId
                      ? { customerId: filter.customerId }
                      : {}),
                  },
                  workerId: filter.workerId,
                },
                filter: { parentPostId: filter.parentPostId },
                first: DEFAULT_PAGE_SIZE,
                after,
              },
              ...(sandbox
                ? {
                    context: {
                      headers: getCustomerInteractionPropagationHeaders(
                        sandbox,
                        TimeCustomerInteraction.TIME_PROJECT_POSTS_REPLIES_READ,
                      ),
                    },
                  }
                : {}),
            }),
        });

        if (seq !== requestSeqRef.current) return;

        if (result.error) {
          logger.error('Component=usePostReplies Event=Fetch Replies Failed', {
            parentPostId: filter.parentPostId,
            append,
            errorMessage: result.error.message,
          });
          if (append) {
            setLoadMoreError(true);
          } else {
            setError(true);
            setReplies([]);
          }
          return;
        }

        const connection = result.data?.timeTrackingPosts;
        const edges = connection?.edges ?? [];
        const next = connection?.pageInfo?.hasNextPage ?? false;
        const mapped = edges.map((edge) => mapPostNode(edge.node));

        cursorRef.current = connection?.pageInfo?.endCursor ?? null;
        setHasNextPage(next);
        setReplies((prev) => (append ? [...prev, ...mapped] : mapped));
      } catch {
        if (seq !== requestSeqRef.current) return;
        if (append) {
          setLoadMoreError(true);
        } else {
          setError(true);
          setReplies([]);
        }
      } finally {
        if (seq === requestSeqRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [loadQuery, logger, sandbox],
  );

  const fetchReplies = useCallback(
    async (filter: PostRepliesFilter) => {
      filterRef.current = filter;
      cursorRef.current = null;
      await runQuery(filter, null, false);
    },
    [runQuery],
  );

  const refetch = useCallback(() => {
    const filter = filterRef.current;
    if (!filter) return;
    fetchReplies(filter);
  }, [fetchReplies]);

  const loadMore = useCallback(async () => {
    const filter = filterRef.current;
    if (!filter || !hasNextPage || loading || loadingMore) return;
    await runQuery(filter, cursorRef.current, true);
  }, [hasNextPage, loading, loadingMore, runQuery]);

  const afProjectId = autoFetchFilter?.projectId;
  const afCustomerId = autoFetchFilter?.customerId;
  const afWorkerId = autoFetchFilter?.workerId;
  const afParentPostId = autoFetchFilter?.parentPostId;

  useEffect(() => {
    if (!afProjectId || !afWorkerId || !afParentPostId) return;
    fetchReplies({
      projectId: afProjectId,
      customerId: afCustomerId,
      workerId: afWorkerId,
      parentPostId: afParentPostId,
    });
  }, [fetchReplies, afProjectId, afCustomerId, afWorkerId, afParentPostId]);

  return {
    replies,
    loading,
    loadingMore,
    error,
    loadMoreError,
    hasNextPage,
    fetchReplies,
    refetch,
    loadMore,
  };
};

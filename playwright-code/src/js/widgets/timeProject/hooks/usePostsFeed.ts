import { useCallback, useRef, useState } from 'react';
import { useLazyQuery } from '@apollo/client';
import {
  TimeCustomerInteraction,
  getCustomerInteractionPropagationHeaders,
} from 'src/js/common/CustomerInteraction';
import { GET_POSTS_FEED } from '../graphql/postsQueries';
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

export interface PostsFeedFilter {
  projectId: string;
  customerId?: string;
  workerId: string;
}

export interface UsePostsFeedResult {
  posts: Post[];
  loading: boolean;
  error: boolean;
  page: number;
  totalPages: number;
  totalCount: number;
  fetchFeed: (filter: PostsFeedFilter) => Promise<void>;
  refetchCurrentPage: () => Promise<void>;
  goToNextPage: () => Promise<void>;
  goToPrevPage: () => Promise<void>;
}

/**
 * Posts feed (top-level posts only) with cursor-based pagination surfaced
 * through a project-style page/totalPages interface. Mirrors
 * `useWorkerTimeSummary`: a cursor stack maps page -> endCursor so
 * next/prev can re-issue the query, and a request-seq guard drops stale
 * responses. No caching — the query runs `no-cache`.
 */
export const usePostsFeed = (): UsePostsFeedResult => {
  const logger = useTimeProjectLogger();
  const sandbox = useTimeProjectSandbox();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);

  const filterRef = useRef<PostsFeedFilter | null>(null);
  const cursorStackRef = useRef<(string | null)[]>([null]);
  const requestSeqRef = useRef(0);

  const [loadQuery] = useLazyQuery<PostsFeedResponse>(GET_POSTS_FEED, {
    fetchPolicy: 'no-cache',
  });

  const fetchPage = useCallback(
    async (
      filter: PostsFeedFilter,
      after: string | null,
      targetPage: number,
    ) => {
      setLoading(true);
      setError(false);
      requestSeqRef.current += 1;
      const seq = requestSeqRef.current;

      try {
        const result = await withLoggedOperation({
          logger,
          sandbox,
          interactionName: TimeCustomerInteraction.TIME_PROJECT_POSTS_FEED_READ,
          event: {
            start: TIME_PROJECT_LOGGING_CONSTANTS.READS.POSTS_FEED_FETCH_START,
            success:
              TIME_PROJECT_LOGGING_CONSTANTS.READS.POSTS_FEED_FETCH_SUCCESS,
            failure:
              TIME_PROJECT_LOGGING_CONSTANTS.READS.POSTS_FEED_FETCH_FAILURE,
          },
          extraProps: {
            projectId: filter.projectId,
            customerId: filter.customerId ?? null,
            page: targetPage,
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
                first: DEFAULT_PAGE_SIZE,
                after,
              },
              ...(sandbox
                ? {
                    context: {
                      headers: getCustomerInteractionPropagationHeaders(
                        sandbox,
                        TimeCustomerInteraction.TIME_PROJECT_POSTS_FEED_READ,
                      ),
                    },
                  }
                : {}),
            }),
        });

        // Drop stale responses (a slower earlier page resolving late).
        if (seq !== requestSeqRef.current) return;

        // Apollo doesn't throw on network errors — it sets result.error.
        if (result.error) {
          logger.error('Component=usePostsFeed Event=Fetch Feed Failed', {
            projectId: filter.projectId,
            page: targetPage,
            errorMessage: result.error.message,
          });
          setError(true);
          return;
        }

        const connection = result.data?.timeTrackingPosts;
        const edges = connection?.edges ?? [];
        const nextPage = connection?.pageInfo?.hasNextPage ?? false;

        if (nextPage && connection?.pageInfo?.endCursor) {
          cursorStackRef.current[targetPage] = connection.pageInfo.endCursor;
        }

        setPosts(edges.map((edge) => mapPostNode(edge.node)));
        setPage(targetPage);
        setTotalCount(connection?.totalCount ?? 0);
        setHasNextPage(nextPage);
      } catch {
        if (seq !== requestSeqRef.current) return;
        // withLoggedOperation already logged + ended the FCI; just update UI.
        setError(true);
        setPosts([]);
      } finally {
        if (seq === requestSeqRef.current) setLoading(false);
      }
    },
    [loadQuery, logger, sandbox],
  );

  const fetchFeed = useCallback(
    async (filter: PostsFeedFilter) => {
      filterRef.current = filter;
      cursorStackRef.current = [null];
      await fetchPage(filter, null, 1);
    },
    [fetchPage],
  );

  const refetchCurrentPage = useCallback(async () => {
    const filter = filterRef.current;
    if (!filter) return;
    const cursor = cursorStackRef.current[page - 1] ?? null;
    await fetchPage(filter, cursor, page);
  }, [page, fetchPage]);

  const goToNextPage = useCallback(async () => {
    const filter = filterRef.current;
    if (!filter || !hasNextPage) return;
    const nextP = page + 1;
    const cursor = cursorStackRef.current[nextP - 1] ?? null;
    await fetchPage(filter, cursor, nextP);
  }, [page, hasNextPage, fetchPage]);

  const goToPrevPage = useCallback(async () => {
    if (page <= 1) return;
    const filter = filterRef.current;
    if (!filter) return;
    const prevP = page - 1;
    const cursor = cursorStackRef.current[prevP - 1] ?? null;
    await fetchPage(filter, cursor, prevP);
  }, [page, fetchPage]);

  const totalPages = Math.max(1, Math.ceil(totalCount / DEFAULT_PAGE_SIZE));

  return {
    posts,
    loading,
    error,
    page,
    totalPages,
    totalCount,
    fetchFeed,
    refetchCurrentPage,
    goToNextPage,
    goToPrevPage,
  };
};

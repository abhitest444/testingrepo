import { useCallback, useRef } from 'react';
import { useLazyQuery } from '@apollo/client';
import {
  TimeCustomerInteraction,
  getCustomerInteractionPropagationHeaders,
} from 'src/js/common/CustomerInteraction';
import { GET_POSTS_UNREAD_COUNT } from '../graphql/postsQueries';
import { PostsUnreadCountResponse } from '../types/posts';
import { TIME_PROJECT_LOGGING_CONSTANTS } from '../constants';
import {
  useTimeProjectLogger,
  useTimeProjectSandbox,
  withLoggedOperation,
} from '../utils/timeProjectLogging';
import { useAppDispatch } from '../store';
import { setUnreadCount } from '../store/postsUiSlice';

export interface UseUnreadPostsCountResult {
  fetchUnreadCount: (
    projectId: string,
    customerId: string | undefined,
    workerId: string,
  ) => Promise<void>;
}

/**
 * Fetches the unread top-level post count for the current worker on
 * a project. The caller controls when to fetch via `fetchUnreadCount`.
 *
 * No caching — each call hits the network. The count is stored in
 * Redux (postsUi.unreadCount) so it can be read by any component and
 * reset by markPostsRead on success.
 */
export const useUnreadPostsCount = (): UseUnreadPostsCountResult => {
  const logger = useTimeProjectLogger();
  const sandbox = useTimeProjectSandbox();
  const dispatch = useAppDispatch();

  const requestSeqRef = useRef(0);

  const [loadQuery] = useLazyQuery<PostsUnreadCountResponse>(
    GET_POSTS_UNREAD_COUNT,
    { fetchPolicy: 'no-cache' },
  );

  const fetchUnreadCount = useCallback(
    async (
      projectId: string,
      customerId: string | undefined,
      workerId: string,
    ) => {
      requestSeqRef.current += 1;
      const seq = requestSeqRef.current;

      try {
        // The unread badge is a secondary, non-blocking read: a failure
        // doesn't break the Posts experience, so the FCI is marked DEGRADED
        // (not failure) — `degradeOnFailure: true`.
        const result = await withLoggedOperation({
          logger,
          sandbox,
          interactionName:
            TimeCustomerInteraction.TIME_PROJECT_POSTS_UNREAD_COUNT_READ,
          degradeOnFailure: true,
          event: {
            start:
              TIME_PROJECT_LOGGING_CONSTANTS.READS
                .POSTS_UNREAD_COUNT_FETCH_START,
            success:
              TIME_PROJECT_LOGGING_CONSTANTS.READS
                .POSTS_UNREAD_COUNT_FETCH_SUCCESS,
            failure:
              TIME_PROJECT_LOGGING_CONSTANTS.READS
                .POSTS_UNREAD_COUNT_FETCH_FAILURE,
          },
          extraProps: { projectId, customerId: customerId ?? null },
          run: () =>
            loadQuery({
              variables: {
                input: {
                  projectRefs: {
                    projectId,
                    ...(customerId ? { customerId } : {}),
                  },
                  workerId,
                },
              },
              ...(sandbox
                ? {
                    context: {
                      headers: getCustomerInteractionPropagationHeaders(
                        sandbox,
                        TimeCustomerInteraction.TIME_PROJECT_POSTS_UNREAD_COUNT_READ,
                      ),
                    },
                  }
                : {}),
            }),
        });

        if (seq !== requestSeqRef.current) return;

        const count =
          result.data?.timeTrackingPostsUnreadCount?.unreadCount ?? 0;
        dispatch(setUnreadCount(count));
      } catch {
        if (seq !== requestSeqRef.current) return;
        // withLoggedOperation already logged + marked the FCI degraded; reset
        // the badge so a stale count isn't shown.
        dispatch(setUnreadCount(0));
      }
    },
    [loadQuery, logger, sandbox, dispatch],
  );

  return { fetchUnreadCount };
};

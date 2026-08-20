import { useState, useCallback, useRef } from 'react';
import { useSandbox } from '@payroll/quicksand';
import { getApolloClientInstance } from 'src/js/service/ApolloClientBuilder';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import {
  GET_OVERTIME_POLICIES,
  GET_OVERTIME_POLICY,
} from '../queries/overtimeQueries';
import { OvertimePolicy } from '../types/Overtime.types';
import { OVERTIME_LOGGING } from '../constants/overtimeLoggingConstants';

/**
 * Page size constant for overtime policies pagination
 */
export const OVERTIME_POLICIES_PAGE_SIZE = 10;

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  totalCount: number;
}

interface OvertimePoliciesResponse {
  overtimePolicies: {
    values: OvertimePolicy[];
    pageInfo: PageInfo;
  };
}

interface OvertimePolicyResponse {
  overtimePolicy: OvertimePolicy;
}

interface FetchPoliciesResult {
  policies: OvertimePolicy[];
  pageInfo: PageInfo | null;
}

interface UseOvertimePoliciesResult {
  loading: boolean;
  error: Error | undefined;
  policies: OvertimePolicy[];
  pageInfo: PageInfo | null;
  fetchPolicies: (options?: {
    filter?: any;
    limit?: number;
    offset?: number;
  }) => Promise<FetchPoliciesResult>;
  fetchPolicyById: (id: string) => Promise<OvertimePolicy | null>;
  fetchNextPage: (options?: { filter?: any }) => Promise<void>;
  fetchPreviousPage: (options?: { filter?: any }) => Promise<void>;
  /**
   * Fetch a specific page of policies (1-based page number)
   */
  fetchPage: (
    pageNumber: number,
    options?: { filter?: any },
  ) => Promise<FetchPoliciesResult>;
}

/**
 * Custom hook for fetching overtime policies from TSheets API
 * Supports offset-based pagination
 * Follows the pattern from useGetGroups and useTimeTrackingWorkers
 */
export const useOvertimePolicies = (): UseOvertimePoliciesResult => {
  const sandbox = useSandbox();
  const logger = useLoggingConfig();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [policies, setPolicies] = useState<OvertimePolicy[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);

  // Track current offset for pagination
  const currentOffsetRef = useRef<number>(0);

  const fetchPolicies = useCallback(
    async (options?: { filter?: any; limit?: number; offset?: number }) => {
      const interactionType = TimeCustomerInteraction.OVERTIME_POLICIES_READ;
      createCustomerInteraction(sandbox, interactionType);
      try {
        setLoading(true);
        setError(undefined);

        const client = getApolloClientInstance(sandbox);
        if (!client) {
          logger.error(OVERTIME_LOGGING.APOLLO_CLIENT_NOT_INITIALIZED);
          throw new Error('Apollo client not initialized');
        }

        const offset = options?.offset ?? 0;
        currentOffsetRef.current = offset;

        const result = await client.query<OvertimePoliciesResponse>({
          query: GET_OVERTIME_POLICIES,
          variables: {
            // Default to hiding user-level policy overrides; callers can
            // opt-out by explicitly setting `hideUserOverrides: false`.
            filter: { hideUserOverrides: true, ...options?.filter },
            pagination: {
              limit: options?.limit ?? OVERTIME_POLICIES_PAGE_SIZE,
              offset,
            },
          },
          context: {
            clientName: ApolloClientNames.TSHEETS,
            headers: getCustomerInteractionPropagationHeaders(
              sandbox,
              interactionType,
            ),
          },
          fetchPolicy: 'network-only',
          notifyOnNetworkStatusChange: true,
        });

        const fetchedPolicies = result.data?.overtimePolicies?.values || [];
        const fetchedPageInfo = result.data?.overtimePolicies?.pageInfo || null;

        setPolicies(fetchedPolicies);
        setPageInfo(fetchedPageInfo);

        logger.info(OVERTIME_LOGGING.FETCH_POLICIES_SUCCESS, {
          count: fetchedPolicies.length,
          hasNextPage: fetchedPageInfo?.hasNextPage,
          hasPreviousPage: fetchedPageInfo?.hasPreviousPage,
          totalCount: fetchedPageInfo?.totalCount,
          offset,
        });

        endInteractionWithSuccess(sandbox, interactionType);
        setLoading(false);
        return { policies: fetchedPolicies, pageInfo: fetchedPageInfo };
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        endInteractionWithFailure(
          sandbox,
          interactionType,
          errorObj.message,
          err,
        );
        setError(errorObj);
        setLoading(false);
        logger.error(OVERTIME_LOGGING.API_FETCH_POLICIES_FAILED, {
          error: errorObj.message,
        });
        throw errorObj;
      }
    },
    [sandbox, logger],
  );

  /**
   * Fetch the next page of policies using offset-based pagination
   */
  const fetchNextPage = useCallback(
    async (options?: { filter?: any }) => {
      if (!pageInfo?.hasNextPage) {
        return;
      }

      const newOffset = currentOffsetRef.current + OVERTIME_POLICIES_PAGE_SIZE;

      try {
        await fetchPolicies({
          filter: options?.filter,
          limit: OVERTIME_POLICIES_PAGE_SIZE,
          offset: newOffset,
        });

        logger.info(OVERTIME_LOGGING.FETCH_NEXT_PAGE_SUCCESS, {
          offset: newOffset,
        });
      } catch (err) {
        logger.error(OVERTIME_LOGGING.FETCH_NEXT_PAGE_FAILED, {
          error: err,
        });
        throw err;
      }
    },
    [pageInfo, fetchPolicies, logger],
  );

  /**
   * Fetch the previous page of policies using offset-based pagination
   */
  const fetchPreviousPage = useCallback(
    async (options?: { filter?: any }) => {
      if (!pageInfo?.hasPreviousPage) {
        return;
      }

      const newOffset = Math.max(
        0,
        currentOffsetRef.current - OVERTIME_POLICIES_PAGE_SIZE,
      );

      try {
        await fetchPolicies({
          filter: options?.filter,
          limit: OVERTIME_POLICIES_PAGE_SIZE,
          offset: newOffset,
        });

        logger.info(OVERTIME_LOGGING.FETCH_PREVIOUS_PAGE_SUCCESS, {
          offset: newOffset,
        });
      } catch (err) {
        logger.error(OVERTIME_LOGGING.FETCH_PREVIOUS_PAGE_FAILED, {
          error: err,
        });
        throw err;
      }
    },
    [pageInfo, fetchPolicies, logger],
  );

  const fetchPolicyById = useCallback(
    async (id: string) => {
      const interactionType = TimeCustomerInteraction.OVERTIME_POLICY_READ;
      createCustomerInteraction(sandbox, interactionType);
      try {
        setLoading(true);
        setError(undefined);

        const client = getApolloClientInstance(sandbox);
        if (!client) {
          logger.error(OVERTIME_LOGGING.APOLLO_CLIENT_NOT_INITIALIZED);
          throw new Error('Apollo client not initialized');
        }

        const result = await client.query<OvertimePolicyResponse>({
          query: GET_OVERTIME_POLICY,
          variables: { id },
          context: {
            clientName: ApolloClientNames.TSHEETS,
            headers: getCustomerInteractionPropagationHeaders(
              sandbox,
              interactionType,
            ),
          },
          fetchPolicy: 'network-only',
          notifyOnNetworkStatusChange: true,
        });

        logger.info(OVERTIME_LOGGING.FETCH_POLICY_BY_ID_SUCCESS, {
          policyId: id,
        });

        endInteractionWithSuccess(sandbox, interactionType);
        setLoading(false);
        return result.data?.overtimePolicy || null;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        endInteractionWithFailure(
          sandbox,
          interactionType,
          errorObj.message,
          err,
        );
        setError(errorObj);
        setLoading(false);
        logger.error(OVERTIME_LOGGING.FETCH_POLICY_BY_ID_FAILED, {
          policyId: id,
          error: errorObj.message,
        });
        throw errorObj;
      }
    },
    [sandbox, logger],
  );

  /**
   * Fetch a specific page of policies using 1-based page number
   */
  const fetchPage = useCallback(
    async (pageNumber: number, options?: { filter?: any }) => {
      const offset = (pageNumber - 1) * OVERTIME_POLICIES_PAGE_SIZE;

      try {
        const result = await fetchPolicies({
          filter: options?.filter,
          limit: OVERTIME_POLICIES_PAGE_SIZE,
          offset,
        });

        logger.info(OVERTIME_LOGGING.FETCH_SPECIFIC_PAGE_SUCCESS, {
          pageNumber,
          offset,
        });

        return result;
      } catch (err) {
        logger.error(OVERTIME_LOGGING.FETCH_SPECIFIC_PAGE_FAILED, {
          pageNumber,
          error: err,
        });
        throw err;
      }
    },
    [fetchPolicies, logger],
  );

  return {
    loading,
    error,
    policies,
    pageInfo,
    fetchPolicies,
    fetchPolicyById,
    fetchNextPage,
    fetchPreviousPage,
    fetchPage,
  };
};

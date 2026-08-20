import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSandbox } from '@payroll/quicksand';
import { useTimeAgainstAssignments } from 'src/js/service/hooks/assignments/useTimeAgainstAssignments';
import { Customer, CustomerType } from '../types';

export interface UseCustomerProjectsArgs {
  timeForEntityId: string;
  searchText?: string;
  assignmentFilters?: {
    assigned?: boolean;
  };
}

export interface UseCustomerProjectsResult {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  loadCustomers: (args?: UseCustomerProjectsArgs) => void;
  refetch: (args?: UseCustomerProjectsArgs) => void;
  loadMore: () => void;
  hasMore: boolean;
}

export interface UseCustomerProjectsOptions {
  pageSize?: number;
  enableLoadMore?: boolean;
}

/**
 * Hook to fetch customers and projects for QuickFind dropdown
 * Uses the TimeAgainstAssignments GraphQL API with "Load More" pagination
 *
 * Returns customers and projects with hierarchy information (parentId, level)
 * suitable for rendering with indentation
 */
export const useCustomerProjects = (
  options?: UseCustomerProjectsOptions,
): UseCustomerProjectsResult => {
  const { pageSize = 100, enableLoadMore = false } = options || {};
  const sandbox = useSandbox();
  const [currentArgs, setCurrentArgs] =
    useState<UseCustomerProjectsArgs | null>(null);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const isInitialLoadRef = useRef(true);

  const {
    loading,
    data: timeAgainstData,
    error,
    loadTimeAgainstAssignments,
    pageInfo,
  } = useTimeAgainstAssignments();

  const loadCustomers = useCallback(
    (args?: UseCustomerProjectsArgs) => {
      if (!args?.timeForEntityId) {
        sandbox.logger.error(
          'useCustomerProjects: timeForEntityId is required',
        );
        return;
      }

      setCurrentArgs(args);
      isInitialLoadRef.current = true;
      setAllCustomers([]);

      const queryArgs: any = {
        first: pageSize,
        after: undefined,
        input: {
          timeForEntityId: args.timeForEntityId,
        },
        filter: {
          searchText: args.searchText?.trim() || null,
          ...(args.assignmentFilters?.assigned !== undefined && {
            assigned: args.assignmentFilters.assigned,
          }),
        },
      };

      loadTimeAgainstAssignments(queryArgs);
    },
    [sandbox, loadTimeAgainstAssignments, pageSize],
  );

  const loadMore = useCallback(() => {
    if (!enableLoadMore || !hasMore || !endCursor || loading) {
      return;
    }

    const args = currentArgs;
    if (!args?.timeForEntityId) {
      return;
    }

    const queryArgs: any = {
      first: pageSize,
      after: endCursor,
      input: {
        timeForEntityId: args.timeForEntityId,
      },
      filter: {
        searchText: args.searchText?.trim() || null,
        ...(args.assignmentFilters?.assigned !== undefined && {
          assigned: args.assignmentFilters.assigned,
        }),
      },
    };

    loadTimeAgainstAssignments(queryArgs);
  }, [
    enableLoadMore,
    hasMore,
    endCursor,
    loading,
    currentArgs,
    pageSize,
    loadTimeAgainstAssignments,
  ]);

  const refetch = useCallback(
    (args?: UseCustomerProjectsArgs) => {
      const argsToUse = args || currentArgs;
      if (argsToUse) {
        loadCustomers(argsToUse);
      }
    },
    [currentArgs, loadCustomers],
  );

  // Transform data to Customer format and handle load more pagination
  useEffect(() => {
    if (!timeAgainstData || timeAgainstData.length === 0) {
      if (isInitialLoadRef.current && enableLoadMore) {
        setAllCustomers([]);
      }
      return;
    }

    const transformedRaw = timeAgainstData.map((item) => {
      // Determine if this is a customer or project
      const isProject = item.customerType === 'PROJECT';
      // For projects, API may return project: null and put the id in customer.id (e.g. id "20" for Test Project). Use that so dropdown can match selection.
      const id =
        (isProject
          ? item.timeAgainstContactDAS?.project?.id ??
            item.timeAgainstContactDAS?.customer?.id
          : item.timeAgainstContactDAS?.customer?.id) ??
        item.displayName ??
        '';

      return {
        id,
        displayName: item.displayName || '',
        fullName: item.fullName || '',
        type: isProject ? CustomerType.Project : CustomerType.Customer,
        customerType: item.customerType,
        active: item.active ?? true,
        parentId: item.parentId || null,
        level: item.level ?? null,
        numChildren: item.numChildren ?? 0,
      } as Customer;
    });

    // Deduplicate by id (first occurrence wins) so the same project never appears under multiple customers
    const seenIds = new Set<string>();
    const transformed = transformedRaw.filter((item) => {
      if (seenIds.has(item.id)) return false;
      seenIds.add(item.id);
      return true;
    });

    if (enableLoadMore) {
      if (isInitialLoadRef.current) {
        // Initial load - replace all items
        setAllCustomers(transformed);
        isInitialLoadRef.current = false;
      } else {
        // Subsequent loads - append items
        setAllCustomers((prev) => {
          // Deduplicate by ID
          const existingIds = new Set(prev.map((item) => item.id));
          const uniqueNewItems = transformed.filter(
            (item) => !existingIds.has(item.id),
          );
          return [...prev, ...uniqueNewItems];
        });
      }
      setHasMore(pageInfo?.hasNextPage || false);
      setEndCursor(pageInfo?.endCursor || null);
    } else {
      // Without load more, just use the transformed data
      setAllCustomers(transformed);
    }
  }, [timeAgainstData, enableLoadMore, pageInfo]);

  return {
    customers: allCustomers,
    loading,
    error,
    loadCustomers,
    refetch,
    loadMore,
    hasMore: enableLoadMore ? hasMore : false,
  };
};

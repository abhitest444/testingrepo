import { useCallback, useEffect, useRef, useState } from 'react';
import { useTimeAgainstAssignments } from 'src/js/service/hooks/assignments/useTimeAgainstAssignments';
import { CustomerOption } from '../types';

const PAGE_SIZE = 100;

interface CustomerFilterResult {
  customers: CustomerOption[];
  loading: boolean;
  hasMore: boolean;
  loadCustomers: (searchText?: string) => void;
  loadMore: () => void;
}

/**
 * Server-side customer search with cursor pagination for the customer filter dropdown.
 * Uses timeTrackingTimeAgainstAssignments with an empty timeForEntityId
 * (same pattern as WeeklySuperSearch) to fetch all customers.
 */
export const useCustomerFilter = (): CustomerFilterResult => {
  const [allCustomers, setAllCustomers] = useState<CustomerOption[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const isInitialLoadRef = useRef(true);

  const {
    loading,
    data: timeAgainstData,
    loadTimeAgainstAssignments,
    pageInfo,
  } = useTimeAgainstAssignments();

  const loadCustomers = useCallback(
    (search = '') => {
      setSearchText(search);
      isInitialLoadRef.current = true;
      setAllCustomers([]);
      setEndCursor(null);
      setHasMore(false);

      loadTimeAgainstAssignments({
        first: PAGE_SIZE,
        input: { timeForEntityId: '' },
        filter: { searchText: search.trim() || undefined },
      });
    },
    [loadTimeAgainstAssignments],
  );

  const loadMore = useCallback(() => {
    if (!hasMore || !endCursor || loading) return;

    loadTimeAgainstAssignments({
      first: PAGE_SIZE,
      after: endCursor,
      input: { timeForEntityId: '' },
      filter: { searchText: searchText.trim() || undefined },
    });
  }, [hasMore, endCursor, loading, searchText, loadTimeAgainstAssignments]);

  useEffect(() => {
    if (!timeAgainstData || timeAgainstData.length === 0) {
      if (isInitialLoadRef.current) {
        setAllCustomers([]);
      }
      return;
    }

    const seenIds = new Set<string>();
    const transformed = timeAgainstData
      .filter((item) => item.customerType !== 'PROJECT')
      .reduce<CustomerOption[]>((acc, item) => {
        const id = item.timeAgainstContactDAS?.customer?.id;
        if (id && !seenIds.has(id)) {
          seenIds.add(id);
          acc.push({
            customerId: id,
            displayName: item.displayName || item.fullName || '',
          });
        }
        return acc;
      }, []);

    if (isInitialLoadRef.current) {
      setAllCustomers(transformed);
      isInitialLoadRef.current = false;
    } else {
      setAllCustomers((prev) => {
        const existingIds = new Set(prev.map((c) => c.customerId));
        const unique = transformed.filter(
          (c) => !existingIds.has(c.customerId),
        );
        return [...prev, ...unique];
      });
    }

    setHasMore(pageInfo?.hasNextPage || false);
    setEndCursor(pageInfo?.endCursor || null);
  }, [timeAgainstData, pageInfo]);

  return { customers: allCustomers, loading, hasMore, loadCustomers, loadMore };
};

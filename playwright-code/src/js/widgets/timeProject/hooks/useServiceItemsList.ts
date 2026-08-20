import { useCallback, useEffect, useRef } from 'react';
import { useStandardFieldOptionAssignments } from 'src/js/service/hooks/assignments/useStandardFieldOptionAssignments';
import { useAppDispatch, useAppSelector } from '../store';
import {
  setServiceItems,
  appendServiceItems,
  setServiceItemsPageInfo,
  setServiceItemsSearchText,
  setServiceItemsLoading,
} from '../store/estimateDrawerSlice';

const SFO_PAGE_SIZE = 200;

export const useServiceItemsList = (customerId?: string) => {
  const dispatch = useAppDispatch();
  const {
    serviceItems,
    serviceItemsLoading,
    serviceItemsHasMore,
    serviceItemsEndCursor,
    serviceItemsSearchText,
  } = useAppSelector((state) => state.estimateDrawer);

  const {
    loading: sfoLoading,
    data: sfoData,
    loadStandardFieldOptionAssignments,
    pageInfo,
  } = useStandardFieldOptionAssignments();

  const isLoadMoreRef = useRef(false);
  const initialLoadDoneRef = useRef(false);

  const mapSfoToServiceItems = useCallback(
    (data: any[]) =>
      data.map((node) => ({
        id: node.id,
        name: node.name || node.fullName || '',
        fullName: node.fullName,
      })),
    [],
  );

  useEffect(() => {
    if (sfoData == null) return;
    const mapped = mapSfoToServiceItems(sfoData);

    if (isLoadMoreRef.current) {
      dispatch(appendServiceItems(mapped));
      isLoadMoreRef.current = false;
    } else {
      dispatch(setServiceItems(mapped));
    }

    dispatch(
      setServiceItemsPageInfo({
        hasMore: pageInfo?.hasNextPage ?? false,
        endCursor: pageInfo?.endCursor ?? null,
      }),
    );
  }, [sfoData, pageInfo, dispatch, mapSfoToServiceItems]);

  useEffect(() => {
    dispatch(setServiceItemsLoading(sfoLoading));
  }, [sfoLoading, dispatch]);

  const fetchServiceItems = useCallback(
    (searchText?: string | null, after?: string) => {
      const isLoadMore = !!after;
      isLoadMoreRef.current = isLoadMore;

      if (!isLoadMore) {
        dispatch(setServiceItemsLoading(true));
      }

      loadStandardFieldOptionAssignments({
        first: SFO_PAGE_SIZE,
        after,
        input: {
          standardFieldLabel: 'SERVICE_ITEM',
          customerId: customerId || undefined,
        },
        filter: {
          assigned: true,
          active: true,
          searchText: searchText?.trim() || null,
        },
      });
    },
    [loadStandardFieldOptionAssignments, customerId, dispatch],
  );

  useEffect(() => {
    if (initialLoadDoneRef.current) return;
    initialLoadDoneRef.current = true;
    fetchServiceItems();
  }, [fetchServiceItems]);

  const searchServiceItems = useCallback(
    (text: string) => {
      dispatch(setServiceItemsSearchText(text));
      fetchServiceItems(text || null);
    },
    [fetchServiceItems, dispatch],
  );

  const loadMoreServiceItems = useCallback(() => {
    if (!serviceItemsHasMore || sfoLoading) return;
    fetchServiceItems(
      serviceItemsSearchText || null,
      serviceItemsEndCursor ?? undefined,
    );
  }, [
    serviceItemsHasMore,
    serviceItemsEndCursor,
    serviceItemsSearchText,
    sfoLoading,
    fetchServiceItems,
  ]);

  return {
    serviceItems,
    serviceItemsLoading,
    serviceItemsHasMore,
    searchServiceItems,
    loadMoreServiceItems,
  };
};

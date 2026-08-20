import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useIntl, useTracking } from '@payroll/quicksand';
import { B3, H3 } from '@ids-ts/typography';
import { debounce } from 'src/js/service/utils/debounce';
import {
  WhoIsWorkingOrderOn,
  SortOrder,
} from 'src/js/service/hooks/whosWorking/types';
import { useQbTimeSdk } from 'src/js/service/hooks/useQbTimeSdk';
import { WorkerMap } from './workerMap/WorkerMap';
import { WorkerList } from './workerList/WorkerList';
import {
  PlaceholderContainer,
  ContentMapContainer,
  MapSection,
  ListSection,
} from './WhosWorkingContent.styled';
import {
  useWhoIsWorkingLoadMore,
  WhoIsWorkingFilter,
  WhoIsWorkingOrderBy,
} from '../hooks/useWhoIsWorkingLoadMore';
import { SortByOption, DisplayByOption } from '../types';
import {
  DEFAULT_FILTER,
  DEFAULT_ORDER_BY,
  SEARCH_DEBOUNCE_MS,
} from '../constants';
import { getDateRangeFilter } from '../utils/utils';
import { useWhosWorkingTrackingPoints } from '../hooks/useWhosWorkingTrackingPoints';

/**
 * Maps sort option to API orderBy parameter
 */
const mapSortByToOrderBy = (sortBy: SortByOption): WhoIsWorkingOrderBy[] => {
  switch (sortBy) {
    case 'MOST_RECENT_CLOCKED_IN':
      return [
        {
          orderOn: WhoIsWorkingOrderOn.ON_THE_CLOCK,
          orderDirection: SortOrder.DESC,
        },
        {
          orderOn: WhoIsWorkingOrderOn.CLOCK_IN_TIME,
          orderDirection: SortOrder.DESC,
        },
      ];
    case 'DAILY_TOTAL':
      return [
        {
          orderOn: WhoIsWorkingOrderOn.DAILY_TOTAL,
          orderDirection: SortOrder.DESC,
        },
      ];
    case 'TEAM_MEMBER':
      return [
        {
          orderOn: WhoIsWorkingOrderOn.TIME_FOR_NAME,
          orderDirection: SortOrder.ASC,
        },
      ];
    case 'SHARING_LOCATION':
      return [
        {
          orderOn: WhoIsWorkingOrderOn.HAS_GEOLOCATION,
          orderDirection: SortOrder.DESC,
        },
      ];
    default:
      return DEFAULT_ORDER_BY;
  }
};

/**
 * Maps display option to API filter and orderBy parameters
 */
const mapDisplayByToFilterAndOrder = (
  displayBy: DisplayByOption,
  sortBy: SortByOption,
  currentSearchText?: string,
): {
  filter: WhoIsWorkingFilter;
  orderBy: WhoIsWorkingOrderBy[];
} => {
  const baseFilter: WhoIsWorkingFilter = {
    searchText: currentSearchText || undefined,
    dateRange: getDateRangeFilter(),
  };

  switch (displayBy) {
    case 'ON_CLOCK_ONLY':
      return {
        filter: { ...baseFilter, clockedInTimeForOnly: true },
        orderBy: mapSortByToOrderBy(sortBy),
      };
    case 'ALL_EMPLOYEES':
      return {
        filter: { ...baseFilter, clockedInTimeForOnly: false },
        orderBy: mapSortByToOrderBy(sortBy),
      };
    case 'BY_GROUP':
      // By Group: show all workers, sorted by group name first, then by selected sort option
      return {
        filter: { ...baseFilter, clockedInTimeForOnly: false },
        orderBy: [
          {
            orderOn: WhoIsWorkingOrderOn.GROUP_NAME,
            orderDirection: SortOrder.ASC,
          },
          ...mapSortByToOrderBy(sortBy),
        ],
      };
    default:
      return {
        filter: { ...baseFilter, clockedInTimeForOnly: true },
        orderBy: DEFAULT_ORDER_BY,
      };
  }
};

interface WhosWorkingContentProps {
  employeeId?: string;
}

const WhosWorkingContent: React.FC<WhosWorkingContentProps> = ({
  employeeId,
}) => {
  const track = useTracking();
  const trackingPoints = useWhosWorkingTrackingPoints();

  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  const [displayBy, setDisplayBy] = useState<DisplayByOption>('ON_CLOCK_ONLY');
  const [sortBy, setSortBy] = useState<SortByOption>('MOST_RECENT_CLOCKED_IN');
  const [filter, setFilter] = useState<WhoIsWorkingFilter>(DEFAULT_FILTER);
  const [orderBy, setOrderBy] =
    useState<WhoIsWorkingOrderBy[]>(DEFAULT_ORDER_BY);
  const { data: canEditWhosWorkingTime } = useQbTimeSdk<boolean>(
    (sdk) => sdk.isWhoIsWorkingEditTimeEnabled,
    { executeOnMount: true },
  );
  const isWhoIsWorkingEditTimeEnabled = canEditWhosWorkingTime === true;

  // Track widget viewed on mount
  useEffect(() => {
    track(trackingPoints.WIDGET_VIEWED);
  }, [track, trackingPoints]);

  const {
    workers,
    loading,
    isInitialLoading,
    error,
    summary,
    loadWhoIsWorking,
    loadMore,
    hasMore,
    refetch,
  } = useWhoIsWorkingLoadMore();

  // Load data on mount and when filter/orderBy changes
  useEffect(() => {
    // Track search only when loading with a non-empty search string
    if (filter.searchText) {
      track(trackingPoints.SEARCH);
    }
    loadWhoIsWorking(filter, orderBy);
  }, [loadWhoIsWorking, filter, orderBy, track, trackingPoints]);

  const handleSelectWorker = useCallback((workerId: string) => {
    setSelectedWorkerId(workerId);
  }, []);

  const handleRefresh = useCallback(() => {
    refetch(filter, orderBy);
  }, [refetch, filter, orderBy]);

  // Debounced function to update filter with search text
  const debouncedSetSearchFilter = useMemo(
    () =>
      debounce((value: string) => {
        setFilter((prevFilter) => ({
          ...prevFilter,
          searchText: value.trim() || undefined,
          dateRange: getDateRangeFilter(),
        }));
      }, SEARCH_DEBOUNCE_MS),
    [],
  );

  /**
   * Handle search input change with debounce
   * Updates local state immediately, debounces filter update for API call
   */
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchText(value);
      debouncedSetSearchFilter(value);
    },
    [debouncedSetSearchFilter],
  );

  /**
   * Handle filter popover apply
   * Maps display and sort options to API parameters and triggers refetch
   */
  const handleApplyFilters = useCallback(
    (newDisplayBy: DisplayByOption, newSortBy: SortByOption) => {
      setDisplayBy(newDisplayBy);
      setSortBy(newSortBy);

      const { filter: newFilter, orderBy: newOrderBy } =
        mapDisplayByToFilterAndOrder(
          newDisplayBy,
          newSortBy,
          searchText.trim() || undefined,
        );

      setFilter(newFilter);
      setOrderBy(newOrderBy);
    },
    [searchText],
  );

  const intl = useIntl();

  return (
    <PlaceholderContainer>
      <div>
        <H3 weight="demi">{intl.formatMessage({ id: 'whosWorking.title' })}</H3>
        <B3>{intl.formatMessage({ id: 'whosWorking.description' })}</B3>
      </div>
      <ContentMapContainer>
        <MapSection>
          <WorkerMap
            workers={workers}
            loading={loading}
            selectedWorkerId={selectedWorkerId}
            onSelectWorker={handleSelectWorker}
            summary={summary}
            onRefresh={handleRefresh}
          />
        </MapSection>
        <ListSection>
          <WorkerList
            workers={workers}
            loading={loading}
            isInitialLoading={isInitialLoading}
            selectedWorkerId={selectedWorkerId}
            onSelectWorker={handleSelectWorker}
            searchText={searchText}
            onSearchChange={handleSearchChange}
            displayBy={displayBy}
            sortBy={sortBy}
            onApplyFilters={handleApplyFilters}
            hasMore={hasMore}
            onLoadMore={loadMore}
            currentUserWorkerId={employeeId}
            isWhoIsWorkingEditTimeEnabled={isWhoIsWorkingEditTimeEnabled}
          />
        </ListSection>
      </ContentMapContainer>
    </PlaceholderContainer>
  );
};

export default WhosWorkingContent;

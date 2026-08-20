import {
  SortOrder,
  WhoIsWorkingFilter,
  WhoIsWorkingOrderBy,
  WhoIsWorkingOrderOn,
} from '../../service/hooks/whosWorking/types';
import { getDateRangeFilter } from './utils/utils';

export const WHOS_WORKING_LOGGING_CONSTANTS = {
  NAVIGATION: {
    WHOS_WORKING_WIDGET_MOUNTED: 'WhosWorkingWidget mounted',
    WHOS_WORKING_WIDGET_UNMOUNTED: 'WhosWorkingWidget unmounted',
  },
  API_ERRORS: {
    APOLLO_CLIENT_NOT_INITIALIZED:
      'WhosWorkingWidget: Apollo client not initialized',
  },
} as const;

export const WHOS_WORKING_MAP_UNKNOWN_ERROR = 'Unknown Error';

export const SEARCH_DEBOUNCE_MS = 300;

// Default filter: show workers on clock only with current date range
export const DEFAULT_FILTER: WhoIsWorkingFilter = {
  clockedInTimeForOnly: true,
  dateRange: getDateRangeFilter(),
};

// Default sort: most recent clocked-in first
export const DEFAULT_ORDER_BY: WhoIsWorkingOrderBy[] = [
  {
    orderOn: WhoIsWorkingOrderOn.ON_THE_CLOCK,
    orderDirection: SortOrder.DESC,
  },
  {
    orderOn: WhoIsWorkingOrderOn.CLOCK_IN_TIME,
    orderDirection: SortOrder.DESC,
  },
];

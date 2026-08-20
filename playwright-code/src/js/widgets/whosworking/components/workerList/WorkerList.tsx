import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useIntl, useTracking } from '@payroll/quicksand';
import TextField from '@ids-ts/text-field';
import { Search, SlidersH } from '@design-systems/icons';
import {
  Popover,
  PopoverContent,
  PopoverActions,
  PopoverHeader,
} from '@ids-ts/popover';
import Dropdown, { MenuItem } from '@ids-ts/dropdown';
import Button from '@ids-ts/button';
import { Activity } from '@ids-ts/loader';
import Widget from 'web-shell-core/widgets/HOCWidget';
import { WhoIsWorkingWorkerNode } from '../../hooks/useWhoIsWorkingLoadMore';
import { WorkerListGrouped } from './WorkerListGrouped';
import { WorkerListFlat } from './WorkerListFlat';
import { NoDataState } from './NoDataState';
import './WorkerListGrouped.css';
import type { DisplayByOption, SortByOption } from '../../types';
import {
  WorkerListContainer,
  WorkerListContent,
  LoadingContainer,
  LoadingMoreContent,
  SearchContainer,
  FilterControl,
  PopoverContentWrapper,
} from './WorkerList.styled';
import { useWhosWorkingTrackingPoints } from '../../hooks/useWhosWorkingTrackingPoints';

/** Scroll threshold percentage to trigger load more (80%) */
const SCROLL_THRESHOLD = 0.8;

interface WorkerListProps {
  workers: WhoIsWorkingWorkerNode[];
  loading?: boolean;
  /** True when loading the first page (initial load, filter change, refetch) */
  isInitialLoading?: boolean;
  selectedWorkerId?: string;
  onSelectWorker?: (workerId: string) => void;
  searchText?: string;
  onSearchChange?: (value: string) => void;
  displayBy?: DisplayByOption;
  sortBy?: SortByOption;
  onApplyFilters?: (displayBy: DisplayByOption, sortBy: SortByOption) => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
  currentUserWorkerId?: string;
  isWhoIsWorkingEditTimeEnabled?: boolean;
}

/**
 * Worker List Component
 * Displays list of workers currently working with search functionality
 * Supports grouped view when displayBy is 'BY_GROUP'
 */
export const WorkerList: React.FC<WorkerListProps> = ({
  workers,
  loading = false,
  isInitialLoading = false,
  selectedWorkerId = '',
  onSelectWorker,
  searchText = '',
  onSearchChange,
  displayBy = 'ON_CLOCK_ONLY',
  sortBy = 'MOST_RECENT_CLOCKED_IN',
  onApplyFilters,
  hasMore = false,
  onLoadMore,
  currentUserWorkerId,
  isWhoIsWorkingEditTimeEnabled = true,
}) => {
  const intl = useIntl();
  const track = useTracking();
  const trackingPoints = useWhosWorkingTrackingPoints();
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  // Local state for popover (only applied on submit)
  const [pendingDisplayBy, setPendingDisplayBy] =
    useState<DisplayByOption>(displayBy);
  const [pendingSortBy, setPendingSortBy] = useState<SortByOption>(sortBy);
  const filterButtonRef = useRef<HTMLDivElement>(null);

  // Scroll and loading more state
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const listContentRef = useRef<HTMLDivElement>(null);

  // Trowser state for editing/adding time entries
  const [isTrowserOpen, setIsTrowserOpen] = useState(false);
  const [selectedTimeEntryId, setSelectedTimeEntryId] = useState<string | null>(
    null,
  );

  // Breaks widget state
  const [isBreaksWidgetOpen, setIsBreaksWidgetOpen] = useState(false);
  const [selectedWorkerIdForBreak, setSelectedWorkerIdForBreak] = useState<
    string | null
  >(null);

  /**
   * Handle scroll event for infinite scroll
   * Triggers loadMore when user scrolls to 80% of the list
   */
  const handleScroll = useCallback(
    (event: Event) => {
      const target = event.target as HTMLElement;
      if (!target) return;

      const { scrollTop, scrollHeight, clientHeight } = target;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

      if (
        scrollPercentage > SCROLL_THRESHOLD &&
        hasMore &&
        !loading &&
        !isLoadingMore
      ) {
        setIsLoadingMore(true);
        onLoadMore?.();
      }
    },
    [hasMore, loading, isLoadingMore, onLoadMore],
  );

  // Reset isLoadingMore when loading completes
  useEffect(() => {
    if (!loading && isLoadingMore) {
      setIsLoadingMore(false);
    }
  }, [loading, isLoadingMore]);

  // Attach scroll event listener to WorkerListContent
  useEffect(() => {
    const listElement = listContentRef.current;
    if (!listElement) {
      return undefined;
    }

    listElement.addEventListener('scroll', handleScroll);

    return () => {
      listElement.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  // Row action handlers
  const handleMapIconClick = useCallback(
    (workerId: string, event: React.MouseEvent) => {
      event.stopPropagation();
      if (onSelectWorker) {
        onSelectWorker(workerId === selectedWorkerId ? '' : workerId);
      }
    },
    [onSelectWorker, selectedWorkerId],
  );

  const handleEditTime = useCallback((timeEntryId: string) => {
    setSelectedTimeEntryId(timeEntryId);
    setIsTrowserOpen(true);
  }, []);

  const handleAddTime = useCallback(() => {
    setSelectedTimeEntryId(null);
    setIsTrowserOpen(true);
  }, []);

  const handleAddBreak = useCallback((workerId: string) => {
    setSelectedWorkerIdForBreak(workerId);
    setIsBreaksWidgetOpen(true);
  }, []);

  const handleBreaksWidgetClose = useCallback(() => {
    setIsBreaksWidgetOpen(false);
    setSelectedWorkerIdForBreak(null);
  }, []);

  const handleBreaksWidgetSave = useCallback(() => {
    setIsBreaksWidgetOpen(false);
    setSelectedWorkerIdForBreak(null);
  }, []);

  const handleFilterClick = () => {
    track(trackingPoints.SELECT_FILTER);
    // Reset pending state to current values when opening
    setPendingDisplayBy(displayBy);
    setPendingSortBy(sortBy);
    setIsFilterPopoverOpen(true);
  };

  const handleFilterPopoverClose = () => {
    setIsFilterPopoverOpen(false);
  };

  const handleApplyFilters = () => {
    track(trackingPoints.APPLY_FILTER);
    onApplyFilters?.(pendingDisplayBy, pendingSortBy);
    setIsFilterPopoverOpen(false);
  };

  return (
    <WorkerListContainer>
      <SearchContainer>
        <TextField
          addonBefore={<Search />}
          aria-label={intl.formatMessage({
            id: 'whosWorking.list.search.placeholder',
          })}
          value={searchText}
          width="100%"
          placeholder={intl.formatMessage({
            id: 'whosWorking.list.search.placeholder',
          })}
          onChange={(e) => {
            onSearchChange?.(e.target.value);
          }}
          autoComplete="off"
        />
        <div ref={filterButtonRef}>
          <FilterControl
            selected
            size="medium"
            onClick={handleFilterClick}
            aria-label={intl.formatMessage({
              id: 'whosWorking.filter.title',
            })}
          >
            <SlidersH />
          </FilterControl>
        </div>
      </SearchContainer>
      {/* Show loader during initial load */}
      {isInitialLoading && (
        <WorkerListContent>
          <LoadingContainer>
            <Activity size="large" shape="dots" />
          </LoadingContainer>
        </WorkerListContent>
      )}
      {/* Show no data state when not loading and no workers */}
      {!isInitialLoading && !loading && workers.length === 0 && (
        <WorkerListContent>
          <NoDataState displayBy={displayBy} searchText={searchText} />
        </WorkerListContent>
      )}
      {/* Conditionally render grouped or flat list based on displayBy */}
      {!isInitialLoading && workers.length > 0 && (
        <WorkerListContent
          ref={listContentRef}
          className={
            displayBy === 'BY_GROUP' ? 'whos-working-grouped' : undefined
          }
        >
          {displayBy === 'BY_GROUP' ? (
            <WorkerListGrouped
              workers={workers}
              selectedWorkerId={selectedWorkerId}
              onMapClick={handleMapIconClick}
              onEditTime={handleEditTime}
              onAddTime={handleAddTime}
              onAddBreak={handleAddBreak}
              currentUserWorkerId={currentUserWorkerId}
              isWhoIsWorkingEditTimeEnabled={isWhoIsWorkingEditTimeEnabled}
            />
          ) : (
            <WorkerListFlat
              workers={workers}
              selectedWorkerId={selectedWorkerId}
              onMapClick={handleMapIconClick}
              onEditTime={handleEditTime}
              onAddTime={handleAddTime}
              onAddBreak={handleAddBreak}
              currentUserWorkerId={currentUserWorkerId}
              isWhoIsWorkingEditTimeEnabled={isWhoIsWorkingEditTimeEnabled}
            />
          )}
          {/* Loading more indicator */}
          {isLoadingMore && (
            <LoadingMoreContent>
              <Activity size="small" shape="dots" />
              {intl.formatMessage({ id: 'whosWorking.list.loadingMore' })}
            </LoadingMoreContent>
          )}
        </WorkerListContent>
      )}

      {/* Single Time Trowser Widget */}
      {isTrowserOpen && (
        <Widget
          widgetId="time-tracking-ui/singleTimeTrowser"
          key={`trowser-${isTrowserOpen}-${selectedTimeEntryId}`}
          open={isTrowserOpen}
          setOpen={setIsTrowserOpen}
          isOTX // Since Whos Working is already a paid feature we just pass true for isOTX
          isSingleTimeEntry
          timeEntryId={selectedTimeEntryId}
        />
      )}

      {/* Breaks Widget */}
      {isBreaksWidgetOpen && (
        <Widget
          key={`break-entry-form-${isBreaksWidgetOpen}-${selectedWorkerIdForBreak}`}
          widgetId="time-tracking-ui/breaks"
          data-testid="time-tracking-ui/breaks"
          options={{
            feature: 'break-entries',
            functionality: 'create-break-entry',
            props: {
              open: isBreaksWidgetOpen,
              onClose: handleBreaksWidgetClose,
              onSave: handleBreaksWidgetSave,
              workerId: selectedWorkerIdForBreak,
            },
          }}
        />
      )}

      {/* Filter Popover */}
      <Popover
        dismissible
        open={isFilterPopoverOpen}
        targetElement={filterButtonRef.current}
        position="bottom"
        alignment="left"
        variant="popover"
        onClose={handleFilterPopoverClose}
        animationOn
      >
        <PopoverHeader
          title={intl.formatMessage({ id: 'whosWorking.filter.title' })}
          alignment="left"
        />
        <PopoverContent alignment="left" overflow={false}>
          <PopoverContentWrapper>
            <div>
              <Dropdown
                value={pendingDisplayBy}
                onChange={(e: any) => {
                  track({
                    ...trackingPoints.DISPLAY_BY,
                    whos_working_filter: e.target.value.toLowerCase(),
                  });
                  setPendingDisplayBy(e.target.value as DisplayByOption);
                }}
                label={intl.formatMessage({
                  id: 'whosWorking.filter.displayBy.label',
                })}
                aria-label={intl.formatMessage({
                  id: 'whosWorking.filter.displayBy.label',
                })}
              >
                <MenuItem value="ON_CLOCK_ONLY">
                  {intl.formatMessage({
                    id: 'whosWorking.filter.displayBy.onClockOnly',
                  })}
                </MenuItem>
                <MenuItem value="BY_GROUP">
                  {intl.formatMessage({
                    id: 'whosWorking.filter.displayBy.byGroup',
                  })}
                </MenuItem>
                <MenuItem value="ALL_EMPLOYEES">
                  {intl.formatMessage({
                    id: 'whosWorking.filter.displayBy.allEmployees',
                  })}
                </MenuItem>
              </Dropdown>
            </div>
            <div>
              <Dropdown
                value={pendingSortBy}
                onChange={(e: any) => {
                  track({
                    ...trackingPoints.SORT_BY,
                    sort_by: e.target.value.toLowerCase(),
                  });
                  setPendingSortBy(e.target.value as SortByOption);
                }}
                label={intl.formatMessage({
                  id: 'whosWorking.filter.sortBy.label',
                })}
                aria-label={intl.formatMessage({
                  id: 'whosWorking.filter.sortBy.label',
                })}
              >
                <MenuItem value="MOST_RECENT_CLOCKED_IN">
                  {intl.formatMessage({
                    id: 'whosWorking.filter.sortBy.mostRecentClockedIn',
                  })}
                </MenuItem>
                <MenuItem value="DAILY_TOTAL">
                  {intl.formatMessage({
                    id: 'whosWorking.filter.sortBy.dailyTotal',
                  })}
                </MenuItem>
                <MenuItem value="TEAM_MEMBER">
                  {intl.formatMessage({
                    id: 'whosWorking.filter.sortBy.teamMember',
                  })}
                </MenuItem>
                <MenuItem value="SHARING_LOCATION">
                  {intl.formatMessage({
                    id: 'whosWorking.filter.sortBy.sharingLocation',
                  })}
                </MenuItem>
              </Dropdown>
            </div>
          </PopoverContentWrapper>
        </PopoverContent>
        <PopoverActions isStacked={false}>
          <Button priority="primary" onClick={handleApplyFilters}>
            {intl.formatMessage({ id: 'whosWorking.filter.apply' })}
          </Button>
        </PopoverActions>
      </Popover>
    </WorkerListContainer>
  );
};

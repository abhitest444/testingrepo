import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useIntl, useSandbox } from '@payroll/quicksand';
import TextField from '@ids-ts/text-field';
// eslint-disable-next-line import/no-extraneous-dependencies
import LinkActionButton from '@qbds/link-action-button';
import { PersonThree, CoffeeCup } from '@design-systems/icons';
import { QuickbooksOnlineSandbox } from '@appfabric/sandbox-spec';
import { debounce } from 'src/js/service/utils/debounce';
import { useCustomerProjects } from 'src/js/widgets/quickFind/hooks/useCustomerProjects';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  selectCustomerData,
  selectActiveBreaks,
  selectTeamMember,
  selectCustomerDataLoading,
} from '../../store/selectors';
import { updateTimeAgainst, TimeAgainst } from '../../store/timeEntryGridSlice';
import { DataAccess_ContactType } from '../../../../../__generated__/oigql/graphql';
import {
  Container,
  TabsColumn,
  TabItem,
  ContentColumn,
  SearchRow,
  List,
  ListItem,
  TypeLabel,
  CustomerTypeLabel,
  EmptyState,
} from '../styles/WeeklySuperSerach.styles';
import { useWTEAssignments } from '../../context/WTEAssignmentsContext';
import { ContactDrawer } from './ContactDrawer';
import { setCustomers, setError, setLoading } from '../../store/customerSlice';
import { WEEKLY_SUPER_SEARCH_CUSTOMER_PAGE_SIZE } from '../../utils/constants';

export interface WeeklySuperSearchProps {
  rowId: string;
  value: TimeAgainst;
  selectedCustomer?: { id: string; displayName: string };
  onSelect?: () => void;
}

const TAB_LIST = [
  {
    key: '0',
    labelKey: 'weekly.time.entry.super.search.customer.project.tab',
    icon: <PersonThree style={{ marginRight: 8 }} />,
  },
  {
    key: '1',
    labelKey: 'weekly.time.entry.super.search.breaks.tab',
    icon: <CoffeeCup style={{ marginRight: 8 }} />,
  },
];

/**
 * Derives parent information from the fullName by extracting the penultimate segment.
 * fullName format: "Root Customer:Parent Customer:Child Customer"
 * Extracts "Parent Customer" as the parent name.
 */
const deriveParentInfoFromFullName = (parentId: string, fullName: string) => {
  const segments = fullName.split(':');
  if (segments.length >= 2) {
    const parentName = segments[segments.length - 2].trim();
    if (parentName) {
      return {
        id: parentId,
        displayName: parentName,
        fullName: parentName,
        __typename: 'DataAccess_Customer' as const,
      };
    }
  }
  return null;
};

export const WeeklySuperSearch: React.FC<WeeklySuperSearchProps> = ({
  rowId,
  value,
  selectedCustomer,
  onSelect,
}) => {
  const dispatch = useAppDispatch();
  const intl = useIntl();
  const customersFromStore = useAppSelector(selectCustomerData);
  const loadingFromStore = useAppSelector(selectCustomerDataLoading);
  const breaks = useAppSelector(selectActiveBreaks);
  const teamMember = useAppSelector(selectTeamMember);
  const wteAssignments = useWTEAssignments();
  const sandbox = useSandbox();
  const isWorkforceUser = isWorkforceEnvironment(
    sandbox as QuickbooksOnlineSandbox,
  );
  // GraphQL hook - QuickFind customer/project list.
  const {
    customers: customersGraphQL,
    loading: loadingGraphQL,
    error: errorGraphQL,
    loadCustomers: loadCustomersGraphQL,
    loadMore: loadMoreGraphQL,
    hasMore: hasMoreGraphQL,
  } = useCustomerProjects({
    pageSize: WEEKLY_SUPER_SEARCH_CUSTOMER_PAGE_SIZE,
    enableLoadMore: true,
  });

  const [tab, setTab] = useState('0');
  const [customerSearch, setCustomerSearch] = useState('');
  const [breakSearch, setBreakSearch] = useState('');
  const [showContactDrawer, setShowContactDrawer] = useState<boolean>(false);

  // Local state to hold search results without affecting global store
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // When GraphQL is enabled, the customer/project list is fetched once on worker change
  // by useWTETimeAgainstAssignmentsFetch (in WeeklyTimeEntryDataProvider) and stored in Redux.
  // We do NOT call loadCustomersGraphQL here on mount, so the dropdown uses customersFromStore.
  // Search still triggers refetch via refetchCustomers (loadCustomersGraphQL with searchText).

  // useCustomerProjects may return a new array reference on every render even when the
  // underlying data is unchanged. Depending on that raw reference would re-run the sync
  // effect each render, dispatching to Redux in a loop. We instead derive the normalized
  // payload once via useMemo (keyed off the raw reference) and depend on the memo, so the
  // effect only fires when the data genuinely changes.
  const normalizedGraphQLCustomers = useMemo(() => {
    if (!customersGraphQL || customersGraphQL.length === 0) return null;
    // WTE uses customer id only; for projects use parentId (customer id) so store and selection stay consistent
    return customersGraphQL.map((item) => ({
      id: item.id,
      displayName: item.displayName,
      fullName: item.fullName,
      type: DataAccess_ContactType.Customer, // Use Customer type for both customers and projects
      __typename:
        item.type === 'PROJECT'
          ? ('DataAccess_Project' as const)
          : ('DataAccess_Customer' as const),
      parentId: item.parentId || null,
      level: item.level ?? null,
      active: true,
    }));
  }, [customersGraphQL]);

  useEffect(() => {
    // setLoading/setError reducers write primitive values, so React-Redux bails out of
    // re-renders when nothing changed. The guard above (depending on the memo, not the raw
    // array) is what prevents this effect from re-running every render.
    dispatch(setLoading({ loading: loadingGraphQL }));
    dispatch(setError({ error: errorGraphQL || null }));

    // Only sync to store when we have data from a fetch (search or refetch).
    // When the menu just opens, useCustomerProjects has empty customersGraphQL (no load on mount);
    // do NOT overwrite Redux with [] or we would clear the list from useWTETimeAgainstAssignmentsFetch.
    if (normalizedGraphQLCustomers) {
      if (isSearching) {
        setSearchResults(normalizedGraphQLCustomers);
      } else {
        dispatch(
          setCustomers({ customers: normalizedGraphQLCustomers as any }),
        );
      }
    } else if (isSearching && !loadingGraphQL) {
      // Search returned empty - clear stale results from previous search
      setSearchResults([]);
    }
  }, [
    normalizedGraphQLCustomers,
    loadingGraphQL,
    errorGraphQL,
    dispatch,
    isSearching,
  ]);

  // Clear search results when search is cleared
  useEffect(() => {
    if (!isSearching && searchResults.length > 0) setSearchResults([]);
  }, [isSearching, searchResults]);

  // Handle scroll for infinite scroll - load more when user reaches end of list (same as CustomerDropdown)
  // Use the loadMore from whichever source holds the current data:
  // - Searching: useCustomerProjects (searchResults)
  // - Post-search-clear: useCustomerProjects (we synced its data to Redux, so it has correct pageInfo)
  // - Initial (no search ever): wteAssignments (useWTETimeAgainstAssignmentsFetch, data from Redux)
  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const target = event.currentTarget;
      if (!target) return;

      const useGraphQLLoadMore =
        isSearching || (customersGraphQL && customersGraphQL.length > 0);
      const hasMore = useGraphQLLoadMore
        ? hasMoreGraphQL
        : wteAssignments?.hasMore ?? false;
      const loading = useGraphQLLoadMore ? loadingGraphQL : loadingFromStore;
      if (!hasMore || loading) return;

      const { scrollTop, scrollHeight, clientHeight } = target;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

      if (scrollPercentage > 0.8) {
        if (useGraphQLLoadMore) {
          loadMoreGraphQL();
        } else if (wteAssignments?.loadMore) {
          wteAssignments.loadMore();
        }
      }
    },
    [
      isSearching,
      customersGraphQL,
      hasMoreGraphQL,
      wteAssignments,
      loadingGraphQL,
      loadingFromStore,
      loadMoreGraphQL,
    ],
  );

  // Refetch function that makes API calls (not UI filtering)
  const refetchCustomersGraphQL = useCallback(
    (searchText?: string) => {
      setIsSearching(!!searchText);

      if (teamMember?.id) {
        // Worker selected, filter to assigned customers only
        loadCustomersGraphQL({
          timeForEntityId: teamMember.id,
          searchText,
          assignmentFilters: { assigned: true },
        });
      } else {
        // No worker, show all customers
        loadCustomersGraphQL({
          timeForEntityId: '', // Empty string when no worker
          searchText,
          assignmentFilters: undefined,
        });
      }
    },
    [teamMember?.id, loadCustomersGraphQL],
  );

  const refetchCustomers = refetchCustomersGraphQL;

  // Use search results if searching, otherwise use store
  const customers = useMemo(() => {
    if (isSearching) return searchResults;
    return customersFromStore;
  }, [isSearching, searchResults, customersFromStore]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(debounce(refetchCustomers, 500), [
    refetchCustomers,
  ]);

  // Build hierarchical structure from flat list using parentId
  const hierarchicalCustomers = useMemo(() => {
    if (!customers || customers.length === 0) return [];

    // Create a map of all items by their ID
    const itemsMap = new Map();
    const rootItems: any[] = [];

    // First pass: create all items
    customers.forEach((customer) => {
      const item = {
        ...customer,
        children: [],
      };
      itemsMap.set(customer?.id, item);
    });

    // Second pass: build parent-child relationships using parentId.
    // Each node must appear under only one parent (first occurrence wins), so the same
    // project is not shown under multiple customers when the API returns duplicate edges.
    const placedIds = new Set<string>();
    customers.forEach((customer) => {
      const id = customer?.id;
      if (id != null && placedIds.has(id)) return;

      const item = itemsMap.get(id);
      if (!item) return;

      if (id != null) placedIds.add(id);
      const parentId = (customer as any)?.parentId;

      if (!parentId) {
        // Items without a parentId are root items
        rootItems.push(item);
      } else {
        // Find parent and add this item as a child
        const parentItem = itemsMap.get(parentId);
        if (parentItem) {
          parentItem.children.push(item);
        } else {
          // If parent not found, treat as root item
          rootItems.push(item);
        }
      }
    });

    return rootItems;
  }, [customers]);

  // Flatten hierarchical structure for display (always expanded)
  const flattenedCustomers = useMemo(() => {
    const result: any[] = [];

    const flatten = (items: any[], depth = 0, parentInfo: any = null) => {
      items.forEach((item) => {
        // Derive parentInfo from fullName if not already available
        let derivedParentInfo = parentInfo;
        if (!derivedParentInfo && item.parentId && item.fullName) {
          derivedParentInfo = deriveParentInfoFromFullName(
            item.parentId,
            item.fullName,
          );
        }

        result.push({ ...item, depth, parentInfo: derivedParentInfo });
        // Always show children (no expand/collapse logic)
        if (item.children && item.children.length > 0) {
          flatten(item.children, depth + 1, {
            id: item.id,
            displayName: item.displayName,
            fullName: item.fullName,
            __typename: item.__typename,
          });
        }
      });
    };

    flatten(hierarchicalCustomers);
    return result;
  }, [hierarchicalCustomers]);

  const filteredCustomers = useMemo(() => {
    // When searching, the GraphQL API already filtered the results.
    if (isSearching) {
      return flattenedCustomers;
    }

    if (!customerSearch) return flattenedCustomers;

    // When searching, show all matching items regardless of hierarchy
    // Reset depth to 0 for all search results to remove indentation
    return flattenedCustomers
      .filter((c) => {
        const displayName = c?.displayName || '';
        const fullName = (c as any)?.fullName || '';
        const id = c?.id || '';
        const searchText = `${displayName} ${fullName} ${id}`.toLowerCase();
        return searchText.includes(customerSearch.toLowerCase());
      })
      .map((c) => {
        const fullName = (c as any)?.fullName || '';
        let parentInfo = (c as any)?.parentInfo;

        // If parentInfo is not available but we have parentId, try to extract from fullName
        if (!parentInfo && (c as any)?.parentId && fullName) {
          parentInfo = deriveParentInfoFromFullName(
            (c as any).parentId,
            fullName,
          );
        }

        return {
          ...c,
          depth: 0, // Reset depth to 0 for all search results
          parentInfo, // Include derived or existing parentInfo
        };
      });
  }, [isSearching, flattenedCustomers, customerSearch]);

  const filteredBreaks = useMemo(() => {
    if (!breakSearch) return breaks;
    return breaks.filter((breakItem) =>
      breakItem.breakName.toLowerCase().includes(breakSearch.toLowerCase()),
    );
  }, [breaks, breakSearch]);

  const handleDrawerOpen = () => {
    setShowContactDrawer(true);
  };

  const handleDrawerClose = () => {
    setShowContactDrawer(false);
  };

  const visibleTabs = useMemo(
    () =>
      TAB_LIST.filter((t) => {
        if (t.key === '1') return breaks.length > 0;
        return true;
      }),
    [breaks],
  );

  return (
    <>
      <Container>
        <TabsColumn>
          {visibleTabs.map((t) => (
            <TabItem
              key={t.key}
              selected={tab === t.key}
              onClick={() => setTab(t.key)}
            >
              {t.icon}
              {intl.formatMessage({ id: t.labelKey })}
            </TabItem>
          ))}
        </TabsColumn>
        <ContentColumn onScroll={handleScroll}>
          {tab === '0' && (
            <>
              <SearchRow>
                <TextField
                  type="text"
                  placeholder={intl.formatMessage({
                    id: 'weekly.time.entry.super.search.search.placeholder',
                  })}
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    debouncedSearch(e.target.value);
                  }}
                  size="medium"
                  style={{ flex: 1, marginRight: 16 }}
                  aria-label={intl.formatMessage({
                    id: 'weekly.time.entry.super.search.search.aria.label',
                  })}
                />
              </SearchRow>
              {!isWorkforceUser && (
                <LinkActionButton size="medium" onClick={handleDrawerOpen}>
                  {intl.formatMessage({
                    id: 'weekly.time.entry.super.search.add.customer.project',
                  })}
                </LinkActionButton>
              )}
              {!loadingFromStore && filteredCustomers.length === 0 ? (
                <EmptyState>
                  {intl.formatMessage({
                    id: 'weekly.time.entry.super.search.empty.state',
                  })}
                </EmptyState>
              ) : (
                <List>
                  {filteredCustomers.map((customer) => {
                    const depth = (customer as any)?.depth || 0;
                    const fullName = (customer as any)?.fullName || '';
                    const parentInfo = (customer as any)?.parentInfo;

                    // Determine the label based on type and parent
                    const getTypeLabel = () => {
                      const isProject =
                        customer?.__typename === 'DataAccess_Project';
                      const isCustomer =
                        customer?.__typename === 'DataAccess_Customer';

                      if (isProject && parentInfo) {
                        // Project of parent customer
                        const parentName =
                          parentInfo.displayName ||
                          parentInfo.fullName ||
                          parentInfo.id;
                        return intl.formatMessage(
                          {
                            id: 'weekly.time.entry.super.search.project.of.label',
                          },
                          { parentName },
                        );
                      }

                      if (isCustomer && parentInfo) {
                        // Sub-customer of parent customer
                        const parentName =
                          parentInfo.displayName ||
                          parentInfo.fullName ||
                          parentInfo.id;
                        return intl.formatMessage(
                          {
                            id: 'weekly.time.entry.super.search.sub.customer.of.label',
                          },
                          { parentName },
                        );
                      }

                      if (isProject) {
                        // Root level project (shouldn't happen but fallback)
                        return intl.formatMessage({
                          id: 'weekly.time.entry.super.search.project.label',
                        });
                      }

                      // Root level customer
                      return intl.formatMessage({
                        id: 'weekly.time.entry.super.search.customer.label',
                      });
                    };

                    return (
                      <ListItem
                        key={customer?.id}
                        selected={selectedCustomer?.id === customer?.id}
                        style={{
                          paddingLeft: `${depth * 24}px`,
                        }}
                        onClick={() => {
                          const isProject =
                            (customer as any)?.__typename ===
                            'DataAccess_Project';
                          dispatch(
                            updateTimeAgainst({
                              rowId,
                              timeAgainst: {
                                type: isProject
                                  ? ('PROJECT' as const)
                                  : DataAccess_ContactType.Customer,
                                id: customer?.id || null,
                                displayName: customer?.displayName || null,
                              },
                            }),
                          );
                          if (onSelect) onSelect();
                        }}
                      >
                        <span style={{ flex: 1 }}>
                          {customer?.displayName || fullName || customer?.id}
                        </span>
                        <CustomerTypeLabel>{getTypeLabel()}</CustomerTypeLabel>
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </>
          )}
          {tab === '1' && (
            <>
              <SearchRow>
                <TextField
                  type="text"
                  placeholder="Search breaks"
                  value={breakSearch}
                  onChange={(e) => setBreakSearch(e.target.value)}
                  size="medium"
                  style={{ flex: 1, marginRight: 16 }}
                  aria-label="Search breaks"
                />
              </SearchRow>
              <List>
                {filteredBreaks.map((breakItem) => (
                  <ListItem
                    key={breakItem.id}
                    selected={
                      value.type === breakItem.breakType &&
                      value.id === breakItem.id
                    }
                    onClick={() => {
                      dispatch(
                        updateTimeAgainst({
                          rowId,
                          timeAgainst: {
                            type: breakItem.breakType,
                            id: breakItem.id,
                          },
                        }),
                      );
                      if (onSelect) onSelect();
                    }}
                  >
                    <span style={{ flex: 1 }}>{breakItem.breakName}</span>
                    <TypeLabel>
                      {breakItem.breakType === 'PAID'
                        ? 'Paid Break'
                        : 'Unpaid Break'}
                    </TypeLabel>
                  </ListItem>
                ))}
              </List>
            </>
          )}

          {/* TODO: Timeoff not in scope for R2 */}
          {/* {tab === '2' && ( */}
          {/*  <List> */}
          {/*    <ListItem */}
          {/*      selected={value.type === 'TIME_OFF' && value.id === 'paid'} */}
          {/*      onClick={() => { */}
          {/*        dispatch( */}
          {/*          updateTimeAgainst({ */}
          {/*            rowId, */}
          {/*            timeAgainst: { type: 'TIME_OFF', id: 'paid' }, */}
          {/*          }), */}
          {/*        ); */}
          {/*        if (onSelect) onSelect(); */}
          {/*      }} */}
          {/*    > */}
          {/*      <span style={{ flex: 1 }}>Paid</span> */}
          {/*      <TypeLabel>Time off</TypeLabel> */}
          {/*    </ListItem> */}
          {/*    <ListItem */}
          {/*      selected={value.type === 'TIME_OFF' && value.id === 'unpaid'} */}
          {/*      onClick={() => { */}
          {/*        dispatch( */}
          {/*          updateTimeAgainst({ */}
          {/*            rowId, */}
          {/*            timeAgainst: { type: 'TIME_OFF', id: 'unpaid' }, */}
          {/*          }), */}
          {/*        ); */}
          {/*        if (onSelect) onSelect(); */}
          {/*      }} */}
          {/*    > */}
          {/*      <span style={{ flex: 1 }}>Unpaid</span> */}
          {/*      <TypeLabel>Time off</TypeLabel> */}
          {/*    </ListItem> */}
          {/*  </List> */}
          {/* )} */}
        </ContentColumn>
      </Container>
      {showContactDrawer && (
        <ContactDrawer
          rowId={rowId}
          defaultName={customerSearch}
          onClose={handleDrawerClose}
          onSelect={onSelect}
        />
      )}
    </>
  );
};

export default WeeklySuperSearch;

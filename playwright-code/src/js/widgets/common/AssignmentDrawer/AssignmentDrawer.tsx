import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
} from '@ids-ts/drawer';
import Button from '@ids-ts/button';
import { B3 } from '@ids-ts/typography';
import { useIntl, QuicksandProvider, useSandbox } from '@payroll/quicksand';
import nlsLoader from 'src/nls';
import {
  AssignmentDrawerConfig,
  AssignmentItem,
  AssignmentChanges,
} from './types';
import {
  AssignmentSummary,
  AssignmentTable,
  AssignmentPagination,
} from './components';
import { GROUP_PREFIX, NO_GROUP_ID } from './assignmentUtils';
import { UnsavedChangesModal } from './components/UnsavedChangesModal';
import { SearchField } from '../SearchField';
import {
  SearchSummaryContainer,
  TableWrapper,
  FooterButtonsContainer,
  ErrorMessageContainer,
  LoadErrorContainer,
} from './AssignmentDrawer.styled';

interface AssignmentDrawerProps {
  open: boolean;
  onClose: () => void;
  config: AssignmentDrawerConfig;
  initialSelections?: Set<number | string>;
  loading?: boolean;
  errorMessage?: React.ReactNode;
  loadError?: React.ReactNode;
}

const AssignmentDrawer: React.FC<AssignmentDrawerProps> = ({
  open,
  onClose,
  config,
  initialSelections = new Set(),
  loading: externalLoading = false,
  errorMessage,
  loadError,
}) => {
  const sandbox = useSandbox();

  return (
    <QuicksandProvider
      sandbox={sandbox}
      nlsLoader={nlsLoader.requireNlsForLocale('assignmentDrawer') as any}
    >
      <AssignmentDrawerContent
        open={open}
        onClose={onClose}
        config={config}
        initialSelections={initialSelections}
        loading={externalLoading}
        errorMessage={errorMessage}
        loadError={loadError}
      />
    </QuicksandProvider>
  );
};

// Extract the main component logic into a separate component
// Export this for testing purposes
export const AssignmentDrawerContent: React.FC<AssignmentDrawerProps> = ({
  open,
  onClose,
  config,
  initialSelections = new Set(),
  loading: externalLoading = false,
  errorMessage,
  loadError,
}) => {
  const intl = useIntl();

  // Get NLS texts based on assignment type
  const getTitle = () =>
    intl.formatMessage({
      id: `assignmentDrawer.titles.${config.assignmentType}`,
    });
  const getDescription = () =>
    intl.formatMessage({
      id: `assignmentDrawer.descriptions.${config.assignmentType}`,
    });
  const getSummaryType = () =>
    intl.formatMessage({
      id: `assignmentDrawer.summaryTypes.${config.assignmentType}`,
    });
  const getTableHeader = () =>
    intl.formatMessage({
      id: `assignmentDrawer.tableHeaders.${config.assignmentType}`,
    });
  const getPaginationType = () =>
    intl.formatMessage({
      id: `assignmentDrawer.pagination.${config.assignmentType}`,
    });
  const getNoItemsFoundText = () =>
    intl.formatMessage({
      id: 'assignmentDrawer.noItemsFound',
    });
  const getSaveButtonText = () =>
    intl.formatMessage({
      id: 'assignmentDrawer.saveButton',
    });

  // State
  const [items, setItems] = useState<AssignmentItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [initialTotalCount, setInitialTotalCount] = useState(0);
  const [internalLoading, setInternalLoading] = useState(false);

  // Combine external and internal loading states
  const loading = externalLoading || internalLoading;
  const [selectedItems, setSelectedItems] = useState<Set<number | string>>(
    new Set(initialSelections),
  );
  const [searchValue, setSearchValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // State for unsaved changes modal
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  // Track initial selections for change detection - use ref so it doesn't change across renders
  const initialSelectionsRef = useRef(new Set(initialSelections));
  const initialSelectionsSetRef = useRef(false);

  // Extract modes for clarity
  const isServerSearch = config.dataSource.searchMode === 'server';

  // Fetch data - independently handle search and pagination based on their modes
  const fetchData = useCallback(async () => {
    setInternalLoading(true);
    try {
      const params: {
        page?: number;
        pageSize?: number;
        searchTerm?: string;
      } = {};

      // Add search parameter only for server-side search
      if (isServerSearch && searchValue.trim()) {
        params.searchTerm = searchValue;
      }

      // Add pagination parameters (always server-side when enabled)
      if (config.pagination.enabled) {
        params.page = currentPage;
        params.pageSize = config.pagination.defaultPageSize;
      }

      const result = await config.dataSource.fetchData(params);
      setItems(result.items);
      setTotalCount(result.totalCount);

      // Set initial total count only once when drawer first opens
      if (initialTotalCount === 0 && result.totalCount > 0) {
        setInitialTotalCount(result.totalCount);
      }
    } catch (error) {
      // Handle error silently or show user-friendly message
    } finally {
      setInternalLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    config.dataSource,
    config.pagination.enabled,
    config.pagination.defaultPageSize,
    isServerSearch,
    currentPage,
    searchValue,
    // Note: initialTotalCount is intentionally not in dependencies to avoid infinite loops
    // It's only set once when the count first becomes non-zero
  ]);

  // Fetch data when drawer opens or parameters change
  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, fetchData]);

  // Set initial selections when drawer opens and data is first loaded
  useEffect(() => {
    if (open && items.length > 0 && !initialSelectionsSetRef.current) {
      // Helper to check if an ID is a group ID (for WorkerAssignment)
      const isGroupId = (id: number | string): boolean => {
        const idStr = String(id);
        return idStr.startsWith(GROUP_PREFIX) || idStr === NO_GROUP_ID;
      };

      const preSelectedFromData = new Set(
        items.filter((item) => item.isSelected).map((item) => item.id),
      );
      const combinedSelections = new Set([
        ...initialSelections,
        ...preSelectedFromData,
      ]);
      setSelectedItems(combinedSelections);

      // IMPORTANT: Set the true initial state that we'll use for calculating changes
      // For WorkerAssignment, exclude group IDs from initial selections tracking
      if (config.assignmentType === 'WorkerAssignment') {
        const workersOnly = new Set(
          Array.from(combinedSelections).filter((id) => !isGroupId(id)),
        );
        initialSelectionsRef.current = new Set(workersOnly);
      } else {
        initialSelectionsRef.current = new Set(combinedSelections);
      }
      initialSelectionsSetRef.current = true;
    }
  }, [open, items, initialSelections, config.assignmentType]);

  // Reset the initial selections flag and total count when drawer closes
  useEffect(() => {
    if (!open) {
      initialSelectionsSetRef.current = false;
      setInitialTotalCount(0);
    }
  }, [open]);

  // Update selections when new items are loaded (for pagination with cached items)
  // This ensures that when new pages are fetched, items marked as selected in the API are reflected
  useEffect(() => {
    if (
      open &&
      config.pagination.enabled &&
      items.length > 0 &&
      initialSelectionsSetRef.current
    ) {
      setSelectedItems((prev) => {
        const newSet = new Set(prev);

        // Add any items that are marked as selected from the API
        items.forEach((item) => {
          if (item.isSelected && !newSet.has(item.id)) {
            newSet.add(item.id);
          }
        });

        return newSet;
      });
    }
  }, [open, config.pagination.enabled, items]);

  // Reset search and pagination when drawer opens
  useEffect(() => {
    if (open) {
      setSearchValue('');
      setCurrentPage(1);
    }
  }, [open]);

  // Apply client-side filtering ONLY if search mode is 'client'
  const filteredItems = useMemo(() => {
    // Only apply client-side filtering if searchMode is 'client'
    if (config.dataSource.searchMode === 'client' && searchValue.trim()) {
      const lowerSearchValue = searchValue.toLowerCase();
      const itemsToInclude = new Set<number | string>();

      const shouldIncludeItem = (item: AssignmentItem): boolean => {
        const matchesSearch = item.name
          .toLowerCase()
          .includes(lowerSearchValue);

        const children = items.filter((child) => child.parentId === item.id);
        let hasMatchingChildren = false;
        children.forEach((child) => {
          if (shouldIncludeItem(child)) {
            hasMatchingChildren = true;
          }
        });

        if (matchesSearch || hasMatchingChildren) {
          itemsToInclude.add(item.id);
          return true;
        }

        return false;
      };

      // Filter top-level items (this will recursively process all children)
      items
        .filter((item) => item.level === 0)
        .forEach((item) => shouldIncludeItem(item));

      // Return filtered items maintaining original order
      return items.filter((item) => itemsToInclude.has(item.id));
    }
    // If searchMode is 'server' or no search value, return items as-is
    return items;
  }, [items, searchValue, config.dataSource.searchMode]);

  // Calculate total pages using totalCount from server
  const totalPages = useMemo(() => {
    if (!config.pagination.enabled || config.pagination.defaultPageSize <= 0)
      return 1;

    return Math.ceil(totalCount / config.pagination.defaultPageSize);
  }, [
    totalCount,
    config.pagination.enabled,
    config.pagination.defaultPageSize,
  ]);

  // Calculate display total count based on modes
  // This represents the total items available (considering search if applicable)
  const displayTotalCount = useMemo(() => {
    // For client-side search with active filter
    if (config.dataSource.searchMode === 'client' && searchValue.trim()) {
      // For WorkerAssignment, count only workers (level 1), not groups (level 0)
      if (config.assignmentType === 'WorkerAssignment') {
        return filteredItems.filter((item) => item.level === 1).length;
      }
      return filteredItems.length;
    }

    // Otherwise use totalCount from server
    // For WorkerAssignment, totalCount is already filtered to workers only
    return totalCount;
  }, [
    config.dataSource.searchMode,
    config.assignmentType,
    searchValue,
    filteredItems,
    totalCount,
  ]);

  // Helper function to optimize hierarchical selections
  // Replace all children with parent ID when ALL children of a parent are being assigned/unassigned together
  const optimizeHierarchicalSelections = useCallback(
    (
      newlyAssigned: Set<number | string>,
      newlyUnassigned: Set<number | string>,
    ): {
      optimizedAssigned: Set<number | string>;
      optimizedUnassigned: Set<number | string>;
    } => {
      if (!config.table.hierarchicalSelection) {
        return {
          optimizedAssigned: newlyAssigned,
          optimizedUnassigned: newlyUnassigned,
        };
      }

      // Helper to check if an ID represents a group (parent)
      const isGroupId = (id: number | string): boolean => {
        const idStr = String(id);
        return idStr.startsWith('group-') || idStr === 'no-group';
      };

      // Check if this is a customer/project assignment (not worker/group)
      // Customer assignments should NOT be optimized (backend doesn't cascade)
      const isCustomerProjectAssignment = items.some(
        (item) =>
          item.parentId && !isGroupId(item.id) && !isGroupId(item.parentId),
      );

      if (isCustomerProjectAssignment) {
        // For customer/project hierarchies, include parent when all children are selected
        // This is needed because clicking parent checkbox only selects children, not parent itself
        const expandWithParents = (
          changeSet: Set<number | string>,
        ): Set<number | string> => {
          const result = new Set(changeSet);

          // Build parent-child map
          const parentToChildren = new Map<
            number | string,
            Set<number | string>
          >();
          items.forEach((item) => {
            if (item.parentId) {
              if (!parentToChildren.has(item.parentId)) {
                parentToChildren.set(item.parentId, new Set());
              }
              parentToChildren.get(item.parentId)!.add(item.id);
            }
          });

          // For each parent, check if ALL its children are in the changeSet
          parentToChildren.forEach((children, parentId) => {
            const allChildrenInSet = Array.from(children).every((childId) =>
              changeSet.has(childId),
            );

            if (allChildrenInSet) {
              // Add parent to the result (keep children too)
              result.add(parentId);
            }
          });

          return result;
        };

        return {
          optimizedAssigned: expandWithParents(newlyAssigned),
          optimizedUnassigned: expandWithParents(newlyUnassigned),
        };
      }

      // Build a map of parentId -> all children for that parent
      const parentToChildrenMap = new Map<
        number | string,
        Set<number | string>
      >();
      items.forEach((item) => {
        if (item.parentId && !isGroupId(item.id)) {
          if (!parentToChildrenMap.has(item.parentId)) {
            parentToChildrenMap.set(item.parentId, new Set());
          }
          parentToChildrenMap.get(item.parentId)!.add(item.id);
        }
      });

      // Process a set: if all children of a parent are in the set, replace with parent ID
      const processSet = (
        changeSet: Set<number | string>,
      ): Set<number | string> => {
        const result = new Set<number | string>();
        const processedChildren = new Set<number | string>();

        // Check each parent: if ALL its children are in changeSet, add parent instead
        parentToChildrenMap.forEach((children, parentId) => {
          const allChildrenInSet = Array.from(children).every((childId) =>
            changeSet.has(childId),
          );

          if (allChildrenInSet) {
            result.add(parentId);
            children.forEach((childId) => processedChildren.add(childId));
          }
        });

        // Add any remaining items that weren't processed as part of a group
        changeSet.forEach((id) => {
          if (!processedChildren.has(id) && !isGroupId(id)) {
            result.add(id);
          } else if (isGroupId(id)) {
            // Keep any explicitly added group IDs
            result.add(id);
          }
        });

        return result;
      };

      return {
        optimizedAssigned: processSet(newlyAssigned),
        optimizedUnassigned: processSet(newlyUnassigned),
      };
    },
    [items, config.table.hierarchicalSelection],
  );

  // Calculate assignment changes (without hierarchical optimization)
  const assignmentChanges = useMemo((): AssignmentChanges => {
    let newlyAssigned = new Set<number | string>();
    let newlyUnassigned = new Set<number | string>();

    // Helper to check if an ID is a group ID (for WorkerAssignment)
    const isGroupId = (id: number | string): boolean => {
      const idStr = String(id);
      return idStr.startsWith(GROUP_PREFIX) || idStr === NO_GROUP_ID;
    };

    // Helper to count only assignable items (exclude groups for WorkerAssignment)
    const getAssignableCount = (itemSet: Set<number | string>): number => {
      if (config.assignmentType === 'WorkerAssignment') {
        // For WorkerAssignment, only count non-group items (actual workers)
        return Array.from(itemSet).filter((id) => !isGroupId(id)).length;
      }
      // For other assignment types, count all items
      return itemSet.size;
    };

    const wasInitiallySelectAll =
      getAssignableCount(initialSelectionsRef.current) === initialTotalCount &&
      initialTotalCount > 0;

    const isSelectAll =
      getAssignableCount(selectedItems) === initialTotalCount &&
      initialTotalCount > 0;

    // Special handling when starting from "Select All" state
    if (wasInitiallySelectAll && !isSelectAll) {
      if (selectedItems.size > 0) {
        // Case: Deselected some (but not all) from "select all"
        // Send remaining selected items as newlyAssigned AND deselected items as newlyUnassigned
        newlyAssigned = new Set(selectedItems);
        newlyUnassigned = new Set<number | string>();
        initialSelectionsRef.current.forEach((id) => {
          if (!selectedItems.has(id)) {
            newlyUnassigned.add(id);
          }
        });
      } else {
        // Case: Deselected ALL from "select all"
        // Send all items as newlyUnassigned
        newlyAssigned = new Set<number | string>();
        newlyUnassigned = new Set(initialSelectionsRef.current);
      }
    } else {
      // Normal case: Track individual changes (deltas)
      // Find newly assigned items (were initially unselected, now selected)
      selectedItems.forEach((id) => {
        if (!initialSelectionsRef.current.has(id)) {
          newlyAssigned.add(id);
        }
      });

      // Find newly unassigned items (were initially selected, now unselected)
      initialSelectionsRef.current.forEach((id) => {
        if (!selectedItems.has(id)) {
          newlyUnassigned.add(id);
        }
      });
    }

    // For WorkerAssignment: Filter out group IDs from change sets
    // Group IDs are only for UI - optimization logic will handle grouping
    if (config.assignmentType === 'WorkerAssignment') {
      newlyAssigned = new Set(
        Array.from(newlyAssigned).filter((id) => !isGroupId(id)),
      );
      newlyUnassigned = new Set(
        Array.from(newlyUnassigned).filter((id) => !isGroupId(id)),
      );
    }

    // Final lists represent the complete state after all changes
    // finalAssigned = all currently selected items
    const finalAssigned = new Set(selectedItems);

    // finalUnassigned = all items that exist but are NOT selected
    const finalUnassigned = new Set<number | string>();
    items.forEach((item) => {
      if (!selectedItems.has(item.id)) {
        finalUnassigned.add(item.id);
      }
    });

    // Check if there are changes
    const hasChanges = newlyAssigned.size > 0 || newlyUnassigned.size > 0;

    // If currently assigned all, clear the newly* sets (as per requirement)
    // finalAssigned/finalUnassigned remain populated with actual state
    if (isSelectAll) {
      newlyAssigned = new Set<number | string>();
      newlyUnassigned = new Set<number | string>();
    }

    const changeCount = isSelectAll
      ? 0
      : newlyAssigned.size + newlyUnassigned.size;

    return {
      currentSelections: initialSelectionsRef.current,
      totalItems: initialTotalCount,
      isSelectAll,
      newlyAssigned,
      newlyUnassigned,
      finalAssigned,
      finalUnassigned,
      hasChanges,
      changeCount,
    };
  }, [selectedItems, items, config.assignmentType, initialTotalCount]);

  // Handlers
  const handleToggleSelection = (id: number | string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const hasActiveSearch = searchValue.trim() !== '';
    let itemsToConsider = filteredItems;
    if (!hasActiveSearch && config.pagination.enabled) {
      itemsToConsider = items;
    }

    const enabledItems = itemsToConsider.filter((item) => !item.disabled);
    const allItemIds = enabledItems.map((item) => item.id);
    const allSelected = allItemIds.every((id) => selectedItems.has(id));

    if (allSelected) {
      setSelectedItems((prev) => {
        const newSet = new Set(prev);
        allItemIds.forEach((id) => newSet.delete(id));
        return newSet;
      });
    } else {
      setSelectedItems((prev) => {
        const newSet = new Set(prev);
        allItemIds.forEach((id) => newSet.add(id));
        return newSet;
      });
    }
  };

  const handleSave = async () => {
    try {
      // Apply hierarchical optimization only when saving, not on every change
      const { optimizedAssigned, optimizedUnassigned } =
        optimizeHierarchicalSelections(
          assignmentChanges.newlyAssigned,
          assignmentChanges.newlyUnassigned,
        );

      // Create optimized assignment changes for save
      const optimizedChanges: AssignmentChanges = {
        ...assignmentChanges,
        newlyAssigned: optimizedAssigned,
        newlyUnassigned: optimizedUnassigned,
      };

      await config.callbacks.onSave(optimizedChanges);
      // Note: Drawer closing is handled by parent component through callbacks
      // Don't auto-close here to support showing errors inside drawer
    } catch (error) {
      // Handle error silently or show user-friendly message
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    // Call search tracking callback if provided
    if (config.callbacks.onSearch && value.trim()) {
      config.callbacks.onSearch(value);
    }
    // Don't reset pagination - search and pagination are independent
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle close attempt - check for unsaved changes
  const handleCloseAttempt = useCallback(() => {
    if (assignmentChanges.hasChanges) {
      // Show confirmation modal if there are unsaved changes
      setShowUnsavedModal(true);
    } else {
      // No changes, close directly
      onClose();
    }
  }, [assignmentChanges.hasChanges, onClose]);

  // Handle "Save" button click in modal
  const handleModalSave = async () => {
    // Call the existing save handler
    await handleSave();
    // Close the modal - drawer closing is handled by parent after successful save
    setShowUnsavedModal(false);
  };

  // Handle "Don't save" button click in modal
  const handleModalDontSave = () => {
    // Close modal and drawer without saving
    setShowUnsavedModal(false);
    onClose();
  };

  return (
    <>
      <Drawer
        open={open}
        onClose={handleCloseAttempt}
        size="large"
        autoFocus
        restoreFocus
      >
        <DrawerHeader title={getTitle()} onClose={handleCloseAttempt} />

        <DrawerContent>
          {!loadError && <B3>{getDescription()}</B3>}

          {/* Error message - positioned between description and summary */}
          {errorMessage && (
            <ErrorMessageContainer>{errorMessage}</ErrorMessageContainer>
          )}

          {loadError ? (
            <LoadErrorContainer>{loadError}</LoadErrorContainer>
          ) : (
            <>
              {/* Search and Summary on same line */}
              <SearchSummaryContainer>
                <AssignmentSummary
                  selectedCount={
                    config.assignmentType === 'WorkerAssignment'
                      ? Array.from(selectedItems).filter((id) => {
                          const item = items.find((i) => i.id === id);
                          return item?.level === 1; // Only count workers, not groups
                        }).length
                      : selectedItems.size
                  }
                  totalCount={initialTotalCount}
                  fieldName={config.ui.fieldName}
                  summaryType={getSummaryType()}
                  hasChanges={assignmentChanges.hasChanges}
                  changeCount={assignmentChanges.changeCount}
                />

                {config.ui.searchSupported && (
                  <SearchField
                    value={searchValue}
                    onChange={handleSearchChange}
                    label={config.ui.searchPlaceholder || 'Search'}
                  />
                )}
              </SearchSummaryContainer>

              <TableWrapper>
                <AssignmentTable
                  items={items}
                  displayItems={filteredItems}
                  selectedItems={selectedItems}
                  onSelectionChange={handleToggleSelection}
                  onSelectAll={handleSelectAll}
                  loading={loading}
                  defaultExpanded={config.table.defaultExpanded}
                  hierarchicalSelection={config.table.hierarchicalSelection}
                  tableHeader={getTableHeader()}
                  emptyStateText={getNoItemsFoundText()}
                />
              </TableWrapper>

              {config.pagination.enabled && (
                <AssignmentPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={displayTotalCount}
                  pageSize={config.pagination.defaultPageSize}
                  summaryItems={getPaginationType()}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          )}
        </DrawerContent>

        <DrawerFooter>
          <FooterButtonsContainer>
            <Button
              onClick={handleSave}
              color="primary"
              disabled={!assignmentChanges.hasChanges || loading || !!loadError}
            >
              {getSaveButtonText()}
            </Button>
          </FooterButtonsContainer>
        </DrawerFooter>
      </Drawer>

      {/* Unsaved Changes Modal */}
      <UnsavedChangesModal
        open={showUnsavedModal}
        onSave={handleModalSave}
        onDontSave={handleModalDontSave}
        onClose={() => setShowUnsavedModal(false)}
      />
    </>
  );
};

export default AssignmentDrawer;

import React, { useState, useEffect } from 'react';
import { Table } from '@ids-ts/table';
import { Checkbox } from '@ids-ts/checkbox';
import { ChevronDown, ChevronUp } from '@design-systems/icons';
import { Activity } from '@ids-ts/loader';
import { AssignmentItem } from '../types';
import {
  StyledTable,
  ContentCell,
  ItemContent,
  ItemName,
  TransparentIconControl,
  LoadingContainer,
  EmptyMessageCell,
} from './AssignmentTable.styled';

interface AssignmentTableProps {
  items: AssignmentItem[]; // Full unfiltered list for sibling checking
  displayItems?: AssignmentItem[]; // Filtered list for rendering (optional, defaults to items)
  selectedItems: Set<number | string>;
  onSelectionChange: (id: number | string) => void;
  onSelectAll: () => void;
  loading?: boolean;
  defaultExpanded?: boolean; // New prop to control default expand state
  hierarchicalSelection?: boolean; // New prop to control hierarchical selection behavior
  tableHeader?: string; // NLS text for table header
  emptyStateText?: string; // NLS text for empty state
}

const AssignmentTable: React.FC<AssignmentTableProps> = ({
  items,
  displayItems,
  selectedItems,
  onSelectionChange,
  onSelectAll,
  loading = false,
  defaultExpanded = false, // Default to collapsed
  hierarchicalSelection = false, // Default to non-hierarchical
  tableHeader = 'Items', // Default header
  emptyStateText = 'No items found', // Default text
}) => {
  // Use displayItems for rendering if provided, otherwise fall back to items
  const itemsToRender = displayItems || items;
  // Initialize with all parent items expanded by default
  const [expandedItems, setExpandedItems] = useState<Set<number | string>>(
    new Set(),
  );

  // Set initial expand state based on defaultExpanded prop
  useEffect(() => {
    if (defaultExpanded) {
      // When defaultExpanded is true, expand ALL items that have children (levels 0, 1, 2, 3, and 4)
      const expandableIds = itemsToRender
        .filter((item) => item.hasChildren)
        .map((item) => item.id);
      setExpandedItems(new Set(expandableIds));
    } else {
      setExpandedItems(new Set());
    }
  }, [itemsToRender, defaultExpanded]);

  // Calculate if all current items are selected (excluding disabled items)
  const enabledItems = itemsToRender.filter((item) => !item.disabled);
  const allSelected =
    enabledItems.length > 0 &&
    enabledItems.every((item) => selectedItems.has(item.id));
  const someSelected = enabledItems.some((item) => selectedItems.has(item.id));

  const toggleExpanded = (itemId: number | string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Helper function to get all children of an item (direct children only)
  const getDirectChildren = (parentId: number | string): AssignmentItem[] =>
    items.filter((item) => item.parentId === parentId);

  // Helper function to get all descendants of an item (children, sub-children, sub-sub-children, and sub-sub-sub-children)
  const getAllDescendants = (parentId: number | string): AssignmentItem[] => {
    const descendants: AssignmentItem[] = [];
    const directChildren = getDirectChildren(parentId);

    descendants.push(...directChildren);

    // Get sub-children for each direct child
    directChildren.forEach((child) => {
      const subChildren = getDirectChildren(child.id);
      descendants.push(...subChildren);

      // Get sub-sub-children for each sub-child
      subChildren.forEach((subChild) => {
        const subSubChildren = getDirectChildren(subChild.id);
        descendants.push(...subSubChildren);

        // Get sub-sub-sub-children for each sub-sub-child (level 4)
        subSubChildren.forEach((subSubChild) => {
          descendants.push(...getDirectChildren(subSubChild.id));
        });
      });
    });

    return descendants;
  };

  // Helper function to determine checkbox state for hierarchical items
  const getCheckboxState = (
    item: AssignmentItem,
  ): { checked: boolean; indeterminate: boolean } => {
    // If hierarchical selection is disabled, just return the item's own selection state
    if (!hierarchicalSelection || !item.hasChildren) {
      return { checked: selectedItems.has(item.id), indeterminate: false };
    }

    // Get all descendants of this item (excluding disabled)
    const descendants = getAllDescendants(item.id).filter((d) => !d.disabled);

    if (descendants.length === 0) {
      return { checked: selectedItems.has(item.id), indeterminate: false };
    }

    const selectedDescendants = descendants.filter((descendant) =>
      selectedItems.has(descendant.id),
    );

    if (selectedDescendants.length === 0) {
      // No descendants selected
      return { checked: false, indeterminate: false };
    }
    if (selectedDescendants.length === descendants.length) {
      // All descendants selected
      return { checked: true, indeterminate: false };
    }
    // Some descendants selected
    return { checked: false, indeterminate: true };
  };

  // Helper function to handle hierarchical selection
  const handleHierarchicalSelection = (item: AssignmentItem) => {
    // If hierarchical selection is disabled, just toggle the item's own selection
    if (!hierarchicalSelection || !item.hasChildren) {
      const wasSelected = selectedItems.has(item.id);
      onSelectionChange(item.id);

      // Handle parent auto-selection/deselection for child items
      if (hierarchicalSelection && item.parentId) {
        const siblings = getDirectChildren(item.parentId).filter(
          (s) => !s.disabled,
        );

        if (wasSelected) {
          // Child was deselected - check if there are any other selected siblings
          const otherSelectedSiblings = siblings.filter(
            (sibling) =>
              sibling.id !== item.id && selectedItems.has(sibling.id),
          );

          // If no other siblings are selected, deselect parent too
          if (otherSelectedSiblings.length === 0) {
            if (selectedItems.has(item.parentId)) {
              onSelectionChange(item.parentId);
            }
          }
        } else {
          // Child was selected - check if ALL siblings are now selected
          const selectedSiblings = siblings.filter(
            (sibling) =>
              selectedItems.has(sibling.id) || sibling.id === item.id,
          );

          // If all siblings are now selected, select parent too
          if (selectedSiblings.length === siblings.length) {
            if (!selectedItems.has(item.parentId)) {
              onSelectionChange(item.parentId);
            }
          }
        }
      }

      return;
    }

    // For parent items with hierarchical selection enabled, determine what to do based on current state
    const descendants = getAllDescendants(item.id).filter((d) => !d.disabled);
    const selectedDescendants = descendants.filter((descendant) =>
      selectedItems.has(descendant.id),
    );

    if (selectedDescendants.length === descendants.length) {
      // All descendants are selected, so unselect all (including parent)
      descendants.forEach((descendant) => {
        if (selectedItems.has(descendant.id)) {
          onSelectionChange(descendant.id);
        }
      });
      // Also toggle parent itself if it's selected
      if (selectedItems.has(item.id)) {
        onSelectionChange(item.id);
      }
    } else {
      // Some or no descendants are selected, so select all (including parent)
      descendants.forEach((descendant) => {
        if (!selectedItems.has(descendant.id)) {
          onSelectionChange(descendant.id);
        }
      });
      // Also toggle parent itself if it's not selected
      if (!selectedItems.has(item.id)) {
        onSelectionChange(item.id);
      }
    }
  };

  // Helper function to render items in hierarchical order (supports up to 5 levels: 0, 1, 2, 3, 4)
  const renderItemsHierarchically = (
    items: AssignmentItem[],
  ): React.ReactNode[] => {
    const renderedItems: React.ReactNode[] = [];

    // First, render all parent items (level 0)
    const parentItems = items.filter((item) => item.level === 0);

    parentItems.forEach((parent) => {
      // Render the parent
      renderedItems.push(renderSingleItem(parent));

      // If parent is expanded, render its children
      if (expandedItems.has(parent.id)) {
        const children = items.filter(
          (item) => item.level === 1 && item.parentId === parent.id,
        );

        children.forEach((child) => {
          // Render the child
          renderedItems.push(renderSingleItem(child));

          // If child is expanded, render its sub-children
          if (expandedItems.has(child.id)) {
            const subChildren = items.filter(
              (item) => item.level === 2 && item.parentId === child.id,
            );
            subChildren.forEach((subChild) => {
              renderedItems.push(renderSingleItem(subChild));

              // If sub-child is expanded, render its sub-sub-children (level 3)
              if (expandedItems.has(subChild.id)) {
                const subSubChildren = items.filter(
                  (item) => item.level === 3 && item.parentId === subChild.id,
                );
                subSubChildren.forEach((subSubChild) => {
                  renderedItems.push(renderSingleItem(subSubChild));

                  // If sub-sub-child is expanded, render its sub-sub-sub-children (level 4)
                  if (expandedItems.has(subSubChild.id)) {
                    const subSubSubChildren = items.filter(
                      (item) =>
                        item.level === 4 && item.parentId === subSubChild.id,
                    );
                    subSubSubChildren.forEach((subSubSubChild) => {
                      renderedItems.push(renderSingleItem(subSubSubChild));
                    });
                  }
                });
              }
            });
          }
        });
      }
    });

    return renderedItems;
  };

  // Helper function to get child count for an item
  const getChildCount = (itemId: number | string): number =>
    itemsToRender.filter((item) => item.parentId === itemId).length;

  // Helper function to render a single item
  const renderSingleItem = (item: AssignmentItem): React.ReactNode => {
    const isExpanded = expandedItems.has(item.id);
    // Calculate indentation based on level (0 = 16px, 1 = 56px, 2 = 96px, 3 = 136px, 4 = 176px)
    const indentLevel = item.level * 40 + 16;

    // Get checkbox state (checked/indeterminate) based on hierarchical logic
    const checkboxState = getCheckboxState(item);

    return (
      <Table.Row key={item.id}>
        <ContentCell style={{ paddingLeft: `${indentLevel}px` }}>
          <Checkbox
            checked={checkboxState.checked}
            indeterminate={checkboxState.indeterminate}
            onChange={() => handleHierarchicalSelection(item)}
            size="small"
            aria-label={`Select ${item.name}`}
            disabled={item.disabled}
          >
            <ItemContent $indentLevel={0}>
              <ItemName>
                {item.name}
                {/* {item.hasChildren && ` (${getChildCount(item.id)})`} */}
              </ItemName>
              {item.hasChildren && (
                <TransparentIconControl
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    e.preventDefault();
                    toggleExpanded(item.id);
                  }}
                  size="small"
                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                >
                  {isExpanded ? <ChevronUp /> : <ChevronDown />}
                </TransparentIconControl>
              )}
            </ItemContent>
          </Checkbox>
        </ContentCell>
      </Table.Row>
    );
  };

  if (loading) {
    return (
      <LoadingContainer>
        <Activity size="large" shape="dots" />
      </LoadingContainer>
    );
  }

  return (
    <StyledTable
      hover="row"
      responsive="pin"
      divider="horizontal"
      density="roomy"
    >
      <Table.Header>
        <Table.Row>
          <ContentCell style={{ paddingLeft: '16px' }}>
            <Checkbox
              checked={allSelected}
              indeterminate={!allSelected && someSelected}
              onChange={onSelectAll}
              size="small"
              aria-label="Select all items"
              disabled={enabledItems.length === 0}
            >
              {tableHeader}
            </Checkbox>
          </ContentCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {itemsToRender.length === 0 ? (
          <Table.Row>
            <EmptyMessageCell>{emptyStateText}</EmptyMessageCell>
          </Table.Row>
        ) : (
          renderItemsHierarchically(itemsToRender)
        )}
      </Table.Body>
    </StyledTable>
  );
};

export default AssignmentTable;

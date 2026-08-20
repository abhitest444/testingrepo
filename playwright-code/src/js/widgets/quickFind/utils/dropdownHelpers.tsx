import React from 'react';

/**
 * Shared utility functions for QuickFind dropdown components
 */

/**
 * Highlights search text in a string by wrapping matches in <b> tags
 * @param text - The text to highlight
 * @param searchValue - The search value to highlight
 * @returns JSX elements with highlighted text
 */
export const highlightSearchText = (
  text: string | undefined,
  searchValue: string,
): string | JSX.Element[] => {
  if (!searchValue.trim() || !text) return text || '';

  // Escape special regex characters
  const regex = new RegExp(
    `(${searchValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
    'gi',
  );
  const parts = text.split(regex);

  return parts
    .filter((part) => part) // Filter out empty parts
    .map((part, i) =>
      regex.test(part) ? (
        // eslint-disable-next-line react/no-array-index-key
        <b key={`bold-${part}-${i}`} style={{ whiteSpace: 'pre' }}>
          {part}
        </b>
      ) : (
        // eslint-disable-next-line react/no-array-index-key
        <span key={`span-${part}-${i}`} style={{ whiteSpace: 'pre' }}>
          {part}
        </span>
      ),
    );
};

/**
 * Debounce helper to prevent excessive API calls during typing
 * Returns a cleanup function
 */
export const createDebouncedCallback = (
  callback: (value: string) => void,
  delay: number,
): ((value: string) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;

  return (value: string) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      callback(value);
    }, delay);
  };
};

/**
 * Builds a hierarchical tree structure from a flat list using parentId
 * @param items - Flat array of items with id and parentId
 * @returns Hierarchical tree structure
 */
export const buildHierarchy = <
  T extends { id: string; parentId?: string | null },
>(
  items: T[],
): Array<T & { children: any[] }> => {
  if (!items || items.length === 0) return [];

  const itemsMap = new Map<string, T & { children: any[] }>();
  const rootItems: Array<T & { children: any[] }> = [];

  // First pass: create all items with empty children array
  items.forEach((item) => {
    itemsMap.set(item.id, {
      ...item,
      children: [],
    });
  });

  // Second pass: build parent-child relationships.
  // Each node must appear under only one parent (first occurrence wins).
  // This avoids the same project showing under multiple customers when the API
  // returns duplicate edges for the same id with different parentIds (e.g. STE).
  const placedIds = new Set<string>();
  items.forEach((item) => {
    if (placedIds.has(item.id)) return;

    const itemWithChildren = itemsMap.get(item.id);
    if (!itemWithChildren) return;

    placedIds.add(item.id);

    if (!item.parentId) {
      // Items without parentId are root items
      rootItems.push(itemWithChildren);
    } else {
      // Find parent and add as child
      const parentItem = itemsMap.get(item.parentId);
      if (parentItem) {
        parentItem.children.push(itemWithChildren);
      } else {
        // Parent not found, treat as root item
        rootItems.push(itemWithChildren);
      }
    }
  });

  return rootItems;
};

/**
 * Extracts the direct parent name from a colon-separated fullName hierarchy string.
 * e.g. "Kucher Companies:NK Project" → "Kucher Companies"
 *      "Cus 1:Cus 2:Cus 3"     → "Cus 2"
 * Returns empty string when there is no parent segment (top-level item).
 * Mirrors qbo-quickfills-ui commonMappers.getParentName().
 */
export const getParentNameFromFullName = (fullName: string): string => {
  if (!fullName) return '';
  const parts = fullName.split(':');
  return parts.length > 1 ? parts[parts.length - 2] : '';
};

/**
 * Flattens a hierarchical tree structure while adding depth information
 * @param hierarchicalItems - Tree structure with children
 * @returns Flattened array with depth property
 */
export const flattenHierarchy = <T extends { children?: any[] }>(
  hierarchicalItems: T[],
): Array<T & { depth: number }> => {
  const result: Array<T & { depth: number }> = [];

  const flatten = (items: T[], depth = 0) => {
    items.forEach((item) => {
      const { children, ...itemWithoutChildren } = item as any;
      result.push({ ...itemWithoutChildren, depth });

      if (children && children.length > 0) {
        flatten(children, depth + 1);
      }
    });
  };

  flatten(hierarchicalItems);
  return result;
};

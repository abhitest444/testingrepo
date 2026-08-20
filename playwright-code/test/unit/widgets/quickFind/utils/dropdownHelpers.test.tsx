import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  highlightSearchText,
  buildHierarchy,
  flattenHierarchy,
  getParentNameFromFullName,
} from '../../../../../src/js/widgets/quickFind/utils/dropdownHelpers';

describe('dropdownHelpers', () => {
  describe('highlightSearchText', () => {
    it('should highlight matching text', () => {
      const result = highlightSearchText('John Employee', 'john');
      const { container } = render(<div>{result}</div>);

      const boldElement = container.querySelector('b');
      expect(boldElement).toHaveTextContent('John');
    });

    it('should handle case-insensitive matching', () => {
      const result = highlightSearchText('JANE VENDOR', 'vendor');
      const { container } = render(<div>{result}</div>);

      const boldElement = container.querySelector('b');
      expect(boldElement).toHaveTextContent('VENDOR');
    });

    it('should return original text when search is empty', () => {
      const result = highlightSearchText('John Employee', '');
      expect(result).toBe('John Employee');
    });

    it('should return empty string when text is undefined', () => {
      const result = highlightSearchText(undefined, 'search');
      expect(result).toBe('');
    });

    it('should handle multiple matches', () => {
      const result = highlightSearchText('Bob Bob Vendor', 'bob');
      const { container } = render(<div>{result}</div>);

      const boldElements = container.querySelectorAll('b');
      expect(boldElements).toHaveLength(2);
      boldElements.forEach((el) => {
        expect(el).toHaveTextContent('Bob');
      });
    });

    it('should escape special regex characters', () => {
      const result = highlightSearchText('Cost: $100 (USD)', '$100');
      const { container } = render(<div>{result}</div>);

      const boldElement = container.querySelector('b');
      expect(boldElement).toHaveTextContent('$100');
    });
  });

  describe('buildHierarchy', () => {
    it('should build hierarchy from flat list', () => {
      const flatList = [
        { id: '1', displayName: 'Customer1', parentId: null },
        { id: '2', displayName: 'Project1', parentId: '1' },
        { id: '3', displayName: 'Customer2', parentId: null },
      ];

      const hierarchy = buildHierarchy(flatList);

      expect(hierarchy).toHaveLength(2); // Two root items
      expect(hierarchy[0].id).toBe('1');
      expect(hierarchy[0].children).toHaveLength(1);
      expect(hierarchy[0].children[0].id).toBe('2');
      expect(hierarchy[1].id).toBe('3');
      expect(hierarchy[1].children).toHaveLength(0);
    });

    it('should handle multi-level hierarchy', () => {
      const flatList = [
        { id: '1', displayName: 'Root', parentId: null },
        { id: '2', displayName: 'Child1', parentId: '1' },
        { id: '3', displayName: 'Grandchild1', parentId: '2' },
      ];

      const hierarchy = buildHierarchy(flatList);

      expect(hierarchy).toHaveLength(1);
      expect(hierarchy[0].children).toHaveLength(1);
      expect(hierarchy[0].children[0].children).toHaveLength(1);
      expect(hierarchy[0].children[0].children[0].id).toBe('3');
    });

    it('should handle empty list', () => {
      const hierarchy = buildHierarchy([]);
      expect(hierarchy).toEqual([]);
    });

    it('should treat orphaned items as root items', () => {
      const flatList = [
        { id: '1', displayName: 'Customer1', parentId: null },
        { id: '2', displayName: 'Orphan', parentId: 'non-existent' },
      ];

      const hierarchy = buildHierarchy(flatList);

      expect(hierarchy).toHaveLength(2); // Both should be root items
      expect(hierarchy.find((item) => item.id === '2')).toBeDefined();
    });

    it('should preserve all properties from original items', () => {
      const flatList = [
        {
          id: '1',
          displayName: 'Customer1',
          fullName: 'Customer1',
          type: 'CUSTOMER',
          parentId: null,
          extraProp: 'test',
        },
      ];

      const hierarchy = buildHierarchy(flatList);

      expect(hierarchy[0]).toMatchObject({
        id: '1',
        displayName: 'Customer1',
        fullName: 'Customer1',
        type: 'CUSTOMER',
        extraProp: 'test',
      });
    });

    it('should place each node under only one parent when same id appears twice with different parentIds (first occurrence wins)', () => {
      // Simulates API returning same project under two customers (e.g. STE duplicate display bug)
      const flatList = [
        { id: '1', displayName: 'Real Builders', parentId: null },
        { id: '3', displayName: 'Intuit', parentId: null },
        {
          id: '7',
          displayName: 'Intuit Building 55 Construction',
          parentId: '3',
        },
        {
          id: '7',
          displayName: 'Intuit Building 55 Construction',
          parentId: '1',
        },
      ];

      const hierarchy = buildHierarchy(flatList);
      const flattened = flattenHierarchy(hierarchy);

      // Two roots
      expect(hierarchy).toHaveLength(2);
      // Node 7 should only be under first parent (Intuit, id 3)
      const root3 = hierarchy.find((r) => r.id === '3');
      const root1 = hierarchy.find((r) => r.id === '1');
      expect(root3?.children).toHaveLength(1);
      expect(root3?.children[0].id).toBe('7');
      expect(root1?.children).toHaveLength(0);
      // Flattened list should contain id 7 only once
      expect(flattened.filter((item) => item.id === '7')).toHaveLength(1);
    });
  });

  describe('flattenHierarchy', () => {
    it('should flatten hierarchy with depth information', () => {
      const hierarchicalList = [
        {
          id: '1',
          displayName: 'Customer1',
          children: [
            {
              id: '2',
              displayName: 'Project1',
              children: [],
            },
          ],
        },
      ];

      const flattened = flattenHierarchy(hierarchicalList);

      expect(flattened).toEqual([
        expect.objectContaining({ id: '1', depth: 0 }),
        expect.objectContaining({ id: '2', depth: 1 }),
      ]);
    });

    it('should handle multi-level depth', () => {
      const hierarchicalList = [
        {
          id: '1',
          displayName: 'Root',
          children: [
            {
              id: '2',
              displayName: 'Child',
              children: [
                {
                  id: '3',
                  displayName: 'Grandchild',
                  children: [],
                },
              ],
            },
          ],
        },
      ];

      const flattened = flattenHierarchy(hierarchicalList);

      expect(flattened).toEqual([
        expect.objectContaining({ id: '1', depth: 0 }),
        expect.objectContaining({ id: '2', depth: 1 }),
        expect.objectContaining({ id: '3', depth: 2 }),
      ]);
    });

    it('should handle empty hierarchy', () => {
      const flattened = flattenHierarchy([]);
      expect(flattened).toEqual([]);
    });

    it('should remove children property from flattened items', () => {
      const hierarchicalList = [
        {
          id: '1',
          displayName: 'Customer1',
          children: [{ id: '2', displayName: 'Project1', children: [] }],
        },
      ];

      const flattened = flattenHierarchy(hierarchicalList);

      flattened.forEach((item) => {
        expect(item).not.toHaveProperty('children');
      });
    });

    it('should preserve all other properties except children', () => {
      const hierarchicalList = [
        {
          id: '1',
          displayName: 'Customer1',
          fullName: 'Customer1',
          type: 'CUSTOMER',
          customProp: 'test',
          children: [],
        },
      ];

      const flattened = flattenHierarchy(hierarchicalList);

      expect(flattened[0]).toMatchObject({
        id: '1',
        displayName: 'Customer1',
        fullName: 'Customer1',
        type: 'CUSTOMER',
        customProp: 'test',
        depth: 0,
      });
    });

    it('should handle items with no children property', () => {
      const hierarchicalList = [
        {
          id: '1',
          displayName: 'Customer1',
        },
      ] as any;

      const flattened = flattenHierarchy(hierarchicalList);

      expect(flattened).toEqual([
        expect.objectContaining({ id: '1', depth: 0 }),
      ]);
    });
  });

  describe('getParentNameFromFullName', () => {
    it('returns parent name from a two-level fullName', () => {
      expect(getParentNameFromFullName('Kucher Companies:NK Project')).toBe(
        'Kucher Companies',
      );
    });

    it('returns direct parent (second-to-last) from a three-level fullName', () => {
      expect(getParentNameFromFullName('Customer 1:Cus 2:Cus 3')).toBe('Cus 2');
    });

    it('returns empty string for a top-level name with no colon', () => {
      expect(getParentNameFromFullName('Customer 1')).toBe('');
    });

    it('returns empty string for an empty string', () => {
      expect(getParentNameFromFullName('')).toBe('');
    });

    it('handles a project fullName matching the real API shape', () => {
      // From actual API response: "Kucher Companies:NK Project 2"
      expect(getParentNameFromFullName('Kucher Companies:NK Project 2')).toBe(
        'Kucher Companies',
      );
    });
  });

  describe('Integration: buildHierarchy + flattenHierarchy', () => {
    it('should correctly build and flatten complex hierarchy', () => {
      const flatList = [
        { id: '1', displayName: 'Customer1', parentId: null },
        { id: '2', displayName: 'SubCustomer1', parentId: '1' },
        { id: '3', displayName: 'Project1', parentId: '1' },
        { id: '4', displayName: 'SubProject1', parentId: '2' },
        { id: '5', displayName: 'Customer2', parentId: null },
      ];

      const hierarchy = buildHierarchy(flatList);
      const flattened = flattenHierarchy(hierarchy);

      // Should have all 5 items with correct depths
      expect(flattened).toHaveLength(5);

      // Verify order and depth
      expect(flattened[0]).toMatchObject({ id: '1', depth: 0 });
      expect(flattened[1]).toMatchObject({ id: '2', depth: 1 });
      expect(flattened[2]).toMatchObject({ id: '4', depth: 2 });
      expect(flattened[3]).toMatchObject({ id: '3', depth: 1 });
      expect(flattened[4]).toMatchObject({ id: '5', depth: 0 });
    });
  });
});

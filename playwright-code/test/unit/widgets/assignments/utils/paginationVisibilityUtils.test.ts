import {
  calculatePaginationVisibility,
  getPaginationStateDescription,
  PaginationVisibilityParams,
} from 'src/js/widgets/assignments/utils/paginationVisibilityUtils';

describe('paginationVisibilityUtils', () => {
  describe('calculatePaginationVisibility', () => {
    describe('Edit Mode - Default State (no search, no sort)', () => {
      const baseParams: PaginationVisibilityParams = {
        isEditMode: true,
        isLoading: false,
        searchTerm: '',
        isSorted: false,
        currentPageNumber: 1,
        drawerWorkersCount: 150,
        totalPagesForSelected: 0,
        pageInfo: undefined,
      };

      test.each([
        {
          description: 'should show Next on page 1 when workers > 100',
          overrides: {},
          expected: {
            canGoPrevious: false,
            canGoNext: true,
            showPagination: true,
          },
        },
        {
          description: 'should show both buttons on page 2',
          overrides: { currentPageNumber: 2 },
          expected: {
            canGoPrevious: true,
            canGoNext: false,
            showPagination: true,
          },
        },
        {
          description: 'should hide Next on last page',
          overrides: { drawerWorkersCount: 50, currentPageNumber: 1 },
          expected: {
            canGoPrevious: false,
            canGoNext: false,
            showPagination: false,
          },
        },
      ])('$description', ({ overrides, expected }) => {
        const result = calculatePaginationVisibility({
          ...baseParams,
          ...overrides,
        });
        expect(result.canGoPrevious).toBe(expected.canGoPrevious);
        expect(result.canGoNext).toBe(expected.canGoNext);
        expect(result.showPagination).toBe(expected.showPagination);
      });
    });

    describe('Edit Mode - Search State', () => {
      const baseParams: PaginationVisibilityParams = {
        isEditMode: true,
        isLoading: false,
        searchTerm: 'John',
        isSorted: false,
        currentPageNumber: 1,
        drawerWorkersCount: 150,
        totalPagesForSelected: 0,
        pageInfo: { hasNextPage: true, hasPreviousPage: false },
      };

      test.each([
        {
          description: 'should use API pagination when searching',
          overrides: {},
          expected: {
            canGoPrevious: false,
            canGoNext: true,
            showPagination: true,
          },
        },
        {
          description: 'should hide Next when API says no more pages',
          overrides: { pageInfo: { hasNextPage: false } },
          expected: {
            canGoPrevious: undefined,
            canGoNext: false,
            showPagination: false,
          },
        },
      ])('$description', ({ overrides, expected }) => {
        const result = calculatePaginationVisibility({
          ...baseParams,
          ...overrides,
        });
        if (expected.canGoPrevious !== undefined) {
          expect(result.canGoPrevious).toBe(expected.canGoPrevious);
        }
        expect(result.canGoNext).toBe(expected.canGoNext);
        expect(result.showPagination).toBe(expected.showPagination);
      });
    });

    describe('Edit Mode - Sort State', () => {
      const baseParams: PaginationVisibilityParams = {
        isEditMode: true,
        isLoading: false,
        searchTerm: '',
        isSorted: true,
        currentPageNumber: 1,
        drawerWorkersCount: 150,
        totalPagesForSelected: 0,
        pageInfo: { hasNextPage: true, hasPreviousPage: false },
      };

      test.each([
        {
          description: 'should use API pagination when sorted',
          overrides: {},
          expected: {
            canGoPrevious: false,
            canGoNext: true,
            showPagination: true,
          },
        },
        {
          description: 'should hide Next when API says no more pages',
          overrides: {
            currentPageNumber: 2,
            pageInfo: { hasNextPage: false, hasPreviousPage: true },
          },
          expected: {
            canGoPrevious: true,
            canGoNext: false,
            showPagination: true,
          },
        },
      ])('$description', ({ overrides, expected }) => {
        const result = calculatePaginationVisibility({
          ...baseParams,
          ...overrides,
        });
        expect(result.canGoPrevious).toBe(expected.canGoPrevious);
        expect(result.canGoNext).toBe(expected.canGoNext);
        expect(result.showPagination).toBe(expected.showPagination);
      });
    });

    describe('Create Mode - Hybrid Pagination', () => {
      const baseParams: PaginationVisibilityParams = {
        isEditMode: false,
        isLoading: false,
        searchTerm: '',
        isSorted: false,
        currentPageNumber: 1,
        drawerWorkersCount: 0,
        totalPagesForSelected: 2,
        pageInfo: { hasNextPage: true, hasPreviousPage: false },
      };

      test.each([
        {
          description: 'should show Next when on selected pages',
          overrides: {},
          expected: {
            canGoPrevious: false,
            canGoNext: true,
            showPagination: true,
          },
        },
        {
          description:
            'should show Next when past selected pages and API has more',
          overrides: { currentPageNumber: 3, pageInfo: { hasNextPage: true } },
          expected: {
            canGoPrevious: true,
            canGoNext: true,
            showPagination: true,
          },
        },
        {
          description: 'should hide Next when past selected and no API pages',
          overrides: { currentPageNumber: 3, pageInfo: { hasNextPage: false } },
          expected: {
            canGoPrevious: true,
            canGoNext: false,
            showPagination: true,
          },
        },
        {
          description: 'should handle undefined pageInfo gracefully',
          overrides: { currentPageNumber: 2, pageInfo: undefined },
          expected: {
            canGoPrevious: true,
            canGoNext: false,
            showPagination: true,
          },
        },
      ])('$description', ({ overrides, expected }) => {
        const result = calculatePaginationVisibility({
          ...baseParams,
          ...overrides,
        });
        expect(result.canGoPrevious).toBe(expected.canGoPrevious);
        expect(result.canGoNext).toBe(expected.canGoNext);
        expect(result.showPagination).toBe(expected.showPagination);
      });
    });

    describe('Loading State', () => {
      it('should hide both buttons when loading', () => {
        const result = calculatePaginationVisibility({
          isEditMode: true,
          isLoading: true,
          searchTerm: '',
          isSorted: false,
          currentPageNumber: 2,
          drawerWorkersCount: 150,
          totalPagesForSelected: 0,
          pageInfo: { hasNextPage: true },
        });

        expect(result.canGoPrevious).toBe(false); // Loading disables Previous
        expect(result.canGoNext).toBe(false); // Loading disables Next
        expect(result.showPagination).toBe(false);
      });
    });
  });

  describe('getPaginationStateDescription', () => {
    test.each([
      {
        description:
          'should return correct description for Edit mode default state',
        params: {
          isEditMode: true,
          isLoading: false,
          searchTerm: '',
          isSorted: false,
          currentPageNumber: 1,
          drawerWorkersCount: 150,
          totalPagesForSelected: 0,
        },
        expected: 'Edit Mode | Default | Page 1',
      },
      {
        description:
          'should return correct description for Edit mode searching',
        params: {
          isEditMode: true,
          isLoading: false,
          searchTerm: 'John',
          isSorted: false,
          currentPageNumber: 2,
          drawerWorkersCount: 150,
          totalPagesForSelected: 0,
        },
        expected: 'Edit Mode | Searching | Page 2',
      },
      {
        description: 'should return correct description for Edit mode sorted',
        params: {
          isEditMode: true,
          isLoading: false,
          searchTerm: '',
          isSorted: true,
          currentPageNumber: 3,
          drawerWorkersCount: 150,
          totalPagesForSelected: 0,
        },
        expected: 'Edit Mode | Sorted | Page 3',
      },
      {
        description: 'should return correct description for Create mode',
        params: {
          isEditMode: false,
          isLoading: false,
          searchTerm: '',
          isSorted: false,
          currentPageNumber: 1,
          drawerWorkersCount: 0,
          totalPagesForSelected: 2,
        },
        expected: 'Create Mode | Default | Page 1',
      },
    ])('$description', ({ params, expected }) => {
      const description = getPaginationStateDescription(params);
      expect(description).toBe(expected);
    });
  });
});

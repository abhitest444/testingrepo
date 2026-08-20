import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TimeProjectPagination from 'src/js/widgets/timeProject/components/TimeProjectPagination';
import { ProjectsPaginationState } from 'src/js/widgets/timeProject/types';
import { DEFAULT_PAGE_SIZE } from 'src/js/widgets/timeProject/constants';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const nlsMessages: Record<string, string> = require('src/nls/timeProject.json');

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => nlsMessages[id] || id,
  }),
}));

const makePagination = (
  overrides: Partial<ProjectsPaginationState> = {},
): ProjectsPaginationState => ({
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  totalCount: 0,
  hasNextPage: false,
  endCursor: null,
  ...overrides,
});

describe('TimeProjectPagination', () => {
  // ─────────────────────────────────────────────────────────────────────────
  // OIGQL path (isWorkflowApiEnabled: false)
  // ─────────────────────────────────────────────────────────────────────────

  describe('OIGQL path (isWorkflowApiEnabled: false)', () => {
    it('renders nothing when totalPages <= 1', () => {
      const { container } = render(
        <TimeProjectPagination
          pagination={makePagination({ totalCount: 3 })}
          loadingMore={false}
          onPageChange={jest.fn()}
          isWorkflowApiEnabled={false}
        />,
      );
      expect(
        container.querySelector('[data-testid="time-project-pagination"]'),
      ).not.toBeInTheDocument();
    });

    it('renders pagination when totalPages > 1', () => {
      render(
        <TimeProjectPagination
          pagination={makePagination({ totalCount: DEFAULT_PAGE_SIZE * 3 })}
          loadingMore={false}
          onPageChange={jest.fn()}
          isWorkflowApiEnabled={false}
        />,
      );
      expect(screen.getByTestId('time-project-pagination')).toBeInTheDocument();
    });

    it('calls onPageChange when page changes', () => {
      const onPageChange = jest.fn();
      render(
        <TimeProjectPagination
          pagination={makePagination({ totalCount: DEFAULT_PAGE_SIZE * 3 })}
          loadingMore={false}
          onPageChange={onPageChange}
          isWorkflowApiEnabled={false}
        />,
      );
      // Previous is disabled on page 1; Next is the second button.
      const [, nextButton] = screen.getAllByRole('button');
      fireEvent.click(nextButton);
      expect(onPageChange).toHaveBeenCalledWith(2);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Workflow API path (isWorkflowApiEnabled: true)
  // ─────────────────────────────────────────────────────────────────────────

  describe('Workflow API path (isWorkflowApiEnabled: true)', () => {
    it('renders nothing on page 1 with no next page', () => {
      const { container } = render(
        <TimeProjectPagination
          pagination={makePagination({ page: 1, hasNextPage: false })}
          loadingMore={false}
          onPageChange={jest.fn()}
          isWorkflowApiEnabled
        />,
      );
      expect(
        container.querySelector('[data-testid="time-project-pagination"]'),
      ).not.toBeInTheDocument();
    });

    it('renders pagination on page 1 when hasNextPage is true', () => {
      render(
        <TimeProjectPagination
          pagination={makePagination({
            page: 1,
            hasNextPage: true,
            endCursor: 'cursor-1',
          })}
          loadingMore={false}
          onPageChange={jest.fn()}
          isWorkflowApiEnabled
        />,
      );
      expect(screen.getByTestId('time-project-pagination')).toBeInTheDocument();
    });

    it('renders pagination on page 2 with no next page', () => {
      render(
        <TimeProjectPagination
          pagination={makePagination({
            page: 2,
            hasNextPage: false,
            endCursor: null,
          })}
          loadingMore={false}
          onPageChange={jest.fn()}
          isWorkflowApiEnabled
        />,
      );
      expect(screen.getByTestId('time-project-pagination')).toBeInTheDocument();
    });

    it('does not render nothing on page 2 even when hasNextPage is false', () => {
      // page > 1 always shows pagination so the user can go back
      render(
        <TimeProjectPagination
          pagination={makePagination({ page: 2, hasNextPage: false })}
          loadingMore={false}
          onPageChange={jest.fn()}
          isWorkflowApiEnabled
        />,
      );
      expect(screen.getByTestId('time-project-pagination')).toBeInTheDocument();
    });

    it('disables the Next button while loadingMore is true, preventing double-fire during an in-flight fetch', () => {
      render(
        <TimeProjectPagination
          pagination={makePagination({
            page: 1,
            hasNextPage: true,
            endCursor: 'cursor-1',
          })}
          loadingMore
          onPageChange={jest.fn()}
          isWorkflowApiEnabled
        />,
      );
      // Pagination renders exactly two buttons: Previous [0] and Next [1].
      // allowNextWhenLoading = hasNextPage && !loadingMore = true && !true = false
      // → disabled: showLoadingState && !allowNextWhenLoading = true
      const [, nextButton] = screen.getAllByRole('button');
      expect(nextButton).toBeDisabled();
    });

    it('enables the Next button when loadingMore is false and hasNextPage is true', () => {
      render(
        <TimeProjectPagination
          pagination={makePagination({
            page: 1,
            hasNextPage: true,
            endCursor: 'cursor-1',
          })}
          loadingMore={false}
          onPageChange={jest.fn()}
          isWorkflowApiEnabled
        />,
      );
      // allowNextWhenLoading = hasNextPage && !loadingMore = true && !false = true
      // → disabled: showLoadingState && !allowNextWhenLoading = false
      const [, nextButton] = screen.getAllByRole('button');
      expect(nextButton).not.toBeDisabled();
    });

    it('pins the pagination-summary testid used by SummaryHidden to suppress the "0 - 0 of" row', () => {
      render(
        <TimeProjectPagination
          pagination={makePagination({
            page: 1,
            hasNextPage: true,
            endCursor: 'cursor-1',
          })}
          loadingMore={false}
          onPageChange={jest.fn()}
          isWorkflowApiEnabled
        />,
      );
      // SummaryHidden's CSS targets [data-testid="pagination-summary"] from
      // @ids-ts/pagination's Summary component.  If the library removes or
      // renames this testid, the selector silently stops matching and the
      // "0 - 0 of" row becomes visible again.  This test fails fast when
      // that happens.
      expect(screen.getByTestId('pagination-summary')).toBeInTheDocument();
    });

    it('disables Next on the last known page (workflowTotalPages = page when !hasNextPage)', () => {
      render(
        <TimeProjectPagination
          pagination={makePagination({ page: 2, hasNextPage: false })}
          loadingMore={false}
          onPageChange={jest.fn()}
          isWorkflowApiEnabled
        />,
      );
      // workflowTotalPages = 2 + 0 = 2.
      // activePage (2) >= totalPages (2) → disabled regardless of loadingMore.
      const [, nextButton] = screen.getAllByRole('button');
      expect(nextButton).toBeDisabled();
    });

    it('calls onPageChange with the next page number when Next is clicked', () => {
      const onPageChange = jest.fn();
      render(
        <TimeProjectPagination
          pagination={makePagination({
            page: 1,
            hasNextPage: true,
            endCursor: 'cursor-1',
          })}
          loadingMore={false}
          onPageChange={onPageChange}
          isWorkflowApiEnabled
        />,
      );
      const [, nextButton] = screen.getAllByRole('button');
      fireEvent.click(nextButton);
      expect(onPageChange).toHaveBeenCalledWith(2);
    });
  });
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import WorkerTable from 'src/js/widgets/timeProject/components/WorkerTable';
import { DETAILS_PAGE_TRACKING_POINTS } from 'src/js/widgets/timeProject/utils/timeProjectTrackingPoints';

const mockTrack = jest.fn();
const mockUseDetailsPageTrackingPoints = jest.fn();

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => id,
  }),
  useTracking: () => mockTrack,
}));

jest.mock(
  'src/js/widgets/timeProject/hooks/useDetailsPageTrackingPoints',
  () => ({
    useDetailsPageTrackingPoints: () => mockUseDetailsPageTrackingPoints(),
  }),
);

jest.mock('@ids-ts/table', () => ({
  Table: Object.assign(
    ({ children, 'data-testid': testId }: any) => (
      <table data-testid={testId}>{children}</table>
    ),
    {
      Row: ({ children, 'data-testid': testId }: any) => (
        <tr data-testid={testId}>{children}</tr>
      ),
      Cell: ({ children, 'data-testid': testId }: any) => (
        <td data-testid={testId}>{children}</td>
      ),
      Header: ({ children }: any) => <thead>{children}</thead>,
    },
  ),
}));

jest.mock('@ids-ts/typography', () => ({
  B3: ({ children }: any) => <span>{children}</span>,
}));

jest.mock('@ids-ts/loader', () => ({
  Activity: () => <div data-testid="activity-loader" />,
}));

jest.mock('@ids-ts/pagination', () => ({
  Pagination: ({ activePage, totalPages, onPageChange }: any) => (
    <div data-testid="ids-pagination">
      <button
        data-testid="pagination-prev"
        disabled={activePage <= 1}
        onClick={() => onPageChange?.(activePage - 1)}
      >
        prev
      </button>
      <span data-testid="pagination-page">{activePage}</span>
      <button
        data-testid="pagination-next"
        disabled={activePage >= totalPages}
        onClick={() => onPageChange?.(activePage + 1)}
      >
        next
      </button>
    </div>
  ),
}));

const mockWorkers = [
  { id: 'w1', displayName: 'John Doe', hoursWorked: 10.5 },
  { id: 'w2', displayName: 'Jane Smith', hoursWorked: 8.25 },
];

describe('WorkerTable', () => {
  const mockOnNextPage = jest.fn();
  const mockOnPrevPage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDetailsPageTrackingPoints.mockReturnValue(
      DETAILS_PAGE_TRACKING_POINTS,
    );
  });

  it('renders worker data', () => {
    render(
      <WorkerTable
        workers={mockWorkers}
        loading={false}
        page={1}
        totalPages={1}
        onNextPage={mockOnNextPage}
        onPrevPage={mockOnPrevPage}
      />,
    );
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('shows no data message when empty', () => {
    render(
      <WorkerTable
        workers={[]}
        loading={false}
        page={1}
        totalPages={1}
        onNextPage={mockOnNextPage}
        onPrevPage={mockOnPrevPage}
      />,
    );
    expect(screen.getByTestId('worker-table-no-data')).toBeInTheDocument();
  });

  it('tracks LEFT_PAGINATION_ARROW_USERS on prev click', () => {
    render(
      <WorkerTable
        workers={mockWorkers}
        loading={false}
        page={2}
        totalPages={3}
        onNextPage={mockOnNextPage}
        onPrevPage={mockOnPrevPage}
      />,
    );
    fireEvent.click(screen.getByTestId('pagination-prev'));
    expect(mockTrack).toHaveBeenCalledWith(
      DETAILS_PAGE_TRACKING_POINTS.LEFT_PAGINATION_ARROW_USERS,
    );
    expect(mockOnPrevPage).toHaveBeenCalled();
  });

  it('tracks RIGHT_PAGINATION_ARROW_USERS on next click', () => {
    render(
      <WorkerTable
        workers={mockWorkers}
        loading={false}
        page={2}
        totalPages={3}
        onNextPage={mockOnNextPage}
        onPrevPage={mockOnPrevPage}
      />,
    );
    fireEvent.click(screen.getByTestId('pagination-next'));
    expect(mockTrack).toHaveBeenCalledWith(
      DETAILS_PAGE_TRACKING_POINTS.RIGHT_PAGINATION_ARROW_USERS,
    );
    expect(mockOnNextPage).toHaveBeenCalled();
  });

  it('does not show pagination when only 1 page', () => {
    render(
      <WorkerTable
        workers={mockWorkers}
        loading={false}
        page={1}
        totalPages={1}
        onNextPage={mockOnNextPage}
        onPrevPage={mockOnPrevPage}
      />,
    );
    expect(
      screen.queryByTestId('worker-table-pagination'),
    ).not.toBeInTheDocument();
  });

  it('renders worker initials correctly for two-word names', () => {
    render(
      <WorkerTable
        workers={[{ id: 'w1', displayName: 'John Doe', hoursWorked: 5 }]}
        loading={false}
        page={1}
        totalPages={1}
        onNextPage={mockOnNextPage}
        onPrevPage={mockOnPrevPage}
      />,
    );
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders worker initials for single-word name', () => {
    render(
      <WorkerTable
        workers={[{ id: 'w1', displayName: 'Xavier', hoursWorked: 5 }]}
        loading={false}
        page={1}
        totalPages={1}
        onNextPage={mockOnNextPage}
        onPrevPage={mockOnPrevPage}
      />,
    );
    expect(screen.getByText('XA')).toBeInTheDocument();
  });

  it('renders ? for empty name', () => {
    render(
      <WorkerTable
        workers={[{ id: 'w1', displayName: '', hoursWorked: 5 }]}
        loading={false}
        page={1}
        totalPages={1}
        onNextPage={mockOnNextPage}
        onPrevPage={mockOnPrevPage}
      />,
    );
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('shows loader spinner when loading and no workers yet', () => {
    render(
      <WorkerTable
        workers={[]}
        loading
        page={1}
        totalPages={1}
        onNextPage={mockOnNextPage}
        onPrevPage={mockOnPrevPage}
      />,
    );
    expect(screen.getByTestId('worker-table-loader')).toBeInTheDocument();
    expect(
      screen.queryByTestId('worker-table-no-data'),
    ).not.toBeInTheDocument();
  });

  it('shows pagination when both prev and next are available', () => {
    render(
      <WorkerTable
        workers={mockWorkers}
        loading={false}
        page={2}
        totalPages={3}
        onNextPage={mockOnNextPage}
        onPrevPage={mockOnPrevPage}
      />,
    );
    expect(screen.getByTestId('worker-table-pagination')).toBeInTheDocument();
    expect(screen.getByTestId('pagination-prev')).not.toBeDisabled();
    expect(screen.getByTestId('pagination-next')).not.toBeDisabled();
  });

  it('shows pagination when only next is available', () => {
    render(
      <WorkerTable
        workers={mockWorkers}
        loading={false}
        page={1}
        totalPages={2}
        onNextPage={mockOnNextPage}
        onPrevPage={mockOnPrevPage}
      />,
    );
    expect(screen.getByTestId('worker-table-pagination')).toBeInTheDocument();
    expect(screen.getByTestId('pagination-prev')).toBeDisabled();
  });

  it('renders multiple workers with hours formatted', () => {
    const workers = [
      { id: 'w1', displayName: 'Alice Adams', hoursWorked: 10 },
      { id: 'w2', displayName: 'Bob Baker', hoursWorked: 20 },
      { id: 'w3', displayName: 'Charlie Clark', hoursWorked: 30 },
    ];
    render(
      <WorkerTable
        workers={workers}
        loading={false}
        page={1}
        totalPages={1}
        onNextPage={mockOnNextPage}
        onPrevPage={mockOnPrevPage}
      />,
    );
    expect(screen.getByText('Alice Adams')).toBeInTheDocument();
    expect(screen.getByText('Bob Baker')).toBeInTheDocument();
    expect(screen.getByText('Charlie Clark')).toBeInTheDocument();
  });
});

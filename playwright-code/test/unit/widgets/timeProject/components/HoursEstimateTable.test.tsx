import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import HoursEstimateTable, {
  buildHoursMetrics,
} from 'src/js/widgets/timeProject/components/HoursEstimateTable';
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

const mockEstimate = {
  projectEstimateType: 'TOTAL_HOURS' as const,
  budgetHoursTotal: 40,
  budgetHoursRemaining: 30,
  elapsedSeconds: 36000, // 10h
  totalEstimatedSeconds: 144000,
  fieldType: null,
  fieldRef: null,
  estimateItems: [],
};

describe('HoursEstimateTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDetailsPageTrackingPoints.mockReturnValue(
      DETAILS_PAGE_TRACKING_POINTS,
    );
  });

  it('renders a single row with the totalHours label', () => {
    render(<HoursEstimateTable estimate={mockEstimate as any} />);
    expect(screen.getByTestId('hours-estimate-table')).toBeInTheDocument();
    expect(screen.getByTestId('hours-estimate-row')).toBeInTheDocument();
    // The label appears both in the header (column title) and in the row's
    // first cell, so we expect at least 2 occurrences.
    expect(
      screen.getAllByText('timeProject.summary.hoursEstimateTable.totalHours')
        .length,
    ).toBeGreaterThanOrEqual(2);
  });

  it('shows formatted estimated/worked/remaining values and percent complete', () => {
    render(<HoursEstimateTable estimate={mockEstimate as any} />);
    expect(screen.getByText('40.00')).toBeInTheDocument(); // estimated
    expect(screen.getByText('10.00')).toBeInTheDocument(); // worked
    expect(screen.getByText('30.00')).toBeInTheDocument(); // remaining
    expect(screen.getByText('25.0%')).toBeInTheDocument(); // 10/40
  });

  it('invokes onViewWorkers and tracks VIEW_WORKERS when the action is clicked', () => {
    const onViewWorkers = jest.fn();
    render(
      <HoursEstimateTable
        estimate={mockEstimate as any}
        onViewWorkers={onViewWorkers}
      />,
    );
    fireEvent.click(screen.getByTestId('hours-estimate-view-workers'));
    expect(mockTrack).toHaveBeenCalledWith(
      DETAILS_PAGE_TRACKING_POINTS.VIEW_WORKERS,
    );
    expect(onViewWorkers).toHaveBeenCalledTimes(1);
  });

  it('does not throw when onViewWorkers is not supplied', () => {
    render(<HoursEstimateTable estimate={mockEstimate as any} />);
    fireEvent.click(screen.getByTestId('hours-estimate-view-workers'));
    expect(mockTrack).toHaveBeenCalledWith(
      DETAILS_PAGE_TRACKING_POINTS.VIEW_WORKERS,
    );
  });

  describe('buildHoursMetrics', () => {
    it('derives metrics from budgetHoursTotal and elapsedSeconds', () => {
      const metrics = buildHoursMetrics(mockEstimate as any);
      expect(metrics.estimatedHours).toBe(40);
      expect(metrics.hoursWorked).toBe(10);
      expect(metrics.percentCompleted).toBe(25);
      expect(metrics.hoursRemaining).toBe(30);
    });

    it('clamps hoursRemaining to 0 when over budget and reports >100%', () => {
      const overdue = {
        ...mockEstimate,
        budgetHoursTotal: 10,
        elapsedSeconds: 54000, // 15h
      };
      const metrics = buildHoursMetrics(overdue as any);
      expect(metrics.hoursWorked).toBe(15);
      expect(metrics.percentCompleted).toBe(150);
      expect(metrics.hoursRemaining).toBe(0);
    });

    it('returns 0% when estimatedHours is zero (no divide-by-zero)', () => {
      const zero = {
        ...mockEstimate,
        budgetHoursTotal: 0,
        elapsedSeconds: 7200,
      };
      const metrics = buildHoursMetrics(zero as any);
      expect(metrics.estimatedHours).toBe(0);
      expect(metrics.hoursWorked).toBe(2);
      expect(metrics.percentCompleted).toBe(0);
      expect(metrics.hoursRemaining).toBe(0);
    });

    it('treats missing elapsedSeconds as 0', () => {
      const noElapsed = {
        ...mockEstimate,
        elapsedSeconds: undefined,
      };
      const metrics = buildHoursMetrics(noElapsed as any);
      expect(metrics.hoursWorked).toBe(0);
      expect(metrics.percentCompleted).toBe(0);
      expect(metrics.hoursRemaining).toBe(40);
    });
  });
});

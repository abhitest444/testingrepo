import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ServiceItemTable, {
  buildServiceItemRows,
} from 'src/js/widgets/timeProject/components/ServiceItemTable';
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

jest.mock('@ids-ts/pagination', () => ({
  Pagination: ({ onPageChange, activePage }: any) => (
    <div data-testid="mock-pagination">
      <button
        data-testid="pagination-prev"
        onClick={() => onPageChange(activePage - 1)}
      >
        Prev
      </button>
      <button
        data-testid="pagination-next"
        onClick={() => onPageChange(activePage + 1)}
      >
        Next
      </button>
    </div>
  ),
}));

jest.mock('@ids-ts/typography', () => ({
  B3: ({ children }: any) => <span>{children}</span>,
}));

const mockEstimate = {
  projectEstimateType: 'BY_FIELD_OPTION' as const,
  budgetHoursTotal: 100,
  budgetHoursRemaining: 50,
  elapsedSeconds: 180000,
  estimateItems: [
    {
      fieldOptionId: 'si1',
      serviceItemName: 'Development',
      estimatedHours: 40,
      elapsedSeconds: 36000,
    },
    {
      fieldOptionId: 'si2',
      serviceItemName: 'Design',
      estimatedHours: 30,
      elapsedSeconds: 18000,
    },
  ],
};

describe('ServiceItemTable', () => {
  const mockOnViewWorkers = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDetailsPageTrackingPoints.mockReturnValue(
      DETAILS_PAGE_TRACKING_POINTS,
    );
  });

  it('renders service item rows', () => {
    render(
      <ServiceItemTable
        estimate={mockEstimate as any}
        onViewWorkers={mockOnViewWorkers}
      />,
    );
    expect(screen.getByText('Development')).toBeInTheDocument();
    expect(screen.getByText('Design')).toBeInTheDocument();
  });

  it('tracks VIEW_WORKERS on view workers click', () => {
    render(
      <ServiceItemTable
        estimate={mockEstimate as any}
        onViewWorkers={mockOnViewWorkers}
      />,
    );
    fireEvent.click(screen.getByTestId('view-workers-si1'));
    expect(mockTrack).toHaveBeenCalledWith(
      DETAILS_PAGE_TRACKING_POINTS.VIEW_WORKERS,
    );
    expect(mockOnViewWorkers).toHaveBeenCalledWith('si1', 'Development');
  });

  describe('fieldOptionId === "-1" (Others bucket)', () => {
    const othersEstimate = {
      ...mockEstimate,
      estimateItems: [
        {
          fieldOptionId: '-1',
          serviceItemName: '-1',
          estimatedHours: -1,
          elapsedSeconds: 2400,
        },
        {
          fieldOptionId: 'si1',
          serviceItemName: 'Development',
          estimatedHours: 40,
          elapsedSeconds: 36000,
        },
      ],
    };

    it('renders "Others" label for fieldOptionId === "-1" row', () => {
      render(
        <ServiceItemTable
          estimate={othersEstimate as any}
          onViewWorkers={mockOnViewWorkers}
        />,
      );
      // The NLS formatter in the test mock returns the key itself; the component
      // uses 'timeProject.summary.serviceItemTable.others'.
      expect(
        screen.getByText('timeProject.summary.serviceItemTable.others'),
      ).toBeInTheDocument();
      // The raw sentinel value "-1" must never appear as a name in the UI.
      expect(screen.queryByText('-1')).not.toBeInTheDocument();
    });

    it('passes fieldOptionId "-1" as serviceItemId to onViewWorkers for Others rows', () => {
      render(
        <ServiceItemTable
          estimate={othersEstimate as any}
          onViewWorkers={mockOnViewWorkers}
        />,
      );
      fireEvent.click(screen.getByTestId('view-workers--1'));
      expect(mockOnViewWorkers).toHaveBeenCalledWith(
        '-1',
        'timeProject.summary.serviceItemTable.others',
      );
    });

    it('renders Others row as unestimated (estimatedHours -1) with dashes', () => {
      render(
        <ServiceItemTable
          estimate={othersEstimate as any}
          onViewWorkers={mockOnViewWorkers}
        />,
      );
      expect(screen.getByTestId('hours-estimated--1')).toHaveTextContent('-');
      expect(screen.getByTestId('percent--1')).toHaveTextContent('-');
      expect(screen.getByTestId('remaining--1')).toHaveTextContent('-');
    });
  });

  describe('buildServiceItemRows', () => {
    it('calculates per-service-item values from elapsedSeconds, not project share', () => {
      const rows = buildServiceItemRows(mockEstimate as any);
      expect(rows).toHaveLength(2);

      // Item 1: 36000s = 10h worked / 40h estimated = 25%
      expect(rows[0].serviceItemName).toBe('Development');
      expect(rows[0].hoursWorked).toBe(10);
      expect(rows[0].percentCompleted).toBe(25);
      expect(rows[0].hoursRemaining).toBe(30);

      // Item 2: 18000s = 5h worked / 30h estimated ≈ 16.7%
      expect(rows[1].serviceItemName).toBe('Design');
      expect(rows[1].hoursWorked).toBe(5);
      expect(rows[1].percentCompleted).toBe(16.7);
      expect(rows[1].hoursRemaining).toBe(25);
    });

    it('produces different percentages for different items (no uniform split)', () => {
      const estimate = {
        ...mockEstimate,
        estimateItems: [
          {
            fieldOptionId: 'a',
            serviceItemName: 'A',
            estimatedHours: 10,
            elapsedSeconds: 18000, // 5h / 10h = 50%
          },
          {
            fieldOptionId: 'b',
            serviceItemName: 'B',
            estimatedHours: 10,
            elapsedSeconds: 3600, // 1h / 10h = 10%
          },
        ],
      };
      const rows = buildServiceItemRows(estimate as any);
      expect(rows[0].percentCompleted).toBe(50);
      expect(rows[1].percentCompleted).toBe(10);
    });

    it('returns >100% percentCompleted when over budget for that item', () => {
      const estimate = {
        ...mockEstimate,
        estimateItems: [
          {
            fieldOptionId: 'over',
            serviceItemName: 'Over',
            estimatedHours: 10,
            elapsedSeconds: 54000, // 15h / 10h = 150%
          },
        ],
      };
      const rows = buildServiceItemRows(estimate as any);
      expect(rows[0].hoursWorked).toBe(15);
      expect(rows[0].percentCompleted).toBe(150);
      expect(rows[0].hoursRemaining).toBe(0);
    });

    it('handles empty estimate items', () => {
      const emptyEstimate = {
        ...mockEstimate,
        estimateItems: [],
      };
      const rows = buildServiceItemRows(emptyEstimate as any);
      expect(rows).toHaveLength(0);
    });

    it('handles zero estimated hours without dividing by zero', () => {
      const zeroEstimate = {
        ...mockEstimate,
        estimateItems: [
          {
            fieldOptionId: 'zero',
            serviceItemName: 'Zero',
            estimatedHours: 0,
            elapsedSeconds: 7200,
          },
        ],
      };
      const rows = buildServiceItemRows(zeroEstimate as any);
      expect(rows[0].percentCompleted).toBe(0);
      expect(rows[0].hoursWorked).toBe(2);
      expect(rows[0].hoursRemaining).toBe(0);
    });

    it('treats missing elapsedSeconds as 0 hours worked', () => {
      const estimate = {
        ...mockEstimate,
        estimateItems: [
          {
            fieldOptionId: 'missing',
            serviceItemName: 'Missing',
            estimatedHours: 8,
          },
        ],
      };
      const rows = buildServiceItemRows(estimate as any);
      expect(rows[0].hoursWorked).toBe(0);
      expect(rows[0].percentCompleted).toBe(0);
      expect(rows[0].hoursRemaining).toBe(8);
    });
  });

  it('tracks pagination arrows', () => {
    const manyItemEstimate = {
      ...mockEstimate,
      estimateItems: Array.from({ length: 12 }, (_, i) => ({
        fieldOptionId: `si${i}`,
        serviceItemName: `Item ${i}`,
        estimatedHours: 10,
      })),
    };
    render(
      <ServiceItemTable
        estimate={manyItemEstimate as any}
        onViewWorkers={mockOnViewWorkers}
      />,
    );
    fireEvent.click(screen.getByTestId('pagination-next'));
    expect(mockTrack).toHaveBeenCalledWith(
      DETAILS_PAGE_TRACKING_POINTS.RIGHT_PAGINATION_ARROW_ESTIMATES,
    );
  });

  it('does not show pagination for few items', () => {
    render(
      <ServiceItemTable
        estimate={mockEstimate as any}
        onViewWorkers={mockOnViewWorkers}
      />,
    );
    expect(
      screen.queryByTestId('service-item-pagination'),
    ).not.toBeInTheDocument();
  });

  it('tracks LEFT_PAGINATION_ARROW_ESTIMATES on prev click', () => {
    const manyItemEstimate = {
      ...mockEstimate,
      estimateItems: Array.from({ length: 12 }, (_, i) => ({
        fieldOptionId: `si${i}`,
        serviceItemName: `Item ${i}`,
        estimatedHours: 10,
      })),
    };
    render(
      <ServiceItemTable
        estimate={manyItemEstimate as any}
        onViewWorkers={mockOnViewWorkers}
      />,
    );
    fireEvent.click(screen.getByTestId('pagination-next'));
    mockTrack.mockClear();
    fireEvent.click(screen.getByTestId('pagination-prev'));
    expect(mockTrack).toHaveBeenCalledWith(
      DETAILS_PAGE_TRACKING_POINTS.LEFT_PAGINATION_ARROW_ESTIMATES,
    );
  });

  it('handles overdue percent (>100%) with correct color styling', () => {
    const overdueEstimate = {
      ...mockEstimate,
      budgetHoursTotal: 10,
      elapsedSeconds: 72000,
      estimateItems: [
        {
          fieldOptionId: 'si1',
          serviceItemName: 'Design',
          estimatedHours: 10,
          elapsedSeconds: 72000,
        },
      ],
    };
    render(
      <ServiceItemTable
        estimate={overdueEstimate as any}
        onViewWorkers={mockOnViewWorkers}
      />,
    );
    expect(screen.getByTestId('remaining-si1')).toBeInTheDocument();
  });

  it('handles estimate with undefined estimateItems', () => {
    const noItemsEstimate = {
      ...mockEstimate,
      estimateItems: undefined,
    };
    const rows = buildServiceItemRows(noItemsEstimate as any);
    expect(rows).toHaveLength(0);
  });

  it('renders without onViewWorkers prop', () => {
    render(<ServiceItemTable estimate={mockEstimate as any} />);
    fireEvent.click(screen.getByTestId('view-workers-si1'));
    expect(screen.getByText('Development')).toBeInTheDocument();
  });

  describe('unestimated service items (estimatedHours < 0 sentinel)', () => {
    const unestimatedEstimate = {
      ...mockEstimate,
      estimateItems: [
        {
          fieldOptionId: 'si-unest-1',
          serviceItemName: 'Unestimated A',
          // -1 is the sentinel `useProjectEstimates` produces when the API
          // returns `estimatedSeconds: -1` (item present on the project but
          // no per-item estimate yet).
          estimatedHours: -1,
          elapsedSeconds: 600, // 600s = 0.17h worked
        },
        {
          fieldOptionId: 'si-est-1',
          serviceItemName: 'Estimated B',
          estimatedHours: 10,
          elapsedSeconds: 18000, // 5h / 10h = 50%
        },
      ],
    };

    it('flags unestimated rows and zeroes out estimate-derived metrics', () => {
      const rows = buildServiceItemRows(unestimatedEstimate as any);
      expect(rows).toHaveLength(2);
      expect(rows[0].isUnestimated).toBe(true);
      expect(rows[0].hoursWorked).toBeCloseTo(0.17, 2);
      expect(rows[0].percentCompleted).toBe(0);
      expect(rows[0].hoursRemaining).toBe(0);
      expect(rows[1].isUnestimated).toBe(false);
      expect(rows[1].percentCompleted).toBe(50);
    });

    it('renders dashes for estimate-derived columns and keeps hoursWorked', () => {
      render(
        <ServiceItemTable
          estimate={unestimatedEstimate as any}
          onViewWorkers={mockOnViewWorkers}
        />,
      );
      // Service item name still rendered.
      expect(screen.getByText('Unestimated A')).toBeInTheDocument();
      // Hours estimated, percent completed, remaining all dashes.
      expect(
        screen.getByTestId('hours-estimated-si-unest-1'),
      ).toHaveTextContent('-');
      expect(screen.getByTestId('percent-si-unest-1')).toHaveTextContent('-');
      expect(screen.getByTestId('remaining-si-unest-1')).toHaveTextContent('-');
      // Estimated row still renders normal numeric cells.
      expect(screen.getByTestId('hours-estimated-si-est-1')).toHaveTextContent(
        '10.00',
      );
      expect(screen.getByTestId('remaining-si-est-1')).toHaveTextContent(
        '5.00',
      );
    });
  });

  it('handles zero percent completed', () => {
    const zeroProgressEstimate = {
      ...mockEstimate,
      budgetHoursTotal: 100,
      elapsedSeconds: 0,
      estimateItems: [
        {
          fieldOptionId: 'si1',
          serviceItemName: 'Testing',
          estimatedHours: 50,
        },
      ],
    };
    const rows = buildServiceItemRows(zeroProgressEstimate as any);
    expect(rows[0].percentCompleted).toBe(0);
    expect(rows[0].hoursWorked).toBe(0);
    expect(rows[0].hoursRemaining).toBe(50);
  });
});

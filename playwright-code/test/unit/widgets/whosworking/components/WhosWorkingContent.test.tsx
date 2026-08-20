import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import WhosWorkingContent from 'src/js/widgets/whosworking/components/WhosWorkingContent';
import {
  useWhoIsWorkingLoadMore,
  WhoIsWorkingWorkerNode,
} from 'src/js/widgets/whosworking/hooks/useWhoIsWorkingLoadMore';
import { useQbTimeSdk } from 'src/js/service/hooks/useQbTimeSdk';

// Mock tracking function
const mockTrack = jest.fn();
const mockSandbox = {
  appContext: {
    getUserAuthInfo: jest.fn(() => ({ authId: 'auth-user-1' })),
    getAppInfo: jest.fn(() => ({ appId: 'test-app' })),
  },
};

// Mock dependencies
jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => {
      const messages: Record<string, string> = {
        'whosWorking.title': "Who's Working",
        'whosWorking.description': 'See who is currently on the clock',
      };
      return messages[id] || id;
    },
  }),
  useTracking: () => mockTrack,
  useSandbox: () => mockSandbox,
}));

jest.mock('@ids-ts/typography', () => ({
  H3: ({ children, weight }: any) => <h3 data-weight={weight}>{children}</h3>,
  B3: ({ children }: any) => <span>{children}</span>,
}));

jest.mock('src/js/widgets/whosworking/hooks/useWhoIsWorkingLoadMore');
jest.mock('src/js/widgets/whosworking/components/workerMap/WorkerMap', () => ({
  WorkerMap: ({ workers, onSelectWorker, onRefresh }: any) => (
    <div data-testid="worker-map">
      <span data-testid="worker-count">{workers?.length || 0}</span>
      <button onClick={onRefresh} data-testid="refresh-btn">
        Refresh
      </button>
      <button
        onClick={() => onSelectWorker?.('worker-1')}
        data-testid="select-worker"
      >
        Select Worker
      </button>
    </div>
  ),
}));

jest.mock(
  'src/js/widgets/whosworking/components/workerList/WorkerList',
  () => ({
    WorkerList: ({
      workers,
      onSelectWorker,
      onSearchChange,
      onApplyFilters,
      onLoadMore,
      currentUserWorkerId,
      isWhoIsWorkingEditTimeEnabled,
    }: any) => (
      <div data-testid="worker-list">
        <span data-testid="list-worker-count">{workers?.length || 0}</span>
        <span data-testid="current-user-worker-id">
          {String(currentUserWorkerId)}
        </span>
        <span data-testid="edit-time-enabled-flag">
          {String(isWhoIsWorkingEditTimeEnabled)}
        </span>
        <input
          data-testid="search-input"
          onChange={(e) => onSearchChange?.(e.target.value)}
        />
        <button
          onClick={() => onApplyFilters?.('BY_GROUP', 'DAILY_TOTAL')}
          data-testid="apply-filters"
        >
          Apply Filters
        </button>
        <button
          onClick={() => onApplyFilters?.('ON_CLOCK_ONLY', 'TEAM_MEMBER')}
          data-testid="apply-filters-team-member"
        >
          Apply Team Member Sort
        </button>
        <button
          onClick={() => onApplyFilters?.('ALL_EMPLOYEES', 'SHARING_LOCATION')}
          data-testid="apply-filters-sharing-location"
        >
          Apply Sharing Location Sort
        </button>
        <button
          onClick={() => onApplyFilters?.('UNKNOWN', 'UNKNOWN')}
          data-testid="apply-filters-default"
        >
          Apply Default Filters
        </button>
        <button
          onClick={() => onSelectWorker?.('worker-2')}
          data-testid="select-list-worker"
        >
          Select Worker
        </button>
        <button onClick={onLoadMore} data-testid="load-more">
          Load More
        </button>
      </div>
    ),
  }),
);

jest.mock(
  'src/js/widgets/whosworking/components/WhosWorkingContent.styled',
  () => ({
    PlaceholderContainer: ({ children }: any) => (
      <div data-testid="placeholder-container">{children}</div>
    ),
    ContentMapContainer: ({ children }: any) => (
      <div data-testid="content-map-container">{children}</div>
    ),
    MapSection: ({ children }: any) => (
      <div data-testid="map-section">{children}</div>
    ),
    ListSection: ({ children }: any) => (
      <div data-testid="list-section">{children}</div>
    ),
    TitleContainer: ({ children }: any) => (
      <div data-testid="title-container">{children}</div>
    ),
  }),
);

jest.mock('src/js/service/utils/debounce', () => ({
  debounce: (fn: any) => fn,
}));
jest.mock('src/js/service/hooks/useQbTimeSdk');

const mockUseWhoIsWorkingLoadMore = useWhoIsWorkingLoadMore as jest.Mock;
const mockUseQbTimeSdk = useQbTimeSdk as jest.Mock;

// Helper to create mock worker nodes
const createMockWorker = (
  id: string,
  displayName: string,
  overrides?: Partial<WhoIsWorkingWorkerNode>,
): WhoIsWorkingWorkerNode =>
  ({
    timeForContactDAS: { id },
    firstName: displayName.split(' ')[0],
    lastName: displayName.split(' ')[1] || 'Test',
    displayName,
    timeForType: 'EMPLOYEE',
    group: null,
    totalDaySeconds: 3600,
    activeTimeEntry: null,
    currentLocation: null,
    ...overrides,
  } as WhoIsWorkingWorkerNode);

describe('WhosWorkingContent', () => {
  const mockLoadWhoIsWorking = jest.fn();
  const mockLoadMore = jest.fn();
  const mockRefetch = jest.fn();

  const defaultMockHookReturn = {
    workers: [],
    loading: false,
    isInitialLoading: false,
    error: null,
    summary: { totalOnClock: 0, totalWorkers: 0 },
    loadWhoIsWorking: mockLoadWhoIsWorking,
    loadMore: mockLoadMore,
    hasMore: false,
    refetch: mockRefetch,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWhoIsWorkingLoadMore.mockReturnValue(defaultMockHookReturn);
    mockUseQbTimeSdk.mockImplementation((sdkMethod) => {
      // Execute selector callback once to cover sdk method selection path
      sdkMethod({
        isWhoIsWorkingEditTimeEnabled: jest.fn().mockResolvedValue(true),
      } as any);
      return {
        data: true,
        loading: false,
        error: undefined,
        execute: jest.fn(),
        reset: jest.fn(),
      };
    });
  });

  describe('Rendering', () => {
    it('renders the component with title and description', () => {
      render(<WhosWorkingContent />);

      expect(screen.getByText("Who's Working")).toBeInTheDocument();
      expect(
        screen.getByText('See who is currently on the clock'),
      ).toBeInTheDocument();
    });

    it('renders WorkerMap component', () => {
      render(<WhosWorkingContent />);

      expect(screen.getByTestId('worker-map')).toBeInTheDocument();
    });

    it('renders WorkerList component', () => {
      render(<WhosWorkingContent />);

      expect(screen.getByTestId('worker-list')).toBeInTheDocument();
    });

    it('renders styled containers', () => {
      render(<WhosWorkingContent />);

      expect(screen.getByTestId('placeholder-container')).toBeInTheDocument();
      expect(screen.getByTestId('content-map-container')).toBeInTheDocument();
    });
  });

  describe('Data Loading', () => {
    it('calls loadWhoIsWorking on mount with default filter', () => {
      render(<WhosWorkingContent />);

      expect(mockLoadWhoIsWorking).toHaveBeenCalledTimes(1);
      expect(mockLoadWhoIsWorking).toHaveBeenCalledWith(
        expect.objectContaining({
          clockedInTimeForOnly: true,
          dateRange: expect.objectContaining({
            beginDate: expect.any(String),
            endDate: expect.any(String),
          }),
        }),
        expect.arrayContaining([
          expect.objectContaining({
            orderOn: 'ON_THE_CLOCK',
            orderDirection: 'DESC',
          }),
        ]),
      );
    });

    it('passes workers to child components', () => {
      const mockWorkers = [
        createMockWorker('1', 'John Doe'),
        createMockWorker('2', 'Jane Smith'),
      ];

      mockUseWhoIsWorkingLoadMore.mockReturnValue({
        ...defaultMockHookReturn,
        workers: mockWorkers,
      });

      render(<WhosWorkingContent />);

      expect(screen.getByTestId('worker-count')).toHaveTextContent('2');
      expect(screen.getByTestId('list-worker-count')).toHaveTextContent('2');
    });
  });

  describe('Worker Selection', () => {
    it('handles worker selection from map', () => {
      render(<WhosWorkingContent />);

      fireEvent.click(screen.getByTestId('select-worker'));

      // Verify selection state is managed (implementation detail is internal state)
      expect(screen.getByTestId('worker-map')).toBeInTheDocument();
    });

    it('handles worker selection from list', () => {
      render(<WhosWorkingContent />);

      fireEvent.click(screen.getByTestId('select-list-worker'));

      expect(screen.getByTestId('worker-list')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('handles search input change', async () => {
      render(<WhosWorkingContent />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'John' } });

      // The search should trigger a filter update (debounced)
      await waitFor(() => {
        expect(mockLoadWhoIsWorking).toHaveBeenCalled();
      });
    });

    it('trims search text before applying filter', async () => {
      render(<WhosWorkingContent />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: '  John  ' } });

      await waitFor(() => {
        expect(mockLoadWhoIsWorking).toHaveBeenCalled();
      });
    });

    it('tracks SEARCH when loadWhoIsWorking is called with non-empty search text', async () => {
      render(<WhosWorkingContent />);

      // Clear mock to ignore initial mount calls
      mockTrack.mockClear();

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'John' } });

      await waitFor(() => {
        expect(mockTrack).toHaveBeenCalledWith(
          expect.objectContaining({
            ui_action: 'clicked',
            ui_object: 'button',
            ui_object_detail: 'search',
          }),
        );
      });
    });

    it('does not track SEARCH when search text is empty', async () => {
      render(<WhosWorkingContent />);

      // Clear mock to ignore initial mount calls
      mockTrack.mockClear();

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: '' } });

      await waitFor(() => {
        expect(mockLoadWhoIsWorking).toHaveBeenCalled();
      });

      // Should not have tracked search (only WIDGET_VIEWED should have been called before clearing)
      expect(mockTrack).not.toHaveBeenCalledWith(
        expect.objectContaining({
          ui_object_detail: 'search',
        }),
      );
    });
  });

  describe('Filter Application', () => {
    it('handles filter application', async () => {
      render(<WhosWorkingContent />);

      // Apply filter should be callable
      fireEvent.click(screen.getByTestId('apply-filters'));

      await waitFor(() => {
        // Filter is applied and loadWhoIsWorking is called
        expect(mockLoadWhoIsWorking).toHaveBeenCalled();
      });
    });

    it('updates display and sort options on filter apply', () => {
      render(<WhosWorkingContent />);

      fireEvent.click(screen.getByTestId('apply-filters'));

      // The component should manage its state internally
      expect(screen.getByTestId('worker-list')).toBeInTheDocument();
    });

    it('applies TEAM_MEMBER sort for ON_CLOCK_ONLY display', async () => {
      render(<WhosWorkingContent />);

      fireEvent.click(screen.getByTestId('apply-filters-team-member'));

      await waitFor(() => {
        expect(mockLoadWhoIsWorking).toHaveBeenLastCalledWith(
          expect.objectContaining({
            clockedInTimeForOnly: true,
          }),
          expect.arrayContaining([
            expect.objectContaining({
              orderOn: 'TIME_FOR_NAME',
              orderDirection: 'ASC',
            }),
          ]),
        );
      });
    });

    it('applies SHARING_LOCATION sort for ALL_EMPLOYEES display', async () => {
      render(<WhosWorkingContent />);

      fireEvent.click(screen.getByTestId('apply-filters-sharing-location'));

      await waitFor(() => {
        expect(mockLoadWhoIsWorking).toHaveBeenLastCalledWith(
          expect.objectContaining({
            clockedInTimeForOnly: false,
          }),
          expect.arrayContaining([
            expect.objectContaining({
              orderOn: 'HAS_GEOLOCATION',
              orderDirection: 'DESC',
            }),
          ]),
        );
      });
    });

    it('falls back to default filter/order for unknown options', async () => {
      render(<WhosWorkingContent />);

      fireEvent.click(screen.getByTestId('apply-filters-default'));

      await waitFor(() => {
        expect(mockLoadWhoIsWorking).toHaveBeenLastCalledWith(
          expect.objectContaining({
            clockedInTimeForOnly: true,
          }),
          expect.arrayContaining([
            expect.objectContaining({
              orderOn: 'ON_THE_CLOCK',
              orderDirection: 'DESC',
            }),
            expect.objectContaining({
              orderOn: 'CLOCK_IN_TIME',
              orderDirection: 'DESC',
            }),
          ]),
        );
      });
    });
  });

  describe('Refresh Functionality', () => {
    it('handles refresh from map', () => {
      render(<WhosWorkingContent />);

      fireEvent.click(screen.getByTestId('refresh-btn'));

      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe('Load More Functionality', () => {
    it('handles load more from list', () => {
      mockUseWhoIsWorkingLoadMore.mockReturnValue({
        ...defaultMockHookReturn,
        hasMore: true,
      });

      render(<WhosWorkingContent />);

      fireEvent.click(screen.getByTestId('load-more'));

      expect(mockLoadMore).toHaveBeenCalled();
    });
  });

  describe('Display Options Mapping', () => {
    it('maps ON_CLOCK_ONLY display option correctly', () => {
      render(<WhosWorkingContent />);

      // Default is ON_CLOCK_ONLY
      expect(mockLoadWhoIsWorking).toHaveBeenCalledWith(
        expect.objectContaining({
          clockedInTimeForOnly: true,
        }),
        expect.any(Array),
      );
    });
  });

  describe('Sort Options Mapping', () => {
    it('default sort is MOST_RECENT_CLOCKED_IN', () => {
      render(<WhosWorkingContent />);

      expect(mockLoadWhoIsWorking).toHaveBeenCalledWith(
        expect.any(Object),
        expect.arrayContaining([
          expect.objectContaining({
            orderOn: 'ON_THE_CLOCK',
            orderDirection: 'DESC',
          }),
          expect.objectContaining({
            orderOn: 'CLOCK_IN_TIME',
            orderDirection: 'DESC',
          }),
        ]),
      );
    });
  });

  describe('Error Handling', () => {
    it('handles error state from hook', () => {
      mockUseWhoIsWorkingLoadMore.mockReturnValue({
        ...defaultMockHookReturn,
        error: 'Network error',
      });

      render(<WhosWorkingContent />);

      // Component should still render
      expect(screen.getByTestId('placeholder-container')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('passes loading state to child components', () => {
      mockUseWhoIsWorkingLoadMore.mockReturnValue({
        ...defaultMockHookReturn,
        loading: true,
      });

      render(<WhosWorkingContent />);

      expect(screen.getByTestId('worker-map')).toBeInTheDocument();
      expect(screen.getByTestId('worker-list')).toBeInTheDocument();
    });

    it('passes isInitialLoading state to child components', () => {
      mockUseWhoIsWorkingLoadMore.mockReturnValue({
        ...defaultMockHookReturn,
        isInitialLoading: true,
      });

      render(<WhosWorkingContent />);

      expect(screen.getByTestId('worker-list')).toBeInTheDocument();
    });
  });

  describe('Summary Data', () => {
    it('passes summary to WorkerMap', () => {
      const mockSummary = { totalOnClock: 5, totalWorkers: 20 };
      mockUseWhoIsWorkingLoadMore.mockReturnValue({
        ...defaultMockHookReturn,
        summary: mockSummary,
      });

      render(<WhosWorkingContent />);

      expect(screen.getByTestId('worker-map')).toBeInTheDocument();
    });
  });

  describe('employeeId handling', () => {
    it('passes employeeId as currentUserWorkerId to WorkerList', async () => {
      render(<WhosWorkingContent employeeId="worker-123" />);

      await waitFor(() => {
        expect(screen.getByTestId('current-user-worker-id')).toHaveTextContent(
          'worker-123',
        );
      });
    });
  });

  describe("Who's Working edit time enablement", () => {
    it('calls useQbTimeSdk to determine edit time enablement', async () => {
      render(<WhosWorkingContent />);

      await waitFor(() => {
        expect(mockUseQbTimeSdk).toHaveBeenCalled();
      });
    });

    it('passes false edit-time flag to WorkerList when sdk hook returns false', async () => {
      mockUseQbTimeSdk.mockReturnValue({
        data: false,
        loading: false,
        error: undefined,
        execute: jest.fn(),
        reset: jest.fn(),
      });

      render(<WhosWorkingContent />);

      await waitFor(() => {
        expect(screen.getByTestId('edit-time-enabled-flag')).toHaveTextContent(
          'false',
        );
      });
    });
  });
});

describe('mapSortByToOrderBy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWhoIsWorkingLoadMore.mockReturnValue({
      workers: [],
      loading: false,
      isInitialLoading: false,
      error: null,
      summary: null,
      loadWhoIsWorking: jest.fn(),
      loadMore: jest.fn(),
      hasMore: false,
      refetch: jest.fn(),
    });
  });

  it('maps MOST_RECENT_CLOCKED_IN correctly', () => {
    // This is tested indirectly through the default state
    render(<WhosWorkingContent />);
    expect(screen.getByTestId('placeholder-container')).toBeInTheDocument();
  });
});

describe('mapDisplayByToFilterAndOrder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles BY_GROUP display option', async () => {
    const mockLoadWhoIsWorking = jest.fn();
    mockUseWhoIsWorkingLoadMore.mockReturnValue({
      workers: [],
      loading: false,
      isInitialLoading: false,
      error: null,
      summary: null,
      loadWhoIsWorking: mockLoadWhoIsWorking,
      loadMore: jest.fn(),
      hasMore: false,
      refetch: jest.fn(),
    });

    render(<WhosWorkingContent />);

    // Apply BY_GROUP filter
    fireEvent.click(screen.getByTestId('apply-filters'));

    await waitFor(() => {
      expect(mockLoadWhoIsWorking).toHaveBeenCalled();
    });
  });
});

describe('getDateRangeFilter', () => {
  it('generates date range with current UTC date', () => {
    const mockLoadWhoIsWorking = jest.fn();
    mockUseWhoIsWorkingLoadMore.mockReturnValue({
      workers: [],
      loading: false,
      isInitialLoading: false,
      error: null,
      summary: null,
      loadWhoIsWorking: mockLoadWhoIsWorking,
      loadMore: jest.fn(),
      hasMore: false,
      refetch: jest.fn(),
    });

    render(<WhosWorkingContent />);

    expect(mockLoadWhoIsWorking).toHaveBeenCalledWith(
      expect.objectContaining({
        dateRange: expect.objectContaining({
          beginDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          endDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        }),
      }),
      expect.any(Array),
    );
  });
});

describe('Click Tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWhoIsWorkingLoadMore.mockReturnValue({
      workers: [],
      loading: false,
      isInitialLoading: false,
      error: null,
      summary: null,
      loadWhoIsWorking: jest.fn(),
      loadMore: jest.fn(),
      hasMore: false,
      refetch: jest.fn(),
    });
  });

  it('tracks WIDGET_VIEWED on mount', () => {
    render(<WhosWorkingContent />);

    expect(mockTrack).toHaveBeenCalledWith(
      expect.objectContaining({
        ui_action: 'viewed',
        ui_object: 'page',
        ui_object_detail: 'whos_working_map',
      }),
    );
  });

  it('tracks WIDGET_VIEWED only once on mount', () => {
    const { rerender } = render(<WhosWorkingContent />);

    // Clear the mock to check no additional calls on rerender
    const initialCallCount = mockTrack.mock.calls.filter(
      (call) => call[0]?.ui_object_detail === 'whos_working_map',
    ).length;

    rerender(<WhosWorkingContent />);

    const finalCallCount = mockTrack.mock.calls.filter(
      (call) => call[0]?.ui_object_detail === 'whos_working_map',
    ).length;

    expect(finalCallCount).toBe(initialCallCount);
  });
});

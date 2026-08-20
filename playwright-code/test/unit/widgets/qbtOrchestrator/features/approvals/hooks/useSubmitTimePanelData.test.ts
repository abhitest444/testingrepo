import { renderHook } from '@testing-library/react-hooks';
import { useSubmitTimePanelData } from 'src/js/widgets/qbtOrchestrator/features/approvals/hooks/useSubmitTimePanelData';

const mockSearchTimeEntries = jest.fn();

jest.mock('@payroll/quicksand', () => ({
  useSandbox: () => ({}),
}));

jest.mock('src/js/service/ApolloClientBuilderUtils', () => ({
  ApolloClientNames: { TIME_TRACKING: 'TIME_TRACKING' },
  buildHeaders: jest.fn(() => ({})),
}));

jest.mock('src/js/service/rest/TSheetsApiClient', () => ({
  getTSheetsRestApiUrl: jest.fn(() => 'https://tsheets-e2e.api.intuit.com'),
}));

jest.mock('src/js/common/CustomerInteraction', () => ({
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  getCustomerInteractionPropagationHeaders: jest.fn(() => ({
    traceparent: '00-test',
  })),
  TimeCustomerInteraction: {
    SUBMIT_TIME_PANEL_SUMMARY_LISTED: 'submit-time-panel-summary-listed',
  },
}));

jest.mock('src/__generated__/oigql/graphql', () => ({
  Common_SortOrder: {
    Desc: 'DESC',
  },
}));

jest.mock('src/__generated__/timeTracking/graphql', () => ({
  TimeTracking_TimeEntryOrderOn: {
    Date: 'DATE',
    TimeEntryId: 'TIME_ENTRY_ID',
  },
  useSearchTimeEntriesLazyQuery: () => [mockSearchTimeEntries],
}));

describe('useSubmitTimePanelData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: {
          users: {
            '123': {
              id: 123,
              approved_to: null,
              submitted_to: null,
            },
          },
        },
      }),
    });
  });

  it('aggregates paginated time entries and excludes open/break entries', async () => {
    mockSearchTimeEntries
      .mockResolvedValueOnce({
        data: {
          timeTrackingTimeEntries: {
            edges: [
              {
                node: {
                  id: '1',
                  date: '2026-06-04',
                  duration: 3600,
                  isOpen: false,
                  timeBreakId: null,
                },
              },
              {
                node: {
                  id: '2',
                  date: '2026-06-03',
                  duration: 1800,
                  isOpen: true,
                  timeBreakId: null,
                },
              },
            ],
            pageInfo: {
              hasNextPage: true,
              endCursor: 'cursor-1',
            },
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          timeTrackingTimeEntries: {
            edges: [
              {
                node: {
                  id: '3',
                  date: '2026-06-03',
                  duration: 1200,
                  isOpen: false,
                  timeBreakId: 'break-1',
                },
              },
              {
                node: {
                  id: '4',
                  date: '2026-06-02',
                  duration: 600,
                  isOpen: false,
                  timeBreakId: null,
                },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              endCursor: null,
            },
          },
        },
      });

    const { result } = renderHook(() => useSubmitTimePanelData());

    const response = await result.current.fetchSubmitTimePanelData({
      throughDateIso: '2026-06-04',
      weekStartDay: 0,
      includeFullSelectedWeek: false,
    });

    expect(mockSearchTimeEntries).toHaveBeenCalledTimes(2);
    expect(mockSearchTimeEntries).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        variables: expect.objectContaining({
          after: undefined,
          input: expect.objectContaining({
            timeEntryFilter: expect.objectContaining({
              isExported: false,
              date: {
                onOrAfter: '2026-05-03',
                onOrBefore: '2026-06-04',
              },
            }),
          }),
        }),
      }),
    );

    const firstWeek = response.weekGroups[0];
    const june4 = firstWeek.days.find((d) => d.date === '2026-06-04');
    const june3 = firstWeek.days.find((d) => d.date === '2026-06-03');
    const june2 = firstWeek.days.find((d) => d.date === '2026-06-02');
    expect(firstWeek.weekStart).toBe('2026-05-31');
    expect(firstWeek.weekEnd).toBe('2026-06-04');

    expect(june4).toEqual(
      expect.objectContaining({ minutes: 60, timesheetCount: 1 }),
    );
    expect(june3).toEqual(
      expect.objectContaining({ minutes: 0, timesheetCount: 0 }),
    );
    expect(june2).toEqual(
      expect.objectContaining({ minutes: 10, timesheetCount: 1 }),
    );
    expect(response.periodStartDate).toBe('2026-05-03');
  });

  it('expands to full selected week and aligns period start to week boundary', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: {
          users: {
            '123': {
              id: 123,
              approved_to: '2026-05-20',
              submitted_to: '2026-06-02',
            },
          },
        },
      }),
    });

    mockSearchTimeEntries.mockResolvedValue({
      data: {
        timeTrackingTimeEntries: {
          edges: [
            {
              node: {
                id: '11',
                date: '2026-05-30',
                duration: 3600,
                isOpen: false,
                timeBreakId: null,
              },
            },
            {
              node: {
                id: '12',
                date: '2026-06-06',
                duration: 1200,
                isOpen: false,
                timeBreakId: null,
              },
            },
          ],
          pageInfo: {
            hasNextPage: false,
            endCursor: null,
          },
        },
      },
    });

    const { result } = renderHook(() => useSubmitTimePanelData());

    const response = await result.current.fetchSubmitTimePanelData({
      throughDateIso: '2026-06-04',
      weekStartDay: 0,
      includeFullSelectedWeek: true,
    });

    expect(mockSearchTimeEntries).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({
          input: expect.objectContaining({
            timeEntryFilter: expect.objectContaining({
              date: {
                onOrAfter: '2026-05-03',
                onOrBefore: '2026-06-06',
              },
            }),
          }),
        }),
      }),
    );

    expect(response.periodStartDate).toBe('2026-05-03');
    expect(response.weekGroups[0].weekStart).toBe('2026-05-31');
    expect(response.weekGroups[0].weekEnd).toBe('2026-06-06');
    expect(response.weekGroups[0].days[0].date).toBe('2026-06-06');
  });

  it('throws a sanitized error when current_user request fails', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'secret-body',
    });

    const { result } = renderHook(() => useSubmitTimePanelData());

    await expect(
      result.current.fetchSubmitTimePanelData({
        throughDateIso: '2026-06-04',
        weekStartDay: 0,
      }),
    ).rejects.toThrow('failed (500)');
  });
});

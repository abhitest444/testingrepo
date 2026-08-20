import { renderHook, act } from '@testing-library/react-hooks';
import { useSameDayGeoEntries } from 'src/js/widgets/timeEntryLocation/hooks/useSameDayGeoEntries';
import { TimeTracking_TimeEntry } from 'src/__generated__/timeTracking/graphql';

// Flush all pending promises and microtasks so async useEffect callbacks complete
const flushAsync = () =>
  act(async () => {
    await Promise.resolve();
  });

// ── mocks ────────────────────────────────────────────────────────────────────

const mockSearchQuery = jest.fn();
const mockResetData = jest.fn();
let mockSameDayTimeEntries: any[] | null = null;

jest.mock('src/js/service/hooks/timeEntries/useLazySearchTimeEntries', () => ({
  useLazySearchTimeEntries: () => ({
    query: mockSearchQuery,
    data: mockSameDayTimeEntries,
    resetData: mockResetData,
  }),
}));

jest.mock('@payroll/quicksand', () => ({
  useSandbox: () => ({
    logger: {
      info: jest.fn(),
      error: jest.fn(),
      logException: jest.fn(),
    },
  }),
}));

const mockCreateCustomerInteraction = jest.fn();
const mockEndInteractionWithSuccess = jest.fn();
const mockEndInteractionWithFailure = jest.fn();

jest.mock('src/js/common/CustomerInteraction', () => ({
  createCustomerInteraction: (...args: any[]) =>
    mockCreateCustomerInteraction(...args),
  endInteractionWithSuccess: (...args: any[]) =>
    mockEndInteractionWithSuccess(...args),
  endInteractionWithFailure: (...args: any[]) =>
    mockEndInteractionWithFailure(...args),
  TimeCustomerInteraction: {
    ACTIVE_TIME_ENTRY_READ: 'ACTIVE_TIME_ENTRY_READ',
  },
}));

const mockGetTimeEntryLocalDateForApi = jest.fn();
const mockBuildGeoSameDayEntryTimeRangeMapById = jest.fn();

jest.mock('src/js/widgets/timeEntryLocation/utils/locationPointUtils', () => ({
  getTimeEntryLocalDateForApi: (entry: any) =>
    mockGetTimeEntryLocalDateForApi(entry),
  buildGeoSameDayEntryTimeRangeMapById: (...args: any[]) =>
    mockBuildGeoSameDayEntryTimeRangeMapById(...args),
}));

// ── helpers ──────────────────────────────────────────────────────────────────

const makeTimeEntry = (id = 'entry-1'): TimeTracking_TimeEntry =>
  ({
    id,
    startTime: '2026-01-14T17:30:00.000Z',
    endTime: '2026-01-14T18:45:00.000Z',
    timeZone: 'America/Los_Angeles',
    timeForContactDAS: { id: 'worker-1' },
  } as unknown as TimeTracking_TimeEntry);

const defaultArgs = {
  timeEntry: makeTimeEntry(),
  loading: false,
  timeEntryId: 'entry-1',
  nowLabel: 'Now',
};

// ── tests ────────────────────────────────────────────────────────────────────

describe('useSameDayGeoEntries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSameDayTimeEntries = null;
    mockGetTimeEntryLocalDateForApi.mockReturnValue('2026-01-14');
    mockBuildGeoSameDayEntryTimeRangeMapById.mockReturnValue({});
    // Must resolve to an object: the hook destructures { data } from the lazy query result
    mockSearchQuery.mockResolvedValue({
      data: { timeTrackingTimeEntries: { edges: [] } },
    });
  });

  it('fires the search once when loading resolves and prerequisites are met', async () => {
    renderHook(() => useSameDayGeoEntries(defaultArgs));

    await flushAsync();

    expect(mockResetData).toHaveBeenCalledTimes(1);
    expect(mockSearchQuery).toHaveBeenCalledTimes(1);
    expect(mockSearchQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({
          input: expect.objectContaining({
            timeEntryFilter: expect.objectContaining({
              timeForEntityId: { equals: 'worker-1' },
              date: { onOrAfter: '2026-01-14', onOrBefore: '2026-01-14' },
            }),
          }),
        }),
        fetchPolicy: 'no-cache',
        errorPolicy: 'all',
      }),
    );
  });

  it('does NOT fire search while loading is true', () => {
    renderHook(() => useSameDayGeoEntries({ ...defaultArgs, loading: true }));

    expect(mockSearchQuery).not.toHaveBeenCalled();
    expect(mockResetData).not.toHaveBeenCalled();
  });

  it('does NOT fire search when timeEntry is null', () => {
    renderHook(() => useSameDayGeoEntries({ ...defaultArgs, timeEntry: null }));

    expect(mockSearchQuery).not.toHaveBeenCalled();
  });

  it('does NOT fire search when entryDateForSearch is empty (no startTime)', () => {
    mockGetTimeEntryLocalDateForApi.mockReturnValue('');

    renderHook(() => useSameDayGeoEntries(defaultArgs));

    expect(mockSearchQuery).not.toHaveBeenCalled();
  });

  it('does NOT re-fire search when timeEntry changes due to a dropdown selection (timeEntryId stays the same)', async () => {
    const { rerender } = renderHook((props) => useSameDayGeoEntries(props), {
      initialProps: defaultArgs,
    });

    await flushAsync();
    expect(mockSearchQuery).toHaveBeenCalledTimes(1);

    // Simulate dropdown selection: activeTimeEntryId changes inside the container,
    // so timeEntry and loading cycle — but timeEntryId prop stays 'entry-1'.
    rerender({
      ...defaultArgs,
      loading: true,
      timeEntry: makeTimeEntry('entry-2'),
    });
    await flushAsync();
    rerender({
      ...defaultArgs,
      loading: false,
      timeEntry: makeTimeEntry('entry-2'),
    });
    await flushAsync();

    // Should still be 1 — no second search for same timeEntryId
    expect(mockSearchQuery).toHaveBeenCalledTimes(1);
  });

  it('re-fires search when timeEntryId itself changes (new widget open)', async () => {
    const { rerender } = renderHook((props) => useSameDayGeoEntries(props), {
      initialProps: defaultArgs,
    });

    await flushAsync();
    expect(mockSearchQuery).toHaveBeenCalledTimes(1);

    rerender({
      ...defaultArgs,
      timeEntryId: 'entry-99',
      timeEntry: makeTimeEntry('entry-99'),
    });
    await flushAsync();

    expect(mockSearchQuery).toHaveBeenCalledTimes(2);
  });

  it('creates and ends ACTIVE_TIME_ENTRY_READ customer interaction on success', async () => {
    renderHook(() => useSameDayGeoEntries(defaultArgs));

    await flushAsync();

    expect(mockCreateCustomerInteraction).toHaveBeenCalledWith(
      expect.anything(),
      'ACTIVE_TIME_ENTRY_READ',
    );
    expect(mockEndInteractionWithSuccess).toHaveBeenCalledWith(
      expect.anything(),
      'ACTIVE_TIME_ENTRY_READ',
    );
    expect(mockEndInteractionWithFailure).not.toHaveBeenCalled();
  });

  it('ends ACTIVE_TIME_ENTRY_READ interaction with failure when search throws', async () => {
    mockSearchQuery.mockRejectedValue(new Error('Network error'));

    renderHook(() => useSameDayGeoEntries(defaultArgs));

    await flushAsync();

    expect(mockEndInteractionWithFailure).toHaveBeenCalledWith(
      expect.anything(),
      'ACTIVE_TIME_ENTRY_READ',
      'QUERY_ERROR',
      expect.any(Error),
    );
    expect(mockEndInteractionWithSuccess).not.toHaveBeenCalled();
  });

  it('returns sameDayGeoEntryTimeRangesById from buildGeoSameDayEntryTimeRangeMapById', async () => {
    const expected = {
      'entry-1': '9:30 AM - 10:45 AM',
      'entry-2': '11:00 AM - 12:00 PM',
    };
    mockBuildGeoSameDayEntryTimeRangeMapById.mockReturnValue(expected);
    mockSameDayTimeEntries = [
      { id: 'entry-1', startTime: '2026-01-14T17:30:00.000Z' },
      { id: 'entry-2', startTime: '2026-01-14T19:00:00.000Z' },
    ];

    const { result } = renderHook(() => useSameDayGeoEntries(defaultArgs));

    await flushAsync();

    expect(result.current.sameDayGeoEntryTimeRangesById).toEqual(expected);
  });

  it('returns empty map when no same-day data is available', () => {
    const { result } = renderHook(() =>
      useSameDayGeoEntries({ ...defaultArgs, loading: true }),
    );

    expect(result.current.sameDayGeoEntryTimeRangesById).toEqual({});
  });
});

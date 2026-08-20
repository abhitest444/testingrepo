import { renderHook, act } from '@testing-library/react-hooks';
import {
  useDeepLinkNavigation,
  SectionEnabledState,
} from 'src/js/widgets/timeTrackingSettings/hooks/useDeepLinkNavigation';
import { parseSectionParam } from 'src/js/widgets/timeTrackingSettings/sectionNavigation';
import {
  DEEP_LINK_NAVIGATION_EVENTS,
  SECTION_READY_EVENT,
} from 'src/js/common/constants';

// Mock useSandbox
const mockPublish = jest.fn();
const mockSubscribe = jest.fn();
const mockUnsubscribe = jest.fn();
const mockLoggerInfo = jest.fn();
const mockLoggerWarn = jest.fn();
const mockLoggerError = jest.fn();

jest.mock('@payroll/quicksand', () => ({
  useSandbox: () => ({
    pubsub: {
      publish: mockPublish,
      subscribe: mockSubscribe,
      unsubscribe: mockUnsubscribe,
    },
    logger: {
      info: mockLoggerInfo,
      warn: mockLoggerWarn,
      error: mockLoggerError,
    },
  }),
}));

// Mock useIXPFeatureFlag to return enabled by default
jest.mock('src/js/common/useIXPFeatureFlag', () => ({
  useIXPFeatureFlag: jest.fn().mockReturnValue({
    isEnabled: true,
    settled: true,
    isLoading: false,
    error: null,
  }),
}));

describe('useDeepLinkNavigation', () => {
  const defaultEnabledState: SectionEnabledState = {
    breaks: true,
    overtime: true,
    geoLocations: true,
    customFields: true,
    timeOff: true,
    schedules: true,
    approvals: true,
    kiosk: true,
    timeTracking: true,
    timesheet: true,
    notifications: true,
  };

  const createSectionRefs = () => ({
    current: {} as Record<string, HTMLDivElement | null>,
  });

  let subscriptionCallbacks: Record<string, (payload?: unknown) => void> = {};
  let subscriptionIdCounter = 0;

  beforeEach(() => {
    jest.clearAllMocks();
    subscriptionCallbacks = {};
    subscriptionIdCounter = 0;

    mockSubscribe.mockImplementation(
      (event: string, callback: (payload?: unknown) => void) => {
        subscriptionIdCounter += 1;
        const id = `sub-${subscriptionIdCounter}`;
        subscriptionCallbacks[id] = callback;
        return id;
      },
    );
  });

  describe('initial state', () => {
    it('returns correct initial state with no section param', () => {
      const { result } = renderHook(() =>
        useDeepLinkNavigation({
          sectionPath: parseSectionParam(null),
          sectionRefs: createSectionRefs(),
          sectionEnabledState: defaultEnabledState,
        }),
      );

      expect(result.current.isDeepLinkNavigating).toBe(false);
      expect(result.current.breaksInitialView).toBeNull();
      expect(result.current.overtimeInitialView).toBeNull();
      expect(result.current.geoLocationsInitialOpen).toBe(false);
      expect(result.current.customFieldsInitialOpen).toBe(false);
      expect(result.current.pendingFormType).toBeNull();
      expect(result.current.pendingScrollTarget).toBeNull();
    });

    it.each([
      ['breaks', true],
      ['overtime', true],
      ['geolocation', true],
      ['customfields', true],
      ['notifications', false],
      ['timetracking', false],
      ['kiosk', false],
    ])(
      'sets isDeepLinkNavigating=%s for section=%s',
      (section, expectedNavigating) => {
        const { result } = renderHook(() =>
          useDeepLinkNavigation({
            sectionPath: parseSectionParam(section),
            sectionRefs: createSectionRefs(),
            sectionEnabledState: defaultEnabledState,
          }),
        );

        expect(result.current.isDeepLinkNavigating).toBe(expectedNavigating);
      },
    );
  });

  describe('trowser sections', () => {
    it.each([
      ['breaks', 'breaksInitialView', { view: 'list' }],
      ['breaks-create', 'breaksInitialView', { view: 'create' }],
      [
        'breaks-edit-abc123',
        'breaksInitialView',
        { view: 'edit', breakId: 'abc123' },
      ],
      ['overtime', 'overtimeInitialView', { view: 'list' }],
      [
        'overtime-policysetup-2',
        'overtimeInitialView',
        { view: 'wizard', wizardStep: 2 },
      ],
    ] as const)('sets %s for section=%s', (section, stateKey, expected) => {
      const { result } = renderHook(() =>
        useDeepLinkNavigation({
          sectionPath: parseSectionParam(section),
          sectionRefs: createSectionRefs(),
          sectionEnabledState: defaultEnabledState,
        }),
      );

      expect(result.current[stateKey]).toEqual(expected);
    });

    it('sets geoLocationsInitialOpen for geolocation', () => {
      const { result } = renderHook(() =>
        useDeepLinkNavigation({
          sectionPath: parseSectionParam('geolocation'),
          sectionRefs: createSectionRefs(),
          sectionEnabledState: defaultEnabledState,
        }),
      );

      expect(result.current.geoLocationsInitialOpen).toBe(true);
    });

    it('sets customFieldsInitialOpen for customfields', () => {
      const { result } = renderHook(() =>
        useDeepLinkNavigation({
          sectionPath: parseSectionParam('customfields'),
          sectionRefs: createSectionRefs(),
          sectionEnabledState: defaultEnabledState,
        }),
      );

      expect(result.current.customFieldsInitialOpen).toBe(true);
    });
  });

  describe('inline edit sections', () => {
    const simulateSectionReady = (section: string) => {
      Object.values(subscriptionCallbacks).forEach((callback) => {
        callback({ section });
      });
    };

    it.each([
      ['timetracking', 'Timetracking'],
      ['timesheet', 'Timesheet'],
      ['notifications', 'Notification'],
      ['approvals', 'Approvals'],
    ])(
      'sets pendingFormType for %s after ready',
      (section, expectedFormType) => {
        const { result } = renderHook(() =>
          useDeepLinkNavigation({
            sectionPath: parseSectionParam(section),
            sectionRefs: createSectionRefs(),
            sectionEnabledState: defaultEnabledState,
          }),
        );

        // Initially no pending form type
        expect(result.current.pendingFormType).toBeNull();

        // Simulate section ready
        act(() => {
          simulateSectionReady(section);
        });

        expect(result.current.pendingFormType).toBe(expectedFormType);
      },
    );

    it('sets pendingScrollTarget for notifications-overtime', () => {
      const { result } = renderHook(() =>
        useDeepLinkNavigation({
          sectionPath: parseSectionParam('notifications-overtime'),
          sectionRefs: createSectionRefs(),
          sectionEnabledState: defaultEnabledState,
        }),
      );

      act(() => {
        simulateSectionReady('notifications');
      });

      expect(result.current.pendingScrollTarget).toEqual({
        elementId: 'notifications-overtime-subsection',
        delay: 500,
      });
    });
  });

  describe('view-only sections', () => {
    const simulateSectionReady = (section: string) => {
      Object.values(subscriptionCallbacks).forEach((callback) => {
        callback({ section });
      });
    };

    it.each([
      ['kiosk', 'kiosk-settings'],
      ['timeoff', 'timeoff-settings'],
    ])(
      'sets pendingScrollTarget for %s after ready',
      (section, expectedElementId) => {
        const { result } = renderHook(() =>
          useDeepLinkNavigation({
            sectionPath: parseSectionParam(section),
            sectionRefs: createSectionRefs(),
            sectionEnabledState: defaultEnabledState,
          }),
        );

        // Initially no scroll target
        expect(result.current.pendingScrollTarget).toBeNull();

        act(() => {
          simulateSectionReady(section);
        });

        expect(result.current.pendingScrollTarget).toEqual({
          elementId: expectedElementId,
          delay: 1000,
        });
      },
    );
  });

  describe('disabled sections', () => {
    it.each([
      ['breaks', 'breaks'],
      ['overtime', 'overtime'],
      ['notifications', 'notifications'],
      ['kiosk', 'kiosk'],
    ])('aborts navigation for disabled %s section', (section, stateKey) => {
      const disabledState = {
        ...defaultEnabledState,
        [stateKey]: false,
      };

      const { result } = renderHook(() =>
        useDeepLinkNavigation({
          sectionPath: parseSectionParam(section),
          sectionRefs: createSectionRefs(),
          sectionEnabledState: disabledState,
        }),
      );

      expect(result.current.isDeepLinkNavigating).toBe(false);
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        expect.stringContaining('SECTION_DISABLED'),
      );
    });
  });

  describe('feature flags loading', () => {
    it('waits for feature flags to load before navigating', () => {
      const { result, rerender } = renderHook(
        ({ featureFlagsLoading }) =>
          useDeepLinkNavigation({
            sectionPath: parseSectionParam('breaks'),
            sectionRefs: createSectionRefs(),
            sectionEnabledState: defaultEnabledState,
            featureFlagsLoading,
          }),
        { initialProps: { featureFlagsLoading: true } },
      );

      // Should not set initial view while loading
      expect(result.current.breaksInitialView).toBeNull();
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        expect.stringContaining('WAITING_FOR_FEATURE_FLAGS'),
      );

      // Rerender with flags loaded
      rerender({ featureFlagsLoading: false });

      // Now should set initial view
      expect(result.current.breaksInitialView).toEqual({ view: 'list' });
    });
  });

  describe('invalid section paths', () => {
    it.each([
      ['unknown'],
      ['notifications-invalid'],
      ['breaks-edit'], // missing id
    ])('dismisses loader for invalid path: %s', (section) => {
      const { result } = renderHook(() =>
        useDeepLinkNavigation({
          sectionPath: parseSectionParam(section),
          sectionRefs: createSectionRefs(),
          sectionEnabledState: defaultEnabledState,
        }),
      );

      expect(result.current.isDeepLinkNavigating).toBe(false);
    });
  });

  describe('pubsub integration', () => {
    it('subscribes to SECTION_READY_EVENT and DEEP_LINK_NAVIGATION_EVENTS.COMPLETE', () => {
      renderHook(() =>
        useDeepLinkNavigation({
          sectionPath: parseSectionParam('breaks'),
          sectionRefs: createSectionRefs(),
          sectionEnabledState: defaultEnabledState,
        }),
      );

      expect(mockSubscribe).toHaveBeenCalledWith(
        SECTION_READY_EVENT,
        expect.any(Function),
      );
      expect(mockSubscribe).toHaveBeenCalledWith(
        DEEP_LINK_NAVIGATION_EVENTS.COMPLETE,
        expect.any(Function),
      );
    });

    it('unsubscribes on unmount', () => {
      const { unmount } = renderHook(() =>
        useDeepLinkNavigation({
          sectionPath: parseSectionParam('breaks'),
          sectionRefs: createSectionRefs(),
          sectionEnabledState: defaultEnabledState,
        }),
      );

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('publishNavigationComplete publishes the correct event', () => {
      const { result } = renderHook(() =>
        useDeepLinkNavigation({
          sectionPath: parseSectionParam('breaks'),
          sectionRefs: createSectionRefs(),
          sectionEnabledState: defaultEnabledState,
        }),
      );

      act(() => {
        result.current.publishNavigationComplete();
      });

      expect(mockPublish).toHaveBeenCalledWith(
        DEEP_LINK_NAVIGATION_EVENTS.COMPLETE,
        {},
      );
    });
  });

  describe('clearPendingNavigation', () => {
    it('clears pending form type and scroll target', () => {
      const simulateSectionReady = (section: string) => {
        Object.values(subscriptionCallbacks).forEach((callback) => {
          callback({ section });
        });
      };

      const { result } = renderHook(() =>
        useDeepLinkNavigation({
          sectionPath: parseSectionParam('notifications'),
          sectionRefs: createSectionRefs(),
          sectionEnabledState: defaultEnabledState,
        }),
      );

      act(() => {
        simulateSectionReady('notifications');
      });

      expect(result.current.pendingFormType).not.toBeNull();

      act(() => {
        result.current.clearPendingNavigation();
      });

      expect(result.current.pendingFormType).toBeNull();
      expect(result.current.pendingScrollTarget).toBeNull();
    });
  });

  describe('safety timeout', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('clears isDeepLinkNavigating after 10s if navigation never completes', () => {
      const { result } = renderHook(() =>
        useDeepLinkNavigation({
          sectionPath: parseSectionParam('breaks'),
          sectionRefs: createSectionRefs(),
          sectionEnabledState: defaultEnabledState,
        }),
      );

      expect(result.current.isDeepLinkNavigating).toBe(true);

      act(() => {
        jest.advanceTimersByTime(10_000);
      });

      expect(result.current.isDeepLinkNavigating).toBe(false);
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        'Component=useDeepLinkNavigation Event=NAVIGATION_TIMEOUT_SAFETY',
      );
    });

    it('does not trigger timeout if navigation completes before 10s', () => {
      const { result } = renderHook(() =>
        useDeepLinkNavigation({
          sectionPath: parseSectionParam('breaks'),
          sectionRefs: createSectionRefs(),
          sectionEnabledState: defaultEnabledState,
        }),
      );

      expect(result.current.isDeepLinkNavigating).toBe(true);

      act(() => {
        jest.advanceTimersByTime(5_000);
      });

      expect(result.current.isDeepLinkNavigating).toBe(true);

      // Simulate the DEEP_LINK_NAVIGATION_EVENTS.COMPLETE pubsub event
      act(() => {
        Object.values(subscriptionCallbacks).forEach((callback) => {
          callback({});
        });
      });

      expect(result.current.isDeepLinkNavigating).toBe(false);

      act(() => {
        jest.advanceTimersByTime(10_000);
      });

      expect(mockLoggerWarn).not.toHaveBeenCalledWith(
        'Component=useDeepLinkNavigation Event=NAVIGATION_TIMEOUT_SAFETY',
      );
    });
  });
});

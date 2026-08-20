import { useCallback, useEffect, useRef, useState } from 'react';
import { useSandbox } from '@payroll/quicksand';
import {
  DEEP_LINK_NAVIGATION_EVENTS,
  FEATURE_FLAGS,
  SECTION_READY_EVENT,
} from 'src/js/common/constants';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';
import {
  SECTION_KEYS,
  isValidSectionPath,
  isInlineEditSection,
  isTrowserSection,
  isViewOnlySection,
  sectionToFormType,
  sectionToElementId,
  getSubsectionElementId,
  buildBreaksWidgetOptions,
  buildOvertimeWidgetOptions,
  buildGeoLocationsOptions,
  BreaksInitialViewOptions,
  OvertimeInitialViewOptions,
  ParsedSectionPath,
} from 'src/js/widgets/timeTrackingSettings/sectionNavigation';

/**
 * Computed enabled state for each section.
 * This should combine all conditions: config.enabled, supportedLists, and feature flags.
 */
export interface SectionEnabledState {
  breaks: boolean;
  overtime: boolean;
  geoLocations: boolean;
  customFields: boolean;
  timeOff: boolean;
  schedules: boolean;
  approvals: boolean;
  kiosk: boolean;
  timeTracking: boolean;
  timesheet: boolean;
  notifications: boolean;
}

interface UseDeepLinkNavigationProps {
  sectionPath: ParsedSectionPath;
  sectionRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  sectionEnabledState: SectionEnabledState;
  /** If true, feature flags are still loading - navigation will wait */
  featureFlagsLoading?: boolean;
}

interface ScrollTarget {
  elementId: string;
  delay: number;
}

interface UseDeepLinkNavigationReturn {
  isDeepLinkNavigating: boolean;
  breaksInitialView: BreaksInitialViewOptions | null;
  overtimeInitialView: OvertimeInitialViewOptions | null;
  geoLocationsInitialOpen: boolean;
  customFieldsInitialOpen: boolean;
  pendingFormType: string | null;
  pendingScrollTarget: ScrollTarget | null;
  clearPendingNavigation: () => void;
  publishNavigationComplete: () => void;
}

// Map section keys to enabled state keys
const SECTION_TO_ENABLED_KEY: Record<string, keyof SectionEnabledState> = {
  [SECTION_KEYS.BREAKS]: 'breaks',
  [SECTION_KEYS.OVERTIME]: 'overtime',
  [SECTION_KEYS.GEO_LOCATION]: 'geoLocations',
  [SECTION_KEYS.CUSTOM_FIELDS]: 'customFields',
  [SECTION_KEYS.TIMEOFF]: 'timeOff',
  [SECTION_KEYS.SCHEDULES]: 'schedules',
  [SECTION_KEYS.APPROVALS]: 'approvals',
  [SECTION_KEYS.KIOSK]: 'kiosk',
  [SECTION_KEYS.TIMETRACKING]: 'timeTracking',
  [SECTION_KEYS.TIMESHEET]: 'timesheet',
  [SECTION_KEYS.NOTIFICATIONS]: 'notifications',
};

export const useDeepLinkNavigation = ({
  sectionPath,
  sectionRefs,
  sectionEnabledState,
  featureFlagsLoading = false,
}: UseDeepLinkNavigationProps): UseDeepLinkNavigationReturn => {
  const sandbox = useSandbox();

  // Check if deep link navigation feature is enabled
  const { isEnabled: isDeepLinkEnabled, settled: isDeepLinkFlagSettled } =
    useIXPFeatureFlag({
      flagName: FEATURE_FLAGS.QB_TIME_ACCOUNT_SETTINGS_DEEPLINK,
      defaultValue: false,
    });

  // Use ref to avoid stale closure in effects that check enabled state
  const sectionEnabledStateRef = useRef(sectionEnabledState);
  useEffect(() => {
    sectionEnabledStateRef.current = sectionEnabledState;
  });

  // Helper to check if a section is enabled (config + supportedLists + feature flags)
  // Uses ref to always read latest enabled state
  const isSectionEnabled = (section: string): boolean => {
    const enabledKey = SECTION_TO_ENABLED_KEY[section];
    if (!enabledKey) return true; // Default to enabled if not mapped
    return sectionEnabledStateRef.current[enabledKey];
  };

  // State for nested widget initial views (deep-linking)
  const [breaksInitialView, setBreaksInitialView] =
    useState<BreaksInitialViewOptions | null>(null);
  const [overtimeInitialView, setOvertimeInitialView] =
    useState<OvertimeInitialViewOptions | null>(null);
  const [geoLocationsInitialOpen, setGeoLocationsInitialOpen] =
    useState<boolean>(false);
  const [customFieldsInitialOpen, setCustomFieldsInitialOpen] =
    useState<boolean>(false);

  // Track if section navigation has been processed to avoid re-triggering
  const sectionNavigationProcessedRef = useRef(false);

  // Loading state for deep-link navigation to trowser sections
  const [isDeepLinkNavigating, setIsDeepLinkNavigating] = useState(
    () => !!(sectionPath?.section && isTrowserSection(sectionPath.section)),
  );

  // Track which sections are ready via pub/sub events
  const [sectionsReady, setSectionsReady] = useState<Record<string, boolean>>(
    {},
  );

  // Pending navigation actions for the component to handle
  const [pendingFormType, setPendingFormType] = useState<string | null>(null);
  const [pendingScrollTarget, setPendingScrollTarget] =
    useState<ScrollTarget | null>(null);

  // Subscribe to deep-link navigation complete event (for trowser sections)
  useEffect(() => {
    if (!isDeepLinkNavigating) return undefined;

    const subscriptionId = sandbox.pubsub.subscribe(
      DEEP_LINK_NAVIGATION_EVENTS.COMPLETE,
      () => {
        setIsDeepLinkNavigating(false);
      },
    );

    return () => {
      sandbox.pubsub.unsubscribe(subscriptionId);
    };
  }, [isDeepLinkNavigating, sandbox.pubsub]);

  // Safety timeout — clear overlay if navigation never completes (e.g. widget errors out)
  useEffect(() => {
    if (!isDeepLinkNavigating) return undefined;

    const safetyTimer = setTimeout(() => {
      sandbox.logger.warn(
        'Component=useDeepLinkNavigation Event=NAVIGATION_TIMEOUT_SAFETY',
      );
      setIsDeepLinkNavigating(false);
    }, 10_000);

    return () => clearTimeout(safetyTimer);
  }, [isDeepLinkNavigating, sandbox.logger]);

  // Subscribe to SECTION_READY_EVENT (single subscription for all sections)
  useEffect(() => {
    const subscriptionId = sandbox.pubsub.subscribe(
      SECTION_READY_EVENT,
      (payload: unknown) => {
        const typedPayload = payload as { section?: string } | undefined;
        if (typedPayload?.section) {
          sandbox.logger.info(
            `Component=useDeepLinkNavigation Event=SECTION_READY_EVENT section=${typedPayload.section}`,
          );
          setSectionsReady((prev) => ({
            ...prev,
            [typedPayload.section as string]: true,
          }));
        }
      },
    );

    return () => {
      sandbox.pubsub.unsubscribe(subscriptionId);
    };
  }, [sandbox.pubsub, sandbox.logger]);

  // Helper to check if a specific section is ready
  const isSectionReady = useCallback(
    (sectionKey: string) => !!sectionsReady[sectionKey],
    [sectionsReady],
  );

  // Clear pending navigation after component handles it
  const clearPendingNavigation = useCallback(() => {
    setPendingFormType(null);
    setPendingScrollTarget(null);
  }, []);

  // Helper to publish navigation complete event
  const publishNavigationComplete = useCallback(() => {
    sandbox.pubsub.publish(DEEP_LINK_NAVIGATION_EVENTS.COMPLETE, {});
  }, [sandbox.pubsub]);

  // Section navigation useEffect - handles deep-linking via query params
  useEffect(() => {
    // Skip if already processed
    if (sectionNavigationProcessedRef.current) {
      return;
    }

    // Wait for deep link feature flag to settle
    if (!isDeepLinkFlagSettled) {
      sandbox.logger.info(
        'Component=useDeepLinkNavigation Event=WAITING_FOR_DEEPLINK_FLAG',
      );
      return;
    }

    // Skip navigation entirely if deep link feature is disabled
    if (!isDeepLinkEnabled) {
      sectionNavigationProcessedRef.current = true;
      sandbox.logger.info(
        'Component=useDeepLinkNavigation Event=DEEPLINK_FEATURE_DISABLED',
      );
      if (isDeepLinkNavigating) {
        setIsDeepLinkNavigating(false);
      }
      return;
    }

    // Wait for feature flags to load before making navigation decisions
    if (featureFlagsLoading) {
      sandbox.logger.info(
        'Component=useDeepLinkNavigation Event=WAITING_FOR_FEATURE_FLAGS',
      );
      return;
    }

    // Handle invalid or missing section - dismiss loader and load page normally
    if (!sectionPath.section || !isValidSectionPath(sectionPath)) {
      sectionNavigationProcessedRef.current = true;
      if (sectionPath.section) {
        sandbox.logger.warn(
          `Component=TimeEntrySettingsForm Event=INVALID_SECTION section=${sectionPath.section}`,
        );
      }
      // Clear loading state - load settings page normally
      if (isDeepLinkNavigating) {
        setIsDeepLinkNavigating(false);
      }
      return;
    }

    const { section, subsection } = sectionPath;

    // Check if section's feature flag is enabled
    if (!isSectionEnabled(section)) {
      sectionNavigationProcessedRef.current = true;
      sandbox.logger.warn(
        `Component=TimeEntrySettingsForm Event=SECTION_DISABLED section=${section}`,
      );
      // Clear loading state - load settings page normally
      if (isDeepLinkNavigating) {
        setIsDeepLinkNavigating(false);
      }
      return;
    }

    // Handle trowser sections (breaks, overtime, geolocations, customfields) - process immediately
    if (isTrowserSection(section)) {
      sectionNavigationProcessedRef.current = true;

      sandbox.logger.info(
        `Component=TimeEntrySettingsForm Event=SECTION_NAVIGATION section=${section} subsection=${
          subsection || 'none'
        }`,
      );

      if (section === SECTION_KEYS.BREAKS) {
        const options = buildBreaksWidgetOptions(sectionPath);
        if (options) {
          setBreaksInitialView(options);
        }
      } else if (section === SECTION_KEYS.OVERTIME) {
        const options = buildOvertimeWidgetOptions(sectionPath);
        if (options) {
          setOvertimeInitialView(options);
        }
      } else if (section === SECTION_KEYS.GEO_LOCATION) {
        const options = buildGeoLocationsOptions(sectionPath);
        if (options) {
          setGeoLocationsInitialOpen(true);
        }
      } else if (section === SECTION_KEYS.CUSTOM_FIELDS) {
        setCustomFieldsInitialOpen(true);
      }
      return;
    }

    // Handle inline edit sections (timetracking, timesheet, notifications, approvals)
    if (isInlineEditSection(section)) {
      const subsectionId = subsection
        ? getSubsectionElementId(section, subsection)
        : null;

      // Wait for the specific section to be ready
      const sectionReadyKey = section;
      if (!isSectionReady(sectionReadyKey)) {
        sandbox.logger.info(
          `Component=useDeepLinkNavigation Event=WAITING_FOR_SECTION_READY section=${sectionReadyKey}`,
        );
        return;
      }

      // Mark as processed and clear loader
      sectionNavigationProcessedRef.current = true;
      setIsDeepLinkNavigating(false);

      sandbox.logger.info(
        `Component=TimeEntrySettingsForm Event=SECTION_NAVIGATION section=${section} subsection=${
          subsection || 'none'
        }`,
      );

      // Set pending form type for component to handle
      const formType = sectionToFormType(section);
      if (formType) {
        setPendingFormType(formType);
      }

      // For notifications with a subsection - scroll to subsection
      if (section === SECTION_KEYS.NOTIFICATIONS && subsectionId) {
        sandbox.logger.info(
          `Component=TimeEntrySettingsForm Event=NOTIFICATION_SUBSECTION_SCROLL targetId=${subsectionId}`,
        );
        setPendingScrollTarget({
          elementId: subsectionId,
          delay: 500,
        });
        return;
      }

      // Scroll to section or subsection after a delay to allow edit mode to render
      const mainSectionId = sectionToElementId(section);
      const targetId = subsectionId || mainSectionId;

      sandbox.logger.info(
        `Component=TimeEntrySettingsForm Event=SCROLL_ATTEMPT targetId=${targetId} isSubsection=${!!subsectionId}`,
      );

      if (targetId) {
        setPendingScrollTarget({
          elementId: targetId,
          delay: 1000,
        });
      }
      return;
    }

    // Handle view-only sections (schedules, timeoff, kiosk) - wait for ready then scroll
    if (isViewOnlySection(section)) {
      sandbox.logger.info(
        `Component=useDeepLinkNavigation Event=VIEW_ONLY_SECTION_DETECTED section=${section} isReady=${isSectionReady(
          section,
        )}`,
      );

      // Wait for section to be ready
      if (!isSectionReady(section)) {
        sandbox.logger.info(
          `Component=useDeepLinkNavigation Event=WAITING_FOR_VIEW_ONLY_SECTION section=${section}`,
        );
        return;
      }

      sectionNavigationProcessedRef.current = true;
      setIsDeepLinkNavigating(false);

      const elementId = sectionToElementId(section);
      sandbox.logger.info(
        `Component=useDeepLinkNavigation Event=SCROLL_VIEW_ONLY elementId=${elementId}`,
      );
      if (elementId) {
        setPendingScrollTarget({
          elementId,
          delay: 1000,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    sectionPath,
    isDeepLinkNavigating,
    sectionsReady,
    featureFlagsLoading,
    isDeepLinkEnabled,
    isDeepLinkFlagSettled,
  ]);

  return {
    isDeepLinkNavigating,
    breaksInitialView,
    overtimeInitialView,
    geoLocationsInitialOpen,
    customFieldsInitialOpen,
    pendingFormType,
    pendingScrollTarget,
    clearPendingNavigation,
    publishNavigationComplete,
  };
};

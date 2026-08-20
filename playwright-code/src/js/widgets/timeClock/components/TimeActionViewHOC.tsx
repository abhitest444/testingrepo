/* eslint-disable no-nested-ternary */
import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { useIntl, useSandbox } from '@payroll/quicksand';
import { useLazySearchTimeEntries } from 'src/js/service/hooks/timeEntries/useLazySearchTimeEntries';
import { TimeTracking_TimeEntriesInput } from 'src/__generated__/timeTracking/graphql';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';

import { TIME_CLOCK_EVENTS, FEATURE_FLAGS } from 'src/js/common/constants';
import {
  useUxPreferences,
  UxPreferenceKey,
} from 'src/js/service/utils/useUXPreferences';
import { isIXPFeatureFlagEnabled } from 'src/js/service/utils/featureFlags';
import TimeActionButton from './TimeActionButton';
import { nameSpaceId } from '../utils/timeClockUtils';
import TimeClockPopoverTourAdapter from './TimeClockPopoverTourAdapter';

interface TimeActionViewHOCProps {
  open: boolean;
  onClick: () => void;
  setHasError: (error: Error | null) => void;
  employeeId?: string;
}

const TimeActionViewHOC: React.FC<TimeActionViewHOCProps> = ({
  onClick,
  open,
  setHasError,
  employeeId,
}) => {
  const intl = useIntl();
  const sandbox = useSandbox();

  const [tourPopover, setTourPopover] = useState(false);
  const [tourContext, setTourContext] = useState<
    'clock-in' | 'clock-out' | 'drawer-closed'
  >('clock-in');
  const popoverButtonRef = useRef<HTMLDivElement | null>(null);

  // Tour preference logic
  const {
    data: uxPreferencesData,
    setPreference,
    loading: uxPreferencesLoading,
    getPreference,
  } = useUxPreferences();

  const tourCompleted =
    uxPreferencesData?.[UxPreferenceKey.TIME_CLOCK_TOUR_COMPLETED] ?? false;

  // Load tour preference when component mounts
  useEffect(() => {
    getPreference(UxPreferenceKey.TIME_CLOCK_TOUR_COMPLETED);
  }, [getPreference]);

  const preferencesLoaded = !uxPreferencesLoading;
  const {
    query: searchActiveTimeEntries,
    data: activeTimeEntries,
    loading: activeTimeEntriesLoading,
    error: activeTimeEntriesError,
  } = useLazySearchTimeEntries();

  const [error, setError] = useState<boolean>(false);

  // Memoized effectiveId value
  const effectiveId = useMemo(() => employeeId || '', [employeeId]);

  useEffect(() => {
    sandbox.logger.info(
      '[CLOCK_IN_FLOW] - TimeActionViewHOC - TimeActionViewHOC MOUNTED',
    );
  }, []);

  const searchTimeEntries = useCallback(async () => {
    if (!effectiveId) return;

    sandbox.logger.info(
      '[CLOCK_IN_FLOW] - TimeActionViewHOC - Searching for active time entries',
      { open },
    );
    createCustomerInteraction(
      sandbox,
      TimeCustomerInteraction.ACTIVE_TIME_ENTRY_READ,
    );

    const input: TimeTracking_TimeEntriesInput = {
      timeEntryFilter: {
        isExported: false,
        isOpen: true,
        timeForEntityId: {
          equals: effectiveId,
        },
      },
    };

    try {
      await searchActiveTimeEntries({
        variables: { input },
        context: {
          headers: getCustomerInteractionPropagationHeaders(
            sandbox,
            TimeCustomerInteraction.ACTIVE_TIME_ENTRY_READ,
          ),
        },
      });
      sandbox.logger.info(
        '[CLOCK_IN_FLOW] - TimeActionViewHOC - Successfully searched for active time entries',
        { activeTimeEntries },
      );
      endInteractionWithSuccess(
        sandbox,
        TimeCustomerInteraction.ACTIVE_TIME_ENTRY_READ,
      );
    } catch (error) {
      sandbox.logger.logException(
        '[CLOCK_IN_FLOW] - TimeActionViewHOC - Error searching for active time entries',
        error as Error,
      );
      endInteractionWithFailure(
        sandbox,
        TimeCustomerInteraction.ACTIVE_TIME_ENTRY_READ,
        'QUERY_ERROR',
        error as Error,
      );
    }
  }, [effectiveId, sandbox, open, searchActiveTimeEntries, activeTimeEntries]);

  useEffect(() => {
    // Only call API if drawer is closed and effectiveId is set
    if (!open && effectiveId) {
      searchTimeEntries();
    }
  }, [open, effectiveId]);

  useEffect(() => {
    /**
     * This listener is used to search for time entries when the time clock is closed.
     * So that we can refresh the TimeAction Button
     */
    const subscriptionId = sandbox.pubsub.subscribe(
      TIME_CLOCK_EVENTS.CLOSE,
      async (isActiveTimeEntry) => {
        // To reset the banner when the time clock is closed
        setHasError(null);
        searchTimeEntries();

        const enabled = await isIXPFeatureFlagEnabled(
          sandbox,
          FEATURE_FLAGS.QB_TIME_TRACKING_UI_TIME_CLOCK_TOUR,
        );

        // Trigger tour when drawer closes if conditions are met
        if (
          isActiveTimeEntry &&
          !tourCompleted &&
          enabled &&
          preferencesLoaded &&
          !tourPopover
        ) {
          setTourContext('drawer-closed');
          setTourPopover(true);
        }
      },
    );
    return () => {
      sandbox.pubsub.unsubscribe(subscriptionId);
    };
  }, [
    sandbox.pubsub,
    effectiveId,
    open,
    searchTimeEntries,
    preferencesLoaded,
    tourPopover,
    sandbox,
    setHasError,
    tourCompleted,
  ]);

  useEffect(() => {
    if (!open) {
      if (activeTimeEntriesError) {
        setError(true);
        setHasError(new Error(activeTimeEntriesError));
      } else {
        setError(false);
      }
    }
  }, [open, activeTimeEntriesError, setHasError]);

  const hasOpenTimeEntry = activeTimeEntries && activeTimeEntries.length > 0;
  const openTimeEntry =
    hasOpenTimeEntry && activeTimeEntries ? activeTimeEntries[0] : null;

  const variant = useMemo(() => {
    if (error) {
      return 'text';
    }
    return hasOpenTimeEntry ? 'circle-stopwatch' : 'text-only';
  }, [error, hasOpenTimeEntry]);

  return (
    <>
      <div ref={popoverButtonRef}>
        <TimeActionButton
          text={
            error
              ? intl.formatMessage({ id: 'timeclock.clockIn' })
              : hasOpenTimeEntry
              ? intl.formatMessage({ id: 'timeclock.clockOut' })
              : intl.formatMessage({ id: 'timeclock.clockIn' })
          }
          purpose="standard"
          priority="secondary"
          variant={variant}
          disabled={activeTimeEntriesLoading}
          onClick={onClick}
          startTime={openTimeEntry?.startTime}
        />
      </div>
      <TimeClockPopoverTourAdapter
        open={tourPopover}
        onClose={() => setTourPopover(false)}
        onFinish={() => {
          setPreference(UxPreferenceKey.TIME_CLOCK_TOUR_COMPLETED, true);
        }}
        targetElement={popoverButtonRef.current}
        stepTargetElement={popoverButtonRef.current}
        isClockedIn={!!hasOpenTimeEntry}
        tourContext={tourContext}
      />
    </>
  );
};

export default TimeActionViewHOC;

/* eslint-disable no-nested-ternary */
import React, { useCallback, useEffect, useState } from 'react';
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
import { useLazyGetTSheetsWorkerById } from 'src/js/service/hooks/employee/useLazyGetTSheetsWorkerById';
import { TIME_CLOCK_EVENTS } from 'src/js/common/constants';
import TimeActionButton from 'src/js/widgets/timeClock/components/TimeActionButton';
import { nameSpaceId } from '../utils/timeClockUtils';

interface TimeActionViewProps {
  open: boolean;
  onClick: () => void;
  setHasError: (error: Error | null) => void;
}

export const TimeActionView: React.FC<TimeActionViewProps> = ({
  onClick,
  open,
  setHasError,
}) => {
  const intl = useIntl();
  const sandbox = useSandbox();
  const {
    query: getEmployeeByUserId,
    data: employeeData,
    loading: employeeLoading,
    error: employeeError,
  } = useLazyGetTSheetsWorkerById();
  const {
    query: searchActiveTimeEntries,
    data: activeTimeEntries,
    loading: activeTimeEntriesLoading,
    error: activeTimeEntriesError,
  } = useLazySearchTimeEntries();
  const [employeeId, setEmployeeId] = useState<string>('');
  const [profileId, setProfileId] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  const getEffectiveId = useCallback(
    () => employeeId || profileId,
    [employeeId, profileId],
  );

  useEffect(() => {
    sandbox.logger.info(
      '[CLOCK_IN_FLOW] - TimeActionView - TimeActionView MOUNTED',
    );
  }, []);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      const authId = sandbox.appContext.getUserAuthInfo()?.authId;
      if (authId) {
        getEmployeeByUserId({
          variables: {
            id: authId,
          },
        });
      }
    };
    fetchEmployeeData();
  }, [sandbox, getEmployeeByUserId]);

  useEffect(() => {
    if (!employeeData) return;

    // TSheets API returns employeeId directly in the response
    const { employeeId, profileId } = employeeData;

    // Set both IDs for potential fallback usage
    if (employeeId) {
      setEmployeeId(employeeId);
    }
    if (profileId) {
      setProfileId(profileId);
    }
  }, [employeeData]);

  const searchTimeEntries = useCallback(async () => {
    const effectiveId = getEffectiveId();
    if (!effectiveId) return;

    sandbox.logger.info(
      '[CLOCK_IN_FLOW] - TimeActionView - Searching for active time entries',
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
        '[CLOCK_IN_FLOW] - TimeActionView - Successfully searched for active time entries',
        { activeTimeEntries },
      );
      endInteractionWithSuccess(
        sandbox,
        TimeCustomerInteraction.ACTIVE_TIME_ENTRY_READ,
      );
    } catch (error) {
      sandbox.logger.logException(
        '[CLOCK_IN_FLOW] - TimeActionView - Error searching for active time entries',
        error as Error,
      );
      endInteractionWithFailure(
        sandbox,
        TimeCustomerInteraction.ACTIVE_TIME_ENTRY_READ,
        'QUERY_ERROR',
        error as Error,
      );
    }
  }, [
    getEffectiveId,
    sandbox,
    open,
    searchActiveTimeEntries,
    activeTimeEntries,
  ]);

  useEffect(() => {
    const effectiveId = getEffectiveId();
    if (!open && effectiveId) {
      searchTimeEntries();
    }
  }, [open, getEffectiveId, searchTimeEntries]);

  useEffect(() => {
    const subscriptionId = sandbox.pubsub.subscribe(
      TIME_CLOCK_EVENTS.CLOSE,
      (data) => {
        if (data) {
          setHasError(null);
          searchTimeEntries();
        }
      },
    );
    return () => {
      sandbox.pubsub.unsubscribe(subscriptionId);
    };
  }, [sandbox.pubsub, searchTimeEntries]);

  useEffect(() => {
    if (!open) {
      if (employeeError || activeTimeEntriesError) {
        setError(true);
        setHasError(new Error(employeeError || activeTimeEntriesError));
      } else {
        setError(false);
      }
    }
  }, [open, employeeError, activeTimeEntriesError, setHasError, sandbox]);

  const hasOpenTimeEntry = activeTimeEntries && activeTimeEntries.length > 0;
  const openTimeEntry =
    hasOpenTimeEntry && activeTimeEntries ? activeTimeEntries[0] : null;

  return (
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
      variant={error ? 'text' : hasOpenTimeEntry ? 'circle-stopwatch' : 'text'}
      disabled={activeTimeEntriesLoading || employeeLoading}
      onClick={onClick}
      startTime={openTimeEntry?.startTime}
    />
  );
};

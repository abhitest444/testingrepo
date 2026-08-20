import React, { Suspense, useEffect, useMemo } from 'react';
import { Sandbox } from 'src/js/common/sandbox';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';
import { FEATURE_FLAGS } from 'src/js/common/constants';
import { TimeTracking_TimeForType } from 'src/__generated__/timeTracking/graphql';
import { useTimeTrackingWorkers } from 'src/js/service/hooks/groups/useTimeTrackingWorkers';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';
import { TIME_CLOCK_FEATURE, TIME_CLOCK_FUNCTIONALITY } from '../Widget';

const TimeActionView = React.lazy(() => import('./TimeActionViewHOC'));
const TimeClockView = React.lazy(() => import('./TimeClockHOC'));

interface TimeClockContentProps {
  options: {
    feature: TIME_CLOCK_FEATURE;
    functionality: TIME_CLOCK_FUNCTIONALITY;
  };
  open?: boolean;
  setOpen?: (open: boolean) => void;
  onClick?: () => void;
  setHasError?: (error: Error | null) => void;
  sandbox: Sandbox;
  employeeId?: string;
}

const TimeClockContent: React.FC<TimeClockContentProps> = ({
  options,
  open = false,
  setOpen = () => {},
  onClick = () => {},
  setHasError = () => {},
  sandbox,
  employeeId: employeeIdProp,
}) => {
  const { isEnabled: isLegacyQboUserEnabled } = useIXPFeatureFlag({
    flagName: FEATURE_FLAGS.QB_TIME_TRACKING_UI_ENABLE_LEGACY_QBO_USER,
    defaultValue: false,
  });

  const authId = useMemo(
    () =>
      isLegacyQboUserEnabled
        ? sandbox.appContext.getUserAuthInfo()?.authId || ''
        : '',
    [isLegacyQboUserEnabled, sandbox],
  );

  const { workers, loadWorkers } = useTimeTrackingWorkers();

  useEffect(() => {
    if (!isLegacyQboUserEnabled || !authId) return;
    loadWorkers({
      first: 1,
      filter: {
        identityAuthIds: [authId],
        isActive: true,
      },
    });
  }, [isLegacyQboUserEnabled, authId, loadWorkers]);

  const worker = isLegacyQboUserEnabled ? workers?.[0] : undefined;

  // FF off: keep the legacy `employeeId` prop and force EMPLOYEE timeForType.
  // FF on:  derive both from the worker resolved via authId.
  const employeeId =
    isLegacyQboUserEnabled && !isWorkforceEnvironment(sandbox)
      ? worker?.id || ''
      : employeeIdProp || '';

  const timeForType: TimeTracking_TimeForType =
    worker?.type === TimeTracking_TimeForType.LegacyQboUser
      ? TimeTracking_TimeForType.LegacyQboUser
      : TimeTracking_TimeForType.Employee;

  const renderFeature = () => {
    if (options.feature === 'time-action') {
      if (options.functionality === 'action-button') {
        return (
          <TimeActionView
            open={open}
            onClick={onClick}
            setHasError={setHasError}
            employeeId={employeeId}
          />
        );
      }
      return null;
    }
    if (options.feature === 'time-clock') {
      if (options.functionality === 'clock-form' && open) {
        return (
          <TimeClockView
            open={open}
            setOpen={setOpen}
            employeeId={employeeId}
            timeForType={timeForType}
          />
        );
      }
      return null;
    }
    return null;
  };

  return (
    <Suspense fallback={null}>
      <div className="time-clock-widget">{renderFeature()}</div>
    </Suspense>
  );
};

export default TimeClockContent;

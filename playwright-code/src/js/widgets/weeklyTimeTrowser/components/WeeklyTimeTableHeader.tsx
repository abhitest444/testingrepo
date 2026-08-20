import React, { useRef, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import dayjs from 'dayjs';
import styled from 'styled-components';
import Widget from 'web-shell-core/widgets/HOCWidget';
import {
  useAuthorization,
  useIntl,
  useSandbox,
  useStorage,
  useTracking,
} from '@payroll/quicksand';
import GuidanceTooltip from '@ids-ts/guidance-tooltip';

import {
  Week,
  WeekSelector,
} from 'src/js/widgets/weeklyTimeTrowser/components/WeekSelector';
import {
  mapTimeForState,
  TimeForFormState,
  TimeForType,
} from 'src/js/widgets/common/addTimeFormComponents/TeamMember';
import { WeeklyUnsavedChangesModal } from 'src/js/widgets/common/WeeklyUnsavedChangesModal';
import { WEEKLY_TIME_TRACKING_POINTS } from 'src/js/common/useClickTracking';
import { WeeklyTimeFormState } from 'src/js/widgets/weeklyTimeTrowser/hooks/useWeeklyTimeForm';
import { TimeTrackingCompanySettings } from 'src/js/service/hooks/settings/useCompanySettings';
import { isEmptyObject } from '../../../service/utils/objectUtils';
import {
  TEAM_MEMBER_FIELD_WIDTH,
  WEEK_FIELD_WIDTH,
} from '../../../common/constants';
import { isTimeTrackingOnlyRole } from '../../../service/utils/sandboxUtils';

const WeeklyTimeTableHeaderContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 5px;
  flex: 0 1 auto;
  margin-top: -10px;
`;

export interface WeeklyTimeTableHeaderProps {
  settings: TimeTrackingCompanySettings;
  timeTrackingOnlyId?: string;
  setOnTeamMemberLoaded?: (isLoaded: boolean) => void;
}

export const WeeklyTimeTableHeader = ({
  settings,
  timeTrackingOnlyId,
  setOnTeamMemberLoaded,
}: WeeklyTimeTableHeaderProps) => {
  const sandbox = useSandbox();

  const teamMemberRef = useRef(null);
  const widgetOnReadyFired = useRef(false);
  const [showSelectTeamMemberTooltip, setShowSelectTeamMemberTooltip] =
    useStorage('ttui-showSelectTeamMemberTooltip-weekly') as [
      boolean,
      (value: boolean) => void,
    ];

  // -------------------------------- context hooks
  const intl = useIntl();
  const track = useTracking();
  const startDate = dayjs().day(settings.firstDayOfWeek);

  // -------------------------------- component state hooks
  const [pendingChanges, setPendingChanges] = useState<{
    week?: Week;
    timeFor?: TimeForFormState;
  }>({});
  const [modalOpen, setModalOpen] = useState<{
    week: boolean;
    timeFor: boolean;
  }>({ week: false, timeFor: false });

  const refreshWeekKey = `${startDate}-${pendingChanges.week?.endDate?.toString()}-${pendingChanges.week?.startDate?.toString()}`;
  const refreshTeamMemberKey = `${pendingChanges.timeFor?.id?.toString()}-${pendingChanges.timeFor?.id?.toString()}`;

  const weeklyTimeSheetFormMethods = useFormContext<WeeklyTimeFormState>();

  const { decision } = useAuthorization({
    resource: { id: 'irn:intuit::contacts:names:vendor:ui:v4' },
    action: { id: 'create' },
  });
  // -------------------------------- component interaction handlers

  const handleChange = (
    type: 'week' | 'timeFor',
    newValue: Week | TimeForFormState,
    onChange: Function,
  ) => {
    if (
      // TODO use areWeeklyTimeFormStatesEqual
      !isEmptyObject(
        weeklyTimeSheetFormMethods.formState.dirtyFields.weeklyTimeRows,
      )
    ) {
      setPendingChanges((prev) => ({ ...prev, [type]: newValue }));
      setModalOpen((prev) => ({ ...prev, [type]: true }));
    } else {
      onChange(newValue);
    }
  };

  const confirmChange = (type: 'week' | 'timeFor', onChange: Function) => {
    const pendingValue = pendingChanges[type];
    if (pendingValue) {
      if (type === 'timeFor') {
        weeklyTimeSheetFormMethods.setValue(
          'timeFor',
          pendingValue as TimeForFormState,
          {
            shouldDirty: true,
          },
        );
      }
      onChange(pendingValue);
    }
    handleClose();
  };

  const handleClose = () => {
    setPendingChanges({});
    setModalOpen({ week: false, timeFor: false });
  };

  const handleCancelChange = (type: 'week' | 'timeFor') => {
    weeklyTimeSheetFormMethods.setValue(
      type,
      weeklyTimeSheetFormMethods.getValues()[type],
    );
    handleClose();
  };

  return (
    <WeeklyTimeTableHeaderContainer>
      <Controller
        key={refreshTeamMemberKey}
        name="timeFor"
        rules={{
          validate: (value: TimeForFormState) => {
            if (!value?.id || !value?.type) {
              return intl.formatMessage({ id: 'drawer.field.required' });
            }
            return undefined;
          },
        }}
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <>
            <div
              ref={teamMemberRef}
              aria-label="weekly-team-member-dropdown"
              data-testid="weekly-team-member-field"
            >
              <Widget
                widgetId="qbo-quickfills-ui/quickfills"
                type="contact"
                shouldShowSubLabel
                addNew={decision?.isAuthorized || false}
                subTypes={['employee', 'vendor']}
                value={timeTrackingOnlyId || value.id}
                disabled={!!timeTrackingOnlyId}
                onChange={(e: any) => {
                  track(WEEKLY_TIME_TRACKING_POINTS.TEAM_MEMBER);

                  handleChange('timeFor', mapTimeForState(e), onChange);
                }}
                placeholder={intl.formatMessage({
                  id: 'team.member.placeholder',
                })}
                label={intl.formatMessage({ id: 'team.member' })}
                errorText={error?.message}
                onReady={() => {
                  if (
                    !timeTrackingOnlyId &&
                    !widgetOnReadyFired.current &&
                    !value.id
                  ) {
                    // This onReady fires when the widget initially loads
                    // and again when you interact with it the first time.
                    // Also, it fires a 2nd time if you haven't yet interacted with it
                    // and you close the trowser. So, we'll track the first time it fires
                    // to ensure that the tooltip doesn't show up after someone
                    // already dismissed it and then hovers over the dropdown to select
                    // a team member.
                    widgetOnReadyFired.current = true;
                    setShowSelectTeamMemberTooltip(true);
                  }
                  setOnTeamMemberLoaded?.(true);
                }}
                onLoad={(item: any) => {
                  // Adding logging due to isuses with some time tracking only users
                  if (isTimeTrackingOnlyRole(sandbox) && !timeTrackingOnlyId) {
                    sandbox.logger.error(
                      'WeeklyTimeTableHeader quickfills onLoad: timeTrackingOnlyId missing for time tracking only user!',
                    );
                  }

                  // Get the worker type when quickfills loads
                  const updatedValue = {
                    name: item?.contact?.displayName,
                    id: item?.contact?.id,
                    type: item?.contact?.type as TimeForType,
                  };
                  onChange(updatedValue);
                }}
                width={TEAM_MEMBER_FIELD_WIDTH}
                excludePayrollInactiveEmployees
              />
            </div>
            <GuidanceTooltip
              targetElement={teamMemberRef.current || undefined}
              dismissible
              title={intl.formatMessage({
                id: 'select.team.member.tooltip.title',
              })}
              open={showSelectTeamMemberTooltip}
              message={intl.formatMessage({
                id: 'select.team.member.tooltip.message',
              })}
              onClose={() => setShowSelectTeamMemberTooltip(false)}
              position="bottom"
              alignment="left"
              enableClickAway
            />
            <WeeklyUnsavedChangesModal
              open={modalOpen.timeFor}
              labelKey="weekly.unsaved.changes.content.team.member"
              onYesClick={() => confirmChange('timeFor', onChange)}
              onNoClick={() => {
                handleCancelChange('timeFor');
              }}
              onClose={() => {
                handleCancelChange('timeFor');
              }}
            />
          </>
        )}
      />
      <Controller
        key={refreshWeekKey}
        name="week"
        render={({ field: { onChange, value } }) => (
          <>
            <WeekSelector
              // key={refreshWeekKey}
              value={value}
              startDate={startDate}
              onChange={(newValue) => {
                track(WEEKLY_TIME_TRACKING_POINTS.WEEK);
                handleChange('week', newValue, onChange);
              }}
              width={WEEK_FIELD_WIDTH}
            />
            <WeeklyUnsavedChangesModal
              open={modalOpen.week}
              labelKey="weekly.unsaved.changes.content.week"
              onYesClick={() => confirmChange('week', onChange)}
              onNoClick={() => {
                handleCancelChange('week');
              }}
              onClose={() => {
                handleCancelChange('week');
              }}
            />
          </>
        )}
      />
    </WeeklyTimeTableHeaderContainer>
  );
};

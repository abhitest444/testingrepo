import React from 'react';
import { useIntl, useTracking } from '@payroll/quicksand';
import Typography from '@ids-ts/typography';
import { RadioGroup, RadioOnChangeEventType } from '@ids-ts/radio';
import {
  BoldLabel,
  SectionContainer,
} from 'src/js/widgets/timeTrackingSettings/common/viewContent';
import { SCHEDULE_SETTINGS_TRACKING_POINTS } from 'src/js/widgets/timeTrackingSettings/tracking/scheduleSettingsTrackingPoints';
import {
  SCHEDULE_MANAGE_OPTIONS,
  SCHEDULE_VIEW_OPTIONS,
  SCHEDULE_MANAGE_PREFERENCE_MESSAGE_IDS,
  SCHEDULE_VIEW_PREFERENCE_MESSAGE_IDS,
  type ScheduleManagePreference,
  type ScheduleViewPreference,
} from './constants';
import { getIsViewOptionDisabled } from './scheduleSettingsEdit.utils';
import { EditForm, RadioStack } from './SchedulesTimeEntrySettings.styled';

export interface SchedulesTimeEntrySettingsEditProps {
  draftView: ScheduleViewPreference;
  draftManage: ScheduleManagePreference;
  onDraftViewChange: (value: ScheduleViewPreference) => void;
  /** Parent should coerce view when manage changes (see `coerceViewForManage`). */
  onDraftManageChange: (value: ScheduleManagePreference) => void;
}

export const SchedulesTimeEntrySettingsEdit = ({
  draftView,
  draftManage,
  onDraftViewChange,
  onDraftManageChange,
}: SchedulesTimeEntrySettingsEditProps) => {
  const intl = useIntl();
  const track = useTracking();

  const VIEW_TRACKING_MAP: Record<
    ScheduleViewPreference,
    (typeof SCHEDULE_SETTINGS_TRACKING_POINTS)[string]
  > = {
    their_own: SCHEDULE_SETTINGS_TRACKING_POINTS.SCHEDULE_VIEW_THEIR_OWN,
    group: SCHEDULE_SETTINGS_TRACKING_POINTS.SCHEDULE_VIEW_GROUP,
    company: SCHEDULE_SETTINGS_TRACKING_POINTS.SCHEDULE_VIEW_COMPANY,
  };

  const MANAGE_TRACKING_MAP: Record<
    ScheduleManagePreference,
    (typeof SCHEDULE_SETTINGS_TRACKING_POINTS)[string]
  > = {
    none: SCHEDULE_SETTINGS_TRACKING_POINTS.SCHEDULE_MANAGE_NONE,
    their_own: SCHEDULE_SETTINGS_TRACKING_POINTS.SCHEDULE_MANAGE_THEIR_OWN,
    group: SCHEDULE_SETTINGS_TRACKING_POINTS.SCHEDULE_MANAGE_GROUP,
    company: SCHEDULE_SETTINGS_TRACKING_POINTS.SCHEDULE_MANAGE_COMPANY,
  };

  const viewOptions = SCHEDULE_VIEW_OPTIONS.map((value) => ({
    value,
    label: intl.formatMessage({
      id: SCHEDULE_VIEW_PREFERENCE_MESSAGE_IDS[value],
    }),
    disabled: getIsViewOptionDisabled(value, draftManage),
  }));

  const manageOptions = SCHEDULE_MANAGE_OPTIONS.map((value) => ({
    value,
    label: intl.formatMessage({
      id: SCHEDULE_MANAGE_PREFERENCE_MESSAGE_IDS[value],
    }),
  }));

  const text = (id: string) => intl.formatMessage({ id });

  const viewFieldLabel = (
    <Typography weight="demi" variant="body-2" as="span">
      {text(
        'time-entries.section.title.schedules.workers-can-view-schedules-of',
      )}
    </Typography>
  );

  const manageFieldLabel = (
    <Typography weight="demi" variant="body-2" as="span">
      {text(
        'time-entries.section.title.schedules.workers-can-manage-schedules-for',
      )}
    </Typography>
  );

  return (
    <SectionContainer>
      <EditForm data-testid="schedules-edit-form">
        <BoldLabel index={0}>
          {text('time-entries.section.title.schedules.preferences')}
        </BoldLabel>
        <RadioStack>
          <RadioGroup
            label={viewFieldLabel}
            options={viewOptions}
            value={draftView}
            name="schedules-view-preference"
            aria-label={text(
              'time-entries.section.title.schedules.workers-can-view-schedules-of',
            )}
            size="medium"
            onChange={(e: RadioOnChangeEventType) => {
              const value = e.target.value as ScheduleViewPreference;
              track(VIEW_TRACKING_MAP[value]);
              onDraftViewChange(value);
            }}
          />
          <RadioGroup
            label={manageFieldLabel}
            options={manageOptions}
            value={draftManage}
            name="schedules-manage-preference"
            aria-label={text(
              'time-entries.section.title.schedules.workers-can-manage-schedules-for',
            )}
            size="medium"
            onChange={(e: RadioOnChangeEventType) => {
              const value = e.target.value as ScheduleManagePreference;
              track(MANAGE_TRACKING_MAP[value]);
              onDraftManageChange(value);
            }}
          />
        </RadioStack>
      </EditForm>
    </SectionContainer>
  );
};

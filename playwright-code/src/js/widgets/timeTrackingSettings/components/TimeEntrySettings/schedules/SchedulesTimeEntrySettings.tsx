import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useSandbox, useIntl, useTracking } from '@payroll/quicksand';
import SettingsSection from '@payroll-shared-components/payroll-settings-section';
import { useTimeTrackingSettingsContext } from 'src/js/widgets/timeTrackingSettings/context/TimeTrackingSettingsContext';
import { useRenderTitleWithBadge } from 'src/js/hooks/useRenderTitleWithBadge';
import { ViewContent } from 'src/js/widgets/timeTrackingSettings/common/viewContent';
import { IFormConfig } from 'src/js/widgets/timeTrackingSettings/types';
import { SCHEDULE_SETTINGS_CONFIG } from 'src/js/widgets/timeTrackingSettings/common/viewForm';
import { timeEntrySettingsDefaultState } from 'src/js/service/hooks/settings/useGetQLSettings';
import { useSetQLSettings } from 'src/js/service/hooks/settings/useSetQLSettings';
import {
  mapScheduleManagePreferenceToApi,
  mapScheduleViewPreferenceToApi,
} from 'src/js/widgets/timeTrackingSettings/utils';
import {
  SECTION_READY_EVENT,
  SECTION_READY_KEYS,
} from 'src/js/common/constants';
import { SCHEDULE_SETTINGS_TRACKING_POINTS } from 'src/js/widgets/timeTrackingSettings/tracking/scheduleSettingsTrackingPoints';
import {
  PAYROLL_SETTINGS_SECTION_MODE,
  SCHEDULE_MANAGE_PREFERENCE_MESSAGE_IDS,
  SCHEDULE_VIEW_PREFERENCE_MESSAGE_IDS,
  type ScheduleManagePreference,
  type ScheduleViewPreference,
} from './constants';
import { SchedulesTimeEntrySettingsEdit } from './SchedulesTimeEntrySettingsEdit';
import { SchedulesEditSurface } from './SchedulesTimeEntrySettings.styled';
import { coerceViewForManage } from './scheduleSettingsEdit.utils';

export const SchedulesTimeEntrySettings = () => {
  const sandbox = useSandbox();
  const intl = useIntl();
  const track = useTracking();
  const {
    timeEntryNewBadgeVisibleFor,
    isFormEditable,
    QLData,
    QLSettingsError,
    isQLSettingsLoading,
    refetchQlSettings,
  } = useTimeTrackingSettingsContext(false);

  const hasQlFetchError = !!(QLSettingsError && QLSettingsError !== '');

  const savedManage = (
    QLData.scheduleManagePreference
      ? QLData.scheduleManagePreference.value
      : timeEntrySettingsDefaultState.scheduleManagePreference?.value
  ) as ScheduleManagePreference;

  const savedView = (
    QLData.scheduleViewPreference
      ? QLData.scheduleViewPreference.value
      : timeEntrySettingsDefaultState.scheduleViewPreference?.value
  ) as ScheduleViewPreference;

  const scheduleManageVersion =
    QLData.scheduleManagePreference?.version ??
    timeEntrySettingsDefaultState.scheduleManagePreference?.version ??
    '0';

  const scheduleViewVersion =
    QLData.scheduleViewPreference?.version ??
    timeEntrySettingsDefaultState.scheduleViewPreference?.version ??
    '0';

  // Publish section ready when employer settings have loaded successfully
  useEffect(() => {
    if (isQLSettingsLoading || !QLData || hasQlFetchError) {
      return;
    }
    // log successful load of schedules settings
    sandbox.logger.info(
      'Component=SchedulesTimeEntrySettings Event=SECTION_READY section=SCHEDULES',
    );
    sandbox.pubsub.publish(SECTION_READY_EVENT, {
      section: SECTION_READY_KEYS.SCHEDULES,
    });
    track(SCHEDULE_SETTINGS_TRACKING_POINTS.SCHEDULE_PREFS_VIEW);
  }, [hasQlFetchError, isQLSettingsLoading, QLData, sandbox, track]);

  const [isEdit, setIsEdit] = useState(false);
  const [draftManage, setDraftManage] =
    useState<ScheduleManagePreference>(savedManage);
  const [draftView, setDraftView] = useState<ScheduleViewPreference>(() =>
    coerceViewForManage(savedView, savedManage),
  );

  // Keep edit drafts aligned with API when in view mode (refetch or first paint after load)
  useEffect(() => {
    if (isEdit) {
      return;
    }
    setDraftManage(savedManage);
    setDraftView(coerceViewForManage(savedView, savedManage));
  }, [isEdit, savedManage, savedView]);
  const [scheduleSaveError, setScheduleSaveError] = useState('');

  const [saveScheduleSettings, { loading: scheduleSaving }] = useSetQLSettings({
    onSuccess: () => {
      sandbox.logger.info(
        'Component=SchedulesTimeEntrySettings Event=SAVE_SUCCESS section=SCHEDULES',
      );
      setScheduleSaveError('');
      // Fire-and-forget refetch (fetchQLSettings does not return a usable Promise)
      refetchQlSettings();
      setIsEdit(false);
    },
    onError: (error) => {
      const msg =
        typeof error === 'string' && error.length > 0
          ? error
          : intl.formatMessage({ id: 'catch.all.error.content' });
      sandbox.logger.error(
        'Component=SchedulesTimeEntrySettings Event=SAVE_ERROR section=SCHEDULES',
        { error: msg },
      );
      setScheduleSaveError(msg);
    },
  });
  const title = useRenderTitleWithBadge(
    'time-entries.section.title.schedules',
    true,
    timeEntryNewBadgeVisibleFor.schedulesVisibilityEndDate,
  );

  const scheduleFields: IFormConfig = useMemo(() => {
    const template =
      SCHEDULE_SETTINGS_CONFIG['time-entries.section.title.schedules'];
    const preferencesHeader = template.find(
      (f) => f.key === 'schedulesPreferencesHeader',
    )!;
    const viewRow = template.find((f) => f.key === 'viewSchedule')!;
    const manageRow = template.find((f) => f.key === 'manageSchedule')!;

    return {
      'time-entries.section.title.schedules': [
        { ...preferencesHeader },
        {
          ...viewRow,
          value: SCHEDULE_VIEW_PREFERENCE_MESSAGE_IDS[savedView],
        },
        {
          ...manageRow,
          value: SCHEDULE_MANAGE_PREFERENCE_MESSAGE_IDS[savedManage],
        },
      ],
    };
  }, [savedManage, savedView]);

  const handleDraftManageChange = (value: ScheduleManagePreference) => {
    setDraftManage(value);
    setDraftView((prev: ScheduleViewPreference) =>
      coerceViewForManage(prev, value),
    );
  };

  const handleEdit = () => {
    sandbox.logger.info(
      'Component=SchedulesTimeEntrySettings Event=Edit_Mode_Opened section=SCHEDULES',
    );
    track(SCHEDULE_SETTINGS_TRACKING_POINTS.SCHEDULE_PREFS_SECTION_EDIT);
    setScheduleSaveError('');
    setDraftManage(savedManage);
    setDraftView(coerceViewForManage(savedView, savedManage));
    setIsEdit(true);
  };

  const handleCancel = () => {
    track(SCHEDULE_SETTINGS_TRACKING_POINTS.SCHEDULE_PREFS_CANCEL);
    setScheduleSaveError('');
    setIsEdit(false);
  };

  const handleSave = useCallback(() => {
    const viewToSave = coerceViewForManage(draftView, draftManage);
    track({
      ...SCHEDULE_SETTINGS_TRACKING_POINTS.SCHEDULE_PREFS_SAVE,
      view_schedule_setting: viewToSave,
      manage_schedule_setting: draftManage,
    });
    // No changes to save
    if (draftManage === savedManage && viewToSave === savedView) {
      setScheduleSaveError('');
      setIsEdit(false);
      return;
    }
    // Save changes
    saveScheduleSettings({
      scheduleSettings: {
        manage: {
          version: scheduleManageVersion,
          value: mapScheduleManagePreferenceToApi(draftManage),
        },
        view: {
          version: scheduleViewVersion,
          value: mapScheduleViewPreferenceToApi(viewToSave),
        },
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    draftManage,
    draftView,
    scheduleManageVersion,
    scheduleViewVersion,
    saveScheduleSettings,
    savedManage,
    savedView,
    track,
  ]);

  return (
    <SettingsSection
      mode={
        isEdit
          ? PAYROLL_SETTINGS_SECTION_MODE.EDIT
          : PAYROLL_SETTINGS_SECTION_MODE.VIEW
      }
      readonly={isEdit ? false : !isFormEditable || hasQlFetchError}
      saveButtonText={isEdit ? intl.formatMessage({ id: 'save' }) : ''}
      cancelButtonText={isEdit ? intl.formatMessage({ id: 'cancel' }) : ''}
      editIconAriaLabel={intl.formatMessage({ id: 'edit' })}
      id="schedules-settings-handle"
      title={title}
      viewContent={
        <ViewContent
          formFields={scheduleFields}
          isErrorInView={hasQlFetchError}
        />
      }
      editContent={
        <SchedulesEditSurface>
          <SchedulesTimeEntrySettingsEdit
            draftView={draftView}
            draftManage={draftManage}
            onDraftViewChange={setDraftView}
            onDraftManageChange={handleDraftManageChange}
          />
        </SchedulesEditSurface>
      }
      onEdit={handleEdit}
      onCancel={handleCancel}
      onSave={handleSave}
      errorMessage={scheduleSaveError}
      saving={scheduleSaving}
    />
  );
};

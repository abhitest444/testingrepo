import React, { useState, useRef } from 'react';
import { B2, Demi, H6 } from '@ids-ts/typography';
import { Button } from '@ids-ts/button';
import { RadioGroup } from '@ids-ts/radio';
import { Dropdown, MenuItem } from '@ids-ts/dropdown';
import { Checkbox } from '@ids-ts/checkbox';
import { Activity } from '@ids-ts/loader';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import { WORKER_NOTIFICATIONS_CARD_TRACKING_POINTS } from 'src/js/widgets/userSettings/utils/userSettingsTrackingPoints';
import { useManageUserOvertimeNotifications } from 'src/js/service/hooks/userLevelSettings/useManageUserOvertimeNotifications';
import { useManageUserScheduleNotifications } from 'src/js/service/hooks/userLevelSettings/useManageUserScheduleNotifications';
import { useManageUserSettings } from 'src/js/service/hooks/userLevelSettings/useManageUserSettings';
import { TimeCustomerInteraction } from 'src/js/common/CustomerInteraction';
import type {
  TimeTracking_OvertimeNotificationRule,
  TimeTrackingEffectiveUserSettingsQuery,
} from 'src/__generated__/timeTracking/graphql';
import {
  useAppDispatch,
  useAppSelector,
} from 'src/js/widgets/userSettings/store';
import {
  updateDraft,
  saveSettings,
  commitDraft,
  cancelEdit,
  selectNotificationsDraftSettings,
  selectNotificationsSettings,
} from 'src/js/widgets/userSettings/store/slices/notificationsSlice';
import {
  cancelOvertimeNotificationsDraft,
  selectOvertimeNotificationDraftRules,
  selectOvertimeNotificationRules,
  syncOvertimeNotificationRulesFromSave,
} from 'src/js/widgets/userSettings/store/slices/overtimeNotificationsSlice';
import {
  cancelScheduleNotificationsDraft,
  selectScheduleNotificationSubscriptions,
  selectScheduleNotificationDraftSubscriptions,
  syncScheduleNotificationsWithSavedData,
} from 'src/js/widgets/userSettings/store/slices/scheduleNotificationsSlice';
import { selectSettingsFor } from 'src/js/widgets/userSettings/store/slices/settingsContextSlice';
import type {
  ManageScheduleSubscriptionApiResponse,
  ManageScheduleNotificationsUserSettings,
} from '../types/NotificationsCard.types';
import { buildScheduleNotificationsManageInput } from '../utils/scheduleNotifications.utils';
import NotificationsScheduleEdit from './NotificationsScheduleEdit';
import { NotificationsCardTimeDropdown } from './NotificationsCardTimeDropdown';
import {
  mapNotificationSettingsToManageUserInput,
  mapOvertimeNotificationUnifiedInput,
} from '../utils/NotificationsCard.utils';
import { REMINDER_SCALAR_KEYS } from '../utils/NotificationsCard.constants';
import {
  Section,
  FormRow,
  FormLabel,
  FormControl,
  ControlCell,
  CheckboxContainer,
  CheckboxLabel,
  CheckboxWrapper,
  Divider,
  ActionButtons,
  HeaderSpacer,
  NotificationSettingsGroup,
  NotificationCategoryHeadersRow,
  NotificationCategoryHeadersLabel,
  NotificationCategoryRow,
  NotificationCategoryLabel,
  CheckboxColumn,
  StyledPageMessage,
  SectionTitle,
} from '../styles/NotificationsCardEdit.styles';
import { NOTIFICATION_DAYS_OF_WEEK } from '../../../constants/UserSettingsPage.constants';
import NotificationsOvertimeEdit from './NotificationsOvertimeEdit';

interface NotificationsCardEditProps {
  onSaveSuccess?: () => void;
  /** When false, overtime alert (daily/weekly) block is hidden (QB_OVERTIME_SETTINGS_UI). */
  showOvertimeNotificationsSection?: boolean;
  showScheduleNotificationsSection?: boolean;
}

const NotificationsCardEdit: React.FC<NotificationsCardEditProps> = ({
  onSaveSuccess,
  showOvertimeNotificationsSection = false,
  showScheduleNotificationsSection = false,
}) => {
  const intl = useIntl();
  const sandbox = useSandbox();
  const track = useTracking();
  const dispatch = useAppDispatch();
  const savedSettings = useAppSelector(selectNotificationsSettings);
  const draftSettings = useAppSelector(selectNotificationsDraftSettings);
  const settingsFor = useAppSelector(selectSettingsFor);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const errorMessageRef = useRef<HTMLDivElement>(null);

  // TODO: Enable this once the settings are available from the API
  // const isCompany = draftSettings.notificationSetting === 'company';
  const isCompany = false; // Default to false since notificationSetting is not available
  const daysOfWeek = Object.keys(NOTIFICATION_DAYS_OF_WEEK);

  const emailNotifications = intl.formatMessage({ id: 'notifications.email' });
  const notificationsOnMobile = intl.formatMessage({
    id: 'notifications.mobile',
  });

  // Reusable checkbox component for notification settings
  const NotificationCheckbox: React.FC<{
    settingName: keyof typeof draftSettings;
    ariaLabel: string;
  }> = ({ settingName, ariaLabel }) => (
    <Checkbox
      checked={(draftSettings[settingName] as boolean) || false}
      onChange={() =>
        dispatch(
          updateDraft({
            [settingName]: !draftSettings[settingName],
          }),
        )
      }
      aria-label={ariaLabel}
      disabled={isCompany}
    />
  );

  const savedOvertimeRules = useAppSelector(selectOvertimeNotificationRules);
  const draftOvertimeRules = useAppSelector(
    selectOvertimeNotificationDraftRules,
  );
  const savedScheduleSubscriptions = useAppSelector(
    selectScheduleNotificationSubscriptions,
  );
  const draftScheduleSubscriptions = useAppSelector(
    selectScheduleNotificationDraftSubscriptions,
  );

  const [manageUserSettingsMutation] = useManageUserSettings({
    onSuccess: () => {
      sandbox.logger.info(
        'Component=NotificationsCardEdit Event=Successfully saved reminder notification settings',
      );
      setError('');
      // saveSettings is dispatched in handleSave after overtime save completes when applicable.
    },
    onError: (errorMessage) => {
      sandbox.logger.error(
        `Component=NotificationsCardEdit Event=Error saving reminder notification settings: ${errorMessage}`,
      );
      setIsLoading(false);
      setError(errorMessage);
      errorMessageRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    },
    interaction: TimeCustomerInteraction.USER_NOTIFICATION_SETTINGS_SAVE,
  });

  const { saveUserScheduleNotifications } = useManageUserScheduleNotifications({
    onSuccess: (payload) => {
      // API returns formatted data, so we need to map it explicitly so Redux has the correct format for subsequent saves
      const userSettings =
        payload.userSettings as ManageScheduleNotificationsUserSettings;
      const savedSubscriptions = (
        userSettings.scheduleNotifications?.subscriptions ?? []
      ).filter((s): s is ManageScheduleSubscriptionApiResponse => s != null);

      dispatch(
        syncScheduleNotificationsWithSavedData(
          savedSubscriptions.map((s) => ({
            notificationType: s.notificationType,
            distributionMethods: [...s.distributionMethods],
            version: s.meta?.version,
          })),
        ),
      );
    },
    onError: (errorMessage) => {
      sandbox.logger.error(
        `Component=NotificationsCardEdit Event=Error saving schedule notification settings: ${errorMessage}`,
      );
      setError(errorMessage);
      setIsLoading(false);
      errorMessageRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    },
    interaction: TimeCustomerInteraction.USER_NOTIFICATION_SETTINGS_SAVE,
  });

  const { saveUserOvertimeNotifications } = useManageUserOvertimeNotifications({
    onSuccess: (payload) => {
      sandbox.logger.info(
        'Component=NotificationsCardEdit Event=Successfully saved overtime notification settings',
      );
      setError('');
      // The API returns only the affected rule(s):
      //   CREATE → the new rule with its real server ID
      //   UPDATE → the updated rule
      //   DELETE → null (nothing returned)
      // Merge returned rules into draftOvertimeRules by period so that:
      //   - Deleted rules are already absent from draft (no action needed)
      //   - Created/updated rules get their real server ID from the response
      //   - Rules not touched by this mutation keep their draft state
      const returnedRules = (
        (
          payload.userSettings as {
            overtimeNotifications?: { rules?: unknown[] };
          }
        ).overtimeNotifications?.rules ?? []
      ).filter((r): r is TimeTracking_OvertimeNotificationRule => r != null);
      const returnedByPeriod = new Map(
        returnedRules.map((r) => [r.threshold.period, r]),
      );
      const mergedRules = draftOvertimeRules.map(
        (draft) => returnedByPeriod.get(draft.threshold.period) ?? draft,
      );
      dispatch(syncOvertimeNotificationRulesFromSave(mergedRules));
    },
    onError: (errorMessage) => {
      sandbox.logger.error(
        `Component=NotificationsCardEdit Event=Error saving overtime notification settings: ${errorMessage}`,
      );
      setError(errorMessage);
      errorMessageRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    },
    interaction: TimeCustomerInteraction.USER_NOTIFICATION_SETTINGS_SAVE,
  });

  const handleCancel = () => {
    track(WORKER_NOTIFICATIONS_CARD_TRACKING_POINTS.WORKER_NOTIF_CANCEL);
    setError('');
    if (showOvertimeNotificationsSection) {
      dispatch(cancelOvertimeNotificationsDraft());
    }
    if (showScheduleNotificationsSection) {
      dispatch(cancelScheduleNotificationsDraft());
    }
    dispatch(cancelEdit());
  };

  const handleSave = async () => {
    track(WORKER_NOTIFICATIONS_CARD_TRACKING_POINTS.WORKER_NOTIF_SAVE);
    // Don't save if using company settings
    if (isCompany) {
      dispatch(cancelEdit());
      return;
    }

    // Ensure settingsFor is available
    if (!settingsFor) {
      const errorMsg =
        'Settings context is not available. Cannot save settings.';
      sandbox.logger.error(`Component=NotificationsCardEdit Event=${errorMsg}`);
      setError(errorMsg);
      return;
    }

    setIsLoading(true);
    setError('');

    const isReminderDirty =
      REMINDER_SCALAR_KEYS.some((k) => savedSettings[k] !== draftSettings[k]) ||
      savedSettings.daysOfWeek.length !== draftSettings.daysOfWeek.length ||
      draftSettings.daysOfWeek.some(
        (d) => !savedSettings.daysOfWeek.includes(d),
      );

    try {
      let reminderRoot:
        | NonNullable<
            Awaited<ReturnType<typeof manageUserSettingsMutation>>['data']
          >['timeTrackingManageUserSettings']
        | undefined;
      // Track whether any section mutation ran so we only show "Changes saved" after a real save.
      let didPersistChanges = false;

      if (isReminderDirty) {
        const reminderResult = await manageUserSettingsMutation({
          variables: {
            input: mapNotificationSettingsToManageUserInput(
              draftSettings,
              settingsFor,
            ),
          },
        });

        if (reminderResult.errors?.length) {
          return;
        }

        reminderRoot = reminderResult?.data?.timeTrackingManageUserSettings;
        if (
          reminderRoot?.__typename === 'TimeTracking_ManageUserSettingsError'
        ) {
          return;
        }
        didPersistChanges = true; // Reminder settings were persisted.
      }

      if (showOvertimeNotificationsSection) {
        const overtimeInput = mapOvertimeNotificationUnifiedInput(settingsFor, {
          savedRules: savedOvertimeRules,
          draftRules: draftOvertimeRules,
        });
        if (overtimeInput) {
          const overtimeSavedOk = await saveUserOvertimeNotifications(
            overtimeInput,
          );
          if (!overtimeSavedOk) {
            return;
          }
          didPersistChanges = true; // Overtime settings were persisted.
        }
      }

      if (showScheduleNotificationsSection) {
        const scheduleInput = buildScheduleNotificationsManageInput(
          settingsFor,
          savedScheduleSubscriptions,
          draftScheduleSubscriptions,
        );
        if (scheduleInput) {
          const scheduleSavedOk = await saveUserScheduleNotifications(
            scheduleInput,
          );
          if (!scheduleSavedOk) {
            return;
          }
          didPersistChanges = true; // Schedule notification settings were persisted.
        }
      }

      if (!didPersistChanges) {
        // No dirty sections — exit edit without triggering the success toast.
        dispatch(cancelEdit());
        return;
      }

      if (
        reminderRoot?.__typename === 'TimeTracking_ManageUserSettingsPayload' &&
        reminderRoot.userSettings
      ) {
        type EffectiveSettings = NonNullable<
          TimeTrackingEffectiveUserSettingsQuery['timeTrackingEffectiveUserSettings']
        >;
        dispatch(
          saveSettings({
            timeTrackingEffectiveUserSettings: {
              clockInSetting: reminderRoot.userSettings
                .clockInSetting as EffectiveSettings['clockInSetting'],
              clockOutSetting: reminderRoot.userSettings
                .clockOutSetting as EffectiveSettings['clockOutSetting'],
              notificationEnabledForDays: reminderRoot.userSettings
                .notificationEnabledForDays as EffectiveSettings['notificationEnabledForDays'],
            },
          }),
        );
      } else {
        dispatch(commitDraft());
      }

      onSaveSuccess?.();
    } catch (err) {
      sandbox.logger.error(
        `Component=NotificationsCardEdit Event=Exception during save: ${err}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <H6>
        <Demi>{intl.formatMessage({ id: 'notifications.title' })}</Demi>
      </H6>

      {/* Error Message */}
      {error && (
        <div ref={errorMessageRef}>
          <StyledPageMessage
            type="error"
            open
            dismissible={false}
            automationId="NotificationsCardEditErrorPageMessage"
            title={intl.formatMessage(
              { id: 'notifications.error.title' },
              {},
              { defaultMessage: 'Error saving settings' },
            )}
            onClose={() => setError('')}
          >
            {error}
          </StyledPageMessage>
        </div>
      )}

      {/* TODO: Enable this once the settings are available from the API */}
      {/* <Section>
        <B2>
          <Demi>
            {intl.formatMessage({ id: 'notifications.notification.settings' })}
          </Demi>
        </B2>
        <NotificationSettingsGroup>
          <RadioGroup
            options={[
              {
                label: (
                  <span>
                    {intl.formatMessage({
                      id: 'notifications.company.level.settings',
                    })}{' '}
                    <a href="#" onClick={(e) => e.preventDefault()}>
                      {intl.formatMessage({
                        id: 'notifications.manage.company.settings',
                      })}
                    </a>
                  </span>
                ),
                value: 'company',
              },
              {
                label: intl.formatMessage({
                  id: 'notifications.custom.settings',
                }),
                value: 'custom',
              },
            ]}
            value={draftSettings.notificationSetting}
            onChange={(e) =>
              dispatch(
                updateDraft({
                  notificationSetting: e.target.value || 'custom',
                }),
              )
            }
            name="notification-setting"
            aria-label="notification-setting-options"
            size="medium"
            vertical
          />
        </NotificationSettingsGroup>
      </Section>
      <Divider /> */}

      {/* Time tracking section */}
      <Section>
        <SectionTitle>
          <B2>
            <Demi>
              {intl.formatMessage({ id: 'notifications.time.tracking' })}
            </Demi>
          </B2>
        </SectionTitle>

        <FormRow>
          <FormControl>
            <ControlCell>
              <FormLabel>
                {intl.formatMessage({
                  id: 'notifications.reminders.clockin.at',
                })}
              </FormLabel>
              <NotificationsCardTimeDropdown
                value={draftSettings.clockInTime}
                onChange={(value: string) =>
                  dispatch(updateDraft({ clockInTime: value }))
                }
                disabled={isCompany}
                label=""
                width="320px"
              />
            </ControlCell>
            <CheckboxContainer>
              <CheckboxLabel>{emailNotifications}</CheckboxLabel>
              <CheckboxLabel>{notificationsOnMobile}</CheckboxLabel>
              <CheckboxWrapper>
                <NotificationCheckbox
                  settingName="clockInEmail"
                  ariaLabel="clock-in-email"
                />
              </CheckboxWrapper>
              <CheckboxWrapper>
                <NotificationCheckbox
                  settingName="clockInMobile"
                  ariaLabel="clock-in-mobile"
                />
              </CheckboxWrapper>
            </CheckboxContainer>
          </FormControl>
        </FormRow>

        <FormRow>
          <FormControl>
            <ControlCell>
              <FormLabel>
                {intl.formatMessage({
                  id: 'notifications.reminders.clockout.at',
                })}
              </FormLabel>
              <NotificationsCardTimeDropdown
                value={draftSettings.clockOutTime}
                onChange={(value: string) =>
                  dispatch(updateDraft({ clockOutTime: value }))
                }
                disabled={isCompany}
                label=""
                width="320px"
              />
            </ControlCell>
            <CheckboxContainer>
              <HeaderSpacer>{emailNotifications}</HeaderSpacer>
              <HeaderSpacer>{notificationsOnMobile}</HeaderSpacer>
              <CheckboxWrapper>
                <NotificationCheckbox
                  settingName="clockOutEmail"
                  ariaLabel="clock-out-email"
                />
              </CheckboxWrapper>
              <CheckboxWrapper>
                <NotificationCheckbox
                  settingName="clockOutMobile"
                  ariaLabel="clock-out-mobile"
                />
              </CheckboxWrapper>
            </CheckboxContainer>
          </FormControl>
        </FormRow>

        <FormRow>
          <FormControl>
            <ControlCell>
              <FormLabel>
                {intl.formatMessage({
                  id: 'notifications.reminders.days.of.week',
                })}
              </FormLabel>
              <Dropdown
                theme="quickbooks"
                multiselect
                value={draftSettings.daysOfWeek}
                onChange={(e: any) => {
                  e.stopPropagation();
                  const selectedDay = (e.target as HTMLSelectElement).value;
                  const currentDays = draftSettings.daysOfWeek;

                  if (currentDays.length > 0) {
                    const dayIndex = currentDays.indexOf(selectedDay);
                    if (dayIndex !== -1) {
                      // Remove the day if it's already selected
                      const newDays = [...currentDays];
                      newDays.splice(dayIndex, 1);
                      dispatch(updateDraft({ daysOfWeek: newDays }));
                    } else {
                      // Add the day if it's not selected
                      dispatch(
                        updateDraft({
                          daysOfWeek: [...currentDays, selectedDay],
                        }),
                      );
                    }
                  } else {
                    // If no days selected, add the clicked day
                    dispatch(updateDraft({ daysOfWeek: [selectedDay] }));
                  }
                }}
                width="320px"
                disabled={isCompany}
                placeholder={intl.formatMessage({
                  id: 'notifications.select.days.of.week',
                })}
                aria-label="days-of-week"
              >
                {daysOfWeek.map((day) => (
                  <MenuItem key={day} value={NOTIFICATION_DAYS_OF_WEEK[day]}>
                    {intl.formatMessage({ id: day })}
                  </MenuItem>
                ))}
              </Dropdown>
            </ControlCell>
          </FormControl>
        </FormRow>

        {/* TODO: Enable this once the settings are available from the API */}
        {/* <FormRow>
          <FormControl>
            <ControlCell>
              <FormLabel>
                {intl.formatMessage({ id: 'notifications.reminders.adjust' })}
              </FormLabel>
              <Dropdown
                theme="quickbooks"
                value={draftSettings.adjustNotification}
                onChange={(e: any) =>
                  dispatch(
                    updateDraft({
                      adjustNotification: e.target.value,
                    }),
                  )
                }
                width="320px"
                disabled={isCompany}
              >
                <MenuItem value={notifyAdminsAndManagers}>
                  {notifyAdminsAndManagers}
                </MenuItem>
                <MenuItem value={notifyEveryone}>{notifyEveryone}</MenuItem>
                <MenuItem value={notifyNoOne}>{notifyNoOne}</MenuItem>
              </Dropdown>
            </ControlCell>
          </FormControl>
        </FormRow>

        <FormRow>
          <FormControl>
            <ControlCell>
              <FormLabel>
                {intl.formatMessage({ id: 'notifications.reminders.notes' })}
              </FormLabel>
              <Dropdown
                theme="quickbooks"
                value={draftSettings.notesNotification}
                onChange={(e: any) =>
                  dispatch(
                    updateDraft({
                      notesNotification: e.target.value,
                    }),
                  )
                }
                width="320px"
                disabled={isCompany}
              >
                <MenuItem value={notifyAdminsAndManagers}>
                  {notifyAdminsAndManagers}
                </MenuItem>
                <MenuItem value={notifyEveryone}>{notifyEveryone}</MenuItem>
                <MenuItem value={notifyNoOne}>{notifyNoOne}</MenuItem>
              </Dropdown>
            </ControlCell>
          </FormControl>
        </FormRow> */}
      </Section>

      {showScheduleNotificationsSection && <NotificationsScheduleEdit />}

      {showOvertimeNotificationsSection && <NotificationsOvertimeEdit />}

      {/* TODO: Enable this once the settings are available from the API */}
      {/* <Section>
        <B2>
          <Demi>
            {intl.formatMessage({ id: 'notifications.schedule.title' })}
          </Demi>
        </B2>

        <NotificationCategoryHeadersRow>
          <HeaderSpacer />
          <NotificationCategoryHeadersLabel>
            {emailNotifications}
          </NotificationCategoryHeadersLabel>
          <NotificationCategoryHeadersLabel>
            {notificationsOnMobile}
          </NotificationCategoryHeadersLabel>
        </NotificationCategoryHeadersRow>

        <NotificationCategoryRow>
          <NotificationCategoryLabel>
            {intl.formatMessage({
              id: 'notifications.schedule.shift.published',
            })}
          </NotificationCategoryLabel>
          <CheckboxColumn>
            <NotificationCheckbox
              settingName="scheduleEmail"
              ariaLabel="schedule-email"
            />
          </CheckboxColumn>
          <CheckboxColumn>
            <NotificationCheckbox
              settingName="scheduleMobile"
              ariaLabel="schedule-mobile"
            />
          </CheckboxColumn>
        </NotificationCategoryRow>

        <NotificationCategoryRow>
          <NotificationCategoryLabel>
            {intl.formatMessage({
              id: 'notifications.schedule.shift.reminder',
            })}
          </NotificationCategoryLabel>
          <CheckboxColumn>
            <NotificationCheckbox
              settingName="shiftReminderEmail"
              ariaLabel="shift-reminder-email"
            />
          </CheckboxColumn>
          <CheckboxColumn>
            <NotificationCheckbox
              settingName="shiftReminderMobile"
              ariaLabel="shift-reminder-mobile"
            />
          </CheckboxColumn>
        </NotificationCategoryRow>
      </Section> */}

      {/* TODO: Enable this once the settings are available from the API */}
      {/* <Section>
        <B2>
          <Demi>
            {intl.formatMessage({ id: 'notifications.timeoff.title' })}
          </Demi>
        </B2>

        <NotificationCategoryHeadersRow>
          <HeaderSpacer />
          <NotificationCategoryHeadersLabel>
            {emailNotifications}
          </NotificationCategoryHeadersLabel>
          <NotificationCategoryHeadersLabel>
            {notificationsOnMobile}
          </NotificationCategoryHeadersLabel>
        </NotificationCategoryHeadersRow>

        <NotificationCategoryRow>
          <NotificationCategoryLabel>
            {intl.formatMessage({
              id: 'notifications.timeoff.shift.published',
            })}
          </NotificationCategoryLabel>
          <CheckboxColumn>
            <NotificationCheckbox
              settingName="timeOffEmail"
              ariaLabel="timeoff-email"
            />
          </CheckboxColumn>
          <CheckboxColumn>
            <NotificationCheckbox
              settingName="timeOffMobile"
              ariaLabel="timeoff-mobile"
            />
          </CheckboxColumn>
        </NotificationCategoryRow>
      </Section> */}

      <ActionButtons>
        <Button
          priority="tertiary"
          onClick={handleCancel}
          aria-label="cancel-notifications"
          disabled={isLoading}
        >
          {intl.formatMessage({ id: 'actions.cancel' })}
        </Button>
        <Button
          onClick={handleSave}
          aria-label="save-notifications"
          disabled={isLoading}
          isLoading={isLoading}
          loadingComponent={<Activity shape="dots" size="small" />}
        >
          {intl.formatMessage({ id: 'actions.save' })}
        </Button>
      </ActionButtons>
    </div>
  );
};

export default NotificationsCardEdit;

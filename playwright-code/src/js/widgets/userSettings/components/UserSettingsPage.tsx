import React, { useCallback, useEffect, useRef } from 'react';
import { B2, Demi, H5 } from '@ids-ts/typography';
import { useIntl, useSandbox } from '@payroll/quicksand';
import { ChevronRight } from '@design-systems/icons';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';
import { FEATURE_FLAGS } from 'src/js/common/constants';
import { useOvertimeFeatureFlag } from 'src/js/service/hooks/settings/useGetTSheetsOvertimeEnabled';
import {
  useUxPreferences,
  UxPreferenceKey,
} from 'src/js/service/utils/useUXPreferences';
import { useGetUnifiedUserSettings } from 'src/js/service/hooks/userLevelSettings/useGetUnifiedUserSettings';
import type { TimeTrackingUnifiedUserSettingsQuery } from 'src/__generated__/timeTracking/graphql';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import { USER_SETTINGS_SCHEDULE_NOTIFICATIONS_LOGGING } from '../constants/loggingConstants';
import {
  resetLocationState,
  setLocationLoading,
  setLocationError,
} from '../store/slices/locationSlice';
import {
  resetScheduleNotificationsState,
  setScheduleNotificationsLoading,
  setScheduleNotificationsError,
} from '../store/slices/scheduleNotificationsSlice';
import type { GetUserScheduleNotificationsQueryResult } from '../store/slices/scheduleNotificationsSlice';
import {
  Page,
  TopSection,
  Breadcrumbs,
  UserInfo,
  BreadcrumbLink,
  CardsGrid,
  CardBody,
  PageSubtitle,
  SettingsCard,
} from './styles/UserSettingsPage.styles';
import { UserSettingsPageProps } from './types/UserSettingsPage.types';
import { NAVIGATION_ROUTES } from './constants/UserSettingsPage.constants';
import NotificationsCard from './cards/NotificationsCard';
import BreaksCard from './cards/BreaksCard';
import { useAppDispatch } from '../store';
import { setSettingsFor } from '../store/slices/settingsContextSlice';
import {
  useBreaksCardData,
  useNotificationsCardData,
  useOvertimeCardData,
  useOvertimeNotificationsCardData,
  usePermissionsCardData,
} from '../hooks';
import LocationCard from './cards/LocationCard';
import OvertimeCard from './cards/OvertimeCard';
import PermissionsCard from './cards/PermissionsCard';

const UserSettingsPage: React.FC<UserSettingsPageProps> = ({ settingsFor }) => {
  const intl = useIntl();
  const sandbox = useSandbox();
  const dispatch = useAppDispatch();
  const {
    data: uxPreferenceData,
    loadPreferences,
    initialized: uxPreferenceInitialized,
  } = useUxPreferences();

  // Use worker display name from settingsFor if available, fallback to default
  const workerDisplayName = settingsFor.displayName || 'Worker Settings';

  // Feature flag to show breaks card in user settings
  const { isEnabled: isBreaksCardEnabled } = useIXPFeatureFlag({
    flagName: FEATURE_FLAGS.QB_TIME_SHOW_BREAKS_IN_USER_SETTINGS,
    defaultValue: false,
  });

  // Feature flag to show location card in user settings
  const { isEnabled: isLocationCardEnabled } = useIXPFeatureFlag({
    flagName: FEATURE_FLAGS.QB_TIME_SHOW_LOCATION_IN_USER_SETTINGS,
    defaultValue: false,
  });

  // Feature flag to show notifications card in user settings
  const { isEnabled: isNotificationsCardEnabled } = useIXPFeatureFlag({
    flagName: FEATURE_FLAGS.QB_TIME_SHOW_NOTIFICATIONS_IN_USER_SETTINGS,
    defaultValue: false,
  });

  const { isEnabled: isSchedulesNotificationEnabled } = useIXPFeatureFlag({
    flagName: FEATURE_FLAGS.QB_TIME_ENABLE_SCHEDULE_SETTINGS,
    defaultValue: false,
  });

  // Feature flag to show permissions card in user settings
  const { isEnabled: isPermissionsCardEnabled } = useIXPFeatureFlag({
    flagName: FEATURE_FLAGS.QB_TIME_SHOW_PERMISSIONS_IN_USER_SETTINGS,
    defaultValue: false,
  });

  // Feature flag to route the "Assignments" breadcrumb to the Time team page
  const {
    isEnabled: isTeamMembersTabEnabled,
    settled: teamMembersFlagSettled,
  } = useIXPFeatureFlag({
    flagName: FEATURE_FLAGS.SBSEG_QBO_ENABLE_TIME_TAB_TEAM_MEMBERS,
    defaultValue: false,
  });

  // Overtime card visibility is decided in a single hook:
  // TSheets addon check first, then IXP evaluation only when applicable.
  const { isEnabled: isOvertimeCardEnabled } = useOvertimeFeatureFlag();
  const overtimeBadgeVisibilityEndDate =
    uxPreferenceData[UxPreferenceKey.TIME_ENTRY_NEW_BADGE_VISIBLE]
      ?.overtimeVisibilityEndDate ?? '';

  // Store settingsFor in Redux on mount
  useEffect(() => {
    dispatch(
      setSettingsFor({
        id: settingsFor.id,
        timeForType: settingsFor.timeForType,
        displayName: settingsFor.displayName,
      }),
    );
  }, [settingsFor, dispatch]);

  useEffect(() => {
    if (!uxPreferenceInitialized) return;
    loadPreferences([UxPreferenceKey.TIME_ENTRY_NEW_BADGE_VISIBLE]);
  }, [uxPreferenceInitialized, loadPreferences]);

  // ─────────────────────────────────────────────────────────────────────────────
  // CARD DATA HOOKS
  // ─────────────────────────────────────────────────────────────────────────────

  // Breaks card - fetches break rules and syncs to Redux (only when FF is enabled)
  useBreaksCardData(isBreaksCardEnabled ? settingsFor.id : undefined);

  // Single unified fetch for location + schedule notifications — replaces useLocationCardData + useScheduleNotificationsCardData
  const logger = useLoggingConfig();

  const shouldFetchUnified =
    isLocationCardEnabled ||
    (isNotificationsCardEnabled && isSchedulesNotificationEnabled);

  const handleUnifiedSuccess = useCallback(
    (data: TimeTrackingUnifiedUserSettingsQuery) => {
      dispatch(resetLocationState(data));
      logger.info(
        `Component=UserSettingsPage Event=${USER_SETTINGS_SCHEDULE_NOTIFICATIONS_LOGGING.FETCH_RULES_SUCCESS} section=SCHEDULE_NOTIFICATIONS`,
        {
          subscriptionsCount:
            (data as GetUserScheduleNotificationsQueryResult)
              ?.timeTrackingUnifiedUserSettings?.scheduleNotifications
              ?.subscriptions?.length ?? 0,
        },
      );
      dispatch(
        resetScheduleNotificationsState(
          data as GetUserScheduleNotificationsQueryResult,
        ),
      );
    },
    [dispatch, logger],
  );

  const handleUnifiedError = useCallback(
    (error: string) => {
      dispatch(setLocationError(error));
      dispatch(setScheduleNotificationsError(error));
      // Schedule notifications are fetched as part of unified settings fetch.
      logger.error(
        `Component=UserSettingsPage Event=${USER_SETTINGS_SCHEDULE_NOTIFICATIONS_LOGGING.FETCH_RULES_FAILED} section=SCHEDULE_NOTIFICATIONS`,
        { error },
      );
    },
    [dispatch, logger],
  );

  const { loadUnifiedUserSettings } = useGetUnifiedUserSettings({
    onSuccess: handleUnifiedSuccess,
    onError: handleUnifiedError,
  });

  const unifiedLoadRef = useRef(loadUnifiedUserSettings);
  unifiedLoadRef.current = loadUnifiedUserSettings;

  useEffect(() => {
    if (!shouldFetchUnified || !settingsFor?.id || !settingsFor?.timeForType) {
      if (!shouldFetchUnified) {
        dispatch(resetLocationState(undefined));
        dispatch(resetScheduleNotificationsState(undefined));
      }
      return;
    }

    dispatch(setLocationLoading(true));
    dispatch(setScheduleNotificationsLoading(true));

    unifiedLoadRef.current({
      settingsFor: { id: settingsFor.id, timeForType: settingsFor.timeForType },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable fetch keyed by settingsFor + gate flags
  }, [settingsFor?.id, settingsFor?.timeForType, shouldFetchUnified, dispatch]);

  // Notifications card - fetches effective user settings and syncs to Redux (only when FF is enabled)
  useNotificationsCardData(
    isNotificationsCardEnabled ? settingsFor : undefined,
  );

  // Overtime notification rules — only when notifications + overtime (policy) UI flags are on
  useOvertimeNotificationsCardData(
    isNotificationsCardEnabled && isOvertimeCardEnabled
      ? settingsFor
      : undefined,
  );

  // Overtime card - fetches overtime policy and syncs to Redux (only when FF is enabled)
  useOvertimeCardData(isOvertimeCardEnabled ? settingsFor.id : undefined);

  // Permissions card — fires `timeTrackingWorkerPermissions` + syncs to Redux when FF is on.
  usePermissionsCardData(isPermissionsCardEnabled ? settingsFor : undefined);

  // ─────────────────────────────────────────────────────────────────────────────
  // NAVIGATION HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────

  const handleMyAppsNavigation = () => {
    try {
      sandbox.navigation.navigate(NAVIGATION_ROUTES.MY_APPS);
    } catch (err) {
      sandbox.logger.error('Navigation to My Apps failed', { error: err });
    }
  };

  const handleTimeNavigation = () => {
    try {
      sandbox.navigation.navigate(NAVIGATION_ROUTES.TIME);
    } catch (err) {
      sandbox.logger.error('Navigation to Time failed', { error: err });
    }
  };

  const handleAssignmentsNavigation = () => {
    try {
      sandbox.navigation.navigate(
        isTeamMembersTabEnabled
          ? NAVIGATION_ROUTES.TIME_TEAM
          : NAVIGATION_ROUTES.ASSIGNMENTS,
      );
    } catch (err) {
      sandbox.logger.error('Navigation to Assignments failed', { error: err });
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <Page>
      <TopSection>
        {/* to avoid flickering, we only render the breadcrumbs when the flag has settled */}
        {teamMembersFlagSettled && (
          <Breadcrumbs aria-label="breadcrumbs">
            <BreadcrumbLink onClick={handleMyAppsNavigation}>
              {intl.formatMessage({ id: 'breadcrumb.myapps' })}
            </BreadcrumbLink>
            <ChevronRight size="xsmall" />
            <BreadcrumbLink onClick={handleTimeNavigation}>
              {intl.formatMessage({ id: 'breadcrumb.time' })}
            </BreadcrumbLink>
            <ChevronRight size="xsmall" />
            <BreadcrumbLink onClick={handleAssignmentsNavigation}>
              {intl.formatMessage({
                id: isTeamMembersTabEnabled
                  ? 'breadcrumb.timeTeam'
                  : 'breadcrumb.assignments',
              })}
            </BreadcrumbLink>
            <ChevronRight size="xsmall" />
            <span>{workerDisplayName}</span>
          </Breadcrumbs>
        )}

        <UserInfo>
          <div>
            <H5>
              <Demi>{workerDisplayName}</Demi>
            </H5>
          </div>
          <PageSubtitle>
            <B2>{intl.formatMessage({ id: 'page.subtitle' })}</B2>
          </PageSubtitle>
        </UserInfo>
      </TopSection>

      <CardsGrid>
        {/* Breaks settings for user - shown only when FF is enabled */}
        {isBreaksCardEnabled && (
          <SettingsCard>
            <CardBody>
              <BreaksCard />
            </CardBody>
          </SettingsCard>
        )}

        {/*  Location settings for user */}
        {isLocationCardEnabled && (
          <SettingsCard>
            <CardBody>
              <LocationCard />
            </CardBody>
          </SettingsCard>
        )}

        {/* Overtime settings for user */}
        {isOvertimeCardEnabled && (
          <SettingsCard>
            <CardBody>
              <OvertimeCard
                overtimeBadgeVisibilityEndDate={overtimeBadgeVisibilityEndDate}
              />
            </CardBody>
          </SettingsCard>
        )}

        {/* Notifications settings for user */}
        {isNotificationsCardEnabled && (
          <SettingsCard>
            <CardBody>
              <NotificationsCard
                showOvertimeNotificationsSection={isOvertimeCardEnabled}
                overtimeBadgeVisibilityEndDate={overtimeBadgeVisibilityEndDate}
                showScheduleNotificationsSection={
                  isSchedulesNotificationEnabled
                }
              />
            </CardBody>
          </SettingsCard>
        )}

        {/* Permissions settings for user */}
        {isPermissionsCardEnabled && (
          <SettingsCard>
            <CardBody>
              <PermissionsCard />
            </CardBody>
          </SettingsCard>
        )}
      </CardsGrid>
    </Page>
  );
};

export default UserSettingsPage;

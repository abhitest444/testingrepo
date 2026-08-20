import { TimeTracking_TimeForType } from 'src/__generated__/timeTracking/graphql';
import { WidgetProps } from 'src/js/types';

export type USER_SETTINGS_FEATURE = 'user-settings';
export type USER_SETTINGS_FUNCTIONALITY = 'page';

/**
 * Settings context information
 */
export interface SettingsFor {
  timeForType: TimeTracking_TimeForType;
  id: string;
  displayName?: string; // Worker display name for UI (breadcrumb, header)
}

/**
 * Props interface for UserSettingsPage component
 */
export interface UserSettingsPageProps {
  settingsFor: SettingsFor;
}

export interface UserSettingsProps {
  onError?: (error: Error | string) => void;
  settingsFor?: SettingsFor;
}

export interface RouteParams {
  workerId?: string;
  workerType?: TimeTracking_TimeForType;
  workerName?: string;
}

export interface RouteInfo {
  params?: RouteParams;
}

export type UserSettingsWidgetProps = WidgetProps<
  UserSettingsProps,
  USER_SETTINGS_FEATURE,
  USER_SETTINGS_FUNCTIONALITY
> & {
  routeInfo?: RouteInfo;
};

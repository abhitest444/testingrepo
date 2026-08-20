// @ts-nocheck
/**
 * NotificationsCard - Main export
 *
 * This is the main entry point for the NotificationsCard component.
 * It provides a clean interface for the notification settings functionality.
 * Utilizes shared Redux store for state management.
 */

export { default } from './NotificationsCard';
export type {
  NotificationSettings,
  NotificationMode,
  NotificationState,
} from './types/NotificationsCard.types';
export { NOTIFICATION_ACTIONS } from './types/NotificationsCard.types';

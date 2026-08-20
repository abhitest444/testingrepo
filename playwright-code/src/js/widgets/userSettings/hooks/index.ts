/**
 * Card-specific hooks for userSettings widget
 *
 * Each card has its own hook that:
 * 1. Fetches data using common/reusable service hooks
 * 2. Syncs data to Redux for VIEW/EDIT modes
 *
 * This pattern keeps UserSettingsPage clean and each card self-contained.
 */

export { useBreaksCardData } from './useBreaksCardData';
export { useNotificationsCardData } from './useNotificationsCardData';
export { useOvertimeCardData } from './useOvertimeCardData';
export { useOvertimeNotificationsCardData } from './useOvertimeNotificationsCardData';
export { usePermissionsCardData } from './usePermissionsCardData';

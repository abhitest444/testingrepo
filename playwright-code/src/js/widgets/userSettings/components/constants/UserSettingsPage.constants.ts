/**
 * Navigation routes used in UserSettingsPage component
 */
export const NAVIGATION_ROUTES = {
  /** Route to My Apps homepage */
  MY_APPS: 'app/homepage',
  /** Route to Time section */
  TIME: 'time',
  /** Route to Assignments section */
  ASSIGNMENTS: 'time/assignments',
  /** Route to Time team page */
  TIME_TEAM: 'time/team',
  /** Route to Time Tracking Settings page */
  TIME_SETTINGS: '/app/accountsettings?p=time',
  /** Route to admin Overtime policies page */
  OVERTIME_POLICIES: 'time/overtime',
} as const;

// Days of week constant
export const NOTIFICATION_DAYS_OF_WEEK: { [key: string]: string } = {
  Sunday: 'SUNDAY',
  Monday: 'MONDAY',
  Tuesday: 'TUESDAY',
  Wednesday: 'WEDNESDAY',
  Thursday: 'THURSDAY',
  Friday: 'FRIDAY',
  Saturday: 'SATURDAY',
};

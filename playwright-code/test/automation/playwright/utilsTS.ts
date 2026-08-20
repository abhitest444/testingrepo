import { Page } from '@playwright/test';

import { LABELS } from './constants';

/**
 * Time Tracking
 * labels data-test-id
 */
export const TimeTrackingTestId = {
  timesheetManagement: 'Timesheet management',
  firstDayOfWorkWeek: 'Select days',
  Timezone: '//span[text()="Time zone"]/..//input',
  TimeFormat: 'Select time format',
  ModifyDateFormatStatic: 'Modify the date format in',
  AdvancedCompanySettingsLink: 'advanced company settings',
  Checkbox: `//input[@type='checkbox']`,
  AllowToEditClkOutTimeHours: `//input[@type='number']`,
  SplitTSTooltip: '',
  AllowTMToEditTSTooltip: '',
  AllowToEditClkOutTimeHoursTooltip: '',
  viewRoundingGuideLink: '',
  clkInDirection: '//span[text()="Direction (clock-in)"]/..//input',
  clkInRoundInc: '//span[text()="Rounding increment (clock-in)"]/..//input',
  clkOutDirection: '//span[text()="Direction (clock-out)"]/..//input',
  clkOutRoundInc: '//span[text()="Rounding increment (clock-out)"]/..//input',
};

export const TimesheetRoundingLabels = {
  timesheetRounding: 'Timesheet rounding',
  timesheetRoundingInfo:
    'Before using time rounding, review federal and local laws as there may be restrictions in your area. View rounding guide',
  roundClkInDirLabel: 'Direction (clock-in)',
  roundClkOutDirLabel: 'Direction (clock-out)',
  clkInRoundIncLabel: 'Rounding increment (clock-in)',
  clkOutRoundIncLabel: 'Rounding increment (clock-out)',
  roundClkInTimes: 'Round clock-in times',
  roundClkOutTimes: 'Round clock-out times',
};

export const TimeTrackingLabels = {
  firstdayOfWorkWeek: 'First day of work week',
  timezone: 'Time zone',
  timeformat: 'Time format',
  SplitTSCheckbox: 'Split timesheets at midnight',
  EditClkOutCheckbox: 'Allow team members to edit clock out time',
  EditTSCheckbox: LABELS.teamMemberPermissionsView,
  OverrideHrs: '',
  roundClkInTimes: 'Round clock-in times',
  roundClkOutTimes: 'Round clock-out times',
};

export const STALabels = {
  Name: 'Name',
  Customers: 'Customers',
  Service: 'Service',
  Class: 'Class',
  Location: 'Location',
  Billable: 'Billable',
  BillablePerHour: 'Billable (per hour)',
  NotesLabel: 'Notes',
  SaveButton: 'Save',
  Timezone: 'Time zone',
};

export const NotificationsLabels = {
  TimeTracking: 'Time Tracking',
  Notifications: 'Notifications',
  SendClkInReminders: 'Send clock-in reminders',
  SendClkOutReminders: 'Send clock-out reminders',
  DaysRemSent: 'Days reminders are sent',
  NotifyNotesAddedEdited: 'Notify when notes are added or edited',
};

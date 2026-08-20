import { useIntl } from '@payroll/quicksand';
import { GeneralPopoverTourStep } from 'src/js/widgets/common/GeneralPopoverTour/GeneralPopoverTour';
// Weekly tour lottieData
import addTimeCategoryAnimation from 'src/assets/animations/weekly-timesheets/add-time-category.json';
import enterDetailsAnimation from 'src/assets/animations/weekly-timesheets/enter-details.json';
import saveChangesAnimation from 'src/assets/animations/weekly-timesheets/save-changes.json';
import weeklyTimeEntryAnimation from 'src/assets/animations/weekly-timesheets/weekly-time-entry.json';

// Time clock tour lottieData
import timeClockGeneralGreenAnimation from 'src/assets/animations/time-clock/general-time.json';
import timeClockViewTimeAnimation from 'src/assets/animations/time-clock/view-time.json';
import timeClockSwitchJobsAnimation from 'src/assets/animations/time-clock/switch-jobs.json';
import timeClockSaveChangesAnimation from 'src/assets/animations/time-clock/save-changes.json';
import timeClockViewRunningTimeFinalAnimation from 'src/assets/animations/time-clock/view-running-time.json';

// Breaks tour lottieData
import breaksAnimation from 'src/assets/animations/breaks.json';

// Custom fields tour lottieData
import customFieldsAnimation from 'src/assets/animations/custom-fields/custom-fields.json';
import customFieldsToggleAnimation from 'src/assets/animations/custom-fields/switch.json';
import weeklyTimeSheet from 'src/assets/animations/weekly-time-sheet-tour/weeklyTimeSheet.json';
import selectTeamMember from 'src/assets/animations/weekly-time-sheet-tour/selectTeamMember.json';
import addTimeEntry from 'src/assets/animations/weekly-time-sheet-tour/addTimeEntry.json';
import saveWeeklyTimeSheet from 'src/assets/animations/weekly-time-sheet-tour/saveWeeklyTimeSheet.json';

// Single time activity tour lottieData
import singleTimeActivityAnimation1 from 'src/assets/animations/single-time-activity-tour/single-time-activity-1.json';
import singleTimeActivityAnimation2 from 'src/assets/animations/single-time-activity-tour/single-time-activity-2.json';
import singleTimeActivityAnimation3 from 'src/assets/animations/single-time-activity-tour/single-time-activity-3.json';
import singleTimeActivityAnimation4 from 'src/assets/animations/single-time-activity-tour/single-time-activity-4.json';

// eslint-disable-next-line @typescript-eslint/ban-types
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

// Custom hook to get localized time clock tour steps
export const TimeClockTourSteps = (): (Omit<
  GeneralPopoverTourStep,
  'anchorEl'
> & {
  targetSelector?: string;
})[] => {
  const intl = useIntl();

  return [
    {
      id: 'tc-1',
      title: intl.formatMessage({ id: 'tour.timeclock.step1.title' }),
      description: intl.formatMessage({
        id: 'tour.timeclock.step1.description',
      }),
      buttonText: intl.formatMessage({ id: 'tour.timeclock.step1.buttonText' }),
      position: 'left',
      alignment: 'center',
      distance: 14.5,
      skidding: 0,
      bgcolor: '#D8FFDB',
      targetSelector: '[aria-label="timeclock-timer-container"]',
      lottieData: timeClockGeneralGreenAnimation,
    },
    {
      id: 'tc-2',
      title: intl.formatMessage({ id: 'tour.timeclock.step2.title' }),
      description: intl.formatMessage({
        id: 'tour.timeclock.step2.description',
      }),
      buttonText: intl.formatMessage({ id: 'tour.timeclock.step2.buttonText' }),
      position: 'left',
      alignment: 'center',
      distance: 14.5,
      skidding: 0,
      bgcolor: '#FFF2C1',
      targetSelector: '[aria-label="timeclock-timer-container"]',
      lottieData: timeClockViewTimeAnimation,
    },
    {
      id: 'tc-3',
      title: intl.formatMessage({ id: 'tour.timeclock.step3.title' }),
      description: intl.formatMessage({
        id: 'tour.timeclock.step3.description',
      }),
      buttonText: intl.formatMessage({ id: 'tour.timeclock.step3.buttonText' }),
      position: 'left',
      alignment: 'center',
      distance: 17,
      skidding: 4,
      bgcolor: '#FEE6F3',
      targetSelector: '[aria-label="timeclock-switch-jobs-button"]',
      lottieData: timeClockSwitchJobsAnimation,
    },
    {
      id: 'tc-4',
      title: intl.formatMessage({ id: 'tour.timeclock.step4.title' }),
      description: intl.formatMessage({
        id: 'tour.timeclock.step4.description',
      }),
      buttonText: intl.formatMessage({ id: 'tour.timeclock.done.text' }),
      position: 'left',
      alignment: 'left',
      distance: 17,
      skidding: 6,
      bgcolor: '#EBF9FF',
      targetSelector: '[aria-label="timeclock-save-button"]',
      lottieData: timeClockSaveChangesAnimation,
    },

    // Drawer-closed context steps
    {
      id: 'tc-5',
      title: intl.formatMessage({ id: 'tour.timeclock.step5.title' }),
      description: intl.formatMessage({
        id: 'tour.timeclock.step5.description',
      }),
      buttonText: intl.formatMessage({ id: 'tour.timeclock.done.text' }),
      position: 'left',
      alignment: 'center',
      distance: 10,
      skidding: 0,
      bgcolor: '#F2E9FD',
      targetSelector: 'button[aria-label="timeclock-action-button"]',
      lottieData: timeClockViewRunningTimeFinalAnimation,
    },
  ];
};

// Custom hook for Weekly Timesheet (weeklyTimeTrowser) tour steps - matches design
export const WeeklyTimesheetPageTourSteps = (): (Omit<
  GeneralPopoverTourStep,
  'anchorEl'
> & {
  targetSelector?: string;
})[] => {
  const intl = useIntl();

  return [
    {
      id: 'weekly-timesheet-1',
      title: intl.formatMessage({ id: 'tour.weekly.timesheet.step1.title' }),
      description: intl.formatMessage({
        id: 'tour.weekly.timesheet.step1.description',
      }),
      buttonText: intl.formatMessage({
        id: 'tour.weekly.timesheet.step1.buttonText',
      }),
      position: 'right',
      alignment: 'top',
      distance: 10,
      skidding: 20,
      bgcolor: '#D8FFDB',
      targetSelector:
        '[aria-label="weekly-team-member-dropdown"], [data-testid="weekly-team-member-field"]',
      lottieData: weeklyTimeSheet,
      arrowColor: '#D8FFDB',
    },
    {
      id: 'weekly-timesheet-2',
      title: intl.formatMessage({ id: 'tour.weekly.timesheet.step2.title' }),
      description: intl.formatMessage({
        id: 'tour.weekly.timesheet.step2.description',
      }),
      buttonText: intl.formatMessage({
        id: 'tour.weekly.timesheet.step2.buttonText',
      }),
      position: 'right',
      alignment: 'top',
      distance: 10,
      skidding: 20,
      bgcolor: '#F2E9FD',
      targetSelector: '[aria-label="weekly-team-member-dropdown"]',
      lottieData: selectTeamMember,
      arrowColor: '#FFFFFF',
    },
    {
      id: 'weekly-timesheet-3',
      title: intl.formatMessage({ id: 'tour.weekly.timesheet.step3.title' }),
      description: intl.formatMessage({
        id: 'tour.weekly.timesheet.step3.description',
      }),
      buttonText: intl.formatMessage({
        id: 'tour.weekly.timesheet.step3.buttonText',
      }),
      position: 'left',
      alignment: 'top',
      distance: 15,
      skidding: 0,
      bgcolor: '#F2E9FD',
      targetSelector: '[aria-label="Duration (hh:mm)"]',
      lottieData: addTimeEntry,
      arrowColor: '#F2E9FD',
    },
    {
      id: 'weekly-timesheet-4',
      title: intl.formatMessage({ id: 'tour.weekly.timesheet.step4.title' }),
      description: intl.formatMessage({
        id: 'tour.weekly.timesheet.step4.description',
      }),
      buttonText: intl.formatMessage({
        id: 'tour.weekly.timesheet.step4.buttonText',
      }),
      position: 'left',
      alignment: 'bottom',
      distance: 10,
      skidding: 0,
      bgcolor: '#ECF9FF',
      targetSelector: '[aria-label="weekly-time-trowser_save"]',
      lottieData: saveWeeklyTimeSheet,
      arrowColor: '#FFFFFF',
    },
  ];
};

export const BreakTourSteps = (): (Omit<GeneralPopoverTourStep, 'anchorEl'> & {
  targetSelector?: string;
})[] => {
  const intl = useIntl();
  return [
    {
      id: 'break-1',
      title: intl.formatMessage({ id: 'tour.breaks.add.rule.title' }),
      description: intl.formatMessage({
        id: 'tour.breaks.add.rule.description',
      }),
      buttonText: intl.formatMessage({ id: 'tour.breaks.add.rule.button' }),
      position: 'left',
      alignment: 'center',
      bgcolor: '#D8FFDB',
      targetSelector: '[aria-label="add-break-rule-btn"]',
      lottieData: breaksAnimation,
      arrowColor: '#D8FFDB',
    },
  ];
};

export const CustomFieldTourSteps = (): (Omit<
  GeneralPopoverTourStep,
  'anchorEl'
> & {
  targetSelector?: string;
})[] => {
  const intl = useIntl();
  return [
    {
      id: 'cf-1',
      title: intl.formatMessage({ id: 'tour.customfields.add.title' }),
      description: intl.formatMessage({
        id: 'tour.customfields.add.description',
      }),
      buttonText: intl.formatMessage({ id: 'tour.next' }),
      position: 'left',
      alignment: 'center',
      bgcolor: '#D8FFDB',
      targetSelector: '[aria-label="custom-fields-add-button"]',
      lottieData: customFieldsAnimation,
    },
    {
      id: 'cf-2',
      title: intl.formatMessage({ id: 'tour.customfields.toggle.title' }),
      description: intl.formatMessage({
        id: 'tour.customfields.toggle.description',
      }),
      buttonText: intl.formatMessage({ id: 'tour.done' }),
      position: 'left',
      alignment: 'center',
      bgcolor: '#EBF9FF',
      targetSelector: '[aria-label="custom-fields-add-button"]',
      lottieData: customFieldsToggleAnimation,
    },
  ];
};

// Custom hook to get localized weekly timesheet tour steps
export const WeeklyTimesheetTourSteps = (): (Omit<
  GeneralPopoverTourStep,
  'anchorEl'
> & {
  targetSelector?: string;
})[] => {
  const intl = useIntl();

  return [
    {
      id: 'weekly-1',
      title: intl.formatMessage({ id: 'tour.weekly.step1.title' }),
      description: intl.formatMessage({
        id: 'tour.weekly.step1.description',
      }),
      buttonText: intl.formatMessage({ id: 'tour.weekly.step1.buttonText' }),
      alignment: 'top',
      position: 'right',
      distance: 10,
      skidding: 20,
      bgcolor: '#D8FFDB',
      targetSelector: '[aria-label="weekly-team-member-dropdown"]',
      lottieData: weeklyTimeEntryAnimation,
      arrowColor: '#D8FFDB',
    },
    {
      id: 'weekly-2',
      title: intl.formatMessage({ id: 'tour.weekly.step2.title' }),
      description: intl.formatMessage({
        id: 'tour.weekly.step2.description',
      }),
      buttonText: intl.formatMessage({ id: 'tour.weekly.step2.buttonText' }),
      position: 'right',
      alignment: 'top',
      distance: 10,
      skidding: 5,
      bgcolor: '#F2E9FD',
      targetSelector: '[aria-label="weekly-time-category-selector"]',
      lottieData: addTimeCategoryAnimation,
      arrowColor: '#F2E9FD',
    },
    {
      id: 'weekly-3',
      title: intl.formatMessage({ id: 'tour.weekly.step3.title' }),
      description: intl.formatMessage({
        id: 'tour.weekly.step3.description',
      }),
      buttonText: intl.formatMessage({ id: 'tour.weekly.step3.buttonText' }),
      position: 'left',
      alignment: 'left',
      distance: 10, // This is like popoverOffsetY (main-axis offset)
      skidding: 115, // This is like popoverOffsetX (cross-axis offset)
      bgcolor: '#FAF2BD',
      targetSelector: 'div[data-testid="panel"] > div',
      lottieData: enterDetailsAnimation,
      arrowColor: '#FAF2BD',
    },
    {
      id: 'weekly-4',
      title: intl.formatMessage({ id: 'tour.weekly.step4.title' }),
      description: intl.formatMessage({
        id: 'tour.weekly.step4.description',
      }),
      buttonText: intl.formatMessage({ id: 'tour.weekly.done.text' }),
      position: 'left',
      alignment: 'top',
      distance: 0,
      skidding: 0,
      bgcolor: '#F1E8FD',
      targetSelector: '[aria-label="weekly-save-button"]',
      lottieData: saveChangesAnimation,
    },
  ];
};

export const SingleTimeActivityTourSteps = (): (Omit<
  GeneralPopoverTourStep,
  'anchorEl'
> & {
  targetSelector?: string;
})[] => {
  const intl = useIntl();
  return [
    {
      id: 'single-time-activity-1',
      title: intl.formatMessage({ id: 'tour.single.time.activity1.headline' }),
      description: intl.formatMessage({
        id: 'tour.single.time.activity1.description',
      }),
      buttonText: intl.formatMessage({
        id: 'tour.single.time.activity1.nextLabel',
      }),
      alignment: 'top',
      position: 'right',
      distance: 10,
      skidding: 20,
      bgcolor: '#D8FFDB',
      targetSelector: '[aria-label="single-time-team-member-dropdown"]',
      lottieData: singleTimeActivityAnimation1,
      arrowColor: '#D8FFDB',
    },
    {
      id: 'single-time-activity-2',
      title: intl.formatMessage({ id: 'tour.single.time.activity2.headline' }),
      description: intl.formatMessage({
        id: 'tour.single.time.activity2.description',
      }),
      buttonText: intl.formatMessage({
        id: 'tour.single.time.activity2.nextLabel',
      }),
      alignment: 'top',
      position: 'right',
      distance: 10,
      skidding: 20,
      bgcolor: '#F2E9FD',
      targetSelector: '[aria-label="single-time-team-member-dropdown"]',
      lottieData: singleTimeActivityAnimation2,
      arrowColor: '#F2E9FD',
    },
    {
      id: 'single-time-activity-3',
      title: intl.formatMessage({ id: 'tour.single.time.activity3.headline' }),
      description: intl.formatMessage({
        id: 'tour.single.time.activity3.description',
      }),
      buttonText: intl.formatMessage({
        id: 'tour.single.time.activity3.nextLabel',
      }),
      alignment: 'top',
      position: 'right',
      distance: 10,
      skidding: -10,
      bgcolor: '#FEE6F3',
      targetSelector: '[aria-label="single-time-toggle-clock-in"]',
      lottieData: singleTimeActivityAnimation3,
      arrowColor: '#FEE6F3',
    },
    {
      id: 'single-time-activity-4',
      title: intl.formatMessage({ id: 'tour.single.time.activity4.headline' }),
      description: intl.formatMessage({
        id: 'tour.single.time.activity4.description',
      }),
      buttonText: intl.formatMessage({
        id: 'tour.single.time.activity4.nextLabel',
      }),
      alignment: 'bottom',
      position: 'left',
      distance: 0,
      skidding: 10,
      bgcolor: '#ECF9FF',
      targetSelector: '[aria-label="single-time-split-button"]',
      lottieData: singleTimeActivityAnimation4,
      arrowColor: '#ECF9FF',
    },
  ];
};

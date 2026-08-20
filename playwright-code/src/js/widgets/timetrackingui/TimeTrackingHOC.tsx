import React from 'react';
import { Tab, Tabs } from '@ids-ts/tabs';
import { useIntl, useSandbox } from '@payroll/quicksand';
import { TimeEntryDebugButtons } from 'src/js/widgets/timetrackingui/TimeEntryDebugButtons';

export const TIME_TRACKING_UI_TABS = {
  OVERVIEW: {
    value: 'OVERVIEW',
    label: 'tab.title.overview',
  },
  TIME_ENTRIES: {
    value: 'TIME_ENTRIES',
    label: 'tab.title.timeEntries',
  },
  SCHEDULE: {
    value: 'SCHEDULE',
    label: 'tab.title.schedule',
  },
  TIME_OFF: {
    value: 'TIME_OFF',
    label: 'tab.title.timeOff',
  },
};

export const TimeTrackingHOC = () => {
  const intl = useIntl();
  const sandbox = useSandbox();

  const [tabID, setTabID] = React.useState(
    TIME_TRACKING_UI_TABS.TIME_ENTRIES.value,
  );

  const handleChange = (newValue: string) => {
    setTabID(newValue);
  };

  return (
    <>
      <h3>
        {intl.formatMessage({
          id: 'timetrackingui.title',
        })}
      </h3>
      <Tabs
        isHorizontalRuleVisible
        isAutoSelected={false}
        selected={tabID}
        onChange={handleChange}
      >
        <Tab
          id={TIME_TRACKING_UI_TABS.OVERVIEW.value}
          title={intl.formatMessage({
            id: TIME_TRACKING_UI_TABS.OVERVIEW.label,
          })}
        >
          Overview
        </Tab>
        <Tab
          id={TIME_TRACKING_UI_TABS.TIME_ENTRIES.value}
          title={intl.formatMessage({
            id: TIME_TRACKING_UI_TABS.TIME_ENTRIES.label,
          })}
        >
          <TimeEntryDebugButtons />
        </Tab>
        <Tab
          id={TIME_TRACKING_UI_TABS.SCHEDULE.value}
          title={intl.formatMessage({
            id: TIME_TRACKING_UI_TABS.SCHEDULE.label,
          })}
        >
          Schedule
        </Tab>
        <Tab
          id={TIME_TRACKING_UI_TABS.TIME_OFF.value}
          title={intl.formatMessage({
            id: TIME_TRACKING_UI_TABS.TIME_OFF.label,
          })}
        >
          Time off
        </Tab>
      </Tabs>
    </>
  );
};

import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import { TimeDropdown } from 'src/js/widgets/common/addTimeFormComponents/TimeDropdown';
import { useGetUserInfo } from 'src/js/service/utils/useGetUserInfo';
import {
  TIME_CLOCK_DATE_WIDTH,
  TIME_CLOCK_FIELDS_WIDTH,
} from 'src/js/common/constants';
import { Date } from 'src/js/widgets/common/addTimeFormComponents/Date';
import { TimeTrackingCompanySettings } from 'src/js/service/hooks/settings/useCompanySettings';
import { useTimeClockTrackingPoints } from '../hooks/useTimeClockTrackingPoints';
import { labelPreferenceRef } from '../../common/types';
import TimerComponent from './TimerComponent';
import { CustomerProject } from '../../common/addTimeFormComponents/CustomerProject';
import {
  getTimeClockMaxDate,
  getTimeClockMinDate,
} from '../utils/timeClockUtils';

const FormRow = styled.div`
  margin-top: 24px;
  display: flex;
  justify-content: flex-start;
`;

const StartEndTimeContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  gap: 20px;
  flex: 1;

  & > * {
    flex: 1;
  }

  & > *:nth-child(3) {
    display: none;
  }

  @media (max-width: 1024px) {
    flex-wrap: wrap;
    gap: 4px;
  }
`;

const NameLabel = styled.span`
  font-size: var(--font-size-input-label);
  display: flex;
  color: var(--color-input-label);
  margin-bottom: 4px;
`;

const NameDisplay = styled.span`
  font-size: var(--font-size-component-medium);
  font-weight: var(--font-weight-component-semibold);
`;

const NameContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 4px;
`;

interface ClockInViewProps {
  labelPreference: labelPreferenceRef;
  isBillingFieldEnabled: boolean;
  hasProjects: boolean;
  todayDuration: number;
  weekDuration: number;
  settings: TimeTrackingCompanySettings;
  formValues: any;
}

const ClockInView: React.FC<ClockInViewProps> = ({
  hasProjects,
  isBillingFieldEnabled,
  labelPreference,
  todayDuration,
  weekDuration,
  settings,
  formValues,
}) => {
  const intl = useIntl();
  const { data: userInfo, loading: userInfoLoading } = useGetUserInfo();
  const minDate = getTimeClockMinDate(settings.timezone);
  const maxDate = getTimeClockMaxDate(settings.timezone);
  const sandbox = useSandbox();
  const track = useTracking();
  const clockInTrackingPoints = useTimeClockTrackingPoints();

  // run hook on component mount
  useEffect(() => {
    sandbox.logger.info('Component=TimeClockIn Event=Mounted');
    track(clockInTrackingPoints.CLOCK_IN_ON_MOUNT);
  }, [clockInTrackingPoints, sandbox.logger, track]);

  return (
    <div data-test-id="clock-in-container">
      <TimerComponent
        data-test-id="time-clock-timer"
        timerHeading={intl.formatMessage({
          id: 'timeclock.clockInToStart',
        })}
        isRunning
        component="clock-in"
        todayDuration={todayDuration}
        weekDuration={weekDuration}
        timezone={settings.timezone}
        startTime={formValues.startTime}
      />
      <FormRow data-test-id="time-clock-name-row">
        <NameContainer data-test-id="time-clock-name-container">
          <NameLabel data-test-id="time-clock-name-label">
            {intl.formatMessage({ id: 'timeclock.name' })}
          </NameLabel>
          <NameDisplay data-test-id="time-clock-name-display">
            {userInfo?.userName || ''}
          </NameDisplay>
        </NameContainer>
      </FormRow>

      <FormRow data-test-id="time-clock-date-time-row">
        <StartEndTimeContainer data-test-id="time-clock-start-time-container">
          <Date
            data-test-id="time-clock-start-date"
            name="startDate"
            trackingPoint={clockInTrackingPoints.START_DATE}
            labelId={intl.formatMessage({
              id: 'drawer.form.startDate.label',
            })}
            width={TIME_CLOCK_DATE_WIDTH}
            minDate={minDate}
            maxDate={maxDate}
          />
          <TimeDropdown
            data-test-id="time-clock-start-time"
            name="startTime"
            labelKey="drawer.form.startTime.label"
            trackingPoint={clockInTrackingPoints.START_TIME}
          />
        </StartEndTimeContainer>
      </FormRow>
      <FormRow data-test-id="time-clock-customer-project-row">
        <CustomerProject
          data-test-id="time-clock-customer-project"
          name="timeAgainst"
          trackingPoint={clockInTrackingPoints.CUSTOMER}
          hasProjects={hasProjects}
          isBillingFieldEnabled={isBillingFieldEnabled}
          toggledBillable={isBillingFieldEnabled}
          width={TIME_CLOCK_FIELDS_WIDTH}
          labelPreference={labelPreference}
          isTimeClockEntry
          shouldValidate
          isOTX
        />
      </FormRow>
    </div>
  );
};

export default ClockInView;

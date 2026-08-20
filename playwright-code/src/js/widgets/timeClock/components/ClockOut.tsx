import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from 'react';
import { useFormContext, Controller, useWatch } from 'react-hook-form';
import styled from 'styled-components';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import Button from '@ids-ts/button';
import { ArrowsLgLeftRight, CircleQuestion } from '@design-systems/icons';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import ToastMessage from '@ids-ts/toast-message';
import { TimeDropdown } from 'src/js/widgets/common/addTimeFormComponents/TimeDropdown';
import { useGetUserInfo } from 'src/js/service/utils/useGetUserInfo';
import { TimeTrackingCompanySettings } from 'src/js/service/hooks/settings/useCompanySettings';
import { getBrowserTimezone } from 'src/js/common/DateAndTimeUtils';
import {
  TIME_CLOCK_DATE_WIDTH,
  TIME_CLOCK_OUT_FIELDS_WIDTH,
  FEATURE_FLAGS,
} from 'src/js/common/constants';
import { Date } from 'src/js/widgets/common/addTimeFormComponents/Date';
import {
  CustomFields,
  mapCustomFieldsToComponentInterface,
} from 'src/js/widgets/common/customFields';
import { useGetCustomFields } from 'src/js/service/hooks/timeEntries/useGetCustomFields';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';
import { useTimeClockTrackingPoints } from '../hooks/useTimeClockTrackingPoints';
import { labelPreferenceRef } from '../../common/types';
import TimerComponent from './TimerComponent';
import { CustomerProject } from '../../common/addTimeFormComponents/CustomerProject';
import { useTimeClockFieldAssignments } from '../hooks/useTimeClockFieldAssignments';
import { Notes } from '../../common/addTimeFormComponents/Notes';
import {
  getTimeClockMaxDate,
  getTimeClockMinDate,
} from '../utils/timeClockUtils';
import { FormCurrency } from '../../common/addTimeFormComponents/FormCurrency';
import { FormCheckbox } from '../../common/addTimeFormComponents/FormCheckbox';
import { Class } from '../../common/addTimeFormComponents/Class';
import { Service } from '../../common/addTimeFormComponents/Service';
import { Location } from '../../common/addTimeFormComponents/Location';
import DimensionsField from '../../common/dimensions/DimensionsField';

// Extend dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

// Styled Components
const FormRow = styled.div`
  margin-top: 20px;
  display: flex;
  width: 530px;
  justify-content: flex-start;
`;

const FormRowBillRate = styled.div`
  & > *:nth-child(1) {
    display: flex;
    flex-flow: column;
    align-items: center;
    margin-top: 8px;
  }
  & span {
    display: inline-flex;
    width: 100%;
    margin-bottom: -4px;
    font-size: var(--font-size-input-label);
    color: var(--color-input-label);
  }
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

const NotesContainer = styled.div`
  width: 100%;

  * [class='idsTSTextarea'] {
    width: 100%;
    display: flex;
    gap: 4px;
    justify-content: flex-start;
  }

  textarea {
    width: 100%;
  }
`;

const DrawerContentWrapper = styled.div`
  position: relative;
`;

const CustomerProjectContainer = styled.div`
  width: 100%;
`;

const SwitchJobsButtonWrapper = styled.div`
  margin-top: 8px;
  display: flex;
`;

// Single row for billable + bill rate (same as STE BillableTaxableFormRow)
const BillableTaxableFormRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 24px;
  margin-top: 20px;
  flex-wrap: wrap;

  & label {
    margin: 0;
  }
`;

const BillableCheckbox = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  & label {
    margin-bottom: 0px;
  }
`;

const BillableRateField = styled.div`
  align-items: center;
  width: 100%;

  /* Override CurrencyField's internal flex layout to display label and input vertically */
  > div:first-child {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
`;

// Custom fields wrapper styling
const CustomFieldsWrapper = styled.div`
  margin-top: 20px;
  width: 530px;
`;

// Types
interface ClockOutViewProps {
  onSwitchJobs: () => Promise<void>;
  onNewJobSelected: (timeAgainst: string) => Promise<void>;
  labelPreference: labelPreferenceRef;
  settings: TimeTrackingCompanySettings;
  hasProjects: boolean;
  serviceItemPriceRef?: React.RefObject<number>;
  serviceDescriptionRef?: React.RefObject<string>;
  serviceTaxableRef: React.RefObject<boolean>;
  startTime: string;
  todayDuration: number;
  weekDuration: number;
  showErrorToast: boolean;
  errorToastMessage: string;
  onCloseErrorToast: () => void;
  setIsSwitchJobClicked: (value: boolean) => void;
  isSwitchJobClicked: boolean;
  shouldOpenDropdown: boolean;
  updateLabel: (field: string, value: string) => void;
  isDrawerOpen?: boolean; // Add this prop to track drawer state
  isBillingFieldEnabled: boolean;
}

// Custom hook to get previous value
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

const ClockOutView: React.FC<ClockOutViewProps> = ({
  onSwitchJobs,
  onNewJobSelected,
  labelPreference,
  settings,
  hasProjects,
  serviceItemPriceRef,
  serviceDescriptionRef,
  serviceTaxableRef,
  startTime,
  todayDuration,
  weekDuration,
  showErrorToast,
  errorToastMessage,
  onCloseErrorToast,
  setIsSwitchJobClicked,
  isSwitchJobClicked,
  shouldOpenDropdown,
  updateLabel,
  isDrawerOpen = false, // Default to false
  isBillingFieldEnabled,
}) => {
  // Hooks
  const intl = useIntl();
  const track = useTracking();
  const { data: userInfo } = useGetUserInfo();
  const methods = useFormContext();
  const sandbox = useSandbox();
  const clockInTrackingPoints = useTimeClockTrackingPoints();

  // State
  const [
    shouldOpenCustomerProjectDropdown,
    setShouldOpenCustomerProjectDropdown,
  ] = useState(false);

  // Refs and previous values
  const prevTimeAgainst = usePrevious(methods.watch('timeAgainst'));

  // Memoized values
  const minDate = getTimeClockMinDate(settings.timezone);
  const maxDate = getTimeClockMaxDate(settings.timezone);

  // Form values
  const timeAgainst = methods.watch('timeAgainst');
  const formValues = methods.watch();
  // Subscribe to billable so bill rate visibility updates when user toggles
  const billableChecked = useWatch({
    control: methods.control,
    name: 'billable',
    defaultValue: false,
  });

  // Get custom fields data
  const {
    customFields: rawCustomFields,
    loading: customFieldsLoading,
    query: getCustomFields,
  } = useGetCustomFields();

  // Use assignment hook to determine field visibility
  const {
    visibleCustomFields: assignedCustomFields,
    standardFieldsVisibility,
    loading: assignmentLoading,
    customFieldOptionAssignments, // CFO data for filtering dropdown options
  } = useTimeClockFieldAssignments({
    companySettings: settings,
    allCustomFields: (rawCustomFields as any) || [],
  });

  // Time Clock always uses assignment-driven field visibility.
  const isServiceFieldVisible = standardFieldsVisibility.service;
  const isClassEnabled = standardFieldsVisibility.class;
  const isLocationEnabled = standardFieldsVisibility.location;
  const isBillingSectionVisible = standardFieldsVisibility.billable;

  // Bill rate: show when billable is checked and company has bill rate enabled. No assignment check.
  const isBillRateEnable =
    settings.billingRateForTimeEnabled === true ||
    settings.billingRateForTimeEnabled === undefined;
  const shouldShowBillRate = isBillRateEnable && !!billableChecked;

  // Effects
  useEffect(() => {
    if (isSwitchJobClicked && timeAgainst && prevTimeAgainst) {
      const customerChanged =
        timeAgainst?.customer?.id !== prevTimeAgainst?.customer?.id;
      const projectChanged =
        timeAgainst?.project?.id !== prevTimeAgainst?.project?.id;
      if (
        (customerChanged || projectChanged) &&
        timeAgainst?.customer?.name !== undefined &&
        timeAgainst?.project?.name !== undefined
      ) {
        onNewJobSelected(timeAgainst);
      }
    }
  }, [isSwitchJobClicked, timeAgainst, onNewJobSelected, prevTimeAgainst]);

  useEffect(() => {
    if (shouldOpenDropdown) {
      setShouldOpenCustomerProjectDropdown(true);
    }
  }, [shouldOpenDropdown]);

  useEffect(() => {
    track(clockInTrackingPoints.CLOCK_OUT_ON_MOUNT);
    sandbox.logger.info('Component=TimeClockOut Event=Mounted');
  }, [clockInTrackingPoints, sandbox.logger, track]);

  // Handlers
  const handleSwitchJobs = () => {
    track(clockInTrackingPoints.SWITCH_JOB);
    sandbox.logger.info(
      'Component=TimeClockOut SwitchJobs Clicked Event=Clicked',
    );
    onSwitchJobs();
  };

  const handleCustomerProjectDropdownOpened = () => {
    setShouldOpenCustomerProjectDropdown(false);
  };

  const { isEnabled: isPostR2ReleaseTimeExperienceEnabled } = useIXPFeatureFlag(
    {
      flagName: FEATURE_FLAGS.QB_TIME_TRACKING_UI_R2_RELEASE,
      defaultValue: false,
    },
  );

  // Fetch custom fields when drawer opens
  useEffect(() => {
    if (isDrawerOpen && isPostR2ReleaseTimeExperienceEnabled) {
      getCustomFields({
        variables: {
          filter: { deleted: false },
        },
      });
    }
  }, [isDrawerOpen, isPostR2ReleaseTimeExperienceEnabled, getCustomFields]);

  // Get form context values to access custom field values
  const formCustomFields =
    useWatch({
      control: methods.control,
      name: 'customFields',
    }) || {};

  // Time Clock always uses assignment-filtered custom fields.
  const fieldsToDisplay = assignedCustomFields as any;

  // Map custom fields to match our component interface and merge with form values
  const customFields = mapCustomFieldsToComponentInterface(
    fieldsToDisplay,
    formCustomFields,
  );

  // Helper function to format time in browser timezone
  const formatTimeForDisplay = () => {
    if (startTime) {
      // Convert startTime to browser timezone for display
      const browserTimezone = getBrowserTimezone();
      const browserTime = dayjs(startTime).tz(browserTimezone);
      return browserTime.format('h:mm A');
    }

    return '';
  };

  return (
    <DrawerContentWrapper data-testid="clock-out-drawer-content">
      <TimerComponent
        timerHeading={`${userInfo?.userName || ''} ${intl.formatMessage({
          id: 'timeclock.clocked.in.at',
        })} ${formatTimeForDisplay()}`}
        startTime={startTime}
        isRunning={!!startTime || isSwitchJobClicked}
        todayDuration={todayDuration}
        timezone={settings.timezone}
        weekDuration={weekDuration}
      />
      <FormRow data-testid="start-date-time-row">
        <StartEndTimeContainer>
          <Date
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
            name="startTime"
            labelKey="drawer.form.startTime.label"
            trackingPoint={clockInTrackingPoints.START_TIME}
          />
        </StartEndTimeContainer>
      </FormRow>
      <FormRow data-testid="customer-project-row">
        <CustomerProjectContainer>
          <CustomerProject
            name="timeAgainst"
            shouldValidate
            trackingPoint={clockInTrackingPoints.CUSTOMER}
            hasProjects={hasProjects}
            isBillingFieldEnabled={isBillingFieldEnabled}
            toggledBillable={formValues.billable}
            width={TIME_CLOCK_OUT_FIELDS_WIDTH}
            labelPreference={labelPreference}
            shouldOpenDropdown={shouldOpenCustomerProjectDropdown}
            onDropdownOpened={handleCustomerProjectDropdownOpened}
            isTimeClockEntry
            isOTX
          />
          <SwitchJobsButtonWrapper>
            <Button
              type="button"
              size="small"
              priority="secondary"
              onClick={handleSwitchJobs}
              style={{ minWidth: 0 }}
              data-testid="switch-jobs-button"
              aria-label="timeclock-switch-jobs-button"
            >
              <ArrowsLgLeftRight size="small" />
              {intl.formatMessage({ id: 'clockout.switch.jobs' })}
            </Button>
          </SwitchJobsButtonWrapper>
        </CustomerProjectContainer>
      </FormRow>
      {isServiceFieldVisible && (
        <FormRow>
          <Service
            name="service"
            width={TIME_CLOCK_OUT_FIELDS_WIDTH}
            serviceItemPriceRef={serviceItemPriceRef}
            serviceTaxableRef={serviceTaxableRef}
            serviceDescriptionRef={serviceDescriptionRef}
            trackingPoint={clockInTrackingPoints.SERVICE}
            isServiceRequired={settings.serviceItemRequired} // required fields are only for time entries
            shouldValidate
            isOTX
            isTimeEntry
            companySettings={settings}
            timeForEntityId={formValues.timeFor?.id}
            customerId={formValues.timeAgainst?.customer?.id}
            projectId={formValues.timeAgainst?.project?.id}
          />
        </FormRow>
      )}

      {isBillingSectionVisible && (
        <BillableTaxableFormRow data-testid="clockout-billing-row">
          <BillableCheckbox>
            <FormCheckbox
              name="billable"
              labelKey="timeclock.form.billable.label"
              trackingPoint={clockInTrackingPoints.BILL_RATE_CHECKBOX}
            />
          </BillableCheckbox>
          {shouldShowBillRate && (
            <BillableRateField>
              <FormCurrency
                name="billRate"
                shouldValidate={false}
                labelKey={intl.formatMessage({
                  id: 'timeclock.form.billRate.label',
                })}
                width={TIME_CLOCK_OUT_FIELDS_WIDTH}
                trackingPoint={clockInTrackingPoints.BILL_RATE}
                maxLength={11}
              />
            </BillableRateField>
          )}
        </BillableTaxableFormRow>
      )}
      {isClassEnabled && (
        <FormRow>
          <Class
            name="class"
            width={TIME_CLOCK_OUT_FIELDS_WIDTH}
            trackingPoint={clockInTrackingPoints.CLASS}
            isClassRequired={settings.classRequired} // required fields are only for time entries
            shouldValidate
            isOTX
            isTimeEntry
            companySettings={settings}
            timeForEntityId={formValues.timeFor?.id}
            customerId={formValues.timeAgainst?.customer?.id}
            projectId={formValues.timeAgainst?.project?.id}
          />
        </FormRow>
      )}
      {isLocationEnabled && (
        <FormRow>
          <Location
            name="location"
            width={TIME_CLOCK_OUT_FIELDS_WIDTH}
            trackingPoint={clockInTrackingPoints.LOCATION}
            labelPreference={labelPreference}
            updateLabel={updateLabel}
            isLocationRequired={settings.locationRequired} // required fields are only for time entries
            shouldValidate
            isOTX
            isTimeEntry
            companySettings={settings}
            timeForEntityId={formValues.timeFor?.id}
            customerId={formValues.timeAgainst?.customer?.id}
            projectId={formValues.timeAgainst?.project?.id}
          />
        </FormRow>
      )}
      {isPostR2ReleaseTimeExperienceEnabled &&
        !customFieldsLoading &&
        customFields.length > 0 && (
          <CustomFields
            customFields={customFields}
            readOnly={false}
            trackingPoint={clockInTrackingPoints}
            customFieldOptionAssignments={customFieldOptionAssignments}
            shouldUseAssignments
          />
        )}
      <DimensionsField
        trackingPoint={clockInTrackingPoints}
        isTimeEntry
        isOTX
        prefillWorkerDefaultsWhenEmpty
      />
      <FormRow data-testid="notes-row">
        <NotesContainer>
          <Notes
            name="notes"
            trackingPoint={clockInTrackingPoints.NOTES}
            isNotesRequired={settings.timeSheetEntryMakesNotesRequiredEnabled} // required fields are only for time entries
            shouldValidate
          />
        </NotesContainer>
      </FormRow>
      {showErrorToast && (
        <ToastMessage
          open={showErrorToast}
          onClose={onCloseErrorToast}
          title={intl.formatMessage({
            id: 'timeclock.clockin.error.title',
            defaultMessage: "We couldn't clock you in",
          })}
          data-testid="error-toast"
        >
          {errorToastMessage ||
            intl.formatMessage({
              id: 'timeclock.clockin.error.body',
              defaultMessage: 'Try clocking in again.',
            })}
        </ToastMessage>
      )}
    </DrawerContentWrapper>
  );
};

export default ClockOutView;

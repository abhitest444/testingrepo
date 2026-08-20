import React, { useEffect, useMemo, useState } from 'react';
import { useIntl, useSandbox } from '@payroll/quicksand';
import { Info } from '@design-systems/icons';
import Tooltip from '@ids-ts/tooltip';
import styled from 'styled-components';
import dayjs from 'dayjs';

import { useFormContext, useWatch, Controller } from 'react-hook-form';
import { QuickbooksOnlineSandbox } from '@appfabric/sandbox-spec';
import { HorizontalRule } from 'src/js/widgets/common/HorizontalRule';
import { Date } from 'src/js/widgets/common/addTimeFormComponents/Date';
import {
  TeamMember,
  TimeForType,
} from 'src/js/widgets/common/addTimeFormComponents/TeamMember';
import { FormCurrency } from 'src/js/widgets/common/addTimeFormComponents/FormCurrency';
import { TimeDropdown } from 'src/js/widgets/common/addTimeFormComponents/TimeDropdown';
import { Duration } from 'src/js/widgets/common/addTimeFormComponents/Duration';
import { Service } from 'src/js/widgets/common/addTimeFormComponents/Service';
import { Class } from 'src/js/widgets/common/addTimeFormComponents/Class';
import { Location } from 'src/js/widgets/common/addTimeFormComponents/Location';
import { Mileage } from 'src/js/widgets/common/addTimeFormComponents/Mileage';
import { Notes } from 'src/js/widgets/common/addTimeFormComponents/Notes';
import { FormSwitch } from 'src/js/widgets/common/addTimeFormComponents/FormSwitch';
import { ToggleBreak } from 'src/js/widgets/common/addTimeFormComponents/ToggleBreak';
import { FormCheckbox } from 'src/js/widgets/common/addTimeFormComponents/FormCheckbox';
import { FormCompensation } from 'src/js/widgets/common/addTimeFormComponents/FormCompensation';
import { computeIsPayTypeEnabled } from 'src/js/service/hooks/paytypes/payTypeUtils';
import { getRegion } from 'src/js/service/ApolloClientBuilderUtils';
import { SingleTimeFormChildProps } from 'src/js/widgets/singleTimeTrowser/components/SingleTimeForm';
import {
  getSingleTimeTrackingPoints,
  TRACKING_FIELD_NAMES,
} from 'src/js/widgets/singleTimeTrowser/singleTimeTrackingPoints';
import { CustomerProject } from 'src/js/widgets/common/addTimeFormComponents/CustomerProject';
import { FEATURE_FLAGS } from 'src/js/common/constants';
import {
  CustomFields,
  mapCustomFieldsToComponentInterface,
} from 'src/js/widgets/common/customFields';
import DimensionsField from 'src/js/widgets/common/dimensions/DimensionsField';
import { useGetCustomFields } from 'src/js/service/hooks/timeEntries/useGetCustomFields';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';
import { mapQBTimezoneToDayjsTimezone } from 'src/js/common/DateAndTimeUtils';
import { useSTEFieldAssignments } from 'src/js/widgets/singleTimeTrowser/hooks/useSTEFieldAssignments';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';
import TimeZoneField from '../../common/addTimeFormComponents/TimeZoneField';

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding-bottom: 15px;
`;

const FormRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;
`;

const CostRateRow = styled(FormRow)`
  margin-bottom: 8px;
`;

const CurrentlyWorkingRow = styled.div`
  padding-top: 10px;
`;

const BillableTaxableFormRow = styled(FormRow)`
  margin-top: 8px;
`;

const ToggleClockInRow = styled.div`
  margin-top: 5px;
`;

// Custom fields wrapper styling
const CustomFieldsWrapper = styled.div`
  margin-top: 20px;
  width: 100%;
`;

const TimeDetailsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`;

export const SingleTimeFormMobile = ({
  userFirstName,
  settings,
  hideTimeEntryFieldsPreferences,
  toggledClockIn,
  toggledBillable,
  toggledCurrentlyWorking,
  toggledBreak,
  hasPayroll,
  hasProjects,
  hasAdminAccess,
  timeForType,
  timeTrackingOnlyId,
  serviceItemPriceRef,
  serviceDescriptionRef,
  serviceTaxableRef,
  isBillRateEnable,
  labelPreference,
  timeOffMethod,
  isOTX,
  updateLabel,
  dispatchLoading,
  isMileageEnabled,
  timeForContactDAS,
  timeAgainstContactDAS,
  classDAS,
  departmentDAS,
  isBillableFieldAssignedRef,
  shouldShowTeamMemberField = true,
}: SingleTimeFormChildProps) => {
  const intl = useIntl();
  const formContext = useFormContext();
  const sandbox = useSandbox();
  const isPayTypeEnabled = computeIsPayTypeEnabled(getRegion(sandbox));
  const { control } = formContext;
  const WIDTH_ONE = 120;

  // Use useWatch to reactively get form values
  const timesheetId = useWatch({ control, name: 'id' });
  const isExported = useWatch({ control, name: 'isExported' });
  // Check if this is an existing time record by looking for an ID in the form state
  const isExistingTimeRecord = !!timesheetId;
  // Check if this is a time entry by looking for the isExported field, by default it's true indicating a time activity
  const isTimeEntry = isExported === false;

  // state to show the quick find widget
  const [showQuickFindWidget, setShowQuickFindWidget] = useState(false);

  // Get the appropriate tracking points based on page type and environment
  const trackingPoints = useMemo(
    () =>
      getSingleTimeTrackingPoints({
        isSingleTimeEntry: isTimeEntry,
        isWorkforce: isWorkforceEnvironment(sandbox),
      }),
    [isTimeEntry, sandbox],
  );

  // Helper function to get the appropriate tracking point based on the tracking points object
  const getTrackingPoint = (trackingPointKey: keyof typeof trackingPoints) =>
    trackingPoints[trackingPointKey];

  // Helper function to get the appropriate tracking points object
  const getTrackingPoints = () => trackingPoints;

  // Show currently working checkbox only when
  // 1. It is a time entry
  // 2. It is an OTX customer (paid time subscription)
  // 3. The clock-in toggle is enabled (in start end time mode)
  // 4. New time entry creation or an existing open time entry (i.e. has no end time)
  const isClosedExistingEntry =
    isExistingTimeRecord && !toggledCurrentlyWorking;
  const shouldShowCurrentlyWorkingCheckbox =
    isTimeEntry && isOTX && toggledClockIn && !isClosedExistingEntry;

  // Handle currentlyWorking and endTime interactions
  useEffect(() => {
    // Return if it is not a existing time entry
    const isExistingTimeEntry = isTimeEntry && isExistingTimeRecord;
    if (!isExistingTimeEntry) {
      return;
    }

    // Auto-set current time when unchecking currentlyWorking
    if (
      !toggledCurrentlyWorking &&
      formContext.getValues().endTime === undefined
    ) {
      const timezone = formContext.getValues().timezone ?? settings.timezone;
      const currentTime = dayjs().tz(mapQBTimezoneToDayjsTimezone(timezone));
      formContext.setValue('endTime', currentTime);
    }
  }, [
    toggledCurrentlyWorking,
    isExistingTimeRecord,
    isTimeEntry,
    formContext,
    settings.timezone,
  ]);

  const {
    isEnabled: isPostR2ReleaseTimeExperienceEnabled,
    settled: isPostR2ReleaseTimeExperienceEnabledSettled,
  } = useIXPFeatureFlag({
    flagName: FEATURE_FLAGS.QB_TIME_TRACKING_UI_R2_RELEASE,
    defaultValue: false,
  });

  // Feature flag for negative bill rate - evaluated once at form level
  const { isEnabled: isAllowNegativeBillRateEnabled } = useIXPFeatureFlag({
    flagName: FEATURE_FLAGS.QB_TIME_ALLOW_NEGATIVE_BILL_RATE_TIME_ACTIVITY,
    defaultValue: false,
  });

  // Use lazy query to get custom fields on demand
  const {
    customFields: rawCustomFields,
    loading: customFieldsLoading,
    query: getCustomFields,
  } = useGetCustomFields();

  const isWorkforceUser = isWorkforceEnvironment(
    sandbox as QuickbooksOnlineSandbox,
  );

  // Fetch custom fields when conditions are met
  useEffect(() => {
    const shouldFetchCustomFields =
      isPostR2ReleaseTimeExperienceEnabled && isOTX && isTimeEntry;

    if (shouldFetchCustomFields) {
      getCustomFields({
        variables: {
          filter: { deleted: false },
        },
      });
    }
  }, [
    isPostR2ReleaseTimeExperienceEnabled,
    isOTX,
    isTimeEntry,
    getCustomFields,
  ]);

  useEffect(() => {
    const shouldShowNewQuickfind =
      ((isPostR2ReleaseTimeExperienceEnabled &&
        isPostR2ReleaseTimeExperienceEnabledSettled) ||
        isWorkforceUser) &&
      isTimeEntry &&
      isOTX;
    setShowQuickFindWidget(Boolean(shouldShowNewQuickfind));
  }, [
    isOTX,
    isPostR2ReleaseTimeExperienceEnabled,
    isPostR2ReleaseTimeExperienceEnabledSettled,
    isTimeEntry,
    isWorkforceUser,
  ]);

  // Initialize custom fields in form state when they are first fetched
  useEffect(() => {
    if (rawCustomFields && rawCustomFields.length > 0 && isTimeEntry && isOTX) {
      const currentFormCustomFields =
        formContext.getValues().customFields || {};

      // Only initialize if form doesn't already have custom fields
      if (Object.keys(currentFormCustomFields).length === 0) {
        // Initialize custom fields using ID-based structure
        const initializedCustomFields: Record<string, any> = {};
        rawCustomFields.forEach((field) => {
          // Check if this field already exists in form state (for edit mode)
          const existingField = currentFormCustomFields[field.id];

          initializedCustomFields[field.id] = {
            id: field.id,
            name: field.name?.trim() || '',
            value: existingField?.value || '', // Use existing value if available
            optionID: existingField?.optionID || '', // Use existing optionID if available
            required: field.required || false,
            deleted: field.deleted || false,
          };
        });

        formContext.setValue('customFields', initializedCustomFields, {
          shouldDirty: false,
          shouldTouch: false,
        });
      }
    }
  }, [rawCustomFields, isTimeEntry, isOTX, formContext]);
  // Get form context values to access custom field values
  const formCustomFields = formContext.getValues().customFields || {};

  // Map custom fields to match our component interface and merge with form values
  const customFields = mapCustomFieldsToComponentInterface(
    rawCustomFields,
    formCustomFields,
  );

  // Use assignment hook to determine field visibility (for OTX time entries only)
  const {
    visibleCustomFields,
    standardFieldsVisibility,
    loading: assignmentLoading,
    workerId,
    customerId,
    projectId,
    customFieldOptionAssignments, // CFO data for filtering dropdown options
  } = useSTEFieldAssignments({
    companySettings: settings,
    uxPreferences: hideTimeEntryFieldsPreferences,
    allCustomFields: customFields || [],
    isOTX: isOTX ?? false,
    isTimeEntry,
  });

  // Determine if we should use assignments
  const shouldUseAssignments = isOTX && isTimeEntry;

  // Calculate base field visibility
  const baseClassEnabled = isTimeEntry
    ? settings.isTsheetClassEnabled
    : settings.isClassEnabled &&
      hideTimeEntryFieldsPreferences.isClassFieldEnabled;

  const baseLocationEnabled = isTimeEntry
    ? settings.isTsheetLocationEnabled
    : settings.isLocationEnabled &&
      hideTimeEntryFieldsPreferences.isLocationFieldEnabled;

  // Determine final field visibility based on assignment override logic
  const finalServiceEnabled = shouldUseAssignments
    ? standardFieldsVisibility.service
    : settings.isServiceFieldEnabled;

  const finalClassEnabled = shouldUseAssignments
    ? standardFieldsVisibility.class
    : baseClassEnabled;

  const finalLocationEnabled = shouldUseAssignments
    ? standardFieldsVisibility.location
    : baseLocationEnabled;

  const finalBillableEnabled = shouldUseAssignments
    ? standardFieldsVisibility.billable
    : settings.isBillingFieldEnabled;

  useEffect(() => {
    if (isBillableFieldAssignedRef) {
      isBillableFieldAssignedRef.current = finalBillableEnabled;
    }
  }, [finalBillableEnabled, isBillableFieldAssignedRef]);

  const finalCustomFields = shouldUseAssignments
    ? visibleCustomFields
    : customFields;

  // Required CFs with no assigned options: do not show (handled in hook) and do not validate.
  // For dropdown/multi_select, treat as required only if we have assigned options.
  const finalCustomFieldsWithEffectiveRequired = useMemo(() => {
    if (!finalCustomFields?.length) return finalCustomFields;
    return finalCustomFields.map((field) => {
      const isDropdown =
        field.type?.toUpperCase() === 'DROPDOWN' ||
        field.type?.toUpperCase() === 'MULTI_SELECT' ||
        (field.options && field.options.length > 0);
      const hasOptions =
        Array.isArray(customFieldOptionAssignments?.[field.id]) &&
        customFieldOptionAssignments[field.id].length > 0;
      const effectiveRequired = field.required && (!isDropdown || hasOptions);
      return { ...field, required: effectiveRequired };
    });
  }, [finalCustomFields, customFieldOptionAssignments]);

  // Determine if bill rate field should be shown (same as Desktop: use toggledBillable prop, time entry uses setting)
  const shouldShowBillRate =
    isBillRateEnable &&
    toggledBillable &&
    (isTimeEntry ? settings.billingRateForTimeEnabled : true);

  // For backward compatibility, keep these variables
  const isClassEnabled = finalClassEnabled;
  const isLocationEnabled = finalLocationEnabled;

  return (
    <FormContainer>
      {timeTrackingOnlyId && (
        <>
          <h3>
            {intl.formatMessage(
              {
                id: 'hello.title',
              },
              {
                firstName: userFirstName,
              },
            )}
          </h3>
        </>
      )}

      {shouldShowTeamMemberField && (
        <>
          <span>
            {intl.formatMessage({
              id: 'select.team.member',
            })}
          </span>

          <FormRow>
            <TeamMember
              name="timeFor"
              timeTrackingOnlyId={timeTrackingOnlyId}
              trackingPoint={getTrackingPoint(TRACKING_FIELD_NAMES.TEAM_MEMBER)}
              setTeamMemberLoading={(loading) =>
                dispatchLoading?.({ type: 'SET_TEAM_MEMBER_LOADING', loading })
              }
              showQuickFindWidget={showQuickFindWidget}
              timeForContactDAS={timeForContactDAS}
            />
          </FormRow>
        </>
      )}

      <HorizontalRule />

      <h3>
        {intl.formatMessage({
          id: 'time.details',
        })}
      </h3>

      <TimeDetailsContainer>
        <FormRow>
          <Date
            name="startDate"
            trackingPoint={getTrackingPoint(TRACKING_FIELD_NAMES.START_DATE)}
            labelId="drawer.form.startDate.label"
          />
        </FormRow>

        {/* End Date - to show only for time entries and when timesheet is entered by start-end time */}
        {toggledClockIn && isTimeEntry && !toggledCurrentlyWorking && isOTX && (
          <FormRow>
            <Date
              name="endDate"
              labelId="drawer.form.endDate.label"
              trackingPoint={getTrackingPoint(TRACKING_FIELD_NAMES.END_DATE)}
            />
          </FormRow>
        )}

        <ToggleClockInRow>
          {/* FormSwitch will be disabled for existing time entries */}
          <FormSwitch
            name="toggleClockIn"
            isdisabled={isExistingTimeRecord && isTimeEntry}
            trackingPoints={getTrackingPoints()}
          />
        </ToggleClockInRow>

        {toggledClockIn && (
          <>
            {shouldShowCurrentlyWorkingCheckbox && (
              <CurrentlyWorkingRow>
                <FormCheckbox
                  name="currentlyWorking"
                  labelKey="currently.working"
                  trackingPoint={getTrackingPoint(
                    TRACKING_FIELD_NAMES.CURRENTLY_WORKING,
                  )}
                  defaultChecked={false}
                  onChange={(checked) => {
                    if (checked) {
                      // Clear any validation errors from endTime field else it will prevent saving the time entry
                      formContext.clearErrors('endTime');
                    }
                  }}
                />
              </CurrentlyWorkingRow>
            )}
            <FormRow>
              <TimeDropdown
                name="startTime"
                labelKey="drawer.form.startTime.label"
                trackingPoint={getTrackingPoint(
                  TRACKING_FIELD_NAMES.START_TIME,
                )}
              />
            </FormRow>
            {!toggledCurrentlyWorking && (
              <FormRow>
                <TimeDropdown
                  name="endTime"
                  labelKey="drawer.form.endTime.label"
                  trackingPoint={getTrackingPoint(
                    TRACKING_FIELD_NAMES.END_TIME,
                  )}
                />
              </FormRow>
            )}
          </>
        )}

        {!toggledClockIn && (
          <Duration
            name="duration"
            shouldValidate
            nonZeroDuration={isTimeEntry}
            trackingPoint={getTrackingPoint(TRACKING_FIELD_NAMES.DURATION)}
          />
        )}
      </TimeDetailsContainer>

      {/* Timezone field - only to be shown for paid time customers in Time Entry panel */}
      {isTimeEntry && toggledClockIn && isOTX && (
        <Controller
          name="timezone"
          control={formContext.control}
          render={({ field }) => (
            <TimeZoneField
              name="timezone"
              readOnly={false}
              value={field.value || settings.timezone}
              onChange={field.onChange}
              trackingPoint={getTrackingPoint(TRACKING_FIELD_NAMES.TIMEZONE)}
            />
          )}
        />
      )}

      {/* Removing add break for STE until new break panel is ready */}
      {!toggledBreak && toggledClockIn && !isTimeEntry && (
        <ToggleBreak
          name="toggleBreak"
          trackingPoint={getTrackingPoint(TRACKING_FIELD_NAMES.TOGGLE_BREAK)}
        />
      )}

      {toggledBreak && toggledClockIn && (
        <>
          <HorizontalRule />
          <h3>
            {intl.formatMessage({
              id: 'break.details',
            })}
          </h3>
          <span>
            {intl.formatMessage({
              id: 'break.details.content',
            })}
          </span>
          <FormRow>
            <Duration
              name="breakDuration"
              labelKey="break"
              isBreakField
              shouldValidate={toggledBreak}
              trackingPoint={getTrackingPoint(
                TRACKING_FIELD_NAMES.BREAK_DURATION,
              )}
            />
            <ToggleBreak
              name="toggleBreak"
              trackingPoint={getTrackingPoint(
                TRACKING_FIELD_NAMES.TOGGLE_BREAK,
              )}
            />
          </FormRow>
        </>
      )}

      <HorizontalRule />

      <h3>
        {intl.formatMessage({
          id: 'job.details',
        })}
      </h3>

      <FormRow>
        <CustomerProject
          name="timeAgainst"
          shouldValidate
          trackingPoint={getTrackingPoint(TRACKING_FIELD_NAMES.CUSTOMER)}
          hasProjects={hasProjects}
          toggledBillable={toggledBillable}
          isBillingFieldEnabled={settings.isBillingFieldEnabled}
          labelPreference={labelPreference}
          setCustomerProjectLoading={(loading) =>
            dispatchLoading?.({ type: 'SET_CUSTOMER_PROJECT_LOADING', loading })
          }
          isOTX={isOTX}
          isTimeEntry={isTimeEntry}
          timeAgainstContactDAS={timeAgainstContactDAS}
        />
        {/* <Customer */}
        {/*  name="customer" */}
        {/*  canAddNew={canAddNew} */}
        {/*  trackingPoint={SINGLE_TIME_TRACKING_POINTS.CUSTOMER} */}
        {/* /> */}
      </FormRow>

      {/* {hideTimeEntryFieldsPreferences.isProjectFieldEnabled && ( */}
      {/*  <FormRow> */}
      {/*    <Project */}
      {/*      name="project" */}
      {/*      canAddNew={canAddNew} */}
      {/*      trackingPoint={SINGLE_TIME_TRACKING_POINTS.PROJECT} */}
      {/*    /> */}
      {/*  </FormRow> */}
      {/* )} */}

      <FormRow>
        {finalServiceEnabled && (
          <Service
            name="service"
            shouldValidate
            isServiceRequired={isTimeEntry && settings.serviceItemRequired} // required fields are only for time entries
            trackingPoint={getTrackingPoint(TRACKING_FIELD_NAMES.SERVICE)}
            serviceItemPriceRef={serviceItemPriceRef}
            serviceDescriptionRef={serviceDescriptionRef}
            serviceTaxableRef={serviceTaxableRef}
            setServiceLoading={(loading) =>
              dispatchLoading?.({ type: 'SET_SERVICE_LOADING', loading })
            }
            isOTX={isOTX}
            isTimeEntry={isTimeEntry}
            companySettings={settings}
            timeForEntityId={workerId}
            customerId={customerId}
            projectId={projectId}
          />
        )}
      </FormRow>

      {finalClassEnabled && (
        <FormRow>
          <Class
            name="class"
            shouldValidate
            isClassRequired={isTimeEntry && settings.classRequired} // required fields are only for time entries
            trackingPoint={getTrackingPoint(TRACKING_FIELD_NAMES.CLASS)}
            setClassLoading={(loading) =>
              dispatchLoading?.({ type: 'SET_CLASS_LOADING', loading })
            }
            isOTX={isOTX}
            isTimeEntry={isTimeEntry}
            companySettings={settings}
            timeForEntityId={workerId}
            customerId={customerId}
            projectId={projectId}
            classDAS={classDAS}
          />
        </FormRow>
      )}

      {finalLocationEnabled && (
        <FormRow>
          <Location
            name="location"
            shouldValidate
            isLocationRequired={isTimeEntry && settings.locationRequired} // required fields are only for time entries
            trackingPoint={getTrackingPoint(TRACKING_FIELD_NAMES.LOCATION)}
            labelPreference={labelPreference}
            updateLabel={updateLabel}
            setLocationLoading={(loading) =>
              dispatchLoading?.({ type: 'SET_LOCATION_LOADING', loading })
            }
            isOTX={isOTX}
            isTimeEntry={isTimeEntry}
            companySettings={settings}
            timeForEntityId={workerId}
            customerId={customerId}
            projectId={projectId}
            departmentDAS={departmentDAS}
          />
        </FormRow>
      )}

      {isMileageEnabled && (
        <FormRow>
          <Mileage
            name="mileage"
            trackingPoint={getTrackingPoint(TRACKING_FIELD_NAMES.MILEAGE)}
            autoCalculateTrackingPoint={getTrackingPoint(
              TRACKING_FIELD_NAMES.AUTO_CALCULATE_MILEAGE,
            )}
          />
        </FormRow>
      )}

      {/*
      Custom fields widget is only shown for time entries
      */}
      {isTimeEntry &&
        isOTX &&
        isPostR2ReleaseTimeExperienceEnabled &&
        !customFieldsLoading &&
        finalCustomFieldsWithEffectiveRequired.length > 0 && (
          <CustomFields
            customFields={finalCustomFieldsWithEffectiveRequired}
            readOnly={false}
            trackingPoint={trackingPoints}
            customFieldOptionAssignments={customFieldOptionAssignments}
            shouldUseAssignments={shouldUseAssignments}
          />
        )}

      {/* Dimensions (IES) — same gating as desktop. */}
      <DimensionsField
        trackingPoint={trackingPoints}
        isTimeEntry={isTimeEntry}
        isOTX={!!isOTX}
      />

      {/* Time Activity only field */}
      {hasPayroll &&
        isPayTypeEnabled &&
        !isTimeEntry &&
        timeForType !== TimeForType.VENDOR &&
        hasAdminAccess &&
        hideTimeEntryFieldsPreferences.isPayTypeFieldEnabled && (
          <FormRow>
            <FormCompensation
              name="payType"
              trackingPoint={getTrackingPoint(TRACKING_FIELD_NAMES.PAY_TYPE)}
              timeOffMethod={timeOffMethod}
            />
          </FormRow>
        )}

      {/* Time Activity only field */}
      {hasProjects &&
        !isTimeEntry &&
        hideTimeEntryFieldsPreferences.isCostRateFieldEnabled && (
          <CostRateRow>
            <FormCurrency
              name="costRate"
              labelKey="cost.rate"
              shouldValidate={false}
              setVendorCostRateVisibility={timeForType === TimeForType.VENDOR}
              costRateToolTipVisibility
              tooltipInfoId="costRate.info"
              trackingPoint={getTrackingPoint(TRACKING_FIELD_NAMES.COST_RATE)}
              maxLength={11}
            />
          </CostRateRow>
        )}

      {/* Time Activity only field */}
      {settings.isTaxableFieldEnabled &&
        hideTimeEntryFieldsPreferences.isTaxableFieldEnabled &&
        toggledBillable && (
          <BillableTaxableFormRow>
            <FormCheckbox
              name="taxable"
              labelKey="taxable"
              trackingPoint={getTrackingPoint(TRACKING_FIELD_NAMES.TAXABLE)}
            />
          </BillableTaxableFormRow>
        )}

      {finalBillableEnabled && (
        <BillableTaxableFormRow>
          <FormCheckbox
            name="billable"
            labelKey="drawer.form.billable.label"
            trackingPoint={getTrackingPoint(TRACKING_FIELD_NAMES.BILLABLE)}
          />

          <Tooltip message="Billable Info">
            <Info />
          </Tooltip>
          {shouldShowBillRate && (
            <FormCurrency
              name="billRate"
              shouldValidate={false}
              trackingPoint={getTrackingPoint(TRACKING_FIELD_NAMES.BILL_RATE)}
              maxLength={11}
              width={WIDTH_ONE}
              allowNegative={isAllowNegativeBillRateEnabled && !isTimeEntry}
            />
          )}
        </BillableTaxableFormRow>
      )}

      <Notes
        name="notes"
        shouldValidate
        isNotesRequired={
          isTimeEntry && settings.timeSheetEntryMakesNotesRequiredEnabled
        } // required fields are only for time entries
        trackingPoint={getTrackingPoint(TRACKING_FIELD_NAMES.NOTES)}
      />
    </FormContainer>
  );
};

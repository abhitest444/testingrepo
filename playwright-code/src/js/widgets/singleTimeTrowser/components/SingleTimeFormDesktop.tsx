import React, { useEffect, useState, useMemo } from 'react';
import styled from 'styled-components';
import dayjs from 'dayjs';

import Tooltip from '@ids-ts/tooltip';
import { CircleQuestion } from '@design-systems/icons';
import { useIntl, useSandbox } from '@payroll/quicksand';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import Widget from 'web-shell-core/widgets/HOCWidget';
import { QuickbooksOnlineSandbox } from '@appfabric/sandbox-spec';
import { SingleTimeFormChildProps } from 'src/js/widgets/singleTimeTrowser/components/SingleTimeForm';
import {
  TeamMember,
  TimeForType,
} from 'src/js/widgets/common/addTimeFormComponents/TeamMember';
import { Location } from 'src/js/widgets/common/addTimeFormComponents/Location';
import { Mileage } from 'src/js/widgets/common/addTimeFormComponents/Mileage';
import { Service } from 'src/js/widgets/common/addTimeFormComponents/Service';
import { Class } from 'src/js/widgets/common/addTimeFormComponents/Class';
import { FormCurrency } from 'src/js/widgets/common/addTimeFormComponents/FormCurrency';
import { Date } from 'src/js/widgets/common/addTimeFormComponents/Date';
import { Notes } from 'src/js/widgets/common/addTimeFormComponents/Notes';
import { Duration } from 'src/js/widgets/common/addTimeFormComponents/Duration';
import { TimeDropdown } from 'src/js/widgets/common/addTimeFormComponents/TimeDropdown';
import { FormSwitch } from 'src/js/widgets/common/addTimeFormComponents/FormSwitch';
import { FormCheckbox } from 'src/js/widgets/common/addTimeFormComponents/FormCheckbox';
import { ToggleBreak } from 'src/js/widgets/common/addTimeFormComponents/ToggleBreak';
import { FormCompensation } from 'src/js/widgets/common/addTimeFormComponents/FormCompensation';
import { computeIsPayTypeEnabled } from 'src/js/service/hooks/paytypes/payTypeUtils';
import { getRegion } from 'src/js/service/ApolloClientBuilderUtils';
import { breakPoints } from 'src/js/common/screenSizeUtils';
import {
  getSingleTimeTrackingPoints,
  TRACKING_FIELD_NAMES,
} from 'src/js/widgets/singleTimeTrowser/singleTimeTrackingPoints';
import { CustomerProject } from 'src/js/widgets/common/addTimeFormComponents/CustomerProject';
import { useSingleTimeTotals } from 'src/js/widgets/singleTimeTrowser/hooks/useSingleTimeTotals';
import { FEATURE_FLAGS } from 'src/js/common/constants';
import {
  CustomFields,
  mapCustomFieldsToComponentInterface,
} from 'src/js/widgets/common/customFields';
import { useGetCustomFields } from 'src/js/service/hooks/timeEntries/useGetCustomFields';
import DimensionsField from 'src/js/widgets/common/dimensions/DimensionsField';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';
import { useFeatureFlag } from 'src/js/common/hooks/useFeatureFlag';
import { mapQBTimezoneToDayjsTimezone } from 'src/js/common/DateAndTimeUtils';
import { useSTEFieldAssignments } from 'src/js/widgets/singleTimeTrowser/hooks/useSTEFieldAssignments';
import { useHasPaytypeAccess } from 'src/js/common/hooks/useHasPaytypeAccess';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';
import TimeZoneField from '../../common/addTimeFormComponents/TimeZoneField';

// Main form container - two column layout
const FormContainer = styled.div`
  display: flex;
  flex-direction: row;
  max-width: 1264px;
  gap: 60px;

  @media (max-width: ${breakPoints.md}px) {
    gap: 30px;
  }
`;

// Left column - basic form fields
const FirstFormColumn = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 475px;
  min-width: 230px;
  width: 100%;
  gap: 3px; // there is already extra invisible spacing around the Quickfills dropdowns

  * [class^='DropdownTypeahead-wrapper'],
  * [class*='Dropdown-dropdownContainer-'],
  * [class*='Dropdown-textField-'] {
    width: 100% !important;
  }

  [class^='idsTSDropdown'] [class^='TextField-quickbooks'] {
    width: 100% !important;
  }
`;

// Right column - time and notes fields
const SecondFormColumn = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 730px;
  min-width: 230px;
  width: 100%;
  padding: 0;
  gap: 6px;

  * [class^='DropdownTypeahead-wrapper'] {
    width: 100% !important;
  }
`;

// Standard form row wrapper
const FormRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: left;
  align-items: center;

  // Below css help us to match the width of Name,Customer/Project,Location,Class,Pay type with the series field.
  div:first-child {
    width: 100%;
    div:first-child {
      width: inherit;
    }
  }
`;

// Break field row with top alignment
const BreakFormRow = styled(FormRow)`
  align-items: start;
  display: flex;
  flex-direction: row;
  justify-content: left;
`;

// const ServiceFormRow = styled.div`
//   display: flex;
//   flex-direction: row;
//   justify-content: left;
//   align-items: center;

//   div:first-child {
//     width: 100%;
//   }
// `;

// Billable, bill rate and taxable fields container
const BillableTaxableFormRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: left;
  align-items: center;
  height: 55px;
  gap: var(--space-column-gap-large);
  padding-right: 5px;

  label {
    margin: 0;
  }

  @media (max-width: ${breakPoints.md}px) {
    flex-wrap: wrap;
    height: auto;
    gap: 12px;
    align-items: center;
  }

  @media (max-width: ${breakPoints.sm}px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
`;

// Cost rate field wrapper
const CostRateFormRow = styled.div`
  margin-top: 4px;
`;

// Clock toggle and currently working controls
const ClockInControlsRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 16px;
  align-items: flex-start;
  margin: 10px 0 8px 0;

  // to avoid extra height for checkbox
  max-height: 28px;

  @media (max-width: ${breakPoints.md}px) {
    gap: 12px;
    max-height: 48px;
    flex-wrap: wrap;
  }
`;

// Billable checkbox and tooltip wrapper
const BillableCheckbox = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  white-space: nowrap;

  @media (max-width: ${breakPoints.sm}px) {
    white-space: normal;
    flex-wrap: wrap;
  }
`;

// Bill rate and taxable field wrapper
const BillableRateTaxableField = styled.div`
  gap: 8px;
  margin-top: 8px;
  align-items: center;
  white-space: nowrap;
  @media (max-width: ${breakPoints.sm}px) {
    width: 100%;
  }
`;

// Tooltip content spacing
const TooltipContent = styled.div`
  display: flex;
  align-items: center;
`;

// Notes textarea container
const NotesContainer = styled.div`
  width: 100%;

  * [class='idsTSTextarea'] {
    width: 100%;
    height: 296px;
  }

  textarea {
    width: 100%;
    height: 296px;
  }
`;

// Time summary display container
const SummaryContainer = styled.p<{ hasError?: boolean }>`
  margin-top: ${(props) => (props.hasError ? '50px' : '35px')};
  font-size: 16px;
  font-weight: 600;
`;

const StartEndTimeContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 12px;
  width: 100%;
  @media (max-width: 1024px) {
    flex-wrap: wrap;
    gap: 4px;
  }
`;

const DateTimeFieldContainer = styled.div`
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  white-space: nowrap;

  .qbdsDatePicker,
  .idsTSTextField,
  input {
    width: 100% !important;
    min-width: 0;
    box-sizing: border-box;
  }
`;

const WIDTH_ONE = 230;

const TimeDetailsRow = styled.div`
  max-width: 475px;
`;

// Custom fields container
const CustomFieldsWrapper = styled.div`
  width: 100%;
`;

export const SingleTimeFormDesktop = ({
  userFirstName,
  settings,
  hideTimeEntryFieldsPreferences,
  toggledClockIn,
  toggledBillable,
  toggledBreak,
  toggledCurrentlyWorking,
  hasPayroll,
  hasProjects,
  hasAdminAccess,
  timeForType,
  timeTrackingOnlyId,
  billableStatus,
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
  const { control } = formContext;
  const sandbox = useSandbox();
  const isPayTypeEnabled = computeIsPayTypeEnabled(getRegion(sandbox));
  // Use useWatch to reactively get form values
  const timesheetId = useWatch({ control, name: 'id' });
  const isExported = useWatch({ control, name: 'isExported' });
  const inputBillRate = useWatch({ control, name: 'billRate' });
  const timeFor = useWatch({ control, name: 'timeFor' });
  const timeAgainst = useWatch({ control, name: 'timeAgainst' });
  // Check if this is an existing time record by looking for an ID in the form state
  const isExistingTimeRecord = !!timesheetId;
  // Check if this is a time entry by looking for the isExported field, by default it's true indicating a time activity
  const isTimeEntry = isExported === false;

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

  const {
    currencyRate: initialCurrencyRate,
    durationCurrencyCalcAmount: initialDurationCurrencyCalcAmount,
    clockedInCurrencyCalcAmount: initialClockedInCurrencyCalcAmount,
    durationHours,
    durationMinutes,
    clockedInHours,
    clockedInMinutes,
    netDurationInSeconds: clockedInDurationInSeconds,
    billable,
  } = useSingleTimeTotals();
  const currencyRate = formContext.getValues().billable
    ? initialCurrencyRate
    : '';
  const durationCurrencyCalcAmount = formContext.getValues().billable
    ? initialDurationCurrencyCalcAmount
    : '';
  const clockedInCurrencyCalcAmount = formContext.getValues().billable
    ? initialClockedInCurrencyCalcAmount
    : '';
  // taxable field is only available for time activities
  const plusTax =
    formContext.getValues().billable &&
    formContext.getValues().taxable &&
    !isTimeEntry
      ? intl.formatMessage({ id: 'plus.tax' })
      : '';
  // const isBillRateEnable = isShowBillableRateEnable ? (canAccessSalesInfo || showBillRateToAll) : true

  // state to track inputDuration so as to allow break validation based on user duration input
  const [inputDurationInSeconds, setInputDurationInSeconds] = useState(
    clockedInDurationInSeconds,
  );
  const [showQuickFindWidget, setShowQuickFindWidget] = useState(false);
  const [customFieldsInitialized, setCustomFieldsInitialized] = useState(false);

  // Determine if bill rate field should be shown (restored pre-assignment logic: use toggledBillable prop, time entry uses setting)
  const shouldShowBillRate =
    isBillRateEnable &&
    toggledBillable &&
    (isTimeEntry ? settings.billingRateForTimeEnabled : true);

  // Determine if class field should be shown
  const isClassEnabled = isTimeEntry
    ? settings.isTsheetClassEnabled
    : settings.isClassEnabled &&
      hideTimeEntryFieldsPreferences.isClassFieldEnabled;

  // Determine if location field should be shown
  const isLocationEnabled = isTimeEntry
    ? settings.isTsheetLocationEnabled
    : settings.isLocationEnabled &&
      hideTimeEntryFieldsPreferences.isLocationFieldEnabled;

  // Show currently working checkbox only when
  // 1. It is a time entry
  // 2. It is an OTX customer (paid time subscription)
  // 3. The clock-in toggle is enabled (in start end time mode)
  // 4. New time entry creation or an existing open time entry (i.e. has no end time)
  const isClosedExistingEntry =
    isExistingTimeRecord && !toggledCurrentlyWorking;
  const shouldShowCurrentlyWorkingCheckbox =
    isTimeEntry && isOTX && toggledClockIn && !isClosedExistingEntry;

  const isWorkforceUser = isWorkforceEnvironment(
    sandbox as QuickbooksOnlineSandbox,
  );

  useEffect(() => {
    setInputDurationInSeconds(clockedInDurationInSeconds);
  }, [clockedInDurationInSeconds]);

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

  // Set TeamMember loading state to false when field is hidden.
  useEffect(() => {
    if (!shouldShowTeamMemberField && dispatchLoading) {
      dispatchLoading({ type: 'SET_TEAM_MEMBER_LOADING', loading: false });
    }
  }, [shouldShowTeamMemberField, dispatchLoading]);

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
    if (
      rawCustomFields &&
      rawCustomFields.length > 0 &&
      isTimeEntry &&
      isOTX &&
      !customFieldsInitialized
    ) {
      const currentFormCustomFields =
        formContext.getValues().customFields || {};
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

      setCustomFieldsInitialized(true); // Prevent re-initialization
    }
  }, [
    rawCustomFields,
    isTimeEntry,
    isOTX,
    formContext,
    customFieldsInitialized,
  ]);

  // Get form context values to access custom field values
  const formCustomFields = formContext.getValues().customFields || {};

  // Map custom fields to match our component interface and merge with form values
  const customFields = useMemo(
    () =>
      mapCustomFieldsToComponentInterface(rawCustomFields, formCustomFields),
    [rawCustomFields, formCustomFields],
  ); // Only recompute when these change

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

  // For OTX time entries: use assignment data (overrides settings).
  // Otherwise: fall back to settings.
  const shouldUseAssignments = isOTX && isTimeEntry;

  const finalServiceEnabled = shouldUseAssignments
    ? standardFieldsVisibility.service
    : settings.isServiceFieldEnabled;

  const finalClassEnabled = shouldUseAssignments
    ? standardFieldsVisibility.class
    : isClassEnabled;

  const finalLocationEnabled = shouldUseAssignments
    ? standardFieldsVisibility.location
    : isLocationEnabled;

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

  // Feature flag to enable PayType dropdown for non-admin users
  const isPayTypeForNonAdminEnabled = useFeatureFlag(
    FEATURE_FLAGS.QB_TIME_TRACKING_UI_ENABLE_PAYTYPE_DROPDOWN_FOR_NON_ADMIN,
  );

  const { hasPaytypeAccess, isLoading: isLoadingPaytypeAccess } =
    useHasPaytypeAccess(sandbox, {
      enabled: isPayTypeForNonAdminEnabled,
    });

  const hasNonAdminPaytypeAccess =
    isPayTypeForNonAdminEnabled && !isLoadingPaytypeAccess && hasPaytypeAccess;

  // TODO WFS: Need to add condition of employee's role (i.e. manager role or employee role) with these two conditions too.
  return (
    <FormContainer>
      <FirstFormColumn>
        {shouldShowTeamMemberField && (
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
        )}

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
              dispatchLoading?.({
                type: 'SET_CUSTOMER_PROJECT_LOADING',
                loading,
              })
            }
            isOTX={isOTX}
            isTimeEntry={isTimeEntry}
            timeAgainstContactDAS={timeAgainstContactDAS}
          />
        </FormRow>
        {finalServiceEnabled && (
          <FormRow>
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
          </FormRow>
        )}
        {finalBillableEnabled && (
          <BillableTaxableFormRow>
            <BillableCheckbox>
              <FormCheckbox
                name="billable"
                labelKey="drawer.form.billable.label"
                trackingPoint={getTrackingPoint(TRACKING_FIELD_NAMES.BILLABLE)}
              />
              <Tooltip
                tooltipOffsetSkidding={-2}
                message={intl.formatMessage({
                  id: 'billable.info',
                })}
              >
                <TooltipContent>
                  <CircleQuestion color="#6B6C72" />
                </TooltipContent>
              </Tooltip>
            </BillableCheckbox>
            <BillableRateTaxableField>
              {shouldShowBillRate && (
                <FormCurrency
                  name="billRate"
                  shouldValidate={false}
                  width={100}
                  trackingPoint={getTrackingPoint(
                    TRACKING_FIELD_NAMES.BILL_RATE,
                  )}
                  maxLength={11}
                  tooltipInfoId={
                    timeForType === TimeForType.EMPLOYEE
                      ? 'bill.rate.tooltip.employee'
                      : 'bill.rate.tooltip.vendor'
                  }
                  billRateToolTipVisibility
                  allowNegative={isAllowNegativeBillRateEnabled && !isTimeEntry}
                />
              )}
            </BillableRateTaxableField>
            {/* Time Activity only field */}
            <BillableRateTaxableField>
              {settings.isTaxableFieldEnabled &&
                hideTimeEntryFieldsPreferences.isTaxableFieldEnabled &&
                toggledBillable &&
                !isTimeEntry && (
                  <FormCheckbox
                    name="taxable"
                    labelKey="taxable"
                    trackingPoint={getTrackingPoint(
                      TRACKING_FIELD_NAMES.TAXABLE,
                    )}
                  />
                )}
            </BillableRateTaxableField>
          </BillableTaxableFormRow>
        )}
        {finalClassEnabled && (
          <FormRow>
            <Class
              name="class"
              shouldValidate
              isClassRequired={isTimeEntry && settings.classRequired}
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
              trackingPoint={getTrackingPoint(TRACKING_FIELD_NAMES.LOCATION)}
              isLocationRequired={isTimeEntry && settings.locationRequired} // required fields are only for time entries
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
        {/* {hideTimeEntryFieldsPreferences.isProjectFieldEnabled && ( */}
        {/*  <FormRow> */}
        {/*    <Project */}
        {/*      name="project" */}
        {/*      canAddNew={canAddNew} */}
        {/*      trackingPoint={SINGLE_TIME_TRACKING_POINTS.PROJECT} */}
        {/*    /> */}
        {/*  </FormRow> */}
        {/* )} */}

        {/* Time Activity only field */}
        {hasPayroll &&
          isPayTypeEnabled &&
          !isTimeEntry &&
          timeForType !== TimeForType.VENDOR &&
          (hasAdminAccess || hasNonAdminPaytypeAccess) &&
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
          hideTimeEntryFieldsPreferences.isCostRateFieldEnabled &&
          hasAdminAccess && (
            <CostRateFormRow>
              <FormCurrency
                name="costRate"
                labelKey="cost.rate"
                shouldValidate={false}
                setVendorCostRateVisibility={timeForType === TimeForType.VENDOR}
                costRateToolTipVisibility
                tooltipInfoId="costRate.info"
                width={WIDTH_ONE}
                trackingPoint={getTrackingPoint(TRACKING_FIELD_NAMES.COST_RATE)}
                maxLength={11}
              />
            </CostRateFormRow>
          )}

        {/*
        Custom fields widget is only shown for time entries
        */}
        {isTimeEntry &&
          isOTX &&
          isPostR2ReleaseTimeExperienceEnabled &&
          !customFieldsLoading &&
          finalCustomFieldsWithEffectiveRequired.length > 0 && (
            <CustomFieldsWrapper>
              <CustomFields
                customFields={finalCustomFieldsWithEffectiveRequired}
                className="singleTimeEntry"
                readOnly={false}
                trackingPoint={trackingPoints}
                customFieldOptionAssignments={customFieldOptionAssignments}
                shouldUseAssignments={shouldUseAssignments}
              />
            </CustomFieldsWrapper>
          )}
        {/* Dimensions (IES) — gated by flag + IES + Time Elite; only shown for
            time entries on OTX, same as custom fields. */}
        <DimensionsField
          trackingPoint={trackingPoints}
          isTimeEntry={isTimeEntry}
          isOTX={!!isOTX}
        />
      </FirstFormColumn>

      <SecondFormColumn>
        <ClockInControlsRow>
          {/* FormSwitch will be disabled for existing time entries */}
          <div aria-label="single-time-toggle-clock-in">
            <FormSwitch
              name="toggleClockIn"
              isdisabled={isExistingTimeRecord && isTimeEntry}
              trackingPoints={getTrackingPoints()}
            />
          </div>
          {/* show currently working only to OTX customers for time entries that are clocked in */}
          {shouldShowCurrentlyWorkingCheckbox && (
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
          )}
        </ClockInControlsRow>

        <TimeDetailsRow>
          {/* Date and time view with clock in toggled on */}
          {toggledClockIn && (
            <>
              {/* View for OTX i.e paid time customers */}
              {isOTX && (
                <>
                  <StartEndTimeContainer>
                    {/* Start Date */}
                    <DateTimeFieldContainer>
                      <Date
                        name="startDate"
                        trackingPoint={getTrackingPoint(
                          TRACKING_FIELD_NAMES.START_DATE,
                        )}
                        labelId="drawer.form.startDate.label"
                      />
                    </DateTimeFieldContainer>
                    {/* Start Time */}
                    <DateTimeFieldContainer>
                      <TimeDropdown
                        name="startTime"
                        labelKey="drawer.form.startTime.label"
                        trackingPoint={getTrackingPoint(
                          TRACKING_FIELD_NAMES.START_TIME,
                        )}
                        billableStatus={billableStatus}
                      />
                    </DateTimeFieldContainer>
                  </StartEndTimeContainer>
                  <StartEndTimeContainer>
                    {/* End Date and Time - only show when not currently working */}
                    {!toggledCurrentlyWorking && (
                      <>
                        <DateTimeFieldContainer>
                          <Date
                            name="endDate"
                            labelId="drawer.form.endDate.label"
                            trackingPoint={getTrackingPoint(
                              TRACKING_FIELD_NAMES.END_DATE,
                            )}
                          />
                        </DateTimeFieldContainer>
                        <DateTimeFieldContainer>
                          <TimeDropdown
                            name="endTime"
                            labelKey="drawer.form.endTime.label"
                            trackingPoint={getTrackingPoint(
                              TRACKING_FIELD_NAMES.END_TIME,
                            )}
                            billableStatus={billableStatus}
                          />
                        </DateTimeFieldContainer>
                      </>
                    )}
                  </StartEndTimeContainer>
                </>
              )}

              {/* View for non-OTX i.e free data or customers who never took time subscription */}
              {!isOTX && (
                <>
                  <StartEndTimeContainer>
                    {/* Start Date */}
                    <DateTimeFieldContainer>
                      <Date
                        name="startDate"
                        trackingPoint={getTrackingPoint(
                          TRACKING_FIELD_NAMES.START_DATE,
                        )}
                        labelId="drawer.form.startDate.label"
                      />
                    </DateTimeFieldContainer>
                  </StartEndTimeContainer>
                  <StartEndTimeContainer>
                    {/* Start Time */}
                    <DateTimeFieldContainer>
                      <TimeDropdown
                        name="startTime"
                        labelKey="drawer.form.startTime.label"
                        trackingPoint={getTrackingPoint(
                          TRACKING_FIELD_NAMES.START_TIME,
                        )}
                        billableStatus={billableStatus}
                      />
                    </DateTimeFieldContainer>
                    {/* End Time - only show when not currently working */}
                    {!toggledCurrentlyWorking && (
                      <DateTimeFieldContainer>
                        <TimeDropdown
                          name="endTime"
                          labelKey="drawer.form.endTime.label"
                          trackingPoint={getTrackingPoint(
                            TRACKING_FIELD_NAMES.END_TIME,
                          )}
                          billableStatus={billableStatus}
                        />
                      </DateTimeFieldContainer>
                    )}
                  </StartEndTimeContainer>
                </>
              )}
            </>
          )}

          {/* Date and time view with clock in toggled off */}
          {!toggledClockIn && (
            <StartEndTimeContainer>
              <DateTimeFieldContainer>
                <Date
                  name="startDate"
                  trackingPoint={getTrackingPoint(
                    TRACKING_FIELD_NAMES.START_DATE,
                  )}
                  labelId="drawer.form.startDate.label"
                />
              </DateTimeFieldContainer>
              <DateTimeFieldContainer>
                <Duration
                  name="duration"
                  shouldValidate
                  nonZeroDuration={isTimeEntry}
                  trackingPoint={getTrackingPoint(
                    TRACKING_FIELD_NAMES.DURATION,
                  )}
                  billableStatus={billableStatus}
                />
              </DateTimeFieldContainer>
            </StartEndTimeContainer>
          )}

          {/* Break section */}
          {toggledClockIn && !isTimeEntry && (
            <BreakFormRow>
              {toggledBreak && (
                <DateTimeFieldContainer>
                  <Duration
                    name="breakDuration"
                    shouldValidate={toggledBreak}
                    isBreakField
                    labelKey="break"
                    trackingPoint={getTrackingPoint(
                      TRACKING_FIELD_NAMES.BREAK_DURATION,
                    )}
                  />
                </DateTimeFieldContainer>
              )}
              <ToggleBreak
                name="toggleBreak"
                trackingPoint={getTrackingPoint(
                  TRACKING_FIELD_NAMES.TOGGLE_BREAK,
                )}
              />
            </BreakFormRow>
          )}

          {/* Timezone field - only to be shown for paid time customers in Time Entry panel */}
          {toggledClockIn && isTimeEntry && isOTX && (
            <FormRow>
              <Controller
                name="timezone"
                control={formContext.control}
                render={({ field }) => (
                  <TimeZoneField
                    name="timezone"
                    readOnly={false}
                    value={field.value || settings.timezone}
                    onChange={field.onChange}
                    trackingPoint={trackingPoints.TIMEZONE} // timezone is only available for time entries
                    data-testid="timezone-field"
                  />
                )}
              />
            </FormRow>
          )}
        </TimeDetailsRow>

        <FormRow>
          <NotesContainer>
            <Notes
              name="notes"
              shouldValidate
              isNotesRequired={
                isTimeEntry && settings.timeSheetEntryMakesNotesRequiredEnabled
              } // required fields are only for time entries
              trackingPoint={getTrackingPoint(TRACKING_FIELD_NAMES.NOTES)}
            />
          </NotesContainer>
        </FormRow>

        {/* Summary */}
        {((!toggledClockIn && formContext.getValues().duration > 0) ||
          (toggledClockIn && inputDurationInSeconds > 0)) &&
          !toggledCurrentlyWorking && (
            <FormRow>
              <SummaryContainer
                hasError={!!formContext.formState.errors.notes?.message}
              >
                {isBillRateEnable &&
                settings.isBillingFieldEnabled &&
                inputBillRate !== null
                  ? intl.formatMessage(
                      { id: 'single.time.activity.summary' },
                      {
                        hours: toggledClockIn
                          ? clockedInHours || 0
                          : durationHours || 0,
                        minutes: toggledClockIn
                          ? clockedInMinutes || 0
                          : durationMinutes || 0,
                        billable,
                        currencyRate,
                        amount: toggledClockIn
                          ? clockedInCurrencyCalcAmount
                          : durationCurrencyCalcAmount,
                        plusTax,
                      },
                    )
                  : intl.formatMessage(
                      { id: 'single.time.activity.summary.time.only' },
                      {
                        hours: toggledClockIn
                          ? clockedInHours || 0
                          : durationHours || 0,
                        minutes: toggledClockIn
                          ? clockedInMinutes || 0
                          : durationMinutes || 0,
                      },
                    )}
              </SummaryContainer>
            </FormRow>
          )}

        {toggledClockIn && inputDurationInSeconds < 0 && (
          <FormRow>
            <SummaryContainer
              hasError={!!formContext.formState.errors.notes?.message}
            >
              {intl.formatMessage({
                id: 'time.tracking.validation.duration.required',
              })}
            </SummaryContainer>
          </FormRow>
        )}
      </SecondFormColumn>
    </FormContainer>
  );
};

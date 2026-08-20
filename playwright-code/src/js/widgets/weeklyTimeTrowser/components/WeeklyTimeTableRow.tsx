import { Table } from '@ids-ts/table';
import React, { useContext, useRef, useState, useEffect } from 'react';
import { Dayjs } from 'dayjs';
import styled from 'styled-components';
import { useFormContext, useWatch } from 'react-hook-form';

import { useIntl, useSandbox } from '@payroll/quicksand';
import { CircleQuestion, Delete } from '@design-systems/icons';
import { IconControl } from '@ids-ts/icon-control';
import Tooltip from '@ids-ts/tooltip';
import LightTooltip from 'src/js/widgets/common/LightTooltip';
import {
  getIsWeekdayHidden,
  UxPreferenceData,
  UxPreferenceHideWeekdaysData,
  UxPreferenceKey,
} from 'src/js/service/utils/useUXPreferences';
import { useCurrencyFormat } from 'src/js/service/utils/sandboxUtils';
import { useHasPaytypeAccess } from 'src/js/common/hooks/useHasPaytypeAccess';
import { FormCurrency } from 'src/js/widgets/common/addTimeFormComponents/FormCurrency';
import { Class } from 'src/js/widgets/common/addTimeFormComponents/Class';
import { Service } from 'src/js/widgets/common/addTimeFormComponents/Service';
import { Location } from 'src/js/widgets/common/addTimeFormComponents/Location';
import { FormCheckbox } from 'src/js/widgets/common/addTimeFormComponents/FormCheckbox';
import { FormCompensation } from 'src/js/widgets/common/addTimeFormComponents/FormCompensation';
import { computeIsPayTypeEnabled } from 'src/js/service/hooks/paytypes/payTypeUtils';
import { getRegion } from 'src/js/service/ApolloClientBuilderUtils';
import { Notes } from 'src/js/widgets/common/addTimeFormComponents/Notes';
import {
  getTimeDurationInHHMMFormat,
  groupComponentsIntoRows,
} from 'src/js/common/MiscUtils';
import { TimeTrackingCompanySettings } from 'src/js/service/hooks/settings/useCompanySettings';
import {
  useRowBillableTotal,
  useRowTimeTotal,
} from 'src/js/widgets/weeklyTimeTrowser/hooks/useWeeklyTotals';
import { DurationCell } from 'src/js/widgets/common/addTimeFormComponents/DurationCell';
import { WEEKLY_TIME_TRACKING_POINTS } from 'src/js/common/useClickTracking';
import { TimeForType } from 'src/js/widgets/common/addTimeFormComponents/TeamMember';
import { CustomerProject } from 'src/js/widgets/common/addTimeFormComponents/CustomerProject';
import { KeyboardNavigationContext } from 'src/js/common/useKeyboardNavigation';
import { TimeOffMethod } from 'src/__generated__/gas/graphql';
import { TimeTracking_BillableStatus } from 'src/__generated__/timeTracking/graphql';
import { useFeatureFlag } from 'src/js/common/hooks/useFeatureFlag';
import { labelPreferenceRef, ServiceSalesData } from '../../common/types';
import { NOTES_FIELD_ROWS, FEATURE_FLAGS } from '../../../common/constants';
import { WeeklyTimeRowDurationState } from '../hooks/useWeeklyTimeFormRows';
import { isDurationLockedPending } from '../hooks/mapWeeklyTimeForm';

const JobDetailsTableCell = styled(Table.Cell)`
  border-right: 1px solid var(--color-container-border-tertiary);
  border-bottom: 1px solid var(--color-container-border-tertiary);
  padding-left: 8px !important;
  padding-top: 8px !important;
  position: unset !important;
`;

const JobDetailsContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-height: 50em;
  overflow: visible;

  * [class^='DropdownTypeahead-wrapper'] {
    min-width: 215px;
    width: 100%;
  }

  * [class*='Dropdown-dropdownContainer'] {
    min-width: 215px !important;
    width: 100%;
    flex-grow: 1;
    flex-basis: 30%;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  @media (min-width: 1080px) {
    * [class^='DropdownTypeahead-wrapper'] {
      min-width: 232px;
    }

    * [class*='Dropdown-dropdownContainer'] {
      min-width: 232px !important;
    }
  }

  @media (min-width: 1400px) {
    * [class*='Dropdown-dropdownContainer'] {
      max-width: 50%;
    }
  }
`;

const JobDetailsContainerRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px 20px;
  visibility: visible;
  flex-wrap: wrap;
  align-items: flex-end;

  > div:has([class^='DropdownTypeahead-wrapper']) {
    flex-grow: 1;
    flex-basis: 30%;
  }

  @media (min-width: 1400px) {
    > div:has([class^='DropdownTypeahead-wrapper']) {
      max-width: 50%;
    }
  }
`;

const BillableContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: left;
  align-items: center;
  gap: 5px;
  height: 40px;
  min-width: 268px;

  label {
    margin-right: 0 !important;
  }
`;

const TaxableContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: left;
  align-items: center;
  gap: 5px;
  flex-grow: 0;
  flex-basis: 30%;
  height: 40px;
`;

const DaysAndNoteTableCell = styled(Table.Cell)`
  border-bottom: 1px solid var(--color-container-border-tertiary);
  vertical-align: top;
  padding: 32px 0 0 0 !important;
`;

const DurationAndNotesTableContentContainer = styled.div`
  overflow: visible;
  max-height: 50em;
  padding-left: 20px;
  padding-bottom: 12px;
  position: relative;
  width: 100%;
`;

const DaysContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  position: relative;
  width: 100%;
  gap: 24px;
`;

const DurationTableCell = styled.div<{ visibleColumnCount: number }>`
  display: flex;
  justify-content: flex-end;
  width: 100%;
`;

const NotesContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 20px;
  flex-grow: 1;
  visibility: visible;
`;

const DataTableCell = styled(Table.Cell)`
  border-bottom: 1px solid var(--color-container-border-tertiary);
  vertical-align: top;
  padding-right: 0 !important;
`;

const DataCellContainer = styled.div`
  width: auto;
  padding: 24px 0 0 0 !important;
  color: var(--Primitives-Gray-gray-100, #393a3d);
  font-size: var(--font-size-component-medium);
  font-style: normal;
  font-weight: var(--font-weight-component);
  line-height: 20px; /* 125% */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: right;
`;

const DeleteTableCell = styled(Table.Cell)`
  border-bottom: 1px solid var(--color-container-border-tertiary);
  vertical-align: top;
  padding: 28px 8px 0px 0 !important;
  text-align: right;
`;

const generateJobDetailsComponents = (
  rowIndex: number,
  preferences: UxPreferenceData,
  settings: TimeTrackingCompanySettings,
  hasPayroll: boolean,
  hasAdminAccess: boolean,
  hasProjects: boolean,
  rowTotal: number,
  timeForType: TimeForType,
  serviceItemPriceRef: React.MutableRefObject<number>,
  serviceTaxableRef: React.MutableRefObject<boolean>,
  serviceDescriptionRef: React.MutableRefObject<string>,
  preLoadedServiceItemsRef: React.MutableRefObject<ServiceSalesData>,
  updateLabel: (field: string, value: string) => void,
  onBillableChange: (isBillable: boolean | undefined) => void,
  toggledBillable: boolean,
  isFormEdited: React.MutableRefObject<boolean[]>,
  labelPreference: labelPreferenceRef,
  isBillRateEnable: boolean,
  timeOffMethod: TimeOffMethod | null,
  intl: any,
  hasNonAdminPaytypeAccess: boolean,
  isAllowNegativeBillRateEnabled: boolean,
  isPayTypeEnabled: boolean,
) => {
  const hideTimeEntryFieldsPreferences =
    preferences[UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS];

  const fields = [
    <CustomerProject
      name={`weeklyTimeRows.${rowIndex}.timeAgainst`}
      trackingPoint={WEEKLY_TIME_TRACKING_POINTS.CUSTOMER}
      hasProjects={hasProjects}
      shouldValidate={rowTotal > 0}
      updateLabel={updateLabel}
      toggledBillable={toggledBillable}
      isBillingFieldEnabled={settings.isBillingFieldEnabled}
      labelPreference={labelPreference}
      aria-label="weekly-timesheet-time-category-selector"
    />,
    // <Customer
    //   name={`weeklyTimeRows.${rowIndex}.customer`}
    //   canAddNew={canAddNew}
    //   trackingPoint={WEEKLY_TIME_TRACKING_POINTS.CUSTOMER}
    // />,
    // hideTimeEntryFieldsPreferences.isProjectFieldEnabled && (
    //   <Project
    //     name={`weeklyTimeRows.${rowIndex}.project`}
    //     canAddNew={canAddNew}
    //     trackingPoint={WEEKLY_TIME_TRACKING_POINTS.PROJECT}
    //   />
    // ),
    settings.isClassEnabled &&
      hideTimeEntryFieldsPreferences.isClassFieldEnabled && (
        <Class
          name={`weeklyTimeRows.${rowIndex}.class`}
          updateLabel={updateLabel}
          trackingPoint={WEEKLY_TIME_TRACKING_POINTS.CLASS}
        />
      ),
    settings.isServiceFieldEnabled && (
      <Service
        name={`weeklyTimeRows.${rowIndex}.service`}
        trackingPoint={WEEKLY_TIME_TRACKING_POINTS.SERVICE}
        serviceItemPriceRef={serviceItemPriceRef}
        serviceDescriptionRef={serviceDescriptionRef}
        serviceTaxableRef={serviceTaxableRef}
        preLoadedServiceItemsRef={preLoadedServiceItemsRef}
        updateLabel={updateLabel}
        isFormEdited={isFormEdited}
        rowIndex={rowIndex}
      />
    ),
    settings.isLocationEnabled &&
      hideTimeEntryFieldsPreferences.isLocationFieldEnabled && (
        <Location
          name={`weeklyTimeRows.${rowIndex}.location`}
          trackingPoint={WEEKLY_TIME_TRACKING_POINTS.LOCATION}
          updateLabel={updateLabel}
          labelPreference={labelPreference}
        />
      ),
    hasPayroll &&
      isPayTypeEnabled &&
      (hasAdminAccess || hasNonAdminPaytypeAccess) &&
      timeForType === TimeForType.EMPLOYEE &&
      hideTimeEntryFieldsPreferences.isPayTypeFieldEnabled && (
        <FormCompensation
          name={`weeklyTimeRows.${rowIndex}.payType`}
          width="auto"
          updateLabel={updateLabel}
          trackingPoint={WEEKLY_TIME_TRACKING_POINTS.PAY_TYPE}
          timeOffMethod={timeOffMethod}
        />
      ),
    hasProjects &&
      hideTimeEntryFieldsPreferences.isCostRateFieldEnabled &&
      hasAdminAccess && (
        <FormCurrency
          name={`weeklyTimeRows.${rowIndex}.costRate`}
          labelKey="cost.rate"
          shouldValidate={false}
          showOnly
          width="auto"
          costRateToolTipVisibility
          tooltipInfoId="costRate.info"
          trackingPoint={WEEKLY_TIME_TRACKING_POINTS.COST_RATE}
        />
      ),
    settings.isBillingFieldEnabled && (
      <>
        <BillableContainer>
          <FormCheckbox
            name={`weeklyTimeRows.${rowIndex}.billable`}
            labelKey="drawer.form.billable.label"
            trackingPoint={WEEKLY_TIME_TRACKING_POINTS.BILLABLE}
            onChange={onBillableChange}
          />
          <Tooltip
            tooltipOffsetSkidding={-13}
            message={intl.formatMessage({
              id: 'billable.info',
            })}
          >
            <CircleQuestion color="#6B6C72" />
          </Tooltip>
          {toggledBillable && isBillRateEnable && (
            <FormCurrency
              name={`weeklyTimeRows.${rowIndex}.billRate`}
              shouldValidate={toggledBillable}
              width={68}
              trackingPoint={WEEKLY_TIME_TRACKING_POINTS.BILL_RATE}
              tooltipInfoId={
                timeForType === TimeForType.EMPLOYEE
                  ? 'bill.rate.tooltip.employee'
                  : 'bill.rate.tooltip.vendor'
              }
              billRateToolTipVisibility
              allowNegative={isAllowNegativeBillRateEnabled}
            />
          )}
        </BillableContainer>
      </>
    ),
    settings.isTaxableFieldEnabled &&
      settings.isBillingFieldEnabled &&
      hideTimeEntryFieldsPreferences.isTaxableFieldEnabled &&
      toggledBillable && (
        <TaxableContainer>
          <FormCheckbox
            name={`weeklyTimeRows.${rowIndex}.taxable`}
            labelKey="taxable"
            trackingPoint={WEEKLY_TIME_TRACKING_POINTS.TAXABLE}
          />
        </TaxableContainer>
      ),
  ];

  return fields.filter(Boolean) as React.JSX.Element[];
};

export const getVisibleWeekdayDurationCells = (
  rowIndex: number,
  startDate: Dayjs,
  hideWeekdaysData: UxPreferenceHideWeekdaysData,
  setError: (name: string, error: { type: string; message?: string }) => void,
): React.JSX.Element[] => {
  const visibleColumnCount = Object.values(hideWeekdaysData).filter(
    (isHidden) => !isHidden,
  ).length;
  return Array.from({ length: 7 }, (_, index) =>
    !getIsWeekdayHidden(
      startDate.add(index, 'days').day(),
      hideWeekdaysData,
    ) ? (
      <DurationTableCell key={index} visibleColumnCount={visibleColumnCount}>
        <DurationCell
          name={`weeklyTimeRows.${rowIndex}.durations.${index}`}
          setError={setError}
          trackingPoint={WEEKLY_TIME_TRACKING_POINTS.DURATION}
          data-testid={index === 0 ? 'weekly-timesheet-time-cell' : undefined}
        />
      </DurationTableCell>
    ) : null,
  ).filter(Boolean) as React.JSX.Element[];
};

export interface WeeklyTimeEntryTableRowProps {
  rowIndex: number;
  onDelete: (index: number) => void;
  preferences: UxPreferenceData;
  settings: TimeTrackingCompanySettings;
  billRate: number | null;
  hasPayroll: boolean;
  hasProjects: boolean;
  hasAdminAccess: boolean;
  serviceItemPriceRef: React.MutableRefObject<number>;
  serviceTaxableRef: React.MutableRefObject<boolean>;
  addAdditionalRowsOnClick?: (rowIndex: number) => void;
  serviceDescriptionRef: React.MutableRefObject<string>;
  updateLabel: (field: string, value: string) => void;
  isFormEdited: React.MutableRefObject<boolean[]>;
  isBillRateEnable: boolean;
  labelPreference: labelPreferenceRef;
  timeOffMethod: TimeOffMethod | null;
  setErrorMessage: (error: string) => void;
  /** Whether negative bill rate is allowed (from feature flag). Evaluated once at parent level. */
  isAllowNegativeBillRateEnabled?: boolean;
}

export const WeeklyTimeTableRow = ({
  rowIndex,
  onDelete,
  preferences,
  settings,
  billRate,
  hasPayroll,
  hasProjects,
  hasAdminAccess,
  serviceItemPriceRef,
  serviceTaxableRef,
  addAdditionalRowsOnClick,
  serviceDescriptionRef,
  updateLabel,
  isFormEdited,
  isBillRateEnable,
  labelPreference,
  timeOffMethod,
  setErrorMessage,
  isAllowNegativeBillRateEnabled = false,
}: WeeklyTimeEntryTableRowProps) => {
  // -------------------------------- context hooks

  const intl = useIntl();
  const sandbox = useSandbox();
  const isPayTypeEnabled = computeIsPayTypeEnabled(getRegion(sandbox));
  const {
    getValues,
    setValue,
    formState,
    setError: setFormError,
  } = useFormContext();

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

  const hideWeekdaysPreferences =
    preferences[UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE];
  const hideTimeEntryFieldsPreferences =
    preferences[UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS];

  // -------------------------------- component state hooks

  const {
    control,
    setError,
    formState: { errors },
  } = useFormContext();

  const weekStartDate = useWatch({ control, name: 'week.startDate' }) as Dayjs;

  const toggledBillable = useWatch({
    control,
    name: `weeklyTimeRows.${rowIndex}.billable`,
  }) as boolean;

  const timeForType = useWatch({
    control,
    name: 'timeFor.type',
  }) as TimeForType;

  const isVendor = timeForType === TimeForType.VENDOR;

  const rowDurations = useWatch({
    control,
    name: `weeklyTimeRows.${rowIndex}.durations`,
  }) as WeeklyTimeRowDurationState[];

  const hasLockedPendingEntry = rowDurations?.some(
    (d) => d && isDurationLockedPending(d),
  );

  const initialWeeklyTimeRowState =
    formState.defaultValues?.weeklyTimeRows[rowIndex];

  const preLoadedServiceItemsRef = useRef<ServiceSalesData>({
    billRate: 0,
    taxable: false,
  });

  // -------------------------------- component methods
  const rowTotalInSeconds = useRowTimeTotal(rowIndex);
  const rowTotalTimeWorked = getTimeDurationInHHMMFormat(rowTotalInSeconds);
  const onBillableChange = (isBillable: boolean | undefined) => {
    if (
      initialWeeklyTimeRowState &&
      initialWeeklyTimeRowState.id > 0 &&
      !initialWeeklyTimeRowState.billable
    ) {
      if (initialWeeklyTimeRowState.service.id) {
        if (isBillable) {
          setValue(
            `weeklyTimeRows.${rowIndex}.billRate`,
            preLoadedServiceItemsRef.current.billRate,
          );
          setValue(
            `weeklyTimeRows.${rowIndex}.taxable`,
            preLoadedServiceItemsRef.current.taxable,
          );
        } else {
          setValue(
            `weeklyTimeRows.${rowIndex}.billRate`,
            initialWeeklyTimeRowState.billRate,
          );
          setValue(
            `weeklyTimeRows.${rowIndex}.taxable`,
            initialWeeklyTimeRowState.taxable,
          );
        }
      } else if (isBillable) {
        setValue(`weeklyTimeRows.${rowIndex}.billRate`, billRate);
      } else {
        setValue(
          `weeklyTimeRows.${rowIndex}.billRate`,
          initialWeeklyTimeRowState.billRate,
        );
      }
    }
  };

  const enabledJobDetailsFields = generateJobDetailsComponents(
    rowIndex,
    preferences,
    settings,
    hasPayroll,
    hasAdminAccess,
    hasProjects,
    rowTotalInSeconds,
    timeForType,
    serviceItemPriceRef,
    serviceTaxableRef,
    serviceDescriptionRef,
    preLoadedServiceItemsRef,
    updateLabel,
    onBillableChange,
    toggledBillable,
    isFormEdited,
    labelPreference,
    isBillRateEnable,
    timeOffMethod,
    intl,
    hasNonAdminPaytypeAccess,
    isAllowNegativeBillRateEnabled,
    isPayTypeEnabled,
  );
  const jobDetailsRows = groupComponentsIntoRows(
    enabledJobDetailsFields,
    enabledJobDetailsFields.length,
  );

  const rowBillableTotal = useRowBillableTotal(rowIndex);
  const visibleWeekdayDurationCells = getVisibleWeekdayDurationCells(
    rowIndex,
    weekStartDate,
    hideWeekdaysPreferences,
    setError,
  );

  const formattedBillableAmount = useCurrencyFormat(rowBillableTotal);
  const { deleteRowFromKeyboardNavigationMap } = useContext(
    KeyboardNavigationContext,
  );

  // -------------------------------- component interaction handlers

  const handleOnDelete = (event: React.MouseEvent) => {
    /** handleOnDelete should take precendence over handleRowClick
     * for deleting extra rows if total number of rows is greater than 3
     */
    event.stopPropagation();

    const billableStatus = getValues(
      `weeklyTimeRows.${rowIndex}.billableStatus`,
    );

    if (billableStatus === TimeTracking_BillableStatus.HasBeenBilled) {
      setErrorMessage(
        intl.formatMessage({
          id: 'time.tracking.validation.invoiced.delete',
        }),
      );
      return;
    }

    onDelete(rowIndex);
    deleteRowFromKeyboardNavigationMap(Number(rowIndex));
  };

  const handleRowClick = () => {
    addAdditionalRowsOnClick?.(rowIndex);
  };

  return (
    <Table.Row onClick={handleRowClick} data-row-index={rowIndex}>
      <JobDetailsTableCell valign="top">
        <JobDetailsContainer>
          {jobDetailsRows.map((rowFields, rowIndex) => (
            <JobDetailsContainerRow
              // eslint-disable-next-line react/no-array-index-key
              key={rowIndex}
            >
              {rowFields.map((field, fieldIndex) => (
                // eslint-disable-next-line react/no-array-index-key
                <React.Fragment key={fieldIndex}>{field}</React.Fragment>
              ))}
            </JobDetailsContainerRow>
          ))}
          {enabledJobDetailsFields.length <= 2 && (
            <JobDetailsContainerRow>
              <NotesContainer>
                <Notes
                  name={`weeklyTimeRows.${rowIndex}.notes`}
                  trackingPoint={WEEKLY_TIME_TRACKING_POINTS.NOTES}
                  resizeTextArea
                  rows={NOTES_FIELD_ROWS}
                  maxHeight="200px"
                />
              </NotesContainer>
            </JobDetailsContainerRow>
          )}
        </JobDetailsContainer>
      </JobDetailsTableCell>

      <DaysAndNoteTableCell
        colspan={
          Object.values(hideWeekdaysPreferences).filter((isHidden) => !isHidden)
            .length
        }
        valign="top"
      >
        <DurationAndNotesTableContentContainer>
          <DaysContainer>{visibleWeekdayDurationCells}</DaysContainer>
          {enabledJobDetailsFields.length > 2 && (
            <NotesContainer>
              <Notes
                name={`weeklyTimeRows.${rowIndex}.notes`}
                trackingPoint={WEEKLY_TIME_TRACKING_POINTS.NOTES}
                resizeTextArea
                rows={NOTES_FIELD_ROWS}
                maxHeight="200px"
              />
            </NotesContainer>
          )}
        </DurationAndNotesTableContentContainer>
      </DaysAndNoteTableCell>

      <DataTableCell>
        <DataCellContainer>{rowTotalTimeWorked}</DataCellContainer>
      </DataTableCell>
      {settings.isBillingFieldEnabled && isBillRateEnable && (
        <DataTableCell>
          <DataCellContainer>{`${formattedBillableAmount}`}</DataCellContainer>
        </DataTableCell>
      )}
      <DeleteTableCell>
        {hasLockedPendingEntry ? (
          <LightTooltip
            message={intl.formatMessage({
              id: 'time.activity.pending.save.delete.tooltip.message',
            })}
          >
            <div>
              <IconControl
                aria-label={`${intl.formatMessage({
                  id: 'weekly.deleterow',
                })}`}
                disabled
                size="medium"
              >
                <Delete />
              </IconControl>
            </div>
          </LightTooltip>
        ) : (
          <IconControl
            aria-label={`${intl.formatMessage({
              id: 'weekly.deleterow',
            })}`}
            onClick={handleOnDelete}
            size="medium"
          >
            <Delete />
          </IconControl>
        )}
      </DeleteTableCell>
    </Table.Row>
  );
};

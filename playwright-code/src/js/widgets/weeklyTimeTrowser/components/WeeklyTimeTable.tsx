import React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { useIntl, useTracking } from '@payroll/quicksand';
import Button from '@ids-ts/button';
import { Table } from '@ids-ts/table';

import { Dayjs } from 'dayjs';
import styled from 'styled-components';
import { TimeOffMethod } from 'src/__generated__/gas/graphql';
import { Week } from 'src/js/widgets/weeklyTimeTrowser/components/WeekSelector';
import { WeeklyTimeTableRow } from 'src/js/widgets/weeklyTimeTrowser/components/WeeklyTimeTableRow';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';
import { FEATURE_FLAGS } from 'src/js/common/constants';
import {
  getIsWeekdayHidden,
  UxPreferenceData,
  UxPreferenceHideWeekdaysData,
  UxPreferenceKey,
} from 'src/js/service/utils/useUXPreferences';
import { useCurrencyFormat } from 'src/js/service/utils/sandboxUtils';
import {
  getWeeklyTimeRowFormState,
  useWeeklyTimeFormRows,
  WeeklyTimeFormStateRowsField,
} from 'src/js/widgets/weeklyTimeTrowser/hooks/useWeeklyTimeFormRows';
import { WEEKLY_TIME_TRACKING_POINTS } from 'src/js/common/useClickTracking';
import { getTimeDurationInHHMMFormat } from 'src/js/common/MiscUtils';
import useGetPreferences from 'src/js/service/hooks/preferenceces/useGetPreferences';
import { KeyboardNavigationProvider } from 'src/js/common/useKeyboardNavigation';
import { TimeTrackingCompanySettings } from 'src/js/service/hooks/settings/useCompanySettings';
import { useColumnTotals, useTotalTime } from '../hooks/useWeeklyTotals';
import { labelPreferenceRef } from '../../common/types';

const StyledTable = styled(Table)`
  * [role='columnheader'] {
    background-color: var(
      --Semantics-Light-Background-bg-secondary,
      #eceef1
    ) !important;
  }

  // This enables the table to scroll vertically while keeping the header fixed
  & > tbody {
    overflow-y: auto;
    max-height: ${({ headerHeight }) => `calc(100vh - ${headerHeight}px)`};
  }
`;

const TableContainer = styled.div`
  flex: 1 1 auto; /* This makes sure that the Trowser's remaining space is properly consumed by the Table Container */
  display: flex;
  flex-direction: column;
`;

const JobDetailsHeader = styled(Table.Cell)`
  border-bottom: 1px solid var(--color-divider-tertiary);
  padding-bottom: 0 !important;
  position: unset !important;
`;

const JobDetailsHeaderContainer = styled.div`
  color: var(--Primitives-Gray-gray-100, #393a3d);
  font-size: var(--font-size-component-small);
  font-style: normal;
  font-weight: 200 !important;
  position: relative;
  line-height: 14px;
  text-transform: capitalize;
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
  margin-right: -27px;
`;

const WeekdayHeader = styled(Table.Cell)<{
  isIncreaseCellWidth: boolean;
  visibleColumnCount?: number;
}>`
  border-bottom: 1px solid var(--color-container-border-tertiary);
  color: var(--Primitives-Gray-gray-100, #393a3d);
  text-align: right;
  font-size: var(--font-size-component-x-small) !important;
  font-style: normal;
  font-weight: var(--font-weight-component) !important;
  text-transform: capitalize;
  padding: ${({ isIncreaseCellWidth }) =>
    isIncreaseCellWidth
      ? '12px 0 9px 0 !important'
      : '12px 5px 9px 9px !important'};
  line-height: 16px;
  ${({ visibleColumnCount }) =>
    visibleColumnCount
      ? `width: calc(492px / ${visibleColumnCount}) !important;`
      : `max-width: 42px !important;`}
`;

const DeleteHeader = styled(Table.Cell)`
  border-bottom: 1px solid var(--color-divider-tertiary);
  padding-left: 40px !important;
`;

/**
 * StyledTableHeader is used to make the header sticky
 */
const StyledTableHeader = styled(Table.Header)`
  position: sticky;
  top: 0;
  z-index: 2;
`;

const WeeklyTotalsHeader = styled.div`
  display: flex;
  flex-direction: row;
  align-items: end;
  justify-content: end;
`;

const WeeklyTimeTableFooterContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  gap: 20px;
  padding: 12px 0 0 24px;
`;

const WeeklyHeaderTotalValue = styled.div`
  padding-top: 8px;
  line-height: 20px;
  font-size: var(--font-size-component-small);
  margin-left: 4px;
  font-style: normal;
  font-weight: var(--font-weight-component-bold);
  text-align: right;
  color: var(--Primitives-Gray-gray-100, #393a3d);
`;

export function getVisibleWeekdayHeaders(
  startDate: Dayjs,
  hideWeekdaysData: UxPreferenceHideWeekdaysData,
  columnTotal: number[],
): React.JSX.Element[] {
  const visibleColumnCount = Object.values(hideWeekdaysData).filter(
    (isHidden) => !isHidden,
  ).length;
  return Array.from({ length: 7 }, (_, index) => {
    const day = startDate.add(index, 'days');
    if (!getIsWeekdayHidden(day.day(), hideWeekdaysData)) {
      return (
        <WeekdayHeader
          key={index}
          isIncreaseCellWidth={false}
          visibleColumnCount={visibleColumnCount}
        >
          {day.format('ddd D')}
          <WeeklyTotalsHeader>
            <WeeklyHeaderTotalValue>
              {getTimeDurationInHHMMFormat(columnTotal[index])}
            </WeeklyHeaderTotalValue>
          </WeeklyTotalsHeader>
        </WeekdayHeader>
      );
    }
    return null;
  }).filter(Boolean) as React.JSX.Element[];
}

export const getTableRows = (
  weeklyTimeRows: WeeklyTimeFormStateRowsField[],
  preferences: UxPreferenceData,
  settings: TimeTrackingCompanySettings,
  billRate: number | null,
  hasPayroll: boolean,
  hasAdminAccess: boolean,
  hasProjects: boolean,
  handleOnRowDelete: (rowIndex: number) => void,
  addAdditionalRowsOnClick: (index: number) => void,
  serviceItemPriceRef: React.MutableRefObject<number>,
  serviceTaxableRef: React.MutableRefObject<boolean>,
  serviceDescriptionRef: React.MutableRefObject<string>,
  updateLabel: (field: string, value: string, index: number) => void,
  isFormEdited: React.MutableRefObject<boolean[]>,
  isBillRateEnable: boolean,
  labelPreference: labelPreferenceRef,
  timeOffMethod: TimeOffMethod | null,
  setErrorMessage: (error: string) => void,
  isAllowNegativeBillRateEnabled: boolean,
): React.JSX.Element[] =>
  weeklyTimeRows.map((row: WeeklyTimeFormStateRowsField, index: number) => (
    <WeeklyTimeTableRow
      key={row.id}
      rowIndex={index}
      preferences={preferences}
      settings={settings}
      billRate={billRate}
      onDelete={handleOnRowDelete}
      hasPayroll={hasPayroll}
      hasAdminAccess={hasAdminAccess}
      hasProjects={hasProjects}
      isBillRateEnable={isBillRateEnable}
      serviceItemPriceRef={serviceItemPriceRef}
      serviceTaxableRef={serviceTaxableRef}
      addAdditionalRowsOnClick={
        index === weeklyTimeRows.length - 1
          ? addAdditionalRowsOnClick
          : undefined
      }
      serviceDescriptionRef={serviceDescriptionRef}
      updateLabel={(field, value) => updateLabel(field, value, index)}
      isFormEdited={isFormEdited}
      labelPreference={labelPreference}
      timeOffMethod={timeOffMethod}
      setErrorMessage={setErrorMessage}
      isAllowNegativeBillRateEnabled={isAllowNegativeBillRateEnabled}
    />
  ));

export interface WeeklyTimeTableProps {
  preferences: UxPreferenceData;
  settings: TimeTrackingCompanySettings;
  hasPayroll: boolean;
  hasAdminAccess: boolean;
  hasProjects: boolean;
  serviceItemPriceRef: React.MutableRefObject<number>;
  serviceTaxableRef: React.MutableRefObject<boolean>;
  serviceDescriptionRef: React.MutableRefObject<string>;
  updateLabel: (field: string, value: string, index: number) => void;
  billRate: number | null;
  costRate: number | null;
  isFormEdited: React.MutableRefObject<boolean[]>;
  timeOffMethod: TimeOffMethod | null;
  setErrorMessage: (error: string) => void;
  isEmployeeOrVendorBillable: boolean;
  isBillRateEnable: boolean;
}

export const WeeklyTimeTable = ({
  preferences,
  settings,
  hasPayroll,
  hasAdminAccess,
  hasProjects,
  serviceItemPriceRef,
  serviceDescriptionRef,
  serviceTaxableRef,
  updateLabel,
  billRate,
  costRate,
  isFormEdited,
  timeOffMethod,
  setErrorMessage,
  isEmployeeOrVendorBillable,
  isBillRateEnable,
}: WeeklyTimeTableProps) => {
  // -------------------------------- context hooks
  const intl = useIntl();
  const track = useTracking();
  // Feature flag for negative bill rate - evaluated once at table level
  const { isEnabled: isAllowNegativeBillRateEnabled } = useIXPFeatureFlag({
    flagName: FEATURE_FLAGS.QB_TIME_ALLOW_NEGATIVE_BILL_RATE_TIME_ACTIVITY,
    defaultValue: false,
  });

  // -------------------------------- component state hooks

  const { control } = useFormContext();
  const weekStartDate = useWatch({ control, name: 'week.startDate' }) as Dayjs;
  const { columnTotals, totalBillableAmount } = useColumnTotals();
  const totalTimeInSeconds = useTotalTime();
  const totalTimeWorked = getTimeDurationInHHMMFormat(totalTimeInSeconds);
  const formattedBillableAmount = useCurrencyFormat(totalBillableAmount);
  const {
    weeklyTimeRows,
    appendWeeklyTimeRow,
    removeWeeklyTimeRow,
    clearAllRows,
  } = useWeeklyTimeFormRows({ billRate, costRate, isEmployeeOrVendorBillable });

  const weekdayHeaders = getVisibleWeekdayHeaders(
    weekStartDate,
    preferences[UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE],
    columnTotals,
  );

  // -------------------------------- component interaction handlers

  const handleScrollToTheLastOfTable = () => {
    // Below line used to identify the table is there in DOM or not with the data.
    const table = document.querySelector(
      '[data-test-id=weekly-time-table-row] tr:last-child',
    );

    if (table) {
      // if last row of table found then below code will scroll-down towards that location.
      table.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
      });
    }
  };

  const handleOnRowAdd = () => {
    track(WEEKLY_TIME_TRACKING_POINTS.ADD_LINE);
    for (let i = 0; i < 3; i += 1) {
      appendWeeklyTimeRow({
        ...getWeeklyTimeRowFormState(weekStartDate),
        billable: isEmployeeOrVendorBillable || Number(billRate) > 0,
        billRate,
        costRate,
      });
    }

    // After adding new line provided wait for 1000 millisecond to scroll down to the last row which is added.
    setTimeout(() => handleScrollToTheLastOfTable(), 1000);
  };

  const handleOnRowDelete = (rowIndex: number) => {
    track(WEEKLY_TIME_TRACKING_POINTS.DELETE_ROW);
    removeWeeklyTimeRow(rowIndex, weekStartDate);
  };

  const handleClearRows = () => {
    track(WEEKLY_TIME_TRACKING_POINTS.CLEAR_LINES);
    clearAllRows(weekStartDate);
  };

  const addAdditionalRowsOnClick = (index: number) => {
    if (index === weeklyTimeRows.length - 1) {
      appendWeeklyTimeRow({
        ...getWeeklyTimeRowFormState(weekStartDate),
        billable: isEmployeeOrVendorBillable || Number(billRate) > 0,
        billRate,
        costRate,
      });
    }
  };
  // -------------------------------- component methods

  const { data } = useGetPreferences();
  const labelPreference = React.useMemo(
    () => ({
      DepartmentTerminology:
        data?.Preferences.AccountingInfoPrefs.DepartmentTerminology || '',
      CustomerTerminology:
        data?.Preferences.AccountingInfoPrefs.CustomerTerminology || '',
    }),
    [data?.Preferences.AccountingInfoPrefs],
  );
  const tableRows = React.useMemo(
    () =>
      getTableRows(
        weeklyTimeRows,
        preferences,
        settings,
        billRate,
        hasPayroll,
        hasAdminAccess,
        hasProjects,
        handleOnRowDelete,
        addAdditionalRowsOnClick,
        serviceItemPriceRef,
        serviceTaxableRef,
        serviceDescriptionRef,
        updateLabel,
        isFormEdited,
        isBillRateEnable ?? true,
        labelPreference,
        timeOffMethod,
        setErrorMessage,
        isAllowNegativeBillRateEnabled,
      ),
    [
      weeklyTimeRows,
      preferences,
      settings,
      billRate,
      hasPayroll,
      hasAdminAccess,
      hasProjects,
      handleOnRowDelete,
      addAdditionalRowsOnClick,
      serviceItemPriceRef,
      serviceTaxableRef,
      serviceDescriptionRef,
      updateLabel,
      isFormEdited,
      isBillRateEnable,
      labelPreference,
      timeOffMethod,
      setErrorMessage,
      isAllowNegativeBillRateEnabled,
    ],
  );

  return (
    <TableContainer>
      <StyledTable
        wrapperProps={{
          className: 'weekly-time-table',
        }}
        id="weekly-time-table"
      >
        <StyledTableHeader>
          <Table.Row>
            <JobDetailsHeader colSpan={1}>
              <JobDetailsHeaderContainer>
                <div>{intl.formatMessage({ id: 'job.details' })} </div>
                <div>{intl.formatMessage({ id: 'label.totals' })} </div>
              </JobDetailsHeaderContainer>
            </JobDetailsHeader>
            {weekdayHeaders}
            <WeekdayHeader isIncreaseCellWidth>
              {intl.formatMessage({
                id: 'weekly.total',
              })}
              <WeeklyHeaderTotalValue>{totalTimeWorked}</WeeklyHeaderTotalValue>
            </WeekdayHeader>
            {settings.isBillingFieldEnabled && isBillRateEnable && (
              <WeekdayHeader isIncreaseCellWidth>
                {intl.formatMessage({ id: 'billable.label.no.hour' })}
                <WeeklyHeaderTotalValue>{`${formattedBillableAmount}`}</WeeklyHeaderTotalValue>
              </WeekdayHeader>
            )}
            <DeleteHeader />
          </Table.Row>
        </StyledTableHeader>
        <KeyboardNavigationProvider>
          <Table.Body data-test-id="weekly-time-table-row">
            {tableRows}
          </Table.Body>
        </KeyboardNavigationProvider>
      </StyledTable>
      <WeeklyTimeTableFooterContainer>
        <Button
          priority="secondary"
          purpose="standard"
          onClick={handleOnRowAdd}
        >
          {intl.formatMessage({ id: 'add.line' })}
        </Button>
        <Button
          priority="secondary"
          purpose="standard"
          onClick={handleClearRows}
        >
          {intl.formatMessage({ id: 'clear.all.lines' })}
        </Button>
      </WeeklyTimeTableFooterContainer>
    </TableContainer>
  );
};

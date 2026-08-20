import React, { ReactElement } from 'react';
import ReactDOM from 'react-dom';
import { WeeklyTimeFormState } from 'src/js/widgets/weeklyTimeTrowser/hooks/useWeeklyTimeForm';
import {
  getIsWeekdayHidden,
  UxPreferenceData,
  UxPreferenceKey,
} from 'src/js/service/utils/useUXPreferences';
import {
  getRowBillableTotal,
  getRowTimeTotal,
  getTotalHoursForWeek,
  getTotalHoursForDay,
  getTotalBillableAmount,
} from 'src/js/widgets/weeklyTimeTrowser/hooks/useWeeklyTotals';
import { TimeTrackingCompanySettings } from 'src/js/service/hooks/settings/useCompanySettings';
import { secondsToDurationTimestamp } from 'src/js/common/DateAndTimeUtils';
import { TimeForType } from '../../common/addTimeFormComponents/TeamMember';

// function to find the number of days to display in the table
export const findVisibleDaysCount = (
  data: WeeklyTimeFormState,
  preferences: UxPreferenceData,
): number => {
  const hiddenWeekdays =
    preferences[UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE];
  return Array.from({ length: 7 }).reduce((count: number, _, index) => {
    const day = data.week.startDate.add(index, 'days');
    return getIsWeekdayHidden(day.day(), hiddenWeekdays) ? count : count + 1;
  }, 0);
};

const buildView = (
  data: WeeklyTimeFormState,
  preferences: UxPreferenceData,
  settings: TimeTrackingCompanySettings,
  hasPayroll: boolean,
  hasAdminAccess: boolean,
  hasProjects: boolean,
  currencySymbol: string,
  intl: any,
  quickFillFieldLabels: any,
  isBillRateEnable: boolean = true,
): ReactElement<any, any> => {
  const visibleDaysCount = findVisibleDaysCount(data, preferences);

  const showBillRateAndAmount =
    settings.isBillingFieldEnabled && isBillRateEnable;

  // if billable amount column is visible, days information will take up 60% of the width divided by the number of visible days
  // else, days information will take up 70% of the width divided by the number of visible days
  const dayColumnWidth = showBillRateAndAmount
    ? `${60 / visibleDaysCount}%`
    : `${70 / visibleDaysCount}%`;

  // Calculate total hours and total billable amount
  const totalHours = getTotalHoursForWeek(
    data.weeklyTimeRows.map((row) => getRowTimeTotal(row.durations)),
  );
  const totalBillableAmount = getTotalBillableAmount(data.weeklyTimeRows);

  return (
    <div>
      <div>{data.timeFor.name}</div>
      <div>
        {data.week.startDate.format('YYYY/MM/DD')} -{' '}
        {data.week.endDate.format('YYYY/MM/DD')}
      </div>
      <table>
        <colgroup>
          <col style={{ width: '30%' }} />
          {Array.from({ length: 7 }, (_, index) => {
            const day = data.week.startDate.add(index, 'days');
            if (
              !getIsWeekdayHidden(
                day.day(),
                preferences[UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE],
              )
            ) {
              return <col style={{ width: dayColumnWidth }} />;
            }
            return null;
          })}
          <col style={{ width: '10%' }} />
          {showBillRateAndAmount && <col style={{ width: '10%' }} />}
        </colgroup>
        <thead>
          <tr>
            <th>{intl.formatMessage({ id: 'job.details' })}</th>
            {Array.from({ length: 7 }, (_, index) => {
              const day = data.week.startDate.add(index, 'days');
              if (
                !getIsWeekdayHidden(
                  day.day(),
                  preferences[UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE],
                )
              ) {
                return <th>{day.format('ddd D')}</th>;
              }
              return null;
            })}
            <th>
              {intl.formatMessage({
                id: 'weekly.total',
              })}
            </th>
            {showBillRateAndAmount && (
              <th>{intl.formatMessage({ id: 'billable.label.no.hour' })}</th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.weeklyTimeRows.map((row, index) => (
            <tr>
              <td>
                <ul>
                  <li>
                    {row.timeAgainst.customer?.id &&
                      `${intl.formatMessage({
                        id: 'drawer.form.customer.label',
                      })}: ${quickFillFieldLabels[index].customer}`}
                  </li>
                  {preferences[UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS]
                    .isProjectFieldEnabled &&
                    row.timeAgainst.project?.id && (
                      <li>
                        {`${intl.formatMessage({
                          id: 'drawer.form.project.label',
                        })}: ${quickFillFieldLabels[index].project}`}
                      </li>
                    )}
                  {settings.isClassEnabled &&
                    preferences[UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS]
                      .isClassFieldEnabled &&
                    row.class.id && (
                      <li>
                        {`${intl.formatMessage({
                          id: 'drawer.form.class.label',
                        })}: ${quickFillFieldLabels[index].class}`}
                      </li>
                    )}
                  {settings.isServiceFieldEnabled && row.service.id && (
                    <li>
                      {`${intl.formatMessage({
                        id: 'drawer.form.service.label',
                      })}: ${quickFillFieldLabels[index].service}`}
                    </li>
                  )}
                  {settings.isLocationEnabled &&
                    preferences[UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS]
                      .isLocationFieldEnabled &&
                    row.location.id && (
                      <li>
                        {`${intl.formatMessage({
                          id: 'drawer.form.location.label',
                        })}: ${quickFillFieldLabels[index].location}`}
                      </li>
                    )}
                  {hasPayroll &&
                    hasAdminAccess &&
                    data.timeFor.type === TimeForType.EMPLOYEE &&
                    preferences[UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS]
                      .isPayTypeFieldEnabled &&
                    row.payType.id && (
                      <li>
                        {`${intl.formatMessage({
                          id: 'pay.type',
                        })}: ${quickFillFieldLabels[index].payType}`}
                      </li>
                    )}
                  {hasProjects &&
                    preferences[UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS]
                      .isCostRateFieldEnabled && (
                      <li>
                        {intl.formatMessage({
                          id: 'cost.rate',
                        })}
                        : {row.costRate}
                      </li>
                    )}
                  {settings.isTaxableFieldEnabled &&
                    preferences[UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS]
                      .isTaxableFieldEnabled &&
                    row.billable && (
                      <li>
                        {`${intl.formatMessage({
                          id: 'taxable',
                        })}: ${
                          row.taxable
                            ? intl.formatMessage({ id: 'yes' })
                            : intl.formatMessage({ id: 'no' })
                        }`}
                      </li>
                    )}
                  {settings.isBillingFieldEnabled && (
                    <li>
                      {intl.formatMessage({
                        id: 'drawer.form.billable.label',
                      })}
                      :{' '}
                      {row.billable
                        ? intl.formatMessage({ id: 'yes' })
                        : intl.formatMessage({ id: 'no' })}
                    </li>
                  )}
                  {showBillRateAndAmount && row.billable && (
                    <li>
                      {intl.formatMessage({
                        id: 'bill.rate',
                      })}
                      : {row.billRate}
                    </li>
                  )}
                  {row.notes && (
                    <li>
                      {`${intl.formatMessage({
                        id: 'drawer.form.notes.label',
                      })}: ${row.notes}`}
                    </li>
                  )}
                </ul>
              </td>
              {Array.from({ length: 7 }, (_, index) => {
                if (
                  !getIsWeekdayHidden(
                    row.durations[index].day.day(),
                    preferences[UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE],
                  )
                ) {
                  return (
                    <td>
                      {secondsToDurationTimestamp(
                        row.durations[index].duration ?? 0,
                      )}
                    </td>
                  );
                }
                return null;
              })}
              <td>
                {secondsToDurationTimestamp(getRowTimeTotal(row.durations))}
              </td>
              <td>
                {showBillRateAndAmount && (
                  <>
                    {currencySymbol}
                    {getRowBillableTotal(
                      row.billRate ?? 0,
                      getRowTimeTotal(row.durations),
                    )}
                  </>
                )}
              </td>
            </tr>
          ))}
          <tr>
            <td
              colSpan={
                showBillRateAndAmount
                  ? visibleDaysCount + 3
                  : visibleDaysCount + 2
              }
            >
              <hr />
            </td>
          </tr>
          <tr>
            <td>
              <strong>{intl.formatMessage({ id: 'weekly.total' })}</strong>
            </td>
            {Array.from({ length: 7 }, (_, index) => {
              const day = data.week.startDate.add(index, 'days');
              if (
                !getIsWeekdayHidden(
                  day.day(),
                  preferences[UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE],
                )
              ) {
                return (
                  <td>
                    <strong>
                      {secondsToDurationTimestamp(
                        getTotalHoursForDay(data.weeklyTimeRows, index),
                      )}
                    </strong>
                  </td>
                );
              }
              return null;
            })}
            <td>{secondsToDurationTimestamp(totalHours)}</td>
            <td>
              {showBillRateAndAmount && (
                <>
                  {currencySymbol}
                  {totalBillableAmount}
                </>
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const renderComponentToString = (
  data: WeeklyTimeFormState,
  preferences: UxPreferenceData,
  settings: TimeTrackingCompanySettings,
  hasPayroll: boolean,
  hasAdminAccess: boolean,
  hasProjects: boolean,
  currencySymbol: string,
  intl: any,
  quickFillFieldLabels: any,
  isBillRateEnable: boolean = true,
) => {
  // Create a temporary DOM element
  const tempDiv = document.createElement('div');

  // Render the component into the temporary element
  ReactDOM.render(
    buildView(
      data,
      preferences,
      settings,
      hasPayroll,
      hasAdminAccess,
      hasProjects,
      currencySymbol,
      intl,
      quickFillFieldLabels,
      isBillRateEnable,
    ),
    tempDiv,
  );

  // Extract the inner HTML
  const html = tempDiv.innerHTML;

  // Clean up by unmounting the component
  ReactDOM.unmountComponentAtNode(tempDiv);

  // Return the complete HTML with styles
  return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>
            ${intl.formatMessage({
              id: 'trowser.title.weekly',
            })}
          </title>
            <style>
               @page {
                  size: A4 || [portrait | landscape];
              }

              body {
                font-family: Arial, sans-serif;
                margin: 5px;
              }

              table {
                width: 100%;
                border-collapse: collapse;
                table-layout: fixed;
              }

              th, td {
                text-align: left;
                padding: 8px;
              }

              th {
                font-weight: bold;
                background-color: #f2f2f2;
              }

              ul {
                padding: 0;
                list-style-type: none;
              }
            </style>
        </head>
        <body>
          <div id="root">${html}</div>
        </body>
      </html>
    `;
};

export const printWeeklyTimeTable = (
  data: WeeklyTimeFormState,
  preferences: UxPreferenceData,
  settings: TimeTrackingCompanySettings,
  hasPayroll: boolean,
  hasAdminAccess: boolean,
  hasProjects: boolean,
  currencySymbol: string,
  intl: any,
  quickFillFieldLabels: any,
  isBillRateEnable: boolean = true,
) => {
  // Filter out weeklyTimeRows that are in default state and have no user data
  const filteredData = {
    ...data,
    weeklyTimeRows: data.weeklyTimeRows.filter((row) =>
      row.durations.some((rowDurations) => rowDurations.duration !== null),
    ),
  };

  const printWindow = window.open('', '_blank');

  if (printWindow) {
    const renderString = renderComponentToString(
      filteredData,
      preferences,
      settings,
      hasPayroll,
      hasAdminAccess,
      hasProjects,
      currencySymbol,
      intl,
      quickFillFieldLabels,
      isBillRateEnable,
    );
    printWindow.document.write(renderString);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }
};

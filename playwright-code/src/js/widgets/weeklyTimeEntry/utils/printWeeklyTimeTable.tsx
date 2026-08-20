import React, { ReactElement } from 'react';
import ReactDOM from 'react-dom';
import dayjs from 'dayjs';
import type { TimesheetRow } from '../store/timeEntryGridSlice';
import { TimeForType } from '../types';
import {
  getCustomerName,
  formatHoursToTime,
  calculateRowTotalHours,
  calculateRowBillableAmount,
  getServiceName,
  getBillableRate,
  getBillableStatus,
  getNotes,
  getClassName,
  getLocationName,
} from './helpers';

interface PrintWeeklyTimeTableParams {
  rows: TimesheetRow[];
  dateRange: { start: string; end: string };
  visibleDays: number[];
  weekDates: string[];
  customerData: any[];
  currencySymbol: string;
  teamMemberName?: string;
  teamMemberType?: TimeForType;
}

const getTeamMemberLabel = (teamMemberType?: TimeForType): string => {
  switch (teamMemberType) {
    case TimeForType.VENDOR:
      return 'Vendor';
    case TimeForType.EMPLOYEE:
      return 'Employee';
    default:
      return 'Team member';
  }
};

/**
 * Builds the table view component for printing
 */
const buildView = (
  params: PrintWeeklyTimeTableParams,
): ReactElement<any, any> => {
  const {
    rows,
    dateRange,
    visibleDays,
    weekDates,
    customerData,
    currencySymbol,
    teamMemberName,
    teamMemberType,
  } = params;

  const teamMemberLabel = getTeamMemberLabel(teamMemberType);

  // Calculate total hours and total billable amount
  const totalHours = rows.reduce(
    (sum, row) => sum + calculateRowTotalHours(row, visibleDays),
    0,
  );
  const totalBillableAmount = rows.reduce(
    (sum, row) => sum + calculateRowBillableAmount(row, visibleDays),
    0,
  );

  // Filter out rows with no data
  const filteredRows = rows.filter((row) =>
    visibleDays.some((dayIdx) => {
      const dayEntry = row.timeEntries[dayIdx];
      return dayEntry?.hours && dayEntry.hours > 0;
    }),
  );

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>
          Weekly Time Sheet
        </h2>
        {teamMemberName && (
          <div
            style={{
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '4px',
            }}
          >
            {teamMemberLabel}: {teamMemberName}
          </div>
        )}
        <div
          style={{
            fontSize: 'var(--font-size-component-small)',
            color:
              'var(--color-text-secondary)' /* (SemanticContextMatchOnly) */,
          }}
        >
          {dayjs(dateRange.start).format('YYYY/MM/DD')} -{' '}
          {dayjs(dateRange.end).format('YYYY/MM/DD')}
        </div>
      </div>

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
        }}
      >
        <colgroup>
          <col style={{ width: '30%' }} />
          {visibleDays.map((dayIdx) => (
            <col
              key={dayIdx}
              style={{ width: `${60 / visibleDays.length}%` }}
            />
          ))}
          <col style={{ width: '10%' }} />
        </colgroup>

        <thead>
          <tr>
            <th
              style={{
                padding: '8px',
                border: '1px solid var(--color-container-border-tertiary)',
                backgroundColor:
                  'var(--color-container-background-secondary)' /* (SemanticContextMatchOnly) */,
                fontWeight: 'var(--font-weight-heading)',
              }}
            >
              Job Details
            </th>
            {visibleDays.map((dayIdx) => {
              const dateStr = weekDates[dayIdx];
              const date = dayjs(dateStr);
              return (
                <th
                  key={dayIdx}
                  style={{
                    padding: '8px',
                    border: '1px solid var(--color-container-border-tertiary)',
                    backgroundColor:
                      'var(--color-container-background-secondary)' /* (SemanticContextMatchOnly) */,
                    fontWeight: 'var(--font-weight-heading)',
                  }}
                >
                  {date.format('ddd D')}
                </th>
              );
            })}
            <th
              style={{
                padding: '8px',
                border: '1px solid var(--color-container-border-tertiary)',
                backgroundColor:
                  'var(--color-container-background-primary)' /* (SemanticContextMatchOnly) */,
                fontWeight: 'var(--font-weight-heading)',
              }}
            >
              Total
            </th>
          </tr>
        </thead>

        <tbody>
          {filteredRows.map((row) => {
            const customerName = getCustomerName(
              row,
              customerData,
              [],
              'Customer',
            );
            const serviceName = getServiceName(row);
            const className = getClassName(row);
            const locationName = getLocationName(row);
            const billableRate = getBillableRate(row);
            const billableStatus = getBillableStatus(row);
            const notes = getNotes(row);
            const rowTotalHours = calculateRowTotalHours(row, visibleDays);
            const rowBillableAmount = calculateRowBillableAmount(
              row,
              visibleDays,
            );

            return (
              <tr key={row.timeAgainst.id || `row-${Math.random()}`}>
                <td
                  style={{
                    padding: '8px',
                    border: '1px solid var(--color-divider-tertiary)',
                    verticalAlign: 'top',
                  }}
                >
                  <ul
                    style={{ padding: '0', margin: '0', listStyleType: 'none' }}
                  >
                    {customerName && (
                      <li style={{ marginBottom: '4px' }}>
                        <strong>Customer:</strong> {customerName}
                      </li>
                    )}
                    {serviceName && (
                      <li style={{ marginBottom: '4px' }}>
                        <strong>Service:</strong> {serviceName}
                      </li>
                    )}
                    {className && (
                      <li style={{ marginBottom: '4px' }}>
                        <strong>Class:</strong> {className}
                      </li>
                    )}
                    {locationName && (
                      <li style={{ marginBottom: '4px' }}>
                        <strong>Location:</strong> {locationName}
                      </li>
                    )}
                    {billableRate && (
                      <li style={{ marginBottom: '4px' }}>
                        <strong>Rate:</strong> {currencySymbol}
                        {billableRate}
                      </li>
                    )}
                    {billableStatus && (
                      <li style={{ marginBottom: '4px' }}>
                        <strong>Billable:</strong> {billableStatus}
                      </li>
                    )}
                    {notes && (
                      <li style={{ marginBottom: '4px' }}>
                        <strong>Notes:</strong> {notes}
                      </li>
                    )}
                  </ul>
                </td>

                {visibleDays.map((dayIdx) => {
                  const dayEntry = row.timeEntries[dayIdx];
                  const hours = dayEntry?.hours || 0;
                  return (
                    <td
                      key={dayIdx}
                      style={{
                        padding: '8px',
                        border:
                          '1px solid var(--color-container-border-tertiary)',
                        textAlign: 'center',
                      }}
                    >
                      {formatHoursToTime(hours)}
                    </td>
                  );
                })}

                <td
                  style={{
                    padding: '8px',
                    border: '1px solid var(--color-container-border-tertiary)',
                    textAlign: 'center',
                    fontWeight:
                      'var(--font-weight-heading)' /* (NoTokenFound) */,
                  }}
                >
                  {formatHoursToTime(rowTotalHours)}
                </td>
              </tr>
            );
          })}

          {/* Totals row */}
          <tr>
            <td
              style={{
                padding: '8px',
                border:
                  '1px solid var(--color-divider-tertiary)' /* (SemanticContextMatchOnly) */,
                fontWeight: 'var(--font-weight-heading)',
              }}
            >
              <strong>Total</strong>
            </td>

            {visibleDays.map((dayIdx) => {
              const dayTotal = filteredRows.reduce((sum, row) => {
                const dayEntry = row.timeEntries[dayIdx];
                return sum + (dayEntry?.hours || 0);
              }, 0);
              return (
                <td
                  key={dayIdx}
                  style={{
                    padding: '8px',
                    border: '1px solid var(--color-divider-tertiary)',
                    textAlign: 'center',
                    fontWeight: 'var(--font-weight-heading)',
                  }}
                >
                  {formatHoursToTime(dayTotal)}
                </td>
              );
            })}

            <td
              style={{
                padding: '8px',
                border: '1px solid var(--color-container-border-tertiary)',
                textAlign: 'center',
                fontWeight: 'var(--font-weight-heading)',
              }}
            >
              {formatHoursToTime(totalHours)}
            </td>
          </tr>
        </tbody>
      </table>

      {totalBillableAmount > 0 && (
        <div
          style={{
            marginTop: '20px',
            textAlign: 'right',
            fontSize: 'var(--font-size-component-medium)',
            fontWeight: 'bold' /* (NoTokenFound) */,
          }}
        >
          Total Billable: {currencySymbol}
          {totalBillableAmount.toFixed(2)}
        </div>
      )}
    </div>
  );
};

/**
 * Renders the component to HTML string
 */
const renderComponentToString = (
  params: PrintWeeklyTimeTableParams,
): string => {
  // Create a temporary DOM element
  const tempDiv = document.createElement('div');

  // Render the component into the temporary element
  ReactDOM.render(buildView(params) as any, tempDiv);

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
        <title>Weekly Time Sheet</title>
        <style>
          @page {
            size: A4;
            margin: 1cm;
          }

          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            font-size: 12px;
            line-height: 1.4;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin-bottom: 20px;
          }

          th, td {
            text-align: left;
            padding: 8px;
            border: 1px solid #ddd;
            word-wrap: break-word;
          }

          th {
            font-weight: bold;
            background-color: var(--color-container-background-secondary); /* (SemanticContextMatchOnly) */
            text-align: center;
          }

          ul {
            padding: 0;
            margin: 0;
            list-style-type: none;
          }

          li {
            margin-bottom: 4px;
            font-size: 11px;
          }

          @media print {
            body {
              padding: 0;
            }

            table {
              page-break-inside: auto;
            }

            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
          }
        </style>
      </head>
      <body>
        <div id="root">${html}</div>
      </body>
    </html>
  `;
};

/**
 * Prints the weekly time table in a new window
 */
export const printWeeklyTimeTable = (
  params: PrintWeeklyTimeTableParams,
): void => {
  const printWindow = window.open('', '_blank');

  if (printWindow) {
    const renderString = renderComponentToString(params);
    printWindow.document.write(renderString);
    printWindow.document.close();
    printWindow.focus();

    // Wait for content to load before printing
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  }
};

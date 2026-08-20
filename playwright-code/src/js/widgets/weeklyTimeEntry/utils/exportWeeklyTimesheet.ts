import dayjs from 'dayjs';
import type { TimesheetRow } from '../store/timeEntryGridSlice';
import {
  getCustomerName,
  formatHoursToTime,
  calculateRowTotalHours,
  calculateRowBillableAmount,
  getServiceName,
  getBillableRate,
  getBillableStatus,
  getNotes,
  generateFilename,
} from './helpers';

interface DateRange {
  start: string;
  end: string;
}

interface ExportWeeklyTimesheetParams {
  rows: TimesheetRow[];
  dateRange: DateRange;
  visibleDays: number[];
  weekDates: string[];
  customerData: any[]; // Using any[] to match the actual selector return type
  currencySymbol: string;
}

/**
 * Exports weekly timesheet data to Excel format
 */
export const exportWeeklyTimesheet = async ({
  rows,
  dateRange,
  visibleDays,
  weekDates,
  customerData,
  currencySymbol,
}: ExportWeeklyTimesheetParams): Promise<void> => {
  // Lazy load XLSX library
  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();
  const worksheetData = [];

  // Add title row
  worksheetData.push(['Weekly Time Sheet']);

  // Define headers
  const headers = [
    'Customer',
    'Service',
    'Cost Rate',
    'Hourly Rate',
    'Billable',
    'Taxable',
    'Description',
  ];

  // Add day headers for visible days, using weekDates
  visibleDays.forEach((dayIdx, i) => {
    const dateStr = weekDates[dayIdx];
    const date = dayjs(dateStr);
    headers.push(date.format('ddd D MMM'));
  });

  headers.push('Total Hours', 'Billable');
  worksheetData.push(headers);

  // Add data rows
  rows.forEach((row) => {
    const customerName = getCustomerName(row, customerData, [], 'Customer');
    const serviceName = getServiceName(row);
    const billableRate = getBillableRate(row);
    const billableStatus = getBillableStatus(row);
    const notes = getNotes(row);

    const rowData = [
      customerName,
      serviceName,
      '', // Cost Rate - not available in current data structure
      billableRate,
      billableStatus,
      '', // Taxable - not available in current data structure
      notes,
    ];

    // Add hours for each visible day
    visibleDays.forEach((dayIdx) => {
      const dayEntry = row.timeEntries[dayIdx];
      const hours = dayEntry?.hours || 0;
      rowData.push(formatHoursToTime(hours));
    });

    // Add totals
    const totalHours = calculateRowTotalHours(row, visibleDays);
    const billableAmount = calculateRowBillableAmount(row, visibleDays);

    rowData.push(formatHoursToTime(totalHours));
    rowData.push(
      billableAmount > 0
        ? `${currencySymbol}${billableAmount.toFixed(2)}`
        : `${currencySymbol}0`,
    );

    worksheetData.push(rowData);
  });

  // Add totals row
  const totalsRow = ['', '', '', '', '', '', 'Total'];

  // Calculate day totals
  visibleDays.forEach((dayIdx) => {
    const dayTotal = rows.reduce((sum, row) => {
      const dayEntry = row.timeEntries[dayIdx];
      return sum + (dayEntry?.hours || 0);
    }, 0);
    totalsRow.push(formatHoursToTime(dayTotal));
  });

  // Calculate grand totals
  const grandTotalHours = rows.reduce(
    (sum, row) => sum + calculateRowTotalHours(row, visibleDays),
    0,
  );
  const grandTotalBillable = rows.reduce(
    (sum, row) => sum + calculateRowBillableAmount(row, visibleDays),
    0,
  );

  totalsRow.push(formatHoursToTime(grandTotalHours));
  totalsRow.push(
    grandTotalBillable > 0
      ? `${currencySymbol}${grandTotalBillable.toFixed(2)}`
      : `${currencySymbol}0`,
  );

  worksheetData.push(totalsRow);

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths
  worksheet['!cols'] = headers.map(() => ({ wch: 20 }));

  // Center align headers
  headers.forEach((_, index) => {
    const cellAddress = XLSX.utils.encode_cell({ c: index, r: 1 });
    if (worksheet[cellAddress]) {
      worksheet[cellAddress].s = { alignment: { horizontal: 'center' } };
    }
  });

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Weekly Timesheet');

  // Generate filename and download
  const filename = generateFilename(dateRange);
  XLSX.writeFile(workbook, filename, { cellStyles: true });
};

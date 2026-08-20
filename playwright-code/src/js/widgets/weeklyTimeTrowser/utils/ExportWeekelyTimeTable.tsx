import * as XLSX from 'xlsx';
import { WeeklyTimeFormState } from 'src/js/widgets/weeklyTimeTrowser/hooks/useWeeklyTimeForm';
import {
  getIsWeekdayHidden,
  UxPreferenceData,
  UxPreferenceKey,
} from 'src/js/service/utils/useUXPreferences';
import {
  getRowBillableTotal,
  getRowTimeTotal,
  getTotalBillableAmount,
  getTotalHoursForWeek,
} from 'src/js/widgets/weeklyTimeTrowser/hooks/useWeeklyTotals';
import { secondsToDurationTimestamp } from 'src/js/common/DateAndTimeUtils';
import { TimeTrackingCompanySettings } from 'src/js/service/hooks/settings/useCompanySettings';

export const exportWeeklyTimesheetExcel = (
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
  const workbook = XLSX.utils.book_new();
  const worksheetData = [];

  const showBillRateAndAmount =
    settings.isBillingFieldEnabled && isBillRateEnable;
  const showProjectField =
    preferences[UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS].isProjectFieldEnabled;

  // Add "Weekly Time Sheet" as the heading
  worksheetData.push(['Weekly Time Sheet']);

  const headers = [
    'Customer',
    ...(showProjectField ? ['Project'] : []),
    'Service',
    'Cost Rate',
    ...(showBillRateAndAmount ? ['Hourly Rate'] : []),
    'Billable',
    'Taxable',
    'Description',
  ];

  // Add headers for each visible day
  const visibleDays = Array.from({ length: 7 }, (_, index) => {
    const day = data.week.startDate.add(index, 'days');
    if (
      !getIsWeekdayHidden(
        day.day(),
        preferences[UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE],
      )
    ) {
      headers.push(day.format('dddd'));
      return index;
    }
    return null;
  }).filter((index) => index !== null);

  headers.push('Total Hours');
  if (showBillRateAndAmount) {
    headers.push('Billable');
  }
  worksheetData.push(headers);

  data.weeklyTimeRows.forEach((row, index) => {
    const jobDetails = [
      row.timeAgainst.customer?.id
        ? quickFillFieldLabels[index]?.customer || ''
        : '',
      ...(showProjectField
        ? [
            row.timeAgainst.project?.id
              ? quickFillFieldLabels[index]?.project || ''
              : '',
          ]
        : []),
      row.service.id ? quickFillFieldLabels[index]?.service || '' : '',
      hasProjects &&
      preferences[UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS].isCostRateFieldEnabled
        ? row.costRate
        : '',
      ...(showBillRateAndAmount ? [row.billable ? row.billRate : ''] : []),
      // eslint-disable-next-line no-nested-ternary
      settings.isBillingFieldEnabled
        ? row.billable
          ? intl.formatMessage({ id: 'yes' })
          : intl.formatMessage({ id: 'no' })
        : '',
      // eslint-disable-next-line no-nested-ternary
      settings.isTaxableFieldEnabled &&
      preferences[UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS]
        .isTaxableFieldEnabled &&
      row.billable
        ? row.taxable
          ? intl.formatMessage({ id: 'yes' })
          : intl.formatMessage({ id: 'no' })
        : '',
      row.notes || '',
    ];

    const days = visibleDays.map((dayIndex) =>
      secondsToDurationTimestamp(row.durations[dayIndex || 0]?.duration ?? 0),
    );

    const rowTotalHours = secondsToDurationTimestamp(
      getRowTimeTotal(row.durations),
    );
    const rowBillable = `${currencySymbol}${getRowBillableTotal(
      row.billRate ?? 0,
      getRowTimeTotal(row.durations),
    )}`;

    worksheetData.push([
      ...jobDetails,
      ...days,
      rowTotalHours,
      ...(showBillRateAndAmount ? [rowBillable] : []),
    ]);
  });

  const totalHours = secondsToDurationTimestamp(
    getTotalHoursForWeek(
      data.weeklyTimeRows.map((row) => getRowTimeTotal(row.durations)),
    ),
  );
  const totalBillableAmount = getTotalBillableAmount(data.weeklyTimeRows);

  // jobDetails length determines how many empty prefix cells appear before "Weekly Total"
  const jobDetailsLength =
    headers.length - visibleDays.length - (showBillRateAndAmount ? 2 : 1);
  const emptyPrefix = Array(jobDetailsLength - 1).fill('');

  worksheetData.push([
    ...emptyPrefix,
    intl.formatMessage({ id: 'weekly.total' }),
    ...visibleDays.map((dayIndex) => {
      const dayTotal = data.weeklyTimeRows.reduce(
        (sum, row) => sum + (row.durations[dayIndex || 0]?.duration ?? 0),
        0,
      );
      return secondsToDurationTimestamp(dayTotal);
    }),
    totalHours,
    ...(showBillRateAndAmount
      ? [`${currencySymbol}${totalBillableAmount}`]
      : []),
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths to accommodate full text
  // Adjust width as needed
  worksheet['!cols'] = headers.map(() => ({ wch: 20 }));

  // Center align headers
  headers.forEach((header, index) => {
    const cellAddress = XLSX.utils.encode_cell({ c: index, r: 1 });
    if (worksheet[cellAddress]) {
      worksheet[cellAddress].s = { alignment: { horizontal: 'center' } };
    }
  });

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Weekly Timesheet');

  XLSX.writeFile(workbook, 'weekly_timesheet.xlsx', { cellStyles: true });
};

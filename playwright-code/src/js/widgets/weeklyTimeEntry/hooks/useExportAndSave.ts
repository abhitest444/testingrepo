import { useCallback } from 'react';
import { useSandbox } from '@payroll/quicksand';
import { useCurrencySymbol } from 'src/js/service/utils/sandboxUtils';
import { useSaveWeeklyTimeEntries } from 'src/js/service/hooks/weeklyTimeEntries/useSaveWeeklyTimeEntries';
import {
  createCustomerInteraction,
  endInteractionWithSuccess,
  endInteractionWithFailure,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import { useAppSelector } from '../store';
import {
  selectTimesheetRows,
  selectDateRange,
  selectVisibleDays,
  selectWeekDates,
  selectCustomerData,
  selectTeamMember,
} from '../store/selectors';
import { exportWeeklyTimesheet } from '../utils/exportWeeklyTimesheet';
import { printWeeklyTimeTable } from '../utils/printWeeklyTimeTable';
import { WEEKLY_TIME_ENTRY_LOGGING_CONSTANTS } from '../utils/constants';

/**
 * Custom hook for exporting and saving weekly timesheet data
 * Provides functions to export the current week's data to Excel and save to the server
 */
export const useExportAndSave = (onSaveSuccess?: () => void) => {
  const sandbox = useSandbox();
  const rows = useAppSelector(selectTimesheetRows);
  const dateRange = useAppSelector(selectDateRange);
  const visibleDays = useAppSelector(selectVisibleDays);
  const weekDates = useAppSelector(selectWeekDates);
  const customerData = useAppSelector(selectCustomerData);
  const currencySymbol = useCurrencySymbol();
  const teamMember = useAppSelector(selectTeamMember);
  const teamMemberName = teamMember?.name;

  // Use the save hook with optional onSaveSuccess callback
  const { saveWeeklyTimeEntries, loading: saveLoading } =
    useSaveWeeklyTimeEntries({ onSaveSuccess });

  const handleExport = useCallback(async () => {
    if (!dateRange.start || !dateRange.end) {
      sandbox.logger.warn(
        WEEKLY_TIME_ENTRY_LOGGING_CONSTANTS.ERRORS
          .NO_DATES_FOR_WEEKLY_TIME_ENTRIES_EXPORT,
      );
      return;
    }

    // Create customer interaction for FCI tracking
    createCustomerInteraction(
      sandbox,
      TimeCustomerInteraction.WEEKLY_TIME_SHEET_EXPORT,
      { intuitInteractionNoBackendCalls: 'true' },
    );

    try {
      await exportWeeklyTimesheet({
        rows,
        dateRange,
        visibleDays,
        weekDates,
        customerData,
        currencySymbol,
      });
      sandbox.logger.info(
        WEEKLY_TIME_ENTRY_LOGGING_CONSTANTS.SUCCESS
          .WEEKLY_TIME_ENTRIES_EXPORT_SUCCESS,
        {
          noOfRowsExported: rows.length,
          dateRange,
        },
      );

      // End customer interaction with success
      endInteractionWithSuccess(
        sandbox,
        TimeCustomerInteraction.WEEKLY_TIME_SHEET_EXPORT,
      );
    } catch (error) {
      sandbox.logger.error(
        WEEKLY_TIME_ENTRY_LOGGING_CONSTANTS.ERRORS
          .WEEKLY_TIME_ENTRIES_EXPORT_FAILED,
        {
          error,
        },
      );

      // End customer interaction with failure
      endInteractionWithFailure(
        sandbox,
        TimeCustomerInteraction.WEEKLY_TIME_SHEET_EXPORT,
        'Export operation failed',
        error,
      );
    }
  }, [
    rows,
    dateRange,
    visibleDays,
    weekDates,
    customerData,
    currencySymbol,
    sandbox,
  ]);

  const handleExportAndSave = useCallback(async () => {
    try {
      // First save the data
      await saveWeeklyTimeEntries();

      // Then export
      await handleExport();
    } catch (error) {
      // Don't export if save failed
      // Error handling is already done in the useSaveWeeklyTimeEntries hook
      sandbox.logger.error(
        WEEKLY_TIME_ENTRY_LOGGING_CONSTANTS.ERRORS
          .WEEKLY_TIME_ENTRIES_EXPORT_FAILED,
        {
          error,
        },
      );
    }
  }, [saveWeeklyTimeEntries, handleExport, sandbox.logger]);

  const handlePrintAndSave = useCallback(async () => {
    // Create customer interaction for FCI tracking
    createCustomerInteraction(
      sandbox,
      TimeCustomerInteraction.WEEKLY_TIME_SHEET_PRINT,
      { intuitInteractionNoBackendCalls: 'true' },
    );

    try {
      // First save the data
      await saveWeeklyTimeEntries();

      // Then print the formatted table
      printWeeklyTimeTable({
        rows,
        dateRange,
        visibleDays,
        weekDates,
        customerData,
        currencySymbol,
        teamMemberName,
        teamMemberType: teamMember?.type,
      });
      sandbox.logger.info(
        WEEKLY_TIME_ENTRY_LOGGING_CONSTANTS.SUCCESS
          .WEEKLY_TIME_ENTRIES_PRINT_SUCCESS,
        {
          noOfRowsExported: rows.length,
          dateRange,
        },
      );

      // End customer interaction with success
      endInteractionWithSuccess(
        sandbox,
        TimeCustomerInteraction.WEEKLY_TIME_SHEET_PRINT,
      );
    } catch (error) {
      // Don't print if save failed
      // Error handling is already done in the useSaveWeeklyTimeEntries hook
      sandbox.logger.error(
        WEEKLY_TIME_ENTRY_LOGGING_CONSTANTS.ERRORS
          .WEEKLY_TIME_ENTRIES_PRINT_FAILED,
        {
          error,
        },
      );

      // End customer interaction with failure
      endInteractionWithFailure(
        sandbox,
        TimeCustomerInteraction.WEEKLY_TIME_SHEET_PRINT,
        'Print operation failed',
        error,
      );
    }
  }, [
    saveWeeklyTimeEntries,
    rows,
    dateRange,
    visibleDays,
    weekDates,
    customerData,
    currencySymbol,
    teamMemberName,
    teamMember?.type,
    sandbox,
  ]);

  return {
    handleExport,
    handleExportAndSave,
    handlePrintAndSave,
    saveLoading,
  };
};

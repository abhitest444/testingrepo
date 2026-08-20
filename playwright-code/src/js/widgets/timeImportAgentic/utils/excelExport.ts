import * as XLSX from './xlsxConfig';

/**
 * Export time entries to Excel file
 */
export const exportTimeEntriesToExcel = (
  timeEntries: any[],
  filename: string = 'failed_time_entries.xlsx',
): void => {
  if (!timeEntries || timeEntries.length === 0) {
    // No entries to export
    return;
  }

  try {
    // Prepare data for Excel - flatten the time entry objects
    const excelData = timeEntries.map((entry) => {
      const row: any = {};

      // Add all properties from the entry
      Object.keys(entry).forEach((key) => {
        // Skip complex objects and arrays, keep only primitive values
        const value = entry[key];
        if (
          value !== null &&
          value !== undefined &&
          typeof value !== 'object' &&
          !Array.isArray(value)
        ) {
          row[key] = value;
        } else if (Array.isArray(value)) {
          // Convert arrays to comma-separated strings
          row[key] = value.join(', ');
        } else if (typeof value === 'object' && value !== null) {
          // For objects, try to get a meaningful string representation
          if (value.name) {
            row[key] = value.name;
          } else if (value.id) {
            row[key] = value.id;
          } else {
            row[key] = JSON.stringify(value);
          }
        }
      });

      return row;
    });

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Auto-size columns
    const maxWidths: number[] = [];
    excelData.forEach((row) => {
      Object.keys(row).forEach((key, index) => {
        const value = String(row[key] || '');
        const width = Math.max(key.length, value.length);
        maxWidths[index] = Math.max(maxWidths[index] || 10, width);
      });
    });

    worksheet['!cols'] = maxWidths.map((width) => ({
      wch: Math.min(width + 2, 50),
    }));

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Failed Entries');

    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, filename);
  } catch (error) {
    // Show user-friendly error message
    alert('Failed to export to Excel. Please try again.');
  }
};

/**
 * Export all time entries (success + failed) to Excel
 */
export const exportAllTimeEntriesToExcel = (
  timeEntries: any[],
  filename: string = 'all_time_entries.xlsx',
): void => {
  exportTimeEntriesToExcel(timeEntries, filename);
};

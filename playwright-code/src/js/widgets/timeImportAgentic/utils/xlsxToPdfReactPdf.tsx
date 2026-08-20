/**
 * XLSX to PDF Converter using @react-pdf/renderer
 * Lightweight (~500KB) and React-friendly
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer';
import React from 'react';
import * as XLSX from './xlsxConfig';

// Styles for the PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 8,
  },
  title: {
    fontSize: 14,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#bfbfbf',
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
  },
  tableCell: {
    padding: 5,
    fontSize: 8,
    borderRightWidth: 1,
    borderRightColor: '#bfbfbf',
    flex: 1,
    textAlign: 'left',
  },
});

interface ConversionOptions {
  sheetName?: string;
  includeTitle?: boolean;
  orientation?: 'portrait' | 'landscape';
}

/**
 * Create a PDF document component from Excel data
 * Renders ALL rows visually as-is without assuming any structure
 */
function createPdfDocument(
  data: any[][],
  sheetName: string,
  options: ConversionOptions,
) {
  const { includeTitle = false } = options;

  if (data.length === 0) {
    return (
      <Document>
        <Page
          size="A4"
          orientation={options.orientation || 'landscape'}
          style={styles.page}
        >
          <Text>No data</Text>
        </Page>
      </Document>
    );
  }

  // Find max columns across all rows
  const maxColumns = Math.max(...data.map((row) => row.length));

  return (
    <Document>
      <Page
        size="A4"
        orientation={options.orientation || 'landscape'}
        style={styles.page}
      >
        {includeTitle && <Text style={styles.title}>{sheetName}</Text>}

        <View style={styles.table}>
          {/* Render ALL rows exactly as they appear - no header logic */}
          {data.map((row: any[], rowIndex: number) => (
            // eslint-disable-next-line react/no-array-index-key
            <View key={`row-${rowIndex}`} style={styles.tableRow}>
              {Array.from({ length: maxColumns }).map((_, colIndex) => (
                <Text
                  // eslint-disable-next-line react/no-array-index-key
                  key={`cell-${rowIndex}-${colIndex}`}
                  style={styles.tableCell}
                >
                  {String(row[colIndex] || '')}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}

/**
 * Convert XLSX or CSV file to PDF blob
 * Renders the spreadsheet visually as-is without parsing structure
 * @param xlsxFile - The Excel/CSV file to convert
 * @param options - Conversion options
 * @returns PDF as a Blob
 */
export async function convertXlsxToPdf(
  xlsxFile: File,
  options: ConversionOptions = {},
): Promise<Blob> {
  try {
    // Read the file (supports XLSX, XLS, CSV, and more)
    const arrayBuffer = await xlsxFile.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    // Get the sheet to convert
    const targetSheetName = options.sheetName || workbook.SheetNames[0];
    const worksheet = workbook.Sheets[targetSheetName];

    if (!worksheet) {
      throw new Error(`Sheet "${targetSheetName}" not found in workbook`);
    }

    // Convert sheet to JSON (array of arrays)
    const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1, // Use array of arrays (no header detection)
      defval: '', // Empty cells = empty string
      raw: false, // Format all values as strings
      blankrows: false, // Skip completely empty rows
    });

    // Filter out rows that are completely empty (all cells are empty strings)
    const data = rawData.filter((row) =>
      row.some((cell) => cell !== null && cell !== undefined && cell !== ''),
    );

    if (data.length === 0) {
      throw new Error('No data found in the Excel sheet');
    }

    // Create the PDF document component
    const doc = createPdfDocument(data, targetSheetName, options);

    // Generate PDF blob
    const pdfBlob = await pdf(doc).toBlob();

    return pdfBlob;
  } catch (error) {
    // Error is re-thrown with context, console error removed for linting
    throw new Error(
      `Failed to convert XLSX to PDF: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    );
  }
}

/**
 * Convert XLSX or CSV file to PDF File object (for upload)
 * @param xlsxFile - The Excel/CSV file to convert
 * @param options - Conversion options
 * @returns PDF as a File object
 */
export async function convertXlsxToPdfFile(
  xlsxFile: File,
  options: ConversionOptions = {},
): Promise<File> {
  const pdfBlob = await convertXlsxToPdf(xlsxFile, options);
  const fileName = xlsxFile.name.replace(/\.(xlsx?|csv)$/i, '.pdf');

  return new File([pdfBlob], fileName, {
    type: 'application/pdf',
    lastModified: Date.now(),
  });
}

/**
 * Convert and download XLSX or CSV as PDF
 * @param xlsxFile - The Excel/CSV file to convert
 * @param outputFileName - Optional output filename
 * @param options - Conversion options
 */
export async function convertAndDownloadXlsxToPdf(
  xlsxFile: File,
  outputFileName?: string,
  options: ConversionOptions = {},
): Promise<void> {
  const pdfBlob = await convertXlsxToPdf(xlsxFile, options);

  const fileName =
    outputFileName || xlsxFile.name.replace(/\.(xlsx?|csv)$/i, '.pdf');

  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

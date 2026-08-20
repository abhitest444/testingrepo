import React, { useCallback, useState, useRef } from 'react';
import { H4, B2 } from '@ids-ts/typography';
import PageMessage from '@ids-ts/page-message';
import HOCWidget from 'web-shell-core/widgets/HOCWidget';
import * as XLSX from '../utils/xlsxConfig';
import { useAppDispatch, useAppSelector } from '../store';
import {
  setRawExcelData,
  setExcelColumns,
  setUploadFileName,
} from '../store/excelDataSlice';
import { setCurrentStep, resetProgressState } from '../store/progressSlice';
import { setScannedEntries, setExtracting } from '../store/scannedDataSlice';
import { resetFieldMappingsState } from '../store/fieldMappingsSlice';
import FileUploadZone from '../components/FileUploadZone';
import TypewriterText from '../components/TypewriterText';
import StepProgressCard from '../components/StepProgressCard';
import { StepContainer } from '../base.styles';
// Using Excel to PDF conversion with HOCWidget upload
import { convertXlsxToPdfFile } from '../utils/xlsxToPdfReactPdf';
import {
  convertXlsxToChunkedPdfs,
  shouldUseBulkUpload,
} from '../utils/bulkPdfProcessor';
// Converse API for extraction
import {
  extractFromDocument,
  extractFromDocumentsBulk,
} from '../utils/FinancialDocumentApiClient';
import { getAppSecret } from '../../../service/ApolloClientBuilderUtils';

interface Step1UploadProps {
  isUploading: boolean;
  isLoading: boolean;
  hasError: string | null;
  sandbox?: any;
  onScanUploadSuccess: (fileId: string) => void;
  /** When true, hide the step progress card (e.g. in split-screen view). */
  hideStepProgress?: boolean;
  /** When true, hide title and subtitle (e.g. in split-screen view). */
  hideTitle?: boolean;
  /** When true, render only the upload component (FileUploadZone + hidden widget + error), no titles or step progress (e.g. split-screen right panel). */
  uploadOnly?: boolean;
}

type BoundAPIFunc = (methodName: string, params: any[]) => Promise<any>;

interface UploadError {
  title: string;
  message: string;
}

const Step1Upload: React.FC<Step1UploadProps> = ({
  isUploading,
  isLoading,
  hasError,
  sandbox,
  onScanUploadSuccess,
  hideStepProgress = false,
  hideTitle = false,
  uploadOnly = false,
}) => {
  const dispatch = useAppDispatch();
  const isExtracting = useAppSelector(
    (state) => state.scannedData.isExtracting,
  );

  // Upload widget API reference
  const uploadWidgetApiRef = useRef<BoundAPIFunc | null>(null);

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'excel' | 'csv' | 'scan' | null>(
    null,
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadError, setUploadError] = useState<UploadError | null>(null);
  const [fileUploaded, setFileUploaded] = useState(false);

  // HOCWidget configuration
  const serviceOnboardConfig = {
    intuitApiKey: getAppSecret(sandbox),
    offeringId: 'Intuit.work.timecapture.timetrackingui',
    assetId: '8506191389517858617',
    is7216: false,
  };

  // Custom headers with proper Accept version
  const customHeaders = {
    Accept: 'application/json;version=2.0.0',
  };

  // Store the upload widget's API
  const setPublicApi = (boundAPIFunc: BoundAPIFunc) => {
    uploadWidgetApiRef.current = boundAPIFunc;
  };

  // Convert scanned data to Excel format
  const convertScannedDataToExcel = useCallback((entries: any[]) => {
    if (!entries || entries.length === 0) return { columns: [], data: [] };

    // Extract all unique column names
    const columnSet = new Set<string>();

    entries.forEach((entry) => {
      // Add direct fields (exclude both 'unknown' and 'unknown_fields' as they're not actual columns)
      Object.keys(entry).forEach((key) => {
        if (
          key !== 'unknown' &&
          key !== 'unknown_fields' &&
          entry[key] !== undefined
        ) {
          columnSet.add(key);
        }
      });
      // Add unknown fields
      entry.unknown?.forEach((unknown: any) => {
        if (unknown.name) {
          columnSet.add(unknown.name);
        }
      });
    });

    // Convert set to array to maintain unique columns
    const columns = Array.from(columnSet);

    // Convert entries to Excel format (array of arrays)
    const excelData = entries.map((entry) => {
      const row: any[] = [];
      columns.forEach((column) => {
        // Check if it's a direct field
        if (entry[column] !== undefined) {
          row.push(entry[column]);
        } else {
          // Check if it's in unknown fields
          const unknownField = entry.unknown?.find(
            (u: any) => u.name === column,
          );
          row.push(unknownField?.value || '');
        }
      });
      return row;
    });

    // Add header row
    const excelRows = [columns, ...excelData];

    return { columns, data: excelRows };
  }, []);

  // Handle document extraction after successful upload
  const handleDocumentExtraction = useCallback(
    async (documentIds: string[]) => {
      try {
        const primaryDocId = documentIds[0];

        // Call Converse API and extract data
        // For multiple documents, extractFromDocumentsBulk makes separate API calls
        // per document and manually merges the results (the Converse API doesn't
        // properly merge entries when given multiple IDs in a single request)
        const extractedData =
          documentIds.length === 1
            ? await extractFromDocument(sandbox, documentIds[0])
            : await extractFromDocumentsBulk(sandbox, documentIds);

        // Process the extracted data
        if (
          extractedData?.result?.entries &&
          extractedData.result.entries.length > 0
        ) {
          // Transform API response: rename unknown_fields to unknown
          const transformedEntries = extractedData.result.entries.map(
            (entry: any) => ({
              ...entry,
              unknown: entry.unknown_fields || entry.unknown || [],
            }),
          );

          // Save scanned entries to Redux
          dispatch(setScannedEntries(transformedEntries));

          // Convert scanned data to Excel format
          const { columns, data } =
            convertScannedDataToExcel(transformedEntries);

          // Save to Excel Redux slice
          dispatch(setExcelColumns(columns));
          dispatch(setRawExcelData(data));

          // Stop showing extraction loader
          dispatch(setExtracting(false));
          setIsAnalyzing(false);

          // Reset file state after successful processing
          setUploadedFile(null);
          setFileType(null);
          setFileUploaded(false);

          // Navigate to processing step (1.5) which will auto-map fields
          dispatch(setCurrentStep(1.5));

          // Call success callback with primary document ID
          if (onScanUploadSuccess && primaryDocId) {
            onScanUploadSuccess(primaryDocId);
          }
        } else {
          throw new Error(
            'No entries found in extracted data. The document may not contain time entry information.',
          );
        }
      } catch (error) {
        setIsAnalyzing(false);
        dispatch(setExtracting(false));

        setUploadError({
          title: 'Extraction Failed',
          message: `Failed to extract data: ${
            error instanceof Error ? error.message : 'Unknown error'
          }. Please try a different file or format.`,
        });

        // Reset file selection on error
        setUploadedFile(null);
        setFileType(null);
        setFileUploaded(false);
      }
    },
    [sandbox, dispatch, convertScannedDataToExcel, onScanUploadSuccess],
  );

  // Helper function to check if upload finished with specific status
  const finishedUploadHasStatus = (evt: any, status: string) => {
    if (evt.type !== 'EVENT_UPLOADS_FINISHED') return false;

    // Check if event has top-level status
    if (evt.status === status) return true;

    // For array of documents, handle failures differently from successes
    if (Array.isArray(evt.data)) {
      if (status === 'UPLOAD_FAILURE') {
        // If checking for failure, return true if ANY document failed
        // This ensures we catch partial failures and show error to user
        return evt.data.some((doc: any) => doc.status === 'UPLOAD_FAILURE');
      }
      // For success, require ALL documents to have succeeded
      return evt.data.every((doc: any) => doc.status === status);
    }

    // Check for single document object with status
    if (evt.data && typeof evt.data === 'object' && evt.data.status) {
      return evt.data.status === status;
    }

    return false;
  };

  // Helper function to get event data
  const getEventData = (evt: any) => evt.data;

  // Handle widget errors (onError callback)
  const handleWidgetError = useCallback(
    (error: any) => {
      const errorMessage =
        error?.message ||
        error?.error?.message ||
        error?.data?.message ||
        error?.error ||
        'An error occurred during upload';

      setIsAnalyzing(false);
      dispatch(setExtracting(false));
      setUploadError({
        title: 'Upload Failed',
        message: `${errorMessage}. Upload another file to continue.`,
      });
      setUploadedFile(null);
      setFileType(null);
      setFileUploaded(false);
    },
    [dispatch],
  );

  // Handle events from the upload widget
  const handleUploadEvents = useCallback(
    (event: any) => {
      // Handle upload failure (including partial failures)
      if (finishedUploadHasStatus(event, 'UPLOAD_FAILURE')) {
        const eventData = getEventData(event);

        // Extract error message, handling both single and multiple failures
        let errorMessage = 'Unknown error';
        if (Array.isArray(eventData)) {
          // Find the first failed document and get its error message
          const failedDoc = eventData.find(
            (doc: any) => doc.status === 'UPLOAD_FAILURE',
          );
          errorMessage =
            failedDoc?.error?.message ||
            failedDoc?.error ||
            'One or more files failed to upload';
        } else {
          errorMessage =
            eventData?.error?.message || eventData?.error || 'Unknown error';
        }

        // Stop analyzing animation
        setIsAnalyzing(false);
        dispatch(setExtracting(false));

        // Show error message
        setUploadError({
          title: 'Upload Failed',
          message: `Upload error: ${errorMessage}. Upload another file to continue.`,
        });

        // Reset file selection
        setUploadedFile(null);
        setFileType(null);
        setFileUploaded(false);

        // Handle upload success (only when ALL files succeeded)
      } else if (finishedUploadHasStatus(event, 'UPLOAD_SUCCESS')) {
        const eventData = getEventData(event);

        // Extract document IDs from uploaded files
        // eventData should be an array of uploaded document objects
        const uploadedDocs = Array.isArray(eventData) ? eventData : [eventData];

        // Only get IDs from successfully uploaded documents
        const documentIds = uploadedDocs
          .filter((doc: any) => doc.status === 'UPLOAD_SUCCESS')
          .map((doc) => doc.systemAttributes?.id)
          .filter((id) => id);

        if (documentIds.length === 0) {
          setIsAnalyzing(false);
          dispatch(setExtracting(false));
          setUploadError({
            title: 'Upload Error',
            message: 'No document IDs returned from upload. Please try again.',
          });
          // Reset file selection for consistency with other error paths
          setUploadedFile(null);
          setFileType(null);
          setFileUploaded(false);
          return;
        }

        // Transition from analyzing to extracting state
        setIsAnalyzing(false);
        dispatch(setExtracting(true));

        // Now call extraction API with the document IDs
        handleDocumentExtraction(documentIds);
      }
      // Note: Other events (UPLOAD_PROGRESS, etc.) are ignored
    },
    [dispatch, handleDocumentExtraction],
  );

  // Function to trigger file upload via the widget
  // Note: Widget sends results via events (onEvent), not promises
  const uploadFilesViaWidget = useCallback((files: File[]) => {
    if (!uploadWidgetApiRef.current) {
      throw new Error('Upload widget API not initialized');
    }

    uploadWidgetApiRef.current('uploadFiles', files);
    // Result will be sent via handleUploadEvents callback
  }, []);

  const detectFileType = (file: File): 'excel' | 'csv' | 'scan' => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'xls' || ext === 'xlsx') return 'excel';
    if (ext === 'csv') return 'csv';
    return 'scan';
  };

  const PREVIEW_IMAGE_KEY = 'timeImportAgentic_previewImage';

  const clearPreviewImage = useCallback(() => {
    try {
      const url = sessionStorage.getItem(PREVIEW_IMAGE_KEY);
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
      sessionStorage.removeItem(PREVIEW_IMAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  const handleFileSelect = useCallback(
    async (file: File) => {
      // Clear any previous errors
      setUploadError(null);

      // Clear previous preview image from session storage
      clearPreviewImage();

      // Reset field mappings from previous upload to prevent stale data
      dispatch(resetFieldMappingsState());

      // Reset progress state including completed steps when uploading a new file
      dispatch(resetProgressState());

      const type = detectFileType(file);
      setUploadedFile(file);
      setFileType(type);
      setFileUploaded(true);
      dispatch(setUploadFileName(file.name));

      // Automatically start processing based on file type
      setIsAnalyzing(true);

      // Handle Excel/CSV files - convert to PDF for better extraction
      if (type === 'excel' || type === 'csv') {
        try {
          // Read file to check row count
          const arrayBuffer = await file.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
          }) as any[][];

          const dataRows = jsonData.slice(1); // Exclude header
          const useBulkUpload = shouldUseBulkUpload(dataRows.length);

          let pdfFilesToUpload: File[];

          if (useBulkUpload) {
            // Convert to chunked PDFs for large files
            const pdfChunks = await convertXlsxToChunkedPdfs(file, {
              orientation: 'landscape',
              chunkSize: 20, // 20 rows per chunk
            });
            pdfFilesToUpload = pdfChunks.map((chunk) => chunk.pdfFile);
          } else {
            // Convert to single PDF for smaller files
            const pdfFile = await convertXlsxToPdfFile(file, {
              orientation: 'landscape',
              includeTitle: false,
            });
            pdfFilesToUpload = [pdfFile];
          }

          // PDF conversion succeeded, now upload via widget
          try {
            uploadFilesViaWidget(pdfFilesToUpload);
            // Widget will send EVENT_UPLOADS_FINISHED event through handleUploadEvents
            return;
          } catch (widgetError) {
            // Widget upload initialization failed
            setIsAnalyzing(false);
            setUploadError({
              title: 'Upload Failed',
              message: `Widget upload error: ${
                widgetError instanceof Error
                  ? widgetError.message
                  : 'Unknown error'
              }. Upload another file to continue.`,
            });
            // Reset file selection
            setUploadedFile(null);
            setFileType(null);
            setFileUploaded(false);
            return;
          }
        } catch (conversionError) {
          // PDF conversion failed
          setIsAnalyzing(false);
          setUploadError({
            title: 'Conversion Error',
            message: `Failed to process Excel file: ${
              conversionError instanceof Error
                ? conversionError.message
                : 'Unknown error'
            }. Please try again.`,
          });
          // Reset file selection
          setUploadedFile(null);
          setFileType(null);
          setFileUploaded(false);
          return;
        }
      }

      // Handle scan files (images/PDFs) - upload directly
      try {
        // For images, store blob URL in session storage for preview (show image instead of table)
        if (file.type.startsWith('image/')) {
          const objectUrl = URL.createObjectURL(file);
          sessionStorage.setItem(PREVIEW_IMAGE_KEY, objectUrl);
        }
        // Upload file via widget (results come via events, not promises)
        uploadFilesViaWidget([file]);

        // Widget will send events through handleUploadEvents
        // Don't set analyzing to false here - wait for success/error event
      } catch (widgetError) {
        setIsAnalyzing(false);
        setUploadError({
          title: 'Upload Failed',
          message: `Widget upload error: ${
            widgetError instanceof Error ? widgetError.message : 'Unknown error'
          }. Upload another file to continue.`,
        });
        // Reset file selection
        setUploadedFile(null);
        setFileType(null);
        setFileUploaded(false);
      }
    },
    [dispatch, uploadFilesViaWidget, clearPreviewImage],
  );

  // Show initial loading (only if not extracting from scan) – inline text, no full-screen loader
  if (isLoading && !isExtracting) {
    return (
      <div style={{ padding: '24px', color: '#64748b', fontSize: '14px' }}>
        <TypewriterText text="Initializing…" speed={40} cursor />
      </div>
    );
  }

  // Show analyzing state for file upload and conversion
  if (isAnalyzing) {
    return (
      <div style={{ padding: '24px', color: '#64748b', fontSize: '14px' }}>
        <TypewriterText text="Processing file…" speed={40} cursor />
      </div>
    );
  }

  // Show extracting state when calling Converse API
  if (isExtracting && !uploadOnly) {
    return (
      <div style={{ padding: '24px', color: '#64748b', fontSize: '14px' }}>
        <TypewriterText text="Extracting…" speed={40} cursor />
      </div>
    );
  }

  if (uploadOnly) {
    return (
      <>
        {/* Hidden upload widget - provides API but no UI (for scan) */}
        <div style={{ display: 'none' }}>
          <HOCWidget
            widgetId="smartdocs-web-platform/upload-documents"
            sandbox={sandbox}
            serviceOnboardConfig={serviceOnboardConfig}
            hideHeader
            hideFooter
            hideOnUploadSuccess={false}
            customHeaders={customHeaders}
            autoCreateFolder
            onEvent={handleUploadEvents}
            onError={handleWidgetError}
            setPublicApi={setPublicApi}
            syncExtraction={false}
            extractionNotRequired
            allowLargeFiles
            hideContainer
            renderProgressList={false}
            accept={[
              '.pdf',
              '.csv',
              '.xls',
              '.xlsx',
              'image/*',
              '.jpg',
              '.jpeg',
              '.png',
              '.gif',
              '.bmp',
              '.webp',
              '.tiff',
              '.tif',
            ]}
          />
        </div>
        {uploadError && (
          <div style={{ marginBottom: '16px' }}>
            <PageMessage
              type="error"
              title={uploadError.title}
              dismissible={false}
              onClose={() => setUploadError(null)}
              open
            >
              {uploadError.message}
            </PageMessage>
          </div>
        )}
        {isExtracting ? (
          <div style={{ padding: '24px', color: '#64748b', fontSize: '14px' }}>
            <TypewriterText text="Extracting…" speed={40} cursor />
          </div>
        ) : (
          <FileUploadZone
            onFileSelect={handleFileSelect}
            isDisabled={isUploading}
            fileUploaded={fileUploaded}
          />
        )}
      </>
    );
  }

  return (
    <StepContainer>
      {/* Hidden upload widget - provides API but no UI */}
      <div>
        <HOCWidget
          widgetId="smartdocs-web-platform/upload-documents"
          sandbox={sandbox}
          serviceOnboardConfig={serviceOnboardConfig}
          hideHeader
          hideFooter
          hideOnUploadSuccess={false}
          customHeaders={customHeaders}
          autoCreateFolder
          onEvent={handleUploadEvents}
          onError={handleWidgetError}
          setPublicApi={setPublicApi}
          syncExtraction={false}
          extractionNotRequired
          allowLargeFiles
          hideContainer
          renderProgressList={false}
          accept={[
            '.pdf',
            '.csv',
            '.xls',
            '.xlsx',
            'image/*',
            '.jpg',
            '.jpeg',
            '.png',
            '.gif',
            '.bmp',
            '.webp',
            '.tiff',
            '.tif',
          ]}
        />
      </div>

      {/* Error Message */}
      {uploadError && (
        <div style={{ marginBottom: '24px' }}>
          <PageMessage
            type="error"
            title={uploadError.title}
            dismissible={false}
            onClose={() => setUploadError(null)}
            open
          >
            {uploadError.message}
          </PageMessage>
        </div>
      )}

      {!hideTitle && (
        <>
          <H4 weight="demi" style={{ marginTop: '16px', marginBottom: '20px' }}>
            Upload file
          </H4>
          <B2 style={{ marginBottom: '24px' }}>
            Upload a file that contains your employees&apos; time entries
          </B2>
        </>
      )}

      {/* Info Page Message - hide in split view when hideTitle */}
      {!hideTitle && (
        <PageMessage
          type="info"
          open
          dismissible={false}
          style={{ marginBottom: '24px' }}
          title=""
        >
          We currently don&apos;t support importing break entries or time off
          data.
        </PageMessage>
      )}

      {/* Upload zone and progress card side by side (or upload only when hideStepProgress) */}
      <div
        style={{
          display: 'flex',
          gap: hideStepProgress ? 0 : '24px',
          alignItems: 'flex-start',
          marginBottom: '32px',
        }}
      >
        <div style={{ flex: 1 }}>
          <FileUploadZone
            onFileSelect={handleFileSelect}
            isDisabled={isUploading}
            fileUploaded={fileUploaded}
          />
        </div>
        {!hideStepProgress && (
          <div style={{ width: '280px', flexShrink: 0 }}>
            <StepProgressCard />
          </div>
        )}
      </div>
    </StepContainer>
  );
};

export default Step1Upload;

import { Environment } from '@appfabric/sandbox-spec';
import { Sandbox } from 'src/js/common/sandbox';
import {
  buildHeaders,
  getEnvFromSandbox,
} from '../../../service/ApolloClientBuilderUtils';
import { fetchWithRetry } from './fetchWithRetry';

// Experience ID for Converse API
const EXPERIENCE_ID = '4cd2ec06-800f-491c-aa77-d1c1a4f26d29';

export const PROMPT_CONFIG = {
  type: 'PASS_THROUGH',
  acceptType: 'application/json',
  modelName: 'gemini-2.5-flash-vision',
  id: 'IDXREG_AB_940-test-TimesheetScan',
};

/**
 * Get the Financial Document Service base URL based on environment
 * @param sandbox - Sandbox instance to determine environment
 * @returns Base URL for the Financial Document Service
 */
export const getFinancialDocumentBaseUrl = (sandbox: Sandbox): string => {
  const env = getEnvFromSandbox(sandbox);
  return env === Environment.PROD
    ? 'https://financialdocument.platform.intuit.com/v2'
    : 'https://financialdocument-e2e.platform.intuit.com/v2';
};

/**
 * Upload a document file using the Financial Document Service upload API
 * @param sandbox - Sandbox instance
 * @param file - File to upload
 * @returns Object containing the document ID extracted from Location header
 */
export const uploadDocument = async (
  sandbox: Sandbox,
  file: File,
): Promise<{ documentId: string }> => {
  const baseUrl = getFinancialDocumentBaseUrl(sandbox);
  const uploadApiUrl = `${baseUrl}/documents`;
  const headers = buildHeaders(sandbox);

  // Remove Content-Type from headers - browser will set it automatically for FormData with boundary
  const headersWithoutContentType = { ...headers };
  delete headersWithoutContentType['Content-Type'];
  delete headersWithoutContentType['content-type'];

  // Create FormData for multipart upload
  const formData = new FormData();

  // Generate a unique correlation ID for tracking
  const requestCorrelationId = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 15)}`;

  // Prepare the document metadata - match the successful payload format
  const documentPayload = {
    commonAttributes: {
      name: file.name,
      documentType: 'other',
      is7216: false,
      correlatedDocumentsCount: 1,
      additionalIds: {
        requestCorrelationId,
      },
      documentChannel: 'upload',
      channelType: 'localFile',
      deviceType: 'desktopWeb',
    },
  };

  // Add the document metadata as JSON blob (matching successful format)
  formData.append(
    'document',
    new Blob([JSON.stringify(documentPayload)], { type: 'application/json' }),
    'blob', // Use 'blob' as filename like successful request
  );

  // Add the file with the field name 'tax_file0' (matching successful format)
  formData.append('tax_file0', file, file.name);

  const response = await fetchWithRetry(
    uploadApiUrl,
    {
      method: 'POST',
      headers: {
        ...headersWithoutContentType,
        intuit_offeringid: 'Intuit.work.timecapture.timetrackingui',
        Accept: 'application/json',
        // Don't set Content-Type - browser will set it automatically with boundary for multipart/form-data
      },
      body: formData,
      credentials: 'include',
    },
    {
      maxRetries: 3,
      initialDelayMs: 1000,
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload API error: ${response.status} - ${errorText}`);
  }

  // Extract document ID from Location header
  // Location format: https://financialdocument-e2e.platform.intuit.com/v2/documents/{documentId}
  const locationHeader = response.headers.get('Location');
  if (!locationHeader) {
    throw new Error('No Location header in upload response');
  }

  const documentId = locationHeader.split('/').pop();
  if (!documentId) {
    throw new Error('Could not extract document ID from Location header');
  }

  return { documentId };
};

/**
 * Upload multiple documents in parallel
 * @param sandbox - Sandbox instance
 * @param files - Array of files to upload
 * @param onProgress - Optional callback for progress updates
 * @returns Array of document IDs
 */
export const uploadDocumentsBulk = async (
  sandbox: Sandbox,
  files: File[],
  onProgress?: (completed: number, total: number) => void,
): Promise<string[]> => {
  let completedCount = 0;

  const uploadPromises = files.map(async (file) => {
    const result = await uploadDocument(sandbox, file);
    completedCount += 1;
    if (onProgress) {
      onProgress(completedCount, files.length);
    }
    return result.documentId;
  });

  return Promise.all(uploadPromises);
};

/**
 * Extract data from multiple documents in parallel
 * @param sandbox - Sandbox instance
 * @param documentIds - Array of document IDs to extract from
 * @param onProgress - Optional callback for progress updates
 * @returns Merged extraction results
 */
export const extractFromDocumentsBulk = async (
  sandbox: Sandbox,
  documentIds: string[],
  onProgress?: (completed: number, total: number) => void,
): Promise<any> => {
  let completedCount = 0;

  // Call Converse API in parallel for each document
  const extractionPromises = documentIds.map(async (docId) => {
    const result = await extractFromDocument(sandbox, docId);
    completedCount += 1;
    if (onProgress) {
      onProgress(completedCount, documentIds.length);
    }
    return result;
  });

  const allResults = await Promise.all(extractionPromises);

  // Merge all extraction results
  const mergedEntries: any[] = [];

  allResults.forEach((result) => {
    if (result?.result?.entries && Array.isArray(result.result.entries)) {
      mergedEntries.push(...result.result.entries);
    }
  });

  // Return merged result in same format as single extraction
  return {
    result: {
      entries: mergedEntries,
    },
  };
};

/**
 * Call Converse API to extract data from document(s)
 * @param sandbox - Sandbox instance
 * @param uploadedFileIds - Document ID(s) to extract from (single ID or array)
 * @returns Extracted data response
 */
export const extractFromDocument = async (
  sandbox: Sandbox,
  uploadedFileIds: string | string[],
): Promise<any> => {
  const baseUrl = getFinancialDocumentBaseUrl(sandbox);
  const converseApiUrl = `${baseUrl}/documents/converse`;

  // Ensure uploadedFileIds is always an array
  const docIds = Array.isArray(uploadedFileIds)
    ? uploadedFileIds
    : [uploadedFileIds];

  const response = await fetchWithRetry(
    converseApiUrl,
    {
      method: 'POST',
      headers: {
        ...buildHeaders(sandbox),
        intuit_offeringid: 'Intuit.work.timecapture.timetrackingui',
        Accept: 'application/json;version=1.0.0;',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        docIds,
        experienceId: EXPERIENCE_ID,
        prompt: PROMPT_CONFIG,
      }),
      credentials: 'include',
    },
    {
      maxRetries: 3,
      initialDelayMs: 1000,
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Converse API error: ${response.status} - ${errorText}`);
  }

  return response.json();
};

/**
 * Get Experience ID
 * @returns Experience ID for Converse API
 */
export const getExperienceId = (): string => EXPERIENCE_ID;

import React, {
  useRef,
  useCallback,
  useState,
  useEffect,
  useMemo,
} from 'react';
import { B2, B3 } from '@ids-ts/typography';
import Button from '@ids-ts/button';
import store, { useAppSelector, useAppDispatch } from '../store';
import {
  selectUploadId,
  selectRawExcelData,
  selectExcelColumns,
  selectUploadFileName,
  selectEmployeeGroupedTimeEntries,
  selectScannedEntries,
  selectMappedColumnMappings,
  selectFieldMappingsState,
  selectCurrentStep,
  selectUnknownColumns,
} from '../store/selectors';
import {
  setExtractionSummaryTypewriterComplete,
  setExtractionSummaryFrozenText,
  setPhase2TypewriterComplete,
  setStep3ExtractionComplete,
} from '../store/progressSlice';
import Step1Upload from '../step1Upload/Step1Upload';
import { ProcessingStep } from '../processingStep';
import { Step2Mapping } from '../step2Mapping';
import Step3FieldMapping from '../step3FieldMapping/Step3FieldMapping';
import TypewriterText from './TypewriterText';
import { useStep2Processing } from '../hooks/useStep2Processing';
import { useExtractUnmappedFields } from '../hooks/useExtractUnmappedFields';
import { useAIImportPreferences } from '../hooks/useAIImportPreferences';
import {
  mapServiceField,
  mapCustomerField,
  mapEmployeeField,
  mapClassField,
  mapLocationField,
  mapCustomFieldDropdownValue,
} from '../store/fieldMappingsSlice';

const REQUIRED_QB_FIELDS = [
  'employee',
  'date',
  'hours',
  'service item',
  'class',
  'location',
  'customer',
];

/** Full-screen modal for document preview table */
const DocPreviewFullScreen: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  headers: string[];
  rows: any[][];
}> = ({ open, onClose, title, headers, rows }) => {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Document preview full screen"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          overflow: 'auto',
          padding: '24px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <B3 weight="demi">{title}</B3>
          <Button
            priority="secondary"
            theme="gbsgexperimental"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
        <div style={{ overflow: 'auto', maxHeight: 'calc(90vh - 80px)' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px',
            }}
          >
            <thead>
              <tr>
                {headers.map((h) => (
                  <th
                    key={`header-${String(h)}`}
                    style={{
                      padding: '8px 12px',
                      textAlign: 'left',
                      borderBottom: '2px solid #e2e8f0',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: '#fff',
                    }}
                  >
                    {String(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`row-${(row as any[]).map(String).join('|')}`}>
                  {(row as any[]).map((cell) => (
                    <td
                      key={`cell-${(row as any[])
                        .map(String)
                        .join('|')}-${String(cell)}`}
                      style={{
                        padding: '6px 12px',
                        borderBottom: '1px solid #f1f5f9',
                      }}
                    >
                      {cell != null ? String(cell) : ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const PREVIEW_IMAGE_KEY = 'timeImportAgentic_previewImage';

/** Doc preview: for images show the image; for Excel/PDF show table squeezed in small area + expand button */
const DocPreviewBlock: React.FC = () => {
  const uploadId = useAppSelector(selectUploadId);
  const rawExcelData = useAppSelector(selectRawExcelData);
  const excelColumns = useAppSelector(selectExcelColumns);
  const fileName = useAppSelector(selectUploadFileName);
  const [expandOpen, setExpandOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(PREVIEW_IMAGE_KEY);
    } catch {
      return null;
    }
  });

  if (!uploadId) return null;

  const displayName = fileName || 'Uploaded document';
  const isImagePreview = previewImageUrl && previewImageUrl.startsWith('blob:');
  const headers = rawExcelData?.[0] || excelColumns || [];
  const allDataRows = (rawExcelData || []).slice(1);
  const hasTableData = headers.length > 0;

  return (
    <>
      <div
        style={{
          padding: '12px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <B3 weight="demi" style={{ marginBottom: '8px' }}>
            {displayName}
          </B3>
          {isImagePreview && (
            <Button
              priority="tertiary"
              theme="gbsgexperimental"
              onClick={() => setExpandOpen(true)}
              style={{ flexShrink: 0 }}
            >
              Expand
            </Button>
          )}
          {!isImagePreview && hasTableData && (
            <Button
              priority="tertiary"
              theme="gbsgexperimental"
              onClick={() => setExpandOpen(true)}
              style={{ flexShrink: 0 }}
            >
              Expand
            </Button>
          )}
        </div>
        {isImagePreview && (
          <div
            style={{
              overflow: 'auto',
              maxHeight: '200px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: '#fff',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <img
              src={previewImageUrl}
              alt={displayName}
              style={{
                maxWidth: '100%',
                maxHeight: '200px',
                objectFit: 'contain',
              }}
            />
          </div>
        )}
        {!isImagePreview && hasTableData && (
          <div
            style={{
              overflow: 'auto',
              maxHeight: '140px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: '#fff',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '10px',
                tableLayout: 'fixed',
              }}
            >
              <thead>
                <tr>
                  {headers.map((h) => (
                    <th
                      key={`header-${String(h)}`}
                      style={{
                        padding: '3px 4px',
                        textAlign: 'left',
                        borderBottom: '1px solid #e5e7eb',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {String(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allDataRows.map((row) => (
                  <tr key={`row-${(row as any[]).map(String).join('|')}`}>
                    {(row as any[]).map((cell) => (
                      <td
                        key={`cell-${(row as any[])
                          .map(String)
                          .join('|')}-${String(cell)}`}
                        style={{
                          padding: '2px 4px',
                          borderBottom: '1px solid #f3f4f6',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {cell != null ? String(cell) : ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {isImagePreview && expandOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Document preview full screen"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
          onClick={() => setExpandOpen(false)}
        >
          <img
            src={previewImageUrl!}
            alt={displayName}
            style={{ maxWidth: '95%', maxHeight: '95%', objectFit: 'contain' }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      {!isImagePreview && (
        <DocPreviewFullScreen
          open={expandOpen}
          onClose={() => setExpandOpen(false)}
          title={displayName}
          headers={headers}
          rows={allDataRows}
        />
      )}
    </>
  );
};

/** Phase 1: Extraction summary – "Extraction complete. Found X time entries" + "We found some unrecognized columns" only when Step 2 is showing with unmapped columns */
const ExtractionSummaryBlock: React.FC = () => {
  const dispatch = useAppDispatch();
  const uploadId = useAppSelector(selectUploadId);
  const currentStep = useAppSelector(selectCurrentStep);
  const employeeGrouped = useAppSelector(selectEmployeeGroupedTimeEntries);
  const scannedEntries = useAppSelector(selectScannedEntries);
  const rawExcelData = useAppSelector(selectRawExcelData);
  const mappedColumnMappings = useAppSelector(selectMappedColumnMappings);
  const frozenText = useAppSelector(
    (s: any) => s.progress.extractionSummaryFrozenText,
  );
  const frozenTextUploadId = useAppSelector(
    (s: any) => s.progress.extractionSummaryFrozenTextUploadId,
  );
  const typewriterComplete = useAppSelector(
    (s: any) => s.progress.extractionSummaryTypewriterComplete ?? false,
  );
  const unknownColumns = useAppSelector(selectUnknownColumns);
  const lastDispatchedRef = useRef<{
    uploadId: string;
    fullText: string;
  } | null>(null);

  const flatFromGrouped = Object.values(employeeGrouped || {}).flat();
  const entryCount =
    flatFromGrouped.length > 0
      ? flatFromGrouped.length
      : Math.max(
          scannedEntries.length,
          (rawExcelData?.length ?? 0) > 0 ? (rawExcelData?.length ?? 0) - 1 : 0,
        );

  const unmappedRequiredColumns = REQUIRED_QB_FIELDS.filter((qbField) => {
    const isMapped = Object.values(mappedColumnMappings || {}).some(
      (m) => typeof m === 'string' && m.toLowerCase() === qbField.toLowerCase(),
    );
    return !isMapped;
  });

  // Show "unrecognized columns" when Step 2 is visible AND there are unmapped Excel columns
  // or required QB fields with no mapping
  const hasUnmappedColumns =
    currentStep === 2 &&
    (unmappedRequiredColumns.length > 0 || (unknownColumns?.length ?? 0) > 0);
  const line1 = 'Extraction complete';
  const line2 = hasUnmappedColumns
    ? `Found ${entryCount} time ${
        entryCount === 1 ? 'entry' : 'entries'
      }. We found some unrecognized columns from uploaded document`
    : `Found ${entryCount} time ${entryCount === 1 ? 'entry' : 'entries'}`;

  const fullText = [line1, line2].join('\n');
  // On step 2 with unmapped columns, always show full text (including "unrecognized columns")
  // so it stays visible even when typewriter had already completed with the short version
  let displayText = fullText;
  if (
    currentStep === 2 &&
    hasUnmappedColumns &&
    fullText.includes('unrecognized')
  ) {
    displayText = fullText;
  } else if (frozenText && frozenTextUploadId === uploadId) {
    displayText = frozenText;
  }

  // Reset last-dispatched when uploadId changes (new file)
  React.useEffect(() => {
    lastDispatchedRef.current = null;
  }, [uploadId]);

  // Only dispatch when fullText actually changes – prevents infinite loop from repeated dispatches.
  // Once the typewriter has completed for this uploadId, do NOT overwrite frozen text when fullText
  // changes (e.g. when step changes from 2 to 3 and "unrecognized columns" is dropped from line2).
  // Otherwise TypewriterText would get a new text prop and restart typing.
  React.useEffect(() => {
    const alreadyCompleteForUpload =
      typewriterComplete && frozenTextUploadId === uploadId;
    if (alreadyCompleteForUpload) return;

    const alreadyDispatched =
      lastDispatchedRef.current?.uploadId === uploadId &&
      lastDispatchedRef.current?.fullText === fullText;
    if (alreadyDispatched) return;
    if (
      !frozenText ||
      frozenTextUploadId !== uploadId ||
      frozenText !== fullText
    ) {
      lastDispatchedRef.current = { uploadId, fullText };
      dispatch(setExtractionSummaryFrozenText({ text: fullText, uploadId }));
    }
  }, [
    uploadId,
    fullText,
    frozenText,
    frozenTextUploadId,
    typewriterComplete,
    dispatch,
  ]);

  if (!uploadId) return null;

  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        marginBottom: '16px',
      }}
    >
      <TypewriterText
        text={displayText}
        speed={30}
        cursor
        onComplete={() =>
          dispatch(setExtractionSummaryTypewriterComplete(true))
        }
        as={B2}
        wrapperProps={{
          style: { whiteSpace: 'pre-line', color: '#374151' },
        }}
      />
    </div>
  );
};

/** Count only entries that are still unmapped (no mappedId). Already-mapped values are not shown in Step 3 or in this message. */
const countUnmapped = (
  rec: Record<string, { mappedId?: string }> | undefined,
) =>
  Object.values(rec || {}).filter(
    (v) => !v?.mappedId || String(v.mappedId).trim() === '',
  ).length;

/** Phase 2: "Thanks, we found some unrecognized values for service item, etc. affecting X time entries." – only for values still unmapped (no mappedId) */
const Phase2ThanksBlock: React.FC = () => {
  const fieldMappingsState = useAppSelector(selectFieldMappingsState);

  const uc = countUnmapped(fieldMappingsState?.unmatchedClasses);
  const us = countUnmapped(fieldMappingsState?.unmatchedServices);
  const ul = countUnmapped(fieldMappingsState?.unmatchedLocations);
  const ucust = countUnmapped(fieldMappingsState?.unmatchedCustomers);
  const ue = countUnmapped(fieldMappingsState?.unmatchedEmployees);
  const unmatchedCf =
    fieldMappingsState?.unmatchedCustomFieldDropdownValues || {};
  const ucf = Object.values(unmatchedCf).filter(
    (v: { mappedId?: string }) =>
      !v?.mappedId || String(v.mappedId).trim() === '',
  ).length;

  const fieldLabels: string[] = [];
  if (us > 0) fieldLabels.push('service item');
  if (uc > 0) fieldLabels.push('class');
  if (ul > 0) fieldLabels.push('location');
  if (ucust > 0) fieldLabels.push('customer');
  if (ue > 0) fieldLabels.push('employee');
  if (ucf > 0) fieldLabels.push('custom field');

  // Affected count: only from entries that are still unmapped
  const allUnmatched = [
    ...Object.values(fieldMappingsState?.unmatchedServices || {}).filter(
      (f: { mappedId?: string }) =>
        !f?.mappedId || String(f.mappedId).trim() === '',
    ),
    ...Object.values(fieldMappingsState?.unmatchedClasses || {}).filter(
      (f: { mappedId?: string }) =>
        !f?.mappedId || String(f.mappedId).trim() === '',
    ),
    ...Object.values(fieldMappingsState?.unmatchedLocations || {}).filter(
      (f: { mappedId?: string }) =>
        !f?.mappedId || String(f.mappedId).trim() === '',
    ),
    ...Object.values(fieldMappingsState?.unmatchedCustomers || {}).filter(
      (f: { mappedId?: string }) =>
        !f?.mappedId || String(f.mappedId).trim() === '',
    ),
    ...Object.values(fieldMappingsState?.unmatchedEmployees || {}).filter(
      (f: { mappedId?: string }) =>
        !f?.mappedId || String(f.mappedId).trim() === '',
    ),
    ...Object.values(unmatchedCf).filter(
      (f: { mappedId?: string }) =>
        !f?.mappedId || String(f.mappedId).trim() === '',
    ),
  ];
  const affectedIds = new Set<string>();
  allUnmatched.forEach((f: { affectedEntryIds?: string[] }) => {
    (f?.affectedEntryIds || []).forEach((id: string) => affectedIds.add(id));
  });
  const affectedCount = affectedIds.size;

  if (fieldLabels.length === 0) return null;

  const fieldList = fieldLabels.join(', ');
  const text = `Thanks, we found some unrecognized values for ${fieldList} affecting ${affectedCount} time ${
    affectedCount === 1 ? 'entry' : 'entries'
  }.`;

  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        marginBottom: '16px',
      }}
    >
      <B2 style={{ whiteSpace: 'pre-line', color: '#374151' }}>{text}</B2>
    </div>
  );
};

export interface ChatStyleFlowProps {
  sandbox?: any;
  currentStep: number;
  isUploading: boolean;
  isLoading: boolean;
  hasError: string | null;
  /** When true, show "Extracting" in the right panel instead of loaders (split-view chat style). */
  isExtracting?: boolean;
  isGlobalProcessing?: boolean;
  onScanUploadSuccess: (fileId: string) => void;
  onMappingSubmit: () => void;
}

/** Triggers processExcelData + extractUnmappedFields when we land on step 3; applies saved Step 3 value mappings so we can skip step 3 when all match */
const Step3DataLoader: React.FC<{ sandbox?: any }> = ({ sandbox }) => {
  const dispatch = useAppDispatch();
  useStep2Processing();
  const uploadId = useAppSelector(selectUploadId);
  const employeeGroupedTimeEntries = useAppSelector(
    selectEmployeeGroupedTimeEntries,
  );
  const { extractUnmappedFields } = useExtractUnmappedFields();
  const aiPrefs = useAIImportPreferences(sandbox || ({} as any));
  const hasRunExtractionRef = useRef(false);
  const prevUploadIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (uploadId !== prevUploadIdRef.current) {
      prevUploadIdRef.current = uploadId;
      hasRunExtractionRef.current = false;
    }
  }, [uploadId]);

  useEffect(() => {
    const hasData =
      employeeGroupedTimeEntries &&
      Object.keys(employeeGroupedTimeEntries).length > 0;
    if (hasData && !hasRunExtractionRef.current) {
      hasRunExtractionRef.current = true;
      extractUnmappedFields().then(async () => {
        // Apply saved Step 3 value mappings from AI preferences so we can skip Step 3 when all values were previously mapped
        if (sandbox && aiPrefs.getStep3ValueMappings) {
          try {
            const saved = await aiPrefs.getStep3ValueMappings();
            const state = store.getState().fieldMappings;
            if (saved.services)
              Object.entries(saved.services).forEach(
                ([key, { mappedId, mappedName }]) => {
                  if (state.unmatchedServices?.[key] && mappedId && mappedName)
                    dispatch(
                      mapServiceField({ value: key, mappedId, mappedName }),
                    );
                },
              );
            if (saved.customers)
              Object.entries(saved.customers).forEach(
                ([key, { mappedId, mappedName }]) => {
                  if (state.unmatchedCustomers?.[key] && mappedId && mappedName)
                    dispatch(
                      mapCustomerField({ value: key, mappedId, mappedName }),
                    );
                },
              );
            if (saved.employees)
              Object.entries(saved.employees).forEach(
                ([key, { mappedId, mappedName }]) => {
                  if (state.unmatchedEmployees?.[key] && mappedId && mappedName)
                    dispatch(
                      mapEmployeeField({ value: key, mappedId, mappedName }),
                    );
                },
              );
            if (saved.classes)
              Object.entries(saved.classes).forEach(
                ([key, { mappedId, mappedName }]) => {
                  if (state.unmatchedClasses?.[key] && mappedId && mappedName)
                    dispatch(
                      mapClassField({ value: key, mappedId, mappedName }),
                    );
                },
              );
            if (saved.locations)
              Object.entries(saved.locations).forEach(
                ([key, { mappedId, mappedName }]) => {
                  if (state.unmatchedLocations?.[key] && mappedId && mappedName)
                    dispatch(
                      mapLocationField({ value: key, mappedId, mappedName }),
                    );
                },
              );
            if (saved.customFieldDropdownValues)
              Object.entries(saved.customFieldDropdownValues).forEach(
                ([key, { mappedId, mappedName }]) => {
                  if (
                    state.unmatchedCustomFieldDropdownValues?.[key] &&
                    mappedId &&
                    mappedName
                  ) {
                    const colonIdx = key.indexOf(':');
                    const fieldName =
                      colonIdx >= 0 ? key.slice(0, colonIdx) : '';
                    const value = colonIdx >= 0 ? key.slice(colonIdx + 1) : key;
                    if (fieldName)
                      dispatch(
                        mapCustomFieldDropdownValue({
                          fieldName,
                          value,
                          mappedId,
                          mappedName,
                        }),
                      );
                  }
                },
              );
          } catch {
            // ignore
          }
        }
        dispatch(setStep3ExtractionComplete(true));
      });
    }
  }, [
    employeeGroupedTimeEntries,
    extractUnmappedFields,
    dispatch,
    sandbox,
    aiPrefs.getStep3ValueMappings,
  ]);
  return null;
};

/** Chat-style vertical flow: upload → preview → extraction summary → step 2 compact → step 3 compact → step 4. Same Redux and processing; scroll to next on Continue. */
const ChatStyleFlow: React.FC<ChatStyleFlowProps> = ({
  sandbox,
  currentStep,
  isUploading,
  isLoading,
  hasError,
  isExtracting = false,
  isGlobalProcessing = false,
  onScanUploadSuccess,
  onMappingSubmit,
}) => {
  const isProcessing = isExtracting || isGlobalProcessing;

  // Mount Step3DataLoader when we might need step 3 data – triggers processExcelData
  const showStep3Loader = currentStep >= 3;
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const uploadId = useAppSelector(selectUploadId);
  const typewriterComplete = useAppSelector(
    (s: any) => s.progress.extractionSummaryTypewriterComplete ?? false,
  );
  const step3ExtractionComplete = useAppSelector(
    (s: any) => s.progress.step3ExtractionComplete ?? false,
  );
  const prevUploadIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Only reset when uploadId changes to a different value (new file) – not on initial mount
    // On initial mount prevUploadIdRef is null; resetting would clear step3ExtractionComplete
    // and cause Step 3 to vanish after it appears
    if (
      prevUploadIdRef.current !== null &&
      prevUploadIdRef.current !== uploadId
    ) {
      dispatch(setExtractionSummaryTypewriterComplete(false));
      dispatch(setPhase2TypewriterComplete(false));
      dispatch(setStep3ExtractionComplete(false));
    }
    prevUploadIdRef.current = uploadId;
  }, [uploadId, dispatch]);

  const hasCompletedMappingContinue = useAppSelector(
    (s: any) => s.progress.hasCompletedMappingContinue ?? false,
  );
  const hasClickedStep3Continue = useAppSelector(
    (s: any) => s.progress.hasClickedStep3Continue ?? false,
  );
  const completedSteps = useAppSelector(
    (s: any) => s.progress.completedSteps ?? [],
  );
  const step2Completed = completedSteps.includes(2);
  const fieldMappingsState = useAppSelector(selectFieldMappingsState);

  // Step 3 has unmapped only when there are values that are still unmapped (no mappedId). Once user maps them, don't show "Thanks, we found..."
  const hasUnmappedInStep3 = useMemo(() => {
    const countUnmapped = (
      rec: Record<string, { mappedId?: string }> | undefined,
    ) =>
      Object.values(rec || {}).filter(
        (v) => !v?.mappedId || String(v.mappedId).trim() === '',
      ).length;
    const uc = countUnmapped(fieldMappingsState?.unmatchedClasses);
    const us = countUnmapped(fieldMappingsState?.unmatchedServices);
    const ul = countUnmapped(fieldMappingsState?.unmatchedLocations);
    const ucust = countUnmapped(fieldMappingsState?.unmatchedCustomers);
    const ue = countUnmapped(fieldMappingsState?.unmatchedEmployees);
    const unmatchedCf =
      fieldMappingsState?.unmatchedCustomFieldDropdownValues || {};
    const ucf = Object.values(unmatchedCf).filter(
      (v: { mappedId?: string }) =>
        !v?.mappedId || String(v.mappedId).trim() === '',
    ).length;
    return us > 0 || uc > 0 || ul > 0 || ucust > 0 || ue > 0 || ucf > 0;
  }, [fieldMappingsState]);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  useEffect(() => {
    if (currentStep < 2) return undefined;
    const t = setTimeout(scrollToBottom, 150);
    return () => clearTimeout(t);
  }, [currentStep, scrollToBottom]);

  // Scroll to bottom when Step 2 done (Skip/Continue) – Phase 2 message appears
  useEffect(() => {
    if (step2Completed && currentStep >= 3) {
      const t = setTimeout(scrollToBottom, 200);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [step2Completed, currentStep, scrollToBottom]);

  // Scroll to bottom when Step 3 / Phase 2 "Thanks, we found..." message appear (after extraction summary typewriter completes)
  useEffect(() => {
    if (
      step3ExtractionComplete &&
      step2Completed &&
      currentStep >= 3 &&
      typewriterComplete
    ) {
      // Slightly longer delay when Phase 2 thanks block is shown so it's in the DOM before scrolling
      const delay = 350;
      const t = setTimeout(scrollToBottom, delay);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [
    step3ExtractionComplete,
    step2Completed,
    currentStep,
    typewriterComplete,
    scrollToBottom,
  ]);

  // Scroll to bottom when mapping complete appears (step 5)
  useEffect(() => {
    if (currentStep >= 5 && hasCompletedMappingContinue) {
      const t = setTimeout(scrollToBottom, 200);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [currentStep, hasCompletedMappingContinue, scrollToBottom]);

  const handleStep2Continue = useCallback(() => {
    onMappingSubmit();
    setTimeout(scrollToBottom, 120);
  }, [onMappingSubmit, scrollToBottom]);

  return (
    <div
      ref={containerRef}
      data-view="chat-style-flow"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        padding: '0 0 40px 0',
        overflowY: 'auto',
        height: '100%',
      }}
    >
      {showStep3Loader && <Step3DataLoader sandbox={sandbox} />}

      {/* Section 1: Upload or "Extracting" or doc preview */}
      <div>
        {currentStep === 1 && (
          <>
            {/* Keep Step1Upload mounted during extraction so HOCWidget stays alive for Converse API */}
            <div style={{ display: isProcessing ? 'none' : undefined }}>
              <Step1Upload
                isUploading={isUploading}
                isLoading={isLoading}
                hasError={hasError}
                sandbox={sandbox}
                onScanUploadSuccess={onScanUploadSuccess}
                uploadOnly
              />
            </div>
            {isProcessing && (
              <div
                style={{ padding: '24px', color: '#64748b', fontSize: '14px' }}
              >
                <TypewriterText text="Extracting…" speed={40} cursor />
              </div>
            )}
          </>
        )}
        {currentStep === 1.5 && (
          <>
            <div
              style={{ padding: '24px', color: '#64748b', fontSize: '14px' }}
            >
              <TypewriterText text="Extracting…" speed={40} cursor />
            </div>
            <ProcessingStep sandbox={sandbox} hideOverlay />
          </>
        )}
        {currentStep >= 2 && <DocPreviewBlock />}
      </div>

      {/* Section 2: Extraction summary (typed) – Step 2/3 only after typewriter completes */}
      {currentStep >= 2 && (
        <div>
          <ExtractionSummaryBlock />
        </div>
      )}

      {/* Section 3: Step 2 – only when on step 2 (skip when all mapped, go directly to step 3) */}
      {currentStep === 2 && typewriterComplete && (
        <div>
          <Step2Mapping
            onMappingSubmit={handleStep2Continue}
            sandbox={sandbox}
            hideStepProgress
            hideTitle
            skipReviewModal
            compactView
            readOnly={step2Completed}
            onSkip={handleStep2Continue}
          />
        </div>
      )}

      {/* Section 4: Processing message when waiting for Step 3 data after Skip/Continue */}
      {currentStep >= 3 && step2Completed && !step3ExtractionComplete && (
        <div
          style={{
            padding: '16px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
          }}
        >
          <B2 style={{ color: '#64748b' }}>
            Checking for unrecognized values…
          </B2>
        </div>
      )}

      {/* Section 5: Phase 2 thanks message – only after "Extraction complete. Found X time entries" has finished typing */}
      {currentStep >= 3 &&
        step2Completed &&
        step3ExtractionComplete &&
        typewriterComplete &&
        hasUnmappedInStep3 && <Phase2ThanksBlock />}

      {/* Section 6: Step 3 – show only after extraction summary typewriter has completed so message order is correct */}
      {currentStep >= 3 &&
        step2Completed &&
        step3ExtractionComplete &&
        typewriterComplete && (
          <div>
            <Step3FieldMapping
              sandbox={sandbox}
              hideStepProgress
              hideTitle
              compactView
              readOnly={currentStep >= 5 && hasCompletedMappingContinue}
              showSkipButton
            />
          </div>
        )}

      {/* Section 7: Mapping complete – only when user actually clicked Continue in Step 3 (not when Step 2 or 3 was skipped) */}
      {currentStep >= 5 && hasClickedStep3Continue && (
        <div
          style={{
            padding: '16px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            marginBottom: '16px',
          }}
        >
          <TypewriterText
            text="Mapping complete, please review and save time entries."
            speed={30}
            cursor
            as={B2}
            wrapperProps={{
              style: { color: '#374151' },
            }}
          />
        </div>
      )}

      <div ref={bottomRef} style={{ height: 1 }} aria-hidden />
    </div>
  );
};

export default ChatStyleFlow;

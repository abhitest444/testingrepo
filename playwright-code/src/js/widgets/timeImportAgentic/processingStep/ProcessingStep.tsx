import React, { useEffect, useRef } from 'react';
import { Sandbox } from 'src/js/common/sandbox';
import { useAppDispatch, useAppSelector } from '../store';
import {
  setCurrentStep,
  setAllFieldsMappedOnLoad,
  markStepCompleted,
} from '../store/progressSlice';
import {
  updateMappedColumnMapping,
  updateMappedColumnCheckbox,
} from '../store/excelDataSlice';
import {
  selectExcelColumns,
  selectUploadId,
  selectAIColumnMappings,
  selectScannedEntries,
} from '../store/selectors';
import LoadingOverlay from '../components/LoadingOverlay';
import { useAIImportPreferences } from '../hooks/useAIImportPreferences';

/** Converse API recognized field names → QB Time field mapping */
const CONVERSE_API_FIELD_TO_QB: Record<string, string> = {
  name: 'employee',
  date: 'date',
  timeIn: 'start time',
  timeOut: 'end time',
  hours: 'hours',
  class: 'class',
  customer: 'customer',
  service: 'service item',
  billable: 'billable',
  notes: 'notes',
  location: 'location',
};

interface ProcessingStepProps {
  sandbox?: Sandbox;
  /** When true, do not render the loading overlay (e.g. split-view chat flow shows its own "Extracting…" text). */
  hideOverlay?: boolean;
}

/**
 * Hidden processing step that performs auto-mapping and determines
 * whether to show a modal in Step 2 (Field Mapping).
 * This step is not visible to users - just shows a loader.
 */
export const ProcessingStep: React.FC<ProcessingStepProps> = ({
  sandbox,
  hideOverlay = false,
}) => {
  const dispatch = useAppDispatch();
  const excelColumns = useAppSelector(selectExcelColumns);
  const uploadId = useAppSelector(selectUploadId);
  const scannedEntries = useAppSelector(selectScannedEntries);
  const companySettings = useAppSelector(
    (state: any) => state.companySettings.settings,
  );

  // Read AI Import preferences from Redux (auto-loaded by hook)
  const aiColumnMappings = useAppSelector(selectAIColumnMappings);

  // Initialize hook to auto-load preferences into Redux
  const aiPrefs = useAIImportPreferences(sandbox || ({} as Sandbox));
  const aiPrefsRef = useRef(aiPrefs);
  aiPrefsRef.current = aiPrefs;

  const hasProcessedRef = useRef(false);
  const prevUploadIdRef = useRef<string>('');

  // Reset hasProcessedRef when uploadId changes (new file uploaded)
  useEffect(() => {
    if (uploadId && uploadId !== prevUploadIdRef.current) {
      hasProcessedRef.current = false;
      prevUploadIdRef.current = uploadId;
    }
  }, [uploadId]);

  // Column mapping does not need employee data – only excelColumns and scannedEntries
  useEffect(() => {
    if (hasProcessedRef.current || excelColumns.length === 0) {
      return;
    }

    hasProcessedRef.current = true;

    const processAndNavigate = async () => {
      try {
        const filteredColumns = excelColumns.filter(
          (col) => col !== null && col !== undefined && col !== '',
        );
        const excelColumnsSet = new Set<string>(filteredColumns);

        // Step 1: Converse API mappings (columns the API recognized as direct fields)
        const apiMappings: Record<string, string> = {};
        const firstEntry = scannedEntries?.[0];
        if (firstEntry && typeof firstEntry === 'object') {
          Object.keys(firstEntry).forEach((key) => {
            if (
              key !== 'unknown' &&
              key !== 'unknown_fields' &&
              excelColumnsSet.has(key) &&
              CONVERSE_API_FIELD_TO_QB[key]
            ) {
              apiMappings[key] = CONVERSE_API_FIELD_TO_QB[key];
            }
          });
        }

        // Step 2: Auto-map using fuzzy matching for columns NOT mapped by API
        const { autoMapAllFields } = await import(
          '../utils/fuzzyColumnMatcher'
        );
        const autoMappings = autoMapAllFields(filteredColumns);

        // Build final mappings: API first, then auto for unmapped, then saved prefs for still unmapped
        const finalMappings: Record<string, string> = {};

        // 1) Apply API mappings
        Object.assign(finalMappings, apiMappings);

        // 2) Apply auto-mappings for columns not yet mapped by API
        Object.entries(autoMappings).forEach(([excelColumn, qbField]) => {
          if (finalMappings[excelColumn] === undefined) {
            finalMappings[excelColumn] = qbField;
          }
        });

        // 3) Apply saved UX preferences ONLY for columns not mapped by API or auto
        if (aiColumnMappings && Object.keys(aiColumnMappings).length > 0) {
          Object.entries(aiColumnMappings).forEach(([excelColumn, qbField]) => {
            if (!excelColumnsSet.has(excelColumn)) return;
            if (finalMappings[excelColumn] === undefined) {
              finalMappings[excelColumn] = qbField;
            }
          });
        }

        // Apply all mappings to Redux at once
        Object.entries(finalMappings).forEach(([excelColumn, qbField]) => {
          dispatch(
            updateMappedColumnMapping({
              column: excelColumn,
              mapping: qbField,
            }),
          );
          // Also check the checkbox for this mapped column
          dispatch(
            updateMappedColumnCheckbox({
              column: excelColumn,
              checked: true,
            }),
          );
        });

        // Step 3: Auto-skip Step 2 only when ALL Excel columns are mapped (user Skip is always allowed)
        const requiredQBFields = ['employee', 'date', 'hours'];
        if (companySettings?.serviceItemRequired) {
          requiredQBFields.push('service item');
        }
        if (companySettings?.classRequired) {
          requiredQBFields.push('class');
        }
        if (companySettings?.locationRequired) {
          requiredQBFields.push('location');
        }

        const allRequiredFieldsMapped = requiredQBFields.every(
          (requiredField) =>
            Object.values(finalMappings).some(
              (mapping) =>
                mapping &&
                mapping.toLowerCase() === requiredField.toLowerCase(),
            ),
        );
        dispatch(setAllFieldsMappedOnLoad(allRequiredFieldsMapped));

        // Only auto-skip when every Excel column has a QB mapping (user can still Skip in Step 2)
        const allColumnsMapped = filteredColumns.every(
          (col) =>
            finalMappings[col] &&
            typeof finalMappings[col] === 'string' &&
            finalMappings[col].trim() !== '',
        );

        if (allColumnsMapped) {
          // Skip Step 2 – all required fields mapped, go directly to Step 3
          aiPrefsRef.current?.saveColumnMappings(finalMappings);
          dispatch(markStepCompleted(2));
          // Do NOT set extractionSummaryTypewriterComplete here – let "Extraction complete. Found X time entries" typewriter finish first, then Phase2ThanksBlock / Step 3 will show
          dispatch(setCurrentStep(3));
        } else {
          // Go to Step 2 – user must confirm mapping
          dispatch(setCurrentStep(2));
        }
      } catch (error) {
        // If auto-mapping fails, still move to Step 2 to let user manually map
        dispatch(setAllFieldsMappedOnLoad(false));
        dispatch(setCurrentStep(2));
      }
    };

    processAndNavigate();
  }, [
    excelColumns,
    scannedEntries,
    aiColumnMappings,
    companySettings,
    dispatch,
  ]);

  if (hideOverlay) {
    return null;
  }
  return (
    <LoadingOverlay
      isLoading
      primaryText="Analyzing your file"
      secondaryText="Mapping fields to QuickBooks..."
    />
  );
};

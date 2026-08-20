import React, {
  useCallback,
  useEffect,
  useState,
  useMemo,
  KeyboardEvent,
  MouseEvent,
  ReactElement,
  useRef,
} from 'react';
import { H4, B2, B3 } from '@ids-ts/typography';
import Button from '@ids-ts/button';
import Badge from '@ids-ts/badge';
import Dropdown, { MenuItem } from '@ids-ts/dropdown';
import Link from '@ids-ts/link';
import Checkbox from '@ids-ts/checkbox';
import { Table } from '@ids-ts/table';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalContent,
  ModalActions,
} from '@ids-ts/modal-dialog';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import Widget from 'web-shell-core/widgets/HOCWidget';
import dayjs from 'dayjs';
import { WORKFLOWS } from 'src/js/common/constants';
import { Sandbox } from 'src/js/common/sandbox';
import { useAppSelector, RootState } from '../store';
import { useCustomFieldsData } from '../hooks/useCustomFieldsData';
import { StepContainer } from '../base.styles';
import StepProgressCard from '../components/StepProgressCard';
import AIBanner, { BannerText } from '../components/AIBanner';
import BackButton from '../components/BackButton';
import {
  setGlobalProcessing,
  clearGlobalProcessing,
  markStepCompleted,
  setMappingContinueClicked,
  setExtractionSummaryTypewriterComplete,
} from '../store/progressSlice';
import {
  updateMappedColumnMapping,
  updateMappedColumnCheckbox,
} from '../store/excelDataSlice';
import {
  selectExcelColumns,
  selectMappedColumns,
  selectMappedColumnMappings,
  selectUnknownColumns,
  selectUnknownMappings,
  selectRawExcelData,
  selectUploadId,
  selectAISkipFieldMapping,
} from '../store/selectors';
import { useProcessMappingToReviewEntries } from '../hooks/useProcessMappingToReviewEntries';
import { updateUxPreference } from '../store/uxPreferencesSlice';
import { useAIImportPreferences } from '../hooks/useAIImportPreferences';

/**
 * Convert Excel serial date number to formatted date string
 */
const convertExcelSerialDate = (serial: any): string => {
  if (typeof serial !== 'number' || Number.isNaN(serial)) {
    return String(serial || '');
  }

  const excelEpoch = dayjs('1900-01-01');
  const daysOffset = serial > 59 ? serial - 2 : serial - 1;
  const date = excelEpoch.add(daysOffset, 'day');
  return date.format('M/D/YYYY');
};

/**
 * Convert Excel serial time to readable time string
 */
const convertExcelSerialTime = (serial: any): string => {
  if (typeof serial !== 'number' || Number.isNaN(serial)) {
    return String(serial || '');
  }

  const totalMinutes = Math.round(serial * 24 * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

interface Step2MappingProps {
  onMappingSubmit: () => void;
  sandbox?: Sandbox;
  /** When true, hide the step progress card (e.g. in split-screen view). */
  hideStepProgress?: boolean;
  /** When true, hide title and subtitle (e.g. in split-screen view). */
  hideTitle?: boolean;
  /** When true, do not show the "All required fields mapped" review modal; skip when all required are mapped (e.g. chat-style/split view). */
  skipReviewModal?: boolean;
  /** When true, render only unmapped required fields as [QB field] [Imported column dropdown] list (e.g. chat-style view). */
  compactView?: boolean;
  /** When true, disable dropdowns and buttons (e.g. after skip/continue). */
  readOnly?: boolean;
  /** Called when user clicks Skip – continues with unmapped as null. */
  onSkip?: () => void;
  /** When true (e.g. chat flow), never auto-advance – user must click Continue or Skip. */
  disableAutoAdvance?: boolean;
}

interface FieldMapping {
  importedField: string;
  sampleData: string;
  matchToField: string;
  isRequired: boolean;
  hasError: boolean;
  isSelected: boolean;
}

// Base required QB fields (always required)
const BASE_REQUIRED_FIELDS = ['employee', 'date', 'hours'];

// QB fields we always show dropdowns for when unmapped (column mapping step)
// Even if not required by company settings, users expect to map these
const ALWAYS_SHOW_WHEN_UNMAPPED = [
  'service item',
  'class',
  'location',
  'customer',
];

// Sample data generator - gets sample data from Excel by column name
const getSampleDataByColumnName = (
  columnName: string,
  rawData: any[][] = [],
  mappedField?: string,
): string => {
  if (!columnName || rawData.length < 2) return '--';

  // Find the column index in the Excel headers
  const headers = rawData[0] as string[];
  const columnIndex = headers.findIndex(
    (h) => h && typeof h === 'string' && h === columnName,
  );

  if (columnIndex >= 0) {
    // Look for first non-null, non-empty value in this column (skip header row and potential group rows)
    for (let i = 1; i < rawData.length; i += 1) {
      const value = rawData[i]?.[columnIndex];
      if (value !== null && value !== undefined && value !== '') {
        // Convert Excel serial numbers based on field type
        let processedValue = value;
        const lowerColumnName = columnName.toLowerCase();

        // Check if this is a date field
        if (mappedField === 'date' || lowerColumnName.includes('date')) {
          processedValue = convertExcelSerialDate(value);
        }
        // Check if this is a time field
        else if (lowerColumnName.includes('time')) {
          processedValue = convertExcelSerialTime(value);
        }

        // Format the value
        let formattedValue = String(processedValue).trim();

        // Truncate if too long
        if (formattedValue.length > 20) {
          formattedValue = `${formattedValue.substring(0, 17)}...`;
        }

        return formattedValue;
      }
    }
  }

  return '--';
};

const Step2Mapping: React.FC<Step2MappingProps> = ({
  onMappingSubmit,
  sandbox,
  hideStepProgress = false,
  hideTitle = false,
  skipReviewModal = false,
  compactView = false,
  readOnly = false,
  onSkip,
}) => {
  const dispatch = useDispatch();

  // Fetch custom fields
  const { customFields } = useCustomFieldsData();

  // Redux state
  const excelColumns = useSelector(selectExcelColumns);
  const mappedColumns = useSelector(selectMappedColumns);
  const mappedColumnMappings = useSelector(selectMappedColumnMappings);
  const unknownColumns = useSelector(selectUnknownColumns);
  const unknownMappings = useSelector(selectUnknownMappings);
  const rawExcelData = useSelector(selectRawExcelData);
  const companySettings = useSelector(
    (state: RootState) => state.companySettings.settings,
  );

  // Read AI skip field mapping from Redux (auto-loaded from sandbox storage)
  const aiSkipFieldMapping = useSelector(selectAISkipFieldMapping);

  // Initialize AI preferences hook (for SAVING only)
  // Always call hooks unconditionally - React hooks rules
  // Use a dummy sandbox if not provided (the hook's methods will use optional chaining anyway)
  const aiPrefs = useAIImportPreferences(sandbox || ({} as Sandbox));
  const { processMappingToReviewEntries } = useProcessMappingToReviewEntries();

  // State for custom fields modal
  const [showCustomFieldsModal, setShowCustomFieldsModal] = useState(false);

  // State for field selection (checkboxes)
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());

  // Refs
  const hasInitializedSelectedFieldsRef = useRef(false);
  const lastSelectedFieldsCountRef = useRef(0);
  const prevUploadIdRef = useRef<string>('');

  // Track if user clicked Continue in modal (to trigger processing after modal closes)
  const shouldProcessAfterModalCloseRef = useRef(false);
  // When compact view and step skipped (no unmapped required), auto-advance once
  const hasAutoAdvancedStep2Ref = useRef(false);

  // Get uploadId from Redux
  const uploadId = useAppSelector(selectUploadId);

  // Reset refs when uploadId changes (new file uploaded)
  useEffect(() => {
    if (uploadId && uploadId !== prevUploadIdRef.current) {
      hasInitializedSelectedFieldsRef.current = false;
      lastSelectedFieldsCountRef.current = 0;
      shouldProcessAfterModalCloseRef.current = false;
      hasAutoAdvancedStep2Ref.current = false;
      prevUploadIdRef.current = uploadId;
    }
  }, [uploadId]);

  // Read the flag from Redux to determine if modal should show on load
  const allFieldsMappedOnLoad = useAppSelector(
    (state: RootState) => state.progress.allFieldsMappedOnLoad,
  );

  // State for "all required fields mapped" confirmation modal - only show if auto-mapped on load
  const [showAllMappedModal, setShowAllMappedModal] = useState(false);

  // State for "Don't show me again" checkbox
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // All QB time fields (including custom fields from data)
  const qbTimeFields = useMemo(() => {
    const baseFields = [
      'employee',
      'date',
      'hours',
      'start time',
      'end time',
      'project',
      'customer',
      'class',
      'location',
      'mileage',
      'billable',
      'notes',
      'service item',
      'cost rate',
      'bill rate',
    ];

    // Add custom field names to the list
    const customFieldNames = (customFields || []).map((field) => field.name);

    return [...baseFields, ...customFieldNames];
  }, [customFields]);

  // Determine which fields are required (block Continue if unmapped)
  const requiredFields = useMemo(() => {
    const required = [...BASE_REQUIRED_FIELDS];

    // Add company settings based required fields
    if (companySettings?.serviceItemRequired) {
      required.push('service item');
    }
    if (companySettings?.classRequired) {
      required.push('class');
    }
    if (companySettings?.locationRequired) {
      required.push('location');
    }
    if (companySettings?.timeSheetEntryMakesNotesRequiredEnabled) {
      required.push('notes');
    }
    if (companySettings?.requireBillable) {
      required.push('billable');
    }

    // Add required custom fields
    const requiredCustomFields = (customFields || [])
      .filter((field) => field.required)
      .map((field) => field.name);
    required.push(...requiredCustomFields);

    return required;
  }, [companySettings, customFields]);

  // Fields to always show dropdowns for when unmapped (even if not required)
  // Exclude class/location when not required – avoids "no value to map" when data has no such columns
  const fieldsToShowWhenUnmapped = useMemo(() => {
    const set = new Set(requiredFields);
    ALWAYS_SHOW_WHEN_UNMAPPED.forEach((f) => {
      if (f === 'class' && !companySettings?.classRequired) return;
      if (f === 'location' && !companySettings?.locationRequired) return;
      set.add(f);
    });
    return Array.from(set);
  }, [
    requiredFields,
    companySettings?.classRequired,
    companySettings?.locationRequired,
  ]);

  // Combine all columns (mapped + unknown), filtering out null/undefined values
  const allColumns = useMemo(
    () =>
      excelColumns.filter(
        (col) => col !== null && col !== undefined && col !== '',
      ),
    [excelColumns],
  );

  // Create field mappings for the table
  const fieldMappings = useMemo((): FieldMapping[] => {
    const mappings: FieldMapping[] = [];
    const essentialQBFields = ['employee', 'date', 'hours'];

    // Add all existing columns from the imported file
    allColumns.forEach((column) => {
      const mapping =
        mappedColumnMappings[column] || unknownMappings[column] || '';
      const isRequired =
        typeof mapping === 'string' &&
        requiredFields.includes(mapping.toLowerCase());
      const hasError = false; // No error for already imported columns

      // Essential fields must always be selected
      const isEssentialField = essentialQBFields.includes(mapping);
      const isSelected = isEssentialField || selectedFields.has(column);

      mappings.push({
        importedField: column, // This is the Excel column name (read-only)
        sampleData: getSampleDataByColumnName(column, rawExcelData, mapping),
        matchToField: mapping, // This is the QB field (editable via dropdown)
        isRequired,
        hasError,
        isSelected,
      });
    });

    // Step 2 compact view: only show unmapped Excel columns (no rows for unmapped QB fields
    // like Cost rate, Bill rate, Notes, Service item, Location). So we do NOT add rows for
    // QB fields that have no Excel column mapped.

    // Sort: required fields first, then optional fields
    return mappings.sort((a, b) => {
      if (a.isRequired && !b.isRequired) return -1;
      if (!a.isRequired && b.isRequired) return 1;
      return 0;
    });
  }, [
    allColumns,
    mappedColumnMappings,
    unknownMappings,
    rawExcelData,
    selectedFields,
    requiredFields,
  ]);

  // Calculate matched counts
  const matchedCount = useMemo(
    () => fieldMappings.filter((f) => f.matchToField).length,
    [fieldMappings],
  );

  // Count how many REQUIRED fields are missing
  const requiredMissingCount = useMemo(
    () =>
      // Check each required field
      requiredFields.filter((reqField) => {
        // Check if this required field is mapped to any imported column
        const isMapped = Object.values(mappedColumnMappings).some(
          (mapping) =>
            typeof mapping === 'string' &&
            mapping.toLowerCase() === reqField.toLowerCase(),
        );
        return !isMapped;
      }).length,
    [requiredFields, mappedColumnMappings],
  );

  // Check if all required fields are mapped
  const allRequiredMapped = requiredMissingCount === 0;

  // Check if all required fields are also selected
  const allRequiredSelected = useMemo(
    () =>
      // For each required QB field, check if the column it's mapped to is selected
      requiredFields.every((reqField) => {
        const column = Object.entries(mappedColumnMappings).find(
          ([_, mapping]) =>
            typeof mapping === 'string' &&
            mapping.toLowerCase() === reqField.toLowerCase(),
        )?.[0];
        return column ? selectedFields.has(column) : false;
      }),
    [requiredFields, mappedColumnMappings, selectedFields],
  );

  // Check if all required QB fields are mapped (not all Excel columns, just required QB fields)
  const allRequiredFieldsMapped = useMemo(
    () => requiredMissingCount === 0,
    [requiredMissingCount],
  );

  // Get all currently mapped values to disable them in other dropdowns
  const mappedValues = useMemo(
    () =>
      new Set(
        fieldMappings.map((f) => f.matchToField).filter((v) => v), // Remove empty strings
      ),
    [fieldMappings],
  );

  // Get unmapped imported columns
  const unmappedColumns = useMemo(
    () =>
      allColumns.filter((column) => {
        const mapping = mappedColumnMappings[column];
        return !mapping || mapping === '';
      }),
    [allColumns, mappedColumnMappings],
  );

  // Generate dropdown menu items for unmapped imported fields (for required QB fields)
  const getUnmappedImportedFieldMenuItems = useCallback(() => {
    const items: ReactElement[] = [
      <MenuItem key="placeholder" value="">
        Select imported field
      </MenuItem>,
    ];

    unmappedColumns.forEach((column) => {
      items.push(
        <MenuItem key={column} value={column}>
          {column}
        </MenuItem>,
      );
    });

    return items;
  }, [unmappedColumns]);

  // Generate dropdown menu items for QB field column
  const getQBFieldMenuItems = useCallback(
    (currentFieldValue: string) => {
      const items: ReactElement[] = [
        <MenuItem key="placeholder" value="">
          Choose from QuickBooks fields
        </MenuItem>,
      ];

      qbTimeFields.forEach((qbField) => {
        const isAlreadyMapped =
          mappedValues.has(qbField) && currentFieldValue !== qbField;
        const displayText = qbField.charAt(0).toUpperCase() + qbField.slice(1);
        items.push(
          <MenuItem key={qbField} value={qbField} disabled={isAlreadyMapped}>
            {displayText}
          </MenuItem>,
        );
      });

      return items;
    },
    [qbTimeFields, mappedValues],
  );

  // Handle checkbox change for individual field
  const handleFieldCheckboxChange = useCallback(
    (importedField: string, checked: boolean) => {
      // Update local state
      setSelectedFields((prev) => {
        const newSet = new Set(prev);
        if (checked) {
          newSet.add(importedField);
        } else {
          newSet.delete(importedField);
        }
        return newSet;
      });

      // Update Redux state
      dispatch(
        updateMappedColumnCheckbox({
          column: importedField,
          checked,
        }),
      );
    },
    [dispatch],
  );

  // Handle "Select All" checkbox
  const handleSelectAllChange = useCallback(
    (checked: boolean) => {
      if (checked) {
        // Select all fields
        const allFieldNames = fieldMappings.map((f) => f.importedField);
        setSelectedFields(new Set(allFieldNames));

        // Update Redux for all fields
        allFieldNames.forEach((fieldName) => {
          if (fieldName) {
            dispatch(
              updateMappedColumnCheckbox({
                column: fieldName,
                checked: true,
              }),
            );
          }
        });
      } else {
        // Unselect all fields
        setSelectedFields(new Set());

        // Update Redux for all fields
        fieldMappings.forEach((f) => {
          if (f.importedField) {
            dispatch(
              updateMappedColumnCheckbox({
                column: f.importedField,
                checked: false,
              }),
            );
          }
        });
      }
    },
    [fieldMappings, dispatch],
  );

  // Check if all fields are selected
  const allFieldsSelected = useMemo(
    () =>
      fieldMappings.length > 0 &&
      fieldMappings.every((f) => selectedFields.has(f.importedField)),
    [fieldMappings, selectedFields],
  );

  // Check if some (but not all) fields are selected
  const someFieldsSelected = useMemo(() => {
    const selectedCount = fieldMappings.filter((f) =>
      selectedFields.has(f.importedField),
    ).length;
    return selectedCount > 0 && selectedCount < fieldMappings.length;
  }, [fieldMappings, selectedFields]);

  // Handle mapping change
  const handleMappingChange = useCallback(
    (importedField: string, mappingValue: string) => {
      dispatch(
        updateMappedColumnMapping({
          column: importedField,
          mapping: mappingValue,
        }),
      );

      // Save to UX preferences
      const updatedMappings = {
        ...mappedColumnMappings,
        [importedField]: mappingValue,
      };

      // Save column mappings to USER-scoped sandbox storage (instant, personal)
      aiPrefs?.saveColumnMappings(updatedMappings);

      // Auto-select when a field is mapped
      if (mappingValue) {
        setSelectedFields((prev) => new Set(prev).add(importedField));
        // Sync to Redux
        dispatch(
          updateMappedColumnCheckbox({
            column: importedField,
            checked: true,
          }),
        );
      } else {
        // Deselect when field is unmapped
        setSelectedFields((prev) => {
          const newSet = new Set(prev);
          newSet.delete(importedField);
          return newSet;
        });
        // Sync to Redux
        dispatch(
          updateMappedColumnCheckbox({
            column: importedField,
            checked: false,
          }),
        );
      }
    },
    [dispatch, mappedColumnMappings, aiPrefs],
  );

  // Process and continue to next step (skipValidation = true for Skip button: proceed with unmapped as null)
  const processAndContinue = useCallback(
    async (skipValidation = false) => {
      if (!skipValidation && (!allRequiredMapped || !allRequiredSelected))
        return;

      // In compact view (chat-style split) skip global overlay so step transition is immediate
      if (!compactView) {
        dispatch(
          setGlobalProcessing({
            isProcessing: true,
            message: 'Saving your preferences',
          }),
        );
      }

      try {
        // Save mappings to UX preferences
        // When Skip: preserve all current mappings (don't filter by selectedFields)
        const checkedMappings = skipValidation
          ? { ...mappedColumnMappings }
          : Object.entries(mappedColumnMappings)
              .filter(([column]) => selectedFields.has(column))
              .reduce((acc, [column, qbField]) => {
                acc[column] = qbField;
                return acc;
              }, {} as Record<string, string>);

        // Save checked column mappings to USER-scoped sandbox storage (instant, personal)
        aiPrefs?.saveColumnMappings(checkedMappings);

        // DON'T call processMappingToReviewEntries here!
        // It filters out unmapped employees, which Step 3 needs to detect.
        // Step 3 will extract unmapped values first, then after mapping is done,
        // Step 3's navigation handler will call processMappingToReviewEntries before going to Step 5.

        // Mark Step 2 as completed
        dispatch(markStepCompleted(2));

        // Enable Phase2ThanksBlock/Step 3 when landing on step 3 (extraction summary typewriter may still be running)
        dispatch(setExtractionSummaryTypewriterComplete(true));

        // Move to Step 3 (Field Mapping for unmapped fields)
        onMappingSubmit();
      } catch (error) {
        // Still allow navigation to avoid blocking the user
        onMappingSubmit();
      } finally {
        if (!compactView) {
          dispatch(clearGlobalProcessing());
        }
      }
    },
    [
      allRequiredMapped,
      allRequiredSelected,
      mappedColumnMappings,
      selectedFields,
      aiPrefs,
      dispatch,
      onMappingSubmit,
      compactView,
    ],
  );

  // Compact: show all unmapped – QB fields needing a column OR Excel columns with no QB mapping
  const unmappedForCompact = useMemo(
    () => fieldMappings.filter((f) => !f.importedField || !f.matchToField),
    [fieldMappings],
  );

  // Handle continue button click
  const handleContinue = useCallback(
    (e?: React.MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();
      // When all fields are mapped (nothing to show), allow Continue without checkbox checks
      if (unmappedForCompact.length === 0) {
        dispatch(setMappingContinueClicked(true));
        processAndContinue();
        return;
      }
      // Otherwise require all required fields mapped and selected
      if (!allRequiredMapped || !allRequiredSelected) return;

      dispatch(setMappingContinueClicked(true));
      processAndContinue();
    },
    [
      unmappedForCompact.length,
      allRequiredMapped,
      allRequiredSelected,
      processAndContinue,
      dispatch,
    ],
  );

  // Handle "Review mapping" button in modal
  const handleReviewMapping = useCallback(() => {
    // Don't process when user chooses to review
    shouldProcessAfterModalCloseRef.current = false;
    setShowAllMappedModal(false);
  }, []);

  // Handle "Continue" button in modal
  const handleModalContinue = useCallback(async () => {
    // Save preference if "Don't show again" is checked
    if (dontShowAgain) {
      try {
        // Save to sandbox storage
        aiPrefs?.setSkipFieldMapping(true);
      } catch (error) {
        // Failed to save preference
      }
    }

    // Set flag to trigger processing after modal closes
    shouldProcessAfterModalCloseRef.current = true;
    // Close modal - processing will start via useEffect after modal is closed
    setShowAllMappedModal(false);
  }, [dontShowAgain, aiPrefs]);

  // Initialize selected fields - by default, all mapped fields should be selected
  // Essential fields (employee, date, hours) must ALWAYS be selected
  useEffect(() => {
    // Wait for field mappings to be populated (after auto-mapping completes)
    if (fieldMappings.length === 0) {
      return;
    }

    // Check if we have any mapped fields (not just unmapped required fields)
    const mappedFields = fieldMappings.filter(
      (f) => f.matchToField && f.importedField,
    );

    // Only initialize/update if the count of mapped fields has changed
    if (
      mappedFields.length > 0 &&
      mappedFields.length !== lastSelectedFieldsCountRef.current
    ) {
      lastSelectedFieldsCountRef.current = mappedFields.length;

      const mappedFieldNames = mappedFields.map((f) => f.importedField);
      const newSelectedFields = new Set(mappedFieldNames);

      // Ensure essential fields are always selected
      const essentialQBFields = ['employee', 'date', 'hours'];
      fieldMappings.forEach((field) => {
        if (
          field.importedField &&
          essentialQBFields.includes(field.matchToField)
        ) {
          newSelectedFields.add(field.importedField);
          // Also update Redux to ensure checkbox state is persisted
          dispatch(
            updateMappedColumnCheckbox({
              column: field.importedField,
              checked: true,
            }),
          );
        }
      });

      setSelectedFields(newSelectedFields);
    }
  }, [fieldMappings, dispatch]);

  // Show modal ONLY on initial load when all required fields are auto-mapped (unless skipReviewModal e.g. chat-style view)
  useEffect(() => {
    if (skipReviewModal) return;
    // Read skip field mapping from Redux (auto-loaded from sandbox storage)
    const skipFieldMapping = aiSkipFieldMapping;

    // Only show if:
    // 1. All fields were mapped on load (from Redux flag)
    // 2. All required fields are currently mapped
    // 3. User preferences don't have skip flag set
    if (allFieldsMappedOnLoad && allRequiredFieldsMapped && !skipFieldMapping) {
      setShowAllMappedModal(true);
    }
  }, [
    skipReviewModal,
    allFieldsMappedOnLoad,
    allRequiredFieldsMapped,
    aiSkipFieldMapping,
  ]);

  // Start processing after modal closes (if user clicked Continue)
  useEffect(() => {
    if (!showAllMappedModal && shouldProcessAfterModalCloseRef.current) {
      shouldProcessAfterModalCloseRef.current = false;
      dispatch(setMappingContinueClicked(true));
      processAndContinue();
    }
  }, [showAllMappedModal, processAndContinue, dispatch]);

  // Compact view: never auto-advance – user must click Continue or Skip
  useEffect(() => {
    if (compactView) return; // Never auto-advance in compact/chat flow
    if (unmappedForCompact.length > 0 || hasAutoAdvancedStep2Ref.current)
      return;
    hasAutoAdvancedStep2Ref.current = true;
    processAndContinue();
  }, [compactView, unmappedForCompact.length, processAndContinue]);

  const handleStep2Skip = useCallback(
    (e?: React.MouseEvent) => {
      // Prevent the same click from being delivered to newly mounted Step 3 content
      // (e.g. ClassDropdown "Add new class") when we transition to step 3.
      e?.preventDefault();
      e?.stopPropagation();
      dispatch(setMappingContinueClicked(true));
      processAndContinue(true);
    },
    [dispatch, processAndContinue],
  );

  // Compact view: all unmapped fields as [QB field] [Imported column dropdown]
  if (compactView) {
    const unmappedRequired = unmappedForCompact;
    const stepSkipped = unmappedRequired.length === 0;

    // Columns already mapped to a QB field (exclude from other dropdowns)
    const getAvailableColumnsForField = (matchToField: string) =>
      allColumns.filter((col) => {
        const mappedTo = mappedColumnMappings[col];
        if (!mappedTo || typeof mappedTo !== 'string') return true; // unmapped – available
        return mappedTo.toLowerCase() === matchToField?.toLowerCase(); // or mapped to this field
      });

    return (
      <StepContainer>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {stepSkipped ? (
            <B3 style={{ color: '#64748b' }}>
              All required fields are mapped. Review the document preview above
              and click Continue to proceed.
            </B3>
          ) : null}
          {unmappedRequired.map((field) => {
            // QB field needs column (no importedField)
            if (!field.importedField) {
              const currentColumn =
                Object.entries(mappedColumnMappings).find(
                  ([, m]) =>
                    typeof m === 'string' &&
                    m.toLowerCase() === field.matchToField?.toLowerCase(),
                )?.[0] || '';
              const availableColumns = getAvailableColumnsForField(
                field.matchToField || '',
              );
              return (
                <div
                  key={`qb-${field.matchToField}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  <B3 style={{ minWidth: '100px' }}>
                    {field.matchToField
                      ? field.matchToField.charAt(0).toUpperCase() +
                        field.matchToField.slice(1)
                      : ''}
                  </B3>
                  <Dropdown
                    value={currentColumn}
                    onChange={(e: KeyboardEvent | MouseEvent) => {
                      if (readOnly) return;
                      const selectedColumn = (e.target as HTMLSelectElement)
                        ?.value as string;
                      if (selectedColumn) {
                        handleMappingChange(selectedColumn, field.matchToField);
                        setSelectedFields((prev) => {
                          const next = new Set(prev);
                          next.add(selectedColumn);
                          return next;
                        });
                        dispatch(
                          updateMappedColumnCheckbox({
                            column: selectedColumn,
                            checked: true,
                          }),
                        );
                      }
                    }}
                    placeholder="Select imported field"
                    validationError={field.hasError}
                    aria-label={`Map column to ${field.matchToField}`}
                    style={{ minWidth: '200px' }}
                    disabled={readOnly}
                  >
                    <MenuItem value="">Select imported field</MenuItem>
                    {availableColumns.map((col) => (
                      <MenuItem key={col} value={col}>
                        {col}
                      </MenuItem>
                    ))}
                  </Dropdown>
                </div>
              );
            }
            // Excel column needs QB field (has importedField, no matchToField)
            const currentQBField =
              mappedColumnMappings[field.importedField] || '';
            return (
              <div
                key={`col-${field.importedField}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <B3 style={{ minWidth: '100px' }}>{field.importedField}</B3>
                <Dropdown
                  value={currentQBField}
                  onChange={(e: KeyboardEvent | MouseEvent) => {
                    if (readOnly) return;
                    const selectedQBField = (e.target as HTMLSelectElement)
                      ?.value as string;
                    if (selectedQBField) {
                      handleMappingChange(field.importedField, selectedQBField);
                      setSelectedFields((prev) => {
                        const next = new Set(prev);
                        next.add(field.importedField);
                        return next;
                      });
                      dispatch(
                        updateMappedColumnCheckbox({
                          column: field.importedField,
                          checked: true,
                        }),
                      );
                    }
                  }}
                  placeholder="Choose from QuickBooks fields"
                  validationError={field.hasError}
                  aria-label={`Map ${field.importedField} to QB field`}
                  style={{ minWidth: '200px' }}
                  disabled={readOnly}
                >
                  <MenuItem value="">Choose from QuickBooks fields</MenuItem>
                  {qbTimeFields.map((qbField) => {
                    const isAlreadyMapped =
                      mappedValues.has(qbField) &&
                      currentQBField?.toLowerCase() !== qbField.toLowerCase();
                    return (
                      <MenuItem
                        key={qbField}
                        value={qbField}
                        disabled={isAlreadyMapped}
                      >
                        {qbField.charAt(0).toUpperCase() + qbField.slice(1)}
                      </MenuItem>
                    );
                  })}
                </Dropdown>
              </div>
            );
          })}
        </div>
        {(!stepSkipped || compactView) && !readOnly && (
          <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
            <Button
              priority="primary"
              theme="gbsgexperimental"
              onClick={(ev) => handleContinue(ev)}
              disabled={
                !stepSkipped && (!allRequiredMapped || !allRequiredSelected)
              }
            >
              Continue
            </Button>
            {onSkip && (
              <Button
                priority="secondary"
                theme="gbsgexperimental"
                onClick={(ev) => handleStep2Skip(ev)}
              >
                Skip
              </Button>
            )}
          </div>
        )}
      </StepContainer>
    );
  }

  return (
    <StepContainer>
      {!hideTitle && (
        <>
          <H4 weight="demi" style={{ marginTop: '16px', marginBottom: '20px' }}>
            Review field mapping
          </H4>
          <B2 style={{ marginBottom: '24px' }}>
            {/* eslint-disable-next-line react/no-unescaped-entities */}
            Choose the fields you'd like to include in your imported time
            entries. Need to make edits?{' '}
            <Link
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setShowCustomFieldsModal(true);
              }}
            >
              Manage existing custom fields
            </Link>
          </B2>
        </>
      )}

      {/* AI Banner */}
      <AIBanner hasError={!allRequiredMapped}>
        <BannerText>
          <strong>{matchedCount} fields matched</strong>
          {requiredMissingCount > 0 && (
            <>
              ,{' '}
              <span style={{ color: '#D32F2F' }}>
                {requiredMissingCount} required fields missing from imports
              </span>
            </>
          )}
        </BannerText>
      </AIBanner>

      {/* Main content with table and progress card */}
      <div
        style={{
          display: 'flex',
          gap: hideStepProgress ? 0 : '24px',
          alignItems: 'flex-start',
        }}
      >
        {/* Table - Left side */}
        <div style={{ flex: 1 }}>
          <StyledTable
            density="comfortable"
            border="round"
            divider="horizontal"
            responsive="elevate"
          >
            <Table.Header>
              <Table.Row>
                <Table.Cell style={{ width: '5%', textAlign: 'center' }}>
                  <Checkbox
                    checked={allFieldsSelected}
                    indeterminate={someFieldsSelected}
                    onChange={(e) =>
                      handleSelectAllChange(e.target.checked ?? false)
                    }
                    aria-label="Select all fields"
                  />
                </Table.Cell>
                <Table.Cell style={{ width: '25%' }}>
                  <B3 weight="demi">Imported field</B3>
                </Table.Cell>
                <Table.Cell style={{ width: '20%' }}>
                  <B3 weight="demi">Sample data</B3>
                </Table.Cell>
                <Table.Cell style={{ width: '30%' }}>
                  <B3 weight="demi">QuickBooks field</B3>
                </Table.Cell>
                <Table.Cell style={{ width: '10%', textAlign: 'center' }}>
                  <B3 weight="demi">Required</B3>
                </Table.Cell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {fieldMappings.map((field, index) => {
                const rowKey =
                  field.importedField ||
                  `required-${field.matchToField}-${index}`;
                const isRequiredUnmapped =
                  !field.importedField && field.isRequired;

                // Essential fields that must always be checked and disabled
                const isEssentialField = ['employee', 'date', 'hours'].includes(
                  field.matchToField,
                );

                return (
                  <Table.Row key={rowKey}>
                    <Table.Cell style={{ textAlign: 'center' }}>
                      <Checkbox
                        checked={field.isSelected}
                        onChange={(e) =>
                          handleFieldCheckboxChange(
                            field.importedField || rowKey,
                            e.target.checked ?? false,
                          )
                        }
                        aria-label={`Select ${
                          field.importedField || field.matchToField
                        }`}
                        disabled={isRequiredUnmapped || isEssentialField}
                      />
                    </Table.Cell>
                    <Table.Cell>
                      {isRequiredUnmapped ? (
                        <Dropdown
                          value=""
                          onChange={(e: KeyboardEvent | MouseEvent) => {
                            // @ts-ignore
                            const selectedColumn = e.target.value as string;
                            if (selectedColumn) {
                              handleMappingChange(
                                selectedColumn,
                                field.matchToField,
                              );
                            }
                          }}
                          placeholder="Select imported field"
                          validationError
                          aria-label={`Select imported field for ${field.matchToField}`}
                        >
                          {getUnmappedImportedFieldMenuItems()}
                        </Dropdown>
                      ) : (
                        <B3>{field.importedField}</B3>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <SampleDataText>{field.sampleData}</SampleDataText>
                    </Table.Cell>
                    <Table.Cell>
                      {isRequiredUnmapped ? (
                        <B3>
                          {field.matchToField
                            ? field.matchToField.charAt(0).toUpperCase() +
                              field.matchToField.slice(1)
                            : '--'}
                        </B3>
                      ) : (
                        <Dropdown
                          value={field.matchToField || ''}
                          onChange={(e: KeyboardEvent | MouseEvent) => {
                            // @ts-ignore
                            const value = e.target.value as string;
                            handleMappingChange(field.importedField, value);
                          }}
                          placeholder="Choose from QuickBooks fields"
                          aria-label={`Map ${field.importedField} to QB field`}
                        >
                          {getQBFieldMenuItems(field.matchToField)}
                        </Dropdown>
                      )}
                    </Table.Cell>
                    <Table.Cell style={{ textAlign: 'center' }}>
                      {field.isRequired ? (
                        <StyledBadge status="draft" aria-label="Required field">
                          Required
                        </StyledBadge>
                      ) : (
                        <StyledBadge status="draft" aria-label="Optional field">
                          Optional
                        </StyledBadge>
                      )}
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </StyledTable>
        </div>

        {!hideStepProgress && (
          <div style={{ width: '280px', flexShrink: 0 }}>
            <StepProgressCard />
          </div>
        )}
      </div>

      {/* Action buttons */}
      <ActionBar>
        <div>
          <RequiredFieldsText>
            {allRequiredMapped
              ? `${requiredFields.length}/${requiredFields.length} required fields are checked`
              : `${requiredFields.length - requiredMissingCount}/${
                  requiredFields.length
                } required fields are checked`}
          </RequiredFieldsText>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <BackButton sandbox={sandbox} />
          <Button
            priority="primary"
            theme="gbsgexperimental"
            onClick={(ev) => handleContinue(ev)}
            disabled={!allRequiredMapped || !allRequiredSelected}
          >
            Continue
          </Button>
        </div>
      </ActionBar>

      {/* Custom Fields Drawer */}
      {showCustomFieldsModal && (
        <Widget
          key="qbo-custom-fields-plugin/custom-fields-drawer"
          widgetId="qbo-custom-fields-plugin/custom-fields-drawer"
          data-testid="custom-fields-drawer"
          displayDrawer={showCustomFieldsModal}
          onClose={() => setShowCustomFieldsModal(false)}
          onDrawerWidgetClose={() => setShowCustomFieldsModal(false)}
          workflow={WORKFLOWS.TIME}
        />
      )}

      {/* All Required Fields Mapped Confirmation Modal (hidden when skipReviewModal e.g. chat-style view) */}
      {!skipReviewModal && showAllMappedModal && (
        <Modal
          open={showAllMappedModal}
          lightBackdrop
          onClose={handleReviewMapping}
          size="medium"
        >
          <ModalHeader alignment="center">
            <ModalTitle subTitle="" title="All required fields are mapped" />
          </ModalHeader>
          <ModalContent alignment="center">
            <div>
              All required fields have been mapped. You can review the mappings
              or continue to generate time entries.
            </div>
            <div
              style={{
                marginTop: '20px',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Checkbox
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked ?? false)}
              >
                <B2>
                  Don&apos;t show this again when required fields are mapped
                </B2>
              </Checkbox>
            </div>
          </ModalContent>
          <ModalActions alignment="center">
            <Button
              onClick={handleModalContinue}
              priority="primary"
              theme="gbsgexperimental"
            >
              Generate time entries
            </Button>
            <Button
              onClick={handleReviewMapping}
              priority="secondary"
              theme="gbsgexperimental"
            >
              Review fields
            </Button>
          </ModalActions>
        </Modal>
      )}
    </StepContainer>
  );
};

// Styled Components
const SampleDataText = styled.div`
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
`;

const RequiredFieldsText = styled(B2)``;

const StyledBadge = styled(Badge)`
  text-transform: none !important;

  /* Target all child elements */
  * {
    text-transform: none !important;
  }

  /* Target span elements that Badge typically uses */
  span {
    text-transform: none !important;
  }
`;

const StyledTable = styled(Table)`
  /* Ensure rounded corners on table */
  border-radius: 12px !important;
  overflow: hidden;

  /* Remove uppercase transformation from table headers */
  th {
    text-transform: none !important;
  }
`;

export default Step2Mapping;

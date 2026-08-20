import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { H4, B2, B3 } from '@ids-ts/typography';
import Button from '@ids-ts/button';
import Badge from '@ids-ts/badge';
import Dropdown, { MenuItem } from '@ids-ts/dropdown';
import { Table } from '@ids-ts/table';
import {
  Modal,
  ModalActions,
  ModalContent,
  ModalHeader,
  ModalIconImage,
  ModalTitle,
} from '@ids-ts/modal-dialog';
import { TriangleExclamationFill } from '@design-systems/icons';
import Icon from '@ids-ts/icon-container';
import styled from 'styled-components';
import finalPropsSelectorFactory from 'react-redux/es/connect/selectorFactory';
import { Sandbox } from 'src/js/common/sandbox';
import store, { useAppDispatch, useAppSelector } from '../store';
import { IconCircle, StepContainer } from '../base.styles';
import StepProgressCard from '../components/StepProgressCard';
import BackButton from '../components/BackButton';
import ClassDropdown from '../components/ClassDropdown';
import ServiceDropdown from '../components/ServiceDropdown';
import LocationDropdown from '../components/LocationDropdown';
import CustomerDropdown from '../components/CustomerDropdown';
import EmployeeDropdown from '../components/EmployeeDropdown';
import {
  setGlobalProcessing,
  clearGlobalProcessing,
  setCurrentStep,
  markStepCompleted,
  setMappingContinueClicked,
  setStep3ContinueClicked,
} from '../store/progressSlice';
import { updateUxPreference } from '../store/uxPreferencesSlice';
import {
  selectUnmatchedClasses,
  selectUnmatchedServices,
  selectUnmatchedLocations,
  selectUnmatchedCustomers,
  selectUploadId,
} from '../store/selectors';
import { setMaxHoursPerDay } from '../store/step1Slice';
import {
  useAIImportPreferences,
  type Step3ValueMappingsPayload,
} from '../hooks/useAIImportPreferences';
import {
  mapClassField,
  mapServiceField,
  mapLocationField,
  mapCustomerField,
  mapEmployeeField,
  mapCustomFieldDropdownValue,
} from '../store/fieldMappingsSlice';
import { updateTimeEntryField } from '../store/excelDataSlice';
import { useProcessMappingToReviewEntries } from '../hooks/useProcessMappingToReviewEntries';
import { useStep2Processing } from '../hooks/useStep2Processing';
import CelebrationSvg from '../../../../assets/images/celebration.svg';

interface FieldMapping {
  unmatchedValue: string;
  fieldType:
    | 'class'
    | 'service'
    | 'location'
    | 'customer'
    | 'employee'
    | 'customFieldDropdown';
  affectedCount: number;
  mappedId: string;
  mappedName: string;
  isRequired: boolean;
  hasError: boolean;
  fuzzySuggestions?: any[];
  customFieldId?: string;
  customFieldName?: string;
}

/** True if field already has a mapping (from Redux/AI prefs); don't show in Step 3 or chat message. */
const isFieldAlreadyMapped = (field: {
  mappedId?: string;
  mappedName?: string;
}) =>
  !!(
    field?.mappedId &&
    String(field.mappedId).trim() &&
    field?.mappedName &&
    String(field.mappedName).trim()
  );

interface Step3FieldMappingProps {
  sandbox?: Sandbox;
  /** When true, hide the step progress card (e.g. in split-screen view). */
  hideStepProgress?: boolean;
  /** When true, hide title and subtitle (e.g. in split-screen view). */
  hideTitle?: boolean;
  /** When true, render only [Unmapped value] [QuickBooks value dropdown] list (e.g. chat-style view). */
  compactView?: boolean;
  /** When true, disable all dropdowns and Continue button (e.g. when mapping complete, on step 5). */
  readOnly?: boolean;
  /** When true, show Skip button (continues with unmapped as null). */
  showSkipButton?: boolean;
}

const Step3FieldMapping: React.FC<Step3FieldMappingProps> = ({
  sandbox,
  hideStepProgress = false,
  hideTitle = false,
  compactView = false,
  readOnly = false,
  showSkipButton = false,
}) => {
  const dispatch = useAppDispatch();
  const aiPrefs = useAIImportPreferences(sandbox || ({} as Sandbox));
  const aiPrefsRef = useRef(aiPrefs);
  aiPrefsRef.current = aiPrefs;

  const { processMappingToReviewEntries } = useProcessMappingToReviewEntries();

  // Call useStep2Processing to get processExcelData function
  // This is needed to re-process data after mappings are applied
  const { processExcelData } = useStep2Processing();

  // Modal state for unmapped required fields warning
  const [showWarningModal, setShowWarningModal] = useState(false);

  const uploadId = useAppSelector(selectUploadId);

  // Ref to track if we've extracted fields (not needed anymore - done in ProcessingStep)
  const hasExtractedFieldsRef = useRef(false);
  const prevUploadIdRef = useRef<string>('');
  // Ref to track if celebration screen has been shown (not needed - no auto-navigation)
  const hasCelebrationShownRef = useRef(false);
  // When compact view and step skipped (no unmapped values), auto-advance once
  const hasAutoAdvancedStep3Ref = useRef(false);
  // Prevent auto-navigate effect from calling handleContinue repeatedly (infinite loop)
  const hasAutoNavigatedRef = useRef(false);

  // Reset refs when uploadId changes (new file uploaded)
  useEffect(() => {
    if (uploadId && uploadId !== prevUploadIdRef.current) {
      hasExtractedFieldsRef.current = false;
      hasCelebrationShownRef.current = false;
      hasUserInteractedRef.current = false; // Reset interaction tracking
      hasAutoAdvancedStep3Ref.current = false;
      hasAutoNavigatedRef.current = false;
      prevUploadIdRef.current = uploadId;
    }
  }, [uploadId]);

  // Redux state
  const unmatchedClasses = useAppSelector(selectUnmatchedClasses);
  const unmatchedServices = useAppSelector(selectUnmatchedServices);
  const unmatchedLocations = useAppSelector(selectUnmatchedLocations);
  const unmatchedCustomers = useAppSelector(selectUnmatchedCustomers);
  const unmatchedEmployees = useAppSelector(
    (state: any) => state.fieldMappings.unmatchedEmployees,
  );
  const unmatchedCustomFieldDropdownValues = useAppSelector(
    (state: any) => state.fieldMappings.unmatchedCustomFieldDropdownValues,
  );
  const companySettings = useAppSelector(
    (state: any) => state.companySettings.settings,
  );
  const columnMappings = useAppSelector(
    (state: any) => state.excelData.mappedColumnMappings,
  );
  const employeeGroupedTimeEntries = useAppSelector(
    (state: any) => state.excelData.employeeGroupedTimeEntries,
  );
  const mappingVersion = useAppSelector(
    (state: any) => state.fieldMappings.mappingVersion,
  );

  // Track which fields were manually mapped by the user in this session
  // These should be hidden after user maps them
  const userMappedFieldsRef = useRef<Set<string>>(new Set());

  // Track the original order of fields to prevent re-ordering when fields are mapped
  const fieldOrderRef = useRef<string[]>([]);
  const [fieldOrderVersion, forceFieldOrderUpdate] = useState(0);

  // Track whether a field is fuzzy-matched (should show) vs manually mapped (can be hidden)
  const fuzzyMatchedFieldsRef = useRef<Set<string>>(new Set());

  // Capture field order and fuzzy-matched fields on first render
  useEffect(() => {
    if (fieldOrderRef.current.length === 0) {
      const fieldOrder: string[] = [];
      const fuzzyMatched = new Set<string>();

      // Helper to check if a field has a high-confidence fuzzy suggestion
      const hasFuzzySuggestion = (field: any) =>
        field?.fuzzySuggestions &&
        field.fuzzySuggestions.length > 0 &&
        field.fuzzySuggestions[0]?.confidence === 'high';

      // Capture employees
      Object.entries(unmatchedEmployees).forEach(
        ([key, employee]: [string, any]) => {
          const fieldKey = `employee-${key}`;
          fieldOrder.push(fieldKey);
          // Track if this field has fuzzy suggestions (should be shown with "Auto-matched" text)
          if (
            employee.mappedId &&
            employee.mappedName &&
            hasFuzzySuggestion(employee)
          ) {
            fuzzyMatched.add(fieldKey);
          }
        },
      );

      // Capture customers
      Object.entries(unmatchedCustomers).forEach(
        ([key, customer]: [string, any]) => {
          const fieldKey = `customer-${key}`;
          fieldOrder.push(fieldKey);
          if (
            customer.mappedId &&
            customer.mappedName &&
            hasFuzzySuggestion(customer)
          ) {
            fuzzyMatched.add(fieldKey);
          }
        },
      );

      // Capture classes
      Object.entries(unmatchedClasses).forEach(([key, cls]: [string, any]) => {
        const fieldKey = `class-${key}`;
        fieldOrder.push(fieldKey);
        if (cls.mappedId && cls.mappedName && hasFuzzySuggestion(cls)) {
          fuzzyMatched.add(fieldKey);
        }
      });

      // Capture services
      Object.entries(unmatchedServices).forEach(
        ([key, service]: [string, any]) => {
          const fieldKey = `service-${key}`;
          fieldOrder.push(fieldKey);
          if (
            service.mappedId &&
            service.mappedName &&
            hasFuzzySuggestion(service)
          ) {
            fuzzyMatched.add(fieldKey);
          }
        },
      );

      // Capture locations
      Object.entries(unmatchedLocations).forEach(
        ([key, location]: [string, any]) => {
          const fieldKey = `location-${key}`;
          fieldOrder.push(fieldKey);
          if (
            location.mappedId &&
            location.mappedName &&
            hasFuzzySuggestion(location)
          ) {
            fuzzyMatched.add(fieldKey);
          }
        },
      );

      // Capture custom field dropdown values
      Object.entries(unmatchedCustomFieldDropdownValues).forEach(
        ([key, customField]: [string, any]) => {
          const fieldKey = `customFieldDropdown-${key}`;
          fieldOrder.push(fieldKey);
          if (
            customField.mappedId &&
            customField.mappedName &&
            hasFuzzySuggestion(customField)
          ) {
            fuzzyMatched.add(fieldKey);
          }
        },
      );

      fuzzyMatchedFieldsRef.current = fuzzyMatched;
      const prevOrder = fieldOrderRef.current;
      fieldOrderRef.current = fieldOrder;
      // Only trigger re-render if order actually changed (prevents infinite loop)
      if (
        fieldOrder.length > 0 &&
        prevOrder.join(',') !== fieldOrder.join(',')
      ) {
        forceFieldOrderUpdate((n) => n + 1);
      }
    } else {
      // Append custom field keys when they appear after extraction (they load async)
      const existing = new Set(fieldOrderRef.current);
      const toAppend: string[] = [];
      Object.entries(unmatchedCustomFieldDropdownValues).forEach(
        ([key, customField]: [string, any]) => {
          const fieldKey = `customFieldDropdown-${key}`;
          if (!existing.has(fieldKey)) {
            existing.add(fieldKey);
            toAppend.push(fieldKey);
            if (
              customField.mappedId &&
              customField.mappedName &&
              customField?.fuzzySuggestions?.length > 0 &&
              customField.fuzzySuggestions[0]?.confidence === 'high'
            ) {
              fuzzyMatchedFieldsRef.current.add(fieldKey);
            }
          }
        },
      );
      if (toAppend.length > 0) {
        fieldOrderRef.current = [...fieldOrderRef.current, ...toAppend];
        forceFieldOrderUpdate((n) => n + 1);
      }
    }
  }, [
    unmatchedEmployees,
    unmatchedCustomers,
    unmatchedClasses,
    unmatchedServices,
    unmatchedLocations,
    unmatchedCustomFieldDropdownValues,
  ]);

  // Filter out: (1) fields already mapped in Redux (mappedId/mappedName), (2) user mapped in this session
  const filteredUnmatchedEmployees = useMemo(() => {
    const filtered: Record<string, any> = {};
    Object.entries(unmatchedEmployees).forEach(
      ([key, employee]: [string, any]) => {
        const fieldKey = `employee-${key}`;
        if (userMappedFieldsRef.current.has(fieldKey)) return;
        if (isFieldAlreadyMapped(employee)) return;
        filtered[key] = employee;
      },
    );
    return filtered;
  }, [unmatchedEmployees]);

  const filteredUnmatchedCustomers = useMemo(() => {
    const filtered: Record<string, any> = {};
    Object.entries(unmatchedCustomers).forEach(
      ([key, customer]: [string, any]) => {
        const fieldKey = `customer-${key}`;
        if (userMappedFieldsRef.current.has(fieldKey)) return;
        if (isFieldAlreadyMapped(customer)) return;
        filtered[key] = customer;
      },
    );
    return filtered;
  }, [unmatchedCustomers]);

  const filteredUnmatchedClasses = useMemo(() => {
    const filtered: Record<string, any> = {};
    Object.entries(unmatchedClasses).forEach(([key, cls]: [string, any]) => {
      const fieldKey = `class-${key}`;
      if (userMappedFieldsRef.current.has(fieldKey)) return;
      if (isFieldAlreadyMapped(cls)) return;
      filtered[key] = cls;
    });
    return filtered;
  }, [unmatchedClasses]);

  const filteredUnmatchedServices = useMemo(() => {
    const filtered: Record<string, any> = {};
    Object.entries(unmatchedServices).forEach(
      ([key, service]: [string, any]) => {
        const fieldKey = `service-${key}`;
        if (userMappedFieldsRef.current.has(fieldKey)) return;
        if (isFieldAlreadyMapped(service)) return;
        filtered[key] = service;
      },
    );
    return filtered;
  }, [unmatchedServices]);

  const filteredUnmatchedLocations = useMemo(() => {
    const filtered: Record<string, any> = {};
    Object.entries(unmatchedLocations).forEach(
      ([key, location]: [string, any]) => {
        const fieldKey = `location-${key}`;
        if (userMappedFieldsRef.current.has(fieldKey)) return;
        if (isFieldAlreadyMapped(location)) return;
        filtered[key] = location;
      },
    );
    return filtered;
  }, [unmatchedLocations]);

  const filteredUnmatchedCustomFieldDropdownValues = useMemo(() => {
    const filtered: Record<string, any> = {};
    Object.entries(unmatchedCustomFieldDropdownValues).forEach(
      ([key, customField]: [string, any]) => {
        const fieldKey = `customFieldDropdown-${key}`;
        if (userMappedFieldsRef.current.has(fieldKey)) return;
        if (isFieldAlreadyMapped(customField)) return;
        filtered[key] = customField;
      },
    );
    return filtered;
  }, [unmatchedCustomFieldDropdownValues]);

  // State to track if extraction has completed (Step3DataLoader runs extraction before we mount)
  const [hasExtractedFields, setHasExtractedFields] = useState(false);

  // Step3DataLoader (in ChatStyleFlow) runs extractUnmappedFields before Step 3 shows.
  // We only mount when step3ExtractionComplete is true, so extraction is already done.
  // Just mark as complete on mount – do NOT run extraction again (causes infinite loop).
  useEffect(() => {
    hasExtractedFieldsRef.current = true;
    setHasExtractedFields(true);
    return () => {
      hasExtractedFieldsRef.current = false;
      setHasExtractedFields(false);
    };
  }, []);

  // REMOVED: Auto-skip logic
  // Step 3 should NEVER auto-skip. If there are unmapped fields, user must map them.
  // If there are NO unmapped fields, ProcessingStep should have skipped this step entirely.

  // Get user-initiated navigation flag
  const isUserInitiatedNavigation = useAppSelector(
    (state: any) => state.progress.isUserInitiatedNavigation,
  );

  // Local state to store user's mappings (doesn't trigger Redux/re-renders)
  // IMPORTANT: Must be declared BEFORE isFieldMapped and hasNoUnmappedFields
  const [localMappings, setLocalMappings] = useState<
    Record<string, { id: string; name: string }>
  >({});

  // Track if we've initialized localMappings from Redux (only do it once)
  const hasInitializedMappingsRef = useRef(false);

  // Initialize localMappings from Redux when component mounts ONLY ONCE
  // This ensures that previously saved mappings are displayed in the dropdowns
  useEffect(() => {
    // Only initialize once per mount, and never if user has already made selections
    // This prevents overwriting user's in-progress mappings on re-render
    if (hasInitializedMappingsRef.current) {
      return;
    }

    const initialMappings: Record<string, { id: string; name: string }> = {};

    // Load employee mappings
    Object.entries(unmatchedEmployees).forEach(
      ([key, field]: [string, any]) => {
        if (field.mappedId && field.mappedName) {
          const fieldKey = `employee-${field.value}`;
          initialMappings[fieldKey] = {
            id: field.mappedId,
            name: field.mappedName,
          };
        }
      },
    );

    // Load customer mappings
    Object.entries(unmatchedCustomers).forEach(
      ([key, field]: [string, any]) => {
        if (field.mappedId && field.mappedName) {
          const fieldKey = `customer-${field.value}`;
          initialMappings[fieldKey] = {
            id: field.mappedId,
            name: field.mappedName,
          };
        }
      },
    );

    // Load service mappings
    Object.entries(unmatchedServices).forEach(([key, field]: [string, any]) => {
      if (field.mappedId && field.mappedName) {
        const fieldKey = `service-${field.value}`;
        initialMappings[fieldKey] = {
          id: field.mappedId,
          name: field.mappedName,
        };
      }
    });

    // Load class mappings
    Object.entries(unmatchedClasses).forEach(([key, field]: [string, any]) => {
      if (field.mappedId && field.mappedName) {
        const fieldKey = `class-${field.value}`;
        initialMappings[fieldKey] = {
          id: field.mappedId,
          name: field.mappedName,
        };
      }
    });

    // Load location mappings
    Object.entries(unmatchedLocations).forEach(
      ([key, field]: [string, any]) => {
        if (field.mappedId && field.mappedName) {
          const fieldKey = `location-${field.value}`;
          initialMappings[fieldKey] = {
            id: field.mappedId,
            name: field.mappedName,
          };
        }
      },
    );

    // Load custom field dropdown mappings
    Object.entries(unmatchedCustomFieldDropdownValues).forEach(
      ([key, field]: [string, any]) => {
        if (field.mappedId && field.mappedName) {
          const fieldKey = `customFieldDropdown-${field.value}`;
          initialMappings[fieldKey] = {
            id: field.mappedId,
            name: field.mappedName,
          };
        }
      },
    );

    if (Object.keys(initialMappings).length > 0) {
      setLocalMappings(initialMappings);
    }

    // Mark as initialized - DON'T reset this on unmount!
    // This prevents the useEffect from running again if component remounts during the same session
    hasInitializedMappingsRef.current = true;
  }, [
    unmatchedEmployees,
    unmatchedCustomers,
    unmatchedClasses,
    unmatchedServices,
    unmatchedLocations,
    unmatchedCustomFieldDropdownValues,
  ]); // Run only on initial mount with field data

  // Helper to check if a field is mapped (either in Redux or local state)
  const isFieldMapped = useCallback(
    (fieldType: string, value: string, reduxMappedId?: string) => {
      // Check Redux first (pre-filled from sandbox)
      if (reduxMappedId) return true;

      // Check local state (user just mapped it)
      const fieldKey = `${fieldType}-${value}`;
      const localMapping = localMappings[fieldKey];
      return !!localMapping?.id;
    },
    [localMappings],
  );

  // Check if there are no unmapped fields - show celebration screen
  // An unmapped field is one where mappedId is empty (not yet mapped)
  // IMPORTANT: Only consider this valid AFTER extraction has happened
  const hasNoUnmappedFields = useMemo(() => {
    // Check if all unmapped field objects are empty (using ALL filtered fields)
    const allEmpty =
      Object.keys(filteredUnmatchedClasses).length === 0 &&
      Object.keys(filteredUnmatchedServices).length === 0 &&
      Object.keys(filteredUnmatchedLocations).length === 0 &&
      Object.keys(filteredUnmatchedCustomers).length === 0 &&
      Object.keys(filteredUnmatchedEmployees).length === 0 &&
      Object.keys(filteredUnmatchedCustomFieldDropdownValues).length === 0;

    // If all objects are empty AND extraction has happened, definitely no unmapped fields
    if (hasExtractedFieldsRef.current && allEmpty) {
      return true;
    }

    // If extraction hasn't happened yet but all objects are empty,
    // it means there were no unmapped fields to begin with (all auto-matched)
    if (!hasExtractedFieldsRef.current && allEmpty) {
      return true;
    }

    // If extraction has happened and objects are NOT empty, check if they're all mapped
    // IMPORTANT: Check BOTH Redux (pre-filled) AND local state (user mapped)
    if (hasExtractedFieldsRef.current && !allEmpty) {
      const hasUnmappedClasses = Object.values(filteredUnmatchedClasses).some(
        (field: any) => !isFieldMapped('class', field.value, field.mappedId),
      );
      const hasUnmappedServices = Object.values(filteredUnmatchedServices).some(
        (field: any) => !isFieldMapped('service', field.value, field.mappedId),
      );
      const hasUnmappedLocations = Object.values(
        filteredUnmatchedLocations,
      ).some(
        (field: any) => !isFieldMapped('location', field.value, field.mappedId),
      );
      const hasUnmappedCustomers = Object.values(
        filteredUnmatchedCustomers,
      ).some(
        (field: any) => !isFieldMapped('customer', field.value, field.mappedId),
      );
      const hasUnmappedEmployees = Object.values(
        filteredUnmatchedEmployees,
      ).some(
        (field: any) => !isFieldMapped('employee', field.value, field.mappedId),
      );
      const hasUnmappedCustomFieldDropdownValues = Object.values(
        filteredUnmatchedCustomFieldDropdownValues,
      ).some(
        (field: any) =>
          !isFieldMapped('customFieldDropdown', field.value, field.mappedId),
      );

      // No unmapped fields if all categories have no unmapped entries
      return (
        !hasUnmappedClasses &&
        !hasUnmappedServices &&
        !hasUnmappedLocations &&
        !hasUnmappedCustomers &&
        !hasUnmappedEmployees &&
        !hasUnmappedCustomFieldDropdownValues
      );
    }

    // Default: assume there are unmapped fields
    return false;
  }, [
    filteredUnmatchedClasses,
    filteredUnmatchedServices,
    filteredUnmatchedLocations,
    filteredUnmatchedCustomers,
    filteredUnmatchedEmployees,
    filteredUnmatchedCustomFieldDropdownValues,
    isFieldMapped,
  ]);

  // Combine all unmapped fields into a single array
  const fieldMappings = useMemo((): FieldMapping[] => {
    const mappings: FieldMapping[] = [];

    // Helper function to check if a field type is required
    const isFieldRequired = (fieldType: string): boolean => {
      if (fieldType === 'employee') return true; // Employee is always required
      if (fieldType === 'class') return companySettings?.classRequired || false;
      if (fieldType === 'location')
        return companySettings?.locationRequired || false;
      if (fieldType === 'service')
        return companySettings?.serviceItemRequired || false;
      return false;
    };

    // Create a lookup map for all field types
    const allFields: Record<string, any> = {
      ...Object.fromEntries(
        Object.entries(filteredUnmatchedEmployees).map(([key, field]) => [
          `employee-${key}`,
          { ...field, fieldType: 'employee' },
        ]),
      ),
      ...Object.fromEntries(
        Object.entries(filteredUnmatchedCustomers).map(([key, field]) => [
          `customer-${key}`,
          { ...field, fieldType: 'customer' },
        ]),
      ),
      ...Object.fromEntries(
        Object.entries(filteredUnmatchedClasses).map(([key, field]) => [
          `class-${key}`,
          { ...field, fieldType: 'class' },
        ]),
      ),
      ...Object.fromEntries(
        Object.entries(filteredUnmatchedServices).map(([key, field]) => [
          `service-${key}`,
          { ...field, fieldType: 'service' },
        ]),
      ),
      ...Object.fromEntries(
        Object.entries(filteredUnmatchedLocations).map(([key, field]) => [
          `location-${key}`,
          { ...field, fieldType: 'location' },
        ]),
      ),
      ...Object.fromEntries(
        Object.entries(filteredUnmatchedCustomFieldDropdownValues).map(
          ([key, field]) => [
            `customFieldDropdown-${key}`,
            { ...field, fieldType: 'customFieldDropdown' },
          ],
        ),
      ),
    };

    // Use stable field order when available; otherwise build from allFields so we have data on first render
    const fieldOrder =
      fieldOrderRef.current.length > 0
        ? fieldOrderRef.current
        : [
            ...Object.keys(allFields).filter((k) => k.startsWith('employee-')),
            ...Object.keys(allFields).filter((k) => k.startsWith('customer-')),
            ...Object.keys(allFields).filter((k) => k.startsWith('class-')),
            ...Object.keys(allFields).filter((k) => k.startsWith('service-')),
            ...Object.keys(allFields).filter((k) => k.startsWith('location-')),
            ...Object.keys(allFields).filter((k) =>
              k.startsWith('customFieldDropdown-'),
            ),
          ];

    fieldOrder.forEach((fieldKey) => {
      const field = allFields[fieldKey];
      if (!field) return; // Field was filtered out

      let mappedId = field.mappedId || '';
      let mappedName = field.mappedName || '';

      // For employees, check fuzzy suggestions if no mapping exists
      if (
        field.fieldType === 'employee' &&
        !mappedId &&
        field.fuzzySuggestions &&
        field.fuzzySuggestions.length > 0
      ) {
        const bestSuggestion = field.fuzzySuggestions[0];
        // Auto-select the first fuzzy suggestion if confidence is high (score < 0.3)
        if (bestSuggestion.score < 0.3 && bestSuggestion.employee) {
          mappedId = bestSuggestion.employee.id;
          mappedName = bestSuggestion.employee.name;
        }
      }

      mappings.push({
        unmatchedValue: field.value,
        fieldType: field.fieldType,
        affectedCount: field.affectedEntryIds?.length || 0,
        mappedId,
        mappedName,
        isRequired: isFieldRequired(field.fieldType),
        hasError: false,
        fuzzySuggestions: field.fuzzySuggestions || [],
        customFieldId: field.customFieldId,
        customFieldName: field.customFieldName,
      });
    });

    return mappings;
  }, [
    filteredUnmatchedClasses,
    filteredUnmatchedServices,
    filteredUnmatchedLocations,
    filteredUnmatchedCustomers,
    filteredUnmatchedEmployees,
    filteredUnmatchedCustomFieldDropdownValues,
    companySettings,
    fieldOrderVersion,
  ]);

  // Calculate matched and required counts
  const matchedCount = useMemo(
    () => fieldMappings.filter((f) => f.mappedId).length,
    [fieldMappings],
  );

  // Calculate unmapped required fields
  // Filter unmapped required fields - check BOTH Redux (pre-filled) AND local state (user mapped)
  const unmappedRequiredFields = useMemo(
    () =>
      fieldMappings.filter((f) => {
        if (!f.isRequired) return false;

        // Check if mapped in Redux (pre-filled from sandbox)
        if (f.mappedId) return false;

        // Check if mapped in local state (user just mapped it)
        const fieldKey = `${f.fieldType}-${f.unmatchedValue}`;
        const localMapping = localMappings[fieldKey];
        if (localMapping?.id) return false;

        // Not mapped anywhere - this is truly unmapped
        return true;
      }),
    [fieldMappings, localMappings],
  );

  const unmappedRequiredCount = unmappedRequiredFields.length;

  // Calculate total affected entries for unmapped required fields
  const totalAffectedEntries = useMemo(
    () =>
      unmappedRequiredFields.reduce(
        (sum, field) => sum + field.affectedCount,
        0,
      ),
    [unmappedRequiredFields],
  );

  const totalCount = fieldMappings.length;

  // Check if all required fields are mapped
  const allRequiredMapped = unmappedRequiredCount === 0;

  // Handle mapping change - update Redux and time entries immediately
  const handleMappingChange = useCallback(
    (field: FieldMapping, selectedId: string, selectedItem: any) => {
      if (!selectedId || !selectedItem?.name) {
        return;
      }

      // Mark that user has interacted with Step 3 (disable auto-navigation)
      hasUserInteractedRef.current = true;

      const fieldKey = `${field.fieldType}-${field.unmatchedValue}`;
      const { unmatchedValue } = field;

      // Mark this field as user-mapped (will be hidden after mapping)
      userMappedFieldsRef.current.add(fieldKey);

      // Update local state for UI responsiveness
      setLocalMappings((prev) => ({
        ...prev,
        [fieldKey]: {
          id: selectedId,
          name: selectedItem.name,
        },
      }));

      // Immediately dispatch to Redux based on field type
      switch (field.fieldType) {
        case 'class': {
          dispatch(
            mapClassField({
              value: unmatchedValue,
              mappedId: selectedId,
              mappedName: selectedItem.name,
            }),
          );

          // Update affected time entries
          const classKey = unmatchedValue.toLowerCase();
          const classField = unmatchedClasses[classKey];
          if (classField?.affectedEntryIds) {
            classField.affectedEntryIds.forEach((entryId: string) => {
              dispatch(
                updateTimeEntryField({
                  entryId,
                  field: 'classId',
                  value: selectedId,
                }),
              );
              dispatch(
                updateTimeEntryField({
                  entryId,
                  field: 'className',
                  value: selectedItem.name,
                }),
              );
            });
          }
          break;
        }

        case 'service': {
          dispatch(
            mapServiceField({
              value: unmatchedValue,
              mappedId: selectedId,
              mappedName: selectedItem.name,
            }),
          );

          const serviceKey = unmatchedValue.toLowerCase();
          const serviceField = unmatchedServices[serviceKey];
          if (serviceField?.affectedEntryIds) {
            serviceField.affectedEntryIds.forEach((entryId: string) => {
              dispatch(
                updateTimeEntryField({
                  entryId,
                  field: 'serviceItemId',
                  value: selectedId,
                }),
              );
              dispatch(
                updateTimeEntryField({
                  entryId,
                  field: 'serviceName',
                  value: selectedItem.name,
                }),
              );
            });
          }
          break;
        }

        case 'location': {
          dispatch(
            mapLocationField({
              value: unmatchedValue,
              mappedId: selectedId,
              mappedName: selectedItem.name,
            }),
          );

          const locationKey = unmatchedValue.toLowerCase();
          const locationField = unmatchedLocations[locationKey];
          if (locationField?.affectedEntryIds) {
            locationField.affectedEntryIds.forEach((entryId: string) => {
              dispatch(
                updateTimeEntryField({
                  entryId,
                  field: 'locationId',
                  value: selectedId,
                }),
              );
              dispatch(
                updateTimeEntryField({
                  entryId,
                  field: 'locationName',
                  value: selectedItem.name,
                }),
              );
            });
          }
          break;
        }

        case 'customer': {
          dispatch(
            mapCustomerField({
              value: unmatchedValue,
              mappedId: selectedId,
              mappedName: selectedItem.name,
            }),
          );

          const customerKey = unmatchedValue.toLowerCase();
          const customerField = unmatchedCustomers[customerKey];
          if (customerField?.affectedEntryIds) {
            customerField.affectedEntryIds.forEach((entryId: string) => {
              dispatch(
                updateTimeEntryField({
                  entryId,
                  field: 'customerId',
                  value: selectedId,
                }),
              );
              dispatch(
                updateTimeEntryField({
                  entryId,
                  field: 'customerName',
                  value: selectedItem.name,
                }),
              );
            });
          }
          break;
        }

        case 'employee': {
          dispatch(
            mapEmployeeField({
              value: unmatchedValue,
              mappedId: selectedId,
              mappedName: selectedItem.name,
            }),
          );

          const employeeKey = unmatchedValue.toLowerCase();
          const employeeField = unmatchedEmployees[employeeKey];
          if (employeeField?.affectedEntryIds) {
            employeeField.affectedEntryIds.forEach((entryId: string) => {
              dispatch(
                updateTimeEntryField({
                  entryId,
                  field: 'employeeId',
                  value: selectedId,
                }),
              );
              dispatch(
                updateTimeEntryField({
                  entryId,
                  field: 'employee',
                  value: selectedItem.name,
                }),
              );
              dispatch(
                updateTimeEntryField({
                  entryId,
                  field: 'isMissingEmployee',
                  value: false,
                }),
              );
              dispatch(
                updateTimeEntryField({
                  entryId,
                  field: 'status',
                  value: 'Valid',
                }),
              );
              dispatch(
                updateTimeEntryField({
                  entryId,
                  field: 'validationErrors',
                  value: [],
                }),
              );
            });
          }
          break;
        }

        case 'customFieldDropdown': {
          const customFieldEntry: any = Object.values(
            unmatchedCustomFieldDropdownValues,
          ).find((cf: any) => cf.value === unmatchedValue);

          if (customFieldEntry?.customFieldName) {
            dispatch(
              mapCustomFieldDropdownValue({
                fieldName: customFieldEntry.customFieldName,
                value: unmatchedValue,
                mappedId: selectedId,
                mappedName: selectedItem.name,
              }),
            );
          }
          break;
        }

        default:
          // No action needed for unknown field types
          break;
      }
    },
    [
      dispatch,
      unmatchedClasses,
      unmatchedServices,
      unmatchedLocations,
      unmatchedCustomers,
      unmatchedEmployees,
      unmatchedCustomFieldDropdownValues,
    ],
  );

  // Get the mapped value from local state (for displaying in dropdowns)
  const getMappedValue = useCallback(
    (field: FieldMapping) => {
      const fieldKey = `${field.fieldType}-${field.unmatchedValue}`;
      const localMapping = localMappings[fieldKey];

      if (localMapping) {
        return {
          mappedId: localMapping.id,
          mappedName: localMapping.name,
        };
      }

      // Fallback to pre-filled values from Redux (e.g., from sandbox storage)
      return {
        mappedId: field.mappedId || '',
        mappedName: field.mappedName || '',
      };
    },
    [localMappings],
  );

  // Handle actual continue (called after modal confirmation or if no warnings)
  const handleContinue = useCallback(async () => {
    try {
      dispatch(
        setGlobalProcessing({
          isProcessing: true,
          message: 'Processing time entries',
        }),
      );

      // Save Step 3 value mappings to AI preferences so we can skip Step 3 next time when all values match
      const fm = store.getState().fieldMappings;
      const toPayload = (
        rec: Record<string, { mappedId?: string; mappedName?: string }>,
      ):
        | Record<string, { mappedId: string; mappedName: string }>
        | undefined => {
        const out: Record<string, { mappedId: string; mappedName: string }> =
          {};
        Object.entries(rec || {}).forEach(([key, val]) => {
          if (val?.mappedId && val?.mappedName)
            out[key] = { mappedId: val.mappedId, mappedName: val.mappedName };
        });
        return Object.keys(out).length > 0 ? out : undefined;
      };
      const step3Payload: Step3ValueMappingsPayload = {};
      if (fm.unmatchedServices)
        step3Payload.services = toPayload(fm.unmatchedServices);
      if (fm.unmatchedCustomers)
        step3Payload.customers = toPayload(fm.unmatchedCustomers);
      if (fm.unmatchedEmployees)
        step3Payload.employees = toPayload(fm.unmatchedEmployees);
      if (fm.unmatchedClasses)
        step3Payload.classes = toPayload(fm.unmatchedClasses);
      if (fm.unmatchedLocations)
        step3Payload.locations = toPayload(fm.unmatchedLocations);
      if (fm.unmatchedCustomFieldDropdownValues)
        step3Payload.customFieldDropdownValues = toPayload(
          fm.unmatchedCustomFieldDropdownValues,
        );
      try {
        aiPrefsRef.current?.saveStep3ValueMappings(step3Payload);
      } catch {
        // ignore
      }

      // All mappings are already in Redux (updated on-the-fly by handleMappingChange)
      // Just need to re-process Excel data and apply mappings to review entries

      // STEP 1: Re-process the Excel data with all the mappings
      if (processExcelData) {
        await processExcelData();
      }

      // STEP 2: Process mappings to apply them to time entries before navigating to review
      await processMappingToReviewEntries({
        applyNullification: true,
        filterUnmappedEmployees: true,
      });

      // Mark Step 3 as completed
      dispatch(markStepCompleted(3));

      // Threshold step removed: always use 8 hours default and go straight to Review (step 5)
      dispatch(setMaxHoursPerDay(8));
      try {
        aiPrefsRef.current?.markPreferencesSeen();
        aiPrefsRef.current?.setImpose8HourLimit(true);
      } catch {
        // ignore
      }
      // Defer navigation so review slice update is committed and table (e.g. in SplitView left panel) populates before step 5 is shown
      requestAnimationFrame(() => {
        dispatch(setCurrentStep(5));
      });
    } catch (error) {
      // Error handling - clear processing state
      dispatch(clearGlobalProcessing());
    } finally {
      dispatch(clearGlobalProcessing());
    }
  }, [dispatch, processExcelData, processMappingToReviewEntries]);

  // Compact view: when step skipped (no unmapped values), auto-advance – but only AFTER extraction has run
  useEffect(() => {
    if (
      !compactView ||
      !hasExtractedFields ||
      fieldMappings.length > 0 ||
      hasAutoAdvancedStep3Ref.current
    )
      return;
    hasAutoAdvancedStep3Ref.current = true;
    handleContinue();
  }, [compactView, hasExtractedFields, fieldMappings.length, handleContinue]);

  // User-initiated continue (dispatches flag for "Mapping complete" message)
  const handleUserContinue = useCallback(() => {
    dispatch(setMappingContinueClicked(true));
    dispatch(setStep3ContinueClicked(true)); // So "Mapping complete, please review..." only when user completed Step 3
    handleContinue();
  }, [dispatch, handleContinue]);

  // Handle continue - check for unmapped required fields
  const handleContinueClick = useCallback(() => {
    // If there are unmapped required fields, show warning modal
    if (unmappedRequiredCount > 0) {
      setShowWarningModal(true);
      return;
    }

    // Otherwise, proceed directly (user click)
    handleUserContinue();
  }, [unmappedRequiredCount, handleUserContinue]);

  // Handle modal cancel
  const handleModalCancel = useCallback(() => {
    setShowWarningModal(false);
  }, []);

  // Handle modal continue
  const handleModalContinue = useCallback(() => {
    setShowWarningModal(false);
    handleUserContinue();
  }, [handleUserContinue]);

  // Render dropdown based on field type
  const renderDropdown = (field: FieldMapping) => {
    // Get the current mapped value (from localMappings or Redux)
    const currentMapping = getMappedValue(field);

    const baseProps = {
      value: currentMapping.mappedId,
      onChange: (selectedId: string, selectedItem: any) => {
        handleMappingChange(field, selectedId, selectedItem);
      },
      disabled: readOnly,
      addNew: false,
    };

    // Use stable keys (field type + unmatched value only) so dropdowns don't remount when
    // localMappings is populated from Redux (e.g. saved Step 3 preferences). Remounting
    // caused the entity widgets to open their "add new" drawers on load.
    const stableKey = `${field.fieldType}-${field.unmatchedValue}`;
    switch (field.fieldType) {
      case 'class':
        return (
          <ClassDropdown
            key={stableKey}
            {...baseProps}
            classValue={currentMapping.mappedName}
          />
        );
      case 'service':
        return (
          <ServiceDropdown
            key={stableKey}
            {...baseProps}
            serviceValue={currentMapping.mappedName}
          />
        );
      case 'location':
        return (
          <LocationDropdown
            key={stableKey}
            {...baseProps}
            locationValue={currentMapping.mappedName}
          />
        );
      case 'customer':
        return (
          <CustomerDropdown
            key={stableKey}
            {...baseProps}
            customerValue={currentMapping.mappedName}
          />
        );
      case 'employee':
        return (
          <EmployeeDropdown
            key={stableKey}
            {...baseProps}
            employeeValue={currentMapping.mappedName}
          />
        );
      case 'customFieldDropdown': {
        // Custom field dropdown needs special handling for IDS Dropdown component
        const options = field.fuzzySuggestions || [];

        return (
          <Dropdown
            value={getMappedValue(field).mappedId}
            onChange={(e: any) => {
              const selectedId = e?.target?.value;

              // Don't process if empty value (user selected "Select an option")
              if (!selectedId) {
                return;
              }

              // Find the selected option from fuzzySuggestions
              const selectedOption = options.find(
                (opt: any) => opt.id === selectedId,
              );

              if (selectedOption) {
                // Call handleMappingChange with the selected id and item
                handleMappingChange(field, selectedId, selectedOption);
              }
              // Else: Selected option not found
            }}
            placeholder="Choose from dropdown options"
          >
            {[
              <MenuItem key="empty" value="">
                Select an option
              </MenuItem>,
              ...options.map((option: any) => (
                <MenuItem key={option.id} value={option.id}>
                  {option.name}
                </MenuItem>
              )),
            ]}
          </Dropdown>
        );
      }
      default:
        return null;
    }
  };

  // Auto-navigate if all fields are mapped and user didn't manually come to Step 3
  // Use a ref to track if user has interacted with Step 3
  const hasUserInteractedRef = useRef(false);

  useEffect(() => {
    // Guard: prevent calling handleContinue multiple times (causes infinite loop)
    if (hasAutoNavigatedRef.current) return;

    // Only auto-navigate if:
    // 1. Extraction is complete (use state variable so useEffect re-runs when it changes)
    // 2. All fields are mapped (no unmapped fields)
    // 3. User did NOT manually navigate to Step 3 (came via skip-step-2)
    // 4. User has NOT interacted with Step 3 (e.g., by mapping a field)
    const shouldAutoNavigate =
      hasExtractedFields &&
      hasNoUnmappedFields &&
      !isUserInitiatedNavigation &&
      !hasUserInteractedRef.current;

    if (shouldAutoNavigate) {
      hasAutoNavigatedRef.current = true;
      handleContinue();
    }
  }, [
    hasExtractedFields,
    hasNoUnmappedFields,
    isUserInitiatedNavigation,
    handleContinue,
  ]);

  const getFieldTypeLabel = (fieldType: string, customFieldName?: string) => {
    const labels: Record<string, string> = {
      class: 'Class',
      service: 'Service',
      location: 'Location',
      customer: 'Customer',
      employee: 'Employee',
      customFieldDropdown: customFieldName || 'Custom Field',
    };
    return labels[fieldType] || fieldType;
  };

  // Group fields by type for compact view (each type in its own labeled card)
  const fieldMappingsByType = useMemo(() => {
    const typeOrder = [
      'employee',
      'class',
      'service',
      'location',
      'customer',
      'customFieldDropdown',
    ];
    const groups: { label: string; fields: typeof fieldMappings }[] = [];
    const seen = new Set<string>();

    const getGroupKey = (f: FieldMapping) =>
      f.fieldType === 'customFieldDropdown'
        ? `customFieldDropdown:${f.customFieldName ?? 'Custom Field'}`
        : f.fieldType;

    fieldMappings.forEach((f) => {
      const key = getGroupKey(f);
      if (seen.has(key)) return;
      seen.add(key);
      const label =
        f.fieldType === 'customFieldDropdown'
          ? f.customFieldName || 'Custom Field'
          : getFieldTypeLabel(f.fieldType);
      const fields = fieldMappings.filter((x) => getGroupKey(x) === key);
      groups.push({ label, fields });
    });

    return groups.sort((a, b) => {
      const aFirst = fieldMappings.find((f) => a.fields.includes(f));
      const bFirst = fieldMappings.find((f) => b.fields.includes(f));
      const aIdx = aFirst
        ? typeOrder.indexOf(aFirst.fieldType)
        : typeOrder.length;
      const bIdx = bFirst
        ? typeOrder.indexOf(bFirst.fieldType)
        : typeOrder.length;
      if (aIdx !== bIdx) return aIdx - bIdx;
      return (aFirst?.customFieldName ?? '').localeCompare(
        bFirst?.customFieldName ?? '',
      );
    });
  }, [fieldMappings]);

  // Check if we should show celebration screen (step UI only – not in chat flow)
  const showCelebration = hasNoUnmappedFields;

  // Chat UI: when all fields are mapped, don't show step-style celebration – auto-advance only
  useEffect(() => {
    if (!compactView || !showCelebration || hasAutoNavigatedRef.current) return;
    hasAutoNavigatedRef.current = true;
    dispatch(setMappingContinueClicked(true)); // So "Mapping complete, please review..." shows in chat
    handleContinue();
  }, [compactView, showCelebration, dispatch, handleContinue]);

  // If all fields are mapped: in chat flow show nothing (we auto-advance); in step flow show celebration screen
  if (showCelebration) {
    if (compactView) {
      return null; // Chat UI – no step celebration, handleContinue is triggered by effect above
    }
    return (
      <StepContainer style={{ position: 'relative' }}>
        {!hideTitle && (
          <>
            <H4
              weight="demi"
              style={{ marginTop: '16px', marginBottom: '20px' }}
            >
              Assign unmapped info
            </H4>
            <B2 style={{ marginBottom: '24px' }}>
              Assign the unmapped field value from import to QuickBooks field
              value. If required field&apos;s value is unmapped, the time
              entries that contain the value won&apos;t be imported.
            </B2>
          </>
        )}

        {/* Main content with celebration and progress card */}
        <div
          style={{
            display: 'flex',
            gap: hideStepProgress ? 0 : '24px',
            alignItems: 'flex-start',
          }}
        >
          {/* Celebration content - Left side */}
          <div style={{ flex: 1 }}>
            <CelebrationCard>
              <img
                src={CelebrationSvg}
                alt="Celebration"
                style={{ width: '98px', height: '120px', marginBottom: '24px' }}
              />
              <B2 style={{ textAlign: 'center', color: '#393A3D' }}>
                You&apos;re all caught up
              </B2>
              <B2
                style={{
                  textAlign: 'center',
                  color: '#727E85',
                  marginTop: '8px',
                }}
              >
                Generating time entries now
              </B2>
            </CelebrationCard>
          </div>

          {!hideStepProgress && (
            <div style={{ width: '280px', flexShrink: 0 }}>
              <StepProgressCard />
            </div>
          )}
        </div>

        {/* Continue button */}
        <ActionBar>
          <div />
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <BackButton sandbox={sandbox} />
            <Button
              priority="primary"
              theme="gbsgexperimental"
              onClick={handleUserContinue}
              disabled={readOnly}
            >
              Continue
            </Button>
          </div>
        </ActionBar>
      </StepContainer>
    );
  }

  // Compact view: group by field type in labeled cards (e.g. Employee card, Class card)
  if (compactView) {
    return (
      <>
        <StepContainer style={{ position: 'relative' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {fieldMappingsByType.map((group) => (
              <div
                key={group.label}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: '#fafafa',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#f5f5f5',
                    borderBottom: '1px solid #e5e7eb',
                  }}
                >
                  <B3 weight="demi">{group.label}</B3>
                </div>
                <div
                  style={{
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  {group.fields.map((field) => {
                    const fieldKey = `${field.fieldType}-${field.unmatchedValue}`;
                    return (
                      <div
                        key={fieldKey}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <B3 style={{ minWidth: '120px' }}>
                          {field.unmatchedValue}
                        </B3>
                        {renderDropdown(field)}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          {fieldMappings.length > 0 && !readOnly && (
            <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
              <Button
                type="button"
                priority="primary"
                theme="gbsgexperimental"
                onClick={handleContinueClick}
                disabled={readOnly}
              >
                Continue
              </Button>
              {showSkipButton && (
                <Button
                  type="button"
                  priority="secondary"
                  theme="gbsgexperimental"
                  onClick={handleUserContinue}
                >
                  Skip
                </Button>
              )}
            </div>
          )}
        </StepContainer>
        {/* Warning Modal for unmapped required (must be in tree for compact view so Continue works) */}
        <Modal
          open={showWarningModal}
          onClose={handleModalCancel}
          size="medium"
          dismissible
          restoreFocus
        >
          <StyledModalHeader alignment="center">
            <ModalIconImage
              icon={
                <Icon
                  source={TriangleExclamationFill}
                  color="rgb(0, 62, 49)"
                  background={{
                    shape: 'circle',
                    color: 'rgba(0, 62, 49, 0.2)',
                  }}
                />
              }
              size="small"
            />
            <ModalTitle
              title={`${unmappedRequiredCount} required ${
                unmappedRequiredCount === 1
                  ? 'field contains'
                  : 'fields contain'
              } unmapped values`}
            />
          </StyledModalHeader>
          <ModalContent alignment="center">
            <B2>
              {totalAffectedEntries} time{' '}
              {totalAffectedEntries === 1 ? 'entry' : 'entries'} won&apos;t be
              imported. Do you want to continue?
            </B2>
          </ModalContent>
          <StyledModalActions>
            <Button
              type="button"
              priority="secondary"
              theme="gbsgexperimental"
              onClick={handleModalCancel}
            >
              Cancel
            </Button>
            <Button
              type="button"
              priority="primary"
              theme="gbsgexperimental"
              onClick={handleModalContinue}
            >
              Continue
            </Button>
          </StyledModalActions>
        </Modal>
      </>
    );
  }

  return (
    <StepContainer style={{ position: 'relative' }}>
      {!hideTitle && (
        <>
          <H4 weight="demi" style={{ marginTop: '16px', marginBottom: '20px' }}>
            Assign unmapped info
          </H4>
          <B2 style={{ marginBottom: '24px' }}>
            Assign the unmapped field value from import to QuickBooks field
            value. If required field&apos;s value is unmapped, the time entries
            that contain the value won&apos;t be imported.
          </B2>
        </>
      )}

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
                <Table.Cell style={{ width: '20%' }}>
                  <B3 weight="demi">Field type</B3>
                </Table.Cell>
                <Table.Cell style={{ width: '25%' }}>
                  <B3 weight="demi">Unmapped value</B3>
                </Table.Cell>
                <Table.Cell style={{ width: '15%', textAlign: 'center' }}>
                  <B3 weight="demi">Apply to</B3>
                </Table.Cell>
                <Table.Cell style={{ width: '30%' }}>
                  <B3 weight="demi">QuickBooks value</B3>
                </Table.Cell>
                <Table.Cell style={{ width: '10%', textAlign: 'center' }}>
                  <B3 weight="demi">Required</B3>
                </Table.Cell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {fieldMappings.map((field, index) => {
                const fieldKey = `${field.fieldType}-${field.unmatchedValue}`;

                return (
                  <Table.Row key={fieldKey}>
                    <Table.Cell>
                      {getFieldTypeLabel(
                        field.fieldType,
                        field.customFieldName,
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      {field.unmatchedValue}
                      {/* Show "Auto-matched" hint only for fuzzy-matched fields that user hasn't manually changed */}
                      {(() => {
                        const fieldKey = `${field.fieldType}-${field.unmatchedValue}`;
                        const isFuzzyMatched =
                          fuzzyMatchedFieldsRef.current.has(fieldKey);
                        const userHasChanged =
                          localMappings[fieldKey] !== undefined;

                        // Show "Auto-matched" text only if:
                        // 1. It was fuzzy-matched on load
                        // 2. User hasn't manually changed the dropdown yet
                        const shouldShowAutoMatched =
                          isFuzzyMatched &&
                          !userHasChanged &&
                          field.mappedId &&
                          field.mappedName;

                        return shouldShowAutoMatched ? (
                          <div style={{ marginTop: '4px' }}>
                            <B3 style={{ color: '#16825D', fontSize: '12px' }}>
                              ✓ Auto-matched to &quot;{field.mappedName}&quot;
                            </B3>
                          </div>
                        ) : null;
                      })()}
                    </Table.Cell>
                    <Table.Cell style={{ textAlign: 'center' }}>
                      {field.affectedCount}
                    </Table.Cell>
                    <Table.Cell>{renderDropdown(field)}</Table.Cell>
                    <Table.Cell style={{ textAlign: 'center' }}>
                      {(() => {
                        // Employee is always required
                        if (field.fieldType === 'employee') {
                          return (
                            <StyledBadge
                              status="draft"
                              aria-label="Required field"
                            >
                              Required
                            </StyledBadge>
                          );
                        }
                        // Check company settings for other fields
                        const isRequired =
                          (field.fieldType === 'class' &&
                            companySettings?.classRequired) ||
                          (field.fieldType === 'location' &&
                            companySettings?.locationRequired) ||
                          (field.fieldType === 'service' &&
                            companySettings?.serviceItemRequired);

                        return isRequired ? (
                          <StyledBadge
                            status="draft"
                            aria-label="Required field"
                          >
                            Required
                          </StyledBadge>
                        ) : (
                          <StyledBadge
                            status="draft"
                            aria-label="Optional field"
                          >
                            Optional
                          </StyledBadge>
                        );
                      })()}
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
            {(() => {
              if (totalCount === 0) {
                return 'All fields are recognized';
              }
              if (allRequiredMapped) {
                return 'All required fields are mapped';
              }
              return `${matchedCount}/${totalCount} fields mapped`;
            })()}
          </RequiredFieldsText>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <BackButton sandbox={sandbox} />
          <Button
            priority="primary"
            theme="gbsgexperimental"
            onClick={handleContinueClick}
            disabled={readOnly}
          >
            Generate time entries
          </Button>
        </div>
      </ActionBar>

      {/* Warning Modal for unmapped required fields */}
      <Modal
        open={showWarningModal}
        onClose={handleModalCancel}
        size="medium"
        dismissible
        restoreFocus
      >
        <StyledModalHeader alignment="center">
          <ModalIconImage
            icon={
              <Icon
                source={TriangleExclamationFill}
                color="rgb(0, 62, 49)"
                background={{
                  shape: 'circle',
                  color: 'rgba(0, 62, 49, 0.2)',
                }}
              />
            }
            size="small"
          />
          <ModalTitle
            title={`${unmappedRequiredCount} required ${
              unmappedRequiredCount === 1 ? 'field contains' : 'fields contain'
            } unmapped values`}
          />
        </StyledModalHeader>
        <ModalContent alignment="center">
          <B2>
            {totalAffectedEntries} time{' '}
            {totalAffectedEntries === 1 ? 'entry' : 'entries'} won&apos;t be
            imported. Do you want to continue?
          </B2>
        </ModalContent>
        <StyledModalActions>
          <Button
            priority="secondary"
            theme="gbsgexperimental"
            onClick={handleModalCancel}
          >
            Cancel
          </Button>
          <Button
            priority="primary"
            theme="gbsgexperimental"
            onClick={handleModalContinue}
          >
            Continue
          </Button>
        </StyledModalActions>
      </Modal>
    </StepContainer>
  );
};

// Styled Components
const ErrorIcon = styled.span`
  display: inline-block;
  margin-right: 8px;
  vertical-align: middle;
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

const CelebrationCard = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background-color: #ffffff;
  padding: 48px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
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

const StyledModalHeader = styled(ModalHeader)`
  padding-bottom: 0 !important;
  margin-bottom: 16px !important;

  /* Add spacing between icon and title */
  & > div {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
`;

const StyledModalActions = styled(ModalActions)`
  width: 100%;

  & > div {
    display: flex;
    gap: 8px;
    justify-content: space-between !important;
  }
`;

export default Step3FieldMapping;

import React, { useState, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button } from '@ids-ts/button';
import { H3, B2 } from '@ids-ts/typography';
import { Dropdown, MenuItem } from '@ids-ts/dropdown';
import TextField from '@ids-ts/text-field';
import ReviewStickyTable from '../step5Review/ReviewStickyTable';
import {
  removeTimeEntries,
  setSaveError,
  clearFailedEntries,
  setTimeEntries,
  setIsPreparingSave,
} from '../store/reviewSlice';
import { removeEntriesFromExcelData } from '../store/excelDataSlice';
import { setCurrentStep } from '../store/progressSlice';
import { exportTimeEntriesToExcel } from '../utils/excelExport';
import partialSuccessSvg from '../../../../assets/images/partial_success.svg';
import ClassDropdown from '../components/ClassDropdown';
import ServiceDropdown from '../components/ServiceDropdown';
import CustomerDropdown from '../components/CustomerDropdown';
import LocationDropdown from '../components/LocationDropdown';
import { useSaveBulkTimeEntries } from '../hooks/useSaveBulkTimeEntries';

interface PartialErrorScreenProps {
  onRetrySuccess?: () => void;
}

/**
 * Parse error message to extract missing field names
 * Example: "The following fields are required:\n \n• Class"
 */
const parseErrorMessage = (message: string): string[] => {
  const fields: string[] = [];
  const lines = message.split('\\n');

  lines.forEach((line) => {
    // Match lines that start with bullet points (•, -, *)
    const match = line.match(/[•\-*]\s*(.+)/);
    if (match && match[1]) {
      const fieldName = match[1].trim();
      fields.push(fieldName);
    }
  });

  return fields;
};

/**
 * Format error message into a readable reason
 */
const formatErrorReason = (message: string): string => {
  const missingFields = parseErrorMessage(message);
  if (missingFields.length > 0) {
    return `Missing required field${
      missingFields.length > 1 ? 's' : ''
    }: ${missingFields.join(', ')}`;
  }
  return 'Validation error';
};

const PartialErrorScreen: React.FC<PartialErrorScreenProps> = ({
  onRetrySuccess,
}) => {
  const dispatch = useDispatch();

  // Get state from Redux
  const failedEntries = useSelector(
    (state: any) => state.review.failedEntries || [],
  );
  const allTimeEntries = useSelector(
    (state: any) => state.review.timeEntries || [],
  );
  const checkedEntriesFromRedux = useSelector(
    (state: any) => state.review.checkedEntries || [],
  );
  const companySettings = useSelector(
    (state: any) => state.companySettings.settings,
  );
  const customFields = useSelector(
    (state: any) => state.customFields.customFields || [],
  );
  const mappedColumnMappings = useSelector(
    (state: any) => state.excelData.mappedColumnMappings || {},
  );
  const mappedColumnCheckboxes = useSelector(
    (state: any) => state.excelData.mappedColumnCheckboxes || {},
  );
  const timesheetFields = useSelector(
    (state: any) => state.timesheetFieldsData,
  );
  const {
    customers = [],
    services = [],
    classes = [],
    locations = [],
  } = timesheetFields;

  // Smart column visibility: show checked columns + columns with errors + reason
  const visibleColumns = useMemo(() => {
    // Get checked columns from Step 2
    const checkedColumns = Object.entries(mappedColumnMappings)
      .filter(([excelCol]) => mappedColumnCheckboxes[excelCol])
      .map(([_, qbField]) => qbField as string);

    // Extract all error field names from failed entries
    const errorFields = new Set<string>();
    failedEntries.forEach((failedEntry: any) => {
      const missingFields = parseErrorMessage(failedEntry.message);
      missingFields.forEach((field) => {
        const normalizedField = field.toLowerCase();
        // Map common error field names to QB field names
        if (normalizedField.includes('class')) errorFields.add('class');
        if (normalizedField.includes('service'))
          errorFields.add('service item');
        if (
          normalizedField.includes('customer') ||
          normalizedField.includes('client')
        )
          errorFields.add('customer');
        if (normalizedField.includes('location')) errorFields.add('location');
        if (normalizedField.includes('note')) errorFields.add('notes');
        // For custom fields, add the exact field name
        const customField = customFields.find(
          (cf: any) => cf.name.toLowerCase() === normalizedField,
        );
        if (customField) {
          errorFields.add(customField.name);
        }
      });
    });

    // Combine checked columns with error fields (without duplicates)
    const allColumns = Array.from(
      new Set([...checkedColumns, ...Array.from(errorFields)]),
    );

    // Add "Reason" column at the end
    return [...allColumns, 'reason'];
  }, [
    mappedColumnMappings,
    mappedColumnCheckboxes,
    failedEntries,
    customFields,
  ]);

  // Convert checkedEntries to a Set (Redux serializes it as an array)
  const checkedEntriesSet = useMemo(() => {
    if (checkedEntriesFromRedux instanceof Set) {
      return checkedEntriesFromRedux;
    }
    if (Array.isArray(checkedEntriesFromRedux)) {
      return new Set(checkedEntriesFromRedux);
    }
    return new Set();
  }, [checkedEntriesFromRedux]);

  // Local state for selections and field values
  const [localCheckedEntries, setLocalCheckedEntries] = useState<string[]>([]);
  const [fieldValues, setFieldValues] = useState<
    Record<string, Record<string, any>>
  >({});

  // Save hook for retrying after fixes
  const { saveDemoTimeEntries, loading: isSaving } = useSaveBulkTimeEntries({
    onSaveSuccess: () => {
      // Success - navigate to success screen (Step 6)
      dispatch(setCurrentStep(6));
      dispatch(setIsPreparingSave(false));
    },
    onPartialSuccess: (result: any) => {
      // Still have failures - the Redux state will be updated automatically
      // Stay on this screen so user can see the updated errors
      dispatch(setIsPreparingSave(false));
    },
    onSaveFailure: (error) => {
      // Complete failure - stay on this screen
      dispatch(setIsPreparingSave(false));
    },
  });

  // Get the actual checked entries that were sent to the API
  const sentEntries = useMemo(
    () =>
      allTimeEntries.filter((entry: any) => {
        // Convert entry.id to both string and number for comparison
        const entryId = entry.id;
        return (
          checkedEntriesSet.has(entryId) ||
          checkedEntriesSet.has(String(entryId)) ||
          checkedEntriesSet.has(Number(entryId))
        );
      }),
    [allTimeEntries, checkedEntriesSet],
  );

  // Build a map of failed entry indices to their error details
  const failedEntriesMap = useMemo(() => {
    const map = new Map<
      number,
      {
        errorCode: string;
        message: string;
        missingFields: string[];
        entry: any;
      }
    >();

    failedEntries.forEach((failedEntry: any) => {
      const missingFields = parseErrorMessage(failedEntry.message);
      const actualEntry = sentEntries[failedEntry.index]; // Map index to actual sent entry

      if (actualEntry) {
        map.set(failedEntry.index, {
          errorCode: failedEntry.errorCode,
          message: failedEntry.message,
          missingFields: missingFields.map((f) => f.toLowerCase()),
          entry: actualEntry,
        });
      }
    });

    return map;
  }, [failedEntries, sentEntries]);

  // Get the actual failed time entries with reason added
  const failedTimeEntries = useMemo(
    () =>
      Array.from(failedEntriesMap.values()).map((item) => ({
        ...item.entry,
        reason: formatErrorReason(item.message), // Add reason field
      })),
    [failedEntriesMap],
  );

  // Build error highlights map for the table
  const errorHighlights = useMemo(() => {
    const highlights: Record<string, string[]> = {};

    failedEntriesMap.forEach((errorInfo) => {
      if (errorInfo.entry) {
        highlights[errorInfo.entry.id] = errorInfo.missingFields;
      }
    });

    return highlights;
  }, [failedEntriesMap]);

  // Handle checkbox changes
  const handleCheckboxChange = useCallback(
    (entryId: string | number, checked: boolean) => {
      const id = String(entryId);
      setLocalCheckedEntries((prev) => {
        if (checked) {
          return [...prev, id];
        }
        return prev.filter((prevId) => prevId !== id);
      });
    },
    [],
  );

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setLocalCheckedEntries(failedTimeEntries.map((e: any) => e.id));
      } else {
        setLocalCheckedEntries([]);
      }
    },
    [failedTimeEntries],
  );

  // Handle remove action - remove entries completely
  const handleRemove = useCallback(() => {
    if (localCheckedEntries.length === 0) return;

    // Remove selected entries from Redux
    dispatch(removeTimeEntries(localCheckedEntries));
    dispatch(removeEntriesFromExcelData(localCheckedEntries));

    // Clear local selection
    setLocalCheckedEntries([]);

    // If all failed entries are removed, clear the error state
    const remainingFailed = failedTimeEntries.filter(
      (e: any) => !localCheckedEntries.includes(e.id),
    );

    if (remainingFailed.length === 0) {
      dispatch(clearFailedEntries());
      dispatch(setSaveError(null));
      if (onRetrySuccess) {
        onRetrySuccess();
      }
    }
  }, [localCheckedEntries, dispatch, failedTimeEntries, onRetrySuccess]);

  // Handle field change for quick fill
  const handleFieldChange = useCallback(
    (entryId: string, field: string, value: any, valueId?: any) => {
      setFieldValues((prev) => ({
        ...prev,
        [entryId]: {
          ...(prev[entryId] || {}),
          [field]: value,
          [`${field}Id`]: valueId,
        },
      }));
    },
    [],
  );

  // Handle save - update entries with field values and retry save
  const handleSave = useCallback(() => {
    if (localCheckedEntries.length === 0) return;

    // Show processing indicator
    dispatch(setIsPreparingSave(true));

    // Update the time entries with the fixed field values
    const updatedEntries = allTimeEntries.map((entry: any) => {
      if (localCheckedEntries.includes(entry.id) && fieldValues[entry.id]) {
        return {
          ...entry,
          ...fieldValues[entry.id],
        };
      }
      return entry;
    });

    // Update Redux with the corrected entries
    dispatch(setTimeEntries(updatedEntries));

    // Get only the selected entries to retry and ensure they have proper field mappings
    const entriesToSave = updatedEntries
      .filter((e: any) => localCheckedEntries.includes(e.id))
      .map((entry: any) => ({
        ...entry,
        // Ensure timeForId is set (required by GraphQL mutation)
        timeForId: entry.employeeId || entry.timeForId,
        // Ensure all ID fields are properly mapped
        classId: entry.classId || entry.classID || '',
        serviceItemId: entry.serviceItemId || entry.serviceItemID || '',
        locationId:
          entry.locationId || entry.locationID || entry.departmentID || '',
        customerId: entry.customerId || entry.customerID || '',
      }));

    // Retry saving
    saveDemoTimeEntries(entriesToSave);
  }, [
    localCheckedEntries,
    fieldValues,
    allTimeEntries,
    dispatch,
    saveDemoTimeEntries,
  ]);

  // Handle export to Excel
  const handleExportToExcel = useCallback(() => {
    exportTimeEntriesToExcel(failedTimeEntries, 'failed_time_entries.xlsx');
  }, [failedTimeEntries]);

  // Render quick fill dropdown for a field
  const renderQuickFill = useCallback(
    (entry: any, field: string) => {
      const entryFieldValues = fieldValues[entry.id] || {};
      const currentValue = entryFieldValues[field] || entry[field] || '';
      const currentValueId =
        entryFieldValues[`${field}Id`] || entry[`${field}Id`] || '';

      const baseProps = {
        value: currentValueId,
        onChange: (selectedId: string, selectedItem: any) => {
          handleFieldChange(
            entry.id,
            field,
            selectedItem?.name || selectedItem?.fullName,
            selectedId,
          );
        },
        disabled: false,
        addNew: true,
      };
      const customField = customFields.find((cf: any) => cf.name === field);

      switch (field) {
        case 'class':
          return <ClassDropdown {...baseProps} classValue={currentValue} />;
        case 'service item':
          return <ServiceDropdown {...baseProps} serviceValue={currentValue} />;
        case 'customer':
          return (
            <CustomerDropdown {...baseProps} customerValue={currentValue} />
          );
        case 'location':
          return (
            <LocationDropdown {...baseProps} locationValue={currentValue} />
          );
        default:
          // For custom fields or text fields
          if (customField) {
            if (customField.type === 'DROPDOWN') {
              // Custom field dropdown
              const options = customField.options || [];
              return (
                <Dropdown
                  value={currentValueId}
                  onChange={(e: any) => {
                    const selectedId = e?.target?.value;
                    if (!selectedId) return;
                    const selectedOption = options.find(
                      (opt: any) => opt.id === selectedId,
                    );
                    if (selectedOption) {
                      handleFieldChange(
                        entry.id,
                        field,
                        selectedOption.name,
                        selectedId,
                      );
                    }
                  }}
                  placeholder="Select an option"
                >
                  <MenuItem value="">Select an option</MenuItem>
                  {options.map((option: any) => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.name}
                    </MenuItem>
                  ))}
                </Dropdown>
              );
            }
            // Custom field text
            return (
              <TextField
                value={currentValue}
                onChange={(e) =>
                  handleFieldChange(entry.id, field, e.target.value)
                }
                placeholder={`Enter ${field}`}
                size="small"
              />
            );
          }
          // Default text field for notes or other fields
          return (
            <TextField
              value={currentValue}
              onChange={(e) =>
                handleFieldChange(entry.id, field, e.target.value)
              }
              placeholder={`Enter ${field}`}
              size="small"
            />
          );
      }
    },
    [fieldValues, customFields, handleFieldChange],
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '24px',
        gap: '24px',
      }}
    >
      {/* Header Section */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          paddingBottom: '24px',
          borderBottom: '1px solid #e0e0e0',
          textAlign: 'center',
        }}
      >
        {/* Illustration - Centered */}
        <img
          src={partialSuccessSvg}
          alt="Partial Success"
          style={{ width: '180px', height: 'auto', marginBottom: '8px' }}
        />

        {/* Text Content - Centered */}
        <div style={{ maxWidth: '600px' }}>
          <H3 style={{ marginBottom: '12px', color: '#000' }}>
            Some time entries could not be saved
          </H3>
          <B2 style={{ color: '#6c757d', marginBottom: '8px' }}>
            {failedEntries.length} time{' '}
            {failedEntries.length === 1 ? 'entry' : 'entries'} failed due to
            missing required fields. Fix the highlighted fields directly in the
            table, then save.
          </B2>
          <B2 style={{ color: '#6c757d' }}>
            Or select entries to remove them from the import.
          </B2>
        </div>
      </div>

      {/* Table Section */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <ReviewStickyTable
          timeEntries={failedTimeEntries}
          mappedColumns={visibleColumns}
          mappedColumnMappings={mappedColumnMappings}
          checkedEntries={localCheckedEntries}
          onCheckboxChange={handleCheckboxChange}
          onSelectAll={handleSelectAll}
          onFieldChange={(entryId: number, field: string, value: any) => {
            // For standard fields with IDs (class, service, customer, location)
            if (
              field === 'class' ||
              field === 'service item' ||
              field === 'customer' ||
              field === 'location'
            ) {
              handleFieldChange(String(entryId), field, value, value); // value is the ID
            } else {
              // For text fields (notes, custom fields)
              handleFieldChange(String(entryId), field, value);
            }
          }}
          notesRequired={
            companySettings?.timeSheetEntryMakesNotesRequiredEnabled || false
          }
          companySettings={companySettings}
          customFields={customFields}
          errorHighlights={errorHighlights}
          showErrorsOnly
        />
      </div>

      {/* Action Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '16px',
          borderTop: '1px solid #e0e0e0',
        }}
      >
        <B2 style={{ color: '#6c757d' }}>
          {localCheckedEntries.length}{' '}
          {localCheckedEntries.length === 1 ? 'entry' : 'entries'} selected
        </B2>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Button
            priority="tertiary"
            purpose="standard"
            theme="gbsgexperimental"
            onClick={handleExportToExcel}
          >
            Export to Excel
          </Button>
          <Button
            priority="secondary"
            purpose="standard"
            theme="gbsgexperimental"
            onClick={handleRemove}
            disabled={localCheckedEntries.length === 0}
          >
            Remove Selected
          </Button>
          <Button
            priority="primary"
            purpose="standard"
            theme="gbsgexperimental"
            onClick={handleSave}
            disabled={localCheckedEntries.length === 0}
            isLoading={isSaving}
          >
            Save Selected
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PartialErrorScreen;

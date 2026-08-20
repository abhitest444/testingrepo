import React, { useMemo } from 'react';
import { useIntl, useTracking } from '@payroll/quicksand';
import styled from 'styled-components';
import TextField from '@ids-ts/text-field';
import DropdownTypeahead, { MenuItem } from '@ids-ts/dropdown-typeahead';
import {
  ReactEvent,
  OnChangeInfoType,
} from '@ids-ts/dropdown-typeahead/dist/types';
import { getOptionIdByLabel } from 'src/js/widgets/common/customFields/utils';
import { useWeeklyTimeTrackingPoints } from '../../hooks/useWeeklyTimeTrackingPoints';
import { useAppDispatch, useAppSelector } from '../../store';
import { selectSelectedCell, selectCustomFields } from '../../store/selectors';
import { updateCell, timeEntryDetails } from '../../store/timeEntryGridSlice';

const CustomFieldsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

const CustomFieldWrapper = styled.div`
  width: 100%;
`;

interface WeeklyCustomFieldsProps {
  disabled?: boolean;
  displayCell: timeEntryDetails | null;
  fieldErrors?: { [fieldId: string]: string };
  visibleCustomFieldIds?: Set<string> | null; // Assignment-filtered CF IDs
  getCustomFieldOptions?: ((customFieldId: string) => any[] | null) | null; // CFO getter function
  shouldUseAssignments?: boolean; // Whether to use assignment logic
}

/**
 * Component for rendering custom fields in the weekly time entry panel
 *
 * Assignment Logic:
 * - Custom Field Visibility: Determined by `visibleCustomFieldIds` from assignments
 * - Custom Field Options: Filtered by `getCustomFieldOptions` for dropdown CFs
 * - Required CFs with no assigned options: not shown (visibility) and not validated (effective required = false here)
 * - Falls back to showing all CFs/options when assignments not available
 *
 * Handles text, number, and dropdown field types.
 */
export const WeeklyCustomFields: React.FC<WeeklyCustomFieldsProps> = ({
  disabled = false,
  displayCell,
  fieldErrors = {},
  visibleCustomFieldIds = null,
  getCustomFieldOptions = null,
  shouldUseAssignments = false,
}) => {
  const intl = useIntl();
  const track = useTracking();
  const trackingPoints = useWeeklyTimeTrackingPoints();
  const dispatch = useAppDispatch();
  const selectedCell = useAppSelector(selectSelectedCell);
  const customFields = useAppSelector(selectCustomFields);

  // Filter custom fields by assignment visibility
  const activeCustomFields = useMemo(() => {
    const nonDeleted = (customFields as any[]).filter(
      (field) => !field.deleted,
    );

    // If using assignments and we have visible IDs, filter by them
    if (shouldUseAssignments && visibleCustomFieldIds) {
      return nonDeleted.filter((field) => visibleCustomFieldIds.has(field.id));
    }

    // Otherwise show all non-deleted fields
    return nonDeleted;
  }, [customFields, visibleCustomFieldIds, shouldUseAssignments]);

  // Effective required: for dropdown/multi_select, require only if we have options to choose from.
  // When using assignments: only if getCustomFieldOptions returns options (assigned options).
  // When not using assignments: use field.options so required indicator shows when field has options.
  const getEffectiveRequired = (field: any) => {
    if (!field.required) return false;
    const type = field.type?.toUpperCase();
    const isDropdown =
      type === 'DROPDOWN' ||
      type === 'MULTI_SELECT' ||
      (field.options && field.options.length > 0);
    if (!isDropdown) return true;
    if (getCustomFieldOptions) {
      const options = getCustomFieldOptions(field.id);
      return Array.isArray(options) && options.length > 0;
    }
    return (
      field.options && Array.isArray(field.options) && field.options.length > 0
    );
  };

  // If no custom fields are available, don't render anything
  if (!activeCustomFields.length) {
    return null;
  }

  const handleCustomFieldChange = (
    fieldId: string,
    fieldName: string,
    value: string,
    optionID?: string,
  ) => {
    if (!selectedCell) return;

    // For number fields, prevent negative values by capping to 0
    const field = activeCustomFields.find((f) => f.id === fieldId);
    let processedValue = value;

    if (field?.type === 'number') {
      const numValue = Number(value);
      if (!Number.isNaN(numValue)) {
        processedValue = Math.max(0, numValue).toString();
      }
    }

    dispatch(
      updateCell({
        rowId: selectedCell.rowId,
        dayIdx: selectedCell.dayIdx,
        value: {
          customFields: [
            ...(displayCell?.customFields || []).filter(
              (cf) => cf.id !== fieldId,
            ),
            {
              id: fieldId,
              name: fieldName,
              value: processedValue,
              ...(optionID && { optionID }), // Include optionID for dropdown fields
            },
          ],
        },
      }),
    );
  };

  const renderTextField = (field: any, index: number) => {
    const currentValue =
      displayCell?.customFields?.find((cf) => cf.id === field.id)?.value || '';

    return (
      <CustomFieldWrapper key={field.id}>
        <TextField
          data-testid={`custom-field-${field.id}`}
          name={`custom-field-${field.id}`}
          value={currentValue}
          onChange={(e) =>
            handleCustomFieldChange(field.id, field.name, e.target.value)
          }
          onFocus={() =>
            track({
              ...trackingPoints.CUSTOM_FIELD_TEXT,
              object_detail:
                trackingPoints.CUSTOM_FIELD_TEXT.object_detail! + index,
              ui_object_detail:
                trackingPoints.CUSTOM_FIELD_TEXT.ui_object_detail! + index,
            })
          }
          disabled={!selectedCell || disabled}
          width="100%"
          label={getEffectiveRequired(field) ? `${field.name} *` : field.name}
          aria-label={
            getEffectiveRequired(field) ? `${field.name} *` : field.name
          }
          size="medium"
          errorText={fieldErrors[field.id]}
        />
      </CustomFieldWrapper>
    );
  };

  const renderNumberField = (field: any, index: number) => {
    const currentValue =
      displayCell?.customFields?.find((cf) => cf.id === field.id)?.value || '';

    return (
      <CustomFieldWrapper key={field.id}>
        <TextField
          data-testid={`custom-field-${field.id}`}
          name={`custom-field-${field.id}`}
          value={currentValue}
          onChange={(e) =>
            handleCustomFieldChange(field.id, field.name, e.target.value)
          }
          onFocus={() =>
            track({
              ...trackingPoints.CUSTOM_FIELD_NUMBER,
              object_detail:
                trackingPoints.CUSTOM_FIELD_NUMBER.object_detail! + index,
              ui_object_detail:
                trackingPoints.CUSTOM_FIELD_NUMBER.ui_object_detail! + index,
            })
          }
          type="number"
          min={0}
          disabled={!selectedCell || disabled}
          width="100%"
          label={getEffectiveRequired(field) ? `${field.name} *` : field.name}
          aria-label={
            getEffectiveRequired(field) ? `${field.name} *` : field.name
          }
          size="medium"
          errorText={fieldErrors[field.id]}
        />
      </CustomFieldWrapper>
    );
  };

  const renderDropdownField = (field: any, index: number) => {
    const currentValue =
      displayCell?.customFields?.find((cf) => cf.id === field.id)?.value || '';

    // Get options from CFO assignments when using assignments; empty CFO = no options (do not fall back to all)
    let options = field.options || [];

    if (shouldUseAssignments && getCustomFieldOptions) {
      const assignedOptions = getCustomFieldOptions(field.id);
      if (Array.isArray(assignedOptions)) {
        options = assignedOptions.map((opt: any) => ({
          id: opt.id,
          name: opt.name,
          deleted: false, // Assigned options are active
        }));
      }
    }

    // Filter out deleted options to only show active options in the UI
    const activeOptions = options.filter((option: any) => !option.deleted);
    const dropdownOptions = activeOptions.map((option: any) => ({
      value: option.id,
      label: option.name,
    }));

    const selectedOption = dropdownOptions.find(
      (option: any) => option.label === currentValue, // Find by label since currentValue is the display name
    );

    return (
      <CustomFieldWrapper key={field.id}>
        <DropdownTypeahead
          data-testid={`custom-field-${field.id}`}
          value={currentValue || ''}
          inputValue={selectedOption?.label || ''}
          onChange={(e: ReactEvent, info?: OnChangeInfoType) => {
            if (info?.selectedItem?.label) {
              // Get the optionID using the utility function
              const optionID = getOptionIdByLabel(
                options,
                info.selectedItem.label,
              );

              handleCustomFieldChange(
                field.id,
                field.name,
                info.selectedItem.label,
                optionID, // Pass the optionID
              );
            }
          }}
          onFocus={() =>
            track({
              ...trackingPoints.CUSTOM_FIELD_DROPDOWN,
              object_detail:
                trackingPoints.CUSTOM_FIELD_DROPDOWN.object_detail! + index,
              ui_object_detail:
                trackingPoints.CUSTOM_FIELD_DROPDOWN.ui_object_detail! + index,
            })
          }
          disabled={!selectedCell || disabled}
          width="100%"
          aria-label={
            getEffectiveRequired(field) ? `${field.name} *` : field.name
          }
          label={getEffectiveRequired(field) ? `${field.name} *` : field.name}
          dataSource={dropdownOptions}
          addNew={false}
          errorText={fieldErrors[field.id]}
          renderItem={(
            dropdownItem: { value?: string; label?: string },
            index?: number,
          ) => (
            <MenuItem key={`${index}`} value={dropdownItem.value || ''}>
              {dropdownItem.label || ''}
            </MenuItem>
          )}
        />
      </CustomFieldWrapper>
    );
  };

  const renderField = (field: any, index: number) => {
    // Check if it's a dropdown by looking at options or type (case-insensitive)
    const hasOptions = field.options && field.options.length > 0;
    const type = field.type?.toLowerCase();

    switch (type) {
      case 'text':
        return renderTextField(field, index + 1);
      case 'number':
        return renderNumberField(field, index + 1);
      case 'dropdown':
      case 'multi_select':
      case 'string':
        // If it has options, treat it as a dropdown regardless of type
        if (hasOptions) {
          return renderDropdownField(field, index + 1);
        }
        return renderTextField(field, index + 1);
      default:
        // Default to text field
        return renderTextField(field, index + 1);
    }
  };

  return (
    <CustomFieldsContainer data-testid="custom-fields">
      {activeCustomFields.map(renderField)}
    </CustomFieldsContainer>
  );
};

export default WeeklyCustomFields;

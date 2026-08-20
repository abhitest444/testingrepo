import React, { useEffect, useRef, useMemo } from 'react';
import {
  useFormContext,
  Controller,
  ControllerRenderProps,
  FieldError,
  useWatch,
} from 'react-hook-form';
import { useIntl, useTracking, useSandbox } from '@payroll/quicksand';
import styled from 'styled-components';
import TextField from '@ids-ts/text-field';
import DropdownTypeahead, { MenuItem } from '@ids-ts/dropdown-typeahead';
import {
  ReactEvent,
  OnChangeInfoType,
} from '@ids-ts/dropdown-typeahead/dist/types';
import { TrackingPoints } from 'src/js/common/useClickTracking';
import {
  CUSTOM_FIELD_TYPES,
  CUSTOM_FIELDS_FORM_NAME,
  CUSTOM_FIELDS_TEST_IDS,
} from './constants';
import {
  CustomField,
  getFieldType,
  mapCustomFieldsToFormObject,
  mapDropdownOptions,
  findSelectedDropdownOption,
  getOptionIdByLabel,
} from './utils';

// Styled components for layout
const CustomFieldContainer = styled.div`
  margin-bottom: 6px;
  justify-items: left;
`;

const FormRow = styled.div`
  margin-top: 20px;

  &.singleTimeEntry {
    margin-top: 0;
  }
`;

interface CustomFieldsProps {
  customFields: CustomField[];
  readOnly?: boolean;
  className?: string;
  trackingPoint: TrackingPoints;
  customFieldOptionAssignments?: Record<string, any[]>; // CFO data for filtering dropdown options
  shouldUseAssignments?: boolean; // Whether to use assignment-based filtering
}

// Type for the form field object from React Hook Form
type FormFieldProps = ControllerRenderProps;

/**
 * Component to display a list of custom fields based on their types
 */
const CustomFields: React.FC<CustomFieldsProps> = ({
  customFields = [],
  readOnly = false,
  className,
  trackingPoint,
  customFieldOptionAssignments,
  shouldUseAssignments = false,
}) => {
  const intl = useIntl();
  const { control, setValue, setError } = useFormContext();
  const formContext = useFormContext();
  const track = useTracking();
  const sandbox = useSandbox();
  const isLocked = useWatch({
    name: 'isLocked',
    defaultValue: false,
  });
  // Simple initialization - run once when custom fields are available
  const initialized = useRef(false);
  const customFieldIds = useMemo(
    () => (customFields || []).map((f) => f.id).join(','),
    [customFields],
  );

  useEffect(() => {
    // Only initialize once and when we have custom fields
    if (initialized.current || !customFields || customFields.length === 0) {
      return;
    }

    const formCustomFieldData = mapCustomFieldsToFormObject(customFields);
    setValue(CUSTOM_FIELDS_FORM_NAME, formCustomFieldData, {
      shouldDirty: false,
      shouldTouch: false,
    });

    // Derive optionID for dropdown fields during initialization
    customFields.forEach((field) => {
      if (field.value && field.options && field.options.length > 0) {
        const optionID = getOptionIdByLabel(field.options, String(field.value));
        if (optionID) {
          setValue(`customFields.${field.id}.optionID`, optionID, {
            shouldDirty: false,
            shouldTouch: false,
          });
        }
      }
    });

    sandbox.logger.info('Component=CustomFields Event=Mounted');
    track(trackingPoint.CUSTOM_FIELD_LIST);
    initialized.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customFieldIds]); // Only depend on the stable ID string to prevent excessive re-runs

  const renderTextField = (
    field: CustomField,
    formField: FormFieldProps,
    error?: FieldError,
  ) => {
    const { onChange, onBlur, value, ref, name: fieldName } = formField;
    const label = field.required ? `${field.name} *` : field.name;
    return (
      <TextField
        name={fieldName}
        value={value ?? ''}
        onChange={(e) => {
          onChange(e);
          // Manually clear the error when user types
          setError(fieldName, { type: 'custom', message: undefined });
        }}
        onBlur={() => {
          onBlur();
          track(trackingPoint.CUSTOM_FIELD_TEXT);
        }}
        ref={ref}
        readOnly={readOnly || isLocked}
        width="100%"
        label={label}
        aria-label={field.name}
        errorText={error?.message}
        size="medium"
      />
    );
  };

  const renderNumberField = (
    field: CustomField,
    formField: FormFieldProps,
    error?: FieldError,
  ) => {
    const { onChange, onBlur, value, ref, name: fieldName } = formField;
    const label = field.required ? `${field.name} *` : field.name;
    return (
      <TextField
        name={fieldName}
        value={value ?? ''}
        onChange={(e) => {
          // this would be triggered when user manually types in the number field
          const numValue = Number(e.target.value);
          if (e.target.value === '' || !Number.isNaN(numValue)) {
            // Cap negative values to 0
            const cappedValue = Math.max(0, numValue);
            const modifiedEvent = {
              ...e,
              target: { ...e.target, value: cappedValue.toString() },
            };
            onChange(modifiedEvent);
            // Manually clear the error when user types
            setError(fieldName, { type: 'custom', message: undefined });
          }
        }}
        onBlur={() => {
          onBlur();
          track(trackingPoint.CUSTOM_FIELD_NUMBER);
        }}
        ref={ref}
        type="number"
        readOnly={readOnly || isLocked}
        width="100%"
        min={0} // this would be triggered if the user changes the value using key down
        label={label}
        aria-label={field.name}
        errorText={error?.message}
        size="medium"
      />
    );
  };

  const renderDropdownField = (
    field: CustomField,
    formField: FormFieldProps,
    error?: FieldError,
  ) => {
    const { onChange, value, name: fieldName } = formField;

    // Get options from CFO assignments if available, otherwise use field.options
    let options = field.options || [];

    if (shouldUseAssignments && customFieldOptionAssignments) {
      const assignedOptions = customFieldOptionAssignments[field.id];
      if (assignedOptions && assignedOptions.length > 0) {
        // Use assigned options, mapping CFO structure to field.options structure
        options = assignedOptions.map((opt: any) => ({
          id: opt.id,
          name: opt.name,
          deleted: false, // Assigned options are active
        }));
      } else if (assignedOptions !== undefined) {
        // If assignedOptions is explicitly empty array, show no options
        options = [];
      }
    }

    const dropdownOptions = mapDropdownOptions(options);
    const selectedOption = findSelectedDropdownOption(options, value);
    const label = field.required ? `${field.name} *` : field.name;

    // Enhanced onChange that handles both the value and optionID
    const handleDropdownChange = (selectedLabel: string) => {
      // Update the main value field with the selected label
      onChange(selectedLabel);

      // Also update the optionID field for the same custom field
      const optionID = getOptionIdByLabel(options, selectedLabel);
      if (optionID) {
        const optionIDFieldName = `customFields.${field.id}.optionID`;
        setValue(optionIDFieldName, optionID);
      }

      // Manually clear the error when a selection is made
      setError(fieldName, { type: 'custom', message: undefined });
    };

    return (
      <DropdownTypeahead
        value={value || ''}
        inputValue={selectedOption?.label || ''}
        onChange={(e: ReactEvent, info?: OnChangeInfoType) => {
          if (info?.selectedItem?.label) {
            handleDropdownChange(info.selectedItem.label);
          }
        }}
        onBlur={() => {
          track(trackingPoint.CUSTOM_FIELD_DROPDOWN);
        }}
        disabled={readOnly || isLocked}
        width="100%"
        errorText={error?.message}
        aria-label={field.name}
        label={label}
        dataSource={dropdownOptions}
        addNew={false}
        renderItem={(
          dropdownItem: { value?: string; label?: string },
          index?: number,
        ) => (
          <MenuItem key={`${index}`} value={dropdownItem.value || ''}>
            {dropdownItem.label || ''}
          </MenuItem>
        )}
      />
    );
  };

  const renderFieldContent = (
    field: CustomField,
    formField: FormFieldProps,
    error?: FieldError,
  ) => {
    const fieldType = getFieldType(field.type || CUSTOM_FIELD_TYPES.TEXT);

    switch (fieldType) {
      case 'text':
        return renderTextField(field, formField, error);
      case 'number':
        return renderNumberField(field, formField, error);
      case 'dropdown':
        return renderDropdownField(field, formField, error);
      default:
        return renderTextField(field, formField, error);
    }
  };

  const renderCustomField = (field: CustomField) => {
    if (field.deleted) return null;

    // Use field ID instead of index to maintain stable field names
    const name = `${CUSTOM_FIELDS_FORM_NAME}.${field.id}`;
    const isRequired = field.required;

    return (
      <CustomFieldContainer
        key={field.id}
        data-testid={CUSTOM_FIELDS_TEST_IDS.FIELD_CONTAINER}
      >
        <Controller
          name={name}
          control={control}
          defaultValue={{
            id: field.id,
            name: field.name,
            value: field.value || '',
            optionID: field.optionID || '',
            required: field.required || false,
            deleted: field.deleted || false,
          }}
          rules={{
            validate: (value) => {
              if (isRequired && (!value?.value || value?.value.trim() === '')) {
                return intl.formatMessage({
                  id: 'drawer.field.required',
                  defaultMessage: 'This field is required',
                });
              }
              return undefined;
            },
          }}
          render={({ field: formField, fieldState: { error } }) => {
            // Create a formField-like object for the value field only
            const valueFormField = {
              ...formField,
              value: formField.value?.value || '',
              onChange: (e: any) => {
                formField.onChange({
                  ...formField.value,
                  value: e.target ? e.target.value : e,
                });
              },
            };

            return renderFieldContent(field, valueFormField, error);
          }}
        />
      </CustomFieldContainer>
    );
  };

  if (!customFields || customFields.length === 0) return null;

  return (
    <FormRow className={className} data-testid={CUSTOM_FIELDS_TEST_IDS.WIDGET}>
      {customFields.map(renderCustomField)}
    </FormRow>
  );
};

export default CustomFields;

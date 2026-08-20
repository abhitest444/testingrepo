import {
  TimeTracking_CustomFieldDefinition,
  TimeTracking_CustomFieldInput,
} from 'src/__generated__/timeTracking/graphql';
import { CUSTOM_FIELD_TYPES, FIELD_TYPE_MAPPINGS } from './constants';

export interface CustomFieldOption {
  id: string;
  name: string;
  deleted: boolean;
}

export interface CustomField {
  id: string;
  name: string;
  type?: string;
  deleted: boolean;
  required: boolean;
  value?: string | number | boolean | null;
  optionID?: string; // For dropdown fields - the selected option's ID
  options?: CustomFieldOption[];
}

/**
 * Maps raw custom fields from API to component interface
 * Used across singletimeform and admin clock screens
 */
export const mapCustomFieldsToComponentInterface = (
  rawCustomFields?: TimeTracking_CustomFieldDefinition[],
  formCustomFields?: Record<
    string,
    {
      id: string;
      name: string;
      value?: string;
      optionID?: string;
    }
  >,
): CustomField[] => {
  if (!rawCustomFields) return [];

  return rawCustomFields.map((field) => {
    // Find matching form field by ID to get the actual value
    const formField = formCustomFields?.[field.id];

    return {
      id: field.id,
      name: field.name.trim(),
      type:
        field.type === CUSTOM_FIELD_TYPES.TEXT &&
        field.options &&
        field.options.length > 0
          ? CUSTOM_FIELD_TYPES.DROPDOWN
          : field.type,
      deleted: field.deleted,
      required: field.required || false,
      value: formField?.value || undefined, // Use form value if available
      optionID: formField?.optionID || undefined, // Store optionID for dropdown fields
      options: Array.isArray(field.options)
        ? field.options.map((option) => ({
            id: option.id || '',
            name: option.name.trim() || '',
            deleted: option.deleted,
          }))
        : [],
    };
  });
};

/**
 * Maps custom fields to form object structure for react-hook-form (ID-based)
 */
export const mapCustomFieldsToFormObject = (
  customFields: CustomField[],
): Record<string, CustomField> => {
  const formObject: Record<string, CustomField> = {};
  customFields.forEach((field) => {
    formObject[field.id] = {
      id: field.id,
      name: field.name,
      value: field.value || '',
      optionID:
        field.optionID ||
        (field.value && field.options?.length
          ? getOptionIdByLabel(field.options, String(field.value))
          : undefined),
      required: field.required,
      deleted: field.deleted,
    };
  });
  return formObject;
};

export const mapCustomFieldsToPayload = (
  customFields: CustomField[],
): TimeTracking_CustomFieldInput[] =>
  customFields.map((field) => ({
    id: field.id,
    name: field.name,
    value: field.value ? String(field.value) : '',
    optionID: field.optionID || '',
  }));
/**
 * Gets the field type for rendering based on the custom field type
 */
export const getFieldType = (type: string): string =>
  FIELD_TYPE_MAPPINGS[type as keyof typeof FIELD_TYPE_MAPPINGS] || 'text';

/**
 * Maps dropdown options to component format
 */
export const mapDropdownOptions = (options: CustomFieldOption[]) =>
  options
    .filter((opt) => !opt.deleted)
    .map((opt) => ({
      value: opt.id,
      label: opt.name,
    }));

/**
 * Finds selected option for dropdown fields by value (label)
 */
export const findSelectedDropdownOption = (
  options: CustomFieldOption[],
  value: string | number | boolean | null,
) => mapDropdownOptions(options).find((opt) => opt.label === value);

/**
 * Finds selected option for dropdown fields by optionID
 */
export const findSelectedDropdownOptionById = (
  options: CustomFieldOption[],
  optionID: string,
) => mapDropdownOptions(options).find((opt) => opt.value === optionID);

/**
 * Gets the option ID for a given option label
 */
export const getOptionIdByLabel = (
  options: CustomFieldOption[],
  label: string,
): string | undefined => {
  const option = options.find((opt) => opt.name === label && !opt.deleted);
  return option?.id;
};

/**
 * Gets the option label for a given option ID
 */
export const getOptionLabelById = (
  options: CustomFieldOption[],
  optionID: string,
): string | undefined => {
  const option = options.find((opt) => opt.id === optionID && !opt.deleted);
  return option?.name;
};

/**
 * Validates custom fields for required values
 */
export const validateCustomFields = (
  customFields: CustomField[],
  getErrorMessage: (messageId: string, defaultMessage: string) => string,
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  let isValid = true;

  customFields.forEach((field, index) => {
    if (
      field.required &&
      (!field.value || field.value.toString().trim() === '')
    ) {
      const fieldPath = `customFields.${index}.value`;
      errors[fieldPath] = getErrorMessage('drawer.field.required', 'Required');
      isValid = false;
    }
  });

  return { isValid, errors };
};

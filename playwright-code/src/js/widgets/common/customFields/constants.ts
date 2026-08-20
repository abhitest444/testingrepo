// Custom field types based on the reference code
export const CUSTOM_FIELD_TYPES = {
  TEXT: 'string',
  NUMBER: 'number',
  DROPDOWN: 'dropdown',
} as const;

// Field type mappings for rendering
export const FIELD_TYPE_MAPPINGS = {
  [CUSTOM_FIELD_TYPES.TEXT]: 'text',
  [CUSTOM_FIELD_TYPES.NUMBER]: 'number',
  [CUSTOM_FIELD_TYPES.DROPDOWN]: 'dropdown',
} as const;

// Form field names
export const CUSTOM_FIELDS_FORM_NAME = 'customFields';
export const FORM_CONTROL_ACTION_CHANGE = 'change';

// Test IDs
export const CUSTOM_FIELDS_TEST_IDS = {
  WIDGET: 'custom-fields-widget',
  FIELD_CONTAINER: 'custom-field-container',
} as const;

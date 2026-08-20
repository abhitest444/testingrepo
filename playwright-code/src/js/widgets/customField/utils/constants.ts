export const CUSTOM_FIELDS_TABLE_COLUMNS = [
  { key: 'name', translationKey: 'customFields.table.name' },
  { key: 'type', translationKey: 'customFields.table.type' },
  { key: 'status', translationKey: 'customFields.table.status' },
  { key: 'required', translationKey: 'customFields.table.required' },
  { key: 'actions', translationKey: 'customFields.table.actions' },
] as const;

// New assignment columns (only used when feature flag is enabled)
export const ASSIGNMENT_COLUMNS = [
  {
    key: 'customersAssigned',
    translationKey: 'customFields.table.customers-assigned',
  },
  {
    key: 'teamAssigned',
    translationKey: 'customFields.table.team-assigned',
  },
] as const;

export const PAGINATION_DEFAULTS = {
  DEFAULT_PAGE: 1 as number,
  DEFAULT_PAGE_SIZE: 7 as number,
} as const;

export const TSHEETS_URL = {
  PROD: 'https://tsheets.intuit.com',
  PREPROD: 'https://tsheets-e2e.intuit.com',
} as const;

export const CUSTOM_FIELD_DATA_FIELDS = {
  DROPDOWN_TYPE: 'DROPDOWN',
  SCHEMA_TYPENAME: 'Schema_Schema_AllowedValue',
  TIME_ENTRY_SUBTYPE: 'TIME_ENTRY',
  TIME_ENTITY: '/work/Time',
  CUSTOM_FIELD_DEFINITION_PATH: '/common/CustomFieldDefinition',
  GLOBAL_ID_VERSION: 'v4',
} as const;

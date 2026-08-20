import type {
  CustomField,
  CustomFieldOption,
} from 'src/js/widgets/common/customFields/utils';

export type { CustomField, CustomFieldOption };

export const createMockCustomField = (
  id: string,
  overrides?: Partial<CustomField>,
): CustomField => ({
  id,
  name: `Custom Field ${id}`,
  type: 'string',
  deleted: false,
  required: false,
  value: '',
  ...overrides,
});

export const createMockCustomFieldOption = (
  id: string,
  name: string,
  deleted = false,
): CustomFieldOption => ({ id, name, deleted });

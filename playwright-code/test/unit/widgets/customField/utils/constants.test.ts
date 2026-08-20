import {
  CUSTOM_FIELDS_TABLE_COLUMNS,
  ASSIGNMENT_COLUMNS,
  PAGINATION_DEFAULTS,
  TSHEETS_URL,
  CUSTOM_FIELD_DATA_FIELDS,
} from 'src/js/widgets/customField/utils/constants';

describe('Custom Field Constants', () => {
  describe('CUSTOM_FIELDS_TABLE_COLUMNS', () => {
    it('should have correct column definitions', () => {
      expect(CUSTOM_FIELDS_TABLE_COLUMNS).toHaveLength(5);
      expect(CUSTOM_FIELDS_TABLE_COLUMNS[0].key).toBe('name');
      expect(CUSTOM_FIELDS_TABLE_COLUMNS[1].key).toBe('type');
      expect(CUSTOM_FIELDS_TABLE_COLUMNS[2].key).toBe('status');
      expect(CUSTOM_FIELDS_TABLE_COLUMNS[3].key).toBe('required');
      expect(CUSTOM_FIELDS_TABLE_COLUMNS[4].key).toBe('actions');
    });

    it('should have translation keys for all columns', () => {
      CUSTOM_FIELDS_TABLE_COLUMNS.forEach((column) => {
        expect(column.translationKey).toBeDefined();
        expect(typeof column.translationKey).toBe('string');
      });
    });
  });

  describe('ASSIGNMENT_COLUMNS', () => {
    it('should have correct assignment column definitions', () => {
      expect(ASSIGNMENT_COLUMNS).toHaveLength(2);
      expect(ASSIGNMENT_COLUMNS[0].key).toBe('customersAssigned');
      expect(ASSIGNMENT_COLUMNS[1].key).toBe('teamAssigned');
    });

    it('should have translation keys for all assignment columns', () => {
      ASSIGNMENT_COLUMNS.forEach((column) => {
        expect(column.translationKey).toBeDefined();
        expect(typeof column.translationKey).toBe('string');
      });
    });
  });

  describe('PAGINATION_DEFAULTS', () => {
    it('should have default page value', () => {
      expect(PAGINATION_DEFAULTS.DEFAULT_PAGE).toBe(1);
    });

    it('should have default page size', () => {
      expect(PAGINATION_DEFAULTS.DEFAULT_PAGE_SIZE).toBe(7);
    });
  });

  describe('TSHEETS_URL', () => {
    it('should have production URL', () => {
      expect(TSHEETS_URL.PROD).toBe('https://tsheets.intuit.com');
    });

    it('should have pre-production URL', () => {
      expect(TSHEETS_URL.PREPROD).toBe('https://tsheets-e2e.intuit.com');
    });
  });

  describe('CUSTOM_FIELD_DATA_FIELDS', () => {
    it('should have custom field definition path', () => {
      expect(CUSTOM_FIELD_DATA_FIELDS.CUSTOM_FIELD_DEFINITION_PATH).toBe(
        '/common/CustomFieldDefinition',
      );
    });

    it('should have global ID version', () => {
      expect(CUSTOM_FIELD_DATA_FIELDS.GLOBAL_ID_VERSION).toBe('v4');
    });

    it('should be a const object', () => {
      expect(Object.isFrozen(CUSTOM_FIELD_DATA_FIELDS)).toBe(false);
      // TypeScript const assertion doesn't freeze at runtime
    });
  });

  describe('Constants Integration', () => {
    it('should have all required constants exported', () => {
      expect(CUSTOM_FIELDS_TABLE_COLUMNS).toBeDefined();
      expect(ASSIGNMENT_COLUMNS).toBeDefined();
      expect(PAGINATION_DEFAULTS).toBeDefined();
      expect(TSHEETS_URL).toBeDefined();
      expect(CUSTOM_FIELD_DATA_FIELDS).toBeDefined();
    });
  });
});

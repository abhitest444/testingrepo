import {
  getAssignmentDisplayText,
  getFieldAssignmentLabel,
  AssignmentStatus,
  IntlFormatter,
} from 'src/js/widgets/common/assignment/assignmentUtils';
import { TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS } from 'src/js/widgets/timeTrackingSettings/constants';

// Mock IntlFormatter
const mockIntl: IntlFormatter = {
  formatMessage: jest.fn((descriptor, values) => {
    const { id } = descriptor;
    if (id === 'assignments.status.all') return 'All';
    if (id === 'assignments.status.none') return 'None';
    if (id === 'assignments.status.partial') {
      return `${values?.count} of ${values?.total}`;
    }
    return id;
  }),
};

describe('assignmentUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAssignmentDisplayText', () => {
    test.each([
      {
        description:
          'returns All when assignmentCount equals totalCount and totalCount > 0',
        assignmentCount: 10,
        totalCount: 10,
        expectedStatus: AssignmentStatus.ALL,
        expectedText: 'All',
        expectedIntlId: 'assignments.status.all',
        expectedCallArgs: undefined,
      },
      {
        description:
          'returns All when assignmentCount exceeds totalCount and totalCount > 0',
        assignmentCount: 15,
        totalCount: 10,
        expectedStatus: AssignmentStatus.ALL,
        expectedText: 'All',
        expectedIntlId: 'assignments.status.all',
        expectedCallArgs: undefined,
      },
      {
        description: 'returns None when assignmentCount is 0',
        assignmentCount: 0,
        totalCount: 10,
        expectedStatus: AssignmentStatus.NONE,
        expectedText: 'None',
        expectedIntlId: 'assignments.status.none',
        expectedCallArgs: undefined,
      },
      {
        description: 'returns None when totalCount is 0',
        assignmentCount: 0,
        totalCount: 0,
        expectedStatus: AssignmentStatus.NONE,
        expectedText: 'None',
        expectedIntlId: 'assignments.status.none',
        expectedCallArgs: undefined,
      },
      {
        description:
          'returns None when totalCount is 0 but assignmentCount > 0',
        assignmentCount: 5,
        totalCount: 0,
        expectedStatus: AssignmentStatus.NONE,
        expectedText: 'None',
        expectedIntlId: 'assignments.status.none',
        expectedCallArgs: undefined,
      },
      {
        description:
          'returns partial text with count and total for partial assignments',
        assignmentCount: 5,
        totalCount: 10,
        expectedStatus: AssignmentStatus.PARTIAL,
        expectedText: '5 of 10',
        expectedIntlId: 'assignments.status.partial',
        expectedCallArgs: { count: 5, total: 10 },
      },
      {
        description:
          'returns partial text for edge case where assignmentCount is 1 and totalCount > 1',
        assignmentCount: 1,
        totalCount: 10,
        expectedStatus: AssignmentStatus.PARTIAL,
        expectedText: '1 of 10',
        expectedIntlId: undefined,
        expectedCallArgs: undefined,
      },
      {
        description:
          'returns partial text for edge case where assignmentCount is totalCount - 1',
        assignmentCount: 9,
        totalCount: 10,
        expectedStatus: AssignmentStatus.PARTIAL,
        expectedText: '9 of 10',
        expectedIntlId: undefined,
        expectedCallArgs: undefined,
      },
    ])(
      'should $description',
      ({
        assignmentCount,
        totalCount,
        expectedStatus,
        expectedText,
        expectedIntlId,
        expectedCallArgs,
      }) => {
        const result = getAssignmentDisplayText(
          assignmentCount,
          totalCount,
          mockIntl,
        );
        expect(result.status).toBe(expectedStatus);
        expect(result.text).toBe(expectedText);
        if (expectedCallArgs !== undefined) {
          expect(mockIntl.formatMessage).toHaveBeenCalledWith(
            { id: expectedIntlId },
            expectedCallArgs,
          );
        } else if (expectedIntlId !== undefined) {
          expect(mockIntl.formatMessage).toHaveBeenCalledWith({
            id: expectedIntlId,
          });
        }
      },
    );
  });

  describe('getFieldAssignmentLabel', () => {
    test.each([
      {
        description: 'returns null for customer field',
        field:
          TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CUSTOMER_FOR_TIMESHEET_ENABLED,
        expected: null,
      },
      {
        description: 'returns null for notes field',
        field:
          TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_SHEET_ENTRY_NOTES_ENABLE,
        expected: null,
      },
      {
        description: 'returns null for unmapped fields',
        field: 'unknown_field_key',
        expected: null,
      },
      {
        description: 'returns BILLABLE for billing field',
        field: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED,
        expected: 'BILLABLE',
      },
      {
        description: 'returns BILLABLE_RATE for billing rate field',
        field:
          TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.BILLING_RATE_FOR_TIME_ENABLED,
        expected: 'BILLABLE_RATE',
      },
      {
        description: 'returns SERVICE_ITEM for service field',
        field: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_SERVICE_ENABLE,
        expected: 'SERVICE_ITEM',
      },
      {
        description: 'returns CLASS for class field',
        field: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
        expected: 'CLASS',
      },
      {
        description: 'returns LOCATION for location field',
        field:
          TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.LOCATION_FOR_TIMESHEET_ENABLED,
        expected: 'LOCATION',
      },
    ])('should $description', ({ field, expected }) => {
      const result = getFieldAssignmentLabel(field);
      expect(result).toBe(expected);
    });
  });
});

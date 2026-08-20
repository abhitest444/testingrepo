import {
  EXPECTED_USER_ERRORS,
  isExpectedError,
  mapTimeTrackingMutationError,
  TIME_TRACKING_MUTATION_ERRORS,
} from 'src/js/service/errors/timeTrackingErrors';

describe('mapTimeTrackingMutationError', () => {
  let intl: any;

  beforeEach(() => {
    intl = {
      formatMessage: jest.fn().mockReturnValue('Formatted error message'),
    };
  });

  test.each([
    ['GENERAL_ERROR', TIME_TRACKING_MUTATION_ERRORS.GENERAL_ERROR],
    [
      'BILLABLE_REQUIRES_CUSTOMER',
      TIME_TRACKING_MUTATION_ERRORS.BILLABLE_REQUIRES_CUSTOMER,
    ],
    [
      'START_AND_END_TIME_REQUIRED_WHEN_ONE_PRESENT',
      TIME_TRACKING_MUTATION_ERRORS.START_AND_END_TIME_REQUIRED_WHEN_ONE_PRESENT,
    ],
    [
      'START_TIME_MUST_BE_BEFORE_END_TIME',
      TIME_TRACKING_MUTATION_ERRORS.START_TIME_MUST_BE_BEFORE_END_TIME,
    ],
    [
      'CUSTOMER_CURRENCY_MUST_MATCH_COMPANY_CURRENCY',
      TIME_TRACKING_MUTATION_ERRORS.CUSTOMER_CURRENCY_MUST_MATCH_COMPANY_CURRENCY,
    ],
    [
      'SALES_MUST_HAVE_CUSTOMER',
      TIME_TRACKING_MUTATION_ERRORS.SALES_MUST_HAVE_CUSTOMER,
    ],
    [
      'ACTIVITY_DATE_BEFORE_CLOSEDBOOKSDATE_PASSWORD_INCORRECT',
      TIME_TRACKING_MUTATION_ERRORS.ACTIVITY_DATE_BEFORE_CLOSEDBOOKSDATE_PASSWORD_INCORRECT,
    ],
    [
      'SERVICE_ITEM_ASSIGNED_IS_DELETED_AND_TIME_ACTIVITY_IS_BILLABLE',
      TIME_TRACKING_MUTATION_ERRORS.SERVICE_ITEM_ASSIGNED_IS_DELETED_AND_TIME_ACTIVITY_IS_BILLABLE,
    ],
    [
      'SERVICE_ITEM_NOT_FOUND',
      TIME_TRACKING_MUTATION_ERRORS.SERVICE_ITEM_NOT_FOUND,
    ],
    [
      'CUSTOMER_ASSIGNED_IS_DELETED_AND_TIME_ACTIVITY_IS_BILLABLE',
      TIME_TRACKING_MUTATION_ERRORS.CUSTOMER_ASSIGNED_IS_DELETED_AND_TIME_ACTIVITY_IS_BILLABLE,
    ],
    ['CUSTOMER_NOT_FOUND', TIME_TRACKING_MUTATION_ERRORS.CUSTOMER_NOT_FOUND],
    [
      'VENDOR_ASSIGNED_IS_DELETED_AND_TIME_ACTIVITY_IS_BILLABLE',
      TIME_TRACKING_MUTATION_ERRORS.VENDOR_ASSIGNED_IS_DELETED_AND_TIME_ACTIVITY_IS_BILLABLE,
    ],
    ['VENDOR_NOT_FOUND', TIME_TRACKING_MUTATION_ERRORS.VENDOR_NOT_FOUND],
    [
      'EMPLOYEE_ASSIGNED_IS_DELETED_AND_TIME_ACTIVITY_IS_BILLABLE',
      TIME_TRACKING_MUTATION_ERRORS.EMPLOYEE_ASSIGNED_IS_DELETED_AND_TIME_ACTIVITY_IS_BILLABLE,
    ],
    ['EMPLOYEE_NOT_FOUND', TIME_TRACKING_MUTATION_ERRORS.EMPLOYEE_NOT_FOUND],
    ['NO_SERVICE_ITEM', TIME_TRACKING_MUTATION_ERRORS.NO_SERVICE_ITEM],
    [
      'CONFLICTING_START_TIME_ENTRY',
      TIME_TRACKING_MUTATION_ERRORS.CONFLICTING_START_TIME_ENTRY,
    ],
    [
      'CONFLICTING_START_END_TIME_ENTRY',
      TIME_TRACKING_MUTATION_ERRORS.CONFLICTING_START_END_TIME_ENTRY,
    ],
    [
      'START_OR_END_TIME_IN_FUTURE',
      TIME_TRACKING_MUTATION_ERRORS.START_OR_END_TIME_IN_FUTURE,
    ],
    [
      'TIME_ACTIVITY_EDIT_SEQUENCE_MISMATCH',
      TIME_TRACKING_MUTATION_ERRORS.TIME_ACTIVITY_EDIT_SEQUENCE_MISMATCH,
    ],
    [
      'INVOICED_TIME_ACTIVITY_DELETE',
      TIME_TRACKING_MUTATION_ERRORS.INVOICED_TIME_ACTIVITY_DELETE,
    ],
    ['ALREADY_CLOCKED_IN', TIME_TRACKING_MUTATION_ERRORS.ALREADY_CLOCKED_IN],
    [
      'CLOCKIN_START_TIME_IN_FUTURE',
      TIME_TRACKING_MUTATION_ERRORS.CLOCKIN_START_TIME_IN_FUTURE,
    ],
    ['PARTIAL_SUCCESS', TIME_TRACKING_MUTATION_ERRORS.PARTIAL_SUCCESS],
    ['MUTATION_FAILED', TIME_TRACKING_MUTATION_ERRORS.MUTATION_FAILED],
    [
      'MANUAL_MODE_NOT_ALLOWED',
      TIME_TRACKING_MUTATION_ERRORS.MANUAL_MODE_NOT_ALLOWED,
    ],
    [
      'BREAK_RULE_NOT_FOUND',
      TIME_TRACKING_MUTATION_ERRORS.BREAK_RULE_NOT_FOUND,
    ],
    [
      'DURATION_MUST_BE_LESS_THAN_24_HOURS',
      TIME_TRACKING_MUTATION_ERRORS.DURATION_MUST_BE_LESS_THAN_24_HOURS,
    ],
    ['UNKNOWN_ERROR', TIME_TRACKING_MUTATION_ERRORS.GENERAL_ERROR], // Test for unknown error key
  ])(
    'should return formatted message for error key %s',
    (errorKey, expectedMessageId) => {
      intl.formatMessage.mockReturnValueOnce(
        `Formatted message for ${expectedMessageId}`,
      );

      const result = mapTimeTrackingMutationError(intl, errorKey);

      expect(result).toEqual(`Formatted message for ${expectedMessageId}`);
      expect(intl.formatMessage).toHaveBeenCalledWith({
        id: expectedMessageId,
      });
    },
  );

  describe('with subCode parameter', () => {
    it('should use errorCode when it has a mapping', () => {
      intl.formatMessage.mockReturnValueOnce(
        'Formatted message for error code',
      );

      const result = mapTimeTrackingMutationError(
        intl,
        'BILLABLE_REQUIRES_CUSTOMER',
        '9403',
      );

      expect(result).toEqual('Formatted message for error code');
      expect(intl.formatMessage).toHaveBeenCalledWith({
        id: TIME_TRACKING_MUTATION_ERRORS.BILLABLE_REQUIRES_CUSTOMER,
      });
    });

    it('should use subCode when errorCode has no mapping but subCode does', () => {
      intl.formatMessage.mockReturnValueOnce('Formatted message for sub code');

      const result = mapTimeTrackingMutationError(
        intl,
        'UNKNOWN_ERROR',
        '9403',
      );

      expect(result).toEqual('Formatted message for sub code');
      expect(intl.formatMessage).toHaveBeenCalledWith({
        id: TIME_TRACKING_MUTATION_ERRORS['9403'],
      });
    });

    it('should fall back to GENERAL_ERROR when neither errorCode nor subCode have mappings', () => {
      intl.formatMessage.mockReturnValueOnce('Formatted general error message');

      const result = mapTimeTrackingMutationError(
        intl,
        'UNKNOWN_ERROR',
        'UNKNOWN_SUB_CODE',
      );

      expect(result).toEqual('Formatted general error message');
      expect(intl.formatMessage).toHaveBeenCalledWith({
        id: TIME_TRACKING_MUTATION_ERRORS.GENERAL_ERROR,
      });
    });

    it('should handle empty subCode string', () => {
      intl.formatMessage.mockReturnValueOnce('Formatted general error message');

      const result = mapTimeTrackingMutationError(intl, 'UNKNOWN_ERROR', '');

      expect(result).toEqual('Formatted general error message');
      expect(intl.formatMessage).toHaveBeenCalledWith({
        id: TIME_TRACKING_MUTATION_ERRORS.GENERAL_ERROR,
      });
    });

    it('should handle undefined subCode', () => {
      intl.formatMessage.mockReturnValueOnce('Formatted general error message');

      const result = mapTimeTrackingMutationError(
        intl,
        'UNKNOWN_ERROR',
        undefined,
      );

      expect(result).toEqual('Formatted general error message');
      expect(intl.formatMessage).toHaveBeenCalledWith({
        id: TIME_TRACKING_MUTATION_ERRORS.GENERAL_ERROR,
      });
    });

    it('should handle numeric subCode strings', () => {
      intl.formatMessage.mockReturnValueOnce(
        'Formatted message for numeric sub code',
      );

      const result = mapTimeTrackingMutationError(
        intl,
        'UNKNOWN_ERROR',
        '9406',
      );

      expect(result).toEqual('Formatted message for numeric sub code');
      expect(intl.formatMessage).toHaveBeenCalledWith({
        id: TIME_TRACKING_MUTATION_ERRORS['9406'],
      });
    });

    it('should prioritize errorCode over subCode when both have mappings', () => {
      intl.formatMessage.mockReturnValueOnce(
        'Formatted message for error code',
      );

      const result = mapTimeTrackingMutationError(
        intl,
        'BILLABLE_REQUIRES_CUSTOMER',
        '9403',
      );

      expect(result).toEqual('Formatted message for error code');
      expect(intl.formatMessage).toHaveBeenCalledWith({
        id: TIME_TRACKING_MUTATION_ERRORS.BILLABLE_REQUIRES_CUSTOMER,
      });
    });
  });
});

describe('isExpectedError', () => {
  const testCases = [
    ...EXPECTED_USER_ERRORS.map((error) => [error, true]),
    ['NON_EXISTENT_ERROR', false],
    ['ANOTHER_NON_EXISTENT_ERROR', false],
    ['RATE_MUST_BE_ZERO', true],
    ['TIME_ACTIVITY_NOT_FOUND_ID_', true],
    ['GENERAL_V3_ERROR', true],
    ['GENERAL_V1_ERROR', true],
  ] as [string, boolean][];

  test.each(testCases)(
    'should return %s when error is %s',
    (error, expectedResult) => {
      expect(isExpectedError(error)).toBe(expectedResult);
    },
  );

  describe('with ApolloError', () => {
    it('should handle ApolloError objects', () => {
      const apolloError = new Error('BILLABLE_REQUIRES_CUSTOMER') as any;
      apolloError.name = 'ApolloError';

      expect(isExpectedError(apolloError)).toBe(true);
    });

    it('should handle undefined error', () => {
      expect(isExpectedError(undefined)).toBe(false);
    });
  });
});

describe('TIME_TRACKING_MUTATION_ERRORS', () => {
  it('should contain all expected error mappings', () => {
    const expectedErrors = [
      'GENERAL_ERROR',
      'BILLABLE_REQUIRES_CUSTOMER',
      'START_AND_END_TIME_REQUIRED_WHEN_ONE_PRESENT',
      'START_TIME_MUST_BE_BEFORE_END_TIME',
      'CUSTOMER_CURRENCY_MUST_MATCH_COMPANY_CURRENCY',
      'SALES_MUST_HAVE_CUSTOMER',
      'NO_SERVICE_ITEM',
      'TT_DURATION_NOT_MATCHED',
      'CONFLICTING_START_TIME_ENTRY',
      'CONFLICTING_START_END_TIME_ENTRY',
      'START_OR_END_TIME_IN_FUTURE',
      'TIME_ACTIVITY_EDIT_SEQUENCE_MISMATCH',
      'ACTIVITY_DATE_BEFORE_CLOSEDBOOKSDATE_PASSWORD_INCORRECT',
      'SERVICE_ITEM_ASSIGNED_IS_DELETED_AND_TIME_ACTIVITY_IS_BILLABLE',
      'SERVICE_ITEM_NOT_FOUND',
      'CUSTOMER_ASSIGNED_IS_DELETED_AND_TIME_ACTIVITY_IS_BILLABLE',
      'CUSTOMER_NOT_FOUND',
      'VENDOR_ASSIGNED_IS_DELETED_AND_TIME_ACTIVITY_IS_BILLABLE',
      'VENDOR_NOT_FOUND',
      'EMPLOYEE_ASSIGNED_IS_DELETED_AND_TIME_ACTIVITY_IS_BILLABLE',
      'EMPLOYEE_NOT_FOUND',
      'INVOICED_TIME_ACTIVITY_DELETE',
      'ALREADY_CLOCKED_IN',
      'CLOCKIN_START_TIME_IN_FUTURE',
      'PARTIAL_SUCCESS',
      'MUTATION_FAILED',
      'MANUAL_MODE_NOT_ALLOWED',
      'BREAK_RULE_NOT_FOUND',
      'DURATION_MUST_BE_LESS_THAN_24_HOURS',
    ];

    expectedErrors.forEach((errorKey) => {
      expect(TIME_TRACKING_MUTATION_ERRORS).toHaveProperty(errorKey);
      expect(typeof TIME_TRACKING_MUTATION_ERRORS[errorKey]).toBe('string');
    });
  });

  describe('New error codes introduced in main components', () => {
    it('should handle GENERAL_V3_ERROR with custom error handler logic', () => {
      const intl = {
        formatMessage: jest.fn().mockReturnValue('Formatted error message'),
      };

      // Test that GENERAL_V3_ERROR maps to GENERAL_ERROR when not handled by custom logic
      const result = mapTimeTrackingMutationError(intl, 'GENERAL_V3_ERROR');

      expect(intl.formatMessage).toHaveBeenCalledWith({
        id: TIME_TRACKING_MUTATION_ERRORS.GENERAL_ERROR,
      });
      expect(result).toBe('Formatted error message');
    });

    it('should handle GENERAL_V1_ERROR with custom error handler logic', () => {
      const intl = {
        formatMessage: jest.fn().mockReturnValue('Formatted error message'),
      };

      // Test that GENERAL_V1_ERROR maps to GENERAL_ERROR when not handled by custom logic
      const result = mapTimeTrackingMutationError(intl, 'GENERAL_V1_ERROR');

      expect(intl.formatMessage).toHaveBeenCalledWith({
        id: TIME_TRACKING_MUTATION_ERRORS.GENERAL_ERROR,
      });
      expect(result).toBe('Formatted error message');
    });

    it('should include GENERAL_V3_ERROR and GENERAL_V1_ERROR in EXPECTED_USER_ERRORS', () => {
      expect(EXPECTED_USER_ERRORS).toContain('GENERAL_V3_ERROR');
      expect(EXPECTED_USER_ERRORS).toContain('GENERAL_V1_ERROR');
    });
  });
});

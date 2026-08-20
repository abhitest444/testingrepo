import {
  isUserOverridePolicy,
  isBasicPolicy,
  isNumericPolicy,
  BASIC_POLICY_ID,
} from 'src/js/widgets/userSettings/components/cards/OvertimeCard/utils/policyIdUtils';

describe('policyIdUtils', () => {
  describe('BASIC_POLICY_ID', () => {
    it('is "basic"', () => {
      expect(BASIC_POLICY_ID).toBe('basic');
    });
  });

  describe('isUserOverridePolicy', () => {
    it('returns true for user-level override IDs', () => {
      expect(isUserOverridePolicy('basic_policy_abc')).toBe(true);
      expect(isUserOverridePolicy('basic_policy_123')).toBe(true);
      expect(isUserOverridePolicy('basic_policy_')).toBe(true);
    });

    it('returns false for company default policy', () => {
      expect(isUserOverridePolicy('basic')).toBe(false);
    });

    it('returns false for numeric policy IDs', () => {
      expect(isUserOverridePolicy('12345')).toBe(false);
    });

    it('returns false for null, undefined, and empty string', () => {
      expect(isUserOverridePolicy(null)).toBe(false);
      expect(isUserOverridePolicy(undefined)).toBe(false);
      expect(isUserOverridePolicy('')).toBe(false);
    });
  });

  describe('isBasicPolicy', () => {
    it('returns true for company default "basic"', () => {
      expect(isBasicPolicy('basic')).toBe(true);
    });

    it('returns true for user-level override IDs', () => {
      expect(isBasicPolicy('basic_policy_abc')).toBe(true);
      expect(isBasicPolicy('basic_policy_123')).toBe(true);
    });

    it('returns false for numeric policy IDs', () => {
      expect(isBasicPolicy('12345')).toBe(false);
    });

    it('returns false for unrelated strings', () => {
      expect(isBasicPolicy('abc')).toBe(false);
    });

    it('returns false for null, undefined, and empty string', () => {
      expect(isBasicPolicy(null)).toBe(false);
      expect(isBasicPolicy(undefined)).toBe(false);
      expect(isBasicPolicy('')).toBe(false);
    });
  });

  describe('isNumericPolicy', () => {
    it('returns true for numeric-only strings', () => {
      expect(isNumericPolicy('12345')).toBe(true);
      expect(isNumericPolicy('0')).toBe(true);
      expect(isNumericPolicy('999999')).toBe(true);
    });

    it('returns false for non-numeric strings', () => {
      expect(isNumericPolicy('basic')).toBe(false);
      expect(isNumericPolicy('basic_policy_abc')).toBe(false);
      expect(isNumericPolicy('abc')).toBe(false);
      expect(isNumericPolicy('123abc')).toBe(false);
    });

    it('returns false for null, undefined, and empty string', () => {
      expect(isNumericPolicy(null)).toBe(false);
      expect(isNumericPolicy(undefined)).toBe(false);
      expect(isNumericPolicy('')).toBe(false);
    });
  });
});

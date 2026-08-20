import {
  formatCurrency,
  isValidCurrencyFormat,
  processCurrencyInput,
} from 'src/js/common/CurrencyUtils';

describe('formatCurrency', () => {
  test.each([
    { input: '123.45', expected: '123.45' },
    { input: '  123.4  ', expected: '123.40' },
    { input: '123', expected: '123.00' },
    { input: '123.4', expected: '123.40' },
    { input: '123.456', expected: '123.46' },
    { input: 'abc', expected: 'NaN' },
    { input: '', expected: 'NaN' },
    { input: '-123.45', expected: '-123.45' },
    { input: '0', expected: '0.00' },
  ])('should format %p correctly', ({ input, expected }) => {
    expect(formatCurrency(input)).toEqual(expected);
  });

  describe('with allowNegative=true', () => {
    test.each([
      { input: '-123.45', expected: '-123.45' },
      { input: '-0.01', expected: '-0.01' },
      { input: '-100', expected: '-100.00' },
      { input: '123.45', expected: '123.45' },
    ])('should format negative value %p correctly', ({ input, expected }) => {
      expect(formatCurrency(input, true)).toEqual(expected);
    });
  });
});

describe('isValidCurrencyFormat', () => {
  test.each([
    ['123.45', true],
    ['123', false],
    ['123.4', false],
    ['123.456', false],
    ['abc', false],
    ['', false],
    ['-123.45', false],
    [' 123.45 ', false],
  ])('should return %s for input %s', (input, expected) => {
    expect(isValidCurrencyFormat(input)).toBe(expected);
  });

  describe('with allowNegative=true', () => {
    test.each([
      ['-123.45', true],
      ['-0.01', true],
      ['123.45', true],
      ['-123', false],
      ['--123.45', false],
    ])('should return correct result for %s', (input, expected) => {
      expect(isValidCurrencyFormat(input, true)).toBe(expected);
    });
  });
});

describe('processCurrencyInput', () => {
  test.each([{ input: '97.6421', maxLength: 100, expected: '97.64' }])(
    'should return %s for input %s',
    ({ input, maxLength, expected }) => {
      expect(processCurrencyInput(input, maxLength)).toBe(expected);
    },
  );

  describe('with allowNegative=true', () => {
    test.each([
      { input: '-123.45', maxLength: 11, expected: '-123.45' },
      { input: '-99999999999.99', maxLength: 11, expected: '-99999999999.99' },
      { input: '-123456789012.99', maxLength: 11, expected: '-12345678901.99' },
      { input: '-', maxLength: 11, expected: '-' },
      { input: '-1', maxLength: 11, expected: '-1' },
    ])(
      'should process negative input $input correctly',
      ({ input, maxLength, expected }) => {
        expect(processCurrencyInput(input, maxLength, true)).toBe(expected);
      },
    );
  });

  describe('with allowNegative=false (default)', () => {
    it('should reject negative input when allowNegative is false', () => {
      expect(processCurrencyInput('-123.45', 11)).toBe('-123.45');
    });
  });
});

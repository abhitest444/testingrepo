import React from 'react';
import {
  bankersRound,
  convertRecord,
  getShowBillRateToAll,
  groupComponentsIntoRows,
  getTimeDurationInHHMMFormat,
  getFlavor,
  metersToMiles,
  milesToMeters,
} from 'src/js/common/MiscUtils';

describe('groupFieldsIntoRows', () => {
  it('should return an empty array when given an empty array of fields', () => {
    const fields: React.JSX.Element[] = [];
    const result = groupComponentsIntoRows(fields);
    expect(result).toEqual([]);
  });

  it('should group fields into rows with the default maxFieldsPerRow of 3', () => {
    const fields = [
      <div key="1">Field 1</div>,
      <div key="2">Field 2</div>,
      <div key="3">Field 3</div>,
      <div key="4">Field 4</div>,
      <div key="5">Field 5</div>,
    ];
    const result = groupComponentsIntoRows(fields);
    expect(result).toEqual([
      [fields[0], fields[1], fields[2]],
      [fields[3], fields[4]],
    ]);
  });

  it('should group fields into rows with a specified maxFieldsPerRow', () => {
    const fields = [
      <div key="1">Field 1</div>,
      <div key="2">Field 2</div>,
      <div key="3">Field 3</div>,
      <div key="4">Field 4</div>,
    ];
    const result = groupComponentsIntoRows(fields, 2);
    expect(result).toEqual([
      [fields[0], fields[1]],
      [fields[2], fields[3]],
    ]);
  });

  it('should handle a number of fields that is not a multiple of maxFieldsPerRow', () => {
    const fields = [
      <div key="1">Field 1</div>,
      <div key="2">Field 2</div>,
      <div key="3">Field 3</div>,
      <div key="4">Field 4</div>,
      <div key="5">Field 5</div>,
    ];
    const result = groupComponentsIntoRows(fields, 4);
    expect(result).toEqual([
      [fields[0], fields[1], fields[2], fields[3]],
      [fields[4]],
    ]);
  });

  it('should return all fields in a single row if maxFieldsPerRow is greater than the number of fields', () => {
    const fields = [<div key="1">Field 1</div>, <div key="2">Field 2</div>];
    const result = groupComponentsIntoRows(fields, 5);
    expect(result).toEqual([[fields[0], fields[1]]]);
  });

  it('should handle a maxFieldsPerRow of 1, returning each field in its own row', () => {
    const fields = [
      <div key="1">Field 1</div>,
      <div key="2">Field 2</div>,
      <div key="3">Field 3</div>,
    ];
    const result = groupComponentsIntoRows(fields, 1);
    expect(result).toEqual([[fields[0]], [fields[1]], [fields[2]]]);
  });
});

describe('convertRecord', () => {
  test.each([
    [
      { a: 1, b: 2 },
      { a: '1', b: '2' },
    ],
    [
      { key1: 'value1', key2: 42 },
      { key1: 'value1', key2: '42' },
    ],
    [{}, {}],
    [
      { num: 3.14, str: 'test' },
      { num: '3.14', str: 'test' },
    ],
    [
      { mixed: '123', zero: 0 },
      { mixed: '123', zero: '0' },
    ],
  ])('converts %p to %p', (input, expected) => {
    expect(convertRecord(input)).toEqual(expected);
  });
});

describe('bankersRound', () => {
  test.each`
    input      | expected
    ${0.5}     | ${0.5}
    ${1.5}     | ${1.5}
    ${2.5}     | ${2.5}
    ${3.5}     | ${3.5}
    ${1.25}    | ${1.25}
    ${1.75}    | ${1.75}
    ${2.25}    | ${2.25}
    ${2.75}    | ${2.75}
    ${0.125}   | ${0.13}
    ${0.375}   | ${0.38}
    ${1.03333} | ${1.03}
    ${1.03533} | ${1.04}
  `('should round $input to $expected', ({ input, expected }) => {
    expect(bankersRound(input)).toBe(expected);
  });
});

describe('getShowBillRateToAll', () => {
  it('test_getShowBillRateToAll_with_valid_data', () => {
    const data = {
      Preferences: {
        TimeTrackingPrefs: {
          ShowBillRateToAll: true,
        },
      },
    };
    expect(getShowBillRateToAll(data)).toBe(true);
  });

  it('test_getShowBillRateToAll_with_invalid_data', () => {
    expect(getShowBillRateToAll(null)).toBe(false);
    expect(getShowBillRateToAll({})).toBe(false);
    expect(getShowBillRateToAll({ Preferences: {} })).toBe(false);
  });

  it('test_getShowBillRateToAll_with_false_value', () => {
    const data = {
      Preferences: {
        TimeTrackingPrefs: {
          ShowBillRateToAll: false,
        },
      },
    };
    expect(getShowBillRateToAll(data)).toBe(false);
  });
});

describe('getTimeDurationInHHMMFormat', () => {
  it('should return time duration in hh:mm format after properly rounding off the seconds', () => {
    expect(getTimeDurationInHHMMFormat(25400)).toEqual('7:03');
    expect(getTimeDurationInHHMMFormat(76534)).toEqual('21:16');
  });

  it('if after rounding off, minutes is equal to 60, then it should return time duration after incrementing hour count', () => {
    expect(getTimeDurationInHHMMFormat(86399)).toEqual('24:00');
    expect(getTimeDurationInHHMMFormat(46799)).toEqual('13:00');
  });
});

describe('getFlavor', () => {
  beforeEach(() => {
    // Reset the window object before each test
    delete (window as any).qbo;
  });

  test('returns the correct flavor when qbo object is present', () => {
    (window as any).qbo = {
      productEntitlements: [
        { flavor: 'Simple Start' },
        { flavor: 'Plus' },
        { flavor: 'Advanced' },
      ],
    };

    expect(getFlavor()).toBe('Simple Start');
  });

  test('returns undefined when qbo object is not present', () => {
    expect(getFlavor()).toBeUndefined();
  });

  test('returns undefined when productEntitlements is empty', () => {
    (window as any).qbo = {
      productEntitlements: [],
    };

    expect(getFlavor()).toBeUndefined();
  });

  test('returns undefined when productEntitlements does not have flavor', () => {
    (window as any).qbo = {
      productEntitlements: [{}, {}],
    };

    expect(getFlavor()).toBeUndefined();
  });
});

describe('metersToMiles', () => {
  test.each`
    input      | expected     | description
    ${null}    | ${null}      | ${'returns null for null input'}
    ${0}       | ${'0.00'}    | ${'returns "0.00" for 0 meters'}
    ${1609.34} | ${'1.00'}    | ${'converts 1609.34 meters to "1.00" miles'}
    ${16093}   | ${'10.00'}   | ${'converts 16093 meters to "10.00" miles'}
    ${37015}   | ${'23.00'}   | ${'converts 37015 meters to "23.00" miles'}
    ${200}     | ${'0.12'}    | ${'converts 200 meters to "0.12" miles'}
    ${8047}    | ${'5.00'}    | ${'converts 8047 meters to "5.00" miles'}
    ${48280}   | ${'30.00'}   | ${'converts 48280 meters to "30.00" miles'}
    ${160934}  | ${'100.00'}  | ${'converts 160934 meters to "100.00" miles'}
    ${1609340} | ${'1000.00'} | ${'converts 1609340 meters to "1000.00" miles'}
  `('$description', ({ input, expected }) => {
    expect(metersToMiles(input)).toBe(expected);
  });

  it('should format to 2 decimal places as string', () => {
    // 1000 meters / 1609.34 = 0.621371... ≈ "0.62"
    expect(metersToMiles(1000)).toBe('0.62');
    // 2500 meters / 1609.34 = 1.553428... ≈ "1.55"
    expect(metersToMiles(2500)).toBe('1.55');
    // 20420 meters / 1609.34 = 12.688... ≈ "12.69"
    expect(metersToMiles(20420)).toBe('12.69');
  });

  it('should always return string with exactly 2 decimal places', () => {
    // Test that trailing zeros are preserved
    expect(metersToMiles(1609.34)).toBe('1.00');
    expect(metersToMiles(8047)).toBe('5.00');
    expect(metersToMiles(3218.68)).toBe('2.00');
  });
});

describe('milesToMeters', () => {
  test.each`
    input   | expected   | description
    ${null} | ${null}    | ${'returns null for null input'}
    ${0}    | ${0}       | ${'returns 0 for 0 miles'}
    ${1}    | ${1609}    | ${'converts 1 mile to 1609 meters'}
    ${10}   | ${16093}   | ${'converts 10 miles to 16093 meters'}
    ${23}   | ${37015}   | ${'converts 23 miles to 37015 meters'}
    ${5}    | ${8047}    | ${'converts 5 miles to 8047 meters'}
    ${30}   | ${48280}   | ${'converts 30 miles to 48280 meters'}
    ${100}  | ${160934}  | ${'converts 100 miles to 160934 meters'}
    ${1000} | ${1609340} | ${'converts 1000 miles to 1609340 meters'}
  `('$description', ({ input, expected }) => {
    expect(milesToMeters(input)).toBe(expected);
  });

  it('should round to integer for decimal miles', () => {
    // 10.5 miles × 1609.34 = 16898.07 ≈ 16898
    expect(milesToMeters(10.5)).toBe(16898);
    // 0.5 miles × 1609.34 = 804.67 ≈ 805
    expect(milesToMeters(0.5)).toBe(805);
    // 23.7 miles × 1609.34 = 38141.358 ≈ 38141
    expect(milesToMeters(23.7)).toBe(38141);
  });

  it('should handle small decimal values', () => {
    // 0.1 miles × 1609.34 = 160.934 ≈ 161
    expect(milesToMeters(0.1)).toBe(161);
    // 0.01 miles × 1609.34 = 16.0934 ≈ 16
    expect(milesToMeters(0.01)).toBe(16);
  });
});

describe('metersToMiles and milesToMeters roundtrip', () => {
  it('should convert back and forth with minimal precision loss', () => {
    const originalMiles = 23;
    const meters = milesToMeters(originalMiles);
    const milesBackStr = metersToMiles(meters);
    const milesBack = parseFloat(milesBackStr!);
    expect(milesBack).toBe(originalMiles);
  });

  it('should handle conversion for common values', () => {
    [1, 5, 10, 25, 50, 100, 500].forEach((miles) => {
      const meters = milesToMeters(miles);
      const milesBackStr = metersToMiles(meters);
      const milesBack = parseFloat(milesBackStr!);
      // Should be equal or very close (within rounding)
      expect(Math.abs(milesBack - miles)).toBeLessThan(0.01);
    });
  });

  it('should maintain 2 decimal places through conversion', () => {
    // Test that formatting is preserved
    const miles = 10.5;
    const meters = milesToMeters(miles); // 16898 meters
    const milesStr = metersToMiles(meters); // should be "10.50"
    expect(milesStr).toMatch(/^\d+\.\d{2}$/); // Regex to check 2 decimal places
    expect(parseFloat(milesStr!)).toBeCloseTo(miles, 2);
  });
});

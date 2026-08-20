import { isEmptyObject } from 'src/js/service/utils/objectUtils';

describe('isEmptyObject', () => {
  test.each([
    [null, true],
    [{}, true],
    [{ key: 'value' }, false],
    [[], true],
    [[1, 2, 3], false],
    ['', false],
    [0, false],
    [undefined, true],
    [true, false],
    [false, false],
    [() => {}, false],
  ])('should return %s for input %p', (input, expected) => {
    expect(isEmptyObject(input)).toBe(expected);
  });
});

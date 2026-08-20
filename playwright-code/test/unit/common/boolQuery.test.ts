import { resolveBool } from 'src/js/common/boolQuery';

describe('resolveBool', () => {
  it('resolves an empty query to true (match all)', () => {
    expect(resolveBool({})).toBe(true);
  });

  describe('must (AND)', () => {
    it('returns true only when every clause is truthy', () => {
      expect(resolveBool({ must: [true, true] })).toBe(true);
    });

    it('returns false when any clause is falsy', () => {
      expect(resolveBool({ must: [true, false] })).toBe(false);
    });

    it('treats null/undefined clauses as falsy', () => {
      expect(resolveBool({ must: [true, null] })).toBe(false);
      expect(resolveBool({ must: [true, undefined] })).toBe(false);
    });
  });

  describe('should (OR)', () => {
    it('returns true when at least one clause matches (default minimumShouldMatch)', () => {
      expect(resolveBool({ should: [false, true, false] })).toBe(true);
    });

    it('returns false when no clause matches', () => {
      expect(resolveBool({ should: [false, false] })).toBe(false);
    });

    it('honors minimumShouldMatch', () => {
      expect(
        resolveBool({ should: [true, false, false], minimumShouldMatch: 2 }),
      ).toBe(false);
      expect(
        resolveBool({ should: [true, true, false], minimumShouldMatch: 2 }),
      ).toBe(true);
    });

    it('ignores an empty should list', () => {
      expect(resolveBool({ should: [] })).toBe(true);
    });
  });

  describe('mustNot (NOR)', () => {
    it('returns true when no clause is truthy', () => {
      expect(resolveBool({ mustNot: [false, null, undefined] })).toBe(true);
    });

    it('returns false when any clause is truthy', () => {
      expect(resolveBool({ mustNot: [false, true] })).toBe(false);
    });
  });

  describe('clause types', () => {
    it('evaluates function (thunk) clauses lazily', () => {
      const thunk = jest.fn(() => true);
      expect(resolveBool({ must: [thunk] })).toBe(true);
      expect(thunk).toHaveBeenCalledTimes(1);
    });

    it('coerces thunk return values to boolean', () => {
      expect(resolveBool({ must: [() => 1 as unknown as boolean] })).toBe(true);
      expect(resolveBool({ must: [() => 0 as unknown as boolean] })).toBe(
        false,
      );
    });

    it('resolves nested BoolQuery clauses', () => {
      const query = {
        should: [false, { must: [true, true] }],
      };
      expect(resolveBool(query)).toBe(true);
    });

    it('supports arbitrary nesting depth (AND of ORs)', () => {
      const query = {
        must: [{ should: [false, true] }, { should: [true, false] }],
      };
      expect(resolveBool(query)).toBe(true);
    });
  });

  describe('combined clauses', () => {
    it('requires must, should, and mustNot to all pass', () => {
      expect(
        resolveBool({
          must: [true],
          should: [true, false],
          mustNot: [false],
        }),
      ).toBe(true);
    });

    it('fails when mustNot is violated even if must and should pass', () => {
      expect(
        resolveBool({
          must: [true],
          should: [true],
          mustNot: [true],
        }),
      ).toBe(false);
    });
  });
});

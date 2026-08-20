import { extractQboLocalId } from 'src/js/widgets/timeProject/utils/projectIdUtils';

describe('extractQboLocalId', () => {
  it('returns an empty string for null input', () => {
    expect(extractQboLocalId(null)).toBe('');
  });

  it('returns an empty string for undefined input', () => {
    expect(extractQboLocalId(undefined)).toBe('');
  });

  it('returns an empty string for an empty string input', () => {
    expect(extractQboLocalId('')).toBe('');
  });

  it('returns the input unchanged when there is no colon (already a local ID)', () => {
    expect(extractQboLocalId('793400145')).toBe('793400145');
  });

  it('extracts the segment after the one colon in a global ID (base64 prefix is colon-free)', () => {
    expect(
      extractQboLocalId(
        'djQuMTo5OjAuMTo5MzQxNDU0NzE5NTE0OTAyOjY4ZDAxMTQ3ZGQ:793400145',
      ),
    ).toBe('793400145');
  });

  it('strips a type prefix separated by underscore (e.g. Customer_12345 → 12345)', () => {
    expect(extractQboLocalId('djQuMTo5:Customer_12345')).toBe('12345');
  });

  it('strips a type prefix even when there are multiple underscores in the segment', () => {
    // Only the first underscore is used as the type separator.
    expect(extractQboLocalId('djQuMTo5:Type_123_456')).toBe('123_456');
  });

  it('handles a bare local-id-style string that contains an underscore without a colon', () => {
    // No colon → already local, return as-is (no underscore stripping)
    expect(extractQboLocalId('plain_id')).toBe('plain_id');
  });

  it('handles a global ID whose local segment has no underscore', () => {
    expect(extractQboLocalId('base64encoded:888777666')).toBe('888777666');
  });
});

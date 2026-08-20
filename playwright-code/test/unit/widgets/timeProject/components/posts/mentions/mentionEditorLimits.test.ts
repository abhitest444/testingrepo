import {
  wouldExceedMaxLength,
  clampPasteText,
} from 'src/js/widgets/timeProject/components/posts/mentions/mentionEditorLimits';

describe('wouldExceedMaxLength', () => {
  it('allows typing while under the cap', () => {
    expect(
      wouldExceedMaxLength({
        currentLength: 1998,
        selectedLength: 0,
        insertedLength: 1,
        maxLength: 2000,
      }),
    ).toBe(false);
  });

  it('allows typing the exact character that reaches the cap', () => {
    expect(
      wouldExceedMaxLength({
        currentLength: 1999,
        selectedLength: 0,
        insertedLength: 1,
        maxLength: 2000,
      }),
    ).toBe(false);
  });

  it('blocks typing once already at the cap', () => {
    expect(
      wouldExceedMaxLength({
        currentLength: 2000,
        selectedLength: 0,
        insertedLength: 1,
        maxLength: 2000,
      }),
    ).toBe(true);
  });

  it('blocks a multi-character insert (e.g. IME) that would overflow', () => {
    expect(
      wouldExceedMaxLength({
        currentLength: 1995,
        selectedLength: 0,
        insertedLength: 10,
        maxLength: 2000,
      }),
    ).toBe(true);
  });

  it('allows replacing a selection even when already at the cap, as long as the net result fits', () => {
    expect(
      wouldExceedMaxLength({
        currentLength: 2000,
        selectedLength: 5,
        insertedLength: 5,
        maxLength: 2000,
      }),
    ).toBe(false);
  });

  it('blocks replacing a selection when the net result still overflows', () => {
    expect(
      wouldExceedMaxLength({
        currentLength: 2000,
        selectedLength: 5,
        insertedLength: 6,
        maxLength: 2000,
      }),
    ).toBe(true);
  });
});

describe('clampPasteText', () => {
  it('returns the full text when it fits within the remaining room', () => {
    expect(
      clampPasteText('hello', {
        currentLength: 1990,
        selectedLength: 0,
        maxLength: 2000,
      }),
    ).toBe('hello');
  });

  it('truncates pasted text to the remaining room', () => {
    expect(
      clampPasteText('hello world', {
        currentLength: 1995,
        selectedLength: 0,
        maxLength: 2000,
      }),
    ).toBe('hello');
  });

  it('accounts for a replaced selection when computing remaining room', () => {
    // 2000 current, but pasting over a 20-char selection frees up room.
    expect(
      clampPasteText('0123456789', {
        currentLength: 2000,
        selectedLength: 20,
        maxLength: 2000,
      }),
    ).toBe('0123456789');
  });

  it('drops the paste entirely when already at the cap with no selection', () => {
    expect(
      clampPasteText('anything', {
        currentLength: 2000,
        selectedLength: 0,
        maxLength: 2000,
      }),
    ).toBe('');
  });
});

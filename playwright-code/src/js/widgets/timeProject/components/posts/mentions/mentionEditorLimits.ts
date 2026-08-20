/**
 * Pure helpers backing MentionEditor's hard character cap (mirrors a native
 * `<textarea maxlength>`): typing/pasting beyond the limit is blocked rather
 * than merely flagged after the fact. Kept separate from the DOM-heavy
 * editor component so the boundary math is unit-testable on its own.
 */

export interface LengthChangeInput {
  /** Current display-text length (see `domToDisplay`). */
  currentLength: number;
  /** Length of the text selection that will be replaced, if any (0 if none). */
  selectedLength: number;
  /** Length of the text about to be inserted. */
  insertedLength: number;
  maxLength: number;
}

/**
 * Whether inserting `insertedLength` characters — replacing any current
 * selection of `selectedLength` characters — would push the display text
 * past `maxLength`. Replacing a selection is always allowed as long as the
 * net result still fits, matching native maxlength behavior.
 */
export const wouldExceedMaxLength = ({
  currentLength,
  selectedLength,
  insertedLength,
  maxLength,
}: LengthChangeInput): boolean =>
  currentLength - selectedLength + insertedLength > maxLength;

export interface ClampPasteInput {
  currentLength: number;
  selectedLength: number;
  maxLength: number;
}

/**
 * Truncates pasted text to whatever room remains under `maxLength`, given
 * the current display length and any selection the paste will replace.
 * Returns '' when there's no room at all (the paste is fully dropped).
 */
export const clampPasteText = (
  text: string,
  { currentLength, selectedLength, maxLength }: ClampPasteInput,
): string => {
  const remaining = maxLength - (currentLength - selectedLength);
  if (remaining <= 0) return '';
  return text.length > remaining ? text.slice(0, remaining) : text;
};

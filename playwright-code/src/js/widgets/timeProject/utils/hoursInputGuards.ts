import React from 'react';
import { MAX_ESTIMATE_HOURS } from '../constants';

/**
 * Hour-input keyboard guard.
 *
 * `<input type="number">` lets users type characters like `e`, `E`, `+`, `-`
 * (and on most browsers any letter/symbol while still firing a normal
 * `keydown`). For our hour inputs we need a strict positive decimal, so we
 * intercept and block any keystroke that can't legitimately appear in a
 * positive decimal number. Navigation keys (arrows, backspace, tab, etc.)
 * and clipboard shortcuts (Cmd/Ctrl+A/C/V/X) are always allowed.
 */
export const blockInvalidHoursKeys = (
  event: React.KeyboardEvent<HTMLInputElement>,
) => {
  // Always let keyboard shortcuts through (copy/paste/select-all/etc).
  if (event.metaKey || event.ctrlKey || event.altKey) return;

  const allowedControlKeys = new Set([
    'Backspace',
    'Delete',
    'Tab',
    'Escape',
    'Enter',
    'Home',
    'End',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
  ]);
  if (allowedControlKeys.has(event.key)) return;

  // Single-character key: must be a digit or a decimal separator. Reject
  // anything else (notably `e`, `E`, `+`, `-`, letters, punctuation).
  if (event.key.length === 1) {
    const isDigit = event.key >= '0' && event.key <= '9';
    const isDecimal = event.key === '.';
    if (!isDigit && !isDecimal) {
      event.preventDefault();
      return;
    }

    // Only one decimal point allowed.
    if (isDecimal && event.currentTarget.value.includes('.')) {
      event.preventDefault();
    }
  }
};

/**
 * Hour-input paste guard.
 *
 * If a paste would produce something that isn't a valid positive decimal
 * within `MAX_ESTIMATE_HOURS`, swallow it. This lets us keep the textbox
 * "clean" instead of relying on after-the-fact validation messages.
 */
export const blockInvalidHoursPaste = (
  event: React.ClipboardEvent<HTMLInputElement>,
) => {
  const pasted = event.clipboardData.getData('text');
  if (!pasted) return;

  const trimmed = pasted.trim();
  // Allow only digits with at most one decimal point. No sign, no exponent.
  if (!/^\d*(?:\.\d*)?$/.test(trimmed)) {
    event.preventDefault();
    return;
  }
  const num = Number(trimmed);
  if (!Number.isFinite(num) || num < 0 || num > MAX_ESTIMATE_HOURS) {
    event.preventDefault();
  }
};

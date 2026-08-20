import { useCallback, useEffect, useMemo, useRef } from 'react';
/**
 * Auto-selects the only item when a required field has exactly one option.
 * Centralises the logic shared by ClassDropdown, ServiceDropdown, and
 * LocationDropdown so the copies cannot drift.
 *
 * Firing CONDITION (never loosened by any caller):
 *   enabled (field required) && !disabled && !loading && !value (empty)
 *   && items.length === 1 (exactly one option)
 *
 * Two firing CADENCES, selected by whether `autoSelectKey` is provided:
 *
 * - STE (`autoSelectKey` omitted or `null`): one persistent form.
 *   Auto-selects ONCE on mount when the condition holds, then never again
 *   from the effect. This is the original behaviour and is preserved
 *   exactly.
 *
 * - WTE (`autoSelectKey` = the selected cell id): one sidebar shared across all
 *   grid cells; the dropdown is mounted once and re-pointed at each clicked
 *   cell, so a one-shot latch would only ever fill the first cell. Passing the
 *   cell id re-arms auto-select whenever the user moves to a different cell, so
 *   each newly selected, still-empty cell with a single option is filled.
 *
 * Returns a callback that can be called on blur to re-trigger auto-selection.
 */
export function useAutoSelectSingle<T extends { id: string }>({
  enabled,
  disabled,
  loading,
  value,
  items,
  onChange,
  autoSelectKey,
}: {
  enabled: boolean;
  disabled: boolean;
  loading: boolean;
  value: string | undefined;
  items: T[];
  onChange?: (id: string, item: T) => void;
  /**
   * WTE only: id of the selected cell (e.g. `${rowId}-${dayIdx}`). When it
   * changes, auto-select is re-armed for the newly selected cell. Omit or
   * pass `null` for STE to keep the original fire-once-on-mount behaviour.
   */
  autoSelectKey?: string | null;
}) {
  // Whether we have auto-selected at least once (drives the STE one-shot latch).
  const hasAutoSelectedRef = useRef(false);
  // The cell key we last auto-selected for (drives the WTE per-cell re-arm).
  const lastKeyRef = useRef<string | null | undefined>(undefined);

  const shouldAutoSelect = useMemo(
    () => enabled && !disabled && !loading && !value && items.length === 1,
    [enabled, disabled, loading, value, items.length],
  );

  const performAutoSelect = useCallback(() => {
    if (!shouldAutoSelect) return;
    onChange?.(items[0].id, items[0]);
  }, [shouldAutoSelect, items, onChange]);

  useEffect(() => {
    if (!shouldAutoSelect) return;

    if (autoSelectKey == null) {
      // STE: fire once on mount, never again from the effect.
      if (hasAutoSelectedRef.current) return;
    } else if (
      hasAutoSelectedRef.current &&
      autoSelectKey === lastKeyRef.current
    ) {
      // WTE: fire once per cell — re-arm only when the selected cell changes.
      return;
    }

    hasAutoSelectedRef.current = true;
    lastKeyRef.current = autoSelectKey;
    performAutoSelect();
  }, [shouldAutoSelect, performAutoSelect, autoSelectKey]);

  // Return a callback that can be called on blur to re-trigger auto-selection.
  return performAutoSelect;
}

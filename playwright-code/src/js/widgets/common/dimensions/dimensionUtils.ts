import type {
  CustomExtensionDimensionInput,
  CustomExtensionsInput,
  CustomExtensionsWire,
  DimensionDefinition,
  DimensionRenderState,
  DimensionValue,
} from './types';

/* ──────────────────────── Quickfill value helpers ───────────────────────── */

/**
 * Composes the composite value the quickfills widget expects for
 * `type="dimension"`: `"<defId>-<optionId>"` (e.g. `"1000000023-1000000035"`).
 *
 * Used exclusively as the controlled `value` prop — never stored in form state
 * or sent in the mutation payload.
 */
export const composeDimensionQuickfillValue = (
  defId: string,
  optionId: string,
): string => `${defId}-${optionId}`;

/**
 * Strips the definition-id prefix from a composite quickfill value, returning
 * the bare option id to store in form state or send in the mutation payload.
 *
 * If `compositeId` does not start with `"<defId>-"` it is assumed to already
 * be a plain option id and is returned unchanged.
 */
export const extractDimensionOptionId = (
  compositeId: string,
  defId: string,
): string => {
  const prefix = `${defId}-`;
  return compositeId.startsWith(prefix)
    ? compositeId.slice(prefix.length)
    : compositeId;
};

/* ───────────────────────────── Visibility ───────────────────────────────── */

/**
 * Returns true when the dimension should surface on the time-entry form.
 * Applies to both create and update — backend-persisted values on inactive
 * dimensions do not override this rule.
 */
export const isVisibleInCreate = (def: DimensionDefinition): boolean =>
  !!def && def.active && def.enabledForTimeTracking;

/**
 * Required indicator only applies when the dimension is visible on the form.
 */
export const isRequiredOnForm = (def: DimensionDefinition): boolean =>
  isVisibleInCreate(def) && def.required === true;

/** A dimension is considered to "have a value" on a time entry when a
 *  selected option id has been persisted for it.
 */
export const hasDimensionValue = (value?: DimensionValue): boolean => {
  if (!value) return false;
  return value.optionID != null && value.optionID !== '';
};

/**
 * Single source of truth for dimension visibility on the UI.
 *
 *   active && enabledForTimeTracking          → show, editable
 *   otherwise, create                         → hide
 *   otherwise, update + inactive + real value → show, GREYED-OUT (read-only);
 *                                               value is visible but the
 *                                               dimension is omitted from the
 *                                               save payload (displayOnly).
 *                                               Inactive = !active or
 *                                               !enabledForTimeTracking.
 *                                               Real value = a persisted option
 *                                               id; `[]` and `['-1']` are not
 *                                               shown in this flow.
 *   otherwise, update                         → hide
 */
export const computeDimensionRender = (
  def: DimensionDefinition,
  valueOnEntry: DimensionValue | undefined,
  isCreate: boolean,
): DimensionRenderState => {
  if (isVisibleInCreate(def)) {
    return {
      show: true,
      disabled: false,
      required: def.required,
    };
  }

  // Edit flow only: surface inactive / not-enabled dimensions read-only when
  // the entry carries a real persisted selection. Empty-array (`[]`) and
  // removed-default (`['-1']`, hydrated as `optionID: ''`) values stay hidden.
  if (!isCreate && hasDimensionValue(valueOnEntry)) {
    return { show: true, disabled: true, required: false };
  }

  return { show: false, disabled: false, required: false };
};

/**
 * Convenience helper — computes a `Record<dimensionId, DimensionRenderState>`
 * for a list of dimensions and the entry's currently-persisted values.
 *
 * `valuesById` maps dimension id → its DimensionValue on the entry (if any).
 * For Single Time / Time Clock this comes from the react-hook-form `dimensions`
 * map; for Weekly it comes from the selected cell's `dimensions` array.
 */
export const computeDimensionRenderMap = (
  definitions: DimensionDefinition[],
  valuesById: Record<string, DimensionValue | undefined>,
  isCreate: boolean,
): Record<string, DimensionRenderState> => {
  const map: Record<string, DimensionRenderState> = {};
  definitions.forEach((def) => {
    map[def.id] = computeDimensionRender(def, valuesById[def.id], isCreate);
  });
  return map;
};

/**
 * Single rule for "is this option id the dimension's worker default?" — shared
 * by the seed (`resolveDimensionFormValue`) and the onChange handler in
 * `<DimensionRow>` so the two producers of `activeValueIsDefault` can never
 * drift. An empty/missing optionID is never the default.
 */
export const isWorkerDefaultOption = (
  def: DimensionDefinition,
  optionID?: string | null,
): boolean => !!optionID && optionID === def.workerDefaultOptionId;

/**
 * Resolves the form value for one dimension when seeding after definitions load.
 *
 *   • visible + persisted non-empty option       → keep it
 *   • persisted `''`                            → keep explicit clear
 *   • (create OR prefillWorkerDefaultsWhenEmpty) + visible
 *       + worker default                         → pre-fill default
 *   • invisible                                  → `displayOnly` (never sent)
 *   • otherwise                                  → `null` (omit from payload)
 *
 * `prefillWorkerDefaultsWhenEmpty` (clock only) also pre-fills the worker
 * default on the EDIT path for an active dimension the response had no value
 * for — used by the clock-out screen, where a freshly clocked-in entry has no
 * saved values yet but should still surface the worker default.
 */
export const resolveDimensionFormValue = (
  def: DimensionDefinition,
  existing: DimensionValue | undefined,
  isCreate: boolean,
  prefillWorkerDefaultsWhenEmpty = false,
): DimensionValue => {
  const visible = isVisibleInCreate(def);
  const optionID = existing?.optionID;

  const resolvedOptionID =
    optionID ??
    ((isCreate || prefillWorkerDefaultsWhenEmpty) && visible
      ? def.workerDefaultOptionId ?? null
      : null);

  // True when the active value at load-time is the worker default —
  // clearing it later should send ['-1'], not []. Preserve an existing flag
  // (e.g. a hydrated '-1' removal mapped to an explicit clear) so it survives
  // re-seeding even though the cleared optionID no longer equals the default.
  const activeValueIsDefault =
    !!existing?.activeValueIsDefault ||
    isWorkerDefaultOption(def, resolvedOptionID);

  // True only when we *filled* the worker default into a slot the caller had no
  // value for. Distinguishes a seed-time prefill from a persisted value that
  // merely equals the default so the edit flow can suppress the former while
  // still showing the latter (see `getDimensionDisplayOptionId`).
  const prefilledDefault =
    optionID == null &&
    resolvedOptionID != null &&
    isWorkerDefaultOption(def, resolvedOptionID);

  const resolved: DimensionValue = {
    id: def.id,
    optionID: resolvedOptionID,
    ...(activeValueIsDefault && { activeValueIsDefault }),
    ...(prefilledDefault && { prefilledDefault: true }),
  };

  return visible ? resolved : { ...resolved, displayOnly: true };
};

/**
 * Composite value passed to the quickfills widget `value` prop in the format
 * `"defId-optionId"` (e.g. `"1000000023-1000000035"`).
 *
 * The edit flow must show only what the time-entry response persisted. A value
 * carrying `prefilledDefault` was filled by the seed for a dimension the
 * response had no value for (only `resolveDimensionFormValue` sets it — the
 * response mapper never does), so when defaults are NOT allowed we suppress it
 * (e.g. an STE edit where the seed transiently prefilled a default before the
 * entry `id` hydrated). A persisted value that merely *equals* the worker
 * default is not marked and is always shown.
 *
 * `allowWorkerDefault` mirrors the gate `resolveDimensionFormValue` uses to
 * decide whether a default may be prefilled (`isCreate || prefillWhenEmpty`):
 *   • create, or Clock's "prefill worker default when empty" → allowed (shown)
 *   • plain edit (STE)                                       → suppressed
 * Callers that don't pass it (e.g. Weekly, which never seeds defaults) keep the
 * plain projection.
 *
 * Returns `''` when there is no value to show (unset, explicitly cleared, or a
 * suppressed prefilled default).
 */
export const getDimensionDisplayOptionId = (
  def: DimensionDefinition,
  value?: DimensionValue,
  allowWorkerDefault?: boolean,
): string => {
  const optionID = value?.optionID;
  if (!optionID) return '';
  if (allowWorkerDefault === false && value?.prefilledDefault) return '';
  return composeDimensionQuickfillValue(def.id, optionID);
};

/** Backend sentinel when a worker default was explicitly removed. */
const WORKER_DEFAULT_REMOVED = '-1';

export interface MapDimensionsOptions {
  isCreate?: boolean;
  dirtyDimensions?: Record<string, unknown>;
  /**
   * When true, dimensions flagged `displayOnly` (inactive / not-enabled fields
   * rendered read-only on edit) are still emitted as long as they carry a
   * persisted value — the backend echoes back whatever the API returned rather
   * than silently dropping it. STE opts in on edit; Clock/WTE leave it off.
   */
  includeDisplayOnly?: boolean;
}

const shouldSendOnEdit = (
  d: DimensionValue,
  dirtyDimensions?: Record<string, unknown>,
): boolean =>
  dirtyDimensions?.[d.id] != null ||
  (d.activeValueIsDefault === true && !!d.optionID) ||
  hasDimensionValue(d) ||
  // An explicit clear (optionID '') is a change the backend must learn about —
  // sent as [] for a removed custom value or ['-1'] for a removed worker
  // default. A null/undefined optionID (no value filled) stays "untouched" and
  // is omitted. This matters most for WTE, which has no per-field dirty
  // tracking to flag the clear.
  d.optionID === '';

const toWireValues = (d: DimensionValue): string[] => {
  if (d.optionID === '' && !d.activeValueIsDefault) return [];
  const wireId = d.optionID === '' ? WORKER_DEFAULT_REMOVED : d.optionID!;
  return [extractDimensionOptionId(wireId, d.id)];
};

const toDimensionPayloadEntry = (
  d: DimensionValue,
  isCreate: boolean,
  dirtyDimensions?: Record<string, unknown>,
  includeDisplayOnly = false,
): CustomExtensionDimensionInput | null => {
  // A displayOnly (disabled/read-only) field is normally omitted, but STE opts
  // in to keep sending whatever value the API returned (see includeDisplayOnly).
  if (d.displayOnly && !includeDisplayOnly) return null;
  // Edit: only emit dimensions the user changed or that already carry a
  // persisted value / untouched worker default (echoed back).
  if (!isCreate && !shouldSendOnEdit(d, dirtyDimensions)) {
    return null;
  }

  // No value filled (`optionID` null) → omit on both create and edit; a field
  // the user never set is never sent as `[]`.
  if (d.optionID == null) {
    return null;
  }

  const values = toWireValues(d);

  // Create never emits an empty array: a cleared custom value (which resolves
  // to `[]`) is omitted, and only a selected option (`[optionId]`) or a removed
  // worker default (`['-1']`) is sent. Edit does emit `[]` — clearing an
  // existing custom value is a change the backend must learn about (a removed
  // worker default still sends `['-1']`).
  if (isCreate && values.length === 0) {
    return null;
  }

  return { definitionId: d.id, values };
};

/**
 * Build save payload. A field with no value filled (`optionID` null) is always
 * omitted — never sent as `[]`.
 *   • Create: only selected options (`[optionId]`) and removed worker defaults
 *     (`['-1']`) are sent; a cleared-custom field is omitted (never `[]`).
 *   • Edit: additionally emits `values: []` when the user clears an existing
 *     custom value, and `['-1']` when a worker default is removed.
 */
export const mapDimensionsToPayload = (
  dimensions?: Record<string, DimensionValue | undefined>,
  opts: MapDimensionsOptions = {},
): CustomExtensionsInput => ({
  dimensions: Object.values(dimensions ?? {})
    .filter((d): d is DimensionValue => !!d?.id)
    .map((d) =>
      toDimensionPayloadEntry(
        d,
        opts.isCreate ?? false,
        opts.dirtyDimensions,
        opts.includeDisplayOnly ?? false,
      ),
    )
    .filter((entry): entry is CustomExtensionDimensionInput => entry != null),
});

export const mapCustomExtensionsToDimensionValues = (
  customExtensions?: CustomExtensionsWire | null,
): Record<string, DimensionValue> => {
  const map: Record<string, DimensionValue> = {};
  customExtensions?.dimensions?.forEach(({ definition, values }) => {
    if (!definition?.id || values == null || values.length === 0) {
      return;
    }
    const raw = values[0];
    // '-1' = the worker default was removed → render empty and re-emit '-1' on
    // save. Stored as an explicit clear ('') flagged activeValueIsDefault so
    // mapDimensionsToPayload sends ['-1'] again, not [].
    if (raw === WORKER_DEFAULT_REMOVED) {
      map[definition.id] = {
        id: definition.id,
        optionID: '',
        activeValueIsDefault: true,
      };
      return;
    }
    map[definition.id] = {
      id: definition.id,
      optionID: raw,
    };
  });
  return map;
};

/**
 * Shared type definitions for the dimensions feature.
 *
 * A dimension is a categorical field (similar in shape to a CES custom field
 * dropdown) that the admin can mark as active / required / enabledForTimeTracking
 * via the Time Tracking Settings widget. These definitions drive the dimension
 * fields rendered on time-entry capture surfaces (Single Time, Weekly Time,
 * Time Clock).
 */

import type { TimeTracking_CustomExtensionDimensionInput } from 'src/__generated__/timeTracking/graphql';

/** A single selectable option inside a dimension dropdown. */
export interface DimensionOption {
  id: string;
  name: string;
  /**
   * Active flag from the API. When explicitly `false` the option is
   * filtered out before rendering; missing / `undefined` is treated as
   * active so a partial wire payload doesn't accidentally hide options.
   */
  active?: boolean;
  /**
   * Hierarchy fields — emitted by AppFoundations
   * `appFoundationsCustomDimensionValues`. The renderer uses these to draw
   * a CustomerDropdown-style indented tree:
   *   • `parentId` builds the tree shape (`buildHierarchy`)
   *   • `level`    is the absolute depth from the API (root = 0)
   *
   * Either field alone is enough to reconstruct the structure; we plumb
   * both so the component can use the safer parentId-based tree build
   * without re-deriving depth.
   */
  parentId?: string | null;
  level?: number | null;
}

/**
 * Server-side definition for one dimension, normalised to the shape the UI
 * works with regardless of which API ultimately delivers it.
 *
 * Mirrors the TimeTracking subgraph's `TimeTracking_CustomDimensionNode`
 * (qb-time-tracking PR #2934). Option lists are fetched separately via
 * `useGetDimensionOptions` and provided to the renderer through the
 * `getDimensionOptions(id)` callback.
 */
export interface DimensionDefinition {
  id: string;
  /** Display label for the field. */
  name: string;
  /** Whether the dimension is configured at all on the company. */
  active: boolean;
  /** Whether the dimension surfaces on time-entry capture surfaces. */
  enabledForTimeTracking: boolean;
  /** Whether selecting a value is mandatory when the field is visible. */
  required: boolean;
  /**
   * Pre-selected option id for the worker when `timeForId` is supplied to
   * the definitions query. Omitted when no worker context was requested or
   * the worker has no default for this dimension.
   */
  workerDefaultOptionId?: string;
}

/**
 * The value attached to a specific time entry for a dimension. Only the
 * dimension definition id and the selected option id are persisted — the
 * dimension's display name comes from `useGetDimensions`, and the option's
 * label comes from `useGetDimensionOptions`. Both are re-resolved at render
 * time, so the form never has to round-trip stale labels.
 */
export interface DimensionValue {
  /** Custom dimension definition id (the outer key on the form's map). */
  id: string;
  /**
   * Selected option id.
   *   • non-empty string — user selected a value
   *   • `''`             — user explicitly cleared a value
   *   • `null` / omitted — never set
   */
  optionID?: string | null;
  /**
   * Set to `true` when the value active at the time the form was seeded was the
   * dimension's `workerDefaultOptionId`.
   *
   * Stamped by `resolveDimensionFormValue` and preserved through `onChange` in
   * `<DimensionRow>`. Used by `mapDimensionsToPayload` to decide whether
   * clearing (`optionID = ''`) should send `['-1']` (remove the worker default)
   * or `[]` (clear a custom value with no default).
   */
  activeValueIsDefault?: boolean;
  /**
   * Edit-only values shown read-only (inactive / not enabled for time tracking).
   * Omitted from create/update payload on save.
   */
  displayOnly?: boolean;
  /**
   * Transient (display-only) marker set by `resolveDimensionFormValue` when it
   * *prefilled* the worker default into a slot the caller had no value for
   * (`optionID` was null/undefined). It distinguishes a seed-time prefill from a
   * persisted value that merely equals `workerDefaultOptionId`.
   *
   * The edit flow suppresses a prefilled default (worker defaults are a
   * create-only convenience), but still shows a persisted value even when it
   * equals the default. Never sent in the payload (`mapDimensionsToPayload`
   * rebuilds entries from `optionID` only).
   */
  prefilledDefault?: boolean;
}

/**
 * Per-dimension render decisions emitted by `computeDimensionRender`.
 * Consumers iterate over this map alongside `dimensions` to know what to draw.
 */
export interface DimensionRenderState {
  show: boolean;
  disabled: boolean;
  required: boolean;
}

/**
 * Wire shape for one dimension association on a time entry mutation input.
 *
 * Anchored to the generated `TimeTracking_CustomExtensionDimensionInput` so a
 * schema change can't silently diverge. We narrow `values` to a required
 * `string[]` (codegen has it optional) because `mapDimensionsToPayload`
 * always emits the key explicitly:
 *   • `[optionId]`  — a value is selected
 *   • `[]`          — (edit only) user cleared an existing custom value; on
 *                     create this field is omitted instead. A field with no
 *                     value filled is always omitted (never sent as `[]`).
 *   • `['-1']`      — user explicitly removed a worker default
 */
export type CustomExtensionDimensionInput = Omit<
  TimeTracking_CustomExtensionDimensionInput,
  'values'
> & {
  values: string[];
};

/**
 * Wire shape sent to the TimeEntry create / update / batch-save mutations
 * under the `customExtensions` field.
 *
 * Anchored to the generated `TimeTracking_CustomExtensionsInput`, with
 * `dimensions` narrowed to a required array (codegen has it optional) so
 * callers can read `customExtensions.dimensions.length` without guarding.
 */
export interface CustomExtensionsInput {
  dimensions: CustomExtensionDimensionInput[];
}

/**
 * Dimension association returned on `TimeTracking_TimeEntry.customExtensions`.
 * A structural projection of the generated `TimeTracking_CustomExtensionDimension`
 * — we only read `definition.id` and `values` off the query result.
 */
export interface CustomExtensionDimensionWire {
  definition: { id: string };
  values?: string[] | null;
}

export interface CustomExtensionsWire {
  dimensions?: CustomExtensionDimensionWire[] | null;
}

export const DIMENSIONS_FORM_NAME = 'dimensions';

export const DIMENSIONS_TEST_IDS = {
  WIDGET: 'dimensions-widget',
  FIELD_CONTAINER: 'dimension-field-container',
} as const;

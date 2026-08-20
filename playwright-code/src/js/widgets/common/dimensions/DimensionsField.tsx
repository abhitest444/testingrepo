import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useSandbox } from '@payroll/quicksand';
import { useGetDimensions } from 'src/js/service/hooks/dimensions/useGetDimensions';
import type { TrackingPoints } from 'src/js/common/useClickTracking';
import { useDimensionVisibility } from 'src/js/common/useDimensionVisibility';
import { isVisibleInCreate, resolveDimensionFormValue } from './dimensionUtils';
import Dimensions from './Dimensions';
import type { DimensionValue } from './types';
import { DIMENSIONS_FORM_NAME } from './types';

export interface DimensionsFieldProps {
  trackingPoint: TrackingPoints;
  isTimeEntry?: boolean;
  isOTX?: boolean;
  className?: string;
  readOnly?: boolean;
  /**
   * Clock only. Pre-fill the worker default for an active dimension that the
   * entry response had no value for, even on the edit path. The clock-out
   * screen is an UPDATE (entry id is set) but a freshly clocked-in entry has no
   * saved dimension values yet, so it should still surface worker defaults.
   * STE/WTE leave this false — defaults are create-only there.
   */
  prefillWorkerDefaultsWhenEmpty?: boolean;
}

/**
 * Orchestrator — handles gating, fetch, and seed. Passes definitions down
 * to <Dimensions /> which owns per-field rendering.
 *
 * Deliberately does NOT watch the `dimensions` form field. Watching it would
 * re-render this component on every user selection, cascade down into every
 * DimensionRow, and hand the quickfills widget a new onChange reference —
 * which the microfrontend treats as a re-init signal and clears the field.
 *
 * Seeding (worker defaults + edit-mode persisted values) runs once after the
 * definitions load so <DimensionRow> Controllers find their values already in
 * the form store on first render.
 */
const DimensionsField: React.FC<DimensionsFieldProps> = ({
  trackingPoint,
  isTimeEntry = true,
  isOTX = true,
  className,
  readOnly = false,
  prefillWorkerDefaultsWhenEmpty = false,
}) => {
  const sandbox = useSandbox();
  const formContext = useFormContext();
  const { control } = formContext;

  // Lock dimensions on approved/locked entries, mirroring how the other STE
  // fields (Class, Notes, CustomFields, etc.) self-disable by watching the
  // form's `isLocked` flag. Defaults false where the flag is absent (e.g.
  // create flows).
  const isLocked = useWatch({
    control,
    name: 'isLocked',
    defaultValue: false,
  }) as boolean;

  const { isVisible, loading } = useDimensionVisibility({ isTimeEntry, isOTX });

  // Worker the entry is being tracked for. Passed to the definitions query so
  // the backend resolves each dimension's worker default option.
  const timeForId =
    (useWatch({ control, name: 'timeFor.id' }) as string | null) ?? null;

  const { dimensions, query: queryDefinitions } = useGetDimensions();

  // Re-fetch whenever the worker (timeFor) changes so the definitions carry the
  // new worker's default option ids. Keyed on the id we last fetched for; a
  // failed fetch drops the "fetched" flag so the next render can retry.
  const hasFetchedRef = useRef(false);
  const fetchedForTimeForIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isVisible) return;
    if (hasFetchedRef.current && fetchedForTimeForIdRef.current === timeForId)
      return;
    hasFetchedRef.current = true;
    fetchedForTimeForIdRef.current = timeForId;
    queryDefinitions({ timeForId }).catch((err) => {
      hasFetchedRef.current = false;
      sandbox.logger.error(
        'Component=DimensionsField Event=FetchDefinitionsFailed',
        { error: err instanceof Error ? err.message : String(err) },
      );
    });
  }, [isVisible, queryDefinitions, sandbox, timeForId]);

  // isCreate is derived from the entry id — stable; only changes when the
  // drawer switches between create and edit mode, not on field selections.
  const timesheetId = useWatch({ control, name: 'id' });
  const isCreate = !timesheetId;

  // Signature of the current definitions' worker defaults. Changes only when a
  // refetch brings back different default option ids (i.e. the worker changed),
  // so re-seeding can key on the actual fetched data rather than on `timeForId`
  // — which would otherwise race ahead of the in-flight refetch.
  const workerDefaultsKey = useMemo(
    () =>
      dimensions
        .map((def) => `${def.id}:${def.workerDefaultOptionId ?? ''}`)
        .join('|'),
    [dimensions],
  );

  // Seed once definitions arrive: preserve hydrated API values, fill gaps
  // (worker defaults on create, displayOnly for inactive on edit).
  //
  // Keyed on `timesheetId` + the worker-defaults signature, NOT once-ever: the
  // definitions query and the entry `reset()` resolve independently, and several
  // `reset()` paths re-hydrate raw values (no displayOnly). Re-seeding once the
  // entry id appears re-stamps displayOnly on inactive dimensions so they stay
  // out of the save payload, and (for Clock) surfaces worker defaults on empty
  // edits. Re-seeding when the worker's defaults change swaps in the new
  // worker's default option ids.
  const seededKeyRef = useRef<string | null>(null);
  const seededWorkerDefaultsRef = useRef<string | null>(null);
  const [formReady, setFormReady] = useState(false);
  // Remount key for <Dimensions>, set to the seed signature currently applied
  // to the form store. Changing it forces the quickfills widgets to
  // re-initialise from the freshly-seeded values whenever the worker (timeFor)
  // changes — the widget only reads its `value` prop on init and ignores later
  // prop changes, so without a remount the fields would keep showing the
  // previous worker's values even though the form store was updated. It is
  // stable across user selections (they don't change the worker-defaults
  // signature), so a user's in-progress picks are never remounted out from
  // under them.
  const [dimensionsRemountKey, setDimensionsRemountKey] = useState('');
  useEffect(() => {
    if (!isVisible || dimensions.length === 0) return;
    const seedKey = `${timesheetId ?? ''}#${workerDefaultsKey}`;
    if (seededKeyRef.current === seedKey) return;

    // Worker (and thus its default options) changed — discard the previously
    // auto-prefilled defaults so the new worker's defaults replace them. Values
    // the user explicitly picked (no `prefilledDefault` flag) are preserved.
    const workerDefaultsChanged =
      seededWorkerDefaultsRef.current !== null &&
      seededWorkerDefaultsRef.current !== workerDefaultsKey;

    const formValues = formContext.getValues() as {
      id?: string;
      dimensions?: Record<string, DimensionValue>;
    };
    const isCreateSeed = !formValues.id;
    const seeded: Record<string, DimensionValue> = {
      ...(formValues.dimensions || {}),
    };
    if (workerDefaultsChanged) {
      Object.keys(seeded).forEach((id) => {
        if (seeded[id]?.prefilledDefault) {
          delete seeded[id];
        }
      });
    }
    dimensions.forEach((def) => {
      const resolved = resolveDimensionFormValue(
        def,
        seeded[def.id],
        isCreateSeed,
        prefillWorkerDefaultsWhenEmpty,
      );
      if (isCreateSeed && !isVisibleInCreate(def)) {
        delete seeded[def.id];
        return;
      }
      seeded[def.id] = resolved;
    });
    if (!isCreateSeed) {
      const definitionIds = new Set(dimensions.map((def) => def.id));
      Object.entries(seeded).forEach(([id, value]) => {
        if (!definitionIds.has(id)) {
          seeded[id] = { ...value, displayOnly: true };
        }
      });
    }
    formContext.setValue(DIMENSIONS_FORM_NAME, seeded, {
      shouldDirty: false,
      shouldTouch: false,
    });
    // Re-sync defaults so nested dimension controllers / quickfills init cannot
    // leave spurious dirty flags after programmatic seed.
    formContext.resetField(DIMENSIONS_FORM_NAME, { defaultValue: seeded });
    seededKeyRef.current = seedKey;
    seededWorkerDefaultsRef.current = workerDefaultsKey;
    setDimensionsRemountKey(seedKey);
    setFormReady(true);
  }, [
    isVisible,
    dimensions,
    formContext,
    timesheetId,
    workerDefaultsKey,
    prefillWorkerDefaultsWhenEmpty,
  ]);

  if (!isVisible || loading || dimensions.length === 0 || !formReady) {
    return null;
  }

  return (
    <Dimensions
      key={dimensionsRemountKey}
      dimensions={dimensions}
      isCreate={isCreate}
      readOnly={readOnly || isLocked}
      className={className}
      trackingPoint={trackingPoint}
      prefillWorkerDefaultsWhenEmpty={prefillWorkerDefaultsWhenEmpty}
    />
  );
};

export default DimensionsField;

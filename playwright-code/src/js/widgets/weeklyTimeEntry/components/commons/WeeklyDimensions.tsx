import React, { useMemo, useRef } from 'react';
import Widget from 'web-shell-core/widgets/HOCWidget';
import { useTracking } from '@payroll/quicksand';
import styled from 'styled-components';
import {
  computeDimensionRenderMap,
  extractDimensionOptionId,
  getDimensionDisplayOptionId,
  isWorkerDefaultOption,
  resolveDimensionFormValue,
  DIMENSIONS_TEST_IDS,
  type DimensionDefinition,
  type DimensionValue,
} from 'src/js/widgets/common/dimensions';
import { selectDimensionsState } from '../../store/dimensionsSlice';
import { useWeeklyTimeTrackingPoints } from '../../hooks/useWeeklyTimeTrackingPoints';
import { useDimensionsData } from '../../hooks/useDimensionsData';
import { useAppDispatch, useAppSelector } from '../../store';
import { selectSelectedCell } from '../../store/selectors';
import { updateCell, timeEntryDetails } from '../../store/timeEntryGridSlice';

const DimensionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

const DimensionWrapper = styled.div`
  width: 100%;
`;

/**
 * Shape of the onChange event fired by the quickfills widget when
 * type="dimension".
 * value is nested at `selectedItem.dimension.id` (a composite "<defId>-<optionId>").
 */
interface QuickfillsDimensionChangeEvent {
  selectedItem?: {
    dimension?: {
      id: string;
      definitionId: string;
      dimensionValueId: string;
      fullyQualifiedLabel: string;
    };
  };
}

interface WeeklyDimensionsProps {
  disabled?: boolean;
  displayCell: timeEntryDetails | null;
  fieldErrors?: { [definitionId: string]: string };
}

interface WeeklyDimensionRowProps {
  def: DimensionDefinition;
  value?: DimensionValue;
  disabled: boolean;
  required: boolean;
  errorText?: string;
  onSelect: (
    definitionId: string,
    definitionName: string,
    optionID: string,
    activeValueIsDefault: boolean,
  ) => void;
}

/**
 * Self-contained dimension field row backed by the quickfills widget.
 *
 * The quickfills widget (`type="dimension"`) fetches and renders its own option
 * list */
const WeeklyDimensionRow: React.FC<WeeklyDimensionRowProps> = React.memo(
  ({ def, value, disabled, required, errorText, onSelect }) => {
    const track = useTracking();
    const trackingPoints = useWeeklyTimeTrackingPoints();

    const handleRef = useRef<(e: QuickfillsDimensionChangeEvent) => void>(
      () => {},
    );
    const stableOnChange = useRef((e: QuickfillsDimensionChangeEvent) =>
      handleRef.current(e),
    ).current;
    // Quickfills fires empty/duplicate onChange on mount. Ignore init noise
    // until the user engages the field; real selections and clears proceed
    // once engaged.
    const userInteractedRef = useRef(false);
    // Synchronous mirror of the value currently applied to this row. Redux
    // commits are async, so we cannot rely on the `value` prop to have updated
    // between two onChange events fired in the same tick. Keeping the last
    // applied selection here lets us treat quickfills' duplicate/re-assert
    // events as no-ops (STE achieves the same via react-hook-form `getValues`).
    const settledRef = useRef<DimensionValue | undefined>(value);
    settledRef.current = value;

    // Refresh the handler body every render so the closure is always current.
    handleRef.current = (e: QuickfillsDimensionChangeEvent) => {
      const rawId = e?.selectedItem?.dimension?.id ?? '';
      const isClear = !rawId;
      const optionID = extractDimensionOptionId(rawId, def.id);
      const settled = settledRef.current;
      const currentOptionId = settled?.optionID ?? '';
      const hadValue = String(currentOptionId).trim() !== '';

      // Ignore an empty onChange when there is nothing to clear or the user has
      // not engaged the field yet — quickfills fires an empty change on mount /
      // when opening the dropdown, which would otherwise wipe a hydrated value.
      if (isClear && (!hadValue || !userInteractedRef.current)) {
        return;
      }

      // Flag when clearing a value that was the worker default so the payload
      // sends ['-1'] (removed default) rather than [] (removed custom value).
      const wasWorkerDefault =
        !!settled?.activeValueIsDefault ||
        isWorkerDefaultOption(def, settled?.optionID);
      const activeValueIsDefault = isClear
        ? wasWorkerDefault
        : isWorkerDefaultOption(def, optionID);

      // No-op when the value is unchanged — quickfills re-asserts the current
      // selection on mount and can fire the same change twice for one click.
      // Skipping here prevents duplicate dispatches and duplicate track events.
      if (
        currentOptionId === optionID &&
        !!settled?.activeValueIsDefault === activeValueIsDefault
      ) {
        return;
      }

      settledRef.current = {
        id: def.id,
        optionID,
        ...(activeValueIsDefault ? { activeValueIsDefault: true } : {}),
      };
      onSelect(def.id, def.name, optionID, activeValueIsDefault);
      track(
        trackingPoints.DIMENSION_DROPDOWN ??
          trackingPoints.CUSTOM_FIELD_DROPDOWN,
      );
    };

    const label = required ? `${def.name} *` : def.name;
    const currentOptionId = getDimensionDisplayOptionId(def, value);

    return (
      <DimensionWrapper
        data-testid={`${DIMENSIONS_TEST_IDS.FIELD_CONTAINER}-${def.id}`}
        onFocusCapture={() => {
          userInteractedRef.current = true;
        }}
        onMouseDown={() => {
          userInteractedRef.current = true;
        }}
      >
        <Widget
          data-testid={`dimension-${def.id}`}
          widgetId="qbo-quickfills-ui/quickfills"
          type="dimension"
          definitionId={def.id}
          value={currentOptionId}
          disabled={disabled}
          addNew={false}
          enableSubmenu={false}
          onChange={stableOnChange}
          width="100%"
          label={label}
          ariaLabel={label}
          errorText={errorText}
        />
      </DimensionWrapper>
    );
  },
);

/**
 * Renders the custom dimensions block in the weekly time entry side panel.
 *
 * Visibility / disabled / required decisions are delegated to the shared
 * `computeDimensionRenderMap`, so the create/edit matrix stays identical
 * across host widgets.
 */
export const WeeklyDimensions: React.FC<WeeklyDimensionsProps> = ({
  disabled = false,
  displayCell,
  fieldErrors = {},
}) => {
  const dispatch = useAppDispatch();
  const selectedCell = useAppSelector(selectSelectedCell);

  // Co-locate the fetch with the consumer (mirrors STE's `DimensionsField`).
  // This guarantees definitions load whenever the panel renders, independent
  // of grid-init timing.
  const { isVisible } = useDimensionsData();

  const { dimensions } = useAppSelector(selectDimensionsState);

  // Map the cell's persisted dimension values into the shape the shared
  // render-state helper expects: definitionId -> { id, optionID }.
  const valuesById = useMemo(() => {
    const map: Record<string, DimensionValue> = {};
    (displayCell?.dimensions || []).forEach((dim) => {
      map[dim.id] = {
        id: dim.id,
        optionID: dim.optionID,
        ...(dim.activeValueIsDefault ? { activeValueIsDefault: true } : {}),
      };
    });
    return map;
  }, [displayCell?.dimensions]);

  // create-mode when the cell has no persisted time entry id yet.
  const isCreate = !displayCell?.timeEntryId;

  const renderState = useMemo(
    () => computeDimensionRenderMap(dimensions, valuesById, isCreate),
    [dimensions, valuesById, isCreate],
  );

  const visibleDimensions = useMemo(
    () => dimensions.filter((def) => renderState[def.id]?.show),
    [dimensions, renderState],
  );

  // Resolve each dimension's effective display value (pre-filling the worker
  // default on create, same rule `DimensionsField` seeds into form state).
  // Kept separate from `valuesById` above so `computeDimensionRenderMap`
  // continues to see the raw persisted values for its show/disabled decisions.
  const resolvedValuesById = useMemo(() => {
    const map: Record<string, DimensionValue> = {};
    visibleDimensions.forEach((def) => {
      map[def.id] = resolveDimensionFormValue(
        def,
        valuesById[def.id],
        isCreate,
      );
    });
    return map;
  }, [visibleDimensions, valuesById, isCreate]);

  const handleDimensionChange = (
    definitionId: string,
    definitionName: string,
    optionID: string,
    activeValueIsDefault: boolean,
  ) => {
    if (!selectedCell) return;

    dispatch(
      updateCell({
        rowId: selectedCell.rowId,
        dayIdx: selectedCell.dayIdx,
        value: {
          dimensions: [
            ...(displayCell?.dimensions || []).filter(
              (dim) => dim.id !== definitionId,
            ),
            {
              id: definitionId,
              name: definitionName,
              optionID,
              ...(activeValueIsDefault ? { activeValueIsDefault: true } : {}),
            },
          ],
        },
      }),
    );
  };

  // dimension to show for the selected cell. Per-field inputs are disabled
  // via `!selectedCell || disabled` below
  if (!isVisible || visibleDimensions.length === 0) {
    return null;
  }

  return (
    <DimensionsContainer data-testid={DIMENSIONS_TEST_IDS.WIDGET}>
      {visibleDimensions.map((def) => {
        const decision = renderState[def.id];
        return (
          <WeeklyDimensionRow
            key={def.id}
            def={def}
            value={resolvedValuesById[def.id]}
            disabled={disabled || !selectedCell || !!decision?.disabled}
            required={!!decision?.required}
            errorText={fieldErrors[def.id]}
            onSelect={handleDimensionChange}
          />
        );
      })}
    </DimensionsContainer>
  );
};

export default WeeklyDimensions;

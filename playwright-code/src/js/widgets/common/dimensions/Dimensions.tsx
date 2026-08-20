import React, { useRef } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import Widget from 'web-shell-core/widgets/HOCWidget';
import { useIntl, useTracking } from '@payroll/quicksand';
import type { TrackingPoints } from 'src/js/common/useClickTracking';
import {
  computeDimensionRender,
  extractDimensionOptionId,
  getDimensionDisplayOptionId,
  isWorkerDefaultOption,
} from './dimensionUtils';
import { DimensionsBlock, DimensionFieldRow } from './Dimensions.styled';
import {
  DIMENSIONS_FORM_NAME,
  DIMENSIONS_TEST_IDS,
  type DimensionDefinition,
  type DimensionValue,
} from './types';

/**
 * Shape of the onChange event fired by the quickfills widget when
 * type="dimension". Confirmed from dimensions-ui QuickfillChangeEvent type.
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

export interface DimensionsProps {
  dimensions: DimensionDefinition[];
  isCreate: boolean;
  readOnly?: boolean;
  className?: string;
  trackingPoint: TrackingPoints;
  /**
   * Clock only. When true the worker default may be surfaced for an active
   * dimension the entry response had no value for, even on the edit path
   * (clock-out of a freshly clocked-in entry). STE/WTE leave this false so
   * defaults are never shown on edit.
   */
  prefillWorkerDefaultsWhenEmpty?: boolean;
}

interface DimensionRowProps {
  def: DimensionDefinition;
  isCreate: boolean;
  readOnly: boolean;
  trackingPoint: TrackingPoints;
  prefillWorkerDefaultsWhenEmpty: boolean;
}

/**
 * Self-contained dimension field row.
 *
 * The key invariant is that the `onChange` reference passed to the quickfills
 * Widget never changes for the lifetime of this component. The widget treats a
 * new `onChange` reference as a re-init signal and fires an empty change event,
 * which would wipe the user's selection.
 *
 * We use the handleRef / stableOnChange pattern to achieve this:
 *   • handleRef.current is updated every render to capture the latest closure
 *     (fresh field.onChange, def, track).
 *   • stableOnChange is created once at mount (.current read immediately) and
 *     always delegates to handleRef.current. Its reference never changes.
 *
 * All hooks — including the two useRefs — are called unconditionally before any
 * early return so that React's Rules of Hooks are never violated.
 */
const DimensionRow: React.FC<DimensionRowProps> = React.memo(
  ({
    def,
    isCreate,
    readOnly,
    trackingPoint,
    prefillWorkerDefaultsWhenEmpty,
  }) => {
    const intl = useIntl();
    const track = useTracking();
    const fieldName = `${DIMENSIONS_FORM_NAME}.${def.id}` as const;
    const { control, setValue, getValues } = useFormContext();

    const { field, fieldState } = useController({
      name: fieldName,
      control,
      // Values are seeded by DimensionsField before rows mount — no default here
      // or quickfills init would diverge from the form store and mark dirty.
      rules: {
        validate: (val: DimensionValue | undefined) => {
          const { required } = computeDimensionRender(def, val, isCreate);
          if (!required) return undefined;
          if (!val?.optionID?.trim()) {
            return intl.formatMessage({ id: 'drawer.field.required' });
          }
          return undefined;
        },
      },
    });

    // Both refs MUST be declared here — before any conditional return — to
    // satisfy React's Rules of Hooks.
    const handleRef = useRef<(e: QuickfillsDimensionChangeEvent) => void>(
      () => {},
    );
    const stableOnChange = useRef((e: QuickfillsDimensionChangeEvent) =>
      handleRef.current(e),
    ).current;
    // Quickfills fires empty/duplicate onChange on mount. Ignore init noise until
    // the user engages the field; real selections and clears proceed once engaged.
    const userInteractedRef = useRef(false);

    const valueOnEntry = field.value as DimensionValue | undefined;
    const { show, disabled, required } = computeDimensionRender(
      def,
      valueOnEntry,
      isCreate,
    );

    // Refresh the handler body every render so the closure is always current.
    // The quickfills widget for type="dimension" nests the selected value at
    // selectedItem.dimension.id (not selectedItem.id).
    handleRef.current = (e: QuickfillsDimensionChangeEvent) => {
      const rawId = e?.selectedItem?.dimension?.id ?? '';
      const settled = getValues(fieldName) as DimensionValue | undefined;
      const currentOptionId = settled?.optionID ?? null;
      const nextOptionId = extractDimensionOptionId(rawId, def.id);
      const isClear = !rawId;
      const hadValue =
        currentOptionId != null && String(currentOptionId).trim() !== '';

      // Ignore an empty onChange when there is nothing to clear:
      //   • the field holds no value the user actually filled (`!hadValue`) —
      //     quickfills fires an empty change just for opening/closing the
      //     dropdown, and writing '' here would send a spurious [] on save; or
      //   • it's the init-time empty change while a seeded / hydrated value is
      //     still in the form and the user hasn't engaged the field yet.
      // A genuine clear of an existing value (hadValue + engaged) proceeds.
      if (isClear && (!hadValue || !userInteractedRef.current)) {
        return;
      }

      const wasWorkerDefault =
        !!settled?.activeValueIsDefault ||
        isWorkerDefaultOption(def, settled?.optionID);
      const next: DimensionValue = {
        id: def.id,
        optionID: isClear ? '' : nextOptionId,
        displayOnly: false,
        ...(isClear
          ? wasWorkerDefault && { activeValueIsDefault: true }
          : isWorkerDefaultOption(def, nextOptionId) && {
              activeValueIsDefault: true,
            }),
      };
      // No-op when the value is unchanged — avoids spurious dirty from quickfills
      // re-asserting the current selection on mount (or user re-picking the same option).
      if (
        settled?.optionID === next.optionID &&
        !!settled?.activeValueIsDefault === !!next.activeValueIsDefault
      ) {
        return;
      }
      // Validate on change so a required dimension shows its error the moment
      // it is cleared, and clears the error as soon as a value is chosen.
      setValue(fieldName, next, { shouldDirty: true, shouldValidate: true });
      track(trackingPoint.DIMENSION_DROPDOWN ?? trackingPoint);
    };

    if (!show) return null;

    const isDisabled = readOnly || disabled;
    const label = required ? `${def.name} *` : def.name;
    // Defaults may only be surfaced on create, or on Clock's prefill-on-empty
    // edit — matching the gate `resolveDimensionFormValue` uses to seed them.
    // On a plain (STE) edit a value equal to the worker default is a seed-time
    // prefill and is suppressed.
    const allowWorkerDefault = isCreate || prefillWorkerDefaultsWhenEmpty;
    const currentOptionId = getDimensionDisplayOptionId(
      def,
      valueOnEntry,
      allowWorkerDefault,
    );

    return (
      <DimensionFieldRow
        data-testid={`${DIMENSIONS_TEST_IDS.FIELD_CONTAINER}-${def.id}`}
        onFocusCapture={() => {
          userInteractedRef.current = true;
        }}
        onMouseDown={() => {
          userInteractedRef.current = true;
        }}
      >
        <Widget
          data-testid={`${DIMENSIONS_TEST_IDS.FIELD_CONTAINER}-${def.id}-quickfill`}
          widgetId="qbo-quickfills-ui/quickfills"
          type="dimension"
          definitionId={def.id}
          value={currentOptionId}
          disabled={isDisabled}
          addNew={false}
          enableSubmenu={false}
          onChange={stableOnChange}
          width="100%"
          label={label}
          ariaLabel={label}
          errorText={fieldState.error?.message}
        />
      </DimensionFieldRow>
    );
  },
);

const Dimensions: React.FC<DimensionsProps> = ({
  dimensions,
  isCreate,
  readOnly = false,
  className,
  trackingPoint,
  prefillWorkerDefaultsWhenEmpty = false,
}) => {
  if (dimensions.length === 0) return null;

  return (
    <DimensionsBlock
      className={className}
      data-testid={DIMENSIONS_TEST_IDS.WIDGET}
    >
      {dimensions.map((def) => (
        <DimensionRow
          key={def.id}
          def={def}
          isCreate={isCreate}
          readOnly={readOnly}
          trackingPoint={trackingPoint}
          prefillWorkerDefaultsWhenEmpty={prefillWorkerDefaultsWhenEmpty}
        />
      ))}
    </DimensionsBlock>
  );
};

export default Dimensions;

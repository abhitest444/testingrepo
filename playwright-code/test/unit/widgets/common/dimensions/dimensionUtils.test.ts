import {
  composeDimensionQuickfillValue,
  computeDimensionRender,
  computeDimensionRenderMap,
  extractDimensionOptionId,
  getDimensionDisplayOptionId,
  hasDimensionValue,
  isRequiredOnForm,
  isVisibleInCreate,
  isWorkerDefaultOption,
  mapCustomExtensionsToDimensionValues,
  mapDimensionsToPayload,
  resolveDimensionFormValue,
} from 'src/js/widgets/common/dimensions/dimensionUtils';
import type {
  DimensionDefinition,
  DimensionValue,
} from 'src/js/widgets/common/dimensions/types';

const def = (overrides: Partial<DimensionDefinition>): DimensionDefinition => ({
  id: 'dim-1',
  name: 'Dimension 1',
  active: true,
  enabledForTimeTracking: true,
  required: false,
  ...overrides,
});

describe('dimensionUtils', () => {
  describe('isVisibleInCreate', () => {
    it('is true when active AND enabledForTimeTracking', () => {
      expect(isVisibleInCreate(def({}))).toBe(true);
    });

    it('is false when inactive', () => {
      expect(isVisibleInCreate(def({ active: false }))).toBe(false);
    });

    it('is false when not enabled for time tracking', () => {
      expect(isVisibleInCreate(def({ enabledForTimeTracking: false }))).toBe(
        false,
      );
    });
  });

  describe('isRequiredOnForm', () => {
    it('returns false when not visible in create mode, even if required', () => {
      expect(isRequiredOnForm(def({ active: false, required: true }))).toBe(
        false,
      );
    });

    it('returns true only when visible AND required', () => {
      expect(isRequiredOnForm(def({ required: true }))).toBe(true);
      expect(isRequiredOnForm(def({ required: false }))).toBe(false);
    });
  });

  describe('hasDimensionValue', () => {
    it('is true when optionID is set', () => {
      const v: DimensionValue = { id: 'a', optionID: 'opt-1' };
      expect(hasDimensionValue(v)).toBe(true);
    });

    it('is false for undefined / empty', () => {
      expect(hasDimensionValue(undefined)).toBe(false);
      expect(hasDimensionValue({ id: 'a' })).toBe(false);
      expect(hasDimensionValue({ id: 'a', optionID: '' })).toBe(false);
    });
  });

  describe('computeDimensionRender (create flow)', () => {
    it('shows + enables + marks required when active+enabled+required', () => {
      const out = computeDimensionRender(
        def({ required: true }),
        undefined,
        true,
      );
      expect(out).toEqual({ show: true, disabled: false, required: true });
    });

    it('shows + enables without required when active+enabled, not required', () => {
      const out = computeDimensionRender(def({}), undefined, true);
      expect(out).toEqual({ show: true, disabled: false, required: false });
    });

    it('hides when inactive', () => {
      const out = computeDimensionRender(
        def({ active: false, required: true }),
        undefined,
        true,
      );
      expect(out.show).toBe(false);
    });

    it('hides when !enabledForTimeTracking', () => {
      const out = computeDimensionRender(
        def({ enabledForTimeTracking: false }),
        undefined,
        true,
      );
      expect(out.show).toBe(false);
    });
  });

  describe('computeDimensionRender (edit flow)', () => {
    it('shows + enables + required when active+enabled+required', () => {
      const out = computeDimensionRender(
        def({ required: true }),
        undefined,
        false,
      );
      expect(out).toEqual({ show: true, disabled: false, required: true });
    });

    it('shows as disabled when inactive but entry has a persisted value', () => {
      const out = computeDimensionRender(
        def({ active: false, required: true }),
        { id: 'dim-1', optionID: 'opt-persisted' },
        false,
      );
      expect(out).toEqual({ show: true, disabled: true, required: false });
    });

    it('shows as disabled when !enabledForTimeTracking but entry has a persisted value', () => {
      const out = computeDimensionRender(
        def({ enabledForTimeTracking: false, required: true }),
        { id: 'dim-1', optionID: 'opt-7' },
        false,
      );
      expect(out).toEqual({ show: true, disabled: true, required: false });
    });

    it('hides when inactive and the value is a removed worker default (-1)', () => {
      const out = computeDimensionRender(
        def({ active: false }),
        { id: 'dim-1', optionID: '', displayOnly: true },
        false,
      );
      expect(out).toEqual({ show: false, disabled: false, required: false });
    });

    it('hides when inactive and the value is a removed-default record (WTE shape)', () => {
      const out = computeDimensionRender(
        def({ active: false }),
        { id: 'dim-1', optionID: '', activeValueIsDefault: true },
        false,
      );
      expect(out).toEqual({ show: false, disabled: false, required: false });
    });

    it('hides when inactive AND entry has no value', () => {
      const out = computeDimensionRender(
        def({ active: false }),
        undefined,
        false,
      );
      expect(out.show).toBe(false);
    });

    it('hides when !enabledForTimeTracking AND entry has no value', () => {
      const out = computeDimensionRender(
        def({ enabledForTimeTracking: false }),
        undefined,
        false,
      );
      expect(out.show).toBe(false);
    });
  });

  describe('computeDimensionRenderMap', () => {
    const definitions = [
      def({ id: 'd-active', active: true, enabledForTimeTracking: true }),
      def({
        id: 'd-inactive-with-value',
        active: false,
        enabledForTimeTracking: false,
      }),
      def({
        id: 'd-inactive-no-value',
        active: false,
        enabledForTimeTracking: false,
      }),
    ];

    const valuesById: Record<string, DimensionValue | undefined> = {
      'd-inactive-with-value': {
        id: 'd-inactive-with-value',
        optionID: 'opt-x',
      },
    };

    it('produces a map keyed by dimension id', () => {
      const map = computeDimensionRenderMap(definitions, valuesById, false);
      expect(Object.keys(map).sort()).toEqual(
        ['d-active', 'd-inactive-no-value', 'd-inactive-with-value'].sort(),
      );
    });
  });

  describe('isWorkerDefaultOption', () => {
    it('is true when optionID matches workerDefaultOptionId', () => {
      expect(
        isWorkerDefaultOption(
          def({ workerDefaultOptionId: 'default-opt' }),
          'default-opt',
        ),
      ).toBe(true);
    });

    it('is false for empty, null, or a different option', () => {
      const dimension = def({ workerDefaultOptionId: 'default-opt' });
      expect(isWorkerDefaultOption(dimension, '')).toBe(false);
      expect(isWorkerDefaultOption(dimension, null)).toBe(false);
      expect(isWorkerDefaultOption(dimension, 'other-opt')).toBe(false);
      expect(isWorkerDefaultOption(dimension, undefined)).toBe(false);
    });
  });

  describe('mapDimensionsToPayload', () => {
    describe('create', () => {
      it('maps selected dimensions', () => {
        expect(
          mapDimensionsToPayload(
            {
              'dim-1': { id: 'dim-1', optionID: 'opt-1' },
              'dim-2': { id: 'dim-2', optionID: 'opt-2' },
            },
            { isCreate: true },
          ),
        ).toEqual({
          dimensions: [
            { definitionId: 'dim-1', values: ['opt-1'] },
            { definitionId: 'dim-2', values: ['opt-2'] },
          ],
        });
      });

      it('omits unset (no-default) dimensions', () => {
        expect(mapDimensionsToPayload(undefined, { isCreate: true })).toEqual({
          dimensions: [],
        });
        expect(
          mapDimensionsToPayload(
            {
              'dim-1': { id: 'dim-1', optionID: null },
              'dim-2': { id: 'dim-2' },
            },
            { isCreate: true },
          ),
        ).toEqual({
          dimensions: [],
        });
      });

      it('omits a cleared custom value (never sends []) on create', () => {
        expect(
          mapDimensionsToPayload(
            { 'dim-1': { id: 'dim-1', optionID: '' } },
            { isCreate: true },
          ),
        ).toEqual({ dimensions: [] });
      });

      it('sends the worker default id for an untouched default', () => {
        expect(
          mapDimensionsToPayload(
            {
              'dim-1': {
                id: 'dim-1',
                optionID: 'default-opt',
                activeValueIsDefault: true,
              },
            },
            { isCreate: true },
          ),
        ).toEqual({
          dimensions: [{ definitionId: 'dim-1', values: ['default-opt'] }],
        });
      });

      it('sends ["-1"] when a worker default is removed', () => {
        expect(
          mapDimensionsToPayload(
            {
              'dim-1': {
                id: 'dim-1',
                optionID: '',
                activeValueIsDefault: true,
              },
            },
            { isCreate: true },
          ),
        ).toEqual({
          dimensions: [{ definitionId: 'dim-1', values: ['-1'] }],
        });
      });
    });

    describe('edit', () => {
      it('sends dirty dimensions', () => {
        expect(
          mapDimensionsToPayload(
            { 'dim-1': { id: 'dim-1', optionID: 'opt-1' } },
            { isCreate: false, dirtyDimensions: { 'dim-1': true } },
          ),
        ).toEqual({
          dimensions: [{ definitionId: 'dim-1', values: ['opt-1'] }],
        });
      });

      it('includes persisted dimensions even when not dirty', () => {
        expect(
          mapDimensionsToPayload({
            'dim-1': { id: 'dim-1', optionID: 'opt-1' },
            'dim-2': { id: 'dim-2', optionID: 'opt-2' },
          }),
        ).toEqual({
          dimensions: [
            { definitionId: 'dim-1', values: ['opt-1'] },
            { definitionId: 'dim-2', values: ['opt-2'] },
          ],
        });
      });

      it('includes untouched worker defaults even when not dirty', () => {
        expect(
          mapDimensionsToPayload({
            'dim-1': {
              id: 'dim-1',
              optionID: 'default-opt',
              activeValueIsDefault: true,
            },
          }),
        ).toEqual({
          dimensions: [{ definitionId: 'dim-1', values: ['default-opt'] }],
        });
      });

      it('omits never-set dimensions', () => {
        expect(
          mapDimensionsToPayload({
            'dim-1': { id: 'dim-1', optionID: null },
          }),
        ).toEqual({ dimensions: [] });
      });

      it('sends values: [] when user clears a custom value', () => {
        expect(
          mapDimensionsToPayload(
            { 'dim-1': { id: 'dim-1', optionID: '' } },
            { isCreate: false, dirtyDimensions: { 'dim-1': true } },
          ),
        ).toEqual({
          dimensions: [{ definitionId: 'dim-1', values: [] }],
        });
      });

      it('omits a dimension with no value filled even when touched', () => {
        expect(
          mapDimensionsToPayload(
            { 'dim-1': { id: 'dim-1', optionID: null } },
            { isCreate: false, dirtyDimensions: { 'dim-1': true } },
          ),
        ).toEqual({ dimensions: [] });
      });

      it('sends ["-1"] for a removed worker default', () => {
        expect(
          mapDimensionsToPayload(
            {
              'dim-1': {
                id: 'dim-1',
                optionID: '',
                activeValueIsDefault: true,
              },
            },
            { isCreate: false, dirtyDimensions: { 'dim-1': true } },
          ),
        ).toEqual({
          dimensions: [{ definitionId: 'dim-1', values: ['-1'] }],
        });
      });

      it('sends values: [] for a cleared custom value even when not dirty', () => {
        // WTE has no per-field dirty tracking; an explicit clear (optionID '')
        // must still reach the backend as [] rather than being omitted.
        expect(
          mapDimensionsToPayload({
            'dim-1': { id: 'dim-1', optionID: '' },
          }),
        ).toEqual({
          dimensions: [{ definitionId: 'dim-1', values: [] }],
        });
      });

      it('includes removed worker default even when not dirty', () => {
        expect(
          mapDimensionsToPayload({
            'dim-1': { id: 'dim-1', optionID: '', activeValueIsDefault: true },
          }),
        ).toEqual({
          dimensions: [{ definitionId: 'dim-1', values: ['-1'] }],
        });
      });

      it('maps hydrated edit-flow dimensions and drops displayOnly', () => {
        const result = mapDimensionsToPayload({
          '1000000023': { id: '1000000023', optionID: '1000000035' },
          '1000000024': {
            id: '1000000024',
            optionID: '1000000059',
            displayOnly: true,
          },
          '1000000025': {
            id: '1000000025',
            optionID: '',
            activeValueIsDefault: true,
          },
          '1000000026': { id: '1000000026', optionID: '1000000061' },
        });

        expect(result.dimensions).toEqual(
          expect.arrayContaining([
            { definitionId: '1000000023', values: ['1000000035'] },
            { definitionId: '1000000025', values: ['-1'] },
            { definitionId: '1000000026', values: ['1000000061'] },
          ]),
        );
        expect(result.dimensions).toHaveLength(3);
      });
    });

    describe('wire values', () => {
      it('drops displayOnly dimensions', () => {
        expect(
          mapDimensionsToPayload({
            'dim-1': { id: 'dim-1', optionID: 'opt-1', displayOnly: true },
          }),
        ).toEqual({ dimensions: [] });
      });

      it('sends displayOnly dimensions with a value when includeDisplayOnly is set', () => {
        expect(
          mapDimensionsToPayload(
            {
              'dim-1': { id: 'dim-1', optionID: 'opt-1', displayOnly: true },
            },
            { includeDisplayOnly: true },
          ),
        ).toEqual({
          dimensions: [{ definitionId: 'dim-1', values: ['opt-1'] }],
        });
      });

      it('still omits a displayOnly dimension with no value even when includeDisplayOnly is set', () => {
        expect(
          mapDimensionsToPayload(
            {
              'dim-1': { id: 'dim-1', optionID: null, displayOnly: true },
            },
            { includeDisplayOnly: true },
          ),
        ).toEqual({ dimensions: [] });
      });

      it('strips composite quickfill prefix before sending', () => {
        expect(
          mapDimensionsToPayload(
            { 'dim-1': { id: 'dim-1', optionID: 'dim-1-opt-1' } },
            { isCreate: true },
          ),
        ).toEqual({
          dimensions: [{ definitionId: 'dim-1', values: ['opt-1'] }],
        });
      });

      it('leaves plain option ids unchanged', () => {
        expect(
          mapDimensionsToPayload(
            { 'dim-1': { id: 'dim-1', optionID: 'opt-1' } },
            { isCreate: true },
          ),
        ).toEqual({
          dimensions: [{ definitionId: 'dim-1', values: ['opt-1'] }],
        });
      });
    });
  });

  describe('resolveDimensionFormValue', () => {
    it('keeps persisted non-empty values in edit mode', () => {
      expect(
        resolveDimensionFormValue(
          def({ workerDefaultOptionId: 'default-opt' }),
          { id: 'dim-1', optionID: 'saved-opt' },
          false,
        ),
      ).toEqual({ id: 'dim-1', optionID: 'saved-opt' });
    });

    it('preserves explicit clear', () => {
      expect(
        resolveDimensionFormValue(
          def({ workerDefaultOptionId: 'default-opt' }),
          { id: 'dim-1', optionID: '' },
          true,
        ),
      ).toEqual({ id: 'dim-1', optionID: '' });
    });

    it('prefills worker default on create when nothing is set', () => {
      expect(
        resolveDimensionFormValue(
          def({ workerDefaultOptionId: 'default-opt' }),
          undefined,
          true,
        ),
      ).toEqual({
        id: 'dim-1',
        optionID: 'default-opt',
        activeValueIsDefault: true,
        prefilledDefault: true,
      });
    });

    it('prefills worker default on edit when seedDefaultWhenEmpty is true', () => {
      expect(
        resolveDimensionFormValue(
          def({ workerDefaultOptionId: 'default-opt' }),
          undefined,
          false,
          true,
        ),
      ).toEqual({
        id: 'dim-1',
        optionID: 'default-opt',
        activeValueIsDefault: true,
        prefilledDefault: true,
      });
    });

    it('does NOT mark a persisted value equal to the worker default as prefilled', () => {
      // Distinguishes a saved value that equals the default from a seed-time
      // prefill — the edit flow shows the former and suppresses the latter.
      expect(
        resolveDimensionFormValue(
          def({ workerDefaultOptionId: 'default-opt' }),
          { id: 'dim-1', optionID: 'default-opt' },
          false,
        ),
      ).toEqual({
        id: 'dim-1',
        optionID: 'default-opt',
        activeValueIsDefault: true,
      });
    });

    it('does not prefill worker default on create when dimension is not visible', () => {
      expect(
        resolveDimensionFormValue(
          def({
            workerDefaultOptionId: 'default-opt',
            enabledForTimeTracking: false,
          }),
          undefined,
          true,
        ),
      ).toEqual({ id: 'dim-1', optionID: null, displayOnly: true });
    });

    it('marks invisible persisted values as displayOnly on update', () => {
      expect(
        resolveDimensionFormValue(
          def({ active: false, enabledForTimeTracking: false }),
          { id: 'dim-1', optionID: 'saved-opt' },
          false,
        ),
      ).toEqual({
        id: 'dim-1',
        optionID: 'saved-opt',
        displayOnly: true,
      });
    });

    it('uses null on create when there is no worker default', () => {
      expect(resolveDimensionFormValue(def({}), undefined, true)).toEqual({
        id: 'dim-1',
        optionID: null,
      });
    });

    it('does not prefill worker default on edit when entry has no value', () => {
      expect(
        resolveDimensionFormValue(
          def({ workerDefaultOptionId: 'default-opt' }),
          undefined,
          false,
        ),
      ).toEqual({ id: 'dim-1', optionID: null });
    });

    it('preserves activeValueIsDefault through re-initialization', () => {
      expect(
        resolveDimensionFormValue(
          def({ workerDefaultOptionId: 'default-opt' }),
          { id: 'dim-1', optionID: '', activeValueIsDefault: true },
          false,
        ),
      ).toEqual({
        id: 'dim-1',
        optionID: '',
        activeValueIsDefault: true,
      });
    });
  });

  describe('mapCustomExtensionsToDimensionValues', () => {
    it('maps customExtensions response to form dimension values', () => {
      expect(
        mapCustomExtensionsToDimensionValues({
          dimensions: [
            { definition: { id: 'dim-1' }, values: ['opt-1'] },
            { definition: { id: 'dim-2' }, values: ['opt-2'] },
          ],
        }),
      ).toEqual({
        'dim-1': { id: 'dim-1', optionID: 'opt-1' },
        'dim-2': { id: 'dim-2', optionID: 'opt-2' },
      });
    });

    it('maps cleared defaults from empty string values', () => {
      expect(
        mapCustomExtensionsToDimensionValues({
          dimensions: [{ definition: { id: 'dim-1' }, values: [''] }],
        }),
      ).toEqual({
        'dim-1': { id: 'dim-1', optionID: '' },
      });
    });

    it('maps the "-1" removed-default sentinel to an explicit clear flagged activeValueIsDefault', () => {
      expect(
        mapCustomExtensionsToDimensionValues({
          dimensions: [{ definition: { id: 'dim-1' }, values: ['-1'] }],
        }),
      ).toEqual({
        'dim-1': { id: 'dim-1', optionID: '', activeValueIsDefault: true },
      });
    });

    it('ignores entries without definition id or values array', () => {
      expect(
        mapCustomExtensionsToDimensionValues({
          dimensions: [
            { definition: { id: 'dim-1' }, values: [] },
            { definition: { id: '' }, values: ['opt-1'] },
          ],
        }),
      ).toEqual({});
    });
  });

  describe('composeDimensionQuickfillValue', () => {
    it('joins defId and optionId with a hyphen', () => {
      expect(composeDimensionQuickfillValue('1000000023', '1000000035')).toBe(
        '1000000023-1000000035',
      );
    });

    it('handles optionIds that themselves contain hyphens', () => {
      expect(composeDimensionQuickfillValue('def-1', 'opt-a-b')).toBe(
        'def-1-opt-a-b',
      );
    });
  });

  describe('extractDimensionOptionId', () => {
    it('strips the defId prefix from a composite value', () => {
      expect(
        extractDimensionOptionId('1000000023-1000000035', '1000000023'),
      ).toBe('1000000035');
    });

    it('returns the id unchanged when it does not start with defId prefix', () => {
      expect(extractDimensionOptionId('1000000035', '1000000023')).toBe(
        '1000000035',
      );
    });

    it('correctly extracts optionIds that contain hyphens', () => {
      expect(extractDimensionOptionId('def-1-opt-a-b', 'def-1')).toBe(
        'opt-a-b',
      );
    });

    it('returns empty string for an empty compositeId', () => {
      expect(extractDimensionOptionId('', '1000000023')).toBe('');
    });
  });

  describe('getDimensionDisplayOptionId', () => {
    it('returns composite defId-optionId when optionID is set', () => {
      expect(
        getDimensionDisplayOptionId(
          def({ id: 'dim-1', workerDefaultOptionId: 'default-opt' }),
          { id: 'dim-1', optionID: 'opt-1' },
        ),
      ).toBe('dim-1-opt-1');
    });

    it('returns empty string when optionID is null, even if a worker default exists', () => {
      expect(
        getDimensionDisplayOptionId(
          def({ id: 'dim-1', workerDefaultOptionId: 'default-opt' }),
          undefined,
        ),
      ).toBe('');
    });

    it('returns empty string when optionID is explicitly cleared', () => {
      expect(
        getDimensionDisplayOptionId(def({ id: 'dim-1' }), {
          id: 'dim-1',
          optionID: '',
        }),
      ).toBe('');
    });

    it('returns empty string when no value', () => {
      expect(getDimensionDisplayOptionId(def({ id: 'dim-1' }), undefined)).toBe(
        '',
      );
    });

    it('returns composite defId-optionId when the value is a plain optionId', () => {
      expect(
        getDimensionDisplayOptionId(def({ id: 'dim-1' }), {
          id: 'dim-1',
          optionID: 'opt-7',
        }),
      ).toBe('dim-1-opt-7');
    });

    it('suppresses a seed-PREFILLED worker default on edit (allowWorkerDefault=false)', () => {
      expect(
        getDimensionDisplayOptionId(
          def({ id: 'dim-1', workerDefaultOptionId: 'default-opt' }),
          {
            id: 'dim-1',
            optionID: 'default-opt',
            activeValueIsDefault: true,
            prefilledDefault: true,
          },
          false,
        ),
      ).toBe('');
    });

    it('still shows a PERSISTED value equal to the worker default on edit (not prefilled)', () => {
      // The user saved the default option; the response echoes it (no
      // `prefilledDefault` marker), so it must still render on edit.
      expect(
        getDimensionDisplayOptionId(
          def({ id: 'dim-1', workerDefaultOptionId: 'default-opt' }),
          { id: 'dim-1', optionID: 'default-opt', activeValueIsDefault: true },
          false,
        ),
      ).toBe('dim-1-default-opt');
    });

    it('still shows a persisted non-default option on edit (allowWorkerDefault=false)', () => {
      expect(
        getDimensionDisplayOptionId(
          def({ id: 'dim-1', workerDefaultOptionId: 'default-opt' }),
          { id: 'dim-1', optionID: 'opt-3' },
          false,
        ),
      ).toBe('dim-1-opt-3');
    });

    it('shows a prefilled worker default on create (allowWorkerDefault=true)', () => {
      expect(
        getDimensionDisplayOptionId(
          def({ id: 'dim-1', workerDefaultOptionId: 'default-opt' }),
          {
            id: 'dim-1',
            optionID: 'default-opt',
            activeValueIsDefault: true,
            prefilledDefault: true,
          },
          true,
        ),
      ).toBe('dim-1-default-opt');
    });

    it('shows a prefilled worker default when Clock allows prefill-on-empty (edit)', () => {
      // Clock passes isCreate || prefillWorkerDefaultsWhenEmpty as the flag, so
      // clock-out (an edit) still surfaces the prefilled worker default.
      expect(
        getDimensionDisplayOptionId(
          def({ id: 'dim-1', workerDefaultOptionId: 'default-opt' }),
          {
            id: 'dim-1',
            optionID: 'default-opt',
            activeValueIsDefault: true,
            prefilledDefault: true,
          },
          true,
        ),
      ).toBe('dim-1-default-opt');
    });
  });
});

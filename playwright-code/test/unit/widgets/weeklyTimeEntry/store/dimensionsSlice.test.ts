import dimensionsReducer, {
  resetDimensions,
  selectDimensionsState,
  setDimensions,
  setDimensionsEnabled,
  setDimensionsError,
  setDimensionsLoading,
} from 'src/js/widgets/weeklyTimeEntry/store/dimensionsSlice';

const mockDefinitions = [
  {
    id: 'dim-1',
    name: 'Department',
    active: true,
    enabledForTimeTracking: true,
    required: true,
  },
];

describe('dimensionsSlice', () => {
  it('returns initial state when slice is missing', () => {
    expect(selectDimensionsState({})).toEqual({
      dimensions: [],
      enabled: false,
      loading: false,
      error: null,
    });
  });

  it('stores dimension definitions', () => {
    const state = dimensionsReducer(undefined, setDimensions(mockDefinitions));

    expect(state.dimensions).toEqual(mockDefinitions);
    expect(state.error).toBeNull();
  });

  it('updates enabled flag', () => {
    const state = dimensionsReducer(undefined, setDimensionsEnabled(true));
    expect(state.enabled).toBe(true);
  });

  it('updates loading flag', () => {
    const state = dimensionsReducer(undefined, setDimensionsLoading(true));
    expect(state.loading).toBe(true);
  });

  it('stores error and clears loading', () => {
    const loadingState = dimensionsReducer(
      undefined,
      setDimensionsLoading(true),
    );
    const state = dimensionsReducer(
      loadingState,
      setDimensionsError('Failed to load dimensions'),
    );

    expect(state.error).toBe('Failed to load dimensions');
    expect(state.loading).toBe(false);
  });

  it('resets to initial state', () => {
    let state = dimensionsReducer(undefined, setDimensions(mockDefinitions));
    state = dimensionsReducer(state, setDimensionsEnabled(true));
    state = dimensionsReducer(state, setDimensionsLoading(true));

    state = dimensionsReducer(state, resetDimensions());

    expect(state.dimensions).toEqual([]);
    expect(state.error).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.enabled).toBe(true);
  });
});

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { DimensionDefinition } from 'src/js/widgets/common/dimensions/types';

/**
 * State interface for custom dimensions management in weekly time entry.
 *
 * Mirrors `customFieldsSlice` but for the dimensions feature. Definitions come
 * from `useGetDimensions`. Option lists are NOT stored here — the quickfills
 * widget rendered by `WeeklyDimensions` resolves its own options.
 */
export interface DimensionsState {
  /** Available custom dimension definitions. */
  dimensions: DimensionDefinition[];
  /** Whether the weekly dimensions feature is enabled for this customer. */
  enabled: boolean;
  /** Loading state for dimensions definitions. */
  loading: boolean;
  /** Error message if any operation fails. */
  error: string | null;
}

const initialState: DimensionsState = {
  dimensions: [],
  enabled: false,
  loading: false,
  error: null,
};

/** Safe read when the slice is missing (e.g. HMR before store rebuild). */
export const selectDimensionsState = (state: {
  dimensions?: DimensionsState;
}): DimensionsState => state.dimensions ?? initialState;

const dimensionsSlice = createSlice({
  name: 'dimensions',
  initialState,
  reducers: {
    /** Stores the resolved dimension definitions. */
    setDimensions: (state, action: PayloadAction<DimensionDefinition[]>) => {
      state.dimensions = action.payload;
      state.error = null;
    },

    /** Flags whether the dimensions feature is enabled for this customer. */
    setDimensionsEnabled: (state, action: PayloadAction<boolean>) => {
      state.enabled = action.payload;
    },

    /** Sets the loading state for dimensions operations. */
    setDimensionsLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    /** Sets an error message for dimensions operations. */
    setDimensionsError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },

    /**
     * Resets dimension *data* (definitions, loading, error) back to initial.
     * Leaves `enabled` intact on purpose: it tracks customer eligibility for
     * the feature, which is independent of whether definitions are currently
     * loaded — a reset clears loaded data, not the customer's entitlement.
     */
    resetDimensions: (state) => {
      state.dimensions = [];
      state.error = null;
      state.loading = false;
    },
  },
});

export const {
  setDimensions,
  setDimensionsEnabled,
  setDimensionsLoading,
  setDimensionsError,
  resetDimensions,
} = dimensionsSlice.actions;

export default dimensionsSlice.reducer;

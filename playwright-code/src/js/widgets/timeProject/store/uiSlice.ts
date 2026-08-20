import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UISliceState } from '../types';

const initialState: UISliceState = {
  loading: false,
  error: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      if (action.payload) {
        state.loading = false;
      }
    },
    resetUI() {
      return initialState;
    },
  },
});

export const { setLoading, setError, resetUI } = uiSlice.actions;

export default uiSlice.reducer;

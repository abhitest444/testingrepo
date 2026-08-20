import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PermissionsState {
  permissions: Record<string, boolean>;
  isLoading: boolean;
}

const initialState: PermissionsState = {
  permissions: {},
  isLoading: false,
};

const permissionsSlice = createSlice({
  name: 'permissions',
  initialState,
  reducers: {
    setPermissions: (state, action: PayloadAction<Record<string, boolean>>) => {
      state.permissions = action.payload;
      state.isLoading = false;
    },
    setPermissionsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    resetPermissions: () => initialState,
  },
});

export const { setPermissions, setPermissionsLoading, resetPermissions } =
  permissionsSlice.actions;

export default permissionsSlice.reducer;

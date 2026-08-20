import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { GeofenceConfigurationNode } from 'src/js/service/hooks/assignments/useGeofenceConfiguration';
import type { RootState } from './index';

interface GeofenceConfigurationState {
  nodes: GeofenceConfigurationNode[];
  loading: boolean;
  error: string | null;
  /** Optimistic toggle overrides keyed by entity ID (customer/project). */
  overrides: Record<string, boolean>;
}

const initialState: GeofenceConfigurationState = {
  nodes: [],
  loading: false,
  error: null,
  overrides: {},
};

const geofenceConfigurationSlice = createSlice({
  name: 'geofenceConfiguration',
  initialState,
  reducers: {
    setGeofenceConfigurationLoading: (
      state,
      action: PayloadAction<boolean>,
    ) => {
      state.loading = action.payload;
    },
    setGeofenceConfigurationNodes: (
      state,
      action: PayloadAction<GeofenceConfigurationNode[]>,
    ) => {
      state.nodes = action.payload;
      // Fresh API data is now authoritative — clear any stale optimistic overrides
      // for entities in this response so they don't shadow the truth.
      action.payload.forEach((node) => {
        const entityId =
          node.timeAgainstContactDAS?.project?.id ||
          node.timeAgainstContactDAS?.customer?.id;
        if (entityId) {
          delete state.overrides[entityId];
        }
      });
    },
    setGeofenceConfigurationError: (
      state,
      action: PayloadAction<string | null>,
    ) => {
      state.error = action.payload;
    },
    setGeofenceOverride: (
      state,
      action: PayloadAction<{ entityId: string; value: boolean }>,
    ) => {
      state.overrides[action.payload.entityId] = action.payload.value;
    },
    upsertGeofenceNode: (
      state,
      action: PayloadAction<GeofenceConfigurationNode>,
    ) => {
      const incoming = action.payload;
      const customerId = incoming.timeAgainstContactDAS?.customer?.id;
      const projectId = incoming.timeAgainstContactDAS?.project?.id;
      const idx = state.nodes.findIndex(
        (n) =>
          n.timeAgainstContactDAS?.customer?.id === customerId &&
          n.timeAgainstContactDAS?.project?.id === projectId,
      );
      if (idx !== -1) {
        state.nodes[idx] = incoming;
      } else {
        state.nodes.push(incoming);
      }

      const entityId = customerId ?? projectId;
      if (entityId) delete state.overrides[entityId];
    },
  },
});

export const {
  setGeofenceConfigurationLoading,
  setGeofenceConfigurationNodes,
  setGeofenceConfigurationError,
  setGeofenceOverride,
  upsertGeofenceNode,
} = geofenceConfigurationSlice.actions;

export const selectGeofenceConfigurationNodes = (state: RootState) =>
  state.geofenceConfiguration.nodes;

export const selectGeofenceConfigurationLoading = (state: RootState) =>
  state.geofenceConfiguration.loading;

export const selectGeofenceConfigurationError = (state: RootState) =>
  state.geofenceConfiguration.error;

export const selectGeofenceOverrides = (state: RootState) =>
  state.geofenceConfiguration.overrides;

export const selectGeofenceOverrideForEntityId =
  (entityId: string) => (state: RootState) =>
    state.geofenceConfiguration.overrides[entityId];

export const selectGeofenceNodeForEntity =
  (customerId: string, projectId?: string) => (state: RootState) =>
    state.geofenceConfiguration.nodes.find(
      (n) =>
        n.timeAgainstContactDAS?.customer?.id === customerId &&
        (projectId
          ? n.timeAgainstContactDAS?.project?.id === projectId
          : !n.timeAgainstContactDAS?.project?.id),
    );

export default geofenceConfigurationSlice.reducer;

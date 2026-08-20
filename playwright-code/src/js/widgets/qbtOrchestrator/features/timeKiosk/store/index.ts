/**
 * Time Kiosk store — combined reducer + public exports.
 * =============================================================================
 * Combines the small kiosk slices into a single reducer that is injected under
 * the `timeKiosk` key in the orchestrator store. This mirrors the orchestrator's
 * own shared/ui combineReducers shape while honoring the store's dynamic
 * reducer-injection mechanism.
 *
 *   state.timeKiosk = { settings, devices, ui }
 */
import { combineReducers } from '@reduxjs/toolkit';
import kioskSettingsReducer from './kioskSettingsSlice';
import kioskDevicesReducer from './kioskDevicesSlice';
import kioskUiReducer from './kioskUiSlice';

export const timeKioskReducer = combineReducers({
  settings: kioskSettingsReducer,
  devices: kioskDevicesReducer,
  ui: kioskUiReducer,
});

// Re-export actions + selectors from each slice for a single import surface.
export * from './kioskSettingsSlice';
export * from './kioskDevicesSlice';
export * from './kioskUiSlice';

export default timeKioskReducer;

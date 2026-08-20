/**
 * LocationCard - Main export
 *
 * This is the main entry point for the LocationCard component.
 * It provides a clean interface for the location settings functionality.
 * Uses Redux store for state management - location settings are fetched
 * and stored in the userSettings store.
 */

export { default } from './LocationCard';
export {
  LocationCardMode,
  LocationSettingsType,
  LocationTrackingOption,
} from './types/LocationCard.types';

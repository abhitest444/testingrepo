/**
 * BreaksCard - Main export
 *
 * This is the main entry point for the BreaksCard component.
 * It provides a clean interface for the breaks settings functionality.
 * Uses Redux store for state management - breaks are fetched and stored
 * in the userSettings store, classified as paid or unpaid based on breakType.
 */

export { default } from './BreaksCard';
export type {
  BreakDisplayItem,
  BreaksSettings,
  BreaksState,
} from './types/BreaksCard.types';
export { BREAKS_ACTIONS } from './types/BreaksCard.types';

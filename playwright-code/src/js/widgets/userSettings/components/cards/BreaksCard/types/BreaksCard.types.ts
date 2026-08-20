/**
 * Types for BreaksCard component
 */

import { BreakRule } from 'src/js/service/hooks/breaks';

export enum BreaksCardMode {
  VIEW = 'VIEW',
  EDIT = 'EDIT',
}

// Simple break display item for the card view
export interface BreakDisplayItem {
  id: string;
  name: string;
}

export interface BreaksSettings {
  paidBreakRules: BreakRule[];
  unpaidBreakRules: BreakRule[];
}

export interface BreaksState {
  mode: BreaksCardMode;
  settings: BreaksSettings;
  draftSettings: BreaksSettings;
}

// Redux-ready action types (for future implementation)
export const BREAKS_ACTIONS = {
  SET_MODE: 'breaks/setMode',
  UPDATE_SETTINGS: 'breaks/updateSettings',
  UPDATE_DRAFT: 'breaks/updateDraft',
  SAVE_SETTINGS: 'breaks/saveSettings',
  CANCEL_EDIT: 'breaks/cancelEdit',
  RESET_STATE: 'breaks/resetState',
} as const;

export type BreaksActionType =
  (typeof BREAKS_ACTIONS)[keyof typeof BREAKS_ACTIONS];

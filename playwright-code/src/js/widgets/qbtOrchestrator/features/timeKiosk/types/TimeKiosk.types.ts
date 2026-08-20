import React from 'react';

/**
 * Time Kiosk — Redux types (exoskeleton)
 * =============================================================================
 * These types describe the full kiosk feature area so slices can be built out
 * incrementally without reshaping state.
 *
 * The combined `timeKiosk` reducer is injected lazily into the qbtOrchestrator
 * store under the `timeKiosk` key and is shaped as:
 *   state.timeKiosk = { settings, devices, ui }
 */

// ============================================================================
// KioskSettingModal — presentational component types
// ============================================================================

/**
 * Discriminated union of supported input kinds. Add new kinds here as future
 * kiosk settings need them; the modal renders the matching control.
 */
export type KioskModalField =
  | {
      kind: 'number';
      value: string;
      onChange: (value: string) => void;
      /** Static label rendered next to the input (e.g. "Seconds"). */
      suffixLabel?: string;
      ariaLabel?: string;
      placeholder?: string;
      min?: number;
      max?: number;
    }
  // Checkbox kind is exercised by the location recording modal.
  | {
      kind: 'checkbox';
      checked: boolean;
      onChange: (checked: boolean) => void;
      label: string;
    };

export interface KioskSettingModalProps {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  field: KioskModalField;
  onSave: () => void;
  onClose: () => void;
  isSaving?: boolean;
  saveDisabled?: boolean;
  saveLabel: string;
  cancelLabel: string;
  errorMessage?: string;
  dataTestId?: string;
}

// ============================================================================
// Enums — modal + drawer identifiers
// ============================================================================

/**
 * Modal surfaces rendered by the generic KioskSettingModal.
 * INACTIVITY_TIMEOUT and LOCATION_RECORDING are wired today; future
 * company-level settings reuse the same generic modal via a new entry here.
 */
export enum KioskModalType {
  NONE = 'NONE',
  INACTIVITY_TIMEOUT = 'INACTIVITY_TIMEOUT',
  LOCATION_RECORDING = 'LOCATION_RECORDING',
  // TODO(kiosk): future modals reusing KioskSettingModal, e.g.
  // DELETE_DEVICE = 'DELETE_DEVICE',
}

/**
 * Drawer surfaces for the kiosk area. One slice (kioskUi) tracks which drawer
 * is open plus the device it applies to. Not wired today — scaffolded for the
 * devices/assignment tickets.
 *
 * - ASSIGN_MEMBERS: reuses the shared, self-contained common/AssignmentDrawer
 *   (assign workers/groups to a kiosk). That component owns its own form state,
 *   so no kiosk-specific assignment slice is needed — only visibility here.
 * - EDIT_DEVICE: opens the per-device settings form. Its working copy will live
 *   in kioskDevices (see KioskDevicesState TODO) following the weeklyTimeEntry
 *   timeEntrySettingsSlice "saved + working copy + panel open" pattern.
 */
export enum KioskDrawerType {
  NONE = 'NONE',
  // TODO(kiosk): enable when the devices/assignment tickets land.
  ASSIGN_MEMBERS = 'ASSIGN_MEMBERS',
  EDIT_DEVICE = 'EDIT_DEVICE',
}

// ============================================================================
// Company-level kiosk settings (apply to all kiosks)
// ============================================================================

/**
 * Company-wide kiosk settings. Inactivity timeout is the first field.
 * `version` mirrors the optimistic-locking token the GraphQL
 * employer-settings mutation returns; kept now so the dummy save has a place to
 * store it and the real wiring is a drop-in later.
 */
export interface KioskSettingsState {
  /** Seconds of inactivity before a kiosk returns to its home screen. */
  inactivityTimeoutSeconds: number;
  /** Optimistic-locking version token for the inactivity setting. */
  inactivityTimeoutVersion: string;
  loading: boolean;

  // TODO(kiosk): additional company-level settings live here, e.g.
  // bulkLocationRecordingEnabled: boolean;
  // bulkLocationRecordingVersion: string;

  // ── Draft/saved (deferred) ────────────────────────────────────────────────
  // For the single numeric inactivity field the modal keeps its own local
  // edit value, so no Redux draft is needed yet. If a multi-field company edit
  // surface is added, adopt the userSettings "settings + draftSettings" pattern:
  // draftInactivityTimeoutSeconds: number;
}

// ============================================================================
// Kiosk devices (per-device list)
// ============================================================================

/**
 * A single kiosk device. Only id/name are modeled today; the per-device
 * settings from the PRD are scaffolded as TODOs for the Manage-Devices ticket.
 */
export interface KioskDevice {
  id: string;
  name: string;
  // TODO(kiosk): per-device settings from the PRD, e.g.
  // requirePhoto: boolean;
  // deviceLanguage: string;      // 'en' | 'es' | 'fr'
  // recordLocation: boolean;
  // showWorkerList: boolean;
  // showWorkerStatus: boolean;
  // isThisDevice: boolean;       // only one device can be "This device"
}

/** Relay-style pagination cursor for the device list. */
export interface KioskDevicePageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

/**
 * Device list state. Wired minimally now (exoskeleton). The Edit-Kiosk drawer's
 * working copy will be folded in here rather than a separate slice — see TODO.
 */
export interface KioskDevicesState {
  devices: KioskDevice[];
  pageInfo: KioskDevicePageInfo | null;
  currentPage: number;
  totalCount: number;
  loading: boolean;
  error: string | null;

  // TODO(kiosk): Edit-Kiosk drawer working copy (weeklyTimeEntry
  // timeEntrySettingsSlice pattern) instead of a separate form slice:
  // editDraft: KioskDevice | null;   // seeded from the selected device on open
  // savingDevice: boolean;
  // saveDeviceError: string | null;
  // + reducers: initializeEditDevice / updateEditDeviceField / resetEditDevice
}

// ============================================================================
// UI state (modals + drawers)
// ============================================================================

/**
 * A single success toast shown after a kiosk action completes. The message is
 * supplied by the caller so every kiosk surface (inactivity timeout, location
 * recording, and future settings) can reuse the same toast with its own text.
 */
export interface KioskToastState {
  open: boolean;
  message: string;
}

/**
 * Cross-cutting kiosk UI state: which modal/drawer is open, which device the
 * open surface applies to (assignment or per-device edit), and the shared
 * success toast.
 */
export interface KioskUiState {
  activeModal: KioskModalType;
  activeDrawer: KioskDrawerType;
  /** Device targeted by the active drawer (edit/assign), null otherwise. */
  selectedDeviceId: string | null;
  /** Shared success toast, driven by any kiosk action on success. */
  toast: KioskToastState;

  // TODO(kiosk): page-level message + unsaved-changes confirmation modal
  // (assignments/breaks parity) once the devices surface exists.
}

// ============================================================================
// Combined shape + selector root
// ============================================================================

/**
 * Shape of the combined `timeKiosk` reducer (settings + devices + ui).
 * Documentation of the injected slice's runtime shape; selectors read it off the
 * orchestrator RootState (which is index-signature shaped), mirroring overtime.
 */
export interface TimeKioskState {
  settings: KioskSettingsState;
  devices: KioskDevicesState;
  ui: KioskUiState;
}

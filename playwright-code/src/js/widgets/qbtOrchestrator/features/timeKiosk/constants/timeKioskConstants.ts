/**
 * Time Kiosk — feature value constants.
 * =============================================================================
 * Single source of truth for the kiosk feature's magic values (bounds,
 * defaults, menu identifiers). Logging and tracking constants live in their own
 * files (timeKioskLoggingConstants / timeKioskTrackingPoints).
 */

/**
 * Inactivity timeout bounds and defaults (in seconds, except the version token).
 * `DEFAULT_VERSION` mirrors the default useGetQLSettings maps for the field, so
 * the slice seed and the QL mapping stay aligned.
 */
export const INACTIVITY_TIMEOUT = {
  /** Seeded value used until real data loads / when unset. */
  DEFAULT_SECONDS: 20,
  /** Optimistic-locking version default (matches useGetQLSettings). */
  DEFAULT_VERSION: '0',
  /** Smallest selectable timeout. */
  MIN_SECONDS: 1,
  /** Largest selectable timeout. */
  MAX_SECONDS: 90,
} as const;

/** MenuItem values for the kiosk settings actions dropdown. */
export const KIOSK_MENU_ITEM_VALUE = {
  INACTIVITY_TIMEOUT: 'inactivity-timeout',
  LOCATION_RECORDING: 'location-recording',
} as const;

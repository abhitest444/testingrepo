export const TOUR_FRAMEWORK_MODES = {
  MODAL: 'modal',
  TOOLTIP: 'tooltip',
} as const;

/**
 * Storage key prefixes for tour-related data
 */
export const TOUR_STORAGE_PREFIX = 'tour_completed_';
export const TOUR_SESSION_PREFIX = 'tour_session_';

/**
 * Generate storage key for a tour (persistent storage)
 * @param tourId - Unique identifier for the tour
 * @returns Storage key string
 */
export const getTourStorageKey = (tourId: string): string =>
  `${TOUR_STORAGE_PREFIX}${tourId}`;

/**
 * Generate session storage key for a tour (fallback)
 * @param tourId - Unique identifier for the tour
 * @returns Session storage key string
 */
export const getTourSessionKey = (tourId: string): string =>
  `${TOUR_SESSION_PREFIX}${tourId}`;

export const colors = [
  '#f0e6f6',
  '#e6f4ea',
  '#fff3cd',
  '#e8d4f8',
  '#fce4ec',
  '#e1f5fe',
];
export const getRandomColor = (): string =>
  colors[Math.floor(Math.random() * colors.length)];

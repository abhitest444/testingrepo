export const SINGLE_TIME_ENTRY_WIDGET_ID =
  'time-tracking-ui/singleTimeEntryTrowser';

export const TOAST_TYPES = {
  SAVE: 'save',
  DELETE: 'delete',
  SAVE_AND_COPY: 'saveAndCopy',
  FEEDBACK: 'feedback',
} as const;

export type ToastType = keyof typeof TOAST_TYPES;

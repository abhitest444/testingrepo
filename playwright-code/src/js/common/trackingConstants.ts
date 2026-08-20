/**
 * Common base constants for analytics tracking across all widgets
 * This file contains ONLY shared constants to avoid bundle bloat
 */

/**
 * Base tracking fields common across all QB Time Tracking features
 * Widgets can spread this and override specific fields as needed
 */
export const BASE_TIME_TRACKING_FIELDS = {
  org: 'sbseg',
  purpose: 'prod',
  scope: 'time',
  scope_area: 'timeentrymanagement',
  screen: 'timeentrymanagement',
  object: 'component',
  object_detail: 'component',
} as const;

/**
 * Common action types used across tracking points
 */
export const TRACKING_ACTIONS = {
  NAVIGATED: 'navigated',
  VIEWED: 'viewed',
  ENGAGED: 'engaged',
  SUBMITTED: 'submitted',
} as const;

/**
 * Common UI action types
 */
export const UI_ACTIONS = {
  CLICKED: 'clicked',
  TYPED: 'typed',
  VIEWED: 'viewed',
  SELECTED: 'selected',
  TOGGLED: 'toggled',
} as const;

/**
 * Common UI object types
 */
export const UI_OBJECTS = {
  BUTTON: 'button',
  LINK: 'link',
  FORM_FIELD: 'form_field',
  DROPDOWN: 'dropdown',
  CHECKBOX: 'checkbox',
  MODAL: 'modal',
  DRAWER: 'drawer',
  PAGE: 'page',
  LIST_ITEM: 'list_item',
} as const;

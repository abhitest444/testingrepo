import { TrackingPoint } from 'src/js/common/useClickTracking';

export interface OvertimeTrackingPoint extends TrackingPoint {}

export interface OvertimeTrackingPoints {
  [key: string]: OvertimeTrackingPoint;
}

const OVERTIME_BASE_CONFIG = {
  org: 'sbseg',
  purpose: 'prod',
  scope: 'time',
  scope_area: 'overtime',
  object: 'component',
} as const;

// ============================================================================
// SECTION 1: Manage Overtime Landing Page
// ============================================================================

export const MANAGE_OVERTIME_LANDING_TRACKING_POINTS: OvertimeTrackingPoints = {
  SETUP_OVERTIME_POLICY: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'manage_overtime_landing_page',
    object_detail: 'set_up_overtime_policy',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'set_up_overtime_policy',
  },

  LEARN_MORE_ABOUT_OVERTIME: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'manage_overtime_landing_page',
    object_detail: 'learn_more_about_overtime',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'link',
    ui_object_detail: 'learn_more_about_overtime',
  },

  CHECKOUT_OVERTIME_LAWS: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'manage_overtime_landing_page',
    object_detail: 'checkout_overtime_laws',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'link',
    ui_object_detail: 'checkout_overtime_laws',
  },

  CLOSE_LANDING_PAGE: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'manage_overtime_landing_page',
    object_detail: 'close',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'close',
  },

  CREATE_OVERTIME_POLICY: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'manage_overtime_landing_page',
    object_detail: 'create_overtime_policy',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'create_overtime_policy',
  },

  EDIT_POLICY_MANAGE_OVERTIME: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'manage_overtime_landing_page',
    object_detail: 'edit_policy_manage_overtime',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'edit_policy_manage_overtime',
  },

  EDIT_DROP_DOWN: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'manage_overtime_landing_page',
    object_detail: 'edit_drop_down',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'dropdown',
    ui_object_detail: 'edit_policy_drop_down',
  },

  CLICK_VIEW_DETAILS: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'manage_overtime_landing_page',
    object_detail: 'click_view_details',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'modal',
    ui_object_detail: 'click_view_details',
  },

  CLICK_DELETE_POLICY: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'manage_overtime_landing_page',
    object_detail: 'click_delete_policy',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'dropdown',
    ui_object_detail: 'click_delete_policy',
  },

  CONFIRM_DELETE_POLICY: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'manage_overtime_landing_page',
    object_detail: 'confirm_delete_policy',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'modal',
    ui_object_detail: 'confirm_delete_policy',
  },

  CANCEL_DELETE_POLICY: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'manage_overtime_landing_page',
    object_detail: 'cancel_delete_policy',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'modal',
    ui_object_detail: 'cancel_delete_policy',
  },
} as const;

// ============================================================================
// SECTION 1: Policy Landing Page
// ============================================================================

export const POLICY_LANDING_TRACKING_POINTS: OvertimeTrackingPoints = {
  ASSIGN_WORKERS_POLICY_PAGE: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'policy_landing_page',
    object_detail: 'assign_workers_policy_page',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'assign_workers_policy_page',
  },

  EDIT_OVERTIME_POLICY_PAGE: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'policy_landing_page',
    object_detail: 'edit_overtime_policy_page',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'edit_overtime_policy_page',
  },
} as const;

// ============================================================================
// SECTION 1: Step 1/4 — Set Overtime Policy (Name & Default)
// ============================================================================

export const SET_OVERTIME_POLICY_TRACKING_POINTS: OvertimeTrackingPoints = {
  POLICY_NAME: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'set_overtime_policy',
    object_detail: 'name',
    action: 'engaged',
    ui_action: 'typed',
    ui_object: 'form_field',
    ui_object_detail: 'name',
  },

  DEFAULT_POLICY_ON: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'set_overtime_policy',
    object_detail: 'default_policy_on',
    action: 'engaged',
    ui_action: 'enabled',
    ui_object: 'checkbox',
    ui_object_detail: 'default_policy_on',
    ui_access_point: 'page',
  },

  DEFAULT_POLICY_OFF: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'set_overtime_policy',
    object_detail: 'default_policy_off',
    action: 'engaged',
    ui_action: 'disabled',
    ui_object: 'checkbox',
    ui_object_detail: 'default_policy_off',
    ui_access_point: 'page',
  },

  OVERTIME_POLICY_NEXT: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'set_overtime_policy',
    object_detail: 'overtime_policy_next',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'overtime_policy_next',
  },

  OVERTIME_POLICY_CANCEL: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'set_overtime_policy',
    object_detail: 'overtime_policy_cancel',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'overtime_policy_cancel',
  },
} as const;

// ============================================================================
// SECTION 1: Step 2/4 — Overtime Rules (Initial Selection)
// ============================================================================

export const OVERTIME_RULES_TRACKING_POINTS: OvertimeTrackingPoints = {
  RULE_DROPDOWN_CLICK: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'overtime_rules',
    object_detail: 'rule_dropdown_click',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'dropdown',
    ui_object_detail: 'rule_dropdown_click',
  },

  OVERTIME_RULES_SELECT: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'overtime_rules',
    object_detail: 'overtime_rules_select',
    action: 'engaged',
    ui_action: 'selection',
    ui_object: 'dropdown',
    ui_object_detail: 'overtime_rules_select',
  },

  OVERTIME_RULES_NEXT: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'overtime_rules',
    object_detail: 'overtime_rules_next',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'overtime_rules_next',
  },
} as const;

// ============================================================================
// SECTION 1: Step 2/4 — Basic Rule Configuration
// ============================================================================

export const OVERTIME_RULES_BASIC_TRACKING_POINTS: OvertimeTrackingPoints = {
  BASIC_WEEKLY_HOURS: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'overtime_rules_basic',
    object_detail: 'basic_weekly_hours',
    action: 'engaged',
    ui_action: 'typed',
    ui_object: 'form_field',
    ui_object_detail: 'basic_weekly_hours',
  },

  BASIC_DAILY_ON: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'overtime_rules_basic',
    object_detail: 'basic_daily_on',
    action: 'engaged',
    ui_action: 'enabled',
    ui_object: 'checkbox',
    ui_object_detail: 'basic_daily_on',
  },

  BASIC_DAILY_OFF: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'overtime_rules_basic',
    object_detail: 'basic_daily_off',
    action: 'engaged',
    ui_action: 'disabled',
    ui_object: 'checkbox',
    ui_object_detail: 'basic_daily_off',
  },

  BASIC_DAILY_SELECT_DAYS_CLICK: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'overtime_rules_basic',
    object_detail: 'basic_daily_select_days_click',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'dropdown',
    ui_object_detail: 'basic_daily_select_days_click',
  },

  BASIC_DAILY_SELECT_DAYS: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'overtime_rules_basic',
    object_detail: 'basic_daily_select_days',
    action: 'engaged',
    ui_action: 'selection',
    ui_object: 'dropdown',
    ui_object_detail: 'basic_daily_select_days',
  },

  BASIC_DAILY_HOURS: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'overtime_rules_basic',
    object_detail: 'basic_daily_hours',
    action: 'engaged',
    ui_action: 'typed',
    ui_object: 'form_field',
    ui_object_detail: 'basic_daily_hours',
  },

  BASIC_DOUBLE_DAILY_ON: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'overtime_rules_basic',
    object_detail: 'basic_double_daily_on',
    action: 'engaged',
    ui_action: 'enabled',
    ui_object: 'checkbox',
    ui_object_detail: 'basic_double_daily_on',
  },

  BASIC_DOUBLE_DAILY_OFF: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'overtime_rules_basic',
    object_detail: 'basic_double_daily_off',
    action: 'engaged',
    ui_action: 'disabled',
    ui_object: 'checkbox',
    ui_object_detail: 'basic_double_daily_off',
  },

  BASIC_DOUBLE_DAILY_SELECT_DAYS_CLICK: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'overtime_rules_basic',
    object_detail: 'basic_double_daily_select_days_click',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'dropdown',
    ui_object_detail: 'basic_double_daily_select_days_click',
  },

  BASIC_DOUBLE_DAILY_SELECT_DAYS: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'overtime_rules_basic',
    object_detail: 'basic_double_daily_select_days',
    action: 'engaged',
    ui_action: 'selection',
    ui_object: 'dropdown',
    ui_object_detail: 'basic_double_daily_select_days',
  },

  BASIC_DOUBLE_DAILY_HOURS: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'overtime_rules_basic',
    object_detail: 'basic_double_daily_hours',
    action: 'engaged',
    ui_action: 'typed',
    ui_object: 'form_field',
    ui_object_detail: 'basic_double_daily_hours',
  },

  OVERTIME_RULES_BASIC_NEXT: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'overtime_rules_basic',
    object_detail: 'overtime_rules_basic_next',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'overtime_rules_basic_next',
  },

  OVERTIME_RULES_BASIC_BACK: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'overtime_rules_basic',
    object_detail: 'overtime_rules_basic_back',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'overtime_rules_basic_back',
  },
} as const;

// ============================================================================
// SECTION 1: Step 2/4 — California Rule Navigation
// ============================================================================

export const OVERTIME_RULES_CALIFORNIA_TRACKING_POINTS: OvertimeTrackingPoints =
  {
    OVERTIME_RULES_CALIFORNIA_NEXT: {
      ...OVERTIME_BASE_CONFIG,
      screen: 'overtime_rules_california',
      object_detail: 'overtime_rules_california_next',
      action: 'engaged',
      ui_action: 'clicked',
      ui_object: 'button',
      ui_object_detail: 'overtime_rules_california_next',
    },

    OVERTIME_RULES_CALIFORNIA_BACK: {
      ...OVERTIME_BASE_CONFIG,
      screen: 'overtime_rules_california',
      object_detail: 'overtime_rules_california_back',
      action: 'engaged',
      ui_action: 'clicked',
      ui_object: 'button',
      ui_object_detail: 'overtime_rules_california_back',
    },
  } as const;

// ============================================================================
// SECTION 1: Step 2/4 — Custom Rule Configuration
// ============================================================================

export const OVERTIME_RULES_CUSTOM_TRACKING_POINTS: OvertimeTrackingPoints = {
  OVERTIME_RULES_CUSTOM_NEXT: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'overtime_rules_custom',
    object_detail: 'overtime_rules_custom_next',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'overtime_rules_custom_next',
  },

  OVERTIME_RULES_CUSTOM_BACK: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'overtime_rules_custom',
    object_detail: 'overtime_rules_custom_back',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'overtime_rules_custom_back',
  },

  CUSTOM_WEEKLY_HOURS: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'overtime_rules_custom',
    object_detail: 'custom_weekly_hours',
    action: 'engaged',
    ui_action: 'typed',
    ui_object: 'form_field',
    ui_object_detail: 'custom_weekly_hours',
  },

  CUSTOM_DAILY_ON: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'overtime_rules_custom',
    object_detail: 'custom_daily_on',
    action: 'engaged',
    ui_action: 'enabled',
    ui_object: 'checkbox',
    ui_object_detail: 'custom_daily_on',
  },

  CUSTOM_DAILY_OFF: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'overtime_rules_custom',
    object_detail: 'custom_daily_off',
    action: 'engaged',
    ui_action: 'disabled',
    ui_object: 'checkbox',
    ui_object_detail: 'custom_daily_off',
  },

  CUSTOM_DAILY_SELECT_DAYS_CLICK: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'overtime_rules_custom',
    object_detail: 'custom_daily_select_days_click',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'dropdown',
    ui_object_detail: 'custom_daily_select_days_click',
  },

  CUSTOM_DAILY_SELECT_DAYS: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'overtime_rules_custom',
    object_detail: 'custom_daily_select_days',
    action: 'engaged',
    ui_action: 'selection',
    ui_object: 'dropdown',
    ui_object_detail: 'custom_daily_select_days',
  },

  CUSTOM_DAILY_HOURS: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'overtime_rules_custom',
    object_detail: 'custom_daily_hours',
    action: 'engaged',
    ui_action: 'typed',
    ui_object: 'form_field',
    ui_object_detail: 'custom_daily_hours',
  },

  CUSTOM_DOUBLE_DAILY_ON: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'overtime_rules_custom',
    object_detail: 'custom_double_daily_on',
    action: 'engaged',
    ui_action: 'enabled',
    ui_object: 'checkbox',
    ui_object_detail: 'custom_double_daily_on',
  },

  CUSTOM_DOUBLE_DAILY_OFF: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'overtime_rules_custom',
    object_detail: 'custom_double_daily_off',
    action: 'engaged',
    ui_action: 'disabled',
    ui_object: 'checkbox',
    ui_object_detail: 'custom_double_daily_off',
  },

  CUSTOM_DOUBLE_DAILY_SELECT_DAYS_CLICK: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'overtime_rules_custom',
    object_detail: 'custom_double_daily_select_days_click',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'dropdown',
    ui_object_detail: 'custom_double_daily_select_days_click',
  },

  CUSTOM_DOUBLE_DAILY_SELECT_DAYS: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'overtime_rules_custom',
    object_detail: 'custom_double_daily_select_days',
    action: 'engaged',
    ui_action: 'selection',
    ui_object: 'dropdown',
    ui_object_detail: 'custom_double_daily_select_days',
  },

  CUSTOM_DOUBLE_DAILY_HOURS: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'overtime_rules_custom',
    object_detail: 'custom_double_daily_hours',
    action: 'engaged',
    ui_action: 'typed',
    ui_object: 'form_field',
    ui_object_detail: 'custom_double_daily_hours',
  },

  CUSTOM_CONSECUTIVE_ON: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'overtime_rules_custom',
    object_detail: 'custom_consecutive_on',
    action: 'engaged',
    ui_action: 'enabled',
    ui_object: 'checkbox',
    ui_object_detail: 'custom_consecutive_on',
  },

  CUSTOM_CONSECUTIVE_OFF: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'overtime_rules_custom',
    object_detail: 'custom_consecutive_off',
    action: 'engaged',
    ui_action: 'disabled',
    ui_object: 'checkbox',
    ui_object_detail: 'custom_consecutive_off',
  },

  CUSTOM_CONSECUTIVE_HOURS: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'overtime_rules_custom',
    object_detail: 'custom_consecutive_hours',
    action: 'engaged',
    ui_action: 'typed',
    ui_object: 'form_field',
    ui_object_detail: 'custom_consecutive_hours',
  },

  CUSTOM_DOUBLE_CONSECUTIVE_ON: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'overtime_rules_custom',
    object_detail: 'custom_double_consecutive_on',
    action: 'engaged',
    ui_action: 'enabled',
    ui_object: 'checkbox',
    ui_object_detail: 'custom_double_consecutive_on',
  },

  CUSTOM_DOUBLE_CONSECUTIVE_OFF: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'overtime_rules_custom',
    object_detail: 'custom_double_consecutive_off',
    action: 'engaged',
    ui_action: 'disabled',
    ui_object: 'checkbox',
    ui_object_detail: 'custom_double_consecutive_off',
  },

  CUSTOM_DOUBLE_CONSECUTIVE_HOURS: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'overtime_rules_custom',
    object_detail: 'custom_double_consecutive_hours',
    action: 'engaged',
    ui_action: 'typed',
    ui_object: 'form_field',
    ui_object_detail: 'custom_double_consecutive_hours',
  },
} as const;

// ============================================================================
// SECTION 1: Step 3/4 — Policy Members
// ============================================================================

export const POLICY_MEMBERS_TRACKING_POINTS: OvertimeTrackingPoints = {
  ALL_WORKER_ON: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'policy_members',
    object_detail: 'all_worker_on',
    action: 'engaged',
    ui_action: 'enabled',
    ui_object: 'checkbox',
    ui_object_detail: 'all_worker_on',
  },

  ALL_WORKER_OFF: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'policy_members',
    object_detail: 'all_worker_off',
    action: 'engaged',
    ui_action: 'disabled',
    ui_object: 'checkbox',
    ui_object_detail: 'all_worker_off',
  },

  FILTER_GROUP: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'policy_members',
    object_detail: 'filter_group',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'dropdown',
    ui_object_detail: 'filter_group',
  },

  SELECT_GROUP: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'policy_members',
    object_detail: 'select_group',
    action: 'engaged',
    ui_action: 'selection',
    ui_object: 'dropdown',
    ui_object_detail: 'select_group',
  },

  POLICY_MEMBERS_SEARCH: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'policy_members',
    object_detail: 'policy_members_search',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'search',
    ui_object_detail: 'policy_members_search',
  },

  POLICY_MEMBERS_ASSIGN: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'policy_members',
    object_detail: 'policy_members_assign',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'policy_members_assign',
  },

  POLICY_MEMBERS_BACK: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'policy_members',
    object_detail: 'policy_members_back',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'policy_members_back',
  },
} as const;

// ============================================================================
// SECTION 1: Step 4/4 — Review Overtime Policy
// ============================================================================

export const REVIEW_OVERTIME_POLICY_TRACKING_POINTS: OvertimeTrackingPoints = {
  EDIT_POLICY_DETAILS: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'review_overtime_policy',
    object_detail: 'edit_policy_details',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'edit_policy_details',
  },

  EDIT_OVERTIME_RULES: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'review_overtime_policy',
    object_detail: 'edit_overtime_rules',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'edit_overtime_rules',
  },

  EDIT_POLICY_MEMBERS: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'review_overtime_policy',
    object_detail: 'edit_policy_members',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'edit_policy_members',
  },

  CREATE_POLICY: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'review_overtime_policy',
    object_detail: 'create_policy',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'create_policy',
  },

  BACK_REVIEW_POLICY: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'review_overtime_policy',
    object_detail: 'back_review_policy',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'back_review_policy',
  },
} as const;

// ============================================================================
// SECTION 1/2: Wizard Global Navigation
// ============================================================================

export const WIZARD_GLOBAL_NAV_TRACKING_POINTS: OvertimeTrackingPoints = {
  CLICK_OVERTIME_POLICIES: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'NA',
    object_detail: 'click_overtime_policies',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'click_overtime_policies',
  },

  CLICK_CLOSE: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'NA',
    object_detail: 'click_close',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'click_close',
  },
} as const;

// ============================================================================
// SECTION 2: Edit Policy Flow
// ============================================================================

export const EDIT_OVERTIME_POLICY_TRACKING_POINTS: OvertimeTrackingPoints = {
  EDIT_POLICY_DETAILS: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'edit_overtime_policy',
    object_detail: 'edit_policy_details',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'edit',
    ui_object_detail: 'edit_policy_details',
  },

  EDIT_OVERTIME_RULES: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'edit_overtime_policy',
    object_detail: 'edit_overtime_rules',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'edit',
    ui_object_detail: 'edit_overtime_rules',
  },

  EDIT_POLICY_MEMBERS: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'edit_overtime_policy',
    object_detail: 'edit_policy_members',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'edit',
    ui_object_detail: 'edit_policy_members',
  },

  UPDATE_POLICY_NAME: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'set_up_overtime_policy',
    object_detail: 'update_policy_name',
    action: 'engaged',
    ui_action: 'typed',
    ui_object: 'form_field',
    ui_object_detail: 'update_policy_name',
  },

  SAVE_POLICY_NAME: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'set_up_overtime_policy',
    object_detail: 'save',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'save',
  },

  CANCEL_EDIT: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'set_up_overtime_policy',
    object_detail: 'cancel',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'cancel',
    ui_access_point: 'page',
  },

  DEFAULT_ON: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'set_up_overtime_policy',
    object_detail: 'default_on',
    action: 'engaged',
    ui_action: 'enabled',
    ui_object: 'checkbox',
    ui_object_detail: 'default_on',
    ui_access_point: 'page',
  },

  DEFAULT_OFF: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'set_up_overtime_policy',
    object_detail: 'default_off',
    action: 'engaged',
    ui_action: 'disabled',
    ui_object: 'checkbox',
    ui_object_detail: 'default_off',
    ui_access_point: 'page',
  },

  CLOSE_EDIT_POLICY: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'edit_overtime_policy',
    object_detail: 'close',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'close',
    ui_access_point: 'page',
  },

  BACK_EDIT_POLICY: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'edit_overtime_policy',
    object_detail: 'back',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'back',
    ui_access_point: 'page',
  },

  BASIC_RULES_SAVE: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'overtime_rules_basic_edit',
    object_detail: 'save',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'save',
    ui_access_point: 'page',
  },

  BASIC_RULES_BACK: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'overtime_rules_basic_edit',
    object_detail: 'back',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'back',
    ui_access_point: 'page',
  },

  CALIFORNIA_RULES_SAVE: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'overtime_rules_california',
    object_detail: 'save',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'save',
    ui_access_point: 'page',
  },

  CALIFORNIA_RULES_BACK: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'overtime_rules_california',
    object_detail: 'back',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'back',
    ui_access_point: 'page',
  },

  CUSTOM_RULES_SAVE: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'overtime_rules_custom',
    object_detail: 'save',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'save',
    ui_access_point: 'page',
  },

  CUSTOM_RULES_BACK: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'overtime_rules_custom',
    object_detail: 'back',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'back',
    ui_access_point: 'page',
  },

  EDIT_POLICY_MEMBERS_SAVE: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'edit_policy_members',
    object_detail: 'save',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'save',
    ui_access_point: 'page',
  },

  EDIT_POLICY_MEMBERS_BACK: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'edit_policy_members',
    object_detail: 'back',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'back',
    ui_access_point: 'page',
  },

  CLOSE_EDIT_REVIEW_PAGE: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'edit_review_overtime_policy',
    object_detail: 'close',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'close',
    ui_access_point: 'page',
  },
} as const;

// ============================================================================
// SECTION 3: Reassign Worker Banner
// ============================================================================

export const REASSIGN_WORKER_TRACKING_POINTS: OvertimeTrackingPoints = {
  REASSIGN_WORKER_CANCEL: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'policy_members',
    object_detail: 'cancel',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'cancel',
    ui_access_point: 'page',
  },

  REASSIGN_WORKER_SAVE: {
    ...OVERTIME_BASE_CONFIG,
    screen: 'policy_members',
    object_detail: 'save',
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'save',
    ui_access_point: 'page',
  },
} as const;

// ============================================================================
// SECTION 4: Account Settings — Overtime Notifications (Company Level)
// ============================================================================

const OVERTIME_NOTIFICATION_BASE = {
  org: 'sbseg',
  purpose: 'prod',
  scope: 'time',
  scope_area: 'overtime_notification',
} as const;

export const OVERTIME_NOTIFICATION_TRACKING_POINTS: OvertimeTrackingPoints = {
  // ── Overtime section on click of edit ──
  OVERTIME_SECTION_EDIT: {
    ...OVERTIME_NOTIFICATION_BASE,
    screen: 'account_setting_time',
    action: 'engaged',
    object: 'widget',
    object_detail: 'overtime_section_edit',
    ui_action: 'clicked',
    ui_object: 'link',
    ui_object_detail: 'overtime_section_edit',
    ui_access_point: 'page',
  },

  // ── View details click ──
  VIEW_DETAILS_CLICK: {
    ...OVERTIME_NOTIFICATION_BASE,
    screen: 'account_setting_time',
    action: 'engaged',
    object: 'banner',
    object_detail: 'view_details_click',
    ui_action: 'clicked',
    ui_object: 'link',
    ui_object_detail: 'view_details_click',
    ui_access_point: 'page',
  },

  // ── Daily null state enable ──
  DAILY_ON: {
    ...OVERTIME_NOTIFICATION_BASE,
    screen: 'overtime_notifications',
    action: 'engaged',
    object: 'component',
    object_detail: 'daily_on',
    ui_action: 'enabled',
    ui_object: 'checkbox',
    ui_object_detail: 'daily_on',
  },

  // ── Daily hours exceed threshold ──
  DAILY_HOURS_EXCEED: {
    ...OVERTIME_NOTIFICATION_BASE,
    screen: 'overtime_notifications',
    action: 'engaged',
    object: 'component',
    object_detail: 'daily_hours_exceed',
    ui_action: 'typed',
    ui_object: 'form_field',
    ui_object_detail: 'daily_hours_exceed',
  },

  // ── Daily minutes exceed ──
  DAILY_MINUTES_EXCEED: {
    ...OVERTIME_NOTIFICATION_BASE,
    screen: 'overtime_notifications',
    action: 'engaged',
    object: 'component',
    object_detail: 'daily_minutes_exceed',
    ui_action: 'typed',
    ui_object: 'form_field',
    ui_object_detail: 'daily_minutes_exceed',
  },

  // ── Daily total alerts ──
  DAILY_TOTAL_ALERTS: {
    ...OVERTIME_NOTIFICATION_BASE,
    screen: 'overtime_notifications',
    action: 'engaged',
    object: 'component',
    object_detail: 'daily_total_alerts',
    ui_action: 'typed',
    ui_object: 'form_field',
    ui_object_detail: 'daily_total_alerts',
  },

  // ── Daily alert frequency ──
  DAILY_TIME_FREQUENCY: {
    ...OVERTIME_NOTIFICATION_BASE,
    screen: 'overtime_notifications',
    action: 'engaged',
    object: 'component',
    object_detail: 'daily_time_frequency',
    ui_action: 'typed',
    ui_object: 'form_field',
    ui_object_detail: 'daily_time_frequency',
  },

  // ── Daily admin notification email enabled/disabled ──
  DAILY_NOTIFICATION_ADMIN_EMAIL_ON: {
    ...OVERTIME_NOTIFICATION_BASE,
    screen: 'overtime_notifications',
    action: 'engaged',
    object: 'widget',
    object_detail: 'daily_notification_admin_email_on',
    ui_action: 'enabled',
    ui_object: 'checkbox',
    ui_object_detail: 'daily_notification_admin_email_on',
    ui_access_point: 'page',
  },
  DAILY_NOTIFICATION_ADMIN_EMAIL_OFF: {
    ...OVERTIME_NOTIFICATION_BASE,
    screen: 'overtime_notifications',
    action: 'engaged',
    object: 'widget',
    object_detail: 'daily_notification_admin_email_off',
    ui_action: 'disabled',
    ui_object: 'checkbox',
    ui_object_detail: 'daily_notification_admin_email_off',
    ui_access_point: 'page',
  },

  // ── Daily admin notification mobile enabled/disabled ──
  DAILY_NOTIFICATION_ADMIN_MOBILE_ON: {
    ...OVERTIME_NOTIFICATION_BASE,
    screen: 'overtime_notifications',
    action: 'engaged',
    object: 'widget',
    object_detail: 'daily_notification_admin_mobile_on',
    ui_action: 'enabled',
    ui_object: 'checkbox',
    ui_object_detail: 'daily_notification_admin_mobile_on',
    ui_access_point: 'page',
  },
  DAILY_NOTIFICATION_ADMIN_MOBILE_OFF: {
    ...OVERTIME_NOTIFICATION_BASE,
    screen: 'overtime_notifications',
    action: 'engaged',
    object: 'widget',
    object_detail: 'daily_notification_admin_mobile_off',
    ui_action: 'disabled',
    ui_object: 'checkbox',
    ui_object_detail: 'daily_notification_admin_mobile_off',
    ui_access_point: 'page',
  },

  // ── Daily group leads notification email/mobile enabled/disabled ──
  DAILY_NOTIFICATION_GROUP_LEADS_EMAIL_ON: {
    ...OVERTIME_NOTIFICATION_BASE,
    screen: 'overtime_notifications',
    action: 'engaged',
    object: 'widget',
    object_detail: 'daily_notification_group_leads_email_on',
    ui_action: 'enabled',
    ui_object: 'checkbox',
    ui_object_detail: 'daily_notification_group_leads_email_on',
    ui_access_point: 'page',
  },
  DAILY_NOTIFICATION_GROUP_LEADS_EMAIL_OFF: {
    ...OVERTIME_NOTIFICATION_BASE,
    screen: 'overtime_notifications',
    action: 'engaged',
    object: 'widget',
    object_detail: 'daily_notification_group_leads_email_off',
    ui_action: 'disabled',
    ui_object: 'checkbox',
    ui_object_detail: 'daily_notification_group_leads_email_off',
    ui_access_point: 'page',
  },
  DAILY_NOTIFICATION_GROUP_LEADS_MOBILE_ON: {
    ...OVERTIME_NOTIFICATION_BASE,
    screen: 'overtime_notifications',
    action: 'engaged',
    object: 'widget',
    object_detail: 'daily_notification_group_leads_mobile_on',
    ui_action: 'enabled',
    ui_object: 'checkbox',
    ui_object_detail: 'daily_notification_group_leads_mobile_on',
    ui_access_point: 'page',
  },
  DAILY_NOTIFICATION_GROUP_LEADS_MOBILE_OFF: {
    ...OVERTIME_NOTIFICATION_BASE,
    screen: 'overtime_notifications',
    action: 'engaged',
    object: 'widget',
    object_detail: 'daily_notification_group_leads_mobile_off',
    ui_action: 'disabled',
    ui_object: 'checkbox',
    ui_object_detail: 'daily_notification_group_leads_mobile_off',
    ui_access_point: 'page',
  },

  // ── Daily employees notification email/mobile enabled/disabled ──
  DAILY_NOTIFICATION_EMPLOYEES_EMAIL_ON: {
    ...OVERTIME_NOTIFICATION_BASE,
    screen: 'overtime_notifications',
    action: 'engaged',
    object: 'widget',
    object_detail: 'daily_notification_employees_email_on',
    ui_action: 'enabled',
    ui_object: 'checkbox',
    ui_object_detail: 'daily_notification_employees_email_on',
    ui_access_point: 'page',
  },
  DAILY_NOTIFICATION_EMPLOYEES_EMAIL_OFF: {
    ...OVERTIME_NOTIFICATION_BASE,
    screen: 'overtime_notifications',
    action: 'engaged',
    object: 'widget',
    object_detail: 'daily_notification_employees_email_off',
    ui_action: 'disabled',
    ui_object: 'checkbox',
    ui_object_detail: 'daily_notification_employees_email_off',
    ui_access_point: 'page',
  },
  DAILY_NOTIFICATION_EMPLOYEES_MOBILE_ON: {
    ...OVERTIME_NOTIFICATION_BASE,
    screen: 'overtime_notifications',
    action: 'engaged',
    object: 'widget',
    object_detail: 'daily_notification_employees_mobile_on',
    ui_action: 'enabled',
    ui_object: 'checkbox',
    ui_object_detail: 'daily_notification_employees_mobile_on',
    ui_access_point: 'page',
  },
  DAILY_NOTIFICATION_EMPLOYEES_MOBILE_OFF: {
    ...OVERTIME_NOTIFICATION_BASE,
    screen: 'overtime_notifications',
    action: 'engaged',
    object: 'widget',
    object_detail: 'daily_notification_employees_mobile_off',
    ui_action: 'disabled',
    ui_object: 'checkbox',
    ui_object_detail: 'daily_notification_employees_mobile_off',
    ui_access_point: 'page',
  },

  // ── Daily off / save / cancel ──
  DAILY_OFF: {
    ...OVERTIME_NOTIFICATION_BASE,
    screen: 'overtime_notifications',
    action: 'engaged',
    object: 'component',
    object_detail: 'daily_off',
    ui_action: 'disabled',
    ui_object: 'checkbox',
    ui_object_detail: 'daily_off',
  },
  SAVE: {
    ...OVERTIME_NOTIFICATION_BASE,
    screen: 'overtime_notifications',
    action: 'engaged',
    object: 'widget',
    object_detail: 'save',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'save',
    ui_access_point: 'page',
  },
  CANCEL: {
    ...OVERTIME_NOTIFICATION_BASE,
    screen: 'overtime_notifications',
    action: 'engaged',
    object: 'widget',
    object_detail: 'cancel',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'cancel',
    ui_access_point: 'page',
  },

  // ── Weekly null state enable ──
  WEEKLY_ON: {
    ...OVERTIME_NOTIFICATION_BASE,
    screen: 'overtime_notifications',
    action: 'engaged',
    object: 'component',
    object_detail: 'weekly_on',
    ui_action: 'enabled',
    ui_object: 'checkbox',
    ui_object_detail: 'weekly_on',
  },

  // ── Weekly hours/minutes/total alerts/frequency ──
  WEEKLY_HOURS_EXCEED: {
    ...OVERTIME_NOTIFICATION_BASE,
    screen: 'overtime_notifications',
    action: 'engaged',
    object: 'component',
    object_detail: 'weekly_hours_exceed',
    ui_action: 'typed',
    ui_object: 'form_field',
    ui_object_detail: 'weekly_hours_exceed',
  },
  WEEKLY_MINUTES_EXCEED: {
    ...OVERTIME_NOTIFICATION_BASE,
    screen: 'overtime_notifications',
    action: 'engaged',
    object: 'component',
    object_detail: 'weekly_minutes_exceed',
    ui_action: 'typed',
    ui_object: 'form_field',
    ui_object_detail: 'weekly_minutes_exceed',
  },
  WEEKLY_TOTAL_ALERTS: {
    ...OVERTIME_NOTIFICATION_BASE,
    screen: 'overtime_notifications',
    action: 'engaged',
    object: 'component',
    object_detail: 'weekly_total_alerts',
    ui_action: 'typed',
    ui_object: 'form_field',
    ui_object_detail: 'weekly_total_alerts',
  },
  WEEKLY_TIME_FREQUENCY: {
    ...OVERTIME_NOTIFICATION_BASE,
    screen: 'overtime_notifications',
    action: 'engaged',
    object: 'component',
    object_detail: 'weekly_time_frequency',
    ui_action: 'typed',
    ui_object: 'form_field',
    ui_object_detail: 'weekly_time_frequency',
  },

  // ── Weekly admin notification email/mobile enabled/disabled ──
  WEEKLY_NOTIFICATION_ADMIN_EMAIL_ON: {
    ...OVERTIME_NOTIFICATION_BASE,
    screen: 'overtime_notifications',
    action: 'engaged',
    object: 'widget',
    object_detail: 'weekly_notification_admin_email_on',
    ui_action: 'enabled',
    ui_object: 'checkbox',
    ui_object_detail: 'weekly_notification_admin_email_on',
    ui_access_point: 'page',
  },
  WEEKLY_NOTIFICATION_ADMIN_EMAIL_OFF: {
    ...OVERTIME_NOTIFICATION_BASE,
    screen: 'overtime_notifications',
    action: 'engaged',
    object: 'widget',
    object_detail: 'weekly_notification_admin_email_off',
    ui_action: 'disabled',
    ui_object: 'checkbox',
    ui_object_detail: 'weekly_notification_admin_email_off',
    ui_access_point: 'page',
  },
  WEEKLY_NOTIFICATION_ADMIN_MOBILE_ON: {
    ...OVERTIME_NOTIFICATION_BASE,
    screen: 'overtime_notifications',
    action: 'engaged',
    object: 'widget',
    object_detail: 'weekly_notification_admin_mobile_on',
    ui_action: 'enabled',
    ui_object: 'checkbox',
    ui_object_detail: 'weekly_notification_admin_mobile_on',
    ui_access_point: 'page',
  },
  WEEKLY_NOTIFICATION_ADMIN_MOBILE_OFF: {
    ...OVERTIME_NOTIFICATION_BASE,
    screen: 'overtime_notifications',
    action: 'engaged',
    object: 'widget',
    object_detail: 'weekly_notification_admin_mobile_off',
    ui_action: 'disabled',
    ui_object: 'checkbox',
    ui_object_detail: 'weekly_notification_admin_mobile_off',
    ui_access_point: 'page',
  },

  // ── Weekly group leads notification email/mobile enabled/disabled ──
  WEEKLY_NOTIFICATION_GROUP_LEADS_EMAIL_ON: {
    ...OVERTIME_NOTIFICATION_BASE,
    screen: 'overtime_notifications',
    action: 'engaged',
    object: 'widget',
    object_detail: 'weekly_notification_group_leads_email_on',
    ui_action: 'enabled',
    ui_object: 'checkbox',
    ui_object_detail: 'weekly_notification_group_leads_email_on',
    ui_access_point: 'page',
  },
  WEEKLY_NOTIFICATION_GROUP_LEADS_EMAIL_OFF: {
    ...OVERTIME_NOTIFICATION_BASE,
    screen: 'overtime_notifications',
    action: 'engaged',
    object: 'widget',
    object_detail: 'weekly_notification_group_leads_email_off',
    ui_action: 'disabled',
    ui_object: 'checkbox',
    ui_object_detail: 'weekly_notification_group_leads_email_off',
    ui_access_point: 'page',
  },
  WEEKLY_NOTIFICATION_GROUP_LEADS_MOBILE_ON: {
    ...OVERTIME_NOTIFICATION_BASE,
    screen: 'overtime_notifications',
    action: 'engaged',
    object: 'widget',
    object_detail: 'weekly_notification_group_leads_mobile_on',
    ui_action: 'enabled',
    ui_object: 'checkbox',
    ui_object_detail: 'weekly_notification_group_leads_mobile_on',
    ui_access_point: 'page',
  },
  WEEKLY_NOTIFICATION_GROUP_LEADS_MOBILE_OFF: {
    ...OVERTIME_NOTIFICATION_BASE,
    screen: 'overtime_notifications',
    action: 'engaged',
    object: 'widget',
    object_detail: 'weekly_notification_group_leads_mobile_off',
    ui_action: 'disabled',
    ui_object: 'checkbox',
    ui_object_detail: 'weekly_notification_group_leads_mobile_off',
    ui_access_point: 'page',
  },

  // ── Weekly employees notification email/mobile enabled/disabled ──
  WEEKLY_NOTIFICATION_EMPLOYEES_EMAIL_ON: {
    ...OVERTIME_NOTIFICATION_BASE,
    screen: 'overtime_notifications',
    action: 'engaged',
    object: 'widget',
    object_detail: 'weekly_notification_employees_email_on',
    ui_action: 'enabled',
    ui_object: 'checkbox',
    ui_object_detail: 'weekly_notification_employees_email_on',
    ui_access_point: 'page',
  },
  WEEKLY_NOTIFICATION_EMPLOYEES_EMAIL_OFF: {
    ...OVERTIME_NOTIFICATION_BASE,
    screen: 'overtime_notifications',
    action: 'engaged',
    object: 'widget',
    object_detail: 'weekly_notification_employees_email_off',
    ui_action: 'disabled',
    ui_object: 'checkbox',
    ui_object_detail: 'weekly_notification_employees_email_off',
    ui_access_point: 'page',
  },
  WEEKLY_NOTIFICATION_EMPLOYEES_MOBILE_ON: {
    ...OVERTIME_NOTIFICATION_BASE,
    screen: 'overtime_notifications',
    action: 'engaged',
    object: 'widget',
    object_detail: 'weekly_notification_employees_mobile_on',
    ui_action: 'enabled',
    ui_object: 'checkbox',
    ui_object_detail: 'weekly_notification_employees_mobile_on',
    ui_access_point: 'page',
  },
  WEEKLY_NOTIFICATION_EMPLOYEES_MOBILE_OFF: {
    ...OVERTIME_NOTIFICATION_BASE,
    screen: 'overtime_notifications',
    action: 'engaged',
    object: 'widget',
    object_detail: 'weekly_notification_employees_mobile_off',
    ui_action: 'disabled',
    ui_object: 'checkbox',
    ui_object_detail: 'weekly_notification_employees_mobile_off',
    ui_access_point: 'page',
  },

  // ── Weekly off ──
  WEEKLY_OFF: {
    ...OVERTIME_NOTIFICATION_BASE,
    screen: 'overtime_notifications',
    action: 'engaged',
    object: 'component',
    object_detail: 'weekly_off',
    ui_action: 'disabled',
    ui_object: 'checkbox',
    ui_object_detail: 'weekly_off',
  },
} as const;

export const OVERTIME_NOTIFICATION_DAILY_FIELD_TRACKING_POINTS = {
  hours: OVERTIME_NOTIFICATION_TRACKING_POINTS.DAILY_HOURS_EXCEED,
  minutes: OVERTIME_NOTIFICATION_TRACKING_POINTS.DAILY_MINUTES_EXCEED,
  totalAlerts: OVERTIME_NOTIFICATION_TRACKING_POINTS.DAILY_TOTAL_ALERTS,
  frequency: OVERTIME_NOTIFICATION_TRACKING_POINTS.DAILY_TIME_FREQUENCY,
} as const;

export const OVERTIME_NOTIFICATION_DAILY_RECIPIENT_TRACKING_POINTS = {
  admin: {
    emailOn:
      OVERTIME_NOTIFICATION_TRACKING_POINTS.DAILY_NOTIFICATION_ADMIN_EMAIL_ON,
    emailOff:
      OVERTIME_NOTIFICATION_TRACKING_POINTS.DAILY_NOTIFICATION_ADMIN_EMAIL_OFF,
    mobileOn:
      OVERTIME_NOTIFICATION_TRACKING_POINTS.DAILY_NOTIFICATION_ADMIN_MOBILE_ON,
    mobileOff:
      OVERTIME_NOTIFICATION_TRACKING_POINTS.DAILY_NOTIFICATION_ADMIN_MOBILE_OFF,
  },
  groupManager: {
    emailOn:
      OVERTIME_NOTIFICATION_TRACKING_POINTS.DAILY_NOTIFICATION_GROUP_LEADS_EMAIL_ON,
    emailOff:
      OVERTIME_NOTIFICATION_TRACKING_POINTS.DAILY_NOTIFICATION_GROUP_LEADS_EMAIL_OFF,
    mobileOn:
      OVERTIME_NOTIFICATION_TRACKING_POINTS.DAILY_NOTIFICATION_GROUP_LEADS_MOBILE_ON,
    mobileOff:
      OVERTIME_NOTIFICATION_TRACKING_POINTS.DAILY_NOTIFICATION_GROUP_LEADS_MOBILE_OFF,
  },
  employee: {
    emailOn:
      OVERTIME_NOTIFICATION_TRACKING_POINTS.DAILY_NOTIFICATION_EMPLOYEES_EMAIL_ON,
    emailOff:
      OVERTIME_NOTIFICATION_TRACKING_POINTS.DAILY_NOTIFICATION_EMPLOYEES_EMAIL_OFF,
    mobileOn:
      OVERTIME_NOTIFICATION_TRACKING_POINTS.DAILY_NOTIFICATION_EMPLOYEES_MOBILE_ON,
    mobileOff:
      OVERTIME_NOTIFICATION_TRACKING_POINTS.DAILY_NOTIFICATION_EMPLOYEES_MOBILE_OFF,
  },
} as const;

export const OVERTIME_NOTIFICATION_WEEKLY_FIELD_TRACKING_POINTS = {
  hours: OVERTIME_NOTIFICATION_TRACKING_POINTS.WEEKLY_HOURS_EXCEED,
  minutes: OVERTIME_NOTIFICATION_TRACKING_POINTS.WEEKLY_MINUTES_EXCEED,
  totalAlerts: OVERTIME_NOTIFICATION_TRACKING_POINTS.WEEKLY_TOTAL_ALERTS,
  frequency: OVERTIME_NOTIFICATION_TRACKING_POINTS.WEEKLY_TIME_FREQUENCY,
} as const;

export const OVERTIME_NOTIFICATION_WEEKLY_RECIPIENT_TRACKING_POINTS = {
  admin: {
    emailOn:
      OVERTIME_NOTIFICATION_TRACKING_POINTS.WEEKLY_NOTIFICATION_ADMIN_EMAIL_ON,
    emailOff:
      OVERTIME_NOTIFICATION_TRACKING_POINTS.WEEKLY_NOTIFICATION_ADMIN_EMAIL_OFF,
    mobileOn:
      OVERTIME_NOTIFICATION_TRACKING_POINTS.WEEKLY_NOTIFICATION_ADMIN_MOBILE_ON,
    mobileOff:
      OVERTIME_NOTIFICATION_TRACKING_POINTS.WEEKLY_NOTIFICATION_ADMIN_MOBILE_OFF,
  },
  groupManager: {
    emailOn:
      OVERTIME_NOTIFICATION_TRACKING_POINTS.WEEKLY_NOTIFICATION_GROUP_LEADS_EMAIL_ON,
    emailOff:
      OVERTIME_NOTIFICATION_TRACKING_POINTS.WEEKLY_NOTIFICATION_GROUP_LEADS_EMAIL_OFF,
    mobileOn:
      OVERTIME_NOTIFICATION_TRACKING_POINTS.WEEKLY_NOTIFICATION_GROUP_LEADS_MOBILE_ON,
    mobileOff:
      OVERTIME_NOTIFICATION_TRACKING_POINTS.WEEKLY_NOTIFICATION_GROUP_LEADS_MOBILE_OFF,
  },
  employee: {
    emailOn:
      OVERTIME_NOTIFICATION_TRACKING_POINTS.WEEKLY_NOTIFICATION_EMPLOYEES_EMAIL_ON,
    emailOff:
      OVERTIME_NOTIFICATION_TRACKING_POINTS.WEEKLY_NOTIFICATION_EMPLOYEES_EMAIL_OFF,
    mobileOn:
      OVERTIME_NOTIFICATION_TRACKING_POINTS.WEEKLY_NOTIFICATION_EMPLOYEES_MOBILE_ON,
    mobileOff:
      OVERTIME_NOTIFICATION_TRACKING_POINTS.WEEKLY_NOTIFICATION_EMPLOYEES_MOBILE_OFF,
  },
} as const;

// ============================================================================
// SECTION 5: Worker Level Overtime Rule Overrides (Assignments Tab)
// ============================================================================

const WORKER_OVERTIME_BASE = {
  org: 'sbseg',
  purpose: 'prod',
  scope: 'time',
  scope_area: 'worker_overtime',
} as const;

export const WORKER_OVERTIME_TRACKING_POINTS: OvertimeTrackingPoints = {
  // ── Assignments screen ──
  WORKER_OVERTIME_EDIT: {
    ...WORKER_OVERTIME_BASE,
    screen: 'assignments',
    action: 'engaged',
    object: 'component',
    object_detail: 'worker_overtime_edit',
    ui_action: 'clicked',
    ui_object: 'edit link',
    ui_object_detail: 'worker_overtime_edit',
  },
  CLICK_COMPANY_LEVEL_RADIO_BUTTON: {
    ...WORKER_OVERTIME_BASE,
    screen: 'assignments',
    action: 'engaged',
    object: 'component',
    object_detail: 'click_company_level_radio_button',
    ui_action: 'clicked',
    ui_object: 'radio button',
    ui_object_detail: 'click_company_level_radio_button',
  },
  CLICK_MANAGE_COMPANY_HYPERLINK: {
    ...WORKER_OVERTIME_BASE,
    screen: 'assignments',
    action: 'engaged',
    object: 'component',
    object_detail: 'click_manage_company_hyperlink',
    ui_action: 'clicked',
    ui_object: 'link',
    ui_object_detail: 'click_manage_company_hyperlink',
  },
  CLICK_CUSTOM_RULES_RADIO_BUTTON: {
    ...WORKER_OVERTIME_BASE,
    screen: 'assignments',
    action: 'engaged',
    object: 'component',
    object_detail: 'click_custom_rules_radio_button',
    ui_action: 'clicked',
    ui_object: 'radio button',
    ui_object_detail: 'click_custom_rules_radio_button',
  },

  // ── Overtime rules screen ──
  RULE_DROPDOWN_CLICK: {
    ...WORKER_OVERTIME_BASE,
    screen: 'overtime_rules',
    action: 'engaged',
    object: 'component',
    object_detail: 'rule_dropdown_click',
    ui_action: 'clicked',
    ui_object: 'dropdown',
    ui_object_detail: 'rule_dropdown_click',
  },
  OVERTIME_RULES_SELECT: {
    ...WORKER_OVERTIME_BASE,
    screen: 'overtime_rules',
    action: 'engaged',
    object: 'component',
    object_detail: 'overtime_rules_select',
    ui_action: 'selection',
    ui_object: 'dropdown',
    ui_object_detail: 'overtime_rules_select',
  },

  // ── Basic rules screen ──
  BASIC_WEEKLY_HOURS: {
    ...WORKER_OVERTIME_BASE,
    screen: 'overtime rules_basic',
    action: 'engaged',
    object: 'component',
    object_detail: 'basic_weekly_hours',
    ui_action: 'typed',
    ui_object: 'form_field',
    ui_object_detail: 'basic_weekly_hours',
  },
  BASIC_DAILY_ON: {
    ...WORKER_OVERTIME_BASE,
    screen: 'overtime rules_basic',
    action: 'engaged',
    object: 'component',
    object_detail: 'basic_daily_on',
    ui_action: 'enabled',
    ui_object: 'checkbox',
    ui_object_detail: 'basic_daily_on',
  },
  BASIC_DAILY_OFF: {
    ...WORKER_OVERTIME_BASE,
    screen: 'overtime rules_basic',
    action: 'engaged',
    object: 'component',
    object_detail: 'basic_daily_off',
    ui_action: 'disabled',
    ui_object: 'checkbox',
    ui_object_detail: 'basic_daily_off',
  },
  BASIC_DAILY_SELECT_DAYS_CLICK: {
    ...WORKER_OVERTIME_BASE,
    screen: 'overtime rules_basic',
    action: 'engaged',
    object: 'component',
    object_detail: 'basic_daily_select_days_click',
    ui_action: 'clicked',
    ui_object: 'dropdown',
    ui_object_detail: 'basic_daily_select_days_click',
  },
  BASIC_DAILY_SELECT_DAYS: {
    ...WORKER_OVERTIME_BASE,
    screen: 'overtime rules_basic',
    action: 'engaged',
    object: 'component',
    object_detail: 'basic_daily_select_days',
    ui_action: 'selection',
    ui_object: 'dropdown',
    ui_object_detail: 'basic_daily_select_days',
  },
  BASIC_DAILY_HOURS: {
    ...WORKER_OVERTIME_BASE,
    screen: 'overtime rules_basic',
    action: 'engaged',
    object: 'component',
    object_detail: 'basic_daily_hours',
    ui_action: 'typed',
    ui_object: 'form_field',
    ui_object_detail: 'basic_daily_hours',
  },
  BASIC_DOUBLE_DAILY_ON: {
    ...WORKER_OVERTIME_BASE,
    screen: 'overtime rules_basic',
    action: 'engaged',
    object: 'component',
    object_detail: 'basic_double_daily_on',
    ui_action: 'enabled',
    ui_object: 'checkbox',
    ui_object_detail: 'basic_double_daily_on',
  },
  BASIC_DOUBLE_DAILY_OFF: {
    ...WORKER_OVERTIME_BASE,
    screen: 'overtime rules_basic',
    action: 'engaged',
    object: 'component',
    object_detail: 'basic_double_daily_off',
    ui_action: 'disabled',
    ui_object: 'checkbox',
    ui_object_detail: 'basic_double_daily_off',
  },
  BASIC_DOUBLE_DAILY_SELECT_DAYS_CLICK: {
    ...WORKER_OVERTIME_BASE,
    screen: 'overtime rules_basic',
    action: 'engaged',
    object: 'component',
    object_detail: 'basic_double_daily_select_days_click',
    ui_action: 'clicked',
    ui_object: 'dropdown',
    ui_object_detail: 'basic_double_daily_select_days_click',
  },
  BASIC_DOUBLE_DAILY_SELECT_DAYS: {
    ...WORKER_OVERTIME_BASE,
    screen: 'overtime rules_basic',
    action: 'engaged',
    object: 'component',
    object_detail: 'basic_double_daily_select_days',
    ui_action: 'selection',
    ui_object: 'dropdown',
    ui_object_detail: 'basic_double_daily_select_days',
  },
  BASIC_DOUBLE_DAILY_HOURS: {
    ...WORKER_OVERTIME_BASE,
    screen: 'overtime rules_basic',
    action: 'engaged',
    object: 'component',
    object_detail: 'basic_double_daily_hours',
    ui_action: 'typed',
    ui_object: 'form_field',
    ui_object_detail: 'basic_double_daily_hours',
  },
  BASIC_WEEKLY_OFF: {
    ...WORKER_OVERTIME_BASE,
    screen: 'overtime rules_basic',
    action: 'engaged',
    object: 'component',
    object_detail: 'basic_weekly_off',
    ui_action: 'disabled',
    ui_object: 'checkbox',
    ui_object_detail: 'basic_weekly_off',
  },

  // ── Overtime rules worker screen (save/cancel/assign) ──
  OVERTIME_RULES_SAVE: {
    ...WORKER_OVERTIME_BASE,
    screen: 'overtime_rules_cworker',
    action: 'engaged',
    object: 'component',
    object_detail: 'overtime_rules_save',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'overtime_rules_save',
  },
  OVERTIME_RULES_CANCEL: {
    ...WORKER_OVERTIME_BASE,
    screen: 'overtime_rules_worker',
    action: 'engaged',
    object: 'component',
    object_detail: 'overtime_rules_cancel',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'overtime_rules_cancel',
  },

  // ── Full state screens ──
  OVERTIME_RULES_ASSIGN_WORKER: {
    ...WORKER_OVERTIME_BASE,
    screen: 'overtime_rules_worker',
    action: 'engaged',
    object: 'component',
    object_detail: 'overtime_rules_assign_worker',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'overtime_rules_assign_worker',
  },
  OVERTIME_RULES_EDIT_POLICY: {
    ...WORKER_OVERTIME_BASE,
    screen: 'overtime_rules_worker',
    action: 'engaged',
    object: 'component',
    object_detail: 'overtime_rules_edit_policy',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'overtime_rules_edit_policy',
  },
} as const;

// ============================================================================
// SECTION 6: Worker Level Overtime Alerts (Notifications on Assignments Tab)
// ============================================================================

export const WORKER_OVERTIME_NOTIFICATION_TRACKING_POINTS: OvertimeTrackingPoints =
  {
    // ── Daily toggle ──
    DAILY_ON: {
      ...OVERTIME_NOTIFICATION_BASE,
      screen: 'assignments',
      action: 'engaged',
      object: 'component',
      object_detail: 'daily_on',
      ui_action: 'enabled',
      ui_object: 'checkbox',
      ui_object_detail: 'daily_on',
    },
    DAILY_OFF: {
      ...OVERTIME_NOTIFICATION_BASE,
      screen: 'assignments',
      action: 'engaged',
      object: 'component',
      object_detail: 'daily_off',
      ui_action: 'disabled',
      ui_object: 'checkbox',
      ui_object_detail: 'daily_off',
    },

    // ── Daily form fields ──
    DAILY_HOURS_EXCEED: {
      ...OVERTIME_NOTIFICATION_BASE,
      screen: 'assignments',
      action: 'engaged',
      object: 'component',
      object_detail: 'daily_hours_exceed',
      ui_action: 'typed',
      ui_object: 'form_field',
      ui_object_detail: 'daily_hours_exceed',
    },
    DAILY_MINUTES_EXCEED: {
      ...OVERTIME_NOTIFICATION_BASE,
      screen: 'assignments',
      action: 'engaged',
      object: 'component',
      object_detail: 'daily_minutes_exceed',
      ui_action: 'typed',
      ui_object: 'form_field',
      ui_object_detail: 'daily_minutes_exceed',
    },
    DAILY_TOTAL_ALERTS: {
      ...OVERTIME_NOTIFICATION_BASE,
      screen: 'assignments',
      action: 'engaged',
      object: 'component',
      object_detail: 'daily_total_alerts',
      ui_action: 'typed',
      ui_object: 'form_field',
      ui_object_detail: 'daily_total_alerts',
    },
    DAILY_TIME_FREQUENCY: {
      ...OVERTIME_NOTIFICATION_BASE,
      screen: 'assignments',
      action: 'engaged',
      object: 'component',
      object_detail: 'daily_time_frequency',
      ui_action: 'typed',
      ui_object: 'form_field',
      ui_object_detail: 'daily_time_frequency',
    },

    // ── Daily admin checkboxes ──
    DAILY_NOTIFICATION_ADMIN_EMAIL_ON: {
      ...OVERTIME_NOTIFICATION_BASE,
      screen: 'assignments',
      action: 'engaged',
      object: 'widget',
      object_detail: 'daily_notification_admin_email_on',
      ui_action: 'enabled',
      ui_object: 'checkbox',
      ui_object_detail: 'daily_notification_admin_email_on',
      ui_access_point: 'page',
    },
    DAILY_NOTIFICATION_ADMIN_EMAIL_OFF: {
      ...OVERTIME_NOTIFICATION_BASE,
      screen: 'assignments',
      action: 'engaged',
      object: 'widget',
      object_detail: 'daily_notification_admin_email_off',
      ui_action: 'disabled',
      ui_object: 'checkbox',
      ui_object_detail: 'daily_notification_admin_email_off',
      ui_access_point: 'page',
    },
    DAILY_NOTIFICATION_ADMIN_MOBILE_ON: {
      ...OVERTIME_NOTIFICATION_BASE,
      screen: 'assignments',
      action: 'engaged',
      object: 'widget',
      object_detail: 'daily_notification_admin_mobile_on',
      ui_action: 'enabled',
      ui_object: 'checkbox',
      ui_object_detail: 'daily_notification_admin_mobile_on',
      ui_access_point: 'page',
    },
    DAILY_NOTIFICATION_ADMIN_MOBILE_OFF: {
      ...OVERTIME_NOTIFICATION_BASE,
      screen: 'assignments',
      action: 'engaged',
      object: 'widget',
      object_detail: 'daily_notification_admin_mobile_off',
      ui_action: 'disabled',
      ui_object: 'checkbox',
      ui_object_detail: 'daily_notification_admin_mobile_off',
      ui_access_point: 'page',
    },

    // ── Daily group leads checkboxes ──
    DAILY_NOTIFICATION_GROUP_LEADS_EMAIL_ON: {
      ...OVERTIME_NOTIFICATION_BASE,
      screen: 'assignments',
      action: 'engaged',
      object: 'widget',
      object_detail: 'daily_notification_group_leads_email_on',
      ui_action: 'enabled',
      ui_object: 'checkbox',
      ui_object_detail: 'daily_notification_group_leads_email_on',
      ui_access_point: 'page',
    },
    DAILY_NOTIFICATION_GROUP_LEADS_EMAIL_OFF: {
      ...OVERTIME_NOTIFICATION_BASE,
      screen: 'assignments',
      action: 'engaged',
      object: 'widget',
      object_detail: 'daily_notification_group_leads_email_off',
      ui_action: 'disabled',
      ui_object: 'checkbox',
      ui_object_detail: 'daily_notification_group_leads_email_off',
      ui_access_point: 'page',
    },
    DAILY_NOTIFICATION_GROUP_LEADS_MOBILE_ON: {
      ...OVERTIME_NOTIFICATION_BASE,
      screen: 'assignments',
      action: 'engaged',
      object: 'widget',
      object_detail: 'daily_notification_group_leads_mobile_on',
      ui_action: 'enabled',
      ui_object: 'checkbox',
      ui_object_detail: 'daily_notification_group_leads_mobile_on',
      ui_access_point: 'page',
    },
    DAILY_NOTIFICATION_GROUP_LEADS_MOBILE_OFF: {
      ...OVERTIME_NOTIFICATION_BASE,
      screen: 'assignments',
      action: 'engaged',
      object: 'widget',
      object_detail: 'daily_notification_group_leads_mobile_off',
      ui_action: 'disabled',
      ui_object: 'checkbox',
      ui_object_detail: 'daily_notification_group_leads_mobile_off',
      ui_access_point: 'page',
    },

    // ── Daily employees checkboxes ──
    DAILY_NOTIFICATION_EMPLOYEES_EMAIL_ON: {
      ...OVERTIME_NOTIFICATION_BASE,
      screen: 'assignments',
      action: 'engaged',
      object: 'widget',
      object_detail: 'daily_notification_employees_email_on',
      ui_action: 'enabled',
      ui_object: 'checkbox',
      ui_object_detail: 'daily_notification_employees_email_on',
      ui_access_point: 'page',
    },
    DAILY_NOTIFICATION_EMPLOYEES_EMAIL_OFF: {
      ...OVERTIME_NOTIFICATION_BASE,
      screen: 'assignments',
      action: 'engaged',
      object: 'widget',
      object_detail: 'daily_notification_employees_email_off',
      ui_action: 'disabled',
      ui_object: 'checkbox',
      ui_object_detail: 'daily_notification_employees_email_off',
      ui_access_point: 'page',
    },
    DAILY_NOTIFICATION_EMPLOYEES_MOBILE_ON: {
      ...OVERTIME_NOTIFICATION_BASE,
      screen: 'assignments',
      action: 'engaged',
      object: 'widget',
      object_detail: 'daily_notification_employees_mobile_on',
      ui_action: 'enabled',
      ui_object: 'checkbox',
      ui_object_detail: 'daily_notification_employees_mobile_on',
      ui_access_point: 'page',
    },
    DAILY_NOTIFICATION_EMPLOYEES_MOBILE_OFF: {
      ...OVERTIME_NOTIFICATION_BASE,
      screen: 'assignments',
      action: 'engaged',
      object: 'widget',
      object_detail: 'daily_notification_employees_mobile_off',
      ui_action: 'disabled',
      ui_object: 'checkbox',
      ui_object_detail: 'daily_notification_employees_mobile_off',
      ui_access_point: 'page',
    },

    // ── Save / Cancel ──
    SAVE: {
      ...OVERTIME_NOTIFICATION_BASE,
      screen: 'assignments',
      action: 'engaged',
      object: 'widget',
      object_detail: 'save',
      ui_action: 'clicked',
      ui_object: 'button',
      ui_object_detail: 'save',
    },
    CANCEL: {
      ...OVERTIME_NOTIFICATION_BASE,
      screen: 'assignments',
      action: 'engaged',
      object: 'widget',
      object_detail: 'cancel',
      ui_action: 'clicked',
      ui_object: 'button',
      ui_object_detail: 'cancel',
    },

    // ── Weekly toggle ──
    WEEKLY_ON: {
      ...OVERTIME_NOTIFICATION_BASE,
      screen: 'assignments',
      action: 'engaged',
      object: 'component',
      object_detail: 'weekly_on',
      ui_action: 'enabled',
      ui_object: 'checkbox',
      ui_object_detail: 'weekly_on',
    },
    WEEKLY_OFF: {
      ...OVERTIME_NOTIFICATION_BASE,
      screen: 'assignments',
      action: 'engaged',
      object: 'component',
      object_detail: 'weekly_off',
      ui_action: 'disabled',
      ui_object: 'checkbox',
      ui_object_detail: 'weekly_off',
    },

    // ── Weekly form fields ──
    WEEKLY_HOURS_EXCEED: {
      ...OVERTIME_NOTIFICATION_BASE,
      screen: 'assignments',
      action: 'engaged',
      object: 'component',
      object_detail: 'weekly_hours_exceed',
      ui_action: 'typed',
      ui_object: 'form_field',
      ui_object_detail: 'weekly_hours_exceed',
    },
    WEEKLY_MINUTES_EXCEED: {
      ...OVERTIME_NOTIFICATION_BASE,
      screen: 'assignments',
      action: 'engaged',
      object: 'component',
      object_detail: 'weekly_minutes_exceed',
      ui_action: 'typed',
      ui_object: 'form_field',
      ui_object_detail: 'weekly_minutes_exceed',
    },
    WEEKLY_TOTAL_ALERTS: {
      ...OVERTIME_NOTIFICATION_BASE,
      screen: 'assignments',
      action: 'engaged',
      object: 'component',
      object_detail: 'weekly_total_alerts',
      ui_action: 'typed',
      ui_object: 'form_field',
      ui_object_detail: 'weekly_total_alerts',
    },
    WEEKLY_TIME_FREQUENCY: {
      ...OVERTIME_NOTIFICATION_BASE,
      screen: 'assignments',
      action: 'engaged',
      object: 'component',
      object_detail: 'weekly_time_frequency',
      ui_action: 'typed',
      ui_object: 'form_field',
      ui_object_detail: 'weekly_time_frequency',
    },

    // ── Weekly admin checkboxes ──
    WEEKLY_NOTIFICATION_ADMIN_EMAIL_ON: {
      ...OVERTIME_NOTIFICATION_BASE,
      screen: 'assignments',
      action: 'engaged',
      object: 'widget',
      object_detail: 'weekly_notification_admin_email_on',
      ui_action: 'enabled',
      ui_object: 'checkbox',
      ui_object_detail: 'weekly_notification_admin_email_on',
      ui_access_point: 'page',
    },
    WEEKLY_NOTIFICATION_ADMIN_EMAIL_OFF: {
      ...OVERTIME_NOTIFICATION_BASE,
      screen: 'assignments',
      action: 'engaged',
      object: 'widget',
      object_detail: 'weekly_notification_admin_email_off',
      ui_action: 'disabled',
      ui_object: 'checkbox',
      ui_object_detail: 'weekly_notification_admin_email_off',
      ui_access_point: 'page',
    },
    WEEKLY_NOTIFICATION_ADMIN_MOBILE_ON: {
      ...OVERTIME_NOTIFICATION_BASE,
      screen: 'assignments',
      action: 'engaged',
      object: 'widget',
      object_detail: 'weekly_notification_admin_mobile_on',
      ui_action: 'enabled',
      ui_object: 'checkbox',
      ui_object_detail: 'weekly_notification_admin_mobile_on',
      ui_access_point: 'page',
    },
    WEEKLY_NOTIFICATION_ADMIN_MOBILE_OFF: {
      ...OVERTIME_NOTIFICATION_BASE,
      screen: 'assignments',
      action: 'engaged',
      object: 'widget',
      object_detail: 'weekly_notification_admin_mobile_off',
      ui_action: 'disabled',
      ui_object: 'checkbox',
      ui_object_detail: 'weekly_notification_admin_mobile_off',
      ui_access_point: 'page',
    },

    // ── Weekly group leads checkboxes ──
    WEEKLY_NOTIFICATION_GROUP_LEADS_EMAIL_ON: {
      ...OVERTIME_NOTIFICATION_BASE,
      screen: 'assignments',
      action: 'engaged',
      object: 'widget',
      object_detail: 'weekly_notification_group_leads_email_on',
      ui_action: 'enabled',
      ui_object: 'checkbox',
      ui_object_detail: 'weekly_notification_group_leads_email_on',
      ui_access_point: 'page',
    },
    WEEKLY_NOTIFICATION_GROUP_LEADS_EMAIL_OFF: {
      ...OVERTIME_NOTIFICATION_BASE,
      screen: 'assignments',
      action: 'engaged',
      object: 'widget',
      object_detail: 'weekly_notification_group_leads_email_off',
      ui_action: 'disabled',
      ui_object: 'checkbox',
      ui_object_detail: 'weekly_notification_group_leads_email_off',
      ui_access_point: 'page',
    },
    WEEKLY_NOTIFICATION_GROUP_LEADS_MOBILE_ON: {
      ...OVERTIME_NOTIFICATION_BASE,
      screen: 'assignments',
      action: 'engaged',
      object: 'widget',
      object_detail: 'weekly_notification_group_leads_mobile_on',
      ui_action: 'enabled',
      ui_object: 'checkbox',
      ui_object_detail: 'weekly_notification_group_leads_mobile_on',
      ui_access_point: 'page',
    },
    WEEKLY_NOTIFICATION_GROUP_LEADS_MOBILE_OFF: {
      ...OVERTIME_NOTIFICATION_BASE,
      screen: 'assignments',
      action: 'engaged',
      object: 'widget',
      object_detail: 'weekly_notification_group_leads_mobile_off',
      ui_action: 'disabled',
      ui_object: 'checkbox',
      ui_object_detail: 'weekly_notification_group_leads_mobile_off',
      ui_access_point: 'page',
    },

    // ── Weekly employees checkboxes ──
    WEEKLY_NOTIFICATION_EMPLOYEES_EMAIL_ON: {
      ...OVERTIME_NOTIFICATION_BASE,
      screen: 'assignments',
      action: 'engaged',
      object: 'widget',
      object_detail: 'weekly_notification_employees_email_on',
      ui_action: 'enabled',
      ui_object: 'checkbox',
      ui_object_detail: 'weekly_notification_employees_email_on',
      ui_access_point: 'page',
    },
    WEEKLY_NOTIFICATION_EMPLOYEES_EMAIL_OFF: {
      ...OVERTIME_NOTIFICATION_BASE,
      screen: 'assignments',
      action: 'engaged',
      object: 'widget',
      object_detail: 'weekly_notification_employees_email_off',
      ui_action: 'disabled',
      ui_object: 'checkbox',
      ui_object_detail: 'weekly_notification_employees_email_off',
      ui_access_point: 'page',
    },
    WEEKLY_NOTIFICATION_EMPLOYEES_MOBILE_ON: {
      ...OVERTIME_NOTIFICATION_BASE,
      screen: 'assignments',
      action: 'engaged',
      object: 'widget',
      object_detail: 'weekly_notification_employees_mobile_on',
      ui_action: 'enabled',
      ui_object: 'checkbox',
      ui_object_detail: 'weekly_notification_employees_mobile_on',
      ui_access_point: 'page',
    },
    WEEKLY_NOTIFICATION_EMPLOYEES_MOBILE_OFF: {
      ...OVERTIME_NOTIFICATION_BASE,
      screen: 'assignments',
      action: 'engaged',
      object: 'widget',
      object_detail: 'weekly_notification_employees_mobile_off',
      ui_action: 'disabled',
      ui_object: 'checkbox',
      ui_object_detail: 'weekly_notification_employees_mobile_off',
      ui_access_point: 'page',
    },
  } as const;

export const WORKER_OVERTIME_NOTIFICATION_DAILY_FIELD_TRACKING_POINTS = {
  hours: WORKER_OVERTIME_NOTIFICATION_TRACKING_POINTS.DAILY_HOURS_EXCEED,
  minutes: WORKER_OVERTIME_NOTIFICATION_TRACKING_POINTS.DAILY_MINUTES_EXCEED,
  totalAlerts: WORKER_OVERTIME_NOTIFICATION_TRACKING_POINTS.DAILY_TOTAL_ALERTS,
  frequency: WORKER_OVERTIME_NOTIFICATION_TRACKING_POINTS.DAILY_TIME_FREQUENCY,
} as const;

export const WORKER_OVERTIME_NOTIFICATION_DAILY_RECIPIENT_TRACKING_POINTS = {
  admin: {
    emailOn:
      WORKER_OVERTIME_NOTIFICATION_TRACKING_POINTS.DAILY_NOTIFICATION_ADMIN_EMAIL_ON,
    emailOff:
      WORKER_OVERTIME_NOTIFICATION_TRACKING_POINTS.DAILY_NOTIFICATION_ADMIN_EMAIL_OFF,
    mobileOn:
      WORKER_OVERTIME_NOTIFICATION_TRACKING_POINTS.DAILY_NOTIFICATION_ADMIN_MOBILE_ON,
    mobileOff:
      WORKER_OVERTIME_NOTIFICATION_TRACKING_POINTS.DAILY_NOTIFICATION_ADMIN_MOBILE_OFF,
  },
  groupManager: {
    emailOn:
      WORKER_OVERTIME_NOTIFICATION_TRACKING_POINTS.DAILY_NOTIFICATION_GROUP_LEADS_EMAIL_ON,
    emailOff:
      WORKER_OVERTIME_NOTIFICATION_TRACKING_POINTS.DAILY_NOTIFICATION_GROUP_LEADS_EMAIL_OFF,
    mobileOn:
      WORKER_OVERTIME_NOTIFICATION_TRACKING_POINTS.DAILY_NOTIFICATION_GROUP_LEADS_MOBILE_ON,
    mobileOff:
      WORKER_OVERTIME_NOTIFICATION_TRACKING_POINTS.DAILY_NOTIFICATION_GROUP_LEADS_MOBILE_OFF,
  },
  employee: {
    emailOn:
      WORKER_OVERTIME_NOTIFICATION_TRACKING_POINTS.DAILY_NOTIFICATION_EMPLOYEES_EMAIL_ON,
    emailOff:
      WORKER_OVERTIME_NOTIFICATION_TRACKING_POINTS.DAILY_NOTIFICATION_EMPLOYEES_EMAIL_OFF,
    mobileOn:
      WORKER_OVERTIME_NOTIFICATION_TRACKING_POINTS.DAILY_NOTIFICATION_EMPLOYEES_MOBILE_ON,
    mobileOff:
      WORKER_OVERTIME_NOTIFICATION_TRACKING_POINTS.DAILY_NOTIFICATION_EMPLOYEES_MOBILE_OFF,
  },
} as const;

export const WORKER_OVERTIME_NOTIFICATION_WEEKLY_FIELD_TRACKING_POINTS = {
  hours: WORKER_OVERTIME_NOTIFICATION_TRACKING_POINTS.WEEKLY_HOURS_EXCEED,
  minutes: WORKER_OVERTIME_NOTIFICATION_TRACKING_POINTS.WEEKLY_MINUTES_EXCEED,
  totalAlerts: WORKER_OVERTIME_NOTIFICATION_TRACKING_POINTS.WEEKLY_TOTAL_ALERTS,
  frequency: WORKER_OVERTIME_NOTIFICATION_TRACKING_POINTS.WEEKLY_TIME_FREQUENCY,
} as const;

export const WORKER_OVERTIME_NOTIFICATION_WEEKLY_RECIPIENT_TRACKING_POINTS = {
  admin: {
    emailOn:
      WORKER_OVERTIME_NOTIFICATION_TRACKING_POINTS.WEEKLY_NOTIFICATION_ADMIN_EMAIL_ON,
    emailOff:
      WORKER_OVERTIME_NOTIFICATION_TRACKING_POINTS.WEEKLY_NOTIFICATION_ADMIN_EMAIL_OFF,
    mobileOn:
      WORKER_OVERTIME_NOTIFICATION_TRACKING_POINTS.WEEKLY_NOTIFICATION_ADMIN_MOBILE_ON,
    mobileOff:
      WORKER_OVERTIME_NOTIFICATION_TRACKING_POINTS.WEEKLY_NOTIFICATION_ADMIN_MOBILE_OFF,
  },
  groupManager: {
    emailOn:
      WORKER_OVERTIME_NOTIFICATION_TRACKING_POINTS.WEEKLY_NOTIFICATION_GROUP_LEADS_EMAIL_ON,
    emailOff:
      WORKER_OVERTIME_NOTIFICATION_TRACKING_POINTS.WEEKLY_NOTIFICATION_GROUP_LEADS_EMAIL_OFF,
    mobileOn:
      WORKER_OVERTIME_NOTIFICATION_TRACKING_POINTS.WEEKLY_NOTIFICATION_GROUP_LEADS_MOBILE_ON,
    mobileOff:
      WORKER_OVERTIME_NOTIFICATION_TRACKING_POINTS.WEEKLY_NOTIFICATION_GROUP_LEADS_MOBILE_OFF,
  },
  employee: {
    emailOn:
      WORKER_OVERTIME_NOTIFICATION_TRACKING_POINTS.WEEKLY_NOTIFICATION_EMPLOYEES_EMAIL_ON,
    emailOff:
      WORKER_OVERTIME_NOTIFICATION_TRACKING_POINTS.WEEKLY_NOTIFICATION_EMPLOYEES_EMAIL_OFF,
    mobileOn:
      WORKER_OVERTIME_NOTIFICATION_TRACKING_POINTS.WEEKLY_NOTIFICATION_EMPLOYEES_MOBILE_ON,
    mobileOff:
      WORKER_OVERTIME_NOTIFICATION_TRACKING_POINTS.WEEKLY_NOTIFICATION_EMPLOYEES_MOBILE_OFF,
  },
} as const;

// ============================================================================
// Combined export for backward compatibility
// ============================================================================

export const OVERTIME_TRACKING_POINTS: OvertimeTrackingPoints = {
  ...MANAGE_OVERTIME_LANDING_TRACKING_POINTS,
  ...POLICY_LANDING_TRACKING_POINTS,
  ...SET_OVERTIME_POLICY_TRACKING_POINTS,
  ...OVERTIME_RULES_TRACKING_POINTS,
  ...OVERTIME_RULES_BASIC_TRACKING_POINTS,
  ...OVERTIME_RULES_CALIFORNIA_TRACKING_POINTS,
  ...OVERTIME_RULES_CUSTOM_TRACKING_POINTS,
  ...POLICY_MEMBERS_TRACKING_POINTS,
  ...REVIEW_OVERTIME_POLICY_TRACKING_POINTS,
  ...WIZARD_GLOBAL_NAV_TRACKING_POINTS,
  ...EDIT_OVERTIME_POLICY_TRACKING_POINTS,
} as const;

import {
  TrackingPoint,
  TrackingPoints,
  createTrackingPoints,
} from '../../../common/useClickTracking';

// Base configuration shared across all tracking points (QBO)
const BASE: Pick<
  TrackingPoint,
  'org' | 'purpose' | 'scope' | 'scope_area' | 'action' | 'object'
> = {
  org: 'sbseg',
  purpose: 'prod',
  scope: 'time',
  scope_area: 'Time projects',
  action: 'engaged',
  object: 'component',
};

// ---------------------------------------------------------------------------
// Landing Page  (screen: Time_projects_landing_page)
// ---------------------------------------------------------------------------
// Base tracking template for Landing Page
const BASE_LANDING_PAGE_TRACKING_TEMPLATE = {
  CLICK_STATUS_DROPDOWN: {
    ...BASE,
    screen: 'Time_projects_landing_page',
    object_detail: 'click_status_dropdown',
    ui_action: 'clicked',
    ui_object: 'dropdown',
    ui_object_detail: 'click_status_dropdown',
  },
  SELECT_STATUS_DROPDOWN: {
    ...BASE,
    screen: 'Time_projects_landing_page',
    object_detail: 'select_status_dropdown',
    ui_action: 'selected',
    ui_object: 'dropdown',
    ui_object_detail: 'select_status_dropdown',
  },
  CLICK_CUSTOMER_SEARCH_DROPDOWN: {
    ...BASE,
    screen: 'Time_projects_landing_page',
    object_detail: 'click_customer_search_dropdown',
    ui_action: 'clicked',
    ui_object: 'dropdown',
    ui_object_detail: 'click_customer_search_dropdown',
  },
  SELECT_CUSTOMER_SEARCH: {
    ...BASE,
    screen: 'Time_projects_landing_page',
    object_detail: 'select_customer_search',
    ui_action: 'selected',
    ui_object: 'dropdown',
    ui_object_detail: 'select_customer_search',
  },
  CLICK_CUSTOMER_SEARCH_FORM_FIELD: {
    ...BASE,
    screen: 'Time_projects_landing_page',
    object_detail: 'click_customer_search_form_field',
    ui_action: 'clicked',
    ui_object: 'form field',
    ui_object_detail: 'click_customer_search_form_field',
  },
  TYPE_CUSTOMER_SEARCH_FORM_FIELD: {
    ...BASE,
    screen: 'Time_projects_landing_page',
    object_detail: 'type_customer_search_form_field',
    ui_action: 'typed',
    ui_object: 'form field',
    ui_object_detail: 'type_customer_search_form_field',
  },
  CLICK_SEARCH_ICON: {
    ...BASE,
    screen: 'Time_projects_landing_page',
    object_detail: 'click_search_icon',
    ui_action: 'engaged',
    ui_object: 'search',
    ui_object_detail: 'click_search_icon',
  },
  CLICK_MANAGE_PROJECTS: {
    ...BASE,
    screen: 'Time_projects_landing_page',
    object_detail: 'click_manage_projects',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'click_manage_projects',
  },
  CLICK_CREATE_ESTIMATE_LANDING_PAGE: {
    ...BASE,
    screen: 'Time_projects_landing_page',
    object_detail: 'click_create_estimate_landing_page',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'click_create_estimate_landing page',
  },
  CLICK_VIEW_PROJECT_LANDING_PAGE: {
    ...BASE,
    screen: 'Time_projects_landing_page',
    object_detail: 'click_view_project_landing_page',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'click_view_project_landing page',
  },
  CLICK_PROJECTS_DROPDOWN: {
    ...BASE,
    screen: 'Time_projects_landing_page',
    object_detail: 'click_projects_dropdown',
    ui_action: 'clicked',
    ui_object: 'dropdown',
    ui_object_detail: 'click_projects_dropdown',
  },
  CLICK_PROJECTS_LANDING_PAGE: {
    ...BASE,
    screen: 'Time_projects_landing_page',
    object_detail: 'click_projects_landing_page',
    ui_action: 'engaged',
    ui_object: 'component',
    ui_object_detail: 'click_projects_landing_page',
  },
  SELECT_VIEW_PROJECT_DROPDOWN: {
    ...BASE,
    screen: 'Time_projects_landing_page',
    object_detail: 'select_view_project_dropdown',
    ui_action: 'selected',
    ui_object: 'dropdown',
    ui_object_detail: 'click_view_project_dropdown',
  },
  SELECT_EDIT_PROJECT_DROPDOWN: {
    ...BASE,
    screen: 'Time_projects_landing_page',
    object_detail: 'select_edit_project_dropdown',
    ui_action: 'selected',
    ui_object: 'dropdown',
    ui_object_detail: 'select_edit_project_dropdown',
  },
  SELECT_ASSIGN_WORKERS_PROJECT_DROPDOWN: {
    ...BASE,
    screen: 'Time_projects_landing_page',
    object_detail: 'select_assign_workers_project_dropdown',
    ui_action: 'selected',
    ui_object: 'dropdown',
    ui_object_detail: 'select_assign_workers_project_dropdown',
  },
  SELECT_CSV_EXPORT_PROJECT_DROPDOWN: {
    ...BASE,
    screen: 'Time_projects_landing_page',
    object_detail: 'select_csv_export_project_dropdown',
    ui_action: 'selected',
    ui_object: 'dropdown',
    ui_object_detail: 'select_csv_export_project_dropdown',
  },
} as const;

export const LANDING_PAGE_TRACKING_POINTS: TrackingPoints =
  BASE_LANDING_PAGE_TRACKING_TEMPLATE as TrackingPoints;

// WFS (Workforce Solutions) tracking points with scope: 'time' and scope_area: 'workforce'
export const WFS_LANDING_PAGE_TRACKING_POINTS: TrackingPoints =
  createTrackingPoints(
    'Time_projects_landing_page',
    BASE_LANDING_PAGE_TRACKING_TEMPLATE,
    {},
    { scope: 'time', scope_area: 'workforce' }, // Global override applied to ALL fields
  );

/**
 * Get the appropriate landing page tracking points based on environment
 * @param options - Configuration options
 * @param options.isWorkforce - Whether running in Workforce environment
 * @returns The appropriate TrackingPoints object
 */
export const getLandingPageTrackingPoints = ({
  isWorkforce,
}: {
  isWorkforce: boolean;
}): TrackingPoints => {
  if (isWorkforce) {
    return WFS_LANDING_PAGE_TRACKING_POINTS;
  }

  return LANDING_PAGE_TRACKING_POINTS;
};

// ---------------------------------------------------------------------------
// Assign Workers  (screen: Time_projects_assign_workers)
// ---------------------------------------------------------------------------
// Base tracking template for Assign Workers
const BASE_ASSIGN_WORKERS_TRACKING_TEMPLATE = {
  SEARCH_ASSIGN_WORKERS: {
    ...BASE,
    screen: 'Time_projects_assign_workers',
    object_detail: 'search_assign_workers',
    ui_action: 'clicked',
    ui_object: 'search',
    ui_object_detail: 'search_assign_workers',
  },
  TYPE_SEARCH_ASSIGN_WORKERS: {
    ...BASE,
    screen: 'Time_projects_assign_workers',
    object_detail: 'type_search_assign_workers',
    ui_action: 'typed',
    ui_object: 'search form field',
    ui_object_detail: 'type_search_assign_workers',
  },
  CLICK_ALL_WORKER_DROPDOWN: {
    ...BASE,
    screen: 'Time_projects_assign_workers',
    object_detail: 'click_all_worker_dropdown_assign_workers',
    ui_action: 'clicked',
    ui_object: 'dropdown',
    ui_object_detail: 'click_all_worker_dropdown_assign_workers',
  },
  SELECT_ALL_WORKER_DROPDOWN: {
    ...BASE,
    screen: 'Time_projects_assign_workers',
    object_detail: 'select_all_worker_dropdown_assign_workers',
    ui_action: 'selected',
    ui_object: 'dropdown',
    ui_object_detail: 'select_all_worker_dropdown_assign_workers',
  },
  ENABLE_ALL_WORKER: {
    ...BASE,
    screen: 'Time_projects_assign_workers',
    object_detail: 'enable_all_worker',
    ui_action: 'enabled',
    ui_object: 'checkbox',
    ui_object_detail: 'enable_all_worker',
  },
  DISABLE_ALL_WORKER: {
    ...BASE,
    screen: 'Time_projects_assign_workers',
    object_detail: 'disable_all_worker',
    ui_action: 'disabled',
    ui_object: 'checkbox',
    ui_object_detail: 'disable_all_worker',
  },
  SAVE_ASSIGN_WORKER: {
    ...BASE,
    screen: 'Time_projects_assign_workers',
    object_detail: 'save_assign_worker',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'save_assign_worker',
  },
  CLOSE_ASSIGN_WORKER: {
    ...BASE,
    screen: 'Time_projects_assign_workers',
    object_detail: 'close_assign_worker',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'close_assign_worker',
  },
} as const;

export const ASSIGN_WORKERS_TRACKING_POINTS: TrackingPoints =
  BASE_ASSIGN_WORKERS_TRACKING_TEMPLATE as TrackingPoints;

// WFS (Workforce Solutions) tracking points with scope: 'time' and scope_area: 'workforce'
export const WFS_ASSIGN_WORKERS_TRACKING_POINTS: TrackingPoints =
  createTrackingPoints(
    'Time_projects_assign_workers',
    BASE_ASSIGN_WORKERS_TRACKING_TEMPLATE,
    {},
    { scope: 'time', scope_area: 'workforce' }, // Global override applied to ALL fields
  );

/**
 * Get the appropriate assign workers tracking points based on environment
 * @param options - Configuration options
 * @param options.isWorkforce - Whether running in Workforce environment
 * @returns The appropriate TrackingPoints object
 */
export const getAssignWorkersTrackingPoints = ({
  isWorkforce,
}: {
  isWorkforce: boolean;
}): TrackingPoints => {
  if (isWorkforce) {
    return WFS_ASSIGN_WORKERS_TRACKING_POINTS;
  }

  return ASSIGN_WORKERS_TRACKING_POINTS;
};

// ---------------------------------------------------------------------------
// Details Page  (screen: Time_projects_details_page)
// ---------------------------------------------------------------------------
// Base tracking template for Details Page
const BASE_DETAILS_PAGE_TRACKING_TEMPLATE = {
  CLICK_ASSIGN: {
    ...BASE,
    screen: 'Time_projects_details_page',
    object_detail: 'click_assign',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'click_assign',
  },
  CLICK_ASSIGN_DROPDOWN: {
    ...BASE,
    screen: 'Time_projects_details_page',
    object_detail: 'click_assign_dropdown',
    ui_action: 'clicked',
    ui_object: 'dropdown',
    ui_object_detail: 'click_assign_dropdown',
  },
  CLICK_EDIT_PROJECT: {
    ...BASE,
    screen: 'Time_projects_details_page',
    object_detail: 'click_edit_project',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'click_edit_project',
  },
  CLICK_EDIT_PROJECT_DROPDOWN: {
    ...BASE,
    screen: 'Time_projects_details_page',
    object_detail: 'click_edit_project_dropdown',
    ui_action: 'clicked',
    ui_object: 'dropdown',
    ui_object_detail: 'click_edit_project_dropdown',
  },
  EDIT_ESTIMATION_SUMMARY: {
    ...BASE,
    screen: 'Time_projects_details_page',
    object_detail: 'edit_estimation_summary',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'edit_estimation_summary',
  },
  // The "Edit dates" / "Add dates" link in the date summary card -
  // deep-links into the QBO project details page since the date editor
  // is hosted there, not in this widget.
  EDIT_PROJECT_DATES: {
    ...BASE,
    screen: 'Time_projects_details_page',
    object_detail: 'edit_project_dates',
    ui_action: 'clicked',
    ui_object: 'button link',
    ui_object_detail: 'edit_project_dates',
  },
  CLICK_ESTIMATES_TAB: {
    ...BASE,
    screen: 'Time_projects_details_page',
    object_detail: 'click_estimates_tab',
    ui_action: 'clicked',
    ui_object: 'button tab',
    ui_object_detail: 'click_estimates_tab',
  },
  CLICK_USER_TAB: {
    ...BASE,
    screen: 'Time_projects_details_page',
    object_detail: 'click_user_tab',
    ui_action: 'clicked',
    ui_object: 'button tab',
    ui_object_detail: 'click_user_tab',
  },
  VIEW_WORKERS: {
    ...BASE,
    screen: 'Time_projects_details_page',
    object_detail: 'view_workers',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'view_workers',
  },
  LEFT_PAGINATION_ARROW_ESTIMATES: {
    ...BASE,
    screen: 'Time_projects_details_page',
    object_detail: 'left_pagination_arrow_estimates',
    ui_action: 'clicked',
    ui_object: 'arrow icon',
    ui_object_detail: 'left_pagination_arrow_estimates',
  },
  RIGHT_PAGINATION_ARROW_ESTIMATES: {
    ...BASE,
    screen: 'Time_projects_details_page',
    object_detail: 'right_pagination_arrow_estimates',
    ui_action: 'clicked',
    ui_object: 'arrow icon',
    ui_object_detail: 'right_pagination_arrow_estimates',
  },
  LEFT_PAGINATION_ARROW_USERS: {
    ...BASE,
    screen: 'Time_projects_details_page',
    object_detail: 'left_pagination_arrow_users',
    ui_action: 'clicked',
    ui_object: 'arrow icon',
    ui_object_detail: 'left_pagination_arrow_users',
  },
  RIGHT_PAGINATION_ARROW_USERS: {
    ...BASE,
    screen: 'Time_projects_details_page',
    object_detail: 'right_pagination_arrow_users',
    ui_action: 'clicked',
    ui_object: 'arrow icon',
    ui_object_detail: 'right_pagination_arrow_users',
  },
  CUSTOMER_NAME: {
    ...BASE,
    screen: 'Time_projects_details_page',
    object_detail: 'customer_name',
    ui_action: 'clicked',
    ui_object: 'link',
    ui_object_detail: 'customer_name',
  },
  ENABLE_FAVOURITE_PROJECT: {
    ...BASE,
    screen: 'Time_projects_details_page',
    object_detail: 'enable_favourite_project',
    ui_action: 'selected',
    ui_object: 'star icon',
    ui_object_detail: 'enable_favourite_project',
  },
  DISABLE_FAVOURITE_PROJECT: {
    ...BASE,
    screen: 'Time_projects_details_page',
    object_detail: 'disable_favourite_project',
    ui_action: 'selected',
    ui_object: 'star icon',
    ui_object_detail: 'disable_favourite_project',
  },
  CREATE_ESTIMATE: {
    ...BASE,
    screen: 'Time_projects_details_page',
    object_detail: 'create_estimate',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'create_estimate',
  },
  SELECT_EDIT_ESTIMATE_DROPDOWN: {
    ...BASE,
    screen: 'Time_projects_details_page',
    object_detail: 'click_edit_project_dropdown',
    ui_action: 'clicked',
    ui_object: 'dropdown',
    ui_object_detail: 'click_edit_project_dropdown',
  },
  SELECT_EXPORT_CSV_DROPDOWN: {
    ...BASE,
    screen: 'Time_projects_details_page',
    object_detail: 'click_export_csv_project_dropdown',
    ui_action: 'clicked',
    ui_object: 'dropdown',
    ui_object_detail: 'click_export_csv_project_dropdown',
  },
} as const;

export const DETAILS_PAGE_TRACKING_POINTS: TrackingPoints =
  BASE_DETAILS_PAGE_TRACKING_TEMPLATE as TrackingPoints;

// WFS (Workforce Solutions) tracking points with scope: 'time' and scope_area: 'workforce'
export const WFS_DETAILS_PAGE_TRACKING_POINTS: TrackingPoints =
  createTrackingPoints(
    'Time_projects_details_page',
    BASE_DETAILS_PAGE_TRACKING_TEMPLATE,
    {},
    { scope: 'time', scope_area: 'workforce' }, // Global override applied to ALL fields
  );

/**
 * Get the appropriate details page tracking points based on environment
 * @param options - Configuration options
 * @param options.isWorkforce - Whether running in Workforce environment
 * @returns The appropriate TrackingPoints object
 */
export const getDetailsPageTrackingPoints = ({
  isWorkforce,
}: {
  isWorkforce: boolean;
}): TrackingPoints => {
  if (isWorkforce) {
    return WFS_DETAILS_PAGE_TRACKING_POINTS;
  }

  return DETAILS_PAGE_TRACKING_POINTS;
};

// ---------------------------------------------------------------------------
// Create Estimate  (screen: Time_projects_details_page_create_estimate)
// ---------------------------------------------------------------------------
// Base tracking template for Create Estimate
const BASE_CREATE_ESTIMATE_TRACKING_TEMPLATE = {
  CLICK_CREATE_ESTIMATE_FOR_PROJECT: {
    ...BASE,
    screen: 'Time_projects_landing_page',
    object_detail: 'click_create_estimate_for_project',
    ui_action: 'clicked',
    ui_object: 'button link',
    ui_object_detail: 'click_create_estimate_for_project',
  },
  ENABLE_BY_HOURS: {
    ...BASE,
    screen: 'Time_projects_details_page_create_estimate',
    object_detail: 'enable_by_hours',
    ui_action: 'selected',
    ui_object: 'radio button',
    ui_object_detail: 'enable_by_hours',
  },
  ENABLE_BY_SERVICE_ITEM: {
    ...BASE,
    screen: 'Time_projects_details_page_create_estimate',
    object_detail: 'enable_by_service_item',
    ui_action: 'selected',
    ui_object: 'radio button',
    ui_object_detail: 'enable_by_service_item',
  },
  ENTER_HOURS_WORKED: {
    ...BASE,
    screen: 'Time_projects_details_page_create_estimate',
    object_detail: 'enter_hours_worked',
    ui_action: 'typed',
    ui_object: 'form field',
    ui_object_detail: 'enter_hours_worked',
  },
  SAVE_ESTIMATE: {
    ...BASE,
    screen: 'Time_projects_details_page_create_estimate',
    object_detail: 'save_estimate',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'save_estimate',
  },
  CLOSE_CREATE_ESTIMATE: {
    ...BASE,
    screen: 'Time_projects_details_page_create_estimate',
    object_detail: 'close_create_estimate',
    ui_action: 'clicked',
    ui_object: 'close icon',
    ui_object_detail: 'close_create_estimate',
  },
  CLICK_SERVICE_ITEM_DROPDOWN: {
    ...BASE,
    screen: 'Time_projects_details_page_create_estimate',
    object_detail: 'click_service_item_dropdown',
    ui_action: 'clicked',
    ui_object: 'dropdown',
    ui_object_detail: 'click_service_item_dropdown',
  },
  SELECT_SERVICE_ITEM_DROPDOWN: {
    ...BASE,
    screen: 'Time_projects_details_page_create_estimate',
    object_detail: 'select_service_item_dropdown',
    ui_action: 'clicked',
    ui_object: 'dropdown',
    ui_object_detail: 'select_service_item_dropdown',
  },
  ENTER_SERVICE_HOURS: {
    ...BASE,
    screen: 'Time_projects_details_page_create_estimate',
    object_detail: 'enter_service_hours',
    ui_action: 'typed',
    ui_object: 'form field',
    ui_object_detail: 'enter_service_hours',
  },
  ADD_SERVICE_ITEM_DETAILS: {
    ...BASE,
    screen: 'Time_projects_details_page_create_estimate',
    object_detail: 'add_service_item_details',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'add_service_item_details',
  },
  CLICK_ELLIPSIS_SERVICE_ITEM: {
    ...BASE,
    screen: 'Time_projects_details_page_create_estimate',
    object_detail: 'click_ellipsis_service_item',
    ui_action: 'clicked',
    ui_object: '3 dot ellipsis',
    ui_object_detail: 'click_ellipsis_service_item',
  },
  EDIT_SERVICE_LINE_ITEM: {
    ...BASE,
    screen: 'Time_projects_details_page_create_estimate',
    object_detail: 'edit_service_line_item',
    ui_action: 'clicked',
    ui_object: 'pop up banner',
    ui_object_detail: 'edit_service_line_item',
  },
  SELECT_DELETE_SERVICE_ITEM: {
    ...BASE,
    screen: 'Time_projects_details_page_create_estimate',
    object_detail: 'select_delete_service_item',
    ui_action: 'clicked',
    ui_object: 'pop up banner',
    ui_object_detail: 'select_delete_service_item',
  },
  EDIT_SERVICE_HOURS: {
    ...BASE,
    screen: 'Time_projects_details_page_create_estimate',
    object_detail: 'edit_service_hours',
    ui_action: 'typed',
    ui_object: 'form field',
    ui_object_detail: 'edit_service_hours',
  },
  DELETE_SERVICE_HOURS: {
    ...BASE,
    screen: 'Time_projects_details_page_create_estimate',
    object_detail: 'delete_service_hours',
    ui_action: 'clicked',
    ui_object: 'delete icon',
    ui_object_detail: 'delete_service_hours',
  },
  CHANGE_ESTIMATE_TYPE: {
    ...BASE,
    screen: 'Time_projects_details_page_create_estimate',
    object_detail: 'change_estimate_type',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'change_estimate_type',
  },
  CANCEL_ESTIMATE_TYPE_CHANGE: {
    ...BASE,
    screen: 'Time_projects_details_page_create_estimate',
    object_detail: 'cancel_estimate_type_change',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'cancel_estimate_type_change',
  },
} as const;

export const CREATE_ESTIMATE_TRACKING_POINTS: TrackingPoints =
  BASE_CREATE_ESTIMATE_TRACKING_TEMPLATE as TrackingPoints;

// WFS (Workforce Solutions) tracking points with scope: 'time' and scope_area: 'workforce'
export const WFS_CREATE_ESTIMATE_TRACKING_POINTS: TrackingPoints =
  createTrackingPoints(
    'Time_projects_details_page_create_estimate',
    BASE_CREATE_ESTIMATE_TRACKING_TEMPLATE,
    {},
    { scope: 'time', scope_area: 'workforce' }, // Global override applied to ALL fields
  );

/**
 * Get the appropriate create estimate tracking points based on environment
 * @param options - Configuration options
 * @param options.isWorkforce - Whether running in Workforce environment
 * @returns The appropriate TrackingPoints object
 */
export const getCreateEstimateTrackingPoints = ({
  isWorkforce,
}: {
  isWorkforce: boolean;
}): TrackingPoints => {
  if (isWorkforce) {
    return WFS_CREATE_ESTIMATE_TRACKING_POINTS;
  }

  return CREATE_ESTIMATE_TRACKING_POINTS;
};

// ---------------------------------------------------------------------------
// Posts  (screen: Time_projects_posts)
// ---------------------------------------------------------------------------
// Base tracking template for Posts
const BASE_POSTS_TRACKING_TEMPLATE = {
  CLICK_POSTS_TAB: {
    ...BASE,
    screen: 'Time_projects_posts',
    object_detail: 'post_page',
    ui_action: 'clicked',
    ui_object: 'link',
    ui_object_detail: 'post_page',
  },
  CREATE_POST_BUTTON: {
    ...BASE,
    screen: 'Time_projects_posts',
    object_detail: 'create_post_button',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'create_post_button',
  },
  NEW_POST_BUTTON: {
    ...BASE,
    screen: 'Time_projects_posts',
    object_detail: 'new_post_button',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'new_post_button',
  },
  SEE_REPLIES: {
    ...BASE,
    screen: 'Time_projects_posts',
    object_detail: 'see_replies',
    ui_action: 'clicked',
    ui_object: 'link',
    ui_object_detail: 'see_replies',
  },
  ADD_ATTACHMENT: {
    ...BASE,
    screen: 'Time_projects_posts',
    object_detail: 'add_attachment',
    ui_action: 'clicked',
    ui_object: 'link',
    ui_object_detail: 'add_attachment',
  },
  DELETE_ATTACHMENT: {
    ...BASE,
    screen: 'Time_projects_posts',
    object_detail: 'delete_attachment',
    ui_action: 'clicked',
    ui_object: 'icon',
    ui_object_detail: 'delete_attachment',
  },
  CLICK_POST: {
    ...BASE,
    screen: 'Time_projects_posts',
    object_detail: 'click_post',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'click_post',
  },
  EDIT_POST: {
    ...BASE,
    screen: 'Time_projects_posts',
    object_detail: 'edit_post',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'edit_post',
  },
  DELETE_POST: {
    ...BASE,
    screen: 'Time_projects_posts',
    object_detail: 'delete_post',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'delete_post',
  },
  POST_REPLY_BUTTON: {
    ...BASE,
    screen: 'Time_projects_posts',
    object_detail: 'post_reply_button',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'post_reply_button',
  },
  DELETE_POST_CONFIRM: {
    ...BASE,
    screen: 'Time_projects_posts',
    object_detail: 'delete_post_confirm',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'delete_post_confirm',
  },
  CANCEL_POST_DELETION: {
    ...BASE,
    screen: 'Time_projects_posts',
    object_detail: 'cancel_post_deletion',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'cancel_post_deletion',
  },
} as const;

export const POSTS_TRACKING_POINTS: TrackingPoints =
  BASE_POSTS_TRACKING_TEMPLATE as TrackingPoints;

// WFS (Workforce Solutions) tracking points with scope: 'time' and scope_area: 'workforce'
export const WFS_POSTS_TRACKING_POINTS: TrackingPoints = createTrackingPoints(
  'Time_projects_posts',
  BASE_POSTS_TRACKING_TEMPLATE,
  {},
  { scope: 'time', scope_area: 'workforce' }, // Global override applied to ALL fields
);

/**
 * Get the appropriate Posts tracking points based on environment
 * @param options - Configuration options
 * @param options.isWorkforce - Whether running in Workforce environment
 * @returns The appropriate TrackingPoints object
 */
export const getPostsTrackingPoints = ({
  isWorkforce,
}: {
  isWorkforce: boolean;
}): TrackingPoints => {
  if (isWorkforce) {
    return WFS_POSTS_TRACKING_POINTS;
  }

  return POSTS_TRACKING_POINTS;
};

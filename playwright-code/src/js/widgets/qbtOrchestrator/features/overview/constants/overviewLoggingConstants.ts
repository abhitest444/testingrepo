export const OVERVIEW_LOGGING = {
  FEATURE_MOUNTED: 'overview_feature_mounted',

  FETCH_TASKS_START: 'overview_fetch_tasks_start',
  FETCH_TASKS_SUCCESS: 'overview_fetch_tasks_success',
  FETCH_TASKS_FAILED: 'overview_fetch_tasks_failed',

  UPDATE_TASK_START: 'overview_update_task_start',
  UPDATE_TASK_SUCCESS: 'overview_update_task_success',
  UPDATE_TASK_FAILED: 'overview_update_task_failed',

  APOLLO_CLIENT_NOT_INITIALIZED: 'overview_apollo_client_not_initialized',
  UNKNOWN_FUNCTIONALITY: 'overview_unknown_functionality',
} as const;

// ITM Task Logging Constants (used by widgets that update ITM tasks)
export const ITM_LOGGING = {
  ITM_TASK_UPDATE_SUCCESS: 'ITM_TASK_UPDATE_SUCCESS',
  ITM_TASK_UPDATE_FAILED: 'ITM_TASK_UPDATE_FAILED',
  ITM_TASK_UPDATE_INITIATED: 'ITM_TASK_UPDATE_INITIATED',
} as const;

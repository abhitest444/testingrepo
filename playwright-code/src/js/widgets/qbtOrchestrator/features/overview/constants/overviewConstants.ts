import { TaskManagement_TaskFilter } from 'src/__generated__/oigql/graphql';

export const DEFAULT_ITM_TASKS_FIRST = 50;
export const DEFAULT_ITM_TASKS_AFTER = 0;

export const ITM_REQUEST_HEADERS = {
  intuit_target_domain: 'QB_TIME',
  intuit_target_usecase: 'SETUP',
};

export const DEFAULT_ITM_TASKS_FILTER: TaskManagement_TaskFilter = {
  namespace: {
    in: [
      {
        domain: { equals: 'QB_TIME' },
        useCase: { equals: 'SETUP' },
      },
      {
        domain: { equals: 'QB_TIME' },
        useCase: { equals: 'ONBOARDING' },
      },
    ],
  },
  dueDate: {
    between: {
      minDate: '2025-01-01T00:01:00.23457Z',
      maxDate: '2025-12-31T00:01:00.23457Z',
    },
  },
};

// ITM Task Types
export const ITM_TASK_TYPE_LUNCH_BREAKS = 'time-lunch-breaks';
export const ITM_TASK_TYPE_ASSIGN_TEAM = 'time-assign-team';
export const ITEM_TASK_TYPE_SETUP_TIMESHEET = 'setup-timesheet';

// ITM Task Statuses
export const ITM_TASK_STATUS_OPEN = 'Open';
export const ITM_TASK_STATUS_DONE_YES = 'DoneYes';

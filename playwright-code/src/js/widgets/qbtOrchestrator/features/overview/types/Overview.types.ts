import {
  TaskManagement_Task,
  TaskManagement_UpdateTaskInput,
  TaskManagement_TaskFilter,
  TaskManagement_OrderBy,
  TaskManagement_PriorityType,
  Scalars,
} from 'src/__generated__/oigql/graphql';

export type ItmTask = Pick<
  TaskManagement_Task,
  'id' | 'name' | 'description' | 'status' | 'type' | 'dueDate' | 'priority'
> & {
  references?: Array<{ id: Scalars['Long']['output'] }>;
};

export interface GetTasksParams {
  first: number;
  after: number;
  filter: TaskManagement_TaskFilter;
  orderBy?: TaskManagement_OrderBy[];
}

export interface UpdateTaskParams {
  taskUpdateRequest: TaskManagement_UpdateTaskInput;
}

export interface GetTasksResult {
  tasks: ItmTask[];
  success: boolean;
}

export interface UpdateTaskResult {
  success: boolean;
  message: string;
  code: string;
  task?: {
    id: Scalars['Long']['output'];
    name: string;
  };
}

import { GetTimeTrackingWorkersQuery } from 'src/__generated__/timeTracking/graphql';
import { WorkerType } from '../SearchFilterBar/types';

/**
 * Worker node type extracted from GraphQL query
 */
export type Worker = NonNullable<
  NonNullable<GetTimeTrackingWorkersQuery['timeTrackingWorkers']>['edges']
>[number]['node'];

/**
 * Props for the WorkersTable presentational component
 */
export interface WorkersTableProps {
  workers: Worker[];
  loading: boolean;
  totalCount?: number;
  onViewSettings: (worker: Worker) => void;
  searchText?: string;
  workerType?: WorkerType;
}

/**
 * Props for the WorkersListView container component
 */
export interface WorkersListViewProps {
  searchText?: string;
  workerType?: WorkerType;
  onRefetchAvailable?: (refetch: () => void) => void;
  onLoadingChange?: (isLoading: boolean) => void;
}

import { useMemo, useEffect } from 'react';
import {
  TimeTracking_TimeForType,
  TimeTracking_WorkerOrderBy,
} from 'src/__generated__/timeTracking/graphql';
import { useTimeTrackingWorkers } from 'src/js/service/hooks/groups/useTimeTrackingWorkers';
import { TeamMember } from '../types';
import { useAppDispatch } from '../store/hooks';
import { setTeamMembers } from '../store/workerSlice';

const TT_WORKERS_FILTER = {
  types: [TimeTracking_TimeForType.Employee, TimeTracking_TimeForType.Vendor],
  isTimeTrackingEnabled: true,
  isActive: true,
};

const TT_WORKERS_ORDER_BY = [TimeTracking_WorkerOrderBy.DisplayNameAsc];

export const useTeamMembers = () => {
  const dispatch = useAppDispatch();
  const { workers, loading, loadWorkers } = useTimeTrackingWorkers();

  useEffect(() => {
    loadWorkers({
      first: 200,
      filter: TT_WORKERS_FILTER,
      orderBy: TT_WORKERS_ORDER_BY,
    });
  }, [loadWorkers]);

  const teamMembers: TeamMember[] = useMemo(
    () =>
      workers.map((w) => ({
        id: w.id,
        name: w.displayName || w.firstName || '',
        workerType:
          w.type === TimeTracking_TimeForType.Employee ? 'Employee' : 'Vendor',
      })),
    [workers],
  );

  useEffect(() => {
    if (teamMembers.length > 0) {
      dispatch(setTeamMembers(teamMembers));
    }
  }, [teamMembers, dispatch]);

  return {
    teamMembers,
    loading,
    loadTeamMembers: () =>
      loadWorkers({
        first: 200,
        filter: TT_WORKERS_FILTER,
        orderBy: TT_WORKERS_ORDER_BY,
      }),
  };
};

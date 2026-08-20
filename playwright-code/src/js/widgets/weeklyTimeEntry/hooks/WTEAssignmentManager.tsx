import React from 'react';
import { useAppSelector } from '../store';
import { selectTeamMember, selectCustomFields } from '../store/selectors';
import { useWTEGlobalOptions } from './useWTEGlobalOptions';
import { WTEAssignmentManager as WTECustomerAssignmentManager } from './useWTEAssignmentManager';

/**
 * WTE Assignment Manager Component
 *
 * Orchestrates assignment fetching for WTE:
 * 1. Global CF (team member only, no customer) - useWTEGlobalOptions runs
 *    one CF call with input { customerId: null, projectId: null } for worker-only baseline.
 * 2. Per-customer SF/CF/CFO (when customer selected in any row) -
 *    useWTEAssignmentManager runs CF/SF/CFO with customerId/projectId for each entity.
 *
 * Service/Class/Location options (SFO) are handled by QuickFind, not here.
 *
 * This component should be rendered once at the WTE widget level.
 */
export const WTEAssignmentManager: React.FC<{
  children?: React.ReactNode;
}> = ({ children }) => {
  const teamMember = useAppSelector(selectTeamMember);
  const allCustomFields = useAppSelector(selectCustomFields);

  const workerId = teamMember?.id || null;

  useWTEGlobalOptions({
    workerId,
    allCustomFields: allCustomFields || [],
  });

  return (
    <>
      <WTECustomerAssignmentManager />
      {children}
    </>
  );
};

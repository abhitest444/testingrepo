import React, { createContext, useContext, useMemo } from 'react';
import { useWTETimeAgainstAssignmentsFetch } from '../hooks/useWTETimeAgainstAssignmentsFetch';

interface WTEAssignmentsContextValue {
  loadMore: () => void;
  hasMore: boolean;
}

const WTEAssignmentsContext = createContext<WTEAssignmentsContextValue | null>(
  null,
);

export const WTEAssignmentsProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  // Fetch time-against assignments (customer/project list) once when worker is set or changes;
  // result is stored in Redux so the time category dropdown uses it instead of calling API on every open.
  const { loadMore, hasMore } = useWTETimeAgainstAssignmentsFetch();
  const value = useMemo(() => ({ loadMore, hasMore }), [loadMore, hasMore]);

  return (
    <WTEAssignmentsContext.Provider value={value}>
      {children}
    </WTEAssignmentsContext.Provider>
  );
};

export const useWTEAssignments = (): WTEAssignmentsContextValue | null =>
  useContext(WTEAssignmentsContext);

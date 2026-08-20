import React, { createContext, useContext, useMemo } from 'react';
import { ApolloClient, ApolloProvider } from '@apollo/client';
import { Sandbox } from 'src/js/common/sandbox';
import { getWeeklyTimeEntryApolloClient } from '../utils/WeeklyTimeEntryApolloClient';

interface WeeklyTimeEntryApolloContextType {
  weeklyClient: ApolloClient<any>;
  sandbox: Sandbox;
}

const WeeklyTimeEntryApolloContext =
  createContext<WeeklyTimeEntryApolloContextType | null>(null);

interface WeeklyTimeEntryApolloProviderProps {
  children: React.ReactNode;
  sandbox: Sandbox;
}

export const WeeklyTimeEntryApolloProvider: React.FC<
  WeeklyTimeEntryApolloProviderProps
> = ({ children, sandbox }) => {
  // Memoize the client to prevent unnecessary re-creations
  const weeklyClient = useMemo(
    () => getWeeklyTimeEntryApolloClient(sandbox),
    [sandbox],
  );

  const contextValue = useMemo(
    () => ({
      weeklyClient,
      sandbox,
    }),
    [weeklyClient, sandbox],
  );

  return (
    <WeeklyTimeEntryApolloContext.Provider value={contextValue}>
      <ApolloProvider client={weeklyClient}>{children}</ApolloProvider>
    </WeeklyTimeEntryApolloContext.Provider>
  );
};

// Custom hook to use the weekly time entry Apollo client
export const useWeeklyTimeEntryApollo =
  (): WeeklyTimeEntryApolloContextType => {
    const context = useContext(WeeklyTimeEntryApolloContext);

    if (!context) {
      throw new Error(
        'useWeeklyTimeEntryApollo must be used within a WeeklyTimeEntryApolloProvider',
      );
    }

    return context;
  };

// Hook to get just the client for direct usage
export const useWeeklyTimeEntryClient = (): ApolloClient<any> => {
  const { weeklyClient } = useWeeklyTimeEntryApollo();
  return weeklyClient;
};

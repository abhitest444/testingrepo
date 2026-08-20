import React, { createContext, useContext, useMemo } from 'react';
import { useQbTimeSdk } from 'src/js/service/hooks/useQbTimeSdk';
import { useTimeProjectLogger } from '../utils/timeProjectLogging';

interface ProjectsSdkFlags {
  isProjectsManageProjectsEnabled?: boolean;
  isProjectsAssignWorkersEnabled?: boolean;
  isProjectsEditEstimatesEnabled?: boolean;
  isProjectsEditDateEnabled?: boolean;
}

interface ProjectsSdkFlagsContextValue extends ProjectsSdkFlags {
  loading: boolean;
  error: Error | undefined;
}

const ProjectsSdkFlagsContext =
  createContext<ProjectsSdkFlagsContextValue | null>(null);

export const ProjectsSdkFlagsProvider: React.FC<{
  children?: React.ReactNode;
}> = ({ children }) => {
  const logger = useTimeProjectLogger();
  const { data, loading, error } = useQbTimeSdk<ProjectsSdkFlags>(
    (sdk) => async () => {
      const flagLookups = [
        {
          name: 'isProjectsManageProjectsEnabled',
          run: () => Promise.resolve(sdk.isProjectsManageProjectsEnabled()),
        },
        {
          name: 'isProjectsAssignWorkersEnabled',
          run: () => Promise.resolve(sdk.isProjectsAssignWorkersEnabled()),
        },
        {
          name: 'isProjectsEditEstimatesEnabled',
          run: () => Promise.resolve(sdk.isProjectsEditEstimatesEnabled()),
        },
        {
          name: 'isProjectsEditDateEnabled',
          run: () => Promise.resolve(sdk.isProjectsEditDateEnabled()),
        },
      ] as const;

      const results = await Promise.allSettled(
        flagLookups.map((flag) => flag.run()),
      );

      results.forEach((result, idx) => {
        if (result.status === 'rejected') {
          const { reason } = result;
          logger.error(
            'Component=useProjectsSdkFlags Event=SDK Flag Lookup Failed',
            {
              flagName: flagLookups[idx].name,
              errorMessage:
                reason instanceof Error ? reason.message : String(reason),
              errorName: reason instanceof Error ? reason.name : undefined,
            },
          );
        }
      });

      const [
        isProjectsManageProjectsEnabled,
        isProjectsAssignWorkersEnabled,
        isProjectsEditEstimatesEnabled,
        isProjectsEditDateEnabled,
      ] = results.map((result) =>
        result.status === 'fulfilled' ? result.value : undefined,
      );

      return {
        isProjectsManageProjectsEnabled,
        isProjectsAssignWorkersEnabled,
        isProjectsEditEstimatesEnabled,
        isProjectsEditDateEnabled,
      };
    },
    { executeOnMount: true },
  );

  const value = useMemo(
    () => ({
      isProjectsManageProjectsEnabled: data?.isProjectsManageProjectsEnabled,
      isProjectsAssignWorkersEnabled: data?.isProjectsAssignWorkersEnabled,
      isProjectsEditEstimatesEnabled: data?.isProjectsEditEstimatesEnabled,
      isProjectsEditDateEnabled: data?.isProjectsEditDateEnabled,
      loading,
      error,
    }),
    [data, loading, error],
  );

  return (
    <ProjectsSdkFlagsContext.Provider value={value}>
      {children}
    </ProjectsSdkFlagsContext.Provider>
  );
};

export const useProjectsSdkFlags = (): ProjectsSdkFlagsContextValue => {
  const context = useContext(ProjectsSdkFlagsContext);
  if (!context) {
    throw new Error(
      'useProjectsSdkFlags must be used within ProjectsSdkFlagsProvider',
    );
  }
  return context;
};

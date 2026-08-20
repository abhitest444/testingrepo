import React, { createContext, useContext } from 'react';

interface WeeklyImportExperimentState {
  showImportCTA: boolean;
  treatmentKey: string | undefined;
}

const WeeklyImportExperimentContext =
  createContext<WeeklyImportExperimentState>({
    showImportCTA: false,
    treatmentKey: undefined,
  });

export const WeeklyImportExperimentProvider: React.FC<
  WeeklyImportExperimentState & { children: React.ReactNode }
> = ({ showImportCTA, treatmentKey, children }) => (
  <WeeklyImportExperimentContext.Provider
    value={{ showImportCTA, treatmentKey }}
  >
    {children}
  </WeeklyImportExperimentContext.Provider>
);

export const useWeeklyImportExperiment = (): WeeklyImportExperimentState =>
  useContext(WeeklyImportExperimentContext);

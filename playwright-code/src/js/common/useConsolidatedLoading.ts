import { useEffect, useState } from 'react';

/**
 * Allows for consolidated loading state to be set ONCE.
 * Will first wait for all dependency states to be false,
 * subsequent dependency updates will not change consolidated loading state.
 *
 * @param loadingStates list of booleans
 * @returns consolidated loading state
 */
export const useConsolidatedLoading = (loadingStates: boolean[]): boolean => {
  const [consolidatedPageLoading, setConsolidatedPageLoading] = useState(true);

  useEffect(() => {
    if (
      consolidatedPageLoading &&
      loadingStates.every((isLoading) => !isLoading)
    ) {
      setConsolidatedPageLoading(false);
    }
  }, [loadingStates, consolidatedPageLoading]);

  return consolidatedPageLoading;
};

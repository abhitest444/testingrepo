import { useEffect, useState } from 'react';
import { useSandbox } from '@payroll/quicksand';
import { useQbTimeSdk } from 'src/js/service/hooks/useQbTimeSdk';

export const useNttfEligibility = () => {
  const sandbox = useSandbox();
  const { logger } = sandbox;
  const [isNttfEligible, setIsNttfEligible] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const { execute } = useQbTimeSdk<boolean>((sdk) => sdk.isNTTFEligible);

  const fetchEligibility = async () => {
    try {
      const result = await execute();
      const eligibility = result ?? false;

      // Batch state updates to minimize re-renders
      setIsNttfEligible(eligibility);
      setLoading(false);

      logger.info('useNttfEligibility: NTTF eligibility check completed', {
        isEligible: eligibility,
        rawResult: result,
      });
    } catch (error) {
      logger.error('useNttfEligibility: NTTF eligibility check failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      // Batch state updates on error too
      setIsNttfEligible(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    logger.info(
      'useNttfEligibility: Hook initialized, fetching eligibility on mount',
    );
    fetchEligibility();
  }, []); // Empty dependency array - only run once on mount

  const refetch = async () => {
    logger.info('useNttfEligibility: Manual refetch requested');
    await fetchEligibility();
  };

  return {
    isNttfEligible,
    loading,
    refetch,
  };
};

import { useEffect, useState } from 'react';
import { useSandbox } from '@payroll/quicksand';
import { getSandbox } from '@appfabric/plugin-utils/lib/plugin/sandbox';

interface GetVariabilityResultData {
  value: boolean;
}

interface GetVariabilityResult {
  loading: boolean;
  data: GetVariabilityResultData;
  error?: Error;
}

interface UseGetVariabilityProps {
  decision: string;
}

export const useVariability = ({
  decision,
}: UseGetVariabilityProps): GetVariabilityResult => {
  const sandbox = useSandbox();

  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<GetVariabilityResultData>({ value: false });
  const [error, setError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    const fetchVariabilityDecision = async () => {
      try {
        const result = await sandbox.variability.fetchVariabilityDecision(
          decision,
        );

        if (result?.error) {
          setError(result.error);
        } else {
          setData(result);
        }
      } catch (err) {
        // @ts-ignore
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchVariabilityDecision();
  }, []);

  return { loading, data, error };
};

export const getVariabilityFFResult = (feature: string) => {
  const sandbox = getSandbox();
  return sandbox?.featureFlags?.isFeatureEnabled(feature);
};

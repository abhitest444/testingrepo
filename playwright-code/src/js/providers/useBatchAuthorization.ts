import { Decision } from '@appfabric/sandbox-spec';
import { AuthorizationRequest, useSandbox } from '@payroll/quicksand';
import React, { useEffect } from 'react';
import { useADS } from 'src/js/providers/ADSProvider';

const useBatchAuthorization = (authzRequests: AuthorizationRequest[]) => {
  const sandbox = useSandbox();
  const { getBatchADSDecision } = useADS();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | undefined>(undefined);
  const [decisions, setDecisions] = React.useState<Decision[]>([]);

  useEffect(() => {
    const getDecision = async () => {
      try {
        setLoading(true);
        const decisions = await getBatchADSDecision(sandbox, {
          batchRequest: authzRequests,
        });
        setDecisions(decisions);
      } catch (error) {
        setError(error as Error);
      } finally {
        setLoading(false);
      }
    };
    getDecision();
  }, [sandbox, getBatchADSDecision]);
  return {
    loading,
    error,
    decisions,
  };
};

export default useBatchAuthorization;

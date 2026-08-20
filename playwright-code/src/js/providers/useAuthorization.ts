import { Decision } from '@appfabric/sandbox-spec';
import { AuthorizationRequest, useSandbox } from '@payroll/quicksand';
import React, { useEffect } from 'react';
import { useADS } from 'src/js/providers/ADSProvider';

const useAuthorization = (authzRequest: AuthorizationRequest) => {
  const sandbox = useSandbox();
  const { getADSDecision } = useADS();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | undefined>(undefined);
  const [decision, setDecision] = React.useState<Decision | undefined>(
    undefined,
  );

  useEffect(() => {
    const getDecision = async () => {
      try {
        const { resource, action, subject, environment } = authzRequest;
        setLoading(true);
        const decision = await getADSDecision(
          sandbox,
          resource,
          action,
          subject,
          environment,
        );
        setDecision(decision);
      } catch (error) {
        setError(error as Error);
      } finally {
        setLoading(false);
      }
    };
    getDecision();
  }, [sandbox, getADSDecision]);
  return {
    loading,
    error,
    decision,
  };
};

export default useAuthorization;

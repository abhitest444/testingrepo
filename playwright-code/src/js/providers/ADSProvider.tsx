import { Decision } from '@appfabric/sandbox-spec';
import { AuthorizationRequest, useSandbox } from '@payroll/quicksand';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react';
import { Sandbox } from 'src/js/common/sandbox';

type AdsRecord = Record<string, string>;
type DecisionMap = Record<string, Decision>;

interface ADSContextType {
  decisionMap: DecisionMap;
  getADSDecision: (
    sandbox: Sandbox,
    resource: AdsRecord,
    action?: AdsRecord,
    subject?: AdsRecord,
    env?: AdsRecord,
  ) => Promise<Decision>;
  getBatchADSDecision: (
    sandbox: Sandbox,
    payload: { batchRequest: AuthorizationRequest[] },
  ) => Promise<Decision[]>;
}

const defaultADSContext: ADSContextType = {
  decisionMap: {},
  getADSDecision: async () => {
    throw new Error('getADSDecision is not implemented');
  },
  getBatchADSDecision: async () => {
    throw new Error('getBatchADSDecision is not implemented');
  },
};

const ADSContext = createContext<ADSContextType>(defaultADSContext);

export const useADS = () => useContext(ADSContext);

const createCacheKey = (
  resource: AdsRecord,
  action?: AdsRecord,
  subject?: AdsRecord,
  env?: AdsRecord,
) => {
  const resourceKey = Object.keys(resource)
    .map((key) => `${key}:${resource[key]}`)
    .join('|');
  const actionKey = action
    ? Object.keys(action)
        .map((key) => `${key}:${action[key]}`)
        .join('|')
    : '';
  const subjectKey = subject
    ? Object.keys(subject)
        .map((key) => `${key}:${subject[key]}`)
        .join('|')
    : '';
  const envKey = env
    ? Object.keys(env)
        .map((key) => `${key}:${env[key]}`)
        .join('|')
    : '';
  return `${resourceKey}|${actionKey}|${subjectKey}|${envKey}`;
};

const getFilteredBatchRequest = (
  batchRequest: AuthorizationRequest[],
  decisionMap: DecisionMap,
): {
  filteredBatchRequest: AuthorizationRequest[];
  cachedDecisions: Decision[];
} => {
  const cachedDecisions: Decision[] = [];
  const filteredBatchRequest = batchRequest.filter((request, index) => {
    const cacheKey = createCacheKey(
      request.resource,
      request.action,
      request.subject,
      request.environment,
    );
    if (cacheKey in decisionMap) {
      cachedDecisions[index] = decisionMap[cacheKey];
      return false; // Exclude from batch request
    }
    return true; // Include in batch request
  });
  return { filteredBatchRequest, cachedDecisions };
};

const ADSProvider: React.FC = ({ children }) => {
  const AdsMapRef = useRef<DecisionMap>({});

  const getADSDecision = useCallback(
    async (
      sandbox: Sandbox,
      resource: AdsRecord,
      action?: AdsRecord,
      subject?: AdsRecord,
      env?: AdsRecord,
    ): Promise<Decision> => {
      const cacheKey = createCacheKey(resource, action, subject, env);
      if (cacheKey in AdsMapRef.current) {
        return AdsMapRef.current[cacheKey];
      }
      const decision = await sandbox.authorization.isAuthorized(
        resource,
        action,
        subject,
        env,
      );
      AdsMapRef.current[cacheKey] = decision;
      return decision;
    },
    [AdsMapRef],
  );

  const getBatchADSDecision = useCallback(
    async (
      sandbox: Sandbox,
      payload: { batchRequest: AuthorizationRequest[] },
    ) => {
      const batchRequest = payload.batchRequest.map((request) => {
        const { resource, action, subject, environment } = request;
        return {
          resource,
          action,
          subject,
          environment,
        };
      });

      const { filteredBatchRequest, cachedDecisions } = getFilteredBatchRequest(
        payload.batchRequest,
        AdsMapRef.current,
      );

      if (filteredBatchRequest.length === 0) {
        return cachedDecisions;
      }
      const decisions = await sandbox.authorization.isAuthorizedBatch({
        batchRequest,
      });

      decisions.forEach((decision, index) => {
        const request = payload.batchRequest[index];
        const cacheKey = createCacheKey(
          request.resource,
          request.action,
          request.subject,
          request.environment,
        );
        AdsMapRef.current[cacheKey] = decision;
      });
      return decisions;
    },
    [],
  );

  const context = React.useMemo(
    () => ({
      decisionMap: AdsMapRef.current,
      getADSDecision,
      getBatchADSDecision,
    }),
    [getADSDecision],
  );

  return <ADSContext.Provider value={context}>{children}</ADSContext.Provider>;
};

export default ADSProvider;

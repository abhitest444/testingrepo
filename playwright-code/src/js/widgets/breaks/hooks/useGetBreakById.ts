import { useSandbox } from '@payroll/quicksand';
import { useCallback } from 'react';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import { useGetEmployerBreaksLazyQuery } from 'src/__generated__/oigql/graphql';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import { BreakRule } from '../types';
import { BREAK_LOGGING_CONSTANTS } from '../constants';

export default function useGetBreakById() {
  const [getBreakById] = useGetEmployerBreaksLazyQuery({
    fetchPolicy: 'cache-and-network',
  });
  const sandbox = useSandbox();
  const logger = useLoggingConfig();

  // Callback handlers for getBreakById
  const handleGetBreakByIdCompleted = useCallback(
    (data: any, breakId: string) => {
      if (data?.payrollEmployerBreaks?.nodes) {
        const breakRule = data.payrollEmployerBreaks.nodes[0] as
          | BreakRule
          | undefined;
        endInteractionWithSuccess(
          sandbox,
          TimeCustomerInteraction.BREAK_RULE_READ,
        );

        logger.info(BREAK_LOGGING_CONSTANTS.SUCCESS.GET_ALL_BREAKS_SUCCESS, {
          breakId,
          found: !!breakRule,
        });

        return breakRule;
      }
      return undefined;
    },
    [sandbox, logger],
  );

  const handleGetBreakByIdError = useCallback(
    (error: any, breakId: string) => {
      endInteractionWithFailure(
        sandbox,
        TimeCustomerInteraction.BREAK_RULE_READ,
        error.message,
      );

      if (error instanceof Error) {
        logger.logException(
          BREAK_LOGGING_CONSTANTS.API_ERRORS.GET_ALL_BREAKS_FAILED,
          error,
          {
            breakId,
          },
        );
      } else {
        logger.error(BREAK_LOGGING_CONSTANTS.API_ERRORS.GET_ALL_BREAKS_FAILED, {
          breakId,
          error: error.message,
          code: error.code,
          response: error,
        });
      }

      throw error;
    },
    [sandbox, logger],
  );

  const getBreakByIdPolicy = useCallback(
    async (
      breakId: string,
      includeDeleted?: boolean,
    ): Promise<BreakRule | undefined> => {
      createCustomerInteraction(
        sandbox,
        TimeCustomerInteraction.BREAK_RULE_READ,
      );

      return new Promise((resolve, reject) => {
        getBreakById({
          variables: {
            filter: {
              ids: [breakId],
              includeDeleted,
            },
          },
          context: {
            clientName: ApolloClientNames.OIGQL,
            headers: getCustomerInteractionPropagationHeaders(
              sandbox,
              TimeCustomerInteraction.BREAK_RULE_READ,
            ),
          },
          onCompleted: (data) => {
            try {
              const result = handleGetBreakByIdCompleted(data, breakId);
              resolve(result);
            } catch (error) {
              reject(error);
            }
          },
          onError: (error) => {
            try {
              handleGetBreakByIdError(error, breakId);
            } catch (handledError) {
              reject(handledError);
            }
          },
        });
      });
    },
    [
      getBreakById,
      sandbox,
      handleGetBreakByIdCompleted,
      handleGetBreakByIdError,
    ],
  );

  return {
    getBreakByIdPolicy,
  };
}

import { useEffect, useMemo } from 'react';
import { useSandbox } from '@payroll/quicksand';
import { useGetEmployerBreaksByAssigneeLazyQuery } from 'src/__generated__/oigql/graphql';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import {
  createCustomerInteraction,
  endInteractionWithSuccess,
  endInteractionWithFailure,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import { useAppDispatch, useAppSelector } from '../store';
import { setBreaks, setLoading, setError } from '../store/breaksSlice';
import { WEEKLY_TIME_ENTRY_LOGGING_CONSTANTS } from '../utils/constants';
import { selectTeamMember } from '../store/selectors';

export const useBreaksDataFetching = () => {
  const dispatch = useAppDispatch();
  const sandbox = useSandbox();
  const teamMember = useAppSelector(selectTeamMember);

  // Fetch breaks data
  const [getBreaks, { loading, error }] =
    useGetEmployerBreaksByAssigneeLazyQuery({
      fetchPolicy: 'cache-and-network',
    });

  // Get the nameId for the API call (only when we should fetch)
  const nameId = useMemo(() => (teamMember ? teamMember.id : ''), [teamMember]);

  // Load breaks data on mount
  useEffect(() => {
    const loadBreaks = async () => {
      createCustomerInteraction(
        sandbox,
        TimeCustomerInteraction.BREAK_RULE_READ,
      );
      dispatch(setLoading(true));

      try {
        const result = await getBreaks({
          context: {
            clientName: ApolloClientNames.OIGQL,
            headers: getCustomerInteractionPropagationHeaders(
              sandbox,
              TimeCustomerInteraction.BREAK_RULE_READ,
            ),
          },
          variables: {
            filter: {
              assigneeId: nameId,
            },
          },
        });
        if (result.data?.payrollEmployerBreaksByAssigneeId?.nodes) {
          const breaks = result.data.payrollEmployerBreaksByAssigneeId.nodes
            .map((node: any) => ({
              id: node.id,
              breakName: node.breakName,
              isActive: node.isActive,
              breakType: node.breakType,
              allowManual: node.allowManual,
              allowAuto: node.allowAuto,
              noSetDuration: node.noSetDuration,
              breakDuration: node.breakDuration,
              durationUnit: node.durationUnit,
              isDeleted: node.isDeleted,
              isDefaultPolicy: node.isDefaultPolicy,
              activeBreakAssignmentCount: node.activeBreakAssignmentCount,
              manualRule: node.manualRule,
              autoRule: node.autoRule,
            }))
            .filter(
              (breakItem) =>
                breakItem.allowManual === true && breakItem.isActive === true,
            );

          dispatch(setBreaks(breaks));
          sandbox.logger.info(
            WEEKLY_TIME_ENTRY_LOGGING_CONSTANTS.SUCCESS
              .BREAKS_DATA_FETCH_SUCCESS,
          );

          endInteractionWithSuccess(
            sandbox,
            TimeCustomerInteraction.BREAK_RULE_READ,
          );
        }
      } catch (error: any) {
        const errorMessage = error?.message || 'Failed to load breaks';

        sandbox.logger.error(
          WEEKLY_TIME_ENTRY_LOGGING_CONSTANTS.ERRORS.BREAKS_DATA_LOAD_FAILED,
          {
            errorMessage,
          },
        );
        dispatch(setError(errorMessage));
        endInteractionWithFailure(
          sandbox,
          TimeCustomerInteraction.BREAK_RULE_READ,
          errorMessage,
        );
      } finally {
        dispatch(setLoading(false));
      }
    };

    loadBreaks();
  }, [getBreaks, sandbox, dispatch, nameId]);

  return { loading, error };
};

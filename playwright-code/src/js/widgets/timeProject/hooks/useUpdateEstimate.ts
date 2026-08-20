import { useCallback } from 'react';
import { useMutation } from '@apollo/client';
import {
  TimeCustomerInteraction,
  getCustomerInteractionPropagationHeaders,
} from 'src/js/common/CustomerInteraction';
import { useAppDispatch, useAppSelector } from '../store';
import {
  useTimeProjectLogger,
  useTimeProjectSandbox,
  withLoggedOperation,
} from '../utils/timeProjectLogging';
import { TIME_PROJECT_LOGGING_CONSTANTS } from '../constants';
import {
  setSaving,
  setSaveError,
  setSaveSuccess,
} from '../store/estimateDrawerSlice';
import { UPDATE_PROJECT_ESTIMATE } from '../graphql/mutations';
import { EstimateType, ServiceItemEstimateRow } from '../types';

interface UpdateEstimateOptions {
  projectId: string;
  rows?: ServiceItemEstimateRow[];
}

export const useUpdateEstimate = () => {
  const logger = useTimeProjectLogger();
  const sandbox = useTimeProjectSandbox();
  const dispatch = useAppDispatch();
  const { hoursValue, estimateType, serviceItemRows } = useAppSelector(
    (state) => state.estimateDrawer,
  );

  const [updateEstimateMutation] = useMutation(UPDATE_PROJECT_ESTIMATE);

  const updateEstimate = useCallback(
    async ({ projectId, rows }: UpdateEstimateOptions) => {
      const effectiveRows = rows ?? serviceItemRows;

      dispatch(setSaving(true));
      dispatch(setSaveError(null));

      try {
        let input: Record<string, any>;

        if (estimateType === EstimateType.TOTAL_HOURS) {
          input = {
            projectId,
            totalEstimatedSeconds: Number(hoursValue) * 3600,
          };
        } else {
          input = {
            projectId,
            fieldOptionEstimates: effectiveRows.map((row) => ({
              fieldOptionId: row.serviceItemId,
              estimatedSeconds: row.estimatedHours * 3600,
            })),
          };
        }

        const { data } = await withLoggedOperation({
          logger,
          sandbox,
          interactionName: TimeCustomerInteraction.TIME_PROJECT_ESTIMATE_UPDATE,
          event: {
            start:
              TIME_PROJECT_LOGGING_CONSTANTS.MUTATIONS.ESTIMATE_UPDATE_START,
            success:
              TIME_PROJECT_LOGGING_CONSTANTS.MUTATIONS.ESTIMATE_UPDATE_SUCCESS,
            failure:
              TIME_PROJECT_LOGGING_CONSTANTS.MUTATIONS.ESTIMATE_UPDATE_FAILURE,
          },
          extraProps: {
            projectId,
            estimateType,
            serviceItemCount:
              estimateType === EstimateType.TOTAL_HOURS
                ? 0
                : effectiveRows.length,
          },
          isFailure: (res) => {
            const r = res.data?.timeTrackingUpdateProjectEstimate;
            if (r?.errorCode) return r.errorCode;
            if (r?.successCode !== 'SUCCESS') return 'NO_SUCCESS_CODE';
            return null;
          },
          run: () =>
            updateEstimateMutation({
              variables: { input },
              context: {
                headers: sandbox
                  ? getCustomerInteractionPropagationHeaders(
                      sandbox,
                      TimeCustomerInteraction.TIME_PROJECT_ESTIMATE_UPDATE,
                    )
                  : undefined,
              },
            }),
        });

        const result = data?.timeTrackingUpdateProjectEstimate;

        if (result?.successCode === 'SUCCESS') {
          dispatch(setSaveSuccess(true));
          return true;
        }

        // Always surface a generic message - never leak backend errors.
        dispatch(setSaveError('timeProject.estimate.error.generic'));
        return false;
      } catch {
        dispatch(setSaveError('timeProject.estimate.error.generic'));
        return false;
      } finally {
        // See `useCreateEstimate.saveEstimate`: always release the
        // saving flag so the drawer becomes interactive again on
        // failure. On success the drawer's local `isFinalizing` state
        // bridges the spinner across the parent refetch before the
        // drawer unmounts.
        dispatch(setSaving(false));
      }
    },
    [
      hoursValue,
      estimateType,
      serviceItemRows,
      updateEstimateMutation,
      dispatch,
      logger,
      sandbox,
    ],
  );

  return { updateEstimate };
};

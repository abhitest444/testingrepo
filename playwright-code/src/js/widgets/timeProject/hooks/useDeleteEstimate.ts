import { useCallback } from 'react';
import { useMutation } from '@apollo/client';
import {
  TimeCustomerInteraction,
  getCustomerInteractionPropagationHeaders,
} from 'src/js/common/CustomerInteraction';
import { useAppDispatch } from '../store';
import { setSaveError, setSaving } from '../store/estimateDrawerSlice';
import { DELETE_PROJECT_ESTIMATE } from '../graphql/mutations';
import {
  useTimeProjectLogger,
  useTimeProjectSandbox,
  withLoggedOperation,
} from '../utils/timeProjectLogging';
import { TIME_PROJECT_LOGGING_CONSTANTS } from '../constants';

export const useDeleteEstimate = () => {
  const logger = useTimeProjectLogger();
  const sandbox = useTimeProjectSandbox();
  const dispatch = useAppDispatch();

  const [deleteEstimateMutation] = useMutation(DELETE_PROJECT_ESTIMATE);

  const deleteEstimate = useCallback(
    async (projectId: string) => {
      // Drive the same saving spinner the create / update mutations
      // use so the user sees a single continuous loading state for
      // the change-type flow (delete + create) and the empty-
      // service-items "save deletes the estimate" path.
      dispatch(setSaving(true));
      dispatch(setSaveError(null));
      try {
        const { data } = await withLoggedOperation({
          logger,
          sandbox,
          interactionName: TimeCustomerInteraction.TIME_PROJECT_ESTIMATE_DELETE,
          event: {
            start:
              TIME_PROJECT_LOGGING_CONSTANTS.MUTATIONS.ESTIMATE_DELETE_START,
            success:
              TIME_PROJECT_LOGGING_CONSTANTS.MUTATIONS.ESTIMATE_DELETE_SUCCESS,
            failure:
              TIME_PROJECT_LOGGING_CONSTANTS.MUTATIONS.ESTIMATE_DELETE_FAILURE,
          },
          extraProps: { projectId },
          isFailure: (res) => {
            const r = res.data?.timeTrackingDeleteProjectEstimate;
            if (r?.errorCode) return r.errorCode;
            if (r?.successCode !== 'SUCCESS') return 'NO_SUCCESS_CODE';
            return null;
          },
          run: () =>
            deleteEstimateMutation({
              variables: { input: { projectId } },
              context: {
                headers: sandbox
                  ? getCustomerInteractionPropagationHeaders(
                      sandbox,
                      TimeCustomerInteraction.TIME_PROJECT_ESTIMATE_DELETE,
                    )
                  : undefined,
              },
            }),
        });

        const result = data?.timeTrackingDeleteProjectEstimate;

        if (result?.successCode === 'SUCCESS') {
          return true;
        }

        // Always surface a generic message - never leak backend errors.
        dispatch(setSaveError('timeProject.estimate.error.generic'));
        return false;
      } catch {
        dispatch(setSaveError('timeProject.estimate.error.generic'));
        return false;
      } finally {
        // Mirror the create / update hooks: always release saving so
        // the drawer becomes interactive again on failure. The
        // change-type flow (`handleTypeChangeContinue`) immediately
        // calls `saveEstimate` after a successful delete, which
        // re-flips saving back to true so the user sees one
        // continuous spinner.
        dispatch(setSaving(false));
      }
    },
    [deleteEstimateMutation, dispatch, logger, sandbox],
  );

  return { deleteEstimate };
};

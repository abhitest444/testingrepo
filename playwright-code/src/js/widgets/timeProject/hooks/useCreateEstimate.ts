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
import {
  MAX_ESTIMATE_HOURS,
  TIME_PROJECT_LOGGING_CONSTANTS,
} from '../constants';
import {
  setHoursValue,
  setInputError,
  setEstimateType as setEstimateTypeAction,
  setSaving,
  setSaveError,
  setSaveSuccess,
  setSelectedServiceItemId,
  setServiceItemHoursValue,
  setServiceItemInputError,
  addServiceItemRow,
  removeServiceItemRow,
  updateServiceItemRowHours,
  prefillEstimateDrawer,
  resetEstimateDrawer,
} from '../store/estimateDrawerSlice';
import { CREATE_PROJECT_ESTIMATE } from '../graphql/mutations';
import {
  EstimateType,
  ProjectEstimateData,
  ServiceItemEstimateRow,
} from '../types';

export const useCreateEstimate = () => {
  const logger = useTimeProjectLogger();
  const sandbox = useTimeProjectSandbox();
  const dispatch = useAppDispatch();
  const {
    saving,
    saveError,
    saveSuccess,
    hoursValue,
    inputError,
    estimateType,
    originalEstimateType,
    serviceItemRows,
    selectedServiceItemId,
    serviceItemHoursValue,
    serviceItemInputError,
    serviceItems,
  } = useAppSelector((state) => state.estimateDrawer);

  const [createEstimateMutation] = useMutation(CREATE_PROJECT_ESTIMATE);

  const validateInput = useCallback(
    (value: string): boolean => {
      // One unified message for the hours field across every failure mode -
      // empty, non-numeric, negative, or above the backend cap.
      // (`Number.isFinite` rejects `NaN`, `Infinity`, and bad inputs like
      // `1e1000` that `Number.isNaN` would let through.)
      //
      // 0 is intentionally accepted: per product an estimate of exactly
      // 0 hours is a real value (matches the BY_FIELD_OPTION rule for
      // service-item rows below), so the Save button must enable when
      // the user types `0` in the Total Hours field. Only `< 0` is
      // rejected.
      if (!value.trim()) {
        dispatch(setInputError('timeProject.estimate.validation.invalidHours'));
        return false;
      }
      const num = Number(value);
      if (!Number.isFinite(num) || num < 0 || num > MAX_ESTIMATE_HOURS) {
        dispatch(setInputError('timeProject.estimate.validation.invalidHours'));
        return false;
      }
      dispatch(setInputError(null));
      return true;
    },
    [dispatch],
  );

  const updateHoursValue = useCallback(
    (value: string) => {
      dispatch(setHoursValue(value));
      if (value.trim()) {
        validateInput(value);
      } else {
        dispatch(setInputError(null));
      }
    },
    [dispatch, validateInput],
  );

  const changeEstimateType = useCallback(
    (type: EstimateType) => {
      dispatch(setEstimateTypeAction(type));
    },
    [dispatch],
  );

  const updateSelectedServiceItem = useCallback(
    (id: string) => {
      dispatch(setSelectedServiceItemId(id));
    },
    [dispatch],
  );

  const updateServiceItemHours = useCallback(
    (value: string) => {
      dispatch(setServiceItemHoursValue(value));
      // Hours are OPTIONAL for service items - an empty/whitespace input is
      // treated as "0 hours" on save, so it isn't an error. Only block obvious
      // typos: non-numeric, negative, or above the backend cap.
      if (!value.trim()) {
        dispatch(setServiceItemInputError(null));
        return;
      }
      const num = Number(value);
      if (!Number.isFinite(num) || num < 0 || num > MAX_ESTIMATE_HOURS) {
        dispatch(
          setServiceItemInputError(
            'timeProject.estimate.validation.invalidHours',
          ),
        );
      } else {
        dispatch(setServiceItemInputError(null));
      }
    },
    [dispatch],
  );

  const addServiceItem = useCallback(() => {
    if (!selectedServiceItemId) return;

    // Empty hours -> 0 (per spec: hours are optional for service items).
    const trimmed = serviceItemHoursValue.trim();
    const num = trimmed === '' ? 0 : Number(serviceItemHoursValue);
    if (!Number.isFinite(num) || num < 0 || num > MAX_ESTIMATE_HOURS) return;

    const item = serviceItems.find((si) => si.id === selectedServiceItemId);
    if (!item) return;

    dispatch(
      addServiceItemRow({
        serviceItemId: item.id,
        serviceItemName: item.name,
        estimatedHours: num,
      }),
    );
  }, [selectedServiceItemId, serviceItemHoursValue, serviceItems, dispatch]);

  const removeServiceItem = useCallback(
    (serviceItemId: string) => {
      dispatch(removeServiceItemRow(serviceItemId));
    },
    [dispatch],
  );

  const editServiceItemHours = useCallback(
    (serviceItemId: string, hours: number) => {
      dispatch(
        updateServiceItemRowHours({ serviceItemId, estimatedHours: hours }),
      );
    },
    [dispatch],
  );

  const validateBeforeSave = useCallback(
    (isEdit = false): boolean => {
      if (estimateType === EstimateType.TOTAL_HOURS) {
        return validateInput(hoursValue);
      }
      if (!isEdit && serviceItemRows.length === 0) {
        dispatch(
          setSaveError('timeProject.estimate.validation.serviceItemRequired'),
        );
        return false;
      }
      return true;
    },
    [estimateType, hoursValue, serviceItemRows, validateInput, dispatch],
  );

  const saveEstimate = useCallback(
    async (projectId: string) => {
      if (!validateBeforeSave()) return false;

      dispatch(setSaving(true));
      dispatch(setSaveError(null));

      try {
        let input: Record<string, any>;

        if (estimateType === EstimateType.TOTAL_HOURS) {
          input = {
            projectId,
            projectEstimateType: EstimateType.TOTAL_HOURS,
            totalEstimatedSeconds: Number(hoursValue) * 3600,
          };
        } else {
          input = {
            projectId,
            projectEstimateType: 'BY_FIELD_OPTION',
            fieldType: 'STANDARD_FIELD',
            fieldRef: 'SERVICE_ITEM',
            fieldOptionEstimates: serviceItemRows.map((row) => ({
              fieldOptionId: row.serviceItemId,
              estimatedSeconds: row.estimatedHours * 3600,
            })),
          };
        }

        const { data } = await withLoggedOperation({
          logger,
          sandbox,
          interactionName: TimeCustomerInteraction.TIME_PROJECT_ESTIMATE_CREATE,
          event: {
            start:
              TIME_PROJECT_LOGGING_CONSTANTS.MUTATIONS.ESTIMATE_CREATE_START,
            success:
              TIME_PROJECT_LOGGING_CONSTANTS.MUTATIONS.ESTIMATE_CREATE_SUCCESS,
            failure:
              TIME_PROJECT_LOGGING_CONSTANTS.MUTATIONS.ESTIMATE_CREATE_FAILURE,
          },
          extraProps: {
            projectId,
            estimateType,
            serviceItemCount:
              estimateType === EstimateType.TOTAL_HOURS
                ? 0
                : serviceItemRows.length,
          },
          isFailure: (res) => {
            const r = res.data?.timeTrackingCreateProjectEstimate;
            if (r?.errorCode) return r.errorCode;
            if (r?.successCode !== 'SUCCESS') return 'NO_SUCCESS_CODE';
            return null;
          },
          run: () =>
            createEstimateMutation({
              variables: { input },
              context: {
                headers: sandbox
                  ? getCustomerInteractionPropagationHeaders(
                      sandbox,
                      TimeCustomerInteraction.TIME_PROJECT_ESTIMATE_CREATE,
                    )
                  : undefined,
              },
            }),
        });

        const result = data?.timeTrackingCreateProjectEstimate;

        if (result?.successCode === 'SUCCESS') {
          dispatch(setSaveSuccess(true));
          return true;
        }

        // Always surface a generic message - the backend's error text is
        // not safe / friendly to expose directly to the end user.
        dispatch(setSaveError('timeProject.estimate.error.generic'));
        return false;
      } catch {
        dispatch(setSaveError('timeProject.estimate.error.generic'));
        return false;
      } finally {
        // ALWAYS reset the saving flag, regardless of success/failure.
        // Without this the `SavingOverlay` covers the entire drawer
        // forever after a mutation failure — the user can't see the
        // error message, can't edit the form, and can't close the
        // drawer. On success the local `isFinalizing` flag in the
        // drawer takes over to keep the overlay visible during the
        // parent's refetch.
        dispatch(setSaving(false));
      }
    },
    [
      hoursValue,
      estimateType,
      serviceItemRows,
      validateBeforeSave,
      createEstimateMutation,
      dispatch,
      logger,
      sandbox,
    ],
  );

  const hasTypeChanged = useCallback(
    (): boolean =>
      originalEstimateType !== null && originalEstimateType !== estimateType,
    [originalEstimateType, estimateType],
  );

  const prefill = useCallback(
    (estimate: ProjectEstimateData) => {
      if (estimate.projectEstimateType === 'BY_FIELD_OPTION') {
        // `useProjectEstimates` keeps `-1` as a sentinel for service items
        // that have time logged but no per-item estimate yet. Those rows
        // are surfaced as a dash in the main summary table, but they
        // should NOT seed the create/edit drawer — the drawer only edits
        // rows that already carry an estimate. Users can still add them
        // back from the service-item picker if they want to set one.
        const rows: ServiceItemEstimateRow[] = (estimate.estimateItems || [])
          .filter((item) => item.estimatedHours >= 0)
          .map((item) => ({
            serviceItemId: item.fieldOptionId,
            serviceItemName: item.serviceItemName,
            estimatedHours: item.estimatedHours,
          }));
        dispatch(
          prefillEstimateDrawer({
            estimateType: EstimateType.BY_SERVICE_ITEM,
            hoursValue: '',
            serviceItemRows: rows,
          }),
        );
      } else {
        dispatch(
          prefillEstimateDrawer({
            estimateType: EstimateType.TOTAL_HOURS,
            hoursValue: String(estimate.budgetHoursTotal),
            serviceItemRows: [],
          }),
        );
      }
    },
    [dispatch],
  );

  const reset = useCallback(() => {
    dispatch(resetEstimateDrawer());
  }, [dispatch]);

  return {
    saving,
    saveError,
    saveSuccess,
    hoursValue,
    inputError,
    estimateType,
    serviceItemRows,
    selectedServiceItemId,
    serviceItemHoursValue,
    serviceItemInputError,
    serviceItems,
    updateHoursValue,
    changeEstimateType,
    updateSelectedServiceItem,
    updateServiceItemHours,
    addServiceItem,
    removeServiceItem,
    editServiceItemHours,
    validateBeforeSave,
    saveEstimate,
    hasTypeChanged,
    originalEstimateType,
    prefill,
    reset,
  };
};

import React, { useCallback, useEffect, useRef } from 'react';
import { useIntl, useSandbox } from '@payroll/quicksand';
import dayjs from 'dayjs';
import { useGetApprovalSettings } from 'src/js/service/hooks/settings/useGetApprovalSettings';
import { useGetQLSettings } from 'src/js/service/hooks/settings/useGetQLSettings';

import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  setSubmitThroughDate,
  setSubmitTimePanelData,
  toggleWeekExpanded,
  setLoading,
  setSubmitting,
  setError,
  resetSubmitTimePanel,
} from '../../store/approvalsSlice';
import {
  selectSubmitThroughDate,
  selectPeriodStartDate,
  selectWeekGroups,
  selectExpandedWeekIds,
  selectTotalUnapprovedMinutes,
  selectIsLoading,
  selectIsSubmitting,
  selectError,
} from '../../store/approvalsSelectors';
import { APPROVALS_LOGGING } from '../../constants/approvalsLoggingConstants';
import {
  SUCCESS_TOAST_CLOSE_DELAY_MS,
  getWeekEndDateIso,
} from '../../constants/approvalsConstants';
import type { SubmitTimePanelContainerProps } from '../../types/Approvals.types';
import { useSubmitTimeMutations, useSubmitTimePanelData } from '../../hooks';
import SubmitTimePanel from './SubmitTimePanel';

const ISO_DATE_FORMAT = 'YYYY-MM-DD';

/**
 * SubmitTimePanelContainer - Container component for time submission
 * Handles Redux state management and dynamic API-backed weekly summary loading.
 */
const SubmitTimePanelContainer: React.FC<SubmitTimePanelContainerProps> = ({
  onClose,
  onSubmitSuccess,
}) => {
  const dispatch = useAppDispatch();
  const sandbox = useSandbox();
  const intl = useIntl();

  const submitThroughDate = useAppSelector(selectSubmitThroughDate);
  const periodStartDate = useAppSelector(selectPeriodStartDate);
  const weekGroups = useAppSelector(selectWeekGroups);
  const expandedWeekIds = useAppSelector(selectExpandedWeekIds);
  const totalUnapprovedMinutes = useAppSelector(selectTotalUnapprovedMinutes);
  const isLoading = useAppSelector(selectIsLoading);
  const isSubmitting = useAppSelector(selectIsSubmitting);
  const error = useAppSelector(selectError);
  const { approvalSettings, settled: approvalsSettled } =
    useGetApprovalSettings();

  const intialDateSetRef = useRef(false);
  const { qlSettings, loading: qlSettingsLoading } = useGetQLSettings();
  const { fetchSubmitTimePanelData } = useSubmitTimePanelData();
  const { submitTime } = useSubmitTimeMutations();
  const currentUserIdRef = useRef<number | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    sandbox.logger.info(APPROVALS_LOGGING.SUBMIT_TIME_PANEL_MOUNTED);

    return () => {
      sandbox.logger.info(APPROVALS_LOGGING.SUBMIT_TIME_PANEL_UNMOUNTED);
      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
    };
  }, [sandbox.logger]);

  const loadSubmitTimeData = useCallback(
    async (throughDateIso: string) => {
      sandbox.logger.info(APPROVALS_LOGGING.API_FETCH_TIME_ENTRIES_STARTED, {
        submitThroughDate: throughDateIso,
      });

      if (!approvalsSettled) {
        return;
      }

      dispatch(setLoading(true));

      try {
        const canSubmitTimesheets =
          approvalSettings.requireApprovalForTrackedTime.value;

        if (!canSubmitTimesheets) {
          dispatch(
            setSubmitTimePanelData({
              weekGroups: [],
              periodStartDate: throughDateIso,
            }),
          );
          return;
        }

        const weekStartDay = qlSettings.firstDayOfWeek?.value ?? 0;
        // This mapped field uses inverted backend semantics:
        // true => full-week submission required, false => partial-week allowed.
        const includeFullSelectedWeek =
          approvalSettings.enablePartialWeekSubmission.value;
        const {
          weekGroups: nextWeekGroups,
          periodStartDate,
          currentUserId: resolvedCurrentUserId,
        } = await fetchSubmitTimePanelData({
          throughDateIso,
          weekStartDay,
          includeFullSelectedWeek,
        });
        currentUserIdRef.current = resolvedCurrentUserId;
        dispatch(
          setSubmitTimePanelData({
            weekGroups: nextWeekGroups,
            periodStartDate,
          }),
        );
        sandbox.logger.info(APPROVALS_LOGGING.API_FETCH_TIME_ENTRIES_SUCCESS, {
          weekCount: nextWeekGroups.length,
        });
      } catch (err) {
        sandbox.logger.error(APPROVALS_LOGGING.API_FETCH_TIME_ENTRIES_FAILED, {
          error: err instanceof Error ? err.message : String(err),
        });
        dispatch(
          setError(
            intl.formatMessage({
              id: 'approvals.submitTimePanel.error',
              defaultMessage: 'An error occurred. Please try again.',
            }),
          ),
        );
      } finally {
        dispatch(setLoading(false));
      }
    },
    [
      approvalSettings.enablePartialWeekSubmission.value,
      approvalSettings.requireApprovalForTrackedTime.value,
      approvalsSettled,
      dispatch,
      fetchSubmitTimePanelData,
      intl,
      qlSettings.firstDayOfWeek?.value,
      sandbox.logger,
    ],
  );

  // Initial load (matches the Figma which defaults to today).
  // Gated on BOTH `approvalsSettled` and QL settings readiness so we avoid
  // applying the default week-start fallback (Sunday) before firstDayOfWeek
  // resolves. This keeps first render and later date changes consistent.
  useEffect(() => {
    if (approvalsSettled && !qlSettingsLoading && !intialDateSetRef.current) {
      const initialDate = dayjs().format(ISO_DATE_FORMAT);
      dispatch(setSubmitThroughDate(initialDate));
      intialDateSetRef.current = true;
      loadSubmitTimeData(initialDate);
    }
  }, [approvalsSettled, dispatch, loadSubmitTimeData, qlSettingsLoading]);

  const handleSubmitThroughDateChange = useCallback(
    (nextDateIso: string) => {
      sandbox.logger.info(APPROVALS_LOGGING.SUBMIT_TIME_PANEL_DATE_CHANGED, {
        submitThroughDate: nextDateIso,
      });
      dispatch(setSubmitThroughDate(nextDateIso));
      loadSubmitTimeData(nextDateIso);
    },
    [dispatch, loadSubmitTimeData, sandbox.logger],
  );

  const handleToggleWeekExpanded = useCallback(
    (weekId: string) => {
      sandbox.logger.info(APPROVALS_LOGGING.SUBMIT_TIME_PANEL_WEEK_TOGGLED, {
        weekId,
      });
      dispatch(toggleWeekExpanded(weekId));
    },
    [dispatch, sandbox.logger],
  );

  const handleClose = useCallback(() => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    sandbox.logger.info(APPROVALS_LOGGING.SUBMIT_TIME_PANEL_CLOSED);
    dispatch(resetSubmitTimePanel());
    onClose?.();
  }, [dispatch, onClose, sandbox.logger]);

  const handleDismissError = useCallback(() => {
    dispatch(setError(null));
  }, [dispatch]);

  const handleOpenSubmitConfirmation = useCallback(() => {
    sandbox.logger.info(APPROVALS_LOGGING.SUBMIT_TIME_PANEL_CONFIRM, {
      submitThroughDate,
      totalUnapprovedMinutes,
    });
  }, [sandbox.logger, submitThroughDate, totalUnapprovedMinutes]);

  const handleSubmit = useCallback(async () => {
    sandbox.logger.info(APPROVALS_LOGGING.SUBMIT_TIME_PANEL_SUBMIT_CLICKED, {
      submitThroughDate,
      totalUnapprovedMinutes,
    });

    dispatch(setSubmitting(true));

    try {
      sandbox.logger.info(APPROVALS_LOGGING.API_SUBMIT_TIME_STARTED, {
        submitThroughDate,
      });

      if (!submitThroughDate) {
        throw new Error('submitThroughDate is required for submission');
      }

      const includeFullSelectedWeek =
        approvalSettings.enablePartialWeekSubmission.value;
      const weekStartDay = qlSettings.firstDayOfWeek?.value ?? 0;
      const throughDateForSubmission = includeFullSelectedWeek
        ? getWeekEndDateIso(submitThroughDate, weekStartDay)
        : submitThroughDate;

      await submitTime({
        throughDateIso: throughDateForSubmission,
        userId: currentUserIdRef.current || undefined,
      });

      sandbox.logger.info(APPROVALS_LOGGING.API_SUBMIT_TIME_SUCCESS, {
        submitThroughDate,
      });

      dispatch(setSubmitting(false));
      onSubmitSuccess?.(totalUnapprovedMinutes);
      // Keep panel mounted briefly so success toast is visible before closing.
      closeTimeoutRef.current = window.setTimeout(() => {
        handleClose();
      }, SUCCESS_TOAST_CLOSE_DELAY_MS);
    } catch (err) {
      sandbox.logger.error(APPROVALS_LOGGING.API_SUBMIT_TIME_FAILED, {
        error: err instanceof Error ? err.message : String(err),
        submitThroughDate,
      });
      dispatch(
        setError(
          intl.formatMessage({
            id: 'approvals.submitTimePanel.error',
            defaultMessage: 'An error occurred. Please try again.',
          }),
        ),
      );
      dispatch(setSubmitting(false));
    }
  }, [
    dispatch,
    intl,
    submitThroughDate,
    totalUnapprovedMinutes,
    onSubmitSuccess,
    handleClose,
    submitTime,
    approvalSettings.enablePartialWeekSubmission.value,
    qlSettings.firstDayOfWeek?.value,
    sandbox.logger,
  ]);

  return (
    <SubmitTimePanel
      submitThroughDate={submitThroughDate}
      summaryThroughDate={
        submitThroughDate && approvalSettings.enablePartialWeekSubmission.value
          ? getWeekEndDateIso(
              submitThroughDate,
              qlSettings.firstDayOfWeek?.value ?? 0,
            )
          : submitThroughDate
      }
      showFullWeekSubmissionText={
        approvalsSettled && approvalSettings.enablePartialWeekSubmission.value
      }
      periodStartDate={periodStartDate}
      weekGroups={weekGroups}
      expandedWeekIds={expandedWeekIds}
      totalUnapprovedMinutes={totalUnapprovedMinutes}
      isLoading={isLoading}
      isSubmitting={isSubmitting}
      error={error}
      onClose={handleClose}
      onSubmitThroughDateChange={handleSubmitThroughDateChange}
      onToggleWeekExpanded={handleToggleWeekExpanded}
      onOpenSubmitConfirmation={handleOpenSubmitConfirmation}
      onSubmit={handleSubmit}
      submitConfirmationMessage={approvalSettings.customMessage.value}
      onDismissError={handleDismissError}
    />
  );
};

export default SubmitTimePanelContainer;

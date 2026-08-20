import React, { useCallback, useEffect, useState } from 'react';
import Trowser from '@ids-ts/trowser';
import { useIntl, useTracking } from '@payroll/quicksand';
import Button from '@ids-ts/button';
import Typography from '@ids-ts/typography';
import { Activity } from '@ids-ts/loader';
import PageMessage from '@ids-ts/page-message';
import { ChevronLeft } from '@design-systems/icons';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';

import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  setPolicies,
  setPoliciesPageInfo,
  setLoadingPolicies,
  setShowLandingPage,
  setShowWizard,
  setWizardCurrentStep,
  setSelectedPolicyId,
  setShowPolicyDetails,
  setError,
  setRefetchPolicies,
  selectOvertimePolicies,
  selectShowLandingPage,
  selectHasPolicies,
  selectShowWizard,
  selectShowPolicyDetails,
  selectPolicyFormData,
  selectWizardCurrentStep,
  selectWizardStartStep,
  selectIsLoadingPolicies,
  selectWizardEditMode,
  selectPoliciesPageInfo,
  selectInitialMemberIds,
  selectOriginalPolicySnapshot,
  selectRefetchPolicies,
  selectWizardOrigin,
  selectOvertimeError,
  selectPolicyIsDefault,
  WizardStepId,
  resetWizardState,
  selectWizardCachedWorkers,
  selectPolicyIsBasic,
} from '../store';
import { useOvertimePolicies, useOvertimeMutations } from '../hooks';
import {
  transformToCreateInput,
  transformToUpdateInput,
  createAssignmentChangesInput,
  createNewPolicyAssignmentsInput,
  detectWorkerReassignmentConflicts,
} from '../utils/overtimeMutationUtils';
import type { OvertimePolicy } from '../types/Overtime.types';
import { OvertimeFilledState } from './OvertimeFilledState';
import { PolicySetupWizardContainer } from './PolicySetupWizard';
import { PolicyDetailsScreen } from './PolicyDetailsScreen';
import ReassignWorkersModal from './ReassignWorkersModal';
import {
  BackButtonContainer,
  BackLink,
} from './PolicySetupWizard/styles/PolicySetupWizard.styled';
import {
  TrowserContent,
  HeaderTextGroup,
  EmptyStateContainer,
} from '../styles/OvertimeLandingPage.styled';
import { OVERTIME_LOGGING } from '../constants/overtimeLoggingConstants';
import { OVERTIME_URLS } from '../constants/overtimeTableConstants';
import {
  MANAGE_OVERTIME_LANDING_TRACKING_POINTS,
  WIZARD_GLOBAL_NAV_TRACKING_POINTS,
  EDIT_OVERTIME_POLICY_TRACKING_POINTS,
  REASSIGN_WORKER_TRACKING_POINTS,
} from '../constants/overtimeTrackingPoints';

interface OvertimeLandingPageTrowserContainerProps {
  onClose: () => void;
}

const OvertimeLandingPageTrowserContainer: React.FC<
  OvertimeLandingPageTrowserContainerProps
> = ({ onClose }) => {
  const intl = useIntl();
  const logger = useLoggingConfig();
  const track = useTracking();
  const dispatch = useAppDispatch();

  // Redux state selectors
  const open = useAppSelector(selectShowLandingPage);
  const policies = useAppSelector(selectOvertimePolicies);
  const hasPolicies = useAppSelector(selectHasPolicies);
  const showWizard = useAppSelector(selectShowWizard);
  const showPolicyDetails = useAppSelector(selectShowPolicyDetails);
  const policyFormData = useAppSelector(selectPolicyFormData);
  const isLoadingPolicies = useAppSelector(selectIsLoadingPolicies);
  const isEditMode = useAppSelector(selectWizardEditMode);
  const pageInfo = useAppSelector(selectPoliciesPageInfo);
  const initialMemberIds = useAppSelector(selectInitialMemberIds);
  const originalPolicySnapshot = useAppSelector(selectOriginalPolicySnapshot);
  const refetchPolicies = useAppSelector(selectRefetchPolicies);
  const wizardOrigin = useAppSelector(selectWizardOrigin);
  const wizardStartStep = useAppSelector(selectWizardStartStep);
  const error = useAppSelector(selectOvertimeError);
  const policyIsDefault = useAppSelector(selectPolicyIsDefault);
  const policyIsBasic = useAppSelector(selectPolicyIsBasic);
  const cachedWorkers = useAppSelector(selectWizardCachedWorkers);

  // Local state for reassignment modal
  const [isReassignmentModalOpen, setIsReassignmentModalOpen] = useState(false);
  const [pendingMutationId, setPendingMutationId] = useState<string | null>(
    null,
  );
  const [isModalSaving, setIsModalSaving] = useState(false);

  // Modal content state
  const [modalTitle, setModalTitle] = useState<string>('');
  const [modalMessage, setModalMessage] = useState<string>('');

  const [operationError, setOperationError] = useState('');

  // Hook for fetching policies
  const { fetchPolicies, fetchPage } = useOvertimePolicies();

  // Mutations hook
  const {
    createOvertimePolicy,
    updateOvertimePolicy,
    manageOvertimePolicyAssignments,
  } = useOvertimeMutations();

  // Load policies when trowser opens
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    logger.info(OVERTIME_LOGGING.LANDING_PAGE_MOUNTED);

    let cancelled = false;
    const loadPolicies = async () => {
      try {
        dispatch(setLoadingPolicies(true));
        const result = await fetchPolicies();
        if (!cancelled) {
          dispatch(setPolicies(result.policies));
          dispatch(setPoliciesPageInfo(result.pageInfo));
        }
      } catch (error) {
        if (!cancelled) {
          logger.error(OVERTIME_LOGGING.API_FETCH_POLICIES_FAILED, {
            error,
          });
          dispatch(
            setError(intl.formatMessage({ id: 'catch.all.error.content' })),
          );
        }
      } finally {
        if (!cancelled) {
          dispatch(setLoadingPolicies(false));
        }
      }
    };

    loadPolicies();
    return () => {
      cancelled = true;
    };
  }, [open, dispatch, logger, fetchPolicies, intl]);

  // Refetch policies when refetchPolicies flag is set (e.g., after deletion)
  useEffect(() => {
    if (!refetchPolicies) {
      return undefined;
    }

    let cancelled = false;
    const refetch = async () => {
      try {
        dispatch(setLoadingPolicies(true));
        const result = await fetchPolicies();
        if (!cancelled) {
          dispatch(setPolicies(result.policies));
          dispatch(setPoliciesPageInfo(result.pageInfo));
        }
      } catch (error) {
        if (!cancelled) {
          logger.error(OVERTIME_LOGGING.API_FETCH_POLICIES_FAILED, {
            error,
          });
          dispatch(
            setError(intl.formatMessage({ id: 'catch.all.error.content' })),
          );
        }
      } finally {
        if (!cancelled) {
          dispatch(setLoadingPolicies(false));
          dispatch(setRefetchPolicies(false));
        }
      }
    };

    refetch();
    return () => {
      cancelled = true;
    };
  }, [refetchPolicies, dispatch, logger, fetchPolicies, intl]);

  const handleClose = () => {
    setOperationError('');
    dispatch(setError(null));
    if (showWizard) {
      track(WIZARD_GLOBAL_NAV_TRACKING_POINTS.CLICK_CLOSE);
      if (isEditMode) {
        track(EDIT_OVERTIME_POLICY_TRACKING_POINTS.CLOSE_EDIT_POLICY);
      }
      dispatch(resetWizardState());
      if (wizardOrigin === 'policyDetails') {
        dispatch(setShowPolicyDetails(true));
      }
      return;
    }
    if (showPolicyDetails) {
      dispatch(setSelectedPolicyId(null));
      dispatch(setShowPolicyDetails(false));
      return;
    }
    track(MANAGE_OVERTIME_LANDING_TRACKING_POINTS.CLOSE_LANDING_PAGE);
    dispatch(setShowLandingPage(false));
    onClose();
  };

  const handleCreatePolicy = () => {
    setOperationError('');
    dispatch(setError(null));
    track(MANAGE_OVERTIME_LANDING_TRACKING_POINTS.SETUP_OVERTIME_POLICY);
    logger.info(OVERTIME_LOGGING.LANDING_PAGE_CREATE_POLICY_CLICKED);
    dispatch(setShowWizard({ show: true, origin: 'listing' }));
  };

  /**
   * Handle wizard cancel/back navigation.
   * If wizard was opened from policy details, return to details page.
   * Otherwise return to listing page (default behavior).
   */
  const handleWizardBackNavigation = () => {
    setOperationError('');
    dispatch(setError(null));
    track(WIZARD_GLOBAL_NAV_TRACKING_POINTS.CLICK_OVERTIME_POLICIES);
    if (wizardOrigin === 'policyDetails') {
      // Return to policy details page - keep the selected policy ID
      dispatch(resetWizardState());
      dispatch(setShowPolicyDetails(true));
    } else {
      // Return to listing page (create flow or unknown origin)
      dispatch(resetWizardState());
    }
  };

  const currentWizardStep = useAppSelector(selectWizardCurrentStep);

  // CREATE MODE: Create policy, assign members, refresh list, reset wizard
  const handleCreateSubmit = async (
    clientMutationId: string,
    currentMemberIds: string[],
  ) => {
    setOperationError('');

    const createInput = transformToCreateInput(policyFormData);
    const createResult = await createOvertimePolicy({
      ...createInput,
      clientMutationId,
    });

    if (!createResult.success || !createResult.data?.id) {
      logger.error(OVERTIME_LOGGING.API_CREATE_POLICY_FAILED, {
        error: createResult.error,
      });
      setOperationError(
        createResult.error ||
          intl.formatMessage({ id: 'catch.all.error.content' }),
      );
      return;
    }

    // Assign members to the newly created policy
    if (currentMemberIds.length > 0) {
      const assignInput = createNewPolicyAssignmentsInput(
        currentMemberIds,
        policyFormData.isDefault,
        `${clientMutationId}-assign`,
      );
      if (assignInput) {
        const assignResult = await manageOvertimePolicyAssignments(
          createResult.data.id,
          assignInput,
        );
        if (!assignResult.success) {
          logger.error(OVERTIME_LOGGING.API_MANAGE_ASSIGNMENTS_FAILED, {
            policyId: createResult.data.id,
            error: assignResult.error,
          });
          setOperationError(
            intl.formatMessage({ id: 'catch.all.error.content' }),
          );
          return;
        }
      }
    }

    // Refresh policies list and reset wizard
    const refreshResult = await fetchPolicies();
    dispatch(setPolicies(refreshResult.policies));
    dispatch(setPoliciesPageInfo(refreshResult.pageInfo));
    logger.info(OVERTIME_LOGGING.WIZARD_COMPLETED, {
      mode: 'create',
      policyId: createResult.data.id,
      policyName: policyFormData.name,
    });
    dispatch(resetWizardState());
  };

  // EDIT MODE: Save member assignment changes.
  // returnToReview=true navigates back to REVIEW; false refreshes list and returns to policy details.
  const handleMembersSave = async (
    returnToReview: boolean,
    policyId: string,
    clientMutationId: string,
    currentMemberIds: string[],
  ) => {
    setOperationError('');

    logger.info(OVERTIME_LOGGING.WIZARD_ASSIGNMENTS_SAVE_STARTED, {
      policyId,
      isFromReview: returnToReview,
    });

    const assignmentChanges = createAssignmentChangesInput(
      initialMemberIds,
      currentMemberIds,
      policyId,
      policyFormData.isDefault,
      `${clientMutationId}-assign`,
    );

    if (assignmentChanges) {
      const assignResult = await manageOvertimePolicyAssignments(
        policyId,
        assignmentChanges,
      );

      if (!assignResult.success) {
        logger.error(OVERTIME_LOGGING.API_MANAGE_ASSIGNMENTS_FAILED, {
          policyId,
          error: assignResult.error,
        });
        setOperationError(
          intl.formatMessage({ id: 'catch.all.error.content' }),
        );
        return;
      }
    }

    if (returnToReview) {
      dispatch(setWizardCurrentStep(WizardStepId.REVIEW));
    } else {
      // Refresh policies list and return to policy details
      const refreshResult = await fetchPolicies();
      dispatch(setPolicies(refreshResult.policies));
      dispatch(setPoliciesPageInfo(refreshResult.pageInfo));
      logger.info(OVERTIME_LOGGING.WIZARD_COMPLETED, {
        mode: 'edit-members',
        policyId,
      });
      dispatch(resetWizardState());
      dispatch(setShowPolicyDetails(true));
    }
  };

  // EDIT MODE (Flows 4-5): Save policy name/rules update and navigate back to REVIEW
  const handlePolicyUpdate = async (
    policyId: string,
    clientMutationId: string,
    shouldRefetchPolicies: boolean = false,
  ) => {
    setOperationError('');

    logger.info(OVERTIME_LOGGING.WIZARD_UPDATE_FROM_REVIEW_STARTED, {
      policyId,
      step: currentWizardStep,
    });

    const updateInput = transformToUpdateInput(
      policyFormData,
      originalPolicySnapshot ?? undefined,
    );
    const updateResult = await updateOvertimePolicy(policyId, {
      ...updateInput,
      clientMutationId,
    });

    if (!updateResult.success) {
      logger.error(OVERTIME_LOGGING.API_UPDATE_POLICY_FAILED, {
        policyId,
        error: updateResult.error,
      });
      setOperationError(
        updateResult.error ||
          intl.formatMessage({ id: 'catch.all.error.content' }),
      );
      return;
    }

    if (shouldRefetchPolicies) {
      dispatch(setRefetchPolicies(true));
    }
  };

  // EDIT MODE: Full update flow at REVIEW — update policy + optional member assignment + refresh + reset
  const handleEditSubmit = async (
    policyId: string,
    clientMutationId: string,
    currentMemberIds: string[],
  ) => {
    setOperationError('');

    const updateInput = transformToUpdateInput(
      policyFormData,
      originalPolicySnapshot ?? undefined,
    );
    const updateResult = await updateOvertimePolicy(policyId, {
      ...updateInput,
      clientMutationId,
    });

    if (!updateResult.success) {
      logger.error(OVERTIME_LOGGING.API_UPDATE_POLICY_FAILED, {
        policyId,
        error: updateResult.error,
      });
      setOperationError(
        updateResult.error ||
          intl.formatMessage({ id: 'catch.all.error.content' }),
      );
      return;
    }

    // Handle assignment changes if member selection changed
    const assignmentChanges = createAssignmentChangesInput(
      initialMemberIds,
      currentMemberIds,
      policyId,
      policyFormData.isDefault,
      `${clientMutationId}-assign`,
    );

    if (assignmentChanges) {
      const assignResult = await manageOvertimePolicyAssignments(
        policyId,
        assignmentChanges,
      );

      if (!assignResult.success) {
        logger.error(OVERTIME_LOGGING.API_MANAGE_ASSIGNMENTS_FAILED, {
          policyId,
          error: assignResult.error,
        });
      }
    }

    // Refresh policies list and reset wizard
    const refreshResult = await fetchPolicies();
    dispatch(setPolicies(refreshResult.policies));
    dispatch(setPoliciesPageInfo(refreshResult.pageInfo));
    logger.info(OVERTIME_LOGGING.WIZARD_COMPLETED, {
      mode: 'edit-policy',
      policyId,
      policyName: policyFormData.name,
    });
    dispatch(resetWizardState());
  };

  /**
   * Handle cancellation of reassignment confirmation modal
   */
  const handleReassignmentCancel = useCallback(() => {
    track(REASSIGN_WORKER_TRACKING_POINTS.REASSIGN_WORKER_CANCEL);
    setIsReassignmentModalOpen(false);
    setPendingMutationId(null);
    setIsModalSaving(false);
    setModalTitle('');
    setModalMessage('');
  }, [track]);

  /**
   * Check for worker reassignment conflicts and show confirmation modal if needed.
   * Returns true if there are conflicts (action should be stopped),
   * returns false if no conflicts (caller should proceed with action).
   */
  const checkForConflicts = useCallback(
    (memberIds: string[], currentPolicyId: string | null): boolean => {
      const { hasConflicts } = detectWorkerReassignmentConflicts(
        memberIds,
        currentPolicyId,
        policies,
        cachedWorkers,
      );

      return hasConflicts;
    },
    [policies, cachedWorkers],
  );

  const openReassignWorkerModal = useCallback((): void => {
    setModalTitle(
      intl.formatMessage({
        id: 'overtime.reassign.modal.title',
        defaultMessage: 'Reassign workers',
      }),
    );
    setModalMessage(
      intl.formatMessage({
        id: 'overtime.reassign.modal.message',
        defaultMessage:
          "Workers are already assigned to a different overtime policy. If you move forward, they'll be reassigned to this one.",
      }),
    );
    setIsReassignmentModalOpen(true);
  }, [intl]);

  const openReassignDefaultPolicyModal = useCallback((): void => {
    setModalTitle(
      intl.formatMessage({
        id: 'overtime.reassign.default.modal.title',
        defaultMessage: 'Reassign default policy',
      }),
    );
    setModalMessage(
      intl.formatMessage({
        id: 'overtime.reassign.default.modal.message',
        defaultMessage:
          'A default overtime policy already exists. If you move forward, it will be replaced with this one.',
      }),
    );
    setIsReassignmentModalOpen(true);
  }, [intl]);

  /**
   * Handle wizard next/submit action.
   * Routes to the appropriate sub-function based on isEditMode, wizardStartStep, and currentWizardStep.
   *
   * CREATE MODE:
   * - Steps 1-3: Navigate to next step
   * - REVIEW step: handleCreateSubmit
   *
   * EDIT MODE (determined by wizardStartStep):
   * - Flow 2: startStep=REVIEW, currentStep=REVIEW -> Just close (no changes)
   * - Flow 3: startStep=POLICY_MEMBERS -> handleMembersSave(false)
   * - Flows 4-5: startStep=REVIEW, currentStep=NAME/RULES -> handlePolicyUpdate
   * - Flow 6: startStep=REVIEW, currentStep=MEMBERS -> handleMembersSave(true)
   * - Default at REVIEW: handleEditSubmit
   *
   * @param skipConfirmation - If true, skip conflict check and proceed directly
   * @param forcedMutationId - Optional mutation ID to use (for retries from modal)
   */
  const handleWizardNext = useCallback(
    async (skipConfirmation: boolean = false, forcedMutationId?: string) => {
      setOperationError('');
      dispatch(setError(null));
      const clientMutationId = forcedMutationId || `policy-${Date.now()}`;
      const currentMemberIds = policyFormData.policyMemberIds;

      if (!isEditMode) {
        if (currentWizardStep === WizardStepId.REVIEW) {
          // Check for default policy conflict FIRST
          if (!skipConfirmation) {
            const existingDefaultPolicies = policies.filter(
              (policy: OvertimePolicy) => policy.isDefault,
            );
            const isCreatingAsDefault =
              policyFormData.isDefault && existingDefaultPolicies.length > 0;
            if (isCreatingAsDefault) {
              openReassignDefaultPolicyModal();
              setPendingMutationId(clientMutationId);
              return;
            }
          }
          // Check for reassignment conflicts BEFORE creating policy
          if (!skipConfirmation && checkForConflicts(currentMemberIds, null)) {
            openReassignWorkerModal();
            setPendingMutationId(clientMutationId);
            return;
          }

          // No conflicts, proceed with creation
          await handleCreateSubmit(clientMutationId, currentMemberIds);
        } else if (
          currentWizardStep === WizardStepId.OVERTIME_RULES &&
          policyIsDefault
        ) {
          // Skip POLICY_MEMBERS step for default policies
          dispatch(setWizardCurrentStep(WizardStepId.REVIEW));
        } else {
          dispatch(
            setWizardCurrentStep((currentWizardStep + 1) as WizardStepId),
          );
        }
        return;
      }

      const policyId = policyFormData.id;
      if (!policyId) {
        logger.error(OVERTIME_LOGGING.WIZARD_EDIT_MODE_MISSING_POLICY_ID);
        setOperationError(
          intl.formatMessage({ id: 'catch.all.error.content' }),
        );
        return;
      }

      if (
        wizardStartStep === WizardStepId.REVIEW &&
        currentWizardStep === WizardStepId.REVIEW
      ) {
        dispatch(resetWizardState());
        dispatch(setShowPolicyDetails(true));
        return;
      }

      if (wizardStartStep === WizardStepId.POLICY_MEMBERS) {
        // Check for reassignment conflicts BEFORE saving
        if (
          !skipConfirmation &&
          checkForConflicts(currentMemberIds, policyId)
        ) {
          openReassignWorkerModal();
          setPendingMutationId(clientMutationId);
          return;
        }

        // No conflicts, proceed normally
        await handleMembersSave(
          false,
          policyId,
          clientMutationId,
          currentMemberIds,
        );
        return;
      }

      if (wizardStartStep === WizardStepId.REVIEW) {
        if (currentWizardStep === WizardStepId.POLICY_MEMBERS) {
          // Check for reassignment conflicts BEFORE saving
          if (
            !skipConfirmation &&
            checkForConflicts(currentMemberIds, policyId)
          ) {
            openReassignWorkerModal();
            setPendingMutationId(clientMutationId);
            return;
          }

          // No conflicts, proceed normally
          await handleMembersSave(
            true,
            policyId,
            clientMutationId,
            currentMemberIds,
          );
          return;
        }
        if (
          currentWizardStep === WizardStepId.POLICY_NAME ||
          currentWizardStep === WizardStepId.OVERTIME_RULES
        ) {
          // Check if changing to default policy (POLICY_NAME step only)
          let isChangingToDefault = false;
          if (currentWizardStep === WizardStepId.POLICY_NAME) {
            const otherDefaultPolicies = policies.filter(
              (policy: OvertimePolicy) =>
                policy.id !== policyId && policy.isDefault,
            );
            // Check if user is changing from non-default to default
            isChangingToDefault =
              policyFormData.isDefault &&
              originalPolicySnapshot &&
              !originalPolicySnapshot.isDefault &&
              otherDefaultPolicies.length > 0;

            if (isChangingToDefault && !skipConfirmation) {
              openReassignDefaultPolicyModal();
              setPendingMutationId(clientMutationId);
              return;
            }
          }

          await handlePolicyUpdate(
            policyId,
            clientMutationId,
            isChangingToDefault,
          );
          return;
        }
      }

      if (currentWizardStep === WizardStepId.REVIEW) {
        // Check for reassignment conflicts BEFORE saving
        if (
          !skipConfirmation &&
          checkForConflicts(currentMemberIds, policyId)
        ) {
          openReassignWorkerModal();
          setPendingMutationId(clientMutationId);
          return;
        }

        // No conflicts, proceed normally
        await handleEditSubmit(policyId, clientMutationId, currentMemberIds);
      } else {
        dispatch(setWizardCurrentStep((currentWizardStep + 1) as WizardStepId));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [
      currentWizardStep,
      wizardStartStep,
      isEditMode,
      policyFormData,
      policyIsDefault,
      dispatch,
      logger,
      checkForConflicts,
      handleCreateSubmit,
      handleMembersSave,
      handlePolicyUpdate,
      handleEditSubmit,
      intl,
      originalPolicySnapshot,
      policies,
      openReassignWorkerModal,
      openReassignDefaultPolicyModal,
    ],
  );

  /**
   * Handle confirmation from reassignment modal - re-execute handleWizardNext with skipConfirmation=true
   */
  const handleModalConfirm = useCallback(async () => {
    track(REASSIGN_WORKER_TRACKING_POINTS.REASSIGN_WORKER_SAVE);
    if (!pendingMutationId) return;

    setIsModalSaving(true);

    try {
      await handleWizardNext(true, pendingMutationId);
    } catch (error) {
      logger.error(OVERTIME_LOGGING.API_FETCH_POLICIES_FAILED, {
        error,
      });
      setOperationError(intl.formatMessage({ id: 'catch.all.error.content' }));
    } finally {
      setIsReassignmentModalOpen(false);
      setPendingMutationId(null);
      setIsModalSaving(false);
    }
  }, [pendingMutationId, handleWizardNext, logger, intl, track]);

  const handleWizardBack = () => {
    setOperationError('');
    dispatch(setError(null));
    // If we're on REVIEW and policy is default, skip POLICY_MEMBERS
    if (
      currentWizardStep === WizardStepId.REVIEW &&
      (policyIsDefault || policyIsBasic)
    ) {
      dispatch(setWizardCurrentStep(WizardStepId.OVERTIME_RULES));
    } else {
      const previousStep = currentWizardStep - 1;
      dispatch(setWizardCurrentStep(previousStep as WizardStepId));
    }
  };

  const handleWizardEditStep = (stepId: number) => {
    setOperationError('');
    dispatch(setError(null));
    dispatch(setWizardCurrentStep(stepId as WizardStepId));
  };

  const handleEditPolicy = (policyId: string) => {
    setOperationError('');
    dispatch(setError(null));
    track(MANAGE_OVERTIME_LANDING_TRACKING_POINTS.EDIT_POLICY_MANAGE_OVERTIME);
    logger.info(OVERTIME_LOGGING.LANDING_PAGE_EDIT_POLICY_CLICKED, {
      policyId,
    });
    dispatch(setSelectedPolicyId(policyId));
    dispatch(setShowPolicyDetails(true));
  };

  const handleBackFromPolicyDetails = () => {
    setOperationError('');
    dispatch(setError(null));
    dispatch(setSelectedPolicyId(null));
    dispatch(setShowPolicyDetails(false));
  };

  const handleLearnMoreClick = () => {
    track(MANAGE_OVERTIME_LANDING_TRACKING_POINTS.LEARN_MORE_ABOUT_OVERTIME);
    logger.info(OVERTIME_LOGGING.LANDING_PAGE_LEARN_MORE_CLICKED);
  };

  const handleCheckLawsClick = () => {
    track(MANAGE_OVERTIME_LANDING_TRACKING_POINTS.CHECKOUT_OVERTIME_LAWS);
    logger.info(OVERTIME_LOGGING.LANDING_PAGE_CHECK_LAWS_CLICKED);
  };

  // Handle page change for server-side pagination
  const handlePageChange = useCallback(
    async (page: number) => {
      try {
        dispatch(setLoadingPolicies(true));
        const result = await fetchPage(page);
        dispatch(setPolicies(result.policies));
        dispatch(setPoliciesPageInfo(result.pageInfo));
      } catch (error) {
        logger.error(OVERTIME_LOGGING.API_FETCH_POLICIES_FAILED, {
          error,
          page,
        });
        dispatch(
          setError(intl.formatMessage({ id: 'catch.all.error.content' })),
        );
      } finally {
        dispatch(setLoadingPolicies(false));
      }
    },
    [dispatch, fetchPage, logger, intl],
  );

  return (
    <Trowser
      dismissible
      open={open}
      onClose={handleClose}
      title={intl.formatMessage({
        id: 'overtime.landing.title',
        defaultMessage: 'Overtime',
      })}
      stepFlow
      data-testid="overtime-landing-page-trowser"
      automationId="overtime-landing-page-trowser"
    >
      {open && (
        <>
          {showPolicyDetails && (
            <PolicyDetailsScreen onBack={handleBackFromPolicyDetails} />
          )}
          {!showPolicyDetails && showWizard && (
            <TrowserContent>
              <BackButtonContainer>
                <BackLink
                  onClick={handleWizardBackNavigation}
                  aria-label={intl.formatMessage({
                    id:
                      wizardOrigin === 'policyDetails'
                        ? 'overtime.wizard.backToDetails.aria'
                        : 'overtime.wizard.backToPolicies.aria',
                    defaultMessage:
                      wizardOrigin === 'policyDetails'
                        ? 'Back to policy details'
                        : 'Back to Overtime policies',
                  })}
                >
                  <ChevronLeft />
                  {wizardOrigin === 'policyDetails'
                    ? intl.formatMessage({
                        id: 'overtime.wizard.backToDetails',
                        defaultMessage: 'Back to policy',
                      })
                    : intl.formatMessage({
                        id: 'overtime.wizard.backToPolicies',
                        defaultMessage: 'Overtime policies',
                      })}
                </BackLink>
              </BackButtonContainer>
              {operationError && (
                <PageMessage
                  type="error"
                  open
                  dismissible
                  onClose={() => setOperationError('')}
                  data-testid="overtime-wizard-operation-error-banner"
                >
                  {operationError}
                </PageMessage>
              )}
              <PolicySetupWizardContainer
                onCancel={handleWizardBackNavigation}
                onBack={handleWizardBack}
                onNext={handleWizardNext}
                onEditStep={handleWizardEditStep}
                isEditMode={isEditMode}
              />
            </TrowserContent>
          )}
          {!showPolicyDetails && !showWizard && (
            <TrowserContent>
              <Typography variant="headline-3" weight="medium">
                {intl.formatMessage({
                  id: 'overtime.landing.header.title',
                  defaultMessage: 'Manage overtime policies for your company',
                })}
              </Typography>
              <HeaderTextGroup>
                <Typography variant="body-2" weight="regular">
                  {intl.formatMessage({
                    id: 'overtime.landing.header.description',
                    defaultMessage:
                      'Create and manage overtime rates, pay rates and payroll calculations.',
                  })}{' '}
                  <a
                    href={OVERTIME_URLS.LEARN_MORE}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleLearnMoreClick}
                  >
                    {intl.formatMessage({
                      id: 'overtime.landing.header.learn.more',
                      defaultMessage: 'Learn more about overtime',
                    })}
                  </a>
                </Typography>
                <Typography variant="body-2" weight="regular">
                  {intl.formatMessage({
                    id: 'overtime.landing.header.link.text',
                    defaultMessage: "Don't know your overtime laws?",
                  })}{' '}
                  <a
                    href={OVERTIME_URLS.CHECK_LAWS_BY_STATE}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleCheckLawsClick}
                  >
                    {intl.formatMessage({
                      id: 'overtime.landing.header.link.action',
                      defaultMessage: 'Check out overtime laws by state',
                    })}
                  </a>
                </Typography>
              </HeaderTextGroup>

              {error && (
                <PageMessage
                  type="error"
                  open
                  dismissible
                  onClose={() => dispatch(setError(null))}
                  data-testid="overtime-fetch-error-banner"
                >
                  {error}
                </PageMessage>
              )}

              {operationError && (
                <PageMessage
                  type="error"
                  open
                  dismissible
                  onClose={() => setOperationError('')}
                  data-testid="overtime-landing-operation-error-banner"
                >
                  {operationError}
                </PageMessage>
              )}

              {/* Loading State */}
              {isLoadingPolicies && (
                <EmptyStateContainer>
                  <Activity
                    shape="dots"
                    size="large"
                    data-testid="overtime-policies-loader"
                  />
                </EmptyStateContainer>
              )}

              {/* Empty State */}
              {!isLoadingPolicies && !hasPolicies && (
                <EmptyStateContainer>
                  <Typography variant="headline-5" weight="medium">
                    {intl.formatMessage({
                      id: 'overtime.landing.empty.title',
                      defaultMessage: 'Set up your overtime policies',
                    })}
                  </Typography>
                  <Typography variant="body-2" weight="regular">
                    {intl.formatMessage({
                      id: 'overtime.landing.empty.description',
                      defaultMessage:
                        'Create overtime policies and assign overtime rules to your team to customize how they accumulate overtime.',
                    })}
                  </Typography>
                  <Button
                    priority="primary"
                    purpose="standard"
                    size="medium"
                    onClick={handleCreatePolicy}
                    data-testid="setup-overtime-policy-button"
                  >
                    {intl.formatMessage({
                      id: 'overtime.landing.empty.button',
                      defaultMessage: 'Set up overtime policies',
                    })}
                  </Button>
                </EmptyStateContainer>
              )}

              {/* Filled State */}
              {!isLoadingPolicies && hasPolicies && (
                <OvertimeFilledState
                  policies={policies}
                  pageInfo={pageInfo}
                  onCreatePolicy={handleCreatePolicy}
                  onEditPolicy={handleEditPolicy}
                  onPageChange={handlePageChange}
                />
              )}
            </TrowserContent>
          )}
        </>
      )}

      {/* Reassignment confirmation modal */}
      <ReassignWorkersModal
        open={isReassignmentModalOpen}
        onCancel={handleReassignmentCancel}
        onConfirm={handleModalConfirm}
        isLoading={isModalSaving}
        title={modalTitle}
        message={modalMessage}
      />
    </Trowser>
  );
};

export default OvertimeLandingPageTrowserContainer;

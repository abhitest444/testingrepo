import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import { Button } from '@ids-ts/button';
import { RadioGroup, RadioOnChangeEventType } from '@ids-ts/radio';
import { Activity } from '@ids-ts/loader';
import Dropdown, { MenuItem } from '@ids-ts/dropdown';
import Typography from '@ids-ts/typography';
import {
  Modal,
  ModalActions,
  ModalContent,
  ModalHeader,
} from '@ids-ts/modal-dialog';
import { OVERTIME_URLS } from 'src/js/widgets/qbtOrchestrator/features/overtime/constants/overtimeTableConstants';
import { getApolloClientInstance } from 'src/js/service/ApolloClientBuilder';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import { USER_SETTINGS_OVERTIME_LOGGING } from 'src/js/widgets/userSettings/constants/loggingConstants';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  setInteractionDegraded,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import {
  OVERTIME_DEGRADED_STATUS_CODES,
  getOvertimeStatusCodeMessage,
} from 'src/js/widgets/qbtOrchestrator/features/overtime/constants/overtimeValidationConstants';
import { WORKER_OVERTIME_TRACKING_POINTS } from 'src/js/widgets/qbtOrchestrator/features/overtime/constants/overtimeTrackingPoints';
import {
  useAppDispatch,
  useAppSelector,
} from 'src/js/widgets/userSettings/store';
import {
  setOvertimeMode,
  setOvertimePolicy,
  cancelOvertimeEdit,
  setDraftRuleType,
  setDraftRules,
  selectDraftRuleType,
  selectDraftRules,
  selectOvertimePolicy,
  initializeEditDraft,
} from 'src/js/widgets/userSettings/store/slices/overtimeSlice';
import { selectSettingsFor } from 'src/js/widgets/userSettings/store/slices/settingsContextSlice';
import OvertimeRulesConfig from 'src/js/widgets/qbtOrchestrator/features/overtime/components/PolicySetupWizard/OvertimeRulesConfig';
import { RULE_TYPE_OPTIONS as ALL_RULE_TYPE_OPTIONS } from 'src/js/widgets/qbtOrchestrator/features/overtime/components/PolicySetupWizard/constants/overtimeRulesConstants';
import {
  transformRuleToInput,
  generateClientMutationId,
  buildRulesDiff,
  filterEnabledRules,
  areRulesEqual,
} from 'src/js/widgets/qbtOrchestrator/features/overtime/utils/overtimeMutationUtils';
import {
  CREATE_USER_OVERTIME_POLICY,
  UPDATE_OVERTIME_POLICY,
  DELETE_OVERTIME_POLICY,
  GET_OVERTIME_POLICIES,
} from 'src/js/widgets/qbtOrchestrator/features/overtime/queries/overtimeQueries';
import { NAVIGATION_ROUTES } from 'src/js/widgets/userSettings/components/constants/UserSettingsPage.constants';
import type {
  OvertimeRule,
  OvertimeRuleType,
} from 'src/js/widgets/qbtOrchestrator/features/overtime/types/Overtime.types';
import {
  Section,
  Divider,
  ActionButtons,
  CompanySettingsLink,
  StyledPageMessage,
  DropdownWrapper,
} from '../styles/OvertimeCard.styles';
import { OvertimeCardMode } from '../types/OvertimeCard.types';
import {
  isUserOverridePolicy,
  isBasicPolicy,
  BASIC_POLICY_ID,
} from '../utils/policyIdUtils';

// Only expose basic and california to workers — exclude custom type
const USER_RULE_TYPE_OPTIONS = ALL_RULE_TYPE_OPTIONS.filter(
  (o) => o.value !== 'custom',
);

// Radio values for company-vs-custom selection
const RADIO_COMPANY = 'company';
const RADIO_CUSTOM = 'custom';

const OvertimeCardEdit: React.FC = () => {
  const intl = useIntl();
  const sandbox = useSandbox();
  const logger = useLoggingConfig();
  const track = useTracking();
  const dispatch = useAppDispatch();

  const policy = useAppSelector(selectOvertimePolicy);
  const selectedRuleType = useAppSelector(selectDraftRuleType);
  const draftRules = useAppSelector(selectDraftRules);
  const settingsFor = useAppSelector(selectSettingsFor);

  useEffect(() => {
    logger.info(USER_SETTINGS_OVERTIME_LOGGING.CARD_EDIT_MOUNTED, {
      policyId: policy?.id,
      ruleType: selectedRuleType,
    });
    // Intentional: log initial policy/ruleType snapshot on edit mount.
    // policy and selectedRuleType are not deps — we want mount-time state, not re-logs on every change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [radioSelection, setRadioSelection] = useState<'company' | 'custom'>(
    // Pre-select Radio B when the worker has a user-level override.
    // Radio A for company-assigned policy (id === 'basic') or no policy.
    isUserOverridePolicy(policy?.id) ? RADIO_CUSTOM : RADIO_COMPANY,
  );
  const [isValid, setIsValid] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>('');
  // Baseline snapshot for dirty-checking. rules is updated during mount
  // normalization (before mountedRef flips) and after each rule-type switch
  // normalization (ruleTypeJustChanged) so it always reflects the "clean"
  // post-normalization state for the current rule type.
  const initialBaseline = useRef({
    radioSelection: isUserOverridePolicy(policy?.id)
      ? RADIO_CUSTOM
      : RADIO_COMPANY,
    ruleType: selectedRuleType,
    rules: draftRules,
  });

  // settled=false keeps isDirty=false until after mount normalization completes.
  const [settled, setSettled] = useState(false);
  const mountedRef = useRef(false);
  // Set before dispatching a rule-type change so the next onRulesChange
  // (normalization from OvertimeRulesConfig) updates baseline.rules
  // instead of being treated as a user edit.
  const ruleTypeJustChanged = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    setSettled(true);
  }, []);

  const isDirty = useMemo(() => {
    if (!settled) return false;
    const b = initialBaseline.current;
    if (radioSelection !== b.radioSelection) return true;
    if (radioSelection === RADIO_CUSTOM) {
      if (selectedRuleType !== b.ruleType) return true;
      if (!areRulesEqual(draftRules, b.rules)) return true;
    }
    return false;
  }, [settled, radioSelection, selectedRuleType, draftRules]);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isSaveDisabled =
    isSaving ||
    !isDirty ||
    (radioSelection === RADIO_CUSTOM && (!selectedRuleType || !isValid));

  const handleCancel = () => {
    track(WORKER_OVERTIME_TRACKING_POINTS.OVERTIME_RULES_CANCEL);
    logger.info(USER_SETTINGS_OVERTIME_LOGGING.CANCEL_CLICKED);
    setSaveError('');
    dispatch(cancelOvertimeEdit());
  };

  const handleDeleteOverride = async (
    client: ReturnType<typeof getApolloClientInstance>,
  ) => {
    const interactionType = TimeCustomerInteraction.OVERTIME_POLICY_DELETE;
    createCustomerInteraction(sandbox, interactionType);
    try {
      const deleteResult = await client!.mutate({
        mutation: DELETE_OVERTIME_POLICY,
        variables: {
          id: policy!.id,
          clientMutationId: generateClientMutationId(
            'delete-user-overtime-policy',
          ),
        },
        context: {
          clientName: ApolloClientNames.TSHEETS,
          headers: getCustomerInteractionPropagationHeaders(
            sandbox,
            interactionType,
          ),
        },
      });

      if (deleteResult.errors?.length)
        throw new Error(deleteResult.errors[0].message);

      const deleteResponse = deleteResult.data?.deleteOvertimePolicy;
      const deleteStatusCode = String(deleteResponse?.status?.statusCode ?? '');
      if (OVERTIME_DEGRADED_STATUS_CODES.has(deleteStatusCode)) {
        const msgDescriptor = getOvertimeStatusCodeMessage(deleteStatusCode);
        setInteractionDegraded(sandbox, interactionType, deleteStatusCode);
        setSaveError(
          intl.formatMessage({
            id: msgDescriptor.id,
            defaultMessage: msgDescriptor.defaultMessage,
          }),
        );
        return;
      }

      logger.info(USER_SETTINGS_OVERTIME_LOGGING.DELETE_POLICY_SUCCESS, {
        policyId: policy!.id,
      });
      endInteractionWithSuccess(sandbox, interactionType);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(USER_SETTINGS_OVERTIME_LOGGING.DELETE_POLICY_FAILED, {
        policyId: policy!.id,
        error: message,
      });
      endInteractionWithFailure(sandbox, interactionType, message, error);
      throw error;
    }

    // Refetch in a separate try-catch — delete already succeeded
    try {
      const refetchResult = await client!.query({
        query: GET_OVERTIME_POLICIES,
        variables: { filter: { assignedToUserId: settingsFor!.id } },
        context: { clientName: ApolloClientNames.TSHEETS },
        fetchPolicy: 'network-only',
      });

      const policies = refetchResult.data?.overtimePolicies?.values ?? [];
      dispatch(setOvertimePolicy(policies[0] ?? null));
    } catch (refetchErr) {
      logger.error(USER_SETTINGS_OVERTIME_LOGGING.FETCH_POLICY_FAILED, {
        context: 'refetchAfterDelete',
        error:
          refetchErr instanceof Error ? refetchErr.message : String(refetchErr),
      });
      // Delete succeeded but refetch failed — clear stale policy so VIEW
      // mode doesn't display the deleted override.
      dispatch(setOvertimePolicy(null));
    }
    dispatch(setOvertimeMode(OvertimeCardMode.VIEW));
  };

  const handleUpdateOverride = async (
    client: ReturnType<typeof getApolloClientInstance>,
  ) => {
    const interactionType = TimeCustomerInteraction.OVERTIME_POLICY_UPDATE;
    createCustomerInteraction(sandbox, interactionType);

    try {
      const result = await client!.mutate({
        mutation: UPDATE_OVERTIME_POLICY,
        variables: {
          id: BASIC_POLICY_ID,
          input: {
            clientMutationId: generateClientMutationId(
              'update-user-overtime-policy',
            ),
            userId: settingsFor!.id,
            rules: buildRulesDiff(
              filterEnabledRules(policy!.rules?.values ?? []),
              draftRules,
              isBasicPolicy(policy!.id),
            ),
          },
        },
        context: {
          clientName: ApolloClientNames.TSHEETS,
          headers: getCustomerInteractionPropagationHeaders(
            sandbox,
            interactionType,
          ),
        },
      });

      if (result.errors?.length) throw new Error(result.errors[0].message);

      const updateResponse = result.data?.updateOvertimePolicy;
      const updateStatusCode = String(updateResponse?.status?.statusCode ?? '');
      if (OVERTIME_DEGRADED_STATUS_CODES.has(updateStatusCode)) {
        const msgDescriptor = getOvertimeStatusCodeMessage(updateStatusCode);
        setInteractionDegraded(sandbox, interactionType, updateStatusCode);
        setSaveError(
          intl.formatMessage({
            id: msgDescriptor.id,
            defaultMessage: msgDescriptor.defaultMessage,
          }),
        );
        return;
      }

      const savedPolicy = updateResponse?.policy;
      if (!savedPolicy)
        throw new Error(
          intl.formatMessage({
            id: 'overtime.api.error.generic',
            defaultMessage: 'Something went wrong. Please try again.',
          }),
        );

      logger.info(USER_SETTINGS_OVERTIME_LOGGING.UPDATE_POLICY_SUCCESS, {
        policyId: policy!.id,
      });
      dispatch(setOvertimePolicy(savedPolicy));
      dispatch(setOvertimeMode(OvertimeCardMode.VIEW));
      endInteractionWithSuccess(sandbox, interactionType);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(USER_SETTINGS_OVERTIME_LOGGING.UPDATE_POLICY_FAILED, {
        policyId: policy!.id,
        error: message,
      });
      endInteractionWithFailure(sandbox, interactionType, message, error);
      throw error;
    }
  };

  const handleCreateOverride = async (
    client: ReturnType<typeof getApolloClientInstance>,
  ) => {
    const interactionType = TimeCustomerInteraction.OVERTIME_POLICY_CREATE;
    createCustomerInteraction(sandbox, interactionType);
    const workerName = settingsFor?.displayName || settingsFor?.id;
    const input = {
      id: BASIC_POLICY_ID,
      clientMutationId: generateClientMutationId('user-overtime-policy'),
      name: `Basic Overtime - ${workerName}`,
      setAsDefault: false,
      rules: draftRules.map(transformRuleToInput),
      userId: settingsFor!.id,
      assignments: { userIds: [settingsFor!.id] },
    };

    try {
      const result = await client!.mutate({
        mutation: CREATE_USER_OVERTIME_POLICY,
        variables: { input },
        context: {
          clientName: ApolloClientNames.TSHEETS,
          headers: getCustomerInteractionPropagationHeaders(
            sandbox,
            interactionType,
          ),
        },
      });

      if (result.errors?.length) throw new Error(result.errors[0].message);

      const createResponse = result.data?.createOvertimePolicy;
      const createStatusCode = String(createResponse?.status?.statusCode ?? '');
      if (OVERTIME_DEGRADED_STATUS_CODES.has(createStatusCode)) {
        const msgDescriptor = getOvertimeStatusCodeMessage(createStatusCode);
        setInteractionDegraded(sandbox, interactionType, createStatusCode);
        setSaveError(
          intl.formatMessage({
            id: msgDescriptor.id,
            defaultMessage: msgDescriptor.defaultMessage,
          }),
        );
        return;
      }

      const savedPolicy = createResponse?.policy;
      if (!savedPolicy)
        throw new Error(
          intl.formatMessage({
            id: 'overtime.api.error.generic',
            defaultMessage: 'Something went wrong. Please try again.',
          }),
        );

      logger.info(USER_SETTINGS_OVERTIME_LOGGING.CREATE_POLICY_SUCCESS, {
        policyId: savedPolicy.id,
      });
      dispatch(setOvertimePolicy(savedPolicy));
      dispatch(setOvertimeMode(OvertimeCardMode.VIEW));
      endInteractionWithSuccess(sandbox, interactionType);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(USER_SETTINGS_OVERTIME_LOGGING.CREATE_POLICY_FAILED, {
        error: message,
      });
      endInteractionWithFailure(sandbox, interactionType, message, error);
      throw error;
    }
  };

  const handleSave = async () => {
    track(WORKER_OVERTIME_TRACKING_POINTS.OVERTIME_RULES_SAVE);
    logger.info(USER_SETTINGS_OVERTIME_LOGGING.SAVE_CLICKED);

    if (!settingsFor?.id) {
      logger.error(USER_SETTINGS_OVERTIME_LOGGING.MISSING_SETTINGS_FOR_ID);
      setSaveError(intl.formatMessage({ id: 'catch.all.error.content' }));
      return;
    }

    setSaveError('');
    setIsSaving(true);

    let operationType = 'unknown';
    try {
      const client = getApolloClientInstance(sandbox);
      if (!client) {
        logger.error(
          USER_SETTINGS_OVERTIME_LOGGING.APOLLO_CLIENT_NOT_INITIALIZED,
        );
        throw new Error('Apollo client not initialized');
      }

      if (radioSelection === RADIO_COMPANY) {
        if (!isUserOverridePolicy(policy?.id)) {
          dispatch(setOvertimeMode(OvertimeCardMode.VIEW));
        } else {
          operationType = 'delete';
          await handleDeleteOverride(client);
        }
      } else if (isUserOverridePolicy(policy?.id)) {
        operationType = 'update';
        await handleUpdateOverride(client);
      } else {
        operationType = 'create';
        await handleCreateOverride(client);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(USER_SETTINGS_OVERTIME_LOGGING.SAVE_FAILED, {
        operation: operationType,
        error: message,
      });
      setSaveError(intl.formatMessage({ id: 'catch.all.error.content' }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleManageCompanyPolicies = (e: React.MouseEvent) => {
    e.preventDefault();
    track(WORKER_OVERTIME_TRACKING_POINTS.CLICK_MANAGE_COMPANY_HYPERLINK);
    logger.info(USER_SETTINGS_OVERTIME_LOGGING.MANAGE_COMPANY_POLICIES_CLICKED);
    sandbox.navigation.navigate(NAVIGATION_ROUTES.OVERTIME_POLICIES);
  };

  const handleRadioChange = (e: RadioOnChangeEventType) => {
    setSaveError('');
    const value = e.target.value as 'company' | 'custom';

    if (value === RADIO_COMPANY) {
      track(WORKER_OVERTIME_TRACKING_POINTS.CLICK_COMPANY_LEVEL_RADIO_BUTTON);
      logger.info(USER_SETTINGS_OVERTIME_LOGGING.RADIO_COMPANY_SELECTED);
      if (isUserOverridePolicy(policy?.id)) {
        // Worker has an existing user-level override — require confirmation before switching
        logger.info(USER_SETTINGS_OVERTIME_LOGGING.DELETE_CONFIRM_SHOWN);
        setShowDeleteConfirm(true);
      } else {
        // No user-level override — safe to switch immediately
        setRadioSelection(RADIO_COMPANY);
      }
    } else {
      track(WORKER_OVERTIME_TRACKING_POINTS.CLICK_CUSTOM_RULES_RADIO_BUTTON);
      logger.info(USER_SETTINGS_OVERTIME_LOGGING.RADIO_CUSTOM_SELECTED);
      // Switching back to Radio B — restore the original policy rules from Redux
      ruleTypeJustChanged.current = true;
      dispatch(initializeEditDraft(policy));
      setRadioSelection(RADIO_CUSTOM);
    }
  };

  const handleCancelDeleteConfirm = () => {
    logger.info(USER_SETTINGS_OVERTIME_LOGGING.DELETE_CONFIRM_CANCELLED);
    setShowDeleteConfirm(false);
  };

  const handleConfirmDelete = () => {
    logger.info(USER_SETTINGS_OVERTIME_LOGGING.DELETE_CONFIRMED);
    setRadioSelection(RADIO_COMPANY);
    setShowDeleteConfirm(false);
  };

  return (
    <div>
      {/* 1. Info banner */}
      <StyledPageMessage
        type="info"
        open
        dismissible={false}
        automationId="OvertimeCardEditInfoBanner"
      >
        {intl.formatMessage({ id: 'overtime.card.edit.info.text' })}{' '}
        <a
          href={OVERTIME_URLS.CHECK_LAWS_BY_STATE}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            logger.info(USER_SETTINGS_OVERTIME_LOGGING.CHECK_LAWS_LINK_CLICKED)
          }
        >
          {intl.formatMessage({ id: 'overtime.card.edit.info.link' })}
        </a>
      </StyledPageMessage>

      {/* 2. Inline save error */}
      {saveError && (
        <StyledPageMessage
          type="error"
          open
          dismissible={false}
          automationId="OvertimeCardEditErrorBanner"
          onClose={() => setSaveError('')}
        >
          {saveError}
        </StyledPageMessage>
      )}

      {/* 3. "Overtime rules" label + radio group */}
      <Section>
        <Typography variant="body-2" weight="medium">
          {intl.formatMessage({ id: 'overtime.card.edit.section.label' })}
        </Typography>
        <RadioGroup
          options={[
            {
              label: (
                <span>
                  {intl.formatMessage({
                    id: 'overtime.card.edit.radio.company',
                  })}{' '}
                  <CompanySettingsLink
                    href="#"
                    onClick={handleManageCompanyPolicies}
                  >
                    {intl.formatMessage({
                      id: 'overtime.card.edit.radio.company.link',
                    })}
                  </CompanySettingsLink>
                </span>
              ),
              value: RADIO_COMPANY,
            },
            {
              label: intl.formatMessage({
                id: 'overtime.card.edit.radio.custom',
              }),
              value: RADIO_CUSTOM,
            },
          ]}
          value={radioSelection}
          onChange={handleRadioChange}
          name="overtime-assignment-type"
          aria-label="overtime-assignment-type"
          size="medium"
          vertical
        />
      </Section>

      {/* 4. Custom rule config — shown only when Radio B selected */}
      {radioSelection === RADIO_CUSTOM && (
        <>
          <Divider />
          <Section>
            <Typography variant="body-2" weight="medium">
              {intl.formatMessage({
                id: 'overtime.wizard.rules.setup.question',
              })}
            </Typography>
            <DropdownWrapper>
              <Dropdown
                aria-label={intl.formatMessage({
                  id: 'overtime.wizard.rules.setup.question',
                })}
                value={selectedRuleType}
                onChange={(e) => {
                  const newRuleType = (e.target as HTMLSelectElement)
                    .value as OvertimeRuleType;
                  track(WORKER_OVERTIME_TRACKING_POINTS.OVERTIME_RULES_SELECT);
                  logger.info(
                    USER_SETTINGS_OVERTIME_LOGGING.RULE_TYPE_CHANGED,
                    {
                      from: selectedRuleType,
                      to: newRuleType,
                    },
                  );
                  ruleTypeJustChanged.current = true;
                  dispatch(setDraftRuleType(newRuleType));
                }}
                placeholder={intl.formatMessage({
                  id: 'overtime.wizard.rules.dropdown.placeholder',
                })}
                data-testid="overtime-card-edit-rule-type-dropdown"
                width="auto"
              >
                {USER_RULE_TYPE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {intl.formatMessage({
                      id: option.labelId,
                      defaultMessage: option.defaultMessage,
                    })}
                  </MenuItem>
                ))}
              </Dropdown>
            </DropdownWrapper>

            {selectedRuleType && (
              <OvertimeRulesConfig
                selectedRuleType={selectedRuleType}
                rules={draftRules}
                onRuleTypeChange={(rt) => dispatch(setDraftRuleType(rt))}
                onRulesChange={(rules) => {
                  setSaveError('');
                  dispatch(setDraftRules(rules));
                  // Update baseline rules during normalization events:
                  // 1. Mount normalization (before mountedRef flips)
                  // 2. Rule-type switch normalization (ruleTypeJustChanged flag)
                  // This ensures baseline always reflects the "clean" state
                  // for the current rule type, not stale pre-normalization data.
                  if (!mountedRef.current || ruleTypeJustChanged.current) {
                    initialBaseline.current.rules = rules;
                    ruleTypeJustChanged.current = false;
                  }
                }}
                onValidationChange={setIsValid}
                ruleTypeOptions={USER_RULE_TYPE_OPTIONS}
                hideDropdown
                isEditMode
                policyId={policy?.id}
              />
            )}
          </Section>
        </>
      )}

      {/* 5. Cancel + Save footer */}
      <ActionButtons>
        <Button
          priority="tertiary"
          onClick={handleCancel}
          aria-label="cancel-overtime"
          disabled={isSaving}
        >
          {intl.formatMessage({ id: 'actions.cancel' })}
        </Button>
        <Button
          onClick={handleSave}
          aria-label="save-overtime"
          disabled={isSaveDisabled}
          isLoading={isSaving}
          loadingComponent={<Activity shape="dots" size="small" />}
        >
          {intl.formatMessage({ id: 'actions.save' })}
        </Button>
      </ActionButtons>

      {/* Confirmation modal — shown when switching from user-level override to company policy */}
      <Modal
        open={showDeleteConfirm}
        onClose={handleCancelDeleteConfirm}
        aria-labelledby="overtime-delete-confirm-title"
        data-testid="overtime-delete-confirm-modal"
        size="medium"
        dismissible
      >
        <ModalHeader
          onClose={handleCancelDeleteConfirm}
          data-testid="overtime-delete-confirm-modal-header"
        />
        <ModalContent data-testid="overtime-delete-confirm-modal-content">
          <Typography
            variant="headline-5"
            weight="medium"
            id="overtime-delete-confirm-title"
            data-testid="overtime-delete-confirm-modal-title"
          >
            {intl.formatMessage({
              id: 'overtime.card.edit.delete.confirm.title',
            })}
          </Typography>
          <Typography
            variant="body-2"
            weight="regular"
            data-testid="overtime-delete-confirm-modal-body"
          >
            {intl.formatMessage({
              id: 'overtime.card.edit.delete.confirm.body',
            })}
          </Typography>
        </ModalContent>
        <ModalActions data-testid="overtime-delete-confirm-modal-actions">
          <Button
            priority="secondary"
            onClick={handleCancelDeleteConfirm}
            data-testid="overtime-delete-confirm-modal-cancel"
          >
            {intl.formatMessage({
              id: 'overtime.card.edit.delete.confirm.cancel',
            })}
          </Button>
          <Button
            priority="primary"
            onClick={handleConfirmDelete}
            data-testid="overtime-delete-confirm-modal-confirm"
          >
            {intl.formatMessage({
              id: 'overtime.card.edit.delete.confirm.continue',
            })}
          </Button>
        </ModalActions>
      </Modal>
    </div>
  );
};

export default OvertimeCardEdit;

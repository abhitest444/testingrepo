import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import {
  getDefaultSandbox,
  renderWithQuicksandReduxAndLogging,
  createQbtOrchestratorStore,
} from 'test/unit/testUtils';
import OvertimeLandingPageTrowserContainer from 'src/js/widgets/qbtOrchestrator/features/overtime/components/OvertimeLandingPageTrowserContainer';
import { OVERTIME_LOGGING } from 'src/js/widgets/qbtOrchestrator/features/overtime/constants/overtimeLoggingConstants';
import {
  setShowLandingPage,
  setPolicies,
  setShowWizard,
  setShowPolicyDetails,
  setSelectedPolicyId,
  setWizardCurrentStep,
  setWizardEditMode,
  WizardStepId,
  initializeWizardForEdit,
  setPolicyName,
  setPolicyIsDefault,
  setPolicyMemberIds,
  setOvertimeRuleType,
  setOvertimeRules,
  setAssignmentsDirty,
  setRefetchPolicies,
  setError,
  resetWizardState,
} from 'src/js/widgets/qbtOrchestrator/features/overtime/store';
import { detectWorkerReassignmentConflicts } from 'src/js/widgets/qbtOrchestrator/features/overtime/utils/overtimeMutationUtils';

// Get the mocked function
const mockDetectWorkerReassignmentConflicts =
  detectWorkerReassignmentConflicts as jest.MockedFunction<
    typeof detectWorkerReassignmentConflicts
  >;

// Mock mutation functions
const mockCreateOvertimePolicy = jest.fn();
const mockUpdateOvertimePolicy = jest.fn();
const mockManageOvertimePolicyAssignments = jest.fn();
const mockFetchPolicies = jest.fn();
const mockFetchPage = jest.fn();

jest.mock(
  'src/js/widgets/qbtOrchestrator/features/overtime/hooks/useOvertimeMutations',
  () => ({
    useOvertimeMutations: () => ({
      createOvertimePolicy: mockCreateOvertimePolicy,
      updateOvertimePolicy: mockUpdateOvertimePolicy,
      manageOvertimePolicyAssignments: mockManageOvertimePolicyAssignments,
      deleteOvertimePolicy: jest.fn(),
      isCreatingPolicy: false,
      isUpdatingPolicy: false,
      isDeletingPolicy: false,
      isManagingAssignments: false,
      createPolicyError: null,
      updatePolicyError: null,
      deletePolicyError: null,
      assignmentsError: null,
      policyToDelete: null,
      showDeleteModal: false,
    }),
  }),
);

jest.mock(
  'src/js/widgets/qbtOrchestrator/features/overtime/hooks/useOvertimePolicies',
  () => ({
    useOvertimePolicies: () => ({
      fetchPolicies: mockFetchPolicies.mockResolvedValue({
        policies: [],
        pageInfo: { hasNextPage: false, hasPreviousPage: false, totalCount: 0 },
      }),
      fetchPage: mockFetchPage.mockResolvedValue({
        policies: [],
        pageInfo: { hasNextPage: false, hasPreviousPage: false, totalCount: 0 },
      }),
    }),
  }),
);

// Mock PolicyDetailsScreen to avoid Apollo client issues in nested components
jest.mock(
  'src/js/widgets/qbtOrchestrator/features/overtime/components/PolicyDetailsScreen',
  () => ({
    PolicyDetailsScreen: ({ onBack }: any) => (
      <div data-testid="policy-details-screen">
        <button data-testid="policy-details-back" onClick={onBack}>
          Back
        </button>
        Policy Details
      </div>
    ),
  }),
);

// Mock the dependencies
jest.mock('@ids-ts/trowser', () => ({
  __esModule: true,
  default: ({ children, open, onClose, title }: any) =>
    open ? (
      <div data-testid="trowser">
        <div data-testid="trowser-title">{title}</div>
        <button data-testid="trowser-close" onClick={onClose}>
          Close
        </button>
        {children}
      </div>
    ) : null,
}));

jest.mock('@ids-ts/button', () => ({
  __esModule: true,
  default: ({ children, onClick, 'data-testid': testId }: any) => (
    <button onClick={onClick} data-testid={testId}>
      {children}
    </button>
  ),
}));

jest.mock('@ids-ts/typography', () => ({
  __esModule: true,
  default: ({ children }: any) => <span>{children}</span>,
}));

jest.mock(
  'src/js/widgets/qbtOrchestrator/features/overtime/components/OvertimeFilledState',
  () => ({
    OvertimeFilledState: ({
      policies,
      onCreatePolicy,
      onEditPolicy,
      onPageChange,
    }: any) => (
      <div data-testid="overtime-filled-state">
        <div>Policies: {policies.length}</div>
        <button data-testid="filled-create-button" onClick={onCreatePolicy}>
          Create Policy
        </button>
        <button
          data-testid="filled-edit-button"
          onClick={() => onEditPolicy('1')}
        >
          Edit Policy
        </button>
        <button
          data-testid="filled-page-change-button"
          onClick={() => onPageChange(2)}
        >
          Next Page
        </button>
      </div>
    ),
  }),
);

jest.mock(
  'src/js/widgets/qbtOrchestrator/features/overtime/components/PolicySetupWizard',
  () => ({
    PolicySetupWizardContainer: ({
      onCancel,
      onNext,
      onBack,
      onEditStep,
    }: any) => (
      <div data-testid="policy-setup-wizard">
        <button data-testid="wizard-cancel" onClick={() => onCancel()}>
          Cancel Wizard
        </button>
        <button data-testid="wizard-next" onClick={() => onNext()}>
          Next Step
        </button>
        <button data-testid="wizard-back" onClick={() => onBack()}>
          Back Step
        </button>
        <button data-testid="wizard-edit-step" onClick={() => onEditStep(1)}>
          Edit Step
        </button>
      </div>
    ),
  }),
);

jest.mock('@ids-ts/page-message', () => ({
  __esModule: true,
  default: ({ children, type, 'data-testid': testId, onClose }: any) => (
    <div data-testid={testId} data-type={type}>
      {children}
      <button data-testid={`${testId}-close`} onClick={onClose}>
        X
      </button>
    </div>
  ),
}));

jest.mock('@design-systems/icons', () => ({
  ChevronLeft: () => <span data-testid="chevron-left-icon" />,
}));

jest.mock(
  'src/js/widgets/qbtOrchestrator/features/overtime/components/ReassignWorkersModal',
  () => ({
    __esModule: true,
    default: ({ open, onCancel, onConfirm, isLoading }: any) =>
      open ? (
        <div data-testid="reassign-workers-modal">
          <button data-testid="reassign-modal-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            data-testid="reassign-modal-confirm"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Confirm'}
          </button>
        </div>
      ) : null,
  }),
);

// Mock the detectWorkerReassignmentConflicts function
jest.mock(
  'src/js/widgets/qbtOrchestrator/features/overtime/utils/overtimeMutationUtils',
  () => {
    const actual = jest.requireActual(
      'src/js/widgets/qbtOrchestrator/features/overtime/utils/overtimeMutationUtils',
    );
    return {
      ...actual,
      detectWorkerReassignmentConflicts: jest.fn(() => ({
        hasConflicts: false,
        conflictingWorkerIds: [],
      })),
    };
  },
);

describe('OvertimeLandingPageTrowserContainer', () => {
  const mockSandbox = getDefaultSandbox();
  const mockOnClose = jest.fn();
  let store: ReturnType<typeof createQbtOrchestratorStore>;

  beforeEach(() => {
    jest.clearAllMocks();
    store = createQbtOrchestratorStore();
  });

  const renderComponent = () =>
    renderWithQuicksandReduxAndLogging(
      <OvertimeLandingPageTrowserContainer onClose={mockOnClose} />,
      store,
      mockSandbox,
    );

  describe('when trowser is closed', () => {
    it('should not render trowser content', () => {
      renderComponent();
      expect(screen.queryByTestId('trowser')).not.toBeInTheDocument();
    });
  });

  describe('when trowser is open', () => {
    beforeEach(() => {
      store.dispatch(setShowLandingPage(true));
    });

    it('should render the trowser', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('trowser')).toBeInTheDocument();
      });
    });

    it('should log LANDING_PAGE_MOUNTED when opened', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockSandbox.logger.info).toHaveBeenCalledWith(
          expect.stringContaining(OVERTIME_LOGGING.LANDING_PAGE_MOUNTED),
          undefined,
        );
      });
    });

    it('should render empty state when no policies exist', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByTestId('setup-overtime-policy-button'),
        ).toBeInTheDocument();
      });
    });

    it('should render filled state when policies exist', async () => {
      renderComponent();

      // Wait for initial render, then set policies (useEffect clears them first)
      await waitFor(() => {
        expect(screen.getByTestId('trowser')).toBeInTheDocument();
      });

      // Now set policies after the initial useEffect has run
      store.dispatch(
        setPolicies([
          {
            id: '1',
            name: 'Policy 1',
            description: '',
            isDefault: false,
            assignments: {
              values: [
                {
                  id: 'w1',
                  entityType: 'all',
                  entityId: 'all',
                  entityName: 'All Workers',
                },
              ],
            },
            rules: {
              values: [
                {
                  name: 'Weekly Overtime',
                  type: 'weekly',
                  frequency: 'WEEKLY',
                  multiplier: 1.5,
                  conditions: [{ field: 'threshold', value: '40' }],
                  enabled: true,
                },
              ],
            },
          },
        ]),
      );

      await waitFor(() => {
        expect(screen.getByTestId('overtime-filled-state')).toBeInTheDocument();
      });
    });

    it('should render learn more link', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByText(/NLS overtime.landing.header.learn.more/i),
        ).toBeInTheDocument();
      });
    });

    it('should render check laws link', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByText(/NLS overtime.landing.header.link.action/i),
        ).toBeInTheDocument();
      });
    });

    it('does not dispatch state updates after component unmounts mid-fetch', async () => {
      let resolveLoad!: (val: any) => void;
      mockFetchPolicies.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveLoad = resolve;
        }),
      );

      const { unmount } = renderComponent();

      // loadingPolicies is set to true synchronously before the await
      await waitFor(() => {
        expect((store.getState() as any).overtime.isLoadingPolicies).toBe(true);
      });

      // Unmount cancels the effect
      unmount();

      // Resolve the fetch after unmount
      resolveLoad({ policies: [], pageInfo: {} });
      await new Promise((r) => setTimeout(r, 0));

      // isLoadingPolicies should remain true — cancelled flag prevented the finally dispatch
      expect((store.getState() as any).overtime.isLoadingPolicies).toBe(true);
    });
  });

  describe('user interactions', () => {
    beforeEach(() => {
      store.dispatch(setShowLandingPage(true));
    });

    it('should navigate back to listing when trowser close is clicked from policy details', async () => {
      store.dispatch(setShowPolicyDetails(true));
      store.dispatch(setSelectedPolicyId('policy-123'));
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('trowser-close')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('trowser-close'));

      expect(mockOnClose).not.toHaveBeenCalled();
      await waitFor(() => {
        const state = store.getState() as any;
        expect(state.overtime.showLandingPage).toBe(true);
        expect(state.overtime.showPolicyDetails).toBe(false);
        expect(state.overtime.selectedPolicyId).toBeNull();
      });
    });

    it('should close trowser when close is clicked from listing screen', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('trowser-close')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('trowser-close'));

      expect(mockOnClose).toHaveBeenCalled();
      await waitFor(() => {
        const state = store.getState() as any;
        expect(state.overtime.showLandingPage).toBe(false);
      });
    });

    it('should log LANDING_PAGE_LEARN_MORE_CLICKED when learn more is clicked', async () => {
      renderComponent();

      await waitFor(() => {
        const learnMoreLink = screen.getByText(
          /NLS overtime.landing.header.learn.more/i,
        );
        expect(learnMoreLink).toBeInTheDocument();
      });

      const learnMoreLink = screen.getByText(
        /NLS overtime.landing.header.learn.more/i,
      );
      fireEvent.click(learnMoreLink);

      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        expect.stringContaining(
          OVERTIME_LOGGING.LANDING_PAGE_LEARN_MORE_CLICKED,
        ),
        undefined,
      );
    });

    it('should log LANDING_PAGE_CHECK_LAWS_CLICKED when check laws is clicked', async () => {
      renderComponent();

      await waitFor(() => {
        const checkLawsLink = screen.getByText(
          /NLS overtime.landing.header.link.action/i,
        );
        expect(checkLawsLink).toBeInTheDocument();
      });

      const checkLawsLink = screen.getByText(
        /NLS overtime.landing.header.link.action/i,
      );
      fireEvent.click(checkLawsLink);

      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        expect.stringContaining(
          OVERTIME_LOGGING.LANDING_PAGE_CHECK_LAWS_CLICKED,
        ),
        undefined,
      );
    });

    it('should show wizard and log when create policy button is clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByTestId('setup-overtime-policy-button'),
        ).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('setup-overtime-policy-button'));

      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        expect.stringContaining(
          OVERTIME_LOGGING.LANDING_PAGE_CREATE_POLICY_CLICKED,
        ),
        undefined,
      );

      await waitFor(() => {
        const state = store.getState() as any;
        expect(state.overtime.showWizard).toBe(true);
      });
    });

    it('should log when edit policy is clicked in filled state', async () => {
      renderComponent();

      // Wait for initial render, then set policies
      await waitFor(() => {
        expect(screen.getByTestId('trowser')).toBeInTheDocument();
      });

      store.dispatch(
        setPolicies([
          {
            id: '1',
            name: 'Policy 1',
            description: '',
            isDefault: false,
            assignments: {
              values: [
                {
                  id: 'w1',
                  entityType: 'all',
                  entityId: 'all',
                  entityName: 'All Workers',
                },
              ],
            },
            rules: {
              values: [
                {
                  name: 'Weekly Overtime',
                  type: 'weekly',
                  frequency: 'WEEKLY',
                  multiplier: 1.5,
                  conditions: [{ field: 'threshold', value: '40' }],
                  enabled: true,
                },
              ],
            },
          },
        ]),
      );

      await waitFor(() => {
        expect(screen.getByTestId('filled-edit-button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('filled-edit-button'));

      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        expect.stringContaining(
          OVERTIME_LOGGING.LANDING_PAGE_EDIT_POLICY_CLICKED,
        ),
        { policyId: '1' },
      );
    });
  });

  describe('wizard interactions', () => {
    beforeEach(() => {
      store.dispatch(setShowLandingPage(true));
      store.dispatch(setShowWizard(true));
    });

    it('should render wizard when showWizard is true', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('policy-setup-wizard')).toBeInTheDocument();
      });
    });

    it('should not render empty state when wizard is shown', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('policy-setup-wizard')).toBeInTheDocument();
      });

      expect(
        screen.queryByTestId('setup-overtime-policy-button'),
      ).not.toBeInTheDocument();
    });

    it('should reset wizard state when wizard cancel is clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('wizard-cancel')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('wizard-cancel'));

      await waitFor(() => {
        const state = store.getState() as any;
        expect(state.overtime.showWizard).toBe(false);
      });
    });

    it('should create policy and reset wizard when next is clicked on REVIEW step', async () => {
      // Set up mocks for successful policy creation flow
      mockCreateOvertimePolicy.mockResolvedValue({
        success: true,
        data: { id: 'new-policy-id', name: 'Test Policy' },
      });
      mockManageOvertimePolicyAssignments.mockResolvedValue({
        success: true,
        data: { id: 'new-policy-id' },
      });

      // Set wizard to REVIEW step so clicking next triggers the policy creation log
      store.dispatch(setWizardCurrentStep(WizardStepId.REVIEW));
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('wizard-next')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('wizard-next'));

      await waitFor(() => {
        expect(mockCreateOvertimePolicy).toHaveBeenCalled();
      });

      await waitFor(() => {
        const state = store.getState() as any;
        // After clicking next on REVIEW step, wizard should be reset
        expect(state.overtime.showWizard).toBe(false);
      });
    });
  });

  describe('back button', () => {
    describe('when wizard is shown', () => {
      beforeEach(() => {
        store.dispatch(setShowLandingPage(true));
        store.dispatch(setShowWizard(true));
      });

      it('should render the back button with correct aria-label', async () => {
        renderComponent();

        await waitFor(() => {
          expect(
            screen.getByRole('button', {
              name: /NLS overtime.wizard.backToPolicies.aria/i,
            }),
          ).toBeInTheDocument();
        });
      });

      it('should display "Overtime policies" label text in the back button', async () => {
        renderComponent();

        await waitFor(() => {
          expect(
            screen.getByText(/NLS overtime.wizard.backToPolicies/i),
          ).toBeInTheDocument();
        });
      });

      it('should render ChevronLeft icon inside the back button', async () => {
        renderComponent();

        await waitFor(() => {
          expect(screen.getByTestId('chevron-left-icon')).toBeInTheDocument();
        });
      });

      it('should reset wizard state and hide wizard when back button is clicked', async () => {
        renderComponent();

        await waitFor(() => {
          expect(
            screen.getByRole('button', {
              name: /NLS overtime.wizard.backToPolicies.aria/i,
            }),
          ).toBeInTheDocument();
        });

        fireEvent.click(
          screen.getByRole('button', {
            name: /NLS overtime.wizard.backToPolicies.aria/i,
          }),
        );

        await waitFor(() => {
          const state = store.getState() as any;
          expect(state.overtime.showWizard).toBe(false);
        });
      });
    });

    describe('when wizard is not shown', () => {
      beforeEach(() => {
        store.dispatch(setShowLandingPage(true));
      });

      it('should not render the back button', async () => {
        renderComponent();

        await waitFor(() => {
          expect(screen.getByTestId('trowser')).toBeInTheDocument();
        });

        expect(
          screen.queryByRole('button', {
            name: /NLS overtime.wizard.backToPolicies.aria/i,
          }),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('mutation flow testing', () => {
    // Helper to setup wizard for create mode
    const setupCreateWizard = () => {
      store.dispatch(setShowLandingPage(true));
      store.dispatch(setShowWizard(true));
      store.dispatch(setPolicyName('Test Policy'));
      store.dispatch(setOvertimeRuleType('basic'));
      store.dispatch(
        setOvertimeRules([
          {
            name: 'Weekly Overtime',
            type: 'weekly',
            frequency: 'WEEKLY',
            multiplier: 1.5,
            conditions: [{ field: 'threshold', value: '40' }],
            enabled: true,
          },
        ]),
      );
      store.dispatch(setPolicyMemberIds(['user-1', 'user-2']));
    };

    // Helper to setup wizard for edit mode
    const setupEditWizard = (
      startStep: WizardStepId,
      currentStep?: WizardStepId,
    ) => {
      store.dispatch(setShowLandingPage(true));
      store.dispatch(
        initializeWizardForEdit({
          policyId: 'policy-123',
          name: 'Test Policy',
          description: 'Test Description',
          isDefault: false,
          rules: [
            {
              name: 'Weekly Overtime',
              type: 'weekly',
              frequency: 'WEEKLY',
              multiplier: 1.5,
              conditions: [{ field: 'threshold', value: '40' }],
              enabled: true,
            },
          ],
          ruleType: 'basic',
          memberIds: ['user-1'],
          startStep,
          origin: 'policyDetails',
        }),
      );
      if (currentStep && currentStep !== startStep) {
        store.dispatch(setWizardCurrentStep(currentStep));
      }
    };

    describe('Flow 1: Create Policy', () => {
      beforeEach(() => {
        mockCreateOvertimePolicy.mockResolvedValue({
          success: true,
          data: { id: 'new-policy-id', name: 'Test Policy' },
        });
        mockManageOvertimePolicyAssignments.mockResolvedValue({
          success: true,
          data: { id: 'new-policy-id' },
        });
      });

      it('should call createOvertimePolicy when submitting from REVIEW step in create mode', async () => {
        setupCreateWizard();
        store.dispatch(setWizardCurrentStep(WizardStepId.REVIEW));
        renderComponent();

        await waitFor(() => {
          expect(screen.getByTestId('wizard-next')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('wizard-next'));

        await waitFor(() => {
          expect(mockCreateOvertimePolicy).toHaveBeenCalled();
        });
      });

      it('should call manageOvertimePolicyAssignments after createOvertimePolicy when members are assigned', async () => {
        setupCreateWizard();
        store.dispatch(setWizardCurrentStep(WizardStepId.REVIEW));
        renderComponent();

        await waitFor(() => {
          expect(screen.getByTestId('wizard-next')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('wizard-next'));

        await waitFor(() => {
          expect(mockCreateOvertimePolicy).toHaveBeenCalled();
        });

        await waitFor(() => {
          expect(mockManageOvertimePolicyAssignments).toHaveBeenCalledWith(
            'new-policy-id',
            expect.any(Object),
          );
        });
      });
    });

    describe('Flow 2: View Review (no changes)', () => {
      it('should NOT call any mutations when viewing review and clicking close', async () => {
        setupEditWizard(WizardStepId.REVIEW, WizardStepId.REVIEW);
        renderComponent();

        await waitFor(() => {
          expect(screen.getByTestId('wizard-next')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('wizard-next'));

        // Give time for any async operations
        await waitFor(() => {
          const state = store.getState() as any;
          // Wizard should close without mutations
          expect(state.overtime.showWizard).toBe(false);
        });

        expect(mockCreateOvertimePolicy).not.toHaveBeenCalled();
        expect(mockUpdateOvertimePolicy).not.toHaveBeenCalled();
        expect(mockManageOvertimePolicyAssignments).not.toHaveBeenCalled();
      });
    });

    describe('Flow 3: Assign Workers (startStep=POLICY_MEMBERS)', () => {
      beforeEach(() => {
        mockManageOvertimePolicyAssignments.mockResolvedValue({
          success: true,
          data: { id: 'policy-123' },
        });
      });

      it('should call manageOvertimePolicyAssignments only when saving from POLICY_MEMBERS step', async () => {
        setupEditWizard(WizardStepId.POLICY_MEMBERS);
        // Mark assignments as dirty to trigger mutation
        store.dispatch(setAssignmentsDirty(true));
        store.dispatch(setPolicyMemberIds(['user-1', 'user-2', 'user-3']));
        renderComponent();

        await waitFor(() => {
          expect(screen.getByTestId('wizard-next')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('wizard-next'));

        await waitFor(() => {
          expect(mockManageOvertimePolicyAssignments).toHaveBeenCalled();
        });

        expect(mockCreateOvertimePolicy).not.toHaveBeenCalled();
        expect(mockUpdateOvertimePolicy).not.toHaveBeenCalled();
      });
    });

    describe('Flow 4: Edit Policy Name from Review', () => {
      beforeEach(() => {
        mockUpdateOvertimePolicy.mockResolvedValue({
          success: true,
          data: { id: 'policy-123', name: 'Updated Policy' },
        });
      });

      it('should call updateOvertimePolicy only when saving from POLICY_NAME step after starting at REVIEW', async () => {
        setupEditWizard(WizardStepId.REVIEW, WizardStepId.POLICY_NAME);
        // Update the policy name
        store.dispatch(setPolicyName('Updated Policy Name'));
        renderComponent();

        await waitFor(() => {
          expect(screen.getByTestId('wizard-next')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('wizard-next'));

        await waitFor(() => {
          expect(mockUpdateOvertimePolicy).toHaveBeenCalled();
        });

        expect(mockCreateOvertimePolicy).not.toHaveBeenCalled();
        expect(mockManageOvertimePolicyAssignments).not.toHaveBeenCalled();
      });
    });

    describe('Flow 5: Edit Policy Rules from Review', () => {
      beforeEach(() => {
        mockUpdateOvertimePolicy.mockResolvedValue({
          success: true,
          data: { id: 'policy-123', name: 'Test Policy' },
        });
      });

      it('should call updateOvertimePolicy only when saving from OVERTIME_RULES step after starting at REVIEW', async () => {
        setupEditWizard(WizardStepId.REVIEW, WizardStepId.OVERTIME_RULES);
        // Update rules
        store.dispatch(setOvertimeRuleType('california'));
        renderComponent();

        await waitFor(() => {
          expect(screen.getByTestId('wizard-next')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('wizard-next'));

        await waitFor(() => {
          expect(mockUpdateOvertimePolicy).toHaveBeenCalled();
        });

        expect(mockCreateOvertimePolicy).not.toHaveBeenCalled();
        expect(mockManageOvertimePolicyAssignments).not.toHaveBeenCalled();
      });
    });

    describe('Flow 6: Edit Policy Members from Review', () => {
      beforeEach(() => {
        mockManageOvertimePolicyAssignments.mockResolvedValue({
          success: true,
          data: { id: 'policy-123' },
        });
      });

      it('should call manageOvertimePolicyAssignments only when saving from POLICY_MEMBERS step after starting at REVIEW', async () => {
        setupEditWizard(WizardStepId.REVIEW, WizardStepId.POLICY_MEMBERS);
        // Mark assignments as dirty and update members
        store.dispatch(setAssignmentsDirty(true));
        store.dispatch(setPolicyMemberIds(['user-1', 'user-2', 'user-new']));
        renderComponent();

        await waitFor(() => {
          expect(screen.getByTestId('wizard-next')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('wizard-next'));

        await waitFor(() => {
          expect(mockManageOvertimePolicyAssignments).toHaveBeenCalled();
        });

        expect(mockCreateOvertimePolicy).not.toHaveBeenCalled();
        expect(mockUpdateOvertimePolicy).not.toHaveBeenCalled();
      });
    });

    describe('error handling in handleWizardNext', () => {
      it('should return early when createOvertimePolicy fails (no success)', async () => {
        mockCreateOvertimePolicy.mockResolvedValue({
          success: false,
          error: 'Create failed',
        });
        setupCreateWizard();
        store.dispatch(setWizardCurrentStep(WizardStepId.REVIEW));
        renderComponent();

        await waitFor(() => {
          expect(screen.getByTestId('wizard-next')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('wizard-next'));

        await waitFor(() => {
          expect(mockCreateOvertimePolicy).toHaveBeenCalled();
        });

        // Wizard should remain open (returned early on error)
        await waitFor(() => {
          const state = store.getState() as any;
          expect(state.overtime.showWizard).toBe(true);
        });
      });

      it('should return early and show error when create assignment fails', async () => {
        mockCreateOvertimePolicy.mockResolvedValue({
          success: true,
          data: { id: 'new-policy-id', name: 'Test Policy' },
        });
        mockManageOvertimePolicyAssignments.mockResolvedValue({
          success: false,
          error: 'Assignment failed',
        });
        setupCreateWizard();
        store.dispatch(setWizardCurrentStep(WizardStepId.REVIEW));
        renderComponent();

        await waitFor(() => {
          expect(screen.getByTestId('wizard-next')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('wizard-next'));

        await waitFor(() => {
          expect(mockCreateOvertimePolicy).toHaveBeenCalled();
          expect(mockManageOvertimePolicyAssignments).toHaveBeenCalledWith(
            'new-policy-id',
            expect.any(Object),
          );
        });

        await waitFor(() => {
          expect(
            screen.getByTestId('overtime-wizard-operation-error-banner'),
          ).toBeInTheDocument();
        });

        await waitFor(() => {
          const state = store.getState() as any;
          expect(state.overtime.showWizard).toBe(true);
        });
      });

      it('should navigate to next step when in create mode on non-REVIEW step', async () => {
        setupCreateWizard();
        store.dispatch(setWizardCurrentStep(WizardStepId.POLICY_NAME));
        renderComponent();

        await waitFor(() => {
          expect(screen.getByTestId('wizard-next')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('wizard-next'));

        await waitFor(() => {
          const state = store.getState() as any;
          expect(state.overtime.wizardCurrentStep).toBe(
            WizardStepId.OVERTIME_RULES,
          );
        });
        expect(mockCreateOvertimePolicy).not.toHaveBeenCalled();
      });

      it('should return early when edit mode has no policyFormData.id', async () => {
        store.dispatch(setShowLandingPage(true));
        store.dispatch(setShowWizard(true));
        // Set wizard to edit mode without a policy ID
        store.dispatch(setWizardEditMode(true));
        store.dispatch(setWizardCurrentStep(WizardStepId.REVIEW));
        renderComponent();

        await waitFor(() => {
          expect(screen.getByTestId('wizard-next')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('wizard-next'));

        // No mutations should have been called since no policy id
        await waitFor(() => {
          expect(mockUpdateOvertimePolicy).not.toHaveBeenCalled();
        });
        expect(mockCreateOvertimePolicy).not.toHaveBeenCalled();
      });

      it('should return early when Flow 3 assignment fails', async () => {
        mockManageOvertimePolicyAssignments.mockResolvedValue({
          success: false,
          error: 'Assignment error',
        });
        setupEditWizard(WizardStepId.POLICY_MEMBERS);
        store.dispatch(setAssignmentsDirty(true));
        store.dispatch(setPolicyMemberIds(['user-1', 'user-2', 'user-new']));
        renderComponent();

        await waitFor(() => {
          expect(screen.getByTestId('wizard-next')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('wizard-next'));

        await waitFor(() => {
          expect(mockManageOvertimePolicyAssignments).toHaveBeenCalled();
        });

        // Wizard should NOT return to policy details (early return on error)
        await waitFor(() => {
          const state = store.getState() as any;
          expect(state.overtime.showPolicyDetails).toBe(false);
        });
      });

      it('should return early when Flow 6 (members from review) assignment fails', async () => {
        mockManageOvertimePolicyAssignments.mockResolvedValue({
          success: false,
          error: 'Assignment error',
        });
        setupEditWizard(WizardStepId.REVIEW, WizardStepId.POLICY_MEMBERS);
        store.dispatch(setAssignmentsDirty(true));
        store.dispatch(setPolicyMemberIds(['user-1', 'user-2', 'user-new']));
        renderComponent();

        await waitFor(() => {
          expect(screen.getByTestId('wizard-next')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('wizard-next'));

        await waitFor(() => {
          expect(mockManageOvertimePolicyAssignments).toHaveBeenCalled();
        });

        // Current step should NOT advance back to REVIEW since there was an error
        await waitFor(() => {
          const state = store.getState() as any;
          expect(state.overtime.wizardCurrentStep).toBe(
            WizardStepId.POLICY_MEMBERS,
          );
        });
      });

      it('should return early when Flows 4-5 update policy fails', async () => {
        mockUpdateOvertimePolicy.mockResolvedValue({
          success: false,
          error: 'Update error',
        });
        setupEditWizard(WizardStepId.REVIEW, WizardStepId.POLICY_NAME);
        store.dispatch(setPolicyName('Updated Policy Name'));
        renderComponent();

        await waitFor(() => {
          expect(screen.getByTestId('wizard-next')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('wizard-next'));

        await waitFor(() => {
          expect(mockUpdateOvertimePolicy).toHaveBeenCalled();
        });

        // Current step should NOT return to REVIEW since there was an error
        await waitFor(() => {
          const state = store.getState() as any;
          expect(state.overtime.wizardCurrentStep).toBe(
            WizardStepId.POLICY_NAME,
          );
        });
      });
    });

    describe('Default edit mode (full update flow)', () => {
      beforeEach(() => {
        mockUpdateOvertimePolicy.mockResolvedValue({
          success: true,
          data: { id: 'policy-123', name: 'Test Policy' },
        });
        mockManageOvertimePolicyAssignments.mockResolvedValue({
          success: true,
          data: { id: 'policy-123' },
        });
      });

      it('should call updateOvertimePolicy when edit mode, no specific startStep, on REVIEW step', async () => {
        // Use a different startStep (not POLICY_MEMBERS, not REVIEW) to reach the default flow
        setupEditWizard(WizardStepId.POLICY_NAME, WizardStepId.REVIEW);
        renderComponent();

        await waitFor(() => {
          expect(screen.getByTestId('wizard-next')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('wizard-next'));

        await waitFor(() => {
          expect(mockUpdateOvertimePolicy).toHaveBeenCalled();
        });
      });

      it('should navigate to next step in default edit mode when not on REVIEW step', async () => {
        setupEditWizard(WizardStepId.POLICY_NAME, WizardStepId.OVERTIME_RULES);
        // Set currentStep to OVERTIME_RULES (not REVIEW), startStep to POLICY_NAME
        renderComponent();

        await waitFor(() => {
          expect(screen.getByTestId('wizard-next')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('wizard-next'));

        await waitFor(() => {
          const state = store.getState() as any;
          expect(state.overtime.wizardCurrentStep).toBe(
            WizardStepId.POLICY_MEMBERS,
          );
        });
        expect(mockUpdateOvertimePolicy).not.toHaveBeenCalled();
      });

      it('should return early when default edit mode updateOvertimePolicy fails', async () => {
        mockUpdateOvertimePolicy.mockResolvedValue({
          success: false,
          error: 'Update error',
        });
        setupEditWizard(WizardStepId.POLICY_NAME, WizardStepId.REVIEW);
        renderComponent();

        await waitFor(() => {
          expect(screen.getByTestId('wizard-next')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('wizard-next'));

        await waitFor(() => {
          expect(mockUpdateOvertimePolicy).toHaveBeenCalled();
        });

        // Wizard should remain open
        await waitFor(() => {
          const state = store.getState() as any;
          expect(state.overtime.showWizard).toBe(true);
        });
        expect(mockManageOvertimePolicyAssignments).not.toHaveBeenCalled();
      });

      it('should call manageOvertimePolicyAssignments in default edit mode when assignments changed', async () => {
        setupEditWizard(WizardStepId.POLICY_NAME, WizardStepId.REVIEW);
        store.dispatch(setAssignmentsDirty(true));
        store.dispatch(setPolicyMemberIds(['user-1', 'user-2', 'user-new']));
        renderComponent();

        await waitFor(() => {
          expect(screen.getByTestId('wizard-next')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('wizard-next'));

        await waitFor(() => {
          expect(mockUpdateOvertimePolicy).toHaveBeenCalled();
        });

        await waitFor(() => {
          expect(mockManageOvertimePolicyAssignments).toHaveBeenCalled();
        });
      });
    });
  });

  describe('wizard navigation', () => {
    beforeEach(() => {
      store.dispatch(setShowLandingPage(true));
      store.dispatch(setShowWizard(true));
      store.dispatch(setWizardCurrentStep(WizardStepId.OVERTIME_RULES));
    });

    it('should go to previous step when wizard back is clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('wizard-back')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('wizard-back'));

      await waitFor(() => {
        const state = store.getState() as any;
        expect(state.overtime.wizardCurrentStep).toBe(WizardStepId.POLICY_NAME);
      });
    });

    it('should set specified step when wizard edit step is called', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('wizard-edit-step')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('wizard-edit-step'));

      await waitFor(() => {
        const state = store.getState() as any;
        // onEditStep(1) was called, which maps to WizardStepId OVERTIME_RULES (1)
        expect(state.overtime.wizardCurrentStep).toBe(1);
      });
    });

    it('should skip POLICY_MEMBERS step when going back from REVIEW with basic policy', async () => {
      // Initialize wizard for edit with a basic policy
      store.dispatch(
        initializeWizardForEdit({
          policyId: 'basic_policy_abc123',
          name: 'Basic Policy',
          description: '',
          isDefault: false,
          rules: [],
          ruleType: 'basic',
          memberIds: [],
          startStep: WizardStepId.REVIEW,
          origin: 'policyDetails',
        }),
      );
      store.dispatch(setWizardCurrentStep(WizardStepId.REVIEW));
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('wizard-back')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('wizard-back'));

      await waitFor(() => {
        const state = store.getState() as any;
        // Should skip POLICY_MEMBERS and go directly to OVERTIME_RULES
        expect(state.overtime.wizardCurrentStep).toBe(
          WizardStepId.OVERTIME_RULES,
        );
      });
    });

    it('should skip POLICY_MEMBERS step when going back from REVIEW with default policy', async () => {
      store.dispatch(setWizardCurrentStep(WizardStepId.REVIEW));
      store.dispatch(setPolicyIsDefault(true));
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('wizard-back')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('wizard-back'));

      await waitFor(() => {
        const state = store.getState() as any;
        // Should skip POLICY_MEMBERS and go directly to OVERTIME_RULES
        expect(state.overtime.wizardCurrentStep).toBe(
          WizardStepId.OVERTIME_RULES,
        );
      });
    });

    it('should go to POLICY_MEMBERS step when going back from REVIEW with non-basic policy', async () => {
      store.dispatch(setWizardCurrentStep(WizardStepId.REVIEW));
      store.dispatch(setPolicyIsDefault(false));
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('wizard-back')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('wizard-back'));

      await waitFor(() => {
        const state = store.getState() as any;
        // Should go to POLICY_MEMBERS since it's not a default or basic policy
        expect(state.overtime.wizardCurrentStep).toBe(
          WizardStepId.POLICY_MEMBERS,
        );
      });
    });

    it('should navigate back to listing when trowser close is clicked from wizard with listing origin', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('trowser-close')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('trowser-close'));

      expect(mockOnClose).not.toHaveBeenCalled();
      await waitFor(() => {
        const state = store.getState() as any;
        expect(state.overtime.showWizard).toBe(false);
        expect(state.overtime.showPolicyDetails).toBe(false);
        expect(state.overtime.showLandingPage).toBe(true);
      });
    });
  });

  describe('policy details navigation', () => {
    beforeEach(() => {
      store.dispatch(setShowLandingPage(true));
      store.dispatch(setShowPolicyDetails(true));
      store.dispatch(setSelectedPolicyId('policy-xyz'));
    });

    it('should render policy details screen when showPolicyDetails is true', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('policy-details-screen')).toBeInTheDocument();
      });
    });

    it('should clear selectedPolicyId and hide policy details when back button is clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('policy-details-back')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('policy-details-back'));

      await waitFor(() => {
        const state = store.getState() as any;
        expect(state.overtime.showPolicyDetails).toBe(false);
        expect(state.overtime.selectedPolicyId).toBeNull();
      });
    });
  });

  describe('wizard back navigation from policyDetails origin', () => {
    beforeEach(() => {
      store.dispatch(setShowLandingPage(true));
      store.dispatch(
        initializeWizardForEdit({
          policyId: 'policy-123',
          name: 'Test Policy',
          description: '',
          isDefault: false,
          rules: [],
          ruleType: 'basic',
          memberIds: [],
          startStep: WizardStepId.REVIEW,
          origin: 'policyDetails',
        }),
      );
    });

    it('should show Back to policy label when wizardOrigin is policyDetails', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByRole('button', {
            name: /NLS overtime.wizard.backToDetails.aria/i,
          }),
        ).toBeInTheDocument();
      });
    });

    it('should return to policy details when back is clicked from policyDetails origin', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('wizard-cancel')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('wizard-cancel'));

      await waitFor(() => {
        const state = store.getState() as any;
        expect(state.overtime.showWizard).toBe(false);
        expect(state.overtime.showPolicyDetails).toBe(true);
      });
    });

    it('should return to policy details when trowser close is clicked from policyDetails origin', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('trowser-close')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('trowser-close'));

      expect(mockOnClose).not.toHaveBeenCalled();
      await waitFor(() => {
        const state = store.getState() as any;
        expect(state.overtime.showWizard).toBe(false);
        expect(state.overtime.showPolicyDetails).toBe(true);
        expect(state.overtime.showLandingPage).toBe(true);
      });
    });
  });

  describe('refetch policies flow', () => {
    it('should refetch policies and reset refetchPolicies flag when refetchPolicies is set', async () => {
      store.dispatch(setShowLandingPage(true));
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('trowser')).toBeInTheDocument();
      });

      // Trigger refetch
      store.dispatch(setRefetchPolicies(true));

      await waitFor(() => {
        const state = store.getState() as any;
        expect(state.overtime.refetchPolicies).toBe(false);
      });

      // fetchPolicies should have been called at least twice (once for open, once for refetch)
      expect(mockFetchPolicies).toHaveBeenCalledTimes(2);
    });

    it('should handle refetch error gracefully', async () => {
      mockFetchPolicies
        .mockResolvedValueOnce({
          policies: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            totalCount: 0,
          },
        })
        .mockRejectedValueOnce(new Error('Refetch failed'));

      store.dispatch(setShowLandingPage(true));
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('trowser')).toBeInTheDocument();
      });

      store.dispatch(setRefetchPolicies(true));

      await waitFor(() => {
        const state = store.getState() as any;
        expect(state.overtime.refetchPolicies).toBe(false);
      });
    });
  });

  describe('fetch policies error handling', () => {
    it('should handle fetchPolicies error on open and set error state', async () => {
      mockFetchPolicies.mockRejectedValueOnce(new Error('Fetch failed'));

      store.dispatch(setShowLandingPage(true));
      renderComponent();

      await waitFor(() => {
        expect(mockSandbox.logger.error).toHaveBeenCalledWith(
          expect.stringContaining(OVERTIME_LOGGING.API_FETCH_POLICIES_FAILED),
          expect.objectContaining({ error: expect.any(Error) }),
        );
      });
    });
  });

  describe('handlePageChange', () => {
    it('should call fetchPage and update policies on page change', async () => {
      const pagedPolicies = [
        {
          id: '2',
          name: 'Policy 2',
          description: '',
          isDefault: false,
          assignments: { values: [] },
          rules: { values: [] },
        },
      ];
      mockFetchPage.mockResolvedValueOnce({
        policies: pagedPolicies,
        pageInfo: { hasNextPage: false, hasPreviousPage: true, totalCount: 2 },
      });

      store.dispatch(setShowLandingPage(true));
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('trowser')).toBeInTheDocument();
      });

      // Set policies so filled state is shown
      store.dispatch(
        setPolicies([
          {
            id: '1',
            name: 'Policy 1',
            description: '',
            isDefault: false,
            assignments: { values: [] },
            rules: { values: [] },
          },
        ]),
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('filled-page-change-button'),
        ).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('filled-page-change-button'));

      await waitFor(() => {
        expect(mockFetchPage).toHaveBeenCalledWith(2);
      });
    });

    it('should handle fetchPage error gracefully', async () => {
      mockFetchPage.mockRejectedValueOnce(new Error('Page fetch failed'));

      store.dispatch(setShowLandingPage(true));
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('trowser')).toBeInTheDocument();
      });

      store.dispatch(
        setPolicies([
          {
            id: '1',
            name: 'Policy 1',
            description: '',
            isDefault: false,
            assignments: { values: [] },
            rules: { values: [] },
          },
        ]),
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('filled-page-change-button'),
        ).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('filled-page-change-button'));

      await waitFor(() => {
        expect(mockSandbox.logger.error).toHaveBeenCalledWith(
          expect.stringContaining(OVERTIME_LOGGING.API_FETCH_POLICIES_FAILED),
          expect.objectContaining({ error: expect.any(Error), page: 2 }),
        );
      });
    });
  });

  describe('error handling UI', () => {
    // Helper to setup wizard for create mode
    const setupCreateWizard = () => {
      store.dispatch(setShowLandingPage(true));
      store.dispatch(setShowWizard(true));
      store.dispatch(setPolicyName('Test Policy'));
      store.dispatch(setOvertimeRuleType('basic'));
      store.dispatch(
        setOvertimeRules([
          {
            name: 'Weekly Overtime',
            type: 'weekly',
            frequency: 'WEEKLY',
            multiplier: 1.5,
            conditions: [{ field: 'threshold', value: '40' }],
            enabled: true,
          },
        ]),
      );
      store.dispatch(setPolicyMemberIds(['user-1', 'user-2']));
    };

    it('shows fetch error banner when Redux error state is set', async () => {
      store.dispatch(setShowLandingPage(true));
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('trowser')).toBeInTheDocument();
      });

      store.dispatch(setError('Something went wrong'));

      await waitFor(() => {
        expect(
          screen.getByTestId('overtime-fetch-error-banner'),
        ).toBeInTheDocument();
      });

      expect(
        screen.getByTestId('overtime-fetch-error-banner'),
      ).toHaveTextContent('Something went wrong');
    });

    it('dismisses fetch error banner when close is clicked', async () => {
      store.dispatch(setShowLandingPage(true));
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('trowser')).toBeInTheDocument();
      });

      store.dispatch(setError('Something went wrong'));

      await waitFor(() => {
        expect(
          screen.getByTestId('overtime-fetch-error-banner'),
        ).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('overtime-fetch-error-banner-close'));

      await waitFor(() => {
        expect(
          screen.queryByTestId('overtime-fetch-error-banner'),
        ).not.toBeInTheDocument();
      });
    });

    it('shows operation error banner when create policy fails', async () => {
      mockCreateOvertimePolicy.mockResolvedValue({
        success: false,
        error: 'Create failed',
      });
      setupCreateWizard();
      store.dispatch(setWizardCurrentStep(WizardStepId.REVIEW));
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('wizard-next')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('wizard-next'));

      await waitFor(() => {
        expect(
          screen.getByTestId('overtime-wizard-operation-error-banner'),
        ).toBeInTheDocument();
      });
    });

    it('shows operation error banner when update policy fails', async () => {
      mockUpdateOvertimePolicy.mockResolvedValue({
        success: false,
        error: 'Update error',
      });
      store.dispatch(setShowLandingPage(true));
      store.dispatch(
        initializeWizardForEdit({
          policyId: 'policy-123',
          name: 'Test Policy',
          description: '',
          isDefault: false,
          rules: [
            {
              name: 'Weekly Overtime',
              type: 'weekly',
              frequency: 'WEEKLY',
              multiplier: 1.5,
              conditions: [{ field: 'threshold', value: '40' }],
              enabled: true,
            },
          ],
          ruleType: 'basic',
          memberIds: ['user-1'],
          startStep: WizardStepId.REVIEW,
          origin: 'policyDetails',
        }),
      );
      store.dispatch(setWizardCurrentStep(WizardStepId.POLICY_NAME));
      store.dispatch(setPolicyName('Updated Policy Name'));
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('wizard-next')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('wizard-next'));

      await waitFor(() => {
        expect(
          screen.getByTestId('overtime-wizard-operation-error-banner'),
        ).toBeInTheDocument();
      });
    });

    it('uses intl for fetch error messages instead of hardcoded strings', async () => {
      mockFetchPolicies.mockRejectedValueOnce(new Error('Fetch failed'));

      store.dispatch(setShowLandingPage(true));
      renderComponent();

      await waitFor(() => {
        const state = store.getState() as any;
        expect(state.overtime.error).toContain('catch.all.error.content');
      });
    });

    it('dismisses operation error banner when close is clicked', async () => {
      mockCreateOvertimePolicy.mockResolvedValue({
        success: false,
        error: 'Create failed',
      });
      setupCreateWizard();
      store.dispatch(setWizardCurrentStep(WizardStepId.REVIEW));
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('wizard-next')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('wizard-next'));

      await waitFor(() => {
        expect(
          screen.getByTestId('overtime-wizard-operation-error-banner'),
        ).toBeInTheDocument();
      });

      fireEvent.click(
        screen.getByTestId('overtime-wizard-operation-error-banner-close'),
      );

      await waitFor(() => {
        expect(
          screen.queryByTestId('overtime-wizard-operation-error-banner'),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('worker reassignment conflicts', () => {
    beforeEach(() => {
      mockCreateOvertimePolicy.mockResolvedValue({
        success: true,
        data: { id: 'new-policy-id', name: 'Test Policy' },
      });
      mockManageOvertimePolicyAssignments.mockResolvedValue({
        success: true,
        data: { id: 'new-policy-id' },
      });
      mockUpdateOvertimePolicy.mockResolvedValue({
        success: true,
        data: { id: 'policy-123', name: 'Test Policy' },
      });
      // Clear the mock call history before each test while preserving default return value
      mockDetectWorkerReassignmentConflicts.mockClear();
    });

    const setupCreateWizardWithConflicts = () => {
      store.dispatch(setShowLandingPage(true));
      store.dispatch(setShowWizard({ show: true, origin: 'listing' }));
      store.dispatch(setPolicyName('Test Policy'));
      store.dispatch(setOvertimeRuleType('basic'));
      store.dispatch(
        setOvertimeRules([
          {
            name: 'Weekly Overtime',
            type: 'weekly',
            frequency: 'WEEKLY',
            multiplier: 1.5,
            conditions: [{ field: 'threshold', value: '40' }],
            enabled: true,
          },
        ]),
      );
      store.dispatch(setPolicyMemberIds(['user-1', 'user-2']));
      store.dispatch(setWizardCurrentStep(WizardStepId.REVIEW));
    };

    it('should proceed with policy creation when no conflicts are detected', async () => {
      mockDetectWorkerReassignmentConflicts.mockReturnValue({
        hasConflicts: false,
        conflictingWorkerIds: [],
      });
      setupCreateWizardWithConflicts();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('wizard-next')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('wizard-next'));

      await waitFor(() => {
        expect(mockCreateOvertimePolicy).toHaveBeenCalled();
      });
      expect(
        screen.queryByTestId('reassign-workers-modal'),
      ).not.toBeInTheDocument();
    });

    it('should show reassignment modal when conflicts are detected', async () => {
      mockDetectWorkerReassignmentConflicts.mockReturnValue({
        hasConflicts: true,
        conflictingWorkerIds: ['user-1'],
      });
      setupCreateWizardWithConflicts();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('wizard-next')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('wizard-next'));

      await waitFor(() => {
        expect(
          screen.getByTestId('reassign-workers-modal'),
        ).toBeInTheDocument();
      });
      expect(mockCreateOvertimePolicy).not.toHaveBeenCalled();
    });

    it('should show reassignment modal when creating a default policy while another default policy already exists', async () => {
      mockDetectWorkerReassignmentConflicts.mockReturnValue({
        hasConflicts: false,
        conflictingWorkerIds: [],
      });
      mockFetchPolicies.mockResolvedValueOnce({
        policies: [
          { id: 'existing-default-policy', isDefault: true },
          { id: 'non-default-policy', isDefault: false },
        ],
        pageInfo: { hasNextPage: false, hasPreviousPage: false, totalCount: 2 },
      });
      setupCreateWizardWithConflicts();
      store.dispatch(setPolicyIsDefault(true));
      store.dispatch(
        setPolicies([
          { id: 'existing-default-policy', isDefault: true },
          { id: 'non-default-policy', isDefault: false },
        ] as any),
      );
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('wizard-next')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('wizard-next'));

      await waitFor(() => {
        expect(
          screen.getByTestId('reassign-workers-modal'),
        ).toBeInTheDocument();
      });
      expect(mockCreateOvertimePolicy).not.toHaveBeenCalled();
      expect(mockDetectWorkerReassignmentConflicts).not.toHaveBeenCalled();
    });

    it('should close modal without mutating when cancel is clicked', async () => {
      mockDetectWorkerReassignmentConflicts.mockReturnValue({
        hasConflicts: true,
        conflictingWorkerIds: ['user-1'],
      });
      setupCreateWizardWithConflicts();
      renderComponent();

      fireEvent.click(screen.getByTestId('wizard-next'));
      await waitFor(() => {
        expect(
          screen.getByTestId('reassign-workers-modal'),
        ).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('reassign-modal-cancel'));

      await waitFor(() => {
        expect(
          screen.queryByTestId('reassign-workers-modal'),
        ).not.toBeInTheDocument();
      });
      expect(mockCreateOvertimePolicy).not.toHaveBeenCalled();
    });

    it('should execute mutation when modal confirm is clicked', async () => {
      mockDetectWorkerReassignmentConflicts
        .mockReturnValueOnce({
          hasConflicts: true,
          conflictingWorkerIds: ['user-1'],
        })
        .mockReturnValue({ hasConflicts: false, conflictingWorkerIds: [] });
      setupCreateWizardWithConflicts();
      renderComponent();

      fireEvent.click(screen.getByTestId('wizard-next'));
      await waitFor(() => {
        expect(
          screen.getByTestId('reassign-workers-modal'),
        ).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('reassign-modal-confirm'));

      await waitFor(() => {
        expect(mockCreateOvertimePolicy).toHaveBeenCalledTimes(1);
      });
      expect(
        screen.queryByTestId('reassign-workers-modal'),
      ).not.toBeInTheDocument();
    });

    it('should skip POLICY_MEMBERS step for default policies in create mode', async () => {
      store.dispatch(setShowLandingPage(true));
      store.dispatch(setShowWizard(true));
      store.dispatch(setPolicyName('Default Policy'));
      store.dispatch(setOvertimeRuleType('basic'));
      store.dispatch(
        setOvertimeRules([
          {
            name: 'Weekly Overtime',
            type: 'weekly',
            frequency: 'WEEKLY',
            multiplier: 1.5,
            conditions: [{ field: 'threshold', value: '40' }],
            enabled: true,
          },
        ]),
      );
      store.dispatch(setPolicyMemberIds([]));
      store.dispatch(setWizardCurrentStep(WizardStepId.OVERTIME_RULES));

      // Set policy as default
      store.dispatch(
        initializeWizardForEdit({
          policyId: 'default-policy',
          name: 'Default Policy',
          description: '',
          isDefault: true,
          rules: [],
          ruleType: 'basic',
          memberIds: [],
          startStep: WizardStepId.POLICY_NAME,
          origin: 'policyDetails',
        }),
      );
      store.dispatch(setWizardEditMode(false));
      store.dispatch(setWizardCurrentStep(WizardStepId.OVERTIME_RULES));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('wizard-next')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('wizard-next'));

      await waitFor(() => {
        const state = store.getState() as any;
        expect(state.overtime.wizardCurrentStep).toBe(WizardStepId.REVIEW);
      });
    });

    it('should skip back to OVERTIME_RULES when going back from REVIEW on default policy', async () => {
      store.dispatch(setShowLandingPage(true));
      store.dispatch(setShowWizard(true));

      // Set up default policy at REVIEW step
      store.dispatch(
        initializeWizardForEdit({
          policyId: 'default-policy',
          name: 'Default Policy',
          description: '',
          isDefault: true,
          rules: [],
          ruleType: 'basic',
          memberIds: [],
          startStep: WizardStepId.POLICY_NAME,
          origin: 'policyDetails',
        }),
      );
      store.dispatch(setWizardCurrentStep(WizardStepId.REVIEW));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('wizard-back')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('wizard-back'));

      await waitFor(() => {
        const state = store.getState() as any;
        expect(state.overtime.wizardCurrentStep).toBe(
          WizardStepId.OVERTIME_RULES,
        );
      });
    });

    it('should show reassignment modal in edit mode (POLICY_MEMBERS start step)', async () => {
      mockDetectWorkerReassignmentConflicts.mockReturnValue({
        hasConflicts: true,
        conflictingWorkerIds: ['user-1'],
      });

      store.dispatch(setShowLandingPage(true));
      store.dispatch(setShowWizard(true));
      store.dispatch(
        initializeWizardForEdit({
          policyId: 'policy-123',
          name: 'Test Policy',
          description: '',
          isDefault: false,
          rules: [],
          ruleType: 'basic',
          memberIds: ['user-1'],
          startStep: WizardStepId.POLICY_MEMBERS,
          origin: 'policyDetails',
        }),
      );
      store.dispatch(setPolicyMemberIds(['user-1', 'user-2']));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('wizard-next')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByTestId('wizard-next'));

      await waitFor(() => {
        expect(
          screen.getByTestId('reassign-workers-modal'),
        ).toBeInTheDocument();
      });
      expect(mockManageOvertimePolicyAssignments).not.toHaveBeenCalled();
    });

    it('should show reassignment modal when changing to default from POLICY_NAME with another default policy present', async () => {
      mockFetchPolicies.mockResolvedValueOnce({
        policies: [
          { id: 'policy-123', isDefault: false },
          { id: 'existing-default-policy', isDefault: true },
        ],
        pageInfo: { hasNextPage: false, hasPreviousPage: false, totalCount: 2 },
      });
      store.dispatch(setShowLandingPage(true));
      store.dispatch(
        setPolicies([
          { id: 'policy-123', isDefault: false },
          { id: 'existing-default-policy', isDefault: true },
        ] as any),
      );
      store.dispatch(
        initializeWizardForEdit({
          policyId: 'policy-123',
          name: 'Test Policy',
          description: '',
          isDefault: false,
          rules: [],
          ruleType: 'basic',
          memberIds: ['user-1'],
          startStep: WizardStepId.REVIEW,
          origin: 'policyDetails',
        }),
      );
      store.dispatch(setWizardCurrentStep(WizardStepId.POLICY_NAME));
      store.dispatch(setPolicyIsDefault(true));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('wizard-next')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('wizard-next'));

      await waitFor(() => {
        expect(
          screen.getByTestId('reassign-workers-modal'),
        ).toBeInTheDocument();
      });
      expect(mockUpdateOvertimePolicy).not.toHaveBeenCalled();
    });

    it('should trigger refetch when changing to default from POLICY_NAME and confirming modal', async () => {
      mockUpdateOvertimePolicy.mockResolvedValue({
        success: true,
        data: { id: 'policy-123', name: 'Test Policy' },
      });
      // First call is for initial load, second is for refetch after changing to default
      mockFetchPolicies
        .mockResolvedValueOnce({
          policies: [
            { id: 'policy-123', isDefault: false },
            { id: 'existing-default-policy', isDefault: true },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            totalCount: 2,
          },
        })
        .mockResolvedValueOnce({
          policies: [
            { id: 'policy-123', isDefault: true },
            { id: 'existing-default-policy', isDefault: false },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            totalCount: 2,
          },
        });
      store.dispatch(setShowLandingPage(true));
      store.dispatch(
        setPolicies([
          { id: 'policy-123', isDefault: false },
          { id: 'existing-default-policy', isDefault: true },
        ] as any),
      );
      store.dispatch(
        initializeWizardForEdit({
          policyId: 'policy-123',
          name: 'Test Policy',
          description: '',
          isDefault: false,
          rules: [],
          ruleType: 'basic',
          memberIds: ['user-1'],
          startStep: WizardStepId.REVIEW,
          origin: 'policyDetails',
        }),
      );
      store.dispatch(setWizardCurrentStep(WizardStepId.POLICY_NAME));
      store.dispatch(setPolicyIsDefault(true));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('wizard-next')).toBeInTheDocument();
      });

      // Record how many times fetchPolicies was called before our action
      const initialFetchCount = mockFetchPolicies.mock.calls.length;

      fireEvent.click(screen.getByTestId('wizard-next'));

      await waitFor(() => {
        expect(
          screen.getByTestId('reassign-workers-modal'),
        ).toBeInTheDocument();
      });

      // Confirm the modal
      fireEvent.click(screen.getByTestId('reassign-modal-confirm'));

      await waitFor(() => {
        expect(mockUpdateOvertimePolicy).toHaveBeenCalled();
      });

      // Verify refetch was triggered (fetchPolicies called again after update)
      await waitFor(() => {
        expect(mockFetchPolicies.mock.calls.length).toBeGreaterThan(
          initialFetchCount,
        );
      });

      // refetchPolicies should be reset to false after refetch completes
      await waitFor(() => {
        const state = store.getState() as any;
        expect(state.overtime.refetchPolicies).toBe(false);
      });
    });
  });
});

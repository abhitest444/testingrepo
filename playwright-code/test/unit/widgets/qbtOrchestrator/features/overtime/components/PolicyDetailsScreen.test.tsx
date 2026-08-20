import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import {
  getDefaultSandbox,
  renderWithQuicksandReduxAndLogging,
  createQbtOrchestratorStore,
} from 'test/unit/testUtils';
import { PolicyDetailsScreen } from 'src/js/widgets/qbtOrchestrator/features/overtime/components/PolicyDetailsScreen';
import { WizardStepId } from 'src/js/widgets/qbtOrchestrator/features/overtime/store/overtimeSlice';
import {
  createOvertimePolicy,
  createOvertimeRule,
  createAssignment,
} from 'test/unit/fixtures/overtimeFixtures';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('@payroll/quicksand', () => ({
  ...jest.requireActual('@payroll/quicksand'),
  useIntl: () => ({
    formatMessage: (
      { defaultMessage, id }: { defaultMessage?: string; id: string },
      values?: Record<string, any>,
    ) => {
      if (!defaultMessage) return id;
      if (!values) return defaultMessage;
      return defaultMessage.replace(/\{(\w+)\}/g, (_: string, key: string) =>
        String(values[key] ?? ''),
      );
    },
  }),
}));

jest.mock(
  'src/js/widgets/qbtOrchestrator/features/overtime/styles/OvertimeLandingPage.styled',
  () => ({
    TrowserContent: ({ children }: any) => (
      <div data-testid="trowser-content">{children}</div>
    ),
    PolicyDetailsContainer: ({ children }: any) => (
      <div data-testid="policy-details">{children}</div>
    ),
    PolicyHeader: ({ children }: any) => <div>{children}</div>,
    PolicyActionsRow: ({ children }: any) => (
      <div data-testid="policy-actions-row">{children}</div>
    ),
    PolicyActionsButtonGroup: ({ children }: any) => <div>{children}</div>,
    RulesSection: ({ children }: any) => (
      <div data-testid="rules-section">{children}</div>
    ),
  }),
);

jest.mock(
  'src/js/widgets/qbtOrchestrator/features/overtime/components/PolicySetupWizard/styles/PolicySetupWizard.styled',
  () => ({
    BackButtonContainer: ({ children }: any) => (
      <div data-testid="back-button-container">{children}</div>
    ),
    BackLink: ({ children, onClick, 'aria-label': ariaLabel }: any) => (
      <button data-testid="back-link" onClick={onClick} aria-label={ariaLabel}>
        {children}
      </button>
    ),
  }),
);

jest.mock('@ids-ts/typography', () => ({
  __esModule: true,
  default: ({ children }: any) => <span>{children}</span>,
}));

jest.mock('@ids-ts/button', () => ({
  __esModule: true,
  default: ({ children, onClick, 'data-testid': testId }: any) => (
    <button data-testid={testId} onClick={onClick}>
      {children}
    </button>
  ),
}));

jest.mock('@ids-ts/icon-control', () => ({
  IconControl: ({ label, 'data-testid': testId }: any) => (
    <div data-testid={testId}>{label}</div>
  ),
}));

jest.mock('@design-systems/icons', () => ({
  ChevronLeft: () => <svg data-testid="chevron-left" />,
  PersonThree: () => <svg data-testid="person-three" />,
}));

jest.mock(
  'src/js/widgets/qbtOrchestrator/features/overtime/components/PolicySetupWizard/OvertimeRulesTable',
  () => ({
    OvertimeRulesTable: ({ rules }: any) => (
      <div data-testid="rules-table">{rules.length} rules</div>
    ),
  }),
);

// Mock the hooks used inside PolicyDetailsScreen
const mockFetchPolicyById = jest.fn();
jest.mock(
  'src/js/widgets/qbtOrchestrator/features/overtime/hooks/useOvertimePolicies',
  () => ({
    useOvertimePolicies: () => ({ fetchPolicyById: mockFetchPolicyById }),
    OVERTIME_POLICIES_PAGE_SIZE: 10,
  }),
);

const mockWorkerCountResult = {
  totalWorkerCount: 5,
  companyTotalWorkerCount: 20,
  loading: false,
  error: null as string | null,
  isCompanyWide: false,
  hasNoAssignments: false,
};
jest.mock(
  'src/js/widgets/qbtOrchestrator/features/overtime/hooks/useOvertimePolicyWorkerCount',
  () => ({
    useOvertimePolicyWorkerCount: () => mockWorkerCountResult,
  }),
);

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockOnBack = jest.fn();
const mockSandbox = getDefaultSandbox();

const renderScreen = (preloadedState?: any) => {
  const store = createQbtOrchestratorStore(preloadedState);
  renderWithQuicksandReduxAndLogging(
    <PolicyDetailsScreen onBack={mockOnBack} />,
    store,
    mockSandbox,
  );
  return store;
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PolicyDetailsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to default (loading=false, not company-wide, has assignments)
    mockWorkerCountResult.loading = false;
    mockWorkerCountResult.isCompanyWide = false;
    mockWorkerCountResult.hasNoAssignments = false;
    mockWorkerCountResult.totalWorkerCount = 5;
    mockWorkerCountResult.companyTotalWorkerCount = 20;
    mockWorkerCountResult.error = null;
  });

  describe('states when no policy is loaded', () => {
    it('shows "Policy not found" when selectedPolicyId is null', () => {
      renderScreen();
      expect(screen.getByText(/policy not found/i)).toBeInTheDocument();
    });

    it('shows loading state while fetching from API', async () => {
      // Policy not in store, fetch returns a promise that never resolves in this test
      mockFetchPolicyById.mockImplementation(() => new Promise(() => {}));

      renderScreen({ overtime: { selectedPolicyId: 'p-remote' } });

      await waitFor(() => {
        expect(screen.getByText(/loading policy details/i)).toBeInTheDocument();
      });
    });

    it('shows error message when API fetch fails', async () => {
      mockFetchPolicyById.mockRejectedValue(new Error('Network error'));

      renderScreen({ overtime: { selectedPolicyId: 'p-missing' } });

      await waitFor(() => {
        expect(screen.getByText('catch.all.error.content')).toBeInTheDocument();
      });
    });

    it('does not show "Policy not found" when fetch fails (shows error instead)', async () => {
      mockFetchPolicyById.mockRejectedValue(new Error('Network error'));

      renderScreen({ overtime: { selectedPolicyId: 'p-missing' } });

      await waitFor(() => {
        expect(screen.queryByText(/policy not found/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('policy loaded from Redux store', () => {
    const policy = createOvertimePolicy({
      id: 'p-1',
      name: 'Standard OT Policy',
      description: 'A test policy',
      rules: { values: [createOvertimeRule()] },
    });

    const storeState = {
      overtime: {
        selectedPolicyId: 'p-1',
        policies: [policy],
      },
    };

    it('renders policy name and description', () => {
      renderScreen(storeState);
      expect(screen.getByText('Standard OT Policy')).toBeInTheDocument();
      expect(screen.getByText('A test policy')).toBeInTheDocument();
    });

    it('renders the rules table with correct rule count', () => {
      renderScreen(storeState);
      expect(screen.getByTestId('rules-table')).toHaveTextContent('1 rules');
    });

    it('renders Assign Workers and Edit Policy buttons for non-default, non-basic policy', () => {
      renderScreen(storeState);
      expect(screen.getByTestId('assign-workers-button')).toBeInTheDocument();
      expect(screen.getByTestId('edit-policy-button')).toBeInTheDocument();
    });

    it('hides Assign Workers button for default policy', () => {
      const defaultPolicy = createOvertimePolicy({
        id: 'p-default',
        name: 'Default OT Policy',
        isDefault: true,
      });
      renderScreen({
        overtime: {
          selectedPolicyId: 'p-default',
          policies: [defaultPolicy],
        },
      });
      expect(
        screen.queryByTestId('assign-workers-button'),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('edit-policy-button')).toBeInTheDocument();
    });

    it('hides Assign Workers button for basic policy id', () => {
      const basicPolicy = createOvertimePolicy({
        id: 'basic',
        name: 'Basic OT Policy',
        isDefault: false,
      });
      renderScreen({
        overtime: {
          selectedPolicyId: 'basic',
          policies: [basicPolicy],
        },
      });
      expect(
        screen.queryByTestId('assign-workers-button'),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('edit-policy-button')).toBeInTheDocument();
    });

    it('hides Assign Workers button for basic_policy_* id', () => {
      const basicPrefixedPolicy = createOvertimePolicy({
        id: 'basic_policy_123',
        name: 'Basic Prefixed OT Policy',
        isDefault: false,
      });
      renderScreen({
        overtime: {
          selectedPolicyId: 'basic_policy_123',
          policies: [basicPrefixedPolicy],
        },
      });
      expect(
        screen.queryByTestId('assign-workers-button'),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('edit-policy-button')).toBeInTheDocument();
    });

    it('does NOT call fetchPolicyById when policy is already in store', () => {
      renderScreen(storeState);
      expect(mockFetchPolicyById).not.toHaveBeenCalled();
    });
  });

  describe('handleBack', () => {
    const policy = createOvertimePolicy({ id: 'p-back', name: 'Back Test' });

    it('calls onBack and dispatches store actions when back link is clicked', () => {
      const store = renderScreen({
        overtime: { selectedPolicyId: 'p-back', policies: [policy] },
      });

      fireEvent.click(screen.getByTestId('back-link'));

      expect(mockOnBack).toHaveBeenCalledTimes(1);
      const state = (store.getState() as any).overtime;
      expect(state.selectedPolicyId).toBeNull();
      expect(state.showPolicyDetails).toBe(false);
    });
  });

  describe('worker count label', () => {
    const policy = createOvertimePolicy({
      id: 'p-wc',
      name: 'Worker Count Policy',
    });
    const state = {
      overtime: { selectedPolicyId: 'p-wc', policies: [policy] },
    };

    it('shows "Loading..." when worker count is loading', () => {
      mockWorkerCountResult.loading = true;
      renderScreen(state);
      expect(screen.getByTestId('policy-worker-count')).toHaveTextContent(
        'Loading...',
      );
    });

    it('shows "No workers assigned" when hasNoAssignments', () => {
      mockWorkerCountResult.hasNoAssignments = true;
      renderScreen(state);
      expect(screen.getByTestId('policy-worker-count')).toHaveTextContent(
        'No workers assigned',
      );
    });

    it('shows "All workers" when isCompanyWide', () => {
      mockWorkerCountResult.isCompanyWide = true;
      renderScreen(state);
      expect(screen.getByTestId('policy-worker-count')).toHaveTextContent(
        'All workers',
      );
    });

    it('shows "All workers" when policy isDefault, even if hasNoAssignments', () => {
      const defaultPolicy = createOvertimePolicy({
        id: 'p-default',
        name: 'Default Policy',
        isDefault: true,
        assignments: { values: [] },
      });
      const defaultState = {
        overtime: {
          selectedPolicyId: 'p-default',
          policies: [defaultPolicy],
        },
      };
      mockWorkerCountResult.hasNoAssignments = true;
      mockWorkerCountResult.isCompanyWide = false;
      renderScreen(defaultState);
      expect(screen.getByTestId('policy-worker-count')).toHaveTextContent(
        'All workers',
      );
    });

    it('shows error message when worker count fails', () => {
      mockWorkerCountResult.error = 'Failed to fetch';
      renderScreen(state);
      expect(screen.getByTestId('policy-worker-count')).toHaveTextContent(
        'Unable to load worker count',
      );
    });

    it('shows count-of-total label for specific assignments', () => {
      mockWorkerCountResult.totalWorkerCount = 3;
      mockWorkerCountResult.companyTotalWorkerCount = 10;
      renderScreen(state);
      expect(screen.getByTestId('policy-worker-count')).toHaveTextContent('3');
      expect(screen.getByTestId('policy-worker-count')).toHaveTextContent('10');
    });
  });

  describe('handleAssignWorkers', () => {
    const userAssignment = createAssignment({
      entityType: 'user',
      entityId: 'user-42',
      id: 'a-1',
    });
    const policy = createOvertimePolicy({
      id: 'p-assign',
      name: 'Assign Test',
      assignments: { values: [userAssignment] },
    });

    it('dispatches initializeWizardForEdit with POLICY_MEMBERS step', () => {
      const store = renderScreen({
        overtime: { selectedPolicyId: 'p-assign', policies: [policy] },
      });

      fireEvent.click(screen.getByTestId('assign-workers-button'));

      const state = (store.getState() as any).overtime;
      expect(state.showWizard).toBe(true);
      expect(state.wizardCurrentStep).toBe(WizardStepId.POLICY_MEMBERS);
      expect(state.wizardEditMode).toBe(true);
      expect(state.showPolicyDetails).toBe(false);
    });

    it('excludes User Not Found assignments from memberIds when mixed with valid users', () => {
      const policyWithOrphan = createOvertimePolicy({
        id: 'p-orphan',
        name: 'Orphan Test',
        assignments: {
          values: [
            createAssignment({
              id: 'a-valid',
              entityType: 'user',
              entityId: 'user-valid',
              entityName: 'Valid User',
            }),
            createAssignment({
              id: 'a-orphan',
              entityType: 'user',
              entityId: 'user-orphan',
              entityName: 'User Not Found',
            }),
          ],
        },
      });

      const store = renderScreen({
        overtime: {
          selectedPolicyId: 'p-orphan',
          policies: [policyWithOrphan],
        },
      });

      fireEvent.click(screen.getByTestId('assign-workers-button'));

      const state = (store.getState() as any).overtime;
      expect(state.policyFormData.policyMemberIds).toContain('user-valid');
      expect(state.policyFormData.policyMemberIds).not.toContain('user-orphan');
      expect(state.initialMemberIds).toContain('user-valid');
      expect(state.initialMemberIds).not.toContain('user-orphan');
    });

    it('results in empty memberIds when all user assignments are User Not Found', () => {
      const policyAllOrphans = createOvertimePolicy({
        id: 'p-all-orphans',
        name: 'All Orphans Test',
        assignments: {
          values: [
            createAssignment({
              id: 'a-orphan-1',
              entityType: 'user',
              entityId: 'user-orphan-1',
              entityName: 'User Not Found',
            }),
          ],
        },
      });

      const store = renderScreen({
        overtime: {
          selectedPolicyId: 'p-all-orphans',
          policies: [policyAllOrphans],
        },
      });

      fireEvent.click(screen.getByTestId('assign-workers-button'));

      const state = (store.getState() as any).overtime;
      expect(state.policyFormData.policyMemberIds).toHaveLength(0);
      expect(state.initialMemberIds).toHaveLength(0);
    });
  });

  describe('handleEditPolicy', () => {
    const policy = createOvertimePolicy({ id: 'p-edit', name: 'Edit Test' });

    it('dispatches initializeWizardForEdit with REVIEW step', () => {
      const store = renderScreen({
        overtime: { selectedPolicyId: 'p-edit', policies: [policy] },
      });

      fireEvent.click(screen.getByTestId('edit-policy-button'));

      const state = (store.getState() as any).overtime;
      expect(state.showWizard).toBe(true);
      expect(state.wizardCurrentStep).toBe(WizardStepId.REVIEW);
      expect(state.wizardEditMode).toBe(true);
    });

    it('excludes User Not Found assignments from memberIds when editing policy', () => {
      const policyWithOrphan = createOvertimePolicy({
        id: 'p-edit-orphan',
        name: 'Edit Orphan Test',
        assignments: {
          values: [
            createAssignment({
              id: 'a-valid',
              entityType: 'user',
              entityId: 'user-valid',
              entityName: 'Valid User',
            }),
            createAssignment({
              id: 'a-orphan',
              entityType: 'user',
              entityId: 'user-orphan',
              entityName: 'User Not Found',
            }),
          ],
        },
      });

      const store = renderScreen({
        overtime: {
          selectedPolicyId: 'p-edit-orphan',
          policies: [policyWithOrphan],
        },
      });

      fireEvent.click(screen.getByTestId('edit-policy-button'));

      const state = (store.getState() as any).overtime;
      expect(state.policyFormData.policyMemberIds).toContain('user-valid');
      expect(state.policyFormData.policyMemberIds).not.toContain('user-orphan');
    });
  });
});

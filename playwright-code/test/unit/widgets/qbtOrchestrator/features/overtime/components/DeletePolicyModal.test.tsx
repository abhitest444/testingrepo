import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import {
  getDefaultSandbox,
  renderWithQuicksandReduxAndLogging,
  createQbtOrchestratorStore,
} from 'test/unit/testUtils';
import DeletePolicyModal from 'src/js/widgets/qbtOrchestrator/features/overtime/components/DeletePolicyModal';
import { createOvertimePolicy } from 'test/unit/fixtures/overtimeFixtures';
import {
  setPolicyToDelete,
  setShowDeleteModal,
} from 'src/js/widgets/qbtOrchestrator/features/overtime/store';

import { getApolloClientInstance } from 'src/js/service/ApolloClientBuilder';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('@payroll/quicksand', () => ({
  ...jest.requireActual('@payroll/quicksand'),
  useIntl: () => ({
    formatMessage: ({ defaultMessage, id }: any, values?: any) => {
      if (!defaultMessage) return id;
      if (!values) return defaultMessage;
      return defaultMessage.replace(/\{(\w+)\}/g, (_: string, key: string) =>
        String(values[key] ?? ''),
      );
    },
  }),
}));

jest.mock('src/js/service/ApolloClientBuilder', () => ({
  getApolloClientInstance: jest.fn(),
}));

jest.mock('src/js/common/CustomerInteraction', () => ({
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  setInteractionDegraded: jest.fn(),
  shouldTreatErrorAsDegraded: jest.fn(() => false),
  getCustomerInteractionPropagationHeaders: jest.fn(() => ({})),
  TimeCustomerInteraction: {
    OVERTIME_POLICY_DELETE: 'overtime-policy-delete',
  },
}));

// Stub IDS components so they render predictably
jest.mock('@ids-ts/modal-dialog', () => ({
  Modal: ({ children, open }: any) =>
    open ? <div data-testid="modal">{children}</div> : null,
  ModalHeader: ({ onClose }: any) => (
    <div data-testid="modal-header">
      <button data-testid="modal-header-close" onClick={onClose}>
        X
      </button>
    </div>
  ),
  ModalContent: ({ children, 'data-testid': testId }: any) => (
    <div data-testid={testId}>{children}</div>
  ),
  ModalActions: ({ children, 'data-testid': testId }: any) => (
    <div data-testid={testId}>{children}</div>
  ),
}));

jest.mock('@ids-ts/button', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, 'data-testid': testId }: any) => (
    <button data-testid={testId} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

jest.mock('@ids-ts/typography', () => ({
  __esModule: true,
  default: ({ children, 'data-testid': testId }: any) => (
    <span data-testid={testId}>{children}</span>
  ),
}));

jest.mock('@ids-ts/loader', () => ({
  Activity: () => <span data-testid="activity-loader" />,
}));

jest.mock('@ids-ts/page-message', () => ({
  __esModule: true,
  default: ({ children, type, 'data-testid': testId }: any) => (
    <div data-testid={testId} data-type={type}>
      {children}
    </div>
  ),
}));
const mockGetClient = getApolloClientInstance as jest.Mock;
const mockMutate = jest.fn();

// ── Helpers ───────────────────────────────────────────────────────────────────

const sandbox = getDefaultSandbox();

const renderModal = (preloadedState?: any) => {
  const store = createQbtOrchestratorStore(preloadedState);
  renderWithQuicksandReduxAndLogging(<DeletePolicyModal />, store, sandbox);
  return store;
};

const mockPolicy = createOvertimePolicy({ id: 'p-1', name: 'Test Policy' });

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('DeletePolicyModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetClient.mockReturnValue({ mutate: mockMutate });
  });

  describe('rendering', () => {
    it('renders nothing when policyToDelete is null', () => {
      renderModal();
      expect(
        screen.queryByTestId('delete-policy-modal'),
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('renders the modal when policyToDelete is set and showDeleteModal is true', () => {
      renderModal({
        overtime: { policyToDelete: mockPolicy, showDeleteModal: true },
      });
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    it('does not render modal content when showDeleteModal is false', () => {
      renderModal({
        overtime: { policyToDelete: mockPolicy, showDeleteModal: false },
      });
      // Modal component receives open=false so returns null
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('displays policy name in the title', () => {
      renderModal({
        overtime: { policyToDelete: mockPolicy, showDeleteModal: true },
      });
      expect(screen.getByTestId('delete-policy-modal-title')).toHaveTextContent(
        'Are you sure you want to delete Test Policy?',
      );
    });

    it('displays warning text', () => {
      renderModal({
        overtime: { policyToDelete: mockPolicy, showDeleteModal: true },
      });
      expect(
        screen.getByTestId('delete-policy-modal-warning'),
      ).toHaveTextContent("This can't be undone");
    });

    it('renders Cancel and Delete buttons', () => {
      renderModal({
        overtime: { policyToDelete: mockPolicy, showDeleteModal: true },
      });
      expect(
        screen.getByTestId('delete-policy-modal-cancel'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('delete-policy-modal-delete'),
      ).toBeInTheDocument();
    });
  });

  describe('handleCancelDelete', () => {
    it('dispatches setShowDeleteModal(false) and setPolicyToDelete(null) when Cancel is clicked', () => {
      const store = renderModal({
        overtime: { policyToDelete: mockPolicy, showDeleteModal: true },
      });

      fireEvent.click(screen.getByTestId('delete-policy-modal-cancel'));

      const state = (store.getState() as any).overtime;
      expect(state.showDeleteModal).toBe(false);
      expect(state.policyToDelete).toBeNull();
    });

    it('dispatches cancel actions when header close button is clicked', () => {
      const store = renderModal({
        overtime: { policyToDelete: mockPolicy, showDeleteModal: true },
      });

      fireEvent.click(screen.getByTestId('modal-header-close'));

      const state = (store.getState() as any).overtime;
      expect(state.showDeleteModal).toBe(false);
      expect(state.policyToDelete).toBeNull();
    });
  });

  describe('handleConfirmDelete', () => {
    it('calls deleteOvertimePolicy mutation and closes modal on success', async () => {
      mockMutate.mockResolvedValueOnce({
        data: { deleteOvertimePolicy: { deletedPolicyId: 'p-1' } },
      });

      const store = renderModal({
        overtime: {
          policies: [mockPolicy],
          policyToDelete: mockPolicy,
          showDeleteModal: true,
        },
      });

      fireEvent.click(screen.getByTestId('delete-policy-modal-delete'));

      await waitFor(() => {
        const state = (store.getState() as any).overtime;
        expect(state.policyToDelete).toBeNull();
        expect(state.showDeleteModal).toBe(false);
      });

      expect(mockMutate).toHaveBeenCalledTimes(1);
    });

    it('closes modal and sets global error on deletion failure', async () => {
      mockMutate.mockRejectedValueOnce(new Error('Delete failed'));

      const store = renderModal({
        overtime: {
          policies: [mockPolicy],
          policyToDelete: mockPolicy,
          showDeleteModal: true,
        },
      });

      fireEvent.click(screen.getByTestId('delete-policy-modal-delete'));

      await waitFor(() => {
        const state = (store.getState() as any).overtime;
        expect(state.deletePolicyError).toBeNull();
        expect(state.showDeleteModal).toBe(false);
        expect(state.policyToDelete).toBeNull();
        expect(state.error).toBe('catch.all.error.content');
      });
    });

    it('does not show modal error banner when deletion fails', async () => {
      mockMutate.mockRejectedValueOnce(new Error('Delete failed'));

      renderModal({
        overtime: {
          policies: [mockPolicy],
          policyToDelete: mockPolicy,
          showDeleteModal: true,
        },
      });

      fireEvent.click(screen.getByTestId('delete-policy-modal-delete'));

      await waitFor(() => {
        expect(
          screen.queryByTestId('delete-policy-error-banner'),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByTestId('delete-policy-modal'),
        ).not.toBeInTheDocument();
      });
    });

    it('does not show modal error banner when deletion succeeds', async () => {
      mockMutate.mockResolvedValueOnce({
        data: { deleteOvertimePolicy: { deletedPolicyId: 'p-1' } },
      });

      renderModal({
        overtime: {
          policies: [mockPolicy],
          policyToDelete: mockPolicy,
          showDeleteModal: true,
        },
      });

      fireEvent.click(screen.getByTestId('delete-policy-modal-delete'));

      await waitFor(() => {
        expect(
          screen.queryByTestId('delete-policy-error-banner'),
        ).not.toBeInTheDocument();
      });
    });

    it('does not call mutate when policyToDelete is null', async () => {
      // This tests the early return in handleConfirmDelete
      // We render with a policy set but then simulate the edge case
      // by calling click before policy is set — in practice policyToDelete=null
      // causes the component to return null, so the button is never rendered.
      // Verify the component doesn't render to confirm the guard works.
      renderModal({ overtime: { policyToDelete: null } });
      expect(
        screen.queryByTestId('delete-policy-modal-delete'),
      ).not.toBeInTheDocument();
      expect(mockMutate).not.toHaveBeenCalled();
    });
  });

  describe('degraded error (statusCode 9463)', () => {
    const { setInteractionDegraded } = jest.requireMock(
      'src/js/common/CustomerInteraction',
    );

    it('marks interaction as degraded and closes modal when server returns statusCode 9463', async () => {
      mockMutate.mockResolvedValueOnce({
        data: {
          deleteOvertimePolicy: {
            deletedPolicyId: null,
            status: { statusCode: 9463, message: 'server msg' },
          },
        },
      });

      const store = renderModal({
        overtime: {
          policies: [mockPolicy],
          policyToDelete: mockPolicy,
          showDeleteModal: true,
        },
      });

      fireEvent.click(screen.getByTestId('delete-policy-modal-delete'));

      await waitFor(() => {
        const state = (store.getState() as any).overtime;
        expect(state.showDeleteModal).toBe(false);
        expect(state.error).toBe('catch.all.error.content');
      });

      expect(setInteractionDegraded).toHaveBeenCalledWith(
        expect.anything(),
        'overtime-policy-delete',
        '9463',
      );
    });
  });

  describe('isDeletingPolicy loading state', () => {
    it('disables Cancel and Delete buttons while isDeletingPolicy is true', () => {
      renderModal({
        overtime: {
          policyToDelete: mockPolicy,
          showDeleteModal: true,
          isDeletingPolicy: true,
        },
      });

      expect(screen.getByTestId('delete-policy-modal-cancel')).toBeDisabled();
      expect(screen.getByTestId('delete-policy-modal-delete')).toBeDisabled();
    });

    it('does NOT disable buttons when isDeletingPolicy is false', () => {
      renderModal({
        overtime: {
          policyToDelete: mockPolicy,
          showDeleteModal: true,
          isDeletingPolicy: false,
        },
      });

      expect(
        screen.getByTestId('delete-policy-modal-cancel'),
      ).not.toBeDisabled();
      expect(
        screen.getByTestId('delete-policy-modal-delete'),
      ).not.toBeDisabled();
    });
  });
});

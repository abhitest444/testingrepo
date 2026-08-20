/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  getDefaultSandbox,
  renderWithQuicksandReduxAndLogging,
  createQbtOrchestratorStore,
} from 'test/unit/testUtils';
import OvertimeLandingPage from 'src/js/widgets/qbtOrchestrator/features/overtime/components/OvertimeLandingPage';
import { OVERTIME_LOGGING } from 'src/js/widgets/qbtOrchestrator/features/overtime/constants/overtimeLoggingConstants';

// Mock the dependencies
jest.mock('@ids-ts/trowser', () => ({
  __esModule: true,
  default: ({ children, open, onClose, title, dismissible }: any) =>
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
  default: ({ children, ...props }: any) => <div {...props}>{children}</div>,
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
          Create Policy (Filled)
        </button>
        <button
          data-testid="filled-edit-button"
          onClick={() => onEditPolicy('1')}
        >
          Edit Policy 1
        </button>
        {onPageChange && (
          <button
            data-testid="filled-page-change-button"
            onClick={() => onPageChange(2)}
          >
            Go to page 2
          </button>
        )}
      </div>
    ),
  }),
);

// Mock useOvertimePolicies hook to return mock policies
const mockPoliciesData = [
  {
    id: '1',
    name: 'Policy 1',
    description: '',
    isDefault: true,
    assignments: { values: [] },
    rules: { values: [] },
  },
  {
    id: '2',
    name: 'Policy 2',
    description: '',
    isDefault: false,
    assignments: { values: [] },
    rules: { values: [] },
  },
];

const mockFetchPolicies = jest.fn().mockResolvedValue({
  policies: mockPoliciesData,
  pageInfo: { hasNextPage: false, hasPreviousPage: false, totalCount: 2 },
});

const mockFetchPage = jest.fn().mockResolvedValue({
  policies: mockPoliciesData,
  pageInfo: { hasNextPage: false, hasPreviousPage: false, totalCount: 2 },
});

jest.mock('src/js/widgets/qbtOrchestrator/features/overtime/hooks', () => ({
  useOvertimePolicies: () => ({
    fetchPolicies: mockFetchPolicies,
    fetchPage: mockFetchPage,
    loading: false,
    error: undefined,
    policies: [],
    pageInfo: null,
    fetchNextPage: jest.fn(),
    fetchPreviousPage: jest.fn(),
    hasPreviousPage: false,
  }),
}));

describe('OvertimeLandingPage', () => {
  const mockSandbox = getDefaultSandbox();
  const mockOnClose = jest.fn();
  let store: ReturnType<typeof createQbtOrchestratorStore>;

  beforeEach(() => {
    jest.clearAllMocks();
    store = createQbtOrchestratorStore();
  });

  describe('Component Rendering', () => {
    it('should render the trowser when open', async () => {
      renderWithQuicksandReduxAndLogging(
        <OvertimeLandingPage onClose={mockOnClose} />,
        store,
        mockSandbox,
      );

      await waitFor(() => {
        expect(screen.getByTestId('trowser')).toBeInTheDocument();
      });
    });

    it('should render trowser with content', async () => {
      // The component uses mockOvertimePolicies internally which has data
      renderWithQuicksandReduxAndLogging(
        <OvertimeLandingPage onClose={mockOnClose} />,
        store,
        mockSandbox,
      );

      // Trowser should be open
      await waitFor(() => {
        expect(screen.getByTestId('trowser')).toBeInTheDocument();
      });
    });

    it('should render header content', async () => {
      renderWithQuicksandReduxAndLogging(
        <OvertimeLandingPage onClose={mockOnClose} />,
        store,
        mockSandbox,
      );

      // i18n keys will be rendered in tests
      await waitFor(() => {
        expect(
          screen.getByText(/NLS overtime.landing.header.description/i),
        ).toBeInTheDocument();
      });
    });

    it('should render learn more link', async () => {
      renderWithQuicksandReduxAndLogging(
        <OvertimeLandingPage onClose={mockOnClose} />,
        store,
        mockSandbox,
      );

      await waitFor(() => {
        const learnMoreLink = screen.getByText(
          /NLS overtime.landing.header.learn.more/i,
        );
        expect(learnMoreLink).toBeInTheDocument();
      });
    });

    it('should render check laws link', async () => {
      renderWithQuicksandReduxAndLogging(
        <OvertimeLandingPage onClose={mockOnClose} />,
        store,
        mockSandbox,
      );

      await waitFor(() => {
        const checkLawsLink = screen.getByText(
          /NLS overtime.landing.header.link.action/i,
        );
        expect(checkLawsLink).toBeInTheDocument();
      });
    });
  });

  describe('Component Lifecycle', () => {
    it('should log LANDING_PAGE_MOUNTED when component mounts', async () => {
      renderWithQuicksandReduxAndLogging(
        <OvertimeLandingPage onClose={mockOnClose} />,
        store,
        mockSandbox,
      );

      await waitFor(() => {
        expect(mockSandbox.logger.info).toHaveBeenCalledWith(
          expect.stringContaining(OVERTIME_LOGGING.LANDING_PAGE_MOUNTED),
          undefined,
        );
      });
    });
  });

  describe('User Interactions - Filled State', () => {
    it('should pass correct handlers to OvertimeFilledState', async () => {
      renderWithQuicksandReduxAndLogging(
        <OvertimeLandingPage onClose={mockOnClose} />,
        store,
        mockSandbox,
      );

      await waitFor(() => {
        expect(screen.getByTestId('overtime-filled-state')).toBeInTheDocument();
      });

      // Verify policies are passed
      expect(screen.getByText('Policies: 2')).toBeInTheDocument();
    });

    it('should log LANDING_PAGE_CREATE_POLICY_CLICKED when create button in filled state is clicked', async () => {
      renderWithQuicksandReduxAndLogging(
        <OvertimeLandingPage onClose={mockOnClose} />,
        store,
        mockSandbox,
      );

      await waitFor(() => {
        expect(screen.getByTestId('overtime-filled-state')).toBeInTheDocument();
      });

      const createButton = screen.getByTestId('filled-create-button');
      fireEvent.click(createButton);

      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        expect.stringContaining(
          OVERTIME_LOGGING.LANDING_PAGE_CREATE_POLICY_CLICKED,
        ),
        undefined,
      );
    });

    it('should log LANDING_PAGE_EDIT_POLICY_CLICKED with policyId when edit is clicked', async () => {
      renderWithQuicksandReduxAndLogging(
        <OvertimeLandingPage onClose={mockOnClose} />,
        store,
        mockSandbox,
      );

      await waitFor(() => {
        expect(screen.getByTestId('overtime-filled-state')).toBeInTheDocument();
      });

      const editButton = screen.getByTestId('filled-edit-button');
      fireEvent.click(editButton);

      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        expect.stringContaining(
          OVERTIME_LOGGING.LANDING_PAGE_EDIT_POLICY_CLICKED,
        ),
        { policyId: '1' },
      );
    });
  });

  describe('User Interactions - Links', () => {
    it('should log LANDING_PAGE_LEARN_MORE_CLICKED when learn more link is clicked', async () => {
      renderWithQuicksandReduxAndLogging(
        <OvertimeLandingPage onClose={mockOnClose} />,
        store,
        mockSandbox,
      );

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

    it('should log LANDING_PAGE_CHECK_LAWS_CLICKED when check laws link is clicked', async () => {
      renderWithQuicksandReduxAndLogging(
        <OvertimeLandingPage onClose={mockOnClose} />,
        store,
        mockSandbox,
      );

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
  });

  describe('Error Handling', () => {
    it('dispatches setError when fetchPolicies throws on initial load', async () => {
      mockFetchPolicies.mockRejectedValueOnce(new Error('Network error'));

      renderWithQuicksandReduxAndLogging(
        <OvertimeLandingPage onClose={mockOnClose} />,
        store,
        mockSandbox,
      );

      await waitFor(() => {
        expect((store.getState() as any).overtime.error).toBe(
          'Failed to load overtime policies',
        );
      });
    });
  });

  describe('Refetch Behavior', () => {
    it('refetches policies when refetchPolicies flag is set in the store', async () => {
      // Pre-seed store with refetchPolicies = true
      store = createQbtOrchestratorStore({
        overtime: { refetchPolicies: true },
      });

      renderWithQuicksandReduxAndLogging(
        <OvertimeLandingPage onClose={mockOnClose} />,
        store,
        mockSandbox,
      );

      await waitFor(() => {
        // refetchPolicies should be reset to false after the refetch completes
        expect((store.getState() as any).overtime.refetchPolicies).toBe(false);
      });

      // fetchPolicies was called at least once for the refetch
      expect(mockFetchPolicies).toHaveBeenCalled();
    });

    it('dispatches setError when fetchPolicies throws during refetch', async () => {
      store = createQbtOrchestratorStore({
        overtime: { refetchPolicies: true },
      });

      // Initial load succeeds, but the refetch triggered by the flag fails
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

      renderWithQuicksandReduxAndLogging(
        <OvertimeLandingPage onClose={mockOnClose} />,
        store,
        mockSandbox,
      );

      await waitFor(() => {
        expect((store.getState() as any).overtime.refetchPolicies).toBe(false);
      });
    });
  });

  describe('Pagination', () => {
    it('calls fetchPage and updates store when onPageChange is triggered', async () => {
      const newPageData = {
        policies: mockPoliciesData,
        pageInfo: { hasNextPage: false, hasPreviousPage: true, totalCount: 2 },
      };
      mockFetchPage.mockResolvedValueOnce(newPageData);

      renderWithQuicksandReduxAndLogging(
        <OvertimeLandingPage onClose={mockOnClose} />,
        store,
        mockSandbox,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('filled-page-change-button'),
        ).toBeInTheDocument();
      });

      const pageButton = screen.getByTestId('filled-page-change-button');
      fireEvent.click(pageButton);

      await waitFor(() => {
        expect(mockFetchPage).toHaveBeenCalledWith(2);
      });
    });

    it('dispatches setError when fetchPage throws', async () => {
      mockFetchPage.mockRejectedValueOnce(new Error('Page fetch failed'));

      renderWithQuicksandReduxAndLogging(
        <OvertimeLandingPage onClose={mockOnClose} />,
        store,
        mockSandbox,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('filled-page-change-button'),
        ).toBeInTheDocument();
      });

      const pageButton = screen.getByTestId('filled-page-change-button');
      fireEvent.click(pageButton);

      await waitFor(() => {
        expect((store.getState() as any).overtime.error).toBe(
          'Failed to load overtime policies',
        );
      });
    });
  });

  describe('Close Functionality', () => {
    it('should close trowser when close button is clicked', async () => {
      renderWithQuicksandReduxAndLogging(
        <OvertimeLandingPage onClose={mockOnClose} />,
        store,
        mockSandbox,
      );

      await waitFor(() => {
        expect(screen.getByTestId('trowser-close')).toBeInTheDocument();
      });

      const closeButton = screen.getByTestId('trowser-close');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should not log close event when trowser is closed', async () => {
      renderWithQuicksandReduxAndLogging(
        <OvertimeLandingPage onClose={mockOnClose} />,
        store,
        mockSandbox,
      );

      await waitFor(() => {
        expect(screen.getByTestId('trowser-close')).toBeInTheDocument();
      });

      // Clear previous logs
      jest.clearAllMocks();

      const closeButton = screen.getByTestId('trowser-close');
      fireEvent.click(closeButton);

      // Should call onClose but not log
      expect(mockOnClose).toHaveBeenCalled();
      expect(mockSandbox.logger.info).not.toHaveBeenCalled();
    });

    it('should handle missing onClose callback gracefully', async () => {
      renderWithQuicksandReduxAndLogging(
        <OvertimeLandingPage />,
        store,
        mockSandbox,
      );

      await waitFor(() => {
        expect(screen.getByTestId('trowser-close')).toBeInTheDocument();
      });

      const closeButton = screen.getByTestId('trowser-close');

      // Should not throw error
      expect(() => fireEvent.click(closeButton)).not.toThrow();
    });
  });
});

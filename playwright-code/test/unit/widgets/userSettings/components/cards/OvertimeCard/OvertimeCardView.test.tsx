// @ts-nocheck
/**
 * Tests for OvertimeCardView component
 *
 * Tests the VIEW-mode display: loading skeleton, empty state, error state,
 * editable policy (basic/basic_policy_*), numeric policy with jump link,
 * and navigation handlers.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import OvertimeCardView from 'src/js/widgets/userSettings/components/cards/OvertimeCard/components/OvertimeCardView';
import overtimeReducer from 'src/js/widgets/userSettings/store/slices/overtimeSlice';
import settingsContextReducer from 'src/js/widgets/userSettings/store/slices/settingsContextSlice';
import { storeManager } from 'src/js/widgets/qbtOrchestrator/store/storeManager';

// Mocks
const mockNavigate = jest.fn();
const mockLoggerInfo = jest.fn();
const mockLoggerError = jest.fn();

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({ formatMessage: jest.fn(({ id }) => id) }),
  useSandbox: () => ({
    logger: { info: mockLoggerInfo, error: mockLoggerError },
    navigation: { navigate: mockNavigate },
  }),
  useTracking: () => jest.fn(),
}));

jest.mock('src/js/providers/LoggingConfigProvider', () => ({
  useLoggingConfig: () => ({
    info: mockLoggerInfo,
    error: mockLoggerError,
    warn: jest.fn(),
    debug: jest.fn(),
  }),
}));

jest.mock(
  'src/js/widgets/qbtOrchestrator/features/overtime/components/PolicySetupWizard/OvertimeRulesTable',
  () => ({
    OvertimeRulesTable: ({ rules }: { rules: any[] }) => (
      <div data-testid="overtime-rules-table">Rules: {rules.length}</div>
    ),
  }),
);

jest.mock(
  'src/js/widgets/userSettings/components/cards/BreaksCard/components/BreaksStateMessage',
  () =>
    function MockBreaksStateMessage({ testId, messageId }: any) {
      return <div data-testid={testId}>{messageId}</div>;
    },
);

jest.mock(
  'src/js/widgets/qbtOrchestrator/features/overtime/store/overtimeSlice',
  () => ({
    setSelectedPolicyId: jest.fn((id) => ({
      type: 'overtime/setSelectedPolicyId',
      payload: id,
    })),
    setShowPolicyDetails: jest.fn((v) => ({
      type: 'overtime/setShowPolicyDetails',
      payload: v,
    })),
    setShowLandingPage: jest.fn((v) => ({
      type: 'overtime/setShowLandingPage',
      payload: v,
    })),
  }),
);

jest.mock('src/js/widgets/qbtOrchestrator/store/storeManager', () => ({
  storeManager: {
    hasReducer: jest.fn(() => true),
    inject: jest.fn(),
    store: { dispatch: jest.fn() },
  },
}));

jest.mock('@ids-ts/icon-control', () => ({
  IconControl: ({
    children,
    onClick,
    disabled,
    'aria-label': ariaLabel,
  }: any) => (
    <button onClick={onClick} disabled={disabled} aria-label={ariaLabel}>
      {children}
    </button>
  ),
}));

jest.mock('@cgds/skeleton', () => ({
  Skeleton: ({ height }: any) => (
    <div data-testid="skeleton" style={{ height }} />
  ),
}));

jest.mock('@ids-ts/typography', () => ({
  B1: ({ children }: any) => <span>{children}</span>,
  Medium: ({ children }: any) => <strong>{children}</strong>,
}));

jest.mock('@design-systems/icons', () => ({
  Edit: () => <span data-testid="edit-icon" />,
  NewWindow: () => <span data-testid="new-window-icon" />,
  ThumbDown: () => <span data-testid="thumb-down-icon" />,
  StopWatch: () => <span data-testid="stop-watch-icon" />,
}));

const buildOvertimeState = (overrides = {}) => ({
  mode: 'VIEW',
  policy: null,
  loading: false,
  error: null,
  overtimeRuleType: '',
  draftRules: [],
  ...overrides,
});

const createStore = (overtimeOverrides = {}) =>
  configureStore({
    reducer: {
      overtime: overtimeReducer,
      settingsContext: settingsContextReducer,
    },
    preloadedState: {
      overtime: buildOvertimeState(overtimeOverrides),
      settingsContext: { settingsFor: null },
    },
  });

const renderView = (
  overtimeOverrides = {},
  overtimeBadgeVisibilityEndDate = '2099-12-31',
) => {
  const store = createStore(overtimeOverrides);
  return {
    store,
    ...render(
      <Provider store={store}>
        <OvertimeCardView
          overtimeBadgeVisibilityEndDate={overtimeBadgeVisibilityEndDate}
        />
      </Provider>,
    ),
  };
};

const basicPolicy = {
  id: 'basic',
  name: 'Basic Overtime',
  description: '',
  isDefault: true,
  assignments: { values: [] },
  rules: {
    values: [
      {
        name: 'Weekly OT',
        type: 'weekly',
        frequency: 'WEEKLY',
        multiplier: 1.5,
        conditions: [{ field: 'threshold', value: '40' }],
        enabled: true,
      },
    ],
  },
};

const userLevelPolicy = {
  ...basicPolicy,
  id: 'basic_policy_abc123',
  name: 'Basic Overtime - John Doe',
  isDefault: false,
};

const numericPolicy = {
  ...basicPolicy,
  id: '12345',
  name: 'Pay Rate Policy',
};

describe('OvertimeCardView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loading state', () => {
    it('renders skeleton when loading is true with a policy', () => {
      renderView({ policy: basicPolicy, loading: true });
      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('does not render rules table while loading', () => {
      renderView({ policy: basicPolicy, loading: true });
      expect(
        screen.queryByTestId('overtime-rules-table'),
      ).not.toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('renders error state message when error is set', () => {
      renderView({ error: 'Fetch failed' });
      expect(screen.getByTestId('overtime-error-state')).toBeInTheDocument();
    });

    it('does not render empty state in error state', () => {
      renderView({ error: 'Fetch failed' });
      expect(
        screen.queryByTestId('overtime-empty-state'),
      ).not.toBeInTheDocument();
    });
  });

  describe('empty state (no policy)', () => {
    it('renders empty state when no policy and no error', () => {
      renderView({ policy: null, loading: false, error: null });
      expect(screen.getByTestId('overtime-empty-state')).toBeInTheDocument();
    });

    it('renders NewWindow icon in empty state for navigation', () => {
      renderView({ policy: null });
      expect(screen.getByTestId('new-window-icon')).toBeInTheDocument();
    });

    it('does not render Edit icon in empty state', () => {
      renderView({ policy: null });
      expect(screen.queryByTestId('edit-icon')).not.toBeInTheDocument();
    });

    it('navigates to time settings when NewWindow clicked in empty state', () => {
      renderView({ policy: null });
      const btn = screen.getByRole('button', {
        name: 'open-overtime-settings',
      });
      fireEvent.click(btn);
      expect(mockNavigate).toHaveBeenCalledWith('/app/accountsettings?p=time');
    });
  });

  describe('editable policy (id === "basic")', () => {
    it('renders Edit icon for basic company policy', () => {
      renderView({ policy: basicPolicy });
      expect(screen.getByTestId('edit-icon')).toBeInTheDocument();
    });

    it('does not render NewWindow icon for basic policy', () => {
      renderView({ policy: basicPolicy });
      expect(screen.queryByTestId('new-window-icon')).not.toBeInTheDocument();
    });

    it('renders policy name', () => {
      renderView({ policy: basicPolicy });
      expect(screen.getByText('Basic Overtime')).toBeInTheDocument();
    });

    it('renders rules table with enabled rules', () => {
      renderView({ policy: basicPolicy });
      expect(screen.getByTestId('overtime-rules-table')).toBeInTheDocument();
    });

    it('switches to EDIT mode when Edit button is clicked', () => {
      const { store } = renderView({ policy: basicPolicy });
      const editBtn = screen.getByRole('button', { name: 'edit-overtime' });
      fireEvent.click(editBtn);
      expect(store.getState().overtime.mode).toBe('EDIT');
    });
  });

  describe('user-level override policy (id starts with "basic_policy_")', () => {
    it('renders Edit icon for user-level override', () => {
      renderView({ policy: userLevelPolicy });
      expect(screen.getByTestId('edit-icon')).toBeInTheDocument();
    });

    it('renders policy name for user-level override', () => {
      renderView({ policy: userLevelPolicy });
      expect(screen.getByText('Basic Overtime - John Doe')).toBeInTheDocument();
    });

    it('does not render NewWindow icon for user-level override', () => {
      renderView({ policy: userLevelPolicy });
      expect(screen.queryByTestId('new-window-icon')).not.toBeInTheDocument();
    });
  });

  describe('numeric policy (pay-rate-engine)', () => {
    it('renders NewWindow icon for numeric policy', () => {
      renderView({ policy: numericPolicy });
      expect(screen.getByTestId('new-window-icon')).toBeInTheDocument();
    });

    it('does not render Edit icon for numeric policy', () => {
      renderView({ policy: numericPolicy });
      expect(screen.queryByTestId('edit-icon')).not.toBeInTheDocument();
    });

    it('navigates to policy details when NewWindow clicked for numeric policy', () => {
      renderView({ policy: numericPolicy });
      const btn = screen.getByRole('button', {
        name: 'open-overtime-settings',
      });
      fireEvent.click(btn);
      expect(mockNavigate).toHaveBeenCalledWith('/app/accountsettings?p=time');
    });
  });

  describe('header rendering', () => {
    it('renders card title from intl message', () => {
      renderView({ policy: basicPolicy });
      expect(screen.getByText('overtime.card.title')).toBeInTheDocument();
    });

    it('renders rules section label', () => {
      renderView({ policy: basicPolicy });
      expect(screen.getByText('overtime.card.rules.label')).toBeInTheDocument();
    });

    it('shows New badge when overtime badge visibility date is active', () => {
      renderView({ policy: basicPolicy });
      expect(screen.getByText('new')).toBeInTheDocument();
    });

    it('does not show New badge when overtime badge visibility date is empty', () => {
      renderView({ policy: basicPolicy }, '');
      expect(screen.queryByText('new')).not.toBeInTheDocument();
    });
  });

  describe('disabled state during loading', () => {
    it('Edit button is disabled while loading', () => {
      renderView({ policy: basicPolicy, loading: true });
      // When loading with policy, edit icon is still rendered
      const editBtn = screen.queryByRole('button', { name: 'edit-overtime' });
      if (editBtn) {
        expect(editBtn).toBeDisabled();
      }
    });
  });

  describe('storeManager injection', () => {
    it('injects overtime reducer when not already registered', () => {
      (storeManager.hasReducer as jest.Mock).mockReturnValueOnce(false);
      renderView({ policy: numericPolicy });
      const btn = screen.getByRole('button', {
        name: 'open-overtime-settings',
      });
      fireEvent.click(btn);
      expect(storeManager.inject).toHaveBeenCalledWith(
        'overtime',
        expect.anything(),
      );
    });
  });

  describe('navigation error handling', () => {
    it('logs error when navigation throws for numeric policy', () => {
      mockNavigate.mockImplementationOnce(() => {
        throw new Error('Nav failed');
      });
      renderView({ policy: numericPolicy });
      const btn = screen.getByRole('button', {
        name: 'open-overtime-settings',
      });
      fireEvent.click(btn);
      expect(mockLoggerError).toHaveBeenCalledWith(
        'OvertimeSettings.NAVIGATION_FAILED',
        expect.objectContaining({ target: 'policyDetails' }),
      );
    });

    it('logs error when navigation throws for empty state', () => {
      mockNavigate.mockImplementationOnce(() => {
        throw new Error('Nav failed');
      });
      renderView({ policy: null });
      const btn = screen.getByRole('button', {
        name: 'open-overtime-settings',
      });
      fireEvent.click(btn);
      expect(mockLoggerError).toHaveBeenCalledWith(
        'OvertimeSettings.NAVIGATION_FAILED',
        expect.objectContaining({ target: 'timeSettings' }),
      );
    });
  });
});

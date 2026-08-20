// @ts-nocheck
/**
 * Tests for OvertimeCardEdit component
 *
 * Tests the EDIT-mode form: radio initialization, dirty-check, save/cancel
 * handlers, delete confirmation modal, and save error display.
 */

import React from 'react';
import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import OvertimeCardEdit from 'src/js/widgets/userSettings/components/cards/OvertimeCard/components/OvertimeCardEdit';
import overtimeReducer from 'src/js/widgets/userSettings/store/slices/overtimeSlice';
import settingsContextReducer from 'src/js/widgets/userSettings/store/slices/settingsContextSlice';

// Mocks
const mockMutate = jest.fn();
const mockQuery = jest.fn();

jest.mock('src/js/service/ApolloClientBuilder', () => ({
  getApolloClientInstance: jest.fn(),
}));
jest.mock('src/js/common/CustomerInteraction', () => ({
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  setInteractionDegraded: jest.fn(),
  getCustomerInteractionPropagationHeaders: jest.fn(() => ({})),
  TimeCustomerInteraction: {
    OVERTIME_POLICY_CREATE: 'overtime-policy-create',
    OVERTIME_POLICY_UPDATE: 'overtime-policy-update',
    OVERTIME_POLICY_DELETE: 'overtime-policy-delete',
  },
}));

const mockNavigate = jest.fn();
const mockLoggerInfo = jest.fn();
const mockLoggerError = jest.fn();

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: jest.fn(({ id }) => id),
  }),
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
  'src/js/widgets/qbtOrchestrator/features/overtime/components/PolicySetupWizard/OvertimeRulesConfig',
  () =>
    function MockOvertimeRulesConfig({
      onRulesChange,
      onValidationChange,
      onRuleTypeChange,
      isEditMode,
      policyId,
    }: any) {
      return (
        <div
          data-testid="overtime-rules-config"
          data-is-edit-mode={isEditMode}
          data-policy-id={policyId}
        >
          <button
            data-testid="trigger-valid"
            onClick={() => onValidationChange(true)}
          >
            Set Valid
          </button>
          <button
            data-testid="trigger-rules-change"
            onClick={() =>
              onRulesChange([
                {
                  name: 'Changed Rule',
                  type: 'weekly',
                  frequency: 'WEEKLY',
                  multiplier: 2.0,
                  conditions: [{ field: 'threshold', value: '40' }],
                  enabled: true,
                },
              ])
            }
          >
            Change Rules
          </button>
          <button
            data-testid="trigger-rule-type-change"
            onClick={() => onRuleTypeChange('california')}
          >
            Change Rule Type
          </button>
        </div>
      );
    },
);

jest.mock('@ids-ts/radio', () => ({
  RadioGroup: ({
    options,
    value,
    onChange,
    name,
  }: {
    options: any[];
    value: string;
    onChange: (e: any) => void;
    name: string;
  }) => (
    <div>
      {options.map((opt: any) => (
        <label key={opt.value} htmlFor={`${name}-${opt.value}`}>
          <input
            id={`${name}-${opt.value}`}
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={onChange}
            data-testid={`radio-${opt.value}`}
          />
          {opt.label}
        </label>
      ))}
    </div>
  ),
}));

jest.mock('@ids-ts/button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    'aria-label': ariaLabel,
    'data-testid': testId,
  }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      data-testid={testId}
    >
      {children}
    </button>
  ),
}));

jest.mock('@ids-ts/dropdown', () => {
  const Dropdown = ({
    children,
    value,
    onChange,
    'data-testid': testId,
    'aria-label': ariaLabel,
  }: any) => (
    <select
      data-testid={testId}
      value={value}
      onChange={onChange}
      aria-label={ariaLabel}
    >
      {children}
    </select>
  );
  const MenuItem = ({ value: v, children }: any) => (
    <option value={v}>{children}</option>
  );
  Dropdown.displayName = 'Dropdown';
  return { __esModule: true, default: Dropdown, MenuItem };
});

jest.mock('@ids-ts/modal-dialog', () => ({
  Modal: ({ children, open, 'data-testid': testId }: any) =>
    open ? <div data-testid={testId}>{children}</div> : null,
  ModalActions: ({ children, 'data-testid': testId }: any) => (
    <div data-testid={testId}>{children}</div>
  ),
  ModalContent: ({ children, 'data-testid': testId }: any) => (
    <div data-testid={testId}>{children}</div>
  ),
  ModalHeader: ({ onClose, 'data-testid': testId }: any) => (
    <div data-testid={testId}>
      <button onClick={onClose} data-testid="modal-close-x">
        X
      </button>
    </div>
  ),
}));

jest.mock('@ids-ts/loader', () => ({
  Activity: () => <span data-testid="activity-loader" />,
}));

jest.mock('@ids-ts/typography', () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
}));

jest.mock(
  'src/js/widgets/userSettings/components/cards/OvertimeCard/styles/OvertimeCard.styles',
  () => ({
    Section: ({ children }: any) => <div data-testid="section">{children}</div>,
    Divider: () => <hr />,
    ActionButtons: ({ children }: any) => (
      <div data-testid="action-buttons">{children}</div>
    ),
    CompanySettingsLink: ({ children, onClick, href }: any) => (
      <a href={href} onClick={onClick} data-testid="company-link">
        {children}
      </a>
    ),
    StyledPageMessage: ({ children, type, automationId, open, onClose }: any) =>
      open ? (
        <div data-testid={automationId} data-type={type}>
          {children}
          {onClose && (
            <button data-testid={`${automationId}-close`} onClick={onClose}>
              Close
            </button>
          )}
        </div>
      ) : null,
    DropdownWrapper: ({ children }: any) => <div>{children}</div>,
  }),
);

const basicRule = {
  name: 'Weekly OT',
  type: 'weekly' as const,
  frequency: 'WEEKLY' as const,
  multiplier: 1.5,
  conditions: [{ field: 'threshold' as const, value: '40' }],
  enabled: true,
};

const companyPolicy = {
  id: 'basic',
  name: 'Basic Overtime',
  description: '',
  isDefault: true,
  assignments: { values: [] },
  rules: { values: [basicRule] },
};

const userLevelPolicy = {
  id: 'basic_policy_abc123',
  name: 'Basic Overtime - John Doe',
  description: '',
  isDefault: false,
  assignments: { values: [] },
  rules: { values: [basicRule] },
};

const buildOvertimeState = (overrides = {}) => ({
  mode: 'EDIT',
  policy: companyPolicy,
  loading: false,
  error: null,
  overtimeRuleType: 'basic',
  draftRules: [basicRule],
  ...overrides,
});

const createStore = (
  overtimeOverrides = {},
  settingsForOverride: any = undefined,
) =>
  configureStore({
    reducer: {
      overtime: overtimeReducer,
      settingsContext: settingsContextReducer,
    },
    preloadedState: {
      overtime: buildOvertimeState(overtimeOverrides),
      settingsContext: {
        settingsFor:
          settingsForOverride !== undefined
            ? settingsForOverride
            : {
                id: 'user-123',
                displayName: 'John Doe',
                timeForType: 'employee',
              },
      },
    },
  });

const renderEdit = (overtimeOverrides = {}, settingsForOverride?: any) => {
  const store = createStore(
    overtimeOverrides,
    settingsForOverride !== undefined ? settingsForOverride : undefined,
  );

  const {
    getApolloClientInstance,
  } = require('src/js/service/ApolloClientBuilder');
  const mockApolloClient: any = { mutate: mockMutate, query: mockQuery };
  getApolloClientInstance.mockReturnValue(mockApolloClient);

  return {
    store,
    ...render(
      <Provider store={store}>
        <OvertimeCardEdit />
      </Provider>,
    ),
  };
};

describe('OvertimeCardEdit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const {
      getApolloClientInstance,
    } = require('src/js/service/ApolloClientBuilder');
    getApolloClientInstance.mockReturnValue({
      mutate: mockMutate,
      query: mockQuery,
    });
  });

  describe('initial render', () => {
    it('renders info banner', () => {
      renderEdit();
      expect(
        screen.getByTestId('OvertimeCardEditInfoBanner'),
      ).toBeInTheDocument();
    });

    it('logs when check laws link is clicked', () => {
      renderEdit();
      const infoBanner = screen.getByTestId('OvertimeCardEditInfoBanner');
      const link = infoBanner.querySelector('a');
      expect(link).toBeInTheDocument();
      fireEvent.click(link!);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        'OvertimeSettings.CHECK_LAWS_LINK_CLICKED',
      );
    });

    it('renders cancel button', () => {
      renderEdit();
      expect(
        screen.getByRole('button', { name: 'cancel-overtime' }),
      ).toBeInTheDocument();
    });

    it('renders save button', () => {
      renderEdit();
      expect(
        screen.getByRole('button', { name: 'save-overtime' }),
      ).toBeInTheDocument();
    });

    it('renders radio group with company and custom options', () => {
      renderEdit();
      expect(screen.getByTestId('radio-company')).toBeInTheDocument();
      expect(screen.getByTestId('radio-custom')).toBeInTheDocument();
    });

    it('renders without crashing', () => {
      expect(() => renderEdit()).not.toThrow();
    });

    it('unmounts without errors', () => {
      const { unmount } = renderEdit();
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('radio selection initialization', () => {
    it('pre-selects company radio for company-assigned policy (id === "basic")', () => {
      renderEdit({ policy: companyPolicy });
      expect(screen.getByTestId('radio-company')).toBeChecked();
      expect(screen.getByTestId('radio-custom')).not.toBeChecked();
    });

    it('pre-selects custom radio for user-level override (basic_policy_*)', () => {
      renderEdit({
        policy: userLevelPolicy,
        overtimeRuleType: 'basic',
        draftRules: [basicRule],
      });
      expect(screen.getByTestId('radio-custom')).toBeChecked();
      expect(screen.getByTestId('radio-company')).not.toBeChecked();
    });

    it('pre-selects company radio when policy is null', () => {
      renderEdit({ policy: null });
      expect(screen.getByTestId('radio-company')).toBeChecked();
    });
  });

  describe('custom radio selection', () => {
    it('shows rules config and dropdown when custom radio is selected', () => {
      renderEdit({
        policy: userLevelPolicy,
        overtimeRuleType: 'basic',
        draftRules: [basicRule],
      });
      expect(screen.getByTestId('overtime-rules-config')).toBeInTheDocument();
      expect(
        screen.getByTestId('overtime-card-edit-rule-type-dropdown'),
      ).toBeInTheDocument();
    });

    it('passes isEditMode and policyId props to OvertimeRulesConfig', () => {
      renderEdit({
        policy: userLevelPolicy,
        overtimeRuleType: 'basic',
        draftRules: [basicRule],
      });
      const rulesConfig = screen.getByTestId('overtime-rules-config');
      expect(rulesConfig).toHaveAttribute('data-is-edit-mode', 'true');
      expect(rulesConfig).toHaveAttribute('data-policy-id', userLevelPolicy.id);
    });

    it('dispatches setDraftRuleType when dropdown value changes', () => {
      const { store } = renderEdit({
        policy: userLevelPolicy,
        overtimeRuleType: 'basic',
        draftRules: [basicRule],
      });
      const dropdown = screen.getByTestId(
        'overtime-card-edit-rule-type-dropdown',
      );
      fireEvent.change(dropdown, { target: { value: 'california' } });
      expect(store.getState().overtime.overtimeRuleType).toBe('california');
    });
  });

  describe('save button disabled state', () => {
    it('save is disabled when not dirty (no changes)', () => {
      renderEdit({ policy: companyPolicy });
      const saveBtn = screen.getByRole('button', { name: 'save-overtime' });
      expect(saveBtn).toBeDisabled();
    });
  });

  describe('cancel button', () => {
    it('switches mode back to VIEW when cancel is clicked', () => {
      const { store } = renderEdit();
      const cancelBtn = screen.getByRole('button', { name: 'cancel-overtime' });
      fireEvent.click(cancelBtn);
      expect(store.getState().overtime.mode).toBe('VIEW');
    });

    it('clears draft state when cancel is clicked', () => {
      const { store } = renderEdit({
        overtimeRuleType: 'california',
        draftRules: [basicRule],
      });
      fireEvent.click(screen.getByRole('button', { name: 'cancel-overtime' }));
      expect(store.getState().overtime.overtimeRuleType).toBe('');
      expect(store.getState().overtime.draftRules).toEqual([]);
    });
  });

  describe('company settings link', () => {
    it('renders company settings link', () => {
      renderEdit({ policy: companyPolicy });
      expect(screen.getByTestId('company-link')).toBeInTheDocument();
    });

    it('navigates to overtime policies page when company link is clicked', () => {
      renderEdit({ policy: companyPolicy });
      const link = screen.getByTestId('company-link');
      fireEvent.click(link);
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('overtime'),
      );
    });
  });

  describe('radio switching — user-level override confirms deletion', () => {
    it('shows delete confirmation modal when switching to company (has user override)', () => {
      renderEdit({
        policy: userLevelPolicy,
        overtimeRuleType: 'basic',
        draftRules: [basicRule],
      });
      fireEvent.click(screen.getByTestId('radio-company'));
      expect(
        screen.getByTestId('overtime-delete-confirm-modal'),
      ).toBeInTheDocument();
    });

    it('cancel in delete confirm modal closes it', () => {
      renderEdit({
        policy: userLevelPolicy,
        overtimeRuleType: 'basic',
        draftRules: [basicRule],
      });
      fireEvent.click(screen.getByTestId('radio-company'));
      expect(
        screen.getByTestId('overtime-delete-confirm-modal'),
      ).toBeInTheDocument();

      fireEvent.click(
        screen.getByTestId('overtime-delete-confirm-modal-cancel'),
      );
      expect(
        screen.queryByTestId('overtime-delete-confirm-modal'),
      ).not.toBeInTheDocument();
    });

    it('closing modal via X button also closes it', () => {
      renderEdit({
        policy: userLevelPolicy,
        overtimeRuleType: 'basic',
        draftRules: [basicRule],
      });
      fireEvent.click(screen.getByTestId('radio-company'));
      fireEvent.click(screen.getByTestId('modal-close-x'));
      expect(
        screen.queryByTestId('overtime-delete-confirm-modal'),
      ).not.toBeInTheDocument();
    });

    it('confirming delete closes modal and makes save enabled', async () => {
      renderEdit({
        policy: userLevelPolicy,
        overtimeRuleType: 'basic',
        draftRules: [basicRule],
      });
      fireEvent.click(screen.getByTestId('radio-company'));
      fireEvent.click(
        screen.getByTestId('overtime-delete-confirm-modal-confirm'),
      );

      expect(
        screen.queryByTestId('overtime-delete-confirm-modal'),
      ).not.toBeInTheDocument();

      // After confirming delete + settling, save should be enabled (isDirty=true)
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'save-overtime' }),
        ).not.toBeDisabled();
      });
    });
  });

  describe('save — error handling', () => {
    it('shows save error banner when settingsFor.id is missing', async () => {
      // Without settingsFor, save should show an error
      renderEdit({ policy: companyPolicy }, null);

      // Switch radio to custom to make isDirty = true
      fireEvent.click(screen.getByTestId('radio-custom'));

      // Mark as valid
      const triggerValid = await waitFor(() =>
        screen.getByTestId('trigger-valid'),
      );
      fireEvent.click(triggerValid);

      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: 'save-overtime' }),
        ).not.toBeDisabled(),
      );

      fireEvent.click(screen.getByRole('button', { name: 'save-overtime' }));

      await waitFor(() =>
        expect(
          screen.getByTestId('OvertimeCardEditErrorBanner'),
        ).toBeInTheDocument(),
      );
    });

    it('shows save error banner when mutation throws a non-Error value', async () => {
      mockMutate.mockRejectedValueOnce('string error');

      renderEdit({
        policy: userLevelPolicy,
        overtimeRuleType: 'basic',
        draftRules: [basicRule],
      });

      fireEvent.click(screen.getByTestId('radio-company'));
      fireEvent.click(
        screen.getByTestId('overtime-delete-confirm-modal-confirm'),
      );

      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: 'save-overtime' }),
        ).not.toBeDisabled(),
      );

      fireEvent.click(screen.getByRole('button', { name: 'save-overtime' }));

      await waitFor(() =>
        expect(
          screen.getByTestId('OvertimeCardEditErrorBanner'),
        ).toBeInTheDocument(),
      );
    });

    it('shows save error banner when mutation throws', async () => {
      mockMutate.mockRejectedValueOnce(new Error('Mutation failed'));

      // Start with user-level policy so confirming delete makes it dirty
      renderEdit({
        policy: userLevelPolicy,
        overtimeRuleType: 'basic',
        draftRules: [basicRule],
      });

      // Switch to company radio → confirm delete modal → enables save
      fireEvent.click(screen.getByTestId('radio-company'));
      fireEvent.click(
        screen.getByTestId('overtime-delete-confirm-modal-confirm'),
      );

      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: 'save-overtime' }),
        ).not.toBeDisabled(),
      );

      fireEvent.click(screen.getByRole('button', { name: 'save-overtime' }));

      await waitFor(() =>
        expect(
          screen.getByTestId('OvertimeCardEditErrorBanner'),
        ).toBeInTheDocument(),
      );
    });

    it('logs the operation type when a mutation fails', async () => {
      mockMutate.mockRejectedValueOnce(new Error('Mutation failed'));

      renderEdit({
        policy: userLevelPolicy,
        overtimeRuleType: 'basic',
        draftRules: [basicRule],
      });

      fireEvent.click(screen.getByTestId('radio-company'));
      fireEvent.click(
        screen.getByTestId('overtime-delete-confirm-modal-confirm'),
      );

      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: 'save-overtime' }),
        ).not.toBeDisabled(),
      );

      fireEvent.click(screen.getByRole('button', { name: 'save-overtime' }));

      await waitFor(() =>
        expect(mockLoggerError).toHaveBeenCalledWith(
          'OvertimeSettings.SAVE_FAILED',
          expect.objectContaining({ operation: 'delete' }),
        ),
      );
    });
  });

  describe('save — delete user-level override', () => {
    const triggerDeleteSave = async () => {
      renderEdit({
        policy: userLevelPolicy,
        overtimeRuleType: 'basic',
        draftRules: [basicRule],
      });
      fireEvent.click(screen.getByTestId('radio-company'));
      fireEvent.click(
        screen.getByTestId('overtime-delete-confirm-modal-confirm'),
      );
      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: 'save-overtime' }),
        ).not.toBeDisabled(),
      );
      fireEvent.click(screen.getByRole('button', { name: 'save-overtime' }));
    };

    it('calls DELETE mutation with policy id (without userId) and refetches', async () => {
      mockMutate.mockResolvedValueOnce({ errors: undefined, data: {} });
      mockQuery.mockResolvedValueOnce({
        data: { overtimePolicies: { values: [companyPolicy] } },
      });

      await triggerDeleteSave();

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              id: userLevelPolicy.id,
            }),
          }),
        );
        // Verify userId is NOT in the variables
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: expect.not.objectContaining({
              userId: expect.anything(),
            }),
          }),
        );
      });
      await waitFor(() => expect(mockQuery).toHaveBeenCalled());
    });

    it('transitions to VIEW without delete when policy id is missing on delete save', async () => {
      const { store } = renderEdit({
        policy: userLevelPolicy,
        overtimeRuleType: 'basic',
        draftRules: [basicRule],
      });

      // Switch to company radio and confirm delete → isDirty=true
      fireEvent.click(screen.getByTestId('radio-company'));
      fireEvent.click(
        screen.getByTestId('overtime-delete-confirm-modal-confirm'),
      );

      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: 'save-overtime' }),
        ).not.toBeDisabled(),
      );

      // Clear the policy id in Redux so the non-override guard is hit
      const {
        setOvertimePolicy,
      } = require('src/js/widgets/userSettings/store/slices/overtimeSlice');
      act(() => {
        store.dispatch(
          setOvertimePolicy({ ...userLevelPolicy, id: undefined }),
        );
      });

      fireEvent.click(screen.getByRole('button', { name: 'save-overtime' }));

      // Should transition to VIEW without calling delete mutation
      await waitFor(() => expect(store.getState().overtime.mode).toBe('VIEW'));
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('transitions to VIEW without delete for non-override (basic) policy', async () => {
      const { store } = renderEdit({
        policy: userLevelPolicy,
        overtimeRuleType: 'basic',
        draftRules: [basicRule],
      });

      // Switch to company radio and confirm delete → isDirty=true
      fireEvent.click(screen.getByTestId('radio-company'));
      fireEvent.click(
        screen.getByTestId('overtime-delete-confirm-modal-confirm'),
      );

      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: 'save-overtime' }),
        ).not.toBeDisabled(),
      );

      // Set policy to company-level (id='basic') so the guard skips delete
      const {
        setOvertimePolicy,
      } = require('src/js/widgets/userSettings/store/slices/overtimeSlice');
      act(() => {
        store.dispatch(setOvertimePolicy(companyPolicy));
      });

      fireEvent.click(screen.getByRole('button', { name: 'save-overtime' }));

      await waitFor(() => expect(store.getState().overtime.mode).toBe('VIEW'));
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('transitions to VIEW when delete succeeds but refetch fails', async () => {
      mockMutate.mockResolvedValueOnce({ errors: undefined, data: {} });
      mockQuery.mockRejectedValueOnce(new Error('Refetch network error'));

      const { store } = renderEdit({
        policy: userLevelPolicy,
        overtimeRuleType: 'basic',
        draftRules: [basicRule],
      });

      fireEvent.click(screen.getByTestId('radio-company'));
      fireEvent.click(
        screen.getByTestId('overtime-delete-confirm-modal-confirm'),
      );

      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: 'save-overtime' }),
        ).not.toBeDisabled(),
      );

      fireEvent.click(screen.getByRole('button', { name: 'save-overtime' }));

      // Delete succeeded, refetch failed — should still transition to VIEW
      await waitFor(() => expect(store.getState().overtime.mode).toBe('VIEW'));
      expect(mockMutate).toHaveBeenCalled();
      expect(mockQuery).toHaveBeenCalled();
      // Should log the refetch error
      expect(mockLoggerError).toHaveBeenCalledWith(
        'OvertimeSettings.FETCH_POLICY_FAILED',
        expect.objectContaining({ error: 'Refetch network error' }),
      );
    });

    it('shows error when Apollo client is not initialized on delete save', async () => {
      const {
        getApolloClientInstance,
      } = require('src/js/service/ApolloClientBuilder');

      renderEdit({
        policy: userLevelPolicy,
        overtimeRuleType: 'basic',
        draftRules: [basicRule],
      });

      // Switch to company radio and confirm delete → isDirty=true
      fireEvent.click(screen.getByTestId('radio-company'));
      fireEvent.click(
        screen.getByTestId('overtime-delete-confirm-modal-confirm'),
      );

      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: 'save-overtime' }),
        ).not.toBeDisabled(),
      );

      // Return null from getApolloClientInstance so the !client branch is hit
      getApolloClientInstance.mockReturnValue(null);

      fireEvent.click(screen.getByRole('button', { name: 'save-overtime' }));

      await waitFor(() =>
        expect(
          screen.getByTestId('OvertimeCardEditErrorBanner'),
        ).toBeInTheDocument(),
      );
    });

    it('shows error when delete mutation returns GraphQL errors', async () => {
      mockMutate.mockResolvedValueOnce({
        errors: [{ message: 'Delete failed' }],
      });

      await triggerDeleteSave();

      await waitFor(() =>
        expect(
          screen.getByTestId('OvertimeCardEditErrorBanner'),
        ).toBeInTheDocument(),
      );
    });
  });

  describe('save — update existing user-level override', () => {
    // To make isDirty=true: change the dropdown (ruleType) from 'basic' to 'california'
    const triggerUpdateSave = async (mutateResult: any) => {
      mockMutate.mockResolvedValueOnce(mutateResult);

      const { store } = renderEdit({
        policy: userLevelPolicy,
        overtimeRuleType: 'basic',
        draftRules: [basicRule],
      });

      // Change dropdown to california → isDirty=true (ruleType changed from baseline)
      const dropdown = screen.getByTestId(
        'overtime-card-edit-rule-type-dropdown',
      );
      fireEvent.change(dropdown, { target: { value: 'california' } });

      // Mark as valid
      const triggerValid = await waitFor(() =>
        screen.getByTestId('trigger-valid'),
      );
      fireEvent.click(triggerValid);

      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: 'save-overtime' }),
        ).not.toBeDisabled(),
      );

      fireEvent.click(screen.getByRole('button', { name: 'save-overtime' }));
      return store;
    };

    it('calls UPDATE mutation with basic id on success', async () => {
      const savedPolicy = {
        ...userLevelPolicy,
        rules: { values: [{ ...basicRule, multiplier: 2.0 }] },
      };
      const store = await triggerUpdateSave({
        data: { updateOvertimePolicy: { policy: savedPolicy } },
      });

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              // For user-level override updates, API expects 'basic' as the id
              // and passes userId in the input object
              id: 'basic',
            }),
          }),
        );
      });
      await waitFor(() => expect(store.getState().overtime.mode).toBe('VIEW'));
    });

    it('shows error when update returns GraphQL errors', async () => {
      await triggerUpdateSave({
        errors: [{ message: 'Update failed' }],
      });

      await waitFor(() =>
        expect(
          screen.getByTestId('OvertimeCardEditErrorBanner'),
        ).toBeInTheDocument(),
      );
    });

    it('shows error when update returns no policy', async () => {
      await triggerUpdateSave({
        data: { updateOvertimePolicy: { policy: null } },
      });

      await waitFor(() =>
        expect(
          screen.getByTestId('OvertimeCardEditErrorBanner'),
        ).toBeInTheDocument(),
      );
    });

    it('handles non-Error exception in update path', async () => {
      mockMutate.mockRejectedValueOnce('string error in update');

      renderEdit({
        policy: userLevelPolicy,
        overtimeRuleType: 'basic',
        draftRules: [basicRule],
      });

      // Change dropdown to california → isDirty=true (ruleType changed from baseline)
      const dropdown = screen.getByTestId(
        'overtime-card-edit-rule-type-dropdown',
      );
      fireEvent.change(dropdown, { target: { value: 'california' } });

      // Mark as valid
      const triggerValid = await waitFor(() =>
        screen.getByTestId('trigger-valid'),
      );
      fireEvent.click(triggerValid);

      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: 'save-overtime' }),
        ).not.toBeDisabled(),
      );

      fireEvent.click(screen.getByRole('button', { name: 'save-overtime' }));

      await waitFor(() =>
        expect(
          screen.getByTestId('OvertimeCardEditErrorBanner'),
        ).toBeInTheDocument(),
      );
      expect(mockLoggerError).toHaveBeenCalledWith(
        'OvertimeSettings.UPDATE_POLICY_FAILED',
        expect.objectContaining({ error: 'string error in update' }),
      );
    });
  });

  describe('save — create new user-level override', () => {
    // To trigger create path: company policy (id='basic') + custom radio selected
    const triggerCreateSave = async (mutateResult: any) => {
      mockMutate.mockResolvedValueOnce(mutateResult);

      // Render with company policy on company radio, then switch to custom
      const { store } = renderEdit({ policy: companyPolicy });

      // Switch to custom radio → isDirty=true (radio changed from baseline)
      // initializeEditDraft(companyPolicy) dispatched → sets ruleType='basic'
      fireEvent.click(screen.getByTestId('radio-custom'));

      // Mark as valid (OvertimeRulesConfig should now be visible)
      const triggerValid = await waitFor(() =>
        screen.getByTestId('trigger-valid'),
      );
      fireEvent.click(triggerValid);

      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: 'save-overtime' }),
        ).not.toBeDisabled(),
      );

      fireEvent.click(screen.getByRole('button', { name: 'save-overtime' }));
      return store;
    };

    it('calls CREATE mutation and switches to VIEW on success', async () => {
      const savedPolicy = {
        id: 'basic_policy_new123',
        name: 'Basic Overtime - John Doe',
        description: '',
        isDefault: false,
        assignments: { values: [] },
        rules: { values: [basicRule] },
      };

      const store = await triggerCreateSave({
        data: { createOvertimePolicy: { policy: savedPolicy } },
      });

      await waitFor(() => expect(mockMutate).toHaveBeenCalled());
      await waitFor(() => expect(store.getState().overtime.mode).toBe('VIEW'));
    });

    it('shows error when create returns GraphQL errors', async () => {
      await triggerCreateSave({
        errors: [{ message: 'Create failed' }],
      });

      await waitFor(() =>
        expect(
          screen.getByTestId('OvertimeCardEditErrorBanner'),
        ).toBeInTheDocument(),
      );
    });

    it('shows error when create returns no policy', async () => {
      await triggerCreateSave({
        data: { createOvertimePolicy: { policy: null } },
      });

      await waitFor(() =>
        expect(
          screen.getByTestId('OvertimeCardEditErrorBanner'),
        ).toBeInTheDocument(),
      );
    });

    it('handles non-Error exception in create path', async () => {
      // Set the rejection BEFORE rendering so mockMutate is ready
      mockMutate.mockRejectedValueOnce('string error in create');

      // Render with company policy on company radio, then switch to custom
      renderEdit({ policy: companyPolicy });

      // Switch to custom radio → isDirty=true (radio changed from baseline)
      fireEvent.click(screen.getByTestId('radio-custom'));

      // Mark as valid (OvertimeRulesConfig should now be visible)
      const triggerValid = await waitFor(() =>
        screen.getByTestId('trigger-valid'),
      );
      fireEvent.click(triggerValid);

      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: 'save-overtime' }),
        ).not.toBeDisabled(),
      );

      fireEvent.click(screen.getByRole('button', { name: 'save-overtime' }));

      await waitFor(() =>
        expect(
          screen.getByTestId('OvertimeCardEditErrorBanner'),
        ).toBeInTheDocument(),
      );
      expect(mockLoggerError).toHaveBeenCalledWith(
        'OvertimeSettings.CREATE_POLICY_FAILED',
        expect.objectContaining({ error: 'string error in create' }),
      );
    });
  });

  describe('save — error banner dismissal', () => {
    it('clears save error when error banner close is clicked', async () => {
      mockMutate.mockRejectedValueOnce(new Error('Fail'));

      renderEdit({
        policy: userLevelPolicy,
        overtimeRuleType: 'basic',
        draftRules: [basicRule],
      });

      fireEvent.click(screen.getByTestId('radio-company'));
      fireEvent.click(
        screen.getByTestId('overtime-delete-confirm-modal-confirm'),
      );

      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: 'save-overtime' }),
        ).not.toBeDisabled(),
      );

      fireEvent.click(screen.getByRole('button', { name: 'save-overtime' }));

      await waitFor(() =>
        expect(
          screen.getByTestId('OvertimeCardEditErrorBanner'),
        ).toBeInTheDocument(),
      );

      fireEvent.click(screen.getByTestId('OvertimeCardEditErrorBanner-close'));
      expect(
        screen.queryByTestId('OvertimeCardEditErrorBanner'),
      ).not.toBeInTheDocument();
    });
  });

  describe('rules normalization via onRulesChange', () => {
    it('dispatches setDraftRules when rules config triggers change', () => {
      const { store } = renderEdit({
        policy: userLevelPolicy,
        overtimeRuleType: 'basic',
        draftRules: [basicRule],
      });

      fireEvent.click(screen.getByTestId('trigger-rules-change'));
      const { draftRules } = store.getState().overtime;
      expect(draftRules).toHaveLength(1);
      expect(draftRules[0].multiplier).toBe(2.0);
    });

    it('dispatches setDraftRuleType via onRuleTypeChange callback', () => {
      const { store } = renderEdit({
        policy: userLevelPolicy,
        overtimeRuleType: 'basic',
        draftRules: [basicRule],
      });

      fireEvent.click(screen.getByTestId('trigger-rule-type-change'));
      expect(store.getState().overtime.overtimeRuleType).toBe('california');
    });

    it('updates baseline after rule type switch normalization', async () => {
      renderEdit({
        policy: userLevelPolicy,
        overtimeRuleType: 'basic',
        draftRules: [basicRule],
      });

      // Change dropdown (sets ruleTypeJustChanged=true)
      const dropdown = screen.getByTestId(
        'overtime-card-edit-rule-type-dropdown',
      );
      fireEvent.change(dropdown, { target: { value: 'california' } });

      // Trigger onRulesChange as normalization from config after type change
      // This hits the ruleTypeJustChanged.current branch (lines 412-414)
      fireEvent.click(screen.getByTestId('trigger-rules-change'));

      // Now trigger valid and verify save state
      fireEvent.click(screen.getByTestId('trigger-valid'));

      // After normalization, the baseline should have updated rules,
      // but ruleType still differs from baseline → isDirty=true
      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: 'save-overtime' }),
        ).not.toBeDisabled(),
      );
    });
  });

  describe('degraded status code handling', () => {
    const { setInteractionDegraded } = jest.requireMock(
      'src/js/common/CustomerInteraction',
    );

    describe('update — degraded', () => {
      it('shows error banner when update returns a degraded status code', async () => {
        mockMutate.mockResolvedValueOnce({
          data: {
            updateOvertimePolicy: {
              policy: null,
              status: { statusCode: 9463, message: 'server msg' },
            },
          },
        });

        renderEdit({
          policy: userLevelPolicy,
          overtimeRuleType: 'basic',
          draftRules: [basicRule],
        });

        const dropdown = screen.getByTestId(
          'overtime-card-edit-rule-type-dropdown',
        );
        fireEvent.change(dropdown, { target: { value: 'california' } });

        const triggerValid = await waitFor(() =>
          screen.getByTestId('trigger-valid'),
        );
        fireEvent.click(triggerValid);

        await waitFor(() =>
          expect(
            screen.getByRole('button', { name: 'save-overtime' }),
          ).not.toBeDisabled(),
        );

        fireEvent.click(screen.getByRole('button', { name: 'save-overtime' }));

        await waitFor(() =>
          expect(
            screen.getByTestId('OvertimeCardEditErrorBanner'),
          ).toBeInTheDocument(),
        );
        expect(setInteractionDegraded).toHaveBeenCalledWith(
          expect.anything(),
          'overtime-policy-update',
          '9463',
        );
      });
    });

    describe('create — degraded', () => {
      it('shows error banner when create returns a degraded status code', async () => {
        mockMutate.mockResolvedValueOnce({
          data: {
            createOvertimePolicy: {
              policy: null,
              status: { statusCode: 9463, message: 'server msg' },
            },
          },
        });

        renderEdit({ policy: companyPolicy });

        fireEvent.click(screen.getByTestId('radio-custom'));

        const triggerValid = await waitFor(() =>
          screen.getByTestId('trigger-valid'),
        );
        fireEvent.click(triggerValid);

        await waitFor(() =>
          expect(
            screen.getByRole('button', { name: 'save-overtime' }),
          ).not.toBeDisabled(),
        );

        fireEvent.click(screen.getByRole('button', { name: 'save-overtime' }));

        await waitFor(() =>
          expect(
            screen.getByTestId('OvertimeCardEditErrorBanner'),
          ).toBeInTheDocument(),
        );
        expect(setInteractionDegraded).toHaveBeenCalledWith(
          expect.anything(),
          'overtime-policy-create',
          '9463',
        );
      });
    });

    describe('delete — degraded', () => {
      it('shows error banner when delete returns a degraded status code', async () => {
        mockMutate.mockResolvedValueOnce({
          data: {
            deleteOvertimePolicy: {
              deletedPolicyId: null,
              status: { statusCode: 9463, message: 'server msg' },
            },
          },
        });

        renderEdit({
          policy: userLevelPolicy,
          overtimeRuleType: 'basic',
          draftRules: [basicRule],
        });

        fireEvent.click(screen.getByTestId('radio-company'));
        fireEvent.click(
          screen.getByTestId('overtime-delete-confirm-modal-confirm'),
        );

        await waitFor(() =>
          expect(
            screen.getByRole('button', { name: 'save-overtime' }),
          ).not.toBeDisabled(),
        );

        fireEvent.click(screen.getByRole('button', { name: 'save-overtime' }));

        await waitFor(() =>
          expect(
            screen.getByTestId('OvertimeCardEditErrorBanner'),
          ).toBeInTheDocument(),
        );
        expect(setInteractionDegraded).toHaveBeenCalledWith(
          expect.anything(),
          'overtime-policy-delete',
          '9463',
        );
      });
    });

    describe('generic degraded code', () => {
      it('shows error banner when update returns a generic degraded status code (9410)', async () => {
        mockMutate.mockResolvedValueOnce({
          data: {
            updateOvertimePolicy: {
              policy: null,
              status: { statusCode: '9410', message: 'server msg' },
            },
          },
        });

        renderEdit({
          policy: userLevelPolicy,
          overtimeRuleType: 'basic',
          draftRules: [basicRule],
        });

        const dropdown = screen.getByTestId(
          'overtime-card-edit-rule-type-dropdown',
        );
        fireEvent.change(dropdown, { target: { value: 'california' } });

        const triggerValid = await waitFor(() =>
          screen.getByTestId('trigger-valid'),
        );
        fireEvent.click(triggerValid);

        await waitFor(() =>
          expect(
            screen.getByRole('button', { name: 'save-overtime' }),
          ).not.toBeDisabled(),
        );

        fireEvent.click(screen.getByRole('button', { name: 'save-overtime' }));

        await waitFor(() =>
          expect(
            screen.getByTestId('OvertimeCardEditErrorBanner'),
          ).toBeInTheDocument(),
        );
        expect(setInteractionDegraded).toHaveBeenCalledWith(
          expect.anything(),
          'overtime-policy-update',
          '9410',
        );
      });
    });
  });

  describe('radio switching — no user-level override', () => {
    it('switches to company immediately without confirm modal when no override', () => {
      renderEdit({
        policy: companyPolicy,
        overtimeRuleType: 'basic',
        draftRules: [basicRule],
      });

      // Start on custom
      fireEvent.click(screen.getByTestId('radio-custom'));

      // Switch back to company — no modal since policy.id is 'basic' (not basic_policy_*)
      fireEvent.click(screen.getByTestId('radio-company'));
      expect(
        screen.queryByTestId('overtime-delete-confirm-modal'),
      ).not.toBeInTheDocument();
    });

    it('switching to custom restores draft from policy', () => {
      const { store } = renderEdit({
        policy: userLevelPolicy,
        overtimeRuleType: 'basic',
        draftRules: [basicRule],
      });

      // Confirm switch to company
      fireEvent.click(screen.getByTestId('radio-company'));
      fireEvent.click(
        screen.getByTestId('overtime-delete-confirm-modal-confirm'),
      );

      // Switch back to custom — should re-initialize draft from policy
      fireEvent.click(screen.getByTestId('radio-custom'));
      expect(store.getState().overtime.draftRules.length).toBeGreaterThan(0);
    });
  });
});

// @ts-nocheck
/**
 * Tests for PermissionsCardEdit.
 *
 * Covers the null guard, admin display overrides (all rows forced + disabled),
 * worker draft dispatches for every field, schedule scope containment (view ⊇
 * manage), projects option gating (Manage hidden unless already held), company
 * SDK locks, and the save/cancel footer.
 */

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import PermissionsCardEdit from 'src/js/widgets/userSettings/components/cards/PermissionsCard/components/PermissionsCardEdit';
import permissionsReducer, {
  setDraftRole,
  setDraftMobileTimeEntry,
  setDraftManageMyTimesheets,
  setDraftViewSchedule,
  setDraftViewScheduleScope,
  setDraftManageSchedule,
  setDraftManageScheduleScope,
  setDraftProjectsAccess,
  setDraftViewWhosWorking,
} from 'src/js/widgets/userSettings/store/slices/permissionsSlice';
import { PermissionsCardMode } from 'src/js/widgets/userSettings/components/cards/PermissionsCard/types/PermissionsCard.types';

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({ formatMessage: ({ id }) => id }),
}));

jest.mock('@ids-ts/typography', () => ({
  B1: ({ children }) => <div>{children}</div>,
  B2: ({ children }) => <div>{children}</div>,
  B4: ({ children }) => <div>{children}</div>,
  Demi: ({ children }) => <span>{children}</span>,
  Medium: ({ children }) => <span>{children}</span>,
}));

jest.mock('@ids-ts/button', () => ({
  Button: ({ children, onClick, disabled }) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

jest.mock('@ids-ts/checkbox', () => ({
  Checkbox: ({
    children,
    checked,
    disabled,
    onChange,
    'data-testid': testId,
  }) => (
    <span>
      <input
        type="checkbox"
        data-testid={testId}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange({ target: { checked: e.target.checked } })}
      />
      <span>{children}</span>
    </span>
  ),
}));

jest.mock('@ids-ts/radio', () => ({
  RadioGroup: ({ options, value, onChange, name, label, disabled }) => (
    <div data-testid={`radiogroup-${name}`}>
      {label}
      {options.map((o) => (
        <label key={o.value} data-testid={`radio-${name}-${o.value}`}>
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={value === o.value}
            disabled={disabled || o.disabled}
            onChange={() => onChange({ target: { value: o.value } })}
          />
          {o.label}
        </label>
      ))}
    </div>
  ),
}));

jest.mock('@ids-ts/tooltip', () => ({
  __esModule: true,
  default: ({ children }) => <span>{children}</span>,
}));

jest.mock('@design-systems/icons', () => ({
  CircleQuestion: () => <span data-testid="help-icon" />,
}));

const buildPermissions = (overrides = {}) => ({
  role: 'worker',
  timesheets: { mobileTimeEntry: false, manageMyTimesheets: false },
  schedule: {
    viewSchedule: false,
    viewScheduleScope: 'their_own',
    manageSchedule: false,
    manageScheduleScope: 'their_own',
  },
  projectsAccess: 'no_access',
  company: { viewWhosWorking: false, viewWhosWorkingScope: 'all_workers' },
  ...overrides,
});

const defaultFlags = {
  canUseCompanyMobile: false,
  canCompanyManageMyTimesheets: false,
};

const createStore = ({
  draft = buildPermissions(),
  persisted = buildPermissions(),
  saving = false,
} = {}) =>
  configureStore({
    reducer: { permissions: permissionsReducer },
    preloadedState: {
      permissions: {
        mode: PermissionsCardMode.EDIT,
        permissions: persisted,
        draftPermissions: draft,
        loading: false,
        saving,
        error: null,
      },
    },
  });

const renderEdit = ({ props = {}, storeArgs, flags = defaultFlags } = {}) => {
  const store = createStore(storeArgs);
  const dispatchSpy = jest.spyOn(store, 'dispatch');
  const onSave = jest.fn();
  const onCancel = jest.fn();
  return {
    store,
    dispatchSpy,
    onSave,
    onCancel,
    ...render(
      <Provider store={store}>
        <PermissionsCardEdit
          onSave={onSave}
          onCancel={onCancel}
          companyPermissionsSdkFlags={flags}
          {...props}
        />
      </Provider>,
    ),
  };
};

const checkbox = (testId) =>
  within(screen.getByTestId(testId).closest('span')).getByRole('checkbox');

describe('PermissionsCardEdit', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders nothing when the draft is missing', () => {
    const store = configureStore({
      reducer: { permissions: permissionsReducer },
      preloadedState: {
        permissions: {
          mode: PermissionsCardMode.EDIT,
          permissions: null,
          draftPermissions: null,
          loading: false,
          saving: false,
          error: null,
        },
      },
    });
    const { container } = render(
      <Provider store={store}>
        <PermissionsCardEdit
          onSave={jest.fn()}
          onCancel={jest.fn()}
          companyPermissionsSdkFlags={defaultFlags}
        />
      </Provider>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the form for a worker draft', () => {
    renderEdit();
    expect(
      screen.getByTestId('permissions-card-edit-form'),
    ).toBeInTheDocument();
    expect(screen.getByText('permissions.title')).toBeInTheDocument();
    expect(screen.getByText('permissions.workforceAccess')).toBeInTheDocument();
  });

  describe('worker draft dispatches', () => {
    it('dispatches role change', () => {
      const { dispatchSpy } = renderEdit();
      fireEvent.click(screen.getByTestId('radio-permissions-role-time_admin'));
      expect(dispatchSpy).toHaveBeenCalledWith(setDraftRole('time_admin'));
    });

    it('dispatches mobile time entry toggle', () => {
      const { dispatchSpy } = renderEdit();
      fireEvent.click(checkbox('permissions-mobile-time-entry'));
      expect(dispatchSpy).toHaveBeenCalledWith(setDraftMobileTimeEntry(true));
    });

    it('dispatches manage-my-timesheets toggle', () => {
      const { dispatchSpy } = renderEdit();
      fireEvent.click(checkbox('permissions-manage-my-timesheets'));
      expect(dispatchSpy).toHaveBeenCalledWith(
        setDraftManageMyTimesheets(true),
      );
    });

    it('dispatches view schedule toggle', () => {
      const { dispatchSpy } = renderEdit();
      fireEvent.click(checkbox('permissions-view-schedule'));
      expect(dispatchSpy).toHaveBeenCalledWith(setDraftViewSchedule(true));
    });

    it('dispatches manage schedule toggle', () => {
      const { dispatchSpy } = renderEdit();
      fireEvent.click(checkbox('permissions-manage-schedule'));
      expect(dispatchSpy).toHaveBeenCalledWith(setDraftManageSchedule(true));
    });

    it('dispatches whos-working toggle', () => {
      const { dispatchSpy } = renderEdit();
      fireEvent.click(checkbox('permissions-view-whos-working'));
      expect(dispatchSpy).toHaveBeenCalledWith(setDraftViewWhosWorking(true));
    });

    it('dispatches projects access change', () => {
      const { dispatchSpy } = renderEdit();
      fireEvent.click(
        screen.getByTestId('radio-permissions-projects-access-view_only'),
      );
      expect(dispatchSpy).toHaveBeenCalledWith(
        setDraftProjectsAccess('view_only'),
      );
    });
  });

  describe('schedule sub-options', () => {
    it('shows the view-scope radios and dispatches scope change when view is on', () => {
      const { dispatchSpy } = renderEdit({
        storeArgs: {
          draft: buildPermissions({
            schedule: {
              viewSchedule: true,
              viewScheduleScope: 'their_own',
              manageSchedule: false,
              manageScheduleScope: 'their_own',
            },
          }),
        },
      });
      fireEvent.click(
        screen.getByTestId('radio-permissions-view-schedule-scope-group'),
      );
      expect(dispatchSpy).toHaveBeenCalledWith(
        setDraftViewScheduleScope('group'),
      );
    });

    it('shows the manage-scope radios and dispatches scope change when manage is on', () => {
      const { dispatchSpy } = renderEdit({
        storeArgs: {
          draft: buildPermissions({
            schedule: {
              viewSchedule: true,
              viewScheduleScope: 'company',
              manageSchedule: true,
              manageScheduleScope: 'their_own',
            },
          }),
        },
      });
      fireEvent.click(
        screen.getByTestId('radio-permissions-manage-schedule-scope-company'),
      );
      expect(dispatchSpy).toHaveBeenCalledWith(
        setDraftManageScheduleScope('company'),
      );
    });

    it('disables view scopes narrower than the active manage scope', () => {
      renderEdit({
        storeArgs: {
          draft: buildPermissions({
            schedule: {
              viewSchedule: true,
              viewScheduleScope: 'company',
              manageSchedule: true,
              manageScheduleScope: 'group',
            },
          }),
        },
      });
      // their_own (rank 0) < group (rank 1) -> disabled
      expect(
        within(
          screen.getByTestId('radio-permissions-view-schedule-scope-their_own'),
        ).getByRole('radio'),
      ).toBeDisabled();
      // company (rank 2) >= group -> enabled
      expect(
        within(
          screen.getByTestId('radio-permissions-view-schedule-scope-company'),
        ).getByRole('radio'),
      ).not.toBeDisabled();
    });

    it('hides schedule scope radios when both toggles are off', () => {
      renderEdit();
      expect(
        screen.queryByTestId('radiogroup-permissions-view-schedule-scope'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('radiogroup-permissions-manage-schedule-scope'),
      ).not.toBeInTheDocument();
    });
  });

  describe('projects option gating', () => {
    it('hides the Manage option for a worker without it', () => {
      renderEdit();
      expect(
        screen.getByTestId('radio-permissions-projects-access-no_access'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('radio-permissions-projects-access-view_only'),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId('radio-permissions-projects-access-create_edit'),
      ).not.toBeInTheDocument();
    });

    it('shows Manage disabled for a worker who already holds it', () => {
      renderEdit({
        storeArgs: {
          draft: buildPermissions({ projectsAccess: 'create_edit' }),
          persisted: buildPermissions({ projectsAccess: 'create_edit' }),
        },
      });
      const manageRadio = within(
        screen.getByTestId('radio-permissions-projects-access-create_edit'),
      ).getByRole('radio');
      expect(manageRadio).toBeInTheDocument();
      expect(manageRadio).toBeDisabled();
    });
  });

  describe('admin overrides', () => {
    it('force-checks and disables timesheet + company rows for admins', () => {
      renderEdit({
        storeArgs: {
          draft: buildPermissions({ role: 'time_admin' }),
          persisted: buildPermissions({ role: 'time_admin' }),
        },
      });
      const mobile = checkbox('permissions-mobile-time-entry');
      expect(mobile).toBeChecked();
      expect(mobile).toBeDisabled();
      expect(checkbox('permissions-view-whos-working')).toBeChecked();
      expect(checkbox('permissions-view-whos-working')).toBeDisabled();
    });

    it('shows the full projects option set (incl. Manage) for admins', () => {
      renderEdit({
        storeArgs: {
          draft: buildPermissions({ role: 'time_admin' }),
          persisted: buildPermissions({ role: 'time_admin' }),
        },
      });
      expect(
        screen.getByTestId('radio-permissions-projects-access-create_edit'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('radio-permissions-projects-access-no_access'),
      ).toBeInTheDocument();
    });
  });

  describe('company SDK locks', () => {
    it('locks + checks the mobile row when the company grants it', () => {
      renderEdit({
        flags: {
          canUseCompanyMobile: true,
          canCompanyManageMyTimesheets: false,
        },
      });
      const mobile = checkbox('permissions-mobile-time-entry');
      expect(mobile).toBeChecked();
      expect(mobile).toBeDisabled();
    });

    it('locks + checks the manage-my-timesheets row when the company grants it', () => {
      renderEdit({
        flags: {
          canUseCompanyMobile: false,
          canCompanyManageMyTimesheets: true,
        },
      });
      const manage = checkbox('permissions-manage-my-timesheets');
      expect(manage).toBeChecked();
      expect(manage).toBeDisabled();
    });
  });

  describe('footer', () => {
    it('disables Save when the draft is unchanged', () => {
      renderEdit();
      expect(
        screen.getByRole('button', { name: 'actions.save' }),
      ).toBeDisabled();
    });

    it('enables Save when the draft differs and fires onSave', () => {
      const { onSave } = renderEdit({
        storeArgs: {
          draft: buildPermissions({ role: 'time_admin' }),
          persisted: buildPermissions({ role: 'worker' }),
        },
      });
      const saveBtn = screen.getByRole('button', { name: 'actions.save' });
      expect(saveBtn).not.toBeDisabled();
      fireEvent.click(saveBtn);
      expect(onSave).toHaveBeenCalledTimes(1);
    });

    it('fires onCancel from the cancel button', () => {
      const { onCancel } = renderEdit();
      fireEvent.click(screen.getByRole('button', { name: 'actions.cancel' }));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('disables both footer buttons while saving', () => {
      renderEdit({
        storeArgs: {
          draft: buildPermissions({ role: 'time_admin' }),
          persisted: buildPermissions({ role: 'worker' }),
          saving: true,
        },
      });
      expect(
        screen.getByRole('button', { name: 'actions.cancel' }),
      ).toBeDisabled();
      expect(
        screen.getByRole('button', { name: 'actions.save' }),
      ).toBeDisabled();
    });
  });
});

// @ts-nocheck
/**
 * Tests for PermissionsCardView.
 *
 * Covers loading skeletons, the error state, header actions (edit button +
 * showActions), and the four summary sections including timesheet resolution
 * against company SDK flags, schedule scope summaries, and projects access.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import PermissionsCardView from 'src/js/widgets/userSettings/components/cards/PermissionsCard/components/PermissionsCardView';
import permissionsReducer from 'src/js/widgets/userSettings/store/slices/permissionsSlice';
import { PermissionsCardMode } from 'src/js/widgets/userSettings/components/cards/PermissionsCard/types/PermissionsCard.types';

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({ formatMessage: ({ id }) => id }),
}));

jest.mock('@cgds/skeleton', () => ({
  Skeleton: ({ variant, height }) => (
    <div data-testid="skeleton" data-variant={variant} data-height={height}>
      loading
    </div>
  ),
}));

jest.mock('@ids-ts/icon-control', () => ({
  IconControl: ({ children, onClick, disabled, 'aria-label': ariaLabel }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  ),
}));

jest.mock(
  'src/js/widgets/userSettings/components/cards/BreaksCard/components/BreaksStateMessage',
  () =>
    function MockBreaksStateMessage({ testId, messageId }) {
      return <div data-testid={testId}>{messageId}</div>;
    },
);

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
  isLoading: false,
};

const createStore = ({
  permissions = buildPermissions(),
  loading = false,
  error = null,
} = {}) =>
  configureStore({
    reducer: { permissions: permissionsReducer },
    preloadedState: {
      permissions: {
        mode: PermissionsCardMode.VIEW,
        permissions,
        draftPermissions: permissions,
        loading,
        saving: false,
        error,
      },
    },
  });

const renderView = (props = {}, storeArgs = {}) => {
  const store = createStore(storeArgs);
  return {
    store,
    ...render(
      <Provider store={store}>
        <PermissionsCardView
          companyPermissionsSdkFlags={defaultFlags}
          {...props}
        />
      </Provider>,
    ),
  };
};

describe('PermissionsCardView', () => {
  it('renders the title and section headers', () => {
    renderView();
    expect(screen.getByText('permissions.title')).toBeInTheDocument();
    expect(screen.getByText('permissions.workforceAccess')).toBeInTheDocument();
    expect(
      screen.getByText('permissions.timesheets.label'),
    ).toBeInTheDocument();
    expect(screen.getByText('permissions.schedule.label')).toBeInTheDocument();
    expect(screen.getByText('permissions.projects.label')).toBeInTheDocument();
  });

  describe('actions', () => {
    it('renders the edit button by default and fires onEditClick', () => {
      const onEditClick = jest.fn();
      renderView({ onEditClick });
      const btn = screen.getByLabelText('edit-permissions');
      fireEvent.click(btn);
      expect(onEditClick).toHaveBeenCalledTimes(1);
    });

    it('hides the edit button when showActions is false', () => {
      renderView({ showActions: false });
      expect(
        screen.queryByLabelText('edit-permissions'),
      ).not.toBeInTheDocument();
    });
  });

  describe('loading / skeletons', () => {
    it('shows skeletons and disables edit while loading', () => {
      renderView({}, { loading: true });
      expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
      expect(screen.getByLabelText('edit-permissions')).toBeDisabled();
    });

    it('shows skeletons when the SDK flags are still loading', () => {
      renderView({
        companyPermissionsSdkFlags: { ...defaultFlags, isLoading: true },
      });
      expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
    });

    it('shows skeletons when permissions are null', () => {
      renderView({}, { permissions: null });
      expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
    });
  });

  describe('error state', () => {
    it('renders the error message and no summary fields', () => {
      renderView({}, { error: 'boom', permissions: null });
      expect(screen.getByTestId('permissions-error-state')).toBeInTheDocument();
      expect(
        screen.getByText('permissions.card.error.state.message'),
      ).toBeInTheDocument();
      expect(
        screen.queryByText('permissions.workforceAccess'),
      ).not.toBeInTheDocument();
    });
  });

  describe('summary values', () => {
    it('shows role and off values for a bare worker', () => {
      renderView();
      expect(
        screen.getByText('permissions.role.option.worker'),
      ).toBeInTheDocument();
      // whos-working off, timesheets off, schedule off, projects off
      expect(
        screen.getAllByText('permissions.value.off').length,
      ).toBeGreaterThan(0);
    });

    it('resolves timesheet rows on when the company SDK grants them', () => {
      renderView({
        companyPermissionsSdkFlags: {
          canUseCompanyMobile: true,
          canCompanyManageMyTimesheets: true,
          isLoading: false,
        },
      });
      expect(screen.getAllByText('permissions.value.on').length).toBe(2);
    });

    it('summarizes schedule on with scope when enabled', () => {
      renderView(
        {},
        {
          permissions: buildPermissions({
            schedule: {
              viewSchedule: true,
              viewScheduleScope: 'company',
              manageSchedule: true,
              manageScheduleScope: 'group',
            },
          }),
        },
      );
      expect(
        screen.getAllByText('permissions.schedule.onWithScope').length,
      ).toBe(2);
    });

    it('shows the projects label when access is view_only', () => {
      renderView(
        {},
        { permissions: buildPermissions({ projectsAccess: 'view_only' }) },
      );
      expect(
        screen.getByText('permissions.projects.option.viewOnly'),
      ).toBeInTheDocument();
    });

    it('shows the projects label when access is create_edit', () => {
      renderView(
        {},
        { permissions: buildPermissions({ projectsAccess: 'create_edit' }) },
      );
      expect(
        screen.getByText('permissions.projects.option.createEdit'),
      ).toBeInTheDocument();
    });

    it('shows whos-working on for a permitted worker', () => {
      renderView(
        {},
        {
          permissions: buildPermissions({
            company: {
              viewWhosWorking: true,
              viewWhosWorkingScope: 'all_workers',
            },
          }),
        },
      );
      expect(screen.getByText('permissions.value.on')).toBeInTheDocument();
    });

    it('renders the time_admin role label', () => {
      renderView({}, { permissions: buildPermissions({ role: 'time_admin' }) });
      expect(
        screen.getByText('permissions.role.option.timeAdmin'),
      ).toBeInTheDocument();
    });
  });
});

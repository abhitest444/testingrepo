// @ts-nocheck
/**
 * Tests for the PermissionsCard orchestrator component.
 *
 * Covers VIEW/EDIT mode switching, save/edit/cancel handlers, the save-success
 * and save-error callbacks wired into `useManageUserPermissions`, and the guards
 * that short-circuit `handleSave`.
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import PermissionsCard from 'src/js/widgets/userSettings/components/cards/PermissionsCard/PermissionsCard';
import permissionsReducer, {
  setPermissionsSaving,
  setPermissionsError,
  commitDraftPermissions,
  setPermissionsMode,
  cancelPermissionsEdit,
} from 'src/js/widgets/userSettings/store/slices/permissionsSlice';
import settingsContextReducer from 'src/js/widgets/userSettings/store/slices/settingsContextSlice';
import { PermissionsCardMode } from 'src/js/widgets/userSettings/components/cards/PermissionsCard/types/PermissionsCard.types';
import { TimeTracking_TimeForType } from 'src/__generated__/timeTracking/graphql';

const mockLoggerInfo = jest.fn();

jest.mock('@payroll/quicksand', () => ({
  useSandbox: () => ({
    logger: { info: mockLoggerInfo, error: jest.fn() },
  }),
}));

const mockSaveUserPermissions = jest.fn(() => Promise.resolve());
let capturedOnSuccess;
let capturedOnError;

jest.mock(
  'src/js/widgets/userSettings/service/permissions/useManageUserPermissions',
  () => ({
    useManageUserPermissions: ({ onSuccess, onError } = {}) => {
      capturedOnSuccess = onSuccess;
      capturedOnError = onError;
      return { saveUserPermissions: mockSaveUserPermissions };
    },
  }),
);

const mockCompanyFlags = {
  canUseCompanyMobile: false,
  canCompanyManageMyTimesheets: false,
  isLoading: false,
};

jest.mock(
  'src/js/widgets/userSettings/service/permissions/useCompanyPermissionsSdkFlags',
  () => ({
    useCompanyPermissionsSdkFlags: () => mockCompanyFlags,
  }),
);

jest.mock(
  'src/js/widgets/userSettings/components/cards/PermissionsCard/components/PermissionsCardView',
  () =>
    function MockPermissionsCardView({ onEditClick, showActions }) {
      return (
        <div data-testid="permissions-card-view">
          <span>showActions:{String(showActions)}</span>
          <button type="button" data-testid="edit-btn" onClick={onEditClick}>
            edit
          </button>
        </div>
      );
    },
);

jest.mock(
  'src/js/widgets/userSettings/components/cards/PermissionsCard/components/PermissionsCardEdit',
  () =>
    function MockPermissionsCardEdit({ onSave, onCancel }) {
      return (
        <div data-testid="permissions-card-edit">
          <button type="button" data-testid="save-btn" onClick={onSave}>
            save
          </button>
          <button type="button" data-testid="cancel-btn" onClick={onCancel}>
            cancel
          </button>
        </div>
      );
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

const settingsFor = {
  id: 'worker-1',
  timeForType: TimeTracking_TimeForType.Employee,
};

const createStore = (permissionsState = {}, settingsForValue = settingsFor) =>
  configureStore({
    reducer: {
      permissions: permissionsReducer,
      settingsContext: settingsContextReducer,
    },
    preloadedState: {
      permissions: {
        mode: PermissionsCardMode.VIEW,
        permissions: buildPermissions(),
        draftPermissions: buildPermissions(),
        loading: false,
        saving: false,
        error: null,
        ...permissionsState,
      },
      settingsContext: { settingsFor: settingsForValue },
    },
  });

const renderCard = (props = {}, store = createStore()) => {
  const dispatchSpy = jest.spyOn(store, 'dispatch');
  return {
    store,
    dispatchSpy,
    ...render(
      <Provider store={store}>
        <PermissionsCard {...props} />
      </Provider>,
    ),
  };
};

describe('PermissionsCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedOnSuccess = undefined;
    capturedOnError = undefined;
  });

  describe('mode rendering', () => {
    it('renders the view in VIEW mode', () => {
      renderCard();
      expect(screen.getByTestId('permissions-card-view')).toBeInTheDocument();
      expect(
        screen.queryByTestId('permissions-card-edit'),
      ).not.toBeInTheDocument();
    });

    it('renders the edit surface in EDIT mode when a draft exists', () => {
      renderCard(
        {},
        createStore({
          mode: PermissionsCardMode.EDIT,
          draftPermissions: buildPermissions(),
        }),
      );
      expect(screen.getByTestId('permissions-card-edit')).toBeInTheDocument();
    });

    it('falls back to the view when in EDIT mode but draft is null', () => {
      renderCard(
        {},
        createStore({
          mode: PermissionsCardMode.EDIT,
          draftPermissions: null,
        }),
      );
      expect(screen.getByTestId('permissions-card-view')).toBeInTheDocument();
      expect(
        screen.queryByTestId('permissions-card-edit'),
      ).not.toBeInTheDocument();
    });

    it('logs the card-viewed event on mount', () => {
      renderCard();
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        'Component=PermissionsCard Event=Permissions card viewed',
      );
    });

    it('forwards showActions to the view', () => {
      renderCard({ showActions: false });
      expect(screen.getByText('showActions:false')).toBeInTheDocument();
    });

    it('defaults showActions to true', () => {
      renderCard();
      expect(screen.getByText('showActions:true')).toBeInTheDocument();
    });
  });

  describe('edit / cancel handlers', () => {
    it('dispatches EDIT mode when the view triggers edit', () => {
      const { dispatchSpy } = renderCard();
      fireEvent.click(screen.getByTestId('edit-btn'));
      expect(dispatchSpy).toHaveBeenCalledWith(
        setPermissionsMode(PermissionsCardMode.EDIT),
      );
    });

    it('dispatches cancel from the edit surface', () => {
      const { dispatchSpy } = renderCard(
        {},
        createStore({ mode: PermissionsCardMode.EDIT }),
      );
      fireEvent.click(screen.getByTestId('cancel-btn'));
      expect(dispatchSpy).toHaveBeenCalledWith(cancelPermissionsEdit());
    });
  });

  describe('save handler', () => {
    it('marks saving and calls the mutation with draft + persisted', async () => {
      const { dispatchSpy } = renderCard(
        {},
        createStore({ mode: PermissionsCardMode.EDIT }),
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId('save-btn'));
      });

      expect(dispatchSpy).toHaveBeenCalledWith(setPermissionsSaving(true));
      expect(mockSaveUserPermissions).toHaveBeenCalledWith({
        settingsFor: {
          id: settingsFor.id,
          timeForType: settingsFor.timeForType,
        },
        permissions: buildPermissions(),
        previousPermissions: buildPermissions(),
      });
    });

    it('does not save when already saving', async () => {
      renderCard(
        {},
        createStore({ mode: PermissionsCardMode.EDIT, saving: true }),
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId('save-btn'));
      });

      expect(mockSaveUserPermissions).not.toHaveBeenCalled();
    });

    it('does not save when settingsFor is missing', async () => {
      renderCard({}, createStore({ mode: PermissionsCardMode.EDIT }, null));

      await act(async () => {
        fireEvent.click(screen.getByTestId('save-btn'));
      });

      expect(mockSaveUserPermissions).not.toHaveBeenCalled();
    });

    it('commits the draft on save success', async () => {
      const { dispatchSpy } = renderCard(
        {},
        createStore({ mode: PermissionsCardMode.EDIT }),
      );
      const savedPermissions = buildPermissions({ role: 'time_admin' });

      act(() => {
        capturedOnSuccess({ permissions: savedPermissions });
      });

      expect(dispatchSpy).toHaveBeenCalledWith(
        commitDraftPermissions(savedPermissions),
      );
    });

    it('surfaces the error on save failure', async () => {
      const { dispatchSpy } = renderCard(
        {},
        createStore({ mode: PermissionsCardMode.EDIT }),
      );

      act(() => {
        capturedOnError('save failed');
      });

      expect(dispatchSpy).toHaveBeenCalledWith(
        setPermissionsError('save failed'),
      );
    });
  });
});

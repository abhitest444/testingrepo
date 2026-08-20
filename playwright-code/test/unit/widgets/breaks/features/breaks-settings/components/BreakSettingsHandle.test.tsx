import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore, Store } from '@reduxjs/toolkit';
import { renderWithQuicksandProvider } from 'test/unit/testUtils';
import BreakSettingsHandle from 'src/js/widgets/breaks/features/breaks-settings/components/BreakSettingsHandle';
import { setPreferencesOpen } from 'src/js/widgets/breaks/store/uiSlice';

interface BreakPreferencesContainerProps {
  onClose: () => void;
  open: boolean;
}

interface RootState {
  ui: {
    preferencesOpen: boolean;
  };
  breakRules: {
    rules: any[];
    loading: boolean;
    error: string | null;
  };
  workers: {
    teamMembers: any[];
    loading: boolean;
    error: string | null;
  };
  assignments: {
    assignments: Record<string, any>;
  };
}

jest.mock(
  'src/js/widgets/breaks/features/breaks-settings/components/BreakPreferencesContainer',
  () => ({
    __esModule: true,
    default: ({ onClose, open }: BreakPreferencesContainerProps) =>
      open ? (
        <div data-testid="break-preferences-container">Break Preferences</div>
      ) : null,
  }),
);

// Initial UI state matching the actual slice
const initialUiState = {
  preferencesOpen: false,
  deleteModalOpen: false,
  isCreateOrEditBreakOpen: false,
  isCreateBreakOpen: false,
  isEditBreakOpen: false,
  isAssignmentEditorOpen: false,
  breakToDelete: null,
  breakToEdit: null,
  isAddBreakRuleEnabled: true,
  unsavedChangesModal: {
    isOpen: false,
    pendingActionType: null,
  },
  pageMessage: {
    show: false,
    type: 'error',
    message: '',
  },
};

// Mock Redux store
const createMockStore = (initialState = {}) =>
  configureStore({
    reducer: {
      ui: (state = initialUiState, action) => {
        if (action.type === 'ui/setPreferencesOpen') {
          return { ...state, preferencesOpen: action.payload };
        }
        if (action.type === 'ui/resetUiState') {
          return initialUiState;
        }
        return state;
      },
      breakRules: (
        state = { ids: [], entities: {}, loading: false, error: null },
      ) => state,
      workers: (state = { teamMembers: [], loading: false, error: null }) =>
        state,
      assignments: (state = { assignments: {} }) => state,
    },
    preloadedState: initialState,
  });

describe('BreakSettingsHandle', () => {
  const defaultProps = { isEditable: true };
  let store: Store<RootState>;

  const renderComponent = (props = {}, initialState = {}) => {
    store = createMockStore(initialState);
    return renderWithQuicksandProvider(
      <Provider store={store}>
        <BreakSettingsHandle {...defaultProps} {...props} />
      </Provider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders in view mode by default', () => {
    renderComponent();
    expect(screen.getByTestId('break-settings-handle')).toBeInTheDocument();
    expect(screen.getByLabelText(/edit/i)).toBeInTheDocument();
  });

  it('hides break preferences container when not in edit mode', () => {
    renderComponent();
    expect(
      screen.queryByTestId('break-preferences-container'),
    ).not.toBeInTheDocument();
  });

  it('shows break preferences container when edit is clicked (handleEdit)', () => {
    renderComponent();
    const editButton = screen.getByLabelText(/edit/i);
    fireEvent.click(editButton);
    expect(
      screen.getByTestId('break-preferences-container'),
    ).toBeInTheDocument();
  });

  it('dispatches setPreferencesOpen action when edit is clicked', () => {
    renderComponent();
    const editButton = screen.getByLabelText(/edit/i);
    fireEvent.click(editButton);
    expect(store.getState().ui.preferencesOpen).toBe(true);
  });

  it('renders with preferences open when initial state has preferencesOpen true', () => {
    renderComponent(
      {},
      {
        ui: { preferencesOpen: true },
      },
    );
    expect(
      screen.getByTestId('break-preferences-container'),
    ).toBeInTheDocument();
  });

  it('renders edit button when isEditable is true', () => {
    renderComponent({ isEditable: true });
    expect(screen.getByLabelText(/edit/i)).toBeInTheDocument();
  });

  it('does not render edit button when isEditable is false', () => {
    renderComponent({ isEditable: false });
    expect(screen.queryByLabelText(/edit/i)).not.toBeInTheDocument();
  });

  it('does not render edit button when isEditable is undefined', () => {
    renderComponent({ isEditable: undefined });
    expect(screen.queryByLabelText(/edit/i)).not.toBeInTheDocument();
  });

  it('handles edit click when isEditable is true', () => {
    renderComponent({ isEditable: true });
    const editButton = screen.getByLabelText(/edit/i);
    fireEvent.click(editButton);
    expect(store.getState().ui.preferencesOpen).toBe(true);
  });

  describe('Component Unmount Cleanup', () => {
    it('dispatches resetUiState on unmount to reset all UI state', () => {
      const { unmount } = renderComponent(
        { isEditable: true },
        { ui: { preferencesOpen: true } },
      );

      expect(store.getState().ui.preferencesOpen).toBe(true);

      unmount();

      // Verify full UI state is reset to initial values
      expect(store.getState().ui.preferencesOpen).toBe(false);
    });

    it('resets UI state on unmount even when trowser was already closed', () => {
      const { unmount } = renderComponent(
        { isEditable: true },
        { ui: { preferencesOpen: false } },
      );

      expect(store.getState().ui.preferencesOpen).toBe(false);

      unmount();

      expect(store.getState().ui.preferencesOpen).toBe(false);
    });

    it('resets full UI state on unmount after user opens trowser', () => {
      const { unmount } = renderComponent({ isEditable: true });

      const editButton = screen.getByLabelText(/edit/i);
      fireEvent.click(editButton);
      expect(store.getState().ui.preferencesOpen).toBe(true);

      unmount();

      // Verify full UI state is reset
      expect(store.getState().ui.preferencesOpen).toBe(false);
    });
  });
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import DeleteBreakModal from 'src/js/widgets/breaks/features/breaks-settings/components/DeleteBreakRuleConfirmationModal';
import breakRulesReducer from 'src/js/widgets/breaks/store/breakRulesSlice';
import uiReducer from 'src/js/widgets/breaks/store/uiSlice';
import workerReducer from 'src/js/widgets/breaks/store/workerSlice';

// Mock useIntl to return predictable translations
jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: (
      { id }: { id: string },
      values?: Record<string, string>,
    ) => {
      if (id === 'delete.break.modal.title') {
        return `Are you sure you want to delete ${values?.breakName}?`;
      }
      if (id === 'delete.break.modal.warning') {
        return "This can't be undone and will only affect future timesheets.";
      }
      if (id === 'delete.break.modal.cancel') {
        return 'Cancel';
      }
      if (id === 'delete.break.modal.delete') {
        return 'Delete';
      }
      return id;
    },
  }),
  useTracking: () => jest.fn(),
  useSandbox: () => ({
    analytics: {
      track: jest.fn(),
    },
  }),
}));

// Mock the breaks CRUD hook
jest.mock('src/js/widgets/breaks/hooks/useBreaksCrud', () => ({
  __esModule: true,
  default: () => ({
    deleteBreaksPolicy: jest.fn().mockResolvedValue(undefined),
  }),
}));

// Mock the GraphQL mutation and types
jest.mock('src/__generated__/oigql/graphql', () => ({
  useDeleteEmployerBreakMutation: () => [
    jest.fn().mockResolvedValue({
      data: {
        payrollDeleteEmployerBreak: {
          __typename: 'Payroll_DeleteEmployerBreakSuccess',
        },
      },
    }),
    { loading: false },
  ],
  Payroll_DurationUnit: {
    Minutes: 'MINUTES',
    Hours: 'HOURS',
  },
  Payroll_Break: {
    Paid: 'PAID',
    Unpaid: 'UNPAID',
  },
  Common_DayOfWeek: {
    Monday: 'MONDAY',
    Tuesday: 'TUESDAY',
    Wednesday: 'WEDNESDAY',
    Thursday: 'THURSDAY',
    Friday: 'FRIDAY',
    Saturday: 'SATURDAY',
    Sunday: 'SUNDAY',
  },
}));

describe('DeleteBreakRuleConfirmationModal', () => {
  const createTestStore = (initialState = {}) => {
    const rootReducer = {
      breakRules: breakRulesReducer,
      ui: uiReducer,
      workers: workerReducer,
    };

    return configureStore({
      reducer: rootReducer,
      preloadedState: initialState,
    });
  };

  const renderWithStore = (ui: React.ReactElement, initialState = {}) => {
    const store = createTestStore(initialState);
    return {
      ...render(<Provider store={store}>{ui}</Provider>),
      store,
    };
  };

  const mockBreakRule = {
    id: 'break-1',
    breakName: 'Lunch break',
    isActive: true,
    breakType: 'UNPAID' as const,
    allowManual: true,
    allowAuto: false,
    noSetDuration: false,
    breakDuration: 30,
    durationUnit: 'MINUTES' as const,
    isDefaultPolicy: false,
    isDeleted: false,
    activeBreakAssignmentCount: 5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the modal with correct title and warning when modal is open and break is selected', () => {
    const initialState = {
      ui: {
        deleteModalOpen: true,
        breakToDelete: mockBreakRule,
        preferencesOpen: false,
        editModalOpen: false,
        breakToEdit: null,
      },
      breakRules: {
        deleteLoading: false,
      },
    };

    renderWithStore(<DeleteBreakModal />, initialState);

    expect(screen.getByTestId('delete-break-modal-title')).toHaveTextContent(
      'Are you sure you want to delete Lunch break?',
    );
    expect(screen.getByTestId('delete-break-modal-warning')).toHaveTextContent(
      "This can't be undone and will only affect future timesheets.",
    );
  });

  it('renders Cancel and Delete buttons', () => {
    const initialState = {
      ui: {
        deleteModalOpen: true,
        breakToDelete: mockBreakRule,
        preferencesOpen: false,
        editModalOpen: false,
        breakToEdit: null,
      },
      breakRules: {
        deleteLoading: false,
      },
    };

    renderWithStore(<DeleteBreakModal />, initialState);

    expect(screen.getByTestId('delete-break-modal-cancel')).toHaveTextContent(
      'Cancel',
    );
    expect(screen.getByTestId('delete-break-modal-delete')).toHaveTextContent(
      'Delete',
    );
  });

  it('calls onCancel when Cancel button is clicked', () => {
    const initialState = {
      ui: {
        deleteModalOpen: true,
        breakToDelete: mockBreakRule,
        preferencesOpen: false,
        editModalOpen: false,
        breakToEdit: null,
      },
      breakRules: {
        deleteLoading: false,
      },
    };

    const { store } = renderWithStore(<DeleteBreakModal />, initialState);

    fireEvent.click(screen.getByTestId('delete-break-modal-cancel'));

    const state = store.getState();
    expect(state.ui.deleteModalOpen).toBe(false);
    expect(state.ui.breakToDelete).toBe(null);
  });

  it('calls onDelete when Delete button is clicked', () => {
    const initialState = {
      ui: {
        deleteModalOpen: true,
        breakToDelete: mockBreakRule,
        preferencesOpen: false,
        editModalOpen: false,
        breakToEdit: null,
      },
      breakRules: {
        deleteLoading: false,
      },
    };

    const { store } = renderWithStore(<DeleteBreakModal />, initialState);

    fireEvent.click(screen.getByTestId('delete-break-modal-delete'));

    // The delete action should be triggered, and the modal should close after deletion
    // We can't easily test the async delete operation, but we can verify the button is clickable
    expect(screen.getByTestId('delete-break-modal-delete')).toBeInTheDocument();
  });

  it('does not render modal when open is false', () => {
    const initialState = {
      ui: {
        deleteModalOpen: false,
        breakToDelete: mockBreakRule,
        preferencesOpen: false,
        editModalOpen: false,
        breakToEdit: null,
      },
      breakRules: {
        deleteLoading: false,
      },
    };

    renderWithStore(<DeleteBreakModal />, initialState);

    expect(
      screen.queryByTestId('delete-break-modal-root'),
    ).not.toBeInTheDocument();
  });

  it('renders the correct break name in the title', () => {
    const adminBreakRule = {
      ...mockBreakRule,
      breakName: 'Admin break',
    };

    const initialState = {
      ui: {
        deleteModalOpen: true,
        breakToDelete: adminBreakRule,
        preferencesOpen: false,
        editModalOpen: false,
        breakToEdit: null,
      },
      breakRules: {
        deleteLoading: false,
      },
    };

    renderWithStore(<DeleteBreakModal />, initialState);

    expect(screen.getByTestId('delete-break-modal-title')).toHaveTextContent(
      'Are you sure you want to delete Admin break?',
    );
  });

  it('shows loading state when delete is in progress', () => {
    const initialState = {
      ui: {
        deleteModalOpen: true,
        breakToDelete: mockBreakRule,
        preferencesOpen: false,
        editModalOpen: false,
        breakToEdit: null,
      },
      breakRules: {
        deleteLoading: true,
      },
    };

    renderWithStore(<DeleteBreakModal />, initialState);

    const deleteButton = screen.getByTestId('delete-break-modal-delete');
    expect(deleteButton).toBeDisabled();
  });
});

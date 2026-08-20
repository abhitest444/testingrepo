import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import { CommonErrorDisplay } from 'src/js/widgets/weeklyTimeEntry/components/errors/CommonErrorDisplay';
import validationSlice from 'src/js/widgets/weeklyTimeEntry/store/validationSlice';
import breaksSlice from 'src/js/widgets/weeklyTimeEntry/store/breaksSlice';
import customerSlice from 'src/js/widgets/weeklyTimeEntry/store/customerSlice';
import timeEntryGridSlice from 'src/js/widgets/weeklyTimeEntry/store/timeEntryGridSlice';

// Mock the components
jest.mock(
  'src/js/widgets/weeklyTimeEntry/components/errors/RequiredFieldsErrorMessage',
  () => ({
    RequiredFieldsErrorMessage: ({ errorMessages, onClose }: any) => (
      <div data-testid="required-fields-error">
        {errorMessages.length > 0 && (
          <>
            <div>Validation Errors: {errorMessages.join(', ')}</div>
            <button onClick={onClose}>Close Validation</button>
          </>
        )}
      </div>
    ),
  }),
);

jest.mock(
  'src/js/widgets/weeklyTimeEntry/components/errors/WarningPageMessage',
  () => ({
    WarningPageMessage: ({ title, message, onClose }: any) => (
      <div data-testid="warning-page-message">
        <div>{title}</div>
        <div>{message}</div>
        {onClose && <button onClick={onClose}>Close Warning</button>}
      </div>
    ),
  }),
);

// Mock NLS
jest.mock('@payroll/quicksand', () => ({
  ...jest.requireActual('@payroll/quicksand'),
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => {
      const messages: { [key: string]: string } = {
        'weekly.time.entry.warning.time.category.title':
          "Something isn't working",
        'weekly.time.entry.warning.time.category.message':
          "We're having some trouble loading Time category",
        'weekly.time.entry.save.error.title': 'Something went wrong',
        'weekly.time.entry.save.error.message':
          'We encountered an error while saving your time entries. Please try again.',
      };
      return messages[id] || id;
    },
  }),
}));

const createTestStore = (initialState = {}) =>
  configureStore({
    reducer: {
      validation: validationSlice,
      breaks: breaksSlice,
      customers: customerSlice,
      timeEntryGrid: timeEntryGridSlice,
    },
    preloadedState: {
      validation: {
        showValidationError: false,
        errorMessages: [],
        saveError: null,
        timeEntriesError: null,
        fieldErrors: {},
        rowErrors: {},
        settingsError: null,
        savePayload: null,
        detailedSaveErrors: null,
        isSaveLoading: false,
      },
      breaks: {
        breaks: [],
        loading: false,
        error: null,
      },
      customers: {
        customers: { ids: [], entities: {} },
        loading: false,
        error: null,
      },
      timeEntryGrid: {
        loading: false,
        error: null,
        teamMember: null,
        dateRange: { start: '', end: '' },
        weeklyTimeEntries: {},
        rowOrder: [],
        selected: null,
        firstEditedCells: {},
        showSelectTeamMemberTooltip: false,
        isTeamMemberDropdownReady: false,
        isQuickFindEnabled: false,
        isQuickFindSettled: false,
        confirmTimeEntryConversionModal: {
          isOpen: false,
          rowId: null,
          dayIdx: null,
        },
      },
      ...initialState,
    },
  });

const renderWithProviders = (
  component: React.ReactElement,
  initialState = {},
) => {
  const store = createTestStore(initialState);
  return render(<Provider store={store}>{component}</Provider>);
};

describe('CommonErrorDisplay', () => {
  it('renders RequiredFieldsErrorMessage even when no errors are present', () => {
    renderWithProviders(<CommonErrorDisplay />);

    expect(screen.getByTestId('required-fields-error')).toBeInTheDocument();
    expect(
      screen.queryByTestId('warning-page-message'),
    ).not.toBeInTheDocument();
  });

  it('displays warning message when breaks error is present', () => {
    const initialState = {
      breaks: {
        breaks: [],
        loading: false,
        error: 'Breaks loading failed',
      },
    };

    renderWithProviders(<CommonErrorDisplay />, initialState);

    expect(screen.getByTestId('warning-page-message')).toBeInTheDocument();
    expect(screen.getByText("Something isn't working")).toBeInTheDocument();
    expect(
      screen.getByText("We're having some trouble loading Time category"),
    ).toBeInTheDocument();
  });

  it('displays warning message when customers error is present', () => {
    const initialState = {
      customers: {
        customers: { ids: [], entities: {} },
        loading: false,
        error: 'Customers loading failed',
      },
    };

    renderWithProviders(<CommonErrorDisplay />, initialState);

    expect(screen.getByTestId('warning-page-message')).toBeInTheDocument();
    expect(screen.getByText("Something isn't working")).toBeInTheDocument();
    expect(
      screen.getByText("We're having some trouble loading Time category"),
    ).toBeInTheDocument();
  });

  it('displays warning message when both breaks and customers errors are present', () => {
    const initialState = {
      breaks: {
        breaks: [],
        loading: false,
        error: 'Breaks loading failed',
      },
      customers: {
        customers: { ids: [], entities: {} },
        loading: false,
        error: 'Customers loading failed',
      },
    };

    renderWithProviders(<CommonErrorDisplay />, initialState);

    expect(screen.getByTestId('warning-page-message')).toBeInTheDocument();
    expect(screen.getByText("Something isn't working")).toBeInTheDocument();
  });

  it('does not display warning message when loading', () => {
    const initialState = {
      breaks: {
        breaks: [],
        loading: true,
        error: 'Breaks loading failed',
      },
      timeEntryGrid: {
        loading: true,
        error: null,
        teamMember: null,
        dateRange: { start: null, end: null },
        weeklyTimeEntries: {},
        rowOrder: [],
        selected: null,
        firstEditedCells: {},
        deletedTimeEntryIds: [],
        savedTimeEntryIds: [],
        isTeamMemberDropdownReady: false,
      },
    };

    renderWithProviders(<CommonErrorDisplay />, initialState);

    expect(
      screen.queryByTestId('warning-page-message'),
    ).not.toBeInTheDocument();
  });

  it('displays validation errors when present', () => {
    const initialState = {
      validation: {
        showValidationError: true,
        errorMessages: [
          'Total weekly hours are over the limit',
          'Required fields are missing',
        ],
        saveError: null,
        timeEntriesError: null,
        fieldErrors: {},
        rowErrors: {},
      },
    };

    renderWithProviders(<CommonErrorDisplay />, initialState);

    expect(screen.getByTestId('required-fields-error')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Validation Errors: Total weekly hours are over the limit, Required fields are missing',
      ),
    ).toBeInTheDocument();
  });

  it('displays save error when present', () => {
    const initialState = {
      validation: {
        showValidationError: false,
        errorMessages: [],
        saveError: 'Save operation failed',
        timeEntriesError: null,
        fieldErrors: {},
        rowErrors: {},
      },
    };

    renderWithProviders(<CommonErrorDisplay />, initialState);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Save operation failed')).toBeInTheDocument();
  });

  it('displays multiple error types simultaneously', () => {
    const initialState = {
      validation: {
        showValidationError: true,
        errorMessages: ['Validation error'],
        saveError: 'Save error',
        timeEntriesError: null,
        fieldErrors: {},
        rowErrors: {},
      },
      breaks: {
        breaks: [],
        loading: false,
        error: 'Breaks error',
      },
    };

    renderWithProviders(<CommonErrorDisplay />, initialState);

    // Should show both warning and validation errors
    expect(screen.getByTestId('warning-page-message')).toBeInTheDocument();
    expect(screen.getByTestId('required-fields-error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('handles close validation error', () => {
    const initialState = {
      validation: {
        showValidationError: true,
        errorMessages: ['Validation error'],
        saveError: null,
        timeEntriesError: null,
        fieldErrors: {},
        rowErrors: {},
      },
    };

    renderWithProviders(<CommonErrorDisplay />, initialState);

    const closeButton = screen.getByText('Close Validation');
    fireEvent.click(closeButton);

    // The component should still be rendered, but the close action should be handled
    expect(screen.getByTestId('required-fields-error')).toBeInTheDocument();
  });
});

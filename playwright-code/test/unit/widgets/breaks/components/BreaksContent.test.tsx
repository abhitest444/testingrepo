import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import BreaksContent from 'src/js/widgets/breaks/components/BreaksContent';
import { BreaksWidgetOptions } from 'src/js/widgets/breaks/types';
import { renderWithAllAppProviders } from '../../../testUtils';

// Mock all the lazy-loaded components
jest.mock(
  'src/js/widgets/breaks/features/breaks-settings/components/BreakSettingsHandle',
  () => ({
    __esModule: true,
    default: ({ newBadgeVisibleTillDate, isEditable }: any) => (
      <div data-testid="break-settings-handle">
        Break Settings Handle
        <span data-testid="badge-date">{newBadgeVisibleTillDate}</span>
        <span data-testid="editable">
          {isEditable ? 'editable' : 'readonly'}
        </span>
      </div>
    ),
  }),
);

jest.mock(
  'src/js/widgets/breaks/features/breaks-settings/components/BreakPreferencesContainer',
  () => ({
    __esModule: true,
    default: () => (
      <div data-testid="break-preferences-container">
        Break Preferences Container
      </div>
    ),
  }),
);

jest.mock(
  'src/js/widgets/breaks/features/break-entries/components/BreakEntryFormContainer',
  () => ({
    __esModule: true,
    default: ({ open, onSave, onClose, workerId, employeeId }: any) => (
      <div data-testid="break-entry-form-container">
        Break Entry Form Container
        <span data-testid="form-open">{open ? 'open' : 'closed'}</span>
        <span data-testid="worker-id">{workerId}</span>
        <span data-testid="employee-id">{employeeId || 'none'}</span>
      </div>
    ),
  }),
);

jest.mock(
  'src/js/widgets/breaks/features/break-entries/components/BreakEntryEditFormContainer',
  () => ({
    __esModule: true,
    default: ({ open, onSave, onClose }: any) => (
      <div data-testid="break-entry-edit-form-container">
        Break Entry Edit Form Container
        <span data-testid="edit-form-open">{open ? 'open' : 'closed'}</span>
      </div>
    ),
  }),
);

jest.mock(
  'src/js/widgets/breaks/features/break-entries/components/BreakEntryTrigger',
  () => ({
    __esModule: true,
    default: () => (
      <div data-testid="break-entry-trigger">Break Entry Trigger</div>
    ),
  }),
);

jest.mock('src/js/widgets/breaks/components/BreakSelectorQuickfill', () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="break-selector-quickfill">
      Break Selector Quickfill
      <span data-testid="quickfill-props">{JSON.stringify(props)}</span>
    </div>
  ),
}));

jest.mock(
  'src/js/widgets/breaks/components/BreakEntryPrefillContainer',
  () => ({
    __esModule: true,
    default: ({ timeEntryId, children }: any) => (
      <div data-testid="break-entry-prefill-container">
        <span data-testid="time-entry-id">{timeEntryId}</span>
        {children}
      </div>
    ),
  }),
);

// Mock Redux store
const mockStore = configureStore({
  reducer: {
    breakEntries: (state = {}, action) => state,
  },
});

// Mock useDispatch
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => jest.fn(),
}));

describe('BreaksContent', () => {
  const renderComponent = (
    options: BreaksWidgetOptions,
    employeeId?: string | null,
  ) =>
    renderWithAllAppProviders(
      <Provider store={mockStore}>
        <BreaksContent options={options} employeeId={employeeId} />
      </Provider>,
    );

  it('renders breaks-settings with settings-handle functionality', async () => {
    const options: BreaksWidgetOptions = {
      feature: 'breaks-settings',
      functionality: 'settings-handle',
      isNewBadgeVisibleTillDate: '2024-01-01',
      isEditable: true,
    };

    renderComponent(options);

    await waitFor(() => {
      expect(screen.getByTestId('break-settings-handle')).toBeInTheDocument();
    });
    expect(screen.getByTestId('badge-date')).toHaveTextContent('2024-01-01');
    expect(screen.getByTestId('editable')).toHaveTextContent('editable');
  });

  it('renders unknown functionality message for breaks-settings with invalid functionality', () => {
    const options: BreaksWidgetOptions = {
      feature: 'breaks-settings',
      functionality: 'invalid-functionality' as any,
    };

    renderComponent(options);

    expect(screen.getByText('Unknown functionality type')).toBeInTheDocument();
  });

  it('renders create-break-entry form for break-entries feature', () => {
    const options: BreaksWidgetOptions = {
      feature: 'break-entries',
      functionality: 'create-break-entry',
      props: {
        open: true,
        onSave: jest.fn(),
        onClose: jest.fn(),
        workerId: 'test-worker-123',
      },
    };

    renderComponent(options);

    expect(
      screen.getByTestId('break-entry-form-container'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('form-open')).toHaveTextContent('open');
    expect(screen.getByTestId('worker-id')).toHaveTextContent(
      'test-worker-123',
    );
  });

  it('renders edit-break-entry form with prefill container for break-entries feature', async () => {
    const options: BreaksWidgetOptions = {
      feature: 'break-entries',
      functionality: 'edit-break-entry',
      props: {
        open: true,
        onSave: jest.fn(),
        onClose: jest.fn(),
        timeEntryId: 'time-entry-456',
      },
    };

    renderComponent(options);

    await waitFor(() => {
      expect(
        screen.getByTestId('break-entry-prefill-container'),
      ).toBeInTheDocument();
    });
    expect(screen.getByTestId('time-entry-id')).toHaveTextContent(
      'time-entry-456',
    );
    expect(
      screen.getByTestId('break-entry-edit-form-container'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('edit-form-open')).toHaveTextContent('open');
  });

  it('renders unknown break-entries functionality message for invalid functionality', () => {
    const options: BreaksWidgetOptions = {
      feature: 'break-entries',
      functionality: 'invalid-functionality' as any,
    };

    renderComponent(options);

    expect(
      screen.getByText('Unknown break-entries functionality'),
    ).toBeInTheDocument();
  });

  it('renders breaks-selector-quickfill for breaks-quickfills feature', async () => {
    const testProps = {
      assigneeId: 'test-assignee',
      filter: { isActive: true },
    };
    const options: BreaksWidgetOptions = {
      feature: 'breaks-quickfills',
      functionality: 'breaks-selector-quickfill',
      props: testProps,
    };

    renderComponent(options);

    await waitFor(() => {
      expect(
        screen.getByTestId('break-selector-quickfill'),
      ).toBeInTheDocument();
    });
    expect(screen.getByTestId('quickfill-props')).toHaveTextContent(
      JSON.stringify(testProps),
    );
  });

  it('renders unknown breaks-quickfills functionality message for invalid functionality', () => {
    const options: BreaksWidgetOptions = {
      feature: 'breaks-quickfills',
      functionality: 'invalid-functionality' as any,
      props: {
        assigneeId: 'test-assignee',
      },
    };

    renderComponent(options);

    expect(
      screen.getByText('Unknown breaks-quickfills functionality'),
    ).toBeInTheDocument();
  });

  it('renders unknown feature type message for invalid feature', () => {
    const options = {
      feature: 'invalid-feature' as any,
      functionality: 'any-functionality' as any,
    };

    renderComponent(options as BreaksWidgetOptions);

    expect(screen.getByText('Unknown feature type')).toBeInTheDocument();
  });

  it('renders with loading fallback', async () => {
    const options: BreaksWidgetOptions = {
      feature: 'breaks-settings',
      functionality: 'settings-handle',
    };

    renderComponent(options);

    // The Suspense fallback should be briefly visible before the component loads
    // We can't easily test this without mocking React.lazy, but we can verify the component renders
    await waitFor(() => {
      expect(screen.getByTestId('break-settings-handle')).toBeInTheDocument();
    });
  });

  it('handles break-entries create form with minimal props', () => {
    const options: BreaksWidgetOptions = {
      feature: 'break-entries',
      functionality: 'create-break-entry',
      props: {
        open: false,
      },
    };

    renderComponent(options);

    expect(
      screen.getByTestId('break-entry-form-container'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('form-open')).toHaveTextContent('closed');
  });

  it('handles break-entries edit form with minimal props', () => {
    const options: BreaksWidgetOptions = {
      feature: 'break-entries',
      functionality: 'edit-break-entry',
      props: {
        open: false,
      },
    };

    renderComponent(options);

    expect(
      screen.getByTestId('break-entry-prefill-container'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('break-entry-edit-form-container'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('edit-form-open')).toHaveTextContent('closed');
  });

  it('handles breaks-settings with editable false', async () => {
    const options: BreaksWidgetOptions = {
      feature: 'breaks-settings',
      functionality: 'settings-handle',
      isEditable: false,
    };

    renderComponent(options);

    await waitFor(() => {
      expect(screen.getByTestId('break-settings-handle')).toBeInTheDocument();
    });
    expect(screen.getByTestId('editable')).toHaveTextContent('readonly');
  });

  describe('EmployeeId Prop Support', () => {
    it('should pass employeeId to BreakEntryFormContainer when provided', () => {
      const options: BreaksWidgetOptions = {
        feature: 'break-entries',
        functionality: 'create-break-entry',
        props: {
          open: true,
          onSave: jest.fn(),
          onClose: jest.fn(),
          workerId: 'test-worker-123',
        },
      };

      renderComponent(options, 'emp-456');

      expect(
        screen.getByTestId('break-entry-form-container'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('employee-id')).toHaveTextContent('emp-456');
    });

    it('should handle null employeeId for create-break-entry', () => {
      const options: BreaksWidgetOptions = {
        feature: 'break-entries',
        functionality: 'create-break-entry',
        props: {
          open: true,
          onSave: jest.fn(),
          onClose: jest.fn(),
        },
      };

      renderComponent(options, null);

      expect(
        screen.getByTestId('break-entry-form-container'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('employee-id')).toHaveTextContent('none');
    });

    it('should handle undefined employeeId for create-break-entry', () => {
      const options: BreaksWidgetOptions = {
        feature: 'break-entries',
        functionality: 'create-break-entry',
        props: {
          open: true,
          onSave: jest.fn(),
          onClose: jest.fn(),
        },
      };

      renderComponent(options, undefined);

      expect(
        screen.getByTestId('break-entry-form-container'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('employee-id')).toHaveTextContent('none');
    });

    it('should pass employeeId through to form for WFS users', () => {
      const options: BreaksWidgetOptions = {
        feature: 'break-entries',
        functionality: 'create-break-entry',
        props: {
          open: true,
          onSave: jest.fn(),
          onClose: jest.fn(),
        },
      };

      renderComponent(options, 'wfs-emp-789');

      expect(
        screen.getByTestId('break-entry-form-container'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('employee-id')).toHaveTextContent(
        'wfs-emp-789',
      );
    });

    it('should not pass employeeId to edit form (edit form does not use employeeId)', () => {
      const options: BreaksWidgetOptions = {
        feature: 'break-entries',
        functionality: 'edit-break-entry',
        props: {
          open: true,
          onSave: jest.fn(),
          onClose: jest.fn(),
          timeEntryId: 'time-entry-456',
        },
      };

      renderComponent(options, 'emp-999');

      // Edit form should render successfully even with employeeId
      expect(
        screen.getByTestId('break-entry-edit-form-container'),
      ).toBeInTheDocument();
    });

    it('should not affect breaks-settings functionality', () => {
      const options: BreaksWidgetOptions = {
        feature: 'breaks-settings',
        functionality: 'settings-handle',
        isEditable: true,
      };

      renderComponent(options, 'emp-111');

      // Settings should render normally with employeeId
      expect(screen.getByTestId('break-settings-handle')).toBeInTheDocument();
    });

    it('should not affect breaks-quickfills functionality', () => {
      const options: BreaksWidgetOptions = {
        feature: 'breaks-quickfills',
        functionality: 'breaks-selector-quickfill',
        props: {
          assigneeId: 'test-assignee',
        },
      };

      renderComponent(options, 'emp-222');

      // Quickfills should render normally with employeeId
      expect(
        screen.getByTestId('break-selector-quickfill'),
      ).toBeInTheDocument();
    });
  });
});

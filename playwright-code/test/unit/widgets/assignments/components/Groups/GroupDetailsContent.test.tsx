import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { GroupDetailsContent } from 'src/js/widgets/assignments/components/Groups/GroupDetailsContent';
import {
  renderWithQuicksandProvider,
  getDefaultSandbox,
} from 'test/unit/testUtils';
import workersGroupViewReducer, {
  setDrawerError,
} from 'src/js/widgets/assignments/store/workersGroupViewSlice';
import workersListReducer, {
  setHeaderTotalCount,
} from 'src/js/widgets/assignments/store/workersListSlice';

// Mock IDS components
jest.mock('@ids-ts/text-field', () => ({
  __esModule: true,
  default: ({
    label,
    value,
    onChange,
    onKeyDown,
    maxLength,
    disabled,
    'data-testid': dataTestId,
    'aria-label': ariaLabel,
  }: any) => {
    // Extract text from NLS string
    const getText = (str: string) => {
      if (typeof str === 'string' && str.startsWith('NLS ')) {
        const parts = str.split(' ');
        const messageId = parts[1];
        if (messageId === 'groups.drawer.label') return 'Group name';
        return str;
      }
      return str;
    };

    return (
      <div>
        <label htmlFor={dataTestId}>{getText(label)}</label>
        <input
          id={dataTestId}
          data-testid={dataTestId}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          maxLength={maxLength}
          disabled={disabled}
          aria-label={ariaLabel}
        />
      </div>
    );
  },
}));

jest.mock('@ids-ts/page-message', () => ({
  __esModule: true,
  default: ({ children, onClose, title, 'data-testid': dataTestId }: any) => (
    <div data-testid={dataTestId}>
      {title && <div data-testid="page-message-title">{title}</div>}
      {children}
      {onClose && (
        <button data-testid="page-message-close" onClick={onClose}>
          Close
        </button>
      )}
    </div>
  ),
}));

// Mock AssignmentSection
jest.mock(
  'src/js/widgets/assignments/components/Groups/AssignmentSection',
  () => ({
    AssignmentSection: ({
      title,
      description,
      countLabel,
      buttonLabel,
      onButtonClick,
      disabled,
      buttonTestId,
      countTestId,
    }: any) => {
      // Extract just the text content from NLS strings
      const getText = (str: string) => {
        if (typeof str === 'string' && str.startsWith('NLS ')) {
          // Extract the message ID and values
          const match = str.match(/NLS\s+([^\s]+)(?:\s+(.+))?/);
          if (!match) return str;

          const messageId = match[1];
          let values;
          try {
            values = match[2] ? JSON.parse(match[2]) : undefined;
          } catch (e) {
            // If JSON parse fails, continue without values
            values = undefined;
          }

          const translations: any = {
            'groups.drawer.section.workers.title':
              'Who is a part of this group?',
            'groups.drawer.workers.count': (v: any) =>
              `${v?.count || 0} of ${v?.total || 0} workers`,
            'groups.drawer.button.assign_workers': 'Assign workers',
            'groups.drawer.section.leads.title': 'Who leads this group?',
            'groups.drawer.section.leads.description':
              'They can edit jobs and manage user accounts, timesheets, schedules, and run reports in QuickBooks Time.',
            'groups.drawer.leads.count': (v: any) =>
              `${v?.count || 0} group leads`,
            'groups.drawer.button.assign_leads': 'Assign leads',
          };

          const translation = translations[messageId];
          if (typeof translation === 'function') {
            return translation(values);
          }
          return translation || str;
        }
        return str;
      };

      return (
        <div data-testid="assignment-section">
          <h3>{getText(title)}</h3>
          {description && <p>{getText(description)}</p>}
          <div data-testid={countTestId}>{getText(countLabel)}</div>
          <button
            data-testid={buttonTestId}
            onClick={onButtonClick}
            disabled={disabled}
          >
            {getText(buttonLabel)}
          </button>
        </div>
      );
    },
  }),
);

// Mock styled components
jest.mock(
  'src/js/widgets/assignments/styles/Groups/GroupDrawer.styled',
  () => ({
    GroupDetailsContentContainer: ({ children }: any) => (
      <div data-testid="group-details-content-container">{children}</div>
    ),
    SectionContainer: ({ children }: any) => (
      <div data-testid="section-container">{children}</div>
    ),
    SectionTitle: ({ children }: any) => {
      // Extract text from NLS string
      const getText = (str: string) => {
        if (typeof str === 'string' && str.startsWith('NLS ')) {
          const parts = str.split(' ');
          const messageId = parts[1];
          if (messageId === 'groups.drawer.section.name.title')
            return 'What is the name of the group?';
          return str;
        }
        return str;
      };
      return <h3 data-testid="section-title">{getText(children)}</h3>;
    },
    SectionContent: ({ children }: any) => (
      <div data-testid="section-content">{children}</div>
    ),
    Divider: () => <hr data-testid="divider" />,
  }),
);

// Mock useIntl
const mockFormatMessage = jest.fn((descriptor: any, values?: any) => {
  // Handle cases where descriptor is already a string
  if (typeof descriptor === 'string') {
    return descriptor;
  }

  const id = descriptor.id || descriptor;

  const messages: { [key: string]: string | ((v: any) => string) } = {
    'groups.drawer.section.name.title': 'What is the name of the group?',
    'groups.drawer.label': 'Group name',
    'groups.drawer.section.workers.title': 'Who is a part of this group?',
    'groups.drawer.workers.count': (v: any) =>
      `${v?.count || 0} of ${v?.total || 0} workers`,
    'groups.drawer.button.assign_workers': 'Assign workers',
    'groups.drawer.section.leads.title': 'Who leads this group?',
    'groups.drawer.section.leads.description':
      'They can edit jobs and manage user accounts, timesheets, schedules, and run reports in QuickBooks Time.',
    'groups.drawer.leads.count': (v: any) => `${v?.count || 0} group leads`,
    'groups.drawer.button.assign_leads': 'Assign leads',
  };

  const message = messages[id];
  if (typeof message === 'function') {
    return message(values);
  }
  return message || descriptor.defaultMessage || id;
});

describe('GroupDetailsContent', () => {
  let sandbox: any;
  let defaultProps: any;
  let mockOnGroupNameChange: jest.Mock;
  let mockOnClearError: jest.Mock;
  let mockOnAssignWorkers: jest.Mock;
  let mockOnAssignLeads: jest.Mock;
  let mockOnKeyDown: jest.Mock;
  let store: any;

  const createMockStore = (preloadedState?: {
    workersGroupView?: Partial<any>;
    workersList?: Partial<any>;
  }) =>
    configureStore({
      reducer: {
        workersGroupView: workersGroupViewReducer,
        workersList: workersListReducer,
      },
      preloadedState: preloadedState as any,
    });

  beforeEach(() => {
    sandbox = getDefaultSandbox();
    store = createMockStore({
      workersList: {
        workers: [],
        pageInfo: null,
        loading: false,
        error: null,
        currentPage: 1,
        headerTotalCount: 34,
      },
    });

    // Mock intl.formatMessage on the sandbox
    sandbox.intl = {
      formatMessage: mockFormatMessage,
      locale: 'en-US',
    };

    mockOnGroupNameChange = jest.fn();
    mockOnClearError = jest.fn();
    mockOnAssignWorkers = jest.fn();
    mockOnAssignLeads = jest.fn();
    mockOnKeyDown = jest.fn();

    defaultProps = {
      groupName: '',
      onGroupNameChange: mockOnGroupNameChange,
      onClearError: mockOnClearError,
      onAssignWorkers: mockOnAssignWorkers,
      onAssignLeads: mockOnAssignLeads,
      onKeyDown: mockOnKeyDown,
      selectedWorkersCount: 0,
      totalActiveWorkersCount: 34,
      selectedLeadsCount: 0,
      loading: false,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render group name section', () => {
      renderWithQuicksandProvider(
        <Provider store={store}>
          <GroupDetailsContent {...defaultProps} />
        </Provider>,
        sandbox,
      );

      const sectionTitle = screen.getByText('What is the name of the group?');
      expect(sectionTitle).toBeInTheDocument();
      expect(screen.getByTestId('group-name-input')).toBeInTheDocument();
    });

    it('should render workers assignment section', () => {
      renderWithQuicksandProvider(
        <Provider store={store}>
          <GroupDetailsContent {...defaultProps} />
        </Provider>,
        sandbox,
      );

      expect(
        screen.getByText('Who is a part of this group?'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('assign-workers-btn')).toBeInTheDocument();
      expect(screen.getByTestId('workers-count-indicator')).toBeInTheDocument();
    });

    it('should render leads assignment section', () => {
      renderWithQuicksandProvider(
        <Provider store={store}>
          <GroupDetailsContent {...defaultProps} />
        </Provider>,
        sandbox,
      );

      expect(screen.getByText('Who leads this group?')).toBeInTheDocument();
      expect(
        screen.getByText(
          'They can edit jobs and manage user accounts, timesheets, schedules, and run reports in QuickBooks Time.',
        ),
      ).toBeInTheDocument();
      expect(screen.getByTestId('assign-leads-btn')).toBeInTheDocument();
      expect(screen.getByTestId('leads-count-indicator')).toBeInTheDocument();
    });

    it('should render dividers between sections', () => {
      renderWithQuicksandProvider(
        <Provider store={store}>
          <GroupDetailsContent {...defaultProps} />
        </Provider>,
        sandbox,
      );

      const dividers = screen.getAllByTestId('divider');
      expect(dividers).toHaveLength(2);
    });

    it('should display error message when errorMessage prop is provided', () => {
      const testStore = createMockStore({
        workersGroupView: {
          drawerError: {
            errorTitle: 'Test Error Title',
            errorMessage: 'Test error message',
          },
        },
        workersList: {
          workers: [],
          pageInfo: null,
          loading: false,
          error: null,
          currentPage: 1,
          headerTotalCount: 34,
        },
      });

      renderWithQuicksandProvider(
        <Provider store={testStore}>
          <GroupDetailsContent {...defaultProps} />
        </Provider>,
        sandbox,
      );

      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('should not display error message when errorMessage is undefined', () => {
      renderWithQuicksandProvider(
        <Provider store={store}>
          <GroupDetailsContent {...defaultProps} />
        </Provider>,
        sandbox,
      );

      expect(screen.queryByTestId('page-message')).not.toBeInTheDocument();
    });
  });

  describe('Group Name Input', () => {
    it('should display the provided group name', () => {
      const propsWithName = {
        ...defaultProps,
        groupName: 'Engineering Team',
      };

      renderWithQuicksandProvider(
        <Provider store={store}>
          <GroupDetailsContent {...propsWithName} />
        </Provider>,
        sandbox,
      );

      const input = screen.getByTestId('group-name-input') as HTMLInputElement;
      expect(input.value).toBe('Engineering Team');
    });

    it('should call onGroupNameChange when input value changes', () => {
      renderWithQuicksandProvider(
        <Provider store={store}>
          <GroupDetailsContent {...defaultProps} />
        </Provider>,
        sandbox,
      );

      const input = screen.getByTestId('group-name-input');
      fireEvent.change(input, { target: { value: 'New Group' } });

      expect(mockOnGroupNameChange).toHaveBeenCalledWith('New Group');
    });

    it('should call onKeyDown when key is pressed', () => {
      renderWithQuicksandProvider(
        <Provider store={store}>
          <GroupDetailsContent {...defaultProps} />
        </Provider>,
        sandbox,
      );

      const input = screen.getByTestId('group-name-input');
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      expect(mockOnKeyDown).toHaveBeenCalled();
    });

    it('should disable input when loading is true', () => {
      const propsWithLoading = {
        ...defaultProps,
        loading: true,
      };

      renderWithQuicksandProvider(
        <Provider store={store}>
          <GroupDetailsContent {...propsWithLoading} />
        </Provider>,
        sandbox,
      );

      const input = screen.getByTestId('group-name-input');
      expect(input).toBeDisabled();
    });

    it('should not disable input when loading is false', () => {
      renderWithQuicksandProvider(
        <Provider store={store}>
          <GroupDetailsContent {...defaultProps} />
        </Provider>,
        sandbox,
      );

      const input = screen.getByTestId('group-name-input');
      expect(input).not.toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should call onClearError when error message is closed', () => {
      const testStore = createMockStore({
        workersGroupView: {
          drawerError: {
            errorTitle: 'Test Error Title',
            errorMessage: 'Test error message',
          },
        },
        workersList: {
          workers: [],
          pageInfo: null,
          loading: false,
          error: null,
          currentPage: 1,
          headerTotalCount: 34,
        },
      });

      renderWithQuicksandProvider(
        <Provider store={testStore}>
          <GroupDetailsContent {...defaultProps} />
        </Provider>,
        sandbox,
      );

      const closeButton = screen.getByTestId('page-message-close');
      fireEvent.click(closeButton);

      expect(mockOnClearError).toHaveBeenCalled();
    });
  });

  describe('Worker Assignment', () => {
    it('should display workers count correctly', () => {
      const propsWithWorkers = {
        ...defaultProps,
        selectedWorkersCount: 5,
        totalActiveWorkersCount: 34,
      };

      const testStore = createMockStore({
        workersList: {
          workers: [],
          pageInfo: null,
          loading: false,
          error: null,
          currentPage: 1,
          headerTotalCount: 34,
        },
      });

      renderWithQuicksandProvider(
        <Provider store={testStore}>
          <GroupDetailsContent {...propsWithWorkers} />
        </Provider>,
        sandbox,
      );

      expect(screen.getByText('5 of 34 workers')).toBeInTheDocument();
    });

    it('should call onAssignWorkers when assign workers button is clicked', () => {
      renderWithQuicksandProvider(
        <Provider store={store}>
          <GroupDetailsContent {...defaultProps} />
        </Provider>,
        sandbox,
      );

      const assignWorkersBtn = screen.getByTestId('assign-workers-btn');
      fireEvent.click(assignWorkersBtn);

      expect(mockOnAssignWorkers).toHaveBeenCalled();
    });

    it('should disable assign workers button when loading', () => {
      const propsWithLoading = {
        ...defaultProps,
        loading: true,
      };

      renderWithQuicksandProvider(
        <Provider store={store}>
          <GroupDetailsContent {...propsWithLoading} />
        </Provider>,
        sandbox,
      );

      const assignWorkersBtn = screen.getByTestId('assign-workers-btn');
      expect(assignWorkersBtn).toBeDisabled();
    });
  });

  describe('Lead Assignment', () => {
    it('should display leads count correctly', () => {
      const propsWithLeads = {
        ...defaultProps,
        selectedLeadsCount: 2,
      };

      renderWithQuicksandProvider(
        <Provider store={store}>
          <GroupDetailsContent {...propsWithLeads} />
        </Provider>,
        sandbox,
      );

      expect(screen.getByText('2 group leads')).toBeInTheDocument();
    });

    it('should call onAssignLeads when assign leads button is clicked', () => {
      renderWithQuicksandProvider(
        <Provider store={store}>
          <GroupDetailsContent {...defaultProps} />
        </Provider>,
        sandbox,
      );

      const assignLeadsBtn = screen.getByTestId('assign-leads-btn');
      fireEvent.click(assignLeadsBtn);

      expect(mockOnAssignLeads).toHaveBeenCalled();
    });

    it('should disable assign leads button when loading', () => {
      const propsWithLoading = {
        ...defaultProps,
        loading: true,
      };

      renderWithQuicksandProvider(
        <Provider store={store}>
          <GroupDetailsContent {...propsWithLoading} />
        </Provider>,
        sandbox,
      );

      const assignLeadsBtn = screen.getByTestId('assign-leads-btn');
      expect(assignLeadsBtn).toBeDisabled();
    });
  });

  describe('Integration', () => {
    it('should handle multiple interactions correctly', () => {
      renderWithQuicksandProvider(
        <Provider store={store}>
          <GroupDetailsContent {...defaultProps} />
        </Provider>,
        sandbox,
      );

      // Change group name
      const input = screen.getByTestId('group-name-input');
      fireEvent.change(input, { target: { value: 'Test Group' } });
      expect(mockOnGroupNameChange).toHaveBeenCalledWith('Test Group');

      // Click assign workers
      const assignWorkersBtn = screen.getByTestId('assign-workers-btn');
      fireEvent.click(assignWorkersBtn);
      expect(mockOnAssignWorkers).toHaveBeenCalled();

      // Click assign leads
      const assignLeadsBtn = screen.getByTestId('assign-leads-btn');
      fireEvent.click(assignLeadsBtn);
      expect(mockOnAssignLeads).toHaveBeenCalled();
    });

    it('should handle zero workers and leads correctly', () => {
      const testStore = createMockStore({
        workersList: {
          workers: [],
          pageInfo: null,
          loading: false,
          error: null,
          currentPage: 1,
          headerTotalCount: 34,
        },
      });

      renderWithQuicksandProvider(
        <Provider store={testStore}>
          <GroupDetailsContent {...defaultProps} />
        </Provider>,
        sandbox,
      );

      expect(screen.getByText('0 of 34 workers')).toBeInTheDocument();
      expect(screen.getByText('0 group leads')).toBeInTheDocument();
    });

    it('should properly disable all interactive elements when loading', () => {
      const propsWithLoading = {
        ...defaultProps,
        loading: true,
      };

      renderWithQuicksandProvider(
        <Provider store={store}>
          <GroupDetailsContent {...propsWithLoading} />
        </Provider>,
        sandbox,
      );

      expect(screen.getByTestId('group-name-input')).toBeDisabled();
      expect(screen.getByTestId('assign-workers-btn')).toBeDisabled();
      expect(screen.getByTestId('assign-leads-btn')).toBeDisabled();
    });
  });

  describe('Error State from Redux', () => {
    it('should display error title when provided', () => {
      const testStore = createMockStore({
        workersGroupView: {
          drawerError: {
            errorTitle: 'Custom Error Title',
            errorMessage: 'Custom error message',
          },
        },
        workersList: {
          workers: [],
          pageInfo: null,
          loading: false,
          error: null,
          currentPage: 1,
          headerTotalCount: 34,
        },
      });

      renderWithQuicksandProvider(
        <Provider store={testStore}>
          <GroupDetailsContent {...defaultProps} />
        </Provider>,
        sandbox,
      );

      expect(screen.getByText('Custom Error Title')).toBeInTheDocument();
      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });

    it('should display error message without title when title is null', () => {
      const testStore = createMockStore({
        workersGroupView: {
          drawerError: {
            errorTitle: null,
            errorMessage: 'Error message without title',
          },
        },
        workersList: {
          workers: [],
          pageInfo: null,
          loading: false,
          error: null,
          currentPage: 1,
          headerTotalCount: 34,
        },
      });

      renderWithQuicksandProvider(
        <Provider store={testStore}>
          <GroupDetailsContent {...defaultProps} />
        </Provider>,
        sandbox,
      );

      expect(
        screen.getByText('Error message without title'),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId('page-message-title'),
      ).not.toBeInTheDocument();
    });

    it('should display error message without title when title is undefined', () => {
      const testStore = createMockStore({
        workersGroupView: {
          drawerError: {
            errorTitle: undefined,
            errorMessage: 'Error message with undefined title',
          },
        },
        workersList: {
          workers: [],
          pageInfo: null,
          loading: false,
          error: null,
          currentPage: 1,
          headerTotalCount: 34,
        },
      });

      renderWithQuicksandProvider(
        <Provider store={testStore}>
          <GroupDetailsContent {...defaultProps} />
        </Provider>,
        sandbox,
      );

      expect(
        screen.getByText('Error message with undefined title'),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId('page-message-title'),
      ).not.toBeInTheDocument();
    });

    it('should not display error message when both title and message are null', () => {
      const testStore = createMockStore({
        workersGroupView: {
          drawerError: {
            errorTitle: null,
            errorMessage: null,
          },
        },
        workersList: {
          workers: [],
          pageInfo: null,
          loading: false,
          error: null,
          currentPage: 1,
          headerTotalCount: 34,
        },
      });

      renderWithQuicksandProvider(
        <Provider store={testStore}>
          <GroupDetailsContent {...defaultProps} />
        </Provider>,
        sandbox,
      );

      expect(
        screen.queryByTestId('group-drawer-error-message'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Total Active Workers Count', () => {
    it('should display correct workers count with total from Redux', () => {
      const testStore = createMockStore({
        workersList: {
          workers: [],
          pageInfo: null,
          loading: false,
          error: null,
          currentPage: 1,
          headerTotalCount: 100,
        },
      });

      const propsWithWorkers = {
        ...defaultProps,
        selectedWorkersCount: 10,
      };

      renderWithQuicksandProvider(
        <Provider store={testStore}>
          <GroupDetailsContent {...propsWithWorkers} />
        </Provider>,
        sandbox,
      );

      expect(screen.getByText('10 of 100 workers')).toBeInTheDocument();
    });

    it('should handle zero total active workers count', () => {
      const testStore = createMockStore({
        workersList: {
          workers: [],
          pageInfo: null,
          loading: false,
          error: null,
          currentPage: 1,
          headerTotalCount: 0,
        },
      });

      renderWithQuicksandProvider(
        <Provider store={testStore}>
          <GroupDetailsContent {...defaultProps} />
        </Provider>,
        sandbox,
      );

      expect(screen.getByText('0 of 0 workers')).toBeInTheDocument();
    });
  });

  describe('NTTF - shouldShowGroupLeads', () => {
    it('should hide leads section when shouldShowGroupLeads is false', () => {
      renderWithQuicksandProvider(
        <Provider store={store}>
          <GroupDetailsContent {...defaultProps} shouldShowGroupLeads={false} />
        </Provider>,
        sandbox,
      );

      // Workers section should still be visible
      expect(
        screen.getByText('Who is a part of this group?'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('assign-workers-btn')).toBeInTheDocument();

      // Leads section should be hidden
      expect(
        screen.queryByText('Who leads this group?'),
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId('assign-leads-btn')).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('leads-count-indicator'),
      ).not.toBeInTheDocument();
    });

    it('should show only one divider when shouldShowGroupLeads is false', () => {
      renderWithQuicksandProvider(
        <Provider store={store}>
          <GroupDetailsContent {...defaultProps} shouldShowGroupLeads={false} />
        </Provider>,
        sandbox,
      );

      const dividers = screen.getAllByTestId('divider');
      expect(dividers).toHaveLength(1);
    });

    it('should show leads section when shouldShowGroupLeads is true', () => {
      renderWithQuicksandProvider(
        <Provider store={store}>
          <GroupDetailsContent {...defaultProps} shouldShowGroupLeads />
        </Provider>,
        sandbox,
      );

      expect(screen.getByText('Who leads this group?')).toBeInTheDocument();
      expect(screen.getByTestId('assign-leads-btn')).toBeInTheDocument();
      expect(screen.getByTestId('leads-count-indicator')).toBeInTheDocument();
    });

    it('should default to showing leads section when shouldShowGroupLeads is not provided', () => {
      renderWithQuicksandProvider(
        <Provider store={store}>
          <GroupDetailsContent {...defaultProps} />
        </Provider>,
        sandbox,
      );

      expect(screen.getByText('Who leads this group?')).toBeInTheDocument();
      expect(screen.getByTestId('assign-leads-btn')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty group name', () => {
      const propsWithEmptyName = {
        ...defaultProps,
        groupName: '',
      };

      renderWithQuicksandProvider(
        <Provider store={store}>
          <GroupDetailsContent {...propsWithEmptyName} />
        </Provider>,
        sandbox,
      );

      const input = screen.getByTestId('group-name-input') as HTMLInputElement;
      expect(input.value).toBe('');
    });

    it('should handle very long group name', () => {
      const longName = 'a'.repeat(60);
      const propsWithLongName = {
        ...defaultProps,
        groupName: longName,
      };

      renderWithQuicksandProvider(
        <Provider store={store}>
          <GroupDetailsContent {...propsWithLongName} />
        </Provider>,
        sandbox,
      );

      const input = screen.getByTestId('group-name-input') as HTMLInputElement;
      expect(input.value).toBe(longName);
    });

    it('should handle onKeyDown callback', () => {
      renderWithQuicksandProvider(
        <Provider store={store}>
          <GroupDetailsContent {...defaultProps} />
        </Provider>,
        sandbox,
      );

      const input = screen.getByTestId('group-name-input');
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      expect(mockOnKeyDown).toHaveBeenCalled();
    });
  });
});

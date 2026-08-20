// @ts-nocheck
/**
 * BreaksCardView Component Tests
 *
 * Tests for the BreaksCardView component that displays
 * break rules in view mode.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import BreaksCardView from 'src/js/widgets/userSettings/components/cards/BreaksCard/components/BreaksCardView';
import breaksReducer, {
  BreaksCardMode,
} from 'src/js/widgets/userSettings/store/slices/breaksSlice';
import { Payroll_Break } from 'src/__generated__/oigql/graphql';
import { NAVIGATION_ROUTES } from 'src/js/widgets/userSettings/components/constants/UserSettingsPage.constants';

// Mock break data
const mockPaidBreak = {
  id: '1',
  breakName: 'Paid Lunch Break',
  breakType: Payroll_Break.Paid,
  breakDuration: 30,
  durationUnit: 'MINUTES',
  isActive: true,
  isDefaultPolicy: false,
  allowAuto: true,
  allowManual: true,
  noSetDuration: false,
};

const mockUnpaidBreak = {
  id: '2',
  breakName: 'Unpaid Coffee Break',
  breakType: Payroll_Break.Unpaid,
  breakDuration: 15,
  durationUnit: 'MINUTES',
  isActive: true,
  isDefaultPolicy: false,
  allowAuto: false,
  allowManual: true,
  noSetDuration: false,
};

// Mock navigation function
const mockNavigate = jest.fn();
const mockLoggerInfo = jest.fn();
const mockLoggerError = jest.fn();

// Mock @payroll/quicksand
jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }) => {
      const messages = {
        'breaks.title': 'Breaks',
        'breaks.paid.rules': 'Paid breaks',
        'breaks.unpaid.rules': 'Unpaid breaks',
        'breaks.no.rules': 'No break rules',
      };
      return messages[id] || id;
    },
  }),
  useSandbox: () => ({
    navigation: {
      navigate: mockNavigate,
    },
    logger: {
      info: mockLoggerInfo,
      error: mockLoggerError,
    },
  }),
}));

// Mock the common card styles
jest.mock('src/js/widgets/userSettings/components/styles/cards.styles', () => ({
  HeaderRow: ({ children }) => <div data-testid="header-row">{children}</div>,
  Actions: ({ children }) => <div data-testid="actions">{children}</div>,
}));

// Mock the component-specific styles
jest.mock(
  'src/js/widgets/userSettings/components/cards/BreaksCard/styles/BreaksCardView.styles',
  () => ({
    BreaksGrid: ({ children }) => (
      <div data-testid="breaks-grid">{children}</div>
    ),
    BreaksColumn: ({ children }) => (
      <div data-testid="breaks-column">{children}</div>
    ),
    BreakRuleItem: ({ children }) => (
      <div data-testid="break-rule-item">{children}</div>
    ),
  }),
);

// Mock @cgds/skeleton
jest.mock('@cgds/skeleton', () => ({
  Skeleton: ({ variant, height }) => (
    <div
      data-testid="skeleton-loader"
      data-variant={variant}
      data-height={height}
    >
      Loading...
    </div>
  ),
}));

// Mock @ids-ts/icon-control
jest.mock('@ids-ts/icon-control', () => ({
  IconControl: ({ children, onClick, disabled, 'aria-label': ariaLabel }) => (
    <button
      data-testid="icon-control"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  ),
}));

// Mock @design-systems/icons
jest.mock('@design-systems/icons', () => ({
  NewWindow: () => <span data-testid="new-window-icon">NewWindow</span>,
  CoffeeMug: () => <span data-testid="coffee-mug-icon">CoffeeMug</span>,
  CircleAlertQuickbooks: () => (
    <span data-testid="alert-icon">CircleAlertQuickbooks</span>
  ),
}));

// Mock BreaksStateMessage component
jest.mock(
  'src/js/widgets/userSettings/components/cards/BreaksCard/components/BreaksStateMessage',
  () => ({
    __esModule: true,
    default: ({ testId, messageId }) => (
      <div data-testid={testId}>{messageId}</div>
    ),
  }),
);

describe('BreaksCardView', () => {
  let store;

  const createMockStore = (breaks = [], loading = false, error = null) =>
    configureStore({
      reducer: {
        breaks: breaksReducer,
      },
      preloadedState: {
        breaks: {
          mode: BreaksCardMode.VIEW,
          breaks,
          draftBreaks: breaks,
          loading,
          error,
        },
      },
    });

  const renderComponent = (breaks = [], loading = false, error = null) => {
    store = createMockStore(breaks, loading, error);
    return render(
      <Provider store={store}>
        <BreaksCardView />
      </Provider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    mockLoggerInfo.mockClear();
    mockLoggerError.mockClear();
  });

  describe('Component Initialization', () => {
    test('renders without crashing', () => {
      expect(() => {
        renderComponent();
      }).not.toThrow();
    });

    test('renders and matches snapshot', () => {
      const componentOutput = renderComponent([mockPaidBreak, mockUnpaidBreak]);
      expect(componentOutput).toMatchSnapshot();
    });
  });

  describe('Rendering', () => {
    test('should render the title', () => {
      renderComponent();

      expect(screen.getByText('Breaks')).toBeInTheDocument();
    });

    test('should render paid and unpaid columns', () => {
      renderComponent([mockPaidBreak, mockUnpaidBreak]);

      expect(screen.getByText('Paid breaks')).toBeInTheDocument();
      expect(screen.getByText('Unpaid breaks')).toBeInTheDocument();
    });

    test('should render break names in correct columns', () => {
      renderComponent([mockPaidBreak, mockUnpaidBreak]);

      expect(screen.getByText('Paid Lunch Break')).toBeInTheDocument();
      expect(screen.getByText('Unpaid Coffee Break')).toBeInTheDocument();
    });

    test('should render breaks grid when breaks exist', () => {
      renderComponent([mockPaidBreak]);

      expect(screen.getByTestId('breaks-grid')).toBeInTheDocument();
      expect(screen.getByText('Paid Lunch Break')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    test('should display loading skeletons when loading is true', () => {
      renderComponent([], true);

      const skeletons = screen.getAllByTestId('skeleton-loader');
      // Should show loading skeletons for both columns
      expect(skeletons.length).toBeGreaterThan(0);
    });

    test('should not display loading skeletons when loading is false', () => {
      renderComponent([mockPaidBreak, mockUnpaidBreak], false);

      expect(screen.queryByTestId('skeleton-loader')).not.toBeInTheDocument();
    });

    test('should show break names when not loading', () => {
      renderComponent([mockPaidBreak], false);

      expect(screen.getByText('Paid Lunch Break')).toBeInTheDocument();
    });
  });

  describe('Multiple Breaks', () => {
    test('should render multiple paid breaks', () => {
      const multiplePaidBreaks = [
        mockPaidBreak,
        { ...mockPaidBreak, id: '3', breakName: 'Another Paid Break' },
      ];

      renderComponent(multiplePaidBreaks);

      expect(screen.getByText('Paid Lunch Break')).toBeInTheDocument();
      expect(screen.getByText('Another Paid Break')).toBeInTheDocument();
    });

    test('should render multiple unpaid breaks', () => {
      const multipleUnpaidBreaks = [
        mockUnpaidBreak,
        { ...mockUnpaidBreak, id: '3', breakName: 'Another Unpaid Break' },
      ];

      renderComponent(multipleUnpaidBreaks);

      expect(screen.getByText('Unpaid Coffee Break')).toBeInTheDocument();
      expect(screen.getByText('Another Unpaid Break')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    test('uses styled components correctly', () => {
      renderComponent([mockPaidBreak]);

      expect(screen.getByTestId('header-row')).toBeInTheDocument();
      expect(screen.getByTestId('breaks-grid')).toBeInTheDocument();
      expect(screen.getAllByTestId('breaks-column').length).toBe(2);
    });

    test('renders break rule items', () => {
      renderComponent([mockPaidBreak, mockUnpaidBreak]);

      const breakRuleItems = screen.getAllByTestId('break-rule-item');
      expect(breakRuleItems).toHaveLength(2);
    });
  });

  describe('Settings Navigation', () => {
    test('should render the settings navigation icon', () => {
      renderComponent();

      expect(screen.getByTestId('new-window-icon')).toBeInTheDocument();
    });

    test('should render the icon control with correct aria-label', () => {
      renderComponent();

      const iconControl = screen.getByTestId('icon-control');
      expect(iconControl).toHaveAttribute('aria-label', 'edit-breaks');
    });

    test('should navigate to time settings page when icon is clicked', () => {
      renderComponent();

      const iconControl = screen.getByTestId('icon-control');
      fireEvent.click(iconControl);

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith(
        NAVIGATION_ROUTES.TIME_SETTINGS,
      );
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        'Component=BreaksCardView Event=Navigating to time settings',
      );
    });

    test('should disable settings icon when loading', () => {
      renderComponent([], true);

      const iconControl = screen.getByTestId('icon-control');
      expect(iconControl).toBeDisabled();
    });

    test('should enable settings icon when not loading', () => {
      renderComponent([mockPaidBreak], false);

      const iconControl = screen.getByTestId('icon-control');
      expect(iconControl).not.toBeDisabled();
    });

    test('should log error when navigation fails', () => {
      const mockError = new Error('Navigation failed');
      mockNavigate.mockImplementationOnce(() => {
        throw mockError;
      });

      renderComponent();

      const iconControl = screen.getByTestId('icon-control');
      fireEvent.click(iconControl);

      expect(mockLoggerError).toHaveBeenCalledWith(
        'Component=BreaksCardView Event=Navigation to time settings failed',
        { error: mockError },
      );
    });

    test('should render actions container with settings icon', () => {
      renderComponent();

      expect(screen.getByTestId('actions')).toBeInTheDocument();
      expect(screen.getByTestId('icon-control')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    test('should render empty state when no breaks exist', () => {
      renderComponent([]);

      expect(screen.getByTestId('breaks-empty-state')).toBeInTheDocument();
    });

    test('should not render breaks grid when no breaks exist', () => {
      renderComponent([]);

      expect(screen.queryByTestId('breaks-grid')).not.toBeInTheDocument();
    });

    test('should not render empty state when paid breaks exist', () => {
      renderComponent([mockPaidBreak]);

      expect(
        screen.queryByTestId('breaks-empty-state'),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('breaks-grid')).toBeInTheDocument();
    });

    test('should not render empty state when unpaid breaks exist', () => {
      renderComponent([mockUnpaidBreak]);

      expect(
        screen.queryByTestId('breaks-empty-state'),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('breaks-grid')).toBeInTheDocument();
    });

    test('should not render empty state when both paid and unpaid breaks exist', () => {
      renderComponent([mockPaidBreak, mockUnpaidBreak]);

      expect(
        screen.queryByTestId('breaks-empty-state'),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('breaks-grid')).toBeInTheDocument();
    });

    test('should still render header with empty state', () => {
      renderComponent([]);

      expect(screen.getByTestId('header-row')).toBeInTheDocument();
      expect(screen.getByText('Breaks')).toBeInTheDocument();
    });

    test('should still render settings icon in empty state', () => {
      renderComponent([]);

      expect(screen.getByTestId('icon-control')).toBeInTheDocument();
      expect(screen.getByTestId('new-window-icon')).toBeInTheDocument();
    });

    test('should navigate to settings from empty state', () => {
      renderComponent([]);

      const iconControl = screen.getByTestId('icon-control');
      fireEvent.click(iconControl);

      expect(mockNavigate).toHaveBeenCalledWith(
        NAVIGATION_ROUTES.TIME_SETTINGS,
      );
    });

    test('should not render empty state while loading', () => {
      renderComponent([], true);

      expect(
        screen.queryByTestId('breaks-empty-state'),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('breaks-grid')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    test('should render error state when error exists', () => {
      renderComponent([], false, 'Failed to load breaks');

      expect(screen.getByTestId('breaks-error-state')).toBeInTheDocument();
    });

    test('should not render breaks grid when error exists', () => {
      renderComponent([], false, 'Failed to load breaks');

      expect(screen.queryByTestId('breaks-grid')).not.toBeInTheDocument();
    });

    test('should not render empty state when error exists', () => {
      renderComponent([], false, 'Failed to load breaks');

      expect(
        screen.queryByTestId('breaks-empty-state'),
      ).not.toBeInTheDocument();
    });

    test('should render error state even when breaks exist in state', () => {
      renderComponent([mockPaidBreak], false, 'Failed to load breaks');

      expect(screen.getByTestId('breaks-error-state')).toBeInTheDocument();
      expect(screen.queryByTestId('breaks-grid')).not.toBeInTheDocument();
    });

    test('should still render header with error state', () => {
      renderComponent([], false, 'Failed to load breaks');

      expect(screen.getByTestId('header-row')).toBeInTheDocument();
      expect(screen.getByText('Breaks')).toBeInTheDocument();
    });

    test('should still render settings icon in error state', () => {
      renderComponent([], false, 'Failed to load breaks');

      expect(screen.getByTestId('icon-control')).toBeInTheDocument();
      expect(screen.getByTestId('new-window-icon')).toBeInTheDocument();
    });

    test('should navigate to settings from error state', () => {
      renderComponent([], false, 'Failed to load breaks');

      const iconControl = screen.getByTestId('icon-control');
      fireEvent.click(iconControl);

      expect(mockNavigate).toHaveBeenCalledWith(
        NAVIGATION_ROUTES.TIME_SETTINGS,
      );
    });

    test('should not render error state when no error exists', () => {
      renderComponent([mockPaidBreak], false, null);

      expect(
        screen.queryByTestId('breaks-error-state'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Empty Paid/Unpaid Rules Display', () => {
    test('should render dash when only paid breaks exist', () => {
      renderComponent([mockPaidBreak]);

      expect(screen.getByText('Paid Lunch Break')).toBeInTheDocument();
      // Should show dash for unpaid breaks
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    test('should render dash when only unpaid breaks exist', () => {
      renderComponent([mockUnpaidBreak]);

      expect(screen.getByText('Unpaid Coffee Break')).toBeInTheDocument();
      // Should show dash for paid breaks
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    test('should not render dash when both paid and unpaid breaks exist', () => {
      renderComponent([mockPaidBreak, mockUnpaidBreak]);

      expect(screen.getByText('Paid Lunch Break')).toBeInTheDocument();
      expect(screen.getByText('Unpaid Coffee Break')).toBeInTheDocument();
      expect(screen.queryByText('—')).not.toBeInTheDocument();
    });
  });

  describe('Component Lifecycle', () => {
    test('handles component unmounting without errors', () => {
      const { unmount } = renderComponent();

      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });
});

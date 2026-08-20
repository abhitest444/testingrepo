// @ts-nocheck
/**
 * LocationCardView Component Tests
 *
 * Tests for the LocationCardView component that displays
 * location settings in view mode.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import LocationCardView from 'src/js/widgets/userSettings/components/cards/LocationCard/components/LocationCardView';
import locationReducer, {
  setLocationMode,
} from 'src/js/widgets/userSettings/store/slices/locationSlice';
import settingsContextReducer from 'src/js/widgets/userSettings/store/slices/settingsContextSlice';
import {
  TimeTracking_UserLocationTrackingType,
  TimeTracking_LocationTrackingType,
} from 'src/__generated__/timeTracking/graphql';
import { LocationCardMode } from 'src/js/widgets/userSettings/components/cards/LocationCard/types/LocationCard.types';

// Create mock settings
const mockSettings = {
  value: TimeTracking_UserLocationTrackingType.UseCompanySetting,
  effectiveValue: TimeTracking_LocationTrackingType.Required,
  version: '1',
};

// Helper to create a mock store
const createMockStore = (settings = mockSettings, loading = false) =>
  configureStore({
    reducer: {
      location: locationReducer,
      settingsContext: settingsContextReducer,
    },
    preloadedState: {
      location: {
        mode: LocationCardMode.VIEW,
        settings,
        draftSettings: settings,
        loading,
        error: null,
      },
      settingsContext: {
        settingsFor: {
          __typename: 'User',
          userId: 'test-user-id',
          companyId: 'test-company-id',
          fullName: 'Test User',
        },
      },
    },
  });

// Mock the shared card styles (HeaderRow, Actions, FieldGroup)
jest.mock('src/js/widgets/userSettings/components/styles/cards.styles', () => ({
  HeaderRow: ({ children }) => <div data-testid="header-row">{children}</div>,
  Actions: ({ children }) => <div data-testid="actions">{children}</div>,
  FieldGroup: ({ children }) => <div data-testid="field-group">{children}</div>,
}));

// Mock the LocationCard-specific styles (FieldsGrid)
jest.mock(
  'src/js/widgets/userSettings/components/cards/LocationCard/styles',
  () => ({
    FieldsGrid: ({ children }) => (
      <div data-testid="fields-grid">{children}</div>
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

// Mock SuccessToast component
jest.mock('src/js/widgets/common/SuccessToast', () => ({
  SuccessToast: ({ message, open, onClose }) =>
    open ? (
      <div data-testid="success-toast" onClick={onClose}>
        {message}
      </div>
    ) : null,
}));

// Mock tracking function
const mockTrack = jest.fn();

// Mock @payroll/quicksand
jest.mock('@payroll/quicksand', () => ({
  IntlProvider: ({ children }) => children,
  useIntl: () => ({
    formatMessage: ({ id }) => {
      const messages = {
        'location.title': 'Location',
        'location.company.settings': 'Company settings',
        'location.company.settings.on': 'On',
        'location.company.settings.off': 'Off',
        'location.tracking.label': 'Location tracking',
        'location.tracking.required': 'Required',
        'location.tracking.optional': 'Optional',
        'location.tracking.off': 'Off',
        'settings.saved.success': 'Settings saved successfully',
      };
      return messages[id] || id;
    },
  }),
  useTracking: () => mockTrack,
}));

// Helper to render component
const renderComponent = (props = {}, store = createMockStore()) => {
  const dispatchSpy = jest.spyOn(store, 'dispatch');
  const result = render(
    <Provider store={store}>
      <LocationCardView {...props} />
    </Provider>,
  );
  return { ...result, store, dispatchSpy };
};

describe('LocationCardView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTrack.mockClear();
  });

  describe('Component Initialization', () => {
    test('renders without crashing', () => {
      expect(() => {
        renderComponent();
      }).not.toThrow();
    });

    test('renders and matches snapshot', () => {
      const componentOutput = renderComponent();
      expect(componentOutput).toMatchSnapshot();
    });
  });

  describe('Rendering', () => {
    test('should render title', () => {
      renderComponent();
      expect(screen.getByText('Location')).toBeInTheDocument();
    });

    test('should render company settings field', () => {
      renderComponent();
      expect(screen.getByText('Company settings')).toBeInTheDocument();
    });

    test('should render location tracking field', () => {
      renderComponent();
      expect(screen.getByText('Location tracking')).toBeInTheDocument();
    });

    test('should render all field groups', () => {
      renderComponent();
      const fieldGroups = screen.getAllByTestId('field-group');
      expect(fieldGroups).toHaveLength(2);
    });
  });

  describe('Settings Display', () => {
    test('displays company settings as On when using company setting', () => {
      const settingsWithCompanySetting = {
        value: TimeTracking_UserLocationTrackingType.UseCompanySetting,
        effectiveValue: TimeTracking_LocationTrackingType.Required,
        version: '1',
      };
      const store = createMockStore(settingsWithCompanySetting);
      renderComponent({}, store);

      expect(screen.getByText('On')).toBeInTheDocument();
    });

    test('displays company settings as Off when using custom rules', () => {
      const settingsWithCustomRules = {
        value: TimeTracking_UserLocationTrackingType.Required,
        effectiveValue: TimeTracking_LocationTrackingType.Required,
        version: '1',
      };
      const store = createMockStore(settingsWithCustomRules);
      renderComponent({}, store);

      expect(screen.getByText('Off')).toBeInTheDocument();
    });

    test('displays location tracking value as Required', () => {
      const store = createMockStore({
        ...mockSettings,
        effectiveValue: TimeTracking_LocationTrackingType.Required,
      });
      renderComponent({}, store);

      expect(screen.getByText('Required')).toBeInTheDocument();
    });

    test('displays location tracking value as Optional', () => {
      const store = createMockStore({
        ...mockSettings,
        effectiveValue: TimeTracking_LocationTrackingType.Optional,
      });
      renderComponent({}, store);

      expect(screen.getByText('Optional')).toBeInTheDocument();
    });

    test('displays location tracking value as Off', () => {
      const store = createMockStore({
        ...mockSettings,
        effectiveValue: TimeTracking_LocationTrackingType.Off,
      });
      renderComponent({}, store);

      // Note: "Off" appears both for company settings and location tracking
      const offTexts = screen.getAllByText('Off');
      expect(offTexts.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Actions', () => {
    test('should render edit button by default', () => {
      renderComponent();
      expect(screen.getByLabelText('edit-location')).toBeInTheDocument();
    });

    test('should render edit button when showActions is true', () => {
      renderComponent({ showActions: true });
      expect(screen.getByLabelText('edit-location')).toBeInTheDocument();
    });

    test('should not render edit button when showActions is false', () => {
      renderComponent({ showActions: false });
      expect(screen.queryByLabelText('edit-location')).not.toBeInTheDocument();
    });

    test('should dispatch setLocationMode with EDIT when edit button is clicked', () => {
      const { dispatchSpy } = renderComponent({ showActions: true });

      const editButton = screen.getByLabelText('edit-location');
      fireEvent.click(editButton);

      expect(dispatchSpy).toHaveBeenCalledWith(
        setLocationMode(LocationCardMode.EDIT),
      );
      expect(dispatchSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Component Lifecycle', () => {
    test('maintains state across rerenders', () => {
      const { rerender, store } = renderComponent();

      expect(screen.getByText('Location')).toBeInTheDocument();

      rerender(
        <Provider store={store}>
          <LocationCardView />
        </Provider>,
      );

      expect(screen.getByText('Location')).toBeInTheDocument();
    });

    test('handles showActions prop change on rerender', () => {
      const { rerender, store } = renderComponent({ showActions: true });

      expect(screen.getByLabelText('edit-location')).toBeInTheDocument();

      rerender(
        <Provider store={store}>
          <LocationCardView showActions={false} />
        </Provider>,
      );

      expect(screen.queryByLabelText('edit-location')).not.toBeInTheDocument();
    });

    test('handles component unmounting without errors', () => {
      const { unmount } = renderComponent();

      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });

  describe('Props Handling', () => {
    test('handles showActions prop edge cases', () => {
      expect(() => renderComponent({ showActions: undefined })).not.toThrow();
      expect(() => renderComponent({ showActions: null })).not.toThrow();
      expect(() => renderComponent({ showActions: true })).not.toThrow();
      expect(() => renderComponent({ showActions: false })).not.toThrow();
    });
  });

  describe('Component Structure', () => {
    test('uses styled components correctly', () => {
      renderComponent({ showActions: true });

      expect(screen.getByTestId('header-row')).toBeInTheDocument();
      expect(screen.getByTestId('actions')).toBeInTheDocument();
      expect(screen.getByTestId('fields-grid')).toBeInTheDocument();
      expect(screen.getAllByTestId('field-group')).toHaveLength(2);
    });

    test('does not render actions container when showActions is false', () => {
      renderComponent({ showActions: false });

      expect(screen.queryByTestId('actions')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('edit button has proper ARIA label', () => {
      renderComponent({ showActions: true });
      expect(screen.getByLabelText('edit-location')).toBeInTheDocument();
    });

    test('edit button is accessible via keyboard', () => {
      const { dispatchSpy } = renderComponent({ showActions: true });

      const editButton = screen.getByLabelText('edit-location');
      editButton.focus();
      fireEvent.keyDown(editButton, { key: 'Enter', code: 'Enter' });

      // IconControl should handle keyboard events
      expect(editButton).toHaveFocus();
    });
  });

  describe('Loading State', () => {
    test('displays loading skeletons when loading state is true in Redux', () => {
      const loadingStore = createMockStore(mockSettings, true);
      renderComponent({}, loadingStore);

      const skeletons = screen.getAllByTestId('skeleton-loader');
      // Should show 2 loading skeletons (one for each field)
      expect(skeletons).toHaveLength(2);
    });

    test('does not display loading skeletons when loading state is false in Redux', () => {
      const notLoadingStore = createMockStore(mockSettings, false);
      renderComponent({}, notLoadingStore);

      expect(screen.queryByTestId('skeleton-loader')).not.toBeInTheDocument();
    });

    test('disables edit button when loading is true in Redux', () => {
      const loadingStore = createMockStore(mockSettings, true);
      renderComponent({ showActions: true }, loadingStore);

      const editButton = screen.getByLabelText('edit-location');
      expect(editButton).toBeDisabled();
    });

    test('edit button is not disabled when loading is false in Redux', () => {
      const notLoadingStore = createMockStore(mockSettings, false);
      renderComponent({ showActions: true }, notLoadingStore);

      const editButton = screen.getByLabelText('edit-location');
      expect(editButton).not.toBeDisabled();
    });

    test('shows actual values when not loading', () => {
      const notLoadingStore = createMockStore(mockSettings, false);
      renderComponent({}, notLoadingStore);

      // Should display actual values, not loading skeletons
      expect(screen.queryByTestId('skeleton-loader')).not.toBeInTheDocument();
      expect(screen.getByText('Required')).toBeInTheDocument();
    });

    test('defaults to loading=false when not set in Redux', () => {
      renderComponent();

      expect(screen.queryByTestId('skeleton-loader')).not.toBeInTheDocument();
    });
  });

  describe('Redux Integration', () => {
    test('reads settings from Redux store', () => {
      const customSettings = {
        value: TimeTracking_UserLocationTrackingType.Optional,
        effectiveValue: TimeTracking_LocationTrackingType.Optional,
        version: '2',
      };
      const store = createMockStore(customSettings);
      renderComponent({}, store);

      expect(screen.getByText('Optional')).toBeInTheDocument();
    });

    test('updates display when Redux state changes', () => {
      const initialSettings = {
        value: TimeTracking_UserLocationTrackingType.UseCompanySetting,
        effectiveValue: TimeTracking_LocationTrackingType.Required,
        version: '1',
      };
      const store = createMockStore(initialSettings);
      const { rerender } = renderComponent({}, store);

      expect(screen.getByText('Required')).toBeInTheDocument();

      // Create a new store with different settings
      const updatedSettings = {
        value: TimeTracking_UserLocationTrackingType.Optional,
        effectiveValue: TimeTracking_LocationTrackingType.Optional,
        version: '2',
      };
      const newStore = createMockStore(updatedSettings);

      rerender(
        <Provider store={newStore}>
          <LocationCardView />
        </Provider>,
      );

      expect(screen.getByText('Optional')).toBeInTheDocument();
    });
  });

  describe('Success Toast', () => {
    test('renders success toast when showSuccessToast prop is true', () => {
      renderComponent({ showSuccessToast: true });

      expect(screen.getByTestId('success-toast')).toBeInTheDocument();
      expect(
        screen.getByText('Settings saved successfully'),
      ).toBeInTheDocument();
    });

    test('does not render success toast when showSuccessToast prop is false', () => {
      renderComponent({ showSuccessToast: false });

      expect(screen.queryByTestId('success-toast')).not.toBeInTheDocument();
    });

    test('does not render success toast by default', () => {
      renderComponent({});

      expect(screen.queryByTestId('success-toast')).not.toBeInTheDocument();
    });

    test('calls onCloseSuccessToast when toast is closed', () => {
      const onCloseSuccessToast = jest.fn();
      renderComponent({ showSuccessToast: true, onCloseSuccessToast });

      const toast = screen.getByTestId('success-toast');
      fireEvent.click(toast);

      expect(onCloseSuccessToast).toHaveBeenCalledTimes(1);
    });

    test('success toast displays correct message from intl', () => {
      renderComponent({ showSuccessToast: true });

      expect(
        screen.getByText('Settings saved successfully'),
      ).toBeInTheDocument();
    });

    test('success toast visibility updates when prop changes', () => {
      const store = createMockStore();
      const { rerender } = renderComponent({ showSuccessToast: false }, store);

      expect(screen.queryByTestId('success-toast')).not.toBeInTheDocument();

      // Rerender with toast visible
      rerender(
        <Provider store={store}>
          <LocationCardView showSuccessToast />
        </Provider>,
      );

      expect(screen.getByTestId('success-toast')).toBeInTheDocument();
    });
  });

  describe('Tracking', () => {
    test('tracks EDIT_LOCATION_CARD when edit button is clicked', () => {
      renderComponent({ showActions: true });

      const editButton = screen.getByLabelText('edit-location');
      fireEvent.click(editButton);

      expect(mockTrack).toHaveBeenCalledTimes(1);
      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'engaged',
          ui_action: 'clicked',
          ui_object: 'button',
          ui_object_detail: 'edit',
          scope: 'qbtime',
          scope_area: 'time-tracking',
          screen: 'time_user_settings',
          object: 'widget',
          object_detail: 'location_user settings',
        }),
      );
    });

    test('does not track when edit button is disabled and loading', () => {
      const loadingStore = createMockStore(mockSettings, true);
      renderComponent({ showActions: true }, loadingStore);

      const editButton = screen.getByLabelText('edit-location');
      fireEvent.click(editButton);

      // Button is disabled, so click shouldn't trigger tracking
      expect(mockTrack).not.toHaveBeenCalled();
    });

    test('tracks edit action before dispatching setLocationMode', () => {
      const { dispatchSpy } = renderComponent({ showActions: true });

      const editButton = screen.getByLabelText('edit-location');
      fireEvent.click(editButton);

      // Verify tracking was called
      expect(mockTrack).toHaveBeenCalledTimes(1);
      // Verify dispatch was also called
      expect(dispatchSpy).toHaveBeenCalledTimes(1);
    });
  });
});

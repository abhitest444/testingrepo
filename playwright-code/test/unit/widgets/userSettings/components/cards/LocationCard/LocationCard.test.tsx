// @ts-nocheck
/**
 * LocationCard Component Tests
 *
 * Tests for the LocationCard container component that displays
 * location settings for a worker and manages VIEW/EDIT mode switching via Redux.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import LocationCard from 'src/js/widgets/userSettings/components/cards/LocationCard';
import locationReducer, {
  setLocationMode,
} from 'src/js/widgets/userSettings/store/slices/locationSlice';
import settingsContextReducer from 'src/js/widgets/userSettings/store/slices/settingsContextSlice';
import {
  TimeTracking_UserLocationTrackingType,
  TimeTracking_LocationTrackingType,
} from 'src/__generated__/timeTracking/graphql';
import { LocationCardMode } from 'src/js/widgets/userSettings/components/cards/LocationCard/types/LocationCard.types';

// Mock logger for sandbox
const mockLoggerInfo = jest.fn();

// Mock @payroll/quicksand
jest.mock('@payroll/quicksand', () => ({
  useSandbox: () => ({
    logger: {
      info: mockLoggerInfo,
    },
  }),
}));

// Mock settings for the store
const mockSettings = {
  value: TimeTracking_UserLocationTrackingType.UseCompanySetting,
  effectiveValue: TimeTracking_LocationTrackingType.Required,
  version: '1',
};

// Helper to create a mock store with configurable initial mode
const createMockStore = (mode = LocationCardMode.VIEW) =>
  configureStore({
    reducer: {
      location: locationReducer,
      settingsContext: settingsContextReducer,
    },
    preloadedState: {
      location: {
        mode,
        settings: mockSettings,
        draftSettings: mockSettings,
        loading: false,
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

// Mock the child components
jest.mock(
  'src/js/widgets/userSettings/components/cards/LocationCard/components/LocationCardView',
  () =>
    function MockLocationCardView({ showActions }) {
      // Import dispatch inside the mock to interact with the store
      const { useAppDispatch } = require('src/js/widgets/userSettings/store');
      const {
        setLocationMode,
      } = require('src/js/widgets/userSettings/store/slices/locationSlice');
      const {
        LocationCardMode,
      } = require('src/js/widgets/userSettings/components/cards/LocationCard/types/LocationCard.types');

      const dispatch = useAppDispatch();

      const handleEditClick = () => {
        dispatch(setLocationMode(LocationCardMode.EDIT));
      };

      return (
        <div data-testid="location-card-view">
          <div>Location View Component</div>
          {showActions && (
            <button data-testid="edit-button" onClick={handleEditClick}>
              Edit
            </button>
          )}
        </div>
      );
    },
);

jest.mock(
  'src/js/widgets/userSettings/components/cards/LocationCard/components/LocationCardEdit',
  () =>
    function MockLocationCardEdit() {
      // Import dispatch inside the mock to interact with the store
      const { useAppDispatch } = require('src/js/widgets/userSettings/store');
      const {
        cancelLocationEdit,
        saveLocationSettings,
      } = require('src/js/widgets/userSettings/store/slices/locationSlice');

      const dispatch = useAppDispatch();

      const handleCancel = () => {
        dispatch(cancelLocationEdit());
      };

      const handleSave = () => {
        dispatch(saveLocationSettings(undefined));
      };

      return (
        <div data-testid="location-card-edit">
          <div>Location Edit Component</div>
          <button data-testid="cancel-button" onClick={handleCancel}>
            Cancel
          </button>
          <button data-testid="save-button" onClick={handleSave}>
            Save
          </button>
        </div>
      );
    },
);

// Helper to render component with Redux provider
const renderComponent = (props = {}, store = createMockStore()) => {
  const dispatchSpy = jest.spyOn(store, 'dispatch');
  const result = render(
    <Provider store={store}>
      <LocationCard {...props} />
    </Provider>,
  );
  return { ...result, store, dispatchSpy };
};

describe('LocationCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoggerInfo.mockClear();
  });

  describe('Component Initialization', () => {
    test('renders without crashing', () => {
      expect(() => {
        renderComponent();
      }).not.toThrow();
    });

    test('renders the view component by default', () => {
      renderComponent();

      expect(screen.getByTestId('location-card-view')).toBeInTheDocument();
      expect(screen.getByText('Location View Component')).toBeInTheDocument();
    });

    test('does not render the edit component by default', () => {
      renderComponent();

      expect(
        screen.queryByTestId('location-card-edit'),
      ).not.toBeInTheDocument();
    });

    test('renders and matches snapshot', () => {
      const { container } = renderComponent();
      expect(container).toMatchSnapshot();
    });
  });

  describe('Props Handling', () => {
    test('passes showActions prop to view component (default true)', () => {
      renderComponent();

      expect(screen.getByTestId('edit-button')).toBeInTheDocument();
    });

    test('passes showActions=true prop to view component', () => {
      renderComponent({ showActions: true });

      expect(screen.getByTestId('edit-button')).toBeInTheDocument();
    });

    test('passes showActions=false prop to view component', () => {
      renderComponent({ showActions: false });

      expect(screen.queryByTestId('edit-button')).not.toBeInTheDocument();
    });

    test('accepts showActions prop without crashing', () => {
      expect(() => {
        renderComponent({ showActions: true });
      }).not.toThrow();

      expect(() => {
        renderComponent({ showActions: false });
      }).not.toThrow();
    });
  });

  describe('Mode Switching - VIEW to EDIT', () => {
    test('switches to edit mode when edit button is clicked', () => {
      renderComponent();

      // Initially in view mode
      expect(screen.getByTestId('location-card-view')).toBeInTheDocument();
      expect(
        screen.queryByTestId('location-card-edit'),
      ).not.toBeInTheDocument();

      // Click edit button
      fireEvent.click(screen.getByTestId('edit-button'));

      // Now in edit mode
      expect(
        screen.queryByTestId('location-card-view'),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('location-card-edit')).toBeInTheDocument();
    });

    test('renders edit component with cancel and save buttons', () => {
      renderComponent();

      fireEvent.click(screen.getByTestId('edit-button'));

      expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
      expect(screen.getByTestId('save-button')).toBeInTheDocument();
    });

    test('dispatches setLocationMode action when entering edit mode', () => {
      const { dispatchSpy } = renderComponent();

      fireEvent.click(screen.getByTestId('edit-button'));

      expect(dispatchSpy).toHaveBeenCalledWith(
        setLocationMode(LocationCardMode.EDIT),
      );
    });
  });

  describe('Mode Switching - EDIT to VIEW via Cancel', () => {
    test('switches back to view mode when cancel is clicked', () => {
      renderComponent();

      // Switch to edit mode
      fireEvent.click(screen.getByTestId('edit-button'));
      expect(screen.getByTestId('location-card-edit')).toBeInTheDocument();

      // Click cancel
      fireEvent.click(screen.getByTestId('cancel-button'));

      // Back to view mode
      expect(screen.getByTestId('location-card-view')).toBeInTheDocument();
      expect(
        screen.queryByTestId('location-card-edit'),
      ).not.toBeInTheDocument();
    });

    test('preserves showActions prop after cancel', () => {
      renderComponent({ showActions: true });

      // Switch to edit mode and back
      fireEvent.click(screen.getByTestId('edit-button'));
      fireEvent.click(screen.getByTestId('cancel-button'));

      // Edit button should still be visible
      expect(screen.getByTestId('edit-button')).toBeInTheDocument();
    });
  });

  describe('Mode Switching - EDIT to VIEW via Save', () => {
    test('switches back to view mode when save is clicked', () => {
      renderComponent();

      // Switch to edit mode
      fireEvent.click(screen.getByTestId('edit-button'));
      expect(screen.getByTestId('location-card-edit')).toBeInTheDocument();

      // Click save
      fireEvent.click(screen.getByTestId('save-button'));

      // Back to view mode
      expect(screen.getByTestId('location-card-view')).toBeInTheDocument();
      expect(
        screen.queryByTestId('location-card-edit'),
      ).not.toBeInTheDocument();
    });

    test('preserves showActions prop after save', () => {
      renderComponent({ showActions: true });

      // Switch to edit mode and save
      fireEvent.click(screen.getByTestId('edit-button'));
      fireEvent.click(screen.getByTestId('save-button'));

      // Edit button should still be visible
      expect(screen.getByTestId('edit-button')).toBeInTheDocument();
    });
  });

  describe('Component Lifecycle', () => {
    test('handles showActions prop change on rerender', () => {
      const store = createMockStore();
      const { rerender } = render(
        <Provider store={store}>
          <LocationCard showActions />
        </Provider>,
      );

      expect(screen.getByTestId('edit-button')).toBeInTheDocument();

      rerender(
        <Provider store={store}>
          <LocationCard showActions={false} />
        </Provider>,
      );

      expect(screen.queryByTestId('edit-button')).not.toBeInTheDocument();
    });

    test('handles component unmounting without errors', () => {
      const { unmount } = renderComponent();

      expect(() => {
        unmount();
      }).not.toThrow();
    });

    test('handles unmounting from edit mode without errors', () => {
      const { unmount } = renderComponent();

      fireEvent.click(screen.getByTestId('edit-button'));
      expect(screen.getByTestId('location-card-edit')).toBeInTheDocument();

      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });

  describe('Component Structure', () => {
    test('renders correct DOM structure in view mode', () => {
      const { container } = renderComponent();

      // Should have content
      expect(container.firstChild).toBeTruthy();

      // Should render the view component
      expect(screen.getByTestId('location-card-view')).toBeInTheDocument();
    });

    test('renders correct DOM structure in edit mode', () => {
      const { container } = renderComponent();

      fireEvent.click(screen.getByTestId('edit-button'));

      // Should have content
      expect(container.firstChild).toBeTruthy();

      // Should render the edit component
      expect(screen.getByTestId('location-card-edit')).toBeInTheDocument();
    });

    test('renders view component with default showActions', () => {
      renderComponent();

      expect(screen.getByText('Location View Component')).toBeInTheDocument();
      expect(screen.getByTestId('edit-button')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles undefined showActions prop', () => {
      expect(() => {
        renderComponent({ showActions: undefined });
      }).not.toThrow();
    });

    test('handles null showActions prop', () => {
      expect(() => {
        renderComponent({ showActions: null });
      }).not.toThrow();
    });

    test('handles multiple mounts and unmounts', () => {
      const { unmount: unmount1 } = renderComponent();
      unmount1();

      const { unmount: unmount2 } = renderComponent();
      unmount2();

      const { unmount: unmount3 } = renderComponent();
      unmount3();

      // Should handle multiple mount/unmount cycles
      expect(true).toBe(true);
    });

    test('renders without errors when no props provided', () => {
      renderComponent();

      expect(screen.getByTestId('location-card-view')).toBeInTheDocument();
    });

    test('handles rapid mode switching', () => {
      renderComponent();

      // Rapid switching
      fireEvent.click(screen.getByTestId('edit-button'));
      fireEvent.click(screen.getByTestId('cancel-button'));
      fireEvent.click(screen.getByTestId('edit-button'));
      fireEvent.click(screen.getByTestId('save-button'));
      fireEvent.click(screen.getByTestId('edit-button'));

      // Should end in edit mode
      expect(screen.getByTestId('location-card-edit')).toBeInTheDocument();
    });
  });

  describe('Component Behavior', () => {
    test('maintains component state across rerenders in view mode', () => {
      const store = createMockStore();
      const { rerender } = render(
        <Provider store={store}>
          <LocationCard />
        </Provider>,
      );

      expect(screen.getByTestId('location-card-view')).toBeInTheDocument();

      rerender(
        <Provider store={store}>
          <LocationCard />
        </Provider>,
      );

      expect(screen.getByTestId('location-card-view')).toBeInTheDocument();
    });

    test('maintains edit mode across rerenders', () => {
      const store = createMockStore();
      const { rerender } = render(
        <Provider store={store}>
          <LocationCard />
        </Provider>,
      );

      fireEvent.click(screen.getByTestId('edit-button'));
      expect(screen.getByTestId('location-card-edit')).toBeInTheDocument();

      rerender(
        <Provider store={store}>
          <LocationCard />
        </Provider>,
      );

      expect(screen.getByTestId('location-card-edit')).toBeInTheDocument();
    });

    test('component handles rapid prop changes', () => {
      const store = createMockStore();
      const { rerender } = render(
        <Provider store={store}>
          <LocationCard showActions />
        </Provider>,
      );

      rerender(
        <Provider store={store}>
          <LocationCard showActions={false} />
        </Provider>,
      );
      rerender(
        <Provider store={store}>
          <LocationCard showActions />
        </Provider>,
      );
      rerender(
        <Provider store={store}>
          <LocationCard showActions={false} />
        </Provider>,
      );

      // Should end up with showActions=false
      expect(screen.queryByTestId('edit-button')).not.toBeInTheDocument();
    });
  });

  describe('View Mode', () => {
    test('renders view component by default', () => {
      renderComponent();

      expect(screen.getByTestId('location-card-view')).toBeInTheDocument();
    });

    test('shows edit button when showActions is true', () => {
      renderComponent({ showActions: true });

      expect(screen.getByTestId('edit-button')).toBeInTheDocument();
    });

    test('hides edit button when showActions is false', () => {
      renderComponent({ showActions: false });

      expect(screen.queryByTestId('edit-button')).not.toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    test('renders edit component when in edit mode', () => {
      renderComponent();

      fireEvent.click(screen.getByTestId('edit-button'));

      expect(screen.getByTestId('location-card-edit')).toBeInTheDocument();
      expect(screen.getByText('Location Edit Component')).toBeInTheDocument();
    });

    test('edit component has cancel and save buttons', () => {
      renderComponent();

      fireEvent.click(screen.getByTestId('edit-button'));

      expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
      expect(screen.getByTestId('save-button')).toBeInTheDocument();
    });

    test('cannot enter edit mode when showActions is false', () => {
      renderComponent({ showActions: false });

      // No edit button to click
      expect(screen.queryByTestId('edit-button')).not.toBeInTheDocument();

      // Still in view mode
      expect(screen.getByTestId('location-card-view')).toBeInTheDocument();
      expect(
        screen.queryByTestId('location-card-edit'),
      ).not.toBeInTheDocument();
    });

    test('renders edit component when store mode is EDIT', () => {
      const store = createMockStore(LocationCardMode.EDIT);
      render(
        <Provider store={store}>
          <LocationCard />
        </Provider>,
      );

      expect(screen.getByTestId('location-card-edit')).toBeInTheDocument();
      expect(
        screen.queryByTestId('location-card-view'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Complete User Flow', () => {
    test('full edit and save flow', () => {
      renderComponent();

      // Start in view mode
      expect(screen.getByTestId('location-card-view')).toBeInTheDocument();

      // Enter edit mode
      fireEvent.click(screen.getByTestId('edit-button'));
      expect(screen.getByTestId('location-card-edit')).toBeInTheDocument();

      // Save changes
      fireEvent.click(screen.getByTestId('save-button'));

      // Back to view mode
      expect(screen.getByTestId('location-card-view')).toBeInTheDocument();
    });

    test('full edit and cancel flow', () => {
      renderComponent();

      // Start in view mode
      expect(screen.getByTestId('location-card-view')).toBeInTheDocument();

      // Enter edit mode
      fireEvent.click(screen.getByTestId('edit-button'));
      expect(screen.getByTestId('location-card-edit')).toBeInTheDocument();

      // Cancel changes
      fireEvent.click(screen.getByTestId('cancel-button'));

      // Back to view mode
      expect(screen.getByTestId('location-card-view')).toBeInTheDocument();
    });

    test('multiple edit cycles', () => {
      renderComponent();

      // First cycle - save
      fireEvent.click(screen.getByTestId('edit-button'));
      fireEvent.click(screen.getByTestId('save-button'));
      expect(screen.getByTestId('location-card-view')).toBeInTheDocument();

      // Second cycle - cancel
      fireEvent.click(screen.getByTestId('edit-button'));
      fireEvent.click(screen.getByTestId('cancel-button'));
      expect(screen.getByTestId('location-card-view')).toBeInTheDocument();

      // Third cycle - save
      fireEvent.click(screen.getByTestId('edit-button'));
      fireEvent.click(screen.getByTestId('save-button'));
      expect(screen.getByTestId('location-card-view')).toBeInTheDocument();
    });
  });

  describe('Redux Integration', () => {
    test('dispatches cancelLocationEdit when cancel is clicked', () => {
      const { dispatchSpy } = renderComponent();

      fireEvent.click(screen.getByTestId('edit-button'));
      fireEvent.click(screen.getByTestId('cancel-button'));

      // Check that cancelLocationEdit was dispatched
      const dispatchedActions = dispatchSpy.mock.calls.map((call) => call[0]);
      expect(dispatchedActions).toContainEqual(
        expect.objectContaining({ type: 'location/cancelLocationEdit' }),
      );
    });

    test('dispatches saveLocationSettings when save is clicked', () => {
      const { dispatchSpy } = renderComponent();

      fireEvent.click(screen.getByTestId('edit-button'));
      fireEvent.click(screen.getByTestId('save-button'));

      // Check that saveLocationSettings was dispatched
      const dispatchedActions = dispatchSpy.mock.calls.map((call) => call[0]);
      expect(dispatchedActions).toContainEqual(
        expect.objectContaining({ type: 'location/saveLocationSettings' }),
      );
    });
  });
});

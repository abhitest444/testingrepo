// @ts-nocheck
/**
 * BreaksCard Component Tests
 *
 * Tests for the BreaksCard container component that manages
 * break rules display using Redux.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import BreaksCard from 'src/js/widgets/userSettings/components/cards/BreaksCard';
import breaksReducer, {
  BreaksCardMode,
} from 'src/js/widgets/userSettings/store/slices/breaksSlice';

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

// Mock the child components
jest.mock(
  'src/js/widgets/userSettings/components/cards/BreaksCard/components/BreaksCardView',
  () =>
    function MockBreaksCardView() {
      return (
        <div data-testid="breaks-card-view">
          <div>Breaks View Component</div>
        </div>
      );
    },
);

describe('BreaksCard', () => {
  let store;

  const createMockStore = (initialMode = BreaksCardMode.VIEW) =>
    configureStore({
      reducer: {
        breaks: breaksReducer,
      },
      preloadedState: {
        breaks: {
          mode: initialMode,
          breaks: [],
          draftBreaks: [],
          loading: false,
          error: null,
        },
      },
    });

  const renderComponent = (mode = BreaksCardMode.VIEW) => {
    store = createMockStore(mode);
    return render(
      <Provider store={store}>
        <BreaksCard />
      </Provider>,
    );
  };

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

      expect(screen.getByTestId('breaks-card-view')).toBeInTheDocument();
      expect(screen.getByText('Breaks View Component')).toBeInTheDocument();
    });

    test('renders and matches snapshot', () => {
      const { container } = renderComponent();
      expect(container).toMatchSnapshot();
    });
  });

  describe('Component Structure', () => {
    test('renders correct DOM structure', () => {
      const { container } = renderComponent();

      // Should have content
      expect(container.firstChild).toBeTruthy();

      // Should render the view component
      expect(screen.getByTestId('breaks-card-view')).toBeInTheDocument();
    });

    test('renders children through Redux provider', () => {
      renderComponent();

      // If the view component renders, Redux is working
      expect(screen.getByText('Breaks View Component')).toBeInTheDocument();
    });
  });

  describe('Component Lifecycle', () => {
    test('handles component unmounting without errors', () => {
      const { unmount } = renderComponent();

      expect(() => {
        unmount();
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

    test('should log when component is viewed', () => {
      renderComponent();

      expect(mockLoggerInfo).toHaveBeenCalledWith(
        'Component=BreaksCard Event=Breaks user settings viewed',
      );
    });
  });

  describe('Redux Integration', () => {
    test('uses Redux store for state management', () => {
      renderComponent(BreaksCardMode.VIEW);

      expect(screen.getByTestId('breaks-card-view')).toBeInTheDocument();
    });
  });

  // Fast follow tests for EDIT mode (commented out for now)
  // describe('Edit Mode', () => {
  //   test('renders edit component when mode is EDIT', () => {
  //     renderComponent(BreaksCardMode.EDIT);
  //
  //     expect(screen.getByTestId('breaks-card-edit')).toBeInTheDocument();
  //     expect(screen.queryByTestId('breaks-card-view')).not.toBeInTheDocument();
  //   });
  // });
});

// @ts-nocheck
/**
 * Tests for OvertimeCard container component
 *
 * Tests that OvertimeCard renders OvertimeCardView in VIEW mode
 * and OvertimeCardEdit in EDIT mode based on Redux state.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import OvertimeCard from 'src/js/widgets/userSettings/components/cards/OvertimeCard/OvertimeCard';
import overtimeReducer from 'src/js/widgets/userSettings/store/slices/overtimeSlice';
import settingsContextReducer from 'src/js/widgets/userSettings/store/slices/settingsContextSlice';
import { OvertimeCardMode } from 'src/js/widgets/userSettings/components/cards/OvertimeCard/types/OvertimeCard.types';

const mockOvertimeCardView = jest.fn();

jest.mock('@payroll/quicksand', () => ({
  useSandbox: () => ({ logger: { info: jest.fn(), error: jest.fn() } }),
  useIntl: () => ({ formatMessage: jest.fn(({ id }) => id) }),
  useTracking: () => jest.fn(),
}));

jest.mock(
  'src/js/widgets/userSettings/components/cards/OvertimeCard/components/OvertimeCardView',
  () =>
    function MockOvertimeCardView(props: any) {
      mockOvertimeCardView(props);
      return <div data-testid="overtime-card-view">Overtime View</div>;
    },
);

jest.mock(
  'src/js/widgets/userSettings/components/cards/OvertimeCard/components/OvertimeCardEdit',
  () =>
    function MockOvertimeCardEdit() {
      return <div data-testid="overtime-card-edit">Overtime Edit</div>;
    },
);

const createStore = (mode = OvertimeCardMode.VIEW) =>
  configureStore({
    reducer: {
      overtime: overtimeReducer,
      settingsContext: settingsContextReducer,
    },
    preloadedState: {
      overtime: {
        mode,
        policy: null,
        loading: false,
        error: null,
        overtimeRuleType: '',
        draftRules: [],
      },
      settingsContext: { settingsFor: null },
    },
  });

const renderWithStore = (mode = OvertimeCardMode.VIEW) => {
  const store = createStore(mode);
  return {
    store,
    ...render(
      <Provider store={store}>
        <OvertimeCard />
      </Provider>,
    ),
  };
};

describe('OvertimeCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('VIEW mode', () => {
    it('renders OvertimeCardView in VIEW mode', () => {
      renderWithStore(OvertimeCardMode.VIEW);
      expect(screen.getByTestId('overtime-card-view')).toBeInTheDocument();
    });

    it('does not render OvertimeCardEdit in VIEW mode', () => {
      renderWithStore(OvertimeCardMode.VIEW);
      expect(
        screen.queryByTestId('overtime-card-edit'),
      ).not.toBeInTheDocument();
    });

    it('passes overtime badge visibility date to OvertimeCardView', () => {
      render(
        <Provider store={createStore(OvertimeCardMode.VIEW)}>
          <OvertimeCard overtimeBadgeVisibilityEndDate="2099-12-31" />
        </Provider>,
      );

      expect(mockOvertimeCardView).toHaveBeenCalledWith(
        expect.objectContaining({
          overtimeBadgeVisibilityEndDate: '2099-12-31',
        }),
      );
    });
  });

  describe('EDIT mode', () => {
    it('renders OvertimeCardEdit in EDIT mode', () => {
      renderWithStore(OvertimeCardMode.EDIT);
      expect(screen.getByTestId('overtime-card-edit')).toBeInTheDocument();
    });

    it('does not render OvertimeCardView in EDIT mode', () => {
      renderWithStore(OvertimeCardMode.EDIT);
      expect(
        screen.queryByTestId('overtime-card-view'),
      ).not.toBeInTheDocument();
    });
  });

  describe('mode transitions', () => {
    it('switches from VIEW to EDIT when store mode changes', () => {
      const { rerender } = renderWithStore(OvertimeCardMode.VIEW);
      expect(screen.getByTestId('overtime-card-view')).toBeInTheDocument();

      const editStore = createStore(OvertimeCardMode.EDIT);
      rerender(
        <Provider store={editStore}>
          <OvertimeCard />
        </Provider>,
      );

      expect(screen.getByTestId('overtime-card-edit')).toBeInTheDocument();
      expect(
        screen.queryByTestId('overtime-card-view'),
      ).not.toBeInTheDocument();
    });

    it('renders without crashing in both modes', () => {
      expect(() => renderWithStore(OvertimeCardMode.VIEW)).not.toThrow();
      expect(() => renderWithStore(OvertimeCardMode.EDIT)).not.toThrow();
    });
  });

  describe('component lifecycle', () => {
    it('unmounts without errors in VIEW mode', () => {
      const { unmount } = renderWithStore(OvertimeCardMode.VIEW);
      expect(() => unmount()).not.toThrow();
    });

    it('unmounts without errors in EDIT mode', () => {
      const { unmount } = renderWithStore(OvertimeCardMode.EDIT);
      expect(() => unmount()).not.toThrow();
    });
  });
});

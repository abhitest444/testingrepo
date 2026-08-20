import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { mockFormatMessage } from 'test/unit/testUtils';
import { WeeklyTimeEntrySettingsPanel } from '../../../../../src/js/widgets/weeklyTimeEntry/components/weeklyTimeEntrySettingsPanel/WeeklyTimeEntrySettingsPanel';

// Mock useIntl from Quicksand
jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: mockFormatMessage,
  }),
  useTracking: () => jest.fn(),
  useSandbox: () => ({
    logger: {
      error: jest.fn(),
      info: jest.fn(),
    },
  }),
}));

// Mock styled-components
jest.mock('styled-components', () => {
  const createStyledComponent = (Component: any) => {
    const styledComponent = (strings: TemplateStringsArray, ...args: any[]) =>
      React.forwardRef<HTMLElement>((props, ref) =>
        React.createElement(Component, { ...props, ref }),
      );
    styledComponent.withConfig = () => styledComponent;
    return styledComponent;
  };

  const styled = new Proxy(
    (Component: any) => createStyledComponent(Component),
    {
      get: (target, prop) => {
        if (prop === '__esModule') return true;
        if (prop === 'default') return target;
        return createStyledComponent(prop);
      },
    },
  );

  return {
    __esModule: true,
    default: styled,
    createGlobalStyle: () => () => null,
    css: () => '',
    keyframes: () => '',
    ThemeProvider: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
  };
});

// Mock Popover components
jest.mock('@ids-ts/popover', () => ({
  Popover: ({ children, open, onClose }: any) =>
    open ? (
      <div data-testid="popover" onClick={onClose}>
        {children}
      </div>
    ) : null,
  PopoverHeader: ({ title }: any) => (
    <div data-testid="popover-header">{title}</div>
  ),
  PopoverContent: ({ children }: any) => (
    <div data-testid="popover-content">{children}</div>
  ),
  PopoverActions: ({ children }: any) => (
    <div data-testid="popover-actions">{children}</div>
  ),
}));

// Mock Button component
jest.mock('@ids-ts/button', () => ({
  __esModule: true,
  default: ({
    children,
    onClick,
    isLoading,
    disabled,
    loadingComponent,
  }: any) => (
    <button data-testid="save-button" onClick={onClick} disabled={disabled}>
      {isLoading ? loadingComponent : children}
    </button>
  ),
}));

// Mock Activity component
jest.mock('@ids-ts/loader', () => ({
  Activity: ({ shape, size }: any) => (
    <div data-testid="activity-loader" data-shape={shape} data-size={size}>
      Loading...
    </div>
  ),
}));

// Mock PageMessage component
jest.mock('@ids-ts/page-message', () => ({
  __esModule: true,
  default: ({ children, type }: any) => (
    <div data-testid="page-message" data-type={type}>
      {children}
    </div>
  ),
}));

// Mock useUxPreferences hook
const mockSetPreference = jest.fn();
jest.mock('../../../../../src/js/service/utils/useUXPreferences', () => ({
  useUxPreferences: () => ({
    setPreference: mockSetPreference,
  }),
  UxPreferenceKey: {
    HIDE_WEEKDAYS_UX_PREFERENCE: 'HIDE_WEEKDAYS_UX_PREFERENCE',
  },
}));

// Mock Redux store and selectors
jest.mock(
  '../../../../../src/js/widgets/weeklyTimeEntry/store/selectors',
  () => ({
    selectCompanySettings: jest.fn(),
    selectHideWeekdays: jest.fn(),
    selectTimeEntrySettingsLoading: jest.fn(),
    selectTimeEntrySettingsError: jest.fn(),
    selectSettingsError: jest.fn(),
  }),
);

// Mock Redux store
const mockDispatch = jest.fn();
jest.mock('../../../../../src/js/widgets/weeklyTimeEntry/store', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: jest.fn(),
}));

// Mock WeeklyTimeEntrySettingsForm component
jest.mock(
  '../../../../../src/js/widgets/weeklyTimeEntry/components/weeklyTimeEntrySettingsPanel/WeeklyTimeEntrySettingsForm',
  () => ({
    WeeklyTimeEntrySettingsForm: ({
      hideWeekdays,
      trackingPoints,
      settingsState,
      updateWeekday,
    }: any) => (
      <div data-testid="settings-form">
        <div data-testid="hide-weekdays">{JSON.stringify(hideWeekdays)}</div>
        <div data-testid="tracking-points">
          {JSON.stringify(trackingPoints)}
        </div>
        <div data-testid="settings-state">{JSON.stringify(settingsState)}</div>
        <button
          data-testid="update-weekday-button"
          onClick={() => updateWeekday('isMondayEnabled', true)}
        >
          Update Monday
        </button>
      </div>
    ),
  }),
);

// Mock useWeeklyTimeEntrySettings hook
const mockUpdateWeekday = jest.fn();
const mockGetFormData = {
  hideWeekdays: {
    isSundayHidden: false,
    isMondayHidden: false,
    isTuesdayHidden: false,
    isWednesdayHidden: false,
    isThursdayHidden: false,
    isFridayHidden: false,
    isSaturdayHidden: false,
  },
};
const mockIsDirty = false;

jest.mock(
  '../../../../../src/js/widgets/weeklyTimeEntry/hooks/useWeeklyTimeEntrySettings',
  () => ({
    useWeeklyTimeEntrySettings: () => ({
      settingsState: {
        weekdays: {
          isSundayEnabled: true,
          isMondayEnabled: true,
          isTuesdayEnabled: true,
          isWednesdayEnabled: true,
          isThursdayEnabled: true,
          isFridayEnabled: true,
          isSaturdayEnabled: true,
        },
      },
      updateWeekday: mockUpdateWeekday,
      getFormData: mockGetFormData,
      isDirty: mockIsDirty,
    }),
  }),
);

// Mock helper functions
jest.mock(
  '../../../../../src/js/widgets/weeklyTimeEntry/utils/helpers',
  () => ({
    getVisibleDaysFromPreferences: jest.fn(() => [0, 1, 2, 3, 4, 5, 6]),
    hasAtLeastOneWeekdaySelected: jest.fn(() => true),
  }),
);

// Mock Redux actions
jest.mock(
  '../../../../../src/js/widgets/weeklyTimeEntry/store/timeEntrySettingsSlice',
  () => ({
    setTimeEntrySettingsLoading: jest.fn((payload) => ({
      type: 'setLoading',
      payload,
    })),
    setTimeEntrySettingsError: jest.fn((payload) => ({
      type: 'setTimeEntrySettingsError',
      payload,
    })),
    setUxPreferences: jest.fn((payload) => ({
      type: 'setUxPreferences',
      payload,
    })),
    setVisibleDays: jest.fn((payload) => ({ type: 'setVisibleDays', payload })),
    resetPanelValues: jest.fn(() => ({ type: 'resetPanelValues' })),
  }),
);

jest.mock(
  '../../../../../src/js/widgets/weeklyTimeEntry/store/validationSlice',
  () => ({
    setSettingsError: jest.fn((payload) => ({
      type: 'setSettingsError',
      payload,
    })),
    clearSettingsError: jest.fn(() => ({ type: 'clearSettingsError' })),
  }),
);

describe('WeeklyTimeEntrySettingsPanel', () => {
  const defaultProps = {
    open: true,
    setOpen: jest.fn(),
    onSaveSuccess: jest.fn(),
    targetElement: document.createElement('div'),
  };

  const createMockStore = () =>
    configureStore({
      reducer: {
        timeEntrySettings: (state = {}) => state,
        validation: (state = {}) => state,
      },
    });

  beforeEach(() => {
    jest.clearAllMocks();
    mockFormatMessage.mockImplementation(({ id }) => id);
    mockSetPreference.mockResolvedValue(undefined);

    // Mock useAppSelector to return appropriate values
    const {
      useAppSelector,
    } = require('../../../../../src/js/widgets/weeklyTimeEntry/store');
    useAppSelector.mockImplementation((selector: any) => {
      if (selector.name === 'selectCompanySettings')
        return { firstDayOfWeek: 0 };
      if (selector.name === 'selectHideWeekdays')
        return {
          isSundayHidden: false,
          isMondayHidden: false,
          isTuesdayHidden: false,
          isWednesdayHidden: false,
          isThursdayHidden: false,
          isFridayHidden: false,
          isSaturdayHidden: false,
        };
      if (selector.name === 'selectTimeEntrySettingsLoading') return false;
      if (selector.name === 'selectTimeEntrySettingsError') return null;
      if (selector.name === 'selectSettingsError') return null;
      return null;
    });
  });

  const renderComponent = (props = {}) => {
    const store = createMockStore();
    return render(
      <Provider store={store}>
        <WeeklyTimeEntrySettingsPanel {...defaultProps} {...props} />
      </Provider>,
    );
  };

  describe('Rendering', () => {
    it('renders without crashing when open', () => {
      renderComponent();
      expect(screen.getByTestId('popover')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      renderComponent({ open: false });
      expect(screen.queryByTestId('popover')).not.toBeInTheDocument();
    });

    it('renders the correct header title', () => {
      renderComponent();
      expect(screen.getByTestId('popover-header')).toHaveTextContent(
        'weekly.time.entry.settings.popover.title',
      );
    });

    it('renders the settings form', () => {
      renderComponent();
      expect(screen.getByTestId('settings-form')).toBeInTheDocument();
    });

    it('renders the save button', () => {
      renderComponent();
      expect(screen.getByTestId('save-button')).toBeInTheDocument();
    });

    it('renders save button with correct text', () => {
      renderComponent();
      expect(screen.getByTestId('save-button')).toHaveTextContent(
        'weekly.time.entry.settings.popover.button.label',
      );
    });
  });

  describe('Save Button States', () => {
    it('disables save button when loading', () => {
      // Mock loading state
      const {
        useAppSelector,
      } = require('../../../../../src/js/widgets/weeklyTimeEntry/store');
      useAppSelector.mockImplementation((selector: any) => {
        if (selector.name === 'selectTimeEntrySettingsLoading') return true;
        return false;
      });

      renderComponent();
      expect(screen.getByTestId('save-button')).toBeDisabled();
    });

    it('disables save button when not dirty', () => {
      // Mock isDirty to false
      jest
        .spyOn(
          require('../../../../../src/js/widgets/weeklyTimeEntry/hooks/useWeeklyTimeEntrySettings'),
          'useWeeklyTimeEntrySettings',
        )
        .mockReturnValue({
          settingsState: { weekdays: {} },
          updateWeekday: mockUpdateWeekday,
          getFormData: mockGetFormData,
          isDirty: false,
        });

      renderComponent();
      expect(screen.getByTestId('save-button')).toBeDisabled();
    });

    it('enables save button when dirty and not loading', () => {
      // Mock isDirty to true and loading to false
      jest
        .spyOn(
          require('../../../../../src/js/widgets/weeklyTimeEntry/hooks/useWeeklyTimeEntrySettings'),
          'useWeeklyTimeEntrySettings',
        )
        .mockReturnValue({
          settingsState: { weekdays: {} },
          updateWeekday: mockUpdateWeekday,
          getFormData: mockGetFormData,
          isDirty: true,
        });

      renderComponent();
      expect(screen.getByTestId('save-button')).not.toBeDisabled();
    });
  });

  describe('Save Functionality', () => {
    it('calls setPreference when save is clicked', async () => {
      // Mock isDirty to true
      jest
        .spyOn(
          require('../../../../../src/js/widgets/weeklyTimeEntry/hooks/useWeeklyTimeEntrySettings'),
          'useWeeklyTimeEntrySettings',
        )
        .mockReturnValue({
          settingsState: { weekdays: {} },
          updateWeekday: mockUpdateWeekday,
          getFormData: mockGetFormData,
          isDirty: true,
        });

      renderComponent();

      fireEvent.click(screen.getByTestId('save-button'));

      await waitFor(() => {
        expect(mockSetPreference).toHaveBeenCalledWith(
          'HIDE_WEEKDAYS_UX_PREFERENCE',
          mockGetFormData.hideWeekdays,
        );
      });
    });

    it('dispatches setTimeEntrySettingsLoading when save starts', async () => {
      // Mock isDirty to true
      jest
        .spyOn(
          require('../../../../../src/js/widgets/weeklyTimeEntry/hooks/useWeeklyTimeEntrySettings'),
          'useWeeklyTimeEntrySettings',
        )
        .mockReturnValue({
          settingsState: { weekdays: {} },
          updateWeekday: mockUpdateWeekday,
          getFormData: mockGetFormData,
          isDirty: true,
        });

      renderComponent();

      fireEvent.click(screen.getByTestId('save-button'));

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'setLoading',
            payload: { loading: true },
          }),
        );
      });
    });

    it('dispatches setUxPreferences on successful save', async () => {
      // Mock hasAtLeastOneWeekdaySelected to return true
      jest
        .spyOn(
          require('../../../../../src/js/widgets/weeklyTimeEntry/utils/helpers'),
          'hasAtLeastOneWeekdaySelected',
        )
        .mockReturnValue(true);

      // Mock isDirty to true
      jest
        .spyOn(
          require('../../../../../src/js/widgets/weeklyTimeEntry/hooks/useWeeklyTimeEntrySettings'),
          'useWeeklyTimeEntrySettings',
        )
        .mockReturnValue({
          settingsState: { weekdays: {} },
          updateWeekday: mockUpdateWeekday,
          getFormData: mockGetFormData,
          isDirty: true,
        });

      renderComponent();

      fireEvent.click(screen.getByTestId('save-button'));

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'setUxPreferences',
            payload: { hideWeekdays: mockGetFormData.hideWeekdays },
          }),
        );
      });
    });

    it('calls onSaveSuccess callback on successful save', async () => {
      const onSaveSuccess = jest.fn();

      // Mock hasAtLeastOneWeekdaySelected to return true
      jest
        .spyOn(
          require('../../../../../src/js/widgets/weeklyTimeEntry/utils/helpers'),
          'hasAtLeastOneWeekdaySelected',
        )
        .mockReturnValue(true);

      // Mock isDirty to true
      jest
        .spyOn(
          require('../../../../../src/js/widgets/weeklyTimeEntry/hooks/useWeeklyTimeEntrySettings'),
          'useWeeklyTimeEntrySettings',
        )
        .mockReturnValue({
          settingsState: { weekdays: {} },
          updateWeekday: mockUpdateWeekday,
          getFormData: mockGetFormData,
          isDirty: true,
        });

      renderComponent({ onSaveSuccess });

      fireEvent.click(screen.getByTestId('save-button'));

      await waitFor(() => {
        expect(onSaveSuccess).toHaveBeenCalled();
      });
    });

    it('closes panel on successful save', async () => {
      const setOpen = jest.fn();

      // Mock hasAtLeastOneWeekdaySelected to return true
      jest
        .spyOn(
          require('../../../../../src/js/widgets/weeklyTimeEntry/utils/helpers'),
          'hasAtLeastOneWeekdaySelected',
        )
        .mockReturnValue(true);

      // Mock isDirty to true
      jest
        .spyOn(
          require('../../../../../src/js/widgets/weeklyTimeEntry/hooks/useWeeklyTimeEntrySettings'),
          'useWeeklyTimeEntrySettings',
        )
        .mockReturnValue({
          settingsState: { weekdays: {} },
          updateWeekday: mockUpdateWeekday,
          getFormData: mockGetFormData,
          isDirty: true,
        });

      renderComponent({ setOpen });

      fireEvent.click(screen.getByTestId('save-button'));

      await waitFor(() => {
        expect(setOpen).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('Error Handling', () => {
    it('dispatches settings error when no weekdays are selected', async () => {
      // Mock hasAtLeastOneWeekdaySelected to return false
      jest
        .spyOn(
          require('../../../../../src/js/widgets/weeklyTimeEntry/utils/helpers'),
          'hasAtLeastOneWeekdaySelected',
        )
        .mockReturnValue(false);

      // Mock isDirty to true
      jest
        .spyOn(
          require('../../../../../src/js/widgets/weeklyTimeEntry/hooks/useWeeklyTimeEntrySettings'),
          'useWeeklyTimeEntrySettings',
        )
        .mockReturnValue({
          settingsState: { weekdays: {} },
          updateWeekday: mockUpdateWeekday,
          getFormData: mockGetFormData,
          isDirty: true,
        });

      renderComponent();

      fireEvent.click(screen.getByTestId('save-button'));

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'setTimeEntrySettingsError',
            payload: 'weekly.time.entry.settings.at.least.one.required',
          }),
        );
      });
    });

    it('handles setPreference error', async () => {
      const error = new Error('Save failed');
      mockSetPreference.mockRejectedValue(error);

      // Mock hasAtLeastOneWeekdaySelected to return true
      jest
        .spyOn(
          require('../../../../../src/js/widgets/weeklyTimeEntry/utils/helpers'),
          'hasAtLeastOneWeekdaySelected',
        )
        .mockReturnValue(true);

      // Mock isDirty to true
      jest
        .spyOn(
          require('../../../../../src/js/widgets/weeklyTimeEntry/hooks/useWeeklyTimeEntrySettings'),
          'useWeeklyTimeEntrySettings',
        )
        .mockReturnValue({
          settingsState: { weekdays: {} },
          updateWeekday: mockUpdateWeekday,
          getFormData: mockGetFormData,
          isDirty: true,
        });

      renderComponent();

      fireEvent.click(screen.getByTestId('save-button'));

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'setTimeEntrySettingsError',
            payload: 'settings.general.error',
          }),
        );
      });
    });

    it('dispatches setTimeEntrySettingsLoading false on error', async () => {
      const error = new Error('Save failed');
      mockSetPreference.mockRejectedValue(error);

      // Mock hasAtLeastOneWeekdaySelected to return true
      jest
        .spyOn(
          require('../../../../../src/js/widgets/weeklyTimeEntry/utils/helpers'),
          'hasAtLeastOneWeekdaySelected',
        )
        .mockReturnValue(true);

      // Mock isDirty to true
      jest
        .spyOn(
          require('../../../../../src/js/widgets/weeklyTimeEntry/hooks/useWeeklyTimeEntrySettings'),
          'useWeeklyTimeEntrySettings',
        )
        .mockReturnValue({
          settingsState: { weekdays: {} },
          updateWeekday: mockUpdateWeekday,
          getFormData: mockGetFormData,
          isDirty: true,
        });

      renderComponent();

      fireEvent.click(screen.getByTestId('save-button'));

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'setLoading',
            payload: { loading: false },
          }),
        );
      });
    });
  });

  describe('Close Functionality', () => {
    it('calls setOpen with false when close is triggered', () => {
      const setOpen = jest.fn();
      renderComponent({ setOpen });

      // Trigger close by clicking on popover
      fireEvent.click(screen.getByTestId('popover'));

      expect(setOpen).toHaveBeenCalledWith(false);
    });

    it('clears settings error when closing', () => {
      const setOpen = jest.fn();
      renderComponent({ setOpen });

      // Trigger close by clicking on popover
      fireEvent.click(screen.getByTestId('popover'));

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'setTimeEntrySettingsError',
          payload: null,
        }),
      );
    });
  });

  describe('Props Integration', () => {
    it('passes correct props to WeeklyTimeEntrySettingsForm', () => {
      renderComponent();

      expect(screen.getByTestId('hide-weekdays')).toBeInTheDocument();
      expect(screen.getByTestId('tracking-points')).toBeInTheDocument();
      expect(screen.getByTestId('settings-state')).toBeInTheDocument();
    });

    it('handles updateWeekday callback correctly', () => {
      renderComponent();

      fireEvent.click(screen.getByTestId('update-weekday-button'));

      expect(mockUpdateWeekday).toHaveBeenCalledWith('isMondayEnabled', true);
    });
  });

  describe('Edge Cases', () => {
    it('handles missing onSaveSuccess prop gracefully', async () => {
      // Mock hasAtLeastOneWeekdaySelected to return true
      jest
        .spyOn(
          require('../../../../../src/js/widgets/weeklyTimeEntry/utils/helpers'),
          'hasAtLeastOneWeekdaySelected',
        )
        .mockReturnValue(true);

      // Mock isDirty to true
      jest
        .spyOn(
          require('../../../../../src/js/widgets/weeklyTimeEntry/hooks/useWeeklyTimeEntrySettings'),
          'useWeeklyTimeEntrySettings',
        )
        .mockReturnValue({
          settingsState: { weekdays: {} },
          updateWeekday: mockUpdateWeekday,
          getFormData: mockGetFormData,
          isDirty: true,
        });

      renderComponent();

      fireEvent.click(screen.getByTestId('save-button'));

      await waitFor(() => {
        expect(mockSetPreference).toHaveBeenCalled();
      });
    });

    it('handles missing targetElement prop gracefully', () => {
      expect(() => renderComponent({ targetElement: null })).not.toThrow();
    });

    it('handles company settings without firstDayOfWeek', async () => {
      // Mock company settings without firstDayOfWeek
      const {
        useAppSelector,
      } = require('../../../../../src/js/widgets/weeklyTimeEntry/store');
      useAppSelector.mockImplementation((selector: any) => {
        if (selector.name === 'selectCompanySettings')
          return { firstDayOfWeek: undefined };
        return false;
      });

      // Mock hasAtLeastOneWeekdaySelected to return true
      jest
        .spyOn(
          require('../../../../../src/js/widgets/weeklyTimeEntry/utils/helpers'),
          'hasAtLeastOneWeekdaySelected',
        )
        .mockReturnValue(true);

      // Mock isDirty to true
      const {
        useWeeklyTimeEntrySettings,
      } = require('../../../../../src/js/widgets/weeklyTimeEntry/hooks/useWeeklyTimeEntrySettings');
      useWeeklyTimeEntrySettings.mockReturnValue({
        settingsState: { weekdays: {} },
        updateWeekday: mockUpdateWeekday,
        getFormData: mockGetFormData,
        isDirty: true,
      });

      renderComponent();

      fireEvent.click(screen.getByTestId('save-button'));

      await waitFor(() => {
        expect(mockSetPreference).toHaveBeenCalled();
      });
    });
  });
});

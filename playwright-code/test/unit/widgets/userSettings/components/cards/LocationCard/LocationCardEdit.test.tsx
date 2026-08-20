// @ts-nocheck
/**
 * LocationCardEdit Component Tests
 *
 * Tests for the LocationCardEdit component that handles
 * editing location tracking settings via Redux.
 *
 * Test Structure (Modular):
 * 1. Setup & Mocks
 * 2. Store Helpers
 * 3. Rendering Tests
 * 4. Initial State Tests
 * 5. Settings Type Selection Tests
 * 6. Location Tracking Options Tests
 * 7. Navigation Tests
 * 8. Action Button Tests
 * 9. Redux Integration Tests
 * 10. Accessibility Tests
 * 11. Edge Cases
 */

import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import LocationCardEdit from 'src/js/widgets/userSettings/components/cards/LocationCard/components/LocationCardEdit';
import locationReducer, {
  updateLocationDraft,
  cancelLocationEdit,
  saveLocationSettings,
} from 'src/js/widgets/userSettings/store/slices/locationSlice';
import settingsContextReducer from 'src/js/widgets/userSettings/store/slices/settingsContextSlice';
import { LocationCardMode } from 'src/js/widgets/userSettings/components/cards/LocationCard/types/LocationCard.types';
import {
  TimeTracking_UserLocationTrackingType,
  TimeTracking_LocationTrackingType,
  TimeTracking_TimeForType,
} from 'src/__generated__/timeTracking/graphql';

// =============================================================================
// SECTION 1: Mock Setup
// =============================================================================

const mockNavigate = jest.fn();
const mockLoggerInfo = jest.fn();
const mockLoggerError = jest.fn();
const mockTrack = jest.fn();

// Mock @payroll/quicksand
jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }) => {
      const messages = {
        'location.title': 'Location',
        'location.error.title': 'Error saving settings',
        'location.tracking.label': 'Location tracking',
        'location.use.company.settings': 'Use company settings',
        'location.manage.company.settings': 'Manage company settings',
        'location.use.custom.rules': 'Use custom rules for this person',
        'location.custom.rules.title': 'Custom location tracking rules',
        'location.tracking.required': 'Required',
        'location.tracking.required.description':
          'Workers must share their location when they clock in or out.',
        'location.tracking.optional': 'Optional',
        'location.tracking.optional.description':
          'Workers can choose whether to share their location.',
        'location.tracking.off': 'Off',
        'location.tracking.off.description':
          "Workers' locations are not tracked.",
        'actions.cancel': 'Cancel',
        'actions.save': 'Save',
        'catch.all.error.content': 'Something went wrong. Please try again.',
        'unsaved.changes.modal.title': 'Unsaved changes',
        'unsaved.changes.modal.message':
          'Do you want to save your changes before leaving?',
        'unsaved.changes.modal.save': 'Save',
        'unsaved.changes.modal.dont.save': "Don't save",
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
  useTracking: () => mockTrack,
}));

// Mock IDS PageMessage
jest.mock('@ids-ts/page-message', () => ({
  __esModule: true,
  default: ({
    children,
    type,
    open,
    title,
    onClose,
    dismissible,
    automationId,
  }) =>
    open ? (
      <div
        data-testid={automationId || 'page-message'}
        data-type={type}
        data-dismissible={String(dismissible !== false)}
      >
        {title && <div data-testid="error-title">{title}</div>}
        <div data-testid="error-content">{children}</div>
        {onClose && dismissible !== false && (
          <button onClick={onClose} data-testid="close-error">
            Close
          </button>
        )}
      </div>
    ) : null,
}));

// Mock IDS Typography
jest.mock('@ids-ts/typography', () => ({
  B2: ({ children }) => <div data-testid="b2">{children}</div>,
  Demi: ({ children }) => <strong>{children}</strong>,
  H6: ({ children }) => <h6 data-testid="h6">{children}</h6>,
}));

// Mock IDS Button
jest.mock('@ids-ts/button', () => ({
  Button: ({
    children,
    onClick,
    priority,
    disabled,
    isLoading,
    loadingComponent,
    'aria-label': ariaLabel,
  }) => (
    <button
      onClick={onClick}
      data-priority={priority}
      disabled={disabled}
      aria-label={ariaLabel}
      data-loading={String(!!isLoading)}
    >
      {isLoading ? loadingComponent : children}
    </button>
  ),
}));

// Mock IDS RadioGroup
jest.mock('@ids-ts/radio', () => ({
  RadioGroup: ({
    options,
    onChange,
    value,
    name,
    'aria-label': ariaLabel,
    disabled,
    vertical,
  }) => (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      data-name={name}
      data-disabled={String(!!disabled)}
      data-vertical={String(!!vertical)}
    >
      {options?.map((option) => (
        <label key={option.value} htmlFor={`radio-${name}-${option.value}`}>
          <input
            id={`radio-${name}-${option.value}`}
            type="radio"
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange(e)}
            disabled={disabled || option.disabled}
            name={name}
          />
          <span>
            {typeof option.label === 'string' ? option.label : option.label}
          </span>
          {option.description && (
            <span data-testid={`description-${option.value}`}>
              {option.description}
            </span>
          )}
        </label>
      ))}
    </div>
  ),
}));

// Mock IDS Loader
jest.mock('@ids-ts/loader', () => ({
  Activity: ({ shape, size }) => (
    <span data-testid="activity-loader" data-shape={shape} data-size={size}>
      Loading...
    </span>
  ),
}));

// Mock ConfirmationModal
jest.mock('src/js/widgets/common/ConfirmationModal', () => ({
  ConfirmationModal: ({
    open,
    setOpen,
    title,
    onYesClick,
    onNoClick,
    yesButtonLabel,
    noButtonLabel,
    children,
  }) =>
    open ? (
      <div data-testid="confirmation-modal" role="dialog">
        <div data-testid="modal-title">{title}</div>
        <div data-testid="modal-content">{children}</div>
        <button
          data-testid="modal-yes-button"
          onClick={onYesClick}
          aria-label={yesButtonLabel}
        >
          {yesButtonLabel}
        </button>
        <button
          data-testid="modal-no-button"
          onClick={onNoClick}
          aria-label={noButtonLabel}
        >
          {noButtonLabel}
        </button>
        <button
          data-testid="modal-close-button"
          onClick={() => setOpen(false)}
          aria-label="close"
        >
          Close
        </button>
      </div>
    ) : null,
}));

// Mock for useManageUnifiedUserSettings hook
const mockSaveLocationMutation = jest.fn();
jest.mock(
  'src/js/service/hooks/userLevelSettings/useManageUnifiedUserSettings',
  () => ({
    useManageUnifiedUserSettings: ({ onSuccess, onError }) => ({
      saveLocationSettings: mockSaveLocationMutation.mockImplementation(
        async (settingsFor, locationTracking) => {
          // Simulate successful save by default
          onSuccess({
            userSettings: {
              locationTracking: {
                value: locationTracking.value,
                effectiveValue: 'OPTIONAL',
                version: 'v2',
              },
            },
          });
        },
      ),
      loading: false,
    }),
  }),
);

// Mock styled components
jest.mock(
  'src/js/widgets/userSettings/components/cards/LocationCard/styles/LocationCardEdit.styles',
  () => {
    const PageMessage = require('@ids-ts/page-message').default;

    return {
      Section: ({ children }) => <div data-testid="section">{children}</div>,
      SectionTitle: ({ children }) => (
        <div data-testid="section-title">{children}</div>
      ),
      Divider: () => <hr data-testid="divider" />,
      ActionButtons: ({ children }) => (
        <div data-testid="action-buttons">{children}</div>
      ),
      CompanySettingsLink: ({ children, href, onClick }) => (
        <a href={href} onClick={onClick} data-testid="company-settings-link">
          {children}
        </a>
      ),
      StyledPageMessage: ({
        children,
        type,
        open,
        title,
        onClose,
        dismissible,
        automationId,
      }) => (
        <PageMessage
          type={type}
          open={open}
          title={title}
          onClose={onClose}
          dismissible={dismissible}
          automationId={automationId}
        >
          {children}
        </PageMessage>
      ),
      CustomRulesSection: ({ children }) => (
        <div data-testid="custom-rules-section">{children}</div>
      ),
      LocationSettingsGroup: ({ children }) => (
        <div data-testid="location-settings-group">{children}</div>
      ),
    };
  },
);

// =============================================================================
// SECTION 2: Store Helpers
// =============================================================================

/**
 * Default location settings for tests
 */
const DEFAULT_LOCATION_SETTINGS = {
  value: TimeTracking_UserLocationTrackingType.UseCompanySetting,
  effectiveValue: TimeTracking_LocationTrackingType.Optional,
  version: 'v1',
};

/**
 * Default settings context for tests
 */
const DEFAULT_SETTINGS_CONTEXT = {
  settingsFor: {
    id: '123',
    timeForType: TimeTracking_TimeForType.Employee,
  },
};

/**
 * Creates a mock Redux store with location state and settings context
 */
const createMockStore = (
  overrides: Partial<{
    mode: LocationCardMode;
    settings: typeof DEFAULT_LOCATION_SETTINGS;
    draftSettings: typeof DEFAULT_LOCATION_SETTINGS;
    loading: boolean;
    error: string | null;
  }> = {},
  settingsContextOverrides: Partial<typeof DEFAULT_SETTINGS_CONTEXT> = {},
) => {
  const locationState = {
    mode: LocationCardMode.EDIT,
    settings: DEFAULT_LOCATION_SETTINGS,
    draftSettings: DEFAULT_LOCATION_SETTINGS,
    loading: false,
    error: null,
    ...overrides,
  };

  const settingsContextState = {
    ...DEFAULT_SETTINGS_CONTEXT,
    ...settingsContextOverrides,
  };

  return configureStore({
    reducer: {
      location: locationReducer,
      settingsContext: settingsContextReducer,
    },
    preloadedState: {
      location: locationState,
      settingsContext: settingsContextState,
    },
  });
};

/**
 * Creates store with custom draft settings for testing different scenarios
 */
const createStoreWithDraft = (
  value: TimeTracking_UserLocationTrackingType,
  effectiveValue: TimeTracking_LocationTrackingType,
) =>
  createMockStore({
    draftSettings: {
      value,
      effectiveValue,
      version: 'v1',
    },
  });

const renderComponent = (store = createMockStore()) => {
  const dispatchSpy = jest.spyOn(store, 'dispatch');

  const result = render(
    <Provider store={store}>
      <LocationCardEdit />
    </Provider>,
  );

  return {
    ...result,
    store,
    dispatchSpy,
    getState: () => store.getState().location,
  };
};

// =============================================================================
// SECTION 3: Test Suite
// =============================================================================

describe('LocationCardEdit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockSaveLocationMutation.mockClear();
    mockTrack.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ---------------------------------------------------------------------------
  // Rendering Tests
  // ---------------------------------------------------------------------------
  describe('Rendering', () => {
    test('renders without crashing', () => {
      expect(() => renderComponent()).not.toThrow();
    });

    test('renders and matches snapshot', () => {
      const componentOutput = renderComponent();
      expect(componentOutput).toMatchSnapshot();
    });

    test('renders the title', () => {
      renderComponent();
      expect(screen.getByText('Location')).toBeInTheDocument();
    });

    test('renders location tracking label', () => {
      renderComponent();
      expect(screen.getByText('Location tracking')).toBeInTheDocument();
    });

    test('renders settings type radio options', () => {
      renderComponent();
      expect(screen.getByText('Use company settings')).toBeInTheDocument();
      expect(
        screen.getByText('Use custom rules for this person'),
      ).toBeInTheDocument();
    });

    test('renders manage company settings link', () => {
      renderComponent();
      expect(screen.getByText('Manage company settings')).toBeInTheDocument();
      expect(screen.getByTestId('company-settings-link')).toBeInTheDocument();
    });

    test('renders custom rules section title', () => {
      renderComponent();
      expect(
        screen.getByText('Custom location tracking rules'),
      ).toBeInTheDocument();
    });

    test('renders location tracking options with descriptions', () => {
      renderComponent();

      expect(screen.getByText('Required')).toBeInTheDocument();
      expect(screen.getByText('Optional')).toBeInTheDocument();
      expect(screen.getByText('Off')).toBeInTheDocument();

      expect(
        screen.getByText(
          'Workers must share their location when they clock in or out.',
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Workers can choose whether to share their location.'),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Workers' locations are not tracked."),
      ).toBeInTheDocument();
    });

    test('renders action buttons', () => {
      renderComponent();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    test('renders divider between sections', () => {
      renderComponent();
      expect(screen.getByTestId('divider')).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Initial State Tests
  // ---------------------------------------------------------------------------
  describe('Initial State', () => {
    test('company settings is selected when using company setting', () => {
      renderComponent();

      const companyRadio = screen.getByDisplayValue('company');
      expect(companyRadio).toBeChecked();
    });

    test('custom settings is selected when not using company setting', () => {
      const store = createStoreWithDraft(
        TimeTracking_UserLocationTrackingType.Optional,
        TimeTracking_LocationTrackingType.Optional,
      );
      renderComponent(store);

      const customRadio = screen.getByDisplayValue('custom');
      expect(customRadio).toBeChecked();
    });

    test('location tracking options are disabled when company settings is selected', () => {
      renderComponent();

      const requiredRadio = screen.getByDisplayValue(
        TimeTracking_LocationTrackingType.Required,
      );
      const optionalRadio = screen.getByDisplayValue(
        TimeTracking_LocationTrackingType.Optional,
      );
      const offRadio = screen.getByDisplayValue(
        TimeTracking_LocationTrackingType.Off,
      );

      expect(requiredRadio).toBeDisabled();
      expect(optionalRadio).toBeDisabled();
      expect(offRadio).toBeDisabled();
    });

    test('location tracking options are enabled when custom settings is selected', () => {
      const store = createStoreWithDraft(
        TimeTracking_UserLocationTrackingType.Optional,
        TimeTracking_LocationTrackingType.Optional,
      );
      renderComponent(store);

      const requiredRadio = screen.getByDisplayValue(
        TimeTracking_LocationTrackingType.Required,
      );
      const optionalRadio = screen.getByDisplayValue(
        TimeTracking_LocationTrackingType.Optional,
      );
      const offRadio = screen.getByDisplayValue(
        TimeTracking_LocationTrackingType.Off,
      );

      expect(requiredRadio).not.toBeDisabled();
      expect(optionalRadio).not.toBeDisabled();
      expect(offRadio).not.toBeDisabled();
    });

    test('displays correct effective value when using company settings', () => {
      renderComponent();

      const optionalRadio = screen.getByDisplayValue(
        TimeTracking_LocationTrackingType.Optional,
      );
      expect(optionalRadio).toBeChecked();
    });
  });

  // ---------------------------------------------------------------------------
  // Settings Type Selection Tests
  // ---------------------------------------------------------------------------
  describe('Settings Type Selection', () => {
    test('dispatches updateLocationDraft when switching to custom settings', () => {
      const { dispatchSpy } = renderComponent();

      const customRadio = screen.getByDisplayValue('custom');
      fireEvent.click(customRadio);

      expect(dispatchSpy).toHaveBeenCalledWith(
        updateLocationDraft({
          value: TimeTracking_UserLocationTrackingType.Optional,
        }),
      );
    });

    test('dispatches updateLocationDraft when switching to company settings', () => {
      const store = createStoreWithDraft(
        TimeTracking_UserLocationTrackingType.Required,
        TimeTracking_LocationTrackingType.Required,
      );
      const { dispatchSpy } = renderComponent(store);

      const companyRadio = screen.getByDisplayValue('company');
      fireEvent.click(companyRadio);

      expect(dispatchSpy).toHaveBeenCalledWith(
        updateLocationDraft({
          value: TimeTracking_UserLocationTrackingType.UseCompanySetting,
        }),
      );
    });

    test('maps REQUIRED effective value to user tracking type when switching to custom', () => {
      const store = createMockStore({
        draftSettings: {
          value: TimeTracking_UserLocationTrackingType.UseCompanySetting,
          effectiveValue: TimeTracking_LocationTrackingType.Required,
          version: 'v1',
        },
      });
      const { dispatchSpy } = renderComponent(store);

      const customRadio = screen.getByDisplayValue('custom');
      fireEvent.click(customRadio);

      expect(dispatchSpy).toHaveBeenCalledWith(
        updateLocationDraft({
          value: TimeTracking_UserLocationTrackingType.Required,
        }),
      );
    });

    test('maps OFF effective value to user tracking type when switching to custom', () => {
      const store = createMockStore({
        draftSettings: {
          value: TimeTracking_UserLocationTrackingType.UseCompanySetting,
          effectiveValue: TimeTracking_LocationTrackingType.Off,
          version: 'v1',
        },
      });
      const { dispatchSpy } = renderComponent(store);

      const customRadio = screen.getByDisplayValue('custom');
      fireEvent.click(customRadio);

      expect(dispatchSpy).toHaveBeenCalledWith(
        updateLocationDraft({
          value: TimeTracking_UserLocationTrackingType.Off,
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Location Tracking Options Tests
  // ---------------------------------------------------------------------------
  describe('Location Tracking Options', () => {
    test('dispatches updateLocationDraft when selecting required tracking', () => {
      const store = createStoreWithDraft(
        TimeTracking_UserLocationTrackingType.Optional,
        TimeTracking_LocationTrackingType.Optional,
      );
      const { dispatchSpy } = renderComponent(store);

      const requiredRadio = screen.getByDisplayValue(
        TimeTracking_LocationTrackingType.Required,
      );
      fireEvent.click(requiredRadio);

      expect(dispatchSpy).toHaveBeenCalledWith(
        updateLocationDraft({
          value: TimeTracking_UserLocationTrackingType.Required,
          effectiveValue: TimeTracking_LocationTrackingType.Required,
        }),
      );
    });

    test('dispatches updateLocationDraft when selecting optional tracking', () => {
      const store = createStoreWithDraft(
        TimeTracking_UserLocationTrackingType.Required,
        TimeTracking_LocationTrackingType.Required,
      );
      const { dispatchSpy } = renderComponent(store);

      const optionalRadio = screen.getByDisplayValue(
        TimeTracking_LocationTrackingType.Optional,
      );
      fireEvent.click(optionalRadio);

      expect(dispatchSpy).toHaveBeenCalledWith(
        updateLocationDraft({
          value: TimeTracking_UserLocationTrackingType.Optional,
          effectiveValue: TimeTracking_LocationTrackingType.Optional,
        }),
      );
    });

    test('dispatches updateLocationDraft when selecting off tracking', () => {
      const store = createStoreWithDraft(
        TimeTracking_UserLocationTrackingType.Optional,
        TimeTracking_LocationTrackingType.Optional,
      );
      const { dispatchSpy } = renderComponent(store);

      const offRadio = screen.getByDisplayValue(
        TimeTracking_LocationTrackingType.Off,
      );
      fireEvent.click(offRadio);

      expect(dispatchSpy).toHaveBeenCalledWith(
        updateLocationDraft({
          value: TimeTracking_UserLocationTrackingType.Off,
          effectiveValue: TimeTracking_LocationTrackingType.Off,
        }),
      );
    });

    test('tracking options show disabled state when company settings is selected', () => {
      renderComponent();

      const requiredRadio = screen.getByDisplayValue(
        TimeTracking_LocationTrackingType.Required,
      );
      const optionalRadio = screen.getByDisplayValue(
        TimeTracking_LocationTrackingType.Optional,
      );
      const offRadio = screen.getByDisplayValue(
        TimeTracking_LocationTrackingType.Off,
      );

      // Verify all tracking options are disabled when using company settings
      expect(requiredRadio).toBeDisabled();
      expect(optionalRadio).toBeDisabled();
      expect(offRadio).toBeDisabled();

      // The radio group should also indicate disabled state
      const trackingGroup = screen.getByRole('radiogroup', {
        name: 'location-tracking-options',
      });
      expect(trackingGroup).toHaveAttribute('data-disabled', 'true');
    });
  });

  // ---------------------------------------------------------------------------
  // Navigation Tests
  // ---------------------------------------------------------------------------
  describe('Company Settings Navigation', () => {
    test('navigates to time settings when link is clicked', () => {
      renderComponent();

      const link = screen.getByTestId('company-settings-link');
      fireEvent.click(link);

      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('settings'),
      );
    });

    test('logs navigation event', () => {
      renderComponent();

      const link = screen.getByTestId('company-settings-link');
      fireEvent.click(link);

      expect(mockLoggerInfo).toHaveBeenCalledWith(
        'Component=LocationCardEdit Event=Navigate to company location settings',
      );
    });

    test('prevents default link behavior', () => {
      renderComponent();

      const link = screen.getByTestId('company-settings-link');
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(clickEvent, 'preventDefault', {
        value: jest.fn(),
      });

      link.dispatchEvent(clickEvent);

      expect(clickEvent.preventDefault).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Cancel Button Tests
  // ---------------------------------------------------------------------------
  describe('Cancel Button', () => {
    test('dispatches cancelLocationEdit when clicked without changes', () => {
      const { dispatchSpy } = renderComponent();

      const cancelButton = screen.getByLabelText('cancel-location');
      fireEvent.click(cancelButton);

      // No changes, so should dispatch directly without showing modal
      expect(dispatchSpy).toHaveBeenCalledWith(cancelLocationEdit());
      expect(
        screen.queryByTestId('confirmation-modal'),
      ).not.toBeInTheDocument();
    });

    test('shows confirmation modal when clicked with unsaved changes', () => {
      // Create store where draft is different from original (has changes)
      const store = createMockStore({
        settings: {
          value: TimeTracking_UserLocationTrackingType.UseCompanySetting,
          effectiveValue: TimeTracking_LocationTrackingType.Optional,
          version: 'v1',
        },
        draftSettings: {
          value: TimeTracking_UserLocationTrackingType.Required,
          effectiveValue: TimeTracking_LocationTrackingType.Required,
          version: 'v1',
        },
      });
      renderComponent(store);

      const cancelButton = screen.getByLabelText('cancel-location');
      fireEvent.click(cancelButton);

      // Modal should be shown
      expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-title')).toHaveTextContent(
        'Unsaved changes',
      );
    });

    test('clears local error state when clicked', async () => {
      renderComponent();

      // No error should be visible
      expect(
        screen.queryByTestId('LocationCardEditErrorPageMessage'),
      ).not.toBeInTheDocument();

      const cancelButton = screen.getByLabelText('cancel-location');
      fireEvent.click(cancelButton);

      // Still no error after cancel
      expect(
        screen.queryByTestId('LocationCardEditErrorPageMessage'),
      ).not.toBeInTheDocument();
    });

    test('has tertiary priority styling', () => {
      renderComponent();

      const cancelButton = screen.getByLabelText('cancel-location');
      expect(cancelButton).toHaveAttribute('data-priority', 'tertiary');
    });

    test('is not disabled by default', () => {
      renderComponent();

      const cancelButton = screen.getByLabelText('cancel-location');
      expect(cancelButton).not.toBeDisabled();
    });
  });

  // ---------------------------------------------------------------------------
  // Save Button Tests
  // ---------------------------------------------------------------------------
  describe('Save Button', () => {
    test('calls saveLocationSettings mutation when clicked with changes', async () => {
      // Create store with changes (draft differs from original)
      const store = createMockStore({
        settings: {
          value: TimeTracking_UserLocationTrackingType.UseCompanySetting,
          effectiveValue: TimeTracking_LocationTrackingType.Optional,
          version: 'v1',
        },
        draftSettings: {
          value: TimeTracking_UserLocationTrackingType.Required,
          effectiveValue: TimeTracking_LocationTrackingType.Required,
          version: 'v1',
        },
      });
      renderComponent(store);

      const saveButton = screen.getByLabelText('save-location');
      fireEvent.click(saveButton);

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      expect(mockSaveLocationMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '123',
          timeForType: TimeTracking_TimeForType.Employee,
        }),
        expect.objectContaining({
          value: TimeTracking_UserLocationTrackingType.Required,
          version: 'v1',
        }),
      );
    });

    test('logs save event with draft settings', async () => {
      // Create store with changes
      const store = createMockStore({
        settings: {
          value: TimeTracking_UserLocationTrackingType.UseCompanySetting,
          effectiveValue: TimeTracking_LocationTrackingType.Optional,
          version: 'v1',
        },
        draftSettings: {
          value: TimeTracking_UserLocationTrackingType.Required,
          effectiveValue: TimeTracking_LocationTrackingType.Required,
          version: 'v1',
        },
      });
      renderComponent(store);

      const saveButton = screen.getByLabelText('save-location');
      fireEvent.click(saveButton);

      expect(mockLoggerInfo).toHaveBeenCalledWith(
        'Component=LocationCardEdit Event=Saving location settings',
        expect.objectContaining({
          draftSettings: expect.any(Object),
          settingsFor: expect.any(Object),
        }),
      );
    });

    test('has correct aria label', () => {
      renderComponent();

      const saveButton = screen.getByLabelText('save-location');
      expect(saveButton).toBeInTheDocument();
    });

    test('is disabled when there are no changes', () => {
      // Default store has same settings and draftSettings, so no changes
      renderComponent();

      const saveButton = screen.getByLabelText('save-location');
      expect(saveButton).toBeDisabled();
    });

    test('is enabled when there are changes', () => {
      // Create store with changes (draft differs from original)
      const store = createMockStore({
        settings: {
          value: TimeTracking_UserLocationTrackingType.UseCompanySetting,
          effectiveValue: TimeTracking_LocationTrackingType.Optional,
          version: 'v1',
        },
        draftSettings: {
          value: TimeTracking_UserLocationTrackingType.Required,
          effectiveValue: TimeTracking_LocationTrackingType.Required,
          version: 'v1',
        },
      });
      renderComponent(store);

      const saveButton = screen.getByLabelText('save-location');
      expect(saveButton).not.toBeDisabled();
    });

    test('shows loading state during save', async () => {
      renderComponent();

      const saveButton = screen.getByLabelText('save-location');
      expect(saveButton).toHaveAttribute('data-loading', 'false');
    });
  });

  // ---------------------------------------------------------------------------
  // Redux Integration Tests
  // ---------------------------------------------------------------------------
  describe('Redux Integration', () => {
    test('reads draft settings from Redux state', () => {
      const store = createStoreWithDraft(
        TimeTracking_UserLocationTrackingType.Required,
        TimeTracking_LocationTrackingType.Required,
      );
      renderComponent(store);

      const requiredRadio = screen.getByDisplayValue(
        TimeTracking_LocationTrackingType.Required,
      );
      expect(requiredRadio).toBeChecked();
    });

    test('updates Redux state when settings change', () => {
      const store = createStoreWithDraft(
        TimeTracking_UserLocationTrackingType.Optional,
        TimeTracking_LocationTrackingType.Optional,
      );
      const { dispatchSpy } = renderComponent(store);

      const requiredRadio = screen.getByDisplayValue(
        TimeTracking_LocationTrackingType.Required,
      );
      fireEvent.click(requiredRadio);

      expect(dispatchSpy).toHaveBeenCalled();
    });

    test('reflects different initial states correctly', () => {
      // Test with Required state
      const requiredStore = createStoreWithDraft(
        TimeTracking_UserLocationTrackingType.Required,
        TimeTracking_LocationTrackingType.Required,
      );
      const { unmount: unmount1 } = renderComponent(requiredStore);
      expect(
        screen.getByDisplayValue(TimeTracking_LocationTrackingType.Required),
      ).toBeChecked();
      unmount1();

      // Test with Off state
      const offStore = createStoreWithDraft(
        TimeTracking_UserLocationTrackingType.Off,
        TimeTracking_LocationTrackingType.Off,
      );
      renderComponent(offStore);
      expect(
        screen.getByDisplayValue(TimeTracking_LocationTrackingType.Off),
      ).toBeChecked();
    });
  });

  // ---------------------------------------------------------------------------
  // Accessibility Tests
  // ---------------------------------------------------------------------------
  describe('Accessibility', () => {
    test('settings type radio group has correct aria-label', () => {
      renderComponent();

      const settingsTypeGroup = screen.getByRole('radiogroup', {
        name: 'location-settings-type',
      });
      expect(settingsTypeGroup).toBeInTheDocument();
    });

    test('location tracking radio group has correct aria-label', () => {
      renderComponent();

      const trackingGroup = screen.getByRole('radiogroup', {
        name: 'location-tracking-options',
      });
      expect(trackingGroup).toBeInTheDocument();
    });

    test('cancel button has correct aria-label', () => {
      renderComponent();

      const cancelButton = screen.getByLabelText('cancel-location');
      expect(cancelButton).toBeInTheDocument();
    });

    test('save button has correct aria-label', () => {
      renderComponent();

      const saveButton = screen.getByLabelText('save-location');
      expect(saveButton).toBeInTheDocument();
    });

    test('radio groups use vertical layout', () => {
      renderComponent();

      const radioGroups = screen.getAllByRole('radiogroup');
      radioGroups.forEach((group) => {
        expect(group).toHaveAttribute('data-vertical', 'true');
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Component Structure Tests
  // ---------------------------------------------------------------------------
  describe('Component Structure', () => {
    test('renders section components', () => {
      renderComponent();
      expect(screen.getAllByTestId('section').length).toBeGreaterThan(0);
    });

    test('renders location settings groups', () => {
      renderComponent();
      expect(
        screen.getAllByTestId('location-settings-group').length,
      ).toBeGreaterThan(0);
    });

    test('renders custom rules section', () => {
      renderComponent();
      expect(screen.getByTestId('custom-rules-section')).toBeInTheDocument();
    });

    test('renders action buttons container', () => {
      renderComponent();
      expect(screen.getByTestId('action-buttons')).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Confirmation Modal Tests
  // ---------------------------------------------------------------------------
  describe('Confirmation Modal', () => {
    const createStoreWithChanges = () =>
      createMockStore({
        settings: {
          value: TimeTracking_UserLocationTrackingType.UseCompanySetting,
          effectiveValue: TimeTracking_LocationTrackingType.Optional,
          version: 'v1',
        },
        draftSettings: {
          value: TimeTracking_UserLocationTrackingType.Required,
          effectiveValue: TimeTracking_LocationTrackingType.Required,
          version: 'v1',
        },
      });

    test('does not show modal initially', () => {
      renderComponent(createStoreWithChanges());
      expect(
        screen.queryByTestId('confirmation-modal'),
      ).not.toBeInTheDocument();
    });

    test('shows modal with correct title when canceling with changes', () => {
      renderComponent(createStoreWithChanges());

      const cancelButton = screen.getByLabelText('cancel-location');
      fireEvent.click(cancelButton);

      expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-title')).toHaveTextContent(
        'Unsaved changes',
      );
    });

    test('shows modal with correct message when canceling with changes', () => {
      renderComponent(createStoreWithChanges());

      const cancelButton = screen.getByLabelText('cancel-location');
      fireEvent.click(cancelButton);

      expect(screen.getByTestId('modal-content')).toHaveTextContent(
        'Do you want to save your changes before leaving?',
      );
    });

    test('shows correct button labels in modal', () => {
      renderComponent(createStoreWithChanges());

      const cancelButton = screen.getByLabelText('cancel-location');
      fireEvent.click(cancelButton);

      expect(screen.getByTestId('modal-yes-button')).toHaveTextContent('Save');
      expect(screen.getByTestId('modal-no-button')).toHaveTextContent(
        "Don't save",
      );
    });

    test('triggers save when clicking Save button in modal', async () => {
      renderComponent(createStoreWithChanges());

      const cancelButton = screen.getByLabelText('cancel-location');
      fireEvent.click(cancelButton);

      const modalSaveButton = screen.getByTestId('modal-yes-button');
      fireEvent.click(modalSaveButton);

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      // Save should be triggered
      expect(mockSaveLocationMutation).toHaveBeenCalled();
    });

    test('dispatches cancelLocationEdit when clicking Dont Save in modal', () => {
      const { dispatchSpy } = renderComponent(createStoreWithChanges());

      const cancelButton = screen.getByLabelText('cancel-location');
      fireEvent.click(cancelButton);

      const modalDontSaveButton = screen.getByTestId('modal-no-button');
      fireEvent.click(modalDontSaveButton);

      // Should dispatch cancel action
      expect(dispatchSpy).toHaveBeenCalledWith(cancelLocationEdit());
    });

    test('closes modal after clicking Dont Save', () => {
      renderComponent(createStoreWithChanges());

      const cancelButton = screen.getByLabelText('cancel-location');
      fireEvent.click(cancelButton);

      expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();

      const modalDontSaveButton = screen.getByTestId('modal-no-button');
      fireEvent.click(modalDontSaveButton);

      expect(
        screen.queryByTestId('confirmation-modal'),
      ).not.toBeInTheDocument();
    });

    test('clears error state when discarding changes', () => {
      renderComponent(createStoreWithChanges());

      const cancelButton = screen.getByLabelText('cancel-location');
      fireEvent.click(cancelButton);

      const modalDontSaveButton = screen.getByTestId('modal-no-button');
      fireEvent.click(modalDontSaveButton);

      // No error should be visible
      expect(
        screen.queryByTestId('LocationCardEditErrorPageMessage'),
      ).not.toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Edge Cases
  // ---------------------------------------------------------------------------
  describe('Edge Cases', () => {
    test('handles component unmounting without errors', () => {
      const { unmount } = renderComponent();
      expect(() => unmount()).not.toThrow();
    });

    test('handles rapid settings type switching', () => {
      const { dispatchSpy } = renderComponent();

      const customRadio = screen.getByDisplayValue('custom');
      const companyRadio = screen.getByDisplayValue('company');

      fireEvent.click(customRadio);
      fireEvent.click(companyRadio);
      fireEvent.click(customRadio);
      fireEvent.click(companyRadio);

      expect(companyRadio).toBeChecked();
      expect(dispatchSpy).toHaveBeenCalledTimes(4);
    });

    test('handles rapid tracking option switching', () => {
      const store = createStoreWithDraft(
        TimeTracking_UserLocationTrackingType.Optional,
        TimeTracking_LocationTrackingType.Optional,
      );
      const { dispatchSpy } = renderComponent(store);

      const requiredRadio = screen.getByDisplayValue(
        TimeTracking_LocationTrackingType.Required,
      );
      const optionalRadio = screen.getByDisplayValue(
        TimeTracking_LocationTrackingType.Optional,
      );
      const offRadio = screen.getByDisplayValue(
        TimeTracking_LocationTrackingType.Off,
      );

      fireEvent.click(requiredRadio);
      fireEvent.click(offRadio);
      fireEvent.click(optionalRadio);
      fireEvent.click(requiredRadio);

      expect(dispatchSpy).toHaveBeenCalledTimes(4);
    });

    test('handles save attempt and updates state correctly', async () => {
      // Create store with changes so save button is enabled
      const store = createMockStore({
        settings: {
          value: TimeTracking_UserLocationTrackingType.UseCompanySetting,
          effectiveValue: TimeTracking_LocationTrackingType.Optional,
          version: 'v1',
        },
        draftSettings: {
          value: TimeTracking_UserLocationTrackingType.Required,
          effectiveValue: TimeTracking_LocationTrackingType.Required,
          version: 'v1',
        },
      });
      renderComponent(store);

      const saveButton = screen.getByLabelText('save-location');

      // Save button should be enabled initially (has changes)
      expect(saveButton).not.toBeDisabled();

      fireEvent.click(saveButton);

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      // Save should have been triggered once
      expect(mockSaveLocationMutation).toHaveBeenCalledTimes(1);
    });

    test('maintains state consistency after cancel and re-edit', () => {
      // Use store where draft differs from settings (has changes)
      const store = createStoreWithDraft(
        TimeTracking_UserLocationTrackingType.Required,
        TimeTracking_LocationTrackingType.Required,
      );
      const { dispatchSpy } = renderComponent(store);

      const cancelButton = screen.getByLabelText('cancel-location');
      fireEvent.click(cancelButton);

      // Modal should appear since there are changes
      expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();

      // Click "Don't save" to discard changes
      const dontSaveButton = screen.getByTestId('modal-no-button');
      fireEvent.click(dontSaveButton);

      expect(dispatchSpy).toHaveBeenCalledWith(cancelLocationEdit());
    });
  });

  // ---------------------------------------------------------------------------
  // Error Handling Tests
  // ---------------------------------------------------------------------------
  describe('Error Handling', () => {
    test('does not show error message initially', () => {
      renderComponent();

      expect(
        screen.queryByTestId('LocationCardEditErrorPageMessage'),
      ).not.toBeInTheDocument();
    });

    test('shows error when settingsFor context is missing', async () => {
      // Create store with changes (to enable save button) but missing settingsFor
      const store = createMockStore(
        {
          settings: {
            value: TimeTracking_UserLocationTrackingType.UseCompanySetting,
            effectiveValue: TimeTracking_LocationTrackingType.Optional,
            version: 'v1',
          },
          draftSettings: {
            value: TimeTracking_UserLocationTrackingType.Required,
            effectiveValue: TimeTracking_LocationTrackingType.Required,
            version: 'v1',
          },
        },
        { settingsFor: null },
      );
      renderComponent(store);

      const saveButton = screen.getByLabelText('save-location');
      fireEvent.click(saveButton);

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      // Error should be logged
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Component=LocationCardEdit Event=Missing settingsFor context',
      );

      // Error message should be displayed
      expect(
        screen.getByTestId('LocationCardEditErrorPageMessage'),
      ).toBeInTheDocument();
    });

    test('does not call mutation when settingsFor context is missing', async () => {
      // Create store with changes (to enable save button) but missing settingsFor
      const store = createMockStore(
        {
          settings: {
            value: TimeTracking_UserLocationTrackingType.UseCompanySetting,
            effectiveValue: TimeTracking_LocationTrackingType.Optional,
            version: 'v1',
          },
          draftSettings: {
            value: TimeTracking_UserLocationTrackingType.Required,
            effectiveValue: TimeTracking_LocationTrackingType.Required,
            version: 'v1',
          },
        },
        { settingsFor: null },
      );
      renderComponent(store);

      const saveButton = screen.getByLabelText('save-location');
      fireEvent.click(saveButton);

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      // Mutation should not be called
      expect(mockSaveLocationMutation).not.toHaveBeenCalled();
    });

    test('logs info when save completes', async () => {
      // Create store with changes to enable save button
      const store = createMockStore({
        settings: {
          value: TimeTracking_UserLocationTrackingType.UseCompanySetting,
          effectiveValue: TimeTracking_LocationTrackingType.Optional,
          version: 'v1',
        },
        draftSettings: {
          value: TimeTracking_UserLocationTrackingType.Required,
          effectiveValue: TimeTracking_LocationTrackingType.Required,
          version: 'v1',
        },
      });
      renderComponent(store);

      const saveButton = screen.getByLabelText('save-location');
      fireEvent.click(saveButton);

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      // Save should complete without throwing
      expect(mockLoggerInfo).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Button Priority Tests
  // ---------------------------------------------------------------------------
  describe('Button Priorities', () => {
    test('cancel button has tertiary priority', () => {
      renderComponent();

      const cancelButton = screen.getByLabelText('cancel-location');
      expect(cancelButton).toHaveAttribute('data-priority', 'tertiary');
    });

    test('save button has default (no tertiary) priority', () => {
      renderComponent();

      const saveButton = screen.getByLabelText('save-location');
      expect(saveButton).not.toHaveAttribute('data-priority', 'tertiary');
    });
  });

  // ---------------------------------------------------------------------------
  // Tracking Tests
  // ---------------------------------------------------------------------------
  describe('Tracking', () => {
    const baseTrackingFields = {
      scope: 'qbtime',
      scope_area: 'time-tracking',
      screen: 'time_user_settings',
      object: 'widget',
      object_detail: 'location_user settings',
      action: 'engaged',
      ui_action: 'clicked',
    };

    describe('Settings Type Selection Tracking', () => {
      test('tracks USE_COMPANY_LEVEL_SETTINGS when selecting company settings', () => {
        const store = createStoreWithDraft(
          TimeTracking_UserLocationTrackingType.Optional,
          TimeTracking_LocationTrackingType.Optional,
        );
        renderComponent(store);

        const companyRadio = screen.getByDisplayValue('company');
        fireEvent.click(companyRadio);

        expect(mockTrack).toHaveBeenCalledWith(
          expect.objectContaining({
            ...baseTrackingFields,
            ui_object: 'radio_button',
            ui_object_detail: 'use_company_level_settings',
          }),
        );
      });

      test('tracks USE_CUSTOM_RULES_FOR_THIS_WORKER when selecting custom rules', () => {
        renderComponent();

        const customRadio = screen.getByDisplayValue('custom');
        fireEvent.click(customRadio);

        expect(mockTrack).toHaveBeenCalledWith(
          expect.objectContaining({
            ...baseTrackingFields,
            ui_object: 'radio_button',
            ui_object_detail: 'use_custom_rules_for_this_worker',
          }),
        );
      });
    });

    describe('Location Tracking Options Tracking', () => {
      test('tracks LOCATION_TRACKING_REQUIRED when selecting required option', () => {
        const store = createStoreWithDraft(
          TimeTracking_UserLocationTrackingType.Optional,
          TimeTracking_LocationTrackingType.Optional,
        );
        renderComponent(store);

        const requiredRadio = screen.getByDisplayValue(
          TimeTracking_LocationTrackingType.Required,
        );
        fireEvent.click(requiredRadio);

        expect(mockTrack).toHaveBeenCalledWith(
          expect.objectContaining({
            ...baseTrackingFields,
            ui_object: 'radio_button',
            ui_object_detail: 'required',
          }),
        );
      });

      test('tracks LOCATION_TRACKING_OPTIONAL when selecting optional option', () => {
        const store = createStoreWithDraft(
          TimeTracking_UserLocationTrackingType.Required,
          TimeTracking_LocationTrackingType.Required,
        );
        renderComponent(store);

        const optionalRadio = screen.getByDisplayValue(
          TimeTracking_LocationTrackingType.Optional,
        );
        fireEvent.click(optionalRadio);

        expect(mockTrack).toHaveBeenCalledWith(
          expect.objectContaining({
            ...baseTrackingFields,
            ui_object: 'radio_button',
            ui_object_detail: 'optional',
          }),
        );
      });

      test('tracks LOCATION_TRACKING_OFF when selecting off option', () => {
        const store = createStoreWithDraft(
          TimeTracking_UserLocationTrackingType.Optional,
          TimeTracking_LocationTrackingType.Optional,
        );
        renderComponent(store);

        const offRadio = screen.getByDisplayValue(
          TimeTracking_LocationTrackingType.Off,
        );
        fireEvent.click(offRadio);

        expect(mockTrack).toHaveBeenCalledWith(
          expect.objectContaining({
            ...baseTrackingFields,
            ui_object: 'radio_button',
            ui_object_detail: 'off',
          }),
        );
      });
    });

    describe('Navigation Tracking', () => {
      test('tracks MANAGE_COMPANY_LOCATION_TRACKING when clicking company settings link', () => {
        renderComponent();

        const link = screen.getByTestId('company-settings-link');
        fireEvent.click(link);

        expect(mockTrack).toHaveBeenCalledWith(
          expect.objectContaining({
            ...baseTrackingFields,
            ui_object: 'link',
            ui_object_detail: 'manage_company_location_tracking',
          }),
        );
      });
    });

    describe('Action Button Tracking', () => {
      test('tracks CANCEL_LOCATION_CARD when clicking cancel button', () => {
        renderComponent();

        const cancelButton = screen.getByLabelText('cancel-location');
        fireEvent.click(cancelButton);

        expect(mockTrack).toHaveBeenCalledWith(
          expect.objectContaining({
            ...baseTrackingFields,
            ui_object: 'button',
            ui_object_detail: 'cancel',
          }),
        );
      });

      test('tracks SAVE_LOCATION_CARD when clicking save button', async () => {
        // Create store with changes to enable save button
        const store = createMockStore({
          settings: {
            value: TimeTracking_UserLocationTrackingType.UseCompanySetting,
            effectiveValue: TimeTracking_LocationTrackingType.Optional,
            version: 'v1',
          },
          draftSettings: {
            value: TimeTracking_UserLocationTrackingType.Required,
            effectiveValue: TimeTracking_LocationTrackingType.Required,
            version: 'v1',
          },
        });
        renderComponent(store);

        const saveButton = screen.getByLabelText('save-location');
        fireEvent.click(saveButton);

        expect(mockTrack).toHaveBeenCalledWith(
          expect.objectContaining({
            ...baseTrackingFields,
            ui_object: 'button',
            ui_object_detail: 'save',
          }),
        );
      });
    });

    describe('Tracking Order and Multiple Events', () => {
      test('tracks before dispatching Redux actions for settings type change', () => {
        const { dispatchSpy } = renderComponent();

        const customRadio = screen.getByDisplayValue('custom');
        fireEvent.click(customRadio);

        // Both tracking and dispatch should be called
        expect(mockTrack).toHaveBeenCalledTimes(1);
        expect(dispatchSpy).toHaveBeenCalled();
      });

      test('tracks before dispatching Redux actions for location tracking change', () => {
        const store = createStoreWithDraft(
          TimeTracking_UserLocationTrackingType.Optional,
          TimeTracking_LocationTrackingType.Optional,
        );
        const { dispatchSpy } = renderComponent(store);

        const requiredRadio = screen.getByDisplayValue(
          TimeTracking_LocationTrackingType.Required,
        );
        fireEvent.click(requiredRadio);

        // Both tracking and dispatch should be called
        expect(mockTrack).toHaveBeenCalledTimes(1);
        expect(dispatchSpy).toHaveBeenCalled();
      });

      test('tracks multiple events when switching settings and options', () => {
        renderComponent();

        // First, switch to custom
        const customRadio = screen.getByDisplayValue('custom');
        fireEvent.click(customRadio);

        expect(mockTrack).toHaveBeenCalledTimes(1);
        mockTrack.mockClear();

        // Then click cancel
        const cancelButton = screen.getByLabelText('cancel-location');
        fireEvent.click(cancelButton);

        expect(mockTrack).toHaveBeenCalledTimes(1);
        expect(mockTrack).toHaveBeenCalledWith(
          expect.objectContaining({
            ui_object_detail: 'cancel',
          }),
        );
      });
    });
  });
});

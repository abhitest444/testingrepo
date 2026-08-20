import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { MockQuicksandProvider } from '@payroll/quicksand';
import '@testing-library/jest-dom';
import { GeoLocationsTrowserContainer } from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/geoLocations/GeoLocationsTrowserContainer';

const mockSetValue = jest.fn();

jest.mock('react-hook-form', () => ({
  useFormContext: () => ({
    setValue: (...args: unknown[]) => mockSetValue(...args),
  }),
}));

const mockIntlMessages = {
  cancel: 'Cancel',
  save: 'Save',
  'time-entries.section.title.geo-locations.manage-title': 'Location Tracking',
  'time-entries.section.title.geo-locations.preference-title':
    'Select your geolocation preferences',
  'time-entries.section.title.geo-locations.preference-description':
    'Geolocation settings and features are only tracked in the Workforce mobile app.',
  'time-entries.section.title.geo-locations.preference-subtitle':
    'Locations are never tracked when your team members are on break or clocked out.',
  'catch.all.error.content': 'Something went wrong. Give it another try.',
  'time-entries.section.title.geo-locations.unsaved.changes.title':
    'Unsaved changes',
  'time-entries.section.title.geo-locations.unsaved.changes.message':
    'You have unsaved changes. Do you want to save them?',
  'time-entries.section.title.geo-locations.unsaved.changes.save': 'Save',
  'time-entries.section.title.geo-locations.unsaved.changes.dont.save':
    "Don't save",
};

const mockUpdateSettings = jest.fn();
const mockOnSuccess = jest.fn();
const mockOnError = jest.fn();
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
};

const mockTrack = jest.fn();

// Mock Trowser component
jest.mock(
  '@ids-ts/trowser',
  () =>
    function MockTrowser({
      open,
      onClose,
      title,
      children,
      footerButton,
      cancelFooterButtonLabel,
      showCancelFooterButton,
      dismissible,
    }: any) {
      if (!open) return null;
      return (
        <div data-testid="geo-locations-trowser-container">
          <div data-testid="trowser-header">
            <h2>{title}</h2>
            {dismissible !== false && (
              <button onClick={onClose} data-testid="trowser-close-button">
                Close
              </button>
            )}
          </div>
          <div data-testid="trowser-content">{children}</div>
          <div data-testid="trowser-footer">
            {showCancelFooterButton && (
              <button onClick={onClose} data-testid="trowser-cancel-button">
                {cancelFooterButtonLabel}
              </button>
            )}
            {footerButton}
          </div>
        </div>
      );
    },
);

// Mock useIntl, useSandbox, and useTracking
jest.mock('@payroll/quicksand', () => {
  const actual = jest.requireActual('@payroll/quicksand');
  return {
    ...actual,
    useIntl: () => ({
      formatMessage: ({ id }: { id: string }) =>
        mockIntlMessages[id as keyof typeof mockIntlMessages] || id,
    }),
    useSandbox: () => ({
      logger: mockLogger,
    }),
    useTracking: () => mockTrack,
  };
});

// Mock useSetQLSettings hook
jest.mock('src/js/service/hooks/settings/useSetQLSettings', () => ({
  useSetQLSettings: ({ onSuccess, onError }: any) => {
    mockOnSuccess.mockImplementation(onSuccess);
    mockOnError.mockImplementation(onError);
    return [mockUpdateSettings, { loading: false }];
  },
}));

// Mock EditGeoLocationsContainer
jest.mock(
  'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/geoLocations/EditGeoLocationsContainer',
  () => ({
    EditGeoLocationsContainer: ({
      setting,
      onSettingChange,
      showMileageTrackingSetting,
      mileageTrackingEnabled,
      onMileageTrackingChange,
      showGeofenceSetting,
      geofencingEnabled,
      onGeofencingChange,
      onSetupNotificationsClick,
    }: {
      setting: string;
      onSettingChange?: (value: string) => void;
      showMileageTrackingSetting?: boolean;
      mileageTrackingEnabled?: boolean;
      onMileageTrackingChange?: (value: boolean) => void;
      showGeofenceSetting?: boolean;
      geofencingEnabled?: boolean;
      onGeofencingChange?: (value: boolean) => void;
      onSetupNotificationsClick?: () => void;
    }) => (
      <div data-testid="edit-geo-locations-container">
        <button
          onClick={() => onSettingChange && onSettingChange('OPTIONAL')}
          data-testid="change-to-optional"
        >
          Change to Optional
        </button>
        <button
          onClick={() => onSettingChange && onSettingChange('OFF')}
          data-testid="change-to-off"
        >
          Change to Off
        </button>
        <button
          onClick={() =>
            onMileageTrackingChange &&
            onMileageTrackingChange(!mileageTrackingEnabled)
          }
          data-testid="toggle-mileage"
        >
          Toggle Mileage
        </button>
        <button
          onClick={() =>
            onGeofencingChange && onGeofencingChange(!geofencingEnabled)
          }
          data-testid="toggle-geofencing"
        >
          Toggle Geofencing
        </button>
        <button
          onClick={() =>
            onSetupNotificationsClick && onSetupNotificationsClick()
          }
          data-testid="setup-notifications"
        >
          Setup Notifications
        </button>
        <span data-testid="current-setting">{setting}</span>
        <span data-testid="show-mileage-setting">
          {String(showMileageTrackingSetting)}
        </span>
        <span data-testid="mileage-enabled">
          {String(mileageTrackingEnabled)}
        </span>
        <span data-testid="show-geofence-setting">
          {String(showGeofenceSetting)}
        </span>
        <span data-testid="geofencing-enabled">
          {String(geofencingEnabled)}
        </span>
      </div>
    ),
  }),
);

// Mock the ErrorOrWarningMessage
jest.mock(
  'src/js/widgets/timeTrackingSettings/TimeTrackingSettings.styled',
  () => ({
    ErrorOrWarningMessage: ({ title, type, open }: any) =>
      open ? (
        <div data-testid="geo-locations-trowser-error-message" data-type={type}>
          {title}
        </div>
      ) : null,
  }),
);

// Mock UnsavedChangesModal
jest.mock(
  'src/js/widgets/common/AssignmentDrawer/components/UnsavedChangesModal',
  () => ({
    UnsavedChangesModal: ({
      open,
      onSave,
      onDontSave,
      onClose,
      titleNlsKey,
      messageNlsKey,
      saveButtonNlsKey,
      dontSaveButtonNlsKey,
      dataTestId,
    }: any) =>
      open ? (
        <div data-testid={dataTestId}>
          <div data-testid="unsaved-modal-title">
            {mockIntlMessages[titleNlsKey as keyof typeof mockIntlMessages] ||
              titleNlsKey}
          </div>
          <div data-testid="unsaved-modal-message">
            {mockIntlMessages[messageNlsKey as keyof typeof mockIntlMessages] ||
              messageNlsKey}
          </div>
          <button onClick={onDontSave} data-testid="unsaved-modal-dont-save">
            {mockIntlMessages[
              dontSaveButtonNlsKey as keyof typeof mockIntlMessages
            ] || dontSaveButtonNlsKey}
          </button>
          <button onClick={onSave} data-testid="unsaved-modal-save">
            {mockIntlMessages[
              saveButtonNlsKey as keyof typeof mockIntlMessages
            ] || saveButtonNlsKey}
          </button>
          <button onClick={onClose} data-testid="unsaved-modal-close">
            Close
          </button>
        </div>
      ) : null,
  }),
);

describe('GeoLocationsTrowserContainer', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    currentValue: 'REQUIRED',
    locationTrackingVersion: '1',
    refetchQlSettings: jest.fn(),
    showMileageTrackingSetting: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render the trowser when open is true', () => {
    render(
      <MockQuicksandProvider>
        <GeoLocationsTrowserContainer {...defaultProps} />
      </MockQuicksandProvider>,
    );

    expect(
      screen.getByTestId('geo-locations-trowser-container'),
    ).toBeInTheDocument();
  });

  it('should not render the trowser when open is false', () => {
    render(
      <MockQuicksandProvider>
        <GeoLocationsTrowserContainer {...defaultProps} open={false} />
      </MockQuicksandProvider>,
    );

    expect(
      screen.queryByTestId('geo-locations-trowser-container'),
    ).not.toBeInTheDocument();
  });

  it('should display correct trowser title', () => {
    render(
      <MockQuicksandProvider>
        <GeoLocationsTrowserContainer {...defaultProps} />
      </MockQuicksandProvider>,
    );

    expect(screen.getByText('Location Tracking')).toBeInTheDocument();
  });

  it('should render EditGeoLocationsContainer with current value', () => {
    render(
      <MockQuicksandProvider>
        <GeoLocationsTrowserContainer {...defaultProps} />
      </MockQuicksandProvider>,
    );

    expect(
      screen.getByTestId('edit-geo-locations-container'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('current-setting')).toHaveTextContent('REQUIRED');
  });

  it('should render Save button', () => {
    render(
      <MockQuicksandProvider>
        <GeoLocationsTrowserContainer {...defaultProps} />
      </MockQuicksandProvider>,
    );

    expect(screen.getByTestId('save-geo-locations-button')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('should render Cancel button', () => {
    render(
      <MockQuicksandProvider>
        <GeoLocationsTrowserContainer {...defaultProps} />
      </MockQuicksandProvider>,
    );

    expect(screen.getByTestId('trowser-cancel-button')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should call onClose when Cancel button is clicked without changes', () => {
    const onClose = jest.fn();
    render(
      <MockQuicksandProvider>
        <GeoLocationsTrowserContainer {...defaultProps} onClose={onClose} />
      </MockQuicksandProvider>,
    );

    const cancelButton = screen.getByTestId('trowser-cancel-button');
    fireEvent.click(cancelButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(
      <MockQuicksandProvider>
        <GeoLocationsTrowserContainer {...defaultProps} onClose={onClose} />
      </MockQuicksandProvider>,
    );

    const closeButton = screen.getByTestId('trowser-close-button');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call updateSettings with correct parameters when Save button is clicked', async () => {
    render(
      <MockQuicksandProvider>
        <GeoLocationsTrowserContainer {...defaultProps} />
      </MockQuicksandProvider>,
    );

    // Change the selection first (otherwise Save button is disabled)
    const changeButton = screen.getByTestId('change-to-optional');
    fireEvent.click(changeButton);

    const saveButton = screen.getByTestId('save-geo-locations-button');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalledWith({
        timesheetManagementSettings: {
          timesheet: {
            locationTracking: {
              version: '1',
              value: 'OPTIONAL',
            },
          },
        },
      });
    });
  });

  it('should update selected value and call updateSettings with new value', async () => {
    render(
      <MockQuicksandProvider>
        <GeoLocationsTrowserContainer {...defaultProps} />
      </MockQuicksandProvider>,
    );

    // Change setting to OPTIONAL
    const changeButton = screen.getByTestId('change-to-optional');
    fireEvent.click(changeButton);

    // Save the new setting
    const saveButton = screen.getByTestId('save-geo-locations-button');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalledWith({
        timesheetManagementSettings: {
          timesheet: {
            locationTracking: {
              version: '1',
              value: 'OPTIONAL',
            },
          },
        },
      });
    });
  });

  it('should call refetchQlSettings and onClose on successful save', async () => {
    const refetchQlSettings = jest.fn();
    const onClose = jest.fn();
    render(
      <MockQuicksandProvider>
        <GeoLocationsTrowserContainer
          {...defaultProps}
          refetchQlSettings={refetchQlSettings}
          onClose={onClose}
        />
      </MockQuicksandProvider>,
    );

    const saveButton = screen.getByTestId('save-geo-locations-button');
    fireEvent.click(saveButton);

    // Trigger the onSuccess callback
    await waitFor(() => {
      mockOnSuccess();
    });

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Component=GeoLocationsTrowser Event=SaveSuccess',
      {
        previousValue: 'REQUIRED',
        newValue: 'REQUIRED',
      },
    );
    expect(refetchQlSettings).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('should display error message and keep trowser open on save failure', async () => {
    render(
      <MockQuicksandProvider>
        <GeoLocationsTrowserContainer {...defaultProps} />
      </MockQuicksandProvider>,
    );

    const saveButton = screen.getByTestId('save-geo-locations-button');
    fireEvent.click(saveButton);

    // Trigger the onError callback with error message
    const errorMessage = 'Failed to save settings';
    await waitFor(() => {
      mockOnError(errorMessage);
    });

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Component=GeoLocationsTrowser Event=SaveFailed',
      {
        error: errorMessage,
        previousValue: 'REQUIRED',
        attemptedValue: 'REQUIRED',
      },
    );

    // Error message should be displayed
    expect(
      screen.getByTestId('geo-locations-trowser-error-message'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('geo-locations-trowser-error-message'),
    ).toHaveTextContent(errorMessage);
  });

  it('should display generic error message when error is undefined', async () => {
    render(
      <MockQuicksandProvider>
        <GeoLocationsTrowserContainer {...defaultProps} />
      </MockQuicksandProvider>,
    );

    const saveButton = screen.getByTestId('save-geo-locations-button');
    fireEvent.click(saveButton);

    // Trigger the onError callback with undefined error
    await waitFor(() => {
      mockOnError(undefined);
    });

    // Generic error message should be displayed
    expect(
      screen.getByTestId('geo-locations-trowser-error-message'),
    ).toHaveTextContent('Something went wrong. Give it another try.');
  });

  it('should reset selected value to currentValue when trowser is reopened', async () => {
    const { rerender } = render(
      <MockQuicksandProvider>
        <GeoLocationsTrowserContainer {...defaultProps} open={false} />
      </MockQuicksandProvider>,
    );

    // Open trowser with a new current value
    rerender(
      <MockQuicksandProvider>
        <GeoLocationsTrowserContainer
          {...defaultProps}
          open
          currentValue="OPTIONAL"
        />
      </MockQuicksandProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('current-setting')).toHaveTextContent(
        'OPTIONAL',
      );
    });
  });

  it('should reset error message when trowser is reopened', async () => {
    const { rerender } = render(
      <MockQuicksandProvider>
        <GeoLocationsTrowserContainer {...defaultProps} />
      </MockQuicksandProvider>,
    );

    // Trigger an error
    const saveButton = screen.getByTestId('save-geo-locations-button');
    fireEvent.click(saveButton);
    await waitFor(() => {
      mockOnError('Error message');
    });

    expect(
      screen.getByTestId('geo-locations-trowser-error-message'),
    ).toBeInTheDocument();

    // Close and reopen trowser
    rerender(
      <MockQuicksandProvider>
        <GeoLocationsTrowserContainer {...defaultProps} open={false} />
      </MockQuicksandProvider>,
    );

    rerender(
      <MockQuicksandProvider>
        <GeoLocationsTrowserContainer {...defaultProps} open />
      </MockQuicksandProvider>,
    );

    // Error message should be cleared
    expect(
      screen.queryByTestId('geo-locations-trowser-error-message'),
    ).not.toBeInTheDocument();
  });

  it('should display correct content text', () => {
    render(
      <MockQuicksandProvider>
        <GeoLocationsTrowserContainer {...defaultProps} />
      </MockQuicksandProvider>,
    );

    expect(
      screen.getByText('Select your geolocation preferences'),
    ).toBeInTheDocument();
  });

  it('should use locationTrackingVersion prop in mutation', async () => {
    render(
      <MockQuicksandProvider>
        <GeoLocationsTrowserContainer
          {...defaultProps}
          locationTrackingVersion="5"
        />
      </MockQuicksandProvider>,
    );

    // Change the selection first (otherwise Save button is disabled)
    const changeButton = screen.getByTestId('change-to-optional');
    fireEvent.click(changeButton);

    const saveButton = screen.getByTestId('save-geo-locations-button');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalledWith({
        timesheetManagementSettings: {
          timesheet: {
            locationTracking: {
              version: '5',
              value: 'OPTIONAL',
            },
          },
        },
      });
    });
  });

  it('should disable save button when selected value equals current value', () => {
    render(
      <MockQuicksandProvider>
        <GeoLocationsTrowserContainer {...defaultProps} />
      </MockQuicksandProvider>,
    );

    const saveButton = screen.getByTestId('save-geo-locations-button');

    // Save button should be disabled since selectedValue === currentValue (both are 'REQUIRED')
    expect(saveButton).toBeDisabled();
  });

  it('should enable save button when selected value differs from current value', () => {
    render(
      <MockQuicksandProvider>
        <GeoLocationsTrowserContainer {...defaultProps} />
      </MockQuicksandProvider>,
    );

    // Initially disabled (same values)
    const saveButton = screen.getByTestId('save-geo-locations-button');
    expect(saveButton).toBeDisabled();

    // Click button to change selection to OPTIONAL
    const changeButton = screen.getByTestId('change-to-optional');
    fireEvent.click(changeButton);

    // Now save button should be enabled
    expect(saveButton).not.toBeDisabled();
  });

  describe('Unsaved Changes Modal', () => {
    it('should not show unsaved changes modal when closing without changes', () => {
      const onClose = jest.fn();
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer {...defaultProps} onClose={onClose} />
        </MockQuicksandProvider>,
      );

      // Click close button without making changes
      const closeButton = screen.getByTestId('trowser-close-button');
      fireEvent.click(closeButton);

      // Modal should not be shown
      expect(
        screen.queryByTestId('geo-locations-unsaved-changes-modal'),
      ).not.toBeInTheDocument();

      // onClose should be called directly
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should show unsaved changes modal when closing with unsaved changes', () => {
      const onClose = jest.fn();
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer {...defaultProps} onClose={onClose} />
        </MockQuicksandProvider>,
      );

      // Make a change
      const changeButton = screen.getByTestId('change-to-optional');
      fireEvent.click(changeButton);

      // Click close button
      const closeButton = screen.getByTestId('trowser-close-button');
      fireEvent.click(closeButton);

      // Modal should be shown
      expect(
        screen.getByTestId('geo-locations-unsaved-changes-modal'),
      ).toBeInTheDocument();

      // onClose should NOT be called yet
      expect(onClose).not.toHaveBeenCalled();
    });

    it('should not show unsaved changes modal when clicking cancel without changes', () => {
      const onClose = jest.fn();
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer {...defaultProps} onClose={onClose} />
        </MockQuicksandProvider>,
      );

      // Click cancel button without making changes
      const cancelButton = screen.getByTestId('trowser-cancel-button');
      fireEvent.click(cancelButton);

      // Modal should not be shown
      expect(
        screen.queryByTestId('geo-locations-unsaved-changes-modal'),
      ).not.toBeInTheDocument();

      // onClose should be called directly
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should show unsaved changes modal when clicking cancel with unsaved changes', () => {
      const onClose = jest.fn();
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer {...defaultProps} onClose={onClose} />
        </MockQuicksandProvider>,
      );

      // Make a change
      const changeButton = screen.getByTestId('change-to-optional');
      fireEvent.click(changeButton);

      // Click cancel button
      const cancelButton = screen.getByTestId('trowser-cancel-button');
      fireEvent.click(cancelButton);

      // Modal should be shown
      expect(
        screen.getByTestId('geo-locations-unsaved-changes-modal'),
      ).toBeInTheDocument();

      // onClose should NOT be called yet
      expect(onClose).not.toHaveBeenCalled();
    });

    it('should display correct modal content', () => {
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer {...defaultProps} />
        </MockQuicksandProvider>,
      );

      // Make a change
      const changeButton = screen.getByTestId('change-to-optional');
      fireEvent.click(changeButton);

      // Click cancel to trigger modal
      const cancelButton = screen.getByTestId('trowser-cancel-button');
      fireEvent.click(cancelButton);

      // Check modal content
      expect(screen.getByTestId('unsaved-modal-title')).toHaveTextContent(
        'Unsaved changes',
      );
      expect(screen.getByTestId('unsaved-modal-message')).toHaveTextContent(
        'You have unsaved changes. Do you want to save them?',
      );
      expect(screen.getByTestId('unsaved-modal-save')).toHaveTextContent(
        'Save',
      );
      expect(screen.getByTestId('unsaved-modal-dont-save')).toHaveTextContent(
        "Don't save",
      );
    });

    it('should close modal when clicking close button on modal', () => {
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer {...defaultProps} />
        </MockQuicksandProvider>,
      );

      // Make a change
      const changeButton = screen.getByTestId('change-to-optional');
      fireEvent.click(changeButton);

      // Click cancel to trigger modal
      const cancelButton = screen.getByTestId('trowser-cancel-button');
      fireEvent.click(cancelButton);

      // Modal should be visible
      expect(
        screen.getByTestId('geo-locations-unsaved-changes-modal'),
      ).toBeInTheDocument();

      // Click close on modal
      const modalCloseButton = screen.getByTestId('unsaved-modal-close');
      fireEvent.click(modalCloseButton);

      // Modal should be hidden
      expect(
        screen.queryByTestId('geo-locations-unsaved-changes-modal'),
      ).not.toBeInTheDocument();

      // Trowser should still be open (onClose not called)
      expect(
        screen.getByTestId('geo-locations-trowser-container'),
      ).toBeInTheDocument();
    });

    it('should close trowser and modal when clicking "Don\'t Save" button', () => {
      const onClose = jest.fn();
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer {...defaultProps} onClose={onClose} />
        </MockQuicksandProvider>,
      );

      // Make a change
      const changeButton = screen.getByTestId('change-to-optional');
      fireEvent.click(changeButton);

      // Click cancel to trigger modal
      const cancelButton = screen.getByTestId('trowser-cancel-button');
      fireEvent.click(cancelButton);

      // Click "Don't Save" on modal
      const dontSaveButton = screen.getByTestId('unsaved-modal-dont-save');
      fireEvent.click(dontSaveButton);

      // Modal should be hidden
      expect(
        screen.queryByTestId('geo-locations-unsaved-changes-modal'),
      ).not.toBeInTheDocument();

      // onClose should be called
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should trigger save when clicking "Save" button on modal', async () => {
      const onClose = jest.fn();
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer {...defaultProps} onClose={onClose} />
        </MockQuicksandProvider>,
      );

      // Make a change
      const changeButton = screen.getByTestId('change-to-optional');
      fireEvent.click(changeButton);

      // Click cancel to trigger modal
      const cancelButton = screen.getByTestId('trowser-cancel-button');
      fireEvent.click(cancelButton);

      // Click "Save" on modal
      const saveButton = screen.getByTestId('unsaved-modal-save');
      fireEvent.click(saveButton);

      // Modal should be hidden
      expect(
        screen.queryByTestId('geo-locations-unsaved-changes-modal'),
      ).not.toBeInTheDocument();

      // Save should be called
      await waitFor(() => {
        expect(mockUpdateSettings).toHaveBeenCalledWith({
          timesheetManagementSettings: {
            timesheet: {
              locationTracking: {
                version: '1',
                value: 'OPTIONAL',
              },
            },
          },
        });
      });
    });

    it('should close modal and trowser after successful save from modal', async () => {
      const onClose = jest.fn();
      const refetchQlSettings = jest.fn();
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer
            {...defaultProps}
            onClose={onClose}
            refetchQlSettings={refetchQlSettings}
          />
        </MockQuicksandProvider>,
      );

      // Make a change
      const changeButton = screen.getByTestId('change-to-optional');
      fireEvent.click(changeButton);

      // Click cancel to trigger modal
      const cancelButton = screen.getByTestId('trowser-cancel-button');
      fireEvent.click(cancelButton);

      // Click "Save" on modal
      const saveButton = screen.getByTestId('unsaved-modal-save');
      fireEvent.click(saveButton);

      // Trigger successful save
      await waitFor(() => {
        mockOnSuccess();
      });

      // Modal should be hidden
      expect(
        screen.queryByTestId('geo-locations-unsaved-changes-modal'),
      ).not.toBeInTheDocument();

      // onClose should be called (trowser closed)
      expect(onClose).toHaveBeenCalled();

      // refetchQlSettings should be called
      expect(refetchQlSettings).toHaveBeenCalled();
    });

    it('should log cancel event when clicking cancel with unsaved changes', () => {
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer {...defaultProps} />
        </MockQuicksandProvider>,
      );

      // Make a change
      const changeButton = screen.getByTestId('change-to-optional');
      fireEvent.click(changeButton);

      // Click cancel button
      const cancelButton = screen.getByTestId('trowser-cancel-button');
      fireEvent.click(cancelButton);

      // Check logging
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Component=GeoLocationsTrowser Event=CancelClicked',
        {
          originalValue: 'REQUIRED',
          selectedValue: 'OPTIONAL',
          wasChanged: true,
        },
      );
    });

    it('should log cancel event when clicking cancel without changes', () => {
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer {...defaultProps} />
        </MockQuicksandProvider>,
      );

      // Click cancel button without making changes
      const cancelButton = screen.getByTestId('trowser-cancel-button');
      fireEvent.click(cancelButton);

      // Check logging
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Component=GeoLocationsTrowser Event=CancelClicked',
        {
          originalValue: 'REQUIRED',
          selectedValue: 'REQUIRED',
          wasChanged: false,
        },
      );
    });

    it('should track cancel clickstream event', () => {
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer {...defaultProps} />
        </MockQuicksandProvider>,
      );

      // Make a change
      const changeButton = screen.getByTestId('change-to-optional');
      fireEvent.click(changeButton);

      // Click cancel button
      const cancelButton = screen.getByTestId('trowser-cancel-button');
      fireEvent.click(cancelButton);

      // Check tracking - should be called with tracking point object
      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          object_detail: 'geo_locations_section_cancel',
        }),
      );
    });

    it('should track modal save clickstream event', () => {
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer {...defaultProps} />
        </MockQuicksandProvider>,
      );

      // Make a change
      const changeButton = screen.getByTestId('change-to-optional');
      fireEvent.click(changeButton);

      // Click cancel to trigger modal
      const cancelButton = screen.getByTestId('trowser-cancel-button');
      fireEvent.click(cancelButton);

      // Click "Save" on modal
      const saveButton = screen.getByTestId('unsaved-modal-save');
      fireEvent.click(saveButton);

      // Check tracking - should be called with tracking point object
      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          object_detail: 'geo_locations_modal_save',
        }),
      );
    });

    it('should track modal dont save clickstream event', () => {
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer {...defaultProps} />
        </MockQuicksandProvider>,
      );

      // Make a change
      const changeButton = screen.getByTestId('change-to-optional');
      fireEvent.click(changeButton);

      // Click cancel to trigger modal
      const cancelButton = screen.getByTestId('trowser-cancel-button');
      fireEvent.click(cancelButton);

      // Click "Don't Save" on modal
      const dontSaveButton = screen.getByTestId('unsaved-modal-dont-save');
      fireEvent.click(dontSaveButton);

      // Check tracking - should be called with tracking point object
      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          object_detail: 'geo_locations_modal_dont_save',
        }),
      );
    });
  });

  describe('Mileage Tracking Props', () => {
    it('should pass showMileageTrackingSetting prop to EditGeoLocationsContainer', () => {
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer
            {...defaultProps}
            showMileageTrackingSetting
          />
        </MockQuicksandProvider>,
      );

      expect(screen.getByTestId('show-mileage-setting')).toHaveTextContent(
        'true',
      );
    });

    it('should pass showMileageTrackingSetting as false when not provided', () => {
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer {...defaultProps} />
        </MockQuicksandProvider>,
      );

      expect(screen.getByTestId('show-mileage-setting')).toHaveTextContent(
        'false',
      );
    });

    it('should pass mileageTrackingEnabled prop to EditGeoLocationsContainer', () => {
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer
            {...defaultProps}
            mileageTrackingEnabled
          />
        </MockQuicksandProvider>,
      );

      expect(screen.getByTestId('mileage-enabled')).toHaveTextContent('true');
    });

    it('should pass mileageTrackingEnabled as false when not provided', () => {
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer {...defaultProps} />
        </MockQuicksandProvider>,
      );

      expect(screen.getByTestId('mileage-enabled')).toHaveTextContent('false');
    });

    it('should pass both mileage props correctly when provided', () => {
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer
            {...defaultProps}
            showMileageTrackingSetting
            mileageTrackingEnabled
          />
        </MockQuicksandProvider>,
      );

      expect(screen.getByTestId('show-mileage-setting')).toHaveTextContent(
        'true',
      );
      expect(screen.getByTestId('mileage-enabled')).toHaveTextContent('true');
    });

    it('should pass mileage props correctly when showMileageTrackingSetting is true but mileageTrackingEnabled is false', () => {
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer
            {...defaultProps}
            showMileageTrackingSetting
            mileageTrackingEnabled={false}
          />
        </MockQuicksandProvider>,
      );

      expect(screen.getByTestId('show-mileage-setting')).toHaveTextContent(
        'true',
      );
      expect(screen.getByTestId('mileage-enabled')).toHaveTextContent('false');
    });

    it('should pass mileageTrackingVersion prop to EditGeoLocationsContainer', () => {
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer
            {...defaultProps}
            showMileageTrackingSetting
            mileageTrackingEnabled
            mileageTrackingVersion="5"
          />
        </MockQuicksandProvider>,
      );

      expect(
        screen.getByTestId('edit-geo-locations-container'),
      ).toBeInTheDocument();
    });

    it('should sync mileage tracking state when trowser opens', () => {
      const { rerender } = render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer
            {...defaultProps}
            open={false}
            showMileageTrackingSetting
            mileageTrackingEnabled
          />
        </MockQuicksandProvider>,
      );

      // Open trowser
      rerender(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer
            {...defaultProps}
            open
            showMileageTrackingSetting
            mileageTrackingEnabled
          />
        </MockQuicksandProvider>,
      );

      expect(screen.getByTestId('mileage-enabled')).toHaveTextContent('true');
    });

    it('should include mileageTrackingEnabled in save when value changes and version is valid', async () => {
      const mockRefetch = jest.fn();
      const mockOnClose = jest.fn();

      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer
            {...defaultProps}
            onClose={mockOnClose}
            refetchQlSettings={mockRefetch}
            showMileageTrackingSetting
            mileageTrackingEnabled
            mileageTrackingVersion="5"
          />
        </MockQuicksandProvider>,
      );

      // Trigger mileage change
      const toggleButton = screen.getByTestId('toggle-mileage');
      fireEvent.click(toggleButton);

      // Click save
      const saveButton = screen.getByTestId('save-geo-locations-button');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateSettings).toHaveBeenCalledWith(
          expect.objectContaining({
            timesheetManagementSettings: expect.objectContaining({
              timesheet: expect.objectContaining({
                locationTracking: {
                  version: '1',
                  value: 'REQUIRED',
                },
                mileageTrackingEnabled: {
                  version: '5',
                  value: false,
                },
              }),
            }),
          }),
        );
      });
    });

    it('should enable save button when only mileage tracking changes', async () => {
      const mockRefetch = jest.fn();
      const mockOnClose = jest.fn();

      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer
            {...defaultProps}
            onClose={mockOnClose}
            refetchQlSettings={mockRefetch}
            showMileageTrackingSetting
            mileageTrackingEnabled={false}
            mileageTrackingVersion="5"
          />
        </MockQuicksandProvider>,
      );

      const saveButton = screen.getByTestId('save-geo-locations-button');

      // Initially disabled (no changes)
      expect(saveButton).toBeDisabled();
    });

    it('should include mileageTrackingEnabled in save even when version is 0', async () => {
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer
            {...defaultProps}
            showMileageTrackingSetting
            mileageTrackingEnabled={false}
            mileageTrackingVersion="0"
          />
        </MockQuicksandProvider>,
      );

      // Toggle mileage tracking
      const toggleButton = screen.getByTestId('toggle-mileage');
      fireEvent.click(toggleButton);

      // Click save
      const saveButton = screen.getByTestId('save-geo-locations-button');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateSettings).toHaveBeenCalledWith({
          timesheetManagementSettings: {
            timesheet: {
              locationTracking: {
                version: '1',
                value: 'REQUIRED',
              },
              mileageTrackingEnabled: {
                version: '0',
                value: true,
              },
            },
          },
        });
      });
    });

    it('should handle backend errors gracefully when version is invalid', async () => {
      const mockOnClose = jest.fn();

      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer
            {...defaultProps}
            onClose={mockOnClose}
            showMileageTrackingSetting
            mileageTrackingEnabled={false}
            mileageTrackingVersion="0"
          />
        </MockQuicksandProvider>,
      );

      // Component should render without throwing
      expect(
        screen.getByTestId('geo-locations-trowser-container'),
      ).toBeInTheDocument();

      // Should be able to interact with UI
      const toggleButton = screen.getByTestId('toggle-mileage');
      expect(toggleButton).toBeInTheDocument();
    });
  });

  describe('Geofencing Props', () => {
    it('should pass showGeofenceSetting prop to EditGeoLocationsContainer', () => {
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer {...defaultProps} showGeofenceSetting />
        </MockQuicksandProvider>,
      );

      expect(screen.getByTestId('show-geofence-setting')).toHaveTextContent(
        'true',
      );
    });

    it('should pass showGeofenceSetting as false when not provided', () => {
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer {...defaultProps} />
        </MockQuicksandProvider>,
      );

      expect(screen.getByTestId('show-geofence-setting')).toHaveTextContent(
        'false',
      );
    });

    it('should pass geofencingEnabled prop to EditGeoLocationsContainer', () => {
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer
            {...defaultProps}
            showGeofenceSetting
            geofencingEnabled
          />
        </MockQuicksandProvider>,
      );

      expect(screen.getByTestId('geofencing-enabled')).toHaveTextContent(
        'true',
      );
    });

    it('should pass geofencingEnabled as false when not provided', () => {
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer {...defaultProps} />
        </MockQuicksandProvider>,
      );

      expect(screen.getByTestId('geofencing-enabled')).toHaveTextContent(
        'false',
      );
    });

    it('should pass both geofence props correctly when provided', () => {
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer
            {...defaultProps}
            showGeofenceSetting
            geofencingEnabled
          />
        </MockQuicksandProvider>,
      );

      expect(screen.getByTestId('show-geofence-setting')).toHaveTextContent(
        'true',
      );
      expect(screen.getByTestId('geofencing-enabled')).toHaveTextContent(
        'true',
      );
    });

    it('should pass geofence props correctly when showGeofenceSetting is true but geofencingEnabled is false', () => {
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer
            {...defaultProps}
            showGeofenceSetting
            geofencingEnabled={false}
          />
        </MockQuicksandProvider>,
      );

      expect(screen.getByTestId('show-geofence-setting')).toHaveTextContent(
        'true',
      );
      expect(screen.getByTestId('geofencing-enabled')).toHaveTextContent(
        'false',
      );
    });

    it('should sync geofencing state when trowser opens', () => {
      const { rerender } = render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer
            {...defaultProps}
            open={false}
            showGeofenceSetting
            geofencingEnabled
          />
        </MockQuicksandProvider>,
      );

      // Open trowser
      rerender(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer
            {...defaultProps}
            open
            showGeofenceSetting
            geofencingEnabled
          />
        </MockQuicksandProvider>,
      );

      expect(screen.getByTestId('geofencing-enabled')).toHaveTextContent(
        'true',
      );
    });

    it('should enable save button when only geofencing changes', () => {
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer
            {...defaultProps}
            showGeofenceSetting
            geofencingEnabled={false}
            geofencingVersion="5"
          />
        </MockQuicksandProvider>,
      );

      const saveButton = screen.getByTestId('save-geo-locations-button');

      // Initially disabled (no changes)
      expect(saveButton).toBeDisabled();

      // Toggle geofencing
      const toggleButton = screen.getByTestId('toggle-geofencing');
      fireEvent.click(toggleButton);

      // Now save button should be enabled
      expect(saveButton).not.toBeDisabled();
    });

    it('should include geofenceSettings in save when geofencing value changes', async () => {
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer
            {...defaultProps}
            showGeofenceSetting
            geofencingEnabled={false}
            geofencingVersion="5"
          />
        </MockQuicksandProvider>,
      );

      // Toggle geofencing
      const toggleButton = screen.getByTestId('toggle-geofencing');
      fireEvent.click(toggleButton);

      // Click save
      const saveButton = screen.getByTestId('save-geo-locations-button');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateSettings).toHaveBeenCalledWith({
          geofenceSettings: {
            geofenceEnabled: {
              version: '5',
              value: true,
            },
          },
        });
      });
    });

    it('should include geofenceSettings with version 0 when geofencing changes', async () => {
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer
            {...defaultProps}
            showGeofenceSetting
            geofencingEnabled
            geofencingVersion="0"
          />
        </MockQuicksandProvider>,
      );

      // Toggle geofencing off
      const toggleButton = screen.getByTestId('toggle-geofencing');
      fireEvent.click(toggleButton);

      // Click save
      const saveButton = screen.getByTestId('save-geo-locations-button');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateSettings).toHaveBeenCalledWith({
          geofenceSettings: {
            geofenceEnabled: {
              version: '0',
              value: false,
            },
          },
        });
      });
    });

    it('should include both timesheetManagementSettings and geofenceSettings when both change', async () => {
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer
            {...defaultProps}
            showGeofenceSetting
            geofencingEnabled={false}
            geofencingVersion="5"
          />
        </MockQuicksandProvider>,
      );

      // Change location tracking
      const changeButton = screen.getByTestId('change-to-optional');
      fireEvent.click(changeButton);

      // Toggle geofencing
      const toggleButton = screen.getByTestId('toggle-geofencing');
      fireEvent.click(toggleButton);

      // Click save
      const saveButton = screen.getByTestId('save-geo-locations-button');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateSettings).toHaveBeenCalledWith({
          timesheetManagementSettings: {
            timesheet: {
              locationTracking: {
                version: '1',
                value: 'OPTIONAL',
              },
            },
          },
          geofenceSettings: {
            geofenceEnabled: {
              version: '5',
              value: true,
            },
          },
        });
      });
    });

    it('should not include geofenceSettings in save when geofencing has not changed', async () => {
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer
            {...defaultProps}
            showGeofenceSetting
            geofencingEnabled
            geofencingVersion="5"
          />
        </MockQuicksandProvider>,
      );

      // Only change location tracking, not geofencing
      const changeButton = screen.getByTestId('change-to-optional');
      fireEvent.click(changeButton);

      // Click save
      const saveButton = screen.getByTestId('save-geo-locations-button');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateSettings).toHaveBeenCalledWith({
          timesheetManagementSettings: {
            timesheet: {
              locationTracking: {
                version: '1',
                value: 'OPTIONAL',
              },
            },
          },
        });
      });

      // Verify geofenceSettings was not included
      expect(mockUpdateSettings).not.toHaveBeenCalledWith(
        expect.objectContaining({
          geofenceSettings: expect.anything(),
        }),
      );
    });

    it('should show unsaved changes modal when closing with geofencing changes', () => {
      const onClose = jest.fn();
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer
            {...defaultProps}
            onClose={onClose}
            showGeofenceSetting
            geofencingEnabled={false}
            geofencingVersion="5"
          />
        </MockQuicksandProvider>,
      );

      // Toggle geofencing
      const toggleButton = screen.getByTestId('toggle-geofencing');
      fireEvent.click(toggleButton);

      // Click cancel button
      const cancelButton = screen.getByTestId('trowser-cancel-button');
      fireEvent.click(cancelButton);

      // Modal should be shown
      expect(
        screen.getByTestId('geo-locations-unsaved-changes-modal'),
      ).toBeInTheDocument();

      // onClose should NOT be called yet
      expect(onClose).not.toHaveBeenCalled();
    });

    it('should include all three settings when location, mileage, and geofencing all change', async () => {
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer
            {...defaultProps}
            showMileageTrackingSetting
            mileageTrackingEnabled={false}
            mileageTrackingVersion="3"
            showGeofenceSetting
            geofencingEnabled={false}
            geofencingVersion="5"
          />
        </MockQuicksandProvider>,
      );

      // Change location tracking
      const changeButton = screen.getByTestId('change-to-optional');
      fireEvent.click(changeButton);

      // Toggle mileage
      const toggleMileage = screen.getByTestId('toggle-mileage');
      fireEvent.click(toggleMileage);

      // Toggle geofencing
      const toggleGeofencing = screen.getByTestId('toggle-geofencing');
      fireEvent.click(toggleGeofencing);

      // Click save
      const saveButton = screen.getByTestId('save-geo-locations-button');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateSettings).toHaveBeenCalledWith({
          timesheetManagementSettings: {
            timesheet: {
              locationTracking: {
                version: '1',
                value: 'OPTIONAL',
              },
              mileageTrackingEnabled: {
                version: '3',
                value: true,
              },
            },
          },
          geofenceSettings: {
            geofenceEnabled: {
              version: '5',
              value: true,
            },
          },
        });
      });
    });
  });

  describe('Setup Notifications Click Handler', () => {
    it('should show unsaved changes modal when clicking setup notifications with unsaved changes', () => {
      const onClose = jest.fn();
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer
            {...defaultProps}
            onClose={onClose}
            showGeofenceSetting
            geofencingEnabled
            geofencingVersion="5"
          />
        </MockQuicksandProvider>,
      );

      // Make a change to create unsaved changes
      const changeButton = screen.getByTestId('change-to-optional');
      fireEvent.click(changeButton);

      // Click setup notifications
      const setupButton = screen.getByTestId('setup-notifications');
      fireEvent.click(setupButton);

      // Modal should be shown
      expect(
        screen.getByTestId('geo-locations-unsaved-changes-modal'),
      ).toBeInTheDocument();

      // onClose should NOT be called yet
      expect(onClose).not.toHaveBeenCalled();
    });

    it('should close trowser when clicking setup notifications without unsaved changes', () => {
      const onClose = jest.fn();
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer
            {...defaultProps}
            onClose={onClose}
            showGeofenceSetting
            geofencingEnabled
            geofencingVersion="5"
          />
        </MockQuicksandProvider>,
      );

      // Click setup notifications without making any changes
      const setupButton = screen.getByTestId('setup-notifications');
      fireEvent.click(setupButton);

      // Modal should NOT be shown
      expect(
        screen.queryByTestId('geo-locations-unsaved-changes-modal'),
      ).not.toBeInTheDocument();

      // onClose should be called directly
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onScrollToNotificationsSection after closing without unsaved changes when geofencing is enabled', () => {
      const onClose = jest.fn();
      const onScrollToNotificationsSection = jest.fn();
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer
            {...defaultProps}
            onClose={onClose}
            showGeofenceSetting
            geofencingEnabled
            geofencingVersion="5"
            onScrollToNotificationsSection={onScrollToNotificationsSection}
          />
        </MockQuicksandProvider>,
      );

      const setupButton = screen.getByTestId('setup-notifications');
      fireEvent.click(setupButton);

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onScrollToNotificationsSection).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(onScrollToNotificationsSection).toHaveBeenCalledTimes(1);
    });

    it('should NOT call onScrollToNotificationsSection when geofencing is disabled', () => {
      const onClose = jest.fn();
      const onScrollToNotificationsSection = jest.fn();
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer
            {...defaultProps}
            onClose={onClose}
            showGeofenceSetting
            geofencingEnabled={false}
            geofencingVersion="5"
            onScrollToNotificationsSection={onScrollToNotificationsSection}
          />
        </MockQuicksandProvider>,
      );

      const setupButton = screen.getByTestId('setup-notifications');
      fireEvent.click(setupButton);

      expect(onClose).toHaveBeenCalledTimes(1);

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(onScrollToNotificationsSection).not.toHaveBeenCalled();
    });
  });

  describe("Don't Save - Geofence Reset", () => {
    it("should reset geofenceEnabled form value to original prop on Don't Save", () => {
      const onClose = jest.fn();
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer
            {...defaultProps}
            onClose={onClose}
            showGeofenceSetting
            geofencingEnabled={false}
            geofencingVersion="5"
          />
        </MockQuicksandProvider>,
      );

      // Toggle geofencing on (now differs from original prop)
      fireEvent.click(screen.getByTestId('toggle-geofencing'));

      // Cancel to show modal
      fireEvent.click(screen.getByTestId('trowser-cancel-button'));

      // Click Don't Save
      fireEvent.click(screen.getByTestId('unsaved-modal-dont-save'));

      // Should reset parent form's geofenceEnabled to original value (false)
      expect(mockSetValue).toHaveBeenCalledWith('geofenceEnabled', false, {
        shouldValidate: false,
        shouldDirty: false,
      });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("should scroll to notifications on Don't Save when pending and geofencing was originally enabled", () => {
      const onClose = jest.fn();
      const onScrollToNotificationsSection = jest.fn();
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer
            {...defaultProps}
            onClose={onClose}
            showGeofenceSetting
            geofencingEnabled
            geofencingVersion="5"
            onScrollToNotificationsSection={onScrollToNotificationsSection}
          />
        </MockQuicksandProvider>,
      );

      // Make a change to trigger unsaved modal
      fireEvent.click(screen.getByTestId('change-to-optional'));

      // Click "Setup Notifications" (sets pendingScrollToNotificationsRef)
      fireEvent.click(screen.getByTestId('setup-notifications'));

      // Click Don't Save on modal
      fireEvent.click(screen.getByTestId('unsaved-modal-dont-save'));

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onScrollToNotificationsSection).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(onScrollToNotificationsSection).toHaveBeenCalledTimes(1);
    });

    it("should NOT scroll to notifications on Don't Save when geofencing was originally disabled", () => {
      const onClose = jest.fn();
      const onScrollToNotificationsSection = jest.fn();
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer
            {...defaultProps}
            onClose={onClose}
            showGeofenceSetting
            geofencingEnabled={false}
            geofencingVersion="5"
            onScrollToNotificationsSection={onScrollToNotificationsSection}
          />
        </MockQuicksandProvider>,
      );

      // Toggle geofencing on (creates unsaved change)
      fireEvent.click(screen.getByTestId('toggle-geofencing'));

      // Click "Setup Notifications" (sets pendingScrollToNotificationsRef)
      fireEvent.click(screen.getByTestId('setup-notifications'));

      // Click Don't Save on modal
      fireEvent.click(screen.getByTestId('unsaved-modal-dont-save'));

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Should NOT scroll because original geofencingEnabled was false
      expect(onScrollToNotificationsSection).not.toHaveBeenCalled();
    });
  });

  describe('Scroll to Notifications on Save Success', () => {
    it('should scroll to notifications after successful save when pending and geofencing enabled', async () => {
      const onClose = jest.fn();
      const onScrollToNotificationsSection = jest.fn();
      const refetchQlSettings = jest.fn();
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer
            {...defaultProps}
            onClose={onClose}
            refetchQlSettings={refetchQlSettings}
            showGeofenceSetting
            geofencingEnabled
            geofencingVersion="5"
            onScrollToNotificationsSection={onScrollToNotificationsSection}
          />
        </MockQuicksandProvider>,
      );

      // Make a change
      fireEvent.click(screen.getByTestId('change-to-optional'));

      // Click "Setup Notifications" to set pending flag and show modal
      fireEvent.click(screen.getByTestId('setup-notifications'));

      // Click "Save" on modal
      fireEvent.click(screen.getByTestId('unsaved-modal-save'));

      // Trigger onSuccess
      await waitFor(() => {
        mockOnSuccess();
      });

      expect(onClose).toHaveBeenCalled();
      expect(onScrollToNotificationsSection).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(onScrollToNotificationsSection).toHaveBeenCalledTimes(1);
    });

    it('should NOT scroll to notifications after successful save when geofencing is disabled', async () => {
      const onClose = jest.fn();
      const onScrollToNotificationsSection = jest.fn();
      const refetchQlSettings = jest.fn();
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer
            {...defaultProps}
            onClose={onClose}
            refetchQlSettings={refetchQlSettings}
            showGeofenceSetting
            geofencingEnabled
            geofencingVersion="5"
            onScrollToNotificationsSection={onScrollToNotificationsSection}
          />
        </MockQuicksandProvider>,
      );

      // Toggle geofencing OFF and change location (both create unsaved changes)
      fireEvent.click(screen.getByTestId('toggle-geofencing'));
      fireEvent.click(screen.getByTestId('change-to-optional'));

      // Click "Setup Notifications" to set pending flag and show modal
      fireEvent.click(screen.getByTestId('setup-notifications'));

      // Click "Save" on modal
      fireEvent.click(screen.getByTestId('unsaved-modal-save'));

      // Trigger onSuccess
      await waitFor(() => {
        mockOnSuccess();
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // selectedGeofencing is false so should NOT scroll
      expect(onScrollToNotificationsSection).not.toHaveBeenCalled();
    });

    it('should NOT scroll to notifications after save when pending flag was not set', async () => {
      const onClose = jest.fn();
      const onScrollToNotificationsSection = jest.fn();
      const refetchQlSettings = jest.fn();
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer
            {...defaultProps}
            onClose={onClose}
            refetchQlSettings={refetchQlSettings}
            showGeofenceSetting
            geofencingEnabled
            geofencingVersion="5"
            onScrollToNotificationsSection={onScrollToNotificationsSection}
          />
        </MockQuicksandProvider>,
      );

      // Change setting and save directly (not via setup notifications)
      fireEvent.click(screen.getByTestId('change-to-optional'));
      fireEvent.click(screen.getByTestId('save-geo-locations-button'));

      // Trigger onSuccess
      await waitFor(() => {
        mockOnSuccess();
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(onScrollToNotificationsSection).not.toHaveBeenCalled();
    });
  });

  describe('Modal onClose clears pending scroll flag', () => {
    it('should clear pending scroll flag when modal is dismissed via close button', () => {
      const onClose = jest.fn();
      const onScrollToNotificationsSection = jest.fn();
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer
            {...defaultProps}
            onClose={onClose}
            showGeofenceSetting
            geofencingEnabled
            geofencingVersion="5"
            onScrollToNotificationsSection={onScrollToNotificationsSection}
          />
        </MockQuicksandProvider>,
      );

      // Make a change
      fireEvent.click(screen.getByTestId('change-to-optional'));

      // Click setup notifications (sets pending flag + shows modal)
      fireEvent.click(screen.getByTestId('setup-notifications'));

      // Dismiss modal via close button (NOT "Don't Save")
      fireEvent.click(screen.getByTestId('unsaved-modal-close'));

      // Modal should be hidden
      expect(
        screen.queryByTestId('geo-locations-unsaved-changes-modal'),
      ).not.toBeInTheDocument();

      // Now cancel without changes (trowser still has the unsaved change, so cancel shows modal again)
      fireEvent.click(screen.getByTestId('trowser-cancel-button'));

      // Click Don't Save
      fireEvent.click(screen.getByTestId('unsaved-modal-dont-save'));

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Should NOT scroll because pending flag was cleared by modal close
      expect(onScrollToNotificationsSection).not.toHaveBeenCalled();
    });
  });

  describe('Geofence form value sync', () => {
    it('should call setValue on geofenceEnabled when geofencing changes', () => {
      render(
        <MockQuicksandProvider>
          <GeoLocationsTrowserContainer
            {...defaultProps}
            showGeofenceSetting
            geofencingEnabled={false}
            geofencingVersion="5"
          />
        </MockQuicksandProvider>,
      );

      fireEvent.click(screen.getByTestId('toggle-geofencing'));

      expect(mockSetValue).toHaveBeenCalledWith('geofenceEnabled', true, {
        shouldValidate: false,
        shouldDirty: false,
      });
    });
  });
});

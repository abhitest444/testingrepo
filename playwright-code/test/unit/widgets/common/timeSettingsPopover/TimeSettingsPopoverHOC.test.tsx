import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from '@testing-library/react';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import {
  TimeSettingsPopoverHOC,
  TimeSettingsPopoverHOCProps,
} from 'src/js/widgets/common/timeSettingsPopover/TimeSettingsPopoverHOC';
import { useCompanySettings } from 'src/js/service/hooks/settings/useCompanySettings';
import { useUxPreferences } from 'src/js/service/utils/useUXPreferences';
import {
  useGetEntitlements,
  computeHasPayroll,
} from 'src/js/service/hooks/entitlements/useGetEntitlements';
import {
  useFeatureFlag,
  useHasAdminAccess,
} from 'src/js/service/utils/sandboxUtils';
import { useHasProjects } from 'src/js/service/utils/projectsUtils';
import { useSetSettings } from 'src/js/service/hooks/settings/useSetSettings';
import { useSetQLSettings } from 'src/js/service/hooks/settings/useSetQLSettings';
import { useTimeSettingsPopoverForm } from 'src/js/widgets/common/timeSettingsPopover/useTimeSettingsPopoverForm';
import { computeCanEditSettings } from 'src/js/service/utils/useTimeTrackingAuthorization';
import { FEATURE_FLAGS } from 'src/js/common/constants';
import { TrackingPoints } from 'src/js/common/useClickTracking';

// Mock all the hooks and utilities
jest.mock('@payroll/quicksand');
jest.mock('src/js/service/hooks/settings/useCompanySettings');
jest.mock('src/js/service/utils/useUXPreferences');
jest.mock('src/js/service/hooks/entitlements/useGetEntitlements');
jest.mock('src/js/service/utils/sandboxUtils');
jest.mock('src/js/service/utils/projectsUtils');
jest.mock('src/js/service/hooks/settings/useSetSettings');
jest.mock('src/js/service/hooks/settings/useSetQLSettings');
jest.mock(
  'src/js/widgets/common/timeSettingsPopover/useTimeSettingsPopoverForm',
);
jest.mock('src/js/service/utils/useTimeTrackingAuthorization');
jest.mock(
  'src/js/widgets/common/timeSettingsPopover/TimeSettingsPopoverForm',
  () => ({
    TimeSettingsPopoverForm: ({
      trackingPoints,
    }: {
      trackingPoints: TrackingPoints;
    }) => (
      <div data-testid="time-settings-popover-form">
        <button onClick={() => trackingPoints.SAVE_SETTINGS}>Mock Form</button>
      </div>
    ),
  }),
);

// Mock validation functions
jest.mock(
  'src/js/widgets/common/timeSettingsPopover/useTimeSettingsPopoverForm',
  () => ({
    ...jest.requireActual(
      'src/js/widgets/common/timeSettingsPopover/useTimeSettingsPopoverForm',
    ),
    atLeastOneWeekdaySelected: jest.fn(),
    attemptingToHideWeekdayAlreadyWithData: jest.fn(),
    attemptingToHideFieldAlreadyWithData: jest.fn(),
    compareTimeSettingsPopoverFormState_toTimeTrackingSettings: jest.fn(),
    compareTimeSettingsPopoverFormState_toUxPreferenceHideWeekdaysData:
      jest.fn(),
    compareTimeSettingsPopoverFormState_toUxPreferenceHideTimeEntryFieldsData:
      jest.fn(),
    mapTimeSettingsPopoverFormState: jest.fn(),
    mapTimeSettingsPopoverFormState_forCompanySettingsMutation: jest.fn(),
    mapTimeSettingsPopoverFormState_forSettingsMutation: jest.fn(),
    mapTimeSettingsPopoverFormState_forUxPreferencesMutation_hideWeekdays:
      jest.fn(),
    mapTimeSettingsPopoverFormState_forUxPreferencesMutation_hideTimeEntryFields:
      jest.fn(),
    useTimeSettingsPopoverForm: jest.fn(),
  }),
);

const mockUseIntl = useIntl as jest.MockedFunction<typeof useIntl>;
const mockUseSandbox = useSandbox as jest.MockedFunction<typeof useSandbox>;
const mockUseTracking = useTracking as jest.MockedFunction<typeof useTracking>;
const mockUseCompanySettings = useCompanySettings as jest.MockedFunction<
  typeof useCompanySettings
>;
const mockUseUxPreferences = useUxPreferences as jest.MockedFunction<
  typeof useUxPreferences
>;
const mockUseGetEntitlements = useGetEntitlements as jest.MockedFunction<
  typeof useGetEntitlements
>;
const mockUseFeatureFlag = useFeatureFlag as jest.MockedFunction<
  typeof useFeatureFlag
>;
const mockUseHasAdminAccess = useHasAdminAccess as jest.MockedFunction<
  typeof useHasAdminAccess
>;
const mockUseHasProjects = useHasProjects as jest.MockedFunction<
  typeof useHasProjects
>;
const mockUseSetSettings = useSetSettings as jest.MockedFunction<
  typeof useSetSettings
>;
const mockUseSetQLSettings = useSetQLSettings as jest.MockedFunction<
  typeof useSetQLSettings
>;
const mockUseTimeSettingsPopoverForm =
  useTimeSettingsPopoverForm as jest.MockedFunction<
    typeof useTimeSettingsPopoverForm
  >;
const mockComputeCanEditSettings =
  computeCanEditSettings as jest.MockedFunction<typeof computeCanEditSettings>;
const mockComputeHasPayroll = computeHasPayroll as jest.MockedFunction<
  typeof computeHasPayroll
>;

// Import validation functions for mocking
const {
  atLeastOneWeekdaySelected,
  attemptingToHideWeekdayAlreadyWithData,
  attemptingToHideFieldAlreadyWithData,
  compareTimeSettingsPopoverFormState_toTimeTrackingSettings,
  compareTimeSettingsPopoverFormState_toUxPreferenceHideWeekdaysData,
  compareTimeSettingsPopoverFormState_toUxPreferenceHideTimeEntryFieldsData,
  mapTimeSettingsPopoverFormState,
  mapTimeSettingsPopoverFormState_forCompanySettingsMutation,
  mapTimeSettingsPopoverFormState_forSettingsMutation,
  mapTimeSettingsPopoverFormState_forUxPreferencesMutation_hideWeekdays,
  mapTimeSettingsPopoverFormState_forUxPreferencesMutation_hideTimeEntryFields,
} = require('src/js/widgets/common/timeSettingsPopover/useTimeSettingsPopoverForm');

describe('TimeSettingsPopoverHOC', () => {
  const mockTrackingPoints: TrackingPoints = {
    SETTINGS_GEAR: {
      org: 'test',
      purpose: 'test',
      scope: 'test',
      scope_area: 'test',
      action: 'test',
      object: 'test',
      ui_action: 'test',
      ui_object: 'test',
    },
    SAVE_SETTINGS: {
      org: 'test',
      purpose: 'test',
      scope: 'test',
      scope_area: 'test',
      action: 'test',
      object: 'test',
      ui_action: 'test',
      ui_object: 'test',
    },
  };

  const defaultProps: TimeSettingsPopoverHOCProps = {
    open: true,
    setOpen: jest.fn(),
    onSaveSuccess: jest.fn(),
    targetElement: document.createElement('div'),
    fieldsWithData: {
      hasServiceFieldData: false,
      hasBillingFieldData: false,
      hasClassFieldData: false,
      hasLocationFieldData: false,
      hasPayTypeFieldData: false,
      hasCostRateFieldData: false,
      hasTaxableFieldData: false,
    },
    isSettingsAccessible: true,
    weekdaysWithDurations: [],
    showDaysOfWeekPreferences: false,
    trackingPoints: mockTrackingPoints,
    isTimeEntry: false,
  };

  const mockIntl = {
    formatMessage: jest.fn(({ id }: { id: string }) => id),
  };

  const mockTrack = jest.fn();
  const mockSandbox = {} as any;
  const mockRefetchSettings = jest.fn();
  const mockGetPreference = jest.fn();
  const mockSetPreference = jest.fn();
  const mockSetSettings = jest.fn();
  const mockUpdateCompanySettings = jest.fn();
  const mockFormMethods = {
    reset: jest.fn(),
    handleSubmit: jest.fn(
      (onSubmit) => () => onSubmit({ mockFormState: true }),
    ),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock returns
    mockUseIntl.mockReturnValue(mockIntl);
    mockUseTracking.mockReturnValue(mockTrack);
    mockUseSandbox.mockReturnValue(mockSandbox);
    mockUseTimeSettingsPopoverForm.mockReturnValue(mockFormMethods);
    mockComputeCanEditSettings.mockResolvedValue(true);
    mockComputeHasPayroll.mockReturnValue(true);
    mockUseHasAdminAccess.mockReturnValue(true);
    mockUseHasProjects.mockReturnValue(true);
    mockUseFeatureFlag.mockReturnValue(false);

    mockUseCompanySettings.mockReturnValue({
      settingsData: {
        isServiceFieldEnabled: true,
        isBillingFieldEnabled: true,
        isClassEnabled: true,
        isLocationEnabled: true,
        isTaxableFieldEnabled: true,
      },
      refetch: mockRefetchSettings,
      loading: false,
      error: undefined,
      qboSettings: {
        entityVersion: 'v1',
        isClassEnabled: true,
        isLocationEnabled: true,
        isServiceFieldEnabled: true,
        isBillingFieldEnabled: true,
        isTaxableFieldEnabled: true,
      },
      qlSettings: {
        isBillingFieldEnabled: { version: 'v1' },
        useItemForTime: { version: 'v1' },
      },
    } as any);

    mockUseUxPreferences.mockReturnValue({
      data: {
        'hide-weekdays-timesheet': {
          isSundayHidden: false,
          isMondayHidden: false,
          isTuesdayHidden: false,
          isWednesdayHidden: false,
          isThursdayHidden: false,
          isFridayHidden: false,
          isSaturdayHidden: false,
        },
        'hide-time-entry-fields': {
          isClassFieldEnabled: true,
          isProjectFieldEnabled: true,
          isLocationFieldEnabled: true,
          isPayTypeFieldEnabled: true,
          isCostRateFieldEnabled: true,
          isTaxableFieldEnabled: true,
        },
      },
      getPreference: mockGetPreference,
      setPreference: mockSetPreference,
      loading: false,
      error: undefined,
      loadPreferences: jest.fn(),
      setPreferences: jest.fn(),
    } as any);

    mockUseGetEntitlements.mockReturnValue({
      data: [],
      loading: false,
      error: undefined,
    } as any);

    mockUseSetSettings.mockReturnValue([mockSetSettings, { loading: false }]);
    mockUseSetQLSettings.mockReturnValue([
      mockUpdateCompanySettings,
      { loading: false },
    ]);

    // Setup validation mocks
    (atLeastOneWeekdaySelected as jest.Mock).mockReturnValue(true);
    (attemptingToHideWeekdayAlreadyWithData as jest.Mock).mockReturnValue(
      false,
    );
    (attemptingToHideFieldAlreadyWithData as jest.Mock).mockReturnValue(false);
    (
      compareTimeSettingsPopoverFormState_toTimeTrackingSettings as jest.Mock
    ).mockReturnValue(false);
    (
      compareTimeSettingsPopoverFormState_toUxPreferenceHideWeekdaysData as jest.Mock
    ).mockReturnValue(false);
    (
      compareTimeSettingsPopoverFormState_toUxPreferenceHideTimeEntryFieldsData as jest.Mock
    ).mockReturnValue(false);
    (mapTimeSettingsPopoverFormState as jest.Mock).mockReturnValue({});
  });

  afterEach(() => {
    cleanup();
  });

  describe('Component Rendering', () => {
    it('renders popover when open is true', () => {
      render(<TimeSettingsPopoverHOC {...defaultProps} />);

      expect(
        screen.getByText('singletime.settings.popover.title'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('singletime.settings.popover.button.label'),
      ).toBeInTheDocument();
    });

    it('does not render popover content when open is false', () => {
      render(<TimeSettingsPopoverHOC {...defaultProps} open={false} />);

      // The popover component itself might still be in DOM but closed
      expect(
        screen.queryByTestId('time-settings-popover-form'),
      ).not.toBeInTheDocument();
    });

    it('shows loading state when data is loading', () => {
      mockUseCompanySettings.mockReturnValue({
        settingsData: undefined,
        refetch: mockRefetchSettings,
        loading: true,
        error: undefined,
        qboSettings: undefined,
        qlSettings: undefined,
      } as any);

      render(<TimeSettingsPopoverHOC {...defaultProps} />);

      expect(screen.getAllByLabelText('Loading')).toHaveLength(1);
    });

    it('shows form when data is loaded', async () => {
      render(<TimeSettingsPopoverHOC {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.getByTestId('time-settings-popover-form'),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Data Fetching on Open', () => {
    it('fetches data when popover opens', () => {
      const { rerender } = render(
        <TimeSettingsPopoverHOC {...defaultProps} open={false} />,
      );

      rerender(<TimeSettingsPopoverHOC {...defaultProps} open />);

      expect(mockTrack).toHaveBeenCalledWith(mockTrackingPoints.SETTINGS_GEAR);
      expect(mockRefetchSettings).toHaveBeenCalled();
      expect(mockGetPreference).toHaveBeenCalledWith('hide-weekdays-timesheet');
      expect(mockGetPreference).toHaveBeenCalledWith('hide-time-entry-fields');
    });

    it('resets form when settings and ux preferences are available', () => {
      const mappedFormState = { mapped: 'state' };
      (mapTimeSettingsPopoverFormState as jest.Mock).mockReturnValue(
        mappedFormState,
      );

      render(<TimeSettingsPopoverHOC {...defaultProps} />);

      expect(mockFormMethods.reset).toHaveBeenCalledWith(mappedFormState);
    });
  });

  describe('Error Handling', () => {
    it('displays error message when validation fails', async () => {
      (atLeastOneWeekdaySelected as jest.Mock).mockReturnValue(false);

      render(<TimeSettingsPopoverHOC {...defaultProps} />);

      const saveButton = screen.getByRole('button', {
        name: 'singletime.settings.popover.button.label',
      });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText('settings.daysofweek.at.least.one.required'),
        ).toBeInTheDocument();
      });
    });

    it('dismisses error message when close button is clicked', async () => {
      mockUseSetSettings.mockReturnValue([mockSetSettings, { loading: false }]);

      render(<TimeSettingsPopoverHOC {...defaultProps} />);

      // Simulate error
      const mockCall = (mockUseSetSettings as any).mock.calls[0];
      const onError = mockCall?.[1]?.onError || jest.fn();
      onError('Test error message');

      const dismissButtons = screen.getAllByRole('button', { name: /close/i });
      fireEvent.click(dismissButtons[0]);

      await waitFor(() => {
        expect(
          screen.queryByText('Test error message'),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Validation Cases', () => {
    let component: any;

    beforeEach(() => {
      component = render(<TimeSettingsPopoverHOC {...defaultProps} />);
    });

    it('validates that at least one weekday is selected', async () => {
      (atLeastOneWeekdaySelected as jest.Mock).mockReturnValue(false);

      const saveButtons = screen.getAllByRole('button', {
        name: 'singletime.settings.popover.button.label',
      });
      fireEvent.click(saveButtons[0]);

      await waitFor(() => {
        expect(
          screen.getByText('settings.daysofweek.at.least.one.required'),
        ).toBeInTheDocument();
      });
    });

    it('validates that weekdays with data cannot be hidden', async () => {
      (atLeastOneWeekdaySelected as jest.Mock).mockReturnValue(true);
      (attemptingToHideWeekdayAlreadyWithData as jest.Mock).mockReturnValue(
        true,
      );

      const saveButtons = screen.getAllByRole('button', {
        name: 'singletime.settings.popover.button.label',
      });
      fireEvent.click(saveButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('weekdays.can.not.hide')).toBeInTheDocument();
      });
    });

    it('validates that fields with data cannot be hidden when settings are accessible', async () => {
      (atLeastOneWeekdaySelected as jest.Mock).mockReturnValue(true);
      (attemptingToHideWeekdayAlreadyWithData as jest.Mock).mockReturnValue(
        false,
      );
      (attemptingToHideFieldAlreadyWithData as jest.Mock).mockReturnValue(true);

      const saveButtons = screen.getAllByRole('button', {
        name: 'singletime.settings.popover.button.label',
      });
      fireEvent.click(saveButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('fields.can.not.hide')).toBeInTheDocument();
      });
    });

    it('does not validate field hiding when settings are not accessible', async () => {
      // Clean up any existing DOM and reset all mocks
      cleanup();
      jest.clearAllMocks();

      // Setup fresh mock implementations
      mockUseIntl.mockReturnValue(mockIntl);
      mockUseTracking.mockReturnValue(mockTrack);
      mockUseSandbox.mockReturnValue(mockSandbox);
      mockUseTimeSettingsPopoverForm.mockReturnValue(mockFormMethods);
      mockComputeCanEditSettings.mockResolvedValue(true);
      mockComputeHasPayroll.mockReturnValue(true);
      mockUseHasAdminAccess.mockReturnValue(true);
      mockUseHasProjects.mockReturnValue(true);
      mockUseFeatureFlag.mockReturnValue(false);

      mockUseCompanySettings.mockReturnValue({
        settingsData: {
          isServiceFieldEnabled: true,
          isBillingFieldEnabled: true,
          isClassEnabled: true,
          isLocationEnabled: true,
          isTaxableFieldEnabled: true,
        },
        refetch: mockRefetchSettings,
        loading: false,
        error: undefined,
        qboSettings: {
          entityVersion: 'v1',
          isClassEnabled: true,
          isLocationEnabled: true,
          isServiceFieldEnabled: true,
          isBillingFieldEnabled: true,
          isTaxableFieldEnabled: true,
        },
        qlSettings: {
          isBillingFieldEnabled: { version: 'v1' },
          useItemForTime: { version: 'v1' },
        },
      } as any);

      mockUseUxPreferences.mockReturnValue({
        data: {
          'hide-weekdays-timesheet': {
            isSundayHidden: false,
            isMondayHidden: false,
            isTuesdayHidden: false,
            isWednesdayHidden: false,
            isThursdayHidden: false,
            isFridayHidden: false,
            isSaturdayHidden: false,
          },
          'hide-time-entry-fields': {
            isClassFieldEnabled: true,
            isProjectFieldEnabled: true,
            isLocationFieldEnabled: true,
            isPayTypeFieldEnabled: true,
            isCostRateFieldEnabled: true,
            isTaxableFieldEnabled: true,
          },
        },
        getPreference: mockGetPreference,
        setPreference: mockSetPreference,
        loading: false,
        error: undefined,
        loadPreferences: jest.fn(),
        setPreferences: jest.fn(),
      } as any);

      mockUseGetEntitlements.mockReturnValue({
        data: [],
        loading: false,
        error: undefined,
      } as any);

      mockUseSetSettings.mockReturnValue([mockSetSettings, { loading: false }]);
      mockUseSetQLSettings.mockReturnValue([
        mockUpdateCompanySettings,
        { loading: false },
      ]);

      const propsWithoutAccess = {
        ...defaultProps,
        isSettingsAccessible: false,
      };

      (atLeastOneWeekdaySelected as jest.Mock).mockReturnValue(true);
      (attemptingToHideWeekdayAlreadyWithData as jest.Mock).mockReturnValue(
        false,
      );
      (attemptingToHideFieldAlreadyWithData as jest.Mock).mockReturnValue(true);

      // Ensure no mutations are triggered to keep test focused
      (
        compareTimeSettingsPopoverFormState_toTimeTrackingSettings as jest.Mock
      ).mockReturnValue(false);
      (
        compareTimeSettingsPopoverFormState_toUxPreferenceHideWeekdaysData as jest.Mock
      ).mockReturnValue(false);
      (
        compareTimeSettingsPopoverFormState_toUxPreferenceHideTimeEntryFieldsData as jest.Mock
      ).mockReturnValue(false);
      (mapTimeSettingsPopoverFormState as jest.Mock).mockReturnValue({});

      const { container } = render(
        <TimeSettingsPopoverHOC {...propsWithoutAccess} />,
      );

      // Wait for component to stabilize
      await waitFor(() => {
        expect(
          screen.getByTestId('time-settings-popover-form'),
        ).toBeInTheDocument();
      });

      const saveButtons = screen.getAllByRole('button', {
        name: 'singletime.settings.popover.button.label',
      });
      fireEvent.click(saveButtons[0]);

      await waitFor(() => {
        // Check within this specific component container only
        const errorMessage = container.querySelector(
          '[data-automation-id="TimeSettingsPopoverHOCErrorPageMessage"]',
        );
        expect(errorMessage).toBeNull();

        // Verify the validation function was NOT called due to isSettingsAccessible: false (short-circuit behavior)
        expect(attemptingToHideFieldAlreadyWithData).not.toHaveBeenCalled();

        // But verify that other validations still run
        expect(atLeastOneWeekdaySelected).toHaveBeenCalled();
        expect(attemptingToHideWeekdayAlreadyWithData).toHaveBeenCalled();
      });
    });
  });

  describe('Settings Updates', () => {
    beforeEach(() => {
      (atLeastOneWeekdaySelected as jest.Mock).mockReturnValue(true);
      (attemptingToHideWeekdayAlreadyWithData as jest.Mock).mockReturnValue(
        false,
      );
      (attemptingToHideFieldAlreadyWithData as jest.Mock).mockReturnValue(
        false,
      );
    });

    it('updates company settings when employer settings feature is enabled', async () => {
      mockUseFeatureFlag.mockReturnValue(true);
      (
        compareTimeSettingsPopoverFormState_toTimeTrackingSettings as jest.Mock
      ).mockReturnValue(true);
      (
        mapTimeSettingsPopoverFormState_forCompanySettingsMutation as jest.Mock
      ).mockReturnValue({ mapped: 'company' });

      render(<TimeSettingsPopoverHOC {...defaultProps} />);

      const saveButtons = screen.getAllByRole('button', {
        name: 'singletime.settings.popover.button.label',
      });
      fireEvent.click(saveButtons[0]);

      await waitFor(() => {
        expect(mockUpdateCompanySettings).toHaveBeenCalledWith({
          mapped: 'company',
        });
      });
    });

    it('updates regular settings when employer settings feature is disabled', async () => {
      mockUseFeatureFlag.mockReturnValue(false);
      (
        compareTimeSettingsPopoverFormState_toTimeTrackingSettings as jest.Mock
      ).mockReturnValue(true);
      (
        mapTimeSettingsPopoverFormState_forSettingsMutation as jest.Mock
      ).mockReturnValue({ mapped: 'regular' });

      render(<TimeSettingsPopoverHOC {...defaultProps} />);

      const saveButtons = screen.getAllByRole('button', {
        name: 'singletime.settings.popover.button.label',
      });
      fireEvent.click(saveButtons[0]);

      await waitFor(() => {
        expect(mockSetSettings).toHaveBeenCalledWith({ mapped: 'regular' });
      });
    });

    it('updates weekdays preferences when showDaysOfWeekPreferences is true', async () => {
      const propsWithWeekdays = {
        ...defaultProps,
        showDaysOfWeekPreferences: true,
      };
      (
        compareTimeSettingsPopoverFormState_toUxPreferenceHideWeekdaysData as jest.Mock
      ).mockReturnValue(true);
      (
        mapTimeSettingsPopoverFormState_forUxPreferencesMutation_hideWeekdays as jest.Mock
      ).mockReturnValue({ weekdays: 'mapped' });

      render(<TimeSettingsPopoverHOC {...propsWithWeekdays} />);

      const saveButtons = screen.getAllByRole('button', {
        name: 'singletime.settings.popover.button.label',
      });
      fireEvent.click(saveButtons[0]);

      await waitFor(() => {
        expect(mockSetPreference).toHaveBeenCalledWith(
          'hide-weekdays-timesheet',
          { weekdays: 'mapped' },
        );
      });
    });

    it('updates time entry fields preferences', async () => {
      (
        compareTimeSettingsPopoverFormState_toUxPreferenceHideTimeEntryFieldsData as jest.Mock
      ).mockReturnValue(true);
      (
        mapTimeSettingsPopoverFormState_forUxPreferencesMutation_hideTimeEntryFields as jest.Mock
      ).mockReturnValue({ fields: 'mapped' });

      render(<TimeSettingsPopoverHOC {...defaultProps} />);

      const saveButtons = screen.getAllByRole('button', {
        name: 'singletime.settings.popover.button.label',
      });
      fireEvent.click(saveButtons[0]);

      await waitFor(() => {
        expect(mockSetPreference).toHaveBeenCalledWith(
          'hide-time-entry-fields',
          { fields: 'mapped' },
        );
      });
    });
  });

  describe('Success Callbacks', () => {
    it('calls onSaveSuccess and closes popover on successful settings update when all conditions are met', async () => {
      const mockOnCompleted = jest.fn();
      const mockResult = {
        data: { updateCompany_Settings: { success: true } },
      } as any;

      mockUseSetSettings.mockReturnValue([
        mockSetSettings,
        { loading: false, onCompleted: mockOnCompleted } as any,
      ]);

      mockUseUxPreferences.mockReturnValue({
        data: {},
        getPreference: mockGetPreference,
        setPreference: mockSetPreference,
        loading: false, // UX preferences not loading
        error: undefined,
        loadPreferences: jest.fn(),
        setPreferences: jest.fn(),
      } as any);

      const { rerender } = render(<TimeSettingsPopoverHOC {...defaultProps} />);

      // Get the actual onCompleted callback passed to useSetSettings
      const settingsCall = mockUseSetSettings.mock.calls[0];
      const actualOnCompleted = settingsCall?.[0]?.onCompleted;

      // Simulate successful settings update
      if (actualOnCompleted) {
        actualOnCompleted(mockResult);
      }

      expect(defaultProps.onSaveSuccess).toHaveBeenCalled();
      expect(defaultProps.setOpen).toHaveBeenCalledWith(false);
    });

    it('does not call onSaveSuccess when company settings are still loading', async () => {
      const mockOnCompleted = jest.fn();
      const mockResult = { data: { success: true } } as any;

      mockUseSetSettings.mockReturnValue([
        mockSetSettings,
        { loading: false, onCompleted: mockOnCompleted } as any,
      ]);

      mockUseSetQLSettings.mockReturnValue([
        mockUpdateCompanySettings,
        { loading: true } as any, // Company settings still loading
      ]);

      render(<TimeSettingsPopoverHOC {...defaultProps} />);

      // Get the actual onCompleted callback
      const settingsCall = mockUseSetSettings.mock.calls[0];
      const actualOnCompleted = settingsCall?.[0]?.onCompleted;

      // Simulate successful settings update but company settings still loading
      if (actualOnCompleted) {
        actualOnCompleted(mockResult);
      }

      expect(defaultProps.onSaveSuccess).not.toHaveBeenCalled();
      expect(defaultProps.setOpen).not.toHaveBeenCalled();
    });

    it('calls onSaveSuccess and closes popover on successful QL settings update when all conditions are met', async () => {
      const mockOnSuccess = jest.fn();
      const mockResult = {
        successCode: 'SUCCESS',
        employerSettings: { id: '123' },
      } as any;

      mockUseSetQLSettings.mockReturnValue([
        mockUpdateCompanySettings,
        { loading: false, onSuccess: mockOnSuccess } as any,
      ]);

      mockUseUxPreferences.mockReturnValue({
        data: {},
        getPreference: mockGetPreference,
        setPreference: mockSetPreference,
        loading: false, // UX preferences not loading
        error: undefined,
        loadPreferences: jest.fn(),
        setPreferences: jest.fn(),
      } as any);

      mockUseSetSettings.mockReturnValue([
        mockSetSettings,
        { loading: false } as any, // Regular settings not loading
      ]);

      render(<TimeSettingsPopoverHOC {...defaultProps} />);

      // Get the actual onSuccess callback passed to useSetQLSettings
      const qlSettingsCall = mockUseSetQLSettings.mock.calls[0];
      const actualOnSuccess = qlSettingsCall?.[0]?.onSuccess;

      // Simulate successful QL settings update
      if (actualOnSuccess) {
        actualOnSuccess(mockResult);
      }

      expect(defaultProps.onSaveSuccess).toHaveBeenCalled();
      expect(defaultProps.setOpen).toHaveBeenCalledWith(false);
    });

    it('does not call onSaveSuccess when UX preferences are still loading', async () => {
      const mockOnSuccess = jest.fn();
      const mockResult = {
        successCode: 'SUCCESS',
        employerSettings: { id: '123' },
      } as any;

      mockUseSetQLSettings.mockReturnValue([
        mockUpdateCompanySettings,
        { loading: false, onSuccess: mockOnSuccess } as any,
      ]);

      mockUseUxPreferences.mockReturnValue({
        data: {},
        getPreference: mockGetPreference,
        setPreference: mockSetPreference,
        loading: true, // UX preferences still loading
        error: undefined,
        loadPreferences: jest.fn(),
        setPreferences: jest.fn(),
      } as any);

      render(<TimeSettingsPopoverHOC {...defaultProps} />);

      // Get the actual onSuccess callback
      const qlSettingsCall = mockUseSetQLSettings.mock.calls[0];
      const actualOnSuccess = qlSettingsCall?.[0]?.onSuccess;

      // Simulate successful QL settings update but UX preferences still loading
      if (actualOnSuccess) {
        actualOnSuccess(mockResult);
      }

      expect(defaultProps.onSaveSuccess).not.toHaveBeenCalled();
      expect(defaultProps.setOpen).not.toHaveBeenCalled();
    });

    it('calls onSaveSuccess and closes popover on successful UX preferences update', async () => {
      const mockOnSaveSuccess = jest.fn();

      mockUseUxPreferences.mockReturnValue({
        data: {
          'hide-weekdays-timesheet': {},
          'hide-time-entry-fields': {},
        },
        getPreference: mockGetPreference,
        setPreference: mockSetPreference,
        loading: false,
        error: undefined,
        loadPreferences: jest.fn(),
        setPreferences: jest.fn(),
      } as any);

      render(<TimeSettingsPopoverHOC {...defaultProps} />);

      // Get the actual onSaveSuccess callback passed to useUxPreferences
      const uxPreferencesCall = mockUseUxPreferences.mock.calls[0];
      const actualOnSaveSuccess = uxPreferencesCall?.[0]?.onSaveSuccess;

      // Simulate successful UX preferences update
      if (actualOnSaveSuccess) {
        actualOnSaveSuccess();
      }

      expect(defaultProps.onSaveSuccess).toHaveBeenCalled();
      expect(defaultProps.setOpen).toHaveBeenCalledWith(false);
    });
  });

  describe('Error Handling Callbacks', () => {
    it('handles errors from settings update and displays error message', async () => {
      const mockOnError = jest.fn();

      mockUseSetSettings.mockReturnValue([
        mockSetSettings,
        { loading: false, onError: mockOnError } as any,
      ]);

      render(<TimeSettingsPopoverHOC {...defaultProps} />);

      // Get the actual onError callback passed to useSetSettings
      const settingsCall = mockUseSetSettings.mock.calls[0];
      const actualOnError = settingsCall?.[0]?.onError;

      // Simulate error from settings update
      if (actualOnError) {
        actualOnError('Settings update failed');
      }

      await waitFor(() => {
        expect(screen.getByText('Settings update failed')).toBeInTheDocument();
      });
    });

    it('handles errors from QL settings update and displays error message', async () => {
      const mockOnError = jest.fn();

      mockUseSetQLSettings.mockReturnValue([
        mockUpdateCompanySettings,
        { loading: false, onError: mockOnError } as any,
      ]);

      render(<TimeSettingsPopoverHOC {...defaultProps} />);

      // Get the actual onError callback passed to useSetQLSettings
      const qlSettingsCall = mockUseSetQLSettings.mock.calls[0];
      const actualOnError = qlSettingsCall?.[0]?.onError;

      // Simulate error from QL settings update
      if (actualOnError) {
        actualOnError('QL settings update failed');
      }

      await waitFor(() => {
        expect(
          screen.getByText('QL settings update failed'),
        ).toBeInTheDocument();
      });
    });

    it('allows dismissing error messages', async () => {
      const mockOnError = jest.fn();

      mockUseSetSettings.mockReturnValue([
        mockSetSettings,
        { loading: false, onError: mockOnError } as any,
      ]);

      render(<TimeSettingsPopoverHOC {...defaultProps} />);

      // Get the actual onError callback
      const settingsCall = mockUseSetSettings.mock.calls[0];
      const actualOnError = settingsCall?.[0]?.onError;

      // Simulate error
      if (actualOnError) {
        actualOnError('Test error message');
      }

      await waitFor(() => {
        expect(screen.getByText('Test error message')).toBeInTheDocument();
      });

      // Dismiss the error
      const dismissButtons = screen.getAllByRole('button', { name: /close/i });
      fireEvent.click(dismissButtons[1]); // Second close button is for the error message

      await waitFor(() => {
        expect(
          screen.queryByText('Test error message'),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('shows consolidated loading when any data source is loading', () => {
      mockUseCompanySettings.mockReturnValue({
        settingsData: undefined,
        refetch: mockRefetchSettings,
        loading: true,
        error: undefined,
        qboSettings: undefined,
        qlSettings: undefined,
      } as any);

      render(<TimeSettingsPopoverHOC {...defaultProps} />);

      expect(screen.getAllByLabelText('Loading')[0]).toBeInTheDocument();
    });

    it('shows button loading when mutations are in progress', () => {
      mockUseSetSettings.mockReturnValue([mockSetSettings, { loading: true }]);

      render(<TimeSettingsPopoverHOC {...defaultProps} />);

      const saveButtons = screen.getAllByRole('button', { name: /loading/i });
      expect(saveButtons[0]).toHaveClass('isLoading');
    });

    it('disables save button when page is loading', () => {
      mockUseCompanySettings.mockReturnValue({
        settingsData: undefined,
        refetch: mockRefetchSettings,
        loading: true,
        error: undefined,
        qboSettings: undefined,
        qlSettings: undefined,
      } as any);

      render(<TimeSettingsPopoverHOC {...defaultProps} />);

      const saveButtons = screen.getAllByRole('button', { name: /loading/i });
      expect(saveButtons[0]).toBeDisabled();
    });
  });

  describe('Popover Interaction', () => {
    it('tracks save settings when save button is clicked', async () => {
      render(<TimeSettingsPopoverHOC {...defaultProps} />);

      const saveButtons = screen.getAllByRole('button', {
        name: 'singletime.settings.popover.button.label',
      });
      fireEvent.click(saveButtons[0]);

      expect(mockTrack).toHaveBeenCalledWith(mockTrackingPoints.SAVE_SETTINGS);
    });

    it('closes popover and resets error when close is called', () => {
      render(<TimeSettingsPopoverHOC {...defaultProps} />);

      // Simulate error first
      const mockCall = (mockUseSetSettings as any).mock.calls[0];
      const onError = mockCall?.[1]?.onError || jest.fn();
      onError('Test error');

      // Close popover
      const closeButtons = screen.getAllByRole('button', { name: /close/i });
      fireEvent.click(closeButtons[0]);

      expect(defaultProps.setOpen).toHaveBeenCalledWith(false);
    });

    it('resets consolidated loading when popover closes', () => {
      const { rerender } = render(
        <TimeSettingsPopoverHOC {...defaultProps} open />,
      );

      rerender(<TimeSettingsPopoverHOC {...defaultProps} open={false} />);

      // The component should reset its internal loading state
      expect(mockFormMethods.reset).toHaveBeenCalled();
    });
  });

  describe('Default Parameter Values', () => {
    it('uses default isSettingsAccessible = false when not provided', () => {
      const propsWithoutSettingsAccessible = {
        open: true,
        setOpen: jest.fn(),
        onSaveSuccess: jest.fn(),
        targetElement: document.createElement('div'),
        fieldsWithData: defaultProps.fieldsWithData,
        trackingPoints: mockTrackingPoints,
        // isSettingsAccessible not provided - should default to false
      } as any;

      (atLeastOneWeekdaySelected as jest.Mock).mockReturnValue(true);
      (attemptingToHideWeekdayAlreadyWithData as jest.Mock).mockReturnValue(
        false,
      );
      (attemptingToHideFieldAlreadyWithData as jest.Mock).mockReturnValue(true);

      render(<TimeSettingsPopoverHOC {...propsWithoutSettingsAccessible} />);

      const saveButtons = screen.getAllByRole('button', {
        name: 'singletime.settings.popover.button.label',
      });
      fireEvent.click(saveButtons[0]);

      // Should not call attemptingToHideFieldAlreadyWithData due to default isSettingsAccessible: false
      expect(attemptingToHideFieldAlreadyWithData).not.toHaveBeenCalled();
    });

    it('uses default weekdaysWithDurations = [] when not provided', () => {
      const propsWithoutWeekdays = {
        open: true,
        setOpen: jest.fn(),
        onSaveSuccess: jest.fn(),
        targetElement: document.createElement('div'),
        fieldsWithData: defaultProps.fieldsWithData,
        isSettingsAccessible: true,
        trackingPoints: mockTrackingPoints,
        // weekdaysWithDurations not provided - should default to []
      };

      (atLeastOneWeekdaySelected as jest.Mock).mockReturnValue(true);
      (attemptingToHideWeekdayAlreadyWithData as jest.Mock).mockReturnValue(
        false,
      );
      (attemptingToHideFieldAlreadyWithData as jest.Mock).mockReturnValue(
        false,
      );

      render(<TimeSettingsPopoverHOC {...propsWithoutWeekdays} />);

      const saveButtons = screen.getAllByRole('button', {
        name: 'singletime.settings.popover.button.label',
      });
      fireEvent.click(saveButtons[0]);

      // Should call attemptingToHideWeekdayAlreadyWithData with empty array
      expect(attemptingToHideWeekdayAlreadyWithData).toHaveBeenCalledWith(
        { mockFormState: true },
        [],
      );
    });

    it('uses default showDaysOfWeekPreferences = false when not provided', () => {
      const propsWithoutShowDaysOfWeek = {
        open: true,
        setOpen: jest.fn(),
        onSaveSuccess: jest.fn(),
        targetElement: document.createElement('div'),
        fieldsWithData: defaultProps.fieldsWithData,
        isSettingsAccessible: true,
        trackingPoints: mockTrackingPoints,
        // showDaysOfWeekPreferences not provided - should default to false
      };

      (atLeastOneWeekdaySelected as jest.Mock).mockReturnValue(true);
      (attemptingToHideWeekdayAlreadyWithData as jest.Mock).mockReturnValue(
        false,
      );
      (attemptingToHideFieldAlreadyWithData as jest.Mock).mockReturnValue(
        false,
      );
      (
        compareTimeSettingsPopoverFormState_toUxPreferenceHideWeekdaysData as jest.Mock
      ).mockReturnValue(true);

      render(<TimeSettingsPopoverHOC {...propsWithoutShowDaysOfWeek} />);

      const saveButtons = screen.getAllByRole('button', {
        name: 'singletime.settings.popover.button.label',
      });
      fireEvent.click(saveButtons[0]);

      // Should not call setPreference for weekdays due to default showDaysOfWeekPreferences: false
      expect(mockSetPreference).not.toHaveBeenCalledWith(
        'hide-weekdays-timesheet',
        expect.anything(),
      );
    });

    it('uses default isTimeEntry = false when not provided', () => {
      const propsWithoutTimeEntry = {
        open: true,
        setOpen: jest.fn(),
        onSaveSuccess: jest.fn(),
        targetElement: document.createElement('div'),
        fieldsWithData: defaultProps.fieldsWithData,
        isSettingsAccessible: true,
        trackingPoints: mockTrackingPoints,
        // isTimeEntry not provided - should default to false
      } as any;

      render(<TimeSettingsPopoverHOC {...propsWithoutTimeEntry} />);

      expect(
        screen.getByTestId('time-settings-popover-form'),
      ).toBeInTheDocument();
      // The TimeSettingsPopoverForm should receive isTimeEntry as false by default
      // This would be visible in the actual form component behavior
    });

    it('handles all default values together', () => {
      const minimalProps = {
        open: true,
        setOpen: jest.fn(),
        onSaveSuccess: jest.fn(),
        targetElement: document.createElement('div'),
        fieldsWithData: defaultProps.fieldsWithData,
        trackingPoints: mockTrackingPoints,
        // All other props use defaults:
        // isSettingsAccessible = false,
        // weekdaysWithDurations = [],
        // showDaysOfWeekPreferences = false,
        // isTimeEntry = false,
      } as any;

      render(<TimeSettingsPopoverHOC {...minimalProps} />);

      expect(
        screen.getByTestId('time-settings-popover-form'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('singletime.settings.popover.title'),
      ).toBeInTheDocument();
    });
  });

  describe('Props Variations', () => {
    it('handles different weekdaysWithDurations values', () => {
      const propsWithWeekdays = {
        ...defaultProps,
        weekdaysWithDurations: [1, 2, 3],
      };

      render(<TimeSettingsPopoverHOC {...propsWithWeekdays} />);

      expect(
        screen.getByTestId('time-settings-popover-form'),
      ).toBeInTheDocument();
    });

    it('handles isTimeEntry flag explicitly set to true', () => {
      const propsWithTimeEntry = { ...defaultProps, isTimeEntry: true };

      render(<TimeSettingsPopoverHOC {...propsWithTimeEntry} />);

      expect(
        screen.getByTestId('time-settings-popover-form'),
      ).toBeInTheDocument();
    });

    it('handles showDaysOfWeekPreferences explicitly set to true', () => {
      const propsWithShowDaysOfWeek = {
        ...defaultProps,
        showDaysOfWeekPreferences: true,
      };

      (atLeastOneWeekdaySelected as jest.Mock).mockReturnValue(true);
      (attemptingToHideWeekdayAlreadyWithData as jest.Mock).mockReturnValue(
        false,
      );
      (attemptingToHideFieldAlreadyWithData as jest.Mock).mockReturnValue(
        false,
      );
      (
        compareTimeSettingsPopoverFormState_toUxPreferenceHideWeekdaysData as jest.Mock
      ).mockReturnValue(true);
      (
        mapTimeSettingsPopoverFormState_forUxPreferencesMutation_hideWeekdays as jest.Mock
      ).mockReturnValue({ weekdays: 'mapped' });

      render(<TimeSettingsPopoverHOC {...propsWithShowDaysOfWeek} />);

      const saveButtons = screen.getAllByRole('button', {
        name: 'singletime.settings.popover.button.label',
      });
      fireEvent.click(saveButtons[0]);

      // Should call setPreference for weekdays when showDaysOfWeekPreferences: true
      expect(mockSetPreference).toHaveBeenCalledWith(
        'hide-weekdays-timesheet',
        { weekdays: 'mapped' },
      );
    });

    it('handles isSettingsAccessible explicitly set to true', () => {
      const propsWithSettingsAccessible = {
        ...defaultProps,
        isSettingsAccessible: true,
      };

      (atLeastOneWeekdaySelected as jest.Mock).mockReturnValue(true);
      (attemptingToHideWeekdayAlreadyWithData as jest.Mock).mockReturnValue(
        false,
      );
      (attemptingToHideFieldAlreadyWithData as jest.Mock).mockReturnValue(true);

      render(<TimeSettingsPopoverHOC {...propsWithSettingsAccessible} />);

      const saveButtons = screen.getAllByRole('button', {
        name: 'singletime.settings.popover.button.label',
      });
      fireEvent.click(saveButtons[0]);

      // Should call attemptingToHideFieldAlreadyWithData when isSettingsAccessible: true
      expect(attemptingToHideFieldAlreadyWithData).toHaveBeenCalledWith(
        { mockFormState: true },
        defaultProps.fieldsWithData,
      );
    });

    it('handles different fieldsWithData configurations', () => {
      const fieldsWithData = {
        hasServiceFieldData: true,
        hasBillingFieldData: true,
        hasClassFieldData: false,
        hasLocationFieldData: false,
        hasPayTypeFieldData: true,
        hasCostRateFieldData: false,
        hasTaxableFieldData: false,
      };
      const propsWithFields = { ...defaultProps, fieldsWithData };

      render(<TimeSettingsPopoverHOC {...propsWithFields} />);

      expect(
        screen.getByTestId('time-settings-popover-form'),
      ).toBeInTheDocument();
    });

    it('handles empty weekdaysWithDurations array explicitly', () => {
      const propsWithEmptyWeekdays = {
        ...defaultProps,
        weekdaysWithDurations: [],
      };

      (atLeastOneWeekdaySelected as jest.Mock).mockReturnValue(true);
      (attemptingToHideWeekdayAlreadyWithData as jest.Mock).mockReturnValue(
        false,
      );

      render(<TimeSettingsPopoverHOC {...propsWithEmptyWeekdays} />);

      const saveButtons = screen.getAllByRole('button', {
        name: 'singletime.settings.popover.button.label',
      });
      fireEvent.click(saveButtons[0]);

      expect(attemptingToHideWeekdayAlreadyWithData).toHaveBeenCalledWith(
        { mockFormState: true },
        [],
      );
    });

    it('handles populated weekdaysWithDurations array', () => {
      const propsWithPopulatedWeekdays = {
        ...defaultProps,
        weekdaysWithDurations: [0, 1, 2, 3, 4], // Monday through Friday
      };

      (atLeastOneWeekdaySelected as jest.Mock).mockReturnValue(true);
      (attemptingToHideWeekdayAlreadyWithData as jest.Mock).mockReturnValue(
        false,
      );

      render(<TimeSettingsPopoverHOC {...propsWithPopulatedWeekdays} />);

      const saveButtons = screen.getAllByRole('button', {
        name: 'singletime.settings.popover.button.label',
      });
      fireEvent.click(saveButtons[0]);

      expect(attemptingToHideWeekdayAlreadyWithData).toHaveBeenCalledWith(
        { mockFormState: true },
        [0, 1, 2, 3, 4],
      );
    });
  });

  describe('Parameter Combinations', () => {
    it('handles isSettingsAccessible=true with populated fieldsWithData', () => {
      const fieldsWithData = {
        hasServiceFieldData: true,
        hasBillingFieldData: false,
        hasClassFieldData: true,
        hasLocationFieldData: false,
        hasPayTypeFieldData: false,
        hasCostRateFieldData: true,
        hasTaxableFieldData: false,
      };
      const combinedProps = {
        ...defaultProps,
        isSettingsAccessible: true,
        fieldsWithData,
      };

      (atLeastOneWeekdaySelected as jest.Mock).mockReturnValue(true);
      (attemptingToHideWeekdayAlreadyWithData as jest.Mock).mockReturnValue(
        false,
      );
      (attemptingToHideFieldAlreadyWithData as jest.Mock).mockReturnValue(
        false,
      );

      render(<TimeSettingsPopoverHOC {...combinedProps} />);

      const saveButtons = screen.getAllByRole('button', {
        name: 'singletime.settings.popover.button.label',
      });
      fireEvent.click(saveButtons[0]);

      expect(attemptingToHideFieldAlreadyWithData).toHaveBeenCalledWith(
        { mockFormState: true },
        fieldsWithData,
      );
    });

    it('handles showDaysOfWeekPreferences=true with populated weekdaysWithDurations', () => {
      const combinedProps = {
        ...defaultProps,
        showDaysOfWeekPreferences: true,
        weekdaysWithDurations: [1, 3, 5], // Tuesday, Thursday, Saturday
      };

      (atLeastOneWeekdaySelected as jest.Mock).mockReturnValue(true);
      (attemptingToHideWeekdayAlreadyWithData as jest.Mock).mockReturnValue(
        false,
      );
      (attemptingToHideFieldAlreadyWithData as jest.Mock).mockReturnValue(
        false,
      );
      (
        compareTimeSettingsPopoverFormState_toUxPreferenceHideWeekdaysData as jest.Mock
      ).mockReturnValue(true);
      (
        mapTimeSettingsPopoverFormState_forUxPreferencesMutation_hideWeekdays as jest.Mock
      ).mockReturnValue({ weekdays: 'updated' });

      render(<TimeSettingsPopoverHOC {...combinedProps} />);

      const saveButtons = screen.getAllByRole('button', {
        name: 'singletime.settings.popover.button.label',
      });
      fireEvent.click(saveButtons[0]);

      expect(attemptingToHideWeekdayAlreadyWithData).toHaveBeenCalledWith(
        { mockFormState: true },
        [1, 3, 5],
      );
      expect(mockSetPreference).toHaveBeenCalledWith(
        'hide-weekdays-timesheet',
        { weekdays: 'updated' },
      );
    });

    it('handles all non-default values together', () => {
      const allNonDefaultProps = {
        ...defaultProps,
        isSettingsAccessible: true,
        weekdaysWithDurations: [0, 1, 2, 3, 4, 5, 6],
        showDaysOfWeekPreferences: true,
        isTimeEntry: true,
      };

      render(<TimeSettingsPopoverHOC {...allNonDefaultProps} />);

      expect(
        screen.getByTestId('time-settings-popover-form'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('singletime.settings.popover.title'),
      ).toBeInTheDocument();
    });
  });
});

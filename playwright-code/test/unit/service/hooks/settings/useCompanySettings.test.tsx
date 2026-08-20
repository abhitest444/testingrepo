import { act } from '@testing-library/react-hooks';
import { renderHookWithQuicksandProvider } from 'test/unit/testUtils';
import { useCompanySettings } from 'src/js/service/hooks/settings/useCompanySettings';
import { useGetQLSettings } from 'src/js/service/hooks/settings/useGetQLSettings';
import { useGetSettings } from 'src/js/service/hooks/settings/useGetSettings';
import {
  isWorkforceEnvironment,
  useFeatureFlag,
} from 'src/js/service/utils/sandboxUtils';

// Mock the hooks used in useCompanySettings
jest.mock('src/js/service/hooks/settings/useGetSettings');
jest.mock('src/js/service/hooks/settings/useGetQLSettings');
jest.mock('src/js/service/utils/sandboxUtils');

describe('useCompanySettings', () => {
  const mockSettingsData = {
    isServiceFieldEnabled: true,
    isBillingFieldEnabled: true,
    firstDayOfWeek: 1,
    isClassEnabled: true,
    isLocationEnabled: true,
    isTaxableFieldEnabled: true,
    entityVersion: '1',
    isCloseBookDateEnabled: true,
    isCloseBookPasswordEnabled: true,
    closeBookDate: new Date(),
    timezone: 'UTC',
    qboTimezone: 'UTC',
  };

  const mockCompanySettingsData = {
    isServiceFieldEnabled: { version: '1', value: false },
    isBillingFieldEnabled: { version: '1', value: false },
    firstDayOfWeek: { version: '1', value: 0 },
    billingRateForTimeEnabled: { version: '0', value: false },
    timeTrackingSupported: { version: '0', value: false },
    transactionBillingForTimeEnabled: { version: '0', value: false },
    transactionTimeTrackingEnabled: { version: '0', value: false },
    useItemForTime: { version: '0', value: false },
    mileageTrackingEnabled: { version: '0', value: false },
  };

  beforeEach(() => {
    (useGetSettings as jest.Mock).mockReturnValue({
      data: mockSettingsData,
      refetch: jest.fn(),
      loading: false,
      error: '',
    });

    (useGetQLSettings as jest.Mock).mockReturnValue({
      qlSettings: mockCompanySettingsData,
      refetch: jest.fn(),
      loading: false,
      error: '',
    });

    (useFeatureFlag as jest.Mock).mockReturnValue(false);
    (isWorkforceEnvironment as jest.Mock).mockReturnValue(false);
  });

  it('should return combined settings with feature flag disabled', () => {
    const { result } = renderHookWithQuicksandProvider(() =>
      useCompanySettings(),
    );

    expect(result.current.settingsData.isServiceFieldEnabled).toBe(
      mockSettingsData.isServiceFieldEnabled,
    );
    expect(result.current.settingsData.isBillingFieldEnabled).toBe(
      mockSettingsData.isBillingFieldEnabled,
    );
    expect(result.current.settingsData.firstDayOfWeek).toBe(
      mockSettingsData.firstDayOfWeek,
    );
  });

  it('should return combined settings with feature flag enabled', () => {
    (useFeatureFlag as jest.Mock).mockReturnValue(true);

    const { result } = renderHookWithQuicksandProvider(() =>
      useCompanySettings(),
    );

    expect(result.current.settingsData.isServiceFieldEnabled).toBe(
      mockCompanySettingsData.isServiceFieldEnabled.value,
    );
    expect(result.current.settingsData.isBillingFieldEnabled).toBe(
      mockCompanySettingsData.isBillingFieldEnabled.value,
    );
    expect(result.current.settingsData.firstDayOfWeek).toBe(
      mockCompanySettingsData.firstDayOfWeek.value,
    );
  });

  it('should handle loading state correctly', () => {
    (useGetSettings as jest.Mock).mockReturnValue({
      data: mockSettingsData,
      refetch: jest.fn(),
      loading: true,
      error: '',
    });

    const { result } = renderHookWithQuicksandProvider(() =>
      useCompanySettings(),
    );

    expect(result.current.loading).toBe(true);
  });

  it('should handle error state correctly', () => {
    (useGetSettings as jest.Mock).mockReturnValue({
      data: mockSettingsData,
      refetch: jest.fn(),
      loading: false,
      error: 'Error fetching settings',
    });

    const { result } = renderHookWithQuicksandProvider(() =>
      useCompanySettings(),
    );

    expect(result.current.error).toBe('Error fetching settings');
  });

  it('should refetch settings correctly', () => {
    const refetchSettingsMock = jest.fn();
    const refetchCompanySettingsMock = jest.fn();

    (useGetSettings as jest.Mock).mockReturnValue({
      data: mockSettingsData,
      refetch: refetchSettingsMock,
      loading: false,
      error: '',
    });

    (useGetQLSettings as jest.Mock).mockReturnValue({
      qlSettings: mockCompanySettingsData,
      refetch: refetchCompanySettingsMock,
      loading: false,
      error: '',
    });

    (useFeatureFlag as jest.Mock).mockReturnValue(false);
    let { result } = renderHookWithQuicksandProvider(() =>
      useCompanySettings(),
    );
    act(() => {
      result.current.refetch();
    });

    expect(refetchSettingsMock).toHaveBeenCalled();
    expect(refetchCompanySettingsMock).not.toHaveBeenCalled();

    (useFeatureFlag as jest.Mock).mockReturnValue(true);
    result = renderHookWithQuicksandProvider(() => useCompanySettings()).result;

    act(() => {
      result.current.refetch();
    });

    expect(refetchSettingsMock).toHaveBeenCalled();
    expect(refetchCompanySettingsMock).toHaveBeenCalled();
  });

  describe('mileageTrackingEnabled field', () => {
    it('should return mileageTrackingEnabled as false by default when feature flag is disabled', () => {
      (useFeatureFlag as jest.Mock).mockReturnValue(false);

      const { result } = renderHookWithQuicksandProvider(() =>
        useCompanySettings(),
      );

      expect(result.current.settingsData.mileageTrackingEnabled).toBe(false);
    });

    it('should return mileageTrackingEnabled from qlSettings when feature flag is enabled', () => {
      (useFeatureFlag as jest.Mock).mockReturnValue(true);

      const mockQLSettingsWithMileage = {
        ...mockCompanySettingsData,
        mileageTrackingEnabled: { version: '1', value: true },
      };

      (useGetQLSettings as jest.Mock).mockReturnValue({
        qlSettings: mockQLSettingsWithMileage,
        refetch: jest.fn(),
        loading: false,
        error: '',
      });

      const { result } = renderHookWithQuicksandProvider(() =>
        useCompanySettings(),
      );

      expect(result.current.settingsData.mileageTrackingEnabled).toBe(true);
    });

    it('should default to false when mileageTrackingEnabled is not present in qlSettings', () => {
      (useFeatureFlag as jest.Mock).mockReturnValue(true);

      const { mileageTrackingEnabled, ...mockQLSettingsWithoutMileage } =
        mockCompanySettingsData;

      (useGetQLSettings as jest.Mock).mockReturnValue({
        qlSettings: mockQLSettingsWithoutMileage,
        refetch: jest.fn(),
        loading: false,
        error: '',
      });

      const { result } = renderHookWithQuicksandProvider(() =>
        useCompanySettings(),
      );

      expect(result.current.settingsData.mileageTrackingEnabled).toBe(false);
    });

    it('should default to false when mileageTrackingEnabled value is undefined in qlSettings', () => {
      (useFeatureFlag as jest.Mock).mockReturnValue(true);

      const mockQLSettingsWithUndefinedMileage = {
        ...mockCompanySettingsData,
        mileageTrackingEnabled: { version: '1', value: undefined },
      };

      (useGetQLSettings as jest.Mock).mockReturnValue({
        qlSettings: mockQLSettingsWithUndefinedMileage,
        refetch: jest.fn(),
        loading: false,
        error: '',
      });

      const { result } = renderHookWithQuicksandProvider(() =>
        useCompanySettings(),
      );

      expect(result.current.settingsData.mileageTrackingEnabled).toBe(false);
    });

    it('should return default mileageTrackingEnabled when there is an error', () => {
      (useGetSettings as jest.Mock).mockReturnValue({
        data: mockSettingsData,
        refetch: jest.fn(),
        loading: false,
        error: 'Error fetching settings',
      });

      const { result } = renderHookWithQuicksandProvider(() =>
        useCompanySettings(),
      );

      expect(result.current.settingsData.mileageTrackingEnabled).toBe(false);
    });
  });

  describe('workforce environment', () => {
    const mockQLSettingsWithAllFields = {
      ...mockCompanySettingsData,
      classForTimeSheetEnabled: { version: '1', value: true },
      locationForTimeSheetEnabled: { version: '1', value: true },
      timeZone: { version: '1', value: 'America/Chicago' },
      classRequired: { version: '1', value: true },
      locationRequired: { version: '1', value: false },
      serviceItemRequired: { version: '1', value: false },
      requireBillable: { version: '1', value: false },
      timeSheetEntryMakesNotesRequiredEnabled: { version: '1', value: false },
      mileageTrackingEnabled: { version: '1', value: true },
    };

    beforeEach(() => {
      (isWorkforceEnvironment as jest.Mock).mockReturnValue(true);
      (useGetQLSettings as jest.Mock).mockReturnValue({
        qlSettings: mockQLSettingsWithAllFields,
        refetch: jest.fn(),
        loading: false,
        error: '',
      });
    });

    it('should use qlSettings for class and location fields', () => {
      const { result } = renderHookWithQuicksandProvider(() =>
        useCompanySettings(),
      );

      expect(result.current.settingsData.isClassEnabled).toBe(true);
      expect(result.current.settingsData.isLocationEnabled).toBe(true);
    });

    it('should set workforce-specific defaults for QBO-only fields', () => {
      const { result } = renderHookWithQuicksandProvider(() =>
        useCompanySettings(),
      );

      expect(result.current.settingsData.isTaxableFieldEnabled).toBe(false);
      expect(result.current.settingsData.entityVersion).toBe('0');
      expect(result.current.settingsData.isCloseBookDateEnabled).toBe(false);
      expect(result.current.settingsData.isCloseBookPasswordEnabled).toBe(
        false,
      );
    });

    it('should use qlSettings timezone and qboTimezone', () => {
      const { result } = renderHookWithQuicksandProvider(() =>
        useCompanySettings(),
      );

      expect(result.current.settingsData.timezone).toBe('America/Chicago');
      expect(result.current.settingsData.qboTimezone).toBe('America/Chicago');
    });

    it('should use qlSettings for service, billing, and firstDayOfWeek', () => {
      const { result } = renderHookWithQuicksandProvider(() =>
        useCompanySettings(),
      );

      expect(result.current.settingsData.isServiceFieldEnabled).toBe(
        mockQLSettingsWithAllFields.isServiceFieldEnabled.value,
      );
      expect(result.current.settingsData.isBillingFieldEnabled).toBe(
        mockQLSettingsWithAllFields.isBillingFieldEnabled.value,
      );
      expect(result.current.settingsData.firstDayOfWeek).toBe(
        mockQLSettingsWithAllFields.firstDayOfWeek.value,
      );
    });

    it('should return qlSettingsError as the error in workforce', () => {
      (useGetQLSettings as jest.Mock).mockReturnValue({
        qlSettings: mockQLSettingsWithAllFields,
        refetch: jest.fn(),
        loading: false,
        error: 'QL error',
      });

      const { result } = renderHookWithQuicksandProvider(() =>
        useCompanySettings(),
      );

      expect(result.current.error).toBe('QL error');
    });

    it('should return empty error when no qlSettingsError in workforce', () => {
      const { result } = renderHookWithQuicksandProvider(() =>
        useCompanySettings(),
      );

      expect(result.current.error).toBe('');
    });

    it('should use qlSettings even when QBO settings error in workforce', () => {
      (useGetSettings as jest.Mock).mockReturnValue({
        data: mockSettingsData,
        refetch: jest.fn(),
        loading: false,
        error: 'QBO error',
      });

      const { result } = renderHookWithQuicksandProvider(() =>
        useCompanySettings(),
      );

      expect(result.current.settingsData.isClassEnabled).toBe(true);
      expect(result.current.settingsData.isLocationEnabled).toBe(true);
      expect(result.current.settingsData.timezone).toBe('America/Chicago');
      expect(result.current.settingsData.qboTimezone).toBe('America/Chicago');
      expect(result.current.settingsData.isTaxableFieldEnabled).toBe(false);
      expect(result.current.settingsData.entityVersion).toBe('0');
      expect(result.current.error).toBe('');
    });

    it('should fall back to defaults when qlSettings errors in workforce', () => {
      (useGetSettings as jest.Mock).mockReturnValue({
        data: mockSettingsData,
        refetch: jest.fn(),
        loading: false,
        error: 'QBO error',
      });
      (useGetQLSettings as jest.Mock).mockReturnValue({
        qlSettings: mockQLSettingsWithAllFields,
        refetch: jest.fn(),
        loading: false,
        error: 'QL error',
      });

      const { result } = renderHookWithQuicksandProvider(() =>
        useCompanySettings(),
      );

      expect(result.current.settingsData.isClassEnabled).toBe(false);
      expect(result.current.settingsData.isLocationEnabled).toBe(false);
      expect(result.current.settingsData.timezone).toBe('');
      expect(result.current.error).toBe('QL error');
    });

    it('should default class and location to false when qlSettings values are undefined', () => {
      const mockQLSettingsUndefinedClassLocation = {
        ...mockQLSettingsWithAllFields,
        classForTimeSheetEnabled: undefined,
        locationForTimeSheetEnabled: undefined,
      };
      (useGetQLSettings as jest.Mock).mockReturnValue({
        qlSettings: mockQLSettingsUndefinedClassLocation,
        refetch: jest.fn(),
        loading: false,
        error: '',
      });

      const { result } = renderHookWithQuicksandProvider(() =>
        useCompanySettings(),
      );

      expect(result.current.settingsData.isClassEnabled).toBe(false);
      expect(result.current.settingsData.isLocationEnabled).toBe(false);
    });

    it('should use empty timezone when qlSettings timeZone is not set', () => {
      const mockQLSettingsNoTimezone = {
        ...mockQLSettingsWithAllFields,
        timeZone: undefined,
      };
      (useGetQLSettings as jest.Mock).mockReturnValue({
        qlSettings: mockQLSettingsNoTimezone,
        refetch: jest.fn(),
        loading: false,
        error: '',
      });

      const { result } = renderHookWithQuicksandProvider(() =>
        useCompanySettings(),
      );

      expect(result.current.settingsData.timezone).toBe('');
      expect(result.current.settingsData.qboTimezone).toBe('');
    });
  });
});

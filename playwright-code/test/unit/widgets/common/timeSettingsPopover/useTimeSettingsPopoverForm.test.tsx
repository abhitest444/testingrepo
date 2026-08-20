/* eslint-disable camelcase */

import { renderHook } from '@testing-library/react-hooks';
import { DEFAULT_UX_PREFERENCE_DATA_STATE } from 'src/js/service/utils/useUXPreferences';
import {
  atLeastOneWeekdaySelected,
  attemptingToHideFieldAlreadyWithData,
  attemptingToHideWeekdayAlreadyWithData,
  compareTimeSettingsPopoverFormState_toTimeTrackingSettings,
  compareTimeSettingsPopoverFormState_toUxPreferenceHideTimeEntryFieldsData,
  compareTimeSettingsPopoverFormState_toUxPreferenceHideWeekdaysData,
  mapTimeSettingsPopoverFormState,
  mapTimeSettingsPopoverFormState_forCompanySettingsMutation,
  mapTimeSettingsPopoverFormState_forSettingsMutation,
  mapTimeSettingsPopoverFormState_forUxPreferencesMutation_hideTimeEntryFields,
  mapTimeSettingsPopoverFormState_forUxPreferencesMutation_hideWeekdays,
  TimeSettingsPopoverFormState,
  TimeSettingsPopulatedState,
  useTimeSettingsPopoverForm,
} from 'src/js/widgets/common/timeSettingsPopover/useTimeSettingsPopoverForm';
import { MOCK_TIME_TRACKING_SETTINGS } from 'test/unit/service/queries/settingsQueries';

describe('useTimeSettingsPopoverForm', () => {
  it('should initialize form with default values', () => {
    const { result } = renderHook(() => useTimeSettingsPopoverForm());
    const { getValues } = result.current;
    const values = getValues();

    expect(values.isServiceFieldEnabled).toBe(true);
    expect(values.isBillingFieldEnabled).toBe(true);
    expect(values.isClassFieldEnabled).toBe(true);
    expect(values.isProjectFieldEnabled).toBe(true);
    expect(values.isLocationFieldEnabled).toBe(true);
    expect(values.isPayTypeFieldEnabled).toBe(true);
    expect(values.isCostRateFieldEnabled).toBe(true);
    expect(values.isTaxableFieldEnabled).toBe(true);
    expect(values.isSundayEnabled).toBe(true);
    expect(values.isMondayEnabled).toBe(true);
    expect(values.isTuesdayEnabled).toBe(true);
    expect(values.isWednesdayEnabled).toBe(true);
    expect(values.isThursdayEnabled).toBe(true);
    expect(values.isFridayEnabled).toBe(true);
    expect(values.isSaturdayEnabled).toBe(true);
  });
});

describe('mapTimeSettingsPopoverInitialFormState', () => {
  it('should map settings data and UX preferences to form state', () => {
    const formState = mapTimeSettingsPopoverFormState(
      {
        ...MOCK_TIME_TRACKING_SETTINGS,
        classRequired: false,
        locationRequired: false,
        serviceItemRequired: false,
        timeSheetEntryMakesNotesRequiredEnabled: false,
      },
      DEFAULT_UX_PREFERENCE_DATA_STATE,
    );

    expect(formState.isServiceFieldEnabled).toBe(true);
    expect(formState.isBillingFieldEnabled).toBe(true);
    expect(formState.isClassFieldEnabled).toBe(true);
    expect(formState.isProjectFieldEnabled).toBe(true);
    expect(formState.isLocationFieldEnabled).toBe(true);
    expect(formState.isPayTypeFieldEnabled).toBe(true);
    expect(formState.isCostRateFieldEnabled).toBe(true);
    expect(formState.isTaxableFieldEnabled).toBe(true);
    expect(formState.isSundayEnabled).toBe(true);
    expect(formState.isMondayEnabled).toBe(true);
    expect(formState.isTuesdayEnabled).toBe(true);
    expect(formState.isWednesdayEnabled).toBe(true);
    expect(formState.isThursdayEnabled).toBe(true);
    expect(formState.isFridayEnabled).toBe(true);
    expect(formState.isSaturdayEnabled).toBe(true);
  });
});

describe('compareTimeSettingsPopoverFormState_toTimeTrackingSettings', () => {
  it('should return true if form state is different from settings', () => {
    const formState = {
      isServiceFieldEnabled: true,
      isBillingFieldEnabled: false,
      isClassFieldEnabled: true,
      isProjectFieldEnabled: true,
      isLocationFieldEnabled: true,
      isPayTypeFieldEnabled: true,
      isCostRateFieldEnabled: true,
      isTaxableFieldEnabled: true,
      isSundayEnabled: true,
      isMondayEnabled: true,
      isTuesdayEnabled: true,
      isWednesdayEnabled: true,
      isThursdayEnabled: true,
      isFridayEnabled: true,
      isSaturdayEnabled: true,
    };

    const result = compareTimeSettingsPopoverFormState_toTimeTrackingSettings(
      formState,
      {
        ...MOCK_TIME_TRACKING_SETTINGS,
        classRequired: false,
        locationRequired: false,
        serviceItemRequired: false,
        timeSheetEntryMakesNotesRequiredEnabled: false,
      },
    );
    expect(result).toBe(true);
  });

  it('should return false if form state is the same as settings', () => {
    const formState = {
      isServiceFieldEnabled: true,
      isBillingFieldEnabled: true,
      isClassFieldEnabled: true,
      isProjectFieldEnabled: true,
      isLocationFieldEnabled: true,
      isPayTypeFieldEnabled: true,
      isCostRateFieldEnabled: true,
      isTaxableFieldEnabled: true,
      isSundayEnabled: true,
      isMondayEnabled: true,
      isTuesdayEnabled: true,
      isWednesdayEnabled: true,
      isThursdayEnabled: true,
      isFridayEnabled: true,
      isSaturdayEnabled: true,
    };

    const result = compareTimeSettingsPopoverFormState_toTimeTrackingSettings(
      formState,
      {
        ...MOCK_TIME_TRACKING_SETTINGS,
        classRequired: false,
        locationRequired: false,
        serviceItemRequired: false,
        timeSheetEntryMakesNotesRequiredEnabled: false,
      },
    );
    expect(result).toBe(false);
  });
});

describe('mapTimeSettingsPopoverFormState_forCompanySettingsMutation', () => {
  it('should map form state to company settings mutation args', () => {
    const mockMappedQLSettings = {
      isServiceFieldEnabled: {
        version: '1',
        value: true,
      },
      isBillingFieldEnabled: {
        version: '1',
        value: true,
      },
      firstDayOfWeek: {
        version: '1',
        value: 1,
      },
      billingRateForTimeEnabled: {
        version: '1',
        value: true,
      },
      timeTrackingSupported: {
        version: '1',
        value: true,
      },
      transactionBillingForTimeEnabled: {
        version: '1',
        value: true,
      },
      transactionTimeTrackingEnabled: {
        version: '1',
        value: true,
      },
      useItemForTime: {
        version: '1',
        value: true,
      },
      scheduleManagePreference: { version: '1', value: 'company' },
      scheduleViewPreference: { version: '1', value: 'company' },
    };

    const mockFormState = {
      isServiceFieldEnabled: true,
      isBillingFieldEnabled: true,
      isClassFieldEnabled: true,
      isProjectFieldEnabled: true,
      isLocationFieldEnabled: true,
      isPayTypeFieldEnabled: true,
      isCostRateFieldEnabled: true,
      isTaxableFieldEnabled: true,
      isSundayEnabled: true,
      isMondayEnabled: true,
      isTuesdayEnabled: true,
      isWednesdayEnabled: true,
      isThursdayEnabled: true,
      isFridayEnabled: true,
      isSaturdayEnabled: true,
    };

    const result = mapTimeSettingsPopoverFormState_forCompanySettingsMutation(
      mockMappedQLSettings,
      mockFormState,
    );

    expect(result).toEqual({
      timeTrackingBillingEnabled: {
        version: '1',
        value: true,
      },
      timeTrackingUseItemForTimeEnabled: {
        version: '1',
        value: true,
      },
    });
  });
});

describe('mapTimeSettingsPopoverFormState_forSettingsMutation', () => {
  it('should map form state to settings mutation args', () => {
    const formState = {
      isServiceFieldEnabled: true,
      isBillingFieldEnabled: true,
      isClassFieldEnabled: true,
      isProjectFieldEnabled: true,
      isLocationFieldEnabled: true,
      isPayTypeFieldEnabled: true,
      isCostRateFieldEnabled: true,
      isTaxableFieldEnabled: true,
      isSundayEnabled: true,
      isMondayEnabled: true,
      isTuesdayEnabled: true,
      isWednesdayEnabled: true,
      isThursdayEnabled: true,
      isFridayEnabled: true,
      isSaturdayEnabled: true,
    };

    const entityVersion = '1';

    const result = mapTimeSettingsPopoverFormState_forSettingsMutation(
      entityVersion,
      formState,
    );

    expect(result).toEqual({
      entityVersion: '1',
      isServiceFieldEnabled: true,
      isBillingFieldEnabled: true,
    });
  });
});

describe('compareTimeSettingsPopoverFormState_toUxPreferenceHideWeekdaysData', () => {
  it('should return true if form state is different from UX preference hide weekdays data', () => {
    const formState = {
      isServiceFieldEnabled: true,
      isBillingFieldEnabled: true,
      isClassFieldEnabled: true,
      isProjectFieldEnabled: true,
      isLocationFieldEnabled: true,
      isPayTypeFieldEnabled: true,
      isCostRateFieldEnabled: true,
      isTaxableFieldEnabled: true,
      isSundayEnabled: true,
      isMondayEnabled: true,
      isTuesdayEnabled: true,
      isWednesdayEnabled: true,
      isThursdayEnabled: true,
      isFridayEnabled: true,
      isSaturdayEnabled: true,
    };

    const uxPreferenceHideWeekdaysData = {
      isSundayHidden: true,
      isMondayHidden: true,
      isTuesdayHidden: true,
      isWednesdayHidden: true,
      isThursdayHidden: true,
      isFridayHidden: true,
      isSaturdayHidden: true,
    };

    const result =
      compareTimeSettingsPopoverFormState_toUxPreferenceHideWeekdaysData(
        formState,
        uxPreferenceHideWeekdaysData,
      );
    expect(result).toBe(true);
  });

  it('should return false if form state is the same as UX preference hide weekdays data', () => {
    const formState = {
      isServiceFieldEnabled: true,
      isBillingFieldEnabled: true,
      isClassFieldEnabled: true,
      isProjectFieldEnabled: true,
      isLocationFieldEnabled: true,
      isPayTypeFieldEnabled: true,
      isCostRateFieldEnabled: true,
      isTaxableFieldEnabled: true,
      isSundayEnabled: true,
      isMondayEnabled: true,
      isTuesdayEnabled: true,
      isWednesdayEnabled: true,
      isThursdayEnabled: true,
      isFridayEnabled: true,
      isSaturdayEnabled: true,
    };

    const uxPreferenceHideWeekdaysData = {
      isSundayHidden: false,
      isMondayHidden: false,
      isTuesdayHidden: false,
      isWednesdayHidden: false,
      isThursdayHidden: false,
      isFridayHidden: false,
      isSaturdayHidden: false,
    };

    const result =
      compareTimeSettingsPopoverFormState_toUxPreferenceHideWeekdaysData(
        formState,
        uxPreferenceHideWeekdaysData,
      );
    expect(result).toBe(false);
  });
});

describe('mapTimeSettingsPopoverFormState_forUxPreferencesMutation_hideWeekdays', () => {
  it('should map form state to UX preference hide weekdays data', () => {
    const formState = {
      isServiceFieldEnabled: true,
      isBillingFieldEnabled: true,
      isClassFieldEnabled: true,
      isProjectFieldEnabled: true,
      isLocationFieldEnabled: true,
      isPayTypeFieldEnabled: true,
      isCostRateFieldEnabled: true,
      isTaxableFieldEnabled: true,
      isSundayEnabled: true,
      isMondayEnabled: true,
      isTuesdayEnabled: true,
      isWednesdayEnabled: true,
      isThursdayEnabled: true,
      isFridayEnabled: true,
      isSaturdayEnabled: true,
    };

    const result =
      mapTimeSettingsPopoverFormState_forUxPreferencesMutation_hideWeekdays(
        formState,
      );

    expect(result).toEqual({
      isSundayHidden: false,
      isMondayHidden: false,
      isTuesdayHidden: false,
      isWednesdayHidden: false,
      isThursdayHidden: false,
      isFridayHidden: false,
      isSaturdayHidden: false,
    });
  });
});

describe('compareTimeSettingsPopoverFormState_toUxPreferenceHideTimeEntryFieldsData', () => {
  it('should return true if form state is different from UX preference hide time entry fields data', () => {
    const formState = {
      isServiceFieldEnabled: true,
      isBillingFieldEnabled: true,
      isClassFieldEnabled: false, // Different from UX preference
      isProjectFieldEnabled: true,
      isLocationFieldEnabled: true,
      isPayTypeFieldEnabled: true,
      isCostRateFieldEnabled: true,
      isTaxableFieldEnabled: true,
      isSundayEnabled: true,
      isMondayEnabled: true,
      isTuesdayEnabled: true,
      isWednesdayEnabled: true,
      isThursdayEnabled: true,
      isFridayEnabled: true,
      isSaturdayEnabled: true,
    };

    const uxPreferenceHideTimeEntryFieldsData = {
      isClassFieldEnabled: true, // Different from form state
      isProjectFieldEnabled: true,
      isLocationFieldEnabled: true,
      isPayTypeFieldEnabled: true,
      isCostRateFieldEnabled: true,
      isTaxableFieldEnabled: true,
    };

    const result =
      compareTimeSettingsPopoverFormState_toUxPreferenceHideTimeEntryFieldsData(
        {
          ...MOCK_TIME_TRACKING_SETTINGS,
          classRequired: false,
          locationRequired: false,
          serviceItemRequired: false,
          timeSheetEntryMakesNotesRequiredEnabled: false,
        },
        formState,
        uxPreferenceHideTimeEntryFieldsData,
      );
    expect(result).toBe(true);
  });

  it('should return false if form state is the same as UX preference hide time entry fields data', () => {
    const formState = {
      isServiceFieldEnabled: true,
      isBillingFieldEnabled: true,
      isClassFieldEnabled: true,
      isProjectFieldEnabled: true,
      isLocationFieldEnabled: true,
      isPayTypeFieldEnabled: true,
      isCostRateFieldEnabled: true,
      isTaxableFieldEnabled: true,
      isSundayEnabled: true,
      isMondayEnabled: true,
      isTuesdayEnabled: true,
      isWednesdayEnabled: true,
      isThursdayEnabled: true,
      isFridayEnabled: true,
      isSaturdayEnabled: true,
    };

    const uxPreferenceHideTimeEntryFieldsData = {
      isClassFieldEnabled: true,
      isProjectFieldEnabled: true,
      isLocationFieldEnabled: true,
      isPayTypeFieldEnabled: true,
      isCostRateFieldEnabled: true,
      isTaxableFieldEnabled: true,
    };

    const result =
      compareTimeSettingsPopoverFormState_toUxPreferenceHideTimeEntryFieldsData(
        {
          ...MOCK_TIME_TRACKING_SETTINGS,
          classRequired: false,
          locationRequired: false,
          serviceItemRequired: false,
          timeSheetEntryMakesNotesRequiredEnabled: false,
        },
        formState,
        uxPreferenceHideTimeEntryFieldsData,
      );
    expect(result).toBe(false);
  });
});

describe('mapTimeSettingsPopoverFormState_forUxPreferencesMutation_hideTimeEntryFields', () => {
  it('should map form state to UX preference hide time entry fields data', () => {
    const formState = {
      isServiceFieldEnabled: true,
      isBillingFieldEnabled: true,
      isClassFieldEnabled: true,
      isProjectFieldEnabled: true,
      isLocationFieldEnabled: true,
      isPayTypeFieldEnabled: true,
      isCostRateFieldEnabled: true,
      isTaxableFieldEnabled: true,
      isSundayEnabled: true,
      isMondayEnabled: true,
      isTuesdayEnabled: true,
      isWednesdayEnabled: true,
      isThursdayEnabled: true,
      isFridayEnabled: true,
      isSaturdayEnabled: true,
    };

    const result =
      mapTimeSettingsPopoverFormState_forUxPreferencesMutation_hideTimeEntryFields(
        formState,
      );

    expect(result).toEqual({
      isClassFieldEnabled: true,
      isProjectFieldEnabled: true,
      isLocationFieldEnabled: true,
      isPayTypeFieldEnabled: true,
      isCostRateFieldEnabled: true,
      isTaxableFieldEnabled: true,
    });
  });
});

describe('atLeastOneWeekdaySelected', () => {
  test.each([
    [
      {
        isSundayEnabled: false,
        isMondayEnabled: false,
        isTuesdayEnabled: false,
        isWednesdayEnabled: false,
        isThursdayEnabled: false,
        isFridayEnabled: false,
        isSaturdayEnabled: false,
      },
      false,
    ],
    [
      {
        isSundayEnabled: true,
        isMondayEnabled: false,
        isTuesdayEnabled: false,
        isWednesdayEnabled: false,
        isThursdayEnabled: false,
        isFridayEnabled: false,
        isSaturdayEnabled: false,
      },
      true,
    ],
    [
      {
        isSundayEnabled: false,
        isMondayEnabled: true,
        isTuesdayEnabled: false,
        isWednesdayEnabled: false,
        isThursdayEnabled: false,
        isFridayEnabled: false,
        isSaturdayEnabled: false,
      },
      true,
    ],
    [
      {
        isSundayEnabled: false,
        isMondayEnabled: false,
        isTuesdayEnabled: true,
        isWednesdayEnabled: false,
        isThursdayEnabled: false,
        isFridayEnabled: false,
        isSaturdayEnabled: false,
      },
      true,
    ],
    [
      {
        isSundayEnabled: false,
        isMondayEnabled: false,
        isTuesdayEnabled: false,
        isWednesdayEnabled: true,
        isThursdayEnabled: false,
        isFridayEnabled: false,
        isSaturdayEnabled: false,
      },
      true,
    ],
    [
      {
        isSundayEnabled: false,
        isMondayEnabled: false,
        isTuesdayEnabled: false,
        isWednesdayEnabled: false,
        isThursdayEnabled: true,
        isFridayEnabled: false,
        isSaturdayEnabled: false,
      },
      true,
    ],
    [
      {
        isSundayEnabled: false,
        isMondayEnabled: false,
        isTuesdayEnabled: false,
        isWednesdayEnabled: false,
        isThursdayEnabled: false,
        isFridayEnabled: true,
        isSaturdayEnabled: false,
      },
      true,
    ],
    [
      {
        isSundayEnabled: false,
        isMondayEnabled: false,
        isTuesdayEnabled: false,
        isWednesdayEnabled: false,
        isThursdayEnabled: false,
        isFridayEnabled: false,
        isSaturdayEnabled: true,
      },
      true,
    ],
    [
      {
        isSundayEnabled: true,
        isMondayEnabled: true,
        isTuesdayEnabled: true,
        isWednesdayEnabled: true,
        isThursdayEnabled: true,
        isFridayEnabled: true,
        isSaturdayEnabled: true,
      },
      true,
    ],
  ] as [TimeSettingsPopoverFormState, boolean][])(
    'returns %s when formState is %o',
    (formState: TimeSettingsPopoverFormState, expected: boolean) => {
      expect(atLeastOneWeekdaySelected(formState)).toBe(expected);
    },
  );
});

describe('attemptingToHideWeekdayAlreadyWithData', () => {
  it('should return false if weekdays already have some data and are being enabled', () => {
    const mockFormState = {
      isServiceFieldEnabled: true,
      isBillingFieldEnabled: true,
      isClassFieldEnabled: true,
      isProjectFieldEnabled: true,
      isLocationFieldEnabled: true,
      isPayTypeFieldEnabled: true,
      isCostRateFieldEnabled: true,
      isTaxableFieldEnabled: true,
      isSundayEnabled: true,
      isMondayEnabled: true,
      isTuesdayEnabled: true,
      isWednesdayEnabled: true,
      isThursdayEnabled: true,
      isFridayEnabled: true,
      isSaturdayEnabled: true,
    };
    const result = attemptingToHideWeekdayAlreadyWithData(
      mockFormState,
      [1, 2, 3, 4, 5],
    );

    expect(result).toEqual(false);
  });

  it('should return true if weekdays already have some data and are being disabled', () => {
    const mockFormState = {
      isServiceFieldEnabled: true,
      isBillingFieldEnabled: true,
      isClassFieldEnabled: true,
      isProjectFieldEnabled: true,
      isLocationFieldEnabled: true,
      isPayTypeFieldEnabled: true,
      isCostRateFieldEnabled: true,
      isTaxableFieldEnabled: true,
      isSundayEnabled: true,
      isMondayEnabled: false,
      isTuesdayEnabled: false,
      isWednesdayEnabled: false,
      isThursdayEnabled: false,
      isFridayEnabled: false,
      isSaturdayEnabled: true,
    };
    const result = attemptingToHideWeekdayAlreadyWithData(
      mockFormState,
      [1, 2, 3, 4, 5],
    );

    expect(result).toEqual(true);
  });
});

describe('attemptingToHideFieldAlreadyWithData', () => {
  test.each([
    [
      {
        isServiceFieldEnabled: false,
        isBillingFieldEnabled: false,
        isClassFieldEnabled: false,
        isProjectFieldEnabled: true,
        isLocationFieldEnabled: false,
        isPayTypeFieldEnabled: false,
        isCostRateFieldEnabled: false,
        isTaxableFieldEnabled: false,
      },
      {
        hasServiceFieldData: true,
        hasBillingFieldData: true,
        hasClassFieldData: true,
        hasLocationFieldData: true,
        hasPayTypeFieldData: true,
        hasCostRateFieldData: true,
        hasTaxableFieldData: true,
      },
      true,
    ],
    [
      {
        isServiceFieldEnabled: true,
        isBillingFieldEnabled: false,
        isClassFieldEnabled: false,
        isProjectFieldEnabled: true,
        isLocationFieldEnabled: false,
        isPayTypeFieldEnabled: false,
        isCostRateFieldEnabled: false,
        isTaxableFieldEnabled: false,
      },
      {
        hasServiceFieldData: true,
        hasBillingFieldData: true,
        hasClassFieldData: true,
        hasLocationFieldData: true,
        hasPayTypeFieldData: true,
        hasCostRateFieldData: true,
        hasTaxableFieldData: true,
      },
      true,
    ],
    [
      {
        isServiceFieldEnabled: true,
        isBillingFieldEnabled: true,
        isClassFieldEnabled: false,
        isProjectFieldEnabled: true,
        isLocationFieldEnabled: false,
        isPayTypeFieldEnabled: false,
        isCostRateFieldEnabled: false,
        isTaxableFieldEnabled: false,
      },
      {
        hasServiceFieldData: true,
        hasBillingFieldData: true,
        hasClassFieldData: true,
        hasLocationFieldData: true,
        hasPayTypeFieldData: true,
        hasCostRateFieldData: true,
        hasTaxableFieldData: true,
      },
      true,
    ],
    [
      {
        isServiceFieldEnabled: true,
        isBillingFieldEnabled: true,
        isClassFieldEnabled: true,
        isProjectFieldEnabled: true,
        isLocationFieldEnabled: false,
        isPayTypeFieldEnabled: false,
        isCostRateFieldEnabled: false,
        isTaxableFieldEnabled: false,
      },
      {
        hasServiceFieldData: true,
        hasBillingFieldData: true,
        hasClassFieldData: true,
        hasLocationFieldData: true,
        hasPayTypeFieldData: true,
        hasCostRateFieldData: true,
        hasTaxableFieldData: true,
      },
      true,
    ],
    [
      {
        isServiceFieldEnabled: true,
        isBillingFieldEnabled: true,
        isClassFieldEnabled: true,
        isProjectFieldEnabled: true,
        isLocationFieldEnabled: true,
        isPayTypeFieldEnabled: false,
        isCostRateFieldEnabled: false,
        isTaxableFieldEnabled: false,
      },
      {
        hasServiceFieldData: true,
        hasBillingFieldData: true,
        hasClassFieldData: true,
        hasLocationFieldData: true,
        hasPayTypeFieldData: true,
        hasCostRateFieldData: true,
        hasTaxableFieldData: true,
      },
      true,
    ],
    [
      {
        isServiceFieldEnabled: true,
        isBillingFieldEnabled: true,
        isClassFieldEnabled: true,
        isProjectFieldEnabled: true,
        isLocationFieldEnabled: true,
        isPayTypeFieldEnabled: true,
        isCostRateFieldEnabled: false,
        isTaxableFieldEnabled: false,
      },
      {
        hasServiceFieldData: true,
        hasBillingFieldData: true,
        hasClassFieldData: true,
        hasLocationFieldData: true,
        hasPayTypeFieldData: true,
        hasCostRateFieldData: true,
        hasTaxableFieldData: true,
      },
      true,
    ],
    [
      {
        isServiceFieldEnabled: true,
        isBillingFieldEnabled: true,
        isClassFieldEnabled: true,
        isProjectFieldEnabled: true,
        isLocationFieldEnabled: true,
        isPayTypeFieldEnabled: true,
        isCostRateFieldEnabled: true,
        isTaxableFieldEnabled: false,
      },
      {
        hasServiceFieldData: true,
        hasBillingFieldData: true,
        hasClassFieldData: true,
        hasLocationFieldData: true,
        hasPayTypeFieldData: true,
        hasCostRateFieldData: true,
        hasTaxableFieldData: true,
      },
      true,
    ],
  ] as [TimeSettingsPopoverFormState, TimeSettingsPopulatedState, boolean][])(
    'should return true if fields already have some data and are being disabled',
    (
      formState: TimeSettingsPopoverFormState,
      timeSettingsPopulatedState: TimeSettingsPopulatedState,
      expected: boolean,
    ) => {
      expect(
        attemptingToHideFieldAlreadyWithData(
          formState,
          timeSettingsPopulatedState,
        ),
      ).toBe(expected);
    },
  );
});

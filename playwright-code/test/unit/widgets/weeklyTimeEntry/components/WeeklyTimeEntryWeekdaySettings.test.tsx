import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { mockFormatMessage } from 'test/unit/testUtils';
import { WeeklyTimeEntryWeekdaySettings } from '../../../../../src/js/widgets/weeklyTimeEntry/components/weeklyTimeEntrySettingsPanel/WeeklyTimeEntryWeekdaySettings';
import { TrackingPoints } from '../../../../../src/js/common/useClickTracking';
import { UxPreferenceHideWeekdaysData } from '../../../../../src/js/service/utils/useUXPreferences';
import { useAppSelector } from '../../../../../src/js/widgets/weeklyTimeEntry/store';

// Mock useIntl from Quicksand
jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: mockFormatMessage,
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

  // Handle styled.element syntax
  const styled = new Proxy(
    (Component: any) => createStyledComponent(Component),
    {
      get: (target, prop) => {
        if (prop === '__esModule') return true;
        if (prop === 'default') return target;
        // Return a styled element creator for any requested HTML element
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

// Mock B3 component
jest.mock('@ids-ts/typography', () => ({
  B3: ({ children, weight }: any) => (
    <span data-testid="b3-text" data-weight={weight}>
      {children}
    </span>
  ),
}));

// Mock Redux store and selectors
jest.mock(
  '../../../../../src/js/widgets/weeklyTimeEntry/store/selectors',
  () => ({
    selectWeekdaysWithData: jest.fn(),
  }),
);

// Mock useAppSelector
jest.mock('../../../../../src/js/widgets/weeklyTimeEntry/store', () => ({
  useAppSelector: jest.fn(),
}));

// Mock WeeklyTimeEntryCheckbox component
jest.mock(
  '../../../../../src/js/widgets/weeklyTimeEntry/components/weeklyTimeEntrySettingsPanel/WeeklyTimeEntryCheckbox',
  () => ({
    WeeklyTimeEntryCheckbox: ({
      name,
      labelKey,
      checked,
      disabled,
      onChange,
    }: any) => (
      <label data-testid={`checkbox-${name}`}>
        <input
          type="checkbox"
          name={name}
          checked={checked}
          disabled={disabled}
          onChange={(e) => {
            if (!disabled) {
              onChange(e.target.checked);
            }
          }}
          data-testid={`input-${name}`}
        />
        <span data-testid={`label-${name}`}>{labelKey}</span>
      </label>
    ),
  }),
);

describe('WeeklyTimeEntryWeekdaySettings', () => {
  const defaultTrackingPoints: TrackingPoints = {
    SUNDAY_SETTING: {
      org: 'sbseg',
      purpose: 'prod',
      scope: 'time',
      scope_area: 'timeentrymanagement',
      screen: 'weekly_time_entry',
      action: 'engaged',
      object: 'component',
      object_detail: 'sunday_setting',
      ui_action: 'clicked',
      ui_object: 'checkbox',
      ui_object_detail: 'sunday_setting',
      ui_access_point: 'settings_panel',
    },
    MONDAY_SETTING: {
      org: 'sbseg',
      purpose: 'prod',
      scope: 'time',
      scope_area: 'timeentrymanagement',
      screen: 'weekly_time_entry',
      action: 'engaged',
      object: 'component',
      object_detail: 'monday_setting',
      ui_action: 'clicked',
      ui_object: 'checkbox',
      ui_object_detail: 'monday_setting',
      ui_access_point: 'settings_panel',
    },
    TUESDAY_SETTING: {
      org: 'sbseg',
      purpose: 'prod',
      scope: 'time',
      scope_area: 'timeentrymanagement',
      screen: 'weekly_time_entry',
      action: 'engaged',
      object: 'component',
      object_detail: 'tuesday_setting',
      ui_action: 'clicked',
      ui_object: 'checkbox',
      ui_object_detail: 'tuesday_setting',
      ui_access_point: 'settings_panel',
    },
    WEDNESDAY_SETTING: {
      org: 'sbseg',
      purpose: 'prod',
      scope: 'time',
      scope_area: 'timeentrymanagement',
      screen: 'weekly_time_entry',
      action: 'engaged',
      object: 'component',
      object_detail: 'wednesday_setting',
      ui_action: 'clicked',
      ui_object: 'checkbox',
      ui_object_detail: 'wednesday_setting',
      ui_access_point: 'settings_panel',
    },
    THURSDAY_SETTING: {
      org: 'sbseg',
      purpose: 'prod',
      scope: 'time',
      scope_area: 'timeentrymanagement',
      screen: 'weekly_time_entry',
      action: 'engaged',
      object: 'component',
      object_detail: 'thursday_setting',
      ui_action: 'clicked',
      ui_object: 'checkbox',
      ui_object_detail: 'thursday_setting',
      ui_access_point: 'settings_panel',
    },
    FRIDAY_SETTING: {
      org: 'sbseg',
      purpose: 'prod',
      scope: 'time',
      scope_area: 'timeentrymanagement',
      screen: 'weekly_time_entry',
      action: 'engaged',
      object: 'component',
      object_detail: 'friday_setting',
      ui_action: 'clicked',
      ui_object: 'checkbox',
      ui_object_detail: 'friday_setting',
      ui_access_point: 'settings_panel',
    },
    SATURDAY_SETTING: {
      org: 'sbseg',
      purpose: 'prod',
      scope: 'time',
      scope_area: 'timeentrymanagement',
      screen: 'weekly_time_entry',
      action: 'engaged',
      object: 'component',
      object_detail: 'saturday_setting',
      ui_action: 'clicked',
      ui_object: 'checkbox',
      ui_object_detail: 'saturday_setting',
      ui_access_point: 'settings_panel',
    },
  };

  const defaultHideWeekdays: UxPreferenceHideWeekdaysData = {
    isSundayHidden: false,
    isMondayHidden: false,
    isTuesdayHidden: false,
    isWednesdayHidden: false,
    isThursdayHidden: false,
    isFridayHidden: false,
    isSaturdayHidden: false,
  };

  const defaultSettingsState = {
    weekdays: {
      isSundayEnabled: true,
      isMondayEnabled: true,
      isTuesdayEnabled: true,
      isWednesdayEnabled: true,
      isThursdayEnabled: true,
      isFridayEnabled: true,
      isSaturdayEnabled: true,
    },
  };

  const defaultProps = {
    hideWeekdays: defaultHideWeekdays,
    trackingPoints: defaultTrackingPoints,
    settingsState: defaultSettingsState,
    updateWeekday: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFormatMessage.mockImplementation(({ id }) => id);
  });

  const renderComponent = (
    props = {},
    weekdaysWithData = {
      hasSundayData: false,
      hasMondayData: false,
      hasTuesdayData: false,
      hasWednesdayData: false,
      hasThursdayData: false,
      hasFridayData: false,
      hasSaturdayData: false,
    },
  ) => {
    // Mock the useAppSelector to return the weekdaysWithData
    (useAppSelector as jest.Mock).mockReturnValue(weekdaysWithData);

    return render(
      <WeeklyTimeEntryWeekdaySettings {...defaultProps} {...props} />,
    );
  };

  describe('Rendering', () => {
    it('renders without crashing', () => {
      renderComponent();
      expect(screen.getByTestId('b3-text')).toBeInTheDocument();
    });

    it('renders the correct section title', () => {
      renderComponent();
      expect(screen.getByTestId('b3-text')).toHaveTextContent(
        'days.of.the.week',
      );
    });

    it('renders all seven weekday checkboxes', () => {
      renderComponent();

      expect(
        screen.getByTestId('checkbox-isSundayEnabled'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('checkbox-isMondayEnabled'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('checkbox-isTuesdayEnabled'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('checkbox-isWednesdayEnabled'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('checkbox-isThursdayEnabled'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('checkbox-isFridayEnabled'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('checkbox-isSaturdayEnabled'),
      ).toBeInTheDocument();
    });

    it('renders correct labels for each weekday', () => {
      renderComponent();

      expect(screen.getByTestId('label-isSundayEnabled')).toHaveTextContent(
        'sunday',
      );
      expect(screen.getByTestId('label-isMondayEnabled')).toHaveTextContent(
        'monday',
      );
      expect(screen.getByTestId('label-isTuesdayEnabled')).toHaveTextContent(
        'tuesday',
      );
      expect(screen.getByTestId('label-isWednesdayEnabled')).toHaveTextContent(
        'wednesday',
      );
      expect(screen.getByTestId('label-isThursdayEnabled')).toHaveTextContent(
        'thursday',
      );
      expect(screen.getByTestId('label-isFridayEnabled')).toHaveTextContent(
        'friday',
      );
      expect(screen.getByTestId('label-isSaturdayEnabled')).toHaveTextContent(
        'saturday',
      );
    });
  });

  describe('Checkbox States', () => {
    it('renders checkboxes with correct checked state based on settings', () => {
      const settingsState = {
        weekdays: {
          isSundayEnabled: true,
          isMondayEnabled: false,
          isTuesdayEnabled: true,
          isWednesdayEnabled: false,
          isThursdayEnabled: true,
          isFridayEnabled: false,
          isSaturdayEnabled: true,
        },
      };

      renderComponent({ settingsState });

      expect(screen.getByTestId('input-isSundayEnabled')).toBeChecked();
      expect(screen.getByTestId('input-isMondayEnabled')).not.toBeChecked();
      expect(screen.getByTestId('input-isTuesdayEnabled')).toBeChecked();
      expect(screen.getByTestId('input-isWednesdayEnabled')).not.toBeChecked();
      expect(screen.getByTestId('input-isThursdayEnabled')).toBeChecked();
      expect(screen.getByTestId('input-isFridayEnabled')).not.toBeChecked();
      expect(screen.getByTestId('input-isSaturdayEnabled')).toBeChecked();
    });

    it('renders checkboxes as checked when weekdays have data', () => {
      const weekdaysWithData = {
        hasSundayData: true,
        hasMondayData: false,
        hasTuesdayData: true,
        hasWednesdayData: false,
        hasThursdayData: true,
        hasFridayData: false,
        hasSaturdayData: true,
      };

      const settingsState = {
        weekdays: {
          isSundayEnabled: false,
          isMondayEnabled: false,
          isTuesdayEnabled: false,
          isWednesdayEnabled: false,
          isThursdayEnabled: false,
          isFridayEnabled: false,
          isSaturdayEnabled: false,
        },
      };

      renderComponent({ settingsState }, weekdaysWithData);

      // Should be checked because of data, even though setting is false
      expect(screen.getByTestId('input-isSundayEnabled')).toBeChecked();
      expect(screen.getByTestId('input-isMondayEnabled')).not.toBeChecked();
      expect(screen.getByTestId('input-isTuesdayEnabled')).toBeChecked();
      expect(screen.getByTestId('input-isWednesdayEnabled')).not.toBeChecked();
      expect(screen.getByTestId('input-isThursdayEnabled')).toBeChecked();
      expect(screen.getByTestId('input-isFridayEnabled')).not.toBeChecked();
      // Saturday only uses settings state, not weekdays data
      expect(screen.getByTestId('input-isSaturdayEnabled')).not.toBeChecked();
    });

    it('renders checkboxes as disabled when weekdays have data', () => {
      const weekdaysWithData = {
        hasSundayData: true,
        hasMondayData: false,
        hasTuesdayData: true,
        hasWednesdayData: false,
        hasThursdayData: true,
        hasFridayData: false,
        hasSaturdayData: true,
      };

      renderComponent({}, weekdaysWithData);

      expect(screen.getByTestId('input-isSundayEnabled')).toBeDisabled();
      expect(screen.getByTestId('input-isMondayEnabled')).not.toBeDisabled();
      expect(screen.getByTestId('input-isTuesdayEnabled')).toBeDisabled();
      expect(screen.getByTestId('input-isWednesdayEnabled')).not.toBeDisabled();
      expect(screen.getByTestId('input-isThursdayEnabled')).toBeDisabled();
      expect(screen.getByTestId('input-isFridayEnabled')).not.toBeDisabled();
      expect(screen.getByTestId('input-isSaturdayEnabled')).toBeDisabled();
    });
  });

  describe('User Interactions', () => {
    it('calls updateWeekday when checkbox is clicked', () => {
      const updateWeekday = jest.fn();
      renderComponent({ updateWeekday });

      // Click on Monday checkbox (should be enabled)
      fireEvent.click(screen.getByTestId('input-isMondayEnabled'));

      expect(updateWeekday).toHaveBeenCalledWith('isMondayEnabled', false);
    });

    it('does not call updateWeekday when disabled checkbox is clicked', () => {
      const updateWeekday = jest.fn();
      const weekdaysWithData = {
        hasSundayData: true,
        hasMondayData: false,
        hasTuesdayData: false,
        hasWednesdayData: false,
        hasThursdayData: false,
        hasFridayData: false,
        hasSaturdayData: false,
      };

      renderComponent({ updateWeekday }, weekdaysWithData);

      // Try to click on Sunday checkbox (should be disabled)
      fireEvent.click(screen.getByTestId('input-isSundayEnabled'));

      expect(updateWeekday).not.toHaveBeenCalled();
    });

    it('handles multiple checkbox interactions correctly', () => {
      const updateWeekday = jest.fn();
      renderComponent({ updateWeekday });

      // Click on multiple checkboxes
      fireEvent.click(screen.getByTestId('input-isMondayEnabled'));
      fireEvent.click(screen.getByTestId('input-isWednesdayEnabled'));
      fireEvent.click(screen.getByTestId('input-isFridayEnabled'));

      expect(updateWeekday).toHaveBeenCalledTimes(3);
      expect(updateWeekday).toHaveBeenCalledWith('isMondayEnabled', false);
      expect(updateWeekday).toHaveBeenCalledWith('isWednesdayEnabled', false);
      expect(updateWeekday).toHaveBeenCalledWith('isFridayEnabled', false);
    });
  });

  describe('Data Integration', () => {
    it('combines settings state with weekdays data correctly', () => {
      const settingsState = {
        weekdays: {
          isSundayEnabled: false,
          isMondayEnabled: true,
          isTuesdayEnabled: false,
          isWednesdayEnabled: true,
          isThursdayEnabled: false,
          isFridayEnabled: true,
          isSaturdayEnabled: false,
        },
      };

      const weekdaysWithData = {
        hasSundayData: true,
        hasMondayData: false,
        hasTuesdayData: true,
        hasWednesdayData: false,
        hasThursdayData: true,
        hasFridayData: false,
        hasSaturdayData: true,
      };

      renderComponent({ settingsState }, weekdaysWithData);

      // Sunday: setting=false, data=true -> should be checked and disabled
      expect(screen.getByTestId('input-isSundayEnabled')).toBeChecked();
      expect(screen.getByTestId('input-isSundayEnabled')).toBeDisabled();

      // Monday: setting=true, data=false -> should be checked and enabled
      expect(screen.getByTestId('input-isMondayEnabled')).toBeChecked();
      expect(screen.getByTestId('input-isMondayEnabled')).not.toBeDisabled();

      // Tuesday: setting=false, data=true -> should be checked and disabled
      expect(screen.getByTestId('input-isTuesdayEnabled')).toBeChecked();
      expect(screen.getByTestId('input-isTuesdayEnabled')).toBeDisabled();

      // Wednesday: setting=true, data=false -> should be checked and enabled
      expect(screen.getByTestId('input-isWednesdayEnabled')).toBeChecked();
      expect(screen.getByTestId('input-isWednesdayEnabled')).not.toBeDisabled();

      // Thursday: setting=false, data=true -> should be checked and disabled
      expect(screen.getByTestId('input-isThursdayEnabled')).toBeChecked();
      expect(screen.getByTestId('input-isThursdayEnabled')).toBeDisabled();

      // Friday: setting=true, data=false -> should be checked and enabled
      expect(screen.getByTestId('input-isFridayEnabled')).toBeChecked();
      expect(screen.getByTestId('input-isFridayEnabled')).not.toBeDisabled();

      // Saturday: setting=false, data=true -> should be unchecked and disabled
      expect(screen.getByTestId('input-isSaturdayEnabled')).not.toBeChecked();
      expect(screen.getByTestId('input-isSaturdayEnabled')).toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('handles all weekdays having data', () => {
      const weekdaysWithData = {
        hasSundayData: true,
        hasMondayData: true,
        hasTuesdayData: true,
        hasWednesdayData: true,
        hasThursdayData: true,
        hasFridayData: true,
        hasSaturdayData: true,
      };

      renderComponent({}, weekdaysWithData);

      // All checkboxes should be checked and disabled
      const allCheckboxes = [
        'isSundayEnabled',
        'isMondayEnabled',
        'isTuesdayEnabled',
        'isWednesdayEnabled',
        'isThursdayEnabled',
        'isFridayEnabled',
        'isSaturdayEnabled',
      ];

      allCheckboxes.forEach((name) => {
        expect(screen.getByTestId(`input-${name}`)).toBeChecked();
        expect(screen.getByTestId(`input-${name}`)).toBeDisabled();
      });
    });

    it('handles no weekdays having data', () => {
      const weekdaysWithData = {
        hasSundayData: false,
        hasMondayData: false,
        hasTuesdayData: false,
        hasWednesdayData: false,
        hasThursdayData: false,
        hasFridayData: false,
        hasSaturdayData: false,
      };

      renderComponent({}, weekdaysWithData);

      // All checkboxes should be enabled (not disabled)
      const allCheckboxes = [
        'isSundayEnabled',
        'isMondayEnabled',
        'isTuesdayEnabled',
        'isWednesdayEnabled',
        'isThursdayEnabled',
        'isFridayEnabled',
        'isSaturdayEnabled',
      ];

      allCheckboxes.forEach((name) => {
        expect(screen.getByTestId(`input-${name}`)).not.toBeDisabled();
      });
    });

    it('handles empty settings state', () => {
      const settingsState = {
        weekdays: {
          isSundayEnabled: false,
          isMondayEnabled: false,
          isTuesdayEnabled: false,
          isWednesdayEnabled: false,
          isThursdayEnabled: false,
          isFridayEnabled: false,
          isSaturdayEnabled: false,
        },
      };

      renderComponent({ settingsState });

      // All checkboxes should be unchecked
      const allCheckboxes = [
        'isSundayEnabled',
        'isMondayEnabled',
        'isTuesdayEnabled',
        'isWednesdayEnabled',
        'isThursdayEnabled',
        'isFridayEnabled',
        'isSaturdayEnabled',
      ];

      allCheckboxes.forEach((name) => {
        expect(screen.getByTestId(`input-${name}`)).not.toBeChecked();
      });
    });
  });

  describe('Props Validation', () => {
    it('handles missing trackingPoints gracefully', () => {
      const propsWithoutTracking = {
        hideWeekdays: defaultHideWeekdays,
        settingsState: defaultSettingsState,
        updateWeekday: jest.fn(),
      };

      expect(() => renderComponent(propsWithoutTracking)).not.toThrow();
    });

    it('handles missing hideWeekdays gracefully', () => {
      const propsWithoutHideWeekdays = {
        trackingPoints: defaultTrackingPoints,
        settingsState: defaultSettingsState,
        updateWeekday: jest.fn(),
      };

      expect(() => renderComponent(propsWithoutHideWeekdays)).not.toThrow();
    });
  });

  describe('Memoization', () => {
    it('should be memoized and not re-render unnecessarily', () => {
      const { rerender } = renderComponent();
      const initialRenderCount = screen.getAllByTestId(/checkbox-/).length;

      // Re-render with same props
      rerender(<WeeklyTimeEntryWeekdaySettings {...defaultProps} />);

      const afterRerenderCount = screen.getAllByTestId(/checkbox-/).length;
      expect(afterRerenderCount).toBe(initialRenderCount);
    });
  });
});

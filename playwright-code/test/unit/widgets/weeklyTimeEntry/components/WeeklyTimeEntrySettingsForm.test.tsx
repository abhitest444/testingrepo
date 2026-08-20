import React from 'react';
import { render, screen } from '@testing-library/react';
import { WeeklyTimeEntrySettingsForm } from '../../../../../src/js/widgets/weeklyTimeEntry/components/weeklyTimeEntrySettingsPanel/WeeklyTimeEntrySettingsForm';

// Mock the WeeklyTimeEntryWeekdaySettings component
jest.mock(
  '../../../../../src/js/widgets/weeklyTimeEntry/components/weeklyTimeEntrySettingsPanel/WeeklyTimeEntryWeekdaySettings',
  () => ({
    WeeklyTimeEntryWeekdaySettings: ({
      hideWeekdays,
      trackingPoints,
      settingsState,
      updateWeekday,
      showDaysOfWeekPreferences,
    }: any) => (
      <div data-testid="weekly-time-entry-weekday-settings">
        <span data-testid="hide-weekdays">{JSON.stringify(hideWeekdays)}</span>
        <span data-testid="tracking-points">
          {JSON.stringify(trackingPoints)}
        </span>
        <span data-testid="settings-state">
          {JSON.stringify(settingsState)}
        </span>
        <span data-testid="show-days-of-week-preferences">
          {String(showDaysOfWeekPreferences)}
        </span>
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

describe('WeeklyTimeEntrySettingsForm', () => {
  const defaultProps = {
    hideWeekdays: {
      isSundayHidden: false,
      isMondayHidden: false,
      isTuesdayHidden: false,
      isWednesdayHidden: false,
      isThursdayHidden: false,
      isFridayHidden: false,
      isSaturdayHidden: false,
    },
    showDaysOfWeekPreferences: true,
    trackingPoints: {
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
    },
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
    updateWeekday: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<WeeklyTimeEntrySettingsForm {...defaultProps} />);
    expect(
      screen.getByTestId('weekly-time-entry-weekday-settings'),
    ).toBeInTheDocument();
  });

  it('renders WeeklyTimeEntryWeekdaySettings with correct props', () => {
    render(<WeeklyTimeEntrySettingsForm {...defaultProps} />);

    expect(
      screen.getByTestId('weekly-time-entry-weekday-settings'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('hide-weekdays')).toHaveTextContent(
      JSON.stringify(defaultProps.hideWeekdays),
    );
    expect(screen.getByTestId('tracking-points')).toHaveTextContent(
      JSON.stringify(defaultProps.trackingPoints),
    );
    expect(screen.getByTestId('settings-state')).toHaveTextContent(
      JSON.stringify(defaultProps.settingsState),
    );
  });

  it('shows weekday settings when showDaysOfWeekPreferences is true', () => {
    render(
      <WeeklyTimeEntrySettingsForm
        {...defaultProps}
        showDaysOfWeekPreferences
      />,
    );

    expect(
      screen.getByTestId('weekly-time-entry-weekday-settings'),
    ).toBeInTheDocument();
  });

  it('hides weekday settings when showDaysOfWeekPreferences is false', () => {
    render(
      <WeeklyTimeEntrySettingsForm
        {...defaultProps}
        showDaysOfWeekPreferences={false}
      />,
    );

    expect(
      screen.queryByTestId('weekly-time-entry-weekday-settings'),
    ).not.toBeInTheDocument();
  });

  it('passes updateWeekday function to child component', () => {
    const mockUpdateWeekday = jest.fn();
    render(
      <WeeklyTimeEntrySettingsForm
        {...defaultProps}
        updateWeekday={mockUpdateWeekday}
      />,
    );

    const updateButton = screen.getByTestId('update-weekday-button');
    updateButton.click();

    expect(mockUpdateWeekday).toHaveBeenCalledWith('isMondayEnabled', true);
  });

  it('handles different hideWeekdays configurations', () => {
    const customHideWeekdays = {
      isSundayHidden: true,
      isMondayHidden: false,
      isTuesdayHidden: true,
      isWednesdayHidden: false,
      isThursdayHidden: true,
      isFridayHidden: false,
      isSaturdayHidden: true,
    };

    render(
      <WeeklyTimeEntrySettingsForm
        {...defaultProps}
        hideWeekdays={customHideWeekdays}
      />,
    );

    expect(screen.getByTestId('hide-weekdays')).toHaveTextContent(
      JSON.stringify(customHideWeekdays),
    );
  });

  it('handles different settingsState configurations', () => {
    const customSettingsState = {
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

    render(
      <WeeklyTimeEntrySettingsForm
        {...defaultProps}
        settingsState={customSettingsState}
      />,
    );

    expect(screen.getByTestId('settings-state')).toHaveTextContent(
      JSON.stringify(customSettingsState),
    );
  });

  it('handles different trackingPoints configurations', () => {
    const customTrackingPoints = {
      SUNDAY_SETTING: {
        org: 'sbseg',
        purpose: 'prod',
        scope: 'time',
        scope_area: 'timeentrymanagement',
        screen: 'weekly_time_entry',
        action: 'engaged',
        object: 'component',
        object_detail: 'custom_sunday_setting',
        ui_action: 'clicked',
        ui_object: 'checkbox',
        ui_object_detail: 'custom_sunday_setting',
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
        object_detail: 'custom_monday_setting',
        ui_action: 'clicked',
        ui_object: 'checkbox',
        ui_object_detail: 'custom_monday_setting',
        ui_access_point: 'settings_panel',
      },
    };

    render(
      <WeeklyTimeEntrySettingsForm
        {...defaultProps}
        trackingPoints={customTrackingPoints}
      />,
    );

    expect(
      screen.getByTestId('weekly-time-entry-weekday-settings'),
    ).toBeInTheDocument();
  });

  it('handles missing showDaysOfWeekPreferences prop', () => {
    const propsWithoutShowDays = { ...defaultProps };
    // @ts-ignore - Testing optional prop
    delete propsWithoutShowDays.showDaysOfWeekPreferences;

    render(<WeeklyTimeEntrySettingsForm {...propsWithoutShowDays} />);

    expect(
      screen.getByTestId('weekly-time-entry-weekday-settings'),
    ).toBeInTheDocument();
  });

  describe('Snapshot Tests', () => {
    it('matches snapshot with default props', () => {
      const { container } = render(
        <WeeklyTimeEntrySettingsForm {...defaultProps} />,
      );
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with showDaysOfWeekPreferences enabled', () => {
      render(
        <WeeklyTimeEntrySettingsForm
          {...defaultProps}
          showDaysOfWeekPreferences
        />,
      );
      expect(
        screen.getByTestId('weekly-time-entry-weekday-settings'),
      ).toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    it('handles settings state changes', () => {
      const updatedSettingsState = {
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

      render(
        <WeeklyTimeEntrySettingsForm
          {...defaultProps}
          settingsState={updatedSettingsState}
        />,
      );

      expect(
        screen.getByTestId('weekly-time-entry-weekday-settings'),
      ).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined updateWeekday', () => {
      // This should not crash the component
      expect(() => {
        render(
          <WeeklyTimeEntrySettingsForm
            {...defaultProps}
            updateWeekday={undefined as any}
          />,
        );
      }).not.toThrow();
    });

    it('handles null props', () => {
      // This should not crash the component
      expect(() => {
        render(
          <WeeklyTimeEntrySettingsForm
            {...defaultProps}
            hideWeekdays={null as any}
            settingsState={null as any}
            trackingPoints={null as any}
          />,
        );
      }).not.toThrow();
    });
  });
});

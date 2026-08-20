import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithFormProvider } from 'test/unit/testUtils';

import {
  TimeSettingsPopoverForm,
  TimeSettingsPopoverFormProps,
} from 'src/js/widgets/common/timeSettingsPopover/TimeSettingsPopoverForm';
import { SINGLE_TIME_TRACKING_POINTS } from 'src/js/widgets/singleTimeTrowser/singleTimeTrackingPoints';
import { MOCK_TIME_TRACKING_SETTINGS } from 'test/unit/service/queries/settingsQueries';

describe('TimeSettingsPopoverForm', () => {
  let props: TimeSettingsPopoverFormProps;

  beforeEach(() => {
    props = {
      settings: {
        ...MOCK_TIME_TRACKING_SETTINGS,
        classRequired: false,
        locationRequired: false,
        serviceItemRequired: false,
        timeSheetEntryMakesNotesRequiredEnabled: false,
      },
      showDaysOfWeekPreferences: true,
      isSettingsAccessible: true,
      hasPayroll: true,
      isPayTypeEnabled: true,
      hasProjects: true,
      hasAdminAccess: true,
      canEditSettings: true,
      trackingPoints: SINGLE_TIME_TRACKING_POINTS,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render all checkboxes when all conditions are true', () => {
    renderWithFormProvider(<TimeSettingsPopoverForm {...props} />);

    // Check for field checkboxes
    expect(
      screen.getByLabelText(/drawer.form.class.label/),
    ).toBeInTheDocument();
    // expect(
    //   screen.getByLabelText(/drawer.form.project.label/),
    // ).toBeInTheDocument();
    expect(screen.getByLabelText(/billable.label.no.hour/)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/drawer.form.service.label/),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/drawer.form.location.label/),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/pay.type/)).toBeInTheDocument();
    expect(screen.getByLabelText(/cost.rate/)).toBeInTheDocument();
    expect(screen.getByLabelText(/taxable/)).toBeInTheDocument();

    // Check for days of the week checkboxes
    expect(screen.getByLabelText(/sunday/)).toBeInTheDocument();
    expect(screen.getByLabelText(/monday/)).toBeInTheDocument();
    expect(screen.getByLabelText(/tuesday/)).toBeInTheDocument();
    expect(screen.getByLabelText(/wednesday/)).toBeInTheDocument();
    expect(screen.getByLabelText(/thursday/)).toBeInTheDocument();
    expect(screen.getByLabelText(/friday/)).toBeInTheDocument();
    expect(screen.getByLabelText(/saturday/)).toBeInTheDocument();
  });

  it('should not render class and location checkboxes when conditions are false', () => {
    renderWithFormProvider(
      <TimeSettingsPopoverForm
        {...{
          ...props,
          ...{
            settings: {
              ...props.settings,
              isClassEnabled: false,
              isLocationEnabled: false,
              isServiceFieldEnabled: true,
              isBillingFieldEnabled: true,
              isTaxableFieldEnabled: true,
              firstDayOfWeek: 0,
              entityVersion: '1',
            },
            showDaysOfWeekPreferences: false,
            hasPayroll: false,
            hasProjects: false,
            hasAdminAccess: false,
          },
        }}
      />,
    );

    expect(
      screen.queryByLabelText(/drawer.form.class.label/),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/cost.rate/)).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(/drawer.form.location.label/),
    ).not.toBeInTheDocument();

    expect(screen.queryByLabelText(/sunday/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/monday/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/tuesday/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/wednesday/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/thursday/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/friday/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/saturday/)).not.toBeInTheDocument();
  });

  test.each([
    {
      isTimeEntry: true,
      description: 'isTimeEntry=true: pay type, cost rate, taxable hidden',
      expectHidden: true,
    },
    {
      isTimeEntry: false,
      description: 'isTimeEntry=false: pay type, cost rate, taxable visible',
      expectHidden: false,
    },
  ])('$description', ({ isTimeEntry, expectHidden }) => {
    renderWithFormProvider(
      <TimeSettingsPopoverForm {...{ ...props, isTimeEntry }} />,
    );

    if (expectHidden) {
      expect(screen.queryByLabelText(/pay.type/)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/cost.rate/)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/taxable/)).not.toBeInTheDocument();

      expect(
        screen.getByLabelText(/drawer.form.class.label/),
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(/billable.label.no.hour/),
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(/drawer.form.service.label/),
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(/drawer.form.location.label/),
      ).toBeInTheDocument();
    } else {
      expect(screen.getByLabelText(/pay.type/)).toBeInTheDocument();
      expect(screen.getByLabelText(/cost.rate/)).toBeInTheDocument();
      expect(screen.getByLabelText(/taxable/)).toBeInTheDocument();
    }
  });

  it('should respect both isTimeEntry and other conditions for pay type, cost rate and taxable fields', () => {
    renderWithFormProvider(
      <TimeSettingsPopoverForm
        {...{
          ...props,
          isTimeEntry: false,
          hasPayroll: false,
          hasProjects: false,
          hasAdminAccess: false,
          settings: {
            ...props.settings,
            isTaxableFieldEnabled: false,
          },
        }}
      />,
    );

    // Even though isTimeEntry is false, these fields should not be visible due to other conditions
    expect(screen.queryByLabelText(/pay.type/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/cost.rate/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/taxable/)).not.toBeInTheDocument();
  });
});

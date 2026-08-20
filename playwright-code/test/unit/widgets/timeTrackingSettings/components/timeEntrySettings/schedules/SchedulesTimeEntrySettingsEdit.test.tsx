import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { SchedulesTimeEntrySettingsEdit } from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/schedules/SchedulesTimeEntrySettingsEdit';

const scheduleMessages: Record<string, string> = {
  'time-entries.section.title.schedules.preferences': 'Preferences',
  'time-entries.section.title.schedules.workers-can-view-schedules-of':
    'Workers can view schedules of:',
  'time-entries.section.title.schedules.workers-can-manage-schedules-for':
    'Workers can manage schedules for:',
  'time-entries.section.title.schedules.option.none': 'None',
  'time-entries.section.title.schedules.option.their_own': 'Their own',
  'time-entries.section.title.schedules.option.group': 'Group',
  'time-entries.section.title.schedules.option.company': 'Company',
};

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => scheduleMessages[id] ?? id,
  }),
  useTracking: jest.fn(() => jest.fn()),
}));

jest.mock('@ids-ts/typography', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="typography-stub">{children}</span>
  ),
}));

jest.mock('@ids-ts/radio', () => ({
  RadioGroup: ({
    name,
    options,
    value,
    onChange,
  }: {
    name: string;
    options: Array<{ value: string; label: string; disabled?: boolean }>;
    value: string;
    onChange: (e: { target: { value: string } }) => void;
  }) => (
    <div data-testid={`radio-group-${name}`}>
      {options.map(({ value: optionValue, label: optionLabel, disabled }) => {
        const inputId = `${name}-${optionValue}`;
        return (
          <label key={optionValue} htmlFor={inputId}>
            <input
              id={inputId}
              type="radio"
              name={name}
              value={optionValue}
              checked={value === optionValue}
              disabled={Boolean(disabled)}
              onChange={() => {
                onChange({
                  target: { value: optionValue },
                } as React.ChangeEvent<HTMLInputElement>);
              }}
            />
            {optionLabel}
          </label>
        );
      })}
    </div>
  ),
}));

jest.mock('src/js/widgets/timeTrackingSettings/common/viewContent', () => ({
  BoldLabel: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="schedules-preferences-heading">{children}</div>
  ),
  SectionContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="section-container">{children}</div>
  ),
}));

describe('SchedulesTimeEntrySettingsEdit', () => {
  const defaultProps = {
    draftView: 'group' as const,
    draftManage: 'none' as const,
    onDraftViewChange: jest.fn(),
    onDraftManageChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders preferences heading and both radio groups', () => {
    render(<SchedulesTimeEntrySettingsEdit {...defaultProps} />);

    expect(
      screen.getByTestId('schedules-preferences-heading'),
    ).toHaveTextContent('Preferences');
    expect(
      screen.getByTestId('radio-group-schedules-view-preference'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('radio-group-schedules-manage-preference'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('schedules-edit-form')).toBeInTheDocument();
  });

  it('calls onDraftViewChange when a view option is selected', () => {
    render(<SchedulesTimeEntrySettingsEdit {...defaultProps} />);

    const companyInput = screen
      .getByTestId('radio-group-schedules-view-preference')
      .querySelector('input[value="company"]') as HTMLInputElement;

    fireEvent.click(companyInput);
    expect(defaultProps.onDraftViewChange).toHaveBeenCalledWith('company');
  });

  it('calls onDraftManageChange when a manage option is selected', () => {
    render(<SchedulesTimeEntrySettingsEdit {...defaultProps} />);

    const groupInput = screen
      .getByTestId('radio-group-schedules-manage-preference')
      .querySelector('input[value="group"]') as HTMLInputElement;

    fireEvent.click(groupInput);
    expect(defaultProps.onDraftManageChange).toHaveBeenCalledWith('group');
  });

  it('disables "Their own" in view group when manage is group', () => {
    render(
      <SchedulesTimeEntrySettingsEdit
        {...defaultProps}
        draftView="group"
        draftManage="group"
      />,
    );

    const theirOwnInput = screen
      .getByTestId('radio-group-schedules-view-preference')
      .querySelector('input[value="their_own"]') as HTMLInputElement;

    expect(theirOwnInput).toBeDisabled();
  });

  it('does not disable view options when manage is none', () => {
    render(
      <SchedulesTimeEntrySettingsEdit
        {...defaultProps}
        draftManage="none"
        draftView="their_own"
      />,
    );

    const theirOwnInput = screen
      .getByTestId('radio-group-schedules-view-preference')
      .querySelector('input[value="their_own"]') as HTMLInputElement;

    expect(theirOwnInput).not.toBeDisabled();
  });

  describe('when manage schedule is company', () => {
    const companyManageProps = {
      ...defaultProps,
      draftManage: 'company' as const,
      draftView: 'company' as const,
    };

    it('disables "Their own" and "Group" in view schedule; only "Company" is enabled', () => {
      render(<SchedulesTimeEntrySettingsEdit {...companyManageProps} />);

      const viewGroup = screen.getByTestId(
        'radio-group-schedules-view-preference',
      );

      expect(
        viewGroup.querySelector('input[value="their_own"]'),
      ).toBeDisabled();
      expect(viewGroup.querySelector('input[value="group"]')).toBeDisabled();
      expect(
        viewGroup.querySelector('input[value="company"]'),
      ).not.toBeDisabled();
      expect(viewGroup.querySelector('input[value="company"]')).toBeChecked();
    });

    it('still allows changing manage schedule (all manage options remain selectable)', () => {
      render(<SchedulesTimeEntrySettingsEdit {...companyManageProps} />);

      const manageGroup = screen.getByTestId(
        'radio-group-schedules-manage-preference',
      );

      ['none', 'their_own', 'group', 'company'].forEach((value) => {
        expect(
          manageGroup.querySelector(`input[value="${value}"]`),
        ).not.toBeDisabled();
      });
    });

    it('calls onDraftManageChange when switching manage away from company', () => {
      render(<SchedulesTimeEntrySettingsEdit {...companyManageProps} />);

      const noneInput = screen
        .getByTestId('radio-group-schedules-manage-preference')
        .querySelector('input[value="none"]') as HTMLInputElement;

      fireEvent.click(noneInput);
      expect(companyManageProps.onDraftManageChange).toHaveBeenCalledWith(
        'none',
      );
    });
  });
});

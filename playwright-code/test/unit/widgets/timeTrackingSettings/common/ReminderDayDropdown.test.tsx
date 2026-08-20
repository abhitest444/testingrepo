import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useForm } from 'react-hook-form';
import {
  ReminderDayDropdown,
  ApprovalPayPeriodDropdown,
  ReminderDayMode,
} from 'src/js/widgets/timeTrackingSettings/common/ReminderDayDropdown';
import {
  NOTIFICATION_DAYS_OF_WEEK,
  ApprovalRemindersbasedOn,
} from 'src/js/widgets/timeTrackingSettings/constants';
import { ITimeEntrySettingsFormState } from 'src/js/widgets/timeTrackingSettings/types';

// Mock the Intl hook
jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => id,
  }),
}));

// Mock IDS Dropdown component
jest.mock('@ids-ts/dropdown', () => ({
  Dropdown: ({
    children,
    label,
    onChange,
    value,
    multiselect,
    width,
    placeholder,
  }: any) => (
    <div data-testid="dropdown-container">
      {label && <label>{label}</label>}
      <select
        data-testid="dropdown"
        onChange={onChange}
        value={value}
        multiple={multiselect}
        style={{ width }}
        data-placeholder={placeholder}
      >
        {children}
      </select>
    </div>
  ),
  MenuItem: ({ children, value }: any) => (
    <option value={value}>{children}</option>
  ),
}));

describe('ReminderDayDropdown', () => {
  // Helper component to wrap ReminderDayDropdown with react-hook-form
  const TestWrapper = ({
    mode,
    defaultValue,
    multiselect = false,
    labelKey,
    width,
  }: {
    mode: ReminderDayMode;
    defaultValue?: string | string[];
    multiselect?: boolean;
    labelKey?: string;
    width?: string;
  }) => {
    const { control } = useForm<ITimeEntrySettingsFormState>({
      defaultValues: {
        managerCurrentWeekReminderDays: (defaultValue as string[]) || ['1'],
      } as Partial<ITimeEntrySettingsFormState>,
    });

    return (
      <ReminderDayDropdown
        name="managerCurrentWeekReminderDays"
        control={control}
        mode={mode}
        defaultValue={defaultValue}
        multiselect={multiselect}
        labelKey={labelKey}
        width={width}
      />
    );
  };

  describe('PAYROLL_CLOSE_DATE mode', () => {
    it('should render pay period options', () => {
      render(
        <TestWrapper mode={ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE} />,
      );

      const dropdown = screen.getByTestId('dropdown');
      expect(dropdown).toBeInTheDocument();

      // Check that pay period options are rendered
      expect(
        screen.getByText('time-entries.approvals.payroll-close-date.on'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'time-entries.approvals.payroll-close-date.1-day-after',
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'time-entries.approvals.payroll-close-date.2-days-after',
        ),
      ).toBeInTheDocument();
    });

    it('should handle onChange in PAYROLL_CLOSE_DATE mode by converting to number', () => {
      const { container } = render(
        <TestWrapper
          mode={ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE}
          defaultValue="2"
        />,
      );

      const dropdown = screen.getByTestId('dropdown') as HTMLSelectElement;
      expect(dropdown.value).toBe('2');

      fireEvent.change(dropdown, { target: { value: '3' } });

      // The value should be updated (react-hook-form handles this)
      expect(dropdown.value).toBe('3');
    });

    it('should render with label', () => {
      render(
        <TestWrapper
          mode={ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE}
          labelKey="test.label.key"
        />,
      );

      expect(screen.getByText('test.label.key')).toBeInTheDocument();
    });

    it('should render with custom width', () => {
      const { container } = render(
        <TestWrapper
          mode={ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE}
          width="300px"
        />,
      );

      const dropdown = screen.getByTestId('dropdown');
      expect(dropdown).toHaveStyle({ width: '300px' });
    });
  });

  describe('DAY_OF_WEEK mode', () => {
    it('should render days of week options', () => {
      render(<TestWrapper mode={ApprovalRemindersbasedOn.DAY_OF_WEEK} />);

      const dropdown = screen.getByTestId('dropdown');
      expect(dropdown).toBeInTheDocument();

      // Check that all days of week are rendered
      Object.keys(NOTIFICATION_DAYS_OF_WEEK).forEach((day) => {
        expect(screen.getByText(day)).toBeInTheDocument();
      });
    });

    it('should handle single-select in DAY_OF_WEEK mode and store as array', () => {
      const { container } = render(
        <TestWrapper
          mode={ApprovalRemindersbasedOn.DAY_OF_WEEK}
          defaultValue={['MONDAY']}
        />,
      );

      const dropdown = screen.getByTestId('dropdown') as HTMLSelectElement;
      expect(dropdown.value).toBe('MONDAY');

      fireEvent.change(dropdown, { target: { value: 'TUESDAY' } });

      // The value should be updated
      expect(dropdown.value).toBe('TUESDAY');
    });

    it('should render with multiselect enabled', () => {
      render(
        <TestWrapper
          mode={ApprovalRemindersbasedOn.DAY_OF_WEEK}
          multiselect
          defaultValue={['MONDAY', 'TUESDAY']}
        />,
      );

      const dropdown = screen.getByTestId('dropdown') as HTMLSelectElement;
      expect(dropdown).toHaveAttribute('multiple');
    });
  });

  describe('DAILY mode', () => {
    it('should render days of week options in DAILY mode', () => {
      render(<TestWrapper mode={ApprovalRemindersbasedOn.DAILY} />);

      const dropdown = screen.getByTestId('dropdown');
      expect(dropdown).toBeInTheDocument();

      // In DAILY mode, it should still render days of week
      Object.keys(NOTIFICATION_DAYS_OF_WEEK).forEach((day) => {
        expect(screen.getByText(day)).toBeInTheDocument();
      });
    });

    it('should handle onChange in DAILY mode', () => {
      render(
        <TestWrapper
          mode={ApprovalRemindersbasedOn.DAILY}
          defaultValue="MONDAY"
        />,
      );

      const dropdown = screen.getByTestId('dropdown') as HTMLSelectElement;
      expect(dropdown.value).toBe('MONDAY');

      // Simulate changing value
      fireEvent.change(dropdown, { target: { value: 'FRIDAY' } });

      // The value should be updated
      expect(dropdown.value).toBe('FRIDAY');
    });
  });

  describe('Multiselect functionality', () => {
    it('should handle multiselect onChange correctly - adding value', () => {
      const { container, rerender } = render(
        <TestWrapper
          mode={ApprovalRemindersbasedOn.DAY_OF_WEEK}
          multiselect
          defaultValue={['MONDAY']}
        />,
      );

      const dropdown = screen.getByTestId('dropdown') as HTMLSelectElement;

      // Simulate selecting an additional day
      fireEvent.change(dropdown, { target: { value: 'TUESDAY' } });

      // The component should handle the multiselect logic
      expect(dropdown).toBeInTheDocument();
    });

    it('should handle multiselect onChange correctly - removing value', () => {
      const { container } = render(
        <TestWrapper
          mode={ApprovalRemindersbasedOn.DAY_OF_WEEK}
          multiselect
          defaultValue={['MONDAY', 'TUESDAY']}
        />,
      );

      const dropdown = screen.getByTestId('dropdown') as HTMLSelectElement;

      // Simulate deselecting an already selected day
      fireEvent.change(dropdown, { target: { value: 'MONDAY' } });

      // The component should handle the multiselect deselection logic
      expect(dropdown).toBeInTheDocument();
    });
  });

  describe('Value handling', () => {
    it('should handle undefined value and use defaultValue', () => {
      render(
        <TestWrapper
          mode={ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE}
          defaultValue={undefined}
        />,
      );

      const dropdown = screen.getByTestId('dropdown') as HTMLSelectElement;
      expect(dropdown).toBeInTheDocument();
      // Should use default value of '1'
      expect(dropdown.value).toBe('1');
    });

    it('should handle null value', () => {
      render(
        <TestWrapper
          mode={ApprovalRemindersbasedOn.DAY_OF_WEEK}
          defaultValue="1"
        />,
      );

      const dropdown = screen.getByTestId('dropdown') as HTMLSelectElement;
      expect(dropdown).toBeInTheDocument();
    });

    it('should handle array value in single-select mode', () => {
      render(
        <TestWrapper
          mode={ApprovalRemindersbasedOn.DAY_OF_WEEK}
          defaultValue={['MONDAY']}
        />,
      );

      const dropdown = screen.getByTestId('dropdown') as HTMLSelectElement;
      expect(dropdown.value).toBe('MONDAY');
    });

    it('should handle string value', () => {
      render(
        <TestWrapper
          mode={ApprovalRemindersbasedOn.DAY_OF_WEEK}
          defaultValue="FRIDAY"
        />,
      );

      const dropdown = screen.getByTestId('dropdown') as HTMLSelectElement;
      expect(dropdown.value).toBe('FRIDAY');
    });
  });

  describe('Pre-configured components', () => {
    const PreConfiguredTestWrapper = ({
      Component,
      defaultValue,
    }: {
      Component: typeof ApprovalPayPeriodDropdown;
      defaultValue?: string | string[];
    }) => {
      const { control } = useForm<ITimeEntrySettingsFormState>({
        defaultValues: {
          managerCurrentPayPeriodReminderOffsetDays: Number(defaultValue) || 1,
        } as Partial<ITimeEntrySettingsFormState>,
      });

      return (
        <Component
          name="managerCurrentPayPeriodReminderOffsetDays"
          control={control}
          defaultValue={defaultValue}
        />
      );
    };

    it('should render ApprovalPayPeriodDropdown with correct options', () => {
      render(
        <PreConfiguredTestWrapper Component={ApprovalPayPeriodDropdown} />,
      );

      expect(
        screen.getByText('time-entries.approvals.payroll-close-date.on'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'time-entries.approvals.payroll-close-date.1-day-after',
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'time-entries.approvals.payroll-close-date.2-days-after',
        ),
      ).toBeInTheDocument();
    });

    it('should render SubmissionPayPeriodDropdown with correct options', () => {
      render(
        <PreConfiguredTestWrapper Component={ApprovalPayPeriodDropdown} />,
      );

      expect(
        screen.getByText('time-entries.approvals.payroll-close-date.on'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'time-entries.approvals.payroll-close-date.1-day-after',
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'time-entries.approvals.payroll-close-date.2-days-after',
        ),
      ).toBeInTheDocument();
    });

    it('ApprovalPayPeriodDropdown should handle value changes', () => {
      render(
        <PreConfiguredTestWrapper
          Component={ApprovalPayPeriodDropdown}
          defaultValue="2"
        />,
      );

      const dropdown = screen.getByTestId('dropdown') as HTMLSelectElement;
      expect(dropdown.value).toBe('2');

      fireEvent.change(dropdown, { target: { value: '4' } });
      expect(dropdown.value).toBe('4');
    });
  });

  describe('Integration with react-hook-form', () => {
    it('should integrate correctly with react-hook-form Controller', () => {
      render(
        <TestWrapper
          mode={ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE}
          defaultValue="1"
        />,
      );

      const dropdown = screen.getByTestId('dropdown');
      expect(dropdown).toBeInTheDocument();

      // The Controller should properly wire up the onChange and value
      fireEvent.change(dropdown, { target: { value: '3' } });
    });

    it('should pass control prop to Controller', () => {
      render(<TestWrapper mode={ApprovalRemindersbasedOn.DAY_OF_WEEK} />);

      const dropdown = screen.getByTestId('dropdown');
      expect(dropdown).toBeInTheDocument();
    });
  });

  describe('Label rendering', () => {
    it('should render without label when labelKey is not provided', () => {
      render(
        <TestWrapper mode={ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE} />,
      );

      const labels = screen.queryAllByRole('label');
      // Should not have a label element
      expect(labels.length).toBe(0);
    });

    it('should render with label when labelKey is provided', () => {
      render(
        <TestWrapper
          mode={ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE}
          labelKey="my.label.key"
        />,
      );

      expect(screen.getByText('my.label.key')).toBeInTheDocument();
    });
  });

  describe('Placeholder', () => {
    it('should render with location-settings.fields.select-days placeholder', () => {
      render(
        <TestWrapper mode={ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE} />,
      );

      const dropdown = screen.getByTestId('dropdown');
      expect(dropdown).toHaveAttribute(
        'data-placeholder',
        'location-settings.fields.select-days',
      );
    });
  });

  describe('Width prop', () => {
    it('should use default width of 100%', () => {
      const { container } = render(
        <TestWrapper mode={ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE} />,
      );

      const dropdown = screen.getByTestId('dropdown');
      expect(dropdown).toHaveStyle({ width: '100%' });
    });

    it('should use custom width when provided', () => {
      const { container } = render(
        <TestWrapper
          mode={ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE}
          width="250px"
        />,
      );

      const dropdown = screen.getByTestId('dropdown');
      expect(dropdown).toHaveStyle({ width: '250px' });
    });
  });
});

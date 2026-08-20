import React from 'react';
import { ApolloError } from '@apollo/client';
import { buildSandbox } from '@payroll/quicksand';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useWatch } from 'react-hook-form';
import { TimeOffMethod } from 'src/__generated__/gas/graphql';
import { useGetPayTypes } from 'src/js/service/hooks/paytypes/useGetPayTypes';
import { TimeForType } from 'src/js/widgets/common/addTimeFormComponents/TeamMember'; // TODO upgrade to use Apollo query mocking instead

import {
  CompensationDropdown,
  CompensationDropdownProps,
} from 'src/js/widgets/common/CompensationDropdown';
import { renderWithFormProvider } from 'test/unit/testUtils';
import { mockPayTypes } from 'test/unit/fixtures';

// TODO upgrade to use Apollo query mocking instead
jest.mock('src/js/service/hooks/paytypes/useGetPayTypes');

jest.mock('react-hook-form', () => ({
  ...jest.requireActual('react-hook-form'),
  useWatch: jest.fn(),
}));

describe('CompensationDropdown', () => {
  let props: CompensationDropdownProps;

  beforeEach(() => {
    (useWatch as jest.Mock).mockReturnValue(false); // Default to unlocked
    (useGetPayTypes as jest.Mock).mockReturnValue({ data: mockPayTypes });

    props = {
      value: '',
      onChange: jest.fn(),
      timeOffMethod: null,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders dropdown with pay types', async () => {
    renderWithFormProvider(<CompensationDropdown {...props} />, {
      defaultValues: {
        timeFor: { id: '1', type: TimeForType.EMPLOYEE },
      },
    });

    const dropdownButton = screen.getByRole('combobox');
    await userEvent.click(dropdownButton);

    expect(screen.getByText('Hourly')).toBeInTheDocument();
    expect(screen.getByText('Salary')).toBeInTheDocument();
  });

  it('renders dropdown with default option when no pay types available', async () => {
    (useGetPayTypes as jest.Mock).mockReturnValue({ data: [] });

    renderWithFormProvider(<CompensationDropdown {...props} />, {
      defaultValues: {
        timeFor: { id: '1', type: TimeForType.EMPLOYEE },
      },
    });

    expect(screen.getByPlaceholderText(/pay.type.none/)).toBeInTheDocument();
  });

  it('renders dropdown with default option when pay types error', async () => {
    (useGetPayTypes as jest.Mock).mockReturnValue({
      data: [],
      error: new ApolloError({ errorMessage: 'MOCK_ERROR' }),
    });

    renderWithFormProvider(<CompensationDropdown {...props} />, {
      defaultValues: {
        timeFor: { id: '1', type: TimeForType.EMPLOYEE },
      },
    });

    expect(screen.getByPlaceholderText(/pay.type.none/)).toBeInTheDocument();
  });

  it('calls onChange when a pay type is selected', async () => {
    renderWithFormProvider(<CompensationDropdown {...props} />, {
      defaultValues: {
        timeFor: { id: '1', type: TimeForType.EMPLOYEE },
      },
    });

    const dropdownButton = screen.getByRole('combobox');
    await userEvent.click(dropdownButton);

    fireEvent.click(screen.getByText('Hourly'));
    expect(props.onChange).toHaveBeenCalledWith({ id: '1', name: 'Hourly' });
  });

  it('displays error text when provided', () => {
    const errorText = 'This field is required';

    renderWithFormProvider(
      <CompensationDropdown {...{ ...props, errorText }} />,
      {
        defaultValues: {
          timeFor: { id: '1', type: TimeForType.EMPLOYEE },
        },
      },
    );

    expect(screen.getByText(errorText)).toBeInTheDocument();
  });

  it('calls updateLabel on mount with correct data', async () => {
    const mockUpdateLabel = jest.fn();
    const value = '1';
    (useGetPayTypes as jest.Mock).mockReturnValue({ data: mockPayTypes });
    props.value = value;
    props.updateLabel = mockUpdateLabel;
    renderWithFormProvider(<CompensationDropdown {...props} />, {
      defaultValues: {
        timeFor: { id: '1', type: TimeForType.EMPLOYEE },
      },
    });
    await waitFor(() =>
      expect(mockUpdateLabel).toHaveBeenCalledWith('payType', 'Hourly'),
    );
  });

  it('handles eligible pay types', async () => {
    const sandbox = buildSandbox();
    sandbox.extensions.qbo.context.getCompanyL10nInfo = jest
      .fn()
      .mockReturnValue({
        region: 'US',
      });

    renderWithFormProvider(
      <CompensationDropdown {...props} />,
      {
        defaultValues: {
          timeFor: { id: '1', type: TimeForType.EMPLOYEE },
        },
      },
      sandbox,
    );

    const dropdownButton = screen.getByRole('combobox');
    await userEvent.click(dropdownButton);

    // As this is a US company, expect that the following will be in the dropdown
    expect(screen.queryByText('Hourly')).toBeInTheDocument();
    expect(screen.queryByText('Salary')).toBeInTheDocument();
    expect(screen.queryByText('Vacation Pay')).toBeInTheDocument();
    expect(screen.queryByText('Sick Pay')).toBeInTheDocument();
    expect(screen.queryByText('Holiday Pay')).toBeInTheDocument();
    expect(screen.queryByText('Bereavement Pay')).toBeInTheDocument();
    expect(screen.queryByText('Unpaid Time Off')).toBeInTheDocument();
    expect(screen.queryByText('Paid Time Off')).toBeInTheDocument();
    expect(
      screen.queryByText('Employee National Paid Sick Leave'),
    ).toBeInTheDocument();

    expect(screen.queryByText('Custom 1')).not.toBeInTheDocument();
  });

  it('handles eligible pay types for CA region', async () => {
    const sandbox = buildSandbox();
    sandbox.extensions.qbo.context.getCompanyL10nInfo = jest
      .fn()
      .mockReturnValue({
        region: 'CA',
      });

    renderWithFormProvider(
      <CompensationDropdown
        {...props}
        timeOffMethod={TimeOffMethod.AccrualTime}
      />,
      {
        defaultValues: {
          timeFor: { id: '1', type: TimeForType.EMPLOYEE },
        },
      },
      sandbox,
    );

    const dropdownButton = screen.getByRole('combobox');
    await userEvent.click(dropdownButton);

    // As this is a US company, expect that the following will be in the dropdown
    expect(screen.queryByText('Hourly')).toBeInTheDocument();
    expect(screen.queryByText('Salary')).toBeInTheDocument();
    expect(screen.queryByText('Vacation Pay')).toBeInTheDocument();
    expect(screen.queryByText('Sick Pay')).toBeInTheDocument();
    expect(screen.queryByText('Holiday Pay')).toBeInTheDocument();
    expect(screen.queryByText('Bereavement Pay')).toBeInTheDocument();
    expect(screen.queryByText('Unpaid Time Off')).toBeInTheDocument();

    // CA does not have these pay types show in the dropdown.
    expect(screen.queryByText('Paid Time Off')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Employee National Paid Sick Leave'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Custom 1')).not.toBeInTheDocument();

    // When timeOffMethod is NOT AccrualTime, expect that vacation will not be in the dropdown
    renderWithFormProvider(
      <CompensationDropdown
        {...props}
        timeOffMethod={TimeOffMethod.UnlimitedTime}
      />,
      {
        defaultValues: {
          timeFor: { id: '1', type: TimeForType.EMPLOYEE },
        },
      },
      sandbox,
    );

    await userEvent.click(dropdownButton);
    expect(screen.queryByText('Vacation Pay')).not.toBeInTheDocument();
  });

  test.each([
    {
      isLocked: true,
      description: 'dropdown is disabled when isLocked is true',
      expectDisabled: true,
    },
    {
      isLocked: false,
      description: 'dropdown is enabled when isLocked is false',
      expectDisabled: false,
    },
  ])('$description', async ({ isLocked, expectDisabled }) => {
    (useWatch as jest.Mock).mockReturnValue(isLocked);

    renderWithFormProvider(<CompensationDropdown {...props} />, {
      defaultValues: {
        timeFor: { id: '1', type: TimeForType.EMPLOYEE },
        isLocked,
      },
    });

    const dropdownButton = screen.getByRole('combobox');
    if (expectDisabled) {
      expect(dropdownButton).toBeDisabled();
    } else {
      expect(dropdownButton).not.toBeDisabled();
    }
  });
});

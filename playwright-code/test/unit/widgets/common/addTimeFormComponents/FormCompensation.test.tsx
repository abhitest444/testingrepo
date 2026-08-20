import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { TimeOffMethod } from 'src/__generated__/gas/graphql';
import { renderWithFormProvider } from 'test/unit/testUtils';

import {
  FormCompensation,
  FormCompensationProps,
} from 'src/js/widgets/common/addTimeFormComponents/FormCompensation';
import { SINGLE_TIME_TRACKING_POINTS } from '../../../../../src/js/widgets/singleTimeTrowser/singleTimeTrackingPoints';

jest.mock('src/js/widgets/common/CompensationDropdown', () => ({
  CompensationDropdown: jest.fn(({ value, onChange, errorText }) => (
    <div>
      <select
        data-testid="compensation-dropdown"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select Compensation</option>
        <option value="1">Compensation 1</option>
        <option value="2">Compensation 2</option>
      </select>
      {errorText && <span data-testid="error-text">{errorText}</span>}
    </div>
  )),
}));

describe('FormCompensation', () => {
  let props: FormCompensationProps;

  beforeEach(() => {
    props = {
      name: 'compensation',
      trackingPoint: SINGLE_TIME_TRACKING_POINTS.PAY_TYPE,
      timeOffMethod: TimeOffMethod.AccrualTime,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders CompensationDropdown with initial value', () => {
    renderWithFormProvider(<FormCompensation {...props} />, {
      defaultValues: {
        compensation: {
          id: '1',
          name: '',
        },
      },
    });
    expect(screen.getByTestId('compensation-dropdown')).toHaveValue('1');
  });

  // it('displays error message when value is empty', async () => {
  //   renderWithProviders(<FormCompensation name="compensation" />, {
  //     defaultValues: { compensation: '' },
  //   });
  //   fireEvent.blur(screen.getByTestId('compensation-dropdown'));
  //   expect(await screen.findByTestId('error-text')).toHaveTextContent(
  //     'This field is required',
  //   );
  // });

  // it('calls onChange when a new value is selected', () => {
  //   renderWithFormProvider(<FormCompensation {...props} />, {
  //     defaultValues: {
  //       compensation: {
  //         id: '',
  //         name: '',
  //       },
  //     },
  //   });
  //   fireEvent.change(screen.getByTestId('compensation-dropdown'), {
  //     target: { value: '2' },
  //   });
  //   expect(screen.getByTestId('compensation-dropdown')).toHaveValue('2');
  // });

  it('does not display error message when a valid value is selected', async () => {
    renderWithFormProvider(<FormCompensation {...props} />, {
      defaultValues: {
        compensation: {
          id: '1',
          name: '',
        },
      },
    });
    fireEvent.blur(screen.getByTestId('compensation-dropdown'));
    expect(screen.queryByTestId('error-text')).toBeNull();
  });
});

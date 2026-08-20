import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import dayjs from 'dayjs';
import '@testing-library/jest-dom/extend-expect';

import { renderWithFormProvider } from 'test/unit/testUtils';

import {
  DurationCell,
  DurationCellProps,
} from 'src/js/widgets/common/addTimeFormComponents/DurationCell';
import { SINGLE_TIME_TRACKING_POINTS } from '../../../../../src/js/widgets/singleTimeTrowser/singleTimeTrackingPoints';

describe('DurationCell Component', () => {
  let props: DurationCellProps;

  beforeEach(() => {
    props = {
      name: 'duration',
      setError: jest.fn(),
      trackingPoint: SINGLE_TIME_TRACKING_POINTS.DURATION,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render DurationField with initial value', () => {
    renderWithFormProvider(<DurationCell {...props} />, {
      defaultValues: {
        duration: {
          duration: 0,
          day: dayjs(),
        },
      },
    });

    const input = screen.getByPlaceholderText('hh:mm');
    expect(input).toBeInTheDocument();
  });

  it('should call onChange with the correct value', () => {
    renderWithFormProvider(<DurationCell {...props} />, {
      defaultValues: {
        duration: {
          duration: 0,
          day: dayjs(),
        },
      },
    });

    const input = screen.getByPlaceholderText('hh:mm');
    fireEvent.change(input, { target: { value: '1:30' } });
    fireEvent.blur(input);

    expect(input).toHaveValue('01:30');
  });

  it('should set error when invalid duration format is entered', () => {
    renderWithFormProvider(<DurationCell {...props} />, {
      defaultValues: {
        duration: {
          duration: 0,
          day: dayjs(),
        },
      },
    });

    const input = screen.getByPlaceholderText('hh:mm');
    fireEvent.change(input, { target: { value: 'invalid' } });
    fireEvent.blur(input);

    expect(props.setError).toHaveBeenCalledWith('duration', {
      type: 'custom',
      message: expect.any(String),
    });
  });

  it('should  clear error when valid duration format is entered', () => {
    renderWithFormProvider(<DurationCell {...props} />, {
      defaultValues: {
        duration: {
          duration: 0,
          day: dayjs(),
        },
      },
    });

    const input = screen.getByPlaceholderText('hh:mm');
    fireEvent.change(input, { target: { value: '1:30' } });
    fireEvent.blur(input);

    expect(props.setError).toHaveBeenCalledWith('duration', {
      message: undefined,
      type: 'custom',
    });
  });
});

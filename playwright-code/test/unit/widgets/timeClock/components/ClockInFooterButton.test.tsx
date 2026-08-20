import React from 'react';
import { render, screen } from '@testing-library/react';
import dayjs from 'dayjs';
import { ClockInFooterButton } from 'src/js/widgets/timeClock/components/ClockInFooterButton';

jest.mock('@payroll/quicksand', () => ({
  ...jest.requireActual('@payroll/quicksand'),
  useIntl: () => ({ formatMessage: ({ id }: { id: string }) => id }),
}));

const mockUseSubmitTimeDatesContext = jest.fn();
jest.mock(
  'src/js/widgets/common/submitTimeDates/SubmitTimeDatesProvider',
  () => ({
    useSubmitTimeDatesContext: () => mockUseSubmitTimeDatesContext(),
  }),
);

const TIMEZONE = 'America/New_York';

const renderButton = (disabled = false) =>
  render(
    <ClockInFooterButton
      timezone={TIMEZONE}
      disabled={disabled}
      onClick={jest.fn()}
    />,
  );

describe('ClockInFooterButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSubmitTimeDatesContext.mockReturnValue({
      minSelectableDate: undefined,
      loading: false,
    });
  });

  it('is enabled when there is no submit-time lock', () => {
    renderButton();
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('is disabled while the submit-time fetch is loading', () => {
    mockUseSubmitTimeDatesContext.mockReturnValue({
      minSelectableDate: undefined,
      loading: true,
    });
    renderButton();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is disabled when the first selectable date is after today (all clock-in dates locked)', () => {
    mockUseSubmitTimeDatesContext.mockReturnValue({
      minSelectableDate: dayjs().add(5, 'day'),
      loading: false,
    });
    renderButton();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is enabled when the lock is in the past (today is still clockable)', () => {
    mockUseSubmitTimeDatesContext.mockReturnValue({
      minSelectableDate: dayjs().subtract(5, 'day'),
      loading: false,
    });
    renderButton();
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('respects the disabled prop from the parent', () => {
    renderButton(true);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

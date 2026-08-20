import React from 'react';
import { render, screen } from '@testing-library/react';
import dayjs from 'dayjs';
import {
  SubmitTimeDatesProvider,
  useSubmitTimeDatesContext,
} from 'src/js/widgets/common/submitTimeDates/SubmitTimeDatesProvider';

const mockUseWorkerSubmitTimeDates = jest.fn();
jest.mock('src/js/service/hooks/useWorkerSubmitTimeDates', () => ({
  useWorkerSubmitTimeDates: (args: unknown) =>
    mockUseWorkerSubmitTimeDates(args),
}));

jest.mock('@payroll/quicksand', () => ({
  ...jest.requireActual('@payroll/quicksand'),
  useSandbox: () => ({}),
}));

const mockIsWorkforceEnvironment = jest.fn();
jest.mock('src/js/service/utils/sandboxUtils', () => ({
  isWorkforceEnvironment: () => mockIsWorkforceEnvironment(),
}));

const mockUseIsSubmitTimeEnabled = jest.fn();
jest.mock('src/js/service/hooks/useIsSubmitTimeEnabled', () => ({
  useIsSubmitTimeEnabled: () => mockUseIsSubmitTimeEnabled(),
}));

const Consumer: React.FC = () => {
  const { minSelectableDate, submittedTo, error } = useSubmitTimeDatesContext();
  return (
    <div>
      <span data-testid="min">
        {minSelectableDate ? minSelectableDate.format('YYYY-MM-DD') : 'none'}
      </span>
      <span data-testid="submitted">{submittedTo ?? 'none'}</span>
      <span data-testid="error">{error ? error.message : 'none'}</span>
    </div>
  );
};

describe('SubmitTimeDatesProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWorkerSubmitTimeDates.mockReturnValue({
      minSelectableDate: undefined,
      submittedTo: null,
      loading: false,
    });
    mockIsWorkforceEnvironment.mockReturnValue(true);
    mockUseIsSubmitTimeEnabled.mockReturnValue(true);
  });

  it('provides the derived min date and submittedTo to descendants (Workforce + flag on)', () => {
    mockUseWorkerSubmitTimeDates.mockReturnValue({
      minSelectableDate: dayjs('2026-06-16'),
      submittedTo: '2026-06-15',
      loading: false,
    });

    render(
      <SubmitTimeDatesProvider>
        <Consumer />
      </SubmitTimeDatesProvider>,
    );

    expect(screen.getByTestId('min').textContent).toBe('2026-06-16');
    expect(screen.getByTestId('submitted').textContent).toBe('2026-06-15');
    expect(mockUseWorkerSubmitTimeDates).toHaveBeenCalledWith(
      expect.objectContaining({ skip: false }),
    );
  });

  it('does not evaluate submit-time capability or fetch when NOT in a Workforce environment', () => {
    mockIsWorkforceEnvironment.mockReturnValue(false);

    render(
      <SubmitTimeDatesProvider>
        <Consumer />
      </SubmitTimeDatesProvider>,
    );

    // Outside Workforce we render children with the no-op default context:
    // neither submit-time capability nor the submit-time fetch should run.
    expect(mockUseIsSubmitTimeEnabled).not.toHaveBeenCalled();
    expect(mockUseWorkerSubmitTimeDates).not.toHaveBeenCalled();
    expect(screen.getByTestId('min').textContent).toBe('none');
  });

  it('skips the fetch in Workforce when submit-time capability is off', () => {
    mockUseIsSubmitTimeEnabled.mockReturnValue(false);

    render(
      <SubmitTimeDatesProvider>
        <Consumer />
      </SubmitTimeDatesProvider>,
    );

    expect(mockUseIsSubmitTimeEnabled).toHaveBeenCalled();
    expect(mockUseWorkerSubmitTimeDates).toHaveBeenCalledWith(
      expect.objectContaining({ skip: true }),
    );
    expect(screen.getByTestId('min').textContent).toBe('none');
  });

  it('returns a safe no-op default when no provider is mounted', () => {
    render(<Consumer />);
    expect(screen.getByTestId('min').textContent).toBe('none');
    expect(screen.getByTestId('submitted').textContent).toBe('none');
    expect(screen.getByTestId('error').textContent).toBe('none');
  });

  it('exposes the fetch error to descendants', () => {
    mockUseWorkerSubmitTimeDates.mockReturnValue({
      minSelectableDate: undefined,
      submittedTo: null,
      loading: false,
      error: new Error('fetch failed'),
    });

    render(
      <SubmitTimeDatesProvider>
        <Consumer />
      </SubmitTimeDatesProvider>,
    );

    expect(screen.getByTestId('error').textContent).toBe('fetch failed');
  });
});

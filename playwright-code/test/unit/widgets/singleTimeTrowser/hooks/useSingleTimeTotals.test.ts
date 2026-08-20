import { renderHook } from '@testing-library/react-hooks';
import { useFormContext } from 'react-hook-form';
import moment from 'moment';
import { useSingleTimeTotals } from 'src/js/widgets/singleTimeTrowser/hooks/useSingleTimeTotals';

jest.mock('react-hook-form', () => ({
  useFormContext: jest.fn(),
}));

jest.mock('src/js/service/utils/sandboxUtils', () => ({
  useCurrencyFormat: jest.fn((value) => `$${value}`),
}));

describe('useSingleTimeTotals', () => {
  const mockGetValues = jest.fn();

  beforeEach(() => {
    (useFormContext as jest.Mock).mockReturnValue({
      getValues: mockGetValues,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return correct totals', () => {
    mockGetValues.mockReturnValue({
      billable: true,
      billRate: 100,
      duration: 7200, // 2 hour
    });

    const { result } = renderHook(() => useSingleTimeTotals());
    expect(result.current.currencyRate).toBe('$100');
    expect(
      parseFloat(result.current.durationCurrencyCalcAmount.replace('$', '')),
    ).toBeCloseTo(200, 1);
    expect(result.current.durationHours).toBe(2);
    expect(result.current.durationMinutes).toBe(0);
    expect(result.current.billable).toBe(true);
  });

  test('should handle durations with minutes correctly', () => {
    mockGetValues.mockReturnValue({
      billable: true,
      billRate: 100,
      duration: 7500, // 2 hours and 5 minutes
    });

    const { result } = renderHook(() => useSingleTimeTotals());
    expect(result.current.currencyRate).toBe('$100');
    expect(
      parseFloat(result.current.durationCurrencyCalcAmount.replace('$', '')),
    ).toBeCloseTo(208.33, 1);
    expect(result.current.durationHours).toBe(2);
    expect(result.current.durationMinutes).toBe(5);
    expect(result.current.billable).toBe(true);
  });

  test('should handle zero duration correctly', () => {
    mockGetValues.mockReturnValue({
      billable: true,
      billRate: 100,
      duration: 0,
    });

    const { result } = renderHook(() => useSingleTimeTotals());

    expect(result.current.currencyRate).toBe('$100');
    expect(
      parseFloat(result.current.durationCurrencyCalcAmount.replace('$', '')),
    ).toBeCloseTo(0, 1);
    expect(result.current.durationHours).toBe(0);
    expect(result.current.durationMinutes).toBe(0);
    expect(result.current.billable).toBe(true);
  });

  test('should handle large amounts correctly', () => {
    mockGetValues.mockReturnValue({
      billable: true,
      billRate: 80000.223,
      duration: 122400,
    });

    const { result } = renderHook(() => useSingleTimeTotals());

    expect(result.current.currencyRate).toBe('$80000.22');
    expect(
      parseFloat(result.current.durationCurrencyCalcAmount.replace('$', '')),
    ).toBeCloseTo(2720007.58, 1);
    expect(result.current.durationHours).toBe(34);
    expect(result.current.durationMinutes).toBe(0);
    expect(result.current.billable).toBe(true);
  });

  test('should return correct currency amounts for duration and clocked-in time', () => {
    mockGetValues.mockReturnValue({
      billable: true,
      billRate: 50,
      startTime: moment('2023-10-10T08:00:00'),
      endTime: moment('2023-10-10T12:30:00'),
      breakDuration: 1800, // 30 minutes
      duration: 14400, // 4 hours
    });

    const { result } = renderHook(() => useSingleTimeTotals());

    expect(
      parseFloat(result.current.durationCurrencyCalcAmount.replace('$', '')),
    ).toBeCloseTo(200, 1);
  });

  test('should return correct clocked-in duration and amount in case end time is less than start time', () => {
    mockGetValues.mockReturnValue({
      billable: true,
      billRate: 50,
      startTime: moment('2023-10-10T14:00:00'),
      endTime: moment('2023-10-10T11:00:00'),
      breakDuration: 0,
    });

    const { result } = renderHook(() => useSingleTimeTotals());

    expect(
      parseFloat(result.current.clockedInCurrencyCalcAmount.replace('$', '')),
    ).toBeCloseTo(1050, 1);
    expect(result.current.clockedInHours).toBe(21);
    expect(result.current.clockedInMinutes).toBe(0);
  });

  test('should handle multi-day time entry correctly', () => {
    mockGetValues.mockReturnValue({
      billable: true,
      billRate: 50,
      startDate: moment('2023-10-10'),
      endDate: moment('2023-10-11'),
      startTime: moment('2023-10-10T14:00:00'),
      endTime: moment('2023-10-11T10:00:00'),
      breakDuration: 1800, // 30 minutes
      isExported: false,
    });

    const { result } = renderHook(() => useSingleTimeTotals());

    // 20 hours (14:00 to 10:00 next day) minus 30 min break = 19.5 hours
    expect(result.current.clockedInHours).toBe(19);
    expect(result.current.clockedInMinutes).toBe(30);
    expect(
      parseFloat(result.current.clockedInCurrencyCalcAmount.replace('$', '')),
    ).toBeCloseTo(975, 1);
  });

  test('should handle multi-day time entry with end time before start time', () => {
    mockGetValues.mockReturnValue({
      billable: true,
      billRate: 50,
      startDate: moment('2023-10-10'),
      endDate: moment('2023-10-11'),
      startTime: moment('2023-10-10T14:00:00'),
      endTime: moment('2023-10-11T08:00:00'),
      breakDuration: 1800, // 30 minutes
      isExported: false,
    });

    const { result } = renderHook(() => useSingleTimeTotals());

    // 18 hours (14:00 to 08:00 next day) minus 30 min break = 17.5 hours
    expect(result.current.clockedInHours).toBe(17);
    expect(result.current.clockedInMinutes).toBe(30);
    expect(
      parseFloat(result.current.clockedInCurrencyCalcAmount.replace('$', '')),
    ).toBeCloseTo(875, 1);
  });

  test('should handle single-day time activity correctly', () => {
    mockGetValues.mockReturnValue({
      billable: true,
      billRate: 50,
      startTime: moment('2023-10-10T09:00:00'),
      endTime: moment('2023-10-10T17:00:00'),
      breakDuration: 1800, // 30 minutes
      isExported: false,
    });

    const { result } = renderHook(() => useSingleTimeTotals());

    // 8 hours minus 30 min break = 7.5 hours
    expect(result.current.clockedInHours).toBe(7);
    expect(result.current.clockedInMinutes).toBe(30);
    expect(
      parseFloat(result.current.clockedInCurrencyCalcAmount.replace('$', '')),
    ).toBeCloseTo(375, 1);
  });

  test('should handle single-day time activity crossing midnight', () => {
    mockGetValues.mockReturnValue({
      billable: true,
      billRate: 50,
      startTime: moment('2023-10-10T22:00:00'),
      endTime: moment('2023-10-11T02:00:00'),
      breakDuration: 1800, // 30 minutes
      isExported: false,
    });

    const { result } = renderHook(() => useSingleTimeTotals());

    // 4 hours minus 30 min break = 3.5 hours
    expect(result.current.clockedInHours).toBe(3);
    expect(result.current.clockedInMinutes).toBe(30);
    expect(
      parseFloat(result.current.clockedInCurrencyCalcAmount.replace('$', '')),
    ).toBeCloseTo(175, 1);
  });

  test('should return zero duration for invalid multi-day time entry', () => {
    mockGetValues.mockReturnValue({
      billable: true,
      billRate: 50,
      startDate: moment('2023-10-10'),
      endDate: moment('2023-10-10'), // Same day
      startTime: moment('2023-10-10T14:00:00'),
      endTime: moment('2023-10-10T10:00:00'), // End before start
      breakDuration: 1800,
      isExported: false,
    });

    const { result } = renderHook(() => useSingleTimeTotals());

    expect(result.current.clockedInHours).toBe(0);
    expect(result.current.clockedInMinutes).toBe(0);
    expect(
      parseFloat(result.current.clockedInCurrencyCalcAmount.replace('$', '')),
    ).toBeCloseTo(0, 1);
  });

  test('should handle time activity with start time changed to next day', () => {
    mockGetValues.mockReturnValue({
      billable: true,
      billRate: 50,
      startTime: moment('2023-10-10T04:00:00'), // Changed from 1 AM to 4 AM
      endTime: moment('2023-10-11T03:00:00'), // Next day 3 AM
      breakDuration: 0,
      isExported: false,
    });

    const { result } = renderHook(() => useSingleTimeTotals());

    // 23 hours (4 AM to 3 AM next day)
    expect(result.current.clockedInHours).toBe(23);
    expect(result.current.clockedInMinutes).toBe(0);
    expect(
      parseFloat(result.current.clockedInCurrencyCalcAmount.replace('$', '')),
    ).toBeCloseTo(1150, 1);
  });

  test('should handle time entry with same day start and end times', () => {
    mockGetValues.mockReturnValue({
      billable: true,
      billRate: 50,
      startDate: moment('2023-10-10'),
      endDate: moment('2023-10-10'),
      startTime: moment('2023-10-10T15:30:00'),
      endTime: moment('2023-10-10T17:30:00'),
      breakDuration: 1800, // 30 minutes
      isExported: false,
    });

    const { result } = renderHook(() => useSingleTimeTotals());

    // 2 hours minus 30 min break = 1.5 hours
    expect(result.current.clockedInHours).toBe(1);
    expect(result.current.clockedInMinutes).toBe(30);
    expect(
      parseFloat(result.current.clockedInCurrencyCalcAmount.replace('$', '')),
    ).toBeCloseTo(75, 1);
  });

  test('should handle time entry with different days but same times', () => {
    mockGetValues.mockReturnValue({
      billable: true,
      billRate: 50,
      startDate: moment('2023-10-10'),
      endDate: moment('2023-10-11'),
      startTime: moment('2023-10-10T15:30:00'),
      endTime: moment('2023-10-11T15:30:00'),
      breakDuration: 1800, // 30 minutes
      isExported: false,
    });

    const { result } = renderHook(() => useSingleTimeTotals());

    // 24 hours minus 30 min break = 23.5 hours
    expect(result.current.clockedInHours).toBe(23);
    expect(result.current.clockedInMinutes).toBe(30);
    expect(
      parseFloat(result.current.clockedInCurrencyCalcAmount.replace('$', '')),
    ).toBeCloseTo(1175, 1);
  });

  test('should handle time activity with end time before start time on same day', () => {
    mockGetValues.mockReturnValue({
      billable: true,
      billRate: 50,
      startTime: moment('2023-10-10T17:30:00'),
      endTime: moment('2023-10-10T15:30:00'),
      breakDuration: 1800, // 30 minutes
      isExported: false,
    });

    const { result } = renderHook(() => useSingleTimeTotals());

    // 22 hours (overnight) minus 30 min break = 21.5 hours
    expect(result.current.clockedInHours).toBe(21);
    expect(result.current.clockedInMinutes).toBe(30);
    expect(
      parseFloat(result.current.clockedInCurrencyCalcAmount.replace('$', '')),
    ).toBeCloseTo(1075, 1);
  });

  test('should handle time entry with end time before start time on different days', () => {
    mockGetValues.mockReturnValue({
      billable: true,
      billRate: 50,
      startDate: moment('2023-10-10'),
      endDate: moment('2023-10-11'),
      startTime: moment('2023-10-10T17:30:00'),
      endTime: moment('2023-10-11T15:30:00'),
      breakDuration: 1800, // 30 minutes
      isExported: false,
    });

    const { result } = renderHook(() => useSingleTimeTotals());

    // 22 hours minus 30 min break = 21.5 hours
    expect(result.current.clockedInHours).toBe(21);
    expect(result.current.clockedInMinutes).toBe(30);
    expect(
      parseFloat(result.current.clockedInCurrencyCalcAmount.replace('$', '')),
    ).toBeCloseTo(1075, 1);
  });
});

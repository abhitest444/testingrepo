import { debounce } from 'src/js/service/utils/debounce';

describe('debounce', () => {
  beforeEach(() => {
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should call function after specified delay', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 500);

    debouncedFn();
    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should not call function before delay expires', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 500);

    debouncedFn();
    jest.advanceTimersByTime(499);
    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should cancel previous call when called multiple times within delay', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 500);

    debouncedFn();
    jest.advanceTimersByTime(250);

    debouncedFn();
    jest.advanceTimersByTime(250);
    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(250);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should call function with correct arguments', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 500);

    debouncedFn('arg1', 'arg2', 42);
    jest.advanceTimersByTime(500);

    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 42);
  });

  it('should use arguments from the last call when called multiple times', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 500);

    debouncedFn('first', 'call');
    jest.advanceTimersByTime(250);

    debouncedFn('second', 'call');
    jest.advanceTimersByTime(500);

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('second', 'call');
  });

  it('should work with functions that return values', () => {
    const mockFn = jest.fn(() => 'result');
    const debouncedFn = debounce(mockFn, 500);

    const result = debouncedFn();
    expect(result).toBeUndefined(); // debounced function returns void

    jest.advanceTimersByTime(500);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should handle functions with no arguments', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 500);

    debouncedFn();
    jest.advanceTimersByTime(500);

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith();
  });

  it('cancel() prevents the pending call from firing', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 500);

    debouncedFn();
    debouncedFn.cancel();
    jest.advanceTimersByTime(500);

    expect(mockFn).not.toHaveBeenCalled();
  });

  it('cancel() is safe to call when no call is pending', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 500);

    expect(() => debouncedFn.cancel()).not.toThrow();
  });

  it('can be rescheduled after cancel()', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 500);

    debouncedFn();
    debouncedFn.cancel();

    debouncedFn('rescheduled');
    jest.advanceTimersByTime(500);

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('rescheduled');
  });
});

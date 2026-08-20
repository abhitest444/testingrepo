import { renderHook } from '@testing-library/react-hooks';
import { useAdaptivePageSize } from 'src/js/widgets/timeProject/hooks/useAdaptivePageSize';
import {
  LARGE_PAGE_SIZE,
  SMALL_PAGE_SIZE,
} from 'src/js/widgets/timeProject/utils/calculatePageSize';

describe('useAdaptivePageSize', () => {
  const originalInnerHeight = window.innerHeight;

  afterEach(() => {
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    });
  });

  it('returns LARGE_PAGE_SIZE when window.innerHeight > 1024', () => {
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 1200,
    });
    const { result } = renderHook(() => useAdaptivePageSize());
    expect(result.current).toBe(LARGE_PAGE_SIZE);
  });

  it('returns SMALL_PAGE_SIZE when window.innerHeight <= 1024', () => {
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 800,
    });
    const { result } = renderHook(() => useAdaptivePageSize());
    expect(result.current).toBe(SMALL_PAGE_SIZE);
  });

  it('returns a stable value across re-renders', () => {
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 900,
    });
    const { result, rerender } = renderHook(() => useAdaptivePageSize());
    const initial = result.current;

    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 600,
    });
    rerender();

    expect(result.current).toBe(initial);
  });

  it('does not attach any window resize event listeners', () => {
    const addSpy = jest.spyOn(window, 'addEventListener');
    renderHook(() => useAdaptivePageSize());
    expect(addSpy).not.toHaveBeenCalledWith('resize', expect.any(Function));
    addSpy.mockRestore();
  });
});

import { renderHook } from '@testing-library/react-hooks';
import { act } from '@testing-library/react';
import { useConsolidatedLoading } from 'src/js/common/useConsolidatedLoading';

describe('useConsolidatedLoading', () => {
  test.each([
    { loadingStates: [false, false, false], expected: false },
    { loadingStates: [true, false, false], expected: true },
    { loadingStates: [false, true, false], expected: true },
    { loadingStates: [false, false, true], expected: true },
    { loadingStates: [true, true, true], expected: true },
  ])(
    'returns $expected when loadingStates is $loadingStates',
    ({ loadingStates, expected }) => {
      const { result, rerender } = renderHook(
        ({ states }) => useConsolidatedLoading(states),
        {
          initialProps: { states: loadingStates },
        },
      );

      expect(result.current).toBe(expected);

      // Simulate a change in loadingStates to ensure the state doesn't change after initial false
      act(() => {
        rerender({ states: [false, false, false] });
      });

      expect(result.current).toBe(false);
    },
  );
});

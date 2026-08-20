import { renderHook } from '@testing-library/react-hooks';
import { useAutoSelectSingle } from 'src/js/widgets/quickFind/hooks/useAutoSelectSingle';

interface Item {
  id: string;
  name: string;
}

const oneItem: Item[] = [{ id: 'a1', name: 'Only Option' }];
const twoItems: Item[] = [
  { id: 'a1', name: 'One' },
  { id: 'a2', name: 'Two' },
];

// Base props satisfy the firing condition: required + not disabled + not
// loading + empty value + exactly one option.
const base = {
  enabled: true,
  disabled: false,
  loading: false,
  value: '' as string | undefined,
  items: oneItem,
};

describe('useAutoSelectSingle', () => {
  describe('firing condition (required + exactly one option)', () => {
    it('auto-selects the sole option when all conditions are met', () => {
      const onChange = jest.fn();
      renderHook(() => useAutoSelectSingle({ ...base, onChange }));
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('a1', oneItem[0]);
    });

    it('does NOT fire when the field is not required (enabled=false)', () => {
      const onChange = jest.fn();
      renderHook(() =>
        useAutoSelectSingle({ ...base, enabled: false, onChange }),
      );
      expect(onChange).not.toHaveBeenCalled();
    });

    it('does NOT fire when there is more than one option', () => {
      const onChange = jest.fn();
      renderHook(() =>
        useAutoSelectSingle({ ...base, items: twoItems, onChange }),
      );
      expect(onChange).not.toHaveBeenCalled();
    });

    it('does NOT fire when there are zero options', () => {
      const onChange = jest.fn();
      renderHook(() => useAutoSelectSingle({ ...base, items: [], onChange }));
      expect(onChange).not.toHaveBeenCalled();
    });

    it('does NOT fire when the field already has a value', () => {
      const onChange = jest.fn();
      renderHook(() => useAutoSelectSingle({ ...base, value: 'a1', onChange }));
      expect(onChange).not.toHaveBeenCalled();
    });

    it('does NOT fire while options are loading', () => {
      const onChange = jest.fn();
      renderHook(() =>
        useAutoSelectSingle({ ...base, loading: true, onChange }),
      );
      expect(onChange).not.toHaveBeenCalled();
    });

    it('does NOT fire when disabled', () => {
      const onChange = jest.fn();
      renderHook(() =>
        useAutoSelectSingle({ ...base, disabled: true, onChange }),
      );
      expect(onChange).not.toHaveBeenCalled();
    });

    it('fires once the guard becomes satisfied (loading finishes)', () => {
      const onChange = jest.fn();
      const { rerender } = renderHook((props) => useAutoSelectSingle(props), {
        initialProps: { ...base, loading: true, items: [] as Item[], onChange },
      });
      expect(onChange).not.toHaveBeenCalled();

      rerender({ ...base, loading: false, items: oneItem, onChange });
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('a1', oneItem[0]);
    });
  });

  describe('STE cadence (no autoSelectKey): fire once', () => {
    it('fires exactly once on mount', () => {
      const onChange = jest.fn();
      renderHook(() => useAutoSelectSingle({ ...base, onChange }));
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('does not re-fire on unrelated re-renders', () => {
      const onChange = jest.fn();
      const { rerender } = renderHook((props) => useAutoSelectSingle(props), {
        initialProps: { ...base, onChange },
      });
      expect(onChange).toHaveBeenCalledTimes(1);

      // Same props, different object identity — must not re-fire.
      rerender({
        ...base,
        onChange,
        items: [{ id: 'a1', name: 'Only Option' }],
      });
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('treats autoSelectKey=null the same as omitted (fires once, then latches)', () => {
      const onChange = jest.fn();
      const { rerender } = renderHook((props) => useAutoSelectSingle(props), {
        initialProps: { ...base, autoSelectKey: null, onChange },
      });
      expect(onChange).toHaveBeenCalledTimes(1);

      rerender({ ...base, autoSelectKey: null, onChange });
      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('WTE cadence (autoSelectKey): re-arm per cell', () => {
    it('fires for the initial cell', () => {
      const onChange = jest.fn();
      renderHook(() =>
        useAutoSelectSingle({ ...base, autoSelectKey: 'row1-0', onChange }),
      );
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('re-fires when the selected cell changes', () => {
      const onChange = jest.fn();
      const { rerender } = renderHook((props) => useAutoSelectSingle(props), {
        initialProps: { ...base, autoSelectKey: 'row1-0', onChange },
      });
      expect(onChange).toHaveBeenCalledTimes(1);

      rerender({ ...base, autoSelectKey: 'row1-1', onChange });
      expect(onChange).toHaveBeenCalledTimes(2);
    });

    it('does not re-fire when the same cell re-renders', () => {
      const onChange = jest.fn();
      const { rerender } = renderHook((props) => useAutoSelectSingle(props), {
        initialProps: { ...base, autoSelectKey: 'row1-0', onChange },
      });
      expect(onChange).toHaveBeenCalledTimes(1);

      rerender({ ...base, autoSelectKey: 'row1-0', onChange });
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('waits for the new cell to load, then fires for it', () => {
      const onChange = jest.fn();
      const { rerender } = renderHook((props) => useAutoSelectSingle(props), {
        initialProps: { ...base, autoSelectKey: 'row1-0', onChange },
      });
      expect(onChange).toHaveBeenCalledTimes(1);

      // Move to a new empty cell whose options are still loading — no fire yet.
      rerender({
        ...base,
        autoSelectKey: 'row1-1',
        loading: true,
        items: [] as Item[],
        onChange,
      });
      expect(onChange).toHaveBeenCalledTimes(1);

      // Options for the new cell settle — now it fires.
      rerender({ ...base, autoSelectKey: 'row1-1', onChange });
      expect(onChange).toHaveBeenCalledTimes(2);
    });

    it('re-fires when moving from a real cell to no selection (null) and back', () => {
      const onChange = jest.fn();
      const { rerender } = renderHook((props) => useAutoSelectSingle(props), {
        initialProps: {
          ...base,
          autoSelectKey: 'row1-0' as string | null,
          onChange,
        },
      });
      expect(onChange).toHaveBeenCalledTimes(1);

      // Deselect — no cell selected, falls back to STE-style latch; no fire.
      rerender({ ...base, autoSelectKey: null, onChange });
      expect(onChange).toHaveBeenCalledTimes(1);

      // Select a different cell — re-arms and fires again.
      rerender({ ...base, autoSelectKey: 'row1-1', onChange });
      expect(onChange).toHaveBeenCalledTimes(2);
    });
  });
});

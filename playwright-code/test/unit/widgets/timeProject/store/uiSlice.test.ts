import reducer, {
  setLoading,
  setError,
  resetUI,
} from 'src/js/widgets/timeProject/store/uiSlice';
import { UISliceState } from 'src/js/widgets/timeProject/types';

describe('uiSlice', () => {
  const initialState: UISliceState = {
    loading: false,
    error: null,
  };

  it('should return initial state', () => {
    expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('setLoading', () => {
    it('should set loading to true', () => {
      const state = reducer(initialState, setLoading(true));
      expect(state.loading).toBe(true);
    });

    it('should set loading to false', () => {
      const loadingState: UISliceState = { loading: true, error: null };
      const state = reducer(loadingState, setLoading(false));
      expect(state.loading).toBe(false);
    });
  });

  describe('setError', () => {
    it('should set error and set loading to false', () => {
      const loadingState: UISliceState = { loading: true, error: null };
      const state = reducer(loadingState, setError('Something went wrong'));

      expect(state.error).toBe('Something went wrong');
      expect(state.loading).toBe(false);
    });

    it('should clear error when set to null without changing loading', () => {
      const errorState: UISliceState = { loading: false, error: 'old error' };
      const state = reducer(errorState, setError(null));

      expect(state.error).toBeNull();
      expect(state.loading).toBe(false);
    });
  });

  describe('resetUI', () => {
    it('should reset to initial state', () => {
      const dirtyState: UISliceState = { loading: true, error: 'some error' };
      const state = reducer(dirtyState, resetUI());
      expect(state).toEqual(initialState);
    });
  });
});

import { act, renderHook } from '@testing-library/react-hooks';
import { useFieldLoadingStates } from 'src/js/widgets/singleTimeTrowser/hooks/useFieldLoadingStates';

describe('useFieldLoadingStates', () => {
  it('should expose loadingStates and dispatch', () => {
    const { result } = renderHook(() => useFieldLoadingStates());

    expect(result.current).toHaveProperty('loadingStates');
    expect(result.current).toHaveProperty('dispatch');
    expect(typeof result.current.dispatch).toBe('function');
  });

  it('should initialize all loading flags to true', () => {
    const { result } = renderHook(() => useFieldLoadingStates());

    expect(result.current.loadingStates).toEqual({
      teamMember: true,
      customerProject: true,
      location: true,
      service: true,
      class: true,
    });
  });

  it('should update teamMember loading flag', () => {
    const { result } = renderHook(() => useFieldLoadingStates());

    act(() => {
      result.current.dispatch({
        type: 'SET_TEAM_MEMBER_LOADING',
        loading: false,
      });
    });

    expect(result.current.loadingStates.teamMember).toBe(false);
    expect(result.current.loadingStates.customerProject).toBe(true);
    expect(result.current.loadingStates.location).toBe(true);
    expect(result.current.loadingStates.service).toBe(true);
    expect(result.current.loadingStates.class).toBe(true);

    act(() => {
      result.current.dispatch({
        type: 'SET_TEAM_MEMBER_LOADING',
        loading: true,
      });
    });

    expect(result.current.loadingStates.teamMember).toBe(true);
  });

  it('should update customerProject loading flag', () => {
    const { result } = renderHook(() => useFieldLoadingStates());

    act(() => {
      result.current.dispatch({
        type: 'SET_CUSTOMER_PROJECT_LOADING',
        loading: false,
      });
    });

    expect(result.current.loadingStates.customerProject).toBe(false);
    expect(result.current.loadingStates.teamMember).toBe(true);
    expect(result.current.loadingStates.location).toBe(true);
    expect(result.current.loadingStates.service).toBe(true);
    expect(result.current.loadingStates.class).toBe(true);
  });

  it('should update location loading flag', () => {
    const { result } = renderHook(() => useFieldLoadingStates());

    act(() => {
      result.current.dispatch({ type: 'SET_LOCATION_LOADING', loading: false });
    });

    expect(result.current.loadingStates.location).toBe(false);
    expect(result.current.loadingStates.teamMember).toBe(true);
    expect(result.current.loadingStates.customerProject).toBe(true);
    expect(result.current.loadingStates.service).toBe(true);
    expect(result.current.loadingStates.class).toBe(true);
  });

  it('should update service loading flag', () => {
    const { result } = renderHook(() => useFieldLoadingStates());

    act(() => {
      result.current.dispatch({ type: 'SET_SERVICE_LOADING', loading: false });
    });

    expect(result.current.loadingStates.service).toBe(false);
    expect(result.current.loadingStates.teamMember).toBe(true);
    expect(result.current.loadingStates.customerProject).toBe(true);
    expect(result.current.loadingStates.location).toBe(true);
    expect(result.current.loadingStates.class).toBe(true);
  });

  it('should update class loading flag', () => {
    const { result } = renderHook(() => useFieldLoadingStates());

    act(() => {
      result.current.dispatch({ type: 'SET_CLASS_LOADING', loading: false });
    });

    expect(result.current.loadingStates.class).toBe(false);
    expect(result.current.loadingStates.teamMember).toBe(true);
    expect(result.current.loadingStates.customerProject).toBe(true);
    expect(result.current.loadingStates.location).toBe(true);
    expect(result.current.loadingStates.service).toBe(true);
  });

  it('should handle toggling flags back to true', () => {
    const { result } = renderHook(() => useFieldLoadingStates());

    act(() => {
      result.current.dispatch({ type: 'SET_LOCATION_LOADING', loading: false });
      result.current.dispatch({ type: 'SET_LOCATION_LOADING', loading: true });
    });

    expect(result.current.loadingStates.location).toBe(true);
  });
});

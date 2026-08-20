import { useReducer } from 'react';

interface LoadingState {
  teamMember: boolean;
  customerProject: boolean;
  location: boolean;
  service: boolean;
  class: boolean;
}

export type LoadingAction =
  | { type: 'SET_TEAM_MEMBER_LOADING'; loading: boolean }
  | { type: 'SET_CUSTOMER_PROJECT_LOADING'; loading: boolean }
  | { type: 'SET_LOCATION_LOADING'; loading: boolean }
  | { type: 'SET_SERVICE_LOADING'; loading: boolean }
  | { type: 'SET_CLASS_LOADING'; loading: boolean };

const initialLoadingState: LoadingState = {
  teamMember: true,
  customerProject: true,
  location: true,
  service: true,
  class: true,
};

const loadingReducer = (
  state: LoadingState,
  action: LoadingAction,
): LoadingState => {
  switch (action.type) {
    case 'SET_TEAM_MEMBER_LOADING':
      return {
        ...state,
        teamMember: action.loading,
      };

    case 'SET_CUSTOMER_PROJECT_LOADING':
      return {
        ...state,
        customerProject: action.loading,
      };

    case 'SET_LOCATION_LOADING':
      return {
        ...state,
        location: action.loading,
      };

    case 'SET_SERVICE_LOADING':
      return {
        ...state,
        service: action.loading,
      };

    case 'SET_CLASS_LOADING':
      return {
        ...state,
        class: action.loading,
      };

    default:
      return state;
  }
};

export const useFieldLoadingStates = () => {
  const [loadingStates, dispatch] = useReducer(
    loadingReducer,
    initialLoadingState,
  );

  return {
    loadingStates,
    dispatch,
  };
};

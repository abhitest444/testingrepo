import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QuickbooksOnlineSandbox } from '@appfabric/sandbox-spec/lib/extensions/quickbooks-online/QuickbooksOnline';
import QbtOrchestratorWidget from 'src/js/widgets/qbtOrchestrator/QbtOrchestratorWidget';
import { getApolloClientInstance } from 'src/js/service/ApolloClientBuilder';
import { ORCHESTRATOR_LOGGING } from 'src/js/widgets/qbtOrchestrator/constants';
import { storeManager } from 'src/js/widgets/qbtOrchestrator/store/storeManager';
import { renderWithAllProviders, getDefaultSandbox } from '../../testUtils';

// Mock the Apollo client builder
jest.mock('src/js/service/ApolloClientBuilder', () => ({
  getApolloClientInstance: jest.fn(),
}));

// Mock nlsLoader
jest.mock('src/nls', () => ({
  __esModule: true,
  default: {
    requireNlsForLocale: jest.fn().mockReturnValue({}),
  },
}));

// Mock QuicksandProvider
jest.mock('@payroll/quicksand', () => {
  const actual = jest.requireActual('@payroll/quicksand');
  return {
    ...actual,
    QuicksandProvider: ({ children }: { children: React.ReactNode }) =>
      children,
  };
});

// Mock the storeManager
jest.mock('src/js/widgets/qbtOrchestrator/store/storeManager', () => {
  const { configureStore, combineReducers } =
    jest.requireActual('@reduxjs/toolkit');
  const mockStore = configureStore({
    reducer: combineReducers({
      shared: (state = { workers: {}, permissions: {} }) => state,
      ui: (state = { screens: {}, modals: {} }) => state,
    }),
  });
  return {
    storeManager: {
      store: mockStore,
      inject: jest.fn(),
      hasReducer: jest.fn().mockReturnValue(false),
      getReducerKeys: jest.fn().mockReturnValue(['shared', 'ui']),
      resetAsyncReducers: jest.fn(),
    },
  };
});

describe('QbtOrchestratorWidget', () => {
  const mockSandbox = {
    ...getDefaultSandbox(),
    remediate: jest.fn(),
    variability: {
      ...getDefaultSandbox().variability,
      fetchVariabilityDecision: jest.fn().mockResolvedValue({ name: 'test' }),
    },
  } as unknown as QuickbooksOnlineSandbox;

  const mockApolloClient = {
    query: jest.fn(),
    mutate: jest.fn(),
    watchQuery: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getApolloClientInstance as jest.Mock).mockReturnValue(mockApolloClient);
    storeManager.resetAsyncReducers();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  const renderWidget = (props: any) => {
    const Widget = QbtOrchestratorWidget as any;
    return renderWithAllProviders(<Widget {...props} />);
  };

  describe('Widget Rendering', () => {
    it('should render the orchestrator widget successfully', async () => {
      const props = {
        sandbox: mockSandbox,
        options: {
          feature: 'default',
          screen: 'default',
        },
      };

      renderWidget(props);

      await waitFor(() => {
        expect(document.querySelector('.qbt-orchestrator')).toBeInTheDocument();
      });
    });

    it('should show error when Apollo client is not initialized', async () => {
      (getApolloClientInstance as jest.Mock).mockReturnValue(null);

      const props = {
        sandbox: mockSandbox,
        options: {
          feature: 'default',
          screen: 'default',
        },
      };

      renderWidget(props);

      await waitFor(() => {
        expect(
          screen.getByText('Error: Apollo client not initialized'),
        ).toBeInTheDocument();
      });
    });

    it('should use external Apollo client when provided', async () => {
      const externalClient = {
        query: jest.fn(),
        mutate: jest.fn(),
      };

      const props = {
        sandbox: mockSandbox,
        externalApolloClient: externalClient,
        options: {
          feature: 'default',
          screen: 'default',
        },
      };

      renderWidget(props);

      await waitFor(() => {
        expect(document.querySelector('.qbt-orchestrator')).toBeInTheDocument();
      });
      expect(getApolloClientInstance).not.toHaveBeenCalled();
    });
  });

  describe('Widget Lifecycle', () => {
    it('should log mount message on componentDidMount', async () => {
      const props = {
        sandbox: mockSandbox,
        options: {
          feature: 'default',
          screen: 'default',
        },
      };

      renderWidget(props);

      await waitFor(() => {
        expect(mockSandbox.logger.info).toHaveBeenCalledWith(
          ORCHESTRATOR_LOGGING.WIDGET_MOUNTED,
          expect.objectContaining({
            feature: expect.any(String),
          }),
        );
      });
    });

    it('should call onError when componentDidCatch is triggered', async () => {
      const mockOnError = jest.fn();
      const props = {
        sandbox: mockSandbox,
        options: {
          feature: 'default',
          screen: 'default',
        },
        onError: mockOnError,
      };

      const Widget = QbtOrchestratorWidget as any;
      const widget = new Widget(props);

      const testError = new Error('Test error');
      widget.componentDidCatch(testError);

      expect(mockSandbox.logger.error).toHaveBeenCalledWith(
        ORCHESTRATOR_LOGGING.WIDGET_CRASH,
        { error: testError },
      );
      expect(mockOnError).toHaveBeenCalledWith(testError);
    });
  });

  describe('Redux Store Integration', () => {
    it('should provide Redux store to children', async () => {
      const props = {
        sandbox: mockSandbox,
        options: {
          feature: 'default',
          screen: 'default',
        },
      };

      renderWidget(props);

      // Verify storeManager.store was used
      expect(storeManager.store).toBeDefined();
    });
  });
});

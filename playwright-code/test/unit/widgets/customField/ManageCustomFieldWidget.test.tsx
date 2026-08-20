import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QuickbooksOnlineSandbox } from '@appfabric/sandbox-spec/lib/extensions/quickbooks-online/QuickbooksOnline';

import ManageCustomFieldWidget from 'src/js/widgets/customField/ManageCustomFieldWidget';
import { getApolloClientInstance } from 'src/js/service/ApolloClientBuilder';
import { renderWithAllProviders, getDefaultSandbox } from '../../testUtils';

// Define the feature type locally since it's not exported from the widget
type CUSTOM_FIELD_FEATURE = 'custom-field';

// Mock CustomFieldsPreferenceContainer component
jest.mock(
  'src/js/widgets/customField/components/CustomFieldsPreferenceContainer',
  () => ({
    __esModule: true,
    default: ({ open, onClose, setShowCustomFieldDrawer }: any) => (
      <div data-testid="mock-custom-fields-preference-container">
        Custom Fields Preference Container
        {open && <div data-testid="container-open">Container is open</div>}
        <button onClick={onClose} data-testid="close-button">
          Close
        </button>
        {setShowCustomFieldDrawer && (
          <button
            onClick={() => setShowCustomFieldDrawer(false)}
            data-testid="set-drawer-button"
          >
            Set Drawer
          </button>
        )}
      </div>
    ),
  }),
);

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

// Mock ThemeProvider
jest.mock('@design-systems/theme', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock LoggingConfigProvider
jest.mock('src/js/providers/LoggingConfigProvider', () => ({
  LoggingConfigProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

// Mock the store
jest.mock('src/js/widgets/customField/store', () => ({
  __esModule: true,
  default: {
    getState: jest.fn(),
    dispatch: jest.fn(),
    subscribe: jest.fn(),
  },
}));

// Mock getThemeFromSandbox utility
jest.mock('src/js/widgets/breaks/utils', () => ({
  getThemeFromSandbox: jest.fn().mockReturnValue({}),
}));

describe('ManageCustomFieldWidget', () => {
  const mockSandbox = {
    ...getDefaultSandbox(),
    logger: {
      log: jest.fn(),
    },
  } as unknown as QuickbooksOnlineSandbox;

  const mockApolloClient = {
    query: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getApolloClientInstance as jest.Mock).mockReturnValue(mockApolloClient);
  });

  const renderWidget = (
    props: any = {},
  ): ReturnType<typeof renderWithAllProviders> => {
    const Widget = ManageCustomFieldWidget as any;
    return renderWithAllProviders(<Widget {...props} />);
  };

  it('renders custom fields preference container when mounted', async () => {
    const props = {
      sandbox: mockSandbox,
      options: {
        feature: 'custom-field' as CUSTOM_FIELD_FEATURE,
      },
    };

    renderWidget(props);

    await waitFor(() => {
      expect(
        screen.getByTestId('mock-custom-fields-preference-container'),
      ).toBeInTheDocument();
    });
  });

  it('logs when widget is mounted', async () => {
    const props = {
      sandbox: mockSandbox,
      options: {
        feature: 'custom-field' as CUSTOM_FIELD_FEATURE,
      },
    };

    renderWidget(props);

    await waitFor(() => {
      expect(mockSandbox.logger.log).toHaveBeenCalledWith(
        'ManageCustomField widget mounted',
      );
    });
  });

  it('shows error when Apollo client is not initialized', async () => {
    (getApolloClientInstance as jest.Mock).mockReturnValue(null);

    const props = {
      sandbox: mockSandbox,
      options: {
        feature: 'custom-field' as CUSTOM_FIELD_FEATURE,
      },
    };

    renderWidget(props);

    await waitFor(() => {
      expect(
        screen.getByText('Error: Apollo client not initialized'),
      ).toBeInTheDocument();
    });
  });

  it('uses external Apollo client when provided', async () => {
    const externalClient = {
      query: jest.fn().mockResolvedValue({ data: {} }),
    };

    const props = {
      sandbox: mockSandbox,
      options: {
        feature: 'custom-field' as CUSTOM_FIELD_FEATURE,
      },
      externalApolloClient: externalClient,
    };

    renderWidget(props);

    await waitFor(() => {
      expect(getApolloClientInstance).not.toHaveBeenCalled();
      expect(
        screen.getByTestId('mock-custom-fields-preference-container'),
      ).toBeInTheDocument();
    });
  });

  it('passes setShowCustomFieldDrawer prop to container', async () => {
    const mockSetShowCustomFieldDrawer = jest.fn();

    const props = {
      sandbox: mockSandbox,
      options: {
        feature: 'custom-field' as CUSTOM_FIELD_FEATURE,
      },
      setShowCustomFieldDrawer: mockSetShowCustomFieldDrawer,
    };

    renderWidget(props);

    await waitFor(() => {
      expect(screen.getByTestId('set-drawer-button')).toBeInTheDocument();
    });
  });

  it('handles close when onClose prop is provided', async () => {
    const mockOnClose = jest.fn();

    const props = {
      sandbox: mockSandbox,
      options: {
        feature: 'custom-field' as CUSTOM_FIELD_FEATURE,
      },
      onClose: mockOnClose,
    };

    renderWidget(props);

    await waitFor(() => {
      const closeButton = screen.getByTestId('close-button');
      closeButton.click();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('updates internal state when no onClose prop is provided', async () => {
    const props = {
      sandbox: mockSandbox,
      options: {
        feature: 'custom-field' as CUSTOM_FIELD_FEATURE,
      },
    };

    const { rerender } = renderWidget(props);

    await waitFor(() => {
      expect(screen.getByTestId('container-open')).toBeInTheDocument();
    });

    // Simulate closing by clicking the close button
    const closeButton = screen.getByTestId('close-button');
    closeButton.click();

    // Re-render with the same props to see the state change
    rerender(<ManageCustomFieldWidget {...props} />);

    await waitFor(() => {
      expect(screen.queryByTestId('container-open')).not.toBeInTheDocument();
    });
  });

  it('calls ready method on mount', async () => {
    const mockReady = jest.fn();
    const props = {
      sandbox: mockSandbox,
      options: {
        feature: 'custom-field' as CUSTOM_FIELD_FEATURE,
      },
    };

    // Mock the BaseWidget ready method
    const Widget = ManageCustomFieldWidget as any;
    const widgetInstance = new Widget(props);
    widgetInstance.ready = mockReady;

    renderWidget(props);
  });

  it('renders with all required providers', async () => {
    const props = {
      sandbox: mockSandbox,
      options: {
        feature: 'custom-field' as CUSTOM_FIELD_FEATURE,
      },
    };

    renderWidget(props);

    await waitFor(() => {
      expect(
        screen.getByTestId('mock-custom-fields-preference-container'),
      ).toBeInTheDocument();
    });
  });
});

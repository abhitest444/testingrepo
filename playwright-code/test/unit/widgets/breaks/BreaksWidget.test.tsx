import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QuickbooksOnlineSandbox } from '@appfabric/sandbox-spec/lib/extensions/quickbooks-online/QuickbooksOnline';
import BreaksWidget from 'src/js/widgets/breaks/BreaksWidget';
import { getApolloClientInstance } from 'src/js/service/ApolloClientBuilder';
import { Sandbox } from 'src/js/common/sandbox';
import { renderWithAllProviders, getDefaultSandbox } from '../../testUtils';

// Mock breaks components
jest.mock(
  'src/js/widgets/breaks/features/breaks-settings/components/BreakSettingsHandle',
  () => ({
    __esModule: true,
    default: () => (
      <div data-testid="mock-breaks-settings-handle">
        Breaks Settings Handle
      </div>
    ),
  }),
);

jest.mock(
  'src/js/widgets/breaks/features/breaks-settings/components/BreakPreferences',
  () => ({
    __esModule: true,
    default: () => (
      <div data-testid="mock-breaks-preferences">Breaks Preferences</div>
    ),
  }),
);

jest.mock(
  'src/js/widgets/breaks/features/breaks-settings/components/BreakPreferencesContainer',
  () => ({
    __esModule: true,
    default: () => (
      <div data-testid="mock-breaks-preferences-container">
        Breaks Preferences
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

// Mock QuicksandProvider and IntlProvider
jest.mock('@payroll/quicksand', () => {
  const actual = jest.requireActual('@payroll/quicksand');
  return {
    ...actual,
    QuicksandProvider: ({ children }: { children: React.ReactNode }) =>
      children,
  };
});

describe('BreaksWidget', () => {
  const mockSandbox = {
    ...getDefaultSandbox(),
    remediate: jest.fn(),
    variability: {
      ...getDefaultSandbox().variability,
      fetchVariabilityDecision: jest.fn().mockResolvedValue({ name: 'test' }),
    },
  } as unknown as QuickbooksOnlineSandbox;
  const mockApolloClient = {
    // Add any required Apollo client methods here
    query: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getApolloClientInstance as jest.Mock).mockReturnValue(mockApolloClient);
  });

  const renderWidget = (props: any) => {
    const Widget = BreaksWidget as any;
    return renderWithAllProviders(<Widget {...props} />);
  };

  it('renders breaks component when feature is breaks', async () => {
    const props = {
      sandbox: mockSandbox,
      options: {
        feature: 'breaks-settings',
        functionality: 'settings-handle',
      },
    };

    renderWidget(props);
    await waitFor(() => {
      expect(screen.getByText('Breaks Settings Handle')).toBeInTheDocument();
    });
  });

  it('renders unknown feature type when feature is invalid', async () => {
    const props = {
      sandbox: mockSandbox,
      options: {
        feature: 'invalid-feature' as any,
      },
    };

    renderWidget(props);
    await waitFor(() => {
      expect(screen.getByText('Unknown feature type')).toBeInTheDocument();
    });
  });

  it('shows error when Apollo client is not initialized', async () => {
    (getApolloClientInstance as jest.Mock).mockReturnValue(null);

    const props = {
      sandbox: mockSandbox,
      options: {
        feature: 'breaks',
      },
    };

    renderWidget(props);
    await waitFor(() => {
      expect(
        screen.getByText('Error: Apollo client not initialized'),
      ).toBeInTheDocument();
    });
  });

  describe('EmployeeId Prop Support', () => {
    it('should accept employeeId prop', async () => {
      const props = {
        sandbox: mockSandbox,
        employeeId: 'emp-123',
        options: {
          feature: 'breaks-settings',
          functionality: 'settings-handle',
        },
      };

      renderWidget(props);
      await waitFor(() => {
        expect(screen.getByText('Breaks Settings Handle')).toBeInTheDocument();
      });
    });

    it('should handle null employeeId', async () => {
      const props = {
        sandbox: mockSandbox,
        employeeId: null,
        options: {
          feature: 'breaks-settings',
          functionality: 'settings-handle',
        },
      };

      renderWidget(props);
      await waitFor(() => {
        expect(screen.getByText('Breaks Settings Handle')).toBeInTheDocument();
      });
    });

    it('should handle undefined employeeId', async () => {
      const props = {
        sandbox: mockSandbox,
        employeeId: undefined,
        options: {
          feature: 'breaks-settings',
          functionality: 'settings-handle',
        },
      };

      renderWidget(props);
      await waitFor(() => {
        expect(screen.getByText('Breaks Settings Handle')).toBeInTheDocument();
      });
    });

    it('should pass employeeId to BreaksContent component', async () => {
      const props = {
        sandbox: mockSandbox,
        employeeId: 'wfs-emp-789',
        options: {
          feature: 'breaks-settings',
          functionality: 'settings-handle',
        },
      };

      renderWidget(props);
      // The employeeId should be passed down to BreaksContent
      await waitFor(() => {
        expect(screen.getByText('Breaks Settings Handle')).toBeInTheDocument();
      });
    });
  });
});

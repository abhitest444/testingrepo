import { act } from '@testing-library/react-hooks';
import { buildSandbox } from '@payroll/quicksand';
import { ApolloError } from '@apollo/client';
import { useSetSettings } from 'src/js/service/hooks/settings/useSetSettings';
import { Sandbox } from 'src/js/common/sandbox';
import { getV4ApolloClient } from 'src/js/service/V4ApolloClientBuilder';
import { renderHookWithQuicksandProvider } from '../../../testUtils';

jest.mock('src/js/service/V4ApolloClientBuilder', () => ({
  getV4ApolloClient: jest.fn().mockReturnValue({
    mutate: jest.fn(),
  }),
}));

describe('useSetSettings', () => {
  let sandbox: Sandbox;

  beforeEach(() => {
    sandbox = buildSandbox();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should set loading to true initially and call onCompleted on success', async () => {
    const mockOnCompleted = jest.fn();
    const mockOnError = jest.fn();
    const mockMutate = jest.fn().mockResolvedValue({
      data: {
        updateCompany_Settings: {
          clientMutationId: '0',
          __typename: 'UpdateCompany_SettingsPayload',
        },
      },
    });

    (getV4ApolloClient(sandbox).mutate as jest.Mock).mockImplementation(
      mockMutate,
    );

    const { result } = renderHookWithQuicksandProvider(() =>
      useSetSettings({ onCompleted: mockOnCompleted, onError: mockOnError }),
    );

    const [setSettings, { loading }] = result.current;

    expect(loading).toBe(false);

    act(() => {
      setSettings({
        entityVersion: '1',
        isServiceFieldEnabled: true,
        isBillingFieldEnabled: true,
      });
    });

    expect(result.current[1].loading).toBe(true);

    await act(async () => {
      await setSettings({
        entityVersion: '1',
        isServiceFieldEnabled: true,
        isBillingFieldEnabled: true,
      });
    });

    expect(result.current[1].loading).toBe(false);
    expect(mockOnCompleted).toHaveBeenCalledWith({
      updateCompany_Settings: {
        clientMutationId: '0',
        __typename: 'UpdateCompany_SettingsPayload',
      },
    });
    expect(mockOnError).not.toHaveBeenCalled();
  });

  it('should call onError on failure', async () => {
    const mockOnCompleted = jest.fn();
    const mockOnError = jest.fn();
    const mockError = new ApolloError({ errorMessage: 'Test error' });
    const mockMutate = jest.fn().mockRejectedValue(mockError);

    (getV4ApolloClient(sandbox).mutate as jest.Mock).mockImplementation(
      mockMutate,
    );

    const { result } = renderHookWithQuicksandProvider(() =>
      useSetSettings({ onCompleted: mockOnCompleted, onError: mockOnError }),
    );

    const [setSettings, { loading }] = result.current;

    expect(loading).toBe(false);

    act(() => {
      setSettings({
        entityVersion: '1',
        isServiceFieldEnabled: true,
        isBillingFieldEnabled: true,
      });
    });

    expect(result.current[1].loading).toBe(true);

    await act(async () => {
      await setSettings({
        entityVersion: '1',
        isServiceFieldEnabled: true,
        isBillingFieldEnabled: true,
      });
    });

    expect(result.current[1].loading).toBe(false);
    expect(mockOnCompleted).not.toHaveBeenCalled();
    expect(mockOnError).toHaveBeenCalledWith(
      'NLS catch.all.error.content undefined',
    );
  });
});

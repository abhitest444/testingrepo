import { Environment } from '@appfabric/sandbox-spec';
import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { useIxpExperiment } from 'src/js/service/hooks/ixp/useIxpExperiment';
import {
  IXP_CONFIG,
  UNIFICATION_EXPERIMENT_NAMESPACE,
  SETTINGS_FLYOUT_V2_NAMESPACE,
} from 'src/js/common/ixpExperimentConfigs';
import { Sandbox } from 'src/js/common/sandbox';

describe('useIxpExperiment', () => {
  let mockSandbox: Sandbox;

  const mockOptions = {
    experimentNamespace: UNIFICATION_EXPERIMENT_NAMESPACE,
    namespace: 'qbo_realm',
    businessUnit: 'QBTIME',
  };

  beforeEach(() => {
    mockSandbox = {
      appContext: {
        getEnvironment: jest.fn().mockReturnValue(Environment.QA),
        getRealmInfo: jest.fn().mockReturnValue({ realmId: '123456' }),
      },
      extensions: {
        qbo: {
          context: {
            getCompanyL10nInfo: jest.fn().mockReturnValue({ region: 'US' }),
            getCompanyInfo: jest.fn().mockReturnValue({
              companyCreateDateInServerLocale: '2020-01-01',
            }),
          },
        },
      },
      experiments: {
        getRemoteExperimentAssignments: jest.fn().mockResolvedValue([
          {
            treatmentKey: 'IXP2_T_1059480',
            experimentId: 485059,
          },
        ]),
      },
      logger: {
        log: jest.fn(),
        error: jest.fn(),
      },
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should return default values on initial render', () => {
      const { result } = renderHook(() =>
        useIxpExperiment(mockSandbox, mockOptions),
      );

      expect(result.current).toEqual({
        isInTreatment: false,
        settled: false,
      });
    });
  });

  describe('successful experiment assignment', () => {
    it('should set isInTreatment to true when user is assigned to the treatment', async () => {
      mockSandbox.experiments.getRemoteExperimentAssignments = jest
        .fn()
        .mockResolvedValue([
          {
            treatmentKey: 'IXP2_T_1059480',
            experimentId: 485059,
          },
        ]);

      const { result } = renderHook(() =>
        useIxpExperiment(mockSandbox, mockOptions),
      );

      await waitFor(() => {
        expect(result.current.isInTreatment).toBe(true);
      });

      expect(result.current).toEqual({
        isInTreatment: true,
        treatmentKey: 'IXP2_T_1059480',
        settled: true,
      });

      expect(mockSandbox.logger?.log).toHaveBeenCalledWith(
        `IXP experiment "${UNIFICATION_EXPERIMENT_NAMESPACE}" initialized: isInTreatment=true, treatmentKey=IXP2_T_1059480`,
      );
    });

    it('should set isInTreatment to false when user is assigned to control', async () => {
      mockSandbox.experiments.getRemoteExperimentAssignments = jest
        .fn()
        .mockResolvedValue([
          {
            treatmentKey: 'IXP2_C_1059480',
            experimentId: 485059,
          },
        ]);

      const { result } = renderHook(() =>
        useIxpExperiment(mockSandbox, mockOptions),
      );

      await waitFor(() => {
        expect(result.current.treatmentKey).toBe('IXP2_C_1059480');
      });

      expect(result.current).toEqual({
        isInTreatment: false,
        treatmentKey: 'IXP2_C_1059480',
        settled: true,
      });

      expect(mockSandbox.logger?.log).toHaveBeenCalledWith(
        `IXP experiment "${UNIFICATION_EXPERIMENT_NAMESPACE}" initialized: isInTreatment=false, treatmentKey=IXP2_C_1059480`,
      );
    });

    it('should call getRemoteExperimentAssignments with correct payload', async () => {
      const { result } = renderHook(() =>
        useIxpExperiment(mockSandbox, mockOptions),
      );

      await waitFor(() => {
        expect(result.current.isInTreatment).toBe(true);
      });

      expect(
        mockSandbox.experiments.getRemoteExperimentAssignments,
      ).toHaveBeenCalledWith({
        businessUnit: 'QBTIME',
        entityId: {
          ns: 'qbo_realm',
          REALM_OR_COMPANY_ID: '123456',
        },
        context: {
          region: 'US',
          companyCreationDate: '2020-01-01',
        },
        assignmentFilter: {
          experimentIds: [485059],
          applications: ['QBO', 'Zoltar'],
        },
        userOptions: {
          assetAlias: 'timecapture-timeentries-ui',
          includeCredentials: true,
        },
      });
    });

    it('should include both QBO and Zoltar in the applications filter', async () => {
      const { result } = renderHook(() =>
        useIxpExperiment(mockSandbox, mockOptions),
      );

      await waitFor(() => {
        expect(result.current.isInTreatment).toBe(true);
      });

      expect(
        mockSandbox.experiments.getRemoteExperimentAssignments,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          assignmentFilter: expect.objectContaining({
            applications: ['QBO', 'Zoltar'],
          }),
        }),
      );
    });
  });

  describe('error handling', () => {
    it('should handle missing config for experiment namespace', async () => {
      const invalidOptions = {
        ...mockOptions,
        experimentNamespace: 'non-existent-experiment',
      };

      const { result } = renderHook(() =>
        useIxpExperiment(mockSandbox, invalidOptions),
      );

      await waitFor(() => {
        expect(mockSandbox.logger?.error).toHaveBeenCalled();
      });

      expect(result.current).toEqual({
        isInTreatment: false,
        settled: true,
      });

      expect(mockSandbox.logger?.error).toHaveBeenCalledWith(
        `No IXP config available for experiment: non-existent-experiment in environment: ${Environment.QA}`,
      );
    });

    it('should handle errors from getRemoteExperimentAssignments', async () => {
      const error = new Error('Failed to fetch experiment assignments');
      mockSandbox.experiments.getRemoteExperimentAssignments = jest
        .fn()
        .mockRejectedValue(error);

      const { result } = renderHook(() =>
        useIxpExperiment(mockSandbox, mockOptions),
      );

      await waitFor(() => {
        expect(mockSandbox.logger?.error).toHaveBeenCalled();
      });

      expect(result.current).toEqual({
        isInTreatment: false,
        settled: true,
      });

      expect(mockSandbox.logger?.error).toHaveBeenCalledWith(
        `Error initializing IXP experiment "${UNIFICATION_EXPERIMENT_NAMESPACE}":`,
        error,
      );
    });

    it('should handle undefined assignments response', async () => {
      mockSandbox.experiments.getRemoteExperimentAssignments = jest
        .fn()
        .mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useIxpExperiment(mockSandbox, mockOptions),
      );

      await waitFor(() => {
        expect(mockSandbox.logger?.log).toHaveBeenCalled();
      });

      expect(result.current).toEqual({
        isInTreatment: false,
        treatmentKey: undefined,
        settled: true,
      });
    });

    it('should handle empty assignments array', async () => {
      mockSandbox.experiments.getRemoteExperimentAssignments = jest
        .fn()
        .mockResolvedValue([]);

      const { result } = renderHook(() =>
        useIxpExperiment(mockSandbox, mockOptions),
      );

      await waitFor(() => {
        expect(mockSandbox.logger?.log).toHaveBeenCalled();
      });

      expect(result.current).toEqual({
        isInTreatment: false,
        treatmentKey: undefined,
        settled: true,
      });
    });
  });

  describe('environment-specific configurations', () => {
    it('should use PROD config when environment is PROD', async () => {
      mockSandbox.appContext.getEnvironment = jest
        .fn()
        .mockReturnValue(Environment.PROD);

      const { result } = renderHook(() =>
        useIxpExperiment(mockSandbox, mockOptions),
      );

      await waitFor(() => {
        expect(result.current.isInTreatment).toBe(true);
      });

      expect(
        mockSandbox.experiments.getRemoteExperimentAssignments,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          assignmentFilter: expect.objectContaining({
            experimentIds: [272706], // PROD experiment ID
          }),
        }),
      );
    });

    it('should use E2E config when environment is E2E', async () => {
      mockSandbox.appContext.getEnvironment = jest
        .fn()
        .mockReturnValue(Environment.E2E);

      const { result } = renderHook(() =>
        useIxpExperiment(mockSandbox, mockOptions),
      );

      await waitFor(() => {
        expect(result.current.isInTreatment).toBe(true);
      });

      expect(
        mockSandbox.experiments.getRemoteExperimentAssignments,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          assignmentFilter: expect.objectContaining({
            experimentIds: [485059], // E2E experiment ID
          }),
        }),
      );
    });

    it('should use PERF config when environment is PERF', async () => {
      mockSandbox.appContext.getEnvironment = jest
        .fn()
        .mockReturnValue(Environment.PERF);

      const { result } = renderHook(() =>
        useIxpExperiment(mockSandbox, mockOptions),
      );

      await waitFor(() => {
        expect(result.current.isInTreatment).toBe(true);
      });

      expect(
        mockSandbox.experiments.getRemoteExperimentAssignments,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          assignmentFilter: expect.objectContaining({
            experimentIds: [485059], // PERF experiment ID
          }),
        }),
      );
    });

    it('should handle environment without config', async () => {
      // Use a non-existent experiment namespace to test missing config scenario
      const invalidOptions = {
        ...mockOptions,
        experimentNamespace: 'experiment-without-config',
      };

      const { result } = renderHook(() =>
        useIxpExperiment(mockSandbox, invalidOptions),
      );

      await waitFor(() => {
        expect(mockSandbox.logger?.error).toHaveBeenCalled();
      });

      expect(result.current).toEqual({
        isInTreatment: false,
        settled: true,
      });

      expect(mockSandbox.logger?.error).toHaveBeenCalledWith(
        `No IXP config available for experiment: experiment-without-config in environment: ${Environment.QA}`,
      );
    });
  });

  describe('hook dependency updates', () => {
    it('should reinitialize when experimentNamespace changes', async () => {
      const { rerender } = renderHook(
        ({ options }) => useIxpExperiment(mockSandbox, options),
        {
          initialProps: { options: mockOptions },
        },
      );

      await waitFor(() => {
        expect(
          mockSandbox.experiments.getRemoteExperimentAssignments,
        ).toHaveBeenCalledTimes(1);
      });

      const newOptions = {
        ...mockOptions,
        experimentNamespace: 'different-experiment',
      };

      rerender({ options: newOptions });

      await waitFor(() => {
        expect(mockSandbox.logger?.error).toHaveBeenCalledWith(
          `No IXP config available for experiment: different-experiment in environment: ${Environment.QA}`,
        );
      });
    });

    it('should reinitialize when namespace changes', async () => {
      const { result, rerender } = renderHook(
        ({ options }) => useIxpExperiment(mockSandbox, options),
        {
          initialProps: { options: mockOptions },
        },
      );

      await waitFor(() => {
        expect(result.current.isInTreatment).toBe(true);
      });

      const newOptions = {
        ...mockOptions,
        namespace: 'different_namespace',
      };

      rerender({ options: newOptions });

      await waitFor(() => {
        expect(
          mockSandbox.experiments.getRemoteExperimentAssignments,
        ).toHaveBeenCalledTimes(2);
      });

      expect(
        mockSandbox.experiments.getRemoteExperimentAssignments,
      ).toHaveBeenLastCalledWith(
        expect.objectContaining({
          entityId: expect.objectContaining({
            ns: 'different_namespace',
          }),
        }),
      );
    });

    it('should reinitialize when businessUnit changes', async () => {
      const { result, rerender } = renderHook(
        ({ options }) => useIxpExperiment(mockSandbox, options),
        {
          initialProps: { options: mockOptions },
        },
      );

      await waitFor(() => {
        expect(result.current.isInTreatment).toBe(true);
      });

      const newOptions = {
        ...mockOptions,
        businessUnit: 'DIFFERENT_BU',
      };

      rerender({ options: newOptions });

      await waitFor(() => {
        expect(
          mockSandbox.experiments.getRemoteExperimentAssignments,
        ).toHaveBeenCalledTimes(2);
      });

      expect(
        mockSandbox.experiments.getRemoteExperimentAssignments,
      ).toHaveBeenLastCalledWith(
        expect.objectContaining({
          businessUnit: 'DIFFERENT_BU',
        }),
      );
    });
  });

  describe('logging functionality', () => {
    it('should log initialization success with treatment details', async () => {
      const { result } = renderHook(() =>
        useIxpExperiment(mockSandbox, mockOptions),
      );

      await waitFor(() => {
        expect(result.current.isInTreatment).toBe(true);
      });

      expect(mockSandbox.logger?.log).toHaveBeenCalledWith(
        `IXP experiment "${UNIFICATION_EXPERIMENT_NAMESPACE}" initialized: isInTreatment=true, treatmentKey=IXP2_T_1059480`,
      );
    });

    it('should not log when config is missing', async () => {
      const invalidOptions = {
        ...mockOptions,
        experimentNamespace: 'non-existent-experiment',
      };

      renderHook(() => useIxpExperiment(mockSandbox, invalidOptions));

      await waitFor(() => {
        expect(mockSandbox.logger?.error).toHaveBeenCalled();
      });

      expect(mockSandbox.logger?.log).not.toHaveBeenCalled();
    });

    it('should not log success when assignment fails', async () => {
      mockSandbox.experiments.getRemoteExperimentAssignments = jest
        .fn()
        .mockRejectedValue(new Error('Assignment failed'));

      renderHook(() => useIxpExperiment(mockSandbox, mockOptions));

      await waitFor(() => {
        expect(mockSandbox.logger?.error).toHaveBeenCalled();
      });

      expect(mockSandbox.logger?.log).not.toHaveBeenCalled();
    });
  });

  describe('realm and company context', () => {
    it('should use realmId from sandbox context', async () => {
      mockSandbox.appContext.getRealmInfo = jest
        .fn()
        .mockReturnValue({ realmId: '999888' });

      const { result } = renderHook(() =>
        useIxpExperiment(mockSandbox, mockOptions),
      );

      await waitFor(() => {
        expect(result.current.isInTreatment).toBe(true);
      });

      expect(
        mockSandbox.experiments.getRemoteExperimentAssignments,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: expect.objectContaining({
            REALM_OR_COMPANY_ID: '999888',
          }),
        }),
      );
    });

    it('should use region from company L10n info', async () => {
      mockSandbox.extensions.qbo.context.getCompanyL10nInfo = jest
        .fn()
        .mockReturnValue({ region: 'CA' });

      const { result } = renderHook(() =>
        useIxpExperiment(mockSandbox, mockOptions),
      );

      await waitFor(() => {
        expect(result.current.isInTreatment).toBe(true);
      });

      expect(
        mockSandbox.experiments.getRemoteExperimentAssignments,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            region: 'CA',
          }),
        }),
      );
    });

    it('should use company creation date from company info', async () => {
      mockSandbox.extensions.qbo.context.getCompanyInfo = jest
        .fn()
        .mockReturnValue({
          companyCreateDateInServerLocale: '2023-06-15',
        });

      const { result } = renderHook(() =>
        useIxpExperiment(mockSandbox, mockOptions),
      );

      await waitFor(() => {
        expect(result.current.isInTreatment).toBe(true);
      });

      expect(
        mockSandbox.experiments.getRemoteExperimentAssignments,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            companyCreationDate: '2023-06-15',
          }),
        }),
      );
    });
  });

  describe('SETTINGS_FLYOUT_V2_NAMESPACE environment configurations', () => {
    const flyoutV2Options = {
      experimentNamespace: SETTINGS_FLYOUT_V2_NAMESPACE,
      namespace: 'timecapture-timeentries-ui',
      businessUnit: 'SBSEG',
    };

    it('should use PROD config (experimentId: 332324) when environment is PROD', async () => {
      mockSandbox.appContext.getEnvironment = jest
        .fn()
        .mockReturnValue(Environment.PROD);
      mockSandbox.experiments.getRemoteExperimentAssignments = jest
        .fn()
        .mockResolvedValue([
          { treatmentKey: 'IXP1_T_725977', experimentId: 332324 },
        ]);

      const { result } = renderHook(() =>
        useIxpExperiment(mockSandbox, flyoutV2Options),
      );

      await waitFor(() => {
        expect(result.current.isInTreatment).toBe(true);
      });

      expect(
        mockSandbox.experiments.getRemoteExperimentAssignments,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          assignmentFilter: expect.objectContaining({
            experimentIds: [332324],
          }),
        }),
      );
    });

    it('should set isInTreatment to true when PROD treatment key IXP1_T_725977 is returned', async () => {
      mockSandbox.appContext.getEnvironment = jest
        .fn()
        .mockReturnValue(Environment.PROD);
      mockSandbox.experiments.getRemoteExperimentAssignments = jest
        .fn()
        .mockResolvedValue([
          { treatmentKey: 'IXP1_T_725977', experimentId: 332324 },
        ]);

      const { result } = renderHook(() =>
        useIxpExperiment(mockSandbox, flyoutV2Options),
      );

      await waitFor(() => {
        expect(result.current.settled).toBe(true);
      });

      expect(result.current).toEqual({
        isInTreatment: true,
        treatmentKey: 'IXP1_T_725977',
        settled: true,
      });
    });

    it('should set isInTreatment to false when a non-matching treatment key is returned in PROD', async () => {
      mockSandbox.appContext.getEnvironment = jest
        .fn()
        .mockReturnValue(Environment.PROD);
      mockSandbox.experiments.getRemoteExperimentAssignments = jest
        .fn()
        .mockResolvedValue([
          { treatmentKey: 'IXP1_C_725977', experimentId: 332324 },
        ]);

      const { result } = renderHook(() =>
        useIxpExperiment(mockSandbox, flyoutV2Options),
      );

      await waitFor(() => {
        expect(result.current.settled).toBe(true);
      });

      expect(result.current.isInTreatment).toBe(false);
    });

    it('should use E2E config (experimentId: 574127) when environment is E2E', async () => {
      mockSandbox.appContext.getEnvironment = jest
        .fn()
        .mockReturnValue(Environment.E2E);
      mockSandbox.experiments.getRemoteExperimentAssignments = jest
        .fn()
        .mockResolvedValue([
          { treatmentKey: 'IXP2_T_1246259', experimentId: 574127 },
        ]);

      const { result } = renderHook(() =>
        useIxpExperiment(mockSandbox, flyoutV2Options),
      );

      await waitFor(() => {
        expect(result.current.isInTreatment).toBe(true);
      });

      expect(
        mockSandbox.experiments.getRemoteExperimentAssignments,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          assignmentFilter: expect.objectContaining({
            experimentIds: [574127],
          }),
        }),
      );
    });
  });

  describe('treatment key validation', () => {
    it('should correctly identify treatment when treatmentKey matches config', async () => {
      const config =
        IXP_CONFIG[UNIFICATION_EXPERIMENT_NAMESPACE]?.[Environment.QA];

      mockSandbox.experiments.getRemoteExperimentAssignments = jest
        .fn()
        .mockResolvedValue([
          {
            treatmentKey: config?.treatmentKey,
            experimentId: config?.experimentId,
          },
        ]);

      const { result } = renderHook(() =>
        useIxpExperiment(mockSandbox, mockOptions),
      );

      await waitFor(() => {
        expect(result.current.isInTreatment).toBe(true);
      });

      expect(result.current.isInTreatment).toBe(true);
      expect(result.current.treatmentKey).toBe(config?.treatmentKey);
    });

    it('should correctly identify non-treatment when treatmentKey does not match config', async () => {
      mockSandbox.experiments.getRemoteExperimentAssignments = jest
        .fn()
        .mockResolvedValue([
          {
            treatmentKey: 'IXP2_C_DIFFERENT',
            experimentId: 485059,
          },
        ]);

      const { result } = renderHook(() =>
        useIxpExperiment(mockSandbox, mockOptions),
      );

      await waitFor(() => {
        expect(result.current.treatmentKey).toBe('IXP2_C_DIFFERENT');
      });

      expect(result.current.isInTreatment).toBe(false);
      expect(result.current.treatmentKey).toBe('IXP2_C_DIFFERENT');
    });
  });
});

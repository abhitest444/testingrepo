import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import {
  FormProvider,
  useForm,
  useFormContext,
  useWatch,
} from 'react-hook-form';
import { MockQuicksandProvider } from '@payroll/quicksand';
import { getDefaultSandbox } from 'test/unit/testUtils';
import DimensionsField from 'src/js/widgets/common/dimensions/DimensionsField';
import type { DimensionDefinition } from 'src/js/widgets/common/dimensions/types';
import type { DimensionsProps } from 'src/js/widgets/common/dimensions/Dimensions';

const mockQueryDefinitions = jest.fn(() => Promise.resolve());
const mockDimensionsRender = jest.fn();
const mockDimensionsMount = jest.fn();

const dimensionsFixture: DimensionDefinition[] = [
  {
    id: '1000000023',
    name: 'Job Costs',
    active: true,
    enabledForTimeTracking: true,
    required: true,
  },
  {
    id: '1000000024',
    name: 'Project Type',
    active: true,
    enabledForTimeTracking: false,
    required: false,
  },
  {
    id: '1000000025',
    name: 'Department',
    active: true,
    enabledForTimeTracking: true,
    required: false,
  },
  {
    id: '1000000026',
    name: 'Service Type',
    active: false,
    enabledForTimeTracking: false,
    required: false,
  },
];

let mockDimensionsHookState = {
  dimensions: [] as DimensionDefinition[],
  loading: false,
  error: null as string | null,
  query: mockQueryDefinitions,
};

jest.mock('src/js/service/hooks/dimensions/useGetDimensions', () => ({
  useGetDimensions: () => mockDimensionsHookState,
}));

jest.mock('src/js/widgets/common/dimensions/Dimensions', () => {
  // eslint-disable-next-line global-require
  const ReactModule = require('react');
  const MockDimensions = (props: DimensionsProps) => {
    mockDimensionsRender(props);
    // Fires once per mount — a change in the remount `key` (worker changed)
    // shows up as an extra call, letting the test assert the widgets are torn
    // down and re-initialised with the new worker's seeded values.
    ReactModule.useEffect(() => {
      mockDimensionsMount();
    }, []);
    return <div data-testid="dimensions-mock" />;
  };
  return { __esModule: true, default: MockDimensions };
});

jest.mock('src/js/service/hooks/useQbTimeSdk', () => ({
  useQbTimeSdk: jest.fn(() => ({
    data: undefined,
    loading: false,
    error: undefined,
    execute: jest.fn(),
    reset: jest.fn(),
  })),
}));

const FormDimensionsProbe: React.FC = () => {
  const { control } = useFormContext();
  const dimensions = useWatch({ control, name: 'dimensions' });
  return (
    <pre data-testid="dimensions-form-state">
      {JSON.stringify(dimensions ?? null)}
    </pre>
  );
};

const setEligibleGates = ({
  isDimensionEnabled = true,
  loading = false,
  error,
}: {
  isDimensionEnabled?: boolean;
  loading?: boolean;
  error?: Error;
} = {}) => {
  const { useQbTimeSdk } = require('src/js/service/hooks/useQbTimeSdk');
  useQbTimeSdk.mockReturnValue({
    data: isDimensionEnabled,
    loading,
    error,
    execute: jest.fn(),
    reset: jest.fn(),
  });
};

const renderField = (
  props: Partial<React.ComponentProps<typeof DimensionsField>> = {},
  {
    defaultValues = {},
    sandbox = getDefaultSandbox(),
    onFormReady,
  }: {
    defaultValues?: Record<string, unknown>;
    sandbox?: ReturnType<typeof getDefaultSandbox>;
    onFormReady?: (methods: ReturnType<typeof useForm>) => void;
  } = {},
) => {
  const Wrapper = ({ children }: { children?: React.ReactNode }) => {
    const methods = useForm({ defaultValues });
    onFormReady?.(methods);

    return (
      <MockQuicksandProvider sandbox={sandbox}>
        <FormProvider {...methods}>{children}</FormProvider>
      </MockQuicksandProvider>
    );
  };

  return render(
    <>
      <DimensionsField trackingPoint={{}} {...props} />
      <FormDimensionsProbe />
    </>,
    { wrapper: Wrapper },
  );
};

describe('DimensionsField', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDimensionsHookState = {
      dimensions: [],
      loading: false,
      error: null,
      query: mockQueryDefinitions,
    };
    setEligibleGates();
  });

  describe('gating', () => {
    it.each([
      ['the SDK dimension decision is off', { isDimensionEnabled: false }],
      [
        'the SDK dimension decision is still resolving',
        { isDimensionEnabled: false, loading: true },
      ],
    ])('renders nothing when %s', async (_label, gateOverrides) => {
      setEligibleGates(gateOverrides);

      const { container } = renderField();

      expect(
        container.querySelector('[data-testid="dimensions-mock"]'),
      ).toBeNull();
      await waitFor(() => {
        expect(mockQueryDefinitions).not.toHaveBeenCalled();
      });
    });

    it('renders nothing when isTimeEntry is false', async () => {
      const { container } = renderField({ isTimeEntry: false });

      expect(
        container.querySelector('[data-testid="dimensions-mock"]'),
      ).toBeNull();
      await waitFor(() => {
        expect(mockQueryDefinitions).not.toHaveBeenCalled();
      });
    });

    it('renders nothing when isOTX is false', async () => {
      const { container } = renderField({ isOTX: false });

      expect(
        container.querySelector('[data-testid="dimensions-mock"]'),
      ).toBeNull();
      await waitFor(() => {
        expect(mockQueryDefinitions).not.toHaveBeenCalled();
      });
    });

    it('renders nothing when the SDK dimension decision errors', async () => {
      setEligibleGates({
        isDimensionEnabled: true,
        error: new Error('sdk failed'),
      });

      const { container } = renderField();

      expect(
        container.querySelector('[data-testid="dimensions-mock"]'),
      ).toBeNull();
      await waitFor(() => {
        expect(mockQueryDefinitions).not.toHaveBeenCalled();
      });
    });
  });

  describe('fetch orchestration', () => {
    it('fetches definitions once when eligible', async () => {
      renderField();

      await waitFor(() => {
        expect(mockQueryDefinitions).toHaveBeenCalledTimes(1);
      });
    });

    it('logs when the definitions fetch fails', async () => {
      const sandbox = getDefaultSandbox();
      mockQueryDefinitions.mockRejectedValueOnce(
        new Error('definitions failed'),
      );

      renderField({}, { sandbox });

      await waitFor(() => {
        expect(sandbox.logger.error).toHaveBeenCalledWith(
          'Component=DimensionsField Event=FetchDefinitionsFailed',
          { error: 'definitions failed' },
        );
      });
    });
  });

  describe('loading and empty states', () => {
    it('renders nothing while gating dependencies are still loading', () => {
      setEligibleGates({ isDimensionEnabled: false, loading: true });

      const { container } = renderField();

      expect(
        container.querySelector('[data-testid="dimensions-mock"]'),
      ).toBeNull();
    });

    it('renders nothing when definitions resolve to an empty list', async () => {
      const { container } = renderField();

      await waitFor(() => {
        expect(mockQueryDefinitions).toHaveBeenCalledTimes(1);
      });
      expect(
        container.querySelector('[data-testid="dimensions-mock"]'),
      ).toBeNull();
    });
  });

  describe('render', () => {
    beforeEach(() => {
      mockDimensionsHookState = {
        ...mockDimensionsHookState,
        dimensions: dimensionsFixture,
      };
    });

    it('renders Dimensions when eligible and data is ready', async () => {
      renderField({ readOnly: true, className: 'dims-block' });

      expect(await screen.findByTestId('dimensions-mock')).toBeInTheDocument();
      expect(mockDimensionsRender).toHaveBeenCalledWith(
        expect.objectContaining({
          dimensions: dimensionsFixture,
          readOnly: true,
          className: 'dims-block',
          trackingPoint: {},
        }),
      );
    });

    it('passes readOnly=true when the entry is locked/approved', async () => {
      renderField({}, { defaultValues: { isLocked: true } });

      await screen.findByTestId('dimensions-mock');

      expect(mockDimensionsRender).toHaveBeenCalledWith(
        expect.objectContaining({
          readOnly: true,
        }),
      );
    });

    it('keeps readOnly=true from the prop even when the entry is unlocked', async () => {
      renderField({ readOnly: true }, { defaultValues: { isLocked: false } });

      await screen.findByTestId('dimensions-mock');

      expect(mockDimensionsRender).toHaveBeenCalledWith(
        expect.objectContaining({
          readOnly: true,
        }),
      );
    });

    it('passes readOnly=false when unlocked and not read-only', async () => {
      renderField({}, { defaultValues: { isLocked: false } });

      await screen.findByTestId('dimensions-mock');

      expect(mockDimensionsRender).toHaveBeenCalledWith(
        expect.objectContaining({
          readOnly: false,
        }),
      );
    });

    it('passes isCreate=true when the form has no id', async () => {
      renderField();

      await screen.findByTestId('dimensions-mock');

      expect(mockDimensionsRender).toHaveBeenCalledWith(
        expect.objectContaining({
          isCreate: true,
        }),
      );
    });

    it('passes isCreate=false when the form has an id', async () => {
      renderField(
        {},
        {
          defaultValues: {
            id: 'entry-1',
            dimensions: {
              '1000000024': { id: '1000000024', optionID: 'saved-opt' },
            },
          },
        },
      );

      await screen.findByTestId('dimensions-mock');

      expect(mockDimensionsRender).toHaveBeenCalledWith(
        expect.objectContaining({
          isCreate: false,
        }),
      );
    });

    it('evaluates the SDK dimension-enabled decision on mount', async () => {
      const { useQbTimeSdk } = require('src/js/service/hooks/useQbTimeSdk');

      renderField();

      await waitFor(() => {
        expect(useQbTimeSdk).toHaveBeenCalledWith(expect.any(Function), {
          executeOnMount: true,
        });
      });
    });
  });

  describe('form seeding', () => {
    it('backfills missing dimension rows without overwriting persisted values', async () => {
      mockDimensionsHookState = {
        ...mockDimensionsHookState,
        dimensions: dimensionsFixture,
      };

      let formMethods: ReturnType<typeof useForm> | undefined;
      renderField(
        {},
        {
          defaultValues: {
            dimensions: {
              '1000000023': { id: '1000000023', optionID: 'persisted-opt' },
            },
          },
          onFormReady: (methods) => {
            formMethods = methods;
            jest.spyOn(methods, 'setValue');
          },
        },
      );

      await waitFor(() => {
        expect(formMethods?.setValue).toHaveBeenCalledWith(
          'dimensions',
          {
            '1000000023': { id: '1000000023', optionID: 'persisted-opt' },
            '1000000025': { id: '1000000025', optionID: null },
          },
          {
            shouldDirty: false,
            shouldTouch: false,
          },
        );
      });
    });

    it('seeds workerDefaultOptionId when no persisted selection exists', async () => {
      mockDimensionsHookState = {
        ...mockDimensionsHookState,
        dimensions: [
          {
            ...dimensionsFixture[0],
            workerDefaultOptionId: '1000000035',
          } as DimensionDefinition,
          ...dimensionsFixture.slice(1),
        ],
      };

      let formMethods: ReturnType<typeof useForm> | undefined;
      renderField(
        {},
        {
          defaultValues: { dimensions: {} },
          onFormReady: (methods) => {
            formMethods = methods;
            jest.spyOn(methods, 'setValue');
          },
        },
      );

      await waitFor(() => {
        expect(formMethods?.setValue).toHaveBeenCalledWith(
          'dimensions',
          {
            // Seeded value equals the worker default → flagged so a later clear
            // emits ['-1'] rather than []. `prefilledDefault` marks it as a
            // seed-time prefill (not a persisted value) so the edit flow can
            // suppress it while still showing genuinely-saved defaults.
            '1000000023': {
              id: '1000000023',
              optionID: '1000000035',
              activeValueIsDefault: true,
              prefilledDefault: true,
            },
            '1000000025': { id: '1000000025', optionID: null },
          },
          {
            shouldDirty: false,
            shouldTouch: false,
          },
        );
      });
    });

    it('re-seeds and remounts the fields with the new worker default when timeFor changes', async () => {
      const activeDim: DimensionDefinition = {
        id: '1000000023',
        name: 'Job Costs',
        active: true,
        enabledForTimeTracking: true,
        required: false,
      };
      mockDimensionsHookState = {
        ...mockDimensionsHookState,
        dimensions: [{ ...activeDim, workerDefaultOptionId: 'worker-a-opt' }],
      };

      let formMethods: ReturnType<typeof useForm> | undefined;
      const { rerender } = renderField(
        {},
        {
          defaultValues: { dimensions: {} },
          onFormReady: (methods) => {
            formMethods = methods;
          },
        },
      );

      // Initial worker: its default is prefilled and the fields mount once.
      await waitFor(() => {
        expect(formMethods?.getValues('dimensions')).toEqual({
          '1000000023': {
            id: '1000000023',
            optionID: 'worker-a-opt',
            activeValueIsDefault: true,
            prefilledDefault: true,
          },
        });
      });
      expect(mockDimensionsMount).toHaveBeenCalledTimes(1);

      // Worker (timeFor) changes → definitions come back with a new default.
      mockDimensionsHookState = {
        ...mockDimensionsHookState,
        dimensions: [{ ...activeDim, workerDefaultOptionId: 'worker-b-opt' }],
      };
      rerender(
        <>
          <DimensionsField trackingPoint={{}} />
          <FormDimensionsProbe />
        </>,
      );

      // The previous worker's prefilled default is swapped for the new worker's,
      // and the fields remount so the quickfills widgets pick up the new value.
      await waitFor(() => {
        expect(formMethods?.getValues('dimensions')).toEqual({
          '1000000023': {
            id: '1000000023',
            optionID: 'worker-b-opt',
            activeValueIsDefault: true,
            prefilledDefault: true,
          },
        });
      });
      expect(mockDimensionsMount).toHaveBeenCalledTimes(2);
    });
  });
});

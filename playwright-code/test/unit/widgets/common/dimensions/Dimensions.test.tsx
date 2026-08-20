import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { useFormContext } from 'react-hook-form';
import { renderWithFormProvider } from 'test/unit/testUtils';
import { Dimensions } from 'src/js/widgets/common/dimensions';
import {
  DIMENSIONS_FORM_NAME,
  DIMENSIONS_TEST_IDS,
  type DimensionDefinition,
  type DimensionValue,
} from 'src/js/widgets/common/dimensions/types';
import type { TrackingPoints } from 'src/js/common/useClickTracking';

const mockTrack = jest.fn();

const mockTrackingPoint = {
  org: 'intuit',
  purpose: 'engagement',
  scope: 'qbtime',
  scope_area: 'time_entry',
  action: 'click',
  object: 'dimension',
};

const trackingPointsWithDropdown: TrackingPoints = {
  DIMENSION_DROPDOWN: mockTrackingPoint,
};

const trackingPointsFallback: TrackingPoints = {
  FALLBACK: mockTrackingPoint,
};

jest.mock('web-shell-core/widgets/HOCWidget', () => ({
  __esModule: true,
  default: ({
    label,
    value,
    disabled,
    errorText,
    definitionId,
    widgetId,
    type,
    onChange,
    'data-testid': testId,
  }: {
    label: string;
    value?: string;
    disabled?: boolean;
    errorText?: string;
    definitionId?: string;
    widgetId?: string;
    type?: string;
    onChange?: (event: {
      selectedItem?: {
        dimension?: {
          id: string;
          definitionId: string;
          dimensionValueId: string;
          fullyQualifiedLabel: string;
        };
      };
    }) => void;
    'data-testid'?: string;
  }) => (
    <div
      data-testid={testId}
      data-disabled={String(!!disabled)}
      data-value={value ?? ''}
      data-definition-id={definitionId}
      data-widget-id={widgetId}
      data-type={type}
    >
      <label>{label}</label>
      {errorText && <span data-testid="dim-error">{errorText}</span>}
      <button
        type="button"
        data-testid={`${testId}-select`}
        onClick={() =>
          onChange?.({
            selectedItem: {
              dimension: {
                id: `${definitionId}-opt-new`,
                definitionId: definitionId ?? '',
                dimensionValueId: 'opt-new',
                fullyQualifiedLabel: 'New Option',
              },
            },
          })
        }
      >
        select
      </button>
      <button
        type="button"
        data-testid={`${testId}-select-same`}
        onClick={() =>
          onChange?.({
            selectedItem: {
              dimension: {
                id: `${definitionId}-opt-1`,
                definitionId: definitionId ?? '',
                dimensionValueId: 'opt-1',
                fullyQualifiedLabel: 'Existing Option',
              },
            },
          })
        }
      >
        select same
      </button>
      <button
        type="button"
        data-testid={`${testId}-select-worker-default`}
        onClick={() =>
          onChange?.({
            selectedItem: {
              dimension: {
                id: `${definitionId}-worker-opt`,
                definitionId: definitionId ?? '',
                dimensionValueId: 'worker-opt',
                fullyQualifiedLabel: 'Worker Default',
              },
            },
          })
        }
      >
        select worker default
      </button>
      <button
        type="button"
        data-testid={`${testId}-clear`}
        onClick={() => onChange?.({ selectedItem: undefined })}
      >
        clear
      </button>
    </div>
  ),
}));

jest.mock('@payroll/quicksand', () => ({
  ...jest.requireActual('@payroll/quicksand'),
  useIntl: () => ({ formatMessage: ({ id }: { id: string }) => id }),
  useTracking: () => mockTrack,
}));

const FormDimensionsProbe: React.FC = () => {
  const { watch } = useFormContext();
  const dimensions = watch(DIMENSIONS_FORM_NAME) as
    | Record<string, DimensionValue>
    | undefined;
  return (
    <pre data-testid="dimensions-form-state">
      {JSON.stringify(dimensions ?? null)}
    </pre>
  );
};

const TriggerValidationButton: React.FC<{ fieldName: string }> = ({
  fieldName,
}) => {
  const { trigger } = useFormContext();
  return (
    <button
      type="button"
      data-testid="trigger-validation"
      onClick={() => trigger(fieldName)}
    />
  );
};

const dimensionsFixture: DimensionDefinition[] = [
  {
    id: 'd-active-required',
    name: 'Job Costs',
    active: true,
    enabledForTimeTracking: true,
    required: true,
  },
  {
    id: 'd-active',
    name: 'Project Type',
    active: true,
    enabledForTimeTracking: true,
    required: false,
  },
  {
    id: 'd-inactive',
    name: 'Service Type',
    active: false,
    enabledForTimeTracking: false,
    required: false,
  },
  {
    id: 'd-with-default',
    name: 'Location',
    active: true,
    enabledForTimeTracking: true,
    required: false,
    workerDefaultOptionId: 'worker-opt',
  },
];

const quickfillTestId = (definitionId: string) =>
  `${DIMENSIONS_TEST_IDS.FIELD_CONTAINER}-${definitionId}-quickfill`;

const fieldContainerTestId = (definitionId: string) =>
  `${DIMENSIONS_TEST_IDS.FIELD_CONTAINER}-${definitionId}`;

const readFormDimensions = () =>
  JSON.parse(
    screen.getByTestId('dimensions-form-state').textContent ?? 'null',
  ) as Record<string, DimensionValue> | null;

describe('Dimensions (shared component)', () => {
  beforeEach(() => {
    mockTrack.mockClear();
  });
  it('renders nothing when no visible dimensions', () => {
    const { container } = renderWithFormProvider(
      <Dimensions dimensions={[]} isCreate trackingPoint={{}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the visible dimensions with an asterisk for required', () => {
    renderWithFormProvider(
      <Dimensions dimensions={dimensionsFixture} isCreate trackingPoint={{}} />,
    );
    expect(screen.getByText('Job Costs *')).toBeInTheDocument();
    expect(screen.getByText('Project Type')).toBeInTheDocument();
    expect(screen.queryByText('Service Type')).not.toBeInTheDocument();
  });

  it('renders inactive dimensions read-only on update when the entry has a value', () => {
    renderWithFormProvider(
      <Dimensions
        dimensions={dimensionsFixture}
        isCreate={false}
        trackingPoint={{}}
      />,
      {
        defaultValues: {
          [DIMENSIONS_FORM_NAME]: {
            'd-inactive': { id: 'd-inactive', optionID: 'opt-1' },
          },
        },
      },
    );
    // Inactive + not enabled, but a value was saved on the entry → shown
    // read-only (disabled) so the user can see it; excluded from the payload.
    expect(screen.getByText('Service Type')).toBeInTheDocument();
    const widget = screen.getByTestId(quickfillTestId('d-inactive'));
    expect(widget).toHaveAttribute('data-disabled', 'true');
  });

  it('does not render inactive dimensions on update when the entry has no value', () => {
    renderWithFormProvider(
      <Dimensions
        dimensions={dimensionsFixture}
        isCreate={false}
        trackingPoint={{}}
      />,
    );
    expect(screen.queryByText('Service Type')).not.toBeInTheDocument();
    expect(screen.queryByTestId(quickfillTestId('d-inactive'))).toBeNull();
  });

  it('passes readOnly through to every dimension', () => {
    renderWithFormProvider(
      <Dimensions
        dimensions={dimensionsFixture}
        isCreate
        readOnly
        trackingPoint={{}}
      />,
    );
    expect(
      screen
        .getByTestId(quickfillTestId('d-active-required'))
        .getAttribute('data-disabled'),
    ).toBe('true');
    expect(
      screen
        .getByTestId(quickfillTestId('d-active'))
        .getAttribute('data-disabled'),
    ).toBe('true');
  });

  it('mounts the quickfills widget per visible definition', () => {
    renderWithFormProvider(
      <Dimensions dimensions={dimensionsFixture} isCreate trackingPoint={{}} />,
    );

    const required = screen.getByTestId(quickfillTestId('d-active-required'));
    expect(required.getAttribute('data-widget-id')).toBe(
      'qbo-quickfills-ui/quickfills',
    );
    expect(required.getAttribute('data-type')).toBe('dimension');
    expect(required.getAttribute('data-definition-id')).toBe(
      'd-active-required',
    );

    const optional = screen.getByTestId(quickfillTestId('d-active'));
    expect(optional.getAttribute('data-definition-id')).toBe('d-active');
  });

  it('shows validation error when a required dimension has no selection', async () => {
    renderWithFormProvider(
      <>
        <Dimensions
          dimensions={dimensionsFixture}
          isCreate
          trackingPoint={{}}
        />
        <TriggerValidationButton
          fieldName={`${DIMENSIONS_FORM_NAME}.d-active-required`}
        />
      </>,
      {
        defaultValues: {
          [DIMENSIONS_FORM_NAME]: {
            'd-active-required': { id: 'd-active-required', optionID: '' },
          },
        },
      },
    );

    fireEvent.click(screen.getByTestId('trigger-validation'));

    await waitFor(() => {
      expect(screen.getByTestId('dim-error')).toHaveTextContent(
        'drawer.field.required',
      );
    });
  });

  it('passes validation when a required dimension has a selection', async () => {
    renderWithFormProvider(
      <>
        <Dimensions
          dimensions={dimensionsFixture}
          isCreate
          trackingPoint={{}}
        />
        <TriggerValidationButton
          fieldName={`${DIMENSIONS_FORM_NAME}.d-active-required`}
        />
      </>,
      {
        defaultValues: {
          [DIMENSIONS_FORM_NAME]: {
            'd-active-required': { id: 'd-active-required', optionID: 'opt-1' },
          },
        },
      },
    );

    fireEvent.click(screen.getByTestId('trigger-validation'));

    await waitFor(() => {
      expect(screen.queryByTestId('dim-error')).not.toBeInTheDocument();
    });
  });

  it('shows the required error as soon as a required dimension is cleared', async () => {
    renderWithFormProvider(
      <Dimensions dimensions={dimensionsFixture} isCreate trackingPoint={{}} />,
      {
        defaultValues: {
          [DIMENSIONS_FORM_NAME]: {
            'd-active-required': { id: 'd-active-required', optionID: 'opt-1' },
          },
        },
      },
    );

    // Clearing a required field surfaces the error immediately — no submit.
    fireEvent.mouseDown(
      screen.getByTestId(fieldContainerTestId('d-active-required')),
    );
    fireEvent.click(
      screen.getByTestId(`${quickfillTestId('d-active-required')}-clear`),
    );

    await waitFor(() => {
      expect(screen.getByTestId('dim-error')).toHaveTextContent(
        'drawer.field.required',
      );
    });
  });

  it('clears the required error once a value is chosen', async () => {
    renderWithFormProvider(
      <>
        <Dimensions
          dimensions={dimensionsFixture}
          isCreate
          trackingPoint={{}}
        />
        <TriggerValidationButton
          fieldName={`${DIMENSIONS_FORM_NAME}.d-active-required`}
        />
      </>,
      {
        defaultValues: {
          [DIMENSIONS_FORM_NAME]: {
            'd-active-required': { id: 'd-active-required', optionID: '' },
          },
        },
      },
    );

    // Error is present first (empty required field).
    fireEvent.click(screen.getByTestId('trigger-validation'));
    await waitFor(() => {
      expect(screen.getByTestId('dim-error')).toBeInTheDocument();
    });

    // Selecting a value clears the error without another submit.
    fireEvent.click(
      screen.getByTestId(`${quickfillTestId('d-active-required')}-select`),
    );
    await waitFor(() => {
      expect(screen.queryByTestId('dim-error')).not.toBeInTheDocument();
    });
  });

  it('passes the composite quickfill value for a seeded option', () => {
    renderWithFormProvider(
      <Dimensions dimensions={dimensionsFixture} isCreate trackingPoint={{}} />,
      {
        defaultValues: {
          [DIMENSIONS_FORM_NAME]: {
            'd-active': { id: 'd-active', optionID: 'opt-1' },
          },
        },
      },
    );

    expect(screen.getByTestId(quickfillTestId('d-active'))).toHaveAttribute(
      'data-value',
      'd-active-opt-1',
    );
  });

  it('suppresses a seed-prefilled worker default on the edit flow (STE)', () => {
    renderWithFormProvider(
      <Dimensions
        dimensions={dimensionsFixture}
        isCreate={false}
        trackingPoint={{}}
      />,
      {
        defaultValues: {
          [DIMENSIONS_FORM_NAME]: {
            'd-with-default': {
              id: 'd-with-default',
              optionID: 'worker-opt',
              activeValueIsDefault: true,
              prefilledDefault: true,
            },
          },
        },
      },
    );

    // Edit flow: the worker default is a seed-time prefill, never surfaced.
    expect(
      screen.getByTestId(quickfillTestId('d-with-default')),
    ).toHaveAttribute('data-value', '');
  });

  it('still shows a persisted value equal to the worker default on the edit flow', () => {
    renderWithFormProvider(
      <Dimensions
        dimensions={dimensionsFixture}
        isCreate={false}
        trackingPoint={{}}
      />,
      {
        defaultValues: {
          [DIMENSIONS_FORM_NAME]: {
            // Saved value equals the default but is NOT a prefill (no marker) —
            // it came from the response and must still render.
            'd-with-default': {
              id: 'd-with-default',
              optionID: 'worker-opt',
              activeValueIsDefault: true,
            },
          },
        },
      },
    );

    expect(
      screen.getByTestId(quickfillTestId('d-with-default')),
    ).toHaveAttribute('data-value', 'd-with-default-worker-opt');
  });

  it('surfaces a prefilled worker default on create', () => {
    renderWithFormProvider(
      <Dimensions dimensions={dimensionsFixture} isCreate trackingPoint={{}} />,
      {
        defaultValues: {
          [DIMENSIONS_FORM_NAME]: {
            'd-with-default': {
              id: 'd-with-default',
              optionID: 'worker-opt',
              activeValueIsDefault: true,
              prefilledDefault: true,
            },
          },
        },
      },
    );

    expect(
      screen.getByTestId(quickfillTestId('d-with-default')),
    ).toHaveAttribute('data-value', 'd-with-default-worker-opt');
  });

  it('surfaces a prefilled worker default on edit when Clock prefill-on-empty is enabled', () => {
    renderWithFormProvider(
      <Dimensions
        dimensions={dimensionsFixture}
        isCreate={false}
        prefillWorkerDefaultsWhenEmpty
        trackingPoint={{}}
      />,
      {
        defaultValues: {
          [DIMENSIONS_FORM_NAME]: {
            'd-with-default': {
              id: 'd-with-default',
              optionID: 'worker-opt',
              activeValueIsDefault: true,
              prefilledDefault: true,
            },
          },
        },
      },
    );

    expect(
      screen.getByTestId(quickfillTestId('d-with-default')),
    ).toHaveAttribute('data-value', 'd-with-default-worker-opt');
  });

  it('still shows a persisted non-default option on the edit flow', () => {
    renderWithFormProvider(
      <Dimensions
        dimensions={dimensionsFixture}
        isCreate={false}
        trackingPoint={{}}
      />,
      {
        defaultValues: {
          [DIMENSIONS_FORM_NAME]: {
            'd-with-default': { id: 'd-with-default', optionID: 'opt-1' },
          },
        },
      },
    );

    expect(
      screen.getByTestId(quickfillTestId('d-with-default')),
    ).toHaveAttribute('data-value', 'd-with-default-opt-1');
  });

  it('ignores quickfills init clear while a seeded value exists and the user has not engaged', () => {
    renderWithFormProvider(
      <>
        <Dimensions
          dimensions={dimensionsFixture}
          isCreate
          trackingPoint={{}}
        />
        <FormDimensionsProbe />
      </>,
      {
        defaultValues: {
          [DIMENSIONS_FORM_NAME]: {
            'd-active': { id: 'd-active', optionID: 'opt-1' },
          },
        },
      },
    );

    fireEvent.click(screen.getByTestId(`${quickfillTestId('d-active')}-clear`));

    expect(readFormDimensions()?.['d-active']?.optionID).toBe('opt-1');
    expect(mockTrack).not.toHaveBeenCalled();
  });

  it('ignores an empty clear on a field the user opened but never filled', () => {
    renderWithFormProvider(
      <>
        <Dimensions
          dimensions={dimensionsFixture}
          isCreate
          trackingPoint={{}}
        />
        <FormDimensionsProbe />
      </>,
      {
        defaultValues: {
          [DIMENSIONS_FORM_NAME]: {
            'd-active': { id: 'd-active', optionID: null },
          },
        },
      },
    );

    // User engages the empty field (opens the dropdown) then closes it without
    // picking anything. optionID must stay null — writing '' would send a
    // spurious [] on save for a field the user never filled.
    fireEvent.mouseDown(screen.getByTestId(fieldContainerTestId('d-active')));
    fireEvent.click(screen.getByTestId(`${quickfillTestId('d-active')}-clear`));

    expect(readFormDimensions()?.['d-active']?.optionID).toBeNull();
    expect(mockTrack).not.toHaveBeenCalled();
  });

  it('updates form state when the user selects an option', () => {
    renderWithFormProvider(
      <>
        <Dimensions
          dimensions={dimensionsFixture}
          isCreate
          trackingPoint={{}}
        />
        <FormDimensionsProbe />
      </>,
    );

    fireEvent.click(
      screen.getByTestId(`${quickfillTestId('d-active-required')}-select`),
    );

    expect(readFormDimensions()?.['d-active-required']).toEqual({
      id: 'd-active-required',
      optionID: 'opt-new',
      displayOnly: false,
    });
  });

  it('does not mark dirty when quickfills re-asserts the current selection', () => {
    renderWithFormProvider(
      <>
        <Dimensions
          dimensions={dimensionsFixture}
          isCreate
          trackingPoint={{}}
        />
        <FormDimensionsProbe />
      </>,
      {
        defaultValues: {
          [DIMENSIONS_FORM_NAME]: {
            'd-active': {
              id: 'd-active',
              optionID: 'opt-1',
              activeValueIsDefault: false,
            },
          },
        },
      },
    );

    fireEvent.click(
      screen.getByTestId(`${quickfillTestId('d-active')}-select-same`),
    );

    expect(readFormDimensions()?.['d-active']).toEqual({
      id: 'd-active',
      optionID: 'opt-1',
      activeValueIsDefault: false,
    });
    expect(mockTrack).not.toHaveBeenCalled();
  });

  it('clears the value after the user engages the field', () => {
    renderWithFormProvider(
      <>
        <Dimensions
          dimensions={dimensionsFixture}
          isCreate
          trackingPoint={{}}
        />
        <FormDimensionsProbe />
      </>,
      {
        defaultValues: {
          [DIMENSIONS_FORM_NAME]: {
            'd-active': { id: 'd-active', optionID: 'opt-1' },
          },
        },
      },
    );

    fireEvent.mouseDown(screen.getByTestId(fieldContainerTestId('d-active')));
    fireEvent.click(screen.getByTestId(`${quickfillTestId('d-active')}-clear`));

    expect(readFormDimensions()?.['d-active']).toEqual({
      id: 'd-active',
      optionID: '',
      displayOnly: false,
    });
  });

  it('marks user engagement on focus so a subsequent clear is honored', () => {
    renderWithFormProvider(
      <>
        <Dimensions
          dimensions={dimensionsFixture}
          isCreate
          trackingPoint={{}}
        />
        <FormDimensionsProbe />
      </>,
      {
        defaultValues: {
          [DIMENSIONS_FORM_NAME]: {
            'd-active': { id: 'd-active', optionID: 'opt-1' },
          },
        },
      },
    );

    fireEvent.focus(screen.getByTestId(fieldContainerTestId('d-active')));
    fireEvent.click(screen.getByTestId(`${quickfillTestId('d-active')}-clear`));

    expect(readFormDimensions()?.['d-active']?.optionID).toBe('');
  });

  it('flags activeValueIsDefault when selecting the worker default option', () => {
    renderWithFormProvider(
      <>
        <Dimensions
          dimensions={dimensionsFixture}
          isCreate
          trackingPoint={{}}
        />
        <FormDimensionsProbe />
      </>,
    );

    fireEvent.click(
      screen.getByTestId(
        `${quickfillTestId('d-with-default')}-select-worker-default`,
      ),
    );

    expect(readFormDimensions()?.['d-with-default']).toEqual({
      id: 'd-with-default',
      optionID: 'worker-opt',
      displayOnly: false,
      activeValueIsDefault: true,
    });
  });

  it('preserves activeValueIsDefault when clearing a worker default', () => {
    renderWithFormProvider(
      <>
        <Dimensions
          dimensions={dimensionsFixture}
          isCreate
          trackingPoint={{}}
        />
        <FormDimensionsProbe />
      </>,
      {
        defaultValues: {
          [DIMENSIONS_FORM_NAME]: {
            'd-with-default': {
              id: 'd-with-default',
              optionID: 'worker-opt',
              activeValueIsDefault: true,
            },
          },
        },
      },
    );

    fireEvent.mouseDown(
      screen.getByTestId(fieldContainerTestId('d-with-default')),
    );
    fireEvent.click(
      screen.getByTestId(`${quickfillTestId('d-with-default')}-clear`),
    );

    expect(readFormDimensions()?.['d-with-default']).toEqual({
      id: 'd-with-default',
      optionID: '',
      displayOnly: false,
      activeValueIsDefault: true,
    });
  });

  it('tracks DIMENSION_DROPDOWN when provided on the tracking point', () => {
    renderWithFormProvider(
      <Dimensions
        dimensions={dimensionsFixture}
        isCreate
        trackingPoint={trackingPointsWithDropdown}
      />,
    );

    fireEvent.click(
      screen.getByTestId(`${quickfillTestId('d-active-required')}-select`),
    );

    expect(mockTrack).toHaveBeenCalledWith(mockTrackingPoint);
  });

  it('falls back to the tracking point object when DIMENSION_DROPDOWN is absent', () => {
    renderWithFormProvider(
      <Dimensions
        dimensions={dimensionsFixture}
        isCreate
        trackingPoint={trackingPointsFallback}
      />,
    );

    fireEvent.click(
      screen.getByTestId(`${quickfillTestId('d-active-required')}-select`),
    );

    expect(mockTrack).toHaveBeenCalledWith(trackingPointsFallback);
  });
});

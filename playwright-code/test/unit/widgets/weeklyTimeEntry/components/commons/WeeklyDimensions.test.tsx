import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { DataAccess_ContactType } from 'src/__generated__/oigql/graphql';
import { WeeklyDimensions } from 'src/js/widgets/weeklyTimeEntry/components/commons/WeeklyDimensions';
import dimensionsReducer from 'src/js/widgets/weeklyTimeEntry/store/dimensionsSlice';
import timeEntryGridReducer from 'src/js/widgets/weeklyTimeEntry/store/timeEntryGridSlice';
import { DIMENSIONS_TEST_IDS } from 'src/js/widgets/common/dimensions';

jest.mock('web-shell-core/widgets/HOCWidget', () => ({
  __esModule: true,
  default: ({
    label,
    value,
    disabled,
    errorText,
    definitionId,
    onChange,
    'data-testid': testId,
  }: {
    label: string;
    value?: string;
    disabled?: boolean;
    errorText?: string;
    definitionId?: string;
    onChange?: (event: {
      selectedItem?: { dimension?: { id: string } };
    }) => void;
    'data-testid'?: string;
  }) => (
    <div
      data-testid={testId}
      data-disabled={String(!!disabled)}
      data-value={value ?? ''}
      data-definition-id={definitionId}
    >
      <label>{label}</label>
      {errorText && <span data-testid={`${testId}-error`}>{errorText}</span>}
      <button
        type="button"
        data-testid={`${testId}-select`}
        onClick={() =>
          onChange?.({
            selectedItem: {
              dimension: { id: `${definitionId}-opt-1` },
            },
          })
        }
      >
        Select
      </button>
    </div>
  ),
}));

jest.mock('@payroll/quicksand', () => ({
  useTracking: () => jest.fn(),
  useSandbox: () => ({ realmId: 'test-realm', offering: 'qbo' }),
}));

jest.mock(
  'src/js/widgets/weeklyTimeEntry/hooks/useWeeklyTimeTrackingPoints',
  () => ({
    useWeeklyTimeTrackingPoints: () => ({
      DIMENSION_DROPDOWN: { event: 'dimension_dropdown' },
      CUSTOM_FIELD_DROPDOWN: { event: 'custom_field_dropdown' },
    }),
  }),
);

jest.mock('src/js/widgets/weeklyTimeEntry/hooks/useDimensionsData', () => ({
  useDimensionsData: jest.fn(),
}));

const mockUseDimensionsData =
  require('src/js/widgets/weeklyTimeEntry/hooks/useDimensionsData').useDimensionsData;

const mockDefinitions = [
  {
    id: 'dim-1',
    name: 'Department',
    active: true,
    enabledForTimeTracking: true,
    required: true,
  },
  {
    id: 'dim-2',
    name: 'Inactive Dimension',
    active: false,
    enabledForTimeTracking: false,
    required: false,
  },
];

const mockDisplayCell = {
  timeEntryId: 'entry-1',
  date: '2024-01-01',
  hours: 8,
  notes: '',
  dimensions: [{ id: 'dim-1', name: 'Department', optionID: 'opt-existing' }],
  isApproved: false,
};

const createStore = (overrides: Record<string, unknown> = {}) =>
  configureStore({
    reducer: {
      dimensions: dimensionsReducer,
      timeEntryGrid: timeEntryGridReducer,
    },
    preloadedState: {
      dimensions: {
        dimensions: mockDefinitions,
        enabled: true,
        loading: false,
        error: null,
      },
      timeEntryGrid: {
        weeklyTimeEntries: {
          'row-1': {
            rowId: 'row-1',
            timeAgainst: {
              id: 'customer-1',
              type: DataAccess_ContactType.Customer,
              displayName: 'Customer 1',
            },
            timeEntries: { 0: mockDisplayCell },
            totalHours: 8,
            billableTotal: 8,
            deleted: false,
            hasApprovedEntries: false,
          },
        },
        rowOrder: ['row-1'],
        loading: false,
        error: null,
        teamMember: null,
        dateRange: { start: '2024-01-01', end: '2024-01-07' },
        selected: { rowId: 'row-1', dayIdx: 0 },
        firstEditedCells: {},
        showSelectTeamMemberTooltip: false,
        isTeamMemberDropdownReady: false,
        isQuickFindEnabled: false,
        isQuickFindSettled: true,
        confirmTimeEntryConversionModal: {
          isOpen: false,
          rowId: null,
          dayIdx: null,
        },
      },
      ...overrides,
    },
  });

const renderComponent = (
  props: Partial<React.ComponentProps<typeof WeeklyDimensions>> = {},
  store = createStore(),
) =>
  render(
    <Provider store={store}>
      <WeeklyDimensions displayCell={mockDisplayCell} {...props} />
    </Provider>,
  );

describe('WeeklyDimensions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDimensionsData.mockReturnValue({ isVisible: true });
  });

  it('renders nothing when dimensions are not visible', () => {
    mockUseDimensionsData.mockReturnValue({ isVisible: false });

    renderComponent();

    expect(
      screen.queryByTestId(DIMENSIONS_TEST_IDS.WIDGET),
    ).not.toBeInTheDocument();
  });

  it('renders visible active dimensions', () => {
    renderComponent();

    expect(screen.getByTestId(DIMENSIONS_TEST_IDS.WIDGET)).toBeInTheDocument();
    expect(screen.getByTestId('dimension-dim-1')).toBeInTheDocument();
    expect(screen.queryByTestId('dimension-dim-2')).not.toBeInTheDocument();
    expect(screen.getByText('Department *')).toBeInTheDocument();
  });

  it('shows validation errors on dimension fields', () => {
    renderComponent({
      fieldErrors: { 'dim-1': 'Required' },
    });

    expect(screen.getByTestId('dimension-dim-1-error')).toHaveTextContent(
      'Required',
    );
  });

  it('disables fields when disabled prop is true', () => {
    renderComponent({ disabled: true });

    expect(screen.getByTestId('dimension-dim-1')).toHaveAttribute(
      'data-disabled',
      'true',
    );
  });

  it('dispatches updateCell when a dimension is selected', () => {
    const store = createStore();
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    renderComponent({}, store);

    fireEvent.click(screen.getByTestId('dimension-dim-1-select'));

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: expect.stringContaining('updateCell'),
        payload: expect.objectContaining({
          rowId: 'row-1',
          dayIdx: 0,
          value: {
            dimensions: [
              {
                id: 'dim-1',
                name: 'Department',
                optionID: 'opt-1',
              },
            ],
          },
        }),
      }),
    );
  });

  it('ignores a re-assert onChange for the already-selected value', () => {
    // Cell already holds the option that the quickfills widget re-asserts on
    // mount. This mirrors the duplicate onChange the widget fires for a single
    // interaction, which previously dispatched (and tracked) twice.
    const displayCell = {
      ...mockDisplayCell,
      dimensions: [{ id: 'dim-1', name: 'Department', optionID: 'opt-1' }],
    };
    const store = createStore();
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    renderComponent({ displayCell }, store);

    fireEvent.click(screen.getByTestId('dimension-dim-1-select'));

    expect(dispatchSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({
        type: expect.stringContaining('updateCell'),
      }),
    );
  });
});

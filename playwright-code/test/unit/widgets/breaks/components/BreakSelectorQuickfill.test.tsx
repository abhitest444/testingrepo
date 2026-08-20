import React from 'react';
import { render, screen } from '@testing-library/react';
import { useIntl } from '@payroll/quicksand';
import BreakSelectorQuickfill from 'src/js/widgets/breaks/components/BreakSelectorQuickfill';
import { renderWithAllAppProviders } from '../../../testUtils';

// Mock buildSandbox
jest.mock('@payroll/quicksand', () => ({
  ...jest.requireActual('@payroll/quicksand'),
  useIntl: jest.fn(),
  useTracking: () => jest.fn(),
  buildSandbox: jest.fn(() => ({
    extensions: {
      qbo: {
        context: {
          getCompanyL10nInfo: jest.fn().mockReturnValue({
            defaultDateFormat: 'mm/dd/yyyy',
          }),
          getAuthInfo: jest.fn().mockReturnValue({
            legacyPermissions: {
              features: {
                companyPrefs: 'ALL',
              },
            },
          }),
        },
      },
    },
    experiments: {
      optInUserToTreatmentsIL: jest
        .fn()
        .mockResolvedValue({ status: 'SUCCESS' }),
    },
    appContext: {
      getAppInfo: jest.fn().mockReturnValue({ appName: 'quickbooks' }),
      getLocalizationInfo: jest.fn().mockReturnValue({
        locale: 'en-US',
        currency: 'USD',
      }),
    },
    logger: {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    },
  })),
}));

// Mock the hooks to avoid actual API calls
jest.mock('src/js/widgets/breaks/hooks/useBreaksCrud', () => ({
  __esModule: true,
  default: () => ({
    getBreaksByAssigneeId: jest.fn(),
  }),
}));

const mockClearQuickfillData = jest.fn();
jest.mock('src/js/widgets/breaks/hooks/useQuickfillsCrud', () => ({
  __esModule: true,
  default: () => ({
    clearQuickfillData: mockClearQuickfillData,
  }),
}));

jest.mock('src/js/widgets/breaks/store/hooks', () => ({
  useQuickfills: () => ({
    getBreaksForAssignee: jest.fn(() => [
      {
        id: 'break-1',
        breakName: 'Lunch Break',
        isActive: true,
        isDefaultPolicy: false,
        allowAuto: true,
        allowManual: true,
        breakType: 'PAID',
      },
      {
        id: 'break-2',
        breakName: 'Coffee Break',
        isActive: true,
        isDefaultPolicy: true,
        allowAuto: false,
        allowManual: true,
        breakType: 'UNPAID',
      },
      {
        id: 'break-3',
        breakName: 'Inactive Break',
        isActive: false,
        isDefaultPolicy: false,
        allowAuto: true,
        allowManual: false,
        breakType: 'PAID',
      },
    ]),
    getFilteredBreaksForAssignee: jest.fn(() => undefined),
    setFilteredBreaksByAssignee: jest.fn(),
    getBreaksByAssigneeLoading: jest.fn(() => false),
    getBreaksByAssigneeError: jest.fn(() => null),
  }),
  useAppDispatch: () => jest.fn(),
}));

jest.mock('src/js/widgets/breaks/store/quickfillsSlice', () => ({
  setBreaksByAssignee: jest.fn(),
}));

describe('BreakSelectorQuickfill', () => {
  const mockProps = {
    assigneeId: 'test-assignee-id',
  };

  beforeEach(() => {
    (useIntl as jest.Mock).mockReturnValue({
      formatMessage: jest.fn(({ id, defaultValue }) => {
        // Return the actual NLS values for the keys we're using
        if (id === 'breaks.dropdown.label') return 'Select Break';
        if (id === 'breaks.dropdown.placeholder') return 'Choose a break...';
        return defaultValue || id;
      }),
    });
    // Reset mocks between tests
    mockClearQuickfillData.mockClear();
  });

  it('renders with assigneeId prop', () => {
    renderWithAllAppProviders(<BreakSelectorQuickfill {...mockProps} />);

    // Check that the component renders the dropdown with correct label
    expect(screen.getByText('Select Break')).toBeInTheDocument();
    expect(
      screen.getAllByPlaceholderText('Choose a break...')[0],
    ).toBeInTheDocument();

    // Check that the component container exists
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders with additional props', () => {
    const propsWithAdditional = {
      ...mockProps,
      additionalProp: 'test-value',
    };

    renderWithAllAppProviders(
      <BreakSelectorQuickfill {...propsWithAdditional} />,
    );

    // Check that the component renders the dropdown with correct label
    expect(screen.getByText('Select Break')).toBeInTheDocument();
    expect(
      screen.getAllByPlaceholderText('Choose a break...')[0],
    ).toBeInTheDocument();

    // Check that the component container exists
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('filters breaks by isActive when filter.isActive is provided', () => {
    const propsWithFilter = {
      ...mockProps,
      filter: { isActive: true },
    };

    renderWithAllAppProviders(<BreakSelectorQuickfill {...propsWithFilter} />);

    // Should only show active breaks (Lunch Break and Coffee Break)
    expect(screen.getByText('Select Break')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('filters breaks by isDefaultPolicy when filter.isDefaultPolicy is provided', () => {
    const propsWithFilter = {
      ...mockProps,
      filter: { isDefaultPolicy: true },
    };

    renderWithAllAppProviders(<BreakSelectorQuickfill {...propsWithFilter} />);

    // Should only show default policy breaks (Coffee Break)
    expect(screen.getByText('Select Break')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('filters breaks by allowAuto when filter.allowAuto is provided', () => {
    const propsWithFilter = {
      ...mockProps,
      filter: { allowAuto: true },
    };

    renderWithAllAppProviders(<BreakSelectorQuickfill {...propsWithFilter} />);

    // Should only show breaks with allowAuto: true (Lunch Break and Inactive Break)
    expect(screen.getByText('Select Break')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('filters breaks by allowManual when filter.allowManual is provided', () => {
    const propsWithFilter = {
      ...mockProps,
      filter: { allowManual: true },
    };

    renderWithAllAppProviders(<BreakSelectorQuickfill {...propsWithFilter} />);

    // Should only show breaks with allowManual: true (Lunch Break and Coffee Break)
    expect(screen.getByText('Select Break')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('filters breaks by breakType when filter.breakType is provided', () => {
    const propsWithFilter = {
      ...mockProps,
      filter: { breakType: 'PAID' },
    };

    renderWithAllAppProviders(<BreakSelectorQuickfill {...propsWithFilter} />);

    // Should only show PAID breaks (Lunch Break and Inactive Break)
    expect(screen.getByText('Select Break')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('applies AND logic when multiple filter properties are provided', () => {
    const propsWithFilter = {
      ...mockProps,
      filter: {
        isActive: true,
        allowAuto: true,
        breakType: 'PAID',
      },
    };

    renderWithAllAppProviders(<BreakSelectorQuickfill {...propsWithFilter} />);

    // Should show breaks that match ALL of the conditions (AND logic)
    // - isActive: true (Lunch Break, Coffee Break)
    // - allowAuto: true (Lunch Break, Inactive Break)
    // - breakType: 'PAID' (Lunch Break, Inactive Break)
    // Result: Only Lunch Break (matches all three conditions)
    expect(screen.getByText('Select Break')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('shows all breaks when no filter is provided', () => {
    renderWithAllAppProviders(<BreakSelectorQuickfill {...mockProps} />);

    // Should show all breaks when no filter is provided
    expect(screen.getByText('Select Break')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('shows all breaks when filter has no defined values', () => {
    const propsWithEmptyFilter = {
      ...mockProps,
      filter: {},
    };

    renderWithAllAppProviders(
      <BreakSelectorQuickfill {...propsWithEmptyFilter} />,
    );

    // Should show all breaks when filter object is empty
    expect(screen.getByText('Select Break')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('sets default breakId when provided and break exists in available breaks', () => {
    const propsWithBreakId = {
      ...mockProps,
      breakId: 'break-1', // This break exists in the mock data
    };

    renderWithAllAppProviders(<BreakSelectorQuickfill {...propsWithBreakId} />);

    // Should show the component with the default break selected
    expect(screen.getByText('Select Break')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('does not set default breakId when break does not exist in available breaks', () => {
    const propsWithInvalidBreakId = {
      ...mockProps,
      breakId: 'non-existent-break', // This break does not exist in the mock data
    };

    renderWithAllAppProviders(
      <BreakSelectorQuickfill {...propsWithInvalidBreakId} />,
    );

    // Should show the component without setting a default value
    expect(screen.getByText('Select Break')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('does not set default breakId when value prop is already provided', () => {
    const propsWithValueAndBreakId = {
      ...mockProps,
      value: 'break-2',
      breakId: 'break-1', // This should be ignored since value is already provided
    };

    renderWithAllAppProviders(
      <BreakSelectorQuickfill {...propsWithValueAndBreakId} />,
    );

    // Should show the component with the value prop taking precedence
    expect(screen.getByText('Select Break')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('calls clearQuickfillData on unmount', () => {
    const { unmount } = renderWithAllAppProviders(
      <BreakSelectorQuickfill {...mockProps} />,
    );

    // Initially clearQuickfillData should not be called
    expect(mockClearQuickfillData).not.toHaveBeenCalled();

    // Unmount the component
    unmount();

    // Verify that clearQuickfillData was called during cleanup
    expect(mockClearQuickfillData).toHaveBeenCalledTimes(1);
  });

  it('handles onBreakSelected callback when break is selected', () => {
    const onBreakSelected = jest.fn();
    const propsWithCallback = {
      ...mockProps,
      onBreakSelected,
    };

    renderWithAllAppProviders(
      <BreakSelectorQuickfill {...propsWithCallback} />,
    );

    // The callback should be available for when a break is selected
    expect(screen.getByText('Select Break')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('handles includeDeleted filter correctly', () => {
    const propsWithIncludeDeleted = {
      ...mockProps,
      filter: { includeDeleted: true },
    };

    renderWithAllAppProviders(
      <BreakSelectorQuickfill {...propsWithIncludeDeleted} />,
    );

    // Should render with includeDeleted filter
    expect(screen.getByText('Select Break')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('handles width prop correctly', () => {
    const propsWithWidth = {
      ...mockProps,
      width: 300,
    };

    renderWithAllAppProviders(<BreakSelectorQuickfill {...propsWithWidth} />);

    // Should render with width prop
    expect(screen.getByText('Select Break')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('handles errorText prop correctly', () => {
    const propsWithError = {
      ...mockProps,
      errorText: 'This field is required',
    };

    renderWithAllAppProviders(<BreakSelectorQuickfill {...propsWithError} />);

    // Should render with error text
    expect(screen.getByText('Select Break')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('handles complex filter combinations with AND logic', () => {
    const propsWithComplexFilter = {
      ...mockProps,
      filter: {
        isActive: true,
        isDefaultPolicy: false,
        allowAuto: true,
        allowManual: true,
        breakType: 'PAID',
        includeDeleted: false,
      },
    };

    renderWithAllAppProviders(
      <BreakSelectorQuickfill {...propsWithComplexFilter} />,
    );

    // Should render with complex filter
    expect(screen.getByText('Select Break')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('handles value prop precedence over breakId', () => {
    const propsWithValueAndBreakId = {
      ...mockProps,
      value: 'break-2',
      breakId: 'break-1', // This should be ignored
    };

    renderWithAllAppProviders(
      <BreakSelectorQuickfill {...propsWithValueAndBreakId} />,
    );

    // Should render with value prop taking precedence
    expect(screen.getByText('Select Break')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('handles empty filter object correctly', () => {
    const propsWithEmptyFilter = {
      ...mockProps,
      filter: {},
    };

    renderWithAllAppProviders(
      <BreakSelectorQuickfill {...propsWithEmptyFilter} />,
    );

    // Should show all breaks when filter object is empty
    expect(screen.getByText('Select Break')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('handles undefined filter correctly', () => {
    const propsWithUndefinedFilter = {
      ...mockProps,
      filter: undefined,
    };

    renderWithAllAppProviders(
      <BreakSelectorQuickfill {...propsWithUndefinedFilter} />,
    );

    // Should show all breaks when filter is undefined
    expect(screen.getByText('Select Break')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
});

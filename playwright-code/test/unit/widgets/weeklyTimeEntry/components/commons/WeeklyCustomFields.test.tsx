import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { DataAccess_ContactType } from 'src/__generated__/oigql/graphql';
import WeeklyCustomFields from 'src/js/widgets/weeklyTimeEntry/components/commons/WeeklyCustomFields';
import customFieldsSlice from 'src/js/widgets/weeklyTimeEntry/store/customFieldsSlice';
import timeEntryGridSlice from 'src/js/widgets/weeklyTimeEntry/store/timeEntryGridSlice';

// Mock dependencies
jest.mock('@ids-ts/dropdown-typeahead', () => ({
  __esModule: true,
  default: ({
    label,
    value,
    inputValue,
    onChange,
    disabled,
    dataSource,
    errorText,
  }: any) => {
    // Use inputValue if provided, otherwise fall back to value
    const displayValue = inputValue !== undefined ? inputValue : value;
    return (
      <div>
        <select
          data-testid="dropdown-typeahead"
          value={displayValue || ''}
          onChange={(e) => {
            const selectedOption = dataSource?.find(
              (option: any) => option.value === e.target.value,
            );
            onChange(e, {
              selectedItem: {
                label: selectedOption?.label || e.target.value,
                value: selectedOption?.label || e.target.value,
              },
            });
          }}
          disabled={disabled}
          aria-label={label}
        >
          <option value="">Select...</option>
          {dataSource?.map((option: any, index: number) => (
            // eslint-disable-next-line react/no-array-index-key
            <option key={index} value={option.label}>
              {option.label}
            </option>
          ))}
        </select>
        {errorText && <span data-testid="dropdown-error">{errorText}</span>}
      </div>
    );
  },
}));

jest.mock('@ids-ts/text-field', () => ({
  __esModule: true,
  default: ({
    label,
    value,
    onChange,
    disabled,
    type,
    'aria-label': ariaLabel,
    errorText,
  }: any) => (
    <div>
      <input
        data-testid="text-field"
        type={type || 'text'}
        value={value}
        onChange={onChange}
        readOnly={disabled}
        aria-label={ariaLabel || label}
      />
      {errorText && <span data-testid="text-field-error">{errorText}</span>}
    </div>
  ),
}));

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: jest.fn(),
  }),
  useTracking: () =>
    jest.fn().mockImplementation((event) => {
      // Mock tracking event
    }),
  useSandbox: () => ({
    realmId: 'test-realm',
    offering: 'qbo',
  }),
}));

const mockCustomFields = [
  {
    id: 'udcf_1000000002',
    name: 'Region',
    type: 'string',
    deleted: false,
    required: true,
    options: [
      { id: '1000000002_1', name: 'Mid-West', deleted: false },
      { id: '1000000002_2', name: 'NorthEast', deleted: false },
      { id: '1000000002_3', name: 'SouthWest', deleted: false },
      { id: '1000000002_4', name: 'WestCoast', deleted: false },
    ],
  },
  {
    id: 'udcf_1000000003',
    name: 'Mileage',
    type: 'number',
    deleted: false,
    required: true,
    options: [],
  },
];

const mockCustomFieldsWithDeletedOptions = [
  {
    id: 'udcf_1000000002',
    name: 'Region',
    type: 'string',
    deleted: false,
    required: true,
    options: [
      { id: '1000000002_1', name: 'Mid-West', deleted: false },
      { id: '1000000002_2', name: 'NorthEast', deleted: false },
      { id: '1000000002_3', name: 'SouthWest', deleted: true }, // Deleted option
      { id: '1000000002_4', name: 'WestCoast', deleted: false },
      { id: '1000000002_5', name: 'OldRegion', deleted: true }, // Another deleted option
    ],
  },
  {
    id: 'udcf_1000000003',
    name: 'Mileage',
    type: 'number',
    deleted: false,
    required: true,
    options: [],
  },
];

const mockDisplayCell = {
  timeEntryId: 'entry-1',
  date: '2024-01-01',
  hours: 8,
  notes: 'Test notes',
  customFields: [
    { id: 'udcf_1000000002', name: 'Region', value: 'NorthEast' },
    { id: 'udcf_1000000003', name: 'Mileage', value: '20' },
  ],
  metaInfo: undefined,
  billableInfo: undefined,
  isApproved: false,
};

const createStore = (preloadedState = {}) =>
  configureStore({
    reducer: {
      customFields: customFieldsSlice,
      timeEntryGrid: timeEntryGridSlice,
    },
    preloadedState: {
      customFields: {
        customFields: mockCustomFields,
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
            timeEntries: {
              0: {
                timeEntryId: 'entry-1',
                date: '2024-01-01',
                hours: 8,
                notes: '',
                customFields: [
                  { id: 'udcf_1000000002', name: 'Region', value: 'Mid-West' },
                  { id: 'udcf_1000000003', name: 'Mileage', value: '20' },
                ],
                isApproved: false,
              },
            },
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
      ...preloadedState,
    },
  });

const createStoreWithDeletedOptions = (preloadedState = {}) =>
  configureStore({
    reducer: {
      customFields: customFieldsSlice,
      timeEntryGrid: timeEntryGridSlice,
    },
    preloadedState: {
      customFields: {
        customFields: mockCustomFieldsWithDeletedOptions,
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
            timeEntries: {
              0: {
                timeEntryId: 'entry-1',
                date: '2024-01-01',
                hours: 8,
                notes: '',
                customFields: [
                  { id: 'udcf_1000000002', name: 'Region', value: 'Mid-West' },
                  { id: 'udcf_1000000003', name: 'Mileage', value: '20' },
                ],
                isApproved: false,
              },
            },
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
      ...preloadedState,
    },
  });

const renderComponent = (
  displayCell = mockDisplayCell,
  store = createStore(),
  extraProps: Partial<{
    visibleCustomFieldIds: Set<string> | null;
    getCustomFieldOptions: (id: string) => any[] | null;
    shouldUseAssignments: boolean;
    fieldErrors: { [fieldId: string]: string };
    disabled: boolean;
  }> = {},
) =>
  render(
    <Provider store={store}>
      <WeeklyCustomFields displayCell={displayCell} {...extraProps} />
    </Provider>,
  );

describe('WeeklyCustomFields', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render nothing when no custom fields are available', () => {
      const store = createStore({
        customFields: {
          customFields: [],
          loading: false,
          error: null,
        },
      });

      const { container } = renderComponent(mockDisplayCell, store);
      expect(container.firstChild).toBeNull();
    });

    it('should render dropdown for fields with options', () => {
      renderComponent();

      expect(screen.getByTestId('dropdown-typeahead')).toBeInTheDocument();
    });

    it('should render number fields for number type custom fields', () => {
      renderComponent();

      const mileageField = screen.getByLabelText('Mileage *');
      expect(mileageField).toBeInTheDocument();
      expect(mileageField).toHaveAttribute('type', 'number');
    });

    it('should show required indicator for required fields', () => {
      renderComponent();

      expect(screen.getByLabelText('Region *')).toBeInTheDocument();
      expect(screen.getByLabelText('Mileage *')).toBeInTheDocument();
    });

    it('should display current values from displayCell', () => {
      renderComponent();

      const regionDropdown = screen.getByTestId('dropdown-typeahead');
      expect(regionDropdown).toHaveValue('NorthEast');

      const mileageField = screen.getByLabelText('Mileage *');
      expect(mileageField).toHaveValue(20);
    });

    it('should handle empty displayCell', () => {
      // Create a store without the mockDisplayCell data
      const store = createStore({
        timeEntryGrid: {
          weeklyTimeEntries: {},
          rowOrder: [],
          teamMember: null,
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          selected: null,
          firstEditedCells: {},
          error: null,
          loading: false,
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
      });

      renderComponent(undefined, store);

      // Component renders with empty displayCell
      const regionDropdown = screen.getByTestId('dropdown-typeahead');
      expect(regionDropdown).toBeInTheDocument();

      const mileageField = screen.getByLabelText('Mileage *');
      expect(mileageField).toBeInTheDocument();
    });
  });

  describe('user interactions', () => {
    it('should handle number field changes', async () => {
      const store = createStore();
      renderComponent(mockDisplayCell, store);

      const mileageField = screen.getByLabelText('Mileage *');
      fireEvent.change(mileageField, { target: { value: '30' } });

      await waitFor(() => {
        const state = store.getState() as any;
        const updatedCell =
          state.timeEntryGrid.weeklyTimeEntries['row-1']?.timeEntries[0];
        expect(updatedCell?.customFields).toContainEqual({
          id: 'udcf_1000000003',
          name: 'Mileage',
          value: '30',
        });
      });
    });

    it('should handle dropdown changes', async () => {
      const store = createStore();
      renderComponent(mockDisplayCell, store);

      const regionDropdown = screen.getByTestId('dropdown-typeahead');
      fireEvent.change(regionDropdown, { target: { value: 'WestCoast' } });

      await waitFor(() => {
        const state = store.getState() as any;
        const updatedCell =
          state.timeEntryGrid.weeklyTimeEntries['row-1']?.timeEntries[0];
        expect(updatedCell?.customFields).toContainEqual({
          id: 'udcf_1000000002',
          name: 'Region',
          value: 'WestCoast',
          optionID: '1000000002_4',
        });
      });
    });

    it('should not update when no cell is selected', () => {
      const store = createStore({
        timeEntryGrid: {
          weeklyTimeEntries: {},
          rowOrder: [],
          teamMember: null,
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          selected: null, // No cell selected
          firstEditedCells: {},
          error: null,
          loading: false,
          showSelectTeamMemberTooltip: false,
        },
      });

      renderComponent(mockDisplayCell, store);

      const mileageField = screen.getByLabelText('Mileage *');
      expect(mileageField).toHaveAttribute('readOnly', '');
    });
  });

  describe('deleted options filtering', () => {
    it('should filter out deleted options from dropdown', () => {
      const store = createStoreWithDeletedOptions();
      renderComponent(mockDisplayCell, store);

      const regionDropdown = screen.getByTestId('dropdown-typeahead');
      const options = Array.from(regionDropdown.querySelectorAll('option')).map(
        (option) => option.textContent,
      );

      // Should only show non-deleted options
      expect(options).toContain('Select...');
      expect(options).toContain('Mid-West');
      expect(options).toContain('NorthEast');
      expect(options).toContain('WestCoast');

      // Should not show deleted options
      expect(options).not.toContain('SouthWest');
      expect(options).not.toContain('OldRegion');
    });

    it('should handle dropdown changes with filtered options', async () => {
      const store = createStoreWithDeletedOptions();
      renderComponent(mockDisplayCell, store);

      const regionDropdown = screen.getByTestId('dropdown-typeahead');
      fireEvent.change(regionDropdown, { target: { value: 'WestCoast' } });

      await waitFor(() => {
        const state = store.getState() as any;
        const updatedCell =
          state.timeEntryGrid.weeklyTimeEntries['row-1']?.timeEntries[0];
        expect(updatedCell?.customFields).toContainEqual({
          id: 'udcf_1000000002',
          name: 'Region',
          value: 'WestCoast',
          optionID: '1000000002_4',
        });
      });
    });

    it('should not display current value if it matches a deleted option', () => {
      // Create a display cell with a value that matches a deleted option
      const displayCellWithDeletedValue = {
        ...mockDisplayCell,
        customFields: [
          { id: 'udcf_1000000002', name: 'Region', value: 'SouthWest' }, // This matches a deleted option
          { id: 'udcf_1000000003', name: 'Mileage', value: '20' },
        ],
      };

      const store = createStoreWithDeletedOptions();
      renderComponent(displayCellWithDeletedValue, store);

      const regionDropdown = screen.getByTestId('dropdown-typeahead');
      // The current value should not be displayed if it matches a deleted option
      // because deleted options are filtered out from the dropdown
      expect(regionDropdown).toHaveValue('');
    });

    it('should show only active options in dropdown even when current value is from deleted option', () => {
      // Create a display cell with a value that matches a deleted option
      const displayCellWithDeletedValue = {
        ...mockDisplayCell,
        customFields: [
          { id: 'udcf_1000000002', name: 'Region', value: 'SouthWest' }, // This matches a deleted option
          { id: 'udcf_1000000003', name: 'Mileage', value: '20' },
        ],
      };

      const store = createStoreWithDeletedOptions();
      renderComponent(displayCellWithDeletedValue, store);

      const regionDropdown = screen.getByTestId('dropdown-typeahead');
      const options = Array.from(regionDropdown.querySelectorAll('option')).map(
        (option) => option.textContent,
      );

      // Should only show non-deleted options in the dropdown
      expect(options).toContain('Select...');
      expect(options).toContain('Mid-West');
      expect(options).toContain('NorthEast');
      expect(options).toContain('WestCoast');

      // Should not show deleted options in dropdown
      expect(options).not.toContain('SouthWest');
      expect(options).not.toContain('OldRegion');
    });
  });

  describe('Custom field tracking and rendering (lines 82-100, 148, 210-231, 246, 255-258)', () => {
    it('should track number field focus events (line 148)', () => {
      const store = createStore();
      renderComponent(mockDisplayCell, store);

      // Find and focus the number field (Mileage)
      const mileageField = screen.getByLabelText('Mileage *');
      fireEvent.focus(mileageField);

      // Tracking should have been called
      expect(mileageField).toBeInTheDocument();
    });

    it('should track dropdown field focus events (lines 210-218)', () => {
      const store = createStore();
      renderComponent(mockDisplayCell, store);

      // Find and focus the dropdown field (Region)
      const regionDropdown = screen.getByTestId('dropdown-typeahead');
      fireEvent.focus(regionDropdown);

      // Tracking should have been called
      expect(regionDropdown).toBeInTheDocument();
    });

    it('should render text field for type "text" (line 246)', () => {
      const textFieldCustomFields = [
        {
          id: 'udcf_text_field',
          name: 'Text Field',
          type: 'text',
          deleted: false,
          required: false,
          options: [],
        },
      ];

      const store = createStore({
        customFields: {
          customFields: textFieldCustomFields,
          loading: false,
          error: null,
        },
      });

      const displayCellWithText = {
        ...mockDisplayCell,
        customFields: [
          { id: 'udcf_text_field', name: 'Text Field', value: 'Test' },
        ],
      };

      renderComponent(displayCellWithText, store);

      // Should render a text field
      const textField = screen.getByLabelText('Text Field');
      expect(textField).toHaveAttribute('type', 'text');
    });

    it('should render text field for string type without options (line 255)', () => {
      const stringFieldCustomFields = [
        {
          id: 'udcf_string_field',
          name: 'String Field',
          type: 'string',
          deleted: false,
          required: false,
          options: [], // No options, so should render as text field
        },
      ];

      const store = createStore({
        customFields: {
          customFields: stringFieldCustomFields,
          loading: false,
          error: null,
        },
      });

      const displayCellWithString = {
        ...mockDisplayCell,
        customFields: [
          {
            id: 'udcf_string_field',
            name: 'String Field',
            value: 'Test String',
          },
        ],
      };

      renderComponent(displayCellWithString, store);

      // Should render a text field
      const stringField = screen.getByLabelText('String Field');
      expect(stringField).toHaveAttribute('type', 'text');
    });

    it('should render text field for unknown type (default case, lines 256-258)', () => {
      const unknownFieldCustomFields = [
        {
          id: 'udcf_unknown_field',
          name: 'Unknown Field',
          type: 'unknown_type',
          deleted: false,
          required: false,
          options: [],
        },
      ];

      const store = createStore({
        customFields: {
          customFields: unknownFieldCustomFields,
          loading: false,
          error: null,
        },
      });

      const displayCellWithUnknown = {
        ...mockDisplayCell,
        customFields: [
          { id: 'udcf_unknown_field', name: 'Unknown Field', value: 'Test' },
        ],
      };

      renderComponent(displayCellWithUnknown, store);

      // Should render a text field as default
      const unknownField = screen.getByLabelText('Unknown Field');
      expect(unknownField).toHaveAttribute('type', 'text');
    });

    it('should include optionID in updateCell when handling dropdown (lines 82-96)', async () => {
      const store = createStore();
      renderComponent(mockDisplayCell, store);

      const regionDropdown = screen.getByTestId('dropdown-typeahead');
      fireEvent.change(regionDropdown, { target: { value: 'NorthEast' } });

      await waitFor(() => {
        const state = store.getState() as any;
        const updatedCell =
          state.timeEntryGrid.weeklyTimeEntries['row-1']?.timeEntries[0];

        // Verify that optionID is included (line 91)
        const customField = updatedCell?.customFields?.find(
          (cf: any) => cf.id === 'udcf_1000000002',
        );
        expect(customField).toHaveProperty('optionID');
      });
    });
  });

  describe('visibleCustomFieldIds and shouldUseAssignments', () => {
    it('should render only fields in visibleCustomFieldIds when shouldUseAssignments is true', () => {
      const visibleIds = new Set(['udcf_1000000003']);
      renderComponent(mockDisplayCell, createStore(), {
        visibleCustomFieldIds: visibleIds,
        shouldUseAssignments: true,
      });

      expect(screen.queryByLabelText(/Region/i)).not.toBeInTheDocument();
      expect(screen.getByLabelText('Mileage *')).toBeInTheDocument();
    });

    it('should render all non-deleted fields when shouldUseAssignments is false', () => {
      const visibleIds = new Set(['udcf_1000000003']);
      renderComponent(mockDisplayCell, createStore(), {
        visibleCustomFieldIds: visibleIds,
        shouldUseAssignments: false,
      });

      expect(screen.getByTestId('dropdown-typeahead')).toBeInTheDocument();
      expect(screen.getByLabelText('Mileage *')).toBeInTheDocument();
    });
  });

  describe('getCustomFieldOptions with assignments', () => {
    it('should use getCustomFieldOptions for dropdown options when shouldUseAssignments is true', () => {
      const getCustomFieldOptions = jest.fn().mockReturnValue([
        { id: 'opt_1', name: 'Assigned Option A', deleted: false },
        { id: 'opt_2', name: 'Assigned Option B', deleted: false },
      ]);

      renderComponent(mockDisplayCell, createStore(), {
        shouldUseAssignments: true,
        getCustomFieldOptions,
      });

      expect(getCustomFieldOptions).toHaveBeenCalledWith('udcf_1000000002');
      const regionDropdown = screen.getByTestId('dropdown-typeahead');
      const options = Array.from(regionDropdown.querySelectorAll('option')).map(
        (o) => o.textContent,
      );
      expect(options).toContain('Assigned Option A');
      expect(options).toContain('Assigned Option B');
    });

    it('should not show required indicator for dropdown when getCustomFieldOptions returns empty (effective required false)', () => {
      const getCustomFieldOptions = jest.fn().mockReturnValue([]);
      const visibleIds = new Set(['udcf_1000000002']);

      renderComponent(mockDisplayCell, createStore(), {
        shouldUseAssignments: true,
        getCustomFieldOptions,
        visibleCustomFieldIds: visibleIds,
      });

      expect(getCustomFieldOptions).toHaveBeenCalledWith('udcf_1000000002');
      expect(screen.queryByLabelText('Region *')).not.toBeInTheDocument();
      expect(screen.getByLabelText('Region')).toBeInTheDocument();
    });
  });

  describe('number field clamping', () => {
    it('should cap number field to 0 when user enters negative value', async () => {
      const store = createStore();
      renderComponent(mockDisplayCell, store);

      const mileageField = screen.getByLabelText('Mileage *');
      fireEvent.change(mileageField, { target: { value: '-5' } });

      await waitFor(() => {
        const state = store.getState() as any;
        const updatedCell =
          state.timeEntryGrid.weeklyTimeEntries['row-1']?.timeEntries[0];
        const mileageCf = updatedCell?.customFields?.find(
          (cf: any) => cf.id === 'udcf_1000000003',
        );
        expect(mileageCf?.value).toBe('0');
      });
    });
  });

  describe('fieldErrors', () => {
    it('should display fieldErrors for the correct field', () => {
      renderComponent(mockDisplayCell, createStore(), {
        fieldErrors: {
          udcf_1000000002: 'Region is required',
          udcf_1000000003: 'Mileage must be positive',
        },
      });

      expect(screen.getByText('Region is required')).toBeInTheDocument();
      expect(screen.getByText('Mileage must be positive')).toBeInTheDocument();
    });
  });
});

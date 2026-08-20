import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { buildSandbox } from '@payroll/quicksand';
import BreakAutoSection from 'src/js/widgets/breaks/features/breaks-settings/components/BreakAutoSection';
import breakPolicyFormReducer from 'src/js/widgets/breaks/store/breakPolicyFormSlice';
import { BREAK_LOCATIONS } from 'src/js/widgets/breaks/constants';
import {
  Payroll_DurationUnit,
  Payroll_Break,
  Common_DayOfWeek,
} from 'src/__generated__/oigql/graphql';

// Mock the sandbox
const mockSandbox = buildSandbox({});

// Mock the quicksand hooks
jest.mock('@payroll/quicksand', () => ({
  ...jest.requireActual('@payroll/quicksand'),
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => id,
  }),
  useSandbox: () => mockSandbox,
}));

// Mock the dropdown typeahead component
jest.mock('@ids-ts/dropdown-typeahead', () => {
  const MockDropdownTypeahead = ({
    label,
    value,
    onChange,
    onSearch,
    dataSource,
    renderItem,
  }: any) => (
    <div data-testid="time-dropdown">
      <label>{label}</label>
      <input
        data-testid="time-input"
        value={value}
        onChange={(e) => onChange({ target: e.target })}
        onKeyDown={(e) => onSearch && onSearch(e)}
      />
      <div data-testid="dropdown-options">
        {dataSource?.map((option: any, index: number) =>
          renderItem(option, index),
        )}
      </div>
    </div>
  );
  return {
    __esModule: true,
    default: MockDropdownTypeahead,
    MenuItem: ({ children, value }: any) => (
      <div data-testid={`option-${value}`}>{children}</div>
    ),
  };
});

const createTestStore = (initialState = {}) =>
  configureStore({
    reducer: {
      breakPolicyForm: breakPolicyFormReducer,
    },
    preloadedState: {
      breakPolicyForm: {
        formData: {
          breakName: '',
          breakDuration: 15,
          durationUnit: Payroll_DurationUnit.Minutes,
          noSetDuration: false,
          breakType: Payroll_Break.Paid,
          allowAuto: false,
          allowManual: false,
          isActive: true,
          isDefaultPolicy: true,
          shiftReach: '',
          repeat: '',
          breakLocation: BREAK_LOCATIONS.MIDDLE,
          teamMembers: 'all',
          frequency: '04:00',
          repeatEvery: false,
          daysOfWeek: [
            Common_DayOfWeek.Monday,
            Common_DayOfWeek.Tuesday,
            Common_DayOfWeek.Wednesday,
            Common_DayOfWeek.Thursday,
            Common_DayOfWeek.Friday,
          ],
          specificTime: '09:00', // Default from Redux state
          autoEndBreak: false,
          cantEndEarly: false,
          notify: false,
          notifyDuration: 5,
          isDirty: false,
          isValid: false,
          validationErrors: {},
          hasValidationErrors: false,
          autoRule: undefined,
          manualRule: undefined,
        },
        isOpen: false,
        isEditing: false,
        editingId: null,
        loading: false,
        error: null,
        showAssignTeamMembers: false,
        tempAssignments: [],
      },
      ...initialState,
    },
  });

const renderWithProviders = (
  component: React.ReactElement,
  initialState = {},
) => {
  const store = createTestStore(initialState);
  return render(<Provider store={store}>{component}</Provider>);
};

describe('BreakAutoSection', () => {
  const defaultProps = {
    allowAuto: true,
    frequency: '04:00',
    repeatEvery: false,
    daysOfWeek: [
      Common_DayOfWeek.Monday,
      Common_DayOfWeek.Tuesday,
      Common_DayOfWeek.Wednesday,
      Common_DayOfWeek.Thursday,
      Common_DayOfWeek.Friday,
    ],
    breakLocation: BREAK_LOCATIONS.MIDDLE,
    specificTime: '',
    noSetDuration: false,
  };

  describe('Auto Break Checkbox', () => {
    it('should render auto break checkbox', () => {
      renderWithProviders(<BreakAutoSection {...defaultProps} />);

      expect(screen.getByTestId('break-auto-checkbox')).toBeInTheDocument();
    });

    it('should be checked when allowAuto is true', () => {
      renderWithProviders(<BreakAutoSection {...defaultProps} />);

      const checkbox = screen.getByTestId(
        'break-auto-checkbox',
      ) as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });

    it('should be unchecked when allowAuto is false', () => {
      const props = {
        ...defaultProps,
        allowAuto: false,
      };

      renderWithProviders(<BreakAutoSection {...props} />);

      const checkbox = screen.getByTestId(
        'break-auto-checkbox',
      ) as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
    });
  });

  describe('Break Options Container', () => {
    it('should show break options when auto is enabled', () => {
      renderWithProviders(<BreakAutoSection {...defaultProps} />);

      // Should show frequency input
      expect(screen.getByTestId('break-frequency-input')).toBeInTheDocument();

      // Should show repeat every checkbox
      expect(
        screen.getByTestId('break-repeat-every-checkbox'),
      ).toBeInTheDocument();

      // Should show days of week dropdown
      expect(
        screen.getByText('breaks.create.auto.daysOfWeek.label'),
      ).toBeInTheDocument();

      // Should show break location dropdown
      expect(
        screen.getByText('breaks.create.auto.location.label'),
      ).toBeInTheDocument();
    });

    it('should not show break options when auto is disabled', () => {
      const props = {
        ...defaultProps,
        allowAuto: false,
      };

      renderWithProviders(<BreakAutoSection {...props} />);

      // Should not show frequency input
      expect(
        screen.queryByTestId('break-frequency-input'),
      ).not.toBeInTheDocument();

      // Should not show repeat every checkbox
      expect(
        screen.queryByTestId('break-repeat-every-checkbox'),
      ).not.toBeInTheDocument();
    });
  });
});

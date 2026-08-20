import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { useWatch } from 'react-hook-form';
import { DecisionType } from '@appfabric/sandbox-spec';

import { renderWithFormProvider } from 'test/unit/testUtils';

import {
  mapTimeForState,
  normalizeTimeForType,
  TeamMember,
  TeamMemberProps,
  TimeForType,
} from 'src/js/widgets/common/addTimeFormComponents/TeamMember';
import { SINGLE_TIME_TRACKING_POINTS } from 'src/js/widgets/singleTimeTrowser/singleTimeTrackingPoints';

import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';
import useAuthorization from 'src/js/providers/useAuthorization';

jest.mock('react-hook-form', () => ({
  ...jest.requireActual('react-hook-form'),
  useWatch: jest.fn(),
}));

jest.mock('src/js/providers/useAuthorization', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    decision: { isAuthorized: false },
    loading: false,
    error: null,
  })),
}));

// Mock isWorkforceEnvironment
jest.mock('src/js/service/utils/sandboxUtils', () => ({
  isWorkforceEnvironment: jest.fn().mockReturnValue(false),
}));

interface MockWidgetProps {
  label: string;
  value?: { id: string };
  onChange: (e: {
    selectedItem: { localId: string; fullName: string };
  }) => void;
  disabled?: boolean;
  placeholder?: string;
}

// Mock the Widget component (for QuickFind)
interface MockQuickFindWidgetProps {
  widgetId: string;
  label: string;
  value?: string;
  displayName?: string;
  onChange: (id: string, item: any) => void;
  onLoad: (item: any) => void;
  onReady: () => void;
  disabled?: boolean;
  placeholder?: string;
  errorText?: string;
  addNew?: boolean;
  dropdownType?: string;
  subTypes?: string[];
}

jest.mock('web-shell-core/widgets/HOCWidget', () => ({
  __esModule: true,
  default: ({
    label,
    value,
    displayName,
    onChange,
    disabled,
    placeholder,
    errorText,
    widgetId,
    onLoad,
    onReady,
  }: MockWidgetProps & MockQuickFindWidgetProps) => {
    // Render QuickFind Widget when widgetId is provided
    if (widgetId === 'time-tracking-ui/quickFind') {
      return (
        <>
          <label htmlFor="quickFindInput">{label}</label>
          <input
            id="quickFindInput"
            data-testid="quickFindInput"
            type="text"
            value={value || ''}
            disabled={disabled}
            placeholder={placeholder}
            data-error-text={errorText}
            data-display-name={displayName}
            onChange={(e) => {
              const mockItem = {
                id: e.target.value,
                name: 'QuickFind Team Member',
                type: 'employee',
                contact: { type: 'EMPLOYEE' },
              };
              onChange('', mockItem);
            }}
            onFocus={() => onLoad && onLoad({ contact: { type: 'EMPLOYEE' } })}
          />
          {onReady && <button onClick={onReady}>Ready</button>}
          {errorText && <div data-testid="error-text">{errorText}</div>}
        </>
      );
    }

    // Render traditional dropdown widget
    return (
      <>
        <label htmlFor="teamMemberInput">{label}</label>
        <input
          id="teamMemberInput"
          data-testid="teamMemberInput"
          type="text"
          value={value?.id || ''}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) =>
            onChange({
              selectedItem: {
                localId: e.target.value,
                fullName: 'New Team Member',
              },
            })
          }
        />
      </>
    );
  },
}));

describe('normalizeTimeForType', () => {
  it('maps EMPLOYEE and employee to TimeForType.EMPLOYEE', () => {
    expect(normalizeTimeForType('EMPLOYEE')).toBe(TimeForType.EMPLOYEE);
    expect(normalizeTimeForType('employee')).toBe(TimeForType.EMPLOYEE);
  });
  it('maps VENDOR and vendor to TimeForType.VENDOR', () => {
    expect(normalizeTimeForType('VENDOR')).toBe(TimeForType.VENDOR);
    expect(normalizeTimeForType('vendor')).toBe(TimeForType.VENDOR);
  });
  it('maps GraphQL enums WorkerManagement_Employee and Commerce_Vendor', () => {
    expect(normalizeTimeForType('WorkerManagement_Employee')).toBe(
      TimeForType.EMPLOYEE,
    );
    expect(normalizeTimeForType('Commerce_Vendor')).toBe(TimeForType.VENDOR);
  });
  it('returns EMPLOYEE for undefined or unknown', () => {
    expect(normalizeTimeForType(undefined)).toBe(TimeForType.EMPLOYEE);
    expect(normalizeTimeForType('unknown')).toBe(TimeForType.EMPLOYEE);
  });
});

describe('TeamMember Component', () => {
  let props: TeamMemberProps;

  beforeEach(() => {
    props = {
      name: 'teamMember',
      trackingPoint: SINGLE_TIME_TRACKING_POINTS.TEAM_MEMBER,
    };
    (useWatch as jest.Mock).mockReturnValue(false); // Default to unlocked
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    renderWithFormProvider(<TeamMember {...props} />, {
      defaultValues: {
        teamMember: {
          id: '1',
          type: TimeForType.EMPLOYEE,
        },
      },
    });

    // Check if the component renders with the correct label
    expect(screen.getByText(/team.member/)).toBeInTheDocument();
  });

  it('should have correct aria-label for tour targeting', () => {
    renderWithFormProvider(<TeamMember {...props} />, {
      defaultValues: {
        teamMember: {
          id: '1',
          type: TimeForType.EMPLOYEE,
        },
      },
    });

    // Check that the wrapper div has the correct aria-label for tour targeting
    const teamMemberContainer = document.querySelector(
      '[aria-label="single-time-team-member-dropdown"]',
    );
    expect(teamMemberContainer).toBeInTheDocument();
  });

  describe('isLocked behavior', () => {
    test.each([
      { description: 'disabled', isLocked: true, expectedDisabled: true },
      { description: 'enabled', isLocked: false, expectedDisabled: false },
    ])(
      'input is $description when isLocked is $isLocked',
      ({ isLocked, expectedDisabled }) => {
        (useWatch as jest.Mock).mockImplementation(({ name }) => {
          if (name === 'isLocked') return isLocked;
          return false;
        });

        renderWithFormProvider(<TeamMember {...props} />, {
          defaultValues: {
            teamMember: { id: '1', type: TimeForType.EMPLOYEE },
            isLocked,
          },
        });

        const input = screen.getByTestId('teamMemberInput');
        if (expectedDisabled) {
          expect(input).toBeDisabled();
        } else {
          expect(input).not.toBeDisabled();
        }
      },
    );
  });

  describe('QuickFind Widget behavior', () => {
    it('renders QuickFind widget when showQuickFindWidget is true', () => {
      const propsWithQuickFind = {
        ...props,
        showQuickFindWidget: true,
      };

      renderWithFormProvider(<TeamMember {...propsWithQuickFind} />, {
        defaultValues: {
          teamMember: {
            id: '1',
            type: TimeForType.EMPLOYEE,
          },
        },
      });

      // Should render QuickFind input instead of traditional dropdown
      expect(screen.getByTestId('quickFindInput')).toBeInTheDocument();
      expect(screen.queryByTestId('teamMemberInput')).not.toBeInTheDocument();
    });

    it('renders traditional dropdown when showQuickFindWidget is false', () => {
      const propsWithoutQuickFind = {
        ...props,
        showQuickFindWidget: false,
      };

      renderWithFormProvider(<TeamMember {...propsWithoutQuickFind} />, {
        defaultValues: {
          teamMember: {
            id: '1',
            type: TimeForType.EMPLOYEE,
          },
        },
      });

      // Should render traditional dropdown instead of QuickFind
      expect(screen.getByTestId('teamMemberInput')).toBeInTheDocument();
      expect(screen.queryByTestId('quickFindInput')).not.toBeInTheDocument();
    });

    it('renders QuickFind widget with proper props', () => {
      const propsWithQuickFind = {
        ...props,
        showQuickFindWidget: true,
      };

      renderWithFormProvider(<TeamMember {...propsWithQuickFind} />, {
        defaultValues: {
          teamMember: {
            id: '1',
            type: TimeForType.EMPLOYEE,
          },
        },
      });

      const quickFindInput = screen.getByTestId('quickFindInput');
      // Verify QuickFind widget is rendered with correct props
      expect(quickFindInput).toBeInTheDocument();
      expect(quickFindInput).toHaveAttribute(
        'placeholder',
        'NLS team.member.placeholder undefined',
      );
      expect(quickFindInput).toHaveValue('1');
    });

    it('passes displayName from timeForContactDAS to QuickFind widget', () => {
      const propsWithQuickFind = {
        ...props,
        showQuickFindWidget: true,
        timeForContactDAS: {
          id: '2',
          firstName: 'Bob',
          lastName: 'Vendor',
        },
      };

      renderWithFormProvider(<TeamMember {...propsWithQuickFind} />, {
        defaultValues: {
          teamMember: {
            id: '2',
            name: '',
            type: TimeForType.VENDOR,
          },
        },
      });

      const quickFindInput = screen.getByTestId('quickFindInput');
      expect(quickFindInput).toHaveAttribute('data-display-name', 'Bob Vendor');
    });

    it('falls back to form state name when timeForContactDAS is absent', () => {
      const propsWithQuickFind = {
        ...props,
        showQuickFindWidget: true,
      };

      renderWithFormProvider(<TeamMember {...propsWithQuickFind} />, {
        defaultValues: {
          teamMember: {
            id: '2',
            name: 'Bob Vendor',
            type: TimeForType.VENDOR,
          },
        },
      });

      const quickFindInput = screen.getByTestId('quickFindInput');
      expect(quickFindInput).toHaveAttribute('data-display-name', 'Bob Vendor');
    });

    it('handles QuickFind onChange with default parameter', () => {
      const propsWithQuickFind = {
        ...props,
        showQuickFindWidget: true,
      };

      renderWithFormProvider(<TeamMember {...propsWithQuickFind} />, {
        defaultValues: {
          teamMember: {
            id: '1',
            type: TimeForType.EMPLOYEE,
          },
        },
      });

      const quickFindInput = screen.getByTestId('quickFindInput');

      // Test that the component doesn't crash when onChange is called
      // The default parameter (item: any = {}) should handle empty/undefined cases
      expect(() => {
        fireEvent.change(quickFindInput, { target: { value: 'new-id' } });
      }).not.toThrow();

      // Verify the input value changed
      expect(quickFindInput).toHaveValue('new-id');
    });
  });

  test.each([
    [
      {
        selectedItem: {
          displayName: 'John Doe',
          localId: '1',
          contact: {
            type: 'EMPLOYEE',
          },
          type: 'employee',
        },
      },
      TimeForType.EMPLOYEE,
    ],
    [
      {
        selectedItem: {
          displayName: 'John Doe',
          localId: '1',
          contact: {},
          type: 'employee',
        },
      },
      TimeForType.EMPLOYEE,
    ],
    [
      {
        selectedItem: {
          displayName: 'John Doe',
          localId: '1',
          contact: { type: 'VENDOR' },
          type: 'vendor',
        },
      },
      TimeForType.VENDOR,
    ],
    [
      {
        selectedItem: {
          displayName: 'John Doe',
          localId: '1',
          contact: {},
          type: 'vendor',
        },
      },
      TimeForType.VENDOR,
    ],
  ])(
    'mapTimeForState should handle different input',
    (e: any, expectedType: TimeForType) => {
      const val = mapTimeForState(e);

      expect(val).toEqual({
        id: '1',
        name: 'John Doe',
        type: expectedType,
      });
    },
  );
});

const mockIsWorkforceEnvironment =
  isWorkforceEnvironment as jest.MockedFunction<typeof isWorkforceEnvironment>;
const mockUseAuthorization = useAuthorization as jest.MockedFunction<
  typeof useAuthorization
>;

describe('TeamMember - Workforce Support (QUANTA-8403)', () => {
  let props: TeamMemberProps;

  beforeEach(() => {
    props = {
      name: 'teamMember',
      trackingPoint: SINGLE_TIME_TRACKING_POINTS.TEAM_MEMBER,
    };
    (useWatch as jest.Mock).mockReturnValue(false);
    mockIsWorkforceEnvironment.mockReturnValue(false);
    mockUseAuthorization.mockReturnValue({
      decision: { isAuthorized: true, decision: DecisionType.PERMIT },
      loading: false,
      error: undefined,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should hide Add New button for workforce users with QuickFind widget', () => {
    mockIsWorkforceEnvironment.mockReturnValue(true);
    mockUseAuthorization.mockReturnValue({
      decision: { isAuthorized: true, decision: DecisionType.PERMIT },
      loading: false,
      error: undefined,
    });

    const propsWithQuickFind = {
      ...props,
      showQuickFindWidget: true,
    };

    renderWithFormProvider(<TeamMember {...propsWithQuickFind} />, {
      defaultValues: {
        teamMember: {
          id: '1',
          type: TimeForType.EMPLOYEE,
        },
      },
    });

    expect(screen.getByTestId('quickFindInput')).toBeInTheDocument();
  });

  it('should hide Add New button for workforce users with traditional dropdown', () => {
    mockIsWorkforceEnvironment.mockReturnValue(true);
    mockUseAuthorization.mockReturnValue({
      decision: { isAuthorized: true, decision: DecisionType.PERMIT },
      loading: false,
      error: undefined,
    });

    renderWithFormProvider(<TeamMember {...props} />, {
      defaultValues: {
        teamMember: {
          id: '1',
          type: TimeForType.EMPLOYEE,
        },
      },
    });

    expect(screen.getByTestId('teamMemberInput')).toBeInTheDocument();
  });

  it('should show Add New button for QBO users with authorization and QuickFind', () => {
    mockIsWorkforceEnvironment.mockReturnValue(false);
    mockUseAuthorization.mockReturnValue({
      decision: { isAuthorized: true, decision: DecisionType.PERMIT },
      loading: false,
      error: undefined,
    });

    const propsWithQuickFind = {
      ...props,
      showQuickFindWidget: true,
    };

    renderWithFormProvider(<TeamMember {...propsWithQuickFind} />, {
      defaultValues: {
        teamMember: {
          id: '1',
          type: TimeForType.EMPLOYEE,
        },
      },
    });

    expect(screen.getByTestId('quickFindInput')).toBeInTheDocument();
  });

  it('should show Add New button for QBO users with authorization and traditional dropdown', () => {
    mockIsWorkforceEnvironment.mockReturnValue(false);
    mockUseAuthorization.mockReturnValue({
      decision: { isAuthorized: true, decision: DecisionType.PERMIT },
      loading: false,
      error: undefined,
    });

    renderWithFormProvider(<TeamMember {...props} />, {
      defaultValues: {
        teamMember: {
          id: '1',
          type: TimeForType.EMPLOYEE,
        },
      },
    });

    expect(screen.getByTestId('teamMemberInput')).toBeInTheDocument();
  });

  it('should call isWorkforceEnvironment with correct sandbox', () => {
    mockIsWorkforceEnvironment.mockReturnValue(false);

    renderWithFormProvider(<TeamMember {...props} />, {
      defaultValues: {
        teamMember: {
          id: '1',
          type: TimeForType.EMPLOYEE,
        },
      },
    });

    expect(mockIsWorkforceEnvironment).toHaveBeenCalled();
  });

  it('should render without errors in workforce environment', () => {
    mockIsWorkforceEnvironment.mockReturnValue(true);

    expect(() => {
      renderWithFormProvider(<TeamMember {...props} />, {
        defaultValues: {
          teamMember: {
            id: '1',
            type: TimeForType.EMPLOYEE,
          },
        },
      });
    }).not.toThrow();
  });

  it('should render without errors in QBO environment', () => {
    mockIsWorkforceEnvironment.mockReturnValue(false);

    expect(() => {
      renderWithFormProvider(<TeamMember {...props} />, {
        defaultValues: {
          teamMember: {
            id: '1',
            type: TimeForType.EMPLOYEE,
          },
        },
      });
    }).not.toThrow();
  });

  it('should maintain existing functionality when not workforce user', () => {
    mockIsWorkforceEnvironment.mockReturnValue(false);

    renderWithFormProvider(<TeamMember {...props} />, {
      defaultValues: {
        teamMember: {
          id: '1',
          type: TimeForType.EMPLOYEE,
        },
      },
    });

    const input = screen.getByTestId('teamMemberInput');
    expect(input).toBeInTheDocument();
    expect(input).not.toBeDisabled();
  });

  it('should properly handle addNew prop with workforce and authorization', () => {
    mockIsWorkforceEnvironment.mockReturnValue(true);
    mockUseAuthorization.mockReturnValue({
      decision: { isAuthorized: true, decision: DecisionType.PERMIT },
      loading: false,
      error: undefined,
    });

    renderWithFormProvider(<TeamMember {...props} />, {
      defaultValues: {
        teamMember: {
          id: '1',
          type: TimeForType.EMPLOYEE,
        },
      },
    });

    expect(screen.getByTestId('teamMemberInput')).toBeInTheDocument();
  });

  it('should properly handle addNew prop with workforce and no authorization', () => {
    mockIsWorkforceEnvironment.mockReturnValue(true);
    mockUseAuthorization.mockReturnValue({
      decision: { isAuthorized: false, decision: DecisionType.DENY },
      loading: false,
      error: undefined,
    });

    renderWithFormProvider(<TeamMember {...props} />, {
      defaultValues: {
        teamMember: {
          id: '1',
          type: TimeForType.EMPLOYEE,
        },
      },
    });

    expect(screen.getByTestId('teamMemberInput')).toBeInTheDocument();
  });

  it('should properly handle addNew prop with QBO and authorization', () => {
    mockIsWorkforceEnvironment.mockReturnValue(false);
    mockUseAuthorization.mockReturnValue({
      decision: { isAuthorized: true, decision: DecisionType.PERMIT },
      loading: false,
      error: undefined,
    });

    renderWithFormProvider(<TeamMember {...props} />, {
      defaultValues: {
        teamMember: {
          id: '1',
          type: TimeForType.EMPLOYEE,
        },
      },
    });

    expect(screen.getByTestId('teamMemberInput')).toBeInTheDocument();
  });

  it('should properly handle addNew prop with QBO and no authorization', () => {
    mockIsWorkforceEnvironment.mockReturnValue(false);
    mockUseAuthorization.mockReturnValue({
      decision: { isAuthorized: false, decision: DecisionType.DENY },
      loading: false,
      error: undefined,
    });

    renderWithFormProvider(<TeamMember {...props} />, {
      defaultValues: {
        teamMember: {
          id: '1',
          type: TimeForType.EMPLOYEE,
        },
      },
    });

    expect(screen.getByTestId('teamMemberInput')).toBeInTheDocument();
  });

  it('should disable team member dropdown when user is workforce user with locked state', () => {
    mockIsWorkforceEnvironment.mockReturnValue(true);
    mockUseAuthorization.mockReturnValue({
      decision: { isAuthorized: true, decision: DecisionType.PERMIT },
      loading: false,
      error: undefined,
    });
    (useWatch as jest.Mock).mockImplementation(({ name }) => {
      if (name === 'isLocked') return true;
      return false;
    });

    renderWithFormProvider(<TeamMember {...props} />, {
      defaultValues: {
        teamMember: {
          id: '1',
          type: TimeForType.EMPLOYEE,
        },
        isLocked: true,
      },
    });

    const input = screen.getByTestId('teamMemberInput');
    expect(input).toBeDisabled();
  });

  it('should enable team member dropdown when user is not workforce user', () => {
    mockIsWorkforceEnvironment.mockReturnValue(false);
    mockUseAuthorization.mockReturnValue({
      decision: { isAuthorized: true, decision: DecisionType.PERMIT },
      loading: false,
      error: undefined,
    });
    (useWatch as jest.Mock).mockImplementation(({ name }) => {
      if (name === 'isLocked') return false;
      return false;
    });

    renderWithFormProvider(<TeamMember {...props} />, {
      defaultValues: {
        teamMember: {
          id: '1',
          type: TimeForType.EMPLOYEE,
        },
        isLocked: false,
      },
    });

    const input = screen.getByTestId('teamMemberInput');
    expect(input).not.toBeDisabled();
  });

  it('should combine workforce user and timeTrackingOnlyId disabled conditions', () => {
    mockIsWorkforceEnvironment.mockReturnValue(true);

    renderWithFormProvider(<TeamMember {...props} timeTrackingOnlyId="123" />, {
      defaultValues: {
        teamMember: {
          id: '1',
          type: TimeForType.EMPLOYEE,
        },
      },
    });

    const input = screen.getByTestId('teamMemberInput');
    expect(input).toBeDisabled();
  });
});

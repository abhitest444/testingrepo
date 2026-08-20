import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import {
  getDefaultSandbox,
  renderWithQuicksandProvider,
} from 'test/unit/testUtils';
import PolicyNameStep from 'src/js/widgets/qbtOrchestrator/features/overtime/components/PolicySetupWizard/PolicyNameStep';

// Mock IDS components
jest.mock('@ids-ts/text-field', () => ({
  __esModule: true,
  default: ({ label, value, onChange, 'data-testid': testId }: any) => (
    <label>
      {label}
      <input
        data-testid={testId}
        value={value}
        onChange={onChange}
        type="text"
      />
    </label>
  ),
}));

jest.mock('@ids-ts/checkbox', () => ({
  __esModule: true,
  Checkbox: ({
    children,
    checked,
    disabled,
    onChange,
    'data-testid': testId,
  }: any) => (
    <label>
      <input
        data-testid={testId}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
      />
      {children}
    </label>
  ),
}));

jest.mock('@ids-ts/typography', () => ({
  __esModule: true,
  default: ({ children, variant, weight }: any) => (
    <span data-variant={variant} data-weight={weight}>
      {children}
    </span>
  ),
}));

jest.mock('@ids-ts/cards', () => ({
  __esModule: true,
  Card: ({ children, size }: any) => (
    <div data-testid="ids-card" data-size={size}>
      {children}
    </div>
  ),
  CardContent: ({ children }: any) => (
    <div data-testid="ids-card-content">{children}</div>
  ),
}));

describe('PolicyNameStep', () => {
  const mockSandbox = getDefaultSandbox();
  const mockOnNameChange = jest.fn();
  const mockOnDefaultChange = jest.fn();

  const defaultProps = {
    name: 'Overtime Policy 1',
    isBasicPolicy: false,
    isDefault: false,
    onNameChange: mockOnNameChange,
    onDefaultChange: mockOnDefaultChange,
  };

  const renderComponent = (props = {}) =>
    renderWithQuicksandProvider(
      <PolicyNameStep {...defaultProps} {...props} />,
      mockSandbox,
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it('should render the IDS Card', () => {
      renderComponent();
      expect(screen.getByTestId('ids-card')).toBeInTheDocument();
    });

    it('should render the title', () => {
      renderComponent();
      expect(
        screen.getByText(/NLS overtime.wizard.policy.name.title/i),
      ).toBeInTheDocument();
    });

    it('should render the description', () => {
      renderComponent();
      expect(
        screen.getByText(/NLS overtime.wizard.policy.name.description/i),
      ).toBeInTheDocument();
    });

    it('should render the name text field', () => {
      renderComponent();
      expect(screen.getByTestId('policy-name-input')).toBeInTheDocument();
    });

    it('should render the default checkbox', () => {
      renderComponent();
      expect(screen.getByTestId('default-policy-checkbox')).toBeInTheDocument();
    });

    it('should render the checkbox label', () => {
      renderComponent();
      expect(
        screen.getByText(/NLS overtime.wizard.policy.default.label/i),
      ).toBeInTheDocument();
    });

    it('should render the checkbox description', () => {
      renderComponent();
      expect(
        screen.getByText(/NLS overtime.wizard.policy.default.description/i),
      ).toBeInTheDocument();
    });
  });

  describe('Props Values', () => {
    it('should display the policy name in the text field', () => {
      renderComponent({ name: 'Custom Policy Name' });
      const input = screen.getByTestId('policy-name-input') as HTMLInputElement;
      expect(input.value).toBe('Custom Policy Name');
    });

    it('should show checkbox as checked when isDefault is true', () => {
      renderComponent({ isDefault: true });
      const checkbox = screen.getByTestId(
        'default-policy-checkbox',
      ) as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });

    it('should show checkbox as unchecked when isDefault is false', () => {
      renderComponent({ isDefault: false });
      const checkbox = screen.getByTestId(
        'default-policy-checkbox',
      ) as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
    });
  });

  describe('User Interactions', () => {
    it('should call onNameChange when name input changes', () => {
      renderComponent();
      const input = screen.getByTestId('policy-name-input');

      fireEvent.change(input, { target: { value: 'New Policy Name' } });

      expect(mockOnNameChange).toHaveBeenCalledWith('New Policy Name');
    });

    it('should call onDefaultChange when checkbox is clicked', () => {
      renderComponent({ isDefault: false });
      const checkbox = screen.getByTestId('default-policy-checkbox');

      fireEvent.click(checkbox);

      expect(mockOnDefaultChange).toHaveBeenCalled();
    });

    it('should call onDefaultChange when unchecking the checkbox', () => {
      renderComponent({ isDefault: true });
      const checkbox = screen.getByTestId('default-policy-checkbox');

      fireEvent.click(checkbox);

      expect(mockOnDefaultChange).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty name', () => {
      renderComponent({ name: '' });
      const input = screen.getByTestId('policy-name-input') as HTMLInputElement;
      expect(input.value).toBe('');
    });

    it('should handle special characters in name', () => {
      renderComponent({ name: 'Policy & <Special> "Name"' });
      const input = screen.getByTestId('policy-name-input') as HTMLInputElement;
      expect(input.value).toBe('Policy & <Special> "Name"');
    });

    it('should handle long policy names', () => {
      const longName = 'A'.repeat(200);
      renderComponent({ name: longName });
      const input = screen.getByTestId('policy-name-input') as HTMLInputElement;
      expect(input.value).toBe(longName);
    });
  });

  describe('Basic Policy Behavior', () => {
    it('should disable checkbox when isBasicPolicy is true and isEditMode is true', () => {
      renderComponent({ isBasicPolicy: true, isEditMode: true });
      const checkbox = screen.getByTestId(
        'default-policy-checkbox',
      ) as HTMLInputElement;
      expect(checkbox.disabled).toBe(true);
    });

    it('should not disable checkbox when isBasicPolicy is true but isEditMode is false', () => {
      renderComponent({ isBasicPolicy: true, isEditMode: false });
      const checkbox = screen.getByTestId(
        'default-policy-checkbox',
      ) as HTMLInputElement;
      expect(checkbox.disabled).toBe(false);
    });

    it('should not disable checkbox when isBasicPolicy is false and isEditMode is true', () => {
      renderComponent({ isBasicPolicy: false, isEditMode: true });
      const checkbox = screen.getByTestId(
        'default-policy-checkbox',
      ) as HTMLInputElement;
      expect(checkbox.disabled).toBe(false);
    });

    it('should not disable checkbox when both isBasicPolicy and isEditMode are false', () => {
      renderComponent({ isBasicPolicy: false, isEditMode: false });
      const checkbox = screen.getByTestId(
        'default-policy-checkbox',
      ) as HTMLInputElement;
      expect(checkbox.disabled).toBe(false);
    });

    it('should render checkbox as disabled when isBasicPolicy and isEditMode are true', () => {
      renderComponent({
        isBasicPolicy: true,
        isEditMode: true,
        isDefault: false,
      });
      const checkbox = screen.getByTestId(
        'default-policy-checkbox',
      ) as HTMLInputElement;
      // Verify the checkbox is properly marked as disabled
      expect(checkbox.disabled).toBe(true);
    });
  });
});

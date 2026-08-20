import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useIntl } from '@payroll/quicksand';
import TimeClockCloseConfirmation from 'src/js/widgets/timeClock/components/TimeClockCloseConfirmation';

// Mock useIntl hook
jest.mock('@payroll/quicksand', () => ({
  useIntl: jest.fn().mockReturnValue({
    formatMessage: ({ id }: { id: string }) => id,
  }),
}));

const mockOnBack = jest.fn();
const mockOnClose = jest.fn();
const mockOnPrimaryButtonClick = jest.fn();
const mockOnSecondaryButtonClick = jest.fn();

const defaultProps = {
  onBack: mockOnBack,
  onClose: mockOnClose,
  header: 'Want to save your changes?',
  description:
    "You'll lose any changes you made to your time entry if you don't save them.",
  backButtonLabel: 'Back',
  closeButtonLabel: "Don't Save",
  drawerTitle: 'Time Clock',
  primaryButtonLabel: 'Save',
  secondaryButtonLabel: "Don't Save",
  onPrimaryButtonClick: mockOnPrimaryButtonClick,
  onSecondaryButtonClick: mockOnSecondaryButtonClick,
  variant: 'save' as const,
};

const renderComponent = (props = {}) =>
  render(<TimeClockCloseConfirmation {...defaultProps} {...props} />);

describe('TimeClockCloseConfirmation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default props', () => {
    renderComponent();

    expect(screen.getByText('Want to save your changes?')).toBeInTheDocument();
    expect(
      screen.getByText(
        "You'll lose any changes you made to your time entry if you don't save them.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Time Clock')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText("Don't Save")).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    renderComponent();

    const backButton = screen.getByText('Back');
    fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('calls onPrimaryButtonClick when primary button is clicked', () => {
    renderComponent();

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    expect(mockOnPrimaryButtonClick).toHaveBeenCalledTimes(1);
  });

  it('calls onSecondaryButtonClick when secondary button is clicked', () => {
    renderComponent();

    const dontSaveButton = screen.getByText("Don't Save");
    fireEvent.click(dontSaveButton);

    expect(mockOnSecondaryButtonClick).toHaveBeenCalledTimes(1);
  });

  it('uses onClose as fallback when onPrimaryButtonClick is not provided', () => {
    renderComponent({ onPrimaryButtonClick: undefined });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnPrimaryButtonClick).not.toHaveBeenCalled();
  });

  it('uses onBack as fallback when onSecondaryButtonClick is not provided', () => {
    renderComponent({ onSecondaryButtonClick: undefined });

    const dontSaveButton = screen.getByText("Don't Save");
    fireEvent.click(dontSaveButton);

    expect(mockOnBack).toHaveBeenCalledTimes(1);
    expect(mockOnSecondaryButtonClick).not.toHaveBeenCalled();
  });

  it('renders with custom header and description', () => {
    const customProps = {
      header: 'Custom Header',
      description: 'Custom Description',
    };

    renderComponent(customProps);

    expect(screen.getByText('Custom Header')).toBeInTheDocument();
    expect(screen.getByText('Custom Description')).toBeInTheDocument();
  });

  it('renders with custom button labels', () => {
    const customProps = {
      primaryButtonLabel: 'Custom Save',
      secondaryButtonLabel: 'Custom Cancel',
    };

    renderComponent(customProps);

    expect(screen.getByText('Custom Save')).toBeInTheDocument();
    expect(screen.getByText('Custom Cancel')).toBeInTheDocument();
  });

  it('renders with custom drawer title', () => {
    const customProps = {
      drawerTitle: 'Custom Title',
    };

    renderComponent(customProps);

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('renders with stay variant', () => {
    renderComponent({ variant: 'stay' });

    // Verify the component renders correctly with stay variant
    expect(screen.getByText('Want to save your changes?')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText("Don't Save")).toBeInTheDocument();
  });
});

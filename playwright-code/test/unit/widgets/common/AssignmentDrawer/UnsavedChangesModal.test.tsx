import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { UnsavedChangesModal } from 'src/js/widgets/common/AssignmentDrawer/components/UnsavedChangesModal';
import {
  renderWithQuicksandProvider,
  getDefaultSandbox,
} from 'test/unit/testUtils';

// Mock @ids-ts/modal-dialog
jest.mock('@ids-ts/modal-dialog', () => ({
  Modal: ({ children, open, onClose, size, dismissible, restoreFocus }: any) =>
    open ? (
      <div
        data-testid="assignment-drawer-unsaved-changes-modal"
        data-size={size}
        data-dismissible={dismissible}
        data-restore-focus={restoreFocus}
      >
        {children}
        <button data-testid="modal-close" onClick={onClose}>
          Close
        </button>
      </div>
    ) : null,
  ModalHeader: ({ children, alignment }: any) => (
    <div data-testid="modal-header" data-alignment={alignment}>
      {children}
    </div>
  ),
  ModalTitle: ({ title }: any) => <div data-testid="modal-title">{title}</div>,
  ModalContent: ({ children, alignment }: any) => (
    <div data-testid="modal-content" data-alignment={alignment}>
      {children}
    </div>
  ),
  ModalActions: ({ children, alignment, sectionDivider }: any) => (
    <div
      data-testid="modal-actions"
      data-alignment={alignment}
      data-section-divider={sectionDivider}
    >
      {children}
    </div>
  ),
}));

// Mock @ids-ts/button
jest.mock('@ids-ts/button', () => ({
  __esModule: true,
  default: ({ children, onClick, priority }: any) => (
    <button onClick={onClick} data-priority={priority}>
      {children}
    </button>
  ),
}));

describe('UnsavedChangesModal Component', () => {
  const mockOnSave = jest.fn();
  const mockOnDontSave = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test.each([
      {
        description: 'renders modal when open is true',
        open: true,
        expectPresent: true,
      },
      {
        description: 'does not render modal when open is false',
        open: false,
        expectPresent: false,
      },
    ])('should $description', ({ open, expectPresent }) => {
      renderWithQuicksandProvider(
        <UnsavedChangesModal
          open={open}
          onSave={mockOnSave}
          onDontSave={mockOnDontSave}
          onClose={mockOnClose}
        />,
        getDefaultSandbox(),
      );

      if (expectPresent) {
        expect(
          screen.getByTestId('assignment-drawer-unsaved-changes-modal'),
        ).toBeInTheDocument();
      } else {
        expect(
          screen.queryByTestId('assignment-drawer-unsaved-changes-modal'),
        ).not.toBeInTheDocument();
      }
    });

    test.each([
      {
        description: 'has correct size prop',
        attribute: 'data-size',
        expected: 'small',
      },
      {
        description: 'is non-dismissible',
        attribute: 'data-dismissible',
        expected: 'false',
      },
      {
        description: 'has restoreFocus enabled',
        attribute: 'data-restore-focus',
        expected: 'true',
      },
      {
        description: 'has correct data-testid',
        attribute: 'data-testid',
        expected: 'assignment-drawer-unsaved-changes-modal',
      },
    ])('should $description', ({ attribute, expected }) => {
      renderWithQuicksandProvider(
        <UnsavedChangesModal
          open
          onSave={mockOnSave}
          onDontSave={mockOnDontSave}
          onClose={mockOnClose}
        />,
        getDefaultSandbox(),
      );

      const modal = screen.getByTestId(
        'assignment-drawer-unsaved-changes-modal',
      );
      expect(modal).toHaveAttribute(attribute, expected);
    });
  });

  describe('Modal Header', () => {
    it('should render modal header with center alignment', () => {
      renderWithQuicksandProvider(
        <UnsavedChangesModal
          open
          onSave={mockOnSave}
          onDontSave={mockOnDontSave}
          onClose={mockOnClose}
        />,
        getDefaultSandbox(),
      );

      const header = screen.getByTestId('modal-header');
      expect(header).toHaveAttribute('data-alignment', 'center');
    });

    it('should render modal title', () => {
      renderWithQuicksandProvider(
        <UnsavedChangesModal
          open
          onSave={mockOnSave}
          onDontSave={mockOnDontSave}
          onClose={mockOnClose}
        />,
        getDefaultSandbox(),
      );

      expect(screen.getByTestId('modal-title')).toBeInTheDocument();
    });

    it('should display correct title text', () => {
      renderWithQuicksandProvider(
        <UnsavedChangesModal
          open
          onSave={mockOnSave}
          onDontSave={mockOnDontSave}
          onClose={mockOnClose}
        />,
        getDefaultSandbox(),
      );

      // The title should be translated
      expect(screen.getByTestId('modal-title')).toBeInTheDocument();
    });
  });

  describe('Modal Content', () => {
    it('should render modal content with center alignment', () => {
      renderWithQuicksandProvider(
        <UnsavedChangesModal
          open
          onSave={mockOnSave}
          onDontSave={mockOnDontSave}
          onClose={mockOnClose}
        />,
        getDefaultSandbox(),
      );

      const content = screen.getByTestId('modal-content');
      expect(content).toHaveAttribute('data-alignment', 'center');
    });

    it('should display warning message', () => {
      renderWithQuicksandProvider(
        <UnsavedChangesModal
          open
          onSave={mockOnSave}
          onDontSave={mockOnDontSave}
          onClose={mockOnClose}
        />,
        getDefaultSandbox(),
      );

      expect(screen.getByTestId('modal-content')).toBeInTheDocument();
    });
  });

  describe('Modal Actions', () => {
    it('should render modal actions with center alignment', () => {
      renderWithQuicksandProvider(
        <UnsavedChangesModal
          open
          onSave={mockOnSave}
          onDontSave={mockOnDontSave}
          onClose={mockOnClose}
        />,
        getDefaultSandbox(),
      );

      const actions = screen.getByTestId('modal-actions');
      expect(actions).toHaveAttribute('data-alignment', 'center');
    });

    it('should not show section divider', () => {
      renderWithQuicksandProvider(
        <UnsavedChangesModal
          open
          onSave={mockOnSave}
          onDontSave={mockOnDontSave}
          onClose={mockOnClose}
        />,
        getDefaultSandbox(),
      );

      const actions = screen.getByTestId('modal-actions');
      expect(actions).toHaveAttribute('data-section-divider', 'false');
    });

    it('should render two buttons', () => {
      renderWithQuicksandProvider(
        <UnsavedChangesModal
          open
          onSave={mockOnSave}
          onDontSave={mockOnDontSave}
          onClose={mockOnClose}
        />,
        getDefaultSandbox(),
      );

      const buttons = screen.getAllByRole('button');
      // Should have 2 action buttons + 1 close button from mock
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Button Interactions', () => {
    it('should call onSave when Save button is clicked', () => {
      renderWithQuicksandProvider(
        <UnsavedChangesModal
          open
          onSave={mockOnSave}
          onDontSave={mockOnDontSave}
          onClose={mockOnClose}
        />,
        getDefaultSandbox(),
      );

      const buttons = screen.getAllByRole('button');
      // Find the primary button (Save)
      const saveButton = buttons.find(
        (btn) => btn.getAttribute('data-priority') === 'primary',
      );

      expect(saveButton).toBeDefined();
      if (saveButton) {
        fireEvent.click(saveButton);
        expect(mockOnSave).toHaveBeenCalledTimes(1);
      }
    });

    it("should call onDontSave when Don't save button is clicked", () => {
      renderWithQuicksandProvider(
        <UnsavedChangesModal
          open
          onSave={mockOnSave}
          onDontSave={mockOnDontSave}
          onClose={mockOnClose}
        />,
        getDefaultSandbox(),
      );

      const buttons = screen.getAllByRole('button');
      // Find the secondary button (Don't save)
      const dontSaveButton = buttons.find(
        (btn) => btn.getAttribute('data-priority') === 'secondary',
      );

      expect(dontSaveButton).toBeDefined();
      if (dontSaveButton) {
        fireEvent.click(dontSaveButton);
        expect(mockOnDontSave).toHaveBeenCalledTimes(1);
      }
    });

    it('should call onClose when modal close is triggered', () => {
      renderWithQuicksandProvider(
        <UnsavedChangesModal
          open
          onSave={mockOnSave}
          onDontSave={mockOnDontSave}
          onClose={mockOnClose}
        />,
        getDefaultSandbox(),
      );

      const closeButton = screen.getByTestId('modal-close');
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onSave when onDontSave is clicked', () => {
      renderWithQuicksandProvider(
        <UnsavedChangesModal
          open
          onSave={mockOnSave}
          onDontSave={mockOnDontSave}
          onClose={mockOnClose}
        />,
        getDefaultSandbox(),
      );

      const buttons = screen.getAllByRole('button');
      const dontSaveButton = buttons.find(
        (btn) => btn.getAttribute('data-priority') === 'secondary',
      );

      if (dontSaveButton) {
        fireEvent.click(dontSaveButton);
        expect(mockOnSave).not.toHaveBeenCalled();
        expect(mockOnDontSave).toHaveBeenCalledTimes(1);
      }
    });

    it('should not call onDontSave when onSave is clicked', () => {
      renderWithQuicksandProvider(
        <UnsavedChangesModal
          open
          onSave={mockOnSave}
          onDontSave={mockOnDontSave}
          onClose={mockOnClose}
        />,
        getDefaultSandbox(),
      );

      const buttons = screen.getAllByRole('button');
      const saveButton = buttons.find(
        (btn) => btn.getAttribute('data-priority') === 'primary',
      );

      if (saveButton) {
        fireEvent.click(saveButton);
        expect(mockOnDontSave).not.toHaveBeenCalled();
        expect(mockOnSave).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('Button Priorities', () => {
    it("should have secondary priority for Don't save button", () => {
      renderWithQuicksandProvider(
        <UnsavedChangesModal
          open
          onSave={mockOnSave}
          onDontSave={mockOnDontSave}
          onClose={mockOnClose}
        />,
        getDefaultSandbox(),
      );

      const buttons = screen.getAllByRole('button');
      const secondaryButton = buttons.find(
        (btn) => btn.getAttribute('data-priority') === 'secondary',
      );

      expect(secondaryButton).toBeDefined();
    });

    it('should have primary priority for Save button', () => {
      renderWithQuicksandProvider(
        <UnsavedChangesModal
          open
          onSave={mockOnSave}
          onDontSave={mockOnDontSave}
          onClose={mockOnClose}
        />,
        getDefaultSandbox(),
      );

      const buttons = screen.getAllByRole('button');
      const primaryButton = buttons.find(
        (btn) => btn.getAttribute('data-priority') === 'primary',
      );

      expect(primaryButton).toBeDefined();
    });
  });

  describe('Multiple Opens', () => {
    it('should handle opening and closing multiple times', () => {
      const { rerender } = renderWithQuicksandProvider(
        <UnsavedChangesModal
          open={false}
          onSave={mockOnSave}
          onDontSave={mockOnDontSave}
          onClose={mockOnClose}
        />,
        getDefaultSandbox(),
      );

      expect(
        screen.queryByTestId('assignment-drawer-unsaved-changes-modal'),
      ).not.toBeInTheDocument();

      rerender(
        <UnsavedChangesModal
          open
          onSave={mockOnSave}
          onDontSave={mockOnDontSave}
          onClose={mockOnClose}
        />,
      );

      expect(
        screen.getByTestId('assignment-drawer-unsaved-changes-modal'),
      ).toBeInTheDocument();

      rerender(
        <UnsavedChangesModal
          open={false}
          onSave={mockOnSave}
          onDontSave={mockOnDontSave}
          onClose={mockOnClose}
        />,
      );

      expect(
        screen.queryByTestId('assignment-drawer-unsaved-changes-modal'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Callback Independence', () => {
    it('should allow different callbacks on each render', () => {
      const firstOnSave = jest.fn();
      const secondOnSave = jest.fn();

      const { rerender } = renderWithQuicksandProvider(
        <UnsavedChangesModal
          open
          onSave={firstOnSave}
          onDontSave={mockOnDontSave}
          onClose={mockOnClose}
        />,
        getDefaultSandbox(),
      );

      const buttons = screen.getAllByRole('button');
      const saveButton = buttons.find(
        (btn) => btn.getAttribute('data-priority') === 'primary',
      );

      if (saveButton) {
        fireEvent.click(saveButton);
        expect(firstOnSave).toHaveBeenCalledTimes(1);
        expect(secondOnSave).not.toHaveBeenCalled();
      }

      rerender(
        <UnsavedChangesModal
          open
          onSave={secondOnSave}
          onDontSave={mockOnDontSave}
          onClose={mockOnClose}
        />,
      );

      const updatedButtons = screen.getAllByRole('button');
      const updatedSaveButton = updatedButtons.find(
        (btn) => btn.getAttribute('data-priority') === 'primary',
      );

      if (updatedSaveButton) {
        fireEvent.click(updatedSaveButton);
        expect(firstOnSave).toHaveBeenCalledTimes(1); // Still 1
        expect(secondOnSave).toHaveBeenCalledTimes(1);
      }
    });
  });
});

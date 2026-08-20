import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { mockFormatMessage } from 'test/unit/testUtils';
import { KeyboardShortcutsModal } from '../../../../../../src/js/widgets/weeklyTimeEntry/components/weeklyTimeEntryHeader/KeyboardShortcutsModal';

// Mock useIntl
jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: mockFormatMessage,
  }),
}));

// Mock the modal components
jest.mock('@ids-ts/modal-dialog', () => ({
  Modal: ({ children, open, onClose, size, dismissible, restoreFocus }: any) =>
    open ? (
      <div
        data-testid="modal"
        data-size={size}
        data-dismissible={dismissible}
        data-restore-focus={restoreFocus}
      >
        <button type="button" onClick={onClose} data-testid="modal-close">
          Close
        </button>
        {children}
      </div>
    ) : null,
  ModalContent: ({ children }: any) => (
    <div data-testid="modal-content">{children}</div>
  ),
  ModalHeader: ({ children, alignment }: any) => (
    <div data-testid="modal-header" data-alignment={alignment}>
      {children}
    </div>
  ),
  ModalTitle: ({ title }: any) => <h2 data-testid="modal-title">{title}</h2>,
}));

// Mock the typography components
jest.mock('@ids-ts/typography', () => ({
  B2: ({ children, as }: any) => {
    const Component = as || 'div';
    return <Component data-testid="b2-text">{children}</Component>;
  },
  B3: ({ children, as }: any) => {
    const Component = as || 'div';
    return <Component data-testid="b3-text">{children}</Component>;
  },
}));

describe('KeyboardShortcutsModal', () => {
  const defaultProps = {
    open: false,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFormatMessage.mockImplementation(({ id }) => id);
  });

  it('should not render when open is false', () => {
    render(<KeyboardShortcutsModal {...defaultProps} />);

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('should render when open is true', () => {
    render(<KeyboardShortcutsModal {...defaultProps} open />);

    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-content')).toBeInTheDocument();
    expect(screen.getByTestId('modal-header')).toBeInTheDocument();
    expect(screen.getByTestId('modal-title')).toBeInTheDocument();
  });

  it('should display the correct title', () => {
    render(<KeyboardShortcutsModal {...defaultProps} open />);

    expect(mockFormatMessage).toHaveBeenCalledWith({
      id: 'weekly.time.entry.keyboard.shortcuts.modal.title',
    });
    expect(
      screen.getByText('weekly.time.entry.keyboard.shortcuts.modal.title'),
    ).toBeInTheDocument();
  });

  it('should display the description text', () => {
    render(<KeyboardShortcutsModal {...defaultProps} open />);

    expect(mockFormatMessage).toHaveBeenCalledWith({
      id: 'weekly.time.entry.keyboard.shortcuts.modal.description',
    });
    expect(
      screen.getByText(
        'weekly.time.entry.keyboard.shortcuts.modal.description',
      ),
    ).toBeInTheDocument();
  });

  it('should render all keyboard shortcuts', () => {
    render(<KeyboardShortcutsModal {...defaultProps} open />);

    const expectedShortcuts = [
      'Tab',
      'Shift + Tab',
      'Directional arrows (↑, →, ←, ↓)',
      'Ctrl + C',
      'Ctrl + V',
      'Alt + N',
      'Alt + Shift + N',
      'Ctrl + S',
      'Ctrl + Z',
      'Ctrl + Y',
      'Alt + C',
      'Alt + T',
      'Ctrl + →',
      'Ctrl + ←',
      'Esc',
      'Delete',
      'Shift + Delete',
      'Ctrl + Shift + +',
    ];

    expectedShortcuts.forEach((shortcut) => {
      expect(screen.getByText(shortcut)).toBeInTheDocument();
    });
  });

  it('should render all shortcut descriptions', () => {
    render(<KeyboardShortcutsModal {...defaultProps} open />);

    const expectedDescriptionKeys = [
      'weekly.time.entry.keyboard.shortcuts.next',
      'weekly.time.entry.keyboard.shortcuts.previous',
      'weekly.time.entry.keyboard.shortcuts.move.adjacent.cell',
      'weekly.time.entry.keyboard.shortcuts.copy.cell.entry',
      'weekly.time.entry.keyboard.shortcuts.paste.cell.entry',
      'weekly.time.entry.keyboard.shortcuts.add.new.row',
      'weekly.time.entry.keyboard.shortcuts.add.new.row', // Alt + Shift + N also uses the same description
      'weekly.time.entry.keyboard.shortcuts.save.timesheet',
      'weekly.time.entry.keyboard.shortcuts.undo.last.change',
      'weekly.time.entry.keyboard.shortcuts.redo.last.change',
      'weekly.time.entry.keyboard.shortcuts.clear.all.rows',
      'weekly.time.entry.keyboard.shortcuts.go.to.today',
      'weekly.time.entry.keyboard.shortcuts.go.to.next.week',
      'weekly.time.entry.keyboard.shortcuts.go.to.previous.week',
      'weekly.time.entry.keyboard.shortcuts.cancel.current.action',
      'weekly.time.entry.keyboard.shortcuts.clear.cell',
      'weekly.time.entry.keyboard.shortcuts.delete.row',
      'weekly.time.entry.keyboard.shortcuts.insert.row',
    ];

    expectedDescriptionKeys.forEach((key) => {
      expect(mockFormatMessage).toHaveBeenCalledWith({ id: key });
    });

    // Check that the duplicate description appears twice
    expect(
      screen.getAllByText('weekly.time.entry.keyboard.shortcuts.add.new.row'),
    ).toHaveLength(2);
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(<KeyboardShortcutsModal {...defaultProps} open onClose={onClose} />);

    fireEvent.click(screen.getByTestId('modal-close'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should have correct modal props', () => {
    render(<KeyboardShortcutsModal {...defaultProps} open />);

    const modal = screen.getByTestId('modal');
    expect(modal).toHaveAttribute('data-size', 'medium');
    expect(modal).toHaveAttribute('data-dismissible', 'true');
    expect(modal).toHaveAttribute('data-restore-focus', 'true');
  });

  it('should have left alignment for modal header', () => {
    render(<KeyboardShortcutsModal {...defaultProps} open />);

    const header = screen.getByTestId('modal-header');
    expect(header).toHaveAttribute('data-alignment', 'left');
  });

  it('should render shortcut keys with strong styling', () => {
    render(<KeyboardShortcutsModal {...defaultProps} open />);

    // Check that shortcut keys are rendered with strong tags
    const tabKey = screen.getByText('Tab');
    expect(tabKey.closest('strong')).toBeInTheDocument();
  });

  it('should render descriptions with B3 typography', () => {
    render(<KeyboardShortcutsModal {...defaultProps} open />);

    // Check that descriptions are rendered with B3 typography
    const descriptions = screen.getAllByTestId('b3-text');
    expect(descriptions.length).toBeGreaterThan(0);
  });

  describe('NLS Integration', () => {
    it('should use NLS for all text content', () => {
      render(<KeyboardShortcutsModal {...defaultProps} open />);

      // Verify that formatMessage was called for modal title and description
      expect(mockFormatMessage).toHaveBeenCalledWith({
        id: 'weekly.time.entry.keyboard.shortcuts.modal.title',
      });
      expect(mockFormatMessage).toHaveBeenCalledWith({
        id: 'weekly.time.entry.keyboard.shortcuts.modal.description',
      });

      // Verify that formatMessage was called for all shortcut descriptions
      const shortcutKeys = [
        'weekly.time.entry.keyboard.shortcuts.next',
        'weekly.time.entry.keyboard.shortcuts.previous',
        'weekly.time.entry.keyboard.shortcuts.move.adjacent.cell',
        'weekly.time.entry.keyboard.shortcuts.copy.cell.entry',
        'weekly.time.entry.keyboard.shortcuts.paste.cell.entry',
        'weekly.time.entry.keyboard.shortcuts.add.new.row',
        'weekly.time.entry.keyboard.shortcuts.save.timesheet',
        'weekly.time.entry.keyboard.shortcuts.undo.last.change',
        'weekly.time.entry.keyboard.shortcuts.redo.last.change',
        'weekly.time.entry.keyboard.shortcuts.clear.all.rows',
        'weekly.time.entry.keyboard.shortcuts.go.to.today',
        'weekly.time.entry.keyboard.shortcuts.go.to.next.week',
        'weekly.time.entry.keyboard.shortcuts.go.to.previous.week',
        'weekly.time.entry.keyboard.shortcuts.cancel.current.action',
      ];

      shortcutKeys.forEach((key) => {
        expect(mockFormatMessage).toHaveBeenCalledWith({ id: key });
      });
    });
  });
});

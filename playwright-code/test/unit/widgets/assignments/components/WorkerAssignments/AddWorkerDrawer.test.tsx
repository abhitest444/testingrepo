import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AddWorkerDrawer } from 'src/js/widgets/assignments/components/WorkerAssignments/AddWorkerDrawer';
import { WorkerNameType } from 'src/js/widgets/assignments/types';

// Mock useIntl and useSandbox
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

const mockFormatMessage = jest.fn(
  (
    { id, defaultMessage }: { id: string; defaultMessage?: string },
    values?: any,
  ) => {
    if (id === 'assignments.add_worker.success' && values?.workerName) {
      return `${values.workerName} added successfully`;
    }
    return defaultMessage || id;
  },
);

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: mockFormatMessage,
  }),
  useSandbox: () => ({
    logger: mockLogger,
  }),
}));

// Mock Widget component
const mockOnWidgetClose = jest.fn();
const mockOnWidgetSuccess = jest.fn();
const mockOnWidgetError = jest.fn();

jest.mock('web-shell-core/widgets/HOCWidget', () => ({
  __esModule: true,
  default: ({
    widgetId,
    nameTypes,
    open,
    onClose,
    onSuccess,
    onError,
  }: any) => (
    <div data-testid="qbo-contact-widget" data-widget-id={widgetId}>
      <div data-testid="widget-name-types">{nameTypes.join(',')}</div>
      <button data-testid="widget-close-btn" onClick={onClose}>
        Close
      </button>
      <button
        data-testid="widget-success-btn"
        onClick={() =>
          onSuccess({
            id: 'worker-123',
            displayName: 'Jane Doe',
            type: 'Employee',
          })
        }
      >
        Add Worker
      </button>
      <button
        data-testid="widget-error-btn"
        onClick={() => onError(new Error('Validation failed'))}
      >
        Trigger Error
      </button>
      <button
        data-testid="widget-error-no-message-btn"
        onClick={() => onError({ code: 'ERR_UNKNOWN' })}
      >
        Trigger Error Without Message
      </button>
    </div>
  ),
}));

describe('AddWorkerDrawer', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockOnRefetchData = jest.fn();
  const mockNameTypes = [WorkerNameType.EMPLOYEE, WorkerNameType.CONTRACTOR];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render widget when open is true', () => {
      render(
        <AddWorkerDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          nameTypes={mockNameTypes}
        />,
      );

      expect(screen.getByTestId('qbo-contact-widget')).toBeInTheDocument();
    });

    it('should not render when open is false', () => {
      render(
        <AddWorkerDrawer
          open={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          nameTypes={mockNameTypes}
        />,
      );

      expect(
        screen.queryByTestId('qbo-contact-widget'),
      ).not.toBeInTheDocument();
    });

    it('should render with correct widget ID', () => {
      render(
        <AddWorkerDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          nameTypes={mockNameTypes}
        />,
      );

      const widget = screen.getByTestId('qbo-contact-widget');
      expect(widget).toHaveAttribute(
        'data-widget-id',
        'qbo-contacts-v2/contact-drawer',
      );
    });

    it('should render with correct name types', () => {
      render(
        <AddWorkerDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          nameTypes={mockNameTypes}
        />,
      );

      expect(screen.getByTestId('widget-name-types')).toHaveTextContent(
        'employee,vendor',
      );
    });

    it('should render with only employee name type', () => {
      render(
        <AddWorkerDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          nameTypes={[WorkerNameType.EMPLOYEE]}
        />,
      );

      expect(screen.getByTestId('widget-name-types')).toHaveTextContent(
        'employee',
      );
    });
  });

  describe('Close Functionality', () => {
    it('should call onClose when close button is clicked', () => {
      render(
        <AddWorkerDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          nameTypes={mockNameTypes}
        />,
      );

      fireEvent.click(screen.getByTestId('widget-close-btn'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should log close event with normal context', () => {
      render(
        <AddWorkerDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          nameTypes={mockNameTypes}
          context="normal"
        />,
      );

      fireEvent.click(screen.getByTestId('widget-close-btn'));

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Component="AddWorkerDrawer" Event="Drawer closed" Context="normal"',
      );
    });

    it('should log close event with detail context', () => {
      render(
        <AddWorkerDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          nameTypes={mockNameTypes}
          context="detail"
        />,
      );

      fireEvent.click(screen.getByTestId('widget-close-btn'));

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Component="AddWorkerDrawer" Event="Drawer closed" Context="detail"',
      );
    });

    it('should default to normal context if not provided', () => {
      render(
        <AddWorkerDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          nameTypes={mockNameTypes}
        />,
      );

      fireEvent.click(screen.getByTestId('widget-close-btn'));

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Component="AddWorkerDrawer" Event="Drawer closed" Context="normal"',
      );
    });
  });

  describe('Success Functionality', () => {
    it('should call onSuccess with formatted message when worker is added', () => {
      render(
        <AddWorkerDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          nameTypes={mockNameTypes}
        />,
      );

      fireEvent.click(screen.getByTestId('widget-success-btn'));

      expect(mockOnSuccess).toHaveBeenCalledWith('Jane Doe added successfully');
    });

    it('should call onClose when worker is added successfully', () => {
      render(
        <AddWorkerDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          nameTypes={mockNameTypes}
        />,
      );

      fireEvent.click(screen.getByTestId('widget-success-btn'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should log success event with worker details', () => {
      render(
        <AddWorkerDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          nameTypes={mockNameTypes}
          context="normal"
        />,
      );

      fireEvent.click(screen.getByTestId('widget-success-btn'));

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Component="AddWorkerDrawer" Event="Worker added successfully" Context="normal"',
        {
          contactId: 'worker-123',
          displayName: 'Jane Doe',
          type: 'Employee',
        },
      );
    });

    it('should call onRefetchData when provided', () => {
      render(
        <AddWorkerDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          nameTypes={mockNameTypes}
          onRefetchData={mockOnRefetchData}
        />,
      );

      fireEvent.click(screen.getByTestId('widget-success-btn'));

      expect(mockOnRefetchData).toHaveBeenCalledTimes(1);
    });

    it('should not fail when onRefetchData is not provided', () => {
      render(
        <AddWorkerDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          nameTypes={mockNameTypes}
        />,
      );

      expect(() => {
        fireEvent.click(screen.getByTestId('widget-success-btn'));
      }).not.toThrow();
    });

    it('should format success message using intl', () => {
      render(
        <AddWorkerDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          nameTypes={mockNameTypes}
        />,
      );

      fireEvent.click(screen.getByTestId('widget-success-btn'));

      expect(mockFormatMessage).toHaveBeenCalledWith(
        {
          id: 'assignments.add_worker.success',
          defaultMessage: '{workerName} added successfully',
        },
        { workerName: 'Jane Doe' },
      );
    });
  });

  describe('Error Functionality', () => {
    it('should log error when adding worker fails', () => {
      render(
        <AddWorkerDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          nameTypes={mockNameTypes}
          context="normal"
        />,
      );

      fireEvent.click(screen.getByTestId('widget-error-btn'));

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Component="AddWorkerDrawer" Event="Failed to add worker" Context="normal"',
        {
          error: 'Validation failed',
        },
      );
    });

    it('should not call onClose on error (keep drawer open)', () => {
      render(
        <AddWorkerDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          nameTypes={mockNameTypes}
        />,
      );

      fireEvent.click(screen.getByTestId('widget-error-btn'));

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should not call onSuccess on error', () => {
      render(
        <AddWorkerDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          nameTypes={mockNameTypes}
        />,
      );

      fireEvent.click(screen.getByTestId('widget-error-btn'));

      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('should not call onRefetchData on error', () => {
      render(
        <AddWorkerDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          nameTypes={mockNameTypes}
          onRefetchData={mockOnRefetchData}
        />,
      );

      fireEvent.click(screen.getByTestId('widget-error-btn'));

      expect(mockOnRefetchData).not.toHaveBeenCalled();
    });

    it('should handle error object without message', () => {
      // Test that the error handler works even with non-Error objects
      render(
        <AddWorkerDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          nameTypes={mockNameTypes}
          context="normal"
        />,
      );

      fireEvent.click(screen.getByTestId('widget-error-no-message-btn'));

      // Verify that error was logged with the error object itself (not message)
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Component="AddWorkerDrawer" Event="Failed to add worker" Context="normal"',
        {
          error: { code: 'ERR_UNKNOWN' },
        },
      );
    });
  });

  describe('Context Prop', () => {
    it('should use normal context by default', () => {
      render(
        <AddWorkerDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          nameTypes={mockNameTypes}
        />,
      );

      fireEvent.click(screen.getByTestId('widget-success-btn'));

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Context="normal"'),
        expect.any(Object),
      );
    });

    it('should use detail context when provided', () => {
      render(
        <AddWorkerDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          nameTypes={mockNameTypes}
          context="detail"
        />,
      );

      fireEvent.click(screen.getByTestId('widget-success-btn'));

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Context="detail"'),
        expect.any(Object),
      );
    });
  });

  describe('Complete Flow', () => {
    it('should handle complete success flow', () => {
      render(
        <AddWorkerDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          nameTypes={mockNameTypes}
          onRefetchData={mockOnRefetchData}
          context="normal"
        />,
      );

      // Add worker
      fireEvent.click(screen.getByTestId('widget-success-btn'));

      // Verify all callbacks called in correct order
      expect(mockLogger.info).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
      expect(mockOnSuccess).toHaveBeenCalledWith('Jane Doe added successfully');
      expect(mockOnRefetchData).toHaveBeenCalled();
    });

    it('should handle close without adding worker', () => {
      render(
        <AddWorkerDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          nameTypes={mockNameTypes}
          onRefetchData={mockOnRefetchData}
        />,
      );

      // Close drawer
      fireEvent.click(screen.getByTestId('widget-close-btn'));

      // Only close should be called
      expect(mockOnClose).toHaveBeenCalled();
      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(mockOnRefetchData).not.toHaveBeenCalled();
    });
  });

  describe('Prop Combinations', () => {
    it('should work with all props provided', () => {
      expect(() => {
        render(
          <AddWorkerDrawer
            open
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
            nameTypes={mockNameTypes}
            onRefetchData={mockOnRefetchData}
            context="detail"
          />,
        );
      }).not.toThrow();
    });

    it('should work with minimal props (required only)', () => {
      expect(() => {
        render(
          <AddWorkerDrawer
            open
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
            nameTypes={mockNameTypes}
          />,
        );
      }).not.toThrow();
    });

    it('should work with open=false', () => {
      expect(() => {
        render(
          <AddWorkerDrawer
            open={false}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
            nameTypes={mockNameTypes}
          />,
        );
      }).not.toThrow();
    });
  });
});

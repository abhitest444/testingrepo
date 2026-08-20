import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContactDrawer } from 'src/js/widgets/weeklyTimeEntry/components/weeklyTimeEntryGridView/ContactDrawer';
import { DataAccess_ContactType } from 'src/__generated__/oigql/graphql';

// Mock the Redux hooks
const mockDispatch = jest.fn();
const mockUseAppDispatch = jest.fn(() => mockDispatch);

jest.mock('src/js/widgets/weeklyTimeEntry/store', () => ({
  useAppDispatch: () => mockUseAppDispatch(),
}));

// Mock the sandbox
const mockSubscribe = jest.fn().mockReturnValue('subscription-id');
const mockUnsubscribe = jest.fn();
const mockSandbox = {
  pubsub: {
    subscribe: mockSubscribe,
    unsubscribe: mockUnsubscribe,
  },
  logger: {
    log: jest.fn(),
  },
};

jest.mock('@payroll/quicksand', () => ({
  useSandbox: () => mockSandbox,
}));

// Mock the Widget component
jest.mock('web-shell-core/widgets/HOCWidget', () => ({
  __esModule: true,
  default: ({
    open,
    defaultName,
    onClose,
    onSuccess,
    onReady,
    widgetId,
  }: {
    open: boolean;
    defaultName: string;
    onClose: () => void;
    onSuccess: (data: any) => void;
    onReady?: () => void;
    widgetId: string;
  }) => {
    // Call onReady immediately to simulate AppFabric widget initialization
    if (onReady) {
      onReady();
    }

    return (
      <div data-testid="contact-drawer-widget" data-widget-id={widgetId}>
        <div data-testid="widget-open">{open.toString()}</div>
        <div data-testid="widget-default-name">{defaultName}</div>
        <button data-testid="widget-close" onClick={onClose}>
          Close
        </button>
        <button
          data-testid="widget-success"
          onClick={() =>
            onSuccess({ id: 'new-customer-123', displayName: 'New Customer' })
          }
        >
          Save Success
        </button>
        <button
          data-testid="widget-success-no-id"
          onClick={() => onSuccess({ displayName: 'Customer Without ID' })}
        >
          Save Success No ID
        </button>
      </div>
    );
  },
}));

describe('ContactDrawer', () => {
  const mockRowId = 'test-row-123';
  const mockDefaultName = 'Test Customer';
  const mockOnClose = jest.fn();
  const mockOnSelect = jest.fn();

  const defaultProps = {
    rowId: mockRowId,
    defaultName: mockDefaultName,
    onClose: mockOnClose,
    onSelect: mockOnSelect,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the contact drawer widget with correct props', () => {
      render(<ContactDrawer {...defaultProps} />);

      expect(screen.getByTestId('contact-drawer-widget')).toBeInTheDocument();
      expect(screen.getByTestId('widget-open')).toHaveTextContent('true');
      expect(screen.getByTestId('widget-default-name')).toHaveTextContent(
        mockDefaultName,
      );
      expect(screen.getByTestId('widget-close')).toBeInTheDocument();
      expect(screen.getByTestId('widget-success')).toBeInTheDocument();
    });

    it('renders with empty default name when not provided', () => {
      render(<ContactDrawer {...defaultProps} defaultName={undefined} />);

      expect(screen.getByTestId('widget-default-name')).toHaveTextContent('');
    });

    it('calls onClose callback when close button is clicked', () => {
      render(<ContactDrawer {...defaultProps} />);

      // Initially drawer should be open
      expect(screen.getByTestId('contact-drawer-widget')).toBeInTheDocument();

      // Close the drawer
      fireEvent.click(screen.getByTestId('widget-close'));

      // Should call onClose callback
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Drawer Close Handling', () => {
    it('calls onClose callback when drawer is closed', () => {
      render(<ContactDrawer {...defaultProps} />);

      fireEvent.click(screen.getByTestId('widget-close'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('works without onClose callback', () => {
      render(<ContactDrawer {...defaultProps} onClose={undefined} />);

      // Should not throw error when clicking close
      expect(() => {
        fireEvent.click(screen.getByTestId('widget-close'));
      }).not.toThrow();
    });
  });

  describe('Drawer Save Success Handling', () => {
    it('dispatches updateTimeAgainst and addCustomer actions when customer data has id', () => {
      render(<ContactDrawer {...defaultProps} />);

      fireEvent.click(screen.getByTestId('widget-success'));

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('timeEntryGrid/updateTimeAgainst'),
          payload: {
            rowId: mockRowId,
            timeAgainst: {
              type: DataAccess_ContactType.Customer,
              id: 'new-customer-123',
              displayName: 'New Customer',
            },
          },
        }),
      );

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('customers/addCustomer'),
          payload: {
            customer: {
              type: DataAccess_ContactType.Customer,
              displayName: 'New Customer',
              firstName: null,
              id: 'new-customer-123',
            },
          },
        }),
      );
    });

    it('calls onSelect callback after successful save', () => {
      render(<ContactDrawer {...defaultProps} />);

      fireEvent.click(screen.getByTestId('widget-success'));

      expect(mockOnSelect).toHaveBeenCalledTimes(1);
    });

    it('does not dispatch actions when customer data has no id', () => {
      render(<ContactDrawer {...defaultProps} />);

      fireEvent.click(screen.getByTestId('widget-success-no-id'));

      // Should not dispatch updateTimeAgainst or addCustomer actions
      expect(mockDispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('timeEntryGrid/updateTimeAgainst'),
        }),
      );

      expect(mockDispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('customers/addCustomer'),
        }),
      );
    });

    it('calls onClose callback after successful save', () => {
      render(<ContactDrawer {...defaultProps} />);

      fireEvent.click(screen.getByTestId('widget-success'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('works without onSelect callback', () => {
      render(<ContactDrawer {...defaultProps} onSelect={undefined} />);

      // Should not throw error when clicking save success
      expect(() => {
        fireEvent.click(screen.getByTestId('widget-success'));
      }).not.toThrow();
    });
  });

  describe('AppFabric Integration', () => {
    it('calls onReady callback to mark widget as ready', () => {
      const mockLogger = jest.fn();
      mockSandbox.logger.log = mockLogger;

      render(<ContactDrawer {...defaultProps} />);

      expect(mockLogger).toHaveBeenCalledWith('Contact drawer widget ready');
    });
  });

  describe('Accessibility', () => {
    it('has correct aria-hidden attribute', () => {
      render(<ContactDrawer {...defaultProps} />);

      const drawerContainer = screen.getByTestId(
        'contact-drawer-widget',
      ).parentElement;
      expect(drawerContainer).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Edge Cases', () => {
    it('handles component unmount during async operations', () => {
      let callback: any = null;

      mockSubscribe.mockImplementation((event, cb) => {
        if (event === 'datachanged-name') {
          callback = cb;
        }
        return 'subscription-id';
      });

      const { unmount } = render(<ContactDrawer {...defaultProps} />);

      // Unmount the component
      unmount();

      // Should not throw when trying to call the callback after unmount
      expect(() => {
        if (callback) {
          callback({
            contact: {
              id: 'test-customer',
              displayName: 'Test Customer',
            },
          });
        }
      }).not.toThrow();
    });
  });
});

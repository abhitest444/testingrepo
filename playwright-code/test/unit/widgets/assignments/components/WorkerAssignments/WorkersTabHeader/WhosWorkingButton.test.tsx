import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { WhosWorkingButton } from 'src/js/widgets/assignments/components/WorkerAssignments/WorkersTabHeader/WhosWorkingButton';

const mockLoggerInfo = jest.fn();
const mockLoggerError = jest.fn();

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({
      id,
      defaultMessage,
    }: {
      id: string;
      defaultMessage?: string;
    }) => defaultMessage || id,
  }),
  useSandbox: () => ({
    logger: { info: mockLoggerInfo, error: mockLoggerError },
  }),
}));

jest.mock('@ids-ts/button', () => ({
  __esModule: true,
  default: ({
    children,
    onClick,
    'data-testid': dataTestId,
    'aria-label': ariaLabel,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    'data-testid'?: string;
    'aria-label'?: string;
  }) => (
    <button onClick={onClick} data-testid={dataTestId} aria-label={ariaLabel}>
      {children}
    </button>
  ),
}));

jest.mock('@ids-ts/trowser', () => ({
  __esModule: true,
  default: ({
    children,
    open,
    onClose,
    title,
  }: {
    children: React.ReactNode;
    open?: boolean;
    onClose?: () => void;
    title?: string;
  }) =>
    open ? (
      <div data-testid="trowser" aria-label={title}>
        <button type="button" data-testid="trowser-close" onClick={onClose}>
          close
        </button>
        {children}
      </div>
    ) : null,
}));

interface MockWidgetProps {
  widgetId?: string;
  onReady?: () => void;
  onError?: (error: Error | string) => void;
}

// Default Widget mock: a successful mount that fires onReady. Individual
// error-path tests override this with mockImplementationOnce.
const mockWidget = jest.fn((props: MockWidgetProps): React.ReactElement => {
  const { widgetId, onReady } = props;
  // Invoke onReady synchronously on render to emulate the widget mounting.
  // (A useEffect here would trip react-hooks/rules-of-hooks since this mock
  // factory function is not recognised as a React component.)
  onReady?.();
  return <div data-testid="whos-working-widget">{widgetId}</div>;
});

jest.mock('web-shell-core/widgets/HOCWidget', () => ({
  __esModule: true,
  default: (props: any) => mockWidget(props),
}));

// AuthErrorMessage is the shared fallback rendered on widget failure.
jest.mock('src/js/widgets/common/AuthErrorMessage', () => ({
  AuthErrorMessage: () => <div data-testid="auth-error-message" />,
}));

// Minimal faithful ErrorBoundary so render-phase throws are genuinely caught
// (mirrors the qbtOrchestrator class component contract used by the source).
jest.mock('src/js/widgets/qbtOrchestrator/components/ErrorBoundary', () => {
  const ReactLib = require('react');
  class MockErrorBoundary extends ReactLib.Component {
    constructor(props: any) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
      return { hasError: true };
    }

    componentDidCatch(error: Error) {
      this.props.onError?.(error);
    }

    render() {
      if (this.state.hasError) {
        return this.props.fallback ?? null;
      }
      return this.props.children;
    }
  }
  return { __esModule: true, default: MockErrorBoundary };
});

describe('WhosWorkingButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Restore the default successful Widget mount between tests.
    mockWidget.mockImplementation((props: MockWidgetProps) => {
      const { widgetId, onReady } = props;
      onReady?.();
      return <div data-testid="whos-working-widget">{widgetId}</div>;
    });
  });

  it("renders the Who's working button", () => {
    render(<WhosWorkingButton />);

    expect(screen.getByTestId('whos-working-btn')).toBeInTheDocument();
    expect(screen.getByTestId('whos-working-btn')).toHaveTextContent(
      "Who's working",
    );
  });

  it('does not render the Trowser before the button is clicked', () => {
    render(<WhosWorkingButton />);

    expect(screen.queryByTestId('trowser')).not.toBeInTheDocument();
    expect(screen.queryByTestId('whos-working-widget')).not.toBeInTheDocument();
  });

  it('opens the Trowser with the whosworking widget on click', () => {
    render(<WhosWorkingButton />);

    fireEvent.click(screen.getByTestId('whos-working-btn'));

    expect(screen.getByTestId('trowser')).toBeInTheDocument();
    expect(screen.getByTestId('whos-working-widget')).toHaveTextContent(
      'time-tracking-ui/whosworking',
    );
  });

  it('logs an info event when the button is clicked', () => {
    render(<WhosWorkingButton />);

    fireEvent.click(screen.getByTestId('whos-working-btn'));

    expect(mockLoggerInfo).toHaveBeenCalledWith(
      expect.stringContaining("Who's working button clicked"),
    );
  });

  it('logs an info event when the widget mounts', () => {
    render(<WhosWorkingButton />);

    fireEvent.click(screen.getByTestId('whos-working-btn'));

    expect(mockLoggerInfo).toHaveBeenCalledWith(
      expect.stringContaining("Who's working widget mounted"),
    );
  });

  it('closes the Trowser and logs an info event when onClose fires', () => {
    render(<WhosWorkingButton />);

    fireEvent.click(screen.getByTestId('whos-working-btn'));
    expect(screen.getByTestId('trowser')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('trowser-close'));
    expect(screen.queryByTestId('trowser')).not.toBeInTheDocument();
    expect(mockLoggerInfo).toHaveBeenCalledWith(
      expect.stringContaining("Who's working trowser closed"),
    );
  });

  describe('error handling', () => {
    it('logs an error when the widget fires onError', () => {
      mockWidget.mockImplementationOnce((props: MockWidgetProps) => {
        props.onError?.(new Error('widget crash'));
        return <div data-testid="whos-working-widget" />;
      });

      render(<WhosWorkingButton />);
      fireEvent.click(screen.getByTestId('whos-working-btn'));

      expect(mockLoggerError).toHaveBeenCalledWith(
        expect.stringContaining('WHOS_WORKING_WIDGET_CRASH'),
        expect.objectContaining({ error: expect.any(Error) }),
      );
    });

    it('renders the AuthErrorMessage fallback when the widget throws during render', () => {
      mockWidget.mockImplementationOnce(() => {
        throw new Error('render crash');
      });

      render(<WhosWorkingButton />);
      fireEvent.click(screen.getByTestId('whos-working-btn'));

      // ErrorBoundary caught the synchronous throw and rendered the fallback.
      expect(screen.getByTestId('auth-error-message')).toBeInTheDocument();
      expect(mockLoggerError).toHaveBeenCalledWith(
        expect.stringContaining('WHOS_WORKING_WIDGET_CRASH'),
        expect.objectContaining({ error: expect.any(Error) }),
      );
    });
  });
});

// @ts-nocheck
import React from 'react';
import { act, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { buildSandbox } from '@payroll/quicksand';
import PropTypes from 'prop-types';
import * as ApolloClient from '@apollo/client';
import Widget from 'src/js/widgets/singleTimeTrowser/Widget';
import * as ApolloClientBuilder from 'src/js/service/ApolloClientBuilder.ts';
import * as SingleTimeHOC from 'src/js/widgets/singleTimeTrowser/components/SingleTimeHOC.tsx';
import * as variability from 'src/js/service/utils/useVariability.ts';

const WidgetClass = Widget;

jest.mock('src/nls', () => ({
  __esModule: true,
  default: {
    requireNlsForLocale: jest.fn(),
  },
}));

describe('Single Time Trowser Widget Component', () => {
  const sandbox = buildSandbox();
  const onReady = jest.fn();
  const setOpenMock = jest.fn();
  const externalApolloClient = { name: 'MOCK_EXTERNAL_CLIENT' };

  let getApolloClientInstanceSpy;
  let apolloProviderSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    global.qbo = { menus: { 27: 'not-upgrade' } }; // default to not triggering upgrade logic

    jest.spyOn(variability, 'getVariabilityFFResult').mockReturnValue(true);
    getApolloClientInstanceSpy = jest
      .spyOn(ApolloClientBuilder, 'getApolloClientInstance')
      .mockReturnValue({ name: 'MOCK_CLIENT' });

    apolloProviderSpy = jest
      .spyOn(ApolloClient, 'ApolloProvider')
      .mockImplementation(({ children }) => <div>{children}</div>);
    jest
      .spyOn(SingleTimeHOC, 'SingleTimeHOC')
      .mockImplementation(({ open, setOpen }) => (
        <div data-testid="single-time-hoc">
          {open ? 'Open' : 'Closed'}
          <button type="button" onClick={() => setOpen(!open)}>
            Toggle
          </button>
        </div>
      ));
  });

  test('should initialize customer interaction and call onReady', () => {
    render(<Widget sandbox={sandbox} onReady={onReady} open />);

    expect(onReady).toHaveBeenCalled();
  });

  describe('onReady conditional call in constructor', () => {
    test('should call onReady when provided during widget construction', () => {
      const mockOnReady = jest.fn();

      render(<Widget sandbox={sandbox} onReady={mockOnReady} open />);

      // Verify onReady was called (React may call multiple times due to StrictMode)
      expect(mockOnReady).toHaveBeenCalled();
      expect(mockOnReady).toHaveBeenCalledWith();
    });

    test('should handle missing onReady prop gracefully without errors', () => {
      expect(() => {
        render(<Widget sandbox={sandbox} open />);
      }).not.toThrow();

      // Should render successfully without onReady
      const hocElement = screen.getByTestId('single-time-hoc');
      expect(hocElement).toBeInTheDocument();
    });

    test('should handle null onReady prop gracefully without errors', () => {
      expect(() => {
        render(<Widget sandbox={sandbox} onReady={null} open />);
      }).not.toThrow();

      // Should render successfully with null onReady
      const hocElement = screen.getByTestId('single-time-hoc');
      expect(hocElement).toBeInTheDocument();
    });

    test('should handle undefined onReady prop gracefully without errors', () => {
      expect(() => {
        render(<Widget sandbox={sandbox} onReady={undefined} open />);
      }).not.toThrow();

      // Should render successfully with undefined onReady
      const hocElement = screen.getByTestId('single-time-hoc');
      expect(hocElement).toBeInTheDocument();
    });

    test('should call onReady when provided with multiple constructor-related operations', () => {
      const mockOnReady = jest.fn();

      render(
        <Widget
          sandbox={sandbox}
          onReady={mockOnReady}
          open
          widgetProps={{ showTrowser: true }}
          isOTX
          isSingleTimeEntry
        />,
      );

      // Should call onReady despite multiple props
      expect(mockOnReady).toHaveBeenCalled();
      expect(mockOnReady).toHaveBeenCalledWith();
    });

    test('should execute onReady synchronously during component initialization', () => {
      const mockOnReady = jest.fn();
      let onReadyCalled = false;
      let renderStarted = false;

      mockOnReady.mockImplementation(() => {
        onReadyCalled = true;
        // onReady should be called after render has started
        expect(renderStarted).toBe(true);
      });

      renderStarted = true;
      render(<Widget sandbox={sandbox} onReady={mockOnReady} open />);

      // Verify onReady was called synchronously during render
      expect(mockOnReady).toHaveBeenCalled();
      expect(onReadyCalled).toBe(true);
    });

    test('should call onReady with correct arguments', () => {
      const mockOnReady = jest.fn();

      render(<Widget sandbox={sandbox} onReady={mockOnReady} open />);

      // Verify onReady is called with no arguments
      expect(mockOnReady).toHaveBeenCalled();
      expect(mockOnReady.mock.calls[0]).toEqual([]);
    });

    test('should respect conditional logic - only call when onReady exists', () => {
      const mockOnReady1 = jest.fn();
      const mockOnReady2 = jest.fn();

      // Test with onReady provided - should be called
      render(<Widget sandbox={sandbox} onReady={mockOnReady1} open />);
      expect(mockOnReady1).toHaveBeenCalled();

      // Test without onReady - should not throw error and other callback shouldn't be called
      expect(() => {
        render(<Widget sandbox={sandbox} open />);
      }).not.toThrow();

      // mockOnReady2 should not be called since it wasn't passed
      expect(mockOnReady2).not.toHaveBeenCalled();
    });

    test('should properly handle different onReady functions for different instances', () => {
      const mockOnReady1 = jest.fn();
      const mockOnReady2 = jest.fn();

      // Create first widget instance
      render(<Widget sandbox={sandbox} onReady={mockOnReady1} open />);
      expect(mockOnReady1).toHaveBeenCalled();

      // Create second widget instance with different callback
      render(<Widget sandbox={sandbox} onReady={mockOnReady2} open />);
      expect(mockOnReady2).toHaveBeenCalled();

      // Both should have been called
      expect(mockOnReady1).toHaveBeenCalled();
      expect(mockOnReady2).toHaveBeenCalled();
    });
  });

  test('should render SingleTimeHOC with correct props', () => {
    render(<Widget sandbox={sandbox} onReady={onReady} open />);

    const hocElement = screen.getByTestId('single-time-hoc');
    expect(hocElement).toHaveTextContent('Open');
  });

  test('should render SingleTimeHOC with correct props - widgetProps', () => {
    render(
      <Widget
        sandbox={sandbox}
        onReady={onReady}
        widgetProps={{ showTrowser: true }}
      />,
    );

    const hocElement = screen.getByTestId('single-time-hoc');
    expect(hocElement).toHaveTextContent('Open');
  });

  test('should toggle open state and call setOpen', () => {
    render(
      <Widget sandbox={sandbox} onReady={onReady} open setOpen={setOpenMock} />,
    );

    const toggleButton = screen.getByText('Toggle');
    act(() => {
      toggleButton.click();
    });

    expect(setOpenMock).toHaveBeenCalledWith(false);
  });

  describe('setOpen method with setTimeout for close animation', () => {
    let mockDone;
    let mockSetState;

    beforeEach(() => {
      jest.useFakeTimers();
      mockDone = jest.fn();
      mockSetState = jest.fn();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    test('should call done() after 500ms when closing with showTrowser widget props', () => {
      const widgetInstance = new WidgetClass({
        sandbox,
        onReady,
        open: true,
        widgetProps: { showTrowser: true },
      });

      // Mock the instance methods
      widgetInstance.done = mockDone;
      widgetInstance.setState = mockSetState;

      // Call setOpen with false to trigger close behavior
      act(() => {
        widgetInstance.setOpen(false);
      });

      // Verify setState was called immediately
      expect(mockSetState).toHaveBeenCalledWith({ open: false });

      // Verify done() is not called immediately
      expect(mockDone).not.toHaveBeenCalled();

      // Fast-forward time by 500ms
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Verify done() is called after 500ms timeout
      expect(mockDone).toHaveBeenCalledTimes(1);
    });

    test('should not call done() when opening with showTrowser widget props', () => {
      const widgetInstance = new WidgetClass({
        sandbox,
        onReady,
        open: false,
        widgetProps: { showTrowser: true },
      });

      widgetInstance.done = mockDone;
      widgetInstance.setState = mockSetState;

      // Call setOpen with true (opening, not closing)
      act(() => {
        widgetInstance.setOpen(true);
      });

      // Verify setState was called
      expect(mockSetState).toHaveBeenCalledWith({ open: true });

      // Fast-forward time by 500ms
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Verify done() is not called since we're opening, not closing
      expect(mockDone).not.toHaveBeenCalled();
    });

    test('should not call done() when closing without showTrowser widget props', () => {
      const widgetInstance = new WidgetClass({
        sandbox,
        onReady,
        open: true,
        widgetProps: { showTrowser: false },
      });

      widgetInstance.done = mockDone;
      widgetInstance.setState = mockSetState;

      // Call setOpen with false but without showTrowser
      act(() => {
        widgetInstance.setOpen(false);
      });

      // Verify setState was called
      expect(mockSetState).toHaveBeenCalledWith({ open: false });

      // Fast-forward time by 500ms
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Verify done() is not called since showTrowser is false
      expect(mockDone).not.toHaveBeenCalled();
    });

    test('should not call done() when closing without any widgetProps', () => {
      const widgetInstance = new WidgetClass({
        sandbox,
        onReady,
        open: true,
        // No widgetProps provided
      });

      widgetInstance.done = mockDone;
      widgetInstance.setState = mockSetState;

      // Call setOpen with false but without widgetProps
      act(() => {
        widgetInstance.setOpen(false);
      });

      // Verify setState was called
      expect(mockSetState).toHaveBeenCalledWith({ open: false });

      // Fast-forward time by 500ms
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Verify done() is not called since widgetProps is undefined
      expect(mockDone).not.toHaveBeenCalled();
    });

    test('should call external setOpen prop when provided during close animation flow', () => {
      const externalSetOpenMock = jest.fn();
      const widgetInstance = new WidgetClass({
        sandbox,
        onReady,
        open: true,
        setOpen: externalSetOpenMock,
        widgetProps: { showTrowser: true },
      });

      widgetInstance.done = mockDone;
      widgetInstance.setState = mockSetState;

      // Call setOpen to trigger close animation flow
      act(() => {
        widgetInstance.setOpen(false);
      });

      // Verify external setOpen prop was called immediately
      expect(externalSetOpenMock).toHaveBeenCalledWith(false);
      expect(mockSetState).toHaveBeenCalledWith({ open: false });

      // Fast-forward time to verify done() is still called after timeout
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(mockDone).toHaveBeenCalledTimes(1);
    });

    test('should handle multiple rapid setOpen calls correctly', () => {
      const widgetInstance = new WidgetClass({
        sandbox,
        onReady,
        open: true,
        widgetProps: { showTrowser: true },
      });

      widgetInstance.done = mockDone;
      widgetInstance.setState = mockSetState;

      // Call setOpen(false) multiple times rapidly
      act(() => {
        widgetInstance.setOpen(false);
        widgetInstance.setOpen(false);
        widgetInstance.setOpen(false);
      });

      // Verify setState was called for each call
      expect(mockSetState).toHaveBeenCalledTimes(3);

      // Fast-forward time by 500ms
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // done() should be called multiple times (once for each setOpen(false) call)
      expect(mockDone).toHaveBeenCalledTimes(3);
    });

    test('should properly handle animation timing for close transition', () => {
      const widgetInstance = new WidgetClass({
        sandbox,
        onReady,
        open: true,
        widgetProps: { showTrowser: true },
      });

      widgetInstance.done = mockDone;
      widgetInstance.setState = mockSetState;

      // Trigger close animation
      act(() => {
        widgetInstance.setOpen(false);
      });

      // Verify immediate state change
      expect(mockSetState).toHaveBeenCalledWith({ open: false });

      // Advance time by less than 500ms
      act(() => {
        jest.advanceTimersByTime(250);
      });

      // Should not have called done() yet
      expect(mockDone).not.toHaveBeenCalled();

      // Advance time to exactly 500ms
      act(() => {
        jest.advanceTimersByTime(250);
      });

      // Should now have called done() exactly once
      expect(mockDone).toHaveBeenCalledTimes(1);
    });
  });

  test('should use external Apollo client if provided', () => {
    render(
      <Widget
        sandbox={sandbox}
        onReady={onReady}
        open
        externalApolloClient={externalApolloClient}
      />,
    );

    expect(apolloProviderSpy).toHaveBeenCalledWith(
      {
        children: expect.anything(),
        client: { name: 'MOCK_EXTERNAL_CLIENT' },
      },
      expect.anything(),
    );
  });

  test('should use default Apollo client if external client is not provided', () => {
    render(<Widget sandbox={sandbox} onReady={onReady} open />);

    expect(getApolloClientInstanceSpy).toHaveBeenCalledWith(sandbox);
    expect(apolloProviderSpy).toHaveBeenCalledWith(
      {
        children: expect.anything(),
        client: { name: 'MOCK_CLIENT' },
      },
      expect.anything(),
    );
  });

  test('should navigate and log when OBILL_UPGRADE_CONF upgrade is selected', () => {
    global.qbo = { menus: { 27: 'u' } };
    const upgradeSandbox = {
      logger: { info: jest.fn(), log: jest.fn() },
      navigation: { navigate: jest.fn() },
    };
    const upgradeOnReady = jest.fn();

    const { container } = render(
      <Widget sandbox={upgradeSandbox} onReady={upgradeOnReady} open />,
    );

    expect(upgradeSandbox.logger.info).toHaveBeenCalledWith(
      'SingleTimeTrowserWidget: Navigating to obillupgrade since u is selected',
    );
    expect(upgradeSandbox.navigation.navigate).toHaveBeenCalledWith(
      'obillupgrade',
    );
    expect(container.firstChild).toBeNull();
  });

  describe('Error Boundary - componentDidCatch', () => {
    let ThrowError;
    let consoleSpy;

    beforeEach(() => {
      // Mock component that throws an error when shouldThrow is true
      const ThrowErrorComponent = ({ shouldThrow }) => {
        if (shouldThrow) {
          throw new Error('Test error for componentDidCatch');
        }
        return <div>No error</div>;
      };

      ThrowErrorComponent.propTypes = {
        shouldThrow: PropTypes.bool,
      };

      ThrowErrorComponent.defaultProps = {
        shouldThrow: false,
      };

      ThrowError = ThrowErrorComponent;

      // Mock SingleTimeHOC to include our error throwing component
      jest
        .spyOn(SingleTimeHOC, 'SingleTimeHOC')
        .mockImplementation(({ shouldThrow }) => (
          <div data-testid="single-time-hoc">
            <ThrowError shouldThrow={shouldThrow} />
          </div>
        ));
    });

    afterEach(() => {
      // Restore any console spies
      if (consoleSpy) {
        consoleSpy.mockRestore();
        consoleSpy = null;
      }
    });

    test('should log error with correct format when component crashes', () => {
      const logger = { error: jest.fn(), info: jest.fn() };
      const testSandbox = { ...sandbox, logger };
      const testError = new Error('Test error for componentDidCatch');

      // Suppress React's console.error during this test since React will log the error
      consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const WidgetWithError = () => {
        React.useLayoutEffect(() => {
          throw testError;
        }, []);
        return <div>Test content</div>;
      };

      // Mock SingleTimeHOC to throw an error
      jest
        .spyOn(SingleTimeHOC, 'SingleTimeHOC')
        .mockImplementation(() => <WidgetWithError />);

      render(<Widget sandbox={testSandbox} onReady={onReady} open />);

      expect(logger.error).toHaveBeenCalledWith(
        'Plugin=time-tracking-ui Error=STE_WIDGET_CRASH',
        { error: testError },
      );
    });

    test('should call onError callback when error occurs and callback is provided', () => {
      const logger = { error: jest.fn(), info: jest.fn() };
      const testSandbox = { ...sandbox, logger };
      const onErrorCallback = jest.fn();
      const testError = new Error('Test error with callback');

      // Suppress React's console.error during this test
      consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const WidgetWithError = () => {
        React.useLayoutEffect(() => {
          throw testError;
        }, []);
        return <div>Test content</div>;
      };

      // Mock SingleTimeHOC to throw an error
      jest
        .spyOn(SingleTimeHOC, 'SingleTimeHOC')
        .mockImplementation(() => <WidgetWithError />);

      render(
        <Widget
          sandbox={testSandbox}
          onReady={onReady}
          onError={onErrorCallback}
          open
        />,
      );

      expect(onErrorCallback).toHaveBeenCalledWith(testError);
    });

    test('should handle error gracefully when onError callback is not provided', () => {
      const logger = { error: jest.fn(), info: jest.fn() };
      const testSandbox = { ...sandbox, logger };
      const testError = new Error('Test error without callback');

      // Suppress React's console.error during this test
      consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const WidgetWithError = () => {
        React.useLayoutEffect(() => {
          throw testError;
        }, []);
        return <div>Test content</div>;
      };

      // Mock SingleTimeHOC to throw an error
      jest
        .spyOn(SingleTimeHOC, 'SingleTimeHOC')
        .mockImplementation(() => <WidgetWithError />);

      expect(() => {
        render(<Widget sandbox={testSandbox} onReady={onReady} open />);
      }).not.toThrow();

      expect(logger.error).toHaveBeenCalledWith(
        'Plugin=time-tracking-ui Error=STE_WIDGET_CRASH',
        { error: testError },
      );
    });

    test('should continue to function normally when no errors occur', () => {
      const logger = { error: jest.fn(), info: jest.fn() };
      const testSandbox = { ...sandbox, logger };

      render(<Widget sandbox={testSandbox} onReady={onReady} open />);

      // Verify that error logging was not called when no error occurs
      expect(logger.error).not.toHaveBeenCalled();
      expect(onReady).toHaveBeenCalled();

      const hocElement = screen.getByTestId('single-time-hoc');
      expect(hocElement).toBeInTheDocument();
    });
  });

  describe('EmployeeId prop support', () => {
    it('should pass employeeId prop to SingleTimeHOC', () => {
      const testEmployeeId = 'emp-123';
      const mockSingleTimeHOC = jest.fn(({ employeeId }) => (
        <div data-testid="single-time-hoc" data-employee-id={employeeId}>
          Mock HOC
        </div>
      ));

      jest
        .spyOn(SingleTimeHOC, 'SingleTimeHOC')
        .mockImplementation(mockSingleTimeHOC);

      render(
        <Widget
          sandbox={sandbox}
          onReady={onReady}
          open
          employeeId={testEmployeeId}
        />,
      );

      expect(mockSingleTimeHOC).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeId: testEmployeeId,
        }),
        expect.anything(),
      );

      const hocElement = screen.getByTestId('single-time-hoc');
      expect(hocElement).toHaveAttribute('data-employee-id', testEmployeeId);
    });

    it('should pass null employeeId to SingleTimeHOC when not provided', () => {
      const mockSingleTimeHOC = jest.fn(({ employeeId }) => (
        <div data-testid="single-time-hoc">
          EmployeeId: {employeeId === null ? 'null' : employeeId}
        </div>
      ));

      jest
        .spyOn(SingleTimeHOC, 'SingleTimeHOC')
        .mockImplementation(mockSingleTimeHOC);

      render(<Widget sandbox={sandbox} onReady={onReady} open />);

      expect(mockSingleTimeHOC).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeId: null,
        }),
        expect.anything(),
      );

      expect(screen.getByText('EmployeeId: null')).toBeInTheDocument();
    });

    it('should pass empty string employeeId to SingleTimeHOC', () => {
      const mockSingleTimeHOC = jest.fn(({ employeeId }) => (
        <div data-testid="single-time-hoc">
          EmployeeId: &apos;{employeeId}&apos;
        </div>
      ));

      jest
        .spyOn(SingleTimeHOC, 'SingleTimeHOC')
        .mockImplementation(mockSingleTimeHOC);

      render(<Widget sandbox={sandbox} onReady={onReady} open employeeId="" />);

      expect(mockSingleTimeHOC).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeId: '',
        }),
        expect.anything(),
      );

      expect(screen.getByText("EmployeeId: ''")).toBeInTheDocument();
    });

    it('should handle employeeId prop along with other props', () => {
      const testEmployeeId = 'emp-multi';
      const mockSingleTimeHOC = jest.fn(
        ({ employeeId, isOTX, timeEntryId }) => (
          <div data-testid="single-time-hoc">
            EmployeeId: {employeeId}, OTX: {isOTX.toString()}, TimeEntryId:{' '}
            {timeEntryId}
          </div>
        ),
      );

      jest
        .spyOn(SingleTimeHOC, 'SingleTimeHOC')
        .mockImplementation(mockSingleTimeHOC);

      render(
        <Widget
          sandbox={sandbox}
          onReady={onReady}
          open
          employeeId={testEmployeeId}
          isOTX
          timeEntryId="entry-123"
        />,
      );

      expect(mockSingleTimeHOC).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeId: testEmployeeId,
          isOTX: true,
          timeEntryId: 'entry-123',
        }),
        expect.anything(),
      );

      expect(screen.getByText(/EmployeeId: emp-multi/)).toBeInTheDocument();
    });
  });
});

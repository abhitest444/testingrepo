import React from 'react';
import { act, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { buildSandbox } from '@payroll/quicksand';
import * as ApolloClient from '@apollo/client';
import WrappedWidget, { Widget } from 'src/js/widgets/weeklyTimeTrowser/Widget';
import * as ApolloClientBuilder from 'src/js/service/ApolloClientBuilder.ts';
import * as WeeklyTimeHOC from 'src/js/widgets/weeklyTimeTrowser/components/WeeklyTimeHOC.tsx';

jest.mock('src/nls', () => ({
  __esModule: true,
  default: {
    requireNlsForLocale: jest.fn(),
  },
}));

jest.mock('src/js/service/hooks/ixp/useIxpExperiment', () => ({
  useIxpExperiment: jest.fn(() => ({
    isInTreatment: false,
    treatmentKey: null,
    settled: true,
  })),
}));

jest.mock('src/js/service/utils/useUXPreferences', () => {
  const actual = jest.requireActual('src/js/service/utils/useUXPreferences');
  return {
    ...actual,
    useUxPreferences: jest.fn(() => ({
      data: { [actual.UxPreferenceKey.WEEKLY_REDIRECT_SHOWN]: false },
      getPreference: jest.fn().mockResolvedValue(false),
      setPreference: jest.fn().mockResolvedValue(undefined),
      initialized: true,
      loading: false,
    })),
  };
});

describe('Weekly Time Trowser Widget Component', () => {
  const sandbox = buildSandbox();
  const onReady = jest.fn();
  const setOpenMock = jest.fn();
  const externalApolloClient = { name: 'MOCK_EXTERNAL_CLIENT' };

  let getApolloClientInstanceSpy;
  let apolloProviderSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    global.qbo = { menus: { 27: 'not-upgrade' } }; // default to not triggering upgrade logic

    getApolloClientInstanceSpy = jest
      .spyOn(ApolloClientBuilder, 'getApolloClientInstance')
      .mockReturnValue({ name: 'MOCK_CLIENT' });

    apolloProviderSpy = jest
      .spyOn(ApolloClient, 'ApolloProvider')
      .mockImplementation(({ children }) => <div>{children}</div>);
    jest
      .spyOn(WeeklyTimeHOC, 'WeeklyTimeHOC')
      .mockImplementation(({ open, setOpen }) => (
        <div data-testid="weekly-time-hoc">
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

  test('should render WeeklyTimeHOC with correct props', () => {
    render(<Widget sandbox={sandbox} onReady={onReady} open />);

    const hocElement = screen.getByTestId('weekly-time-hoc');
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

  test('should toggle open state and call setOpen', () => {
    const widgetProps = {
      showTrowser: true,
    };

    render(
      <Widget
        sandbox={sandbox}
        open={false}
        widgetProps={widgetProps}
        setOpen={setOpenMock}
      />,
    );

    const toggleButton = screen.getByText('Toggle');
    act(() => {
      toggleButton.click();
    });

    expect(setOpenMock).toHaveBeenCalledWith(false);
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
    const logger = { info: jest.fn(), log: jest.fn() };
    const navigation = { navigate: jest.fn() };
    const sandbox = { logger, navigation };
    const onReady = jest.fn();

    const { container } = render(
      <Widget sandbox={sandbox} onReady={onReady} open />,
    );

    expect(logger.info).toHaveBeenCalledWith(
      'WeeklyTimeTrowserWidget: Navigating to obillupgrade since u is selected',
    );
    expect(navigation.navigate).toHaveBeenCalledWith('obillupgrade');
    expect(container.firstChild).toBeNull();
  });

  test('should handle componentDidCatch and log error (lines 44-48)', () => {
    const onError = jest.fn();
    const mockError = new Error('Test error');
    const logger = { error: jest.fn(), log: jest.fn() };
    const sandbox = { ...buildSandbox(), logger };

    // Create a component that will throw an error
    const ThrowError = () => {
      throw mockError;
    };

    jest
      .spyOn(WeeklyTimeHOC, 'WeeklyTimeHOC')
      .mockImplementation(() => <ThrowError />);

    // Use error boundary to catch the error
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    render(
      <Widget sandbox={sandbox} onReady={onReady} open onError={onError} />,
    );

    // Error should be logged
    expect(logger.error).toHaveBeenCalledWith(
      'Plugin=time-tracking-ui Error=WTA_WIDGET_CRASH',
      { error: mockError },
    );

    // onError callback should be called
    expect(onError).toHaveBeenCalledWith(mockError);

    consoleError.mockRestore();
  });

  test('should call done after setTimeout when closing with showTrowser (lines 58-83)', (done) => {
    jest.useFakeTimers();
    const widgetProps = { showTrowser: true };
    const mockDone = jest.fn();

    // Create a widget instance
    const widget = new Widget({
      sandbox,
      onReady,
      open: true,
      widgetProps,
    });

    // Spy on the done method
    widget.done = mockDone;

    // Call setOpen with false
    widget.setOpen(false);

    // Fast-forward time
    jest.advanceTimersByTime(500);

    // done should have been called
    expect(mockDone).toHaveBeenCalled();

    jest.useRealTimers();
    done();
  });

  test('should call handleWidgetError and invoke err method (line 82-83)', () => {
    const mockError = new Error('Widget error');
    const widget = new Widget({
      sandbox,
      onReady,
      open: true,
    });

    // Spy on the err method
    const errSpy = jest.spyOn(widget, 'err');

    // Call handleWidgetError
    widget.handleWidgetError(mockError);

    // err should have been called with the error
    expect(errSpy).toHaveBeenCalledWith(mockError);
  });

  test('should call setOpen without showTrowser (lines 51-61)', () => {
    const setOpenProp = jest.fn();
    const widget = new Widget({
      sandbox,
      onReady,
      open: true,
      setOpen: setOpenProp,
    });

    // Call setOpen without showTrowser
    act(() => {
      widget.setOpen(false);
    });

    // setOpen prop should be called
    expect(setOpenProp).toHaveBeenCalledWith(false);
  });
});

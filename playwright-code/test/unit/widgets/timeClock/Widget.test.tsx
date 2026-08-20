import React from 'react';
import { act, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { buildSandbox } from '@payroll/quicksand';
import * as ApolloClient from '@apollo/client';
import { ApolloClient as ApolloClientType } from '@apollo/client';
import { QuickbooksOnlineSandbox } from '@appfabric/sandbox-spec';
import Widget from 'src/js/widgets/timeClock/Widget';
import * as ApolloClientBuilder from 'src/js/service/ApolloClientBuilder';
import * as TimeActionViewHOC from 'src/js/widgets/timeClock/components/TimeActionViewHOC';

jest.mock('src/nls', () => ({
  __esModule: true,
  default: {
    requireNlsForLocale: jest.fn(),
  },
}));

// Mock TimeClockContent so we don't pull in its Suspense/lazy chain or the new
// FF + worker-resolver hooks. The Widget tests below only assert the Widget's
// orchestration (Apollo client wiring, error handling, and that
// TimeActionViewHOC is rendered with the right props).
jest.mock('src/js/widgets/timeClock/components/TimeClockContent', () => ({
  __esModule: true,
  default: ({ options, open, onClick, setHasError }: any) => {
    // eslint-disable-next-line global-require
    const TimeActionViewHOCMod = require('src/js/widgets/timeClock/components/TimeActionViewHOC');
    const TimeActionViewHOCDefault = TimeActionViewHOCMod.default;
    if (
      options.feature === 'time-action' &&
      options.functionality === 'action-button'
    ) {
      return (
        <TimeActionViewHOCDefault
          open={open}
          onClick={onClick}
          setHasError={setHasError}
        />
      );
    }
    return null;
  },
}));

describe('Time Action Widget Component', () => {
  const sandbox = buildSandbox() as unknown as QuickbooksOnlineSandbox;
  const onReady = jest.fn();
  const onClick = jest.fn();
  const setHasError = jest.fn();
  const mockApolloClient = new ApolloClientType({
    cache: new ApolloClient.InMemoryCache(),
  });
  const externalApolloClient = mockApolloClient;

  let getApolloClientInstanceSpy: jest.SpyInstance;
  let apolloProviderSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    getApolloClientInstanceSpy = jest
      .spyOn(ApolloClientBuilder, 'getApolloClientInstance')
      .mockReturnValue(mockApolloClient);

    apolloProviderSpy = jest
      .spyOn(ApolloClient, 'ApolloProvider')
      .mockImplementation(({ children }) => <div>{children}</div>);

    jest
      .spyOn(TimeActionViewHOC, 'default')
      .mockImplementation(({ onClick, open, setHasError }) => (
        <div data-testid="time-action-hoc">
          {open ? 'Open' : 'Closed'}
          <button
            type="button"
            onClick={() => {
              setHasError?.(new Error('test error'));
              onClick();
            }}
          >
            Action
          </button>
        </div>
      ));
  });

  test('should initialize and call onReady', () => {
    render(
      <Widget
        sandbox={sandbox}
        options={{ feature: 'time-action', functionality: 'action-button' }}
        onReady={onReady}
        onClick={onClick}
        open={false}
      />,
    );
    expect(onReady).toHaveBeenCalled();
  });

  test('should render TimeActionViewHOC with correct props when open', () => {
    render(
      <Widget
        sandbox={sandbox}
        options={{ feature: 'time-action', functionality: 'action-button' }}
        onReady={onReady}
        onClick={onClick}
        open
      />,
    );
    const hocElement = screen.getByTestId('time-action-hoc');
    expect(hocElement).toHaveTextContent('Open');
  });

  test('should render TimeActionViewHOC with correct props when closed', () => {
    render(
      <Widget
        sandbox={sandbox}
        options={{ feature: 'time-action', functionality: 'action-button' }}
        onReady={onReady}
        onClick={onClick}
        open={false}
      />,
    );
    const hocElement = screen.getByTestId('time-action-hoc');
    expect(hocElement).toHaveTextContent('Closed');
  });

  test('should use external Apollo client when provided', () => {
    render(
      <Widget
        sandbox={sandbox}
        options={{ feature: 'time-action', functionality: 'action-button' }}
        onReady={onReady}
        onClick={onClick}
        open={false}
        externalApolloClient={externalApolloClient}
      />,
    );
    expect(getApolloClientInstanceSpy).not.toHaveBeenCalled();
    expect(apolloProviderSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        client: externalApolloClient,
      }),
      expect.anything(),
    );
  });

  test('should use internal Apollo client when no external client provided', () => {
    render(
      <Widget
        sandbox={sandbox}
        options={{ feature: 'time-action', functionality: 'action-button' }}
        onReady={onReady}
        onClick={onClick}
        open={false}
      />,
    );
    expect(getApolloClientInstanceSpy).toHaveBeenCalledWith(sandbox);
    expect(apolloProviderSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        client: mockApolloClient,
      }),
      expect.anything(),
    );
  });

  test('should handle click events', () => {
    render(
      <Widget
        sandbox={sandbox}
        options={{ feature: 'time-action', functionality: 'action-button' }}
        onReady={onReady}
        onClick={onClick}
        setHasError={setHasError}
        open={false}
      />,
    );
    const actionButton = screen.getByRole('button');
    actionButton.click();
    expect(setHasError).toHaveBeenCalled();
    expect(onClick).toHaveBeenCalled();
  });

  test('should handle OTX mode', () => {
    render(
      <Widget
        sandbox={sandbox}
        options={{ feature: 'time-action', functionality: 'action-button' }}
        onReady={onReady}
        onClick={onClick}
        open={false}
        isOTX
      />,
    );
    expect(screen.getByTestId('time-action-hoc')).toBeInTheDocument();
  });

  test('should handle widget props showTrowser', () => {
    render(
      <Widget
        sandbox={sandbox}
        options={{ feature: 'time-action', functionality: 'action-button' }}
        onReady={onReady}
        onClick={onClick}
        open={false}
        widgetProps={{ showTrowser: true }}
      />,
    );
    expect(screen.getByTestId('time-action-hoc')).toBeInTheDocument();
  });

  describe('handleError', () => {
    let widgetRef: React.RefObject<any>;

    beforeEach(() => {
      widgetRef = React.createRef();
    });

    test('should log error and call setHasError prop if provided', () => {
      const setHasError = jest.fn();
      render(
        <Widget
          ref={widgetRef}
          sandbox={sandbox}
          options={{ feature: 'time-action', functionality: 'action-button' }}
          onReady={onReady}
          onClick={onClick}
          open={false}
          setHasError={setHasError}
        />,
      );
      const error = new Error('test error');

      act(() => {
        widgetRef.current?.handleError(error);
      });

      expect(sandbox.logger.error).toHaveBeenCalledWith(
        '[CLOCK_IN_FLOW] - TimeActionView Widget - Error',
        { error },
      );
      expect(setHasError).toHaveBeenCalledWith(error);
    });

    test('should only log error if setHasError prop is not provided', () => {
      render(
        <Widget
          ref={widgetRef}
          sandbox={sandbox}
          options={{ feature: 'time-action', functionality: 'action-button' }}
          onReady={onReady}
          onClick={onClick}
          open={false}
        />,
      );
      const error = new Error('test error');

      act(() => {
        widgetRef.current?.handleError(error);
      });

      expect(sandbox.logger.error).toHaveBeenCalledWith(
        '[CLOCK_IN_FLOW] - TimeActionView Widget - Error',
        { error },
      );
    });
  });
});

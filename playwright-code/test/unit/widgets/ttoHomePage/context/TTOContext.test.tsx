import React from 'react';
import { screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import {
  TTOProvider,
  useTTOContext,
} from 'src/js/widgets/ttoHomePage/context/TTOContext';
import {
  renderWithAllAppProviders,
  getDefaultSandbox,
} from 'test/unit/testUtils';

import { useCompanySettings } from 'src/js/service/hooks/settings/useCompanySettings';
import {
  useTimeTrackingBatchAuthorization,
  computeTimeTrackingOnlyUser,
} from 'src/js/service/utils/useTimeTrackingAuthorization';
import { useTTOTimeWindowDuration } from 'src/js/widgets/ttoHomePage/features/details-page/useTTOTimeWindowDuration';

jest.mock('src/nls', () => ({
  __esModule: true,
  default: {
    requireNlsForLocale: jest.fn().mockReturnValue({}),
  },
}));

jest.mock('src/js/service/hooks/settings/useCompanySettings', () => ({
  useCompanySettings: jest.fn(),
}));
jest.mock('src/js/service/utils/useTimeTrackingAuthorization', () => ({
  useTimeTrackingBatchAuthorization: jest.fn(),
  computeTimeTrackingOnlyUser: jest.fn(),
}));
jest.mock(
  'src/js/widgets/ttoHomePage/features/details-page/useTTOTimeWindowDuration',
  () => ({
    useTTOTimeWindowDuration: jest.fn(),
  }),
);

const mockSandbox = getDefaultSandbox();

const TestComponent = () => {
  const ctx = useTTOContext();
  return (
    <>
      <div data-testid="context-value">{ctx.userName}</div>
      <div data-testid="is-authorized">{String(ctx.isAuthorized)}</div>
      <div data-testid="auth-loading">{String(ctx.authLoading)}</div>
    </>
  );
};

const setupSandbox = (overrides = {}) => {
  const sandbox = getDefaultSandbox();
  // Mock company info
  sandbox.extensions.qbo.context.getCompanyInfo = jest
    .fn()
    .mockReturnValue({ name: 'Test Company' });
  // Mock user profile
  sandbox.appContext.getUserProfile = jest
    .fn()
    .mockResolvedValue({ firstName: 'Jane', lastName: 'Doe' });
  // Expense enabled
  sandbox.extensions.qbo.context.getCompanyL10nInfo = jest
    .fn()
    .mockReturnValue({ defaultDateFormat: 'mm/dd/yyyy' });
  Object.assign(sandbox, overrides);
  return sandbox;
};

// Mock getWeekRangeAndMonthLabel and isExpenseManagementAddonEnabled at the top
jest.mock('src/js/widgets/ttoHomePage/utils', () => ({
  getWeekRangeAndMonthLabel: jest.fn(() => ({
    weekRange: 'May 1-7',
    monthLabel: 'May 2024',
  })),
}));
jest.mock('@wfexpmgmt-explifemgmt/expense-mgmt-utils', () => ({
  isExpenseManagementAddonEnabled: jest.fn(() => true),
  canSubmitExpenseClaim: jest.fn().mockResolvedValue(true),
}));

// Always mock useCompanySettings for all tests
beforeEach(() => {
  (useCompanySettings as jest.Mock).mockReturnValue({
    settingsData: { firstDayOfWeek: 1 },
  });
  jest.clearAllMocks();
});

describe('TTOProvider', () => {
  it('provides context value to children', async () => {
    (useTimeTrackingBatchAuthorization as jest.Mock).mockReturnValue({
      data: {},
    });
    (computeTimeTrackingOnlyUser as jest.Mock).mockReturnValue('user-123');
    (useTTOTimeWindowDuration as jest.Mock).mockImplementation(() => [
      jest.fn(),
      { duration: 5, loading: false, error: null },
    ]);
    renderWithAllAppProviders(
      <TTOProvider sandbox={mockSandbox}>
        <TestComponent />
      </TTOProvider>,
    );
    expect(await screen.findByTestId('context-value')).toHaveTextContent(
      'Joe Bloggs',
    );
  });
});

describe('TTOProvider (extended)', () => {
  it('provides companyName and isExpenseEnabled from sandbox', async () => {
    (useTimeTrackingBatchAuthorization as jest.Mock).mockReturnValue({
      data: {},
    });
    (computeTimeTrackingOnlyUser as jest.Mock).mockReturnValue('user-123');
    (useTTOTimeWindowDuration as jest.Mock).mockImplementation(() => [
      jest.fn(),
      { duration: 5, loading: false, error: null },
    ]);
    const sandbox = setupSandbox();
    const TestComponent = () => {
      const ctx = useTTOContext();
      return (
        <>
          <div data-testid="companyName">{ctx.companyName}</div>
          <div data-testid="isExpenseEnabled">
            {ctx.isExpenseEnabled ? 'yes' : 'no'}
          </div>
        </>
      );
    };
    await act(async () => {
      renderWithAllAppProviders(
        <TTOProvider sandbox={sandbox}>
          <TestComponent />
        </TTOProvider>,
      );
    });
    expect(await screen.findByTestId('companyName')).toHaveTextContent(
      'Test Company',
    );
    expect(await screen.findByTestId('isExpenseEnabled')).toHaveTextContent(
      'yes',
    );
  });

  it('provides weekDuration, monthDuration, and loading states', async () => {
    (useTimeTrackingBatchAuthorization as jest.Mock).mockReturnValue({
      data: {},
    });
    (computeTimeTrackingOnlyUser as jest.Mock).mockReturnValue('user-123');
    (useTTOTimeWindowDuration as jest.Mock).mockReset();
    (useTTOTimeWindowDuration as jest.Mock).mockImplementation(() => [
      jest.fn(),
      { duration: 10, loading: false, error: null },
    ]);
    const sandbox = setupSandbox();
    const TestComponent = () => {
      const ctx = useTTOContext();
      return (
        <>
          <div data-testid="weekDuration">{ctx.weekDuration}</div>
          <div data-testid="weekDurationLoading">
            {ctx.weekDurationLoading ? 'yes' : 'no'}
          </div>
          <div data-testid="monthDuration">{ctx.monthDuration}</div>
          <div data-testid="monthDurationLoading">
            {ctx.monthDurationLoading ? 'yes' : 'no'}
          </div>
        </>
      );
    };
    await act(async () => {
      renderWithAllAppProviders(
        <TTOProvider sandbox={sandbox}>
          <TestComponent />
        </TTOProvider>,
      );
    });
    expect(await screen.findByTestId('weekDuration')).toHaveTextContent('10');
    expect(await screen.findByTestId('weekDurationLoading')).toHaveTextContent(
      'no',
    );
    expect(await screen.findByTestId('monthDuration')).toHaveTextContent('10');
    expect(await screen.findByTestId('monthDurationLoading')).toHaveTextContent(
      'no',
    );
  });

  it('handles error state for durations', async () => {
    (useTimeTrackingBatchAuthorization as jest.Mock).mockReturnValue({
      data: {},
    });
    (computeTimeTrackingOnlyUser as jest.Mock).mockReturnValue('user-123');
    (useTTOTimeWindowDuration as jest.Mock).mockReset();
    (useTTOTimeWindowDuration as jest.Mock).mockImplementation(() => [
      jest.fn(),
      { duration: null, loading: false, error: 'some error' },
    ]);
    const sandbox = setupSandbox();
    const TestComponent = () => {
      const ctx = useTTOContext();
      return (
        <>
          <div data-testid="weekDuration">{String(ctx.weekDuration)}</div>
          <div data-testid="monthDuration">{String(ctx.monthDuration)}</div>
        </>
      );
    };
    await act(async () => {
      renderWithAllAppProviders(
        <TTOProvider sandbox={sandbox}>
          <TestComponent />
        </TTOProvider>,
      );
    });
    expect(await screen.findByTestId('weekDuration')).toHaveTextContent('null');
    expect(await screen.findByTestId('monthDuration')).toHaveTextContent(
      'null',
    );
  });

  it('provides weekRange and monthLabel from settingsData', async () => {
    (useTimeTrackingBatchAuthorization as jest.Mock).mockReturnValue({
      data: {},
    });
    (computeTimeTrackingOnlyUser as jest.Mock).mockReturnValue('user-123');
    (useTTOTimeWindowDuration as jest.Mock).mockReset();
    (useTTOTimeWindowDuration as jest.Mock).mockImplementation(() => [
      jest.fn(),
      { duration: 0, loading: false, error: null },
    ]);
    const sandbox = setupSandbox();
    const TestComponent = () => {
      const ctx = useTTOContext();
      return (
        <>
          <div data-testid="weekRange">{ctx.weekRange}</div>
          <div data-testid="monthLabel">{ctx.monthLabel}</div>
        </>
      );
    };
    await act(async () => {
      renderWithAllAppProviders(
        <TTOProvider sandbox={sandbox}>
          <TestComponent />
        </TTOProvider>,
      );
    });
    expect(await screen.findByTestId('weekRange')).toHaveTextContent('May 1-7');
    expect(await screen.findByTestId('monthLabel')).toHaveTextContent(
      'May 2024',
    );
  });

  it('throws if useTTOContext is used outside provider', () => {
    const BrokenComponent = () => {
      useTTOContext();
      return null;
    };
    expect(() => renderWithAllAppProviders(<BrokenComponent />)).toThrow(
      /useTTOContext must be used within a TTOProvider/,
    );
  });

  describe('Authorization state', () => {
    it('provides isAuthorized as true when timeTrackingOnlyId is present', async () => {
      (useTimeTrackingBatchAuthorization as jest.Mock).mockReturnValue({
        data: {},
        loading: false,
      });
      (computeTimeTrackingOnlyUser as jest.Mock).mockReturnValue('user-123');
      (useTTOTimeWindowDuration as jest.Mock).mockImplementation(() => [
        jest.fn(),
        { duration: 5, loading: false, error: null },
      ]);

      renderWithAllAppProviders(
        <TTOProvider sandbox={setupSandbox()}>
          <TestComponent />
        </TTOProvider>,
      );

      await act(() => Promise.resolve());

      expect(screen.getByTestId('is-authorized')).toHaveTextContent('true');
      expect(screen.getByTestId('auth-loading')).toHaveTextContent('false');
    });

    it('provides isAuthorized as false when timeTrackingOnlyId is not present', async () => {
      (useTimeTrackingBatchAuthorization as jest.Mock).mockReturnValue({
        data: {},
        loading: false,
      });
      (computeTimeTrackingOnlyUser as jest.Mock).mockReturnValue(undefined);
      (useTTOTimeWindowDuration as jest.Mock).mockImplementation(() => [
        jest.fn(),
        { duration: 5, loading: false, error: null },
      ]);

      renderWithAllAppProviders(
        <TTOProvider sandbox={setupSandbox()}>
          <TestComponent />
        </TTOProvider>,
      );

      await act(() => Promise.resolve());

      expect(screen.getByTestId('is-authorized')).toHaveTextContent('false');
    });

    it('provides authLoading as true when authorization is loading', async () => {
      (useTimeTrackingBatchAuthorization as jest.Mock).mockReturnValue({
        data: {},
        loading: true,
      });
      (computeTimeTrackingOnlyUser as jest.Mock).mockReturnValue(undefined);
      (useTTOTimeWindowDuration as jest.Mock).mockImplementation(() => [
        jest.fn(),
        { duration: 5, loading: false, error: null },
      ]);

      renderWithAllAppProviders(
        <TTOProvider sandbox={setupSandbox()}>
          <TestComponent />
        </TTOProvider>,
      );

      await act(() => Promise.resolve());

      expect(screen.getByTestId('auth-loading')).toHaveTextContent('true');
    });
  });
});

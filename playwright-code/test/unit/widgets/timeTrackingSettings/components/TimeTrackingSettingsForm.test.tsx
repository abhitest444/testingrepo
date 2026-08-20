import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { FEATURE_FLAGS } from 'src/js/common/constants';
import { useFeatureFlag } from 'src/js/service/utils/sandboxUtils';
import {
  computeHasPayrollWithTSheet,
  computeHasTSheet,
} from 'src/js/service/hooks/entitlements/useGetEntitlements';
import { TimeTrackingSettingsProvider } from 'src/js/widgets/timeTrackingSettings/context/TimeTrackingSettingsContext';
import { TimeTrackingSettingsForm } from 'src/js/widgets/timeTrackingSettings/components/TimeTrackingSettingsForm';
import { TimeEntrySettingsHoc } from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/TimeEntrySettingsHoc';

// Mock the child components
jest.mock(
  'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/TimeEntrySettingsHoc',
  () => ({
    TimeEntrySettingsHoc: jest.fn(({ type }: { type: string }) => (
      <div data-testid="time-entry-settings-hoc">
        TimeEntrySettingsHoc (type: {type})
      </div>
    )),
  }),
);

jest.mock(
  'src/js/widgets/timeTrackingSettings/components/TimeActivitySettings/TimeActivitySettingsForm',
  () => ({
    TimeActivitySettingsForm: () => (
      <div data-testid="time-activity-settings-form">
        TimeActivitySettingsForm
      </div>
    ),
  }),
);

// Mock the Widget component for breaks functionality
jest.mock('web-shell-core/widgets/HOCWidget', () => ({
  __esModule: true,
  default: jest.fn(({ widgetId, options }) => (
    <div
      data-testid="breaks-settings-widget"
      data-widget-id={widgetId}
      data-options={JSON.stringify(options)}
    >
      Breaks Settings Widget
    </div>
  )),
}));

// Do not mock TimeTrackingSettingsForm since we want to test its actual logic
jest.unmock(
  'src/js/widgets/timeTrackingSettings/components/TimeTrackingSettingsForm',
);

// Mock the hooks
jest.mock('src/js/service/hooks/entitlements/useGetEntitlements', () => ({
  computeHasPayrollWithTSheet: jest.fn(),
  computeHasTSheet: jest.fn(),
}));

jest.mock('src/js/service/utils/sandboxUtils', () => ({
  useFeatureFlag: jest.fn(),
}));

// Mock the context
jest.mock(
  'src/js/widgets/timeTrackingSettings/context/TimeTrackingSettingsContext',
  () => ({
    TimeTrackingSettingsProvider: ({
      children,
    }: {
      children: React.ReactNode;
    }) => children,
    useTimeTrackingSettingsContext: () => ({
      entitlements: {
        data: [
          {
            entitlementGrantProductOffering: {
              offeringId: 'TSHEETS_OFFERING_ID',
            },
          },
        ],
      },
      QLData: {},
      isQLSettingsLoading: false,
      QLSettingsError: undefined,
      v3PreferencesData: {},
      v3PreferencesLoading: false,
      v3PreferencesError: false,
      QLSettingsRefetch: jest.fn(),
      text: (id: string) => id,
      entitlementsLoading: false,
      sandbox: {},
      isFormEditable: true,
      errorMessage: '',
      isRenderTimeEntry: false,
      reRenderTimeEntrySetting: jest.fn(),
      updateErrorMessage: jest.fn(),
    }),
  }),
);

describe('TimeTrackingSettingsTimeEntrySettingsForm', () => {
  const renderComponent = (
    props: {
      type: string;
      trowserKey?: 'timesheet-settings';
      onClose?: () => void;
    } = { type: 'US' },
  ) =>
    render(
      <TimeTrackingSettingsProvider>
        <TimeTrackingSettingsForm {...props} />
      </TimeTrackingSettingsProvider>,
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render TimeEntrySettingsHoc when TSheets is enabled', () => {
    // Setup mocks
    (computeHasTSheet as jest.Mock).mockReturnValue(true);
    (computeHasPayrollWithTSheet as jest.Mock).mockReturnValue(false);
    (useFeatureFlag as jest.Mock).mockReturnValue(true);

    const { getByTestId } = renderComponent();

    expect(getByTestId('time-entry-settings-hoc')).toBeInTheDocument();
    expect(getByTestId('time-entry-settings-hoc')).toHaveTextContent(
      'TimeEntrySettingsHoc (type: US)',
    );
  });

  it('should render TimeEntrySettingsHoc when Payroll with TSheets is enabled', () => {
    // Setup mocks
    (computeHasTSheet as jest.Mock).mockReturnValue(false);
    (computeHasPayrollWithTSheet as jest.Mock).mockReturnValue(true);
    (useFeatureFlag as jest.Mock).mockReturnValue(true);

    const { getByTestId } = renderComponent();

    expect(getByTestId('time-entry-settings-hoc')).toBeInTheDocument();
    expect(getByTestId('time-entry-settings-hoc')).toHaveTextContent(
      'TimeEntrySettingsHoc (type: US)',
    );
  });

  it('should render TimeActivitySettingsForm when neither TSheets nor Payroll is enabled', () => {
    // Setup mocks
    (computeHasTSheet as jest.Mock).mockReturnValue(false);
    (computeHasPayrollWithTSheet as jest.Mock).mockReturnValue(false);
    (useFeatureFlag as jest.Mock).mockReturnValue(true);

    const { getByTestId } = renderComponent();

    expect(getByTestId('time-activity-settings-form')).toBeInTheDocument();
  });

  it('should render TimeActivitySettingsForm when feature flags are off', () => {
    // Setup mocks
    (computeHasTSheet as jest.Mock).mockReturnValue(true);
    (computeHasPayrollWithTSheet as jest.Mock).mockReturnValue(true);
    (useFeatureFlag as jest.Mock).mockReturnValue(false);

    const { getByTestId } = renderComponent();

    expect(getByTestId('time-activity-settings-form')).toBeInTheDocument();
  });

  it('should pass correct type prop to TimeEntrySettingsHoc', () => {
    // Setup mocks
    (computeHasTSheet as jest.Mock).mockReturnValue(true);
    (computeHasPayrollWithTSheet as jest.Mock).mockReturnValue(false);
    (useFeatureFlag as jest.Mock).mockReturnValue(true);

    const { getByTestId } = renderComponent({ type: 'CA' });

    expect(getByTestId('time-entry-settings-hoc')).toHaveTextContent(
      'type: CA',
    );
  });

  it('should forward trowserKey and onClose to TimeEntrySettingsHoc', () => {
    (computeHasTSheet as jest.Mock).mockReturnValue(true);
    (computeHasPayrollWithTSheet as jest.Mock).mockReturnValue(false);
    (useFeatureFlag as jest.Mock).mockReturnValue(true);

    const onClose = jest.fn();
    renderComponent({
      type: 'US',
      trowserKey: 'timesheet-settings',
      onClose,
    });

    expect(TimeEntrySettingsHoc).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'US',
        trowserKey: 'timesheet-settings',
        onClose,
      }),
      expect.anything(),
    );
  });
});

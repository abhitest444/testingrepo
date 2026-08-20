import React, { ReactNode } from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { FormProvider, useForm } from 'react-hook-form';

import { ITimeEntrySettingsFormState } from 'src/js/widgets/timeTrackingSettings/types';
import { mapEmployerDimensionSettingsToPreviewFields } from 'src/js/widgets/timeTrackingSettings/utils';
import { TIME_ENTRY_SETTINGS_TRACKING_POINTS } from 'src/js/widgets/timeTrackingSettings/timeEntrySettingsTrackingPoints';
import {
  DimensionsSection,
  DimensionsSectionProps,
} from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/timeSheetFields/DimensionsSection';

const mockTrack = jest.fn();

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: (
      { id, defaultMessage }: { id: string; defaultMessage?: string },
      values?: Record<string, unknown>,
    ) => {
      if (values && Object.keys(values).length > 0) {
        const params = Object.entries(values)
          .map(([k, v]) => `${k}=${String(v)}`)
          .join(',');
        return `${id}(${params})`;
      }
      return id || defaultMessage || '';
    },
  }),
  useTracking: () => mockTrack,
}));

jest.mock('@ids-ts/switch', () => ({
  __esModule: true,
  default: ({
    checked,
    onChange,
    disabled,
    'aria-label': ariaLabel,
  }: {
    checked: boolean;
    onChange: () => void;
    disabled?: boolean;
    'aria-label': string;
  }) => (
    <button
      type="button"
      data-testid={`switch-${ariaLabel}`}
      aria-pressed={!!checked}
      aria-disabled={disabled ? 'true' : 'false'}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange()}
    >
      {checked ? 'ON' : 'OFF'}
    </button>
  ),
}));

jest.mock('@ids-ts/loader', () => ({
  Activity: () => <div data-testid="activity-loader" />,
}));

jest.mock('@design-systems/icons', () => ({
  ChevronUp: () => <svg data-testid="chevron-up" />,
  ChevronDown: () => <svg data-testid="chevron-down" />,
  Info: () => <svg data-testid="info-icon" />,
}));

const TEST_PREVIEW_FIELDS = mapEmployerDimensionSettingsToPreviewFields([
  {
    dimensionDefinitionId: '1000000023',
    enabledForTimeTracking: { version: '1', value: true },
    required: { version: '1', value: true },
  },
  {
    dimensionDefinitionId: '1000000024',
    enabledForTimeTracking: { version: '1', value: false },
    required: { version: '1', value: false },
  },
  {
    dimensionDefinitionId: '1000000025',
    enabledForTimeTracking: { version: '1', value: true },
    required: { version: '1', value: false },
  },
]);

jest.mock('web-shell-core/widgets/HOCWidget', () => ({
  __esModule: true,
  default: ({
    widgetId,
    onClose,
    widgetSource,
    'data-testid': testId,
  }: {
    widgetId: string;
    onClose?: () => void;
    widgetSource?: string;
    'data-testid'?: string;
  }) => (
    <div
      data-testid={testId}
      data-widget-id={widgetId}
      data-widget-source={widgetSource}
    >
      <button
        type="button"
        data-testid="custom-defaults-close"
        onClick={onClose}
      >
        Close
      </button>
    </div>
  ),
}));

const TestWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
  const methods = useForm<ITimeEntrySettingsFormState>({
    defaultValues: {
      dimensions: {},
    } as Partial<ITimeEntrySettingsFormState>,
  });
  return <FormProvider {...methods}>{children}</FormProvider>;
};

const renderSection = (
  props: Partial<DimensionsSectionProps> = {},
  ui?: React.ReactElement,
) =>
  render(
    <TestWrapper>
      <table>
        <tbody>
          {ui ?? (
            <DimensionsSection previewFields={TEST_PREVIEW_FIELDS} {...props} />
          )}
        </tbody>
      </table>
    </TestWrapper>,
  );

describe('DimensionsSection', () => {
  beforeEach(() => {
    mockTrack.mockClear();
  });

  describe('section header', () => {
    test('renders the dimensions header row with localized count', () => {
      renderSection();
      const header = screen.getByTestId('dimensions-section-header');
      expect(header).toBeInTheDocument();
      expect(header).toHaveTextContent(
        `time-entries.section.title.dimensions-with-count(count=${TEST_PREVIEW_FIELDS.length})`,
      );
    });

    test('header cell spans all 5 standard-field table columns', () => {
      renderSection();
      const header = screen.getByTestId('dimensions-section-header');
      const cell = header.querySelector('td');
      expect(cell).not.toBeNull();
      expect(cell).toHaveAttribute('colspan', '5');
    });

    test('shows the ChevronUp icon while expanded (default)', () => {
      renderSection();
      expect(screen.getByTestId('chevron-up')).toBeInTheDocument();
      expect(screen.queryByTestId('chevron-down')).not.toBeInTheDocument();
    });

    test('clicking the header collapses the rows and swaps the chevron', () => {
      renderSection();

      TEST_PREVIEW_FIELDS.forEach((d) => {
        expect(screen.getByTestId(`dimension-row-${d.id}`)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('dimensions-section-header'));

      TEST_PREVIEW_FIELDS.forEach((d) => {
        expect(
          screen.queryByTestId(`dimension-row-${d.id}`),
        ).not.toBeInTheDocument();
      });
      expect(screen.getByTestId('chevron-down')).toBeInTheDocument();
      expect(screen.queryByTestId('chevron-up')).not.toBeInTheDocument();
    });

    test('clicking the header again re-expands the rows', () => {
      renderSection();
      const header = screen.getByTestId('dimensions-section-header');

      fireEvent.click(header);
      fireEvent.click(header);

      TEST_PREVIEW_FIELDS.forEach((d) => {
        expect(screen.getByTestId(`dimension-row-${d.id}`)).toBeInTheDocument();
      });
      expect(screen.getByTestId('chevron-up')).toBeInTheDocument();
    });
  });

  describe('dimension rows', () => {
    test('renders one row per dimension with label, customers, status, required, and action cells', () => {
      renderSection();

      TEST_PREVIEW_FIELDS.forEach((dimension) => {
        const row = screen.getByTestId(`dimension-row-${dimension.id}`);
        expect(row).toBeInTheDocument();

        expect(
          within(row).getByTestId(`dimension-label-${dimension.id}`),
        ).toHaveTextContent(dimension.title);

        expect(
          within(row).getByTestId(`dimension-customers-${dimension.id}`),
        ).toHaveTextContent('time-entries.section.dimensions.all-customers');

        expect(
          within(row).getByTestId(`dimension-status-${dimension.id}`),
        ).toBeInTheDocument();
        expect(
          within(row).getByTestId(`dimension-required-${dimension.id}`),
        ).toBeInTheDocument();
        expect(
          within(row).getByTestId(`dimension-action-${dimension.id}`),
        ).toBeInTheDocument();
      });
    });

    test('status switch initial state and aria-label come from previewFields.value', () => {
      renderSection();

      TEST_PREVIEW_FIELDS.forEach((dimension) => {
        const statusCell = screen.getByTestId(
          `dimension-status-${dimension.id}`,
        );
        const statusSwitch = within(statusCell).getByTestId(
          `switch-${dimension.id}`,
        );

        expect(statusSwitch).toHaveAttribute('aria-label', dimension.id);
        expect(statusSwitch).toHaveAttribute(
          'aria-pressed',
          String(!!dimension.value),
        );
        expect(statusCell).toHaveTextContent(
          dimension.value
            ? 'time-entries.switch.label.active'
            : 'time-entries.switch.label.inactive',
        );
      });
    });

    test('required switch initial state and aria-label come from previewFields.requiredField.value', () => {
      renderSection();

      TEST_PREVIEW_FIELDS.forEach((dimension) => {
        const requiredCell = screen.getByTestId(
          `dimension-required-${dimension.id}`,
        );
        const requiredSwitch = within(requiredCell).getByTestId(
          `switch-${dimension.id}-required`,
        );

        expect(requiredSwitch).toHaveAttribute(
          'aria-label',
          `${dimension.id}-required`,
        );
        expect(requiredSwitch).toHaveAttribute(
          'aria-pressed',
          String(!!dimension.requiredField?.value),
        );
        expect(requiredCell).toHaveTextContent(
          dimension.requiredField?.value
            ? 'time-entries.switch.label.yes'
            : 'time-entries.switch.label.no',
        );
      });
    });

    test('clicking the status switch toggles its pressed state and visible label', () => {
      renderSection();
      const [first] = TEST_PREVIEW_FIELDS;
      const statusCell = screen.getByTestId(`dimension-status-${first.id}`);
      const statusSwitch = within(statusCell).getByTestId(`switch-${first.id}`);

      const initial = !!first.value;
      expect(statusSwitch).toHaveAttribute('aria-pressed', String(initial));

      fireEvent.click(statusSwitch);

      expect(statusSwitch).toHaveAttribute('aria-pressed', String(!initial));
      expect(statusCell).toHaveTextContent(
        !initial
          ? 'time-entries.switch.label.active'
          : 'time-entries.switch.label.inactive',
      );
    });

    test('clicking the required switch toggles its pressed state and visible label', () => {
      renderSection();
      const [first] = TEST_PREVIEW_FIELDS;
      const requiredCell = screen.getByTestId(`dimension-required-${first.id}`);
      const requiredSwitch = within(requiredCell).getByTestId(
        `switch-${first.id}-required`,
      );

      const initial = !!first.requiredField?.value;
      expect(requiredSwitch).toHaveAttribute('aria-pressed', String(initial));

      fireEvent.click(requiredSwitch);

      expect(requiredSwitch).toHaveAttribute('aria-pressed', String(!initial));
      expect(requiredCell).toHaveTextContent(
        !initial
          ? 'time-entries.switch.label.yes'
          : 'time-entries.switch.label.no',
      );
    });

    test('toggling enabled off clears required on the same row', () => {
      renderSection();
      const [first] = TEST_PREVIEW_FIELDS;
      const requiredSwitch = within(
        screen.getByTestId(`dimension-required-${first.id}`),
      ).getByTestId(`switch-${first.id}-required`);

      expect(requiredSwitch).toHaveAttribute('aria-pressed', 'true');

      fireEvent.click(
        within(screen.getByTestId(`dimension-status-${first.id}`)).getByTestId(
          `switch-${first.id}`,
        ),
      );

      expect(requiredSwitch).toHaveAttribute('aria-pressed', 'false');
      expect(requiredSwitch).toHaveAttribute('aria-disabled', 'true');
    });

    test('required switch is disabled when enabled on timesheet is off', () => {
      renderSection();
      const disabledDimension = TEST_PREVIEW_FIELDS[1];
      const requiredSwitch = within(
        screen.getByTestId(`dimension-required-${disabledDimension.id}`),
      ).getByTestId(`switch-${disabledDimension.id}-required`);

      expect(requiredSwitch).toBeDisabled();
      expect(requiredSwitch).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('loading state', () => {
    test('renders a loading row while dimension data is fetching', () => {
      renderSection({ previewFields: [], loading: true });

      expect(screen.getByTestId('dimensions-loading-row')).toBeInTheDocument();
      expect(screen.getByTestId('activity-loader')).toBeInTheDocument();
      expect(
        screen.queryByTestId('dimensions-empty-row'),
      ).not.toBeInTheDocument();
    });
  });

  describe('set defaults', () => {
    test('renders the Set defaults action link in the section header', () => {
      renderSection();

      const link = screen.getByTestId('dimensions-set-defaults-link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveTextContent(
        'time-entries.section.dimensions.set-defaults-link',
      );
      expect(link).toHaveAttribute('role', 'button');
    });

    test('does not render the custom defaults widget by default', () => {
      renderSection();

      expect(
        screen.queryByTestId('custom-defaults-widget'),
      ).not.toBeInTheDocument();
    });

    test('clicking Set defaults opens the custom defaults widget', () => {
      renderSection();

      fireEvent.click(screen.getByTestId('dimensions-set-defaults-link'));

      const widget = screen.getByTestId('custom-defaults-widget');
      expect(widget).toBeInTheDocument();
      expect(widget).toHaveAttribute(
        'data-widget-id',
        'custom-defaults-ui/customdefaults',
      );
      expect(widget).toHaveAttribute('data-widget-source', 'TIME_SETTINGS');
    });

    test('clicking Set defaults does not collapse the section', () => {
      renderSection();

      fireEvent.click(screen.getByTestId('dimensions-set-defaults-link'));

      TEST_PREVIEW_FIELDS.forEach((d) => {
        expect(screen.getByTestId(`dimension-row-${d.id}`)).toBeInTheDocument();
      });
      expect(screen.getByTestId('chevron-up')).toBeInTheDocument();
    });

    test('closing the custom defaults widget hides it', () => {
      renderSection();

      fireEvent.click(screen.getByTestId('dimensions-set-defaults-link'));
      expect(screen.getByTestId('custom-defaults-widget')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('custom-defaults-close'));

      expect(
        screen.queryByTestId('custom-defaults-widget'),
      ).not.toBeInTheDocument();
    });

    test('invokes onSetDefaults and does not open the custom defaults widget when the click is handled', () => {
      const onSetDefaults = jest.fn(() => true);
      renderSection({ onSetDefaults });

      fireEvent.click(screen.getByTestId('dimensions-set-defaults-link'));

      expect(onSetDefaults).toHaveBeenCalledTimes(1);
      expect(
        screen.queryByTestId('custom-defaults-widget'),
      ).not.toBeInTheDocument();
    });

    test('falls back to opening the custom defaults widget when onSetDefaults returns false', () => {
      const onSetDefaults = jest.fn(() => false);
      renderSection({ onSetDefaults });

      fireEvent.click(screen.getByTestId('dimensions-set-defaults-link'));

      expect(onSetDefaults).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('custom-defaults-widget')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    test('renders the empty-state row when no dimensions are configured', () => {
      renderSection({ previewFields: [] });

      expect(screen.getByTestId('dimensions-section-header')).toHaveTextContent(
        'time-entries.section.title.dimensions-with-count(count=0)',
      );

      const emptyRow = screen.getByTestId('dimensions-empty-row');
      expect(emptyRow).toBeInTheDocument();
      expect(emptyRow).toHaveTextContent(
        'time-entries.section.dimensions.empty-state',
      );
      expect(emptyRow.querySelector('td')).toHaveAttribute('colspan', '5');
    });

    test('does not render the empty-state row when collapsed', () => {
      renderSection({ previewFields: [] });

      fireEvent.click(screen.getByTestId('dimensions-section-header'));

      expect(
        screen.queryByTestId('dimensions-empty-row'),
      ).not.toBeInTheDocument();
    });
  });

  describe('instrumentation', () => {
    test('tracks collapsing and expanding the section header', () => {
      renderSection();
      const header = screen.getByTestId('dimensions-section-header');

      fireEvent.click(header);
      expect(mockTrack).toHaveBeenLastCalledWith(
        TIME_ENTRY_SETTINGS_TRACKING_POINTS.DIMENSIONS_COLLAPSE,
      );

      fireEvent.click(header);
      expect(mockTrack).toHaveBeenLastCalledWith(
        TIME_ENTRY_SETTINGS_TRACKING_POINTS.DIMENSIONS_EXPAND,
      );
    });

    test('tracks clicking the Set defaults link', () => {
      renderSection();

      fireEvent.click(screen.getByTestId('dimensions-set-defaults-link'));

      expect(mockTrack).toHaveBeenCalledWith(
        TIME_ENTRY_SETTINGS_TRACKING_POINTS.DIMENSIONS_SET_DEFAULTS,
      );
    });

    test('tracks the show-on-timesheet toggle with a fixed object detail and state', () => {
      renderSection();
      const [first] = TEST_PREVIEW_FIELDS;
      const statusSwitch = within(
        screen.getByTestId(`dimension-status-${first.id}`),
      ).getByTestId(`switch-${first.id}`);

      // first dimension is enabled by default, so first click disables it
      fireEvent.click(statusSwitch);

      expect(mockTrack).toHaveBeenCalledWith({
        ...TIME_ENTRY_SETTINGS_TRACKING_POINTS.DIMENSION_SHOW_ON_TIMESHEET,
        ui_action: 'disabled',
      });
    });

    test('tracks the required toggle with a fixed object detail and state', () => {
      renderSection();
      const [first] = TEST_PREVIEW_FIELDS;
      const requiredSwitch = within(
        screen.getByTestId(`dimension-required-${first.id}`),
      ).getByTestId(`switch-${first.id}-required`);

      // first dimension required is on by default, so first click disables it
      fireEvent.click(requiredSwitch);

      expect(mockTrack).toHaveBeenCalledWith({
        ...TIME_ENTRY_SETTINGS_TRACKING_POINTS.DIMENSION_REQUIRED,
        ui_action: 'disabled',
      });
    });

    test('tracks enabling the show-on-timesheet toggle for a disabled dimension', () => {
      renderSection();
      const disabledDimension = TEST_PREVIEW_FIELDS[1];
      const statusSwitch = within(
        screen.getByTestId(`dimension-status-${disabledDimension.id}`),
      ).getByTestId(`switch-${disabledDimension.id}`);

      // second dimension is disabled by default, so first click enables it
      fireEvent.click(statusSwitch);

      expect(mockTrack).toHaveBeenCalledWith({
        ...TIME_ENTRY_SETTINGS_TRACKING_POINTS.DIMENSION_SHOW_ON_TIMESHEET,
        ui_action: 'enabled',
      });
    });
  });
});

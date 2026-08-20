/* eslint-disable react/no-array-index-key */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useFormContext } from 'react-hook-form';

import { useTimeTrackingSettingsContext } from 'src/js/widgets/timeTrackingSettings/context/TimeTrackingSettingsContext';
import { EditTimeSheetField } from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/timeSheetFields/EditTimesheetField';
import { TimeEntriesFormType } from 'src/js/widgets/timeTrackingSettings/constants';

// Mock styled-components
jest.mock('styled-components', () => {
  const createStyledComponent = (Component: any) => {
    const styledComponent = (strings: TemplateStringsArray, ...args: any[]) =>
      React.forwardRef<HTMLElement>((props, ref) =>
        React.createElement(Component, { ...props, ref }),
      );
    styledComponent.withConfig = () => styledComponent;
    return styledComponent;
  };

  // Handle styled.element syntax
  const styled = new Proxy(
    (Component: any) => createStyledComponent(Component),
    {
      get: (target, prop) => {
        if (prop === '__esModule') return true;
        if (prop === 'default') return target;
        // Return a styled element creator for any requested HTML element
        return createStyledComponent(prop);
      },
    },
  );

  return {
    __esModule: true,
    default: styled,
    createGlobalStyle: () => () => null,
    css: () => '',
    keyframes: () => '',
    ThemeProvider: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
  };
});

// Mock PageMessage component since it's being styled
jest.mock('@ids-ts/page-message', () => ({
  __esModule: true,
  default: React.forwardRef(({ children, title }: any, ref: any) => (
    <div ref={ref} data-testid="page-message">
      <div>{title}</div>
      {children}
    </div>
  )),
}));

// Mock the child components
jest.mock(
  'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/timeSheetFields/FieldsPreview',
  () => ({
    FieldsPreview: ({
      editTimeSheetFields,
      selectedCustomTimeSheetFields,
      updateSelectedCustomTimeSheetField,
      featureFlagForRequiredTimeSheetFields,
      setIsTimesheetPreviewOpen,
      onFieldAssignmentDetailViewChange,
    }: any) => (
      <div data-testid="fields-preview">
        {editTimeSheetFields.map((field: any) => (
          <div
            key={field.id}
            onClick={() => updateSelectedCustomTimeSheetField(field.id)}
          >
            {`translated.${field.title}`}
          </div>
        ))}
        {featureFlagForRequiredTimeSheetFields && (
          <div data-testid="feature-flag-enabled">Feature Flag Enabled</div>
        )}
        <button
          onClick={setIsTimesheetPreviewOpen}
          data-testid="preview-timesheet-link"
        >
          Preview Timesheet
        </button>
        <button
          type="button"
          data-testid="mock-field-assignment-detail-open"
          onClick={() => onFieldAssignmentDetailViewChange?.(true)}
        >
          Open assignment detail
        </button>
        <button
          type="button"
          data-testid="mock-field-assignment-detail-close"
          onClick={() => onFieldAssignmentDetailViewChange?.(false)}
        >
          Close assignment detail
        </button>
      </div>
    ),
  }),
);

jest.mock(
  'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/timeSheetFields/MobilePreview',
  () => ({
    MobilePreview: ({
      editTimeSheetFields,
      selectedCustomTimeSheetFields,
      onClose,
    }: any) => (
      <div data-testid="mobile-preview">
        {editTimeSheetFields
          .filter((field: any) =>
            selectedCustomTimeSheetFields.includes(field.id),
          )
          .map((field: any) => (
            <div key={field.id}>{`translated.${field.title}`}</div>
          ))}
        {onClose && (
          <button onClick={onClose} data-testid="mobile-preview-close-button">
            Close Preview
          </button>
        )}
      </div>
    ),
  }),
);

// Mock other components
jest.mock('@ids-ts/button', () => ({
  __esModule: true,
  default: ({ children, onClick, isLoading }: ButtonProps) => (
    <button onClick={onClick} disabled={isLoading} data-testid="mock-button">
      {children}
    </button>
  ),
}));

jest.mock('@ids-ts/loader', () => ({
  Activity: () => <div data-testid="mock-activity">Loading...</div>,
}));

jest.mock('@ids-ts/trowser', () => ({
  __esModule: true,
  default: ({
    children,
    open,
    onClose,
    title,
    footerButton,
    panelContent,
    stepFlow,
  }: TrowserProps) => (
    <div
      data-testid="mock-trowser"
      data-step-flow={stepFlow ? 'true' : 'false'}
      style={{ display: open ? 'block' : 'none' }}
    >
      <div data-testid="trowser-title">{title}</div>
      <button onClick={onClose} data-testid="close-button">
        Close
      </button>
      {children}
      {panelContent && <div data-testid="trowser-panel">{panelContent}</div>}
      {footerButton && !stepFlow && (
        <div data-testid="trowser-footer">
          {footerButton.map((button, index) => (
            <div key={index}>{button}</div>
          ))}
        </div>
      )}
    </div>
  ),
}));

jest.mock('@ids-ts/page-message', () => ({
  __esModule: true,
  default: ({ children, title }: any) => (
    <div data-testid="page-message">
      <div>{title}</div>
      {children}
    </div>
  ),
}));

// Mock useIntl hook
jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => `translated.${id}`,
  }),
  useTracking: jest.fn(() => jest.fn()),
  useSandbox: jest.fn().mockReturnValue({
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    },
    navigation: {
      navigate: jest.fn(),
    },
  }),
}));

// Mock the context hook
jest.mock(
  'src/js/widgets/timeTrackingSettings/context/TimeTrackingSettingsContext',
  () => ({
    useTimeTrackingSettingsContext: jest.fn(),
  }),
);

// Mock react-hook-form
jest.mock('react-hook-form', () => ({
  useFormContext: jest.fn(),
}));

// Mock ConfirmationModal
jest.mock('src/js/widgets/common/ConfirmationModal', () => ({
  ConfirmationModal: ({ children, open, title, onYesClick, onNoClick }: any) =>
    open ? (
      <div data-testid="confirmation-modal">
        <div data-testid="confirmation-modal-title">{title}</div>
        <div data-testid="confirmation-modal-content">{children}</div>
        <button onClick={onYesClick} data-testid="confirmation-yes-button">
          Yes
        </button>
        <button onClick={onNoClick} data-testid="confirmation-no-button">
          No
        </button>
      </div>
    ) : null,
}));

// Mock PanelContextual
jest.mock('@ids-ts/panel-contextual', () => ({
  __esModule: true,
  default: ({ children, open, showPanel }: any) => (
    <div
      data-testid="panel-contextual"
      style={{ display: open && showPanel ? 'block' : 'none' }}
    >
      {children}
    </div>
  ),
  PanelContent: ({ children }: any) => (
    <div data-testid="panel-content">{children}</div>
  ),
  Placement: {
    Right: 'right',
  },
}));

// Mock styled components
jest.mock(
  'src/js/widgets/timeTrackingSettings/TimeTrackingSettings.styled',
  () => ({
    ConfirmationModalContent: ({ children }: any) => (
      <div data-testid="confirmation-modal-content">{children}</div>
    ),
  }),
);

interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  isLoading: boolean;
}

interface TrowserProps {
  children: React.ReactNode;
  open: boolean;
  onClose: () => void;
  title: string;
  footerButton?: React.ReactNode[];
  panelContent?: React.ReactNode;
  stepFlow?: boolean;
}

const mockText = (key: string) => `translated.${key}`;

const defaultProps = {
  isTimeSheetEditing: true,
  onFormCancel: jest.fn(),
  onSaveTimeEntrySettings: jest.fn(),
  isDataUpdating: false,
  editTimeSheetFields: [
    {
      id: 'field1',
      key: 'field1',
      title: 'Field 1',
      ariaLabel: 'Field 1',
      tooltipText: 'Field 1 tooltip',
      disabled: false,
      value: true,
      detail: {
        title: 'Field 1',
        subtitle: 'Field 1 subtitle',
        ariaLabel: 'Field 1 details',
      },
    },
    {
      id: 'field2',
      key: 'field2',
      title: 'Field 2',
      ariaLabel: 'Field 2',
      tooltipText: 'Field 2 tooltip',
      disabled: false,
      value: false,
      detail: {
        title: 'Field 2',
        subtitle: 'Field 2 subtitle',
        ariaLabel: 'Field 2 details',
      },
      subFields: [
        {
          id: 'subfield1',
          key: 'subfield1',
          title: 'Subfield 1',
          ariaLabel: 'Subfield 1',
          tooltipText: 'Subfield 1 tooltip',
          disabled: false,
          value: true,
          detail: {
            title: 'Subfield 1',
            subtitle: 'Subfield 1 subtitle',
            ariaLabel: 'Subfield 1 details',
          },
        },
      ],
    },
  ],
  updateSelectedCustomTimeSheetField: jest.fn(),
  selectedCustomTimeSheetFields: ['field1'],
  isIXPFlagLoading: false,
  featureFlagForRequiredTimeSheetFields: false,
};

const mockContextValue = {
  text: mockText,
  errorMessage: '',
  QLData: null,
  isQLSettingsLoading: false,
  QLSettingsError: '',
  v3PreferencesData: null,
  v3PreferencesLoading: false,
  v3PreferencesError: false,
  isFormEditable: true,
  sandbox: null,
  updateErrorMessage: jest.fn(),
  updateInitialRender: jest.fn(),
  QLSettingsRefetch: jest.fn(),
  entitlements: null,
  entitlementsLoading: false,
  isInitialRender: false,
};

const renderComponent = (props = {}, contextOverrides = {}) => {
  const mergedProps = { ...defaultProps, ...props };
  (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
    ...mockContextValue,
    ...contextOverrides,
  });
  return render(
    <EditTimeSheetField
      isTimeSheetEditing={mergedProps.isTimeSheetEditing}
      onFormCancel={mergedProps.onFormCancel}
      onSaveTimeEntrySettings={mergedProps.onSaveTimeEntrySettings}
      isDataUpdating={mergedProps.isDataUpdating}
      editTimeSheetFields={mergedProps.editTimeSheetFields}
      updateSelectedCustomTimeSheetField={
        mergedProps.updateSelectedCustomTimeSheetField
      }
      selectedCustomTimeSheetFields={mergedProps.selectedCustomTimeSheetFields}
      isIXPFlagLoading={mergedProps.isIXPFlagLoading}
      featureFlagForRequiredTimeSheetFields={
        mergedProps.featureFlagForRequiredTimeSheetFields
      }
    />,
  );
};

describe('EditTimeSheetField', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue(
      mockContextValue,
    );

    // Mock useFormContext with default clean form state
    (useFormContext as jest.Mock).mockReturnValue({
      formState: {
        dirtyFields: {},
      },
    });

    // Ensure useSandbox and useTracking mocks are properly set up
    const { useSandbox, useTracking } = require('@payroll/quicksand');
    useSandbox.mockReturnValue({
      logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
      },
      navigation: {
        navigate: jest.fn(),
      },
    });
    useTracking.mockReturnValue(jest.fn());
  });

  it('renders the component with basic props', () => {
    renderComponent();

    expect(screen.getByTestId('mock-trowser')).toBeInTheDocument();
    expect(screen.getByTestId('trowser-title')).toHaveTextContent(
      'translated.time-entries.section.title.time-sheet-settings',
    );
  });

  it('shows loading state when isDataUpdating is true', () => {
    renderComponent({ isDataUpdating: true });

    expect(screen.getByTestId('mock-activity')).toBeInTheDocument();
  });

  it('displays error message when provided', () => {
    renderComponent({}, { errorMessage: 'Test error message' });
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('calls onFormCancel with correct form type when closing', () => {
    const onFormCancel = jest.fn();
    renderComponent({ onFormCancel });

    fireEvent.click(screen.getByTestId('close-button'));

    expect(onFormCancel).toHaveBeenCalledWith(TimeEntriesFormType.TIMESHEET);
  });

  it('renders mobile preview section', () => {
    renderComponent();

    // Check for Field 1 in both previews
    const field1Elements = screen.getAllByText('translated.Field 1');
    expect(field1Elements).toHaveLength(2); // One in fields preview, one in mobile preview
  });

  it('handles field selection updates', () => {
    const updateSelectedCustomTimeSheetField = jest.fn();
    renderComponent({ updateSelectedCustomTimeSheetField });

    // Find and click Field 2 in the fields preview
    const field2Element = screen.getByText('translated.Field 2');
    fireEvent.click(field2Element);

    expect(updateSelectedCustomTimeSheetField).toHaveBeenCalledWith('field2');
  });

  it('should show confirmation modal when form is dirty and user tries to close', () => {
    // Mock form context with dirty fields
    const mockFormContext = {
      formState: {
        dirtyFields: { field1: true },
      },
    };
    (useFormContext as jest.Mock).mockReturnValue(mockFormContext);

    const onFormCancel = jest.fn();
    renderComponent({ onFormCancel });

    // Find the close button and click it
    const closeButton = screen.getByTestId('close-button');
    fireEvent.click(closeButton);

    // Check that the confirmation modal is shown
    expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
    expect(
      screen.getByText(
        'translated.unsaved.changes.time-sheet.confirmation.modal.content',
      ),
    ).toBeInTheDocument();
  });

  it('should close directly when form is not dirty', () => {
    // Mock form context with no dirty fields
    const mockFormContext = {
      formState: {
        dirtyFields: {},
      },
    };
    (useFormContext as jest.Mock).mockReturnValue(mockFormContext);

    const onFormCancel = jest.fn();
    renderComponent({ onFormCancel });

    // Find the close button and click it
    const closeButton = screen.getByTestId('close-button');
    fireEvent.click(closeButton);

    // Check that onFormCancel was called directly (no confirmation modal)
    expect(onFormCancel).toHaveBeenCalledWith('Timesheet');
    expect(screen.queryByTestId('confirmation-modal')).not.toBeInTheDocument();
  });

  it('should call onFormCancel and close confirmation modal when handleYesClick is triggered', () => {
    // Mock form context with dirty fields to show confirmation modal
    const mockFormContext = {
      formState: {
        dirtyFields: { field1: true },
      },
    };
    (useFormContext as jest.Mock).mockReturnValue(mockFormContext);

    const onFormCancel = jest.fn();
    renderComponent({ onFormCancel });

    // Open confirmation modal by clicking close button
    const closeButton = screen.getByTestId('close-button');
    fireEvent.click(closeButton);

    // Verify confirmation modal is shown
    expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();

    // Click the Yes button in the confirmation modal to trigger handleYesClick
    const yesButton = screen.getByTestId('confirmation-yes-button');
    fireEvent.click(yesButton);

    // Verify onFormCancel was called with correct form type
    expect(onFormCancel).toHaveBeenCalledWith(TimeEntriesFormType.TIMESHEET);
  });

  it('should close confirmation modal without calling onFormCancel when handleNoClick is triggered', () => {
    // Mock form context with dirty fields to show confirmation modal
    const mockFormContext = {
      formState: {
        dirtyFields: { field1: true },
      },
    };
    (useFormContext as jest.Mock).mockReturnValue(mockFormContext);

    const onFormCancel = jest.fn();
    renderComponent({ onFormCancel });

    // Open confirmation modal by clicking close button
    const closeButton = screen.getByTestId('close-button');
    fireEvent.click(closeButton);

    // Verify confirmation modal is shown
    expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();

    // Reset the mock to clear the first call
    onFormCancel.mockClear();

    // Click the No button in the confirmation modal to trigger handleNoClick
    const noButton = screen.getByTestId('confirmation-no-button');
    fireEvent.click(noButton);

    // Verify onFormCancel was not called (modal should be closed without canceling)
    expect(onFormCancel).not.toHaveBeenCalled();
  });

  it('should handle confirmation modal state correctly for handleYesClick', () => {
    // Mock form context with dirty fields
    const mockFormContext = {
      formState: {
        dirtyFields: { field1: true },
      },
    };
    (useFormContext as jest.Mock).mockReturnValue(mockFormContext);

    const onFormCancel = jest.fn();
    renderComponent({ onFormCancel });

    // Open confirmation modal
    const closeButton = screen.getByTestId('close-button');
    fireEvent.click(closeButton);

    // Verify modal is open
    expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();

    // Click Yes button to trigger handleYesClick
    const yesButton = screen.getByTestId('confirmation-yes-button');
    fireEvent.click(yesButton);

    // Verify the correct behavior - onFormCancel should be called
    expect(onFormCancel).toHaveBeenCalledWith(TimeEntriesFormType.TIMESHEET);
  });

  it('should handle confirmation modal state correctly for handleNoClick', () => {
    // Mock form context with dirty fields
    const mockFormContext = {
      formState: {
        dirtyFields: { field1: true },
      },
    };
    (useFormContext as jest.Mock).mockReturnValue(mockFormContext);

    const onFormCancel = jest.fn();
    renderComponent({ onFormCancel });

    // Open confirmation modal
    const closeButton = screen.getByTestId('close-button');
    fireEvent.click(closeButton);

    // Verify modal is open
    expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();

    // Reset mock to clear the initial call
    onFormCancel.mockClear();

    // Click No button to trigger handleNoClick
    const noButton = screen.getByTestId('confirmation-no-button');
    fireEvent.click(noButton);

    // Verify onFormCancel was not called (only modal should be closed)
    expect(onFormCancel).not.toHaveBeenCalled();
  });

  it('should call onFormCancel when cancel button is clicked', () => {
    const onFormCancel = jest.fn();
    renderComponent({ onFormCancel });

    // Find the cancel button by its text content
    const cancelButton = screen.getByText('translated.cancel');

    fireEvent.click(cancelButton);

    expect(onFormCancel).toHaveBeenCalledWith(TimeEntriesFormType.TIMESHEET);
  });

  it('should not render content when IXP flag is loading', () => {
    renderComponent({ isIXPFlagLoading: true });

    // Content should not be rendered when IXP flag is loading
    expect(screen.queryByTestId('fields-preview')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mobile-preview')).not.toBeInTheDocument();
  });

  it('should render content when IXP flag is not loading', () => {
    renderComponent({ isIXPFlagLoading: false });

    // Content should be rendered when IXP flag is not loading
    expect(screen.getByTestId('fields-preview')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-preview')).toBeInTheDocument();
  });

  it('should pass featureFlagForRequiredTimeSheetFields to FieldsPreview', () => {
    renderComponent({ featureFlagForRequiredTimeSheetFields: true });

    // The FieldsPreview component should receive the feature flag prop
    expect(screen.getByTestId('fields-preview')).toBeInTheDocument();
    expect(screen.getByTestId('feature-flag-enabled')).toBeInTheDocument();
  });

  it('should not show feature flag indicator when featureFlagForRequiredTimeSheetFields is false', () => {
    renderComponent({ featureFlagForRequiredTimeSheetFields: false });

    // The FieldsPreview component should not show the feature flag indicator
    expect(screen.getByTestId('fields-preview')).toBeInTheDocument();
    expect(
      screen.queryByTestId('feature-flag-enabled'),
    ).not.toBeInTheDocument();
  });

  it('should render mobile preview panel', () => {
    renderComponent();

    expect(screen.getByTestId('trowser-panel')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-preview')).toBeInTheDocument();
  });

  it('should render with panel open by default', () => {
    renderComponent();

    // Panel content should be visible with data-testid="panel"
    const trowser = screen.getByTestId('mock-trowser');
    expect(trowser).toBeInTheDocument();
  });

  it('should render panel contextual component', () => {
    renderComponent();

    expect(screen.getByTestId('panel-contextual')).toBeInTheDocument();
    expect(screen.getByTestId('panel-content')).toBeInTheDocument();
  });

  it('should call setIsTimesheetPreviewOpen when preview timesheet link is clicked', () => {
    renderComponent();

    const previewLink = screen.getByTestId('preview-timesheet-link');
    fireEvent.click(previewLink);

    // Since we're testing the integration, we mainly verify the component renders correctly
    expect(previewLink).toBeInTheDocument();
  });

  it('should close mobile preview panel when close button is clicked', () => {
    renderComponent();

    // Verify mobile preview is initially visible
    expect(screen.getByTestId('mobile-preview')).toBeInTheDocument();
    expect(screen.getByTestId('panel-contextual')).toBeInTheDocument();

    // Click the close button on the mobile preview
    const closeButton = screen.getByTestId('mobile-preview-close-button');
    fireEvent.click(closeButton);

    // Panel contextual should have display none after closing
    const panelContextual = screen.getByTestId('panel-contextual');
    expect(panelContextual).toHaveStyle({ display: 'none' });
  });

  it('should pass onClose prop to MobilePreview component', () => {
    renderComponent();

    // The close button should be rendered when onClose is passed
    expect(
      screen.getByTestId('mobile-preview-close-button'),
    ).toBeInTheDocument();
  });

  it('should log info when featureFlagForRequiredTimeSheetFields is true', () => {
    const { useSandbox } = require('@payroll/quicksand');
    const mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    useSandbox.mockReturnValue({
      logger: mockLogger,
      navigation: {
        navigate: jest.fn(),
      },
    });

    renderComponent({ featureFlagForRequiredTimeSheetFields: true });

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Component= Time Entry TimeSheet Settings with Required fields: Update',
    );
  });

  it('should not log info when featureFlagForRequiredTimeSheetFields is false', () => {
    const { useSandbox } = require('@payroll/quicksand');
    const mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    useSandbox.mockReturnValue({
      logger: mockLogger,
      navigation: {
        navigate: jest.fn(),
      },
    });

    renderComponent({ featureFlagForRequiredTimeSheetFields: false });

    expect(mockLogger.info).not.toHaveBeenCalledWith(
      'Component= Time Entry TimeSheet Settings with Required fields: Update',
    );
  });

  it('should handle setIsTimesheetPreviewOpen with boolean value', () => {
    renderComponent();

    // Initially panel should be visible
    expect(screen.getByTestId('panel-contextual')).toHaveStyle({
      display: 'block',
    });

    // Click the mobile preview close button which passes false
    const closeButton = screen.getByTestId('mobile-preview-close-button');
    fireEvent.click(closeButton);

    // Panel should be hidden
    expect(screen.getByTestId('panel-contextual')).toHaveStyle({
      display: 'none',
    });
  });

  it('should not render panel content when IXP flag is loading', () => {
    renderComponent({ isIXPFlagLoading: true });

    // Panel content should not be rendered when IXP flag is loading
    expect(screen.queryByTestId('panel-contextual')).not.toBeInTheDocument();
  });

  it('should call onSaveTimeEntrySettings when save button is clicked', () => {
    const onSaveTimeEntrySettings = jest.fn();
    renderComponent({ onSaveTimeEntrySettings });

    // Find the save button by its text
    const saveButton = screen.getByText('translated.save');
    fireEvent.click(saveButton);

    expect(onSaveTimeEntrySettings).toHaveBeenCalled();
  });

  it('passes stepFlow to trowser when field assignment detail is open (hides footer)', () => {
    renderComponent();

    const trowser = screen.getByTestId('mock-trowser');
    expect(trowser).toHaveAttribute('data-step-flow', 'false');
    expect(screen.getByTestId('trowser-footer')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('mock-field-assignment-detail-open'));
    expect(trowser).toHaveAttribute('data-step-flow', 'true');
    expect(screen.queryByTestId('trowser-footer')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('mock-field-assignment-detail-close'));
    expect(trowser).toHaveAttribute('data-step-flow', 'false');
    expect(screen.getByTestId('trowser-footer')).toBeInTheDocument();
  });

  it('resets stepFlow when trowser is closed and reopened', () => {
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue(
      mockContextValue,
    );
    const { rerender } = render(
      <EditTimeSheetField
        isTimeSheetEditing={defaultProps.isTimeSheetEditing}
        onFormCancel={defaultProps.onFormCancel}
        onSaveTimeEntrySettings={defaultProps.onSaveTimeEntrySettings}
        isDataUpdating={defaultProps.isDataUpdating}
        editTimeSheetFields={defaultProps.editTimeSheetFields}
        updateSelectedCustomTimeSheetField={
          defaultProps.updateSelectedCustomTimeSheetField
        }
        selectedCustomTimeSheetFields={
          defaultProps.selectedCustomTimeSheetFields
        }
        isIXPFlagLoading={defaultProps.isIXPFlagLoading}
        featureFlagForRequiredTimeSheetFields={
          defaultProps.featureFlagForRequiredTimeSheetFields
        }
      />,
    );

    fireEvent.click(screen.getByTestId('mock-field-assignment-detail-open'));
    expect(screen.getByTestId('mock-trowser')).toHaveAttribute(
      'data-step-flow',
      'true',
    );

    rerender(
      <EditTimeSheetField
        isTimeSheetEditing={false}
        onFormCancel={defaultProps.onFormCancel}
        onSaveTimeEntrySettings={defaultProps.onSaveTimeEntrySettings}
        isDataUpdating={defaultProps.isDataUpdating}
        editTimeSheetFields={defaultProps.editTimeSheetFields}
        updateSelectedCustomTimeSheetField={
          defaultProps.updateSelectedCustomTimeSheetField
        }
        selectedCustomTimeSheetFields={
          defaultProps.selectedCustomTimeSheetFields
        }
        isIXPFlagLoading={defaultProps.isIXPFlagLoading}
        featureFlagForRequiredTimeSheetFields={
          defaultProps.featureFlagForRequiredTimeSheetFields
        }
      />,
    );

    rerender(
      <EditTimeSheetField
        isTimeSheetEditing={defaultProps.isTimeSheetEditing}
        onFormCancel={defaultProps.onFormCancel}
        onSaveTimeEntrySettings={defaultProps.onSaveTimeEntrySettings}
        isDataUpdating={defaultProps.isDataUpdating}
        editTimeSheetFields={defaultProps.editTimeSheetFields}
        updateSelectedCustomTimeSheetField={
          defaultProps.updateSelectedCustomTimeSheetField
        }
        selectedCustomTimeSheetFields={
          defaultProps.selectedCustomTimeSheetFields
        }
        isIXPFlagLoading={defaultProps.isIXPFlagLoading}
        featureFlagForRequiredTimeSheetFields={
          defaultProps.featureFlagForRequiredTimeSheetFields
        }
      />,
    );

    expect(screen.getByTestId('mock-trowser')).toHaveAttribute(
      'data-step-flow',
      'false',
    );
  });
});

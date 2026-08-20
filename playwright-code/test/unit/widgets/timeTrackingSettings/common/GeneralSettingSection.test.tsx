import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { useIntl } from '@payroll/quicksand';
import { useSettings } from '@payroll-shared-components/payroll-settings-section';
import { GeneralSettingSection } from 'src/js/widgets/timeTrackingSettings/common/GeneralSettingSection';

// Mock necessary hooks and components
jest.mock('@payroll/quicksand', () => ({
  useIntl: jest.fn(),
}));

jest.mock('@payroll-shared-components/payroll-settings-section', () => ({
  __esModule: true,
  default: jest.fn((props) => (
    <div data-testid="settings-section">
      <div data-testid="title-section">{props.title}</div>
      <button onClick={props.onEdit} aria-label={props.editIconAriaLabel}>
        {props.editIconAriaLabel}
      </button>
      <button onClick={props.onCancel}>{props.cancelButtonText}</button>
      <button onClick={props.onSave}>{props.saveButtonText}</button>
      {props.mode === 'EDIT' ? props.editContent : props.viewContent}
    </div>
  )),
  useSettings: jest.fn(),
}));

jest.mock('@ids-ts/badge', () => ({
  __esModule: true,
  default: jest.fn(({ children }) => (
    <span data-testid="new-badge">{children}</span>
  )),
}));

jest.mock('src/js/widgets/timeTrackingSettings/config', () => ({
  TIME_ENTRY_SETTINGS_CONFIG: {
    NEW_FEATURE: {
      name: 'New Feature Title',
      isNew: true,
    },
    EXISTING_FEATURE: {
      name: 'Existing Feature Title',
      isNew: false,
    },
  },
}));

describe('GeneralSettingSection Component', () => {
  const mockOnFormUpdate = jest.fn();
  const mockOnFormCancel = jest.fn();
  const mockOnSaveTimeTrackingSettings = jest.fn();
  const mockIntl = {
    formatMessage: jest.fn(({ id }) => `mocked-${id}`),
  };
  const ViewContent = <div>View Content</div>;
  const EditContent = <div>Edit Content</div>;
  const Title = 'General Settings';
  const id = 'general-settings';
  const isFormEditable = true;
  const isDataUpdating = false;

  beforeEach(() => {
    jest.clearAllMocks();
    (useIntl as jest.Mock).mockReturnValue(mockIntl);
    (useSettings as jest.Mock).mockReturnValue({});
  });

  test('renders without crashing', () => {
    render(
      <GeneralSettingSection
        ViewContent={ViewContent}
        EditContent={EditContent}
        Title={Title}
        onFormUpdate={mockOnFormUpdate}
        onFormCancel={mockOnFormCancel}
        isFormEdit={false}
        onSaveTimeTrackingSettings={mockOnSaveTimeTrackingSettings}
        id={id}
        isFormEditable={isFormEditable}
        isDataUpdating={isDataUpdating}
        formEditType="General"
      />,
    );
    expect(screen.getByTestId('settings-section')).toBeInTheDocument();
  });

  test('displays view content when isFormEdit is false', () => {
    render(
      <GeneralSettingSection
        ViewContent={ViewContent}
        EditContent={EditContent}
        Title={Title}
        onFormUpdate={mockOnFormUpdate}
        onFormCancel={mockOnFormCancel}
        isFormEdit={false}
        onSaveTimeTrackingSettings={mockOnSaveTimeTrackingSettings}
        id={id}
        isFormEditable={isFormEditable}
        isDataUpdating={isDataUpdating}
        formEditType="General"
      />,
    );
    expect(screen.getByText('View Content')).toBeInTheDocument();
    expect(screen.queryByText('Edit Content')).toBeNull();
  });

  test('displays edit content when isFormEdit is true', () => {
    render(
      <GeneralSettingSection
        ViewContent={ViewContent}
        EditContent={EditContent}
        Title={Title}
        onFormUpdate={mockOnFormUpdate}
        onFormCancel={mockOnFormCancel}
        isFormEdit
        onSaveTimeTrackingSettings={mockOnSaveTimeTrackingSettings}
        id={id}
        isFormEditable={isFormEditable}
        isDataUpdating={isDataUpdating}
        formEditType="General"
      />,
    );
    expect(screen.getByText('Edit Content')).toBeInTheDocument();
    expect(screen.queryByText('View Content')).toBeNull();
  });

  test('calls onFormUpdate when edit button is clicked', () => {
    render(
      <GeneralSettingSection
        ViewContent={ViewContent}
        EditContent={EditContent}
        Title={Title}
        onFormUpdate={mockOnFormUpdate}
        onFormCancel={mockOnFormCancel}
        isFormEdit={false}
        onSaveTimeTrackingSettings={mockOnSaveTimeTrackingSettings}
        id={id}
        isFormEditable={isFormEditable}
        isDataUpdating={isDataUpdating}
        formEditType="Timesheet"
      />,
    );
    fireEvent.click(screen.getByLabelText('mocked-edit'));
    expect(mockOnFormUpdate).toHaveBeenCalledWith('Timesheet');
  });

  test('calls onFormCancel when cancel button is clicked', () => {
    render(
      <GeneralSettingSection
        ViewContent={ViewContent}
        EditContent={EditContent}
        Title={Title}
        onFormUpdate={mockOnFormUpdate}
        onFormCancel={mockOnFormCancel}
        isFormEdit
        onSaveTimeTrackingSettings={mockOnSaveTimeTrackingSettings}
        id={id}
        isFormEditable={isFormEditable}
        isDataUpdating={isDataUpdating}
        formEditType="Timesheet"
      />,
    );
    fireEvent.click(screen.getByText('mocked-cancel'));
    expect(mockOnFormCancel).toHaveBeenCalledWith('Timesheet');
  });

  test('calls onSaveTimeTrackingSettings when save button is clicked', () => {
    render(
      <GeneralSettingSection
        ViewContent={ViewContent}
        EditContent={EditContent}
        Title={Title}
        onFormUpdate={mockOnFormUpdate}
        onFormCancel={mockOnFormCancel}
        isFormEdit
        onSaveTimeTrackingSettings={mockOnSaveTimeTrackingSettings}
        id={id}
        isFormEditable={isFormEditable}
        isDataUpdating={isDataUpdating}
        formEditType="Timesheet"
      />,
    );
    fireEvent.click(screen.getByText('mocked-save'));
    expect(mockOnSaveTimeTrackingSettings).toHaveBeenCalled();
  });

  test('renders new badge when configElement.isNew is true', () => {
    render(
      <GeneralSettingSection
        ViewContent={ViewContent}
        EditContent={EditContent}
        Title="New Feature Title"
        onFormUpdate={mockOnFormUpdate}
        onFormCancel={mockOnFormCancel}
        isFormEdit={false}
        onSaveTimeTrackingSettings={mockOnSaveTimeTrackingSettings}
        id={id}
        isFormEditable={isFormEditable}
        isDataUpdating={isDataUpdating}
        formEditType="General"
        isNewVisibleTill="2050-12-31" // setting this to a future date to ensure the badge is always visible for the test
      />,
    );

    expect(screen.getByTestId('new-badge')).toBeInTheDocument();
    expect(screen.getByTestId('new-badge')).toHaveTextContent('mocked-new');
  });

  test('does not render new badge when configElement.isNew is false', () => {
    render(
      <GeneralSettingSection
        ViewContent={ViewContent}
        EditContent={EditContent}
        Title="Existing Feature Title"
        onFormUpdate={mockOnFormUpdate}
        onFormCancel={mockOnFormCancel}
        isFormEdit={false}
        onSaveTimeTrackingSettings={mockOnSaveTimeTrackingSettings}
        id={id}
        isFormEditable={isFormEditable}
        isDataUpdating={isDataUpdating}
        formEditType="General"
      />,
    );

    expect(screen.queryByTestId('new-badge')).not.toBeInTheDocument();
  });

  test('does not render new badge when configElement is not found', () => {
    render(
      <GeneralSettingSection
        ViewContent={ViewContent}
        EditContent={EditContent}
        Title="Unknown Feature"
        onFormUpdate={mockOnFormUpdate}
        onFormCancel={mockOnFormCancel}
        isFormEdit={false}
        onSaveTimeTrackingSettings={mockOnSaveTimeTrackingSettings}
        id={id}
        isFormEditable={isFormEditable}
        isDataUpdating={isDataUpdating}
        formEditType="General"
      />,
    );

    expect(screen.queryByTestId('new-badge')).not.toBeInTheDocument();
  });
});

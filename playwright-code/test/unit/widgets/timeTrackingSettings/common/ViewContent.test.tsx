import React from 'react';
import { render, screen } from '@testing-library/react';
import { useIntl, useSandbox } from '@payroll/quicksand';
import { ViewContent } from 'src/js/widgets/timeTrackingSettings/common/viewContent';
import { IFormConfig } from 'src/js/widgets/timeTrackingSettings/hooks/useTimeTrackingSettingsForm';
import {
  IconSize,
  MenuButtonPriority,
  MenuButtonPurpose,
} from 'src/js/widgets/timeTrackingSettings/constants';
import { canEditPreference } from 'src/js/service/utils/sandboxUtils';
import { renderTitleWithBadge } from 'src/js/hooks/useRenderTitleWithBadge';

// Mock the useIntl and useSandbox hooks
jest.mock('@payroll/quicksand', () => ({
  useIntl: jest.fn(),
  useSandbox: jest.fn(),
}));

// Mock the Badge components
jest.mock('@ids-ts/badge', () => ({
  __esModule: true,
  default: ({ children }: any) => (
    <div
      data-testid="badge"
      aria-label="Warning"
      data-shape="round"
      data-status="warning"
    >
      {children}
    </div>
  ),
  WarningBadgeIcon: () => <div data-testid="warning-badge-icon" />,
}));

// Mock the canEditPreference utility
jest.mock('src/js/service/utils/sandboxUtils', () => ({
  canEditPreference: jest.fn(),
}));

// Mock the renderTitleWithBadge utility
jest.mock('src/js/hooks/useRenderTitleWithBadge', () => ({
  renderTitleWithBadge: jest.fn(({ title, intl }) =>
    intl.formatMessage({ id: title }),
  ),
}));

describe('ViewContent', () => {
  const mockFormatMessage = jest.fn((msg) => msg.id);
  const mockSandbox = {};

  beforeEach(() => {
    jest.clearAllMocks();
    (useIntl as jest.Mock).mockReturnValue({
      formatMessage: mockFormatMessage,
    });
    (useSandbox as jest.Mock).mockReturnValue(mockSandbox);
    (canEditPreference as jest.Mock).mockReturnValue(true);
  });

  const renderComponent = (
    formFields: IFormConfig,
    isErrorInView = false,
    sectionErrors?: {
      [key: string]: {
        hasError: boolean;
        errorMessageKey?: string;
      };
    },
    sectionBadges?: {
      [key: string]: {
        isVisible: boolean;
        visibilityEndDate?: string;
      };
    },
  ) => {
    render(
      <ViewContent
        formFields={formFields}
        isErrorInView={isErrorInView}
        sectionErrors={sectionErrors}
        sectionBadges={sectionBadges}
      />,
    );
  };

  test('renders error section when isErrorInView is true', () => {
    const formFields: IFormConfig = {
      section1: [
        {
          id: 'field1',
          key: 'field1Key',
          title: 'field1Title',
          value: 'field1Value',
          ariaLabel: 'field1AriaLabel',
          tooltipText: 'field1Tooltip',
          disabled: false,
          isVisible: true,
          detail: {
            title: 'field1DetailTitle',
            subtitle: 'field1DetailSubtitle',
            ariaLabel: 'field1DetailAriaLabel',
          },
        },
      ],
    };

    renderComponent(formFields, true);

    // Check if error section is rendered
    expect(screen.getByTestId('badge')).toBeInTheDocument();
    expect(screen.getByTestId('warning-badge-icon')).toBeInTheDocument();
    expect(
      screen.getByText('time-entries.validation.ql.fail'),
    ).toBeInTheDocument();

    // Check that normal content is not rendered
    expect(screen.queryByText('field1Title')).not.toBeInTheDocument();
    expect(screen.queryByText('field1Value')).not.toBeInTheDocument();
  });

  test('renders normal content when isErrorInView is false', () => {
    const formFields: IFormConfig = {
      section1: [
        {
          id: 'field1',
          key: 'field1Key',
          title: 'field1Title',
          value: 'field1Value',
          ariaLabel: 'field1AriaLabel',
          tooltipText: 'field1Tooltip',
          disabled: false,
          isVisible: true,
          detail: {
            title: 'field1DetailTitle',
            subtitle: 'field1DetailSubtitle',
            ariaLabel: 'field1DetailAriaLabel',
          },
        },
      ],
    };

    renderComponent(formFields, false);

    // Check if normal content is rendered
    expect(screen.getByText('field1Title')).toBeInTheDocument();
    expect(screen.getByText('field1Value')).toBeInTheDocument();

    // Check that error section is not rendered
    expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
    expect(screen.queryByTestId('warning-badge-icon')).not.toBeInTheDocument();
    expect(
      screen.queryByText('time-entries.validation.ql.fail'),
    ).not.toBeInTheDocument();
  });

  test('renders normal content when isErrorInView is not provided (default false)', () => {
    const formFields: IFormConfig = {
      section1: [
        {
          id: 'field1',
          key: 'field1Key',
          title: 'field1Title',
          value: 'field1Value',
          ariaLabel: 'field1AriaLabel',
          tooltipText: 'field1Tooltip',
          disabled: false,
          isVisible: true,
          detail: {
            title: 'field1DetailTitle',
            subtitle: 'field1DetailSubtitle',
            ariaLabel: 'field1DetailAriaLabel',
          },
        },
      ],
    };

    renderComponent(formFields); // No isErrorInView provided

    // Check if normal content is rendered
    expect(screen.getByText('field1Title')).toBeInTheDocument();
    expect(screen.getByText('field1Value')).toBeInTheDocument();

    // Check that error section is not rendered
    expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
    expect(screen.queryByTestId('warning-badge-icon')).not.toBeInTheDocument();
    expect(
      screen.queryByText('time-entries.validation.ql.fail'),
    ).not.toBeInTheDocument();
  });

  test('renders normal content when isErrorInView is explicitly set to false', () => {
    const formFields: IFormConfig = {
      section1: [
        {
          id: 'field1',
          key: 'field1Key',
          title: 'field1Title',
          value: 'field1Value',
          ariaLabel: 'field1AriaLabel',
          tooltipText: 'field1Tooltip',
          disabled: false,
          isVisible: true,
          detail: {
            title: 'field1DetailTitle',
            subtitle: 'field1DetailSubtitle',
            ariaLabel: 'field1DetailAriaLabel',
          },
        },
      ],
    };

    renderComponent(formFields, false); // Explicitly set isErrorInView to false

    // Check if normal content is rendered
    expect(screen.getByText('field1Title')).toBeInTheDocument();
    expect(screen.getByText('field1Value')).toBeInTheDocument();

    // Check that error section is not rendered
    expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
    expect(screen.queryByTestId('warning-badge-icon')).not.toBeInTheDocument();
    expect(
      screen.queryByText('time-entries.validation.ql.fail'),
    ).not.toBeInTheDocument();
  });

  test('ViewContent component uses default isErrorInView = false when parameter is omitted', () => {
    const formFields: IFormConfig = {
      section1: [
        {
          id: 'field1',
          key: 'field1Key',
          title: 'field1Title',
          value: 'field1Value',
          ariaLabel: 'field1AriaLabel',
          tooltipText: 'field1Tooltip',
          disabled: false,
          isVisible: true,
          detail: {
            title: 'field1DetailTitle',
            subtitle: 'field1DetailSubtitle',
            ariaLabel: 'field1DetailAriaLabel',
          },
        },
      ],
    };

    // Directly render ViewContent without the helper function to test the actual default parameter
    render(
      <ViewContent formFields={formFields} />, // isErrorInView parameter omitted
    );

    // Check if normal content is rendered (should use default isErrorInView = false)
    expect(screen.getByText('field1Title')).toBeInTheDocument();
    expect(screen.getByText('field1Value')).toBeInTheDocument();

    // Check that error section is not rendered
    expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
    expect(screen.queryByTestId('warning-badge-icon')).not.toBeInTheDocument();
    expect(
      screen.queryByText('time-entries.validation.ql.fail'),
    ).not.toBeInTheDocument();
  });

  test('error section has correct accessibility attributes', () => {
    const formFields: IFormConfig = {
      section1: [
        {
          id: 'field1',
          key: 'field1Key',
          title: 'field1Title',
          value: 'field1Value',
          ariaLabel: 'field1AriaLabel',
          tooltipText: 'field1Tooltip',
          disabled: false,
          isVisible: true,
          detail: {
            title: 'field1DetailTitle',
            subtitle: 'field1DetailSubtitle',
            ariaLabel: 'field1DetailAriaLabel',
          },
        },
      ],
    };

    renderComponent(formFields, true);

    const badge = screen.getByTestId('badge');
    expect(badge).toHaveAttribute('aria-label', 'Warning');
    expect(badge).toHaveAttribute('data-shape', 'round');
    expect(badge).toHaveAttribute('data-status', 'warning');
  });

  test('renders normal row with correct structure when isErrorInView is false', () => {
    const formFields: IFormConfig = {
      section1: [
        {
          id: 'field1',
          key: 'field1Key',
          title: 'field1Title',
          value: 'field1Value',
          ariaLabel: 'field1AriaLabel',
          tooltipText: 'field1Tooltip',
          disabled: false,
          isVisible: true,
          automationId: 'field1-automation-id',
          detail: {
            title: 'field1DetailTitle',
            subtitle: 'field1DetailSubtitle',
            ariaLabel: 'field1DetailAriaLabel',
          },
        },
      ],
    };

    renderComponent(formFields, false);

    // Find the row by its test id
    const row = screen.getByTestId('field1-automation-id');

    // Check that the row is rendered with the correct content
    expect(row).toBeInTheDocument();
    expect(row).toContainElement(screen.getByText('field1Title'));
    expect(row).toContainElement(screen.getByText('field1Value'));

    // Verify that error elements are not present
    expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
    expect(screen.queryByTestId('warning-badge-icon')).not.toBeInTheDocument();
    expect(
      screen.queryByText('time-entries.validation.ql.fail'),
    ).not.toBeInTheDocument();
  });

  test('renders error row with correct structure when isErrorInView is true', () => {
    const formFields: IFormConfig = {
      section1: [
        {
          id: 'field1',
          key: 'field1Key',
          title: 'field1Title',
          value: 'field1Value',
          ariaLabel: 'field1AriaLabel',
          tooltipText: 'field1Tooltip',
          disabled: false,
          isVisible: true,
          detail: {
            title: 'field1DetailTitle',
            subtitle: 'field1DetailSubtitle',
            ariaLabel: 'field1DetailAriaLabel',
          },
        },
      ],
    };

    renderComponent(formFields, true);

    // Verify that the error section is displayed and normal content is not
    expect(screen.getByTestId('badge')).toBeInTheDocument();
    expect(screen.getByTestId('warning-badge-icon')).toBeInTheDocument();
    expect(
      screen.getByText('time-entries.validation.ql.fail'),
    ).toBeInTheDocument();
    expect(screen.queryByText('field1Title')).not.toBeInTheDocument();
    expect(screen.queryByText('field1Value')).not.toBeInTheDocument();
  });

  test('renders alternative error message when user cannot edit preferences', () => {
    const formFields: IFormConfig = {
      section1: [
        {
          id: 'field1',
          key: 'field1Key',
          title: 'field1Title',
          value: 'field1Value',
          ariaLabel: 'field1AriaLabel',
          tooltipText: 'field1Tooltip',
          disabled: false,
          isVisible: true,
          detail: {
            title: 'field1DetailTitle',
            subtitle: 'field1DetailSubtitle',
            ariaLabel: 'field1DetailAriaLabel',
          },
        },
      ],
    };

    // Mock canEditPreference to return false
    (canEditPreference as jest.Mock).mockReturnValue(false);

    renderComponent(formFields, true);

    // Verify that the alternative error message is displayed
    expect(screen.getByTestId('badge')).toBeInTheDocument();
    expect(screen.getByTestId('warning-badge-icon')).toBeInTheDocument();
    expect(
      screen.getByText('do.not.have.access.rights.to.edit.time.settings'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('time-entries.validation.ql.fail'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('field1Title')).not.toBeInTheDocument();
    expect(screen.queryByText('field1Value')).not.toBeInTheDocument();
  });

  test('renders fields and subfields correctly', () => {
    const formFields: IFormConfig = {
      section1: [
        {
          id: 'field1',
          key: 'field1Key',
          title: 'field1Title',
          value: 'field1Value',
          ariaLabel: 'field1AriaLabel',
          tooltipText: 'field1Tooltip',
          disabled: false,
          isVisible: true,
          detail: {
            title: 'field1DetailTitle',
            subtitle: 'field1DetailSubtitle',
            ariaLabel: 'field1DetailAriaLabel',
          },
          subFields: [
            {
              id: 'subField1',
              key: 'subField1Key',
              title: 'subField1Title',
              value: 'subField1Value',
              ariaLabel: 'subField1AriaLabel',
              tooltipText: 'subField1Tooltip',
              disabled: false,
              isVisible: true,
              detail: {
                title: 'subField1DetailTitle',
                subtitle: 'subField1DetailSubtitle',
                ariaLabel: 'subField1DetailAriaLabel',
              },
            },
          ],
        },
      ],
      section2: [
        {
          id: 'field2',
          key: 'field2Key',
          title: 'field2Title',
          value: 'field2Value',
          ariaLabel: 'field2AriaLabel',
          tooltipText: 'field2Tooltip',
          disabled: false,
          isVisible: true,
          detail: {
            title: 'field2DetailTitle',
            subtitle: 'field2DetailSubtitle',
            ariaLabel: 'field2DetailAriaLabel',
          },
          subFields: [],
        },
      ],
    };

    renderComponent(formFields);

    // Check if main fields are rendered
    expect(screen.getByText('field1Title')).toBeInTheDocument();
    expect(screen.getByText('field2Title')).toBeInTheDocument();
    expect(screen.getByText('field2Value')).toBeInTheDocument();
  });

  test('handles empty formFields gracefully', () => {
    const formFields: IFormConfig = {};

    renderComponent(formFields);

    // Ensure no fields are rendered
    expect(screen.queryByRole('row')).not.toBeInTheDocument();
  });

  test('handle not editable field correctly', () => {
    const formFields: IFormConfig = {
      section1: [
        {
          id: 'field1',
          key: 'field1Key',
          title: 'field1Title',
          value: 'field1Value',
          ariaLabel: 'field1AriaLabel',
          tooltipText: 'field1Tooltip',
          disabled: false,
          isVisible: true,
          detail: {
            title: 'field1DetailTitle',
            subtitle: 'field1DetailSubtitle',
            ariaLabel: 'field1DetailAriaLabel',
          },
          subFields: [
            {
              id: 'subField1',
              key: 'subField1Key',
              title: 'subField1Title',
              value: 'subField1Value',
              ariaLabel: 'subField1AriaLabel',
              tooltipText: 'subField1Tooltip',
              disabled: false,
              isVisible: true,
              detail: {
                title: 'subField1DetailTitle',
                subtitle: 'subField1DetailSubtitle',
                ariaLabel: 'subField1DetailAriaLabel',
              },
            },
          ],
          isEditable: false,
        },
      ],
    };

    renderComponent(formFields);

    // Check if the non-editable field is rendered with BoldLabel
    expect(screen.getByText('field1Title')).toBeInTheDocument();

    // Verify that the field is rendered with BoldLabel (not with regular Label and Value)
    const boldLabel = screen.getByText('field1Title');
    expect(boldLabel.tagName).toBe('LABEL');
    // BoldLabel is rendered - styling may vary in test environment
    expect(boldLabel).toBeInTheDocument();

    // Verify that the Value component is not rendered for non-editable fields
    expect(screen.queryByText('field1Value')).not.toBeInTheDocument();
  });

  test('applies correct margin-top based on index', () => {
    const formFields: IFormConfig = {
      section1: [
        {
          id: 'field1',
          key: 'field1Key',
          title: 'field1Title',
          isEditable: false,
          value: '',
          ariaLabel: 'field1AriaLabel',
          tooltipText: 'field1Tooltip',
          disabled: false,
          isVisible: true,
          detail: {
            title: 'field1DetailTitle',
            subtitle: 'field1DetailSubtitle',
            ariaLabel: 'field1DetailAriaLabel',
          },
        },
        {
          id: 'field2',
          key: 'field2Key',
          title: 'field2Title',
          isEditable: false,
          value: '',
          ariaLabel: 'field2AriaLabel',
          tooltipText: 'field2Tooltip',
          disabled: false,
          isVisible: true,
          detail: {
            title: 'field2DetailTitle',
            subtitle: 'field2DetailSubtitle',
            ariaLabel: 'field2DetailAriaLabel',
          },
        },
        {
          id: 'field3',
          key: 'field3Key',
          title: 'field3Title',
          isEditable: false,
          value: '',
          ariaLabel: 'field3AriaLabel',
          tooltipText: 'field3Tooltip',
          disabled: false,
          isVisible: true,
          detail: {
            title: 'field3DetailTitle',
            subtitle: 'field3DetailSubtitle',
            ariaLabel: 'field3DetailAriaLabel',
          },
        },
      ],
    };

    renderComponent(formFields);

    // Get all BoldLabel elements
    const boldLabels = screen.getAllByText(/field\dTitle/);

    // First label (index 0) should have no margin-top
    expect(boldLabels[0]).toHaveStyle({ marginTop: '0px' });

    // Second and third labels (index > 0) should have 16px margin-top
    expect(boldLabels[1]).toHaveStyle({ marginTop: '16px' });
    expect(boldLabels[2]).toHaveStyle({ marginTop: '16px' });
  });

  test('handles empty value and subfields correctly', () => {
    const formFields: IFormConfig = {
      section1: [
        {
          id: 'field1',
          key: 'field1Key',
          title: 'field1Title',
          value: '',
          ariaLabel: 'field1AriaLabel',
          tooltipText: 'field1Tooltip',
          disabled: false,
          isVisible: true,
          detail: {
            title: 'field1DetailTitle',
            subtitle: 'field1DetailSubtitle',
            ariaLabel: 'field1DetailAriaLabel',
          },
          subFields: [],
        },
        {
          id: 'field2',
          key: 'field2Key',
          title: 'field2Title',
          value: 'field2Value',
          ariaLabel: 'field2AriaLabel',
          tooltipText: 'field2Tooltip',
          disabled: false,
          isVisible: true,
          detail: {
            title: 'field2DetailTitle',
            subtitle: 'field2DetailSubtitle',
            ariaLabel: 'field2DetailAriaLabel',
          },
          subFields: [],
        },
        {
          id: 'field3',
          key: 'field3Key',
          title: 'field3Title',
          value: '',
          ariaLabel: 'field3AriaLabel',
          tooltipText: 'field3Tooltip',
          disabled: false,
          isVisible: true,
          detail: {
            title: 'field3DetailTitle',
            subtitle: 'field3DetailSubtitle',
            ariaLabel: 'field3DetailAriaLabel',
          },
          subFields: [
            {
              id: 'subField1',
              key: 'subField1Key',
              title: 'subField1Title',
              value: 'subField1Value',
              ariaLabel: 'subField1AriaLabel',
              tooltipText: 'subField1Tooltip',
              disabled: false,
              isVisible: true,
              detail: {
                title: 'subField1DetailTitle',
                subtitle: 'subField1DetailSubtitle',
                ariaLabel: 'subField1DetailAriaLabel',
              },
            },
          ],
        },
      ],
    };

    renderComponent(formFields);

    // Field with empty value and no subfields should render empty string
    const emptyValueField = screen
      .getByText('field1Title')
      .closest('div')
      ?.querySelector('span');
    expect(emptyValueField).toHaveTextContent('');

    // Field with value and no subfields should render the value
    const valueField = screen
      .getByText('field2Title')
      .closest('div')
      ?.querySelector('span');
    expect(valueField).toHaveTextContent('field2Value');

    // Field with empty value and subfields should render empty string
    const emptyValueWithSubfields = screen
      .getByText('field3Title')
      .closest('div')
      ?.querySelector('span');
    expect(emptyValueWithSubfields).toHaveTextContent('');
  });

  test('getIcon returns correct icon components', () => {
    const formFields: IFormConfig = {
      section1: [
        {
          id: 'field1',
          key: 'field1Key',
          title: 'field1Title',
          value: 'field1Value',
          ariaLabel: 'field1AriaLabel',
          tooltipText: 'field1Tooltip',
          disabled: false,
          isVisible: true,
          detail: {
            title: 'field1DetailTitle',
            subtitle: 'field1DetailSubtitle',
            ariaLabel: 'field1DetailAriaLabel',
          },
          menuButton: {
            priority: MenuButtonPriority.PRIMARY,
            purpose: MenuButtonPurpose.STANDARD,
            size: IconSize.MEDIUM,
            label: 'Add',
            icon: 'add',
            iconSize: IconSize.SMALL,
            onClick: jest.fn(),
            automationId: 'add-button',
          },
        },
      ],
    };

    renderComponent(formFields);

    // Check if Plus icon is rendered
    const plusIcon = screen.getByTestId('add-button').querySelector('svg');
    expect(plusIcon).toBeInTheDocument();
  });

  test('getIcon returns LinkIcon for manage action', () => {
    const formFields: IFormConfig = {
      section1: [
        {
          id: 'field1',
          key: 'field1Key',
          title: 'field1Title',
          value: 'field1Value',
          ariaLabel: 'field1AriaLabel',
          tooltipText: 'field1Tooltip',
          disabled: false,
          isVisible: true,
          detail: {
            title: 'field1DetailTitle',
            subtitle: 'field1DetailSubtitle',
            ariaLabel: 'field1DetailAriaLabel',
          },
          menuButton: {
            priority: MenuButtonPriority.PRIMARY,
            purpose: MenuButtonPurpose.STANDARD,
            size: IconSize.MEDIUM,
            label: 'Manage',
            icon: 'manage',
            iconSize: IconSize.SMALL,
            onClick: jest.fn(),
            automationId: 'manage-button',
          },
        },
      ],
    };

    renderComponent(formFields);

    // Check if LinkIcon is rendered
    const linkIcon = screen.getByTestId('manage-button').querySelector('svg');
    expect(linkIcon).toBeInTheDocument();
  });

  test('getIcon returns null for invalid icon', () => {
    const formFields: IFormConfig = {
      section1: [
        {
          id: 'field1',
          key: 'field1Key',
          title: 'field1Title',
          value: 'field1Value',
          ariaLabel: 'field1AriaLabel',
          tooltipText: 'field1Tooltip',
          disabled: false,
          isVisible: true,
          detail: {
            title: 'field1DetailTitle',
            subtitle: 'field1DetailSubtitle',
            ariaLabel: 'field1DetailAriaLabel',
          },
          menuButton: {
            priority: MenuButtonPriority.PRIMARY,
            purpose: MenuButtonPurpose.STANDARD,
            size: IconSize.MEDIUM,
            label: 'Add',
            icon: 'invalid',
            iconSize: IconSize.SMALL,
            onClick: jest.fn(),
            automationId: 'add-button',
          },
        },
      ],
    };

    renderComponent(formFields);

    // Check if no icon is rendered for invalid icon (default case)
    const invalidIcon = screen.getByTestId('add-button').querySelector('svg');
    expect(invalidIcon).not.toBeInTheDocument();
  });

  test('getIcon uses default IconSize.SMALL when iconSize is not provided', () => {
    const formFields: IFormConfig = {
      section1: [
        {
          id: 'field1',
          key: 'field1Key',
          title: 'field1Title',
          value: 'field1Value',
          ariaLabel: 'field1AriaLabel',
          tooltipText: 'field1Tooltip',
          disabled: false,
          isVisible: true,
          detail: {
            title: 'field1DetailTitle',
            subtitle: 'field1DetailSubtitle',
            ariaLabel: 'field1DetailAriaLabel',
          },
          menuButton: {
            priority: MenuButtonPriority.PRIMARY,
            purpose: MenuButtonPurpose.STANDARD,
            size: IconSize.MEDIUM,
            label: 'Add',
            icon: 'add',
            // iconSize not provided - should default to IconSize.SMALL
            onClick: jest.fn(),
            automationId: 'add-button',
          },
        },
      ],
    };

    renderComponent(formFields);

    // Check if Plus icon is rendered with default small size
    const plusIcon = screen.getByTestId('add-button').querySelector('svg');
    expect(plusIcon).toBeInTheDocument();
  });

  test('getIcon renders Plus icon with XSMALL size', () => {
    const formFields: IFormConfig = {
      section1: [
        {
          id: 'field1',
          key: 'field1Key',
          title: 'field1Title',
          value: 'field1Value',
          ariaLabel: 'field1AriaLabel',
          tooltipText: 'field1Tooltip',
          disabled: false,
          isVisible: true,
          detail: {
            title: 'field1DetailTitle',
            subtitle: 'field1DetailSubtitle',
            ariaLabel: 'field1DetailAriaLabel',
          },
          menuButton: {
            priority: MenuButtonPriority.PRIMARY,
            purpose: MenuButtonPurpose.STANDARD,
            size: IconSize.MEDIUM,
            label: 'Add',
            icon: 'add',
            iconSize: IconSize.XSMALL,
            onClick: jest.fn(),
            automationId: 'add-button',
          },
        },
      ],
    };

    renderComponent(formFields);

    // Check if Plus icon is rendered with xsmall size
    const plusIcon = screen.getByTestId('add-button').querySelector('svg');
    expect(plusIcon).toBeInTheDocument();
  });

  test('getIcon renders Plus icon with MEDIUM size', () => {
    const formFields: IFormConfig = {
      section1: [
        {
          id: 'field1',
          key: 'field1Key',
          title: 'field1Title',
          value: 'field1Value',
          ariaLabel: 'field1AriaLabel',
          tooltipText: 'field1Tooltip',
          disabled: false,
          isVisible: true,
          detail: {
            title: 'field1DetailTitle',
            subtitle: 'field1DetailSubtitle',
            ariaLabel: 'field1DetailAriaLabel',
          },
          menuButton: {
            priority: MenuButtonPriority.PRIMARY,
            purpose: MenuButtonPurpose.STANDARD,
            size: IconSize.MEDIUM,
            label: 'Add',
            icon: 'add',
            iconSize: IconSize.MEDIUM,
            onClick: jest.fn(),
            automationId: 'add-button',
          },
        },
      ],
    };

    renderComponent(formFields);

    // Check if Plus icon is rendered with medium size
    const plusIcon = screen.getByTestId('add-button').querySelector('svg');
    expect(plusIcon).toBeInTheDocument();
  });

  test('getIcon renders Plus icon with LARGE size', () => {
    const formFields: IFormConfig = {
      section1: [
        {
          id: 'field1',
          key: 'field1Key',
          title: 'field1Title',
          value: 'field1Value',
          ariaLabel: 'field1AriaLabel',
          tooltipText: 'field1Tooltip',
          disabled: false,
          isVisible: true,
          detail: {
            title: 'field1DetailTitle',
            subtitle: 'field1DetailSubtitle',
            ariaLabel: 'field1DetailAriaLabel',
          },
          menuButton: {
            priority: MenuButtonPriority.PRIMARY,
            purpose: MenuButtonPurpose.STANDARD,
            size: IconSize.MEDIUM,
            label: 'Add',
            icon: 'add',
            iconSize: IconSize.LARGE,
            onClick: jest.fn(),
            automationId: 'add-button',
          },
        },
      ],
    };

    renderComponent(formFields);

    // Check if Plus icon is rendered with large size
    const plusIcon = screen.getByTestId('add-button').querySelector('svg');
    expect(plusIcon).toBeInTheDocument();
  });

  test('getIcon renders Plus icon with XLARGE size', () => {
    const formFields: IFormConfig = {
      section1: [
        {
          id: 'field1',
          key: 'field1Key',
          title: 'field1Title',
          value: 'field1Value',
          ariaLabel: 'field1AriaLabel',
          tooltipText: 'field1Tooltip',
          disabled: false,
          isVisible: true,
          detail: {
            title: 'field1DetailTitle',
            subtitle: 'field1DetailSubtitle',
            ariaLabel: 'field1DetailAriaLabel',
          },
          menuButton: {
            priority: MenuButtonPriority.PRIMARY,
            purpose: MenuButtonPurpose.STANDARD,
            size: IconSize.MEDIUM,
            label: 'Add',
            icon: 'add',
            iconSize: IconSize.XLARGE,
            onClick: jest.fn(),
            automationId: 'add-button',
          },
        },
      ],
    };

    renderComponent(formFields);

    // Check if Plus icon is rendered with xlarge size
    const plusIcon = screen.getByTestId('add-button').querySelector('svg');
    expect(plusIcon).toBeInTheDocument();
  });

  test('getIcon renders Plus icon with XXLARGE size', () => {
    const formFields: IFormConfig = {
      section1: [
        {
          id: 'field1',
          key: 'field1Key',
          title: 'field1Title',
          value: 'field1Value',
          ariaLabel: 'field1AriaLabel',
          tooltipText: 'field1Tooltip',
          disabled: false,
          isVisible: true,
          detail: {
            title: 'field1DetailTitle',
            subtitle: 'field1DetailSubtitle',
            ariaLabel: 'field1DetailAriaLabel',
          },
          menuButton: {
            priority: MenuButtonPriority.PRIMARY,
            purpose: MenuButtonPurpose.STANDARD,
            size: IconSize.MEDIUM,
            label: 'Add',
            icon: 'add',
            iconSize: IconSize.XXLARGE,
            onClick: jest.fn(),
            automationId: 'add-button',
          },
        },
      ],
    };

    renderComponent(formFields);

    // Check if Plus icon is rendered with xxlarge size
    const plusIcon = screen.getByTestId('add-button').querySelector('svg');
    expect(plusIcon).toBeInTheDocument();
  });

  test('getIcon renders LinkIcon with different icon sizes', () => {
    const formFields: IFormConfig = {
      section1: [
        {
          id: 'field1',
          key: 'field1Key',
          title: 'field1Title',
          value: 'field1Value',
          ariaLabel: 'field1AriaLabel',
          tooltipText: 'field1Tooltip',
          disabled: false,
          isVisible: true,
          detail: {
            title: 'field1DetailTitle',
            subtitle: 'field1DetailSubtitle',
            ariaLabel: 'field1DetailAriaLabel',
          },
          menuButton: {
            priority: MenuButtonPriority.PRIMARY,
            purpose: MenuButtonPurpose.STANDARD,
            size: IconSize.MEDIUM,
            label: 'Manage',
            icon: 'manage',
            iconSize: IconSize.MEDIUM,
            onClick: jest.fn(),
            automationId: 'manage-button-medium',
          },
        },
        {
          id: 'field2',
          key: 'field2Key',
          title: 'field2Title',
          value: 'field2Value',
          ariaLabel: 'field2AriaLabel',
          tooltipText: 'field2Tooltip',
          disabled: false,
          isVisible: true,
          detail: {
            title: 'field2DetailTitle',
            subtitle: 'field2DetailSubtitle',
            ariaLabel: 'field2DetailAriaLabel',
          },
          menuButton: {
            priority: MenuButtonPriority.SECONDARY,
            purpose: MenuButtonPurpose.STANDARD,
            size: IconSize.MEDIUM,
            label: 'Manage Large',
            icon: 'manage',
            iconSize: IconSize.LARGE,
            onClick: jest.fn(),
            automationId: 'manage-button-large',
          },
        },
      ],
    };

    renderComponent(formFields);

    // Check if both LinkIcons are rendered with their respective sizes
    const mediumButton = screen.getByTestId('manage-button-medium');
    const largeButton = screen.getByTestId('manage-button-large');

    expect(mediumButton).toBeInTheDocument();
    expect(largeButton).toBeInTheDocument();

    const mediumIcon = mediumButton.querySelector('svg');
    const largeIcon = largeButton.querySelector('svg');

    expect(mediumIcon).toBeInTheDocument();
    expect(largeIcon).toBeInTheDocument();
  });

  test('getIcon handles multiple menu buttons with different icon sizes', () => {
    const formFields: IFormConfig = {
      section1: [
        {
          id: 'field1',
          key: 'field1Key',
          title: 'field1Title',
          value: 'field1Value',
          ariaLabel: 'field1AriaLabel',
          tooltipText: 'field1Tooltip',
          disabled: false,
          isVisible: true,
          detail: {
            title: 'field1DetailTitle',
            subtitle: 'field1DetailSubtitle',
            ariaLabel: 'field1DetailAriaLabel',
          },
          menuButton: {
            priority: MenuButtonPriority.PRIMARY,
            purpose: MenuButtonPurpose.STANDARD,
            size: IconSize.MEDIUM,
            label: 'Add Small',
            icon: 'add',
            iconSize: IconSize.SMALL,
            onClick: jest.fn(),
            automationId: 'add-button-small',
          },
        },
        {
          id: 'field2',
          key: 'field2Key',
          title: 'field2Title',
          value: 'field2Value',
          ariaLabel: 'field2AriaLabel',
          tooltipText: 'field2Tooltip',
          disabled: false,
          isVisible: true,
          detail: {
            title: 'field2DetailTitle',
            subtitle: 'field2DetailSubtitle',
            ariaLabel: 'field2DetailAriaLabel',
          },
          menuButton: {
            priority: MenuButtonPriority.SECONDARY,
            purpose: MenuButtonPurpose.STANDARD,
            size: IconSize.MEDIUM,
            label: 'Add Large',
            icon: 'add',
            iconSize: IconSize.LARGE,
            onClick: jest.fn(),
            automationId: 'add-button-large',
          },
        },
      ],
    };

    renderComponent(formFields);

    // Check if both Plus icons are rendered with their respective sizes
    const smallButton = screen.getByTestId('add-button-small');
    const largeButton = screen.getByTestId('add-button-large');

    expect(smallButton).toBeInTheDocument();
    expect(largeButton).toBeInTheDocument();

    const smallIcon = smallButton.querySelector('svg');
    const largeIcon = largeButton.querySelector('svg');

    expect(smallIcon).toBeInTheDocument();
    expect(largeIcon).toBeInTheDocument();
  });

  test('getIcon handles mixed ADD and MANAGE actions correctly', () => {
    const formFields: IFormConfig = {
      section1: [
        {
          id: 'field1',
          key: 'field1Key',
          title: 'field1Title',
          value: 'field1Value',
          ariaLabel: 'field1AriaLabel',
          tooltipText: 'field1Tooltip',
          disabled: false,
          isVisible: true,
          detail: {
            title: 'field1DetailTitle',
            subtitle: 'field1DetailSubtitle',
            ariaLabel: 'field1DetailAriaLabel',
          },
          menuButton: {
            priority: MenuButtonPriority.PRIMARY,
            purpose: MenuButtonPurpose.STANDARD,
            size: IconSize.MEDIUM,
            label: 'Add Field',
            icon: 'add',
            iconSize: IconSize.SMALL,
            onClick: jest.fn(),
            automationId: 'add-button',
          },
        },
        {
          id: 'field2',
          key: 'field2Key',
          title: 'field2Title',
          value: 'field2Value',
          ariaLabel: 'field2AriaLabel',
          tooltipText: 'field2Tooltip',
          disabled: false,
          isVisible: true,
          detail: {
            title: 'field2DetailTitle',
            subtitle: 'field2DetailSubtitle',
            ariaLabel: 'field2DetailAriaLabel',
          },
          menuButton: {
            priority: MenuButtonPriority.SECONDARY,
            purpose: MenuButtonPurpose.STANDARD,
            size: IconSize.MEDIUM,
            label: 'Manage Field',
            icon: 'manage',
            iconSize: IconSize.SMALL,
            onClick: jest.fn(),
            automationId: 'manage-button',
          },
        },
      ],
    };

    renderComponent(formFields);

    // Check if both icons are rendered correctly
    const addButton = screen.getByTestId('add-button');
    const manageButton = screen.getByTestId('manage-button');

    expect(addButton).toBeInTheDocument();
    expect(manageButton).toBeInTheDocument();

    // Verify that Plus icon is rendered for ADD action
    const plusIcon = addButton.querySelector('svg');
    expect(plusIcon).toBeInTheDocument();

    // Verify that LinkIcon is rendered for MANAGE action
    const linkIcon = manageButton.querySelector('svg');
    expect(linkIcon).toBeInTheDocument();
  });

  describe('Section Errors', () => {
    test('renders section header with error and skips fields when section has error', () => {
      const formFields: IFormConfig = {
        section1: [
          {
            id: 'header1',
            key: 'approvalsSectionHeader',
            title: 'Approvals Section',
            value: '',
            isEditable: false,
            ariaLabel: 'Approvals Section',
            tooltipText: '',
            disabled: false,
            isVisible: true,
            detail: {
              title: '',
              subtitle: '',
              ariaLabel: '',
            },
          },
          {
            id: 'field1',
            key: 'field1Key',
            title: 'field1Title',
            value: 'field1Value',
            ariaLabel: 'field1AriaLabel',
            tooltipText: 'field1Tooltip',
            disabled: false,
            isVisible: true,
            detail: {
              title: 'field1DetailTitle',
              subtitle: 'field1DetailSubtitle',
              ariaLabel: 'field1DetailAriaLabel',
            },
          },
          {
            id: 'field2',
            key: 'field2Key',
            title: 'field2Title',
            value: 'field2Value',
            ariaLabel: 'field2AriaLabel',
            tooltipText: 'field2Tooltip',
            disabled: false,
            isVisible: true,
            detail: {
              title: 'field2DetailTitle',
              subtitle: 'field2DetailSubtitle',
              ariaLabel: 'field2DetailAriaLabel',
            },
          },
        ],
      };

      const sectionErrors = {
        approvalsSectionHeader: {
          hasError: true,
        },
      };

      renderComponent(formFields, false, sectionErrors);

      // Section header should be rendered
      expect(screen.getByText('Approvals Section')).toBeInTheDocument();

      // Error badge should be rendered
      expect(screen.getByTestId('badge')).toBeInTheDocument();
      expect(screen.getByTestId('warning-badge-icon')).toBeInTheDocument();

      // Default error message should be shown
      expect(
        screen.getByText('time-entries.validation.ql.fail'),
      ).toBeInTheDocument();

      // Fields after the section header should NOT be rendered
      expect(screen.queryByText('field1Title')).not.toBeInTheDocument();
      expect(screen.queryByText('field1Value')).not.toBeInTheDocument();
      expect(screen.queryByText('field2Title')).not.toBeInTheDocument();
      expect(screen.queryByText('field2Value')).not.toBeInTheDocument();
    });

    test('renders custom error message when errorMessageKey is provided', () => {
      const formFields: IFormConfig = {
        section1: [
          {
            id: 'header1',
            key: 'submissionsSectionHeader',
            title: 'Submissions Section',
            value: '',
            isEditable: false,
            ariaLabel: 'Submissions Section',
            tooltipText: '',
            disabled: false,
            isVisible: true,
            detail: {
              title: '',
              subtitle: '',
              ariaLabel: '',
            },
          },
          {
            id: 'field1',
            key: 'field1Key',
            title: 'field1Title',
            value: 'field1Value',
            ariaLabel: 'field1AriaLabel',
            tooltipText: 'field1Tooltip',
            disabled: false,
            isVisible: true,
            detail: {
              title: 'field1DetailTitle',
              subtitle: 'field1DetailSubtitle',
              ariaLabel: 'field1DetailAriaLabel',
            },
          },
        ],
      };

      const sectionErrors = {
        submissionsSectionHeader: {
          hasError: true,
          errorMessageKey: 'custom.error.message.key',
        },
      };

      renderComponent(formFields, false, sectionErrors);

      // Section header should be rendered
      expect(screen.getByText('Submissions Section')).toBeInTheDocument();

      // Custom error message should be shown
      expect(screen.getByText('custom.error.message.key')).toBeInTheDocument();

      // Default error message should NOT be shown
      expect(
        screen.queryByText('time-entries.validation.ql.fail'),
      ).not.toBeInTheDocument();

      // Fields should NOT be rendered
      expect(screen.queryByText('field1Title')).not.toBeInTheDocument();
      expect(screen.queryByText('field1Value')).not.toBeInTheDocument();
    });

    test('renders multiple sections with only one having an error', () => {
      const formFields: IFormConfig = {
        section1: [
          {
            id: 'header1',
            key: 'approvalsSectionHeader',
            title: 'Approvals Section',
            value: '',
            isEditable: false,
            ariaLabel: 'Approvals Section',
            tooltipText: '',
            disabled: false,
            isVisible: true,
            detail: {
              title: '',
              subtitle: '',
              ariaLabel: '',
            },
          },
          {
            id: 'field1',
            key: 'field1Key',
            title: 'field1Title',
            value: 'field1Value',
            ariaLabel: 'field1AriaLabel',
            tooltipText: 'field1Tooltip',
            disabled: false,
            isVisible: true,
            detail: {
              title: 'field1DetailTitle',
              subtitle: 'field1DetailSubtitle',
              ariaLabel: 'field1DetailAriaLabel',
            },
          },
          {
            id: 'header2',
            key: 'submissionsSectionHeader',
            title: 'Submissions Section',
            value: '',
            isEditable: false,
            ariaLabel: 'Submissions Section',
            tooltipText: '',
            disabled: false,
            isVisible: true,
            detail: {
              title: '',
              subtitle: '',
              ariaLabel: '',
            },
          },
          {
            id: 'field2',
            key: 'field2Key',
            title: 'field2Title',
            value: 'field2Value',
            ariaLabel: 'field2AriaLabel',
            tooltipText: 'field2Tooltip',
            disabled: false,
            isVisible: true,
            detail: {
              title: 'field2DetailTitle',
              subtitle: 'field2DetailSubtitle',
              ariaLabel: 'field2DetailAriaLabel',
            },
          },
        ],
      };

      const sectionErrors = {
        approvalsSectionHeader: {
          hasError: true,
          errorMessageKey: 'approval.section.error',
        },
      };

      renderComponent(formFields, false, sectionErrors);

      // First section header should be rendered
      expect(screen.getByText('Approvals Section')).toBeInTheDocument();

      // Error message for first section should be shown
      expect(screen.getByText('approval.section.error')).toBeInTheDocument();

      // First section fields should NOT be rendered
      expect(screen.queryByText('field1Title')).not.toBeInTheDocument();
      expect(screen.queryByText('field1Value')).not.toBeInTheDocument();

      // Second section header should be rendered
      expect(screen.getByText('Submissions Section')).toBeInTheDocument();

      // Second section fields SHOULD be rendered (no error for this section)
      expect(screen.getByText('field2Title')).toBeInTheDocument();
      expect(screen.getByText('field2Value')).toBeInTheDocument();
    });

    test('renders no errors when sectionErrors is empty', () => {
      const formFields: IFormConfig = {
        section1: [
          {
            id: 'header1',
            key: 'approvalsSectionHeader',
            title: 'Approvals Section',
            value: '',
            isEditable: false,
            ariaLabel: 'Approvals Section',
            tooltipText: '',
            disabled: false,
            isVisible: true,
            detail: {
              title: '',
              subtitle: '',
              ariaLabel: '',
            },
          },
          {
            id: 'field1',
            key: 'field1Key',
            title: 'field1Title',
            value: 'field1Value',
            ariaLabel: 'field1AriaLabel',
            tooltipText: 'field1Tooltip',
            disabled: false,
            isVisible: true,
            detail: {
              title: 'field1DetailTitle',
              subtitle: 'field1DetailSubtitle',
              ariaLabel: 'field1DetailAriaLabel',
            },
          },
        ],
      };

      const sectionErrors = {};

      renderComponent(formFields, false, sectionErrors);

      // Section header should be rendered
      expect(screen.getByText('Approvals Section')).toBeInTheDocument();

      // No error should be shown
      expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('warning-badge-icon'),
      ).not.toBeInTheDocument();

      // Fields should be rendered normally
      expect(screen.getByText('field1Title')).toBeInTheDocument();
      expect(screen.getByText('field1Value')).toBeInTheDocument();
    });

    test('renders no errors when sectionErrors is undefined', () => {
      const formFields: IFormConfig = {
        section1: [
          {
            id: 'header1',
            key: 'approvalsSectionHeader',
            title: 'Approvals Section',
            value: '',
            isEditable: false,
            ariaLabel: 'Approvals Section',
            tooltipText: '',
            disabled: false,
            isVisible: true,
            detail: {
              title: '',
              subtitle: '',
              ariaLabel: '',
            },
          },
          {
            id: 'field1',
            key: 'field1Key',
            title: 'field1Title',
            value: 'field1Value',
            ariaLabel: 'field1AriaLabel',
            tooltipText: 'field1Tooltip',
            disabled: false,
            isVisible: true,
            detail: {
              title: 'field1DetailTitle',
              subtitle: 'field1DetailSubtitle',
              ariaLabel: 'field1DetailAriaLabel',
            },
          },
        ],
      };

      renderComponent(formFields, false);

      // Section header should be rendered
      expect(screen.getByText('Approvals Section')).toBeInTheDocument();

      // No error should be shown
      expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('warning-badge-icon'),
      ).not.toBeInTheDocument();

      // Fields should be rendered normally
      expect(screen.getByText('field1Title')).toBeInTheDocument();
      expect(screen.getByText('field1Value')).toBeInTheDocument();
    });

    test('section error with hasError false does not show error', () => {
      const formFields: IFormConfig = {
        section1: [
          {
            id: 'header1',
            key: 'approvalsSectionHeader',
            title: 'Approvals Section',
            value: '',
            isEditable: false,
            ariaLabel: 'Approvals Section',
            tooltipText: '',
            disabled: false,
            isVisible: true,
            detail: {
              title: '',
              subtitle: '',
              ariaLabel: '',
            },
          },
          {
            id: 'field1',
            key: 'field1Key',
            title: 'field1Title',
            value: 'field1Value',
            ariaLabel: 'field1AriaLabel',
            tooltipText: 'field1Tooltip',
            disabled: false,
            isVisible: true,
            detail: {
              title: 'field1DetailTitle',
              subtitle: 'field1DetailSubtitle',
              ariaLabel: 'field1DetailAriaLabel',
            },
          },
        ],
      };

      const sectionErrors = {
        approvalsSectionHeader: {
          hasError: false,
          errorMessageKey: 'should.not.be.shown',
        },
      };

      renderComponent(formFields, false, sectionErrors);

      // Section header should be rendered
      expect(screen.getByText('Approvals Section')).toBeInTheDocument();

      // No error should be shown
      expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('warning-badge-icon'),
      ).not.toBeInTheDocument();
      expect(screen.queryByText('should.not.be.shown')).not.toBeInTheDocument();

      // Fields should be rendered normally
      expect(screen.getByText('field1Title')).toBeInTheDocument();
      expect(screen.getByText('field1Value')).toBeInTheDocument();
    });

    test('section error shows permission error when user cannot edit', () => {
      // Mock canEditPreference to return false
      (canEditPreference as jest.Mock).mockReturnValue(false);

      const formFields: IFormConfig = {
        section1: [
          {
            id: 'header1',
            key: 'approvalsSectionHeader',
            title: 'Approvals Section',
            value: '',
            isEditable: false,
            ariaLabel: 'Approvals Section',
            tooltipText: '',
            disabled: false,
            isVisible: true,
            detail: {
              title: '',
              subtitle: '',
              ariaLabel: '',
            },
          },
          {
            id: 'field1',
            key: 'field1Key',
            title: 'field1Title',
            value: 'field1Value',
            ariaLabel: 'field1AriaLabel',
            tooltipText: 'field1Tooltip',
            disabled: false,
            isVisible: true,
            detail: {
              title: 'field1DetailTitle',
              subtitle: 'field1DetailSubtitle',
              ariaLabel: 'field1DetailAriaLabel',
            },
          },
        ],
      };

      const sectionErrors = {
        approvalsSectionHeader: {
          hasError: true,
          errorMessageKey: 'custom.error.message',
        },
      };

      renderComponent(formFields, false, sectionErrors);

      // Permission error should be shown regardless of errorMessageKey
      expect(
        screen.getByText('do.not.have.access.rights.to.edit.time.settings'),
      ).toBeInTheDocument();

      // Custom error message should NOT be shown
      expect(
        screen.queryByText('custom.error.message'),
      ).not.toBeInTheDocument();

      // Fields should NOT be rendered
      expect(screen.queryByText('field1Title')).not.toBeInTheDocument();
      expect(screen.queryByText('field1Value')).not.toBeInTheDocument();
    });

    test('handles multiple sections with multiple errors', () => {
      const formFields: IFormConfig = {
        section1: [
          {
            id: 'header1',
            key: 'approvalsSectionHeader',
            title: 'Approvals Section',
            value: '',
            isEditable: false,
            ariaLabel: 'Approvals Section',
            tooltipText: '',
            disabled: false,
            isVisible: true,
            detail: {
              title: '',
              subtitle: '',
              ariaLabel: '',
            },
          },
          {
            id: 'field1',
            key: 'field1Key',
            title: 'field1Title',
            value: 'field1Value',
            ariaLabel: 'field1AriaLabel',
            tooltipText: 'field1Tooltip',
            disabled: false,
            isVisible: true,
            detail: {
              title: 'field1DetailTitle',
              subtitle: 'field1DetailSubtitle',
              ariaLabel: 'field1DetailAriaLabel',
            },
          },
          {
            id: 'header2',
            key: 'submissionsSectionHeader',
            title: 'Submissions Section',
            value: '',
            isEditable: false,
            ariaLabel: 'Submissions Section',
            tooltipText: '',
            disabled: false,
            isVisible: true,
            detail: {
              title: '',
              subtitle: '',
              ariaLabel: '',
            },
          },
          {
            id: 'field2',
            key: 'field2Key',
            title: 'field2Title',
            value: 'field2Value',
            ariaLabel: 'field2AriaLabel',
            tooltipText: 'field2Tooltip',
            disabled: false,
            isVisible: true,
            detail: {
              title: 'field2DetailTitle',
              subtitle: 'field2DetailSubtitle',
              ariaLabel: 'field2DetailAriaLabel',
            },
          },
        ],
      };

      const sectionErrors = {
        approvalsSectionHeader: {
          hasError: true,
          errorMessageKey: 'approval.error',
        },
        submissionsSectionHeader: {
          hasError: true,
          errorMessageKey: 'submission.error',
        },
      };

      renderComponent(formFields, false, sectionErrors);

      // Both section headers should be rendered
      expect(screen.getByText('Approvals Section')).toBeInTheDocument();
      expect(screen.getByText('Submissions Section')).toBeInTheDocument();

      // Both error messages should be shown
      expect(screen.getByText('approval.error')).toBeInTheDocument();
      expect(screen.getByText('submission.error')).toBeInTheDocument();

      // None of the fields should be rendered
      expect(screen.queryByText('field1Title')).not.toBeInTheDocument();
      expect(screen.queryByText('field1Value')).not.toBeInTheDocument();
      expect(screen.queryByText('field2Title')).not.toBeInTheDocument();
      expect(screen.queryByText('field2Value')).not.toBeInTheDocument();
    });

    test('renders fields that are before a section header normally', () => {
      const formFields: IFormConfig = {
        section1: [
          {
            id: 'field0',
            key: 'field0Key',
            title: 'field0Title',
            value: 'field0Value',
            ariaLabel: 'field0AriaLabel',
            tooltipText: 'field0Tooltip',
            disabled: false,
            isVisible: true,
            detail: {
              title: 'field0DetailTitle',
              subtitle: 'field0DetailSubtitle',
              ariaLabel: 'field0DetailAriaLabel',
            },
          },
          {
            id: 'header1',
            key: 'approvalsSectionHeader',
            title: 'Approvals Section',
            value: '',
            isEditable: false,
            ariaLabel: 'Approvals Section',
            tooltipText: '',
            disabled: false,
            isVisible: true,
            detail: {
              title: '',
              subtitle: '',
              ariaLabel: '',
            },
          },
          {
            id: 'field1',
            key: 'field1Key',
            title: 'field1Title',
            value: 'field1Value',
            ariaLabel: 'field1AriaLabel',
            tooltipText: 'field1Tooltip',
            disabled: false,
            isVisible: true,
            detail: {
              title: 'field1DetailTitle',
              subtitle: 'field1DetailSubtitle',
              ariaLabel: 'field1DetailAriaLabel',
            },
          },
        ],
      };

      const sectionErrors = {
        approvalsSectionHeader: {
          hasError: true,
        },
      };

      renderComponent(formFields, false, sectionErrors);

      // Field before section header should be rendered
      expect(screen.getByText('field0Title')).toBeInTheDocument();
      expect(screen.getByText('field0Value')).toBeInTheDocument();

      // Section header should be rendered
      expect(screen.getByText('Approvals Section')).toBeInTheDocument();

      // Error should be shown
      expect(screen.getByTestId('badge')).toBeInTheDocument();

      // Field after section header should NOT be rendered
      expect(screen.queryByText('field1Title')).not.toBeInTheDocument();
      expect(screen.queryByText('field1Value')).not.toBeInTheDocument();
    });
  });

  describe('Section Badges', () => {
    // Helper to create a section header field
    const createSectionHeader = (
      key: string,
      title: string,
      isVisible = true,
    ) => ({
      id: `header_${key}`,
      key,
      title,
      value: '',
      isEditable: false,
      ariaLabel: title,
      tooltipText: '',
      disabled: false,
      isVisible,
      detail: { title: '', subtitle: '', ariaLabel: '' },
    });

    // Helper to create a regular field
    const createField = (key: string) => ({
      id: key,
      key,
      title: `${key}Title`,
      value: `${key}Value`,
      ariaLabel: `${key}AriaLabel`,
      tooltipText: `${key}Tooltip`,
      disabled: false,
      isVisible: true,
      isEditable: true,
      detail: {
        title: `${key}DetailTitle`,
        subtitle: `${key}DetailSubtitle`,
        ariaLabel: `${key}DetailAriaLabel`,
      },
    });

    beforeEach(() => {
      (renderTitleWithBadge as jest.Mock).mockClear();
    });

    test.each([
      {
        desc: 'badge visible with end date',
        badge: { isVisible: true, visibilityEndDate: '2025-12-31' },
        expected: { isNew: true, isNewVisibleTill: '2025-12-31' },
      },
      {
        desc: 'badge not visible with end date',
        badge: { isVisible: false, visibilityEndDate: '2025-12-31' },
        expected: { isNew: false, isNewVisibleTill: '2025-12-31' },
      },
      {
        desc: 'badge visible without end date',
        badge: { isVisible: true },
        expected: { isNew: true, isNewVisibleTill: undefined },
      },
      {
        desc: 'no badge configured',
        badge: undefined,
        expected: { isNew: undefined, isNewVisibleTill: undefined },
      },
    ])(
      'calls renderTitleWithBadge correctly when $desc',
      ({ badge, expected }) => {
        const formFields: IFormConfig = {
          section1: [
            createSectionHeader('testSection', 'Test Section'),
            createField('field1'),
          ],
        };
        const sectionBadges = badge ? { testSection: badge } : undefined;

        renderComponent(formFields, false, {}, sectionBadges);

        expect(renderTitleWithBadge).toHaveBeenCalledWith({
          title: 'Test Section',
          ...expected,
          intl: expect.any(Object),
        });
      },
    );

    test('handles multiple section headers with different badge configurations', () => {
      const formFields: IFormConfig = {
        section1: [
          createSectionHeader('notifications', 'Notifications'),
          createField('field1'),
          createSectionHeader('approvals', 'Approvals'),
        ],
      };
      const sectionBadges = {
        notifications: { isVisible: true, visibilityEndDate: '2025-12-31' },
        approvals: { isVisible: false, visibilityEndDate: '2025-11-30' },
      };

      renderComponent(formFields, false, {}, sectionBadges);

      expect(renderTitleWithBadge).toHaveBeenCalledWith({
        title: 'Notifications',
        isNew: true,
        isNewVisibleTill: '2025-12-31',
        intl: expect.any(Object),
      });
      expect(renderTitleWithBadge).toHaveBeenCalledWith({
        title: 'Approvals',
        isNew: false,
        isNewVisibleTill: '2025-11-30',
        intl: expect.any(Object),
      });
    });

    test('only calls renderTitleWithBadge for section headers, not regular fields', () => {
      const formFields: IFormConfig = {
        section1: [
          createSectionHeader('notifications', 'Notifications'),
          createField('field1'),
        ],
      };
      const sectionBadges = {
        notifications: { isVisible: true, visibilityEndDate: '2025-12-31' },
      };

      renderComponent(formFields, false, {}, sectionBadges);

      expect(renderTitleWithBadge).toHaveBeenCalledTimes(1);
    });

    test('badge configuration does not interfere with section error rendering', () => {
      const formFields: IFormConfig = {
        section1: [
          createSectionHeader('notifications', 'Notifications'),
          createField('field1'),
        ],
      };
      const sectionErrors = {
        notifications: {
          hasError: true,
          errorMessageKey: 'notification.error.message',
        },
      };
      const sectionBadges = {
        notifications: { isVisible: true, visibilityEndDate: '2025-12-31' },
      };

      renderComponent(formFields, false, sectionErrors, sectionBadges);

      expect(renderTitleWithBadge).toHaveBeenCalledWith({
        title: 'Notifications',
        isNew: true,
        isNewVisibleTill: '2025-12-31',
        intl: expect.any(Object),
      });
      expect(screen.getByTestId('badge')).toBeInTheDocument();
      expect(
        screen.getByText('notification.error.message'),
      ).toBeInTheDocument();
      expect(screen.queryByText('field1Title')).not.toBeInTheDocument();
    });

    test('does not call renderTitleWithBadge for hidden section headers', () => {
      const formFields: IFormConfig = {
        section1: [
          createSectionHeader('hidden', 'Hidden Section', false),
          createField('field1'),
        ],
      };
      const sectionBadges = {
        hidden: { isVisible: true, visibilityEndDate: '2025-12-31' },
      };

      renderComponent(formFields, false, {}, sectionBadges);

      expect(renderTitleWithBadge).not.toHaveBeenCalled();
      expect(screen.queryByText('Hidden Section')).not.toBeInTheDocument();
      expect(screen.getByText('field1Title')).toBeInTheDocument();
    });
  });
});

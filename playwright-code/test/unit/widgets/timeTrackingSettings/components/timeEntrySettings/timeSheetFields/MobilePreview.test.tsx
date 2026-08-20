import React, { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { FormProvider, useForm } from 'react-hook-form';
import { MobilePreview } from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/timeSheetFields/MobilePreview';
import { ITimeSheetFieldOption } from 'src/js/widgets/timeTrackingSettings/types';

// Mock the mobile background image
jest.mock('src/js/widgets/images/mobile-bg.svg', () => 'mock-mobile-bg.svg');

// Mock the useIntl hook
jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => id,
  }),
}));

jest.mock('src/js/common/useDimensionVisibility', () => ({
  useDimensionVisibility: jest.fn(() => ({
    isVisible: false,
    loading: false,
  })),
}));

// `MobilePreview` reads dimension toggle state via `useWatch` from
// react-hook-form, so every render must live under a `FormProvider`.
const FormWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
  const methods = useForm({ defaultValues: { dimensions: {} } });
  return <FormProvider {...methods}>{children}</FormProvider>;
};

describe('MobilePreview Component', () => {
  const mockEditTimeSheetFields: ITimeSheetFieldOption[] = [
    {
      id: 'customers',
      key: 'customersForTimeSheetEnabled',
      title: 'Customers',
      ariaLabel: 'Customers field',
      tooltipText: 'Enable customers field',
      disabled: false,
      value: false,
      detail: {
        title: 'customers.title',
        subtitle: 'customers.subtitle',
        ariaLabel: 'Customers field details',
      },
    },
    {
      id: 'notes',
      key: 'timeSheetEntryNotesEnabled',
      title: 'Notes',
      ariaLabel: 'Notes field',
      tooltipText: 'Enable notes field',
      disabled: false,
      value: false,
      detail: {
        title: 'notes.title',
        subtitle: 'notes.subtitle',
        ariaLabel: 'Notes field details',
      },
    },
  ];

  const mockSelectedCustomTimeSheetFields = [
    'customersForTimeSheetEnabled',
    'timeSheetEntryNotesEnabled',
  ];

  test('renders mobile preview container with title and subtitle', () => {
    render(
      <FormWrapper>
        <MobilePreview
          editTimeSheetFields={mockEditTimeSheetFields}
          selectedCustomTimeSheetFields={mockSelectedCustomTimeSheetFields}
        />
      </FormWrapper>,
    );

    expect(screen.getByTestId('field-setting-preview')).toBeInTheDocument();
    expect(
      screen.getByText(
        'time-entries.section.title.time-sheet.mobile-preview.title',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'time-entries.section.title.time-sheet.mobile-preview.sub-title',
      ),
    ).toBeInTheDocument();
  });

  test('renders customer field preview when selected', () => {
    render(
      <FormWrapper>
        <MobilePreview
          editTimeSheetFields={mockEditTimeSheetFields}
          selectedCustomTimeSheetFields={mockSelectedCustomTimeSheetFields}
        />
      </FormWrapper>,
    );

    const customerPreview = screen.getByTestId('customers-preview');
    expect(customerPreview).toBeInTheDocument();
    // Since field.title ('Customers') !== defaultTitle ('customers.title'),
    // the component displays field.title
    expect(screen.getByText('Customers')).toBeInTheDocument();
    expect(
      screen.getByText(
        'time-entries.section.title.time-sheet.mobile-preview.item.other.subtitle',
      ),
    ).toBeInTheDocument();
  });

  test('renders notes field preview when selected', () => {
    render(
      <FormWrapper>
        <MobilePreview
          editTimeSheetFields={mockEditTimeSheetFields}
          selectedCustomTimeSheetFields={mockSelectedCustomTimeSheetFields}
        />
      </FormWrapper>,
    );

    const notesPreview = screen.getByTestId('notes-preview');
    expect(notesPreview).toBeInTheDocument();
    expect(screen.getByText('notes.title')).toBeInTheDocument();
    expect(screen.getByText('notes.subtitle')).toBeInTheDocument();
  });

  test('does not render unselected fields', () => {
    const unselectedFields = ['customersForTimeSheetEnabled'];

    render(
      <FormWrapper>
        <MobilePreview
          editTimeSheetFields={mockEditTimeSheetFields}
          selectedCustomTimeSheetFields={unselectedFields}
        />
      </FormWrapper>,
    );

    expect(screen.getByTestId('customers-preview')).toBeInTheDocument();
    expect(screen.queryByTestId('notes-preview')).not.toBeInTheDocument();
  });

  test('renders grey footer background when notes field is not selected', () => {
    const fieldsWithoutNotes = [
      {
        id: 'customers',
        key: 'customersForTimeSheetEnabled',
        title: 'Customers',
        ariaLabel: 'Customers field',
        tooltipText: 'Enable customers field',
        disabled: false,
        value: false,
        detail: {
          title: 'customers.title',
          subtitle: 'customers.subtitle',
          ariaLabel: 'Customers field details',
        },
      },
    ];

    render(
      <FormWrapper>
        <MobilePreview
          editTimeSheetFields={fieldsWithoutNotes}
          selectedCustomTimeSheetFields={['customersForTimeSheetEnabled']}
        />
      </FormWrapper>,
    );

    expect(screen.queryByTestId('notes-preview')).not.toBeInTheDocument();
  });

  test('handles empty editTimeSheetFields array', () => {
    render(
      <FormWrapper>
        <MobilePreview
          editTimeSheetFields={[]}
          selectedCustomTimeSheetFields={mockSelectedCustomTimeSheetFields}
        />
      </FormWrapper>,
    );

    expect(screen.queryByTestId('customers-preview')).not.toBeInTheDocument();
    expect(screen.queryByTestId('notes-preview')).not.toBeInTheDocument();
  });

  test('handles null editTimeSheetFields', () => {
    render(
      <FormWrapper>
        <MobilePreview
          editTimeSheetFields={null as any}
          selectedCustomTimeSheetFields={mockSelectedCustomTimeSheetFields}
        />
      </FormWrapper>,
    );

    expect(screen.queryByTestId('customers-preview')).not.toBeInTheDocument();
    expect(screen.queryByTestId('notes-preview')).not.toBeInTheDocument();
  });

  test('renders multiple selected fields in correct order', () => {
    const multipleFields: ITimeSheetFieldOption[] = [
      {
        id: 'customers',
        key: 'customersForTimeSheetEnabled',
        title: 'Customers',
        ariaLabel: 'Customers field',
        tooltipText: 'Enable customers field',
        disabled: false,
        value: false,
        detail: {
          title: 'customers.title',
          subtitle: 'customers.subtitle',
          ariaLabel: 'Customers field details',
        },
      },
      {
        id: 'billing',
        key: 'isBillingFieldEnabled',
        title: 'Billing',
        ariaLabel: 'Billing field',
        tooltipText: 'Enable billing field',
        disabled: false,
        value: false,
        detail: {
          title: 'billing.title',
          subtitle: 'billing.subtitle',
          ariaLabel: 'Billing field details',
        },
      },
      {
        id: 'notes',
        key: 'timeSheetEntryNotesEnabled',
        title: 'Notes',
        ariaLabel: 'Notes field',
        tooltipText: 'Enable notes field',
        disabled: false,
        value: false,
        detail: {
          title: 'notes.title',
          subtitle: 'notes.subtitle',
          ariaLabel: 'Notes field details',
        },
      },
    ];

    const selectedFields = [
      'customersForTimeSheetEnabled',
      'isBillingFieldEnabled',
      'timeSheetEntryNotesEnabled',
    ];

    render(
      <FormWrapper>
        <MobilePreview
          editTimeSheetFields={multipleFields}
          selectedCustomTimeSheetFields={selectedFields}
        />
      </FormWrapper>,
    );

    expect(screen.getByTestId('customers-preview')).toBeInTheDocument();
    expect(screen.getByTestId('billing-preview')).toBeInTheDocument();
    expect(screen.getByTestId('notes-preview')).toBeInTheDocument();
  });

  test('renders location field with custom title when field title differs from default location message', () => {
    const locationField: ITimeSheetFieldOption[] = [
      {
        id: 'location',
        key: 'locationForTimeSheetEnabled',
        title: 'Custom Location Title',
        ariaLabel: 'Location field',
        tooltipText: 'Enable location field',
        disabled: false,
        value: false,
        detail: {
          title: 'location.detail.title',
          subtitle: 'location.detail.subtitle',
          ariaLabel: 'Location field details',
        },
      },
    ];

    const selectedFields = ['locationForTimeSheetEnabled'];

    render(
      <FormWrapper>
        <MobilePreview
          editTimeSheetFields={locationField}
          selectedCustomTimeSheetFields={selectedFields}
        />
      </FormWrapper>,
    );

    const locationPreview = screen.getByTestId('location-preview');
    expect(locationPreview).toBeInTheDocument();
    expect(screen.getByText('Custom Location Title')).toBeInTheDocument();
    expect(
      screen.getByText(
        'time-entries.section.title.time-sheet.mobile-preview.item.other.subtitle',
      ),
    ).toBeInTheDocument();
  });

  test('renders location field with default detail when field title matches default location message', () => {
    const locationField: ITimeSheetFieldOption[] = [
      {
        id: 'location',
        key: 'locationForTimeSheetEnabled',
        // Make the title match the formatted detail.title to trigger default behavior
        title: 'location.detail.title',
        ariaLabel: 'Location field',
        tooltipText: 'Enable location field',
        disabled: false,
        value: false,
        detail: {
          title: 'location.detail.title',
          subtitle: 'location.detail.subtitle',
          ariaLabel: 'Location field details',
        },
      },
    ];

    const selectedFields = ['locationForTimeSheetEnabled'];

    render(
      <FormWrapper>
        <MobilePreview
          editTimeSheetFields={locationField}
          selectedCustomTimeSheetFields={selectedFields}
        />
      </FormWrapper>,
    );

    const locationPreview = screen.getByTestId('location-preview');
    expect(locationPreview).toBeInTheDocument();
    // When field.title matches defaultTitle, component displays defaultTitle
    expect(screen.getByText('location.detail.title')).toBeInTheDocument();
    expect(screen.getByText('location.detail.subtitle')).toBeInTheDocument();
  });

  describe('Close Button', () => {
    test('renders close button when onClose is provided', () => {
      render(
        <FormWrapper>
          <MobilePreview
            editTimeSheetFields={mockEditTimeSheetFields}
            selectedCustomTimeSheetFields={mockSelectedCustomTimeSheetFields}
            onClose={jest.fn()}
          />
        </FormWrapper>,
      );

      // Button is in DOM but visibility is controlled by CSS media query
      const closeButton = screen.getByTestId('mobile-preview-close-button');
      expect(closeButton).toBeInTheDocument();
    });

    test('does not render close button when onClose is not provided', () => {
      render(
        <FormWrapper>
          <MobilePreview
            editTimeSheetFields={mockEditTimeSheetFields}
            selectedCustomTimeSheetFields={mockSelectedCustomTimeSheetFields}
          />
        </FormWrapper>,
      );

      expect(
        screen.queryByTestId('mobile-preview-close-button'),
      ).not.toBeInTheDocument();
    });

    test('calls onClose when close button is clicked', () => {
      const mockOnClose = jest.fn();

      render(
        <FormWrapper>
          <MobilePreview
            editTimeSheetFields={mockEditTimeSheetFields}
            selectedCustomTimeSheetFields={mockSelectedCustomTimeSheetFields}
            onClose={mockOnClose}
          />
        </FormWrapper>,
      );

      const closeButton = screen.getByTestId('mobile-preview-close-button');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('close button has correct aria-label', () => {
      render(
        <FormWrapper>
          <MobilePreview
            editTimeSheetFields={mockEditTimeSheetFields}
            selectedCustomTimeSheetFields={mockSelectedCustomTimeSheetFields}
            onClose={jest.fn()}
          />
        </FormWrapper>,
      );

      const closeButton = screen.getByTestId('mobile-preview-close-button');
      expect(closeButton).toHaveAttribute('aria-label', 'trowser.cancel');
    });
  });
});

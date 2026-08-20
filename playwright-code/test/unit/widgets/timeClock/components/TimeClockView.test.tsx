import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { MockQuicksandProvider } from '@payroll/quicksand';
import {
  FormProvider,
  UseFormReturn,
  Control,
  FieldValues,
} from 'react-hook-form';
import { getDefaultSandbox } from 'test/unit/testUtils';
import TimeClockView from 'src/js/widgets/timeClock/components/TimeClockView';

const defaultSandbox = getDefaultSandbox();
const mockSandbox = {
  ...defaultSandbox,
  appContext: {
    ...defaultSandbox.appContext,
    getUserAuthInfo: () => ({
      authId: 'test-auth-id',
      agentId: 'test-agent-id',
      authenticationLevel: 'FULL',
    }),
    getRealm: () => Promise.resolve({ realmId: 'test-realm-id' }),
  },
  pubsub: {
    ...defaultSandbox.pubsub,
    subscribe: jest.fn().mockReturnValue('test-subscription-id'),
    unsubscribe: jest.fn(),
  },
};

const mockControl = {
  _subjects: {},
  _removeUnmounted: jest.fn(),
  _names: {},
  _state: {},
  _formState: {},
  _formValues: {},
  _defaultValues: {},
  _formStateRef: {},
  _formStateIsDirty: false,
  _formStateIsSubmitting: false,
  _formStateIsSubmitted: false,
  _formStateIsSubmitSuccessful: false,
  _formStateSubmitCount: 0,
  _formStateDirtyFields: {},
  _formStateTouchedFields: {},
  _formStateErrors: {},
  _formStateIsValidating: false,
  _formStateIsValid: true,
  _formStateDisabled: false,
  _formStateValidatingFields: {},
  _formStateIsLoading: false,
} as unknown as Control<FieldValues>;

const mockFormContext: Partial<UseFormReturn> = {
  control: mockControl,
  formState: {
    isDirty: false,
    isLoading: false,
    isSubmitted: false,
    isSubmitSuccessful: false,
    isSubmitting: false,
    submitCount: 0,
    dirtyFields: {},
    touchedFields: {},
    errors: {},
    isValidating: false,
    isValid: true,
    disabled: false,
    validatingFields: {},
  },
  getValues: jest.fn(),
  setValue: jest.fn(),
  watch: jest.fn(),
  register: jest.fn(),
  handleSubmit: jest.fn(),
  reset: jest.fn(),
  trigger: jest.fn(),
  getFieldState: jest.fn(),
  setError: jest.fn(),
  clearErrors: jest.fn(),
  resetField: jest.fn(),
  unregister: jest.fn(),
};

describe('TimeClockView', () => {
  const defaultProps = {
    open: true,
    setOpen: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders drawer when open', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <MockQuicksandProvider sandbox={mockSandbox}>
          <FormProvider {...(mockFormContext as UseFormReturn)}>
            <TimeClockView {...defaultProps} />
          </FormProvider>
        </MockQuicksandProvider>
      </MockedProvider>,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not render drawer when closed', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <MockQuicksandProvider sandbox={mockSandbox}>
          <FormProvider {...(mockFormContext as UseFormReturn)}>
            <TimeClockView {...defaultProps} open={false} />
          </FormProvider>
        </MockQuicksandProvider>
      </MockedProvider>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls setOpen when drawer is closed', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <MockQuicksandProvider sandbox={mockSandbox}>
          <FormProvider {...(mockFormContext as UseFormReturn)}>
            <TimeClockView {...defaultProps} />
          </FormProvider>
        </MockQuicksandProvider>
      </MockedProvider>,
    );

    // Close drawer by clicking backdrop
    const backdrop = screen.getByTestId('drawer_backdrop');
    backdrop.click();

    expect(defaultProps.setOpen).toHaveBeenCalledWith(false);
  });
});

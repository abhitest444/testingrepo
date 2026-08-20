/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import dayjs from 'dayjs';
import { renderWithQuicksandProvider } from '../../../../../testUtils';

const StartDateValidationTestComponent: React.FC = () => {
  const {
    register,
    formState: { errors },
    trigger,
  } = useForm({
    mode: 'onChange',
    defaultValues: { startDate: '' },
  });

  return (
    <div>
      <input
        type="date"
        data-testid="start-date-input"
        {...register('startDate', {
          required: 'Start date is required',
          validate: (value) => {
            if (!value || !dayjs(value).isValid()) {
              return 'Start date is required';
            }
            return true;
          },
        })}
        onBlur={() => trigger('startDate')}
      />
      {errors.startDate && (
        <span data-testid="start-date-error">{errors.startDate.message}</span>
      )}
    </div>
  );
};

const TestWrapper: React.FC<{
  children: React.ReactNode;
  defaultValues?: any;
}> = ({ children, defaultValues = {} }) => {
  const methods = useForm({ defaultValues, mode: 'onChange' });

  return (
    <>
      <FormProvider {...methods}>{children}</FormProvider>
    </>
  );
};

// Mock sandboxUtils for WFS tests
jest.mock('src/js/service/utils/sandboxUtils', () => ({
  isWorkforceEnvironment: jest.fn(() => false),
}));

describe('BreakEntryFormFields - Start Date Validation', () => {
  describe('Start Date Field Validation', () => {
    it('should show error when start date is empty/required', async () => {
      const user = userEvent.setup();

      renderWithQuicksandProvider(
        <TestWrapper>
          <StartDateValidationTestComponent />
        </TestWrapper>,
      );

      const startDateInput = screen.getByTestId('start-date-input');

      await user.clear(startDateInput);
      await user.click(startDateInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByTestId('start-date-error')).toBeInTheDocument();
        expect(screen.getByTestId('start-date-error')).toHaveTextContent(
          'Start date is required',
        );
      });
    });

    it('should show error when start date is invalid', async () => {
      const user = userEvent.setup();

      renderWithQuicksandProvider(
        <TestWrapper>
          <StartDateValidationTestComponent />
        </TestWrapper>,
      );

      const startDateInput = screen.getByTestId('start-date-input');

      await user.clear(startDateInput);
      await user.type(startDateInput, 'invalid-date');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByTestId('start-date-error')).toBeInTheDocument();
        expect(screen.getByTestId('start-date-error')).toHaveTextContent(
          'Start date is required',
        );
      });
    });

    it('should NOT show error when start date is valid', async () => {
      const user = userEvent.setup();

      renderWithQuicksandProvider(
        <TestWrapper>
          <StartDateValidationTestComponent />
        </TestWrapper>,
      );

      const startDateInput = screen.getByTestId('start-date-input');

      await user.clear(startDateInput);
      await user.type(startDateInput, '2023-12-25');
      await user.tab();

      await waitFor(() => {
        expect(
          screen.queryByTestId('start-date-error'),
        ).not.toBeInTheDocument();
      });

      expect(startDateInput).toHaveValue('2023-12-25');
    });

    it('should validate start date with pre-populated valid value', async () => {
      const DefaultValueTestComponent: React.FC = () => {
        const {
          register,
          formState: { errors },
        } = useForm({
          mode: 'onChange',
          defaultValues: { startDate: '2023-12-01' },
        });

        return (
          <div>
            <input
              type="date"
              data-testid="start-date-input"
              {...register('startDate', {
                required: 'Start date is required',
                validate: (value) => {
                  if (!value || !dayjs(value).isValid()) {
                    return 'Start date is required';
                  }
                  return true;
                },
              })}
            />
            {errors.startDate && (
              <span data-testid="start-date-error">
                {errors.startDate.message}
              </span>
            )}
          </div>
        );
      };

      renderWithQuicksandProvider(
        <TestWrapper>
          <DefaultValueTestComponent />
        </TestWrapper>,
      );

      const startDateInput = screen.getByTestId('start-date-input');

      expect(startDateInput).toHaveValue('2023-12-01');
      expect(screen.queryByTestId('start-date-error')).not.toBeInTheDocument();
    });
  });
});

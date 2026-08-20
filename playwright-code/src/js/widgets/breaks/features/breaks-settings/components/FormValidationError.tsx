import React from 'react';
import Badge, { ErrorBadgeIcon } from '@ids-ts/badge';
import { ValidationErrorContainer } from '../styles/FormValidationError.styled';

interface FormValidationErrorProps {
  /** The error message to display */
  message: string;
  /** Optional test ID for testing */
  testId?: string;
}

export const FormValidationError: React.FC<FormValidationErrorProps> = ({
  message,
  testId = 'form-validation-error',
}) => {
  if (!message) {
    return null;
  }

  return (
    <ValidationErrorContainer data-testid={testId}>
      <Badge status="error" label={message} aria-label="error" shape="round">
        <ErrorBadgeIcon />
      </Badge>
    </ValidationErrorContainer>
  );
};

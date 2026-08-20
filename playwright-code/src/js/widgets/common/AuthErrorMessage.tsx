import React from 'react';
import styled from 'styled-components';
import { useIntl } from '@payroll/quicksand';
import { ReactComponent as ErrorTech } from 'src/js/widgets/images/illo-life-error-tech.svg';

const StyledErrorMessage = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const ErrorHeader = styled.div`
  font-weight: var(--font-weight-heading);
  font-size: var(--font-size-heading-6);
  line-height: 31.04px;
  letter-spacing: 0%;
  padding: 40px 0 15px;
`;

const ErrorContent = styled.div`
  font-weight: var(--font-weight-body);
  font-size: var(--font-size-body-3);
  line-height: 20px;
  letter-spacing: 0%;
`;

export interface AuthErrorMessageProps {
  className?: string;
}

export const AuthErrorMessage = ({ className }: AuthErrorMessageProps) => {
  const intl = useIntl();
  return (
    <StyledErrorMessage className={className}>
      <ErrorTech />
      <ErrorHeader>
        {intl.formatMessage({
          id: 'auth.error.header',
        })}
      </ErrorHeader>
      <ErrorContent>
        {intl.formatMessage({
          id: 'auth.error.content',
        })}
      </ErrorContent>
      <ErrorContent>
        {intl.formatMessage({
          id: 'auth.error.try.again',
        })}
      </ErrorContent>
    </StyledErrorMessage>
  );
};

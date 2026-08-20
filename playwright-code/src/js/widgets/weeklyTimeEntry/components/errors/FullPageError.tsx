import React from 'react';
import styled from 'styled-components';
import { useIntl } from '@payroll/quicksand';
import { CircleAlertQuickbooks } from '@design-systems/icons';
import { B2, H4 } from '@ids-ts/typography';

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  -webkit-box-align: center;
  align-items: center;
  -webkit-box-pack: center;
  justify-content: center;
  height: 80vh;
  width: 100vw;
  text-align: center;
`;

interface FullPageErrorProps {
  title?: string;
  message?: string;
}

export const FullPageError: React.FC<FullPageErrorProps> = ({
  title,
  message,
}) => {
  const intl = useIntl();

  const defaultTitle = intl.formatMessage({
    id: 'weekly.time.entry.error.boundary.title',
  });
  const defaultMessage = intl.formatMessage({
    id: 'weekly.time.entry.refresh.page',
  });

  return (
    <ErrorContainer>
      <CircleAlertQuickbooks />
      <H4>{title || defaultTitle}</H4>
      <B2>{message || defaultMessage}</B2>
    </ErrorContainer>
  );
};

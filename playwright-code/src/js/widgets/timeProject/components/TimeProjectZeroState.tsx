import React from 'react';
import styled from 'styled-components';
import { H5, B2 } from '@ids-ts/typography';
import { useIntl } from '@payroll/quicksand';

const ZeroStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
  padding: 48px 24px;
  gap: 15px;
`;

const TimeProjectZeroState: React.FC = () => {
  const intl = useIntl();
  const text = (id: string) => intl.formatMessage({ id });

  return (
    <ZeroStateContainer data-testid="time-project-zero-state">
      <H5 weight="demi">{text('timeProject.zeroState.title')}</H5>
      <B2>{text('timeProject.zeroState.description')}</B2>
    </ZeroStateContainer>
  );
};

export default TimeProjectZeroState;

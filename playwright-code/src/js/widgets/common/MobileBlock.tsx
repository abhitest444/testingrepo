import Button from '@ids-ts/button';
import React from 'react';
import { useIntl } from '@payroll/quicksand';
import styled from 'styled-components';

const MobileBlockContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
`;

const Header = styled.div`
  color: var(--Primitives-Gray-gray-100, #393a3d);
  font-size: 26px;
  font-style: normal;
  font-weight: var(--font-weight-component-semibold);
  line-height: 27px;
  align-items: center;
  text-align: center; /* Center the text */
`;

const Content = styled.div`
  color: var(--Primitives-Gray-gray-100, #393a3d);
  font-size: var(--font-size-component-medium);
  font-style: normal;
  line-height: 20px; /* 125% */ /* (NoTokenFound) */
  text-align: center; /* Center the text */
`;

export interface MobileBlockProps {
  onClose: () => void;
}

export const MobileBlock = ({ onClose }: MobileBlockProps) => {
  const intl = useIntl();
  return (
    <MobileBlockContainer>
      <Header>
        {intl.formatMessage({
          id: 'screen.to.small.title',
        })}
      </Header>
      <Content>
        {intl.formatMessage({
          id: 'screen.to.small.content',
        })}
      </Content>
      <Button disabled={false} onClick={onClose}>
        {intl.formatMessage({ id: 'got.it.message' })}
      </Button>
    </MobileBlockContainer>
  );
};

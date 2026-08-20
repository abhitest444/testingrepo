import React from 'react';
import styled from 'styled-components';
import { useIntl } from '@payroll/quicksand';
import { CircleAlertQuickbooks } from '@design-systems/icons';
import { Drawer, DrawerContent, DrawerHeader } from '@ids-ts/drawer';

const StyledDrawerHeader = styled(DrawerHeader)`
  box-shadow: #00000040 0px 2px 2px;
  padding: 0 10px;
  font-weight: var(--font-weight-component-semibold);
`;

const StyledDrawerContent = styled(DrawerContent)`
  text-align: center;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  text-align: center;
  gap: 16px;
  min-height: 200px;
`;

const ErrorTitle = styled.h2`
  font-size: var(--font-size-heading-3);
  font-weight: var(--font-weight-heading);
  line-height: 44px;
  color: var(--color-text-primary);
  margin: 0;
`;

const ErrorMessage = styled.p`
  font-size: var(--font-size-body-2);
  color: var(--color-text-secondary);
  margin: 0;
`;

interface TimeClockErrorProps {
  isOpen?: boolean;
  onClose?: () => void;
  titleId?: string;
  messageId?: string;
}

export const TimeClockError = ({
  isOpen = true,
  onClose = () => {},
  titleId = 'timeclock.error.generic.error.header',
  messageId = 'timeclock.error.generic.error.details',
}: TimeClockErrorProps) => {
  const intl = useIntl();

  return (
    <Drawer backdrop open={isOpen} size="medium" onClose={onClose}>
      <StyledDrawerHeader
        title={intl.formatMessage({
          id: 'timeclock.header',
        })}
        onClose={onClose}
      />
      <StyledDrawerContent>
        <ErrorContainer>
          <CircleAlertQuickbooks style={{ width: '60px', height: '60px' }} />
          <ErrorTitle>{intl.formatMessage({ id: titleId })}</ErrorTitle>
          <ErrorMessage>{intl.formatMessage({ id: messageId })}</ErrorMessage>
        </ErrorContainer>
      </StyledDrawerContent>
    </Drawer>
  );
};

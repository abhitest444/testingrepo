import React from 'react';
import { useSandbox, useIntl } from '@payroll/quicksand';
import {
  Wrapper,
  Title,
  Description,
  LinkWrapper,
  StyledButton,
} from './TTOUnauthorizedAccess.styled';

const TTOUnauthorizedAccess: React.FC = () => {
  const sandbox = useSandbox();
  const intl = useIntl();

  const handleBackToHomepage = () => {
    if (sandbox?.navigation) {
      // Navigate to main QuickBooks homepage (not TTO homepage)
      sandbox.navigation.navigate('homepage');
    }
  };

  return (
    <Wrapper data-testid="tto-unauthorized-access">
      <Title data-testid="tto-unauthorized-title">
        {intl.formatMessage({ id: 'unauthorized.access.title' })}
      </Title>
      <Description data-testid="tto-unauthorized-description-line1">
        {intl.formatMessage({ id: 'unauthorized.access.login.message' })}
      </Description>
      <Description data-testid="tto-unauthorized-description-line2">
        {intl.formatMessage({ id: 'unauthorized.access.purpose.message' })}
      </Description>
      <LinkWrapper>
        <StyledButton
          priority="tertiary"
          onClick={handleBackToHomepage}
          data-testid="tto-unauthorized-back-link"
        >
          {intl.formatMessage({ id: 'unauthorized.access.back.to.homepage' })}
        </StyledButton>
      </LinkWrapper>
    </Wrapper>
  );
};

export default TTOUnauthorizedAccess;

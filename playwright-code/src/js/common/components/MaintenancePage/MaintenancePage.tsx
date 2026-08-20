import React from 'react';
import { useIntl } from '@payroll/quicksand';
import styled from 'styled-components';

import MaintenanceIllustration from './assets/illo-life-error-tech.png';

const FullPageContainer = styled.div`
  width: 100%;
  min-height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--color-background-primary, #ffffff);
  box-sizing: border-box;
`;

const Illustration = styled.img`
  width: 220px;
  max-width: 80%;
  height: auto;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-family: var(--font-name-heading);
  font-size: var(--font-size-heading-4, 22px);
  font-weight: var(--font-weight-heading, 500);
  line-height: 1.3;
  color: var(--color-text-primary, #393a3d);
  margin: 0 0 16px;
  text-align: center;
`;

const Body = styled.p`
  font-size: var(--font-size-body-2, 14px);
  line-height: 1.5;
  color: var(--color-text-primary, #393a3d);
  max-width: 720px;
  text-align: center;
  margin: 0 0 12px;
`;

const Thanks = styled.p`
  font-size: var(--font-size-body-2, 14px);
  line-height: 1.5;
  color: var(--color-text-primary, #393a3d);
  text-align: center;
  margin: 0;
`;

function MaintenancePage() {
  const intl = useIntl();

  return (
    <FullPageContainer
      role="alert"
      aria-live="polite"
      data-automation-id="maintenance-full-page"
    >
      <Illustration src={MaintenanceIllustration} alt="" aria-hidden />
      <Title>
        {intl.formatMessage({
          id: 'maintenance_full_page_title',
          defaultMessage: "We're updating your time service.",
        })}
      </Title>
      <Body>
        {intl.formatMessage({
          id: 'maintenance_full_page_body',
          defaultMessage:
            "We're making some improvements and making sure your time data is up-to-date. We'll have things back up and running as soon as possible.",
        })}
      </Body>
      <Thanks>
        {intl.formatMessage({
          id: 'maintenance_full_page_thanks',
          defaultMessage: 'Thanks for your patience.',
        })}
      </Thanks>
    </FullPageContainer>
  );
}

export default MaintenancePage;

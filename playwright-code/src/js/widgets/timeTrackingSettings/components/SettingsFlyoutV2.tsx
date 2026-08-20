import React, { useEffect } from 'react';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import Button from '@ids-ts/button';
import { Card } from '@ids-ts/cards';
import { Demi, B2 } from '@ids-ts/typography';
import styled from 'styled-components';
import { SETTINGS_FLYOUT_V2_TRACKING_POINTS } from 'src/js/common/useClickTracking';

const UPGRADE_ROUTE = 'learn-more/time-payroll';

const CardContainer = styled(Card)`
  padding: 16px 24px !important;
  width: 100% !important;
  max-width: 100% !important;
  height: auto !important;
  min-height: auto !important;
  box-sizing: border-box;
  cursor: default;
`;

const CardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const DescriptionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const DescriptionText = styled(B2)`
  font-size: var(--font-size-component-small) !important;
`;

export const SettingsFlyoutV2: React.FC = () => {
  const intl = useIntl();
  const sandbox = useSandbox();
  const track = useTracking();

  useEffect(() => {
    track(SETTINGS_FLYOUT_V2_TRACKING_POINTS.CONTENT_VIEWED);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpgradeClick = () => {
    track(SETTINGS_FLYOUT_V2_TRACKING_POINTS.UPGRADE_CLICKED);
    sandbox.navigation.navigate(UPGRADE_ROUTE);
  };

  return (
    <CardContainer>
      <CardContent>
        <Demi>
          {intl.formatMessage({ id: 'settings.flyout.v2.time.title' })}
        </Demi>
        <DescriptionRow>
          <DescriptionText>
            {intl.formatMessage({ id: 'settings.flyout.v2.time.description' })}
          </DescriptionText>
          <Button priority="primary" onClick={handleUpgradeClick}>
            {intl.formatMessage({ id: 'settings.flyout.v2.upgrade.button' })}
          </Button>
        </DescriptionRow>
      </CardContent>
    </CardContainer>
  );
};

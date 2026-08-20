import React from 'react';
import { useIntl } from '@payroll/quicksand';
import Typography from '@ids-ts/typography';
import { Card } from '@ids-ts/cards';

import {
  PolicyCardWrapper,
  TitleSection,
  StyledCardContent,
} from './styles/PolicySetupWizard.styled';
import { OvertimeRulesStepProps } from './types';
import OvertimeRulesConfig from './OvertimeRulesConfig';

const OvertimeRulesStep: React.FC<OvertimeRulesStepProps> = (props) => {
  const intl = useIntl();
  return (
    <PolicyCardWrapper>
      <Card size="none">
        <StyledCardContent>
          <TitleSection>
            <Typography variant="headline-5" weight="medium">
              {intl.formatMessage({
                id: 'overtime.wizard.rules.title',
                defaultMessage: 'Add overtime rules',
              })}
            </Typography>
            <Typography variant="body-2" weight="regular">
              {intl.formatMessage({
                id: 'overtime.wizard.rules.description',
                defaultMessage:
                  'Create and manage overtime rates, pay rates and payroll calculations.',
              })}
            </Typography>
          </TitleSection>
          <OvertimeRulesConfig {...props} />
        </StyledCardContent>
      </Card>
    </PolicyCardWrapper>
  );
};

export default OvertimeRulesStep;

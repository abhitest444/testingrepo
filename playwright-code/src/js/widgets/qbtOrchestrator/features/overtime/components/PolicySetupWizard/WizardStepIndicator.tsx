import React from 'react';
import Typography from '@ids-ts/typography';
import { Checkmark } from '@design-systems/icons';

import {
  WizardMenu,
  WizardMenuTitle,
  WizardStepItem,
  StepIndicator,
  StepLabel,
} from './styles/PolicySetupWizard.styled';
import { WizardStepIndicatorProps } from './types';

const WizardStepIndicator: React.FC<WizardStepIndicatorProps> = ({
  steps,
  currentStep,
  title,
}) => (
  <WizardMenu>
    <WizardMenuTitle>
      <Typography variant="body-2" weight="medium">
        {title}
      </Typography>
    </WizardMenuTitle>
    {steps.map((step, index) => {
      const isActive = step.id === currentStep;
      const isCompleted = step.id < currentStep;
      const displayNumber = index + 1;

      return (
        <WizardStepItem key={step.id} $isActive={isActive}>
          <StepIndicator $isActive={isActive} $isCompleted={isCompleted}>
            {isCompleted ? <Checkmark /> : displayNumber}
          </StepIndicator>
          <StepLabel $isActive={isActive}>{step.label}</StepLabel>
        </WizardStepItem>
      );
    })}
  </WizardMenu>
);

export default WizardStepIndicator;

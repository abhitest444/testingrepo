import React, { useState, useEffect, ReactNode } from 'react';
import { Lottie } from '@cgds/lottie';
import { B4, B3 } from '@ids-ts/typography';
// Local styled components
import styled from 'styled-components';
import {
  StyledPopover,
  MediaSection,
  ContentSection,
  ContentContainer,
  DotsWrapper,
  DotButton,
  StyledPopoverContent,
  ActionsContainer,
  StyledButton,
  BackButton,
  StyledPopoverWrapper,
} from './GeneralPopoverTour.styled';

const LottieWrapper = styled(Lottie)`
  width: 100%;
  height: 100%;
`;

// Allowed types for Popover props
export type PopoverPosition = 'top' | 'bottom' | 'left' | 'right';
export type PopoverAlignment =
  | 'center'
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'middle'
  | 'center';
export type PopoverTheme = 'quickbooks';
export interface GeneralPopoverTourStep {
  id: string;
  title: ReactNode;
  description: ReactNode;
  buttonText: string;
  anchorEl: HTMLElement;
  position?: PopoverPosition;
  alignment?: PopoverAlignment;
  distance?: number;
  skidding?: number;
  bgcolor?: string;
  arrowColor?: string;
  lottieData?: object;
}

export interface GeneralPopoverTourProps {
  open: boolean;
  steps: GeneralPopoverTourStep[];
  onClose?: () => void;
  onFinish?: () => void;
  onStepChange?: (step: number) => void;
  theme?: PopoverTheme;
}

const GeneralPopoverTour: React.FC<GeneralPopoverTourProps> = ({
  open = false,
  steps,
  onClose,
  onStepChange,
  onFinish,
  theme = 'quickbooks',
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!open) setCurrentStep(0);
  }, [open]);

  const currentStepData = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;

  const handleNext = () => {
    if (isLast) {
      onFinish?.();
      onClose?.();
    } else {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      onStepChange?.(nextStep);
    }
  };

  const handleBack = () => {
    if (!isFirst) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      onStepChange?.(prevStep);
    }
  };

  const handleClose = () => {
    onClose?.();
    onFinish?.();
  };

  return (
    <StyledPopover
      open={open}
      targetElement={currentStepData.anchorEl}
      onClose={handleClose}
      position={currentStepData.position}
      alignment={currentStepData.alignment}
      dismissible
      enableClickAway
      popoverOffsetSkidding={currentStepData.skidding || 0}
      popoverOffsetDistance={currentStepData.distance || 0}
      variant="popover"
      arrowColor={currentStepData.arrowColor}
    >
      <StyledPopoverWrapper data-tour-popover="true">
        <MediaSection $bgcolor={currentStepData.bgcolor}>
          {currentStepData.lottieData && (
            <LottieWrapper
              autoPlay
              data={currentStepData.lottieData}
              description="Tour illustration"
              title="Tour illustration"
            />
          )}
        </MediaSection>
        <ContentSection>
          <ContentContainer>
            {steps.length > 1 && (
              <DotsWrapper data-testid="progress-dots">
                {steps.map((step, index: number) => (
                  <DotButton key={step.id} $active={index === currentStep} />
                ))}
              </DotsWrapper>
            )}
            <B3 weight="demi">{currentStepData.title || ''}</B3>
            <StyledPopoverContent
              alignment="left"
              overflow={false}
              maxHeight={40}
            >
              <B3 weight="regular">{currentStepData.description}</B3>
            </StyledPopoverContent>
          </ContentContainer>
          <ActionsContainer>
            <>
              {currentStep > 0 && (
                <BackButton
                  priority="secondary"
                  onClick={handleBack}
                  size="small"
                >
                  <B4 weight="demi">Back</B4>
                </BackButton>
              )}
              <StyledButton
                priority="primary"
                onClick={handleNext}
                size="small"
              >
                <B4 weight="demi">{currentStepData.buttonText}</B4>
              </StyledButton>
            </>
          </ActionsContainer>
        </ContentSection>
      </StyledPopoverWrapper>
    </StyledPopover>
  );
};

export default GeneralPopoverTour;

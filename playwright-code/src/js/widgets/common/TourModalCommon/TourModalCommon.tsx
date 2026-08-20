import React, { useState, useEffect } from 'react';
import { Modal } from '@ids-ts/modal-dialog';
import { H4, B2, B3 } from '@ids-ts/typography';
import Button from '@ids-ts/button';
import { useIntl } from '@payroll/quicksand';
import { Lottie } from '@cgds/lottie';
import styled from 'styled-components';

// Styled components extracted to separate file
import {
  StepDots,
  Dot,
  ActionsRow,
  HeadlineContainer,
  ContentContainer,
  ModalBodyContainer,
  BackButton,
  ResponsiveButton,
  ModalFooter,
  StyledModalHeader,
  MediaSection,
  ModalWrapper,
  StyledModalContent,
  StyledModalActions,
  MediaImage,
} from './TourModalCommon.styled';

const LottieWrapper = styled(Lottie)`
  width: 100%;
  height: 100%;
`;

// ---------------- Types ------------------

export type TourStep = {
  id: string;
  headline: React.ReactNode;
  body: React.ReactNode;
  bgcolor?: string;
  nextLabel?: string;
  itemAlignment?: string;
  imageMargin?: string;
  lastLabel?: string;
  isSingleElement?: boolean;
  lottieData?: object;
};

export interface TourModalProps {
  steps: TourStep[];
  onFinish?: () => void;
  open?: boolean;
  onClose?: () => void;
}

// -------------- Component ----------------------

const TourModalCommon: React.FC<TourModalProps> = ({
  steps,
  onFinish,
  open = false,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const intl = useIntl();

  const currentStepData = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;

  const handleNext = () => {
    if (isLast) {
      onFinish?.();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirst) setCurrentStep((prev) => prev - 1);
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
      onFinish?.();
    } else {
      onFinish?.();
    }
  };

  useEffect(() => {
    if (open) setCurrentStep(0);
  }, [open]);

  if (!open) return null;

  const dots = steps.map((step, i) => (
    <Dot key={step.id} active={i === currentStep} />
  ));

  return (
    <Modal open={open} size="large" dismissible={false} onClose={handleClose}>
      <ModalWrapper>
        <StyledModalHeader
          dismissible
          onClose={handleClose}
          backgroundColor={currentStepData?.bgcolor}
        />
        <MediaSection
          bgcolor={currentStepData?.bgcolor}
          itemAlignment={currentStepData?.itemAlignment}
        >
          {currentStepData.lottieData && (
            <LottieWrapper
              autoPlay
              data={currentStepData.lottieData}
              description="Tour illustration"
              title="Tour illustration"
            />
          )}
        </MediaSection>

        <ModalBodyContainer>
          <StyledModalContent>
            <HeadlineContainer>
              <H4 weight="bold">{currentStepData.headline}</H4>
            </HeadlineContainer>
            <ContentContainer>
              <B3>{currentStepData.body}</B3>
            </ContentContainer>
          </StyledModalContent>

          <StyledModalActions sectionDivider={false}>
            {currentStepData && currentStepData.isSingleElement ? (
              <Button onClick={handleNext} size="medium">
                <B2 weight="demi">
                  {currentStepData.nextLabel ||
                    intl.formatMessage({ id: 'tour.next' })}
                </B2>
              </Button>
            ) : (
              <>
                <ModalFooter>
                  {steps.length > 1 && (
                    <StepDots data-testid="progress-dots">{dots}</StepDots>
                  )}
                </ModalFooter>
                <ActionsRow>
                  {!isFirst && (
                    <BackButton
                      onClick={handleBack}
                      size="medium"
                      priority="secondary"
                    >
                      <B2 weight="demi">
                        {intl.formatMessage({ id: 'tour.back' })}
                      </B2>
                    </BackButton>
                  )}
                  <ResponsiveButton onClick={handleNext} size="medium">
                    <B2 weight="demi">
                      {isLast
                        ? intl.formatMessage({ id: 'tour.done' })
                        : currentStepData.nextLabel ||
                          intl.formatMessage({ id: 'tour.next' })}
                    </B2>
                  </ResponsiveButton>
                </ActionsRow>
              </>
            )}
          </StyledModalActions>
        </ModalBodyContainer>
      </ModalWrapper>
    </Modal>
  );
};

export default TourModalCommon;

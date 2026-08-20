import React, { useState, useEffect } from 'react';
import { Modal } from '@ids-ts/modal-dialog';
import { H4, B2 } from '@ids-ts/typography';
import { Lottie } from '@cgds/lottie';
import styled from 'styled-components';
import { TourStep } from '../../types';
import { getRandomColor } from '../../constants';
import {
  ModalWrapper,
  StyledModalHeader,
  MediaSection,
  ModalBodyContainer,
  StyledModalContent,
  HeadlineContainer,
  ContentContainer,
  StyledModalActions,
  StepDots,
  Dot,
  ActionsRow,
  BackButton,
  ActionButton,
  FooterLeft,
  FooterRight,
  HideModalPaddingStyles,
} from './GuidedModal.styled';

// `height: auto` (with capped max-height) lets the lottie keep its
// intrinsic aspect ratio so wide/short illustrations are letter-boxed
// inside the media area instead of being stretched to fill 100% height.
// The inner SVG already uses preserveAspectRatio="xMidYMid meet" so
// constraining the wrapper is enough to force a contained render.
const LottieWrapper = styled(Lottie)`
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
`;

export interface GuidedModalProps {
  /** Unique identifier for the modal */
  tourId: string;
  /** Whether the modal is open */
  open: boolean;
  /** Array of tour steps */
  steps: TourStep[];
  /** Called when modal is closed - marks tour as complete */
  onClose: () => void;
  /** Called when tour is completed - marks tour as complete */
  onComplete?: () => void;
}

/**
 * GuidedModal component for modal-based tours
 * Uses IDS Modal components for consistent design
 * Displays tour steps in a centered modal dialog with:
 * - Media section (Lottie animation, image, or colored placeholder)
 * - Title and description
 * - Progress dots
 * - Navigation buttons (Back/Next/Done)
 */
const GuidedModal: React.FC<GuidedModalProps> = ({
  tourId,
  open,
  steps,
  onClose,
  onComplete,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Reset step index when modal opens
  useEffect(() => {
    if (open) {
      setCurrentStepIndex(0);
    }
  }, [open]);

  if (!open || !steps || steps.length === 0) return null;

  const currentStep = steps[currentStepIndex];
  const totalSteps = steps.length;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;
  const isSingleStep = totalSteps === 1;

  // Use step-specific labels with defaults
  const nextLabel = currentStep.nextLabel || 'Next';
  const backLabel = currentStep.backLabel || 'Back';
  const doneLabel = currentStep.doneLabel || 'Done';

  // Priority: Lottie > Image > Color Background (same as GuidedTooltip)
  const hasMedia = currentStep.lottieData || currentStep.image;
  const backgroundColor = hasMedia ? 'transparent' : getRandomColor();

  /**
   * Render media content based on step configuration
   * Priority: Lottie animation > Static image > Colored placeholder
   * Note: lottieData is already resolved by TourFramework
   */
  const renderMediaContent = () => {
    if (currentStep.lottieData) {
      // Lottie animation (highest priority). `loop` keeps marketing
      // illustrations alive while the user is reading the body — tour
      // copy is meant to be skimmed, so a one-shot animation freezes
      // the modal halfway through and looks broken.
      return (
        <LottieWrapper
          autoPlay
          loop
          data={currentStep.lottieData}
          description={currentStep.title}
          title={currentStep.title}
        />
      );
    }

    if (currentStep.image) {
      // Static image (second priority)
      return (
        <img
          src={currentStep.image}
          alt={currentStep.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      );
    }

    // Fallback: empty div (background color handles visual)
    return null;
  };

  /**
   * Handle next button click
   */
  const handleNext = () => {
    // Execute step-specific onNext callback if provided
    if (currentStep.onNext) {
      currentStep.onNext();
    }

    if (isLastStep) {
      // Complete and close on last step
      handleClose();
    } else {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  /**
   * Handle back button click
   */
  const handleBack = () => {
    // Execute step-specific onBack callback if provided
    if (currentStep.onBack) {
      currentStep.onBack();
    }

    if (!isFirstStep) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  /**
   * Get the label for the action button based on step position
   */
  const getActionButtonLabel = () => {
    if (isLastStep || isSingleStep) return doneLabel;
    return nextLabel;
  };

  /**
   * Handle modal close - both X button and Done button mark tour as complete
   */
  const handleClose = () => {
    setCurrentStepIndex(0);
    onComplete?.();
    onClose();
  };

  // Generate progress dots
  const dots = steps.map((step, index) => (
    <Dot
      key={step.id}
      active={index === currentStepIndex}
      data-testid={`progress-dot-${index}`}
    />
  ));

  return (
    <>
      <HideModalPaddingStyles />
      <Modal
        open={open}
        size="large"
        className={`guided-tour-modal guided-tour-modal--${tourId}`}
        dismissible={false}
        onClose={handleClose}
        // Tour modals are intentionally non-dismissable from outside —
        // the backdrop is purely visual. Without an explicit
        // `onBackdropClick`, IDS Modal falls back to `onClose`, which
        // would silently mark the tour as completed when the user
        // clicked anywhere off the dialog. A no-op handler intercepts
        // the bubble so only the X button and the action button can
        // close the modal.
        onBackdropClick={() => {}}
        data-testid={`guided-modal-${tourId}`}
      >
        <ModalWrapper>
          <StyledModalHeader
            dismissible
            onClose={handleClose}
            backgroundColor={backgroundColor}
          />

          {/* Media section (Lottie/Image/Placeholder) */}
          <MediaSection
            bgcolor={backgroundColor}
            data-element="guided-modal-media"
          >
            {renderMediaContent()}
          </MediaSection>

          <ModalBodyContainer data-element="guided-modal-body">
            {/* Content section */}
            <StyledModalContent data-element="guided-modal-modal-content">
              <HeadlineContainer data-element="guided-modal-headline">
                <H4 weight="bold" id="guided-modal-title">
                  {currentStep.title}
                </H4>
              </HeadlineContainer>
              <ContentContainer data-element="guided-modal-content">
                <B2 id="guided-modal-description">{currentStep.description}</B2>
              </ContentContainer>
            </StyledModalContent>

            {/* Footer with progress dots and navigation */}
            <StyledModalActions>
              {/* Progress dots - left side */}
              <FooterLeft>
                {totalSteps > 1 && (
                  <StepDots data-testid="progress-dots">{dots}</StepDots>
                )}
              </FooterLeft>
              {/* Navigation buttons - right side */}
              <FooterRight>
                <ActionsRow>
                  {/* Back button - show only if not first step and multiple steps */}
                  {!isFirstStep && totalSteps > 1 && (
                    <BackButton
                      priority="secondary"
                      size="medium"
                      onClick={handleBack}
                      data-testid="guided-modal-back"
                    >
                      {backLabel}
                    </BackButton>
                  )}

                  {/* Action button (Next/Done) */}
                  <ActionButton
                    priority="primary"
                    size="medium"
                    onClick={handleNext}
                    data-testid="guided-modal-action"
                  >
                    {getActionButtonLabel()}
                  </ActionButton>
                </ActionsRow>
              </FooterRight>
            </StyledModalActions>
          </ModalBodyContainer>
        </ModalWrapper>
      </Modal>
    </>
  );
};

export default GuidedModal;

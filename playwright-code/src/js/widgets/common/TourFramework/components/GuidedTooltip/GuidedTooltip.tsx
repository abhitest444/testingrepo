import React, { useState, useEffect } from 'react';
import GuidedTourTooltip from '@ids-ts/guided-tour-tooltip';
import { Lottie } from '@cgds/lottie';
import styled from 'styled-components';
import { Button } from '@ids-ts/button';
import { useTheme } from '@design-systems/theme';
import {
  ImageSection,
  LottieSection,
  ProgressDots,
  ProgressDot,
  HideTitleStyles,
  ContentSection,
  Description,
  StepTitle,
  ButtonFooter,
} from './GuidedTooltip.styled';
import { TourStep } from '../../types';
import { getRandomColor } from '../../constants';
import { buildTooltipSteps } from '../../utils/buildStepConfig';

const LottieWrapper = styled(Lottie)`
  width: 100%;
  height: 100%;
`;

interface GuidedTooltipProps {
  open: boolean;
  steps: TourStep[];
  onClose: () => void;
  onStepChange?: (stepIndex: number) => void;
  onComplete?: () => void;
  doneLabel?: string;
}

/**
 * Check if the target element is inside a trowser
 * by looking for parent elements with trowser-related attributes
 */
const isInsideTrowser = (element: HTMLElement | null): boolean => {
  if (!element) return false;

  // Check if element or any ancestor is inside a trowser
  // Trowsers typically have role="dialog" or specific class/data attributes
  const trowserSelectors = [
    '[data-testid*="trowser"]',
    '[class*="Trowser"]',
    '[class*="trowser"]',
    '[role="dialog"]',
  ];

  return trowserSelectors.some(
    (selector) => element.closest(selector) !== null,
  );
};

const GuidedTooltip: React.FC<GuidedTooltipProps> = ({
  open,
  steps,
  onClose,
  onStepChange,
  onComplete,
  doneLabel = 'Done',
}) => {
  const [isRefReady, setIsRefReady] = useState(false);
  // Get the current theme from ThemeProvider context (supports IES/QuickBooks themes)
  const { currentTheme, currentColorScheme } = useTheme({});

  // Wait for target refs to be available in the DOM
  useEffect(() => {
    if (!open || steps.length === 0) {
      setIsRefReady(false);
      return undefined;
    }

    // Use requestAnimationFrame to ensure DOM is painted
    const rafId = requestAnimationFrame(() => {
      const hasValidRef = steps.some((step) => step.targetRef?.current);
      if (hasValidRef) {
        setIsRefReady(true);
      } else {
        // If refs not ready, try again on next frame
        requestAnimationFrame(() => {
          const hasValidRefRetry = steps.some(
            (step) => step.targetRef?.current,
          );
          if (hasValidRefRetry) {
            setIsRefReady(true);
          }
        });
      }
    });

    return () => {
      cancelAnimationFrame(rafId);
      setIsRefReady(false);
    };
  }, [open, steps]);

  // Filter out steps without valid target refs
  const validSteps = steps.filter((step) => step.targetRef?.current);

  if (!open || !isRefReady || validSteps.length === 0) return null;

  // Auto-detect if tour target is inside a trowser
  // If inside trowser, tour should show ABOVE it (don't hide under trowser)
  const firstValidRef = validSteps[0]?.targetRef?.current || null;
  const shouldHideUnderTrowser = !isInsideTrowser(firstValidRef);

  const isSingleStep = steps.length === 1;

  // Render message content for each step
  const renderTooltipContent = (step: TourStep, index: number) => {
    // Priority: Lottie > Image > Color Background. Steps that opt out
    // via `hideMedia` skip the entire image block — no media, no
    // colored placeholder — so the tooltip is text-only.
    const hasMedia = step.lottieData || step.image;
    const showMediaSection = !step.hideMedia;

    // Determine media content to render
    let mediaContent;
    if (step.lottieData) {
      // Lottie animation (highest priority)
      mediaContent = (
        <LottieWrapper
          autoPlay
          data={step.lottieData}
          description={step.title}
          title={step.title}
        />
      );
    } else if (step.image) {
      // Static image (second priority)
      mediaContent = (
        <img
          src={step.image}
          alt={step.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      );
    } else {
      // Fallback: colored background when no media provided
      mediaContent = <div style={{ width: '100%', height: '100%' }} />;
    }

    return (
      <div>
        {showMediaSection && (
          <ImageSection>
            <LottieSection
              style={{
                backgroundColor: hasMedia ? 'transparent' : getRandomColor(),
              }}
            >
              {mediaContent}
            </LottieSection>
            {/* Only show progress dots when there are multiple steps */}
            {steps.length > 1 && (
              <ProgressDots>
                {steps.map((s, dotIndex) => (
                  <ProgressDot key={s.id} active={dotIndex === index} />
                ))}
              </ProgressDots>
            )}
          </ImageSection>
        )}
        <ContentSection>
          <StepTitle $noMedia={!showMediaSection}>{step.title}</StepTitle>
          <Description $noMedia={!showMediaSection}>
            {step.description}
          </Description>
        </ContentSection>
        {/* Custom footer for single-step tours (IDS doesn't show footer when stepCount <= 1) */}
        {isSingleStep && (
          <ButtonFooter>
            <Button
              onClick={() => {
                if (onComplete) {
                  onComplete();
                }
                onClose();
              }}
              size="small"
              priority="primary"
            >
              {doneLabel}
            </Button>
          </ButtonFooter>
        )}
      </div>
    );
  };

  // Build IDS-compatible tour steps
  const idsSteps = buildTooltipSteps({
    steps,
    onStepChange,
    onComplete,
    renderTooltipContent,
    shouldHideUnderTrowser,
  });

  /**
   * Handle close from X button or clicking outside
   * This does NOT mark tour as completed - only explicit "Done" does that
   */
  const handleClose = () => {
    onClose();
  };

  return (
    <>
      <HideTitleStyles />
      <GuidedTourTooltip
        open={open}
        theme={currentTheme}
        colorScheme={currentColorScheme}
        steps={idsSteps}
        onClose={handleClose}
        doneLabel={doneLabel}
        ofLabel="of"
        automationId="guided-tour-tooltip"
      />
    </>
  );
};

export default GuidedTooltip;

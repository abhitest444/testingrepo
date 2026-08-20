import React, { useEffect, useState, useMemo } from 'react';
import GuidedModal from './components/GuidedModal';
import GuidedTooltip from './components/GuidedTooltip';
import { TOUR_FRAMEWORK_MODES } from './constants';
import { TourFrameworkProps, TourStep } from './types';
import { useTourStorage } from './hooks/useTourStorage';

/**
 * Resolve image filename to full path from assets folder
 * If the image string is just a filename (no path separators),
 * dynamically import it from src/assets/images/
 */
const resolveImagePath = (image: string | undefined): string | undefined => {
  if (!image) return undefined;

  // If it's already a full URL or path, return as-is
  if (image.includes('/') || image.startsWith('http')) {
    return image;
  }

  return require(`src/assets/images/${image}`);
};

/**
 * Resolve lottie data - if string (filename), load from assets/animations
 * If object, return as-is
 */
const resolveLottieData = (
  lottieData: object | string | undefined,
): object | undefined => {
  if (!lottieData) return undefined;

  // If it's already an object, return as-is
  if (typeof lottieData === 'object') {
    return lottieData;
  }

  // If it's a string filename, load from assets/animations
  return require(`src/assets/animations/${lottieData}`);
};

/**
 * TourFramework component for providing contextual help and guidance
 * Supports both modal and tooltip (popover) modes with multi-step navigation
 *
 * Features:
 * - Encapsulated tour completion persistence (via useTourStorage)
 * - Automatic completion status tracking
 * - Close button (X) closes the tour without marking as completed
 * - Done button on last step marks tour as completed
 * - Consumer is notified via onComplete
 * - Automatic image path resolution from assets folder (just pass filename)
 */
const TourFramework: React.FC<TourFrameworkProps> = ({
  sandbox,
  open,
  steps,
  tourId,
  onComplete,
  onClose,
  doneLabel,
  mode = TOUR_FRAMEWORK_MODES.TOOLTIP,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Resolve image and lottie paths in steps
  // Convert filenames to full paths from assets folder
  const resolvedSteps = useMemo<TourStep[]>(
    () =>
      steps?.map((step) => ({
        ...step,
        image: resolveImagePath(step.image),
        lottieData: resolveLottieData(step.lottieData),
      })) || [],
    [steps],
  );

  // Encapsulated tour storage - handles persistence internally
  const {
    isTourCompleted,
    isLoading,
    initializeTourStatus,
    markTourCompleted,
  } = useTourStorage(sandbox, tourId);

  // Initialize tour status on mount, check if tour is completed
  useEffect(() => {
    initializeTourStatus();
    sandbox?.logger.info(
      `[TourFramework] Initializing tour status for: ${tourId}`,
    );
  }, [initializeTourStatus, sandbox, tourId]);

  // Notify consumer of tour completion status changes (for both modes)
  useEffect(() => {
    onComplete?.({
      isCompleted: isTourCompleted,
      isLoading,
    });
  }, [isTourCompleted, isLoading, onComplete]);

  // Log mount
  useEffect(() => {
    sandbox?.logger.info(
      `[TourFramework] TourFramework component mounted for tour ${tourId}`,
    );
  }, [sandbox, tourId]);

  if (!open || !steps || steps.length === 0) {
    return null;
  }

  /**
   * Handle tour completion - called when user clicks "Done" on last step
   * Marks tour as completed in persistent storage
   */
  const handleComplete = async () => {
    await markTourCompleted();
    setCurrentStepIndex(0);
  };

  /**
   * Handle close - called when X button is clicked
   * Does not mark tour as completed - only "Done" button does that
   */
  const handleCloseAndReset = () => {
    setCurrentStepIndex(0);
    onClose();
  };

  // Render as Modal
  // For modal mode, both close (X button) and complete (Done button) mark tour as complete
  if (mode === TOUR_FRAMEWORK_MODES.MODAL) {
    return (
      <GuidedModal
        tourId={tourId}
        open={open}
        steps={resolvedSteps}
        onClose={onClose}
        onComplete={handleComplete}
      />
    );
  }

  // Render as Tooltip (Popover)
  if (mode === TOUR_FRAMEWORK_MODES.TOOLTIP) {
    return (
      <GuidedTooltip
        open={open}
        steps={resolvedSteps}
        doneLabel={doneLabel}
        onClose={handleCloseAndReset}
        onComplete={handleComplete}
        onStepChange={(stepIndex) => {
          setCurrentStepIndex(stepIndex);
        }}
      />
    );
  }

  return null;
};

export default TourFramework;

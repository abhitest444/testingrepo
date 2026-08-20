import React, { useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { B2, B3 } from '@ids-ts/typography';
import { Checkmark } from '@design-systems/icons';
import { IconControl } from '@ids-ts/icon-control';
import { useAppSelector, useAppDispatch } from '../store';
import {
  selectCurrentStep,
  selectUxPreferencesData,
  selectCompletedSteps,
  selectVisitedSteps,
  selectAIPreferencesSeen,
} from '../store/selectors';
import {
  setCurrentStep,
  setUserInitiatedNavigation,
} from '../store/progressSlice';

interface Step {
  number: number;
  label: string;
}

const steps: Step[] = [
  { number: 1, label: 'Upload file' },
  { number: 2, label: 'Review field mapping' },
  { number: 3, label: 'Assign unmapped info' },
  { number: 4, label: 'Review entries' },
];

const StepProgressCard: React.FC = () => {
  const dispatch = useAppDispatch();

  // Get current step and completed steps from Redux
  const currentInternalStep = useAppSelector(selectCurrentStep);
  const completedStepsSet = useAppSelector(selectCompletedSteps);
  const visitedStepsSet = useAppSelector(selectVisitedSteps);

  // Check if preferences have been seen (read from Redux - auto-loaded from sandbox storage)
  const isStep4AlreadyCompleted = useAppSelector(selectAIPreferencesSeen);

  // Helper functions to map internal steps to display steps (threshold step removed; default 8h)
  const getDisplayStep = (step: number): number => {
    // Map internal steps to display 4 steps: 1 Upload, 2 Map columns, 3 Map values, 4 Review
    // Internal 4 (Preferences) is skipped; 3 -> 5 (Review)
    if (step === 1) return 1;
    if (step === 2) return 2;
    if (step === 3) return 3;
    return 4; // internal 5 (Review) or 6 (Complete) -> display step 4
  };

  const getCompletedSteps = (step: number): number[] => {
    const completed: number[] = [];

    // Use Redux completed steps for steps 2 and 3
    if (completedStepsSet.includes(2)) completed.push(2);
    if (completedStepsSet.includes(3)) completed.push(3);

    // Step 1 is completed if we're past it
    if (step > 1) completed.push(1);

    // Mark Step 4 (Review) as completed if we're on step 5 or 6 (threshold step removed)
    if (step >= 5 || isStep4AlreadyCompleted) completed.push(4);

    return completed;
  };

  // Memoize display step and completed steps
  const currentDisplayStep = useMemo(
    () => getDisplayStep(currentInternalStep),
    [currentInternalStep],
  );

  const completedDisplaySteps = useMemo(
    () => getCompletedSteps(currentInternalStep),
    [currentInternalStep, isStep4AlreadyCompleted, completedStepsSet],
  );

  const getStepStatus = (stepNumber: number) => {
    // Current step takes precedence over completed status
    if (stepNumber === currentDisplayStep) return 'current';
    if (completedDisplaySteps.includes(stepNumber)) return 'completed';
    return 'pending';
  };

  // Map display step to internal step (no internal step 4; display 4 = Review = internal 5)
  const getInternalStep = (displayStep: number): number =>
    displayStep === 4 ? 5 : displayStep;

  // Handle step click - only allow navigation to completed or current steps
  const handleStepClick = useCallback(
    (displayStep: number) => {
      const status = getStepStatus(displayStep);

      // Only allow clicking on:
      // 1. Completed steps (going back)
      // 2. Current step (staying on same step)
      // 3. BUT: Step 4 should only be clickable if Step 3 is completed
      //    (even if Step 4 was previously completed from a past session)
      if (status === 'completed' || status === 'current') {
        // Special rule for Step 4: must have completed Step 3 first
        if (displayStep === 4 && !completedDisplaySteps.includes(3)) {
          // Step 4 is not clickable if Step 3 is not completed yet
          return;
        }

        const internalStep = getInternalStep(displayStep);

        // Set user-initiated navigation flag before changing step
        dispatch(setUserInitiatedNavigation(true));
        dispatch(setCurrentStep(internalStep));
      }
    },
    [completedDisplaySteps, currentDisplayStep, dispatch],
  );

  return (
    <Container>
      <Title>
        <B2 weight="demi">Import time entries</B2>
      </Title>
      <StepsContainer>
        {steps.map((step) => {
          const status = getStepStatus(step.number);

          // Step 4 is only clickable if Step 3 is completed
          // (even if Step 4 shows as completed from previous session)
          const isStep4WithoutStep3 =
            step.number === 4 && !completedDisplaySteps.includes(3);

          const isClickable =
            !isStep4WithoutStep3 &&
            (status === 'completed' || status === 'current');

          return (
            <StepRow
              key={step.number}
              status={status}
              onClick={() => handleStepClick(step.number)}
              isClickable={isClickable}
            >
              <StepIndicator status={status}>
                {status === 'completed' ? (
                  <IconControl size="small" aria-label="Completed">
                    <Checkmark />
                  </IconControl>
                ) : (
                  <StepNumber status={status}>{step.number}</StepNumber>
                )}
              </StepIndicator>
              <StepLabel status={status}>{step.label}</StepLabel>
            </StepRow>
          );
        })}
      </StepsContainer>
    </Container>
  );
};

const Container = styled.div`
  background: #ffffff;
  border: 1px solid rgb(210, 212, 217);
  border-radius: 12px !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  width: 100%;
`;

const Title = styled.div`
  color: #6b7280;
  padding: 12px 16px;
  border-bottom: 1px solid rgb(210, 212, 217);
`;

const StepsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`;

const StepRow = styled.div<{
  status: 'completed' | 'current' | 'pending';
  isClickable?: boolean;
}>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid rgb(210, 212, 217);
  background-color: ${({ status }) =>
    status === 'current' ? 'rgba(0, 62, 49, 0.20)' : 'transparent'};
  cursor: ${({ isClickable }) => (isClickable ? 'pointer' : 'default')};
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${({ isClickable, status }) => {
      if (!isClickable) return 'transparent';
      if (status === 'current') return 'rgba(0, 62, 49, 0.20)';
      return 'rgba(0, 62, 49, 0.08)';
    }};
  }

  &:last-child {
    border-bottom: none;
  }
`;

const StepIndicator = styled.div<{
  status: 'completed' | 'current' | 'pending';
}>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 600;
  background-color: ${({ status }) => {
    if (status === 'completed') return '#003E31';
    if (status === 'current') return '#003E31';
    return 'transparent';
  }};
  border: ${({ status }) => {
    if (status === 'completed' || status === 'current') return 'none';
    return '2px solid #d1d5db';
  }};
  color: ${({ status }) => {
    if (status === 'completed' || status === 'current') return '#ffffff';
    return '#9ca3af';
  }};

  /* Style the check icon to be white */
  svg {
    fill: white;
    color: white;
  }
`;

const StepNumber = styled.span<{ status: 'completed' | 'current' | 'pending' }>`
  font-size: 11px;
  font-weight: 700;
  color: inherit;
`;

const StepLabel = styled(B2)<{ status: 'completed' | 'current' | 'pending' }>``;

export default StepProgressCard;

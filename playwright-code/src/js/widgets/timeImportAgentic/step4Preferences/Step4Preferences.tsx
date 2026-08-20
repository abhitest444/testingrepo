import React, { useCallback, useEffect, useRef, useState } from 'react';
import { H4, B2, B3 } from '@ids-ts/typography';
import TextField from '@ids-ts/text-field';
import Button from '@ids-ts/button';
import PageMessage from '@ids-ts/page-message';
import styled from 'styled-components';
import { Sandbox } from 'src/js/common/sandbox';
import { useAppDispatch, useAppSelector } from '../store';
import {
  setCurrentStep,
  setUserInitiatedNavigation,
} from '../store/progressSlice';
import { setMaxHoursPerDay } from '../store/step1Slice';
import {
  selectMaxHoursPerDay,
  selectAIPreferencesSeen,
} from '../store/selectors';
import StepProgressCard from '../components/StepProgressCard';
import BackButton from '../components/BackButton';
import { StepContainer } from '../base.styles';
import { useAIImportPreferences } from '../hooks/useAIImportPreferences';

interface Step4PreferencesProps {
  sandbox?: Sandbox;
  /** When true, hide the step progress card (e.g. in split-screen view). */
  hideStepProgress?: boolean;
  /** When true, hide title and subtitle (e.g. in split-screen view). */
  hideTitle?: boolean;
}

export const Step4Preferences: React.FC<Step4PreferencesProps> = ({
  sandbox,
  hideStepProgress = false,
  hideTitle = false,
}) => {
  const dispatch = useAppDispatch();
  const maxHoursPerDay = useAppSelector(selectMaxHoursPerDay);
  const isUserInitiatedNavigation = useAppSelector(
    (state: any) => state.progress.isUserInitiatedNavigation,
  );

  // Read preferences seen from Redux (auto-loaded from sandbox storage)
  const aiPreferencesSeen = useAppSelector(selectAIPreferencesSeen);

  // Initialize AI preferences hook (for SAVING only)
  // Always call hooks unconditionally - React hooks rules
  const aiPrefs = useAIImportPreferences(sandbox || ({} as Sandbox));

  const [validationError, setValidationError] = useState<string>('');
  const [showPageMessage, setShowPageMessage] = useState<boolean>(true);

  const hasAutoSkippedRef = useRef(false);

  // Auto-skip logic - check if this screen was already seen
  useEffect(() => {
    // Read from Redux (auto-loaded from sandbox storage)
    const preferencesSeen = aiPreferencesSeen;

    // If user explicitly navigated here, clear flag and don't skip
    if (isUserInitiatedNavigation) {
      // Reset the auto-skip flag so user can see the preferences
      hasAutoSkippedRef.current = false;
      // Clear the navigation flag
      dispatch(setUserInitiatedNavigation(false));
      return;
    }

    // Don't auto-skip more than once
    if (hasAutoSkippedRef.current) return;

    // Check if preference is 'true' (stored as string)
    if (preferencesSeen) {
      // Already seen, skip to next step
      hasAutoSkippedRef.current = true;
      dispatch(setCurrentStep(5)); // Go to Step 5 (Review)
    }
  }, [aiPreferencesSeen, isUserInitiatedNavigation, dispatch]);

  const handleMaxHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;

    // Clear validation error when user starts typing
    setValidationError('');

    // Allow empty input for editing
    if (value === '') {
      dispatch(setMaxHoursPerDay(8)); // Set to default
      return;
    }

    const numValue = parseInt(value, 10);

    // Validate range
    if (Number.isNaN(numValue) || numValue < 1 || numValue > 24) {
      setValidationError('Enter a valid number between 1-24');
      return;
    }

    dispatch(setMaxHoursPerDay(numValue));
  };

  const handleContinue = useCallback(async () => {
    // Validate before continuing
    if (maxHoursPerDay < 1 || maxHoursPerDay > 24) {
      setValidationError('Enter a valid number between 1-24');
      return;
    }

    try {
      // Mark preferences as seen when user clicks Continue
      // Save to sandbox storage
      aiPrefs?.markPreferencesSeen();

      // Save 8-hour limit to sandbox storage (personal preference)
      const imposelimit = maxHoursPerDay === 8;
      aiPrefs?.setImpose8HourLimit(imposelimit);
    } catch (error) {
      // If preference save fails, still allow navigation
    }

    // Move to Step 5 (Review)
    dispatch(setCurrentStep(5));
  }, [dispatch, maxHoursPerDay, aiPrefs]);

  return (
    <StepContainer>
      {!hideTitle && (
        <>
          <H4 weight="demi" style={{ marginTop: '16px', marginBottom: '20px' }}>
            Last step, choose preferences
          </H4>
          <B2 style={{ marginBottom: '24px' }}>
            You&apos;re almost there! Choose preferences on how to add the
            imported time entries.
          </B2>
        </>
      )}

      {/* Page Message */}
      {!hideTitle && showPageMessage && (
        <PageMessage
          type="info"
          dismissible
          onClose={() => setShowPageMessage(false)}
          open={showPageMessage}
          style={{ marginBottom: '24px' }}
        >
          Imported time entries will be added to the existing time on that date
          for employees.
        </PageMessage>
      )}

      {/* Content and progress card side by side */}
      <div
        style={{
          display: 'flex',
          gap: hideStepProgress ? 0 : '24px',
          alignItems: 'flex-start',
        }}
      >
        {/* Preferences card - Left side */}
        <div style={{ flex: 1 }}>
          <ConfigurationCard>
            <Section>
              <SectionTitle weight="demi">
                Flagging threshold (hours)
              </SectionTitle>
              <B3 style={{ color: '#666', marginBottom: '16px' }}>
                Entries with hours greater than this amount will be flagged for
                review.
              </B3>
              <TextField
                label="Max hours allowed per day"
                type="number"
                value={maxHoursPerDay.toString()}
                onChange={handleMaxHoursChange}
                validationError={!!validationError}
                helperText={validationError}
                style={{ width: '100%' }}
                min={1}
                max={24}
              />
            </Section>
          </ConfigurationCard>

          {/* Action Buttons */}
          <div
            style={{
              marginTop: '24px',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              alignItems: 'center',
            }}
          >
            <BackButton sandbox={sandbox} />
            <Button
              onClick={handleContinue}
              priority="primary"
              theme="gbsgexperimental"
            >
              Import time entries
            </Button>
          </div>
        </div>

        {!hideStepProgress && (
          <div style={{ width: '280px', flexShrink: 0 }}>
            <StepProgressCard />
          </div>
        )}
      </div>
    </StepContainer>
  );
};

// Styled Components
const ConfigurationCard = styled.div`
  border: 1px solid rgb(210, 212, 217);
  border-radius: 12px;
  padding: 32px;
  background-color: white;
  display: flex;
  flex-direction: column;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
`;

const SectionTitle = styled(B2)`
  margin-bottom: 8px;
  color: #000;
`;

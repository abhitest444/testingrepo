import React from 'react';
import styled, { keyframes } from 'styled-components';
import { H4, B1, B3 } from '@ids-ts/typography';
import { AiSparkles } from '@design-systems/icons';
import { IconControl } from '@ids-ts/icon-control';

interface AnalyzingLoadingStateProps {
  primaryText?: string;
  secondaryText?: string;
}

const AnalyzingLoadingState: React.FC<AnalyzingLoadingStateProps> = ({
  primaryText = 'Analyzing file',
  secondaryText = 'Good time to grab a coffee, this might take a few minutes.',
}) => (
  <LoadingContainer>
    <TextRow>
      <IconControl size="large" aria-label="AI processing">
        <StyledAiSparkles size="xlarge" />
      </IconControl>
      <PrimaryText>
        {primaryText}{' '}
        <AnimatedDots>
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </AnimatedDots>
      </PrimaryText>
    </TextRow>
    {secondaryText && <SecondaryText>{secondaryText}</SecondaryText>}
  </LoadingContainer>
);

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  padding: 48px 24px;
  text-align: center;
  gap: 24px;
`;

const TextRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const PrimaryText = styled(H4)`
  margin: 0;
`;

const pulseAnimation = keyframes`
  0%, 100% {
    opacity: 0.4;
  }
  50% {
    opacity: 1;
  }
`;

const StyledAiSparkles = styled(AiSparkles)`
  flex-shrink: 0;
`;

const SecondaryText = styled(B3)`
  max-width: 400px;
  animation: ${pulseAnimation} 2.5s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 0.7;
  }
`;

const waveAnimation = keyframes`
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
`;

const AnimatedDots = styled.span`
  & {
    display: inline-block;
  }

  & span {
    animation: ${waveAnimation} 1.4s ease-in-out infinite;
  }

  & span:nth-child(1) {
    animation-delay: 0s;
  }

  & span:nth-child(2) {
    animation-delay: 0.2s;
  }

  & span:nth-child(3) {
    animation-delay: 0.4s;
  }

  @media (prefers-reduced-motion: reduce) {
    & span {
      animation: none;
      opacity: 1;
    }
  }
`;

export default AnalyzingLoadingState;

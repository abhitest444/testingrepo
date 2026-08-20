import styled from 'styled-components';

export const BREAK_TIMER_RUNNING_COLOR = '#FFEAC7'; // Light orange background for breaks

export const TimerContainer = styled.div<{ color?: string }>`
  border: 1px solid var(--color-container-border-secondary);
  border-radius: var(
    --radius-large
  ); /* (SemanticContextMatchOnly) Replaced hardcoded radius with design token */
  padding-top: 20px;
  padding-bottom: 20px;
  text-align: center;
  background-color: ${(props) => props.color || 'transparent'};
`;

export const TimerDisplayContainer = styled.div`
  padding-top: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

export const TimerHeading = styled.h2`
  margin: 0;
  font-size: var(--font-size-component-small);
  font-weight: var(--font-weight-component-bold);
  color: var(--color-text-primary);
`;

export const TimerDisplay = styled.div`
  font-size: var(--font-size-display-4);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-heading-bold);
  font-family: var(--font-family-display); /* (SemanticContextMatchOnly) */
`;

export const SummaryContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 10px;
`;

export const SummaryItem = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

export const SummaryLabel = styled.span`
  font-size: var(--font-size-component-x-small);
`;

export const SummaryValue = styled.span`
  padding-left: 4px;
`;

export const BreakRequiredText = styled.div`
  font-size: var(--font-size-component-small);
  color: var(--color-text-primary);
  margin-top: 8px;
  font-weight: var(--font-weight-component-bold);
`;

import styled from 'styled-components';

export const PageContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  background: var(--color-page-background-primary);
  padding: 0;
  box-sizing: border-box;
`;

export const BackLink = styled.a`
  display: inline-block;
  color: var(--color-link-text); /* (SemanticContextMatchOnly) */
  font-weight: var(--font-weight-component-bold);
  font-size: 1rem;
  margin: 32px 0 16px 32px;
  cursor: pointer;
`;

export const Card = styled.div`
  background: var(
    --color-container-background-secondary
  ); /* (SemanticContextMatchOnly) */
  border-radius: var(--radius-large);
  margin: 0 0 32px 0;
  padding: 24px 32px 24px 32px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  max-width: 100%;
  margin-left: 0;
`;

export const CardHeader = styled.div``;

export const TimeSummary = styled.div`
  display: flex;
  gap: 120px;
  margin-top: 24px;
`;

export const TimeBlock = styled.div`
  text-align: left;
`;

export const OptionList = styled.div`
  margin-top: 0;
  max-width: 1100px;
  margin-left: 32px;
`;

export const Option = styled.div`
  display: flex;
  align-items: center;
  padding: 40px 0 32px 0;
  border-bottom: 1px solid var(--color-divider-tertiary);
  &:last-child {
    border-bottom: none;
  }
`;

export const OptionIcon = styled.div`
  margin-right: 32px;
  svg {
    width: 56px;
    height: 56px;
    color: var(--color-action-standard); /* (SemanticContextMatchOnly) */
  }
`;

export const OptionContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

export const OptionButton = styled.button`
  padding: 8px 32px;
  font-weight: var(--font-weight-component-bold);
  border-radius: 24px;
  border: 2px solid var(--color-action-passive-border); /* (SemanticContextMatchOnly) */
  background: var(
    --color-action-passive-subtle
  ); /* (SemanticContextMatchOnly) */
  color: var(--color-text-primary); /* (SemanticContextMatchOnly) */
  font-size: 1.1rem;
  margin-top: 0;
  cursor: pointer;
  &:hover {
    background: var(
      --color-action-passive-subtle-hover
    ); /* (SemanticContextMatchOnly) */
  }
`;

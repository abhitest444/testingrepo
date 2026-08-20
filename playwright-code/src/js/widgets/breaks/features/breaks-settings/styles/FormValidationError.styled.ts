import styled from 'styled-components';

export const ValidationErrorContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  margin-bottom: 8px;
`;

export const ErrorIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

export const ErrorText = styled.div`
  color: var(--color-text-negative); /* (SemanticContextMatchOnly) */
  font-size: var(--font-size-component-small);
  line-height: 1.4;
`;

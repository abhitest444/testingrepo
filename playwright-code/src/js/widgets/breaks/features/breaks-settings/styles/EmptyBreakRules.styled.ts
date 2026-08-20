import styled from 'styled-components';

export const EmptyContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: 40px 0;
`;

export const IconWrapper = styled.div``;

export const Title = styled.div`
  font-size: var(--font-size-heading-6);
  font-weight: var(--font-weight-component-bold);
  color: var(--color-text-primary);
  margin-bottom: 8px;
`;

export const Subtext = styled.div`
  font-size: var(--font-size-component-medium);
  color: var(--color-text-secondary);
`;

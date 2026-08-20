import styled from 'styled-components';

export const TrowserContent = styled.div`
  position: relative;
  max-width: 1400px;
  margin: 40px auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const HeaderTextGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 48px 24px;
  gap: 24px;
  margin-top: 16px;
`;

// Policy Details Screen Styles
export const PolicyDetailsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const PolicyHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const PolicyActionsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const PolicyActionsButtonGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

export const RulesSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

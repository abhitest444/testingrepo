import styled from 'styled-components';

export const TrowserMainContent = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 20px 20px 0 20px;
  box-sizing: border-box;
`;

export const PageContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  width: 100%;
`;

export const HeaderSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 1032px;
`;

export const DescriptionBlock = styled.div`
  display: flex;
  flex-direction: column;
  color: var(--color-text-primary, #393a3d);

  p {
    margin: 0;
  }
`;

export const ToolbarSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  width: 100%;
`;

export const ToolbarActionsRow = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 36px;
`;

export const ToolbarSearchRow = styled.div`
  display: flex;
  align-items: flex-start;
  width: 100%;
  min-height: 32px;
`;

export const ToolbarSearchWrap = styled.div`
  width: 239px;
  flex-shrink: 0;
`;

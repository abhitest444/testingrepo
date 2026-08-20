import React from 'react';
import styled from 'styled-components';
import { Activity } from '@ids-ts/loader';

const OverlayContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(
    --color-container-overlay
  ); /* (SemanticContextMatchOnly) */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

interface LoadingOverlayProps {
  isLoading: boolean;
  size?: 'small' | 'large';
  shape?: 'dots' | 'bar';
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  size = 'large',
  shape = 'dots',
}) => {
  if (!isLoading) {
    return null;
  }

  return (
    <OverlayContainer>
      <Activity size={size} shape={shape} />
    </OverlayContainer>
  );
};

export default LoadingOverlay;

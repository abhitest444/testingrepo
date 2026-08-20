import React from 'react';
import styled from 'styled-components';
import AnalyzingLoadingState from './AnalyzingLoadingState';

interface LoadingOverlayProps {
  isLoading: boolean;
  primaryText?: string;
  secondaryText?: string;
}

/**
 * Common loading overlay component used across all steps
 * Ensures consistent positioning and styling
 */
const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  primaryText = 'Processing',
  secondaryText = '',
}) => {
  if (!isLoading) {
    return null;
  }

  return (
    <OverlayWrapper>
      <AnalyzingLoadingState
        primaryText={primaryText}
        secondaryText={secondaryText}
      />
    </OverlayWrapper>
  );
};

const OverlayWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background-color: white;
`;

export default LoadingOverlay;

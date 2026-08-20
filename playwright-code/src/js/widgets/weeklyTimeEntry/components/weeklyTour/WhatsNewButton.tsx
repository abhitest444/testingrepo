import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { IconControl } from '@ids-ts/icon-control';
import { MapSigns } from '@design-systems/icons';
import { useIntl, useTracking } from '@payroll/quicksand';
import { useWeeklyTimeTrackingPoints } from '../../hooks/useWeeklyTimeTrackingPoints';

const IconControlWrapper = styled.div`
  display: flex;
  gap: 20px;
  padding: 10px;
  justify-content: flex-end;
  height: 56px;
  /* Remove absolute positioning since we're now in the header flow */
  z-index: 1000;

  @media screen and (max-width: 768px) {
    display: none;
  }
`;

interface WhatsNewButtonProps {
  trowserId: string;
  onTourReset?: () => void;
}

export const WhatsNewButton: React.FC<WhatsNewButtonProps> = ({
  trowserId,
  onTourReset,
}) => {
  const intl = useIntl();
  const track = useTracking();
  const trackingPoints = useWeeklyTimeTrackingPoints();
  const portalRoot = useRef(document.createElement('div'));
  const [isPortalReady, setIsPortalReady] = useState(false);

  useEffect(() => {
    const headerElement = document.querySelector(
      '[class*="TrowserHeader-headerRight"]',
    );
    if (headerElement) {
      headerElement.insertBefore(portalRoot.current, headerElement.firstChild);
      setIsPortalReady(true);
    }
  }, []);

  const handleWhatsNewClick = () => {
    track(trackingPoints.SEE_WHATS_NEW);
    // Reset tour completion and open tour
    if (onTourReset) {
      onTourReset();
    }
  };

  if (!isPortalReady) {
    return null;
  }

  return createPortal(
    <IconControlWrapper>
      <IconControl
        label={intl.formatMessage({ id: 'take.a.tour.action.label' })}
        size="medium"
        onClick={handleWhatsNewClick}
      >
        <MapSigns />
      </IconControl>
    </IconControlWrapper>,
    portalRoot.current,
  );
};

import React from 'react';
import styled from 'styled-components';
import { useTracking } from '@payroll/quicksand';
import { B3 } from '@ids-ts/typography';
import { getInitials } from 'src/js/common/MiscUtils';
import { WhoIsWorkingWorkerNode } from '../../hooks/useWhoIsWorkingLoadMore';
import { useWhosWorkingTrackingPoints } from '../../hooks/useWhosWorkingTrackingPoints';

interface WorkerMarkerProps {
  worker: WhoIsWorkingWorkerNode;
  lat: number;
  lng: number;
  isSelected?: boolean;
  onSelect?: (workerId: string) => void;
}

const MarkerContainer = styled.div<{ $isSelected: boolean }>`
  position: absolute;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: ${(props) =>
    props.$isSelected ? '2px solid #FF8000' : 'transparent'};
  background: ${(props) =>
    props.$isSelected
      ? 'radial-gradient(50% 50% at 50% 50%, #FF8000 0%, rgba(255, 255, 255, 0) 100%)'
      : 'transparent'};
`;

const MarkerButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  min-width: unset;
  border-radius: 50%;
  border: 2px solid #ffffff;
  color: #ffffff;
  cursor: pointer;
  background: #00892e;
`;

/**
 * Simple Worker Marker Component
 * Displays worker initials on the map
 * Design will be updated later
 */
export const WorkerMarker: React.FC<WorkerMarkerProps> = ({
  worker,
  isSelected = false,
  onSelect,
}) => {
  const track = useTracking();
  const trackingPoints = useWhosWorkingTrackingPoints();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    track(trackingPoints.TEAM_MEMBER_SELECT);
    if (onSelect && worker.timeForContactDAS?.id) {
      onSelect(isSelected ? '' : worker.timeForContactDAS.id);
    }
  };

  return (
    <MarkerContainer $isSelected={isSelected}>
      <MarkerButton onClick={handleClick} title={worker.displayName}>
        <B3 weight="demi">{getInitials(worker.displayName)}</B3>
      </MarkerButton>
    </MarkerContainer>
  );
};

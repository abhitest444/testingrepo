import React from 'react';
import styled from 'styled-components';
import { PointFeature, ClusterProperties } from 'supercluster';
import { useIntl } from '@payroll/quicksand';
import { B3 } from '@ids-ts/typography';

interface WorkerClusterMarkerProps {
  cluster: PointFeature<ClusterProperties>;
  count: number;
  lat: number;
  lng: number;
  isSelected?: boolean;
  onClusterClick: (cluster: PointFeature<ClusterProperties>) => void;
}

const ClusterContainer = styled.div<{ $isSelected: boolean }>`
  position: absolute;
  transform: translate(-50%, -50%);
  cursor: pointer;
  z-index: ${(props) => (props.$isSelected ? 10 : 1)};
`;

const ClusterMarker = styled.div<{ $isSelected: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #00892e;
  min-width: 40px;
  min-height: 40px;
  border-radius: 50%;
  background: #f4f4ef;
  color: #3a4f00;
  font-size: 16px;
  cursor: pointer;
`;

/**
 * Cluster Marker Component
 * Displays count of workers grouped in a cluster
 * Click to zoom in and expand the cluster
 */
export const WorkerClusterMarker: React.FC<WorkerClusterMarkerProps> = ({
  cluster,
  count,
  isSelected = false,
  onClusterClick,
}) => {
  const intl = useIntl();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClusterClick(cluster);
  };

  return (
    <ClusterContainer $isSelected={isSelected}>
      <ClusterMarker $isSelected={isSelected} onClick={handleClick}>
        <B3 weight="demi">+{count}</B3>
      </ClusterMarker>
    </ClusterContainer>
  );
};

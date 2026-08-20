import styled from 'styled-components';
import { Map as MapIcon } from '@design-systems/icons';
import { IconControl } from '@ids-ts/icon-control';

export const WorkerMapContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #d4d7dc;
  border-radius: 12px 0 0 12px;
  overflow: hidden;
`;

export const MapContainer = styled.div`
  flex: 1;
  position: relative;
`;

export const MapToggleContainer = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 1;
`;

export const MapHeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #d4d7dc;
`;

export const MapHeader = styled.div`
  display: flex;
  align-items: center;
`;

export const MapStatsContainer = styled.div`
  display: flex;
  align-items: center;
`;

export const HeaderImage = styled(MapIcon)`
  margin-right: 8px;
`;

export const ClockedInMarker = styled.div`
  height: 8px;
  width: 8px;
  border-radius: 50%;
  background: #108000;
`;

export const ClockedInCountContainer = styled.div`
  padding: 0 12px;
  line-height: normal;
  border-right: 1px solid;
`;

export const StyledIconControl = styled(IconControl)`
  margin-left: 12px;
`;

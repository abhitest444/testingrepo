import styled from 'styled-components';
import { Table } from '@ids-ts/table';

export const StyledTable = styled(Table)<{ $showGeofence?: boolean }>`
  [role='columnheader'] {
    text-transform: none !important;
    font-size: 14px;
  }

  table {
    table-layout: fixed;
    width: 100%;
    min-width: ${({ $showGeofence }) => ($showGeofence ? '860px' : '600px')};
  }

  thead tr th,
  tbody tr td {
    padding: 12px 16px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Customers/Projects */
  thead tr th:nth-child(1),
  tbody tr td:nth-child(1) {
    width: ${({ $showGeofence }) => ($showGeofence ? '22%' : '34%')};
  }

  /* Workers */
  thead tr th:nth-child(2),
  tbody tr td:nth-child(2) {
    width: ${({ $showGeofence }) => ($showGeofence ? '10%' : '18%')};
  }

  /* Time Tracking Fields */
  thead tr th:nth-child(3),
  tbody tr td:nth-child(3) {
    width: ${({ $showGeofence }) => ($showGeofence ? '14%' : '20%')};
  }

  ${({ $showGeofence }) =>
    $showGeofence
      ? `
    /* Geofence toggle */
    thead tr th:nth-child(4),
    tbody tr td:nth-child(4) {
      width: 9%;
    }

    /* Geofence Address */
    thead tr th:nth-child(5),
    tbody tr td:nth-child(5) {
      width: 25%;
    }
  `
      : ''}

  /* Actions — always last */
  thead tr th:last-child,
  tbody tr td:last-child {
    width: ${({ $showGeofence }) => ($showGeofence ? '20%' : '28%')};
    text-align: right;
    white-space: nowrap;
  }

  @media (max-width: 1024px) {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
`;

export const HeaderTable = styled(StyledTable)`
  display: flex;
  flex-direction: column;
  height: 100%;

  thead {
    display: table;
    width: 100%;
    table-layout: fixed;
    position: sticky;
    top: 0;
    z-index: 1;
  }

  tbody {
    display: block;
    overflow-y: auto;
    overflow-x: hidden;
    flex: 1;
    min-height: 0;

    tr {
      display: table;
      width: 100%;
      table-layout: fixed;

      td {
        vertical-align: middle;
      }
    }
  }
`;

export const ExpandableCell = styled(Table.Cell)<{ $hasChildren: boolean }>`
  cursor: ${({ $hasChildren }) => ($hasChildren ? 'pointer' : 'default')};

  > div {
    display: flex;
    align-items: center;
    gap: 8px;
    overflow: hidden;
  }
`;

export const CustomerName = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
`;

export const ActionsContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
`;

export const GeofenceAddress = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
`;

export const CenteredErrorContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  min-height: 200px;
`;

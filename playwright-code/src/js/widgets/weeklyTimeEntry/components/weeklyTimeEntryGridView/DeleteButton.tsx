import React from 'react';
import { Delete } from '@design-systems/icons';
import { useTracking } from '@payroll/quicksand';
import { IconControl } from '@ids-ts/icon-control';
import { useWeeklyTimeTrackingPoints } from '../../hooks/useWeeklyTimeTrackingPoints';

interface DeleteButtonProps {
  onDelete: () => void;
}

/**
 * DeleteButton Component
 * Renders a delete icon button for removing a row.
 * Handles click and keyboard events for accessibility.
 */
export const DeleteButton: React.FC<DeleteButtonProps> = ({ onDelete }) => {
  const track = useTracking();
  const trackingPoints = useWeeklyTimeTrackingPoints();
  return (
    <IconControl
      aria-label="weekly.deleterow"
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        track(trackingPoints.DELETE_ROW);
        onDelete();
      }}
      size="medium"
    >
      <Delete />
    </IconControl>
  );
};

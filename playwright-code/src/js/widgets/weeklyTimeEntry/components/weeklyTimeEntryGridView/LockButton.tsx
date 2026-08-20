import React from 'react';
import { Lock } from '@design-systems/icons';
import { IconControl } from '@ids-ts/icon-control';

interface LockButtonProps {
  onLockIconClick: () => void;
}

/**
 * LockButton Component
 * Renders a lock icon button against a row having approved time entries.
 * Handles click and keyboard events for accessibility.
 */
export const LockButton: React.FC<LockButtonProps> = ({ onLockIconClick }) => (
  <IconControl
    aria-label="weekly.lockedrow"
    onClick={(e: React.MouseEvent) => {
      e.stopPropagation();
      onLockIconClick();
    }}
    size="medium"
  >
    <Lock />
  </IconControl>
);

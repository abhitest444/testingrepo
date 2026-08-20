import React, { useState } from 'react';
import { useIntl, useTracking } from '@payroll/quicksand';
import { B3 } from '@ids-ts/typography';
import { Map as MapIcon } from '@design-systems/icons';
import { IconControl } from '@ids-ts/icon-control';
import { Menu, MenuItem } from '@ids-ts/menu';
import { getInitials } from 'src/js/common/MiscUtils';
import { WhoIsWorkingWorkerNode } from '../../hooks/useWhoIsWorkingLoadMore';
import {
  WorkerRow,
  WorkerCell,
  HoursCellContainer,
  TimeOnClock,
  ProfileAvatar,
  WorkerNameContainer,
  WorkerNameDetails,
  ProfileAvatarContainer,
  ActionButton,
} from './WorkerList.styled';
import { formatDuration, getActiveEntryDuration } from '../../utils/utils';
import { useWhosWorkingTrackingPoints } from '../../hooks/useWhosWorkingTrackingPoints';

export interface WorkerRowContentProps {
  worker: WhoIsWorkingWorkerNode;
  isSelected: boolean;
  onMapClick: (workerId: string, event: React.MouseEvent) => void;
  onEditTime: (timeEntryId: string) => void;
  onAddTime: () => void;
  onAddBreak?: () => void;
  currentUserWorkerId?: string;
  isWhoIsWorkingEditTimeEnabled?: boolean;
}

/**
 * WorkerRowContent Component
 * Renders a single worker row with name, hours, map icon, and action button.
 * Used by both WorkerListFlat and WorkerListGrouped.
 */
export const WorkerRowContent: React.FC<WorkerRowContentProps> = ({
  worker,
  isSelected,
  onMapClick,
  onEditTime,
  onAddTime,
  onAddBreak,
  currentUserWorkerId,
  isWhoIsWorkingEditTimeEnabled = true,
}) => {
  const intl = useIntl();
  const track = useTracking();
  const trackingPoints = useWhosWorkingTrackingPoints();
  const workerId = worker.timeForContactDAS?.id || '';
  const [menuOpen, setMenuOpen] = useState(false);

  // Only show map icon for workers with active time entry AND location
  const hasLocation =
    worker.activeTimeEntry &&
    worker.currentLocation &&
    worker.currentLocation.latitude &&
    worker.currentLocation.longitude;

  // Calculate time on clock from activeTimeEntry.startTime to now
  const timeOnClock = worker.activeTimeEntry?.startTime
    ? getActiveEntryDuration(worker.activeTimeEntry.startTime)
    : '--';

  // Total for the day from totalDaySeconds
  const totalToday = formatDuration(worker.totalDaySeconds);

  const handleMenuClose = () => {
    setMenuOpen(false);
  };

  const handleButtonClick = () => {
    if (worker.activeTimeEntry) {
      // Track and open edit time entry widget
      track(trackingPoints.EDIT_TIME);
      onEditTime(worker.activeTimeEntry.id);
    } else {
      // Show menu for adding time
      setMenuOpen(!menuOpen);
    }
  };

  const handleSingleTimeEntry = () => {
    track(trackingPoints.SINGLE_TIME_ENTRY);
    setMenuOpen(false);
    onAddTime();
  };

  const handleAddBreak = () => {
    track(trackingPoints.ADD_BREAK);
    setMenuOpen(false);
    onAddBreak?.();
  };

  const handleMapIconClick = (e: React.MouseEvent) => {
    track(trackingPoints.EMPLOYEE_LOCATION_MAP);
    onMapClick(workerId, e);
  };

  const canShowEditForUser =
    currentUserWorkerId === undefined ||
    workerId === currentUserWorkerId ||
    isWhoIsWorkingEditTimeEnabled;
  const showEditTimeAction = Boolean(
    worker.activeTimeEntry && canShowEditForUser,
  );
  const showAddTimeMenu = !worker.activeTimeEntry && canShowEditForUser;

  return (
    <WorkerRow key={workerId || worker.displayName}>
      <WorkerCell>
        <WorkerNameContainer>
          <ProfileAvatarContainer $isSelected={isSelected}>
            <ProfileAvatar>
              <B3 weight="demi">{getInitials(worker.displayName)}</B3>
            </ProfileAvatar>
          </ProfileAvatarContainer>
          <WorkerNameDetails>
            <B3 weight="demi">{worker.displayName}</B3>
            {(worker.activeTimeEntry?.timeAgainstContactDAS?.customer
              ?.displayName ||
              worker.activeTimeEntry?.timeAgainstContactDAS?.project
                ?.displayName) && (
              <B3>
                {worker.activeTimeEntry?.timeAgainstContactDAS?.customer
                  ?.displayName ||
                  worker.activeTimeEntry?.timeAgainstContactDAS?.project
                    ?.displayName}
              </B3>
            )}
          </WorkerNameDetails>
        </WorkerNameContainer>
      </WorkerCell>
      <WorkerCell>
        <HoursCellContainer>
          <TimeOnClock>
            <B3 weight="demi" color="#00892E">
              {timeOnClock}
            </B3>
          </TimeOnClock>
          <B3>
            {intl.formatMessage(
              { id: 'whosWorking.list.hours.today' },
              { duration: totalToday },
            )}
          </B3>
        </HoursCellContainer>
      </WorkerCell>
      <WorkerCell>
        {hasLocation && (
          <IconControl
            onClick={handleMapIconClick}
            aria-label={intl.formatMessage({
              id: isSelected
                ? 'whosWorking.list.map.deselect'
                : 'whosWorking.list.map.show',
            })}
            selected={isSelected}
            size="medium"
          >
            <MapIcon />
          </IconControl>
        )}
      </WorkerCell>
      <WorkerCell>
        {showEditTimeAction && (
          <ActionButton
            priority="tertiary"
            size="medium"
            onClick={handleButtonClick}
          >
            <B3 weight="demi">
              {intl.formatMessage({
                id: 'whosWorking.list.action.editTime',
              })}
            </B3>
          </ActionButton>
        )}
        {showAddTimeMenu && (
          <Menu
            open={menuOpen}
            onClose={handleMenuClose}
            onClickAway={handleMenuClose}
            menuOffsetDistance={8}
            anchorElement={
              <ActionButton
                priority="tertiary"
                size="medium"
                onClick={handleButtonClick}
              >
                <B3 weight="demi">
                  {intl.formatMessage({
                    id: 'whosWorking.list.action.addTime',
                  })}
                </B3>
              </ActionButton>
            }
          >
            <MenuItem
              value="singleTimeEntry"
              size="medium"
              onClick={handleSingleTimeEntry}
            >
              {intl.formatMessage({
                id: 'whosWorking.popover.singleTimeEntry',
              })}
            </MenuItem>
            <MenuItem value="addBreak" size="medium" onClick={handleAddBreak}>
              {intl.formatMessage({
                id: 'whosWorking.popover.addBreak',
              })}
            </MenuItem>
          </Menu>
        )}
      </WorkerCell>
    </WorkerRow>
  );
};

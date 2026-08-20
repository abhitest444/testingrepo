import React, { useState, useRef } from 'react';
import Button from '@ids-ts/button';
import { IconControl } from '@ids-ts/icon-control';
import { useIntl, useTracking } from '@payroll/quicksand';
import {
  Keyboard,
  Export,
  Print,
  Settings,
  MenuCollapse,
  MenuExpand,
} from '@design-systems/icons';
import styled from 'styled-components';
import { useQbTimeSdk } from 'src/js/service/hooks/useQbTimeSdk';
import { useWeeklyTimeTrackingPoints } from '../../hooks/useWeeklyTimeTrackingPoints';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  selectPanelOpen,
  selectTimeEntryTimeFor,
  selectTeamMember,
} from '../../store/selectors';
import { openPanel, closePanel } from '../../store/timeEntrySettingsSlice';
import { TeamMember } from '../../store/timeEntryGridSlice';
import {
  HeaderWrapper,
  LeftSection,
  RightSection,
  TeamMemberDropdownContainer,
} from '../../styles/WeeklyTimeEntryHeader.styles';
import { WeekNavigator } from './WeekNavigator';
import { TeamMemberDropdown } from './TeamMemberDropdown';
import { useReset } from '../../hooks/useReset';
import { useExportAndSave } from '../../hooks/useExportAndSave';

import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { WeeklyTimeEntrySettingsPanel } from '../weeklyTimeEntrySettingsPanel/WeeklyTimeEntrySettingsPanel';

const PanelIcon = styled(IconControl)`
  &.active {
    background-color: var(--color-action-passive-subtle-active);
    color: var(--color-icon-primary);
  }
`;

interface WeeklyTimeEntryHeaderProps {
  refetch?: () => void;
  onWeekChange?: (newDateRange: { start: string; end: string }) => void;
  onSettingsSaveSuccess?: () => void;
}

export const WeeklyTimeEntryHeader: React.FC<WeeklyTimeEntryHeaderProps> = ({
  refetch,
  onWeekChange,
  onSettingsSaveSuccess,
}) => {
  const dispatch = useAppDispatch();
  const intl = useIntl();
  const track = useTracking();
  const trackingPoints = useWeeklyTimeTrackingPoints();
  const isPanelOpen = useAppSelector(selectPanelOpen);

  const { data: isTeamMembersDropdownEnabled } = useQbTimeSdk<boolean>(
    (sdk) => sdk.isTeamMembersDropdownEnabled,
    {
      executeOnMount: true,
    },
  );
  const shouldShowTeamMemberField = isTeamMembersDropdownEnabled === true;

  // Use the reset hook for comprehensive reset functionality
  const { reset } = useReset();

  // Use refetch function passed as prop

  // Use the export and save hook for exporting and saving timesheet data
  const { handleExportAndSave, handlePrintAndSave, saveLoading } =
    useExportAndSave(refetch);

  const timeFor = useAppSelector(selectTimeEntryTimeFor) as TeamMember;
  const teamMember = useAppSelector(selectTeamMember);

  // State for keyboard shortcuts modal
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // State for settings panel
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Use ref for direct element reference - best performance
  const settingsGearRef = useRef<HTMLDivElement | null>(null);

  // Convert teamMember to TimeForFormState format for the dropdown
  const dropdownValue: TeamMember = teamMember
    ? {
        id: teamMember.id,
        name: teamMember.name,
        type: teamMember.type,
      }
    : timeFor;

  const togglePanel = () => {
    if (isPanelOpen) {
      dispatch(closePanel());
    } else {
      dispatch(openPanel());
    }
  };

  const handleSettingsSaveSuccess = () => {
    // Call the parent's settings save success handler
    if (onSettingsSaveSuccess) {
      onSettingsSaveSuccess();
    }
  };

  return (
    <HeaderWrapper data-testid="weekly-time-entry-header">
      <LeftSection>
        {shouldShowTeamMemberField && (
          <TeamMemberDropdownContainer>
            <TeamMemberDropdown value={dropdownValue} />
          </TeamMemberDropdownContainer>
        )}
        <WeekNavigator onWeekChange={onWeekChange} />
        <Button
          priority="secondary"
          purpose="passive"
          onClick={() => {
            track(trackingPoints.RESET_FORM_STATE);
            reset();
          }}
        >
          {intl.formatMessage({ id: 'weekly.time.entry.reset' })}
        </Button>
      </LeftSection>
      <RightSection>
        <IconControl
          aria-label={intl.formatMessage({
            id: 'weekly.time.entry.keyboard.shortcuts',
          })}
          onClick={() => setShortcutsOpen(true)}
        >
          <Keyboard />
        </IconControl>
        <IconControl
          aria-label={intl.formatMessage({ id: 'weekly.time.entry.export' })}
          onClick={() => {
            track(trackingPoints.EXPORT);
            handleExportAndSave();
          }}
          disabled={saveLoading}
        >
          <Export />
        </IconControl>
        <IconControl
          aria-label={intl.formatMessage({ id: 'weekly.time.entry.print' })}
          onClick={() => {
            track(trackingPoints.PRINT);
            handlePrintAndSave();
          }}
          disabled={saveLoading}
        >
          <Print />
        </IconControl>
        <div ref={settingsGearRef}>
          <IconControl
            aria-label={intl.formatMessage({
              id: 'weekly.time.entry.settings',
            })}
            id="weekly-time-entry-settings-gear"
            onClick={() => {
              track(trackingPoints.SETTINGS_GEAR);
              setSettingsOpen(true);
            }}
          >
            <Settings />
          </IconControl>
        </div>
        <PanelIcon
          aria-label={
            isPanelOpen
              ? intl.formatMessage({ id: 'weekly.time.entry.hide.panel' })
              : intl.formatMessage({ id: 'weekly.time.entry.show.panel' })
          }
          onClick={togglePanel}
          className={isPanelOpen ? 'active' : ''}
        >
          {isPanelOpen ? <MenuCollapse /> : <MenuExpand />}
        </PanelIcon>
      </RightSection>
      <KeyboardShortcutsModal
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
      <WeeklyTimeEntrySettingsPanel
        open={settingsOpen}
        setOpen={setSettingsOpen}
        onSaveSuccess={handleSettingsSaveSuccess}
        targetElement={settingsGearRef.current}
      />
    </HeaderWrapper>
  );
};

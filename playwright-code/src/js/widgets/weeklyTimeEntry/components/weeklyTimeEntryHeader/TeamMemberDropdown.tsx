import React, { useEffect, useRef } from 'react';
import Widget from 'web-shell-core/widgets/HOCWidget';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import GuidanceTooltip from '@ids-ts/guidance-tooltip';
import { QuickbooksOnlineSandbox } from '@appfabric/sandbox-spec';
import { normalizeTimeForType } from 'src/js/widgets/common/addTimeFormComponents/TeamMember';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';
import { useWeeklyTimeTrackingPoints } from '../../hooks/useWeeklyTimeTrackingPoints';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  setTeamMember,
  TeamMember,
  toggleSelectTeamMemberTooltip,
  setTeamMemberDropdownReady,
} from '../../store/timeEntryGridSlice';
import {
  clearValidationError,
  clearSaveError,
  clearTimeEntriesError,
  clearSettingsError,
} from '../../store/validationSlice';
import {
  selectShowSelectTeamMemberTooltip,
  selectQuickFindEnabled,
  selectQuickFindSettled,
} from '../../store/selectors';
import { TimeForType, WidgetChangeEvent } from '../../types';
import { DropdownOverlayContainer } from '../../styles/WeeklyTimeEntry.styles';
import { DataAccess_ContactType } from '../../../../../__generated__/oigql/graphql';

interface TeamMemberDropdownProps {
  value: TeamMember | null;
}

/**
 * A dropdown component for selecting a team member.
 *
 * @example
 * <TeamMemberDropdown value={{ id: 'emp123', name: 'John Doe', type: 'employee' }} />
 *
 * @param {TeamMember | null} value - The currently selected team member, or null if none.
 * @returns {React.ReactElement} A dropdown widget
 */
export const TeamMemberDropdown: React.FC<TeamMemberDropdownProps> = ({
  value,
}) => {
  const dispatch = useAppDispatch();
  const intl = useIntl();
  const track = useTracking();
  const trackingPoints = useWeeklyTimeTrackingPoints();
  const teamMemberWidgetContainerRef = useRef<HTMLDivElement>(null);
  const widgetOnReadyFired = useRef(false);
  const showSelectTeamMemberTooltip = useAppSelector(
    selectShowSelectTeamMemberTooltip,
  );
  const sandbox = useSandbox();
  // Check if current user is in workforce
  const isWorkforceUser = isWorkforceEnvironment(
    sandbox as QuickbooksOnlineSandbox,
  );

  // Get feature flag values from Redux store
  const isQuickFindEnabled = useAppSelector(selectQuickFindEnabled);
  const isQuickFindSettled = useAppSelector(selectQuickFindSettled);

  const handleChange = (e: WidgetChangeEvent | any) => {
    // Handle case where QuickFind passes the contact object directly (normalize type so job costing runs)
    if (e && e.id && e.name !== undefined) {
      const teamMember: TeamMember = {
        id: e.id,
        name: e.name ?? '',
        type: normalizeTimeForType(e.type),
      };
      dispatch(setTeamMember(teamMember));
      dispatch(clearValidationError());
      dispatch(clearSaveError());
      dispatch(clearTimeEntriesError());
      dispatch(clearSettingsError());
      return;
    }

    // Handle case where it's a WidgetChangeEvent (legacy format)
    const selected = e?.selectedItem;

    if (!selected || !selected?.contact) {
      return;
    }

    // Track Team Member Dropdown Click Only if selection is valid
    track(trackingPoints.TEAM_MEMBER);
    const { contact } = selected;
    const teamMember: TeamMember = {
      id: contact.id,
      name: contact.displayName || contact.fullName || selected.label || '',
      type: normalizeTimeForType(contact.type),
    };
    dispatch(setTeamMember(teamMember));
    dispatch(clearValidationError());
    dispatch(clearSaveError());
    dispatch(clearTimeEntriesError());
    dispatch(clearSettingsError());
  };

  const handleTooltipClose = () => {
    dispatch(toggleSelectTeamMemberTooltip(false));
  };

  return (
    <DropdownOverlayContainer>
      <div
        ref={teamMemberWidgetContainerRef}
        data-testid="weekly-team-member-dropdown"
        aria-label="weekly-team-member-dropdown"
      >
        {(isQuickFindEnabled && isQuickFindSettled) || isWorkforceUser ? (
          <Widget
            widgetId="time-tracking-ui/quickFind"
            dropdownType="team-member"
            width="100%"
            subTypes={[
              DataAccess_ContactType.Employee,
              DataAccess_ContactType.Vendor,
            ]}
            addNew={!isWorkforceUser}
            onChange={(_: string, item: any) => {
              handleChange(item);
            }}
            value={value?.id || ''}
            displayName={value?.name}
            onReady={() => {
              // Set team member dropdown ready state for tour functionality
              dispatch(setTeamMemberDropdownReady(true));
              if (!widgetOnReadyFired.current && !value?.id) {
                // The onReady callback fires multiple times:
                // 1. On initial widget load
                // 2. On first user interaction
                // 3. On browser close (if no interaction occurred)
                // We track the first occurrence to show the tooltip only once,
                // preventing it from reappearing after a user has dismissed it.
                widgetOnReadyFired.current = true;
                dispatch(toggleSelectTeamMemberTooltip(true));
              }
            }}
            label={intl.formatMessage({
              id: 'weekly.time.entry.team.member',
            })}
          />
        ) : (
          <Widget
            widgetId="qbo-quickfills-ui/quickfills"
            addNew={!isWorkforceUser}
            shouldShowSubLabel
            type="contact"
            subTypes={['employee', 'vendor']}
            value={value?.id || ''}
            onChange={(e: WidgetChangeEvent) => {
              handleChange(e);
            }}
            autoFocus
            onReady={() => {
              // Set team member dropdown ready state for tour functionality
              dispatch(setTeamMemberDropdownReady(true));
              if (!widgetOnReadyFired.current && !value?.id) {
                // The onReady callback fires multiple times:
                // 1. On initial widget load
                // 2. On first user interaction
                // 3. On browser close (if no interaction occurred)
                // We track the first occurrence to show the tooltip only once,
                // preventing it from reappearing after a user has dismissed it.
                widgetOnReadyFired.current = true;
                dispatch(toggleSelectTeamMemberTooltip(true));
              }
            }}
            label={intl.formatMessage({ id: 'weekly.time.entry.team.member' })}
            displayType={value?.type}
            excludePayrollInactiveEmployees
          />
        )}
      </div>
      <GuidanceTooltip
        targetElement={teamMemberWidgetContainerRef.current}
        dismissible
        title={intl.formatMessage({
          id: 'weekly.time.entry.team.member.tooltip.title',
        })}
        open={showSelectTeamMemberTooltip}
        message={intl.formatMessage({
          id: 'weekly.time.entry.team.member.tooltip.message',
        })}
        onClose={handleTooltipClose}
        position="bottom"
        alignment="left"
        enableClickAway
      />
    </DropdownOverlayContainer>
  );
};

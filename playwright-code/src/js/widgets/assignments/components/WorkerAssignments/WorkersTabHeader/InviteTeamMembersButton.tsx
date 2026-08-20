import React, { useCallback } from 'react';
import { useSandbox } from '@payroll/quicksand';
import Widget from 'web-shell-core/widgets/HOCWidget';

/**
 * Renders the "Invite team members" button by mounting the
 * `timecapture-timecenter-ui/inviteTeamMembers` widget.
 *
 * That widget is self-contained: it renders both the button and the invite
 * trowser (the `invite_employees` WINC), so this wrapper only has to mount it
 */
export const InviteTeamMembersButton: React.FC = () => {
  const sandbox = useSandbox();

  // Memoize so a re-render doesn't hand HOCWidget a fresh onReady reference,
  // which would re-fire the "mounted" log and produce duplicate Splunk events.
  const handleReady = useCallback(() => {
    sandbox.logger.info(
      'Component="InviteTeamMembersButton" Event="Invite team members widget mounted"',
    );
  }, [sandbox]);

  return (
    <Widget
      widgetId="timecapture-timecenter-ui/inviteTeamMembers"
      sandbox={sandbox}
      onReady={handleReady}
    />
  );
};

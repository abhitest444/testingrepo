import React, { useCallback } from 'react';
import styled from 'styled-components';
import Button from '@ids-ts/button';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';
import { NAVIGATION_ROUTES } from '../constants';
import { useProjectsSdkFlags } from '../hooks/useProjectsSdkFlags';
import { useLandingPageTrackingPoints } from '../hooks/useLandingPageTrackingPoints';

const HeaderContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  flex-shrink: 0;
`;

interface TimeProjectHeaderProps {
  // Optional anchor ref used by the Time Projects walkthrough so the
  // "Looking to manage project costs?" tooltip can attach to the button.
  // We wrap the IDS Button in a `<span>` so the ref always lands on a
  // plain DOM node — IDS components don't reliably forward refs to their
  // underlying <button> across versions.
  manageProjectsButtonRef?: React.Ref<HTMLSpanElement>;
}

const ManageProjectsAnchor = styled.span`
  display: inline-flex;
`;

const TimeProjectHeader: React.FC<TimeProjectHeaderProps> = ({
  manageProjectsButtonRef,
}) => {
  const intl = useIntl();
  const sandbox = useSandbox();
  const track = useTracking();
  const text = (id: string) => intl.formatMessage({ id });
  const { isProjectsManageProjectsEnabled } = useProjectsSdkFlags();
  const trackingPoints = useLandingPageTrackingPoints();
  const isWorkforceUser = isWorkforceEnvironment(sandbox);
  const handleManageProjects = useCallback(() => {
    track(trackingPoints.CLICK_MANAGE_PROJECTS);
    try {
      sandbox.navigation.navigate(NAVIGATION_ROUTES.MANAGE_PROJECTS);
    } catch (err) {
      sandbox.logger.error(
        'Component=TimeProjectHeader Event=Navigation to manage projects failed',
        { error: err },
      );
    }
  }, [sandbox, track, trackingPoints]);

  if (isProjectsManageProjectsEnabled !== true || isWorkforceUser) {
    return null;
  }

  return (
    <HeaderContainer>
      <ManageProjectsAnchor
        ref={manageProjectsButtonRef}
        data-testid="time-project-manage-projects-anchor"
      >
        <Button
          priority="secondary"
          purpose="standard"
          onClick={handleManageProjects}
          data-testid="time-project-manage-projects-button"
        >
          {text('timeProject.button.manageProjects')}
        </Button>
      </ManageProjectsAnchor>
    </HeaderContainer>
  );
};

export default TimeProjectHeader;

import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { useIntl, useSandbox } from '@payroll/quicksand';
import Typography from '@ids-ts/typography';
import PageMessage from '@ids-ts/page-message';
import '@payroll-shared-components/payroll-settings-section/dist/main.css';
import SettingsSection from '@payroll-shared-components/payroll-settings-section';

import Widget from 'web-shell-core/widgets/HOCWidget';
import { useRenderTitleWithBadge } from 'src/js/hooks/useRenderTitleWithBadge';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import { useOvertimeTourSteps } from 'src/js/widgets/qbtOrchestrator/features/overtime/utils/overtimeTourSteps';

import {
  DEEP_LINK_NAVIGATION_EVENTS,
  SECTION_READY_EVENT,
  SECTION_READY_KEYS,
} from 'src/js/common/constants';
import {
  setShowLandingPage,
  setShowPolicyDetails,
  setShowWizard,
  setWizardCurrentStep,
  setSelectedPolicyId,
  resetOvertimeState,
} from '../store';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { selectShowLandingPage } from '../store/overtimeSelectors';
import { OVERTIME_LOGGING } from '../constants/overtimeLoggingConstants';
import { OVERTIME_URLS } from '../constants/overtimeTableConstants';
import OvertimeLandingPageTrowserContainer from './OvertimeLandingPageTrowserContainer';
import { OvertimeInitialViewOptions } from '../types/Overtime.types';

interface IOvertimeSettingsHandle {
  newBadgeVisibleTillDate?: string;
  isEditable?: boolean;
  /** Initial view for deep-linking navigation */
  initialView?: OvertimeInitialViewOptions | null;
}

const ViewContentColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`;

const GuidanceLink = styled.a`
  color: var(--color-link-text, #205ea3);
`;

/**
 * Push the guided modal and its backdrop above the IDS Trowser layer.
 * The Trowser increments the shared zIndexManager on open, so the modal's
 * default z-index ends up below the trowser backdrop.
 */
const GuidedModalZIndexFix = createGlobalStyle`
  .guided-tour-modal--overtime-settings-handle-tour {
    z-index: 99999 !important;
  }
`;

const OvertimeSettingsHandle: React.FC<IOvertimeSettingsHandle> = ({
  newBadgeVisibleTillDate,
  isEditable,
  initialView,
}) => {
  const intl = useIntl();
  const logger = useLoggingConfig();
  const dispatch = useAppDispatch();
  const sandbox = useSandbox();
  const [infoBannerOpen, setInfoBannerOpen] = useState(true);
  const initialViewProcessedRef = useRef(false);
  const sectionReadyPublishedRef = useRef(false);

  // Publish section ready event on mount
  useEffect(() => {
    if (!sectionReadyPublishedRef.current) {
      sectionReadyPublishedRef.current = true;
      sandbox.logger.info(
        'Component=OvertimeSettingsHandle Event=SECTION_READY section=OVERTIME',
      );
      sandbox.pubsub.publish(SECTION_READY_EVENT, {
        section: SECTION_READY_KEYS.OVERTIME,
      });
    }
  }, [sandbox]);

  const isLandingPageOpen = useAppSelector(selectShowLandingPage);
  const overtimeTourSteps = useOvertimeTourSteps();

  // Guided tooltip state - controlled by onComplete callback from TourFramework
  const [showGuidedToolTip, setShowGuidedToolTip] = useState<boolean>(false);

  // Handle tour completion status from TourFramework
  const handleTourReady = useCallback(
    (status: { isCompleted: boolean; isLoading?: boolean }) => {
      if (status.isLoading) {
        return;
      }
      // Show tour if not already completed, hide if completed
      setShowGuidedToolTip(!status.isCompleted);
    },
    [],
  );

  // Log component mount
  useEffect(() => {
    logger.info(OVERTIME_LOGGING.SETTINGS_HANDLE_MOUNTED, {
      isEditable,
      hasBadge: !!newBadgeVisibleTillDate,
    });
  }, [logger, isEditable, newBadgeVisibleTillDate]);

  // Handle initial view for deep-linking
  useEffect(() => {
    if (!initialView || initialViewProcessedRef.current) return undefined;

    initialViewProcessedRef.current = true;

    logger.info(
      'Plugin=time-tracking-ui Component=OvertimeSettingsHandle Event=DEEP_LINK_NAVIGATION',
      {
        view: initialView.view,
        policyId: initialView.policyId || 'none',
        wizardStep: initialView.wizardStep || 'none',
      },
    );

    // Always open the trowser first
    dispatch(setShowLandingPage(true));

    // Notify parent that deep-link navigation is complete
    sandbox.pubsub.publish(DEEP_LINK_NAVIGATION_EVENTS.COMPLETE, {});

    // Handle specific views after a brief delay to ensure trowser content is ready
    const timer = setTimeout(() => {
      switch (initialView.view) {
        case 'details':
        case 'edit':
        case 'assign':
          // For details/edit/assign, navigate to policy details
          // The user can initiate edit/assign from there which has full policy context
          if (initialView.policyId) {
            dispatch(setSelectedPolicyId(initialView.policyId));
            dispatch(setShowPolicyDetails(true));
          }
          break;

        case 'wizard':
          // Open wizard in create mode
          dispatch(setShowWizard({ show: true }));
          if (initialView.wizardStep) {
            dispatch(setWizardCurrentStep(initialView.wizardStep));
          }
          break;

        case 'list':
        default:
          // Just show the list (trowser is already open)
          break;
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [initialView, dispatch, logger, sandbox]);

  const title = useRenderTitleWithBadge(
    intl.formatMessage({ id: 'time-entries.section.title.overtime' }),
    true,
    newBadgeVisibleTillDate,
  );

  const handleQualifiedOvertimeGuidanceClick = () => {
    logger.info(OVERTIME_LOGGING.SETTINGS_HANDLE_GUIDANCE_CLICKED);
  };

  const handleEdit = () => {
    logger.info(OVERTIME_LOGGING.SETTINGS_HANDLE_EDIT_CLICKED);
    dispatch(setShowLandingPage(true));
  };

  const handleClose = () => {
    dispatch(setShowLandingPage(false));
  };

  // Reset overtime state on unmount to ensure clean state on navigation
  useEffect(
    () => () => {
      dispatch(resetOvertimeState());
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [], // cleanup-only effect, dispatch is stable
  );

  return (
    <>
      <SettingsSection
        mode="VIEW"
        readonly={!isEditable}
        saveButtonText=""
        cancelButtonText=""
        editIconAriaLabel={intl.formatMessage({ id: 'edit' })}
        id="overtime-settings-handle"
        title={title}
        viewContent={
          <ViewContentColumn>
            {infoBannerOpen ? (
              <PageMessage
                type="discovery"
                open
                dismissible
                automationId="overtime-qualified-overtime-tracking-banner"
                onClose={() => setInfoBannerOpen(false)}
              >
                <Typography variant="body-3" as="span">
                  {intl.formatMessage({
                    id: 'overtime.settings.qualifiedOvertimeTracking.banner.prefix',
                  })}{' '}
                  <Typography variant="body-3" weight="demi" as="span">
                    {intl.formatMessage({
                      id: 'overtime.settings.qualifiedOvertimeTracking.banner.emphasis',
                    })}
                  </Typography>{' '}
                  {intl.formatMessage({
                    id: 'overtime.settings.qualifiedOvertimeTracking.banner.suffix',
                  })}{' '}
                  <GuidanceLink
                    href={OVERTIME_URLS.LEARN_MORE}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleQualifiedOvertimeGuidanceClick}
                  >
                    {intl.formatMessage({
                      id: 'overtime.settings.qualifiedOvertimeTracking.banner.guidance',
                    })}
                  </GuidanceLink>
                </Typography>
              </PageMessage>
            ) : null}
            <Typography variant="body-3">
              {intl.formatMessage({
                id: 'time-entries.section.overtime.manage',
                defaultMessage: 'Manage overtime policies for your team',
              })}
            </Typography>
          </ViewContentColumn>
        }
        onEdit={handleEdit}
      />
      <OvertimeLandingPageTrowserContainer onClose={handleClose} />

      {/* Guided Tour Widget - TourFramework handles completion check internally */}
      {isLandingPageOpen && (
        <>
          <GuidedModalZIndexFix />
          <Widget
            key="time-tracking-ui/TourFramework-overtime"
            widgetId="time-tracking-ui/TourFramework"
            data-testid="guided-modal-overtime-widget"
            tourId="overtime-settings-handle-tour"
            open={showGuidedToolTip}
            steps={overtimeTourSteps}
            mode="modal"
            onClose={() => {
              sandbox.logger.info(
                '[OvertimeSettingsHandleTour] User closed tooltip',
              );
              setShowGuidedToolTip(false);
            }}
            onComplete={handleTourReady}
          />
        </>
      )}
    </>
  );
};

export default OvertimeSettingsHandle;

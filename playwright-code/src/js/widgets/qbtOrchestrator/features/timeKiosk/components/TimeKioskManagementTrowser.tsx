import React, { useCallback, useEffect } from 'react';
import Trowser from '@ids-ts/trowser';
import Button from '@ids-ts/button';
import { B2, H3 } from '@ids-ts/typography';
import { useIntl } from '@payroll/quicksand';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import { TimeEntryNumberField } from 'src/js/service/hooks/settings/useGetQLSettings';

import { SuccessToast } from 'src/js/widgets/common/SuccessToast';
import { TIME_KIOSK_LOGGING } from '../constants/timeKioskLoggingConstants';
import {
  DescriptionBlock,
  HeaderSection,
  PageContent,
  TrowserMainContent,
} from '../styles/TimeKioskManagementTrowser.styled';
import { useAppDispatch } from '../../../store/hooks';
import { hydrateKioskSettings, setKioskSettingsLoading } from '../store';
import { INACTIVITY_TIMEOUT } from '../constants/timeKioskConstants';
import { useKioskUi } from '../store/hooks';
import KioskDevicesToolbar from './KioskDevicesToolbar';
import KioskSettingsModalsContainer from './KioskSettingsModalsContainer';

export interface TimeKioskManagementTrowserProps {
  onClose?: () => void;
  open?: boolean;
  inactivityTimeout?: TimeEntryNumberField;
  isQLSettingsLoading?: boolean;
}

export const TimeKioskManagementTrowser: React.FC<
  TimeKioskManagementTrowserProps
> = ({ onClose, open, inactivityTimeout, isQLSettingsLoading }) => {
  const intl = useIntl();
  const logger = useLoggingConfig();
  const { toast, hideToast, resetUi } = useKioskUi();
  const dispatch = useAppDispatch();

  // Hydrate kiosk settings into Redux from QL settings when the component mounts.
  useEffect(() => {
    dispatch(setKioskSettingsLoading(isQLSettingsLoading ?? false));
    if (isQLSettingsLoading || !inactivityTimeout) {
      return;
    }
    dispatch(
      hydrateKioskSettings({
        inactivityTimeoutSeconds:
          inactivityTimeout.value ?? INACTIVITY_TIMEOUT.DEFAULT_SECONDS,
        inactivityTimeoutVersion: inactivityTimeout.version,
      }),
    );
  }, [dispatch, inactivityTimeout, isQLSettingsLoading]);

  const handleClose = useCallback(() => {
    logger.info(TIME_KIOSK_LOGGING.FEATURE_CLOSED, {
      surface: 'kiosk-management-trowser',
    });
    // Clear any open modal/drawer/toast so nothing lingers on reopen.
    resetUi();
    onClose?.();
  }, [logger, onClose, resetUi]);

  const chromeTitle = intl.formatMessage({
    id: 'timeKiosk.title',
    defaultMessage: 'Kiosk management',
  });

  const pageTitle = intl.formatMessage({
    id: 'timeKiosk.management.trowser.title',
    defaultMessage: 'Manage your time kiosks',
  });

  return (
    <Trowser
      dismissible
      open={open}
      onClose={handleClose}
      title={chromeTitle}
      data-testid="time-kiosk-management-trowser"
      automationId="time-kiosk-management-trowser"
      footerButton={[
        <Button
          key="done-button"
          priority="primary"
          // TODO: to be updated once handleDone() is implemented
          onClick={handleClose}
          data-testid="time-kiosk-management-done-button"
        >
          {intl.formatMessage({
            id: 'timeKiosk.management.trowser.done',
            defaultMessage: 'Done',
          })}
        </Button>,
      ]}
    >
      <TrowserMainContent>
        <PageContent>
          <HeaderSection>
            <H3 weight="demi">{pageTitle}</H3>
            <DescriptionBlock>
              <B2 weight="regular">
                {intl.formatMessage({
                  id: 'timeKiosk.management.trowser.description',
                  defaultMessage:
                    'Authorize any internet-connected computer or tablet as a kiosk to allow multiple workers to quickly clock in and out from one device.',
                })}
              </B2>
              <B2 weight="regular">
                {intl.formatMessage({
                  id: 'timeKiosk.management.trowser.pinNote',
                  defaultMessage: 'Kiosk users can set up their own PIN.',
                })}
              </B2>
            </DescriptionBlock>
          </HeaderSection>

          <KioskDevicesToolbar />
        </PageContent>
      </TrowserMainContent>

      <KioskSettingsModalsContainer />

      {/* Shared success toast for kiosk actions (inactivity timeout today,
          location recording later — each supplies its own message). Rendered
          unconditionally; `open` controls visibility (no-ops when closed). */}
      <SuccessToast
        message={toast.message}
        open={toast.open}
        onClose={hideToast}
      />
    </Trowser>
  );
};

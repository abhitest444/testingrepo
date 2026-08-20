import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useIntl, useSandbox } from '@payroll/quicksand';
import Typography from '@ids-ts/typography';
import '@payroll-shared-components/payroll-settings-section/dist/main.css';
import SettingsSection from '@payroll-shared-components/payroll-settings-section';

import {
  SECTION_READY_EVENT,
  SECTION_READY_KEYS,
} from 'src/js/common/constants';
import { useRenderTitleWithBadge } from 'src/js/hooks/useRenderTitleWithBadge';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';

import { TimeEntryNumberField } from 'src/js/service/hooks/settings/useGetQLSettings';
import { TimeKioskManagementTrowser } from './TimeKioskManagementTrowser';
import { TIME_KIOSK_LOGGING } from '../constants/timeKioskLoggingConstants';

export interface TimeKioskSettingsHandleProps {
  isEditable?: boolean;
  isNewBadgeVisibleTillDate?: string;
  inactivityTimeout?: TimeEntryNumberField;
  isQLSettingsLoading?: boolean;
}

const TimeKioskSettingsHandle: React.FC<TimeKioskSettingsHandleProps> = ({
  isEditable = true,
  isNewBadgeVisibleTillDate,
  inactivityTimeout,
  isQLSettingsLoading,
}) => {
  const intl = useIntl();
  const sandbox = useSandbox();
  const logger = useLoggingConfig();
  const [isTrowserOpen, setIsTrowserOpen] = useState(false);
  const sectionReadyPublishedRef = useRef(false);

  const title = useRenderTitleWithBadge(
    intl.formatMessage({
      id: 'timeKiosk.title',
      defaultMessage: 'Kiosk management',
    }),
    true,
    isNewBadgeVisibleTillDate,
  );

  useEffect(() => {
    if (!sectionReadyPublishedRef.current) {
      sectionReadyPublishedRef.current = true;
      sandbox.logger.info(
        'Component=TimeKioskSettingsHandle Event=SECTION_READY section=KIOSK',
      );
      sandbox.pubsub.publish(SECTION_READY_EVENT, {
        section: SECTION_READY_KEYS.KIOSK,
      });
    }
  }, [sandbox]);

  const handleEdit = useCallback(() => {
    if (!isEditable) {
      return;
    }
    logger.info(TIME_KIOSK_LOGGING.SETTINGS_HANDLE_EDIT_CLICKED);
    setIsTrowserOpen(true);
  }, [isEditable, logger]);

  const handleCloseTrowser = useCallback(() => {
    setIsTrowserOpen(false);
  }, []);

  return (
    <>
      <SettingsSection
        mode="VIEW"
        readonly={!isEditable}
        saveButtonText=""
        cancelButtonText=""
        editIconAriaLabel={intl.formatMessage({ id: 'edit' })}
        id="time-kiosk-settings-handle"
        title={title}
        viewContent={
          <Typography variant="body-3">
            {intl.formatMessage({
              id: 'timeKiosk.settingsHandle.description',
              defaultMessage:
                'Add or remove computers or tablets your team uses to clock in and out',
            })}
          </Typography>
        }
        onEdit={handleEdit}
      />
      <TimeKioskManagementTrowser
        open={isTrowserOpen}
        onClose={handleCloseTrowser}
        inactivityTimeout={inactivityTimeout}
        isQLSettingsLoading={isQLSettingsLoading}
      />
    </>
  );
};

export default TimeKioskSettingsHandle;

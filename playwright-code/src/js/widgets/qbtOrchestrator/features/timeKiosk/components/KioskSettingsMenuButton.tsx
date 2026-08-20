/**
 * KioskSettingsMenuButton — kiosk settings actions dropdown.
 * =============================================================================
 * IDS DropdownButton (chevron + menu) that hosts kiosk company-level actions:
 * "Edit inactivity timeout" and "Edit location recording", each opening its
 * own modal via Redux UI state.
 */
import React, { useCallback } from 'react';
import DropdownButton, { MenuItem } from '@ids-ts/dropdown-button';
import { useIntl } from '@payroll/quicksand';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';

import { useAppSelector } from '../../../store/hooks';
import { useKioskUi } from '../store/hooks';
import { KioskModalType } from '../types/TimeKiosk.types';
import { TIME_KIOSK_LOGGING } from '../constants/timeKioskLoggingConstants';
import { KIOSK_MENU_ITEM_VALUE } from '../constants/timeKioskConstants';
import { selectKioskSettingsLoading } from '../store';

const KioskSettingsMenuButton: React.FC = () => {
  const intl = useIntl();
  const logger = useLoggingConfig();
  const { openModal } = useKioskUi();
  // Settings haven't hydrated from the server yet — block opening the modal so
  // a save can't overwrite the real value/version with the seeded default.
  const isLoading = useAppSelector(selectKioskSettingsLoading);

  // Dropdown trigger label. The menu hosts the individual kiosk actions.
  const buttonLabel = intl.formatMessage({
    id: 'timeKiosk.management.actions.menuButton',
    defaultMessage: 'Kiosk settings',
  });

  const inactivityTimeoutLabel = intl.formatMessage({
    id: 'timeKiosk.management.actions.editInactivityTimeout',
    defaultMessage: 'Edit inactivity timeout',
  });

  const locationRecordingLabel = intl.formatMessage({
    id: 'timeKiosk.management.actions.editLocationRecording',
    defaultMessage: 'Edit location recording',
  });

  const handleSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;
      if (value === KIOSK_MENU_ITEM_VALUE.INACTIVITY_TIMEOUT) {
        // TODO: track event — edit inactivity timeout menu selected
        logger.info(TIME_KIOSK_LOGGING.EDIT_INACTIVITY_TIMEOUT_BUTTON_CLICKED);
        openModal(KioskModalType.INACTIVITY_TIMEOUT);
      } else if (value === KIOSK_MENU_ITEM_VALUE.LOCATION_RECORDING) {
        // TODO: track event — edit location recording menu selected
        logger.info(TIME_KIOSK_LOGGING.EDIT_LOCATION_RECORDING_BUTTON_CLICKED);
        openModal(KioskModalType.LOCATION_RECORDING);
      }
    },
    [logger, openModal],
  );

  return (
    <DropdownButton
      buttonPriority="secondary"
      buttonPurpose="standard"
      label={buttonLabel}
      // disable the button if the settings data is still syncing with kiosk slice
      disabled={isLoading}
      // @ts-expect-error - onSelect passes a synthetic change event (repo pattern)
      onSelect={handleSelect}
      aria-label={buttonLabel}
      data-testid="kiosk-settings-menu-button"
    >
      <MenuItem value={KIOSK_MENU_ITEM_VALUE.INACTIVITY_TIMEOUT}>
        {inactivityTimeoutLabel}
      </MenuItem>
      <MenuItem value={KIOSK_MENU_ITEM_VALUE.LOCATION_RECORDING}>
        {locationRecordingLabel}
      </MenuItem>
    </DropdownButton>
  );
};

export default KioskSettingsMenuButton;

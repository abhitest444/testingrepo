/**
 * KioskDevicesToolbar — device management actions and search.
 * =============================================================================
 * Toolbar above the kiosk devices grid: "Use this computer", company-level
 * kiosk settings menu, "Add a device", and device search. Handlers are stubs
 * until device APIs land (QUANTA-13509).
 */
import React, { useCallback, useState } from 'react';
import Button from '@ids-ts/button';
import { Plus } from '@design-systems/icons';
import { useIntl } from '@payroll/quicksand';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import { SearchField } from 'src/js/widgets/common/SearchField';

import { TIME_KIOSK_LOGGING } from '../constants/timeKioskLoggingConstants';
import KioskSettingsMenuButton from './KioskSettingsMenuButton';
import {
  ToolbarActionsRow,
  ToolbarSearchRow,
  ToolbarSearchWrap,
  ToolbarSection,
} from '../styles/TimeKioskManagementTrowser.styled';

const KioskDevicesToolbar: React.FC = () => {
  const intl = useIntl();
  const logger = useLoggingConfig();
  const [searchTerm, setSearchTerm] = useState('');

  const useThisComputerLabel = intl.formatMessage({
    id: 'timeKiosk.management.actions.useThisComputer',
    defaultMessage: 'Use this computer',
  });

  const addDeviceLabel = intl.formatMessage({
    id: 'timeKiosk.management.actions.addDevice',
    defaultMessage: 'Add a device',
  });

  const searchPlaceholder = intl.formatMessage({
    id: 'timeKiosk.management.devices.search.placeholder',
    defaultMessage: 'Search',
  });

  const searchLabel = intl.formatMessage({
    id: 'timeKiosk.management.devices.search.label',
    defaultMessage: 'Search devices',
  });

  const handleUseThisComputer = useCallback(() => {
    logger.info(TIME_KIOSK_LOGGING.USE_THIS_COMPUTER_BUTTON_CLICKED);
    // TODO: wire use-this-computer flow when API is ready
  }, [logger]);

  const handleAddDevice = useCallback(() => {
    logger.info(TIME_KIOSK_LOGGING.ADD_DEVICE_BUTTON_CLICKED);
    // TODO: wire add-device flow when API is ready
  }, [logger]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    // TODO: filter device list when API/search is ready
  }, []);

  return (
    <ToolbarSection data-testid="kiosk-devices-toolbar">
      {/* ToolbarActionsRow is the row that contains the buttons for the kiosk devices toolbar */}
      <ToolbarActionsRow>
        <Button
          priority="secondary"
          purpose="standard"
          size="medium"
          onClick={handleUseThisComputer}
          data-testid="kiosk-use-this-computer-button"
        >
          {useThisComputerLabel}
        </Button>
        <KioskSettingsMenuButton />
        <Button
          priority="primary"
          purpose="standard"
          size="medium"
          onClick={handleAddDevice}
          data-testid="kiosk-add-device-button"
        >
          <Plus />
          {addDeviceLabel}
        </Button>
      </ToolbarActionsRow>

      {/* ToolbarSearchRow is the row that contains the search field to search all the kiosk devices */}
      <ToolbarSearchRow>
        <ToolbarSearchWrap>
          <SearchField
            value={searchTerm}
            onChange={handleSearchChange}
            label={searchLabel}
            placeholder={searchPlaceholder}
            alwaysExpanded
            debounceMs={300}
          />
        </ToolbarSearchWrap>
      </ToolbarSearchRow>
    </ToolbarSection>
  );
};

export default KioskDevicesToolbar;

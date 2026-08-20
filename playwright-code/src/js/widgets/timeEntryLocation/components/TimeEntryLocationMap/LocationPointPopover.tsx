import React from 'react';
import styled from 'styled-components';
import { Popover, PopoverContent, PopoverHeader } from '@ids-ts/popover';
import { B3 } from '@ids-ts/typography';
import Chip from '@ids-ts/chip';
import { useIntl } from '@payroll/quicksand';
import { TimeTracking_LocationTrackingType } from 'src/__generated__/timeTracking/graphql';
import { DEVICE_FLAG_LABEL_NLS_ID, LocationPointData } from '../types';
import { getActiveDeviceFlagKeys } from '../../utils/locationPointUtils';

interface LocationPointPopoverProps {
  point: LocationPointData | null;
  isOpen: boolean;
  onClose: () => void;
  targetElement: HTMLElement | null;
  /** Location tracking effective value from unified user settings */
  locationSettings?: TimeTracking_LocationTrackingType | null;
  /** Whether the SBSEG-QBO-geofence-flags feature flag is enabled */
  isGeofenceFlagsEnabled?: boolean;
}

const PopoverContentWrapper = styled.div`
  width: 280px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
`;

const InfoLabel = styled(B3)`
  flex-shrink: 0;
  white-space: nowrap;
`;

const InfoValue = styled(B3)`
  flex: 1;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledPopover = styled(Popover)`
  /* Hide close button (X) in header */
  button[aria-label='Close'] {
    display: none;
  }
`;

const LocationPointPopover: React.FC<LocationPointPopoverProps> = ({
  point,
  isOpen,
  onClose,
  targetElement,
  locationSettings,
  isGeofenceFlagsEnabled,
}) => {
  const intl = useIntl();
  const text = (id: string) => intl.formatMessage({ id });

  // Format location settings value to display text
  const getLocationSettingsDisplay = (
    value: TimeTracking_LocationTrackingType | null | undefined,
  ): string => {
    if (!value) return '';
    switch (value) {
      case TimeTracking_LocationTrackingType.Required:
        return text('timeEntryLocation.popover.locationSettings.required');
      case TimeTracking_LocationTrackingType.Optional:
        return text('timeEntryLocation.popover.locationSettings.optional');
      case TimeTracking_LocationTrackingType.Off:
        return text('timeEntryLocation.popover.locationSettings.off');
      default:
        return '';
    }
  };

  if (!point) return null;

  const flagLabels = isGeofenceFlagsEnabled
    ? getActiveDeviceFlagKeys(point.deviceAttributes).map((key) =>
        text(DEVICE_FLAG_LABEL_NLS_ID[key]),
      )
    : [];

  return (
    <StyledPopover
      dismissible
      enableClickAway
      open={isOpen}
      targetElement={targetElement}
      position="top"
      alignment="center"
      variant="popover"
      onClose={onClose}
      animationOn
    >
      <PopoverHeader title={point.teamMemberName || ''} alignment="left" />
      <PopoverContent alignment="left" overflow={false}>
        <PopoverContentWrapper>
          {/* Time detail  */}
          <InfoRow>
            <InfoLabel weight="medium">
              {text('timeEntryLocation.popover.time')}
            </InfoLabel>
            <InfoValue>{point.timestamp}</InfoValue>
          </InfoRow>

          {/* Location settings detail */}
          {locationSettings && (
            <InfoRow>
              <InfoLabel weight="medium">
                {text('timeEntryLocation.popover.locationSettings')}
              </InfoLabel>
              <InfoValue>
                {getLocationSettingsDisplay(locationSettings)}
              </InfoValue>
            </InfoRow>
          )}

          {/* Accuracy detail */}
          <InfoRow>
            <InfoLabel weight="medium">
              {text('timeEntryLocation.popover.accuracy')}
            </InfoLabel>
            <InfoValue>{point.accuracy ?? 'N/A'}</InfoValue>
          </InfoRow>

          {/* Flag detail - only shown behind the geofence flags feature flag */}
          {flagLabels.length > 0 && (
            <InfoRow>
              <InfoLabel weight="medium">
                {text('timeEntryLocation.popover.flag')}
              </InfoLabel>
              <Chip selectionLabels={flagLabels} dismissible={false} />
            </InfoRow>
          )}
        </PopoverContentWrapper>
      </PopoverContent>
    </StyledPopover>
  );
};

export default LocationPointPopover;

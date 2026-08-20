// @ts-nocheck
import React from 'react';
import { B1, B2, B4, Demi, Medium } from '@ids-ts/typography';
import { IconControl } from '@ids-ts/icon-control';
import { Edit, ThumbDown } from '@design-systems/icons';
import { IntlShape, useIntl, useTracking } from '@payroll/quicksand';
import { Skeleton } from '@cgds/skeleton';
import { LOCATION_CARD_VIEW_TRACKING_POINTS } from 'src/js/widgets/userSettings/utils/userSettingsTrackingPoints';
import {
  HeaderRow,
  Actions,
  FieldGroup,
} from 'src/js/widgets/userSettings/components/styles/cards.styles';
import {
  TimeTracking_LocationTrackingType,
  TimeTracking_UserLocationTrackingType,
} from 'src/__generated__/timeTracking/graphql';
import {
  useAppDispatch,
  useAppSelector,
} from 'src/js/widgets/userSettings/store';
import {
  setLocationMode,
  selectLocationSettings,
  selectLocationLoading,
  selectLocationError,
} from 'src/js/widgets/userSettings/store/slices/locationSlice';
import { SuccessToast } from 'src/js/widgets/common/SuccessToast';
import BreaksStateMessage from '../../BreaksCard/components/BreaksStateMessage';
import { FieldsGrid } from '../styles';
import { LocationCardMode } from '../types/LocationCard.types';

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <B4 style={{ color: '#6b7177' }}>
    <Demi>{children}</Demi>
  </B4>
);

interface LocationCardViewProps {
  showActions?: boolean;
  showSuccessToast?: boolean;
  onCloseSuccessToast?: () => void;
}

/**
 * Helper to format location tracking value for display
 */
const formatLocationTrackingValue = (
  intl: any,
  value: TimeTracking_LocationTrackingType | undefined,
): string => {
  switch (value) {
    case TimeTracking_LocationTrackingType.Required:
      return intl.formatMessage({ id: 'location.tracking.required' });
    case TimeTracking_LocationTrackingType.Optional:
      return intl.formatMessage({ id: 'location.tracking.optional' });
    case TimeTracking_LocationTrackingType.Off:
      return intl.formatMessage({ id: 'location.tracking.off' });
    default:
      return '-';
  }
};

/**
 * Helper to format user's location setting type (company vs custom)
 */
const formatLocationSettingType = (
  intl: any,
  value: TimeTracking_UserLocationTrackingType | undefined,
): string => {
  if (value === TimeTracking_UserLocationTrackingType.UseCompanySetting) {
    return intl.formatMessage({ id: 'location.company.settings.on' });
  }
  return intl.formatMessage({ id: 'location.company.settings.off' });
};

/**
 * LocationCardView Component
 *
 * Displays the location settings in VIEW mode.
 * Reads data from Redux store.
 */
const LocationCardView: React.FC<LocationCardViewProps> = ({
  showActions = true,
  showSuccessToast = false,
  onCloseSuccessToast,
}) => {
  const intl = useIntl();
  const track = useTracking();
  const dispatch = useAppDispatch();
  const settings = useAppSelector(selectLocationSettings);
  const loading = useAppSelector(selectLocationLoading);
  const error = useAppSelector(selectLocationError);

  const handleEditClick = () => {
    track(LOCATION_CARD_VIEW_TRACKING_POINTS.EDIT_LOCATION_CARD);
    dispatch(setLocationMode(LocationCardMode.EDIT));
  };

  const handleCloseSuccessToast = () => {
    onCloseSuccessToast?.();
  };

  const renderHeader = () => (
    <HeaderRow>
      <B1>
        <Medium>{intl.formatMessage({ id: 'location.title' })}</Medium>
      </B1>
      {showActions && (
        <Actions>
          <IconControl
            disabled={loading}
            onClick={handleEditClick}
            aria-label="edit-location"
          >
            <Edit />
          </IconControl>
        </Actions>
      )}
    </HeaderRow>
  );

  if (error) {
    return (
      <>
        {renderHeader()}
        <BreaksStateMessage
          icon={ThumbDown}
          messageId="breaks.card.error.state.message"
          testId="location-error-state"
        />
      </>
    );
  }

  return (
    <>
      {renderHeader()}
      <FieldsGrid>
        <FieldGroup>
          <Label>
            {intl.formatMessage({ id: 'location.company.settings' })}
          </Label>
          {loading ? (
            <Skeleton variant="rectangular" height={18} />
          ) : (
            <B2>
              <Medium>{formatLocationSettingType(intl, settings.value)}</Medium>
            </B2>
          )}
        </FieldGroup>

        <FieldGroup>
          <Label>{intl.formatMessage({ id: 'location.tracking.label' })}</Label>
          {loading ? (
            <Skeleton variant="rectangular" height={18} />
          ) : (
            <B2>
              <Medium>
                {formatLocationTrackingValue(intl, settings.effectiveValue)}
              </Medium>
            </B2>
          )}
        </FieldGroup>
      </FieldsGrid>

      {/* Success Toast */}
      <SuccessToast
        message={intl.formatMessage({ id: 'settings.saved.success' })}
        open={showSuccessToast}
        onClose={handleCloseSuccessToast}
      />
    </>
  );
};

export default LocationCardView;

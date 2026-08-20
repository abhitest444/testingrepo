import React, { useState } from 'react';
import styled from 'styled-components';
import { useIntl, useTracking, useSandbox } from '@payroll/quicksand';
import { Radio } from '@ids-ts/radio';
import Typography, { B2 } from '@ids-ts/typography';
import { Card, CardContent } from '@ids-ts/cards';
import { Checkbox } from '@ids-ts/checkbox';
import Link from '@ids-ts/link';
import Button from '@ids-ts/button';
import PageMessage from '@ids-ts/page-message';
import { TimeTracking_LocationTrackingType } from 'src/__generated__/timeTracking/graphql';
import { TIME_ENTRY_SETTINGS_TRACKING_POINTS } from 'src/js/widgets/timeTrackingSettings/timeEntrySettingsTrackingPoints';
import LocationSettingOptional from 'src/assets/images/LocationSettingOptional.svg';
import LocationSettingRequired from 'src/assets/images/LocationSettingRequired.svg';
import LocationSettingOff from 'src/assets/images/LocationSettingOff.svg';
import { LINKS } from 'src/js/widgets/timeTrackingSettings/constants';
import {
  GeofenceExpandedContent,
  GeofenceAssignmentsText,
  StyledGeofenceButton,
} from '../../styles';

interface IEditGeoLocationsContainerProps {
  setting: string;
  onSettingChange: (value: string) => void;
  showMileageTrackingSetting?: boolean;
  mileageTrackingEnabled?: boolean;
  onMileageTrackingChange?: (value: boolean) => void;
  showGeofenceSetting?: boolean;
  geofencingEnabled?: boolean;
  onGeofencingChange?: (value: boolean) => void;
  onSetupNotificationsClick?: () => void;
}

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
`;

const LocationTrackingSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

const SectionText = styled(Typography)`
  color: var(--color-text-primary, #393a3d);
`;

const CardsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;

  /* Tablet view - 2 columns */
  @media (max-width: 950px) {
    grid-template-columns: repeat(2, 1fr);
  }

  /* Mobile view - 1 column */
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const StyledCard = styled(Card)<{ $isSelected: boolean }>`
  && {
    border-radius: 12px;
    border: 2px solid
      ${({ $isSelected }) => ($isSelected ? '#0097e6' : '#babec5')};
    width: 100%;
    box-shadow: none;
  }
`;

const CardImage = styled.img`
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 12px 12px 0 0; /* Rounded top corners to match card border-radius */
`;

const CardLabel = styled(Typography)`
  color: #393a3d;
`;

const CardTextContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const RadioContainer = styled.div`
  display: flex;
  align-items: flex-start;
`;

const Divider = styled.div`
  height: 1px;
  background: #d4d7dc;
  width: 100%;
  margin: 4px 0;
`;

const MileageTrackingSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
`;

const MileageTrackingContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

const CheckboxWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  color: var(--color-text-primary, #393a3d);

  & label {
    margin-bottom: 0 !important;
  }
`;

const CheckboxDescription = styled(Typography)`
  margin-left: 32px;
  margin-top: 4px;
`;

const StyledB2 = styled(B2)`
  color: var(--color-text-primary, #393a3d);
`;

const GeofenceBannerWrapper = styled(PageMessage)`
  &&& {
    max-width: 50%;
  }
`;

export const EditGeoLocationsContainer: React.FC<
  IEditGeoLocationsContainerProps
> = ({
  setting,
  onSettingChange,
  showMileageTrackingSetting = false,
  mileageTrackingEnabled = false,
  onMileageTrackingChange,
  showGeofenceSetting = false,
  geofencingEnabled = false,
  onGeofencingChange,
  onSetupNotificationsClick,
}) => {
  const intl = useIntl();
  const track = useTracking();
  const sandbox = useSandbox();
  const [geofenceBannerOpen, setGeofenceBannerOpen] = useState(true);

  const showGeofenceLocationBanner =
    showGeofenceSetting &&
    geofenceBannerOpen &&
    setting !== TimeTracking_LocationTrackingType.Required;

  const handleCardClick = (value: string) => {
    // Track which card was clicked
    if (value === TimeTracking_LocationTrackingType.Required) {
      track(
        TIME_ENTRY_SETTINGS_TRACKING_POINTS.GEO_LOCATIONS_CARD_REQUIRED_CLICKED,
      );
    } else if (value === TimeTracking_LocationTrackingType.Optional) {
      track(
        TIME_ENTRY_SETTINGS_TRACKING_POINTS.GEO_LOCATIONS_CARD_OPTIONAL_CLICKED,
      );
    } else if (value === TimeTracking_LocationTrackingType.Off) {
      track(
        TIME_ENTRY_SETTINGS_TRACKING_POINTS.GEO_LOCATIONS_CARD_NEVER_CLICKED,
      );
    }

    onSettingChange(value);
  };

  const handleMileageTrackingChange = () => {
    // Determine ui_action based on the state of the mileage tracking toggle
    const ui_action = !mileageTrackingEnabled ? 'enabled' : 'disabled';

    // Track mileage tracking toggle interaction with dynamic ui_action
    track({
      ...TIME_ENTRY_SETTINGS_TRACKING_POINTS.MILEAGE_TRACKING_TOGGLE,
      ui_action,
    });

    // Notify parent component of the change
    onMileageTrackingChange?.(!mileageTrackingEnabled);
  };

  const getMileageSettingDescription = (setting: string) => {
    // If the location tracking setting is "Required" or "Optional", return the default description
    if (
      setting === TimeTracking_LocationTrackingType.Required ||
      setting === TimeTracking_LocationTrackingType.Optional
    ) {
      return intl.formatMessage({
        id: 'time-entries.section.title.geo-locations.mileage-tracking.default',
      });
    }

    // In this case, the location tracking setting is "Never", so return the never description
    return intl.formatMessage({
      id: 'time-entries.section.title.geo-locations.mileage-tracking.never',
    });
  };
  return (
    <ContentWrapper>
      {/* Location tracking section */}
      <LocationTrackingSection>
        <SectionText weight="demi" variant="body-1">
          {intl.formatMessage({
            id: 'time-entries.section.title.geo-locations.location-tracking',
          })}
        </SectionText>
        <SectionText variant="body-3">
          {intl.formatMessage({
            id: 'time-entries.section.title.geo-locations.preference-subtitle',
          })}
        </SectionText>
      </LocationTrackingSection>

      <CardsContainer>
        {/* Required location tracking card */}
        <LocationSettingCard
          value={TimeTracking_LocationTrackingType.Required}
          isSelected={setting === TimeTracking_LocationTrackingType.Required}
          image={LocationSettingRequired}
          label={intl.formatMessage({
            id: 'time-entries.section.title.geo-locations.value.required',
          })}
          description={intl.formatMessage({
            id: 'time-entries.section.title.geo-locations.location-tracking.required',
          })}
          onClick={handleCardClick}
        />

        {/* Optional location tracking card */}
        <LocationSettingCard
          value={TimeTracking_LocationTrackingType.Optional}
          isSelected={setting === TimeTracking_LocationTrackingType.Optional}
          image={LocationSettingOptional}
          label={intl.formatMessage({
            id: 'time-entries.section.title.geo-locations.value.optional',
          })}
          description={intl.formatMessage({
            id: 'time-entries.section.title.geo-locations.location-tracking.optional',
          })}
          onClick={handleCardClick}
        />

        {/* Off location tracking card */}
        <LocationSettingCard
          value={TimeTracking_LocationTrackingType.Off}
          isSelected={setting === TimeTracking_LocationTrackingType.Off}
          image={LocationSettingOff}
          label={intl.formatMessage({
            id: 'time-entries.section.title.geo-locations.value.off',
          })}
          description={intl.formatMessage({
            id: 'time-entries.section.title.geo-locations.location-tracking.off',
          })}
          onClick={handleCardClick}
        />
      </CardsContainer>

      {/* Divider */}
      {showMileageTrackingSetting && <Divider />}

      {/* Mileage tracking section - shown for all location tracking options */}
      {showMileageTrackingSetting && (
        <MileageTrackingSection>
          <MileageTrackingContent>
            <SectionText weight="demi" variant="body-1">
              {intl.formatMessage({
                id: 'time-entries.section.title.geo-locations.mileage-tracking.heading',
              })}
            </SectionText>
            <SectionText variant="body-3">
              {intl.formatMessage({
                id: 'time-entries.section.title.geo-locations.mileage-tracking.subtitle',
              })}
            </SectionText>
          </MileageTrackingContent>
          <CheckboxWrapper>
            <Checkbox
              checked={mileageTrackingEnabled}
              onChange={handleMileageTrackingChange}
              data-testid="mileage-tracking-checkbox"
            >
              <StyledB2>
                {intl.formatMessage({
                  id: 'time-entries.section.title.geo-locations.mileage-tracking.turn-on',
                })}
              </StyledB2>
            </Checkbox>
            <CheckboxDescription variant="body-3">
              {getMileageSettingDescription(setting)}{' '}
              <Link
                href={LINKS.MILEAGE_TRACKING_HELP_URL}
                target="_blank"
                data-testid="mileage-tracking-learn-more"
              >
                <Typography variant="body-3" as="span">
                  {intl.formatMessage({
                    id: 'time-entries.section.title.geo-locations.mileage-tracking.learn-more',
                  })}
                </Typography>
              </Link>
            </CheckboxDescription>
          </CheckboxWrapper>
        </MileageTrackingSection>
      )}

      {/* Divider before geofence section */}
      {showGeofenceSetting && <Divider />}

      {showGeofenceLocationBanner && (
        <GeofenceBannerWrapper
          type="info"
          open
          dismissible
          automationId="geofence-location-tracking-banner"
          onClose={() => setGeofenceBannerOpen(false)}
        >
          <>
            <Typography variant="body-3" weight="demi">
              {intl.formatMessage(
                {
                  id: 'time-entries.section.title.geo-locations.geofencing.banner.title',
                },
                {
                  value:
                    setting === TimeTracking_LocationTrackingType.Optional
                      ? intl.formatMessage({
                          id: 'time-entries.section.title.geo-locations.value.optional',
                        })
                      : intl.formatMessage({
                          id: 'time-entries.section.title.geo-locations.value.off',
                        }),
                },
              )}
            </Typography>
            <Typography variant="body-3" as="p">
              {intl.formatMessage({
                id: 'time-entries.section.title.geo-locations.geofencing.banner.body',
              })}
            </Typography>
          </>
        </GeofenceBannerWrapper>
      )}

      {/* Geofence section */}
      {showGeofenceSetting && (
        <MileageTrackingSection>
          <MileageTrackingContent>
            <SectionText weight="demi" variant="body-1">
              {intl.formatMessage({
                id: 'time-entries.section.title.geo-locations.geofencing',
              })}
            </SectionText>
            <SectionText variant="body-3">
              {intl.formatMessage({
                id: 'time-entries.section.title.geo-locations.geofencing.subtitle',
              })}
            </SectionText>
          </MileageTrackingContent>
          <CheckboxWrapper>
            <Checkbox
              checked={geofencingEnabled}
              onChange={(e) => {
                const newValue = !!e?.target?.checked;
                track({
                  ...TIME_ENTRY_SETTINGS_TRACKING_POINTS.GEOFENCE_CHECKBOX,
                  ui_action: newValue ? 'enabled' : 'disabled',
                });
                onGeofencingChange?.(newValue);
              }}
              data-testid="geofencing-checkbox"
            >
              <StyledB2>
                {intl.formatMessage({
                  id: 'time-entries.section.title.geo-locations.geofencing.turn-on',
                })}
              </StyledB2>
            </Checkbox>
            {/* Show expanded content when geofencing is enabled */}
            {geofencingEnabled && (
              <GeofenceExpandedContent>
                <GeofenceAssignmentsText variant="body-3">
                  {intl.formatMessage({
                    id: 'time-entries.section.title.geo-locations.geofencing.assignments-text',
                  })}{' '}
                  <Link
                    href={LINKS.ASSIGNMENTS_URL}
                    data-testid="geofencing-go-to-assignments"
                    onClick={(e) => {
                      e.preventDefault();
                      track(
                        TIME_ENTRY_SETTINGS_TRACKING_POINTS.GEOFENCE_GO_TO_ASSIGNMENTS,
                      );
                      sandbox.navigation.navigate(LINKS.ASSIGNMENTS_URL);
                    }}
                    role="button"
                  >
                    <Typography variant="body-3" as="span">
                      {intl.formatMessage({
                        id: 'time-entries.section.title.geo-locations.geofencing.go-to-assignments',
                      })}
                    </Typography>
                  </Link>
                </GeofenceAssignmentsText>
                <StyledGeofenceButton
                  priority="secondary"
                  size="small"
                  data-testid="setup-geofence-notifications-button"
                  onClick={() => {
                    track(
                      TIME_ENTRY_SETTINGS_TRACKING_POINTS.GEOFENCE_SET_UP_NOTIFICATIONS,
                    );
                    onSetupNotificationsClick?.();
                  }}
                >
                  {intl.formatMessage({
                    id: 'time-entries.section.title.geo-locations.geofencing.setup-notifications',
                  })}
                </StyledGeofenceButton>
              </GeofenceExpandedContent>
            )}
          </CheckboxWrapper>
        </MileageTrackingSection>
      )}
    </ContentWrapper>
  );
};

interface LocationSettingCardProps {
  value: string;
  isSelected: boolean;
  image: any;
  label: string;
  description: string;
  onClick: (value: string) => void;
}

const LocationSettingCard: React.FC<LocationSettingCardProps> = ({
  value,
  isSelected,
  image,
  label,
  description,
  onClick,
}) => (
  <StyledCard
    size="standard"
    $isSelected={isSelected}
    onClick={() => onClick(value)}
    disableCardClick={false}
  >
    <CardImage src={image} alt={`${value} option`} />
    <CardContent>
      <RadioContainer>
        <Radio
          checked={isSelected}
          onChange={() => onClick(value)}
          value={value}
          aria-label={label}
        />
        <CardTextContent>
          <CardLabel weight="demi" variant="body-2">
            {label}
          </CardLabel>
          <Typography variant="body-3">{description}</Typography>
        </CardTextContent>
      </RadioContainer>
    </CardContent>
  </StyledCard>
);
